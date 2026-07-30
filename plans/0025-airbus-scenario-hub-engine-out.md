# Airbus Scenario Hub and Engine-Out Handling

> For agentic workers: use `superpowers:executing-plans` and execute this plan inline, one test-first checkpoint at a time. Preserve unrelated work in the shared workspace.

Status: Active
Owner: Codex
Created: 2026-07-30
Design authority: `docs/superpowers/specs/2026-07-30-airbus-flightgear-scenario-hub-design.md`

## Purpose

Evolve Airbus A320 Pop T Captain gameplay from one drag-and-drop qualification followed by one flight exercise into a compact two-scenario simulator chapter. After the mandatory five-card qualification, the player enters a cockpit-preserving Simulator Hub, completes Storm Line, unlocks Engine-Out Handling, and completes that second exercise to finish the Airbus chapter.

Engine-Out Handling is a deliberate, fictional cruise-training simulation inside the safely parked commemorative aircraft. It teaches calm directional control, energy management, and a safe diversion decision without presenting an accident, random failure, operational procedure, or pilot blame.

## Prompt contract

### Goal

The player can complete the mandatory Airbus qualification, choose the ready Storm Line exercise from a simulator hub, return to the hub after Storm Line, unlock and complete Engine-Out Handling with keyboard, gamepad, or native HTML controls, receive clear cockpit and instructor feedback, recover safely from local mistakes, and only then advance to the existing protected reward.

### Context

- Approved design: `docs/superpowers/specs/2026-07-30-airbus-flightgear-scenario-hub-design.md`
- Existing Airbus progression: `src/game/state.ts`, `src/game/storage.ts`
- Existing Storm rules/runtime: `src/game/airbusSimulator.ts`, `src/game/useAirbusSimulator.ts`
- Existing Airbus UI: `src/components/Hud.tsx`, `src/App.tsx`
- Existing cockpit renderer: `src/scenes/PrototypeScene.tsx`
- Existing camera and weather adapters: `src/scenes/airbusCameraRig.ts`, `src/scenes/airbusStormVisuals.ts`
- Existing browser exercise: `e2e/airbus-storm-line.spec.ts`
- Current visual milestone: `plans/0024-airbus-storm-flight-view.md`

### Constraints

- Leave Tesla/Model Y gameplay, assets, copy, thumbnails, and transformation code unchanged.
- Preserve Model Y spoiler protection; the Simulator Hub contains no reward imagery or hints.
- Keep the five-card drag-and-drop qualification mandatory.
- Treat Storm Line and Engine-Out as pure, separate scenario state machines.
- Keep rules and durable progression outside React Three Fiber presentation.
- Feed keyboard, gamepad, and native HTML controls through one normalized input contract.
- Mirror every required 3D interaction with native HTML controls.
- Keep one fixed-step authoritative simulation frame. Publish HTML telemetry no faster than 10 Hz.
- Persist only durable scenario progress, never Three.js, DOM, audio, or animation objects.
- Preserve existing Blender-authored Airbus camera and corrected PFD, ND, and ECAM geometry.
- Do not change the Blender source or generated Airbus GLB unless browser evidence proves a source-authoritative visual repair is necessary.
- Add no production dependency.
- Use fictional, non-operational labels and corridors.
- Respect reduced motion and opt-in audio; captions always carry gameplay information.
- Preserve unrelated dirty-worktree changes and stage commits by exact path.

### Done when

