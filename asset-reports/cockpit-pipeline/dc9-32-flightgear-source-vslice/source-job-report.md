# FlightGear DC-9-32 Source Job Report

## Branch And Source

- Branch: `asset/dc9-vslice-source`
- Source URL: `https://github.com/FGMEMBERS-NONGPL/DC-9-32.git`
- Resolved commit: `d79e1476ce452a96126cc569a9c8a5d9fe705c8f`
- Cached source path: `.cache/cockpit-pipeline/sources/DC-9-32`
- Source variant: `DC-9-32`
- Target variant: `unresolved`
- Job stage: `sourcing_complete`

## Commands Run

| Command | Result |
|---|---|
| `python3 -m tools.blender.cockpit_pipeline.preflight` | Pass |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pass, 5 tests |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from requested --to sourcing_complete` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from sourcing_complete --to assembly-approved` | Expected fail |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-source-job` | Pass, repeated |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/job.json` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/manifests/sourcing-complete.json` | Pass |

## Format Inventory

- `.ac`: 24
- `.xml`: 45
- `.png`: 41
- `.rgb`: 25
- `.jpg`: 1
- `.obj`: 0
- `.gltf`: 0
- `.glb`: 0
- `.fbx`: 0

Unsupported or non-ingested formats are reported in `source-inventory.json`: `.0`, `.md`, `.nas`, `.rgb`, `.wav`, `.xcf`.

## Import Route

No configured Blender AC3D importer was callable in this Blender installation. The source job uses a narrow internal AC3D data importer for `.ac` files and treats downloaded repository files as data only. No downloaded scripts, add-ons, shell commands, Nasal scripts, or Python files were executed.

## Candidate Count By Category

- `large_cockpit_gauge`: 1
- `switch_cluster`: 1
- `throttle_assembly`: 1
- `yoke_assembly`: 1

## Generated Files

- Job: `art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/job.json`
- Manifest: `art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/manifests/sourcing-complete.json`
- Catalog: `art-source/cockpit-pipeline/stages/source/output/dc9-32-flightgear-source-vslice/component-catalog.json`
- Inventory: `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/source-inventory.json`
- XML report: `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/xml-reference-report.json`
- Extraction report: `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/extraction-report.json`
- Validation report: `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/validation-report.json`
- Contact sheet: `preview-renders/cockpit-pipeline/dc9-32-flightgear-source-vslice/component-contact-sheet.svg`

Each candidate has a standalone GLB, metadata JSON, validation JSON, and neutral preview PNG under the job-specific source output and preview directories.

## Reimport Validation

All four exported GLBs reimported into a clean Blender scene with nonzero mesh counts and dimensions matching pre-export source dimensions.

## Visual Review

The generated previews were inspected. The import proof, yoke, throttle, large gauge, and switch cluster are nonblank and correspond to the requested source categories.

## Known Limitations

- This is source extraction only. The candidates are not source-approved and are not ready for assembly.
- The source is DC-9-32; target variant remains unresolved.
- The ABS switch cluster is lower confidence because no explicit XML animation was found for `SwABS`.
- The switch cluster source objects are spatially sparse in preview, which should be reviewed before assembly.
- RGB textures were inventoried but not converted during this task.
- The disposable Blender inspection scene lives under cache and is not tracked.

## Reproduce

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-source-job
```
