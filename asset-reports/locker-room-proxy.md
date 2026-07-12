# Locker room asset report

## Status

Playable owner-review candidate using the downloaded Game Locker and bench environment plus five owner-supplied 4K Tripo sources: pilot watch, baseball, Wings, Charging Bull, and captain's hat. The right locker bay reads bottom-to-top as watch, baseball on its own shelf, Bull on a higher shelf, Wings, and hat. Reducer-locked props render as near-black silhouettes until their turn in the memory sequence.

All five personal props are cleaned candidates, not owner-approved final production art. Baseball is now imported and playable, while the complete composition remains at the owner visual approval gate.

## Source and build

- Blender: 5.1.2.
- Environment intake builder: `tools/blender/create_locker_room_proxy.py`; do not rerun it over the owner-adjusted master until it reproduces the manual environment layout.
- Prop intake: `tools/blender/import_locker_room_props.py`.
- Source-candidate preview tool: `tools/blender/render_source_candidate.py`.
- Environment intake: `asset-reports/locker-room-source-intake.json`.
- Prop intake and optimization record: `asset-reports/locker-room-prop-intake.json`.
- Master: `art-source/blender/locker_room_master.blend` (50,237,876 bytes; SHA-256 `648a63df7a95de0cda11cf2c2ba2dcb988b621ab6ab04388f3ae460d0fc63f42`).
- Deployable GLB: `public/models/locker-room.glb` (44,288,740 bytes; SHA-256 `cf212389e0d04aa34a528cbc2af07e59b4acc9d4e98e386f725c78da43279c5c`).
- Export root: `LOCKER_ROOT`; regenerated export includes five exported `game_id` nodes and their Blender-owned colliders.

## Preserved sources

- Game Locker: `.cache/cockpit-pipeline/sources/locker-room/game-locker/game_locker.zip`; SHA-256 `1aaee7ec80b3a69fe978a6ae3a9eeb4dfc1f546825a0f2db2070ac0c650dc694`.
- Locker room bench: `.cache/cockpit-pipeline/sources/locker-room/locker-room-bench/locker_room_bench.zip`; SHA-256 `067c5ff79e8daafa485b93c2900ebd0c9ab50b26297cfb9b3414e45df7ce018d`.
- Pilot watch original: `.cache/cockpit-pipeline/sources/locker-room/pilot-watch/original/gold wristwatch 3d model.glb`; SHA-256 `cb904e609a02f7a6d1a25fb1e4b8d69147c48912f34e375b1369aba927960c91`.
- Baseball 4K original: `.cache/cockpit-pipeline/sources/locker/baseball/original/baseball 3d model4kInterior.glb`; SHA-256 `e77bd1ef4f85705edb2f6ff5bfc5d91d17f5243c9cd77d9c147b204b58617725`.
- Pilot Wings 4K original: `.cache/cockpit-pipeline/sources/locker-room/pilot-wings/original/gold winged emblem 3d model4k.glb`; SHA-256 `27d2a4731419d1f7a44873b7aeb69869d6d33f23dc82f32657268db9fa85b36b`.
- Charging Bull 4K original: `.cache/cockpit-pipeline/sources/locker-room/charging-bull/original/bull 3d model4kNight.glb`; SHA-256 `a5ca94020d9a0de950666d7e8ab8da1eff861a42f48bfb06e29a6f83dcd3d1f1`.
- Captain's hat original: `.cache/cockpit-pipeline/sources/locker-room/captains-hat/original/pilot cap 3d model.glb`; SHA-256 `7ba8f765c94f6ee3caca2f132ae0954400c161a5ae60bf7e3eac95e9f7eed84e`.

The Downloads copies and cache originals remain untouched. Blender-produced edited copies are staged in each prop's `optimized/` sibling directory.

## Optimization and runtime contracts

| Prop | Source triangles | Web triangles | Textures | Stable parent | Exported collider | Contract |
|---|---:|---:|---|---|---|---|
| Baseball | 494,248 | 71,999 | 4K source → 3 x 2048 runtime | `LOCKER_PROP_BASEBALL` | `LOCKER_HITBOX_BASEBALL` | `locker.memory.baseball` / `question` |
| Pilot watch | 488,677 | 71,999 | 4K source → 3 x 1024 runtime | `LOCKER_PROP_WATCH` | `LOCKER_HITBOX_WATCH` | `locker.memory.watch` / `question` |
| Pilot Wings | 492,226 | 72,000 | 4K source → 3 x 2048 runtime | `LOCKER_PROP_WINGS` | `LOCKER_HITBOX_WINGS` | `locker.memory.wings` / `question` |
| Charging Bull | 498,476 | 71,999 | 4K source → 3 x 2048 runtime | `LOCKER_PROP_CHARGING_BULL` | `LOCKER_HITBOX_CHARGING_BULL` | `locker.memory.chargingBull` / `question` |
| Captain's hat | 488,608 | 69,999 | 4K source → 3 x 1024 runtime | `LOCKER_PROP_CAPTAINS_HAT` | `LOCKER_HITBOX_CAPTAINS_HAT` | `locker.promotion.hat` / `claim` |

