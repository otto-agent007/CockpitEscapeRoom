from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


DEFAULT_EXPECTED_BLENDER = "5.1"
DEFAULT_CACHE = ".cache/cockpit-pipeline"


class PreflightError(RuntimeError):
    pass


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check Ubuntu cockpit pipeline prerequisites.")
    parser.add_argument("--allow-dirty", action="store_true", help="Report dirty status without failing.")
    args = parser.parse_args(argv)

    try:
        report = collect_report()
        print_report(report)
        dirty = report["gitDirty"] != "clean"
        if dirty and not args.allow_dirty:
            print("Preflight note: working tree is dirty; continuing because dirty status is report-only.")
        return 0
    except PreflightError as exc:
        print(f"Preflight failed: {exc}", file=sys.stderr)
        return 2


def collect_report() -> dict[str, str]:
    root = run_text(["git", "rev-parse", "--show-toplevel"])
    branch = run_text(["git", "branch", "--show-current"])
    dirty = "dirty" if run_text(["git", "status", "--porcelain"]) else "clean"
    git_version = run_text(["git", "--version"])
    node_version = run_text(["node", "--version"], required=False) or "unavailable"
    git_lfs = run_text(["git", "lfs", "version"], required=False) or "unavailable"

    blender_executable = os.environ.get("BLENDER_BIN") or shutil.which("blender")
    if not blender_executable:
        raise PreflightError("Blender executable unavailable; set BLENDER_BIN or install blender on PATH")

    blender_version_text = run_text([blender_executable, "--version"], required=False)
    if not blender_version_text:
        raise PreflightError(f"Blender executable did not run: {blender_executable}")
    blender_version = blender_version_text.splitlines()[0].strip()
    expected = os.environ.get("BLENDER_EXPECTED_VERSION", DEFAULT_EXPECTED_BLENDER)
    if f"Blender {expected}" not in blender_version:
        raise PreflightError(
            f"Blender version mismatch: expected {expected}, got {blender_version!r}; "
            "set BLENDER_EXPECTED_VERSION only when the project expectation changes"
        )

    cache_path = Path(os.environ.get("COCKPIT_PIPELINE_CACHE", Path(root) / DEFAULT_CACHE)).expanduser()

    return {
        "repositoryRoot": root,
        "activeBranch": branch,
        "gitDirty": dirty,
        "blenderExecutable": blender_executable,
        "blenderVersion": blender_version,
        "nodeVersion": node_version,
        "gitVersion": git_version,
        "gitLfsAvailability": git_lfs,
        "pipelineCachePath": str(cache_path),
    }


def print_report(report: dict[str, str]) -> None:
    labels = {
        "repositoryRoot": "Repository root",
        "activeBranch": "Active branch",
        "gitDirty": "Clean or dirty status",
        "blenderExecutable": "Blender executable",
        "blenderVersion": "Blender version",
        "nodeVersion": "Node version",
        "gitVersion": "Git version",
        "gitLfsAvailability": "Git LFS availability",
        "pipelineCachePath": "Pipeline cache path",
    }
    for key, label in labels.items():
        print(f"{label}: {report[key]}")


def run_text(command: list[str], required: bool = True) -> str:
    try:
        result = subprocess.run(command, check=False, text=True, capture_output=True)
    except FileNotFoundError:
        if required:
            raise PreflightError(f"command unavailable: {command[0]}") from None
        return ""
    if result.returncode != 0:
        if required:
            detail = result.stderr.strip() or result.stdout.strip()
            raise PreflightError(f"{' '.join(command)} failed: {detail}")
        return ""
    return result.stdout.strip()


if __name__ == "__main__":
    raise SystemExit(main())
