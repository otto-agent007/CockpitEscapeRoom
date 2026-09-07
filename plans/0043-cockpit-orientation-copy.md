# First-entry cockpit orientation and natural player copy

> **For agentic workers:** Execute this plan task-by-task with `superpowers:executing-plans`.
> Keep this document current after every RED/GREEN checkpoint.

**Goal:** Give the player one automatic 4.5-second look around each cockpit before its first
interaction, skip those tours on resume, and remove repetitive simulator/non-operational language
from the player-facing experience.

**Architecture:** Schema 16 persists independent DC-9 and Airbus orientation-completion flags.
A pure keyframe sampler supplies bounded camera offsets to the existing seat-specific camera
controllers, while App owns readiness, reduced-motion/fallback completion, HUD/input gating, and
the accessible skip overlay. Existing internal simulator identifiers remain stable.

**Tech stack:** React 19, TypeScript, React Three Fiber, Three.js, Vitest, Playwright, Vite.

**Spec:** `docs/superpowers/specs/2026-09-06-cockpit-orientation-copy-design.md`

## Global constraints

- Preserve the DC-9 first-officer/right-seat and Airbus A320 captain/left-seat contracts.
- Each normal-motion tour lasts 4.5 seconds and plays only until its completion or skip is saved.
- Reduced-motion and accessible-fallback paths have no animated delay.
- No WebGL, HTML, or keyboard gameplay input may advance state beneath an active tour.
- Remove the retired wording from player-visible runtime/display copy and visitor-facing living
  docs, but do not rename internal identifiers or rewrite historical evidence.
- Do not change GLBs, Blender sources, camera nodes, puzzle rules, reward gates, or dependencies.
- Preserve unrelated work and keep this branch independent from PR #71.

## Purpose

The existing cockpit assets open immediately into instructions. The short orientation establishes
the correct seat, lets the art breathe, and makes the first interaction feel like entering a place
rather than landing on a quiz panel. Removing repeated warnings keeps the tribute conversational;
the repository's safety policy still prevents operational training content.

## Current state

- `Dc9SeatLookControls` and `AirbusCameraDirector` now layer independent 4.5-second orientation
  offsets over their seat-correct authored camera poses and settle back to exact zero offset.
- `GameState` schema 16 persists independent DC-9 and Airbus orientation completion flags.
- App uses real-3D readiness, accessible fallbacks, reduced motion, and loader visibility as the
  authoritative inputs for starting or bypassing a tour, and gates HUD/input until completion.
- Player-visible retired wording has been replaced in runtime displays and current living docs;
  internal simulator identifiers remain unchanged as intended.
- The checkout began clean on `fix/dc9-memphis-route-markings`; this work was moved to
  `feat/cockpit-orientation-copy` at `origin/main` before any feature files changed.

## Scope

Included:

- schema-16 persisted orientation flags and migration;
- pure DC-9 and Airbus tour sampling;
- first-entry orchestration, overlay, skip, reduced-motion and fallback behavior;
- scene input/HUD gating and browser-readable camera-tour evidence;
- player-facing copy cleanup in runtime displays and current visitor/living docs;
- focused unit/component/browser tests and responsive screenshots;
- this plan and `TEST_REPORT.md` evidence.

Excluded:

- internal `airbusSimulator` names, CSS selectors, hooks, types, and filenames;
- historical plan/report/spec copy;
- cockpit or airport asset edits;
- changes to the existing familiarization-to-Storm Flight camera transition;
- visual redesign outside the orientation overlay.

## Context and interfaces

The persistence interface added by milestone 1 is:

```ts
export type CockpitOrientationId = 'dc9' | 'airbus'

export interface CockpitOrientationSeen {
  dc9: boolean
  airbus: boolean
}

type GameAction =
  | { type: 'COMPLETE_COCKPIT_ORIENTATION'; cockpit: CockpitOrientationId }
  // existing actions continue unchanged
```

The pure scene interface added by milestone 2 is:

```ts
export const COCKPIT_ORIENTATION_DURATION_SECONDS = 4.5

export interface CockpitOrientationOffset {
  yawRadians: number
  pitchRadians: number
  leanMeters: number
  fovDegrees: number
  progress: number
  complete: boolean
}

export function sampleCockpitOrientation(
  cockpit: CockpitOrientationId,
  elapsedSeconds: number,
): CockpitOrientationOffset
```

`PrototypeScene` consumes `activeCockpitOrientation: CockpitOrientationId | null` and
`onCockpitOrientationComplete(cockpit)`. Canvas evidence uses
`data-cockpit-orientation="dc9|airbus|idle"` and normalized
`data-cockpit-orientation-progress="0.0000..1.0000"`.

## Progress

- [x] 2026-09-06 — Approved design recorded and committed as `06bed97` on the dedicated branch.
- [x] 2026-09-06 — Milestone 1 schema-16 persistence completed RED then GREEN.
- [x] 2026-09-06 — Milestone 2 pure 4.5-second camera timelines completed RED then GREEN.
- [x] 2026-09-07 — Milestone 3 first-entry overlay, camera integration, and input gates completed
  RED then GREEN.
- [x] 2026-09-07 — Milestone 4 player-visible wording removed and contract-tested.
- [x] 2026-09-07 — Milestone 5 local browser/responsive proof, checks, review, and evidence
  completed. Hosted preview and owner gate remain separate.

## Discoveries

- 2026-09-06 — A session-only flag cannot satisfy the approved resume behavior. A reload before
  the first puzzle input would have no durable evidence that the tour finished, so schema 16 is
  necessary.
- 2026-09-06 — The Airbus already has a separate 1.25-second interaction-to-Storm camera move.
  The entry orientation must wrap only the authored interaction pose and leave that transition
  unchanged.
- 2026-09-06 — The current branch at task start carried completed Memphis-marking work and PR #71.
  A new branch from `origin/main` avoids mixing those unrelated commits.
- 2026-09-06 — TypeScript's strict indexed-access setting cannot infer that a general readonly
  keyframe array is non-empty. Modeling each timeline as a tuple with at least two frames and
  walking adjacent frames expresses the real invariant without assertions in production code.
- 2026-09-07 — Existing browser fixtures that seed directly into a cockpit must declare whether
  they represent first arrival or post-orientation play. The production Airbus placement fixture
  now explicitly sets both flags true so its existing assertion continues after the entry gate.
- 2026-09-07 — React compiler lint began checking manual memoization dependencies in `App` once
  the new orientation values crossed callback boundaries. Adding the stable state setters to the
  affected dependency lists preserved behavior and satisfied the compiler without disabling it.
- 2026-09-07 — The software WebGL renderer could race a direct 1440 px startup capture. Starting
  the evidence page at 768 px, resizing to 1440 px, and allowing one render turn produced a stable
  full-resolution capture without changing production behavior.

## Decision log

- 2026-09-06 — Persist `{ dc9, airbus }` booleans in `GameState`, rather than infer seen state
  from puzzle inputs. Consequence: reload after an untouched first screen still skips correctly.
- 2026-09-06 — Existing saves infer orientation completion from phase: briefing = neither; DC-9
  or locker = DC-9; Airbus/reward/Mars = both. Consequence: existing players resume without an
  unexpected cinematic replay.
- 2026-09-06 — Keep internal simulator terminology as a code contract. Consequence: copy cleanup
  stays player-visible and avoids a broad, low-value rename.
- 2026-09-06 — Provide a keyboard-reachable skip control. Consequence: the tour is automatic but
  never traps a player behind motion.

## Milestones and implementation steps

### Milestone 1: Durable first-entry state

Observable result: the reducer can complete each tour independently, restart resets both, and
every supported save version loads into schema 16 with safe orientation flags.

Files:

- Modify `src/game/state.ts`.
- Modify `src/game/state.test.ts`.
- Modify `src/game/storage.ts`.
- Modify `src/game/storage.test.ts`.

Steps:

- [x] Add reducer tests that expect fresh `{ dc9: false, airbus: false }`, dispatch each
  `COMPLETE_COCKPIT_ORIENTATION`, prove idempotence and unrelated-progress preservation, and prove
  `RESET` returns both to false.
- [x] Run `npm test -- src/game/state.test.ts` and record the expected RED caused by the missing
  field/action.
