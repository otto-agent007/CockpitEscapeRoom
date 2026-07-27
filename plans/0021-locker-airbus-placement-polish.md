# Locker Hat and Airbus Drop-Area Placement Polish

## Purpose

Make the captain's hat read as resting on its locker shelf, move the Airbus radio drop area higher and left, and place the Airbus thrust drop area farther right over the paired thrust levers while preserving the existing player journey and interaction contracts.

## Current state

- The locker hat root is authored at Blender location `(0.56, -0.45, 2.92)`. Its mesh minimum is `2.754038` while the measured shelf surface is `2.765262`, so the composition reads slightly low.
- The Airbus radio pivot is `(-0.040000, -0.474842, 0.011798)` and projects near `(907, 682)` at 1440x900.
- The Airbus thrust pivot is `(0.015000, -0.505764, 0.004800)` and projects near `(1119, 729)` at 1440x900.
- Stable pivot, hitbox, cue, `game_id`, keyboard, persistence, and accessible HTML contracts already exist.

## Scope

Included:

- Blender-authored locker hat placement and its close-focus target.
- Blender-authored Airbus radio and thrust target contracts.
- Generated Blender masters, deployable GLBs, deterministic checks, browser tests, visual evidence, asset reports, and validation records.

Excluded:

- Puzzle rules, copy, save schema, cameras other than the hat close-focus target, other Airbus targets, materials, dependencies, celebration artwork, mobile camera redesign, PR publication, and merge.

## Context and constraints

- Branch from `origin/main`, not the unrelated TMB2 branch.
- Use Blender 5.1.2 at `/home/user1/.local/bin/blender`.
- Never hand-edit a GLB; regenerate with `npm run asset:locker` and `npm run asset:airbus`.
- Preserve stable names, hierarchy, pivots, custom properties, collider alignment, native HTML equivalents, and progression.
- Treat 375px Airbus thrust visibility as the existing narrow-camera limitation; do not worsen fallback accessibility or overflow.
- Keep revised Airbus alignment metadata pending until owner proof is accepted.

## Progress

- [x] 2026-07-26 — Read repository, asset-pipeline, testing, and implementation guidance; inspected source coordinates, GLB contracts, screenshots, and current tests.
- [x] 2026-07-26 — Created `agent/locker-airbus-placement-polish` from clean `origin/main` commit `08b0843`.
- [x] 2026-07-26 — Baseline `npm test` passed 118/118 tests; `npm install` reported six pre-existing high-severity audit findings without changing dependencies.
- [x] 2026-07-26 — Added exact GLB/report and real-browser hat-focus contracts; the old asset/target failed on the expected `2.92` and `1.00` values.
- [x] 2026-07-26 — Raised the locker hat, rebuilt the master/GLB through `asset:locker`, and passed asset validation plus the focused real-GLB browser case.
- [x] 2026-07-26 — Added exact Airbus GLB/status and 1440 projection regression contracts; the old asset failed on the expected radio/thrust translations, verified status, and radio X position.
- [x] 2026-07-26 — Moved only the Airbus radio/thrust authored contracts, rebuilt the master/GLB through `asset:airbus`, and passed asset validation plus the focused production-cockpit browser case.
- [x] 2026-07-26 — Captured and inspected actual-browser 1440/768/375 locker and Airbus placement proof; promoted the accepted local evidence to `preview-renders/placement-polish/`.
- [x] 2026-07-26 — Verified local and Vercel-served bytes, updated reports, passed the full validation stack, deployed the final preview, and completed the diff review.
- [x] 2026-07-26 — Owner accepted the final desktop composition after two focused Thrust corrections; promoted Radio and Thrust alignment metadata, refreshed responsive proof, and rebuilt/revalidated the GLB.

## Discoveries

- The locker hat placement is canonical in `tools/blender/import_locker_room_props.py`; the root owns the visible mesh and hitbox, so moving the root preserves collider alignment.
- The locker shelf surface measured through read-only Blender inspection is Z `2.765262`.
- The Airbus browser does not apply CSS offsets. It projects Blender pivot nodes and uses the matching exported colliders for mesh raycasting.
- Owner review rejected the first Thrust X `0.005` candidate and the restored X `0.015` midpoint, then accepted X `0.025`; the focused browser contract now places it in the 1440 X band `1130–1155`.

