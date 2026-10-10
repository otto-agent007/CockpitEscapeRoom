#!/usr/bin/env python3
"""Prove the frame picker skips the settle, spreads picks and refuses duplicates.

Usage:
    python3 tools/assets/pick-arcade-frames.test.py

Renders a synthetic 48-frame clip (a square that sits still for the first 8 frames, then
moves) to PNGs and, when ffmpeg is present, to an MP4, and asserts the picks. Exit 0 when
every case behaves, 3 when one does not.
"""

from __future__ import annotations

import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parents[2]
TOOL = REPO_ROOT / "tools" / "assets" / "pick-arcade-frames.py"
TOTAL = 48
SETTLE = 8


def render(dense: Path) -> None:
    dense.mkdir(parents=True)
    for i in range(TOTAL):
        image = Image.new("RGB", (160, 120), (0, 255, 0))
        x = 20 if i < SETTLE else 20 + (i - SETTLE) * 3
        ImageDraw.Draw(image).rectangle([x, 40, x + 30, 80], fill=(200, 30, 30))
        image.save(dense / f"frame-{i + 1:04d}.png")


def render_cycle(dense: Path, total: int = 33) -> None:
    """One cycle with the first pose repeated at frame 32, as a Wan FLF clip is."""
    dense.mkdir(parents=True)
    for i in range(total):
        image = Image.new("RGB", (160, 120), (0, 255, 0))
        angle = 2 * math.pi * i / 32
        x, y = round(65 + 35 * math.cos(angle)), round(45 + 25 * math.sin(angle))
        ImageDraw.Draw(image).rectangle([x, y, x + 20, y + 20], fill=(200, 30, 30))
        image.save(dense / f"frame-{i + 1:04d}.png")


def run(source: Path, out: Path, *extra: str) -> tuple[int, str, dict | None]:
    proc = subprocess.run([sys.executable, str(TOOL), str(source), str(out), *extra], capture_output=True, text=True, cwd=REPO_ROOT)
    selection = out / "selection.json"
    return proc.returncode, proc.stdout + proc.stderr, json.loads(selection.read_text()) if selection.exists() else None


