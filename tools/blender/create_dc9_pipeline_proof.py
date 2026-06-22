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
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = base[3]
        if emission and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission[0]
            bsdf.inputs["Emission Strength"].default_value = emission[1]
    mat.diffuse_color = base
    if base[3] < 1:
        mat.blend_method = "BLEND"
        mat.use_screen_refraction = True
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


def bevel(obj, amount: float = 0.015, segments: int = 2):
    modifier = obj.modifiers.new(f"{obj.name}_SOFT_BEVEL", "BEVEL")
    modifier.width = amount
    modifier.segments = segments
    modifier.affect = "EDGES"
    obj.modifiers.new(f"{obj.name}_WEIGHTED_NORMAL", "WEIGHTED_NORMAL")
    return obj


def soft_cube(name: str, parent, loc, scale, mat, rot=(0, 0, 0), bevel_amount: float = 0.018):
    return bevel(cube(name, parent, loc, scale, mat, rot), bevel_amount)


def cylinder(name: str, parent, loc, radius: float, depth: float, mat, vertices: int = 48, rot=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_MESH"
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = parent
    obj.data.materials.append(mat)
    obj.data.uv_layers.new(name="UVMap")
    obj.modifiers.new(f"{obj.name}_WEIGHTED_NORMAL", "WEIGHTED_NORMAL")
    return obj


def torus(name: str, parent, loc, mat, major=0.22, minor=0.018, rot=(math.pi / 2, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=72, minor_segments=12, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_MESH"
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = parent
    obj.data.materials.append(mat)
    obj.data.uv_layers.new(name="UVMap")
    obj.modifiers.new(f"{obj.name}_WEIGHTED_NORMAL", "WEIGHTED_NORMAL")
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


def add_gauge(parent, name: str, loc, radius: float, mat_bezel, mat_face, mat_glass, mat_tick, mat_needle, game_id: str | None = None, needle_angle: float = 0.0):
    cylinder(f"{name}_BEZEL", parent, loc, radius, 0.045, mat_bezel, 64)
    cylinder(f"{name}_FACE", parent, (loc[0], loc[1] + 0.028, loc[2]), radius * 0.82, 0.014, mat_face, 64)
    for idx in range(10):
        angle = math.radians(-135 + idx * 30)
        x = loc[0] + math.sin(angle) * radius * 0.62
        z = loc[2] + math.cos(angle) * radius * 0.62
        tick = cube(f"{name}_TICK_{idx:02d}", parent, (x, loc[1] + 0.046, z), (0.012, 0.01, 0.055), mat_tick, (0, angle, 0))
        tick["reference_role"] = "gauge_tick"
    for idx, angle_deg in enumerate([-45, 0, 45]):
        angle = math.radians(angle_deg)
        x = loc[0] + math.sin(angle) * radius * 0.28
        z = loc[2] + math.cos(angle) * radius * 0.28
        marker = cube(f"{name}_COLOR_ARC_{idx:02d}", parent, (x, loc[1] + 0.049, z), (0.014, 0.012, 0.035), mat_tick, (0, angle, 0))
        marker["reference_role"] = "gauge_color_band_placeholder"
    glass = cylinder(f"{name}_GLASS", parent, (loc[0], loc[1] + 0.055, loc[2]), radius * 0.78, 0.008, mat_glass, 64)
    glass["material_note"] = "Transparent-looking approval material; review glTF alpha before production."
    needle = cube(
        f"{name}_NEEDLE",
        parent,
        (loc[0], loc[1] + 0.068, loc[2] + radius * 0.19),
        (0.018, 0.014, radius * 0.82),
        mat_needle,
        (0, math.radians(needle_angle), 0),
    )
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
    soft_cube(f"{prefix}_YOKE_COLUMN_BLOCKOUT_01", parent, (x, -0.46, 0.12), (0.1, 0.18, 0.42), mat_dark, (math.radians(-6), 0, 0), 0.02)
    cylinder(f"{prefix}_YOKE_STEM_BLOCKOUT_01", parent, (x, -0.64, 0.37), 0.04, 0.34, mat_dark, 24, (math.radians(78), 0, 0))
    soft_cube(f"{prefix}_YOKE_TOP_BAR_01", parent, (x, -0.8, 0.64), (0.52, 0.07, 0.055), mat_grip, bevel_amount=0.025)
    soft_cube(f"{prefix}_YOKE_LEFT_GRIP_01", parent, (x - 0.27, -0.8, 0.51), (0.08, 0.08, 0.28), mat_grip, (0, 0, math.radians(-5)), 0.025)
    soft_cube(f"{prefix}_YOKE_RIGHT_GRIP_01", parent, (x + 0.27, -0.8, 0.51), (0.08, 0.08, 0.28), mat_grip, (0, 0, math.radians(5)), 0.025)
    soft_cube(f"{prefix}_YOKE_LOWER_BAR_01", parent, (x, -0.8, 0.39), (0.42, 0.06, 0.045), mat_grip, bevel_amount=0.018)
    soft_cube(f"{prefix}_YOKE_CENTER_PAD_01", parent, (x, -0.835, 0.51), (0.26, 0.075, 0.2), mat_grip, (0, 0, 0), 0.025)
    soft_cube(f"{prefix}_YOKE_CHECKLIST_PLACARD_01", parent, (x, -0.878, 0.51), (0.2, 0.014, 0.16), mat_dark, bevel_amount=0.006)


def add_yoke_checklist_lines(parent, prefix: str, x: float, mat_text):
    for idx, z in enumerate([0.555, 0.525, 0.495, 0.465]):
        cube(f"{prefix}_YOKE_CHECKLIST_LINE_{idx:02d}", parent, (x, -0.887, z), (0.13, 0.006, 0.008), mat_text)


def add_screws(parent, mat, positions):
    for idx, loc in enumerate(positions):
        obj = cylinder(f"DC9_PANEL_SCREW_{idx:02d}", parent, loc, 0.018, 0.01, mat, 18)
        obj["detail_role"] = "approval_scale_fastener"


def add_panel_seams(parent, mat):
    seams = [
        ("DC9_SEAM_CAPTAIN_VERTICAL_01", (-0.44, -0.812, 0.54), (0.012, 0.018, 0.78)),
        ("DC9_SEAM_CENTER_VERTICAL_01", (0.56, -0.812, 0.54), (0.012, 0.018, 0.78)),
        ("DC9_SEAM_CAPTAIN_HORIZONTAL_01", (-0.98, -0.811, 0.31), (1.02, 0.018, 0.012)),
        ("DC9_SEAM_FIRST_OFFICER_HORIZONTAL_01", (1.02, -0.811, 0.31), (1.02, 0.018, 0.012)),
        ("DC9_SEAM_CENTER_TOP_01", (0.14, -0.811, 0.92), (0.76, 0.018, 0.012)),
    ]
    for name, loc, scale in seams:
        cube(name, parent, loc, scale, mat)


def add_instrument_labels(parent, mat):
    labels = [
        ("DC9_GAUGE_LABEL_IAS", "IAS", (-1.26, -0.842, 0.545)),
        ("DC9_GAUGE_LABEL_ALT", "ALT", (-0.98, -0.842, 0.545)),
        ("DC9_GAUGE_LABEL_HDG", "HDG", (-0.7, -0.842, 0.545)),
        ("DC9_GAUGE_LABEL_VSI", "V/S", (-1.26, -0.842, 0.275)),
        ("DC9_GAUGE_LABEL_ADF", "ADF", (-0.98, -0.842, 0.275)),
        ("DC9_GAUGE_LABEL_RMI", "RMI", (-0.7, -0.842, 0.275)),
        ("DC9_GAUGE_LABEL_EPR", "EPR", (0.0, -0.842, 0.61)),
        ("DC9_GAUGE_LABEL_N1", "N1", (0.28, -0.842, 0.61)),
        ("DC9_GAUGE_LABEL_EGT", "EGT", (0.0, -0.842, 0.34)),
        ("DC9_GAUGE_LABEL_FF", "F/F", (0.28, -0.842, 0.34)),
        ("DC9_GAUGE_LABEL_DC", "DC", (0.75, -0.842, 0.545)),
        ("DC9_GAUGE_LABEL_AC", "AC", (1.03, -0.842, 0.545)),
        ("DC9_GAUGE_LABEL_HYD", "HYD", (1.31, -0.842, 0.545)),
    ]
    for name, text, loc in labels:
        add_label(name, parent, text, loc, 0.026, mat, (math.radians(90), 0, math.radians(180)))


def add_annunciator_bank(parent, mat_housing, mat_amber, mat_green, mat_text):
    housing = soft_cube("DC9_ANNUNCIATOR_BANK_HOUSING_01", parent, (0.98, -0.835, 0.93), (0.52, 0.032, 0.18), mat_housing, bevel_amount=0.005)
    housing["detail_role"] = "noninteractive_annunciator_bank"
    for row, z in enumerate([0.965, 0.91]):
        for col, x in enumerate([0.78, 0.91, 1.04, 1.17]):
            mat = mat_green if (row + col) % 3 == 0 else mat_amber
            lamp = soft_cube(f"DC9_ANNUNCIATOR_BANK_LAMP_{row:02d}_{col:02d}", parent, (x, -0.86, z), (0.095, 0.018, 0.034), mat, bevel_amount=0.004)
            lamp["detail_role"] = "noninteractive_annunciator_lamp"
    add_label("DC9_ANNUNCIATOR_BANK_LABEL_01", parent, "SYS", (0.98, -0.872, 0.985), 0.024, mat_text)


def add_forward_overhead_face(parent, mat_panel, mat_switch, mat_amber, mat_label):
    face = soft_cube("DC9_FORWARD_OVERHEAD_FACE_01", parent, (0, -1.02, 1.34), (1.9, 0.08, 0.18), mat_panel, (math.radians(-8), 0, 0), 0.012)
    face["detail_role"] = "visible_forward_overhead_reference_band"
    for row, z in enumerate([1.375, 1.32]):
        for col, x in enumerate([-0.72, -0.48, -0.24, 0.0, 0.24, 0.48, 0.72]):
            cylinder(f"DC9_FORWARD_OVERHEAD_KNOB_{row:02d}_{col:02d}", parent, (x, -0.965, z), 0.025, 0.035, mat_switch, 18, (math.pi / 2, 0, 0))
    for idx, x in enumerate([-0.54, -0.18, 0.18, 0.54]):
        soft_cube(f"DC9_FORWARD_OVERHEAD_AMBER_WINDOW_{idx:02d}", parent, (x, -0.958, 1.275), (0.14, 0.012, 0.03), mat_amber, bevel_amount=0.004)
    add_label("DC9_FORWARD_OVERHEAD_LABEL_01", parent, "OVHD", (0, -0.952, 1.43), 0.03, mat_label, (math.radians(82), 0, math.radians(180)))


def add_circuit_breaker_rows(parent, mat_knob, mat_panel, mat_mark):
    soft_cube("DC9_CAPTAIN_SIDE_BREAKER_PANEL_01", parent, (-1.72, -0.62, 0.38), (0.34, 0.05, 0.52), mat_panel, (0, 0, math.radians(-4)), 0.012)
    for row, z in enumerate([0.55, 0.47, 0.39, 0.31, 0.23]):
        for col, x in enumerate([-1.82, -1.72, -1.62]):
            cylinder(f"DC9_CAPTAIN_SIDE_BREAKER_{row:02d}_{col:02d}", parent, (x, -0.66, z), 0.018, 0.024, mat_knob, 16)
    add_label("DC9_CAPTAIN_SIDE_BREAKER_LABEL_01", parent, "CB", (-1.72, -0.685, 0.62), 0.028, mat_mark, (math.radians(92), 0, math.radians(-4)))


def add_window_depth(parent, mat_frame, mat_glass):
    panes = [
        ("DC9_WINDSHIELD_LEFT_GLASS_01", (-0.68, -1.535, 0.85), (0.92, 0.018, 0.54), (0, 0, math.radians(-4))),
        ("DC9_WINDSHIELD_RIGHT_GLASS_01", (0.68, -1.535, 0.85), (0.92, 0.018, 0.54), (0, 0, math.radians(4))),
    ]
    for name, loc, scale, rot in panes:
        obj = cube(name, parent, loc, scale, mat_glass, rot)
        obj["detail_role"] = "approval_window_glass"
    soft_cube("DC9_WINDSHIELD_UPPER_SHADOW_LIP_01", parent, (0, -1.485, 1.38), (2.0, 0.08, 0.07), mat_frame, bevel_amount=0.012)
    soft_cube("DC9_WINDSHIELD_LOWER_SHADOW_LIP_01", parent, (0, -1.485, 0.49), (2.25, 0.08, 0.055), mat_frame, bevel_amount=0.01)


def add_sidewall_depth(parent, mat_shell, mat_dark, mat_wear):
    soft_cube("DC9_LEFT_SIDEWALL_RIB_FORWARD_01", parent, (-1.93, -0.95, 0.7), (0.055, 0.08, 1.0), mat_dark, bevel_amount=0.01)
    soft_cube("DC9_LEFT_SIDEWALL_RIB_AFT_01", parent, (-1.93, 0.38, 0.58), (0.055, 0.08, 0.82), mat_dark, bevel_amount=0.01)
    soft_cube("DC9_LEFT_SIDE_WINDOW_SILL_01", parent, (-1.92, -0.22, 0.82), (0.08, 1.16, 0.06), mat_shell, bevel_amount=0.01)
    soft_cube("DC9_LEFT_ARMREST_SHADOW_01", parent, (-1.75, -0.02, 0.1), (0.38, 1.0, 0.11), mat_dark, bevel_amount=0.018)
    for idx, y in enumerate([-0.72, -0.18, 0.36]):
        soft_cube(f"DC9_LEFT_SIDEWALL_WEAR_STRIP_{idx:02d}", parent, (-1.875, y, 0.98), (0.012, 0.34, 0.018), mat_wear, bevel_amount=0.002)


def add_panel_wear(parent, mat_wear, mat_shadow):
    wear_marks = [
        ("DC9_PANEL_EDGE_WEAR_CAPT_TOP_01", (-0.98, -0.806, 0.865), (0.86, 0.012, 0.012)),
        ("DC9_PANEL_EDGE_WEAR_CENTER_01", (0.17, -0.806, 0.87), (0.44, 0.012, 0.01)),
        ("DC9_PANEL_EDGE_WEAR_PEDESTAL_01", (0.0, -0.76, 0.455), (0.55, 0.012, 0.012)),
        ("DC9_PANEL_EDGE_WEAR_FO_TOP_01", (1.03, -0.806, 0.865), (0.86, 0.012, 0.012)),
    ]
    for name, loc, scale in wear_marks:
        cube(name, parent, loc, scale, mat_wear)
    for idx, loc in enumerate([(-1.36, -0.807, 0.82), (-0.56, -0.807, 0.64), (0.46, -0.807, 0.74), (1.42, -0.807, 0.3)]):
        cube(f"DC9_PANEL_GRIME_SHADOW_{idx:02d}", parent, loc, (0.11, 0.01, 0.024), mat_shadow, (0, math.radians((idx - 1) * 12), 0))


def add_lower_panel_controls(parent, mat_knob, mat_mark, mat_placard):
    for idx, x in enumerate([-1.38, -1.22, -1.06, -0.9, -0.74, 0.72, 0.88, 1.04, 1.2, 1.36]):
        cylinder(f"DC9_LOWER_PANEL_KNOB_{idx:02d}", parent, (x, -0.835, 0.2), 0.035, 0.032, mat_knob, 24)
        cube(f"DC9_LOWER_PANEL_MARK_{idx:02d}", parent, (x, -0.862, 0.25), (0.006, 0.012, 0.045), mat_mark, (0, math.radians((idx % 5 - 2) * 18), 0))
    for idx, x in enumerate([-1.14, -0.92, 0.92, 1.14]):
        soft_cube(f"DC9_LOWER_PANEL_PLACARD_{idx:02d}", parent, (x, -0.84, 0.105), (0.18, 0.018, 0.045), mat_placard, bevel_amount=0.004)


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

    panel_mat = material("DC9_PANEL_BLUE_GREY", (0.135, 0.285, 0.305, 1), 0.86, 0.02)
    panel_dark = material("DC9_PANEL_DARK_BLUE_GREY", (0.045, 0.075, 0.085, 1), 0.82, 0.04)
    shell_mat = material("DC9_SHELL_WARM_GREY", (0.28, 0.29, 0.27, 1), 0.78)
    dark_mat = material("DC9_DARK_BEZEL", (0.025, 0.028, 0.027, 1), 0.58, 0.2)
    glass_mat = material("DC9_GAUGE_GLASS", (0.11, 0.15, 0.16, 0.38), 0.12)
    window_glass_mat = material("DC9_TINTED_WINDOW_GLASS", (0.16, 0.27, 0.3, 0.24), 0.18)
    face_mat = material("DC9_GAUGE_FACE_BLACK", (0.01, 0.012, 0.011, 1), 0.7)
    tick_mat = material("DC9_WARM_INSTRUMENT_MARKS", (0.86, 0.82, 0.68, 1), 0.65)
    white_mat = material("DC9_NEEDLE_WARM_WHITE", (0.92, 0.87, 0.72, 1), 0.42)
    grip_mat = material("DC9_YOKE_WORN_BLACK", (0.035, 0.032, 0.028, 1), 0.86, 0.04)
    metal_mat = material("DC9_SWITCH_BRUSHED_METAL", (0.48, 0.47, 0.42, 1), 0.44, 0.45)
    card_mat = material("DC9_ROUTE_CARD_OFF_WHITE", (0.86, 0.8, 0.63, 1), 0.88)
    ink_mat = material("DC9_ROUTE_CARD_INK", (0.05, 0.07, 0.08, 1), 0.8)
    screw_mat = material("DC9_DULL_SCREW_HEADS", (0.42, 0.43, 0.39, 1), 0.58, 0.6)
    placard_mat = material("DC9_BLACK_PLACARD", (0.015, 0.018, 0.017, 1), 0.7, 0.05)
    wear_mat = material("DC9_WORN_EDGE_HIGHLIGHT", (0.62, 0.64, 0.56, 1), 0.72, 0.08)
    grime_mat = material("DC9_SOFT_GRIME_SHADOW", (0.018, 0.026, 0.025, 1), 0.92)
    amber_mat = material("DC9_ANNUNCIATOR_AMBER_EMISSIVE", (1.0, 0.46, 0.08, 1), 0.35, emission=((1.0, 0.39, 0.05, 1), 1.8))
    green_mat = material("DC9_ANNUNCIATOR_GREEN_EMISSIVE", (0.18, 0.68, 0.3, 1), 0.42, emission=((0.09, 0.75, 0.22, 1), 1.1))
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
    soft_cube("DC9_COCKPIT_SHELL_FLOOR_01", static, (0, 0.08, -0.32), (3.95, 3.35, 0.08), shell_mat, bevel_amount=0.025)
    soft_cube("DC9_COCKPIT_SHELL_LEFT_WALL_01", static, (-2.02, 0.1, 0.68), (0.08, 3.15, 1.88), shell_mat, bevel_amount=0.018)
    soft_cube("DC9_COCKPIT_SHELL_RIGHT_WALL_01", static, (2.02, 0.1, 0.68), (0.08, 3.15, 1.88), shell_mat, bevel_amount=0.018)
    soft_cube("DC9_COCKPIT_SHELL_CEILING_01", static, (0, 0.0, 1.64), (3.78, 3.0, 0.08), shell_mat, bevel_amount=0.018)
    soft_cube("DC9_WINDSHIELD_CENTER_POST_01", static, (0, -1.48, 0.98), (0.08, 0.09, 1.16), dark_mat, bevel_amount=0.012)
    soft_cube("DC9_WINDSHIELD_LEFT_FRAME_01", static, (-0.78, -1.5, 1.08), (0.86, 0.08, 0.08), dark_mat, (0, 0, math.radians(-7)), 0.012)
    soft_cube("DC9_WINDSHIELD_RIGHT_FRAME_01", static, (0.78, -1.5, 1.08), (0.86, 0.08, 0.08), dark_mat, (0, 0, math.radians(7)), 0.012)
    soft_cube("DC9_WINDOW_LEFT_LOWER_FRAME_01", static, (-1.15, -1.48, 0.62), (0.62, 0.08, 0.06), dark_mat, (0, 0, math.radians(8)), 0.01)
    soft_cube("DC9_WINDOW_RIGHT_LOWER_FRAME_01", static, (1.15, -1.48, 0.62), (0.62, 0.08, 0.06), dark_mat, (0, 0, math.radians(-8)), 0.01)
    add_window_depth(static, dark_mat, window_glass_mat)
    add_sidewall_depth(static, shell_mat, dark_mat, wear_mat)

    soft_cube("DC9_MAIN_PANEL_BLOCKOUT_01", static, (0, -1.0, 0.42), (3.1, 0.16, 1.03), panel_mat, bevel_amount=0.025)
    soft_cube("DC9_CAPTAIN_PANEL_SHADOW_BROW_01", static, (-0.86, -1.115, 0.95), (1.05, 0.18, 0.16), panel_dark, bevel_amount=0.018)
    soft_cube("DC9_CENTER_ENGINE_PANEL_BLOCKOUT_01", static, (0.12, -1.105, 0.58), (0.72, 0.08, 0.7), panel_dark, bevel_amount=0.018)
    soft_cube("DC9_GLARESHIELD_BLOCKOUT_01", static, (0, -1.21, 1.04), (3.25, 0.48, 0.18), dark_mat, bevel_amount=0.03)
    soft_cube("DC9_CENTER_PEDESTAL_BLOCKOUT_01", static, (0, -0.18, 0.03), (0.78, 1.26, 0.38), panel_mat, bevel_amount=0.025)
    soft_cube("DC9_CENTER_PEDESTAL_SIDE_SHADOW_01", static, (-0.44, -0.18, 0.02), (0.05, 1.18, 0.33), panel_dark, bevel_amount=0.012)
    soft_cube("DC9_CENTER_PEDESTAL_SIDE_SHADOW_02", static, (0.44, -0.18, 0.02), (0.05, 1.18, 0.33), panel_dark, bevel_amount=0.012)
    soft_cube("DC9_OVERHEAD_PANEL_BLOCKOUT_01", static, (0, -0.2, 1.47), (1.5, 1.08, 0.08), panel_mat, bevel_amount=0.018)
    add_forward_overhead_face(static, placard_mat, metal_mat, amber_mat, tick_mat)
    soft_cube("DC9_PEDESTAL_THROTTLE_SLOT_01", static, (0, -0.39, 0.26), (0.5, 0.7, 0.035), dark_mat, bevel_amount=0.01)
    add_panel_seams(static, placard_mat)
    add_panel_wear(static, wear_mat, grime_mat)
    for x in [-0.16, 0.0, 0.16]:
        soft_cube(f"DC9_THROTTLE_LEVER_BLOCKOUT_{int((x + 1) * 100):03d}", static, (x, -0.51, 0.48), (0.045, 0.08, 0.38), metal_mat, (math.radians(-18), 0, 0), 0.012)
        cylinder(f"DC9_THROTTLE_KNOB_BLOCKOUT_{int((x + 1) * 100):03d}", static, (x, -0.59, 0.68), 0.05, 0.075, grip_mat, 24, (math.pi / 2, 0, 0))
    for idx, x in enumerate([-0.31, -0.21, -0.11, 0.11, 0.21, 0.31]):
        soft_cube(f"DC9_THROTTLE_GATE_NOTCH_{idx:02d}", static, (x, -0.34, 0.505), (0.025, 0.18, 0.026), placard_mat, bevel_amount=0.003)

    add_yoke(static, "DC9_CAPTAIN", -0.86, dark_mat, grip_mat)
    add_yoke(static, "DC9_FIRST_OFFICER", 0.92, dark_mat, grip_mat)
    add_yoke_checklist_lines(static, "DC9_CAPTAIN", -0.86, tick_mat)
    add_yoke_checklist_lines(static, "DC9_FIRST_OFFICER", 0.92, tick_mat)
    soft_cube("DC9_PANEL_PLACARD_CAPTAIN_01", static, (-0.95, -0.82, 0.93), (0.36, 0.025, 0.06), placard_mat, bevel_amount=0.006)
    soft_cube("DC9_PANEL_PLACARD_CENTER_01", static, (0.2, -0.82, 0.94), (0.42, 0.025, 0.055), placard_mat, bevel_amount=0.006)
    add_label("DC9_PANEL_LABEL_CAPTAIN", static, "CAPT", (-0.95, -0.842, 0.93), 0.032, tick_mat)
    add_label("DC9_PANEL_LABEL_CENTER", static, "ENG", (0.2, -0.842, 0.94), 0.032, tick_mat)
    add_annunciator_bank(static, placard_mat, amber_mat, green_mat, tick_mat)
    add_circuit_breaker_rows(static, dark_mat, panel_dark, tick_mat)

    gauge_positions = [
        (-1.26, -0.895, 0.7), (-0.98, -0.895, 0.7), (-0.7, -0.895, 0.7),
        (-1.26, -0.895, 0.43), (-0.98, -0.895, 0.43), (-0.7, -0.895, 0.43),
        (0.0, -0.895, 0.76), (0.28, -0.895, 0.76), (0.0, -0.895, 0.49), (0.28, -0.895, 0.49),
        (0.75, -0.895, 0.7), (1.03, -0.895, 0.7), (1.31, -0.895, 0.7),
        (0.75, -0.895, 0.43), (1.03, -0.895, 0.43), (1.31, -0.895, 0.43),
    ]
    for idx, pos in enumerate(gauge_positions):
        radius = 0.118 if idx not in {0, 1, 2, 10, 11, 12} else 0.13
        needle_angle = [-28, 12, -8, 34, -18, 22, -42, 16, 8, -24, 30, -12, 18, -32, 26, -6][idx]
        add_gauge(static, f"DC9_ANALOG_GAUGE_{idx:02d}", pos, radius, dark_mat, face_mat, glass_mat, tick_mat, white_mat, needle_angle=needle_angle)
    add_gauge(static, "DC9_GAUGE_LEGACY_CODE_01", (-1.26, -0.83, 0.7), 0.1, dark_mat, face_mat, glass_mat, tick_mat, white_mat, "dc9.legacy_power.gauge")
    add_instrument_labels(static, tick_mat)

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
    for idx, x in enumerate([-0.32, -0.12, 0.08, 0.28]):
        cylinder(f"DC9_PEDESTAL_RADIO_KNOB_{idx:02d}", static, (x, -0.03, 0.27), 0.038, 0.035, dark_mat, 24)
        soft_cube(f"DC9_PEDESTAL_RADIO_SLOT_{idx:02d}", static, (x, 0.06, 0.22), (0.12, 0.025, 0.035), placard_mat, bevel_amount=0.004)
    for row, y in enumerate([0.22, 0.34]):
        for col, x in enumerate([-0.27, -0.09, 0.09, 0.27]):
            soft_cube(f"DC9_PEDESTAL_RADIO_FACE_{row:02d}_{col:02d}", static, (x, y, 0.245), (0.11, 0.026, 0.04), placard_mat, bevel_amount=0.004)
            add_label(f"DC9_PEDESTAL_RADIO_LABEL_{row:02d}_{col:02d}", static, f"{row + 1}{col + 1}", (x, y - 0.023, 0.247), 0.022, tick_mat, (math.radians(92), 0, 0))
    add_lower_panel_controls(static, dark_mat, tick_mat, placard_mat)

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

    for row, y in enumerate([-0.42, -0.22, -0.02, 0.18]):
        for col, x in enumerate([-0.55, -0.35, -0.15, 0.05, 0.25, 0.45]):
            soft_cube(f"DC9_OVERHEAD_SWITCH_ROW_{row:02d}_{col:02d}", static, (x, y, 1.56), (0.045, 0.1, 0.12), metal_mat, (math.radians(7), 0, 0), 0.008)

    camera = bpy.data.cameras.new("CAM_DC9_CAPTAIN_APPROVAL")
    camera.lens = 20
    camera.angle = math.radians(74)
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
