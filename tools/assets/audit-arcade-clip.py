#!/usr/bin/env python3
"""Audit a Mars arcade clip as a SEQUENCE, not one drawing at a time.

Usage:
    python3 tools/assets/audit-arcade-clip.py <fighter:animation> [more clips...] [--out DIR]
    python3 tools/assets/audit-arcade-clip.py --all [--out DIR]

The per-drawing gate (check-popt-frames-fullcolour.py) proves each cell obeys the contract on
its own. It cannot see the defects that live BETWEEN drawings: a body that pops sideways when
the planted foot changes, a pose that came back 15% oversized from an edit correction, feet
that drift off the baseline across a cycle. This tool reads the animation table, loads each
clip's cells in playback order and measures them against each other:

  bottom      lowest opaque row per drawing; grounded clips must keep it on the baseline
  height      figure height; a looping clip (walk, idle) may not change height between drawings
  torso       the torso back line (as --align torso places it); a looping clip must hold it
  head        longest opaque run in the top 15% of the figure, reported beside the anchor's
              for the reviewer; not judged, because at cell resolution it is not a ruler
  pop         for each neighbouring pair, the whole-pixel shift that best aligns the upper
              bodies and the silhouette IoU at that shift; a looping clip may not need to shift

It writes a contact sheet, a GIF at the table's holds and a review.md per clip, so every
normalisation boundary leaves before/after evidence. Exit 0 when every clip passes, 3 when
any fails, 1 on a usage error.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover - environment guard
    print("error: Pillow is required (pip install Pillow)", file=sys.stderr)
    raise SystemExit(1)

REPO_ROOT = Path(__file__).resolve().parents[2]
TABLE = REPO_ROOT / "src" / "game" / "marsArcadeAnimations.json"
DEFAULT_OUT = REPO_ROOT / "preview-renders" / "mars-arcade" / "clips"

ALPHA_ON = 8
BASELINE = 119
MAX_BOTTOM_DRIFT_PX = 1      # grounded drawings sit on the baseline, give or take a row
MAX_LOOP_HEIGHT_DRIFT = 0.04  # a cycle that changes height between drawings is breathing wrong
MAX_LOOP_TORSO_DRIFT_PX = 2   # the body of an in-place cycle holds still
MAX_LOOP_POP_PX = 2           # neighbouring drawings of a cycle need no shift to line up
AIRBORNE_CLIPS = {"jump", "knockout", "victory"}   # feet leave the baseline by design
UPPER_SHARE = 0.4
POP_SEARCH = 4


def figure_mask(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGBA"))[:, :, 3] > ALPHA_ON


def longest_run(row: np.ndarray) -> int:
    best = run = 0
    for on in row:
        run = run + 1 if on else 0
        best = max(best, run)
    return int(best)


def measure(mask: np.ndarray) -> dict:
    ys, xs = np.where(mask)
    top, bottom = int(ys.min()), int(ys.max())
    height = bottom - top + 1
    band = range(top + int(height * 0.30), max(top + int(height * 0.30) + 1, top + int(height * 0.50)))
    back = float(np.median([np.where(mask[r])[0].min() for r in band if mask[r].any()]))
    # The head: the longest contiguous opaque run in the top 15% of the figure. A run,
    # not a count, so a fist raised beside the face or a hand above it does not widen
    # the measure unless it touches the head.
    head_rows = range(top, top + max(1, int(height * 0.15)))
    head = max(longest_run(mask[r]) for r in head_rows)
    return {
        "top": top, "bottom": bottom, "height": height,
        "left": int(xs.min()), "right": int(xs.max()), "width": int(xs.max() - xs.min() + 1),
        "torsoBack": back, "headWidth": head,
    }


def best_shift(a: np.ndarray, b: np.ndarray, share: float = UPPER_SHARE) -> tuple[int, int, float]:
    """The whole-pixel shift of `b` that best overlaps the upper bodies, and the IoU there."""
    rows = np.where(a.any(axis=1) | b.any(axis=1))[0]
    top, bottom = rows.min(), rows.max()
    cut = top + max(1, int((bottom - top + 1) * share))
    ua, ub = a[:cut], b[:cut]
    best = (0, 0, -1.0)
    h, w = ua.shape
    for dy in range(-POP_SEARCH, POP_SEARCH + 1):
        for dx in range(-POP_SEARCH, POP_SEARCH + 1):
            shifted = np.zeros_like(ub)
            ys, xs = np.where(ub)
            ty, tx = ys + dy, xs + dx
            keep = (ty >= 0) & (ty < h) & (tx >= 0) & (tx < w)
            shifted[ty[keep], tx[keep]] = True
            inter = (ua & shifted).sum()
            union = (ua | shifted).sum()
            iou = inter / union if union else 0.0
            if iou > best[2] or (iou == best[2] and abs(dx) + abs(dy) < abs(best[0]) + abs(best[1])):
                best = (dx, dy, float(iou))
    return best


def audit(entry: dict, anchor_head: int | None) -> tuple[list[str], list[str], list[dict]]:
    fails: list[str] = []
    warns: list[str] = []
    rows: list[dict] = []
    masks = []
    for frame in entry["frames"]:
        path = REPO_ROOT / frame["src"].lstrip("/")
        if not path.is_file():
            fails.append(f"{frame['pose']}: {frame['src']} is missing")
            continue
        mask = figure_mask(path)
        if not mask.any():
            fails.append(f"{frame['pose']}: empty drawing")
            continue
        masks.append(mask)
        m = measure(mask)
        m["pose"] = frame["pose"]
        m["hold"] = frame["hold"]
        rows.append(m)
    if not rows:
        return fails or ["no drawings"], warns, rows

    loop = entry["loop"] == "loop"
    grounded = entry["animation"] not in AIRBORNE_CLIPS
    if grounded:
        for m in rows:
            if abs(m["bottom"] - BASELINE) > MAX_BOTTOM_DRIFT_PX:
                fails.append(f"{m['pose']}: lowest row {m['bottom']} is off the baseline {BASELINE}")
    heights = [m["height"] for m in rows]
    median_h = float(np.median(heights))
    drift = (max(heights) - min(heights)) / median_h if median_h else 0.0
    if loop and drift > MAX_LOOP_HEIGHT_DRIFT:
        fails.append(f"height drifts {100 * drift:.1f}% across the cycle ({min(heights)}..{max(heights)} rows), ceiling {100 * MAX_LOOP_HEIGHT_DRIFT:.0f}%")
    backs = [m["torsoBack"] for m in rows]
    torso_drift = max(abs(b - float(np.median(backs))) for b in backs)
    if loop and torso_drift > MAX_LOOP_TORSO_DRIFT_PX:
        fails.append(f"torso back line wanders {torso_drift:.1f} px across the cycle, ceiling {MAX_LOOP_TORSO_DRIFT_PX}")
    if anchor_head:
        # Reported, never judged: at cell resolution a fist beside the face or a raised
        # arm across the top rows moves this by more than a real scale error would, and a
        # scale finding must never rest on one ruler. Scale is measured on the SOURCE at
        # the locked scale (head width in source pixels), before normalisation.
        for m in rows:
            m["headDrift"] = abs(m["headWidth"] - anchor_head) / anchor_head
    for i in range(1, len(masks)):
        dx, dy, iou = best_shift(masks[i - 1], masks[i])
        rows[i]["popX"], rows[i]["popY"], rows[i]["iou"] = dx, dy, iou
        if loop and (abs(dx) > MAX_LOOP_POP_PX or abs(dy) > MAX_LOOP_POP_PX):
            fails.append(f"{rows[i - 1]['pose']} -> {rows[i]['pose']}: upper body pops {dx:+d},{dy:+d} px (ceiling {MAX_LOOP_POP_PX})")
    if loop and len(masks) > 1:
        dx, dy, iou = best_shift(masks[-1], masks[0])
        rows[0]["popX"], rows[0]["popY"], rows[0]["iou"] = dx, dy, iou
        if abs(dx) > MAX_LOOP_POP_PX or abs(dy) > MAX_LOOP_POP_PX:
            fails.append(f"{rows[-1]['pose']} -> {rows[0]['pose']} (wrap): upper body pops {dx:+d},{dy:+d} px")
    return fails, warns, rows


def write_review(entry: dict, rows: list[dict], fails: list[str], warns: list[str], out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    cells = [Image.open(REPO_ROOT / f["src"].lstrip("/")).convert("RGBA") for f in entry["frames"]
             if (REPO_ROOT / f["src"].lstrip("/")).is_file()]
    if cells:
        scale = 2
        sheet = Image.new("RGBA", (len(cells) * 128 * scale, 128 * scale + 14), (40, 40, 48, 255))
        draw = ImageDraw.Draw(sheet)
        for i, cell in enumerate(cells):
            big = cell.resize((128 * scale, 128 * scale), Image.Resampling.NEAREST)
            sheet.alpha_composite(big, (i * 128 * scale, 14))
            draw.line([(i * 128 * scale, 14 + BASELINE * scale), ((i + 1) * 128 * scale, 14 + BASELINE * scale)], fill=(120, 90, 170, 255))
            draw.text((i * 128 * scale + 2, 1), f"{i + 1} {entry['frames'][i]['pose']} {entry['frames'][i]['hold']}f", fill=(230, 230, 240, 255))
        sheet.save(out / "contact-sheet.png")
        # A GIF at the table's holds, 60 Hz frames as centiseconds (GIF's own unit).
        flat = []
        durations = []
        for cell, frame in zip(cells, entry["frames"]):
            bg = Image.new("RGBA", cell.size, (60, 60, 70, 255))
            bg.alpha_composite(cell)
            flat.append(bg.convert("P", palette=Image.Palette.ADAPTIVE, colors=128))
            durations.append(max(20, round(frame["hold"] * 1000 / 60)))
        flat[0].save(out / "preview.gif", save_all=True, append_images=flat[1:], duration=durations, loop=0, disposal=2)
    lines = [f"# {entry['fighter']}:{entry['animation']} — clip audit", "",
             f"loop `{entry['loop']}`, {len(entry['frames'])} drawings, {sum(f['hold'] for f in entry['frames'])} engine frames.", "",
             "| # | pose | hold | top | bottom | height | torso back | head | pop dx,dy | IoU |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for i, m in enumerate(rows):
        pop = f"{m['popX']:+d},{m['popY']:+d}" if "popX" in m else "-"
        iou = f"{m['iou']:.2f}" if "iou" in m else "-"
        lines.append(f"| {i + 1} | {m['pose']} | {m['hold']} | {m['top']} | {m['bottom']} | {m['height']} | {m['torsoBack']:.1f} | {m['headWidth']} | {pop} | {iou} |")
    lines += ["", "## Result", ""]
    lines += [f"- FAIL {f}" for f in fails] or ["- pass"]
    lines += [f"- warn {w}" for w in warns]
    lines += ["", "![contact sheet](contact-sheet.png)", "", "![preview](preview.gif)", ""]
    (out / "review.md").write_text("\n".join(lines), encoding="utf-8")
    (out / "measurements.json").write_text(json.dumps({"fails": fails, "warnings": warns, "frames": rows}, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clips", nargs="*", help="fighter:animation keys from the table")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--table", type=Path, default=TABLE)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help="review assets root; one folder per clip")
    ap.add_argument("--no-assets", action="store_true", help="measure only; write nothing")
    args = ap.parse_args()
    table = json.loads(args.table.read_text())
    by_key = {f"{e['fighter']}:{e['animation']}": e for e in table["animations"]}
    keys = list(by_key) if args.all else args.clips
    if not keys:
        ap.error("name at least one fighter:animation, or pass --all")
    unknown = [k for k in keys if k not in by_key]
    if unknown:
        print(f"error: not in the table: {', '.join(unknown)}", file=sys.stderr)
        return 1

    failures = 0
    for key in keys:
        entry = by_key[key]
        anchor = by_key.get(f"{entry['fighter']}:idle")
        anchor_head = None
        if anchor:
            path = REPO_ROOT / anchor["frames"][0]["src"].lstrip("/")
            if path.is_file():
                anchor_head = measure(figure_mask(path))["headWidth"]
        fails, warns, rows = audit(entry, anchor_head)
        if not args.no_assets:
            write_review(entry, rows, fails, warns, args.out / key.replace(":", "-"))
        state = "FAIL" if fails else "pass"
        print(f"{state} {key}  {len(rows)} drawings, {sum(f['hold'] for f in entry['frames'])} frames, {entry['loop']}")
        for f in fails:
            print(f"       {f}")
        for w in warns:
            print(f"       warn: {w}")
        failures += bool(fails)
    print(f"\naudited {len(keys)} clips; {failures} failing")
    return 3 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
