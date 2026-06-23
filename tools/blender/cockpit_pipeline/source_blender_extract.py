from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy
from mathutils import Vector


def main() -> None:
    parser = argparse.ArgumentParser(description="Blender-side AC3D import, candidate export, preview, and validation.")
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--plan", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--preview-dir", required=True)
    parser.add_argument("--inspection-dir", required=True)
    args = parser.parse_args(_args_after_double_dash())

    repo_root = Path(args.repo_root)
    plan = json.loads(Path(args.plan).read_text(encoding="utf-8"))
    output_dir = Path(args.output_dir)
    preview_dir = Path(args.preview_dir)
    inspection_dir = Path(args.inspection_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    inspection_dir.mkdir(parents=True, exist_ok=True)

    import_proof = _import_proof(repo_root / plan["primaryCockpitModel"], inspection_dir, preview_dir)
    candidates = []
    for candidate in plan["candidates"]:
        candidates.append(_export_candidate(repo_root, output_dir, preview_dir, candidate))

    report = {
        "importProof": import_proof,
        "candidates": candidates,
        "status": "pass",
    }
    report_path = output_dir / "blender-extraction-report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


def _import_proof(ac_path: Path, inspection_dir: Path, preview_dir: Path) -> dict[str, object]:
    _reset_scene()
    imported = import_ac3d(ac_path)
    stats = _scene_stats()
    if stats["meshCount"] == 0:
        raise RuntimeError(f"AC3D import produced no mesh objects: {ac_path}")
    overview_path = preview_dir / "import-proof-overview.png"
    _render_preview(overview_path, "FlightGear DC-9-32 cockpit source import proof")
    blend_path = inspection_dir / "flightgear-dc9-32-cockpit-import-proof.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    return {
        "sourceFile": _posix(ac_path),
        "objectCount": stats["objectCount"],
        "meshCount": stats["meshCount"],
        "materialCount": stats["materialCount"],
        "dimensions": stats["dimensions"],
        "importedObjectNames": [obj.name for obj in imported[:80]],
        "inspectionScene": _posix(blend_path),
        "preview": _posix(overview_path),
    }


def _export_candidate(repo_root: Path, output_dir: Path, preview_dir: Path, candidate: dict[str, object]) -> dict[str, object]:
    candidate_id = str(candidate["candidateId"])
    candidate_dir = output_dir / "candidates" / candidate_id
    candidate_dir.mkdir(parents=True, exist_ok=True)
    source_file = repo_root / str(candidate["sourceFile"])

    _reset_scene()
    import_ac3d(source_file)
    requested_names = set(candidate["sourceObjectNames"])
    selected = [obj for obj in bpy.context.scene.objects if obj.name in requested_names]
    missing = sorted(requested_names - {obj.name for obj in selected})
    if missing:
        raise RuntimeError(f"{candidate_id}: missing source object(s) after import: {missing}")

    for obj in list(bpy.context.scene.objects):
        if obj not in selected:
            bpy.data.objects.remove(obj, do_unlink=True)

    root = bpy.data.objects.new(candidate_id.upper(), None)
    bpy.context.collection.objects.link(root)
    for obj in selected:
        obj.parent = root

    pre_stats = _scene_stats()
    glb_path = candidate_dir / f"{candidate_id}.glb"
    preview_path = preview_dir / f"{candidate_id}.png"
    metadata_path = candidate_dir / f"{candidate_id}.metadata.json"
    validation_path = candidate_dir / f"{candidate_id}.validation.json"

    _render_preview(preview_path, candidate_id)
    _select_export_objects()
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB", export_extras=True)
    _assert_glb(glb_path)

    reimport = _reimport_validation(glb_path, expected_dimensions=pre_stats["dimensions"])
    metadata = {
        **candidate,
        "sourceFile": str(candidate["sourceFile"]),
        "sourceObjectNames": sorted(candidate["sourceObjectNames"]),
        "dimensions": pre_stats["dimensions"],
        "triangleCount": pre_stats["triangleCount"],
        "materialNames": pre_stats["materialNames"],
        "childObjectCount": pre_stats["meshCount"],
        "exportedGlb": _posix(glb_path),
        "previewPng": _posix(preview_path),
        "metadataJson": _posix(metadata_path),
        "validationJson": _posix(validation_path),
        "reimportValidation": reimport,
    }
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    validation_path.write_text(json.dumps(reimport, indent=2) + "\n", encoding="utf-8")
    return metadata


