# DC-9 overhead panel: switch markers, a look-down cue, and the key laid along the ledge

## Purpose

Three owner-reported problems in the last third of the DC-9 chapter, all about *finding* things
in a cockpit that is now photoreal enough to hide them:

1. **The three shutdown switches are unfindable.** The APU bus switches, APU master and battery
   are identical black toggles among roughly sixty identical black toggles on the overhead panel.
   The shutdown panel names them, but nothing on the cockpit says which toggle is which. They get
   yellow bounding boxes.
2. **Nothing tells the player to look down for the key.** The cue was a static `>>>` that showed
   only while the key was off screen. Once the player pans fully right the key is *technically* in
   frame — pinned to the very bottom edge, behind the status bar — so the cue vanished exactly when
   the player still could not see the key. Three downward arrows now take over at that point.
3. **The key lies across the ledge instead of along it.** From the right seat it points away from
   the viewer and reads as a smudge on the sill.

## Current state (before this work)

- `Dc9HotspotProjector` reports a screen-space box (`width`/`height`) only for `dc9.route.card` and
  `dc9.gauge.*`. The three `dc9.secure.*` hotspots report a bare centre point, which the shutdown
  panel puts in a `data-projection-point` attribute and otherwise ignores.
- `Dc9Chapter` renders `<div className="dc9-key-scan-cue">&gt;&gt;&gt;</div>` whenever the key is
  not projected — one direction, no geometry behind it.
- `DC9_PROP_CAPTAINS_KEY` and `DC9_HITBOX_CAPTAINS_KEY` sit at `(1.168, 0.122, 3.012)` with identity
  rotation. The key's mesh is 0.185 long on local **X**, 0.033 thick on **Y** and 0.084 across on
  **Z**: it lies flat, but its length runs along the aircraft's lateral axis, across the fore-and-aft
  ledge it is resting on.

## Scope

Included: screen-space boxes for the three overhead switches and the markers drawn on them; a
geometric "which way should I look" hint for the key and the two cues that read it; a runtime
quarter-turn of the key and its collider; unit tests and browser evidence.

Excluded: the shutdown camera framing (owner-approved; see the limitation below), the shutdown
order and its coaching copy, the key's model, material and scale, and the `KEY_ROTATION` constant in
the Blender pipeline (a full asset rebuild, not done here).

## Context and constraints

- **The markers are sight guides, not controls.** They are `aria-hidden`, `pointer-events: none`
  overlays, so a click passes through to the switch in the 3D scene and the existing
  `.dc9-shutdown__control` buttons remain the accessible path. This keeps the "mirror every 3D
  interaction with a native control" rule satisfied by the control that already satisfied it.
- **Direction has to come from geometry, not from the projected pixel.** A point behind the camera
  projects with flipped sign, so screen coordinates cannot answer "is it to my right" once the
  player has panned past something.
- **The key correction is a runtime transform.** Editing the generated GLB by hand is forbidden and
  a pipeline rebuild needs `BLENDER_BIN`, the DC-9 `.blend` and the owner's source key model. This
  is the same shape as the flight-deck pivots, which are already rebuilt at runtime above the donor
  draw ranges.

## Progress

- [x] 2026-08-23 — `dc9.secure.*` hotspots carry a projected box and an `inView` flag.
- [x] 2026-08-23 — Yellow markers with per-state styling, verified at 1440 / 768 / 375.
- [x] 2026-08-23 — `lookHintDirection` drives a right cue and a down cue; transition measured.
- [x] 2026-08-23 — `applyDc9KeyYawCorrection` with four unit tests; before/after render captured.

## Discoveries

- **The key is on screen before the player can see it.** Measured at 1440x900 from the key-reveal
  start pose: the key projects to `(4345, 2546)` — far off the right edge and well below. After a
  full pan right it is at `(1003, 889)` in a 900-tall viewport, i.e. `visible: true` but 1 px from
  the bottom edge and behind the status bar. So "off screen" is the wrong trigger for the cue; the
  down cue fires on **angle below the view centre**, not on visibility.
- **One threshold had to cover two fields of view.** Narrow screens swap to the 76-degree
  narrow-screen field, which changes how low in frame the same key sits. Measured after the pan:
  0.92 of the vertical half-angle at 1440x900, 0.78 at both 768x1024 and 375x812. After pitching
  down to the seat's limit: 0.62 and 0.52. The threshold is 0.70, in the gap, with 0.08 of margin
  either side. An earlier 0.80 worked at 1440 and silently failed on both narrow widths.
