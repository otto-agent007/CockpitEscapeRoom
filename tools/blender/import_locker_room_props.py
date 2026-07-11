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
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
MASTER_PATH = REPO_ROOT / "art-source" / "blender" / "locker_room_master.blend"
REPORT_PATH = REPO_ROOT / "asset-reports" / "locker-room-prop-intake.json"
SOURCE_ROOT = REPO_ROOT / ".cache" / "cockpit-pipeline" / "sources" / "locker-room"

PROP_CONFIGS = (
    {
        "key": "pilot-watch",
        "download_source": "/mnt/2TBHDD/Downloads/gold wristwatch 3d model.glb",
        "source": SOURCE_ROOT / "pilot-watch" / "original" / "gold wristwatch 3d model.glb",
        "optimized": SOURCE_ROOT / "pilot-watch" / "optimized" / "pilot-watch.optimized.glb",
        "contract_name": "LOCKER_PROP_WATCH",
        "mesh_name": "LOCKER_PROP_WATCH_MESH",
        "hitbox_name": "LOCKER_HITBOX_WATCH",
        "material_name": "MAT_LOCKER_WATCH_TRIPO",
        "texture_prefix": "TEX_LOCKER_WATCH",
        "game_id": "locker.memory.watch",
        "interaction": "question",
        "triangle_target": 72_000,
        "texture_size": 1_024,
        "scale": 0.55,
        "rotation_z": math.radians(-45.0),
        "location": (0.42, -0.48, 0.55),
    },
    {
        "key": "pilot-wings",
        "download_source": "/mnt/2TBHDD/Downloads/gold+winged+emblem+3d+model.glb",
        "source": SOURCE_ROOT / "pilot-wings" / "original" / "gold+winged+emblem+3d+model.glb",
        "optimized": SOURCE_ROOT / "pilot-wings" / "optimized" / "pilot-wings.optimized.glb",
        "contract_name": "LOCKER_PROP_WINGS",
        "mesh_name": "LOCKER_PROP_WINGS_MESH",
        "hitbox_name": "LOCKER_HITBOX_WINGS",
        "material_name": "MAT_LOCKER_WINGS_TRIPO",
        "texture_prefix": "TEX_LOCKER_WINGS",
        "game_id": "locker.memory.wings",
        "interaction": "inspect",
        "triangle_target": 48_000,
        "texture_size": 1_024,
        "scale": 0.60,
        "rotation_z": math.radians(-90.0),
        "location": (0.42, 0.48, 1.34),
    },
    {
        "key": "charging-bull",
        "download_source": "/mnt/2TBHDD/Downloads/bull+3d+model.glb",
        "source": SOURCE_ROOT / "charging-bull" / "original" / "bull+3d+model.glb",
        "optimized": SOURCE_ROOT / "charging-bull" / "optimized" / "charging-bull.optimized.glb",
        "contract_name": "LOCKER_PROP_CHARGING_BULL",
        "mesh_name": "LOCKER_PROP_CHARGING_BULL_MESH",
        "hitbox_name": "LOCKER_HITBOX_CHARGING_BULL",
        "material_name": "MAT_LOCKER_CHARGING_BULL_TRIPO",
        "texture_prefix": "TEX_LOCKER_CHARGING_BULL",
        "game_id": "locker.memory.chargingBull",
        "interaction": "inspect",
        "triangle_target": 60_000,
        "texture_size": 1_024,
        "scale": 0.42,
        "rotation_z": math.radians(-45.0),
        "location": (0.42, -0.06, 2.03),
    },
    {
        "key": "captains-hat",
        "download_source": "/mnt/2TBHDD/Downloads/pilot cap 3d model.glb",
        "source": SOURCE_ROOT / "captains-hat" / "original" / "pilot cap 3d model.glb",
        "optimized": SOURCE_ROOT / "captains-hat" / "optimized" / "captains-hat.optimized.glb",
        "contract_name": "LOCKER_PROP_CAPTAINS_HAT",
        "mesh_name": "LOCKER_PROP_CAPTAINS_HAT_MESH",
        "hitbox_name": "LOCKER_HITBOX_CAPTAINS_HAT",
        "material_name": "MAT_LOCKER_CAPTAINS_HAT_TRIPO",
        "texture_prefix": "TEX_LOCKER_CAPTAINS_HAT",
        "game_id": "locker.promotion.hat",
        "interaction": "claim",
        "triangle_target": 70_000,
        "texture_size": 1_024,
        "scale": 0.46,
        "rotation_z": math.radians(-45.0),
        "location": (0.42, -0.45, 2.92),
    },
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


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
    bpy.data.objects.remove(obj, do_unlink=True)


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

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.42, -0.06, 1.84))
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


