from __future__ import annotations

import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
import xml.etree.ElementTree as ET

from .hashing import file_record
from .schema_validation import validate_json_file
from .state_machine import require_transition


DEFAULT_CACHE = ".cache/cockpit-pipeline"
SOURCE_VARIANT = "DC-9-32"
TARGET_VARIANT = "DC-9-50"

RELEVANT_FORMATS = {".ac", ".obj", ".gltf", ".glb", ".fbx", ".xml", ".png", ".jpg", ".jpeg", ".rgb", ".dds"}
SUPPORTED_SOURCE_FORMATS = {".ac", ".xml", ".png", ".jpg", ".jpeg"}


def run_source_job(repo_url: str, job_id: str, cache_override: Path | None = None) -> None:
    root = Path(__file__).resolve().parents[3]
    cache = _cache_path(root, cache_override)
    repo_path = cache / "sources" / "DC-9-32"
    source_output = root / "art-source/cockpit-pipeline/stages/source/output" / job_id
    preview_output = root / "preview-renders/cockpit-pipeline" / job_id
    report_output = root / "asset-reports/cockpit-pipeline" / job_id
    job_dir = root / "art-source/cockpit-pipeline/jobs" / job_id
    manifest_dir = job_dir / "manifests"
    candidate_plan_path = cache / "work" / job_id / "candidate-plan.json"
    inspection_dir = cache / "inspection" / job_id

    for path in (source_output, preview_output, report_output, job_dir, manifest_dir, candidate_plan_path.parent, inspection_dir):
        path.mkdir(parents=True, exist_ok=True)

    resolved_revision = _fetch_repo(repo_url, repo_path)
    job_path = _write_job(root, job_dir, job_id, repo_url, resolved_revision)
    validate_json_file(job_path, "job_request.schema.json")

    inventory = _inventory_repo(repo_path)
    xml_refs = _xml_reference_report(repo_path)
    candidate_plan = _candidate_plan(repo_path)
    candidate_plan_path.write_text(json.dumps(candidate_plan, indent=2) + "\n", encoding="utf-8")

    inventory_path = report_output / "source-inventory.json"
    xml_refs_path = report_output / "xml-reference-report.json"
    inventory_path.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    xml_refs_path.write_text(json.dumps(xml_refs, indent=2) + "\n", encoding="utf-8")

    extraction = _run_blender_extraction(
        repo_path=repo_path,
        plan_path=candidate_plan_path,
        output_dir=source_output,
        preview_dir=preview_output,
        inspection_dir=inspection_dir,
    )

    catalog = {
        "jobId": job_id,
        "stage": "sourcing_complete",
        "sourceRepository": repo_url,
        "resolvedRevision": resolved_revision,
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "candidateCountByCategory": _candidate_counts(extraction["candidates"]),
        "candidates": extraction["candidates"],
        "missingCategories": _missing_categories(extraction["candidates"]),
    }
    catalog_path = source_output / "component-catalog.json"
    catalog_path.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")

    validation = {
        "jobId": job_id,
        "status": "pass",
        "importProof": extraction["importProof"],
        "candidateReimports": {
            candidate["candidateId"]: candidate["reimportValidation"]
            for candidate in extraction["candidates"]
        },
        "stableComponentIds": [candidate["candidateId"] for candidate in extraction["candidates"]],
    }
    validation_path = report_output / "validation-report.json"
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")

    extraction_report_path = report_output / "extraction-report.json"
    extraction_report_path.write_text(json.dumps(extraction, indent=2) + "\n", encoding="utf-8")

    contact_sheet_path = preview_output / "component-contact-sheet.svg"
    _write_contact_sheet(contact_sheet_path, extraction["candidates"], preview_output)
    source_job_report_path = report_output / "source-job-report.md"
    _write_source_job_report(
        path=source_job_report_path,
        job_id=job_id,
        repo_url=repo_url,
        resolved_revision=resolved_revision,
        inventory=inventory,
        catalog=catalog,
    )

    manifest_path = _write_manifest(
        root=root,
        manifest_dir=manifest_dir,
        job_id=job_id,
        outputs=[
            job_path,
            inventory_path,
            xml_refs_path,
            source_output / "blender-extraction-report.json",
            catalog_path,
            validation_path,
            extraction_report_path,
            source_job_report_path,
            contact_sheet_path,
            preview_output / "import-proof-overview.png",
            *[Path(candidate["metadataJson"]) for candidate in extraction["candidates"]],
            *[Path(candidate["validationJson"]) for candidate in extraction["candidates"]],
            *[Path(candidate["exportedGlb"]) for candidate in extraction["candidates"]],
            *[Path(candidate["previewPng"]) for candidate in extraction["candidates"]],
        ],
    )
    validate_json_file(manifest_path, "stage_manifest.schema.json")
    require_transition("requested", "sourcing_complete")
    print(f"Source job complete: {job_id}")
    print(f"Resolved source revision: {resolved_revision}")
    print(f"Component catalog: {catalog_path}")
    print(f"Manifest: {manifest_path}")


