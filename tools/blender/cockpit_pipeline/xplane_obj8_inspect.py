from __future__ import annotations

import argparse
import json
import re
import struct
from pathlib import Path


ACF_OBJECT_RE = re.compile(r"^P _obja/(\d+)/_v10_att_file_stl (.+)$")


def read_png_dimensions(path: Path) -> dict[str, int] | None:
    if not path.exists():
        return None
    with path.open("rb") as handle:
        signature = handle.read(8)
        if signature != b"\x89PNG\r\n\x1a\n":
            return None
        length = handle.read(4)
        chunk_type = handle.read(4)
        if len(length) != 4 or chunk_type != b"IHDR":
            return None
        width, height = struct.unpack(">II", handle.read(8))
        return {"width": width, "height": height}


def inspect_obj8(path: Path) -> dict:
    textures: list[str] = []
    texture_lit: list[str] = []
    point_counts = None
    vt_count = 0
    idx_count = 0
    min_xyz = [float("inf"), float("inf"), float("inf")]
    max_xyz = [float("-inf"), float("-inf"), float("-inf")]

    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if line.startswith("TEXTURE_LIT "):
                texture_lit.append(line.split(" ", 1)[1])
            elif line.startswith("TEXTURE "):
                textures.append(line.split(" ", 1)[1])
            elif line.startswith("POINT_COUNTS "):
                parts = line.split()
                if len(parts) >= 5:
                    point_counts = {
                        "vt": int(parts[1]),
                        "lights": int(parts[2]),
                        "lines": int(parts[3]),
                        "indices": int(parts[4]),
                    }
            elif line.startswith("VT "):
                parts = line.split()
                if len(parts) >= 4:
                    x = float(parts[1])
                    y = float(parts[2])
                    z = float(parts[3])
                    vt_count += 1
                    min_xyz[0] = min(min_xyz[0], x)
                    min_xyz[1] = min(min_xyz[1], y)
                    min_xyz[2] = min(min_xyz[2], z)
                    max_xyz[0] = max(max_xyz[0], x)
                    max_xyz[1] = max(max_xyz[1], y)
                    max_xyz[2] = max(max_xyz[2], z)
            elif line.startswith("IDX"):
                parts = line.split()
                idx_count += max(0, len(parts) - 1)

    if vt_count == 0:
        bounds = None
        dimensions = None
        zero_size = True
    else:
        bounds = {
            "min": {"x": min_xyz[0], "y": min_xyz[1], "z": min_xyz[2]},
            "max": {"x": max_xyz[0], "y": max_xyz[1], "z": max_xyz[2]},
        }
        dimensions = {
            "x": max_xyz[0] - min_xyz[0],
            "y": max_xyz[1] - min_xyz[1],
            "z": max_xyz[2] - min_xyz[2],
        }
        zero_size = any(value == 0 for value in dimensions.values())

    texture_reports = []
    for texture_name in textures + texture_lit:
        texture_path = path.parent / texture_name
        texture_reports.append(
            {
                "name": texture_name,
                "path": str(texture_path),
                "dimensions": read_png_dimensions(texture_path),
                "exists": texture_path.exists(),
            }
        )

    return {
        "path": str(path),
        "fileSizeBytes": path.stat().st_size,
        "textures": texture_reports,
        "pointCounts": point_counts,
        "vtCountParsed": vt_count,
        "indexCountParsed": idx_count,
        "bounds": bounds,
        "dimensions": dimensions,
        "zeroSizeBounds": zero_size,
    }


def read_acf_objects(acf_path: Path) -> list[dict]:
    attached = []
    with acf_path.open("r", encoding="utf-8", errors="replace") as handle:
        for raw_line in handle:
            match = ACF_OBJECT_RE.match(raw_line.rstrip("\n"))
            if match:
                attached.append(
                    {
                        "slot": int(match.group(1)),
                        "file": match.group(2),
                    }
                )
    return attached


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect X-Plane OBJ8 cockpit sources.")
    parser.add_argument("--package-dir", required=True, type=Path)
    parser.add_argument("--acf", default="DC9-32.acf")
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    package_dir = args.package_dir.resolve()
    acf_path = package_dir / args.acf
    attached = read_acf_objects(acf_path)

    reports = []
    for entry in attached:
        candidate = package_dir / "objects" / entry["file"]
        if not candidate.exists():
            candidate = package_dir / entry["file"]
        report = {"slot": entry["slot"], "file": entry["file"], "exists": candidate.exists()}
        if candidate.exists():
            report["inspection"] = inspect_obj8(candidate)
        reports.append(report)

    top_level_cockpit = package_dir / "DC9-32_cockpit.obj"
    top_level_report = inspect_obj8(top_level_cockpit) if top_level_cockpit.exists() else None

    archive_report = None
    if args.archive and args.archive.exists():
        archive_report = {
            "path": str(args.archive.resolve()),
            "fileSizeBytes": args.archive.stat().st_size,
        }

    payload = {
        "packageDir": str(package_dir),
        "acfPath": str(acf_path),
        "archive": archive_report,
        "attachedObjects": reports,
        "topLevelCockpit": top_level_report,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(str(args.output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
