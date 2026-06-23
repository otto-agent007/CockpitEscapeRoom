from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy


def main() -> None:
    parser = argparse.ArgumentParser(description="Create and inspect a disposable Blender smoke scene.")
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args(_args_after_double_dash())

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    preview_path = output_dir / "neutral-preview.png"
    glb_path = output_dir / "cockpit-pipeline-smoke.glb"
    report_path = output_dir / "smoke-report.json"

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:
        scene.render.engine = "BLENDER_WORKBENCH"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0

    root = _create_cube("SMOKE_ROOT", (0.0, 0.0, 0.0), (2.0, 1.0, 0.08))
    yoke = _create_cube("SMOKE_YOKE", (0.0, -0.45, 0.35), (0.6, 0.08, 0.08))
    yoke["game_id"] = "smoke.yoke"
    yoke["interaction"] = "inspect"

    bpy.ops.object.light_add(type="AREA", location=(0.0, -2.5, 3.0))
    light = bpy.context.object
    light.name = "SMOKE_NEUTRAL_AREA_LIGHT"
    light.data.energy = 450
    light.data.size = 4

    bpy.ops.object.camera_add(location=(0.0, -3.2, 1.35), rotation=(1.22, 0.0, 0.0))
    camera = bpy.context.object
    camera.name = "CAM_SMOKE_CAPTAIN_APPROVAL"
    scene.camera = camera
    scene.render.resolution_x = 640
    scene.render.resolution_y = 360
    scene.render.filepath = str(preview_path)
    bpy.ops.render.render(write_still=True)

    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB", export_extras=True)
    _inspect_glb_header(glb_path)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    imported_names = sorted(obj.name for obj in bpy.context.scene.objects)
    required = {"SMOKE_ROOT", "SMOKE_YOKE"}
    missing = sorted(required - set(imported_names))
    if missing:
        raise RuntimeError(f"reopened GLB missing object(s): {', '.join(missing)}")

    report = {
        "preview": str(preview_path),
        "glb": str(glb_path),
        "glbBytes": glb_path.stat().st_size,
        "importedObjects": imported_names,
        "status": "pass"
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


def _create_cube(name: str, location: tuple[float, float, float], scale: tuple[float, float, float]):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def _inspect_glb_header(path: Path) -> None:
    with path.open("rb") as handle:
        magic = handle.read(4)
    if magic != b"glTF":
        raise RuntimeError(f"{path} is not a GLB file")


def _args_after_double_dash() -> list[str]:
    import sys

    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


if __name__ == "__main__":
    main()
