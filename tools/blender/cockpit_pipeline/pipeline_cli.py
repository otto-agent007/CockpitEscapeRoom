from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

from .hashing import sha256_file, verify_manifest_hashes
from .assembly_job import run_assembly_job
from .eval_runner import run_evals
from .schema_validation import SchemaError, validate_json_file
from .shading_job import run_shading_job
from .source_job import run_source_job
from .state_machine import StateTransitionError, require_transition


DEFAULT_CACHE = ".cache/cockpit-pipeline"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Cockpit pipeline utility commands.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    job_parser = subparsers.add_parser("validate-job", help="Validate a job request JSON file.")
    job_parser.add_argument("path", type=Path)

    manifest_parser = subparsers.add_parser("validate-manifest", help="Validate a stage manifest and declared hashes.")
    manifest_parser.add_argument("path", type=Path)

    gate_parser = subparsers.add_parser("validate-gate", help="Validate a structured gate artifact JSON file.")
    gate_parser.add_argument(
        "gate",
        choices=["reference-authority", "runtime-contract", "material-optimization", "browser-integration"],
    )
    gate_parser.add_argument("path", type=Path)

    eval_parser = subparsers.add_parser("run-evals", help="Run deterministic agent workflow guardrail eval fixtures.")
    eval_parser.add_argument("--fixtures-dir", type=Path, default=None)

    transition_parser = subparsers.add_parser("can-transition", help="Validate a stage transition.")
    transition_parser.add_argument("--from", dest="from_stage", required=True)
    transition_parser.add_argument("--to", dest="to_stage", required=True)

    smoke_parser = subparsers.add_parser("blender-smoke", help="Run the Blender headless smoke test.")
    smoke_parser.add_argument("--cache", type=Path, default=None)

    a320_import_parser = subparsers.add_parser(
        "import-a320-source-candidate",
        help="Extract and import the approved Airbus A320 glTF source candidate for Blender inspection.",
    )
    a320_import_parser.add_argument(
        "--archive",
        type=Path,
        default=Path(
            ".cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip"
        ),
    )
    a320_import_parser.add_argument("--candidate-id", default="a320-prebuilt-sketchfab-a320-cockpit-2")
    a320_import_parser.add_argument("--cache", type=Path, default=None)

    source_parser = subparsers.add_parser(
        "run-source-job",
        help="Run the legacy DC-9-32 FlightGear source vertical slice proxy job.",
    )
    source_parser.add_argument("--repo-url", default="https://github.com/FGMEMBERS-NONGPL/DC-9-32.git")
    source_parser.add_argument("--job-id", default="dc9-32-flightgear-source-vslice")
    source_parser.add_argument("--cache", type=Path, default=None)

    assembly_parser = subparsers.add_parser("run-assembly-job", help="Run the DC-9 neutral assembly vertical slice job.")
    assembly_parser.add_argument("--source-job-id", default="dc9-32-flightgear-source-vslice")
    assembly_parser.add_argument("--assembly-job-id", default="dc9-vslice-assembly")

    shading_parser = subparsers.add_parser("run-shading-job", help="Run the DC-9 shaded vertical slice job.")
    shading_parser.add_argument("--assembly-job-id", default="dc9-vslice-assembly")
    shading_parser.add_argument("--shading-job-id", default="dc9-vslice-shading")

    args = parser.parse_args(argv)
    try:
        if args.command == "validate-job":
            validate_json_file(args.path, "job_request.schema.json")
            print(f"Job request valid: {args.path}")
        elif args.command == "validate-manifest":
            manifest = validate_json_file(args.path, "stage_manifest.schema.json")
            verify_manifest_hashes(manifest, args.path)
            print(f"Stage manifest valid with verified hashes: {args.path}")
        elif args.command == "validate-gate":
            schema_name = {
                "reference-authority": "reference_authority.schema.json",
                "runtime-contract": "runtime_contract.schema.json",
                "material-optimization": "material_optimization.schema.json",
                "browser-integration": "browser_integration.schema.json",
            }[args.gate]
            validate_json_file(args.path, schema_name)
            print(f"Gate artifact valid: {args.gate} {args.path}")
        elif args.command == "run-evals":
            summary = run_evals(args.fixtures_dir)
            print(f"Agent workflow evals passed: {summary['passed']}/{summary['total']}")
        elif args.command == "can-transition":
            transition = require_transition(args.from_stage, args.to_stage)
            print(f"Transition valid: {transition.from_stage} -> {transition.to_stage}")
        elif args.command == "blender-smoke":
            run_blender_smoke(args.cache)
        elif args.command == "import-a320-source-candidate":
            run_a320_source_candidate_import(args.archive, args.candidate_id, args.cache)
        elif args.command == "run-source-job":
            run_source_job(repo_url=args.repo_url, job_id=args.job_id, cache_override=args.cache)
        elif args.command == "run-assembly-job":
            run_assembly_job(source_job_id=args.source_job_id, assembly_job_id=args.assembly_job_id)
        elif args.command == "run-shading-job":
            run_shading_job(assembly_job_id=args.assembly_job_id, shading_job_id=args.shading_job_id)
        return 0
    except (SchemaError, StateTransitionError, FileNotFoundError, ValueError, RuntimeError) as exc:
        print(f"{args.command} failed: {exc}", file=sys.stderr)
        return 2


