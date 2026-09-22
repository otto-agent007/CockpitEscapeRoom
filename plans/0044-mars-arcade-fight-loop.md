# Mars arcade cabinet — fight loop prototype

## 2026-09-22 — Heavy recovery in-between continuation

Goal: improve Booster heavy continuity by bridging the abrupt extended contact to low
follow-through. Owner requested continuing animation work after the reference review.
Scope: one new early-recovery drawing, selected in the existing recovery window; keep
all approved cells (including V4 contact) byte-identical, fixed source scale
14.038461538461538, baseline119/pivot64, 11/4/18 timing, reach38 and damage13.
Use the built-in imagegen workflow and unchanged source-alpha/bilinear normalizer.
No new paid video service, combat tuning, other fighters, production wiring or deployment.
The tutorial video-generation pipeline is a reference, not an available tool here.

Acceptance: new cell passes unchanged asset gate, same foreground arm and body scale
bridge the poses, selector boundaries and original mechanics pass tests, actual browser
shows hit/block/whiff, mirrored motion, pause/step/reduced-motion/fallback and responsive
375/768/1440 layouts. Run npm run check and full-diff review. Save fresh evidence under
heavy-recovery-v1 without replacing earlier screenshots. Maximum initial generation plus
two focused corrections; stop without integrating if the cell cannot pass.

Progress: one new cell generated on first attempt, normalized and integrated only into
frames15–18. Approved art/rules unchanged. Unchanged asset gate passes; selector RED→GREEN;
final fullcheck745tests/60files plus lint/types/build PASS. Browser continuity2/heavy13/
exchange7/movement5/pilot12/outcomes7 PASS. Outcome checker repaired for pixel-font renderer,
with browser-only moved-banner mutation rejected. Fresh before/after normal and half-speed
recordings, responsive captures, hashes and sidebar comparison saved under heavy-recovery-v1.
Full-diff self-review found no critical/high finding. No deploy or whole-journey proof.
Remaining delta: owner visual acceptance; further in-between polish, specials, Oracle/Captain
outcomes and existing eye-tint concern. See asset-reports/mars-arcade-heavy-recovery-2026-09-22.md.


## 2026-09-22 — Animation checkpoint PR handoff

Owner authorized a new draft PR after PR73 merged. Branch
`feat/mars-arcade-animation-checkpoint` starts from main14eca18. Publish selected
runtime/source assets, regression fixtures, prompts, implementation and current browser
evidence; preserve excluded experiments in the existing local worktree. Fullcheck after
base update passes705tests/57files plus lint/types/build; Python asset regressions pass.
The dev harness stays outside production. Draft status records unfinished animation
and owner visual review. Publish, inspect hosted status once, then hand off without merge.

## Latest continuation — 2026-09-21

### 2026-09-22 — Booster round outcomes continuation

Resume approved Wave1 win/ko design: three victory poses and comic recoverable knockdown.
Reuse approved recoil for initial off-balance KO; generate five other drawings. Initial
sample: three win poses plus seated KO. Preserve all existing sprites, fixed scale,
contract and rules. No pixel edits, dependencies or deployment. Engine frame freezes
at round end: separate presentation clock must respect pause/step/speed/reset. Winner
celebrates on KO/timeOver; only KO loser sits down, not healthy timeOver loser/draw.
Reduced motion uses settled poses immediately; Sam/Captain retain explicit fallback.
Done when unchanged asset gates, branch/clock tests, native-input terminal-round browser
proof in both facings, fullcheck, review and sidebar evidence pass. Two corrections
per failed source maximum; no gate weakening. Existing heavy contact stays unchanged.

Progress: five new selected cells plus reused recoil are integrated as three-beat
victory/knockdown,38unique runtime sources. Nine raw generations and all corrections
preserved; zero manual pixel edits. All five pass the unchanged gate and V4contact
checksum remains identical. Five new tests RED then GREEN; fullcheck696tests/56files,
lint/types/build PASS. Native KO/timeout/missing-art and both-facing motion evidence
saved, including pause/step/half-speed/reset/reduced-motion and375/768/1440layouts.
Adjacent heavy13/continuity2/exchange7/movement5/pilot12 browser groups pass.
Independent review found no blockers; its banner-overlap finding was fixed with a
new RED/GREEN browser assertion. Recording23.28seconds, both winners; sidebar refreshed.
See `asset-reports/mars-arcade-outcomes-2026-09-22.md` for provenance and limitations.
Remaining delta: owner visual judgment, Sam/Captain outcomes, specials, effects,
in-between polish and existing eye-tint concern. No production wiring or deployment.

### Owner correction — Booster heavy arm continuity

Latest owner decision: “1 pixel is good enough.” Accept V4 C2's34px art reach as an
explicit exception to the prior35px minimum for this contact only. Do not change the
38px gameplay reach, timing, normalizer, global contract or other assets. Integrate
the existing C2 bytes; no redraw or pixel edit. Preserve rejectedV3 and verify five
beats in both facings, fullcheck and browser heavy outcomes with freshV4 evidence.
The following entries record earlier checkpoints, superseded by this decision.

Integration complete: C2 copied exactly into selected contact, no other art/code rules
changed.4selected cells pass; fullcheck691tests/55files plus lint/types/build pass.
Heavy13/frozen-five-beat2 browser groups pass; both-facing normal/half-speed videos
saved and frame samples inspected. Sidebar refreshed. Independent review no new
blockers. Owner reach exception recorded in V4 report; full motion polish and eye-tint
concern remain open. No deployment or whole-game validation claimed.

Owner approved the initial V4 arm shape as better. Preserve that anatomy while fixing
source dimensions and reach; approval is not yet runtime-scale or playback acceptance.
Next correction uses a portrait-format joint guide, the unchanged normalizer and reach
limits. No new pixel-repair or eye-cleanup permission is implied.

C1 portrait corrected reach36 but remained undersized(height89). C2 preserves the
straight arm direction and restores body size(height104 beside103startup), no holes,
but fist reach34 remains below35–41. Two corrections preserved; batch stopped without
runtime integration or relaxed limits. New report: mars-arcade-heavy-contact-v4-2026-09-21.md.
Sidebar shows C2 alongside all five poses. Further targeted reach correction pending
owner direction; no browser/fullcheck rerun or completed animation claimed this turn.

Owner rejected V3 contact too. Do not mark it accepted based on passing reach/alpha or
reviewer non-findings. Restart V4 from startup identity and an original explicit joint
guide: slightly bent, straight tapered upper arm/forearm with aligned wrist; torso lean
supplies reach. No more edits derived from the bowed V3 sleeve. New source canvas may
be1536square but body scale remains14.038461538461538. Eye-cleanup Python permission
still absent; only V2(70,31) and V3(74,67) alpha repairs were individually authorized.

V4 initial source now exists at booster/generated/heavy-contact-v4/active-00.png.
Original SVG/PNG joint guide and exact prompt saved under prompts/heavy-contact-v4/.
It uses a simpler straighter arm, shown full-size in the owned sidebar for explicit
anatomy feedback BEFORE further integration. Generator returned1280square, not requested
1536square: fixed-scale normalized height84 and fist reach44 (target35–41), so it is
NOT integrated despite passing alpha/silhouette gate. Do not retune scale or reach to
accept it. Next step after owner anatomy feedback is a portrait-format guide/redraw
preserving proper body-part scale. V3 remains only the rejected dev-preview contact;
V4 initial anatomy direction is approved, but no complete runtime contact is approved.
Technical validation must not supersede that distinction. Results above supersede
this initial feedback checkpoint.

Owner further rejected V2 contact as messed up. Diagnosis: near upper arm is elongated
to meet reach while torso stays upright; numerical reach and same-arm identity were
necessary but insufficient. V3 must lean torso/shoulder into the contact while keeping
normal limb lengths, fist reach and planted feet. Preserve all V2 sources and the
approved one-pixel repaired copy. Eye-color Python request was NOT approved; owner
instead flagged contact. No eye-pixel edits. Contact remains an open owner visual gate.

Owner rejected the incomplete handoff with “not good enough, do better” and renewed
the repair. V2 changes the art approach: preserve the long near-arm contact reference's
fist location while raising the elbow, move recovery fist clearly across opaque torso,
and add the missing forward-swing drawing before contact. Return-to-guard uses existing
approved guard art late in recovery. Five visible beats within unchanged11/4/18timing:
startup0–6 wind-up,7–10 swing; active11–14 contact; recovery15–23 follow-through,
24–32 guard. No other move changes. Same scale/reach/silhouette gates and originals
preserved. Up to two targeted corrections per new V2 pose; assess failure causes rather
than reroll unchanged prompts. Prove actual motion in both facings before handoff.

Owner saw near-arm wind-up switch into a far-arm jab, and approved fixing that same-arm
wind-up→descending strike→follow-through with the other glove guarding throughout.
Root cause is mismatched drawings, not phase timing: prior automated gates verified
geometry/state but not limb identity across poses. Preserve the existing startup;
generate two replacement contact/recovery sources against that exact startup reference.
Use camera-near/far rather than ambiguous anatomical left/right in prompts/review.
Keep fixed14.038461538461538scale,38±3active reach,11/4/18timing, damage and all Sam art.
No pixel edits, game rules, dependency or production changes. Preserve previous sources,
runtime cells and videos. At most two correction generations per replacement pose.
Done when all three poses visibly trace one foreground arm, active reads descending not
jab, unchanged silhouette/reach checks pass, real browser32source load/hit/block/whiff
regressions plus fullcheck pass, and fresh side-by-side/sidebar/video evidence is saved.
Static geometry/tests alone cannot close the limb-continuity visual gate.