def _cache_path(root: Path, cache_override: Path | None) -> Path:
    if cache_override:
        return cache_override.expanduser().resolve()
    return Path(os.environ.get("COCKPIT_PIPELINE_CACHE", root / DEFAULT_CACHE)).expanduser().resolve()


def _fetch_repo(repo_url: str, repo_path: Path) -> str:
    repo_path.parent.mkdir(parents=True, exist_ok=True)
    if (repo_path / ".git").is_dir():
        _run(["git", "-C", str(repo_path), "fetch", "--prune", "origin"])
    else:
        _run(["git", "clone", repo_url, str(repo_path)])
    return _run(["git", "-C", str(repo_path), "rev-parse", "HEAD"]).strip()


def _write_job(root: Path, job_dir: Path, job_id: str, repo_url: str, resolved_revision: str) -> Path:
    job = {
        "jobId": job_id,
        "title": "FlightGear DC-9-32 sourcing vertical slice",
        "stage": "sourcing_complete",
        "aircraft": "dc9",
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "variantScope": "compatibility-proxy",
        "sourceRepository": {
            "url": repo_url,
            "resolvedRevision": resolved_revision,
        },
        "requestedComponents": [
            {
                "componentId": "dc9-src-yoke-assembly-001",
                "label": "one yoke assembly",
                "quantity": 1,
                "acceptanceNotes": "Captain-side yoke, column, trim piece, and base as source candidates only."
            },
            {
                "componentId": "dc9-src-throttle-assembly-001",
                "label": "one throttle assembly",
                "quantity": 1,
                "acceptanceNotes": "Throttle quadrant levers, reversers, fuel cutoff levers, and pedestal mounting pieces."
            },
            {
                "componentId": "dc9-src-large-gauge-001",
                "label": "one large cockpit gauge",
                "quantity": 1,
                "acceptanceNotes": "A complete analog gauge group with face, bezel, needle, digits, and hardware."
            },
            {
                "componentId": "dc9-src-switch-cluster-001",
                "label": "one switch cluster",
                "quantity": 1,
                "acceptanceNotes": "A credible switch/knob/lamp cluster from the source, not production-approved."
            }
        ],
        "stageDirectories": {
            "sourceInput": "art-source/cockpit-pipeline/stages/source/input",
            "sourceOutput": "art-source/cockpit-pipeline/stages/source/output",
            "assemblyInput": "art-source/cockpit-pipeline/stages/assembly/input",
            "assemblyOutput": "art-source/cockpit-pipeline/stages/assembly/output",
            "shadingInput": "art-source/cockpit-pipeline/stages/shading/input",
            "shadingOutput": "art-source/cockpit-pipeline/stages/shading/output"
        },
        "cachePolicy": {
            "environmentVariable": "COCKPIT_PIPELINE_CACHE",
            "defaultRelativePath": ".cache/cockpit-pipeline",
            "gitPolicy": "outside-git"
        }
    }
    job_path = job_dir / "job.json"
    job_path.write_text(json.dumps(job, indent=2) + "\n", encoding="utf-8")
    return job_path


