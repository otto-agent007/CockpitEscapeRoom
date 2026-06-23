from __future__ import annotations

import argparse
import json
import math
import random
from pathlib import Path

import bpy
from mathutils import Vector


RUNTIME_METADATA_KEYS = ["game_id", "interaction", "rotation_axis", "rest_angle", "active_angle", "sound_id"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply DC-9 vertical-slice procedural shading.")
    parser.add_argument("--assembly-glb", required=True)
    parser.add_argument("--layout", required=True)
    parser.add_argument("--node-report", required=True)
    parser.add_argument("--recipes", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--preview-dir", required=True)
    args = parser.parse_args(_args_after_double_dash())

    assembly_glb = Path(args.assembly_glb)
    layout = json.loads(Path(args.layout).read_text(encoding="utf-8"))
    node_report = json.loads(Path(args.node_report).read_text(encoding="utf-8"))
    recipes = json.loads(Path(args.recipes).read_text(encoding="utf-8"))
    output_dir = Path(args.output_dir)
    preview_dir = Path(args.preview_dir)
    texture_dir = output_dir / "textures"
    output_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    texture_dir.mkdir(parents=True, exist_ok=True)

    _reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(assembly_glb))
    runtime_nodes = [item["runtimeNodeName"] for item in layout["componentInstances"]]
    before = _snapshot(runtime_nodes)

    material_index = _build_materials(recipes, texture_dir)
    assignments = _assign_materials(material_index)
    texture_report = _write_texture_report(recipes, texture_dir, output_dir / "texture-bake-report.json")
    _write_assignment_report(assignments, output_dir / "material-assignment-report.json")

    _render_previews(preview_dir, layout)

    blend_path = output_dir / "dc9-vslice-shaded.blend"
    backup_path = output_dir / "dc9-vslice-shaded.blend1"
    glb_path = output_dir / "dc9-vslice-shaded.glb"
    backup_path.unlink(missing_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    backup_path.unlink(missing_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB", export_extras=True)
    _assert_glb(glb_path)

    reimport = _reimport_validation(glb_path, runtime_nodes)
    validation = _validate(before, reimport, assignments, texture_report, node_report)
    validation_path = output_dir / "validation-report.json"
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": validation["status"], "glb": glb_path.as_posix()}, indent=2))


def _build_materials(recipes: dict[str, object], texture_dir: Path) -> dict[str, bpy.types.Material]:
    materials = {}
    for recipe in recipes["recipes"]:
        texture_path = texture_dir / f"{recipe['recipeId']}.png"
        _write_baked_texture(texture_path, recipe)
        image = bpy.data.images.load(str(texture_path))
        material = bpy.data.materials.new(recipe["recipeId"])
        material.use_nodes = True
        material.diffuse_color = tuple(recipe["baseColor"])
        material["recipeId"] = recipe["recipeId"]
        material["semanticMaterialRole"] = recipe["semanticMaterialRole"]
        material["proceduralSeed"] = recipe["proceduralSeed"]
        if recipe["baseColor"][3] < 1.0:
            material.blend_method = "BLEND"
            material.use_screen_refraction = True
        nodes = material.node_tree.nodes
        bsdf = nodes.get("Principled BSDF")
        if bsdf:
            _set_input(bsdf, "Base Color", tuple(recipe["baseColor"]))
            _set_input(bsdf, "Metallic", recipe["metallic"])
            _set_input(bsdf, "Roughness", recipe["roughness"])
            _set_input(bsdf, "Alpha", recipe["baseColor"][3])
            tex = nodes.new(type="ShaderNodeTexImage")
            tex.image = image
            material.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        materials[recipe["recipeId"]] = material
    return materials


def _write_baked_texture(path: Path, recipe: dict[str, object]) -> None:
    size = recipe["bakeSettings"]["resolution"]
    rng = random.Random(int(recipe["proceduralSeed"]))
    color = recipe["baseColor"]
    wear = float(recipe["wearIntensity"])
    image = bpy.data.images.new(recipe["recipeId"] + "_texture", width=size, height=size, alpha=True)
    pixels = []
    for y in range(size):
        for x in range(size):
            edge = min(x, y, size - 1 - x, size - 1 - y) / (size * 0.5)
            edge_wear = max(0.0, 1.0 - edge) * wear
            fine = (rng.random() - 0.5) * wear * 0.16
            streak = math.sin((x * 0.07) + (recipe["proceduralSeed"] * 0.01)) * wear * 0.035
            factor = 1.0 + fine + streak + edge_wear * 0.18
            grime = edge_wear * 0.08
            pixels.extend([
                _clamp(color[0] * factor - grime),
                _clamp(color[1] * factor - grime),
                _clamp(color[2] * factor - grime),
                color[3],
            ])
    image.pixels = pixels
    image.filepath_raw = str(path)
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)


def _assign_materials(materials: dict[str, bpy.types.Material]) -> list[dict[str, object]]:
    assignments = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        role = _classify_role(obj)
        material = materials[role]
        old_materials = [slot.material.name for slot in obj.material_slots if slot.material]
        obj.data.materials.clear()
        obj.data.materials.append(material)
        obj["semanticMaterialRole"] = material["semanticMaterialRole"]
        obj["materialRecipeId"] = role
        assignments.append({
            "runtimeNodeName": obj.name,
            "componentId": obj.get("componentId", "reference"),
            "sourceNodeName": obj.get("sourceNodeName", obj.name),
            "oldMaterials": old_materials,
            "semanticMaterialRole": material["semanticMaterialRole"],
            "newMaterialRecipe": role,
            "classificationConfidence": _classification_confidence(obj, role),
        })
    return assignments


def _classify_role(obj: bpy.types.Object) -> str:
    name = obj.name.upper()
    source = str(obj.get("sourceNodeName", "")).upper()
    category = str(obj.get("componentId", obj.get("category", ""))).upper()
    semantic = " ".join([name, source, category])
    if obj.get("referenceOnly"):
        if "GLARESHIELD" in name or "LOWER_PANEL" in name:
            return "dc9_dark_instrument_panel"
        return "dc9_painted_blue_green_gray"
    if "GAUGE" in name or "ALT" in semantic or "BEZEL" in semantic or "SCREW" in semantic:
        if "SCREW" in semantic:
            return "dc9_fasteners"
        if "NEEDLE" in semantic or "NUM" in semantic or "MB" in semantic or "INHG" in semantic:
            return "dc9_cream_stencil"
        if "FACE" in semantic:
            return "dc9_gauge_face"
        if "BEZEL" in semantic or "KNOB" in semantic:
            return "dc9_brushed_worn_metal"
        return "dc9_instrument_glass"
    if "YOKE" in semantic:
        if "COL" in semantic or "BASE" in semantic:
            return "dc9_aged_dark_plastic"
        return "dc9_black_rubber"
    if "THROTTLE" in semantic or "LEVER" in semantic or "PEDESTAL" in semantic or "FUELCUTOFF" in semantic or "XFEED" in semantic:
        if "BASE" in semantic or "DRUMFACE" in semantic:
            return "dc9_aged_dark_plastic"
        return "dc9_brushed_worn_metal"
    if "SWITCH" in semantic or "SWABS" in semantic or "KNOBABS" in semantic:
        if "LAMP" in semantic:
            return "dc9_instrument_glass"
        if "KNOB" in semantic:
            return "dc9_aged_dark_plastic"
        return "dc9_brushed_worn_metal"
    return "dc9_safe_neutral"


def _classification_confidence(obj: bpy.types.Object, role: str) -> float:
    if role == "dc9_safe_neutral":
        return 0.35
    if obj.get("componentId") or obj.get("referenceOnly"):
        return 0.86
    return 0.68


def _write_assignment_report(assignments: list[dict[str, object]], path: Path) -> None:
    by_role = {}
    for assignment in assignments:
        by_role[assignment["newMaterialRecipe"]] = by_role.get(assignment["newMaterialRecipe"], 0) + 1
    path.write_text(json.dumps({
        "schema": "cockpit-pipeline/material-assignment-report-v1",
        "assignmentCount": len(assignments),
        "countsByRecipe": by_role,
        "assignments": assignments,
    }, indent=2) + "\n", encoding="utf-8")


def _write_texture_report(recipes: dict[str, object], texture_dir: Path, path: Path) -> dict[str, object]:
    textures = []
    for recipe in recipes["recipes"]:
        texture = texture_dir / f"{recipe['recipeId']}.png"
        textures.append({
            "recipeId": recipe["recipeId"],
            "path": texture.as_posix(),
            "resolution": recipe["bakeSettings"]["resolution"],
            "baked": True,
            "purpose": "glTF-compatible deterministic base-color wear texture",
        })
    report = {
        "schema": "cockpit-pipeline/texture-bake-report-v1",
        "textureCount": len(textures),
        "textures": textures,
        "limitations": [
            "Textures are deterministic procedural proof maps, not final hand-painted cockpit texture art.",
            "No normal or roughness maps were required for this vertical-slice proof."
        ],
    }
    path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def _render_previews(preview_dir: Path, layout: dict[str, object]) -> None:
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    center, radius = _center_radius(meshes)
    eye = Vector(layout["captainEyePoint"]["translation"])
    _render_preview(preview_dir / "captain-daylight.png", eye + Vector((0.0, -0.2, 0.06)), center, max(1.7, radius * 1.15), "daylight")
    _render_preview(preview_dir / "captain-dim-instrument-lighting.png", eye + Vector((0.0, -0.2, 0.06)), center, max(1.7, radius * 1.15), "dim")

    by_category = {item["category"]: item for item in layout["componentInstances"]}
    _render_component(preview_dir / "yoke-material-close-up.png", by_category["yoke_assembly"]["runtimeNodeName"], "daylight")
    _render_component(preview_dir / "throttle-material-close-up.png", by_category["throttle_assembly"]["runtimeNodeName"], "daylight")
    gauge_objects = _component_meshes(by_category["large_cockpit_gauge"]["runtimeNodeName"])
    gauge_center, gauge_radius = _center_radius(gauge_objects)
    _render_preview(preview_dir / "gauge-glass-face-close-up.png", gauge_center + Vector((gauge_radius * 1.1, -gauge_radius * 2.0, gauge_radius * 0.7)), gauge_center, max(0.65, gauge_radius * 2.2), "daylight")
    _render_component(preview_dir / "switch-cluster-close-up.png", by_category["switch_cluster"]["runtimeNodeName"], "daylight")


def _render_component(path: Path, runtime_node_name: str, mode: str) -> None:
    objects = _component_meshes(runtime_node_name)
    center, radius = _center_radius(objects)
    _render_preview(path, center + Vector((radius * 1.35, -radius * 2.0, radius * 0.75)), center, max(0.55, radius * 2.5), mode)


def _component_meshes(runtime_node_name: str) -> list[bpy.types.Object]:
    root = bpy.data.objects.get(runtime_node_name)
    if not root:
        return []
    descendants = []
    stack = list(root.children)
    while stack:
        obj = stack.pop()
        if obj.type == "MESH":
            descendants.append(obj)
        stack.extend(obj.children)
    return descendants


def _render_preview(path: Path, location: Vector, target: Vector, ortho_scale: float, mode: str) -> None:
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:
        scene.render.engine = "BLENDER_WORKBENCH"
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.color = (0.045, 0.048, 0.05) if mode == "dim" else (0.18, 0.19, 0.19)
    energy = 120 if mode == "dim" else 650
    bpy.ops.object.light_add(type="AREA", location=(0.0, -1.8, 3.2))
    light = bpy.context.object
    light.name = "DC9_SHADED_PREVIEW_LIGHT"
    light.data.energy = energy
    light.data.size = 4.5
    if mode == "dim":
        bpy.ops.object.light_add(type="POINT", location=(-0.15, -0.8, 1.4))
        accent = bpy.context.object
        accent.name = "DC9_DIM_INSTRUMENT_FILL"
        accent.data.color = (0.7, 0.85, 0.95)
        accent.data.energy = 55
    else:
        accent = None
    bpy.ops.object.camera_add(location=location)
    camera = bpy.context.object
    camera.name = "CAM_" + path.stem.upper().replace("-", "_")
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = ortho_scale
    _look_at(camera, target)
    scene.camera = camera
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 800
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(camera, do_unlink=True)
    bpy.data.objects.remove(light, do_unlink=True)
    if accent:
        bpy.data.objects.remove(accent, do_unlink=True)


def _snapshot(runtime_nodes: list[str]) -> dict[str, object]:
    return {
        "runtimeNodeNames": sorted(runtime_nodes),
        "runtimeMetadata": {name: _metadata_for(bpy.data.objects.get(name)) for name in runtime_nodes},
        "hierarchy": {name: sorted(child.name for child in bpy.data.objects.get(name).children) for name in runtime_nodes if bpy.data.objects.get(name)},
        "dimensions": _scene_dimensions(),
    }


def _metadata_for(obj: bpy.types.Object | None) -> dict[str, object]:
    if obj is None:
        return {}
    return {key: obj[key] for key in RUNTIME_METADATA_KEYS if key in obj}


def _validate(before: dict[str, object], reimport: dict[str, object], assignments: list[dict[str, object]], texture_report: dict[str, object], node_report: dict[str, object]) -> dict[str, object]:
    missing_nodes = sorted(set(before["runtimeNodeNames"]) - set(reimport["runtimeNodeNames"]))
    metadata_preserved = before["runtimeMetadata"] == reimport["runtimeMetadata"]
    dim_a = before["dimensions"]
    dim_b = reimport["dimensions"]
    drift = max(abs(dim_a[axis] - dim_b[axis]) for axis in ("x", "y", "z"))
    safe_neutral = [item for item in assignments if item["newMaterialRecipe"] == "dc9_safe_neutral"]
    expected_runtime = sorted(report["runtimeNodeName"] for report in node_report["componentReports"])
    runtime_preserved = sorted(before["runtimeNodeNames"]) == sorted(reimport["runtimeNodeNames"]) == expected_runtime
    status = "pass" if not missing_nodes and metadata_preserved and runtime_preserved and drift < 0.01 and reimport["meshCount"] > 0 else "fail"
    return {
        "status": status,
        "runtimeNodeNamesPreserved": runtime_preserved,
        "interactionMetadataPreserved": metadata_preserved,
        "missingRuntimeNodes": missing_nodes,
        "dimensionDriftMax": round(drift, 6),
        "neutralDimensions": dim_a,
        "shadedReimportDimensions": dim_b,
        "assignmentCount": len(assignments),
        "safeNeutralAssignments": safe_neutral,
        "textureCount": texture_report["textureCount"],
        "reimportValidation": reimport,
    }


def _reimport_validation(glb_path: Path, runtime_nodes: list[str]) -> dict[str, object]:
    _reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    return {
        "status": "pass",
        "runtimeNodeNames": sorted(name for name in runtime_nodes if bpy.data.objects.get(name)),
        "runtimeMetadata": {name: _metadata_for(bpy.data.objects.get(name)) for name in runtime_nodes},
        "objectCount": len(bpy.context.scene.objects),
        "meshCount": len([obj for obj in bpy.context.scene.objects if obj.type == "MESH"]),
        "materialCount": len(bpy.data.materials),
        "dimensions": _scene_dimensions(),
    }


def _scene_dimensions() -> dict[str, float]:
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        return {"x": 0.0, "y": 0.0, "z": 0.0}
    center, _ = _center_radius(meshes)
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    size = maxs - mins
    return {"x": round(size.x, 6), "y": round(size.y, 6), "z": round(size.z, 6), "center": [round(value, 6) for value in center]}


def _center_radius(objects: list[bpy.types.Object]) -> tuple[Vector, float]:
    if not objects:
        return Vector((0, 0, 0)), 1.0
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    center = (mins + maxs) * 0.5
    radius = max((maxs - mins).length * 0.5, 0.1)
    return center, radius


def _set_input(bsdf: bpy.types.Node, name: str, value: object) -> None:
    if name in bsdf.inputs:
        bsdf.inputs[name].default_value = value


def _assert_glb(path: Path) -> None:
    with path.open("rb") as handle:
        if handle.read(4) != b"glTF":
            raise RuntimeError(f"export did not produce a GLB: {path}")


def _look_at(obj: bpy.types.Object, target: Vector) -> None:
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def _reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)
    for image in list(bpy.data.images):
        bpy.data.images.remove(image)


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _args_after_double_dash() -> list[str]:
    import sys

    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1:]


if __name__ == "__main__":
    main()
