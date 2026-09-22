"""Owner-approved two-pixel repair: reject drift and prove no collateral changes."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('repair', Path(__file__).with_name('repair-arcade-exchange.py'))
repair = importlib.util.module_from_spec(spec)
spec.loader.exec_module(repair)


class LocalizedRepairTests(unittest.TestCase):
    def test_exactly_one_pixel_changes_per_pose_and_sources_are_untouched(self):
        for pose, change in repair.REPAIRS.items():
            source = repair.source_path(pose)
            original = source.read_bytes()
            before = np.asarray(Image.open(source))
            with tempfile.TemporaryDirectory(prefix='arcade-pixel-') as tmp:
                output = Path(tmp) / (pose + '.png')
                repair.repair_pose(pose, output)
                after = np.asarray(Image.open(output))
                self.assertEqual(source.read_bytes(), original)
                rows, columns = np.where(np.any(before != after, axis=2))
                self.assertEqual(list(zip(columns, rows)), [change['xy']])
                x, y = change['xy']
                self.assertEqual(tuple(after[y, x]), change['rgba'])

    def test_refuses_to_overwrite_a_different_existing_candidate(self):
        with tempfile.TemporaryDirectory(prefix='arcade-pixel-') as tmp:
            output = Path(tmp) / 'existing.png'
            Image.new('RGBA', (128, 128), (1, 2, 3, 255)).save(output)
            original = output.read_bytes()
            with self.assertRaises(FileExistsError):
                repair.repair_pose('block', output)
            self.assertEqual(output.read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
