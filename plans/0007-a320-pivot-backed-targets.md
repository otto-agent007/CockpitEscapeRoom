# A320 pivot-backed First-Officer targets

> **Seat-role supersession notice (2026-07-15):** This historical record preserves the then-current DC-9 captain / A320 first-officer assignment. The active production contract now uses DC-9 first-officer/right-seat and Airbus A320 Pop T captain/left-seat roles. Historical evidence below is unchanged.


## Purpose

Promote the Airbus First-Officer label targets from screen-projected hotspots to asset-backed runtime targets. Players should still complete the same five-card onboarding flow, but the A320 GLB should now carry documented pivot proxies and raycastable hitboxes for the five player-facing cockpit targets.

## Current state

The previous pivot experiment was not visually verified. It replaced the real shaded cockpit surface with `public/images/a320-fo-view.png`, used screen-tuned rectangles, converted cockpit materials to debug-like unlit materials, and attached head-look/picking handlers to `window` and `document`. Its GLB reimport checks proved only that target nodes survived export; they did not prove that those nodes aligned with visible A320 controls. This recovery restores the real shaded GLB and requires separate measured browser evidence for visual alignment.

## Scope

Included:

- Add deterministic A320 label-target pivot proxies and invisible hitboxes in the assembly pipeline.
- Regenerate A320 assembly, shading, and deployable GLB artifacts through the normal commands.
- Wire direct WebGL target picking to the existing Airbus card-placement reducer path.
- Preserve HTML target buttons, keyboard access, drag/drop, ATP gate, reload behavior, and reduced-motion behavior.
- Update A320 runtime contract, browser integration evidence, asset reports, this ExecPlan, and `TEST_REPORT.md`.

Excluded:

- Splitting or repairing every imported A320 cockpit knob and switch mesh.
- Removing `A320 PLAYABLE PROOF` before owner approval.
- DC-9, locker, Model Y, Flight Mode, Mars, or Vercel deployment work.
- New production dependencies or hand-editing generated GLBs.

## Context and constraints

- Airbus target remains Airbus A320 and must not mix DC-9 details.
- Interactions remain fictional and non-operational.
- Stable names, pivots, hierarchy, `game_id`, and `userData` metadata are runtime contracts.
- Invisible hitboxes may expand clickable areas, but visible cockpit geometry must not be distorted.
- Every required 3D interaction must retain a native HTML or equivalent accessible path.

## Progress

- [x] 2026-07-09 - Confirmed active branch `agent/a320-production-ready-candidate` and only unrelated `.vercel/` untracked.
- [x] 2026-07-09 - Added deterministic A320 label-target pivot proxies and hitbox metadata to the assembly script.
- [x] 2026-07-09 - Regenerated A320 assembly, shading, and deployable GLB artifacts.
- [x] 2026-07-09 - Wired GLB-backed target projection, raycast picking, and native keyboard fallback to the existing card-placement reducer.
- [x] 2026-07-09 - Corrected Blender-to-runtime target axis mapping and recorded both Blender and runtime target coordinates.
- [x] 2026-07-09 - Updated gate/report evidence and ran focused, asset, e2e, and full validation.
- [x] 2026-07-09 - Recorded the contained A320 reference-plane experiment as rejected evidence; it is not a valid gameplay or alignment solution.
- [x] 2026-07-09 - Marked the flat-reference-plane evidence and prior target alignment claims unverified; recorded the recovery baseline and measured actual control rays from the restored FO camera.
- [x] 2026-07-09 - Restored direct shaded-GLB rendering, camera/material/lighting/postprocessing, and canvas-scoped constrained head-look.
- [x] 2026-07-09 - Exported calibrated pivot, collider, and cue-proxy nodes and verified the five player targets in the browser.
- [x] 2026-07-09 - Captured and inspected initial and target-visible evidence at 1440 and 768 px, plus 375 px sanity and 768 px reduced-motion evidence.

## Discoveries

- The existing runtime target projections use five stable world-space anchors that are suitable for first-pass hitbox placement.
- The imported A320 source still has compound visual controls, so this pass uses verified runtime pivot proxies rather than destructive source mesh splitting.
- Blender export remaps target coordinates into Three.js runtime axes, so the assembly script stores intended runtime coordinates and converts them into Blender-space target locations before export.
- Playwright mouse delivery through the overlay did not reliably prove the canvas raycast path. The browser smoke now verifies GLB-backed projected targets in 3D mode, then completes the placement through the native keyboard equivalent.
- Owner desktop review showed an earlier direct GLB/collider pass could present a too-dark cockpit and misaligned visual boxes, including a cut-off sidestick. That contained-reference experiment was rejected and removed; the final candidate renders the regenerated shaded GLB directly.
- The prior "pivot verified" count conflated export survival with visual alignment. The revised contract records `pivotExportVerified` and `visualAlignmentStatus` independently.
- Blender camera-ray calibration against the restored FO view produced object-space anchors for the sidestick, thrust levers, gear lever, FO radio panel, and FCU altitude area. The final screenshots verify those exported pivots at both approval-blocking widths.
- Rendering cue-proxy edges in WebGL caused severe software-Chromium frame starvation. Keeping cue and hitbox meshes invisible while projecting compact DOM pins from the exported pivots preserved asset-backed positioning, direct collider raycasts, and reliable browser performance.

## Decision log

