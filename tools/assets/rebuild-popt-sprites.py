#!/usr/bin/env python3
"""Rebuild every deployed Pop T sprite from its generated source.

Reads `art-source/intro/tmb2/scramble/sprite-sources.json`, which records which
sheet (and which pose within it) each sprite comes from and the exact size it
must come out at, because `POPT_CLIPS` declares a fixed frame size and a
hand-measured pivot per sprite.

Run after changing the normaliser, then:
  python3 tools/assets/deploy-scramble-intro.py
  node tools/assets/build-intro-manifest.mjs && npm run assets:check

Two sprites are deliberately absent and are never touched here: `spr-popt-cap`
(the cap cut out of the airborne pose) and `spr-popt-gag-lookup`. No generated
source reproduces either — they were derived by hand from other sprites.
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRAMBLE = ROOT / 'art-source/intro/tmb2/scramble'
NORMALISE = ROOT / 'tools/assets/normalise-scramble-sprite.py'
SLICE = ROOT / 'tools/assets/slice-scramble-sheet.py'


def main() -> None:
    config = json.loads((SCRAMBLE / 'sprite-sources.json').read_text())
    coverage = str(config['coverage'])
    sheets = sorted({entry['sheet'] for entry in config['sprites'] if 'sheet' in entry})

    with tempfile.TemporaryDirectory() as work:
        cut = {}
        for sheet in sheets:
            prefix = Path(work) / sheet
            subprocess.run(
                [sys.executable, str(SLICE), str(SCRAMBLE / f'generated/{sheet}.png'),
                 str(prefix), '--expect', '6'],
                check=True, capture_output=True,
            )
            cut[sheet] = [Path(f'{prefix}-{index + 1}.png') for index in range(6)]

        for entry in config['sprites']:
            source = (cut[entry['sheet']][entry['slice'] - 1] if 'sheet' in entry
                      else SCRAMBLE / f'generated/{entry["single"]}.png')
            out = SCRAMBLE / f'normalised/{entry["out"]}.png'
            entry_coverage = str(entry.get('coverage', coverage))
            subprocess.run(
                [sys.executable, str(NORMALISE), str(source), str(out),
                 '--target', entry['size'], '--coverage', entry_coverage],
                check=True, capture_output=True,
            )
            note = '' if entry_coverage == coverage else f'  (coverage {entry_coverage})'
            print(f'  {entry["out"]:24s} {entry["size"]:8s} <- {source.name}{note}')

    print(f'rebuilt {len(config["sprites"])} sprites at coverage {coverage}')


if __name__ == '__main__':
    main()
