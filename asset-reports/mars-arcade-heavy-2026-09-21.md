# Heavy attack key poses — 2026-09-21

Owner subsequently found a Booster arm swap between startup and contact. The checks
below are historical geometry/runtime evidence, not acceptance of limb continuity.
Repair tracking: `mars-arcade-heavy-continuity-2026-09-21.md`; original sources and
recordings remain preserved.

## Outcome and limits

Dev harness now draws Elon's overhand and Sam's low sweep through startup, contact and
recovery. Six new cells,32runtime sprites. Existing heavy rules remain unchanged:
staticFire reach38/timing11-4-18/damage13; hardCutoff reach40/timing13-3-20/damage11.
Approved jab reach41/40, wardrobe, likeness direction and previous26cells untouched.

This is a three-key-pose pilot per move, not the complete5/6drawing allocation. The
contract budget is unchanged. Heavy in-betweens, specials/landing outcomes, KO/win,
effects, Captain animation and Sam jump proportion polish remain open. No production
wiring, dependencies, deployment, commit, push or owner continuous-motion approval.

## Art provenance

Built-in image generation, no CLI/API fallback. References:
`art-source/arcade/booster/generated/wardrobe-sleek/anchor-00.png` and
`art-source/arcade/oracle/generated/exchange-v1/block-02.png`.
Thirteen generated sources preserved in each fighter's `generated/heavy-v1/`:
six initial, four first corrections and three second corrections. Exact prompts:
`art-source/arcade/prompts/heavy-v1/`. All failed attempts remain.

Unchanged normalizer with arcade contract, `--source-alpha --resample bilinear`;
fixed source-pixels-per-cell-pixel14.038461538461538Elon/13.60576923076923Sam.
128x128RGBA; baseline119/pivot64. No manual/Python pixel repairs.

All selected copies are byte-identical under `normalised-heavy-ready/`.
Candidate paths below are relative to `art-source/arcade/{fighter}/`:

| Fighter/phase | Candidate | Height | Active reach |
| --- | --- | --- | --- |
| Booster startup | normalised-heavy-v1/heavy-startup/heavy-startup-00.png |103|—|
| Booster active | normalised-heavy-v1/heavy-active/heavy-active-00.png |101|40; target38±3|
| Booster recovery | normalised-heavy-c2/heavy-recovery/heavy-recovery-00.png |103|—|
| Oracle startup | normalised-heavy-c2/heavy-startup/heavy-startup-00.png |92|—|
| Oracle active | normalised-heavy-c1/heavy-active/heavy-active-00.png |73|42; target40±3|
| Oracle recovery | normalised-heavy-c2/heavy-recovery/heavy-recovery-00.png |103|—|

These are dynamic leaning/crouching poses, not standing-height clips. In particular,
Elon active101px would fail optional104±2standing validation; its forward lean/flexed
knees deliberately lower the silhouette. Body scale was not retuned to force acceptance.
Sam's striking toe ends on rows101–104 (15–18px above baseline), visibly a low sweep.
Elon's fist is the furthest forward surface. Reach uses alpha>8 maxX minus pivot64.

Correction history: initial Sam active53px shortened to42px on first correction.
Elon recovery two tiny holes persisted throughc1, resolvedc2. Sam startup two holes→one
two-pixel hole→clean. Sam recovery one→three→clean. Final targeted contour overlaps
resolved the remaining chin/forearm/knee gaps without changing the checker. No pose
exceeded two corrective generations.13source +6ready hashes:
`preview-renders/mars-arcade/heavy/SHA256SUMS`.

## Runtime and verification

Pure sprite selection follows `marsArcadeActiveMove` only while activity is attack and
the fighter is not Captain. Hitstun/blockstun remain higher priority, round-end fallback
remains, and reduced motion retains the essential combat poses. No state mutation.

- Four new tests initially RED on missing poses; then GREEN. They exercise literal
  startup/active/recovery boundaries, both sides/reduced motion, defense interruption,
  purity, Captain/KO fallback and real-engine whiff-to-idle cycles.
- Full `npm run check`: lint/typecheck,691tests/55files and production build pass.
  The prior placeholder test intentionally moved from now-authored heavy to still-
  unauthored special. No existing gameplay expectation weakened.
- Unchanged asset commands each pass3frames:

  ```bash
  python3 tools/assets/check-popt-frames-fullcolour.py art-source/arcade/booster/normalised-heavy-ready --contract asset-reports/mars-arcade-sprite-contract.json
  python3 tools/assets/check-popt-frames-fullcolour.py art-source/arcade/oracle/normalised-heavy-ready --contract asset-reports/mars-arcade-sprite-contract.json
  ```

- Browser plugin not available; installed Playwright used on
  `http://127.0.0.1:5317/dev/arcade.html`. Flow: load native dev harness → toggle humanP2
  → real held movement → heavy button → actual engine attack/defense/idle.
- `node tools/assets/check-arcade-heavy.mjs`:13PASS groups. P1Elon right-facing and
  P2Sam left-facing × hit/block/whiff × reduced motion on/off; all six actual canvas
  source draws checked. Six missing heavy images yield26/32ready and box fallback;
  both attacks finish safely. No uncaught errors.375/768/1440screenshots show responsive
  controls without horizontal overflow. Unit tests cover swapped identities/sides.
- `check-arcade-exchange.mjs`:7PASS groups, original counterattack schedule retained.
  `check-arcade-movement.mjs`:5PASS groups, both jumps/forward footwork and landing.
  `check-arcade-pilot.mjs`:12PASS groups, keyboard/pointer, pause/step/reload/restart,
  mirror, responsive/reduced motion and all32images missing fallback.
- Initial new-script failures: incorrect `#events` locator (actual `#log`); approach
  stopped at49px, outside38reach; subsequent exact24px wall assertion observed22.8px.
  Corrected proof setup with numeric legal-reach precondition. Game rules untouched.
  Hits now converge near center, while guard cases deliberately pin defender at wall.
- `record-arcade-heavy.mjs` saves native-input0.5x video: both fighters visibly execute
  heavy attacks, three hit events and one later whiff after knockback. No clock overrides.
- Independent read-only review found no blockers, checked six cells/copy identity and
  rules/priority preservation. Earlier wall-hit framing was flagged; centered hit capture
  was added. Reviewer did not certify smoothness or full animation completion.
- Production exclusion scan and whitespace check pass. Whole-journey e2e and3D asset
  checks not rerun for this isolated dev harness.

## Evidence

`preview-renders/mars-arcade/heavy/` holds fullcheck/browser logs, startup/contact/recovery
screenshots,375/768/1440 layouts, missing-art proof, hashes, candidate/final contact
sheets and `heavy-motion-half.webm` plus original recording sources.
Final pose sheet is in the reused tmux sidebar. Runtime pose/contact and responsive
captures inspected; half-speed recording sampled as a frame timeline. Complete
continuous-motion visual acceptance remains the owner's review.
