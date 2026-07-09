# A320 five-card feedback simplification

## Purpose

Make Airbus First-Officer onboarding easier for family players with no pilot training. The player should place five obvious cockpit labels, see each target turn green or red immediately, then answer the ATP-hours question without needing a weird `CLOCK` placement card.

## Current state

The Airbus phase in `src/components/Hud.tsx` renders six cards, including `CLOCK`, plus decoy cockpit targets. `src/game/state.ts` waits until all six cards are placed before grading, then asks the ATP hour question before entering the locker. The status dock spans the bottom of the viewport and feels too large.

## Scope

Included:

- Remove `CLOCK` from the active Airbus card flow while retaining the ATP question after the five labels are correct.
- Restore immediate target feedback for right and wrong card placements.
- Keep click/tap placement and drag/drop placement.
- Move the Airbus status/instructions dock to a compact bottom-right panel.
- Update reducer, storage compatibility, smoke tests, visual evidence, this ExecPlan, and `TEST_REPORT.md`.

Excluded:

- No Blender, GLB, or asset-pipeline changes.
- Runtime camera and lighting changes are included only for the owner-requested repair after the dev server showed the old centered monochrome A320 view.
- No DC-9, locker, Model Y, Flight Mode, or Mars behavior changes.
- No mobile-specific cockpit layout polish. The owner explicitly deferred mobile mode for this pass on 2026-07-08.
- No new dependencies.

## Context and constraints

- The aircraft remains the Airbus A320 and the scene remains spoiler-safe.
- Game rules stay in `src/game`; presentation stays in `src/components` and CSS.
- Required 3D placement has native HTML button equivalents.
- Wrong placements must be safe retries and must not erase later completed progress.
- Existing saved games may contain `airbusClockAnswer` or decoy assignments; they should load safely and clear stale ATP answers.
- Desktop and tablet browser behavior are acceptance targets. Mobile screenshots may be captured for awareness, but mobile layout is not a pass/fail blocker in this checkpoint.

## Progress

- [x] 2026-07-08 - Reproduced current reducer/storage behavior with focused tests.
- [x] 2026-07-08 - Remove active clock/ATP flow and restore immediate feedback.
- [x] 2026-07-08 - Update focused and browser tests.
- [x] 2026-07-08 - Capture desktop/tablet evidence and record validation.
- [x] 2026-07-08 - Removed superseded five-card screenshot artifacts after owner rejected them as approval evidence.

## Discoveries

- The existing reducer intentionally delayed judging cards until all six were placed.
- Storage schema version 3 already includes clock and decoy fields. Keeping the fields as compatibility-only data avoids forcing a saved-game migration for this UI simplification.
- A 375 px screenshot was captured before the owner clarified to forget mobile mode. Mobile cockpit layout polish is now deferred and is not part of this pass's acceptance criteria.
- The first implementation removed the ATP question too. Owner corrected that on 2026-07-08; the intended behavior is no `CLOCK` card, but the ATP question remains after five correct labels.
- The 768 px skip-3D screenshot path exposed overlap between Gear and Radio targets. The tablet breakpoint now separates those target boxes.
- The owner rejected the saved five-card preview captures because the usable baseline is `airbus-production-wide-sketchfab-post-1440.png`, with the remaining UI delta limited to no `CLOCK` card and a smaller bottom-right instructions panel.
- The dev server was still rendering from the centerline because the exported `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` sits at `x=0`. The runtime now offsets and yaws that camera into a locked FO/right-seat eye line.
- The monochrome/washed cockpit was caused by exported GLB `Sun` lights with very high intensities being loaded on top of app lighting. Runtime now disables imported GLB lights and uses controlled app lights.
- Live Blender cleanup was not possible because no Blender add-on listener was available on `127.0.0.1:9876`. Background inspection of `art-source/cockpit-pipeline/stages/assembly/output/a320-cockpit-2-assembly/a320-cockpit-2-assembly.blend` found one scene, one collection, no cameras, and no temporary/default objects to delete.
- The saved FO game camera was recovered from the LFS object at commit `d23ad95`. That `.blend` had active camera `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` at location `(0.167669, -0.695658, 0.140411)`, Euler rotation `(1.367064, 0, 0.282213)`, lens `50`, and camera angle `0.691111`.

## Decision log

- 2026-07-08 - Remove the clock from the active player flow instead of replacing it with another sixth card. Consequence: completion requires only the five real A320 labels.
- 2026-07-08 - Keep unused clock and decoy state fields for compatibility. Consequence: old saves stay readable, while the UI ignores those fields.
- 2026-07-08 - Defer mobile mode. Consequence: validate desktop/tablet behavior now; record mobile as a later responsive-layout pass.
- 2026-07-08 - Restore ATP question after owner correction. Consequence: the five labels reveal the ATP input; `1500` is still required for locker access.
- 2026-07-08 - Lock the browser camera from the runtime instead of trusting the exported A320 game camera. Consequence: the dev server opens from the FO/right-seat side even though the GLB camera remains centered.
- 2026-07-08 - Disable imported GLB lights at runtime. Consequence: the app controls A320 lighting and avoids the exported high-intensity sun lights that blew the cockpit into black/white.
- 2026-07-08 - Restore the recovered saved FO camera transform in the A320 shading script and make the browser offset conditional on a centered legacy GLB camera. Consequence: future regenerated GLBs can carry the saved FO camera without double-applying the runtime repair.

