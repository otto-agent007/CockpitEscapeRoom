"""Pure, compressed game-space layout for the neutral KMEM legacy environment.

Everything here is authored game space (Blender X-right, Y-forward, Z-up), not
airport-chart geography. The ramp-start camera rig, the route knots, and the
viewport fields of view mirror measured runtime contracts:

- ``CAM_DC9_FIRST_OFFICER_GAME`` world pose in ``public/models/dc9-cockpit.glb``
  (seat offset right 0.45 m, back 3.24 m, up 0.70 m; view 4.66 deg left of the
  nose, 22.64 deg down) mapped through the ``dc9MemphisWorldPose`` inverse world
  transform at ``rampStart``.
- ``PATH_KNOTS`` and the Catmull-Rom sampling in ``src/scenes/dc9MemphisVisuals.ts``.
- The DC-9 gameplay fields of view in ``src/scenes/PrototypeScene.tsx`` (64 deg
  vertical at widths >= 900 px, 76 deg below) and the exterior-visible elevation
  bands measured from the recorded ramp-start browser captures.

``validate_layout`` therefore rejects a composition the actual in-game windshield
cannot see, a route leg that leaves the authored pavement, and any building that
intrudes on the guided corridor — the three failure modes that stalled Task 10.
"""

from __future__ import annotations

import math
from typing import Any, Iterable


ROOT_NAME = "KMEM_LEGACY_ROOT"
CONCOURSE_GROUP_NAME = "KMEM_CONCOURSE_B"
RAMP_NAME = "KMEM_RAMP"
TAXI_SURFACE_NAME = "KMEM_TAXI_SURFACE"
RUNWAY_SURFACE_NAME = "KMEM_RUNWAY_SURFACE"
TERMINAL_APRON_NAME = "KMEM_TERMINAL_APRON"
CONCOURSE_RAMP_VISIBILITY_LIMIT = 300.0

ANCHORS = (
    {"name": "KMEM_RAMP_START", "game_id": "dc9.memphis.rampStart", "location": (0.0, 0.0, 0.0)},
    {"name": "KMEM_TAXI_TURN", "game_id": "dc9.memphis.taxiTurn", "location": (-55.0, 90.0, 0.0)},
    {"name": "KMEM_HOLD_SHORT", "game_id": "dc9.memphis.holdShort", "location": (-120.0, 210.0, 0.0)},
    {"name": "KMEM_RUNWAY_LINEUP", "game_id": "dc9.memphis.runwayLineup", "location": (-120.0, 245.0, 0.0)},
    {"name": "KMEM_INITIAL_CLIMB", "game_id": "dc9.memphis.initialClimb", "location": (-120.0, 700.0, 110.0)},
)

# West-frontage composition (2026-08-28): the main block and north pier line the
# west side of the departure corridor so the frontage reads dead ahead at every
# viewport width from ramp release, and stay abeam through lineup, roll, and
# climb. The centered pier is a near-right satellite arm on the apron rewarding
# the game's look-right cue.
CONCOURSE_SOURCE_TRANSFORMS = {
    "ConcourseB.obj": {"location": (-242.0, 250.0, 0.0), "rotation_z_degrees": 0.0},
    "ConcourseB_2.obj": {"location": (-200.0, 385.0, 0.0), "rotation_z_degrees": 90.0},
    "ConcourseB_2e.obj": {"location": (18.0, 118.0, 0.0), "rotation_z_degrees": 116.0},
}

# Local bounds of each approved source object relative to its pivot, measured
# from the owner-approved source candidate (Blender frame, meters).
CONCOURSE_LOCAL_BOUNDS = {
    "ConcourseB.obj": {"min": (-56.492, -101.185, 0.1), "max": (56.518, 125.14, 11.069)},
    "ConcourseB_2.obj": {"min": (-0.329, -15.672, 0.1), "max": (214.443, 14.737, 8.1)},
    "ConcourseB_2e.obj": {"min": (-109.377, -11.81, 0.1), "max": (107.21, 16.972, 8.1)},
}

