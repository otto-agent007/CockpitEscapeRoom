# A320 First-Officer playable repair

## Purpose

Repair the deployed First-Officer opening so it starts from a readable Airbus A320 right-seat cockpit view and uses the intended label-card placement puzzle instead of sidebar dropdowns.

## Current state

Fresh local browser reproduction showed the Airbus phase opens to a dark exterior/briefcase-like GLB framing and a right sidebar of `<select>` controls. That contradicts the design direction in `docs/GAME_DESIGN.md`, which calls for approachable A320 drag-and-drop cockpit familiarization.

## Scope

Included: Airbus phase layout, HTML drag/drop and keyboard-accessible card placement, recoverable state behavior, focused tests, browser screenshots at 375/768/1440 px, and validation evidence.

Excluded: final A320 production-art approval, individual 3D control pivots, real operational procedure simulation, DC-9/locker/reward redesigns, and Model Y/Mars changes.

## Context and constraints

- Keep game rules in `src/game`, presentation in `src/scenes`, and accessible controls in `src/components`.
- Preserve local-only progress and recover safely from stale saves.
- Do not hand-edit generated GLBs. If the A320 asset is regenerated, use `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus`.
- Keep the A320 scene spoiler-safe: no DC-9, Model Y, Flight Mode, or Mars references.
- The A320 remains a playable proof until owner visual approval.

## Progress

- [x] 2026-07-06 - Reproduced the broken Airbus phase locally and captured `.cache/screenshots/pre-fix-airbus-1440.png`.
- [x] 2026-07-06 - Locked product choices: top tray plus cockpit targets, clean training overlays, and asset/camera repair included if required.
- [x] 2026-07-06 - Implemented the Airbus training overlay and recoverable card movement.
- [x] 2026-07-06 - Updated focused unit and e2e tests.
- [x] 2026-07-06 - Ran validation and captured 375/768/1440 px evidence.
- [x] 2026-07-06 - Restored visible direct-GLB rendering by gating Airbus OrbitControls until after the exported First-Officer camera is applied.
- [x] 2026-07-06 - Updated the smoke test to click Verify and assert the real Airbus-to-locker transition.
- [x] 2026-07-06 - Widened the runtime Airbus gameplay camera to 68 degrees and retuned mobile target spacing.
- [x] 2026-07-06 - Replaced visible cockpit target placeholders with direct part hotspots that outline on drag hover.
- [x] 2026-07-06 - Retuned hotspot geometry so the sidestick, thrust, radio, gear, and altitude outlines sit on the rendered cockpit parts.
- [x] 2026-07-06 - Added accepting decoy cockpit objects and deferred correctness judging until all six cards are placed.

## Discoveries

- The prior `TEST_REPORT.md` entry claimed refreshed A320 screenshots were reviewed, but the fresh local screenshot shows the runtime view is not acceptable.
- `public/images/a320-fo-view.png` remains useful for the opening briefing hero, but the Airbus gameplay phase no longer depends on it as a visual backing.
- The exported GLB camera renders a readable cockpit view when reimported into Blender. The browser defect was the fallback OrbitControls mount timing, which could override the exported camera before the first settled Airbus render.

## Decision log

- 2026-07-06 - Use an Airbus-specific overlay shell for the matcher instead of the global sidebar. Rationale: the puzzle is spatial and cockpit-facing, while the sidebar caused the exact dropdown interaction the owner rejected.
- 2026-07-06 - Keep the existing `airbusAssignments` storage shape. Rationale: no save migration is needed for this repair.
- 2026-07-06 - Keep `public/images/a320-fo-view.png` for the opening briefing hero only, and make the Airbus gameplay phase render the GLB canvas at opacity 1. Rationale: the playable proof should validate the deployable GLB camera path directly.
- 2026-07-06 - Override the Airbus gameplay camera to a 68 degree runtime FOV while preserving the exported source camera transform. Rationale: owner feedback was that the direct-GLB view felt too small/tight for gameplay.
- 2026-07-06 - Keep native HTML target buttons but render them as transparent cockpit hotspots. Rationale: direct drag/drop onto cockpit parts satisfies owner feedback while preserving keyboard and screen-reader access.
- 2026-07-06 - Use a 92 degree Airbus runtime FOV only on narrow portrait viewports. Rationale: the sidestick must be visible on phone before its hotspot can honestly highlight the object itself.
- 2026-07-06 - Treat decoy cockpit objects as real drop slots and judge only after all six cards are placed. Rationale: this avoids answer giveaways and makes the matcher more challenging.

