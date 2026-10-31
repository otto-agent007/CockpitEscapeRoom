# PR #118: hidden arcade and build budget repair

## Purpose

The draft ending PR should include the optional Mars arcade as a secret earned after the final tribute. Holding T+M+B for 1.5 seconds opens it; the game shows no arcade entry control, and the standalone URL does not start a match. The PR's build must meet the existing asset budgets without weakening the limits or changing the approved ending story.

## Current state

PR #118 (`feat/optimus-future-tesla-ending`, `171a7a7`) contains the Optimus and Tesla ending, but no production arcade entry. Its 2026-10-30 CI `quality` job fails only at asset budgets: 245.5 MB total against 190 MB and 1.36 MB initial download against 600 KB. The local `.worktrees/animation-workflow` contains a browser-tested hidden arcade implementation plus extensive unrelated dirty work. The PR branch is clean before this continuation.

## Scope and constraints

- Bring the earned, chord-only arcade and its required runtime art, rules, tests, docs and reports into the PR branch. Preserve the PR's newer mainline arcade controls and unrelated local work.
- Keep the Optimus review candidate, owner-selected Heart voice, Tesla film, and family tribute protected after Airbus. Keep source masters and prior candidates; do not hand-edit GLBs.
- Fix size by shipping only used runtime assets and a quality-checked browser-compatible film encode. Keep budget thresholds unchanged. Do not add a production dependency.
- The PR remains draft for owner visual review; no merge or production deployment is authorized.

## Progress

- [x] 2026-10-30: Inspect PR, review threads, CI failure, both worktrees, repo guidance and source implementation.
- [x] Import the arcade's production dependencies, referenced art, provenance and relevant tests into the PR branch; restore the PR's newer gamepad path.
- [x] Repair both build budgets; record exact source/output sizes and film validation.
- [x] Run focused and full local checks, production browser flow, asset guards and complete diff review.
- [ ] Commit and push to PR #118; inspect new CI and Vercel preview, update PR description and report remaining owner gates.

## Discoveries and decisions

- The initial download includes an 811,581-byte source logo as favicon. The already approved 14 KB ident base depicts the same logo and fits the existing initial budget.
- The PR dist includes the historical, unused Model Y GLB (22.9 MB), older Optimus review GLB (4.8 MB), source maps, and other source-only visual aids. The film is 60.8 MB at 1920×1080, 24 fps, H.264/AAC. Exact production references must be checked before pruning output.
- The animation-workflow code differs from PR #118's newer arcade rules in several modules. Preserve the PR rules and port only integration deltas needed for the secret and production renderer.
- The copied production arcade needs four-fighter rules, tuning, art and Moonbase assets; the PR's newer gamepad code was reconnected to that renderer. Exactly 184 runtime PNGs were hash-matched to the source worktree's emitted build before copying. Their source art remains in `art-source/arcade/`.
- The output excludes five exact unused historical public files and source maps; their source files remain versioned. Runtime references to excluded model files were checked. The already approved small TMB2 ident base replaces the large logo favicon.
- The runtime film fell from 60,766,724 to 38,596,084 bytes with identical AAC packets. Full decode passed; the 2,050-frame SSIM comparison averaged 0.990039, minimum 0.969956. The original is recoverable from parent commit `171a7a7` and Blender masters. Details are appended to the film asset report.
- Fresh combined `npm run check` passes lint, types, 1,048 tests in 95 files and production build. Asset check passes with known nonfatal model notices. Arcade validator finds 58 clips, 202 frames, 164 drawings, 0 errors and four retained candidate warnings. Spoiler/privacy guards pass. Asset budgets pass at 185.3/190.0 MB total and 567/600 KB initial download; the largest script and per-model caps pass too. Python tool suites pass.
- The initial Chromium run used port 5370, which Playwright reused from an older preview; its controller failure revealed stale HTML. That run is excluded from PR-branch proof. A fresh production build/preview on 5397 passed 40/40 arcade, Moonbase and reward cases, including the production controller. The complete reordered journey passed 1/1 on a separate fresh 5398 preview. Screenshots under `preview-renders/mars-arcade/pr118-2026-10-30/` were inspected at 375, 768 and 1440 px.
- Full local review checked the runtime references of every omitted output path, protected reward loading, state/reload/denied-storage paths, controller preservation, unchanged budget limits, and the selected art provenance. `git diff --check` and final lint pass. No critical/high finding remains in the local review.

## Implementation steps

1. Compare arcade implementation, identify runtime imports and 184 emitted image paths, transfer exact dependencies and needed art into this worktree. Reconcile App and reward changes manually.
2. Use the existing small TMB2 ident asset for the favicon. Exclude only proven unused files and maps from the deployed output while retaining sources. Encode a smaller H.264/AAC runtime film if needed; compare duration, frames, audio, representative visuals and playback.
3. Update tests and `README.md`, `BLUEPRINT.md`, `docs/GAME_DESIGN.md`, asset records and `TEST_REPORT.md` with actual combined behavior and validation.

## Validation plan and acceptance criteria

- First play and direct URL remain locked. Completing the full ending earns the local unlock; T+M+B works after reload and Restart, cancels on partial/editable/blur input, and opens four fighters plus Mars/Moonbase. Exit restores chapter, focus and film/tribute stage. Main ending remains spoiler-safe, keyboard accessible, reduced-motion usable, and functional at 375/768/1440 px.
- `npm run check`, `npm run assets:check`, `npm run arcade:validate`, spoiler/privacy guards, asset-budget check, relevant production Playwright cases, and full-diff review pass on the PR branch. CI and Vercel must be inspected after push.
- Film runtime has 85.4167 seconds, 1920×1080 at 24 fps, audible AAC, a complete decode and acceptable representative frame quality. Original approved source remains recoverable from Git history and Blender source records.

## Repair loop and stop conditions

For each failure, record the observed cause, make one bounded correction, rerun the failed check and nearby regression checks. Stop after three unsuccessful substantive attempts at one issue or when a real owner quality decision is required. Never claim an unrun check passed.

## Evidence and outcome

Implementation, local code/asset checks, fresh production browser validation and local full-diff review pass. Push and hosted checks remain in progress. Owner visual and rights gates remain open after those checks.
