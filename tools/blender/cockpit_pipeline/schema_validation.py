from __future__ import annotations

import json
from pathlib import Path
from typing import Any


SCHEMA_DIR = Path(__file__).with_name("schemas")


class SchemaError(ValueError):
    """Raised when a checked-in pipeline JSON file violates its schema."""


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_schema(name: str) -> dict[str, Any]:
    return load_json(SCHEMA_DIR / name)


def validate_json_file(path: Path, schema_name: str) -> dict[str, Any]:
    data = load_json(path)
    schema = load_schema(schema_name)
    validate(data, schema, "$")
    return data


def validate(data: Any, schema: dict[str, Any], location: str = "$", root_schema: dict[str, Any] | None = None) -> None:
    if root_schema is None:
        root_schema = schema
    schema_type = schema.get("type")
    if schema_type:
        _assert_type(data, schema_type, location)

    if "enum" in schema and data not in schema["enum"]:
        allowed = ", ".join(repr(item) for item in schema["enum"])
        raise SchemaError(f"{location}: expected one of {allowed}, got {data!r}")

    if isinstance(data, dict):
        _validate_object(data, schema, location, root_schema)
    elif isinstance(data, list):
        _validate_array(data, schema, location, root_schema)
    elif isinstance(data, str):
        if len(data) < schema.get("minLength", 0):
            raise SchemaError(f"{location}: string is shorter than minLength {schema['minLength']}")
        pattern = schema.get("pattern")
        if pattern == "^[0-9a-f]{64}$" and not _is_sha256(data):
            raise SchemaError(f"{location}: expected lowercase SHA-256 hex digest")
    elif isinstance(data, int) and "minimum" in schema and data < schema["minimum"]:
        raise SchemaError(f"{location}: expected minimum {schema['minimum']}, got {data}")


def _validate_object(data: dict[str, Any], schema: dict[str, Any], location: str, root_schema: dict[str, Any]) -> None:
    for required in schema.get("required", []):
        if required not in data:
            raise SchemaError(f"{location}: missing required field {required!r}")

    if schema.get("additionalProperties") is False:
        allowed = set(schema.get("properties", {}).keys())
        unexpected = sorted(set(data.keys()) - allowed)
        if unexpected:
            raise SchemaError(f"{location}: unexpected field(s) {', '.join(unexpected)}")

    for key, value in data.items():
        prop_schema = schema.get("properties", {}).get(key)
        if prop_schema is None:
            continue
        if "$ref" in prop_schema:
            prop_schema = _resolve_ref(root_schema, prop_schema["$ref"])
        validate(value, prop_schema, f"{location}.{key}", root_schema)


def _validate_array(data: list[Any], schema: dict[str, Any], location: str, root_schema: dict[str, Any]) -> None:
    if len(data) < schema.get("minItems", 0):
        raise SchemaError(f"{location}: expected at least {schema['minItems']} item(s)")
    item_schema = schema.get("items")
    if not item_schema:
        return
    if "$ref" in item_schema:
        item_schema = _resolve_ref(root_schema, item_schema["$ref"])
    for index, item in enumerate(data):
        validate(item, item_schema, f"{location}[{index}]", root_schema)


def _assert_type(data: Any, schema_type: str, location: str) -> None:
    checks = {
        "object": lambda value: isinstance(value, dict),
        "array": lambda value: isinstance(value, list),
        "string": lambda value: isinstance(value, str),
        "integer": lambda value: isinstance(value, int) and not isinstance(value, bool),
        "boolean": lambda value: isinstance(value, bool),
    }
    if schema_type not in checks:
        raise SchemaError(f"{location}: unsupported schema type {schema_type!r}")
    if not checks[schema_type](data):
        raise SchemaError(f"{location}: expected {schema_type}, got {type(data).__name__}")


def _resolve_ref(root_schema: dict[str, Any], ref: str) -> dict[str, Any]:
    if not ref.startswith("#/$defs/"):
        raise SchemaError(f"$: unsupported schema ref {ref!r}")
    name = ref.rsplit("/", 1)[-1]
    return root_schema["$defs"][name]


def _is_sha256(value: str) -> bool:
    if len(value) != 64:
        return False
    return all(char in "0123456789abcdef" for char in value)
