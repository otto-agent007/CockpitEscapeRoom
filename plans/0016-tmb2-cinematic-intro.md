# TMB2 16-Bit Cinematic Intro

## Purpose
Replace only the 53-second placeholder montage after Start Game with the approved TMB2 and Pop T key-chase cinematic. Preserve the existing briefing and the DC-9 Final Flight Log entry.

## Current state
GameIntro uses native audio, a media/fallback clock, the 320 x 224 placeholder Canvas animatic, a six-second monotonic Start gate, mute/volume/retry/Skip controls, and the existing guarded onComplete callback. App preloads the DC-9 during briefing and dispatches START only through the existing completion handoff. Required cinematic PNGs now have an explicit loading/ready/error gate before normal playback.

## Scope
This ExecPlan covers the Canvas runtime, placeholder animatic, final cinematic assets, final scene choreography, and removal of the temporary legacy-intro switch. It excludes cockpit changes, mobile-specific composition, and downstream game chapters.

## Progress
- [ ] Runtime and placeholder animatic complete (implementation and the full 27-case Chromium suite are green in draft-PR CI; representative captures, an unattended 53.04-second playback, and owner visual approval remain open)
- [ ] Cinematic assets approved
- [ ] Final scenes and DC-9 unlock transition approved
- [ ] Full validation and owner visual gate complete

## Discoveries
- The deployed audio is public/audio/intro-audio-53s.mp3 and reports 53.040 seconds.
- The current replacement seam is GameIntro in App's briefing phase.
- The briefing is a locked repository contract and remains unchanged.
- The first runtime pass started playback before declared PNG decode completed and converted decode failure to an empty render map; production therefore had neither a deterministic retry path nor an asset-specific diagnostic.
- React render state could lag the synchronously sampled six-second gate by one frame for gamepad input. A ref-owned pure runtime controller is now the transition authority; React state only renders prompt availability.
- Grid centering plus a centered transform origin can place the logical stage on fractional CSS pixels at odd letterbox widths. Presentation geometry now floors measured shell dimensions and owns integer scale, left, top, width, and height explicitly.

## Decision log
- Use one 320 x 224 Canvas and media currentTime as story authority.
- Keep ?legacyIntro=1 only through implementation and remove it after acceptance.
- Keep preload failure fallback development-only. Production remains on the unchanged briefing with the Start control disabled, the failing asset id/path visible, and an explicit retry action.
- Keep loop/input/audio/disposal rules in one pure controller consumed by GameIntro so executable Vitest coverage and React behavior cannot diverge.

## Milestones
1. Canvas animatic and looping runtime.
2. Approved Pop T, cartoon-key, logo, environment, and prop packages.
3. Final choreography, CRT polish, and direct DC-9 unlock.

## Validation plan
Use npm run check, focused and full Playwright, integer-pixel screenshot inspection, and a complete unattended audio loop.

## Repair loop and stop conditions
Repeat review, focused repair, validation, and remaining-delta review. Stop after three unsuccessful repairs to the same root cause or when owner visual approval is required.

## Evidence
Record commands, counts, screenshots, durations, hashes, preview URLs, and unresolved findings here as work proceeds.

### 2026-07-20 draft-PR Chromium validation

- Draft PR #49 published the reviewed 19-file intro tree at GitHub commit `b5b89a3f297920c030f13476699346510d13591d` on branch `agent/tmb2-intro-runtime`, based on `main` commit `40c4f34f83d1fb6f7952e84f542afdeb3ecedf94`.
- GitHub Actions CI run 131 (`29709058449`) completed successfully. `quality` passed dependency install, `npm run check`, and `npm run assets:check`.
- `browser-smoke` installed Playwright Chromium and passed the full `npm run test:e2e` command. The same suite selected 27 Chromium cases in local launch attempts; CI executed it successfully, including the intro asset gate/retry, timeline and loop-reset assertions, pointer/Enter/Space/Escape/gamepad Start paths, reduced-motion and integer-geometry checks, audio fallback/retry, spoiler guard, and existing DC-9 transition contract.
- This closes the prior browser-execution blocker. The CI workflow did not create the 12 representative cue screenshots, and it did not supply owner visual approval or a separately observed unattended 53.04-second playback; those gates remain open and the milestone checkbox stays unchecked.

