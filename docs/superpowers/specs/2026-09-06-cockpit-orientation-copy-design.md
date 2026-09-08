# Cockpit Orientation and Player Copy Design

## Goal

When a player enters the DC-9 or Airbus cockpit for the first time, the loaded scene gives them
a short automatic look around the flight deck before presenting the first interaction. Each tour
runs once, lasts about 4.5 seconds, remains anchored to the correct seat, and does not replay when
an in-progress game is reloaded or resumed.

Player-facing copy no longer repeats `simulator`, `SIM`, `non-operational`, or equivalent warning
labels. The experience speaks naturally about memories, Captain Mode, challenges, checkpoints,
and training events. Internal TypeScript identifiers and historical evidence retain their current
names because renaming those does not change anything the player sees.

## Current behavior

- The console cinematic hands directly to the DC-9 control check. Once the GLB loader clears,
  `Dc9SeatLookControls` immediately settles on the down-and-inboard yoke view and the control panel
  is interactive.
- The Captain's Locker hands directly to the Airbus five-card familiarization. Once the Airbus GLB
  loader clears, `AirbusCameraDirector` holds the authored left-seat interaction camera and the
  qualification HUD is interactive.
- Neither chapter records whether a cockpit introduction has already played, so a reliable
  first-entry-only tour needs a persisted state field and a schema migration.
- Player-facing disclaimer language appears in the Memphis header, Airbus HUD and status messages,
  qualification celebration, and the generated Airbus PFD/ND/ECAM textures. The same product
  wording also appears in `README.md` and current living design/realism documentation.
- The implementation uses `airbusSimulator` in reducer state, hooks, tests, CSS class names, and
  filenames. Those are implementation contracts rather than visible copy.

## Player experience

### DC-9 first-officer orientation

After **PRESS START**, the existing chapter loader finishes before the tour begins. From the fixed
first-officer/right-seat eye point, the camera starts on a readable forward-panel composition,
looks across the central/captain-side panel, glances toward the right-seat controls and surrounding
cockpit, then settles onto the existing control-check yoke composition. The camera rotates and makes
only the restrained lean/FOV changes needed for the sweep; it never becomes a free-flight camera.

The DC-9 control-check panel and both WebGL and HTML controls remain unavailable until the tour
finishes or the player chooses **Skip cockpit tour**. A compact overlay announces
**DC-9 cockpit orientation** and exposes that skip action.

### Airbus captain orientation

After **Enter Pop T Captain Mode**, the existing Airbus loader finishes before the tour begins.
From the fixed captain/left-seat eye point, the camera starts forward, sweeps across the main flight
displays and center controls, acknowledges the captain-side sidestick/side area, and settles on the
existing five-card familiarization composition. It does not use the tighter Storm Flight camera;
that later transition keeps its current behavior.

The Airbus qualification cards, 3D targets, and HTML controls remain unavailable until the tour
finishes or is skipped. The matching overlay announces **Airbus A320 cockpit orientation**.

### Duration, skip, and accessibility

- Each animated tour is 4.5 seconds from the first rendered orientation frame to the settled
  gameplay pose.
- **Skip cockpit tour** ends the tour immediately, persists completion, and settles the camera at
  the normal first-gameplay pose.
- `prefers-reduced-motion: reduce` does not play or delay the sweep. It immediately settles the
  camera, records the tour as complete, and presents gameplay.
- The static accessible cockpit fallback also records completion immediately; it never waits for
  a WebGL animation that cannot run.
- Tour state is not puzzle progress. Skipping or completing a tour awards nothing and cannot erase
  any completed puzzle step.

## Persistence and state

Schema 16 adds one durable field to `GameState`:

```ts
cockpitOrientationSeen: {
  dc9: boolean
  airbus: boolean
}
```

`createInitialGameState()` and a full restart initialize both values to `false`. A new
`COMPLETE_COCKPIT_ORIENTATION` action accepts `dc9 | airbus` and changes only the selected flag.
The normal `useGame` save path persists the update.

