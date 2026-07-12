"""Import, optimize, place, and contract the owner-supplied locker props.

The script extends the current owner-adjusted locker master. It deliberately does
not rebuild the environment from ``create_locker_room_proxy.py``.

Run with the master already opened by Blender:

    blender --background --disable-autoexec art-source/blender/locker_room_master.blend \
      --python tools/blender/import_locker_room_props.py
"""

from __future__ import annotations

import hashlib
import json
import math
import shutil
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
MASTER_PATH = REPO_ROOT / "art-source" / "blender" / "locker_room_master.blend"
REPORT_PATH = REPO_ROOT / "asset-reports" / "locker-room-prop-intake.json"
SOURCE_ROOT = REPO_ROOT / ".cache" / "cockpit-pipeline" / "sources" / "locker-room"
BASEBALL_SOURCE_ROOT = REPO_ROOT / ".cache" / "cockpit-pipeline" / "sources" / "locker"

PROP_CONFIGS = (
    {
        "key": "baseball",
        "download_source": "/mnt/2TBHDD/Downloads/baseball 3d model4kInterior.glb",
        "source": BASEBALL_SOURCE_ROOT / "baseball" / "original" / "baseball 3d model4kInterior.glb",
        "expected_sha256": "e77bd1ef4f85705edb2f6ff5bfc5d91d17f5243c9cd77d9c147b204b58617725",
        "optimized": BASEBALL_SOURCE_ROOT / "baseball" / "optimized" / "baseball.optimized.glb",
        "contract_name": "LOCKER_PROP_BASEBALL",
        "mesh_name": "LOCKER_PROP_BASEBALL_MESH",
        "hitbox_name": "LOCKER_HITBOX_BASEBALL",
        "material_name": "MAT_LOCKER_BASEBALL_TRIPO",
        "texture_prefix": "TEX_LOCKER_BASEBALL",
        "game_id": "locker.memory.baseball",
        "interaction": "question",
        "triangle_target": 72_000,
        "minimum_source_texture_size": 4_096,
        "texture_size": 2_048,
        "scale": 0.30,
        "rotation_euler": (math.radians(-45.0), 0.0, math.radians(90.0)),
        "location": (0.64, -0.48, 1.34),
    },
    {
        "key": "pilot-watch",
        "download_source": "/mnt/2TBHDD/Downloads/gold wristwatch 3d model.glb",
        "source": SOURCE_ROOT / "pilot-watch" / "original" / "gold wristwatch 3d model.glb",
        "expected_sha256": "cb904e609a02f7a6d1a25fb1e4b8d69147c48912f34e375b1369aba927960c91",
        "optimized": SOURCE_ROOT / "pilot-watch" / "optimized" / "pilot-watch.optimized.glb",
        "contract_name": "LOCKER_PROP_WATCH",
        "mesh_name": "LOCKER_PROP_WATCH_MESH",
        "hitbox_name": "LOCKER_HITBOX_WATCH",
        "material_name": "MAT_LOCKER_WATCH_TRIPO",
        "texture_prefix": "TEX_LOCKER_WATCH",
        "game_id": "locker.memory.watch",
        "interaction": "question",
        "triangle_target": 72_000,
        "minimum_source_texture_size": 4_096,
        "texture_size": 1_024,
        "scale": 0.55,
        "rotation_euler": (0.0, 0.0, math.radians(-45.0)),
        "location": (0.56, -0.48, 0.55),
    },
    {
        "key": "pilot-wings",
        "download_source": "/mnt/2TBHDD/Downloads/gold winged emblem 3d model4k.glb",
        "source": SOURCE_ROOT / "pilot-wings" / "original" / "gold winged emblem 3d model4k.glb",
        "expected_sha256": "27d2a4731419d1f7a44873b7aeb69869d6d33f23dc82f32657268db9fa85b36b",
        "optimized": SOURCE_ROOT / "pilot-wings" / "optimized" / "pilot-wings.optimized.glb",
        "contract_name": "LOCKER_PROP_WINGS",
        "mesh_name": "LOCKER_PROP_WINGS_MESH",
        "hitbox_name": "LOCKER_HITBOX_WINGS",
        "material_name": "MAT_LOCKER_WINGS_TRIPO",
        "texture_prefix": "TEX_LOCKER_WINGS",
        "game_id": "locker.memory.wings",
        "interaction": "question",
        "triangle_target": 72_000,
        "minimum_source_texture_size": 4_096,
        "texture_size": 2_048,
        "scale": 0.60,
        "rotation_euler": (0.0, 0.0, math.radians(-90.0)),
        "location": (0.56, -0.06, 2.55),
    },
    {
        "key": "charging-bull",
        "download_source": "/mnt/2TBHDD/Downloads/bull 3d model4kNight.glb",
        "source": SOURCE_ROOT / "charging-bull" / "original" / "bull 3d model4kNight.glb",
        "expected_sha256": "a5ca94020d9a0de950666d7e8ab8da1eff861a42f48bfb06e29a6f83dcd3d1f1",
        "optimized": SOURCE_ROOT / "charging-bull" / "optimized" / "charging-bull.optimized.glb",
        "contract_name": "LOCKER_PROP_CHARGING_BULL",
        "mesh_name": "LOCKER_PROP_CHARGING_BULL_MESH",
        "hitbox_name": "LOCKER_HITBOX_CHARGING_BULL",
        "material_name": "MAT_LOCKER_CHARGING_BULL_TRIPO",
        "texture_prefix": "TEX_LOCKER_CHARGING_BULL",
        "game_id": "locker.memory.chargingBull",
        "interaction": "question",
        "triangle_target": 72_000,
        "minimum_source_texture_size": 4_096,
        "texture_size": 2_048,
        "scale": 0.42,
        "rotation_euler": (0.0, 0.0, math.radians(-45.0)),
        "location": (0.42, 0.48, 2.03),
    },
    {
        "key": "captains-hat",
        "download_source": "/mnt/2TBHDD/Downloads/pilot cap 3d model.glb",
        "source": SOURCE_ROOT / "captains-hat" / "original" / "pilot cap 3d model.glb",
        "expected_sha256": "7ba8f765c94f6ee3caca2f132ae0954400c161a5ae60bf7e3eac95e9f7eed84e",
        "optimized": SOURCE_ROOT / "captains-hat" / "optimized" / "captains-hat.optimized.glb",
        "contract_name": "LOCKER_PROP_CAPTAINS_HAT",
        "mesh_name": "LOCKER_PROP_CAPTAINS_HAT_MESH",
        "hitbox_name": "LOCKER_HITBOX_CAPTAINS_HAT",
        "material_name": "MAT_LOCKER_CAPTAINS_HAT_TRIPO",
        "texture_prefix": "TEX_LOCKER_CAPTAINS_HAT",
        "game_id": "locker.promotion.hat",
        "interaction": "claim",
        "triangle_target": 70_000,
        "minimum_source_texture_size": 4_096,
        "texture_size": 1_024,
        "scale": 0.46,
        "rotation_euler": (0.0, 0.0, math.radians(-45.0)),
        "location": (0.56, -0.45, 2.92),
    },
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def preserve_original_source(config: dict[str, object]) -> Path:
    """Copy a configured download once, then enforce its immutable source hash."""
    source = Path(config["source"])
    download = Path(str(config["download_source"]))
    expected = str(config["expected_sha256"])
    if not source.exists():
        if not download.exists():
            raise FileNotFoundError(f"Missing Tripo download: {download}")
        if sha256(download) != expected:
            raise RuntimeError(f"Tripo download hash does not match the approved source: {download}")
        source.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(download, source)
    if sha256(source) != expected:
        raise RuntimeError(f"Preserved Tripo source changed unexpectedly: {source}")
    return source


def empty(name: str, parent: bpy.types.Object | None = None) -> bpy.types.Object:
    existing = bpy.data.objects.get(name)
    if existing is not None:
        if parent is not None and existing.parent is not parent:
            world = existing.matrix_world.copy()
            existing.parent = parent
            existing.matrix_world = world
        return existing
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    return obj


def delete_hierarchy(obj: bpy.types.Object) -> None:
    for child in list(obj.children):
        delete_hierarchy(child)
    data = obj.data
    materials = list(data.materials) if isinstance(data, bpy.types.Mesh) else []
    images = {
        node.image
        for material in materials
        if material and material.use_nodes
        for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE" and node.image is not None
    }
    bpy.data.objects.remove(obj, do_unlink=True)
    if data is not None and data.users == 0:
        if isinstance(data, bpy.types.Mesh):
            bpy.data.meshes.remove(data)
        elif isinstance(data, bpy.types.Camera):
            bpy.data.cameras.remove(data)
        elif isinstance(data, bpy.types.Light):
            bpy.data.lights.remove(data)
    for material in materials:
        if material is not None and material.users == 0:
            bpy.data.materials.remove(material)
    for image in images:
        if image.users == 0:
            bpy.data.images.remove(image)


def purge_legacy_locker_orphans() -> None:
    """Remove only stale datablocks created by earlier runs of this importer."""
    mesh_prefixes = (
        "LOCKER_PROP_BASEBALL_MESH_GEOMETRY",
        "LOCKER_PROP_WATCH_MESH_GEOMETRY",
        "LOCKER_PROP_WINGS_MESH_GEOMETRY",
        "LOCKER_PROP_CHARGING_BULL_MESH_GEOMETRY",
        "LOCKER_PROP_CAPTAINS_HAT_MESH_GEOMETRY",
        "LOCKER_HITBOX_BASEBALL_GEOMETRY",
        "LOCKER_HITBOX_WATCH_GEOMETRY",
        "LOCKER_HITBOX_WINGS_GEOMETRY",
        "LOCKER_HITBOX_CHARGING_BULL_GEOMETRY",
        "LOCKER_HITBOX_CAPTAINS_HAT_GEOMETRY",
        "LOCKER_ENV_MEMORY_SHELF_GEOMETRY",
        "LOCKER_ENV_BASEBALL_SHELF_GEOMETRY",
    )
    material_prefixes = tuple(str(config["material_name"]) for config in PROP_CONFIGS)
    image_prefixes = tuple(str(config["texture_prefix"]) for config in PROP_CONFIGS)
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0 and mesh.name.startswith(mesh_prefixes):
            bpy.data.meshes.remove(mesh)
    for material in list(bpy.data.materials):
        if material.users == 0 and material.name.startswith(material_prefixes):
            bpy.data.materials.remove(material)
    for image in list(bpy.data.images):
        if image.users == 0 and image.name.startswith(image_prefixes):
            bpy.data.images.remove(image)


def triangle_count(objects: list[bpy.types.Object]) -> int:
    total = 0
    for obj in objects:
        if obj.type != "MESH":
            continue
        obj.data.calc_loop_triangles()
        total += len(obj.data.loop_triangles)
    return total


def bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for obj in objects if obj.type == "MESH" for corner in obj.bound_box]
    if not points:
        raise RuntimeError("Imported prop contains no mesh bounds.")
    return (
        Vector(tuple(min(point[index] for point in points) for index in range(3))),
        Vector(tuple(max(point[index] for point in points) for index in range(3))),
    )


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def ensure_camera(name: str, location: tuple[float, float, float], target: tuple[float, float, float], lens: float) -> bpy.types.Object:
    obj = bpy.data.objects.get(name)
    if obj is None or obj.type != "CAMERA":
        if obj is not None:
            delete_hierarchy(obj)
        data = bpy.data.cameras.new(name)
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.data.lens = lens
    look_at(obj, target)
    return obj


