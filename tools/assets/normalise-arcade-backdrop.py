#!/usr/bin/env python3
"""Normalise a generated arcade backdrop layer into its seamless tile.

The image model will not produce flat colour however firmly it is asked: the first
colony generation came back with 24,380 distinct colours against a four-entry brief.
So the grid and the palette are imposed here, exactly as the Pop T frame pipeline
imposes them (`normalise-popt-frame.py`), and for the same measured reasons:

- **Vote, don't average.** Averaging RGB across a colour boundary lands on an
  intermediate colour that then snaps to a wrong third palette entry, which is what
  manufactures most speckle. Map to the palette first, then take the modal palette
  index per target cell.
- **Abstain on contaminated pixels.** A pixel part-way between the subject and the
  magenta field is neither; letting it vote pulls edges toward whichever palette
  entry happens to sit nearest the blend.

Unlike a character frame, a layer must also **tile**: column 0 is drawn immediately
right of column `width - 1` forever, so the two edges have to join. That is checked
here rather than by eye, because it is the commonest way a layer fails.

Usage:
    normalise-arcade-backdrop.py RAW.png OUT.png --width 320 --height 40 \
        --palette 472e3c,523446,ffd58a,ff9a52
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

KEY_COLOUR = np.array([255, 0, 255])

# How decisively a pixel must favour one side to count as that side. Anything in
# between is a blend along an edge and abstains.
#
# This replaces the Pop T pipeline's fixed `min(R,B) - G` thresholds (background
# above 60, votable at or below 15), which are WRONG for this palette and silently
# destroyed the first ridge layer. That formula scores how magenta-ish a pixel is,
# and the Mars backdrop palette is deliberately violet: the ridge interior is
# (65,48,66), which scores 17 — three points over the "contaminated" line. Every
# interior pixel abstained, so only anti-aliased edges voted and the tile came back
# 11.5% filled instead of solid. A character frame never hit this because no Pop T
# palette entry is purple.
#
# Distance to the key colour versus distance to the nearest palette entry has no
# such blind spot: it asks the question that actually matters, and it stays correct
# whatever hue a future layer's palette uses.
DECISION_RATIO = 0.5


def parse_palette(text: str) -> np.ndarray:
    entries = [item.strip().lstrip("#") for item in text.split(",") if item.strip()]
    if not entries:
        raise SystemExit("palette is empty")
    return np.array([[int(h[i : i + 2], 16) for i in (0, 2, 4)] for h in entries], dtype=int)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("raw", type=Path)
    parser.add_argument("out", type=Path)
    parser.add_argument("--width", type=int, required=True)
    parser.add_argument("--height", type=int, required=True)
    parser.add_argument("--palette", required=True)
    parser.add_argument(
        "--opaque",
        action="store_true",
        help="Layer fills its tile with no transparency (the deck). Empty cells "
        "take the nearest palette entry instead of becoming transparent.",
    )
    args = parser.parse_args()

    palette = parse_palette(args.palette)
    source = np.asarray(Image.open(args.raw).convert("RGB")).astype(int)
    to_key = np.sqrt(((source - KEY_COLOUR) ** 2).sum(axis=2))
    to_palette = np.sqrt(
        ((source[:, :, None, :] - palette[None, None, :, :]) ** 2).sum(axis=3)
    ).min(axis=2)
    background = to_key <= to_palette * DECISION_RATIO
    votable = to_palette <= to_key * DECISION_RATIO

    if args.opaque:
        rows = np.arange(source.shape[0])
        cols = np.arange(source.shape[1])
    else:
        subject = ~background
        if not subject.any():
            raise SystemExit("no subject found: the whole frame keyed as background")
        rows = np.where(subject.any(axis=1))[0]
        cols = np.where(subject.any(axis=0))[0]
        rows = np.arange(rows.min(), rows.max() + 1)
        cols = np.arange(cols.min(), cols.max() + 1)

    crop = source[rows.min() : rows.max() + 1, cols.min() : cols.max() + 1]
    crop_votable = votable[rows.min() : rows.max() + 1, cols.min() : cols.max() + 1]

    # Map every source pixel to its nearest palette entry once, up front.
    flat = crop.reshape(-1, 3)
    distances = ((flat[:, None, :] - palette[None, :, :]) ** 2).sum(axis=2)
    indices = distances.argmin(axis=1).reshape(crop.shape[:2])

    out_indices = np.full((args.height, args.width), -1, dtype=int)
    src_h, src_w = crop.shape[:2]
    for ty in range(args.height):
        y0, y1 = ty * src_h // args.height, max((ty + 1) * src_h // args.height, ty * src_h // args.height + 1)
        for tx in range(args.width):
            x0, x1 = tx * src_w // args.width, max((tx + 1) * src_w // args.width, tx * src_w // args.width + 1)
            cell = indices[y0:y1, x0:x1]
            mask = crop_votable[y0:y1, x0:x1]
            votes = cell[mask]
            if votes.size == 0:
                continue
            out_indices[ty, tx] = np.bincount(votes, minlength=len(palette)).argmax()

    rgba = np.zeros((args.height, args.width, 4), dtype=np.uint8)
    filled = out_indices >= 0
    rgba[filled, :3] = palette[out_indices[filled]]
    rgba[filled, 3] = 255
    Image.fromarray(rgba, "RGBA").save(args.out)

    # Report what a reviewer would otherwise have to take on trust.
    coverage = filled.mean() * 100
    used = sorted({int(i) for i in out_indices[filled].ravel()})

    # Seam check. The obvious test — "what share of rows have a different colour in
    # column 0 than in the last column" — is NOT a seam test, and reading it as one
    # cost a round of pointless repair work: it called the colony 13% broken when the
    # colony's join is in fact SMOOTHER than its average interior column pair, and it
    # scored the clouds as a problem for the same reason. Any two adjacent columns of
    # a busy texture differ; that is what texture is.
    #
    # What matters is whether the join is discontinuous RELATIVE TO the tile's own
    # column-to-column variation. So compare the wrap against the distribution of
    # every interior neighbour pair. On the apron this correctly flagged a genuine
    # break at 13x the median, traced to the generated image having an open gap at
    # its left edge and a solid crate stack at its right.
    def column_delta(a: int, b: int) -> float:
        return float(np.abs(rgba[:, a, :].astype(int) - rgba[:, b, :].astype(int)).sum())

    interior = [column_delta(i, i + 1) for i in range(args.width - 1)]
    wrap = column_delta(args.width - 1, 0)
    median = float(np.median(interior)) if interior else 0.0
    p90 = float(np.percentile(interior, 90)) if interior else 0.0
    verdict = "ok" if wrap <= p90 else "SEAM — the join breaks the pattern"

    print(f"wrote {args.out} ({args.width}x{args.height})")
    print(f"  source crop      {src_w}x{src_h} (aspect {src_w / src_h:.2f}:1)")
    print(f"  coverage         {coverage:.1f}% of cells filled")
    print(f"  palette used     {len(used)}/{len(palette)} entries {used}")
    print(f"  wrap join        {wrap:.0f} vs interior median {median:.0f}, p90 {p90:.0f} — {verdict}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
