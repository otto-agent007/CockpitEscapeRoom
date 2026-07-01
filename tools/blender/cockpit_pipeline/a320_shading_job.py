from __future__ import annotations

import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from .hashing import file_record, sha256_file, verify_file_record, verify_manifest_hashes
from .schema_validation import validate_json_file
from .state_machine import require_transition


SOURCE_VARIANT = "prebuilt-free-open-leads"
TARGET_VARIANT = "Airbus A320"
VARIANT_SCOPE = "target-confirmed"
ASSEMBLY_JOB_ID = "a320-cockpit-2-assembly"
SHADING_JOB_ID = "a320-cockpit-2-shading"


def run_a320_shading_job(assembly_job_id: str = ASSEMBLY_JOB_ID, shading_job_id: str = SHADING_JOB_ID) -> None:
    root = Path(__file__).resolve().parents[3]
    assembly_job_dir = root / "art-source/cockpit-pipeline/jobs" / assembly_job_id
    approval_path = assembly_job_dir / "assembly-approval.json"
    manifest_path = assembly_job_dir / "manifests/assembly-complete.json"
    recipe_path = root / "art-source/cockpit-pipeline/stages/shading/input" / shading_job_id / "material-recipes.json"
    output_dir = root / "art-source/cockpit-pipeline/builds/shaded" / shading_job_id
    report_dir = root / "asset-reports/cockpit-pipeline" / shading_job_id
    preview_dir = root / "preview-renders/cockpit-pipeline" / shading_job_id
    manifest_dir = root / "art-source/cockpit-pipeline/jobs" / shading_job_id / "manifests"
    gate_path = root / "art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json"

    for path in (recipe_path.parent, output_dir, report_dir, preview_dir, manifest_dir, gate_path.parent):
        path.mkdir(parents=True, exist_ok=True)

    assembly_manifest = validate_json_file(manifest_path, "stage_manifest.schema.json")
    verify_manifest_hashes(assembly_manifest, manifest_path)
    approval = _load_assembly_approval(approval_path)
    _verify_approved_assembly(root, approval, assembly_manifest)
    before_hashes = _approved_hashes(root, approval)

    recipes = _material_recipes()
    recipe_path.write_text(json.dumps(recipes, indent=2) + "\n", encoding="utf-8")

    assembly_glb = root / _artifact(approval, "a320-cockpit-2-assembly.glb")["path"]
    node_report_path = root / _artifact(approval, "node-pivot-report.json")["path"]
    _run_blender_a320_shading(assembly_glb, node_report_path, recipe_path, output_dir, preview_dir)

    after_hashes = _approved_hashes(root, approval)
    if before_hashes != after_hashes:
        raise RuntimeError("approved A320 assembly artifacts changed during shading")

    validation_path = output_dir / "validation-report.json"
    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    validation["approvedAssemblyInputsImmutable"] = True
    validation["approvedAssemblyArtifact"] = assembly_glb.relative_to(root).as_posix()
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    if validation["status"] != "pass":
        raise RuntimeError(f"A320 shading validation failed: {validation_path}")

    report_path = report_dir / "shading-report.md"
    gate = _write_material_gate(gate_path, output_dir, validation)
    validate_json_file(gate_path, "material_optimization.schema.json")
    contact_sheet = _write_contact_sheet(root, preview_dir)
    _write_shading_report(report_path, approval, recipe_path, output_dir, preview_dir, contact_sheet, validation, _git_commit(root))

    manifest = _write_manifest(
        root=root,
        manifest_dir=manifest_dir,
        shading_job_id=shading_job_id,
        inputs=[approval_path, manifest_path, *(root / item["path"] for item in approval["approvedArtifacts"])],
        outputs=[
            recipe_path,
            output_dir / "a320-cockpit-2-shaded.blend",
            output_dir / "a320-cockpit-2-shaded.glb",
            output_dir / "material-assignment-report.json",
            output_dir / "texture-inventory-report.json",
            output_dir / "validation-report.json",
            gate_path,
            report_path,
            contact_sheet,
            *(preview_dir / name for name in [
                "captain-daylight.png",
                "captain-display-check.png",
                "overhead-pedestal-material-check.png",
            ]),
        ],
    )
    validate_json_file(manifest, "stage_manifest.schema.json")
    verify_manifest_hashes(json.loads(manifest.read_text(encoding="utf-8")), manifest)
    require_transition("assembly-approved", "shading_complete")

    print(f"A320 shading job complete: {shading_job_id}")
    print(f"Shaded GLB: {output_dir / 'a320-cockpit-2-shaded.glb'}")
    print(f"Material gate: {gate_path}")
    print(f"Manifest: {manifest}")