def ensure_area_light(
    name: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    energy: float,
    size: float,
    color: tuple[float, float, float],
) -> bpy.types.Object:
    obj = bpy.data.objects.get(name)
    if obj is None or obj.type != "LIGHT":
        if obj is not None:
            delete_hierarchy(obj)
        data = bpy.data.lights.new(name, type="AREA")
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.data.energy = energy
    obj.data.shape = "DISK"
    obj.data.size = size
    obj.data.color = color
    look_at(obj, target)
    return obj


def ensure_point_light(
    name: str,
    location: tuple[float, float, float],
    energy: float,
    color: tuple[float, float, float],
) -> bpy.types.Object:
    obj = bpy.data.objects.get(name)
    if obj is None or obj.type != "LIGHT":
        if obj is not None:
            delete_hierarchy(obj)
        data = bpy.data.lights.new(name, type="POINT")
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.data.energy = energy
    obj.data.color = color
    obj.data.shadow_soft_size = 0.42
    return obj


def ensure_memory_shelf(static: bpy.types.Object) -> bpy.types.Object:
    name = "LOCKER_ENV_MEMORY_SHELF"
    existing = bpy.data.objects.get(name)
    if existing is not None:
        delete_hierarchy(existing)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.42, 0.48, 1.84))
    shelf = bpy.context.object
    shelf.name = name
    shelf.data.name = f"{name}_GEOMETRY"
    shelf.scale = (0.39, 0.54, 0.022)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    shelf.parent = static
    shelf["asset_stage"] = "owner-review-candidate"
    shelf["supports_game_id"] = "locker.memory.chargingBull"

    material = bpy.data.materials.get("MAT_LOCKER_MEMORY_SHELF")
    if material is None:
        material = bpy.data.materials.new("MAT_LOCKER_MEMORY_SHELF")
        material.diffuse_color = (0.025, 0.024, 0.022, 1.0)
        material.metallic = 0.72
        material.roughness = 0.42
        material.use_nodes = True
        principled = material.node_tree.nodes.get("Principled BSDF")
        principled.inputs["Base Color"].default_value = (0.025, 0.024, 0.022, 1.0)
        principled.inputs["Metallic"].default_value = 0.72
        principled.inputs["Roughness"].default_value = 0.42
    shelf.data.materials.append(material)
    return shelf


