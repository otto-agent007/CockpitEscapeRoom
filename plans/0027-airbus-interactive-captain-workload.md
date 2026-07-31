# Airbus Interactive Captain Workload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four required-but-forgiving in-flight ND and ECAM tasks to Storm Line and Engine-Out Handling, with clickable 3D displays, native HTML equivalents, durable progress, and safe checkpoint holds.

**Architecture:** A new pure `airbusWorkload` module owns task rules and progress. The pure scenario adapter blocks only checkpoint transitions, while the reducer persists workload actions and schema 12 migration. React HUD and Three.js display raycasting consume those rules without owning them.

**Tech Stack:** React 19, TypeScript, Vite, Three.js, React Three Fiber, Vitest, Playwright, existing Blender-authored Airbus A320 GLB.

## Global Constraints

- Change only the Airbus A320 gameplay layer; leave DC-9, locker, Tesla/Model Y, Flight Mode, Mars, and reward files unchanged.
- Keep all workload interactions fictional and marked `SIM — NON OPERATIONAL`.
- Add no production dependency and require no Blender or GLB change.
- Keep rules in `src/game`, 3D presentation in `src/scenes`, and native controls in `src/components`.
- Wrong actions never erase qualification, completed tasks, checkpoints, traits, or puzzles.
- Every required 3D action must have a keyboard-reachable native HTML equivalent.
- Preserve the approved raised Storm Flight camera, live shared weather/radar, PFD/ND/ECAM bezel fit, pause, retry, reload, reduced motion, and reward protection.
- Implement inline and sequentially because the active workspace does not authorize sub-agent delegation.

---

Status: Active  
Owner: Codex  
Created: 2026-07-30  
Design authority: `docs/superpowers/specs/2026-07-30-airbus-interactive-captain-workload-design.md`

## Purpose

The Airbus chapter already supports continuous flight control, two checkpointed exercises, live cockpit displays, and shared weather radar. This milestone makes the physical cockpit participate in those exercises. The player must use the captain ND and upper ECAM for four short contextual tasks, and the simulator safely waits at a checkpoint boundary if the task is unfinished.

## Current state

- `src/game/airbusScenario.ts` advances Storm Line and Engine-Out without cockpit-task input.
- `src/game/state.ts` persists qualification and scenario progress at schema 11.
- `src/game/useAirbusSimulator.ts` owns the animation loop and publishes flight frames.
- `src/scenes/PrototypeScene.tsx` draws the live PFD, ND, and ECAM but only raycasts Airbus targets during the five-card qualification.
- `src/components/Hud.tsx` exposes native flight controls but no in-flight cockpit workload.
- The active workspace contains unrelated and prior Airbus asset changes. Stage and commit only the exact files named by each task.

## Prompt contract

### Goal

During active flight, the player can complete `MID` weather range, western gap selection, simulated event acknowledgement, and right-side SAFE RETURN selection through either the physical ND/ECAM or native controls.

### Context

- Approved design: `docs/superpowers/specs/2026-07-30-airbus-interactive-captain-workload-design.md`
- Pure scenario boundary: `src/game/airbusScenario.ts`
- Durable state: `src/game/state.ts`, `src/game/storage.ts`
- Runtime loop: `src/game/useAirbusSimulator.ts`
- Cockpit displays and raycasting: `src/scenes/PrototypeScene.tsx`
- Native interface: `src/components/Hud.tsx`
- Browser suites: `e2e/airbus-storm-line.spec.ts`, `e2e/airbus-engine-out.spec.ts`

### Constraints

Apply the Global Constraints above. Preserve the existing player loop:

**Observe → inspect → decide → feedback → safe retry or progressive hint → system restored → personal reward → advance.**

### Done when

- All four tasks work through both 3D displays and native controls.
- Incorrect actions strengthen hints without failing or rewinding the scenario.
- Scenario checkpoint transitions hold until the current required task is complete.
- Completed tasks survive retry and reload; explicit scenario replay resets only that scenario's workload.
- The ND visibly changes scan range and selection state; the ECAM visibly changes acknowledgement state.
- Focused tests, `npm run check`, `git diff --check`, and authoritative browser paths pass.

