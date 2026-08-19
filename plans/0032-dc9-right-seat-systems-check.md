# DC-9 right-seat systems check

## Purpose

Today the DC-9 Final Flight Log is read and clicked: a route document, a five-page
recognition log, three shutdown switches, and a text question. Nothing in the parked
cockpit moves under the player's hands.

After this work the player sits in the first-officer seat and actually flies the
controls of a parked aeroplane. They pull and push the yoke through its full travel,
roll the wheel left and right, walk the rudder pedals, sweep both thrust levers and
close them, and then identify the six instruments a DC-9 first officer scanned on every
leg. The real donor geometry moves: the control column rotates on its floor pivot, the
wheel spins on the column axis, the levers swing on the pedestal, and each correctly
identified gauge runs a power-on self-test sweep on its own needle.

This keeps the chapter a warm commemorative memory — a legacy flight on a safely parked
aircraft — while making the first minute of the game something the player *does* rather
than reads.

## Current state

- `src/components/dc9/Dc9Chapter.tsx` renders the chapter across the stages in
  `Dc9ChapterStage` (`src/game/state.ts`): `intro → routeRecord → homeOperations →
  shutdown → qualification → keyReveal → complete`.
- `src/scenes/PrototypeScene.tsx` loads `public/models/dc9-cockpit.glb`, enforces
  `DC9_REQUIRED_NODES`, registers `game_id` targets, raycasts against
  `collider_only` meshes, projects hotspots to screen space for native buttons, and
  tweens the three `DC9_CTRL_*` shutdown pivots.
- The only moving parts are those three switches. The yoke, thrust levers, pedals and
  every instrument needle are static.
- The Airbus chapter already owns the house pattern for continuous flight input:
  `src/game/airbusInput.ts` (keyboard + gamepad + accessible holds → normalised axes)
  and `src/game/useAirbusSimulator.ts` (fixed-step rAF loop).

Known limitation carried into this plan: the DC-9 3D panel is still owner-labelled
`GREYBOX`, and that label stays until the owner clears it.

## Scope

Included:

- A new `controlCheck` stage that opens the chapter, ahead of the route record.
- A new `instrumentScan` stage between the Home Operations Log and the ceremonial
  shutdown.
- A committed flight-deck contract (`src/game/dc9FlightDeck.ts`) holding the exact
  donor pivots, axes, travel limits, instrument centres and needle self-test curves.
- Runtime pivot groups in `PrototypeScene` so the existing GLB animates without being
  rebuilt.
- Keyboard, pointer-drag-on-mesh, and native HTML hold controls, all sharing one axis
  model.
- Schema bump to 13 with a forward migration and safe normalisation of the new fields.
- Unit, contract, e2e and real-browser evidence.

Excluded:

- Rebuilding `public/models/dc9-cockpit.glb`. See the decision log.
- Any change to the journey order, the locker, or the Airbus chapter.
- Captain-side (left seat) controls. The player is in the right seat; only the
  first-officer yoke and pedals are interactive. Both thrust levers move because the
  pedestal is shared.
- Mobile-specific layout design, which `docs/GAME_DESIGN.md` puts outside this scope.

## Context and constraints

- **Tone contract.** The aircraft is safely parked for a commemorative legacy flight.
  A flight-control check and an instrument scan are ordinary pre-flight duties on a
  parked aeroplane; nothing here implies an accident, emergency or systems failure.
  Copy must never suggest the aircraft is flying.
- **Accessibility.** Every 3D interaction needs an equivalent native HTML control.
  Continuous axes get hold buttons plus a keyboard path; reduced motion snaps instead
  of tweening and skips the needle sweeps.
- **Forgiveness.** Wrong instrument answers give progressively clearer coaching and
  never clear a correct answer. The control check has no failure state at all.
- **Asset contract.** Node names, pivots and `game_id` values are public runtime
  contracts. New pivots are introduced as runtime groups derived from committed data,
  and a model check fails the build if the underlying nodes disappear.
- **Privacy.** No new dependencies, network calls, or persisted personal data.

## Discoveries

- **Every donor draw range survives as a named GLB node.** `public/models/dc9-cockpit.glb`
  has 659 nodes, including all 460 `OBJ8_DC9-32_COCKPIT_RANGE_*` panel ranges and all
  129 `OBJ8_DC9VC2_RANGE_*` cockpit ranges. The yoke, levers, pedals and every
  instrument needle are already individually addressable at runtime.
