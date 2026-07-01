# Airbus A320 Cockpit 2 Assembly Report

## Branch And Stage

- Branch: `codex/asset-workflow-health-rehearsal`
- Commit: `4fa1fdb622e49ef806a02c89aa6731a5dfb113bd`
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
- Preview renders:
  - `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/captain-seat-view.png`
  - `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/dashboard-screens-view.png`

## Assembly Work

- Removed only the known oversized exterior shell and confirmed camera-blocker objects from the inspected source.
- Preserved the previously over-culled interior source objects (`Object_55` and `Object_56`) so the seats, floor/rear shell, and side interior candidates remain available for review.
- Created `AIRBUS_ROOT` and stable Airbus grouping nodes for static geometry, display candidates, interactive candidates, locators, colliders, and puzzle props.
- Renamed imported mesh nodes with stable, semantic `AIRBUS_A320_*` prefixes such as seat, sidewall, floor, pedestal, and display-panel roles while preserving original generic Sketchfab source node names in custom properties.
- Added basic `game_id` metadata to root, groups, locators, and classified meshes.
- Exported a neutral GLB with `export_extras=True`.

## Sketchfab 360 Interior Evidence

- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-360-interior/front-panel-between-seats-final-render.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-360-interior/down-seats-pedestal-final-render.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-360-interior/left-seat-sidewall-final-render.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-360-interior/right-seat-sidewall-final-render.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-360-interior/up-overhead-final-render.png`

## Validation Results

- Status: `pass`
- Object count: `621`
- Mesh count: `127`
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
