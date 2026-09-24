#!/usr/bin/env python3
"""Normalise a whole Mars arcade clip into contract cells with ONE alignment decision.

Usage:
    python3 tools/assets/normalise-arcade-clip.py <out-dir> <src.png> [src.png ...]
        --clip NAME --source-px-per-cell-px SCALE
        [--align feet|bbox|torso|planted-foot|preserve-canvas] [--torso-reference CELL]
        [--source-alpha] [--chroma #FF00FF] [--resample bilinear|lanczos] [--contract JSON]

`normalise-popt-frame.py` places each drawing on its own: feet on the pivot, or the torso
against a reference. Per-drawing placement is what makes a body pop between drawings — every
frame is recentred on whatever its own lowest foot happens to be. This tool takes the frames
of one clip together and aligns them by one rule:

  feet            per drawing, foot-span midpoint on the pivot (the old default; stances)
  bbox            per drawing, bounding-box centre on the pivot (airborne, knocked down)
  torso           per drawing, torso back line held to --torso-reference (in-place walks)
  planted-foot    the stance foot (--planted rear|front) is held on the pivot on every
                  drawing, so a step or a lunge moves the free foot, never the body
  preserve-canvas frames from ONE video clip with a fixed camera: nothing is recentred per
                  frame. One crop, one scale and one offset for the whole clip, chosen so the
                  first frame's feet sit on the pivot; every later frame keeps that offset.

Scale is never re-fitted: pass the fighter's locked --source-px-per-cell-px. The tool writes
<out-dir>/<clip>/<clip>-NN.png and <out-dir>/<clip>/normalise-report.json recording the mode,
the scale and every frame's offset, so a later audit can say exactly what moved.

Exit 0 on success, 1 on a usage error, 3 if any frame was clipped by the cell.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

try:
    from PIL import Image
except ImportError:  # pragma: no cover - environment guard
    print("error: Pillow is required (pip install Pillow)", file=sys.stderr)
    raise SystemExit(1)

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONTRACT = REPO_ROOT / "asset-reports" / "mars-arcade-sprite-contract.json"

KEY_BACKGROUND = 60   # key-ness above this is background
KEY_SPILL = 15        # key-ness above this is a contaminated edge pixel
FOOT_ROWS = 2         # the lowest rows of the figure are "the feet"
FOOT_GAP = 3          # a gap wider than this splits the foot span into two feet


def parse_chroma(text: str) -> tuple[int, int, int]:
    text = text.lstrip("#")
    if len(text) != 6:
        raise ValueError(f"chroma must be six hex digits, got {text}")
    return int(text[0:2], 16), int(text[2:4], 16), int(text[4:6], 16)


def keyness(rgb: np.ndarray, chroma: tuple[int, int, int]) -> np.ndarray:
    """How much a pixel leans toward the key colour: its dominant channels minus its suppressed one.

    For magenta this is min(R, B) - G, the Pop T key; for green it is G - max(R, B); for cyan
    min(G, B) - R. Saturated foreground colours score at most a few points; the flat key
    scores ~255.
    """
    dominant = [i for i, v in enumerate(chroma) if v >= 128]
    suppressed = [i for i, v in enumerate(chroma) if v < 128]
    if not dominant or not suppressed:
        raise ValueError("chroma must be a saturated colour such as #FF00FF or #00FF00")
    dom = np.min(np.stack([rgb[:, :, i] for i in dominant], axis=2), axis=2)
    sup = np.max(np.stack([rgb[:, :, i] for i in suppressed], axis=2), axis=2)
    return dom - sup


def despill(sub: np.ndarray, figure: np.ndarray, clean: np.ndarray) -> int:
    """Rebuild key-contaminated edge pixels from the nearest uncontaminated figure colour."""
    h, w, _ = sub.shape
    ys, xs = np.where(figure & ~clean)
    for y, x in zip(ys, xs):
        for r in (1, 2, 3):
            win = sub[max(0, y - r):min(h, y + r + 1), max(0, x - r):min(w, x + r + 1)]
            msk = clean[max(0, y - r):min(h, y + r + 1), max(0, x - r):min(w, x + r + 1)]
            if msk.any():
                sub[y, x] = win[msk].mean(axis=0)
                break
    return len(ys)


def despill_clamp(rgb: np.ndarray, figure: np.ndarray, chroma: tuple[int, int, int]) -> int:
    """Clamp the key colour's dominant channels on figure pixels the neighbour rebuild missed.

    Video codecs ring the key colour several pixels into the figure, wider than the
    edge band `despill` rebuilds. Spriterrific's answer, ported: on any figure pixel
    still leaning toward the key, pull the key's dominant channels down to the
    suppressed one plus the spill ceiling. For magenta that is r, b <= g + 15. It
    changes only pixels that were key-tinted, and never geometry or alpha.
    """
    dominant = [i for i, v in enumerate(chroma) if v >= 128]
    suppressed = [i for i, v in enumerate(chroma) if v < 128]
    key = keyness(rgb, chroma)
    tinted = figure & (key > KEY_SPILL)
    if not tinted.any():
        return 0
    sup = np.max(np.stack([rgb[:, :, i] for i in suppressed], axis=2), axis=2)
    for i in dominant:
        channel = rgb[:, :, i]
        channel[tinted] = np.minimum(channel[tinted], sup[tinted] + KEY_SPILL)
    return int(tinted.sum())


def load_source(path: Path, source_alpha: bool, chroma: tuple[int, int, int]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """RGB float, figure mask, and clean (uncontaminated) mask for a whole source canvas."""
    source = Image.open(path).convert("RGBA")
    rgb = np.asarray(source.convert("RGB")).astype(np.float64)
    alpha = np.asarray(source)[:, :, 3].astype(np.float64) / 255.0
    key = keyness(rgb, chroma)
    if source_alpha:
        figure = alpha > 8 / 255
        clean = figure
    else:
        figure = key <= KEY_BACKGROUND
        clean = figure & (key <= KEY_SPILL)
        alpha = figure.astype(np.float64)
    return rgb, alpha * figure, clean


def downsample(rgb: np.ndarray, alpha: np.ndarray, scale: float, resample: str) -> np.ndarray:
    """Alpha-weighted downsample of a crop to 1/scale, returned as RGBA uint8."""
    src_h, src_w = alpha.shape
    new_h = max(1, round(src_h / scale))
    new_w = max(1, round(src_w / scale))
    filt = Image.Resampling.BILINEAR if resample == "bilinear" else Image.Resampling.LANCZOS
    amask = np.asarray(Image.fromarray(alpha.astype(np.float32)).resize((new_w, new_h), filt))
    premul = np.stack([
        np.asarray(Image.fromarray((rgb[:, :, c] * alpha).astype(np.float32)).resize((new_w, new_h), filt))
        for c in range(3)
    ], axis=2)
    flat = np.rint(np.divide(premul, np.maximum(amask, 1e-6)[:, :, None]).clip(0, 255))
    return np.dstack([flat, np.clip(amask, 0, 1) * 255]).astype(np.uint8)


def back_line(mask: np.ndarray) -> float:
    rows = np.where(mask.any(axis=1))[0]
    top, height = rows.min(), rows.max() - rows.min() + 1
    band = range(top + int(height * 0.30), max(top + int(height * 0.30) + 1, top + int(height * 0.50)))
    return float(np.median([np.where(mask[r])[0].min() for r in band if mask[r].any()]))


def feet_clusters(mask: np.ndarray) -> list[tuple[int, int]]:
    """Column spans of each foot on the lowest rows, rear to front."""
    ys, xs = np.where(mask)
    lowest = ys.max()
    cols = np.unique(xs[ys >= lowest - (FOOT_ROWS - 1)])
    spans: list[tuple[int, int]] = []
    start = prev = int(cols[0])
    for c in cols[1:]:
        if c - prev > FOOT_GAP:
            spans.append((start, prev))
            start = int(c)
        prev = int(c)
    spans.append((start, prev))
    return spans


def anchor_for(mode: str, mask: np.ndarray, planted: str) -> tuple[int, int, float | None]:
    """Where the drawing's anchor point is, in sprite pixels: (x, y, planted-foot x or None)."""
    ys, xs = np.where(mask)
    if mode == "bbox":
        return int(round((xs.min() + xs.max()) / 2)), int(ys.max()), None
    spans = feet_clusters(mask)
    if mode == "planted-foot":
        span = spans[0] if planted == "rear" else spans[-1]
        mid = (span[0] + span[1]) / 2
        return int(round(mid)), int(ys.max()), mid
    foot = xs[ys >= ys.max() - (FOOT_ROWS - 1)]
    return int(round((foot.min() + foot.max()) / 2)), int(ys.max()), None


