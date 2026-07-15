# A320 cockpit production-readiness browser proof

> **Seat-role supersession notice (2026-07-15):** This historical record preserves the then-current DC-9 captain / A320 first-officer assignment. The active production contract now uses DC-9 first-officer/right-seat and Airbus A320 Pop T captain/left-seat roles. Historical evidence below is unchanged.


## Purpose

Move the Airbus A320 First-Officer cockpit from playable proof toward production readiness by making the browser view brighter, more readable, and still anchored to the exported First-Officer point of view.

## Current state

The Airbus phase loads `public/models/airbus-first-officer.glb` from `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` in `src/scenes/PrototypeScene.tsx`. The label-card puzzle and accessible HTML targets are working, but the runtime cockpit lighting is too dark in the main panel, side console, and lower cockpit. The asset remains `A320 PLAYABLE PROOF` until owner visual approval.

## Scope

Included: browser runtime lighting, constrained FO orbit-control tuning, screenshot evidence at 375/768/1440 px, focused browser validation, and documentation updates.

Excluded: Blender source lighting edits, generated GLB regeneration, individual control-pivot cleanup, new puzzle mechanics, DC-9/locker/reward work, and removal of proof labels.

## Context and constraints

- Keep game rules in `src/game`, 3D presentation in `src/scenes`, and accessible controls in `src/components`.
- Preserve `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` as the runtime source camera.
- Use restrained seated look/lean orbit controls, not free-flight navigation.
- Do not hand-edit generated GLBs; regenerate only through `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` if required.
- Keep the A320 scene spoiler-safe: no DC-9, Model Y, Flight Mode, or Mars references.
- Lighting should improve readability without hiding proof-stage asset limitations.

## Progress

- [x] 2026-07-08 - Captured baseline browser screenshots at 1440, 768, and 375 px.
- [x] 2026-07-08 - Added a named A320 runtime lighting rig and explicit FO orbit-control constants.
- [x] 2026-07-08 - Captured post-change browser screenshots at 1440, 768, and 375 px.
- [x] 2026-07-08 - Ran focused tests, full `npm run check`, and `npm run assets:check`.
- [x] 2026-07-08 - Recorded final validation evidence and remaining delta.
- [x] 2026-07-08 - Restored the wide gameplay camera after owner clarification and added a subtle Sketchfab-style post-process pass for `FO-view.png` material/render likeness.

## Discoveries

- The baseline browser view showed cockpit landmarks from the right seat, but the main panel, lower cockpit, and FO side console were underlit.
- The current A320 asset can be made substantially more readable with runtime lighting only; no GLB regeneration was required for this checkpoint.
- Browser plugin tools are not available in this session, so Playwright is the browser verification path.
- Post-change browser captures showed no app console errors. The deprecated `PCFSoftShadowMap` warning no longer repeated after switching Canvas shadows to `percentage`; the remaining console warning is the pre-existing Three `Clock` deprecation emitted by React Three Fiber.
- Earlier A320 Sketchfab parity work recorded that the source viewer used Studio lighting, matcap/reflection contribution, SSAO, SSR, TAA, sharpen, vignette, and grain. Runtime parity should approximate the stable pieces without adding a dependency.
- Rechecking the live Sketchfab page is useful for source identity and license state, but the repo's cached viewer extraction is the stronger evidence for the render stack.
- A runtime material/environment override was tested and backed out because it over-brightened the panel and drifted farther from the dark blue-gray FO-view reference. The remaining likeness gap should move to a Blender/source material pass using the cached Studio environment, matcap, and material-channel reports.

## Decision log

