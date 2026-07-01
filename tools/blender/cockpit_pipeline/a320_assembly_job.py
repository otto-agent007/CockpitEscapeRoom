from __future__ import annotations

import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from .hashing import file_record, sha256_file, verify_manifest_hashes
from .schema_validation import validate_json_file
from .state_machine import require_transition


SOURCE_JOB_ID = "a320-prebuilt-parts-source-discovery"
ASSEMBLY_JOB_ID = "a320-cockpit-2-assembly"
SOURCE_VARIANT = "prebuilt-free-open-leads"
TARGET_VARIANT = "Airbus A320"
VARIANT_SCOPE = "target-confirmed"


def run_a320_assembly_job(source_job_id: str = SOURCE_JOB_ID, assembly_job_id: str = ASSEMBLY_JOB_ID) -> None:
    root = Path(__file__).resolve().parents[3]
    source_job_dir = root / "art-source/cockpit-pipeline/jobs" / source_job_id
    source_manifest_path = source_job_dir / "manifests/sourcing-complete.json"
    source_approval_path = source_job_dir / "source-approval.json"
    import_report_path = root / "asset-reports/cockpit-pipeline/a320-prebuilt-parts-source-discovery/a320-cockpit-2-blender-import-report.json"
    output_dir = root / "art-source/cockpit-pipeline/stages/assembly/output" / assembly_job_id
    report_dir = root / "asset-reports/cockpit-pipeline" / assembly_job_id
    preview_dir = root / "preview-renders/cockpit-pipeline" / assembly_job_id
    manifest_dir = root / "art-source/cockpit-pipeline/jobs" / assembly_job_id / "manifests"
    gate_dir = root / "art-source/cockpit-pipeline/gates"

    for path in (output_dir, report_dir, preview_dir, manifest_dir, gate_dir):
        path.mkdir(parents=True, exist_ok=True)

    source_manifest = validate_json_file(source_manifest_path, "stage_manifest.schema.json")
    verify_manifest_hashes(source_manifest, source_manifest_path)
    approval = _load_source_approval(source_approval_path)
    if approval["sourceJobId"] != source_job_id:
        raise ValueError(f"source approval does not match source job: {approval['sourceJobId']} != {source_job_id}")
    import_report = json.loads(import_report_path.read_text(encoding="utf-8"))
    source_gltf = Path(import_report["extractedGltf"])
    if not source_gltf.is_file():
        raise FileNotFoundError(f"A320 extracted glTF unavailable; rerun import-a320-source-candidate: {source_gltf}")
    if import_report["sourceArchiveSha256"] != approval["sourceArchiveSha256"]:
        raise ValueError("source approval archive hash does not match import report")

    before_hash = sha256_file(source_gltf)
    _run_blender_a320_assembly(source_gltf, output_dir, preview_dir)
    after_hash = sha256_file(source_gltf)
    source_immutable = before_hash == after_hash
    if not source_immutable:
        raise RuntimeError("approved A320 source glTF changed during assembly")

    validation_path = output_dir / "validation-report.json"
    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    validation["sourceInputsImmutable"] = source_immutable
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    if validation["status"] != "pass":
        raise RuntimeError(f"A320 assembly validation failed: {validation_path}")

    contract_summary_path = output_dir / "runtime-contract-summary.json"
    contract_summary = json.loads(contract_summary_path.read_text(encoding="utf-8"))
    runtime_contract_path = gate_dir / "a320-cockpit-2-runtime-contract.json"
    _write_runtime_contract(runtime_contract_path, contract_summary)
    validate_json_file(runtime_contract_path, "runtime_contract.schema.json")

    report_path = report_dir / "assembly-report.md"
    _write_report(report_path, source_job_id, assembly_job_id, output_dir, preview_dir, runtime_contract_path, validation, _git_commit(root))
    manifest_path = _write_manifest(
        root=root,
        manifest_dir=manifest_dir,
        assembly_job_id=assembly_job_id,
        inputs=[source_approval_path, source_manifest_path, import_report_path],
        outputs=[
            output_dir / "a320-cockpit-2-assembly.blend",
            output_dir / "a320-cockpit-2-assembly.glb",
            output_dir / "node-pivot-report.json",
            output_dir / "validation-report.json",
            output_dir / "runtime-contract-summary.json",
            runtime_contract_path,
            report_path,
            preview_dir / "captain-seat-view.png",
            preview_dir / "dashboard-screens-view.png",
        ],
    )
    validate_json_file(manifest_path, "stage_manifest.schema.json")
    verify_manifest_hashes(json.loads(manifest_path.read_text(encoding="utf-8")), manifest_path)
    require_transition("source-approved", "assembly_complete")
    print(f"A320 assembly job complete: {assembly_job_id}")
    print(f"Assembly GLB: {output_dir / 'a320-cockpit-2-assembly.glb'}")
    print(f"Runtime contract: {runtime_contract_path}")
    print(f"Manifest: {manifest_path}")


def _load_source_approval(path: Path) -> dict[str, object]:
    if not path.is_file():
        raise FileNotFoundError(f"source approval is required before A320 assembly: {path}")
    approval = json.loads(path.read_text(encoding="utf-8"))
    required = ["approvalId", "sourceJobId", "stage", "approved", "sourceManifest", "candidateId", "sourceArchiveSha256"]
    missing = [key for key in required if key not in approval]
    if missing:
        raise ValueError(f"invalid A320 source approval missing fields: {missing}")
    if approval["stage"] != "source-approved" or approval["approved"] is not True:
        raise ValueError("A320 source approval must have stage source-approved and approved true")
    return approval


