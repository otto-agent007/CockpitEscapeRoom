#!/usr/bin/env python3
"""Pick the drawings of a Mars arcade clip out of a generated video.

Usage:
    python3 tools/assets/pick-arcade-frames.py <video.mp4|frames-dir> <out-dir>
        --frames N [--policy cycle|action|hold] [--start-fraction F] [--span-factor S]
        [--fps 12] [--duplicate-threshold 2.0]

A move generated as one image-to-video clip is consistent in identity, scale and camera in
a way separately generated poses never are; what is left is choosing which of its frames
become the drawings. This is Spriterrific's frame-picker discipline, ported:

  1. extract every frame with ffmpeg (or take a folder of frame-*.png already extracted);
  2. skip the settle at the start (--start-fraction: the model eases into the motion);
  3. for a `cycle` (walk, idle) take N frames evenly spaced over N-1 times --span-factor
     dense frames, which is roughly one stride; for an `action` (an attack, a reaction)
     spread N frames over the whole remaining clip; for `hold` (a block) take the frames
     where the pose has settled;
  4. reject near-duplicates: a pick that differs from the previous one by less than
     --duplicate-threshold (mean absolute grey difference; by default half the clip's
     typical frame-to-frame change) walks forward until it is a different drawing, and
     the picks after it re-spread over what remains.

The picks are copied as <out-dir>/pick-NN.png with a contact sheet and selection.json, ready
for normalise-arcade-clip.py --align preserve-canvas. Nothing here is a final drawing; the
pick is reviewed like any other candidate. Exit 0 on success, 1 on a usage error.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover - environment guard
    print("error: Pillow is required (pip install Pillow)", file=sys.stderr)
    raise SystemExit(1)


def extract(video: Path, dense: Path, fps: int | None) -> list[Path]:
    dense.mkdir(parents=True, exist_ok=True)
    for old in dense.glob("frame-*.png"):
        old.unlink()
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-i", str(video)]
    if fps:
        cmd += ["-vf", f"fps={fps}"]
    cmd += [str(dense / "frame-%04d.png")]
    subprocess.run(cmd, check=True)
    return sorted(dense.glob("frame-*.png"))


def signature(path: Path, size: int = 32) -> np.ndarray:
    return np.asarray(Image.open(path).convert("L").resize((size, size), Image.Resampling.BOX)).astype(np.float64)


def evenly(start: int, end: int, count: int) -> list[int]:
    if count == 1:
        return [start]
    return [round(start + (end - start) * i / (count - 1)) for i in range(count)]


def auto_threshold(sigs: list[np.ndarray]) -> float:
    """Half the typical frame-to-frame change: below it, two picks are the same drawing."""
    steps = [float(np.abs(sigs[i] - sigs[i - 1]).mean()) for i in range(1, len(sigs))]
    moving = [d for d in steps if d > 0.05]
    return 0.5 * float(np.median(moving)) if moving else 0.5


def spread_distinct(start: int, end: int, last: int, count: int, sigs: list[np.ndarray], threshold: float) -> list[int]:
    """Evenly spaced picks over [start, end]; a pick that duplicates its predecessor walks
    forward until it differs, and the picks after it re-spread over what remains (up to
    `last`, the final dense frame). Raises when the clip has too few distinct drawings."""
    diff = lambda a, b: float(np.abs(sigs[a] - sigs[b]).mean())  # noqa: E731
    picks = evenly(start, end, count)
    for i in range(1, count):
        while picks[i] <= last and diff(picks[i - 1], picks[i]) < threshold:
            picks[i] += 1
        if picks[i] > last:
            raise ValueError(f"only {i} distinct frames after dense frame {start}; asked for {count}")
        remaining = count - 1 - i
        if remaining and picks[i] >= picks[i + 1]:
            tail_end = min(last, max(end, picks[i] + remaining))
            if picks[i] + remaining > last:
                raise ValueError(f"only {i + 1} distinct frames fit before the clip ends; asked for {count}")
            picks[i + 1:] = evenly(picks[i] + 1, tail_end, remaining)
    return picks


def choose(frames: list[Path], count: int, policy: str, start_fraction: float, span_factor: float, threshold: float | None) -> tuple[list[int], dict]:
    total = len(frames)
    if total < count:
        raise ValueError(f"need at least {count} frames, found {total}")
    sigs = [signature(p) for p in frames]
    resolved = threshold if threshold is not None else auto_threshold(sigs)
    start = int(round((total - 1) * start_fraction))
    if policy == "cycle":
        end = min(total - 1, start + round((count - 1) * span_factor))
    elif policy == "action":
        end = total - 1
    else:  # hold: the pose settles; take the calmest window of `count` neighbouring frames
        motion = [np.abs(sigs[i] - sigs[i - 1]).mean() for i in range(1, total)]
        best = min(range(start, total - count + 1), key=lambda i: sum(motion[i:i + count - 1]), default=start)
        return list(range(best, best + count)), {"window": [best, best + count - 1], "mode": "hold", "duplicateThreshold": resolved}
    if end - start + 1 < count:
        start, end = max(0, total - count), total - 1
    picks = spread_distinct(start, end, total - 1, count, sigs, resolved)
    return picks, {"window": [start, end], "mode": policy, "duplicateThreshold": resolved}


def contact_sheet(paths: list[Path], out: Path, labels: list[str]) -> None:
    thumbs = [Image.open(p).convert("RGBA") for p in paths]
    h = 160
    resized = [t.resize((max(1, round(t.width * h / t.height)), h)) for t in thumbs]
    sheet = Image.new("RGBA", (sum(r.width for r in resized) + 4 * len(resized), h + 16), (40, 40, 48, 255))
    draw = ImageDraw.Draw(sheet)
    x = 0
    for r, label in zip(resized, labels):
        sheet.alpha_composite(r, (x, 16))
        draw.text((x + 2, 2), label, fill=(230, 230, 240, 255))
        x += r.width + 4
    sheet.save(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", type=Path, help="a video file, or a folder of frame-*.png")
    ap.add_argument("out_dir", type=Path)
    ap.add_argument("--frames", type=int, required=True, help="how many drawings to pick")
    ap.add_argument("--policy", choices=("cycle", "action", "hold"), default="action")
    ap.add_argument("--start-fraction", type=float, default=None, help="share of the clip to skip as settle (default: 0.08 for cycle, 0 otherwise)")
    ap.add_argument("--span-factor", type=float, default=3.0, help="cycle only: dense frames per pick")
    ap.add_argument("--fps", type=int, default=None, help="extraction rate; default keeps every source frame")
    ap.add_argument("--duplicate-threshold", type=float, default=None,
                    help="mean grey difference (0-255) below which two picks are the same drawing; default: half the clip's typical frame-to-frame change")
    args = ap.parse_args()

    if args.frames < 1:
        ap.error("--frames must be at least 1")
    start_fraction = args.start_fraction if args.start_fraction is not None else (0.08 if args.policy == "cycle" else 0.0)
    if not 0 <= start_fraction < 1:
        ap.error("--start-fraction must be in [0, 1)")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    if args.source.is_dir():
        dense = sorted(args.source.glob("frame-*.png"))
        if not dense:
            print(f"error: no frame-*.png in {args.source}", file=sys.stderr)
            return 1
    else:
        if shutil.which("ffmpeg") is None:
            print("error: ffmpeg is required to extract a video", file=sys.stderr)
            return 1
        dense = extract(args.source, args.out_dir / "dense", args.fps)
    try:
        picks, meta = choose(dense, args.frames, args.policy, start_fraction, args.span_factor, args.duplicate_threshold)
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    for old in args.out_dir.glob("pick-*.png"):
        old.unlink()
    outputs = []
    for i, index in enumerate(picks):
        dest = args.out_dir / f"pick-{i:02d}.png"
        shutil.copy2(dense[index], dest)
        outputs.append(dest)
    contact_sheet(outputs, args.out_dir / "picks-contact-sheet.png", [f"{i} <- dense {index}" for i, index in enumerate(picks)])
    (args.out_dir / "selection.json").write_text(json.dumps({
        "source": str(args.source), "denseFrames": len(dense), "policy": args.policy,
        "startFraction": start_fraction, "spanFactor": args.span_factor,
        **meta, "picks": [{"out": str(o), "dense": int(i), "denseFile": str(dense[i])} for o, i in zip(outputs, picks)],
    }, indent=2) + "\n", encoding="utf-8")
    print(f"{len(dense)} dense frames; window {meta['window'][0]}..{meta['window'][1]}; picked {picks}")
    print(f"wrote {len(outputs)} picks and picks-contact-sheet.png to {args.out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