## Validation plan

Run focused unit and browser tests, then the full check:

```bash
npm run test -- src/game/state.test.ts
npm run test:e2e -- e2e/smoke.spec.ts
npm run lint
npm run typecheck
npm run test
npm run build
npm run assets:check
npm run check
```

Browser QA must cover correct placement, wrong placement and retry, repeated wrong placement, hint, keyboard/click fallback, reload persistence, reduced-motion mode, and screenshots near 375, 768, and 1440 px.

## Acceptance criteria

- Airbus onboarding opens on a readable FO-seat A320 cockpit composition, not a dark exterior silhouette.
- Five label cards appear in a top tray and can be placed on cockpit target zones.
- Dropdown comboboxes are absent from the Airbus matcher.
- Keyboard/touch fallback can complete the same puzzle without WebGL-only interaction.
- Wrong placements remain recoverable and never erase completed progress.
- Reload preserves in-progress Airbus assignments.
- Validation commands and screenshot evidence are recorded in `TEST_REPORT.md`.

## Evidence

- Generated UI concept reference:
  - `/home/user1/.codex/generated_images/019f3663-2316-73a1-a793-3ac8fa73f84e/ig_030598814eb65800016a4b5f4875c0819995d4974d9af1afb6.png`
- `npm run test -- src/game/state.test.ts` - pass; 7 reducer tests.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 2 test files and 10 tests.
- `npm run build` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests.
- `npm run assets:check` - pass; existing DC-9 validator info rows remain.
- `npm run check` - pass.
- Browser QA via Playwright fallback covered pointer drag placement, keyboard-only placement, wrong-card retry, reduced-motion mode, and `?skip3d=1` completion with no console errors.
- Screenshot evidence:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-repair-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-repair-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-repair-375.png`
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; Blender 5.1.2 exported `public/models/airbus-first-officer.glb`.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; smoke coverage now clicks Verify and asserts the real locker transition.
- Direct-GLB browser screenshots captured with canvas opacity 1 and no console errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-375.png`
- Wide-camera screenshot pass recaptured those same direct-GLB paths at 375, 768, and 1440 px with canvas opacity 1 and no console errors.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests after adding drag-enter highlight and direct hotspot drop coverage.
- `npm run lint` - pass after direct cockpit hotspot changes.
- `npm run test -- src/game/state.test.ts` - pass; 8 reducer tests after adding decoy placement coverage.
- `npm run check` - pass; lint, typecheck, 11 Vitest tests, and production build completed after decoy placement changes.
- `git diff --check` - pass after direct cockpit hotspot changes.
- Direct cockpit hotspot screenshot evidence:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-375.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-hotspot-highlight-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-decoy-highlight-1440.png`
- The latest sidestick highlight proof shows the outline on the sidestick itself rather than beside it.
- The latest decoy proof shows a non-answer cockpit object highlighting during card drag; pre-drag desktop/tablet screenshots show no cockpit hotspots visible.

## Outcome and handoff

The Airbus First-Officer phase now opens on a readable direct A320 GLB cockpit composition with top-tray label cards and direct cockpit-part drop hotspots. The old dropdown sidebar is removed from the Airbus matcher, the static source-review cockpit backing is no longer used during gameplay, and the smoke test covers hidden pre-drag hotspots, drag-hover highlighting, accepted decoy placement, and the real Verify-to-locker transition. The visible hover outlines have been retuned to sit on the rendered cockpit parts, including the sidestick. Owner visual approval, individual control pivots, mesh-backed target regions, and live display treatments remain future Airbus production-art work.