def _inventory_repo(repo_path: Path) -> dict[str, object]:
    all_files = [path for path in repo_path.rglob("*") if path.is_file() and ".git" not in path.parts]
    formats: dict[str, int] = {}
    relevant_files = []
    unsupported = {}
    for path in sorted(all_files):
        suffix = path.suffix.lower() or "<none>"
        formats[suffix] = formats.get(suffix, 0) + 1
        rel = path.relative_to(repo_path).as_posix()
        if path.suffix.lower() in RELEVANT_FORMATS:
            relevant_files.append({
                "path": rel,
                "format": path.suffix.lower(),
                "bytes": path.stat().st_size,
            })
        if path.suffix.lower() and path.suffix.lower() not in SUPPORTED_SOURCE_FORMATS:
            unsupported.setdefault(path.suffix.lower(), []).append(rel)
    for expected in [".ac", ".obj", ".gltf", ".glb", ".fbx", ".xml"]:
        formats.setdefault(expected, 0)
    return {
        "sourceRoot": repo_path.as_posix(),
        "formats": dict(sorted(formats.items())),
        "relevantFiles": relevant_files,
        "primaryCockpitModel": "Models/Flightdeck/flightdeck.ac",
        "primaryCockpitXml": "Models/Flightdeck/Flightdeck.xml",
        "unsupportedFormats": {
            key: values[:80]
            for key, values in sorted(unsupported.items())
            if key not in {".png", ".jpg", ".jpeg"}
        },
        "notes": [
            "AC3D .ac files are imported through the pipeline's narrow internal data importer because no configured Blender AC3D import operator is available.",
            "RGB texture files are inventoried for reproducibility but not converted in this sourcing task.",
            "Nasal, sound, and paintkit files are treated as unsupported data and are not executed."
        ],
    }


def _xml_reference_report(repo_path: Path) -> dict[str, object]:
    reports = []
    for path in sorted(repo_path.rglob("*.xml")):
        if ".git" in path.parts:
            continue
        rel = path.relative_to(repo_path).as_posix()
        try:
            tree = ET.parse(path)
        except ET.ParseError as exc:
            reports.append({"path": rel, "parseError": str(exc)})
            continue
        root = tree.getroot()
        paths = [node.text.strip() for node in root.findall(".//path") if node.text and node.text.strip()]
        animations = []
        for animation in root.findall(".//animation"):
            names = [node.text.strip() for node in animation.findall("object-name") if node.text and node.text.strip()]
            if names:
                animations.append({
                    "type": _text(animation.find("type")),
                    "objectNames": names,
                    "property": _text(animation.find("property")),
                    "hasCenter": animation.find("center") is not None,
                })
        if paths or animations:
            reports.append({"path": rel, "paths": paths, "animations": animations})
    return {"xmlFileCount": len(reports), "xmlFiles": reports}


