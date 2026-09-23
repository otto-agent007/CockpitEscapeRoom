# Oracle heavy-hit exchange — 2026-09-22

## Delivered behavior

Booster heavy now produces an Oracle impact, a short movement through the existing
knockback, and a new recovering pose before idle. Both facing directions are supported.
Heavy-hit metadata lives in the dev presentation layer and reads actual hit events.
No combat-rule file changes: damage13, knockback7, hitstun22 and attack11/4/18 remain.

For this move, hit elapsed frames0–2 read as impact,3–12 as stagger,13–21 as recovery.
Impact and stagger deliberately reuse the existing recoil drawing; a separate stagger
source did not pass the gate and is NOT integrated. The drawing starts back toward its
pre-knockback position and eases to the actual rules position within8frames. Its offset
is limited to the displacement allowed by the rules, including corner clamps. Shadow
and status marker follow the artwork; diagnostic hitboxes remain at real coordinates.
Reduced motion retains the essential pose change with zero decorative position easing.
A light hit, block, miss, restart, round end or expired stun cannot reuse a stale heavy
reaction. Missing recovery art uses the existing box fallback. Runtime loads42 sources.

## Art provenance and bounded rejection

Built-in imagegen; no paid API, copied tutorial art or manual pixel edits.
References: Oracle `generated/exchange-v1/recoil-02.png` and `generated/anchor-likeness-00.png`.
All source paths below are under `art-source/arcade/oracle/`:
- Initial stagger and recovery had unwanted extra leg shapes, rejected visually.
- Recovery correction1 removes the extra trouser shape and passes the unchanged gate.
- Stagger correction1 fixes anatomy but leaves one tiny internal alpha hole at runtime.
- Stagger correction2 still fails that same gate. The initial+two-correction limit was
  reached; preserve and reject the source rather than weaken validation or keep generating.
- Five total generations: two initial drawings, three targeted corrections.

Selected source: `generated/heavy-hit-v1/recover-00-c1.png`.
Selected runtime: `normalised-heavy-hit-ready/recover/recover-00.png`.
Rejected sources and normalized attempts remain in their corresponding folders.
Exact complete prompts: `art-source/arcade/prompts/heavy-hit-v1/` (five text files).
Normalizer unchanged: source-alpha, bilinear, Oracle source scale13.60576923076923.
Selected foreground646×1402 becomes47×103 in128×128 RGBA, rows17–119, cols42–88.
Baseline119/pivot64 retained. Selected gate:1frame/0failures. The rejected stagger gate
is saved as a failure, not counted as a selected-art pass.

## Implementation and checks

`arcadeHarnessReactions.ts` keeps presentation metadata separate from game rules.
`arcadeHarnessSprites.ts` selects recovery and visual position; `arcadeHarness.ts`
updates metadata and draws the corresponding shadow/artwork. Existing browser scripts
were updated only for the extra source count; previous animation work is preserved.

- Behavior RED:3failed/1passed after empty metadata stub; GREEN:19tests in3focused files.
- Final `npm run check`: lint/types,771tests in62files, production build PASS.
- Dedicated native heavy-hit browser check:6PASS groups including both facings,
  reduced motion, frozen pause/step, reset/reload, damage13 and missing recovery art.
- Existing heavy check:13PASS groups (hit/block/whiff, reduced motion, fallback).
- Pilot:12PASS groups, including375/768/1440widths, keyboard and missing-art controls.
- Before and final after normal-speed videos; final half-speed video. Each uses four
  actual heavy hits, two per direction, and verifies recovery/no page errors.
- Full-diff self-review: corrected shadow layering so both shadows stay behind both
  fighters. Final fullcheck and dedicated browser sequence rerun after that change.
- Original approved heavy cells are byte-identical; src/game has no diff.
- `git diff --check` passes. No dependency, production wiring, commit/push or deployment.

Evidence: `preview-renders/mars-arcade/heavy-hit-v1/`.
`before-after.mp4` compares normal-speed recordings; independent browser startup means
it is not an exact frame-synchronized comparison. `exchange-sheet.png` contains actual
paused browser draws and is displayed in the existing tmux sidebar. Asset SHA256s saved.
Reproduce browser checks with `node tools/assets/check-arcade-heavy-hit.mjs` against
http://127.0.0.1:5349/dev/arcade.html. Override URL with ARCADE_PILOT_URL, evidence folder
with ARCADE_EVIDENCE_DIR. Recorder: `record-arcade-heavy-hit.mjs`, speed0.5 via ARCADE_MOTION_SPEED.

## Remaining delta

Owner visual review remains open. The separate deeper stagger drawing is withheld after
its bounded attempts failed. This is two distinct reaction drawings plus movement, not
three new drawings or a completed combat animation set. Booster's received-hit reaction,
block reactions, impact sound/effects, other fighters and special animations remain.
Full-journey e2e, 3D assets, movement and outcome suites were not rerun for this slice.