def run_blender_smoke(cache: Path | None) -> None:
    root = Path(__file__).resolve().parents[3]
    cache_path = cache or Path(os.environ.get("COCKPIT_PIPELINE_CACHE", root / DEFAULT_CACHE))
    cache_path = cache_path.expanduser().resolve()
    smoke_dir = cache_path / "blender-smoke"
    smoke_dir.mkdir(parents=True, exist_ok=True)

    blender = os.environ.get("BLENDER_BIN") or shutil.which("blender")
    if not blender:
        raise RuntimeError("Blender executable unavailable; set BLENDER_BIN or install blender on PATH")

    script = Path(__file__).with_name("blender_smoke_scene.py")
    command = [
        blender,
        "--background",
        "--factory-startup",
        "--disable-autoexec",
        "--python",
        str(script),
        "--",
        "--output-dir",
        str(smoke_dir),
    ]
    result = subprocess.run(command, check=False, text=True, capture_output=True)
    report_path = smoke_dir / "smoke-report.json"
    preview_path = smoke_dir / "neutral-preview.png"
    glb_path = smoke_dir / "cockpit-pipeline-smoke.glb"
    if result.returncode != 0 or "Traceback" in result.stdout or "Traceback" in result.stderr:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"Blender smoke failed with exit {result.returncode}: {detail}")
    missing = [str(path) for path in (report_path, preview_path, glb_path) if not path.is_file()]
    if missing:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"Blender smoke did not produce expected evidence {missing}: {detail}")
    print(result.stdout.strip())
    print(f"Blender smoke evidence: {smoke_dir}")


def run_a320_source_candidate_import(archive: Path, candidate_id: str, cache: Path | None) -> None:
    root = Path(__file__).resolve().parents[3]
    archive_path = archive.expanduser()
    if not archive_path.is_absolute():
        archive_path = root / archive_path
    archive_path = archive_path.resolve()
    if not archive_path.is_file():
        raise FileNotFoundError(f"A320 source archive not found: {archive_path}")

    cache_path = cache or Path(os.environ.get("COCKPIT_PIPELINE_CACHE", root / DEFAULT_CACHE))
    cache_path = cache_path.expanduser().resolve()
    work_dir = cache_path / "sources" / "a320-prebuilt-parts-source-discovery" / "a320-cockpit-2"
    extract_dir = work_dir / "extracted" / archive_path.stem
    inspection_dir = cache_path / "inspection" / "a320-prebuilt-parts-source-discovery" / "a320-cockpit-2"
    preview_dir = root / "preview-renders/cockpit-pipeline/a320-prebuilt-parts-source-discovery"
    report_dir = root / "asset-reports/cockpit-pipeline/a320-prebuilt-parts-source-discovery"
    for path in (extract_dir, inspection_dir, preview_dir, report_dir):
        path.mkdir(parents=True, exist_ok=True)

    _extract_zip_safely(archive_path, extract_dir)
    gltf_path = extract_dir / "scene.gltf"
    if not gltf_path.is_file():
        matches = sorted(extract_dir.rglob("*.gltf"))
        if not matches:
            raise FileNotFoundError(f"no glTF file found after extracting {archive_path}")
        gltf_path = matches[0]

    blender = os.environ.get("BLENDER_BIN") or shutil.which("blender")
    if not blender:
        raise RuntimeError("Blender executable unavailable; set BLENDER_BIN or install blender on PATH")

    blend_path = inspection_dir / "a320-cockpit-2-import-inspection.blend"
    preview_path = preview_dir / "a320-cockpit-2-import-cockpit-view.png"
    json_report_path = report_dir / "a320-cockpit-2-blender-import-report.json"
    script = Path(__file__).with_name("a320_source_import_inspect.py")
    command = [
        blender,
        "--background",
        "--factory-startup",
        "--disable-autoexec",
        "--python",
        str(script),
        "--",
        "--gltf",
        str(gltf_path),
        "--candidate-id",
        candidate_id,
        "--blend-path",
        str(blend_path),
        "--preview-path",
        str(preview_path),
        "--report-path",
        str(json_report_path),
    ]
    result = subprocess.run(command, check=False, text=True, capture_output=True)
    if result.returncode != 0 or "Traceback" in result.stdout or "Traceback" in result.stderr:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"A320 Blender import failed with exit {result.returncode}: {detail}")
    for expected in (blend_path, preview_path, json_report_path):
        if not expected.is_file():
            raise RuntimeError(f"A320 Blender import did not produce expected evidence: {expected}")

    import_report = json.loads(json_report_path.read_text(encoding="utf-8"))
    import_report["sourceArchive"] = str(archive_path)
    import_report["sourceArchiveBytes"] = archive_path.stat().st_size
    import_report["sourceArchiveSha256"] = sha256_file(archive_path)
    import_report["extractedGltf"] = str(gltf_path)
    import_report["inspectionBlendBytes"] = blend_path.stat().st_size
    import_report["previewBytes"] = preview_path.stat().st_size
    json_report_path.write_text(json.dumps(import_report, indent=2) + "\n", encoding="utf-8")

    print(result.stdout.strip())
    print(f"A320 source candidate import evidence: {json_report_path}")


def _extract_zip_safely(archive_path: Path, output_dir: Path) -> None:
    with zipfile.ZipFile(archive_path) as archive:
        for info in archive.infolist():
            target = (output_dir / info.filename).resolve()
            if not str(target).startswith(str(output_dir.resolve()) + os.sep) and target != output_dir.resolve():
                raise RuntimeError(f"unsafe zip path rejected: {info.filename}")
            if info.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as source, target.open("wb") as destination:
                shutil.copyfileobj(source, destination)


if __name__ == "__main__":
    raise SystemExit(main())
