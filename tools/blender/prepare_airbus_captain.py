"""Apply the canonical A320 captain-seat runtime contract to the shaded master."""

from __future__ import annotations

import math

import bpy


CAPTAIN_LOCATION = (-0.153815, -0.647877, 0.130133)
CAPTAIN_ROTATION = (1.367064, 0.0, -0.282213)
CAPTAIN_SIDESTICK_LOCATION = (-0.224475, -0.453081, 0.045670)
CAPTAIN_THRUST_LOCATION = (0.005000, -0.505764, 0.004800)
CAPTAIN_RADIO_LOCATION = (-0.045000, -0.464842, 0.011798)


def parent_to_root(obj: bpy.types.Object) -> None:
    root = bpy.data.objects.get("AIRBUS_ROOT")
    if root is None:
        raise RuntimeError("AIRBUS_ROOT is missing")
    obj.parent = root


def seat_camera(name: str, game_id: str, purpose: str) -> bpy.types.Object:
    camera = bpy.data.objects.get(name)
    if camera is None:
        data = bpy.data.cameras.new(name)
        camera = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(camera)
    if camera.type != "CAMERA":
        raise RuntimeError(f"{name} exists but is not a camera")
    camera.location = CAPTAIN_LOCATION
    camera.rotation_euler = CAPTAIN_ROTATION
    camera.data.sensor_fit = "VERTICAL"
    camera.data.angle_y = math.radians(68)
    camera.data.clip_start = 0.002
    camera.data.clip_end = 1000
    camera.data.display_size = 0.12
    camera["game_id"] = game_id
    camera["cameraPurpose"] = purpose
    camera["seat_role"] = "captain"
    camera["source"] = "Calibrated A320 captain-seat eye point"
    camera["eye_forward_adjustment_m"] = 0.0508
    camera["eye_forward_adjustment_reason"] = "Keep the seated eye point forward of the seat back during restrained look controls."
    for key in ("deprecated", "compatibility_only", "replacement_camera"):
        if key in camera:
            del camera[key]
    parent_to_root(camera)
    return camera


def deprecate_camera(name: str, replacement: str) -> None:
    camera = bpy.data.objects.get(name)
    if camera is None or camera.type != "CAMERA":
        return
    camera["deprecated"] = True
    camera["compatibility_only"] = True
    camera["replacement_camera"] = replacement


def move_captain_sidestick_target() -> None:
    pivot = bpy.data.objects.get("AIRBUS_A320_TARGET_SIDESTICK_PIVOT")
    if pivot is None:
        raise RuntimeError("AIRBUS_A320_TARGET_SIDESTICK_PIVOT is missing")
    pivot.location = CAPTAIN_SIDESTICK_LOCATION
    pivot["puzzle_id"] = "airbus"
    pivot["seat_role"] = "captain"
    pivot["coordinate_source"] = "1440x900 captain gameplay camera mirror calibration"
    pivot["visual_alignment_status"] = "verified_browser_1440_captain"
    pivot["visual_alignment_evidence"] = "preview-renders/seat-role-swap/airbus-captain-targets-initial-1440.png"
    for name in ("AIRBUS_A320_TARGET_SIDESTICK_HITBOX", "AIRBUS_A320_TARGET_SIDESTICK_CUE"):
        obj = bpy.data.objects.get(name)
        if obj is None:
            raise RuntimeError(f"{name} is missing")
        obj["puzzle_id"] = "airbus"
        obj["seat_role"] = "captain"
        obj["visual_alignment_status"] = "verified_browser_1440_captain"
        obj["visual_alignment_evidence"] = "preview-renders/seat-role-swap/airbus-captain-targets-initial-1440.png"

    for control in ("THRUST", "GEAR", "RADIO", "ALTITUDE"):
        for suffix in ("PIVOT", "HITBOX", "CUE"):
            obj = bpy.data.objects.get(f"AIRBUS_A320_TARGET_{control}_{suffix}")
            if obj is None:
                raise RuntimeError(f"AIRBUS_A320_TARGET_{control}_{suffix} is missing")
            obj["puzzle_id"] = "airbus"
            obj["visual_alignment_status"] = "verified_browser_1440_captain"
            obj["visual_alignment_evidence"] = "preview-renders/seat-role-swap/airbus-captain-targets-initial-1440.png"


def move_captain_radio_target() -> None:
    pivot = bpy.data.objects.get("AIRBUS_A320_TARGET_RADIO_PIVOT")
    if pivot is None:
        raise RuntimeError("AIRBUS_A320_TARGET_RADIO_PIVOT is missing")
    pivot.location = CAPTAIN_RADIO_LOCATION
    pivot["coordinate_source"] = "Owner-directed 1440x900 alignment higher and farther left on the captain radio panel"
    for name in ("AIRBUS_A320_TARGET_RADIO_PIVOT", "AIRBUS_A320_TARGET_RADIO_HITBOX", "AIRBUS_A320_TARGET_RADIO_CUE"):
        obj = bpy.data.objects.get(name)
        if obj is None:
            raise RuntimeError(f"{name} is missing")
        obj["puzzle_id"] = "airbus"
        obj["seat_role"] = "captain"
        obj["visual_alignment_status"] = "pending_owner_browser_1440_captain"
        if "visual_alignment_evidence" in obj:
            del obj["visual_alignment_evidence"]


def move_captain_thrust_target() -> None:
    pivot = bpy.data.objects.get("AIRBUS_A320_TARGET_THRUST_PIVOT")
    if pivot is None:
        raise RuntimeError("AIRBUS_A320_TARGET_THRUST_PIVOT is missing")
    pivot.location = CAPTAIN_THRUST_LOCATION
    pivot["coordinate_source"] = "Owner-directed 1440x900 alignment farther left across the paired thrust levers"
    for name in ("AIRBUS_A320_TARGET_THRUST_PIVOT", "AIRBUS_A320_TARGET_THRUST_HITBOX", "AIRBUS_A320_TARGET_THRUST_CUE"):
        obj = bpy.data.objects.get(name)
        if obj is None:
            raise RuntimeError(f"{name} is missing")
        obj["puzzle_id"] = "airbus"
        obj["seat_role"] = "captain"
        obj["visual_alignment_status"] = "pending_owner_browser_1440_captain"
        if "visual_alignment_evidence" in obj:
            del obj["visual_alignment_evidence"]


def main() -> None:
    root = bpy.data.objects.get("AIRBUS_ROOT")
    if root is None:
        raise RuntimeError("AIRBUS_ROOT is missing")
    root["scene_group"] = "Airbus A320 Pop T Captain cockpit"
    root["seat_role"] = "captain"
    move_captain_sidestick_target()
    move_captain_thrust_target()
    move_captain_radio_target()
    game = seat_camera(
        "CAM_AIRBUS_CAPTAIN_GAME_VIEW",
        "airbus.a320.camera.captain_game_view",
        "Runtime captain gameplay camera consumed directly by React Three Fiber",
    )
    seat_camera(
        "AIRBUS_A320_CAM_CAPTAIN_APPROVAL",
        "airbus.a320.camera.captain_approval",
        "Owner approval camera for the Airbus A320 captain inside-cockpit target",
    )
    deprecate_camera("CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW", "CAM_AIRBUS_CAPTAIN_GAME_VIEW")
    deprecate_camera("AIRBUS_A320_CAM_FIRST_OFFICER_APPROVAL", "AIRBUS_A320_CAM_CAPTAIN_APPROVAL")
    bpy.context.scene.camera = game
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, compress=True)
    print("AIRBUS_CAPTAIN_CONTRACT_READY=1")


if __name__ == "__main__":
    main()
