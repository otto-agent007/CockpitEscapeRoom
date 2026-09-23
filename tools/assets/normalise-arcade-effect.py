#!/usr/bin/env python3
"""Normalise a generated Mars arcade EFFECT to its on-stage pixel size.

Characters go through normalise-popt-frame.py, which places a figure on the 128 px
cell by its feet. Effects have no feet and no cell contract, so they get this
smaller tool. All three modes share one resampling rule, the same one the
character tool uses for --source-alpha sources: crop to the opaque bounding box,
then area-downsample premultiplied colour and alpha in float, so a soft edge never
drags a colour toward the transparent black behind it.

  fit    SRC DEST --width W
         Uniform scale to exactly W px wide (the satellite).
  strip  SRC DESTDIR --frames N --width W [--name impact]
         Cut SRC into N equal columns, crop every frame by the UNION of their
         bounding boxes so they share one ground line and one centre, then scale
         them all by the same factor to W px wide (the impact strip).
  beam   SRC DEST --width W --height H
         Crop the opaque box and resample to exactly W x H, a non-uniform scale,
         because a beam is stretched to the stage rather than drawn to it.

Exit 0 on success, 1 on a usage or input error.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

OPAQUE = 8  # alpha above this counts toward a bounding box; faint generator halo does not


def load(path: Path) -> np.ndarray:
    image = Image.open(path)
    if image.mode != "RGBA":
        raise SystemExit(f"{path}: expected a transparent RGBA source, got {image.mode}")
    return np.asarray(image).astype(np.float64)


def opaque_box(rgba: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(rgba[:, :, 3] > OPAQUE)
    if len(ys) == 0:
        raise SystemExit("source has no opaque pixels")
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def resample(rgba: np.ndarray, width: int, height: int) -> Image.Image:
    alpha = rgba[:, :, 3] / 255.0

    def shrink(channel: np.ndarray) -> np.ndarray:
        return np.asarray(Image.fromarray(channel.astype(np.float32)).resize((width, height), Image.BOX))

    small_alpha = shrink(alpha)
    colour = np.stack([shrink(rgba[:, :, c] * alpha) for c in range(3)], axis=2)
    safe = np.where(small_alpha > 1e-6, small_alpha, 1.0)[:, :, None]
    colour = np.clip(np.rint(colour / safe), 0, 255)
    out = np.dstack([colour, np.clip(np.rint(small_alpha * 255), 0, 255)]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def fit(args: argparse.Namespace) -> None:
    rgba = load(args.src)
    x0, y0, x1, y1 = opaque_box(rgba)
    crop = rgba[y0:y1, x0:x1]
    height = max(1, round(crop.shape[0] * args.width / crop.shape[1]))
    args.dest.parent.mkdir(parents=True, exist_ok=True)
    resample(crop, args.width, height).save(args.dest)
    print(f"fit {crop.shape[1]}x{crop.shape[0]} -> {args.width}x{height}; wrote {args.dest}")


def strip(args: argparse.Namespace) -> None:
    rgba = load(args.src)
    cell = rgba.shape[1] / args.frames
    frames = [rgba[:, round(i * cell):round((i + 1) * cell)] for i in range(args.frames)]
    boxes = [opaque_box(frame) for frame in frames]
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes)
    y1 = max(b[3] for b in boxes)
    height = max(1, round((y1 - y0) * args.width / (x1 - x0)))
    args.dest.mkdir(parents=True, exist_ok=True)
    for index, frame in enumerate(frames):
        out = args.dest / f"{args.name}-{index:02d}.png"
        resample(frame[y0:y1, x0:x1], args.width, height).save(out)
    print(f"strip {args.frames} frames, shared box {x1 - x0}x{y1 - y0} -> {args.width}x{height}; wrote {args.dest}")


def beam(args: argparse.Namespace) -> None:
    rgba = load(args.src)
    x0, y0, x1, y1 = opaque_box(rgba)
    args.dest.parent.mkdir(parents=True, exist_ok=True)
    resample(rgba[y0:y1, x0:x1], args.width, args.height).save(args.dest)
    print(f"beam {x1 - x0}x{y1 - y0} -> {args.width}x{args.height}; wrote {args.dest}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    modes = parser.add_subparsers(dest="mode", required=True)
    p = modes.add_parser("fit")
    p.add_argument("src", type=Path)
    p.add_argument("dest", type=Path)
    p.add_argument("--width", type=int, required=True)
    p.set_defaults(run=fit)
    p = modes.add_parser("strip")
    p.add_argument("src", type=Path)
    p.add_argument("dest", type=Path)
    p.add_argument("--frames", type=int, required=True)
    p.add_argument("--width", type=int, required=True)
    p.add_argument("--name", default="frame")
    p.set_defaults(run=strip)
    p = modes.add_parser("beam")
    p.add_argument("src", type=Path)
    p.add_argument("dest", type=Path)
    p.add_argument("--width", type=int, required=True)
    p.add_argument("--height", type=int, required=True)
    p.set_defaults(run=beam)
    args = parser.parse_args()
    try:
        args.run(args)
    except SystemExit as error:
        if isinstance(error.code, str):
            print(error.code, file=sys.stderr)
            return 1
        raise
    return 0


if __name__ == "__main__":
    sys.exit(main())
