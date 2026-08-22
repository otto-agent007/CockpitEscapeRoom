#!/usr/bin/env python3
"""Prove the v3 full-colour gate fails on every defect it claims to catch.

Usage:
    python3 tools/assets/check-popt-frames-fullcolour.test.py [--frame PATH]

A gate that cannot fail is worse than no gate. This takes a known-good frame, injects one
defect at a time, and asserts the checker rejects each while accepting the original.

Exit 0 when every case behaves, 1 on a usage error, 3 when a case does not.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

try:
    from PIL import Image
except ImportError:  # pragma: no cover - environment guard
    print("error: Pillow is required (pip install Pillow)", file=sys.stderr)
    raise SystemExit(1)

REPO_ROOT = Path(__file__).resolve().parents[2]
CHECKER = REPO_ROOT / "tools" / "assets" / "check-popt-frames-fullcolour.py"
DEFAULT_FRAME = (REPO_ROOT / "art-source" / "intro" / "tmb2" / "popt-v2" /
                 "normalised" / "anchor" / "anchor-00.png")


def interior_pixel(fig: np.ndarray) -> tuple[int, int]:
    """A pixel whose four neighbours are all figure, so blanking it makes a real enclosed hole."""
    h, w = fig.shape
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if fig[y, x] and fig[y-1, x] and fig[y+1, x] and fig[y, x-1] and fig[y, x+1]:
                return y, x
    raise AssertionError("no interior pixel found in the reference frame")


def cases(src: np.ndarray) -> dict:
    fig = src[:, :, 3] > 8
    hy, hx = interior_pixel(fig)

    def blank_speck():
        a = src.copy(); a[hy, hx, 3] = 0; return a

    def spill():
        a = src.copy()
        ys, xs = np.where(fig); a[ys[0], xs[0], :3] = (255, 0, 255); return a

    def dissolve():
        a = src.copy(); a[fig, 3] = 120; return a

    def stray():
        a = src.copy(); a[3, 3] = (200, 100, 100, 255); return a

    return {
        "baseline-shifted": lambda: np.roll(src.copy(), -1, axis=0),
        "pivot-drift": lambda: np.roll(src.copy(), 3, axis=1),
        "hole-speck": blank_speck,
        "chroma-spill": spill,
        "dissolved-alpha": dissolve,
        "stray-pixel": stray,
        "wrong-canvas": lambda: src.copy()[:, :100],
    }


def run_checker(frames_dir: Path) -> int:
    return subprocess.run([sys.executable, str(CHECKER), str(frames_dir)],
                          capture_output=True, text=True).returncode


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--frame", type=Path, default=DEFAULT_FRAME)
    args = ap.parse_args()
    if not args.frame.is_file():
        print(f"error: reference frame {args.frame} not found", file=sys.stderr)
        return 1

    src = np.asarray(Image.open(args.frame).convert("RGBA")).copy()
    tmp = Path(tempfile.mkdtemp(prefix="popt-gate-test-"))
    bad = 0
    try:
        good = tmp / "good" / "anchor"
        good.mkdir(parents=True)
        Image.fromarray(src, "RGBA").save(good / "anchor-00.png")
        code = run_checker(tmp / "good")
        ok = code == 0
        print(f"{'PASS' if ok else 'FAIL'}  clean frame            -> exit {code} (expected 0)")
        bad += 0 if ok else 1

        for name, build in cases(src).items():
            d = tmp / name / "anchor"
            d.mkdir(parents=True)
            Image.fromarray(build(), "RGBA").save(d / "anchor-00.png")
            code = run_checker(tmp / name)
            ok = code == 3
            print(f"{'PASS' if ok else 'FAIL'}  {name:<22} -> exit {code} (expected 3)")
            bad += 0 if ok else 1
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print(f"\n{bad} case(s) misbehaved" if bad else "\nall cases behaved")
    return 3 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
