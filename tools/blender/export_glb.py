"""Export one named Blender hierarchy to a raw GLB while preserving interaction contracts."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import bpy

ROOT_NAME = os.environ.get("ASSET_ROOT", "")
OUTPUT_PATH = Path(os.environ.get("ASSET_OUTPUT", ".cache/assets/unknown/unknown.raw.glb"))

root = bpy.data.objects.get(ROOT_NAME)
if root is None:
    print(f"ERROR: Required root object is missing: {ROOT_NAME}")
    sys.exit(1)

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="DESELECT")
root.select_set(True)
for child in root.children_recursive:
    child.select_set(True)
bpy.context.view_layer.objects.active = root

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT_PATH),
    export_format="GLB",
    use_selection=True,
    export_extras=True,
    export_apply=False,
    export_animations=True,
    export_cameras=True,
    export_lights=True,
)

print(f"Exported {ROOT_NAME} to {OUTPUT_PATH}")