- **glTF space equals raw X-Plane donor space.** The parser reports pivots in Blender
  space `(x, −z, y)` and axes in X-Plane space. Measured against the GLB, glTF
  = `(bx, bz, −by)`, so a donor pivot converts to glTF as `(px, pz, −py)` and a donor
  axis is already a glTF axis. Verified on seven nodes to three decimal places
  (`OBJ8_DC9VC2_RANGE_014/015/007/009/017`, `OBJ8_DC9-32_COCKPIT_RANGE_129/151`); every
  component matched. No node in any of those parent chains carries a rotation or scale,
  so translation-only accumulation is sufficient.
- **The donor animation channels are complete.** Extracted with
  `tools/blender/cockpit_pipeline/xplane_obj8_convert.py`:

  | Control | Nodes | Pivot (glTF) | Axis | Travel |
  | --- | --- | --- | --- | --- |
  | FO yoke column pitch | `RANGE_014`, `RANGE_015` | `0.59298, −0.289439, 2.56786` | `1,0,0` | −1 → −10°, +1 → +15° |
  | FO yoke wheel roll | `RANGE_015` | `0.497686, 0.316071, 2.605478` | `0,0,1` | −1 → +90°, +1 → −90° |
  | Thrust lever 1 (left) | `RANGE_009`, `RANGE_010` | `−0.026399, 0.137043, 2.67068` | `1,0,0` | 0 → 0°, 1 → −55° |
  | Thrust lever 2 (right) | `RANGE_006/007/008` | `−0.021248, 0.137043, 2.67068` | `1,0,0` | 0 → 0°, 1 → −55° |
  | FO pedals | `RANGE_017`, `RANGE_018` | translation | `0,0,1` | ±0.160003 m, opposed |

  Signs check out under the right-hand rule: +1 pitch swings the column top aft toward
  the pilot, +1 roll turns the wheel clockwise from behind, +1 thrust pushes the levers
  forward, +1 rudder sends the left pedal aft.
- **The first-officer basic-T is fully instrumented.** Airspeed `RANGE_151`, ADI
  `RANGE_129`/`131`, altimeter `RANGE_164`/`166`, HSI `RANGE_108`+, VSI `RANGE_099`, and
  the shared EPR pointers `RANGE_037`/`RANGE_055`, each with its own pivot, axis and
  calibrated key table (for example airspeed 0 kt → 15.35°, 250 kt → 232.75°,
  400 kt → 352.2°). Those tables drive the self-test sweeps directly.
- **EPR is the DC-9 signature gauge.** The JT8D thrust reference is EPR, not N1, so it
  earns a place in the scan and gives the chapter an aircraft-specific question the
  Airbus five-card matcher cannot repeat.

## Decision log

- **2026-08-18 — Do not rebuild the GLB; derive pivots at runtime from committed data.**
  The asset already exposes every node needed, and the coordinate mapping is verified.
  A rebuild is a multi-hour Blender operation against a donor held outside the repo that
  would produce a new 36 MB binary, invalidate the recorded SHA-256, and reopen an
  owner-gated asset — all for zero player-visible gain. The exact pivots live in
  `src/game/dc9FlightDeck.ts` and are guarded by a model check that fails if the nodes
  disappear. Consequence: `art-source/blender/dc9_interaction_map.json` gains the same
  values so a future rebuild can promote them to authored Blender pivots.
- **2026-08-18 — Control check opens the chapter; instrument scan sits mid-chapter.**
  Owner choice. Hands land on the yoke in the first seconds, and finishing the sweep is
  what reveals the route strip clipped to that same yoke, which motivates the existing
  opening beat instead of replacing it. Every previously approved beat survives in order.
- **2026-08-18 — Correct identifications run a real needle self-test.** Owner choice.
  Reads as a power-on instrument test on a parked aircraft, reuses the pivot machinery
  already needed for the yoke, and rewards the answer with something only this cockpit
  can do.
- **2026-08-18 — Reuse the Airbus axis vocabulary rather than inventing one.**
  `dc9Input.ts` mirrors `airbusInput.ts` so keyboard, hold buttons and gamepad behave
  the same across both cockpits.

## Milestones

1. **Contract landed.** `src/game/dc9FlightDeck.ts` holds the pivots, axes, travel
   limits, instrument targets and self-test curves; `npm run assets:check` fails if the
   GLB stops providing any named node or moves a gauge centre.
2. **Controls move.** In a browser, the yoke, both thrust levers and the pedals respond
   to keyboard, hold buttons and a drag on the yoke itself, with correct pivots.
3. **Control check completes.** All six sweep items latch, the stage advances, and the
   route strip appears on the yoke.
4. **Instrument scan completes.** Six gauges identified by 3D click or native button,
   each correct answer running its self-test sweep, wrong answers coaching without loss.
