# Booster heavy arm-continuity repair — 2026-09-21

## Owner finding and scope

Owner identified the wind-up raising the foreground arm while the original contact
extended the farther arm. This is an artwork continuity defect, not an engine phase
bug. Earlier passing asset/runtime checks did not prove anatomical continuity.

Preserve startup and replace only Booster contact/recovery so the same near arm
descends through contact and follows through across the abdomen. Far glove stays
guarding. Preserve likeness/clothes, scale14.038461538461538, heavy reach38±3,
timing11/4/18, damage13, Sam art and every other move. No pixel repairs, validator
changes, production wiring or deployment. Two correction generations maximum per
replacement pose. Three key poses are not complete in-between animation.

## Provenance and attempts

Built-in imagegen, no CLI/API fallback. Initial edit target:
`booster/generated/heavy-v1/startup-00.png`. Each correction edits its previous
candidate. All paths below are relative to `art-source/arcade/`.

- Exact prompts: `prompts/heavy-continuity-v1/`.
- Raw attempts: `booster/generated/heavy-continuity-v1/`.
- Normalized attempts: `booster/normalised-heavy-continuity-{v1,c1,c2}/`.
- Normalizer unchanged, same contract, `--source-alpha --resample bilinear` and
  fixed source scale14.038461538461538; no per-pose fitting or manual pixel edits.
- Initial contact has correct near-arm attachment but inadequate reach: maxX27 is
  actually the boot, not the fist; one alpha hole at74,67. Recovery has two tiny
  holes at75,62 and76,65. All128x128 cells have height103/baseline119.
- First correction contact reaches42, outside38±3; still too horizontal and one
  hole at73,66. Recovery retains two holes. Both rejected, no runtime switch.
- Final corrections preserve the same-arm descending motion, but contact's maximum
  silhouette reach is29 at the boot; actual fist band rows45–64 reaches27 (tip at
  rows57–61), below the required35–41. Contact has no tiny alpha holes. Recovery
  retains the same two holes at75,62 and76,65. Both remain height103.
- Both poses exhausted their two-correction cap. All six sources, six normalized
  attempts and exact prompts remain preserved. Neither replacement is integrated.
  No further generation or local pixel repair was performed. A new owner-authorized
  artwork pass is required to continue beyond this bounded batch.

## Verification status

The existing four-test heavy suite was made RED for the required versioned Booster
source root:1failed/3passed against the unchanged old runtime. This assertion only
checks source selection, not limb continuity. Because candidates failed acceptance,
the source-version expectation and browser-source assertions were restored to their
pre-repair form. Fresh four-test heavy suite passes against the unchanged runtime.
This is NOT evidence that the owner's reported animation bug is fixed in the game.
Prior assets and motion evidence preserved. No new ready directory or selector edit.

Before/candidate sheet is in `preview-renders/mars-arcade/heavy-continuity/` and
displayed via the existing owned tmux pane; lower row explicitly says CANDIDATE.
`SHA256SUMS` records all12source/normalized candidates. `c2-gate.log` records the
unchanged gate failure (two frames, one failing recovery); `c2-measurements.log`
records the separate contact-reach failure; `unit-current-runtime.log` records4PASS.
A native-control isolated both-facing recorder is prepared, but not run against
rejected art. No corrected-motion proof, fullcheck, browser regression, production
build or completed repair is claimed for this batch. Existing dev server stays open.

Independent read-only review inspected startup/contact/recovery and reran measurement:
same-arm identity is improved, but contact reach and recovery holes still reject the
candidate. Temporal smoothness, both-facing gameplay and runtime checks were explicitly
not certified. Review agrees to preserve failed attempts and request a new art pass.
