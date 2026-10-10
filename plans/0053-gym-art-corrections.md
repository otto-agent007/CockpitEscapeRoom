# Character gym art corrections

## Purpose

**Goal:** The owner can repair Captain's changing hat/trouser/shoe colors, excess height and body drift in the character gym, using a fixed reference and reversible edits.

## Current state

**Context:** Worktree `.worktrees/animation-workflow`, branch `fix/arcade-tooling-continuation`, HEAD `cd04f17`. Captain jab and cup-heavy art are unbound candidates from plan 0052. Owner declines consistency-v3 for remaining color, height and alignment inconsistencies. `src/dev/arcadeGym.ts` edits timing/boxes only. `dev/gym.html`, shared CSS and Vite's local save middleware provide the existing editing workflow. Original source waves and local review settings must survive this extension.

## Scope and constraints

Add an art panel with a same-fighter fixed reference, original/corrected comparison, region-limited reference-palette matching and sampled color replacement, explicit height and x/y alignment, body-to-reference alignment, current drawing/whole clip scope, Undo/reset and persistent local draft recovery. The main stage previews corrections at its existing holds, mirror/onion settings and boxes.

Corrections are deterministic recipes, replayed from original pixels. This owner-requested tool explicitly permits color/size corrections to saved copies; it supersedes the skill's prohibition on manual generated-cell changes for this workflow only. Keep the source normalization scale and original bitmaps intact. Do not quantize whole fighters automatically or change validators, holds, reach, tuning, control bindings or accepted clips. No production dependency, network service, commit or publication.

Save creates a **new unbound, unreviewed gym clip**, with new PNGs and source-hash/recipe provenance under the fighter's `gym-edits/` folder. All original clips and raw sources remain intact. Art drafts are separate from timing/box edits; a corrected copy saves only that new clip, leaving other unsaved gym edits local. A stale disk table refuses a write. Validate recipes and pixels before writing; no browser-supplied file destinations. The existing animation table remains the runtime authority.

## Progress

- [x] 2026-10-05 — Owner reports shoe matching leaves gray areas unchanged. Preserved live draft, reproduced exact pixels, added explicit all-color matching and truthful pixel feedback, verified browser/save/reload and refreshed sidepane.
- [x] 2026-10-04 — Inspected current worktree, live source drift, editing flow, save middleware and local skill. Captured owner's unsaved table/selection without a Save POST.
- [x] Implement and test deterministic region recoloring, palette matching, grounded resize and body alignment.
- [x] Implement/test new-copy save with recipe/hash provenance, unchanged originals, stale/error refusal and sprite gate.
- [x] Add native controls, sampled colors, fixed-reference overlay, reversible preview and local draft recovery.
- [x] Prove the full workflow in the actual browser at 375/768/1440, keyboard/reload/reduced-motion and existing gym regression.
- [x] Review complete diff; update TEST_REPORT/report and sidepane proof; leave the gym ready for owner use.

## Decisions and discoveries

- 2026-10-05 — Live jab has 21–23 local corrections per drawing, including repeated regional palettes, two shade-preserving replacements and whole-sprite palettes. All ten draft drawings are backed up to `preview-renders/mars-arcade/gym-shoe-fix/owner-before.json`. Gray shoe highlights reach RGB roughly 122/126/131; reference shoe colors peak around 56. Nearest-color tolerance 45 silently skips these highlights, and repeated palette clicks cannot change them. Keep legacy recipes unchanged; add an explicit `includeDistant` palette option, expose changed/skipped pixel counts, and avoid adding empty undo steps. Done when gray/white shoe pixels map to the selected reference palette with alpha/outside-area pixels preserved, legacy tolerance still protects distant colors, and copy Save/reload reproduces exact pixels. No original-art replacement or combat change.
- 2026-10-04 — Exact torso matching on the active heavy moved its foot center to 62.5 and failed the existing pivot gate. Automatic alignment now picks the nearest body offset keeping feet within 64 ± 1; the readout exposes any remaining body difference. No threshold was changed. The active corrected preview still has a 1px torso difference.
- 2026-10-04 — Canvas image decoding rounds translucent RGB values, producing a proven preview/export mismatch. Added an exact native-deflate PNG reader; byte-comparison tests and browser save/reopen now pass. This fixes input fidelity without a dependency or palette quantization.
- 2026-10-04 — Full-diff review caught baseline aliasing with mutable local table state. Clone the optimistic baseline; update it after normal Save as well. Browser proof now covers preserving local loop edits during corrected-copy Save and subsequent normal/next-art saves.
- 2026-10-04 — Use a bounded extension to the existing gym. RGB edits are limited to an editable rectangle; preset hat/trouser/shoe areas are starting points, not semantic masks. Reference-palette matching preserves alpha and uses nearby reference colors; exact source/target replacement also supports preserving shade differences. Native numeric sample coordinates supplement canvas sampling.
- 2026-10-04 — Align by the torso's rear edge rather than the full sprite bounding box, so an extended cup/palm does not move the body. Resize about the grounded baseline using nearest sampling; report/reject clipping rather than silently cutting pixels.
- 2026-10-04 — Save a new candidate clip to avoid changing approved art/boxes. Remove combat binding/attack boxes from the candidate; seed body/hurt boxes from saved silhouettes and set reviewed false. Keep original phases and holds for visual comparison.

## Implementation steps