- [ ] Two replacement sources pass visual arm tracing, silhouette and active reach.
- [ ] Versioned runtime selection, regressions, independent visual review and video.

Attempt budget exhausted without a passing replacement: initial and two corrections
per pose preserved (six sources/six normalized cells). Final contact visibly uses the
same foreground arm and descends, but fist reach27 is below35–41; silhouette max29 is
the boot. Recovery retains two tiny alpha holes. No runtime switch, gate weakening,
scale change or pixel repair. RED source-version probe was restored to current-runtime
expectation; existing4heavy tests pass. Independent static review confirms same-arm
improvement and both unresolved failures. Sidebar shows before/final candidates; no
corrected-motion video or fullcheck rerun claimed. Next owner-authorized art pass must
retain arm identity while achieving reach and clean recovery alpha. See
`asset-reports/mars-arcade-heavy-continuity-2026-09-21.md`.

### Heavy attack continuation

Goal: replace standing-placeholder heavy attacks with Elon overhand and Sam low sweep.
Context: existing staticFire11/4/18 reach38 and hardCutoff13/3/20 reach40; approved
likenesses/clothes and26-cell movement pilot. Continue existing prompt-pack move design.
Scope: three key poses per fighter (startup/contact/recovery), six cells and selector/tests.
This is a key-pose pilot, not the complete five/six-drawing contract; leave that budget intact.
Constraints: fixed source scales, baseline119/pivot64, unchanged silhouette gates,
active reach within3px; Sam sweep must read low. No game rules, prior art, pixel edits,
dependencies or production wiring. Preserve all prompts/attempts. Maximum two corrective
generations per failed pose. Stop/report failed art at cap; never relax checks to integrate.
Done when real native heavy controls draw all phases, block/hit/whiff and defensive
priority work in both facings/reduced motion; prior exchange/jumps regressions, fullcheck,
responsive375/768/1440, missing-art fallback, independent review and sidebar evidence pass.

- [x] Six passing normalized cells; active reach measurements.
- [x] RED/GREEN phase selector, real-engine priorities and heavy outcomes.
- [x] Browser/visual proof, full check, review and evidence update.

Six key poses integrated,32runtime sprites.13raw sources/prompts retained: six initial,
four first corrections, three second corrections. All six selected cells pass unchanged
full-colour gates; active reach40Elon (38±3) and42Sam (40±3). Fixed scales retained.
Dynamic lean/crouch poses are not standing clips: heights103/101/103Elon,92/73/103Sam.
No pixel repair, rule change, contract relaxation, production wiring or deployment.
Four tests RED then GREEN; full691tests/55files, lint/types/build pass. Browser heavy
13PASS groups (two players × hit/block/whiff × reduced-motion plus fallback), existing
exchange7/movement5/pilot12 PASS groups at32sprites. Centered hit/responsive proof replaces
earlier wall-clipped hit captures; wall setup retained only for guarding. Native half-speed
motion recording saved. Independent read-only review found no blockers and verified gates,
copy identity and rule preservation. Heavy in-betweens, specials, outcomes, FX, Captain
animation and Sam jump polish remain; no full-animation or owner motion approval claimed.
See `asset-reports/mars-arcade-heavy-2026-09-21.md`.

### Remaining animation continuation — movement and jumps

Owner requests continuing remaining animations. Resume the existing move/pose plan with
Sam forward footwork (two planted shuffle poses matching the existing two-pose cadence)
and both fighters' three airborne poses (rise/apex/fall), then remaining attacks/outcomes.
Goal: eliminate standing-cutout jumps and Sam forward sliding in the dev harness.
Preserve identities, wardrobe, fixed scales, Sam40/Elon41 reach and every other fight rule.
Only presentation/state selection and evidence change; no production wiring or dependency.
Airborne drawings retain body-part scale but may be shorter from knee tuck; do not apply
standing-height checks to airborne clips. Lowest sole baseline119/pivot64 still required.
Editable default: apex when absolute vertical velocity <=0.6; otherwise rise/fall by sign.
At most two corrective generations per failed pose; preserve all candidates/prompts.

- [x] Eight new cells, fixed-scale normalization and unchanged geometry/silhouette gates.
- [x] RED/GREEN selectors for both facings, defense priority, reduced motion and landing.
- [x] Native browser movement/jump proof, counterattack regression, full check and sidebar.

Integrated26runtime cells. Five new tests RED then GREEN;66focused tests and full
687tests/54files plus lint/types/build pass. Type checking caught widened map-array
indexing; fixed at source with fixed-length tuples, not downstream non-null assertions.
Movement5/exchange7/pilot12 browser PASS groups;375/768/1440 screenshots inspected.
Eight new cells pass the unchanged full-colour arcade gate; all selected copies verified.
Twelve generated sources and exact prompts preserved (eight initial, four corrections).
No pixel edits, rule changes, dependencies, production wiring or deployment in this pass.
Independent review found no blocking code issues; Sam rise proportions and apex-to-fall
extension remain a visual polish item, not owner-approved smoothness. Saved half-speed
native-input recording and sidebar pose sheet. Evidence and provenance:
`asset-reports/mars-arcade-movement-2026-09-21.md`.

Done when both forward footwork cells and all six jump poses draw in real gameplay,
landing returns to grounded art, prior attack/defense priorities remain intact,26images
load, full checks and responsive/reduced-motion/fallback proof pass. Keep full animation
completion distinct from this batch; heavy/special, end poses and FX remain next.

### Sam counterattack — owner approved

2026-09-21 owner decision supersedes the34px art target below: keep the clean jab02 drawing
and match Sam's actual reach to40px. Damage4/chip1 and timing5/2/8 stay unchanged. No further
generation or Python pixel repair. Integrate the five passing cells, append a Sam block/hit
sequence after the existing290-frame exchange, and retain the original beats unchanged.
Acceptance: Sam hits at39/40, whiffs at41 in both facings; unchanged attack duration/damage;
18images load; actual replay shows both fighters block/hit and returns idle; full checks,
responsive/reduced-motion/fallback browser evidence, independent review and sidebar.

Owner accepted the guarded footwork and approved Sam wind-up/jab/recovery plus Elon
block/recoil. Goal: both fighters visibly participate in the dev exchange. Preserve all
accepted identities/outfits, existing art, fixed scales (Sam13.60576923076923,
Elon14.038461538461538), combat rules and Elon41px jab. Sam active fist must match
existing34px reach within3px; timing5/2/8 and damage4/chip1 remain unchanged.
New sources/prompts live in counterattack-v1 folders; no pixel editing or gate changes.
Allow at most two corrective generations per pose. No forward Sam walk, other moves,
FX, production integration, dependency changes or deployment.

- [x] Generate five sources, fixed-scale normalize, pass unchanged silhouette/standing gates.
- [x] RED/GREEN selector and real-input counterattack replay, preserving first exchange beats.
- [x] Full check, browser responsive/reduced-motion/fallback proof, motion evidence, review/sidebar.

Completed after40px approval:five byte-identical selected copies integrated,18loaded assets.
Focused61tests and full682tests/53files plus lint/types/build pass. All18sprite gates,Python
regressions,exchange7/pilot12 browser PASS groups pass. Block167/hit227 retained; Sam
block336/hit416; both idle460. Normal/half-speed videos saved. Independent review found no
blocking issues; production exclusion/whitespace checks pass. Sidebar shows actual Sam hit.
No full animation or production completion claimed; see current counterattack report.

Historical pre-approval art checkpoint: eight raw/normalized outputs and exact prompts saved. Four poses
pass; Sam jab reach39 ->27 ->40 remains outside34±3 after the two-correction cap. Original
recovery's two holes resolved by the first targeted generation. No manual edits or runtime
integration. Sidebar contact sheet saved; source report records hashes and unchanged checks:
`asset-reports/mars-arcade-counterattack-2026-09-21.md`. Pause for bounded repair direction;
the TDD/integration/browser checkpoints above remain unstarted. Prior footwork accepted by
owner's "all good"; this new pass is not complete.

Done when five cells pass, actual engine phases select the new poses in both facings,
the native replay shows Sam blocked and landing a hit, and all relevant checks pass.
Update source report, TEST_REPORT and this plan with actual results and remaining delta.

### Sam guarded footwork — owner approved

Owner approved two guarded backward-shuffle poses after the sleek41px jab checkpoint.
Goal: Sam steps backward during the existing exchange rather than sliding in one fixed
guard drawing. Preserve likeness, sweater/lanyard/trousers/sneakers, existing repaired
block/recoil, all Booster/Captain art and every combat rule. Scope: two sprite sources,
fixed-scale normalization, dev selector/tests and browser/evidence updates only.
No forward-walk animation, new attacks, arena/FX, production wiring or deployment.

Done when both128px cells pass unchanged standing/silhouette gates at scale13.60576923076923,
baseline119/pivot64; real guarded walking cycles both poses while blockstun/recoil retain
priority; reduced motion preserves essential footwork;13runtime assets and full checks pass;
actual browser sequence and saved motion evidence are shown in the existing tmux pane.
At most two corrective generations per pose; no new manual pixel edits authorized.

- [x] Generate, normalize and validate the two separate Sam guarded-shuffle sources.
- [x] Test-first selector integration, defensive-state priority and13-source loading.
- [x] Full checks, browser/motion proof, independent review, sidebar and evidence.

