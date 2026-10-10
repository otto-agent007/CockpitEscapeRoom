# Captain's first combat animation

## Purpose

Give Pop T's Captain a readable coffee-cup heavy, replacing the idle drawing that currently stands in for the attack. On 2026-10-04 the owner rejected the free-arm checklist candidate and requested hitting with the coffee cup instead. Preserve that earlier candidate for comparison; revise the source poses so the ceramic cup leads the strike. Begin with a concrete pose sequence for owner review, then use the same sequence in the gym and fight after its art is accepted.

## Current state

Worktree: `/mnt/2TBHDD/CockpitEscapeRoom/.worktrees/animation-workflow`, branch `fix/arcade-tooling-continuation`, starting tip `cd04f17`. The tree was clean on 2026-10-04. The local gym and arcade run on port 5360. Captain has only an idle clip. Booster/Oracle combat boxes are accepted; bounds and hit stop are enabled. Oracle's rejected video walk remains off.

## Scope

Current slice: a five-frame Captain coffee-cup heavy candidate plus the retained palm-jab art, consistent normalized clips, contact-sheet/gym review, provenance and a recoverable art handoff. Following owner pose acceptance: author/review the heavy boxes and wire combat presentation with focused unit and actual-browser proof. The owner approved replacing the light composure action with a jab; propose/review its frame data before that control/rules change. Walk, guard, jump, reactions, flyby and outcomes follow as separate slices.

## Context and constraints

Use `.agents/skills/arcade-animation/SKILL.md`, the existing Captain anchor and identity reference, and `asset-reports/mars-arcade-frame-prompt-pack.md`. Preserve Pop T's face, uniform, cap, proportions, strict right-facing profile, level coffee and unhurried dignity. Keep the locked source scale 13.990384615384615, 128×128 RGBA cells, pivot column 64 and baseline row 119. The existing heavy uses 9 startup, 3 active and 11 recovery frames, reach 36, and its existing damage/stun values. No retuning or production integration. Display saved references and candidates through the owner's custom tmux sidepane helper. No commit or remote publication is included.

## Progress

- [x] 2026-10-05 — Corrected jab/cup-heavy copies accepted by the owner: “Looks consistent; keep this art candidate.” Ten saved cells match idle height and regional palettes; both audits and actual playback/reload/mirrored/responsive checks pass. Artifacts, recipes and the separate review table are retained; boxes/combat remain pending.
- [x] 2026-10-04 — Prepared consistency-v3 for owner review: four source edits use the same fixed jab/anchor appearance references; all five heavy cells pass, both audits pass, full checks/gym proof pass. Compared idle/jab/previous/revised in tmux and proved actual playback/both facings/three widths. Combined visual acceptance remains pending.
- [x] 2026-10-04 — Revised the heavy to a coffee-cup strike and retained palm art as `jab-candidate`. Corrected the owner-caught duplicate arm in every selected cup pose; all five cells pass gate/audit, new contact sheet displayed, native playback and three screen widths verified, full checks pass.
- [x] 2026-10-04 — Verified current branch, clean tree, saved checkpoint, anchor, prompt pack, timing and live preview. Displayed the source anchor in the tmux pane.
- [x] 2026-10-04 — Generated and inspected source candidates; selected three new drawings, reused the ready pose on retract, and selected the existing idle for the ending.
- [x] 2026-10-04 — Five playback cells pass the unchanged gate and continuity audit; the selected contact sheet is displayed in the same tmux pane.
- [x] 2026-10-04 — Added an unbound, unreviewed gym candidate at 5/4/3/5/6 holds; verified playback and mirrored/responsive views. Full project checks and gym proof pass.
- [x] 2026-10-04 — Saved prompts, raw attempts, generation/selection metadata, 44 artifact hashes, reports, logs and remaining delta.
- [x] Obtain owner pose acceptance from the contact sheet and gym — 2026-10-05 corrected copies only; earlier source waves remain unadopted.
- [ ] After acceptance, wire/authenticate the clip in the gym and combat presentation and complete relevant proofs.
- [ ] Propose/review final jab frame data, replace the light composure action as authorized, and prove that control/rules change after the relevant pose/box gates.

