# Arcade selection and full-screen fighting

## Purpose and scope

Goal: entering the earned arcade first offers a player and battlefield selection page; Start fight opens an arena that fills the viewport. The same task also retains the requested Model FLY ending-copy correction recorded in plan 0072.

Context: `mars-arcade.html` currently mounts the fight immediately. `src/arcade/player.css` caps it at 1100 px and the shared dev shell boxes the canvas. The iframe wrapper adds another header. Mars and Moonbase and all four fighters already exist.

Constraints: preserve earned T+M+B access, combat rules/tuning/art, controller/native/keyboard input, reduced motion, independent battlefield persistence, chapter progress and return. Add no dependencies or assets. Keep dev gym layout unchanged. No publication or release is requested.

## Design and implementation

Use a selection screen inside the existing authorized iframe, with canonical fighter artwork, native player/opponent selectors and Mars/Moonbase choices. Mount the existing renderer with a small session interface that suspends simulation and input until Start fight. Starting/reselecting starts a fresh round and requests browser fullscreen from the button gesture; denied fullscreen still yields a viewport-filling arena. Overlay compact controls on the arena; put detailed controls/settings in an expandable tray. Keep Return to game reachable on both screens, and freeze the fight while choosing again.

Files: `mars-arcade.html`, `src/arcade/main.ts`, `src/arcade/player.css`, `src/components/MarsArcade.tsx`, `src/styles.css`, and the bounded lifecycle/size handling in `src/dev/arcadeHarness.ts`. Update existing browser helpers and add `e2e/arcade-selection.spec.ts` for the new entry, freeze, selection and screen-size contract.

## Progress

- [x] Inspect actual source, current ending branch and existing arcade acceptance cases.
- [x] Add browser acceptance checks and observe the missing-selection failure before implementation.
- [x] Implement selection → full-screen match → selection/return with input cleanup.
- [x] Run new and nearby production browser cases, full `npm run check`, spoiler guard and scoped full-diff review. Inspect screenshots at 375/768/1440 and record evidence in `TEST_REPORT.md`.

## Validation and acceptance

Selection must precede combat on every entry; selection time must not advance the round or accept fight keyboard/controller input. Chosen fighter and battlefield must render in the first round. Match canvas must cover the iframe viewport without the prior panel border, cap or outer header. Keyboard Start, native controls, controller pause, retry, reduced motion, corrupt/denied setting storage, reload and return must work. Test both granted and refused fullscreen. Inspect aspect ratio, HUD/control overlap and overflow in portrait and landscape; preserve full arena framing with contained pixels rather than cropping HUD/fighters.

## Repair loop, evidence and handoff

Use at most three evidence-led repairs per issue, rerunning failed and nearby checks. Stop for an unresolved product decision or unchanged delta; record any remaining issue honestly. Browser plugin is absent; use installed Playwright with Chromium 1243 and fresh owned preview ports. Fullscreen/browser launch and local binding use approved sandbox escalation. No hosted or complete-game release claim is implied by local evidence.

- First new entry test failed because the selection screen did not exist. Initial implementation passed the selection/freeze and four full-viewport cases; corrected the test's assumed fighter display name to canonical TRUMP.
- Visual inspection found the initially expanded native controls covered too much of the arena. Collapsed Controls and Match options now leave only a compact action bar. Preserve contained pixel art to avoid cropping HUD/fighters. Initial selection focuses its heading to avoid scrolling phone users past the player choices.
- Independent read-only review found two important accessibility regressions: closed Match options hid essential live feedback, and the global Space binding intercepted native summary activation. Both were reproduced by failing browser cases, then repaired by keeping live regions outside disclosures and respecting summary activation. The seven selection/fullscreen/accessibility cases now pass in development Chromium, including real granted fullscreen and refused-fullscreen fallback.
- First production regression run passed 52/53 cases; the 375 px reduced-motion scenery case could not find Start fight. Its failure occurred in a run that overlapped a build and other browser runs, so it is not accepted as final evidence. Final serial production checks and focused repeat are pending.
- Final serial outcome: the exact phone case passed 3/3 repetitions, then the full selected production suite passed **55/55** on port 5412. The entry failure's root cause remains unconfirmed; it did not reproduce in serial verification. Full `npm run check` passes lint, types, 1,048 tests/95 files and build. Spoiler/privacy guards, unchanged asset budgets and `git diff --check` pass. A new Model FLY spoiler fixture was observed failing, then passed after adding the new name to the guard.
- Final screenshots and browser metadata: `preview-renders/ending-ui-2026-11-03/`. Inspected player selection, expanded arena, white film title and tribute at 375/768/1440. The stage preserves aspect ratio, including empty space on portrait screens, so the complete HUD and fighter geometry remain visible. No assets, tuning, dependencies, hosted preview or release changed. Independent review's two important findings are fixed and covered by passing regressions; no known critical/important delta remains in this task.
- Final console cleanup: remove duplicate iframe fullscreen permission declarations, retain `allowFullScreen`, rerun the full check successfully and pass the 7/7 focused production cases again. Refreshed production evidence has zero page errors, console warnings/errors or failed responses. A preceding check attempt terminated with exit 143 during typecheck; the complete fresh rerun passed and supersedes that incomplete attempt.

## Owner review and PR handoff — 2026-11-03

The owner reviewed the opened local arcade selection and Model FLY ending tabs, said “good job,” and requested a PR. This accepts these scoped presentation changes and authorizes their publication for review. PR #118 is already merged; publish a fresh `feat/model-fly-arcade-selection` branch against `main`. The fetched main contains this worktree's starting commit and is two commits ahead (the #118 merge and a dependency update). Fresh pre-publication `npm test` passes 1,048 tests in 95 files, and `git diff --check` passes. Existing full-check/browser evidence above remains applicable because no runtime source changed afterward. Retain the visible local review browser and worktree. Check hosted CI once after creating the PR and report passed/pending state without merging or promoting a deployment.
