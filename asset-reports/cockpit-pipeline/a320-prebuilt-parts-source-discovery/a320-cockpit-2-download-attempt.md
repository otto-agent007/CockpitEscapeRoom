# A320 Cockpit 2 Download Attempt

## Candidate

- Candidate ID: `a320-prebuilt-sketchfab-a320-cockpit-2`
- Source page: `https://sketchfab.com/3d-models/a320-cockpit-2-5fb0c671a91042c1a9d8f2cf3e2df021`
- Sketchfab API: `https://api.sketchfab.com/v3/models/5fb0c671a91042c1a9d8f2cf3e2df021`
- Download API: `https://api.sketchfab.com/v3/models/5fb0c671a91042c1a9d8f2cf3e2df021/download`

## Owner decision

Owner approved this top-ranked candidate as the A320 base cockpit candidate for download and cache-only inspection.

Approval record:

- `art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/download-approval-a320-cockpit-2.json`

## Metadata verified

Sketchfab public metadata API returned:

- Name: `A320 Cockpit 2`
- Author: `davidmarton1987`
- License: Creative Commons Attribution / CC BY 4.0
- License requirement: author credit required, commercial use allowed
- Face count: `537648`
- Created: `2024-11-24T17:26:13.005818`
- Published: `2024-11-24T17:32:03.119917`

## Download result

Initial API attempt blocked. The official Sketchfab download API returned:

```text
HTTPError HTTP Error 401: Unauthorized
```

The browser-style `/download` page returned an HTML/challenge response and did not expose a model archive. No model archive, extracted model file, texture, Blender file, GLB, or runtime asset was downloaded or committed.

## Browser download follow-up

The owner completed the download through the browser and placed the original archive in the configured cache path:

- `.cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip`

Tracked intake evidence:

- `asset-reports/cockpit-pipeline/a320-prebuilt-parts-source-discovery/a320-cockpit-2-intake-report.md`

## Next step

Inspect the downloaded package through the Agent 1 import/inspection path if the owner approves that bounded action. Keep the archive under `.cache/cockpit-pipeline`, preserve the original zip, and do not start Agent 2 assembly until source approval exists.
