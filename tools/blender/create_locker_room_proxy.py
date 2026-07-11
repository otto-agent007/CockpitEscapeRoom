"""Create the CockpitEscapeRoom locker-room proxy master deterministically."""

from __future__ import annotations

import math
import json
import shutil
import subprocess
import zipfile
from pathlib import Path

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT = REPO_ROOT / "art-source" / "blender" / "locker_room_master.blend"
CACHE_SOURCE_ROOT = REPO_ROOT / ".cache" / "cockpit-pipeline" / "sources" / "locker-room"
SOURCE_PACKAGES = {
    "game-locker": {
        "archive": CACHE_SOURCE_ROOT / "game-locker" / "game_locker.zip",
        "extract_dir": CACHE_SOURCE_ROOT / "game-locker" / "extracted",
        "root_name": "LOCKER_ENV_GAME_LOCKER",
        "location": (-0.34, 0.62, -0.12),
        "rotation": (math.radians(90), 0.0, 0.0),
        "scale": 1.55,
        "texture_size": 2048,
    },
    "locker-room-bench": {
        "archive": CACHE_SOURCE_ROOT / "locker-room-bench" / "locker_room_bench.zip",
        "extract_dir": CACHE_SOURCE_ROOT / "locker-room-bench" / "extracted",
        "root_name": "LOCKER_ENV_BENCH",
        "location": (0.0, -1.45, 0.8),
        "rotation": (math.radians(-90), 0.0, 0.0),
        "scale": 1.4,
        "texture_size": 2048,
    },
}


def reset() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for item in list(block):
            block.remove(item)


def material(name: str, color: tuple[float, float, float, float], metallic: float = 0.0, roughness: float = 0.65):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    if color[3] < 1:
        mat.blend_method = "BLEND"
        mat.use_screen_refraction = False
    principled = mat.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Alpha"].default_value = color[3]
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    return mat


def empty(name: str, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    return obj


def source_scene_path(package: dict[str, object]) -> Path | None:
    archive = package["archive"]
    extract_dir = package["extract_dir"]
    assert isinstance(archive, Path)
    assert isinstance(extract_dir, Path)
    if not archive.exists():
        return None
    source_scene = extract_dir / "scene.gltf"
    if not source_scene.exists():
        extract_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(archive) as bundle:
            bundle.extractall(extract_dir)
    return optimized_scene_path(source_scene, package)


def stage_texture(source: Path, target: Path, size: int) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    convert = shutil.which("convert")
    if convert:
        subprocess.run(
            [convert, str(source), "-resize", f"{size}x{size}>", str(target)],
            check=True,
        )
    else:
        shutil.copy2(source, target)


def optimized_scene_path(source_scene: Path, package: dict[str, object]) -> Path:
    optimized_dir = source_scene.parent / "optimized"
    optimized_scene = optimized_dir / "scene.gltf"
    scene_data = json.loads(source_scene.read_text(encoding="utf-8"))
    size = int(package["texture_size"])

    for image in scene_data.get("images", []):
        uri = image.get("uri")
        if not isinstance(uri, str):
            continue
        source = source_scene.parent / uri
        target_uri = f"textures/{Path(uri).name}"
        target = optimized_dir / target_uri
        stage_texture(source, target, size)
        image["uri"] = target_uri

    for buffer in scene_data.get("buffers", []):
        uri = buffer.get("uri")
        if isinstance(uri, str):
            source = source_scene.parent / uri
            target = optimized_dir / Path(uri).name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            buffer["uri"] = target.name

    optimized_dir.mkdir(parents=True, exist_ok=True)
    optimized_scene.write_text(json.dumps(scene_data, indent=2) + "\n", encoding="utf-8")
    return optimized_scene


def import_source_package(package_key: str, parent) -> dict[str, object] | None:
    package = SOURCE_PACKAGES[package_key]
    scene_path = source_scene_path(package)
    if scene_path is None:
        return None

    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(scene_path))
    imported = [obj for obj in bpy.data.objects if obj not in before]
    roots = [obj for obj in imported if obj.parent is None]

    container = empty(str(package["root_name"]), parent)
    container["asset_stage"] = "source-candidate"
    container["source_package"] = package_key
    container["source_scene"] = str(scene_path.relative_to(REPO_ROOT))
    container.empty_display_type = "CUBE"
    container.empty_display_size = 0.4

    for root in roots:
        root.parent = container

    container.location = package["location"]
    container.rotation_euler = package["rotation"]
    container.scale = (package["scale"], package["scale"], package["scale"])

    for obj in imported:
        obj.name = f"{package['root_name']}_{obj.name}".replace(" ", "_").upper()
        if obj.type == "MESH":
            obj["asset_stage"] = "source-candidate"
            obj["source_package"] = package_key

    return {
        "package": package_key,
        "archive": str(package["archive"].relative_to(REPO_ROOT)),
        "scene": str(scene_path.relative_to(REPO_ROOT)),
        "container": container.name,
        "importedObjectCount": len(imported),
        "meshObjectCount": len([obj for obj in imported if obj.type == "MESH"]),
    }