Both first outputs passed:104px standing height, baseline119, unchanged scale and gates.
No corrections or manual pixel edits. Regression RED on fixed guard then GREEN;52focused
tests, full673tests/53files, lint/types/build pass. Browser exchange6/pilot12 PASS groups
and real-time videos confirm both guarded-shuffle poses, block167/hit227/idle290 with
unchanged rules. Independent review found no issues and separately validated both cells.
Current evidence/provenance: `asset-reports/mars-arcade-sam-footwork-2026-09-20.md`.
Full animation and owner motion acceptance remain open; no production integration/deploy.

### Sleek wardrobe — owner-approved propagation

Latest owner decision: "41 is ok" explicitly accepts the final clean jab's41px extension.
Use41 for both visible reach and game reach; preserve damage5, chip1 and timing4/3/7.
This supersedes the36px target below, not the unchanged silhouette/height/pivot gates.
Six other wardrobe cells already pass; the final jab passes silhouette/standing checks
at105px tall and reaches exactly41px. No further image generation or pixel repair needed.

Owner response: "looks good" approves carrying the preview outfit across the existing
Booster exchange poses. Goal: one consistent black-leather/charcoal wardrobe during idle,
shuffle, startup, longer jab and recovery, without changing Sam or Pop T. Preserve approved
likeness, existing sources, fixed scale14.038461538461538, approved reach41 and unchanged damage/timing.
Done when seven Booster cells pass unchanged gates, jab reaches41±3px, the selector never
switches back to the old outfit, real browser exchange/missing-image/reduced-motion checks
and full check pass, and fresh visual evidence is shown in the owned sidebar. No new actions,
main-journey integration or deployment. Use at most two corrective generations per new pose.

- [x] Approved anchor normalized at fixed scale:104px high, baseline119, unchanged gate passes.
- [x] Generate and validate six matching animation poses; preserve originals and exact prompts.
- [x] Integrate all seven together, including dedicated recovery; tests, browser proof and review.
- [x] Update evidence and show actual game-size result in the sidebar; normal/half-speed videos saved.

Completed bounded checkpoint: seven Booster cells pass every unchanged gate, final jab105px
tall/41px reach; all eleven loaded cells pass. Focused51 tests and full672tests/53files,
lint/types/build pass. Browser exchange6/pilot12 PASS groups, independent code review
no findings, production exclusion and whitespace checks pass. Details/provenance:
`asset-reports/mars-arcade-sleek-jab-2026-09-20.md`. Final motion acceptance remains the
owner's decision; full Wave1 and production integration remain unfinished.

Regression test recorded RED: outfit continuity and dedicated recovery selection fail as
expected against old sprite paths; focused engine/exchange tests continue to pass (49pass,
2expected failures across51 focused tests). The earlier preview record follows for provenance.

Owner approved seeing the proposed fitted black leather jacket, dark T-shirt, charcoal
jeans and black boots before propagating the outfit across poses. Generated one separate
identity-preserving candidate with the built-in image tool; removed the orange headphones,
rocket patch, orange lining, cargo pockets and tan boots. Black gloves complete the outfit.
Source: `art-source/arcade/booster/generated/wardrobe-sleek/anchor-00.png`.
Exact prompt: `art-source/arcade/prompts/wardrobe-sleek/anchor-00.txt`.
Inspected the full-size output and updated existing tmux sidebar pane `%1`.
The output is 1024x1536 RGBA with alpha extrema 0..254; the visible background/halo still
needs sprite-readiness inspection before normalization or integration. This is an outfit
concept only, not an accepted runtime sprite. No runtime files changed in this preview pass;
no normalization, pixel gates or gameplay checks rerun during that preview-only pass.
Owner outfit approval is now received as recorded above; longer-jab work resumes with it.

### Earlier longer-jab brief — completed with owner-approved41px wardrobe pass above

Owner feedback: the current bent-arm jab looks too small. Approved design: extend the arm,
drive the shoulder forward, add a distinct pullback, and increase actual reach30→36 while
preserving damage5, chip1, timing4/3/7, identities, fixed normalization scale, and pixel gates.
Goal: a visibly committed punch whose visible extension and hit range agree. Scope is the
existing dev exchange, move content, sprite selector, tests, prompt pack and evidence; no
Sam footwork, other attacks, stage work, production wiring or deployment in this pass.

Done when the new active fist measures36±3px from pivot, source/normalized candidates remain
separate from the previous pass, real hit/whiff boundary tests cover both facings, recovery
art follows actual move phase, unchanged checks pass, and browser comparison/motion proof is
shown in the existing tmux pane. At most two corrective generations per new pose.

- [x] Longer active pose and dedicated recovery generated, normalized and validated in sleek set.
- [x] Reach41 supersedes36 by owner approval; synchronized art/recovery, spacing, tests and prompts updated.
- [x] Browser proof, full checks, review, sidebar and evidence recorded in sleek-jab report.

Wardrobe feedback arrived during generation: owner says Elon needs better clothes. Preserve
the jab36 candidates and settle a new outfit before propagating additional animation art.
In-progress state: reach36 and revised recorded approach pass the focused43 tests; the
distinct-recovery selector test is deliberately RED until art integration. Active00 passes
silhouette checks but reaches41px and is only100px tall, so is rejected; active01 is saved
but unnormalized. Recovery00 is103px tall but fails one tiny transparency-hole check.
Both exact corrective prompts are saved. No new poses have been added to the runtime manifest,
and no full check or completion is claimed for this interrupted jab/wardrobe pass.

### Owner-directed exchange revision

After judging the pilot as needing substantial work, the owner approved focusing on one
exchange: approach, punch, block, hit reaction, recovery. Goal: replace the static-cutout
feel for that sequence in the existing dev harness. Preserve identities, fixed scales,
unchanged sprite gates, pure fight rules, native controls, reduced motion and production exclusion.
First diagnose the jab's remaining hole and source registration; make one targeted art repair
and a compact shuffle pair, plus Oracle block/recoil poses. Use existing clean anticipation
and guard drawings for recovery. Cap this pass at two corrections per new candidate.
No arena/roster expansion, heavy/special animation, production wiring, or deployment.

Done when that sequence uses actual pose changes synchronized to engine startup/active/
recovery and hit/block states; all integrated cells pass gates; a repeatable native preview
demonstrates both block and hit using the real rules; tests/browser checks and moving visual
evidence are recorded and shown in tmux. Full Wave 1 remains a separate unfinished milestone.

- [x] Exchange source repairs and fixed-scale validation: ten raw candidates preserved;
      all ten integrated cells pass. Owner explicitly approved two exact one-pixel repairs
      after Oracle reached its correction cap. Original hashes and all other pixels preserved.
- [x] Engine-driven pose selection, fixed-step walk phase, short review playback: real block167,
      hit227, idle290; half-speed native review plus free play. Browser crowding finding fixed
      by shortening only the recorded second approach; rules unchanged.
- [x] Browser/motion proof, regression checks, review and updated evidence: 664 tests,
      lint/types/build, Python regressions/gates, both browser suites, normal/half-speed videos,
      responsive screenshots and owned tmux sidebar. Independent review findings resolved.
- [ ] Owner motion/likeness acceptance and full Wave1 remain open; this checkpoint is bounded.

The original fight-loop scope below is historical. Owner-approved continuation now covers
likeness art and a dev-only presentation pilot. The earlier invented-only restriction is
superseded by the owner's explicit Elon Musk / Sam Altman likeness request; fighter IDs,
move content, and rules remain unchanged. Latest evidence:
`asset-reports/mars-arcade-exchange-2026-09-20.md`.

**Previous checkpoint outcome:** a replayable short exchange used Booster's planted shuffle,
timed jab/recovery, and Oracle's guard/recoil in the real dev fight loop. The earlier jab
speck is repaired by targeted generation; Oracle's final two specks by explicitly authorized
localized edits. No rejected cells load. Native controls, responsive layouts, reduced motion
and box fallback remain. Full Wave1 is incomplete; smoother transitions, remaining actions,
FX and owner moving-visual acceptance remain. No production integration or deployment.

## Purpose

The Mars Easter egg is currently one config string (`marsRank`). This milestone gives it
something to do: a short, replayable arcade fighter on a cabinet found on the Mars surface,
after the Father's Day message. Two unnamed archetypes trade blows; beating both unlocks a
third fighter, **THE CAPTAIN**, who wins by being unbothered rather than by swinging. The
joke lands as tribute rather than as a bolt-on.

This plan covers the **fight loop only** — the pure rules a fighting game needs before any
art exists. No scene, no sprites, no chapter wiring.

## Current state

- `mars` is already a real phase in `GamePhase` (`src/game/state.ts:60`) and in storage
  schema 15, reached from the reward chapter (`src/game/state.ts:1232`).
- The only Mars content is `marsRank: 'Commander, Mars Transport Division'`
  (`src/game/config.ts:308`). There is no Mars scene, asset, or interaction.
- A production pixel-art pipeline already exists for the TMB2 intro: a 320x224 stage,
  whole-number sprite scales, packed sheets under
  `public/images/intro/tmb2/scramble/sprites/`, a manifest built by
  `tools/assets/build-intro-manifest.mjs`, and prompt packs in `asset-reports/`
  (`popt-frame-prompt-pack.md`, `tmb2-acting-frames-prompt-pack.md`,
  `popt-sprite-contract.json`). Pop T already has `popt-walk` and `popt-run` sheets.

## Scope

**Included** — three new pure modules under `src/game/` plus tests:

- `marsArcadeFighters.ts` — fighter and move content (frame data, reach, damage, meter).
- `marsArcade.ts` — the fight loop: fixed 60 Hz step, frame data, hitboxes, blocking,
  guard meter, projectiles, knockback, round clock, KO and time-over.
- `marsArcadeOpponent.ts` — a deterministic seeded computer opponent.

