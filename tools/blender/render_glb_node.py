"""Render one named GLB node as a transparent, web-ready presentation image.

Run from Blender's factory startup so the source cannot execute handlers:

    blender --background --factory-startup --disable-autoexec \
      --python tools/blender/render_glb_node.py -- \
      --source public/models/locker-room.glb \
      --node LOCKER_PROP_CAPTAINS_HAT \
      --output .cache/assets/locker/celebration/captains-hat-celebration.png
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--node", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--distance-factor", type=float, default=2.65)
    parser.add_argument(
        "--presentation-rotation-degrees",
        type=float,
        nargs=3,
        default=(0.0, 0.0, 0.0),
        metavar=("X", "Y", "Z"),
    )
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for block in list(collection):
            collection.remove(block)


def descendants(root: bpy.types.Object) -> set[bpy.types.Object]:
    result = {root}
    pending = list(root.children)
    while pending:
        obj = pending.pop()
        result.add(obj)
        pending.extend(obj.children)
    return result


def world_bounds(objects: set[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for obj in objects if obj.type == "MESH" for corner in obj.bound_box]
    if not points:
        raise RuntimeError("Selected node contains no renderable mesh bounds.")
    return (
        Vector(tuple(min(point[index] for point in points) for index in range(3))),
        Vector(tuple(max(point[index] for point in points) for index in range(3))),
    )


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area_light(name: str, location: Vector, target: Vector, energy: float, size: float, color: tuple[float, float, float]) -> None:
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)


def main() -> None:
    args = parse_args()
    source = args.source.resolve()
    output = args.output.resolve()
    if not source.exists():
        raise FileNotFoundError(source)

    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(source))
    root = bpy.data.objects.get(args.node)
    if root is None:
        raise RuntimeError(f"GLB is missing required node: {args.node}")

    root.rotation_mode = "XYZ"
    root.rotation_euler = tuple(math.radians(value) for value in args.presentation_rotation_degrees)
    bpy.context.view_layer.update()

    visible = descendants(root)
    for obj in bpy.data.objects:
        if obj.type in {"MESH", "CURVE", "SURFACE", "META", "FONT", "VOLUME"} and obj not in visible:
            obj.hide_render = True
        if obj.type in {"LIGHT", "CAMERA"}:
            obj.hide_render = True

    minimum, maximum = world_bounds(visible)
    size = maximum - minimum
    center = (minimum + maximum) * 0.5
    span = max(size)
    if span <= 0:
        raise RuntimeError("Selected node has zero-sized bounds.")

    camera_data = bpy.data.cameras.new("CAM_WEB_NODE_PRESENTATION")
    camera_data.lens = 58
    camera = bpy.data.objects.new("CAM_WEB_NODE_PRESENTATION", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = center + Vector((span * 0.28, -span * args.distance_factor, span * 0.48))
    look_at(camera, center + Vector((0.0, 0.0, span * 0.04)))

    add_area_light(
        "WEB_NODE_KEY",
        center + Vector((span * 2.1, -span * 2.4, span * 2.3)),
        center,
        110,
        span * 2.1,
        (1.0, 0.82, 0.64),
    )
    add_area_light(
        "WEB_NODE_FILL",
        center + Vector((-span * 2.0, -span * 0.8, span * 1.1)),
        center,
        55,
        span * 2.5,
        (0.58, 0.7, 1.0),
    )
    add_area_light(
        "WEB_NODE_RIM",
        center + Vector((span * 0.8, span * 2.3, span * 1.8)),
        center,
        90,
        span * 1.8,
        (1.0, 0.48, 0.2),
    )

    world = bpy.data.worlds.new("Transparent web node world")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.008, 0.008, 0.008, 1.0)
    background.inputs["Strength"].default_value = 0.08

    scene = bpy.context.scene
    scene.world = world
    scene.camera = camera
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = True
    scene.render.filepath = str(output)
    scene.view_settings.look = "AgX - Medium High Contrast"

    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)

    report = {
        "source": str(source),
        "node": args.node,
        "output": str(output),
        "blenderVersion": bpy.app.version_string,
        "meshObjectCount": len([obj for obj in visible if obj.type == "MESH"]),
        "materialCount": len({material.name for obj in visible if obj.type == "MESH" for material in obj.data.materials if material}),
        "resolution": [scene.render.resolution_x, scene.render.resolution_y],
        "distanceFactor": args.distance_factor,
        "presentationRotationDegrees": list(args.presentation_rotation_degrees),
        "bounds": {"min": list(minimum), "max": list(maximum), "size": list(size)},
    }
    report_path = output.with_suffix(".json")
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("GLB_NODE_RENDER_REPORT=" + json.dumps(report))


if __name__ == "__main__":
    main()