def _load_assembly_approval(path: Path) -> dict[str, object]:
    if not path.is_file():
        raise FileNotFoundError(f"A320 assembly approval is required before shading: {path}")
    approval = json.loads(path.read_text(encoding="utf-8"))
    required = ["approvalId", "jobId", "stage", "approved", "assemblyManifest", "approvedArtifacts", "approvedComponentIds"]
    missing = [key for key in required if key not in approval]
    if missing:
        raise ValueError(f"invalid A320 assembly approval missing fields: {missing}")
    if approval["stage"] != "assembly-approved" or approval["approved"] is not True:
        raise ValueError("A320 assembly approval must have stage assembly-approved and approved true")
    return approval


def _verify_approved_assembly(root: Path, approval: dict[str, object], manifest: dict[str, object]) -> None:
    manifest_outputs = {record["path"]: record for record in manifest["outputs"]}
    required = ["a320-cockpit-2-assembly.blend", "a320-cockpit-2-assembly.glb", "node-pivot-report.json", "validation-report.json", "runtime-contract-summary.json"]
    for suffix in required:
        artifact = _artifact(approval, suffix)
        path = artifact["path"]
        if path not in manifest_outputs:
            raise ValueError(f"approved A320 assembly artifact is not declared by assembly manifest: {path}")
        if manifest_outputs[path]["sha256"] != artifact["sha256"]:
            raise ValueError(f"approval hash does not match assembly manifest for {path}")
        verify_file_record(artifact, root)


def _artifact(approval: dict[str, object], suffix: str) -> dict[str, object]:
    matches = [item for item in approval["approvedArtifacts"] if str(item["path"]).endswith(suffix)]
    if len(matches) != 1:
        raise ValueError(f"expected exactly one approved A320 assembly artifact ending with {suffix}, got {len(matches)}")
    return matches[0]


def _approved_hashes(root: Path, approval: dict[str, object]) -> dict[str, str]:
    return {item["path"]: sha256_file(root / item["path"]) for item in approval["approvedArtifacts"]}


def _material_recipes() -> dict[str, object]:
    recipes = [
        ("a320_preserve_source_pbr", "preserve imported Sketchfab PBR material and UVs", [0.46, 0.47, 0.45, 1], 0.68, 0.0, ["static cockpit shell", "unclassified source materials"]),
        ("a320_dark_panel_plastic", "dark Airbus instrument panel plastic", [0.025, 0.028, 0.03, 1], 0.72, 0.0, ["main panel", "pedestal dark surfaces", "glareshield"]),
        ("a320_control_dark_plastic", "dark molded control plastic", [0.035, 0.034, 0.032, 1], 0.62, 0.0, ["knobs", "switches", "sidestick and cockpit controls"]),
        ("a320_display_glass", "dark glass display face with restrained avionics glow", [0.0, 0.012, 0.018, 1], 0.16, 0.0, ["PFD", "ND", "ECAM", "MCDU display candidates"]),
        ("a320_screen_markings", "low-brightness green-cyan display marks", [0.18, 0.72, 0.68, 1], 0.38, 0.0, ["subtle display surface emphasis"]),
        ("a320_worn_metal_fasteners", "lightly worn metal and fasteners", [0.58, 0.57, 0.53, 1], 0.48, 0.65, ["screws", "rails", "metal lever accents"]),
        ("a320_soft_trim_fabric", "matte cockpit trim and seat material", [0.16, 0.17, 0.17, 1], 0.86, 0.0, ["seat shells", "sidewall trim", "soft cockpit areas"]),
    ]
    return {
        "schema": "cockpit-pipeline/material-recipes-v1",
        "jobId": SHADING_JOB_ID,
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "variantScope": VARIANT_SCOPE,
        "referenceEvidence": [
            "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/no-post-processing.png",
            "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/base-color.png",
            "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/wireframe.png",
            "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/uv-checker.png"
        ],
        "optimizationPolicy": "Preservation-first material normalization. Preserve imported UVs, source texture image nodes, hierarchy, pivots, names, and game_id metadata. Do not join meshes or run destructive geometry optimization.",
        "recipes": [
            {
                "recipeId": recipe_id,
                "semanticMaterialRole": role,
                "baseColor": color,
                "roughness": roughness,
                "metallic": metallic,
                "bakeSettings": {
                    "method": "preserve source textures; adjust Blender material inputs only",
                    "resolution": 0,
                    "colorSpace": "source",
                    "noBakeReason": "A320 downloaded source already carries useful UVs/textures; Agent 3 avoids destructive rebake."
                },
                "intendedObjectRoles": intended,
            }
            for recipe_id, role, color, roughness, metallic, intended in recipes
        ],
    }


