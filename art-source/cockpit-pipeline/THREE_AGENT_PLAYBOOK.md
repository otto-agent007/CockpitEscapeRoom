# CockpitEscapeRoom Cockpit Pipeline Playbook

## Purpose

This playbook defines how the Ubuntu/Blender computer runs the CockpitEscapeRoom staged cockpit pipeline after the first completed vertical slice.

The first slice proved that Agent 1 Sourcing, Agent 2 Assembly, and Agent 3 Shading can each produce stage outputs. It did **not** prove final cockpit quality. Future work should use the pipeline to improve reference authority, component quality, pivots, scale, materials, reports, optimization evidence, and browser readiness without letting agents collide in the same Blender scene.

The goal is a strict staged asset factory, not a swarm. The production flow has four gates:

0. Agent 0 — Reference Authority
1. Agent 1 — Sourcing
2. Agent 2 — Assembly
3. Agent 3 — Materials and Optimization

Windows/browser integration is a separate downstream gate, not an Ubuntu Blender-agent stage.

## Core rule

Do not operate the agents as a swarm editing the same cockpit simultaneously.

Run new or unproven pipeline capabilities sequentially until the contracts are proven:

0. Agent 0 — Reference Authority
1. Agent 1 — Sourcing
2. Agent 2 — Assembly
3. Agent 3 — Materials and Optimization

After a contract is proven, stagger work by batch:

```text
Agent 0 approves authority for Batch 4
Agent 1 sources Batch 3
Agent 2 assembles approved Batch 2
Agent 3 materials/optimizes approved Batch 1
```

No agent may consume an unapproved output from the previous stage.

## Operating modes

### Sequential mode

Use sequential mode whenever the pipeline contract, source type, component category, importer, layout convention, material recipe, or validation rule is new or unstable.

```text
source branch → source review → merge
assembly branch → assembly review → merge
materials branch → materials review → merge
```

Sequential mode is mandatory for:

- a new reference authority decision
- the first batch of a new aircraft area
- any Tripo AI candidate lane
- new importer routes
- major cockpit shell changes
- runtime contract changes
- pivot repair policy changes
- new material baking strategy
- anything that modifies the shape of handoff manifests

### Staggered batch mode

Use staggered batch mode only after the reference, source, assembly, and materials contracts are stable for that type of work.

```text
Batch 1: Agent 3 applying materials and optimization to approved assembly
Batch 2: Agent 2 assembling approved source candidates
Batch 3: Agent 1 sourcing new candidates
Batch 4: Agent 0 preparing source authority
```

A batch may move forward only when the previous stage has:

- required artifacts
- stage manifest
- hashes for declared handoff files
- validation report
- preview evidence
- human approval file

## Agent roles

### Agent 0 — Reference Authority

Agent 0 owns the source authority decision before Agent 1 starts a batch. It does not create geometry. It defines what source material is allowed to influence the next asset pass.

Agent 0 may:

- read owner decisions, reference manifests, aircraft notes, asset reports, and visual approval records
- classify target aircraft, source aircraft, source type, and allowed usage scope
- mark a source as visual authority, geometry authority, proxy candidate, presentation benchmark, private-only asset, or rejected
- record forbidden uses and variant-mixing risks
- prepare a reference-authority note for Agent 1

Agent 0 must not:

- download new source repositories
- edit Blender scenes
- generate Tripo assets
- approve production geometry from a proxy or simulator source
- let generated or imported assets override aircraft-specific reference boards
- consume or modify Agent 1, Agent 2, or Agent 3 outputs except as evidence

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

- start without an Agent 0 reference-authority note for the batch
- assemble the cockpit
- shade production materials
- write production models to `public/models/**`
- fabricate missing categories
- treat keyword matches as final approvals
- execute Python, shell scripts, Blender handlers, add-ons, or build files found inside downloaded aircraft repositories
- modify Agent 2 or Agent 3 outputs

### Tripo AI candidate lane

Tripo AI outputs enter through Agent 1 as candidate/proxy source material, not as production authority.

Every Tripo candidate must record:

- prompt or generation brief
- target scene group
- intended use and forbidden use
- source type: `tripo-candidate`
- target aircraft or scene, if applicable
- whether it is aircraft-specific, generic prop, locker prop, vehicle proxy, or Mars prop
- source authority from Agent 0
- Blender import path
- stable object naming plan
- pivot and local-axis inspection result
- material count, texture dimensions, file size, and known defects
- preview render path and validation report path

Tripo candidates must be imported into Blender before runtime use. They may not be copied directly into `public/models/**`, and they may not silently replace DC-9 or Airbus aircraft-specific reference geometry.

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

