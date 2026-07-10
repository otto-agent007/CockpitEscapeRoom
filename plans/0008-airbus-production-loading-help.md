# Airbus production promotion, loading, and viewer help

## Purpose

Give desktop players one polished A320 loading experience, recoverable 3D failures, seated look/zoom controls, and reusable viewer help without changing the validated aircraft asset.

## Starting state

The A320 GLB and five projected gameplay targets are validated. Loading is split between a text suspense fallback and an in-canvas greybox, errors do not offer recovery, viewer shortcuts are absent, and the scene still carries `A320 PLAYABLE PROOF`.

## Scope

Included: desktop loading/progress/error/fallback UI, first-frame gate, help for every 3D phase, fullscreen/reset shortcuts, 50-76 degree seated A320 zoom, continuously projected pins, tests, browser evidence, reports, and production promotion language.

Excluded: Blender/GLB edits, mobile layout/gestures/screenshots, attribution, dependencies, services, analytics, and persistence migrations.

## Context and constraints

- Goal: the cockpit becomes interactive only after its correctly framed first frame and remains completable if GLB/WebGL fails.
- Context: `src/App.tsx`, `src/scenes/PrototypeScene.tsx`, `src/components/Hud.tsx`, `src/styles.css`, `e2e/smoke.spec.ts`, A320 browser gate, and `TEST_REPORT.md`.
- Constraints: preserve the approved FO transform, five targets, accessible HTML path, spoiler rules, and unrelated work.
- Done when: focused/full checks pass; desktop browser evidence proves loading, help, retry/fallback, shortcuts, zoom/reset, and target attachment; owner approval is recorded and the proof badge is removed.

## Progress

- [x] 2026-07-10 - Re-read project guidance, active plans, worktree, runtime scene, and smoke tests.
- [x] 2026-07-10 - Implemented the shell-level loading and viewer-control contract.
- [x] 2026-07-10 - Added browser coverage for load failure/retry/fallback, help focus, and zoom/reset.
- [x] 2026-07-10 - Ran deterministic validation and reviewed the full diff; full-render desktop proof and deployed owner approval remain open.
- [x] 2026-07-10 - Replaced the opening/loading/fallback art with a clean 1920x1080 capture from the approved runtime canvas.
- [x] 2026-07-10 - Removed the greybox loader, repaired restart loading and camera reset, added Enter submission and the qualification celebration, and synchronized game-design direction.
- [x] 2026-07-10 - Verified the real A320 in workstation Brave at 1280, 1440, and 1920 widths and reran app, asset, gate, and pipeline validation.
- [x] 2026-07-10 - Centered and enlarged the Airbus dock, removed its Hint action, added educational card descriptions, neutralized drop-zone and wrong-answer copy, accepted natural hour formats, and shortened the celebration action.
- [x] 2026-07-10 - Tightened the feedback dock, moved Help and Fullscreen to the lower-right corner, and removed the visible circular reset button while retaining the `R` shortcut.
- [x] 2026-07-10 - Lowered the normal feedback dock and placed Restart on the status row; retained the expanded qualification layout after all five labels are correct.
- [x] 2026-07-10 - Replaced visible numbered drop-zone chips with faint instrument silhouettes while preserving neutral accessible target names and keyboard placement.
- [x] 2026-07-10 - Recorded owner production approval, removed the Airbus proof badge, and promoted the active reports and design gate.

## Discoveries

- Existing hotspot projection already runs every frame and can remain the attachment source while the camera moves.
- The current Airbus loader discards XHR progress and renders an internal greybox indefinitely after errors.
- The agent-browser Chromium build cannot create WebGL here and is not representative of the owner browser.
- Playwright tests that instantiate the 38 MiB GLB worker were terminated locally before reporting a result. Failure/fallback/help tests and non-browser validation complete normally.
- The missing loader on repeat attempts came from `showAirbusLoader` remaining false after Restart. Restart now starts a fresh minimum-duration loader lifecycle, and the in-canvas greybox geometry no longer exists.
- Workstation Brave can render the real A320 reliably and proved camera reset exactly restores the approved transform and 68 degree FOV.
- Answer leakage existed in four UI/accessibility surfaces: target ARIA labels, keyboard prompts, placed-card subtitles, and wrong-answer reducer feedback. All now use neutral drop-zone language.

## Decision log

- 2026-07-10 - Keep production promotion code-ready but treat deployed preview owner approval as the final human gate.
- 2026-07-10 - Use a clean runtime capture for briefing, loading, and accessible fallback so every pre-render state depicts the actual game-ready cockpit.
- 2026-07-10 - Removed the speculative WebGL capability probe and fallback latch after owner-reported regression. The actual A320 frame is the readiness authority.
- 2026-07-10 - Qualification pauses in Airbus with a reduced-motion-safe celebration and advances only through an explicit Continue action; no save-schema migration is required.
- 2026-07-10 - Correct matches may name the earned control, but unassigned targets, placed-card destinations, and wrong feedback remain neutral. Card descriptions teach function without identifying screen position.
- 2026-07-10 - Owner approved the current Airbus experience for production. Remove the Airbus proof badge while preserving greybox labels for unapproved later scenes.

