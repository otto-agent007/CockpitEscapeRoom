"""Build the owner-review DC-9 first-officer cockpit from the cleared OBJ8 source.

Run with Blender opening the donor evaluation blend, for example:

    blender --background --disable-autoexec dc9-obj8-evaluation.blend \
      --python tools/blender/build_dc9_production.py

The script imports the donor's native instrument and control geometry in a deterministic
parked pose, applies a restrained presentation correction to the donor cockpit atlas,
creates stable runtime groups and first-officer cameras, packs source images, and saves
art-source/blender/dc9_master.blend.
"""

from __future__ import annotations

import math
import json
import sys
from collections import deque
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.blender.cockpit_pipeline.xplane_obj8_blender_import import add_source_object
from tools.blender.cockpit_pipeline.xplane_obj8_convert import load_pose, parse_obj8, partition_draw_ranges
from tools.blender.import_dc9_golden_key import import_golden_key


OUTPUT_BLEND = REPO_ROOT / "art-source" / "blender" / "dc9_master.blend"
SOURCE_DIR = (
    REPO_ROOT
    / ".cache"
    / "cockpit-pipeline"
    / "sources"
    / "DC-9-30-xplane-unfinished"
    / "extracted"
    / "DC9-32"
)
POSE_PATH = REPO_ROOT / "art-source" / "blender" / "dc9_parked_neutral_pose.json"
INTERACTION_MAP_PATH = REPO_ROOT / "art-source" / "blender" / "dc9_interaction_map.json"
SOURCE_OBJECTS = (
    SOURCE_DIR / "objects" / "DC9panel.obj",
    SOURCE_DIR / "objects" / "DC9vc1.obj",
    SOURCE_DIR / "objects" / "DC9vc2.obj",
    SOURCE_DIR / "objects" / "Glass.obj",
    SOURCE_DIR / "DC9-32_cockpit.obj",
)
ATLAS_PATH = (
    REPO_ROOT
    / ".cache"
    / "cockpit-pipeline"
    / "sources"
    / "DC-9-30-xplane-unfinished"
    / "extracted"
    / "DC9-32"
    / "DC9-32_cockpit.png"
)

PANEL_SLOPE_X = -math.atan(0.25)
ATLAS_WIDTH = 2048.0
ATLAS_HEIGHT = 2048.0
COCKPIT_OBJECT = SOURCE_DIR / "DC9-32_cockpit.obj"
INTERACTION_CONTRACT = json.loads(INTERACTION_MAP_PATH.read_text(encoding="utf-8"))
INTERACTION_MAP = INTERACTION_CONTRACT["controls"]
ROUTES = INTERACTION_CONTRACT["routeCard"]["rows"]
VERIFIED_ROUTES = set(INTERACTION_CONTRACT["routeCard"]["verifiedRoutes"])


def remove_object(name: str) -> None:
    obj = bpy.data.objects.get(name)
    if obj is not None:
        bpy.data.objects.remove(obj, do_unlink=True)


def make_empty(name: str, parent: bpy.types.Object | None = None) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.08
    obj.parent = parent
    return obj


def make_principled_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    metallic: float = 0.0,
    roughness: float = 0.6,
) -> bpy.types.Material:
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    principled = next(node for node in nodes if node.type == "BSDF_PRINCIPLED")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    if color[3] < 1.0 and hasattr(material, "surface_render_method"):
        material.surface_render_method = "DITHERED"
    return material


def make_box(name: str, parent: bpy.types.Object, center: tuple[float, float, float], size: tuple[float, float, float], material: bpy.types.Material | None = None) -> bpy.types.Object:
    cx, cy, cz = center
    sx, sy, sz = (axis / 2.0 for axis in size)
    vertices = [
        (x * sx, y * sy, z * sz)
        for x, y, z in ((-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1))
    ]
    faces = ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (4, 0, 3, 7))
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(vertices, [], faces)
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop in mesh.loops:
        vertex = mesh.vertices[loop.vertex_index].co
        uv_layer.data[loop.index].uv = ((vertex.x + sx) / max(size[0], 0.001), (vertex.z + sz) / max(size[2], 0.001))
    if material is not None:
        mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = center
    return obj