### Agent 3 — Materials and Optimization

Agent 3 owns semantic material recipes, procedural wear, PBR baking, non-destructive optimization decisions, shaded GLBs, texture reports, and final visual evidence.

Agent 3 may:

- consume approved Agent 2 outputs
- assign semantic material roles
- create deterministic material recipes
- apply restrained cockpit wear
- bake Blender-only procedural details into web-compatible PBR textures
- reduce unnecessary materials, geometry, and texture sizes when interaction contracts still pass
- export shaded handoff artifacts
- generate daylight, dim-lighting, and comparison renders

Agent 3 must not:

- consume unapproved Agent 2 outputs
- rearrange components
- rename runtime nodes
- flatten or join interactive objects
- break pivots, local axes, hierarchy, custom properties, or metadata
- run destructive optimization before hierarchy and interaction contracts are verified
- hide weak or incorrect geometry with dramatic lighting, heavy grime, or baked texture tricks
- make the cockpit look abandoned, rusty, or sci-fi
- modify Agent 1 or Agent 2 outputs except to read them

## Batch conveyor

Use this conveyor only after vertical-slice contracts are stable.

| Batch | Agent 0 | Agent 1 | Agent 2 | Agent 3 |
| --- | --- | --- | --- | --- |
| Batch 1 | Complete | Complete | Complete | Materials and optimization |
| Batch 2 | Complete | Complete | Assembly | Waiting |
| Batch 3 | Complete | Sourcing | Waiting | Waiting |
| Batch 4 | Reference authority | Waiting | Waiting | Waiting |

A batch cannot skip a stage. A batch cannot move to the next stage without the required approval artifact.

## Required review gates

### Reference Authority Gate

Required before Agent 1:

- target scene group
- target aircraft and variant status
- source candidate type: real-aircraft reference, simulator/open-source geometry, Tripo candidate, owner-supplied asset, private-only artwork, or presentation benchmark
- source aircraft or object identity
- allowed usage scope
- forbidden usage scope
- variant compatibility notes
- licensing/private-use notes
- owner decision or unresolved approval requirement

For DC-9 work, record `sourceVariant`, `targetVariant`, and `variantScope`. For Airbus work, do not start production modeling until `exactAirbusModel` is confirmed.

