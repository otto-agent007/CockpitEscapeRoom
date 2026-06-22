from __future__ import annotations

import hashlib
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_record(path: Path, base_path: Path) -> dict[str, object]:
    resolved = path.resolve()
    return {
        "path": str(resolved.relative_to(base_path.resolve())),
        "sha256": sha256_file(resolved),
        "bytes": resolved.stat().st_size,
    }


def verify_file_record(record: dict[str, object], base_path: Path) -> None:
    path = (base_path / str(record["path"])).resolve()
    if not path.is_file():
        raise FileNotFoundError(f"declared manifest file does not exist: {path}")
    actual_size = path.stat().st_size
    actual_hash = sha256_file(path)
    if actual_size != record["bytes"]:
        raise ValueError(f"{path}: expected {record['bytes']} bytes, got {actual_size}")
    if actual_hash != record["sha256"]:
        raise ValueError(f"{path}: expected sha256 {record['sha256']}, got {actual_hash}")


def verify_manifest_hashes(manifest: dict[str, object], manifest_path: Path) -> None:
    artifact_base = Path(str(manifest["artifactBasePath"]))
    if not artifact_base.is_absolute():
        artifact_base = (manifest_path.parent / artifact_base).resolve()
    for section in ("inputs", "outputs"):
        for record in manifest[section]:
            verify_file_record(record, artifact_base)
