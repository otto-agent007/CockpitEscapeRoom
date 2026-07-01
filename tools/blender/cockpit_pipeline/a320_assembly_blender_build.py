from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy
from mathutils import Vector


EXTERIOR_OR_CONFIRMED_BLOCKER_NAMES = {
    "Object_0",
    "Object_1",
    "Object_2",
    "Object_7.001",
    "Object_83",
    "Object_92",
    "Object_129",
    "Object_131",
}

GROUPS = {
    "static": "AIRBUS_A320_STATIC",
    "displays": "AIRBUS_A320_DISPLAY_CANDIDATES",
    "interactive": "AIRBUS_A320_INTERACTIVE_CANDIDATES",
    "locators": "AIRBUS_A320_LOCATORS",
    "colliders": "AIRBUS_A320_COLLIDERS",
    "puzzle_props": "AIRBUS_A320_PUZZLE_PROPS",
}

SOURCE_SEMANTIC_NAMES = {
    "Object_40": "PEDESTAL_PANEL_CLUSTER",
    "Object_41.001": "PEDESTAL_PANEL_CLUSTER",
    "Object_42": "CENTER_CONSOLE_CONTROLS",
    "Object_55": "COCKPIT_FORWARD_INTERIOR_SHELL_AND_SEATS",
    "Object_56": "COCKPIT_REAR_BULKHEAD_SEATS_AND_SIDEWALLS",
    "Object_57": "COCKPIT_INTERIOR_TRIM_PANEL",
    "Object_67": "COCKPIT_FLOOR_CARPET",
    "Object_68": "COCKPIT_REAR_TRIM_PANEL",
    "Object_69.001": "FIRST_OFFICER_SEAT_SIDE_STRUCTURE",
    "Object_70": "FIRST_OFFICER_SEAT_BASE",
    "Object_74.001": "CAPTAIN_SEAT_SIDE_STRUCTURE",
    "Object_75": "CAPTAIN_SEAT_BASE",
    "Object_77.001": "CENTER_PEDESTAL_LOWER_STRUCTURE",
    "Object_97": "FIRST_OFFICER_MAIN_DISPLAY_PANEL",
    "Object_100": "RIGHT_FORWARD_PANEL_SURFACE",
    "Object_101": "LEFT_FORWARD_PANEL_SURFACE",
    "Object_108": "FIRST_OFFICER_LOWER_DISPLAY_PANEL",
    "Object_109": "CAPTAIN_MAIN_DISPLAY_PANEL",
    "Object_110": "FIRST_OFFICER_MAIN_DISPLAY_PANEL",
    "Object_127": "OVERHEAD_PANEL_STRUCTURE",
    "Object_133.001": "CAPTAIN_MAIN_DISPLAY_PANEL",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build neutral Airbus A320 cockpit source assembly handoff.")
    parser.add_argument("--source-gltf", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--preview-dir", required=True)
    args = parser.parse_args(_args_after_double_dash())

    source_gltf = Path(args.source_gltf)
    output_dir = Path(args.output_dir)
    preview_dir = Path(args.preview_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)

    _reset_scene()
    before_objects = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(source_gltf))
    imported = [obj for obj in bpy.data.objects if obj not in before_objects]
    if not imported:
        raise RuntimeError(f"glTF import produced no objects: {source_gltf}")

    root = bpy.data.objects.new("AIRBUS_ROOT", None)
    bpy.context.collection.objects.link(root)
    root["game_id"] = "airbus.a320.root"
    root["scene_group"] = "Airbus A320 First-Officer cockpit"
    root["target_aircraft"] = "Airbus A320"
    root["assemblyStage"] = "assembly_complete"
    root["source_candidate_id"] = "a320-prebuilt-sketchfab-a320-cockpit-2"

    groups = {}
    for key, name in GROUPS.items():
        group = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(group)
        group.parent = root
        group["game_id"] = f"airbus.a320.{key}"
        groups[key] = group

    deleted = _delete_exterior_and_confirmed_blockers()
    mesh_reports = _classify_and_parent_meshes(groups)
    _add_locator(groups["locators"], "AIRBUS_A320_LOC_CAPTAIN_EYE", (-0.30, -1.22, 0.62), "airbus.a320.locator.captain_eye")
    _add_locator(groups["locators"], "AIRBUS_A320_LOC_DASHBOARD_FOCUS", (0.0, -0.55, 0.18), "airbus.a320.locator.dashboard_focus")
    _add_locator(groups["locators"], "AIRBUS_A320_LOC_INTERIOR_360_CENTER", (0.0, -1.05, 0.62), "airbus.a320.locator.interior_360_center")

    blend_path = output_dir / "a320-cockpit-2-assembly.blend"
    blend_backup_path = output_dir / "a320-cockpit-2-assembly.blend1"
    glb_path = output_dir / "a320-cockpit-2-assembly.glb"
    node_report_path = output_dir / "node-pivot-report.json"
    validation_path = output_dir / "validation-report.json"
    runtime_contract_summary_path = output_dir / "runtime-contract-summary.json"

    _render_views(preview_dir)
    blend_backup_path.unlink(missing_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    blend_backup_path.unlink(missing_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    bpy.context.view_layer.objects.active = root
    _select_descendants(root)
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB", export_extras=True, use_selection=True)
    if not glb_path.is_file() or glb_path.stat().st_size == 0:
        raise RuntimeError(f"GLB export failed: {glb_path}")

    node_report = {
        "rootObject": root.name,
        "groups": {key: group.name for key, group in groups.items()},
        "deletedExteriorOrConfirmedBlockerObjects": deleted,
        "preservedInteriorSizedObjects": sorted(["Object_55", "Object_56"]),
        "meshReports": mesh_reports,
        "runtimeNodeNames": sorted(obj.name for obj in bpy.context.scene.objects),
        "pivotNotes": [
            {
                "node": root.name,
                "pivotVerified": False,
                "notes": "Imported source geometry uses generic Sketchfab pivots. Agent 2 created stable grouping roots and locators; individual control pivots require a later focused pass before interaction."
            }
        ],
    }
    node_report_path.write_text(json.dumps(node_report, indent=2) + "\n", encoding="utf-8")

    contract_summary = {
        "rootObject": root.name,
        "sceneGroup": "Airbus A320 First-Officer cockpit",
        "assetPath": glb_path.as_posix(),
        "runtimeNodes": [
            _runtime_node(root.name, "airbus.a320.root", False, "GROUP_ROOT", "Scene container; no direct HTML control."),
            _runtime_node(groups["static"].name, "airbus.a320.static", False, "GROUP_ROOT", "Static cockpit geometry; no direct HTML control."),
            _runtime_node(groups["displays"].name, "airbus.a320.displays", False, "GROUP_ROOT", "Display inspection candidate; future HTML panel mirror required if interactive."),
            _runtime_node(groups["interactive"].name, "airbus.a320.interactive", False, "GROUP_ROOT", "Interactive candidate group; controls require later pivot-specific HTML equivalents."),
            _runtime_node("AIRBUS_A320_LOC_CAPTAIN_EYE", "airbus.a320.locator.captain_eye", True, "WORLD", "Camera locator; no direct HTML control."),
            _runtime_node("AIRBUS_A320_LOC_DASHBOARD_FOCUS", "airbus.a320.locator.dashboard_focus", True, "WORLD", "Camera target locator; no direct HTML control."),
            _runtime_node("AIRBUS_A320_LOC_INTERIOR_360_CENTER", "airbus.a320.locator.interior_360_center", True, "WORLD", "Interior scan locator between the cockpit seats; no direct HTML control."),
        ],
    }
    runtime_contract_summary_path.write_text(json.dumps(contract_summary, indent=2) + "\n", encoding="utf-8")

    assembly_stats = _assembly_stats(root.name, groups, mesh_reports)
    reimport = _reimport_validation(glb_path)
    validation = _validate_scene(assembly_stats, reimport)
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": validation["status"],
        "blend": blend_path.as_posix(),
        "glb": glb_path.as_posix(),
        "nodeReport": node_report_path.as_posix(),
        "validationReport": validation_path.as_posix(),
        "previewDir": preview_dir.as_posix(),
    }, indent=2))


