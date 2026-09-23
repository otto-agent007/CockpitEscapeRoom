# Booster walk cycle — 2026-09-23

## Result

Owner: *"booster walk poses need some more work too."* The old walk was two mismatched
drawings, a wide lunge and a near-stance, flipping every 6 frames with no passing pose. The
same pair also played when he walked backwards, so he moonwalked while blocking.

It is now a boxer's step-and-drag, as the contract budgets: four drawings each way, each held
for 6 frames, giving a 24-frame cycle.

- **Forward, guard up:** lead step, drag (rear foot lifted), gather, load.
- **Backward, high guard:** rear step, drag back (front foot lifted and sliding back), gather, load.

The drawings are made in place: the torso holds still and the engine supplies all travel. Rules
are unchanged. The character sprite count goes from 51 to 57: 8 new drawings, and the old two
drop out of the runtime. Those two stay in the repo as history.

## A new alignment rule, and the gate that goes with it

The normaliser placed every frame by the midpoint of its planted feet. That is correct for
standing poses, but in a walk the planted foot changes, so the body jumped sideways by up
to 21 px between drawings. It also explains why the old walk swung.

- `normalise-popt-frame.py --align torso --torso-reference CELL` is new and opt-in. It places a
  frame so its torso back line (the rear jacket edge, rows 30-50% down the figure) matches a
  reference cell. The feet stay on the baseline. The default export is unchanged, and the
  existing byte-identical test still passes.
- `check-popt-frames-fullcolour.py --in-place-clip NAME --torso-reference CELL` is new. For those
  clips the gate replaces "feet centred on pivot" with "torso back line within 1 px of the
  reference". The tolerance is the same, measured where the contract says a walk is anchored.
  Standing clips keep the foot rule.
- Tests prove both directions:
  - The normaliser holds the torso whatever the legs do, and refuses to run without a reference.
  - In the gate, a legs-only change passes in place and fails as a standing clip, and a
    3 px whole-body drift fails in place.

Forward frames are held to the stance cell, backward frames to the block cell. Every frame's
back line sits at the reference column, so idle → walk → idle does not jump.

## Art and provenance

The art came from Codex built-in `image_gen` with `OPENAI_API_KEY` unset. Forward frames are
edits of `wardrobe-sleek/anchor-00.png`; backward frames are edits of the approved
`counterattack-v1/block-00.png`. Only the legs change. Prompts are in
`art-source/arcade/prompts/booster-walk-v2/`, and there are no hand-edited pixels.

| Frame | Attempts | Selected |
| --- | --- | --- |
| walk-forward-00, 03 | 1 | as generated |
| walk-forward-01 | 1 + 1 correction | `-c1`; the first kicked the rear boot up behind like a sprint |
| walk-forward-02 | 1 + 3 corrections | `-c3`, see below |
| walk-back-00..03 | 1 each | as generated |

**walk-forward-02.** The first version had two specks. The first correction fixed the one
between the legs. The remaining 1 px speck was somewhere else, a notch at waist height
between the open jacket's front hem and the thigh. The second correction was aimed at the
legs again, because it was written before that speck was located. The third correction, the
one beyond the usual two-correction limit, was aimed at the notch and passed. The lesson:
locate a speck before writing its correction.

Normalisation used Booster's locked scale 14.038461538461538 with bilinear resampling and
source alpha. The gate reports 4 + 4 frames and 0 failures in place, and the unit test suites
of both tools pass.

## Verification

- Tests: 3 RED before the wiring: the new four-and-four cycle test, plus two sprite tests updated
  deliberately for the new walk folder. `npm run check`: 792 tests / 64 files, build PASS.
- Arcade browser suites all PASS at 57 sprites: pilot 12, stage 9, HUD 10, movement 5,
  exchange 7, heavy 13, heavy-hit 6, heavy-block 6 + 7, continuity 2, outcomes 7, space laser 11.
- `check-arcade-exchange.mjs` asserted the retired `walk/walk-0N` files. It now asserts the new
  walk-forward 00 and 01 with the same strength, and allows Booster's draws from the walk set
  as well as the sleek outfit.
- Evidence is in `preview-renders/mars-arcade/booster-walk-v2/`: `walk-forward.gif`,
  `walk-back.gif` and `walk-before.gif`, all at game timing, plus `walk-sheet.png`.

## Open

- Owner visual review of the motion.
- Gym entries once `ARCADE_GYM_ANIMATIONS` is committed.
