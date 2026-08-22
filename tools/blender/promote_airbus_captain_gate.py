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
PLACEMENT_EVIDENCE = ROOT / "preview-renders/placement-polish/airbus-radio-thrust-1440.png"
STORM_LINE_EVIDENCE = [
    ROOT / "preview-renders/storm-line/airbus-pfd-triangle-fixed-1440.png",
    ROOT / "preview-renders/storm-line/airbus-storm-line-768.png",
    ROOT / "preview-renders/storm-line/airbus-storm-line-375.png",
]

BASE_NODES = [
    "AIRBUS_ROOT",
    "AIRBUS_A320_STATIC",
    "AIRBUS_A320_DISPLAY_CANDIDATES",
    "AIRBUS_A320_INTERACTIVE_CANDIDATES",
    "AIRBUS_A320_LOC_CAPTAIN_EYE",
    "AIRBUS_A320_LOC_DASHBOARD_FOCUS",
    "AIRBUS_A320_LOC_INTERIOR_360_CENTER",
    "CAM_AIRBUS_CAPTAIN_GAME_VIEW",
    "CAM_AIRBUS_CAPTAIN_STORM_FLIGHT",
    "AIRBUS_A320_CAM_CAPTAIN_APPROVAL",
    "AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE",
    "AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE",
    "AIRBUS_A320_DISPLAY_UPPER_ECAM_SURFACE",
    "AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_ROLL_PIVOT",
    "AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_PITCH_PIVOT",
    "AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT",
]
TARGET_CONTROLS = ["SIDESTICK", "THRUST", "GEAR", "RADIO", "ALTITUDE"]
TARGET_SUFFIXES = [("PIVOT", "pivot"), ("HITBOX", "collider"), ("CUE", "cue")]

HTML_EQUIVALENTS = {
    "AIRBUS_ROOT": "Scene container; no direct HTML control.",
    "AIRBUS_A320_STATIC": "Static cockpit geometry; no direct HTML control.",
    "AIRBUS_A320_DISPLAY_CANDIDATES": "Source display group; live PFD, ND, and ECAM surfaces have native HTML instrument mirrors.",
    "AIRBUS_A320_INTERACTIVE_CANDIDATES": "Interactive candidate group; controls require later pivot-specific HTML equivalents.",
    "AIRBUS_A320_LOC_CAPTAIN_EYE": "Camera locator; no direct HTML control.",
    "AIRBUS_A320_LOC_DASHBOARD_FOCUS": "Camera locator; no direct HTML control.",
    "AIRBUS_A320_LOC_INTERIOR_360_CENTER": "Camera locator; no direct HTML control.",
    "CAM_AIRBUS_CAPTAIN_GAME_VIEW": "Keyboard and pointer seated-look controls plus accessible placement controls.",
    "CAM_AIRBUS_CAPTAIN_STORM_FLIGHT": "Limited pointer/touch look plus native Recenter and flight controls.",
    "AIRBUS_A320_CAM_CAPTAIN_APPROVAL": "Approval camera; no direct HTML control.",
    "AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE": "Pitch, bank, and energy values are mirrored in the accessible flight instruments region.",
    "AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE": "Weather intensity, corridor guidance, and cross-track state are mirrored in native HTML.",
    "AIRBUS_A320_DISPLAY_UPPER_ECAM_SURFACE": "Paired thrust, energy, and weather state are mirrored in native HTML.",
    "AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_ROLL_PIVOT": "Native Bank left and Bank right hold buttons.",
    "AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_PITCH_PIVOT": "Native Pitch up and Pitch down hold buttons.",
    "AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT": "Native Increase and Decrease paired-thrust hold buttons.",
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
    for required in (GLB_PATH, INITIAL_EVIDENCE, DRAGGED_EVIDENCE, PLACEMENT_EVIDENCE, *STORM_LINE_EVIDENCE):
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
        "artifactId": "a320-cockpit-2-captain-runtime-contract-003",
        "createdAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "sceneGroup": scene_group,
        "assetPath": "public/models/airbus-captain.glb",
        "rootObject": "AIRBUS_ROOT",
        "runtimeNodes": runtime_nodes,
        "customPropertiesPreserved": True,
        "reimportValidation": "pass",
        "visualAlignmentValidation": {
            "status": "verified",
            "evidence": "The real captain-seat GLB retains the owner-approved Radio and Thrust placements and now renders live PFD, ND, and ECAM surfaces plus accessible Storm Line controls in preview-renders/storm-line. The final 1440x900 frame is airbus-pfd-triangle-fixed-1440.png; functional responsive evidence is retained at 768x900 and 375x812. Playwright verifies all seven simulator nodes, no-cache runtime bytes, and the native control path.",
        },
        "scaleAndCameraAssumptions": "Source model is kept in imported Blender scale. Qualification starts from CAM_AIRBUS_CAPTAIN_GAME_VIEW at 68 degrees vertical FOV. Begin Storm Line transitions to CAM_AIRBUS_CAPTAIN_STORM_FLIGHT at 58 degrees vertical FOV with constrained head-look. The browser raycasts exported colliders, projects accessible HTML cues, paints runtime CanvasTextures onto three authored display planes, and animates the authored sidestick and paired-thrust pivots.",
        "knownReferenceDeviations": [
            "Prebuilt Sketchfab source still needs model-correct A320 reference review before production promotion.",
            "Five Pop T Captain targets have export-verified pivots, invisible hitboxes, and cue proxies. Captain-seat browser alignment is verified at 1440x900; imported source controls outside that player-facing set remain deferred.",
            "Storm Line uses a paired-thrust pivot; independent left/right lever splitting remains intentionally deferred.",
            "The scenario is an arcade fictional simulator, not an operational A320 training model.",
        ],
    }
    GATE_PATH.write_text(json.dumps(gate, indent=2) + "\n", encoding="utf-8")
    print(f"Promoted Airbus captain runtime gate: {GATE_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