5. **Durable and accessible.** Progress survives reload, reduced motion is honoured,
   the whole chapter is keyboard-only playable, and 375/768/1440 px all work.

## Implementation steps

New files:

- `src/game/dc9FlightDeck.ts` — measured contract plus pure helpers
  (`interpolateGaugeAngle`, `resolveControlAngle`).
- `src/game/dc9Input.ts` — keyboard/hold/gamepad → `Dc9ControlInput` axes.
- `src/game/dc9ControlCheck.ts` — sweep item latching, progress, coaching copy.
- `src/game/dc9InstrumentScan.ts` — prompt order, answer checking, progressive hints.
- `src/game/useDc9FlightControls.ts` — rAF loop, spring return, latch detection.
- `src/components/dc9/ControlCheckPanel.tsx` — native mirror and checklist.
- `src/components/dc9/InstrumentScanPanel.tsx` — native gauge list and prompt.
- `src/scenes/dc9FlightDeckVisuals.ts` — pure pivot/transform maths.
- `tools/assets/dc9-flight-deck-contract.mjs` — node and centre validation.
- Matching `*.test.ts` / `*.test.mjs` beside each.

Modified files:

- `src/game/config.ts` — `dc9LegacyFlow` gains `controlCheck` and `instrumentScan` copy.
- `src/game/state.ts` — new stages, actions, progress fields, `GAME_SCHEMA_VERSION` 13.
- `src/game/storage.ts` — `migrateV12`, normalisation defaults for the new fields.
- `src/components/dc9/Dc9Chapter.tsx`, `dc9Chapter.css` — render and style the stages.
- `src/scenes/PrototypeScene.tsx` — pivot groups, control animator, gauge colliders,
  per-stage camera and initial yaw.
- `src/App.tsx` — route the new `game_id`s.
- `tools/assets/check-models.mjs` — call the new contract check.
- `e2e/smoke.spec.ts`, `TEST_REPORT.md`, `docs/GAME_DESIGN.md`,
  `asset-reports/dc9-pipeline-proof.md`.

Commands: `npm run check`, `npm run assets:check`, `npm run test:e2e`.

## Validation plan

- Unit: axis normalisation, spring return, latch thresholds, sweep completion order,
  gauge angle interpolation at and beyond key bounds, scan answer/hint progression,
  reducer transitions for both new stages, and v12 → v13 migration including a save
  written mid-control-check.
- Contract: `npm run assets:check` proves every contract node still exists in the GLB
  and that each declared gauge centre matches the node bounds within tolerance.
- Browser: play the chapter start to Captain's Key at 1440, 768 and 375 px. Exercise
  keyboard-only, hold buttons, pointer drag, wrong gauge answers, reduced motion,
  and a mid-stage reload.
- Visual: capture the yoke at full aft/forward/left/right and the levers closed and
  advanced, to prove the pivots are correct rather than merely moving.

## Acceptance criteria

- Starting a new game lands in `controlCheck`, not `routeRecord`.
- Yoke pitch, yoke roll, both thrust levers and both pedals visibly move under keyboard,
  hold buttons and pointer drag, about the pivots in the discoveries table.
- All six sweep items latch and the stage advances to `routeRecord` with the route strip
  visible on the yoke.
- Each of the six gauges can be identified by 3D click and by native button; a correct
  answer runs that gauge's self-test sweep; a wrong answer coaches and preserves
  correct answers.
- Reduced motion snaps every control and skips the sweeps.
- A save written in either new stage reloads into that stage with its progress intact.
- `npm run check`, `npm run assets:check` and `npm run test:e2e` all pass.

## Repair loop and stop conditions

Review → focused repair → re-run the failing check → re-review the remaining delta.
Stop when the acceptance criteria pass, or after five attempts on a single failing
criterion, or when the delta stops shrinking, or at the owner gate.

## Progress

- [x] 2026-08-18 — Measured the donor animation contract and verified the glTF ↔ donor
      coordinate mapping against the shipped GLB.
- [x] 2026-08-18 — Owner chose the stage placement and the needle self-test payoff.
- [x] 2026-08-19 — `src/game/dc9FlightDeck.ts` contract landed, guarded by
      `tools/assets/dc9-flight-deck-contract.mjs` in `npm run assets:check` and
      cross-checked against the runtime module by `dc9FlightDeckContract.test.ts`.
- [x] 2026-08-19 — Schema 13: `controlCheck` and `instrumentScan` stages, actions,
      progress fields, forward migration, and normalisation of both new fields.
- [x] 2026-08-19 — `dc9Input.ts`, `dc9ControlCheck.ts`, `dc9InstrumentScan.ts` and
      `useDc9FlightControls.ts`, with unit coverage for each.