def _delete_exterior_and_confirmed_blockers() -> list[str]:
    deleted = []
    for obj in list(bpy.context.scene.objects):
        if obj.name in EXTERIOR_OR_CONFIRMED_BLOCKER_NAMES:
            deleted.append(obj.name)
            bpy.data.objects.remove(obj, do_unlink=True)
    return sorted(deleted)


def _classify_and_parent_meshes(groups: dict[str, bpy.types.Object]) -> list[dict[str, object]]:
    reports = []
    meshes = sorted([obj for obj in bpy.context.scene.objects if obj.type == "MESH"], key=lambda item: item.name)
    for index, obj in enumerate(meshes, start=1):
        source_name = obj.name
        bounds = _bounds(obj)
        category = _category_for(obj, bounds)
        parent = groups[category]
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
        obj.matrix_world = world
        material_names = [slot.material.name for slot in obj.material_slots if slot.material]
        semantic_name = _semantic_part_name(source_name, category, bounds, material_names)
        obj.name = f"AIRBUS_A320_{category.upper()}_{index:03d}_{semantic_name}"
        obj["sourceNodeName"] = source_name
        obj["semanticPartName"] = semantic_name
        obj["game_id"] = f"airbus.a320.{category}.{index:03d}"
        obj["assemblyCategory"] = category
        obj["pivotVerified"] = False
        reports.append({
            "sourceNodeName": source_name,
            "runtimeNodeName": obj.name,
            "semanticPartName": semantic_name,
            "category": category,
            "gameId": obj["game_id"],
            "center": _vector_list(bounds["center"]),
            "size": _vector_list(bounds["size"]),
            "materialNames": material_names,
            "polygonCount": len(obj.data.polygons),
            "pivotVerified": False,
        })
    return reports


