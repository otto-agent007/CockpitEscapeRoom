# Airbus A320 Prebuilt Parts Source Job Report

## Purpose

Run Agent 1 sourcing for reusable Airbus A320 cockpit component candidates with a free/open-first policy.

This pass did not download assets, inspect package contents, import into Blender, or create GLBs.

## Fresh state

- Branch: `codex/asset-workflow-health-rehearsal`
- Job: `art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/job.json`
- Source authority: `art-source/cockpit-pipeline/gates/agent0-airbus-a320-prebuilt-parts-authority.json`
- Source seed: `art-source/cockpit-pipeline/source-discovery-seeds/a320-prebuilt-parts-source-discovery.seed.json`

## Source pools searched

- Sketchfab downloadable/free A320 cockpit meshes and chair candidates.
- GitHub/FlightGear A320-family source packages.
- Printables A320 home-cockpit FCU, EFIS, pedestal, RMP, transponder, and knob parts.
- Thingiverse A320 sidestick and simulator-mount parts.

## Candidate leads recorded

- `https://sketchfab.com/3d-models/a320-cockpit-2-5fb0c671a91042c1a9d8f2cf3e2df021`
- `https://sketchfab.com/3d-models/a320-200-cockpit-75621962dfca454597d36e9a54e1f9ea`
- `https://sketchfab.com/3d-models/a320-part-cockpit-a31a149df8f344ca9a688dbc07b9f4df`
- `https://sketchfab.com/3d-models/a320-airbus-pilot-chair-267be1d8701e4db2b0b19b0d1f5f6f99`
- `https://github.com/FGDATA/IDG-A32X`
- `https://www.printables.com/search/models?q=A320%20FCU`
- `https://www.printables.com/search/models?q=A320%20pedestal`
- `https://www.thingiverse.com/search?q=A320+sidestick`

## Validation evidence

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/agent0-airbus-a320-prebuilt-parts-authority.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/job.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/manifests/sourcing-complete.json` - pass, hashes verified.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass, 7 tests.
- `npm run pipeline:evals` - pass, 6/6.
- `npm run references:validate` - pass, 24 references.

## Result

`sourcing_complete`, not source-approved. Human review is required before downloading any candidate, adding source manifest records, importing into Blender, or allowing Agent 2 assembly.