**Excluded, deliberately** — sprite art and sheets; a Mars scene or cabinet; any React
component; any change to `state.ts`, `storage.ts`, or schema 15; audio; input bindings;
the character-select screen. Nothing imports these modules yet, so nothing ships.

## Context and constraints

- **Architecture.** `src/game/` is pure rules and must not depend on Three.js
  (`docs/ARCHITECTURE.md`). These modules import nothing but each other.
- **Likenesses, approved.** THE BOOSTER is a cartoon likeness of Elon Musk, THE ORACLE of
  Sam Altman, and THE CAPTAIN is Pop T. Owner decision, 2026-09-20, superseding the
  invented-archetypes-only rule of 2026-09-19. The likeness is a requirement and the names
  may appear in prompt text; affectionate caricature only, never unkind, political, or
  implying endorsement of a private non-commercial project. Ids, move names and module
  names stay archetype-named, which is recorded at the top of `marsArcadeFighters.ts` so a
  later contributor does not rename the rules to match the art.
- **Spoiler protection.** The cabinet sits behind the ending, alongside Mars. Nothing here
  may reference the protected ground-transport reward, and none of this content may enter
  the initial bundle or any preload manifest. Verified below.
- **Tone.** Cartoon arcade violence between fictional archetypes. Pop T is never a target
  of ridicule; THE CAPTAIN is the fighter the player earns.
- **Determinism.** The engine contains no randomness at all. The opponent owns a seeded
  generator in its own state, so a seed plus a run of inputs replays exactly. This is what
  makes the loop testable headlessly.

## Progress

- [x] 2026-09-20 — Stage widened to 480 px behind the 320 px screen, with a following
      camera, a five-layer parallax backdrop and contact shadows. See
      *Wider stage, camera and backdrop* below.
- [x] 2026-09-20 — Likeness wording reconciled across the contract, pack, plan, Wave 0
      prompt and `marsArcadeFighters.ts`; the pack no longer rejects the art it asked for.
- [x] 2026-09-20 — HUD rebuilt: portraits, framed bars with a damage trail, a pixel clock
      and round presentation, on a 5x7 pixel font. See *The HUD* below.
- [ ] Optional: replace the code-drawn backdrop layers with generated art, layer by layer,
      to the brief in the prompt pack. Needs `image_gen`, so it belongs to Codex.
- [x] 2026-09-20 — Four source probes plus three corrections saved with exact prompts.
      Transparent sources supported via opt-in alpha import; default exports unchanged.
      Idle passes; jab reaches 28 px (target 30±3) but still fails one-hole gate at retry cap.
- [x] Bounded dev-only pilot: three approved anchors + clean idle frame, explicit anchor
      placeholders for unauthored combat, native controls, mirror preset, image-error box fallback.
- [x] Pilot browser verification at 375/768/1440, reduced motion, keyboard/native/pointer,
      hit/block/jump/landing, pause/step/restart/reload, missing images and box mode.
      Python 3 tests + gate mutation tests, Vitest 657/52, lint/types/build, production exclusion,
      and independent review pass. Full Wave 1 pose/FX and visual acceptance remain unchecked.

- [x] 2026-09-20 — Owner reviewed the cleaned likenesses and said “good job, continue”.
      Wave 0 identities accepted for the next art checkpoint. Proceed with the existing
      Wave 1 Booster mirror-match design; the prior Wave-0-only stop is superseded.
- [ ] Wave 1 source frames: generate the pack's 43 Booster drawings (idle neutral may
      reuse the approved anchor) plus 3 hit sparks and 2 guard sparks. Preserve all
      generated sources and exact prompts. Check a four-frame sample before the full set.
- [ ] Normalize at the fixed Booster scale 14.038461538461538 using bilinear; check all
      frames, grounded baseline, pose bounds, and active strikes at the specified reach.
      Allow at most two corrective generations per failed frame; report unresolved art.
- [ ] Add deterministic presentation-only frame selection and sprite loading to the existing
      dev harness, with box fallback and explicit loading/error state. No fight-rule edits.
- [ ] Exercise the mirror match in-browser: keyboard/native controls, walk, block, jump,
      attacks, both landing outcomes, win/loss, pause/step, restart, missing-art fallback,
      375/768/1440 layouts, and reduced-motion presentation. Record screenshots and show tmux.
- [ ] Full project check, sprite gates, production-bundle exclusion, scoped review and
      evidence update. Stop at the playable Wave 1 visual/feel review before Wave 2 or Mars wiring.
      Pilot evidence above is not a substitute for that complete animation gate.

- [x] 2026-09-20 — Owner says the likeness revisions are closer. Preserve those identities
      during bounded sprite cleanup. Diagnose checker failures, add an opt-in bilinear
      normalisation mode with a regression proving unchanged defaults, re-export using
      each already-derived scale, run the unchanged gates, and refresh the tmux comparison.
      Done when all three cleaned candidates pass the gate, default exports stay byte-identical,
      source images remain unchanged, and fresh project checks plus visual review are recorded.
      This is a normalisation repair within Wave 0; no motion frames or app wiring.
- [x] 2026-09-20 — All three cleaned cells pass the unchanged gate. Resampling regression
      passes 2 tests (three fighters each), source bytes unchanged, default outputs
      byte-identical. Gate negative tests still reject all seven injected defects.
      Fresh `npm run check`: lint, types, 653 tests / 51 files, build (2.41 s), no arcade
      content in `dist/`. Reviewed script diff and clean comparison; sidebar `%1` refreshed.

- [x] 2026-09-19 — Worktree `feat/mars-arcade-fight-loop` created off `origin/main`
      (`7b6a6fa`) at `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/mars-arcade`.
- [x] 2026-09-19 — Content module: three fighters, nine moves, full frame data.
- [x] 2026-09-19 — Engine: fixed step, frame data, blocking, guard meter, projectiles,
      launchers, knockback, round end.
- [x] 2026-09-19 — Seeded opponent with two difficulties.
- [x] 2026-09-19 — 34 tests; 11/11 mutations caught; `npm run check` green.
- [x] 2026-09-19 — Sprite contract and frame prompt pack drafted; the existing python
      normaliser and gate verified against the new contract in both directions.
- [x] 2026-09-19 — Box harness at `/dev/arcade.html`: the committed loop rendered as boxes,
      with hitboxes, frame-by-frame stepping and a live frame-data readout, so the feel can
      be tuned before any art exists.
- [ ] Owner review of the fight feel, the archetype framing, and the three identities.
- [x] 2026-09-19 — Codex handoff written: `prompts/05_MARS_ARCADE_SPRITE_WAVE_0.md`, with
      assembled ready-to-send prompts in `art-source/arcade/prompts/` and the commands in
      `art-source/arcade/README.md`.
- [ ] Milestone 2 — Wave 0 anchors, then sprite generation and the character-select screen.
- [ ] Milestone 3 — the Mars cabinet scene and chapter wiring.
- [x] 2026-09-20 — Continued the explicit Wave 0 handoff with the built-in image generator;
      preserved three attempts per fighter and normalised all three final candidates.
- [x] 2026-09-20 — Derived candidate scales: booster 13.9519 (1451 / 104), oracle 13.5000
      (1404 / 104), captain 13.9904 (1455 / 104). All resulting cells are 128×128 with
      104 px standing height and lowest opaque row 119.
- [ ] Wave 0 objective acceptance: Oracle passes; Booster fails on two transparent specks,
      Captain on one. The two-regeneration limit is reached for each fighter. Art review
      also flags residual soft shading, Booster torso rotation, and uneven boot placement.
      See `asset-reports/mars-arcade-wave-0-2026-09-20.md` before resuming.
- [x] 2026-09-20 — `npm run check` passed lint, types, 653 tests / 51 files, and build;
      completed `dist/` contains no arcade content or dev entry. Static comparison saved
      at `preview-renders/mars-arcade/wave-0-identity-review.png` and displayed in tmux
      pane `%1`. Full scoped diff reviewed. No new gameplay/browser milestone claimed.

## Discoveries

- **2026-09-20 — Transparent specks are introduced during downsampling.** Source mask
  inspection found zero enclosed tiny holes in Booster and Captain. Their Lanczos outputs
  contain three and one respectively, at narrow diagonal gaps. In-memory comparison of
  the same masks and locked scales: BOX still leaves one each, while BILINEAR leaves zero
  and retains a single connected figure. Fix the export step with an opt-in mode; preserve
  the default and the unchanged validation thresholds.
- **2026-09-20 — Premultiplication precision matters at low alpha.** The first bilinear
  implementation removed the holes but exposed 8-bit premultiplied-colour rounding as
  tinted fringe pixels after division by small alpha. Keeping each channel and the mask
  in float precision until unpremultiplication removes the fringe. Real-asset regression
  went from missing-option RED, through chroma-spill RED, to all-green without changing
  the checker or source artwork. The default Lanczos branch is byte-identical.

- **A jump could never clear the projectile as first tuned.** Jump apex is
  `v^2 / 2g` = `4.4^2 / (2 * 0.28)` ≈ 34.6 px, but the text bubble's ceiling was 40 px, so
  the intended jump-over answer was impossible and the zoner had no counterplay. Lowered
  the bubble ceiling to 26 px, which makes a well-timed jump clear it and a mistimed one
  eat it. Covered by *passes under a fighter who is above the bubble ceiling*.
- **Blockstun was dropping the guard.** The input path cleared `blocking` whenever the
  fighter could not act, so a projectile arriving during blockstun counted as a clean hit.
  Blockstun now keeps the guard up, and `applyHit` accepts a block from a fighter already
  in blockstun.