def create_interaction_contract(root: bpy.types.Object, pose: dict[str, float]) -> set[int]:
    interactive = make_empty("DC9_INTERACTIVE", root)
    colliders = make_empty("DC9_COLLIDERS", root)
    emissive = make_empty("DC9_EMISSIVE", root)
    props = make_empty("DC9_PUZZLE_PROPS", root)
    emissive["runtime_role"] = "restrained_instrument_emissive_group"
    collider_material = make_principled_material("MAT_DC9_COLLIDER", (0.0, 0.0, 0.0, 0.0), roughness=1.0)

    parsed = parse_obj8(COCKPIT_OBJECT, pose)
    all_selected: set[int] = set()
    pivot_by_dataref: dict[str, tuple[float, float, float]] = {}
    for draw in parsed.draws:
        for channel in draw.animation_channels:
            if channel.dataref and channel.pivot is not None:
                pivot_by_dataref.setdefault(channel.dataref, channel.pivot)

    for control_id, contract in INTERACTION_MAP.items():
        selected, _ = partition_draw_ranges(parsed, {contract["dataref"]})
        if not selected:
            raise RuntimeError(f"No OBJ8 draw ranges found for {contract['dataref']}")
        selected_set = set(selected)
        if all_selected.intersection(selected_set):
            raise RuntimeError(f"Interactive OBJ8 draw ranges overlap for {control_id}")
        all_selected.update(selected_set)
        pivot_location = pivot_by_dataref.get(contract["dataref"])
        if pivot_location is None:
            raise RuntimeError(f"No OBJ8 pivot found for {contract['dataref']}")

        pivot = make_empty(contract["node"], interactive)
        pivot.location = pivot_location
        pivot["game_id"] = contract["game_id"]
        pivot["interaction"] = contract["interaction"]
        pivot["control_id"] = control_id
        pivot["source_dataref"] = contract["dataref"]
        pivot["rotation_axis"] = contract["axis"]
        pivot["initial_value"] = contract["initial"]
        pivot["target_value"] = contract["target"]
        pivot["procedure_step"] = contract["procedureStep"]
        pivot["initial_state"] = "on" if control_id != "apuMaster" else "run"
        pivot["target_state"] = "off"
        pivot["source_draw_range_indices"] = ",".join(str(index) for index in selected)
        if selected != contract["sourceDrawRangeIndices"]:
            raise RuntimeError(
                f"Interaction map drift for {control_id}: expected {contract['sourceDrawRangeIndices']}, got {selected}"
            )

        source_root_name = f"{contract['node']}_SOURCE"
        add_source_object(
            COCKPIT_OBJECT,
            pose,
            pivot,
            include_draw_indices=selected_set,
            root_name=source_root_name,
        )
        source_root = bpy.data.objects[source_root_name]
        source_root.location = tuple(-value for value in pivot_location)

        collider = make_box(
            f"DC9_HITBOX_{control_id.upper()}",
            colliders,
            pivot_location,
            (0.46 if control_id == "apuBuses" else 0.26, 0.22, 0.24),
            collider_material,
        )
        collider["collider_only"] = True
        collider["collider_target_game_id"] = contract["game_id"]
        collider["accessible_label"] = contract["label"]

    card_material = make_principled_material("MAT_DC9_ROUTE_CARD", (0.78, 0.73, 0.58, 1.0), roughness=0.82)
    line_material = make_principled_material("MAT_DC9_ROUTE_CARD_LINE", (0.10, 0.14, 0.15, 1.0), roughness=0.70)
    # Mount the narrow route strip to the camera-facing center pad of the
    # first-officer yoke. The imported FO yoke handles are
    # OBJ8_DC9VC2_RANGE_015, while pitch-range OBJ8_DC9VC2_RANGE_014 contains
    # the column/pad whose horizontal center is x=0.4973 and whose front face
    # reaches y=-2.754. Place the card just in front of that face.
    card_center = (0.4973, -2.775, 0.27)
    board = make_box("DC9_PROP_MEM_ROUTE_CARD", props, card_center, (0.10, 0.012, 0.15), card_material)
    board["game_id"] = "dc9.route.card"
    board["interaction"] = "container"
    board["mounted_to_source"] = "OBJ8_DC9VC2_RANGE_014"
    board["seat_role"] = "first_officer"
    board["route_origin"] = "MEM"
    board["timetable_date"] = "1995-06-01"
    for index, route in enumerate(ROUTES):
        code = route["code"]
        city = route["city"]
        mileage = route["periodMileage"]
        z = 0.3245 - index * 0.017
        row = make_empty(f"DC9_ROUTE_ROW_{code}", props)
        row.location = (card_center[0], -2.783, z)
        row["game_id"] = f"dc9.route.{code}"
        row["interaction"] = "toggle"
        row["route_code"] = code
        row["route_city"] = city
        row["period_mileage"] = mileage
        row["origin"] = "MEM"
        row["verified_dc9_answer"] = code in VERIFIED_ROUTES
        make_box(f"DC9_ROUTE_ROW_{code}_LINE", row, (0.0, 0.0, 0.0), (0.092, 0.006, 0.014), line_material)
        collider = make_box(f"DC9_HITBOX_ROUTE_{code}", colliders, (card_center[0], -2.795, z), (0.10, 0.06, 0.015), collider_material)
        collider["collider_only"] = True
        collider["collider_target_game_id"] = f"dc9.route.{code}"

    submit = make_empty("DC9_ROUTE_SUBMIT", props)
    submit.location = (card_center[0], -2.783, 0.2175)
    submit["game_id"] = "dc9.route.submit"
    submit["interaction"] = "submit"
    submit["accessible_label"] = "Verify selected MEM routes"
    make_box("DC9_ROUTE_SUBMIT_PLATE", submit, (0.0, 0.0, 0.0), (0.092, 0.006, 0.018), line_material)
    submit_collider = make_box("DC9_HITBOX_ROUTE_SUBMIT", colliders, (card_center[0], -2.795, 0.2175), (0.10, 0.06, 0.020), collider_material)
    submit_collider["collider_only"] = True
    submit_collider["collider_target_game_id"] = "dc9.route.submit"
    return all_selected


