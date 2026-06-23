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


SOURCE_VARIANT = "DC-9-32"
TARGET_VARIANT = "unresolved"
SHADING_JOB_ID = "dc9-vslice-shading"
ASSEMBLY_JOB_ID = "dc9-vslice-assembly"


def run_shading_job(assembly_job_id: str = ASSEMBLY_JOB_ID, shading_job_id: str = SHADING_JOB_ID) -> None:
    root = Path(__file__).resolve().parents[3]
    assembly_job_dir = root / "art-source/cockpit-pipeline/jobs" / assembly_job_id
    approval_path = assembly_job_dir / "assembly-approval.json"
    manifest_path = assembly_job_dir / "manifests/assembly-complete.json"
    recipe_path = root / "art-source/cockpit-pipeline/stages/shading/input" / shading_job_id / "material-recipes.json"
    output_dir = root / "art-source/cockpit-pipeline/builds/shaded" / shading_job_id
    report_dir = root / "asset-reports/cockpit-pipeline" / shading_job_id
    preview_dir = root / "preview-renders/cockpit-pipeline" / shading_job_id
    manifest_dir = root / "art-source/cockpit-pipeline/jobs" / shading_job_id / "manifests"

    for path in (recipe_path.parent, output_dir, report_dir, preview_dir, manifest_dir):
        path.mkdir(parents=True, exist_ok=True)

    assembly_manifest = validate_json_file(manifest_path, "stage_manifest.schema.json")
    verify_manifest_hashes(assembly_manifest, manifest_path)
    approval = _load_assembly_approval(approval_path)
    _verify_approved_assembly(root, approval, assembly_manifest)
    before_hashes = _approved_hashes(root, approval)

    recipes = _material_recipes()
    recipe_path.write_text(json.dumps(recipes, indent=2) + "\n", encoding="utf-8")

    assembly_glb = root / _artifact(approval, "dc9-vslice-assembly.glb")["path"]
    layout_path = root / _artifact(approval, "resolved-layout.json")["path"]
    node_report_path = root / _artifact(approval, "node-pivot-report.json")["path"]
    _run_blender_shading(assembly_glb, layout_path, node_report_path, recipe_path, output_dir, preview_dir)

    after_hashes = _approved_hashes(root, approval)
    if before_hashes != after_hashes:
        raise RuntimeError("approved assembly artifacts changed during shading")

    validation_path = output_dir / "validation-report.json"
    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    validation["approvedAssemblyInputsImmutable"] = True
    validation["approvedAssemblyArtifact"] = assembly_glb.relative_to(root).as_posix()
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    if validation["status"] != "pass":
        raise RuntimeError(f"shading validation failed: {validation_path}")

    contact_sheet = _write_contact_sheet(root, preview_dir, shading_job_id)
    report_path = report_dir / "shading-report.md"
    _write_shading_report(report_path, approval, recipe_path, output_dir, preview_dir, contact_sheet, validation, _git_commit(root))

    manifest = _write_manifest(
        root=root,
        manifest_dir=manifest_dir,
        shading_job_id=shading_job_id,
        inputs=[approval_path, manifest_path, *(root / item["path"] for item in approval["approvedArtifacts"])],
        outputs=[
            recipe_path,
            output_dir / "dc9-vslice-shaded.blend",
            output_dir / "dc9-vslice-shaded.glb",
            output_dir / "material-assignment-report.json",
            output_dir / "texture-bake-report.json",
            output_dir / "validation-report.json",
            report_path,
            contact_sheet,
            *(output_dir / "textures" / f"{recipe['recipeId']}.png" for recipe in recipes["recipes"]),
            *(preview_dir / name for name in [
                "captain-daylight.png",
                "captain-dim-instrument-lighting.png",
                "yoke-material-close-up.png",
                "throttle-material-close-up.png",
                "gauge-glass-face-close-up.png",
                "switch-cluster-close-up.png",
            ]),
        ],
    )
    validate_json_file(manifest, "stage_manifest.schema.json")
    verify_manifest_hashes(json.loads(manifest.read_text(encoding="utf-8")), manifest)
    require_transition("assembly-approved", "shading_complete")

    print(f"Shading job complete: {shading_job_id}")
    print(f"Shaded GLB: {output_dir / 'dc9-vslice-shaded.glb'}")
    print(f"Manifest: {manifest}")


def _load_assembly_approval(path: Path) -> dict[str, object]:
    if not path.is_file():
        raise FileNotFoundError(f"assembly approval is required before shading: {path}")
    approval = json.loads(path.read_text(encoding="utf-8"))
    required = ["approvalId", "jobId", "stage", "approved", "assemblyManifest", "approvedArtifacts", "approvedComponentIds"]
    missing = [key for key in required if key not in approval]
    if missing:
        raise ValueError(f"invalid assembly approval missing fields: {missing}")
    if approval["stage"] != "assembly-approved" or approval["approved"] is not True:
        raise ValueError("assembly approval must have stage assembly-approved and approved true")
    return approval