## Progress

- [x] 2026-07-30 — Owner approved all recommended interaction and forgiving-gate decisions.
- [x] 2026-07-30 — Design specification written, self-reviewed, and committed.
- [x] 2026-07-30 — Pure workload rules pass seven focused tests.
- [x] 2026-07-30 — Scenario checkpoint gating passes 34 focused Storm, Engine-Out, and adapter tests.
- [x] 2026-07-30 — Schema 12 reducer and migration pass 111 focused tests; typecheck is green.
- [x] 2026-07-30 — Runtime safe holds and native captain-task controls pass typecheck, lint, and 111 focused tests.
- [ ] ND/ECAM 3D interactions and display feedback pass browser tests.
- [ ] Full validation, visual evidence, review, and reports are complete.

## Decision log

- 2026-07-30: Use four tasks across both existing scenarios instead of adding a third scenario.
- 2026-07-30: Make tasks required but forgiving; unresolved tasks hold only the next checkpoint transition.
- 2026-07-30: Reuse the existing Blender-authored ND and ECAM surfaces; add no proxy geometry or GLB edit.
- 2026-07-30: Treat a sub-six-pixel pointer gesture as a click and larger movement as camera look.
- 2026-07-30: Persist task completion and attempts; explicit replay resets only the selected scenario's workload.
- 2026-07-30: Use native HTML buttons as the authoritative accessible fallback when WebGL is unavailable.

## File structure

### Create

- `src/game/airbusWorkload.ts` — pure task IDs, actions, progress, active-task derivation, action evaluation, hints, replay reset, and migration helpers.
- `src/game/airbusWorkload.test.ts` — focused pure workload tests.
- `e2e/airbus-workload.spec.ts` — production-browser 3D and native workload proof.

### Modify

- `src/game/airbusScenario.ts` and `.test.ts` — checkpoint-transition gates.
- `src/game/state.ts` and `.test.ts` — schema 12 progress and workload reducer action.
- `src/game/storage.ts` and `.test.ts` — schema 11 migration and corrupt-data normalization.
- `src/game/useAirbusSimulator.ts` — pass workload completion to the scenario adapter and expose a gate.
- `src/App.tsx` — connect reducer workload state/actions to runtime and scene.
- `src/components/Hud.tsx` — compact task line, feedback, hint, hold state, and native controls.
- `src/styles.css` — compact workload cue styles without covering cockpit displays.
- `src/scenes/PrototypeScene.tsx` — ND/ECAM raycaster and display feedback.
- `src/scenes/airbusWeatherRadar.ts` and `.test.ts` only if range scaling is best kept in the pure radar adapter.
- `docs/GAME_DESIGN.md`, `BLUEPRINT.md`, `TEST_REPORT.md`, and this ExecPlan — final behavior and evidence.

## Task 1: Pure workload rules

**Files:**

- Create: `src/game/airbusWorkload.ts`
- Create: `src/game/airbusWorkload.test.ts`

**Interfaces:**

- Produces:

```ts
export const AIRBUS_WORKLOAD_TASKS: readonly AirbusWorkloadTaskId[]
export type AirbusWorkloadTaskId =
  | 'stormScanRange'
  | 'stormGapSelection'
  | 'engineEventAcknowledgement'
  | 'engineSafeReturnSelection'
export type AirbusScanRange = 'near' | 'mid' | 'far'
export type AirbusWeatherSector = 'west' | 'center' | 'east'
export type AirbusSafeReturnSide = 'left' | 'right'
export type AirbusWorkloadAction =
  | { type: 'cycleScanRange' }
  | { type: 'selectWeatherSector'; sector: AirbusWeatherSector }
  | { type: 'acknowledgeEngineEvent' }
  | { type: 'selectSafeReturn'; side: AirbusSafeReturnSide }
export interface AirbusWorkloadProgress {
  scanRange: AirbusScanRange
  completedTasks: AirbusWorkloadTaskId[]
  attempts: Record<AirbusWorkloadTaskId, number>
}
export interface AirbusWorkloadResult {
  progress: AirbusWorkloadProgress
  outcome: 'correct' | 'incorrect' | 'ignored'
  task: AirbusWorkloadTaskId | null
}
export function createInitialAirbusWorkloadProgress(): AirbusWorkloadProgress
export function deriveAirbusWorkloadTask(
  scenario: AirbusScenarioId | null,
  checkpoint: StormLineCheckpoint | EngineOutCheckpoint | null,
): AirbusWorkloadTaskId | null
export function applyAirbusWorkloadAction(
  progress: AirbusWorkloadProgress,
  activeTask: AirbusWorkloadTaskId | null,
  action: AirbusWorkloadAction,
): AirbusWorkloadResult
export function airbusWorkloadHint(task: AirbusWorkloadTaskId, attempts: number): string
export function resetAirbusScenarioWorkload(
  progress: AirbusWorkloadProgress,
  scenario: AirbusScenarioId,
): AirbusWorkloadProgress
```

- [x] **Step 1: Write failing pure tests**

Cover these exact behaviors:

```ts
expect(deriveAirbusWorkloadTask('stormLine', 'stormEntry')).toBe('stormScanRange')
expect(deriveAirbusWorkloadTask('stormLine', 'stormCore')).toBe('stormGapSelection')
expect(deriveAirbusWorkloadTask('engineOut', 'recognition')).toBe('engineEventAcknowledgement')
expect(deriveAirbusWorkloadTask('engineOut', 'diversion')).toBe('engineSafeReturnSelection')
expect(deriveAirbusWorkloadTask('engineOut', 'stabilization')).toBeNull()
```

Also prove `near → mid → far → near`, `MID`, `west`, acknowledgement, and `right` correctness; irrelevant actions are ignored; wrong actions increment only the active task; completed tasks remain unique; and replay reset is scenario-local.

- [x] **Step 2: Run the tests and verify RED**

Run:

```bash
npm test -- --run src/game/airbusWorkload.test.ts
```

Expected: fail because `airbusWorkload.ts` does not exist.

- [x] **Step 3: Implement the minimal pure module**

Use immutable arrays/records. Correct task answers are:

```ts
stormScanRange: action.type === 'cycleScanRange' && nextRange === 'mid'
stormGapSelection: action.type === 'selectWeatherSector' && action.sector === 'west'
engineEventAcknowledgement: action.type === 'acknowledgeEngineEvent'
engineSafeReturnSelection: action.type === 'selectSafeReturn' && action.side === 'right'
```

Attempts increase only on an applicable incorrect action. The first hint repeats the instructor objective; attempt two and later names the correct cockpit area and direction without using real procedure language.

- [x] **Step 4: Run the tests and verify GREEN**

Run:

```bash
npm test -- --run src/game/airbusWorkload.test.ts
```

Expected: all workload tests pass.

- [x] **Step 5: Commit the pure rules**

```bash
git add src/game/airbusWorkload.ts src/game/airbusWorkload.test.ts
git commit -m "feat: add Airbus captain workload rules"
```

## Task 2: Gate scenario checkpoint transitions

**Files:**

- Modify: `src/game/airbusScenario.ts`
- Modify: `src/game/airbusScenario.test.ts`

**Interfaces:**

- Consumes: `AirbusWorkloadTaskId`, completed task IDs from Task 1.
- Changes:

```ts
export interface AirbusScenarioFrameTransition {
  frame: AirbusActiveSimulationFrame
  checkpointReached?: StormLineCheckpoint | EngineOutCheckpoint
  failureReason?: StormLineFailureReason | EngineOutFailureReason
  completed?: boolean
  traits?: StormLineTrait[] | EngineOutTrait[]
  workloadGate?: AirbusWorkloadTaskId
}

export function advanceAirbusScenarioFrame(
  frame: AirbusActiveSimulationFrame,
  input: AirbusFlightInput,
  elapsedSeconds: number,
  completedWorkloadTasks?: readonly AirbusWorkloadTaskId[],
): AirbusScenarioFrameTransition
```

