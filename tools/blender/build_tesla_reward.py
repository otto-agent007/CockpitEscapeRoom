"""Build the Model Y hangar reward deterministically from the owner source.

Run from Blender factory startup. The script preserves the immutable Tripo GLB,
imports and stages a browser copy, builds the hangar and articulated Flight Mode
kit, authors one shared object-transform action, writes the intake report, and
saves the master.
"""

from __future__ import annotations

import hashlib
import json
import math
import shutil
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
DOWNLOAD_SOURCE = Path("/mnt/2TBHDD/Downloads/red electric car 3d model.glb")
SOURCE_ROOT = REPO_ROOT / ".cache" / "cockpit-pipeline" / "sources" / "model-y-hangar" / "red-electric-car"
SOURCE_PATH = SOURCE_ROOT / "original" / DOWNLOAD_SOURCE.name
OPTIMIZED_PATH = SOURCE_ROOT / "extracted" / "optimized" / "red-electric-car.optimized.glb"
MASTER_PATH = REPO_ROOT / "art-source" / "blender" / "tesla_reward.blend"
REPORT_PATH = REPO_ROOT / "asset-reports" / "model-y-reward-intake.json"
EXPECTED_SHA256 = "d88769d9c66bdeca46bf239c9baa2a295afc82ffb24005733d9374b9c7782bee"
REQUIRED_TEXTURE_ROLES = ("baseColor", "normal", "metallicRoughness")
SOURCE_TEXTURE_MINIMUM = 4096
RUNTIME_TEXTURE_SIZE = 2048
VEHICLE_TRIANGLE_TARGET = 180_000
TARGET_VEHICLE_LENGTH = 4.75
ANIMATION_NAME = "TESLA_FLIGHT_MODE_REVEAL"
FPS = 30
FRAME_END = 345


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def preserve_source() -> Path:
    if not SOURCE_PATH.exists():
        if not DOWNLOAD_SOURCE.exists():
            raise FileNotFoundError(f"Missing Model Y source: {DOWNLOAD_SOURCE}")
        if sha256(DOWNLOAD_SOURCE) != EXPECTED_SHA256:
            raise RuntimeError("Model Y download does not match the approved source hash.")
        SOURCE_PATH.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(DOWNLOAD_SOURCE, SOURCE_PATH)
    if sha256(SOURCE_PATH) != EXPECTED_SHA256:
        raise RuntimeError(f"Preserved Model Y source changed unexpectedly: {SOURCE_PATH}")
    return SOURCE_PATH


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.images,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.armatures,
        bpy.data.actions,
    ):
        for block in list(collection):
            if block.users == 0:
                collection.remove(block)


def recursive_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [
        obj.matrix_world @ Vector(corner)
        for obj in objects
        if obj.type == "MESH"
        for corner in obj.bound_box
    ]
    if not points:
        raise RuntimeError("Model Y source contains no recursive mesh bounds.")
    return (
        Vector(tuple(min(point[index] for point in points) for index in range(3))),
        Vector(tuple(max(point[index] for point in points) for index in range(3))),
    )


def triangle_count(objects: list[bpy.types.Object]) -> int:
    total = 0
    for obj in objects:
        if obj.type != "MESH":
            continue
        obj.data.calc_loop_triangles()
        total += len(obj.data.loop_triangles)
    return total


def linked_image(socket: bpy.types.NodeSocket) -> bpy.types.Image | None:
    pending = [link.from_node for link in socket.links]
    visited: set[bpy.types.Node] = set()
    while pending:
        node = pending.pop()
        if node in visited:
            continue
        visited.add(node)
        if node.type == "TEX_IMAGE" and node.image is not None:
            return node.image
        for node_input in node.inputs:
            pending.extend(link.from_node for link in node_input.links)
    return None


