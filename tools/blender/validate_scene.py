"""Validate a CockpitEscapeRoom Blender source file before web export."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import bpy

ASSET_NAME = os.environ.get("ASSET_NAME", "unknown")
ROOT_NAME = os.environ.get("ASSET_ROOT", "")
REPORT_DIR = Path(os.environ.get("ASSET_REPORT_DIR", ".cache/assets/unknown"))
EXPECTED_VERSION = os.environ.get("BLENDER_EXPECTED_VERSION", "").strip()

errors: list[str] = []
warnings: list[str] = []
candidate_notes: list[str] = []


def add_error(message: str) -> None:
    errors.append(message)
    print(f"ERROR: {message}")


def add_warning(message: str) -> None:
    warnings.append(message)
    print(f"WARNING: {message}")


def add_candidate_note(message: str) -> None:
    candidate_notes.append(message)
    print(f"NOTE: {message}")


if EXPECTED_VERSION and not bpy.app.version_string.startswith(EXPECTED_VERSION):
    add_error(
        f"Expected Blender {EXPECTED_VERSION}, found {bpy.app.version_string}. "
        "Use the pinned project version or update the pin deliberately."
    )

root = bpy.data.objects.get(ROOT_NAME)
if root is None:
    add_error(f"Required root object is missing: {ROOT_NAME}")

approval_cameras = [obj.name for obj in bpy.data.objects if obj.type == "CAMERA" and "APPROVAL" in obj.name]
if not approval_cameras:
    add_error("Add at least one approval camera whose name contains APPROVAL.")

seen_game_ids: dict[str, str] = {}
contract_objects = []
interactive_objects = []

for obj in bpy.data.objects:
    if obj.hide_render:
        continue

    scale = obj.scale
    if any(abs(axis - 1.0) > 0.0001 for axis in scale):
        add_warning(f"{obj.name}: unapplied scale {tuple(round(axis, 4) for axis in scale)}")

    game_id = obj.get("game_id")
    interaction = obj.get("interaction")
    is_interactive_candidate = obj.type != "EMPTY" and "INTERACTIVE" in obj.name
    is_metadata_only_contract = obj.type == "CAMERA" or "LOC_" in obj.name or obj.name == ROOT_NAME
    has_contract_metadata = bool(game_id) or bool(interaction) or is_interactive_candidate
    if has_contract_metadata:
        contract_objects.append(obj.name)
        if interaction and not game_id:
            add_error(f"{obj.name}: interactive object is missing custom property game_id")
        elif game_id in seen_game_ids:
            add_error(f"Duplicate game_id {game_id!r}: {seen_game_ids[game_id]} and {obj.name}")
        elif game_id:
            seen_game_ids[game_id] = obj.name
        if interaction:
            interactive_objects.append(obj.name)
        elif is_interactive_candidate:
            add_candidate_note(f"{obj.name}: preserved imported visual candidate has no runtime interaction metadata")
        elif game_id and not is_metadata_only_contract:
            add_candidate_note(f"{obj.name}: contract metadata node has no runtime interaction metadata")

    if obj.type == "MESH":
        if not obj.data.materials:
            add_warning(f"{obj.name}: mesh has no material")
        if not obj.data.uv_layers:
            add_warning(f"{obj.name}: mesh has no UV map")

for image in bpy.data.images:
    if image.source == "FILE" and image.filepath:
        resolved = Path(bpy.path.abspath(image.filepath))
        if not resolved.exists():
            add_error(f"Missing external image: {image.name} -> {resolved}")

report = {
    "asset": ASSET_NAME,
    "blenderVersion": bpy.app.version_string,
    "rootObject": ROOT_NAME,
    "approvalCameras": approval_cameras,
    "contractObjectCount": len(contract_objects),
    "contractObjects": sorted(contract_objects),
    "interactiveObjectCount": len(interactive_objects),
    "interactiveObjects": sorted(interactive_objects),
    "errors": errors,
    "warnings": warnings,
    "candidateNotes": candidate_notes,
    "passed": not errors,
}
REPORT_DIR.mkdir(parents=True, exist_ok=True)
(REPORT_DIR / "validation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

if errors:
    sys.exit(1)
print(f"Validation passed with {len(warnings)} warning(s).")