def place(sprite: np.ndarray, anchor_x: int, anchor_y: int, cell: tuple[int, int], pivot_x: int, baseline: int) -> tuple[np.ndarray, int]:
    cell_w, cell_h = cell
    out = np.zeros((cell_h, cell_w, 4), np.uint8)
    # Alpha 8 and below is not figure, to the gate or to normalise-popt-frame.py; dropping
    # it here keeps this tool's cells identical to the shipped ones for the same inputs.
    op = sprite[:, :, 3] > 8
    ys, xs = np.where(op)
    ty, tx = ys + (baseline - anchor_y), xs + (pivot_x - anchor_x)
    keep = (ty >= 0) & (ty < cell_h) & (tx >= 0) & (tx < cell_w)
    out[ty[keep], tx[keep]] = sprite[ys[keep], xs[keep]]
    return out, int((~keep).sum())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out_dir", type=Path)
    ap.add_argument("sources", type=Path, nargs="+")
    ap.add_argument("--clip", required=True, help="clip name; files become <clip>/<clip>-NN.png")
    ap.add_argument("--contract", type=Path, default=DEFAULT_CONTRACT)
    ap.add_argument("--source-px-per-cell-px", type=float, required=True)
    ap.add_argument("--align", choices=("feet", "bbox", "torso", "planted-foot", "preserve-canvas"), default="feet")
    ap.add_argument("--torso-reference", type=Path)
    ap.add_argument("--planted", choices=("rear", "front"), default="rear", help="which foot is planted on the first drawing")
    ap.add_argument("--source-alpha", action="store_true", help="use the sources' own transparency instead of the chroma key")
    ap.add_argument("--chroma", default="#FF00FF", help="key colour when the sources are on a flat field")
    ap.add_argument("--resample", choices=("bilinear", "lanczos"), default="bilinear")
    args = ap.parse_args()

    if args.align == "torso" and args.torso_reference is None:
        ap.error("--align torso needs --torso-reference")
    contract = json.loads(args.contract.read_text())
    cell = tuple(contract["cell"]["canonical"])
    baseline = contract["cell"]["baseline"]
    pivot_x = contract["cell"]["pivot"]["x"]
    chroma = parse_chroma(args.chroma)
    scale = args.source_px_per_cell_px

    loaded = [load_source(p, args.source_alpha, chroma) for p in args.sources]
    for p, (_, alpha, _) in zip(args.sources, loaded):
        if not (alpha > 0).any():
            print(f"error: no figure found in {p}", file=sys.stderr)
            return 1

    torso_target = None
    if args.align == "torso":
        ref = np.asarray(Image.open(args.torso_reference).convert("RGBA"))[:, :, 3] > 8
        torso_target = back_line(ref)

    report = {"clip": args.clip, "align": args.align, "sourcePxPerCellPx": scale, "chroma": args.chroma if not args.source_alpha else None,
              "resample": args.resample, "frames": []}
    clipped_total = 0
    out_dir = args.out_dir / args.clip
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.align == "preserve-canvas":
        sizes = {a.shape for _, a, _ in loaded}
        if len(sizes) != 1:
            print(f"error: preserve-canvas needs sources of one size, got {sorted(sizes)}", file=sys.stderr)
            return 1
        union = np.zeros(loaded[0][1].shape, bool)
        for _, alpha, _ in loaded:
            union |= alpha > 0
        ys, xs = np.where(union)
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        sprites = []
        for rgb, alpha, clean in loaded:
            sub = rgb[y0:y1 + 1, x0:x1 + 1].copy()
            fig = alpha[y0:y1 + 1, x0:x1 + 1] > 0
            spilled = 0 if args.source_alpha else despill(sub, fig, clean[y0:y1 + 1, x0:x1 + 1]) + despill_clamp(sub, fig, chroma)
            sprites.append((downsample(sub, alpha[y0:y1 + 1, x0:x1 + 1], scale, args.resample), spilled))
        first = sprites[0][0][:, :, 3] > 8
        anchor_x, anchor_y, _ = anchor_for("feet", first, args.planted)
        for i, (sprite, spilled) in enumerate(sprites):
            out, clipped = place(sprite, anchor_x, anchor_y, cell, pivot_x, baseline)
            clipped_total += clipped
            dest = out_dir / f"{args.clip}-{i:02d}.png"
            Image.fromarray(out, "RGBA").save(dest)
            report["frames"].append({"source": str(args.sources[i]), "out": str(dest), "anchor": [anchor_x, anchor_y],
                                     "offset": [pivot_x - anchor_x, baseline - anchor_y], "despilled": spilled, "clipped": clipped})
            print(f"{dest.name}: shared offset {pivot_x - anchor_x:+d},{baseline - anchor_y:+d}" + (f"; WARNING {clipped} px clipped" if clipped else ""))
    else:
        for i, (rgb, alpha, clean) in enumerate(loaded):
            fig_full = alpha > 0
            ys, xs = np.where(fig_full)
            y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
            sub = rgb[y0:y1 + 1, x0:x1 + 1].copy()
            fig = fig_full[y0:y1 + 1, x0:x1 + 1]
            spilled = 0 if args.source_alpha else despill(sub, fig, clean[y0:y1 + 1, x0:x1 + 1]) + despill_clamp(sub, fig, chroma)
            sprite = downsample(sub, alpha[y0:y1 + 1, x0:x1 + 1], scale, args.resample)
            mask = sprite[:, :, 3] > 8
            if args.align == "torso":
                anchor_x = int(round(back_line(mask) + pivot_x - torso_target))
                anchor_y = int(np.where(mask)[0].max())
                planted_x = None
            else:
                anchor_x, anchor_y, planted_x = anchor_for(args.align, mask, args.planted)
            out, clipped = place(sprite, anchor_x, anchor_y, cell, pivot_x, baseline)
            clipped_total += clipped
            dest = out_dir / f"{args.clip}-{i:02d}.png"
            Image.fromarray(out, "RGBA").save(dest)
            frame_report = {"source": str(args.sources[i]), "out": str(dest), "anchor": [anchor_x, anchor_y],
                            "offset": [pivot_x - anchor_x, baseline - anchor_y], "despilled": spilled, "clipped": clipped}
            if planted_x is not None:
                frame_report["plantedFootX"] = planted_x
            report["frames"].append(frame_report)
            print(f"{dest.name}: offset {pivot_x - anchor_x:+d},{baseline - anchor_y:+d}"
                  + (f", planted foot at source column {planted_x:.0f}" if planted_x is not None else "")
                  + (f"; WARNING {clipped} px clipped" if clipped else ""))

    report["clippedPixels"] = clipped_total
    (out_dir / "normalise-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(report['frames'])} cells to {out_dir} ({args.align}, 1/{scale:.4f})")
    return 3 if clipped_total else 0


if __name__ == "__main__":
    raise SystemExit(main())
