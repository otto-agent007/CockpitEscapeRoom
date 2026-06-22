"""Create and validate the DC-9-51 Blender reference-board scene.

This script intentionally creates art-source/blender/dc9_reference_scene.blend and never
opens or mutates dc9_master.blend.
"""

from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path
from typing import Any

import bpy

REPO_ROOT = Path(__file__).resolve().parents[2]
REFERENCE_ROOT = REPO_ROOT / "art-source" / "references"
MANIFEST_PATH = REFERENCE_ROOT / "reference-manifest.yaml"
BLEND_PATH = REPO_ROOT / "art-source" / "blender" / "dc9_reference_scene.blend"
REPORT_DIR = REPO_ROOT / ".cache" / "references"

ROOT_COLLECTION = "REF_DC9_51"
SUBCOLLECTIONS = [
    "PRIMARY_LAYOUT",
    "SECONDARY_DETAILS",
    "PRESENTATION_REFERENCES",
    "LIGHTING_MOOD",
    "MISSING_VIEW_PLACEHOLDERS",
    "ANNOTATIONS",
]
CAMERAS = [
    "CAM_REF_OVERVIEW",
    "CAM_REF_MAIN_PANEL",
    "CAM_REF_OVERHEAD",
    "CAM_REF_PEDESTAL",
    "CAM_REF_CAPTAIN_SIDE",
    "CAM_REF_FIRST_OFFICER_SIDE",
]
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def _load_yaml() -> dict[str, dict[str, Any]]:
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        code = (
            "import json, pathlib, yaml; "
            f"path = pathlib.Path({str(MANIFEST_PATH)!r}); "
            "print(json.dumps(yaml.safe_load(path.read_text(encoding='utf-8'))))"
        )
        result = subprocess.run(["python3", "-c", code], text=True, capture_output=True)
        if result.returncode != 0:
            raise SystemExit(
                "Blender Python cannot import PyYAML and python3 fallback failed:\n"
                f"{result.stderr}"
            ) from exc
        data = json.loads(result.stdout)
    else:
        data = yaml.safe_load(MANIFEST_PATH.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise SystemExit("reference-manifest.yaml root must be a mapping")
    return data


def _clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for collection in list(bpy.data.collections):
        if collection.name == ROOT_COLLECTION or collection.name in SUBCOLLECTIONS:
            bpy.data.collections.remove(collection)


def _collection(name: str, parent: bpy.types.Collection | None = None) -> bpy.types.Collection:
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
    if parent:
        if collection.name not in parent.children:
            parent.children.link(collection)
    elif collection.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(collection)
    return collection


def _unlink_from_all(obj: bpy.types.Object) -> None:
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)


