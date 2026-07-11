# Locker room asset report

## Status

Playable owner-review candidate using the downloaded Game Locker and bench environment plus the owner-supplied Tripo pilot watch, Wings, Charging Bull, and captain's hat. The watch is the first active keepsake in the lower warm bay. The Wings are wall-mounted above it, the Bull rests on a dedicated slim shelf, and the real hat occupies the upper shelf. The three later objects remain textureless near-black silhouettes until reducer state reveals them.

All four personal props are cleaned candidates, not owner-approved final production art. Baseball remains a future import, and the post-watch story sequence is intentionally unauthored.

## Source and build

- Blender: 5.1.2.
- Environment intake builder: `tools/blender/create_locker_room_proxy.py`; do not rerun it over the owner-adjusted master until it reproduces the manual environment layout.
- Prop intake: `tools/blender/import_locker_room_props.py`.
- Source-candidate preview tool: `tools/blender/render_source_candidate.py`.
- Environment intake: `asset-reports/locker-room-source-intake.json`.
- Prop intake and optimization record: `asset-reports/locker-room-prop-intake.json`.
- Master: `art-source/blender/locker_room_master.blend` (30,705,426 bytes; SHA-256 `7c0b71e55f066d7c1b824e898614dddaad05c363d7d902a88114f933f545c0fb`).
- Deployable GLB: `public/models/locker-room.glb` (27,253,440 bytes; SHA-256 `3829754b92f9e06bf406fb7f2afce21336a3975ca422feb496e5cf88985cd69c`).
- Export root: `LOCKER_ROOT`; 46 selected objects and four exported `game_id` nodes.

## Preserved sources

- Game Locker: `.cache/cockpit-pipeline/sources/locker-room/game-locker/game_locker.zip`; SHA-256 `1aaee7ec80b3a69fe978a6ae3a9eeb4dfc1f546825a0f2db2070ac0c650dc694`.
- Locker room bench: `.cache/cockpit-pipeline/sources/locker-room/locker-room-bench/locker_room_bench.zip`; SHA-256 `067c5ff79e8daafa485b93c2900ebd0c9ab50b26297cfb9b3414e45df7ce018d`.
- Pilot watch original: `.cache/cockpit-pipeline/sources/locker-room/pilot-watch/original/gold wristwatch 3d model.glb`; SHA-256 `cb904e609a02f7a6d1a25fb1e4b8d69147c48912f34e375b1369aba927960c91`.
- Pilot Wings original: `.cache/cockpit-pipeline/sources/locker-room/pilot-wings/original/gold+winged+emblem+3d+model.glb`; SHA-256 `71b308c7a2f25a6014a29613bf3cd33bf4a3883969fb4bec7e9067cf8be80af0`.
- Charging Bull original: `.cache/cockpit-pipeline/sources/locker-room/charging-bull/original/bull+3d+model.glb`; SHA-256 `2858838f5d753571c5c8702fb061bf4005dd6e32460ed9a745c422a7e46fb7c8`.
- Captain's hat original: `.cache/cockpit-pipeline/sources/locker-room/captains-hat/original/pilot cap 3d model.glb`; SHA-256 `7ba8f765c94f6ee3caca2f132ae0954400c161a5ae60bf7e3eac95e9f7eed84e`.

The Downloads copies and cache originals remain untouched. Blender-produced edited copies are staged in each prop's `optimized/` sibling directory.

## Optimization and runtime contracts

| Prop | Source triangles | Web triangles | Textures | Stable parent | Exported collider | Contract |
|---|---:|---:|---|---|---|---|
| Pilot watch | 488,677 | 71,999 | 3 x 1024 | `LOCKER_PROP_WATCH` | `LOCKER_HITBOX_WATCH` | `locker.memory.watch` / `question` |
| Pilot Wings | 492,226 | 48,000 | 3 x 1024 | `LOCKER_PROP_WINGS` | `LOCKER_HITBOX_WINGS` | `locker.memory.wings` / `inspect` |
| Charging Bull | 498,476 | 59,999 | 3 x 1024 | `LOCKER_PROP_CHARGING_BULL` | `LOCKER_HITBOX_CHARGING_BULL` | `locker.memory.chargingBull` / `inspect` |
| Captain's hat | 488,608 | 69,999 | 3 x 1024 | `LOCKER_PROP_CAPTAINS_HAT` | `LOCKER_HITBOX_CAPTAINS_HAT` | `locker.promotion.hat` / `claim` |

All four static single-mesh Tripo candidates were decimated only after their stable contract parents were established. Origins are centered; scale and presentation rotation are baked into mesh data; contract-parent scale remains `(1, 1, 1)`. The Wings use a -90-degree turn to face the player; the other props use -45 degrees. The watch/hat 4K maps were staged at 1K, and the Wings/Bull retain their native 1K maps.

The GLB contains eight materials and eighteen textures: six 2048 environment maps and twelve 1024 prop maps. The environment meshes retain their prior imported transforms. The browser reads all four exported `game_id` parents and uses their Blender-owned colliders; native HTML controls remain the accessible equivalent. Only baseball retains a runtime-only placeholder hitbox.

## Validation

- `npm run asset:locker` passed Blender source validation, rendered all five approval cameras, exported `LOCKER_ROOT`, and found no glTF errors.
- Expected source warnings remain for five unapplied transforms inside the imported environment hierarchy.
- glTF warnings are generated tangent-space rows for normal-mapped imported materials. The four invisible colliders also retain informational unused UV rows.
- `npm run assets:check` passed the deployable model with no errors.
- Focused Playwright proved all four real GLB node names, pre-reveal Wings/Bull/hat silhouette states, exported watch-collider click, restored material states, retry/fallback, and the accessible path.

## Visual evidence

- Neutral source views: `.cache/assets/locker/source-intake/pilot-watch/`, `.cache/assets/intake/locker-pilot-wings/`, `.cache/assets/intake/locker-charging-bull/`, and `.cache/assets/locker/source-intake/captains-hat/`.
- Blender approval renders: `.cache/assets/locker/previews/cam_locker_approval_hero.png`, `cam_locker_approval_watch.png`, `cam_locker_approval_wings.png`, `cam_locker_approval_bull.png`, and `cam_locker_approval_hat.png`.
- Browser locked-prop framing: `.cache/assets/locker/browser/locker-black-props-1440.png`, `locker-black-props-768.png`, and `locker-black-props-375.png`.
- Browser watch question: `.cache/assets/locker/browser/locker-watch-jet-lag-question-1440.png`.
- Browser revealed hat: `.cache/assets/locker/browser/locker-hat-revealed-1440.png`.
- Browser capture passes recorded no console errors.

## Known deviations and next handoff

- The owner must approve the four imported prop compositions before any candidate is treated as final production art.
- Baseball and the bottom-to-top post-watch interaction sequence are not yet authored. The imported Wings and Bull remain locked visual discoveries until that flow is approved.
- Exact airline identity and marks on future assets remain subject to owner direction.
- A Vercel preview is still required for the locker-room approval gate.
