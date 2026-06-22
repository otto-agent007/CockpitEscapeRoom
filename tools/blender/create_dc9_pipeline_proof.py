"""Create the limited DC-9 proof-of-pipeline Blender source file.

The output is a deliberately bounded captain-seat blockout. It proves model scale,
hierarchy, pivots, cameras, materials, animations, and glTF custom properties without
starting final production cockpit geometry.
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
    for curve in list(bpy.data.curves):
        bpy.data.curves.remove(curve)


def material(name: str, base: tuple[float, float, float, float], roughness: float = 0.65, metallic: float = 0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = base
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if emission and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission[0]
            bsdf.inputs["Emission Strength"].default_value = emission[1]
    mat.diffuse_color = base
    return mat


def empty(name: str, parent=None, loc=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.28
    obj.location = loc
    obj.parent = parent
    return obj


def cube(name: str, parent, loc, scale, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_MESH"
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = parent
    obj.data.materials.append(mat)
    obj.data.uv_layers.new(name="UVMap")
    return obj


def cylinder(name: str, parent, loc, radius: float, depth: float, mat, vertices: int = 48, rot=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_MESH"
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = parent
    obj.data.materials.append(mat)
    obj.data.uv_layers.new(name="UVMap")
    return obj


def add_label(name: str, parent, text: str, loc, size: float, mat, rot=(math.radians(90), 0, 0)):
    curve = bpy.data.curves.new(f"{name}_CURVE", "FONT")
    curve.body = text
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    obj.parent = parent
    obj.data.materials.append(mat)
    return obj


def add_gauge(parent, name: str, loc, radius: float, mat_bezel, mat_face, mat_glass, mat_tick, mat_needle, game_id: str | None = None):
    cylinder(f"{name}_BEZEL", parent, loc, radius, 0.045, mat_bezel, 64)
    cylinder(f"{name}_FACE", parent, (loc[0], loc[1] + 0.028, loc[2]), radius * 0.82, 0.014, mat_face, 64)
    for idx in range(10):
        angle = math.radians(-135 + idx * 30)
        x = loc[0] + math.sin(angle) * radius * 0.62
        z = loc[2] + math.cos(angle) * radius * 0.62
        tick = cube(f"{name}_TICK_{idx:02d}", parent, (x, loc[1] + 0.046, z), (0.012, 0.01, 0.055), mat_tick, (0, angle, 0))
        tick["reference_role"] = "gauge_tick"
    glass = cylinder(f"{name}_GLASS", parent, (loc[0], loc[1] + 0.055, loc[2]), radius * 0.78, 0.008, mat_glass, 64)
    glass["material_note"] = "Transparent-looking approval material; review glTF alpha before production."
    needle = cube(f"{name}_NEEDLE", parent, (loc[0], loc[1] + 0.068, loc[2] + radius * 0.19), (0.018, 0.014, radius * 0.82), mat_needle)
    if game_id:
        needle.name = "DC9_GAUGE_LEGACY_CODE_NEEDLE_01"
        needle.data.name = "DC9_GAUGE_LEGACY_CODE_NEEDLE_01_MESH"
        needle["game_id"] = game_id
        needle["interaction"] = "animated_indicator"
        needle["animation_id"] = "legacy_power_needle_sweep"
        needle["puzzle_id"] = "legacy_power"
        needle.keyframe_insert(data_path="rotation_euler", frame=1)
        needle.rotation_euler[1] = math.radians(-58)
        needle.keyframe_insert(data_path="rotation_euler", frame=36)
        needle.rotation_euler[1] = math.radians(42)
        needle.keyframe_insert(data_path="rotation_euler", frame=96)
    return needle


def make_switch(name: str, parent, loc, game_id: str, mat_base, mat_handle, mat_tip):
    base = cube(f"{name}_BASE", parent, loc, (0.18, 0.07, 0.1), mat_base)
    base["game_role"] = "switch_base"

    lever_mesh = bpy.data.meshes.new(f"{name}_MESH")
    w, d, h = 0.032, 0.027, 0.28
    verts = [
        (-w, -d, 0.0), (w, -d, 0.0), (w, d, 0.0), (-w, d, 0.0),
        (-w, -d, h), (w, -d, h), (w, d, h), (-w, d, h),
    ]
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    lever_mesh.from_pydata(verts, [], faces)
    lever_mesh.update()
    lever_mesh.uv_layers.new(name="UVMap")
    lever = bpy.data.objects.new(name, lever_mesh)
    bpy.context.scene.collection.objects.link(lever)
    lever.location = (loc[0], loc[1] - 0.02, loc[2] + 0.045)
    lever.rotation_euler[0] = math.radians(-14)
    lever.parent = parent
    lever.data.materials.append(mat_handle)
    lever["game_id"] = game_id
    lever["interaction"] = "toggle"
    lever["puzzle_id"] = "legacy_power"
    lever["rotation_axis"] = "LOCAL_X"
    lever["rest_angle"] = 0.0
    lever["active_angle"] = 0.42
    lever["sound_id"] = "switch_heavy"
    lever["pivot_note"] = "Origin is at lower hinge edge; local X is the toggle axis."
    cylinder(f"{name}_TIP", parent, (loc[0], loc[1] - 0.02, loc[2] + 0.34), 0.045, 0.045, mat_tip, 24, (0, 0, 0))
    return lever


def add_route_card(parent, mat_card, mat_ink):
    card = cube("DC9_PROP_MEM_ROUTE_CARD_01", parent, (1.18, -0.62, 0.31), (0.56, 0.035, 0.34), mat_card, (math.radians(8), 0, math.radians(-3)))
    card["game_id"] = "dc9.memphis.route_card"
    card["puzzle_id"] = "southern_funnel"
    card["interaction"] = "inspect"
    card["route_context"] = "MEM feeder-route atmosphere; fictionalized and non-operational."
    for idx, label in enumerate(["MEM", "LIT", "JAN", "BHM"]):
        add_label(f"DC9_ROUTE_TEXT_{label}", parent, label, (1.18, -0.65, 0.42 - idx * 0.075), 0.052, mat_ink, (math.radians(98), 0, math.radians(-3)))
    return card


def add_yoke(parent, prefix: str, x: float, mat_dark, mat_grip):
    cube(f"{prefix}_YOKE_COLUMN_BLOCKOUT_01", parent, (x, -0.46, 0.12), (0.1, 0.18, 0.42), mat_dark, (math.radians(-6), 0, 0))
    cube(f"{prefix}_YOKE_STEM_BLOCKOUT_01", parent, (x, -0.66, 0.38), (0.08, 0.24, 0.08), mat_dark, (math.radians(8), 0, 0))
    cube(f"{prefix}_YOKE_GRIP_LEFT_01", parent, (x - 0.19, -0.73, 0.46), (0.1, 0.08, 0.24), mat_grip, (0, 0, math.radians(-12)))
    cube(f"{prefix}_YOKE_GRIP_RIGHT_01", parent, (x + 0.19, -0.73, 0.46), (0.1, 0.08, 0.24), mat_grip, (0, 0, math.radians(12)))
    cube(f"{prefix}_YOKE_CENTER_PAD_01", parent, (x, -0.75, 0.46), (0.34, 0.08, 0.18), mat_grip)


def add_screws(parent, mat, positions):
    for idx, loc in enumerate(positions):
        obj = cylinder(f"DC9_PANEL_SCREW_{idx:02d}", parent, loc, 0.018, 0.01, mat, 18)
        obj["detail_role"] = "approval_scale_fastener"


def create_scene() -> None:
    clear_scene()

    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    engines = [item.identifier for item in bpy.context.scene.render.bl_rna.properties["engine"].enum_items]
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    bpy.context.scene.render.resolution_x = 1600
    bpy.context.scene.render.resolution_y = 900
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.view_settings.exposure = -0.35
    bpy.context.scene.view_settings.gamma = 1.0
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 96

    panel_mat = material("DC9_PANEL_BLUE_GREY", (0.13, 0.25, 0.26, 1), 0.84, 0.02)
    panel_dark = material("DC9_PANEL_DARK_BLUE_GREY", (0.055, 0.09, 0.095, 1), 0.8, 0.04)
    shell_mat = material("DC9_SHELL_WARM_GREY", (0.35, 0.36, 0.33, 1), 0.74)
    dark_mat = material("DC9_DARK_BEZEL", (0.025, 0.028, 0.027, 1), 0.58, 0.2)
    glass_mat = material("DC9_GAUGE_GLASS", (0.11, 0.15, 0.16, 0.38), 0.12)
    face_mat = material("DC9_GAUGE_FACE_BLACK", (0.01, 0.012, 0.011, 1), 0.7)
    tick_mat = material("DC9_WARM_INSTRUMENT_MARKS", (0.86, 0.82, 0.68, 1), 0.65)
    white_mat = material("DC9_NEEDLE_WARM_WHITE", (0.92, 0.87, 0.72, 1), 0.42)
    grip_mat = material("DC9_YOKE_WORN_BLACK", (0.035, 0.032, 0.028, 1), 0.86, 0.04)
    metal_mat = material("DC9_SWITCH_BRUSHED_METAL", (0.48, 0.47, 0.42, 1), 0.44, 0.45)
    card_mat = material("DC9_ROUTE_CARD_OFF_WHITE", (0.86, 0.8, 0.63, 1), 0.88)
    ink_mat = material("DC9_ROUTE_CARD_INK", (0.05, 0.07, 0.08, 1), 0.8)
    screw_mat = material("DC9_DULL_SCREW_HEADS", (0.42, 0.43, 0.39, 1), 0.58, 0.6)
    amber_mat = material("DC9_ANNUNCIATOR_AMBER_EMISSIVE", (1.0, 0.46, 0.08, 1), 0.35, emission=((1.0, 0.39, 0.05, 1), 1.8))
    red_mat = material("DC9_HIDDEN_DESTINATION_RED", (0.65, 0.04, 0.025, 1), 0.38, emission=((0.9, 0.05, 0.02, 1), 0.9))

    root = empty("DC9_ROOT")
    root["asset_id"] = "dc9"
    root["asset_stage"] = "pipeline_proof"
    root["target_reference"] = "Northwest-style DC-9-51 seed reference pack"
    root["modeling_scope"] = "Limited DC-9 cockpit shell and main-panel blockout only."
    root["safety_note"] = "Parked commemorative aircraft; interactions are fictional and non-operational."

    static = empty("DC9_STATIC", root)
    interactive = empty("DC9_INTERACTIVE", root)
    emissive = empty("DC9_EMISSIVE", root)
    colliders = empty("DC9_COLLIDERS", root)
    locators = empty("DC9_LOCATORS", root)
    props = empty("DC9_PUZZLE_PROPS", root)

    # Shell proportions and windshield framing are intentionally visible from the captain camera.
    cube("DC9_COCKPIT_SHELL_FLOOR_01", static, (0, 0.08, -0.32), (3.95, 3.35, 0.08), shell_mat)
    cube("DC9_COCKPIT_SHELL_LEFT_WALL_01", static, (-2.02, 0.1, 0.68), (0.08, 3.15, 1.88), shell_mat)
    cube("DC9_COCKPIT_SHELL_RIGHT_WALL_01", static, (2.02, 0.1, 0.68), (0.08, 3.15, 1.88), shell_mat)
    cube("DC9_COCKPIT_SHELL_CEILING_01", static, (0, 0.0, 1.64), (3.78, 3.0, 0.08), shell_mat)
    cube("DC9_WINDSHIELD_CENTER_POST_01", static, (0, -1.48, 0.98), (0.08, 0.09, 1.16), dark_mat)
    cube("DC9_WINDSHIELD_LEFT_FRAME_01", static, (-0.78, -1.5, 1.08), (0.86, 0.08, 0.08), dark_mat, (0, 0, math.radians(-7)))
    cube("DC9_WINDSHIELD_RIGHT_FRAME_01", static, (0.78, -1.5, 1.08), (0.86, 0.08, 0.08), dark_mat, (0, 0, math.radians(7)))
    cube("DC9_WINDOW_LEFT_LOWER_FRAME_01", static, (-1.15, -1.48, 0.62), (0.62, 0.08, 0.06), dark_mat, (0, 0, math.radians(8)))
    cube("DC9_WINDOW_RIGHT_LOWER_FRAME_01", static, (1.15, -1.48, 0.62), (0.62, 0.08, 0.06), dark_mat, (0, 0, math.radians(-8)))

    cube("DC9_MAIN_PANEL_BLOCKOUT_01", static, (0, -1.0, 0.42), (3.1, 0.16, 1.03), panel_mat)
    cube("DC9_CAPTAIN_PANEL_SHADOW_BROW_01", static, (-0.86, -1.115, 0.95), (1.05, 0.18, 0.16), panel_dark)
    cube("DC9_CENTER_ENGINE_PANEL_BLOCKOUT_01", static, (0.12, -1.105, 0.58), (0.72, 0.08, 0.7), panel_dark)
    cube("DC9_GLARESHIELD_BLOCKOUT_01", static, (0, -1.21, 1.04), (3.25, 0.48, 0.18), dark_mat)
    cube("DC9_CENTER_PEDESTAL_BLOCKOUT_01", static, (0, -0.18, 0.03), (0.78, 1.26, 0.38), panel_mat)
    cube("DC9_OVERHEAD_PANEL_BLOCKOUT_01", static, (0, -0.2, 1.47), (1.5, 1.08, 0.08), panel_mat)
    cube("DC9_PEDESTAL_THROTTLE_SLOT_01", static, (0, -0.39, 0.26), (0.5, 0.7, 0.035), dark_mat)
    for x in [-0.16, 0.0, 0.16]:
        cube(f"DC9_THROTTLE_LEVER_BLOCKOUT_{int((x + 1) * 100):03d}", static, (x, -0.51, 0.48), (0.045, 0.08, 0.38), metal_mat, (math.radians(-18), 0, 0))

    add_yoke(static, "DC9_CAPTAIN", -0.86, dark_mat, grip_mat)
    add_yoke(static, "DC9_FIRST_OFFICER", 0.92, dark_mat, grip_mat)

    gauge_positions = [
        (-1.26, -0.895, 0.7), (-0.98, -0.895, 0.7), (-0.7, -0.895, 0.7),
        (-1.26, -0.895, 0.43), (-0.98, -0.895, 0.43), (-0.7, -0.895, 0.43),
        (0.0, -0.895, 0.76), (0.28, -0.895, 0.76), (0.0, -0.895, 0.49), (0.28, -0.895, 0.49),
        (0.75, -0.895, 0.7), (1.03, -0.895, 0.7), (1.31, -0.895, 0.7),
        (0.75, -0.895, 0.43), (1.03, -0.895, 0.43), (1.31, -0.895, 0.43),
    ]
    for idx, pos in enumerate(gauge_positions):
        radius = 0.118 if idx not in {0, 1, 2, 10, 11, 12} else 0.13
        add_gauge(static, f"DC9_ANALOG_GAUGE_{idx:02d}", pos, radius, dark_mat, face_mat, glass_mat, tick_mat, white_mat)
    add_gauge(static, "DC9_GAUGE_LEGACY_CODE_01", (-1.26, -0.83, 0.7), 0.1, dark_mat, face_mat, glass_mat, tick_mat, white_mat, "dc9.legacy_power.gauge")

    add_screws(
        static,
        screw_mat,
        [(-1.48, -0.825, 0.91), (-0.36, -0.825, 0.91), (-1.48, -0.825, 0.17), (-0.36, -0.825, 0.17),
         (0.5, -0.825, 0.91), (1.48, -0.825, 0.91), (0.5, -0.825, 0.17), (1.48, -0.825, 0.17)],
    )

    switch_locs = [(-0.46, -0.86, 0.05), (-0.25, -0.86, 0.05), (-0.04, -0.86, 0.05)]
    for index, loc in enumerate(switch_locs, start=1):
        make_switch(f"DC9_SW_LEGACY_POWER_{index:02d}", interactive, loc, f"dc9.legacy_power.switch{index:02d}", dark_mat, metal_mat, tick_mat)
        add_label(f"DC9_SW_LABEL_{index:02d}", interactive, f"PWR {index}", (loc[0], -0.91, loc[2] - 0.085), 0.035, tick_mat)

    annunciator = cube("DC9_ANNUNCIATOR_LEGACY_POWER_01", emissive, (0.64, -0.86, 0.92), (0.42, 0.04, 0.11), amber_mat)
    annunciator["game_id"] = "dc9.legacy_power.annunciator"
    annunciator["puzzle_id"] = "legacy_power"
    annunciator["interaction"] = "indicator"
    annunciator["emissive_state"] = "legacy_power_restored"
    mars = cylinder("DC9_HIDDEN_DESTINATION_LIGHT_PROXY_01", emissive, (-1.46, -0.84, 0.92), 0.035, 0.018, red_mat, 24)
    mars["game_id"] = "dc9.hidden_destination.light_proxy"
    mars["interaction"] = "easter_egg_hint_proxy"
    mars["future_scope"] = "Final hidden Mars trigger belongs in Airbus bonus level."

    add_route_card(props, card_mat, ink_mat)

    collider = cube("DC9_COLLIDER_LEGACY_POWER_SWITCHBANK_01", colliders, (-0.25, -0.86, 0.2), (0.72, 0.08, 0.55), dark_mat)
    collider.display_type = "WIRE"
    collider.hide_render = True
    collider["game_id"] = "dc9.legacy_power.switchbank.collider"
    collider["interaction"] = "hit_target"
    collider["puzzle_id"] = "legacy_power"

    for idx, x in enumerate([-0.5, -0.25, 0.0, 0.25, 0.5]):
        cube(f"DC9_OVERHEAD_SWITCH_ROW_{idx:02d}", static, (x, -0.18, 1.56), (0.055, 0.12, 0.16), metal_mat, (math.radians(7), 0, 0))

    camera = bpy.data.cameras.new("CAM_DC9_CAPTAIN_APPROVAL")
    camera.lens = 20
    camera.angle = math.radians(78)
    camera.clip_start = 0.01
    camera_obj = bpy.data.objects.new("CAM_DC9_CAPTAIN_APPROVAL", camera)
    bpy.context.scene.collection.objects.link(camera_obj)
    camera_obj.location = (-0.78, 1.58, 0.98)
    direction = Vector((-0.02, -1.02, 0.58)) - camera_obj.location
    camera_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera_obj.parent = locators
    bpy.context.scene.camera = camera_obj

    for name, loc, energy, size in [
        ("DC9_APPROVAL_AREA_LIGHT", (0, -0.15, 2.5), 420, 3.0),
        ("DC9_APPROVAL_PANEL_FILL", (-0.9, -0.42, 1.05), 90, 1.0),
        ("DC9_APPROVAL_GAUGE_GLINT", (-0.25, 0.2, 1.35), 45, 0.5),
    ]:
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy = energy
        light_data.size = size
        light = bpy.data.objects.new(name, light_data)
        bpy.context.scene.collection.objects.link(light)
        light.location = loc
        light.parent = locators

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT))
    print(f"Saved {OUTPUT}")


if __name__ == "__main__":
    create_scene()
