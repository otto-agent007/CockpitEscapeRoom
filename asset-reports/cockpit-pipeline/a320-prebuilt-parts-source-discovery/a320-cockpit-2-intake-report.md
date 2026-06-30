# A320 Cockpit 2 Source Intake Report

## Outcome

Status: `downloaded-for-source-inspection`

The owner downloaded the approved Sketchfab `A320 Cockpit 2` candidate through the browser and placed the original archive in the cockpit pipeline cache. This is an Agent 1 source-intake artifact only. No archive contents were committed, no Blender import was run, no Agent 2 assembly was started, and no deployable GLB was produced or replaced.

## Candidate

- Candidate ID: `a320-prebuilt-sketchfab-a320-cockpit-2`
- Job ID: `a320-prebuilt-parts-source-discovery`
- Source page: `https://sketchfab.com/3d-models/a320-cockpit-2-5fb0c671a91042c1a9d8f2cf3e2df021`
- Author: `davidmarton1987`
- License lead: Creative Commons Attribution 4.0
- Required credit: author attribution is required before any shared or published use
- Owner approval: `art-source/cockpit-pipeline/jobs/a320-prebuilt-parts-source-discovery/download-approval-a320-cockpit-2.json`

## Cached Package

- Cache path: `.cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip`
- Archive type: Zip archive
- Archive size: `17,398,950` bytes
- SHA-256: `1f7ec972d2a34c24b1df574142c40659cb294d372ac7e3c2cd64f9d7d69f65d4`
- Integrity check: `unzip -t` passed with no compressed data errors

## Package Contents

The archive contains a glTF package:

- `license.txt`
- `scene.gltf`
- `scene.bin`
- `textures/`
- 11 texture image files

The package contents list reports 15 zip entries with an uncompressed total of `44,160,276` bytes.

## glTF Metadata

- Generator: `Sketchfab-16.56.0`
- glTF version: `2.0`
- Scenes: `1`
- Nodes: `619`
- Meshes: `135`
- Mesh primitives: `135`
- Materials: `13`
- Textures: `11`
- Images: `11`
- Animations: `0`
- Skins: `0`
- Cameras: `0`
- Extensions used: `KHR_materials_transmission`

## Source Limitations

- This is a prebuilt Sketchfab model, not primary aircraft reference authority.
- It can be used as an Airbus A320 cockpit base candidate only after source approval and Blender import inspection.
- It must be compared against A320-specific reference evidence before any production geometry decision.
- It has no embedded animation tracks and no cameras.
- Agent 2 assembly remains blocked until a human `source-approval.json` exists for the imported and inspected source package.

## Commands Run

```bash
git status --short --branch
find .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2 -maxdepth 2 -type f -printf '%TY-%Tm-%Td %TH:%TM:%TS\t%s\t%p\n' | sort
sha256sum .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip
file .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip
du -h .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip
unzip -l .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip
unzip -t .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip
unzip -p .cache/cockpit-pipeline/sources/a320-prebuilt-parts-source-discovery/a320-cockpit-2/a320_cockpit_2.zip license.txt
python3 - <<'PY'
...
PY
```

## Next Required Approval

Next step: owner review of this downloaded source package as an Agent 1 intake artifact.

Required before Agent 2: source approval after Blender import inspection records hierarchy, pivots, scale, material/texture condition, real-reference comparison notes, and candidate suitability. Do not start assembly from this archive alone.
