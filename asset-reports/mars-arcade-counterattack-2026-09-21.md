# Mars arcade — counterattack candidates (2026-09-21)

## Current outcome: approved40px counterattack integrated, dev-only

Owner accepted keeping jab02 and matching Sam's real reach to40px, then explicitly asked
to continue developing the animations. This supersedes the34px target and repair proposal
in the historical checkpoint below. No further generation or Python image editing occurred.
Damage4/chip1 and timing5/2/8 are unchanged; Elon's41px jab and all other rules are preserved.

Five new runtime copies are byte-identical to their selected normalized originals:

- Sam: `art-source/arcade/oracle/normalised-counterattack-ready/{anticipation,jab,recovery}/`.
  Runtime names are `<clip>-00.png`; sources are anticipation00, jab02 and recovery01.
- Elon: `art-source/arcade/booster/normalised-sleek-ready/{block,recoil}/`, each `<clip>-00.png`.

All18 runtime cells pass unchanged numeric gates. Sam's active fist reaches40px exactly,
matching the approved rule. The dev selector now renders three Sam jab phases and two Elon
defensive reactions, retaining footwork, reduced-motion essential action, load failures and
round-end/unauthored placeholders. The native replay retains frames0..290 unchanged and
appends Sam's blocked jab at336 and clean jab at416, returning both fighters idle at460.
Outcomes still come from real inputs, not direct health/state manipulation.

### Fresh integration verification

- Test-first RED:9expected failures exposed the old reach, absent poses and missing response.
  One guard fixture was corrected after reading engine order: movement occurs before hit
  collection and wall clamping, so the defender walks32.5→40 over six ticks, not from40 at
  the wall. No engine workaround. Focused61tests then pass.
- `npm run check`: lint/types pass, **682tests /53files pass**, production build2.51s.
- Six unchanged sprite-checker commands cover18 runtime cells,0failures. Normalizer3tests,
  prior pixel-repair2tests, and clean plus7negative gate fixtures all pass.
- `node tools/assets/check-arcade-exchange.mjs`:7PASS groups, actual canvas draws all five
  new poses; original block167/hit227 plus new block336/hit416; both return idle460.
  Reduced motion and missing Sam jab do not prevent completion; replay/cancel/reload pass.
- `node tools/assets/check-arcade-pilot.mjs`:12PASS groups, native keyboard/pointer controls,
  pause/step/restart, mirrored fighter selection,375/768/1440 layouts, reduced motion and
  all18images missing fallback. No uncaught browser errors in either suite.
- `node tools/assets/record-arcade-exchange.mjs`:normal and half-speed real-time recordings
  both show the four expected event frames; no simulation-clock override for recordings.
- Isolated `agent-browser --session counterattack-final`:live18/18ready and native controls
  confirmed; session closed. Browser plugin unavailable; installed Playwright used.
- Independent read-only review found no blocking issues; it checked priorities, unchanged
  rules/input history, tests and byte-identical copies. Its optional Vitest run was blocked
  by read-only temporary-config writes (EROFS), so test results above are the coordinator's.
- Production exclusion scan found no arcade content or dev/art-source directories in dist.
  `git diff --check` passes. No new dependency, production entry, commit, push, PR or deploy.

Evidence in `preview-renders/mars-arcade/counterattack/`: `sam-{startup,blocked,recovery,hit}.png`,
`exchange-{375,768,1440}.png`, browser/check logs and `exchange-motion-{half,normal}.webm`.
The actual game canvas `sam-hit.png` is displayed in the existing tmux sidebar. Startup,
block, hit, recovery and all three responsive screenshots visually inspected.

This is a bounded counterattack animation pass, not the full animation set or production
integration. Sam forward movement, other attacks, airborne/KO poses and effects remain
unauthored. Owner continuous-motion review remains open. Whole-journey e2e and3D asset
checks were not rerun. Earlier art and prompt provenance follows unchanged.

## Historical art checkpoint: incomplete before owner40px decision

Owner approved Sam wind-up/jab/recovery and Elon block/recoil after accepting the guarded
backward-footwork checkpoint. Four poses pass their objective gates. The active Sam jab
does not meet the unchanged34px reach within3px, even after two corrective generations.
Stop at the planned correction cap. No game rules, selectors, tests or runtime sources changed.
The previously working13-sprite exchange remains intact. No manual pixel edits performed.

## Sources and exact prompts

Built-in image generation used for all eight outputs; no paid CLI/API fallback.
Edit references: `art-source/arcade/oracle/generated/exchange-v1/block-02.png` and
`art-source/arcade/booster/generated/wardrobe-sleek/anchor-00.png`.
All raw outputs preserved in `art-source/arcade/{oracle,booster}/generated/counterattack-v1/`.
Exact prompts: `art-source/arcade/prompts/counterattack-v1/`, five initial prompts plus
`oracle-jab-c1.txt`, `oracle-jab-c2.txt`, and `oracle-recovery-c1.txt`.

