"""Create the limited DC-9 proof-of-pipeline Blender source file.

This script is intentionally source-authoring only. Export scripts must read the
saved master file and write GLBs separately.
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector

OUTPUT = Path("art-source/blender/dc9_master.blend")


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)


def material(name: str, base: tuple[float, float, float, float], roughness: float = 0.65, emission=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base
        bsdf.inputs["Roughness"].default_value = roughness
        if emission:
            bsdf.inputs["Emission Color"].default_value = emission[0]
            bsdf.inputs["Emission Strength"].default_value = emission[1]
    return mat


def cube(name: str, parent, loc, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_MESH"
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = parent
    obj.data.materials.append(mat)
    obj.data.uv_layers.new(name="UVMap")
    return obj


def empty(name: str, parent=None, loc=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.35
    obj.location = loc
    obj.parent = parent
    return obj


def make_switch(name: str, parent, loc, x_offset: float, game_id: str, mat_dark, mat_handle):
    base = cube(f"{name}_BASE", parent, (loc[0] + x_offset, loc[1], loc[2]), (0.18, 0.07, 0.1), mat_dark)
    base["game_role"] = "switch_base"

    lever_mesh = bpy.data.meshes.new(f"{name}_MESH")
    w, d, h = 0.045, 0.035, 0.32
    verts = [
        (-w, -d, 0.0),
        (w, -d, 0.0),
        (w, d, 0.0),
        (-w, d, 0.0),
        (-w, -d, h),
        (w, -d, h),
        (w, d, h),
        (-w, d, h),
    ]
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    lever_mesh.from_pydata(verts, [], faces)
    lever_mesh.update()
    lever_mesh.uv_layers.new(name="UVMap")
    lever = bpy.data.objects.new(name, lever_mesh)
    bpy.context.scene.collection.objects.link(lever)
    lever.location = (loc[0] + x_offset, loc[1] - 0.02, loc[2] + 0.04)
    lever.rotation_euler[0] = math.radians(-12)
    lever.parent = parent
    lever.data.materials.append(mat_handle)
    lever["game_id"] = game_id
    lever["interaction"] = "toggle"
    lever["puzzle_id"] = "legacy_power"
    lever["rotation_axis"] = "LOCAL_X"
    lever["rest_angle"] = 0.0
    lever["active_angle"] = 0.42
    lever["sound_id"] = "switch_heavy"
    lever["pivot_note"] = "Origin is at the lower hinge edge; local X is the toggle axis."
    return lever


def make_cylinder(name: str, parent, loc, radius: float, depth: float, mat, vertices: int = 48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=(math.pi / 2, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_MESH"
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = parent
    obj.data.materials.append(mat)
    obj.data.uv_layers.new(name="UVMap")
    return obj


def add_route_card(parent, mat_card, mat_ink):
    card = cube("DC9_PROP_MEM_ROUTE_CARD_01", parent, (1.35, -0.72, 0.42), (0.56, 0.03, 0.34), mat_card)
    card.rotation_euler[0] = math.radians(8)
    card["game_id"] = "dc9.memphis.route_card"
    card["puzzle_id"] = "southern_funnel"
    card["interaction"] = "inspect"
    card["route_context"] = "MEM feeder-route atmosphere; fictionalized and non-operational."

    for idx, label in enumerate(["MEM", "LIT", "JAN", "BHM"]):
        text = bpy.data.curves.new(f"DC9_ROUTE_TEXT_{label}_CURVE", "FONT")
        text.body = label
        text.align_x = "CENTER"
        text.align_y = "CENTER"
        text.size = 0.055
        obj = bpy.data.objects.new(f"DC9_ROUTE_TEXT_{label}", text)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = (1.35, -0.745, 0.52 - idx * 0.075)
        obj.rotation_euler = (math.radians(98), 0, 0)
        obj.parent = parent
        obj.data.materials.append(mat_ink)
    return card


def create_scene() -> None:
    clear_scene()

    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    eevee_engine = "BLENDER_EEVEE_NEXT"
    available_engines = [item.identifier for item in bpy.context.scene.render.bl_rna.properties["engine"].enum_items]
    if eevee_engine not in available_engines:
        eevee_engine = "BLENDER_EEVEE"
    bpy.context.scene.render.engine = eevee_engine
    bpy.context.scene.eevee.taa_render_samples = 64

    panel_mat = material("DC9_PANEL_BLUE_GREY", (0.18, 0.27, 0.28, 1), 0.78)
    shell_mat = material("DC9_SHELL_WARM_GREY", (0.34, 0.36, 0.34, 1), 0.72)
    dark_mat = material("DC9_DARK_BEZEL", (0.025, 0.028, 0.027, 1), 0.62)
    glass_mat = material("DC9_GAUGE_GLASS", (0.08, 0.11, 0.12, 0.36), 0.12)
    white_mat = material("DC9_NEEDLE_WARM_WHITE", (0.92, 0.87, 0.72, 1), 0.42)
    card_mat = material("DC9_ROUTE_CARD_OFF_WHITE", (0.86, 0.8, 0.63, 1), 0.88)
    ink_mat = material("DC9_ROUTE_CARD_INK", (0.05, 0.07, 0.08, 1), 0.8)
    annunciator_mat = material(
        "DC9_ANNUNCIATOR_AMBER_EMISSIVE",
        (1.0, 0.46, 0.08, 1),
        0.35,
        emission=((1.0, 0.39, 0.05, 1), 1.8),
    )

    root = empty("DC9_ROOT")
    root["asset_id"] = "dc9"
    root["asset_stage"] = "pipeline_proof"
    root["modeling_scope"] = "Limited DC-9 cockpit shell and main-panel blockout only."
    root["safety_note"] = "Parked commemorative aircraft; interactions are fictional and non-operational."

    static = empty("DC9_STATIC", root)
    interactive = empty("DC9_INTERACTIVE", root)
    emissive = empty("DC9_EMISSIVE", root)
    colliders = empty("DC9_COLLIDERS", root)
    locators = empty("DC9_LOCATORS", root)
    props = empty("DC9_PUZZLE_PROPS", root)

    cube("DC9_COCKPIT_SHELL_FLOOR_01", static, (0, 0.05, -0.28), (3.8, 3.2, 0.08), shell_mat)
    cube("DC9_COCKPIT_SHELL_LEFT_WALL_01", static, (-1.96, 0.1, 0.68), (0.08, 3.1, 1.8), shell_mat)
    cube("DC9_COCKPIT_SHELL_RIGHT_WALL_01", static, (1.96, 0.1, 0.68), (0.08, 3.1, 1.8), shell_mat)
    cube("DC9_COCKPIT_SHELL_CEILING_01", static, (0, 0.0, 1.62), (3.65, 2.95, 0.08), shell_mat)
    cube("DC9_WINDSHIELD_CENTER_POST_01", static, (0, -1.45, 0.95), (0.08, 0.08, 1.12), dark_mat)
    cube("DC9_WINDSHIELD_LEFT_FRAME_01", static, (-0.72, -1.47, 1.02), (0.82, 0.07, 0.07), dark_mat)
    cube("DC9_WINDSHIELD_RIGHT_FRAME_01", static, (0.72, -1.47, 1.02), (0.82, 0.07, 0.07), dark_mat)

    cube("DC9_MAIN_PANEL_BLOCKOUT_01", static, (0, -1.0, 0.42), (3.05, 0.16, 1.03), panel_mat)
    cube("DC9_GLARESHIELD_BLOCKOUT_01", static, (0, -1.18, 1.02), (3.2, 0.46, 0.18), dark_mat)
    cube("DC9_CENTER_PEDESTAL_BLOCKOUT_01", static, (0, -0.18, 0.04), (0.72, 1.24, 0.38), panel_mat)
    cube("DC9_OVERHEAD_PANEL_BLOCKOUT_01", static, (0, -0.18, 1.46), (1.45, 1.05, 0.08), panel_mat)
    cube("DC9_CAPTAIN_YOKE_COLUMN_BLOCKOUT_01", static, (-0.82, -0.55, 0.16), (0.1, 0.16, 0.42), dark_mat)
    cube("DC9_CAPTAIN_YOKE_GRIP_BLOCKOUT_01", static, (-0.82, -0.72, 0.45), (0.48, 0.08, 0.18), dark_mat)

    for x in [-1.05, -0.72, -0.39, 0.28, 0.61, 0.94]:
        make_cylinder(f"DC9_ANALOG_GAUGE_BEZEL_{int((x + 2) * 100):03d}", static, (x, -0.885, 0.58), 0.125, 0.05, dark_mat)
    make_cylinder("DC9_GAUGE_LEGACY_CODE_01", static, (-1.05, -0.855, 0.58), 0.095, 0.018, glass_mat)
    needle = cube("DC9_GAUGE_LEGACY_CODE_NEEDLE_01", static, (-1.05, -0.835, 0.58), (0.018, 0.018, 0.165), white_mat)
    needle.location.z += 0.055
    needle["game_id"] = "dc9.legacy_power.gauge"
    needle["interaction"] = "animated_indicator"
    needle["animation_id"] = "legacy_power_needle_sweep"
    needle["puzzle_id"] = "legacy_power"
    needle.keyframe_insert(data_path="rotation_euler", frame=1)
    needle.rotation_euler[1] = math.radians(-58)
    needle.keyframe_insert(data_path="rotation_euler", frame=36)
    needle.rotation_euler[1] = math.radians(42)
    needle.keyframe_insert(data_path="rotation_euler", frame=96)

    make_switch("DC9_SW_LEGACY_POWER_01", interactive, (-0.25, -0.86, 0.0), -0.22, "dc9.legacy_power.switch01", dark_mat, white_mat)
    make_switch("DC9_SW_LEGACY_POWER_02", interactive, (-0.25, -0.86, 0.0), 0.0, "dc9.legacy_power.switch02", dark_mat, white_mat)
    make_switch("DC9_SW_LEGACY_POWER_03", interactive, (-0.25, -0.86, 0.0), 0.22, "dc9.legacy_power.switch03", dark_mat, white_mat)

    annunciator = cube("DC9_ANNUNCIATOR_LEGACY_POWER_01", emissive, (0.62, -0.87, 0.91), (0.42, 0.04, 0.11), annunciator_mat)
    annunciator["game_id"] = "dc9.legacy_power.annunciator"
    annunciator["puzzle_id"] = "legacy_power"
    annunciator["interaction"] = "indicator"
    annunciator["emissive_state"] = "legacy_power_restored"

    add_route_card(props, card_mat, ink_mat)

    collider = cube("DC9_COLLIDER_LEGACY_POWER_SWITCHBANK_01", colliders, (-0.25, -0.86, 0.19), (0.75, 0.08, 0.55), dark_mat)
    collider.display_type = "WIRE"
    collider.hide_render = True
    collider["game_id"] = "dc9.legacy_power.switchbank.collider"
    collider["interaction"] = "hit_target"
    collider["puzzle_id"] = "legacy_power"

    camera = bpy.data.cameras.new("CAM_DC9_CAPTAIN_APPROVAL")
    camera.lens = 20
    camera.angle = math.radians(68)
    camera.clip_start = 0.01
    camera_obj = bpy.data.objects.new("CAM_DC9_CAPTAIN_APPROVAL", camera)
    bpy.context.scene.collection.objects.link(camera_obj)
    camera_obj.location = (-0.62, 1.18, 0.96)
    direction = Vector((0.0, -1.08, 0.5)) - camera_obj.location
    camera_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera_obj.parent = locators
    bpy.context.scene.camera = camera_obj

    light_data = bpy.data.lights.new("DC9_APPROVAL_AREA_LIGHT", "AREA")
    light_data.energy = 850
    light_data.size = 3.0
    light = bpy.data.objects.new("DC9_APPROVAL_AREA_LIGHT", light_data)
    bpy.context.scene.collection.objects.link(light)
    light.location = (0, -0.2, 2.4)
    light.parent = locators

    fill_data = bpy.data.lights.new("DC9_APPROVAL_PANEL_FILL", "POINT")
    fill_data.energy = 160
    fill_data.shadow_soft_size = 1.0
    fill = bpy.data.objects.new("DC9_APPROVAL_PANEL_FILL", fill_data)
    bpy.context.scene.collection.objects.link(fill)
    fill.location = (-0.8, -0.45, 1.0)
    fill.parent = locators

    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 96
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT))


if __name__ == "__main__":
    create_scene()
