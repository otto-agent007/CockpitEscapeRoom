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
- Goal-loop visual pass 1: 2026-06-22 captain-seat improvement pass regenerated the source blend, deployable GLB, and approval render from `tools/blender/create_dc9_pipeline_proof.py`.
- Goal-loop visual pass 2: 2026-06-22 primary-reference alignment pass used `art-source/references/dc9-51/primary/dc9_51_n775nc_cockpit_primary.jpg` as the shape/color target for the yokes, overhead band, panel labels, blue-grey material balance, and visible cockpit density.
- Goal-loop visual pass 3: 2026-06-22 pedestal and glareshield reference pass added a black throttle quadrant/radio stack and denser glareshield/autopilot strip to better match the primary DC-9-51 cockpit reference silhouette.
- Goal-loop local batch 4: 2026-06-22 cockpit enclosure and panel-depth pass added windshield posts, wiper arms, glareshield stall-handle cues, a yellow paper stack, right-side wall depth, and recessed instrument trays. This batch is kept local until enough visual iterations justify a PR update.
- Goal-loop local batch 5: 2026-06-22 foreground and pedestal-clutter pass added visible seat-cushion cues, side paperwork pockets, extra pedestal status lights, small knobs, guard posts, and label strips. This remains local; no PR update was opened for this individual iteration.
- Goal-loop local batch 6: 2026-06-22 overhead-density pass added hidden/partly visible overhead switch panels, amber legend windows, overhead screws, small eyebrow lamps, and overhead labels to support the eventual top-of-frame cockpit density without changing runtime interaction nodes.
- Goal-loop local batch 7: 2026-06-22 footwell and floor realism pass added lower kick panels, black rubber floor mats, rudder pedal silhouettes, pedal ribs, floor scuffs, and lower-panel grime. This remains local; no PR update was opened for this individual iteration.
- Goal-loop local batch 8: 2026-06-22 instrument-face realism pass added blue/brown attitude-indicator cues, aircraft reference bars, pitch marks, primary-gauge face marks, and green/white engine-gauge arcs. This remains local; no PR update was opened for this individual iteration.
- Goal-loop local batch 9: 2026-06-22 yoke-detail realism pass added center badges, thumb buttons, extra checklist linework, metal clips, and worn grip-edge highlights to the captain and first-officer yokes. This remains local; no PR update was opened for this individual iteration.
- Goal-loop local batch 10: 2026-06-22 panel-surface aging pass added a denser fastener grid, chipped-paint slivers, lower-panel grime feathers, and small service placards across the main panel. This remains local; no PR update was opened for this individual iteration.
- Goal-loop local batch 11: 2026-06-22 glare-shield annunciator/readout pass added segmented noninteractive upper-panel status modules, amber/red lamps, mode buttons, labels, and screw heads. This remains local; no PR update was opened for this individual iteration.
- Goal-loop local batch 12: 2026-06-22 gauge-depth and glass-response pass added noninteractive inner gauge shadow lips, subtle glass glints, bezel screws, and fine radial marks around the captain, center, and first-officer instrument clusters. This remains local; no PR update was opened for this individual iteration.

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
- Visual improvements in the current pass:
  - softened cockpit shell, glare shield, panel, pedestal, and yoke blockout edges with bevel/weighted-normal treatment
  - replaced round yoke wheels with squared-off DC-9-style yoke bars, vertical grips, center pads, and checklist placards
  - added panel seams, black placards, lower-panel knobs, pedestal radio faces, throttle gate notches, and throttle knobs
  - varied analog gauge needle angles and added small color-band placeholder marks
  - increased overhead switch density and darkened the panel/shell material balance for stronger captain-seat contrast
  - added a camera-facing forward-overhead strip with knobs and amber windows, non-mirrored instrument labels, tinted windshield panes, sidewall ribs, circuit-breaker detail, and restrained wear/grime accents
  - added a black pedestal throttle quadrant with rails, lever handles, toggle rows, radio digit windows, and small knobs to give the lower-center view a more mechanical DC-9 read
  - added a denser glareshield/autopilot strip with knobs, amber readouts, blue pushbuttons, and a visible label band
  - added primary-reference enclosure cues: off-white windshield posts, wiper arms, side brow/stall-handle shapes, right-side sidewall ribs, and the yellow glareshield paper stack visible in the seed photo
  - added recessed dark instrument trays and small warning/header placards to reduce the flat blue-panel look
  - added subtle foreground seat fabric, side paperwork pockets, and extra pedestal micro-detail so the captain view feels more occupied and less like a bare demonstration panel
  - added overhead switch-panel density, amber legend windows, screws, and small eyebrow lamps so the ceiling/glareshield area has more reference-driven structure
  - added lower kick-panel, rubber floor-mat, rudder-pedal, and scuffed-floor cues so the lower cockpit no longer reads as an empty clean shell
  - added attitude-indicator sky/ground color, pitch marks, aircraft bars, denser primary-gauge marks, and engine-gauge green arcs so the main panel reads less generic from the captain seat
  - added yoke badges, red/white thumb-button cues, extra checklist markings, metal clips, and worn grip-edge highlights so the yokes look less like plain blockout bars
  - added a restrained fastener grid, panel chips, grime feathers, and service placards so the blue-grey panel surfaces read as aged aircraft hardware instead of clean flat blocks
  - added segmented glare-shield annunciator/status modules with small lamps, mode buttons, labels, and screws so the upper main-panel area reads denser without becoming one flat overlay strip
  - added inner gauge shadow lips, small glass glints, bezel screw heads, and fine radial marks so the analog instruments read as recessed hardware with glass response instead of flat circles

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