All five static single-mesh Tripo candidates are decimated only after their stable contract parents are established. Origins are centered; scale and presentation rotation are baked into mesh data; contract-parent scale remains `(1, 1, 1)`. The baseball uses XYZ `(-45°, 0°, 90°)` to expose both seam bands, Wings uses `(0°, 0°, -90°)`, and the other props use a -45-degree Z turn. Every source passes the material-wired 4K BaseColor/Normal/metallic-roughness gate. Runtime staging remains per-prop: watch/hat at 1K and baseball/Bull/Wings at 2K for this owner comparison.

The GLB contains the environment materials plus the imported prop materials and textures. The environment meshes retain their prior imported transforms. The browser reads all five exported `game_id` parents and uses their Blender-owned colliders; native HTML controls remain the accessible equivalent. No runtime-only baseball placeholder remains.

## Validation

- `npm run asset:locker` passed Blender source validation, rendered all five approval cameras, exported `LOCKER_ROOT`, and found no glTF errors.
- Expected source warnings remain for five unapplied transforms inside the imported environment hierarchy.
- glTF warnings are generated tangent-space rows for normal-mapped imported materials. The five invisible colliders also retain informational unused UV rows.
- `npm run assets:check` passed the deployable model with no errors.
- Focused Playwright proved all five real GLB node names, silhouette/revealed states, exported colliders, restored material states, retry/fallback, and the accessible path.

## Visual evidence

- Neutral new-source views: `.cache/assets/intake/locker-baseball-4k/`, `.cache/assets/intake/locker-bull-4k/`, and `.cache/assets/intake/locker-wings-4k/`.
- Blender approval renders: `.cache/assets/locker/previews/cam_locker_approval_hero.png`, `cam_locker_approval_watch.png`, `cam_locker_approval_baseball.png`, `cam_locker_approval_wings.png`, `cam_locker_approval_bull.png`, and `cam_locker_approval_hat.png`.
- Browser 4K-source comparison: `.cache/assets/locker/browser/locker-4k-{baseball,bull,wings}-focus-{with-card,clean}-1440.png` and `.cache/assets/locker/browser/locker-4k-overview-{1440,768,375}.png`.
- Browser centering/darker-locker comparison: `.cache/assets/locker/browser/locker-centering-watch-1440.png` and `.cache/assets/locker/browser/locker-centering-overview-{1440,768,375}.png`.
- Browser seam/camera/question proof: `.cache/assets/locker/browser/locker-seam-flow-{watch,baseball-card,baseball-clean,bull-question,wings-question}-1440.png` plus `locker-seam-flow-wings-{question,card}-{768,375}.png`.
- Browser locked-prop framing: `.cache/assets/locker/browser/locker-black-props-1440.png`, `locker-black-props-768.png`, and `locker-black-props-375.png`.
- Browser watch question: `.cache/assets/locker/browser/locker-watch-jet-lag-question-1440.png`.
- Browser revealed hat: `.cache/assets/locker/browser/locker-hat-revealed-1440.png`.
- Browser capture passes recorded no console errors.

## Known deviations and next handoff

- The owner must approve the five imported prop compositions before any candidate is treated as final production art; agent inspection is defect screening only.
- Baseball, Bull, and Wings currently retain their authored PBR at 2K runtime staging for a like-for-like owner comparison. Any material tuning or downsampling follows owner feedback.
- Exact airline identity and marks on future assets remain subject to owner direction.
- A Vercel preview is still required for the locker-room approval gate.

## 2026-07-11 ordered reveal layout revision

- Swapped the stable Wings and Charging Bull contract placements without renaming nodes, colliders, or `game_id` values.
- Charging Bull placement: `(0.42, 0.48, 1.34)`; dedicated shelf placement: `(0.42, 0.48, 1.15)`.
- Wings placement: `(0.42, -0.06, 2.03)`.
- Blender 5.1.2 regenerated the master, approval previews, intake report, and 27,253,492-byte runtime GLB.
- Runtime GLB SHA-256: `03d13d9e596ad77b7ca540f19a4826316d7467bdd7fe4d978bf48e71abcbf757`; browser bytes matched disk.
- Browser inspection passed for Bull/Wings reveal, camera focus, accessible controls, copy, reduced motion, reload, and 1440/768/375 layouts.
- The downloaded baseball remains preserved as the source authority for this owner-review candidate; its Blender-produced runtime copy is documented below.

## 2026-07-11 baseball memory import

