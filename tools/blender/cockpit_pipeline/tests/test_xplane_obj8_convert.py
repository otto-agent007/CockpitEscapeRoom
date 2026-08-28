from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.blender.cockpit_pipeline.xplane_obj8_convert import (
    build_report,
    draw_range_datarefs,
    parse_obj8,
    partition_draw_ranges,
    transform_point,
    xplane_to_blender_matrix,
)
from tools.blender.inspect_dc9_memphis_source import selected_source_names


class XPlaneObj8ConvertTests(unittest.TestCase):
    def test_kmem_source_inspector_admits_only_concourse_b_objects(self) -> None:
        self.assertEqual(
            selected_source_names(),
            (
                "ConcourseB.obj",
                "ConcourseB_2.obj",
                "ConcourseB_2e.obj",
            ),
        )

    def write_fixture(self, body: str) -> Path:
        temporary = tempfile.NamedTemporaryFile("w", suffix=".obj", delete=False, encoding="utf-8")
        temporary.write("I\n800\nOBJ\n" + body)
        temporary.close()
        self.addCleanup(Path(temporary.name).unlink)
        return Path(temporary.name)

    def test_parses_index_and_draw_tables(self) -> None:
        path = self.write_fixture(
            "TEXTURE panel.png\n"
            "POINT_COUNTS 3 0 0 3\n"
            "VT 0 0 0 0 1 0 0 0\nVT 1 0 0 0 1 0 1 0\nVT 0 1 0 0 1 0 0 1\n"
            "IDX 0\nIDX 1\nIDX 2\nTRIS 0 3\n"
        )
        parsed = parse_obj8(path)
        self.assertEqual(len(parsed.vertices), 3)
        self.assertEqual(parsed.indices, [0, 1, 2])
        self.assertEqual(build_report(parsed)["triangleCount"], 1)

    def test_applies_nested_default_pose_transforms(self) -> None:
        path = self.write_fixture(
            "TEXTURE panel.png\nPOINT_COUNTS 3 0 0 3\n"
            "VT 0 0 0 0 1 0 0 0\nVT 1 0 0 0 1 0 1 0\nVT 0 1 0 0 1 0 0 1\n"
            "IDX10 0 1 2\n"
            "ANIM_begin\nANIM_trans 1 0 0 1 0 0 0 0 no_ref\n"
            "ANIM_rotate 0 1 0 0 90 0 1 sim/test\nTRIS 0 3\nANIM_end\n"
        )
        parsed = parse_obj8(path, {"sim/test": 1.0})
        report = build_report(parsed)
        self.assertEqual(report["poseValues"], {"sim/test": 1.0})
        self.assertEqual(report["drawRangeCount"], 1)
        self.assertEqual(draw_range_datarefs(parsed.draws[0]), ("sim/test",))
        self.assertEqual(parsed.draws[0].animation_channels[-1].keys, ((0.0, (0.0,)), (1.0, (90.0,))))

    def test_keyed_animation_defaults_to_first_key_and_reports_it(self) -> None:
        path = self.write_fixture(
            "TEXTURE panel.png\nPOINT_COUNTS 3 0 0 3\n"
            "VT 0 0 0 0 1 0 0 0\nVT 1 0 0 0 1 0 1 0\nVT 0 1 0 0 1 0 0 1\n"
            "IDX10 0 1 2\nANIM_begin\nANIM_rotate_begin 0 1 0 sim/unknown\n"
            "ANIM_rotate_key 2 10\nANIM_rotate_key 4 30\nANIM_rotate_end\nTRIS 0 3\nANIM_end\n"
        )
        parsed = parse_obj8(path)
        self.assertEqual(parsed.pose_defaults, {"sim/unknown": 2.0})

    def test_coordinate_conversion_is_right_handed_and_meter_preserving(self) -> None:
        converted = transform_point(xplane_to_blender_matrix(), (2.0, 3.0, 4.0))
        self.assertEqual(converted, (2.0, -4.0, 3.0))

    def test_reports_degenerate_source_triangles(self) -> None:
        path = self.write_fixture(
            "TEXTURE panel.png\nPOINT_COUNTS 3 0 0 3\n"
            "VT 0 0 0 0 1 0 0 0\nVT 1 0 0 0 1 0 1 0\nVT 2 0 0 0 1 0 0 1\n"
            "IDX10 0 1 2\nTRIS 0 3\n"
        )
        report = build_report(parse_obj8(path))
        self.assertEqual(report["degenerateTriangleCount"], 1)
        self.assertEqual(report["renderTriangleCount"], 0)

    def test_rejects_invalid_triangle_range(self) -> None:
        path = self.write_fixture(
            "TEXTURE panel.png\nPOINT_COUNTS 3 0 0 3\n"
            "VT 0 0 0 0 1 0 0 0\nVT 1 0 0 0 1 0 1 0\nVT 0 1 0 0 1 0 0 1\n"
            "IDX10 0 1 2\nTRIS 1 3\n"
        )
        with self.assertRaisesRegex(ValueError, "Invalid TRIS range"):
            parse_obj8(path)

    def test_skips_draw_disabled_manipulator_geometry(self) -> None:
        path = self.write_fixture(
            "TEXTURE panel.png\nPOINT_COUNTS 6 0 0 6\n"
            "VT 0 0 0 0 1 0 0 0\nVT 1 0 0 0 1 0 1 0\nVT 0 1 0 0 1 0 0 1\n"
            "VT 2 0 0 0 1 0 0 0\nVT 3 0 0 0 1 0 1 0\nVT 2 1 0 0 1 0 0 1\n"
            "IDX10 0 1 2 3 4 5\n"
            "ATTR_draw_disable\nTRIS 0 3\nATTR_draw_enable\nTRIS 3 3\n"
        )
        parsed = parse_obj8(path)
        self.assertEqual([(draw.offset, draw.count) for draw in parsed.draws], [(3, 3)])
        self.assertEqual(parsed.ignored_directives, {"ATTR_draw_disable": 1, "ATTR_draw_enable": 1})

    def test_captures_manipulator_and_assigns_draw_ownership(self) -> None:
        path = self.write_fixture(
            "TEXTURE panel.png\nPOINT_COUNTS 6 0 0 6\n"
            "VT 0 0 0 0 1 0 0 0\nVT 1 0 0 0 1 0 1 0\nVT 0 1 0 0 1 0 0 1\n"
            "VT 2 0 0 0 1 0 0 0\nVT 3 0 0 0 1 0 1 0\nVT 2 1 0 0 1 0 0 1\n"
            "IDX10 0 1 2 3 4 5\nANIM_begin\n"
            "ANIM_trans 1 2 3 1 2 3 0 0 none\n"
            "ANIM_rotate_begin 1 0 0 sim/cockpit2/electrical/APU_starter_switch\n"
            "ANIM_rotate_key 0 -20\nANIM_rotate_key 1 0\nANIM_rotate_key 2 20\nANIM_rotate_end\n"
            "ATTR_manip_drag_axis hand 0.05 0.05 0 2 0 sim/cockpit2/electrical/APU_starter_switch\n"
            "TRIS 0 3\nATTR_manip_none\nTRIS 3 3\nANIM_end\n"
        )
        parsed = parse_obj8(path, {"sim/cockpit2/electrical/APU_starter_switch": 1})
        self.assertEqual(parsed.draws[0].manipulator.dataref, "sim/cockpit2/electrical/APU_starter_switch")
        self.assertEqual(parsed.draws[0].animation_channels[-1].pivot, (1.0, -3.0, 2.0))
        selected, static = partition_draw_ranges(parsed, {"sim/cockpit2/electrical/APU_starter_switch"})
        self.assertEqual(selected, [0, 1])
        self.assertEqual(static, [])
        self.assertFalse(set(selected).intersection(static))


if __name__ == "__main__":
    unittest.main()