## Decision log

- 2026-07-26 — Raise the hat root from Z `2.92` to `2.94`, leaving about 9 mm measured shelf clearance, and move the runtime hat-focus Y from `1.00` to `1.02`.
- 2026-07-26 — Move the radio to `(-0.045000, -0.464842, 0.011798)` so it moves left and higher along the pedestal composition.
- 2026-07-26 — Owner-directed correction supersedes the rejected leftward candidate: move only Thrust X from `0.015000` through the rejected `0.005000` and `0.015000` review candidates to the accepted `0.025000`, leaving Y/Z unchanged.
- 2026-07-26 — Use asset-authoritative movement; do not introduce runtime-only or CSS-only target offsets.
- 2026-07-26 — Keep opt-in evidence capture in the focused Playwright cases behind `PLACEMENT_EVIDENCE_DIR`; normal test runs retain the complete interaction/reload paths without writing screenshots.
- 2026-07-26 — Suppress only the post-focus celebration card during opt-in locker evidence capture because it intentionally covers the rendered shelf. Player-facing behavior and the normal browser test remain unchanged.
- 2026-07-26 — Bind the manual locker model URL to the current GLB SHA-256 prefix (`locker-shelf-0ab00624`) and validate that relationship in `assets:check`; Airbus has no manual version query.

## Milestones

1. The rebuilt locker GLB exports the captain's hat at `[0.56, 2.94, 0.45]` and the browser shows it resting above the shelf with its collider and close-focus sequence intact.
2. The rebuilt Airbus GLB exports radio at `[-0.045, 0.011798, 0.464842]` and thrust at `[0.025, 0.0048, 0.505764]`; projected HTML targets and mesh clicks still agree.
3. Focused and full automated checks pass, responsive browser evidence is inspected, served GLB bytes match disk, and the owner receives a Vercel preview plus consistent screenshots.

## Implementation steps

1. Add exact locker report/GLB placement validation and run `npm run assets:check` to capture the expected old-position failure.
2. Update the importer and hat-focus target, run the supported locker build, then rerun asset and locker browser checks.
3. Update exact Airbus GLB translations and browser X/Y bounds, run them red against the old asset, then change only the radio/thrust coordinate constants and pending visual metadata.
4. Run the supported Airbus build, rerun asset and focused real-GLB browser checks, and inspect the generated diff.
5. Capture 1440, 768, and 375 browser evidence for both scenes, verify response bytes/hashes, update asset reports and `TEST_REPORT.md`, and create a Vercel preview.
6. After owner approval, mark the Airbus evidence verified, rebuild the metadata-bearing GLB, and rerun affected plus full validation.

## Validation plan

- TDD: exact new locker and Airbus translations fail against the old deployable GLBs before source edits.
- Locker: Python compilation, supported asset build, `npm run assets:check`, and the real locker Playwright suite.
- Airbus: Python compilation, supported asset build, `npm run assets:check`, and the production Airbus Playwright case with projected-position plus canvas-raycaster checks.
- Browser: correct/wrong placement, keyboard, reload, reduced motion, fallback, no overflow, and 1440/768/375 visual inspection.
- Completion: `npm run pipeline:evals`, `npm run check`, full `npm run test:e2e -- --workers=1`, `git diff --check`, served-byte/hash comparison, and complete-diff review.

## Acceptance criteria

- The hat visually rests on the upper shelf and no longer reads low or embedded.
- Radio is visibly higher and left; Thrust is visibly farther right over the paired thrust levers.
- No other cockpit target, camera, puzzle behavior, copy, progression, or accessibility path changes.
- All moved visible nodes retain matching colliders and stable metadata.
- Generated source/report/GLB evidence stays synchronized and all required checks pass.
- Owner receives consistent screenshots and a Vercel preview before visual verification metadata is finalized.

## Repair loop and stop conditions

Repeat failing check -> smallest source change -> focused rebuild/check -> actual-browser inspection -> scoped diff review. Stop on a repeated non-shrinking failure, three unsuccessful calibration attempts, an unrelated validation blocker that cannot be isolated, or a genuine owner visual decision. Never weaken a contract or browser assertion to obtain green.

## Evidence

