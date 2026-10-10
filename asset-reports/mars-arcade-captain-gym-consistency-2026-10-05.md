# Captain jab and coffee-heavy corrected candidate

The owner accepted the appearance shown in the tmux comparison on 2026-10-05: **“Looks consistent; keep this art candidate.”** Both corrected moves use the original idle Captain as the reference. This acceptance applies to appearance; attack/hurt boxes and jab frame data remain separate decisions.

The existing gym's deterministic operations produced these copies from unchanged original PNGs: match 104px height, align the torso while keeping grounded feet within the pivot limit, then match the hat, trousers and shoes to idle's regional palettes with the explicit all-color option. This avoids stacking shade replacements over the historical draft. Originals and that draft are preserved for comparison. No generated anatomy was redrawn, new imagery generated, validator changed or dependency added.

Saved candidates:

- `captain:jab-candidate-art-4ddcbf2f`: `art-source/arcade/captain/gym-edits/4ddcbf2f-cbfd-4c05-b99a-48ba2ec0d175/`.
- `captain:heavy-candidate-art-e8899500`: `art-source/arcade/captain/gym-edits/e8899500-bf4d-4c22-9694-a1eacbedbda7/`.

Each folder has five 128×128 RGBA cells, `recipe.json` with input/output hashes, and the unchanged sprite gate's passing output. Holds/phases remain 5/4/3/5/6; both candidates have no `moveId` or attack box and `reviewed: false`. The audit reports head width 31px for jab and 32px for heavy. All frames match 104px height and baseline 119. The active heavy retains the disclosed 1px torso difference rather than violate the foot pivot. Regional matching can merge close shades; the accepted comparison is visual authority for this candidate, not a general guarantee of shading/anatomy quality.

## Validation

`npm run check` passes lint, types, 904 tests/77 files, and build. Ten cell gates pass; both sequence audits pass with no failing clip. Review validator is 29 clips/99 frames/92 drawings, zero errors/11 box-review warnings. The original worktree remains 27/89/82, zero errors/nine warnings. Nine explicit artifact/browser checks pass, including exact saved recipe replay, unchanged original inputs, all five playback frames through final tick 22, reload of saved copies/pose, mirrored and 375/768/1440 views without overflow, keyboard/reduced-motion operation, and zero page/console errors. The Browser plugin is unavailable; existing installed Playwright and agent-browser provide local proof.

Evidence: `preview-renders/mars-arcade/captain-gym-consistency-2026-10-05/`. `review.json` names source hashes, operations, candidates and metrics; `appearance-acceptance.json` records scope; `review-table.json` preserves all original clips plus the two copies. `comparison.png` includes originals, the historical local draft, and new copies. `corrected-sequences.png` is the owner-accepted sidepane image. The audit folders contain independent measurements/contact sheets/GIFs. Reproduction scripts and captured logs are retained.

The 1,222,078-byte `review-gym.tar.gz` preserves the complete review source/table/sprites/lockfile without dependencies. Fresh extraction matched the saved table and all accepted drawings/recipes/gate output byte-for-byte. `RESUME.md` explains reopening. `CHECKSUMS.sha256` records retained evidence and both permanent candidate folders. This is a local same-disk recovery copy. A scoped full-diff self-review and `git diff --check` found no critical/high issue; no production code changed in this pass.

## Resume

The visible review gym is `http://127.0.0.1:5362/dev/gym.html`, with these candidates available in Clip. Its local root is `.cache/captain-consistency-review-20261005`. The original gym/arcade remains on 5360; its authoritative animation table is byte-identical to the starting table, avoiding reload of current unsaved owner timing/boxes/loops. Corrected PNGs/recipes and the review table are kept outside that cache as well. The historical owner draft was used for comparison only and never restored over the current tab.

Continue with heavy boxes and their sign-off; propose exact jab frame data before the already-authorized light-action replacement. Only then wire combat presentation and prove hit/block/whiff/both facings. No combat binding, balance change, original-source overwrite, commit, publication, hosted preview, general 3D asset check or full production E2E occurred.