def cube(name: str, location, scale, mat, parent=None, bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Soft edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def sphere(name: str, location, scale, mat, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def cylinder(name: str, location, radius, depth, mat, parent=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def contract(name: str, game_id: str, interaction: str, parent, location):
    obj = empty(name, parent)
    obj.location = location
    obj["game_id"] = game_id
    obj["interaction"] = interaction
    obj["puzzle_id"] = "locker"
    obj["asset_stage"] = "proxy"
    return obj


def locator(name: str, location, parent):
    obj = empty(name, parent)
    obj.location = location
    obj.empty_display_type = "SPHERE"
    obj.empty_display_size = 0.08
    return obj


def camera(name: str, location, target, parent):
    data = bpy.data.cameras.new(name)
    data.lens = 48
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
    obj.parent = parent
    return obj


def main() -> None:
    reset()
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

    world = bpy.data.worlds.new("Locker World") if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.025, 0.018, 0.015, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.28

    steel = material("MAT_LOCKER_STEEL", (0.17, 0.22, 0.21, 1), metallic=0.32, roughness=0.68)
    steel_dark = material("MAT_LOCKER_DARK", (0.055, 0.07, 0.07, 1), metallic=0.25, roughness=0.78)
    stage_wall = material("MAT_LOCKER_ROOM_WARM_WALL", (0.105, 0.085, 0.068, 1), roughness=0.78)
    wood = material("MAT_WARM_WOOD", (0.22, 0.105, 0.045, 1), roughness=0.58)
    brass = material("MAT_WARM_BRASS", (0.58, 0.34, 0.09, 1), metallic=0.75, roughness=0.3)
    leather = material("MAT_WATCH_LEATHER", (0.095, 0.035, 0.02, 1), roughness=0.78)
    cream = material("MAT_BASEBALL", (0.72, 0.69, 0.58, 1), roughness=0.86)
    navy = material("MAT_CAPTAIN_HAT", (0.015, 0.025, 0.045, 1), roughness=0.58)
    velvet = material("MAT_WINGS_VELVET", (0.08, 0.025, 0.028, 1), roughness=0.9)
    hitbox_mat = material("MAT_LOCKER_INVISIBLE_HITBOX", (0.0, 0.0, 0.0, 0.0), roughness=1.0)

    root = empty("LOCKER_ROOT")
    root["asset_id"] = "locker"
    root["asset_stage"] = "proxy"
    static = empty("LOCKER_STATIC", root)
    source_candidates = empty("LOCKER_SOURCE_CANDIDATES", static)
    interactive = empty("LOCKER_INTERACTIVE", root)
    empty("LOCKER_COLLIDERS", root)
    locators = empty("LOCKER_LOCATORS", root)
    lights = empty("LOCKER_LIGHTS", root)

    # Source-present builds use the downloaded environment meshes as the visible
    # locker room. The generated structure remains only as a fallback when the
    # downloaded source archives are unavailable.
    imported_sources = []
    for package_key in SOURCE_PACKAGES:
        imported = import_source_package(package_key, source_candidates)
        if imported:
            imported_sources.append(imported)
    has_game_locker = any(item["package"] == "game-locker" for item in imported_sources)

    if not has_game_locker:
        cube("LOCKER_BACK_WALL", (0, 0.55, -0.34), (3.5, 2.45, 0.12), steel_dark, static, 0.03)
        cube("LOCKER_FLOOR", (0, -1.82, 1.0), (4.4, 0.1, 2.1), steel_dark, static, 0.02)
        cube("LOCKER_HERO_FRAME", (0, 0.45, -0.02), (1.65, 2.15, 0.18), steel, static, 0.05)
        cube("LOCKER_HERO_INTERIOR", (0, 0.45, 0.13), (1.42, 1.92, 0.16), steel_dark, static, 0.03)
        for x in (-2.65, 2.65):
            cube(f"LOCKER_NEIGHBOR_{'L' if x < 0 else 'R'}", (x, 0.45, -0.05), (0.8, 2.15, 0.16), steel, static, 0.04)
            for y in (-0.8, 0.45, 1.7):
                cube(f"LOCKER_NEIGHBOR_VENT_{x}_{y}", (x, y, 0.13), (0.42, 0.035, 0.03), brass, static, 0.01)
    if not any(item["package"] == "locker-room-bench" for item in imported_sources):
        cube("LOCKER_BENCH", (0, -1.35, 1.05), (2.65, 0.14, 0.48), wood, static, 0.08)
    if not has_game_locker:
        cube("LOCKER_SHELF_MID", (0, 0.32, 0.43), (1.38, 0.07, 0.35), wood, static, 0.025)
        cube("LOCKER_SHELF_LOWER", (0, -0.72, 0.43), (1.38, 0.07, 0.35), wood, static, 0.025)

        # Upper cubby and reveal door.
        cube("LOCKER_UPPER_CUBBY", (0, 1.57, 0.4), (1.38, 0.46, 0.34), steel_dark, static, 0.025)
        door = cube("LOCKER_UPPER_CUBBY_DOOR", (0, 1.2, 0.79), (1.34, 0.42, 0.055), steel, static, 0.025)
        door["animation_id"] = "LockerHatReveal"

    watch = contract("LOCKER_PROP_WATCH", "locker.memory.watch", "question", interactive, (-0.82, 0.58, 0.83))
    if has_game_locker:
        cube("LOCKER_HITBOX_WATCH", (0, 0, 0), (0.32, 0.32, 0.32), hitbox_mat, watch, 0)["hitbox"] = True
    else:
        cylinder("LOCKER_PROXY_WATCH_FACE", (0, 0, 0), 0.18, 0.07, brass, watch, rotation=(math.pi / 2, 0, 0))["placeholder"] = True
        cube("LOCKER_PROXY_WATCH_STRAP", (0, -0.02, 0), (0.08, 0.38, 0.035), leather, watch, 0.03)["placeholder"] = True

    baseball = contract("LOCKER_PROP_BASEBALL", "locker.memory.baseball", "question", interactive, (-0.72, -0.33, 0.83))
    if has_game_locker:
        cube("LOCKER_HITBOX_BASEBALL", (0, 0, 0), (0.34, 0.34, 0.34), hitbox_mat, baseball, 0)["hitbox"] = True
    else:
        sphere("LOCKER_PROXY_BASEBALL", (0, 0, 0), (0.24, 0.24, 0.24), cream, baseball)["placeholder"] = True

    wings = contract("LOCKER_PROP_WINGS", "locker.memory.wings", "inspect", interactive, (0.38, 0.58, 0.83))
    if has_game_locker:
        cube("LOCKER_HITBOX_WINGS", (0, 0, 0), (0.5, 0.32, 0.28), hitbox_mat, wings, 0)["hitbox"] = True
    else:
        cube("LOCKER_PROXY_WINGS_BACKING", (0, 0, -0.035), (0.48, 0.28, 0.035), velvet, wings, 0.05)["placeholder"] = True
        left_wing = sphere("LOCKER_PROXY_WING_L", (-0.22, 0, 0.02), (0.3, 0.09, 0.04), brass, wings)
        right_wing = sphere("LOCKER_PROXY_WING_R", (0.22, 0, 0.02), (0.3, 0.09, 0.04), brass, wings)
        left_wing["placeholder"] = right_wing["placeholder"] = True

    bull = contract("LOCKER_PROP_CHARGING_BULL", "locker.memory.charging_bull", "inspect", interactive, (0.62, -0.3, 0.82))
    if has_game_locker:
        cube("LOCKER_HITBOX_CHARGING_BULL", (0, 0, 0), (0.52, 0.32, 0.3), hitbox_mat, bull, 0)["hitbox"] = True
    else:
        sphere("LOCKER_PROXY_BULL_BODY", (0, 0, 0), (0.34, 0.18, 0.18), brass, bull)["placeholder"] = True
        sphere("LOCKER_PROXY_BULL_HEAD", (0.31, 0.03, 0.06), (0.14, 0.13, 0.13), brass, bull)["placeholder"] = True
        for side in (-1, 1):
            horn = cylinder(f"LOCKER_PROXY_BULL_HORN_{side}", (0.39, side * 0.13, 0.13), 0.025, 0.22, cream, bull, rotation=(side * 0.65, 0.2, 0))
            horn["placeholder"] = True

    hat = contract("LOCKER_PROP_CAPTAINS_HAT", "locker.promotion.hat", "claim", interactive, (0, 1.58, 0.84))
    if has_game_locker:
        cube("LOCKER_HITBOX_CAPTAINS_HAT", (0, 0, 0), (0.54, 0.32, 0.32), hitbox_mat, hat, 0)["hitbox"] = True
    else:
        cylinder("LOCKER_PROXY_HAT_CROWN", (0, 0.03, 0), 0.34, 0.22, navy, hat, rotation=(math.pi / 2, 0, 0))["placeholder"] = True
        cube("LOCKER_PROXY_HAT_BRIM", (0, -0.05, 0.16), (0.42, 0.16, 0.035), navy, hat, 0.08)["placeholder"] = True
        cube("LOCKER_PROXY_HAT_BAND", (0, -0.12, 0.02), (0.31, 0.035, 0.035), brass, hat, 0.02)["placeholder"] = True

    for key, location in {
        "WATCH": (-0.82, 0.58, 1.45),
        "BASEBALL": (-0.72, -0.33, 1.45),
        "WINGS": (0.38, 0.58, 1.45),
        "CHARGING_BULL": (0.62, -0.3, 1.45),
        "HAT": (0, 1.58, 1.6),
    }.items():
        locator(f"LOCKER_LOC_FOCUS_{key}_CAMERA", location, locators)

    game_camera = camera("CAM_LOCKER_GAME_VIEW", (0, 0.15, 6.15), (0, 0.3, 0.35), root)
    camera("CAM_LOCKER_APPROVAL_HERO", (0, 0.25, 6.5), (0, 0.35, 0.3), root)
    camera("CAM_LOCKER_APPROVAL_DETAIL", (1.9, 0.4, 4.4), (0, 0.5, 0.45), root)
    scene.camera = game_camera

    area_data = bpy.data.lights.new("LOCKER_APPROVAL_KEY", type="AREA")
    area_data.energy = 900
    area_data.color = (1.0, 0.7, 0.42)
    area_data.shape = "DISK"
    area_data.size = 4.0
    area = bpy.data.objects.new("LOCKER_APPROVAL_KEY", area_data)
    bpy.context.collection.objects.link(area)
    area.location = (2.8, 4.5, 4.2)
    area.rotation_euler = (Vector((0, 0.4, 0.3)) - area.location).to_track_quat("-Z", "Y").to_euler()
    area.parent = lights

    hat_light_data = bpy.data.lights.new("LOCKER_HAT_LIGHT", type="POINT")
    hat_light_data.energy = 250
    hat_light_data.color = (1.0, 0.42, 0.12)
    hat_light = bpy.data.objects.new("LOCKER_HAT_LIGHT", hat_light_data)
    bpy.context.collection.objects.link(hat_light)
    hat_light.location = (0, 1.65, 1.22)
    hat_light.parent = lights

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT))
    intake_report = REPO_ROOT / "asset-reports" / "locker-room-source-intake.json"
    intake_report.parent.mkdir(parents=True, exist_ok=True)
    intake_report.write_text(
        json.dumps(
            {
                "asset": "locker",
                "sourceCandidates": imported_sources,
                "note": "Original archives are preserved under .cache/cockpit-pipeline/sources/locker-room. Imported meshes are candidates under stable environment roots; gameplay contract nodes remain separate.",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Created locker proxy master: {OUTPUT}")


if __name__ == "__main__":
    main()
