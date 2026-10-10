# Character gym shoe matching repair

Owner feedback: matching the shoe colors still leaves visible inconsistency. Active worktree is `.worktrees/animation-workflow`, branch `fix/arcade-tooling-continuation`, HEAD `cd04f17`; local Captain artwork and gym tooling remain uncommitted.

## Root cause and correction

The nearest-palette matcher skipped lighter gray highlights because their RGB distance exceeded tolerance 45. The button still said the preview was updated, and repeated clicks added ineffective recipe steps. Live highlights reached roughly RGB 122/126/131 against reference shoe colors near 55/60/51. The existing shoe rectangle also contains the lower trouser cuffs; it remains editable and is not a semantic shoe mask.

Added an explicit **Match all colors in selected area** checkbox, saved in palette recipes as `includeDistant`. It bypasses tolerance only for that operation, preserving alpha and every pixel outside the rectangle. Old recipes keep their prior behavior. Actual changed/skipped pixel counts replace vague feedback; an operation changing no pixels does not alter the draft or Undo history. Palette matching maps to nearest reference shades; it can merge highlights and does not recreate details already altered by earlier replacements.

Files: `src/dev/arcadeArt.ts`, `src/dev/arcadeArtEditor.ts`, `dev/gym.html`; meaningful pixel and save tests in `src/dev/arcadeArt.test.ts`, `tools/dev/arcadeArtSave.test.mjs`; expanded real-browser proof in `tools/assets/check-arcade-gym-art.mjs`. Guide, plan 0053 and TEST_REPORT updated. No new dependency or combat/timing change.

## Actual validation

- First pixel test failed with gray RGB unchanged; first browser proof failed because feedback omitted changed/skipped counts. Logs retained.
- Focused tests: 16 pass (pixels, exact decoder, temporary-workspace persistence).
- `npm run check`: lint, types, 904 tests in 77 files, production build pass.
- Isolated real-browser art proof: 15 ok, zero console/page errors. Actual gray shoe pixel becomes dark reference color; alpha and trouser pixel unchanged. Keyboard all-color matching, Undo, no-op repeat, draft reload, actual gated copy Save/reopen byte equality, local loop preservation, repeated refusal, 375/768/1440, mirroring and reduced motion pass.
- Existing fresh gym regression: 13 ok, no console errors.
- `npm run arcade:validate`: 27 clips, 89 frames, 82 drawings, zero errors/nine pre-existing review warnings.
- All 119 earlier Captain source/candidate hashes verify. Cumulative full-diff self-review finds no critical/high issue; `git diff --check` passes.

Evidence is `preview-renders/mars-arcade/gym-shoe-fix/`. `browser/saved-copy/` is a disposable-workspace fixture, not owner artwork adoption. The October 4 implementation checksum manifest is historical; this follow-up's manifest records the revised implementation/evidence.

## Live handoff and remaining delta

Initial owner draft/settings backed up in `owner-before.json`; subsequent state in `owner-after.json`. The owner continues editing in the same browser; these snapshots are historical backups rather than authority over the latest draft. All five Captain jab drawings have reversible shoe-only all-color corrections using the original idle anchor. The five existing heavy shoe previews already match that palette; independent all-color replay changes zero pixels (`heavy-match-readout.json`), so no empty operation was added. No copy or table Save wrote to the actual worktree. Original sources/candidates remain intact. Tmux owned pane `%1` refreshed with actual `live-after.png`.

The matcher now includes previously skipped colors. Final professional-quality art approval remains open: existing manual replacements can affect outlines/shading, jab remains 105px against reference 104px with a 1px torso difference, and pose/box review still precedes combat adoption. No full production journey E2E, general 3D assets check, hosted preview, commit, push or publication was run.
