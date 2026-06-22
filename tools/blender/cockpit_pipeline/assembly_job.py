from __future__ import annotations

import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from .hashing import file_record, verify_file_record, verify_manifest_hashes
from .schema_validation import validate_json_file
from .state_machine import require_transition


SOURCE_VARIANT = "DC-9-32"
TARGET_VARIANT = "unresolved"


def run_assembly_job(source_job_id: str, assembly_job_id: str) -> None:
    root = Path(__file__).resolve().parents[3]
    source_job_dir = root / "art-source/cockpit-pipeline/jobs" / source_job_id
    source_manifest_path = source_job_dir / "manifests/sourcing-complete.json"
    source_approval_path = source_job_dir / "source-approval.json"
    source_catalog_path = root / "art-source/cockpit-pipeline/stages/source/output" / source_job_id / "component-catalog.json"
    layout_path = root / "art-source/cockpit-pipeline/stages/assembly/input" / assembly_job_id / "layout.json"
    output_dir = root / "art-source/cockpit-pipeline/stages/assembly/output" / assembly_job_id
    report_dir = root / "asset-reports/cockpit-pipeline" / assembly_job_id
    preview_dir = root / "preview-renders/cockpit-pipeline" / assembly_job_id
    manifest_dir = root / "art-source/cockpit-pipeline/jobs" / assembly_job_id / "manifests"

    for path in (layout_path.parent, output_dir, report_dir, preview_dir, manifest_dir):
        path.mkdir(parents=True, exist_ok=True)

    source_manifest = validate_json_file(source_manifest_path, "stage_manifest.schema.json")
    verify_manifest_hashes(source_manifest, source_manifest_path)
    approval = _load_source_approval(source_approval_path)
    catalog = json.loads(source_catalog_path.read_text(encoding="utf-8"))
    approved = _verify_approved_inputs(root, approval, source_manifest, catalog)
    before_hashes = _source_hashes(root, approval)

    layout = _write_layout(layout_path, source_job_id, assembly_job_id, approved)
    _run_blender_assembly(layout_path, output_dir, preview_dir)

    after_hashes = _source_hashes(root, approval)
    source_immutable = before_hashes == after_hashes
    if not source_immutable:
        raise RuntimeError("approved source hashes changed during assembly")

    validation_path = output_dir / "validation-report.json"
    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    validation["sourceInputsImmutable"] = source_immutable
    validation["approvedComponentIds"] = [item["componentId"] for item in approved]
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    if validation["status"] != "pass":
        raise RuntimeError(f"assembly validation failed: {validation_path}")

    node_report_path = output_dir / "node-pivot-report.json"
    resolved_layout_path = output_dir / "resolved-layout.json"
    resolved_layout_path.write_text(json.dumps(layout, indent=2) + "\n", encoding="utf-8")
    report_path = report_dir / "assembly-report.md"
    _write_assembly_report(report_path, assembly_job_id, source_job_id, approved, layout_path, output_dir, preview_dir, validation, _git_commit(root))
    manifest_path = _write_manifest(
        root=root,
        manifest_dir=manifest_dir,
        assembly_job_id=assembly_job_id,
        approved_inputs=[Path(item["glbPath"]) for item in approved] + [Path(item["metadataPath"]) for item in approved] + [source_approval_path, source_manifest_path],
        outputs=[
            output_dir / "dc9-vslice-assembly.blend",
            output_dir / "dc9-vslice-assembly.glb",
            resolved_layout_path,
            node_report_path,
            validation_path,
            report_path,
            *(preview_dir / name for name in [
                "captain-seat-view.png",
                "wide-cockpit-view.png",
                "yoke-close-up.png",
                "pedestal-throttle-close-up.png",
                "gauge-switch-close-up.png",
            ]),
        ],
    )
    validate_json_file(manifest_path, "stage_manifest.schema.json")
    verify_manifest_hashes(json.loads(manifest_path.read_text(encoding="utf-8")), manifest_path)
    require_transition("source-approved", "assembly_complete")
    print(f"Assembly job complete: {assembly_job_id}")
    print(f"Layout: {layout_path}")
    print(f"Assembly GLB: {output_dir / 'dc9-vslice-assembly.glb'}")
    print(f"Manifest: {manifest_path}")


def _load_source_approval(path: Path) -> dict[str, object]:
    if not path.is_file():
        raise FileNotFoundError(f"source approval is required before assembly: {path}")
    approval = json.loads(path.read_text(encoding="utf-8"))
    required = ["approvalId", "sourceJobId", "stage", "approved", "approvedComponents", "sourceManifest"]
    missing = [key for key in required if key not in approval]
    if missing:
        raise ValueError(f"invalid source approval missing fields: {missing}")
    if approval["stage"] != "source-approved" or approval["approved"] is not True:
        raise ValueError("source approval must have stage source-approved and approved true")
    return approval