## Discoveries

- Consistency-v3 brings navy and boot shading closer to the jab. At unchanged locked scale, active height is 105, other heavy poses 106; head widths 32 versus jab 31 and idle height 104. Both audits pass but these visual deltas and the idle transition still need owner judgment. Source patch medians are diagnostic only, not a new palette gate. The owner's only unsaved gym-table edit was heavy looping; it was captured without a Save POST and restored locally after proof.
- 2026-10-04 — Raw-source patch medians confirm appearance drift before normalization: jab trousers [20,40,70] versus heavy [28,74,128], cap [28,53,92] versus [28,73,126], skin [254,201,142] versus [254,200,152]. The heavy's consecutive source edits used earlier heavy output as their only appearance reference; the original jab/anchor was absent from later calls. Fix at source with fixed appearance references, preserving alpha and the approved cup motion. No palette quantization or new validator threshold.
- Coffee-heavy selected sources contain four distinct new drawings across five slots. Recovery reuses the lift drawing; a newly generated lower-cup ending keeps cup-hand ownership consistent. All selected poses show one near arm/hand, far arm hidden. The unchanged locked scale gives 106px height/32px head versus the existing idle's 104/31, and blues read lighter; owner visual review and the idle transition remain open.
- Captain's source anchor is 1024×1536 RGB on magenta; the runtime anchor is a cleaned 128×128 RGBA cell. The source standing figure is 1455 pixels high, which sets the locked scale.
- The sprite selector deliberately excludes Captain from the authored combat paths. Merely adding a move clip to the table will not make it play; its presentation path needs a focused follow-up after pose acceptance.
- Narrow negative spaces in the neckline and between the bent arm and cup produced small enclosed gaps after downsampling. Source corrections fixed the selected startup and active drawings. Independent recovery attempts still failed after three generations; they remain rejected. Reusing the ready pose gives a valid return beat.
- The final existing-idle frame is one pixel shorter and its torso is one pixel farther back than the new drawings. The audit passes; the owner should inspect this settled transition. The active art reaches 35 pixels ahead of the pivot, within the existing reach-36 tolerance.

## Decision log

- 2026-10-05 — Owner accepted the appearance shown in `captain-gym-consistency-2026-10-05/corrected-sequences.png`. Keep corrected copies `captain:jab-candidate-art-4ddcbf2f` and `captain:heavy-candidate-art-e8899500`. Their `reviewed` flags stay false because those flags certify boxes. No approval for jab balance data or combat binding is inferred.
- 2026-10-05 — The owner resumed work after the proposed jab/heavy color, height and alignment scope. Prepare a bounded candidate using the existing correction tools. Preserve all originals and the historical draft; avoid reloading the owner's existing gym because its unsaved table state is not automatically recovered. Use a separate review copy/server until visual acceptance. No new generation, timing, balance or combat binding is part of this pass.
- 2026-10-04 — Owner still declines consistency-v3: shoe/hat/trouser colors vary in the jab and heavy, heavy height differs, and the body moves off center. Continue via the requested in-gym correction tools in `plans/0053-gym-art-corrections.md`, not another blind generation wave. Both art candidates and the approved future light-jab replacement remain pending their visual/box/balance gates.
- 2026-10-04 — Owner feedback: “the color/character consistency is not there between the jab and heavy animations.” Treat the existing jab and canonical Captain as fixed appearance authority. Heavy wave v2 is retained but declined for adoption; consistency wave v3 changes source appearance, keeping cup motion, corrected one-arm anatomy, 9/3/11 holds, reach 36 and existing jab art. No combat binding until the combined visual review passes.
- 2026-10-04 — Owner correction supersedes the free-arm strike brief: “I'd prefer his heavy be hitting with the coffee cup instead.” Use a short cup wind-up, a forward ceramic-cup hit and return to idle. Keep 9/3/11 timing, reach 36 and combat tuning. Source/evidence wave is `coffee-heavy-v2`; the earlier checklist wave remains intact and unapproved.
- 2026-10-04 — Owner offered the earlier palm strike for Captain's jab. Preserve its art as a jab candidate rather than discard it. Prior heavy holds/boxes are not jab authority; the existing light is a non-damaging composure action (6 startup, 0 active, 10 recovery), so agree on the jab's frame data and composure control before binding a new melee move.
- 2026-10-04 — Owner chose to replace the existing light composure action with the palm jab. This authorizes the control change; exact jab frame data remains a follow-up balance gate with a concrete proposal.
- 2026-10-04 — Owner caught two right arms in the cup draft. Reject that anatomy across the entire wave. Revised profile shows one cup-bearing near arm; the far arm is fully hidden by the torso. Regenerate source art, never patch runtime pixels. Keep the same arm holding the cup through preparation, impact and return.
- 2026-10-04 — Follow the owner's agreement to animate Captain, starting with the checklist move recommended in the preceding review. Use the already written five-pose brief; leave coffee in the other hand and use the free arm for the strike.
- 2026-10-04 — Treat new art as a candidate until pose and box review. The arcade-animation skill explicitly lists pose acceptance and box sign-off as human gates.
- 2026-10-04 — The gym candidate deliberately has no `moveId` or attack box. It is not selectable by the combat lookup or optional override list, so adding it does not adopt art or change hit behavior. Its body/hurt boxes remain machine-seeded and unreviewed.
- 2026-10-04 — Five playback frames do not imply five unique drawings: the selected ready drawing is repeated for recovery, and the exact existing idle ends the clip. This is recorded in the generation metadata and comparison.

