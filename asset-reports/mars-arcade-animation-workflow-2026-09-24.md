# Mars arcade — animation workflow v2 (2026-09-24)

Plan: `plans/0046-arcade-animation-workflow-v2.md`. Branch `feat/arcade-animation-workflow-v2`,
based on PR #98's head (`92bd64d`). No art changed; this is the pipeline the art goes through.

## What changed

| Piece | Before | After |
| --- | --- | --- |
| Clip data | `marsArcadeBounds.json` v1: boxes paired to drawings by array position; 4 of 22 clips covered; timing as thresholds in `selectArcadeSprite` | `marsArcadeAnimations.json` v2: 24 clips, 75 frames keyed by drawing file, each with pose, phase, hold, boxes; the harness plays from it |
| Validation | parse only; reach test on 2 moves | `validateMarsArcadeAnimations` with severities, run by tests, the gym's Save, the Vite endpoint and `npm run arcade:validate`, which also reads the PNGs |
| Gym | drag, numbers, apply-all, flat 120 ms play | onion skin, mirror, opponent overlay with engine-vs-box verdict, timeline at real holds, multi-box hurt/attack, copy from previous, arrow nudge, undo, frame duplicate/delete/reorder, fit-to-drawing, findings panel |
| Sprite pipeline | one drawing at a time, feet on pivot | `normalise-arcade-clip.py` (one alignment per clip), `audit-arcade-clip.py` (sequence audit + review assets), `pick-arcade-frames.py` (video picks) |
| Sprite count | hard-coded `68/68` in 15 scripts | derived; scripts wait for `N/N` |

## Migration

The v1 boxes the owner authored (booster jab, oracle heavy, both blocks) are carried over
unchanged and pinned in `marsArcadeAnimations.test.ts`. The other 18 clips are seeded from
each drawing's opaque silhouette (hurt 2 px inside, body on the baseline) and flagged
`reviewed: false`; the validator reports each as a warning until they are reviewed in the gym.
Two moves had no hitbox at all and now carry one measured from the drawing's forward-most
limb rows: booster heavy contact (fist rows 36–43, drawn extent 35 against reach 38, the
owner's recorded exception) and oracle jab (rows 34–40, extent 41 against reach 40).

## Evidence

- `npm run check`: see `TEST_REPORT.md` 2026-09-24.
- `npm run arcade:validate`: 24 clips, 75 frames, 68 drawings, **0 errors, 22 warnings**
  (20 unreviewed clips; 2 hurt boxes on `oracle:heavy` that leave the drawing's silhouette
  on the sweep and settle poses, a real finding on boxes migrated by position in PR #98).
- `audit-arcade-clip.py --all`: 24 clips, **0 failing**. Review assets for three clips are in
  `preview-renders/mars-arcade/clips/`.
- Clip normaliser parity: Oracle counterattack sources normalised in `feet` mode at 13.6058
  match the shipped `normalised-counterattack-ready` cells with **0 differing pixels** ×3.
- Tool tests: `audit-arcade-clip.test.py` (4 cases), `normalise-arcade-clip.test.py`
  (14 checks: feet pop, planted-foot hold, preserve-canvas single offset, magenta and green
  keying, usage error), `pick-arcade-frames.test.py` (8 checks incl. ffmpeg extraction).
- Gym browser proof `tools/assets/check-arcade-gym.mjs` at 1440 and 768: clips listed, keyboard
  step/nudge/undo, onion skin and opponent overlay draw, playback parks at tick 13 on the jab's
  reset frame, a broken hold is refused at Save naming `hold-sum`, fit-to-drawing lands on the
  baseline, no console errors. Screenshots: `preview-renders/mars-arcade/gym-v2/`.
- Harness proofs on the table-driven selector: `check-arcade-booster-continuity.mjs` 2 PASS,
  `check-arcade-oracle-heavy-continuity.mjs` 2 PASS (labels now `heavy <phase> — <pose>`).
- Playwright caveat: run from a scratch copy beside the main checkout's `node_modules`
  (Playwright 1.61 / Chromium 1228); the worktree's 1.63 wants Chromium 1243, not installed.

## Not done, on purpose

- Milestone 3 (rules read the boxes, guard height, hit stop) is a balance change and its own PR.
- No box was hand-reviewed; every `reviewed: false` is honest.
- The video route has tools but no provider key; see the plan's decision A.