- Locker TDD red: `npm run assets:check` reported exported `[0.56,2.92,0.45]` and report `[0.56,-0.45,2.92]`; the focused Playwright case reported hat camera target `0.42,1.00,-0.14`.
- Locker build: `python3 -m py_compile tools/blender/import_locker_room_props.py` and `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:locker` exited 0. Scene validation retained the five known imported-environment transform warnings; glTF retained the documented tangent-space/unused-data warnings.
- Locker green: `npm run assets:check` exited 0; `npx playwright test e2e/locker-room.spec.ts --grep "locker GLB loads" --workers=1` passed 1/1 in 2.3 minutes.
- Locker approval render inspected: `.cache/assets/locker/previews/cam_locker_approval_hat.png`.
- Locker master: 50,237,871 bytes, SHA-256 `209353516fcf52bc69933b9ede5bb17bb4af69f83f2c6ddc00daad3b217cd697`.
- Locker GLB: 44,288,740 bytes, SHA-256 `0ab0062470ec4eb1230d288761f95581e38e277ad11e97998ebcd5c94e492f56`.
- Airbus TDD red: `npm run assets:check` reported the old radio `[-0.04,0.011798,0.474842]`, old thrust `[0.015,0.0048,0.505764]`, and stale verified metadata; the focused browser case reported radio X `907` against the new `< 890` bound.
- Airbus build: `python3 -m py_compile tools/blender/prepare_airbus_captain.py` and `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` exited 0. The documented 124 imported-source warnings/candidate notes and glTF unused-data notices remain non-fatal.
- Airbus green: `npm run assets:check` exited 0; `npx playwright test e2e/smoke.spec.ts --grep "Airbus production cockpit loads" --workers=1` passed 1/1 in 1.7 minutes with projected bounds plus real canvas clicks.
- Airbus master after owner approval: 24,414,712 bytes, SHA-256 `1f7aaa0f453393b884b1fc6e2e6fcac2e1e52c11e9756a92e703e138afac879a`.
- Airbus GLB after owner approval: 39,878,692 bytes, SHA-256 `4c44468fe3d492e3839407f97c8d7b7286a295f12df1ee376425ee32df55621f`.
- Responsive evidence capture: both opt-in focused Playwright cases passed, Airbus 1/1 in 1.6 minutes and locker 1/1 in 2.1 minutes.
- Actual-browser evidence inspected: `preview-renders/placement-polish/{airbus-radio-thrust,locker-hat-shelf}-{1440,768,375}.png`. The final Airbus 1440 frame shows the owner-approved Radio and Thrust silhouettes with Radio selected. At 768/375, native card controls remain readable and the page does not overflow; the existing narrow-camera crop keeps the Thrust silhouette outside the visible frame.
- Served-byte proof: fresh local no-cache requests returned 44,288,740 locker bytes and 39,878,692 Airbus bytes; SHA-256 values `0ab0062470ec4eb1230d288761f95581e38e277ad11e97998ebcd5c94e492f56` and `4c44468fe3d492e3839407f97c8d7b7286a295f12df1ee376425ee32df55621f` matched disk.
- Final validation after rebasing onto `origin/main` `900b471`: `npm run pipeline:evals` passed 6/6; `npm run check` passed lint, TypeScript, 122/122 tests, and the production build; `npm run test:e2e -- --workers=1` passed 36 executable cases with one intentional capture-only skip in 6.4 minutes; Python compile and runtime-gate validation passed.
- Diff-review repair: the first review found the locker loader's stale `locker-seams-cf212389` query. A hash-bound `assets:check` assertion failed red, the loader changed to `locker-shelf-0ab00624`, and `assets:check`, `npm run check`, and the real-locker browser case passed again.
- Final rebased owner-approved preview: deployment `dpl_DMobaCFK1haNNAaunEPUifm2b5dG` reached `READY` at `https://cockpit-escape-room-kdno3fzlf-ottoagent007-gmailcoms-projects.vercel.app`. Authenticated checks returned 200 for the loader; deployed Airbus and locker bytes matched the final local hashes, and the loader contained `locker-shelf-0ab00624`.

## Outcome and handoff

The owner accepted the final desktop composition. Radio and Thrust export `verified_browser_1440_captain` with the tracked 1440 evidence path; final validation and the byte-verified Vercel preview pass. PR publication is the remaining handoff.
