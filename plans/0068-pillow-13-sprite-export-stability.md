# Pillow 13: keep sprite exports byte-identical and main green

## Purpose

No player-visible change. Re-exporting a fighter sprite must give exactly the pixels the owner
approved, whichever Pillow is installed, and `main` must not go red because a library released.
Since 2026-10-17 every nightly CI run on `main` and every open PR (#112, #113) has failed
`quality`, so nothing could merge.

## Current state

- `.github/workflows/ci.yml` installed `numpy pillow` unpinned, so it picked up Pillow 13.0.0
  (released 2026-10-16 22:15 UTC; last green nightly 2026-10-16 13:53, first red 2026-10-17 12:52).
- `tools/assets/normalise-popt-frame.test.py` → `test_default_export_remains_byte_identical`
  re-exports the booster, oracle and captain anchors and compares them with the committed
  `art-source/arcade/<fighter>/<folder>/anchor/anchor-00.png`. It fails on Pillow 13.

## Scope

In: the Pop T frame normaliser's resize calls, the CI Python install, Dependabot for it, and the
change filters that decide whether a pip-only change needs the browser suite or a Vercel build.
Out: other tools' resize calls (see Outcome), any sprite re-export, any test change.

## Context and constraints

- `CLAUDE.md`: never weaken a test to make it pass. The byte-identity test stays as it is.
- Pillow 12.3.0 has 14 high-severity advisories, all fixed only in 13.0.0 (`dependency-review`
  fails a PR that pins 12.3.0). Staying on 12.x is not an option.
- Terms: a *pass* is one direction of Pillow's two-step resample (all rows, then all columns,
  or the reverse). Between passes the image is stored at the source precision, so 8-bit images
  are rounded and clipped there.

## Progress

- [x] Find the failing step and correlate it with the Pillow 13.0.0 release.
- [x] Measure: pixels, not just PNG compression, change (below).
- [x] First attempt: pin `pillow==12.3.0`. Rejected: `dependency-review` failed on #114 with 14
      high-severity advisories.
- [x] Isolate the cause and fix the normaliser so Pillow 13 reproduces the committed bytes.
- [x] Pin `pillow==13.0.0`, `numpy==2.5.4`; Dependabot `pip` entry; inert-file filters.
- [ ] CI green on #114; owner merges; `@dependabot rebase` on #112 and #113.

## Discoveries

- Under Pillow 13 the default export changes 1351/3072 (booster), 1061/1990 (oracle) and
  1116/2079 (captain) visible pixels; mean change 1.0-1.6 levels, max 33/56/69; 8/4/5
  silhouette pixels flip.
- Not the cause, each checked against both versions: PNG decoding (matches an independent
  zlib + PNG-filter decoder exactly), `convert("RGBA")`, the `reducing_gap` release note (the
  normaliser never passes it or calls `thumbnail()`), and resize at 2-5:1 ratios.
- The cause: python-pillow/Pillow#9549 (commit c65fe0814, in 13.0.0) runs the vertical pass
  first when `(in_h - out_h) > 2 * (in_w - out_w)`. A standing figure qualifies: booster
  665x1460 -> 47x104 gives 1356 > 1236. A trace of every `resize()` call shows identical inputs
  and different outputs on exactly those calls.
- Float (`F`) images keep full precision between passes, so the opt-in bilinear path was
  already stable; only the 8-bit LANCZOS paths drifted.

## Decision log

- 2026-10-23: fix the pass order in code rather than re-baseline. Re-baselining would change
  approved art and still leave exports dependent on the Pillow version.
- 2026-10-23: keep an exact pin even though the code is now order-independent, so the next
  behaviour change arrives as a failing Dependabot PR, not a red `main`.
- 2026-10-23: `tools/requirements.txt` is deploy- and suite-inert as an exact file, because
  only the `quality` job installs it; the directory-only prefix rule stays.

## Implementation steps

1. `tools/assets/normalise-popt-frame.py`: `resize()` helper does width, then height, as two
   `Image.resize` calls; all four resize sites use it.
2. `tools/requirements.txt` pins the packages; `ci.yml` installs from it.
3. `.github/dependabot.yml`: `pip` entry for `/tools`.
4. `tools/vercel/should-build.mjs`: `DEPLOY_INERT_FILES`; tests in `should-build.test.mjs`
   and `tools/ci/changes.test.mjs`.

## Validation plan

Reference = the original code on Pillow 12.3.0 (how the committed sprites were made). The new
code must match it byte for byte on Pillow 12.3.0 and 13.0.0 across the default, bilinear and
`--source-alpha` paths; CI's Python step and `npm run check` must pass on the pinned versions.

## Acceptance criteria

- `normalise-popt-frame.test.py` passes unchanged on Pillow 13.0.0 and 12.3.0.
- `dependency-review`, `quality` and `browser-smoke` pass on #114.

## Repair loop and stop conditions

One repair was needed (the 12.3.0 pin). Stop when CI is green on #114, or ask the owner if
13.0.0 itself gains an advisory before merge.

## Evidence

All run locally on 2026-10-23 in `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/pin-pillow`
(Python 3.12, uv venvs).

| case | old code, Pillow 13 | new code, Pillow 12.3 | new code, Pillow 13 |
|---|---|---|---|
| booster / oracle / captain, LANCZOS | different | identical | identical |
| booster / captain, `--resample bilinear` | identical | identical | identical |
| block-00, bilinear + `--source-alpha` | identical | identical | identical |
| recoil-00, LANCZOS + `--source-alpha` | different | identical | identical |
| compress-00, bilinear + `--source-alpha` | identical | identical | identical |

- CI's "Python tool tests" commands, venv from `tools/requirements.txt` (Pillow 13.0.0, numpy
  2.5.4): 7/7 `tools/assets/*.test.py` pass and 35 `cockpit_pipeline` tests pass. Same on
  Pillow 12.3.0. The original code on Pillow 13.0.0 reproduces CI's 3 failures.
- `npm run check` with that venv first on `PATH`: lint, typecheck, 985 tests in 89 files, build.
- GitHub advisory database: 0 advisories affect pillow 13.0.0 or numpy 2.5.4; the same
  query returns 12 for pillow 12.3.0, so the query can find them.
- Not run locally: the Playwright suite (CI runs it on #114).

## Outcome and handoff

Open: CI on #114, owner merge, then `@dependabot rebase` on #112 and #113 (a re-run reuses the
old merge commit and fails again).

Known limitation: other tools that resize 8-bit images (`normalise-scramble-sprite.py`,
`build-intro-emblem.py`, `build-tmb2-ident-assets.py`) have no byte-identity test. On a tall
input under Pillow 13 they could drift by the same mechanism if re-run. Use the same two-call
resize there before re-exporting their assets.
