#!/usr/bin/env python3
"""Normalise a magenta-keyed Scramble sprite generation to its exact on-stage size.

Chain (per the proven v3 route in the popt pipeline): hard-key the magenta field,
mark key-contaminated edge pixels, despill, crop to content, alpha-weighted BOX
downsample to the target height or width, output a tight RGBA sprite.

Usage:
  python3 tools/assets/normalise-scramble-sprite.py in.png out.png --height 34
  python3 tools/assets/normalise-scramble-sprite.py in.png out.png --width 52
"""

import argparse

from PIL import Image


def normalise(src: Image.Image, height: int | None, width: int | None) -> Image.Image:
    im = src.convert('RGB')
    w, h = im.size
    px = im.load()
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            key = min(r, b) - g
            if key > 50:
                continue
            if key > 15:
                # key-contaminated edge: despill toward neutral, half coverage
                m = (key - 15) / 35
                r = int(r - (r - g) * m * 0.8)
                b = int(b - (b - g) * m * 0.8)
                op[x, y] = (r, g, b, int(255 * (1 - m * 0.5)))
            else:
                op[x, y] = (r, g, b, 255)
    bbox = out.getbbox()
    if bbox is None:
        raise SystemExit('no content after keying')
    out = out.crop(bbox)
    cw, ch = out.size
    if height is not None:
        tw = max(1, round(cw * height / ch))
        target = (tw, height)
    else:
        th = max(1, round(ch * width / cw))
        target = (width, th)
    # premultiply so transparent pixels don't bleed colour into the average
    pre = Image.new('RGBA', out.size)
    pp, sp = pre.load(), out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = sp[x, y]
            pp[x, y] = (r * a // 255, g * a // 255, b * a // 255, a)
    small = pre.resize(target, Image.BOX)
    un = Image.new('RGBA', target, (0, 0, 0, 0))
    up, lp = un.load(), small.load()
    for y in range(target[1]):
        for x in range(target[0]):
            r, g, b, a = lp[x, y]
            # Hard alpha: a pixel sprite has no soft edges. Verified 2026-08-18 —
            # semi-transparent fringes read as disconnected silhouette pieces.
            if a < 60:
                continue
            up[x, y] = (min(255, r * 255 // a), min(255, g * 255 // a), min(255, b * 255 // a), 255)
    return drop_specks(un)


def drop_specks(im: Image.Image, min_px: int = 4) -> Image.Image:
    """Remove floating components smaller than min_px (keeps the silhouette one piece)."""
    px = im.load()
    w, h = im.size
    opaque = {(x, y) for y in range(h) for x in range(w) if px[x, y][3] == 255}
    seen: set[tuple[int, int]] = set()
    comps = []
    for p in opaque:
        if p in seen:
            continue
        stack, comp = [p], []
        seen.add(p)
        while stack:
            c = stack.pop()
            comp.append(c)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (c[0] + dx, c[1] + dy)
                if q in opaque and q not in seen:
                    seen.add(q)
                    stack.append(q)
        comps.append(comp)
    comps.sort(key=len, reverse=True)
    for comp in comps[1:]:
        if len(comp) < min_px:
            for x, y in comp:
                px[x, y] = (0, 0, 0, 0)
    return im


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('out')
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument('--height', type=int)
    group.add_argument('--width', type=int)
    args = ap.parse_args()
    result = normalise(Image.open(args.src), args.height, args.width)
    result.save(args.out)
    print(f'{args.out}: {result.size[0]}x{result.size[1]}')


if __name__ == '__main__':
    main()
