# Mars arcade — short exchange study, 2026-09-20

Status: **dev-only exchange checkpoint; full Wave 1 and owner motion acceptance open**.
Owner requested continued work after finding the likeness pilot insufficient. This pass
focuses on approach → blocked jab → clean jab → recoil → recovery, not roster or stage expansion.

## Sources and exact localized repairs

Ten new built-in image-generation outputs are preserved under each fighter's
`generated/exchange-v1/`; exact prompts are under `art-source/arcade/prompts/exchange-v1/`.
Five initial candidates, three first corrections, and two final Oracle corrections.
Project-generated cartoon likenesses, not photographs or endorsements; no external assets,
paid API, or new dependency. Existing identities and all earlier candidates remain intact.

Normalization uses the existing `--source-alpha --resample bilinear` path, fixed scales
Booster **1460/104**, Oracle **1415/104**, 128×128 RGBA, baseline119/pivot64. No per-pose fitting.
The final jab hole was actually at the jacket hem, not the forearm; targeted regeneration
closed it. Both planted-foot shuffle poses avoid the old lifted-boot registration problem.

| Runtime export under `art-source/arcade/` | Provenance |
| --- | --- |
| `booster/normalised-exchange-ready/anticipation/anticipation-00.png` | Earlier clean `normalised-wave-1-repair/padJab/padJab-00.png` |
| `booster/normalised-exchange-ready/jab/jab-00.png` | `generated/exchange-v1/jab-00.png`, normalized in `normalised-exchange-v1/jab/` |
| `booster/normalised-exchange-ready/walk/walk-00.png` | Corrected `generated/exchange-v1/shuffle-00-01.png`, `normalised-exchange-v1-repair/shuffle-00/` |
| `booster/normalised-exchange-ready/walk/walk-01.png` | `generated/exchange-v1/shuffle-01-00.png`, `normalised-exchange-v1/shuffle-01/` |
| `oracle/normalised-exchange-ready/block/block-00.png` | `generated/exchange-v1/block-02.png`, normalized final copy plus authorized pixel repair below |
| `oracle/normalised-exchange-ready/recoil/recoil-00.png` | `generated/exchange-v1/recoil-02.png`, normalized final copy plus authorized pixel repair below |

After the two-correction cap, Oracle retained one tiny transparent defect per pose. The owner
explicitly answered **“Yes, make the localized pixel repairs.”** The asset-specific tool
`tools/assets/repair-arcade-exchange.py` checks the source SHA-256 and target/neighbor values,
copies exactly one adjacent RGBA pixel into each separate output, and refuses to overwrite a
different existing candidate. It is not a general fill/closing operation and does not change
the normalizer or checker. All other pixels, including larger intentional leg gaps, are identical.

Coordinates are zero-based `(x,y)`, before RGBA `(0,0,0,0)`:

| Pose | Pixel | After RGBA | Copied neighbor |
| --- | --- | --- | --- |
| block | (70,34) | (82,62,44,125) | (69,34) |
| recoil | (65,94) | (26,27,27,142) | (66,94) |

Source hashes (`oracle/normalised-exchange-v1-final/<pose>/<pose>-02.png`):

- block: `4a85178d97ddd69c936e1f397f65d6381019aa35bc719e9bf33e02b2a7432947`
- recoil: `ea109535d3bec953ca182296e3756f6b678c03124767822d124bec11302646cb`

Output hashes:

- block: `1d6498ffb40f475267cd26d282e10857b9459cfd78bd3e2f8d9204b387685101`
- recoil: `e5600f50fba2f4d6979889b1486640b49a71e41e98c01a9ce5f9363f7314dc86`

## Presentation and motion

The ten dev-only preloads comprise three accepted anchors, Booster inhale, and the six cells
above: ten 128×128 RGBA images (640 KiB decoded, no atlas/material/GLB changes). Integer
nearest-neighbor display remains 1×/2×/3×; only accepted cells are referenced by the manifest.

