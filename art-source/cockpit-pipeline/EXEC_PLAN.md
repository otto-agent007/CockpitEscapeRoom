# Cockpit Pipeline Ubuntu Foundation

## Purpose

Establish the Ubuntu-side foundation for a three-agent Blender cockpit pipeline before Agent 1 starts a four-component DC-9 vertical slice. A maintainer can validate machine readiness, create and advance stage manifests, verify handoff hashes, and run a Blender headless smoke test without constructing or replacing production cockpit assets.

## Current state

The repository already contains Blender proof assets and scripts under `art-source/blender`, `tools/blender`, `public/models`, `asset-reports`, and `preview-renders`. The requested three-agent cockpit pipeline does not yet exist as a shared job contract, state machine, or role-specific prompt set. This branch starts from `origin/main` and writes only Ubuntu-owned paths.

## Scope

Included:

- `tools/blender/cockpit_pipeline/` command modules, schemas, state machine, preflight, hashing, and Blender smoke script.
- `art-source/cockpit-pipeline/` working directories, sample unresolved-variant job, sample approved source manifest, and this ExecPlan.
- `asset-reports/cockpit-pipeline/` report/evidence placeholder.
- `preview-renders/cockpit-pipeline/` preview placeholder.

Excluded:

- Production DC-9 cockpit sourcing, construction, optimization, or replacement.
- Runtime application code, tests, package scripts, CI, root guidance, docs, and `TEST_REPORT.md`.
- Licensing judgments beyond technical reproducibility fields.
- Any new production dependency.

## Context and constraints

Ubuntu owns only `art-source/**`, `tools/blender/**`, `public/models/**`, `asset-reports/**`, and `preview-renders/**`. Windows owns app code, package scripts, root `AGENTS.md`, docs, tests, and `TEST_REPORT.md`, so this plan records evidence locally instead of changing cross-boundary reports.

The DC-9 variant remains unresolved. Pipeline schemas and reports preserve `sourceVariant`, `targetVariant`, and `variantScope`; sample data intentionally does not finalize DC-9-32 or DC-9-51. Agent 1 may use network access. Agents 2 and 3 must consume only approved local inputs. Downloaded aircraft repositories are untrusted: never execute their Python, shell scripts, Blender handlers, or add-ons.

Blender must run in background mode with factory startup and auto-execution disabled. Ordinary Python owns downloads, hashes, job state, subprocesses, and reports. Blender Python owns only scene and asset operations.

## Progress

- [x] 2026-06-22 - Read repository guidance, ownership rules, Blender asset skill, and current Ubuntu-owned tree.
- [x] 2026-06-22 - Created branch `asset/dc9-three-agent-foundation` from fetched `origin/main`.
- [x] 2026-06-22 - Add schemas, state machine, prompts, preflight, and Blender smoke test.
- [x] 2026-06-22 - Run focused Python validation.
- [x] 2026-06-22 - Run preflight and Blender smoke test where local executables allow.
- [x] 2026-06-22 - Review full diff and record evidence.

## Discoveries

- The root already contains a production/proof GLB at `public/models/dc9-cockpit.glb`; this task must not create or replace production models.
- No existing active ExecPlan was found before this plan.
- `docs/WORKSTREAM_OWNERSHIP.md` requires this Ubuntu branch to avoid docs, package scripts, app code, root guidance, and `TEST_REPORT.md`.
- Blender 5.1.2 is available at `/home/user1/.local/bin/blender`.
- Blender command-line Python can emit a traceback while returning exit 0, so `pipeline_cli blender-smoke` verifies the report, preview, GLB, and traceback-free output explicitly.

## Decision log

- 2026-06-22 - Use a no-dependency schema validator tailored to the checked-in JSON schemas. Rationale: the task forbids new production dependencies and package scripts are Windows-owned.
- 2026-06-22 - Store disposable Blender smoke outputs under the configurable cache directory by default. Rationale: generated conversions and temporary GLBs must remain outside Git unless explicitly approved.
- 2026-06-22 - Put sample handoff manifests in `art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/`. Rationale: they are contracts and small reproducible inputs, not generated production assets.

## Milestones

1. A maintainer can read the nested Ubuntu pipeline instructions and role prompts.
2. A maintainer can validate a job request and stage manifest without third-party Python dependencies.
3. The state machine blocks assembly before source approval and shading before assembly approval.
4. Preflight reports branch, toolchain versions, Git LFS status, Blender executable/version, and cache path, and fails clearly for missing or wrong Blender.
5. Blender background smoke creates a disposable scene, preview render, temporary GLB, and GLB inspection report in cache.

