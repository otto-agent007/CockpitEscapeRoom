# Mars arcade: completed-game T+M+B Easter egg

## Purpose and prompt contract

Goal: after completing CockpitEscapeRoom once, hold T+M+B together from any chapter to play the existing Mars arcade and return without losing progress. Record the owner's explicit approval of Donald and the remaining Booster/Sam boxes.

Context: the arcade and four authored fighters are complete in the animation-workflow worktree, but only `/dev/arcade.html` exists. The main ending is `RewardExperience`'s complete frame with the family tribute; merely unlocking the vehicle is not the completed ending. The current chapter save is cleared on Restart. Sprite paths point into source files which Vite does not ship today.

Constraints: preserve all existing art, combat tuning, raw animation metadata, unrelated work and the first-play surprise. No new dependency, upload, paid API, commit or deployment. Pure shortcut/persistence rules belong in `src/game`; the isolated arcade view belongs in `src/components`. Lazy-load arcade code/art only when entered. Keep development editors/endpoints out of the production player flow. Accessible fallback and reduced-motion endings count as completion. The owner's 2026-10-29 revision makes the optional arcade a keyboard-only secret; no visible access control or hint appears in the game.

Done when: first-play chords and standalone arcade access stay locked, including after completion; completing the final tribute unlocks locally; hold all three letters for 1.5 seconds to enter from any later playthrough; partial holds, repeats, typing, modifiers, blur and visibility loss cannot trigger accidental entry; reload and Restart retain the earned unlock. No player-facing arcade access control appears before or after completion. Returning or Escape restores the safe saved chapter, current reward stage and focus. Production preview renders the actual four fighters, backdrop, specials and native controls without missing images, debug editors or errors at 375/768/1440. Appropriate unit/browser checks, lint, types, build, assets and full-diff review pass.

## Current state and decisions

- Worktree: `.worktrees/animation-workflow`, branch `fix/arcade-tooling-continuation` (existing authorized local continuation, preserve all local changes).
- 2026-10-13 owner says “ok I approve 1 and 2”: Donald's 12 art/box families and existing special balance; Booster/Sam heavy-block/victory/knockout boxes are accepted. Only 18 `reviewed` flags change. Four retained candidate warnings stay unreviewed.
- Editable hold default: 1,500 ms. Three letters may be pressed in any order, then must overlap continuously for that duration.
- Store a separate versioned `completedOnce` achievement so restarting chapter progress cannot revoke it. Completion is the final reward/tribute frame, including skip and accessible/reduced-motion presentations.
- Use an isolated same-origin arcade frame with its own production entry and the proven renderer/rules. Unmount the chapter while playing so cockpit inputs, simulation and audio stop; remount resumes the durable checkpoint. Validate frame messages by origin/source and gate the entry independently.
- Production builds include exact referenced sprite/effect/backdrop PNGs; source masters and rejected generation attempts remain local. Development gym/playground remain development-only.

## Progress

- [x] Inspect worktree, guidance, lessons, game ending, storage, arcade renderer and asset paths; capture before hashes/status.
- [x] Record 18 approval flags with exact preservation assertions and owner receipt.
- [x] Write and run failing shortcut/persistence and production-entry browser tests.
- [x] Implement permanent achievement, held shortcut, accessible entry, return flow and production arcade assets/runtime.
- [x] Verify focused/full checks, browser interactions, responsive/reduced-motion and source preservation.
- [x] Complete full-diff review, record actual evidence and remaining visual gate.

## Discoveries

The dev renderer loads `/art-source/...` URLs, which are served locally but absent from Vite output. Production integration must emit these exact referenced assets; a green dev page alone cannot prove shipping integration. The playground currently applies shipped combat tuning, so the production entry must apply it independently before creating a round.

## Milestones and implementation steps

1. Tests demonstrate durable unlock validation and a continuous three-letter hold with cancellation/one-shot semantics.
2. `src/game/marsArcadeUnlock.ts` and shortcut controller provide versioned local-only unlock and testable timing; App wrapper isolates entry/exit from chapter saves without displaying an entry control. RewardExperience reports the final ending.
3. `mars-arcade.html`, production boot and accessible component isolate gameplay; shared renderer exports a mount function, conditionally imports the development playground, and retains existing defaults for dev.
4. Vite emits production HTML and referenced PNGs; test the built preview, locked direct entry, completion, replay/restart, errors, all fighters and controls.

## Validation plan and acceptance criteria

Run focused Vitest RED then GREEN, typecheck/lint, full `npm run check`, arcade validator and `npm run assets:check`. Use the installed Playwright fallback (Browser plugin not available) against a built preview for the complete unlock/entry/exit flow, direct-entry guard, keyboard-only access, failure/retry, reload/restart, reduced motion, and 375/768/1440. Assert no visible arcade entry, actual sprite/effect sources and no image 404s. Reuse nearby reward/journey/accessibility regression tests and record commands actually run. Review the full owned diff for metadata loss, unlocked spoilers, unsafe DOM operations, origin/source validation, timer/listener leaks, false completion and progress loss.