## Milestones

1. The owner can compare all five poses to the existing Captain anchor in one persistent tmux contact sheet.
2. Accepted poses become a gym clip with accurate holds and boxes.
3. The actual fight plays anticipation, strike and recovery from both facings, including hit, block and whiff, without altering unrelated combat.

## Implementation steps

Current prompts/raw outputs/provenance: `art-source/arcade/captain/generated/consistency-v3/`. Normalize all five `coffeeHeavy-00..04.png` sources together with `normalise-arcade-clip.py`, locked scale, `--source-alpha --align feet --resample bilinear`. Final cells/report: `normalised-consistency-v3-candidate-ready/heavy-candidate/`. Gate with `check-popt-frames-fullcolour.py`; wire unbound to the gym and audit with `audit-arcade-clip.py`. Current owner sheet/evidence: `preview-renders/mars-arcade/captain-consistency-v3/`. Report: `asset-reports/mars-arcade-captain-consistency-2026-10-04.md` plus SHA manifest and `TEST_REPORT.md`. The earlier `checklist-v1` palm-jab and appearance-declined `coffee-heavy-v2` checkpoints remain saved.

After pose acceptance, use `arcade-anim.mjs wire` with `captain.runTheChecklist` and startup/startup/active/recovery/recovery phases; split holds 5/4/3/5/6. Author the striking-surface box at reach 36 and regional hurt boxes in the gym. Keep its reviewed flag false until box sign-off. Extend Captain's sprite selection only for authored clips, retaining existing missing-pose fallbacks.

## Validation plan

For art: inspect identity, anatomy, opaque white uniform/cup, strict profile, stable head/body/feet and reach; run the sprite gate without weakening thresholds. For integration: meaningful selector/phase and mirrored box regressions, `npm run arcade:validate`, `npm run check`, and relevant browser proofs with isolated `ARCADE_EVIDENCE_DIR`. Exercise keyboard/native inputs, pause/step/reset/reload, reduced motion, missing-art fallback, and 375/768/1440 layouts. Review the full diff.

## Acceptance criteria

The candidate phase has five playback slots with reuse declared, reproducible normalization, an owner-visible contact sheet, exact prompt/provenance and candid remaining delta. Final heavy acceptance requires owner pose/box review, accurate 9/3/11 holds, actual startup/active/recovery playback without the anchor placeholder, both facings, valid attack/hurt bounds and passing relevant checks. Jab integration requires agreed new frame data plus the approved replacement light control and its proof.

