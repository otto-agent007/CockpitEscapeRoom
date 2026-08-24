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

**Owner round two, same day.** Five follow-ups after seeing the above in the browser:

- [x] Marker captions removed — naming each switch on the panel gave the answer away.
- [x] "With both hands on the yoke" dropped from the control-check completion line.
- [x] Route strip raised up the yoke.
- [x] The key's click target became a rectangle around the key instead of a circle on it.
- [x] A synthesized fanfare on the Captain's Key reveal.

## Discoveries

### Round three — the fanfare was inaudible

- **"An oscillator started" is not "a sound was heard", and the first test only checked the
  former.** The owner reported no sound on the key reveal even though the e2e assertion passed.
  Tapping the graph on its way to the destination and sampling the level showed why: the cue
  peaked at 0.37 and then collapsed — one percent of peak by 300 ms, inaudible by 500 ms.
- **The cause was the envelope, not the notes.** `IntroSfxPlayer` gives every voice the ident
  gag's shape: attack over 5 ms, then an exponential ramp to 0.0001 across the whole duration.
  For a 40–400 ms blip that is a PSG pluck; applied to a one-second chord it is a click followed
  by silence. Nothing was wrong with the pitches or the gains.
- **Measured three envelopes to pick an honest test threshold.** Peak in the 0.45–0.70 s window:
  shipped (staggered entries, held notes) **0.47**, held notes removed **0.057**, neither — the
  original — **0.024**. A peak-only assertion separates none of them, because all three attack
  above 0.2. The test now asserts the level in that window is above 0.15, and was run against all
  three: passes shipped, fails at 0.056, fails at 0.013.
- **The release timer was short too.** `dc9KeyFanfareDurationSeconds` returned the longest
  `durationSeconds` and ignored the new per-voice delay, so the AudioContext was released at
  1.45 s while the top note ran to 1.22 s plus its own release.

### Round two

- **The strip's height was chosen by rendering, not arithmetic.** The pipeline centres it at
  y = 0.32, which hangs its lower half down the column shaft below the wheel. Rendered at +0.030,
  +0.038 and +0.045 against the shipped position: +0.045 puts the paper over the yoke's centre hub
  and the wheel stops reading as a wheel, +0.030 is barely clear of the old position. **+0.038**
  puts the top edge at y = 0.433, just under the wheel's 0.4404 top, with the hub still visible.
- **The key's hit volume is barely half the key.** The shipped collider is
  0.109 x 0.020 x 0.050 against a key of 0.185 x 0.033 x 0.085. That was invisible while the trigger
  was a fixed 80 px circle drawn at the collider's centre; the moment the trigger became a rectangle
  projected from that volume, it visibly failed to contain the key — and the key's ends were never
  clickable in the first place. `fitDc9KeyColliderToKey` grows it to the key plus 8%.
- **Scaling a rotated collider on world axes scales the wrong axes.** `Object3D.scale` is applied on
  the node's own axes, and the quarter turn has swapped those against the world's, so comparing
  world sizes silently stretched X where Z was wanted. Caught by a unit test that expected the
  fitted box to match the key on every axis and found one axis 1% out. Both boxes are now measured
  in the collider's own frame.
- **No angular threshold separates "keep panning" from "you are at the stop".** The first attempt
  suppressed a sideways cue below 0.06 rad of overshoot, which fixed the phone but broke 1440: at
  the mid-pan pose the key is 72 px off a 1440-wide screen, which is 0.05 rad — under the threshold
  — so the cue flipped to "down" while the player was still clearly meant to keep panning right. At
  375 at the yaw stop the overshoot is 0.03 rad. The two are not separable by angle. The projector
  now reads the seat's actual remaining travel through a shared `Dc9LookState` ref and only offers a
  direction the seat can still move in, which is exact and deletes the magic number.