def ensure_baseball_shelf(static: bpy.types.Object) -> bpy.types.Object:
    name = "LOCKER_ENV_BASEBALL_SHELF"
    existing = bpy.data.objects.get(name)
    if existing is not None:
        delete_hierarchy(existing)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.64, -0.48, 1.17))
    shelf = bpy.context.object
    shelf.name = name
    shelf.data.name = f"{name}_GEOMETRY"
    shelf.scale = (0.39, 0.54, 0.022)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    shelf.parent = static
    shelf["asset_stage"] = "owner-review-candidate"
    shelf["supports_game_id"] = "locker.memory.baseball"

    material = bpy.data.materials.get("MAT_LOCKER_MEMORY_SHELF")
    if material is not None:
        shelf.data.materials.append(material)
    return shelf


def configure_master_hierarchy() -> tuple[bpy.types.Object, bpy.types.Object, bpy.types.Object]:
    root = empty("LOCKER_ROOT")
    root["asset_id"] = "locker"
    root["asset_stage"] = "owner-review-candidate"
    static = empty("LOCKER_STATIC", root)
    interactive = empty("LOCKER_INTERACTIVE", root)

    for name in ("LOCKER_ENV_GAME_LOCKER", "LOCKER_ENV_BENCH"):
        obj = bpy.data.objects.get(name)
        if obj is None:
            raise RuntimeError(f"Owner-adjusted locker master is missing {name}.")
        if obj.parent is not static:
            world = obj.matrix_world.copy()
            obj.parent = static
            obj.matrix_world = world
    return root, static, interactive