- Imported the preserved source `.cache/cockpit-pipeline/sources/locker/baseball/original/baseball+3d+model.glb` through Blender 5.1.2. Source SHA-256: `75dda2bf01c8c8863820ec25750ef2f1b15940ccfeb1b1c56d8d0b548d5ab19e`.
- Added `LOCKER_PROP_BASEBALL`, `LOCKER_PROP_BASEBALL_MESH`, and `LOCKER_HITBOX_BASEBALL` with `locker.memory.baseball` / `question` metadata, centered pivot, scale `0.30`, zero rotation, and placement `(0.05, -0.48, 1.34)` on a dedicated shelf above the watch. The Bull is at `(0.42, 0.48, 2.03)` on the higher shelf, and the Wings are lifted to `(0.42, -0.06, 2.55)`.
- Baseball is now the immediate playable question after the watch. Charging Bull unlocks after baseball, Wings after Bull, and the hat after all four memories.
- Baseball approval render: `.cache/assets/locker/previews/cam_locker_approval_baseball.png`. Browser evidence inspected: `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, and `/tmp/baseball-locker-375.png`.
- Regenerated `public/models/locker-room.glb` through `npm run asset:locker`; final bytes and browser response matched at `29,539,664` bytes with SHA-256 `7afc3778aca9e1518d7285379a8f70a334969b4a51e76c816f95b065a40efb4e`.
- The importer target remains 48,000 triangles, but Blender's decimator produced 113,634 triangles for the baseball source; this is recorded as an owner-review optimization delta rather than hidden. The other imported prop budgets remain below their configured targets.
- Remaining gate: owner visual approval of the imported candidate and the locker-room composition; no deployment or commit is included.

## 2026-07-11 baseball source replacement

- Preserved the prior baseball source and staged the new download as `.cache/cockpit-pipeline/sources/locker/baseball/original/baseball+3d+model-20260711.glb`.
- New source: 16,385,168 bytes, SHA-256 `1fb4a5ae2ced1e9500b4730127da3febdc03787af886a314756e8a61e8de06cd`; 494,248 source triangles; three 2048px source maps staged to 1024px.
- Blender runtime result: 20,492 triangles, same stable node/collider/game ID and existing requested shelf placement.
- Final runtime GLB: 25,025,584 bytes, SHA-256 `23a8b567e1f511842a71a1d2b8d5a92e2d2a9b0e572021801de26a7f16d12911`.
- The new baseball was checked in Blender approval renders and actual browser captures; it is visibly seated on the dedicated shelf and replaces the older speckled candidate without changing the game contract.

## 2026-07-11 owner visual repair pass

- Moved `LOCKER_PROP_BASEBALL` and `LOCKER_ENV_BASEBALL_SHELF` to `(0.64, -0.48, 1.34)` and `(0.64, -0.48, 1.17)` respectively, keeping the baseball above the watch and inside the right locker bay. The Bull remains on the higher shelf and Wings remains lifted higher.
- Applied `base-color-only-smooth-matte` treatment to the new baseball material: base-color texture retained, normal/roughness/metallic links removed, smooth polygons enabled, and matte roughness set to 0.58.
- Updated the runtime to use native multiple-choice controls for both the baseball and Bull questions; Bull's exported interaction metadata is now `question`.
- Final deployable GLB is 23,834,824 bytes with SHA-256 `3678d8c797d9fe7cf65a8b91bcac0023a653c085df66009b574a9e7825f539e4`. No runtime-only baseball proxy is present.
- The candidate still shows some grain from its base-color image itself; this remains an owner-review limitation and is intentionally not hidden as production art.

## 2026-07-11 grain repair pass

- Blender export now uses controlled solid matte materials for the baseball, Charging Bull, and Wings. Their normal, roughness, metallic, AO, bump, displacement, and base-color texture links are removed from the deployable candidate materials.
- The baseball scan also contained perforated micro-geometry that remained noisy under unlit shading. Its runtime contract mesh is now a centered smooth sphere review proxy; the original downloaded baseball GLB remains preserved and documented as source evidence.
- Final browser evidence shows clean matte baseball, Bull, and Wings surfaces at `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, and `/tmp/baseball-locker-375.png`, with runtime bytes matching disk and no console errors.
- Final deployable GLB: 20,723,224 bytes, SHA-256 `108d988705a7924a042959a7c5bae3ea31a0bc5e63830d935aadc55c6451bd23`. Baseball source triangles remain recorded at 494,248; the clean runtime review proxy is 2,208 triangles.

## 2026-07-11 corrective stylized-prop pass