- [x] **Step 1: Add failing transition-gate tests**

Prove:

- Storm Entry cannot transition to Storm Core without `stormScanRange`.
- Storm Core cannot transition to Clear Air without `stormGapSelection`.
- Engine Recognition cannot transition to Stabilization without `engineEventAcknowledgement`.
- Engine Diversion cannot complete without `engineSafeReturnSelection`.
- Supplying the relevant completed task returns the original scenario transition.
- A gate returns the prior stable frame, no checkpoint event, no completion event, and the exact `workloadGate`.

- [x] **Step 2: Run the tests and verify RED**

```bash
npm test -- --run src/game/airbusScenario.test.ts
```

Expected: the new assertions fail because workload completion is not accepted.

- [x] **Step 3: Implement checkpoint-boundary interception**

Advance the selected pure scenario once, then compare the previous and proposed states. Map only these boundaries:

```ts
stormEntry -> stormCore: stormScanRange
stormCore -> clearAir: stormGapSelection
recognition -> stabilization: engineEventAcknowledgement
diversion -> complete: engineSafeReturnSelection
```

When blocked, return the original frame and `workloadGate`. Do not modify either underlying scenario state machine.

- [x] **Step 4: Run focused scenario tests**

```bash
npm test -- --run src/game/airbusScenario.test.ts src/game/airbusSimulator.test.ts src/game/airbusEngineOut.test.ts
```

Expected: all focused scenario tests pass.

- [x] **Step 5: Commit scenario gating**

```bash
git add src/game/airbusScenario.ts src/game/airbusScenario.test.ts
git commit -m "feat: gate Airbus checkpoints on captain tasks"
```

## Task 3: Add schema 12 reducer and persistence

**Files:**

- Modify: `src/game/state.ts`
- Modify: `src/game/state.test.ts`
- Modify: `src/game/storage.ts`
- Modify: `src/game/storage.test.ts`

**Interfaces:**

- Consumes: workload types/helpers from Task 1.
- Adds `workload: AirbusWorkloadProgress` to `AirbusSimulatorProgress`.
- Adds action:

```ts
| { type: 'APPLY_AIRBUS_WORKLOAD_ACTION'; action: AirbusWorkloadAction }
```

- [x] **Step 1: Write failing reducer tests**

Prove:

- actions outside an active in-progress Airbus scenario return the same state;
- applicable wrong action increments attempts and updates `statusMessage`;
- correct action adds one completed task and preserves scenario progress;
- retry and hub return do not clear completed workload;
- beginning a replay resets only the selected scenario's tasks and attempts;
- completing Storm or Airbus cannot bypass unfinished workload through reducer actions.

- [x] **Step 2: Write failing storage tests**

Create schema 11 fixtures for:

- Storm `stormEntry`, `stormCore`, and `clearAir`;
- Engine-Out `recognition`, `stabilization`, and `diversion`;
- completed Storm;
- completed Airbus/reward;
- corrupt workload-shaped data.

Expected migration:

```ts
stormEntry -> []
stormCore -> ['stormScanRange']
clearAir -> ['stormScanRange', 'stormGapSelection']
engine recognition -> both Storm tasks
engine stabilization/diversion -> both Storm tasks + engineEventAcknowledgement
completed Airbus/reward -> all four tasks
```

Corrupt task IDs, scan range, and attempt counts normalize to `near`, approved IDs only, and non-negative safe integers.

- [x] **Step 3: Run tests and verify RED**

```bash
npm test -- --run src/game/state.test.ts src/game/storage.test.ts
```

Expected: fail for missing workload state, action, and schema 12 migration.

- [x] **Step 4: Implement state and reducer**

