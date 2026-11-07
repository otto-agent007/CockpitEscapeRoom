# Click-to-begin entry and game emblem implementation plan

## Purpose and prompt contract

Goal: a fresh or restarted game opens on an illustrated **Click to begin** page. One native click or Enter press starts the existing cinematic, with sound requested directly inside that user gesture. A matching winged-key browser icon identifies the game tab.

Context: the owner chose this entry page on 2026-11-06 after reviewing browser autoplay restrictions. Production is `d1f9a6a`, served by both `captainskey.vercel.app` and `cockpit-escape-room.vercel.app`. `GameIntro` currently auto-starts after initial artwork decodes; `index.html` has no icon links.

Constraints: preserve CockpitEscapeRoom identity, The Captain's Key title, the cinematic itself, its PRESS START handoff, later-save resume, all progress, local-only data, reduced motion, and chapter/reward spoilers. Add no production dependency. Keep existing sound retry for genuine playback failure. The owner's latest click-to-begin instruction supersedes the earlier automatic-entry requirement in AGENTS/BLUEPRINT/GAME_DESIGN.

Done when: no media play request occurs before Begin; pointer and keyboard Begin request unmuted playback within user activation; asset retry, reload/restart and saved-chapter resume remain safe; the same generated emblem appears on entry and in the favicon; relevant browser coverage, npm run check, assets checks and full-diff review pass.

## Design and decisions

- The owner chose a click-to-begin page instead of automatic silent fallback on arrival. This user instruction is the design authority.
- Implementation choice: gold winged-key artwork on midnight navy, consistent with the existing golden title. Generate one text-free square with the built-in image maker, retain its original under art-source/branding, and create compressed display and favicon sizes from that same source.
- Keep the audio element mounted while artwork preloads, but call play only from the native Begin handler. Disable Begin until the initial visual tier is ready so the soundtrack and film start together without an asynchronous loss of user activation.
- New GameEntry component owns the small static entry surface; GameIntro retains its existing runtime, soundtrack, error handling and handoff.
- Update existing intro browser setup to perform the new required Begin action. Restart assertions now expect the entry page; saved non-briefing chapters continue directly.
- Use the single approved repository workspace on a feature branch based on current production. Preserve unrelated untracked files and worktrees.

## Files and interfaces

- `src/components/GameEntry.tsx`: present entry art/title, native Begin, initial-asset error/retry. Props: `loadState: IntroAssetLoadState`, `onBegin: () => void`, `onRetry: () => void`.
- `src/components/GameIntro.tsx`: remove the automatic-start effect; present GameEntry until started; invoke existing startIntro directly on Begin.
- `src/styles.css`: scoped responsive entry presentation and visible focus.
- `index.html`, `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/images/captains-key-emblem.webp`: matching tab/entry artwork.
- `art-source/branding/captains-key-emblem-source.png`, `asset-reports/captains-key-entry-art-2026-11-06.md`, `LICENSES/ASSET_MANIFEST.md`: generation prompt, source and derivative provenance.
- `e2e/entry-screen.spec.ts`: no pre-gesture playback, trusted pointer/keyboard sound start, asset failure/retry, favicon loading, reload and later-save resume.
- Existing intro/restart/accessibility/evidence browser fixtures: perform Begin where the cinematic is the target; keep every existing cinematic assertion.
- `BLUEPRINT.md`, `docs/GAME_DESIGN.md`, `TEST_REPORT.md`: current behavior and actual verification.

## Progress

- [x] 2026-11-06 — Refreshed origin/main and created feat/click-to-begin from production d1f9a6a; tracked files were clean.
- [x] 2026-11-06 — Generated gold winged-key artwork with the built-in image maker; original remains in the generated-images directory pending workspace copy.
- [x] Task 1 — Added entry browser tests; RED reproduced the missing Game entry region on unchanged product code (5-second absent-element failure, /tmp/captains-key-entry-red.log).
- [x] Task 2 — Integrated the artwork, Begin handler and fixture updates; all five focused entry tests passed.
- [x] Task 3 — Responsive/browser proof, constituent quality checks, asset guards and independent full-diff review completed; evidence recorded below and in TEST_REPORT.md.

## Implementation and validation

1. Add tests proving audio remains paused at zero until Begin and that the play call observes active user activation, unmuted. Add keyboard, asset retry and saved-resume coverage.
2. Run the fresh-entry test against unchanged product code; require an absent-entry failure, not a build/tooling error.
3. Copy the generated source; resize/compress with existing sharp tooling, with no creative repainting and no dependency addition. Inspect the icon at its actual small sizes.
4. Implement GameEntry and remove GameIntro auto-start. Preserve the native audio element and existing fallback path.
5. Adjust cinematic setup helpers to explicitly Begin. Update restart expectations and add entry accessibility coverage.
6. Run focused entry/intro/restart/accessibility browser tests and nearby complete-journey coverage. Browser plugin is unavailable; use installed Playwright/Chromium.
7. Inspect real screenshots at 375, 768 and 1440 CSS pixels, plus reduced-motion and keyboard paths; verify favicon requests and artwork decode.
8. Run npm run check and npm run assets:check. Review the full diff, resolve critical/high findings, and record actual results.

