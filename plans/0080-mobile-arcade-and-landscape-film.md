# Mobile arcade and landscape film implementation plan

> For agentic workers: use the scoped parallel implementation tasks below. Root owns integration, secret entry, evidence and publication. Preserve the single workspace and unrelated files.

## Purpose and approved design

Goal: a touch-only player can enter the earned Mars arcade and fight without buttons covering the arena, then watch Model FLY comfortably in landscape. The owner inspected actual 375×812/812×375 screenshots and approved controls **below the arena in portrait and beside it in landscape**. Model FLY remains the approved widescreen film, with its original music and automatic playback. The proposed hidden three-second press on the final tribute title supplies the mobile arcade entrance, gated by the existing earned unlock.

Context: branch `feat/mobile-cockpit-controls`, starting at `0321056e035d02002bcd4ac1c47583350c6bb9ff`, stacked draft PR #124 on #123. Actual before images are in `/tmp/mobile-arcade-2026-11-07/` and `/tmp/mobile-ending-2026-11-07/`. Arcade controls currently overlay the arena; the Start fight button needs scrolling in portrait. The film retains 16:9 and uses much of a portrait screen for black bars. Its action bar covers part of the image in landscape. Browser plugin is unavailable; use installed Playwright/Chromium and the existing dev 4175 / production 4174 servers.

Architecture: preserve the game runtimes and responsive canvas aspect ratio. Arcade presentation is native DOM/CSS in `mars-arcade.html`, `src/arcade/main.ts` and `src/arcade/player.css`, with only bounded container-sizing/input fixes in `src/dev/arcadeHarness.ts` if needed. Film presentation stays lazy in `RewardExperience.tsx` and a scoped film CSS/helper module. Root passes an already-earned `onOpenArcade` callback from App and supplies a native secret title control. No new production dependency or asset.

## Constraints and acceptance

- Preserve project identity, all chapters/progress, Model Y spoiler protection, completed-once local unlock, T+M+B keyboard entry, return/restart semantics and audio choices. No GLB, sprites, movie or camera edits. Do not change game rules, timing or combat balance.
- Portrait has visible native movement/attack controls below the actual arena. Landscape has separate thumb groups beside the actual arena. Reserve layout space so UI cannot paint over fighters/HUD. Minimum 48px continuous touch controls and 44px utilities. Required input supports two fingers and safe release/cancel/blur/hidden/resize/menu/unmount.
- Keep Pause and Menu reachable. Secondary actions/instructions may move into an accessible menu that pauses combat, handles Escape/focus, and requires explicit Resume. Selection and Start remain usable at narrow widths. Desktop controls remain equivalent.
- Film keeps automatic advancing playback and original audio after Reveal. Add a user-gesture landscape/fullscreen action, native iOS video fullscreen fallback where supported, and clear rotate-phone guidance where orientation lock is absent/rejected. Do not imply the browser can always rotate the phone. Preserve playback time/sound across viewport changes, native video controls, retry/muted/manual-play fallbacks, skip, replay and final tribute. Keep film actions compact in landscape.
- Orientation requests must not fire late after skip/unmount or leave the tribute/arcade locked. Unlock only orientation acquired by this film; do not exit unrelated fullscreen. Unsupported/rejected APIs are recoverable without blocking playback.
- Hidden title hold works only after earned completion. Short presses, early release, pointer cancel, moving away, backgrounding, blur and unmount do not open it. Fire once per hold. Keep a native keyboard/assistive activation path and the existing keyboard chord. No visible arcade hint/spoiler before completion.
- Verify approximately 375, 768 and 1440 widths plus 667/812/932 short landscape and larger touch screens. Check touch/keyboard, menu/pause, reload/restart/local unlock, rejected APIs, replay/skip, reduced motion and accessibility. Real player-visible screenshots accompany the review; no production merge/promotion.

## Review focus

1. Required controls or HUD still hidden/clipped when text grows, viewport rotates, or safe-area padding applies.
2. Held input surviving menu/rotation/cancel or one finger releasing the other.
3. Async fullscreen/orientation success arriving after film has ended.
4. Native Safari fullscreen unavailable, synchronous exceptions and rejected promises.
5. Secret entry firing early, resetting progress or leaking before completion.

## Tasks and ownership

- [x] Arcade worker: focused failing responsive/input/menu tests; implement chosen mobile layout and compact selection; verify through dev browser. Own arcade HTML/main/CSS, bounded harness fixes, dedicated e2e tests. No shared App/RewardExperience/styles.css/docs changes.
- [x] Film worker: focused failing API/playback/rotation tests; implement landscape/fullscreen presentation and lifecycle cleanup. Own RewardExperience, new scoped film helper/CSS/tests. Integrate root's `SecretArcadeEntry` as a child of the completed h1 only when optional `onOpenArcade` exists. Do not edit App, secret component or shared styles.css.
- [x] Root: `SecretArcadeEntry({onOpen, children})`, root/App earned callback wiring, hidden-entry tests, integration and full-diff review.
- [x] Root: run focused browser checks, lint/types/full unit/build, assets/spoiler/privacy/budget guards, independent review, real screenshots, current source/asset receipts and TEST_REPORT.md.
- [ ] Root: show the current screenshots in the existing tagged tmux pane, update the scoped draft PR and obtain preview metadata matching the code. Leave owner visual review pending; no merge/promote.