def tune_source_materials() -> None:
    recipes = {
        "OBJ8_DC9panel_DAY": (0.72, 0.0),
        "OBJ8_DC9vc1_DAY": (0.63, 0.0),
        "OBJ8_DC9vc2_DAY": (0.62, 0.0),
        "OBJ8_Glass_DAY": (0.18, 0.0),
        "OBJ8_DC9-32_cockpit_DAY": (0.52, 0.0),
    }
    for name, (roughness, metallic) in recipes.items():
        material = bpy.data.materials.get(name)
        if material is None or not material.use_nodes:
            continue
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled is None:
            continue
        principled.inputs["Roughness"].default_value = roughness
        principled.inputs["Metallic"].default_value = metallic
        if "Specular IOR Level" in principled.inputs:
            principled.inputs["Specular IOR Level"].default_value = 0.32

    # The native cockpit atlas carries the correct Roger2009 instrument layout, but its
    # old X-Plane day texture reads strongly olive in a modern color-managed render.
    # Correct a packed copy of the source pixels rather than relying on unsupported
    # shader nodes, so the Blender approval render and exported glTF stay identical.
    cockpit_material = bpy.data.materials.get("OBJ8_DC9-32_cockpit_DAY")
    if cockpit_material is None or not cockpit_material.use_nodes:
        return
    nodes = cockpit_material.node_tree.nodes
    texture = next((node for node in nodes if node.type == "TEX_IMAGE" and node.image is not None), None)
    if texture is None:
        return
    source_image = texture.image
    width, height = source_image.size
    source_pixels = np.empty(width * height * 4, dtype=np.float32)
    source_image.pixels.foreach_get(source_pixels)
    rgba = source_pixels.reshape((height, width, 4))
    rgb = rgba[:, :, :3]
    channel_min = rgb.min(axis=2)
    channel_max = rgb.max(axis=2)
    near_white = (channel_min > 0.72) & ((channel_max - channel_min) < 0.12)
    transparent_background = np.zeros((height, width), dtype=np.bool_)
    pending: deque[tuple[int, int]] = deque()
    for y in range(height):
        if near_white[y, 0]:
            pending.append((0, y))
        if near_white[y, width - 1]:
            pending.append((width - 1, y))
    for x in range(width):
        if near_white[0, x]:
            pending.append((x, 0))
        if near_white[height - 1, x]:
            pending.append((x, height - 1))

    # Scanline flood fill removes only near-white atlas padding connected to the
    # image edge. Enclosed white instrument lettering and painted controls remain.
    while pending:
        x, y = pending.popleft()
        if transparent_background[y, x] or not near_white[y, x]:
            continue
        left = x
        while left > 0 and near_white[y, left - 1] and not transparent_background[y, left - 1]:
            left -= 1
        right = x
        while right + 1 < width and near_white[y, right + 1] and not transparent_background[y, right + 1]:
            right += 1
        transparent_background[y, left : right + 1] = True
        for adjacent_y in (y - 1, y + 1):
            if adjacent_y < 0 or adjacent_y >= height:
                continue
            span = near_white[adjacent_y, left : right + 1] & ~transparent_background[adjacent_y, left : right + 1]
            starts = np.flatnonzero(span & np.concatenate(([True], ~span[:-1])))
            for offset in starts:
                pending.append((left + int(offset), adjacent_y))

    rgba[:, :, 3][transparent_background] = 0.0
    luminance = (
        rgb[:, :, 0] * 0.2126
        + rgb[:, :, 1] * 0.7152
        + rgb[:, :, 2] * 0.0722
    )[:, :, np.newaxis]
    rgb[:, :, :] = np.clip((luminance + (rgb - luminance) * 0.45) * 0.68, 0.0, 1.0)

    corrected = bpy.data.images.new(
        "DC9_NATIVE_ATLAS_NEUTRAL",
        width=width,
        height=height,
        alpha=True,
    )
    corrected.colorspace_settings.name = source_image.colorspace_settings.name
    corrected.pixels.foreach_set(source_pixels)
    corrected.pack()
    corrected["source_image"] = "DC9-32_cockpit.png"
    corrected["correction"] = (
        "edge-connected white padding masked; neutral-presentation saturation=0.45 value=0.68"
    )
    texture.image = corrected


