from __future__ import annotations

import datetime as _dt
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:  # pragma: no cover - environment guard
    raise SystemExit(
        "PyYAML is required for reference tooling. Install it in the workstation Python environment."
    ) from exc

REPO_ROOT = Path(__file__).resolve().parents[2]
REFERENCE_ROOT = REPO_ROOT / "art-source" / "references"
MANIFEST_PATH = REFERENCE_ROOT / "reference-manifest.yaml"
REPORT_CACHE = REPO_ROOT / ".cache" / "references"

VALID_CLASSIFICATIONS = {"primary", "secondary", "presentation", "mood", "rejected"}
CLASSIFICATION_FOLDERS = {
    "primary": "primary",
    "secondary": "secondary",
    "presentation": "presentation",
    "mood": "presentation",
    "rejected": "notes",
}
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}

REQUIRED_FIELDS = [
    "title",
    "source_page",
    "source_type",
    "creator",
    "aircraft.manufacturer",
    "aircraft.model",
    "aircraft.variant",
    "aircraft.operator",
    "aircraft.registration",
    "era",
    "viewpoint",
    "classification",
    "confidence",
    "target_compatibility",
    "intended_uses",
    "limitations",
    "local_file",
    "notes",
]


class UniqueKeyLoader(yaml.SafeLoader):
    pass


def _construct_mapping(loader: UniqueKeyLoader, node: yaml.nodes.MappingNode, deep: bool = False) -> dict[str, Any]:
    mapping: dict[str, Any] = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in mapping:
            raise ValueError(f"Duplicate manifest key: {key}")
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_mapping)


def load_manifest() -> dict[str, dict[str, Any]]:
    if not MANIFEST_PATH.exists():
        raise SystemExit(f"Manifest not found: {MANIFEST_PATH}")
    try:
        data = yaml.load(MANIFEST_PATH.read_text(encoding="utf-8"), Loader=UniqueKeyLoader)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc
    if not isinstance(data, dict):
        raise SystemExit("Manifest root must be a mapping of reference_id to entry.")
    return data


def write_manifest(manifest: dict[str, dict[str, Any]]) -> None:
    MANIFEST_PATH.write_text(yaml.safe_dump(manifest, sort_keys=False, allow_unicode=False), encoding="utf-8")


def get_nested(entry: dict[str, Any], dotted: str) -> Any:
    value: Any = entry
    for part in dotted.split("."):
        if not isinstance(value, dict) or part not in value:
            return None
        value = value[part]
    return value


def repo_relative(path: Path) -> str:
    return path.resolve().relative_to(REPO_ROOT).as_posix()


def local_path(entry: dict[str, Any]) -> Path:
    return REFERENCE_ROOT / str(entry["local_file"])


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def now_utc_iso() -> str:
    return _dt.datetime.now(tz=_dt.UTC).replace(microsecond=0).isoformat()


def write_json_report(name: str, payload: dict[str, Any]) -> Path:
    REPORT_CACHE.mkdir(parents=True, exist_ok=True)
    path = REPORT_CACHE / name
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return path


def exit_with_errors(errors: list[str], warnings: list[str] | None = None) -> None:
    warnings = warnings or []
    for warning in warnings:
        print(f"WARNING: {warning}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