- Qualification opens the Simulator Hub rather than directly completing or starting Airbus flight gameplay.
- Storm Line is initially ready and Engine-Out is visibly locked.
- Completing Storm Line records its traits, returns to the hub, and unlocks Engine-Out without completing Airbus on a new save.
- Engine-Out runs Recognition, Stabilization, Diversion, and Debrief stages from deterministic rules.
- Five cumulative seconds outside the active envelope produces focused feedback and retries only the current Engine-Out checkpoint.
- Completing Engine-Out records traits, marks Airbus complete, and leaves the existing reward handoff intact.
- Schema-v10 completed/reward saves migrate without losing completion and may replay both scenarios.
- Corrupt Engine-Out progress returns safely to the hub without erasing qualification or earned Storm progress.
- Keyboard, gamepad, HTML hold controls, pause, retry, recenter, reload, captions, and reduced-motion paths work.
- Focused unit tests, lint, typecheck, build, and relevant browser tests pass.
- A fresh 1440×900 browser proof is presented for the Airbus left-seat interaction approval gate before the milestone is called complete.

## Current state

- Branch `agent/airbus-gameplay-evolution` contains the mandatory qualification and Storm Flight implementation.
- `src/game/airbusSimulator.ts` is a deterministic three-checkpoint Storm Line state machine.
- `src/game/useAirbusSimulator.ts` owns Storm keyboard/gamepad/HTML input and a 60 Hz fixed-step loop.
- `src/components/Hud.tsx` switches from qualification directly to a Storm briefing/HUD.
- `src/scenes/PrototypeScene.tsx` reads Storm state and input refs to animate the cockpit, weather, PFD, ND, and ECAM.
- `COMPLETE_AIRBUS_STORM_LINE` currently adds `airbus` to `completedPuzzles`; this must change for new progression.
- Persisted state is schema 10 and has no scenario hub or Engine-Out durable progress.
- The workspace includes uncommitted Airbus visual and Storm implementation work from the current milestone. Those files are authoritative context and must not be discarded.

## Scope

### In scope

- Airbus scenario identifiers, hub status, reducer actions, and completion gating.
- Schema 11 migration and corrupt-save normalization.
- Deterministic Engine-Out cruise exercise and traits.
- Shared normalized Airbus input, including directional balance.
- Scenario-aware runtime orchestration.
- Simulator Hub, Engine-Out HUD, native controls, captions, pause, retry, and debrief.
- Scenario-aware PFD, ND, ECAM, cockpit controls, and restrained exterior cues.
- Focused unit, persistence, component/browser, accessibility, and visual evidence.
- Living updates to this plan and `TEST_REPORT.md`.

### Out of scope

- Tesla/Model Y implementation changes.
- Landing, takeoff, free flight, navigation databases, real procedures, checklists, or independent-engine thrust levers.
- Random failures, accidents, crash framing, damage, or pilot-error narratives.
- A second cockpit asset, broad Airbus remodel, or destructive GLB optimization.
- Imported FlightGear source, assets, textures, or GPL implementation.
- Mobile-only interaction redesign beyond required responsive/accessibility validation.

## Progress

- [x] 2026-07-30 — Owner approved the two-scenario progression and Engine-Out direction.
- [x] 2026-07-30 — Design authority recorded in the approved spec.
- [x] 2026-07-30 — ExecPlan created from the approved design and current repository contracts.
- [x] 2026-07-30 — Scenario progression and reducer tests pass (55 focused tests across scenario and reducer files).
- [x] 2026-07-30 — Schema 11 migration and persistence tests pass; focused state/storage/scenario suite has 89 passing tests and typecheck is green.
- [x] 2026-07-30 — Pure Engine-Out simulation tests pass (14 focused Engine-Out tests; 103 focused gameplay tests total).
- [ ] Shared input and scenario runtime tests pass.
- [ ] Simulator Hub and Engine-Out HUD are integrated.
- [ ] Cockpit displays and 3D response are scenario-aware.
- [ ] Focused automated checks pass.
- [ ] Actual browser paths and responsive widths are exercised.
- [ ] Owner approves the Airbus left-seat visual proof.
- [ ] Evidence and reports are finalized.

## Discoveries