def normalize_donor_image_profiles() -> None:
    """Re-encode cleared donor atlases from pixels so glTF receives profile-neutral PNGs."""
    for image_name in ("DC9panel.png", "DC9vc1.png", "DC9vc2.png", "Glass.png"):
        source_image = bpy.data.images.get(image_name)
        if source_image is None:
            continue
        width, height = source_image.size
        pixels = np.empty(width * height * 4, dtype=np.float32)
        source_image.pixels.foreach_get(pixels)
        normalized = bpy.data.images.new(
            f"{image_name}_PROFILE_NORMALIZED",
            width=width,
            height=height,
            alpha=True,
            float_buffer=False,
        )
        normalized.colorspace_settings.name = source_image.colorspace_settings.name
        normalized.pixels.foreach_set(pixels)
        normalized.pack()
        normalized["source_image"] = source_image.name
        normalized["normalization"] = "profile-neutral packed PNG from source pixels"
        for material in bpy.data.materials:
            if not material.use_nodes:
                continue
            for node in material.node_tree.nodes:
                if node.type == "TEX_IMAGE" and node.image == source_image:
                    node.image = normalized


_atlas_pixels: list[float] | None = None
_atlas_image: bpy.types.Image | None = None
_crop_materials: dict[tuple[int, int, int, int], bpy.types.Material] = {}


def load_atlas_pixels() -> tuple[bpy.types.Image, list[float]]:
    global _atlas_image, _atlas_pixels
    if _atlas_image is None:
        _atlas_image = bpy.data.images.get(ATLAS_PATH.name)
        if _atlas_image is None:
            _atlas_image = bpy.data.images.load(str(ATLAS_PATH), check_existing=True)
        _atlas_image.name = "DC9_INSTRUMENT_ATLAS_SOURCE"
        _atlas_image.colorspace_settings.name = "sRGB"
    if _atlas_pixels is None:
        _atlas_pixels = list(_atlas_image.pixels[:])
    return _atlas_image, _atlas_pixels


def make_masked_crop_image(crop: tuple[int, int, int, int]) -> bpy.types.Image:
    atlas, source_pixels = load_atlas_pixels()
    left, top, right, bottom = crop
    width = right - left
    height = bottom - top
    image_name = f"DC9_INST_CROP_{left}_{top}_{right}_{bottom}"
    existing = bpy.data.images.get(image_name)
    if existing is not None:
        return existing

    cropped = [0.0] * (width * height * 4)
    background_candidate = [False] * (width * height)
    source_y_start = int(ATLAS_HEIGHT) - bottom
    for output_y in range(height):
        source_y = source_y_start + output_y
        for output_x in range(width):
            source_x = left + output_x
            source_index = (source_y * int(ATLAS_WIDTH) + source_x) * 4
            output_index = (output_y * width + output_x) * 4
            red, green, blue, alpha = source_pixels[source_index : source_index + 4]
            cropped[output_index : output_index + 4] = (red, green, blue, alpha)
            near_white = min(red, green, blue) > 0.90 and max(red, green, blue) - min(red, green, blue) < 0.08
            background_candidate[output_y * width + output_x] = alpha < 0.08 or near_white

    exterior = [False] * (width * height)
    queue: deque[int] = deque()
    for x in range(width):
        queue.extend((x, (height - 1) * width + x))
    for y in range(height):
        queue.extend((y * width, y * width + width - 1))

    while queue:
        index = queue.popleft()
        if exterior[index] or not background_candidate[index]:
            continue
        exterior[index] = True
        x = index % width
        y = index // width
        if x > 0:
            queue.append(index - 1)
        if x + 1 < width:
            queue.append(index + 1)
        if y > 0:
            queue.append(index - width)
        if y + 1 < height:
            queue.append(index + width)

    for index, is_exterior in enumerate(exterior):
        if is_exterior:
            cropped[index * 4 + 3] = 0.0

    image = bpy.data.images.new(image_name, width=width, height=height, alpha=True)
    image.colorspace_settings.name = "sRGB"
    image.pixels.foreach_set(cropped)
    image.update()
    image.pack()
    image["source_atlas"] = ATLAS_PATH.name
    image["source_crop_top_left_pixels"] = list(crop)
    return image


