"""Deterministically intake and stage the owner-supplied golden key for the DC-9.

The source remains untouched in the cockpit cache. This module is called by
``build_dc9_production.py`` after the DC-9 contract groups exist.
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
DOWNLOAD_SOURCE = Path("/mnt/2TBHDD/Downloads/golden key 3d model.glb")
SOURCE_PATH = REPO_ROOT / ".cache" / "cockpit-pipeline" / "sources" / "dc9" / "golden-key" / "original" / DOWNLOAD_SOURCE.name
OPTIMIZED_PATH = REPO_ROOT / ".cache" / "cockpit-pipeline" / "sources" / "dc9" / "golden-key" / "optimized" / "golden-key.optimized.glb"
REPORT_PATH = REPO_ROOT / "asset-reports" / "dc9-golden-key-intake.json"
EXPECTED_SHA256 = "b243ec3571ef597048ad8ef08ae63eac8da6f9790f7552570921d08aff0a898d"
REQUIRED_TEXTURE_ROLES = ("baseColor", "normal", "metallicRoughness")
TRIANGLE_TARGET = 72_000
RUNTIME_TEXTURE_SIZE = 1_024
SOURCE_TEXTURE_MINIMUM = 4_096
TARGET_LONGEST_DIMENSION = 0.18
KEY_LOCATION = (1.168, -3.012, 0.122)
KEY_ROTATION = (0.0, math.radians(90.0), math.radians(172.0))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def preserve_source() -> Path:
    if not SOURCE_PATH.exists():
        if not DOWNLOAD_SOURCE.exists():
            raise FileNotFoundError(f"Missing golden-key source: {DOWNLOAD_SOURCE}")
        if sha256(DOWNLOAD_SOURCE) != EXPECTED_SHA256:
            raise RuntimeError("Golden-key download does not match the approved source hash.")
        SOURCE_PATH.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(DOWNLOAD_SOURCE, SOURCE_PATH)
    if sha256(SOURCE_PATH) != EXPECTED_SHA256:
        raise RuntimeError(f"Preserved golden-key source changed unexpectedly: {SOURCE_PATH}")
    return SOURCE_PATH


def recursive_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for obj in objects if obj.type == "MESH" for corner in obj.bound_box]
    if not points:
        raise RuntimeError("Golden key imported without recursive mesh bounds.")
    return (
        Vector(tuple(min(point[index] for point in points) for index in range(3))),
        Vector(tuple(max(point[index] for point in points) for index in range(3))),
    )


def triangle_count(meshes: list[bpy.types.Object]) -> int:
    total = 0
    for obj in meshes:
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
    for material in {material for obj in meshes for material in obj.data.materials if material and material.use_nodes}:
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
    raise RuntimeError("Golden key must contain one material with wired BaseColor, Normal, and metallic-roughness maps.")


def reduce_meshes(meshes: list[bpy.types.Object]) -> tuple[int, int]:
    source_triangles = triangle_count(meshes)
    if source_triangles <= TRIANGLE_TARGET:
        return source_triangles, source_triangles
    for obj in meshes:
        current = triangle_count([obj])
        if current <= TRIANGLE_TARGET:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        modifier = obj.modifiers.new("Golden key web budget", type="DECIMATE")
        modifier.decimate_type = "COLLAPSE"
        modifier.ratio = max(0.001, min(1.0, TRIANGLE_TARGET / source_triangles))
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.data.validate(clean_customdata=False)
        obj.data.update()
    return source_triangles, triangle_count(meshes)


def normalize_geometry(meshes: list[bpy.types.Object]) -> dict[str, list[float]]:
    for obj in meshes:
        obj.data.transform(obj.matrix_world)
        obj.matrix_world = Matrix.Identity(4)
    bpy.context.view_layer.update()
    minimum, maximum = recursive_bounds(meshes)
    size = maximum - minimum
    longest = max(size)
    if longest <= 0:
        raise RuntimeError("Golden key has zero-size source bounds.")
    center = (minimum + maximum) * 0.5
    scale = TARGET_LONGEST_DIMENSION / longest
    transform = Euler(KEY_ROTATION, "XYZ").to_matrix().to_4x4() @ Matrix.Scale(scale, 4) @ Matrix.Translation(-center)
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


def resize_textures(images: dict[str, bpy.types.Image]) -> list[dict[str, object]]:
    records = []
    for role in REQUIRED_TEXTURE_ROLES:
        image = images[role]
        source_dimensions = [int(image.size[0]), int(image.size[1])]
        if min(source_dimensions) < SOURCE_TEXTURE_MINIMUM:
            raise RuntimeError(f"Golden key {role} map failed the 4096px source gate: {source_dimensions}")
        image.scale(RUNTIME_TEXTURE_SIZE, RUNTIME_TEXTURE_SIZE)
        image.name = f"TEX_DC9_CAPTAINS_KEY_{role.upper()}"
        image.pack()
        records.append(
            {
                "role": role,
                "name": image.name,
                "sourceDimensions": source_dimensions,
                "runtimeDimensions": [int(image.size[0]), int(image.size[1])],
                "packed": bool(image.packed_file),
            }
        )
    return records


def add_hitbox(colliders: bpy.types.Object, bounds: dict[str, list[float]]) -> bpy.types.Object:
    minimum = Vector(bounds["minimum"])
    maximum = Vector(bounds["maximum"])
    size = (maximum - minimum) * 1.18
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=KEY_LOCATION)
    hitbox = bpy.context.object
    hitbox.name = "DC9_HITBOX_CAPTAINS_KEY"
    hitbox.data.name = "DC9_HITBOX_CAPTAINS_KEY_GEOMETRY"
    hitbox.scale = size * 0.5
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    hitbox.parent = colliders
    hitbox["collider_only"] = True
    hitbox["collider_target_game_id"] = "dc9.key.open"
    hitbox["accessible_label"] = "Open The Captain's Key"
    material = bpy.data.materials.get("MAT_DC9_COLLIDER")
    if material is not None:
        hitbox.data.materials.append(material)
    return hitbox


def export_optimized(root: bpy.types.Object) -> None:
    OPTIMIZED_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
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


def import_golden_key() -> dict[str, object]:
    source = preserve_source()
    props = bpy.data.objects.get("DC9_PUZZLE_PROPS")
    colliders = bpy.data.objects.get("DC9_COLLIDERS")
    if props is None or colliders is None:
        raise RuntimeError("Build the DC-9 puzzle-prop and collider groups before importing the golden key.")

    before_objects = set(bpy.data.objects)
    before_images = set(bpy.data.images)
    bpy.ops.import_scene.gltf(filepath=str(source))
    imported = [obj for obj in bpy.data.objects if obj not in before_objects]
    meshes = [obj for obj in imported if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("Golden key imported without mesh geometry.")

    source_minimum, source_maximum = recursive_bounds(meshes)
    source_triangles, runtime_triangles = reduce_meshes(meshes)
    staged_bounds = normalize_geometry(meshes)
    texture_images = required_texture_images(meshes)
    textures = resize_textures(texture_images)

    root = bpy.data.objects.new("DC9_PROP_CAPTAINS_KEY", None)
    bpy.context.scene.collection.objects.link(root)
    root.parent = props
    root.location = KEY_LOCATION
    root["game_id"] = "dc9.key.open"
    root["interaction"] = "open"
    root["puzzle_id"] = "dc9"
    root["asset_stage"] = "owner-review-candidate"
    root["source_kind"] = "Tripo owner-supplied GLB"
    root["source_sha256"] = EXPECTED_SHA256
    root["optimized_triangle_count"] = runtime_triangles

    for index, obj in enumerate(meshes):
        obj.parent = root
        obj.name = "DC9_PROP_CAPTAINS_KEY_MESH" if index == 0 else f"DC9_PROP_CAPTAINS_KEY_MESH_{index + 1:02d}"
        obj.data.name = f"{obj.name}_GEOMETRY"
        for material in obj.data.materials:
            if material is not None:
                material.name = "MAT_DC9_CAPTAINS_KEY_TRIPO"
                material.use_nodes = True
                material.use_backface_culling = False

    for obj in imported:
        if obj.type == "MESH" or obj == root:
            continue
        bpy.data.objects.remove(obj, do_unlink=True)

    hitbox = add_hitbox(colliders, staged_bounds)
    root.location = (0.0, 0.0, 0.0)
    export_optimized(root)
    root.location = KEY_LOCATION
    bpy.context.view_layer.update()

    material_count = len({material.name for obj in meshes for material in obj.data.materials if material})
    report = {
        "asset": "dc9-golden-key",
        "sceneGroup": "DC-9-32 First-Officer cockpit",
        "sourceCreator": "Tripo AI owner-supplied candidate",
        "sourcePath": str(SOURCE_PATH.relative_to(REPO_ROOT)),
        "downloadSourcePath": str(DOWNLOAD_SOURCE),
        "sourceSha256": EXPECTED_SHA256,
        "sourceFileSize": SOURCE_PATH.stat().st_size,
        "sourceBounds": {
            "minimum": [round(value, 6) for value in source_minimum],
            "maximum": [round(value, 6) for value in source_maximum],
            "size": [round(value, 6) for value in source_maximum - source_minimum],
        },
        "sourceTriangleCount": source_triangles,
        "runtimeTriangleCount": runtime_triangles,
        "runtimeMaterialCount": material_count,
        "sourceTextureGatePassed": True,
        "textures": textures,
        "stableContract": {
            "node": root.name,
            "meshNodes": [obj.name for obj in meshes],
            "colliderNodes": [hitbox.name],
            "gameId": "dc9.key.open",
            "interaction": "open",
            "location": list(KEY_LOCATION),
            "rotationXYZDegreesApplied": [round(math.degrees(value), 2) for value in KEY_ROTATION],
            "targetLongestDimension": TARGET_LONGEST_DIMENSION,
        },
        "stagedBounds": staged_bounds,
        "optimizedPath": str(OPTIMIZED_PATH.relative_to(REPO_ROOT)),
        "optimizedSha256": sha256(OPTIMIZED_PATH),
        "blenderVersion": bpy.app.version_string,
        "status": "owner-review-candidate",
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report