- 2026-07-09 - Repair the five player-facing First-Officer target pivots first and document the rest as deferred. Rationale: these are the only controls required by the current player loop.
- 2026-07-09 - Keep HTML hotspots as the accessibility layer while adding direct WebGL picking. Rationale: required interaction must not exist only inside WebGL.
- 2026-07-09 - Use invisible hitbox children under pivot proxy nodes. Rationale: this verifies runtime pivots and raycast targets without changing visible cockpit proportions.
- 2026-07-09 - Project browser targets from exported GLB target nodes instead of hard-coded screen anchors. Rationale: the runtime overlay must track the asset contract after Blender-to-glTF axis conversion.
- 2026-07-09 - Reject the contained reference-plane repair as gameplay output and keep the reference image briefing-only. Rationale: the plane cannot provide object anchoring, correct occlusion, or credible head-look evidence.
- 2026-07-09 - Keep exported cue and hitbox meshes invisible and render compact cyan DOM pins from the exported pivot projections. Rationale: WebGL edge helpers starved software Chromium, while pivot projection retains asset-backed placement and collider raycasts without the performance failure.

## Milestones

1. A320 assembly outputs record five pivot-verified label targets and preserve the full imported-candidate audit.
2. A320 shaded and deployable GLBs preserve the new target names and metadata.
3. The browser renders the real shaded A320 GLB, raycasts exported colliders, and projects compact pinned labels from target pivots only during placement.
4. Existing HTML, drag/drop, keyboard, ATP, reload, and reduced-motion paths still pass.

## Implementation steps

- Update `tools/blender/cockpit_pipeline/a320_assembly_blender_build.py` to create `AIRBUS_A320_TARGET_*_PIVOT` and `AIRBUS_A320_TARGET_*_HITBOX` nodes with exported metadata.
- Update `tools/blender/cockpit_pipeline/a320_assembly_job.py` and `tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` so gates, reports, validation snapshots, and shaded exports preserve those target contracts.
- Update `src/App.tsx`, `src/components/Hud.tsx`, `src/scenes/PrototypeScene.tsx`, and `src/styles.css` so selected-card canvas clicks use raycasted A320 target metadata and dispatch `ASSIGN_AIRBUS_CARD`.
- Update `e2e/smoke.spec.ts` for a GLB-backed projected-target proof plus native keyboard placement.

## Validation plan

Run:

```bash
python3 -m py_compile tools/blender/cockpit_pipeline/a320_assembly_blender_build.py tools/blender/cockpit_pipeline/a320_assembly_job.py tools/blender/cockpit_pipeline/a320_shading_blender_apply.py
python3 -m tools.blender.cockpit_pipeline.preflight
BLENDER_BIN=/home/user1/.local/bin/blender python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-assembly-job
BLENDER_BIN=/home/user1/.local/bin/blender python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job
BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json
npx gltf-transform validate public/models/airbus-first-officer.glb
npm run assets:check
npm run pipeline:evals
npm run test:e2e -- e2e/smoke.spec.ts
npm run check
git diff --check
```

Browser QA covers GLB-backed target projection, HTML click/keyboard fallback, drag/drop, wrong placement and correction, ATP reveal, locker transition, reload persistence, reduced motion, and no console errors in the smoke suite.

## Acceptance criteria

- `node-pivot-report.json` inventories all imported A320 candidates and records five pivot-verified label targets.
- `public/models/airbus-first-officer.glb` contains the five target pivot and hitbox nodes with `game_id`, `control_id`, `interaction`, and pivot metadata.
- Selecting a card exposes GLB-backed projected target boxes, and native target controls assign the card through the same reducer path.
- HTML buttons and keyboard access remain sufficient to complete Airbus onboarding without WebGL-only interaction.
- All validation commands listed above pass or any blocker is recorded with exact failure output.

## Repair loop and stop conditions

Repeat review -> focused repair -> validation -> browser inspection -> diff review. Stop when validation passes, the remaining delta stops shrinking, or owner visual approval is required.

## Evidence

- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_assembly_blender_build.py tools/blender/cockpit_pipeline/a320_assembly_job.py tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py` - pass.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; Blender 5.1.2, Node v26.3.0.
- `BLENDER_BIN=/home/user1/.local/bin/blender python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-assembly-job` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass.
- `BLENDER_BIN=/home/user1/.local/bin/blender python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; produced `public/models/airbus-first-officer.glb`.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors or warnings, with seven informational `UNUSED_OBJECT` rows for target cue UVs.
- `npm run assets:check` - pass; A320 and DC-9 GLBs had no errors or warnings, with informational unused UV/empty-node rows.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build.
- `git diff --check` - pass.
- Runtime GLB: `public/models/airbus-first-officer.glb`, 39,875,220 bytes, SHA-256 `d40d50006091230a2a04372cf57ee4ee7f0bfa3bce4bc01ebda05259ca9e482b`.
- Assembly validation: status `pass`, 5 label targets, 5 pivot-verified label targets, 5 total pivot-verified targets.
- Approval-blocking browser evidence: `airbus-approval-candidate-initial-1440.png`, `airbus-approval-candidate-targets-1440.png`, `airbus-approval-candidate-initial-768.png`, and `airbus-approval-candidate-targets-768.png` under `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/`.
- Supporting evidence: `airbus-approval-candidate-sanity-375.png` and `airbus-approval-candidate-reduced-motion-768.png` in the same directory.

## Outcome and handoff

Implemented and validated as an owner-reviewable gate candidate. The runtime uses the real shaded GLB, asset-backed projected pins, and collider raycasts. Owner visual approval is still required before removing `A320 PLAYABLE PROOF`; imported source controls outside the five player-facing targets remain deferred.