# Project-owned neutral ground boxes. The ramp reaches north under the satellite
# arm, the taxi surface reaches west under the curved hold-short leg (the spline
# overshoots to X -125), and the terminal apron carries the west frontage so no
# building floats on the sky-colored void.
GROUND_SURFACES = (
    {"name": RAMP_NAME, "center": (0.0, 70.0, -0.75), "dimensions": (180.0, 320.0, 1.5)},
    {"name": TAXI_SURFACE_NAME, "center": (-95.25, 140.0, -0.70), "dimensions": (89.5, 250.0, 1.4)},
    {"name": RUNWAY_SURFACE_NAME, "center": (-120.0, 475.0, -0.72), "dimensions": (62.0, 500.0, 1.44)},
    {"name": TERMINAL_APRON_NAME, "center": (-225.5, 380.0, -0.74), "dimensions": (149.0, 520.0, 1.44)},
)

# Only these surfaces are reserved for the moving aircraft; buildings may stand
# on the ramp and terminal aprons the way gates do at a real airport.
MANEUVERING_SURFACE_NAMES = (TAXI_SURFACE_NAME, RUNWAY_SURFACE_NAME)

TERMINAL_CANOPY_NAME = "KMEM_TERMINAL_CANOPY"

# Stylized martini-glass roofline accent over the main block (owner-approved
# 2026-08-28, delegated detail judgment): eight winged modules, each a pair of
# thin slabs sweeping up from a low valley over a slender column, floating above
# the roof so the air gap reads as the recessed glazing band of the 1963 Memphis
# terminal. Project-authored geometry; explicitly a memory accent, not an exact
# architectural reconstruction.
TERMINAL_CANOPY = {
    "name": TERMINAL_CANOPY_NAME,
    "attached_source": "ConcourseB.obj",
    "x_range": (-230.0, -184.0),
    "module_count": 8,
    "first_module_center_y": 164.05,
    "module_pitch": 28.0,
    "module_half_width": 13.25,
    "roof_z": 11.07,
    "valley_z": 13.57,
    "tip_z": 17.07,
    "slab_thickness": 0.8,
    "column_width": 1.4,
}


def terminal_canopy_parts(spec: dict[str, Any] = TERMINAL_CANOPY) -> list[dict[str, Any]]:
    """Box specs (center, dimensions, X-rotation) for the canopy wings and columns."""
    x_low, x_high = (float(value) for value in spec["x_range"])
    depth = x_high - x_low
    x_center = (x_low + x_high) / 2.0
    half_width = float(spec["module_half_width"])
    rise = float(spec["tip_z"]) - float(spec["valley_z"])
    tilt = math.atan2(rise, half_width)
    slab_length = math.hypot(half_width, rise)
    slab_center_z = (float(spec["valley_z"]) + float(spec["tip_z"])) / 2.0 + float(spec["slab_thickness"]) / 2.0
    column_height = float(spec["valley_z"]) - float(spec["roof_z"]) + 0.4
    parts: list[dict[str, Any]] = []
    for index in range(int(spec["module_count"])):
        center_y = float(spec["first_module_center_y"]) + float(spec["module_pitch"]) * index
        for sign in (-1.0, 1.0):
            parts.append({
                "kind": "wing",
                "center": (x_center, center_y + sign * half_width / 2.0, slab_center_z),
                "dimensions": (depth, slab_length, float(spec["slab_thickness"])),
                "rotation_x_radians": sign * tilt,
            })
        parts.append({
            "kind": "column",
            "center": (x_center, center_y, float(spec["roof_z"]) + column_height / 2.0),
            "dimensions": (float(spec["column_width"]), float(spec["column_width"]), column_height),
            "rotation_x_radians": 0.0,
        })
    return parts


