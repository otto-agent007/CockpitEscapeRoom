# Model Y Hangar and Flight Mode Reward Design

## Goal

After the player completes the DC-9 First-Officer Final Flight Log, unchanged
locker reveal, and Airbus A320 Pop T Captain chapter, the game opens a dedicated
legacy-to-future hangar, reveals the red Model Y with a `POP T` plate, and plays
a short premium Flight Mode transformation. The sequence ends in a recognizable
hover-ready pose and the full editable Father's Day tribute.

## Approved experience

The Airbus completion card's existing **Continue** action enters the reward.
No DC-9 geometry or reward proxy remains visible in this phase.

The normal-motion sequence starts only after the reward GLB is ready:

| Time | Player-visible beat |
|---:|---|
| 0.0–1.2 s | The legacy hangar opens and confirms release authorization. |
| 1.2–3.8 s | The static red Model Y and `POP T` plate are revealed with **Ground Transport Upgrade Authorized**. |
| 3.8–4.8 s | A clean hero hold introduces **Advanced Mobility Package Unlocked**. |
| 4.8–9.8 s | Wings, stabilizers, concealed lift fans, suspension lift, and restrained lighting deploy. |
| 9.8–11.5 s | The vehicle settles into the final hover-ready pose. |
| 11.5 s onward | The final tribute remains visible with **Replay Flight Mode**. |

**Skip cinematic** is available throughout normal playback and lands on the
authored final frame. Reduced-motion mode starts on that final frame and presents
a text recap rather than moving panels or camera travel. A failed model or WebGL
load preserves the complete reward and tribute through native HTML with
**Retry 3D**.

The full tribute is:

> Happy Father's Day, Pop T. From the baseball field to the captain's seat, from
> the DC-9 to the Airbus, you showed us how preparation, calm judgment, teamwork,
> and leadership can carry a family anywhere. This game was built from the
> lessons you gave us. Your crew loves you.

The visible Mars button and 3D trigger are removed. Existing Mars save fields and
the return-to-reward reducer path remain compatible, but new players cannot enter
Mars until its later Easter-egg milestone.

## Asset design

The owner-supplied Tripo GLB is a source candidate, not a deployable model. Its
original bytes are preserved under the Model Y source cache. A deterministic
Blender 5.1.2 build creates `art-source/blender/tesla_reward.blend`, neutral
approval renders, and `public/models/model-y-reward.glb`.

The one-piece car body remains recognizable and is not cut into moving panels.
A separate concealed kit supplies the Flight Mode motion:

- paired underbody wings;
- paired rear stabilizers;
- front and rear lift-fan doors and rotors;
- restrained blue-white emissive accents;
- a small suspension rise and settle.

The runtime copy targets at most 180,000 vehicle triangles and 2048-square
BaseColor, normal, and metallic-roughness maps. The complete GLB targets at most
250,000 triangles, eight materials, 30 draw calls, and 25 MiB. The untouched
480,305-triangle source and its three wired 4096-square maps remain recoverable.

The stable exported contract is:

- `TESLA_ROOT`
- `TESLA_HANGAR`
- `TESLA_VEHICLE`
- `TESLA_MODEL_Y_BODY`
- `TESLA_PLATE_POP_T`
- `TESLA_FLIGHT_MODE_ROOT`
- `TESLA_WING_LEFT_PIVOT`
- `TESLA_WING_RIGHT_PIVOT`
- `TESLA_STABILIZER_LEFT_PIVOT`
- `TESLA_STABILIZER_RIGHT_PIVOT`
- `TESLA_LIFT_FAN_FRONT_DOOR_PIVOT`
- `TESLA_LIFT_FAN_REAR_DOOR_PIVOT`
- `TESLA_LIFT_FAN_FRONT_ROTOR`
- `TESLA_LIFT_FAN_REAR_ROTOR`
- `TESLA_EMISSIVE`
- `CAM_TESLA_REWARD_GAME`
- `CAM_TESLA_REWARD_APPROVAL`
- `CAM_TESLA_FLIGHT_MODE_APPROVAL`
- animation `TESLA_FLIGHT_MODE_REVEAL`, exactly 11.5 seconds

`TESLA_VEHICLE` exports `game_id = reward.modelY`.
`TESLA_FLIGHT_MODE_ROOT` exports `game_id = reward.flightMode` and
`interaction = animation`. Blender owns the pivots, final pose, camera motion,
and animation timing. No 3D collider is required because Skip and Replay are
native HTML actions.

## Runtime design

Reward presentation leaves `PrototypeScene` and moves into a dedicated,
lazy-loaded `RewardScene`. The reward GLB is not imported or requested before
all three prior chapters are complete.

A pure `src/game` timeline maps elapsed milliseconds to:

- `loading`
- `hangar-open`
- `vehicle-reveal`
- `flight-mode`
- `complete`

It also returns the exact GLB clip time. React owns only transient playback,
Skip, Replay, retry, and accessible-fallback state. Persisted schema v8 and
`rewardUnlocked` remain unchanged; reloading a reward save safely replays the
cinematic. A legacy `mars` save remains recoverable and can return to reward.

The HTML reward overlay owns headings, captions, live status, the final message,
Skip, Retry, accessible fallback, and Replay. The Canvas is enhancement only.
Once the final pose is static, the scene stops continuous rendering.

## Validation and approval

The first visual checkpoint is the static hangar and Model Y reveal. Flight Mode
polish proceeds only after that checkpoint is acceptable. The completed
transformation then receives the formal owner gate with a Vercel preview.

Acceptance evidence includes:

- original source hash, byte size, generator, bounds, materials, and 4K maps;
- deterministic import, recursive bounds, stable hierarchy, pivots, cameras,
  animation, tangents, budgets, and GLB reimport;
- unit tests for every timeline boundary, Skip, Replay, and reduced motion;
- browser proof for protected lazy loading, autoplay, captions, keyboard focus,
  reload, model/WebGL failure, legacy Mars return, and full journey handoff;
- 1440×900 reveal/deployed screenshots plus 768 and 375 responsive checks;
- zero relevant console errors, failed requests, or horizontal overflow.

No production dependency, analytics, paid API, new audio asset, Optimus escort,
or Mars gameplay is included.