## Milestones

1. Airbus onboarding displays five cards and five visible placement boxes.
2. Each placement is judged immediately with green or red feedback.
3. All five correct labels reveal the ATP question in the compact dock.
4. Correct ATP answer advances to the locker.

## Implementation steps

- Update `src/game/config.ts` to remove `CLOCK` from active `controlCards` and revise Airbus hint/copy as needed.
- Update `src/game/state.ts` so assignment actions grade immediately and reveal the ATP gate once all five real labels are correct.
- Update `src/components/Hud.tsx` to remove rendered decoy targets and `CLOCK` placement, keep accessible target buttons and drag/drop, and show the ATP input only after all five labels are correct.
- Update `src/styles.css` to make target boxes visible by default and make the dock compact at bottom-right.
- Update `src/game/state.test.ts`, `src/game/storage.test.ts`, and `e2e/smoke.spec.ts`.

## Validation plan

Run:

```bash
npm run test -- src/game/state.test.ts src/game/storage.test.ts
npm run test:e2e -- e2e/smoke.spec.ts
npm run lint
npm run typecheck
npm run check
```

Browser QA covers click/tap placement, drag/drop placement, immediate wrong feedback, retry correction, ATP reveal, correct ATP submission, locker transition, reload persistence, keyboard focus, reduced motion, and screenshots at 768 and 1440 px. Mobile mode is documented as deferred.

## Acceptance criteria

- No `CLOCK` card appears in Airbus onboarding.
- The ATP textbox and Verify button appear only after all five real labels are correct.
- Wrong placements turn red immediately and remain recoverable.
- Correct placements turn green immediately.
- All five real controls plus correct ATP answer enter the locker with `firstOfficer` completed.
- Saved Airbus progress with stale ATP data loads with the answer cleared.
- Tests and browser checks pass.

## Repair loop and stop conditions

Repeat focused implementation, validation, browser inspection, diff review, and repair. Stop when acceptance checks pass, the delta stops shrinking, or a visual product decision is required.

## Evidence

- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 reducer/storage tests.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests cover no `CLOCK` card, ATP hidden until labels are correct, immediate red/green placement feedback, recovery, ATP submission, locker transition, GLB load, and reload persistence.
- `npm run lint` - pass.
- `npm run test` - pass; 16 Vitest tests.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- `git diff --check` - pass.
- Superseded Playwright screenshots from this pass were removed from the working tree at owner request. Keep `airbus-production-wide-sketchfab-post-1440.png` as the pickup baseline until a replacement proof is captured.
- 2026-07-08 cleanup verification:
  - `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
  - `npm run typecheck` - pass.
  - `npm run lint` - pass.
  - `git diff --check` - pass.
  - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
  - Local-only browser proof: `.cache/screenshots/a320-right-dock-no-clock-1440.png`; five cards, no `CLOCK` card, lower-right dock measured 336 px wide at 1440 x 900, and no console errors.
- 2026-07-08 FO-seat/color repair verification:
  - Browser screenshot before repair: `.cache/screenshots/current-a320-dev-before-fix-1440.png`; confirmed centered between-seat framing and black/white cockpit.
  - Browser screenshot after repair: `.cache/screenshots/a320-fo-seat-color-final-1440.png`; FO/right-seat biased cockpit view, colored panels/controls, five cards, no `CLOCK` card, projected target layer, and compact lower-right dock.
  - Responsive evidence: `.cache/screenshots/a320-fo-seat-color-final-768.png` and `.cache/screenshots/a320-fo-seat-color-final-375.png`; five cards, no `CLOCK` card, projected target layer, no page console errors.
  - `npm run typecheck` - pass.
  - `npm run lint` - pass.
  - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
  - Background Blender inspection: A320 assembly `.blend` has one scene, one collection, 125 mesh objects, 494 locator empties, zero cameras, and zero suspicious temp/default objects.
  - Historical camera recovery: `git show d23ad95:...a320-cockpit-2-shaded.blend | git lfs smudge` restored `.cache/blender-history/a320-cockpit-2-shaded-d23ad95.blend`; background Blender inspection found active `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` with the saved FO transform.
  - Blender MCP live view: opened `.cache/blender-history/a320-cockpit-2-shaded-d23ad95.blend`, selected `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`, camera view, material preview, overlays off.
  - `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` - pass.
  - PR working-tree live browser proof: Vite at `http://127.0.0.1:4187/`, Playwright 1440 x 900 capture `.cache/screenshots/current-a320-fo-mode-live-1440.png`; FO/right-seat biased colored cockpit view, projected target layer, five cards, no `CLOCK` card, and no page console errors. Screenshot kept in local cache, not committed.
  - PR validation batch:
    - `git diff --check` - pass.
    - `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py tools/blender/validate_scene.py` - pass.
    - `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
    - `npm run assets:check` - pass; A320 reports no glTF errors/warnings/infos/hints, and DC-9 retains existing informational unused texcoord/empty-node rows.
    - `npm run pipeline:evals` - pass; 6/6 eval fixtures.
    - Runtime contract, material optimization, and browser integration gate validation - pass.
    - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
    - `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.

## Outcome and handoff

Airbus onboarding now uses five visible label cards, immediate green/red target feedback, no `CLOCK` card, and the ATP question after all five labels are correct. Mobile cockpit layout polish is deferred.
