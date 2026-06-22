# DC-9 Pipeline Proof Asset Report

Date: 2026-06-22

## Source And Output

- Blender source: `art-source/blender/dc9_master.blend`
- Authoring script: `tools/blender/create_dc9_pipeline_proof.py`
- Deployable GLB: `public/models/dc9-cockpit.glb`
- Approval render: `preview-renders/dc9-captain-approval.png`
- Cache reports: `.cache/assets/dc9/validation.json`, `.cache/assets/dc9/asset-report.json`

## Blender

- Version: Blender 5.1.2
- Executable used: `/home/user1/.local/bin/blender`
- Scene validation: passed with 0 errors and 0 warnings
- Render note: `tools/blender/render_preview.py` now falls back from `BLENDER_EEVEE_NEXT` to `BLENDER_EEVEE` for Blender builds that expose the older engine identifier.

## Asset Contents

- Scope: proof-of-pipeline blockout only, not final DC-9 art.
- Target reference: Northwest-style DC-9-51 seed reference pack.
- Root: `DC9_ROOT`
- Approval camera: `CAM_DC9_CAPTAIN_APPROVAL`
- Main visual relationships represented:
  - captain-eye sightline
  - windshield frames and center post
  - glare shield
  - main panel and center engine panel density
  - captain and first-officer yoke blockouts
  - center pedestal and throttle blockout
  - overhead panel hint
  - analog gauge density with tick geometry
  - screws, labels, annunciator, and route card

## Runtime Contract

Required nodes present:

- `DC9_ROOT`
- `CAM_DC9_CAPTAIN_APPROVAL`
- `DC9_SW_LEGACY_POWER_01`
- `DC9_SW_LEGACY_POWER_02`
- `DC9_SW_LEGACY_POWER_03`
- `DC9_GAUGE_LEGACY_CODE_NEEDLE_01`
- `DC9_ANNUNCIATOR_LEGACY_POWER_01`
- `DC9_PROP_MEM_ROUTE_CARD_01`

Custom properties exported to glTF extras:

- `DC9_ROOT`: `asset_id`, `asset_stage`, `target_reference`, `modeling_scope`, `safety_note`
- Three switches: `game_id`, `interaction`, `puzzle_id`, `rotation_axis`, `rest_angle`, `active_angle`, `sound_id`, `pivot_note`
- Gauge needle: `game_id`, `interaction`, `animation_id`, `puzzle_id`
- Annunciator: `game_id`, `interaction`, `puzzle_id`, `emissive_state`
- Route card: `game_id`, `interaction`, `puzzle_id`, `route_context`

## GLB Inspection

- GLB size: 1,419,776 bytes / 1.35 MiB
- Node count: 311
- Mesh count: 300
- Material count: 15
- Animation count: 1
- Camera count: 1
- Textures: none
- Required-node check: passed
- Metadata check: passed for gameplay-facing nodes

## Validation

Commands run:

```bash
BLENDER_BIN=/home/user1/.local/bin/blender /home/user1/.local/bin/blender --background --python tools/blender/create_dc9_pipeline_proof.py
BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:dc9
npm run assets:check
npm run check
```

Results:

- `create_dc9_pipeline_proof.py` passed and saved `art-source/blender/dc9_master.blend`.
- `npm run asset:dc9` passed end to end.
- `tools/blender/validate_scene.py` passed with 0 warnings.
- `tools/blender/render_preview.py` rendered `preview-renders/dc9-captain-approval.png` after copying from `.cache/assets/dc9/previews/`.
- `tools/blender/export_glb.py` exported `.cache/assets/dc9/dc9.raw.glb`.
- `gltf-transform validate` reported no errors and no warnings. It reports info-level unused UV attributes and empty hierarchy nodes; these are expected for this named blockout because UVs are reserved for later texture work and empty hierarchy nodes preserve the asset contract.
- `npm run assets:check` passed.
- `npm run check` passed as non-mutating validation; browser integration remains Windows-owned.

## Known Deviations

- This is still a blockout. It is intentionally not final DC-9 production art.
- Shapes are procedural original geometry and do not use reference photos as textures.
- The overhead and pedestal are represented as spatial/proportion placeholders; detailed geometry requires more primary DC-9-51 references.
- The browser integration is Windows-owned under `src/**`; this Ubuntu branch only provides the deployable GLB and documented runtime contract.