def import_ac3d(path: Path) -> list[bpy.types.Object]:
    text = path.read_text(encoding="utf-8", errors="replace").splitlines()
    if not text or not text[0].startswith("AC3D"):
        raise RuntimeError(f"unsupported AC3D header in {path}")
    materials = _parse_materials(text)
    index = 1
    objects = []
    while index < len(text):
        line = text[index].strip()
        if line.startswith("MATERIAL "):
            index += 1
            continue
        if line.startswith("OBJECT "):
            obj, index = _parse_ac_object(text, index, materials)
            objects.extend(_create_blender_objects(obj, path.parent))
            continue
        index += 1
    return objects


def _parse_materials(lines: list[str]) -> list[str]:
    materials = []
    for line in lines:
        if not line.startswith("MATERIAL "):
            continue
        if '"' in line:
            materials.append(line.split('"', 2)[1])
        else:
            materials.append(f"material_{len(materials)}")
    return materials


def _parse_ac_object(lines: list[str], index: int, materials: list[str]) -> tuple[dict[str, object], int]:
    object_type = lines[index].strip().split(maxsplit=1)[1]
    index += 1
    obj: dict[str, object] = {
        "type": object_type,
        "name": f"{object_type}_{index}",
        "texture": "",
        "vertices": [],
        "faces": [],
        "materialIndices": [],
        "children": [],
    }
    while index < len(lines):
        line = lines[index].strip()
        if line.startswith("name "):
            obj["name"] = line.split('"', 2)[1] if '"' in line else line.split(maxsplit=1)[1]
            index += 1
        elif line.startswith("texture "):
            obj["texture"] = line.split('"', 2)[1] if '"' in line else line.split(maxsplit=1)[1]
            index += 1
        elif line.startswith("numvert "):
            count = int(line.split()[1])
            vertices = []
            for offset in range(count):
                values = [float(value) for value in lines[index + 1 + offset].strip().split()[:3]]
                vertices.append(tuple(values))
            obj["vertices"] = vertices
            index += count + 1
        elif line.startswith("numsurf "):
            surf_count = int(line.split()[1])
            index += 1
            faces = []
            material_indices = []
            for _ in range(surf_count):
                mat_index = 0
                while index < len(lines):
                    surf_line = lines[index].strip()
                    index += 1
                    if surf_line.startswith("mat "):
                        mat_index = int(surf_line.split()[1])
                    elif surf_line.startswith("refs "):
                        ref_count = int(surf_line.split()[1])
                        refs = []
                        for offset in range(ref_count):
                            ref_parts = lines[index + offset].strip().split()
                            refs.append(int(ref_parts[0]))
                        index += ref_count
                        if len(refs) >= 3:
                            faces.append(tuple(refs))
                            material_indices.append(mat_index)
                        break
            obj["faces"] = faces
            obj["materialIndices"] = material_indices
        elif line.startswith("kids "):
            kids = int(line.split()[1])
            index += 1
            children = []
            for _ in range(kids):
                child, index = _parse_ac_object(lines, index, materials)
                children.append(child)
            obj["children"] = children
            return obj, index
        else:
            index += 1
    return obj, index


def _create_blender_objects(ac_obj: dict[str, object], source_dir: Path, parent: bpy.types.Object | None = None) -> list[bpy.types.Object]:
    created = []
    vertices = ac_obj["vertices"]
    faces = ac_obj["faces"]
    current_parent = parent
    if vertices and faces:
        mesh = bpy.data.meshes.new(str(ac_obj["name"]))
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(str(ac_obj["name"]), mesh)
        bpy.context.collection.objects.link(obj)
        obj.parent = parent
        material_name = str(ac_obj["texture"] or "ac3d_untextured")
        mat = _material(material_name)
        obj.data.materials.append(mat)
        for poly, mat_index in zip(obj.data.polygons, ac_obj["materialIndices"]):
            poly.material_index = 0
        obj["source_texture"] = material_name
        obj["source_texture_exists"] = bool(material_name and (source_dir / material_name).exists())
        current_parent = obj
        created.append(obj)
    elif ac_obj["children"] and str(ac_obj["type"]) != "world":
        obj = bpy.data.objects.new(str(ac_obj["name"]), None)
        bpy.context.collection.objects.link(obj)
        obj.parent = parent
        current_parent = obj
        created.append(obj)
    for child in ac_obj["children"]:
        created.extend(_create_blender_objects(child, source_dir, current_parent))
    return created