def make_crop_material(crop: tuple[int, int, int, int]) -> bpy.types.Material:
    existing = _crop_materials.get(crop)
    if existing is not None:
        return existing
    image = make_masked_crop_image(crop)
    material_name = f"MAT_{image.name}"
    material = bpy.data.materials.get(material_name) or bpy.data.materials.new(material_name)
    material.use_nodes = True
    material.use_backface_culling = False
    if hasattr(material, "surface_render_method"):
        material.surface_render_method = "DITHERED"
    elif hasattr(material, "blend_method"):
        material.blend_method = "HASHED"

    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Linear"
    principled.inputs["Roughness"].default_value = 0.42
    principled.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in principled.inputs:
        principled.inputs["Specular IOR Level"].default_value = 0.38
    material.node_tree.links.new(texture.outputs["Color"], principled.inputs["Base Color"])
    material.node_tree.links.new(texture.outputs["Alpha"], principled.inputs["Alpha"])
    material.node_tree.links.new(principled.outputs["BSDF"], output.inputs["Surface"])
    _crop_materials[crop] = material
    return material


def make_atlas_quad(
    name: str,
    width: float,
    height: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    half_w = width / 2.0
    half_h = height / 2.0
    vertices = [
        (-half_w, 0.0, -half_h),
        (half_w, 0.0, -half_h),
        (half_w, 0.0, half_h),
        (-half_w, 0.0, half_h),
    ]
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(vertices, [], [(0, 1, 2, 3)])
    mesh.materials.append(material)
    uv_layer = mesh.uv_layers.new(name="UVMap")

    uv_coordinates = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    for loop, uv in zip(mesh.loops, uv_coordinates, strict=True):
        uv_layer.data[loop.index].uv = uv

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj["presentation_role"] = "non_operational_instrument_face"
    obj["source_texture"] = ATLAS_PATH.name
    return obj


def make_atlas_disk(
    name: str,
    diameter: float,
    material: bpy.types.Material,
    segments: int = 48,
) -> bpy.types.Object:
    radius = diameter / 2.0
    vertices = [(0.0, 0.0, 0.0)]
    uv_coordinates = [(0.5, 0.5)]
    for index in range(segments):
        angle = 2.0 * math.pi * index / segments
        x = math.cos(angle)
        z = math.sin(angle)
        vertices.append((radius * x, 0.0, radius * z))
        uv_coordinates.append((0.5 + 0.5 * x, 0.5 + 0.5 * z))
    faces = [(0, index + 1, (index + 1) % segments + 1) for index in range(segments)]
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            vertex_index = mesh.loops[loop_index].vertex_index
            uv_layer.data[loop_index].uv = uv_coordinates[vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj["presentation_role"] = "non_operational_instrument_face"
    obj["source_texture"] = ATLAS_PATH.name
    return obj


def make_instrument(
    parent: bpy.types.Object,
    bezel_material: bpy.types.Material,
    *,
    name: str,
    position: tuple[float, float],
    size: tuple[float, float],
    crop: tuple[int, int, int, int],
    circular: bool = True,
) -> None:
    x, z = position
    width, height = size
    if x <= -0.45:
        y = -1.85 + 0.65 * x - 0.40 * z
        panel_rotation_x = math.atan(0.40)
        panel_rotation_z = math.atan(0.65)
    elif x >= 0.45:
        y = -1.85 - 0.65 * x - 0.40 * z
        panel_rotation_x = math.atan(0.40)
        panel_rotation_z = -math.atan(0.65)
    else:
        y = -2.435 + 0.25 * z
        panel_rotation_x = PANEL_SLOPE_X
        panel_rotation_z = 0.0
    group = make_empty(name, parent)
    group.location = (x, y, z)
    group.rotation_euler = (panel_rotation_x, 0.0, panel_rotation_z)
    group["instrument_role"] = name.removeprefix("DC9_INST_").lower()
    group["aircraft_scope"] = "dc9-50-family-presentation"

    face_material = make_crop_material(crop)
    face = (
        make_atlas_disk(f"{name}_FACE", min(width, height), face_material)
        if circular
        else make_atlas_quad(f"{name}_FACE", width, height, face_material)
    )
    face.parent = group
    face.location.y = -0.042

    if not circular:
        return

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=min(width, height) * 0.48,
        depth=0.025,
        location=(0.0, 0.0, 0.0),
        rotation=(math.pi / 2.0, 0.0, 0.0),
    )
    housing = bpy.context.object
    housing.name = f"{name}_HOUSING"
    housing.data.name = f"{name}_HOUSING_MESH"
    housing.data.materials.append(bezel_material)
    housing.parent = group
    housing.location = (0.0, 0.006, 0.0)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=min(width, height) * 0.465,
        minor_radius=0.008,
        major_segments=32,
        minor_segments=8,
        location=(0.0, 0.0, 0.0),
        rotation=(math.pi / 2.0, 0.0, 0.0),
    )
    bezel = bpy.context.object
    bezel.name = f"{name}_BEZEL"
    bezel.data.name = f"{name}_BEZEL_MESH"
    bezel.data.materials.append(bezel_material)
    bezel.parent = group
    bezel.location = (0.0, -0.047, 0.0)