- The owner-rejected generic sphere/flat-color pass is superseded. Baseball now has authored leather and red seam geometry, Bull uses a silhouette-preserving voxel remesh with bronze material, and Wings use a cleaned stylized gold atlas.
- Original downloaded GLBs remain untouched and recorded. Runtime contracts, placement, colliders, game IDs, and interaction metadata are unchanged.
- Current treatments: baseball `procedural-leather-and-red-seams` (7,968 triangles); Bull `voxel-cleaned-stylized-bronze` (40,984 triangles); Wings `stylized-base-color-smooth-matte` (48,000 triangles).
- Final GLB: 26,594,784 bytes, SHA-256 `893ae4dcd628ab43af1d3f9a9b50f5fcfefc1d3669ef7dfefee7510683089010`.
- Export inspection records 52 selected objects, five `game_id` nodes, ten materials, and thirteen textures. A no-cache browser fetch matched the disk byte count and produced no application console errors.
- The corrective rebuild restored the shared decimator to a proportional ratio so one noisy scan could not over-reduce unrelated watch, hat, or Wings geometry. The baseball approval camera was also recentered on the right-side shelf.

## 2026-07-12 complete 4K-source rebuild

- Supersedes the 2026-07-11 proxy-material experiments above. Baseball, Charging Bull, and Wings now use their newly downloaded Tripo geometry and authored PBR maps; the procedural baseball, voxel Bull, and stylized Wings atlas are no longer in the runtime export.
- The importer verifies immutable source hashes plus material wiring for BaseColor, Normal, and metallic-roughness, with every required source map at 4096×4096. `assets:check` independently requires all five props and all three roles.
- Runtime staging is intentionally separate from source intake: baseball/Bull/Wings use 2048 maps for owner comparison; watch/hat retain their existing 1024 staging. No universal runtime budget is inferred from the watch.
- Final Blender master SHA-256: `4356961f63439241d1c9ea0bde8f244361203a67db68629580886f7311a2cdaf`. Runtime GLB: 44,288,684 bytes, SHA-256 `3b5d365274bb6e65b939e6bee4467e6be7d5a4111f5aace92dcc240b99518753`.
- Prop-scoped orphan cleanup reduced the master from 74.7 MiB to 50.2 MiB and restored stable unsuffixed mesh/image names. Two consecutive full builds produced the identical deployable GLB SHA-256 above; Blender's own `.blend` serialization hash is recorded per build but is not asserted as byte-stable.
- A no-cache local HTTP fetch matched the runtime GLB byte count and hash. Browser evidence found the real baseball, Bull, and Wings nodes, settled all three focus cues, and recorded no console errors.
- Visual acceptance remains with the owner. These captures are comparison evidence, not an agent approval of material quality.

## 2026-07-12 owner centering and darker-locker pass

- Shifted only the watch, Wings, and captain's hat to x=`0.56` under their existing stable roots and exported colliders. Baseball, Charging Bull, and the shelves retain their previous placements.
- Updated the watch and Wings runtime focus targets and all three affected Blender approval cameras. Locker-only runtime illumination and Blender approval lighting are approximately 12–15 percent lower; no prop material or texture map was changed.
- Current Blender master: 50,238,219 bytes, SHA-256 `c284dce0a75f380270ffbd3bed38c009bdd7adb97794a269f6309daf5ef071c4`. Current runtime GLB: 44,288,680 bytes, SHA-256 `96cf42d665fd41c3ecf4e384318251e42c1e99577eac5c1e7ebf93861c46a4d5`.
- Browser proof loaded the exact no-cache GLB with `model/gltf-binary`, found the real watch/Wings/hat nodes, settled the watch and Wings cues, and recorded no console errors, page errors, or horizontal overflow at 1440/768/375.
- Automated validation passed. Visual centering and darkness remain exclusively for owner approval.

## 2026-07-12 seam presentation, continuous camera, and Wings question pass

- The importer now supports baked XYZ rotation and records both the XYZ tuple and legacy Z value. Baseball uses `(-45°, 0°, 90°)`, matching the selected two-vertical-seam presentation without changing source textures, scale, shelf, stable root, or collider.
- Wings metadata is now `locker.memory.wings` / `question`. The runtime requires the accessible `1000 hours` form before revealing the hat; prior completed saves are preserved under schema version 5.
- Watch, Baseball, Bull, and Wings focus poses all report FOV `30.00` and distance `3.490`. Actual-browser evidence confirms the camera climbs through the sequence without zooming out.
- Current master: 50,237,876 bytes, SHA-256 `648a63df7a95de0cda11cf2c2ba2dcb988b621ab6ab04388f3ae460d0fc63f42`. Current GLB: 44,288,740 bytes, SHA-256 `cf212389e0d04aa34a528cbc2af07e59b4acc9d4e98e386f725c78da43279c5c`.
- The Bull question is a separate bold block; the widened Wings card clears the lower-right actions at 1440 and remains overflow-free at 768/375. Browser response bytes/hash matched disk and no console/page errors were recorded.
- The rotation and composition are comparison evidence for owner review, not agent visual approval.
