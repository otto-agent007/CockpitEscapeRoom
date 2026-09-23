# Oracle walk cycle — 2026-09-23

## Result

Oracle's walk was built the same way Booster's old one was: two drawings each way, lined up by
the planted foot, so the body swam 49-51 px across columns. It now uses the same approach as
Booster's rebuilt walk (`mars-arcade-booster-walk-2026-09-23.md`): a step-and-drag, four
drawings each way, drawn in place with `--align torso`. Every drawing is held to Oracle's
block-cell torso line (column 49). His open-handed idle stance sits at 48, so setting off from
idle doesn't jump. Each drawing is held for 6 frames, giving a 24-frame cycle. Rules are
unchanged, and the sprite count goes from 57 to 61.

## Art and provenance

The art came from Codex built-in `image_gen` with `OPENAI_API_KEY` unset. These are leg-only
edits:
- forward from his approved `movement-v1/walk-forward-00.png`, which has the guard up;
- backward from `exchange-v1/block-02.png`.

His idle's raw source has no alpha, so it could not be the base for an edit. Prompts are in
`art-source/arcade/prompts/oracle-walk-v2/`, and there are no hand-edited pixels. The prompts
built in what Booster's walk taught: the drag foot tucked in (not kicked up behind), one clear
gap between the legs, and the hem meeting the trousers with no notch.

| Frame | Attempts | Selected |
| --- | --- | --- |
| walk-forward-00 | 1 + 1 correction | `-c1` |
| walk-forward-01..03 | 1 | as generated |
| walk-back-00 | 1 + 1 correction | `-c1` |
| walk-back-01 | 1 + 2 corrections | `-c2` |
| walk-back-02, 03 | 1 | as generated |

Every speck was located and mapped back to source coordinates *before* its prompt was written.
Three of them were the same notch under the lips, where the top of the near fist only just
touches the chin. The fix brought the knuckles up to overlap the chin. The fourth was a lifted
sneaker almost touching the planted leg; the fix held the foot clear.

Normalisation used Oracle's locked scale 13.60576923076923 with bilinear resampling, source
alpha, and `--align torso --torso-reference oracle/normalised-exchange-ready/block/block-00.png`.
The gate, run in place against the same reference, reports 4 + 4 frames and 0 failures.

## Verification

- `npm run check`: 804 tests / 65 files, build PASS. The walk tests are generalised to both
  fighters. The Sam footwork test now expects a 24-frame loop instead of a 12-frame one.
- Arcade browser suites all PASS at 61 sprites: pilot 12, stage 9, HUD 10, movement 5,
  exchange 7, heavy 13, heavy-hit 6, heavy-block 6 + 7, continuity 2, outcomes 7, space laser 11.
- The movement and exchange checks asserted Oracle's drawings 00 and 01 by name. That was
  always true of a two-drawing cycle, but not of a four-drawing one, where it depends on the
  frame counter. They now require the walk to have animated (two distinct drawings from the new set).
- `check-arcade-heavy.mjs` now has the attacker follow while the defender retreats to the corner.
  Without that, the new 272 px separation cap stops the retreat short of the wall. The corner is
  still asserted.
- Gym probe: 22 animations, and Oracle's walk-forward and walk-back show 4 drawings each. No
  missing images, no page errors.
- Evidence: `preview-renders/mars-arcade/oracle-walk-v2/` (`walk-forward.gif`, `walk-back.gif`,
  `walk-before.gif` at game timing, and `walk-sheet.png`).

## Open

Owner visual review.