## Implementation steps

- Add `tools/blender/AGENTS.md` with Ubuntu-specific boundaries and stage handoff rules.
- Add schemas in `tools/blender/cockpit_pipeline/schemas/`.
- Add Python modules:
  - `schema_validation.py`
  - `state_machine.py`
  - `hashing.py`
  - `preflight.py`
  - `pipeline_cli.py`
  - `blender_smoke_scene.py`
- Add focused tests under `tools/blender/cockpit_pipeline/tests/`.
- Add sample unresolved-variant job and source-approved manifest.
- Add role prompt templates for sourcing, assembly, and shading.
- Add stage-specific input/output directory placeholders under `art-source/cockpit-pipeline/stages/`.

## Validation plan

- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests`
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/job.json`
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/manifests/source-approved.json`
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from requested --to source-approved`
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from requested --to assembly-approved` must fail.
- `python3 -m tools.blender.cockpit_pipeline.preflight`
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli blender-smoke`

## Acceptance criteria

- Preflight reports repository root, active branch, clean or dirty status, Blender executable, Blender version, Node version, Git version, Git LFS availability, and pipeline cache path.
- Preflight fails clearly when Blender is unavailable or does not match the configured expected version.
- Job and manifest validation reject invalid stage names and missing required fields.
- State transition validation prevents assembly before source approval and shading before assembly approval.
- Output manifests record SHA-256 hashes for every declared file.
- Blender smoke test creates and validates only disposable outputs.
- No production DC-9 asset changes and no file outside Ubuntu-owned paths changes.

## Repair loop and stop conditions

For each checkpoint, review the diff, run the focused command, repair the root cause, and rerun the failed command plus nearby checks. Stop when acceptance checks pass, the local machine lacks the required Blender executable, a check's remaining delta stops shrinking, or owner visual approval would be required. Do not claim unrun checks passed.

## Evidence

- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/job.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/manifests/source-approved.json` - pass, hashes verified.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from source-approved --to assembly-approved` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from assembly-approved --to shading-approved` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from requested --to assembly-approved` - expected fail, blocks assembly before source approval.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from source-approved --to shading-approved` - expected fail, blocks shading before assembly approval.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; reported repo root, branch, dirty status, Blender 5.1.2, Node v26.3.0, Git 2.43.0, Git LFS 3.4.1, and cache path.
- `BLENDER_BIN=/does/not/exist python3 -m tools.blender.cockpit_pipeline.preflight` - expected fail with clear unavailable executable message.
- `BLENDER_EXPECTED_VERSION=9.9 python3 -m tools.blender.cockpit_pipeline.preflight` - expected fail with clear version mismatch message.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli blender-smoke` - pass; produced cache-only evidence:
  - `.cache/cockpit-pipeline/blender-smoke/neutral-preview.png`
  - `.cache/cockpit-pipeline/blender-smoke/cockpit-pipeline-smoke.glb`
  - `.cache/cockpit-pipeline/blender-smoke/smoke-report.json`

The preview render was visually inspected and is a neutral disposable scene.

## Outcome and handoff

The foundation is in place for Agent 1 to begin sourcing against the unresolved-variant four-component vertical slice. Agent 1 should start with:

```bash
python3 -m tools.blender.cockpit_pipeline.preflight && python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/job.json
```

Then use `tools/blender/cockpit_pipeline/prompts/agent1-sourcing.md` with the sample job JSON.

## Source Job: FlightGear DC-9-32 Vertical Slice

### Purpose

Execute Agent 1 sourcing against the FlightGear DC-9-32 repository and produce source-only candidates for one yoke assembly, one throttle assembly, one large cockpit gauge, and one switch cluster. This does not approve sources for assembly and does not create production cockpit assets.

### Progress

- [x] 2026-06-22 - Ran preflight on `asset/dc9-vslice-source`.
- [x] 2026-06-22 - Fetched `https://github.com/FGMEMBERS-NONGPL/DC-9-32.git` into the external pipeline cache.
- [x] 2026-06-22 - Recorded resolved source commit `d79e1476ce452a96126cc569a9c8a5d9fe705c8f`.
- [x] 2026-06-22 - Determined no configured Blender AC3D import route is callable; added a narrow internal AC3D data importer for pipeline extraction.
- [x] 2026-06-22 - Imported `Models/Flightdeck/flightdeck.ac` in Blender and wrote a disposable inspection scene under cache.
- [x] 2026-06-22 - Exported four source candidates with GLB, metadata JSON, validation JSON, and neutral preview PNG.
- [x] 2026-06-22 - Reran the source job and confirmed deterministic candidate IDs.
- [x] 2026-06-22 - Validated the `sourcing_complete` manifest with hashes.