def add_instruments(root: bpy.types.Object) -> bpy.types.Object:
    instruments = make_empty("DC9_INSTRUMENTS", root)
    bezel_material = make_principled_material(
        "MAT_DC9_INSTRUMENT_BEZEL", (0.018, 0.022, 0.021, 1.0), metallic=0.42, roughness=0.34
    )

    primary_layout = [
        ("DC9_INST_CAPT_AIRSPEED", (-1.10, 0.49), (0.188, 0.188), (800, 1150, 1192, 1548), False),
        ("DC9_INST_CAPT_ATTITUDE", (-0.88, 0.49), (0.190, 0.190), (0, 855, 310, 1168), False),
        ("DC9_INST_CAPT_ALTIMETER", (-0.66, 0.49), (0.190, 0.190), (1462, 1270, 1842, 1682), False),
        ("DC9_INST_CAPT_HEADING", (-1.10, 0.255), (0.180, 0.180), (0, 1734, 330, 2048), True),
        ("DC9_INST_CAPT_VSI", (-0.88, 0.255), (0.172, 0.172), (1190, 1018, 1468, 1328), True),
        ("DC9_INST_CAPT_RADIO_ALT", (-0.66, 0.255), (0.166, 0.166), (1440, 1028, 1690, 1288), True),
        ("DC9_INST_FO_AIRSPEED", (0.66, 0.49), (0.188, 0.188), (800, 1150, 1192, 1548), False),
        ("DC9_INST_FO_ATTITUDE", (0.88, 0.49), (0.190, 0.190), (0, 855, 310, 1168), False),
        ("DC9_INST_FO_ALTIMETER", (1.10, 0.49), (0.190, 0.190), (1462, 1270, 1842, 1682), False),
        ("DC9_INST_FO_HEADING", (0.66, 0.255), (0.180, 0.180), (0, 1734, 330, 2048), True),
        ("DC9_INST_FO_VSI", (0.88, 0.255), (0.172, 0.172), (1190, 1018, 1468, 1328), True),
        ("DC9_INST_FO_RADIO_ALT", (1.10, 0.255), (0.166, 0.166), (1440, 1028, 1690, 1288), True),
    ]
    for name, position, size, crop, circular in primary_layout:
        make_instrument(
            instruments,
            bezel_material,
            name=name,
            position=position,
            size=size,
            crop=crop,
            circular=circular,
        )

    engine_crops = [
        ("EPR_L", (358, 1740, 640, 2048)),
        ("EPR_R", (358, 1740, 640, 2048)),
        ("RPM_L", (650, 1775, 910, 2048)),
        ("RPM_R", (650, 1775, 910, 2048)),
        ("EGT_L", (900, 1740, 1165, 2048)),
        ("EGT_R", (900, 1740, 1165, 2048)),
        ("OIL_TEMP", (760, 1510, 1068, 1818)),
        ("OIL_QTY", (1060, 1510, 1360, 1835)),
        ("FUEL_QTY", (1190, 1745, 1538, 2048)),
    ]
    engine_positions = [
        (-0.25, 0.55), (-0.08, 0.55),
        (-0.25, 0.39), (-0.08, 0.39),
        (-0.25, 0.23), (-0.08, 0.23),
        (0.10, 0.55), (0.10, 0.39), (0.10, 0.23),
    ]
    for (role, crop), position in zip(engine_crops, engine_positions, strict=True):
        make_instrument(
            instruments,
            bezel_material,
            name=f"DC9_INST_ENGINE_{role}",
            position=position,
            size=(0.102, 0.102),
            crop=crop,
            circular=True,
        )
    return instruments