REQUIRED_TRIPO_TEXTURE_ROLES = ("baseColor", "normal", "metallicRoughness")


def linked_image(socket: bpy.types.NodeSocket) -> bpy.types.Image | None:
    """Find the first image texture feeding a material input through utility nodes."""
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


def find_required_texture_roles(meshes: list[bpy.types.Object], asset_key: str) -> dict[str, bpy.types.Image]:
    observed_roles: set[str] = set()
    for material in {material for obj in meshes for material in obj.data.materials if material and material.use_nodes}:
        principled_nodes = [node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"]
        for principled in principled_nodes:
            base_color = linked_image(principled.inputs["Base Color"])
            normal = linked_image(principled.inputs["Normal"])
            metallic = linked_image(principled.inputs["Metallic"])
            roughness = linked_image(principled.inputs["Roughness"])
            roles: dict[str, bpy.types.Image] = {}
            if base_color is not None:
                roles["baseColor"] = base_color
            if normal is not None:
                roles["normal"] = normal
            if metallic is not None and roughness is metallic:
                roles["metallicRoughness"] = metallic
            observed_roles.update(roles)
            if all(role in roles for role in REQUIRED_TRIPO_TEXTURE_ROLES):
                return roles

    missing = [role for role in REQUIRED_TRIPO_TEXTURE_ROLES if role not in observed_roles]
    if missing:
        raise RuntimeError(
            f"{asset_key} must wire a complete Tripo PBR set into the imported material; missing {missing}."
        )
    raise RuntimeError(f"{asset_key} splits required Tripo PBR roles across materials; one complete material is required.")


def resize_imported_images(
    images: list[bpy.types.Image],
    size: int,
    prefix: str,
    required_roles: dict[str, bpy.types.Image],
) -> list[dict[str, object]]:
    records = []
    role_by_image = {image: role for role, image in required_roles.items()}
    for index, image in enumerate(images):
        before = [int(image.size[0]), int(image.size[1])]
        if max(before) > size:
            image.scale(size, size)
            image.pack()
        role = role_by_image.get(image, "additional")
        role_label = {
            "baseColor": "BASECOLOR",
            "normal": "NORMAL",
            "metallicRoughness": "METALLIC_ROUGHNESS",
            "additional": "IMAGE",
        }[role]
        image.name = f"{prefix}_{role_label}_{index + 1:02d}"
        records.append(
            {
                "name": image.name,
                "role": role,
                "sourceDimensions": before,
                "stagedDimensions": [int(image.size[0]), int(image.size[1])],
                "packed": bool(image.packed_file),
            }
        )
    return records


def validate_source_textures(
    required_roles: dict[str, bpy.types.Image],
    minimum_size: int,
    asset_key: str,
) -> dict[str, object]:
    dimensions_by_role = {
        role: [int(required_roles[role].size[0]), int(required_roles[role].size[1])]
        for role in REQUIRED_TRIPO_TEXTURE_ROLES
    }
    undersized = {role: dimensions for role, dimensions in dimensions_by_role.items() if min(dimensions) < minimum_size}
    if undersized:
        raise RuntimeError(
            f"{asset_key} failed the {minimum_size}px Tripo source gate; found {undersized}. "
            "Download the 4K Tripo asset before rebuilding the locker."
        )
    return {
        "requiredMinimum": [minimum_size, minimum_size],
        "requiredRoles": list(REQUIRED_TRIPO_TEXTURE_ROLES),
        "sourceTextureCount": len(required_roles),
        "sourceDimensionsByRole": dimensions_by_role,
        "passed": True,
    }


def add_contract_hitbox(contract_root: bpy.types.Object, name: str, staged_bounds: dict[str, list[float]]) -> bpy.types.Object:
    minimum = Vector(staged_bounds["minimum"])
    maximum = Vector(staged_bounds["maximum"])
    center = (minimum + maximum) * 0.5
    size = (maximum - minimum) * 1.08
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=center)
    hitbox = bpy.context.object
    hitbox.name = name
    hitbox.data.name = f"{name}_GEOMETRY"
    hitbox.scale = size * 0.5
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    hitbox.parent = contract_root
    hitbox["hitbox"] = True
    hitbox["asset_stage"] = "runtime-contract"
    material = bpy.data.materials.get("MAT_LOCKER_INVISIBLE_HITBOX")
    if material is None:
        material = bpy.data.materials.new("MAT_LOCKER_INVISIBLE_HITBOX")
        material.diffuse_color = (0.0, 0.0, 0.0, 0.0)
        material.use_nodes = True
        principled = material.node_tree.nodes.get("Principled BSDF")
        principled.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 0.0)
        principled.inputs["Alpha"].default_value = 0.0
    hitbox.data.materials.append(material)
    return hitbox