1. Pure pixel/recipe functions in `src/dev/arcadeArt.ts`, with meaningful tests in `arcadeArt.test.ts`: restricted recoloring, reference palette, alpha/immutability, exact grounded height, body alignment, clipping and malformed input.
2. Dev-only persistence helper in `tools/dev/arcadeArtSave.ts`, wired into `vite.config.ts`: replay recipes from local originals, validate source confinement/stale baseline, run the existing full-colour gate on staged output, atomically append a candidate and retain recipe/hashes. Test against temporary workspaces in `tools/dev/arcadeArtSave.test.mjs`, never the owner's table. Exact decoder in `src/dev/arcadeArtPng.ts` is checked against original bytes by `tools/dev/arcadeArtPng.test.mjs`.
3. DOM editor in `src/dev/arcadeArtEditor.ts`; extend `dev/gym.html` and CSS; integrate preview canvases into `arcadeGym.ts` without changing runtime selection. Add Undo/reset/draft recovery and clear save status.
4. Focused browser proof under `tools/assets/check-arcade-gym-art.mjs`; isolated `ARCADE_EVIDENCE_DIR=preview-renders/mars-arcade/gym-art-tools/`. Exercise failure/retry as well as correct copies; prove original PNGs and all existing clips unchanged.

## Validation and acceptance criteria

**Done when:** The owner can choose Captain idle as a fixed reference; match colors in each region across a clip; sample source/reference pixels; match height, align the body and manually nudge a drawing; see changes in actual frame playback and mirrored view; undo/reset; reload an unsaved local art draft; save a corrected copy and reopen it with identical pixels. Original sources, clips, timing and rules remain unchanged. Invalid/clipped edits and stale saves explain refusal without partial table writes. New copies remain unbound/unreviewed. Focused tests, lint/types/build/full tests, existing gym proof, relevant asset gate and actual 375/768/1440 browser checks pass. Review full diff; report unrun production/hosted coverage plainly.

## Repair loop

Review failures, fix root causes, rerun failed/nearby checks. Bound UI/algorithm repair to three passes per failure; record remaining delta if it stops shrinking. Owner approval is for final artwork/boxes after tools are proven, not inferred from tests or saved copies.

## Evidence and handoff

Initial owner state: `preview-renders/mars-arcade/gym-art-tools/owner-before.json`. Earlier Captain artifacts from plan 0052 remain preserved. Further results are recorded as executed.

Actual results: focused tests 14 pass; `npm run check` lint/types/902 tests in 77 files/build pass; isolated `check-arcade-gym-art.mjs` 14 ok/zero console or page errors; existing fresh gym proof 13 ok/no console errors. Actual validator remains 27/89/82, zero errors/nine review warnings. All 27 pre-tool clips match the baseline, and 119 previous hashes verify. `git diff --check` passes; separate self-review found no remaining critical/high issue. Responsive captures and test-only saved recipe/PNGs are retained in the evidence prefix. Guide/report/TEST_REPORT are current.

## Outcome and handoff

2026-10-05 follow-up: `includeDistant: true` is an explicit palette-only recipe option; old recipes remain byte-equivalent in parsing and replay. Repeated no-op matches add no draft/Undo entry. Reports show changed pixels and tolerance skips. Fresh focused tests 16 pass; full check lint/types/904 tests/77 files/build passes; isolated art browser proof 15 ok with actual gray-highlight/alpha/outside-area assertions, real gated Save/reopen and responsive/reduced-motion paths; existing gym regression 13 ok. Actual validator remains 27/89/82 with 0 errors/9 review warnings; 119 original artifact hashes verify. Cumulative full-diff self-review has no critical/high finding; whitespace checks pass. Evidence/report/TEST_REPORT are current under `gym-shoe-fix` and `mars-arcade-gym-shoe-fix-2026-10-05.md`.

All five Captain jab drawings now have local unsaved shoe-only all-color corrections using idle as reference. The five existing heavy shoe previews already match that palette: independent replay of the all-color operation changes zero pixels and adds no empty step (`heavy-match-readout.json`). The owner continues editing in the same browser, so preserve the latest session draft rather than overwriting it from the initial snapshot. Saved originals remain untouched. Palette snapping fixes skipped gray pixels but can merge highlights into one nearest reference shade; prior shade-preserving replacements may already have flattened outlines. Final visual acceptance remains open, and jab's existing 105px height/1px torso difference was not changed by this shoe-only repair. The tmux pane shows `gym-shoe-fix/live-after.png`. No original-source overwrite, actual-worktree copy Save, combat change, commit or publication occurred.

The requested editing tools are usable in the existing local gym on port 5360. The live Captain cup-heavy has a reversible, unsaved five-drawing preview for height/alignment/three regional palettes, with Captain idle as fixed reference. Both owner looping review settings are restored locally; no table Save adopted art. The actual live editor screenshot refreshes the owned tmux pane `%1`. Existing raw sources and jab/heavy checkpoints remain intact.

Continue owner-directed refinement with `docs/ARCADE_GYM_ART.md`. The tool exposes a remaining 1px body difference instead of violating the foot pivot; it does not redraw anatomy or guarantee professional art automatically. New-copy Save and pose/box review precede combat adoption. Plan 0052 retains the future light-jab replacement and combat work. No commit, publication, hosted preview, general 3D asset check or full production-journey E2E occurred.
