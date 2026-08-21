#!/usr/bin/env python3
"""Build deterministic runtime layers from the owner-approved TMB2 logo."""

from __future__ import annotations

import hashlib
import shutil
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art-source/intro/tmb2/owner-approved/TMB2logo.png"
OUTPUT_ROOT = ROOT / "public/images/intro/tmb2/logo"
EXPECTED_SHA256 = "673d13b96bc19b35b508630d1d662d16672ac4bb6ad665a7f6b1b7cee992ce17"
EXPECTED_BYTES = 811_581
SOURCE_SIZE = (1659, 948)
LOGO_CROP = (105, 261, 1573, 663)
IDENT_SIZE = (160, 44)


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


def main() -> None:
    verify_source()
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    runtime_source = OUTPUT_ROOT / "tmb2-ident-source.png"
    shutil.copyfile(SOURCE, runtime_source)
    if sha256(runtime_source) != EXPECTED_SHA256:
        raise RuntimeError("Runtime TMB2 source copy is not byte-identical.")
    build_logo_layers()
    print(
        "Built TMB2 ident assets "
        f"(source {EXPECTED_SHA256}, crop 1468x402+105+261, ident 160x44)."
    )


if __name__ == "__main__":
    main()
