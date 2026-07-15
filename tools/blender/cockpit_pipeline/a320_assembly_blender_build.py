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
    "Object_128.001",
    "Object_129",
    "Object_130",
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

A320_LABEL_TARGETS = {
    "sidestick": {
        "label": "Sidestick",
        "pivotName": "AIRBUS_A320_TARGET_SIDESTICK_PIVOT",
        "colliderName": "AIRBUS_A320_TARGET_SIDESTICK_HITBOX",
        "cueName": "AIRBUS_A320_TARGET_SIDESTICK_CUE",
        "gameId": "airbus.a320.target.sidestick",
        "location": (-0.224475, -0.453081, 0.045670),
        "size": (0.055, 0.060, 0.090),
        "cueSize": (0.035, 0.012, 0.050),
        "cueShape": "sidestick_silhouette",
        "rotationAxis": "LOCAL_X",
        "activeAngle": 0.08,
    },
    "thrust": {
        "label": "Thrust levers",
        "pivotName": "AIRBUS_A320_TARGET_THRUST_PIVOT",
        "colliderName": "AIRBUS_A320_TARGET_THRUST_HITBOX",
        "cueName": "AIRBUS_A320_TARGET_THRUST_CUE",
        "gameId": "airbus.a320.target.thrust",
        "location": (-0.045001, -0.505764, -0.003234),
        "size": (0.095, 0.080, 0.070),
        "cueSize": (0.070, 0.012, 0.045),
        "cueShape": "thrust_silhouette",
        "rotationAxis": "LOCAL_X",
        "activeAngle": 0.06,
    },
    "gear": {
        "label": "Landing gear lever",
        "pivotName": "AIRBUS_A320_TARGET_GEAR_PIVOT",
        "colliderName": "AIRBUS_A320_TARGET_GEAR_HITBOX",
        "cueName": "AIRBUS_A320_TARGET_GEAR_CUE",
        "gameId": "airbus.a320.target.gear",
        "location": (0.038089, -0.445134, 0.065232),
        "size": (0.040, 0.060, 0.080),
        "cueSize": (0.025, 0.012, 0.045),
        "cueShape": "gear_silhouette",
        "rotationAxis": "LOCAL_X",
        "activeAngle": 0.07,
    },
    "radio": {
        "label": "Radio panel",
        "pivotName": "AIRBUS_A320_TARGET_RADIO_PIVOT",
        "colliderName": "AIRBUS_A320_TARGET_RADIO_HITBOX",
        "cueName": "AIRBUS_A320_TARGET_RADIO_CUE",
        "gameId": "airbus.a320.target.radio",
        "location": (0.026205, -0.474842, -0.008202),
        "size": (0.085, 0.060, 0.060),
        "cueSize": (0.065, 0.012, 0.040),
        "cueShape": "planar_border",
        "rotationAxis": "LOCAL_X",
        "activeAngle": 0.06,
    },
    "altitude": {
        "label": "Altitude area",
        "pivotName": "AIRBUS_A320_TARGET_ALTITUDE_PIVOT",
        "colliderName": "AIRBUS_A320_TARGET_ALTITUDE_HITBOX",
        "cueName": "AIRBUS_A320_TARGET_ALTITUDE_CUE",
        "gameId": "airbus.a320.target.altitude",
        "location": (0.034663, -0.462432, 0.142783),
        "size": (0.110, 0.050, 0.040),
        "cueSize": (0.075, 0.012, 0.018),
        "cueShape": "planar_border",
        "rotationAxis": "LOCAL_X",
        "activeAngle": 0.045,
    },
}

