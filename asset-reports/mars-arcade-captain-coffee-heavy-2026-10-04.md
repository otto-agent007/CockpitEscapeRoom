# Captain coffee-cup heavy revision — 2026-10-04

Owner disposition: cup-hit motion and corrected arm layout accepted, but jab/heavy color and character consistency declined. This v2 appearance is retained as the comparison baseline; the `consistency-v3` source repair is current. Combat adoption remains pending.

## Owner brief and scope

The owner asked for Captain's heavy to hit with the coffee cup. The earlier palm/forearm artwork is retained as `captain:jab-candidate`, and the owner chose to replace the light composure action with that jab. Both clips remain candidates pending their applicable pose, box and frame-data gates. This slice revises the heavy's art, preserving its existing reach 36 and 9/3/11 timing.

## Anatomy correction

The first cup strike incorrectly attached both an extended arm and a hanging arm to the same near-side shoulder. The owner caught this in the tmux sidepane. Those sources are rejected, including the first startup pair. The revised profile has only one visible cup-bearing arm and hand; the far arm is occluded by the torso. Preparation, strike and return derive from that corrected reference to preserve cup-hand ownership throughout.

Raw outputs, exact prompts and provenance are in `art-source/arcade/captain/generated/coffee-heavy-v2/`. Built-in Codex `image_gen` only; no fallback API, dependency or hand-painted runtime pixels. All nine calls are recorded in `generation.json`. The original active source failed one alpha speck at (63,114) after normalization. A boot-gap source correction passed that gate but still had the anatomy error; it is not selected. `coffee-strike-attempt-02.png` corrects anatomy. The tight wind-up needed a final source correction for a one-pixel pocket at (62,95) between the inner legs. Rejected sources/normalizations remain saved; no gate threshold changed.

## Result and contract

`captain:heavy-candidate` has five playback cells at holds 5/4/3/5/6 (9 startup / 3 active / 11 recovery). Four distinct new drawings: lift, draw back, cup strike and lower cup; recovery reuses lift. The newly drawn ending keeps the same arm holding the cup. Captain's existing runtime idle is unchanged. `captain:jab-candidate` retains the original palm sequence and preview holds; those holds are not final jab frame data.

Locked source scale 13.990384615384615, 128×128 RGBA cells, baseline row 119 and pivot column 64. Source alpha, one feet alignment for the clip and explicit bilinear sampling. The existing normalizer report establishes bilinear for the earlier checklist checkpoint as well; its report/provenance description and hashes were corrected to match that actual setting.

## Validation actually run

- Full-colour sprite gate: **5 cells, 0 failures**, unchanged contract.
- Continuity audit: **both Captain candidates pass**, each 5 playback cells / 23 preview ticks. The coffee-heavy cells all have height 106, baseline 119, head width 32 and torso-back 52.5–53. Cup-strike/retract shifts are +1/-1 horizontally, zero vertically. The active opaque extent is column 98, 35 ahead of the pivot, within reach-36 tolerance.
- `npm run arcade:validate`: **27 clips / 89 frames / 82 paths, 0 errors / 9 warnings**. Seven pre-existing warnings plus the two unreviewed Captain candidates.
- `npm run check`: lint/types, **888 tests / 74 files**, build pass. `check.log` is saved.
- Existing fresh-context gym browser proof: **13 ok**, including keyboard step/nudge/undo, onion/opponent overlays, actual holds, invalid Save refusal and fitted-body baseline; **no console errors**. `gym-check.log` and isolated captures are saved.
- Visible browser: all five new frame labels/phases/holds match the table, reviewed false; actual playback reaches `lower-cup`. Captures show both active strike and lower-cup return at 1440, mirrored 768 and 375. No horizontal overflow at those widths. No Save action approved art/boxes or rewrote the table. The owner's gym controls may use a local looping preview; the saved table remains `once`.
- Full application-data review: all **25 original clips compare exactly to HEAD**. Only two added, unbound Captain candidates; no moveId or attack boxes, no combat/tuning/selector change. Generation outputs, prompts and references exist; the repeated lift source is byte-identical. Artifact SHA-256 manifest saved beside this report.

Evidence: `preview-renders/mars-arcade/captain-coffee-heavy-v2/`. The complete contact sheet is displayed in the reused tmux pane `%1`; the live gym on port 5360 is parked on the cup strike.

## Remaining delta and visual review

Owner pose acceptance and combat box sign-off remain required by `.agents/skills/arcade-animation/SKILL.md`. The new sequence has one visible cup-bearing arm throughout. Its new drawings measure 106 pixels high with 32-pixel heads versus the existing idle's 104/31; blue shading also reads lighter in the comparison. These are recorded visual deltas at the unchanged locked scale. Inspect the transition to the existing idle before combat adoption; the new ending is not an approved idle replacement.

After pose acceptance, author regional hurt/body and ceramic striking-surface boxes, bind the heavy and extend Captain's authored sprite path. The owner approved replacing the light composure action with the palm jab, but final jab frame data needs a concrete balance proposal and its relevant proof. Both candidates remain `reviewed:false` and unreachable through combat lookup. No commit, push, hosted preview, production-journey E2E or production integration occurred.
