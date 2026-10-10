# Captain jab/heavy appearance repair — 2026-10-04

Owner disposition: still declined for remaining shoe/hat/trouser color, heavy height and body-position variation. The owner requested direct correction tools in the gym; active follow-up is plan 0053. This wave remains preserved and unadopted.

## Owner brief and root cause

The owner accepts the corrected coffee-cup hit but says color/character consistency is missing between jab and heavy. Preserve cup motion and the palm-jab choice. The existing palm art and Captain anchor are the fixed appearance references; the brighter v2 heavy is retained for comparison.

The mismatch is already in raw source art, before the unchanged normalizer runs. Sampled source patch medians: jab trousers [20,40,70], cap [28,53,92], skin [254,201,142]; v2 heavy [28,74,128], [28,73,126], [254,200,152]. Boots also became pale grey and the normalized figure grew from the jab's 105 to 106 pixels. Later v2 edits used previous heavy output alone, propagating drift. The repair supplies the fixed jab/anchor references in every generation, including corrections.

## Bounded source repair

Built-in Codex `image_gen`, identity-preserving edits only. Source wave: `art-source/arcade/captain/generated/consistency-v3/`; exact prompts and `generation.json` record all outputs/references. No manual pixel editing, palette quantization, new palette gate, dependency, validator threshold or fighter-scale changes.

Repaired active pose: source patch medians trousers [17,34,61], cap [22,48,86], skin [254,200,147]; closer to the jab reference, without claiming exact palette identity. The fixed appearance references accompany all four generation calls: strike, lift, draw back and lower. Five playback slots reuse lift on retract. The far arm stays hidden; the mug remains in the same visible hand.

Normalize the five selected sources together at locked scale 13.990384615384615, source alpha, feet alignment and explicit bilinear sampling. No nudges, clipping, individual resizing or manual edits. Final cells and reproduction report: `art-source/arcade/captain/normalised-consistency-v3-candidate-ready/heavy-candidate/`.

## Validation actually run

- Full-colour gate: **5 cells, 0 failures**, unchanged contract.
- Both Captain candidate continuity audits **pass**. Heavy: 23 ticks; all bottoms 119, head widths 32. Lift/draw/retract/lower measure height 106, strike 105; torso backs 52–53. Audit offsets are at most one pixel in each axis. These tolerances are not owner visual acceptance.
- `npm run arcade:validate`: **27 clips / 89 frames / 82 drawings, 0 errors / 9 warnings**. Seven existing warnings plus the two unreviewed Captain candidates.
- `npm run check`: lint, types, **888 tests / 74 files**, build **pass**. Actual log: `check.log` in the evidence prefix.
- Fresh-context `check-arcade-gym.mjs`: **13 ok, no console errors**, with isolated evidence. Keyboard frame step/nudge/undo, overlay drawing, actual holds, invalid Save refusal and fit-to-baseline are covered by that existing proof.
- Visible local gym: cup sequence plays to `lower-cup` at tick 22. Every source, phase and hold matches the table; reviewed false. Captures cover 1440, mirrored 768 and 375, with no horizontal overflow. At 1440 the gym is left on the cup strike. The owner's only unsaved table edit, heavy `loop`, was captured and restored **locally**, without posting Save. The disk table remains `once`.
- Data/provenance review: all **25 original clips equal HEAD**, jab equals the pre-repair snapshot, and heavy changes only source paths and re-seeded collision/hurt boxes. Holds, phases, poses, loop, tuning, reach and controls are unchanged; no attack boxes or move binding. All four raw outputs, exact prompts and references exist; selected-source copies and repeated lift are byte-identical to their declared generation.
- Full diff review finds no critical/high issue for this unadopted candidate; `git diff --check` passes. SHA-256 manifests cover source/normalization artifacts; earlier v1/v2 manifests verify as well.

## Scope and pending review

Jab and current idle art remain unchanged. Heavy timing 9/3/11, reach 36 and combat/tuning/selection remain unchanged; candidates have no combat binding and remain unreviewed. The owner-approved future light-jab replacement still needs final frame data, boxes and combat proof. This repair slice stops at a combined visual consistency review before adoption.

Current comparison: `preview-renders/mars-arcade/captain-consistency-v3/appearance-comparison.png`, showing existing idle, palm jab, previous cup-heavy and revised cup-heavy. The custom tmux helper refreshed owned pane `%1`; this is a pane update, not owner acceptance. `sequence-review.png` compares the original jab with all five heavy playback cells. Both sheets enlarge unmodified runtime pixels for review. Audit, browser captures, local-state snapshots and actual logs share that evidence prefix.

The heavy is visibly closer in navy, skin and boots. A one-pixel head-width difference remains from the jab (32 versus 31), and most heavy cells remain one pixel taller than the jab (106 versus 105); existing idle is 104 high. The idle transition and combined appearance still require owner judgment. Seeded boxes are not signed off. No combat or production-journey proof, hosted preview, commit, publication or production integration occurred.
