# Tesla film replaces the legacy reward hangar

## Purpose

After winning Engine-Out Handling and choosing Continue on the Captain Mode completion card, the player watches the approved Tesla Flight Mode film as the reward itself. The old runtime 3D legacy hangar must not appear or load.

## Current state

The verified 85.4167-second, 1920×1080/24 fps final film is staged byte-identically at `public/media/tesla-flight-mode-final.mp4` (SHA-256 `542f09152b7d9e096410e18acc4902665e084bdaaf3311a929349c1db5b6637c`). The first local integration mistakenly kept the 11.5-second GLB hangar and offered the film later in an optional dialog. The owner corrected that design on 2026-10-28. `RewardExperience` now shows the MP4 directly when the protected reward phase begins; the old GLB remains archived in source but is not imported by the reward component.

## Goal, context, constraints, done when

- **Goal:** An Engine Out win leads through the existing Continue card to the Tesla film without another hangar reveal.
- **Context:** `src/game/state.ts` Engine Out completion and reward transition, `src/App.tsx`, `src/components/RewardExperience.tsx`, `src/styles.css`, `e2e/reward.spec.ts`, `e2e/airbus-engine-out.spec.ts`, and the final media report.
- **Constraints:** Preserve DC-9 → locker → Airbus spoiler gating, local-only progress, final tribute and earned Mars access. Keep native controls, a visible autoplay fallback, reduced-motion manual start, keyboard access, error/retry and skip. No new dependency or film/GLB byte edits. Preserve unrelated work and old assets as historical sources.
- **Done when:** Engine Out Continue enters the film directly; the old hangar canvas, optional-film dialog and GLB request are absent; film playback, skip, replay, end, error/retry, reload and 375/768/1440 widths work; `npm run check`, asset check, spoiler guard and focused browser cases pass; scoped diff review has no critical/high finding.

## Progress

- [x] 2026-10-28 — final film verified and copied to `public/media` without transcoding; owner viewed it and requested integration.
- [x] 2026-10-28 — first optional-dialog integration was locally validated, then rejected by owner as the wrong reward presentation.
- [x] 2026-10-28 — traced Engine Out win → Captain Mode celebration → Continue → protected reward phase.
- [x] 2026-10-28 — added a browser regression that failed against the old hangar and passed after replacing the reward component with direct video.
- [x] 2026-10-28 — Engine Out win-to-film browser case passed; initial reward browser suite found a failed-load error race.
- [x] 2026-10-28 — repaired media-source timing; failed-load/retry browser case passed after the fix.
- [x] 2026-10-28 — complete final browser suites, responsive screenshot review, full check/asset/spoiler gates and scoped diff review.

## Discoveries

`COMPLETE_AIRBUS_ENGINE_OUT` completes the Airbus puzzle but does not yet reveal the reward. The existing Captain Mode completion card's Continue action dispatches `CONTINUE_FROM_AIRBUS_TO_REWARD`, which sets `rewardUnlocked` and mounts the lazy reward component. This gives the movie the same protection as the previous hangar. Browser audible autoplay can be blocked, so the player needs a Play action; reduced-motion and accessible routes start paused. The first error test exposed an actual race: a fast failed media request could occur before the video error handler was ready. Assigning `src` in a post-mount effect keeps the handler active before the request.

A combined Engine Out/reward run exposed a test race: after the simulated network outage was lifted, Chromium could recover the media on its own and remove Retry before Playwright clicked it. The final test first proves Retry makes another request while the outage remains active, then allows recovery. The final error handler also retains the Retry state when a Play promise rejects with a media error.

## Decision log

- 2026-10-28: The former optional-dialog decision is superseded by the owner's correction. The film is now the reward screen, with no old runtime hangar request.
- 2026-10-28: Attempt audible playback for standard motion, offer Play if blocked, and do not autoplay in reduced motion. Keep native video controls.
- 2026-10-28: Film end or Skip reveals the family tribute and earns optional Mars access. This avoids forcing an 85-second wait while preserving the intended ending.
- 2026-10-28: Keep the old GLB and Blender master files untouched for provenance; remove their runtime import and request from the reward.

## Milestones and implementation steps

1. Replace `RewardExperience` and reward CSS with a direct full-film presentation; remove the optional dialog.
2. Update the loading copy and Mars return text to refer to the film.
3. Exercise the real Engine Out win and Continue transition and prove no old GLB request.
4. Verify media success, error/retry, reduced motion, keyboard skip, replay, reload and responsive layouts.
5. Run code, asset, spoiler and diff checks; record actual results in this plan, asset report and `TEST_REPORT.md`.

## Validation plan

Run the focused `e2e/reward.spec.ts` and Engine Out win case in Chromium. Track media and GLB requests from the fresh intro through the reward. Check native controls and actual playback; seek near the end to verify the `ended` transition; block the media request to verify Retry; test keyboard Skip, reload and reduced motion. Capture and inspect film screens at 375, 768 and 1440 CSS pixels. Run `npm run check`, `npm run assets:check`, `node tools/ci/spoiler-guard.mjs dist`, source/public/dist media hashes and `git diff --check`. Review the complete scoped diff for regressions and protected-copy leakage.

## Acceptance criteria

The full film is the first reward presentation after Engine Out Continue. No old hangar canvas, dialog or reward GLB loads. Film controls, fallback, error/retry, skip, replay, tribute, local save and optional Mars access work. The movie stays absent from initial downloads and no protected Model Y copy leaks. No critical/high scoped review finding remains.

## Repair loop and stop conditions

For a failing check, identify the cause, make a focused repair, and rerun the failed check plus nearby regressions. Stop when checks pass, two focused attempts fail to shrink the delta, or a genuine owner visual choice remains. Never claim an unrun check passed.

## Evidence

Final media: `preview-renders/tesla/final-film-2026-10-27/FINAL_MEDIA_REPORT.json`. Integration report: `asset-reports/tesla-film-game-integration-2026-10-28.md`. Initial direct-film regression failed on the old `Flight Mode` heading and passed after replacement. Final combined Engine Out/reward Chromium run passed 11/11; the reward-only suite passed 5/5 after the final error-handler tightening. `npm run check` passed lint, typecheck, 1,032/1,032 unit tests in 94 files and build. `npm run assets:check`, `node tools/ci/spoiler-guard.mjs dist` and scoped `git diff --check` passed. Source/public/dist film SHA-256 was identical. Actual-browser captures `preview-renders/model-y-reward/{1440,768,375}-direct-tesla-film.png` were opened and inspected, with native controls visible and no horizontal overflow. The scoped source/test/media review found no critical/high issue. No hosted preview was created.

## Outcome and handoff

The direct-film local integration and focused validation are complete. Hosted preview, full journey review and final complete-game owner approval remain open.
