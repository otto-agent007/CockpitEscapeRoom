# Asset pipeline

CockpitEscapeRoom uses a controlled asset flow:

```text
references and owner intent
-> reference authority gate
-> Tripo AI candidate generation when useful
-> Blender import, inspection, cleanup, naming, pivots, optimization
-> official Blender MCP inspection or controlled edits when useful
-> GLB export and validation
-> React Three Fiber integration
-> browser, viewport, accessibility, and spoiler checks
```

Tripo AI and Blender MCP are production aids. They are not story canon, visual approval authority, or replacements for aircraft-specific references.

## Pipeline gates

Asset work moves through explicit gates:

1. **Reference Authority:** define the target scene group, aircraft/object identity, variant status, allowed source usage, forbidden usage, and owner approval state.
2. **Sourcing:** discover or generate candidates, including Tripo proxies, with selected and rejected options documented.
3. **Assembly:** import approved candidates into Blender, repair pivots, assign stable names, preserve hierarchy, and publish a runtime contract checklist.
4. **Materials and Optimization:** apply materials, bake textures where useful, record material counts and texture sizes, and optimize only when runtime contracts still pass.
5. **Browser integration:** load the approved GLB in React, verify node names and `game_id` metadata, test HTML-accessible equivalents, capture viewport screenshots, and rerun relevant app checks.

No gate may approve its own work. Completion means evidence is ready for the next gate; approval requires the recorded owner or receiving-workstream decision.

