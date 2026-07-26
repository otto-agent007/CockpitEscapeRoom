#!/usr/bin/env python3
"""Build deterministic runtime layers from the owner-approved TMB2 logo."""

from __future__ import annotations

import hashlib
import shutil
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art-source/intro/tmb2/owner-approved/TMB2logo.png"
OUTPUT_ROOT = ROOT / "public/images/intro/tmb2/logo"
EXPECTED_SHA256 = "673d13b96bc19b35b508630d1d662d16672ac4bb6ad665a7f6b1b7cee992ce17"
EXPECTED_BYTES = 811_581
SOURCE_SIZE = (1659, 948)
LOGO_CROP = (105, 261, 1573, 663)
IDENT_SIZE = (288, 79)
STAGE_SIZE = (320, 224)
PRODUCTIONS_Y = 168
PRODUCTIONS_CELL = 1
PRODUCTIONS_TRACKING = 1
PRODUCTIONS_COLOR = (224, 175, 74, 255)
PRODUCTIONS_SHADOW = (61, 42, 14, 190)

BITMAP_FONT = {
    "P": ("11110", "10001", "10001", "11110", "10000", "10000", "10000"),
    "R": ("11110", "10001", "10001", "11110", "10100", "10010", "10001"),
    "O": ("01110", "10001", "10001", "10001", "10001", "10001", "01110"),
    "D": ("11110", "10001", "10001", "10001", "10001", "10001", "11110"),
    "U": ("10001", "10001", "10001", "10001", "10001", "10001", "01110"),
    "C": ("01111", "10000", "10000", "10000", "10000", "10000", "01111"),
    "T": ("11111", "00100", "00100", "00100", "00100", "00100", "00100"),
    "I": ("11111", "00100", "00100", "00100", "00100", "00100", "11111"),
    "N": ("10001", "11001", "11001", "10101", "10011", "10011", "10001"),
    "S": ("01111", "10000", "10000", "01110", "00001", "00001", "11110"),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_source() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing owner-approved TMB2 logo: {SOURCE}")
    if SOURCE.stat().st_size != EXPECTED_BYTES:
        raise RuntimeError(f"TMB2 logo byte count changed: {SOURCE.stat().st_size}")
    if sha256(SOURCE) != EXPECTED_SHA256:
        raise RuntimeError("TMB2 logo SHA-256 does not match the approved authority.")
    with Image.open(SOURCE) as image:
        if image.size != SOURCE_SIZE:
            raise RuntimeError(f"TMB2 logo dimensions changed: {image.size}")


def save_rgba(image: Image.Image, name: str) -> None:
    image.save(
        OUTPUT_ROOT / name,
        format="PNG",
        optimize=False,
        compress_level=9,
    )


def build_logo_layers() -> None:
    with Image.open(SOURCE) as source:
        ident = (
            source.convert("RGB")
            .crop(LOGO_CROP)
            .resize(IDENT_SIZE, Image.Resampling.LANCZOS)
        )

    base_pixels: list[tuple[int, int, int, int]] = []
    blue_pixels: list[tuple[int, int, int, int]] = []
    highlight_pixels: list[tuple[int, int, int, int]] = []
    for red, green, blue in ident.getdata():
        intensity = max(red, green, blue)
        alpha = 0 if intensity <= 4 else min(255, round(intensity * 1.16))
        is_highlight = alpha > 0 and (
            (red >= 168 and green >= 168 and blue >= 168)
            or (red >= 172 and green >= 118 and blue <= 116)
        )
        is_blue = alpha > 0 and not is_highlight and blue >= red and blue >= green
        base_pixels.append((red, green, blue, alpha))
        blue_pixels.append((red, green, blue, alpha if is_blue else 0))
        highlight_pixels.append((red, green, blue, alpha if is_highlight else 0))

    for name, pixels in (
        ("tmb2-ident-base.png", base_pixels),
        ("tmb2-ident-blue-mask.png", blue_pixels),
        ("tmb2-ident-highlight-mask.png", highlight_pixels),
    ):
        layer = Image.new("RGBA", IDENT_SIZE)
        layer.putdata(pixels)
        save_rgba(layer, name)


def build_productions_layer() -> None:
    label = "PRODUCTIONS"
    cell = PRODUCTIONS_CELL
    glyph_width = 5 * cell
    tracking = PRODUCTIONS_TRACKING
    label_width = len(label) * glyph_width + (len(label) - 1) * tracking
    origin_x = (STAGE_SIZE[0] - label_width) // 2
    layer = Image.new("RGBA", STAGE_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for character_index, character in enumerate(label):
        glyph = BITMAP_FONT[character]
        glyph_x = origin_x + character_index * (glyph_width + tracking)
        for row_index, row in enumerate(glyph):
            for column_index, value in enumerate(row):
                if value != "1":
                    continue
                x = glyph_x + column_index * cell
                y = PRODUCTIONS_Y + row_index * cell
                draw.rectangle(
                    (x + 1, y + 1, x + cell, y + cell),
                    fill=PRODUCTIONS_SHADOW,
                )
                draw.rectangle(
                    (x, y, x + cell - 1, y + cell - 1),
                    fill=PRODUCTIONS_COLOR,
                )
    save_rgba(layer, "tmb2-productions.png")


def main() -> None:
    verify_source()
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    runtime_source = OUTPUT_ROOT / "tmb2-ident-source.png"
    shutil.copyfile(SOURCE, runtime_source)
    if sha256(runtime_source) != EXPECTED_SHA256:
        raise RuntimeError("Runtime TMB2 source copy is not byte-identical.")
    build_logo_layers()
    build_productions_layer()
    print(
        "Built TMB2 ident assets "
        f"(source {EXPECTED_SHA256}, crop 1468x402+105+261, ident 288x79)."
    )


if __name__ == "__main__":
    main()