Migration from schema 15 and earlier infers completion from the saved journey so existing players
do not receive a surprise replay:

- `briefing`: both flags are `false`;
- `dc9` or `locker`: DC-9 is `true`, Airbus is `false`;
- `airbus`, `reward`, or `mars`: both flags are `true`.

The canonical validator accepts only explicit booleans. Corrupt or missing orientation data is
reconstructed with the same phase-based inference instead of discarding otherwise valid progress.

## Camera architecture

A small pure scene module owns the normalized 4.5-second tour timelines. It returns bounded yaw,
pitch, lean, and FOV offsets for a supplied aircraft and elapsed time. Keyframes use smooth easing,
remain inside deliberately restrained seat-view limits, and end exactly at the existing gameplay
pose. Unit tests can therefore prove duration, bounds, continuity, and endpoints without WebGL.

`App.tsx` derives the active tour from phase, persisted flags, reduced-motion preference, fallback
state, and scene readiness. It owns the completion dispatch and renders the accessible overlay.
`PrototypeScene` receives the active aircraft tour and passes it to the matching camera controller.

`AirbusCameraDirector` applies the tour offsets to the authored interaction camera before its
existing `familiarization | qualified | transitioning | storm` logic. `Dc9SeatLookControls` applies
the DC-9 tour before enabling manual pointer/wheel look. Both publish a small canvas data contract
containing tour state and normalized progress so browser tests can verify actual rendered-camera
movement without relying only on elapsed wall-clock time.

While a tour is active, App-level HUD rendering and scene-level hit handling are both gated. This
double gate prevents keyboard, HTML, or WebGL input from advancing gameplay beneath the overlay.

## Player-facing copy changes

Visible wording uses these replacements:

- `1995 MEMORY · Fictional — non operational` becomes `1995 MEMPHIS MEMORY`.
- `Simulator Hub` becomes `Captain Challenges`.
- `Back to Simulator Hub` becomes `Back to Captain Challenges`.
- `Simulator exercise · Non operational` becomes `Pop T Captain challenge`.
- `Storm Line flight simulator` and `Engine-Out Handling simulator` become `Storm Line challenge`
  and `Engine-Out Handling challenge` in accessible labels.
- `Simulator paused` becomes `Challenge paused`.
- `Captain task · SIM — NON OPERATIONAL` becomes `Captain task`.
- `SIMULATOR — NON OPERATIONAL` and `SIM — NON OP` on generated displays become restrained Captain
  Mode labels or are removed where a label adds no information.
- `SIM ENG 1` becomes `ENG 1`; explanations continue to say that the instructor deliberately
  reduces power for the challenge, preserving the established no-blame framing.
- Completion and reducer status messages use `challenge` or `Captain Challenges` rather than
  `simulator`.

`README.md`, `docs/GAME_DESIGN.md`, and `docs/VISUAL_REALISM.md` are reconciled to the new visible
wording. Safety constraints remain in `AGENTS.md`, `BLUEPRINT.md`, technical comments, internal
identifiers, and historical plans/reports; this feature removes repetitive player presentation,
not the repository's rule against operational instruction.

## Error and edge behavior

- A scene-load failure retains the existing retry/accessibility choices. Selecting the accessible
  fallback completes the relevant tour and exposes the native interaction path.
- A tab visibility change or a very slow frame does not advance puzzle state. Camera progress is
  clamped, and completion fires at most once.
- Resizing during the tour recomputes the normal wide/narrow base pose while preserving normalized
  progress; the camera still settles at the correct viewport-specific gameplay FOV.
- Reloading before the final tour frame may replay that tour because completion has not yet been
  earned. Reloading after completion or skip begins gameplay immediately.
- Existing saved games migrate as already-seen according to their phase, protecting resume flow.

## Files and boundaries

Expected production changes:

- `src/game/state.ts` and `src/game/storage.ts`: schema-16 state, action, migration, validation.
- `src/scenes/cockpitOrientation.ts`: pure duration/keyframe sampling.
- `src/scenes/PrototypeScene.tsx`: camera integration, input gating, display text cleanup, browser
  data attributes.
- `src/App.tsx`: tour orchestration, immediate reduced-motion/fallback completion, HUD gate.
- A focused component under `src/components/`: orientation overlay and skip control.
- `src/components/Hud.tsx`, `src/components/dc9/MemphisDeparturePanel.tsx`,
  `src/components/QualificationCelebration.tsx`, `src/game/airbusRouteGuidance.ts`: visible copy.
- `src/styles.css` and `src/components/dc9/dc9Chapter.css` only as needed for the overlay and input
  gate; no broad visual restyle.
- `README.md`, `docs/GAME_DESIGN.md`, `docs/VISUAL_REALISM.md`, the active ExecPlan, and
  `TEST_REPORT.md`: current behavior and evidence.

Internal `airbusSimulator` types, hooks, CSS selectors, test descriptions, and filenames are out of
scope unless changing one is required for a player-visible assertion. Historical plans, reports,
and dated specifications remain untouched as evidence.

No production dependency, GLB, Blender source, camera node, asset contract, puzzle rule, or reward
gate changes.

## Verification

Test-driven implementation covers:

1. Reducer tests for independent DC-9/Airbus completion, idempotence, restart reset, and no puzzle
   progress mutation.
2. Storage tests for fresh schema 16 saves; phase-based migration from earlier schemas; corrupt
   orientation recovery; and completed-tour reload behavior.
3. Pure camera tests proving 4.5-second duration, both tours moving through more than one distinct
   pose, bounded offsets, smooth endpoints, and exact settlement at the gameplay pose.
4. Component/source-contract tests proving the overlay labels and the absence of the retired words
   from player-facing source and generated display copy.
5. Browser tests from a fresh game proving the DC-9 tour runs after **PRESS START**, camera state
   changes, controls remain gated, the final pose settles, and reload does not replay it.
6. Browser tests from the locker-to-Airbus handoff proving the equivalent Airbus behavior without
   altering the later Storm Flight camera transition.
7. Reduced-motion and static-fallback browser paths proving no animated delay.
8. Keyboard-only skip and first required interaction for both cockpits.
9. Responsive browser inspection near 375, 768, and 1440 CSS pixels, with consistent screenshots
   of the tour and settled gameplay frames.

Run focused Vitest and Playwright checks first, then `npm run check`, the relevant journey/DC-9/
Airbus browser subsets, and `npm run assets:check`. Review the complete diff for input leakage,
progress loss, duplicate completion, stale copy, Model Y spoilers, and unrelated branch content.

## Acceptance criteria

- A new game shows one automatic 4.5-second DC-9 right-seat cockpit orientation after the cockpit
  loads and before the control check is interactive.
- The first Airbus entry shows one automatic 4.5-second left-seat cockpit orientation before the
  five-card familiarization is interactive.
- Each tour can be skipped by mouse or keyboard and never replays after completion/skip on reload.
- Reduced-motion and accessible-fallback players begin immediately at the settled pose.
- Existing schema-15 and older saves resume without replaying cockpits already reached.
- Player-facing runtime copy, rendered Airbus displays, README, and current living visual/design
  docs contain no `simulator`, `SIM`, `non-operational`, `non operational`, or `not operational`
  presentation language.
- Internal identifiers and historical evidence remain intact.
- DC-9 progress, Airbus qualification/scenarios, later Storm camera transition, locker handoff,
  reward protection, and full restart retain their existing behavior.
- Focused tests, `npm run check`, relevant browser paths, responsive visual inspection, and
  `npm run assets:check` pass with actual evidence recorded in the ExecPlan and `TEST_REPORT.md`.
