"""Import and inspect the owner-selected Sketchfab hangar source.

This is an intake-only tool. It writes a cache-only Blender file, neutral
turntable renders, and a deterministic source report. It never changes the
deployable Model Y reward.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = (
    REPO_ROOT
    / ".cache"
    / "cockpit-pipeline"
    / "sources"
    / "model-y-hangar"
    / "sketchfab-hangar-64f7d287f5274029bc29755a9839ebbf"
)
ARCHIVE_PATH = SOURCE_ROOT / "original" / "hangar.zip"
GLTF_PATH = SOURCE_ROOT / "extracted" / "scene.gltf"
LICENSE_PATH = SOURCE_ROOT / "extracted" / "license.txt"
BLEND_PATH = SOURCE_ROOT / "inspection" / "hangar-source-inspection.blend"
PREVIEW_DIR = REPO_ROOT / "preview-renders" / "model-y-hangar-source-intake"
REPORT_PATH = REPO_ROOT / "asset-reports" / "model-y-hangar-source-intake.json"

EXPECTED_ARCHIVE_SHA256 = "8ec631f27e40f6f1f3ac3448c96374c315a4874f2c8e4bdbe307f284fdf6e1fe"
SOURCE_URL = "https://sketchfab.com/3d-models/hangar-64f7d287f5274029bc29755a9839ebbf"
AUTHOR_NAME = "nermin"
AUTHOR_URL = "https://sketchfab.com/nermin"
LICENSE_NAME = "CC BY 4.0"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def world_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [
        obj.matrix_world @ Vector(corner)
        for obj in objects
        if obj.type == "MESH"
        for corner in obj.bound_box
    ]
    if not points:
        raise RuntimeError("Imported hangar contains no mesh bounds.")
    return (
        Vector(tuple(min(point[axis] for point in points) for axis in range(3))),
        Vector(tuple(max(point[axis] for point in points) for axis in range(3))),
    )


def look_at(camera: bpy.types.Object, target: Vector) -> None:
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def add_area_light(
    name: str,
    location: tuple[float, float, float],
    energy: float,
    size: float,
    color: tuple[float, float, float],
    target: Vector,
) -> None:
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    light = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(light)
    light.location = location
    look_at(light, target)


def configure_render(center: Vector, size: Vector) -> bpy.types.Object:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 800
    scene.render.resolution_y = 600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"

    world = bpy.data.worlds.new("HANGAR_SOURCE_INSPECTION_WORLD")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.045, 0.055, 0.07, 1.0)
    background.inputs["Strength"].default_value = 0.35
    scene.world = world

    radius = max(size) * 0.62
    add_area_light(
        "HANGAR_SOURCE_KEY",
        tuple(center + Vector((radius, -radius, radius))),
        1800.0,
        radius,
        (1.0, 0.88, 0.72),
        center,
    )
    add_area_light(
        "HANGAR_SOURCE_FILL",
        tuple(center + Vector((-radius, radius * 0.35, radius * 0.45))),
        1100.0,
        radius * 0.75,
        (0.62, 0.76, 1.0),
        center,
    )

    camera_data = bpy.data.cameras.new("CAM_HANGAR_SOURCE_INSPECTION")
    camera = bpy.data.objects.new("CAM_HANGAR_SOURCE_INSPECTION", camera_data)
    scene.collection.objects.link(camera)
    camera.data.lens = 52
    camera.data.clip_end = max(size) * 8.0
    scene.camera = camera
    return camera


def render_views(camera: bpy.types.Object, center: Vector, size: Vector) -> list[str]:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    radius = max(size) * 1.45
    height = center.z + size.z * 0.12
    views = {
        "front": (0.0, -radius, height),
        "right": (radius, 0.0, height),
        "back": (0.0, radius, height),
        "left": (-radius, 0.0, height),
    }
    outputs: list[str] = []
    for label, location in views.items():
        camera.location = location
        look_at(camera, center)
        output = PREVIEW_DIR / f"{label}.png"
        bpy.context.scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        outputs.append(str(output.relative_to(REPO_ROOT)))
    return outputs


def main() -> None:
    if not ARCHIVE_PATH.exists() or not GLTF_PATH.exists() or not LICENSE_PATH.exists():
        raise FileNotFoundError("The staged Sketchfab hangar archive is incomplete.")
    archive_hash = sha256(ARCHIVE_PATH)
    if archive_hash != EXPECTED_ARCHIVE_SHA256:
        raise RuntimeError(
            f"Hangar archive hash mismatch: expected {EXPECTED_ARCHIVE_SHA256}, received {archive_hash}."
        )

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(GLTF_PATH))
    imported = list(bpy.context.scene.objects)
    meshes = [obj for obj in imported if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("The Sketchfab hangar glTF imported without meshes.")

    minimum, maximum = world_bounds(meshes)
    center = (minimum + maximum) * 0.5
    size = maximum - minimum
    normalization_scale = 20.0 / max(size)
    inspection_root = bpy.data.objects.new("HANGAR_SOURCE_INSPECTION_ROOT", None)
    bpy.context.scene.collection.objects.link(inspection_root)
    for obj in imported:
        if obj.parent is None:
            obj.parent = inspection_root
    inspection_root.scale = (normalization_scale,) * 3
    inspection_root.location = -center * normalization_scale
    bpy.context.view_layer.update()
    normalized_minimum, normalized_maximum = world_bounds(meshes)
    normalized_center = (normalized_minimum + normalized_maximum) * 0.5
    normalized_size = normalized_maximum - normalized_minimum
    camera = configure_render(normalized_center, normalized_size)
    previews = render_views(camera, normalized_center, normalized_size)

    triangle_count = sum(len(obj.data.loop_triangles) for obj in meshes)
    material_names = sorted(
        {
            material.name
            for obj in meshes
            for material in obj.data.materials
            if material is not None
        }
    )
    textures = []
    for image in sorted(bpy.data.images, key=lambda candidate: candidate.name.lower()):
        if image.source != "FILE":
            continue
        textures.append(
            {
                "name": image.name,
                "dimensions": [int(image.size[0]), int(image.size[1])],
                "filepath": bpy.path.abspath(image.filepath),
            }
        )

    report = {
        "asset": "model-y-hangar-source",
        "title": "Hangar",
        "source": SOURCE_URL,
        "author": {"name": AUTHOR_NAME, "url": AUTHOR_URL},
        "license": {"name": LICENSE_NAME, "url": LICENSE_URL, "attributionRequired": True},
        "archive": {
            "path": str(ARCHIVE_PATH.relative_to(REPO_ROOT)),
            "byteLength": ARCHIVE_PATH.stat().st_size,
            "sha256": archive_hash,
        },
        "extractedSource": str(GLTF_PATH.relative_to(REPO_ROOT)),
        "blenderVersion": bpy.app.version_string,
        "sourceObjectCount": len(imported),
        "sourceMeshCount": len(meshes),
        "sourceTriangleCount": triangle_count,
        "sourceMaterialCount": len(material_names),
        "sourceMaterials": material_names,
        "sourceTextures": textures,
        "worldBounds": {
            "minimum": [round(value, 6) for value in minimum],
            "maximum": [round(value, 6) for value in maximum],
            "size": [round(value, 6) for value in size],
            "center": [round(value, 6) for value in center],
        },
        "inspectionNormalization": {
            "uniformScale": normalization_scale,
            "worldBounds": {
                "minimum": [round(value, 6) for value in normalized_minimum],
                "maximum": [round(value, 6) for value in normalized_maximum],
                "size": [round(value, 6) for value in normalized_size],
                "center": [round(value, 6) for value in normalized_center],
            },
        },
        "orientation": {
            "importer": "Blender glTF 2.0",
            "upAxisAfterImport": "+Z",
            "frontToBackAxis": "inspection pending",
        },
        "previewRenders": previews,
        "status": "approved-runtime-source",
        "runtimePromotion": "Promoted by build_tesla_reward.py as TESLA_HANGAR_SOURCE_SHELL after owner review, normalization, stable naming, and seven-to-one material atlas consolidation.",
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