### Discoveries

- The source uses AC3D `.ac` models and FlightGear XML relationships; no `.obj`, `.gltf`, `.glb`, or `.fbx` files are present.
- `Models/Flightdeck/Flightdeck.xml` identifies yoke and throttle animation relationships by source object names.
- `Models/Flightdeck/Instruments/ALT/altimeter.ac` and `alt.xml` provide a complete large analog gauge candidate.
- The most credible switch cluster found in the primary cockpit model is the ABS switch/knob/lamp group; it has no explicit XML animation and remains lower confidence.

### Evidence

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-source-job` - pass, repeated successfully.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/job.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/manifests/sourcing-complete.json` - pass, hashes verified.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass.
- Visual previews inspected:
  - `preview-renders/cockpit-pipeline/dc9-32-flightgear-source-vslice/import-proof-overview.png`
  - `preview-renders/cockpit-pipeline/dc9-32-flightgear-source-vslice/dc9-src-yoke-assembly-001.png`
  - `preview-renders/cockpit-pipeline/dc9-32-flightgear-source-vslice/dc9-src-throttle-assembly-001.png`
  - `preview-renders/cockpit-pipeline/dc9-32-flightgear-source-vslice/dc9-src-large-gauge-001.png`
  - `preview-renders/cockpit-pipeline/dc9-32-flightgear-source-vslice/dc9-src-switch-cluster-001.png`

### Outcome

The job reached `sourcing_complete`, not `source-approved`. Human review is required before Agent 2 assembly.

## Assembly Job: DC-9 Vertical Slice

### Purpose

Execute Agent 2 assembly using the approved Agent 1 source candidates. The output is a neutral-material four-component cockpit proof with deterministic layout JSON, stable runtime node names, parent pivot repair empties, and a reimportable GLB. This is not final shading and not a production cockpit model.

### Progress

- [x] 2026-06-22 - Created branch `asset/dc9-vslice-assembly`.
- [x] 2026-06-22 - Ran preflight and validated the source-stage manifest.
- [x] 2026-06-22 - Recorded `source-approval.json` from the owner prompt and verified four approved component hashes against the source manifest.
- [x] 2026-06-22 - Added `assembly_complete` as a non-approved stage that still blocks Agent 3 until human assembly approval.
- [x] 2026-06-22 - Created layout JSON at `art-source/cockpit-pipeline/stages/assembly/input/dc9-vslice-assembly/layout.json`.
- [x] 2026-06-22 - Built neutral `.blend` and `.glb` artifacts from layout JSON in Blender background mode.
- [x] 2026-06-22 - Validated unique runtime node names, required metadata, source immutability, GLB reimport, and manifest hashes.
- [x] 2026-06-22 - Rendered captain-seat, wide, yoke, throttle, and gauge/switch preview evidence.

### Discoveries

- The approved source candidates reimport and assemble cleanly, but the source geometry is sparse and not production-scaled.
- Every component needed a layout parent pivot empty so runtime interaction pivots are stable and documented.
- The switch cluster remains lower-confidence from Agent 1; the layout keeps it included but marks the overall variant scope unresolved/unknown where appropriate.

### Evidence

- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/manifests/sourcing-complete.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-assembly-job` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-vslice-assembly/manifests/assembly-complete.json` - pass.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.
- Visual previews inspected:
  - `preview-renders/cockpit-pipeline/dc9-vslice-assembly/captain-seat-view.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-assembly/wide-cockpit-view.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-assembly/yoke-close-up.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-assembly/pedestal-throttle-close-up.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-assembly/gauge-switch-close-up.png`

### Outcome

The job reached `assembly_complete`, not `assembly-approved`. Human review is required before Agent 3 shading.

## Shading Job: DC-9 Vertical Slice

### Purpose

Execute Agent 3 shading using the approved Agent 2 neutral assembly. The output is a shaded four-component vertical slice with deterministic procedural material recipes, baked PBR base-color textures, preserved runtime node contracts, preview evidence, and a `shading_complete` handoff. This is not a full cockpit and not final visual approval.

### Progress

