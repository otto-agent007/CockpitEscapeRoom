# Blender-to-game asset contract

## Master files

```text
art-source/blender/dc9_master.blend
art-source/blender/airbus_master.blend
art-source/blender/tesla_reward.blend
```

## Root objects

```text
DC9_ROOT
AIRBUS_ROOT
TESLA_ROOT
```

## Recommended hierarchy

```text
DC9_ROOT
├── DC9_STATIC
├── DC9_INTERACTIVE
├── DC9_EMISSIVE
├── DC9_COLLIDERS
├── DC9_LOCATORS
└── DC9_PUZZLE_PROPS
```

Use equivalent prefixes for Airbus and vehicle assets.

## Naming

Names are runtime contracts. Use stable, descriptive names such as:

```text
DC9_SW_LEGACY_POWER_01
DC9_KNOB_ROUTE_SELECTOR_01
DC9_GAUGE_LEGACY_CODE_01
DC9_PROP_MEM_ROUTE_CARD_01
```

Do not encode a puzzle answer directly in a public object name.

## Custom properties

Every interactive object should include:

```text
game_id       = "dc9.legacy_power.switch01"
interaction   = "toggle"
puzzle_id     = "legacy_power"
rotation_axis = "LOCAL_X"
rest_angle    = 0.0
active_angle  = 0.42
sound_id      = "switch_heavy"
```

Use Blender custom properties that export to glTF extras. The runtime should read metadata through `node.userData` after GLTF loading.

## Pivots and transforms

- Put origins at physical hinges or rotation centers.
- Apply rotation and scale before integration unless an animation workflow explicitly requires otherwise.
- Keep interactive controls separate from static panel meshes.
- Use invisible simplified colliders for complex meshes.
- Preserve local axes and document any exception.

## Materials

Prefer Principled BSDF with base color, metallic, roughness, normal, emissive, and justified alpha. Bake Blender-only procedural details before export. Do not depend on shader nodes that glTF cannot represent.

## Export guarantees

A deployable GLB must preserve:

- Root hierarchy.
- Stable node names.
- Pivots and local axes.
- Custom properties/extras.
- Required animations.
- Cameras used by the runtime, if exported intentionally.
- Material and texture assignments.

Do not run a flattening, joining, or destructive deduplication optimization unless an automated interaction regression proves the named controls still work.
