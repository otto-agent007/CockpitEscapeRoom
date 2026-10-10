# CockpitEscapeRoom lesson log

Use the entries relevant to the current task before making changes or retrying. After meaningful owner feedback or a confirmed root cause, add or update the smallest useful entry. Each entry needs a symptom, cause or labelled hypothesis, evidence, and a concrete prevention check. Detailed attempt history stays in plans and reports. These are dated findings with stated scope; recheck facts that can change.

## Mars arcade animation and gym

Recorded 2026-10-05 from the Captain animation and gym correction work. Current decisions and approval status come from the latest dated records in [plan 0052](../plans/0052-captain-checklist-animation.md) and [plan 0053](../plans/0053-gym-art-corrections.md). Read the [gym guide](ARCADE_GYM_ART.md) for actual controls.

### Owner decisions to preserve

- Captain's heavy hits with the coffee cup. The earlier palm strike is the jab candidate.
- Replace light composure with the approved palm jab:6/3/10, damage5/chip1/reach34. As of2026-10-06, owner-approved jab and coffee-heavy boxes are adopted and combat-verified. Full-set animation work remains open in [plan0055](../plans/0055-captain-complete-animation-set.md).
- The cup-heavy has one visible near arm holding the cup; its far arm is hidden by the torso. The duplicate-right-arm drawing was rejected.
- Generated consistency candidates remain visually unapproved. Corrected copies remain unbound and unreviewed until the relevant art and box decisions are made.
- Keep the owned tmux picture pane current for visual review. A pane update does not establish owner acceptance.

### Prevention checks

| Observed problem and cause | Check before the next attempt | Evidence |
| --- | --- | --- |
| Duplicate right arms in the cup strike. The generated anatomy did not preserve the selected profile pose. | Inspect every pose for arm/hand count, ownership and cup continuity before proposing the sequence. Keep the accepted near-arm/far-arm arrangement in the source brief. | [Captain decisions and attempts](../plans/0052-captain-checklist-animation.md) |
| Jab and heavy changed shoe, hat and trouser colors and proportions despite generation prompts. Prompt consistency did not produce visual consistency. | Compare every drawing and actual playback against the same original Captain anchor. Check colors, face, cap, shoe shading, height and body position across both clips. Name remaining differences. | [Owner-declined consistency candidate](../asset-reports/mars-arcade-captain-consistency-2026-10-04.md) |
| The heavy looked taller and moved off center. Separate generated poses drifted, and an extended striking arm changes the full bounding box. | Keep the locked source scale and established resampling policy. Measure body alignment from the torso, compare actual frames and mirrored playback, and inspect planted feet independently of an extended hand or cup. | [Source scale and bilinear policy](../art-source/arcade/README.md), [gym alignment findings](../plans/0053-gym-art-corrections.md) |
| Exact torso alignment moved the active heavy's foot midpoint to 62.5, failing the existing pivot gate. Body and foot alignment can conflict within a pose. | Preserve baseline 119 and foot pivot 64 within 1px. Show residual torso differences; do not weaken the gate to hide them. Manual nudges still require gate and sequence checks. | [Alignment decision](../plans/0053-gym-art-corrections.md), [sprite contract](../asset-reports/mars-arcade-sprite-contract.json) |
| Lighter gray shoe pixels survived repeated palette matches. RGB distance exceeded tolerance 45; the status still implied a useful update. | Inspect actual changed/skipped pixels. For a tightly selected material area, explicitly use all-color matching when distant colors must change. Repeat a no-op without appending an empty recipe or Undo step. | [Reproduced shoe failure and fix](../asset-reports/mars-arcade-gym-shoe-fix-2026-10-05.md), [pixel regression tests](../src/dev/arcadeArt.test.ts) |
| Preset color rectangles include neighboring materials: the shoe preset includes cuffs. Repeated shade-preserving replacements can raise dark outlines; nearest-palette mapping can merge highlights. | Inspect the yellow rectangle and protect adjacent materials. Compare corrected pixels against originals after each effective step. If detail was already lost, undo or rebuild the relevant recipe from preserved originals rather than stacking the same operation. This remains a visual limitation, not a solved anatomy/shading problem. | [Gym guide](ARCADE_GYM_ART.md), [shoe repair limitations](../asset-reports/mars-arcade-gym-shoe-fix-2026-10-05.md) |
| Preview and saved pixels differed. Canvas decoding rounds translucent RGB values. | Decode source PNG bytes exactly, preserve alpha, and compare corrected preview with saved/reopened pixels. A visually similar screenshot alone does not prove pixel equality. | [Decoder tests](../tools/dev/arcadeArtPng.test.mjs), [actual save/reopen browser proof](../tools/assets/check-arcade-gym-art.mjs) |
| Local table edits could alter the optimistic save baseline through shared references, or a successful normal Save could leave that baseline stale. | Clone the disk baseline independently; advance it after successful normal or corrected-copy Save. Verify local review edits survive a copy Save without silently writing them to original clips. | [Save-baseline findings](../plans/0053-gym-art-corrections.md), [save tests](../tools/dev/arcadeArtSave.test.mjs), [browser proof](../tools/assets/check-arcade-gym-art.mjs) |
| Code reloads recover art recipes and selection but do not imply recovery of unsaved timing, boxes or loop preferences. The owner can continue editing after a snapshot. | Preserve and verify each kind of live state before a reload or source change. Use the latest draft; an earlier backup must not overwrite newer owner edits. Automatic recovery of all timing/box settings remains a separate gap. | [Original owner-state capture](../plans/0053-gym-art-corrections.md), [live handoff](../asset-reports/mars-arcade-gym-shoe-fix-2026-10-05.md) |
| Sprite gates and tests passed while the owner still rejected consistency and polish. Automated geometry checks do not evaluate all visual qualities. | Show comparable frame sheets and real gym playback, refresh the owned pane, and keep explicit visual differences and approval status in the plan. Do not bind candidates to combat on the strength of passing tests. | [Captain review gates](../plans/0052-captain-checklist-animation.md), [arcade animation skill](../.agents/skills/arcade-animation/SKILL.md) |

