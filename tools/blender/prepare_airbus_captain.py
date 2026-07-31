"""Apply the canonical A320 captain-seat runtime contract to the shaded master."""

from __future__ import annotations

import math

import bpy
from mathutils import Vector


CAPTAIN_LOCATION = (-0.153815, -0.647877, 0.130133)
CAPTAIN_ROTATION = (1.367064, 0.0, -0.282213)
STORM_FLIGHT_LOCATION = (-0.145600, -0.619700, 0.136000)
STORM_FLIGHT_ROTATION = (1.769000, 0.0, -0.282213)
CAPTAIN_SIDESTICK_LOCATION = (-0.224475, -0.453081, 0.045670)
CAPTAIN_THRUST_LOCATION = (0.025000, -0.505764, 0.004800)
CAPTAIN_RADIO_LOCATION = (-0.045000, -0.464842, 0.011798)
PLACEMENT_EVIDENCE = "preview-renders/placement-polish/airbus-radio-thrust-1440.png"
SIMULATOR_CONTRACT_VERSION = 1

DISPLAY_CONTRACTS = (
    (
        "AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE",
        "airbus.sim.display.pfd",
        "pfd",
        (-0.133298, -0.410819, 0.079315),
        (0.001335, -0.958433, 0.285315),
        (0.044801, 0.041234),
    ),
    (
        "AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE",
        "airbus.sim.display.nd",
        "nd",
        (-0.077427, -0.405221, 0.076827),
        (0.001335, -0.958433, 0.285315),
        (0.051160, 0.047761),
    ),
    (
        "AIRBUS_A320_DISPLAY_UPPER_ECAM_SURFACE",
        "airbus.sim.display.ecam",
        "ecam",
        (0.002867, -0.430291, 0.085524),
        (0.0, -0.961068, 0.276313),
        (0.045708, 0.040526),
    ),
)

SIDESTICK_SOURCE_MESHES = (
    "AIRBUS_A320_INTERACTIVE_083_SWITCH_KNOB_BUTTON_OR_ANNUNCIATOR",
    "AIRBUS_A320_INTERACTIVE_084_SWITCH_KNOB_BUTTON_OR_ANNUNCIATOR",
    "AIRBUS_A320_INTERACTIVE_086_SWITCH_KNOB_BUTTON_OR_ANNUNCIATOR",
    "AIRBUS_A320_INTERACTIVE_087_SWITCH_KNOB_BUTTON_OR_ANNUNCIATOR",
)
THRUST_SOURCE_MESH = "AIRBUS_A320_INTERACTIVE_078_SWITCH_KNOB_BUTTON_OR_ANNUNCIATOR"
SIDESTICK_PIVOT_LOCATION = (-0.212142, -0.516933, 0.030885)
THRUST_PIVOT_LOCATION = (0.000087, -0.525594, -0.001324)


def parent_to_root(obj: bpy.types.Object) -> None:
    root = bpy.data.objects.get("AIRBUS_ROOT")
    if root is None:
        raise RuntimeError("AIRBUS_ROOT is missing")
    obj.parent = root


def reparent_keep_world(obj: bpy.types.Object, parent: bpy.types.Object) -> None:
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world


def ensure_empty(name: str) -> bpy.types.Object:
    obj = bpy.data.objects.get(name)
    if obj is None:
        obj = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(obj)
    if obj.type != "EMPTY":
        raise RuntimeError(f"{name} exists but is not an empty pivot")
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.018
    return obj


def simulator_display_material() -> bpy.types.Material:
    material = bpy.data.materials.get("MAT_AIRBUS_SIMULATOR_DISPLAY")
    if material is None:
        material = bpy.data.materials.new("MAT_AIRBUS_SIMULATOR_DISPLAY")
    material.diffuse_color = (0.003, 0.018, 0.025, 1.0)
    material.metallic = 0.0
    material.roughness = 0.42
    return material