- [x] 2026-08-19 — `ControlCheckPanel`, `InstrumentScanPanel` and their styling, including
      the narrow-width stacking rule.
- [x] 2026-08-19 — Scene wiring: runtime pivot chains, gauge colliders, per-stage camera,
      yoke drag, and self-test telemetry on the canvas dataset.
- [x] 2026-08-19 — Unit, contract and browser evidence recorded below.
- [x] 2026-08-19 — Full Playwright suite reconciled: three pre-existing DC-9 specs
      updated to the new flow (not relaxed), all DC-9 specs green.
- [x] 2026-08-19 — Responsive and reduced-motion pass at 1440/768/375, with the standing
      instruction moved above the controls so it is never below the fold.
- [ ] Owner review of the reopened Final Flight Log opening gate.

## Evidence

### Commands

- `npm run check` — ESLint, TypeScript, Vitest and the production build, exit 0.
  Vitest 369 passing across 31 files (was 291 across 27 before this work).
- `npm run assets:check` — exit 0, including the new DC-9 flight-deck contract check.
- `npx playwright test` — **56 passed, 1 skipped, 0 failed, 18.1 m, exit 0** across 57
  tests, up from 52 before this work. All 12 DC-9 specs pass, including the two that load
  the real 36 MiB GLB.

### Contract proof

`npm run assets:check` fails if any of the 23 contract nodes disappears, if any ancestor
of one acquires a rotation, scale or matrix, or if a declared gauge centre drifts outside
its own hit radius. That last check earned its keep immediately: the altimeter target was
first measured against the pointer *and* the counter drum, and the drum's cylinder — which
runs 66 mm deeper than the dial — pulled the centre 0.067 m off the face. The check caught
it and the target now tracks the pointer alone.

### Browser proof, production build, real 36 MiB GLB

- Model state `ready`, 18 interaction targets: the 12 existing plus six `dc9.gauge.*`.
- Control sweep at 1440×900, measured as changed pixels against the neutral frame with the
  HTML panel excluded: column 69,545 px, wheel 35,218 px, pedals 9,815 px, levers
  11,506 px. All eight checklist items latched and the stage handed off to the route strip.
- Gauge projection lands on the real basic-T: airspeed 548,295 · ADI 644,253 ·
  altimeter 742,305 · HSI 645,373 · VSI 817,305, with the EPR pair at 180,203 on the
  centre engine stack.
- Self-test, HTML overlay hidden so only the cockpit is measured: the ADI changed 532 px at
  the top of its excursion and returned to **exactly 0 px** difference from its parked
  frame. Zero drift is the strongest available evidence that the baked-pose arithmetic is
  right. The captured peak frame shows the horizon rolled with the pitch ladder while the
  fixed aircraft symbol stays level.

### Defects found and fixed during validation

1. **Clamped linear channels.** The first implementation clamped every donor key table.
   That is right for a calibrated dial but wrong for a two-key `ANIM_rotate`, which is a
   linear map. A twenty-degree ADI roll was being capped at one degree and a
   ninety-degree HSI sweep at zero — the sweeps ran but were invisible. Joints now carry
   an explicit `range`, and a test asserts every self-test produces real needle travel.
2. **One stalled frame ate a whole sweep.** `advanceDc9SelfTests` used the raw frame
   delta, so a single long frame — measured at 1.5 s while software-rasterising this
   cockpit at 3 fps — consumed the entire 2.4 s sweep before it could be seen. The step is
   now clamped, so a slow renderer plays the sweep slowly instead of skipping it.
3. **A failed pointer capture swallowed the hold.** `setPointerCapture` ran before the
   hold started, so a synthetic or accessibility pointer that cannot be captured stopped
   the control moving. The hold now starts first and capture is best-effort; releasing on
   `pointerleave` is also skipped while the button holds the pointer, so drifting off a
   held button no longer stops the control.
4. **Duplicate accessible names.** The projected gauge target and its list entry shared a
   name; the projected one now says where it is.

### Measurement notes for whoever picks this up

Software rendering makes this cockpit run at about 3 frames per second, which is not a
product problem but will mislead a naive browser check: throttled HTML readouts lag the
true control position, and screenshots can land entirely outside a short animation. Two
techniques made the measurements trustworthy — the `data-dc9-self-test` canvas dataset,
which reports the live sweep without depending on screenshot timing, and hiding
`.dc9-chapter` before capture so overlay state changes cannot be mistaken for cockpit
motion.

## Outcome and handoff

Pending. Approval gate 1 (DC-9 Final Flight Log opening proof) is reopened by this work
because the chapter's opening beat changes.