## Recording future lessons

Add a scoped entry when it changes a future decision or check. Include a source link and distinguish verified causes from hypotheses. When the same mistake recurs, identify why the prior check failed to prevent it and strengthen that check. Prefer an existing behavioral test for a repeatable software bug; visual review remains necessary for anatomy and art quality. Keep owner decisions and unresolved gaps current in the plan, and leave historical evidence intact.

### 2026-10-06 prevention checks

- A raised jab palm occupied head rows and inflated an automatically fitted head hurtbox across empty space. Fit the head within its own horizontal region and show the overlay before box review. Evidence: accepted jab box sheet in plan0055.
- Legacy zero-damage composure tuning would turn the new jab into a silent no-damage attack. Validate legacy input first, then migrate only Captain light to schema3 defaults; preserve unrelated tuning and deliberate schema3zero damage. Regression: marsArcadeCaptainJab.test.ts.
- Optional missing backdrop layers produced no console error in a review fixture. Assert actual rendered layer paths as well as load/error status. Both actual attack proofs now assert all5 layers.
- A brace source was prematurely labelled passed before its failed tiny-hole result was inspected. Record gate status only after checking exit/results; preserve failures and repair source geometry without weakening alpha thresholds. Brace00/01/02 remain rejected; brace03 now passes.
- Relative source roots were reused while cwd was the review fixture, causing a copy refusal. Use absolute actual/review roots, assert cwd/source existence and stop on failure before table mutations. This is a command-construction error, not a missing-art defect.
- The first walking cycle passed pixel/alignment audits but the owner rejected its stride. Numerical gates do not judge natural movement. Use alternating contact/passing poses, inspect full looping playback and request owner art review before adoption.
- A continuity proof assumed Restart unpaused the arcade and mistimed interruption using Captain heavy startup instead of Booster startup. Read actual paused state and move data when setting up browser evidence; preserve the existing restart behavior. The corrected12-case proof passes.
# Reference-check isolation (2026-10-06)

`npm run references:check` also regenerates/saves the reference-only Blender board,
even with `--check`. Inspect the command and snapshot that board before invoking
it during a 2D art task; run in a disposable fixture when no Blender source change
is intended. This run retained the check output and restored the previously clean
board from the exact Git LFS object hash. With read-only Git metadata, read checks
that invoke the LFS clean filter need a writable scratch `lfs.storage` override;
do not change repository config or request Git mutation authority.