def _material(name: str) -> bpy.types.Material:
    material = bpy.data.materials.get(name)
    if material:
        return material
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        color = _color_from_name(name)
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.78
    return material


def _color_from_name(name: str) -> tuple[float, float, float, float]:
    seed = sum(ord(char) for char in name)
    return (
        0.25 + (seed % 37) / 100.0,
        0.25 + (seed % 53) / 120.0,
        0.25 + (seed % 71) / 150.0,
        1.0,
    )


def _scene_stats() -> dict[str, object]:
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    dimensions = _dimensions(meshes)
    material_names = sorted({slot.material.name for obj in meshes for slot in obj.material_slots if slot.material})
    return {
        "objectCount": len(bpy.context.scene.objects),
        "meshCount": len(meshes),
        "materialCount": len(material_names),
        "materialNames": material_names,
        "triangleCount": sum(len(poly.vertices) - 2 for obj in meshes for poly in obj.data.polygons),
        "dimensions": dimensions,
    }


def _dimensions(objects: list[bpy.types.Object]) -> dict[str, float]:
    if not objects:
        return {"x": 0.0, "y": 0.0, "z": 0.0}
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    delta = maxs - mins
    return {"x": round(delta.x, 5), "y": round(delta.y, 5), "z": round(delta.z, 5)}


def _render_preview(path: Path, label: str) -> None:
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:
        scene.render.engine = "BLENDER_WORKBENCH"
    meshes = [obj for obj in scene.objects if obj.type == "MESH"]
    center, radius = _center_radius(meshes)
    bpy.ops.object.light_add(type="AREA", location=(center.x, center.y - radius * 2.0, center.z + radius * 2.0))
    light = bpy.context.object
    light.name = "SOURCE_NEUTRAL_AREA_LIGHT"
    light.data.energy = 650
    light.data.size = max(2.0, radius * 1.2)
    camera_location = (center.x + radius * 1.6, center.y - radius * 2.4, center.z + radius * 1.15)
    bpy.ops.object.camera_add(location=camera_location)
    camera = bpy.context.object
    camera.name = "CAM_SOURCE_NEUTRAL_PREVIEW"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(0.25, radius * 3.4)
    _look_at(camera, center)
    scene.camera = camera
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def _center_radius(objects: list[bpy.types.Object]) -> tuple[Vector, float]:
    if not objects:
        return Vector((0, 0, 0)), 1.0
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    center = (mins + maxs) * 0.5
    radius = max((maxs - mins).length * 0.5, 0.1)
    return center, radius


def _look_at(obj: bpy.types.Object, target: Vector) -> None:
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def _select_export_objects() -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        obj.select_set(True)


def _reimport_validation(glb_path: Path, expected_dimensions: dict[str, float]) -> dict[str, object]:
    _reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    stats = _scene_stats()
    status = "pass" if stats["meshCount"] > 0 else "fail"
    return {
        "status": status,
        "meshCount": stats["meshCount"],
        "materialCount": stats["materialCount"],
        "dimensions": stats["dimensions"],
        "expectedDimensions": expected_dimensions,
        "dimensionDelta": {
            axis: round(abs(stats["dimensions"][axis] - expected_dimensions[axis]), 5)
            for axis in ("x", "y", "z")
        },
    }


def _assert_glb(path: Path) -> None:
    with path.open("rb") as handle:
        if handle.read(4) != b"glTF":
            raise RuntimeError(f"export did not produce a GLB: {path}")


def _reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)


def _posix(path: Path) -> str:
    return path.as_posix()


def _args_after_double_dash() -> list[str]:
    import sys

    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


if __name__ == "__main__":
    main()
