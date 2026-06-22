from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

from .hashing import verify_manifest_hashes
from .assembly_job import run_assembly_job
from .schema_validation import SchemaError, validate_json_file
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

    transition_parser = subparsers.add_parser("can-transition", help="Validate a stage transition.")
    transition_parser.add_argument("--from", dest="from_stage", required=True)
    transition_parser.add_argument("--to", dest="to_stage", required=True)

    smoke_parser = subparsers.add_parser("blender-smoke", help="Run the Blender headless smoke test.")
    smoke_parser.add_argument("--cache", type=Path, default=None)

    source_parser = subparsers.add_parser("run-source-job", help="Run the DC-9 FlightGear source vertical slice job.")
    source_parser.add_argument("--repo-url", default="https://github.com/FGMEMBERS-NONGPL/DC-9-32.git")
    source_parser.add_argument("--job-id", default="dc9-32-flightgear-source-vslice")
    source_parser.add_argument("--cache", type=Path, default=None)

    assembly_parser = subparsers.add_parser("run-assembly-job", help="Run the DC-9 neutral assembly vertical slice job.")
    assembly_parser.add_argument("--source-job-id", default="dc9-32-flightgear-source-vslice")
    assembly_parser.add_argument("--assembly-job-id", default="dc9-vslice-assembly")

    args = parser.parse_args(argv)
    try:
        if args.command == "validate-job":
            validate_json_file(args.path, "job_request.schema.json")
            print(f"Job request valid: {args.path}")
        elif args.command == "validate-manifest":
            manifest = validate_json_file(args.path, "stage_manifest.schema.json")
            verify_manifest_hashes(manifest, args.path)
            print(f"Stage manifest valid with verified hashes: {args.path}")
        elif args.command == "can-transition":
            transition = require_transition(args.from_stage, args.to_stage)
            print(f"Transition valid: {transition.from_stage} -> {transition.to_stage}")
        elif args.command == "blender-smoke":
            run_blender_smoke(args.cache)
        elif args.command == "run-source-job":
            run_source_job(repo_url=args.repo_url, job_id=args.job_id, cache_override=args.cache)
        elif args.command == "run-assembly-job":
            run_assembly_job(source_job_id=args.source_job_id, assembly_job_id=args.assembly_job_id)
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


if __name__ == "__main__":
    raise SystemExit(main())