- [x] Add storage tests for schema-16 round-trip; schema-15 phases `briefing`, `dc9`, `locker`,
  `airbus`, `reward`, `mars`; and corrupt/missing schema-16 orientation values.
- [x] Run `npm test -- src/game/storage.test.ts` and record the expected RED caused by missing
  schema-16 normalization.
- [x] Implement `CockpitOrientationId`, `CockpitOrientationSeen`, the schema bump, initial state,
  and the completion action in `state.ts`.
- [x] In `storage.ts`, add a phase-based `inferredCockpitOrientationSeen(phase)` helper; normalize
  schema 16 only when both saved values are booleans, otherwise use inference; add inferred flags
  to every older-version normalization result; update `CanonicalV8State` to omit the new field.
- [x] Re-run both focused files and require GREEN before continuing.

### Milestone 2: Pure seat-fixed camera timelines

Observable result: both tours move across distinct cockpit views for exactly 4.5 seconds and settle
without overshoot at zero offset.

Files:

- Create `src/scenes/cockpitOrientation.ts`.
- Create `src/scenes/cockpitOrientation.test.ts`.

Steps:

- [x] Write tests for the public interface above: clamp negative time to progress 0, reach complete
  at 4.5 seconds, return exact zero yaw/pitch/lean/FOV offset at completion, produce at least three
  distinct intermediate poses per aircraft, stay inside DC-9 and Airbus tour bounds, and remain
  continuous on both sides of every keyframe.
- [x] Run `npm test -- src/scenes/cockpitOrientation.test.ts` and record RED because the module is
  absent.
- [x] Implement a small keyframe table per aircraft, smoothstep interpolation, finite-time
  normalization, and exact endpoint handling. Keep the DC-9 and Airbus keyframes separate so visual
  tuning cannot mix aircraft-specific composition.
- [x] Re-run the focused test and require GREEN.

### Milestone 3: Tour orchestration, overlay, cameras, and gates

Observable result: each real cockpit waits for scene readiness, tours once, settles, persists, and
allows skip; reduced-motion and accessible fallbacks start immediately.

Files:

- Create `src/components/CockpitOrientation.tsx`.
- Create `src/game/cockpitOrientationState.ts` and
  `src/game/cockpitOrientationState.test.ts` for pure activation decisions; the current Vitest
  suite has no DOM renderer, so Playwright owns the overlay DOM contract.
- Modify `src/App.tsx`.
- Modify `src/scenes/PrototypeScene.tsx`.
- Modify `src/styles.css`.
- Modify `src/components/dc9/Dc9Chapter.tsx` only if it needs an explicit `interactionEnabled` prop.

Steps:

- [x] Write the smallest failing test for orientation activation: first-entry + scene-ready +
  unseen activates; loader/not-ready, seen, reduced-motion, and fallback do not. Prefer a pure
  exported decision helper if App cannot be tested without mocking scene loaders.
- [x] Run that focused test and record RED.
- [x] Implement the overlay with heading, one-sentence status, progress semantics, and a native
  **Skip cockpit tour** button. Keep it outside the canvas.
- [x] Gate DC-9 `useDc9FlightControls`, `Dc9Chapter`, WebGL raycasters/drag/look, Airbus HUD/cards,
  and Airbus WebGL targets while the matching tour is active.
- [x] Pass the active tour to `PrototypeScene`. In `Dc9SeatLookControls` and
  `AirbusCameraDirector`, sample elapsed rendered time, apply the tour to the appropriate authored
  base camera, publish the data attributes, settle exactly, and call completion once.
- [x] Add immediate completion effects for reduced motion, `skip3d=1`, and explicit accessible
  fallback. Make the skip handler dispatch the same completion action.
- [x] Re-run focused state/component/scene tests and require GREEN.

### Milestone 4: Natural player copy

Observable result: player UI, canvas-generated displays, README, and current living design docs no
longer present the retired terminology.

Files:

- Modify `src/components/Hud.tsx`.
- Modify `src/components/dc9/MemphisDeparturePanel.tsx`.
- Modify `src/components/QualificationCelebration.tsx`.
- Modify `src/game/state.ts`.
- Modify `src/game/airbusRouteGuidance.ts`.
- Modify `src/scenes/PrototypeScene.tsx`.
- Modify affected focused tests.
- Modify `README.md`, `docs/GAME_DESIGN.md`, and `docs/VISUAL_REALISM.md`.

Steps:

- [x] Add or update assertions for `Captain Challenges`, `Challenge paused`, `Captain task`, the
  shorter Memphis memory label, `ENG 1`, and natural completion/status copy.
- [x] Add Playwright assertions at the Memphis header, Captain Challenges hub, Storm Line,
  Engine-Out, pause modal, workload prompt, and qualification celebration. Each assertion checks
  the real rendered DOM wording and fails against the current UI.
- [x] Run the focused browser cases and record RED with the current phrases.
- [x] Apply the exact copy replacements approved in the spec. Preserve deliberate instructor
  action and no-blame framing without repeating disclaimers.
- [x] Re-run the focused browser cases and require GREEN. Inspect the generated PFD/ND/ECAM text
  in a real browser frame, then run `rg` manually across the player-facing runtime-file allowlist
  and three current docs and record zero hits. This is a completion audit, not a source-grep test.

### Milestone 5: Browser proof and repository verification

Observable result: the two first-entry tours and every bypass/resume path work in the actual game,
the layouts remain usable, and repository checks pass.

Files:

- Create or modify the smallest suitable Playwright spec under `e2e/`.
- Add screenshots under `preview-renders/cockpit-orientation/`.
- Modify `TEST_REPORT.md`.
- Update this plan's Progress, Discoveries, Evidence, and Outcome sections.

Steps:

- [x] Start the production preview using the repository's existing Playwright web-server flow or
  `npm run preview` on a unique port.
- [x] Fresh normal-motion path: complete **PRESS START**, assert the DC-9 orientation overlay,
  changing camera data, gated first control, completion near 4.5 seconds, settled pose, saved flag,
  and no replay after reload.
- [x] Seed the final locker handoff, select **Enter Pop T Captain Mode**, and assert equivalent
  Airbus behavior; then prove **Begin Storm Line** still uses its existing 1.25-second transition.
- [x] Prove keyboard focus/activation of **Skip cockpit tour** for both aircraft and saved no-replay.
- [x] Prove reduced-motion and `skip3d=1` paths expose gameplay without an animated wait.
- [x] Capture normal-motion orientation and settled frames at approximately 375, 768, and 1440 CSS
  pixels; inspect overflow, overlay readability, seat identity, and controls after settlement.
- [x] Exercise relevant correct, wrong, repeated-wrong, hint, reload, and keyboard paths in the
  nearby DC-9 control-check/instrument and Airbus familiarization tests.
- [x] Run focused Vitest; `npm run check`; relevant Playwright journey/DC-9/Airbus subsets;
  `npm run assets:check`; and `git diff --check`.
- [x] Review the complete diff for progress loss, duplicate completion, input leakage, stale copy,
  unsafe DOM insertion, unnecessary dependencies, asset-contract drift, and Model Y spoilers.
- [x] Repair each finding from root cause, rerun its failed check plus nearby regression checks,
  and record exact evidence below.

## Validation plan

- Unit: reducer idempotence/isolation, schema migration and corrupt-save recovery, pure tour timing,
  interpolation bounds/endpoints, activation decisions, copy allowlist.
- Browser: actual camera movement, 4.5-second completion, input lock, skip, persisted reload, both
  chapter handoffs, reduced motion, fallback, and unchanged Storm transition.
- Gameplay regression: correct/wrong/repeated-wrong/hint/keyboard/reload paths relevant to the first
  DC-9 and Airbus interactions.
- Responsive: 375, 768, and 1440 widths during the tour and after controls appear.
- Repository: lint, typecheck, Vitest, build, assets, diff check, and full-diff review.

## Acceptance criteria

- A fresh DC-9 entry and first Airbus entry each show one 4.5-second seat-correct camera sweep before
  gameplay can advance.
