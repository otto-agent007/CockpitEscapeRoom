# Professional CI/CD workflow

## Purpose

The maintainer (the owner) waits less on CI and gets more protection from it. Each PR
costs one browser-test run instead of one per push. `main` cannot go red. The project's
own "never" rules (the Model Y spoiler, no new production dependency without review, no
tracking) are enforced by machines, not memory. Review evidence arrives on the PR without
anyone asking.

## Current state (2026-09-23)

- `.github/workflows/ci.yml`: every PR push runs `quality` (lint, types, 700+ unit tests,
  build, asset checks, about 1 min) and `browser-smoke` (93 Playwright tests on 1 worker, **30-55 min**).
  No concurrency control, so superseded runs keep going. It ran 10 times in a day for
  dev-only arcade work that the e2e suite never exercises.
- `main` has no branch protection. Auto-merge is off. The repo is owned by a personal account.
- There is no Dependabot, no CodeQL, and no dependency review.
- The Python tool tests (4 asset tests, 35 pipeline tests) never run in CI.
- Vercel builds previews and production from Git, skipping inert paths via
  `tools/vercel/should-build.mjs`.

## Scope

In scope, all in ONE PR (owner rule, `pr-batching` memory):

1. **Speed:** concurrency cancel, browser tests skipped on drafts, Playwright browser cache,
   4-way sharding, a nightly full run, and change detection that reuses the Vercel inert-path list.
2. **Safety:** branch protection with required checks, auto-merge, Dependabot, CodeQL,
   actions pinned to commit SHAs, and least-privilege permissions.
3. **Rule guards:** spoiler, new production dependency, privacy, asset budgets, Python tests.
4. **Review evidence:** gate screenshots at 375/768/1440, visual regression (report-only
   until baselines are approved), axe accessibility, and Lighthouse.
5. **Releases:** release-please changelog and tags, and a `production` environment gate.

Excluded: changing how Vercel deploys production. Making the environment gate the real
production switch needs a Vercel token and a Vercel setting that only the owner can provide
(see Handoff).

## Context and constraints

- Playwright runs `workers: 1` on purpose, because large GLBs contend for GPU memory.
  Parallelism therefore comes from sharding across runners, never from workers.
- A check that cannot fail is worse than none (`checks-that-cannot-fail` memory). Every
  guard gets a test that proves it rejects a planted violation.
- CLAUDE.md forbids unexplained production dependencies, analytics, tracking and paid APIs.
  Any new devDependency is named and justified in the PR.
- The required check names `quality` and `browser-smoke` must stay stable, so open PRs
  running the old workflow still satisfy branch protection.

## Progress

- [x] 2026-09-23 Calibrated guards against the real build. See Discoveries.
- [x] 2026-09-23 Workflows (ci, dependency-guard, codeql, release), Dependabot, release-please config,
      Lighthouse config; guard scripts in `tools/ci/` with tests; shared `e2e/journeyStates.ts`;
      `e2e/accessibility.spec.ts`; `e2e/review-evidence.spec.ts`.
- [x] 2026-09-23 Local validation: actionlint 1.7.12 + shellcheck 0.11.0 clean on all four
      workflows; `npm run check` 797 tests / 68 files + build PASS; guards pass on a fresh build;
      accessibility 6/6 PASS locally, including the planted-violation test; gate screenshots 15/15
      captured locally (2.9 min on a GPU).
- [ ] Push, observe the real CI run, fix
- [ ] Repository settings (protection, auto-merge, Actions PR permission), applied after merge
- [ ] Handoff notes

## Discoveries

- **The entry bundle contains "The red Tesla Model Y is unlocked."** It is the reward line in
  the content table, bundled into `index-*.js`, which every player downloads at the start. It
  is never rendered early, but it is readable in the page source. It is flagged for the owner
  and allow-listed in the spoiler guard as a known, documented occurrence, so that any NEW
  occurrence fails. The intro-asset validator's rejection regex is the other known occurrence.
- The source makes no network calls and has no absolute URLs outside SVG namespaces, so the
  privacy guard can be strict from day one.
- All 35 pipeline tests pass under plain `unittest`, so no pytest dependency is needed. The 4
  asset tool tests need only numpy and Pillow.
- The two evidence-capture specs already skip unless an evidence directory is set.
- The first gate screenshots of the DC-9 caught its loading overlay: "network idle" is not a
  finished scene. Captures now wait for `data-dc9-model-state` ready/fallback and for every
  "… MB downloaded" line to disappear.
- axe passed all five chapter screens on the first run. That was treated as suspicious until a
  probe confirmed each screen renders its real chapter heading, and that planted violations
  (`button-name`, `image-alt`) are caught. Both are now permanent in the spec.
- The chapter state builders were private to `smoke.spec.ts`. They moved unchanged to
  `e2e/journeyStates.ts`; two smoke tests that use them pass after the move.
- The repo is owned by a personal account. GitHub offers merge queues only for
  organisation-owned repositories, so the merge queue is recorded as unavailable (to be confirmed
  against the API when settings are applied).

