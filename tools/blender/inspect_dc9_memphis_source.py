"""Create the unapproved, source-only KMEM Concourse B candidate.

The selection and verification helpers are ordinary Python so they can be
exercised without Blender.  Blender imports are deliberately confined to the
generation functions below; this script must run with factory startup and
auto-execution disabled.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
AUTHORITY_PATH = REPO_ROOT / "art-source/cockpit-pipeline/gates/agent0-dc9-memphis-legacy-authority.json"
SOURCE_RECORD_PATH = REPO_ROOT / "asset-reports/dc9-memphis-source-intake.json"
JOB_PATH = REPO_ROOT / "art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/job.json"
ARCHIVE_SHA256 = "fc403141223be066094814d9ea06d820f75477fea419870b04ffd65153434b95"
SELECTED_HASHES = {
    "ConcourseB.obj": "e88ab8411a033d5996c53053b14a894ff9824380a76891b27659549a7e9e6424",
    "ConcourseB_2.obj": "e4bb0f830c515d9c5a42cfe60bce5eb4dc3fb6ba5fdce6ca9c66d16ef49f7000",
    "ConcourseB_2e.obj": "2bf6f39b0e5e1f6a2e24fefb9469fc1c598884ddcfefc9f20b825cac375a109d",
    "KMEMterminal.png": "416c081c5e9f9ca40b183477da54f7ec8c5baa62ae0b9c0bdd961329ac394505",
    "KMEMterminal_LIT.png": "6a561147ceae328b311fba38de849d3102a4d2eb1238c3ddbbfb2315b7cf91e5",
    "KMEMterminal_NML.png": "9e1f272c64807981bee997aa08e7a3273ab5c4242f4ff58fb92cc20b1f8bf7e8",
}
EXPECTED_TRIANGLES = {"ConcourseB.obj": 178, "ConcourseB_2.obj": 30, "ConcourseB_2e.obj": 24}


def selected_source_names() -> tuple[str, str, str]:
    """Return the only OBJ8 files Agent 1 is permitted to import."""
    return ("ConcourseB.obj", "ConcourseB_2.obj", "ConcourseB_2e.obj")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stable_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def parse_args(arguments: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inspect the source-only KMEM Concourse B candidate.")
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--working-dir", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    return parser.parse_args(arguments)


def cli_arguments() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def checked_source_records(source_dir: Path) -> list[dict[str, object]]:
    source_dir = source_dir.resolve()
    archive_path = source_dir.parents[2] / "Memphis_Nashville.zip"
    if sha256_file(archive_path) != ARCHIVE_SHA256:
        raise ValueError(f"archive hash mismatch: {archive_path}")
    records: list[dict[str, object]] = []
    for name, expected_hash in SELECTED_HASHES.items():
        path = source_dir / name
        if not path.is_file():
            raise FileNotFoundError(f"missing selected source file: {path}")
        actual_hash = sha256_file(path)
        if actual_hash != expected_hash:
            raise ValueError(f"selected hash mismatch: {name}")
        records.append({"path": str(path.relative_to(REPO_ROOT)), "sha256": actual_hash, "bytes": path.stat().st_size})
    return records


def verify_task1_authority(source_dir: Path) -> list[dict[str, object]]:
    authority = json.loads(AUTHORITY_PATH.read_text(encoding="utf-8"))
    if authority.get("gate") != "reference-authority" or authority.get("nextAllowedStage") != "agent1-sourcing":
        raise ValueError("Task 1 reference authority does not authorize Agent 1 sourcing")
    if authority.get("ownerApprovalStatus") != "approved-for-next-stage":
        raise ValueError("Task 1 reference authority is not owner-approved for the next stage")
    if authority.get("sourceIdentity") != "Ted Davis Memphis/Nashville X-Plane 11.3 package, Concourse B objects only":
        raise ValueError("Task 1 reference authority source identity changed")
    source_record = json.loads(SOURCE_RECORD_PATH.read_text(encoding="utf-8"))
    if source_record.get("archiveSha256") != ARCHIVE_SHA256:
        raise ValueError("Task 1 source record archive hash changed")
    if source_record.get("permissionBasis") != "owner-attested-private-noncommercial-2026-08-27":
        raise ValueError("Task 1 owner-attested private noncommercial permission changed")
    if source_record.get("credit") != "Memphis scenery derived from the Memphis/Nashville Scenery Package by Ted Davis.":
        raise ValueError("Task 1 Ted Davis credit changed")
    expected_records = [{"path": f"KMEM/{name}", "sha256": digest} for name, digest in SELECTED_HASHES.items()]
    if source_record.get("selectedFiles") != expected_records:
        raise ValueError("Task 1 source record no longer contains exactly the six selected hashes")
    return [
        {"path": str(AUTHORITY_PATH.relative_to(REPO_ROOT)), "sha256": sha256_file(AUTHORITY_PATH), "bytes": AUTHORITY_PATH.stat().st_size},
        {"path": str(SOURCE_RECORD_PATH.relative_to(REPO_ROOT)), "sha256": sha256_file(SOURCE_RECORD_PATH), "bytes": SOURCE_RECORD_PATH.stat().st_size},
        *checked_source_records(source_dir),
    ]


def file_record(path: Path) -> dict[str, object]:
    resolved = path.resolve()
    return {"path": str(resolved.relative_to(REPO_ROOT)), "sha256": sha256_file(resolved), "bytes": resolved.stat().st_size}


def update_job_stage() -> None:
    job = json.loads(JOB_PATH.read_text(encoding="utf-8"))
    if job.get("stage") not in {"requested", "sourcing_complete"}:
        raise ValueError(f"source job cannot advance from {job.get('stage')!r}")
    job["stage"] = "sourcing_complete"
    JOB_PATH.write_text(json.dumps(job, indent=2) + "\n", encoding="utf-8")


def source_root_name(source_name: str) -> str:
    return f"KMEM_SOURCE_{Path(source_name).stem.upper()}"


def run_blender_generation(source_dir: Path, working_dir: Path, output_dir: Path) -> list[Path]:
    """Run the Blender-only import, neutralization, export, and preview work."""
    # Blender's script launch does not put the repository root on sys.path.
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))
    import bpy
    from mathutils import Vector

    from tools.blender.cockpit_pipeline.xplane_obj8_blender_import import add_source_object

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    # Workbench gives deterministic, fast source-review silhouettes without
    # introducing final lighting or shading decisions at the sourcing stage.
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 480
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new("KMEM_SOURCE_REVIEW_WORLD")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.055, 0.065, 0.08, 1.0)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.45

    root = bpy.data.objects.new("KMEM_CONCOURSE_B_SOURCE_CANDIDATE", None)
    bpy.context.collection.objects.link(root)
    neutral = bpy.data.materials.new("KMEM_SOURCE_NEUTRAL_BASE_COLOR")
    neutral.use_nodes = True
    principled = neutral.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (0.44, 0.53, 0.62, 1.0)
    principled.inputs["Roughness"].default_value = 0.78
    reports: dict[str, dict[str, object]] = {}
    source_roots: list[object] = []
    for source_name in selected_source_names():
        report = add_source_object(source_dir / source_name, {}, root, root_name=source_root_name(source_name))
        reports[source_name] = report
        source_root = bpy.data.objects[source_root_name(source_name)]
        source_roots.append(source_root)
        for child in source_root.children_recursive:
            if child.type == "MESH":
                child.data.materials.clear()
                child.data.materials.append(neutral)
                while child.data.uv_layers:
                    child.data.uv_layers.remove(child.data.uv_layers[0])
    for material in list(bpy.data.materials):
        if material != neutral:
            bpy.data.materials.remove(material)
    for image in list(bpy.data.images):
        bpy.data.images.remove(image)

    camera_data = bpy.data.cameras.new("CAM_KMEM_SOURCE_REVIEW")
    camera_data.type = "ORTHO"
    camera = bpy.data.objects.new("CAM_KMEM_SOURCE_REVIEW", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    light_data = bpy.data.lights.new("KMEM_SOURCE_REVIEW_KEY", "AREA")
    light_data.energy = 2200
    light_data.shape = "DISK"
    light_data.size = 80.0
    light = bpy.data.objects.new("KMEM_SOURCE_REVIEW_KEY", light_data)
    bpy.context.collection.objects.link(light)

    def bounds_for(entry_root):
        points = []
        for obj in entry_root.children_recursive:
            if obj.type != "MESH":
                continue
            points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
        if not points:
            raise ValueError(f"source object has no mesh bounds: {entry_root.name}")
        minimum = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
        maximum = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
        return minimum, maximum

    def render_source(entry_root, destination: Path) -> None:
        for candidate in source_roots:
            candidate.hide_render = candidate != entry_root
        minimum, maximum = bounds_for(entry_root)
        center = (minimum + maximum) / 2
        dimensions = maximum - minimum
        extent = max(dimensions.x, dimensions.y, dimensions.z, 1.0)
        camera_data.ortho_scale = extent * 1.8
        camera.location = center + Vector((extent * 0.82, -extent * 0.82, extent * 0.68))
        camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
        light.location = center + Vector((extent * 0.4, -extent * 0.4, extent * 1.2))
        destination.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(destination.resolve())
        bpy.ops.render.render(write_still=True)

    preview_paths: list[Path] = []
    for source_name, entry_root in zip(selected_source_names(), source_roots, strict=True):
        preview_path = output_dir / "previews" / f"{Path(source_name).stem}-orthographic.png"
        render_source(entry_root, preview_path)
        preview_paths.append(preview_path)

    # Build the contact sheet from the actual preview pixels; it is review evidence only.
    images = [bpy.data.images.load(str(path.resolve()), check_existing=False) for path in preview_paths]
    width, height = images[0].size[:]
    sheet = bpy.data.images.new("KMEM_CONCOURSE_B_SOURCE_CONTACT_SHEET", width=width * len(images), height=height, alpha=False)
    sheet_pixels = [0.0] * (width * len(images) * height * 4)
    for index, image in enumerate(images):
        pixels = [0.0] * (width * height * 4)
        image.pixels.foreach_get(pixels)
        for row in range(height):
            target = (row * width * len(images) + index * width) * 4
            source = row * width * 4
            sheet_pixels[target : target + width * 4] = pixels[source : source + width * 4]
    sheet.pixels.foreach_set(sheet_pixels)
    contact_sheet = output_dir / "concourse-b-source-contact-sheet.png"
    sheet.filepath_raw = str(contact_sheet.resolve())
    sheet.file_format = "PNG"
    sheet.save()

    for candidate in source_roots:
        candidate.hide_render = False
    working_dir.mkdir(parents=True, exist_ok=True)
    blend_path = working_dir / "dc9-memphis-concourse-b-source-candidate.blend"
    raw_glb_path = working_dir / "dc9-memphis-concourse-b-source-first-export.glb"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path.resolve()))
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=str(raw_glb_path.resolve()), export_format="GLB", use_selection=True, export_extras=True,
        export_materials="EXPORT", export_cameras=False, export_lights=False, export_apply=True,
    )
    candidate_glb = output_dir / "dc9-memphis-concourse-b-source.glb"
    candidate_glb.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(raw_glb_path, candidate_glb)

    candidate_metadata = {
        "candidateId": "dc9-memphis-concourse-b-source",
        "stage": "sourcing_complete",
        "approval": "owner Source Review Gate pending",
        "root": root.name,
        "sourceScaleOrientation": "Preserved from the OBJ8 importer (X-right/Y-up/Z-south to Blender X-right/Y-forward/Z-up).",
        "material": {"name": neutral.name, "mode": "neutral-base-color-only", "textureWiring": "none"},
        "objects": [],
        "textureDeclarations": {"day": "KMEMterminal.png", "lit": "KMEMterminal_LIT.png", "normal": "KMEMterminal_NML.png"},
        "unsupportedSourceDirective": "TEXTURE_NORMAL",
        "historicalLimitation": "Ted Davis KMEM scenery revision 2019-01-22 is a later simulator source used only as a 1995-memory geometry base; it is not an exact historical reconstruction.",
        "exclusions": ["AutoGate", "OpenSceneryX", "Planes", "aircraft", "vehicles", "clutter", "scripts", "add-ons", "unrelated KMEM objects"],
        "permissionBasis": "owner-attested-private-noncommercial-2026-08-27",
        "credit": "Memphis scenery derived from the Memphis/Nashville Scenery Package by Ted Davis.",
    }
    for source_name, entry_root in zip(selected_source_names(), source_roots, strict=True):
        minimum, maximum = bounds_for(entry_root)
        report = reports[source_name]
        candidate_metadata["objects"].append({
            "sourceFile": source_name,
            "sourceRoot": entry_root.name,
            "triangleCount": report["triangleCount"],
            "boundsBlenderMeters": {
                "min": [round(value, 6) for value in minimum],
                "max": [round(value, 6) for value in maximum],
                "dimensions": [round(maximum[index] - minimum[index], 6) for index in range(3)],
            },
            "texture": report["texture"],
            "litTexture": report["litTexture"],
            "unsupportedDirectives": report["unsupportedDirectives"],
            "preview": str((output_dir / "previews" / f"{Path(source_name).stem}-orthographic.png").relative_to(REPO_ROOT)),
        })
    direct_source_roots = list(root.children)
    actual_source_roots = [entry.name for entry in direct_source_roots]
    material_names = sorted({material.name for entry in root.children_recursive if entry.type == "MESH" for material in entry.data.materials})
    game_id_objects = [entry.name for entry in [root, *root.children_recursive] if "game_id" in entry]
    forbidden_name_tokens = ("ground", "ramp", "taxi", "runway", "path", "anchor")
    forbidden_content = [
        entry.name for entry in root.children_recursive
        if any(token in entry.name.lower() for token in forbidden_name_tokens)
    ]
    texture_or_normal_nodes = [
        node.bl_idname for node in neutral.node_tree.nodes
        if node.bl_idname in {"ShaderNodeTexImage", "ShaderNodeNormalMap", "ShaderNodeEmission"}
    ]
    if actual_source_roots != [source_root_name(name) for name in selected_source_names()]:
        raise ValueError(f"candidate root contains unexpected source objects: {actual_source_roots}")
    if material_names != [neutral.name] or game_id_objects or forbidden_content or texture_or_normal_nodes:
        raise ValueError("candidate breached the neutral-source boundary")
    metadata_path = output_dir / "candidate-metadata.json"
    stable_json(metadata_path, candidate_metadata)
    validation = {
        "status": "pass",
        "stage": "sourcing_complete",
        "approved": False,
        "root": root.name,
        "selectedSourceFiles": list(selected_source_names()),
        "selectedSourceCount": len(actual_source_roots),
        "materialCount": len(material_names),
        "materialNames": material_names,
        "candidateGlb": str(candidate_glb.relative_to(REPO_ROOT)),
        "candidateBlend": str(blend_path.relative_to(REPO_ROOT)),
        "firstGlb": str(raw_glb_path.relative_to(REPO_ROOT)),
        "forbiddenContentFound": forbidden_content,
        "noGameIds": not game_id_objects,
        "noProjectAuthoredGroundPathOrAnchors": not forbidden_content,
        "noNormalOrEmissiveWiring": not texture_or_normal_nodes,
        "triangleCounts": {source_name: reports[source_name]["triangleCount"] for source_name in selected_source_names()},
    }
    if validation["triangleCounts"] != EXPECTED_TRIANGLES:
        raise ValueError(f"unexpected source triangle counts: {validation['triangleCounts']}")
    validation_path = output_dir / "candidate-validation.json"
    stable_json(validation_path, validation)
    return [candidate_glb, metadata_path, validation_path, contact_sheet, *preview_paths]


def write_manifest(manifest_path: Path, source_inputs: list[dict[str, object]], output_paths: list[Path]) -> None:
    update_job_stage()
    job_record = file_record(JOB_PATH)
    manifest = {
        "manifestId": "dc9-memphis-legacy-source-sourcing-complete",
        "jobId": "dc9-memphis-legacy-source",
        "stage": "sourcing_complete",
        "createdAt": "2026-08-28T00:00:00Z",
        "sourceVariant": "Ted Davis KMEM X-Plane scenery revision 2019-01-22",
        "targetVariant": "1995 Memphis memory recreation",
        "variantScope": "common",
        "artifactBasePath": str(REPO_ROOT),
        "inputs": [*source_inputs, job_record],
        "outputs": [file_record(path) for path in output_paths],
        "approval": {
            "approved": False,
            "approvedBy": "owner-source-review-pending",
            "notes": "Sourcing complete only. The owner Source Review Gate must approve this source-only candidate before Agent 2 assembly.",
        },
    }
    stable_json(manifest_path, manifest)


def main() -> int:
    args = parse_args(cli_arguments())
    source_dir = args.source_dir.resolve()
    working_dir = args.working_dir.resolve()
    output_dir = args.output_dir.resolve()
    manifest_path = args.manifest.resolve()
    source_inputs = verify_task1_authority(source_dir)
    output_paths = run_blender_generation(source_dir, working_dir, output_dir)
    write_manifest(manifest_path, source_inputs, output_paths)
    print(f"Source-only candidate ready for owner review: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
