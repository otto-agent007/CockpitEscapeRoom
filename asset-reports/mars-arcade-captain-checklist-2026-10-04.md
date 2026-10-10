# Captain checklist pose candidate — 2026-10-04

Owner update: the owner requested coffee-cup contact for the heavy, then offered this palm strike for the jab. Its source/evidence is retained; the live table now calls it `captain:jab-candidate`. Original preview holds remain 5/4/3/5/6 and do not establish a new jab's frame data. It is unbound/unreviewed. The remainder records the initial checkpoint before this correction.

## Result

Captain has a five-frame checklist pose candidate in the character gym, named `captain:heavy-candidate`. It uses startup holds 5/4, active hold 3 and recovery holds 5/6: the existing move's 9/3/11 rhythm. It is not bound to a combat move, carries no attack box and remains unreviewed. All 25 existing clips, fighter rules, tuning and sprite selection are unchanged.

The owner-visible comparison is `preview-renders/mars-arcade/captain-checklist-v1/pose-review.png`, displayed in the existing tmux pane `%1` with the custom `displaying-images-in-tmux` helper. The live gym on port 5360 is left on the candidate's active pose. Pose acceptance and subsequent box sign-off remain required by `.agents/skills/arcade-animation/SKILL.md`.

## Sources and generation

Built-in Codex `image_gen`; no fallback API, dependency or external source was introduced. The project-owned Captain source anchor is `art-source/arcade/captain/generated/anchor-00.png`; the accepted runtime idle is `art-source/arcade/captain/normalised-clean/anchor/anchor-00.png`. New sources, exact prompts, raw attempts, correction references and selection metadata are in `art-source/arcade/captain/generated/checklist-v1/`. `generation.json` records the tool's original output paths and each prompt file.

The prompt keeps his specific face, cap, uniform, right-facing profile, planted stance, calm expression and level plain coffee. The first two source drawings raise the free palm and draw the arm back; the active drawing extends an economical flat-palm/forearm strike. Recovery reuses the ready drawing, then returns to the exact existing idle. There are five playback frames and four distinct selected drawings: three new drawings plus the existing idle. This reuse is explicit, not five independently generated poses.

## Normalization and repair evidence

The existing clip normalizer runs at the locked Captain scale **13.990384615384615**, with source alpha, feet alignment and the normalizer's recorded bilinear sampling. Outputs are 128×128 RGBA, baseline 119 and foot midpoint at pivot column 64. The final frame copies the existing idle's bytes rather than redrawing it. `normalise-report.json` covers the four normalized source slots; `generation.json` records the additional existing-idle reuse.

The initial active pose and its first collar correction failed the unchanged gate on one enclosed transparent pixel. Initial bilinear trials also failed; source geometry corrections pass with the final report's bilinear sampling. Startup drawings needed the same neckline correction and clear spacing around the folded arm. Independent recovery attempts still failed on small enclosed gaps after three generations; they remain saved, including the final failed source as `recovery-return-attempt-02.png`. The validated ready pose is reused for the retract beat. The generated settle attempt was rejected for an ambiguous arm connection; the existing idle provides the ending. No generated cell was patched by hand and no validator threshold changed.

## Validation actually run

- `check-popt-frames-fullcolour.py ... --standing-clip heavy-candidate`: **5 frames, 0 failures**.
- `audit-arcade-clip.py captain:heavy-candidate`: **pass**, five playback frames, 23 ticks. Bottom row is 119 throughout. First four frames have height 105 and torso back 52; the existing idle has height 104 and torso back 51. The settled transition measures +1/-1 pixel in the audit. Inspect that transition during pose review.
- Active drawing's furthest opaque column is 98: **35 pixels ahead of the pivot**, within the existing reach-36 tolerance. An attack box is deliberately deferred to the accepted art stage.
- `npm run arcade:validate`: **26 clips / 84 frames / 77 referenced paths, 0 errors / 8 warnings**. Seven are existing review warnings; the eighth is the new candidate's seeded, unreviewed boxes.
- `npm run check`: lint, types, **888 tests / 74 files**, production build pass.
- `check-arcade-gym.mjs` on port 5360: **13 ok**, including keyboard step/nudge/undo, playback, overlays, invalid Save refusal and body fit at 1440/768; no console errors.
- Visible-browser candidate review: all five named poses and holds agree with the table; Play parks on `settle-to-idle`; reviewed remains false and status remains saved. Captures at 1440, mirrored 768 and 375; no horizontal page overflow. No Save action was used to approve boxes or art.
- Full diff review: the only application-data change is one added candidate with no `moveId`. Existing clip JSON compares exactly to the pre-change file. No attack boxes, timing/balance changes, new runtime selection or production integration were introduced.

Logs and captures are isolated under `preview-renders/mars-arcade/captain-checklist-v1/`. No hosted preview, production journey E2E, or final combat integration was run for this pose-review slice.

## Remaining delta

Owner judgment on the pose sequence, including the reuse/idle transition. Seeded body/hurt boxes are broad starting points; they are not accepted combat regions. After pose acceptance, author regional boxes and a striking-surface box, validate the move binding and Captain selector path, prove mirrored hit/block/whiff and reduced-motion behavior in the fight, then obtain box sign-off. Captain walk/guard/coffee/jump/reactions/flyby/outcomes remain separate future slices.