## Milestones

1. One loader reports real bytes and waits for the first framed frame.
2. Failure offers retry and a non-WebGL completion path.
3. Help, fullscreen, reset, and seated zoom work from all 3D phases.
4. Automated and desktop visual evidence is recorded.

## Implementation steps

Implement load-state reporting and camera revisions in the scene; add shell UI/help/shortcuts in React; update styles and Playwright tests; then update the browser gate and test report.

## Validation plan

Run focused Playwright tests, `npm run check`, `npm run assets:check`, glTF validation, A320 gate validations, `npm run pipeline:evals`, and `git diff --check`. Inspect 1280, 1440, and 1920 desktop captures.

## Acceptance criteria

The specified copy appears in one full-screen loader; progress uses real bytes; gameplay stays hidden until first frame; errors recover; fallback remains playable; help and focus rules work; F/R ignore inputs; fullscreen covers the shell; A320 FOV stays 50-76 and reset restores 68; projected targets move with the camera.

## Repair loop and stop conditions

Repeat implementation, focused validation, browser inspection, and diff review for at most three repair passes. Stop on passing checks, a non-shrinking delta, or the owner preview decision.

## Evidence

- `npm run check` - pass: lint, typecheck, 16 Vitest tests, and production build.
- Focused Playwright failure/retry/fallback and help/focus tests - 2 passed.
- `npm run assets:check` and glTF validation - pass; informational unused UV/empty-node rows only.
- A320 runtime-contract, material-optimization, and browser-integration gates - pass.
- `npm run pipeline:evals` - pass, 6/6; `git diff --check` - pass.
- `/tmp/a320-loading-1440-playwright.png` confirms the loader composition at 1440x900.
- Full GLB Playwright runs for zoom/desktop capture ended without a worker result and are not claimed as passing.
- `public/images/a320-game-ready-fo.png` - clean 1920x1080 runtime capture, 929 KiB, no cards, boxes, badge, or HUD.
- Workstation Brave A320 reset proof - moved camera reached 76 degree FOV; Reset View restored position `(0.15382, 0.13013, 0.64788)`, approved quaternion, and 68 degree FOV exactly.
- Workstation Brave restart proof - polished loader visible after full-game Restart; no greybox loader mesh remains.
- Focused browser tests passed for Enter-to-submit qualification/locker flow, failed-load retry/fallback, help focus/layout, and reduced-motion celebration reload.
- Desktop evidence: `/tmp/a320-opening-game-ready-1440.png`, `/tmp/a320-loader-after-restart-1440.png`, `/tmp/a320-ready-tools-1280.png`, `/tmp/a320-help-tools-1920.png`, and `/tmp/a320-qualification-celebration-1440.png`.
- Fairness/readability evidence: `/tmp/a320-centered-readable-cards-1440.png`, `/tmp/a320-neutral-wrong-feedback-1440.png`, and `/tmp/a320-centered-hours-question-1440.png`.
- DOM/browser measurements at 1280, 1440, and 1920: dock and viewer-tool center delta `0`; status font `16.8px`; question font at least `16.8px` after final adjustment.
- `npm run check` - pass with 21 Vitest tests, including `1500`, `1,500`, `1500 hour`, and `1500 hours`.
- Compact-dock browser proof at 1440x900: dock measured 416 px wide and centered; the two-button viewer tool group measured 87 px wide at the lower-right inset; Help opened with focus on Close; Reset View button count was zero; no failed requests were observed. Screenshot: `/tmp/a320-compact-dock-tools-1440.png`.
- Lowered-dock browser proof at 1440x900: normal state measured 416x114 px with a 14 px bottom inset and Restart aligned beside status; qualification state expanded to 480x286 px with the full question visible. No failed requests were observed. Screenshots: `/tmp/a320-dock-compact-lowered-1440.png` and `/tmp/a320-dock-expanded-atp-1440.png`.
- Silhouette browser proof at 1440x900: five unlabeled target shapes rendered at 35-70 px, no visible numbered chip remained, the sidestick placement completed correctly, and no failed requests were observed. Screenshot: `/tmp/a320-instrument-silhouettes-1440.png`.
- Production-promotion validation: `npm run check`, `npm run assets:check`, glTF validation, the runtime/material/browser A320 gates, and pipeline evals (6/6) passed. The real-GLB smoke passed; the three state-flow smoke tests and focused viewer-help layout/focus test passed after stale assertions were updated to the final non-leaking/lower-right UI contract.

## Outcome and handoff

Implementation is promoted to the production Airbus baseline following explicit owner approval on 2026-07-10. Later scene gates remain independent, and the documented imported-source limitations outside the five gameplay targets remain accepted v1 constraints.
