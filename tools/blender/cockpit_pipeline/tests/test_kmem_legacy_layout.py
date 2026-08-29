import math
import unittest

from tools.blender.cockpit_pipeline.kmem_legacy_layout import (
    ANCHORS,
    CONCOURSE_SOURCE_TRANSFORMS,
    GROUND_SURFACES,
    TERMINAL_CANOPY,
    ground_track_pavement_shoulder,
    ramp_start_windshield_coverage,
    route_camera_pose,
    terminal_canopy_parts,
    terminal_canopy_world_bounds,
    validate_layout,
)

# The east-side composition retired on 2026-08-28: every piece sat behind the
# ramp-start windshield (bearings +50 to +163 off the nose), so the terminal was
# invisible at neutral seat look in the actual game camera.
RETIRED_EAST_TRANSFORMS = {
    "ConcourseB.obj": {"location": (90.0, -80.0, 0.0), "rotation_z_degrees": 0.0},
    "ConcourseB_2.obj": {"location": (90.0, 40.0, 0.0), "rotation_z_degrees": 90.0},
    "ConcourseB_2e.obj": {"location": (90.0, -180.0, 0.0), "rotation_z_degrees": 90.0},
}

# The pre-repair ground set: the taxi surface never reached the hold-short leg
# at X = -120, so the aircraft taxied over void from roughly Y 163 to the runway.
RETIRED_GROUND_SURFACES = (
    {"name": "KMEM_RAMP", "center": (0.0, 0.0, -0.75), "dimensions": (180.0, 180.0, 1.5)},
    {"name": "KMEM_TAXI_SURFACE", "center": (-72.5, 122.5, -0.70), "dimensions": (44.0, 215.0, 1.4)},
    {"name": "KMEM_RUNWAY_SURFACE", "center": (-120.0, 475.0, -0.72), "dimensions": (62.0, 500.0, 1.44)},
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

    def test_west_frontage_composition_is_authored_exactly(self):
        self.assertEqual(
            CONCOURSE_SOURCE_TRANSFORMS,
            {
                "ConcourseB.obj": {"location": (-242.0, 250.0, 0.0), "rotation_z_degrees": 0.0},
                "ConcourseB_2.obj": {"location": (-200.0, 385.0, 0.0), "rotation_z_degrees": 90.0},
                "ConcourseB_2e.obj": {"location": (18.0, 118.0, 0.0), "rotation_z_degrees": 116.0},
            },
        )

    def test_ground_surfaces_include_terminal_apron_and_keep_stable_names(self):
        self.assertEqual(
            [surface["name"] for surface in GROUND_SURFACES],
            ["KMEM_RAMP", "KMEM_TAXI_SURFACE", "KMEM_RUNWAY_SURFACE", "KMEM_TERMINAL_APRON"],
        )

    def test_ground_track_rides_pavement_with_shoulder(self):
        shoulder = ground_track_pavement_shoulder()
        self.assertGreaterEqual(shoulder, 12.0)

    def test_retired_ground_set_left_the_hold_short_leg_over_void(self):
        shoulder = ground_track_pavement_shoulder(ground_surfaces=RETIRED_GROUND_SURFACES)
        self.assertLess(shoulder, 0.0)
        errors = validate_layout(ground_surfaces=RETIRED_GROUND_SURFACES)
        self.assertTrue(any("pavement" in error for error in errors))

    def test_ramp_start_windshield_sees_the_terminal_at_every_width(self):
        coverage = ramp_start_windshield_coverage()
        self.assertGreaterEqual(coverage["wide-1440"], 0.5)
        self.assertGreaterEqual(coverage["narrow-768"], 0.5)
        self.assertGreaterEqual(coverage["narrow-375"], 0.6)

    def test_retired_east_composition_is_rejected_as_invisible(self):
        coverage = ramp_start_windshield_coverage(source_transforms=RETIRED_EAST_TRANSFORMS)
        self.assertEqual(coverage["narrow-375"], 0.0)
        errors = validate_layout(source_transforms=RETIRED_EAST_TRANSFORMS)
        self.assertTrue(any("windshield" in error for error in errors))

    def test_building_inside_route_corridor_is_rejected(self):
        blocking = dict(CONCOURSE_SOURCE_TRANSFORMS)
        blocking["ConcourseB_2e.obj"] = {"location": (-60.0, 120.0, 0.0), "rotation_z_degrees": 30.0}
        errors = validate_layout(source_transforms=blocking)
        self.assertTrue(any("route corridor" in error for error in errors))

    def test_building_on_maneuvering_pavement_is_rejected(self):
        on_taxiway = dict(CONCOURSE_SOURCE_TRANSFORMS)
        on_taxiway["ConcourseB.obj"] = {"location": (-95.0, 125.0, 0.0), "rotation_z_degrees": 0.0}
        errors = validate_layout(source_transforms=on_taxiway)
        self.assertTrue(any("maneuvering pavement" in error for error in errors))

    def test_terminal_canopy_builds_eight_martini_glass_modules(self):
        parts = terminal_canopy_parts()
        wings = [part for part in parts if part["kind"] == "wing"]
        columns = [part for part in parts if part["kind"] == "column"]
        self.assertEqual(len(wings), 16)
        self.assertEqual(len(columns), 8)
        tilt = math.atan2(
            TERMINAL_CANOPY["tip_z"] - TERMINAL_CANOPY["valley_z"],
            TERMINAL_CANOPY["module_half_width"],
        )
        for wing in wings:
            self.assertAlmostEqual(abs(wing["rotation_x_radians"]), tilt, places=6)
        self.assertEqual(sum(1 for wing in wings if wing["rotation_x_radians"] > 0), 8)

    def test_terminal_canopy_stays_over_the_main_block(self):
        bounds = terminal_canopy_world_bounds()
        # Main block footprint: X -298.5..-185.5, Y 148.8..375.1; 2 m eave overhang allowed.
        self.assertGreaterEqual(bounds["min"][0], -300.5)
        self.assertLessEqual(bounds["max"][0], -183.5)
        self.assertGreaterEqual(bounds["min"][1], 146.8)
        self.assertLessEqual(bounds["max"][1], 377.1)
        self.assertAlmostEqual(bounds["min"][2], 11.07, places=2)
        self.assertGreater(bounds["max"][2], TERMINAL_CANOPY["tip_z"])
        self.assertEqual(validate_layout(), [])

    def test_displaced_canopy_is_rejected(self):
        adrift = dict(TERMINAL_CANOPY)
        adrift["x_range"] = (-200.0, -154.0)
        errors = validate_layout(terminal_canopy=adrift)
        self.assertTrue(any("canopy" in error for error in errors))

    def test_route_camera_pose_matches_measured_ramp_start_rig(self):
        pose = route_camera_pose(0.0)
        for actual, expected in zip(pose["position"], (2.073, -2.531, 3.20), strict=True):
            self.assertAlmostEqual(actual, expected, places=2)
        for actual, expected in zip(pose["forward"], (-0.5436, 0.7460, -0.385), strict=True):
            self.assertAlmostEqual(actual, expected, places=2)
        for actual, expected in zip(pose["up"], (-0.2267, 0.3115, 0.923), strict=True):
            self.assertAlmostEqual(actual, expected, places=2)


if __name__ == "__main__":
    unittest.main()