## Repair loop and stop conditions

Reproduce one failed acceptance check, correct its cause, rerun it and nearby regressions, then record evidence. Maximum three substantive attempts per distinct defect before stating the remaining delta; retain failed evidence. The requested mechanics are authorized. New visual milestones require owner review after concrete browser evidence, and no publication is implied.

## Evidence and outcome

Before hashes/source/status and explicit approval receipt: `preview-renders/mars-arcade/easter-egg-2026-10-13/`. Actual command results and handoff will be added as work proceeds.

## Final discoveries, validation and handoff — 2026-10-13

Shared effect paths/layouts now live in DOM-free `src/game/marsArcadeArt.ts`: importing browser renderer modules into the Node build configuration failed typecheck. Production emits183PNGs/1,394,702bytes, all byte-identical to source. A nonblocking future-native-config-loader warning remains for existing extensionless transitive imports from the stage module; current build/preview pass.

Scoped review found four defects, each reproduced RED then corrected and browser-proven: retain `useGame` above unmounted presentation to protect in-memory progress when writes fail; place Bonus access in normal document flow to avoid covering the native watch button; use a cleared15second readiness timeout to recover failed iframe document/boot loads; eagerly load the tiny shell to preserve Return/Retry while renderer/art remain lazy. Editable focus and visibility loss cancel pending holds. The browser driver was also corrected to accept the existing Restart confirmation, await App readiness after reload, and match the actual uppercase fighter labels/Rolex GMT-Master dialog.

- Initial `npm run check`: lint/types/1,018tests93files/build PASS. Final source corrections: `npm run lint -- --ignore-pattern 'preview-renders/**'` (immutable evidence/recovery copies excluded), all1,018tests and `npm run build` including typecheck PASS.
- Arcade validator58clips/202frames/164drawings:0errors/4retainedcandidatewarnings. `npm run assets:check` PASS with existing informational output. Exact18approval flags and unchanged tuning verified; production183PNGbytes match source.
- New production Playwright15/15PASS at375/768/1440: locked access, continuous/partial hold, ending/reload/Restart, typing/modifiers/blur/focus/visibility, denied storage, preserved progress, native locker pointer controls, actual body PNGs, native combat, loading failures/retry, return focus and axe. Existing reward6/6PASS including actual3D/reduced motion/failure/reload; complete reordered journey1/1PASS. Earlier nearby opening/DC9/accessible reward4/4PASS.
- Final independent correction review: no Critical/Important findings. Desktop/375/768 screenshots inspected from `browser-final/`; complete arena/HUD fit, native controls remain available, and production diagnostics are hidden.

Local implementation and requested fighter approvals are complete. Built preview: `http://127.0.0.1:5370/`. Exact evidence: `asset-reports/mars-arcade-easter-egg-2026-10-13.md`, `TEST_REPORT.md` and the evidence directory. Existing unrelated changes/prior candidates are preserved. No new Vercel preview, commit, push, merge or deployment occurred; the unrelated whole E2E suite was not rerun. Owner review of the integrated visual milestone remains separate from the accepted fighter art/boxes.

## Owner revision and validation — 2026-10-29

The owner requested a secret arcade accessible only by T+M+B. This supersedes the earlier post-completion native Bonus access control described in the historical October 13 evidence. Removed that control and styling, and changed the standalone arcade URL to remain locked even with the earned achievement. The optional game frame now starts only after the main game receives the chord and grants access. This intentionally leaves touch-only players without the optional arcade; required story and reward interactions retain native controls.

The browser tests first failed on the visible control and earned direct URL, proving both paths existed. During regression, exiting the arcade after the completed tribute returned to the start of the film; the reward stage now survives the arcade mount cycle and resets correctly on film replay or game Restart. Returning from the arcade focuses the main game region. Moonbase tests now enter through the actual secret chord rather than the standalone page. A test readiness race on an immediate post-navigation chord was fixed by waiting for the briefing shell before sending keys.

Final checks: scoped Chromium preview 27/28 followed by focused direct-URL 1/1 (all 28 affected cases pass across the final runs); separate reward-stage focus/replay 4/4; `npm run lint -- --ignore-pattern 'preview-renders/**'`, `npm run typecheck`, 1,032 Vitest tests in 94 files, build, `assets:check`, arcade validator (0 errors, 4 retained candidate warnings), and `git diff --check` pass. Browser coverage includes locked/earned access, failure and retry, reload/Restart, denied storage, reward return, Moonbase, reduced motion and 375/768/1440. No hosted preview, unrelated full E2E run, commit, push or deployment in this revision. Visual owner review and release integration remain open.
