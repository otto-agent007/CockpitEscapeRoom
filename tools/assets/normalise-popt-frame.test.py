#!/usr/bin/env python3
"""Regression for arcade sprite resampling; preserves the original intro export default.

Run: python3 tools/assets/normalise-popt-frame.test.py
"""

import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
NORMALISER = ROOT / 'tools/assets/normalise-popt-frame.py'
spec = importlib.util.spec_from_file_location('frame_gate', ROOT / 'tools/assets/check-popt-frames-fullcolour.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
CONTRACT_PATH = ROOT / 'asset-reports/mars-arcade-sprite-contract.json'
CONTRACT = json.loads(CONTRACT_PATH.read_text())
CASES = (
    ('booster', 'anchor-likeness-00.png', 'normalised-likeness', 1460),
    ('oracle', 'anchor-likeness-00.png', 'normalised-likeness', 1415),
    ('captain', 'anchor-00.png', 'normalised', 1455),
)


class SpriteResamplingTests(unittest.TestCase):
    def test_source_alpha_ignores_hidden_rgb_without_erasing_translucent_edges(self):
        with tempfile.TemporaryDirectory(prefix='arcade-alpha-') as tmp:
            source, output = Path(tmp) / 'source.png', Path(tmp) / 'output.png'
            pixels = np.full((128, 128, 4), [230, 20, 200, 0], dtype=np.uint8)
            pixels[16:120, 45:84] = [120, 90, 30, 255]
            pixels[16:120, 44] = [120, 90, 30, 128]
            Image.fromarray(pixels).save(source)
            result = subprocess.run([
                sys.executable, str(NORMALISER), str(source), str(output),
                '--contract', str(CONTRACT_PATH), '--source-px-per-cell-px', '1',
                '--resample', 'bilinear', '--source-alpha',
            ], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            actual = np.asarray(Image.open(output))
            self.assertEqual(gate.check(output, CONTRACT, standing=True), [])
            self.assertEqual(int(actual[16, 44, 3]), 128)
            self.assertTrue(np.all(actual[16, 44, :3] == [120, 90, 30]))
            self.assertEqual(int(actual[0, 0, 3]), 0)

    def export(self, fighter, filename, height, output, *options):
        source = ROOT / 'art-source/arcade' / fighter / 'generated' / filename
        original = source.read_bytes()
        result = subprocess.run([
            sys.executable, str(NORMALISER), str(source), str(output),
            '--contract', str(CONTRACT_PATH),
            '--source-px-per-cell-px', str(height / 104), *options,
        ], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(source.read_bytes(), original, 'normalisation changed the source image')

    def test_opt_in_export_preserves_valid_silhouettes_at_locked_scales(self):
        # Removing bilinear or routing it back to Lanczos reintroduces the real holes.
        with tempfile.TemporaryDirectory(prefix='arcade-resample-') as tmp:
            for fighter, filename, _, height in CASES:
                with self.subTest(fighter=fighter):
                    output = Path(tmp) / f'{fighter}.png'
                    self.export(fighter, filename, height, output, '--resample', 'bilinear')
                    self.assertEqual(gate.check(output, CONTRACT, standing=True), [])
                    if fighter == 'oracle':
                        mask = np.asarray(Image.open(output))[:, :, 3] > gate.ALPHA_ON
                        self.assertGreater(gate.interior_holes(mask, 2)[1], 0,
                                           'the drawn gap between the legs must remain')

    def test_torso_alignment_holds_the_body_still_when_only_the_legs_move(self):
        # A walk is drawn in place: the torso must land on the reference's back line
        # whatever the feet do, where feet alignment follows whichever foot is planted.
        def figure(foot_x: int) -> np.ndarray:
            pixels = np.zeros((128, 128, 4), dtype=np.uint8)
            pixels[10:70, 40:70] = [40, 40, 40, 255]      # torso, back edge at column 40
            pixels[70:118, 50:58] = [90, 90, 90, 255]     # planted leg
            pixels[70:100, foot_x:foot_x + 8] = [90, 90, 90, 255]  # swinging leg, lifted
            return pixels
        with tempfile.TemporaryDirectory(prefix='arcade-torso-') as tmp:
            ref_src, ref_out = Path(tmp) / 'ref.png', Path(tmp) / 'ref-cell.png'
            Image.fromarray(figure(60)).save(ref_src)
            common = ['--contract', str(CONTRACT_PATH), '--source-px-per-cell-px', '1',
                      '--resample', 'bilinear', '--source-alpha']
            subprocess.run([sys.executable, str(NORMALISER), str(ref_src), str(ref_out), *common], check=True,
                           capture_output=True)
            ref_back = np.where(np.asarray(Image.open(ref_out))[40, :, 3] > 8)[0].min()
            for foot_x in (20, 60, 95):
                with self.subTest(foot_x=foot_x):
                    src, out = Path(tmp) / f'walk-{foot_x}.png', Path(tmp) / f'walk-{foot_x}-cell.png'
                    Image.fromarray(figure(foot_x)).save(src)
                    result = subprocess.run([sys.executable, str(NORMALISER), str(src), str(out), *common,
                                             '--align', 'torso', '--torso-reference', str(ref_out)],
                                            capture_output=True, text=True)
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    cell = np.asarray(Image.open(out))[:, :, 3] > 8
                    self.assertEqual(np.where(cell[40])[0].min(), ref_back)
                    self.assertEqual(np.where(cell.any(axis=1))[0].max(), CONTRACT['cell']['baseline'])

    def test_torso_alignment_requires_a_reference(self):
        with tempfile.TemporaryDirectory(prefix='arcade-torso-') as tmp:
            src = Path(tmp) / 'src.png'
            Image.fromarray(np.full((128, 128, 4), 255, dtype=np.uint8)).save(src)
            result = subprocess.run([sys.executable, str(NORMALISER), str(src), str(Path(tmp) / 'o.png'),
                                     '--contract', str(CONTRACT_PATH), '--source-px-per-cell-px', '1',
                                     '--source-alpha', '--align', 'torso'], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('--torso-reference', result.stderr)
            self.assertNotIn('invalid choice', result.stderr)

    def test_default_export_remains_byte_identical(self):
        # Changing the default resampler would alter previously authored sprite exports.
        with tempfile.TemporaryDirectory(prefix='arcade-default-') as tmp:
            for fighter, filename, folder, height in CASES:
                with self.subTest(fighter=fighter):
                    output = Path(tmp) / f'{fighter}.png'
                    self.export(fighter, filename, height, output)
                    baseline = ROOT / 'art-source/arcade' / fighter / folder / 'anchor/anchor-00.png'
                    self.assertEqual(output.read_bytes(), baseline.read_bytes())


if __name__ == '__main__':
    unittest.main()
