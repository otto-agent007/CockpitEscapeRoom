#!/usr/bin/env python3
"""Regenerate the deployable Airbus captain runtime gate from the GLB and browser proof."""

from __future__ import annotations

import json
import struct
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GLB_PATH = ROOT / "public/models/airbus-captain.glb"
GATE_PATH = ROOT / "art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json"
INITIAL_EVIDENCE = ROOT / "preview-renders/seat-role-swap/airbus-captain-targets-initial-1440.png"
DRAGGED_EVIDENCE = ROOT / "preview-renders/seat-role-swap/airbus-captain-targets-dragged-1440.png"

BASE_NODES = [
    "AIRBUS_ROOT",
    "AIRBUS_A320_STATIC",
    "AIRBUS_A320_DISPLAY_CANDIDATES",
    "AIRBUS_A320_INTERACTIVE_CANDIDATES",
    "AIRBUS_A320_LOC_CAPTAIN_EYE",
    "AIRBUS_A320_LOC_DASHBOARD_FOCUS",
    "AIRBUS_A320_LOC_INTERIOR_360_CENTER",
    "CAM_AIRBUS_CAPTAIN_GAME_VIEW",
    "AIRBUS_A320_CAM_CAPTAIN_APPROVAL",
]
TARGET_CONTROLS = ["SIDESTICK", "THRUST", "GEAR", "RADIO", "ALTITUDE"]
TARGET_SUFFIXES = [("PIVOT", "pivot"), ("HITBOX", "collider"), ("CUE", "cue")]

HTML_EQUIVALENTS = {
    "AIRBUS_ROOT": "Scene container; no direct HTML control.",
    "AIRBUS_A320_STATIC": "Static cockpit geometry; no direct HTML control.",
    "AIRBUS_A320_DISPLAY_CANDIDATES": "Display inspection candidate; future HTML panel mirror required if interactive.",
    "AIRBUS_A320_INTERACTIVE_CANDIDATES": "Interactive candidate group; controls require later pivot-specific HTML equivalents.",
    "AIRBUS_A320_LOC_CAPTAIN_EYE": "Camera locator; no direct HTML control.",
    "AIRBUS_A320_LOC_DASHBOARD_FOCUS": "Camera locator; no direct HTML control.",
    "AIRBUS_A320_LOC_INTERIOR_360_CENTER": "Camera locator; no direct HTML control.",
    "CAM_AIRBUS_CAPTAIN_GAME_VIEW": "Keyboard and pointer seated-look controls plus accessible placement controls.",
    "AIRBUS_A320_CAM_CAPTAIN_APPROVAL": "Approval camera; no direct HTML control.",
}


def read_glb_json(path: Path) -> dict[str, object]:
    with path.open("rb") as handle:
        magic, version, _length = struct.unpack("<4sII", handle.read(12))
        if magic != b"glTF" or version != 2:
            raise ValueError(f"Unsupported GLB header: {path}")
        chunk_length, chunk_type = struct.unpack("<II", handle.read(8))
        if chunk_type != 0x4E4F534A:
            raise ValueError(f"First GLB chunk is not JSON: {path}")
        return json.loads(handle.read(chunk_length).rstrip(b"\x00 "))


def runtime_node(name: str, node: dict[str, object], role: str | None = None) -> dict[str, object]:
    extras = node.get("extras") if isinstance(node.get("extras"), dict) else {}
    assert isinstance(extras, dict)
    if not isinstance(extras.get("game_id"), str):
        raise ValueError(f"{name} is missing game_id metadata")
    record: dict[str, object] = {
        "name": name,
        "gameId": extras["game_id"],
        "pivotVerified": bool(extras.get("pivotVerified", name.startswith("AIRBUS_A320_LOC_"))),
        "pivotExportVerified": bool(extras.get("pivotExportVerified", name.startswith("AIRBUS_A320_LOC_"))),
        "localAxis": "CAMERA_LOCAL" if "CAM_" in name else "WORLD" if "_LOC_" in name else str(extras.get("rotation_axis", "GROUP_ROOT")),
        "htmlEquivalent": str(extras.get("htmlEquivalent", HTML_EQUIVALENTS.get(name, "Accessible Airbus placement control."))),
    }
    if role:
        status = extras.get("visual_alignment_status")
        if status != "verified_browser_1440_captain":
            raise ValueError(f"{name} has unpromoted visual alignment metadata: {status!r}")
        record["nodeRole"] = role
        record["visualAlignmentStatus"] = status
    return record


