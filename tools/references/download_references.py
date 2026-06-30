from __future__ import annotations

import argparse
import tempfile
import urllib.request
from pathlib import Path
from typing import Any

from reference_utils import (
    load_manifest,
    local_path,
    now_utc_iso,
    repo_relative,
    sha256_file,
    write_json_report,
    write_manifest,
)


def download_references(force: bool = False) -> int:
    manifest = load_manifest()
    results: list[dict[str, Any]] = []
    failures = 0

    for reference_id, entry in manifest.items():
        url = entry.get("direct_image_url")
        if not url:
            results.append({"reference_id": reference_id, "status": "skipped", "reason": "no direct_image_url"})
            continue

        destination = local_path(entry)
        destination.parent.mkdir(parents=True, exist_ok=True)

        if destination.exists() and not force:
            current_hash = sha256_file(destination)
            expected_hash = entry.get("sha256")
            if expected_hash and current_hash != expected_hash:
                failures += 1
                results.append(
                    {
                        "reference_id": reference_id,
                        "status": "error",
                        "reason": "existing file hash differs from manifest; use --force after review",
                        "local_file": repo_relative(destination),
                    }
                )
                continue
            entry["sha256"] = current_hash
            entry["download_status"] = "downloaded"
            entry.setdefault("downloaded_at", now_utc_iso())
            results.append(
                {
                    "reference_id": reference_id,
                    "status": "kept",
                    "local_file": repo_relative(destination),
                    "sha256": current_hash,
                }
            )
            continue

        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": (
                        "CockpitEscapeRoomReferenceTool/0.1 "
                        "(art reference downloader; local development)"
                    )
                },
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = response.read()
            with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as tmp:
                tmp.write(payload)
                tmp_path = Path(tmp.name)
            digest = sha256_file(tmp_path)
            tmp_path.replace(destination)
            entry["sha256"] = digest
            entry["download_status"] = "downloaded"
            entry["downloaded_at"] = now_utc_iso()
            results.append(
                {
                    "reference_id": reference_id,
                    "status": "downloaded",
                    "local_file": repo_relative(destination),
                    "sha256": digest,
                }
            )
        except Exception as exc:  # pragma: no cover - network dependent
            failures += 1
            results.append({"reference_id": reference_id, "status": "error", "reason": str(exc)})

    write_manifest(manifest)
    report_path = write_json_report(
        "download-report.json",
        {"results": results, "failures": failures, "passed": failures == 0},
    )
    for result in results:
        print(f"{result['reference_id']}: {result['status']}")
    print(f"Wrote {repo_relative(report_path)}")
    return 1 if failures else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download manifest references with direct_image_url.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files after deliberate review.")
    args = parser.parse_args()
    raise SystemExit(download_references(force=args.force))
