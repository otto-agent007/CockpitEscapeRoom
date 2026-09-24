#!/usr/bin/env python3
"""Generate a short image-to-video clip of a Mars arcade fighter on a free Hugging Face Space.

Usage (from the tooling venv, see below):
    .cache/arcade-video-venv/bin/python tools/assets/generate-arcade-video.py <anchor.png> <out-dir>
        --prompt "..." [--space ltx|wan-flf] [--end-anchor <png>] [--duration 2.5]
        [--seed 42] [--chroma "#FF00FF"] [--size 512x768]

The video route: one clip of the fighter doing the move is consistent in identity,
scale and camera in a way separately generated poses never are. This tool is the
generation step; `pick-arcade-frames.py` chooses the drawings out of the clip and
`normalise-arcade-clip.py --align preserve-canvas` puts them on the cell.

Spaces (free, queued, no key; a HF token in `HF_TOKEN` lifts the ZeroGPU quota):
  ltx      Lightricks/ltx-video-distilled  — image-to-video, prompt-steered motion
  wan-flf  multimodalart/wan-2-2-first-last-frame — start AND end image: give the anchor as both
           for a cycle that returns to the stance, or a start pose and an end pose for a move

The anchor is composited onto a flat chroma field (the transparent generated anchor has no
background and video models paint one otherwise), resized to --size, and uploaded. The
returned MP4 is saved with a `generation.json` beside it recording the space, every
parameter, the seed the space reports, and the anchor's SHA-256 — provenance for the asset
report. Nothing here is a final drawing; the clip is a candidate.

Setup once:  uv venv .cache/arcade-video-venv && uv pip install --python .cache/arcade-video-venv/bin/python gradio_client pillow
Exit 0 on success, 1 on a usage error, 2 when the space fails or is unreachable.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover - environment guard
    print("error: Pillow is required (pip install Pillow)", file=sys.stderr)
    raise SystemExit(1)

SPACES = {
    "ltx": "Lightricks/ltx-video-distilled",
    "wan-flf": "multimodalart/wan-2-2-first-last-frame",
}
DEFAULT_NEGATIVE = (
    "worst quality, inconsistent motion, blurry, jittery, distorted, camera drift, zoom, "
    "duplicate body parts, extra limbs, palette drift, recolored costume, changed outfit, "
    "motion blur, smear frames, cinematic lighting, shadows on background, cast shadow, "
    "ground shadow, floor line, horizon, scenery, text, watermark"
)


def parse_chroma(text: str) -> tuple[int, int, int]:
    text = text.lstrip("#")
    if len(text) != 6:
        raise ValueError(f"chroma must be six hex digits, got {text}")
    return int(text[0:2], 16), int(text[2:4], 16), int(text[4:6], 16)


def prepare_anchor(path: Path, size: tuple[int, int], chroma: tuple[int, int, int], out: Path) -> Path:
    """Composite the anchor onto a flat chroma field at the generation size, keeping its scale."""
    image = Image.open(path).convert("RGBA")
    field = Image.new("RGBA", image.size, (*chroma, 255))
    field.alpha_composite(image)
    resized = field.convert("RGB").resize(size, Image.Resampling.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    resized.save(out)
    return out


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("anchor", type=Path)
    ap.add_argument("out_dir", type=Path)
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--negative-prompt", default=DEFAULT_NEGATIVE)
    ap.add_argument("--space", choices=tuple(SPACES), default="ltx")
    ap.add_argument("--end-anchor", type=Path, help="wan-flf: the last frame; defaults to the anchor itself (a cycle)")
    ap.add_argument("--duration", type=float, default=2.5, help="seconds")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--chroma", default="#FF00FF")
    ap.add_argument("--size", default="512x768", help="generation WIDTHxHEIGHT; multiples of 32")
    ap.add_argument("--guidance", type=float, default=1.0)
    ap.add_argument("--steps", type=float, default=8, help="wan-flf only")
    args = ap.parse_args()

    try:
        from gradio_client import Client, handle_file
    except ImportError:
        print("error: gradio_client is not installed; use the tooling venv (see the docstring)", file=sys.stderr)
        return 1

    if not args.anchor.is_file():
        print(f"error: {args.anchor} is not a file", file=sys.stderr)
        return 1
    try:
        width, height = (int(v) for v in args.size.lower().split("x"))
        chroma = parse_chroma(args.chroma)
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    if width % 32 or height % 32:
        print("error: --size must be multiples of 32", file=sys.stderr)
        return 1

    args.out_dir.mkdir(parents=True, exist_ok=True)
    start_png = prepare_anchor(args.anchor, (width, height), chroma, args.out_dir / "input-start.png")
    end_png = None
    if args.space == "wan-flf":
        end_png = prepare_anchor(args.end_anchor or args.anchor, (width, height), chroma, args.out_dir / "input-end.png")

    space = SPACES[args.space]
    started = time.time()
    record = {
        "space": space, "mode": args.space, "anchor": str(args.anchor), "anchorSha256": sha256(args.anchor),
        "endAnchor": str(args.end_anchor) if args.end_anchor else None,
        "prompt": args.prompt, "negativePrompt": args.negative_prompt, "duration": args.duration,
        "requestedSeed": args.seed, "chroma": args.chroma, "size": [width, height], "guidance": args.guidance,
        "startedAt": datetime.now(timezone.utc).isoformat(),
    }
    print(f"{space}: uploading {start_png.name} ({width}x{height}) and waiting in the queue…")
    try:
        # gradio_client renamed the token argument across versions; pass whichever exists.
        import inspect
        token_arg = "token" if "token" in inspect.signature(Client.__init__).parameters else "hf_token"
        client = Client(space, verbose=False, **({token_arg: os.environ["HF_TOKEN"]} if os.environ.get("HF_TOKEN") else {}))
        if args.space == "ltx":
            result = client.predict(
                prompt=args.prompt, negative_prompt=args.negative_prompt,
                input_image_filepath=handle_file(str(start_png)), input_video_filepath=None,
                height_ui=height, width_ui=width, mode="image-to-video",
                duration_ui=args.duration, ui_frames_to_use=9, seed_ui=args.seed, randomize_seed=False,
                ui_guidance_scale=args.guidance, improve_texture_flag=True, api_name="/image_to_video",
            )
        else:
            result = client.predict(
                start_image_pil=handle_file(str(start_png)), end_image_pil=handle_file(str(end_png)),
                prompt=args.prompt, negative_prompt=args.negative_prompt, duration_seconds=args.duration,
                steps=args.steps, guidance_scale=args.guidance, guidance_scale_2=args.guidance,
                seed=args.seed, randomize_seed=False, api_name="/generate_video",
            )
    except Exception as error:  # noqa: BLE001 - the space's failure modes are many and opaque
        record["error"] = str(error)[:1000]
        (args.out_dir / "generation.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
        print(f"error: {space} failed: {str(error)[:400]}", file=sys.stderr)
        return 2

    # Both spaces return the video first; LTX returns (video, seed), Wan (video, seed).
    video_part = result[0] if isinstance(result, (list, tuple)) else result
    video_path = video_part.get("video") if isinstance(video_part, dict) else video_part
    reported_seed = result[1] if isinstance(result, (list, tuple)) and len(result) > 1 else None
    dest = args.out_dir / "clip.mp4"
    shutil.copy2(video_path, dest)
    record.update({"seed": reported_seed, "video": str(dest), "seconds": round(time.time() - started, 1)})
    (args.out_dir / "generation.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {dest} (seed {reported_seed}) in {record['seconds']} s; provenance in generation.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
