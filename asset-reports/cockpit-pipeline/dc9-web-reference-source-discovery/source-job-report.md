# DC-9-50 Web Reference Source Job Report

## Purpose

Run Agent 1 sourcing for the DC-9 Pop T Captain cockpit with web search enabled, without downloading media or producing geometry.

## Fresh state

- Job: `art-source/cockpit-pipeline/jobs/dc9-web-reference-source-discovery/job.json`
- Source authority: `art-source/cockpit-pipeline/gates/agent0-dc9-web-reference-authority.json`
- Source seed: `art-source/cockpit-pipeline/source-discovery-seeds/dc9-web-reference-source-discovery.seed.json`

## Commands and checks

Validation was run after artifact creation:

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/agent0-dc9-web-reference-authority.json`
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/dc9-web-reference-source-discovery/job.json`
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-web-reference-source-discovery/manifests/sourcing-complete.json`
- `npm run references:validate`

## Web sources inspected

- Wikimedia Commons category `Cockpits of Douglas DC-9`: mixed DC-9 cockpit candidate index.
- Wikimedia Commons file `McDonnell Douglas DC-9-51 cockpit (2586378690).jpg`: strongest current captain-view compatibility photo.
- Wikimedia Commons file `DC-9 Cockpit.jpg`: Northwest DC-9-40 compatibility photo.
- Wikimedia Commons file `SAS DC-9, Interior, cockpit.jpg`: same-family wide cockpit photo with public-domain lead.
- GitHub repository `FGMEMBERS-NONGPL/DC-9-32`: existing buildable DC-9-32 source package already used by the repo pipeline.
- Sketchfab model `McDonnell Douglas DC-9-50` by OUTPISTON: target-variant shell/proxy lead only.
- Sketchfab model `mcdonnell douglas dc-9` by 1883: rejected generic exterior lead.

## Files generated

- `art-source/cockpit-pipeline/gates/agent0-dc9-web-reference-authority.json`
- `art-source/cockpit-pipeline/source-discovery-seeds/dc9-web-reference-source-discovery.seed.json`
- `art-source/cockpit-pipeline/jobs/dc9-web-reference-source-discovery/job.json`
- `art-source/cockpit-pipeline/stages/source/output/dc9-web-reference-source-discovery/component-catalog.json`
- `asset-reports/cockpit-pipeline/dc9-web-reference-source-discovery/source-candidate-ranking.md`
- `asset-reports/cockpit-pipeline/dc9-web-reference-source-discovery/source-job-report.md`
- `art-source/cockpit-pipeline/jobs/dc9-web-reference-source-discovery/manifests/sourcing-complete.json`

## Result

`sourcing_complete`, not source-approved. Human review is required before downloading new candidate images, adding manifest entries, approving source inputs, or starting Agent 2 assembly.