TARGET_VISUAL_ALIGNMENT_STATUS = "pending_browser_1440_captain"


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
    root["scene_group"] = "Airbus A320 Pop T Captain cockpit"
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
    target_reports = _add_label_targets(groups["colliders"])

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
        "preservedInteriorSizedObjects": sorted(["Object_55", "Object_56", "Object_67"]),
        "meshReports": mesh_reports,
        "runtimeNodeNames": sorted(obj.name for obj in bpy.context.scene.objects),
        "labelTargetReports": target_reports,
        "pivotNotes": [
            {
                "node": root.name,
                "pivotVerified": False,
                "notes": "Imported source geometry uses generic Sketchfab pivots. Agent 2 created stable grouping roots and locators; individual control pivots require a later focused pass before interaction."
            },
            *[
                {
                    "node": report["pivotNodeName"],
                    "pivotVerified": True,
                    "pivotExportVerified": True,
                    "visualAlignmentStatus": report["visualAlignmentStatus"],
                    "controlId": report["controlId"],
                    "localAxis": report["rotationAxis"],
                    "notes": "Runtime pivot, collider, and cue node coordinates survived export/reimport. This does not by itself verify browser visual alignment.",
                }
                for report in target_reports
            ],
        ],
    }
    node_report_path.write_text(json.dumps(node_report, indent=2) + "\n", encoding="utf-8")

    contract_summary = {
        "rootObject": root.name,
        "sceneGroup": "Airbus A320 Pop T Captain cockpit",
        "assetPath": glb_path.as_posix(),
        "runtimeNodes": [
            _runtime_node(root.name, "airbus.a320.root", False, "GROUP_ROOT", "Scene container; no direct HTML control."),
            _runtime_node(groups["static"].name, "airbus.a320.static", False, "GROUP_ROOT", "Static cockpit geometry; no direct HTML control."),
            _runtime_node(groups["displays"].name, "airbus.a320.displays", False, "GROUP_ROOT", "Display inspection candidate; future HTML panel mirror required if interactive."),
            _runtime_node(groups["interactive"].name, "airbus.a320.interactive", False, "GROUP_ROOT", "Interactive candidate group; controls require later pivot-specific HTML equivalents."),
            _runtime_node("AIRBUS_A320_LOC_CAPTAIN_EYE", "airbus.a320.locator.captain_eye", True, "WORLD", "Camera locator; no direct HTML control."),
            _runtime_node("AIRBUS_A320_LOC_DASHBOARD_FOCUS", "airbus.a320.locator.dashboard_focus", True, "WORLD", "Camera target locator; no direct HTML control."),
            _runtime_node("AIRBUS_A320_LOC_INTERIOR_360_CENTER", "airbus.a320.locator.interior_360_center", True, "WORLD", "Interior scan locator between the cockpit seats; no direct HTML control."),
            *[
                node
                for report in target_reports
                for node in (
                    _runtime_node(
                        report["pivotNodeName"],
                        report["gameId"],
                        True,
                        report["rotationAxis"],
                        f"{report['label']} target button in the Airbus placement layer.",
                        node_role="pivot",
                        visual_alignment_status=report["visualAlignmentStatus"],
                    ),
                    _runtime_node(
                        report["colliderNodeName"],
                        f"{report['gameId']}.hitbox",
                        True,
                        report["rotationAxis"],
                        f"{report['label']} target button in the Airbus placement layer.",
                        node_role="collider",
                        visual_alignment_status=report["visualAlignmentStatus"],
                    ),
                    _runtime_node(
                        report["cueNodeName"],
                        f"{report['gameId']}.cue",
                        True,
                        report["rotationAxis"],
                        f"{report['label']} target button in the Airbus placement layer.",
                        node_role="cue",
                        visual_alignment_status=report["visualAlignmentStatus"],
                    ),
                )
            ],
        ],
    }
    runtime_contract_summary_path.write_text(json.dumps(contract_summary, indent=2) + "\n", encoding="utf-8")

    assembly_stats = _assembly_stats(root.name, groups, mesh_reports, target_reports)
    reimport = _reimport_validation(glb_path, target_reports)
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


