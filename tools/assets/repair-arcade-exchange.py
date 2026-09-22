#!/usr/bin/env python3
"""Two exact, owner-authorized pixel repairs (2026-09-20), not a general hole filler.

The originals and all larger negative spaces remain unchanged. Each replacement
copies RGBA from the strongest immediately adjacent silhouette pixel.
"""
from hashlib import sha256
from pathlib import Path
import json

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ORACLE = ROOT / 'art-source/arcade/oracle'
REPAIRS = {
    'block': {
        'sha256': '4a85178d97ddd69c936e1f397f65d6381019aa35bc719e9bf33e02b2a7432947',
        'xy': (70, 34), 'rgba': (82, 62, 44, 125), 'neighbor': (69, 34),
    },
    'recoil': {
        'sha256': 'ea109535d3bec953ca182296e3756f6b678c03124767822d124bec11302646cb',
        'xy': (65, 94), 'rgba': (26, 27, 27, 142), 'neighbor': (66, 94),
    },
}


def source_path(pose):
    return ORACLE / 'normalised-exchange-v1-final' / pose / (pose + '-02.png')


def repair_pose(pose, output):
    change = REPAIRS[pose]
    source = source_path(pose)
    if sha256(source.read_bytes()).hexdigest() != change['sha256']:
        raise ValueError('Source changed: re-inspect rather than applying stale coordinates')
    with Image.open(source) as image:
        image.load()
        if image.mode != 'RGBA' or image.size != (128, 128):
            raise ValueError('Expected the inspected 128x128 RGBA source')
        if image.getpixel(change['xy']) != (0, 0, 0, 0):
            raise ValueError('Target is not the inspected transparent defect')
        if image.getpixel(change['neighbor']) != change['rgba']:
            raise ValueError('Replacement must match the inspected adjacent pixel')
        image.putpixel(change['xy'], change['rgba'])
        if output.exists():
            with Image.open(output) as existing:
                if existing.mode != image.mode or existing.size != image.size or existing.tobytes() != image.tobytes():
                    raise FileExistsError('Refusing to overwrite a different candidate')
        else:
            output.parent.mkdir(parents=True, exist_ok=True)
            image.save(output)
    return {
        'source': str(source.relative_to(ROOT)), 'source_sha256': change['sha256'],
        'output': str(output), 'output_sha256': sha256(output.read_bytes()).hexdigest(),
        'xy': change['xy'], 'before_rgba': (0, 0, 0, 0), 'after_rgba': change['rgba'],
    }


if __name__ == '__main__':
    print(json.dumps([repair_pose(pose, ORACLE / 'normalised-exchange-ready' / pose / (pose + '-00.png'))
                      for pose in REPAIRS], indent=2))