def _run_blender_a320_shading(assembly_glb: Path, node_report_path: Path, recipe_path: Path, output_dir: Path, preview_dir: Path) -> None:
    blender = os.environ.get("BLENDER_BIN") or shutil.which("blender")
    if not blender:
        raise RuntimeError("Blender executable unavailable; set BLENDER_BIN or install blender on PATH")
    script = Path(__file__).with_name("a320_shading_blender_apply.py")
    command = [
        blender,
        "--background",
        "--factory-startup",
        "--disable-autoexec",
        "--python",
        str(script),
        "--",
        "--assembly-glb",
        str(assembly_glb),
        "--node-report",
        str(node_report_path),
        "--recipes",
        str(recipe_path),
        "--output-dir",
        str(output_dir),
        "--preview-dir",
        str(preview_dir),
    ]
    result = subprocess.run(command, check=False, text=True, capture_output=True)
    if result.returncode != 0 or "Traceback" in result.stdout or "Traceback" in result.stderr:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"A320 Blender shading failed with exit {result.returncode}: {detail}")


def _write_material_gate(path: Path, output_dir: Path, validation: dict[str, object]) -> dict[str, object]:
    texture_report = json.loads((output_dir / "texture-inventory-report.json").read_text(encoding="utf-8"))
    gate = {
        "gate": "material-optimization",
        "artifactId": "a320-cockpit-2-material-optimization-001",
        "createdAt": _now(),
        "assetPath": "art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.glb",
        "materialCount": validation["materialCount"],
        "textureReports": [
            {
                "path": item["path"],
                "width": item["width"],
                "height": item["height"],
                "usage": item["usage"],
            }
            for item in texture_report["textures"][:12]
        ],
        "glbSizeBytes": (output_dir / "a320-cockpit-2-shaded.glb").stat().st_size,
        "optimizationDecision": "Preservation-first A320 material normalization. No mesh joining, decimation, UV rebake, or destructive GLB optimization; source cockpit detail is the asset value.",
        "destructiveOptimizationUsed": False,
        "runtimeContractPreserved": validation["runtimeNodeNamesPreserved"] and validation["gameIdMetadataPreserved"],
        "reimportValidation": validation["reimportValidation"]["status"],
    }
    path.write_text(json.dumps(gate, indent=2) + "\n", encoding="utf-8")
    return gate


def _write_contact_sheet(root: Path, preview_dir: Path) -> Path:
    path = preview_dir / "neutral-vs-shaded-contact-sheet.svg"
    neutral = root / "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/captain-seat-view.png"
    daylight = preview_dir / "captain-daylight.png"
    display = preview_dir / "captain-display-check.png"
    labels = [("Neutral assembly", neutral), ("Agent 3 daylight", daylight), ("Agent 3 display check", display)]
    rows = []
    for index, (label, image) in enumerate(labels):
        y = 44 + index * 244
        rel = image.relative_to(preview_dir).as_posix() if image.is_relative_to(preview_dir) else os.path.relpath(image, preview_dir)
        rows.append(f'<text x="24" y="{y - 14}" font-family="Arial" font-size="18" fill="#222">{label}</text>')
        rows.append(f'<image x="24" y="{y}" width="512" height="216" href="{rel}" preserveAspectRatio="xMidYMid meet" />')
    svg = "\n".join([
        '<svg xmlns="http://www.w3.org/2000/svg" width="560" height="760" viewBox="0 0 560 760">',
        '<rect width="560" height="760" fill="#f3f3ef" />',
        *rows,
        '</svg>',
        '',
    ])
    path.write_text(svg, encoding="utf-8")
    return path