TERMINAL_CLERESTORY_NAME = "KMEM_TERMINAL_CLERESTORY"

# Owner-requested background scenery (2026-08-28): a ground field closes the
# sky-colored void below the horizon, and three distant tree lines frame the
# compressed memory beyond the frontage, the runway end, and the east apron.
# All project-authored, all far from the guided route.
BACKGROUND_SCENERY = (
    {"name": "KMEM_FIELD", "center": (-150.0, 375.0, -0.83), "dimensions": (1100.0, 1450.0, 1.5), "role": "field"},
    {"name": "KMEM_TREELINE_WEST", "center": (-330.0, 400.0, 6.0), "dimensions": (22.0, 1200.0, 12.0), "role": "treeline"},
    {"name": "KMEM_TREELINE_NORTH", "center": (-150.0, 1030.0, 6.0), "dimensions": (1060.0, 24.0, 12.0), "role": "treeline"},
    {"name": "KMEM_TREELINE_EAST", "center": (360.0, 320.0, 6.0), "dimensions": (24.0, 1050.0, 12.0), "role": "treeline"},
)

BACKGROUND_ROUTE_CLEARANCE = 100.0


def terminal_clerestory_box(spec: dict[str, Any] = TERMINAL_CANOPY) -> dict[str, Any]:
    """Dark recessed band connecting the block roof to the canopy valleys.

    Inset from the canopy eaves so the winged overhang still reads, and
    overlapping both the roof and the valley slabs so no sky slit remains.
    """
    x_low, x_high = (float(value) for value in spec["x_range"])
    inset = 2.0
    overlap = 0.15
    first_center = float(spec["first_module_center_y"])
    last_center = first_center + float(spec["module_pitch"]) * (int(spec["module_count"]) - 1)
    y_low = first_center - float(spec["module_half_width"])
    y_high = last_center + float(spec["module_half_width"])
    z_low = float(spec["roof_z"]) - overlap
    z_high = float(spec["valley_z"]) + overlap
    return {
        "name": TERMINAL_CLERESTORY_NAME,
        "center": ((x_low + x_high) / 2.0, (y_low + y_high) / 2.0, (z_low + z_high) / 2.0),
        "dimensions": (x_high - x_low - 2.0 * inset, y_high - y_low, z_high - z_low),
    }


def terminal_canopy_world_bounds(spec: dict[str, Any] = TERMINAL_CANOPY) -> dict[str, tuple[float, float, float]]:
    """Axis-aligned world bounds of the canopy accent, X-rotation aware."""
    minimum = [math.inf, math.inf, math.inf]
    maximum = [-math.inf, -math.inf, -math.inf]
    for part in terminal_canopy_parts(spec):
        dx, dy, dz = part["dimensions"]
        cos_r = abs(math.cos(part["rotation_x_radians"]))
        sin_r = abs(math.sin(part["rotation_x_radians"]))
        half = (dx / 2.0, (dy * cos_r + dz * sin_r) / 2.0, (dy * sin_r + dz * cos_r) / 2.0)
        for axis in range(3):
            minimum[axis] = min(minimum[axis], part["center"][axis] - half[axis])
            maximum[axis] = max(maximum[axis], part["center"][axis] + half[axis])
    return {"min": tuple(minimum), "max": tuple(maximum)}

# Mirrors PATH_KNOTS in src/scenes/dc9MemphisVisuals.ts.
PATH_KNOTS = (0.0, 0.12, 0.42, 0.52, 1.0)

# First-officer camera rig in the aircraft-local frame (measured; see module
# docstring). The vertical offset is the authored camera height (0.70) plus the
# runtime's DC9_MEMPHIS_GROUND_CLEARANCE_METERS (2.5) that keeps the pavement a
# gear height below the cockpit at every attitude.
SEAT_CAMERA = {
    "offset": (0.45, -3.24, 3.20),
    "view_yaw_left_radians": 0.08133,
    "view_pitch_down_radians": 0.39514,
}

