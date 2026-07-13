from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.blender.cockpit_pipeline.xplane_obj8_convert import build_report, draw_range_datarefs, evaluated_vertices, is_degenerate_triangle, load_pose, parse_obj8


def cli_arguments() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def parse_arguments(arguments: list[str]) -> tuple[list[Path], Path | None, Path, Path, Path, Path | None]:
    import argparse

    parser = argparse.ArgumentParser(description="Import selected OBJ8 cockpit objects into a Blender source-intake scene.")
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--pose", type=Path)
    parser.add_argument("--blend", required=True, type=Path)
    parser.add_argument("--glb", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--preview", type=Path)
    values = parser.parse_args(arguments)
    return values.inputs, values.pose, values.blend, values.glb, values.report, values.preview


def material_for(parsed, source_path: Path):
    name = f"OBJ8_{source_path.stem}_DAY"
    existing = bpy.data.materials.get(name)
    if existing is not None:
        return existing
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    texture_path = source_path.parent / parsed.texture if parsed.texture else None
    if texture_path and texture_path.exists():
        image = bpy.data.images.load(str(texture_path.resolve()), check_existing=True)
        texture = material.node_tree.nodes.new("ShaderNodeTexImage")
        texture.image = image
        material.node_tree.links.new(texture.outputs["Color"], principled.inputs["Base Color"])
        material.node_tree.links.new(texture.outputs["Alpha"], principled.inputs["Alpha"])
        material.surface_render_method = "DITHERED"
    principled.inputs["Roughness"].default_value = 0.72
    if source_path.stem.lower() == "glass":
        principled.inputs["Base Color"].default_value = (0.08, 0.13, 0.16, 1.0)
        principled.inputs["Alpha"].default_value = 0.24
        principled.inputs["Roughness"].default_value = 0.12
        material.surface_render_method = "DITHERED"
    return material


def add_source_object(
    source_path: Path,
    pose: dict[str, float],
    root,
    *,
    include_draw_indices: set[int] | None = None,
    exclude_draw_indices: set[int] | None = None,
    root_name: str | None = None,
) -> dict[str, object]:
    parsed = parse_obj8(source_path, pose)
    material = material_for(parsed, source_path)
    source_root = bpy.data.objects.new(root_name or f"OBJ8_{source_path.stem.upper()}_ROOT", None)
    source_root.parent = root
    bpy.context.collection.objects.link(source_root)

    for draw_index, draw in enumerate(parsed.draws, start=1):
        zero_based_index = draw_index - 1
        if include_draw_indices is not None and zero_based_index not in include_draw_indices:
            continue
        if exclude_draw_indices is not None and zero_based_index in exclude_draw_indices:
            continue
        unique: dict[int, int] = {}
        vertices: list[tuple[float, float, float]] = []
        normals: list[tuple[float, float, float]] = []
        uvs: list[tuple[float, float]] = []
        faces: list[tuple[int, int, int]] = []
        draw_vertices = list(evaluated_vertices(parsed, draw))
        for start in range(0, len(draw_vertices), 3):
            source_triangle = draw_vertices[start : start + 3]
            if is_degenerate_triangle([entry[2] for entry in source_triangle]):
                continue
            face: list[int] = []
            for original_index, vertex, position, normal in source_triangle:
                local_index = unique.get(original_index)
                if local_index is None:
                    local_index = len(vertices)
                    unique[original_index] = local_index
                    vertices.append(position)
                    normals.append(normal)
                    uvs.append(vertex.uv)
                face.append(local_index)
            if len(face) == 3:
                faces.append(tuple(face))

        if not faces:
            continue
        mesh = bpy.data.meshes.new(f"OBJ8_{source_path.stem.upper()}_RANGE_{draw_index:03d}_MESH")
        mesh.from_pydata(vertices, [], faces)
        mesh.materials.append(material)
        uv_layer = mesh.uv_layers.new(name="UVMap")
        for polygon in mesh.polygons:
            polygon.use_smooth = True
            for loop_index in polygon.loop_indices:
                vertex_index = mesh.loops[loop_index].vertex_index
                uv_layer.data[loop_index].uv = uvs[vertex_index]
        mesh.update()

        obj = bpy.data.objects.new(f"OBJ8_{source_path.stem.upper()}_RANGE_{draw_index:03d}", mesh)
        obj.parent = source_root
        obj["source_file"] = source_path.name
        obj["source_draw_offset"] = draw.offset
        obj["source_draw_count"] = draw.count
        obj["source_draw_enabled"] = bool(draw.attributes.get("drawEnabled", True))
        obj["source_datarefs"] = json.dumps(list(draw_range_datarefs(draw)))
        if draw.manipulator:
            obj["source_manipulator"] = draw.manipulator.kind
            obj["source_manipulator_dataref"] = draw.manipulator.dataref or ""
        bpy.context.collection.objects.link(obj)
    return build_report(parsed)


def add_camera_and_lighting(root):
    camera_data = bpy.data.cameras.new("CAM_DC9_OBJ8_EVAL_DATA")
    camera_data.lens = 32
    camera = bpy.data.objects.new("CAM_DC9_OBJ8_EVAL", camera_data)
    camera.location = (-0.48, -3.36, 0.9)
    camera.rotation_euler = (Vector((-0.2, -1.92, 0.52)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.parent = root
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    world = bpy.context.scene.world or bpy.data.worlds.new("OBJ8_EVAL_WORLD")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.055, 0.065, 0.07, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.45

    light_data = bpy.data.lights.new("OBJ8_EVAL_KEY_DATA", "AREA")
    light_data.energy = 1000
    light_data.shape = "RECTANGLE"
    light_data.size = 4.0
    light = bpy.data.objects.new("OBJ8_EVAL_KEY", light_data)
    light.location = (-1.5, -2.5, 5.5)
    bpy.context.collection.objects.link(light)

    fill_data = bpy.data.lights.new("OBJ8_EVAL_COCKPIT_FILL_DATA", "AREA")
    fill_data.energy = 460
    fill_data.shape = "RECTANGLE"
    fill_data.size = 2.0
    fill = bpy.data.objects.new("OBJ8_EVAL_COCKPIT_FILL", fill_data)
    fill.location = (0.0, -3.18, 1.2)
    fill.rotation_euler = (Vector((0.0, -2.05, 0.48)) - fill.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.collection.objects.link(fill)


def main() -> int:
    inputs, pose_path, blend_path, glb_path, report_path, preview_path = parse_arguments(cli_arguments())
    pose = load_pose(pose_path)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1440
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"

    root = bpy.data.objects.new("DC9_OBJ8_EVALUATION_ROOT", None)
    root["source_variant"] = "X-Plane DC-9-32"
    root["target_variant"] = "McDonnell Douglas DC-9-32"
    root["usage_scope"] = "owner-cleared exact CockpitEscapeRoom production geometry and cleared-texture authority"
    bpy.context.collection.objects.link(root)
    reports = [add_source_object(path.resolve(), pose, root) for path in inputs]
    add_camera_and_lighting(root)

    if preview_path is not None:
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(preview_path.resolve())
        bpy.ops.render.render(write_still=True)

    blend_path.parent.mkdir(parents=True, exist_ok=True)
    glb_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path.resolve()))
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path.resolve()),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_cameras=True,
        export_apply=True,
    )
    report_path.write_text(json.dumps({"objects": reports}, indent=2), encoding="utf-8")
    print(report_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