- **A seat with yaw stops can be asked to do the impossible.** At 375x812 the horizontal half-angle
  is only 0.35 rad, so at the right-hand yaw stop the key is still 0.028 rad past the edge and the
  cue kept saying "keep panning right" when there was no pan left. A horizontal excess under
  `DC9_LOOK_HINT_SETTLED_RADIANS` (0.06) is now treated as a finished pan so the vertical rule takes
  over. All three widths now read **right → down → clear** on the same journey.
- **`visible` is not good enough to hang a labelled marker on.** On a 375x812 portrait phone the
  APU master hotspot is inside the frustum but its projected centre lands at x = 0.5 px, so the
  marker and its caption were drawn half off the screen. Hotspots now also carry `inView`, which
  additionally requires 48 px of clearance from every edge.
- **The key's long axis is world X.** Read straight from the GLB with `@gltf-transform`: the mesh
  is 0.185 x 0.033 x 0.084 on X/Y/Z with identity rotation. Thickness on Y confirms it was already
  lying flat, so the correction is a yaw, not a roll — a roll would stand the key up on its edge.
- **The markers cannot be padded much.** `separateDc9OverheadHitboxes` deliberately shrinks the
  three colliders to 42 mm so they stop overlapping in 3D. Padding the projected box by 12 px put
  the APU master and battery markers back on top of each other on screen; 6 px keeps them apart.

## Decision log

- **Markers are decoration over the canvas, not buttons** — 2026-08-23. A button would have to be
  keyboard-reachable and would then duplicate the shutdown panel's list in the tab order, and it
  would swallow the click that the 3D raycaster needs. Consequence: the marker cannot be focused;
  the panel row is what a keyboard or screen-reader user drives.
- **A completed switch turns green rather than disappearing** — 2026-08-23. The owner asked for
  yellow boxes on the three switches; keeping a box after the step is done shows the player what
  they have already secured, and the colour matches the `#a9c7b1` the shutdown panel already uses
  for a finished step.
- **The cue renders only for the two directions the seat can produce** — 2026-08-23. An earlier
  version fell back to "right" whenever the projector had no opinion, which is how the stuck cue
  above survived a first round of measurement: the projector was already returning nothing and the
  component was inventing an arrow. The component now shows a cue only for an explicit `right` or
  `down`, so a projector that has no useful instruction produces no arrow rather than a wrong one.
- **Chevrons are drawn from CSS borders, not glyphs** — 2026-08-23. `⌄` and `›` render at wildly
  different weights and baselines depending on which font the browser picks for a monospace stack,
  and an arrow that is sometimes a comma is worse than no arrow.
- **The key is corrected at runtime, with the pipeline constant left alone** — 2026-08-23. See
  constraints. Consequence: `KEY_ROTATION` in `tools/blender/import_dc9_golden_key.py` still says
  `(0, 90°, 172°)`, so a future asset rebuild reproduces the old pose and the runtime turn stays
  necessary. `applyDc9KeyYawCorrection` is the one place to delete when the rebuild happens.

## Milestones

1. Each of the three overhead switches carries a yellow box on the cockpit, the next one in the
   order glowing, completed ones green.
2. The key cue reads "scan right" until the pan has come round, then becomes three downward arrows
   sitting directly above the key, and clears once the key is properly in view.
3. The key lies along the ledge, broadside to the seat, with its hit volume still on it.

## Implementation steps

- `src/scenes/PrototypeScene.tsx` — `Dc9OffscreenDirection`; `inView` and `offscreen` on
  `Dc9HotspotScreenPositions`; `lookHintDirection` (camera-space angles vs frustum half-angles,
  plus `DC9_LOOK_HINT_LOW_IN_FRAME`); `DC9_MARKER_EDGE_MARGIN_PX`; extend the projector's box
  computation to `dc9.secure.*`; call `applyDc9KeyYawCorrection` after
  `separateDc9OverheadHitboxes`.
- `src/scenes/dc9FlightDeckVisuals.ts` — `DC9_KEY_NODES`, `DC9_KEY_YAW_CORRECTION`,
  `applyDc9KeyYawCorrection` (idempotent via `userData`).