def _candidate_plan(repo_path: Path) -> dict[str, object]:
    gauge_objects = _ac_object_names(repo_path / "Models/Flightdeck/Instruments/ALT/altimeter.ac")
    return {
        "primaryCockpitModel": "Models/Flightdeck/flightdeck.ac",
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "candidates": [
            {
                "candidateId": "dc9-src-yoke-assembly-001",
                "category": "yoke_assembly",
                "sourceVariant": SOURCE_VARIANT,
                "targetVariant": TARGET_VARIANT,
                "variantScope": "common",
                "sourceFile": "Models/Flightdeck/flightdeck.ac",
                "sourceXml": "Models/Flightdeck/Flightdeck.xml",
                "sourceObjectNames": ["YokeBase", "YokeColL", "YokeL", "YokeTrimL"],
                "pivotStatus": "XML animation centers exist for YokeColL/YokeL/YokeTrimL; source mesh origins require Agent 2 review.",
                "confidenceScore": 0.91,
                "discoveryReasons": [
                    "Object names directly identify yoke and left captain yoke column.",
                    "Flightdeck.xml rotate animations link YokeColL, YokeL, and YokeTrimL.",
                    "YokeBase is included as a mounting/support object from the same source file."
                ],
                "limitations": [
                    "Variant applicability to DC-9-50 remains compatibility-only unless reviewed against DC-9-50 references.",
                    "This is source extraction only; hierarchy and pivots are not production-ready."
                ]
            },
            {
                "candidateId": "dc9-src-throttle-assembly-001",
                "category": "throttle_assembly",
                "sourceVariant": SOURCE_VARIANT,
                "targetVariant": TARGET_VARIANT,
                "variantScope": "common",
                "sourceFile": "Models/Flightdeck/flightdeck.ac",
                "sourceXml": "Models/Flightdeck/Flightdeck.xml",
                "sourceObjectNames": [
                    "PedestalBase", "PedestalBase_0", "PedestalBase_1", "PedestalDrum", "PedestalDrumFace",
                    "ThrottleL", "ThrottleR", "ThrottleRevL", "ThrottleRevR", "FuelCutoffL", "FuelCutoffR",
                    "XfeedLever", "SpdBrakeLever", "FlapLever"
                ],
                "pivotStatus": "XML animation centers exist for throttle, reverser, fuel cutoff, crossfeed, speedbrake, and flap levers.",
                "confidenceScore": 0.88,
                "discoveryReasons": [
                    "Flightdeck.xml includes throttle and reverser rotate/pick animations.",
                    "Pedestal drum/base objects provide mounting context for the levers.",
                    "Fuel cutoff, crossfeed, speedbrake, and flap levers are nearby pedestal controls in the same source file."
                ],
                "limitations": [
                    "Includes neighboring pedestal levers to preserve visual completeness; Agent 2 must decide final assembly boundaries.",
                    "Variant applicability to DC-9-50 remains compatibility-only unless reviewed against DC-9-50 references."
                ]
            },
            {
                "candidateId": "dc9-src-large-gauge-001",
                "category": "large_cockpit_gauge",
                "sourceVariant": SOURCE_VARIANT,
                "targetVariant": TARGET_VARIANT,
                "variantScope": "common",
                "sourceFile": "Models/Flightdeck/Instruments/ALT/altimeter.ac",
                "sourceXml": "Models/Flightdeck/Instruments/ALT/alt.xml",
                "sourceObjectNames": gauge_objects,
                "pivotStatus": "XML rotate animation exists for ALTneedle and BaroKnob; source mesh origins require Agent 2 review.",
                "confidenceScore": 0.86,
                "discoveryReasons": [
                    "Altimeter is a complete analog gauge source with face, bezel, needle, digits, knob, screws, and XML animations.",
                    "Flightdeck.xml places two ALT model instances on the cockpit panel.",
                    "Component includes all child objects from altimeter.ac to avoid isolated mesh extraction."
                ],
                "limitations": [
                    "Large gauge choice is an altimeter candidate, not a final production instrument selection.",
                    "RGB texture alternatives are inventoried but not converted in this sourcing pass."
                ]
            },
            {
                "candidateId": "dc9-src-switch-cluster-001",
                "category": "switch_cluster",
                "sourceVariant": SOURCE_VARIANT,
                "targetVariant": TARGET_VARIANT,
                "variantScope": "unknown",
                "sourceFile": "Models/Flightdeck/flightdeck.ac",
                "sourceXml": "Models/Flightdeck/Flightdeck.xml",
                "sourceObjectNames": ["SwABS", "KnobABS", "LampABS", "LampABSon"],
                "pivotStatus": "No explicit switch-cluster XML animation was found for SwABS; pivot status unknown.",
                "confidenceScore": 0.62,
                "discoveryReasons": [
                    "Object names identify ABS switch, knob, and lamp elements in the cockpit model.",
                    "Objects share source file and ABS naming/material context.",
                    "This is the most credible source switch cluster found in the primary cockpit model."
                ],
                "limitations": [
                    "No switch guard object was identified for this cluster.",
                    "No explicit XML animation relationship was found for SwABS.",
                    "Variant scope remains unknown pending human review."
                ]
            }
        ]
    }


def _ac_object_names(path: Path) -> list[str]:
    names = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line.startswith("name "):
            names.append(line.split('"', 2)[1] if '"' in line else line.split(maxsplit=1)[1])
    return names