def _write_manifest(root: Path, manifest_dir: Path, shading_job_id: str, inputs: list[Path], outputs: list[Path]) -> Path:
    manifest_path = manifest_dir / "shading-complete.json"
    manifest = {
        "manifestId": f"{shading_job_id}-shading-complete",
        "jobId": shading_job_id,
        "stage": "shading_complete",
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
            "notes": "A320 Agent 3 material optimization complete only. Human review is required before shaded approval or browser integration."
        },
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def _write_shading_report(path: Path, approval: dict[str, object], recipe_path: Path, output_dir: Path, preview_dir: Path, contact_sheet: Path, validation: dict[str, object], commit: str) -> None:
    assignment_report = json.loads((output_dir / "material-assignment-report.json").read_text(encoding="utf-8"))
    texture_report = json.loads((output_dir / "texture-inventory-report.json").read_text(encoding="utf-8"))
    role_lines = "\n".join(f"- `{recipe}`: `{count}` objects" for recipe, count in sorted(assignment_report["countsByRecipe"].items()))
    text = f"""# Airbus A320 Cockpit 2 Shading Report

## Branch And Stage

- Branch: `codex/asset-workflow-health-rehearsal`
- Commit: `{commit}`
- Assembly job: `{approval["jobId"]}`
- Shading job: `{SHADING_JOB_ID}`
- Stage: `shading_complete`
- Source variant: `{approval["sourceVariant"]}`
- Target variant: `{approval["targetVariant"]}`
- Variant scope: `{approval["variantScope"]}`

## Bounded Action

Agent 3 consumed the owner-approved A320 Agent 2 assembly and applied a preservation-first material and optimization pass. This pass did not write to `public/models/**`, did not modify browser/runtime code, did not join meshes, and did not run destructive GLB optimization.

## Reference Evidence Used

- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/no-post-processing.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/base-color.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/wireframe.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/uv-checker.png`

## Material Recipes

- `{recipe_path}`

## Material Role Mapping

{role_lines}

## Texture Inventory

- Texture count: `{texture_report["textureCount"]}`
- Source texture preservation: `{texture_report["sourceTexturesPreserved"]}`

## Generated Files

- Shaded blend: `{output_dir / "a320-cockpit-2-shaded.blend"}`
- Shaded GLB: `{output_dir / "a320-cockpit-2-shaded.glb"}`
- Material assignment report: `{output_dir / "material-assignment-report.json"}`
- Texture inventory report: `{output_dir / "texture-inventory-report.json"}`
- Validation report: `{output_dir / "validation-report.json"}`
- Preview directory: `{preview_dir}`
- Comparison contact sheet: `{contact_sheet}`

## Validation Results

- Status: `{validation["status"]}`
- Runtime node names preserved: `{validation["runtimeNodeNamesPreserved"]}`
- `game_id` metadata preserved: `{validation["gameIdMetadataPreserved"]}`
- UV layers preserved: `{validation["uvLayersPreserved"]}`
- Reimport status: `{validation["reimportValidation"]["status"]}`
- Dimension drift max meters: `{validation["dimensionDriftMax"]}`
- Approved assembly inputs immutable: `{validation["approvedAssemblyInputsImmutable"]}`
- Destructive optimization used: `False`

## Known Limitations

- This is a material/optimization handoff for a prebuilt A320 cockpit source, not final browser integration.
- Individual interactive control pivots remain unverified from Agent 2 and are not changed in this pass.
- Display treatment is restrained preview material work; live avionics UI and accessible HTML mirrors remain downstream Windows/browser work.
- Human review is required before shaded approval or public model promotion.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job
```
"""
    path.write_text(text, encoding="utf-8")


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _git_commit(root: Path) -> str:
    result = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"], check=False, text=True, capture_output=True)
    return result.stdout.strip() if result.returncode == 0 else "unknown"


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