def apply_decimation(meshes: list[bpy.types.Object], target: int) -> tuple[int, int]:
    initial = triangle_count(meshes)
    if initial <= target:
        return initial, initial
    for obj in meshes:
        for _ in range(8):
            bpy.context.view_layer.update()
            current = triangle_count([obj])
            if current <= target:
                break
            bpy.ops.object.select_all(action="DESELECT")
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            modifier = obj.modifiers.new("Web triangle budget", type="DECIMATE")
            modifier.decimate_type = "COLLAPSE"
            modifier.ratio = max(0.001, min(1.0, target / current))
            modifier.use_collapse_triangulate = True
            bpy.ops.object.modifier_apply(modifier=modifier.name)
            obj.data.validate(clean_customdata=False)
            obj.data.update()
    return initial, triangle_count(meshes)


def bake_and_center(
    meshes: list[bpy.types.Object],
    scale: float,
    rotation_euler: tuple[float, float, float],
) -> dict[str, list[float]]:
    for obj in meshes:
        obj.data.transform(obj.matrix_world)
        obj.matrix_world = Matrix.Identity(4)
    bpy.context.view_layer.update()
    minimum, maximum = bounds(meshes)
    center = (minimum + maximum) * 0.5
    rotation = Euler(rotation_euler, "XYZ").to_matrix().to_4x4()
    transform = rotation @ Matrix.Scale(scale, 4) @ Matrix.Translation(-center)
    for obj in meshes:
        obj.data.transform(transform)
        obj.data.update()
    bpy.context.view_layer.update()
    staged_minimum, staged_maximum = bounds(meshes)
    return {
        "minimum": [round(value, 6) for value in staged_minimum],
        "maximum": [round(value, 6) for value in staged_maximum],
        "size": [round(value, 6) for value in staged_maximum - staged_minimum],
    }


