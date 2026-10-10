# Complete Captain Animation Set Implementation Plan

> **For agentic workers:** Execute inline with `superpowers:executing-plans`; update this ExecPlan and its scoped ledger as work proceeds. Preserve unrelated work. No commits or publication are authorized by this goal.

**Goal:** Captain has an owner-reviewed, complete animated set in the dev arcade: approved jab/cup-heavy in actual combat, movement, guard/reactions, jump, flyby and effects, outcomes and idle polish.

**Architecture:** Continue the existing pure 60Hz rules and single animation table. Source/generated art stays under `art-source/arcade/captain`; gym clips own drawings, holds and boxes. The harness maps actual engine state to those clips and retains missing-art fallback. Stage travel stays in the engine. Build new art/boxes in the separate review gym, then adopt accepted clips without overwriting originals or live owner drafts.

**Tech Stack:** Existing TypeScript, vanilla dev harness/canvas, Vite, Vitest, Playwright, Python sprite normalization/gates/audits, built-in image generation. No new dependency or external image API setup.

**Spec:** Owner's 2026-10-05 request to create a goal completing the remaining Captain work; plans 0052/0053, accepted appearance manifest at `preview-renders/mars-arcade/captain-gym-consistency-2026-10-05/appearance-acceptance.json`, sprite contract and frame prompt pack.

## Global constraints

