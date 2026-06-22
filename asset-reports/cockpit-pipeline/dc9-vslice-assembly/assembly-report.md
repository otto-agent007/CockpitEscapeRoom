# DC-9 Vertical Slice Assembly Report

## Branch And Stage

- Branch: `asset/dc9-vslice-assembly`
- Commit: `71b067de349574e4a0304aa12b68a83c20ff4a94`
- Source job: `dc9-32-flightgear-source-vslice`
- Assembly job: `dc9-vslice-assembly`
- Stage: `assembly_complete`
- Source variant: `DC-9-32`
- Target variant: `unresolved`

## Commands Run

| Command | Result |
|---|---|
| `python3 -m tools.blender.cockpit_pipeline.preflight` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/manifests/sourcing-complete.json` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-assembly-job` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-vslice-assembly/manifests/assembly-complete.json` | Pass |

## Approved Components

- `dc9-src-yoke-assembly-001` (yoke_assembly)
- `dc9-src-throttle-assembly-001` (throttle_assembly)
- `dc9-src-large-gauge-001` (large_cockpit_gauge)
- `dc9-src-switch-cluster-001` (switch_cluster)

## Generated Files

- Layout: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/assembly/input/dc9-vslice-assembly/layout.json`
- Blend: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/assembly/output/dc9-vslice-assembly/dc9-vslice-assembly.blend`
- GLB: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/assembly/output/dc9-vslice-assembly/dc9-vslice-assembly.glb`
- Node and pivot report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/assembly/output/dc9-vslice-assembly/node-pivot-report.json`
- Validation report: `/mnt/2TBHDD/CockpitEscapeRoom/art-source/cockpit-pipeline/stages/assembly/output/dc9-vslice-assembly/validation-report.json`
- Preview directory: `/mnt/2TBHDD/CockpitEscapeRoom/preview-renders/cockpit-pipeline/dc9-vslice-assembly`

## Pivot Repairs

Each component uses a runtime parent pivot empty recorded in layout JSON. Source child hierarchy is preserved beneath the pivot empty.

## Validation Results

- Status: `pass`
- Component count: `4`
- Object count: `57`
- Mesh count: `42`
- Reimport status: `pass`
- Source inputs immutable: `True`

## Known Limitations

- Layout transforms are placeholders pending model-correct DC-9 cockpit measurements.
- Neutral materials only; Agent 3 owns shading.
- The switch cluster remains lower confidence from Agent 1 and needs human review.
- This GLB is not a production asset and was not written to `public/models/**`.

## Diff Review

Changes are limited to Ubuntu-owned pipeline, assembly output, reports, and preview paths.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-assembly-job
```
