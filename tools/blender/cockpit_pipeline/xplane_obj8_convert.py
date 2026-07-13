from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Sequence


Matrix4 = tuple[tuple[float, float, float, float], ...]


def identity_matrix() -> Matrix4:
    return (
        (1.0, 0.0, 0.0, 0.0),
        (0.0, 1.0, 0.0, 0.0),
        (0.0, 0.0, 1.0, 0.0),
        (0.0, 0.0, 0.0, 1.0),
    )


def multiply_matrix(left: Matrix4, right: Matrix4) -> Matrix4:
    return tuple(
        tuple(sum(left[row][k] * right[k][column] for k in range(4)) for column in range(4))
        for row in range(4)
    )


def translation_matrix(x: float, y: float, z: float) -> Matrix4:
    return (
        (1.0, 0.0, 0.0, x),
        (0.0, 1.0, 0.0, y),
        (0.0, 0.0, 1.0, z),
        (0.0, 0.0, 0.0, 1.0),
    )


def rotation_matrix(axis: tuple[float, float, float], degrees: float) -> Matrix4:
    x, y, z = axis
    length = math.sqrt(x * x + y * y + z * z)
    if length == 0:
        return identity_matrix()
    x, y, z = x / length, y / length, z / length
    angle = math.radians(degrees)
    cosine = math.cos(angle)
    sine = math.sin(angle)
    one_minus = 1.0 - cosine
    return (
        (
            cosine + x * x * one_minus,
            x * y * one_minus - z * sine,
            x * z * one_minus + y * sine,
            0.0,
        ),
        (
            y * x * one_minus + z * sine,
            cosine + y * y * one_minus,
            y * z * one_minus - x * sine,
            0.0,
        ),
        (
            z * x * one_minus - y * sine,
            z * y * one_minus + x * sine,
            cosine + z * z * one_minus,
            0.0,
        ),
        (0.0, 0.0, 0.0, 1.0),
    )