### 2026-07-19 untouched baseline
- Pre-edit inspection found a clean task worktree on branch `agent/tmb2-intro-runtime` at starting HEAD `0afc6b5` (`chore: ignore local worktrees`); no unrelated user changes were present or overwritten. Recent context: `40c4f34` merged the Airbus radio/thrust alignment PR, preceded by `ba2a6f1` and `387395a` alignment/proof commits.
- The initial literal `npm install` attempt failed because npm tried to create/use the unwritable sandbox default cache at `/root/.npm`; this was a provisioning issue, not a dependency or product failure. The environment-safe resolution, `npm ci --cache /tmp/cockpit-npm-cache --prefer-offline`, then succeeded with 398 packages.
- `npm run check` passed: lint, TypeScript, 66/66 Vitest tests across 3 files, and a Vite production build (52 modules transformed; 446 ms).
- Focused browser command `npm run test:e2e -- e2e/smoke.spec.ts -g "game intro|opening stays spoiler-safe" --workers=1` selected 6 Chromium tests but could not launch any test because `/root/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell` is absent. Result: 6 failed at launch in 7.1 seconds; no product behavior was evaluated and no screenshots were produced.
- Browser recovery attempts were blocked by environment provisioning: `npx playwright install chromium` cannot create `/root/.cache/ms-playwright`; retrying with `PLAYWRIGHT_BROWSERS_PATH=/tmp/cockpit-playwright-browsers` reached `https://cdn.playwright.dev` but repeatedly received an invalid/truncated zero-byte archive (`End of central directory record signature not found`).
- Existing warnings retained for follow-up: npm reports unknown `http-proxy` config and npm 11.18.0 availability; the Playwright web server reports `NO_COLOR` is ignored while `FORCE_COLOR` is set. These warnings did not fail `npm run check`.

### 2026-07-19 Task 6 runtime validation checkpoint (browser provisioning blocked)

- The evidence pass started from clean HEAD `69ed2e1` (`fix: latch intro start and protect controls`) on `agent/tmb2-intro-runtime`. No application or test code was changed during validation.
- `time -p npm run check` exited 0 in 10.05 seconds: ESLint passed, TypeScript passed, Vitest passed 80/80 tests across 5 files in 239 ms, and Vite built 55 modules in 450 ms.
- `time -p npm run assets:check` exited 0 in 3.79 seconds for all three deployable GLBs. The validator retained informational unused-UV/empty-node rows and the known locker runtime-generated tangent-space warnings, but reported no command-failing asset error. Runtime files were `airbus-captain.glb` (39,878,776 bytes, SHA-256 `e340dcf1caefb998f208a5fd228455384d289916efd4b4f15fbafc50c79497ef`), `dc9-cockpit.glb` (36,050,764 bytes, SHA-256 `e092a1d8907db5ed8fb9dc1032cac3874e0295287ae33ecb7e50f5d6ebf6d9ac`), and `locker-room.glb` (44,288,740 bytes, SHA-256 `cf212389e0d04aa34a528cbc2af07e59b4acc9d4e98e386f725c78da43279c5c`).
- `ffprobe` confirmed `public/audio/intro-audio-53s.mp3` is 53.040 seconds at 192,155 bit/s. The file is 1,273,994 bytes with SHA-256 `be635257cce2ebb3e7e327cada37e09b4a3b4c292e5e385f280955a1d2843507`.
- Host/browser inventory found no Chromium, Chrome, Brave, Edge, Firefox, `agent-browser`, Playwright cache, repository-bundled browser, or compatible executable under the checked system/workspace paths. The repository-supported `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` override therefore had no executable to target.
- `time -p npm run test:e2e -- --workers=1` built and served the application, selected 27 Chromium tests, and exited 1 after 15.32 seconds because every case failed at launch: Playwright expected absent executable `/root/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell`. No test body or product behavior was evaluated.
- A bounded safe provisioning retry, `time -p env PLAYWRIGHT_BROWSERS_PATH=/tmp/tmb2-playwright-browsers PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=15000 npx playwright install chromium`, exited 1 after 28.11 seconds. All five Playwright download attempts reported 100% of 0 MiB followed by `End of central directory record signature not found`; only the `.links` metadata file remained, with no browser executable.
- `git diff --check` passed after the final evidence edits.
- No genuine Playwright captures were produced, so `preview-renders/tmb2-intro-animatic/` was not created or staged. The 12 required cue frames, integer-pixel/scene/prompt/letterbox/spoiler inspection, 1440/768/375 containment review, one natural 53.04-second unattended loop, pointer/Enter/Space/Escape/controller Start paths after six seconds, exactly-one DC-9 transition assertions, absence of early `START` persistence, and the existing DC-9 completion handoff remain unexecuted actual-browser gates.
- The runtime milestone and owner visual gate remain open. The next external validation surface is the existing GitHub Actions `browser-smoke` job, which installs Chromium with `npx playwright install --with-deps chromium` before running `npm run test:e2e`; CI was not modified in this task.

### 2026-07-19 broad-review repair checkpoint

