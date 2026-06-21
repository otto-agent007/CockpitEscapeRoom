# DC-9 pipeline proof asset report

Date: 2026-06-21

## Source and output

- Blender source: `art-source/blender/dc9_master.blend`
- Raw export: `.cache/assets/dc9/dc9.raw.glb`
- Deployable GLB: `public/models/dc9-cockpit.glb`
- Approval render: `asset-reports/previews/dc9-captain-approval.png`
- Generated cache reports: `.cache/assets/dc9/validation.json`, `.cache/assets/dc9/glb-validation.md`, `.cache/assets/dc9/glb-inspect.md`

## Blender

- Version: Blender 5.1.2
- Executable used: `/home/user1/.local/bin/blender`
- Scene validation: passed with 0 warnings

## Asset contents

- Scope: proof-of-pipeline blockout only, not final DC-9 art.
- Root: `DC9_ROOT`
- Approval camera: `CAM_DC9_CAPTAIN_APPROVAL`
- Interactive controls:
  - `DC9_SW_LEGACY_POWER_01` -> `dc9.legacy_power.switch01`
  - `DC9_SW_LEGACY_POWER_02` -> `dc9.legacy_power.switch02`
  - `DC9_SW_LEGACY_POWER_03` -> `dc9.legacy_power.switch03`
- Animated gauge node: `DC9_GAUGE_LEGACY_CODE_NEEDLE_01`
- Emissive annunciator: `DC9_ANNUNCIATOR_LEGACY_POWER_01`
- Memphis route card: `DC9_PROP_MEM_ROUTE_CARD_01`

## GLB inspection

- GLB size: 152,296 bytes
- Node count: 44
- Mesh count: 34
- Material count: 8
- Animation count: 1
- Camera count: 1
- Required node check: passed; no required nodes missing.
- Metadata check: `game_id`, `interaction`, and `puzzle_id` extras are present on the switch bank collider, three switches, annunciator, route card, and animated gauge needle.

## Validation output

- `tools/blender/validate_scene.py`: passed with 0 warnings.
- `BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:dc9`: passed end to end.
- `npm run assets:check`: passed.
- Informational validator notices remain for unused generated UV attributes and one empty hierarchy node. These are non-failing glTF validator info messages.

## Blockers and limits

- The local dependency tree initially had an empty `node_modules/.bin`, causing `npx gltf-transform` to fail. `npm rebuild --ignore-scripts --no-audit --no-fund` restored the shims without tracked file changes; the official asset commands pass after that.
- Browser integration is not complete. The current React scene still loads the greybox and has no DC-9 GLB adapter. Implementing that requires changes under `src/`, which is outside this workstation branch scope.
- The DC-9 variant remains unconfirmed; this is a silhouette/pipeline proof, not production model-correct art.