- `src/components/dc9/Dc9Chapter.tsx` — the `.dc9-secure-markers` layer and the direction-aware
  `.dc9-key-scan-cue`.
- `src/components/dc9/dc9Chapter.css` — marker, label and state styles; border-drawn chevrons for
  both directions; reduced-motion opt-outs for both.
- `src/scenes/dc9FlightDeckVisuals.test.ts` — four tests on the key correction.

## Validation plan

Unit tests for the key transform; browser probes against the real 36 MB GLB for everything that
depends on projection, at 1440x900, 768x1024 and 375x812; `npm run lint`, `tsc -b`, Vitest and the
Playwright smoke spec including its real-asset DC-9 test.

## Acceptance criteria

- With the shutdown stage open at 1440x900, three markers are present, exactly one carries
  `is-next`, and completing a step moves `is-next` to the following switch and marks the first
  `is-complete`.
- The key cue reports `right` from the key-reveal start pose, still `right` part way through the
  pan, `down` once the pan is complete, and disappears once the player has pitched down.
- The key's collider stays coincident with the key after the correction.

## Evidence

Commands actually run on `pr/dc9-loader-route-record`:

- `npm run lint`, `npx tsc -b --pretty false` — clean.
- `npx vitest run` — **425 passed across 33 files** (was 421; four new key-correction tests).
- `npx playwright test e2e/smoke.spec.ts` — see Outcome.

Browser measurements against the real GLB (Chromium, swiftshader, `vite` dev server):

- Shutdown markers at 1440x900, no steps done:
  `apuBuses (is-next) 88x63 at 243,484`, `apuMaster 85x63 at 418,523`, `battery 81x60 at 496,558`.
  With the APU buses done, `apuBuses` becomes `is-complete` and `is-next` moves to `apuMaster`;
  every box stays at the same coordinates.
- Marker counts by width: 3 at 1440x900, 2 at 768x1024, 1 at 375x812 — the rest fail the 48 px
  edge clearance at the shutdown stage's approved framing (see the limitation below).
- Key cue through a full pan at 1440x900: `right` at the start pose (key at `4345,2546`), `right`
  part way (`1515,1058`), **`down`** once the pan completes (`1003,889`, cue positioned
  `left: clamp(15%, 1003px, 80%)` so the arrows sit directly above the key), then **no cue** after
  pitching down (`979,727`).
- The same three-step journey re-measured at every reference width, panning in strokes that fit
  the viewport (Playwright clamps pointer coordinates, so a single long drag silently pans a
  fraction as far on a phone):

  | width | start | after pan right | after look down |
  | --- | --- | --- | --- |
  | 1440x900 | `right` | `down` | none |
  | 768x1024 | `right` | `down` | none |
  | 375x812 | `right` | `down` | none |
- Key rotation before/after crop: the key turns from lying across the sill to lying along it,
  broadside to the seat.

Owner-review screenshots at 1440 / 768 / 375 in `preview-renders/dc9-overhead-and-key/`:
`01-switch-markers-*`, `02-switch-markers-one-done-*`, `03-key-cue-scan-right-*`,
`04-key-cue-look-down-*`, `05-key-in-view-*`.

## Outcome and handoff

**Awaiting owner review.** Limitations, stated plainly:

- **On a portrait phone the first switch has no marker.** At 375x812 the shutdown stage's approved
  framing puts the APU buses hotspot outside the frame and the APU master within 48 px of the left
  edge, so only the battery marker draws. The player can pan to them and the shutdown panel — which
  covers most of a phone screen anyway — still names and drives all three. Fixing this means
  changing `DC9_SHUTDOWN_INITIAL_YAW` or the narrow-screen field of view for that stage, which is
  owner-approved framing and so was left alone.
- **The APU master and battery markers touch on screen.** Their colliders are 42 mm cubes 70 mm
  apart seen at a steep angle; the boxes are correct, they are simply close.
- **The key correction is runtime-only.** The Blender pipeline still bakes the old pose.
- The quarter turn is `+90°` about the vertical axis. If the owner wants the bow at the other end,
  it is the sign of `DC9_KEY_YAW_CORRECTION`.
- At 375x812 the key ends up partly behind the fullscreen and help buttons in the bottom-right
  corner once it is in view. The look-down cue was moved clear of them; the key itself was not,
  because that is the stage's approved framing.
