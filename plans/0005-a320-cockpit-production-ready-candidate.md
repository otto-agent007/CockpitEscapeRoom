# A320 cockpit production-ready approval candidate

## Purpose

Prepare the Airbus A320 First-Officer cockpit as an owner-reviewable approval candidate. The player should still get the current five-card First-Officer onboarding flow, while maintainers have a regenerated canonical shaded source, deployable GLB, cleanup report, browser screenshots, and validation evidence ready for owner review.

## Current state

The runtime loads `public/models/airbus-first-officer.glb` and opens from the FO/right-seat gameplay view. The browser flow already uses five visible cards, no `CLOCK` card, immediate red/green feedback, an ATP question after correct labels, and accessible HTML placement targets.

The current branch removed the generated shaded source under `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/`, but `tools/assets/build-asset.mjs` still expects `a320-cockpit-2-shaded.blend` at that path. The ignored live Blender recovery file `.cache/blender-history/a320-cockpit-2-shaded-d23ad95.blend` has the correct FO camera and a reversible loose-fragment quarantine, but it is not a production source of truth.

## Scope

Included:

- Regenerate the canonical shaded A320 `.blend` and `.glb` from the approved assembly pipeline.
- Encode conservative loose zoom-out fragment quarantine in the deterministic shading script.
- Export `public/models/airbus-first-officer.glb` only through `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus`.
- Refresh asset reports, gate artifacts, preview renders, browser screenshots, and `TEST_REPORT.md`.

Excluded:

- Removing `A320 PLAYABLE PROOF` before owner approval.
- Promoting individual cockpit meshes to direct 3D pivot-backed controls.
- DC-9, locker, Model Y, Flight Mode, or Mars work.
- New production dependencies or hand-editing generated GLBs.

## Context and constraints

- Airbus target remains Airbus A320 and must not mix DC-9 details.
- Browser gameplay remains fictional and spoiler-safe.
- Preserve stable runtime names, hierarchy, exported camera, and `game_id` metadata.
- Keep accessible HTML controls as the supported interaction path for this milestone.
- Quarantine only high-confidence generic source fragments; preserve seat, side-console, display, panel, and named cockpit geometry.

## Progress

- [x] 2026-07-09 - Planned approval-candidate scope with owner defaults: canonical shaded source, pivots deferred, owner approval still pending.
- [x] 2026-07-09 - Confirmed current worktree has only unrelated `.vercel/` untracked.
- [x] 2026-07-09 - Added deterministic A320 loose-part quarantine/reporting to the shading pipeline.
- [x] 2026-07-09 - Regenerated canonical shaded source and runtime GLB through `run-a320-shading-job` and `npm run asset:airbus`.
- [x] 2026-07-09 - Captured browser evidence at 375, 768, 1440, 1920, and reduced-motion 768 px.
- [x] 2026-07-09 - Ran validation and recorded final evidence in `TEST_REPORT.md` and the A320 browser handoff report.

## Discoveries

- The recovered cache blend has `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` active and confirmed FO/right-seat framing, but the file is under ignored `.cache/` and must remain evidence rather than production source.
- The tracked assembly source contains real cockpit geometry far back in model coordinates, so loose-part cleanup must not use a broad coordinate cutoff.
- High-confidence cleanup candidates are small generic `OBJECT_93.001`, `OBJECT_94`, `OBJECT_95`, and `OBJECT_96.001` source fragments, not named A320 cockpit structures.

## Decision log

- 2026-07-09 - Regenerate the canonical shaded source from approved assembly instead of resurrecting the deleted generated artifact from Git history. Rationale: current branch intentionally removed generated shaded outputs, while the pipeline can recreate them.
- 2026-07-09 - Keep the proof badge until owner approval. Rationale: this milestone produces approval evidence, not the owner approval itself.
- 2026-07-09 - Defer direct 3D pivots. Rationale: the current player path already has accessible HTML equivalents, and pivot promotion is a separate interaction-contract milestone.

## Milestones