- **`atan2(y, hypot(x, forward))` is the right vertical measure here, even though the frustum uses
  `y/forward`.** The elevation angle off the view axis stays constant as the player yaws, so the
  vertical term does not grow while the target is far off to the side. That is what keeps "scan
  right" winning until the pan is done, rather than the two cues fighting.

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

- **The intro's sound descriptor grew an optional envelope rather than the DC-9 getting its own
  player** — 2026-08-23. `IntroSfxSound` now takes optional `delaySeconds` and `sustainSeconds`;
  both absent reproduces the old shape byte for byte, so the ident gag is untouched. The
  alternative was a second AudioContext owner for one cue. Consequence: a module named for the
  intro now carries a field only the DC-9 uses.
- **The fanfare is synthesized, not a shipped audio file** — 2026-08-23. Same reasoning as the
  intro's gag, and the same code: `IntroSfxPlayer` renders any `IntroSfxCue`, so the new
  `dc9KeySfx.ts` is a pure descriptor and nothing new owns an AudioContext. No binary asset, no
  licensing question, nothing downloaded. Consequence: importing a module named for the intro into
  the DC-9 chapter, which is a naming smell accepted over renaming owner-approved intro code.
- **The fanfare's AudioContext is released on a timer, not on unmount** — 2026-08-23. Taking the key
  immediately would otherwise cut the chord off mid-note.
- **No mute control was added for it** — 2026-08-23. The intro's mute and volume are local component
  state, so there is no global sound preference to honour and inventing one is beyond what was
  asked. Flagged as an open question rather than guessed at.

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

## Round two evidence

- Strip lift rendered at 0.030 / 0.038 / 0.045 against the shipped 0.320 and compared side by side
  before choosing; final at 1440 / 768 / 375 in `preview-renders/dc9-strip-key-polish/`.
- Key click rectangle measured at 1440: **80x80 circle → 220x204 rectangle** at 15% padding, then
  trimmed to 8% because the key lies diagonally and its axis-aligned box is already generous.
- Cue journey re-measured at all three widths after the remaining-travel change, including the
  mid-pan pose that the angular threshold had broken: **1440 start `right`, mid-pan `right`, after
  the pan `down`, after looking down none** — and `right → down → none` at 768 and 375.
- Fanfare asserted in the browser by recording what the page starts on its AudioContext: one
  context, three triangle oscillators, one square, one noise source — and **nothing at all before
  the card opens**. Run against a production build, which confirms React StrictMode's development
  double-invoke does not ship.
- `npx vitest run` — **435 passed across 34 files** (was 425; ten new tests across the route strip,
  the collider fit and the fanfare descriptor).

**Working-tree note.** A sibling Claude session briefly switched this shared checkout to
`origin/main` and back while some of the round-two captures were running. The tree was verified
file-by-file afterwards, the dev server restarted and confirmed to be serving the current sources,
and every browser measurement re-run — all reproduced byte-identical. Screenshots taken in that
window were re-captured rather than trusted.

## Outcome and handoff

**Awaiting owner review.** The fanfare was reported inaudible after round two and is fixed in
round three; everything else in this plan landed as described. Limitations, stated plainly:

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
- **The key fanfare has no mute.** It is the only sound outside the intro, and the intro's own mute
  is component-local, so there is nothing to inherit. If the owner wants one it needs a real
  game-wide sound preference, which is its own small piece of work.
- Two more runtime corrections now sit on top of the shipped GLB — the strip lift and the collider
  fit — alongside the key's quarter turn. All three are deleted by one asset rebuild;
  `applyDc9RouteStripLift`, `fitDc9KeyColliderToKey` and `applyDc9KeyYawCorrection` are the three
  call sites, and `tools/assets/check-models.mjs` pins the strip's shipped translation to 0.32.
- At 375x812 the key ends up partly behind the fullscreen and help buttons in the bottom-right
  corner once it is in view. The look-down cue was moved clear of them; the key itself was not,
  because that is the stage's approved framing.
