"""Export a bounded, review-only Optimus guide from the preserved Tripo Blender intake.

Run from the project root with Blender 5.1.2:
  blender -b --factory-startup \
    art-source/blender/optimus_guide_source_candidate.blend \
    -P tools/blender/export_optimus_guide_candidate.py -- dance-02

The full 31-action source remains intact. Each action variant gets its own raw GLB in
.cache until validated, preserving earlier review candidates.
"""

import sys
from pathlib import Path

import bpy


ROOT = Path.cwd()
SOURCE = ROOT / "art-source/blender/optimus_guide_source_candidate.blend"
VARIANTS = {
    "greet-walk": ("optimus-guide-review-raw.glb", {"Armature|greet_01.001", "Armature|walk.001"}, "Armature|greet_01.001"),
    "dance-02": ("optimus-dance-02-review-raw.glb", {"Armature|dance_02.001"}, "Armature|dance_02.001"),
}


def main() -> None:
    variant = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "greet-walk"
    if variant not in VARIANTS:
        raise ValueError(f"Unknown Optimus review variant: {variant}")
    output_name, action_names, active_name = VARIANTS[variant]
    raw_glb = ROOT / ".cache/assets/optimus-guide" / output_name
    rig = bpy.data.objects.get("OPTIMUS_GUIDE_RIG") or bpy.data.objects["Armature"]
    body = bpy.data.objects.get("OPTIMUS_GUIDE_BODY") or bpy.data.objects["tripo_node_56ab879e"]
    assert rig.type == "ARMATURE" and body.type == "MESH"
    assert len(body.data.polygons) == 23479
    assert action_names <= set(bpy.data.actions.keys())

    rig.name = "OPTIMUS_GUIDE_RIG"
    body.name = "OPTIMUS_GUIDE_BODY"
    rig["game_id"] = "guide.optimus"
    body["game_id"] = "guide.optimus.body"
    rig["source_status"] = "review_candidate"

    if not SOURCE.exists():
        SOURCE.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE), compress=True)

    greeting = bpy.data.actions[active_name]
    rig.animation_data.action = greeting
    rig.animation_data.action_slot = greeting.slots[0]
    for action in list(bpy.data.actions):
        if action.name not in action_names:
            bpy.data.actions.remove(action)
    assert len(bpy.data.actions) == len(action_names)

    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    body.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.context.scene.frame_set(1)
    raw_glb.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(raw_glb),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_anim_slide_to_zero=True,
        export_image_format="AUTO",
        export_cameras=False,
        export_lights=False,
    )
    print("OPTIMUS_VARIANT", variant)
    print("OPTIMUS_EXPORT", raw_glb, raw_glb.stat().st_size)
    print("OPTIMUS_SOURCE", SOURCE, SOURCE.stat().st_size)
    print("OPTIMUS_ACTIONS", [(action.name, tuple(action.frame_range)) for action in bpy.data.actions])
    print("OPTIMUS_MATERIALS", [(material.name, material.use_nodes) for material in bpy.data.materials])
    print("OPTIMUS_IMAGES", [(image.name, tuple(image.size)) for image in bpy.data.images if image.size[0]])


main()