Booster shuffle alternates on six simulation ticks. Jab startup uses anticipation, active uses
the reach-correct contact drawing (28 px vs 30±3), early recovery reuses anticipation, then guard.
Oracle holding away/blockstun selects raised guard; hitstun selects recoil. Reduced motion freezes
decorative breathing but retains essential action poses. Other moves and terminal states still
use explicitly labeled anchor placeholders; backward guard is one held pose, not a full walk cycle.

`Play exchange` starts a fixed input sequence at half speed, without changing fight rules or
injecting damage/state. Inputs are sampled per fixed tick, including long render frames. World
frame167 blocks for1 chip, frame227 hits for5, frame290 stops with both idle and health100/94.
Native replay/free-play/pause/step work, and manual combat/identity/restart/CPU input exits review.
The completed Resume control is disabled rather than silently doing nothing.

Browser inspection found the second approach pushed into the defender (24 px centre spacing).
An additional RED test captured the crowding; shortening just the recorded follow-up approach
from30 to8 ticks leaves28.8 px before contact and30.8 after knockback. Game collision rules remain
unchanged. Contact is still a compact jab, not a completed full-body fighting animation.

## Validation and evidence

- Test-first RED/GREEN: jab/walk selector, Oracle defense selector, missing exchange module,
  long-frame deterministic playback, spacing, and exact-pixel repair/preservation.
- `npm run check`: lint, TypeScript, **664 tests / 53 files**, production build pass.
  Log: `preview-renders/mars-arcade/exchange-check.log`.
- `python3 -B tools/assets/repair-arcade-exchange.test.py`: **2 passed**, exact changed pixels
  and unchanged sources; refuses overwrite of a different candidate.
- `python3 -B tools/assets/normalise-popt-frame.test.py`: **3 passed**, legacy byte identity retained.
- `python3 -B tools/assets/check-popt-frames-fullcolour.test.py`: clean accepted, seven defects rejected.
- Unchanged full-colour checker: **all ten runtime cells pass**, checked across the three
  `normalised-clean` folders, Booster `normalised-wave-1-pilot`, and both `normalised-exchange-ready` folders.
- `node tools/assets/check-arcade-exchange.mjs`: **6 PASS groups**. Actual canvas draw calls prove
  walk/startup/jab/block/recoil use; one block/one hit, pause/exact step, replay/cancellation,
  375/768/1440 layouts/screenshots, reduced-motion essential draws without inhale, reload and
  single-action-image failure reporting; no page errors. Log: `exchange-browser.log`.
- `node tools/assets/check-arcade-pilot.mjs`: **12 PASS groups**, existing input/responsive/fallback
  regressions with ten loaded images; log: `exchange-regression-browser.log`.
- Initial browser assertions were one tick early: world166 is startup3, first active167;
  half-speed5500 ms is also before contact. Corrected observation timing, not engine thresholds.
- Normal and half-speed real-time recordings: `exchange-motion-normal.webm`, `exchange-motion-half.webm`.
  Reproduce with `node tools/assets/record-arcade-exchange.mjs` against the local Vite server.
  Both recorded block167/hit227; stills: `exchange-block.png`, `exchange-hit.png`,
  `exchange-{375,768,1440}.png`, `exchange-review.png`. All in `preview-renders/mars-arcade/`.
  Inspected browser captures and refreshed the existing owned tmux pane `%1` with the review sheet.
- Independent read-only code review: no remaining Critical/Important/Minor findings after disabling
  the completed Resume control and tightening browser evidence claims. Reviewer independently ran
  the two repair tests and `git diff --check`. Final input-spacing change also has a RED/GREEN test.
- Production scan: no arcade identifiers/source paths, no `dist/dev` or `dist/art-source`.
  Pure game code, main journey, public assets, dependencies and save schema unchanged.

No Vercel preview, deployment, commit, push, or PR. Full chapter e2e and 3D asset checks were not
rerun for this isolated dev-only 2D study. Remaining: owner review of motion/likeness, smoother
transitions and foot placement, Oracle movement/attacks, remaining fighter moves/FX/outcomes,
and eventual separately approved Mars placement. This is not full Wave1 or production acceptance.
