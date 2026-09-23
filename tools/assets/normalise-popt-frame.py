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

The default Lanczos resampler preserves existing exports. Use --resample bilinear for a
sprite set whose narrow diagonal gaps develop ringing specks at the contract resolution;
the same positive-weight filter is applied to premultiplied colour and alpha. Keep the
chosen filter fixed for that set and validate the result with the full-colour checker.
For an already transparent source use --source-alpha; hidden RGB is ignored and existing
edge alpha is preserved. This opt-in never changes the legacy magenta-key path.

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
    ap.add_argument("--align", choices=("feet", "bbox", "torso"), default="feet",
                    help="feet: baseline row and horizontal midpoint of the foot span (default); "
                         "torso: back line of the torso matched to --torso-reference, for cycles "
                         "drawn in place where the planted foot changes (walks)")
    ap.add_argument("--torso-reference", type=Path, default=None,
                    help="an already normalised cell whose torso back line --align torso matches")
    ap.add_argument("--resample", choices=("lanczos", "bilinear"), default="lanczos",
                    help="downsampling filter; bilinear avoids ringing in narrow sprite gaps")
    ap.add_argument("--source-alpha", action="store_true",
                    help="use existing transparency instead of the magenta key")
    args = ap.parse_args()

    if args.align == "torso" and args.torso_reference is None:
        ap.error("--align torso needs --torso-reference, the normalised cell to hold the body against")

    contract = json.loads(args.contract.read_text())
    cell_w, cell_h = contract["cell"]["canonical"]
    baseline = contract["cell"]["baseline"]
    pivot_x = contract["cell"]["pivot"]["x"]
    stand_h = contract["derivation"]["characterOnStage"]["standingHeightStagePx"]

    source = Image.open(args.src).convert("RGBA")
    rgb = np.asarray(source.convert("RGB")).astype(np.float64)
    source_alpha = np.asarray(source)[:, :, 3].astype(np.float64) / 255.0
    mag = magentaness(rgb)
    figure_full = source_alpha > 8 / 255 if args.source_alpha else mag <= KEY_BACKGROUND
    if not figure_full.any():
        print("error: no figure found for the selected background mode", file=sys.stderr)
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

    spilled = 0 if args.source_alpha else despill(sub, figure, clean)

    scale = args.source_px_per_cell_px
    new_h = max(1, round(src_h / scale))
    new_w = max(1, round(src_w / scale))
    resample = Image.Resampling.BILINEAR if args.resample == "bilinear" else Image.Resampling.LANCZOS
    alpha = (source_alpha[y0:y1 + 1, x0:x1 + 1] * figure
             if args.source_alpha else figure.astype(np.float64))
    if args.resample == "bilinear":
        # Keep precision until unpremultiplication: an 8-bit rounding error divided by
        # a small edge alpha becomes a visible colour shift (including false magenta).
        amask = np.asarray(Image.fromarray(alpha.astype(np.float32))
                           .resize((new_w, new_h), resample))
        premul = np.stack([
            np.asarray(Image.fromarray((sub[:, :, channel] * alpha).astype(np.float32))
                       .resize((new_w, new_h), resample))
            for channel in range(3)
        ], axis=2)
    else:
        # Retain the exact legacy export path for existing intro assets.
        premul = Image.fromarray((sub * alpha[:, :, None]).astype(np.uint8))
        premul = np.asarray(premul.resize((new_w, new_h), resample)).astype(np.float64)
        amask = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8))
                           .resize((new_w, new_h), resample)).astype(np.float64) / 255.0
    flat = np.divide(premul, np.maximum(amask, 1e-6)[:, :, None]).clip(0, 255)
    if args.source_alpha:
        # Restore the nearest 8-bit source colour after float premultiplication.
        # Truncation would turn an exact 120 into 119.99999 -> 119 at soft edges.
        flat = np.rint(flat)
    sprite = np.dstack([flat, amask * 255]).astype(np.uint8)

    # placement
    op = sprite[:, :, 3] > 8
    sy, sx = np.where(op)
    if args.align == "torso":
        # The back line of the torso: the median of the rearmost opaque column over the
        # rows 30-50% down the figure. Leg-only edits keep it fixed, the fists do not
        # reach it, and feet placement cannot move it. Rear is the left, since every
        # frame is authored facing right.
        def back_line(mask: np.ndarray) -> float:
            rows = np.where(mask.any(axis=1))[0]
            top, height = rows.min(), rows.max() - rows.min() + 1
            band = range(top + int(height * 0.30), top + int(height * 0.50))
            return float(np.median([np.where(mask[r])[0].min() for r in band if mask[r].any()]))
        reference = np.asarray(Image.open(args.torso_reference).convert("RGBA"))[:, :, 3] > 8
        target_back = back_line(reference)
        anchor_x = int(round(back_line(op) + pivot_x - target_back))
        anchor_y = int(sy.max())
    elif args.align == "feet":
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
