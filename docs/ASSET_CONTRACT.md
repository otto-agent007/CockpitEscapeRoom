# Blender-to-game asset contract

## Master files

```text
art-source/blender/dc9_master.blend
art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend
art-source/blender/tesla_reward.blend
art-source/blender/locker_room_master.blend
```

## Root objects

```text
DC9_ROOT
AIRBUS_ROOT
TESLA_ROOT
LOCKER_ROOT
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

The current locker hierarchy uses:

```text
LOCKER_ROOT
├── LOCKER_STATIC
│   ├── LOCKER_ENV_GAME_LOCKER
│   ├── LOCKER_ENV_BENCH
│   └── LOCKER_ENV_MEMORY_SHELF
└── LOCKER_INTERACTIVE
    ├── LOCKER_PROP_WATCH                       game_id = locker.memory.watch
    │   ├── LOCKER_PROP_WATCH_MESH
    │   └── LOCKER_HITBOX_WATCH
    ├── LOCKER_PROP_BASEBALL                    game_id = locker.memory.baseball
    │   ├── LOCKER_PROP_BASEBALL_MESH
    │   └── LOCKER_HITBOX_BASEBALL
    ├── LOCKER_PROP_CHARGING_BULL               game_id = locker.memory.chargingBull
    │   ├── LOCKER_PROP_CHARGING_BULL_MESH
    │   └── LOCKER_HITBOX_CHARGING_BULL
    ├── LOCKER_PROP_WINGS                       game_id = locker.memory.wings
    │   ├── LOCKER_PROP_WINGS_MESH
    │   └── LOCKER_HITBOX_WINGS
    └── LOCKER_PROP_CAPTAINS_HAT                game_id = locker.promotion.hat
        ├── LOCKER_PROP_CAPTAINS_HAT_MESH
        └── LOCKER_HITBOX_CAPTAINS_HAT
```

The baseball, Charging Bull, Wings, and hat nodes and colliders are exported at all times. Runtime availability is reducer-controlled: locked keepsakes render as unreadable silhouettes and do not activate. The watch is followed by the baseball question, then the Charging Bull question, then the Wings question. The Wings node exports `interaction = question`; correct completion of all four questions reveals the hat.

The Model Y reward uses:

```text
TESLA_ROOT
├── TESLA_HANGAR
├── TESLA_VEHICLE                          game_id = reward.modelY
│   └── TESLA_VEHICLE_MOTION
│       ├── TESLA_MODEL_Y_BODY
│       ├── TESLA_PLATE_POP_T
│       └── TESLA_FLIGHT_MODE_ROOT         game_id = reward.flightMode
│           ├── TESLA_WING_*_PIVOT
│           ├── TESLA_STABILIZER_*_PIVOT
│           ├── TESLA_LIFT_FAN_*_PIVOT
│           ├── TESLA_LIFT_FAN_*_ROTOR
│           └── TESLA_EMISSIVE
├── CAM_TESLA_REWARD_GAME
└── CAM_TESLA_REWARD_NARROW_GAME
```

`TESLA_FLIGHT_MODE_REVEAL` is a single 11.5-second shared object-transform
animation. Runtime playback must use `LoopOnce` with a clamped final frame so an
exact seek to 11.5 seconds cannot wrap back to the closed-hangar pose.

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

## Seat-role camera contract

The active DC-9 camera family is `CAM_DC9_FIRST_OFFICER_GAME`, `CAM_DC9_FIRST_OFFICER_APPROVAL`, and the `CAM_DC9_FIRST_OFFICER_*_APPROVAL` route, main-panel, overhead, and pedestal cameras. The active Airbus cameras are `CAM_AIRBUS_CAPTAIN_GAME_VIEW` and `AIRBUS_A320_CAM_CAPTAIN_APPROVAL`. Old seat cameras may remain only with explicit `deprecated`, `compatibility_only`, and `replacement_camera` metadata.

The deployable Airbus path is `public/models/airbus-captain.glb`. React Three Fiber consumes `CAM_AIRBUS_CAPTAIN_GAME_VIEW` and its 68° vertical field of view during qualification, then transitions to `CAM_AIRBUS_CAPTAIN_STORM_FLIGHT` and its 58° vertical field of view for the Storm Flight simulator. The Storm camera exports `game_id = airbus.a320.camera.captain_storm_flight`, `purpose = storm-flight`, `seat_role = captain`, and `aircraft = Airbus A320`. The DC-9 route strip and colliders are children of the actual first-officer yoke while retaining their stable route and shutdown `game_id` values.

The deployable Model Y path is `public/models/model-y-reward.glb`. It is loaded
only in the protected reward phase after DC-9, locker, and Airbus completion.
React Three Fiber consumes `CAM_TESLA_REWARD_GAME` and the Blender-authored
animation directly; native HTML provides Skip, Replay, retry, reduced-motion,
and no-WebGL paths. The deterministic build also emits
`public/images/model-y-reward-narrow-{static,final}.png` at 768×900 from
`CAM_TESLA_REWARD_NARROW_GAME` for the portrait presentation.
