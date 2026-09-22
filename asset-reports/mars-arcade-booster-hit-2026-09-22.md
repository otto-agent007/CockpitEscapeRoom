# Booster received-heavy reaction — 2026-09-22

## Result

Booster now reacts to Oracle's heavy with three distinct drawings: original impact
recoil, a new deeper backward stagger, and a new forward recovery before ready stance.
Elapsed stun frames0–2 use impact,3–10 stagger,11–19 recovery. Oracle heavy stays
startup13/active3/recovery20,damage11,hitstun20,knockback9. No game-rule file changes.

The existing presentation helper now accepts Booster heavy-hit events as well as
Oracle events. The selector shares phase timing and position easing through a per-fighter
pose table; it does not duplicate the reaction logic. Visual easing settles to the real
rules position within8frames and is disabled for reduced motion. Essential poses remain.
Booster's block reaction is unchanged. KO takes priority over hit recovery and retains
its existing three-beat knockdown. Original Oracle hit/block behavior remains intact.
Runtime now loads46 sources, retaining box fallback for missing art.

## Art and provenance

Built-in imagegen, four generations: initial stagger, initial recovery, two recovery
corrections. References are the existing Booster `generated/counterattack-v1/recoil-00.png`
and `generated/wardrobe-sleek/anchor-00.png` under `art-source/arcade/booster/`.

The stagger passed on its first attempt. Recovery's initial and first correction each
failed on two tiny alpha holes near the raised glove/chin. Correction2 lowered the glove
to open the gap and passed. Rejected sources and normalized attempts remain preserved.
No manual pixel edits, contract relaxation, source rescaling or extra service/API.

Selected source files under `art-source/arcade/booster/`:
- `generated/hit-reaction-v1/stagger-00.png`
- `generated/hit-reaction-v1/recover-00-c2.png`
Selected runtime cells:
- `normalised-hit-reaction-ready/stagger/stagger-00.png`
- `normalised-hit-reaction-ready/recover/recover-00.png`
Exact complete prompts: `art-source/arcade/prompts/booster-hit-v1/` (four text files).

Unchanged source-alpha/bilinear normalizer, fixed Booster scale14.038461538461538.
Stagger foreground788×1424 becomes56×101 (rows19–119,cols34–89); recovery677×1422
becomes48×101 (rows19–119,cols40–87). Both128×128 RGBA, baseline119,pivot64; pose
height reflects torso/head lean rather than changed scale. Selected gate:2frames/0failures.
Original recoil/anchor/heavy cells and all earlier animation manifest hashes preserved.

## Verification

Evidence root: `preview-renders/mars-arcade/booster-hit-v1/`.
- RED2failed/5passed before implementation; focused GREEN26tests across4files.
  The expanded test initially compared idle breathing against reduced-motion idle;
  corrected that assertion to compare essential hitstun poses only, preserving static
  reduced-motion idle behavior and existing independent breathing tests.
- Final `npm run check`: lint/types,778tests in63files, production build PASS.
- Native Booster hit:7PASS groups, including both facings, pause/step/reset/reload,
  reduced motion, damage11, both new assets missing and repeated actual hits through KO.
  First KO draw is knockout0, not heavy-hit recovery; settled knockout2 also verified.
- Oracle hit:6PASS groups; Oracle block:7 including guard crush; pilot:12 including
  keyboard,375/768/1440widths and all-art fallback.
- Heavy hit/block/whiff regression:13PASS groups, including missing heavy-art fallback.
- Before/after normal-speed and revised half-speed recordings each complete four real
  hits (two per direction) and return to stance without page errors.
- Actual browser sheet and24 consecutive normal-speed frames inspected; sheet shown in
  existing tmux pane%1. Short before-after.mp4 skips setup. Independent recordings are
  not precisely frame-synchronized. Original full recordings are preserved.
- Full-diff self-review found no critical/high finding. Diff check passes. No dependency,
  production wiring, commit/push or deployment. `ASSET-SHA256SUMS` saved and verified.

Reproduce with local server5349 and `ARCADE_HEAVY_ATTACKER=oracle` when running
`tools/assets/check-arcade-heavy-hit.mjs` or `record-arcade-heavy-hit.mjs`.
ARCADE_PILOT_URL overrides URL, ARCADE_EVIDENCE_DIR sets an isolated evidence folder,
ARCADE_MOTION_SPEED=0.5 selects half-speed recording. Default attacker remains Booster,
so existing Oracle reaction checks retain their meaning.

## Remaining scope

Owner visual review remains open. Booster block reactions, jab motion, specials and
other fighters' unfinished poses remain outside this slice. No full-journey e2e,3D asset
suite or full outcome/movement-suite rerun; this slice includes direct native KO proof.