- Asset preload is now modeled as loading/ready/error. Normal Canvas playback cannot start until all three manifest PNGs decode. `IntroAssetPreloadError` retains the failing id and path; production exposes retry and never renders an empty normal asset map, while development may use the retained legacy intro.
- The consumed pure intro runtime now owns clock sampling, the monotonic six-second latch, natural/fallback loop reset, retry resynchronization, exactly-once completion, activation, and disposal. The stable `requestStart` reads this current ref synchronously, including a gamepad press in the sample that crosses six seconds.
- `IntroCanvas` consumes a pure placement helper and applies integer scale/left/top with a top-left transform origin. Exact expected geometry is 1280 x 896 at `(80, 2)` for 1440 x 900, 640 x 448 at `(64, 226)` for 768 x 900, and 320 x 224 at `(27, 294)` for 375 x 812.
- Renderer time is normalized once before both normalized-scene lookup and scene-relative progress. Tests cover 53.04, three durations, NaN, and post-loop scene-relative samples.
- TDD RED evidence was observed for each repair: asset tests failed 2/5 on the raw decode error and missing load-state API; runtime and geometry suites failed on missing modules; renderer tests failed 5/18 on raw-time progress; and the final disposal predicate test failed 1/6 before the React callback guard consumed it.
- Focused GREEN evidence: intro asset tests 5/5, runtime controller 6/6, geometry 3/3, and renderer/config 21/21. The fresh final `time -p npm run check` exited 0 in 10.24 seconds: ESLint and TypeScript passed, Vitest passed 97/97 across 7 files in 249 ms, and Vite transformed 57 modules/build completed in 473 ms.
- `time -p npm run assets:check` exited 0 in 3.09 seconds. Existing unused-UV/empty-node information and locker generated-tangent warnings remain unchanged. `git diff --check` exited 0.
- Focused Playwright command selected 10 Chromium tests after building and serving successfully, then exited 1 in 8.25 seconds because every case stopped at `browserType.launch`; the expected executable remains absent at `/root/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell`. No test body, viewport assertion, image-decode UI assertion, input assertion, or visual review executed.
- Browser integration coverage now includes delayed/rejected decode and production retry, same-sample gamepad Start, and exact integer stage geometry/transform origin at 375, 768, and 1440 widths. These assertions remain unexecuted locally until Chromium is provisioned; the runtime milestone and owner visual gate remain open.

### 2026-07-19 retry-race and publishing-hygiene re-review

- The first retry repair switched runtime authority to media before `audio.play()` settled. A pending promise could therefore freeze story time, and a late rejection could rebase fallback from the stale media seek rather than the current monotonic fallback clock.
- `runIntroAudioRetry`, consumed directly by `GameIntro`, now leaves `audioMode: fallback` authoritative throughout the pending promise. It samples and performs an initial seek for the playback attempt without changing authority. On guarded success it resamples current fallback time, seeks media again, commits `audioMode: media`, and clears the failure UI in the same promise turn. Rejection resamples current fallback time and retains fallback authority.
- Runtime state owns a retry generation. New retries, accepted completion, fallback/error re-entry, and disposal invalidate older promises before they can seek, switch clocks, or clear UI. Tests cover deferred success, delayed rejection, a newer retry superseding an older one, completion during retry, disposal during retry, and repeated fallback entry after a delayed rejection.
- TDD RED evidence: the expanded suite failed 5/10 before the retry runner existed. After the first GREEN pass, a repeated-fallback assertion failed 1/10 at stale time 11 rather than monotonic time 14.5. Focused GREEN then passed 10/10 with clean TypeScript and ESLint.
- Publishing hygiene now removes `.superpowers/sdd/final-fixes-report.md` and `.superpowers/sdd/task-5-report.md` from the index. `git ls-files .superpowers/sdd` returns no path; transient reports remain ignored local artifacts only. This ExecPlan and `TEST_REPORT.md` are the durable evidence surfaces.
- Fresh `time -p npm run check` exited 0 in 9.76 seconds: ESLint and TypeScript passed, Vitest passed 101/101 across 7 files in 251 ms, and Vite transformed 57 modules/build completed in 475 ms. `time -p npm run assets:check` exited 0 in 3.12 seconds with unchanged existing notices. `git diff --check` passed before evidence edits.
- Focused Playwright built and served, selected 10 Chromium tests, and exited 1 in 8.23 seconds because every case stopped at the same missing Chromium executable before its body. No browser or visual claim is added; the actual-browser/owner gate remains open.

## Outcome and handoff
The broad-review runtime repairs pass Vitest, lint, typecheck, production build, asset validation, and the full Chromium Playwright suite in draft-PR CI. Representative cue screenshots, a separately observed uninterrupted 53.04-second playback, and the owner visual gate remain open before final acceptance and removal of the legacy comparison path.
