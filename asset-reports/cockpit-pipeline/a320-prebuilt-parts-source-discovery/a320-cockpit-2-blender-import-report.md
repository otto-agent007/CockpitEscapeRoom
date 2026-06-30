# A320 Cockpit 2 Blender Import Report

## Outcome

Status: `imported-for-agent1-inspection`

The owner-approved Sketchfab `A320 Cockpit 2` zip was extracted only under `.cache`, imported into Blender 5.1.2, rooted under `AIRBUS_A320_SOURCE_CANDIDATE_ROOT`, rendered once for visual inspection, and saved as a cache-only inspection `.blend`.

This report does not approve Agent 2 assembly. No deployable GLB was produced or replaced.

## Evidence

- Source archive: `.cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip`
- Source archive SHA-256: `1f7ec972d2a34c24b1df574142c40659cb294d372ac7e3c2cd64f9d7d69f65d4`
- Extracted glTF: `.cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/extracted/a320_cockpit_2/scene.gltf`
- Inspection blend: `.cache/cockpit-pipeline/inspection/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320-cockpit-2-import-inspection.blend`
- Preview render: `preview-renders/cockpit-pipeline/a320-prebuilt-parts-source-discovery/a320-cockpit-2-import-cockpit-view.png`
- Machine report: `asset-reports/cockpit-pipeline/a320-prebuilt-parts-source-discovery/a320-cockpit-2-blender-import-report.json`

## Blender Import Stats

- Blender version: `5.1.2`
- Root object: `AIRBUS_A320_SOURCE_CANDIDATE_ROOT`
- Object count: `620`
- Mesh count: `135`
- Empty count: `485`
- Triangle count: `537334`
- Material count: `13`
- Image count reported by Blender: `12`
- Animation count: `0`
- Unapplied transform object count: `0`
- Bounding box size: `8.670645 x 9.138844 x 3.000001`

## Visual Review

The generated preview uses a cockpit-focused camera aimed at the aircraft nose/window area to approximate the useful Sketchfab cockpit-facing view. It is still an exterior-window view, not a confirmed cockpit-interior base. The asset imported cleanly and may be useful as a presentation or exterior/cockpit-window source candidate, but it should not be promoted as the Airbus A320 cockpit interior base without owner review and a closer inspection pass proving usable interior geometry exists.

Object and mesh names are generic Sketchfab import names such as `Sketchfab_model` and `Object_0`, so a future assembly pass would need cleanup, stable naming, and cockpit-specific hierarchy work before any runtime contract exists.

## Commands Run

```bash
python3 -m tools.blender.cockpit_pipeline.preflight
python3 -m tools.blender.cockpit_pipeline.pipeline_cli import-a320-source-candidate
```

## Next Required Approval

Outcome: `approval-required`.

Owner review is required before this asset can be treated as source-approved for any Agent 2 assembly step. If approved for continued use, the next bounded Agent 1 action should be a cockpit-interior focused inspection pass that identifies whether the imported source actually contains usable A320 cockpit interior components.