# Gameplay viewport fields of view plus the exterior-visible elevation band
# around the horizon measured from the recorded ramp-start browser captures
# (the cockpit glareshield and window frames occlude the rest).
WINDSHIELD_VIEWPORTS = (
    {"name": "wide-1440", "vertical_fov_degrees": 64.0, "aspect": 1440.0 / 900.0, "elevation_band_degrees": (-15.0, 9.4)},
    {"name": "narrow-768", "vertical_fov_degrees": 76.0, "aspect": 768.0 / 900.0, "elevation_band_degrees": (-3.5, 11.5)},
    {"name": "narrow-375", "vertical_fov_degrees": 76.0, "aspect": 375.0 / 812.0, "elevation_band_degrees": (-4.0, 8.0)},
)

ROUTE_CORRIDOR_CLEARANCE = 30.0
PAVEMENT_SHOULDER = 12.0
GROUND_TRACK_PROGRESS_LIMIT = 0.75
GROUND_TRACK_SAMPLES = 600
WINDSHIELD_COVERAGE_MINIMUMS = {"wide-1440": 0.5, "narrow-768": 0.5, "narrow-375": 0.6}


def _is_finite(values: Iterable[float]) -> bool:
    return all(math.isfinite(float(value)) for value in values)


def _distance(left: tuple[float, float, float], right: tuple[float, float, float]) -> float:
    return math.dist(left, right)


def _catmull(p0: float, p1: float, p2: float, p3: float, t: float) -> float:
    t2 = t * t
    t3 = t2 * t
    return 0.5 * (
        2.0 * p1
        + (-p0 + p2) * t
        + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
        + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
    )


def sample_route(progress: float, anchors: Iterable[dict[str, Any]] = ANCHORS) -> tuple[float, float, float]:
    """Sample the guided route exactly the way the runtime samples it."""
    points = [tuple(float(value) for value in anchor["location"]) for anchor in anchors]
    bounded = min(1.0, max(0.0, float(progress)))
    segment = len(PATH_KNOTS) - 2
    for index in range(len(PATH_KNOTS) - 1):
        if bounded <= PATH_KNOTS[index + 1]:
            segment = index
            break
    start, end = PATH_KNOTS[segment], PATH_KNOTS[segment + 1]
    local = (bounded - start) / (end - start)
    p0 = points[max(0, segment - 1)]
    p1 = points[segment]
    p2 = points[min(len(points) - 1, segment + 1)]
    p3 = points[min(len(points) - 1, segment + 2)]
    return tuple(_catmull(p0[axis], p1[axis], p2[axis], p3[axis], local) for axis in range(3))


def route_camera_pose(progress: float, anchors: Iterable[dict[str, Any]] = ANCHORS) -> dict[str, tuple[float, float, float]]:
    """First-officer eye position/forward/up in game space at a route progress."""
    entries = list(anchors)
    position = sample_route(progress, entries)
    before = sample_route(max(0.0, progress - 0.0001), entries)
    after = sample_route(min(1.0, progress + 0.0001), entries)
    heading = math.atan2(-(after[0] - before[0]), after[1] - before[1])
    cos_h, sin_h = math.cos(heading), math.sin(heading)

    def rotate_z(vector: tuple[float, float, float], cos_r: float, sin_r: float) -> tuple[float, float, float]:
        return (
            vector[0] * cos_r - vector[1] * sin_r,
            vector[0] * sin_r + vector[1] * cos_r,
            vector[2],
        )

    offset = rotate_z(tuple(SEAT_CAMERA["offset"]), cos_h, sin_h)
    eye = (position[0] + offset[0], position[1] + offset[1], offset[2])
    pitch = SEAT_CAMERA["view_pitch_down_radians"]
    yaw = SEAT_CAMERA["view_yaw_left_radians"]
    forward_local = (0.0, math.cos(pitch), -math.sin(pitch))
    up_local = (0.0, math.sin(pitch), math.cos(pitch))
    cos_y, sin_y = math.cos(yaw), math.sin(yaw)
    forward = rotate_z(rotate_z(forward_local, cos_y, sin_y), cos_h, sin_h)
    up = rotate_z(rotate_z(up_local, cos_y, sin_y), cos_h, sin_h)
    return {"position": eye, "forward": forward, "up": up}