- [x] 2026-06-22 - Created branch `asset/dc9-vslice-shading`.
- [x] 2026-06-22 - Ran preflight and validated `assembly-approval.json` through the shading job.
- [x] 2026-06-22 - Verified approved assembly artifact hashes against the `assembly_complete` manifest.
- [x] 2026-06-22 - Added `shading_complete` as a non-final stage that can advance only after `assembly-approved`.
- [x] 2026-06-22 - Created deterministic material recipes at `art-source/cockpit-pipeline/stages/shading/input/dc9-vslice-shading/material-recipes.json`.
- [x] 2026-06-22 - Applied Northwest-era blue-green/gray, dark panel, rubber, metal, glass, gauge face, stencil, fastener, and subtle wear materials in Blender background mode.
- [x] 2026-06-22 - Exported shaded `.blend`, shaded `.glb`, baked texture PNGs, material and texture reports, validation report, preview renders, and comparison contact sheet.
- [x] 2026-06-22 - Validated shaded GLB reimport, runtime node preservation, interaction metadata preservation, dimension stability, and manifest hashes.

### Discoveries

- The approved assembly geometry remains intentionally sparse, so the shading proof uses restrained materials rather than attempting to hide missing cockpit detail.
- The gauge face needed a slightly translucent charcoal material so extracted label and needle geometry remained readable.
- The switch cluster remains visually small because Agent 1 source geometry is sparse; Agent 3 did not fabricate substitute geometry.

### Evidence

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-shading-job` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-vslice-shading/manifests/shading-complete.json` - pass, hashes verified.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from assembly-approved --to shading_complete` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from shading_complete --to shading-approved` - pass.
- Visual previews inspected:
  - `preview-renders/cockpit-pipeline/dc9-vslice-shading/captain-daylight.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-shading/captain-dim-instrument-lighting.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-shading/yoke-material-close-up.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-shading/throttle-material-close-up.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-shading/gauge-glass-face-close-up.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-shading/switch-cluster-close-up.png`
  - `preview-renders/cockpit-pipeline/dc9-vslice-shading/neutral-vs-shaded-contact-sheet.svg`

### Outcome

The job reached `shading_complete`, not final visual approval. Human review is required before any final approval or production promotion.

## Loop Discovery Checkpoint: Stage Handoff Validation

### Purpose

Use `$loop-discovery`, `$loop-doctor`, and `$blender-web-assets` to identify the highest-value repeated Ubuntu/Blender workflow and make one small durable improvement without expanding the pipeline or touching Windows-owned paths.

### Files inspected

- `AGENTS.md`
- `docs/WORKSTREAM_OWNERSHIP.md`
- `docs/CODEX_WORKFLOW.md`
- `docs/MCP_AND_SKILLS.md`
- `docs/VISUAL_REALISM.md`
- `docs/ASSET_CONTRACT.md`
- `docs/BLENDER_PIPELINE.md`
- `.agents/skills/loop-discovery/SKILL.md`
- `.agents/skills/loop-doctor/SKILL.md`
- `.agents/skills/blender-web-assets/SKILL.md`
- `tools/blender/AGENTS.md`
- `tools/blender/cockpit_pipeline/pipeline_cli.py`
- `tools/blender/cockpit_pipeline/prompts/agent1-sourcing.md`
- `tools/blender/cockpit_pipeline/prompts/agent2-assembly.md`
- `tools/blender/cockpit_pipeline/prompts/agent3-shading.md`
- `asset-reports/cockpit-pipeline/dc9-three-agent-foundation.md`
- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/source-job-report.md`
- `asset-reports/cockpit-pipeline/dc9-vslice-assembly/assembly-report.md`
- `asset-reports/cockpit-pipeline/dc9-vslice-shading/shading-report.md`
- `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`

### Candidate chosen

Stage handoff validation loop. The foundation, source, assembly, and shading passes all repeated a high-value cycle: read fresh state, validate job or upstream manifest, run a bounded stage command when approval exists, validate output hashes, inspect preview evidence, record a stage report, and stop at success, clean no-op, approval-required, blocked, or no-progress.

### Loop diagnosis

`$loop-doctor` verdict: repair needed, then ready. The repeated cycle was present but scattered across reports, prompts, and CLI commands. The repair was to add an explicit unpublished CockpitEscapeRoom stage handoff validation loop to `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`, including fresh-state checks, bounded action choices, reproducible validation commands, handoff records, and stop conditions.

### Files changed

- `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`
- `asset-reports/cockpit-pipeline/stage-handoff-loop-discovery.md`
- `art-source/cockpit-pipeline/EXEC_PLAN.md`

### Validation evidence

- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; reported Blender 5.1.2 and dirty status as report-only.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-vslice-shading/manifests/shading-complete.json` - pass, hashes verified.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.

### Remaining limitation

No Blender scene, GLB, material, texture, or script changed, so `$blender-web-assets` does not require export, render, or browser preview for this checkpoint. The future production handoff still needs owner visual approval before any `shading_complete` output is treated as final.