def _add_label_targets(parent: bpy.types.Object) -> list[dict[str, object]]:
    material = _transparent_collider_material()
    reports = []
    for control_id, target in A320_LABEL_TARGETS.items():
        pivot = bpy.data.objects.new(target["pivotName"], None)
        bpy.context.collection.objects.link(pivot)
        pivot.parent = parent
        pivot.location = target["location"]
        pivot.empty_display_type = "PLAIN_AXES"
        pivot.empty_display_size = 0.035
        pivot["game_id"] = target["gameId"]
        pivot["control_id"] = control_id
        pivot["interaction"] = "label_target"
        pivot["puzzle_id"] = "airbus"
        pivot["rotation_axis"] = target["rotationAxis"]
        pivot["rest_angle"] = 0.0
        pivot["active_angle"] = target["activeAngle"]
        pivot["pivotVerified"] = True
        pivot["pivotExportVerified"] = True
        pivot["visual_alignment_status"] = TARGET_VISUAL_ALIGNMENT_STATUS
        pivot["coordinate_source"] = "1440x900 captain gameplay camera mirror calibration"
        pivot["htmlEquivalent"] = f"{target['label']} target button in the Airbus placement layer."

        collider = _create_box_mesh(target["colliderName"], target["size"])
        bpy.context.collection.objects.link(collider)
        collider.parent = pivot
        collider.location = (0, 0, 0)
        collider.data.materials.append(material)
        collider.display_type = "WIRE"
        collider.show_transparent = True
        collider["game_id"] = f"{target['gameId']}.hitbox"
        collider["target_game_id"] = target["gameId"]
        collider["control_id"] = control_id
        collider["interaction"] = "label_target"
        collider["puzzle_id"] = "airbus"
        collider["rotation_axis"] = target["rotationAxis"]
        collider["rest_angle"] = 0.0
        collider["active_angle"] = target["activeAngle"]
        collider["pivotVerified"] = True
        collider["pivotExportVerified"] = True
        collider["visual_alignment_status"] = TARGET_VISUAL_ALIGNMENT_STATUS
        collider["colliderOnly"] = True
        collider["htmlEquivalent"] = f"{target['label']} target button in the Airbus placement layer."

        cue = _create_cue_mesh(target["cueName"], target["cueSize"], target["cueShape"])
        bpy.context.collection.objects.link(cue)
        cue.parent = pivot
        cue.location = (0, 0, 0)
        cue.data.materials.append(material)
        cue.display_type = "WIRE"
        cue.show_transparent = True
        cue["game_id"] = f"{target['gameId']}.cue"
        cue["target_game_id"] = target["gameId"]
        cue["control_id"] = control_id
        cue["interaction"] = "label_target_cue"
        cue["puzzle_id"] = "airbus"
        cue["cueOnly"] = True
        cue["cue_shape"] = target["cueShape"]
        cue["pivotExportVerified"] = True
        cue["visual_alignment_status"] = TARGET_VISUAL_ALIGNMENT_STATUS
        cue["htmlEquivalent"] = f"{target['label']} target button in the Airbus placement layer."

        reports.append({
            "controlId": control_id,
            "label": target["label"],
            "gameId": target["gameId"],
            "pivotNodeName": pivot.name,
            "colliderNodeName": collider.name,
            "cueNodeName": cue.name,
            "location": [round(value, 6) for value in target["location"]],
            "runtimeLocation": [
                round(target["location"][0], 6),
                round(target["location"][2], 6),
                round(-target["location"][1], 6),
            ],
            "size": [round(value, 6) for value in target["size"]],
            "cueSize": [round(value, 6) for value in target["cueSize"]],
            "cueShape": target["cueShape"],
            "rotationAxis": target["rotationAxis"],
            "restAngle": 0.0,
            "activeAngle": target["activeAngle"],
            "pivotVerified": True,
            "pivotExportVerified": True,
            "visualAlignmentStatus": TARGET_VISUAL_ALIGNMENT_STATUS,
            "htmlEquivalent": f"{target['label']} target button in the Airbus placement layer.",
            "notes": "Pivot, invisible collider, and cue proxy are export-verified. Visual alignment remains a separate browser gate until measured screenshots are approved.",
        })
    return reports


def _transparent_collider_material() -> bpy.types.Material:
    material = bpy.data.materials.new("AIRBUS_A320_INVISIBLE_TARGET_COLLIDER")
    material.diffuse_color = (0.0, 0.8, 1.0, 0.0)
    material.use_nodes = True
    material.blend_method = "BLEND"
    if hasattr(material, "use_screen_refraction"):
        material.use_screen_refraction = False
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = 0.0
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = (0.0, 0.8, 1.0, 0.0)
    return material


