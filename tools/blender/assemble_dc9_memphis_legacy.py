"""Assemble the unapproved neutral KMEM legacy environment from Task 6 only."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_APPROVAL_PATH = REPO_ROOT / "art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/source-approval.json"
SOURCE_MANIFEST_PATH = REPO_ROOT / "art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/manifests/sourcing-complete.json"
SOURCE_CANDIDATE_PATH = REPO_ROOT / "art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/dc9-memphis-concourse-b-source.glb"
SOURCE_METADATA_PATH = REPO_ROOT / "art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/candidate-metadata.json"
OUTPUT_DIR = REPO_ROOT / "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly"
RUNTIME_CONTRACT_PATH = REPO_ROOT / "art-source/cockpit-pipeline/gates/dc9-memphis-legacy-runtime-contract.json"
MANIFEST_PATH = REPO_ROOT / "art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/manifests/assembly-complete.json"
APPROVED_SOURCE_FILES = ("ConcourseB.obj", "ConcourseB_2.obj", "ConcourseB_2e.obj")
CREATED_AT = "2026-08-28T00:00:00Z"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stable_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_record(path: Path) -> dict[str, object]:
    resolved = path.resolve()
    return {
        "path": str(resolved.relative_to(REPO_ROOT)),
        "sha256": sha256_file(resolved),
        "bytes": resolved.stat().st_size,
    }


def parse_args(arguments: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Assemble only the approved neutral KMEM legacy source candidate.")
    parser.add_argument("--source-approval", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--runtime-contract", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    return parser.parse_args(arguments)


def cli_arguments() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def resolve_repo_path(path: Path) -> Path:
    return (path if path.is_absolute() else REPO_ROOT / path).resolve()


def require_approved_paths(args: argparse.Namespace) -> None:
    actual = (
        resolve_repo_path(args.source_approval),
        resolve_repo_path(args.output_dir),
        resolve_repo_path(args.runtime_contract),
        resolve_repo_path(args.manifest),
    )
    expected = (SOURCE_APPROVAL_PATH.resolve(), OUTPUT_DIR.resolve(), RUNTIME_CONTRACT_PATH.resolve(), MANIFEST_PATH.resolve())
    for label, received, allowed in zip(("source approval", "output directory", "runtime contract", "manifest"), actual, expected, strict=True):
        if received != allowed:
            raise ValueError(f"{label} must resolve to the approved Task 7 path: {allowed}")


def verify_file_record(record: dict[str, Any]) -> None:
    path = (REPO_ROOT / str(record["path"])).resolve()
    if not path.is_file() or path.stat().st_size != record["bytes"] or sha256_file(path) != record["sha256"]:
        raise ValueError(f"source manifest hash record does not match: {record['path']}")


def verify_approved_source() -> dict[str, Any]:
    """Fail closed on any Task 6 approval, manifest, candidate, or metadata drift."""
    approval = json.loads(SOURCE_APPROVAL_PATH.read_text(encoding="utf-8"))
    if approval.get("stage") != "source-approved" or approval.get("approved") is not True:
        raise ValueError("Task 6 source approval is not approved for neutral assembly")
    if resolve_repo_path(Path(approval.get("sourceManifest", ""))) != SOURCE_MANIFEST_PATH.resolve():
        raise ValueError("Task 6 source approval references an unexpected source manifest")
    if resolve_repo_path(Path(approval.get("candidateGlb", ""))) != SOURCE_CANDIDATE_PATH.resolve():
        raise ValueError("Task 6 source approval references an unexpected candidate GLB")
    if resolve_repo_path(Path(approval.get("candidateMetadata", ""))) != SOURCE_METADATA_PATH.resolve():
        raise ValueError("Task 6 source approval references unexpected candidate metadata")
    for key, path in (
        ("sourceManifestSha256", SOURCE_MANIFEST_PATH),
        ("candidateGlbSha256", SOURCE_CANDIDATE_PATH),
        ("candidateMetadataSha256", SOURCE_METADATA_PATH),
    ):
        if approval.get(key) != sha256_file(path):
            raise ValueError(f"Task 6 source approval {key} does not match {path.name}")
    manifest = json.loads(SOURCE_MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("stage") != "sourcing_complete" or manifest.get("jobId") != "dc9-memphis-legacy-source":
        raise ValueError("unexpected Task 6 source manifest identity")
    outputs = {record["path"]: record for record in manifest.get("outputs", [])}
    for path in (SOURCE_CANDIDATE_PATH, SOURCE_METADATA_PATH):
        record = outputs.get(str(path.relative_to(REPO_ROOT)))
        if not record:
            raise ValueError(f"Task 6 source manifest does not declare {path.name}")
        verify_file_record(record)
    metadata = json.loads(SOURCE_METADATA_PATH.read_text(encoding="utf-8"))
    source_files = tuple(entry.get("sourceFile") for entry in metadata.get("objects", []))
    if metadata.get("candidateId") != approval.get("candidateId") or source_files != APPROVED_SOURCE_FILES:
        raise ValueError("Task 6 candidate metadata does not contain exactly the approved source objects")
    return {"approval": approval, "manifest": manifest, "metadata": metadata}


def _add_box(bpy: Any, name: str, location: tuple[float, float, float], dimensions: tuple[float, float, float], material: Any, parent: Any) -> Any:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    obj.parent = parent
    obj["project_authored"] = True
    obj["role"] = "neutral-ground-surface"
    return obj


def _look_at(camera: Any, target: Any) -> None:
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def _relative(path: Path) -> str:
    return str(path.resolve().relative_to(REPO_ROOT))


def _validate_neutral_scene(bpy: Any, root: Any, concourse_group: Any, source_roots: dict[str, Any], anchors: tuple[dict[str, Any], ...]) -> dict[str, Any]:
    """Reject any hierarchy, metadata, or material boundary breach before export."""
    scene_objects = [root, *root.children_recursive]
    names = [obj.name for obj in scene_objects]
    if len(names) != len(set(names)):
        raise ValueError("assembled scene contains duplicate object names")
    source_files = sorted(child.get("source_file") for child in concourse_group.children)
    if source_files != sorted(APPROVED_SOURCE_FILES) or len(concourse_group.children) != 3:
        raise ValueError("assembled source group contains objects beyond the three approved sources")
    if set(source_roots) != set(APPROVED_SOURCE_FILES):
        raise ValueError("assembled source roots differ from approved source files")
    expected_game_ids = {anchor["game_id"] for anchor in anchors}
    game_id_objects = [obj for obj in scene_objects if obj.get("game_id")]
    game_ids = [obj.get("game_id") for obj in game_id_objects]
    if len(game_ids) != len(set(game_ids)) or set(game_ids) != expected_game_ids:
        raise ValueError("assembled scene does not contain exactly the five unique anchor game IDs")
    for obj in scene_objects:
        transform = (*obj.location, *obj.rotation_euler, *obj.scale)
        if not all(math.isfinite(float(value)) for value in transform):
            raise ValueError(f"assembled scene has a non-finite transform: {obj.name}")
    prohibited_nodes = {"ShaderNodeTexImage", "ShaderNodeNormalMap", "ShaderNodeEmission"}
    material_nodes = [node.bl_idname for material in bpy.data.materials for node in (material.node_tree.nodes if material.use_nodes else [])]
    found = sorted(set(material_nodes) & prohibited_nodes)
    if found:
        raise ValueError(f"neutral assembly contains prohibited texture/normal/emissive nodes: {found}")
    return {
        "uniqueObjectNames": True,
        "uniqueGameIds": True,
        "finiteTransforms": True,
        "approvedSourceFiles": list(APPROVED_SOURCE_FILES),
        "noTextureNormalOrEmissiveNodes": True,
    }


def build_scene(metadata: dict[str, Any], output_dir: Path) -> dict[str, Any]:
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))
    import bpy
    from mathutils import Matrix, Vector

    from tools.blender.cockpit_pipeline.kmem_legacy_layout import (
        ANCHORS,
        CONCOURSE_GROUP_NAME,
        CONCOURSE_SOURCE_TRANSFORMS,
        GROUND_SURFACES,
        ROOT_NAME,
        TERMINAL_CANOPY,
        route_camera_pose,
        route_distances,
        terminal_canopy_parts,
        terminal_canopy_world_bounds,
        validate_layout,
    )

    errors = validate_layout()
    if errors:
        raise ValueError(f"invalid Task 7 layout: {errors}")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    world = bpy.data.worlds.new("KMEM_NEUTRAL_REVIEW_WORLD")
    world.color = (0.055, 0.07, 0.09)
    scene.world = world

    bpy.ops.import_scene.gltf(filepath=str(SOURCE_CANDIDATE_PATH))
    source_candidate = bpy.data.objects.get("KMEM_CONCOURSE_B_SOURCE_CANDIDATE")
    if source_candidate is None:
        raise ValueError("approved candidate root did not reimport")
    source_roots = {entry["sourceFile"]: bpy.data.objects.get(entry["sourceRoot"]) for entry in metadata["objects"]}
    if tuple(source_roots) != APPROVED_SOURCE_FILES or any(root is None for root in source_roots.values()):
        raise ValueError("approved candidate did not provide exactly its three approved source roots")

    root = bpy.data.objects.new(ROOT_NAME, None)
    bpy.context.collection.objects.link(root)
    root["scene_group"] = "DC-9 First-Officer Memphis legacy departure environment"
    root["stage"] = "assembly_complete_unapproved"
    root["historical_deviation"] = "compressed 1995 memory composition, not exact KMEM geography"
    concourse_group = bpy.data.objects.new(CONCOURSE_GROUP_NAME, None)
    bpy.context.collection.objects.link(concourse_group)
    concourse_group.parent = root
    concourse_group["source_group"] = True
    concourse_group["approved_source_count"] = 3
    for source_file, source_root in source_roots.items():
        source_root.parent = concourse_group
        transform = CONCOURSE_SOURCE_TRANSFORMS[source_file]
        source_root.location = transform["location"]
        # The glTF importer leaves imported objects in QUATERNION rotation mode,
        # where a rotation_euler write is silently ignored; force Euler first.
        source_root.rotation_mode = "XYZ"
        source_root.rotation_euler = (0.0, 0.0, math.radians(transform["rotation_z_degrees"]))
        source_root["source_file"] = source_file
        source_root["approved_source"] = True
    bpy.data.objects.remove(source_candidate, do_unlink=True)
    bpy.context.view_layer.update()
    for source_file, source_root in source_roots.items():
        transform = CONCOURSE_SOURCE_TRANSFORMS[source_file]
        actual_location = tuple(source_root.matrix_world.translation)
        actual_z_degrees = math.degrees(source_root.matrix_world.to_euler("XYZ").z)
        expected_location = tuple(float(value) for value in transform["location"])
        expected_z_degrees = float(transform["rotation_z_degrees"])
        location_drift = max(abs(a - b) for a, b in zip(actual_location, expected_location, strict=True))
        rotation_drift = abs((actual_z_degrees - expected_z_degrees + 180.0) % 360.0 - 180.0)
        if location_drift > 1e-4 or rotation_drift > 1e-3:
            raise ValueError(
                f"assembled source transform does not match the authored layout for {source_file}: "
                f"location {actual_location} vs {expected_location}, rotation {actual_z_degrees:.3f} vs {expected_z_degrees:.3f}"
            )

    ground = bpy.data.materials.new("KMEM_NEUTRAL_GROUND")
    ground.diffuse_color = (0.20, 0.24, 0.27, 1.0)
    route = bpy.data.materials.new("KMEM_NEUTRAL_ROUTE_CENTERLINE")
    route.diffuse_color = (0.63, 0.66, 0.62, 1.0)
    for surface in GROUND_SURFACES:
        _add_box(bpy, surface["name"], tuple(surface["center"]), tuple(surface["dimensions"]), ground, root)

    # Stylized martini-glass canopy accent over the main block, joined into one
    # project-authored object. Transforms are applied so the exported node is
    # identity with the mesh in world coordinates.
    canopy_pieces = []
    for part in terminal_canopy_parts():
        bpy.ops.mesh.primitive_cube_add(location=part["center"])
        piece = bpy.context.object
        piece.dimensions = part["dimensions"]
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        piece.rotation_euler = (part["rotation_x_radians"], 0.0, 0.0)
        piece.data.materials.append(ground)
        canopy_pieces.append(piece)
    bpy.ops.object.select_all(action="DESELECT")
    for piece in canopy_pieces:
        piece.select_set(True)
    bpy.context.view_layer.objects.active = canopy_pieces[0]
    bpy.ops.object.join()
    canopy = bpy.context.object
    canopy.name = TERMINAL_CANOPY["name"]
    canopy.data.name = TERMINAL_CANOPY["name"]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    canopy.parent = root
    canopy["project_authored"] = True
    canopy["role"] = "terminal-canopy-accent"
    bpy.context.view_layer.update()
    expected_canopy = terminal_canopy_world_bounds()
    actual_corners = [canopy.matrix_world @ Vector(corner) for corner in canopy.bound_box]
    actual_min = [min(corner[axis] for corner in actual_corners) for axis in range(3)]
    actual_max = [max(corner[axis] for corner in actual_corners) for axis in range(3)]
    canopy_drift = max(
        *(abs(a - b) for a, b in zip(actual_min, expected_canopy["min"], strict=True)),
        *(abs(a - b) for a, b in zip(actual_max, expected_canopy["max"], strict=True)),
    )
    if canopy_drift > 0.05:
        raise ValueError(
            f"assembled terminal canopy bounds drift {canopy_drift:.3f} m from the authored layout: "
            f"{actual_min}..{actual_max} vs {expected_canopy['min']}..{expected_canopy['max']}"
        )
    for index, y_value in enumerate(range(280, 690, 48), start=1):
        _add_box(bpy, f"KMEM_CENTERLINE_{index:02d}", (-120.0, float(y_value), 0.03), (1.2, 24.0, 0.08), route, root)

    for anchor in ANCHORS:
        locator = bpy.data.objects.new(anchor["name"], None)
        bpy.context.collection.objects.link(locator)
        locator.parent = root
        locator.location = anchor["location"]
        locator.empty_display_type = "SPHERE"
        locator.empty_display_size = 1.8
        locator["game_id"] = anchor["game_id"]
        locator["node_role"] = "cue"
        locator["htmlEquivalent"] = "MemphisDeparturePanel qualitative path control"
        locator["pivot_verified"] = True
        locator["local_axis"] = "NONE"

    scene_boundary = _validate_neutral_scene(bpy, root, concourse_group, source_roots, ANCHORS)

    camera_data = bpy.data.cameras.new("CAM_KMEM_NEUTRAL_REVIEW")
    camera = bpy.data.objects.new("CAM_KMEM_NEUTRAL_REVIEW", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    camera_data.lens = 36
    camera.location = Vector((205.0, -230.0, 175.0))
    _look_at(camera, Vector((-115.0, 265.0, 0.0)))
    preview_paths: list[Path] = []
    for width, height in ((1440, 900), (768, 480), (375, 234)):
        scene.render.resolution_x = width
        scene.render.resolution_y = height
        scene.render.resolution_percentage = 100
        preview = output_dir / "previews" / f"neutral-{width}.png"
        preview.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(preview)
        bpy.ops.render.render(write_still=True)
        preview_paths.append(preview)

    # Windshield-pose previews from the measured first-officer camera rig, so the
    # Assembly Review Gate always shows what the in-game windshield will show.
    # The 2026-08-28 Task 10 stall happened because the review camera alone could
    # not reveal that the terminal sat behind the ramp-start view.
    camera_data.sensor_fit = "VERTICAL"
    for label, progress, sizes in (
        ("windshield-ramp-start", 0.0, ((1440, 900, 64.0), (768, 900, 76.0), (375, 812, 76.0))),
        ("windshield-hold-short", 0.42, ((1440, 900, 64.0),)),
        ("windshield-runway-lineup", 0.52, ((1440, 900, 64.0),)),
        ("windshield-takeoff-roll", 0.62, ((1440, 900, 64.0),)),
    ):
        pose = route_camera_pose(progress)
        forward = Vector(pose["forward"]).normalized()
        up = Vector(pose["up"]).normalized()
        right = forward.cross(up).normalized()
        camera.matrix_world = Matrix.Translation(Vector(pose["position"])) @ Matrix((
            (right.x, up.x, -forward.x),
            (right.y, up.y, -forward.y),
            (right.z, up.z, -forward.z),
        )).to_4x4()
        for width, height, vertical_fov in sizes:
            camera_data.angle_y = math.radians(vertical_fov)
            scene.render.resolution_x = width
            scene.render.resolution_y = height
            scene.render.resolution_percentage = 100
            preview = output_dir / "previews" / f"{label}-{width}.png"
            scene.render.filepath = str(preview)
            bpy.ops.render.render(write_still=True)
            preview_paths.append(preview)

    blend_path = output_dir / "dc9-memphis-legacy-neutral.blend"
    glb_path = output_dir / "dc9-memphis-legacy-neutral.glb"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_apply=True,
    )
    resolved_layout = {
        "layoutSpace": "compressed authored game space; not airport-chart geography",
        "root": ROOT_NAME,
        "sourceGroup": CONCOURSE_GROUP_NAME,
        "projectOwnedGeometry": [*(surface["name"] for surface in GROUND_SURFACES), TERMINAL_CANOPY["name"], "KMEM_CENTERLINE_01..09"],
        "groundSurfaces": [dict(surface) for surface in GROUND_SURFACES],
        "terminalCanopy": dict(TERMINAL_CANOPY),
        "anchors": [{**anchor, "routeDistance": round(distance, 6)} for anchor, distance in zip(ANCHORS, route_distances(), strict=True)],
        "concourseSourceTransforms": CONCOURSE_SOURCE_TRANSFORMS,
        "validationErrors": [],
    }
    return {"blend": blend_path, "glb": glb_path, "previews": preview_paths, "resolvedLayout": resolved_layout, "sceneBoundary": scene_boundary}


def reimport_report(glb_path: Path) -> dict[str, Any]:
    import bpy
    from mathutils import Vector

    from tools.blender.cockpit_pipeline.kmem_legacy_layout import (
        ANCHORS,
        CONCOURSE_SOURCE_TRANSFORMS,
        ROOT_NAME,
    )

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    root = bpy.data.objects.get(ROOT_NAME)
    if root is None:
        raise ValueError("neutral GLB did not reimport its root")
    anchors: list[dict[str, Any]] = []
    failures: list[str] = []
    source_transforms: list[dict[str, Any]] = []
    bpy.context.view_layer.update()
    for source_file, transform in CONCOURSE_SOURCE_TRANSFORMS.items():
        node_name = f"KMEM_SOURCE_{source_file.removesuffix('.obj').upper()}"
        node = bpy.data.objects.get(node_name)
        if node is None:
            failures.append(f"missing reimported source root {node_name}")
            continue
        actual_location = tuple(round(value, 6) for value in node.matrix_world.translation)
        actual_z_degrees = round(math.degrees(node.matrix_world.to_euler("XYZ").z), 3)
        expected_location = tuple(float(value) for value in transform["location"])
        expected_z_degrees = float(transform["rotation_z_degrees"])
        location_drift = max(abs(a - b) for a, b in zip(actual_location, expected_location, strict=True))
        rotation_drift = abs((actual_z_degrees - expected_z_degrees + 180.0) % 360.0 - 180.0)
        if location_drift > 1e-3 or rotation_drift > 0.01:
            failures.append(
                f"reimported source transform drift {node_name}: location {actual_location} != {expected_location} "
                f"or rotation {actual_z_degrees} != {expected_z_degrees}"
            )
        source_transforms.append({
            "name": node_name,
            "sourceFile": source_file,
            "location": actual_location,
            "rotationZDegrees": actual_z_degrees,
        })
    for expected in ANCHORS:
        node = bpy.data.objects.get(expected["name"])
        if node is None:
            failures.append(f"missing anchor {expected['name']}")
            continue
        actual = tuple(round(value, 6) for value in Vector(node.matrix_world.translation))
        wanted = tuple(expected["location"])
        if actual != wanted:
            failures.append(f"anchor coordinate drift {expected['name']}: {actual} != {wanted}")
        if node.get("game_id") != expected["game_id"]:
            failures.append(f"anchor game ID drift {expected['name']}")
        anchors.append({"name": node.name, "gameId": node.get("game_id"), "location": actual, "pivot": tuple(round(value, 6) for value in node.location)})
    game_ids = [entry.get("gameId") for entry in anchors]
    if len(game_ids) != len(set(game_ids)):
        failures.append("reimported anchor game IDs are not unique")
    mesh_triangles = sum(len(mesh.polygons) for mesh in bpy.data.meshes)
    report = {
        "status": "pass" if not failures else "fail",
        "root": root.name,
        "anchors": anchors,
        "sourceTransforms": source_transforms,
        "meshCount": len(bpy.data.meshes),
        "triangleCount": mesh_triangles,
        "materialCount": len(bpy.data.materials),
        "failures": failures,
    }
    if failures:
        raise ValueError("; ".join(failures))
    return report


def main() -> int:
    args = parse_args(cli_arguments())
    require_approved_paths(args)
    approved = verify_approved_source()
    built = build_scene(approved["metadata"], OUTPUT_DIR)
    layout_path = OUTPUT_DIR / "resolved-layout.json"
    stable_json(layout_path, built["resolvedLayout"])
    reimport = reimport_report(built["glb"])
    node_pivot_path = OUTPUT_DIR / "node-pivot-report.json"
    stable_json(node_pivot_path, reimport)
    validation_path = OUTPUT_DIR / "assembly-validation.json"
    validation = {
        "status": "pass",
        "approved": False,
        "sourceApprovalVerified": True,
        "approvedSourceObjects": list(APPROVED_SOURCE_FILES),
        "sourceObjectsAssembled": list(APPROVED_SOURCE_FILES),
        "layoutValidation": "pass",
        "sceneBoundaryValidation": built["sceneBoundary"],
        "reimportValidation": reimport["status"],
        "noTexturesNormalOrEmissive": True,
        "knownDeviation": "compressed 1995 memory composition, not exact KMEM geography",
    }
    stable_json(validation_path, validation)
    from tools.blender.cockpit_pipeline.kmem_legacy_layout import ANCHORS, ROOT_NAME

    runtime_nodes = [
        {
            "name": anchor["name"],
            "gameId": anchor["game_id"],
            "pivotVerified": True,
            "pivotExportVerified": True,
            "nodeRole": "cue",
            "visualAlignmentStatus": "not-applicable-empty-anchor",
            "localAxis": "NONE",
            "htmlEquivalent": "MemphisDeparturePanel qualitative path control",
        }
        for anchor in ANCHORS
    ]
    contract = {
        "gate": "runtime-contract",
        "artifactId": "dc9-memphis-legacy-neutral-runtime-contract",
        "createdAt": CREATED_AT,
        "sceneGroup": "DC-9 First-Officer Memphis legacy departure environment",
        "assetPath": _relative(built["glb"]),
        "rootObject": ROOT_NAME,
        "runtimeNodes": runtime_nodes,
        "customPropertiesPreserved": True,
        "reimportValidation": "pass",
        "visualAlignmentValidation": {"status": "not-verified", "evidence": "Neutral assembly only; owner Assembly Review Gate pending."},
        "scaleAndCameraAssumptions": "Compressed authored game space; environment-only GLB is positioned by the cockpit-first runtime.",
        "knownReferenceDeviations": ["compressed 1995 memory composition, not exact KMEM geography"],
    }
    stable_json(RUNTIME_CONTRACT_PATH, contract)
    outputs = [built["blend"], built["glb"], layout_path, node_pivot_path, validation_path, *built["previews"], RUNTIME_CONTRACT_PATH]
    manifest = {
        "manifestId": "dc9-memphis-legacy-assembly-complete",
        "jobId": "dc9-memphis-legacy-assembly",
        "stage": "assembly_complete",
        "createdAt": CREATED_AT,
        "sourceVariant": "Ted Davis KMEM X-Plane scenery revision 2019-01-22",
        "targetVariant": "1995 Memphis memory recreation",
        "variantScope": "common",
        "artifactBasePath": str(REPO_ROOT),
        "inputs": [SOURCE_APPROVAL_PATH, SOURCE_MANIFEST_PATH, SOURCE_CANDIDATE_PATH, SOURCE_METADATA_PATH],
        "outputs": [file_record(path) for path in outputs],
        "approval": {"approved": False, "approvedBy": "owner Assembly Review Gate pending", "notes": "Neutral assembly evidence only; no material, runtime/public-model, or shading approval."},
    }
    manifest["inputs"] = [file_record(path) for path in manifest["inputs"]]
    stable_json(MANIFEST_PATH, manifest)
    print(f"Neutral assembly complete and unapproved: {OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
