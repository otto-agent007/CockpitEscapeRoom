"""Render five neutral inspection poses from the owner-selected dance_02 Action."""

from pathlib import Path

import bpy
from mathutils import Vector


scene = bpy.context.scene
rig = bpy.data.objects["OPTIMUS_GUIDE_RIG"]
action = bpy.data.actions["Armature|dance_02.001"]
rig.animation_data.action = action
rig.animation_data.action_slot = action.slots[0]

scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.color_type = "TEXTURE"
scene.display.shading.light = "STUDIO"
scene.display.shading.background_type = "VIEWPORT"
scene.display.shading.background_color = (0.20, 0.25, 0.29)
scene.display.shading.show_cavity = True
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"

camera_data = bpy.data.cameras.new("CAM_OPTIMUS_DANCE_REVIEW")
camera = bpy.data.objects.new("CAM_OPTIMUS_DANCE_REVIEW", camera_data)
scene.collection.objects.link(camera)
camera.location = (0, -3.2, 1.05)
camera.rotation_euler = (Vector((0, 0, 0.50)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = 1.35
scene.camera = camera

output = Path("preview-renders/optimus-gen3-animation-intake/dance_02-review")
output.mkdir(parents=True, exist_ok=True)
for frame in (1, 75, 135, 193, 307):
    scene.frame_set(frame)
    scene.render.filepath = str(output / f"dance_02-f{frame:03}.png")
    bpy.ops.render.render(write_still=True)
    print("OPTIMUS_DANCE_RENDER", frame, scene.render.filepath, flush=True)