- Set `GAME_SCHEMA_VERSION = 12`.
- Initialize workload with `createInitialAirbusWorkloadProgress()`.
- Derive the active task from current location and checkpoint.
- Apply actions only while the relevant scenario status is `in_progress`.
- Use `airbusWorkloadHint` for incorrect feedback and concise completion copy for correct feedback.
- On explicit Storm or Engine-Out replay, call `resetAirbusScenarioWorkload`.
- Before reducer completion actions, verify the two scenario tasks required for that completion.

- [x] **Step 5: Implement normalization and migration**

Extend canonical normalization to accept schema 12, migrate schema 11 through the checkpoint-derived helper, and normalize schema 12 workload fields. Preserve completion/reward truth from older saves without granting new completion.

- [x] **Step 6: Run focused state/storage tests**

```bash
npm test -- --run src/game/airbusWorkload.test.ts src/game/airbusScenario.test.ts src/game/state.test.ts src/game/storage.test.ts
npm run typecheck
```

Expected: all focused tests and typecheck pass.

- [x] **Step 7: Commit durable progress**

```bash
git add src/game/state.ts src/game/state.test.ts src/game/storage.ts src/game/storage.test.ts
git commit -m "feat: persist Airbus cockpit workload"
```

## Task 4: Connect runtime holds and native controls

**Files:**

- Modify: `src/game/useAirbusSimulator.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/Hud.tsx`
- Modify: `src/styles.css`
- Test: existing focused game tests plus browser tests in Task 6

**Interfaces:**

- `UseAirbusSimulatorOptions` receives `completedWorkloadTasks`.
- `AirbusSimulatorRuntime` exposes `workloadGate: AirbusWorkloadTaskId | null`.
- `App` dispatches `APPLY_AIRBUS_WORKLOAD_ACTION`.

- [x] **Step 1: Add a failing runtime-facing test at the pure boundary**

Extend the scenario test to prove a gate clears immediately on the next update after the completed task list changes. This test protects the hook's intended contract without testing animation timing.

- [x] **Step 2: Run and verify RED**

```bash
npm test -- --run src/game/airbusScenario.test.ts
```

Expected: fail until the completed task input is honored on each call.

- [x] **Step 3: Integrate the animation loop**

- Pass the current completed task list to every `advanceAirbusScenarioFrame` call.
- Store the returned gate in React state only when it changes.
- When gated, center flight inputs and publish the stable frame.
- Clear the gate automatically after the reducer records the required task.
- Preserve manual pause separately; do not report a workload hold as user pause.

- [x] **Step 4: Add the compact HUD task controls**

Derive active task from scenario/checkpoint and render:

- `Captain task` label;
- concise instruction;
- incorrect feedback plus progressive hint;
- green completed confirmation until checkpoint changes;
- `Captain task required` hold message when gated;
- task-specific native controls.

Native controls dispatch the same workload actions as 3D clicks. Use real `<button>` elements and existing HUD regions; do not insert unsafe HTML.

- [x] **Step 5: Add bounded styles**

Add a compact task row under the top mission strip. At 1440 it must not cover the display panel. At 768 and 375 it may stack with the existing topbar but must not produce horizontal overflow or overlap the scene tools.

- [x] **Step 6: Run focused validation**

```bash
npx eslint src/game/useAirbusSimulator.ts src/App.tsx src/components/Hud.tsx
npm run typecheck
npm test -- --run src/game/airbusWorkload.test.ts src/game/airbusScenario.test.ts src/game/state.test.ts src/game/storage.test.ts
```

Expected: all commands pass.

- [ ] **Step 7: Commit runtime and HUD**

```bash
git add src/game/useAirbusSimulator.ts src/App.tsx src/components/Hud.tsx src/styles.css
git commit -m "feat: add Airbus captain task controls"
```

## Task 5: Make the ND and ECAM physically interactive

**Files:**