def export_optimized_prop(root: bpy.types.Object, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_apply=False,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )


def import_prop(config: dict[str, object], interactive: bpy.types.Object) -> dict[str, object]:
    source = preserve_original_source(config)

    old_root = bpy.data.objects.get(str(config["contract_name"]))
    if old_root is not None:
        delete_hierarchy(old_root)

    before_objects = set(bpy.data.objects)
    before_images = set(bpy.data.images)
    bpy.ops.import_scene.gltf(filepath=str(source))
    imported = [obj for obj in bpy.data.objects if obj not in before_objects]
    meshes = [obj for obj in imported if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"{source.name} imported without a mesh.")
    images = [image for image in bpy.data.images if image not in before_images and image.type == "IMAGE"]
    required_texture_roles = find_required_texture_roles(meshes, str(config["key"]))
    texture_quality_gate = validate_source_textures(
        required_texture_roles,
        int(config["minimum_source_texture_size"]),
        str(config["key"]),
    )

    original_minimum, original_maximum = bounds(meshes)
    source_triangle_count = triangle_count(meshes)
    _, final_triangles = apply_decimation(meshes, int(config["triangle_target"]))
    rotation_euler = tuple(float(value) for value in config["rotation_euler"])
    staged_bounds = bake_and_center(meshes, float(config["scale"]), rotation_euler)

    contract_root = empty(str(config["contract_name"]), interactive)
    contract_root["game_id"] = str(config["game_id"])
    contract_root["interaction"] = str(config["interaction"])
    contract_root["puzzle_id"] = "locker"
    contract_root["asset_stage"] = "owner-review-candidate"
    contract_root["source_kind"] = "Tripo owner-supplied GLB"
    contract_root["source_sha256"] = sha256(source)
    contract_root["optimized_triangle_count"] = final_triangles

    for index, obj in enumerate(meshes):
        obj.parent = contract_root
        obj.name = str(config["mesh_name"]) if index == 0 else f"{config['mesh_name']}_{index + 1:02d}"
        obj.data.name = f"{obj.name}_GEOMETRY"
        obj["asset_stage"] = "owner-review-candidate"
        obj["source_asset"] = str(config["key"])
        for material in obj.data.materials:
            if material:
                material.name = str(config["material_name"])

    material_treatment = "tripo-4k-pbr-source"
    texture_records = resize_imported_images(
        images,
        int(config["texture_size"]),
        str(config["texture_prefix"]),
        required_texture_roles,
    )
    hitbox = add_contract_hitbox(contract_root, str(config["hitbox_name"]), staged_bounds)

    optimized = Path(config["optimized"])
    contract_root.location = (0.0, 0.0, 0.0)
    export_optimized_prop(contract_root, optimized)
    contract_root.location = tuple(config["location"])
    bpy.context.view_layer.update()

    return {
        "asset": config["key"],
        "sourceCreator": "Tripo AI owner-supplied candidate",
        "sourceGenerator": "Tripo",
        "downloadSourcePath": config["download_source"],
        "sourcePath": str(source.relative_to(REPO_ROOT)),
        "sourceFileSize": source.stat().st_size,
        "sourceSha256": sha256(source),
        "sourceBounds": {
            "minimum": [round(value, 6) for value in original_minimum],
            "maximum": [round(value, 6) for value in original_maximum],
            "size": [round(value, 6) for value in original_maximum - original_minimum],
        },
        "sourceObjectCount": len(imported),
        "meshObjectCount": len(meshes),
        "materialCount": len({material.name for obj in meshes for material in obj.data.materials if material}),
        "sourceTriangleCount": source_triangle_count,
        "optimizedTriangleCount": final_triangles,
        "triangleReductionPercent": round((1.0 - final_triangles / source_triangle_count) * 100.0, 2),
        "textures": texture_records,
        "textureQualityGate": texture_quality_gate,
        "materialTreatment": material_treatment,
        "stylizedBaseColorPath": None,
        "stableContract": {
            "node": contract_root.name,
            "meshNodes": [obj.name for obj in meshes],
            "colliderNodes": [hitbox.name],
            "gameId": config["game_id"],
            "interaction": config["interaction"],
            "pivot": "centered object-space origin",
            "placement": list(config["location"]),
            "scaleApplied": config["scale"],
            "rotationXYZDegreesApplied": [round(math.degrees(value), 2) for value in rotation_euler],
            "rotationZDegreesApplied": round(math.degrees(rotation_euler[2]), 2),
        },
        "stagedBounds": staged_bounds,
        "optimizedPath": str(optimized.relative_to(REPO_ROOT)),
        "optimizedFileSize": optimized.stat().st_size,
        "optimizedSha256": sha256(optimized),
    }


