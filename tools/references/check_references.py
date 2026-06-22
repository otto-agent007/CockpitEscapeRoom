from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from build_contact_sheet import OUTPUT as CONTACT_SHEET
from generate_modeling_brief import OUTPUT as MODELING_BRIEF
from reference_utils import REPO_ROOT, REPORT_CACHE, exit_with_errors, repo_relative, write_json_report
from validate_manifest import validate_manifest


def _blender_bin() -> str | None:
    env_bin = os.environ.get("BLENDER_BIN")
    if env_bin:
        return env_bin
    local_bin = Path("/home/user1/.local/bin/blender")
    if local_bin.exists():
        return str(local_bin)
    return shutil.which("blender")


def check_references() -> int:
    errors, warnings = validate_manifest()

    for artifact in (CONTACT_SHEET, MODELING_BRIEF):
        if not artifact.exists():
            errors.append(f"Generated artifact is missing: {repo_relative(artifact)}")

    blender = _blender_bin()
    blender_report: dict[str, object] = {"available": bool(blender)}
    if not blender:
        errors.append("Blender executable not found; set BLENDER_BIN for reference scene validation.")
    else:
        preview = REPORT_CACHE / "dc9_reference_overview.png"
        command = [
            blender,
            "--background",
            "--python",
            str(REPO_ROOT / "tools" / "blender" / "setup_dc9_reference_scene.py"),
            "--",
            "--check",
            "--render-preview",
            "--preview-output",
            str(preview),
        ]
        result = subprocess.run(command, cwd=REPO_ROOT, text=True, capture_output=True)
        blender_report = {
            "available": True,
            "command": " ".join(command),
            "returncode": result.returncode,
            "stdout": result.stdout[-4000:],
            "stderr": result.stderr[-4000:],
            "preview": repo_relative(preview),
        }
        print(result.stdout)
        if result.returncode != 0 or "Traceback (most recent call last)" in result.stderr:
            errors.append("Blender reference scene validation failed; see .cache/references/reference-check.json")
        if not preview.exists():
            errors.append(f"Reference preview render is missing: {repo_relative(preview)}")

    report = {
        "offline": True,
        "downloadsInvoked": False,
        "errors": errors,
        "warnings": warnings,
        "blender": blender_report,
        "passed": not errors,
    }
    report_path = write_json_report("reference-check.json", report)
    print(f"Wrote {repo_relative(report_path)}")
    exit_with_errors(errors, warnings)
    return 0


if __name__ == "__main__":
    raise SystemExit(check_references())