def _verify_approved_inputs(root: Path, approval: dict[str, object], source_manifest: dict[str, object], catalog: dict[str, object]) -> list[dict[str, object]]:
    manifest_outputs = {record["path"]: record for record in source_manifest["outputs"]}
    catalog_by_id = {item["candidateId"]: item for item in catalog["candidates"]}
    approved = []
    for item in approval["approvedComponents"]:
        component_id = item["componentId"]
        if component_id not in catalog_by_id:
            raise ValueError(f"approved component not found in catalog: {component_id}")
        for key in ("glbPath", "metadataPath"):
            record_path = item[key]
            if record_path not in manifest_outputs:
                raise ValueError(f"approved {key} not declared by source manifest: {record_path}")
            verify_file_record(manifest_outputs[record_path], root)
            if manifest_outputs[record_path]["sha256"] != item[f"{key}Sha256"]:
                raise ValueError(f"approved hash mismatch for {record_path}")
        approved.append({**catalog_by_id[component_id], **item})
    if len(approved) != 4:
        raise ValueError(f"expected exactly four approved components, got {len(approved)}")
    return approved


def _source_hashes(root: Path, approval: dict[str, object]) -> dict[str, str]:
    from .hashing import sha256_file

    hashes = {}
    for item in approval["approvedComponents"]:
        for key in ("glbPath", "metadataPath"):
            path = root / item[key]
            hashes[item[key]] = sha256_file(path)
    return hashes


def _write_layout(path: Path, source_job_id: str, assembly_job_id: str, approved: list[dict[str, object]]) -> dict[str, object]:
    by_category = {item["category"]: item for item in approved}
    instances = [
        _instance(by_category["yoke_assembly"], "DC9_VSLICE_YOKE_GROUP", "DC9_CTRL_YOKE_CAPTAIN_01", [-0.72, -0.72, 0.86], [1.5708, 0.0, 1.5708], [0.32, 0.32, 0.32], "yoke", "LOCAL_Y"),
        _instance(by_category["throttle_assembly"], "DC9_VSLICE_PEDESTAL_GROUP", "DC9_THR_QUADRANT_01", [0.12, -0.02, 0.55], [0.0, 0.0, -0.04], [0.54, 0.54, 0.54], "throttle", "LOCAL_X"),
        _instance(by_category["large_cockpit_gauge"], "DC9_VSLICE_GAUGE_GROUP", "DC9_GAUGE_ALTITUDE_01", [-0.24, -0.64, 1.18], [0.0, 0.0, 1.5708], [5.8, 5.8, 5.8], "inspect", "LOCAL_X"),
        _instance(by_category["switch_cluster"], "DC9_VSLICE_SWITCH_GROUP", "DC9_SW_ABS_CLUSTER_01", [0.58, -0.64, 1.08], [0.0, 0.0, 0.0], [0.3, 0.3, 0.3], "toggle", "LOCAL_X"),
    ]
    layout = {
        "layoutId": "dc9-vslice-layout-001",
        "jobId": assembly_job_id,
        "sourceJobId": source_job_id,
        "aircraftFamily": "DC-9",
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "variantScope": "unknown",
        "coordinateSystem": {
            "units": "meters",
            "description": "Blender coordinates: X lateral, Y fore-aft, Z up. Placeholder origin is the neutral cockpit reference frame."
        },
        "captainEyePoint": {"translation": [-0.58, -2.0, 1.36], "status": "placeholder_transform"},
        "baseCockpitReferenceFrame": {
            "nodeName": "DC9_VSLICE_REFERENCE_FRAME",
            "status": "placeholder_transform",
            "notes": "Neutral main panel, glareshield, pedestal, and captain-eye frame only; not a production cockpit shell."
        },
        "componentInstances": instances,
    }
    path.write_text(json.dumps(layout, indent=2) + "\n", encoding="utf-8")
    return layout


def _instance(candidate: dict[str, object], group: str, runtime: str, translation: list[float], rotation: list[float], scale: list[float], interaction: str, axis: str) -> dict[str, object]:
    component_id = candidate["componentId"]
    return {
        "componentId": component_id,
        "category": candidate["category"],
        "sourceVariant": candidate["sourceVariant"],
        "targetVariant": candidate["targetVariant"],
        "variantScope": candidate["variantScope"],
        "sourceGlb": candidate["glbPath"],
        "sourceMetadata": candidate["metadataPath"],
        "sourceStageHashes": {
            "glbSha256": candidate["glbPathSha256"],
            "metadataSha256": candidate["metadataPathSha256"],
        },
        "parentGroupName": group,
        "runtimeNodeName": runtime,
        "transform": {
            "translation": translation,
            "rotationEuler": rotation,
            "scale": scale,
            "status": "placeholder_transform",
        },
        "pivotRepair": {
            "status": "repaired_with_parent_pivot_empty",
            "method": "Create runtime pivot empty from layout and parent preserved source hierarchy beneath it.",
            "pivotLocal": [0, 0, 0],
        },
        "interactionMetadata": {
            "game_id": f"dc9.vslice.{component_id}",
            "interaction": interaction,
            "puzzle_id": "legacy_qualification_vslice",
            "rotation_axis": axis,
            "rest_angle": 0.0,
            "active_angle": 0.35,
            "sound_id": "source_neutral_click",
        },
    }