- The current Storm completion reducer immediately completes Airbus, so scenario unlocking must be changed at the state-machine boundary before UI work.
- The current camera phase type encodes only Storm presentation. Scenario selection needs a durable hub/active-scenario contract rather than more Storm-specific booleans.
- The current `FlightInput` lacks directional balance. Adding the fourth axis at a shared input boundary avoids duplicating keyboard, gamepad, and HTML logic.
- The 3D animator accepts concrete `StormLineState` and `FlightInput` refs. A discriminated active-frame contract is required so it can render either exercise without importing reducer state.
- Existing paired thrust-handle animation is sufficient. Engine asymmetry belongs in the fictional ECAM display and simulation rules, not in independent physical lever remodeling.
- Task 1’s focused tests pass, while typecheck now fails only where schema 10 storage normalizers still construct the old Storm-only shape. Task 2 must migrate that boundary before the first implementation commit so the branch does not record a knowingly non-typechecking intermediate state.
- Schema 11 treats an Engine-Out `completed` flag without canonical Airbus completion as corrupt instead of inventing reward eligibility; it resets that exercise to ready while preserving completed Storm progress.
- Full lint currently reports two hook-immutability errors at `src/scenes/PrototypeScene.tsx:478` and `:501`, where the existing Storm camera frame callback writes canvas dataset evidence through `gl`. Task 6 owns that already-dirty renderer and must repair the root cause before the final lint gate.

## Decision log

- 2026-07-30: Require `qualification → hub → Storm Line → hub → Engine-Out → Airbus complete`.
- 2026-07-30: Keep Storm and Engine-Out pure state machines with a thin shared scenario layer.
- 2026-07-30: Model directional balance as a normalized arcade axis, explicitly non-operational.
- 2026-07-30: Use a deliberate left simulated engine reduction in cruise and no landing segment.
- 2026-07-30: Reuse the approved Airbus cockpit, Storm Flight camera limits, sidestick, and paired thrust animation.
- 2026-07-30: Preserve old completed/reward saves as completed and unlock both exercises for replay.
- 2026-07-30: Return malformed Engine-Out progress to the hub while preserving independently proven qualification and Storm completion.
- 2026-07-30: Implement inline and sequentially because the active workspace rules do not authorize sub-agent delegation.

## Milestones

### Milestone 1: Durable two-scenario progression

The reducer and schema 11 migration represent the hub, Storm unlock/completion, Engine-Out checkpoint/completion, old-save compatibility, and safe corrupt-save recovery. A new save cannot complete Airbus after Storm alone.

### Milestone 2: Deterministic Engine-Out exercise

Pure tests drive a fixed-step Engine-Out state machine through Recognition, Stabilization, Diversion, local failure/retry, and completion traits. The module has no React, Three.js, browser, storage, or audio dependencies.

### Milestone 3: Shared accessible simulator runtime

Keyboard, gamepad, and native HTML controls generate one normalized four-axis input. One runtime hook selects the active pure scenario and emits checkpoint/completion events without owning game rules.

### Milestone 4: Cockpit-preserving hub and live Engine-Out presentation

The player sees scenario cards over the existing cockpit, enters Engine-Out, and receives coherent PFD, ND, ECAM, world-motion, sidestick, thrust, captions, pause, retry, and debrief feedback from the authoritative frame.

### Milestone 5: Browser proof and approval gate

The complete new-player and migrated-player paths pass in the actual browser. Visual proof at 1440×900 is presented first, followed by 768 px and 375 px evidence after owner approval.

## Implementation steps

### Task 1: Introduce scenario contracts and progression gating

Files:

- Create: `src/game/airbusScenario.ts`
- Create: `src/game/airbusScenario.test.ts`
- Modify: `src/game/state.ts`
- Modify: `src/game/state.test.ts`

Contracts:

