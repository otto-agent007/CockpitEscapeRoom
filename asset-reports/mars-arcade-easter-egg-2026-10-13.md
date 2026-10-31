# Mars arcade Easter egg — local production candidate

The owner approved Donald's complete art/boxes/current balance and the remaining Booster/Sam heavy-block/victory/knockout boxes. The canonical table changes exactly18reviewed flags, preserving every other field and raw metadata. Art, timing, regions and tuning values are unchanged. Four warnings remain for retained candidates, not equipped gameplay clips.

The game now earns a separate version1local achievement at the completed reward/tribute frame. Hold T+M+B together for1500ms to open the arcade from any later chapter or restarted game. A native Bonus access section below the chapter preserves touch/assistive access without obscuring gameplay. Loading errors offer retry/return; Escape exits. The main reducer remains mounted while only chapter presentation/simulation is unmounted, preserving in-memory progress even when storage refuses writes.

## Production packaging and provenance

`mars-arcade.html` is a Vite production entry. Its guarded boot loads the existing renderer only after earned access; the development playground/editor import is removed from production by the DEV branch. The renderer uses unchanged rules and shipped tuning. The build emits183referenced PNGs totaling1,394,702bytes at their canonical paths; all are byte-identical to retained source files. Character sources/accepted authority and generation provenance remain in their existing reports. No external asset/license authority, Blender source or GLB changed. No production dependency was added.

## Actual verification

- Initial `npm run check`: lint, typecheck,1,018tests/93files and production build PASS. After review fixes, source lint (`npm run lint -- --ignore-pattern 'preview-renders/**'`, excluding immutable recovery/evidence copies), all1,018tests and rebuilt typecheck/build PASS.
- `npm run arcade:validate`:58clips/202frames/164drawings,0errors/4retainedcandidatewarnings. `npm run assets:check` PASS with existing model-validator informational output; intro58assets/51preloads.
- Built-preview Playwright:15/15new checks PASS: locked first/direct entry/no premature art; final-tribute unlock;1.5scontinuous/partial hold; restart/reload/exit; typing/modifiers/blur/visibility/editable-focus cancellation; denied achievement storage; denied chapter storage; native locker controls375/768/1440; actual four-fighter body PNGs/native controls/reduced motion/layout; renderer/document/shell load failures and recovery; return focus; axe no serious/critical findings.
- Final existing reward suite6/6PASS, including actual3D ModelY reveal/Skip/Replay, reduced motion/reload, failed asset/fallback and narrow layouts. Complete reordered journey1/1PASS. Initial nearby opening/DC9/accessible-reward checks4/4PASS.
- Exact18approval flags and all183productionPNGbytes verified; combat tuning identical. `git diff --check` PASS.
- Equivalent scoped reviewer identified four Important issues, each reproduced with retained RED proof and fixed: chapter-state loss with denied storage, native locker click obstruction, missing iframe-document timeout and a failed optional shell chunk blanking the app. Final correction review: no Critical/Important findings. No other-fighter art or combat logic changed.

Evidence: `preview-renders/mars-arcade/easter-egg-2026-10-13/` contains before snapshots/status/hashes, approval receipt, RED/GREEN/full-check logs, production packaging receipt,15-case final browser log, reward/journey logs and inspected375/768/1440screenshots. Browser plugin was not available; installed Chromium/Playwright was used against `http://127.0.0.1:5370`.

## Remaining boundary

This is a locally built and browser-verified visual candidate. No new hosted Vercel preview, commit, push, merge or deployment was performed. The entire unrelated E2E suite was not rerun; the exact focused/regression coverage above is claimed. Owner review of the integrated experience remains the visual milestone boundary, separate from the already-approved fighter artwork and boxes.

## 2026-10-30 owner revision for PR #118

The owner chose a secret entrance. The prior Bonus access section described above is removed from the player-facing game. After the completed tribute earns the local unlock, a continuous T+M+B hold opens the arcade from the game; the standalone URL remains guarded. Four fighters and the owner-approved Moonbase background are carried into PR #118. Current code, budget, browser and hosted results are tracked in `plans/0072-pr118-hidden-arcade-budget.md` and `TEST_REPORT.md`; the historical 2026-10-13 checks above are not claimed as fresh PR-branch checks.

## 2026-10-31 hosted packaging correction

Vercel's first build of PR #118 failed because `.vercelignore` excluded `art-source/`, while the Vite arcade plugin still read sprites from that source path. The 184 selected runtime PNGs now have byte-identical copies under `runtime-art/arcade/`, which Vercel uploads and Vite emits at their existing URLs. The build requires every referenced runtime copy. Source/candidate art remains under `art-source/arcade/`; Vercel continues to exclude it. The checked source, runtime and built copies each total 3,867,922 bytes and match for every selected path. `preview-renders/` is also excluded from deployment upload while its Git evidence is preserved.