## Repair loop and stop conditions

Review → focused repair → rerun failed and nearby checks → record remaining delta. Allow at most three repair passes per repeated issue, then investigate the cause or record a concrete blocker. Stop when acceptance passes or owner visual review is required. A production merge/promotion is outside this implementation checkpoint.

## Discoveries and evidence

- The old root checkout was 114 commits behind the cached main; refreshing main and branching from d1f9a6a prevents introducing a stale version of the game.
- Root node_modules held React 19.2.7 while current production pins 19.3.1; npm ci was started to align the test environment with the production lockfile.
- Generation source: `/home/user1/.codex/generated_images/01a1b22e-936b-7933-8f1c-3935f86cb54e/exec-e43adbfc-5c5d-4de9-b93e-c8eecbfc2e37.png`.
- npm ci completed with the pinned production versions. The first RED launch found Playwright's new default browser missing; the installed Chromium 1243 executable was selected explicitly. The rerun failed for the expected missing-entry behavior.
- The compressed display image is 27,370 bytes; the generated source and three icon sizes are documented in the entry artwork report.
- `npm run check` was stopped during the unqualified lint scan of unrelated `.worktrees/` checkouts. The complete replacement sequence passed: `npm run lint -- --ignore-pattern '.worktrees/**'`, `npm run typecheck`, `npm run test` (1,060/1,060 in 96 files), `npm run build`; log `/tmp/captains-key-entry-validation.log`. No lint rules or product tests changed to accommodate those checkouts.
- Production Chromium: 30 passed / 1 optional capture skipped in 1.5 minutes, including all entry/intro cases, accessibility, both Airbus restart paths, reward protection and the complete journey. Log: `/tmp/captains-key-entry-browser.log`.
- Inspected screenshots at 375/768/1440 and mobile Enter/audio proof passed without overflow or browser errors; `/tmp/captains-key-entry/results.json` and `entry-{375,768,1440}.png`. Browser plugin unavailable; installed Chromium 1243 used.
- Assets, spoiler/privacy guards and budget passed: total 188.2/190 MB; initial 596/600 KB; `/tmp/captains-key-entry-assets.log`.
- Independent review found no Critical/Important issues. Minor observation retained: the existing synthetic 5.999-second assertion seeks live audio without pausing; it passed in the wider run and is outside this product change. Source/derivative hashes and `git diff --check` verified.

## Outcome and handoff

Implementation and local verification are complete. Local production preview remains at `http://127.0.0.1:4173/` on `feat/click-to-begin`, based on production `d1f9a6a`. The artwork and entry page are ready for owner visual review. No production deployment has been changed by this feature work.

## Owner-selected B restyle — 2026-11-06

The owner rejected the first gold-winged-key direction, reviewed three generated candidates in the tagged tmux pane, then chose **B — Arcade Adventure** and requested the whole Begin page match it. This selects `art-source/branding/entry-options-2026-11-06/arcade-adventure.png` (SHA-256 `9f860b039ca422c241eec45b81c5a4171a796fb10edbaf255f1ef98928a9215d`). That source stays unchanged. A new image-generated full-page layout, `arcade-page-concept.png` in the same directory, defines native text and controls around the approved artwork.

Goal: a coherent arcade title screen, including the artwork, title, body/control type, background, frame, focus/hover/error states and tab icon. The click/Enter sound start and the cinematic remain as verified above.

Design system: deep indigo background, pale gold pixel title with an amber offset shadow, lavender supporting copy, hard rectangular amber controls with a pixel bevel, stepped borders, and the complete square artwork displayed large. Use locally bundled Pixelify Sans (12,016-byte Latin WOFF2, SIL OFL 1.1) for the title and control/body typography. Keep the allowed copy: The Captain’s Key; For Pop T, from your crew.; Click to begin; Your flight begins with sound.; existing loading/error/retry messages. Remove the first version's Welcome aboard eyebrow. Desktop is title/control column left and square art right; narrow viewports stack art and centered title/control content.

The owner explicitly approved the full-page concept with "yeah that looks dope" while implementation was in progress. That image and B remain the design authority.