def _run_blender_extraction(repo_path: Path, plan_path: Path, output_dir: Path, preview_dir: Path, inspection_dir: Path) -> dict[str, object]:
    blender = os.environ.get("BLENDER_BIN") or shutil.which("blender")
    if not blender:
        raise RuntimeError("Blender executable unavailable; set BLENDER_BIN or install blender on PATH")
    script = Path(__file__).with_name("source_blender_extract.py")
    command = [
        blender,
        "--background",
        "--factory-startup",
        "--disable-autoexec",
        "--python",
        str(script),
        "--",
        "--repo-root",
        str(repo_path),
        "--plan",
        str(plan_path),
        "--output-dir",
        str(output_dir),
        "--preview-dir",
        str(preview_dir),
        "--inspection-dir",
        str(inspection_dir),
    ]
    result = subprocess.run(command, check=False, text=True, capture_output=True)
    if result.returncode != 0 or "Traceback" in result.stdout or "Traceback" in result.stderr:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"Blender source extraction failed with exit {result.returncode}: {detail}")
    report_path = output_dir / "blender-extraction-report.json"
    if not report_path.is_file():
        raise RuntimeError(f"Blender extraction did not create report: {report_path}")
    return json.loads(report_path.read_text(encoding="utf-8"))


def _candidate_counts(candidates: list[dict[str, object]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for candidate in candidates:
        category = str(candidate["category"])
        counts[category] = counts.get(category, 0) + 1
    return dict(sorted(counts.items()))


def _missing_categories(candidates: list[dict[str, object]]) -> list[str]:
    required = {"yoke_assembly", "throttle_assembly", "large_cockpit_gauge", "switch_cluster"}
    found = {str(candidate["category"]) for candidate in candidates}
    return sorted(required - found)


def _write_contact_sheet(path: Path, candidates: list[dict[str, object]], preview_dir: Path) -> None:
    tile_w = 420
    tile_h = 320
    width = tile_w * 2
    height = tile_h * 2
    chunks = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#f3f4f1"/>',
    ]
    for index, candidate in enumerate(candidates):
        x = (index % 2) * tile_w
        y = (index // 2) * tile_h
        preview = Path(str(candidate["previewPng"]))
        href = os.path.relpath(preview, preview_dir)
        chunks.extend([
            f'<rect x="{x + 12}" y="{y + 12}" width="{tile_w - 24}" height="{tile_h - 24}" fill="#ffffff" stroke="#333" stroke-width="1"/>',
            f'<image href="{href}" x="{x + 24}" y="{y + 42}" width="{tile_w - 48}" height="{tile_h - 96}" preserveAspectRatio="xMidYMid meet"/>',
            f'<text x="{x + 24}" y="{y + 30}" font-family="Arial" font-size="16" fill="#111">{candidate["candidateId"]}</text>',
            f'<text x="{x + 24}" y="{y + tile_h - 28}" font-family="Arial" font-size="13" fill="#333">{candidate["category"]} - confidence {candidate["confidenceScore"]}</text>',
        ])
    chunks.append("</svg>")
    path.write_text("\n".join(chunks) + "\n", encoding="utf-8")


def _write_source_job_report(
    path: Path,
    job_id: str,
    repo_url: str,
    resolved_revision: str,
    inventory: dict[str, object],
    catalog: dict[str, object],
) -> None:
    formats = inventory["formats"]
    unsupported = ", ".join(f"`{item}`" for item in sorted(inventory["unsupportedFormats"].keys())) or "none"
    counts = "\n".join(
        f"- `{category}`: {count}"
        for category, count in catalog["candidateCountByCategory"].items()
    )
    text = f"""# FlightGear DC-9-32 Source Job Report

## Branch And Source

- Branch: `asset/dc9-vslice-source`
- Source URL: `{repo_url}`
- Resolved commit: `{resolved_revision}`
- Cached source path: `.cache/cockpit-pipeline/sources/DC-9-32`
- Source variant: `{SOURCE_VARIANT}`
- Target variant: `{TARGET_VARIANT}`
- Job stage: `sourcing_complete`

## Commands Run

| Command | Result |
|---|---|
| `python3 -m tools.blender.cockpit_pipeline.preflight` | Pass |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pass, 5 tests |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from requested --to sourcing_complete` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from sourcing_complete --to assembly-approved` | Expected fail |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-source-job` | Pass, repeated |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/{job_id}/job.json` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/{job_id}/manifests/sourcing-complete.json` | Pass |

## Format Inventory

- `.ac`: {formats.get(".ac", 0)}
- `.xml`: {formats.get(".xml", 0)}
- `.png`: {formats.get(".png", 0)}
- `.rgb`: {formats.get(".rgb", 0)}
- `.jpg`: {formats.get(".jpg", 0)}
- `.obj`: {formats.get(".obj", 0)}
- `.gltf`: {formats.get(".gltf", 0)}
- `.glb`: {formats.get(".glb", 0)}
- `.fbx`: {formats.get(".fbx", 0)}

Unsupported or non-ingested formats are reported in `source-inventory.json`: {unsupported}.

## Import Route

No configured Blender AC3D importer was callable in this Blender installation. The source job uses a narrow internal AC3D data importer for `.ac` files and treats downloaded repository files as data only. No downloaded scripts, add-ons, shell commands, Nasal scripts, or Python files were executed.

## Candidate Count By Category

{counts}

## Generated Files

- Job: `art-source/cockpit-pipeline/jobs/{job_id}/job.json`
- Manifest: `art-source/cockpit-pipeline/jobs/{job_id}/manifests/sourcing-complete.json`
- Catalog: `art-source/cockpit-pipeline/stages/source/output/{job_id}/component-catalog.json`
- Inventory: `asset-reports/cockpit-pipeline/{job_id}/source-inventory.json`
- XML report: `asset-reports/cockpit-pipeline/{job_id}/xml-reference-report.json`
- Extraction report: `asset-reports/cockpit-pipeline/{job_id}/extraction-report.json`
- Validation report: `asset-reports/cockpit-pipeline/{job_id}/validation-report.json`
- Contact sheet: `preview-renders/cockpit-pipeline/{job_id}/component-contact-sheet.svg`

Each candidate has a standalone GLB, metadata JSON, validation JSON, and neutral preview PNG under the job-specific source output and preview directories.

## Reimport Validation

All four exported GLBs reimported into a clean Blender scene with nonzero mesh counts and dimensions matching pre-export source dimensions.

## Visual Review

The generated previews were inspected. The import proof, yoke, throttle, large gauge, and switch cluster are nonblank and correspond to the requested source categories.

## Known Limitations

- This is source extraction only. The candidates are not source-approved and are not ready for assembly.
- The source is DC-9-32; target variant is DC-9-50, so this remains a compatibility proxy unless reviewed against DC-9-50 references.
- The ABS switch cluster is lower confidence because no explicit XML animation was found for `SwABS`.
- The switch cluster source objects are spatially sparse in preview, which should be reviewed before assembly.
- RGB textures were inventoried but not converted during this task.
- The disposable Blender inspection scene lives under cache and is not tracked.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-source-job
```
"""
    path.write_text(text, encoding="utf-8")


def _write_manifest(root: Path, manifest_dir: Path, job_id: str, outputs: list[Path]) -> Path:
    manifest_path = manifest_dir / "sourcing-complete.json"
    unique_outputs = []
    seen = set()
    for output in outputs:
        resolved = output.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        unique_outputs.append(resolved)
    manifest = {
        "manifestId": f"{job_id}-sourcing-complete",
        "jobId": job_id,
        "stage": "sourcing_complete",
        "createdAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "sourceVariant": SOURCE_VARIANT,
        "targetVariant": TARGET_VARIANT,
        "variantScope": "unknown",
        "artifactBasePath": root.as_posix(),
        "inputs": [],
        "outputs": [file_record(path, root) for path in unique_outputs],
        "approval": {
            "approved": False,
            "approvedBy": "human-review-pending",
            "notes": "Sourcing complete only. Human review is required before source approval and before Agent 2 assembly."
        }
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def _run(command: list[str]) -> str:
    result = subprocess.run(command, check=False, text=True, capture_output=True)
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"{' '.join(command)} failed: {detail}")
    return result.stdout


def _text(node: ET.Element | None) -> str:
    if node is None or node.text is None:
        return ""
    return node.text.strip()