## Repair loop and stop conditions

Bound art to three substantive correction rounds. Repair root causes and retain rejected candidates. Stop at an explicit owner art/box decision or after the bounded attempts, recording the unresolved delta rather than shipping failed art.

## Evidence

Starting state: clean worktree at `cd04f17`; 25 clips/79 frames/72 drawings, validator 0 errors/7 existing warnings in the preceding review. Source anchor displayed by `image-pane.sh show`; helper reported pane `%1` updated.

Current evidence: `preview-renders/mars-arcade/captain-checklist-v1/`. The gate passes 5 cells; the sequence audit passes 5 playback frames / 23 ticks. `npm run arcade:validate` reports 26 clips / 84 frames / 77 paths, 0 errors / 8 review warnings. `npm run check` passes lint, types, 888 tests / 74 files and build. Gym browser proof: 13 ok. Visible candidate playback reaches the existing idle; frame data matches 5/4/3/5/6, reviewed remains false, and captured 1440/mirrored-768/375 layouts have no overflow. Existing 25 clips compare exactly against the initial JSON. Source/prompt manifest validation passes; the SHA-256 file covers 44 source/normalization artifacts. Full diff review finds no critical/high issues; `git diff --check` passes.

## Outcome and handoff

Latest continuation, 2026-10-05: the owner accepted the corrected jab and coffee-heavy appearance. Permanent candidate folders are `art-source/arcade/captain/gym-edits/4ddcbf2f-cbfd-4c05-b99a-48ba2ec0d175/` and `gym-edits/e8899500-bf4d-4c22-9694-a1eacbedbda7/`. The live review gym is `http://127.0.0.1:5362/dev/gym.html`, rooted at `.cache/captain-consistency-review-20261005`; the original gym/arcade remain on 5360. The review copy has 29 clips/99 frames/92 drawings, zero errors/11 box-review warnings. The actual worktree retains its original 27-clip table byte-for-byte to avoid reloading unsaved owner settings; the complete review table is saved as `preview-renders/mars-arcade/captain-gym-consistency-2026-10-05/review-table.json`. Ten corrected drawings plus replay recipes/gate output and explicit appearance acceptance are saved. Both sequence audits pass; nine independent artifact/browser checks pass with zero console/page errors, three widths, both facings, all five poses/23 ticks, keyboard and reduced motion. `npm run check` passes lint/types/904 tests in 77 files/build. The active heavy keeps the disclosed 1px torso difference to preserve foot alignment. Next work is heavy boxes/sign-off and agreed jab frame data, then authored combat presentation. No commit, publication, balance change or combat adoption occurred.

The following handoff records the earlier, appearance-declined source wave and remains historical:

The appearance-revised coffee-heavy is ready for combined jab/heavy consistency review in the tmux comparison and live gym's `captain · heavy-candidate` clip; unchanged palm art is `captain · jab-candidate`. Both are unbound/unreviewed and cannot enter combat. Latest consistency-v3 proof: gate 5/0; both audits pass; validator 27 clips/89 frames/82 drawings, 0 errors/9 warnings; full check 888 tests/74 files plus lint/types/build; fresh gym proof 13 ok/zero console errors. Actual playback reaches lower-cup at tick 22; active captures cover 1440/mirrored768/375 without overflow. All 25 original clips match HEAD and jab matches its pre-repair snapshot. Four generation records/selected copies validate and source/normalization artifacts are hashed. Prior 44/52-artifact manifests still verify. Full diff review found no critical/high issue for this unadopted candidate checkpoint.

After pose acceptance, author actual heavy boxes and add a focused Captain sprite-selection path; test both facings, hit/block/whiff, missing art and reduced motion, then obtain box sign-off. Propose exact palm-jab frame data and implement the approved light replacement with relevant proof. The new lower-cup ending is not an approved idle replacement; inspect its transition and recorded size/shading differences. No commit, publication, hosted preview or production integration occurred.