```ts
export const AIRBUS_SCENARIOS = ['stormLine', 'engineOut'] as const
export type AirbusScenarioId = (typeof AIRBUS_SCENARIOS)[number]
export type AirbusScenarioLocation = 'qualification' | 'hub' | AirbusScenarioId

export interface ScenarioProgress<Checkpoint extends string, Trait extends string> {
  status: 'locked' | 'ready' | 'in_progress' | 'completed'
  checkpoint: Checkpoint
  attempts: Record<Checkpoint, number>
  bestTraits: Trait[]
}
```

Reducer actions:

```ts
{ type: 'SELECT_AIRBUS_SCENARIO'; scenario: AirbusScenarioId }
{ type: 'BEGIN_AIRBUS_STORM_TRANSITION' }
{ type: 'START_AIRBUS_STORM_LINE' }
{ type: 'COMPLETE_AIRBUS_STORM_LINE'; traits: StormLineTrait[] }
{ type: 'BEGIN_AIRBUS_ENGINE_OUT' }
{ type: 'SAVE_AIRBUS_ENGINE_OUT_CHECKPOINT'; checkpoint: EngineOutCheckpoint; attempts: Record<EngineOutCheckpoint, number> }
{ type: 'COMPLETE_AIRBUS_ENGINE_OUT'; traits: EngineOutTrait[] }
{ type: 'RETURN_TO_AIRBUS_SCENARIO_HUB' }
```

Steps:

1. Add failing pure scenario tests for initial lock states, Storm unlock rules, Engine-Out unlock after Storm, replay availability for completed progress, and invalid selection rejection.
2. Add failing reducer tests proving:
   - correct qualification enters the hub;
   - Storm may start only after qualification;
   - Storm completion returns to the hub, unlocks Engine-Out, and does not add `airbus` to `completedPuzzles`;
   - Engine-Out cannot start before Storm completion;
   - Engine-Out completion adds `airbus` exactly once;
   - completed scenarios can be replayed without erasing best traits;
   - the reward remains locked until Engine-Out completion.
3. Run:

   ```bash
   npm test -- --run src/game/airbusScenario.test.ts src/game/state.test.ts
   ```

   Expected red result: missing scenario contracts/actions and the existing Storm-only completion assertion.
4. Implement the smallest scenario contracts and reducer changes that make the tests pass. Retain `cameraPhase` only for camera presentation; use `location` for durable scenario/hub progression.
5. Rerun the focused tests until green.
6. Review only the task diff, update this plan’s Progress/Discoveries, and commit exact task files:

   ```bash
   git add src/game/airbusScenario.ts src/game/airbusScenario.test.ts src/game/state.ts src/game/state.test.ts plans/0025-airbus-scenario-hub-engine-out.md
   git commit -m "feat: gate Airbus completion behind scenarios"
   ```

### Task 2: Migrate and normalize schema 11

Files:

- Modify: `src/game/storage.ts`
- Modify: `src/game/storage.test.ts`
- Modify if normalization exposes a contract defect: `src/game/state.ts`

Steps:

1. Add failing storage tests for:
   - a schema 10 qualified, not-started save entering the hub with Storm ready and Engine-Out locked;
   - schema 10 in-progress Storm preserving its checkpoint and attempts;
   - schema 10 completed Storm without global Airbus completion unlocking Engine-Out and returning to the hub;
   - schema 10 completed Airbus/reward/Mars saves remaining complete with both scenarios replayable;
   - malformed Engine-Out status/checkpoint/attempts resetting only Engine-Out to its safe ready state;
   - incomplete qualification relocking both exercises regardless of unproven nested progress;
   - schema 11 save/load round trips.
2. Run:

   ```bash
   npm test -- --run src/game/storage.test.ts
   ```

   Expected red result: schema remains 10 and Engine-Out progress is absent.