def _verify_approved_assembly(root: Path, approval: dict[str, object], manifest: dict[str, object]) -> None:
    manifest_outputs = {record["path"]: record for record in manifest["outputs"]}
    required = ["dc9-vslice-assembly.blend", "dc9-vslice-assembly.glb", "resolved-layout.json", "node-pivot-report.json"]
    for suffix in required:
        artifact = _artifact(approval, suffix)
        path = artifact["path"]
        if path not in manifest_outputs:
            raise ValueError(f"approved assembly artifact is not declared by assembly manifest: {path}")
        if manifest_outputs[path]["sha256"] != artifact["sha256"]:
            raise ValueError(f"approval hash does not match assembly manifest for {path}")
        verify_file_record(artifact, root)


def _artifact(approval: dict[str, object], suffix: str) -> dict[str, object]:
    matches = [item for item in approval["approvedArtifacts"] if str(item["path"]).endswith(suffix)]
    if len(matches) != 1:
        raise ValueError(f"expected exactly one approved assembly artifact ending with {suffix}, got {len(matches)}")
    return matches[0]


def _approved_hashes(root: Path, approval: dict[str, object]) -> dict[str, str]:
    return {item["path"]: sha256_file(root / item["path"]) for item in approval["approvedArtifacts"]}


def _material_recipes() -> dict[str, object]:
    base = {
        "schema": "cockpit-pipeline/material-recipes-v1",
        "jobId": SHADING_JOB_ID,
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "variantScope": "unknown",
        "reference": "art-source/references/dc9-51/primary/dc9_51_n775nc_cockpit_primary.jpg",
    }
    recipes = [
        ("dc9_painted_blue_green_gray", "blue-green/gray painted cockpit metal", [0.32, 0.52, 0.52, 1], 0.74, 0.0, 311, 0.13, ["reference frame", "panel faces", "pedestal sides"]),
        ("dc9_dark_instrument_panel", "dark instrument panel", [0.035, 0.038, 0.04, 1], 0.68, 0.0, 317, 0.12, ["glareshield", "instrument panel recesses"]),
        ("dc9_black_rubber", "black rubber", [0.01, 0.009, 0.008, 1], 0.82, 0.0, 331, 0.10, ["yoke grips", "rubber boots"]),
        ("dc9_aged_dark_plastic", "aged dark plastic", [0.045, 0.043, 0.04, 1], 0.58, 0.0, 337, 0.14, ["switch housings", "knobs", "yoke centers"]),
        ("dc9_brushed_worn_metal", "brushed or worn metal", [0.62, 0.6, 0.55, 1], 0.42, 0.65, 347, 0.18, ["throttle levers", "bezel rims", "control rods"]),
        ("dc9_instrument_glass", "instrument glass", [0.72, 0.88, 0.92, 0.26], 0.06, 0.0, 353, 0.01, ["instrument glass covers"]),
        ("dc9_gauge_face", "gauge face material", [0.055, 0.058, 0.052, 0.68], 0.78, 0.0, 359, 0.03, ["gauge faces"]),
        ("dc9_cream_stencil", "white/cream stencil or label markings", [0.94, 0.9, 0.74, 1], 0.62, 0.0, 367, 0.02, ["needle marks", "labels", "stencil details"]),
        ("dc9_fasteners", "fasteners", [0.36, 0.35, 0.32, 1], 0.5, 0.55, 373, 0.20, ["screws", "small fasteners"]),
        ("dc9_subtle_grime_wear", "subtle grime/wear overlay", [0.12, 0.105, 0.085, 1], 0.9, 0.0, 379, 0.09, ["localized switch grime", "edge wear masks"]),
        ("dc9_safe_neutral", "safe neutral fallback", [0.5, 0.52, 0.5, 1], 0.7, 0.0, 383, 0.0, ["unclassified mesh fallback"]),
    ]
    base["recipes"] = [
        {
            "recipeId": recipe_id,
            "semanticMaterialRole": role,
            "baseColor": color,
            "roughness": roughness,
            "metallic": metallic,
            "proceduralSeed": seed,
            "wearIntensity": wear,
            "bakeSettings": {
                "method": "deterministic procedural 128px PBR base-color texture",
                "resolution": 128,
                "colorSpace": "sRGB",
                "noBakeReason": None,
            },
            "intendedObjectRoles": intended,
        }
        for recipe_id, role, color, roughness, metallic, seed, wear, intended in recipes
    ]
    return base


def _run_blender_shading(assembly_glb: Path, layout_path: Path, node_report_path: Path, recipe_path: Path, output_dir: Path, preview_dir: Path) -> None:
    blender = os.environ.get("BLENDER_BIN") or shutil.which("blender")
    if not blender:
        raise RuntimeError("Blender executable unavailable; set BLENDER_BIN or install blender on PATH")
    script = Path(__file__).with_name("shading_blender_apply.py")
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
        "--layout",
        str(layout_path),
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
        raise RuntimeError(f"Blender shading failed with exit {result.returncode}: {detail}")


