#!/usr/bin/env python3
"""Derive the intro finale emblem card from the authoritative storyboard.

Panel 8 of the owner-approved blonde-haired Pop T storyboard is the
winged-globe emblem on near-black. This script crops it deterministically,
paints out the storyboard's blue "8" corner chip, trims to the emblem's
luminance bounds, and downsamples once to the exact runtime display size so
the renderer never resamples the card at scale 1.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art-source/intro/tmb2/recovered/2026-07-19-storyboards/pilot Pop T with golden blond hair and blue eyes.png"
EXPECTED_SHA256 = "0f9b2fed22597380c926028d39bf1c33470b32c42a7a59bbba335f1642f8b7d2"
SOURCE_SIZE = (1672, 941)

# Panel 8 content box inside the storyboard sheet, excluding the blue frame.
PANEL_CROP = (1237, 474, 1652, 919)
# The storyboard's "8" chip inside the panel crop; filled with the sampled
# panel background. Faint sparkle noise inside this box is sacrificed.
CHIP_BOX = (0, 0, 44, 30)
CHIP_FILL = (1, 1, 3)
# Emblem luminance bounds inside the panel crop (measured 2026-08-14): the
# glow spans the full width and ends at row 265; 12 rows of pad keep the
# lowest ray tips.
EMBLEM_CROP = (0, 0, 415, 278)
# Exact runtime display size (stage is 320x224; the card renders at scale 1).
CARD_SIZE = (248, 166)

OUTPUT_RUNTIME = ROOT / "public/images/intro/tmb2/emblem/finale-card.png"
OUTPUT_SOURCE = ROOT / "art-source/intro/tmb2/derived/emblem/finale-card.png"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_source() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing authoritative storyboard: {SOURCE}")
    if sha256(SOURCE) != EXPECTED_SHA256:
        raise RuntimeError("Storyboard SHA-256 does not match the recorded authority.")
    with Image.open(SOURCE) as image:
        if image.size != SOURCE_SIZE:
            raise RuntimeError(f"Storyboard dimensions changed: {image.size}")


def build_card() -> Image.Image:
    with Image.open(SOURCE) as source:
        panel = source.convert("RGB").crop(PANEL_CROP)
    panel.paste(CHIP_FILL, CHIP_BOX)
    emblem = panel.crop(EMBLEM_CROP)
    return emblem.resize(CARD_SIZE, Image.Resampling.LANCZOS)


def main() -> None:
    verify_source()
    card = build_card()
    for output in (OUTPUT_RUNTIME, OUTPUT_SOURCE):
        output.parent.mkdir(parents=True, exist_ok=True)
        card.save(output, format="PNG", optimize=False, compress_level=9)
        print(f"{output.relative_to(ROOT)}: {output.stat().st_size} bytes "
              f"{card.size[0]}x{card.size[1]} sha256={sha256(output)}")


if __name__ == "__main__":
    main()
