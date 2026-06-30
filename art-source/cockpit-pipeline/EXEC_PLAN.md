# Cockpit Pipeline Ubuntu Foundation

## Purpose

Establish the Ubuntu-side foundation for the staged Blender cockpit pipeline before Agent 1 starts a four-component DC-9 vertical slice. A maintainer can validate machine readiness, create and advance stage manifests, verify handoff hashes, and run a Blender headless smoke test without constructing or replacing production cockpit assets.

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

## Source Intake: Airbus A320 Prebuilt Cockpit Candidate

### Purpose

Record the owner-approved browser download for the top-ranked Airbus A320 prebuilt cockpit candidate as an Agent 1 source-intake artifact. This is not an Agent 2 assembly approval and does not produce or replace deployable GLBs.

### Progress

- [x] 2026-06-30 - Confirmed branch `codex/asset-workflow-health-rehearsal` and clean tracked worktree before intake.
- [x] 2026-06-30 - Verified the owner-downloaded archive exists under `.cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/`.
- [x] 2026-06-30 - Recorded archive SHA-256, package contents, integrity check, license lead, and glTF metadata in the source intake report.
- [x] 2026-06-30 - Preserved the original downloaded archive outside Git and did not extract, import, assemble, optimize, or export runtime assets.

### Evidence

- `sha256sum .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip` - pass; SHA-256 `1f7ec972d2a34c24b1df574142c40659cb294d372ac7e3c2cd64f9d7d69f65d4`.
- `unzip -t .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip` - pass.
- `unzip -l .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip` - pass; glTF package with `scene.gltf`, `scene.bin`, `license.txt`, and 11 texture images.
- glTF metadata inspection - pass; 619 nodes, 135 meshes, 13 materials, 11 textures, no animations.

### Outcome

The downloaded `A320 Cockpit 2` source package is recorded as a cache-only Agent 1 input. Outcome: `approval-required`. The next bounded action is owner approval for Agent 1 Blender import/inspection. Agent 2 assembly remains blocked until an inspected source package receives human `source-approval.json`.

## Blender Import: Airbus A320 Prebuilt Cockpit Candidate

### Purpose

Pull the owner-approved `A320 Cockpit 2` source package into Blender for Agent 1 inspection while keeping extracted files and the inspection `.blend` outside Git.

### Progress

- [x] 2026-06-30 - Added a bounded `import-a320-source-candidate` pipeline command and Blender-side import inspection script.
- [x] 2026-06-30 - Extracted the glTF package under `.cache/cockpit-pipeline`.
- [x] 2026-06-30 - Imported `scene.gltf` into Blender 5.1.2 with factory startup and auto-execution disabled.
- [x] 2026-06-30 - Saved cache-only inspection file `.cache/cockpit-pipeline/inspection/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320-cockpit-2-import-inspection.blend`.
- [x] 2026-06-30 - Rendered preview evidence at `preview-renders/cockpit-pipeline/a320-prebuilt-parts-source-discovery/a320-cockpit-2-import-captain-seat-view.png`.

### Evidence

- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; Blender 5.1.2.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli import-a320-source-candidate` - pass; imported 135 meshes, 620 objects including inspection root, 13 materials, and 537334 triangles.
- Visual inspection of the generated captain-seat preview - pass for source inspection; render-only isolation exposes cockpit interior geometry including sidestick/panel/window/seat forms.

### Outcome

Outcome: `approval-required`. The source imports cleanly into Blender and the captain-seat isolation preview confirms usable cockpit interior geometry exists. It should not be source-approved for Agent 2 cockpit assembly until owner review accepts this source and a follow-up Agent 1 pass classifies/cleans cockpit interior component candidates.

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

## Shading Handoff Checkpoint: 2026-06-23

### Purpose

Run the next safe `shading_complete` handoff checkpoint using the stage handoff validation loop. Produce fresh validation evidence without treating the shaded vertical slice as production-approved.

### Branch and base

- Branch: `asset/dc9-shading-handoff-checkpoint`
- Base dependency: `asset/blender-loop-discovery`, because the loop documentation is pending review in PR #16 and is not merged to `main` yet.

### Fresh state

- `art-source/cockpit-pipeline/jobs/dc9-vslice-assembly/assembly-approval.json` exists and approves Agent 3 shading input.
- `art-source/cockpit-pipeline/jobs/dc9-vslice-shading/manifests/shading-complete.json` exists, verifies current shaded handoff artifacts, and records `approved: false` with `human-review-pending`.
- No `shading-approval.json` exists.

### Bounded action decision

Used the validate-only path. `run-shading-job` was not rerun because the upstream approval, output manifest, and preview evidence were present and no fresh input or validation failure justified regenerating identical shaded artifacts.

### Commands run

- `git status --short --branch` - pass; active branch confirmed.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; reported Blender 5.1.2 and dirty state as report-only.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-vslice-assembly/manifests/assembly-complete.json` - pass, hashes verified.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-vslice-shading/manifests/shading-complete.json` - pass, hashes verified.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from assembly-approved --to shading_complete` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from shading_complete --to shading-approved` - pass.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.
- `file preview-renders/cockpit-pipeline/dc9-vslice-shading/*.png preview-renders/cockpit-pipeline/dc9-vslice-shading/*.svg` - pass; six PNG renders at 1280 x 800 and one SVG contact sheet present.

### Preview inspection

Inspected:

- `preview-renders/cockpit-pipeline/dc9-vslice-shading/captain-daylight.png`
- `preview-renders/cockpit-pipeline/dc9-vslice-shading/captain-dim-instrument-lighting.png`
- `preview-renders/cockpit-pipeline/dc9-vslice-shading/gauge-glass-face-close-up.png`
- `preview-renders/cockpit-pipeline/dc9-vslice-shading/yoke-material-close-up.png`
- `preview-renders/cockpit-pipeline/dc9-vslice-shading/throttle-material-close-up.png`
- `preview-renders/cockpit-pipeline/dc9-vslice-shading/switch-cluster-close-up.png`

All inspected renders were nonblank and showed the expected shaded four-component vertical slice. Daylight and dim-lighting renders are suitable as handoff evidence. The switch cluster remains tiny and visually weak, matching the known source limitation. The asset remains sparse proof geometry, not model-correct production DC-9 cockpit art.

### Files changed

- `asset-reports/cockpit-pipeline/dc9-vslice-shading/handoff-checkpoint-2026-06-23.md`
- `art-source/cockpit-pipeline/EXEC_PLAN.md`

### Stop outcome

`approval-required`. The `shading_complete` handoff is validated and ready for human visual review as a pipeline checkpoint. It is not approved for final visual acceptance, production promotion, browser integration, or public model replacement.

Next trigger: before Agent 3 shading consumes any newly approved assembly manifest.

### Remaining delta

- Human visual review is required before any `shading-approved` handoff.
- The final production DC-9 variant remains unresolved.
- The switch cluster and overall cockpit geometry are too sparse for production-quality DC-9 approval.
- Windows/browser integration remains a separate workstream and was not touched.

## Source Discovery Quality Loop Checkpoint: 2026-06-23

### Purpose

Add a source-specific quality loop so Agent 1 ranks component source candidates before publishing a source handoff. The loop is intended to improve the decision that happens before stage handoff validation: whether Agent 1 found the best available source candidate for each component category, or documented why no viable alternative was found.

### Files inspected

- `AGENTS.md`
- `docs/WORKSTREAM_OWNERSHIP.md`
- `docs/CODEX_WORKFLOW.md`
- `.agents/skills/loop-doctor/SKILL.md`
- `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`
- `art-source/cockpit-pipeline/EXEC_PLAN.md`
- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/source-job-report.md`

### Loop Doctor diagnosis

Verdict: repair needed, then ready.

The existing playbook required source review artifacts but did not require Agent 1 to compare alternatives before selecting a handoff candidate. The first source report shows the risk: it produced one candidate per category and correctly flagged the switch cluster as lower confidence, but the durable workflow did not yet require an alternative search, ranking, rejected-candidate record, confidence rating, or downstream assembly warnings.

### Files changed

- `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`
- `art-source/cockpit-pipeline/EXEC_PLAN.md`

### Change summary

Added an unpublished CockpitEscapeRoom `Source discovery quality loop` under the three-agent review gates. It requires Agent 1 to:

- record variant, source path, confidence, intended use, and limitations for every selected or rejected source candidate
- inspect at least one alternative candidate per component category when practical, or document `no viable alternative found`
- rank candidates by variant match, cockpit specificity, completeness, readability, pivot/animation/XML evidence, material/texture evidence, and import reliability
- record selected and rejected candidates, selection reasons, confidence, and downstream assembly warnings before source handoff

The Source Review Gate now also requires a source candidate ranking with selected and rejected candidates.

### Validation evidence

- `git diff --check` - pass.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.

### Remaining limitation

This checkpoint changes only playbook and ExecPlan documentation. It does not rerun Agent 1 sourcing, does not create new source candidates, and does not change Blender scene files, GLBs, runtime code, or Windows-owned paths.

## Agent 1 Source Quality Ranking: 2026-06-23

### Purpose

Run Agent 1 through the Source Discovery Quality Loop for the existing DC-9 FlightGear source vertical slice. Produce a ranked source handoff record without regenerating source GLBs or treating simulator-source assets as production truth.

### Branch

- `asset/dc9-source-quality-ranking`

### Fresh source state

- Source job: `dc9-32-flightgear-source-vslice`
- Source repository: `https://github.com/FGMEMBERS-NONGPL/DC-9-32.git`
- Resolved revision: `d79e1476ce452a96126cc569a9c8a5d9fe705c8f`
- Source variant: `DC-9-32`
- Target variant: `unresolved`
- Variant scope: `unknown`

### Files inspected

- `art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/job.json`
- `art-source/cockpit-pipeline/stages/source/output/dc9-32-flightgear-source-vslice/component-catalog.json`
- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/source-inventory.json`
- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/xml-reference-report.json`
- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/extraction-report.json`
- `.cache/cockpit-pipeline/sources/DC-9-32/Models/Flightdeck/Flightdeck.xml`
- `.cache/cockpit-pipeline/sources/DC-9-32/Models/Flightdeck/flightdeck.ac`
- `.cache/cockpit-pipeline/sources/DC-9-32/Models/Flightdeck/Instruments/**`

### Bounded action decision

Used a ranking/report-only Agent 1 pass. The current source GLBs, metadata, previews, and manifest already exist and validate; no fresh evidence required rerunning `run-source-job`. The missing handoff evidence was source ranking: selected candidates, rejected alternatives, confidence, source limitations, and assembly warnings.

### Candidate ranking summary

- `dc9-src-yoke-assembly-001` - high confidence. Selected for captain-side yoke proof. FO/copilot yoke objects were rejected for this handoff but retained as a future alternate.
- `dc9-src-throttle-assembly-001` - high confidence. Selected for throttle/pedestal proof. Individual nearby levers were rejected as incomplete standalone throttle alternatives.
- `dc9-src-large-gauge-001` - medium confidence. Selected as a complete altimeter source package. Other instrument model/XML pairs remain viable future gauge candidates.
- `dc9-src-switch-cluster-001` - low confidence. Kept only as the best available inspected switch-cluster proof candidate; no stronger switch-cluster alternative was found. This is the first source category to revisit in a future Agent 1 batch.

### Files changed

- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/source-candidate-ranking.md`
- `art-source/cockpit-pipeline/EXEC_PLAN.md`

### Validation evidence

- Initial `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/manifests/sourcing-complete.json` failed after editing `source-job-report.md`, because that report is hash-declared in the existing source manifest. Repaired by reverting the `source-job-report.md` edit and keeping the ranking as a separate checkpoint report.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; reported Blender 5.1.2 and dirty state as report-only.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/job.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/manifests/sourcing-complete.json` - pass after repair, hashes verified.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.
- `git diff --check` - pass.

### Stop outcome

`approval-required`. The source candidates remain suitable for a pipeline-proof source handoff with ranking evidence now attached. They are not production-correct DC-9 components and should not be treated as final art.

Next trigger: before Agent 1 publishes any new or replacement DC-9 source component batch.

### Remaining delta

- Human source review is still required before any future Agent 2 assembly consumes a new source batch.
- The final production DC-9 variant remains unresolved.
- The switch cluster source remains low confidence and should be revisited first.

## Reference Source Job Schema Repair: 2026-06-23

### Purpose

Repair the newly merged DC-9 reference source discovery job so it validates against the checked-in job schema while preserving the richer source-discovery nuance in an asset report.

### Fresh state

After syncing PR #18, `art-source/cockpit-pipeline/jobs/dc9-reference-source-discovery/job.json` failed schema validation because `variantScope` used `target_visual_reference_with_mixed_source_candidates`, which is not an allowed enum value.

### Files changed

- `art-source/cockpit-pipeline/jobs/dc9-reference-source-discovery/job.json`
- `asset-reports/references/dc9-51-reference-source-package.md`
- `art-source/cockpit-pipeline/EXEC_PLAN.md`

### Repair

- Changed the job file to `variantScope: target-confirmed`, matching the schema and the DC-9-51 primary visual target.
- Added report text explaining that the broader discovery intent remains target visual reference with mixed source candidates, and that Agent 1 must record each candidate's source variant and limitations before handoff.

### Validation evidence

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/dc9-reference-source-discovery/job.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/job.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/manifests/sourcing-complete.json` - pass, hashes verified.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.

### Remaining delta

- This repair does not run the new DC-9 reference source discovery job. It only restores schema validity for the checked-in request.

## Cockpit Pipeline Gate Hardening: 2026-06-25

### Purpose

Strengthen the staged cockpit pipeline before more generated, simulator-source, or Tripo AI candidates enter the asset flow. The goal is to prevent proxy assets from bypassing reference authority, runtime contract evidence, optimization review, or Windows/browser integration.

### Bounded action decision

Made a documentation and prompt-template update only. No source jobs, assembly jobs, shading jobs, Blender exports, generated assets, or runtime loaders were changed.

### Files changed

- `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`
- `art-source/cockpit-pipeline/README.md`
- `tools/blender/AGENTS.md`
- `tools/blender/cockpit_pipeline/prompts/agent0-reference-authority.md`
- `tools/blender/cockpit_pipeline/prompts/agent1-sourcing.md`
- `tools/blender/cockpit_pipeline/prompts/agent2-assembly.md`
- `tools/blender/cockpit_pipeline/prompts/agent3-shading.md`
- `docs/ASSET_PIPELINE.md`

### Change summary

- Added Agent 0 Reference Authority as the required source-authority gate before Agent 1.
- Added a Tripo AI candidate lane that treats generated assets as candidate/proxy source material until imported into Blender, inspected, cleaned, optimized, documented, and approved.
- Expanded Agent 2 handoff requirements with a runtime contract checklist for node names, hierarchy, pivots, local axes, scale, `game_id` metadata, interaction metadata, and GLB reimport evidence.
- Reframed Agent 3 as Materials and Optimization, with material counts, texture sizes, GLB size, optimization decisions, and non-destructive contract preservation.
- Added a Windows Browser Integration Gate so Ubuntu asset completion does not imply React/browser acceptance.

### Validation evidence

- `rg -n "Do not implement a Blender MCP|MCP until|Airbus bonus|bonus cockpit|Agent 3 — Shading|Shading Review Gate|three-agent Blender cockpit pipeline|3-Agent Cockpit" README.md AGENTS.md BLUEPRINT.md docs src art-source/cockpit-pipeline tools/blender .agents/skills -g '*.md' -g '*.ts' -g '*.tsx' -g '!art-source/cockpit-pipeline/EXEC_PLAN.md'` - pass, no matches.
- `git diff --check` - pass.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 5 tests.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/dc9-reference-source-discovery/job.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/manifests/sourcing-complete.json` - pass, hashes verified.
- `npm run check` - pass.

### Remaining delta

- Existing checked-in pipeline manifests and state-machine stage names still use `shading` terminology. This checkpoint does not rename artifacts or commands because that would be a broader compatibility migration.
- Future stage reports should start recording Agent 0 authority notes and runtime contract checklists.

## Agent Gate Validation and Eval Upgrade: 2026-06-26

### Purpose

Implement the five recommended workflow upgrades from the agent best-practices comparison:

1. structured, machine-validated gate artifacts
2. deterministic agent workflow evals
3. branch/PR milestone guidance
4. explicit glTF export contract reporting
5. stronger reference/source manifest validation

### Bounded action decision

Added validators, schemas, eval fixtures, docs, and manifest records only. No Blender source scenes, production GLBs, generated models, preview renders, or runtime gameplay behavior were changed.

### Files changed

- `tools/blender/cockpit_pipeline/schemas/*.schema.json`
- `tools/blender/cockpit_pipeline/eval_runner.py`
- `tools/blender/cockpit_pipeline/evals/fixtures/*.json`
- `tools/blender/cockpit_pipeline/pipeline_cli.py`
- `tools/blender/cockpit_pipeline/tests/test_pipeline_contracts.py`
- `tools/blender/export_glb.py`
- `tools/assets/build-asset.mjs`
- `tools/references/validate_manifest.py`
- `art-source/cockpit-pipeline/gates/examples/*.json`
- `art-source/cockpit-pipeline/README.md`
- `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`
- `art-source/references/README.md`
- `art-source/references/reference-manifest.yaml`
- `docs/ASSET_PIPELINE.md`
- `package.json`
- `tools/blender/AGENTS.md`
- `TEST_REPORT.md`

### Change summary

- Added `validate-gate` CLI support for Agent 0 reference authority, Agent 2 runtime contract, Agent 3 material/optimization, and Windows/browser integration artifacts.
- Added example JSON gate artifacts under `art-source/cockpit-pipeline/gates/examples/`.
- Added deterministic eval fixtures and `npm run pipeline:evals` for Tripo proxy handling, missing Agent 0 authority, runtime contract preservation, Airbus/DC-9 detail separation, and Model Y spoiler protection.
- Updated GLB export reporting so asset builds record contract-sensitive export settings, including `export_extras: true`, selected object count, and `game_id` nodes.
- Strengthened reference validation to scan every checked-in reference image and verify recorded hashes.
- Added A320 reference-folder manifest records and removed stale manifest entries for images no longer checked in.

### Validation evidence

- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 7 tests.
- `npm run pipeline:evals` - pass, 6/6 deterministic workflow evals.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/examples/agent0-dc9-reference-authority.example.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/examples/agent2-runtime-contract.example.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/examples/agent3-material-optimization.example.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/examples/windows-browser-integration.example.json` - pass.
- `npm run references:validate` - pass for 24 references.
- `git diff --check` - pass.
- `npm run check` - pass; lint, typecheck, 9 tests, and production build completed.
- `npm run assets:check` - pass with existing glTF validator warning table for unused texture coordinates and empty nodes in `public/models/dc9-cockpit.glb`.
- `npm run references:check` - pass; rendered `.cache/references/dc9_reference_overview.png` with Blender 5.1.2.

### Remaining delta

- The new gate examples are templates, not owner approvals for a production asset.
- Reference entries still require source/provenance cleanup where manifest notes remain incomplete.

## Airbus A320 Agent 1 Web Reference Sourcing: 2026-06-30

### Purpose

Run the Airbus A320 Agent 1 sourcing step after Agent 0 authorized web-reference discovery for the Airbus A320 First-Officer cockpit. This pass searched and ranked web source leads only. It did not download images, import assets into Blender, run Tripo/Marble generation, create GLBs, or start Agent 2 assembly.

### Fresh state

- Branch: `codex/asset-workflow-health-rehearsal`
- Agent 0 authority: `art-source/cockpit-pipeline/gates/agent0-airbus-a320-web-reference-authority.json`
- Source seed: `art-source/cockpit-pipeline/source-discovery-seeds/a320-web-reference-source-discovery.seed.json`
- Job: `art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/job.json`
- Target scene group: Airbus A320 First-Officer cockpit
- Target aircraft: Airbus A320

### Bounded action decision

Ran Agent 1 web-reference source discovery and stopped at `sourcing_complete`. No downstream stage work was run because the source handoff still requires human review before downloads, source approval, reference-board approval, or Agent 2 assembly.

### Source ranking summary

- Airbus official cockpits page - selected as primary manufacturer context for A320-family cockpit commonality; not a downloadable modeling board.
- Wikimedia Commons `Cockpits of Airbus A320` category - selected as a source index; each file requires per-file license/provenance review before manifesting or downloading.
- Wikimedia Commons `EasyJet airbus A320 cockpit.jpg` - selected as a real A320 cockpit candidate for future manifest/download review.
- Wikimedia Commons `Airbus A320 Glass Cockpit.jpg` - rejected for geometry authority because it is a simulator cockpit; may be presentation-only after license review.
- FlyByWire A32NX flight deck overview - selected only as simulator documentation for panel-name/source-triage orientation.

### Files changed

- `tools/blender/cockpit_pipeline/schemas/job_request.schema.json`
- `art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/job.json`
- `art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/manifests/sourcing-complete.json`
- `art-source/cockpit-pipeline/stages/source/output/a320-web-reference-source-discovery/component-catalog.json`
- `asset-reports/cockpit-pipeline/a320-web-reference-source-discovery/source-candidate-ranking.md`
- `asset-reports/cockpit-pipeline/a320-web-reference-source-discovery/source-job-report.md`
- `art-source/cockpit-pipeline/EXEC_PLAN.md`

### Validation evidence

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/agent0-airbus-a320-web-reference-authority.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/job.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/manifests/sourcing-complete.json` - pass, hashes verified.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; Blender 5.1.2 found and dirty state reported as expected.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 7 tests.
- `npm run pipeline:evals` - pass, 6/6.
- `npm run references:validate` - pass, 24 references.

### Stop outcome

`approval-required`. The A320 source handoff is complete enough for owner/source review, but no source is approved for download, Blender use, production geometry, or Agent 2 assembly.

### Remaining delta

- Pick which real A320 Commons file pages should become manifest entries.
- Add source records before any downloads.
- Find stronger first-officer side-stick, overhead, and pedestal close-up references with compatible licenses.
- Keep simulator/FlyByWire sources presentation-only.

## Airbus A320 Agent 1 Prebuilt Parts Sourcing: 2026-06-30

### Purpose

Run a free/open-first Agent 1 sourcing pass for prebuilt Airbus A320 cockpit parts. This pass searched and ranked prebuilt source leads only. It did not download models, clone repositories, import assets into Blender, run Tripo/Marble generation, create GLBs, or start Agent 2 assembly.

### Fresh state

- Branch: `codex/asset-workflow-health-rehearsal`
- Agent 0 authority: `art-source/cockpit-pipeline/gates/agent0-airbus-a320-prebuilt-parts-authority.json`
- Source seed: `art-source/cockpit-pipeline/source-discovery-seeds/a320-prebuilt-parts-source-discovery.seed.json`
- Job: `art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/job.json`
- Target scene group: Airbus A320 First-Officer cockpit
- Target aircraft: Airbus A320

### Bounded action decision

Ran Agent 1 prebuilt-parts source discovery and stopped at `sourcing_complete`. No downstream stage work was run because the source handoff requires human review before downloads, source approval, Blender import, or Agent 2 assembly.

### Source ranking summary

- Sketchfab `A320 Cockpit 2` - selected as the strongest broad cockpit mesh lead; CC Attribution lead; 537.6k triangle page lead.
- Sketchfab `A320-200 Cockpit` - selected as an alternate broad cockpit mesh lead; CC Attribution lead; 50.7k triangle page lead.
- Sketchfab `A320 - Airbus Pilot Chair` - selected as a standalone chair candidate; CC Attribution lead; 13.1k triangle page lead.
- GitHub `FGDATA/IDG-A32X` - selected for safe repository inspection planning only; GPL-2.0 license lead and simulator-source limitations apply.
- Printables A320 FCU/pedestal search pools - selected for individual page review; search results are not source approval.
- Thingiverse A320 sidestick search pool - selected as a weak fallback for side-stick/mount proxy leads.
- Sketchfab `A320 Part Cockpit` - retained as a partial cockpit alternate; CC Attribution lead; 197.9k triangle page lead.

### Files changed

- `tools/blender/cockpit_pipeline/schemas/reference_authority.schema.json`
- `art-source/cockpit-pipeline/gates/agent0-airbus-a320-prebuilt-parts-authority.json`
- `art-source/cockpit-pipeline/source-discovery-seeds/a320-prebuilt-parts-source-discovery.seed.json`
- `art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/job.json`
- `art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/manifests/sourcing-complete.json`
- `art-source/cockpit-pipeline/stages/source/output/a320-prebuilt-parts-source-discovery/component-catalog.json`
- `asset-reports/cockpit-pipeline/a320-prebuilt-parts-source-discovery/source-candidate-ranking.md`
- `asset-reports/cockpit-pipeline/a320-prebuilt-parts-source-discovery/source-job-report.md`
- `art-source/cockpit-pipeline/EXEC_PLAN.md`

### Validation evidence

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/agent0-airbus-a320-prebuilt-parts-authority.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/job.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/manifests/sourcing-complete.json` - pass, hashes verified.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; Blender 5.1.2 found and dirty state reported as expected.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 7 tests.
- `npm run pipeline:evals` - pass, 6/6.
- `npm run references:validate` - pass, 24 references.
- URL checks - live HTTP responses for selected Sketchfab, GitHub, Printables, and Thingiverse leads after replacing stale Sketchfab URLs.

### Stop outcome

`approval-required`. The A320 prebuilt-parts handoff is ready for owner/source review, but no source is approved for download, Blender use, production geometry, or Agent 2 assembly.

### Remaining delta

- Choose which prebuilt candidates should be downloaded for inspection.
- Add source/asset records before any downloads.
- Inspect each selected model page license, author, download availability, file format, polygon count, and texture sizes.
- Keep simulator/home-cockpit/printable sources as proxy candidates until checked against real Airbus A320 references.

## Airbus A320 Cockpit 2 Download Approval Attempt: 2026-06-30

### Purpose

Act on the owner decision to use the top-ranked Sketchfab `A320 Cockpit 2` candidate as the base Airbus cockpit candidate. The intended action was to download the asset to the cockpit pipeline cache for inspection only.

### Fresh state

- Candidate: `a320-prebuilt-sketchfab-a320-cockpit-2`
- Source page: `https://sketchfab.com/3d-models/a320-cockpit-2-5fb0c671a91042c1a9d8f2cf3e2df021`
- Job: `art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/job.json`
- Source handoff manifest: `art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/manifests/sourcing-complete.json`

### Bounded action decision

Recorded download approval and attempted the official Sketchfab download route. No scraping, bypassing, Blender import, GLB export, runtime integration, or Agent 2 assembly was attempted.

### Result

`blocked`. The Sketchfab public metadata API confirmed the model, author, CC BY 4.0 license, and face count, but the official download API returned `401 Unauthorized` without a Sketchfab OAuth token. The browser-style download page did not expose a model archive.

### Files changed

- `art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/download-approval-a320-cockpit-2.json`
- `asset-reports/cockpit-pipeline/a320-prebuilt-parts-source-discovery/a320-cockpit-2-download-attempt.md`
- `art-source/cockpit-pipeline/EXEC_PLAN.md`

### Remaining delta

- Provide an authenticated Sketchfab download route, preferably a local-only OAuth/API token.
- Retry the download into `.cache/cockpit-pipeline`.
- Record archive hashes, package contents, file formats, texture sizes, and import plan before Blender inspection.
