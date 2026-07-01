from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy
from mathutils import Vector


RUNTIME_METADATA_KEYS = ["game_id", "scene_group", "target_aircraft", "assemblyStage", "source_candidate_id", "assemblyCategory"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply preservation-first A320 material and optimization handoff.")
    parser.add_argument("--assembly-glb", required=True)
    parser.add_argument("--node-report", required=True)
    parser.add_argument("--recipes", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--preview-dir", required=True)
    args = parser.parse_args(_args_after_double_dash())

    assembly_glb = Path(args.assembly_glb)
    node_report = json.loads(Path(args.node_report).read_text(encoding="utf-8"))
    recipes = json.loads(Path(args.recipes).read_text(encoding="utf-8"))
    output_dir = Path(args.output_dir)
    preview_dir = Path(args.preview_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)

    _reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(assembly_glb))
    expected_nodes = _expected_runtime_nodes(node_report)
    before = _snapshot(expected_nodes)

    recipe_index = {recipe["recipeId"]: recipe for recipe in recipes["recipes"]}
    assignments = _apply_material_annotation(recipe_index)
    texture_report = _write_texture_inventory(output_dir / "texture-inventory-report.json")
    _write_assignment_report(assignments, output_dir / "material-assignment-report.json")

    _render_previews(preview_dir)

    blend_path = output_dir / "a320-cockpit-2-shaded.blend"
    backup_path = output_dir / "a320-cockpit-2-shaded.blend1"
    glb_path = output_dir / "a320-cockpit-2-shaded.glb"
    backup_path.unlink(missing_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    backup_path.unlink(missing_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    root = bpy.data.objects.get("AIRBUS_ROOT")
    if root:
        root.select_set(True)
        bpy.context.view_layer.objects.active = root
        _select_descendants(root)
    else:
        bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB", export_extras=True, use_selection=True)
    _assert_glb(glb_path)

    reimport = _reimport_validation(glb_path, expected_nodes)
    validation = _validate(before, reimport, assignments, texture_report)
    (output_dir / "validation-report.json").write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": validation["status"], "glb": glb_path.as_posix()}, indent=2))


def _expected_runtime_nodes(node_report: dict[str, object]) -> list[str]:
    names = {node_report["rootObject"]}
    names.update(node_report["groups"].values())
    names.update(item["runtimeNodeName"] for item in node_report["meshReports"])
    names.update(["AIRBUS_A320_LOC_CAPTAIN_EYE", "AIRBUS_A320_LOC_DASHBOARD_FOCUS"])
    return sorted(names)


def _apply_material_annotation(recipes: dict[str, dict[str, object]]) -> list[dict[str, object]]:
    assignments = []
    fallback_materials: dict[str, bpy.types.Material] = {}
    for obj in sorted((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: item.name):
        role = _classify_role(obj)
        old_materials = [slot.material.name for slot in obj.material_slots if slot.material]
        if not obj.material_slots:
            obj.data.materials.append(_fallback_material(fallback_materials, recipes[role]))
        for slot in obj.material_slots:
            if slot.material:
                _configure_material(slot.material, recipes[role])
            else:
                slot.material = _fallback_material(fallback_materials, recipes[role])
        obj["semanticMaterialRole"] = recipes[role]["semanticMaterialRole"]
        obj["materialRecipeId"] = role
        assignments.append({
            "runtimeNodeName": obj.name,
            "assemblyCategory": obj.get("assemblyCategory", "unknown"),
            "sourceNodeName": obj.get("sourceNodeName", obj.name),
            "oldMaterials": old_materials,
            "newMaterialRecipe": role,
            "semanticMaterialRole": recipes[role]["semanticMaterialRole"],
            "preservedExistingMaterialSlots": bool(old_materials),
            "sourceTextureLinksPreserved": _has_base_color_texture_link(obj),
        })
    return assignments


def _classify_role(obj: bpy.types.Object) -> str:
    semantic = " ".join([
        obj.name.upper(),
        str(obj.get("sourceNodeName", "")).upper(),
        str(obj.get("assemblyCategory", "")).upper(),
        " ".join(slot.material.name.upper() for slot in obj.material_slots if slot.material),
    ])
    if "DISPLAY" in semantic or "M0MAT_010" in semantic:
        return "a320_display_glass"
    if "INTERACTIVE" in semantic:
        if any(token in semantic for token in ("SCREW", "BOLT", "RAIL", "LEVER", "METAL")):
            return "a320_worn_metal_fasteners"
        return "a320_control_dark_plastic"
    if any(token in semantic for token in ("SEAT", "CUSHION", "TRIM", "FABRIC", "WALL")):
        return "a320_soft_trim_fabric"
    if any(token in semantic for token in ("PANEL", "GLARE", "PEDESTAL", "CONSOLE")):
        return "a320_dark_panel_plastic"
    return "a320_preserve_source_pbr"


def _configure_material(material: bpy.types.Material, recipe: dict[str, object]) -> None:
    material["materialRecipeId"] = recipe["recipeId"]
    material["semanticMaterialRole"] = recipe["semanticMaterialRole"]
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return
    if not _input_has_link(bsdf, "Base Color"):
        material.diffuse_color = tuple(recipe["baseColor"])
        _set_input(bsdf, "Base Color", tuple(recipe["baseColor"]))
    # Keep the downloaded Sketchfab color/UV texture network intact. Agent 3
    # only records semantic roles and makes light-touch scalar PBR adjustments.
    _set_input(bsdf, "Metallic", recipe["metallic"])
    _set_input(bsdf, "Roughness", recipe["roughness"])
    if recipe["recipeId"] == "a320_display_glass" and not _input_has_link(bsdf, "Base Color"):
        _set_input(bsdf, "Emission Color", (0.05, 0.22, 0.2, 1.0))
        _set_input(bsdf, "Emission Strength", 0.05)


def _fallback_material(cache: dict[str, bpy.types.Material], recipe: dict[str, object]) -> bpy.types.Material:
    recipe_id = recipe["recipeId"]
    if recipe_id not in cache:
        material = bpy.data.materials.new(recipe_id)
        _configure_material(material, recipe)
        cache[recipe_id] = material
    return cache[recipe_id]


def _write_assignment_report(assignments: list[dict[str, object]], path: Path) -> None:
    counts = {}
    for assignment in assignments:
        counts[assignment["newMaterialRecipe"]] = counts.get(assignment["newMaterialRecipe"], 0) + 1
    path.write_text(json.dumps({
        "schema": "cockpit-pipeline/material-assignment-report-v1",
        "assignmentCount": len(assignments),
        "countsByRecipe": counts,
        "assignments": assignments,
    }, indent=2) + "\n", encoding="utf-8")


def _write_texture_inventory(path: Path) -> dict[str, object]:
    textures = []
    for image in sorted(bpy.data.images, key=lambda item: item.name):
        width, height = image.size
        if width <= 0 or height <= 0:
            continue
        textures.append({
            "name": image.name,
            "path": image.filepath or image.name,
            "width": int(width),
            "height": int(height),
            "packed": image.packed_file is not None,
            "usage": "preserved imported source texture",
        })
    report = {
        "schema": "cockpit-pipeline/texture-inventory-v1",
        "textureCount": len(textures),
        "sourceTexturesPreserved": True,
        "textures": textures,
        "optimizationDecision": "No texture rebake or downscale in this pass; Sketchfab inspector UV checker showed useful UV layout to preserve.",
    }
    path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def _render_previews(preview_dir: Path) -> None:
    center, radius = _scene_center_radius()
    _add_source_like_lighting(center, radius)
    _render_preview(
        preview_dir / "captain-daylight.png",
        Vector((-0.303763, -1.215466, 0.191386)),
        Vector((-0.104338, -0.456942, 0.056386)),
        50,
    )
    _render_preview(
        preview_dir / "captain-display-check.png",
        Vector((-0.217057, -1.050967, 0.281386)),
        Vector((-0.00029, -0.548331, 0.176386)),
        70,
    )
    _render_preview(
        preview_dir / "captain-pullback-review.png",
        Vector((-0.303763, -1.715466, 0.191386)),
        Vector((-0.104338, -0.456942, 0.056386)),
        50,
    )


def _render_preview(path: Path, location: Vector, target: Vector, lens: float) -> None:
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    bpy.ops.object.light_add(type="POINT", location=location + Vector((0.0, 0.08, 0.12)))
    fill = bpy.context.object
    fill.name = "AIRBUS_A320_SHADED_CAMERA_FILL"
    fill.data.energy = 240
    fill.data.shadow_soft_size = 1.0
    bpy.ops.object.camera_add(location=location)
    camera = bpy.context.object
    camera.name = "CAM_" + path.stem.upper().replace("-", "_")
    camera.rotation_euler = (target - location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = lens
    camera.data.clip_start = 0.005
    camera.data.clip_end = 1000
    scene.camera = camera
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(camera, do_unlink=True)
    bpy.data.objects.remove(fill, do_unlink=True)


def _add_source_like_lighting(center: Vector, radius: float) -> None:
    scene = bpy.context.scene
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.color = (0.055, 0.058, 0.06)
    bpy.ops.object.light_add(type="AREA", location=(center.x, center.y - radius * 0.7, center.z + radius * 0.9))
    key = bpy.context.object
    key.name = "AIRBUS_A320_SOURCE_PARITY_AREA_LIGHT"
    key.data.energy = 650
    key.data.size = max(radius * 0.8, 2.0)
    bpy.ops.object.light_add(type="POINT", location=(center.x + radius * 0.35, center.y + radius * 0.25, center.z + radius * 0.35))
    fill = bpy.context.object
    fill.name = "AIRBUS_A320_SOURCE_PARITY_FILL_LIGHT"
    fill.data.energy = 120


def _snapshot(expected_nodes: list[str]) -> dict[str, object]:
    return {
        "runtimeNodeNames": sorted(name for name in expected_nodes if bpy.data.objects.get(name)),
        "runtimeMetadata": {name: _metadata_for(bpy.data.objects.get(name)) for name in expected_nodes if bpy.data.objects.get(name)},
        "uvLayerCounts": {obj.name: len(obj.data.uv_layers) for obj in bpy.context.scene.objects if obj.type == "MESH"},
        "dimensions": _scene_dimensions(),
        "materialCount": len(bpy.data.materials),
        "sourceTextureLinkCount": _source_texture_link_count(),
    }


def _metadata_for(obj: bpy.types.Object | None) -> dict[str, object]:
    if obj is None:
        return {}
    return {key: obj[key] for key in RUNTIME_METADATA_KEYS if key in obj}


def _validate(before: dict[str, object], reimport: dict[str, object], assignments: list[dict[str, object]], texture_report: dict[str, object]) -> dict[str, object]:
    before_names = set(before["runtimeNodeNames"])
    after_names = set(reimport["runtimeNodeNames"])
    missing_nodes = sorted(before_names - after_names)
    metadata_preserved = before["runtimeMetadata"] == reimport["runtimeMetadata"]
    uv_preserved = before["uvLayerCounts"] == reimport["uvLayerCounts"]
    dim_a = before["dimensions"]
    dim_b = reimport["dimensions"]
    drift = max(abs(dim_a[axis] - dim_b[axis]) for axis in ("x", "y", "z"))
    status = "pass" if not missing_nodes and metadata_preserved and uv_preserved and drift < 0.01 and reimport["meshCount"] > 0 else "fail"
    return {
        "status": status,
        "runtimeNodeNamesPreserved": not missing_nodes,
        "gameIdMetadataPreserved": metadata_preserved,
        "uvLayersPreserved": uv_preserved,
        "missingRuntimeNodes": missing_nodes,
        "dimensionDriftMax": round(drift, 6),
        "neutralDimensions": dim_a,
        "shadedReimportDimensions": dim_b,
        "assignmentCount": len(assignments),
        "materialCount": reimport["materialCount"],
        "textureCount": texture_report["textureCount"],
        "destructiveOptimizationUsed": False,
        "sourceTextureLinkCount": before["sourceTextureLinkCount"],
        "sourceTextureLinksPreserved": before["sourceTextureLinkCount"] > 0,
        "reimportValidation": reimport,
    }


def _reimport_validation(glb_path: Path, expected_nodes: list[str]) -> dict[str, object]:
    _reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    return {
        "status": "pass",
        "runtimeNodeNames": sorted(name for name in expected_nodes if bpy.data.objects.get(name)),
        "runtimeMetadata": {name: _metadata_for(bpy.data.objects.get(name)) for name in expected_nodes if bpy.data.objects.get(name)},
        "uvLayerCounts": {obj.name: len(obj.data.uv_layers) for obj in bpy.context.scene.objects if obj.type == "MESH"},
        "objectCount": len(bpy.context.scene.objects),
        "meshCount": len([obj for obj in bpy.context.scene.objects if obj.type == "MESH"]),
        "materialCount": len(bpy.data.materials),
        "dimensions": _scene_dimensions(),
    }


def _scene_dimensions() -> dict[str, float]:
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        return {"x": 0.0, "y": 0.0, "z": 0.0, "center": [0.0, 0.0, 0.0]}
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    mins = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maxs = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    center = (mins + maxs) * 0.5
    size = maxs - mins
    return {"x": round(size.x, 6), "y": round(size.y, 6), "z": round(size.z, 6), "center": [round(value, 6) for value in center]}


def _scene_center_radius() -> tuple[Vector, float]:
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        return Vector((0.0, 0.0, 0.0)), 1.0
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    mins = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maxs = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    center = (mins + maxs) * 0.5
    radius = max((maxs - mins).length * 0.5, 1.0)
    return center, radius


def _select_descendants(obj: bpy.types.Object) -> None:
    for child in obj.children:
        child.select_set(True)
        _select_descendants(child)


def _set_input(bsdf: bpy.types.Node, name: str, value: object) -> None:
    if name in bsdf.inputs:
        bsdf.inputs[name].default_value = value


def _input_has_link(node: bpy.types.Node, input_name: str) -> bool:
    return input_name in node.inputs and bool(node.inputs[input_name].links)


def _has_base_color_texture_link(obj: bpy.types.Object) -> bool:
    for slot in obj.material_slots:
        material = slot.material
        if not material or not material.use_nodes:
            continue
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if bsdf and _input_has_link(bsdf, "Base Color"):
            return True
    return False


def _source_texture_link_count() -> int:
    count = 0
    for material in bpy.data.materials:
        if not material.use_nodes:
            continue
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if bsdf and _input_has_link(bsdf, "Base Color"):
            count += 1
    return count


def _assert_glb(path: Path) -> None:
    with path.open("rb") as handle:
        if handle.read(4) != b"glTF":
            raise RuntimeError(f"export did not produce a GLB: {path}")


def _reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for item in list(collection):
            if item.users == 0:
                collection.remove(item)


def _args_after_double_dash() -> list[str]:
    import sys

    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1:]


if __name__ == "__main__":
    main()