def _link(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    _unlink_from_all(obj)
    collection.objects.link(obj)


def _lock(obj: bpy.types.Object) -> None:
    obj.lock_location = (True, True, True)
    obj.lock_rotation = (True, True, True)
    obj.lock_scale = (True, True, True)
    obj.hide_render = True
    obj["exclude_from_production_export"] = True
    obj["reference_scene_only"] = True


def _text(name: str, body: str, location: tuple[float, float, float], size: float, collection: bpy.types.Collection) -> bpy.types.Object:
    font_curve = bpy.data.curves.new(name, "FONT")
    font_curve.body = body
    font_curve.align_x = "LEFT"
    font_curve.align_y = "TOP"
    font_curve.size = size
    obj = bpy.data.objects.new(name, font_curve)
    obj.location = location
    _link(obj, collection)
    _lock(obj)
    return obj


def _placeholder_plane(name: str, location: tuple[float, float, float], collection: bpy.types.Collection) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    w, h = 2.7, 1.55
    verts = [(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    mat = bpy.data.materials.new(f"{name}_MAT")
    mat.diffuse_color = (0.16, 0.18, 0.2, 1)
    obj.data.materials.append(mat)
    _link(obj, collection)
    _lock(obj)
    return obj


def _image_material(image: bpy.types.Image, reference_id: str) -> bpy.types.Material:
    mat = bpy.data.materials.new(f"MAT_{reference_id}")
    mat.diffuse_color = (1, 1, 1, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    tex = nodes.new(type="ShaderNodeTexImage")
    tex.image = image
    if bsdf:
        input_name = "Base Color" if "Base Color" in bsdf.inputs else next(iter(bsdf.inputs.keys()))
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs[input_name])
    return mat


def _image_board(
    reference_id: str,
    entry: dict[str, Any],
    filepath: Path,
    location: tuple[float, float, float],
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    image = bpy.data.images.load(str(filepath), check_existing=True)
    aspect = image.size[0] / max(1, image.size[1])
    height = 1.65
    width = min(2.8, height * aspect)
    mesh = bpy.data.meshes.new(f"{reference_id}_MESH")
    verts = [(-width / 2, 0, -height / 2), (width / 2, 0, -height / 2), (width / 2, 0, height / 2), (-width / 2, 0, height / 2)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for uv, coords in zip(uv_layer.data, ((0, 0), (1, 0), (1, 1), (0, 1)), strict=True):
        uv.uv = coords
    obj = bpy.data.objects.new(f"REF_IMG_{reference_id}", mesh)
    obj.location = location
    obj.data.materials.append(_image_material(image, reference_id))
    aircraft = entry.get("aircraft", {})
    obj["reference_id"] = reference_id
    obj["aircraft_variant"] = str(aircraft.get("variant", "unknown"))
    obj["operator"] = str(aircraft.get("operator", "unknown"))
    obj["viewpoint"] = str(entry.get("viewpoint", "unknown"))
    obj["usage_role"] = ", ".join(entry.get("intended_uses", []))
    obj["confidence"] = str(entry.get("confidence", "unknown"))
    obj["local_file"] = entry.get("local_file", "")
    _link(obj, collection)
    _lock(obj)
    return obj


def _collection_for(entry: dict[str, Any], collections: dict[str, bpy.types.Collection]) -> bpy.types.Collection:
    classification = entry.get("classification")
    if classification == "primary":
        return collections["PRIMARY_LAYOUT"]
    if classification == "secondary":
        return collections["SECONDARY_DETAILS"]
    if classification == "mood":
        return collections["LIGHTING_MOOD"]
    if classification == "presentation":
        return collections["PRESENTATION_REFERENCES"]
    return collections["ANNOTATIONS"]


def _add_cameras(collection: bpy.types.Collection) -> None:
    positions = {
        "CAM_REF_OVERVIEW": (0, -10.5, 3.4, 24),
        "CAM_REF_MAIN_PANEL": (-2.0, -5.5, 2.5, 50),
        "CAM_REF_OVERHEAD": (0, -5.4, 5.8, 50),
        "CAM_REF_PEDESTAL": (2.0, -5.5, 2.2, 50),
        "CAM_REF_CAPTAIN_SIDE": (-4.2, -5.7, 2.7, 50),
        "CAM_REF_FIRST_OFFICER_SIDE": (4.2, -5.7, 2.7, 50),
    }
    targets = {
        "CAM_REF_OVERVIEW": (0, 0, -0.65),
        "CAM_REF_MAIN_PANEL": (-2.0, 0, 1.0),
        "CAM_REF_OVERHEAD": (0, 0, -0.1),
        "CAM_REF_PEDESTAL": (2.0, 0, 0.6),
        "CAM_REF_CAPTAIN_SIDE": (-3.2, 0, 1.0),
        "CAM_REF_FIRST_OFFICER_SIDE": (3.2, 0, 1.0),
    }
    for name, (x, y, z, lens) in positions.items():
        camera_data = bpy.data.cameras.new(name)
        camera_data.lens = lens
        obj = bpy.data.objects.new(name, camera_data)
        obj.location = (x, y, z)
        direction = mathutils.Vector(targets[name]) - mathutils.Vector(obj.location)
        obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        obj["reference_scene_only"] = True
        obj["exclude_from_production_export"] = True
        _link(obj, collection)
    bpy.context.scene.camera = bpy.data.objects["CAM_REF_OVERVIEW"]


def _create_scene() -> dict[str, Any]:
    manifest = _load_yaml()
    _clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    try:
        bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        bpy.context.scene.render.engine = "BLENDER_EEVEE"
    root = _collection(ROOT_COLLECTION)
    root["reference_scene_only"] = True
    collections = {name: _collection(name, root) for name in SUBCOLLECTIONS}

    _text("REF_TITLE_DC9_51", "Northwest-Style DC-9-51 Reference Board", (-4.6, 0, 3.2), 0.22, collections["ANNOTATIONS"])

    local_image_count = 0
    for index, (reference_id, entry) in enumerate(manifest.items()):
        filepath = REFERENCE_ROOT / entry.get("local_file", "")
        collection = _collection_for(entry, collections)
        x = -3.1 + (index % 3) * 3.1
        z = 1.6 - (index // 3) * 2.45
        if filepath.exists() and filepath.suffix.lower() in IMAGE_SUFFIXES:
            local_image_count += 1
            _image_board(reference_id, entry, filepath, (x, 0, z), collection)
        aircraft = entry.get("aircraft", {})
        label = (
            f"{reference_id}\n"
            f"{aircraft.get('variant', 'unknown')} | {aircraft.get('operator', 'unknown')}\n"
            f"{entry.get('classification', 'unknown')} | {entry.get('confidence', 'unknown')}\n"
            f"{entry.get('viewpoint', 'unknown')}"
        )
        _text(f"REF_LABEL_{reference_id}", label, (x - 1.38, -0.02, z - 1.05), 0.075, collection)

    missing_views = [
        ("OVERHEAD", "high", "Northwest DC-9-51 overhead panel close-up", "overhead controls and lighting"),
        ("PEDESTAL", "high", "Northwest DC-9-51 pedestal throttle quadrant", "throttles, trim, radio pedestal"),
        ("CAPTAIN_SIDE", "medium", "DC-9-51 captain sidewall window mechanism", "sidewall and window framing"),
        ("FIRST_OFFICER_SIDE", "medium", "DC-9-51 first officer side cockpit view", "right-side symmetry and panel relationship"),
    ]
    for index, (view, priority, terms, affected) in enumerate(missing_views):
        x = -4.1 + index * 2.75
        obj = _placeholder_plane(f"REF_MISSING_{view}", (x, 0.08, -3.8), collections["MISSING_VIEW_PLACEHOLDERS"])
        obj["missing_viewpoint"] = view
        obj["priority"] = priority
        obj["search_terms"] = terms
        obj["affected_cockpit_section"] = affected
        _text(
            f"REF_MISSING_LABEL_{view}",
            f"MISSING {view}\nPriority: {priority}\nSearch: {terms}\nAffects: {affected}",
            (x - 1.25, 0.06, -3.25),
            0.065,
            collections["MISSING_VIEW_PLACEHOLDERS"],
        )

    # Simple approval lighting for preview renders only.
    light_data = bpy.data.lights.new("REF_AREA_LIGHT", "AREA")
    light_data.energy = 350
    light_data.size = 6
    light = bpy.data.objects.new("REF_AREA_LIGHT", light_data)
    light.location = (0, -3, 5)
    light["reference_scene_only"] = True
    light["exclude_from_production_export"] = True
    _link(light, collections["ANNOTATIONS"])

    _add_cameras(collections["ANNOTATIONS"])
    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    return {"referenceImages": local_image_count, "blend": str(BLEND_PATH)}


def _validate_scene() -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    root = bpy.data.collections.get(ROOT_COLLECTION)
    if root is None:
        errors.append(f"Missing root collection {ROOT_COLLECTION}")
    for name in SUBCOLLECTIONS:
        if bpy.data.collections.get(name) is None:
            errors.append(f"Missing reference collection {name}")
    for name in CAMERAS:
        obj = bpy.data.objects.get(name)
        if obj is None or obj.type != "CAMERA":
            errors.append(f"Missing fixed reference camera {name}")

    image_boards = [obj for obj in bpy.data.objects if obj.name.startswith("REF_IMG_")]
    if not image_boards:
        warnings.append("No local image boards found; run npm run references:download for image boards.")
    for obj in image_boards:
        for key in ("reference_id", "aircraft_variant", "operator", "viewpoint", "usage_role", "confidence"):
            if not obj.get(key):
                errors.append(f"{obj.name}: missing custom property {key}")
        if not obj.get("exclude_from_production_export"):
            errors.append(f"{obj.name}: missing export-exclusion marker")
        if not all(obj.lock_location) or not all(obj.lock_rotation) or not all(obj.lock_scale):
            errors.append(f"{obj.name}: transform locks are not fully enabled")
        if not obj.hide_render:
            errors.append(f"{obj.name}: should be hidden from normal production rendering")

    placeholders = [obj for obj in bpy.data.objects if obj.name.startswith("REF_MISSING_") and obj.type == "MESH"]
    if len(placeholders) < 4:
        errors.append("Expected at least four missing-view placeholder boards")

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    (REPORT_DIR / "blender-reference-validation.json").write_text(
        json.dumps(
            {
                "blend": str(BLEND_PATH.relative_to(REPO_ROOT)),
                "blenderVersion": bpy.app.version_string,
                "errors": errors,
                "warnings": warnings,
                "imageBoardCount": len(image_boards),
                "placeholderCount": len(placeholders),
                "passed": not errors,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return errors, warnings


def _render_preview(output: Path) -> None:
    temporarily_enabled: list[bpy.types.Object] = []
    for obj in bpy.data.objects:
        if obj.get("reference_scene_only") and obj.hide_render:
            obj.hide_render = False
            temporarily_enabled.append(obj)
    bpy.context.scene.camera = bpy.data.objects.get("CAM_REF_OVERVIEW")
    bpy.context.scene.render.resolution_x = 1600
    bpy.context.scene.render.resolution_y = 900
    bpy.context.scene.eevee.taa_render_samples = 32
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    for obj in temporarily_enabled:
        obj.hide_render = True
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--render-preview", action="store_true")
    parser.add_argument("--preview-output", default=str(REPORT_DIR / "dc9_reference_overview.png"))
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])

    _create_scene()
    errors, warnings = _validate_scene()
    for warning in warnings:
        print(f"WARNING: {warning}")
    if args.render_preview:
        _render_preview(Path(args.preview_output))
        print(f"Rendered {Path(args.preview_output).relative_to(REPO_ROOT)}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(f"Reference scene ready: {BLEND_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    import mathutils

    raise SystemExit(main())