3. Increment `GAME_SCHEMA_VERSION` to 11.
4. Keep a dedicated `normalizeV10` migration path and add a schema 11 canonical normalizer. Never reinterpret an old globally completed Airbus save as incomplete.
5. Normalize attempt counters to finite non-negative integers, traits to known values, and checkpoints to known scenario checkpoints.
6. Rerun storage plus reducer tests until green.
7. Review and commit exact task files:

   ```bash
   git add src/game/storage.ts src/game/storage.test.ts src/game/state.ts plans/0025-airbus-scenario-hub-engine-out.md
   git commit -m "feat: migrate Airbus scenarios to schema 11"
   ```

### Task 3: Build the pure Engine-Out state machine test-first

Files:

- Create: `src/game/airbusEngineOut.ts`
- Create: `src/game/airbusEngineOut.test.ts`

Required exports:

```ts
export type EngineOutCheckpoint = 'recognition' | 'stabilization' | 'diversion'
export type EngineOutTrait = 'directionalControl' | 'energyDiscipline' | 'calmDiversion'
export type EngineOutFailureReason = 'attitude' | 'energy' | 'directional' | 'corridor'

export interface EngineOutInput {
  pitch: number
  bank: number
  thrust: number
  directional: number
}

export function createEngineOutStateAtCheckpoint(checkpoint: EngineOutCheckpoint): EngineOutState
export function advanceEngineOut(
  state: EngineOutState,
  input: EngineOutInput,
  elapsedSeconds: number,
): EngineOutTransition
export function restartEngineOutCheckpoint(state: EngineOutState): EngineOutState
```

Steps:

1. Write failing tests for deterministic initial state and clamped input.
2. Write failing tests proving Recognition lasts approximately 10 seconds and smoothly reduces the left fictional engine indication while retaining player control.
3. Write failing Stabilization tests for:
   - pitch ±12 degrees;
   - bank ±25 degrees;
   - directional error below 0.45;
   - energy from 0.35 through 0.65;
   - asymmetric drift;
   - five cumulative unsafe seconds;
   - recovery resetting only Stabilization.
4. Write failing Diversion tests for SAFE RETURN corridor interception, reduced ongoing asymmetry, five cumulative seconds outside corridor/envelope, local retry, and stable-gate completion.
5. Write failing trait tests for Directional Control, Energy Discipline, and Calm Diversion.
6. Run:

   ```bash
   npm test -- --run src/game/airbusEngineOut.test.ts
   ```

   Expected red result: module is absent.
7. Implement a 1/60-second deterministic fixed-step model. Cap any single supplied elapsed duration before subdivision so tab suspension cannot skip stages.
8. Use exported named constants for thresholds/durations so tests and UI labels do not duplicate magic numbers.
9. Rerun until green, review pure-module boundaries, and commit:

   ```bash
   git add src/game/airbusEngineOut.ts src/game/airbusEngineOut.test.ts plans/0025-airbus-scenario-hub-engine-out.md
   git commit -m "feat: add deterministic Engine-Out exercise"
   ```

### Task 4: Share input normalization and orchestrate both scenarios

Files:

- Create: `src/game/airbusInput.ts`
- Create: `src/game/airbusInput.test.ts`
- Modify: `src/game/airbusSimulator.ts`
- Modify: `src/game/airbusSimulator.test.ts`
- Modify: `src/game/useAirbusSimulator.ts`
- Create: `src/game/useAirbusSimulator.test.ts` if hook behavior cannot be fully covered through the browser test without brittle timing.

Contracts:

```ts
export interface AirbusFlightInput {
  pitch: number
  bank: number
  thrust: number
  directional: number
}

export type AirbusActiveSimulationFrame =
  | { scenario: 'stormLine'; state: StormLineState; input: AirbusFlightInput }
  | { scenario: 'engineOut'; state: EngineOutState; input: AirbusFlightInput }
```

Steps:

1. Add failing input tests for dead zones, clamping, keyboard composition, opposing HTML holds cancelling, gamepad left stick/triggers/right-stick X, release cleanup, and directional staying neutral in Storm Line.
2. Adapt Storm Line to accept the shared input contract while ignoring `directional`, preserving every existing Storm result.
3. Run:

   ```bash
   npm test -- --run src/game/airbusInput.test.ts src/game/airbusSimulator.test.ts
   ```

