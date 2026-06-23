# CockpitEscapeRoom 3-Agent Cockpit Pipeline Playbook

## Purpose

This playbook defines how the Ubuntu/Blender computer runs the CockpitEscapeRoom 3-Agent Cockpit Pipeline after the first completed vertical slice.

The first slice proved that Agent 1 Sourcing, Agent 2 Assembly, and Agent 3 Shading can each produce stage outputs. It did **not** prove final cockpit quality. Future work should use the pipeline to improve component quality, pivots, scale, materials, reports, and browser readiness without letting agents collide in the same Blender scene.

The goal is a strict staged asset factory, not a swarm.

## Core rule

Do not operate the three agents as a swarm editing the same cockpit simultaneously.

Run new or unproven pipeline capabilities sequentially until the contracts are proven:

1. Agent 1 — Sourcing
2. Agent 2 — Assembly
3. Agent 3 — Shading

After a contract is proven, stagger work by batch:

```text
Agent 1 sources Batch 3
Agent 2 assembles approved Batch 2
Agent 3 shades approved Batch 1
```

No agent may consume an unapproved output from the previous stage.

## Operating modes

### Sequential mode

Use sequential mode whenever the pipeline contract, source type, component category, importer, layout convention, material recipe, or validation rule is new or unstable.

```text
source branch → source review → merge
assembly branch → assembly review → merge
shading branch → shading review → merge
```

Sequential mode is mandatory for:

- the first batch of a new aircraft area
- new importer routes
- major cockpit shell changes
- runtime contract changes
- pivot repair policy changes
- new material baking strategy
- anything that modifies the shape of handoff manifests

### Staggered batch mode

Use staggered batch mode only after the source, assembly, and shading contracts are stable for that type of work.

```text
Batch 1: Agent 3 shading approved assembly
Batch 2: Agent 2 assembling approved source candidates
Batch 3: Agent 1 sourcing new candidates
```

A batch may move forward only when the previous stage has:

- required artifacts
- stage manifest
- hashes for declared handoff files
- validation report
- preview evidence
- human approval file

## Agent roles

### Agent 1 — Sourcing

Agent 1 owns source intake, extraction, candidate discovery, component metadata, candidate GLBs, source reports, and preview renders.

Agent 1 may:

- use network access for configured source intake
- cache downloaded repositories outside Git
- inventory source models, XML, textures, and metadata
- import source assets into Blender for inspection
- create candidate component packages
- export candidate GLBs
- produce contact sheets and candidate catalogs

Agent 1 must not:

- assemble the cockpit
- shade production materials
- write production models to `public/models/**`
- fabricate missing categories
- treat keyword matches as final approvals
- execute Python, shell scripts, Blender handlers, add-ons, or build files found inside downloaded aircraft repositories
- modify Agent 2 or Agent 3 outputs

### Agent 2 — Assembly

Agent 2 owns layout JSON, neutral cockpit assembly, stable runtime node names, pivots, hierarchy, interaction metadata, neutral GLB exports, and assembly reports.

Agent 2 may:

- consume approved Agent 1 outputs
- create or update cockpit layout JSON
- import approved component GLBs
- position objects from layout data
- repair pivots when recorded
- assign stable runtime node names
- add interaction metadata
- export neutral assembly artifacts

Agent 2 must not:

- consume unapproved Agent 1 outputs
- edit source candidates in place
- shade final materials
- hand-place objects without recording transforms in layout JSON
- rename source files casually to hide pipeline problems
- flatten interactive hierarchy
- modify Agent 3 outputs

### Agent 3 — Shading

Agent 3 owns semantic material recipes, procedural wear, PBR baking, shaded GLBs, texture reports, and final visual evidence.

Agent 3 may:

- consume approved Agent 2 outputs
- assign semantic material roles
- create deterministic material recipes
- apply restrained cockpit wear
- bake Blender-only procedural details into web-compatible PBR textures
- export shaded handoff artifacts
- generate daylight, dim-lighting, and comparison renders

Agent 3 must not:

- consume unapproved Agent 2 outputs
- rearrange components
- rename runtime nodes
- flatten or join interactive objects
- break pivots, local axes, hierarchy, custom properties, or metadata
- make the cockpit look abandoned, rusty, or sci-fi
- modify Agent 1 or Agent 2 outputs except to read them

## Batch conveyor

Use this conveyor only after vertical-slice contracts are stable.

| Batch | Agent 1 | Agent 2 | Agent 3 |
| --- | --- | --- | --- |
| Batch 1 | Complete | Complete | Shading |
| Batch 2 | Complete | Assembly | Waiting |
| Batch 3 | Sourcing | Waiting | Waiting |

A batch cannot skip a stage. A batch cannot move to the next stage without the required approval artifact.

## Required review gates

### Stage handoff validation loop

Unpublished CockpitEscapeRoom adaptation, derived from the completed foundation, source, assembly, and shading passes.

Use this loop whenever a stage is about to consume another stage's output or publish a new stage handoff. It is intentionally smaller than a new Skill: the pipeline already has commands and reports, but the repeatable cycle needs to stay explicit so agents do not act on stale approvals or incomplete evidence.

#### Trigger

- Agent 1 starts a new source batch.
- Agent 2 is about to consume source outputs.
- Agent 3 is about to consume assembly outputs.
- Any stage report, manifest, GLB, texture set, preview render, layout, pivot policy, or material recipe changes.

#### Cycle

1. Read fresh state:
   - `git status --short --branch`
   - current stage job JSON
   - required upstream approval file, if this is Agent 2 or Agent 3
   - required upstream manifest
   - latest stage report and preview evidence