Gate evidence should be machine-readable before it is treated as handoff-ready. The cockpit pipeline CLI validates the current structured gate artifacts:

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/examples/agent0-dc9-reference-authority.example.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/examples/agent2-runtime-contract.example.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/examples/agent3-material-optimization.example.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/examples/windows-browser-integration.example.json
```

Agent workflow guardrails are also tested with deterministic fixtures:

```bash
npm run pipeline:evals
```

The eval fixtures cover known failure modes: Tripo candidates promoted beyond proxy use, Agent 2 starting without Agent 0 authority, Agent 3 destructive optimization breaking runtime contracts, Airbus/DC-9 detail mixing, and Model Y spoiler leaks before Captain Mode completion.

## Scene groups

Keep generated assets separated by scene group:

- Airbus A320 Pop T Captain cockpit
- Locker room scene
- DC-9 First-Officer cockpit
- Memphis legacy departure environment
- Model Y hangar reward
- Mars Easter egg

Do not mix Airbus and DC-9 aircraft-specific details. The Airbus cockpit must remain a separate model-specific asset, and the DC-9 cockpit must stay model-correct in major visible geometry. Tripo-generated parts may help explore shape, scale, or prop options, but they may not silently override approved aircraft reference boards.

The active aircraft seat contract is DC-9 first officer/right seat and Airbus A320 Pop T captain/left seat. Build the DC-9 from `art-source/blender/dc9_master.blend` into `public/models/dc9-cockpit.glb`; build the separate Memphis view from `art-source/blender/dc9-memphis-legacy-departure.blend` into `public/models/dc9-memphis-legacy-departure.glb`; build the Airbus from the authoritative shaded source into `public/models/airbus-captain.glb`. Runtime camera, environment-anchor, and target contracts are defined in `docs/ASSET_CONTRACT.md`.

## Tripo AI candidate rules

Tripo outputs are candidates or proxies until inspected, cleaned, optimized, and approved.

For owner-supplied Tripo props, follow [`../TripoAssetLessons.md`](../TripoAssetLessons.md). New runtime candidates must contain a complete 4096×4096 BaseColor, Normal, and metallic-roughness source set. This is an intake requirement; deployable texture resolution remains a per-prop browser decision.

Before any Tripo-generated asset reaches runtime use:

1. Import it into the relevant Blender master or staging file.
2. Place it under the correct scene group and root hierarchy.
3. Replace generated names with stable, descriptive object names.
4. Check pivots, local axes, scale, transforms, and interaction travel.
5. Record material count, texture dimensions, file size, and known defects.
6. Reduce unnecessary geometry, materials, and texture size before GLB export.
7. Add required custom properties such as `game_id` only after the object contract is stable.
8. Document the candidate, cleanup decisions, validation output, and preview renders in `asset-reports/`.

Generated assets must not be copied directly into `public/models/`. A deployable GLB is produced only through the Blender validation and export path.

## Blender MCP rules

The official Blender MCP may be used for scene inspection, controlled cleanup, validation support, naming checks, pivot checks, metadata review, preview-render evidence, and export support.

Use Blender MCP for bounded operations with clear target objects or scene groups. Do not use it for uncontrolled broad rewrites of approved scenes, arbitrary scene-wide edits, or changes that bypass the existing Blender scripts and asset reports.

Every MCP-assisted asset pass should record:

- Blender version and source `.blend` file.
- MCP operation summary and affected scene group.
- Preview render paths under `preview-renders/` when visual evidence is relevant.
- Object count, material count, texture sizes, and GLB size when available.
- Validation warnings and known deviations from the approved reference set.
- Whether the output is a proxy, candidate, blockout, or approved production asset.

## Runtime contract checklist

Before a GLB is handed to the React workstream, record:

- scene group and root object
- stable runtime node names
- hierarchy changes
- pivots and local axes
- scale and camera assumptions
- `game_id` values and interaction metadata
- animation tracks, if any
- expected HTML or equivalent accessible control for every required 3D action
- material count, texture sizes, GLB size, and optimization decisions
- GLB reimport validation result
- known aircraft-reference deviations

The Blender GLB exporter writes `.cache/assets/<asset>/export-contract-report.json` through the asset build scripts. That report records the export settings that affect runtime contracts, including `export_extras: true`, selection-only export, animations, cameras, lights, selected object count, and any exported `game_id` nodes.

## Export and integration

Production exports continue to use the repository asset commands:

```bash
npm run asset:dc9
npm run asset:dc9-memphis
npm run asset:airbus
npm run asset:airbus:promote-gate
npm run asset:tesla
npm run asset:locker
npm run assets:check
```

The Memphis source intake is additionally guarded by:

```bash
npm run asset:dc9-memphis:intake
```

That contract accepts only the owner-approved Ted Davis Concourse B objects and three selected terminal textures, preserves the private noncommercial permission basis and attribution, and rejects bundled aircraft, AutoGate, OpenSceneryX, and unrelated scenery content.

Run `asset:airbus:promote-gate` only after the durable 1440x900 initial and dragged-look captain-view captures exist. It regenerates the current deployable gate from `public/models/airbus-captain.glb` and those evidence files. The older A320 assembly job writes its own assembly-stage contract and cannot overwrite this deployable gate.

`npm run asset:locker` also runs the deterministic locker prop importer before validation/export. It preserves configured downloads, verifies immutable source hashes, and rejects Tripo candidates that fail the 4K source gate.

The GLB contract remains stable names, preserved hierarchy, correct pivots, local axes, animations, materials, and exported custom properties. React integration should consume only documented asset contracts and must provide native HTML or equivalent accessible controls for required 3D interactions.

Model Y spoiler protection still applies: no Model Y asset, thumbnail, loading copy, menu entry, early achievement, or hint may reveal the reward before Pop T Captain Mode is complete.

## Workspace boundaries

The former Windows/Ubuntu path ownership split is retired. Browser and asset work may happen in the same workspace when the milestone requires it.

Generated deployable GLBs still belong under `public/models/**`, editable Blender sources and staged pipeline outputs stay under `art-source/**`, and browser integration stays in `src/**`/`e2e/**`. Keep the asset contract, source/license manifest, reports, app code, screenshots, and `TEST_REPORT.md` consistent in the same change.

## Execution loop

For asset workflow changes, repeat:

**orient -> plan -> implement a small checkpoint -> validate -> inspect in Blender or the browser -> review the diff -> repair -> record evidence -> repeat**

Do not claim asset approval from source code alone. Approval evidence must include Blender inspection or browser verification appropriate to the change.