4. Refactor `useAirbusSimulator` to select the active pure transition function from the reducer’s active scenario, maintain one fixed-step loop, publish React state at no more than 10 Hz, and send durable checkpoint/completion callbacks once per transition.
5. Map `A`/`D` and gamepad right-stick X to directional balance only while Engine-Out is active. Preserve arrows, `W`/`S`, `R`, pause, retry, and existing look controls.
6. Ensure window blur, visibility loss, pause, scenario exit, and unmount clear held inputs.
7. Rerun focused tests and typecheck:

   ```bash
   npm test -- --run src/game/airbusInput.test.ts src/game/airbusSimulator.test.ts src/game/airbusEngineOut.test.ts
   npm run typecheck
   ```

8. Review and commit exact task files.

### Task 5: Integrate the Simulator Hub and Engine-Out HUD

Files:

- Modify: `src/components/Hud.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/game/state.test.ts`

Steps:

1. Add reducer/component-facing tests for card labels and statuses derived from scenario progress.
2. Render the hub only after qualification and whenever no scenario is active.
3. Add two cards:
   - **Storm Line** — Ready, In progress, Completed, or Replay;
   - **Engine-Out Handling** — Locked with “Complete Storm Line first,” Ready, In progress, Completed, or Replay.
4. Keep the cockpit visible behind a compact, non-spoiling overlay.
5. Add Engine-Out HUD sections for stage, instructor caption, PFD/ND/ECAM HTML mirror, envelope status, timer, traits, pause, retry, sound, recenter, and controls drawer.
6. Extend native hold controls with Balance left/right. Keep descriptive `aria-label`, pressed state, keyboard equivalents, and touch-safe pointer cancellation.
7. Wire App callbacks:
   - Storm completion dispatches `COMPLETE_AIRBUS_STORM_LINE`;
   - Engine-Out checkpoint dispatches `SAVE_AIRBUS_ENGINE_OUT_CHECKPOINT`;
   - Engine-Out completion dispatches `COMPLETE_AIRBUS_ENGINE_OUT`;
   - only the latter activates the existing Airbus completion celebration on a new save.
8. Verify reduced-motion transitions do not hide state changes and muted audio does not suppress captions.
9. Run:

   ```bash
   npm test -- --run src/game/state.test.ts
   npm run lint
   npm run typecheck
   ```

10. Inspect at 1440, 768, and 375 CSS widths for clipping, overlap, target size, and readable cockpit instruments. Do not record the narrow views as approved before the desktop owner gate.

### Task 6: Make the cockpit renderer scenario-aware

Files:

- Modify: `src/scenes/PrototypeScene.tsx`
- Create: `src/scenes/airbusEngineOutVisuals.ts`
- Create: `src/scenes/airbusEngineOutVisuals.test.ts`
- Modify if a shared visual type is cleaner: `src/scenes/airbusStormVisuals.ts`

Steps:

1. Add failing pure visual-adapter tests for:
   - Engine-Out heading drift and bank;
   - PFD directional cue;
   - ND SAFE RETURN corridor/intercept cue;
   - left/right fictional engine-power rings;
   - restrained Recognition-to-Stabilization transitions;
   - reduced-motion bounded response.
2. Run:

   ```bash
   npm test -- --run src/scenes/airbusEngineOutVisuals.test.ts
   ```

   Expected red result: visual adapter is absent.
