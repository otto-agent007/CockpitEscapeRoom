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

## Moonbase floor-line correction — 2026-11-03

Goal: remove the rust-colored line across the lunar ground beneath both fighters. Context: `arcadeHarness.draw` adds the Mars floor accent unconditionally after painting either background; an actual earned-entry/fullscreen Moonbase capture confirms it crosses the feet. Draw that accent only on Mars. Keep the approved Moonbase panorama bytes, floor coordinates, shadows, fighter art, combat, controls and earned unlock unchanged. Done when the line is absent in actual Moonbase captures at 375/768/1440, Mars still draws its accent, and background/selection/reload/reduced-motion checks plus the full app check pass. PR #121 is merged; this is a separate local follow-up branch, with publication not requested.

The owner's sound-effects question is a feasibility assessment. Combat already emits hit, blocked, projectile, guard-crush, round-start and KO/time-over events; there is no current arcade audio player. Existing intro Web Audio synthesis provides a pattern. A small dedicated arcade player could map those events to synthesized effects, unlock from Start fight, expose mute/volume and clean up when leaving the iframe. No audio changes are included in this floor-line correction.

The owner then requested player-facing names **TECHNOKING**, **TEFLON DON**, and **SCAM ALTMAN** (explicit all-caps correction). Both roster options/cards and HUD/winner labels now use those names; fighter IDs, tuning, artwork and move names keep their existing contracts. Existing label expectations are updated.

The owner also requested a much larger final family tribute. Increase `.reward-tribute` from 16–18.4 px to 25.6–40 px with comfortable leading, and widen its panel to accommodate the larger type. Preserve exact message wording and keep Replay/Restart reachable at 375/768/1440. Browser proof must check actual computed type size, overflow and native replay after movie end/Skip. Sound remains a feasibility assessment.

Follow-up validation is complete: `npm run check` passes lint/types, 1,048 tests in 95 files and build; the production background/selection/reward suites pass **29/29**. Actual 375/768/1440 captures show the renamed cards/options/HUD and no full-width Moonbase floor stroke. Instrumented canvas observation confirms zero Moonbase accent strokes and a retained Mars stroke without changing the paused combat readout. The larger tribute computes to 25.6/25.6/40 px with zero horizontal overflow, and keyboard Skip, native Replay and confirmed Restart work at each size. Two capture-helper assumptions (dismissed native confirmation and a closed Match options disclosure) were corrected; no runtime repair was required. Historical test-written screenshots were restored.

Independent full-diff review found no blocking issue. Evidence is in `preview-renders/arcade-tribute-polish/`, with actual measurements in `receipt.json` and visible review metadata in `owner-review.json`; `TEST_REPORT.md` records commands, coverage and limits. Both local review tabs are open at port 5419, with the tribute foreground and Moonbase paused in the second tab. No audio, asset, dependency, publication or merge change is included. Owner review remains pending.
