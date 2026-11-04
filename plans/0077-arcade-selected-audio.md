# Heavy hitters gameplay audio implementation plan

## Goal, context and selected design

The owner selected **Heavy hitters**, then explicitly authorized the announcer and all four character specials. The accepted source WAVs live in `art-source/audio/arcade-fight-candidates-v2-2026-11-03/`; source authors, CC0 licenses and hashes are recorded there. Plan 0076 records both auditions. This plan implements that selection in the earned production arcade and keeps the prior Moonbase/name/tribute changes intact.

Use the exact selected WAV bytes, copied into `public/audio/mars-arcade-v1/`. Load only inside the authorized arcade. Rules emit one presentation event when an accepted move first becomes active; pure sound mapping uses that event plus real hit/block/guard-crush/KO events. The browser player owns Web Audio, variation rotation, bounded overlap and cancellation. Native controls expose sound on/off and volume with a separate versioned local setting. Start fight supplies the trusted audio gesture. A failed sound cannot block a fight.

## Constraints and review focus

- Preserve rules/tuning/art, earned unlock, main-game save and Moonbase preference. New move-active events must not change simulation results.
- Retain source/accepted bytes and original CC0 notices; no new service, tracking, production dependency, publication or merge.
- Play impact on actual contact, guard on block, air on a miss; character signature once per accepted special, not once per render/projectile. Vary recurring impacts.
- Round one at Start, Fight at actual round start, You win after KO/time-over winner; no invented voiced KO. Avoid overlapping announcer calls.
- Pause/mute/selection/return/hidden document cancels current and pending sound. No late queued hits after resume or failed loading.
- Sound defaults on at 55%, with mute/volume independent of game progress and safe recovery from denied/corrupt storage.

## Tasks and acceptance

- [x] Add a failing real-world rule test for a single move-active event, then the minimal rule event. Verify zero events for denied meter and no repeated event during hitstop/catch-up.
- [x] Add pure sound mapping and tests for hit/miss/block/special/guard/KO, plus safe local preference handling. Map low heavy contact to kick, other heavy to heavy punch, light to jab; never alter the move itself.
- [x] Add a bounded Web Audio player, selected asset copies and accessible native sound controls. Stop nodes and invalidate pending loads on lifecycle changes; cap simultaneous effects. Retry actual unavailable/blocked sound without holding gameplay.
- [x] Connect production harness lifecycle and events. Add focused browser cases for actual audio-node playback, Start gesture, variation, mute/reload, pause/reselection/return and failed media. Exercise keyboard, fullscreen fallback, reduced motion and 375/768/1440 layouts.
- [x] Run `npm run check`, focused production arcade regression suites, asset byte/budget/spoiler/privacy/diff checks. Independent scoped full-diff review, fix important findings and record actual evidence in `TEST_REPORT.md` and source/license records.
- [x] Open the real earned arcade with sound enabled for owner playtest. The owner played it and approved the in-game result. PR publication remains unrequested.

## Repair loop and evidence

Use at most three evidence-led repairs per issue. Read the actual failed result before changing mechanism; rerun failed/nearby checks. Stop for passing scoped acceptance or a genuine product decision. Browser plugin unavailable; use installed Chromium/Playwright, existing owned dev/production ports 5418/5419, and no build during production browser verification.

## Decisions

- The user’s explicit selection and subsequent authorization establish the design; proceed with local implementation without another approval round.
- Keep the development art/tuning harness silent; this milestone changes the production arcade only.
- Rule presentation events provide reliable first-active timing across a multi-step render; keypress-only sound would report rejected moves and render-state inference can miss a short attack.

## Validation and repair evidence

- Before the rule addition, two timing cases failed because no first-active event existed (`/tmp/arcade-audio-timing-red.log`). The twelve sound tests now pass, including all four actual accepted specials. Existing strict event expectations were extended to include the presentation cue; damage, chip, reach, timing, freeze and KO assertions remain intact.
- Final `npm run check` passes lint/types, **1,060 tests in 96 files**, and build, exit 0 (`/tmp/arcade-selected-audio-final-check.log`). An initial check caught a narrow phase type in the new fixture, then strict legacy event lists; those were corrected before this complete successful run.
- Final production Chromium passes **40/40 in 3.0 minutes** across `arcade-audio`, `arcade-selection`, `arcade-backgrounds` and `mars-arcade-easter-egg` (`/tmp/arcade-selected-audio-final-browser.log`). This includes actual native audio-node playback for hits/variations/laser/announcer, silence before Start and mute, pause/reselection, held decoding, failure/retry/no Web Audio, controllers, keyboard, fullscreen refusal, storage failure, reduced motion, responsive art/controls, earned access, loading retry and axe serious/critical checks.
- First broad run passed 36/39: three old readout assertions expected internal fighter IDs after the owner-selected rename. The corrected name expectations retain source-art ID checks. A subsequent phone entry failed once without a trace establishing its natural cause; it then passed three repeated runs. A deliberately delayed hold timer reproduced the positive helper's premature key release. The helper now waits for observed entry while holding keys; the delayed-timer regression passes and the short/partial/modifier/blur/focus/visibility negative cases remain. No product shortcut rule or timeout was weakened.
- All twenty selected source/runtime/build WAVs are byte-identical (1,147,322 bytes); `SELECTION.json`, shipped credits and the audio asset report retain provenance. `npm run assets:check` passes with existing nonfatal notices. Spoiler/privacy/budget/diff checks pass: **188.1/190 MB total**, **573/600 KB initial**. No new dependency or budget increase.
- Independent audio/full-diff review reports no blocking findings in event/lifecycle/voice/controls logic and verifies selected bytes. Its minor stale audition-status note is resolved in source README, plan 0076 and the license manifest. Responsive screenshots at `/tmp/arcade-selected-audio-final-evidence/production-{375,768,1440}.png` and owner view `/tmp/arcade-heavy-hitters-owner.png` were inspected.

## Owner acceptance and handoff

Opened the actual earned production arcade on port 5419 with Moonbase, sound on at 55% and all twenty sounds loaded, in a separate profile. The owner played it and said **“Worked goo for me, good job!”** on 2026-11-04. This approves the scoped in-game sound integration. Preserve the running browser for further play. Earlier Moonbase, rename and tribute changes remain in this local branch, and unrelated `:memory:.ses` is untouched. No commit, PR publication, merge or deployment was performed for this follow-up; full-journey, other-browser and hosted release checks were not repeated.

## PR handoff — 2026-11-04

After another arcade playtest, the owner said **“ok looks good, let's do the pr.”** This authorizes publication of the reviewed Moonbase floor correction, fighter names, larger tribute and selected audio together. Fetched main remains `794a668`; the fresh pre-publication `npm run test` passes 1,060 tests in 96 files (`/tmp/arcade-pr-preflight-test.log`). Full-check/40-case production-browser evidence above still applies because runtime source has not changed since it passed.

Publish on `feat/arcade-audio-polish`, including selected source/runtime audio, source licenses/hashes, source generator and acceptance evidence. Keep the first rejected synthesized sets, unselected Arcade snap outputs, demo mixes, local audition pages and unrelated `:memory:.ses` local. Their reproducible inventory metadata can remain with the source records. The owner approved the selected assets and actual gameplay, not the rejected candidate media. Keep the worktree and playtest browser; publish the PR, check CI once and report its current state without merging or promoting a deployment.