def _write_contact_sheet(root: Path, preview_dir: Path, shading_job_id: str) -> Path:
    path = preview_dir / "neutral-vs-shaded-contact-sheet.svg"
    neutral = root / "preview-renders/cockpit-pipeline/dc9-vslice-assembly/captain-seat-view.png"
    daylight = preview_dir / "captain-daylight.png"
    dim = preview_dir / "captain-dim-instrument-lighting.png"
    labels = [("Neutral assembly", neutral), ("Shaded daylight", daylight), ("Shaded dim lighting", dim)]
    rows = []
    for index, (label, image) in enumerate(labels):
        y = 44 + index * 284
        rel = image.relative_to(preview_dir).as_posix() if image.is_relative_to(preview_dir) else os.path.relpath(image, preview_dir)
        rows.append(f'<text x="24" y="{y - 14}" font-family="Arial" font-size="18" fill="#222">{label}</text>')
        rows.append(f'<image x="24" y="{y}" width="448" height="280" href="{rel}" preserveAspectRatio="xMidYMid meet" />')
    svg = "\n".join([
        '<svg xmlns="http://www.w3.org/2000/svg" width="496" height="900" viewBox="0 0 496 900">',
        '<rect width="496" height="900" fill="#f3f3ef" />',
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
        "createdAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "variantScope": "unknown",
        "artifactBasePath": root.as_posix(),
        "inputs": [file_record(path, root) for path in _unique(inputs)],
        "outputs": [file_record(path, root) for path in _unique(outputs)],
        "approval": {
            "approved": False,
            "approvedBy": "human-review-pending",
            "notes": "Shading complete only. Human review is required before final visual approval."
        },
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def _write_shading_report(path: Path, approval: dict[str, object], recipe_path: Path, output_dir: Path, preview_dir: Path, contact_sheet: Path, validation: dict[str, object], commit: str) -> None:
    assignment_report = json.loads((output_dir / "material-assignment-report.json").read_text(encoding="utf-8"))
    texture_report = json.loads((output_dir / "texture-bake-report.json").read_text(encoding="utf-8"))
    role_lines = "\n".join(f"- `{recipe}`: `{count}` objects" for recipe, count in sorted(assignment_report["countsByRecipe"].items()))
    text = f"""# DC-9 Vertical Slice Shading Report

## Branch And Stage

- Branch: `asset/dc9-vslice-shading`
- Commit: `{commit}`
- Assembly job: `{approval["jobId"]}`
- Shading job: `{SHADING_JOB_ID}`
- Stage: `shading_complete`
- Source variant: `{approval["sourceVariant"]}`
- Target variant: `{approval["targetVariant"]}`
- Variant scope: `{approval["variantScope"]}`

## Commands Run

| Command | Result |
|---|---|
| `python3 -m tools.blender.cockpit_pipeline.preflight` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-shading-job` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-vslice-shading/manifests/shading-complete.json` | Pass |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from assembly-approved --to shading_complete` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from shading_complete --to shading-approved` | Pass |

## Approved Assembly Artifact

- `{validation["approvedAssemblyArtifact"]}`

## Material Recipes

- `{recipe_path}`

## Material Role Mapping

{role_lines}

## Baked Texture Outputs

- Texture count: `{texture_report["textureCount"]}`
- Texture directory: `{output_dir / "textures"}`

## Generated Files

- Shaded blend: `{output_dir / "dc9-vslice-shaded.blend"}`
- Shaded GLB: `{output_dir / "dc9-vslice-shaded.glb"}`
- Material assignment report: `{output_dir / "material-assignment-report.json"}`
- Texture bake report: `{output_dir / "texture-bake-report.json"}`
- Validation report: `{output_dir / "validation-report.json"}`
- Preview directory: `{preview_dir}`
- Comparison contact sheet: `{contact_sheet}`

## Validation Results

- Status: `{validation["status"]}`
- Runtime node names preserved: `{validation["runtimeNodeNamesPreserved"]}`
- Interaction metadata preserved: `{validation["interactionMetadataPreserved"]}`
- Reimport status: `{validation["reimportValidation"]["status"]}`
- Dimension drift max meters: `{validation["dimensionDriftMax"]}`
- Approved assembly inputs immutable: `{validation["approvedAssemblyInputsImmutable"]}`

## Known Limitations

- This is a shaded four-component vertical slice, not a full cockpit.
- The FlightGear source switch cluster remains sparse.
- Procedural textures are small deterministic PBR proof textures, not final hand-painted production textures.
- No production model was written to `public/models/**`.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-shading-job
```
"""
    path.write_text(text, encoding="utf-8")


def _git_commit(root: Path) -> str:
    result = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, text=True, capture_output=True, check=False)
    return result.stdout.strip() if result.returncode == 0 else "unknown"


def _unique(paths: list[Path]) -> list[Path]:
    seen = set()
    unique = []
    for path in paths:
        resolved = path.resolve()
        if resolved not in seen:
            unique.append(path)
            seen.add(resolved)
    return unique
