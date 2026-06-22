from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any

from reference_utils import (
    CLASSIFICATION_FOLDERS,
    IMAGE_SUFFIXES,
    REFERENCE_ROOT,
    REQUIRED_FIELDS,
    VALID_CLASSIFICATIONS,
    exit_with_errors,
    get_nested,
    load_manifest,
    local_path,
    repo_relative,
    write_json_report,
)


def _is_nonempty(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return bool(value)
    return True


def validate_manifest() -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    manifest = load_manifest()

    local_files: list[str] = []
    basenames: list[str] = []
    manifest_image_paths: set[Path] = set()

    for reference_id, entry in manifest.items():
        if not isinstance(entry, dict):
            errors.append(f"{reference_id}: entry must be a mapping")
            continue

        for field in REQUIRED_FIELDS:
            if not _is_nonempty(get_nested(entry, field)):
                errors.append(f"{reference_id}: missing required field {field}")

        source_page = str(entry.get("source_page", ""))
        if source_page and not source_page.startswith(("http://", "https://")):
            errors.append(f"{reference_id}: source_page must be an HTTP(S) URL")

        classification = entry.get("classification")
        if classification not in VALID_CLASSIFICATIONS:
            errors.append(
                f"{reference_id}: invalid classification {classification!r}; "
                f"expected one of {sorted(VALID_CLASSIFICATIONS)}"
            )

        confidence = str(entry.get("confidence", "")).strip().lower()
        if confidence not in {"low", "medium", "high"}:
            errors.append(f"{reference_id}: confidence must be low, medium, or high")

        intended_uses = entry.get("intended_uses")
        if not isinstance(intended_uses, list) or not all(str(item).strip() for item in intended_uses):
            errors.append(f"{reference_id}: intended_uses must be a non-empty list of strings")

        aircraft = entry.get("aircraft")
        if not isinstance(aircraft, dict):
            errors.append(f"{reference_id}: aircraft must be a mapping")
        else:
            variant = str(aircraft.get("variant", "")).strip()
            if aircraft.get("model") in {"DC-9", "MD-80"} and not variant:
                errors.append(f"{reference_id}: cockpit-capable aircraft entry must include aircraft.variant")

        local_file = str(entry.get("local_file", "")).strip()
        if local_file:
            if local_file.startswith("/") or ".." in Path(local_file).parts:
                errors.append(f"{reference_id}: local_file must stay under art-source/references")
            else:
                path = local_path(entry)
                try:
                    path.relative_to(REFERENCE_ROOT)
                except ValueError:
                    errors.append(f"{reference_id}: local_file escapes reference root")
                local_files.append(local_file)
                basenames.append(path.name)
                if path.suffix.lower() in IMAGE_SUFFIXES:
                    manifest_image_paths.add(path.resolve())
                if classification in CLASSIFICATION_FOLDERS:
                    expected = f"dc9-51/{CLASSIFICATION_FOLDERS[classification]}/"
                    if not local_file.startswith(expected):
                        errors.append(
                            f"{reference_id}: {classification} reference must live under {expected}"
                        )
                if not entry.get("direct_image_url") and not path.exists():
                    errors.append(f"{reference_id}: non-downloadable local_file is missing: {repo_relative(path)}")

        if entry.get("sha256") and not local_path(entry).exists():
            errors.append(f"{reference_id}: sha256 is recorded but local file is missing")

        if entry.get("download_status") == "downloaded":
            path = local_path(entry)
            if not path.exists():
                errors.append(f"{reference_id}: download_status is downloaded but file is missing")
            if not entry.get("sha256"):
                errors.append(f"{reference_id}: downloaded entry is missing sha256")
            if not entry.get("downloaded_at"):
                errors.append(f"{reference_id}: downloaded entry is missing downloaded_at")

    duplicate_local_files = [name for name, count in Counter(local_files).items() if count > 1]
    for name in duplicate_local_files:
        errors.append(f"Duplicate local_file path in manifest: {name}")

    duplicate_basenames = [name for name, count in Counter(basenames).items() if count > 1]
    for name in duplicate_basenames:
        errors.append(f"Duplicate local filename in manifest: {name}")

    for folder in ("primary", "secondary", "presentation"):
        for path in (REFERENCE_ROOT / "dc9-51" / folder).glob("*"):
            if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES and path.resolve() not in manifest_image_paths:
                errors.append(f"Unmanifested downloaded image: {repo_relative(path)}")

    report_path = write_json_report(
        "manifest-validation.json",
        {
            "referenceCount": len(manifest),
            "errors": errors,
            "warnings": warnings,
            "passed": not errors,
        },
    )
    if not errors:
        print(f"Manifest validation passed for {len(manifest)} references.")
    print(f"Wrote {repo_relative(report_path)}")
    return errors, warnings


if __name__ == "__main__":
    found_errors, found_warnings = validate_manifest()
    exit_with_errors(found_errors, found_warnings)
