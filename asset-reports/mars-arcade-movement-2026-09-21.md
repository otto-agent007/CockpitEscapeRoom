# Mars arcade movement and jumps — 2026-09-21

## Scope and status

Eight new dev-only sprites integrated: Sam forward shuffle2, and rise/apex/fall3each
for Elon and Sam. Runtime manifest now26cells. Approved identities/clothes, Sam40/Elon41
jab reach, damage/timing, game rules and460-frame counterattack inputs unchanged.
No production wiring, dependencies, commit, push or deployment.

This is a movement checkpoint, not full animation completion. Sam's rising head/torso
appears smaller than apex/fall, and knee extension changes silhouette height76→103px
while soles retain baseline119. The independent reviewer flagged this for motion polish;
do not claim owner-approved temporal smoothness. Heavy/special attacks, KO/win, effects,
Captain animation and production integration remain open.

## Sources and normalization

Built-in image generation used; no paid CLI/API fallback. Reference images:
`oracle/generated/exchange-v1/block-02.png` and
`booster/generated/wardrobe-sleek/anchor-00.png`, relative to `art-source/arcade/`.
Twelve raw outputs preserved under each fighter's `generated/movement-v1/`; exact
eight initial plus four correction prompts under `prompts/movement-v1/`.

Unchanged `normalise-popt-frame.py`, arcade contract, `--source-alpha --resample bilinear`.
Fixed source-pixels-per-cell-pixel13.60576923076923 Sam,14.038461538461538 Elon.
128x128 RGBA cells; baseline119/pivot64. Knee tuck legitimately shortens airborne
silhouettes: standing-height checks apply to forward walking, not airborne clips.
No per-pose scale retuning, Python/manual pixel edits or validator changes.

Selected copies under `{fighter}/normalised-movement-ready/` are byte-identical to
the following normalized candidates (all paths relative to the fighter directory):

| Fighter/pose | Candidate | Height |
| --- | --- | --- |
| Elon rise | normalised-movement-c1/airborne/airborne-00.png |97|
| Elon apex | normalised-movement-v1/airborne/airborne-01.png |85|
| Elon fall | normalised-movement-v1/airborne/airborne-02.png |100|
| Sam rise | normalised-movement-c2/airborne/airborne-00.png |85|
| Sam apex | normalised-movement-v1/airborne/airborne-01.png |76|
| Sam fall | normalised-movement-v1/airborne/airborne-02.png |103|
| Sam forward1 | normalised-movement-v1/walk-forward/walk-forward-00.png |104|
| Sam forward2 | normalised-movement-c1/walk-forward/walk-forward-01.png |104|

Initial Elon rise failed3tiny transparent holes; first correction passed and aligned
boot levels. Initial Sam rise failed2holes, first correction1hole at(57,104), second
correction passed. Initial Sam forward2 failed1hole; first correction passed. All failed
attempts retained. No pose exceeded the two-correction limit.12source plus8runtime
SHA-256 hashes: `preview-renders/mars-arcade/movement/SHA256SUMS`.

## Runtime and verification

Pure selector uses vertical velocity above0.6 for rising, below-0.6 for falling, otherwise
apex; no jump-rule modifications. Forward shuffle cycles every6ticks. Hitstun/blockstun
and backward guard retain priority; Captain and unauthored outcomes retain placeholders.

- TDD: five movement tests initially RED;66focused tests GREEN. Both facings/reduced-motion,
  velocity boundaries, immutability, real-engine landing and Captain fallback covered.
- Full `npm run check`: lint/types,687tests/54files and build pass. First typecheck exposed
  possibly-undefined paths from mapped arrays; fixed-length tuples and the existing walk
  fallback pattern fix the source. Whole command rerun GREEN; logs retained.
- Fresh unchanged asset checks pass3Elon +5Sam cells:

  ```bash
  python3 tools/assets/check-popt-frames-fullcolour.py art-source/arcade/booster/normalised-movement-ready --contract asset-reports/mars-arcade-sprite-contract.json
  python3 tools/assets/check-popt-frames-fullcolour.py art-source/arcade/oracle/normalised-movement-ready --contract asset-reports/mars-arcade-sprite-contract.json --standing-clip walk-forward
  ```

  A final verification attempt mistakenly invoked the old palette-only Pop T checker with
  its default intro contract and reported empty frames. It is not the arcade gate.
  Correct unchanged full-colour/arcade commands above passed, as did independent review.
- `node tools/assets/check-arcade-movement.mjs`:5PASS groups, actual canvas draw assertions
  for all8new cells via native inputs, mirrored identities, reduced motion and two missing
  apex images. Landing and controls survive failures;26/26normally loaded.
- `node tools/assets/check-arcade-exchange.mjs`:7PASS groups; original events167/227 and
  Sam336/416 retained; both idle460, replay/cancel/reload and missing-jab fallback.
- `node tools/assets/check-arcade-pilot.mjs`:12PASS groups;375/768/1440 no-overflow,
  keyboard/pointer, pause/step/restart, mirror/reduced-motion, all26images missing fallback.
  All three suites rerun after typing repair; no uncaught browser errors.
- `node tools/assets/record-arcade-movement.mjs`: real-time native controls at0.5x;
  two forward/jump cycles, both land idle. Increased recording viewport height so activating
  jump buttons does not scroll the game out of view; original recording source preserved.
- Independent read-only review: no blocking code findings; separately checked all8cells,
  priorities, tests, replay/rule preservation and whitespace. Visual caveat recorded above.
- Production exclusion scan and `git diff --check` pass. Whole-journey e2e and3D asset
  gates not rerun for this isolated dev harness.

## Evidence

`preview-renders/mars-arcade/movement/`: check/browser logs, phase screenshots in both
facings/reduced-motion modes, responsive375/768/1440captures, missing-art proof,
`pose-review.png`, `movement-motion-half.webm`, raw recording sources and hashes.
Pose sheet, rise/apex/fall and responsive captures inspected. Existing tmux image pane
reused for the pose sheet; no new session or pane created. Continuous-motion owner review
remains open and must not be inferred from automated checks.