- GLB size: 6,107,876 bytes / 5.82 MiB
- Node count: 1,074
- Mesh count: 1,063
- Material count: 30
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
- Manual visual inspection of `preview-renders/dc9-captain-approval.png` confirmed a stronger captain-seat read against the primary DC-9-51 cockpit reference: squared yokes with checklist placards, yoke button/detail cues, readable gauge labels, a visible forward-overhead control band, denser instrument panel, colored attitude-indicator cues, deeper analog gauge wells, small glass glints, busier primary/engine instrument faces, black mechanical pedestal/throttle/radio-stack detail, glareshield controls, segmented glare-shield annunciator/status modules, windshield/wiper/paper-stack reference cues, recessed instrument trays, side paperwork, subtle seat foreground cues, small eyebrow lamps, clearer cockpit enclosure, visible lower kick panels/rudder-pedal cues, floor scuffing, panel fastener/paint-chip/grime variation, and less flat main-panel presentation.

## Known Deviations

- This is still a blockout. It is intentionally not final DC-9 production art.
- Shapes are procedural original geometry and do not use reference photos as textures.
- The overhead and pedestal are represented as spatial/proportion placeholders; detailed geometry requires more primary DC-9-51 references.
- The current captain view is more recognizable and more dramatic than the first pipeline proof, but it still needs reference-driven production modeling, real panel sub-shapes, proper baked labels/wear, and browser review before the greybox label can be removed.
- The forward-overhead band is intentionally simplified and pulled into the approval camera view for reference alignment; production art should replace it with correctly positioned overhead geometry once the full cockpit shell advances beyond proof stage.
- The pass-3 pedestal remains simplified and slightly oversized for proof-stage readability. Production art should refine the pedestal proportions, throttle lever spacing, radio stack depth, and material breakup against additional primary references.
- The windshield posts, wipers, stall-handle cues, and paper stack are proof-stage silhouettes placed to improve the captain approval view; production art should refine their exact shape, anchoring, and windshield-frame integration.
- The seat cushions, side pockets, and pedestal micro-detail are local proof-stage density cues; they should be replaced or proportion-refined during production modeling.
- Much of the new overhead switch density is intentionally only partly visible from the current approval camera. A future overhead approval camera should refine and validate this area directly.
- The lower kick panels and rudder pedals are proof-stage silhouettes for captain-view realism; production art should refine pedal linkage geometry, footwell clearances, and lower-panel shapes against direct DC-9 references.
- The new attitude-indicator and gauge-face details are geometry placeholders for visual read. Production art should replace them with correctly scaled instrument faces, typography, glass, and baked markings after the reference set is expanded.
- The yoke buttons, badges, checklist strips, and wear highlights are proof-stage readability cues; production art should refine the exact yoke casting shape, placard layout, button placement, and grip material against closer DC-9-51 yoke references.
- The panel-surface aging is intentionally procedural geometry for proof-stage readability. Production art should replace much of it with baked paint wear, accurate screw placement, and real placard typography once the detailed panel model is built.
- The segmented glare-shield annunciator/status modules are noninteractive proof-stage density cues. Production art should refine exact placement, labeling, lamp colors, and integration with the DC-9 glare-shield and main-panel brow references.
- The new gauge-depth details use geometry for local approval readability and increase GLB size to 5.82 MiB. Production art should convert much of this fine ring/glint/mark detail to baked instrument textures once the detailed panel model is ready.
- The browser integration is Windows-owned under `src/**`; this Ubuntu branch only provides the deployable GLB and documented runtime contract.