def _run_blender_assembly(layout_path: Path, output_dir: Path, preview_dir: Path) -> None:
    blender = os.environ.get("BLENDER_BIN") or shutil.which("blender")
    if not blender:
        raise RuntimeError("Blender executable unavailable; set BLENDER_BIN or install blender on PATH")
    script = Path(__file__).with_name("assembly_blender_build.py")
    command = [
        blender,
        "--background",
        "--factory-startup",
        "--disable-autoexec",
        "--python",
        str(script),
        "--",
        "--layout",
        str(layout_path),
        "--output-dir",
        str(output_dir),
        "--preview-dir",
        str(preview_dir),
    ]
    result = subprocess.run(command, check=False, text=True, capture_output=True)
    if result.returncode != 0 or "Traceback" in result.stdout or "Traceback" in result.stderr:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"Blender assembly failed with exit {result.returncode}: {detail}")


def _write_manifest(root: Path, manifest_dir: Path, assembly_job_id: str, approved_inputs: list[Path], outputs: list[Path]) -> Path:
    manifest_path = manifest_dir / "assembly-complete.json"
    manifest = {
        "manifestId": f"{assembly_job_id}-assembly-complete",
        "jobId": assembly_job_id,
        "stage": "assembly_complete",
        "createdAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "variantScope": "unknown",
        "artifactBasePath": root.as_posix(),
        "inputs": [file_record(path, root) for path in _unique(approved_inputs)],
        "outputs": [file_record(path, root) for path in _unique(outputs)],
        "approval": {
            "approved": False,
            "approvedBy": "human-review-pending",
            "notes": "Assembly complete only. Human review is required before assembly approval and before Agent 3 shading."
        },
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def _write_assembly_report(path: Path, assembly_job_id: str, source_job_id: str, approved: list[dict[str, object]], layout_path: Path, output_dir: Path, preview_dir: Path, validation: dict[str, object], commit: str) -> None:
    approved_lines = "\n".join(f"- `{item['componentId']}` ({item['category']})" for item in approved)
    text = f"""# DC-9 Vertical Slice Assembly Report

## Branch And Stage

- Branch: `asset/dc9-vslice-assembly`
- Commit: `{commit}`
- Source job: `{source_job_id}`
- Assembly job: `{assembly_job_id}`
- Stage: `assembly_complete`
- Source variant: `{SOURCE_VARIANT}`
- Target variant: `{TARGET_VARIANT}`

## Commands Run

| Command | Result |
|---|---|
| `python3 -m tools.blender.cockpit_pipeline.preflight` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/{source_job_id}/manifests/sourcing-complete.json` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-assembly-job` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/{assembly_job_id}/manifests/assembly-complete.json` | Pass |

## Approved Components

{approved_lines}

## Generated Files

- Layout: `{layout_path.as_posix()}`
- Blend: `{(output_dir / 'dc9-vslice-assembly.blend').as_posix()}`
- GLB: `{(output_dir / 'dc9-vslice-assembly.glb').as_posix()}`
- Node and pivot report: `{(output_dir / 'node-pivot-report.json').as_posix()}`
- Validation report: `{(output_dir / 'validation-report.json').as_posix()}`
- Preview directory: `{preview_dir.as_posix()}`

## Pivot Repairs

Each component uses a runtime parent pivot empty recorded in layout JSON. Source child hierarchy is preserved beneath the pivot empty.

## Validation Results

- Status: `{validation['status']}`
- Component count: `{validation['componentCount']}`
- Object count: `{validation['objectCount']}`
- Mesh count: `{validation['meshCount']}`
- Reimport status: `{validation['reimportValidation']['status']}`
- Source inputs immutable: `{validation['sourceInputsImmutable']}`

## Known Limitations

- Layout transforms are placeholders pending model-correct DC-9 cockpit measurements.
- Neutral materials only; Agent 3 owns shading.
- The switch cluster remains lower confidence from Agent 1 and needs human review.
- This GLB is not a production asset and was not written to `public/models/**`.

## Diff Review

Changes are limited to Ubuntu-owned pipeline, assembly output, reports, and preview paths.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-assembly-job
```
"""
    path.write_text(text, encoding="utf-8")


def _unique(paths: list[Path]) -> list[Path]:
    seen = set()
    unique = []
    for path in paths:
        resolved = path.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        unique.append(resolved)
    return unique


def _git_commit(root: Path) -> str:
    result = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"], check=False, text=True, capture_output=True)
    return result.stdout.strip() if result.returncode == 0 else "unknown"