2. Choose one bounded action:
   - validate only, if evidence is stale or approval is missing
   - rerun the current stage job, if the input contract is valid
   - stop for owner review, if the previous stage is complete but not approved
   - stop for Windows/browser handoff, if the change requires app integration
3. Verify with reproducible evidence:
   - `python3 -m tools.blender.cockpit_pipeline.preflight`
   - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job <job.json>`
   - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest <required-upstream-manifest>`
   - stage command, when acting: `run-source-job`, `run-assembly-job`, or `run-shading-job`
   - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest <new-output-manifest>`
   - `python3 -m unittest discover tools/blender/cockpit_pipeline/tests`
   - visual inspection of the generated preview renders or contact sheet
4. Record the handoff:
   - branch and commit
   - job ID and batch ID, if applicable
   - upstream approval file consumed
   - commands actually run and pass/fail results
   - generated files and manifest path
   - preview paths inspected
   - known limitations and next stage
   - any runtime contract changes for Windows/browser integration
5. Stop with one explicit outcome:
   - `success`: manifest hashes verify, previews are inspected, and the stage report is updated
   - `clean no-op`: current evidence is already valid and no files need changes
   - `approval-required`: a stage is complete but lacks human approval for the next stage
   - `blocked`: required input, Blender, cache, or approval evidence is unavailable
   - `no-progress`: the same validation failure remains after a bounded repair attempt

#### Safety checks

- Do not consume a `*_complete` stage as approved unless a matching human approval file exists and is listed in the stage report.
- Do not rerun a downstream job from a stale branch or dirty worktree without recording why dirty state is acceptable.
- Do not overwrite generated GLBs by hand.
- Do not treat preview render inspection as final visual approval.
- Do not update Windows-owned browser code or `TEST_REPORT.md` from this Ubuntu loop.

### Source Review Gate

Required before Agent 2:

- component catalog
- candidate metadata
- candidate GLBs
- preview PNGs
- contact sheet when practical
- inventory report
- unsupported-format report
- source-stage manifest
- human `source-approval.json`

### Assembly Review Gate

Required before Agent 3:

- neutral `.blend`
- neutral `.glb`
- resolved layout JSON
- node and pivot report
- assembly-stage manifest
- validation report
- preview renders
- human `assembly-approval.json`

### Shading Review Gate

Required before browser integration or production promotion:

- shaded `.blend`
- shaded `.glb`
- material recipes
- material assignment report
- texture and bake report
- validation report
- comparison contact sheet
- human `shading-approval.json`

Agents may mark their stage complete. They must not mark their own work approved.

## Branch and worktree rules

Use separate branches per stage and batch.

Examples:

```text
asset/dc9-b01-source-controls
asset/dc9-b01-assembly-controls
asset/dc9-b01-shading-controls

asset/dc9-b02-source-gauges
asset/dc9-b02-assembly-gauges
asset/dc9-b02-shading-gauges
```

Rules:

- Never have two agents edit the same branch.
- Never have two agents edit the same `.blend` file at the same time.
- Do not branch Agent 2 from an unreviewed Agent 1 branch.
- Do not branch Agent 3 from an unreviewed Agent 2 branch.
- Do not use a local unmerged worktree output as another agent's input unless the owner explicitly records an exception.
- Keep downloaded repositories and disposable conversions outside Git under the configured cache path.

## Variant rule

CockpitEscapeRoom may use DC-9-32 or DC-9-51.

Until the owner explicitly chooses the production variant, every source, component, layout, report, and manifest must preserve:

- `sourceVariant`
- `targetVariant`
- `variantScope`

Do not silently finalize DC-9-32 or DC-9-51.

## Runtime contract rule

Stable object names, pivots, hierarchy, animations, and `game_id` custom properties are public runtime contracts.

Agent 2 creates or confirms these contracts for assembled assets. Agent 3 must preserve them.

Any contract change must be recorded in the stage report and called out for the Windows/browser integration workstream.

## Private noncommercial asset rule

CockpitEscapeRoom is currently a private, personalized, noncommercial build.

For this private flow, agents may use owner-approved source assets, textures, logos, and airline artwork when clearly intended for this scope.

If an asset is later intended for public, commercial, reusable, or template production release, it must be reviewed separately and recorded in the asset manifest according to the production asset rules.

## Quality bar

The first vertical slice proves the pipeline, not final cockpit quality.

Each new batch must improve at least one of:

- better component grouping
- better pivots
- better cockpit scale
- better source metadata
- better visual fidelity
- better browser readiness
- fewer manual fixes
- cleaner reports
- clearer approval evidence

Do not repeat a weak result just because the pipeline can technically produce it.

If a result is nowhere near the CockpitEscapeRoom quality bar, record why, decide whether the pipeline stage or source input is at fault, and improve the next batch accordingly.

## Evidence required

Every stage report must include:

- branch
- commit
- job ID
- batch ID when applicable
- commands run
- pass/fail results
- generated files
- preview paths
- known limitations
- visual review notes
- exact reproduction command
- next recommended stage

Do not claim success without actual validation evidence.

## Browser integration handoff

The Ubuntu/Blender pipeline may produce shaded GLBs and preview renders, but Windows owns React, TypeScript, browser interaction, tests, and Vercel preview work.

When an asset is ready for browser integration, the Ubuntu stage report must call out:

- final GLB path
- runtime node names
- `game_id` values
- pivots and local axes
- expected interaction types
- file size
- known material or performance limitations
- screenshots or renders for comparison

Do not modify browser code from a Blender agent branch.