- Active worktree `.worktrees/animation-workflow`, branch `fix/arcade-tooling-continuation`, starting HEAD `cd04f17`. Root checkout and all existing dirty work remain intact.
- Captain identity is Pop T. Use the original anchor plus the accepted jab/cup-heavy as fixed references in every generation wave. Keep one cup-bearing near arm in the heavy; do not repeat the rejected duplicate-arm anatomy.
- 128×128 RGBA cells, baseline 119, pivot column 64 within 1px, 104px standing height, strict right-facing profile. Locked source scale 13.990384615384615; retain existing resampling and gates.
- Preserve all approved Booster/Oracle drawings, boxes, timing/damage/reach, shipped bounds/hit-stop defaults and the disabled Oracle video walk. No generic code change may require clips that have not been authored.
- Heavy retains `captain.runTheChecklist`, 9/3/11 timing, reach 36, damage 9, chip 2 and all existing combat values. Flyby retains 26/8/22, damage 30, stage-wide reach 480, meter cost 70 and existing mechanics.
- The owner authorized replacing light composure with the palm jab and approved the 2026-10-05 proposal: 6/3/10, damage 5, chip 1, reach 34 (accepted palm's measured forward edge). Disclosed implementation defaults: guard damage 6, mid guard height, hit/block stun 14/10, knockback 2, hit stop 2, no meter cost, meter gains 6/3. Split accepted five drawings into holds 3/3/3/4/6. Obtain concrete box review before adoption.
- Human gates: appearance of each batch, accurate alignment when an asset pops, attack/hurt/guard box sign-off, and balance decisions. `reviewed` certifies boxes, not appearance. Show concrete comparisons and live playback in the owned tmux pane before asking.
- Preserve original art and current owner drafts before reload/source-table changes. The historical snapshot must never replace a newer live draft. Use review copies when live state cannot be captured safely.
- This goal excludes production cabinet wiring, publishing, commits/pushes/merges/deploys, general 3D asset changes and full production journey approval.

## Review focus

1. A missing Captain clip must produce the existing anchor/box fallback, never throw during partial adoption.
2. Sprite and rules must select the same phase/drawing/boxes on both sides, including active-frame boundaries and reduced motion.
3. Wrong/blocked/whiffed input, interrupted attacks, hit stop and round outcomes must not leave a striking pose or attack box active.
4. Static regional palette rectangles can touch neighboring materials; compare all generated/corrected drawings against the fixed anchor and preserve outlines/white shirt/cup.
5. Reloads can destroy unsaved timing/box/loop edits even when art recipes survive; preserve all kinds of state and the exact source table before adoption.

## Progress and milestones

- [x] 2026-10-05 — Goal created; accepted jab/cup-heavy appearance recovered; live worktree/review table/selector/move data inspected. Main table contains idle plus two unbound source candidates; accepted copies live in the separate review gym.
- [x] 2026-10-05 — Owner approved proposed jab timing/damage/chip/reach. Heavy regional hurt/cup-only attack box draft prepared and schema/silhouette validated in review gym: 30 clips/104 frames/92 drawings, 0 errors/12 review warnings. Concrete box sign-off remains pending.
- [x] 2026-10-05 — Owner approved heavy boxes. Review-only heavy integration passes new sprite/rules parity tests (RED→GREEN), 906 tests/78 files plus lint/types/build, twelve native hit/block/whiff cases on both sides/reduced modes, and a full-stage desktop recapture with all five existing backdrop layers rendered. One guard source/cell generated, gated/audited and wired for further review. Main adoption and remaining Captain browser cases are still pending.
- [x] Task 1 — 2026-10-06: approved heavy adopted into actual arcade; both facings, hit/block/whiff, unchanged balance, reduced motion, missing image, reset/reload, interruption/retry and required widths pass.
- [x] Task 2 — 2026-10-06: approved jab art/boxes/timing adopted; real-input combat, safe legacy tuning migration, both facings/outcomes and continuity proof pass.
- [x] Task 3 — Four-pose forward/back walks and idle polish accepted, normalized/audited, boxed and integrated.
- [x] Task 4 — Normal block, heavy-block compression/settle/return, hit impact/stagger/recover and three airborne poses accepted and integrated.
- [x] Task 5 — Seven-pose flyby and four aircraft effect frames accepted and integrated at existing timing/mechanics.
- [x] Task 6 — Three-pose victory and knockout sequences accepted and integrated, including grounded outcome settling and reduced motion.
- [x] Task 7 — Whole Captain set has no placeholder in authored states; full relevant validation/review and recoverable handoff complete.

## Task 1: Integrate the accepted coffee-heavy

**Files:** `src/game/marsArcadeAnimations.json`, `src/dev/arcadeHarnessSprites.ts`, `src/dev/arcadeHarnessSprites.test.ts`, `src/game/marsArcadePose.test.ts`, `tools/assets/check-arcade-captain.mjs` (new), candidate art/report/evidence.

**Interfaces:** Existing `selectArcadeSprite(state, side, reducedMotion, outcomeFrame?, heavyReaction?)`, `marsArcadeMoveClip`, `marsArcadeRulesFrame` and `marsArcadeMeleeBoxes`. New bound clip is `captain:heavy`, move id `captain.runTheChecklist`, phase holds 5/4/3/5/6.

- [x] Fit regional head/torso/leg/extended-arm hurt boxes and cup-only active attack box in the review gym; preserve originals and bind only in the isolated review table for schema validation. All phases/mirrored boxes and reach 36 shown; owner box sign-off obtained.
- [x] Write a selector regression for lift/draw/cup-strike/retract/lower at engine frames 0/5/9/12/17, no placeholder, sprite/rules parity and state immutability. Observed expected RED before review-code implementation; now GREEN on both sides/reduced modes.
- [x] Adopt only the reviewed heavy. Extend authored attack selection to Captain without prematurely requiring its missing walks/guards/outcomes. Keep the source candidates and accepted copies alongside it.
- [x] Prove phase-aligned rules/drawings/active boxes on both sides, including just-before/after active boundaries; focused tests, actual hit/block/whiff/native controls, reduced motion and missing-source fallback.

## Task 2: Replace light composure with the accepted jab

**Files:** `src/game/marsArcadeFighters.ts`, `src/game/marsArcadeTuning.json`, `src/game/marsArcadeAnimations.json`, `asset-reports/mars-arcade-sprite-contract.json`, corresponding fighter/rules/tuning/budget/selector tests and Captain browser proof.

**Interfaces:** Keep the `light` button, define `captain.palmJab` (player label `PALM JAB`), bind `captain:jab` to the approved frame data. Migration/load must preserve unrelated tuning; do not silently give older composure saves damage-zero jab parameters.

- [x] Exact proposal approved 2026-10-05; fit palm-only active boxes and regional hurt boxes in the review gym and obtain sign-off.
- [x] Write and watch fail a real-input rules test: jab damages on its approved active tick, chips a mid guard, whiffs beyond authored bounds, cannot damage in startup/recovery, and interrupts/retries safely. Add old-tuning migration coverage if the move id/schema changes.
- [x] Implement the approved content/tuning/contract and bound clip, retaining accepted pixels and setting reviewed only after box review. Keep every other move unchanged.
- [x] Run focused/full tests and actual browser hit/block/whiff, both facings, reset/reload, native/keyboard input and reduced motion. Update displayed controls to describe the actual move.

## Task 3: Movement and idle

**Files:** source wave `art-source/arcade/captain/generated/full-set-v1/`, normalized candidate sets, single animation table, `src/dev/arcadeHarnessSprites.ts`, selector/pose tests, per-clip asset reports and evidence.

**Interfaces:** `idle` (four slots; exact anchor retained), `walk-forward` and `walk-back` (four poses each), existing `marsArcadeFrameAt` and engine-owned x travel.

- [x] Generate against fixed reference(s); inspect each source for identity/arm count/cup/white shirt and gait. Normalize all clip sources together at locked scale; gate cells, wire candidates, audit entire cycles. Keep feet grounded and torso stable; do not nudge away deliberate gait while baking travel into art.
- [x] Show each cycle with anchor comparison, real holds/mirror/onion skin and tmux contact sheets. Obtain appearance/alignment review, fit boxes and obtain sign-off.
- [x] Write failing selection tests for forward/back walking and idle looping/reduced-motion freeze; extend Captain support using available clips only. Prove engine positions are unchanged by sprite travel.

## Task 4: Guard, reactions and jump

**Files:** same table/source/report pipeline, selector/reaction tests, `src/dev/arcadeHarnessSprites.ts`, Captain browser proof.

**Interfaces:** `block` two slots; `heavy-block` compression/settle/guard three slots; `hit` impact/stagger/recover three slots; `jump` rise/apex/fall three poses. Existing stun/velocity/guard rules remain authoritative.

2026-10-06 checkpoint: normal block art/boxes accepted and main-adopted,912 tests79files/lint/types/build plus8 actual native cases pass; all30 old clips preserved (now31/105/98). Heavy-block3, hit3 and corrected jump3 are gated/audited, review-only. Jump preview selection RED→GREEN and4 real-input review cases pass. Fixed-scale apex boot correction reduces7px torso jump to1px; first/apex/fall torso51/52/50. Heavy-block compression is4px, settle2px, then exact accepted ready. Hit recovers through the exact original idle. Appearance/box reviews for these three clips are pending.

For reaction integration, keep a shared clock for Captain's rendered pose and rules boxes. Record incoming stun move/button and original duration as optional combat metadata; use remaining stun frames so hit stop freezes both. Preserve existing damage, durations and other fighters' animation behavior. Validate real melee/projectile/block/crush events, three beats on both sides and no state mutation. This is a maintainer default; no new gameplay tuning or dependency is proposed.

Latest review-only prototype:932tests82files/lint/types/build pass, eight native
reaction cases still pass after making the clock scale editable gym holds over
the original engine stun. Zero-stun cleanup/re-hit replacement and shared rules
selection pass. A fresh reviewer found zero-stun impact sprite/rules divergence;
the shared selector now retains impact throughout real hit stop without stale
metadata. The both-side/reduced regression failed before the fix and passes
afterward. Main remains unchanged pending art/box decisions.

- [x] Generate, normalize, gate/wire/audit the four clips with the same appearance authority. Show the transition back to accepted idle; preserve dignified reactions and cup continuity. Obtain appearance/box reviews.
- [x] Write failing selector tests for velocity-selected jump poses, actual stun reaction beats, guard priority and hit-stop behavior. Share existing behavior rather than duplicate timing logic for Captain.
- [x] Integrate available clips without changing gameplay. Browser-prove clean/blocked hits, heavy compression/recovery, guard crush, jump/landing, interruption and mirrored/reduced-motion paths.

## Task 5: Flyby character and aircraft effect

**Files:** Captain `special` seven-pose source/table, `art-source/arcade/generated/fx-flyby-v1/`, existing harness effect-rendering path (`src/dev/arcadeHarness.ts`), effect tests/proof/report.

**Interfaces:** `captain.flyby` stays 26/8/22; source budget startup 3/active 2/recovery 2. Aircraft stays separate from the 128px character cell; four 320×96 effect frames, pale DC-9 side profile, wings level, no weapons/smoke or generic aircraft substitution.

Review-only aircraft effect: source01 repair removes a stray neighboring-frame
fragment; four320x96 cells contain110x31 aircraft within top32rows, one silhouette
each. Manufacturer DC-9-32 drawing inspected on Boeing manual PDFpage15; source
link registered, no production3D change. Five native effect cases pass both
directions/reduced/missing-frame modes; actual pale interior paint contrast4.01:1,
unchanged damage30/cost70/timing26/8/22 and hitstop clock. Character seven-pose
56-tick unbound diagnostic is audited, but sight has an enclosed2px hand gap.
Corrected first airflow sweeps tie left. Owner art/box/effect review remains.

- [x] Author and review seven pointing/sighting/settling poses and four aircraft effect frames. Follow prompt-pack placement/contrast references against the actual Mars sky; keep original effect candidates intact.
- [x] Split holds exactly to 26/8/22 and validate; review character boxes and effect position/visibility. Maintain the existing stage-wide hit mechanics and meter cost.
- [x] Write failing actual-event rendering/selection tests if new code is needed; integrate through the existing event/timeline path. Prove both facings, range/stage edges, paused stepping, impact/hit stop and reduced-motion static rendering.

## Task 6: Outcomes

**Files:** Captain victory/knockout three-pose sources/table/report, existing outcome sprite mapping/tests/browser proof.

**Interfaces:** `victory`, `knockout`, existing `outcomeFrame` and terminal settling/reduced-motion behavior. No rules/outcome changes.

Independent approved-slice review found a minor terminal-overlay mismatch: the
phase-blind rules lookup can retain active finishing-jab/heavy boxes after the
renderer changes to the terminal fallback. Combat correctly freezes. Resolve
terminal rules frame selection/suppression with the outcome clips and prove
finishing-hit and timeout boundaries. No critical/important adopted-slice findings;
reviewer ran70 tests across8 focused files and verified preservation of old clips.

That mismatch is resolved in the review prototype: terminal rules/reach overlays
are suppressed for both actors, with real Captain win/loss/timeout/draw tests.
Combat already clears hitstop on knockout; no hit-flash rule change was needed.
Gated KO3 uses exact hit-stagger plus sit-down/seated corrections,36ticks, cup level.
Eight native KO/win-fallback cases pass both sides/reduced modes. Missing victory
remains explicit fallback; KO art/alignment/cosmetic box review is pending.

- [x] Generate, normalize/gate/wire/audit and show respectful victory/knockout poses, preserving identity and grounded recovery. Obtain appearance and appropriate cosmetic box review.
- [x] Write failing win/loss/timeout/draw/airborne-outcome/reduced-motion selector tests; extend the existing shared outcome path without changing Booster/Oracle.
- [x] Browser-prove win/loss/draw/reset/reload and transition away from outcomes with actual events and poses.

## Task 7: Final verification, review and save

- [x] `npm run arcade:validate`, all relevant cell gates and sequence audits pass without weakened thresholds. Record warning ownership; every production-selected Captain clip has reviewed boxes and accepted art.
- [x] Equivalent active-source lint/typecheck/test/build checks pass (immutable preview archives excluded from lint). Captain browser proof covers both sides, all states/moves, hit/block/whiff, repeated input/interruption, reduced motion, keyboard/native controls, reset/reload, missing-art fallback and 375/768/1440; existing gym/playground and nearby Booster/Oracle proofs pass.
- [x] Full scoped diff review (fresh reviewer where available under skill instructions); fix all critical/high issues and rerun failed/nearby checks. Final owner Captain review from actual live playback plus consistent screenshots; no unrun production checks are claimed.
- [x] Update reports/TEST_REPORT/this plan/ledger. Save a resume guide, exact source/table hashes and verified recovery archive with clean reopen; state local same-disk scope and no remote publication.

## Repair loop and stop conditions

For each clip: inspect → generate/correct a bounded candidate → gate/audit → real gym playback → remaining delta → review. At most three substantive source correction rounds per failure before requesting the specific unresolved visual choice; keep failed candidates and evidence. Never repeat a prompt/palette operation without a changed mechanism justified by the previous result. Use async questions for human art/box/balance decisions and continue independent authorized work. Do not mark the goal complete until all tasks and final review are achieved; do not call it blocked merely while art is being reviewed or other tasks can progress.

## Discoveries and evidence

- Current accepted active palm reaches cell edge 98 (34px past pivot); cup reaches edge 99 (35px), one pixel inside existing heavy reach 36. The heavy box must expose its one-pixel reach padding for review; no reach change is automatic.
- The selector excludes Captain from attacks, movement, reactions and outcomes. Rules pose lookup can already read table-bound move clips. Extending only the renderer could leave rules/drawings mismatched; phase/side parity is part of every adoption.
- A clip with an attack box requires a move id; the validator correctly rejects an unbound attack-box draft. Bind draft attack clips only inside the isolated review table to validate holds/reach; adopt into the actual table after owner box sign-off. The initial draft failure and repaired validation are recorded in the scoped ledger.
- Reviewed cup boxes replace the legacy reach fallback: bounds-on connect distances are now 55px versus Booster and 51px versus Oracle (their hurtboxes extend toward the cup); the heavy's authored forward edge/reach stays 36. Original other-fighter spacings are unchanged. Updated the pinned distance test and retained true no-clip fallback coverage by removing/reinstating the heavy clip within that test.
- The original review fixture omitted tools dependencies, the approved TMB2 source and backdrop layers. Broader tests/screenshot inspection exposed those omissions; copied the unchanged inputs, with no test suppression or asset rewrite. Full review checks now pass. Initial plain-background native proof remains distinct from the later full-stage screenshot proof.
- Baseline before this goal: `npm run check` passed 904 tests/77 files plus lint/types/build; accepted appearance candidates passed ten cell gates, two audits and nine artifact/browser proof checks. These are historical baseline results, not coverage of future goal changes.

## Outcome and handoff

Goal remains active. Tasks 1/2 are adopted and verified in the actual gym/arcade on 5360 after the owner confirmed no unsaved edits. Main table has 30 clips/103 frames/96 drawings; all 28 previous clips, including owner Booster `jab-art-baeea189`, are unchanged. Actual check passes lint/types/910 tests in 79 files/build. Twenty-four native combat cases plus twelve continuity cases pass. Evidence and before-adoption snapshots are under `preview-renders/mars-arcade/captain-full-set-2026-10-05/adoption/`.

Task3 initial walk declined specifically for stride; retained/unbound. Revised contact/passing cycle with two lowered-foot edits passes4 gates/32-tick audit; owner review pending. Torso51/baseline119 throughout, first pose103px versus104px others. Backward movement uses the same engine walk speed; prepare the accepted forward poses in reverse order as a reversible back-step candidate after forward acceptance, then review actual backing-away playback and boxes. Keep the old four backward sources disabled/unreviewed.

Normal guard art/boxes are now approved and adopted (actual31/105/98,912 tests/79 files/check and8 native guard cases pass). Three failed brace repairs remain alongside successful brace03. Heavy-block/hit/jump candidates are gated/audited; jump review playback works on both sides/reduced modes. Victory sources are generating. Tasks3–7 remain; no full-set completion/publication/final Captain approval is claimed.

Current recovery checkpoint: `preview-renders/mars-arcade/captain-full-set-2026-10-05/checkpoint-20261006T121339Z`. All1,367files verify after fresh extraction;92,922,254-byte archive SHA256 `f09a2688061b82382f2d0bd63084b32dc1dee850d3e3d3965a938c2cd07048bd`. Approved and separate review gym/arcade reopen PASS:98/98and128/128sprites,4/4flybyFX, retained owner Booster draft, zero console/page errors. Temporary5364/5365 stopped; live5360/5362 retained. Local same-disk scope, dependencies/public linked. Goal remains active; art/box decisions and full-set adoption remain.

Recovery follow-up: native window-error capture exposed a baseline ResizeObserver delivery warning missed by pageerror/console listeners. Reproduced on both5360/5362 at1440→768→375→1440; defer existing resize layout write to RAF, unchanged scale math. Browser RED→GREEN passes both ports/all widths/integer scale/no overflow/no window errors. Only main harness source changed; all other src/table/tuning bytes match prior checkpoint. Root ESLint initially failed1971parse errors after nested recovery configs; scoped artifact ignore and explicit tsconfigRootDir fix preserves live/unrelated coverage, independently reviewed with no findings. Main fullcheck912tests79files/lint/types/build, review932tests82files/lint/types/build plus config-final lint PASS. Prior121339Z archive remains immutable with limitation recorded; saving refreshed recovery.

Latest recovery: `preview-renders/mars-arcade/captain-full-set-2026-10-05/checkpoint-20261006T122354Z`. All1,375file hashes reverified after fresh main/review browser reopen; archive92,926,398bytes, SHA256 `aa8ad73876b2f3e69922024d03c04b35459bc7b7eea7bcfc599b99da184651a4`. Direct window-error/pageerror/console capture clean, complete sprites/FX, preserved owner Booster draft. Temporary5364/5365 stopped; live5360/5362 retained. Source fixes and snapshot lint isolation reviewed, no findings. Goal active; pending owner art/boxes plus3art gaps remain. Local same-disk scope, dependencies/public linked.

Independent source progress: idle-inhale repair02 clears boot pinhole; both2newcells pass original standing gates and4-slot120tick audit. Exact anchor reused twice, torso51/feet119fixed, inhale105height(+1) disclosed. Twelve native gym cases pass375/768/1440, mirrors/reduced, actualdrawsource parity/loop/no errors. Owner idle art+30ticksquestion pending, tmuxidle-art-review.png/newownedgymt16 playing. Sightrepair02 repeats handgap75-76/28; third/final repair03 replaces hand but introduces height110/10components/8holes/57.4%partialalpha, rejected/diagnostic. Stop sight generation retries at3, retain better prior candidate. Prepared unbound reverse-order0,3,2,1 backwalk-v2 from revisedstride,8holds/32tickauditpass; forward/backartdecisionspending. Reviewtable54/179/132,0errors33warnings; main entire src byte-identical to verified122354Z checkpoint. Current sources/prototype table newer than that archive; art-delta recovery next.

Art-delta recovery verified: checkpoint-art-delta-20261006T125500Z,53files/3941504bytes, SHA256 `c829b0d4c4fe983c11cf6ec81846e918ac26b4412432d665e2ef7499da809092`, tied to full base122354Z. Clean base+delta extraction/hash overlay and native fresh gym12cases/arcade132sprites4FX/Captain reopen PASS with direct window-error capture. Temporary5365 stopped. Goal active; owner idle/walk/reaction/jump/KO decisions and hand-repair method remain; no runtime source changes this turn.

Flyby owner review prepared: source4cell hashes unchanged; fresh native clean captures at active30 bothdirections,132sprites/4FXready,window/page/console0errors. Tmux flyby-aircraft-art-review.png compares all4frames and two stage captures with oriented BoeingDC9-32 PDF15 reference. Chunkier fuselage/tail disclosed; effect appearance/placement/motion question pending. Owned newarcadet17 pausedP1flybyactive30 (26/8/22,30damage,70meter); body remainsanchorplaceholder because character special diagnostic/unbound. Also prepared unreviewed idle-v3 box draft with exact reviewed neutral collision/head/torso/legs on all4poses, noattack/noguard; imagepixelsunchanged.44focusedtests4files and validator54/179/132,0errors33warnings pass. Main allsrc bytes and prior50 review clips preserved. No new approvals or code changes; saving cumulative art-delta update.

Owner kept aircraft FX. Main adoption scope onlynewmodule/test and harness import/load/draw/status; before snapshots preserved, REDmodulemissing→GREEN21focusedtests4files. Full actual918tests80files/lint/types/build PASS;8native5360cases incl375/768,normal/reduced,bothdirections,missing0+2fallback andwindowerrors PASS. Existing26/8/22/damage30/meter70,4PNGhashes, mainanimation/tuningJSON/ownerBooster draft unchanged. Fresh reviewer6tests/hash/integration review no findings. Normalization report/appearance receipt mark aircraft accepted; character special7poses stillunapproved/unbound. Current idle box draft and allother art gates pending. Saving new full checkpoint; earlier art deltas historical beforeFXadoption.


Aircraft adoption follow-up (2026-10-06): two native keyboard cases on main
pass for both sides: jump, existing grounded-only special rejection, landing,
grounded flyby, and reload with all98sprites/4FX and zero errors. Combined with
8FX/layout/fallback cases, this is10new native control/effect cases. The earlier
driver failures are retained: the canvas is not focusable, jump reads held keys,
and attacks require grounding; no combat rule was changed to fit the driver.

Recovery tsconfig writes under owned evidence/cache caused Vite full reloads and
reset paused demonstrations. Root-relative server.watch.ignored now excludes only
preview-renders/.cache under each config root; native proof records navigation1
before/after, unchanged paused Captain, and zero errors. The fresh reviewer tested
38 actual matcher paths, verified live source/assets stay watched and identical
main/review configs, and found no findings. Latest main full check passes lint,
types,918tests80files/build; review lint passes. Evidence: reactions-jump-review/
flyby-main-adoption/{air-keyboard-proof.json,watch-isolation-proof.json,
watch-isolation-check.log}. A refreshed full checkpoint includes these changes;
134411Z remains the verified historical checkpoint before watcher isolation.


Latest full recovery verified: checkpoint-20261006T142930Z,1,478files,
97,698,726archive bytes, SHA256
`31e94b3f3c2fc0e356e8bd3d39e5afe4c2d945713b344ce79edbbde63d932bba`.
Fresh approved/review gym and arcade reopen pass; approved block reviewed=true,
review KO reviewed=false, preserved Booster jab-art-baeea189,98/132sprites and
4/4flyby effects, zero window/page/console errors. All file hashes and archive
rechecked after browser proof. Temporary5364/5365 stopped; main5360/review5362
retained. Same-disk recovery with existing public/dependency links; goal active.
Owned new main arcade tab shows accepted FX paused at P1active30,98/98sprites,
4/4effects, no errors. Captain character special still uses its standing anchor.


Movement review proof (2026-10-06): existing shared clip overrides support the
unbound revised back-step and idle candidates without application changes.
6new review-only tests plus nearby selectors pass27tests3files; review lint and
types pass. Tests prove both-side forward/back engine-state parity with ordinary
travel, every pose, matching rules/drawing frames, reduced idle freeze with fixed
standing boxes, walking hitstop freeze and guard fallback after override removal.
12native cases cover375/768/1440, both sides and reduced modes:32ticks each walk
paint all4sources,120ticks idle paint all4slots (staticneutral under reduced),
no overflow or window/page/console errors; reload removes temporary overrides.
Main source and review runtime/table bytes match verified142930Z checkpoint.
Owned new review gym plays walk-back-v2-candidate (timeline9→20,reviewedfalse),
draft boxes hidden. Tmux%1 shows back-step-art-review.png with idle/four poses
and actual retreat capture. Owner question for back-step art+four8tick holds
pending; neither boxes nor any new character art approved. Evidence lives under
reactions-jump-review/movement-preview; saved supplement ties to full142930Z.
Task3 remains incomplete pending art/balance/boxes and main adoption.


Walking box draft (2026-10-06): changed only review Captain revised-forward
candidate/canonical preview and unbound back-v2 candidate. Head/torso use reviewed
standing idle regions; legs fit alpha>=192 rows78..118 with1px horizontal inset
and exclusivebottom119. Existing body boxes, PNGs, holds8, bindings and allflags
preserved; backguard copies accepted standing box (cosmetic, existing guard-height
rules unchanged), noattack.51other clips exact. Main168source files/all275archived
PNGs unchanged; all132review sources byte-identical.2new actual wall-retreat/palm-
jab block engine cases pass on both sides with99HP, nohit;56focusedtests4files and
full review940tests83files/lint/types/build pass. Validator54/179/132,0errors33prior
warnings;12native movement cases rerunPASS with separate output, noerrors.
Fresh independent scoped review has no findings. Actual owned gym shows3regional
hurt boxes/backguard; tmux%1 cleanposes plus clearlylabelled walking-draft-boxes.png.
Art/timing questions remain pending; box signoff follows art acceptance. No new
character approval/main adoption. Save supplement with exact table/test delta and
fresh isolated review reopen; previous movement proof supplement remains historical.


Owner-reported portrait/input repair (2026-10-06): Captain HUD crop52/14/22/24
cut face/chin; new crop46/14/34/34 fits22x22 centered in the existing22x24 slot,
with nearest pixel sampling and unchanged Booster/Oracle crops. Canonical anchor
PNG untouched; test measures actual opaque head bounds. Fighter-picker focus owns
keys, and the old arena was not focusable. Arena now participates in Tab order,
clicking it focuses game input, and Free play starts unpaused with arena focus.
Native form navigation remains owned by fields; game/collision/tuning data unchanged.

TDD2portrait tests RED helpermissing→GREEN; browser RED arena focus→GREEN. Initial
typecheck failures fixed with optional canvas focus in hoisted command and a native
URL argument to existing PNG reader (declaration string|URL, no TS config changes).
Focused38tests3files; main920tests80files and review942tests83files plus lint/types/
build pass.6main+6review native cases cover375/768/1440×reduced, both fighters'
move/jump/jab/heavy/flyby, actual full-head HUD crop, pointer/Tab/FreePlay focus,
native select/number-field key ownership, nooverflow/window/page/console errors.
2additional unpaused RAF cases (bothports/bothactors) prove full live controls with
zero manual steps. Driver initially sampled K before next simulationtick:288→288,
then same unresent tap starts290. Existing pending retention works; no extra input
queue change. Failures preserved separately. Scoped reviewer found no remaining
correctness issues after type fixes; final evidence update pending. Tmux%1 now
shows portrait-before-after.png. Save full refreshed recovery, then leave main
CaptainP1 FreePlay, arena focused. Remaining character art/timing/box gates pending.


Final portrait/control recovery: checkpoint-20261006T154017Z,1,556files,
99,385,070archive bytes; fresh approved/review gym+arcade reopen and allpost-browser
file/archive hashes PASS, portrait34x34/22x22fit and arena focus included.
Owner Booster draft,98/132sprites and4FX preserved;0errors;temporary5364/5365
stopped. Final independent reviewer verifies920main/942review checks plus all
12layout/focus cases and2unpaused cases;no remaining findings. Earlier full/delta
checkpoints retained. Main playable session is set up as CaptainP1/rookieCPU,
unpaused,arenafocus,chargedmeter;tmuxportrait-before-after.png. Goal active:
remaining character art/timing/box approvals are still pending.


Victory wider-stance option (2026-10-06): assembled complete UNBOUND
captain:victory-v3-candidate from exact anchor preparation10, existing identical
raise8, passing repair02wide salute12. No sourcegeneration/painting ormain edits.
All54old review entries exact; regional boxes are cosmetic/draft,flagsfalse.
Existing normalized pair copied into live fixture after validator caught missing
salute PNG; original failed narrow variants preserved/disabled.2cell gates0fail;
3pose30tick audit PASS, allheight104/feet119/torso51,zero upperbody pop.
Review55/182/133,0errors34warnings;943tests83files/lint/types/build PASS.
New selection test coversbothsides/reduced/staticfinal/airborne settling/frozen
state/nullterminalrules/override removal.8native1440cases pass actualKO/timeout
wins bothsides/reduced, actual terminalbody sourcepainting and reloadfallback,
noerrors;localhealth5/95 setup notsaved. Main168src and sourcePNG hashes unchanged.
Independent reviewer no findings,19focusedtests independentlypassed. Tmux%1
victory-choice-review.png and new gym showed fullclip ending salute tick29.
Owner fullwide art/timing vs narrow exact2pxPythonrepair choice pending; older
repair-method question remains unanswered. Box signoff follows art decision.
Save scoped supplement tied to verified154017Z; goal remainsactive.


Victory option recovery verified: checkpoint-victory-option-20261006T163617Z,
30files/689003bytes,SHA256294feba2242f5f40e6ae79d977fa26e3db5d6e11c72ea6bef35974386d1695e1,
tied to full154017Z. Clean extraction/hash overlay and fresh separate review gym/
arcade reopen PASS, all3poses/10-8-12holds/falseflag,133sprites4FX,no canonical
victory/noerrors. All30files/archive rehashed;temporary5365 stopped. Owner choice
still pending; no new approval/main adoption. Goalactive, lastturn concreteprogress.

### 2026-10-06 owner correction: idle coffee hand

Owner identified that the canonical idle holds coffee in the wrong hand. Created a preserved-source right-hand neutral candidate using the original anchor for identity and accepted coffee-heavy for the visible near-side right arm. Two generated source attempts remain saved. Bilinear normalization made a one-pixel enclosed gap between the boots; Lanczos re-normalization at the unchanged locked scale passes the full-color standing gate. Candidate height104, baseline119, torso52 (original51); sequence audit passes. Added only an unreviewed, unbound 18-tick neutral candidate to the review fixture; all55 prior review clips and main animation/tuning tables preserved. Tmux comparison and actual review gym show the result. This supersedes the prior idle appearance review request; breathing cycle and reused neutral returns require propagation after owner accepts the corrected anchor. Evidence: `preview-renders/mars-arcade/captain-full-set-2026-10-05/idle-right-hand-review/`.

### 2026-10-06 main terminal box fix

Adopted the previously isolated terminal phase guard into main `marsArcadeRulesFrame` and harness `drawMoveRegion`. Real KO/timeout-loss/timeout-draw regressions on both actors first failed with a frozen active Captain jab and then passed; terminal state remains frozen, live rules/tuning unchanged. Focused62tests6files PASS; main full check923tests80files/lint/types/build PASS; scoped independent review found no issues and separately ran52tests4files. Native main arcade8cases bothsides × reduced motion × bounds/reach: real Captain finishing hits, hitboxes explicitly confirmed ON, no post-KO attack/reach rectangle paint, restart/resume/reload PASS, no page errors. The native verifier excludes the known36x3 activity indicator; initial instrumentation incorrectly treated that red strip as an attack and tried to advance a paused restart. Those were verifier errors, corrected without changing game behavior. Art/outcome/idle approval and final adoption remain open. Tmux still shows the corrected idle comparison; review gym candidate still available. Evidence: `idle-right-hand-review/terminal-main-check.log`, `terminal-proof.json`, `terminal-independent-review.json` and eight stage screenshots.

### 2026-10-06 full right-hand breathing idle candidate

Extended the owner-requested corrected right-hand neutral into a full120-tick cycle: neutral30/inhale30/exact neutral return30/exhale30,3unique drawings. Both new high-resolution sources retain right-arm shoulder/elbow/forearm/grip continuity. Fixed locked scale/bilinear breath normalization passes; Lanczos exhale retained as failed collar/sleeve gap53,41. All feet119/torso52, heights104/105/104/104; sequence audit passes with1px inhale vertical variation disclosed. Added only unreviewed/unbound `captain:idle-right-hand-cycle-candidate` to review; all56 prior clips exact, no main/tuning changes. Review validator57clips/187frames/136drawings,0errors/36warnings; focused46tests3files PASS. Native12cases375/768/1440 × bothsides × reducedmotion prove actual three-source body painting vs static corrected neutral, no overflow/errors and override cleared on reload. Headed gym tick0->105 and onward confirms playback. Tmux updated to `idle-right-hand-review/cycle-comparison.png`. Full-cycle art/timing review requested, extending prior neutral-only question; box acceptance remains pending. Old idle/breath/returns remain intact until accepted correction can be adopted consistently.

Recovery supplement `checkpoint-idle-hand-terminal-20261006T171423Z` verified:86files/5575219bytes, SHA256 `8cd0250dd22e76978212522052cad361b767a0ea9c370566ed1610281ec02dd6`, layered over full154017Z and victory163617Z. Fresh separate main/review reopen PASS (main98sprites/actualKO nullrules/originalidle/Booster draft; review136sprites/right-hand cycle30x4/falseflag/playback/mirror/noerrors). All archived files and archive digest rechecked afterward. Temporary5364/5365 servers stopped; original5360/5362 retained. Main923 fullcheck and review46 focusedtests are current evidence; older review943 fullcheck remains historical before candidate-only table additions. Owner gates remain open, goal active.

### 2026-10-06 corrected right-hand knockout and box draft

Inspection found the old sit-down/seated KO sources used the far hand for coffee despite prompts asking for the near arm. Preserved originals and generated new near/right-arm coffee versions. Mid-sit3source edits reduce lower boot defects to one alpha gap62,114; seated2edits fix cup ownership and supporting-hand contact (hand118/boots119), retaining one collar gap46,77. Normalized bilinear cells remain FAILED art gates; failed Lanczos alternatives retained. No further pixel painting or gate weakening. Requested explicit four-pixel Python-copy repair authorization for these2pixels and existing flyby sight75-76,28; exact proposal shown in owned tmux.

Added only unbound/unreviewed `captain:knockout-right-hand-candidate` to review: exact old off-balance plus corrected sit/seated,12/12/12holds, three cosmetic head/torso/leg regions per pose, no attack/guard. All57prior review clips exact; main animation/tuning and accepted reference hashes unchanged. Sequence audit PASS (103/93/70height,feet119), which does not establish per-cell art acceptance. Review validator58clips/190frames/138drawings,0errors/37warnings; focused46tests3files PASS; native4cases actualKO bothsides/reduced/static-seated/three-source-paint/reload PASS with unsaved health5 fixture, no errors. New headed gym played draft; tmux `knockout-box-draft/right-hand-boxes-and-repair-review.png` combines boxes with exact four alpha pixels. Source prompts/attempts/generation receipt, prior table, proposed regions, hashes and proof saved under `reactions-jump-review/knockout-box-draft/`. Old knockout remains intact; corrected art/timing/boxes still need owner review after microrepair. Latest verified recovery171423Z precedes this KO addition; the new raw art/draft/evidence are present in live workspace and will be included in the next recovery save.

### 2026-10-06 conditional runtime integration and full flyby box draft

Ported existing review runtime logic into main without binding any unapproved art: optional incoming stun metadata deep-cloned/replaced/cleared, shared Captain hit/heavy-block clock preserving hit stop/zero-stun behavior, optional jump/outcome clips with grounded terminal settling and reduced final pose, safe missing-art fallback. Seven future-clip tests use an isolated mock table, observed RED; corrected blocked-input/hitstop/absence fixtures and test-only JSON import typing before final GREEN. Main full930tests81files/lint/types/build PASS; focused111tests6files PASS. Independent scoped review found no issues and ran114tests7files plus4real projectile/guard-crush/zero-stun assertions (its closed SSR runner had harmless HMR socket EPERM). Main native8guardcases pass old ready/brace/chip/idle-jab behavior;6approved flyby cases pass bothsides/reduced/missingFX/timing26/8/22/damage30/cost70. Main animation/tuning tables and accepted reference hashes unchanged, all five optional Captain clips still absent. Runtime source before/after saved for concrete review.

Source inspection found the first flyby look-up used the old wrong-hand idle arrangement; other six poses already hold coffee in the near/right arm. Generated3preserved right-hand look-up attempts; locked-scale normalization retains one hair/collar alpha gap55,43 (alternate Lanczos failures retained). Added only unbound/unreviewed `special-right-hand-candidate` to review: seven poses, fixed standing head/torso/legs plus raised free-arm regions, no character attack/guard, timing8/8/10+4/4+10/12. All58prior clips exact. Review validator59clips/197frames/139drawings,0errors/38warnings; sequence audit passes but per-cell art remains FAILED (look-up1+sight2 pixels). Headed gym actually advances0->55, boxes visible; tmux showed regional draft then expanded exact5pixel proposal. Python-copy repair authorization requested for KO2+sight2+look-up1; no asset pixel painting performed. Art/timing/box decisions remain open. Current recovery171423Z predates the KO/flyby additions and runtime port; next checkpoint must include them. Evidence and source receipts: `reactions-jump-review/special-box-draft/`.

### 2026-10-06 owner-authorized five-pixel repair complete

Owner explicitly answered “Allow all five pixel repairs.” Python copied adjacent existing outline RGBA into exactly KO boot62,114; KO collar46,77; sight75,28 and76,28; look-up55,43, in four new PNG copies under `normalised-owner-microrepair-20261006`. All other decoded RGBA pixels and all original PNG byte hashes unchanged; reread new PNGs equal expected arrays. No resampling or threshold changes. All4corrected cells full-color gate PASS; corrected KO3 and flyby7 sequence audits PASS. Replaced only4source references/notes in the2new unbound review candidates; all other57clips, holds, boxes and false flags preserved. Review now59clips/197frames/140drawings,0errors/38legacy-review warnings. Full review943tests83files/lint/types/build PASS.

Repaired KO4native cases and repaired flyby character4native cases PASS bothsides/reduced: all3KObeats vs static final; all7flyby body sources actually paint at26/8/22, damage30/cost70; reload clears overrides/rehearsal bindings. Flyby `moveId` assigned only inside disposable page parsed table, never saved to JSON. Fresh headed KO gym and review arcade use repaired bytes; review arcade paused at actual ACTIVE27/56 with repaired airflow body and approved aircraft, HP70/meter30. Initial headed Step loops coalesced because commands were faster than RAF; fixed by awaiting two real RAF callbacks per step, no game behavior changed. Tmux updated to actual repaired KO/flyby box sheet. Full KO art/timing/boxes and flyby character art/boxes approval requested; method approval alone does not certify those. Main animation/tuning and accepted reference hashes unchanged; main conditional runtime930checks remain current.

Current full recovery185536Z verified:1878files/149857387bytes, SHA256 `4ed86e6ff38773e776e958a200a1f5c5f85078396e1c56d61159a7181dc848ab`. Fresh main98sprites/actualheavy metadata/damage/optional-clip absence/Booster draft and fresh review140sprites/repaired KO/flyby holds/flags/playback reopen PASS; all file/archive hashes rechecked afterward. External RESTORE.md explicitly replaces the entire review/src with saved review-overlay/src to keep the main-only mock test out of review; both complete source trees are hash-bound in archive. This full snapshot supersedes earlier delta chains. Source/norm attempts, five-pixel owner authorization/receipt, runtime before/after, tests and evidence included. Local dependency/public links only. Live main practice reopened CaptainP1/BoosterP2human/fullmeter/arena focus; separate review arc remains paused with ephemeral flyby binding. Art/timing/box owner decisions remain open; goal active.

### 2026-10-06 right-hand continuity across hit and victory

Audited the revised four-pose walk, three heavy-block poses, jump and wide victory: cup ownership is already the near/right arm in all their generated poses. Found two old neutral-source reuses in hit recovery and victory preparation. Added only unbound/unreviewed `hit-right-hand-candidate` and `victory-right-hand-candidate` to the separate review table, reusing the existing corrected neutral and its draft collision/hurt regions. No new pixel painting or generation. Preserved nominal hit3/10/9 and victory10/8/12 holds, all59 prior review entries exactly, and both main animation/tuning hashes. Review61clips/203frames/140drawings,0errors40review warnings. Both sequence audits PASS; hit shows2px dip and3px horizontal return, victory retains the wider passing salute. Neither metric certifies appearance.

Focused review22tests2files PASS. Eight native real heavy-hit/win cases PASS bothsides/reduced: actual candidate body sources, three hit poses, three victory beats or reduced final salute, unchanged damage/health and reload clearing temporary overrides. Initial verifier expected victory pose names; actual readout labels frame numbers, so corrected the verifier only and reran successfully. Full check was not repeated for these two data-only copies; prior main930/review943 full checks remain historical baseline. Scoped full-data review verifies only src/collision/hurt change at each reused neutral, all other frames/fields exact, no critical/high findings. Tmux updated to `walk-hand-consistency/right-hand-continuity-review.png`; two fresh headed gyms confirm hit0->17 and victory0->29 playback, reviewedfalse. Evidence, scope hashes, audit measurements, native proofs and retained pre-copy table are in `walk-hand-consistency/`. Art/timing/box owner review and main adoption remain open.

### 2026-10-06 owner feedback: slower aircraft and jab frame5

Owner requested aircraft flyby “about1sec” and removal of hanging-arm jab “frame5.” Effect presentation now spans all56 existing special ticks (26startup+8active+22recovery,56/60=0.933s at1x; hitstop freezes it). Same four PNGs, path/height, normal facings, static reduced-motion frame, interruption/terminal/missing-image guards preserved. Combat damage30/cost70/active8 and all animation/tuning JSON in main unchanged. Effect module/test synchronized to review; RED2failures because startup was invisible, then GREEN6tests. Main npmruncheck PASS lint/types/930tests81files/build. Review28focusedtests3files PASS, validator62clips208frames140drawings/0errors41existing review warnings. Prior layout proofs remain applicable to unchanged PNGs/path/geometry; widths were not rerun for this bounded duration change.

Added only reviewedfalse `jab-right-hand-recovery-candidate` to the review gym: exact approved jab, last recovery src replaced with existing corrected coffee-holding idle; all3/3/3/4/6holds and collision/hurt/attack boxes exact. Original61entries and main approved jab preserved. Five-drawing19tick sequence audit PASS (frame5torso52 versus51,1px horizontal return, feet119/height104). Owner gym tab had unsaved jab loop=loop and refused Save because move clips require once. Captured complete unsaved61clip payload without server write by temporarily selecting once for snapshot and restoring loop; raw captured table records original loop. Original tab left intact; corrected frame5 opened in a separate gym.

Four native cases PASS bothsides/reduced: actual aircraft painted on each0..55special tick across all3phases at expected path/four normal sources or static reduced source1; no aircraft after special/reset. Damage30/cost70 exact. Actual jab final recovery paints corrected neutral, old hanging-arm PNG never paints, reload clears temporary rehearsal bindings. First verifier counted stale paints during Step clicks; corrected fresh paused repaint sampling, then allcases PASS. Scoped independent review no findings; main6/review28tests and exact data-preservation checks independently passed. Latest headed review arcade reopened with ephemeral current whole-set overrides, corrected jab binding and slower aircraft, all140sprites/4FXloaded and arena focus/unpaused verified. Reload still clears draft selection; main jab adoption awaits owner pose review. Evidence: `aircraft-one-second/` (before sources/table, RED/GREEN/fullcheck, candidate, audit, four native proofs, owner draft snapshot, independent review). No source pixels painted, no commit/publication.

### 2026-10-06 corrected jab frame5 accepted

Owner responded “looks better” after the explicit keep/revise frame5 review prompt. Adopted only main Captain jab frame5.src from the already-proven corrected candidate. All holds, poses, phases, collision/hurt/attack regions and existing box signoff are exact; no tuning or other main clip changed. Retained original table/source bytes and the complete owner unsaved gym snapshot. Review corrected copy now inherits unchanged approved-box signoff. Main focused25tests3files and validator0errors PASS; four prior native corrected-source cases apply to the exact adopted drawing/fields. Prior full930check remains the baseline before this single source-field change. All other Captain gates remain pending. Sam's new Non-Profit Pivot is documented as a proposed design only in plans/0056; no Sam rule/art/input changes.

2026-10-06 resumed completion audit: previous ordinary Sam work did not complete Captain owner gates. Current13family manifest hashes all selected sources/holds/flags/main bindings:4accepted families,9pending owner families; goal remains unachieved. New corrected-idle/revised-forward/back art and box package shown in tmux; fresh current native jump/flyby playback works with155drawings/4FX and unchanged30damage/70cost. No main Captain table/tuning edits or inferred approvals. Technical baseline now949main/962reviewchecks after Sam; final whole-set adoption proof remains conditional on owner review. Audit evidence current-goal-audit/. Fresh resumed owner-dependency audit count1; current turn concrete audit/presentation progress.

### 2026-10-07 resumed goal: accepted movement and reactions adopted
Previous goal turn was no progress at the required owner-review gate; resumption resets blocked audit. This turn makes authoritative progress: exact previously approved idle/forward/back art/holds/boxes are canonical; old versions retained disabled. Native12cases bothfacings/reduced/375/768/1440 prove all4walk poses,3breathsources/staticneutral/reload; main966 and review979 checks passed. Added accepted movement tests and explicit missing-walk/special fixture coverage, preserving prior review-specific tests under separate names. Free-form provenance stays in receipts because animation parser strips unsupported notes; persistence RED→GREEN15checks.

Owner approved all3 heavy-block/hit/jump art and boxes in current tmux/gym batch. Adopted exact rows and boxes; native8reactioncases and4jumpcases PASS, health/stun/jump/core/tuning unchanged. Earlier accepted jab frame5 synced to review with src-only delta; old PNG and before table preserved. Owner approved7flyby art/bodyboxes; canonical special registered captain.flyby with exact26/8/22/30damage/70cost; actual7PNG poses and56aircraftticks onboth sides/reduced/restart/reload PASS. Remaining owner gates are victory/knockout, shown with approved idle and explicitholds. Both are review-only until accepted. Native8terminalcases show3normalbeats or static finalpose.

Browser plugin unavailable; regular Playwright fallback. During staging, direct dynamic imports can create a second Vite module state after HMR; saved review-only outcome bindings now make actual artwork proof independent of preview-module aliases. Engine already clears terminalhitstop; no speculative flash code change. Restore missing exact approved Booster PNG in live review fixture (200HTML fallback hadhiddenmissingfile); mainPNGbytes/approvedart unchanged.

Remaining work: final two owner art/box decisions, adoption, whole-set negative/native/keyboard/resize/reload proofs, asset gates/fullchecks, one final scoped fresh review, complete requirement audit and verified recovery. No commit/publication.

### 2026-10-07 review progress and gate corrections
Owner approved heavy-block/hit/jump and all7flyby character poses/bodyboxes. Main has10authored Captain clips plus accepted aircraft; victory/knockout still await the final paired review. New stageWide metadata marks Captain flyby as existing stage-wide reach effect, so validator requires hurt regions/timing and refuses local melee strike boxes; numeric tuning/rules unchanged. New validator test RED→GREEN,63focusedtests; forty selected canonical frames pass fullcolor with walk-forward/back torso-mode gates against accepted neutral, all3sequenceaudits pass. Main animation validator0errors/10existingunreviewedwarnings. Do not weaken walking foot-pivot gate: use existing in-place torso mode for intentional alternating planted feet.

Fresh current proofs:24native/keyboard jab/heavy hit/block/whiff cases, bothfacings and bothmotion settings, exact5/1jab9/2heavy; singlehits, no staleattack. Twelve responsive movement/reload cases; twelve jab/heavy keyboard/reset/missing-active/interruption cases;8reaction and4jump native cases;4defaultspecial cases assert every7characterPNG/56aircrafttick,30damage/70cost and correctjabframe5. Gym keyboard/nudgeUndo/onion/opponent/play/invalidSave/fit proof at1440/768 and playground liveedit/reset/candidate/collapse proof pass, no console errors. Readiness timeout identified exact approved Booster PNG absent in live reviewcopy; copiedunchangedbytes, no mainart edits. Terminal preview was stale module-state, not flash bug; saved unreviewed outcome rows in separate review ensure actual3PNGbody drawing. Bothoutcomes8nativecases PASS includingstaticfinal/reload; ownerdecisionpending.

No-progress audit: this resumedgoalturn remains progress, with authoritative adoption and new evidence. Goal active; remaining human gate2families, finalchecks/review/checkpoint/audit follow. No budget/commit/publication authorization inferred.

Final scoped review: one Important anticipatory-brace parity finding. Ruling: keep Captain's approved retreat under incoming startup heavy; exempt him from cosmetic cue used by other fighters. Cost if wrong: cue label changes; sprite/rule parity and existing other-fighter cue preserved. Regression RED→GREENbothsides/motion;38focusedtests pass,8realhit/blockcases assertcorrectwalkingbodyduringincomingstartup thenall3reactionposes/idle. No further reviewer findings/minors. Declined visualacceptance/completion are reserved to owner/requirementaudit; browserextra rerun limitation covered by root's actual proofs.

Current final source checks: lint(active source; immutable preview archives excluded),types,all969main/88files and982review/90files,build PASS. FullstageWide validator test RED→GREEN; tableau0errors10existingunreviewedwarnings. Legacy tests assumed Captain special/jump absent; updated authored-state expectations while explicit mock-based missing-special/walk/outcome cases keep negativecoverage. No tests weakened to silence a live mismatch. Tuning/core/allnonCaptainrows exact, fighters onlystageWide metadata added,249CaptainPNGhashes unchanged. Twelve layouts/movement/reload,24connects,12interrupt/fallbackcontrols,4flyby/8reaction/4jump/8reviewoutcomes, gym/playground/resize proofs saved. Victory/knockout owner review remains pending; full goal NOT complete.

Captain continuation recovery verified: 265 overlay files, archiveSHA2562d5e88a7da03c2e9a08a9ce43a698902dec73014e23e36ccdee4066b491c53e6; parent archive and all extracted file hashes verified. Fresh main/review normal arcade, canonical accepted Captain clips/holds,30damage/70cost flyby, unchanged Sam63HP/50meter theft/237timing and gym idle120 reopen PASS; no browser errors. Checkpoint: /mnt/2TBHDD/CockpitEscapeRoom/.worktrees/animation-workflow/preview-renders/mars-arcade/captain-full-set-2026-10-05/final-proof-20261007/checkpoint-20261007T084106Z. Owner gym form/art draft captured. Current goal turn is progress; final2outcome owner decisions pending, so goal remains ACTIVE and unachieved. Final code reviewer completed, one Important fixed; no deferred minors. After approval, adopt exact stored rows, rerun affected/full-state checks and save final checkpoint.

Resumed blocked audit2 (2026-10-07): previous goalturn was progress—10Captainfamilies plus aircraft adopted, one Important drawing/rules mismatch fixed, full source checks969/982 and native proofs passed,265file recovery freshly reopened. This goalturn revalidated currentmain/reviewcode/table bytes against checkpoint084106Z, its archiveSHA2562d5e88a7da03c2e9a08a9ce43a698902dec73014e23e36ccdee4066b491c53e6, fresh-reopenproof and249CaptainPNGhashes. All unchanged. Main victory/knockout remain absent; review rows remain unreviewed. No owner answer to the final paired art/box/pacing request has arrived. No independent implementation or rerun can satisfy that human gate. Current turn no progress toward acceptance; goal remainsACTIVE until ownerdecision or audit3 threshold. Keep existing request pending; do not duplicate question or regenerate approved drawings.

Resumed blocked audit3 (2026-10-07): priorgoalturn no progress. Samefinalvictory/knockout owner art/box/pacing gate revalidated for third consecutivegoalturn of this resumedrun. Current main/review animation bytes equal verifiedcheckpoint084106Z; mainoutcomes absent and reviewflagsfalse, archivehashvalid, no owneranswer received. Independentcode/art/gates/tests/review/recovery work completed before asking. Adoption and finalwhole-set completion depend on this explicit ownerdecision; no further independent safe action can satisfy it. Markgoal BLOCKED, not complete. Existing request and owned tmux outcomes sheet remain available; no duplicate question, regeneration, test repetition or publication.


2026-10-07 final owner approval and adoption: owner replied `approved` to the paired victory/knockout art, boxes and pacing request. Adopted the exact shown sources/holds/regions into MAIN and marked matching REVIEW rows accepted, retaining originals and older candidates. All12canonicalCaptainfamilies now reviewed/equipped in both roots, plus the approved4frame aircraft effect. Native8mainoutcome cases prove actual three-beat body PNGs on both sides, reduced-final, real KO and reload. MAIN969tests88files; REVIEW982tests90files; `npm run lint -- --ignore-pattern 'preview-renders/**'`, typecheck, test and build all PASS in both roots. Immutable preview/recovery snapshots excluded from source lint; no code scope exclusion. All46canonical frame slots pass unchanged fullcolour gate, torso-reference mode for walks; all12sequence audits PASS. Main validator46clips/152frames/132drawings,0errors/10existingwarnings; review77/261/156,0errors/32warnings. Warnings are retained disabled candidates (including older sight feet-off-baseline) and unrelated Booster/Oracle boxes; every equippedCaptainfamily accepted. All249CaptainPNGbytes preserved; nonCaptainrows and combat code exact to verified parent. Final scoped review already covered these exact outcome rows; its one Important retreat/art-rule parity finding fixed RED->GREEN and browser-proved. Evidence: `preview-renders/mars-arcade/captain-full-set-2026-10-05/completion-20261007/`. Final recovery clean reopen follows; no commit/push/deploy/publication or production cabinet milestone claimed.

2026-10-07 completion: all12Captainfamilies and4FXframes owner accepted and equipped. Four further native375px timer/draw cases pass normal/reduced motion, final salute/resting sources and reset. Recovery `/mnt/2TBHDD/CockpitEscapeRoom/.worktrees/animation-workflow/preview-renders/mars-arcade/captain-full-set-2026-10-05/completion-20261007/checkpoint-20261007T164010Z` archive `captain-complete.tar.gz` SHA256 `91441ce610e20d28d3d79e935329fbf3b6a5f9033aa69e1b36993c9cd64cef87`,285overlayfiles, extracted hashes verified and both fresh arcade/gym roots cleanly reopened. Actual Captain30damage/70cost and Sam37damage/50meterseizure preserved. Task7 completed; goal achieved within dev-arcade scope. Final immutable completion record follows with unchanged runtime bytes and fully checked plan.
