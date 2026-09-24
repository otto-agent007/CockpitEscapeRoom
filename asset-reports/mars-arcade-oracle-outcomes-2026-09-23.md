# Oracle round outcomes — 2026-09-23

## Result and scope

Dev-only continuation of Booster's round outcomes
(`mars-arcade-outcomes-2026-09-22.md`) for Oracle. Before this, `selectArcadeSprite` only
had round-end art for Booster, so every round Oracle won or lost ended on a combat pose.
Oracle now gets three victory beats and a harmless three-beat knockdown. Knockdown beat 0
reuses Oracle's approved recoil. Five new runtime images take the harness from 61 to 66
sources. No combat rules, balance, dependencies, normaliser, contract, production wiring
or deployment changed.

Victory is a friendly wave rather than Booster's fist V: relax out of stance, open hand
rising to shoulder height, then a full overhead wave. Knockdown goes from recoil through a
bracing mid-fall into a seated, good-humoured pose. Timing and behaviour match Booster
exactly: 12 presentation frames per beat, the final pose holds, reduced motion selects the
final pose, an airborne loser settles visually, and a healthy timeout loser rests on its
own anchor (before, Oracle fell through to the placeholder box at round end). Captain
outcomes remain unfinished.

## Source and normalisation provenance

Built-in Codex image generation (ChatGPT plan, no API key). References: Oracle's approved
anchor `generated/anchor-likeness-00.png` plus `generated/heavy-hit-v1/recover-00-c1.png`
(victory) or `generated/exchange-v1/recoil-02.png` (knockdown); ko-01 also used the
generated ko-02 as its seated end. Every prompt is in
`art-source/arcade/prompts/oracle-outcomes-v1/`. No hand-painted or script-repaired pixels.

| Runtime cell | Selected raw source | Occupied rows | Attempts |
| --- | --- | --- | --- |
| win/win-00.png | win-00-v2-c1.png | 15..119 (105) | source v1 rejected after initial + 2 corrections; v2 + 1 correction |
| win/win-01.png | win-01.png | 15..119 (105) | first attempt |
| win/win-02.png | win-02-c1.png | 10..119 (110, raised hand) | 1 correction |
| ko/ko-01.png | ko-01-c2.png | 52..119 (68) | 2 corrections |
| ko/ko-02.png | ko-02.png | 61..119 (59) | first attempt |

Runtime root: `art-source/arcade/oracle/normalised-outcomes-ready/`. Every failure was a
1-2 px transparent speck where a narrow gap sealed during downsampling, not a drawing
error. win-00 v1: throat notch under the chin, and both corrections left it in place, so
that source is rejected under the initial-plus-two rule and a fresh source was drawn.
win-02 and win-00 v2: hanging hand too close to the trouser leg. ko-01: elbow-to-knee
wedge and a gap between the ankles. Eleven generations in total.

Unchanged command for every source:

```bash
python3 tools/assets/normalise-popt-frame.py SOURCE DEST \
  --contract asset-reports/mars-arcade-sprite-contract.json \
  --source-px-per-cell-px 13.60576923076923 \
  --resample bilinear --source-alpha
```

Locating a speck: map the cell hole back through the fixed 13.6 scale from the figure's
bottom-left, not by bounding-box ratio. The ratio mapping put ko-01's first correction on
the wrong joint.

## Known presentation notes (not defects, flagged for owner)

- ko-01 is 68 rows tall: closer to seated (59) than standing (104). Booster's mid-fall is
  90. It reads as a front-loaded fall; a taller in-between would need a new source.
- The knockdown is aligned by its lowest pixels (the gate's foot-midpoint rule), which in
  the seated poses include the bracing hand, so the sneakers slide sideways between beats.
  Booster's approved knockdown does the same.
- KOs happen at jab range, so the seated loser overlaps the winner's legs. Booster's
  knockdown already does this; a fix would be presentation spacing, not art.

## Verification

- Selector tests (`src/dev/arcadeHarnessOutcomes.test.ts`): RED 4 fail / 6 pass against the
  old Booster-only selector, then GREEN. Gym manifest tests pass with the two new entries.
- `npm run check`: 831 tests in 70 files, lint, types and production build PASS.
- Gate: 5 frames, 0 failures (`gate.log`).
- Native-input browser: `check-arcade-outcomes.mjs` 12 groups PASS (Booster mirror plus the
  new Booster-vs-Oracle matchup, both winners, both motion preferences, draw, time win,
  time win with Oracle resting) and the missing-art run PASS. Adjacent suites all PASS at
  66 sources: pilot, heavy, movement, exchange, heavy-block, space-laser, continuity,
  heavy-hit (both attackers), HUD and stage. Gym probe lists `oracle:victory` and
  `oracle:knockout` with no page errors.
- Browsers used Playwright 1.61 / Chromium 1228 from the main checkout, since main's
  Chromium 1243 download timed out. Not run: full-journey e2e, 3D asset suite, real-time
  recording. Art is technically verified, not owner-approved.

## Evidence

`preview-renders/mars-arcade/oracle-outcomes-v1/`: `versus-outcomes-sheet.png` (four
in-game frames), `runtime-cells-sheet.png`, per-beat canvas screenshots for both winners,
`time-win-versus.png`, `missing-winner-1-beat-2-reduced-false.png`, browser and gate logs,
and `SHA256SUMS` for the five selected raws and runtime cells. Rejected raws and
intermediate normalised folders stay local only.

```bash
ARCADE_PILOT_URL=http://127.0.0.1:5352/dev/arcade.html node tools/assets/check-arcade-outcomes.mjs
ARCADE_MISSING_OUTCOMES=1 node tools/assets/check-arcade-outcomes.mjs
python3 tools/assets/check-popt-frames-fullcolour.py \
  art-source/arcade/oracle/normalised-outcomes-ready \
  --contract asset-reports/mars-arcade-sprite-contract.json
```
