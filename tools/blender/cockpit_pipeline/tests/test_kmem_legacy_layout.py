import unittest

from tools.blender.cockpit_pipeline.kmem_legacy_layout import (
    ANCHORS,
    CONCOURSE_SOURCE_TRANSFORMS,
    validate_layout,
)


class KmemLegacyLayoutTests(unittest.TestCase):
    def test_layout_has_unique_ordered_runtime_anchors(self):
        self.assertEqual(
            [entry["game_id"] for entry in ANCHORS],
            [
                "dc9.memphis.rampStart",
                "dc9.memphis.taxiTurn",
                "dc9.memphis.holdShort",
                "dc9.memphis.runwayLineup",
                "dc9.memphis.initialClimb",
            ],
        )
        self.assertEqual(validate_layout(), [])

    def test_only_three_approved_source_objects_are_assembled(self):
        self.assertEqual(
            sorted(CONCOURSE_SOURCE_TRANSFORMS),
            ["ConcourseB.obj", "ConcourseB_2.obj", "ConcourseB_2e.obj"],
        )
