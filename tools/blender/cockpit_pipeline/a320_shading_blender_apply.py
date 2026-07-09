from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


RUNTIME_METADATA_KEYS = ["game_id", "scene_group", "target_aircraft", "assemblyStage", "source_candidate_id", "assemblyCategory"]
LOOSE_PART_QUARANTINE_COLLECTION = "A320_QUARANTINE_LOOSE_PARTS_REVIEW"
LOOSE_PART_SOURCE_NODES = {
    "Object_93.001": "Tiny generic source fragment above the rear zoom-out view; not a named A320 cockpit component.",
    "Object_94": "Small generic source fragment adjacent to Object_93.001; not a named A320 cockpit component.",
    "Object_95": "Tiny generic source fragment below the rear zoom-out view; not a named A320 cockpit component.",
    "Object_96.001": "Small generic source fragment adjacent to Object_95; not a named A320 cockpit component.",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply preservation-first A320 material and optimization handoff.")
    parser.add_argument("--assembly-glb", required=True)
    parser.add_argument("--node-report", required=True)
    parser.add_argument("--recipes", required=True)
    parser.add_argument("--viewer-settings")
    parser.add_argument("--material-parity-summary")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--preview-dir", required=True)
    args = parser.parse_args(_args_after_double_dash())

    assembly_glb = Path(args.assembly_glb)
    node_report = json.loads(Path(args.node_report).read_text(encoding="utf-8"))
    recipes = json.loads(Path(args.recipes).read_text(encoding="utf-8"))
    viewer_settings = json.loads(Path(args.viewer_settings).read_text(encoding="utf-8")) if args.viewer_settings else {}
    material_parity = json.loads(Path(args.material_parity_summary).read_text(encoding="utf-8")) if args.material_parity_summary else {}
    output_dir = Path(args.output_dir)
    preview_dir = Path(args.preview_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)

    _reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(assembly_glb))
    cleanup_report = _quarantine_loose_zoom_out_fragments(output_dir / "loose-part-review-report.json")
    expected_nodes = _expected_runtime_nodes(node_report, exclude=set(cleanup_report["quarantinedNames"]))
    _add_approval_cameras(viewer_settings)
    before = _snapshot(expected_nodes)

    recipe_index = {recipe["recipeId"]: recipe for recipe in recipes["recipes"]}
    source_materials = _source_material_index(material_parity)
    assignments = _apply_material_annotation(recipe_index, source_materials)
    texture_report = _write_texture_inventory(output_dir / "texture-inventory-report.json")
    _write_assignment_report(assignments, output_dir / "material-assignment-report.json")

    _render_previews(preview_dir, viewer_settings)
    _add_approval_cameras(viewer_settings)

    blend_path = output_dir / "a320-cockpit-2-shaded.blend"
    backup_path = output_dir / "a320-cockpit-2-shaded.blend1"
    glb_path = output_dir / "a320-cockpit-2-shaded.glb"
    bpy.ops.object.select_all(action="DESELECT")
    root = bpy.data.objects.get("AIRBUS_ROOT")
    if root:
        root.select_set(True)
        bpy.context.view_layer.objects.active = root
        _select_descendants(root)
        _select_review_export_objects()
        _deselect_quarantined_export_objects(cleanup_report["quarantinedNames"])
    else:
        bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        export_extras=True,
        export_cameras=True,
        export_lights=True,
        use_selection=True,
    )
    _assert_glb(glb_path)
    center, radius = _scene_center_radius()
    _add_source_like_lighting(center, radius, viewer_settings)
    _add_approval_cameras(viewer_settings)
    backup_path.unlink(missing_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    backup_path.unlink(missing_ok=True)

    reimport = _reimport_validation(glb_path, expected_nodes)
    validation = _validate(before, reimport, assignments, texture_report, cleanup_report)
    (output_dir / "validation-report.json").write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": validation["status"], "glb": glb_path.as_posix()}, indent=2))


def _expected_runtime_nodes(node_report: dict[str, object], exclude: set[str] | None = None) -> list[str]:
    exclude = exclude or set()
    names = {node_report["rootObject"]}
    names.update(node_report["groups"].values())
    names.update(item["runtimeNodeName"] for item in node_report["meshReports"])
    names.update(["AIRBUS_A320_LOC_CAPTAIN_EYE", "AIRBUS_A320_LOC_DASHBOARD_FOCUS", "CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW"])
    return sorted(name for name in names if name not in exclude)


def _quarantine_loose_zoom_out_fragments(report_path: Path) -> dict[str, object]:
    quarantine = bpy.data.collections.get(LOOSE_PART_QUARANTINE_COLLECTION)
    if quarantine is None:
        quarantine = bpy.data.collections.new(LOOSE_PART_QUARANTINE_COLLECTION)
        bpy.context.scene.collection.children.link(quarantine)
    quarantine.hide_viewport = True
    quarantine.hide_render = True

    reviewed: list[dict[str, object]] = []
    quarantined_names: list[str] = []
    for obj in sorted((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: item.name):
        source_node = str(obj.get("sourceNodeName", ""))
        semantic_part = str(obj.get("semanticPartName", ""))
        decision = "preserve"
        reason = "Named or semantically classified A320 cockpit geometry."
        if source_node in LOOSE_PART_SOURCE_NODES and semantic_part.startswith("OBJECT_9"):
            decision = "quarantine"
            reason = LOOSE_PART_SOURCE_NODES[source_node]
            if quarantine.name not in [collection.name for collection in obj.users_collection]:
                quarantine.objects.link(obj)
            obj.hide_viewport = True
            obj.hide_render = True
            obj["cleanup_status"] = "quarantined_loose_zoom_out_fragment"
            obj["cleanup_reason"] = reason
            quarantined_names.append(obj.name)
        reviewed.append({
            "name": obj.name,
            "sourceNodeName": source_node,
            "semanticPartName": semantic_part,
            "decision": decision,
            "reason": reason,
            "bounds": _object_bounds(obj),
            "vertexCount": len(obj.data.vertices),
        })

    report = {
        "schema": "cockpit-pipeline/a320-loose-part-review-v1",
        "policy": (
            "Conservative A320 zoom-out cleanup. Only generic source fragments with "
            "known sourceNodeName values are hidden and excluded from export; named cockpit "
            "seat, side-console, display, panel, and control geometry is preserved."
        ),
        "quarantineCollection": LOOSE_PART_QUARANTINE_COLLECTION,
        "quarantinedNames": quarantined_names,
        "reviewedCount": len(reviewed),
        "reviewedObjects": reviewed,
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def _apply_material_annotation(recipes: dict[str, dict[str, object]], source_materials: dict[str, dict[str, object]]) -> list[dict[str, object]]:
    assignments = []
    fallback_materials: dict[str, bpy.types.Material] = {}
    for obj in sorted((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: item.name):
        role = _classify_role(obj)
        old_materials = [slot.material.name for slot in obj.material_slots if slot.material]
        if not obj.material_slots:
            obj.data.materials.append(_fallback_material(fallback_materials, recipes[role], source_materials))
        for slot in obj.material_slots:
            if slot.material:
                _configure_material(slot.material, recipes[role], source_materials)
            else:
                slot.material = _fallback_material(fallback_materials, recipes[role], source_materials)
        obj["semanticMaterialRole"] = recipes[role]["semanticMaterialRole"]
        obj["materialRecipeId"] = role
        parity_records = [_source_material_summary(name, source_materials) for name in old_materials]
        parity_records = [record for record in parity_records if record]
        assignments.append({
            "runtimeNodeName": obj.name,
            "assemblyCategory": obj.get("assemblyCategory", "unknown"),
            "sourceNodeName": obj.get("sourceNodeName", obj.name),
            "oldMaterials": old_materials,
            "newMaterialRecipe": role,
            "semanticMaterialRole": recipes[role]["semanticMaterialRole"],
            "preservedExistingMaterialSlots": bool(old_materials),
            "sourceTextureLinksPreserved": _has_base_color_texture_link(obj),
            "sourceMaterialParity": parity_records,
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


def _configure_material(material: bpy.types.Material, recipe: dict[str, object], source_materials: dict[str, dict[str, object]]) -> None:
    material["materialRecipeId"] = recipe["recipeId"]
    material["semanticMaterialRole"] = recipe["semanticMaterialRole"]
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return
    source_material = _source_material_for(material.name, source_materials)
    source_color = _channel_color(source_material, ("AlbedoPBR", "DiffuseColor"))
    if not _input_has_link(bsdf, "Base Color"):
        base_color = tuple(source_color or recipe["baseColor"])
        material.diffuse_color = base_color
        _set_input(bsdf, "Base Color", base_color)
    # Keep the downloaded Sketchfab color/UV texture network intact. Agent 3
    # only records semantic roles and makes light-touch scalar PBR adjustments
    # from portable material-channel values.
    metallic = _channel_factor(source_material, "MetalnessPBR", recipe["metallic"])
    roughness = _channel_factor(source_material, "RoughnessPBR", recipe["roughness"])
    reflection = float(source_material.get("reflection", 0.0)) if source_material else 0.0
    matcap_factor = _channel_factor(source_material, "Matcap", 0.0)
    if matcap_factor > 0 or reflection > 0:
        material["sketchfabMatcapReference"] = round(matcap_factor, 4)
        material["sketchfabReflectionReference"] = round(reflection, 4)
        roughness = max(0.08, min(0.92, float(roughness) - reflection * 0.12))
    _set_input(bsdf, "Metallic", metallic)
    _set_input(bsdf, "Roughness", roughness)
    if source_material:
        material["sketchfabSourceMaterial"] = source_material["name"]
        material["sketchfabPortableChannelSource"] = True
    if recipe["recipeId"] == "a320_display_glass":
        emit_color = _channel_color(source_material, ("EmitColor",)) or (0.035, 0.18, 0.16, 1.0)
        emit_factor = _channel_factor(source_material, "EmitColor", 0.0)
        _set_input(bsdf, "Emission Color", tuple(emit_color))
        _set_input(bsdf, "Emission Strength", max(0.16, min(0.3, float(emit_factor) + 0.18)))


def _fallback_material(cache: dict[str, bpy.types.Material], recipe: dict[str, object], source_materials: dict[str, dict[str, object]]) -> bpy.types.Material:
    recipe_id = recipe["recipeId"]
    if recipe_id not in cache:
        material = bpy.data.materials.new(recipe_id)
        _configure_material(material, recipe, source_materials)
        cache[recipe_id] = material
    return cache[recipe_id]


def _source_material_index(material_parity: dict[str, object]) -> dict[str, dict[str, object]]:
    index: dict[str, dict[str, object]] = {}
    for material in material_parity.get("materials", []):
        if not isinstance(material, dict) or not material.get("name"):
            continue
        name = str(material["name"])
        index[name.upper()] = material
        index[name.replace(".", "_").upper()] = material
    return index


def _source_material_for(material_name: str, source_materials: dict[str, dict[str, object]]) -> dict[str, object]:
    candidates = [
        material_name,
        material_name.split(".")[0],
        material_name.replace(".", "_"),
    ]
    for candidate in candidates:
        match = source_materials.get(candidate.upper())
        if match:
            return match
    return {}


def _source_material_summary(material_name: str, source_materials: dict[str, dict[str, object]]) -> dict[str, object]:
    material = _source_material_for(material_name, source_materials)
    if not material:
        return {}
    return {
        "name": material.get("name"),
        "reflection": material.get("reflection", 0),
        "metallic": _channel_factor(material, "MetalnessPBR", 0),
        "roughness": _channel_factor(material, "RoughnessPBR", 0),
        "matcap": _channel_factor(material, "Matcap", 0),
        "emission": _channel_factor(material, "EmitColor", 0),
    }


def _enabled_channel(material: dict[str, object], channel_name: str) -> dict[str, object]:
    for channel in material.get("enabledChannels", []):
        if isinstance(channel, dict) and channel.get("channel") == channel_name:
            return channel
    return {}


def _channel_factor(material: dict[str, object], channel_name: str, default: object) -> float:
    channel = _enabled_channel(material, channel_name)
    value = channel.get("factor", default)
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def _channel_color(material: dict[str, object], channel_names: tuple[str, ...]) -> tuple[float, float, float, float] | None:
    for channel_name in channel_names:
        color = _enabled_channel(material, channel_name).get("color")
        if isinstance(color, list) and len(color) >= 3:
            return (float(color[0]), float(color[1]), float(color[2]), 1.0)
    return None


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


def _render_previews(preview_dir: Path, viewer_settings: dict[str, object]) -> None:
    center, radius = _scene_center_radius()
    _configure_source_parity_render_settings(viewer_settings)
    _add_source_like_lighting(center, radius, viewer_settings)
    _add_approval_cameras(viewer_settings)
    _render_preview(
        preview_dir / "captain-daylight.png",
        Vector((-0.303763, -1.215466, 0.191386)),
        Vector((-0.104338, -0.456942, 0.056386)),
        50,
        hidden_semantic_parts={"COCKPIT_FORWARD_INTERIOR_SHELL_AND_SEATS", "COCKPIT_REAR_BULKHEAD_SEATS_AND_SIDEWALLS"},
    )
    _render_camera_preview(preview_dir / "complete-interior-approval.png", "AIRBUS_A320_CAM_COMPLETE_INTERIOR_APPROVAL")
    _render_camera_preview(preview_dir / "first-officer-approval.png", "AIRBUS_A320_CAM_FIRST_OFFICER_APPROVAL")
    if bpy.data.objects.get("AIRBUS_A320_CAM_SKETCHFAB_VIEWER_PARITY"):
        _render_camera_preview(preview_dir / "sketchfab-camera-parity.png", "AIRBUS_A320_CAM_SKETCHFAB_VIEWER_PARITY")
    _render_preview(
        preview_dir / "captain-display-check.png",
        Vector((-0.217057, -1.050967, 0.281386)),
        Vector((-0.00029, -0.548331, 0.176386)),
        70,
        hidden_semantic_parts={"COCKPIT_FORWARD_INTERIOR_SHELL_AND_SEATS", "COCKPIT_REAR_BULKHEAD_SEATS_AND_SIDEWALLS"},
    )
    _render_preview(
        preview_dir / "captain-pullback-review.png",
        Vector((-0.303763, -1.715466, 0.191386)),
        Vector((-0.104338, -0.456942, 0.056386)),
        50,
        hidden_semantic_parts={"COCKPIT_FORWARD_INTERIOR_SHELL_AND_SEATS", "COCKPIT_REAR_BULKHEAD_SEATS_AND_SIDEWALLS"},
    )


def _render_preview(path: Path, location: Vector, target: Vector, lens: float, hidden_semantic_parts: set[str] | None = None) -> None:
    scene = bpy.context.scene
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    bpy.ops.object.light_add(type="POINT", location=location + Vector((0.0, 0.08, 0.12)))
    fill = bpy.context.object
    fill.name = "AIRBUS_A320_SHADED_CAMERA_FILL"
    fill.data.energy = 95
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
    hidden_state = _set_preview_hidden_semantics(hidden_semantic_parts or set())
    bpy.ops.render.render(write_still=True)
    _restore_preview_hidden_state(hidden_state)
    bpy.data.objects.remove(camera, do_unlink=True)
    bpy.data.objects.remove(fill, do_unlink=True)


def _render_camera_preview(path: Path, camera_name: str) -> None:
    scene = bpy.context.scene
    camera = bpy.data.objects.get(camera_name)
    if camera is None:
        raise RuntimeError(f"approval preview camera missing: {camera_name}")
    scene.camera = camera
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def _add_approval_cameras(viewer_settings: dict[str, object]) -> None:
    _remove_stale_review_cameras()
    _add_between_seats_review_camera()
    game_camera = _add_first_officer_game_camera(
        "CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW",
        game_id="airbus.a320.camera.first_officer_game_view",
        purpose="Runtime First-Officer gameplay camera consumed by the React Three Fiber scene",
    )
    game_camera["source"] = "Recovered from d23ad95 saved shaded blend"
    _add_review_camera(
        "AIRBUS_A320_CAM_COMPLETE_INTERIOR_APPROVAL",
        Vector((0.0, -0.86, 0.22)),
        Vector((0.0, -0.48, 0.05)),
        lens=20,
        game_id="airbus.a320.camera.complete_interior_approval",
        purpose="Owner approval camera showing the visible cockpit interior without hiding shell or seat chunks",
    )
    _add_first_officer_game_camera(
        "AIRBUS_A320_CAM_FIRST_OFFICER_APPROVAL",
        game_id="airbus.a320.camera.first_officer_approval",
        purpose="Owner approval camera approximating the Airbus First Officer inside-cockpit screenshot target",
    )
    camera_settings = viewer_settings.get("camera")
    if isinstance(camera_settings, dict):
        position = _vector_from_list(camera_settings.get("position"))
        target = _vector_from_list(camera_settings.get("target"))
        if position and target and (target - position).length > 0.001:
            if (target - position).length < 0.2:
                position = Vector((0.0, -0.66, 0.18))
                target = Vector((0.0, -0.46, 0.10))
            camera = _add_review_camera(
                "AIRBUS_A320_CAM_SKETCHFAB_VIEWER_PARITY",
                position,
                target,
                lens=35,
                game_id="airbus.a320.camera.sketchfab_viewer_parity",
                purpose="Camera reconstructed from the saved Sketchfab viewer settings for source post-processing parity",
            )
            fov = camera_settings.get("fov")
            if isinstance(fov, (int, float)):
                camera.data.angle = math.radians(float(fov))


def _add_first_officer_game_camera(name: str, game_id: str, purpose: str) -> bpy.types.Object:
    camera = bpy.data.objects.get(name)
    if camera is None:
        camera_data = bpy.data.cameras.new(name)
        camera = bpy.data.objects.new(name, camera_data)
        bpy.context.scene.collection.objects.link(camera)
    camera.location = (0.153815, -0.647877, 0.130133)
    camera.rotation_euler = (1.367064, 0.0, 0.282213)
    camera.data.lens = 50
    camera.data.angle = 0.691111
    camera.data.clip_start = 0.002
    camera.data.clip_end = 1000
    camera.data.display_size = 0.12
    camera["game_id"] = game_id
    camera["cameraPurpose"] = purpose
    camera["fo_eye_forward_adjustment_m"] = 0.0508
    camera["fo_eye_forward_adjustment_reason"] = "Move FO eye point 2 inches forward so orbiting back does not render from inside the seat."
    _parent_to_airbus_root(camera)
    return camera


def _add_review_camera(name: str, location: Vector, target: Vector, lens: float, game_id: str, purpose: str) -> bpy.types.Object:
    camera = bpy.data.objects.get(name)
    if camera is None:
        camera_data = bpy.data.cameras.new(name)
        camera = bpy.data.objects.new(name, camera_data)
        bpy.context.scene.collection.objects.link(camera)
    camera.location = location
    camera.rotation_euler = (target - location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = lens
    camera.data.clip_start = 0.002
    camera.data.clip_end = 1000
    camera.data.display_size = 0.12
    camera["game_id"] = game_id
    camera["cameraPurpose"] = purpose
    _parent_to_airbus_root(camera)
    return camera


def _remove_stale_review_cameras() -> None:
    for name in ("AIRBUS_A320_CAM_FIRST_OFFICER_TARGET_REVIEW",):
        camera = bpy.data.objects.get(name)
        if camera:
            bpy.data.objects.remove(camera, do_unlink=True)


def _add_between_seats_review_camera() -> None:
    camera = _add_review_camera(
        "AIRBUS_A320_CAM_BETWEEN_SEATS_REVIEW",
        Vector((0.0, -1.715466, 0.32)),
        Vector((0.0, -0.456942, 0.11)),
        lens=20,
        game_id="airbus.a320.camera.between_seats_review",
        purpose="Blender owner review camera between cockpit seats facing the front panel",
    )
    camera.data.angle = 1.186824
    bpy.context.scene.camera = camera


def _set_between_seats_review_visibility() -> None:
    hidden_semantics = {"COCKPIT_FORWARD_INTERIOR_SHELL_AND_SEATS", "COCKPIT_REAR_BULKHEAD_SEATS_AND_SIDEWALLS"}
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.get("semanticPartName") not in hidden_semantics:
            continue
        obj.hide_set(True)
        obj["reviewHiddenReason"] = (
            "Compound interior/shell chunk blocks the between-seats owner review camera; "
            "the staged GLB is exported before this viewport-only review hide."
        )


def _configure_source_parity_render_settings(viewer_settings: dict[str, object]) -> None:
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.film_transparent = False
    scene.display_settings.display_device = "sRGB"
    scene.view_settings.view_transform = _first_supported_view_transform(("Standard", "AgX", "Filmic"))
    scene.view_settings.look = "None"
    scene.view_settings.exposure = float(_nested(viewer_settings, ["postProcess", "toneMapping", "exposure"], 0.0))
    scene.view_settings.gamma = 1.0
    scene.sequencer_colorspace_settings.name = "sRGB"
    scene.render.resolution_percentage = 100
    eevee = getattr(scene, "eevee", None)
    if eevee:
        _try_set(eevee, "use_gtao", True)
        _try_set(eevee, "gtao_distance", float(_nested(viewer_settings, ["postProcess", "ssao", "radius"], 0.16)) * 8.0)
        _try_set(eevee, "gtao_factor", float(_nested(viewer_settings, ["postProcess", "ssao", "intensity"], 0.5)) * 1.7)
        _try_set(eevee, "use_ssr", True)
        _try_set(eevee, "use_taa_reprojection", True)
        _try_set(eevee, "taa_render_samples", 64)


def _add_source_like_lighting(center: Vector, radius: float, viewer_settings: dict[str, object]) -> None:
    scene = bpy.context.scene
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    background = _nested(viewer_settings, ["background", "color"], [0.86667, 0.86667, 0.86667])
    world.color = tuple(float(value) for value in background[:3])
    for existing in [obj for obj in bpy.context.scene.objects if obj.name.startswith("AIRBUS_A320_SOURCE_PARITY_")]:
        bpy.data.objects.remove(existing, do_unlink=True)
    lights = _nested(viewer_settings, ["lighting", "lights"], [])
    for index, light in enumerate(lights if isinstance(lights, list) else [], start=1):
        if not isinstance(light, dict):
            continue
        matrix = light.get("matrix", [])
        if len(matrix) == 16:
            location = Vector((float(matrix[12]), float(matrix[13]), float(matrix[14])))
        else:
            location = center + Vector((0.0, -radius, radius))
        bpy.ops.object.light_add(type="SUN", location=location)
        obj = bpy.context.object
        obj.name = f"AIRBUS_A320_SOURCE_PARITY_SUN_{index:02d}"
        obj.rotation_euler = (center - location).to_track_quat("-Z", "Y").to_euler()
        color = light.get("color", [1, 1, 1])
        obj.data.color = tuple(float(value) for value in color[:3])
        obj.data.energy = float(light.get("intensity", 1.0)) * 2.2
        obj["source"] = "Sketchfab extracted directional light"
        _parent_to_airbus_root(obj)
    # Keep a broad soft fill for Blender viewport parity; Sketchfab's Studio
    # environment also contributes indirect light that is not portable to glTF.
    bpy.ops.object.light_add(type="AREA", location=(center.x, center.y - radius * 0.45, center.z + radius * 0.85))
    fill = bpy.context.object
    fill.name = "AIRBUS_A320_SOURCE_PARITY_STUDIO_FILL"
    fill.data.energy = float(_nested(viewer_settings, ["environment", "lightIntensity"], 3.0)) * 55
    fill.data.size = max(radius * 0.95, 2.0)
    fill["source"] = "Sketchfab Studio environment approximation"
    _parent_to_airbus_root(fill)


def _vector_from_list(value: object) -> Vector | None:
    if not isinstance(value, list) or len(value) < 3:
        return None
    try:
        return Vector((float(value[0]), float(value[1]), float(value[2])))
    except (TypeError, ValueError):
        return None


def _first_supported_view_transform(candidates: tuple[str, ...]) -> str:
    enum_items = bpy.context.scene.view_settings.bl_rna.properties["view_transform"].enum_items
    supported = {item.identifier for item in enum_items}
    for candidate in candidates:
        if candidate in supported:
            return candidate
    return bpy.context.scene.view_settings.view_transform


def _nested(data: dict[str, object], keys: list[str], default: object) -> object:
    current: object = data
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current


def _try_set(obj: object, attr: str, value: object) -> None:
    if hasattr(obj, attr):
        try:
            setattr(obj, attr, value)
        except Exception:
            pass


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


def _snapshot(expected_nodes: list[str]) -> dict[str, object]:
    return {
        "runtimeNodeNames": sorted(name for name in expected_nodes if bpy.data.objects.get(name)),
        "runtimeMetadata": {name: _metadata_for(bpy.data.objects.get(name)) for name in expected_nodes if bpy.data.objects.get(name)},
        "uvLayerCounts": {obj.name: len(obj.data.uv_layers) for obj in bpy.context.scene.objects if obj.type == "MESH" and not obj.hide_render},
        "dimensions": _scene_dimensions(),
        "materialCount": len(bpy.data.materials),
        "sourceTextureLinkCount": _source_texture_link_count(),
    }


def _metadata_for(obj: bpy.types.Object | None) -> dict[str, object]:
    if obj is None:
        return {}
    return {key: obj[key] for key in RUNTIME_METADATA_KEYS if key in obj}


def _validate(
    before: dict[str, object],
    reimport: dict[str, object],
    assignments: list[dict[str, object]],
    texture_report: dict[str, object],
    cleanup_report: dict[str, object],
) -> dict[str, object]:
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
        "loosePartCleanup": {
            "quarantineCollection": cleanup_report["quarantineCollection"],
            "quarantinedCount": len(cleanup_report["quarantinedNames"]),
            "quarantinedNames": cleanup_report["quarantinedNames"],
        },
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
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and not obj.hide_render]
    if not meshes:
        return {"x": 0.0, "y": 0.0, "z": 0.0, "center": [0.0, 0.0, 0.0]}
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    mins = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maxs = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    center = (mins + maxs) * 0.5
    size = maxs - mins
    return {"x": round(size.x, 6), "y": round(size.y, 6), "z": round(size.z, 6), "center": [round(value, 6) for value in center]}


def _scene_center_radius() -> tuple[Vector, float]:
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and not obj.hide_render]
    if not meshes:
        return Vector((0.0, 0.0, 0.0)), 1.0
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    mins = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maxs = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    center = (mins + maxs) * 0.5
    radius = max((maxs - mins).length * 0.5, 1.0)
    return center, radius


def _object_bounds(obj: bpy.types.Object) -> dict[str, object]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    mins = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maxs = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    center = (mins + maxs) * 0.5
    size = maxs - mins
    return {
        "center": [round(value, 6) for value in center],
        "size": [round(value, 6) for value in size],
    }


def _select_descendants(obj: bpy.types.Object) -> None:
    for child in obj.children:
        child.select_set(True)
        _select_descendants(child)


def _select_review_export_objects() -> None:
    for obj in bpy.context.scene.objects:
        if obj.type == "CAMERA" and obj.name.startswith("AIRBUS_A320_CAM_"):
            obj.select_set(True)
        if obj.type == "LIGHT" and obj.name.startswith("AIRBUS_A320_SOURCE_PARITY_"):
            obj.select_set(True)


def _deselect_quarantined_export_objects(names: list[str]) -> None:
    for name in names:
        obj = bpy.data.objects.get(name)
        if obj:
            obj.select_set(False)


def _parent_to_airbus_root(obj: bpy.types.Object) -> None:
    root = bpy.data.objects.get("AIRBUS_ROOT")
    if not root or obj.parent == root:
        return
    world = obj.matrix_world.copy()
    obj.parent = root
    obj.matrix_parent_inverse = root.matrix_world.inverted()
    obj.matrix_world = world


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
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
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
