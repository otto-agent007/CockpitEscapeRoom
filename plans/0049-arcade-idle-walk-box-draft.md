# Arcade combat box draft

Owner acceptance: "box feel looks good for now". The 15 revised clips are now
`reviewed: true` for continued work. A subsequent owner request enables both rule defaults
in plan 0050; this plan records the preceding box-only checkpoint.
The pending-review statements below describe the draft checkpoint `d321a21`.

## Purpose

Prepare visible hurtboxes that follow the fighters' head, torso, legs, and extended
arms. A walking foot should remain hittable by a low sweep without making empty air
beside the head hittable by a jab. An arm should not fill the air below it. Keep the
owner's current Oracle walk drawings.

## Current state and scope

Continue from local commit `9d7e649` in `.worktrees/animation-workflow`, branch
`fix/arcade-tooling-continuation`, preview port 5360. The table has 25 clips, 79 frames,
and 72 drawings. Most hurtboxes are one seeded silhouette rectangle. Two Oracle-heavy
frames have stale boxes from other drawings. Bounds and hit stop ship off.

This pass covers 51 frames in 15 clips: all three fighters' idle clips, Booster/Oracle
forward/backward walks, both heavy clips, Oracle jab, Booster special, and both hit/jump
clips. Preserve previously reviewed Booster jab/block and Oracle block; preserve the
cosmetic heavy-block/outcome clips and rejected walk candidate. Captain move art,
projectile boxes, combat tuning, and cabinet integration follow later. Existing attack
boxes are checked without changing their timing or reach.

## Context and constraints

`src/game/marsArcadeAnimations.json` is the only authored table. Boxes face right in
128x128 cells; runtime mirrors around x=64, with floor row 119. `collision` is the gym's
body outline; the engine's separate 24px push width comes from fighter content.
Retain drawings, holds, phases, guards, attacks, tuning, candidates, and default switches.
Revised clips stay `reviewed: false`, including invalidating Oracle heavy's prior sign-off.
Owner box acceptance is required by `.agents/skills/arcade-animation/SKILL.md`; this pass
prepares a reviewable draft and does not claim that acceptance.

## Progress

- [x] 2026-10-03 — Clean worktree verified; arcade/gym both respond on port 5360.
- [x] Baseline table/connect report saved in /tmp; all shipped frame overlays inspected.
- [x] Add regression proving a forward stride can be swept but cannot be jabbed in empty air.
- [x] Author regional hurtboxes; repair Oracle sweep/settle body outlines.
- [x] Pin and explain new optional-bounds connect distances.
- [x] Gym/playground browser proof at 375/768/1440, full checks, independent full-diff review.
- [x] Record evidence and prepare the draft for owner visual judgment.

### Continued combat-pose pass

The owner said "keep going" after the first 25-frame draft passed. Continue with the
remaining unreviewed live combat clips: Booster heavy/special/hit/jump and Oracle
jab/hit/jump (seven clips, 26 frames). Total draft: 15 clips / 51 frames. Preserve the
three previously reviewed clips (Booster jab/block, Oracle block), cosmetic heavy-block
and outcome clips, and the rejected walk candidate. Leave all revised clips unreviewed.

- [x] Inspect and draft the 26 attack/hit/jump frames, including protruding limbs.
- [x] Prove empty air beside an extended arm stays unhittable below the arm.
- [x] Repeat relevant checks and expand the before/draft gallery and browser proof.

This extends the box draft, not combat tuning or switch adoption. The first pass's
49 focused tests, 882 total tests, 13/7/6 gym/playground/bounds checks, and responsive
proof all passed. Independent review found no critical/high issues in that first pass.

## Decisions and discoveries

- Owner accepted the current 51-frame boxes for now; record the review flags without
  inferring acceptance of either optional combat rule. The arcade skill is agent guidance,
  not a workflow the owner must run. Re-run the browser proof with `--accepted`; preserve
  original draft captures and save acceptance captures under `accepted/`.
- 2026-10-03: Draft grounded boxes first, then extend to unreviewed live combat poses
  after the owner's "keep going". Standing/walking uses three regions; crouched sweeps,
  jumps, and outstretched arms need extra regions. Rectangles still approximate a silhouette.
- The Oracle heavy `sweep` hurtbox starts at y=28 although its drawing starts at y=40;
  `settle` also inherits the rise outline. Refit against each current drawing.
- A narrower torso changes connect distances with bounds enabled. Report that delta;
  do not move a strike inward to imitate the old reach-only check.

## Implementation and validation

Edit animation JSON and meaningful regressions in `marsArcadeBoundsRules.test.ts`;
update intended connect pins in `marsArcadeConnect.test.ts`. Use the gym with onion skin,
keyboard stepping, opponent overlays, and the playground with bounds both off and on.
Capture before/after overlays and responsive gym/playground screenshots under
`preview-renders/mars-arcade/box-review-2026-10-03/`.

Run focused Vitest tests, `npm run arcade:validate`, `npm run check`, and browser scripts
`check-arcade-gym.mjs`, `check-arcade-playground.mjs`, `check-arcade-bounds-rules.mjs` with
isolated ARCADE_EVIDENCE_DIR. Check actual hit/miss boundaries mirrored, sweep guard and
jump paths, keyboard edit/undo, invalid/repeated Save, reload, and reduced motion.
Review the full diff and document actual results in an asset report and TEST_REPORT.md.

## Acceptance and repair loop

The targeted boxes fit their drawings' bounding extents, with no Oracle-heavy silhouette
warnings. Regression demonstrates the high-air miss and low-leg hit on both facings.
Existing strike edges/holds/paths and rule defaults remain unchanged. Browser and full
checks pass; no critical/high review findings remain. Drafts remain unreviewed.
At most three repair passes per defect; stop for an actual owner visual/balance choice.

## Evidence and handoff

Final `npm run check`: lint/types, 884 tests / 74 files, production build pass. Focused
animation/bounds/connect tests: 51 pass. The five new regressions failed against their
prior boxes, then passed after authoring. `arcade:validate`: 25 clips / 79 frames / 72
drawings, 0 errors / 22 owner-sign-off warnings. The two silhouette warnings are gone;
Oracle heavy now honestly needs renewed review. Full-diff independent review: no findings.

Final gym/playground/bounds browser scripts pass (13/7/6 ok). `box-draft-proof.mjs`
opens all 51 frames at each of 375/768/1440, checks their regional boxes and review status,
mirror/onion, keyboard edit/undo, four hit/miss boundaries, repeated invalid Save/reload,
reduced motion, default switches, and no overflow/page errors. Its responsive screenshots
are representative captures; the gallery has an individual before/draft image per frame.

Evidence: `preview-renders/mars-arcade/box-review-2026-10-03/`, with baseline JSON,
comparison gallery, 51 pair images, responsive screenshots, and logs. Full data-preservation
assertion passes. `git diff --check` and unchanged-art/tuning/content checks pass.
Report: `asset-reports/mars-arcade-box-draft-2026-10-03.md` and TEST_REPORT.md.

Local preview: http://127.0.0.1:5360/dev/gym.html and /dev/arcade.html. The comparison
gallery is /preview-renders/mars-arcade/box-review-2026-10-03/review.html.
Next: owner box judgment and combat-feel decisions for existing optional switches; then
defense/Captain/projectile work under its own scope. Human gate in the arcade-animation
skill: "box sign-off (the `reviewed` flag); any change to reach, holds or frame data (balance)."
All changed clips remain unreviewed. Hosted preview and production journey E2E were not
run for this dev-only slice. Publication and rule-default adoption remain separate decisions.