Reference authority artifacts should be JSON and validate with:

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority <path>
```

### Stage handoff validation loop

Unpublished CockpitEscapeRoom adaptation, derived from the completed foundation, source, assembly, and materials passes.

Use this loop whenever a stage is about to consume another stage's output or publish a new stage handoff. It is intentionally smaller than a new Skill: the pipeline already has commands and reports, but the repeatable cycle needs to stay explicit so agents do not act on stale approvals or incomplete evidence.

#### Trigger

- Agent 0 prepares source authority for a new batch.
- Agent 1 starts a new source batch.
- Agent 2 is about to consume source outputs.
- Agent 3 is about to consume assembly outputs.
- Any stage report, manifest, GLB, texture set, preview render, layout, pivot policy, or material recipe changes.

#### Cycle

1. Read fresh state:
   - `git status --short --branch`
   - current stage job JSON
   - required upstream approval file, if this is Agent 2 or Agent 3
   - required Agent 0 reference-authority note, if this is Agent 1
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
- Do not start Agent 1 without a current reference-authority note.
- Do not let Tripo, simulator, or open-source candidates override approved aircraft-specific references.
- Do not rerun a downstream job from a stale branch or dirty worktree without recording why dirty state is acceptable.
- Do not overwrite generated GLBs by hand.
- Do not treat preview render inspection as final visual approval.
- Do not update Windows-owned browser code or `TEST_REPORT.md` from this Ubuntu loop.

### Source discovery quality loop

Unpublished CockpitEscapeRoom adaptation for Agent 1 source selection.

Use this loop before Agent 1 publishes any source handoff. The goal is not to prove that a simulator or open-source model is production-correct. The goal is to make Agent 1 show that it looked for better component sources, ranked what it found, and warned Agent 2 about source limitations before assembly starts.

#### Trigger

- Agent 1 starts a new DC-9 source batch.
- Agent 1 starts a Tripo AI candidate batch.
- Agent 1 adds or replaces a source component candidate.
- A source category has only one candidate.
- A candidate has weak variant match, sparse geometry, missing animation metadata, unsupported formats, unclear source hierarchy, or poor preview evidence.

#### Candidate record

Every candidate, selected or rejected, must record:

- component category and candidate ID
- source URL or local source collection
- resolved revision, when available
- source path inside the source collection
- source variant
- target variant and `variantScope`
- intended use in the CockpitEscapeRoom pipeline
- confidence: `high`, `medium`, or `low`
- reasons for the confidence rating
- known limitations
- extraction or import route used
- Tripo prompt or generation brief, when applicable
- preview path, validation report path, and metadata path when generated

#### Cycle

1. Read fresh source state:
   - current job JSON
   - existing component catalog
   - source inventory, XML/reference report, extraction report, and previews
   - unresolved DC-9 variant notes
2. Search or inspect alternatives within the allowed source scope:
   - require at least one alternative candidate for each component category when practical
   - if no viable alternative is found, record `no viable alternative found` with inspected paths, query terms, or source areas
   - do not silently mix DC-9 variants, MD-80 layouts, or unrelated cockpit geometry
3. Rank candidates within each component category:
   - variant match and cockpit-area specificity
   - component completeness and grouping
   - geometry readability from the intended cockpit view
   - pivot, hierarchy, animation, or XML relationship evidence
   - material/texture availability as source evidence, not final production quality
   - import reliability and reimport validation
   - licensing or private-use notes when known
4. Select the handoff candidate:
   - record selection reasons
   - record rejected candidates and rejection reasons
   - record confidence and downstream assembly warnings
   - preserve `sourceVariant`, `targetVariant`, and `variantScope`
5. Verify and record:
   - regenerate candidate metadata, preview, validation report, and catalog when the selection changes
   - validate the source-stage manifest after publication
   - update the source report with selected candidate, alternatives considered, rejected candidates, confidence, limitations, and next trigger
6. Stop with one explicit outcome:
   - `success`: selected candidates are ranked, validated, previewed, and recorded
   - `clean no-op`: existing ranked candidates and alternatives are still current
   - `approval-required`: source handoff is complete and needs owner review before assembly
   - `blocked`: no credible candidate exists for a required category or source access is unavailable
   - `no-progress`: repeated source discovery does not improve confidence or evidence

#### Safety checks

- Do not claim a source candidate is production-correct unless model-specific reference evidence supports it.
- Do not fabricate missing geometry or animation relationships during sourcing.
- Do not treat a keyword match as a cockpit-component match without preview or hierarchy evidence.
- Do not use one source candidate per category by default; either compare alternatives or explain why no viable alternative was found.
- Do not let a high-confidence visual candidate override variant, licensing, or runtime-contract warnings.

### Source Review Gate

Required before Agent 2:

- reference-authority note consumed
- component catalog
- source candidate ranking with selected and rejected candidates
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

Agent 2 must also publish a runtime contract checklist:

- root object and scene group
- stable runtime object names
- hierarchy changes
- pivots and local axes
- scale and camera assumptions
- `game_id` values and interaction metadata
- animation tracks, if any
- expected HTML-accessible equivalent for every required interaction
- forbidden variant-mixing notes
- GLB reimport result

Runtime contract artifacts should be JSON and validate with:

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract <path>
```

### Materials And Optimization Review Gate

Required before browser integration or production promotion:

- shaded `.blend`
- shaded `.glb`
- material recipes
- material assignment report
- texture and bake report
- validation report
- optimization decision record
- object count, material count, texture sizes, and GLB size
- comparison contact sheet
- human `shading-approval.json`

Agents may mark their stage complete. They must not mark their own work approved.

Material and optimization artifacts should be JSON and validate with:

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization <path>
```

### Windows Browser Integration Gate

Required after Agent 3 and before production promotion:

- Ubuntu PR or stage report identifies the final GLB path and runtime contract checklist
- Windows branch starts from current `origin/main`
- React loader consumes only documented asset contracts
- asset loads in the real browser scene
- expected runtime node names and `game_id` values are found
- required 3D actions have native HTML equivalents
- success, wrong answer, repeated wrong answer, hint, reload, keyboard, and reduced-motion paths are checked where relevant
- approximately 375, 768, and 1440 px screenshots are captured
- Model Y spoiler-protection is checked
- `npm run check`, relevant e2e/browser checks, and `npm run assets:check` are run or explicitly recorded as blocked

The Ubuntu pipeline produces assets and evidence. Windows decides whether the runtime integration is complete.

Browser integration artifacts should be JSON and validate with:

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration <path>
```

Before opening a milestone PR, run the deterministic workflow evals:

```bash
npm run pipeline:evals
```

## Branch and worktree rules

Use separate branches per stage and batch.

Do not do new milestone or gate work directly on `main`. Create a branch such as `codex/<short-description>` or `asset/<stage-batch>`, commit only owned-path changes for that scope, push, and open a draft PR with the commands actually run and any owner approval still required.

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

Runtime contracts must not be inferred from screenshots. They need a machine-readable report or manifest entry plus a GLB reimport check.

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
