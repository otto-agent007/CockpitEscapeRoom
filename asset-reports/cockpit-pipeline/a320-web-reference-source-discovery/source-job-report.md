# Airbus A320 Web Reference Source Job Report

## Purpose

Run Agent 1 sourcing for the Airbus A320 First-Officer cockpit with web search enabled, without downloading copyrighted media or producing geometry.

## Fresh state

- Branch: `codex/asset-workflow-health-rehearsal`
- Job: `art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/job.json`
- Source authority: `art-source/cockpit-pipeline/gates/agent0-airbus-a320-web-reference-authority.json`
- Source seed: `art-source/cockpit-pipeline/source-discovery-seeds/a320-web-reference-source-discovery.seed.json`

## Commands and checks

Validation was run after artifact creation:

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/agent0-airbus-a320-web-reference-authority.json`
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/job.json`
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/manifests/sourcing-complete.json`
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests`
- `npm run pipeline:evals`
- `npm run references:validate`

## Web sources inspected

- Airbus official cockpits page: official A320-family cockpit/commonality context.
- Wikimedia Commons category `Cockpits of Airbus A320 family`: broad A320-family index.
- Wikimedia Commons category `Cockpits of Airbus A320`: A320-specific candidate index.
- Wikimedia Commons file `EasyJet airbus A320 cockpit.jpg`: real A320 cockpit photo candidate with CC BY 4.0 lead.
- Wikimedia Commons file `Airbus A320 Glass Cockpit.jpg`: simulator cockpit, CC BY 2.0 lead, rejected for geometry authority.
- FlyByWire A32NX flight deck overview: simulator documentation, orientation only.

## Files generated

- `art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/job.json`
- `art-source/cockpit-pipeline/stages/source/output/a320-web-reference-source-discovery/component-catalog.json`
- `asset-reports/cockpit-pipeline/a320-web-reference-source-discovery/source-candidate-ranking.md`
- `asset-reports/cockpit-pipeline/a320-web-reference-source-discovery/source-job-report.md`
- `art-source/cockpit-pipeline/jobs/a320-web-reference-source-discovery/manifests/sourcing-complete.json`

## Result

`sourcing_complete`, not source-approved. Human review is required before downloading any candidate images, approving a reference board, or starting Agent 2 assembly.
