#!/usr/bin/env python3
"""Normalise a generated Pop T frame into the v3 full-colour contract cell.

Usage:
    python3 tools/assets/normalise-popt-frame.py <src.png> <out.png> [options]

The generator produces a large flat-shaded illustration on a solid magenta chroma field. This
tool keys that field, removes the magenta spill it leaves on the silhouette edge, downsamples
with alpha weighting, and places the figure in the 128x128 contract cell.

Scale must be IDENTICAL across every frame or the character changes size between clips, so it is
supplied explicitly as --source-px-per-cell-px rather than re-fitted per frame. Derive it once
from the anchor with --derive-scale and reuse the printed value for the whole set.

Exit 0 on success, 1 on a usage error.
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
DEFAULT_CONTRACT = REPO_ROOT / "asset-reports" / "popt-sprite-contract.json"

KEY_BACKGROUND = 60   # magenta-ness above this is background
KEY_SPILL = 15        # magenta-ness above this is a contaminated edge pixel


def magentaness(rgb: np.ndarray) -> np.ndarray:
    """How much a pixel leans toward the pure-magenta key. Character colours score <= 3."""
    return np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1]


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


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--contract", type=Path, default=DEFAULT_CONTRACT)
    ap.add_argument("--source-px-per-cell-px", type=float, default=None,
                    help="source pixels per contract cell pixel; constant across the whole set")
    ap.add_argument("--derive-scale", action="store_true",
                    help="derive the scale from this frame's standing height and print it")
    ap.add_argument("--align", choices=("feet", "bbox"), default="feet",
                    help="feet: baseline row and horizontal midpoint of the foot span (default)")
    args = ap.parse_args()

    contract = json.loads(args.contract.read_text())
    cell_w, cell_h = contract["cell"]["canonical"]
    baseline = contract["cell"]["baseline"]
    pivot_x = contract["cell"]["pivot"]["x"]
    stand_h = contract["derivation"]["characterOnStage"]["standingHeightStagePx"]

    rgb = np.asarray(Image.open(args.src).convert("RGB")).astype(np.float64)
    mag = magentaness(rgb)
    figure_full = mag <= KEY_BACKGROUND
    if not figure_full.any():
        print("error: no figure found - is the background the magenta key?", file=sys.stderr)
        return 1

    ys, xs = np.where(figure_full)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    sub = rgb[y0:y1 + 1, x0:x1 + 1].copy()
    figure = figure_full[y0:y1 + 1, x0:x1 + 1]
    clean = figure & (mag[y0:y1 + 1, x0:x1 + 1] <= KEY_SPILL)
    src_h, src_w, _ = sub.shape

    if args.derive_scale:
        scale = src_h / stand_h
        print(f"source {src_w}x{src_h}; standing height {stand_h} -> "
              f"--source-px-per-cell-px {scale:.4f}")
        if args.source_px_per_cell_px is None:
            args.source_px_per_cell_px = scale
    if args.source_px_per_cell_px is None:
        print("error: pass --source-px-per-cell-px (or --derive-scale on the anchor)",
              file=sys.stderr)
        return 1

    spilled = despill(sub, figure, clean)

    scale = args.source_px_per_cell_px
    new_h = max(1, round(src_h / scale))
    new_w = max(1, round(src_w / scale))
    alpha = figure.astype(np.float64)
    premul = Image.fromarray((sub * alpha[:, :, None]).astype(np.uint8))
    premul = np.asarray(premul.resize((new_w, new_h), Image.LANCZOS)).astype(np.float64)
    amask = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8))
                       .resize((new_w, new_h), Image.LANCZOS)).astype(np.float64) / 255.0
    flat = np.divide(premul, np.maximum(amask, 1e-6)[:, :, None]).clip(0, 255)
    sprite = np.dstack([flat, amask * 255]).astype(np.uint8)

    # placement
    op = sprite[:, :, 3] > 8
    sy, sx = np.where(op)
    if args.align == "feet":
        foot_rows = sy.max()
        foot_span = sx[sy >= foot_rows - 1]
        anchor_x = int(round((foot_span.min() + foot_span.max()) / 2))
        anchor_y = int(foot_rows)
    else:
        anchor_x = int(round((sx.min() + sx.max()) / 2))
        anchor_y = int(sy.max())

    out = np.zeros((cell_h, cell_w, 4), np.uint8)
    top = baseline - anchor_y
    left = pivot_x - anchor_x
    ys_s, xs_s = np.where(op)
    ty, tx = ys_s + top, xs_s + left
    keep = (ty >= 0) & (ty < cell_h) & (tx >= 0) & (tx < cell_w)
    out[ty[keep], tx[keep]] = sprite[ys_s[keep], xs_s[keep]]

    clipped = int((~keep).sum())
    args.out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out, "RGBA").save(args.out)

    oy, ox = np.where(out[:, :, 3] > 0)
    print(f"despilled {spilled} edge px; downsampled {src_w}x{src_h} -> {new_w}x{new_h} "
          f"(1/{scale:.3f})")
    print(f"placed rows {oy.min()}..{oy.max()}, cols {ox.min()}..{ox.max()}"
          + (f"; WARNING {clipped} px clipped outside the cell" if clipped else ""))
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