- Recovery snapshots inside evidence contain duplicate eslint/tsconfig roots. Keep the owned snapshot directory outside live lint coverage and pin parserOptions.tsconfigRootDir to import.meta.dirname; verify live src/tools remain covered. Native ErrorEvent.message must also be captured: ResizeObserver notifications can have no event.error and escape Playwright pageerror while Vite reports them. Reproduction and unchanged scale proof: reactions-jump-review/resize-red.log and resize-browser-green.json.

- Saving nested recovery tsconfig files can force Vite full reloads and reset a
  paused demo. Confirm the reload in server logs; exclude only each live config
  root's owned preview-renders/.cache subtrees. Native verification must preserve
  navigation count and exact paused readout while writing both nested configs.
  Test live source/assets and a review root nested in .cache remain watched.
- Keyboard evidence must focus a native focusable control before gameplay keys.
  The arcade canvas is not focusable; jump reads held keys and all attacks require
  grounding. Keep driver failures separate from product bugs; verify actual input
  and canAct rules before changing expected behavior or gameplay.

- The gym Play label is static and does not report playback state. Verify that
  its timeline advances before toggling playback; inferring state from the label
  can accidentally pause a correctly playing candidate. The owned back-step demo
  is proven by timeline9-to-20 with reviewedfalse.

- A paused review demo and retained fighter-picker focus can look like broken
  controls. Make the arena focusable, explicitly focus it on pointer/FreePlay,
  preserve native-field key ownership, and prove normal unpaused playback as well
  as frame-stepping. Leave a requested playable demo in FreePlay, not paused.
- A fixed-step input check must observe an actual simulation tick.20ms of a
  browser clock can contain a render with no world advancement (frame288→288);
  verify the same single tap survives to the next tick (starts290), rather than
  changing input code to fit an early observation. Capture frame headers in proof.
- HUD source crops must enclose the actual approved head before fitting into the
  portrait slot. Fit source and destination independently so wider heads do not
  lose their face/chin; preserve other approved portraits' source geometry.

- Coffee hand continuity: the old idle used the far hand while the accepted heavy used the visible near-side right arm. Every new Captain source prompt must identify anatomical RIGHT cup ownership and trace the shoulder-to-grip connection against accepted moves before pose acceptance. Whole-image mirroring does not repair hand ownership. Inspect small alpha-gap coordinates before describing the defect; the new idle gap was at the boots, not the cup.

- After owner authorizes exact pixel repairs, copy adjacent existing RGBA only at the approved coordinates in new PNGs; assert the full-array diff equals that coordinate set, reread saved bytes and verify original hashes. Five-pixel KO/sight/look-up receipt and passing gates are in `normalised-owner-microrepair-20261006/owner-repair.json`. Authorization of the repair method does not approve full poses or boxes.
- A headed Step control can coalesce repeated clicks faster than the render loop. Await two actual RAF callbacks per Step when preparing a paused owner view; fixed-delay or synchronous click loops do not prove the requested frame was reached. Verify readout phase/moveFrame before claiming a paused pose.

- Booster distraction wardrobe continuity: a generated look-up used obsolete olive trousers and brown footwear while runtime idle uses the sleek charcoal/black outfit. Before adopting opponent reaction art, compare pants and shoes with that fighter's currently equipped idle in the actual arcade, including special transitions and mirrored sides. Current correction remains candidate pending owner art/box review.

- Flyby character frames are hurt-only because the damage effect covers the stage. Authoring one exposed generic melee validation; explicit stageWide move metadata keeps physical strike boxes required for melee while rejecting local strike boxes for this effect. Numeric reach/damage/cost stay fixed; test validates both cases. Walking sprites use the existing torso-alignment gate rather than a foot-midpoint gate for alternating planted feet.
- Vite preview automation must bind to the module used by the renderer; unversioned dynamic imports can create separate override state after HMR. Prefer saved review-only clip bindings and prove exact HTMLImageElement body-source paths, excluding HUD portraits. Header or generic artwork labels alone do not prove correct body art.