def point_object_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def make_camera(
    root: bpy.types.Object,
    name: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    lens: float,
    *,
    role: str = "first_officer_seated_non_operational",
    deprecated_replacement: str | None = None,
) -> bpy.types.Object:
    data = bpy.data.cameras.new(f"{name}_DATA")
    data.lens = lens
    data.sensor_width = 36.0
    data.clip_start = 0.015
    data.clip_end = 100.0
    camera = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = location
    point_object_at(camera, target)
    camera.parent = root
    camera["camera_role"] = role
    if deprecated_replacement:
        camera["deprecated"] = True
        camera["compatibility_only"] = True
        camera["replacement_camera"] = deprecated_replacement
    return camera


def attach_route_contract_to_first_officer_yoke() -> None:
    """Make the visible strip and its hit volumes true children of the FO yoke."""
    yoke = bpy.data.objects.get("OBJ8_DC9VC2_RANGE_014")
    if yoke is None:
        raise RuntimeError("First-officer yoke pad source OBJ8_DC9VC2_RANGE_014 is missing")
    candidates = []
    for group_name in ("DC9_PUZZLE_PROPS", "DC9_COLLIDERS"):
        group = bpy.data.objects.get(group_name)
        if group is None:
            continue
        candidates.extend(
            child for child in list(group.children)
            if child.name.startswith("DC9_ROUTE_")
            or child.name.startswith("DC9_PROP_MEM_ROUTE_CARD")
            or child.name.startswith("DC9_HITBOX_ROUTE_")
        )
    # Newly created route objects have just received their local positions.
    # Evaluate those transforms before preserving matrix_world during the
    # parent swap; otherwise Blender retains the stale identity matrix and
    # collapses the complete route contract to the scene origin.
    bpy.context.view_layer.update()
    for obj in candidates:
        world = obj.matrix_world.copy()
        obj.parent = yoke
        obj.matrix_world = world
        obj["mounted_to_source"] = yoke.name
        obj["seat_role"] = "first_officer"


