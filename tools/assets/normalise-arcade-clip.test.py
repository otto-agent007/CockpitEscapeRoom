#!/usr/bin/env python3
"""Prove the clip normaliser aligns a clip by one rule, and keys either background.

Usage:
    python3 tools/assets/normalise-arcade-clip.test.py

Builds a synthetic three-frame clip — a figure whose free foot steps forward while the
stance foot stays put, on a magenta field and as transparent PNGs — and asserts:

  - feet mode recentres each drawing on its own foot span (the body moves: the old pop);
  - planted-foot mode holds the stance foot on the pivot on every drawing (the body stays);
  - preserve-canvas mode applies one offset to every frame and reports it;
  - the magenta field is keyed with no spill left on the figure; a green field keys too;
  - every output is a 128x128 RGBA cell with the feet on the baseline;
  - --nudge moves exactly the named drawing by exactly its pixels, leaves the others
    byte-identical, records the nudge and the combined offset, and refuses bad input.

Exit 0 when every case behaves, 3 when one does not.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parents[2]
TOOL = REPO_ROOT / "tools" / "assets" / "normalise-arcade-clip.py"
SCALE = 8.0   # source px per cell px
CANVAS = (1024, 1024)


def figure(step: int, background: tuple[int, int, int] | None) -> Image.Image:
    """A stick figure 800 px tall: head, body, stance leg at x=400, free leg stepping forward."""
    mode = "RGB" if background else "RGBA"
    image = Image.new(mode, CANVAS, background if background else (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    ink = (40, 60, 200) if background else (40, 60, 200, 255)
    base_y = 1000
    draw.ellipse([360, base_y - 800, 440, base_y - 720], fill=ink)
    draw.rectangle([390, base_y - 720, 410, base_y - 300], fill=ink)
    draw.rectangle([380, base_y - 300, 420, base_y], fill=ink)               # stance leg + foot at x 380-420
    free_x = 480 + step
    draw.rectangle([free_x - 20, base_y - 300, free_x + 20, base_y], fill=ink)  # free leg steps forward
    draw.rectangle([300, base_y - 650, 500, base_y - 620], fill=ink)         # arms
    return image


def run(out: Path, sources: list[Path], *extra: str) -> tuple[int, str]:
    proc = subprocess.run([sys.executable, str(TOOL), str(out), *map(str, sources), "--clip", "clip",
                           "--source-px-per-cell-px", str(SCALE), *extra], capture_output=True, text=True, cwd=REPO_ROOT)
    return proc.returncode, proc.stdout + proc.stderr


def stance_foot_column(cell: Path) -> float:
    a = np.asarray(Image.open(cell).convert("RGBA"))
    ys, xs = np.where(a[:, :, 3] > 8)
    foot = np.unique(xs[ys >= ys.max() - 1])
    # the stance foot is the rear cluster
    gap = np.where(np.diff(foot) > 3)[0]
    rear = foot[: gap[0] + 1] if len(gap) else foot
    return float((rear.min() + rear.max()) / 2)


def main() -> int:
    failures = 0

    def check(name: str, ok: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"{'ok' if ok else 'NOT OK'} - {name}{': ' + detail if detail else ''}")
        failures += not ok

    with tempfile.TemporaryDirectory(prefix="clip-test-") as tmp:
        work = Path(tmp)
        magenta = []
        alpha = []
        for i, step in enumerate((0, 120, 240)):
            m = work / f"magenta-{i}.png"
            figure(step, (255, 0, 255)).save(m)
            magenta.append(m)
            a = work / f"alpha-{i}.png"
            figure(step, None).save(a)
            alpha.append(a)

        code, out = run(work / "feet", magenta, "--align", "feet")
        check("feet mode runs on a magenta field", code == 0, out.strip().splitlines()[-1] if out else "")
        cells = sorted((work / "feet" / "clip").glob("clip-*.png"))
        check("three 128x128 RGBA cells", len(cells) == 3 and all(Image.open(c).size == (128, 128) and Image.open(c).mode == "RGBA" for c in cells))
        feet_cols = [stance_foot_column(c) for c in cells]
        check("feet mode moves the body as the free foot steps (the pop)", feet_cols[2] < feet_cols[0] - 5, f"stance foot columns {feet_cols}")
        for c in cells:
            a = np.asarray(Image.open(c).convert("RGBA")).astype(int)
            fig = a[:, :, 3] > 8
            ys = np.where(fig)[0]
            check(f"{c.name}: feet on the baseline", ys.max() == 119, f"lowest row {ys.max()}")
            spill = (np.minimum(a[:, :, 0], a[:, :, 2]) - a[:, :, 1])[fig]
            check(f"{c.name}: no magenta spill on the figure", int(spill.max()) <= 15, f"worst {int(spill.max())}")

        code, out = run(work / "planted", magenta, "--align", "planted-foot", "--planted", "rear")
        check("planted-foot mode runs", code == 0)
        planted_cols = [stance_foot_column(c) for c in sorted((work / "planted" / "clip").glob("clip-*.png"))]
        check("planted-foot holds the stance foot on the pivot on every drawing", all(abs(c - 64) <= 1 for c in planted_cols), f"stance foot columns {planted_cols}")

        code, out = run(work / "canvas", alpha, "--align", "preserve-canvas", "--source-alpha")
        check("preserve-canvas mode runs on transparent sources", code == 0, out.strip().splitlines()[-1] if out else "")
        report = json.loads((work / "canvas" / "clip" / "normalise-report.json").read_text())
        offsets = {tuple(f["offset"]) for f in report["frames"]}
        check("preserve-canvas applies one offset to every frame", len(offsets) == 1, f"offsets {sorted(offsets)}")
        canvas_cols = [stance_foot_column(c) for c in sorted((work / "canvas" / "clip").glob("clip-*.png"))]
        check("preserve-canvas keeps the stance foot still", max(canvas_cols) - min(canvas_cols) <= 1, f"{canvas_cols}")

        green = work / "green.png"
        figure(0, (0, 255, 0)).save(green)
        code, out = run(work / "green", [green], "--chroma", "#00FF00")
        cell = np.asarray(Image.open(work / "green" / "clip" / "clip-00.png").convert("RGBA")).astype(int)
        fig = cell[:, :, 3] > 8
        greenness = (cell[:, :, 1] - np.maximum(cell[:, :, 0], cell[:, :, 2]))[fig]
        check("a green field keys with no spill", code == 0 and int(greenness.max()) <= 15, f"worst {int(greenness.max())}")

        code, out = run(work / "torso-missing", magenta, "--align", "torso")
        check("torso mode without a reference is a usage error", code != 0)

        for mode, extra in (("planted-foot", ()), ("preserve-canvas", ("--source-alpha",))):
            sources = alpha if extra else magenta
            code, _ = run(work / f"plain-{mode}", sources, "--align", mode, *extra)
            code_n, out_n = run(work / f"nudged-{mode}", sources, "--align", mode, *extra, "--nudge", "1:-3,1")
            check(f"{mode}: nudged run succeeds", code == 0 and code_n == 0, out_n.strip().splitlines()[-1] if out_n else "")
            plain = [np.asarray(Image.open(c)) for c in sorted((work / f"plain-{mode}" / "clip").glob("clip-*.png"))]
            nudged = [np.asarray(Image.open(c)) for c in sorted((work / f"nudged-{mode}" / "clip").glob("clip-*.png"))]
            check(f"{mode}: un-nudged drawings are byte-identical", np.array_equal(plain[0], nudged[0]) and np.array_equal(plain[2], nudged[2]))
            expected = np.zeros_like(plain[1])
            expected[1:, :-3] = plain[1][:-1, 3:]   # three left, one down
            check(f"{mode}: drawing 1 moved exactly -3,+1", np.array_equal(expected, nudged[1]))
            before = json.loads((work / f"plain-{mode}" / "clip" / "normalise-report.json").read_text())["frames"][1]
            after = json.loads((work / f"nudged-{mode}" / "clip" / "normalise-report.json").read_text())["frames"][1]
            check(f"{mode}: report records the nudge and the combined offset",
                  after["nudge"] == [-3, 1] and after["offset"] == [before["offset"][0] - 3, before["offset"][1] + 1]
                  and after["anchor"] == before["anchor"], f"{before['offset']} -> {after['offset']}")
            check(f"{mode}: a vertical nudge is announced", "feet moved 1 row down" in out_n)

        for bad in ("3:1,0", "1:1", "x:1,0", "1:1.5,0"):
            code, out = run(work / "bad", magenta, "--nudge", bad)
            check(f"--nudge {bad} is a usage error", code == 1 or code == 2, out.strip().splitlines()[-1] if out else "")
        code, out = run(work / "twice", magenta, "--nudge", "1:1,0", "--nudge", "1:0,1")
        check("nudging one drawing twice is a usage error", code != 0 and "twice" in out)

    return 3 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
