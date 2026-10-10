# Character gym art correction tools — 2026-10-04

## Owner outcome

The owner declined the remaining Captain jab/heavy inconsistencies and asked for a way to fix them in the character gym. `/dev/gym.html` now has **Art corrections**: fixed-reference/current views, regional palette matching, source/target color sampling and shade-preserving replacement, exact grounded height, torso alignment constrained by the existing foot pivot, manual x/y nudges, drawing/clip scope, original/reference overlays, Undo/reset and tab-local draft recovery.

Save creates new PNGs and a new unbound/unreviewed clip; originals remain intact. `recipe.json` binds the original and output hashes, correction operations and selected reference. The existing full-colour gate runs before the candidate is appended to the animation table. Frame holds/phases are copied from the saved source clip; other unsaved timing/box edits remain local. New boxes are seeded, attack boxes/binding removed and reviewed false. The original move rules, reach and balance are untouched. Owner guide: `docs/ARCADE_GYM_ART.md`.

## Changed implementation

- `src/dev/arcadeArt.ts`: deterministic pure pixel/recipe functions with editable regions and live geometry measurements.
- `src/dev/arcadeArtPng.ts`: exact original RGBA decoding using the browser's native deflate support. Canvas decoding rounds translucent RGB, which caused a proven preview/save mismatch; this avoids that loss.
- `src/dev/arcadeArtEditor.ts`, `arcadeGym.ts`, `dev/gym.html` and shared CSS: accessible native controls, source samplers, actual stage previews, fixed-reference overlays and reversible draft editing. Side-by-side canvas captions reserve equal height so displayed baselines align.
- `tools/dev/arcadeArtSave.ts` and Vite's dev-only `/__gym/art`: source/reference confinement and hash checks, immutable optimistic table baseline, serialized writes, bounded request bodies, staged PNG generation, existing gate, provenance, and atomic new-copy save. A refused gate/stale save leaves no candidate/table write.
- Pure/decoder/persistence tests plus `tools/assets/check-arcade-gym-art.mjs`. Browser saves run in a temporary copy of the workspace, never against the owner's art/table.

## Validation actually run

- Focused tests: **14 pass**, covering regional colors/shades/alpha, exact height, body-versus-foot alignment, malformed/clipped edits, byte-exact RGBA decoding, unchanged original inputs, saved provenance/reused drawings, stale table/source/reference refusal, gate-failure cleanup and concurrent stale writes.
- `npm run check`: lint/types, **902 tests / 77 files**, production build **pass**. Production output still excludes these dev tools.
- `check-arcade-gym-art.mjs`: **14 ok**, no console/page errors. It corrects all five heavy poses against Captain idle, applies three regional palettes, shows before/after/reference overlay, nudges by keyboard, undoes, refuses repeated clipping, samples/replaces colors, reloads the unsaved draft, saves a real gated new copy and reopens it with **identical displayed pixels**. It checks both facings, 1440/768/375 layouts without horizontal overflow, reduced-motion editing/reset, local review settings, and normal table Save followed by another art save. The first corrected-copy Save preserves all 27 pre-existing clips and all 82 input PNG hashes. A later explicit normal Save tests the separate table-edit path in that disposable workspace.
- Existing fresh-context `check-arcade-gym.mjs`: **13 ok**, no console errors; box/timing/keyboard/overlay/playback/invalid-save regression passes.
- `npm run arcade:validate`: **27 clips / 89 frames / 82 drawings, 0 errors / 9 existing review warnings** in the actual worktree.
- Actual worktree: all **27 pre-tool clips compare exactly** to the captured disk state; both owner's unsaved Captain loop preferences are restored locally. All **119 prior source/normalization artifact hashes** verify (44 jab, 52 v2 heavy, 23 v3). No new art copy was adopted into this table.
- Separate full-diff self-review: no critical/high finding remains. Caught and repaired a mutable baseline alias that would incorrectly refuse a save after local review edits; normal Save now advances the baseline as well. `git diff --check` passes.

## Evidence and remaining visual delta

Evidence prefix: `preview-renders/mars-arcade/gym-art-tools/`. Logs, actual browser screenshots, fixture recipe/gate/PNGs, owner-state preservation and the final live preview are retained. Test-only PNGs are saved under `browser/saved-copy/` for inspection; they are not entries in the real worktree's table. New copies use 128×128 RGBA, nearest-pixel height correction and the existing baseline/pivot contract. No external source/license or production dependency was added; all corrected art derives from preserved project inputs.

The live gym is left on Captain's cup strike, with Captain idle as the fixed reference and a **local reversible preview** of height/alignment/shoes/hat/trouser corrections across five drawings. It is height 104, baseline 119, foot center 63.5; the active torso remains 1px ahead of the reference. The metric exposes that residual rather than silently shifting feet out of contract. The custom image helper refreshed owned tmux pane `%1` with the actual live editor screenshot; this is visibility, not visual approval.

These tools repair colors and placement, not anatomy or inconsistent drawn shapes. Rectangles are editable starting areas, not semantic masks; nearest height scaling needs visual inspection. Specialized walk/airborne normalization still uses the source pipeline. Captain pose/box acceptance, final jab frame data/light replacement and combat integration remain open under plan 0052. Full production-journey E2E, general 3D `assets:check`, hosted preview/deployment and publication were not run for this dev-only editor milestone. No commit/push occurred.