## Implementation, validation and evidence

Use failing tests before behavior changes, then the smallest relevant test plus nearby regressions. Do not run competing production builds or browser capture jobs across workers. Workers use port 4175 with separate test output paths and report commands/results; root schedules the final production run on 4174. Parent-owned quality checks run after the workers finish. Preserve unrelated untracked `.worktrees/`, artwork and resume files. Use lint's `.worktrees/**` CLI exclusion as in the previous milestone; no test/budget limits are weakened.

Browser evidence must show real sprites/movie, page identity, native input results, layout geometry, no console/runtime errors, and 375/768/1440 with short-landscape views. Save selected final evidence under `preview-renders/mobile-arcade-film-2026-11-07/`; preserve before images. Record source fingerprints and unchanged asset identity without unnecessary archive/hash sweeps. Browser APIs: MDN ScreenOrientation.lock describes limited availability/fullscreen requirements; Apple documents gesture-required native video fullscreen. Physical iOS/Android behavior remains unverified unless actually tested.

## Progress, discoveries and decisions

- 2026-11-07: owner chose portrait controls below / landscape controls beside. Native fullscreen plus best-effort orientation lock is the default; rotation guidance is the fallback. CSS-only forced sideways rotation is avoided because it can conflict with device rotation and touch coordinates.
- 2026-11-07: initial build/source verified at 0321056; baseline actual screenshots confirm overlay obstruction and letterboxing. No application edits yet.
- 2026-11-07: arcade logical artwork is **320×224 (10:7)**, not 16:9; preserve that original arena ratio. Film is 1920×1080 (16:9). A native modal pauses the arcade; closing it leaves Resume explicit. Six P1 controls remain visible; two-player mode reserves a separate native controls row.
- 2026-11-07: film controller has 15 passing API lifecycle tests, including explicitly disabled generic fullscreen with native Safari fallback, rejection and delayed completion. Dev browser run passes 21 dedicated/autoplay/reward cases in 1.1m, with screenshots at six sizes in `/tmp/mobile-film-landscape-tests-final/`. Native action requests fullscreen directly in the gesture; CSS-only forced rotation is not used. Real iOS/Android remains untested.
- 2026-11-07: root secret-hold tests first failed with the missing controller/heading feature; all three timer tests now pass. Component/App wiring is present, scoped lint passes after removing an unnecessary render-time ref callback, and browser GREEN is queued after arcade checks. All game/asset bytes remain unchanged.
- 2026-11-07: integration reproduced Return focus failure with an instrumented run: the old requestAnimationFrame focused connected `mars-arcade-view` without tabindex while the iframe stayed active, before React committed the replacement game main. Root now restores focus in a post-commit effect. The original failure assertion remains unchanged; secret-entry/retry dev run passes 4/4 in 30.0 s (`/tmp/mobile-secret-return-green.log`).
- 2026-11-07: final source lint (excluding unrelated `.worktrees/**`), typecheck, all **1,078 unit tests in 98 files**, and build pass (`/tmp/mobile-arcade-film-final-quality.log`). Assets check passes with the existing unused-UV warnings; intro contract 58 assets/51 preloads. Final privacy/spoiler/budget guards pass at **578/600 KB** initial and 188.4/190 MB total (`/tmp/mobile-arcade-film-final-guards.log`, model/intro output `/tmp/mobile-arcade-film-guards.log`). No budgets or tests weakened.
- 2026-11-07: final local-production Chromium passes **42/42 in 3.1 m** (`/tmp/mobile-arcade-film-production.log`): all new layout/hold/API cases plus original audio, controller, unlock/storage/retry, accessibility and complete reordered journey. Dedicated mobile cancellation includes early release, pointer cancel, movement away, blur, background visibility and unmount. Independent full-diff review, including final portrait spacing, orientation-specific guidance and focus repair, finds no Critical/Important/Minor issue. Real screenshot capture is running; physical iOS/Android and hosted-browser validation remain untested.
- 2026-11-07: actual production screenshot run passes **1/1 in 22.2 s**, including a real three-second title hold opening the arcade, native selection/Start/Menu/Return, five film and five arena geometries, original runtime movie bytes/hash and eleven matching source fingerprints. The error receipt is empty. Selected screenshots/before evidence and fidelity report are in `preview-renders/mobile-arcade-film-2026-11-07/`. Full source and focus-fix reviews have no remaining findings. Remote handoff/owner visual review is next.

## Repair loop and stop conditions

Inspect the actual failure, identify its root cause, make one bounded fix, rerun the failing check and nearby coverage, and update this plan. After three consecutive passes without a shrinking delta, stop for the genuine unresolved product/platform decision. Owner visual approval remains distinct from automated checks. Never mark an unrun check passing or publish/merge production without authorization.

## Outcome and handoff

Implementation and local validation are complete. Reviewable actual screenshots, source fingerprints, unchanged asset receipt and TEST_REPORT.md are current. Draft PR/preview publication is next; owner visual approval and physical-phone testing remain separate. No production merge/promotion is authorized.