def _rotate_point_z(point: tuple[float, float, float], degrees: float) -> tuple[float, float, float]:
    radians = math.radians(degrees)
    cos_r, sin_r = math.cos(radians), math.sin(radians)
    return (
        point[0] * cos_r - point[1] * sin_r,
        point[0] * sin_r + point[1] * cos_r,
        point[2],
    )


def _footprint_corners(source_name: str, transform: dict[str, Any]) -> list[tuple[float, float]]:
    bounds = CONCOURSE_LOCAL_BOUNDS[source_name]
    location = transform["location"]
    corners = []
    for x in (bounds["min"][0], bounds["max"][0]):
        for y in (bounds["min"][1], bounds["max"][1]):
            world = _rotate_point_z((x, y, 0.0), float(transform["rotation_z_degrees"]))
            corners.append((world[0] + float(location[0]), world[1] + float(location[1])))
    return corners


def _distance_to_footprint(point: tuple[float, ...], source_name: str, transform: dict[str, Any]) -> float:
    location = transform["location"]
    local = _rotate_point_z(
        (float(point[0]) - float(location[0]), float(point[1]) - float(location[1]), 0.0),
        -float(transform["rotation_z_degrees"]),
    )
    bounds = CONCOURSE_LOCAL_BOUNDS[source_name]
    dx = max(bounds["min"][0] - local[0], 0.0, local[0] - bounds["max"][0])
    dy = max(bounds["min"][1] - local[1], 0.0, local[1] - bounds["max"][1])
    return math.hypot(dx, dy)


def _surface_bounds(surface: dict[str, Any]) -> tuple[float, float, float, float]:
    center = surface["center"]
    dimensions = surface["dimensions"]
    half_x = float(dimensions[0]) / 2.0
    half_y = float(dimensions[1]) / 2.0
    return (
        float(center[0]) - half_x,
        float(center[0]) + half_x,
        float(center[1]) - half_y,
        float(center[1]) + half_y,
    )


def ground_track_pavement_shoulder(
    anchors: Iterable[dict[str, Any]] = ANCHORS,
    ground_surfaces: Iterable[dict[str, Any]] = GROUND_SURFACES,
) -> float:
    """Worst-case pavement shoulder under the sampled ground track.

    Positive: every ground-track sample rides pavement with at least that margin
    to the nearest pavement edge. Negative: some sample sits off every surface
    by that distance (the pre-repair hold-short leg measured about -25 m).
    """
    entries = list(anchors)
    surfaces = [_surface_bounds(surface) for surface in ground_surfaces]
    worst = math.inf
    for index in range(GROUND_TRACK_SAMPLES + 1):
        progress = GROUND_TRACK_PROGRESS_LIMIT * index / GROUND_TRACK_SAMPLES
        x, y, _ = sample_route(progress, entries)
        best = -math.inf
        for min_x, max_x, min_y, max_y in surfaces:
            margin = min(x - min_x, max_x - x, y - min_y, max_y - y)
            best = max(best, margin)
        worst = min(worst, best)
    return worst


def _route_corridor_clearance(
    source_transforms: dict[str, dict[str, Any]],
    anchors: Iterable[dict[str, Any]],
) -> dict[str, float]:
    entries = list(anchors)
    clearances: dict[str, float] = {}
    for source_name, transform in source_transforms.items():
        worst = math.inf
        for index in range(GROUND_TRACK_SAMPLES + 1):
            progress = index / GROUND_TRACK_SAMPLES
            point = sample_route(progress, entries)
            worst = min(worst, _distance_to_footprint(point, source_name, transform))
        clearances[source_name] = worst
    return clearances