def configure_approval_scene() -> None:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"

    world = scene.world or bpy.data.worlds.new("Locker approval world")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.018, 0.012, 0.01, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.22

    hero = ensure_camera("CAM_LOCKER_APPROVAL_HERO", (0.0, -7.5, 2.0), (0.0, -0.1, 1.75), 50)
    ensure_camera("CAM_LOCKER_APPROVAL_WATCH", (0.72, -4.0, 1.1), (0.56, -0.48, 0.55), 68)
    ensure_camera("CAM_LOCKER_APPROVAL_BASEBALL", (0.40, -4.0, 1.7), (0.64, -0.48, 1.34), 68)
    ensure_camera("CAM_LOCKER_APPROVAL_WINGS", (0.72, -4.0, 2.64), (0.56, -0.06, 2.55), 68)
    ensure_camera("CAM_LOCKER_APPROVAL_BULL", (0.72, -4.0, 2.2), (0.42, 0.48, 2.03), 68)
    ensure_camera("CAM_LOCKER_APPROVAL_HAT", (0.72, -4.0, 3.04), (0.56, -0.45, 2.98), 68)
    scene.camera = hero

    ensure_area_light("LOCKER_APPROVAL_KEY", (3.1, -3.7, 4.8), (0.2, -0.1, 1.8), 920, 4.2, (1.0, 0.72, 0.46))
    ensure_area_light("LOCKER_APPROVAL_FILL", (-3.2, -2.6, 2.7), (0.0, 0.0, 1.7), 540, 4.0, (0.62, 0.74, 1.0))
    ensure_point_light("LOCKER_APPROVAL_PRACTICAL", (0.42, -0.05, 2.72), 225, (1.0, 0.42, 0.12))


