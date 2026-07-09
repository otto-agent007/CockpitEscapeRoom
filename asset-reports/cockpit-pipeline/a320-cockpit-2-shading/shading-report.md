# Airbus A320 Cockpit 2 Shading Report

## Branch And Stage

- Branch: `agent/a320-cockpit-production-lighting`
- Commit: `9cc4d186522ceafca94def7a131f2acc6a39d3fc`
- Assembly job: `a320-cockpit-2-assembly`
- Shading job: `a320-cockpit-2-shading`
- Stage: `shading_complete`
- Source variant: `prebuilt-free-open-leads`
- Target variant: `Airbus A320`
- Variant scope: `target-confirmed`

## Bounded Action

Agent 3 consumed the owner-approved A320 Agent 2 assembly and applied a source-parity material pass. The pass preserves the downloaded Sketchfab material texture links and UV layout, maps portable PBR scalar values when cached material-channel summaries are present, then records semantic material roles for later optimization. It does not write to `public/models/**`, does not modify browser/runtime code, does not join meshes, and does not run destructive GLB optimization.

When extracted Sketchfab viewer settings are present, this revision also consumes them to improve Blender review parity: Studio background color, directional light colors/intensities/transforms, ambient occlusion/reflection render settings where Blender exposes them, the saved Sketchfab camera, matcap/reflection evidence recorded as material metadata, and restrained display emission. This run records only the available source inspector reference renders and generated approval previews as evidence.

The final shaded blend keeps the compound cockpit shell, seats, and sidewall chunks visible. The older captain comparison previews still hide those chunks for historical camera comparison only; the new owner approval cameras and saved `.blend` do not hide them, because this asset is intended to render from inside the cockpit.

This pass also performs a conservative zoom-out cleanup before export. It quarantines only high-confidence generic source fragments into `A320_QUARANTINE_LOOSE_PARTS_REVIEW`, keeps them hidden in the saved `.blend` for auditability, and excludes them from the deployable GLB. Seat, side-console, display, panel, and named cockpit geometry is preserved.

## Reference Evidence Used

- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/no-post-processing.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/base-color.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/matcap.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/wireframe.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/uv-checker.png`

## Material Recipes

- `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/shading/input/a320-cockpit-2-shading/material-recipes.json`

## Material Role Mapping

- `a320_control_dark_plastic`: `46` objects
- `a320_dark_panel_plastic`: `1` objects
- `a320_display_glass`: `40` objects
- `a320_preserve_source_pbr`: `23` objects
- `a320_soft_trim_fabric`: `15` objects

## Texture Inventory

- Texture count: `11`
- Source texture preservation: `True`
- Source texture links preserved: `True`
- Source texture link count: `11`

## Loose-Part Cleanup

- Cleanup report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/loose-part-review-report.json`
- Quarantined object count: `4`
- Quarantined objects:
- `AIRBUS_A320_STATIC_119_OBJECT_93_001`
- `AIRBUS_A320_STATIC_120_OBJECT_94`
- `AIRBUS_A320_STATIC_121_OBJECT_95`
- `AIRBUS_A320_STATIC_122_OBJECT_96_001`

## Generated Files

- Shaded blend: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`
- Shaded GLB: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.glb`
- Material assignment report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/material-assignment-report.json`
- Loose-part review report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/loose-part-review-report.json`
- Texture inventory report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/texture-inventory-report.json`
- Validation report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/validation-report.json`
- Preview directory: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/a320-cockpit-2-shading`
- Sketchfab comparison contact sheet: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-source-parity-contact-sheet.png`
- Complete interior approval render: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/a320-cockpit-2-shading/complete-interior-approval.png`
- First Officer approval render: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/a320-cockpit-2-shading/first-officer-approval.png`


## Validation Results

- Status: `pass`
- Runtime node names preserved: `True`
- `game_id` metadata preserved: `True`
- UV layers preserved: `True`
- Source texture links preserved: `True`
- Loose fragments quarantined: `4`
- Reimport status: `pass`
- Dimension drift max meters: `0.0`
- Approved assembly inputs immutable: `True`
- Destructive optimization used: `False`

## Known Limitations

- This is a material/optimization handoff for a prebuilt A320 cockpit source, not final browser integration.
- Some source mesh chunks remain compound parts with broad semantic labels; they are preserved for visual completeness and will need finer splitting only where downstream interactions require independent pivots.
- Individual interactive control pivots remain unverified from Agent 2 and are not changed in this pass.
- Display treatment is restrained preview material work; live avionics UI and accessible HTML mirrors remain downstream browser work.
- Human review is required before shaded approval or public model promotion.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job
```