def resize_imported_images(images: list[bpy.types.Image], size: int, prefix: str) -> list[dict[str, object]]:
    records = []
    for index, image in enumerate(images):
        before = [int(image.size[0]), int(image.size[1])]
        if max(before) > size:
            image.scale(size, size)
            image.pack()
        role = "IMAGE"
        lower_name = image.name.lower()
        if "base" in lower_name or "color" in lower_name:
            role = "BASECOLOR"
        elif "normal" in lower_name:
            role = "NORMAL"
        elif "rough" in lower_name or lower_name.endswith("_rm.jpg"):
            role = "METALLIC_ROUGHNESS"
        image.name = f"{prefix}_{role}_{index + 1:02d}"
        records.append(
            {
                "name": image.name,
                "sourceDimensions": before,
                "stagedDimensions": [int(image.size[0]), int(image.size[1])],
                "packed": bool(image.packed_file),
            }
        )
    return records


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
    ratio = max(0.01, min(1.0, target / initial))
    for obj in meshes:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        modifier = obj.modifiers.new("Web triangle budget", type="DECIMATE")
        modifier.decimate_type = "COLLAPSE"
        modifier.ratio = ratio
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.data.validate(clean_customdata=False)
        obj.data.update()
    return initial, triangle_count(meshes)


def bake_and_center(meshes: list[bpy.types.Object], scale: float, rotation_z: float) -> dict[str, list[float]]:
    for obj in meshes:
        obj.data.transform(obj.matrix_world)
        obj.matrix_world = Matrix.Identity(4)
    bpy.context.view_layer.update()
    minimum, maximum = bounds(meshes)
    center = (minimum + maximum) * 0.5
    transform = Matrix.Rotation(rotation_z, 4, "Z") @ Matrix.Scale(scale, 4) @ Matrix.Translation(-center)
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
    source = Path(config["source"])
    if not source.exists():
        raise FileNotFoundError(source)

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

    original_minimum, original_maximum = bounds(meshes)
    initial_triangles, final_triangles = apply_decimation(meshes, int(config["triangle_target"]))
    staged_bounds = bake_and_center(meshes, float(config["scale"]), float(config["rotation_z"]))

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

    images = [image for image in bpy.data.images if image not in before_images and image.type == "IMAGE"]
    texture_records = resize_imported_images(images, int(config["texture_size"]), str(config["texture_prefix"]))
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
        "sourceTriangleCount": initial_triangles,
        "optimizedTriangleCount": final_triangles,
        "triangleReductionPercent": round((1.0 - final_triangles / initial_triangles) * 100.0, 2),
        "textures": texture_records,
        "stableContract": {
            "node": contract_root.name,
            "meshNodes": [obj.name for obj in meshes],
            "colliderNodes": [hitbox.name],
            "gameId": config["game_id"],
            "interaction": config["interaction"],
            "pivot": "centered object-space origin",
            "placement": list(config["location"]),
            "scaleApplied": config["scale"],
            "rotationZDegreesApplied": round(math.degrees(float(config["rotation_z"])), 2),
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
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.26

    hero = ensure_camera("CAM_LOCKER_APPROVAL_HERO", (0.0, -7.5, 2.0), (0.0, -0.1, 1.75), 50)
    ensure_camera("CAM_LOCKER_APPROVAL_WATCH", (0.72, -4.0, 1.1), (0.42, -0.48, 0.55), 68)
    ensure_camera("CAM_LOCKER_APPROVAL_WINGS", (0.72, -4.0, 1.5), (0.42, 0.48, 1.34), 68)
    ensure_camera("CAM_LOCKER_APPROVAL_BULL", (0.72, -4.0, 2.12), (0.42, -0.06, 2.03), 68)
    ensure_camera("CAM_LOCKER_APPROVAL_HAT", (0.72, -4.0, 3.04), (0.42, -0.45, 2.98), 68)
    scene.camera = hero

    ensure_area_light("LOCKER_APPROVAL_KEY", (3.1, -3.7, 4.8), (0.2, -0.1, 1.8), 1_050, 4.2, (1.0, 0.72, 0.46))
    ensure_area_light("LOCKER_APPROVAL_FILL", (-3.2, -2.6, 2.7), (0.0, 0.0, 1.7), 620, 4.0, (0.62, 0.74, 1.0))
    ensure_point_light("LOCKER_APPROVAL_PRACTICAL", (0.42, -0.05, 2.72), 260, (1.0, 0.42, 0.12))


def main() -> None:
    if Path(bpy.data.filepath).resolve() != MASTER_PATH.resolve():
        raise RuntimeError(f"Open {MASTER_PATH} before running this script; found {bpy.data.filepath or 'an unsaved file'}.")

    root, static, interactive = configure_master_hierarchy()
    ensure_memory_shelf(static)
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
                "optimizationDecision": "Static single-mesh props were decimated only after stable contract parents were established; the 4K watch and hat textures were staged at 1K, while the Bull and Wings retained their native 1K textures.",
                "props": records,
                "approvalPreviews": [
                    ".cache/assets/locker/previews/cam_locker_approval_hero.png",
                    ".cache/assets/locker/previews/cam_locker_approval_watch.png",
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
