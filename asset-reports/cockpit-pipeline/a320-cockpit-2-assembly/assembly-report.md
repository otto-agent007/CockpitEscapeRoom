# Airbus A320 Cockpit 2 Assembly Report

## Branch And Stage

- Branch: `codex/asset-workflow-health-rehearsal`
- Commit: `5bda3745ceca0772cd4440edecee8c6c55efe449`
- Source job: `a320-prebuilt-parts-source-discovery`
- Assembly job: `a320-cockpit-2-assembly`
- Stage: `assembly_complete`
- Source variant: `prebuilt-free-open-leads`
- Target variant: `Airbus A320`

## Bounded Action

Agent 2 consumed the owner-approved A320 Cockpit 2 source inspection artifact and produced a neutral assembly handoff. This pass did not run Agent 3 materials/optimization, did not write to `public/models/**`, and did not modify browser/runtime code.

## Generated Files

- Blend: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/assembly/output/a320-cockpit-2-assembly/a320-cockpit-2-assembly.blend`
- GLB: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/assembly/output/a320-cockpit-2-assembly/a320-cockpit-2-assembly.glb`
- Node and pivot report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/assembly/output/a320-cockpit-2-assembly/node-pivot-report.json`
- Validation report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/assembly/output/a320-cockpit-2-assembly/validation-report.json`
- Runtime contract gate: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json`
- Preview directory: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/a320-cockpit-2-assembly`

## Assembly Work

- Removed only the known exterior shell and wall-blocker objects from the inspected source.
- Created `AIRBUS_ROOT` and stable Airbus grouping nodes for static geometry, display candidates, interactive candidates, locators, colliders, and puzzle props.
- Renamed imported mesh nodes with stable `AIRBUS_A320_*` prefixes while preserving original source node names in custom properties.
- Added basic `game_id` metadata to root, groups, locators, and classified meshes.
- Exported a neutral GLB with `export_extras=True`.

## Validation Results

- Status: `pass`
- Object count: `618`
- Mesh count: `125`
- Material count: `13`
- Reimport status: `pass`
- Source inputs immutable: `True`

## Known Limitations

- Individual control pivots are not verified yet; this pass establishes grouping roots and source classification.
- Materials are source/import materials only. Agent 3 owns material cleanup, display treatment, texture sizing, and optimization.
- The GLB is a staged assembly artifact, not a deployable production asset.
- Browser integration remains a separate Windows-owned handoff after later approval.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-assembly-job
```