def transform_point(matrix: Matrix4, point: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = point
    return tuple(
        matrix[row][0] * x + matrix[row][1] * y + matrix[row][2] * z + matrix[row][3]
        for row in range(3)
    )  # type: ignore[return-value]


def transform_vector(matrix: Matrix4, vector: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = vector
    transformed = tuple(
        matrix[row][0] * x + matrix[row][1] * y + matrix[row][2] * z
        for row in range(3)
    )
    length = math.sqrt(sum(component * component for component in transformed))
    if length == 0:
        return (0.0, 0.0, 1.0)
    return tuple(component / length for component in transformed)  # type: ignore[return-value]


def xplane_to_blender_matrix() -> Matrix4:
    # OBJ8 is X-right, Y-up, Z-south. Blender is X-right, Y-forward, Z-up.
    return (
        (1.0, 0.0, 0.0, 0.0),
        (0.0, 0.0, -1.0, 0.0),
        (0.0, 1.0, 0.0, 0.0),
        (0.0, 0.0, 0.0, 1.0),
    )


def interpolate(value: float, first_value: float, first_output: float, second_value: float, second_output: float) -> float:
    if first_value == second_value:
        return first_output
    ratio = (value - first_value) / (second_value - first_value)
    return first_output + ratio * (second_output - first_output)


def interpolate_keys(value: float, keys: Sequence[tuple[float, Sequence[float]]]) -> tuple[float, ...]:
    if not keys:
        raise ValueError("animation key table is empty")
    ordered = sorted(keys, key=lambda item: item[0])
    if len(ordered) == 1:
        return tuple(float(component) for component in ordered[0][1])
    lower = ordered[0]
    upper = ordered[-1]
    for index in range(len(ordered) - 1):
        candidate_lower = ordered[index]
        candidate_upper = ordered[index + 1]
        if candidate_lower[0] <= value <= candidate_upper[0]:
            lower, upper = candidate_lower, candidate_upper
            break
    else:
        lower, upper = (ordered[0], ordered[1]) if value < ordered[0][0] else (ordered[-2], ordered[-1])
    return tuple(
        interpolate(value, lower[0], float(lower[1][component]), upper[0], float(upper[1][component]))
        for component in range(len(lower[1]))
    )


@dataclass(frozen=True)
class Vertex:
    position: tuple[float, float, float]
    normal: tuple[float, float, float]
    uv: tuple[float, float]


@dataclass
class DrawRange:
    offset: int
    count: int
    matrix: Matrix4
    attributes: dict[str, object]
    animation_channels: tuple["AnimationChannel", ...] = ()
    manipulator: "Manipulator | None" = None


@dataclass(frozen=True)
class AnimationChannel:
    kind: str
    dataref: str | None
    axis: tuple[float, float, float] | None
    keys: tuple[tuple[float, tuple[float, ...]], ...]
    pivot: tuple[float, float, float] | None


@dataclass(frozen=True)
class Manipulator:
    kind: str
    dataref: str | None
    arguments: tuple[str, ...]


@dataclass
class ParsedObj8:
    path: Path
    texture: str | None = None
    lit_texture: str | None = None
    vertices: list[Vertex] = field(default_factory=list)
    indices: list[int] = field(default_factory=list)
    draws: list[DrawRange] = field(default_factory=list)
    pose_values: dict[str, float] = field(default_factory=dict)
    pose_defaults: dict[str, float] = field(default_factory=dict)
    ignored_directives: dict[str, int] = field(default_factory=dict)
    unsupported_directives: dict[str, int] = field(default_factory=dict)


KNOWN_IGNORED_DIRECTIVES = {
    "ATTR_cull",
    "ATTR_light_level",
    "ATTR_light_level_reset",
    "ATTR_no_cull",
    "ATTR_reset",
    "ATTR_shiny_rat",
}


def _resolved_pose_value(dataref: str | None, first_value: float, pose: dict[str, float], parsed: ParsedObj8) -> float:
    if not dataref or dataref in {"none", "no_ref"}:
        return first_value
    if dataref in pose:
        parsed.pose_values[dataref] = pose[dataref]
        return pose[dataref]
    parsed.pose_defaults[dataref] = first_value
    return first_value


def _parse_simple_animation(
    parts: list[str], pose: dict[str, float], parsed: ParsedObj8, parent_matrix: Matrix4,
) -> tuple[Matrix4, AnimationChannel]:
    directive = parts[0]
    if directive == "ANIM_trans":
        if len(parts) < 9:
            raise ValueError(f"Malformed ANIM_trans: {' '.join(parts)}")
        x1, y1, z1, x2, y2, z2, v1, v2 = map(float, parts[1:9])
        dataref = parts[9] if len(parts) > 9 else None
        channel_dataref = None if dataref in {None, "none", "no_ref"} else dataref
        value = _resolved_pose_value(dataref, v1, pose, parsed)
        matrix = translation_matrix(
            interpolate(value, v1, x1, v2, x2),
            interpolate(value, v1, y1, v2, y2),
            interpolate(value, v1, z1, v2, z2),
        )
        return matrix, AnimationChannel(
            directive, channel_dataref, None,
            ((v1, (x1, y1, z1)), (v2, (x2, y2, z2))), None,
        )
    if directive == "ANIM_rotate":
        if len(parts) < 8:
            raise ValueError(f"Malformed ANIM_rotate: {' '.join(parts)}")
        x, y, z, r1, r2, v1, v2 = map(float, parts[1:8])
        dataref = parts[8] if len(parts) > 8 else None
        channel_dataref = None if dataref in {None, "none", "no_ref"} else dataref
        value = _resolved_pose_value(dataref, v1, pose, parsed)
        axis = (x, y, z)
        return rotation_matrix(axis, interpolate(value, v1, r1, v2, r2)), AnimationChannel(
            directive, channel_dataref, axis, ((v1, (r1,)), (v2, (r2,))),
            transform_point(xplane_to_blender_matrix(), transform_point(parent_matrix, (0.0, 0.0, 0.0))),
        )
    raise ValueError(f"Unsupported animation directive {directive}")


def parse_obj8(path: Path, pose: dict[str, float] | None = None) -> ParsedObj8:
    pose = pose or {}
    parsed = ParsedObj8(path=path.resolve())
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    if len(lines) < 3 or lines[1].strip().split()[0] != "800" or lines[2].strip() != "OBJ":
        raise ValueError(f"{path} is not an OBJ8 v800 file")

    matrix_stack: list[Matrix4] = [identity_matrix()]
    channel_stack: list[list[AnimationChannel]] = [[]]
    attributes: dict[str, object] = {"cull": True, "shiny": 0.0, "lightLevel": None, "drawEnabled": True, "manipulator": None}
    index = 3
    while index < len(lines):
        raw_line = lines[index].strip()
        index += 1
        if not raw_line or raw_line.startswith("#"):
            continue
        parts = raw_line.split()
        directive = parts[0]
        if directive == "TEXTURE":
            parsed.texture = raw_line.split(maxsplit=1)[1]
        elif directive == "TEXTURE_LIT":
            parsed.lit_texture = raw_line.split(maxsplit=1)[1]
        elif directive == "POINT_COUNTS":
            continue
        elif directive == "VT":
            values = tuple(map(float, parts[1:9]))
            parsed.vertices.append(Vertex(values[0:3], values[3:6], values[6:8]))
        elif directive in {"IDX", "IDX10"}:
            parsed.indices.extend(map(int, parts[1:]))
        elif directive == "ANIM_begin":
            matrix_stack.append(matrix_stack[-1])
            channel_stack.append(list(channel_stack[-1]))
        elif directive == "ANIM_end":
            if len(matrix_stack) == 1:
                raise ValueError(f"Unbalanced ANIM_end in {path}")
            matrix_stack.pop()
            channel_stack.pop()
        elif directive in {"ANIM_trans", "ANIM_rotate"}:
            matrix, channel = _parse_simple_animation(parts, pose, parsed, matrix_stack[-1])
            matrix_stack[-1] = multiply_matrix(matrix_stack[-1], matrix)
            channel_stack[-1].append(channel)
        elif directive == "ANIM_rotate_begin":
            axis = tuple(map(float, parts[1:4]))
            dataref = parts[4] if len(parts) > 4 else None
            keys: list[tuple[float, Sequence[float]]] = []
            while index < len(lines):
                key_parts = lines[index].strip().split()
                index += 1
                if not key_parts:
                    continue
                if key_parts[0] == "ANIM_rotate_end":
                    break
                if key_parts[0] != "ANIM_rotate_key":
                    raise ValueError(f"Unexpected {key_parts[0]} inside ANIM_rotate_begin")
                keys.append((float(key_parts[1]), (float(key_parts[2]),)))
            value = _resolved_pose_value(dataref, keys[0][0], pose, parsed)
            angle = interpolate_keys(value, keys)[0]
            normalized_keys = tuple((key, tuple(float(component) for component in output)) for key, output in keys)
            channel_stack[-1].append(AnimationChannel(
                directive, dataref, axis, normalized_keys,
                transform_point(xplane_to_blender_matrix(), transform_point(matrix_stack[-1], (0.0, 0.0, 0.0))),
            ))
            matrix_stack[-1] = multiply_matrix(matrix_stack[-1], rotation_matrix(axis, angle))
        elif directive == "ANIM_trans_begin":
            dataref = parts[1] if len(parts) > 1 else None
            keys: list[tuple[float, Sequence[float]]] = []
            while index < len(lines):
                key_parts = lines[index].strip().split()
                index += 1
                if not key_parts:
                    continue
                if key_parts[0] == "ANIM_trans_end":
                    break
                if key_parts[0] != "ANIM_trans_key":
                    raise ValueError(f"Unexpected {key_parts[0]} inside ANIM_trans_begin")
                keys.append((float(key_parts[1]), tuple(map(float, key_parts[2:5]))))
            value = _resolved_pose_value(dataref, keys[0][0], pose, parsed)
            translation = interpolate_keys(value, keys)
            normalized_keys = tuple((key, tuple(float(component) for component in output)) for key, output in keys)
            channel_stack[-1].append(AnimationChannel(directive, dataref, None, normalized_keys, None))
            matrix_stack[-1] = multiply_matrix(matrix_stack[-1], translation_matrix(*translation))
        elif directive == "TRIS":
            offset, count = int(parts[1]), int(parts[2])
            if attributes["drawEnabled"]:
                parsed.draws.append(DrawRange(
                    offset, count, matrix_stack[-1], dict(attributes), tuple(channel_stack[-1]), attributes.get("manipulator"),
                ))
        elif directive == "ATTR_draw_disable":
            attributes["drawEnabled"] = False
            parsed.ignored_directives[directive] = parsed.ignored_directives.get(directive, 0) + 1
        elif directive == "ATTR_draw_enable":
            attributes["drawEnabled"] = True
            parsed.ignored_directives[directive] = parsed.ignored_directives.get(directive, 0) + 1
        elif directive == "ATTR_no_cull":
            attributes["cull"] = False
            parsed.ignored_directives[directive] = parsed.ignored_directives.get(directive, 0) + 1
        elif directive in {"ATTR_cull", "ATTR_reset"}:
            attributes["cull"] = True
            parsed.ignored_directives[directive] = parsed.ignored_directives.get(directive, 0) + 1
        elif directive == "ATTR_shiny_rat":
            attributes["shiny"] = float(parts[1])
            parsed.ignored_directives[directive] = parsed.ignored_directives.get(directive, 0) + 1
        elif directive == "ATTR_light_level":
            attributes["lightLevel"] = raw_line.split(maxsplit=1)[1]
            parsed.ignored_directives[directive] = parsed.ignored_directives.get(directive, 0) + 1
        elif directive == "ATTR_light_level_reset":
            attributes["lightLevel"] = None
            parsed.ignored_directives[directive] = parsed.ignored_directives.get(directive, 0) + 1
        elif directive == "ATTR_manip_none":
            attributes["manipulator"] = None
        elif directive.startswith("ATTR_manip_"):
            dataref = parts[-1] if len(parts) > 1 and "/" in parts[-1] else None
            attributes["manipulator"] = Manipulator(directive, dataref, tuple(parts[1:]))
        elif directive in KNOWN_IGNORED_DIRECTIVES:
            parsed.ignored_directives[directive] = parsed.ignored_directives.get(directive, 0) + 1
        elif directive in {"I", "A", "800", "OBJ"}:
            continue
        else:
            parsed.unsupported_directives[directive] = parsed.unsupported_directives.get(directive, 0) + 1

    if len(matrix_stack) != 1 or len(channel_stack) != 1:
        raise ValueError(f"Unbalanced ANIM_begin in {path}")
    if any(vertex_index >= len(parsed.vertices) or vertex_index < 0 for vertex_index in parsed.indices):
        raise ValueError(f"Index table in {path} references a missing vertex")
    for draw in parsed.draws:
        if draw.count % 3 != 0 or draw.offset < 0 or draw.offset + draw.count > len(parsed.indices):
            raise ValueError(f"Invalid TRIS range {draw.offset}:{draw.count} in {path}")
    return parsed


def draw_range_datarefs(draw: DrawRange) -> tuple[str, ...]:
    refs = [channel.dataref for channel in draw.animation_channels if channel.dataref]
    if draw.manipulator and draw.manipulator.dataref:
        refs.append(draw.manipulator.dataref)
    return tuple(dict.fromkeys(refs))


def partition_draw_ranges(parsed: ParsedObj8, selected_datarefs: set[str]) -> tuple[list[int], list[int]]:
    """Return zero-based selected and static draw indices without overlap."""
    selected: list[int] = []
    static: list[int] = []
    for index, draw in enumerate(parsed.draws):
        (selected if selected_datarefs.intersection(draw_range_datarefs(draw)) else static).append(index)
    return selected, static


def evaluated_vertices(parsed: ParsedObj8, draw: DrawRange) -> Iterable[tuple[int, Vertex, tuple[float, float, float], tuple[float, float, float]]]:
    matrix = multiply_matrix(xplane_to_blender_matrix(), draw.matrix)
    for vertex_index in parsed.indices[draw.offset : draw.offset + draw.count]:
        vertex = parsed.vertices[vertex_index]
        yield vertex_index, vertex, transform_point(matrix, vertex.position), transform_vector(matrix, vertex.normal)


def is_degenerate_triangle(points: Sequence[tuple[float, float, float]]) -> bool:
    if len(points) != 3:
        return True
    first, second, third = points
    ab = tuple(second[index] - first[index] for index in range(3))
    ac = tuple(third[index] - first[index] for index in range(3))
    cross = (
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
    )
    return sum(component * component for component in cross) <= 1e-18


def build_report(parsed: ParsedObj8) -> dict[str, object]:
    evaluated_draws = [list(evaluated_vertices(parsed, draw)) for draw in parsed.draws]
    points = [point for draw in evaluated_draws for _, _, point, _ in draw]
    degenerate_count = sum(
        1
        for draw in evaluated_draws
        for start in range(0, len(draw), 3)
        if is_degenerate_triangle([entry[2] for entry in draw[start : start + 3]])
    )
    if points:
        minimum = [min(point[axis] for point in points) for axis in range(3)]
        maximum = [max(point[axis] for point in points) for axis in range(3)]
        bounds = {"min": minimum, "max": maximum, "dimensions": [maximum[i] - minimum[i] for i in range(3)]}
    else:
        bounds = None
    return {
        "source": str(parsed.path),
        "texture": parsed.texture,
        "litTexture": parsed.lit_texture,
        "vertexCount": len(parsed.vertices),
        "indexCount": len(parsed.indices),
        "drawRangeCount": len(parsed.draws),
        "animationChannelCount": sum(len(draw.animation_channels) for draw in parsed.draws),
        "manipulatorDrawRangeCount": sum(draw.manipulator is not None for draw in parsed.draws),
        "drawOwnership": [
            {"index": index, "offset": draw.offset, "count": draw.count, "datarefs": list(draw_range_datarefs(draw))}
            for index, draw in enumerate(parsed.draws)
            if draw_range_datarefs(draw)
        ],
        "triangleCount": sum(draw.count for draw in parsed.draws) // 3,
        "degenerateTriangleCount": degenerate_count,
        "renderTriangleCount": sum(draw.count for draw in parsed.draws) // 3 - degenerate_count,
        "boundsBlenderMeters": bounds,
        "poseValues": dict(sorted(parsed.pose_values.items())),
        "poseDefaults": dict(sorted(parsed.pose_defaults.items())),
        "ignoredDirectives": dict(sorted(parsed.ignored_directives.items())),
        "unsupportedDirectives": dict(sorted(parsed.unsupported_directives.items())),
    }


def load_pose(path: Path | None) -> dict[str, float]:
    if path is None:
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or not all(isinstance(key, str) and isinstance(value, (int, float)) for key, value in payload.items()):
        raise ValueError("pose file must be a JSON object of dataref-to-number entries")
    return {key: float(value) for key, value in payload.items()}


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse X-Plane OBJ8 cockpit geometry into deterministic evaluation reports.")
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--pose", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    pose = load_pose(args.pose)
    reports = [build_report(parse_obj8(path, pose)) for path in args.inputs]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"objects": reports}, indent=2), encoding="utf-8")
    print(args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