def _category_for(obj: bpy.types.Object, bounds: dict[str, Vector]) -> str:
    material_names = {slot.material.name for slot in obj.material_slots if slot.material}
    center = bounds["center"]
    size = bounds["size"]
    if "m0mat_010" in material_names or (size.z < 0.04 and -0.48 <= center.y <= -0.35 and 0.05 <= center.z <= 0.20):
        return "displays"
    if -0.95 <= center.y <= -0.35 and -0.12 <= center.z <= 0.38 and max(size.x, size.y, size.z) < 0.40:
        return "interactive"
    return "static"


def _add_locator(parent: bpy.types.Object, name: str, location: tuple[float, float, float], game_id: str) -> None:
    locator = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(locator)
    locator.parent = parent
    locator.location = location
    locator["game_id"] = game_id
    locator["locatorType"] = "camera_reference"


def _render_views(preview_dir: Path) -> None:
    _render_preview(
        preview_dir / "captain-seat-view.png",
        Vector((-0.303763, -1.215466, 0.62)),
        Vector((-0.104338, -0.456942, 0.056386)),
        50,
        hidden_semantic_parts={"COCKPIT_FORWARD_INTERIOR_SHELL_AND_SEATS", "COCKPIT_REAR_BULKHEAD_SEATS_AND_SIDEWALLS"},
    )
    _render_preview(
        preview_dir / "dashboard-screens-view.png",
        Vector((-0.217057, -1.050967, 0.281386)),
        Vector((-0.00029, -0.548331, 0.176386)),
        70,
        hidden_semantic_parts={"COCKPIT_FORWARD_INTERIOR_SHELL_AND_SEATS", "COCKPIT_REAR_BULKHEAD_SEATS_AND_SIDEWALLS"},
    )


def _render_preview(path: Path, location: Vector, target: Vector, lens: float, hidden_semantic_parts: set[str] | None = None) -> None:
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    bpy.ops.object.light_add(type="AREA", location=(0.0, -1.2, 2.2))
    light = bpy.context.object
    light.name = "AIRBUS_A320_ASSEMBLY_PREVIEW_LIGHT"
    light.data.energy = 850
    light.data.size = 4.0
    bpy.ops.object.light_add(type="POINT", location=location + Vector((0.0, 0.05, 0.15)))
    fill = bpy.context.object
    fill.name = "AIRBUS_A320_ASSEMBLY_CAMERA_FILL"
    fill.data.energy = 240
    fill.data.shadow_soft_size = 0.9
    bpy.ops.object.camera_add(location=location)
    camera = bpy.context.object
    camera.name = "CAM_" + path.stem.upper().replace("-", "_")
    direction = target - location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = lens
    camera.data.clip_start = 0.005
    camera.data.clip_end = 1000
    scene.camera = camera
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath = str(path)
    hidden_state = _set_preview_hidden_semantics(hidden_semantic_parts or set())
    bpy.ops.render.render(write_still=True)
    _restore_preview_hidden_state(hidden_state)
    bpy.data.objects.remove(camera, do_unlink=True)
    bpy.data.objects.remove(light, do_unlink=True)
    bpy.data.objects.remove(fill, do_unlink=True)


def _set_preview_hidden_semantics(hidden_semantic_parts: set[str]) -> list[tuple[bpy.types.Object, bool]]:
    if not hidden_semantic_parts:
        return []
    state = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.get("semanticPartName") not in hidden_semantic_parts:
            continue
        state.append((obj, obj.hide_render))
        obj.hide_render = True
    return state


def _restore_preview_hidden_state(state: list[tuple[bpy.types.Object, bool]]) -> None:
    for obj, hide_render in state:
        obj.hide_render = hide_render