def main() -> None:
    if Path(bpy.data.filepath).resolve() != MASTER_PATH.resolve():
        raise RuntimeError(f"Open {MASTER_PATH} before running this script; found {bpy.data.filepath or 'an unsaved file'}.")

    purge_legacy_locker_orphans()
    root, static, interactive = configure_master_hierarchy()
    ensure_memory_shelf(static)
    ensure_baseball_shelf(static)
    records = [import_prop(config, interactive) for config in PROP_CONFIGS]
    configure_approval_scene()
    root["prop_intake_report"] = str(REPORT_PATH.relative_to(REPO_ROOT))

    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER_PATH))
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(
        json.dumps(
            {
                "asset": "locker",
                "sceneGroup": "locker room scene",
                "blenderVersion": bpy.app.version_string,
                "masterPath": str(MASTER_PATH.relative_to(REPO_ROOT)),
                "masterSha256": sha256(MASTER_PATH),
                "sourcePolicy": "Original owner-supplied Tripo GLBs preserved untouched; edited copies pass through Blender before runtime export.",
                "sourceAuthority": "Owner-supplied Tripo candidates from /mnt/2TBHDD/Downloads; no third-party aircraft reference authority is inferred from these personal props.",
                "sourceQualityRule": "Tripo runtime candidates require one material with complete 4096px BaseColor, Normal, and metallic-roughness source maps.",
                "optimizationDecision": "All five Tripo sources must pass the 4K intake gate. Watch and hat retain their existing 1K runtime staging; baseball, Bull, and Wings begin at 2K and may be reduced only after same-camera browser evidence and owner review. Static single-mesh props are decimated only after stable contract parents are established.",
                "props": records,
                "approvalPreviews": [
                    ".cache/assets/locker/previews/cam_locker_approval_hero.png",
                    ".cache/assets/locker/previews/cam_locker_approval_watch.png",
                    ".cache/assets/locker/previews/cam_locker_approval_baseball.png",
                    ".cache/assets/locker/previews/cam_locker_approval_wings.png",
                    ".cache/assets/locker/previews/cam_locker_approval_bull.png",
                    ".cache/assets/locker/previews/cam_locker_approval_hat.png",
                ],
                "status": "owner-review-candidate",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"LOCKER_PROP_INTAKE_REPORT={REPORT_PATH}")


if __name__ == "__main__":
    main()
