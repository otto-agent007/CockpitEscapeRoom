#!/usr/bin/env python3
"""Slice a one-row multi-pose sheet generation (poses side by side on a flat
magenta field) into individual frame crops, ready for
normalise-scramble-sprite.py.

Poses are found as runs of non-magenta columns separated by gaps of pure
magenta. Each crop keeps a small magenta margin so the normaliser's keying
still sees the field.

Usage:
  python3 tools/assets/slice-scramble-sheet.py sheet.png outdir/prefix --expect 6
"""

import argparse
from pathlib import Path

from PIL import Image


def magenta_key(r: int, g: int, b: int) -> bool:
    return min(r, b) - g > 50


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet')
    ap.add_argument('out_prefix')
    ap.add_argument('--expect', type=int, required=True)
    ap.add_argument('--min-gap', type=int, default=8)
    args = ap.parse_args()

    im = Image.open(args.sheet).convert('RGB')
    w, h = im.size
    px = im.load()
    occupied = []
    for x in range(w):
        occupied.append(any(not magenta_key(*px[x, y]) for y in range(0, h, 2)))

    groups: list[tuple[int, int]] = []
    start = None
    gap = 0
    for x, on in enumerate(occupied):
        if on:
            if start is None:
                start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= args.min_gap:
                groups.append((start, x - gap))
                start = None
                gap = 0
    if start is not None:
        groups.append((start, w - 1))

    if len(groups) != args.expect:
        raise SystemExit(f'expected {args.expect} poses, found {len(groups)}: {groups}')

    out_dir = Path(args.out_prefix).parent
    out_dir.mkdir(parents=True, exist_ok=True)
    margin = 6
    for index, (x0, x1) in enumerate(groups, start=1):
        crop = im.crop((max(0, x0 - margin), 0, min(w, x1 + margin), h))
        path = f'{args.out_prefix}-{index}.png'
        crop.save(path)
        print(path, crop.size)


if __name__ == '__main__':
    main()
