#!/usr/bin/env python3
"""Normalise the generated Scramble finale plate and golden title plaque.

The cockpit plate follows the existing 320x224 full-stage contract. The plaque
uses the proven magenta-key sprite normaliser, pinned to its runtime 248x54 box
so the generated gold edge pixels stay deterministic.
"""

from pathlib import Path
import subprocess
import sys

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SCRAMBLE = ROOT / 'art-source/intro/tmb2/scramble'
GENERATED = SCRAMBLE / 'generated'
NORMALISED = SCRAMBLE / 'normalised'
SPRITE_NORMALISER = ROOT / 'tools/assets/normalise-scramble-sprite.py'


def centre_crop_to_stage(source: Path, destination: Path) -> None:
    image = Image.open(source).convert('RGB')
    target_ratio = 320 / 224
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        crop_width = round(image.height * target_ratio)
        left = (image.width - crop_width) // 2
        image = image.crop((left, 0, left + crop_width, image.height))
    elif source_ratio < target_ratio:
        crop_height = round(image.width / target_ratio)
        top = (image.height - crop_height) // 2
        image = image.crop((0, top, image.width, top + crop_height))
    image.resize((320, 224), Image.Resampling.BOX).save(destination)


def main() -> None:
    NORMALISED.mkdir(parents=True, exist_ok=True)
    plate_out = NORMALISED / 'plate-right-seat-glow-320.png'
    plaque_out = NORMALISED / 'title-plaque-gold.png'
    centre_crop_to_stage(GENERATED / 's17-plate-right-seat-glow.png', plate_out)
    subprocess.run([
        sys.executable,
        str(SPRITE_NORMALISER),
        str(GENERATED / 's17-title-plaque-gold.png'),
        str(plaque_out),
        '--target',
        '248x54',
    ], check=True)
    print(f'{plate_out}: 320x224')
    print(f'{plaque_out}: 248x54')


if __name__ == '__main__':
    main()