- **Melee and projectile timing disagreed by one frame.** The projectile spawned on
  `startupFrames + 1` while the melee active window opens on `startupFrames`. Aligned to
  `startupFrames`.
- **Projectile moves could also register as melee hits.** `reach: 0` made this harmless in
  practice (pushboxes keep fighters ≥ 24 px apart), but it was latent. Projectile moves are
  now excluded from melee collection explicitly.
- **Reach is centre-to-centre, not box overlap — and it does not look like it.** The harness
  made this visible: at 41.5 px separation with `booster.staticFire` at reach 38, the drawn
  hit region visibly overlaps the opponent's 24 px pushbox, but the move whiffs, because the
  engine compares fighter centres. Classic 2D fighters approximate range this way and it is
  defensible, but it reads as a bug unless it is drawn honestly. The harness now draws each
  fighter's centre line and an end-cap at the reach limit. **Open tuning question for the
  owner:** whether a move should instead reach `reach + pushboxWidth / 2`, so contact lands
  when it looks like it lands.
- **Landing-window frames must be counted from the press.** Counting the stuck-landing
  recovery from the start of recovery rewarded pressing *late*, which is backwards. It is
  now `recoveryElapsed + stuckRecoveryFrames`, so early is strictly better: press at the
  window's open and recovery ends ~26 frames sooner than tipping over.

## Open conflict

`prompts/04_AIRBUS_BONUS_AND_MARS.md` line 18 already claims the Mars Easter egg for the red
Model Y "as a humorous Mars surface vehicle", and `docs/GAME_DESIGN.md` says the same while
noting the design is not finalised. The arcade cabinet occupies that slot. Either the cabinet
sits inside the Mars mission beside the rover, or it supersedes it. **Owner decision, not
taken.** Nothing in Wave 0 depends on the answer, so art can proceed either way, but the
Milestone 3 scene work cannot start until it is settled.

## Decision log

- **2026-09-20 — Continue into Wave 1 after cleaned-anchor review.** Existing fighter rules,
  frame contract and prompt pack specify the design. Native execution in the current worktree;
  reuse the dev harness for a sprite-driven Booster mirror match and preserve its diagnostic
  box option. Load source sprites through dev-only URLs so no future-chapter content enters
  `public/` or the production build. Character select for Oracle/Captain stays diagnostic
  until their later animation waves exist. No paid API, new dependency, publish or deployment.

- **2026-09-20 — Owner supersedes invented-only art direction.** Exact request:
  “we need the caracters to look more like elon and sam altman”. Booster is revised toward
  Elon Musk and Oracle toward Sam Altman; Captain remains Pop T. Existing gameplay ids
  and rules remain unchanged. New likeness candidates are stored separately from the
  earlier attempts. Latest review: `preview-renders/mars-arcade/wave-0-likeness-review.png`.
  Candidate scales: Booster 14.0385 (1460 / 104), Oracle 13.6058 (1415 / 104).
  Oracle passes the sprite gate; Booster fails on three transparent specks. No motion
  generation or production promotion until identity review and sprite cleanup.

- **2026-09-19 — Unnamed archetypes, not real people. SUPERSEDED 2026-09-20** by the
  likeness decision above; kept for the reasoning, which no longer applies. Owner choice. Avoids likeness
  questions on a Vercel preview that is on the public internet, and avoids the practical
  wall where an image generator refuses caricatures of named real people frame by frame.
  Consequence: content, ids, and comments carry archetypes only.
- **2026-09-19 — The cabinet lives behind the ending, in Mars.** Keeps the locked journey
  order and the locker untouched, and needs no schema bump, because `mars` already exists.
- **2026-09-19 — Engine holds no randomness.** The opponent owns the seed. Consequence: the
  whole fight replays from inputs, which is what the mutation testing below relies on.
- **2026-09-19 — Grounded attacks only in the prototype.** No air attacks and no air
  control. Jumping is purely evasive, which still leaves a complete triangle: poke beats
  approach, projectile beats poke, jump beats projectile, launcher beats jump. Air attacks
  are a Milestone 2 question, not a gap to paper over.

## Milestones

1. **Fight loop provable headlessly** *(this plan)* — a round can be played to KO or time
   over entirely from scripted inputs, and the rules are proven by tests that fail when the
   rules break.
2. **The fighters can be seen** — sprite sheets generated through the existing TMB2
   full-colour pipeline (Codex `image_gen`, then `normalise-popt-frame.py` and
   `check-popt-frames-fullcolour.py` against the arcade contract), a character-select screen,
   and the HUD. The contract is `asset-reports/mars-arcade-sprite-contract.json` and the pack
   is `asset-reports/mars-arcade-frame-prompt-pack.md`; 137 drawings in four waves, with Wave
   1 alone yielding a playable mirror match.
3. **The cabinet exists** — a Mars surface scene, the cabinet interaction, chapter wiring,
   persistence of the CAPTAIN unlock, and the accessible native control path.

## Implementation steps

- `src/game/marsArcadeFighters.ts` — `MARS_ARCADE_FIGHTERS` keyed by
  `booster | oracle | captain`; each carries health, walk speed, jump velocity, guard meter
  and three moves keyed `light | heavy | special`. A move is frame data: startup, active,
  recovery, damage, chip, guard damage, reach, max height, hitstun, blockstun, knockback,
  meter cost and gains, plus optional `projectile` and `landingWindow` specs.
- `src/game/marsArcade.ts` — `createMarsArcadeRound`, `advanceMarsArcade(state, inputs,
  elapsedSeconds)` returning `{ state, events }`, and the read helpers
  `marsArcadeTimerSeconds` / `marsArcadeHealthFraction`. Events (`hit`, `blocked`,
  `guardCrush`, `projectileFired`, `stuckLanding`, `tippedOver`, `composure`, `ko`,
  `timeOver`, `roundStart`) are the hook points for sprites and audio later.
- `src/game/marsArcadeOpponent.ts` — `createMarsArcadeOpponent(side, difficulty, seed)` and
  `advanceMarsArcadeOpponent(opponent, state)`; intents held for a fixed number of frames,
  a press cooldown so buttons pulse rather than stick, and a difficulty-weighted answer to
  the booster's landing window.

Commands: `npm run check` (lint, typecheck, 637 tests, build).

## Validation plan

Unit tests only at this milestone; there is no browser surface yet, so a browser gate is
not applicable and is **not** claimed. Coverage:

- round setup, intro handoff, round clock
- walk speed, stage walls, pushbox separation
- frame data: no hit during startup, connects on the first active frame, once per move
- reach: whiff out of range
- blocking: chip damage, blockstun, guard drain, guard crush, guard held through blockstun
- hitstun locks inputs until the stun expires and the button is re-pressed
- meter: specials refused without it, spent when used, banked by attacker and by the
  fighter absorbing damage
- landing window: stuck, tipped, and the recovery gap between them
- projectiles: fire, travel, connect, pass under a fighter above the ceiling, expire
- anti-air: the launcher reaches a rising opponent a ground heavy cannot
- the captain: composure instead of damage; locked until unlocked
- round end: KO freezes the fight; time over awards the healthier fighter; ties draw
- fixed step: long frames clamp, partial frames carry, identical inputs replay identically
- opponent: same seed replays, different seeds diverge, silent before the round starts,
  closes distance, lands damage, and answers its landing window more often as a veteran

**Mutation testing.** Because a suite that passes first try proves nothing, eleven
deliberate defects were injected one at a time and the suite re-run against each.

## Acceptance criteria

- [x] `npm run check` passes: ESLint, `tsc -b`, 637 Vitest tests across 49 files, `vite build`.
- [x] Every one of the eleven injected defects is caught by at least one test.
- [x] The engine imports nothing outside `src/game/` and contains no randomness.
- [x] No archetype string, move name, or module name appears in `dist/`.
- [x] Nothing outside `src/game/marsArcade*` imports these modules.
- [ ] Owner review of fight feel and framing — **required before Milestone 2**.

## Repair loop and stop conditions

Four defects were found and repaired during implementation (see Discoveries), each with a
test that now covers it. Stopping here: the remaining work needs art and an owner opinion
on feel, neither of which a headless loop can settle.

## Evidence

Commands run in `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/mars-arcade` on 2026-09-19:

```
npm run check
  eslint .                          clean
  tsc -b --pretty false             clean
  vitest run                        49 files, 637 tests passed (2.46 s)
  vite build                        built in 2.94 s
```

New tests: 34 (28 in `marsArcade.test.ts`, 6 in `marsArcadeOpponent.test.ts`).

Mutation run — inject, run both new test files, revert:

```
startup gating removed          caught   2 failed | 32 passed
blocking never applies          caught   2 failed | 32 passed
frame-delta clamp removed       caught   1 failed | 33 passed
pushbox separation removed      caught   1 failed | 33 passed
landing window never tips over  caught   2 failed | 32 passed
projectile ignores height       caught   1 failed | 33 passed
specials are free               caught   1 failed | 33 passed
hitstun does not lock inputs    caught   1 failed | 33 passed
reach ignored                   caught   1 failed | 33 passed
opponent randomness collapsed   caught   4 failed | 30 passed
ko winner inverted              caught   1 failed | 33 passed

11/11 mutations caught
```

Spoiler check against the production build — `THE BOOSTER`, `THE ORACLE`,
`ORBITAL INSERTION`, `DC-9 FLYBY` and `marsArcade` are all absent from `dist/`, and no file
outside `src/game/marsArcade*` imports the modules.

### Sprite contract and prompt pack — 2026-09-19

