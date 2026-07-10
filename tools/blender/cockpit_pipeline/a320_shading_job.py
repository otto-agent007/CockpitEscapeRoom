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
    viewer_settings_path = root / "asset-reports/cockpit-pipeline" / shading_job_id / "sketchfab-viewer-settings.json"
    material_parity_path = root / "asset-reports/cockpit-pipeline" / shading_job_id / "sketchfab-material-parity-summary.json"
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
    recipes["referenceEvidence"] = [
        item for item in recipes["referenceEvidence"]
        if (root / item).is_file()
    ]
    recipe_path.write_text(json.dumps(recipes, indent=2) + "\n", encoding="utf-8")

    assembly_glb = root / _artifact(approval, "a320-cockpit-2-assembly.glb")["path"]
    node_report_path = root / _artifact(approval, "node-pivot-report.json")["path"]
    optional_inputs = [path for path in (viewer_settings_path, material_parity_path) if path.exists()]

    _run_blender_a320_shading(
        assembly_glb,
        node_report_path,
        recipe_path,
        viewer_settings_path if viewer_settings_path.exists() else None,
        material_parity_path if material_parity_path.exists() else None,
        output_dir,
        preview_dir,
    )

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
    _write_shading_report(report_path, approval, recipe_path, output_dir, preview_dir, contact_sheet, validation, _git_branch(root), _git_commit(root))

    preview_outputs = [
        preview_dir / name
        for name in [
            "captain-daylight.png",
            "captain-display-check.png",
            "captain-pullback-review.png",
            "complete-interior-approval.png",
            "first-officer-approval.png",
            "sketchfab-camera-parity.png",
        ]
        if (preview_dir / name).is_file()
    ]
    manifest = _write_manifest(
        root=root,
        manifest_dir=manifest_dir,
        shading_job_id=shading_job_id,
        inputs=[
            approval_path,
            manifest_path,
            *optional_inputs,
            *(root / item["path"] for item in approval["approvedArtifacts"]),
        ],
        outputs=[
            recipe_path,
            output_dir / "a320-cockpit-2-shaded.blend",
            output_dir / "a320-cockpit-2-shaded.glb",
            output_dir / "loose-part-review-report.json",
            output_dir / "material-assignment-report.json",
            output_dir / "texture-inventory-report.json",
            output_dir / "validation-report.json",
            gate_path,
            report_path,
            contact_sheet,
            *preview_outputs,
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
            "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/matcap.png",
            "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/wireframe.png",
            "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/uv-checker.png",
            "asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-viewer-settings.json",
            "asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-material-parity-summary.json",
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


def _run_blender_a320_shading(
    assembly_glb: Path,
    node_report_path: Path,
    recipe_path: Path,
    viewer_settings_path: Path | None,
    material_parity_path: Path | None,
    output_dir: Path,
    preview_dir: Path,
) -> None:
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
    if viewer_settings_path is not None:
        command.extend(["--viewer-settings", str(viewer_settings_path)])
    if material_parity_path is not None:
        command.extend(["--material-parity-summary", str(material_parity_path)])
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
        "optimizationDecision": "Preservation-first A320 source-parity pass. Source texture node links, UVs, mesh hierarchy, and runtime metadata are preserved; no mesh joining, decimation, UV rebake, or destructive GLB optimization.",
        "destructiveOptimizationUsed": False,
        "runtimeContractPreserved": validation["runtimeNodeNamesPreserved"] and validation["gameIdMetadataPreserved"],
        "reimportValidation": validation["reimportValidation"]["status"],
    }
    path.write_text(json.dumps(gate, indent=2) + "\n", encoding="utf-8")
    return gate


def _write_contact_sheet(root: Path, preview_dir: Path) -> Path:
    path = preview_dir / "sketchfab-source-parity-contact-sheet.png"
    entries = [
        ("Sketchfab final render", root / "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/final-render.png"),
        ("Sketchfab no post-processing", root / "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/no-post-processing.png"),
        ("Original Blender import", root / "preview-renders/cockpit-pipeline/a320-prebuilt-parts-source-discovery/a320-cockpit-2-import-captain-seat-view.png"),
        ("Agent 3 source-parity", preview_dir / "captain-daylight.png"),
        ("Sketchfab base color", root / "preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/base-color.png"),
        ("Complete interior approval", preview_dir / "complete-interior-approval.png"),
        ("First Officer approval", preview_dir / "first-officer-approval.png"),
        ("Sketchfab camera parity", preview_dir / "sketchfab-camera-parity.png"),
    ]
    entries = [(label, image) for label, image in entries if image.is_file()]
    convert = shutil.which("convert")
    if not convert:
        raise RuntimeError("ImageMagick convert is required to build the PNG contact sheet")
    command = [
        convert,
        "-size",
        "960x1264",
        "xc:#f3f3ef",
    ]
    for index, (label, image) in enumerate(entries):
        thumb = preview_dir / f".contact-thumb-{index}.png"
        label_img = preview_dir / f".contact-label-{index}.png"
        x = 24 + (index % 2) * 468
        y = 44 + (index // 2) * 304
        subprocess.run(
            [convert, str(image), "-resize", "440x248", "-background", "#f3f3ef", "-gravity", "center", "-extent", "440x248", str(thumb)],
            check=True,
        )
        subprocess.run(
            [convert, "-size", "440x28", "xc:#f3f3ef", "-fill", "#222222", "-font", "DejaVu-Sans", "-pointsize", "18", "-annotate", "+0+21", label, str(label_img)],
            check=True,
        )
        command.extend([str(label_img), "-geometry", f"+{x}+{y - 34}", "-composite"])
        command.extend([str(thumb), "-geometry", f"+{x}+{y}", "-composite"])
    command.append(str(path))
    subprocess.run(command, check=True)
    for temp in preview_dir.glob(".contact-*.png"):
        temp.unlink(missing_ok=True)
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


def _write_shading_report(path: Path, approval: dict[str, object], recipe_path: Path, output_dir: Path, preview_dir: Path, contact_sheet: Path, validation: dict[str, object], branch: str, commit: str) -> None:
    assignment_report = json.loads((output_dir / "material-assignment-report.json").read_text(encoding="utf-8"))
    texture_report = json.loads((output_dir / "texture-inventory-report.json").read_text(encoding="utf-8"))
    cleanup_report = json.loads((output_dir / "loose-part-review-report.json").read_text(encoding="utf-8"))
    recipes = json.loads(recipe_path.read_text(encoding="utf-8"))
    reference_lines = "\n".join(f"- `{item}`" for item in recipes.get("referenceEvidence", [])) or "- None"
    role_lines = "\n".join(f"- `{recipe}`: `{count}` objects" for recipe, count in sorted(assignment_report["countsByRecipe"].items()))
    cleanup_lines = "\n".join(f"- `{name}`" for name in cleanup_report["quarantinedNames"]) or "- None"
    sketchfab_parity_line = ""
    sketchfab_parity_path = preview_dir / "sketchfab-camera-parity.png"
    if sketchfab_parity_path.is_file():
        sketchfab_parity_line = f"- Sketchfab camera parity render: `{sketchfab_parity_path}`\n"
    text = f"""# Airbus A320 Cockpit 2 Shading Report

## Branch And Stage

- Branch: `{branch}`
- Commit: `{commit}`
- Assembly job: `{approval["jobId"]}`
- Shading job: `{SHADING_JOB_ID}`
- Stage: `shading_complete`
- Source variant: `{approval["sourceVariant"]}`
- Target variant: `{approval["targetVariant"]}`
- Variant scope: `{approval["variantScope"]}`

## Bounded Action

Agent 3 consumed the owner-approved A320 Agent 2 assembly and applied a source-parity material pass. The pass preserves the downloaded Sketchfab material texture links and UV layout, maps portable PBR scalar values when cached material-channel summaries are present, then records semantic material roles for later optimization. It does not write to `public/models/**`, does not modify browser/runtime code, does not join meshes, and does not run destructive GLB optimization.

When extracted Sketchfab viewer settings are present, this revision also consumes them to improve Blender review parity: Studio background color, directional light colors/intensities/transforms, ambient occlusion/reflection render settings where Blender exposes them, the saved Sketchfab camera, matcap/reflection evidence recorded as material metadata, and restrained display emission. This run records only the available source inspector reference renders and generated approval previews as evidence.

The final shaded blend keeps the compound cockpit shell, seats, and sidewall chunks visible. The older captain comparison previews still hide those chunks for historical camera comparison only; the new owner approval cameras and saved `.blend` do not hide them, because this asset is intended to render from inside the cockpit.

This pass also performs a conservative zoom-out cleanup before export. It quarantines only high-confidence generic source fragments into `A320_QUARANTINE_LOOSE_PARTS_REVIEW`, keeps them hidden in the saved `.blend` for auditability, and excludes them from the deployable GLB. Seat, side-console, display, panel, and named cockpit geometry is preserved.

## Reference Evidence Used

{reference_lines}

## Material Recipes

- `{recipe_path}`

## Material Role Mapping

{role_lines}

## Texture Inventory

- Texture count: `{texture_report["textureCount"]}`
- Source texture preservation: `{texture_report["sourceTexturesPreserved"]}`
- Source texture links preserved: `{validation["sourceTextureLinksPreserved"]}`
- Source texture link count: `{validation["sourceTextureLinkCount"]}`

## Loose-Part Cleanup

- Cleanup report: `{output_dir / "loose-part-review-report.json"}`
- Quarantined object count: `{len(cleanup_report["quarantinedNames"])}`
- Quarantined objects:
{cleanup_lines}

## Generated Files

- Shaded blend: `{output_dir / "a320-cockpit-2-shaded.blend"}`
- Shaded GLB: `{output_dir / "a320-cockpit-2-shaded.glb"}`
- Material assignment report: `{output_dir / "material-assignment-report.json"}`
- Loose-part review report: `{output_dir / "loose-part-review-report.json"}`
- Texture inventory report: `{output_dir / "texture-inventory-report.json"}`
- Validation report: `{output_dir / "validation-report.json"}`
- Preview directory: `{preview_dir}`
- Sketchfab comparison contact sheet: `{contact_sheet}`
- Complete interior approval render: `{preview_dir / "complete-interior-approval.png"}`
- First Officer approval render: `{preview_dir / "first-officer-approval.png"}`
{sketchfab_parity_line.rstrip()}

## Validation Results

- Status: `{validation["status"]}`
- Runtime node names preserved: `{validation["runtimeNodeNamesPreserved"]}`
- `game_id` metadata preserved: `{validation["gameIdMetadataPreserved"]}`
- UV layers preserved: `{validation["uvLayersPreserved"]}`
- Source texture links preserved: `{validation["sourceTextureLinksPreserved"]}`
- Loose fragments quarantined: `{len(cleanup_report["quarantinedNames"])}`
- Reimport status: `{validation["reimportValidation"]["status"]}`
- Dimension drift max meters: `{validation["dimensionDriftMax"]}`
- Approved assembly inputs immutable: `{validation["approvedAssemblyInputsImmutable"]}`
- Destructive optimization used: `False`

## Known Limitations

- This is a material/optimization handoff for a prebuilt A320 cockpit source, not final browser integration.
- Five First-Officer pivot, collider, and cue-proxy contracts survive shaded export/reimport. That coordinate check does not by itself verify browser visual alignment; imported source mesh chunks outside that player-facing set remain compound parts with broad semantic labels.
- Finer imported-source mesh splitting remains deferred until downstream interactions require independent visible control pivots.
- Display treatment is restrained preview material work; live avionics UI and accessible HTML mirrors remain downstream browser work.
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


def _git_branch(root: Path) -> str:
    result = subprocess.run(["git", "-C", str(root), "rev-parse", "--abbrev-ref", "HEAD"], check=False, text=True, capture_output=True)
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
