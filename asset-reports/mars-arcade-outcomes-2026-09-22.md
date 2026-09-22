# Booster round outcomes — 2026-09-22

## Result and scope

Dev-only Wave1 continuation: three victory beats and three harmless knockdown beats,
with the existing recoil reused for the first knockdown beat. Five new runtime images
bring the preload list to38 unique sources. The accepted V4 C2 overhand contact is
unchanged (verified against its saved SHA256). No combat rules, balance, dependencies,
normalizer, contract, production wiring or deployment changed.

Victory lifts the gloves from a low reset through shoulder height into a compact V.
Knockdown goes from recoil through a supported sit-down into a seated pose. Each beat
lasts12 presentation frames; the final pose holds. A separate presentation clock works
after the rules engine freezes, respects pause/step/playback speed and resets each round.
Reduced motion immediately selects the final pose. An airborne terminal fighter settles
visually without changing rules coordinates. Healthy timeout losers and draws remain
standing; Sam and Captain outcome art remains explicitly unfinished.

## Source and normalization provenance

Built-in image generation used the existing sleek Booster anchor as identity/clothing
reference. All nine raw outputs and exact prompts are retained under
`art-source/arcade/booster/generated/outcomes-v1/` and
`art-source/arcade/prompts/outcomes-v1/`. No manually painted or Python-repaired pixels.

| Runtime cell | Selected raw source | Normalized occupied height |
| --- | --- | --- |
| win/win-00.png | win-00.png |105px|
| win/win-01.png | win-01-c1.png |105px|
| win/win-02.png | win-02.png |106px|
| ko/ko-01.png | ko-01-c1.png |90px|
| ko/ko-02.png | ko-02-c2.png |66px|

Runtime root: `art-source/arcade/booster/normalised-outcomes-ready/`.
KO beat0 reuses `normalised-sleek-ready/recoil/recoil-00.png` without another preload.
Original and corrected normalized candidates remain in separate versioned directories.
Win01 needed one correction to open the glove/head gap; KO01 needed one correction to
close a trouser-seam speck; seated KO02 needed two corrections at the underarm/waist.
All were generator corrections, within the two-correction-per-source limit.

The unchanged command used for every source was:

```bash
python3 tools/assets/normalise-popt-frame.py SOURCE DEST \
  --contract asset-reports/mars-arcade-sprite-contract.json \
  --source-px-per-cell-px 14.038461538461538 \
  --resample bilinear --source-alpha
```

128px cells, baseline119, pivot64 and the existing envelope remain unchanged. Shorter
occupied KO heights are intentional seated poses, not rescaled standing characters.

## Verification and review

- New outcome selector tests: observed RED before implementation, then5/5GREEN.
  Both sides/winners, all beat boundaries, preload membership, immutable input state,
  reduced motion, healthy timeout/draw, doubleKO, unchanged combat selection and
  airborne render-only settling covered.
- `npm run check`: lint, types,696 tests in56 files and production build PASS.
- Unchanged full-colour asset checker: five selected cells, zero failures.
- Native-input Playwright: both winners, both reduced-motion preferences, actual
  canvas-drawn sources at each beat, pause/step/resume, half speed, restart/reload,
  375/768/1440 layouts, actual timeout draw/winner and missing-image fallback.
  Displayed combat values remain frozen; this is not a bytewise assertion of every
  engine field (the engine accumulator can still change).
- Explicit native KO with all five new images unavailable: PASS, box fallback intact.
- Adjacent browser suites: heavy13, continuity2, exchange7, movement5, pilot12 groups
  PASS. Their image readiness totals were updated without weakening assertions;
  evidence now goes into a separate outcomes regression folder.
- Real-time native-input recording: both winners PASS,23.28seconds, no uncaught page
  errors. Paused screenshots and sampled recording frames inspected in both facings.
- Read-only independent review found no blocking/critical/high issue. It caught the
  old result banner crossing the celebration: a new y-position assertion was RED,
  then GREEN after moving only terminal result text above the fighters.

Browser plugin unavailable: used the installed Playwright with real controls, no game
state injection. Page errors are checked; no separate exhaustive console-warning audit
or full tribute journey rerun. New art is technically verified, not owner-approved.

## Evidence and reproduction

All evidence is under `preview-renders/mars-arcade/outcomes-v1/`:
`pose-ready.png`, `winner-*-beat-*-reduced-*.png`, `outcome-{375,768,1440}.png`,
`booster-outcomes-normal.webm`, RED logs, browser/regression/fullcheck logs and
`SHA256SUMS`. The original raw recorder outputs are preserved in `recording-sources/`.

```bash
node tools/assets/check-arcade-outcomes.mjs
ARCADE_MISSING_OUTCOMES=1 node tools/assets/check-arcade-outcomes.mjs
node tools/assets/record-arcade-outcomes.mjs
python3 tools/assets/check-popt-frames-fullcolour.py \
  art-source/arcade/booster/normalised-outcomes-ready \
  --contract asset-reports/mars-arcade-sprite-contract.json
```

Remaining: Sam/Captain outcomes, specials, in-between polish and effects. Earlier eye
tint feedback remains open; this batch does not authorize or perform eye-pixel edits.
