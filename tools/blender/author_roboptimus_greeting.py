"""Author a grounded congratulations gesture on the existing Gen 3 rig.

Open optimus_guide_source_candidate.blend with factory startup and autoexec off.
The original master and imported actions are preserved. This writes a derivative
master containing a new six-second action; export it with -- personal-escort.
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "art-source/blender/roboptimus_personal_greeting.blend"
ACTION = "ROBOPTIMUS_PERSONAL_GREETING"
rig = bpy.data.objects.get("OPTIMUS_GUIDE_RIG") or bpy.data.objects["Armature"]
idle = bpy.data.actions["Armature|idle.001"]
rig.animation_data.action = idle
rig.animation_data.action_slot = idle.slots[0]
bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()
base = {bone.name: bone.matrix_basis.copy() for bone in rig.pose.bones}
base_q = {name: matrix.to_quaternion() for name, matrix in base.items()}
rig.animation_data.action = None
action = bpy.data.actions.new(ACTION)
action.use_fake_user = True
rig.animation_data.action = action
for bone in rig.pose.bones:
    bone.rotation_mode = "QUATERNION"


def smooth(value, start, end):
    t = max(0.0, min(1.0, (value - start) / (end - start)))
    return t * t * (3.0 - 2.0 * t)


def envelope(t, start, peak, release, end):
    return smooth(t, start, peak) * (1.0 - smooth(t, release, end))


def bone(short):
    return rig.pose.bones["mixamorig:" + short]


def rotate_world(pose_bone, delta):
    world = rig.matrix_world @ pose_bone.matrix
    pose_bone.matrix = rig.matrix_world.inverted() @ Matrix.LocRotScale(
        world.translation, delta @ world.to_quaternion(), world.to_scale()
    )
    bpy.context.view_layer.update()


def aim(pose_bone, target):
    head = rig.matrix_world @ pose_bone.head
    tail = rig.matrix_world @ pose_bone.tail
    rotate_world(pose_bone, (tail - head).rotation_difference(target - head))


def present_hand(side, target, fingers, amount):
    if amount <= 0:
        return
    arm, forearm, hand = [bone(side + part) for part in ("Arm", "ForeArm", "Hand")]
    shoulder = rig.matrix_world @ arm.head
    upper_length = (rig.matrix_world @ arm.tail - shoulder).length
    fore_length = (rig.matrix_world @ forearm.tail - rig.matrix_world @ forearm.head).length
    direction = target - shoulder
    distance = min(direction.length, upper_length + fore_length - 0.001)
    direction.normalize()
    along = (upper_length**2 - fore_length**2 + distance**2) / (2.0 * distance)
    hint = Vector((1 if side == "Left" else -1, 0, -0.7))
    bend = (hint - direction * hint.dot(direction)).normalized()
    elbow = shoulder + direction * along + bend * math.sqrt(max(0, upper_length**2 - along**2))
    aim(arm, elbow)
    aim(forearm, target)

    # Orient the palm from its actual knuckles rather than guessing FBX axes.
    wrist = rig.matrix_world @ hand.head
    index = rig.matrix_world @ bone(side + "HandIndex1").head - wrist
    pinky = rig.matrix_world @ bone(side + "HandPinky1").head - wrist
    middle = (rig.matrix_world @ bone(side + "HandMiddle1").head - wrist).normalized()
    palm = index.cross(pinky).normalized() * (1 if side == "Right" else -1)
    palm = (palm - middle * palm.dot(middle)).normalized()
    old_frame = Matrix((middle.cross(palm), middle, palm)).transposed()
    fingers = fingers.normalized()
    up = Vector((0, 0, 1))
    normal = (up - fingers * up.dot(fingers)).normalized()
    new_frame = Matrix((fingers.cross(normal), fingers, normal)).transposed()
    rotate_world(hand, (new_frame @ old_frame.transposed()).to_quaternion())
    for pose_bone in (arm, forearm, hand):
        pose_bone.rotation_quaternion = base_q[pose_bone.name].slerp(pose_bone.rotation_quaternion, amount)
    for pose_bone in rig.pose.bones:
        if pose_bone.name.startswith("mixamorig:" + side + "Hand") and pose_bone != hand:
            pose_bone.rotation_quaternion = base_q[pose_bone.name].slerp(Quaternion(), amount * 0.85)
    bpy.context.view_layer.update()


feet = []
samples = []
for frame in range(1, 146):
    bpy.context.scene.frame_set(frame)
    for name, matrix in base.items():
        rig.pose.bones[name].matrix_basis = matrix
    bpy.context.view_layer.update()
    t = (frame - 1) / 24.0
    nod = envelope(t, 0.25, 0.65, 0.85, 1.4)
    welcome = envelope(t, 1.1, 1.8, 2.6, 3.2)
    invitation = envelope(t, 3.6, 4.4, 5.1, 5.75)
    rotate_world(bone("Spine2"), Quaternion((0, 0, 1), math.radians(5) * invitation))
    rotate_world(bone("Neck"), Quaternion((0, 0, 1), math.radians(12) * invitation))
    rotate_world(bone("Head"), Quaternion((1, 0, 0), math.radians(6) * nod))
    present_hand("Right", Vector((-0.19, -0.15, 0.64)), Vector((0, -1, 0.12)), welcome)
    present_hand("Left", Vector((0.26, 0.08, 0.68)), Vector((1, 0.35, 0.05)), invitation)
    for pose_bone in rig.pose.bones:
        pose_bone.keyframe_insert(data_path="location", frame=frame, group=pose_bone.name)
        pose_bone.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=pose_bone.name)
        pose_bone.keyframe_insert(data_path="scale", frame=frame, group=pose_bone.name)
    feet.append([list(rig.matrix_world @ bone(side + "ToeBase").head) for side in ("Left", "Right")])
    if frame in (1, 20, 50, 108, 145):
        samples.append({"frame": frame, "rightWrist": list(rig.matrix_world @ bone("RightHand").head), "leftWrist": list(rig.matrix_world @ bone("LeftHand").head)})

foot_drift = max((Vector(point) - Vector(feet[0][side])).length for frame in feet for side, point in enumerate(frame))
assert foot_drift < 0.00001, f"Greeting must keep both feet planted: {foot_drift}"
assert len(action.slots) == 1
bpy.context.scene.render.fps = 24
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 145
bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT), compress=True)
report = {"action": ACTION, "source": "art-source/blender/optimus_guide_source_candidate.blend", "master": str(OUTPUT.relative_to(ROOT)), "frames": 145, "fps": 24, "footDrift": foot_drift, "samples": samples, "retainedActions": len(bpy.data.actions)}
cache = ROOT / ".cache/assets/optimus-guide"
cache.mkdir(parents=True, exist_ok=True)
(cache / "personal-greeting-authoring.json").write_text(json.dumps(report, indent=2) + "\n")
print("ROBOPTIMUS_PERSONAL_GREETING", json.dumps(report))