def _assembly_stats(root_name: str, groups: dict[str, bpy.types.Object], mesh_reports: list[dict[str, object]]) -> dict[str, object]:
    runtime_names = [obj.name for obj in bpy.context.scene.objects]
    duplicates = sorted({name for name in runtime_names if runtime_names.count(name) > 1})
    group_failures = [group.name for group in groups.values() if "game_id" not in group]
    return {
        "rootObject": root_name,
        "meshCount": len([obj for obj in bpy.context.scene.objects if obj.type == "MESH"]),
        "objectCount": len(bpy.context.scene.objects),
        "materialCount": len(bpy.data.materials),
        "runtimeNodeCount": len(runtime_names),
        "duplicateRuntimeNodeNames": duplicates,
        "groupMetadataFailures": group_failures,
        "meshReportCount": len(mesh_reports),
        "pivotVerifiedCount": len([item for item in mesh_reports if item["pivotVerified"]]),
    }


def _validate_scene(assembly_stats: dict[str, object], reimport: dict[str, object]) -> dict[str, object]:
    duplicates = assembly_stats["duplicateRuntimeNodeNames"]
    group_failures = assembly_stats["groupMetadataFailures"]
    mesh_report_count = assembly_stats["meshReportCount"]
    status = "pass" if not duplicates and not group_failures and mesh_report_count > 0 and reimport["status"] == "pass" else "fail"
    return {
        "status": status,
        **assembly_stats,
        "reimportValidation": reimport,
    }


def _reimport_validation(glb_path: Path) -> dict[str, object]:
    _reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    names = {obj.name for obj in bpy.context.scene.objects}
    mesh_count = len([obj for obj in bpy.context.scene.objects if obj.type == "MESH"])
    return {
        "status": "pass" if "AIRBUS_ROOT" in names and mesh_count > 0 else "fail",
        "rootFound": "AIRBUS_ROOT" in names,
        "objectCount": len(bpy.context.scene.objects),
        "meshCount": mesh_count,
    }


def _select_descendants(obj: bpy.types.Object) -> None:
    for child in obj.children:
        child.select_set(True)
        _select_descendants(child)


def _bounds(obj: bpy.types.Object) -> dict[str, Vector]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    bbox_min = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    bbox_max = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return {"min": bbox_min, "max": bbox_max, "center": (bbox_min + bbox_max) * 0.5, "size": bbox_max - bbox_min}


def _stable_name(value: str) -> str:
    cleaned = "".join(char.upper() if char.isalnum() else "_" for char in value)
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned.strip("_") or "NODE"


def _semantic_part_name(source_name: str, category: str, bounds: dict[str, Vector], material_names: list[str]) -> str:
    if source_name in SOURCE_SEMANTIC_NAMES:
        return SOURCE_SEMANTIC_NAMES[source_name]
    materials = set(material_names)
    center = bounds["center"]
    size = bounds["size"]
    if category == "displays":
        if center.y < -4.0:
            if center.x < -0.2:
                return "CAPTAIN_DISPLAY_OR_PANEL_FACE"
            if center.x > 0.2:
                return "FIRST_OFFICER_DISPLAY_OR_PANEL_FACE"
            return "CENTER_DISPLAY_OR_PANEL_FACE"
        return "DISPLAY_INDICATOR_OR_LABEL"
    if category == "interactive":
        if max(size.x, size.y, size.z) > 0.20:
            return "PEDESTAL_OR_PANEL_CONTROL_CLUSTER"
        return "SWITCH_KNOB_BUTTON_OR_ANNUNCIATOR"
    if "m0mat_006" in materials and size.z < 0.02:
        return "COCKPIT_FLOOR_CARPET"
    if "m0mat_008" in materials and center.y < -3.5:
        return "SEAT_OR_SIDE_CONSOLE_STRUCTURE"
    if "m0mat_010" in materials and center.y < -4.0:
        return "FORWARD_PANEL_OR_EXTERIOR_TRIM"
    return _stable_name(source_name)


def _runtime_node(name: str, game_id: str, pivot_verified: bool, local_axis: str, html_equivalent: str) -> dict[str, object]:
    return {
        "name": name,
        "gameId": game_id,
        "pivotVerified": pivot_verified,
        "localAxis": local_axis,
        "htmlEquivalent": html_equivalent,
    }


def _vector_list(vector: Vector) -> list[float]:
    return [round(float(vector.x), 6), round(float(vector.y), 6), round(float(vector.z), 6)]


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
    return sys.argv[sys.argv.index("--") + 1 :]


if __name__ == "__main__":
    main()