`asset-reports/mars-arcade-sprite-contract.json` and
`asset-reports/mars-arcade-frame-prompt-pack.md`, plus `src/game/marsArcadeSpriteBudget.ts`
and `src/game/marsArcadeSpriteContract.test.ts`.

No new tooling was needed. Both python tools take `--contract`, and both were run against the
arcade contract in **both directions**: a correct 104 px frame on the baseline passed, while a
60 px floating frame and a frame with leftover `#FF00FF` were rejected with the right reasons
(`lowest opaque row is 99, contract baseline is 119`; `standing height is 60 rows, contract
requires 104 +/- 2`; `chroma key leaked onto 2520 px`).

Four drift cases were injected against the contract test and all four were caught:

```
a move is re-tuned without re-reading the art budget   caught   2 failed | 5 passed
a shared clip loses a frame in the contract            caught   1 failed | 6 passed
the stage is widened in code but not in the contract   caught   1 failed | 6 passed
a field the python tools index is renamed              caught   2 failed | 5 passed
```

`npm run check` after the pack: ESLint, `tsc -b`, **50 files, 644 tests**, `vite build` in
2.28 s. The arcade content is still absent from `dist/`.

**Decisions recorded while drafting:** drawings never encode travel (the engine owns x and y,
the opposite of the intro walk cycles); strict side profile facing right with runtime
mirroring; the active-frame striking surface is bound to the move's `reach` within 3 px, and
the drawn strike height is bound to its `maxHeight` band. THE CAPTAIN inherits Pop T's 104 px
standing height and 128 cell unchanged, so the same character cannot change size between
chapters.

**Observed, not fixed:** the closing "When a frame comes back" section of
`asset-reports/popt-frame-prompt-pack.md` still describes the retired 14-colour pixel-art
route, which the rest of that file explicitly supersedes. The arcade pack carries its own
correct rejection list and flags the stale section rather than editing another asset's pack.

### Box harness — 2026-09-19

`dev/arcade.html` plus `src/dev/arcadeHarness.ts` and `src/dev/arcadeHarnessInput.ts`, with
`marsArcadeActiveMove` added to the engine as the read helper both the harness and the
eventual sprite renderer need. Vanilla TS on a canvas, deliberately not React, so a tool
whose whole job is a stable animation loop has no StrictMode double-mount to reason about.

Served only by `npm run dev`. It is not an entry in the production build and nothing in the
application imports it — verified: `dist/` contains only `index.html`, no `dev/` directory,
and none of `MARS ARCADE`, `BOX HARNESS`, `THE BOOSTER`, `arcadeHarness`, `marsArcade` or
`ORBITAL INSERTION` appear anywhere in it.

