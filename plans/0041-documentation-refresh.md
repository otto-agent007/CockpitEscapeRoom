# Current Product Documentation Refresh

## Purpose

Give a visitor a short, accurate introduction to CockpitEscapeRoom and give maintainers a consistent set of living guides for the product that exists now. The README becomes a compact front door; detailed player-flow, technical, asset, workflow, and provenance guidance stays in the focused documents that own those subjects.

## Current state

The automatic console-era cinematic, DC-9 instrument scan, fictional 1995 Memphis departure memory, reordered route log, and current schema 15 progression have moved beyond several living documents. The README is 76 lines and still says an outer **Start Game** button opens the DC-9. `CLAUDE.md` and `public/audio/README.md` repeat that retired interaction, `docs/ARCHITECTURE.md` describes schema 8, the visual guides still speak about first blockouts and an unconfirmed Airbus model, and the asset guides do not consistently include the separate Memphis environment.

The worktree began clean on branch `asset/dc9-memphis-terminal-composition`. The baseline `npm test` run on 2026-09-01 passed 44 test files and 572 tests.

## Scope

Included:

- replace `README.md` with a short visitor-first overview, quick start, verification commands, and documentation map;
- reconcile `BLUEPRINT.md`, `CLAUDE.md`, and the living `docs/*.md` guides with the current implemented journey and repository contracts;
- update the current Blender and audio READMEs where they still describe superseded setup or intro behavior;
- verify external source links and local Markdown links;
- preserve detailed rules in their owning documents rather than duplicating them in the README.

Excluded:

- game code, tests, Blender sources, GLBs, runtime assets, and package dependencies;
- retroactive edits to numbered ExecPlans, dated specs, asset reports, reference reports, prompt packs, or `TEST_REPORT.md` evidence;
- new product behavior, new narrative decisions, and changes to owner approval gates.

## Context and constraints

- Preserve the project name **CockpitEscapeRoom** and the owner-approved journey and safety framing in `AGENTS.md`.
- The present-day tribute aircraft remains safely parked. The Memphis sequence is an explicitly fictional, non-operational 1995 memory recreation from the DC-9 first-officer/right seat.
- The implemented DC-9 order is control check → instrument scan → Memphis Legacy Departure → Home Operations Log → in-cockpit route-strip handoff → Legacy Route Record → ceremonial shutdown → ATP milestone → Captain's Key.
- The red Model Y and Flight Mode remain protected until DC-9, locker, and Airbus completion; Mars remains optional after the main ending.
- Treat historical plans, reports, and evidence as dated records, not living documentation to rewrite.
- Add no production dependency and do not hand-edit generated artifacts.

## Progress

- [x] 2026-09-01 — Read repository guidance, inspect Git state and recent commits, inventory Markdown, and run the 572-test baseline.
- [x] 2026-09-01 — Compare living product, architecture, asset, workflow, and audio guides with schema 15 and the implemented stage transitions.
- [x] 2026-09-01 — Rewrite the README and reconcile affected living guides.
- [x] 2026-09-01 — Verify terminology, local links, external source links, tests, asset contracts, and the complete diff.
- [x] 2026-09-01 — Record final evidence, remaining delta, and handoff in this plan.

## Discoveries

- `src/game/state.ts` is schema 15, not schema 8, and preserves migrations from earlier saves.
- The current DC-9 chapter runs the instrument scan before the Memphis memory, then returns to Home Operations and the route record before shutdown.
- `README.md`, `CLAUDE.md`, and `public/audio/README.md` still refer to the retired outer **Start Game** gesture.
- `docs/VISUAL_REALISM.md` still treats the Airbus model as unconfirmed even though the production target and deployable are the Airbus A320.
- `public/models/README.md` already documents the separate Memphis GLB and its permission basis; it does not need a narrative rewrite.
- Historical ExecPlans and reports intentionally contain superseded states and will remain unchanged.
- Several Codex reference URLs had moved from `developers.openai.com/codex/` to their current `learn.chatgpt.com` canonical pages, and the Loop Library references now live in `Forward-Future/loopy`.
- The starting Memphis branch was merged through PR #68 before this documentation handoff. The documentation changes therefore moved intact onto a clean branch from the refreshed `origin/main` rather than reusing the merged feature branch.

## Decision log

- 2026-09-01 — Make the README visitor-first and keep it to roughly 25–35 lines. Rationale: the user asked for the shortest useful entry point, while the repository already has focused guides for depth.
- 2026-09-01 — Update only living guides and current operational READMEs. Rationale: rewriting dated evidence would erase the development history and make old validation claims misleading.
- 2026-09-01 — Describe shipped behavior as current and future reward/Mars work by its actual status. Rationale: product truth is more useful than an obsolete milestone roadmap.
- 2026-09-01 — Publish from `docs/current-product-documentation-refresh`, based on merged `origin/main`. Rationale: the original Memphis feature branch already belongs to merged PR #68, while this update is an independently reviewable documentation slice.

## Milestones

### Milestone 1 — Short front door

