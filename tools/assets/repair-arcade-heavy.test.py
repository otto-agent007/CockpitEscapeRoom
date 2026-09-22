"""Prove the authorized repair changes only (70,31) and preserves its source."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
import numpy as np
from PIL import Image

spec = importlib.util.spec_from_file_location('repair', Path(__file__).with_name('repair-arcade-heavy.py'))
repair = importlib.util.module_from_spec(spec)
spec.loader.exec_module(repair)


class HeavyPixelRepairTests(unittest.TestCase):
    def test_exactly_authorized_pixel_changes(self):
        original = repair.SOURCE.read_bytes()
        before = np.array(Image.open(repair.SOURCE))
        with tempfile.TemporaryDirectory(prefix='arcade-heavy-pixel-') as tmp:
            output = Path(tmp) / 'active.png'
            result = repair.repair(output)
            after = np.array(Image.open(result))
            rows, cols = np.where(np.any(before != after, axis=2))
            self.assertEqual(list(zip(cols, rows)), [(70, 31)])
            self.assertEqual(tuple(after[31, 70]), (19, 19, 18, 97))
            self.assertEqual(repair.SOURCE.read_bytes(), original)
            self.assertEqual(repair.repair(output), output)

    def test_refuses_overwriting_different_image(self):
        with tempfile.TemporaryDirectory(prefix='arcade-heavy-pixel-') as tmp:
            output = Path(tmp) / 'existing.png'
            Image.new('RGBA', (128, 128), (1, 2, 3, 255)).save(output)
            original = output.read_bytes()
            with self.assertRaises(FileExistsError):
                repair.repair(output)
            self.assertEqual(output.read_bytes(), original)

    def test_v3_changes_only_newly_authorized_pixel(self):
        source = repair.ROOT / 'art-source/arcade/booster/normalised-heavy-contact-v3-c2/heavy-active/heavy-active-00.png'
        original = source.read_bytes()
        before = np.array(Image.open(source))
        with tempfile.TemporaryDirectory(prefix='arcade-heavy-v3-pixel-') as tmp:
            output = Path(tmp) / 'active.png'
            after = np.array(Image.open(repair.repair(output, 'v3')))
            rows, cols = np.where(np.any(before != after, axis=2))
            self.assertEqual(list(zip(cols, rows)), [(74, 67)])
            self.assertEqual(tuple(after[67, 74]), (10, 9, 9, 142))
            self.assertEqual(source.read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
