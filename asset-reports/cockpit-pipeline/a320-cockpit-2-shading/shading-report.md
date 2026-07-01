# Airbus A320 Cockpit 2 Shading Report

## Branch And Stage

- Branch: `codex/asset-workflow-health-rehearsal`
- Commit: `bf269e3aba1bbab00004cba4f3a34a59225adabe`
- Assembly job: `a320-cockpit-2-assembly`
- Shading job: `a320-cockpit-2-shading`
- Stage: `shading_complete`
- Source variant: `prebuilt-free-open-leads`
- Target variant: `Airbus A320`
- Variant scope: `target-confirmed`

## Bounded Action

Agent 3 consumed the owner-approved A320 Agent 2 assembly and applied a source-parity material pass. The pass preserves the downloaded Sketchfab material texture links and UV layout, then records semantic material roles for later optimization. It does not write to `public/models/**`, does not modify browser/runtime code, does not join meshes, and does not run destructive GLB optimization.

This revision also consumes the extracted Sketchfab viewer settings to improve Blender review parity: Studio background color, three directional light colors/intensities/transforms, ambient occlusion/reflection render settings where Blender exposes them, and restrained display emission. These look-development settings are recorded as preview evidence and are not a shaded-approval or public-model promotion.

## Reference Evidence Used

- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/no-post-processing.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/base-color.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/matcap.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/wireframe.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/uv-checker.png`
- `preview-renders/cockpit-pipeline/a320-prebuilt-parts-source-discovery/a320-cockpit-2-import-captain-seat-view.png`
- `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-viewer-settings.json`
- `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-environment-assets.json`
- `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-material-parity-summary.json`

## Material Recipes

- `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/shading/input/a320-cockpit-2-shading/material-recipes.json`

## Material Role Mapping

- `a320_control_dark_plastic`: `46` objects
- `a320_dark_panel_plastic`: `1` objects
- `a320_display_glass`: `42` objects
- `a320_preserve_source_pbr`: `23` objects
- `a320_soft_trim_fabric`: `15` objects

## Texture Inventory

- Texture count: `11`
- Source texture preservation: `True`
- Source texture links preserved: `True`
- Source texture link count: `11`

## Generated Files

- Shaded blend: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`
- Shaded GLB: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.glb`
- Material assignment report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/material-assignment-report.json`
- Texture inventory report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/texture-inventory-report.json`
- Validation report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/validation-report.json`
- Preview directory: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/a320-cockpit-2-shading`
- Sketchfab comparison contact sheet: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-source-parity-contact-sheet.png`

## Validation Results

- Status: `pass`
- Runtime node names preserved: `True`
- `game_id` metadata preserved: `True`
- UV layers preserved: `True`
- Source texture links preserved: `True`
- Reimport status: `pass`
- Dimension drift max meters: `0.0`
- Approved assembly inputs immutable: `True`
- Destructive optimization used: `False`

## Known Limitations

- This is a material/optimization handoff for a prebuilt A320 cockpit source, not final browser integration.
- Individual interactive control pivots remain unverified from Agent 2 and are not changed in this pass.
- Display treatment is restrained preview material work; live avionics UI and accessible HTML mirrors remain downstream Windows/browser work.
- Human review is required before shaded approval or public model promotion.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job
```
