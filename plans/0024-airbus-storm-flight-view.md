# Airbus A320 Storm Flight View

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

Status: Active
Owner: Codex
Created: 2026-07-30
Design authority: `docs/superpowers/specs/2026-07-30-airbus-storm-flight-view-design.md`

## Purpose

Replace the rejected Airbus Storm Line presentation with a focused, flight-simulator-inspired Storm Flight View. The player must first complete every drag-and-drop qualification card. Only then does **Begin Storm Line** become available; activating it transitions from the Captain interaction view to a tighter, Blender-authored flight view where the windshield, PFD, ND, and ECAM are readable and the aircraft visibly responds to player inputs.

This remains a safe, fictional commemorative simulator exercise. It must not imply that Dad caused an accident, emergency, or systems failure.

## Prompt contract

### Goal

The player completes the Airbus qualification, deliberately enters Storm Flight View, uses accessible flight controls, sees immediate and convincing aircraft/weather response, can make small constrained head movements, and can recenter the view.

### Context

- Approved design: `docs/superpowers/specs/2026-07-30-airbus-storm-flight-view-design.md`
- Current gameplay state: `src/game/state.ts`, `src/game/storage.ts`
- Current simulator: `src/game/airbusSimulator.ts`, `src/game/useAirbusSimulator.ts`
- Current UI: `src/components/Hud.tsx`, `src/App.tsx`
- Current 3D runtime: `src/scenes/PrototypeScene.tsx`, `src/scenes/cockpitModelLoader.ts`
- Blender authority: `tools/blender/prepare_airbus_captain.py`
- Generated runtime asset: `public/models/airbus-captain.glb`
- Rejected predecessor plan: `plans/0023-airbus-storm-line-simulator.md`

### Constraints

- Leave all Tesla/Model Y code, assets, progression, and spoiler protection unchanged.
- Preserve the existing Airbus cockpit composition and corrected PFD/ND/ECAM display fit.
- Keep game rules separate from React Three Fiber presentation.
- Mirror required 3D interaction with native HTML controls.
- Add no production dependency.
- Persist and migrate state safely; old `skipped` saves may not bypass qualification.
- Keep one authoritative fixed-step simulation frame; 3D rendering reads it directly, while HTML telemetry is throttled to at most 10 Hz.
- Author the Storm Flight camera in Blender and export it as a named runtime contract.
- Limit look to yaw ±10 degrees, pitch ±6 degrees, lean ±1.5 cm, and zero roll.
- Respect reduced motion.
- Do not hand-edit the generated GLB.

### Done when

- Drag-and-drop qualification is mandatory and all-correct completion is the only path to **Begin Storm Line**.
- Existing `skipped` saves are migrated: all-correct assignments become completed; all others return to unseen with Storm locked.
- A 1.25-second camera push enters `CAM_AIRBUS_CAPTAIN_STORM_FLIGHT`; reduced-motion users transition immediately.
- Storm Flight View visibly responds to pitch and bank input.
- Limited look, **Recenter**, and the `R` shortcut work within the approved limits.
- The controls drawer defaults expanded on coarse pointers or widths at most 768 px and collapsed on wider fine-pointer devices.
- Relevant unit, asset-contract, lint, type, and browser checks pass.
- A fresh 1440×900 browser screenshot is presented for owner approval before narrow-width evidence is treated as accepted.

## Current state

- The first Storm Line implementation is present but rejected.
- The cockpit display planes have been resized/repositioned and their canvas textures are no longer vertically inverted.
- The current GLB is 39,884,100 bytes at SHA-256 `0a6c8aeb1e1fdbfc85db01becb812ca0c3b7810208d03fba65f26c4fa4306251`.
- Schema migration retires `familiarization: "skipped"`; only all-correct qualification assignments unlock the Simulator Hub and Storm Line.
- The runtime exports and consumes both the Captain interaction camera and the raised Blender-authored Storm Flight camera.
- Focused production-browser evidence proves meaningful pitch/bank response, constrained look, live displays, and physical ND/ECAM interaction.

## Scope

### In scope

- Airbus qualification state and persistence migration.
- Airbus camera phase and transition.
- A320 Blender camera authoring/export contract.
- Limited Storm Flight head movement and recentering.
- Compact responsive flight controls and telemetry.
- Direct simulation-to-3D visual response.
- Focused automated checks, browser proof, reports, and evidence.

### Out of scope

