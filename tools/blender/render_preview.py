"""Render consistent approval views from cameras whose names contain APPROVAL."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import bpy

ASSET_NAME = os.environ.get("ASSET_NAME", "unknown")
REPORT_DIR = Path(os.environ.get("ASSET_REPORT_DIR", f".cache/assets/{ASSET_NAME}"))
PREVIEW_DIR = REPORT_DIR / "previews"
PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

cameras = [obj for obj in bpy.data.objects if obj.type == "CAMERA" and "APPROVAL" in obj.name]
if not cameras:
    print("ERROR: No approval cameras found.")
    sys.exit(1)

scene = bpy.context.scene
eevee_engine = "BLENDER_EEVEE_NEXT"
available_engines = [item.identifier for item in scene.render.bl_rna.properties["engine"].enum_items]
if eevee_engine not in available_engines:
    eevee_engine = "BLENDER_EEVEE"
scene.render.engine = eevee_engine
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"

for camera in cameras:
    scene.camera = camera
    output = PREVIEW_DIR / f"{camera.name.lower()}.png"
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {output}")