def ramp_start_windshield_coverage(
    source_transforms: dict[str, dict[str, Any]] = CONCOURSE_SOURCE_TRANSFORMS,
    anchors: Iterable[dict[str, Any]] = ANCHORS,
) -> dict[str, float]:
    """Fraction of each viewport's horizontal wedge covered by visible concourse.

    Samples every building's top edges from the measured ramp-start eye, keeps
    samples inside the viewport's occlusion-aware elevation band, and unions
    their horizontal bearings inside the viewport wedge.
    """
    pose = route_camera_pose(0.0, anchors)
    eye = pose["position"]
    forward = pose["forward"]
    view_center = math.atan2(forward[1], forward[0])

    per_viewport: dict[str, float] = {}
    for viewport in WINDSHIELD_VIEWPORTS:
        half_v = math.radians(viewport["vertical_fov_degrees"]) / 2.0
        half_h = math.atan(math.tan(half_v) * viewport["aspect"])
        band_low, band_high = (math.radians(value) for value in viewport["elevation_band_degrees"])
        intervals: list[tuple[float, float]] = []
        for source_name, transform in source_transforms.items():
            bounds = CONCOURSE_LOCAL_BOUNDS[source_name]
            top = bounds["max"][2]
            visible: list[float] = []
            steps = 80
            for step in range(steps + 1):
                t = step / steps
                edge_points = (
                    (bounds["min"][0] + (bounds["max"][0] - bounds["min"][0]) * t, bounds["min"][1], top),
                    (bounds["min"][0] + (bounds["max"][0] - bounds["min"][0]) * t, bounds["max"][1], top),
                    (bounds["min"][0], bounds["min"][1] + (bounds["max"][1] - bounds["min"][1]) * t, top),
                    (bounds["max"][0], bounds["min"][1] + (bounds["max"][1] - bounds["min"][1]) * t, top),
                )
                for local_point in edge_points:
                    rotated = _rotate_point_z(local_point, float(transform["rotation_z_degrees"]))
                    world = (
                        rotated[0] + float(transform["location"][0]),
                        rotated[1] + float(transform["location"][1]),
                        rotated[2] + float(transform["location"][2]) if len(transform["location"]) > 2 else rotated[2],
                    )
                    dx = world[0] - eye[0]
                    dy = world[1] - eye[1]
                    dz = world[2] - eye[2]
                    horizontal = math.hypot(dx, dy)
                    if horizontal <= 0.0:
                        continue
                    offset = math.atan2(dy, dx) - view_center
                    while offset > math.pi:
                        offset -= 2.0 * math.pi
                    while offset < -math.pi:
                        offset += 2.0 * math.pi
                    elevation = math.atan2(dz, horizontal)
                    if -half_h <= offset <= half_h and band_low <= elevation <= band_high:
                        visible.append(offset)
            if visible:
                intervals.append((min(visible), max(visible)))
        intervals.sort()
        union = 0.0
        cursor = -math.inf
        for low, high in intervals:
            start = max(low, cursor, -half_h)
            end = min(high, half_h)
            if end > start:
                union += end - start
            cursor = max(cursor, high)
        per_viewport[viewport["name"]] = union / (2.0 * half_h)
    return per_viewport


def route_distances(anchors: Iterable[dict[str, Any]] = ANCHORS) -> list[float]:
    """Return cumulative route distance in authored game space."""
    total = 0.0
    distances: list[float] = []
    previous: tuple[float, float, float] | None = None
    for anchor in anchors:
        location = tuple(float(value) for value in anchor["location"])
        if previous is not None:
            total += _distance(previous, location)
        distances.append(total)
        previous = location
    return distances