3. Change the animator props from concrete Storm refs to `AirbusActiveSimulationFrame` refs.
4. Dispatch PFD, ND, and ECAM drawing by the discriminated `scenario` field. Mark Engine-Out ECAM **NON OPERATIONAL** and **SIM ENG 1 REDUCED — TRAINING**.
5. Animate the existing sidestick from pitch/bank and paired thrust levers from thrust for both scenarios. Do not add an independent physical lever.
6. Apply modest world heading drift/bank for Engine-Out without changing camera-limit contracts or cockpit display mesh placement.
7. Avoid per-frame allocations in CanvasTexture draw paths and keep HTML updates outside the render loop.
8. Rerun visual, camera, Storm, Engine-Out, type, and build checks:

   ```bash
   npm test -- --run src/scenes/airbusEngineOutVisuals.test.ts src/scenes/airbusStormVisuals.test.ts src/scenes/airbusCameraRig.test.ts
   npm run typecheck
   npm run build
   ```

### Task 7: Prove the complete chapter in the actual browser

Files:

- Modify: `e2e/airbus-storm-line.spec.ts`
- Create: `e2e/airbus-engine-out.spec.ts`
- Modify if shared save fixtures are extracted: the closest existing E2E helper file
- Add evidence under: `preview-renders/airbus-scenarios/`

Browser cases:

1. New player:
   - cannot see the hub before all five labels are correct;
   - sees Storm ready and Engine-Out locked after qualification;
   - cannot activate locked Engine-Out;
   - begins Storm through the existing camera transition;
   - Storm local failure/retry preserves qualification;
   - Storm completion returns to hub and unlocks Engine-Out;
   - Airbus and reward remain incomplete.
2. Engine-Out:
   - Recognition copy identifies deliberate training;
   - keyboard axes change the correct telemetry;
   - HTML holds provide equivalent control;
   - gamepad mapping is covered by unit normalization if Playwright cannot supply a stable virtual pad;
   - five unsafe seconds opens focused recovery;
   - retry resumes the current checkpoint;
   - SAFE RETURN completion records traits and completes Airbus.
3. Persistence:
   - reload resumes the durable active checkpoint;
   - corrupt Engine-Out data returns to the hub with Storm completion intact;
   - old completed/reward fixtures remain complete and permit replay.
4. Accessibility:
   - keyboard-only completion path;
   - visible focus;
   - controls have accessible names and states;
   - captions remain with sound off;
   - reduced-motion path skips nonessential transitions.
5. Responsive:
   - desktop 1440×900 visual proof first;
   - 768×1024 and 375×812 after desktop owner approval.

Commands:

```bash
npm run dev -- --host 127.0.0.1
npx playwright test e2e/airbus-storm-line.spec.ts e2e/airbus-engine-out.spec.ts --project=chromium
npm run lint
npm run typecheck
npm run test
npm run build
```

Capture screenshots from the actual browser, not a source-only or Blender-only view:

- `preview-renders/airbus-scenarios/hub-1440.png`
- `preview-renders/airbus-scenarios/engine-out-recognition-1440.png`
- `preview-renders/airbus-scenarios/engine-out-diversion-1440.png`
- `preview-renders/airbus-scenarios/engine-out-debrief-1440.png`

### Task 8: Review, repair, and record evidence

Files:

- Modify: `plans/0025-airbus-scenario-hub-engine-out.md`
- Modify: `TEST_REPORT.md`
- Modify only if contracts changed: `docs/GAME_DESIGN.md`

Steps:

1. Inspect the complete branch diff for progression bypasses, reward spoilers, unsafe DOM insertion, duplicate input logic, timer drift, stale refs, per-frame allocation, malformed-save escalation, and unrelated Tesla changes.
2. Run `/review` or an equivalent full-diff review and resolve all critical/high findings.
3. Run focused failed checks plus nearby regressions after each repair.
4. Record commands actually run, exact results, screenshot paths, browser dimensions, limitations, and owner decision.
5. Do not mark the plan complete while the desktop Airbus visual approval gate is pending.

## Validation plan

### Unit and state validation