1. The A320 shading job regenerates the canonical shaded source and records loose-part cleanup decisions.
2. The deployable A320 GLB exports through the normal asset command and passes glTF validation.
3. The browser opens in FO/right-seat view with five cards, no `CLOCK`, no visible pre-drag hotspots, and no console errors.
4. Owner-review evidence includes approval renders, browser screenshots, and a zoom-out cleanup proof.

## Implementation steps

- Patch `tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` to quarantine confirmed loose generic fragments in `A320_QUARANTINE_LOOSE_PARTS_REVIEW`, hide them in viewport/render, exclude them from GLB export, and write `loose-part-review-report.json`.
- Patch `tools/blender/cockpit_pipeline/a320_shading_job.py` so the cleanup report is included in the shading manifest and human-readable report.
- Run `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job`.
- Run `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus`.
- Update reports and screenshots after validation.

## Validation plan

Run:

```bash
python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py
python3 -m tools.blender.cockpit_pipeline.preflight
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job
BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json
npx gltf-transform validate public/models/airbus-first-officer.glb
npm run assets:check
npm run pipeline:evals
npm run test:e2e -- e2e/smoke.spec.ts
npm run check
git diff --check
```

Browser QA covers A320 GLB load, FO/right-seat framing, five cards, no `CLOCK` card, immediate wrong/correct feedback, ATP reveal, locker transition, reload persistence, reduced-motion behavior, no page/console errors, and screenshots near 375, 768, 1440, and 1920 px.

## Acceptance criteria

- `npm run asset:airbus` no longer fails because of a missing shaded `.blend`.
- `public/models/airbus-first-officer.glb` is regenerated from the canonical shaded source and passes glTF validation.
- The loose-part cleanup report exists, names every quarantined object, and records bounds/reasons.
- The A320 browser proof still passes onboarding, ATP, locker transition, reduced-motion, and reload checks.
- The milestone remains labeled as owner-reviewable; final production art approval remains pending.

## Repair loop and stop conditions

Repeat review -> focused repair -> validation -> browser inspection -> diff review. Stop when the validation plan passes, the remaining delta stops shrinking, or owner visual approval is required.

## Evidence

- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py` - pass.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass earlier in the run; Blender 5.1.2, Node v26.3.0, Git LFS available, dirty worktree expected for this implementation.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-shading/manifests/shading-complete.json` - pass; hashes verified.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- Runtime/staged GLB SHA-256: `c94ada9dbfe7bdfb29d3a75071120a1823c6963a0de2b6d3f815900974d9ac8b`.
- Runtime/staged GLB size: `39,849,104` bytes.
- Shading validation: pass; runtime node names preserved, `game_id` metadata preserved, UV layers preserved, approved assembly inputs immutable, and dimension drift `0.0`.
- Loose-part cleanup report: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/loose-part-review-report.json`.
- Quarantined objects:
  - `AIRBUS_A320_STATIC_119_OBJECT_93_001`
  - `AIRBUS_A320_STATIC_120_OBJECT_94`
  - `AIRBUS_A320_STATIC_121_OBJECT_95`
  - `AIRBUS_A320_STATIC_122_OBJECT_96_001`
- `strings public/models/airbus-first-officer.glb` quarantine check - pass; no quarantined `OBJECT_93` through `OBJECT_96` runtime names found in the deployable GLB.
- Browser screenshots from the real GLB load path had 5 targets, zero `CLOCK` cards, visible canvas, and no console/page errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-375-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1440-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1920-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo-reduced-motion.png`

## Outcome and handoff

Outcome: implementation complete for the A320 owner-reviewable approval candidate. The canonical shaded source and runtime GLB are regenerated from the approved assembly pipeline, the old loose zoom-out fragments are quarantined by deterministic source-node checks, and browser/asset validation passes.

Owner visual approval is still required before removing `A320 PLAYABLE PROOF` or calling the Airbus cockpit final production art. Direct imported-control pivots remain deferred; the accessible browser hotspots remain the supported interaction path for this milestone.