def validate_layout(
    anchors: Iterable[dict[str, Any]] = ANCHORS,
    source_transforms: dict[str, dict[str, Any]] = CONCOURSE_SOURCE_TRANSFORMS,
    ground_surfaces: Iterable[dict[str, Any]] = GROUND_SURFACES,
    terminal_canopy: dict[str, Any] = TERMINAL_CANOPY,
    background_scenery: Iterable[dict[str, Any]] = BACKGROUND_SCENERY,
) -> list[str]:
    """Return deterministic errors for invalid authored game-space data."""
    entries = list(anchors)
    surfaces = list(ground_surfaces)
    errors: list[str] = []
    names = [str(entry.get("name", "")) for entry in entries]
    game_ids = [str(entry.get("game_id", "")) for entry in entries]
    if len(names) != len(set(names)) or any(not name for name in names):
        errors.append("anchor names must be unique and non-empty")
    if len(game_ids) != len(set(game_ids)) or any(not game_id for game_id in game_ids):
        errors.append("anchor game IDs must be unique and non-empty")
    for entry in entries:
        location = entry.get("location", ())
        if len(location) != 3 or not _is_finite(location):
            errors.append(f"anchor has non-finite transform: {entry.get('name', '<unnamed>')}")
    for source_name, transform in source_transforms.items():
        location = transform.get("location", ())
        rotation = transform.get("rotation_z_degrees")
        if len(location) != 3 or not _is_finite(location) or not _is_finite((rotation,)):
            errors.append(f"source has non-finite transform: {source_name}")
    expected_sources = {"ConcourseB.obj", "ConcourseB_2.obj", "ConcourseB_2e.obj"}
    if set(source_transforms) != expected_sources:
        errors.append("only the three approved Concourse B source objects may be assembled")
    surface_names = [str(surface.get("name", "")) for surface in surfaces]
    if len(surface_names) != len(set(surface_names)) or any(not name for name in surface_names):
        errors.append("ground surface names must be unique and non-empty")
    for surface in surfaces:
        center = surface.get("center", ())
        dimensions = surface.get("dimensions", ())
        if len(center) != 3 or len(dimensions) != 3 or not _is_finite((*center, *dimensions)):
            errors.append(f"ground surface has a non-finite box: {surface.get('name', '<unnamed>')}")
    if errors:
        return errors
    distances = route_distances(entries)
    if any(right <= left for left, right in zip(distances, distances[1:])):
        errors.append("route distances must be strictly ordered")
    positions = {entry["game_id"]: tuple(float(value) for value in entry["location"]) for entry in entries}
    required_ids = [
        "dc9.memphis.rampStart",
        "dc9.memphis.holdShort",
        "dc9.memphis.runwayLineup",
    ]
    if any(game_id not in positions for game_id in required_ids):
        errors.append("required ramp, hold-short, and lineup anchors are missing")
        return errors
    distance_by_id = {entry["game_id"]: distance for entry, distance in zip(entries, distances, strict=True)}
    if distance_by_id["dc9.memphis.holdShort"] >= distance_by_id["dc9.memphis.runwayLineup"]:
        errors.append("hold short must occur before runway lineup")
    ramp_start = positions["dc9.memphis.rampStart"]
    if not any(
        _distance(ramp_start, tuple(float(value) for value in transform["location"]))
        <= CONCOURSE_RAMP_VISIBILITY_LIMIT
        for transform in source_transforms.values()
    ):
        errors.append("Concourse B is outside the ramp-start visibility limit")

    shoulder = ground_track_pavement_shoulder(entries, surfaces)
    if shoulder < PAVEMENT_SHOULDER:
        errors.append(
            f"guided ground track leaves the authored pavement: worst shoulder {shoulder:.1f} m "
            f"is below the required {PAVEMENT_SHOULDER:.1f} m"
        )

    for source_name, clearance in _route_corridor_clearance(source_transforms, entries).items():
        if clearance < ROUTE_CORRIDOR_CLEARANCE:
            errors.append(
                f"{source_name} intrudes on the route corridor: {clearance:.1f} m "
                f"is below the required {ROUTE_CORRIDOR_CLEARANCE:.1f} m"
            )

    maneuvering = [surface for surface in surfaces if surface.get("name") in MANEUVERING_SURFACE_NAMES]
    for source_name, transform in source_transforms.items():
        corners = _footprint_corners(source_name, transform)
        footprint_min_x = min(corner[0] for corner in corners)
        footprint_max_x = max(corner[0] for corner in corners)
        footprint_min_y = min(corner[1] for corner in corners)
        footprint_max_y = max(corner[1] for corner in corners)
        for surface in maneuvering:
            min_x, max_x, min_y, max_y = _surface_bounds(surface)
            if footprint_min_x < max_x and footprint_max_x > min_x and footprint_min_y < max_y and footprint_max_y > min_y:
                errors.append(f"{source_name} stands on maneuvering pavement {surface['name']}")

    canopy_host = terminal_canopy.get("attached_source")
    if canopy_host not in source_transforms:
        errors.append("terminal canopy must attach to an assembled source object")
    else:
        ordered = (
            float(terminal_canopy.get("roof_z", math.nan)),
            float(terminal_canopy.get("valley_z", math.nan)),
            float(terminal_canopy.get("tip_z", math.nan)),
        )
        if not _is_finite(ordered) or not (ordered[0] < ordered[1] < ordered[2]):
            errors.append("terminal canopy roof/valley/tip heights must be finite and ascending")
        else:
            host_corners = _footprint_corners(canopy_host, source_transforms[canopy_host])
            host_min_x = min(corner[0] for corner in host_corners) - 2.0
            host_max_x = max(corner[0] for corner in host_corners) + 2.0
            host_min_y = min(corner[1] for corner in host_corners) - 2.0
            host_max_y = max(corner[1] for corner in host_corners) + 2.0
            bounds = terminal_canopy_world_bounds(terminal_canopy)
            if (
                bounds["min"][0] < host_min_x
                or bounds["max"][0] > host_max_x
                or bounds["min"][1] < host_min_y
                or bounds["max"][1] > host_max_y
            ):
                errors.append("terminal canopy leaves its host block footprint (2 m eave overhang allowed)")

    for scenery in background_scenery:
        name = str(scenery.get("name", "<unnamed>"))
        center = scenery.get("center", ())
        dimensions = scenery.get("dimensions", ())
        if len(center) != 3 or len(dimensions) != 3 or not _is_finite((*center, *dimensions)):
            errors.append(f"background scenery has a non-finite box: {name}")
            continue
        top = float(center[2]) + float(dimensions[2]) / 2.0
        if top <= 0.0:
            continue  # Below-ground fill such as the field never nears the route.
        half_x = float(dimensions[0]) / 2.0
        half_y = float(dimensions[1]) / 2.0
        worst = math.inf
        for index in range(GROUND_TRACK_SAMPLES + 1):
            x, y, _ = sample_route(index / GROUND_TRACK_SAMPLES, entries)
            dx = max(abs(x - float(center[0])) - half_x, 0.0)
            dy = max(abs(y - float(center[1])) - half_y, 0.0)
            worst = min(worst, math.hypot(dx, dy))
        if worst < BACKGROUND_ROUTE_CLEARANCE:
            errors.append(
                f"background scenery {name} is too near the guided route: {worst:.1f} m "
                f"is below the required {BACKGROUND_ROUTE_CLEARANCE:.1f} m"
            )

    coverage = ramp_start_windshield_coverage(source_transforms, entries)
    for viewport_name, minimum in WINDSHIELD_COVERAGE_MINIMUMS.items():
        if coverage.get(viewport_name, 0.0) < minimum:
            errors.append(
                f"Concourse B does not read from the ramp-start windshield at {viewport_name}: "
                f"coverage {coverage.get(viewport_name, 0.0):.2f} is below {minimum:.2f}"
            )
    return errors