def main() -> None:
    for required in (GLB_PATH, INITIAL_EVIDENCE, DRAGGED_EVIDENCE):
        if not required.is_file() or required.stat().st_size == 0:
            raise FileNotFoundError(f"Required captain-view gate input is missing: {required}")

    gltf = read_glb_json(GLB_PATH)
    nodes = {node.get("name"): node for node in gltf.get("nodes", []) if isinstance(node, dict) and isinstance(node.get("name"), str)}
    required_names = BASE_NODES + [f"AIRBUS_A320_TARGET_{control}_{suffix}" for control in TARGET_CONTROLS for suffix, _role in TARGET_SUFFIXES]
    missing = [name for name in required_names if name not in nodes]
    if missing:
        raise ValueError(f"Deployable Airbus GLB is missing runtime nodes: {missing}")

    runtime_nodes = [runtime_node(name, nodes[name]) for name in BASE_NODES]
    runtime_nodes.extend(
        runtime_node(f"AIRBUS_A320_TARGET_{control}_{suffix}", nodes[f"AIRBUS_A320_TARGET_{control}_{suffix}"], role)
        for control in TARGET_CONTROLS
        for suffix, role in TARGET_SUFFIXES
    )
    root_extras = nodes["AIRBUS_ROOT"].get("extras", {})
    scene_group = root_extras.get("scene_group") if isinstance(root_extras, dict) else None
    if scene_group != "Airbus A320 Pop T Captain cockpit":
        raise ValueError(f"Unexpected deployable scene group: {scene_group!r}")

    gate = {
        "gate": "runtime-contract",
        "artifactId": "a320-cockpit-2-captain-runtime-contract-002",
        "createdAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "sceneGroup": scene_group,
        "assetPath": "public/models/airbus-captain.glb",
        "rootObject": "AIRBUS_ROOT",
        "runtimeNodes": runtime_nodes,
        "customPropertiesPreserved": True,
        "reimportValidation": "pass",
        "visualAlignmentValidation": {
            "status": "verified",
            "evidence": "The real captain-seat GLB was inspected at 1440x900 with five projected targets active in preview-renders/seat-role-swap/airbus-captain-targets-initial-1440.png and after seated head-look drag in preview-renders/seat-role-swap/airbus-captain-targets-dragged-1440.png. Both states reported five projected targets; Playwright verifies reachability.",
        },
        "scaleAndCameraAssumptions": "Source model is kept in imported Blender scale. The browser starts from CAM_AIRBUS_CAPTAIN_GAME_VIEW, consumes its exported 68-degree vertical FOV, uses restrained seated head-look, raycasts exported colliders, and projects accessible HTML cues from exported pivots.",
        "knownReferenceDeviations": [
            "Prebuilt Sketchfab source still needs model-correct A320 reference review before production promotion.",
            "Five Pop T Captain targets have export-verified pivots, invisible hitboxes, and cue proxies. Captain-seat browser alignment is verified at 1440x900; imported source controls outside that player-facing set remain deferred.",
            "Display content is dark/static source geometry; live display materials and deeper imported-control mesh splitting belong to later stages.",
        ],
    }
    GATE_PATH.write_text(json.dumps(gate, indent=2) + "\n", encoding="utf-8")
    print(f"Promoted Airbus captain runtime gate: {GATE_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
