"""Render neutral inspection views for a downloaded 3D source candidate.

Run with Blender's factory startup so downloaded files cannot execute handlers:

    blender --background --factory-startup --disable-autoexec \
      --python tools/blender/render_source_candidate.py -- \
      --source path/to/candidate.glb --output-dir .cache/assets/intake/candidate
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument(
        "--view-profile",
        choices=("source-inspection", "dc9-captain"),
        default="source-inspection",
        help="Use the DC-9 profile when three-quarter.png must be judged from the locked captain seat.",
    )
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


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
    ):
        for block in list(collection):
            collection.remove(block)


def mesh_triangles(objects: list[bpy.types.Object]) -> int:
    total = 0
    for obj in objects:
        if obj.type != "MESH":
            continue
        obj.data.calc_loop_triangles()
        total += len(obj.data.loop_triangles)
    return total


def world_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for obj in objects if obj.type == "MESH" for corner in obj.bound_box]
    if not points:
        raise RuntimeError("Candidate contains no renderable mesh bounds.")
    return (
        Vector(tuple(min(point[index] for point in points) for index in range(3))),
        Vector(tuple(max(point[index] for point in points) for index in range(3))),
    )


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area_light(name: str, location: tuple[float, float, float], energy: float, size: float, color: tuple[float, float, float]) -> None:
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    look_at(obj, Vector((0.0, 0.0, 0.75)))


def main() -> None:
    args = parse_args()
    source = args.source.resolve()
    output_dir = args.output_dir.resolve()
    if not source.exists():
        raise FileNotFoundError(source)

    reset_scene()
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(source))
    imported = [obj for obj in bpy.data.objects if obj not in before]
    roots = [obj for obj in imported if obj.parent is None]
    minimum, maximum = world_bounds(imported)
    size = maximum - minimum
    center = (minimum + maximum) * 0.5
    uniform_scale = 1.8 / max(size)

    container = bpy.data.objects.new("SOURCE_CANDIDATE_ROOT", None)
    bpy.context.collection.objects.link(container)
    for root in roots:
        root.parent = container
    container.scale = (uniform_scale,) * 3
    container.location = Vector((-center.x * uniform_scale, -center.y * uniform_scale, -minimum.z * uniform_scale))
    bpy.context.view_layer.update()

    floor_material = bpy.data.materials.new("MAT_INSPECTION_FLOOR")
    floor_material.diffuse_color = (0.12, 0.13, 0.14, 1.0)
    floor_material.use_nodes = True
    floor_bsdf = floor_material.node_tree.nodes.get("Principled BSDF")
    floor_bsdf.inputs["Base Color"].default_value = (0.12, 0.13, 0.14, 1.0)
    floor_bsdf.inputs["Roughness"].default_value = 0.82
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, -0.015))
    bpy.context.object.data.materials.append(floor_material)

    world = bpy.data.worlds.new("Source inspection world")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.035, 0.04, 0.05, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.42

    add_area_light("SOURCE_KEY", (3.4, -4.2, 4.6), 850, 3.0, (1.0, 0.82, 0.66))
    add_area_light("SOURCE_FILL", (-3.5, -1.2, 2.4), 520, 3.4, (0.62, 0.74, 1.0))
    add_area_light("SOURCE_RIM", (1.8, 3.8, 3.6), 700, 2.4, (1.0, 0.55, 0.28))

    camera_data = bpy.data.cameras.new("CAM_SOURCE_INSPECTION")
    camera_data.lens = 58
    camera = bpy.data.objects.new("CAM_SOURCE_INSPECTION", camera_data)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"

    output_dir.mkdir(parents=True, exist_ok=True)
    target = Vector((0.0, 0.0, 0.85))
    views = {
        "front": ((0.0, -3.5, 1.45), target, 58.0),
        "three-quarter": ((2.65, -2.65, 1.75), target, 58.0),
        "side": ((3.5, 0.0, 1.45), target, 58.0),
        "top": ((0.25, -0.8, 4.0), target, 58.0),
    }
    if args.view_profile == "dc9-captain":
        # Derived from the source DC-9-32 captain eye point and panel focus after
        # the candidate is normalized above. This is a restrained seated view,
        # angled slightly toward the center stack rather than an exterior orbit.
        views["three-quarter"] = ((-0.275, -0.385, 0.787), (0.08, 0.42, 0.57), 46.0)

    for name, (location, view_target, lens) in views.items():
        camera.location = location
        camera.data.lens = lens
        look_at(camera, Vector(view_target))
        scene.render.filepath = str(output_dir / f"{name}.png")
        bpy.ops.render.render(write_still=True)

    report = {
        "source": str(source),
        "blenderVersion": bpy.app.version_string,
        "importedObjectCount": len(imported),
        "meshObjectCount": len([obj for obj in imported if obj.type == "MESH"]),
        "triangleCount": mesh_triangles(imported),
        "materialCount": len({material.name for obj in imported if obj.type == "MESH" for material in obj.data.materials if material}),
        "viewProfile": args.view_profile,
        "textures": [
            {"name": image.name, "width": image.size[0], "height": image.size[1], "packed": bool(image.packed_file)}
            for image in bpy.data.images
            if image.type == "IMAGE" and image.name not in {"Render Result", "Viewer Node"}
        ],
        "sourceBounds": {"min": list(minimum), "max": list(maximum), "size": list(size)},
        "previewViews": [str(output_dir / f"{name}.png") for name in views],
    }
    report_path = output_dir / "inspection.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("SOURCE_CANDIDATE_REPORT=" + json.dumps(report))


if __name__ == "__main__":
    main()