def main() -> int:
    failures = 0

    def check(name: str, ok: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"{'ok' if ok else 'NOT OK'} - {name}{': ' + detail if detail else ''}")
        failures += not ok

    with tempfile.TemporaryDirectory(prefix="pick-test-") as tmp:
        work = Path(tmp)
        dense = work / "dense"
        render(dense)

        code, out, sel = run(dense, work / "action", "--frames", "6", "--policy", "action")
        check("action policy picks six frames across the whole clip", code == 0 and sel and len(sel["picks"]) == 6, out.strip().splitlines()[-1] if out else "")
        picks = [p["dense"] for p in sel["picks"]] if sel else []
        check("action picks start at the first frame and end at the last", picks[:1] == [0] and picks[-1:] == [TOTAL - 1], f"{picks}")

        code, out, sel = run(dense, work / "cycle", "--frames", "4", "--policy", "cycle", "--start-fraction", "0.25", "--span-factor", "3")
        picks = [p["dense"] for p in sel["picks"]] if sel else []
        check("cycle policy skips the settle and spans ~3 dense frames per pick", code == 0 and picks[0] >= 11 and picks[-1] - picks[0] == 9, f"{picks}")

        # The first eight frames are identical, so evenly spaced picks inside them collide.
        code, out, sel = run(dense, work / "dupes", "--frames", "4", "--policy", "cycle", "--start-fraction", "0", "--span-factor", "1")
        picks = [p["dense"] for p in sel["picks"]] if sel else []
        files = [p["denseFile"] for p in sel["picks"]] if sel else []
        distinct = len({Image.open(f).tobytes() for f in files}) == len(files)
        check("near-duplicate picks are walked apart into distinct frames", code == 0 and distinct, f"{picks}")

        code, out, sel = run(dense, work / "hold", "--frames", "3", "--policy", "hold")
        picks = [p["dense"] for p in sel["picks"]] if sel else []
        check("hold policy finds the calmest window (the settle)", code == 0 and max(picks) < SETTLE, f"{picks}")

        code, out, _ = run(dense, work / "too-many", "--frames", "99")
        check("asking for more frames than exist is an error", code == 1)

        cycle = work / "closed-cycle"
        render_cycle(cycle)
        code, out, sel = run(cycle, work / "single-cycle", "--frames", "4", "--policy", "cycle", "--single-cycle")
        picks = [p["dense"] for p in sel["picks"]] if sel else []
        check("first-last-frame mode samples the full cycle without its closing duplicate", code == 0 and picks == [0, 8, 16, 24], out.strip())
        check("single-cycle provenance names the declared 32-frame period", bool(sel and sel.get("cyclePeriod") == 32 and sel.get("cycleSource") == "first-last-frame" and sel["startFraction"] == 0))

        code, out, sel = run(cycle, work / "single-pose", "--frames", "1", "--policy", "cycle", "--single-cycle")
        check("one requested drawing is the first pose", code == 0 and sel and [p["dense"] for p in sel["picks"]] == [0])
        code, out, _ = run(cycle, work / "too-many-cycle", "--frames", "33", "--policy", "cycle", "--single-cycle")
        check("the closing duplicate cannot satisfy an extra requested drawing", code == 1 and "32" in out)
        incomplete = work / "cycle-duplicate"
        incomplete.mkdir()
        for i in range(33):
            # Three held poses; only the repeated anchor at 32 differs from pose three.
            value = 20 if i < 8 or i == 32 else (80 if i < 16 else 140)
            Image.new("RGB", (160, 120), (value, 10, 10)).save(incomplete / f"frame-{i + 1:04d}.png")
        code, out, _ = run(incomplete, work / "cycle-duplicate-out", "--frames", "4", "--policy", "cycle", "--single-cycle", "--duplicate-threshold", "1")
        check("duplicate repair cannot use the repeated anchor as a fourth distinct drawing", code == 1 and "distinct" in out)
        for extra, reason in [(('--policy', 'action'), 'cycle'), (('--policy', 'hold'), 'cycle'),
                              (('--policy', 'cycle', '--span-factor', '8'), 'span-factor'),
                              (('--policy', 'cycle', '--start-fraction', '0.1'), 'start-fraction'),
                              (('--policy', 'cycle', '--fps', '8'), 'fps')]:
            dest = work / f"invalid-cycle-{reason}-{extra[-1]}"
            code, out, _ = run(cycle, dest, "--frames", "4", "--single-cycle", *extra)
            check(f"single-cycle refuses conflicting {' '.join(extra)} before writing", code == 2 and reason in out and not dest.exists())

        repeated = work / "repeated-cycle"
        render_cycle(repeated, 97)
        code, out, sel = run(repeated, work / "measured-cycle", "--frames", "4", "--policy", "cycle")
        check("default cycle mode still measures a repeating clip's period", code == 0 and sel and sel.get("cyclePeriod") == 32 and [p["dense"] for p in sel["picks"]] == [8, 16, 24, 32])

        if shutil.which("ffmpeg"):
            video = work / "clip.mp4"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", "24", "-i", str(dense / "frame-%04d.png"),
                            "-pix_fmt", "yuv420p", str(video)], check=True)
            code, out, sel = run(video, work / "video", "--frames", "5", "--policy", "action")
            check("a video is extracted with ffmpeg and picked", code == 0 and sel and sel["denseFrames"] == TOTAL and len(sel["picks"]) == 5,
                  f"dense {sel['denseFrames'] if sel else '?'}")
            check("contact sheet written", (work / "video" / "picks-contact-sheet.png").exists())
            closed_video = work / "closed-cycle.mp4"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", "16", "-i", str(cycle / "frame-%04d.png"),
                            "-pix_fmt", "yuv420p", str(closed_video)], check=True)
            code, out, sel = run(closed_video, work / "single-cycle-video", "--frames", "4", "--policy", "cycle", "--single-cycle")
            check("first-last-frame video extraction selects the same cycle phases", code == 0 and sel and [p["dense"] for p in sel["picks"]] == [0, 8, 16, 24])
        else:
            print("skip - ffmpeg not present; video extraction not exercised")

    return 3 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