- Scenario unlock and replay rules.
- Reducer action guards and idempotent completion.
- Storm regression behavior.
- Engine-Out deterministic stages, envelope, failure, retry, and traits.
- Shared input dead zones, clamping, cancellation, and directional mapping.
- Schema 10-to-11 migration, corrupt data, and schema 11 round trip.
- Camera and visual adapters.

### Browser validation

- Success, failure, repeated failure, local retry, pause/resume, reload, and completion.
- Mouse/pointer, keyboard-only, native HTML holds, and gamepad normalization.
- Visible focus, captions, sound off, and reduced motion.
- 1440×900 owner-gate proof, then 768×1024 and 375×812 checks.

### Regression validation

- Mandatory qualification remains mandatory.
- Existing Storm camera transition and limited look remain functional.
- DC-9 and locker progression are unchanged.
- Existing reward handoff occurs only after Airbus completion.
- No Tesla/Model Y files or spoiler surfaces are changed by this milestone.
- Current Airbus GLB and display-fit contracts remain intact unless a separately evidenced source repair becomes necessary.

## Acceptance criteria

- A fresh qualified save enters a hub with exactly two scenario cards.
- Engine-Out cannot start until Storm Line is completed.
- Storm completion does not complete Airbus or unlock the reward on a fresh save.
- Engine-Out has visible Recognition, Stabilization, Diversion, and Debrief states.
- Engine-Out continuously responds to four normalized axes and uses the documented envelope.
- An unsafe segment pauses after five cumulative seconds and retries only its current checkpoint.
- PFD, ND, ECAM, world cues, sidestick, paired thrust, HTML telemetry, and captions agree with the same authoritative frame.
- Completion traits persist and replay never erases a better prior result.
- Schema 10 completed/reward saves stay completed.
- Malformed Engine-Out state cannot erase qualification or earned Storm completion.
- Relevant tests, lint, typecheck, build, and Chromium E2E pass.
- Owner approves the 1440×900 Airbus left-seat proof.
- `TEST_REPORT.md` and this plan contain actual evidence.

## Repair loop and stop conditions

For each task, repeat:

1. Add or select one failing acceptance check.
2. Implement the smallest coherent repair.
3. Rerun the failed check and nearby regression checks.
4. Inspect the actual browser whenever presentation or interaction changes.
5. Review the remaining acceptance delta and update this plan.

Allow at most three repair attempts for the same unchanged root cause before pausing to re-diagnose from runtime evidence. Stop only when all checks pass, the remaining delta stops shrinking, a genuine external blocker is proven, or the owner visual gate requires a human decision. Never claim an unrun check passed.

## Evidence

- 2026-07-30: Approved design recorded at `docs/superpowers/specs/2026-07-30-airbus-flightgear-scenario-hub-design.md`.
- 2026-07-30: Current reducer inspection confirms Storm completion directly adds `airbus`; Task 1 owns that gating change.
- 2026-07-30: Current renderer inspection confirms it accepts Storm-specific state/input refs; Task 6 owns the discriminated-frame boundary.
- 2026-07-30: `npm test -- --run src/game/airbusScenario.test.ts src/game/state.test.ts` passes 55 tests. The following `npm run typecheck` reports three expected missing `location`/`engineOut` errors in `src/game/storage.ts`.
- 2026-07-30: `npm test -- --run src/game/storage.test.ts src/game/state.test.ts src/game/airbusScenario.test.ts` passes 89 tests; `npm run typecheck` passes after the schema 11 migration.
- 2026-07-30: `npm test -- --run src/game/airbusEngineOut.test.ts src/game/airbusScenario.test.ts src/game/state.test.ts src/game/storage.test.ts` passes 103 tests and `npm run typecheck` passes. `npm run lint` fails only on the recorded existing `PrototypeScene.tsx` dataset writes.

## Outcome and handoff

Implementation is beginning. The next concrete checkpoint is Task 1: red tests for the scenario contracts and reducer progression. The milestone remains open until automated validation and the owner’s Airbus left-seat browser proof are complete.
