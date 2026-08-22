#!/usr/bin/env python3
"""Objective gate for Pop T sprite frames against asset-reports/popt-sprite-contract.json.

Usage:
    python3 tools/assets/check-popt-frames.py <frames-dir> [--contract PATH] [--grid-step N]

<frames-dir> holds one subdirectory per clip, each containing <clip>-NN.png frames, which is
the layout the runtime already uses under public/images/intro/tmb2/popt.

--grid-step is the number of file pixels per art pixel. The v2 contract ships native art, so
the default is 1. Pass --grid-step 2 to audit the v1 256x256 frames with the same rules.

Exit 0 when every frame passes, 1 on a usage error, 3 when a frame fails the contract.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import deque
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover - environment guard
    print("error: Pillow is required (pip install Pillow)", file=sys.stderr)
    raise SystemExit(1)

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONTRACT = REPO_ROOT / "asset-reports" / "popt-sprite-contract.json"


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def load_art(path: Path, grid_step: int) -> Image.Image:
    """Return the frame at art resolution, one image pixel per art pixel."""
    image = Image.open(path).convert("RGBA")
    if grid_step == 1:
        return image
    return image.resize((image.width // grid_step, image.height // grid_step), Image.NEAREST)


def connected_components(opaque: set[tuple[int, int]]) -> list[int]:
    """Sizes of 8-connected opaque regions, largest first."""
    remaining = set(opaque)
    sizes: list[int] = []
    while remaining:
        seed = remaining.pop()
        queue = deque([seed])
        size = 1
        while queue:
            x, y = queue.popleft()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    neighbour = (x + dx, y + dy)
                    if neighbour in remaining:
                        remaining.discard(neighbour)
                        queue.append(neighbour)
                        size += 1
        sizes.append(size)
    return sorted(sizes, reverse=True)


def check_frame(path: Path, art: Image.Image, contract: dict, clip: dict | None) -> list[str]:
    failures: list[str] = []

    cell_w, cell_h = contract["cell"]["canonical"]
    baseline = contract["cell"]["baseline"]
    palette = {hex_to_rgb(c) for c in contract["palette"]["opaqueColors"]}
    max_orphan = contract["qualityGates"]["orphanPixelRate"]["max"]
    bounds = contract["character"]["envelopeBounds"]
    env_x = tuple(bounds["x"])
    env_y = tuple(bounds["y"])

    if art.size != (cell_w, cell_h):
        failures.append(f"canvas is {art.width}x{art.height} art px, contract says {cell_w}x{cell_h}")
        return failures

    pixels = art.load()
    opaque: set[tuple[int, int]] = set()
    off_palette: dict[tuple[int, int, int], int] = {}
    partial_alpha = 0

    for y in range(art.height):
        for x in range(art.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if a != 255:
                partial_alpha += 1
                continue
            opaque.add((x, y))
            if (r, g, b) not in palette:
                off_palette[(r, g, b)] = off_palette.get((r, g, b), 0) + 1

    if not opaque:
        failures.append("frame is empty")
        return failures

    if partial_alpha:
        failures.append(f"{partial_alpha} px have partial alpha; art must be fully opaque or fully clear")

    if off_palette:
        worst = sorted(off_palette.items(), key=lambda kv: -kv[1])[:3]
        shown = ", ".join(f"#{r:02X}{g:02X}{b:02X}x{n}" for (r, g, b), n in worst)
        failures.append(f"{sum(off_palette.values())} px in {len(off_palette)} colours outside the palette ({shown})")

    xs = [x for x, _ in opaque]
    ys = [y for _, y in opaque]
    left, right, top, bottom = min(xs), max(xs), min(ys), max(ys)

    if left < env_x[0] or right > env_x[1] or top < env_y[0] or bottom > env_y[1]:
        failures.append(
            f"pose leaves the envelope: bounds x[{left},{right}] y[{top},{bottom}], "
            f"allowed x[{env_x[0]},{env_x[1]}] y[{env_y[0]},{env_y[1]}]"
        )

    if bottom > baseline:
        failures.append(f"lowest pixel is row {bottom}, below the baseline at {baseline}")

    orphans = 0
    for x, y in opaque:
        colour = pixels[x, y]
        if not any(
            (x + dx, y + dy) in opaque and pixels[x + dx, y + dy] == colour
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
        ):
            orphans += 1
    rate = orphans / len(opaque)
    if rate > max_orphan:
        failures.append(f"orphan-pixel rate {rate:.1%} exceeds the {max_orphan:.0%} ceiling ({orphans}/{len(opaque)} px)")

    sizes = connected_components(opaque)
    stray = sum(1 for size in sizes[1:] if size <= 2)
    if stray:
        failures.append(f"{stray} stray fragments of 1-2 px float off the silhouette")

    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("frames_dir", type=Path)
    parser.add_argument("--contract", type=Path, default=DEFAULT_CONTRACT)
    parser.add_argument("--grid-step", type=int, default=1)
    args = parser.parse_args()

    if not args.frames_dir.is_dir():
        print(f"error: {args.frames_dir} is not a directory", file=sys.stderr)
        return 1
    contract = json.loads(args.contract.read_text())
    clips = {clip["id"]: clip for clip in contract["clips"]}
    baseline = contract["cell"]["baseline"]

    failed_frames = 0
    checked = 0
    clip_bottoms: dict[str, list[int]] = {}

    for clip_dir in sorted(p for p in args.frames_dir.iterdir() if p.is_dir()):
        clip = clips.get(clip_dir.name)
        frames = sorted(clip_dir.glob(f"{clip_dir.name}-[0-9][0-9].png"))
        if not frames:
            continue
        if clip and len(frames) != clip["v2Frames"]:
            print(f"FAIL {clip_dir.name}: {len(frames)} frames, contract says {clip['v2Frames']}")
            failed_frames += 1

        for path in frames:
            art = load_art(path, args.grid_step)
            failures = check_frame(path, art, contract, clip)
            checked += 1
            bbox = art.getbbox()
            if bbox:
                clip_bottoms.setdefault(clip_dir.name, []).append(bbox[3] - 1)
            if failures:
                failed_frames += 1
                print(f"FAIL {path.relative_to(args.frames_dir)}")
                for failure in failures:
                    print(f"       {failure}")

    for clip_id, bottoms in sorted(clip_bottoms.items()):
        clip = clips.get(clip_id)
        if not clip:
            continue
        if clip["grounded"]:
            if max(bottoms) != baseline:
                print(f"FAIL {clip_id}: no frame plants a foot on the baseline (lowest reaches {max(bottoms)}, needs {baseline})")
                failed_frames += 1
        else:
            spread = max(bottoms) - min(bottoms)
            if spread > 3:
                print(f"FAIL {clip_id}: airborne clip drifts {spread} px vertically; declare one offset and hold it")
                failed_frames += 1

    print(f"\nchecked {checked} frames at grid step {args.grid_step}; {failed_frames} failures")
    return 3 if failed_frames else 0


if __name__ == "__main__":
    raise SystemExit(main())
