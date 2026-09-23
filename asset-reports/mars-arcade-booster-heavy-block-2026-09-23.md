# Booster blocked-heavy reaction — 2026-09-23

## Result

Booster now reacts to a blocked Oracle heavy the way Oracle already reacts to Booster's:

- **Brace:** his approved block drawing, while an in-range heavy is starting up.
- **Compress:** a tight shell with the chin tucked behind both gloves.
- **Settle:** upright again, far fist pushed forward, an unbothered grin.
- **Guard:** back to the approved block drawing.

Oracle's heavy has 13 frames of blockstun. Booster compresses for elapsed frames 0-4, settles
for 5-9 and returns to guard for 10-12, using the same 35% / 75% split as Oracle.
Chip 2, guard 14 and every rule value are unchanged. Light blocks keep the static guard. A guard
crush still takes the clean-hit path. All poses are essential, so reduced motion shows the same drawings.

The code is shared rather than copied. `heavyBlockFrames` in `arcadeHarnessSprites.ts` holds each
fighter's brace, compress, settle and guard drawings, and one branch selects them for both
fighters. `updateHeavyReactions` now records blocked heavies for Booster too. This deliberately
changes the earlier boundary "Booster's block reaction is unchanged"; its test was updated to
assert the new behaviour. The character sprite table grows from 49 to 51.

## Art and provenance

Codex built-in `image_gen` on the ChatGPT plan, with `OPENAI_API_KEY` unset. The reference is
the owner-approved `booster/generated/counterattack-v1/block-00.png`. Prompts are in
`art-source/arcade/prompts/booster-heavy-block-v1/`. There are no hand-edited pixels.

| Drawing | Attempts | Selected source | Runtime cell |
| --- | --- | --- | --- |
| compress | 1 | `generated/heavy-block-v1/compress-00.png` | rows 20-119, cols 38-91 |
| settle | 1 + 2 corrections | `generated/heavy-block-v1/settle-00-c2.png` | rows 17-119, cols 38-90 |

**Settle corrections.** The first settle had a 2 px speck: a slit of background trapped between
the far fist and the chin and chest. Correction 1 tried to close it and still failed. Correction 2
opened it instead, moving the fist forward so the gap reaches the outside, and passed. This is
the same resolution the Booster hit-reaction wave needed. It stays within the two-correction
limit. Rejected attempts remain local.

Codex reported a faint halo and small lower-body shifts on each generation. At game scale the
halo is gone and the stance matches.

Normalisation used the unchanged `normalise-popt-frame.py` at Booster's locked scale
14.038461538461538 (`--resample bilinear --source-alpha`). The gate
`check-popt-frames-fullcolour.py` on `booster/normalised-heavy-block-ready` reports 2 frames and 0 failures.
Checksums: `asset-reports/mars-arcade-booster-heavy-block-2026-09-23.sha256`.

## Verification

- TDD: 3 tests RED before wiring: both sides of the new Booster block suite, plus the updated
  reactions expectation. They pass after wiring.
- `npm run check`: lint, types, 791 tests / 64 files, build PASS.
- `check-arcade-heavy-block.mjs` now takes `ARCADE_HEAVY_ATTACKER`, and its missing-art case only
  blocks the defender's own block folder.
  - With `oracle` attacking (Booster defends): 6 PASS. That covers both sides, reduced motion,
    missing art, the drawn source at every beat, pause/step/reset/reload, chip 2 and guard 14.
  - With the default `booster` attacking: 7 PASS, including the guard crush.
- The other arcade suites at 51 sprites: pilot 12, stage 9, HUD 10, movement 5, exchange 7,
  heavy 13, heavy-hit 6, continuity 2, outcomes 7, space laser 11.
- Evidence: `preview-renders/mars-arcade/booster-heavy-block-v1/`. Start with `block-sheet.png`
  (in-game) and `pose-row.png` (guard, compress, settle, stance at game scale).

## Open

Owner visual review. Gym entries once `ARCADE_GYM_ANIMATIONS` is committed.
Next in the queue: Booster's walk cycle. The owner flagged it; it currently has two mismatched
drawings, and the same pair plays for walking backwards.