The unchanged normalizer was invoked with `--source-alpha --resample bilinear`, the arcade
contract, and fixed source-pixels-per-cell-pixel13.60576923076923 for Sam or14.038461538461538
for Elon. Sources and all normalized attempts are separate; no prior approved files replaced.

Paths below are relative to `art-source/arcade/`. All cells are128x128 RGBA, baseline119,
pivot64. Every selected pose passed the unchanged silhouette, chroma and standing-height
checks, but jab reach is a separate measurement and still FAILS.

| Candidate | Normalized path | Height | Result |
| --- | --- | --- | --- |
| Sam wind-up | `oracle/normalised-counterattack-v1/anticipation/anticipation-00.png` |105| PASS |
| Sam pullback | `oracle/normalised-counterattack-c1/recovery/recovery-01.png` |106| PASS |
| Elon block | `booster/normalised-counterattack-v1/block/block-00.png` |102| PASS |
| Elon recoil | `booster/normalised-counterattack-v1/recoil/recoil-00.png` |104| PASS |
| Sam jab, last attempt | `oracle/normalised-counterattack-c2/jab/jab-02.png` |106| FAIL reach40; needs31..37 |

## Findings and correction history

Original Sam jab00: reach39, silhouette clean. Correction01 shortened too far: reach27,
silhouette clean. Correction02 lengthened too far: reach40, silhouette clean. Actual
alpha>8 bounds of final jab x40..104;104 minus pivot64 equals40. Do not expand combat reach,
change fixed scale or relax checks to accept it. The second correction is the planned limit.

Original Sam recovery00 had two enclosed one-pixel transparent holes at cell(68,41) and
(65,56), in narrow arm/chin gaps after normalization. Targeted generation01 closed them;
unchanged checker then passed. No Python/manual pixel repair was used.

Source hashes (SHA-256):

- Sam anticipation00: `b720b0958908b78266a37fef5fcc724a62a2f32ec5b1eb90620952101db04e26`
- Sam jab00: `ff9a01fc2946a404c9c3053ae428d808b0842f12e556b87e7f961fd0b8f19867`
- Sam jab01: `751f779e4af1fa73b8d94258726db565bd0d38951d9af8423df27ab9002b2fa1`
- Sam jab02: `5b21b4d7883ac33917cc3ab03af42de6ec41240826fbed0d4032f434d8e54ce5`
- Sam recovery00: `bac31bc7f5c79bcfde1f43893acf4e6837566c30befc2c02e9453e4e39dcae81`
- Sam recovery01: `9da1d67d78c596afed19894c8e67e63371a8833d272663783da0c3bd1d504b53`
- Elon block00: `1701ef3cad0c42350d0f4911b9c55037230d34bb5af78f98c6203d99555bbbc6`
- Elon recoil00: `a1056d05a94992e60d80d69d10c174d405935b7cde2b09e24f3cff405c7f2609`

## Checks actually run

`python3 tools/assets/normalise-popt-frame.py INPUT OUTPUT --contract
asset-reports/mars-arcade-sprite-contract.json --source-px-per-cell-px SCALE
--resample bilinear --source-alpha` for each of eight preserved outputs.

`python3 tools/assets/check-popt-frames-fullcolour.py DIRECTORY --contract
asset-reports/mars-arcade-sprite-contract.json --standing-clip CLIP ...`:

- Oracle v1:3frames,1failure (original recovery specks).
- Booster v1:2frames,0failures.
- Oracle c1:2frames,0failures (jab nonetheless fails separate reach check).
- Oracle c2:1frame,0failures (jab nonetheless fails separate reach check).

Read-only alpha/bounds scan via `/tmp/measure-arcade-cells.py`; SHA-256 via `sha256sum`.
Contact sheet rendered with installed Playwright (`/tmp/counterattack-contact.cjs`), saved
as `preview-renders/mars-arcade/counterattack/pose-review.png`, visually inspected and shown
in the existing tmux pane. Browser plugin not available; this is an asset contact sheet,
not a gameplay/browser milestone. No new replay video or responsive gameplay check claimed.

No application code changed, so npm check, gameplay browser suites, full-journey e2e and
3D checks were not rerun. No deployment, commit, push or PR. Integration, TDD, counterattack
input recording and runtime/browser verification remain pending after jab repair approval.

Independent read-only asset review confirmed the five geometric passes and the separate
jab reach failure (40px at alpha>8;39px even at alpha>=250), plus prior39/27px attempts.
Outfits/likeness and distinct reaction poses were visually consistent with current anchors;
no additional material visual concern. Reviewer did not judge animation, mirrored contact,
actual gameplay or normalization-command provenance. `git diff --check` passes.

Proposed next owner decision: authorize a localized deterministic forearm-length repair
targeting34px, preserving source/normalized originals and all unrelated pixels, followed by
the identical gates and explicit reach measurement. This is NOT yet authorized or performed.
