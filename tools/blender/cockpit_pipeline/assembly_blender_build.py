from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy
from mathutils import Vector


def main() -> None:
    parser = argparse.ArgumentParser(description="Build neutral DC-9 vertical-slice assembly from layout JSON.")
    parser.add_argument("--layout", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--preview-dir", required=True)
    args = parser.parse_args(_args_after_double_dash())

    layout_path = Path(args.layout)
    output_dir = Path(args.output_dir)
    preview_dir = Path(args.preview_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    layout = json.loads(layout_path.read_text(encoding="utf-8"))

    _reset_scene()
    root = bpy.data.objects.new("DC9_VSLICE_ROOT", None)
    bpy.context.collection.objects.link(root)
    root["game_id"] = "dc9.vslice.root"
    root["sourceVariant"] = layout["sourceVariant"]
    root["targetVariant"] = layout["targetVariant"]
    root["variantScope"] = layout["variantScope"]
    root["assemblyStage"] = "assembly_complete"

    frame = _create_reference_frame(layout, root)
    component_reports = []
    for instance in layout["componentInstances"]:
        component_reports.append(_place_component(instance, root, frame))

    blend_path = output_dir / "dc9-vslice-assembly.blend"
    blend_backup_path = output_dir / "dc9-vslice-assembly.blend1"
    glb_path = output_dir / "dc9-vslice-assembly.glb"
    node_report_path = output_dir / "node-pivot-report.json"
    validation_path = output_dir / "validation-report.json"

    node_report = {
        "layoutId": layout["layoutId"],
        "componentReports": component_reports,
        "runtimeNodeNames": sorted(obj.name for obj in bpy.context.scene.objects),
        "pivotRepairs": [item for report in component_reports for item in report["pivotRepairs"]],
    }
    node_report_path.write_text(json.dumps(node_report, indent=2) + "\n", encoding="utf-8")

    _render_views(preview_dir, layout)
    blend_backup_path.unlink(missing_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    blend_backup_path.unlink(missing_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB", export_extras=True)
    _assert_glb(glb_path)

    reimport = _reimport_validation(glb_path)
    validation = _validate_scene(layout, component_reports, reimport)
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")

    report = {
        "blend": blend_path.as_posix(),
        "glb": glb_path.as_posix(),
        "nodeReport": node_report_path.as_posix(),
        "validationReport": validation_path.as_posix(),
        "previewDir": preview_dir.as_posix(),
        "status": "pass",
    }
    print(json.dumps(report, indent=2))


def _create_reference_frame(layout: dict[str, object], root: bpy.types.Object) -> bpy.types.Object:
    frame = bpy.data.objects.new("DC9_VSLICE_REFERENCE_FRAME", None)
    bpy.context.collection.objects.link(frame)
    frame.parent = root
    frame["game_id"] = "dc9.vslice.reference_frame"
    frame["coordinateSystem"] = layout["coordinateSystem"]["description"]
    frame["captainEyePoint"] = json.dumps(layout["captainEyePoint"])

    _create_box(
        "DC9_VSLICE_MAIN_PANEL_REFERENCE",
        frame,
        location=(-0.25, -0.53, 1.13),
        scale=(1.35, 0.055, 0.48),
        material_name="neutral_reference_frame",
        game_id="dc9.vslice.main_panel_reference",
    )
    _create_box(
        "DC9_VSLICE_GLARESHIELD_REFERENCE",
        frame,
        location=(-0.25, -0.69, 1.58),
        scale=(1.45, 0.28, 0.07),
        material_name="neutral_glareshield",
        game_id="dc9.vslice.glareshield_reference",
    )
    _create_box(
        "DC9_VSLICE_PEDESTAL_REFERENCE",
        frame,
        location=(0.16, -0.02, 0.36),
        scale=(0.52, 0.86, 0.32),
        material_name="neutral_pedestal",
        game_id="dc9.vslice.pedestal_reference",
    )
    _create_box(
        "DC9_VSLICE_CAPTAIN_YOKE_SOCKET",
        frame,
        location=(-0.72, -0.64, 0.82),
        scale=(0.22, 0.16, 0.12),
        material_name="neutral_control_mount",
        game_id="dc9.vslice.yoke_socket_reference",
    )
    _create_box(
        "DC9_VSLICE_LOWER_PANEL_REFERENCE",
        frame,
        location=(-0.32, -0.42, 0.66),
        scale=(1.05, 0.09, 0.16),
        material_name="neutral_lower_panel",
        game_id="dc9.vslice.lower_panel_reference",
    )
    return frame


def _create_box(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material_name: str,
    game_id: str,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = parent
    obj["game_id"] = game_id
    obj["referenceOnly"] = True
    _assign_neutral_material(obj, material_name)
    return obj


def _place_component(instance: dict[str, object], root: bpy.types.Object, frame: bpy.types.Object) -> dict[str, object]:
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(instance["sourceGlb"]))
    imported = [obj for obj in bpy.context.scene.objects if obj not in before]
    if not imported:
        raise RuntimeError(f"no objects imported for {instance['componentId']}")
    imported_meshes = [obj for obj in imported if obj.type == "MESH"]
    source_center, source_radius = _center_radius(imported_meshes)
    imported_roots = [obj for obj in imported if obj.parent not in imported]
    for obj in imported_roots:
        obj.location -= source_center

    group = bpy.data.objects.new(str(instance["parentGroupName"]), None)
    bpy.context.collection.objects.link(group)
    group.parent = root
    transform = instance["transform"]
    group.location = transform["translation"]
    group.rotation_euler = transform["rotationEuler"]
    group.scale = transform["scale"]
    group["game_id"] = instance["interactionMetadata"]["game_id"]
    group["componentId"] = instance["componentId"]
    group["category"] = instance["category"]
    group["interaction"] = instance["interactionMetadata"]["interaction"]
    group["puzzle_id"] = instance["interactionMetadata"]["puzzle_id"]
    group["sourceVariant"] = instance["sourceVariant"]
    group["targetVariant"] = instance["targetVariant"]
    group["variantScope"] = instance["variantScope"]
    group["pivotStatus"] = instance["pivotRepair"]["status"]
    group["layoutTransformStatus"] = transform["status"]

    pivot = bpy.data.objects.new(str(instance["runtimeNodeName"]), None)
    bpy.context.collection.objects.link(pivot)
    pivot.parent = group
    pivot.location = instance["pivotRepair"]["pivotLocal"]
    pivot["game_id"] = instance["interactionMetadata"]["game_id"] + ".pivot"
    pivot["interaction"] = instance["interactionMetadata"]["interaction"]
    pivot["rotation_axis"] = instance["interactionMetadata"]["rotation_axis"]
    pivot["rest_angle"] = instance["interactionMetadata"]["rest_angle"]
    pivot["active_angle"] = instance["interactionMetadata"]["active_angle"]
    pivot["sound_id"] = instance["interactionMetadata"]["sound_id"]

    renamed = []
    for index, obj in enumerate(imported):
        source_name = obj.name
        if obj in imported_roots:
            local_location = obj.location.copy()
            local_rotation = obj.rotation_euler.copy()
            local_scale = obj.scale.copy()
            obj.parent = pivot
            obj.matrix_parent_inverse.identity()
            obj.location = local_location
            obj.rotation_euler = local_rotation
            obj.scale = local_scale
        obj.name = f"{instance['runtimeNodeName']}__{index:02d}__{_stable_name(source_name)}"
        obj["sourceNodeName"] = source_name
        obj["componentId"] = instance["componentId"]
        obj["sourceStageCandidateId"] = instance["componentId"]
        obj["game_id"] = instance["interactionMetadata"]["game_id"]
        if obj.type == "MESH":
            _assign_neutral_material(obj, f"neutral_{instance['category']}")
        renamed.append({"source": source_name, "runtime": obj.name, "type": obj.type})

    return {
        "componentId": instance["componentId"],
        "category": instance["category"],
        "runtimeNodeName": instance["runtimeNodeName"],
        "parentGroupName": instance["parentGroupName"],
        "importedObjectCount": len(imported),
        "meshCount": len(imported_meshes),
        "importedRootCount": len(imported_roots),
        "hierarchyPreserved": True,
        "sourceBoundsCenter": [round(value, 6) for value in source_center],
        "sourceBoundsRadius": round(source_radius, 6),
        "renamedNodes": renamed,
        "pivotRepairs": [{
            "componentId": instance["componentId"],
            "status": instance["pivotRepair"]["status"],
            "method": instance["pivotRepair"]["method"],
            "pivotLocal": instance["pivotRepair"]["pivotLocal"],
        }],
        "transform": transform,
    }


def _assign_neutral_material(obj: bpy.types.Object, material_name: str) -> None:
    material = bpy.data.materials.get(material_name) or bpy.data.materials.new(material_name)
    if "glareshield" in material_name:
        material.diffuse_color = (0.08, 0.09, 0.09, 1.0)
    elif "pedestal" in material_name or "lower_panel" in material_name:
        material.diffuse_color = (0.22, 0.25, 0.26, 1.0)
    elif "reference" in material_name or "mount" in material_name:
        material.diffuse_color = (0.26, 0.3, 0.32, 1.0)
    elif "gauge" in material_name or "switch" in material_name:
        material.diffuse_color = (0.68, 0.7, 0.66, 1.0)
    else:
        material.diffuse_color = (0.62, 0.64, 0.62, 1.0)
    obj.data.materials.clear()
    obj.data.materials.append(material)


def _render_views(preview_dir: Path, layout: dict[str, object]) -> None:
    all_meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    center, radius = _center_radius(all_meshes)
    _render_preview(preview_dir / "captain-seat-view.png", Vector(layout["captainEyePoint"]["translation"]), center, max(1.6, radius * 1.35))
    _render_preview(preview_dir / "wide-cockpit-view.png", center + Vector((radius * 1.5, -radius * 2.2, radius * 1.2)), center, max(2.2, radius * 2.1))

    by_category = {item["category"]: item for item in layout["componentInstances"]}
    _render_component_view(preview_dir / "yoke-close-up.png", by_category["yoke_assembly"]["runtimeNodeName"])
    _render_component_view(preview_dir / "pedestal-throttle-close-up.png", by_category["throttle_assembly"]["runtimeNodeName"])
    gauge_objects = _component_meshes(by_category["large_cockpit_gauge"]["runtimeNodeName"]) + _component_meshes(by_category["switch_cluster"]["runtimeNodeName"])
    gauge_center, gauge_radius = _center_radius(gauge_objects)
    _render_preview(preview_dir / "gauge-switch-close-up.png", gauge_center + Vector((gauge_radius * 1.3, -gauge_radius * 2.2, gauge_radius * 0.8)), gauge_center, max(0.55, gauge_radius * 2.8))


def _render_component_view(path: Path, runtime_node_name: str) -> None:
    objects = _component_meshes(runtime_node_name)
    center, radius = _center_radius(objects)
    _render_preview(path, center + Vector((radius * 1.4, -radius * 2.1, radius * 0.9)), center, max(0.5, radius * 2.6))


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


def _render_preview(path: Path, location: Vector, target: Vector, ortho_scale: float) -> None:
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:
        scene.render.engine = "BLENDER_WORKBENCH"
    bpy.ops.object.light_add(type="AREA", location=(0.0, -1.6, 3.0))
    light = bpy.context.object
    light.name = "DC9_VSLICE_NEUTRAL_LIGHT"
    light.data.energy = 700
    light.data.size = 4.0
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


def _validate_scene(layout: dict[str, object], component_reports: list[dict[str, object]], reimport: dict[str, object]) -> dict[str, object]:
    runtime_names = [obj.name for obj in bpy.context.scene.objects]
    duplicates = sorted({name for name in runtime_names if runtime_names.count(name) > 1})
    required_components = {item["componentId"] for item in layout["componentInstances"]}
    seen_components = {report["componentId"] for report in component_reports}
    metadata_failures = []
    for obj in bpy.context.scene.objects:
        if obj.name in {item["runtimeNodeName"] for item in layout["componentInstances"]}:
            for key in ["game_id", "interaction", "rotation_axis", "rest_angle", "active_angle", "sound_id"]:
                if key not in obj:
                    metadata_failures.append({"node": obj.name, "missing": key})
    status = "pass" if not duplicates and not metadata_failures and required_components == seen_components and reimport["status"] == "pass" else "fail"
    return {
        "status": status,
        "componentCount": len(component_reports),
        "requiredComponents": sorted(required_components),
        "seenComponents": sorted(seen_components),
        "duplicateRuntimeNodeNames": duplicates,
        "metadataFailures": metadata_failures,
        "objectCount": len(bpy.context.scene.objects),
        "meshCount": len([obj for obj in bpy.context.scene.objects if obj.type == "MESH"]),
        "materialCount": len(bpy.data.materials),
        "reimportValidation": reimport,
    }


def _reimport_validation(glb_path: Path) -> dict[str, object]:
    _reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    mesh_count = len([obj for obj in bpy.context.scene.objects if obj.type == "MESH"])
    return {
        "status": "pass" if mesh_count > 0 else "fail",
        "objectCount": len(bpy.context.scene.objects),
        "meshCount": mesh_count,
        "materialCount": len(bpy.data.materials),
    }


def _assert_glb(path: Path) -> None:
    with path.open("rb") as handle:
        if handle.read(4) != b"glTF":
            raise RuntimeError(f"export did not produce a GLB: {path}")


def _look_at(obj: bpy.types.Object, target: Vector) -> None:
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def _center_radius(objects: list[bpy.types.Object]) -> tuple[Vector, float]:
    if not objects:
        return Vector((0, 0, 0)), 1.0
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    center = (mins + maxs) * 0.5
    radius = max((maxs - mins).length * 0.5, 0.1)
    return center, radius


def _stable_name(name: str) -> str:
    return "".join(char if char.isalnum() else "_" for char in name).strip("_").upper()


def _reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)


def _args_after_double_dash() -> list[str]:
    import sys

    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


if __name__ == "__main__":
    main()
