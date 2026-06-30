from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


def main() -> None:
    parser = argparse.ArgumentParser(description="Import and inspect the Airbus A320 source candidate in Blender.")
    parser.add_argument("--gltf", required=True)
    parser.add_argument("--candidate-id", required=True)
    parser.add_argument("--blend-path", required=True)
    parser.add_argument("--preview-path", required=True)
    parser.add_argument("--report-path", required=True)
    args = parser.parse_args(_args_after_double_dash())

    gltf_path = Path(args.gltf)
    blend_path = Path(args.blend_path)
    preview_path = Path(args.preview_path)
    report_path = Path(args.report_path)
    for path in (blend_path.parent, preview_path.parent, report_path.parent):
        path.mkdir(parents=True, exist_ok=True)

    _reset_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        try:
            scene.render.engine = "BLENDER_EEVEE"
        except TypeError:
            scene.render.engine = "BLENDER_WORKBENCH"

    before_objects = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(gltf_path))
    imported = [obj for obj in bpy.data.objects if obj not in before_objects]
    if not imported:
        raise RuntimeError(f"glTF import produced no objects: {gltf_path}")

    root = bpy.data.objects.new("AIRBUS_A320_SOURCE_CANDIDATE_ROOT", None)
    bpy.context.collection.objects.link(root)
    root["source_candidate_id"] = args.candidate_id
    root["source_type"] = "prebuilt-geometry"
    root["target_aircraft"] = "Airbus A320"
    root["pipeline_stage"] = "agent1_import_inspection"

    for obj in imported:
        if obj.parent is None:
            obj.parent = root

    bpy.context.view_layer.update()
    stats = _scene_stats(imported, root)
    _add_approval_lighting(stats["bboxCenter"], stats["bboxSize"])
    camera_record = _add_cockpit_camera(stats["bboxMin"], stats["bboxMax"], stats["bboxSize"])

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath = str(preview_path)
    bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

    report = {
        "status": "pass",
        "candidateId": args.candidate_id,
        "sourceGltf": _posix(gltf_path),
        "inspectionBlend": _posix(blend_path),
        "preview": _posix(preview_path),
        "blenderVersion": bpy.app.version_string,
        "rootObject": root.name,
        "camera": camera_record,
        **stats,
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


def _reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for item in list(collection):
            if item.users == 0:
                collection.remove(item)


def _scene_stats(imported: list[bpy.types.Object], root: bpy.types.Object) -> dict[str, object]:
    meshes = [obj for obj in imported if obj.type == "MESH"]
    bbox_min, bbox_max = _bbox_world(meshes)
    bbox_size = bbox_max - bbox_min
    bbox_center = (bbox_min + bbox_max) * 0.5
    unapplied = [
        obj.name
        for obj in meshes
        if not _near_tuple(obj.scale, (1.0, 1.0, 1.0)) or not _near_tuple(obj.rotation_euler, (0.0, 0.0, 0.0))
    ]
    triangle_count = sum(sum(len(poly.vertices) - 2 for poly in obj.data.polygons) for obj in meshes)
    material_names = sorted({slot.material.name for obj in meshes for slot in obj.material_slots if slot.material})
    image_records = []
    for image in sorted(bpy.data.images, key=lambda item: item.name):
        if image.name == "Render Result":
            continue
        image_records.append({
            "name": image.name,
            "filepath": image.filepath,
            "width": int(image.size[0]),
            "height": int(image.size[1]),
        })
    custom_property_objects = [
        obj.name
        for obj in imported + [root]
        if any(not key.startswith("_") for key in obj.keys())
    ]
    return {
        "objectCount": len(imported) + 1,
        "meshCount": len(meshes),
        "emptyCount": len([obj for obj in imported if obj.type == "EMPTY"]) + 1,
        "materialCount": len(material_names),
        "imageCount": len(image_records),
        "triangleCount": triangle_count,
        "bboxMin": _vector_list(bbox_min),
        "bboxMax": _vector_list(bbox_max),
        "bboxCenter": _vector_list(bbox_center),
        "bboxSize": _vector_list(bbox_size),
        "materialNames": material_names,
        "images": image_records,
        "topLevelChildren": sorted(obj.name for obj in root.children),
        "sampleMeshNames": sorted(obj.name for obj in meshes)[:80],
        "unappliedTransformObjectCount": len(unapplied),
        "unappliedTransformSample": sorted(unapplied)[:80],
        "customPropertyObjects": sorted(custom_property_objects),
        "animationCount": len(bpy.data.actions),
    }


def _bbox_world(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    if not objects:
        zero = Vector((0.0, 0.0, 0.0))
        return zero, zero
    points = []
    for obj in objects:
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    bbox_min = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    bbox_max = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return bbox_min, bbox_max


def _add_approval_lighting(center: list[float], size: list[float]) -> None:
    c = Vector(center)
    radius = max(max(size), 1.0)
    bpy.ops.object.light_add(type="AREA", location=(c.x, c.y - radius * 0.7, c.z + radius * 0.9))
    light = bpy.context.object
    light.name = "AIRBUS_A320_IMPORT_NEUTRAL_AREA_LIGHT"
    light.data.energy = 650
    light.data.size = max(radius * 0.8, 2.0)
    bpy.ops.object.light_add(type="POINT", location=(c.x + radius * 0.35, c.y + radius * 0.25, c.z + radius * 0.35))
    fill = bpy.context.object
    fill.name = "AIRBUS_A320_IMPORT_FILL_LIGHT"
    fill.data.energy = 120


def _add_cockpit_camera(bbox_min: list[float], bbox_max: list[float], size: list[float]) -> dict[str, object]:
    minimum = Vector(bbox_min)
    maximum = Vector(bbox_max)
    dimensions = Vector(size)
    # Sketchfab did not provide an embedded camera. Aim from a front-left,
    # slightly elevated position at the forward cockpit/window area instead
    # of the full aircraft center.
    target = Vector((
        minimum.x + dimensions.x * 0.25,
        maximum.y - dimensions.y * 0.07,
        minimum.z + dimensions.z * 0.54,
    ))
    location = Vector((
        minimum.x - dimensions.x * 0.16,
        maximum.y + dimensions.y * 0.13,
        minimum.z + dimensions.z * 0.65,
    ))
    bpy.ops.object.camera_add(location=location)
    camera = bpy.context.object
    camera.name = "CAM_AIRBUS_A320_SOURCE_IMPORT_COCKPIT_VIEW"
    direction = target - location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 95
    camera.data.clip_end = max(max(size) * 8.0, 1000.0)
    bpy.context.scene.camera = camera
    return {
        "name": camera.name,
        "purpose": "cockpit-focused inspection view",
        "location": _vector_list(location),
        "target": _vector_list(target),
        "lensMm": camera.data.lens,
    }


def _near_tuple(value, expected: tuple[float, float, float], epsilon: float = 0.0001) -> bool:
    return all(math.isclose(float(actual), float(want), abs_tol=epsilon) for actual, want in zip(value, expected))


def _vector_list(vector: Vector) -> list[float]:
    return [round(float(vector.x), 6), round(float(vector.y), 6), round(float(vector.z), 6)]


def _posix(path: Path) -> str:
    return path.resolve().as_posix()


def _args_after_double_dash() -> list[str]:
    import sys

    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


if __name__ == "__main__":
    main()