def add_display_surface(
    name: str,
    game_id: str,
    role: str,
    location: tuple[float, float, float],
    normal: tuple[float, float, float],
    size: tuple[float, float],
) -> None:
    existing = bpy.data.objects.get(name)
    if existing is not None:
        existing_mesh = existing.data if existing.type == "MESH" else None
        bpy.data.objects.remove(existing, do_unlink=True)
        if existing_mesh is not None and existing_mesh.users == 0:
            bpy.data.meshes.remove(existing_mesh)

    width, height = size
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(
        [
            (-width / 2, -height / 2, 0.0),
            (width / 2, -height / 2, 0.0),
            (width / 2, height / 2, 0.0),
            (-width / 2, height / 2, 0.0),
        ],
        [],
        [(0, 1, 2, 3)],
    )
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for datum, coordinates in zip(uv_layer.data, ((0, 0), (1, 0), (1, 1), (0, 1)), strict=True):
        datum.uv = coordinates
    mesh.materials.append(simulator_display_material())

    surface = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(surface)
    surface.location = location
    surface.rotation_mode = "QUATERNION"
    surface.rotation_quaternion = Vector(normal).normalized().to_track_quat("Z", "Y")
    surface["game_id"] = game_id
    surface["interaction"] = "instrument-display"
    surface["display_role"] = role
    surface["texture_source"] = "runtime_canvas"
    surface["simulator_contract_version"] = SIMULATOR_CONTRACT_VERSION
    group = bpy.data.objects.get("AIRBUS_A320_DISPLAY_CANDIDATES")
    if group is None:
        raise RuntimeError("AIRBUS_A320_DISPLAY_CANDIDATES is missing")
    reparent_keep_world(surface, group)


def add_simulator_displays() -> None:
    for contract in DISPLAY_CONTRACTS:
        add_display_surface(*contract)


def configure_control_pivot(
    obj: bpy.types.Object,
    *,
    game_id: str,
    interaction: str,
    input_axis: str,
    rotation_axis: str,
    min_angle: float,
    max_angle: float,
) -> None:
    obj["game_id"] = game_id
    obj["interaction"] = interaction
    obj["input_axis"] = input_axis
    obj["rotation_axis"] = rotation_axis
    obj["rest_angle"] = 0.0
    obj["min_angle"] = min_angle
    obj["max_angle"] = max_angle
    obj["simulator_contract_version"] = SIMULATOR_CONTRACT_VERSION


def add_simulator_control_pivots() -> None:
    root = bpy.data.objects.get("AIRBUS_ROOT")
    if root is None:
        raise RuntimeError("AIRBUS_ROOT is missing")

    bpy.context.view_layer.update()
    sidestick_world = {}
    for name in SIDESTICK_SOURCE_MESHES:
        mesh = bpy.data.objects.get(name)
        if mesh is None:
            raise RuntimeError(f"{name} is missing")
        sidestick_world[name] = mesh.matrix_world.copy()
    thrust_mesh = bpy.data.objects.get(THRUST_SOURCE_MESH)
    if thrust_mesh is None:
        raise RuntimeError(f"{THRUST_SOURCE_MESH} is missing")
    thrust_world = thrust_mesh.matrix_world.copy()

    roll = ensure_empty("AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_ROLL_PIVOT")
    pitch = ensure_empty("AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_PITCH_PIVOT")
    roll.parent = None
    pitch.parent = None
    roll.location = SIDESTICK_PIVOT_LOCATION
    pitch.location = SIDESTICK_PIVOT_LOCATION
    roll.rotation_euler = (0.0, 0.0, 0.0)
    pitch.rotation_euler = (0.0, 0.0, 0.0)
    reparent_keep_world(roll, root)
    reparent_keep_world(pitch, roll)
    configure_control_pivot(
        roll,
        game_id="airbus.sim.control.sidestick",
        interaction="analog",
        input_axis="bank",
        rotation_axis="Y",
        min_angle=-12.0,
        max_angle=12.0,
    )
    configure_control_pivot(
        pitch,
        game_id="airbus.sim.control.sidestick.pitch",
        interaction="analog-child",
        input_axis="pitch",
        rotation_axis="X",
        min_angle=-10.0,
        max_angle=10.0,
    )
    for name in SIDESTICK_SOURCE_MESHES:
        mesh = bpy.data.objects.get(name)
        assert mesh is not None
        mesh.parent = pitch
        mesh.matrix_world = sidestick_world[name]

    thrust = ensure_empty("AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT")
    thrust.parent = None
    thrust.location = THRUST_PIVOT_LOCATION
    thrust.rotation_euler = (0.0, 0.0, 0.0)
    reparent_keep_world(thrust, root)
    configure_control_pivot(
        thrust,
        game_id="airbus.sim.control.thrust",
        interaction="analog",
        input_axis="thrust",
        rotation_axis="X",
        min_angle=-8.0,
        max_angle=14.0,
    )
    thrust_mesh.parent = thrust
    thrust_mesh.matrix_world = thrust_world


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


