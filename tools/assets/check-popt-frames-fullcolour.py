#!/usr/bin/env python3
"""Objective gate for Pop T v3 full-colour frames.

Usage:
    python3 tools/assets/check-popt-frames-fullcolour.py <frames-dir> [--contract PATH]
                                                         [--standing-clip NAME ...]

<frames-dir> holds one subdirectory per clip, each containing <clip>-NN.png frames - the layout
the runtime already uses under public/images/intro/tmb2/popt.

This replaces the palette-conformance and orphan-pixel checks of check-popt-frames.py, which are
specific to the retired 14-colour pixel-art contract and which the intro's own background plates
fail at 92.9%. The geometric and silhouette guarantees are unchanged and still enforced here, and
three new checks cover failure modes the full-colour route introduces: leftover chroma key,
a silhouette dissolved into semi-transparency, and holes punched through the body.

Exit 0 when every frame passes, 1 on a usage error, 3 when a frame fails the contract.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np

try:
    from PIL import Image
except ImportError:  # pragma: no cover - environment guard
    print("error: Pillow is required (pip install Pillow)", file=sys.stderr)
    raise SystemExit(1)

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONTRACT = REPO_ROOT / "asset-reports" / "popt-sprite-contract.json"

ALPHA_ON = 8            # alpha above this counts as part of the figure
ALPHA_SOLID = 250       # alpha at or above this is fully opaque
MAX_SPILL = 15          # magenta-ness above this means the chroma key leaked through
MAX_SOFT_SHARE = 0.35   # at most this share of figure pixels may be partially transparent
MAX_PIVOT_DRIFT = 1     # foot midpoint may sit this many px either side of the pivot column
MAX_HOLE_DAMAGE_PX = 2  # an enclosed gap this small is punched-through damage, not drawn space


def components(mask: np.ndarray) -> int:
    """Count 4-connected components of a boolean mask."""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    n = 0
    for sy in range(h):
        for sx in range(w):
            if not mask[sy, sx] or seen[sy, sx]:
                continue
            n += 1
            q = deque([(sy, sx)])
            seen[sy, sx] = True
            while q:
                y, x = q.popleft()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
    return n


def interior_holes(mask: np.ndarray, max_damage_px: int) -> tuple[int, int]:
    """Transparent regions fully enclosed by the figure.

    Enclosed negative space is normal character art - the gap between a hanging arm and the
    torso, or between the lower legs, is closed at both ends and reads as a hole. Only a very
    small enclosed region indicates damage: a speck punched through the body by the chroma key
    or by resampling. Returns (damage_holes, legitimate_gaps).
    """
    h, w = mask.shape
    outside = np.zeros_like(mask)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not mask[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((ny, nx))
    enclosed = ~mask & ~outside
    h_, w_ = enclosed.shape
    seen = np.zeros_like(enclosed)
    damage = legit = 0
    for sy in range(h_):
        for sx in range(w_):
            if not enclosed[sy, sx] or seen[sy, sx]:
                continue
            q2 = deque([(sy, sx)])
            seen[sy, sx] = True
            size = 0
            while q2:
                y, x = q2.popleft()
                size += 1
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h_ and 0 <= nx < w_ and enclosed[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q2.append((ny, nx))
            if size <= max_damage_px:
                damage += 1
            else:
                legit += 1
    return damage, legit


def check(path: Path, contract: dict, standing: bool) -> list[str]:
    cell_w, cell_h = contract["cell"]["canonical"]
    baseline = contract["cell"]["baseline"]
    pivot_x = contract["cell"]["pivot"]["x"]
    env = contract["character"]["envelopeBounds"]
    ex0, ex1 = env["x"]
    ey0, ey1 = env["y"]
    stand_h = contract["character"]["standingHeightPx"]
    stand_tol = contract["character"].get("standingHeightTolerancePx", 0)

    im = Image.open(path)
    fails: list[str] = []
    if im.mode != "RGBA":
        fails.append(f"mode is {im.mode}, expected RGBA")
    if im.size != (cell_w, cell_h):
        fails.append(f"canvas is {im.size[0]}x{im.size[1]}, expected {cell_w}x{cell_h}")
        return fails

    a = np.asarray(im.convert("RGBA")).astype(int)
    fig = a[:, :, 3] > ALPHA_ON
    if not fig.any():
        return ["frame is empty"]

    ys, xs = np.where(fig)
    lowest, highest = ys.max(), ys.min()
    if lowest != baseline:
        fails.append(f"lowest opaque row is {lowest}, contract baseline is {baseline}")
    if xs.min() < ex0 or xs.max() > ex1 or highest < ey0 or lowest > ey1:
        fails.append(f"leaves the pose envelope: x {xs.min()}..{xs.max()} (allowed {ex0}..{ex1}), "
                     f"y {highest}..{lowest} (allowed {ey0}..{ey1})")

    foot = xs[ys >= lowest - 1]
    mid = (foot.min() + foot.max()) / 2
    if abs(mid - pivot_x) > MAX_PIVOT_DRIFT:
        fails.append(f"foot midpoint is column {mid:.1f}, pivot column is {pivot_x} "
                     f"(drift over {MAX_PIVOT_DRIFT}px changes where he stands on stage)")

    if standing:
        h = lowest - highest + 1
        if abs(h - stand_h) > stand_tol:
            fails.append(f"standing height is {h} rows, contract requires "
                         f"{stand_h} +/- {stand_tol}")

    n = components(fig)
    if n != 1:
        fails.append(f"silhouette is {n} disconnected pieces, expected 1")
    damage, _ = interior_holes(fig, MAX_HOLE_DAMAGE_PX)
    if damage:
        fails.append(f"{damage} transparent speck(s) of <= {MAX_HOLE_DAMAGE_PX}px punched "
                     f"through the body - chroma key or resampling damage")

    spill = (np.minimum(a[:, :, 0], a[:, :, 2]) - a[:, :, 1])[fig]
    if (spill > MAX_SPILL).any():
        worst = int(spill.max())
        fails.append(f"chroma key leaked onto {(spill > MAX_SPILL).sum()} px "
                     f"(worst magenta-ness {worst}, ceiling {MAX_SPILL}) - despill failed")

    soft = ((a[:, :, 3] > ALPHA_ON) & (a[:, :, 3] < ALPHA_SOLID)).sum() / fig.sum()
    if soft > MAX_SOFT_SHARE:
        fails.append(f"{100*soft:.1f}% of the figure is partially transparent, "
                     f"ceiling {100*MAX_SOFT_SHARE:.0f}% - silhouette has dissolved")
    return fails


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("frames_dir", type=Path)
    ap.add_argument("--contract", type=Path, default=DEFAULT_CONTRACT)
    ap.add_argument("--standing-clip", action="append", default=["anchor", "idle"],
                    help="clips whose frames must match the contract standing height")
    args = ap.parse_args()

    if not args.frames_dir.is_dir():
        print(f"error: {args.frames_dir} is not a directory", file=sys.stderr)
        return 1
    contract = json.loads(args.contract.read_text())

    frames = sorted(p for p in args.frames_dir.glob("*/*.png"))
    if not frames:
        print(f"error: no <clip>/<clip>-NN.png frames under {args.frames_dir}", file=sys.stderr)
        return 1

    failures = 0
    for f in frames:
        rel = f"{f.parent.name}/{f.name}"
        fails = check(f, contract, standing=f.parent.name in args.standing_clip)
        if fails:
            failures += 1
            print(f"FAIL {rel}")
            for m in fails:
                print(f"       {m}")
    print(f"\nchecked {len(frames)} frames; {failures} failures")
    return 3 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