def _create_box_mesh(name: str, size: tuple[float, float, float]) -> bpy.types.Object:
    x, y, z = (axis * 0.5 for axis in size)
    vertices = [
        (-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
        (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z),
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    mesh.uv_layers.new(name="UVMap")
    return bpy.data.objects.new(name, mesh)


def _create_cue_mesh(name: str, size: tuple[float, float, float], cue_shape: str) -> bpy.types.Object:
    if cue_shape == "planar_border":
        return _create_box_mesh(name, size)

    profiles = {
        "sidestick_silhouette": [
            (-0.46, -0.50), (0.46, -0.50), (0.36, -0.28), (0.18, -0.10),
            (0.12, 0.22), (0.31, 0.34), (0.18, 0.50), (-0.05, 0.42),
            (-0.13, 0.14), (-0.28, -0.08),
        ],
        "thrust_silhouette": [
            (-0.50, -0.50), (0.50, -0.50), (0.43, 0.10), (0.25, 0.12),
            (0.21, 0.50), (0.02, 0.50), (-0.02, 0.12), (-0.20, 0.12),
            (-0.24, 0.50), (-0.43, 0.50),
        ],
        "gear_silhouette": [
            (-0.34, -0.50), (0.34, -0.50), (0.20, 0.17), (0.42, 0.26),
            (0.34, 0.48), (-0.34, 0.48), (-0.42, 0.26), (-0.20, 0.17),
        ],
    }
    profile = profiles.get(cue_shape)
    if profile is None:
        raise RuntimeError(f"Unknown A320 cue shape: {cue_shape}")
    return _create_extruded_profile_mesh(name, size, profile)


def _create_extruded_profile_mesh(
    name: str,
    size: tuple[float, float, float],
    profile: list[tuple[float, float]],
) -> bpy.types.Object:
    width, depth, height = size
    half_depth = depth * 0.5
    vertices = [
        (x * width, -half_depth, z * height) for x, z in profile
    ] + [
        (x * width, half_depth, z * height) for x, z in profile
    ]
    count = len(profile)
    faces = [
        tuple(range(count)),
        tuple(reversed(range(count, count * 2))),
    ]
    for index in range(count):
        next_index = (index + 1) % count
        faces.append((index, next_index, count + next_index, count + index))
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    return bpy.data.objects.new(name, mesh)


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


def _assembly_stats(root_name: str, groups: dict[str, bpy.types.Object], mesh_reports: list[dict[str, object]], target_reports: list[dict[str, object]]) -> dict[str, object]:
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
        "labelTargetCount": len(target_reports),
        "labelTargetPivotVerifiedCount": len([item for item in target_reports if item["pivotVerified"]]),
        "labelTargetCoordinateExportVerifiedCount": len([item for item in target_reports if item["pivotExportVerified"]]),
        "labelTargetVisualVerifiedCount": len([
            item for item in target_reports if str(item["visualAlignmentStatus"]).startswith("verified_")
        ]),
        "labelTargetVisualAlignmentStatuses": sorted({str(item["visualAlignmentStatus"]) for item in target_reports}),
        "pivotVerifiedCount": len([item for item in mesh_reports if item["pivotVerified"]]) + len([item for item in target_reports if item["pivotVerified"]]),
    }


def _validate_scene(assembly_stats: dict[str, object], reimport: dict[str, object]) -> dict[str, object]:
    duplicates = assembly_stats["duplicateRuntimeNodeNames"]
    group_failures = assembly_stats["groupMetadataFailures"]
    mesh_report_count = assembly_stats["meshReportCount"]
    target_count = assembly_stats["labelTargetCount"]
    verified_target_count = assembly_stats["labelTargetPivotVerifiedCount"]
    status = "pass" if not duplicates and not group_failures and mesh_report_count > 0 and target_count == 5 and verified_target_count == 5 and reimport["status"] == "pass" else "fail"
    return {
        "status": status,
        **assembly_stats,
        "visualAlignmentValidation": {
            "status": "not-verified" if assembly_stats["labelTargetVisualVerifiedCount"] < 5 else "verified",
            "notes": "GLB export/reimport validation proves node and metadata survival only. Browser screenshots and measured cue/control rectangles are required for visual alignment.",
        },
        "reimportValidation": reimport,
    }


def _reimport_validation(glb_path: Path, target_reports: list[dict[str, object]]) -> dict[str, object]:
    _reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    names = {obj.name for obj in bpy.context.scene.objects}
    mesh_count = len([obj for obj in bpy.context.scene.objects if obj.type == "MESH"])
    target_nodes = (
        [item["pivotNodeName"] for item in target_reports]
        + [item["colliderNodeName"] for item in target_reports]
        + [item["cueNodeName"] for item in target_reports]
    )
    missing_target_nodes = sorted(name for name in target_nodes if name not in names)
    target_metadata_failures = []
    for item in target_reports:
        pivot = bpy.data.objects.get(item["pivotNodeName"])
        collider = bpy.data.objects.get(item["colliderNodeName"])
        cue = bpy.data.objects.get(item["cueNodeName"])
        for obj in (pivot, collider, cue):
            if obj is None:
                continue
            valid_interaction = obj.get("interaction") in {"label_target", "label_target_cue"}
            valid_visual_status = obj.get("visual_alignment_status") == item["visualAlignmentStatus"]
            if obj.get("control_id") != item["controlId"] or not valid_interaction or not valid_visual_status:
                target_metadata_failures.append(obj.name)
    return {
        "status": "pass" if "AIRBUS_ROOT" in names and mesh_count > 0 and not missing_target_nodes and not target_metadata_failures else "fail",
        "rootFound": "AIRBUS_ROOT" in names,
        "objectCount": len(bpy.context.scene.objects),
        "meshCount": mesh_count,
        "missingTargetNodes": missing_target_nodes,
        "targetMetadataFailures": sorted(target_metadata_failures),
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


def _runtime_node(
    name: str,
    game_id: str,
    pivot_verified: bool,
    local_axis: str,
    html_equivalent: str,
    node_role: str | None = None,
    visual_alignment_status: str | None = None,
) -> dict[str, object]:
    node = {
        "name": name,
        "gameId": game_id,
        "pivotVerified": pivot_verified,
        "pivotExportVerified": pivot_verified,
        "localAxis": local_axis,
        "htmlEquivalent": html_equivalent,
    }
    if node_role:
        node["nodeRole"] = node_role
    if visual_alignment_status:
        node["visualAlignmentStatus"] = visual_alignment_status
    return node


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