- Completion and skip persist independently; a completed tour never replays on reload/resume.
- Reduced motion and accessible fallback have no moving-tour delay.
- The later Airbus Storm Flight transition is unchanged.
- Player-visible runtime/display copy and named current docs contain none of the retired wording;
  internal identifiers and historical evidence remain intact.
- No puzzle progress, persistence safety, accessibility path, reward protection, or asset contract
  regresses.
- Focused checks, `npm run check`, relevant browser paths, `npm run assets:check`, and diff review
  pass with evidence recorded below.

## Repair loop and stop conditions

For each milestone: review current state → write one focused failing test → run and confirm the
expected RED → implement the smallest production change → rerun GREEN → inspect remaining delta.
Repeat until all acceptance checks pass, five attempts produce the same unchanged failure, the delta
stops shrinking, or a genuine owner visual decision is required. Never weaken a test to accommodate
an implementation defect and never claim an unrun check passed.

## Evidence

- 2026-09-06 — Initial branch/status: `feat/cockpit-orientation-copy...origin/main [ahead 1]`;
  only the approved design commit `06bed97` was present before plan creation.
- 2026-09-06 — Milestone 1 RED: `state.test.ts` failed 1/68 because
  `cockpitOrientationSeen` was absent; `storage.test.ts` failed 10/86 on schema 16, phase-based
  migration, round-trip, and corrupt-field recovery.
- 2026-09-06 — Milestone 1 GREEN: `npm test -- src/game/state.test.ts
  src/game/storage.test.ts` passed 154/154; `npm run typecheck` and `git diff --check` exited 0.
- 2026-09-06 — Milestone 2 RED: `npm test -- src/scenes/cockpitOrientation.test.ts` failed to
  import the absent module. GREEN: 6/6 tests passed. The first strict typecheck then identified
  an unexpressed non-empty-array invariant; after the tuple repair, the same 6/6 test run,
  `npm run typecheck`, and `git diff --check` exited 0.
- 2026-09-07 — Milestone 3 RED: the focused activation test failed to import the absent
  `cockpitOrientationState` module. GREEN: 7/7 activation-decision tests passed, including scene
  readiness, loaders, saved state, reduced motion, and accessible fallback.
- 2026-09-07 — Milestone 4 RED: the focused player-copy browser test could not find `Captain
  Challenges` against the previous copy. GREEN: the final focused copy/workload run passed 2/2;
  the manual player-facing allowlist audit returned zero retired-term matches.
- 2026-09-07 — Expanded focused Vitest passed 186/186. `npm run check` passed lint, typecheck,
  596/596 tests across 46 files, and the production build. `npm run assets:check` exited 0 with
  only its existing informational model-validator output.
- 2026-09-07 — Dedicated orientation Playwright passed 4/4: normal DC-9 and Airbus camera motion,
  progress semantics, HUD/input gating, 4.5-second completion, persisted no-replay, keyboard skip,
  reduced motion, accessible fallback, and the unchanged Airbus `transitioning` to `storm` camera
  transition. Relevant DC-9 journey/control-check regression passed 7/7; the production Airbus
  placement/camera case passed 1/1; nearby Airbus challenge regressions passed after narrowing one
  pre-existing ambiguous text locator.
- 2026-09-07 — Twelve orientation/settled screenshots passed and were inspected at 375, 768, and
  1440 px. They show readable overlays, correct right/left seat composition, no gameplay HUD during
  travel, and no horizontal overflow after settlement. Evidence is in
  `preview-renders/cockpit-orientation/`.
- 2026-09-07 — Full-diff review repaired an accidental effect dependency change and added explicit
  progressbar semantics. No unsafe DOM insertion, dependency addition, asset edit, progress loss,
  duplicate completion, input leakage, or Model Y spoiler was found. Final reruns are recorded in
  `TEST_REPORT.md`.

## Outcome and handoff

The requested local implementation and verification are complete. Both tours run once for 4.5
seconds in their correct seats, save independently, allow keyboard skip, and bypass motion for
reduced-motion or accessible fallback. The retired player-facing wording is gone from the approved
runtime/docs scope. No GLB, Blender source, dependency, deployment, push, or PR was changed. A
hosted Vercel preview and formal owner visual gate remain pending explicit publication approval.