- [x] Restyle 1 — Integrated the unchanged approved B source, matching icons, native pixel typography, full-page styles and font/source/license provenance.
- [x] Restyle 2 — Eight production-browser cases pass, and final native/375/667/768/1280/1440 screenshots were compared against the concept and approved art. Actual browser screenshot displayed in tagged tmux pane %1.
- [x] Restyle 3 — Lint/types/full unit/build/asset guards and review passed; PR #123 updated; Vercel preview READY for code commit 1358538; actual browser screenshot displayed in tmux.

Boundaries: preserve earlier candidates locally without promoting A/C or replacing approved B with newly generated art. Do not merge or change production. Extend the existing entry browser test to check visible art/title/Begin without overflow at the required widths; do not add tests that merely mirror CSS constants. Record at least five concept-to-render comparisons and actual command results below.

Restyle evidence: lint/types/build passed in `/tmp/captains-key-arcade-final-build.log`; full unit suite 1,060/1,060, assets, spoiler/privacy and budget passed in `/tmp/captains-key-arcade-final-checks.log`. Initial download is 591/600 KB and total build 188.4/190 MB. The first 603 KB result was repaired by encoding the optional 180 px touch icon with a 16-color palette, leaving approved main art and 32 px tab preview unchanged. No budget changed.

Browser evidence: `/tmp/captains-key-arcade-final-browser.log` is 8/8 green. Independent review reported no Critical/Important findings and identified a minor blocked-font title overlap; the new regression failed RED at 901 px, then passed after local fallback metric adjustment. The complete title/art/Begin viewport checks now require ratio 1. `preview-renders/captains-key-arcade-entry-2026-11-06/` holds final screenshots, measured bounds, no-error/no-external-request receipt and an eight-point fidelity ledger. Concept and latest native browser screenshot were both opened in the same final view_image pass. The actual screenshot, rather than the concept, is now in the tmux side pane.

Hosted handoff: [draft PR #123](https://github.com/otto-agent007/CockpitEscapeRoom/pull/123) is updated around the selected arcade implementation. [Vercel preview](https://cockpit-escape-room-m3lt9qitl-ottoagent007-gmailcoms-projects.vercel.app/) is READY, deployment `dpl_EM6ZZdDuakm9RTC2aRXQK7BiKijz`, with exact code commit `1358538d703b4d517e6105b5c8a1f475b953731e` and preview target. Preview protection is left unchanged; no temporary share link was requested for this update. Local browser verification is recorded above; owner review of the hosted result remains pending. This final handoff-record edit changes documentation only. No merge or production promotion occurred.


## Owner-selected Bungee typography revision — 2026-11-06

Goal: replace the declined Pixelify Sans with the owner's selected **B — Bungee** live-page font preview. Context: `/tmp/captains-key-font-options/B-1440.png` and `B-375.png`, selected after the three-font comparison in the tagged tmux pane. Design: Bungee 400 for the three-line title and Begin button, Barlow 500 for dedication, sound/loading/error/retry copy. Keep the selected art, frame, copy, icons and synchronous Begin sound handler. This is the approved design; no further design decision is pending.

Constraints: use locally served, licensed WOFF2 files; no new dependency or runtime third-party requests; maintain the existing 600 KB initial-load budget and accessible native controls. Use CSS to fit Bungee's wider letters in each column without JavaScript layout measurement. Preserve all unrelated local candidates and files.

Implementation: replace scoped font faces/styles in `src/styles.css` and font preloads in `index.html`; replace the superseded public font with Bungee and Barlow WOFF2/license files; record exact source URLs/hashes in the existing branding provenance/report and asset manifest. Adapt the existing missing-font browser case to block the new fonts, retaining its overlap assertions. No new test suite is needed for this reversible typography change.

Done when: option B is faithfully rendered at 375, 768, 1440 and short landscape widths; title, full art and Begin remain visible with no overlap/overflow including blocked fonts; existing entry/accessibility tests pass, font files decode, Begin still starts advancing unmuted audio, lint/types/build and asset/privacy/spoiler/budget guards pass, and full-diff review finds no critical/high issue. Refresh the tagged tmux pane and draft PR preview; do not merge/promote production.

- [x] Replace fonts and fit the approved typography.
- [x] Verify the production page, fallback, sound and quality/budget checks.
- [ ] Review, record evidence and update the existing draft preview.

Bungee validation evidence: `preview-renders/captains-key-bungee-entry-2026-11-06/` (seven responsive captures, results and fidelity record); `/tmp/captains-key-bungee-{quality,browser,capture,guards}.log`. Eight entry/accessibility cases pass; fonts decode, no overflow/errors/external requests, Enter produces advancing unmuted sound. Lint/types/build, asset/privacy/spoiler/diff checks and 597/600 KB budget pass. No unit or complete-journey rerun for the scoped font revision. Independent review finds no Critical/Important issue; its Minor arrow-coverage wording correction is applied. Pending delta: commit/push this verified scope and record the new preview URL.
