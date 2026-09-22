#!/usr/bin/env python3
"""Owner-authorized single-pixel Booster contact repair; originals are immutable."""
from pathlib import Path
from hashlib import sha256
import json
import argparse
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'art-source/arcade/booster/normalised-heavy-continuity-v2-c2/heavy-active/heavy-active-00.png'


def repair(output, variant='v2'):
    if variant == 'v2':
        source, target, neighbor, rgba = SOURCE, (70, 31), (70, 32), (19, 19, 18, 97)
        expected_hash = '6c97f32e104f3f5831ea76051045720467e1d5f10b5f1f5f0ffa29e5d9dd6cb9'
    elif variant == 'v3':
        source = ROOT / 'art-source/arcade/booster/normalised-heavy-contact-v3-c2/heavy-active/heavy-active-00.png'
        target, neighbor, rgba = (74, 67), (74, 66), (10, 9, 9, 142)
        expected_hash = '589fb8db326987be5d9baf2d12f5fe52b27bd99e23309823fff8226605a6017b'
    else:
        raise ValueError('Only the two explicitly owner-authorized repairs are supported')
    if sha256(source.read_bytes()).hexdigest() != expected_hash:
        raise ValueError('Source changed; re-inspect rather than applying stale coordinates')
    with Image.open(source) as image:
        image.load()
        if image.mode != 'RGBA' or image.size != (128, 128):
            raise ValueError('Expected inspected 128x128 RGBA source')
        if image.getpixel(target) != (0, 0, 0, 0) or image.getpixel(neighbor) != rgba:
            raise ValueError('Inspected target or adjacent replacement changed')
        image.putpixel(target, rgba)
        if output.exists():
            with Image.open(output) as existing:
                if existing.mode != image.mode or existing.size != image.size or existing.tobytes() != image.tobytes():
                    raise FileExistsError('Refusing to overwrite a different image')
        else:
            output.parent.mkdir(parents=True, exist_ok=True)
            image.save(output)
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--variant', choices=['v2', 'v3'], default='v2')
    variant = parser.parse_args().variant
    folder = 'normalised-heavy-continuity-repaired' if variant == 'v2' else 'normalised-heavy-contact-v3-repaired'
    output = repair(ROOT / 'art-source/arcade/booster' / folder / 'heavy-active/heavy-active-00.png', variant)
    print(json.dumps({'variant': variant, 'output': str(output.relative_to(ROOT)),
                      'output_sha256': sha256(output.read_bytes()).hexdigest()}, indent=2))
