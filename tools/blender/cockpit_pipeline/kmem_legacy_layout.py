"""Pure, compressed game-space layout for the neutral KMEM legacy environment."""

from __future__ import annotations

import math
from typing import Any, Iterable


ROOT_NAME = "KMEM_LEGACY_ROOT"
CONCOURSE_GROUP_NAME = "KMEM_CONCOURSE_B"
RAMP_NAME = "KMEM_RAMP"
TAXI_SURFACE_NAME = "KMEM_TAXI_SURFACE"
RUNWAY_SURFACE_NAME = "KMEM_RUNWAY_SURFACE"
CONCOURSE_RAMP_VISIBILITY_LIMIT = 300.0

ANCHORS = (
    {"name": "KMEM_RAMP_START", "game_id": "dc9.memphis.rampStart", "location": (0.0, 0.0, 0.0)},
    {"name": "KMEM_TAXI_TURN", "game_id": "dc9.memphis.taxiTurn", "location": (-55.0, 90.0, 0.0)},
    {"name": "KMEM_HOLD_SHORT", "game_id": "dc9.memphis.holdShort", "location": (-120.0, 210.0, 0.0)},
    {"name": "KMEM_RUNWAY_LINEUP", "game_id": "dc9.memphis.runwayLineup", "location": (-120.0, 245.0, 0.0)},
    {"name": "KMEM_INITIAL_CLIMB", "game_id": "dc9.memphis.initialClimb", "location": (-120.0, 700.0, 110.0)},
)

CONCOURSE_SOURCE_TRANSFORMS = {
    "ConcourseB.obj": {"location": (90.0, -80.0, 0.0), "rotation_z_degrees": 0.0},
    "ConcourseB_2.obj": {"location": (90.0, 40.0, 0.0), "rotation_z_degrees": 90.0},
    "ConcourseB_2e.obj": {"location": (90.0, -180.0, 0.0), "rotation_z_degrees": 90.0},
}


def _is_finite(values: Iterable[float]) -> bool:
    return all(math.isfinite(float(value)) for value in values)


def _distance(left: tuple[float, float, float], right: tuple[float, float, float]) -> float:
    return math.dist(left, right)


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
) -> list[str]:
    """Return deterministic errors for invalid authored game-space data."""
    entries = list(anchors)
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
    return errors