- Tesla/Model Y changes.
- New aircraft systems, failures, accidents, or operational training.
- A free-flight world, navigation database, realistic procedure simulation, or broad cockpit remodel.
- Uncontrolled rewriting of the accepted Airbus Blender scene.

## Progress

- [x] Approved Storm Flight View design recorded.
- [x] Successor ExecPlan created after rejection of the prior presentation.
- [x] Qualification gating and schema migration implemented.
- [x] Blender Storm Flight camera authored, exported, and contract-validated.
- [x] Runtime camera transition and limited look implemented.
- [x] Simulation-to-visual response repaired and proven.
- [x] Compact controls drawer and accessible controls implemented.
- [x] Focused checks pass.
- [x] 2026-07-31 — Rebuilt and prepared the complete Blender/GLB simulator contract after PR CI proved the previously committed model omitted the required display, control, and Storm Flight camera nodes.
- [ ] Fresh 1440×900 owner-gate screenshot approved.
- [ ] Narrow-width evidence and reports finalized after approval.

## Discoveries

- The prior weather plane followed the camera quaternion and did not make pitch/bank changes legible enough in the browser.
- Correct display geometry alone does not make the flight view readable; the camera composition is a separate Blender-authored contract.
- A persisted `skipped` value is a progression bypass and must be explicitly retired rather than merely hiding the Skip button.
- The reducer's exhaustive fallback makes an unregistered action visibly invalid, so camera transitions must be introduced in the action union and reducer together.
- The previous 1.4× weather-horizon gain produced only 0.0464 radians of early visual roll even while telemetry changed; a tested 2.6× visual adapter crosses the meaningful-motion threshold without changing flight rules.
- Schema v10 correctly relocked an old browser fixture that claimed in-progress Storm state without the five qualification assignments.

## Visual defect ledger

- Screenshot judged: `preview-renders/storm-line/airbus-display-fit-pass2-1440.png`
- Visible defect: the Captain interaction framing is still too broad for flight gameplay; windshield cues and the PFD/ND/ECAM do not read together as a focused simulator view.
- Likely owner-visible cause: Storm Line reuses the interaction camera instead of a dedicated forward/up flight camera.
- First variable to change: author `CAM_AIRBUS_CAPTAIN_STORM_FLIGHT` at the approved 58-degree vertical FOV, preserving all display-plane geometry.
- Proof to capture: `preview-renders/storm-line/airbus-storm-flight-view-1440.png` from the actual browser.

## Decision log

- 2026-07-30: Use two Blender-authored cameras with a runtime transition, not a single camera with ad hoc offsets.
- 2026-07-30: Make qualification mandatory and remove the skip path.
- 2026-07-30: Use an Aerofly-inspired focused composition rather than a broad sightseeing view.
- 2026-07-30: Start with a 58-degree vertical field of view and calibrate one camera variable at a time.
- 2026-07-30: Limit head motion rather than enabling free orbit controls.
- 2026-07-30: Gate narrow-width evidence on owner approval of the fresh 1440×900 composition.

## Implementation tasks

### Task 1: Make qualification mandatory and migrate persistence

Files:

- Modify: `src/game/state.ts`
- Modify: `src/game/state.test.ts`
- Modify: `src/game/storage.ts`
- Modify: `src/game/storage.test.ts`

Steps:

1. Add failing reducer tests proving:
   - all correct assignments set familiarization to `completed` and camera phase to `qualified`;
   - Storm cannot start before all assignments are correct;
   - beginning the transition changes `qualified` to `transitioning`;
   - starting the simulator changes `transitioning` to `storm`;
   - no reducer action can mark familiarization `skipped`.
2. Add failing storage tests proving:
   - an old skipped save with all correct assignments migrates to completed/qualified;
   - an old skipped save with incomplete or incorrect assignments migrates to unseen/familiarization and resets unearned Storm progress;
   - an earned/completed Storm reward remains earned.
3. Run:

   ```bash
   npm test -- --run src/game/state.test.ts src/game/storage.test.ts
   ```

   Expected: new tests fail for missing camera phase and the old skip bypass.
4. Bump the persisted schema version, add the migration, remove `skipped` from live state/actions, and enforce assignment-derived qualification in the reducer.
5. Rerun the focused tests until green.

### Task 2: Author and validate the Storm Flight camera

Files:

- Modify: `tools/assets/airbus-simulator-contract.test.mjs`
- Modify: `tools/assets/airbus-simulator-contract.mjs`
- Modify: `tools/blender/prepare_airbus_captain.py`
- Modify: `tools/blender/promote_airbus_captain_gate.py`
- Modify: `src/scenes/cockpitModelLoader.ts`
- Modify: `art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json`
- Regenerate: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`
- Regenerate: `public/models/airbus-captain.glb`

Steps:

1. Add a failing asset-contract test requiring `CAM_AIRBUS_CAPTAIN_STORM_FLIGHT` and its metadata:
   - `game_id = "airbus.a320.camera.captain_storm_flight"`
   - `purpose = "storm-flight"`
   - `seat_role = "captain"`
   - `aircraft = "Airbus A320"`
   - initial vertical FOV approximately 58 degrees.
2. Run:

   ```bash
   npx vitest run tools/assets/airbus-simulator-contract.test.mjs
   ```

   Expected: failure because the camera is absent.
3. Add the camera to the Blender preparation script without changing accepted display geometry.
4. Rebuild via the existing Airbus asset command with `BLENDER_BIN` set to the installed Blender binary.
5. Update the runtime loader contract and gate promotion metadata.
6. Run:

   ```bash
   npx vitest run tools/assets/airbus-simulator-contract.test.mjs
   npm run assets:check
   ```

7. Record the new GLB size/hash and camera contract in the asset report.

### Task 3: Implement deterministic camera phases and limited look

Files:

- Create: `src/scenes/airbusCameraRig.ts`
- Create: `src/scenes/airbusCameraRig.test.ts`
- Modify: `src/scenes/PrototypeScene.tsx`
- Modify: `src/App.tsx`

Steps:

1. Add failing pure tests for:
   - transition interpolation from the Captain camera to the Storm camera;
   - yaw clamp ±10 degrees;
   - pitch clamp ±6 degrees;
   - lean clamp ±1.5 cm;
   - no roll;
   - recenter returning all offsets to zero.
2. Run:

   ```bash
   npm test -- --run src/scenes/airbusCameraRig.test.ts
   ```

   Expected: failure because the camera-rig module does not exist.
3. Implement the pure clamping/interpolation helpers.
4. Resolve both named Blender cameras from the loaded GLB.
5. Drive the active R3F camera from reducer camera phase:
   - `familiarization` and `qualified`: Captain interaction camera;
   - `transitioning`: 1.25-second eased interpolation;
   - `storm`: Storm Flight camera plus constrained look offsets.
6. For reduced motion, skip interpolation while preserving the same state transition.
7. Add pointer/touch look handling scoped to the viewport and keyboard `R` recentering.
8. Rerun the unit test and targeted typecheck.

### Task 4: Repair authoritative simulation-to-visual response

Files:

- Modify: `src/game/airbusSimulator.ts`
- Modify: `src/game/useAirbusSimulator.ts`
- Modify: `src/scenes/PrototypeScene.tsx`
- Modify: `src/game/airbusSimulator.test.ts`
- Modify: `e2e/airbus-storm-line.spec.ts`

Steps:

1. Strengthen the browser test so sustained bank and pitch input must change an exposed visual horizon/attitude measurement by a meaningful threshold, not merely change telemetry text.
2. Run:

   ```bash
   npx playwright test e2e/airbus-storm-line.spec.ts --project=chromium
   ```

   Expected: the visual-response assertion fails before the repair.
3. Keep the simulator fixed-step and make one frame object authoritative.
4. Have the R3F frame loop read `simulationRef.current` directly and orient world/weather cues from aircraft attitude in a stable world frame.
5. Keep HTML telemetry on the existing throttled subscription at no more than 10 Hz.
6. Rerun simulator unit tests and the focused browser test until both pass.

### Task 5: Replace the briefing with qualification-to-flight UI

Files:

- Modify: `src/components/Hud.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.tsx`
- Modify: `e2e/airbus-storm-line.spec.ts`
- Modify: `e2e/smoke.spec.ts`
- Modify: `e2e/viewer-controls.spec.ts`

Steps:

1. Add failing browser assertions proving:
   - there is no Skip control;
   - **Begin Storm Line** is absent until all cards are correctly assigned;
   - the button appears in the qualified phase;
   - activating it enters the transition and then Storm Flight View;
   - native HTML controls remain available;
   - **Recenter** and `R` reset limited look;
   - the controls drawer defaults expanded at 768 px/coarse pointer and collapsed at 1440 px/fine pointer.
2. Run the focused Playwright test and confirm the new assertions fail.
3. Replace the old briefing/skip path with qualified-state messaging and **Begin Storm Line**.
4. Implement the compact responsive controls drawer and accessible labels/status.
5. Keep the viewport dominant in Storm Flight View and avoid covering the primary instruments.
6. Rerun the focused browser tests.

### Task 6: Validate and present the owner gate

Files:

- Modify: `asset-reports/airbus-storm-line-simulator.md`
- Modify: `TEST_REPORT.md`
- Modify as evidence requires: `preview-renders/storm-line/`

Steps:

1. Run focused validation:

   ```bash
   npm test -- --run src/game/state.test.ts src/game/storage.test.ts src/game/airbusSimulator.test.ts src/scenes/airbusCameraRig.test.ts
   npx vitest run tools/assets/airbus-simulator-contract.test.mjs
   npm run lint
   npm run typecheck
   npm run build
   npm run assets:check
   npx playwright test e2e/airbus-storm-line.spec.ts e2e/smoke.spec.ts e2e/viewer-controls.spec.ts --project=chromium
   ```

2. Launch the actual app and exercise:
   - incomplete qualification;
   - wrong placement and retry;
   - full qualification;
   - transition;
   - pitch/bank response;
   - repeated input;
   - recenter button and `R`;
   - reload during qualification and Storm;
   - reduced motion.
3. Capture a fresh 1440×900 screenshot showing the Storm Flight composition and readable instruments.
4. Review the full scoped diff for progression bypasses, duplicate simulation state, unsafe DOM insertion, unrelated Tesla changes, and accidental generated-file hand edits.
5. Update the asset report, `TEST_REPORT.md`, discoveries, decisions, evidence, and remaining delta with commands actually run.
6. Pause for owner approval of the 1440×900 visual composition.
7. After approval, capture approximately 768 px and 375 px evidence, repair any narrow-layout issue, and rerun nearby regression checks.

## Validation matrix

| Boundary | Proof |
| --- | --- |
| Qualification gate | Reducer tests plus browser test with missing/wrong/all-correct assignments |
| Save migration | Schema migration tests for legacy skipped/incomplete/completed cases |
| Blender contract | GLB contract test for named camera, metadata, and FOV |
| Camera motion | Pure clamp/interpolation tests plus browser recenter checks |
| Flight response | Simulator unit tests plus browser-visible horizon/attitude delta |
| Accessibility | Native controls, labels, keyboard flight inputs, `R`, reduced motion |
| Responsive layout | 1440 owner gate, then 768 and 375 evidence after approval |
| Regression | lint, typecheck, build, assets check, smoke and viewer-control tests |

## Repair loop

For each failed check:

1. Record the exact failure and boundary.
2. Identify the first divergence between expected and actual state.
3. Make the smallest coherent repair.
4. Rerun the failed check and its nearest regression check.
5. Stop if three consecutive attempts do not shrink the remaining delta or if an owner visual decision is required.

Tests must not be weakened to accept the rejected presentation.

## Evidence

- Approved design: `docs/superpowers/specs/2026-07-30-airbus-storm-flight-view-design.md`
- 2026-07-30: `npm test -- --run src/game/state.test.ts src/game/storage.test.ts` — 71 tests passed after the schema-v10 and mandatory-qualification implementation.
- 2026-07-30: `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` — Blender 5.1.2 source preparation, validation, preview render, GLB export, glTF validation, and inspection passed with the existing imported-source warnings.
- 2026-07-30: `npm run assets:check` — passed after exporting `CAM_AIRBUS_CAPTAIN_STORM_FLIGHT`.
- 2026-07-31: `public/models/airbus-captain.glb` — 39,884,100 bytes; SHA-256 `0a6c8aeb1e1fdbfc85db01becb812ca0c3b7810208d03fba65f26c4fa4306251`. The focused production A320 loading, Storm Line, Engine-Out, and ND/ECAM mesh-interaction browser boundaries all passed against these exact bytes.
- 2026-07-30: `npm run typecheck` — passed.
- 2026-07-30: focused Vitest/contract run — 88 tests passed across state, storage, simulation, camera rig, weather visuals, and GLB contract.
- 2026-07-30: four accessible Chromium Storm Flight tests passed.
- 2026-07-30: production-GLB Chromium proof passed, including qualification transition, camera phase, visible bank response, limited look, recenter, current asset bytes, and console cleanliness.
- Owner-gate capture: `preview-renders/storm-line/airbus-storm-flight-view-1440.png`.
- Living implementation evidence will be recorded here with exact commands, timestamps, asset hashes, and screenshot paths.

## Outcome

Implementation, narrow-width evidence, report promotion, and the automated completion matrix are complete. Owner play and visual approval of the current captain-seat composition remains open.