**Browser evidence** (headless Chromium against the dev server on port 5317, chosen to avoid
a peer session's server):

- The round advanced frame 90 → 216 with no console errors and no page errors.
- Pause held the frame (227 → 227) and `N` advanced exactly one (227 → 228).
- Stepping through `booster.staticFire` read out
  `STARTUP ×11, ACTIVE ×4, RECOVERY…` — exactly its committed `11 / 4 / 18`.
- A connecting hit was captured mid-active-frame: `174 HIT oracle.hardCutoff -11`, with the
  low sweep drawn at its `maxHeight 24` band and the reach end-cap past the opponent's centre
  line. Screenshots in the session scratchpad.

**Two harness bugs found by running it and fixed:** buttons could not be input at all in step
mode, because a tap was released long before the next step sampled the held set — presses
made while paused are now queued for the next stepped frame; and the computer opponent's
intent timer advanced on every animation frame while the fight was paused, burning roughly
600 frames of AI state per ten seconds of inspection — inputs are now sampled only when the
world is about to move.

**Not done and not claimed:** no Vercel preview, no sprite art generated, no scene, no
chapter wiring, no persistence. The harness is a dev tool and has no responsive, reduced-motion
or accessible path, by design. No reach-accuracy checker exists
yet — it is specified in the contract but cannot be written usefully until real frames do.
The fight has never been seen, only proven.


---

## Wider stage, camera and backdrop — 2026-09-20

Owner ask, in their words: *"let's get a new cool backdrop that goes beyond the normal screen
so they can move a little bit more"*, alongside *"correct that wording to not care about
looking like real people"*.

### What changed

- `MARS_ARCADE_STAGE.halfWidth` 140 → 240. The walkable stage is now 480 px behind a 320 px
  screen, so the fighters can be walked out of frame.
- New `src/game/marsArcadeStage.ts`: the screen constants, the camera, and the backdrop as
  flat-shape **data**. Pure content, no canvas, no Three.js — the harness draws it today and
  the cabinet renderer will draw the same module later.
- `captain.flyby` reach 320 → 480, so the move that is *"the payoff of the whole cabinet"*
  still covers the whole stage and cannot be answered by running to the far wall.
- The harness projects everything through the camera, draws the backdrop and a contact
  shadow per fighter, and reports the camera in the live readout.
- Likeness wording corrected in five places; see the decision below.

### Decisions

- **The stage is 1.5 screens, not 2 or 3.** The owner asked for *a little bit more* room.
  480 px gives 71% more floor and 208 px of camera travel. The cost is a real balance shift
  toward the zoner: walking wall to wall at THE ORACLE's 1.0 px/frame takes 8.0 s of a 60 s
  round, up from 4.7 s. One constant if that turns out to be too much, or too little.
- **The camera looks 24 px past each wall.** Clamping exactly at the wall draws a cornered
  fighter half off screen, because the sprite is 44 px wide and the pushbox is 24.
- **The backdrop is built in code, not generated.** Not a verdict on generated art — it is
  what this session could actually produce and prove, since `image_gen` is a Codex built-in.
  It is also the shape the problem wants: the stage scrolls, so the backdrop is five
  independently-scrolling seamless tiles rather than one picture, and a painting cannot
  tile or parallax. The prompt pack now carries a per-layer generation brief, so replacing
  any layer with generated art is a bounded job that keeps the parallax factors, the span
  widths and the silhouette rule.
- **Likenesses are now required, not forbidden.** The contract's `toneConstraints` key was
  literally named `noRealPeople` and the pack's rejection list still said *"the face
  resembles a real or public person"* — the pack would have rejected the art the owner
  approved on 2026-09-20. Replaced in `mars-arcade-sprite-contract.json`,
  `mars-arcade-frame-prompt-pack.md` (twice), `prompts/05_MARS_ARCADE_SPRITE_WAVE_0.md`,
  this plan, and the header of `marsArcadeFighters.ts`. Ids and move names stay
  archetype-named on purpose: the rules never depended on who a fighter looks like.

### Discoveries

- **A rounded lerp camera stalls short of its target.** Easing 12% of the remaining distance
  and rounding to a whole pixel means that once the gap is under about 4 px the step rounds
  to zero and the camera parks permanently off-centre. The follow now always moves at least
  one whole pixel.
- **A test had the old stage width baked into a frame count.** `expires off the end of the
  stage` pumped a flat 60 frames, which only ever cleared the boundary because the stage was
  140 px half-wide. It now derives the count from the stage and asserts it stays under the
  projectile's 120-frame lifetime, so it still proves off-stage expiry rather than timeout.
- **Span coverage is not shape coverage.** The first tiling test asserted the layer's spans
  covered the view, which a mutation removing the left-hand tile margin passed cleanly:
  shapes are allowed to overhang their span, so a span entirely off screen can still own a
  shape that reaches into it. The test now derives what is needed from the real shape
  extents.
- **The first backdrop pass had four faults only visible in a screenshot:** the horizon glow
  was entirely hidden behind the near berm, both moons sat behind the HUD bars, the deck's
  full-height seams read as a brick wall rather than a floor, and the parked DC-9 read as a
  table. The aircraft needed the three features that actually identify it — the upswept tail
  cone into a T-tail, rear-fuselage engines, and a row of lit cabin windows.

### Evidence

`npm run check` in `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/mars-backdrop`:

```
eslint .                   clean
tsc -b                     clean
vitest run                 54 files, 677 tests passed
vite build                 built in 3.00s
```

13 new tests in `src/game/marsArcadeStage.test.ts`. Mutation run — inject, run that file,
revert:

```
camera clamp removed                                    caught   2 failed | 11 passed
camera not rounded to a whole pixel                     caught   1 failed | 12 passed
corner margin removed                                   caught   1 failed | 12 passed
backdrop tiles lose their edge margin                   caught   1 failed | 12 passed
parallax scrolls with the camera instead of against it  caught   2 failed | 11 passed
the deck stops tracking stage space                     caught   1 failed | 12 passed
the sky goes back to a near-black void                  caught   1 failed | 12 passed
bands no longer cover the view                          caught   1 failed | 12 passed
the flyby is left behind when the stage widens          caught   1 failed | 12 passed

9/9 mutations caught
```

A tenth mutation, removing the tiling's right-hand margin, is **not** caught, and should not
be: it removes slack that could only matter for a shape overhanging its span by more than a
whole span. Verified by re-running it with a shape authored at column −90, which still does
not require it. Recorded in the docstring rather than papered over with a test.

Browser proof — `tools/assets/check-arcade-stage.mjs`, headless Chromium against the dev
server on port 5319, chosen to avoid the peer session's server on 5317:

```
PASS the harness is running a 480 px stage behind a 320 px view
PASS backdrop drawn: 4287 distinct colours, two commonest cover 24.0% (was 88.5%)
PASS camera scrolled to the left clamp (-104) with a fighter at x -240
PASS camera scrolled to the right clamp (104) with a fighter at x 240
PASS total camera travel is 208 px — the stage genuinely scrolls
PASS jump frame captured for the contact shadow
PASS no uncaught browser errors
```

The flatness figure is the measure of the original complaint: on the pre-change stage, two
flat colours covered 88.5% of the frame and both fighters plus the whole HUD were 9% of the
pixels. Screenshots: `preview-renders/mars-arcade/stage-backdrop-neutral.png`,
`stage-corner-left.png`, `stage-corner-right.png`, `stage-jump-shadow.png`.

`tools/assets/check-arcade-pilot.mjs`, the peer session's own 12 browser checks, was re-run
against this build unchanged and passes, so the sprite pilot, the native controls, the
reduced-motion path and the box fallback still work with the camera in front of them.

### The HUD — 2026-09-20

Owner ask: *"yeah do the HUD too"*. The retired HUD was three flat bars, a one-pixel guard
line and browser-font text — the other half of the original *"a little too plain"*.

- `src/game/marsArcadeHud.ts` — layout, colours, the damage trail and the banner text, as
  pure content and pure functions. No canvas, like the stage module.
- `src/dev/arcadePixelFont.ts` — a 5x7 pixel font. The browser font was the one thing on the
  stage that could not be pixel art: it antialiases and does not land on the grid.
- Per side: a 22x24 portrait cropped from that fighter's approved anchor and mirrored on the
  right so both face inward, a framed health bar with a **lagging damage trail**, a super
  meter and a guard bar, each changing colour at their thresholds, and the name in pixel type.
- Centre: a framed clock that turns red under ten seconds.
- Round presentation: `ROUND 1`, then `FIGHT!` which clears 36 frames into the fight, then
  `K.O.` / `TIME UP` / `DRAW` with the winner named underneath.

**The HUD and the backdrop have a shared boundary.** The HUD owns screen rows 2–27 and the
backdrop's star layer begins at row 28 — which is why no moon is ever drawn behind a health
bar. Both sides of that agreement are asserted, in `marsArcadeHud.test.ts` and in the star
layer's own comment.

**Portrait crops are measured per fighter, not shared.** A single crop centred on the pivot
column cut the booster's face off: the three profiles are 23–37 px wide across the head, and
his headset runs well past the pivot. Recorded in the contract, with the warning that the
test only catches a crop leaving the cell, not one that misses the head.

**Second pass, same day, after looking at it.** The first HUD was correct but flat — a
big red slab over a muddy strip where the meter and guard were unreadable, and names
floating on bare sky. Changed: health and guard now share one frame whose **inner end is
cut on a 5 px slant**, so the pair leans into the centre of the screen; every fill is two
tones plus a shadow line instead of one colour; the meter moved to its own box **in five
chunks**; and the names sit on plates. The slant is the single thing that separates a
cabinet HUD from a progress bar.

**Five chunks, not four.** One chunk has to equal the cheapest special so the bar answers
*can I afford it yet* at a glance. Four was the first guess; the test comparing the chunk
size against the actual move costs caught that the cheapest special is 20, not 25.

26 tests across `marsArcadeHud.test.ts` and `arcadePixelFont.test.ts`, **20/20 mutations
caught across the two passes**. First pass:

```
the damage trail never holds                 caught   2 failed | 16 passed
the trail is allowed below health            caught   1 failed | 17 passed
a second hit does not restart the hold       caught   2 failed | 16 passed
the trail never drains                       caught   3 failed | 15 passed
the fight banner never clears                caught   1 failed | 17 passed
the round card is skipped                    caught   1 failed | 17 passed
the name row runs into the backdrop band     caught   1 failed | 17 passed
the guard bar overlaps the meter             caught   1 failed | 17 passed
the right side stops mirroring               caught   2 failed | 16 passed
a portrait crop leaves the sprite cell       caught   1 failed | 17 passed
a glyph loses a row                          caught   1 failed | 17 passed
a glyph the HUD needs is deleted             caught   1 failed | 17 passed
```

Browser proof — `tools/assets/check-arcade-hud.mjs`, pixel measurements rather than
screenshots, because *"the HUD looks better"* is not something a screenshot settles:

```
PASS the round card is on screen during the intro
PASS the banner clears after the call to fight
PASS portrait drawn (292 colours) and the clock is legible
PASS a hit leaves a 360 px damage trail on the health bar
PASS the trail drains back to the new health
PASS the round ended on timeOver and the card names the winner
PASS HUD holds together at the 375 px integer scale
PASS no uncaught browser errors
```

Second pass added, and all still pass:

```
PASS the meter reads as chunks and the name sits on a plate
PASS the vitals bar is square at the top and cut on a slant at the bottom
```

That slant check is two-sided on purpose — it asserts the frame colour is *present* at the
top inner corner and *absent* at the bottom one, so it cannot pass by the bar simply being
missing. Eight more mutations on the second pass, all caught:

```
the meter is divided into the wrong chunks       caught   4 failed | 22 passed
the meter no longer holds whole chunks           caught   2 failed | 24 passed
a segment reports more than full                 caught   3 failed | 23 passed
the slant is flattened out                       caught   1 failed | 25 passed
the vitals strips stop filling their frame       caught   1 failed | 25 passed
the name plate is shrunk under its longest name  caught   1 failed | 25 passed
a gap opens between the plate and the meter      caught   1 failed | 25 passed
the portrait crop stops matching its frame       caught   1 failed | 25 passed
```

Screenshots: `hud-round-card.png`, `hud-damage-trail.png`, `hud-round-end.png`, `hud-375.png`.

### Rebased onto the animation checkpoint — 2026-09-22

PR #73 merged the fight loop to `main`, but `main` does not carry the sprite harness —
that went to PR #75, `feat/mars-arcade-animation-checkpoint`. This work builds on the
sprite harness, so it was cherry-picked onto **#75**, not onto main, as
`feat/mars-arcade-stage-hud`.

Three conflicts, all one-liners where both sides had touched the same call: the peer
session had added `renderY` and an outcome-frame readout where this branch had added the
camera, so both sides were kept. One judgement call: the peer had already moved its own
banner up out of the play area for animation review, and the pixel-type banner put the card
back across the fighters' heads — that intent is restored and now held by a test.

**Running a peer's browser checks rewrites the screenshots they commit as evidence.** A
`git add -A` then swept 43 of the animation checkpoint's own proof images into this branch,
which would have silently replaced them with renders from this build. All 43 restored, and
five stale `wave-1-pilot-*.png` deleted at paths the checkpoint has since moved. Worth
knowing before running anyone else's suites: the branch went from 69 changed files to 26.

### The wider stage moved a balance line — 2026-09-22

`check-arcade-heavy.mjs` failed on the rebase, and it is not a test artefact. **On a wider
stage a defender can walk backwards out of a heavy's reach where the corner used to hold
them.** The numbers, for the one case that failed:

```
oracle heavy (hardCutoff): reach 40, startup 13
defender (booster) walks away at 1.25 px/frame
separation at the first active frame = 24 + 13 x 1.25 = 40.25   ->  whiffs by 0.25 px
```

Blocking in this engine *is* holding away, and holding away *is* walking away, so outside
the corner the defender retreats out of range while trying to block. Against a wall the
input still counts as blocking while x cannot move, which is what made the block land.

Confirmed by running the same suite against `79eafbd` with none of this branch's commits:
it passes there and fails here, so the cause is the stage width and nothing else.

The check now **arranges the corner and asserts it** rather than getting it by accident off
a 1200 ms retreat that happened to overshoot the old 280 px wall. It reads the wall
position out of the readout rather than hard-coding it, so it survives the next width
change too.

**Open for the owner — not decided here.** Whether the oracle's heavy should keep reach 40
now that midfield gives 0.25 px of escape. Options: leave it (the corner becomes genuinely
more valuable, which is how fighting games are meant to work), nudge the reach to ~44, or
narrow the stage. This is balance, not a defect, so it is flagged rather than changed.

### Not done and not claimed

- **No owner review.** Nothing here has been seen by the owner.
- **Nothing pushed.** `feat/mars-arcade-stage-hud` is local; no PR opened.
- **No hit stop, screen shake, hit flash or impact effects.** All are engine work against
  events the loop already emits, and all are the cheapest remaining wins.
- **No generated backdrop art**, no Vercel preview, no Mars scene, no chapter wiring, no
  persistence. The stage module is dev-only until the cabinet scene exists.
- This work is on `feat/mars-arcade-wide-stage`, on top of a snapshot of the peer session's
  uncommitted state. It has not been merged into `feat/mars-arcade-fight-loop`.

## Reference study — "Vibe Coding an Entire Street Fighter Game With AI" — 2026-09-22

Owner supplied <https://www.youtube.com/watch?v=en37mtF42eQ> (Chong-U, 19:09, 2026-06-05)
and asked that our fight chapter be built like it. Studied from the transcript plus frame
grabs at 10:05, 10:58, 12:06 and 15:02. **Nothing below is implemented or decided** — this
section records what the reference does and how it maps onto our code.

His stack is Phaser + high-res AI sprites; ours is a pure 60 Hz rules module plus a pixel
grid. The *tooling* discipline transfers; the art pipeline mostly does not.

### Where our engine is already ahead

`marsArcade.ts` has startup/active/recovery frame data, chip damage, a guard meter with
crush, knockback, launches, projectiles, per-move meter gain on hit and on block, and the
landing-window mechanic. The reference has none of that depth. We are not behind on rules.

### The four things he has that we do not

1. **Per-frame bounds authored against the sprite.** His logic runs on four box types —
   `collision` (ground/body), `hit` (hurtbox), `attack` (hitbox) and `guard` — and the
   attack box is *active on specific frames only* (he shows frames 5-7 of a punch). Ours
   is a 1-D check: `separation > move.reach` plus a `defender.y > move.maxHeight` ceiling
   (`marsArcade.ts:380-383`). So our `reach: 41` is a number with no relationship to where
   the drawn arm actually ends. The sprite and the hitbox can disagree forever and no test
   would notice.
2. **No high/low guard.** `defender.blocking` is one boolean (`marsArcade.ts:394`), so a
   block stops everything. He calls the guard box the specific thing he learned building
   this: a high attack must beat a low guard and vice versa. His match HUD is labelled
   `COMBAT (LIGHT = HIGH, HEAVY = LOW)`, so attack height is a first-class property.
3. **A character gym.** Character dropdown, animation dropdown, numbered frame buttons,
   PREV/PLAY/NEXT, 0.5x/1x/2x, a bounds-type dropdown, a drag gizmo (Q move / W scale),
   CENTER X / CENTER Y / WIDTH / HEIGHT fields, an **"Active this frame"** checkbox, and
   SAVE FRAME / APPLY ALL. This is where the boxes get authored, not in source.
4. **A playground that persists tuning to JSON.** A fighter-vs-dummy scene reading
   `public/configs/fighter-playground.json`, with live WALK SPEED / AIR DRIFT / JUMP POWER
   / GRAVITY / SCALE / MAX HP / per-height DMG, KB, STUN, a "fill special bar" toggle, a
   "reset fighter" button, and per-type bounds toggles that render *inactive frames faint
   and active frames solid*. **The shipping game loads the same JSON.** His stated reason:
   "AI is not gonna be able to make your game feel perfectly right" — the tuning loop has
   to be human and fast.

Our `/dev/arcade.html` box harness is the closest thing we have to (4), but it draws boxes
from hardcoded frame data and cannot write anything back.

### Smaller transferable notes

- **Best-of-three rounds.** He has round win pips under the health bars. We have no round
  structure at all — `grep` for `roundsWon|bestOf|matchOver` returns nothing; `phase` is
  `intro | fight | ko | timeOver` and a KO ends everything.
- **Play the walk animation in reverse** instead of generating a backward walk — his
  generated reverse walk "just didn't look right". We already ship a dedicated
  `oracle/normalised-footwork-ready/walk-back`, so this is a possible saving on the
  remaining fighters, not a correction.
- **Background wider than the viewport** so fighters can drift off-centre. Already done —
  our 480-behind-320 stage predates this study.
- **Anchor image** (normalised, neutral, green screen) as the consistency basis for every
  later animation. We already do this: `anchor/anchor-00.png` per fighter.
- **Animation via image-to-video, then frame extraction.** He drives Groq Imagine to make
  a *movie* of the attack, lays out every frame, then picks a subset into a sheet — the
  motion is consistent because it came from one continuous clip. Ours generates frames
  individually (see `popt-frame-generation-pipeline`), which is where our drift comes
  from. Worth a trial, but it fights our pixel grid: his output is smooth and high-res,
  ours must land on whole-number scales and quantise cleanly.
- **UI atlas generated as one chroma-keyed image**, then made transparent — health bar
  with a transparent fill region and a portrait base. Our HUD is drawn procedurally, which
  is likelier to stay crisp at 320 px; not an obvious win either way.
- **Specials:** charge animation, multi-hit combo rather than one hit, and a portrait
  lightbox sliding in from the left. Our specials are single-hit.

### Suggested order, if the owner wants this

Bounds schema and the gym first (1 + 3), because every sprite generated from here on
should be authored against it and redoing that later is the expensive path. Then high/low
guard (2), which is a rules change the gym makes verifiable. Then the playground JSON (4).
Rounds, hit stop, screen shake and hit flash are independent and can land any time — the
loop already emits `hit`, `blocked`, `guardCrush`, `ko` and `timeOver` for them to hook.

### Backdrop regenerated from the reference stage — 2026-09-22

Owner asked for the backdrop to be as good as the one in the video (see the reference
study above). Five layers generated with Codex `image_gen` and normalised into seamless
tiles; full write-up, measurements and known problems in
`asset-reports/mars-arcade-backdrop-2026-09-22.md`.

**Art candidate only — not integrated, not owner-reviewed.** No runtime code changed and
nothing imports the tiles. New tool: `tools/assets/normalise-arcade-backdrop.py`.

The load-bearing discovery: the Pop T magenta key (`min(R,B) - G`, votable at 15 or
below) is **wrong for a violet palette** and silently gutted the first ridge tile to
11.5% fill. Replaced with distance-to-key versus distance-to-palette. Also confirmed the
sky bands are screen-space and never scroll, so the prompt pack's "no gradients, they
crawl" rule binds the parallax layers only — a fine sky ramp is safe, and it is what
stops the sky reading as stripes.

### Seams closed and a HUD restyle proposed — 2026-09-22

Both outstanding backdrop seams are resolved, and **one of them was never a seam**: the
first metric in `normalise-arcade-backdrop.py` counted rows whose first and last column
differ, which any busy texture fails by construction. Measured against each tile's own
interior column-to-column variation, the colony's join is *smoother* than its average
interior pair. The apron's break was real (13x its median), caused by the generated image
having an open bar gap at one edge and a solid crate stack at the other; fixed by cutting
the source gap-to-gap so only the continuous rails cross the join. The tool now reports
the relative measure.

A restyled HUD is proposed as a mock-up, built from the reference's **own UI atlas**
(paused at 15:32) rather than from its assembled screen: chevron-pointed fill strips with
a gloss line, chamfered multi-step steel plates, gold chevron end-caps, pill-chip meter
segments, an octagonal timer, angled name plates and round-win pips. It also adds the
green -> amber -> red health ramp with a critical blink, which the committed flat-salmon
bar does not have.

His UI-atlas *method* was rejected on measurement: his canvas is ~760 px wide internally,
ours is 320 with a 26-row HUD band, so a downsampled atlas loses every bevel exactly as
the 64x36 deck tile did. The mock-up draws the HUD instead, using the real 5x7 glyphs
parsed from `src/dev/arcadePixelFont.ts`.

**Still no runtime change and no owner review.** Details, measurements and the two
rejected passes are in `asset-reports/mars-arcade-backdrop-2026-09-22.md`.

### Integrated, plus the bounds schema and the gym — 2026-09-22

**All three landed in the runtime.** `npm run check` green: lint, typecheck, **767 tests
(61 files)**, build. Verified in a real browser at `/dev/arcade.html` and `/dev/gym.html`
on a dedicated port (5322), no console errors.

**Backdrop.** `MARS_ARCADE_BACKDROP` is now five generated image layers instead of code
shapes; `MarsArcadeBackdropShape`, its six `kind`s and the 140-line `drawShape` are gone.
Tiles load through the new `src/dev/arcadeHarnessBackdrop.ts`, which **size-checks each
one against the layer that declares it** — a layer is positioned by its bottom row, so a
tile regenerated one row taller would silently shift the whole layer and still draw. A
layer that fails to load is skipped, never substituted, because the sky ramp already
guarantees the fighters are readable.

`MARS_ARCADE_BANDS` is now generated: the same eight anchors interpolated in two-row
steps instead of held for 24-30 rows each. Safe because the bands are screen-space and
never scroll. Objective result from `check-arcade-stage.mjs`: **3449 distinct colours,
two commonest cover 23.3%** (the retired void was 88.5%).

**HUD.** The health ramp ran the **wrong way round** — red at full health, amber at low —
so a healthy fighter looked as alarming as a dying one and the bar carried no warning at
all. Now green -> amber -> red with a critical blink that dims rather than hides, so the
remaining health stays readable while it flashes. Plus a gold end-cap, an octagonal clock,
pill meter chips, and a meter whose own frame turns gold when a special can be thrown.

**Bounds schema.** `src/game/marsArcadeBounds.ts` + `marsArcadeBounds.json`: four box
types per drawn frame, authored in sprite-cell pixels facing right and mirrored at read
time. The load-bearing test is `reaches exactly as far as the move says it does` — the
authored hitbox's outer edge must equal the move's `reach`, which is what finally ties the
drawing to the rules.

**Not wired into hit detection, deliberately.** A test pins why: the engine compares
`|defender.x - attacker.x|` to `reach`, so the jab connects at 41; box overlap also counts
the defender's hurtbox and connects at **56**. Switching lengthens every move by the
opponent's half-width. That is a balance change and belongs in its own reviewable step.

**The gym** (`/dev/gym.html`, `src/dev/arcadeGym.ts`) authors those boxes against the
sprite and POSTs them to `src/game/marsArcadeBounds.json` through a dev-only Vite
middleware. Three things it caught or needed:

1. **It immediately found a real defect in its own seed data** — the jab's hitbox was at
   hip height while the glove is at chest height. Both hitboxes were then re-derived by
   measuring the sprite alpha: booster's jab is high (rows 35-44), oracle's heavy is a low
   sweep (rows 96-108), which is a natural high/low pair for the guard system.
2. **Sprites did not redraw on frame change.** `loadImage` had no load handler, so the
   canvas painted before the new frame decoded and drew boxes over an apparently empty
   cell — the tool silently lying about the art. Startup timeouts hid it for frame 1 only.
3. **A near-black canvas hid a black leather jacket.** Replaced with a checkerboard,
   which also shows where the cell is transparent.

Body boxes for all eight authored frames are now derived from the art rather than guessed:
the hurtbox is the silhouette clipped at the baseline, the collision box is the torso
column only — a pushbox as wide as an outstretched arm would have fighters shoving each
other with a punch.

**Still open:** no owner review; nothing pushed. Hit stop, screen shake and hit flash are
still the cheapest remaining wins. Only four animations carry bounds so far.