def required_texture_images(meshes: list[bpy.types.Object]) -> dict[str, bpy.types.Image]:
    materials = {
        material
        for obj in meshes
        for material in obj.data.materials
        if material is not None and material.use_nodes
    }
    for material in materials:
        for principled in (node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"):
            base_color = linked_image(principled.inputs["Base Color"])
            normal = linked_image(principled.inputs["Normal"])
            metallic = linked_image(principled.inputs["Metallic"])
            roughness = linked_image(principled.inputs["Roughness"])
            roles = {
                "baseColor": base_color,
                "normal": normal,
                "metallicRoughness": metallic if metallic is roughness else None,
            }
            if all(roles.values()):
                return {role: image for role, image in roles.items() if image is not None}
    raise RuntimeError(
        "Model Y source must contain one material with wired BaseColor, normal, and metallic-roughness maps."
    )


def make_empty(name: str, parent: bpy.types.Object | None = None) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    return obj


def make_material(
    name: str,
    base_color: tuple[float, float, float, float],
    *,
    metallic: float = 0.0,
    roughness: float = 0.5,
    emission: tuple[float, float, float, float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = base_color
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    if emission is not None:
        principled.inputs["Emission Color"].default_value = emission
        principled.inputs["Emission Strength"].default_value = emission_strength
    return material


def make_box(
    name: str,
    dimensions: tuple[float, float, float],
    location: tuple[float, float, float],
    material: bpy.types.Material,
    parent: bpy.types.Object | None = None,
    bevel: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_GEOMETRY"
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        modifier = obj.modifiers.new(f"{name}_BEVEL", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(material)
    obj.parent = parent
    return obj


def make_wedge_panel(
    name: str,
    outline: tuple[tuple[float, float], ...],
    z: float,
    thickness: float,
    material: bpy.types.Material,
    bevel: float = 0.0,
) -> bpy.types.Object:
    bottom = z - thickness * 0.5
    top = z + thickness * 0.5
    vertices = [(x, y, bottom) for x, y in outline] + [(x, y, top) for x, y in outline]
    count = len(outline)
    faces = [
        tuple(reversed(range(count))),
        tuple(range(count, count * 2)),
        *[
            (index, (index + 1) % count, (index + 1) % count + count, index + count)
            for index in range(count)
        ],
    ]
    mesh = bpy.data.meshes.new(f"{name}_GEOMETRY")
    mesh.from_pydata(vertices, [], faces)
    mesh.uv_layers.new(name="UVMap")
    mesh.materials.append(material)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if bevel > 0:
        modifier = obj.modifiers.new(f"{name}_BEVEL", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(False)
    return obj


def make_text_mesh(
    name: str,
    text: str,
    location: tuple[float, float, float],
    rotation: tuple[float, float, float],
    size: float,
    material: bpy.types.Material,
    parent: bpy.types.Object | None = None,
    align: str = "CENTER",
) -> bpy.types.Object:
    curve = bpy.data.curves.new(f"{name}_CURVE", type="FONT")
    curve.body = text
    curve.align_x = align
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.012
    curve.bevel_depth = 0.004
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_GEOMETRY"
    obj.parent = parent
    return obj


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def make_camera(
    name: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    lens: float,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_fit = "VERTICAL"
    camera = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = location
    look_at(camera, target)
    camera.parent = parent
    return camera


def make_area_light(
    name: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    energy: float,
    size: float,
    color: tuple[float, float, float],
    parent: bpy.types.Object,
) -> bpy.types.Object:
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    light = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(light)
    light.location = location
    look_at(light, target)
    light.parent = parent
    return light


def normalize_vehicle(meshes: list[bpy.types.Object]) -> dict[str, list[float]]:
    for obj in meshes:
        obj.data.transform(obj.matrix_world)
        obj.matrix_world = Matrix.Identity(4)
    bpy.context.view_layer.update()
    minimum, maximum = recursive_bounds(meshes)
    size = maximum - minimum
    if size.x <= 0:
        raise RuntimeError("Model Y source has zero longitudinal size.")
    scale = TARGET_VEHICLE_LENGTH / size.x
    center = (minimum + maximum) * 0.5
    transform = Matrix.Translation(Vector((0.0, 0.0, -minimum.z * scale + 0.12))) @ Matrix.Scale(scale, 4) @ Matrix.Translation(-center)
    for obj in meshes:
        obj.data.transform(transform)
        obj.data.update()
    bpy.context.view_layer.update()
    staged_minimum, staged_maximum = recursive_bounds(meshes)
    return {
        "minimum": [round(value, 6) for value in staged_minimum],
        "maximum": [round(value, 6) for value in staged_maximum],
        "size": [round(value, 6) for value in staged_maximum - staged_minimum],
    }


def decimate_vehicle(meshes: list[bpy.types.Object]) -> tuple[int, int]:
    source_triangles = triangle_count(meshes)
    if source_triangles <= VEHICLE_TRIANGLE_TARGET:
        return source_triangles, source_triangles
    ratio = VEHICLE_TRIANGLE_TARGET / source_triangles
    for obj in meshes:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        modifier = obj.modifiers.new("Model Y browser budget", type="DECIMATE")
        modifier.decimate_type = "COLLAPSE"
        modifier.ratio = ratio
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.data.validate(clean_customdata=False)
        obj.data.update()
    return source_triangles, triangle_count(meshes)


def stage_textures(images: dict[str, bpy.types.Image]) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    source_records = []
    runtime_records = []
    for role in REQUIRED_TEXTURE_ROLES:
        image = images[role]
        source_dimensions = [int(image.size[0]), int(image.size[1])]
        source_records.append({"role": role, "name": image.name, "dimensions": source_dimensions})
        if min(source_dimensions) < SOURCE_TEXTURE_MINIMUM:
            raise RuntimeError(f"Model Y {role} map failed the 4096px source gate: {source_dimensions}")
        image.scale(RUNTIME_TEXTURE_SIZE, RUNTIME_TEXTURE_SIZE)
        image.name = f"TEX_MODEL_Y_{role.upper()}"
        image.pack()
        runtime_records.append(
            {
                "role": role,
                "name": image.name,
                "dimensions": [int(image.size[0]), int(image.size[1])],
                "packed": bool(image.packed_file),
            }
        )
    return source_records, runtime_records


def export_optimized_vehicle(meshes: list[bpy.types.Object]) -> None:
    OPTIMIZED_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.export_scene.gltf(
        filepath=str(OPTIMIZED_PATH),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_apply=False,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_tangents=True,
    )


def create_flight_mode_root(parent: bpy.types.Object) -> bpy.types.Object:
    flight_mode = make_empty("TESLA_FLIGHT_MODE_ROOT", parent)
    flight_mode["game_id"] = "reward.flightMode"
    flight_mode["interaction"] = "animation"
    flight_mode["animation_name"] = ANIMATION_NAME
    flight_mode["duration_seconds"] = 11.5
    return flight_mode


def join_objects(name: str, objects: list[bpy.types.Object]) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    joined = bpy.context.object
    joined.name = name
    joined.data.name = f"{name}_GEOMETRY"
    return joined


def make_fan_rotor(
    name: str,
    location: tuple[float, float, float],
    material: bpy.types.Material,
) -> bpy.types.Object:
    parts = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.12, depth=0.045, location=location)
    hub = bpy.context.object
    hub.data.materials.append(material)
    parts.append(hub)
    for index in range(4):
        blade = make_box(
            f"{name}_BLADE_{index + 1}",
            (0.46, 0.07, 0.025),
            location,
            material,
            bevel=0.02,
        )
        blade.rotation_euler.z = math.radians(index * 45.0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
        parts.append(blade)
    return join_objects(name, parts)


def build_environment(root: bpy.types.Object) -> tuple[bpy.types.Object, bpy.types.Object]:
    hangar = make_empty("TESLA_HANGAR", root)
    dark = make_material("MAT_TESLA_HANGAR_DARK", (0.025, 0.035, 0.045, 1.0), metallic=0.35, roughness=0.48)
    floor_mat = make_material("MAT_TESLA_HANGAR_FLOOR", (0.09, 0.11, 0.13, 1.0), metallic=0.2, roughness=0.58)
    legacy = make_material("MAT_TESLA_LEGACY_BRASS", (0.42, 0.22, 0.07, 1.0), metallic=0.8, roughness=0.24)

    make_box("TESLA_HANGAR_FLOOR", (18.0, 14.0, 0.16), (0.0, 0.0, -0.08), floor_mat, hangar)
    make_box("TESLA_HANGAR_BACK", (18.0, 0.18, 6.8), (0.0, 5.9, 3.4), dark, hangar)
    make_box("TESLA_HANGAR_LEFT", (0.18, 14.0, 6.8), (-8.9, 0.0, 3.4), dark, hangar)
    make_box("TESLA_HANGAR_RIGHT", (0.18, 14.0, 6.8), (8.9, 0.0, 3.4), dark, hangar)
    make_box("TESLA_HANGAR_CEILING", (18.0, 14.0, 0.14), (0.0, 0.0, 6.8), dark, hangar)
    make_box("TESLA_HANGAR_FLOOR_LINE_LEFT", (8.5, 0.055, 0.025), (0.0, 1.25, 0.02), legacy, hangar)
    make_box("TESLA_HANGAR_FLOOR_LINE_RIGHT", (8.5, 0.055, 0.025), (0.0, -1.25, 0.02), legacy, hangar)
    make_text_mesh(
        "TESLA_HANGAR_LEGACY_SIGN",
        "POP T  LEGACY FLIGHT",
        (0.0, 5.75, 4.15),
        (math.radians(90.0), 0.0, 0.0),
        0.62,
        legacy,
        hangar,
    )

    left_door = make_box(
        "TESLA_HANGAR_DOOR_LEFT",
        (5.3, 0.20, 5.7),
        (-2.66, -3.40, 2.85),
        dark,
        hangar,
        bevel=0.04,
    )
    right_door = make_box(
        "TESLA_HANGAR_DOOR_RIGHT",
        (5.3, 0.20, 5.7),
        (2.66, -3.40, 2.85),
        dark,
        hangar,
        bevel=0.04,
    )
    return left_door, right_door


def build_flight_kit(
    flight_mode: bpy.types.Object,
) -> dict[str, bpy.types.Object]:
    flight_metal = make_material(
        "MAT_TESLA_FLIGHT_METAL",
        (0.16, 0.28, 0.38, 1.0),
        metallic=0.28,
        roughness=0.30,
    )
    emissive_mat = make_material(
        "MAT_TESLA_FLIGHT_EMISSIVE",
        (0.015, 0.06, 0.08, 1.0),
        metallic=0.35,
        roughness=0.18,
        emission=(0.12, 0.72, 1.0, 1.0),
        emission_strength=5.0,
    )

    moving: dict[str, bpy.types.Object] = {}
    wing_specs = (
        (
            "TESLA_WING_LEFT_PIVOT",
            (0.0, 0.88, 0.66),
            ((0.95, 0.92), (-1.05, 0.92), (-1.18, 2.62), (-0.10, 2.92)),
            0.065,
        ),
        (
            "TESLA_WING_RIGHT_PIVOT",
            (0.0, -0.88, 0.66),
            ((0.95, -0.92), (-0.10, -2.92), (-1.18, -2.62), (-1.05, -0.92)),
            0.065,
        ),
        (
            "TESLA_STABILIZER_LEFT_PIVOT",
            (-1.78, 0.76, 1.02),
            ((-1.35, 0.78), (-2.08, 0.78), (-2.16, 1.62), (-1.72, 1.82)),
            0.05,
        ),
        (
            "TESLA_STABILIZER_RIGHT_PIVOT",
            (-1.78, -0.76, 1.02),
            ((-1.35, -0.78), (-1.72, -1.82), (-2.16, -1.62), (-2.08, -0.78)),
            0.05,
        ),
    )
    for pivot_name, origin, outline, thickness in wing_specs:
        pivot = make_empty(pivot_name, flight_mode)
        pivot.location = origin
        panel = make_wedge_panel(
            f"{pivot_name}_PANEL",
            outline,
            origin[2],
            thickness,
            flight_metal,
            bevel=0.035,
        )
        world = panel.matrix_world.copy()
        panel.parent = pivot
        panel.matrix_world = world
        moving[pivot_name] = pivot

    for pivot_name, x_position in (
        ("TESLA_LIFT_FAN_FRONT_DOOR_PIVOT", 1.16),
        ("TESLA_LIFT_FAN_REAR_DOOR_PIVOT", -1.16),
    ):
        pivot = make_empty(pivot_name, flight_mode)
        pivot.location = (x_position, 0.0, 0.46)
        door = make_box(
            f"{pivot_name}_PANEL",
            (0.82, 1.12, 0.055),
            (x_position, 0.0, 0.46),
            flight_metal,
            bevel=0.06,
        )
        world = door.matrix_world.copy()
        door.parent = pivot
        door.matrix_world = world
        moving[pivot_name] = pivot

    for rotor_name, x_position in (
        ("TESLA_LIFT_FAN_FRONT_ROTOR", 1.16),
        ("TESLA_LIFT_FAN_REAR_ROTOR", -1.16),
    ):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.48,
            minor_radius=0.055,
            major_segments=48,
            minor_segments=12,
            location=(x_position, 0.0, 0.38),
        )
        housing = bpy.context.object
        housing.name = f"{rotor_name}_HOUSING"
        housing.data.name = f"{rotor_name}_HOUSING_GEOMETRY"
        housing.data.materials.append(flight_metal)
        housing.parent = flight_mode

        rotor = make_fan_rotor(rotor_name, (x_position, 0.0, 0.39), flight_metal)
        rotor.parent = flight_mode
        moving[rotor_name] = rotor

    emissive = make_empty("TESLA_EMISSIVE", flight_mode)
    for y_position in (-1.04, 1.04):
        strip = make_box(
            f"TESLA_EMISSIVE_STRIP_{'LEFT' if y_position > 0 else 'RIGHT'}",
            (1.35, 0.035, 0.025),
            (-0.15, y_position, 0.60),
            emissive_mat,
            bevel=0.018,
        )
        world = strip.matrix_world.copy()
        strip.parent = emissive
        strip.matrix_world = world
    moving["TESLA_EMISSIVE"] = emissive
    return moving


def build_plate(motion_root: bpy.types.Object) -> bpy.types.Object:
    plate_mat = make_material("MAT_TESLA_PLATE", (0.88, 0.89, 0.86, 1.0), metallic=0.25, roughness=0.28)
    text_mat = make_material("MAT_TESLA_PLATE_TEXT", (0.015, 0.025, 0.035, 1.0), metallic=0.05, roughness=0.38)
    plate = make_box(
        "TESLA_PLATE_POP_T",
        (0.045, 0.70, 0.24),
        (2.39, -0.02, 0.53),
        plate_mat,
        motion_root,
        bevel=0.035,
    )
    text = make_text_mesh(
        "TESLA_PLATE_POP_T_TEXT",
        "POP T",
        (2.418, -0.02, 0.53),
        (math.radians(90.0), 0.0, math.radians(90.0)),
        0.13,
        text_mat,
    )
    world = text.matrix_world.copy()
    text.parent = plate
    text.matrix_world = world
    return plate


def set_keyframe(
    obj: bpy.types.Object,
    action: bpy.types.Action,
    frame: int,
    *,
    location: tuple[float, float, float] | None = None,
    rotation: tuple[float, float, float] | None = None,
    scale: tuple[float, float, float] | None = None,
) -> None:
    obj.animation_data_create()
    obj.animation_data.action = action
    obj.rotation_mode = "XYZ"
    if location is not None:
        obj.location = location
        obj.keyframe_insert(data_path="location", frame=frame)
    if rotation is not None:
        obj.rotation_euler = rotation
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)
    if scale is not None:
        obj.scale = scale
        obj.keyframe_insert(data_path="scale", frame=frame)


def author_animation(
    motion_root: bpy.types.Object,
    left_door: bpy.types.Object,
    right_door: bpy.types.Object,
    moving: dict[str, bpy.types.Object],
) -> None:
    action = bpy.data.actions.new(ANIMATION_NAME)

    left_start = tuple(left_door.location)
    right_start = tuple(right_door.location)
    set_keyframe(left_door, action, 0, location=left_start)
    set_keyframe(left_door, action, 36, location=(left_start[0] - 5.5, left_start[1], left_start[2]))
    set_keyframe(right_door, action, 0, location=right_start)
    set_keyframe(right_door, action, 36, location=(right_start[0] + 5.5, right_start[1], right_start[2]))

    set_keyframe(motion_root, action, 0, location=(0.0, 0.0, 0.0))
    set_keyframe(motion_root, action, 144, location=(0.0, 0.0, 0.0))
    set_keyframe(motion_root, action, 294, location=(0.0, 0.0, 0.18))
    set_keyframe(motion_root, action, 345, location=(0.0, 0.0, 0.12))

    for name in ("TESLA_WING_LEFT_PIVOT", "TESLA_WING_RIGHT_PIVOT"):
        set_keyframe(moving[name], action, 144, scale=(0.01, 0.01, 0.01))
        set_keyframe(moving[name], action, 246, scale=(1.0, 1.0, 1.0))
        set_keyframe(moving[name], action, 345, scale=(1.0, 1.0, 1.0))
    for name in ("TESLA_STABILIZER_LEFT_PIVOT", "TESLA_STABILIZER_RIGHT_PIVOT"):
        set_keyframe(moving[name], action, 168, scale=(0.01, 0.01, 0.01))
        set_keyframe(moving[name], action, 270, scale=(1.0, 1.0, 1.0))
        set_keyframe(moving[name], action, 345, scale=(1.0, 1.0, 1.0))

    set_keyframe(moving["TESLA_LIFT_FAN_FRONT_DOOR_PIVOT"], action, 174, rotation=(0.0, 0.0, 0.0))
    set_keyframe(moving["TESLA_LIFT_FAN_FRONT_DOOR_PIVOT"], action, 240, rotation=(0.0, math.radians(-82.0), 0.0))
    set_keyframe(moving["TESLA_LIFT_FAN_REAR_DOOR_PIVOT"], action, 174, rotation=(0.0, 0.0, 0.0))
    set_keyframe(moving["TESLA_LIFT_FAN_REAR_DOOR_PIVOT"], action, 240, rotation=(0.0, math.radians(82.0), 0.0))

    for name in ("TESLA_LIFT_FAN_FRONT_ROTOR", "TESLA_LIFT_FAN_REAR_ROTOR"):
        set_keyframe(moving[name], action, 174, rotation=(0.0, 0.0, 0.0))
        set_keyframe(moving[name], action, 294, rotation=(0.0, 0.0, math.radians(2160.0)))
        set_keyframe(moving[name], action, 345, rotation=(0.0, 0.0, math.radians(3240.0)))

    set_keyframe(moving["TESLA_EMISSIVE"], action, 210, scale=(0.01, 0.01, 0.01))
    set_keyframe(moving["TESLA_EMISSIVE"], action, 294, scale=(1.0, 1.0, 1.0))
    set_keyframe(moving["TESLA_EMISSIVE"], action, 345, scale=(1.0, 1.0, 1.0))


def configure_scene(root: bpy.types.Object) -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.fps = FPS
    scene.frame_start = 0
    scene.frame_end = FRAME_END
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0

    world = bpy.data.worlds.new("TESLA_REWARD_WORLD")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.008, 0.012, 0.018, 1.0)
    background.inputs["Strength"].default_value = 0.20

    make_area_light("TESLA_KEY_LIGHT", (5.4, -4.8, 5.6), (0.0, 0.0, 0.9), 1250, 4.5, (1.0, 0.72, 0.48), root)
    make_area_light("TESLA_FILL_LIGHT", (-4.5, -2.0, 3.0), (0.0, 0.0, 0.8), 780, 4.0, (0.38, 0.58, 1.0), root)
    make_area_light("TESLA_RIM_LIGHT", (-1.0, 4.2, 5.0), (0.0, 0.0, 1.0), 980, 3.5, (0.18, 0.68, 1.0), root)

    game_camera = make_camera(
        "CAM_TESLA_REWARD_GAME",
        (7.4, -9.2, 4.2),
        (0.0, 0.0, 0.9),
        56.0,
        root,
    )
    make_camera(
        "CAM_TESLA_REWARD_APPROVAL",
        (7.4, -9.2, 4.2),
        (0.0, 0.0, 0.9),
        56.0,
        root,
    )
    make_camera(
        "CAM_TESLA_REWARD_NARROW_GAME",
        (7.0, -7.0, 6.3),
        (0.0, 0.0, 0.70),
        48.0,
        root,
    )
    make_camera(
        "CAM_TESLA_FLIGHT_MODE_APPROVAL",
        (6.7, -8.0, 3.6),
        (0.0, 0.0, 0.85),
        58.0,
        root,
    )
    scene.camera = game_camera


def build() -> dict[str, object]:
    source = preserve_source()
    reset_scene()
    before_objects = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(source))
    imported = [obj for obj in bpy.data.objects if obj not in before_objects]
    meshes = [obj for obj in imported if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("Model Y source imported without mesh geometry.")

    source_minimum, source_maximum = recursive_bounds(meshes)
    images = required_texture_images(meshes)
    source_triangles, runtime_vehicle_triangles = decimate_vehicle(meshes)
    staged_bounds = normalize_vehicle(meshes)
    source_textures, runtime_textures = stage_textures(images)

    root = make_empty("TESLA_ROOT")
    vehicle = make_empty("TESLA_VEHICLE", root)
    vehicle["game_id"] = "reward.modelY"
    vehicle["asset_stage"] = "owner-review-candidate"
    vehicle["source_kind"] = "Tripo owner-supplied GLB"
    vehicle["source_sha256"] = EXPECTED_SHA256
    motion_root = make_empty("TESLA_VEHICLE_MOTION", vehicle)
    flight_mode = create_flight_mode_root(motion_root)

    for index, obj in enumerate(meshes):
        obj.name = "TESLA_MODEL_Y_BODY" if index == 0 else f"TESLA_MODEL_Y_BODY_{index + 1:02d}"
        obj.data.name = f"{obj.name}_GEOMETRY"
        for material in obj.data.materials:
            if material is not None:
                material.name = "MAT_MODEL_Y_SOURCE_PBR"
                material.use_nodes = True
        obj.parent = motion_root
    for obj in imported:
        if obj.type == "MESH":
            continue
        bpy.data.objects.remove(obj, do_unlink=True)

    export_optimized_vehicle(meshes)
    left_door, right_door = build_environment(root)
    build_plate(motion_root)
    moving = build_flight_kit(flight_mode)
    author_animation(motion_root, left_door, right_door, moving)
    configure_scene(root)

    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()
    all_meshes = [obj for obj in root.children_recursive if obj.type == "MESH"]
    runtime_total_triangles = triangle_count(all_meshes)
    materials = {
        material.name
        for obj in all_meshes
        for material in obj.data.materials
        if material is not None
    }
    runtime_draw_calls = sum(max(1, len(obj.data.materials)) for obj in all_meshes)
    zero_size_meshes = []
    for obj in all_meshes:
        size = Vector(obj.dimensions)
        if min(abs(value) for value in size) <= 0.000001:
            zero_size_meshes.append(obj.name)

    report = {
        "asset": "model-y-hangar-reward",
        "source": str(DOWNLOAD_SOURCE),
        "preservedSource": str(SOURCE_PATH.relative_to(REPO_ROOT)),
        "optimizedSource": str(OPTIMIZED_PATH.relative_to(REPO_ROOT)),
        "sourceSha256": EXPECTED_SHA256,
        "sourceByteLength": SOURCE_PATH.stat().st_size,
        "generator": "Tripo",
        "blenderVersion": bpy.app.version_string,
        "sceneGroup": "Model Y hangar reward and Flight Mode transformation",
        "sourceObjectCount": len(imported),
        "sourceMeshCount": len(meshes),
        "sourceTriangleCount": source_triangles,
        "runtimeVehicleTriangleCount": runtime_vehicle_triangles,
        "runtimeTotalTriangleCount": runtime_total_triangles,
        "runtimeMaterialCount": len(materials),
        "runtimeDrawCallCount": runtime_draw_calls,
        "sourceBounds": {
            "minimum": [round(value, 6) for value in source_minimum],
            "maximum": [round(value, 6) for value in source_maximum],
            "size": [round(value, 6) for value in source_maximum - source_minimum],
        },
        "stagedBounds": staged_bounds,
        "orientation": {
            "sourceFrontAxis": "+X",
            "sourceUpAxisAfterBlenderImport": "+Z",
            "finalRotationDegrees": [0.0, 0.0, 0.0],
            "targetVehicleLengthMeters": TARGET_VEHICLE_LENGTH,
        },
        "sourceTextureGatePassed": all(
            min(record["dimensions"]) >= SOURCE_TEXTURE_MINIMUM for record in source_textures
        ),
        "sourceTextures": source_textures,
        "runtimeTextures": runtime_textures,
        "rootObject": "TESLA_ROOT",
        "requiredNodes": [
            "TESLA_ROOT",
            "TESLA_HANGAR",
            "TESLA_HANGAR_DOOR_LEFT",
            "TESLA_HANGAR_DOOR_RIGHT",
            "TESLA_VEHICLE",
            "TESLA_MODEL_Y_BODY",
            "TESLA_PLATE_POP_T",
            "TESLA_FLIGHT_MODE_ROOT",
            "TESLA_WING_LEFT_PIVOT",
            "TESLA_WING_RIGHT_PIVOT",
            "TESLA_STABILIZER_LEFT_PIVOT",
            "TESLA_STABILIZER_RIGHT_PIVOT",
            "TESLA_LIFT_FAN_FRONT_DOOR_PIVOT",
            "TESLA_LIFT_FAN_REAR_DOOR_PIVOT",
            "TESLA_LIFT_FAN_FRONT_ROTOR",
            "TESLA_LIFT_FAN_REAR_ROTOR",
            "TESLA_EMISSIVE",
            "CAM_TESLA_REWARD_GAME",
            "CAM_TESLA_REWARD_NARROW_GAME",
            "CAM_TESLA_REWARD_APPROVAL",
            "CAM_TESLA_FLIGHT_MODE_APPROVAL",
        ],
        "animation": {
            "name": ANIMATION_NAME,
            "durationSeconds": FRAME_END / FPS,
            "frameStart": 0,
            "frameEnd": FRAME_END,
            "fps": FPS,
        },
        "zeroSizeMeshes": zero_size_meshes,
        "visibleProxyReplacement": "The old browser red-box reward proxy must be removed when this GLB is integrated.",
        "knownDeviations": [
            "The owner-supplied Tripo vehicle is a private reward candidate rather than exact manufacturer CAD.",
            "Flight Mode is a fictional non-operational articulated kit built around the untouched one-piece vehicle body.",
        ],
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    MASTER_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER_PATH))
    return report


if __name__ == "__main__":
    result = build()
    print("TESLA_REWARD_BUILD_REPORT=" + json.dumps(result))
