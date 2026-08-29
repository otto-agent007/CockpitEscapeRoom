"""Shade the approved neutral KMEM legacy assembly for owner review only.

This script is intentionally fail-closed.  It only accepts the exact Task 7
assembly approval and the six immutable Task 6 source files.  Its output is a
review candidate; it never promotes a production asset or records approval.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import sys
import traceback
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
ASSEMBLY_APPROVAL_PATH = REPO_ROOT / "art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/assembly-approval.json"
ASSEMBLY_MANIFEST_PATH = REPO_ROOT / "art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/manifests/assembly-complete.json"
NEUTRAL_BLEND_PATH = REPO_ROOT / "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/dc9-memphis-legacy-neutral.blend"
NEUTRAL_GLB_PATH = REPO_ROOT / "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/dc9-memphis-legacy-neutral.glb"
NEUTRAL_PREVIEW_DIR = REPO_ROOT / "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews"
SOURCE_DIR = REPO_ROOT / ".cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/Memphis_Nashville/KMEM"
OUTPUT_DIR = REPO_ROOT / "art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading"
PRODUCTION_BLEND_PATH = REPO_ROOT / "art-source/blender/dc9-memphis-legacy-departure.blend"
MATERIAL_GATE_PATH = REPO_ROOT / "art-source/cockpit-pipeline/gates/dc9-memphis-legacy-material-optimization.json"
SHADING_MANIFEST_PATH = REPO_ROOT / "art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-shading/manifests/shading-complete.json"
CREATED_AT = "2026-08-28T00:00:00Z"

EXPECTED_APPROVAL = {
    "approvalId": "dc9-memphis-legacy-assembly-approval-002",
    "jobId": "dc9-memphis-legacy-assembly",
    "sourceJobId": "dc9-memphis-legacy-source",
    "stage": "assembly-approved",
    "approved": True,
    "approvedBy": "owner review 2026-08-28 (canopy-bearing windshield and 36 mm previews reviewed in session)",
    "assemblyManifest": "art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/manifests/assembly-complete.json",
    "assemblyManifestSha256": "56d8b53c423d1d92d1659af24d27851e7a3fd11d24403ee34c93d02e8968d571",
}
EXPECTED_APPROVED_ARTIFACTS = {
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/dc9-memphis-legacy-neutral.blend": "ce79b2b9373c9f2cd213f679d24603aba6d00162b750c8bd257a053cafc93e15",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/dc9-memphis-legacy-neutral.glb": "8c7b2b9e3d008b11fc3df76b02cafc64cc3e7c80d05adf186b794970d55c26e3",
    "art-source/cockpit-pipeline/gates/dc9-memphis-legacy-runtime-contract.json": "1506c791dc2b4e5681eb079a7de3690cec28425d65ec3f619b29d7416e2092a6",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/resolved-layout.json": "bed9742136ccc2ff1a2c1aabdae444de6002ecdadfe6d57210193b3046d1438b",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/node-pivot-report.json": "cd2d97bd91f1698b28a68461f15813a68c262ffc09587e66f9363317b966bb3c",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews/neutral-1440.png": "226e306eb286352f030033e4505ea8d3ff792d8403c08847a6b13ce0dfe95c80",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews/neutral-768.png": "322bd2e784e04ed95cab0ea432e40304a2f581f9bab09875dd1b6a85c197fcb4",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews/neutral-375.png": "de1dc86cbcf68fe524c0db746c5f09daff4c79ecfa9e988c9d7666c69e1ca7ea",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews/windshield-ramp-start-1440.png": "65a136ac3f75a1f3f94ea05f0e466e0b2e34d33335381b37c54f5c6f16194961",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews/windshield-ramp-start-768.png": "54cb0928cfb34b91e894ad761e8fea2c35eb1d7ea479b7fdf26c120afda04670",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews/windshield-ramp-start-375.png": "99d606f7c4d1f424042962181b44c7a88bbcead0860c60f033096b220ae75da8",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews/windshield-hold-short-1440.png": "9a07a1e71e2e509ad7c63110cd9a19391f836d1f943bd91a61f968247460cf21",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews/windshield-runway-lineup-1440.png": "fbee94fd0eb30fb10140f08ca6bd73bdbdd3bc3079b057460cc5348b2e5b228f",
    "art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/previews/windshield-takeoff-roll-1440.png": "8da35ed39f907f0fd761bde757a5a9304d9adea12a52914557b78c5878755dc5",
}
SOURCE_HASHES = {
    "ConcourseB.obj": "e88ab8411a033d5996c53053b14a894ff9824380a76891b27659549a7e9e6424",
    "ConcourseB_2.obj": "e4bb0f830c515d9c5a42cfe60bce5eb4dc3fb6ba5fdce6ca9c66d16ef49f7000",
    "ConcourseB_2e.obj": "2bf6f39b0e5e1f6a2e24fefb9469fc1c598884ddcfefc9f20b825cac375a109d",
    "KMEMterminal.png": "416c081c5e9f9ca40b183477da54f7ec8c5baa62ae0b9c0bdd961329ac394505",
    "KMEMterminal_LIT.png": "6a561147ceae328b311fba38de849d3102a4d2eb1238c3ddbbfb2315b7cf91e5",
    "KMEMterminal_NML.png": "9e1f272c64807981bee997aa08e7a3273ab5c4242f4ff58fb92cc20b1f8bf7e8",
}
ANCHOR_GAME_IDS = {
    "KMEM_RAMP_START": "dc9.memphis.rampStart",
    "KMEM_TAXI_TURN": "dc9.memphis.taxiTurn",
    "KMEM_HOLD_SHORT": "dc9.memphis.holdShort",
    "KMEM_RUNWAY_LINEUP": "dc9.memphis.runwayLineup",
    "KMEM_INITIAL_CLIMB": "dc9.memphis.initialClimb",
}
SOURCE_OBJECTS = {
    "OBJ8_CONCOURSEB_RANGE_001": "ConcourseB.obj",
    "OBJ8_CONCOURSEB_2_RANGE_001": "ConcourseB_2.obj",
    "OBJ8_CONCOURSEB_2E_RANGE_001": "ConcourseB_2e.obj",
}
OPTIMIZATION_DECISION = (
    "Preservation-first shading only. Restored approved OBJ8 UV coordinates and wired the exact selected "
    "2048x1024 base-color, normal, and lit maps; preserved mesh topology, names, hierarchy, transforms, "
    "pivots, and custom properties. No mesh joining, decimation, texture resizing, rebake, or destructive "
    "GLB optimization was used."
)
REVIEW_LIGHTING_GRADE = {
    "exposure": -0.2,
    "backgroundColor": (0.075, 0.085, 0.10, 1.0),
    "backgroundStrength": 0.32,
    "sunEnergy": 1.65,
    "sunColor": (1.0, 0.78, 0.58),
    "fillEnergy": 1350,
    "fillColor": (0.45, 0.58, 0.78),
}
# 2026-08-28 terminal-composition re-shading: same owner-ruled restrained grade,
# regenerated over the approved west-frontage assembly with the canopy accent.
RESTORED_SHADED_BLEND_SHA256 = "cb9ed896e4c248b2ad9c194619a01fb9442eefb4a2745254153982acabe991e6"
RESTORED_SHADED_GLB_SHA256 = "4732f1dcfff0f999ed77cb008b225b7d980be210553397f267554cd0c71045be"


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


def resolve_repo_path(path: Path) -> Path:
    return (path if path.is_absolute() else REPO_ROOT / path).resolve()


def parse_args(arguments: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Shade only the exact approved Task 7 Memphis assembly.")
    parser.add_argument("--assembly-approval", required=True, type=Path)
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--material-gate", required=True, type=Path)
    parser.add_argument("--validate-shaded-master", action="store_true")
    return parser.parse_args(arguments)


def cli_arguments() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def require_exact_paths(args: argparse.Namespace) -> None:
    actual = tuple(resolve_repo_path(path) for path in (
        args.assembly_approval, args.source_dir, args.output_dir, args.material_gate,
    ))
    expected = tuple(path.resolve() for path in (
        ASSEMBLY_APPROVAL_PATH, SOURCE_DIR, OUTPUT_DIR, MATERIAL_GATE_PATH,
    ))
    labels = ("assembly approval", "source directory", "output directory", "material gate")
    for label, received, allowed in zip(labels, actual, expected, strict=True):
        if received != allowed:
            raise ValueError(f"{label} must resolve to the approved Task 8 path: {allowed}")


def verify_file_record(record: dict[str, Any]) -> None:
    path = (REPO_ROOT / str(record.get("path", ""))).resolve()
    try:
        path.relative_to(REPO_ROOT)
    except ValueError as error:
        raise ValueError(f"approval record leaves repository: {path}") from error
    if not path.is_file():
        raise ValueError(f"approved assembly artifact is missing: {path}")
    if path.stat().st_size != record.get("bytes") or sha256_file(path) != record.get("sha256"):
        raise ValueError(f"approved assembly artifact does not match its exact hash record: {record.get('path')}")


def verify_approved_assembly(expected_loaded_blend: Path | None = NEUTRAL_BLEND_PATH) -> dict[str, Any]:
    if expected_loaded_blend is not None and Path(__import__("bpy").data.filepath).resolve() != expected_loaded_blend.resolve():
        raise ValueError(f"Blender must load the exact approved blend: {expected_loaded_blend}")
    approval = json.loads(ASSEMBLY_APPROVAL_PATH.read_text(encoding="utf-8"))
    for key, expected in EXPECTED_APPROVAL.items():
        if approval.get(key) != expected:
            raise ValueError(f"Task 7 assembly approval changed at {key}")
    records = approval.get("approvedArtifacts")
    if not isinstance(records, list):
        raise ValueError("Task 7 assembly approval has no approved artifact records")
    actual_artifacts = {str(record.get("path")): str(record.get("sha256")) for record in records}
    if actual_artifacts != EXPECTED_APPROVED_ARTIFACTS:
        raise ValueError("Task 7 assembly approval artifact set or hashes changed")
    if sha256_file(ASSEMBLY_MANIFEST_PATH) != EXPECTED_APPROVAL["assemblyManifestSha256"]:
        raise ValueError("Task 7 assembly manifest no longer matches the approved hash")
    manifest = json.loads(ASSEMBLY_MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("stage") != "assembly_complete" or manifest.get("jobId") != "dc9-memphis-legacy-assembly":
        raise ValueError("Task 7 assembly manifest identity changed")
    manifest_outputs = {record["path"]: record["sha256"] for record in manifest.get("outputs", [])}
    for record in records:
        if manifest_outputs.get(record["path"]) != record["sha256"]:
            raise ValueError(f"Task 7 approval is not bound to its manifest: {record['path']}")
        verify_file_record(record)
    for name, expected_hash in SOURCE_HASHES.items():
        path = SOURCE_DIR / name
        if not path.is_file() or sha256_file(path) != expected_hash:
            raise ValueError(f"selected Task 6 source changed: {name}")
    return approval


def approved_hashes(approval: dict[str, Any]) -> dict[str, str]:
    return {record["path"]: sha256_file(REPO_ROOT / record["path"]) for record in approval["approvedArtifacts"]}


def clean_property(value: Any) -> Any:
    if hasattr(value, "to_list"):
        return clean_property(value.to_list())
    if isinstance(value, (list, tuple)):
        return [clean_property(entry) for entry in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def object_contract(root: Any) -> dict[str, dict[str, Any]]:
    objects = [root, *root.children_recursive]
    for obj in objects:
        if obj.type == "MESH":
            obj.data.calc_loop_triangles()
    return {
        obj.name: {
            "parent": obj.parent.name if obj.parent else None,
            "type": obj.type,
            "location": [float(value) for value in obj.location],
            "rotation": [float(value) for value in obj.rotation_euler],
            "scale": [float(value) for value in obj.scale],
            "extras": {key: clean_property(value) for key, value in sorted(obj.items())},
            "triangleCount": len(obj.data.loop_triangles) if obj.type == "MESH" else 0,
        }
        for obj in objects
    }


def close_values(left: list[float], right: list[float], tolerance: float = 1e-5) -> bool:
    return len(left) == len(right) and all(abs(float(a) - float(b)) <= tolerance for a, b in zip(left, right, strict=True))


def compare_contract(before: dict[str, dict[str, Any]], after: dict[str, dict[str, Any]]) -> list[str]:
    failures: list[str] = []
    if set(before) != set(after):
        failures.append(f"object-name set changed: missing={sorted(set(before) - set(after))}; added={sorted(set(after) - set(before))}")
    for name in sorted(set(before) & set(after)):
        wanted = before[name]
        actual = after[name]
        for key in ("parent", "type", "extras", "triangleCount"):
            if actual[key] != wanted[key]:
                failures.append(f"{name} {key} changed")
        if name == "KMEM_LEGACY_ROOT" or name in ANCHOR_GAME_IDS:
            for key in ("location", "rotation", "scale"):
                if not close_values(wanted[key], actual[key]):
                    failures.append(f"runtime anchor {name} {key} changed: {actual[key]} != {wanted[key]}")
    return failures


def compare_blend_contract(before: dict[str, dict[str, Any]], after: dict[str, dict[str, Any]]) -> list[str]:
    failures = compare_contract(before, after)
    for name in sorted(set(before) & set(after)):
        for key in ("location", "rotation", "scale"):
            if not close_values(before[name][key], after[name][key]):
                message = f"approved blend transform {name} {key} changed: {after[name][key]} != {before[name][key]}"
                if message not in failures:
                    failures.append(message)
    return failures


def restore_obj8_uvs(bpy: Any) -> list[dict[str, Any]]:
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))
    from tools.blender.cockpit_pipeline.xplane_obj8_convert import evaluated_vertices, is_degenerate_triangle, parse_obj8

    reports: list[dict[str, Any]] = []
    for object_name, source_name in SOURCE_OBJECTS.items():
        obj = bpy.data.objects.get(object_name)
        if obj is None or obj.type != "MESH":
            raise ValueError(f"approved source mesh is missing: {object_name}")
        parsed = parse_obj8(SOURCE_DIR / source_name, {})
        if len(parsed.draws) != 1:
            raise ValueError(f"expected exactly one draw range in {source_name}")
        draw_vertices = list(evaluated_vertices(parsed, parsed.draws[0]))
        unique_order: list[int] = []
        uv_by_index: dict[int, tuple[float, float]] = {}
        for start in range(0, len(draw_vertices), 3):
            source_triangle = draw_vertices[start : start + 3]
            if is_degenerate_triangle([entry[2] for entry in source_triangle]):
                continue
            for original_index, vertex, _position, _normal in source_triangle:
                if original_index not in uv_by_index:
                    unique_order.append(original_index)
                    uv_by_index[original_index] = tuple(vertex.uv)
        if len(unique_order) != len(obj.data.vertices):
            raise ValueError(f"UV restoration vertex contract changed for {object_name}")
        while obj.data.uv_layers:
            obj.data.uv_layers.remove(obj.data.uv_layers[0])
        uv_layer = obj.data.uv_layers.new(name="UVMap")
        ordered_uvs = [uv_by_index[index] for index in unique_order]
        for polygon in obj.data.polygons:
            for loop_index in polygon.loop_indices:
                vertex_index = obj.data.loops[loop_index].vertex_index
                uv_layer.data[loop_index].uv = ordered_uvs[vertex_index]
        obj.data.update()
        reports.append({
            "object": object_name,
            "sourceFile": source_name,
            "uvLayer": uv_layer.name,
            "vertexCount": len(obj.data.vertices),
            "triangleCount": len(obj.data.polygons),
            "method": "exact approved OBJ8 VT coordinates restored by original source vertex index",
        })
    return reports


def make_terminal_material(bpy: Any) -> tuple[Any, list[dict[str, Any]]]:
    material = bpy.data.materials.get("KMEM_SOURCE_NEUTRAL_BASE_COLOR")
    if material is None:
        raise ValueError("neutral source material is missing")
    material.name = "KMEM_TERMINAL_MEMORY_1995"
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    principled.inputs["Roughness"].default_value = 0.78
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Specular IOR Level"].default_value = 0.26
    material.node_tree.links.new(principled.outputs["BSDF"], output.inputs["Surface"])

    texture_specs = (
        ("KMEMterminal.png", "KMEM_TERMINAL_BASE_COLOR", "sRGB", "base color"),
        ("KMEMterminal_NML.png", "KMEM_TERMINAL_NORMAL", "Non-Color", "normal"),
        ("KMEMterminal_LIT.png", "KMEM_TERMINAL_LIT_RESTRAINED", "sRGB", "restrained emissive support"),
    )
    image_nodes: dict[str, Any] = {}
    reports: list[dict[str, Any]] = []
    for filename, node_name, colorspace, usage in texture_specs:
        source_path = SOURCE_DIR / filename
        image = bpy.data.images.load(str(source_path), check_existing=True)
        image.name = Path(filename).stem
        image.colorspace_settings.name = colorspace
        image.pack()
        texture = nodes.new("ShaderNodeTexImage")
        texture.name = node_name
        texture.label = usage
        texture.image = image
        image_nodes[filename] = texture
        width, height = (int(value) for value in image.size[:])
        if (width, height) != (2048, 1024):
            raise ValueError(f"selected texture dimensions changed: {filename} is {width}x{height}")
        reports.append({
            "name": image.name,
            "path": str(source_path.relative_to(REPO_ROOT)),
            "sha256": sha256_file(source_path),
            "width": width,
            "height": height,
            "colorspace": colorspace,
            "packed": bool(image.packed_file),
            "usage": usage,
            "resized": False,
        })

    material.node_tree.links.new(image_nodes["KMEMterminal.png"].outputs["Color"], principled.inputs["Base Color"])
    material.node_tree.links.new(image_nodes["KMEMterminal.png"].outputs["Alpha"], principled.inputs["Alpha"])
    normal = nodes.new("ShaderNodeNormalMap")
    normal.name = "KMEM_TERMINAL_NORMAL_STRENGTH"
    normal.inputs["Strength"].default_value = 0.35
    material.node_tree.links.new(image_nodes["KMEMterminal_NML.png"].outputs["Color"], normal.inputs["Color"])
    material.node_tree.links.new(normal.outputs["Normal"], principled.inputs["Normal"])
    material.node_tree.links.new(image_nodes["KMEMterminal_LIT.png"].outputs["Color"], principled.inputs["Emission Color"])
    principled.inputs["Emission Strength"].default_value = 0.045
    return material, reports


def make_surface_material(bpy: Any, name: str, color: tuple[float, float, float, float], roughness: float) -> Any:
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled is None:
        raise ValueError(f"material has no Principled BSDF: {name}")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Roughness"].default_value = roughness
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Specular IOR Level"].default_value = 0.18
    return material


def assign_material(obj: Any, material: Any) -> None:
    obj.data.materials.clear()
    obj.data.materials.append(material)


def shade_scene(bpy: Any) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    uv_report = restore_obj8_uvs(bpy)
    terminal, texture_report = make_terminal_material(bpy)
    for name in SOURCE_OBJECTS:
        assign_material(bpy.data.objects[name], terminal)

    neutral_ground = bpy.data.materials.get("KMEM_NEUTRAL_GROUND")
    if neutral_ground is None:
        raise ValueError("neutral ground material is missing")
    neutral_ground.name = "KMEM_RAMP_MATERIAL"
    ramp = make_surface_material(bpy, "KMEM_RAMP_MATERIAL", (0.155, 0.17, 0.17, 1.0), 0.92)
    taxi = make_surface_material(bpy, "KMEM_TAXI_MATERIAL", (0.105, 0.115, 0.12, 1.0), 0.94)
    runway = make_surface_material(bpy, "KMEM_RUNWAY_MATERIAL", (0.072, 0.078, 0.082, 1.0), 0.95)
    route = bpy.data.materials.get("KMEM_NEUTRAL_ROUTE_CENTERLINE")
    if route is None:
        raise ValueError("neutral route material is missing")
    route.name = "KMEM_FADED_RUNWAY_CENTERLINE"
    route = make_surface_material(bpy, route.name, (0.49, 0.44, 0.25, 1.0), 0.9)
    canopy = make_surface_material(bpy, "KMEM_CANOPY_MATERIAL", (0.88, 0.855, 0.80, 1.0), 0.82)
    assign_material(bpy.data.objects["KMEM_RAMP"], ramp)
    assign_material(bpy.data.objects["KMEM_TAXI_SURFACE"], taxi)
    assign_material(bpy.data.objects["KMEM_RUNWAY_SURFACE"], runway)
    assign_material(bpy.data.objects["KMEM_TERMINAL_APRON"], ramp)
    assign_material(bpy.data.objects["KMEM_TERMINAL_CANOPY"], canopy)
    for index in range(1, 10):
        assign_material(bpy.data.objects[f"KMEM_CENTERLINE_{index:02d}"], route)

    assignments = [
        {"material": terminal.name, "objects": sorted(SOURCE_OBJECTS), "role": "approved Concourse B base color + normal + restrained lit support"},
        {"material": ramp.name, "objects": ["KMEM_RAMP", "KMEM_TERMINAL_APRON"], "role": "matte project-owned ramp and terminal apron"},
        {"material": taxi.name, "objects": ["KMEM_TAXI_SURFACE"], "role": "matte project-owned taxi surface"},
        {"material": runway.name, "objects": ["KMEM_RUNWAY_SURFACE"], "role": "matte project-owned runway surface"},
        {"material": route.name, "objects": [f"KMEM_CENTERLINE_{index:02d}" for index in range(1, 10)], "role": "faded non-emissive route centerline"},
        {"material": canopy.name, "objects": ["KMEM_TERMINAL_CANOPY"], "role": "matte off-white martini-glass canopy accent"},
    ]
    return uv_report, texture_report, assignments


def configure_review_scene(bpy: Any) -> None:
    from mathutils import Vector

    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.resolution_percentage = 100
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = REVIEW_LIGHTING_GRADE["exposure"]
    world = scene.world or bpy.data.worlds.new("KMEM_MEMORY_REVIEW_WORLD")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = REVIEW_LIGHTING_GRADE["backgroundColor"]
    background.inputs["Strength"].default_value = REVIEW_LIGHTING_GRADE["backgroundStrength"]

    for obj in list(bpy.data.objects):
        if obj.type == "LIGHT" and obj.name.startswith("KMEM_MEMORY_REVIEW_"):
            bpy.data.objects.remove(obj, do_unlink=True)
    sun_data = bpy.data.lights.new("KMEM_MEMORY_REVIEW_SUN_DATA", "SUN")
    sun_data.energy = REVIEW_LIGHTING_GRADE["sunEnergy"]
    sun_data.color = REVIEW_LIGHTING_GRADE["sunColor"]
    sun_data.angle = math.radians(18.0)
    sun = bpy.data.objects.new("KMEM_MEMORY_REVIEW_SUN", sun_data)
    sun.rotation_euler = (math.radians(28.0), math.radians(-18.0), math.radians(-32.0))
    bpy.context.collection.objects.link(sun)
    fill_data = bpy.data.lights.new("KMEM_MEMORY_REVIEW_FILL_DATA", "AREA")
    fill_data.energy = REVIEW_LIGHTING_GRADE["fillEnergy"]
    fill_data.shape = "DISK"
    fill_data.size = 120.0
    fill_data.color = REVIEW_LIGHTING_GRADE["fillColor"]
    fill = bpy.data.objects.new("KMEM_MEMORY_REVIEW_FILL", fill_data)
    fill.location = Vector((-80.0, -80.0, 180.0))
    fill.rotation_euler = (Vector((-40.0, 170.0, 0.0)) - fill.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.collection.objects.link(fill)


def make_wipe_comparison(bpy: Any, neutral_path: Path, shaded_path: Path, output_path: Path) -> None:
    neutral = bpy.data.images.load(str(neutral_path.resolve()), check_existing=False)
    shaded = bpy.data.images.load(str(shaded_path.resolve()), check_existing=False)
    width, height = (int(value) for value in shaded.size[:])
    if tuple(neutral.size[:]) != (width, height):
        raise ValueError(f"neutral and shaded comparison dimensions differ for {width}px review")
    pixel_count = width * height * 4
    neutral_pixels = [0.0] * pixel_count
    shaded_pixels = [0.0] * pixel_count
    neutral.pixels.foreach_get(neutral_pixels)
    shaded.pixels.foreach_get(shaded_pixels)
    result = list(shaded_pixels)
    divider = max(1, width // 360)
    split = width // 2
    for row in range(height):
        row_offset = row * width * 4
        for column in range(split):
            offset = row_offset + column * 4
            result[offset : offset + 4] = neutral_pixels[offset : offset + 4]
        for column in range(max(0, split - divider), min(width, split + divider + 1)):
            offset = row_offset + column * 4
            result[offset : offset + 4] = (0.86, 0.64, 0.25, 1.0)
    comparison = bpy.data.images.new(f"KMEM_COMPARISON_{width}", width=width, height=height, alpha=False)
    comparison.pixels.foreach_set(result)
    comparison.filepath_raw = str(output_path.resolve())
    comparison.file_format = "PNG"
    comparison.save()
    bpy.data.images.remove(neutral)
    bpy.data.images.remove(shaded)
    bpy.data.images.remove(comparison)


def render_previews(bpy: Any, output_dir: Path) -> list[Path]:
    scene = bpy.context.scene
    camera = bpy.data.objects.get("CAM_KMEM_NEUTRAL_REVIEW")
    if camera is None or camera.type != "CAMERA" or abs(camera.data.lens - 36.0) > 1e-6:
        raise ValueError("approved 36 mm Task 7 review camera changed")
    scene.camera = camera
    outputs: list[Path] = []
    for width, height in ((1440, 900), (768, 480), (375, 234)):
        scene.render.resolution_x = width
        scene.render.resolution_y = height
        shaded = output_dir / "previews" / f"shaded-{width}.png"
        shaded.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(shaded.resolve())
        bpy.ops.render.render(write_still=True)
        comparison = output_dir / "previews" / f"comparison-{width}.png"
        make_wipe_comparison(bpy, NEUTRAL_PREVIEW_DIR / f"neutral-{width}.png", shaded, comparison)
        outputs.extend((shaded, comparison))
    return outputs


def export_candidate(bpy: Any, root: Any, output_dir: Path) -> tuple[Path, Path]:
    blend_path = output_dir / "dc9-memphis-legacy-shaded.blend"
    glb_path = output_dir / "dc9-memphis-legacy-shaded.glb"
    bpy.context.preferences.filepaths.save_version = 0
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
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_apply=True,
        export_tangents=True,
    )
    return blend_path, glb_path


def reimport_validation(bpy: Any, glb_path: Path, before: dict[str, dict[str, Any]]) -> dict[str, Any]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb_path.resolve()))
    root = bpy.data.objects.get("KMEM_LEGACY_ROOT")
    if root is None:
        raise ValueError("shaded GLB did not reimport KMEM_LEGACY_ROOT")
    after = object_contract(root)
    failures = compare_contract(before, after)
    names = list(after)
    prohibited = sorted(name for name in names if any(token in name.lower() for token in ("autogate", "opensceneryx", "planes")))
    if prohibited:
        failures.append(f"excluded library names reappeared: {prohibited}")
    for name, game_id in ANCHOR_GAME_IDS.items():
        if after.get(name, {}).get("extras", {}).get("game_id") != game_id:
            failures.append(f"anchor game ID changed: {name}")
    for name, record in after.items():
        transform = [*record["location"], *record["rotation"], *record["scale"]]
        if not all(math.isfinite(value) for value in transform):
            failures.append(f"non-finite transform after reimport: {name}")
        extras = record["extras"]
        if any(key in extras for key in ("interaction", "input_axis", "control_id", "cockpit_control")):
            failures.append(f"interactive cockpit metadata found: {name}")
    triangle_count = sum(record["triangleCount"] for record in after.values())
    material_count = len(bpy.data.materials)
    if triangle_count > 5000:
        failures.append(f"triangle budget exceeded: {triangle_count}")
    if material_count > 6:
        failures.append(f"material budget exceeded: {material_count}")
    if glb_path.stat().st_size > 8 * 1024 * 1024:
        failures.append(f"GLB byte budget exceeded: {glb_path.stat().st_size}")
    report = {
        "status": "pass" if not failures else "fail",
        "root": root.name,
        "objectCount": len(after),
        "triangleCount": triangle_count,
        "materialCount": material_count,
        "glbSizeBytes": glb_path.stat().st_size,
        "requiredNamesPreservedExactlyOnce": all(names.count(name) == 1 for name in ["KMEM_LEGACY_ROOT", "KMEM_CONCOURSE_B", "KMEM_RAMP", "KMEM_TAXI_SURFACE", "KMEM_RUNWAY_SURFACE", "KMEM_TERMINAL_APRON", "KMEM_TERMINAL_CANOPY", *ANCHOR_GAME_IDS]),
        "hierarchyTransformsAndExtrasPreserved": not compare_contract(before, after),
        "anchorGameIdsPreserved": all(after.get(name, {}).get("extras", {}).get("game_id") == game_id for name, game_id in ANCHOR_GAME_IDS.items()),
        "noInteractiveCockpitMetadata": not any(any(key in record["extras"] for key in ("interaction", "input_axis", "control_id", "cockpit_control")) for record in after.values()),
        "excludedLibraryNames": prohibited,
        "failures": failures,
    }
    if failures:
        raise ValueError("; ".join(failures))
    return report


def _camera_contract(bpy: Any) -> dict[str, Any]:
    camera = bpy.data.objects.get("CAM_KMEM_NEUTRAL_REVIEW")
    if camera is None or camera.type != "CAMERA":
        raise ValueError("approved review camera is missing")
    return {
        "location": [float(value) for value in camera.location],
        "rotation": [float(value) for value in camera.rotation_euler],
        "scale": [float(value) for value in camera.scale],
        "lens": float(camera.data.lens),
    }


def _linked_from(input_socket: Any, node_name: str, output_name: str) -> bool:
    return len(input_socket.links) == 1 and input_socket.links[0].from_node.name == node_name and input_socket.links[0].from_socket.name == output_name


def validate_shaded_master(bpy: Any) -> dict[str, Any]:
    """Read-only semantic validation of the freshly regenerated shaded master."""
    candidate_blend_path = OUTPUT_DIR / "dc9-memphis-legacy-shaded.blend"
    blend_path = Path(bpy.data.filepath).resolve()
    glb_path = OUTPUT_DIR / "dc9-memphis-legacy-shaded.glb"
    allowed_blend_paths = {candidate_blend_path.resolve(), PRODUCTION_BLEND_PATH.resolve()}
    if blend_path not in allowed_blend_paths:
        raise ValueError(f"semantic validation must load the candidate or promoted shaded master: {sorted(str(path) for path in allowed_blend_paths)}")
    if sha256_file(blend_path) != RESTORED_SHADED_BLEND_SHA256:
        raise ValueError("current shaded blend no longer matches the controller-ruled regenerated master hash")
    if sha256_file(glb_path) != RESTORED_SHADED_GLB_SHA256:
        raise ValueError("current shaded GLB no longer matches the owner-selected restrained candidate hash")

    approval = verify_approved_assembly(expected_loaded_blend=None)
    before_approved_hashes = approved_hashes(approval)

    bpy.ops.wm.open_mainfile(filepath=str(NEUTRAL_BLEND_PATH.resolve()))
    neutral_root = bpy.data.objects.get("KMEM_LEGACY_ROOT")
    if neutral_root is None:
        raise ValueError("approved neutral blend lost KMEM_LEGACY_ROOT")
    neutral_contract = object_contract(neutral_root)
    neutral_camera = _camera_contract(bpy)

    bpy.ops.wm.open_mainfile(filepath=str(blend_path.resolve()))
    root = bpy.data.objects.get("KMEM_LEGACY_ROOT")
    if root is None:
        raise ValueError("shaded master lost KMEM_LEGACY_ROOT")
    current_contract = object_contract(root)
    current_camera = _camera_contract(bpy)
    failures = compare_blend_contract(neutral_contract, current_contract)
    for key in ("location", "rotation", "scale"):
        if not close_values(neutral_camera[key], current_camera[key]):
            failures.append(f"review camera {key} changed")
    if current_camera["lens"] != 36.0 or current_camera["lens"] != neutral_camera["lens"]:
        failures.append(f"review camera lens changed: {current_camera['lens']}")

    scene = bpy.context.scene
    if abs(float(scene.view_settings.exposure) - REVIEW_LIGHTING_GRADE["exposure"]) > 1e-6:
        failures.append("review exposure does not match the restored restrained preset")
    world = scene.world
    background = world.node_tree.nodes.get("Background") if world and world.use_nodes else None
    if background is None:
        failures.append("review world background node is missing")
    else:
        if not close_values(list(background.inputs["Color"].default_value), list(REVIEW_LIGHTING_GRADE["backgroundColor"])):
            failures.append("review world color does not match the restored restrained preset")
        if abs(float(background.inputs["Strength"].default_value) - REVIEW_LIGHTING_GRADE["backgroundStrength"]) > 1e-6:
            failures.append("review world strength does not match the restored restrained preset")

    expected_lights = {
        "KMEM_MEMORY_REVIEW_SUN": ("SUN", REVIEW_LIGHTING_GRADE["sunEnergy"], REVIEW_LIGHTING_GRADE["sunColor"]),
        "KMEM_MEMORY_REVIEW_FILL": ("AREA", REVIEW_LIGHTING_GRADE["fillEnergy"], REVIEW_LIGHTING_GRADE["fillColor"]),
    }
    actual_review_lights = sorted(obj.name for obj in bpy.data.objects if obj.type == "LIGHT" and obj.name.startswith("KMEM_MEMORY_REVIEW_"))
    if actual_review_lights != sorted(expected_lights):
        failures.append(f"review-light set changed: {actual_review_lights}")
    for name, (light_type, energy, color) in expected_lights.items():
        light = bpy.data.objects.get(name)
        if light is None:
            continue
        if light.data.type != light_type or abs(float(light.data.energy) - energy) > 1e-6 or not close_values(list(light.data.color), list(color)):
            failures.append(f"review light changed: {name}")

    expected_assignments = {
        **{name: "KMEM_TERMINAL_MEMORY_1995" for name in SOURCE_OBJECTS},
        "KMEM_RAMP": "KMEM_RAMP_MATERIAL",
        "KMEM_TAXI_SURFACE": "KMEM_TAXI_MATERIAL",
        "KMEM_RUNWAY_SURFACE": "KMEM_RUNWAY_MATERIAL",
        "KMEM_TERMINAL_APRON": "KMEM_RAMP_MATERIAL",
        "KMEM_TERMINAL_CANOPY": "KMEM_CANOPY_MATERIAL",
        **{f"KMEM_CENTERLINE_{index:02d}": "KMEM_FADED_RUNWAY_CENTERLINE" for index in range(1, 10)},
    }
    material_names = sorted(material.name for material in bpy.data.materials)
    expected_material_names = sorted(set(expected_assignments.values()))
    if material_names != expected_material_names:
        failures.append(f"material set changed: {material_names}")
    for object_name, material_name in expected_assignments.items():
        obj = bpy.data.objects.get(object_name)
        actual = [material.name for material in obj.data.materials] if obj and obj.type == "MESH" else []
        if actual != [material_name]:
            failures.append(f"material assignment changed: {object_name} -> {actual}")

    terminal = bpy.data.materials.get("KMEM_TERMINAL_MEMORY_1995")
    if terminal is None or not terminal.use_nodes:
        failures.append("terminal material or node tree is missing")
    else:
        nodes = terminal.node_tree.nodes
        principled = nodes.get("Principled BSDF")
        normal = nodes.get("KMEM_TERMINAL_NORMAL_STRENGTH")
        expected_images = {
            "KMEM_TERMINAL_BASE_COLOR": ("KMEMterminal", "KMEMterminal.png", "sRGB", "Base Color", "Color"),
            "KMEM_TERMINAL_NORMAL": ("KMEMterminal_NML", "KMEMterminal_NML.png", "Non-Color", None, None),
            "KMEM_TERMINAL_LIT_RESTRAINED": ("KMEMterminal_LIT", "KMEMterminal_LIT.png", "sRGB", "Emission Color", "Color"),
        }
        if principled is None or normal is None:
            failures.append("terminal Principled or normal-map node is missing")
        else:
            if abs(float(normal.inputs["Strength"].default_value) - 0.35) > 1e-6:
                failures.append("terminal normal strength changed")
            if abs(float(principled.inputs["Emission Strength"].default_value) - 0.045) > 1e-6:
                failures.append("terminal emissive strength changed")
            if not _linked_from(principled.inputs["Base Color"], "KMEM_TERMINAL_BASE_COLOR", "Color"):
                failures.append("terminal base-color link changed")
            if not _linked_from(normal.inputs["Color"], "KMEM_TERMINAL_NORMAL", "Color") or not _linked_from(principled.inputs["Normal"], "KMEM_TERMINAL_NORMAL_STRENGTH", "Normal"):
                failures.append("terminal normal links changed")
            if not _linked_from(principled.inputs["Emission Color"], "KMEM_TERMINAL_LIT_RESTRAINED", "Color"):
                failures.append("terminal restrained-emissive link changed")
        for node_name, (image_name, filename, colorspace, _input_name, _output_name) in expected_images.items():
            node = nodes.get(node_name)
            image = node.image if node and node.bl_idname == "ShaderNodeTexImage" else None
            if image is None:
                failures.append(f"terminal texture node is missing: {node_name}")
                continue
            source_path = SOURCE_DIR / filename
            if image.name != image_name or tuple(int(value) for value in image.size[:]) != (2048, 1024):
                failures.append(f"packed texture identity or dimensions changed: {node_name}")
            if not image.packed_file or image.colorspace_settings.name != colorspace:
                failures.append(f"packed texture state or colorspace changed: {node_name}")
            if Path(bpy.path.abspath(image.filepath)).resolve() != source_path.resolve() or sha256_file(source_path) != SOURCE_HASHES[filename]:
                failures.append(f"packed texture source identity changed: {node_name}")

    triangle_count = sum(record["triangleCount"] for record in current_contract.values())
    mesh_count = sum(1 for record in current_contract.values() if record["type"] == "MESH")
    if len(current_contract) != 27 or mesh_count != 17 or triangle_count != 676 or len(material_names) != 6:
        failures.append(f"structural metrics changed: objects={len(current_contract)}, meshes={mesh_count}, triangles={triangle_count}, materials={len(material_names)}")
    for name, game_id in ANCHOR_GAME_IDS.items():
        if current_contract.get(name, {}).get("extras", {}).get("game_id") != game_id:
            failures.append(f"anchor game ID changed: {name}")

    if failures:
        raise ValueError("shaded-master semantic validation failed: " + "; ".join(failures))
    reimport = reimport_validation(bpy, glb_path, current_contract)
    if approved_hashes(approval) != before_approved_hashes:
        raise ValueError("approved Task 7 inputs changed during shaded-master semantic validation")
    report = {
        "status": "pass",
        "blendSha256": sha256_file(blend_path),
        "glbSha256": sha256_file(glb_path),
        "approvedTask7InputsImmutable": True,
        "namesHierarchyAndBlendTransformsPreserved": True,
        "camera": current_camera,
        "reviewLightingGrade": REVIEW_LIGHTING_GRADE,
        "materialAssignmentsAndNodesPreserved": True,
        "packedTextureIdentitiesAndDimensionsPreserved": True,
        "objectCount": len(current_contract),
        "meshCount": mesh_count,
        "triangleCount": triangle_count,
        "materialCount": len(material_names),
        "anchorsGameIdsAndExtrasPreserved": True,
        "glbReimport": reimport,
    }
    print("SEMANTIC_VALIDATION_JSON=" + json.dumps(report, sort_keys=True))
    return report


def main() -> int:
    args = parse_args(cli_arguments())
    require_exact_paths(args)
    if args.validate_shaded_master:
        validate_shaded_master(__import__("bpy"))
        return 0
    approval = verify_approved_assembly()
    before_approved_hashes = approved_hashes(approval)

    import bpy

    root = bpy.data.objects.get("KMEM_LEGACY_ROOT")
    if root is None:
        raise ValueError("approved neutral blend is missing KMEM_LEGACY_ROOT")
    neutral_contract = object_contract(root)
    uv_report, texture_report, assignments = shade_scene(bpy)
    shaded_contract = object_contract(root)
    contract_failures = compare_contract(neutral_contract, shaded_contract)
    if contract_failures:
        raise ValueError("shading changed the approved scene contract: " + "; ".join(contract_failures))
    configure_review_scene(bpy)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    preview_paths = render_previews(bpy, OUTPUT_DIR)
    blend_path, glb_path = export_candidate(bpy, root, OUTPUT_DIR)

    if approved_hashes(approval) != before_approved_hashes:
        raise ValueError("approved Task 7 inputs changed during shading")
    validation = reimport_validation(bpy, glb_path, neutral_contract)
    if validation["triangleCount"] != 676:
        raise ValueError(f"approved triangle count changed: {validation['triangleCount']} != 676")

    material_report_path = OUTPUT_DIR / "material-assignment-report.json"
    stable_json(material_report_path, {
        "schema": "cockpit-pipeline/material-assignment-v1",
        "status": "pass",
        "materialCount": validation["materialCount"],
        "assignments": assignments,
        "uvRestoration": uv_report,
        "memoryGrade": {
            "target": "subtle 1995 Memphis memory recreation",
            "viewTransform": "AgX",
            "look": "AgX - Medium High Contrast",
            **REVIEW_LIGHTING_GRADE,
            "modernDecorationAdded": False,
            "neonGuidanceAdded": False,
            "emissiveStrength": 0.045,
        },
    })
    texture_report_path = OUTPUT_DIR / "texture-report.json"
    stable_json(texture_report_path, {
        "schema": "cockpit-pipeline/texture-inventory-v1",
        "status": "pass",
        "textureCount": len(texture_report),
        "sourceTexturesPreserved": True,
        "allPacked": all(record["packed"] for record in texture_report),
        "allWithin2048x1024": all(record["width"] <= 2048 and record["height"] <= 1024 for record in texture_report),
        "textures": texture_report,
        "optimizationDecision": OPTIMIZATION_DECISION,
    })
    validation_report_path = OUTPUT_DIR / "validation-reimport-report.json"
    stable_json(validation_report_path, {
        **validation,
        "approvedAssemblyApprovalVerified": True,
        "approvedAssemblyInputsImmutable": True,
        "selectedSourceHashesVerified": True,
        "packedTexturesVerified": True,
        "optimizationDecision": OPTIMIZATION_DECISION,
        "destructiveOptimizationUsed": False,
    })
    gate = {
        "gate": "material-optimization",
        "artifactId": "dc9-memphis-legacy-material-optimization-001",
        "createdAt": CREATED_AT,
        "assetPath": str(glb_path.relative_to(REPO_ROOT)),
        "materialCount": validation["materialCount"],
        "textureReports": [
            {"path": record["path"], "width": record["width"], "height": record["height"], "usage": record["usage"]}
            for record in texture_report
        ],
        "glbSizeBytes": glb_path.stat().st_size,
        "optimizationDecision": OPTIMIZATION_DECISION,
        "destructiveOptimizationUsed": False,
        "runtimeContractPreserved": validation["hierarchyTransformsAndExtrasPreserved"] and validation["anchorGameIdsPreserved"],
        "reimportValidation": validation["status"],
    }
    stable_json(MATERIAL_GATE_PATH, gate)

    inputs = [ASSEMBLY_APPROVAL_PATH, ASSEMBLY_MANIFEST_PATH, *[REPO_ROOT / record["path"] for record in approval["approvedArtifacts"]], *[SOURCE_DIR / name for name in SOURCE_HASHES]]
    outputs = [blend_path, glb_path, material_report_path, texture_report_path, validation_report_path, *preview_paths, MATERIAL_GATE_PATH]
    manifest = {
        "manifestId": "dc9-memphis-legacy-shading-complete",
        "jobId": "dc9-memphis-legacy-shading",
        "stage": "shading_complete",
        "createdAt": CREATED_AT,
        "sourceVariant": "Ted Davis KMEM X-Plane scenery revision 2019-01-22",
        "targetVariant": "1995 Memphis memory recreation",
        "variantScope": "common",
        "artifactBasePath": str(REPO_ROOT),
        "inputs": [file_record(path) for path in dict.fromkeys(inputs)],
        "outputs": [file_record(path) for path in outputs],
        "approval": {
            "approved": False,
            "approvedBy": "owner Materials and Optimization Review Gate pending",
            "notes": "Shading comparison evidence only; no shading approval, production promotion, or browser/runtime integration is authorized.",
        },
    }
    stable_json(SHADING_MANIFEST_PATH, manifest)
    print(f"Memphis shading candidate complete and unapproved: {OUTPUT_DIR}")
    print(f"Materials: {validation['materialCount']}; triangles: {validation['triangleCount']}; GLB bytes: {glb_path.stat().st_size}")
    return 0


if __name__ == "__main__":
    try:
        exit_code = main()
    except Exception:
        traceback.print_exc()
        sys.stdout.flush()
        sys.stderr.flush()
        os._exit(1)
    raise SystemExit(exit_code)
