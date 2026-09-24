#!/usr/bin/env python3
"""Prove the clip audit fails on the sequence defects it claims to catch.

Usage:
    python3 tools/assets/audit-arcade-clip.test.py

Takes a shipped looping clip, injects one defect at a time into a copy of the table and its
cells, and asserts the audit rejects each while accepting the original. Exit 0 when every
case behaves, 3 when one does not.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
TOOL = REPO_ROOT / "tools" / "assets" / "audit-arcade-clip.py"
TABLE = REPO_ROOT / "src" / "game" / "marsArcadeAnimations.json"
CLIP = "booster:walk-forward"


def run(table: Path) -> tuple[int, str]:
    proc = subprocess.run([sys.executable, str(TOOL), CLIP, "--table", str(table), "--no-assets"],
                          capture_output=True, text=True, cwd=REPO_ROOT)
    return proc.returncode, proc.stdout + proc.stderr


def with_cells(work: Path, mutate) -> Path:
    """Copy the clip's cells under `work`, let `mutate(index, image) -> image` edit them, and point a table copy at them."""
    table = json.loads(TABLE.read_text())
    entry = next(e for e in table["animations"] if f"{e['fighter']}:{e['animation']}" == CLIP)
    cells = work / "art-source" / "arcade" / "test-clip"
    cells.mkdir(parents=True, exist_ok=True)
    for i, frame in enumerate(entry["frames"]):
        image = Image.open(REPO_ROOT / frame["src"].lstrip("/")).convert("RGBA")
        image = mutate(i, image)
        rel = f"art-source/arcade/test-clip/frame-{i:02d}.png"
        image.save(work / rel)
        # The audit resolves srcs against the repo root, so the copy is placed under a
        # matching path inside the repo for the duration of the test.
        frame["src"] = "/" + rel
    table["animations"] = [entry]
    out = work / "table.json"
    out.write_text(json.dumps(table))
    return out


def shifted(image: Image.Image, dx: int, dy: int) -> Image.Image:
    a = np.asarray(image)
    out = np.zeros_like(a)
    h, w = a.shape[:2]
    ys, xs = np.where(a[:, :, 3] > 0)
    ty, tx = ys + dy, xs + dx
    keep = (ty >= 0) & (ty < h) & (tx >= 0) & (tx < w)
    out[ty[keep], tx[keep]] = a[ys[keep], xs[keep]]
    return Image.fromarray(out, "RGBA")


def scaled(image: Image.Image, factor: float) -> Image.Image:
    a = np.asarray(image)
    ys, xs = np.where(a[:, :, 3] > 0)
    crop = image.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    big = crop.resize((max(1, round(crop.width * factor)), max(1, round(crop.height * factor))), Image.Resampling.NEAREST)
    out = Image.new("RGBA", image.size, (0, 0, 0, 0))
    out.alpha_composite(big, (int(xs.min()), int(ys.max() + 1 - big.height)))
    return out


def main() -> int:
    # The copies must live inside the repo so the audit's root-relative srcs resolve.
    work = Path(tempfile.mkdtemp(prefix="audit-test-", dir=REPO_ROOT))
    failures = 0
    try:
        cases = {
            "original passes": (lambda i, im: im, 0),
            "body pops 4 px on one drawing": (lambda i, im: shifted(im, 4, 0) if i == 2 else im, 3),
            "feet leave the baseline": (lambda i, im: shifted(im, 0, -3) if i == 1 else im, 3),
            "one drawing 8% taller": (lambda i, im: scaled(im, 1.08) if i == 3 else im, 3),
        }
        for name, (mutate, expected) in cases.items():
            case_dir = work / name.replace(" ", "-")
            case_dir.mkdir()
            # srcs are repo-root relative, so the cells are written under the repo copy path
            table = with_cells(case_dir, mutate)
            # move the cells to the real repo-relative location for the run
            live = REPO_ROOT / "art-source" / "arcade" / "test-clip"
            if live.exists():
                shutil.rmtree(live)
            shutil.copytree(case_dir / "art-source" / "arcade" / "test-clip", live)
            try:
                code, output = run(table)
            finally:
                shutil.rmtree(live, ignore_errors=True)
            ok = code == expected
            print(f"{'ok' if ok else 'NOT OK'} - {name}: exit {code}, expected {expected}")
            if not ok:
                print(output)
                failures += 1
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return 3 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