- 2026-07-08 - Start with browser proof rather than Blender source changes. Rationale: owner selected the fastest checkpoint for reviewing lighting and FO orbit behavior before deeper asset work.
- 2026-07-08 - Keep `LimitedOrbitControls` instead of switching to a new control package. Rationale: the existing wrapper already applies the exported FO camera before mounting orbit controls and prevents the prior camera override bug.
- 2026-07-08 - Use runtime fill/key/panel lights without casting new A320 shadows. Rationale: the proof needs readable inspection lighting, not dramatic shadowing.
- 2026-07-08 - Keep the wide `68` degree desktop/tablet and `92` degree narrow gameplay camera. Rationale: owner clarified that `airbus-production-lighting-1440.png` has the desired composition; `FO-view.png` is the visual likeness reference, not a crop/framing target.
- 2026-07-08 - Add dependency-free Three post-processing for A320 only: SSAO plus subtle sharpen, vignette, and static grain. Rationale: these are the parts of the recorded Sketchfab stack that can be approximated safely in the browser without changing GLBs.
- 2026-07-08 - Do not continue broad runtime material mutation for visual likeness. Rationale: the tested approach washed out the cockpit; Sketchfab's look depends on source-side material/environment behavior that should be tuned in Blender and validated with preview renders.

## Milestones

1. Baseline browser evidence shows the current underlit A320 proof.
2. Runtime lighting makes the panel, pedestal, and FO side console readable from the FO view.
3. Orbit controls remain constrained around the FO seat with no pan or gameplay zoom.
4. Tests and screenshot evidence are recorded for owner review.

## Implementation steps

- Update `src/scenes/PrototypeScene.tsx`:
  - add `AIRBUS_ORBIT_LOOK_DISTANCE`, `AIRBUS_ORBIT_POLAR_LIMIT`, and `AIRBUS_ORBIT_AZIMUTH_LIMIT`;
  - keep Airbus zoom disabled and pan disabled;
  - add `AirbusRuntimeLighting` with ambient, hemisphere, directional, and point fills;
  - add an Airbus-only `EffectComposer` path using `RenderPass`, `SSAOPass`, a custom Sketchfab-likeness shader, and `OutputPass`;
  - switch Canvas shadows to `percentage` to avoid the deprecated soft shadow-map default.
- Capture before and after screenshots under `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/`.
- Update `asset-reports/cockpit-pipeline/a320-cockpit-2-browser-integration-proof.md` and `TEST_REPORT.md` with actual evidence.

## Validation plan

Run:

```bash
npm run lint
npm run typecheck
npm run test:e2e -- e2e/smoke.spec.ts
npm run check
npm run assets:check
```

Browser QA covers app load, A320 load gate, no framework overlay, no app console errors, hidden pre-drag hotspots, 375/768/1440 px screenshots, and continued accessible label-card interaction.

## Acceptance criteria

- The Airbus phase opens from the exported FO camera and remains labeled `A320 PLAYABLE PROOF`.
- The panel, pedestal, FO sidestick area, and side console are visibly brighter than baseline at 1440 px.
- The mobile view remains usable with cards visible and no pre-drag hotspot outlines.
- Orbit controls remain seated and constrained: no pan, no zoom, and no free-flight movement.
- Existing A320 onboarding and progression tests still pass.
- `npm run check` and `npm run assets:check` pass.

## Repair loop and stop conditions

Repeat review -> focused repair -> execution/validation -> remaining-delta review. Stop when all acceptance checks pass, a maximum of three lighting/control tuning attempts is reached, the remaining delta stops shrinking, or owner visual approval is required.

## Evidence

- Baseline screenshots:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-375.png`
- Post-change screenshots:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-375.png`
- Wide post-process screenshots after owner clarification:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-375.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-sketchfab-post-1920.png`
- Final current-state screenshots after backing out runtime material mutation:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-375.png`
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `npm run assets:check` - pass; A320 GLB had no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
- `git diff --check` - pass.

## Outcome and handoff

The A320 First-Officer browser proof keeps the owner-preferred wide gameplay composition, adds subtle Sketchfab-informed post-processing for material/render likeness to `FO-view.png`, preserves constrained seated orbit controls, preserves the accessible label-card flow, and remains labeled `A320 PLAYABLE PROOF`. It is closer, but it still does not match the Sketchfab/FO-view material response: the next real production step is a Blender/source material and Studio-environment parity pass before upgrading the asset beyond playable proof.