- Modify: `src/scenes/PrototypeScene.tsx`
- Modify: `src/scenes/airbusWeatherRadar.ts`
- Modify: `src/scenes/airbusWeatherRadar.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**

- `PrototypeScene` receives:

```ts
airbusWorkload: AirbusWorkloadProgress
airbusActiveWorkloadTask: AirbusWorkloadTaskId | null
onAirbusWorkloadAction: (action: AirbusWorkloadAction) => void
```

- [ ] **Step 1: Write failing radar-range tests**

Prove that near, mid, and far range modes use deterministic labels and increasing distance limits, while preserving the same shared weather-field signature and sweep semantics.

- [ ] **Step 2: Run and verify RED**

```bash
npm test -- --run src/scenes/airbusWeatherRadar.test.ts
```

Expected: fail because radar derivation has no scan-range input.

- [ ] **Step 3: Add pure scan-range presentation**

Accept `AirbusScanRange` in the radar adapter. Use fictional display ranges:

```ts
near: 20
mid: 40
far: 80
```

Only projection scale, range labels, and visible return inclusion change. Weather cells and scenario rules remain unchanged.

- [ ] **Step 4: Add the display-surface raycaster**

Create one focused component in `PrototypeScene.tsx` that:

- resolves `AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE` and `AIRBUS_A320_DISPLAY_UPPER_ECAM_SURFACE`;
- raycasts only while an applicable workload task is active;
- records pointer-down position;
- dispatches only on pointer-up movement below six pixels;
- maps ND local hit position to west/center/east or left/right sectors;
- cycles range for the range task;
- acknowledges on ECAM for the recognition task;
- sets pointer cursor only over the currently actionable display;
- does not dispatch while the five-card target picker owns interaction.

- [ ] **Step 5: Draw workload feedback on existing textures**

ND:

- show `RANGE 20`, `RANGE 40`, or `RANGE 80`;
- cyan outline for active task;
- amber selected wrong sector;
- green confirmed sector.

ECAM:

- show `ACK REQUIRED` before acknowledgement;
- show `TRAINING EVENT ACKNOWLEDGED` after completion.

Keep `SIM — NON OPERATIONAL` visible.

- [ ] **Step 6: Run focused checks**

```bash
npm test -- --run src/scenes/airbusWeatherRadar.test.ts src/game/airbusWeatherField.test.ts src/scenes/airbusAtmosphereVisuals.test.ts
npx eslint src/scenes/PrototypeScene.tsx src/scenes/airbusWeatherRadar.ts
npm run typecheck
npm run build
```

Expected: all commands pass and the production build completes.

- [ ] **Step 7: Commit the 3D interaction**

```bash
git add src/scenes/PrototypeScene.tsx src/scenes/airbusWeatherRadar.ts src/scenes/airbusWeatherRadar.test.ts src/App.tsx
git commit -m "feat: make Airbus displays interactive"
```

## Task 6: Browser proof, responsive repair, and documentation

**Files:**

- Create: `e2e/airbus-workload.spec.ts`
- Modify: `docs/GAME_DESIGN.md`
- Modify: `BLUEPRINT.md`
- Modify: `TEST_REPORT.md`
- Modify: `plans/0027-airbus-interactive-captain-workload.md`
- Create: `preview-renders/airbus-workload/*.png`

**Interfaces:**

- Uses the production Airbus GLB and the same seeded-state helpers as existing scenario browser suites.

- [ ] **Step 1: Add browser tests**

Cover:

- native Weather Entry range cycling, wrong/correct state, and checkpoint release;
- real ND mesh click at Weather Entry;
- Storm Core wrong center then correct west selection;
- real ECAM mesh click in Engine Recognition;
- Engine Diversion wrong left then correct right selection;
- pointer drag does not dispatch;
- retry preserves completed tasks;
- reload restores completed tasks and active checkpoint;
- reduced motion preserves every task;
- WebGL fallback completes tasks through native buttons;
- 375, 768, and 1440 geometry has no horizontal overflow or control overlap;
- no reward/Model Y copy appears before Airbus completion.

- [ ] **Step 2: Run focused browser tests**

```bash
npx playwright test e2e/airbus-workload.spec.ts --project=chromium
```

Expected: all workload cases pass against the production GLB.

- [ ] **Step 3: Repair only evidence-backed defects**

If a browser case fails, follow `superpowers:systematic-debugging`: reproduce, identify the failing boundary, make one focused repair, and rerun the failed case plus its nearest regression. Stop after three failed repair hypotheses and reassess architecture.

- [ ] **Step 4: Capture authoritative evidence**

At 1440×900 capture:

- Storm Weather Entry with `RANGE 40` and active task confirmation;
- Storm Core with western gap selection;
- Engine Recognition with acknowledged ECAM;
- Engine Diversion with right SAFE RETURN selected.

Also inspect approximately 768×900 and 375×812 for functional stacking.

- [ ] **Step 5: Run the completion matrix**

```bash
npm run check
npm run assets:check
npx playwright test e2e/airbus-storm-line.spec.ts e2e/airbus-engine-out.spec.ts e2e/airbus-workload.spec.ts --project=chromium
git diff --check
```

Expected: every command exits zero. Existing asset-validator warnings may be recorded but no new errors are allowed.

- [ ] **Step 6: Review the complete diff**

Inspect:

- no unrelated files staged;
- no duplicated workload rules in React or Three.js;
- no progress loss or reward bypass;
- no 3D-only required path;
- no click fired from camera drag;
- no unsafe DOM insertion;
- no new dependency;
- no Tesla/Model Y file or copy change.

- [ ] **Step 7: Update documentation and evidence**

Record actual commands, counts, screenshot paths, failures, repairs, and remaining owner gate in this plan and `TEST_REPORT.md`. Update the Airbus gameplay paragraph in `BLUEPRINT.md` and `docs/GAME_DESIGN.md`.

- [ ] **Step 8: Commit final proof**

```bash
git add e2e/airbus-workload.spec.ts preview-renders/airbus-workload \
  BLUEPRINT.md docs/GAME_DESIGN.md TEST_REPORT.md \
  plans/0027-airbus-interactive-captain-workload.md
git commit -m "test: prove Airbus captain workload"
```

## Validation plan

### Unit

- Pure task derivation, action evaluation, hints, reset, and transition gates.
- Reducer rejection, correct/incorrect feedback, replay reset, and completion guards.
- Schema 11 migration and corrupt schema 12 normalization.
- Radar range projection.

### Browser

- Native and real-mesh interaction.
- Click-versus-drag separation.
- Correct, wrong, repeated-wrong, hint, hold, retry, reload, reduced motion, and WebGL fallback.
- 375, 768, and 1440 widths.

### Regression

- Existing Storm and Engine-Out suites.
- `npm run check`.
- `npm run assets:check`.
- Reward remains locked until Engine-Out completes.

## Acceptance criteria

- The four owner-approved tasks are playable on physical displays and through native controls.
- Each display visibly reflects the player's action.
- Unfinished tasks hold only the next checkpoint boundary.
- Wrong actions coach without scenario failure.
- Persistence and replay behavior match the approved design.
- Existing flight, weather, radar, camera, screen fit, traits, and completion remain intact.
- Completion evidence is recorded with no unrun check described as passing.

## Repair loop and stop conditions

Repeat:

1. Review the current failed assertion or screenshot.
2. Identify the responsible pure, reducer, runtime, HTML, or Three.js boundary.
3. Make one focused repair.
4. Rerun the failed check and nearest regression.
5. Record the remaining delta.

Stop when all acceptance checks pass, three focused repair hypotheses fail, the delta stops shrinking, or a genuine owner visual decision remains.

## Evidence

- 2026-07-30: Owner instructed Codex to use all recommended choices and proceed without more questions.
- 2026-07-30: Approved design committed at `docs/superpowers/specs/2026-07-30-airbus-interactive-captain-workload-design.md`.
- 2026-07-30: Workload, scenario, reducer, and storage suite passes 111 tests; schema 12 typecheck passes.
- 2026-07-30: Runtime gating and native task controls pass `npm run typecheck`, focused ESLint, and the 111-test workload/scenario/state/storage suite.

## Outcome and handoff

Tasks 1 through 3 are committed. Task 4 implementation is complete and awaiting its focused commit; Task 5 physical ND and ECAM interaction follows.