def _run_blender_a320_assembly(source_gltf: Path, output_dir: Path, preview_dir: Path) -> None:
    blender = os.environ.get("BLENDER_BIN") or shutil.which("blender")
    if not blender:
        raise RuntimeError("Blender executable unavailable; set BLENDER_BIN or install blender on PATH")
    script = Path(__file__).with_name("a320_assembly_blender_build.py")
    command = [
        blender,
        "--background",
        "--factory-startup",
        "--disable-autoexec",
        "--python",
        str(script),
        "--",
        "--source-gltf",
        str(source_gltf),
        "--output-dir",
        str(output_dir),
        "--preview-dir",
        str(preview_dir),
    ]
    result = subprocess.run(command, check=False, text=True, capture_output=True)
    if result.returncode != 0 or "Traceback" in result.stdout or "Traceback" in result.stderr:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"A320 Blender assembly failed with exit {result.returncode}: {detail}")


def _write_runtime_contract(path: Path, summary: dict[str, object]) -> None:
    contract = {
        "gate": "runtime-contract",
        "artifactId": "a320-cockpit-2-runtime-contract-001",
        "createdAt": _now(),
        "sceneGroup": summary["sceneGroup"],
        "assetPath": summary["assetPath"],
        "rootObject": summary["rootObject"],
        "runtimeNodes": summary["runtimeNodes"],
        "customPropertiesPreserved": True,
        "reimportValidation": "pass",
        "scaleAndCameraAssumptions": "Source model is kept in imported Blender scale. Captain-seat and dashboard locators are inspection references, not final gameplay cameras.",
        "knownReferenceDeviations": [
            "Prebuilt Sketchfab source still needs model-correct A320 reference review before production promotion.",
            "Individual control pivots are not verified; only grouping roots and camera locators are contract-stable in this pass.",
            "Display content is dark/static source geometry; live display materials and interaction belong to later stages."
        ],
    }
    path.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")


def _write_manifest(root: Path, manifest_dir: Path, assembly_job_id: str, inputs: list[Path], outputs: list[Path]) -> Path:
    manifest_path = manifest_dir / "assembly-complete.json"
    manifest = {
        "manifestId": f"{assembly_job_id}-assembly-complete",
        "jobId": assembly_job_id,
        "stage": "assembly_complete",
        "createdAt": _now(),
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "variantScope": VARIANT_SCOPE,
        "artifactBasePath": root.as_posix(),
        "inputs": [file_record(path, root) for path in _unique(inputs)],
        "outputs": [file_record(path, root) for path in _unique(outputs)],
        "approval": {
            "approved": False,
            "approvedBy": "human-review-pending",
            "notes": "A320 Agent 2 assembly complete only. Human review is required before assembly approval and before Agent 3 materials/optimization."
        },
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def _write_report(path: Path, source_job_id: str, assembly_job_id: str, output_dir: Path, preview_dir: Path, runtime_contract_path: Path, validation: dict[str, object], commit: str) -> None:
    text = f"""# Airbus A320 Cockpit 2 Assembly Report

## Branch And Stage

- Branch: `codex/asset-workflow-health-rehearsal`
- Commit: `{commit}`
- Source job: `{source_job_id}`
- Assembly job: `{assembly_job_id}`
- Stage: `assembly_complete`
- Source variant: `{SOURCE_VARIANT}`
- Target variant: `{TARGET_VARIANT}`

## Bounded Action

Agent 2 consumed the owner-approved A320 Cockpit 2 source inspection artifact and produced a neutral assembly handoff. This pass did not run Agent 3 materials/optimization, did not write to `public/models/**`, and did not modify browser/runtime code.

## Generated Files

- Blend: `{(output_dir / 'a320-cockpit-2-assembly.blend').as_posix()}`
- GLB: `{(output_dir / 'a320-cockpit-2-assembly.glb').as_posix()}`
- Node and pivot report: `{(output_dir / 'node-pivot-report.json').as_posix()}`
- Validation report: `{(output_dir / 'validation-report.json').as_posix()}`
- Runtime contract gate: `{runtime_contract_path.as_posix()}`
- Preview directory: `{preview_dir.as_posix()}`

## Assembly Work

- Removed only the known exterior shell and wall-blocker objects from the inspected source.
- Created `AIRBUS_ROOT` and stable Airbus grouping nodes for static geometry, display candidates, interactive candidates, locators, colliders, and puzzle props.
- Renamed imported mesh nodes with stable `AIRBUS_A320_*` prefixes while preserving original source node names in custom properties.
- Added basic `game_id` metadata to root, groups, locators, and classified meshes.
- Exported a neutral GLB with `export_extras=True`.

## Validation Results

- Status: `{validation['status']}`
- Object count: `{validation['objectCount']}`
- Mesh count: `{validation['meshCount']}`
- Material count: `{validation['materialCount']}`
- Reimport status: `{validation['reimportValidation']['status']}`
- Source inputs immutable: `{validation['sourceInputsImmutable']}`

## Known Limitations

- Individual control pivots are not verified yet; this pass establishes grouping roots and source classification.
- Materials are source/import materials only. Agent 3 owns material cleanup, display treatment, texture sizing, and optimization.
- The GLB is a staged assembly artifact, not a deployable production asset.
- Browser integration remains a separate Windows-owned handoff after later approval.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-assembly-job
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


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _git_commit(root: Path) -> str:
    result = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"], check=False, text=True, capture_output=True)
    return result.stdout.strip() if result.returncode == 0 else "unknown"
