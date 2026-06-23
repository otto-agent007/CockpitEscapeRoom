# DC-9 Vertical Slice Shading Report

## Branch And Stage

- Branch: `asset/dc9-vslice-shading`
- Commit: `e24cf15518d4942bc26cc4b6a3ab63066997aecd`
- Assembly job: `dc9-vslice-assembly`
- Shading job: `dc9-vslice-shading`
- Stage: `shading_complete`
- Source variant: `DC-9-32`
- Target variant: `unresolved`
- Variant scope: `unknown`

## Commands Run

| Command | Result |
|---|---|
| `python3 -m tools.blender.cockpit_pipeline.preflight` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-shading-job` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-vslice-shading/manifests/shading-complete.json` | Pass |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from assembly-approved --to shading_complete` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from shading_complete --to shading-approved` | Pass |

## Approved Assembly Artifact

- `art-source/cockpit-pipeline/stages/assembly/output/dc9-vslice-assembly/dc9-vslice-assembly.glb`

## Material Recipes

- `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/shading/input/dc9-vslice-shading/material-recipes.json`

## Material Role Mapping

- `dc9_aged_dark_plastic`: `6` objects
- `dc9_black_rubber`: `2` objects
- `dc9_brushed_worn_metal`: `13` objects
- `dc9_cream_stencil`: `12` objects
- `dc9_dark_instrument_panel`: `2` objects
- `dc9_fasteners`: `1` objects
- `dc9_gauge_face`: `1` objects
- `dc9_instrument_glass`: `2` objects
- `dc9_painted_blue_green_gray`: `3` objects

## Baked Texture Outputs

- Texture count: `11`
- Texture directory: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/dc9-vslice-shading/textures`

## Generated Files

- Shaded blend: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/dc9-vslice-shading/dc9-vslice-shaded.blend`
- Shaded GLB: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/dc9-vslice-shading/dc9-vslice-shaded.glb`
- Material assignment report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/dc9-vslice-shading/material-assignment-report.json`
- Texture bake report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/dc9-vslice-shading/texture-bake-report.json`
- Validation report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/builds/shaded/dc9-vslice-shading/validation-report.json`
- Preview directory: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/dc9-vslice-shading`
- Comparison contact sheet: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/dc9-vslice-shading/neutral-vs-shaded-contact-sheet.svg`

## Validation Results

- Status: `pass`
- Runtime node names preserved: `True`
- Interaction metadata preserved: `True`
- Reimport status: `pass`
- Dimension drift max meters: `0.0`
- Approved assembly inputs immutable: `True`

## Known Limitations

- This is a shaded four-component vertical slice, not a full cockpit.
- The FlightGear source switch cluster remains sparse.
- Procedural textures are small deterministic PBR proof textures, not final hand-painted production textures.
- No production model was written to `public/models/**`.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-shading-job
```