`README.md` states the current journey, starts the app in three commands, lists the meaningful verification commands, and points to the small set of authoritative guides without restating their rules.

### Milestone 2 — Consistent living documentation

The blueprint, game design, architecture, realism, asset, workflow, deployment, history, personalization, quality, Blender, and audio guides agree on the automatic intro, current DC-9 sequence, schema, aircraft/seat roles, separate Memphis environment, and spoiler boundary.

### Milestone 3 — Verified documentation handoff

All edited Markdown has valid local links, stale interaction/schema phrases are absent from living guides, external source links are checked, relevant repository checks pass, and the complete diff contains no unrelated changes.

## Implementation steps

1. Replace `README.md` with the compact visitor-first entry point.
2. Consolidate `BLUEPRINT.md` around the current experience, player loop, architecture, delivery status, and definition of done.
3. Update `docs/GAME_DESIGN.md` and `docs/VISUAL_REALISM.md` with the fictional Memphis memory and current production targets.
4. Update `docs/ARCHITECTURE.md`, `docs/ASSET_CONTRACT.md`, `docs/ASSET_PIPELINE.md`, and `docs/BLENDER_PIPELINE.md` with schema 15 and the separate Memphis source/deployable contract.
5. Update `docs/CODEX_WORKFLOW.md`, `docs/MCP_AND_SKILLS.md`, `docs/DEPLOYMENT.md`, and `docs/SOURCES.md` only where their current operational guidance has drifted.
6. Update `docs/HISTORICAL_CONTEXT.md`, `docs/PERSONALIZATION_CHECKLIST.md`, `docs/QUALITY_BAR.md`, `CLAUDE.md`, `art-source/blender/README.md`, and `public/audio/README.md` where the audit found concrete stale claims.
7. Run focused phrase searches and local/external link checks, then `npm run check`, `npm run assets:check`, and a complete diff review.

## Validation plan

- Search living guides for retired outer **Start Game**, schema 8, unconfirmed Airbus-model, and proof-only language.
- Validate every relative Markdown link in the edited files resolves to a repository path or heading target where applicable.
- Open the external URLs retained in `docs/SOURCES.md` and keep the checked date truthful.
- Run `npm run check` for lint, TypeScript, unit tests, and production build.
- Run `npm run assets:check` because the current asset contract and deployable inventory are documented.
- Run `git diff --check` and inspect the entire diff for contradictions, accidental historical rewrites, and duplicated guidance.

## Acceptance criteria

- `README.md` is a short visitor-first overview with no obsolete gameplay claims.
- All current guides agree on the automatic cinematic and implemented DC-9 chapter order.
- Architecture documentation states schema 15 and the current phase/stage vocabulary.
- Asset documentation includes `dc9-memphis-legacy-departure.blend` and `dc9-memphis-legacy-departure.glb` without weakening source or approval constraints.
- No historical plan, spec, asset report, prompt pack, or test report is rewritten.
- Local Markdown links resolve, retained external source links are reachable, `npm run check` and `npm run assets:check` pass, and `git diff --check` reports no whitespace errors.

## Repair loop and stop conditions

Repeat audit → focused documentation repair → phrase/link/check validation → complete-diff review. Stop when all acceptance checks pass, three focused repair attempts fail to reduce the same delta, an external source is unavailable after verification, or a genuine owner narrative decision is required.

## Evidence

- Baseline: `npm test` — 44 files passed, 572 tests passed, exit 0 on 2026-09-01.
- README size: `wc -l README.md` — 30 lines, reduced from the 76-line starting point.
- Local links: explicit validator over all 19 edited/new Markdown files — every relative link resolves, exit 0.
- Stale claims: focused validator — eight retired interaction, schema, Airbus, dependency, and Skill-pack claims are absent from living guides, exit 0.
- External sources: current official Codex, Vite, React Three Fiber, Three.js, Vercel, Git LFS, Blender 5.1, and glTF Transform locations were reviewed on 2026-09-01. The official Blender index confirmed the versioned glTF URL; the text-fetching tool returned HTTP 402 when opening that page directly.
- Repository validation: `npm run check` — lint, typecheck, 44 test files / 572 tests, and the Vite production build passed, exit 0.
- Asset validation: `npm run assets:check` — contract checks passed for 58 assets and 51 preloads, exit 0. The validator retained its established glTF informational notices, including the Memphis source-image feature warning.
- Diff integrity: `git diff --check` — exit 0. The changed-file boundary contains 18 living guides plus this new plan; no application code, runtime asset, historical plan/spec/report, prompt pack, or `TEST_REPORT.md` file changed.

## Outcome and handoff

The README is now a 30-line front door, while the owning guides carry the current player journey, schema 15 state model, separate Memphis environment contract, Airbus A320 seat role, spoiler boundary, workflow, deployment, and source details. No runtime behavior or generated asset changed, so browser and end-to-end gameplay checks were not rerun for this documentation-only slice. The workspace remains intact on `docs/current-product-documentation-refresh` for review and publication.