- **First real CI run (f0c86ad, 2026-09-23): all green in 31 min wall-clock, down from 40-55.**
  quality 1m18s; CodeQL x3 about 1-2 min; dependency-review 7 s, once the dependency graph was
  enabled (the first run failed until then). The shards were badly unbalanced: 25.6 / 4.0 / 1.8 /
  14.2 min of tests. Playwright shards by test COUNT, and the 30 review-evidence tests (skipped in
  the suite) took slots, so two shards ran only 14 real tests while shard 1 ran 30, including the
  slow Airbus specs (about 51 s each under SwiftShader). Fix: `--grep-invert` removes them before
  sharding (129 to 99 tests), 6 shards split the Airbus specs across two runners, and the `list`
  reporter now logs per-test durations for future balancing.
- A conflicted PR runs no workflows. #80 merged into main mid-work and #82 conflicted on
  `TEST_REPORT.md`; it was resolved by merging main, and the combined tree was re-validated before
  pushing.
- CI gate screenshots were wrong in two ways on the first run. The locker was captured as a
  blank panel before its 44 MB model was drawn, and the intro was caught mid-animation ("TMBi").
  Now each screen declares the model it must show. The capture waits for that download, for no
  model in flight, and for byte-identical consecutive frames, all under reduced motion. The locker
  also intermittently throws "Unable to capture screenshot" during its opening transition; the
  capture goes through CDP (as the orientation-captures spec already did) and retries that error
  only. Locally 15/15 pass, and every image was inspected.
- Visual regression on `?skip3d=1` still rendered WebGL cockpits. Canvases are now masked, so it
  compares only the HTML interface. Locally, creating baselines and then comparing a second run
  matched 15/15. Baselines are to be approved from a CI artifact (Linux fonts), not committed
  from this machine.
- The v4 actions ran on Node 20, which is deprecated and force-run on Node 24. All are re-pinned
  to their current Node 24 majors by SHA, with breaking changes checked against our usage.

- **Second run (#93, 6 count-based shards): 23 min wall-clock**, still unbalanced (21.0 / 14.6 /
  6.4 / 6.1 / 1.8 / 0.7 min). Per-test durations (now logged by the `list` reporter) show 49.6 min
  of tests in total. Two single tests take 11.2 min each (the DC-9 and Storm Line production GLBs),
  five more take 2.4-4.6 min, and the other 92 take about 10.5 min. Sharding is now by weight:
  `@heavy-dc9`, `@heavy-storm`, `@heavy-airbus`, `@heavy-scenes`, plus two light shards. The
  expected wall is about the 11.2 min floor plus setup. A "shard plan" step in `quality` fails if
  a `@heavy-*` tag has no runner, checked in both directions (99 = 7 + 92 passes; an orphan tag
  fails).

## Decision log

- 2026-09-23: keep `browser-smoke` as the name of a small aggregator job over the 4 shards,
  so branch protection needs one stable check name.
- 2026-09-23: the dependency guard is its own workflow, so that adding the
  `dependency-approved` label re-runs only it, not the 40-minute suite. It has no paths filter,
  because a path-skipped required check blocks merging forever.
- 2026-09-23: `@axe-core/playwright` is added as a devDependency. It never ships to players;
  the new dependency guard confirms that no production dependency changed.
- 2026-09-23: visual regression is report-only until the owner approves a baseline, because
  WebGL pixels under CI's software renderer are not yet proven stable.

## Handoff

**Owner actions.** Only the owner can do these:

1. **Visual-regression baselines:** committed 2026-09-23 from the Linux CI run of #94 (15 images;
   on `?skip3d=1` the cockpits are static fallback images and only the intro canvas is masked).
   Merging that PR is the owner's approval. The check stays report-only; make it blocking once a
   few runs confirm it stays green.
2. **The Model Y reward line:** fixed 2026-09-23. It moved to `src/game/rewardCopy.ts`, imported
   only by the lazy reward chunk, and its spoiler-allowlist entry was removed.
3. **Make the production gate real** (optional). Add a `VERCEL_TOKEN` secret, set the repository
   variable `GATED_PRODUCTION=true`, then turn off Vercel's automatic production deploys from `main`.
   Until then Vercel deploys as before, and the `production` environment only records approvals of
   releases.

**Applied by `tools/ci/repo-settings.sh` after merge** (idempotent; re-run it to restore):
- Branch protection on `main`, requiring `quality`, `browser-smoke` and
  `new-production-dependencies`. Not strict; no review requirement; admins may bypass.
- Auto-merge allowed. Actions may open PRs (release-please).
- Dependabot alerts and security-fix PRs. Labels `dependency-approved` and `dependencies`.
- `release-approval` environment with the owner as the required reviewer. It is not called
  "Production", which is Vercel's environment; applying a reviewer to it by mistake was caught and
  reverted on 2026-09-23.
- Merge queue: unavailable for personally-owned repositories.

**Dependabot:** patch, minor and security updates auto-merge once CI is green
(`dependabot-auto-merge.yml`). Majors get the `major-update` label and wait for the owner.
Security fixes arrive grouped as one PR.

**Everyday flow for maintainers:**
- One branch and one draft PR per milestone. Drafts run only `quality` (about 2 min).
- Mark the PR ready once; the full suite, review evidence and comments follow.
- Enable auto-merge on it and it lands itself when green.
- A new production dependency needs the `dependency-approved` label.
- A size budget raise is an edit to `tools/ci/budgets.json`.
- A new spoiler-term occurrence is an owner-reviewed entry in `tools/ci/spoiler-allowlist.json`.