def storm_flight_camera() -> bpy.types.Object:
    camera = seat_camera(
        "CAM_AIRBUS_CAPTAIN_STORM_FLIGHT",
        "airbus.a320.camera.captain_storm_flight",
        "Focused forward Airbus A320 Storm Flight gameplay camera",
    )
    camera.location = STORM_FLIGHT_LOCATION
    camera.rotation_euler = STORM_FLIGHT_ROTATION
    camera.data.angle_y = math.radians(58)
    camera["purpose"] = "storm-flight"
    camera["seat_role"] = "captain"
    camera["aircraft"] = "Airbus A320"
    camera["vertical_fov_degrees"] = 58
    camera["composition_vertical_shift_fraction"] = 0.33
    camera["source"] = "Aerofly-inspired focused captain flight composition"
    camera["composition_status"] = "pending_owner_browser_1440"
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
        obj["visual_alignment_status"] = "verified_browser_1440_captain"
        obj["visual_alignment_evidence"] = PLACEMENT_EVIDENCE


def move_captain_thrust_target() -> None:
    pivot = bpy.data.objects.get("AIRBUS_A320_TARGET_THRUST_PIVOT")
    if pivot is None:
        raise RuntimeError("AIRBUS_A320_TARGET_THRUST_PIVOT is missing")
    pivot.location = CAPTAIN_THRUST_LOCATION
    pivot["coordinate_source"] = "Owner-directed 1440x900 alignment farther right across the paired thrust levers"
    for name in ("AIRBUS_A320_TARGET_THRUST_PIVOT", "AIRBUS_A320_TARGET_THRUST_HITBOX", "AIRBUS_A320_TARGET_THRUST_CUE"):
        obj = bpy.data.objects.get(name)
        if obj is None:
            raise RuntimeError(f"{name} is missing")
        obj["puzzle_id"] = "airbus"
        obj["seat_role"] = "captain"
        obj["visual_alignment_status"] = "verified_browser_1440_captain"
        obj["visual_alignment_evidence"] = PLACEMENT_EVIDENCE


def main() -> None:
    root = bpy.data.objects.get("AIRBUS_ROOT")
    if root is None:
        raise RuntimeError("AIRBUS_ROOT is missing")
    root["scene_group"] = "Airbus A320 Pop T Captain cockpit"
    root["seat_role"] = "captain"
    move_captain_sidestick_target()
    move_captain_thrust_target()
    move_captain_radio_target()
    add_simulator_displays()
    add_simulator_control_pivots()
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
    storm_flight_camera()
    deprecate_camera("CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW", "CAM_AIRBUS_CAPTAIN_GAME_VIEW")
    deprecate_camera("AIRBUS_A320_CAM_FIRST_OFFICER_APPROVAL", "AIRBUS_A320_CAM_CAPTAIN_APPROVAL")
    bpy.context.scene.camera = game
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, compress=True)
    print("AIRBUS_CAPTAIN_CONTRACT_READY=1")


if __name__ == "__main__":
    main()