def make_area_light(
    name: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    energy: float,
    color: tuple[float, float, float],
    size: float,
) -> None:
    data = bpy.data.lights.new(name=f"{name}_DATA", type="AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    light = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(light)
    light.location = location
    point_object_at(light, target)


def configure_scene(root: bpy.types.Object) -> None:
    for obj in list(bpy.context.scene.objects):
        if obj.type in {"CAMERA", "LIGHT"} and not obj.name.startswith("DC9_"):
            bpy.data.objects.remove(obj, do_unlink=True)

    game_camera = make_camera(
        root,
        "CAM_DC9_FIRST_OFFICER_GAME",
        (0.45, -3.24, 0.70),
        (0.38, -2.38, 0.34),
        25.0,
    )
    approval_camera = make_camera(
        root,
        "CAM_DC9_FIRST_OFFICER_APPROVAL",
        (0.45, -3.24, 0.70),
        (0.38, -2.38, 0.34),
        25.0,
    )
    make_camera(
        root,
        "CAM_DC9_FIRST_OFFICER_MAIN_PANEL_APPROVAL",
        (0.35, -3.25, 0.72),
        (0.10, -2.34, 0.36),
        32.0,
    )
    make_camera(
        root,
        "CAM_DC9_FIRST_OFFICER_OVERHEAD_APPROVAL",
        (0.47, -3.21, 0.93),
        (0.19, -2.46, 1.16),
        39.0,
    )
    make_camera(
        root,
        "CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL",
        (0.45, -3.34, 0.82),
        (0.45, -2.60, 0.30),
        40.0,
    )
    make_camera(
        root,
        "CAM_DC9_FIRST_OFFICER_PEDESTAL_APPROVAL",
        (0.43, -3.12, 0.59),
        (0.08, -2.25, -0.12),
        39.0,
    )
    make_camera(
        root,
        "CAM_DC9_CAPTAIN_GAME",
        (-0.45, -3.34, 0.82),
        (-0.38, -2.38, 0.34),
        25.0,
        role="deprecated_captain_compatibility",
        deprecated_replacement="CAM_DC9_FIRST_OFFICER_GAME",
    )
    make_camera(
        root,
        "CAM_DC9_CAPTAIN_APPROVAL",
        (-0.45, -3.34, 0.82),
        (-0.38, -2.38, 0.34),
        25.0,
        role="deprecated_captain_compatibility",
        deprecated_replacement="CAM_DC9_FIRST_OFFICER_APPROVAL",
    )
    bpy.context.scene.camera = approval_camera

    make_area_light(
        "DC9_PREVIEW_KEY",
        (-1.75, -3.05, 2.55),
        (-0.35, -2.20, 0.42),
        72.0,
        (1.0, 0.78, 0.58),
        2.6,
    )
    make_area_light(
        "DC9_PREVIEW_FILL",
        (1.80, -2.75, 1.65),
        (0.10, -2.25, 0.40),
        54.0,
        (0.58, 0.75, 1.0),
        2.8,
    )
    make_area_light(
        "DC9_PREVIEW_PANEL",
        (-0.15, -3.05, 0.60),
        (-0.05, -2.22, 0.37),
        28.0,
        (0.78, 0.90, 1.0),
        1.5,
    )

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1440
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("DC9_WORLD")
    scene.world.use_nodes = True
    scene.world.color = (0.006, 0.009, 0.012)
    if scene.world.use_nodes:
        background = next((node for node in scene.world.node_tree.nodes if node.type == "BACKGROUND"), None)
        if background is not None:
            background.inputs["Color"].default_value = (0.006, 0.010, 0.014, 1.0)
            background.inputs["Strength"].default_value = 0.12
    scene.view_settings.look = "AgX - Medium High Contrast"

    locators = make_empty("DC9_LOCATORS", root)
    first_officer_eye = make_empty("DC9_LOC_FIRST_OFFICER_EYE", locators)
    first_officer_eye.matrix_world = game_camera.matrix_world.copy()
    panel_focus = make_empty("DC9_LOC_MAIN_PANEL_FOCUS", locators)
    panel_focus.location = (-0.35, -2.22, 0.43)


def build() -> None:
    missing_sources = [path for path in SOURCE_OBJECTS if not path.exists()]
    if missing_sources:
        raise RuntimeError(f"Missing Roger2009 source objects: {missing_sources}")
    if not POSE_PATH.exists():
        raise RuntimeError(f"Missing deterministic parked pose: {POSE_PATH}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    source_root = make_empty("DC9_ROOT")
    source_root["asset_stage"] = "owner_review_candidate"
    source_root["target_aircraft"] = "McDonnell Douglas DC-9-32"
    source_root["source_variant"] = "Roger2009 X-Plane DC-9-32"
    source_root["authority"] = "owner-cleared production geometry and texture authority"
    source_root["interaction_scope"] = "fictional_non_operational"
    source_root["build_script"] = "tools/blender/build_dc9_production.py"
    source_root["interaction_map"] = str(INTERACTION_MAP_PATH.relative_to(REPO_ROOT))

    source_root["parked_pose"] = str(POSE_PATH.relative_to(REPO_ROOT))
    source_root["reference_benchmark"] = "Roger2009 DC-9-32 package and procedure guide; DC-9-51 references limited to Northwest-era finish cues"

    static = make_empty("DC9_STATIC", source_root)
    instruments = make_empty("DC9_INSTRUMENTS", source_root)
    pose = load_pose(POSE_PATH)
    selected_draws = create_interaction_contract(source_root, pose)
    for source_path in SOURCE_OBJECTS:
        parent = instruments if source_path.name == "DC9-32_cockpit.obj" else static
        add_source_object(
            source_path,
            pose,
            parent,
            exclude_draw_indices=selected_draws if source_path == COCKPIT_OBJECT else None,
        )

    attach_route_contract_to_first_officer_yoke()
    golden_key_report = import_golden_key()
    source_root["golden_key_contract"] = golden_key_report["stableContract"]["node"]
    source_root["golden_key_report"] = str(
        (REPO_ROOT / "asset-reports" / "dc9-golden-key-intake.json").relative_to(REPO_ROOT)
    )

    normalize_donor_image_profiles()
    tune_source_materials()
    configure_scene(source_root)

    for image in bpy.data.images:
        if image.name == "Render Result" or image.packed_file is not None:
            continue
        try:
            image.pack()
        except RuntimeError:
            pass

    OUTPUT_BLEND.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"DC9_PRODUCTION_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    build()
