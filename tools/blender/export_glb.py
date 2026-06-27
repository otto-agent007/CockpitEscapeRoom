"""Export one named Blender hierarchy to a raw GLB while preserving interaction contracts."""

from __future__ import annotations

import os
import sys
import json
from pathlib import Path

import bpy

ROOT_NAME = os.environ.get("ASSET_ROOT", "")
OUTPUT_PATH = Path(os.environ.get("ASSET_OUTPUT", ".cache/assets/unknown/unknown.raw.glb"))
REPORT_DIR = Path(os.environ.get("ASSET_REPORT_DIR", OUTPUT_PATH.parent))

root = bpy.data.objects.get(ROOT_NAME)
if root is None:
    print(f"ERROR: Required root object is missing: {ROOT_NAME}")
    sys.exit(1)

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="DESELECT")
root.select_set(True)
for child in root.children_recursive:
    child.select_set(True)
bpy.context.view_layer.objects.active = root

selected_objects = [root, *root.children_recursive]
game_id_nodes = [
    {"name": obj.name, "game_id": str(obj["game_id"])}
    for obj in selected_objects
    if "game_id" in obj
]
export_settings = {
    "export_format": "GLB",
    "use_selection": True,
    "export_extras": True,
    "export_apply": False,
    "export_animations": True,
    "export_cameras": True,
    "export_lights": True,
}

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT_PATH),
    **export_settings,
)

report_path = REPORT_DIR / "export-contract-report.json"
report_path.write_text(
    json.dumps(
        {
            "rootObject": ROOT_NAME,
            "outputPath": str(OUTPUT_PATH),
            "selectedObjectCount": len(selected_objects),
            "gameIdNodeCount": len(game_id_nodes),
            "gameIdNodes": game_id_nodes,
            "settings": export_settings,
            "contractNote": "export_extras must remain true so Blender custom properties reach glTF extras/userData.",
        },
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)

print(f"Exported {ROOT_NAME} to {OUTPUT_PATH}")
print(f"Export contract report: {report_path}")
