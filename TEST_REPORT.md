# Test report

## 2026-07-13 DC-9-32 Pop T Captain production pass

- Promoted the owner-cleared Roger2009 DC-9-32 to exact geometry/texture authority and replaced the active switch-first DC-9-50 Captain contract with route-first BTR/STL/TYS verification, then APU buses off, APU master off, and battery off. Fuel boost pumps are an explicit already-off parked-state precondition.
- Extended OBJ8 conversion/import coverage for nested animation channels, keys, pivots, datarefs, manipulators, draw ownership, selected-range extraction, pivot endpoints, and static-range exclusion. Python cockpit-pipeline discovery passed 16/16.
- Rebuilt `public/models/dc9-cockpit.glb`: 30,336,864 bytes (28.93 MiB), SHA-256 `1ecde9d5ebeab587269355f0b75b7585c4b74f74edd5e5a36c4c77f4660dce7c`; 654 selected objects, 620 meshes, 220,259 uploaded vertices, 236,826 triangles, 8 materials, 5 textures, 6 cameras, and 11 stable `game_id` nodes.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:dc9` passed. Blender scene validation reported zero errors/warnings; glTF validation reported zero errors/warnings, with informational unused collider UVs only. No destructive optimization was applied.
- Added schema-v6 persistence and migration. All 47 reducer/storage tests passed, covering route-first gating, both failure/reset scopes, progressive hints, battery completion, corrupt saves, completed reward/Mars preservation, and in-progress v5 Captain restart.
- Replaced the sidebar and floating proxy switches with the full-screen Captain shell, real collider picking, projected native controls, yoke-route/overhead stage cameras, reduced-motion snapping, and compact model-failure fallback. The latest owner placement correction supersedes the broad clipboard attempt: donor yoke ranges 012/013 were measured, the route strip was narrowed to 0.10 by 0.30 and moved in front of the center pad at y=-2.775, and the captain eye was lowered from z=0.90 to z=0.82. Rightward look was expanded to about 41 degrees while left remains about 17 degrees. A camera-drag regression found during Playwright proof was fixed with a movement threshold so orbiting cannot select a route.
- Focused Chromium proof passed 2/2 in 1.9 minutes: real GLB bytes and strict registry, real BTR mesh click, rightward camera move/reset, route keyboard flow, overhead secure projection, battery-off reward, absent sidebar, and aborted-GLB accessible fallback.
- Full `npm run test:e2e -- --workers=1` passed all 14 Chromium cases in 6.6 minutes after the merged locker checkpoint. This includes the 3.8-minute real-locker GLB flow, Airbus production GLB, the 1.7-minute real DC-9 route/secure/reward flow, DC-9 model fallback, accessibility, persistence, camera, and reduced-motion coverage.
- `npm run check` passed: lint, TypeScript, 47/47 Vitest tests, and Vite production build. `npm run assets:check` passed; DC-9 has no validation warnings. `npm run pipeline:evals` passed 6/6.
- Repaired browser evidence was inspected at 1440, 768, and 375 px with no horizontal document overflow. The narrow route strip is attached to the pilot-facing yoke pad with all six choices and submit visible; the dragged-right proof shows the center pedestal, first-officer panel/yoke, and right window while projected controls remain attached. The secure screenshot projects the three native controls onto visible overhead geometry. A fresh reload recorded no application console errors; Three.js emits only its upstream `Clock` deprecation warning.
- Evidence: `preview-renders/cockpit-pipeline/dc9-captain-browser/{captain-game-view-1440,captain-game-view-768,captain-game-view-375,route-card-1440,right-look-1440,overhead-procedure-1440,battery-off-reward-1440}.png` and `preview-renders/dc9-captain-approval.png`.
- `npm run references:check` regenerated the DC-9 reference scene and overview, but its aggregate result remains red because three unrelated locker photos under `art-source/references/local-private/` are unmanifested.
- Vercel preview `dpl_6y1qkjBCL9HLVpadmHqs81Jq2NGz` is Ready at `https://cockpit-escape-room-9amnfa4zy-ottoagent007-gmailcoms-projects.vercel.app`. Authenticated `vercel curl` returned 30,336,864 bytes and SHA-256 `1ecde9d5ebeab587269355f0b75b7585c4b74f74edd5e5a36c4c77f4660dce7c`, exactly matching local.
- The owner approved this DC-9 greybox checkpoint for PR publication on 2026-07-13 and explicitly noted that substantial work remains. The label stays until a later production-ready approval.

## 2026-07-13 DC-9-50-family captain cockpit visual gate

- Owner review rejected the first donor-backed proof because its hand-placed gauges did not match the references and the yokes were initialized at the donor animation's full-left key. The repair now imports `DC9-32_cockpit.obj`, preserves its native instrument positions, and applies an explicit parked neutral pose for yoke roll/pitch/heading.
- `tools/blender/build_dc9_production.py` now builds the five-object Roger2009 cockpit stack deterministically, skips hidden OBJ8 draw ranges, masks only edge-connected white atlas padding, packs the corrected native atlas, and retains the `DC9_ROOT` hierarchy plus saved captain/approval cameras.
- Current master: 23,143,913 bytes, SHA-256 `6e23c3f01f65e34e93f53cd989ff7723b198384c17547c3a23d92aa66a0c332e`. Current GLB: 26,742,512 bytes, SHA-256 `fc13dacfdc9eed4625244b6b7abc1001e496d2e0b2b2d758927713b94af0552d`.
- GLB inspection: 618 nodes, 602 meshes/primitives, 219,827 uploaded vertices, 236,610 triangles, five materials, five textures, five cameras, and no animations. Scene validation passed with zero errors/warnings.
- Browser integration loads `CAM_DC9_CAPTAIN_GAME`, applies 64-degree desktop/76-degree narrow-layout framing, restores the exact saved pose with `R`, and corrects OBJ8 material depth behavior so the upright yoke, gauges, pedestal, and overhead remain visible together. Native HTML Captain controls remain available.
- A no-cache browser fetch received HTTP 200 and the exact 26,742,512-byte GLB. The canvas reported `ready`, the required camera node, and the saved 64-degree desktop state. Browser proofs at 1440, 768, and 375 px were visually inspected and promoted to `preview-renders/cockpit-pipeline/dc9-captain-browser/`; no page errors were recorded.
- Vercel preview `dpl_J8tb6mkq8p3jj84YgmU9EDQzmNDq` reached Ready at `https://cockpit-escape-room-5l72uhuph-ottoagent007-gmailcoms-projects.vercel.app`. Authenticated `vercel curl` returned HTTP 200, `model/gltf-binary`, 26,742,512 bytes, and SHA-256 `fc13dacfdc9eed4625244b6b7abc1001e496d2e0b2b2d758927713b94af0552d`, exactly matching the promoted local GLB.
- Passed: `npm run asset:dc9`; `npm run assets:check`; cockpit-pipeline unit discovery (15/15); `npm run check` (42/42 Vitest tests plus production build); focused real-GLB DC-9 Playwright (1/1, including look/reset and accessible controls); and `git diff --check`.
- `npm run assets:check` reports no GLB errors. Four imported donor PNGs retain feature/color-space warnings and two empty locator nodes are informational. Destructive texture/hierarchy optimization remains deferred until visual approval.
- `npm run references:check` regenerated the DC-9 reference scene and overview but remains red only because three unrelated locker photos under `art-source/references/local-private/` are not manifested.
- Owner visual approval is still open. The `GREYBOX — DC-9 CAPTAIN FLOW` badge remains until that decision, and Captain Mode gameplay/Model Y work remains deferred.

## 2026-07-12 Wings question emphasis and Captain's Hat celebration

- Rolex, baseball, Charging Bull, and Wings questions now render as semantic bold legends. Removed `e.g. 1000 hours` from the Wings input and replaced the repeated-wrong exact-answer reveal with a non-answer range clue; prior progress and accepted answer variants are unchanged.
- Correct Wings completion now fades to black and presents the real Captain's Hat with the Crew Qualification celebration language, 24-piece confetti, and one `Enter Pop T Captain Mode` action. Reduced motion shows the static card without animation/confetti; reload resumes the unclaimed celebration.
- Blender 5.1.2 rendered the exact `LOCKER_PROP_CAPTAINS_HAT` subtree from the unchanged runtime GLB into `public/images/captains-hat-celebration.png`: 1024×1024 RGBA, 563,765 bytes, SHA-256 `e426b329b273fcd593ed7bace8848a2573f8ed8bfb198b3063df63beb05d4f8c`, two meshes, and two materials. A repeat render produced identical decoded RGBA pixels.
- The locker GLB remains 44,288,740 bytes with SHA-256 `cf212389e0d04aa34a528cbc2af07e59b4acc9d4e98e386f725c78da43279c5c`; the master remains 50,237,876 bytes with SHA-256 `648a63df7a95de0cda11cf2c2ba2dcb988b621ab6ab04388f3ae460d0fc63f42`.
- Actual-browser proof: `/tmp/captain-hat-celebration-final-{1440,768,375}.png`. The final card has no horizontal overflow, the CTA remains focused, and there were no console/page errors. A no-cache real-GLB run received the exact model and PNG byte lengths before the responsive captures.
- Passed: Python compile, `npm run assets:check`, `npm run pipeline:evals` (6/6), `npm run check` (42/42 unit tests plus production build), focused locker Playwright, and full `npm run test:e2e` (12/12 in 4.2 minutes). Vercel publication and final owner visual approval remain open.

## 2026-07-12 Baseball seam, continuous camera, and Wings question pass

- Baked the owner-selected baseball XYZ rotation `(-45°, 0°, 90°)` through Blender. The supplied 4K Tripo geometry/materials, `(0.64, -0.48, 1.34)` placement, `0.30` scale, stable root, and exported collider remain unchanged; both curved vertical seam bands now face the player like `/mnt/2TBHDD/Downloads/realistic-vector-baseball.jpg`.
- Watch, Baseball, Bull, and Wings focus cues all report FOV `30.00` and camera-to-target distance `3.490`. The browser moves upward through the sequence without changing zoom; cards continue to open only after the relevant cue settles, and reduced motion snaps to the same final poses.
- Baseball now presents “Before the captain wore wings, he wore a glove.” Charging Bull uses a separate semantic bold question block. Wings changed from automatic inspection to a required native free-text question accepting `1000`, `1,000`, `1000 hour(s)`, and comma variants, with wrong/repeated-wrong hints and no progress loss.
- Schema remains version 5. Missing `lockerAttempts.wings` values normalize to zero for older saves, while already completed Wings/hat saves remain complete. The inspection-completion action and 3D bypass were removed.
- Wings exports `locker.memory.wings` / `question`. Current master: 50,237,876 bytes, SHA-256 `648a63df7a95de0cda11cf2c2ba2dcb988b621ab6ab04388f3ae460d0fc63f42`. Current GLB: 44,288,740 bytes, SHA-256 `cf212389e0d04aa34a528cbc2af07e59b4acc9d4e98e386f725c78da43279c5c`.
- Actual-browser evidence: `.cache/assets/locker/browser/locker-seam-flow-{watch,baseball-card,baseball-clean,bull-question,wings-question}-1440.png` and `locker-seam-flow-wings-{question,card}-{768,375}.png`. A no-cache response matched disk with `model/gltf-binary`; no console/page errors or horizontal overflow occurred. The 1440 Wings card clears the lower-right actions, and tests enforce non-overlap.
- Validation passed: `python3 -m py_compile tools/blender/import_locker_room_props.py`; `npm run asset:locker`; `npm run assets:check`; `npm run pipeline:evals` (6/6); `npm run check` (42/42 unit tests plus production build); focused accessible and real-GLB Playwright; full `npm run test:e2e` (12/12); and `git diff --check`.
- The real-GLB test now has a 240-second ceiling because the expanded four-memory path takes approximately 2.9 minutes on this 44 MB scene. Assertions were expanded, not relaxed. Visual acceptance remains exclusively with the owner.

## 2026-07-12 Locker centering and darker-lighting pass

- Moved the Blender-owned watch, Wings, and captain's hat roots from x=`0.42` to x=`0.56`; their colliders move with the stable roots. Baseball, Charging Bull, and both shelves were intentionally left unchanged.
- Updated affected Blender approval cameras plus the runtime watch/Wings focus targets. Reduced only locker-scene and approval-render lighting by approximately 12–15 percent; prop PBR materials and texture maps were not modified.
- Rebuilt via `npm run asset:locker`. Master: 50,238,219 bytes, SHA-256 `c284dce0a75f380270ffbd3bed38c009bdd7adb97794a269f6309daf5ef071c4`. GLB: 44,288,680 bytes, SHA-256 `96cf42d665fd41c3ecf4e384318251e42c1e99577eac5c1e7ebf93861c46a4d5`.
- Actual-browser proof: `.cache/assets/locker/browser/locker-centering-watch-1440.png` and `.cache/assets/locker/browser/locker-centering-overview-{1440,768,375}.png`. The real watch/Wings/hat nodes loaded, focus cues settled, a no-cache HTTP response matched the on-disk GLB bytes/hash, and no console/page errors or horizontal overflow were recorded.
- Validation passed: `python3 -m py_compile tools/blender/import_locker_room_props.py`; `npm run assets:check`; `npm run pipeline:evals` (6/6); `npm run check` (35/35 unit tests and production build); focused locker Playwright (5/5); full `npm run test:e2e` (12/12); and `git diff --check`.
- This is defect-screened comparison evidence, not agent visual approval. Final centering and darkness remain at the locker-room owner approval gate.

## 2026-07-11 Locker black-backdrop, jet-lag question, Wings, and Charging Bull pass

- Preserved the downloaded Wings and Charging Bull GLBs unchanged under `.cache/cockpit-pipeline/sources/locker-room/*/original/`; their SHA-256 values exactly match `/mnt/2TBHDD/Downloads`:
  - Wings: `71b308c7a2f25a6014a29613bf3cd33bf4a3883969fb4bec7e9067cf8be80af0`.
  - Charging Bull: `2858838f5d753571c5c8702fb061bf4005dd6e32460ed9a745c422a7e46fb7c8`.
- Neutral Blender 5.1.2 source inspection found one mesh, one material, and three native 1024 maps per prop. The Wings were reduced from 492,226 triangles to 48,000 and turned -90 degrees to face the player. The Bull was reduced from 498,476 to 59,999 triangles, kept at a -45-degree presentation angle, and placed on a dedicated matte-metal shelf.
- Added stable Blender-owned contracts and colliders: `LOCKER_PROP_WINGS` / `LOCKER_HITBOX_WINGS` / `locker.memory.wings`, and `LOCKER_PROP_CHARGING_BULL` / `LOCKER_HITBOX_CHARGING_BULL` / `locker.memory.chargingBull`.
- Regenerated `art-source/blender/locker_room_master.blend` at 30,705,426 bytes, SHA-256 `7c0b71e55f066d7c1b824e898614dddaad05c363d7d902a88114f933f545c0fb`.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:locker` - pass. Five known imported-environment transform warnings remain; glTF validation reported no errors and the expected generated-tangent warnings for normal-mapped imports.
- Generated `public/models/locker-room.glb` at 27,253,440 bytes, SHA-256 `3829754b92f9e06bf406fb7f2afce21336a3975ca422feb496e5cf88985cd69c`; the export report records 46 selected objects, four `game_id` parents, eight materials, and eighteen textures.
- A fresh request to `/models/locker-room.glb?v=tripo-locker-props-20260711` returned the same 27,253,440 bytes and SHA-256 as the file on disk.
- Runtime keeps the Wings, Bull, and hat as noninteractive textureless silhouettes until reducer state makes them available. The watch remains the only authored first interaction, and browser tests prove all four exported node names plus locked/revealed material states.
- Changed the locker canvas and fallback scene to black, removed `LOCKER REVEAL SCENE`, removed the bottom Pilot watch card, and added the compact native `Inspect watch` control beside the exact instruction `Begin with the pilot watch.`
- Replaced the watch prompt with the owner-provided Rolex GMT-Master/Pan Am question and immediate choices Brain fog, Motion sickness, Sleep deprivation, and Jet lag. Only Jet lag succeeds; the first and repeated wrong choices provide the time-zone and body-clock clues without erasing progress.
- Focused reducer/storage tests initially exposed an uppercase-normalization bug in visible choice labels. Lowercasing now happens before punctuation removal, and `jet lag`, `Jet Lag`, and `JET-LAG` are all covered.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass, 32/32.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/locker-room.spec.ts --workers=1` - pass, 5/5 in 1.2 minutes, including the real 27.25 MB GLB, watch collider, exact choices, progressive failure, keyboard focus, reload, reduced motion, retry, and accessible fallback.
- `npm run check` - pass; lint, typecheck, 32 Vitest tests, and production build completed.
- `npm run assets:check` - pass for all deployable GLBs; locker warnings are the documented generated-tangent rows plus informational unused UVs on the four colliders and shelf.
- `npm run pipeline:evals` - pass, 6/6. `python3 -m py_compile tools/blender/render_source_candidate.py tools/blender/import_locker_room_props.py` and `git diff --check` - pass.
- `npm run test:e2e -- --workers=1` - pass, 12/12 Chromium tests in 1.7 minutes, including both real Airbus and locker GLBs.
- Actual browser evidence inspected at 1440, 768, and 375 px with a computed `rgb(0, 0, 0)` shell, four watch choices, no locker memory tray, no obsolete badge, no horizontal overflow, and no console errors:
  - `.cache/assets/locker/browser/locker-black-props-1440.png`
  - `.cache/assets/locker/browser/locker-watch-jet-lag-question-1440.png`
  - `.cache/assets/locker/browser/locker-black-props-768.png`
  - `.cache/assets/locker/browser/locker-black-props-375.png`
- Remaining limitations: all four imported props remain owner-review candidates; baseball intake, the post-watch Wings/Bull sequence, exact Charging Bull personal story, Vercel preview, and owner visual approval remain open.

## 2026-07-11 Locker watch and captain's-hat Tripo intake

- Preserved the two Downloads sources unchanged under `.cache/cockpit-pipeline/sources/locker-room/*/original/`; SHA-256 values match the downloaded files exactly.
- Added deterministic neutral candidate rendering and owner-master prop intake through `tools/blender/render_source_candidate.py` and `tools/blender/import_locker_room_props.py`.
- Watch cleanup: 488,677 source triangles to 71,999 web triangles; three 4096 maps staged at 1024; stable `LOCKER_PROP_WATCH` / `LOCKER_HITBOX_WATCH` contract with `locker.memory.watch`.
- Hat cleanup: 488,608 source triangles to 69,999 web triangles; three 4096 maps staged at 1024; stable `LOCKER_PROP_CAPTAINS_HAT` / `LOCKER_HITBOX_CAPTAINS_HAT` contract with `locker.promotion.hat`.
- Replaced the temporary runtime hat geometry and runtime watch/hat hitboxes. The browser now raycasts the exported colliders, keeps the real hat visible with texture/normal maps removed in the locked state, and restores its authored material only after `lockerHatRevealed`.
- `BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:locker` - pass. Blender source validation retained five known imported-environment transform warnings; glTF validation reported no errors.
- Generated `public/models/locker-room.glb` at 21,852,396 bytes with SHA-256 `eaa919f60faeb3bc4cdae5dbac969b961ac783d75d91c23cb7c462945feb4e59`; export report records 39 selected objects and two `game_id` nodes.
- `npm run typecheck` and `npm run lint` - pass after wiring GLB-node checks, visible-mesh pointer events, and locked/revealed hat material state.
- `npx playwright test e2e/locker-room.spec.ts` - all five cases passed across the focused run plus repaired real-GLB rerun. The first pass exposed only an insufficient post-reload wait for the larger GLB; the assertion timeout was raised without weakening the node/material/click checks.
- `npm run assets:check` - pass for all deployable GLBs. Locker output has no errors; expected generated-tangent warnings remain for normal-mapped imports, with two informational unused-UV rows on the simple colliders.
- `npm run check` - pass; lint, typecheck, 33 Vitest tests, and the production build completed.
- `npm run test:e2e` - pass, 12/12 Chromium tests in 57.5 seconds, including both real Airbus/locker GLBs.
- `python3 -m py_compile tools/blender/render_source_candidate.py tools/blender/import_locker_room_props.py`, `npm run pipeline:evals` (6/6), and `git diff --check` - pass.
- Actual browser evidence inspected at 1440, 768, and 375 px with no console errors:
  - `.cache/assets/locker/browser/locker-wide-real-props-1440.png`
  - `.cache/assets/locker/browser/locker-watch-real-prop-1440.png`
  - `.cache/assets/locker/browser/locker-watch-real-prop-768.png`
  - `.cache/assets/locker/browser/locker-watch-real-prop-375.png`
  - `.cache/assets/locker/browser/locker-hat-revealed-1440.png`
- Checkpoint limitations, superseded by the current section above: the watch and hat were owner-review candidates; baseball, airline wings, and Charging Bull visuals were not yet imported; Vercel and owner approval remained open.

## 2026-07-11 Epic Airbus-to-locker transition and watch-first gate

- Replaced the immediate locker cut with a staged cinematic: 900 ms fade to black, pause, centered Captain's-journey sentence, asset-ready reveal, wide locker hold, and a 4.5-second cubic-eased move toward the lower watch area.
- Added `lockerIntroCompleted` in schema v5. Fresh Airbus handoffs play the cinematic; v3/v4 and completed/resumed locker saves keep their progress and skip it. Replay does not alter progression.
- Added visible Skip cinematic and Replay intro controls, Escape skip, modal focus trapping, watch focus restoration, reduced-motion short fades/immediate camera placement, and an accessible no-WebGL equivalent.
- Reducer and both presentation paths now expose only the watch for a new locker sequence. Baseball, wings, Charging Bull, hat claiming, and Captain Mode continuation remain locked until Tripo intake and later sequence authoring.
- At this checkpoint, added one warm practical light and the runtime placeholder `LOCKER_PROP_CAPTAINS_HAT_SILHOUETTE`; the later intake section above records its replacement by the real exported hat.
- Preserved the unchanged environment GLB at 12,850,484 bytes and SHA-256 `c5e79ba07c9947bd859d05e1cd47ca004b6b84915ff32b2648149ed5512f17bd`.
- `npm run check` - pass; lint, typecheck, 33 Vitest tests, and production build.
- `npm run test:e2e` - pass; 12 Chromium tests in 1.1 minutes. Coverage includes the real Airbus/locker GLBs, exact intro copy, skip/replay, watch-only gating, wrong/repeated-wrong hints, schema persistence, directed camera state, projected 3D watch hitbox, reduced motion, keyboard focus, retry, and accessible fallback.
- `npm run assets:check` - pass; no GLB errors. Existing generated-tangent warnings for the imported locker maps remain unchanged.
- `npm run pipeline:evals` - pass, 6/6; `git diff --check` - pass.
- Actual browser captures inspected with no console errors:
  - `/tmp/locker-epic-title-1440.png`
  - `/tmp/locker-wide-reveal-1440.png`
  - `/tmp/locker-watch-focus-1440.png`
  - `/tmp/locker-watch-focus-768.png`
  - `/tmp/locker-title-reduced-375.png`
  - `/tmp/locker-watch-focus-375.png`
- Browser repair notes: the first hat silhouette was visibly oversized and floating, so it was scaled down and placed deeper on the upper shelf before evidence was recorded. Full parallel e2e initially exceeded the default 30-second timeout while both large GLBs loaded; the real locker test now uses the same 75-second budget as the Airbus test without reducing assertions.
- Checkpoint limitation, superseded in part by the intake section above: watch/hat Tripo meshes had not yet been imported; the later keepsake order and Vercel/owner gate remain open.

## 2026-07-10 Locker room Sketchfab environment import

- Normalized owner-downloaded source archives under `.cache/cockpit-pipeline/sources/locker-room/**`.
- Imported Game Locker and Locker room bench into `art-source/blender/locker_room_master.blend` through `tools/blender/create_locker_room_proxy.py`.
- Preserved the original downloaded zips untouched and staged extracted/optimized glTF copies under cache.
- Texture staging: six 2048x2048 textures in the Blender source; the bench maps were downscaled from 4096x4096 and the Game Locker normal map was re-encoded for Blender compatibility.
- Runtime contract preserved through five React Three Fiber transparent hitboxes: `locker.memory.watch`, `locker.memory.baseball`, `locker.memory.wings`, `locker.memory.charging_bull`, and `locker.promotion.hat`.
- Owner-adjusted Blender export - pass; produced `public/models/locker-room.glb` at 12,850,484 bytes with 30 source-hierarchy objects, 2 materials, six 2048 textures, and SHA-256 `c5e79ba07c9947bd859d05e1cd47ca004b6b84915ff32b2648149ed5512f17bd`. glTF validation reported no errors and expected generated-tangent warnings.
- Removed the old visible proxy locker shell, shelves, cubby door, side lockers, and placeholder prop meshes from the source-present build. The downloaded Game Locker and bench are the visible scene assets; gameplay is preserved with invisible 3D hitboxes and HTML controls until the Tripo props arrive.
- Fixed the downloaded bench orientation, kept its wood planks facing upward, preserved the Game Locker's imported texture maps, and added balanced neutral runtime lighting so the weathered blue-gray material remains readable.
- `npm run assets:check` - pass; no GLB validation errors. Locker warnings are generated tangent-space rows from imported normal-mapped materials; existing informational unused-UV/empty-node output remains.
- `npm run check` - pass; lint, typecheck, 32 Vitest tests, and production build.
- `npx playwright test e2e/locker-room.spec.ts` - pass; 4 Chromium tests, including real GLB request and 3D canvas memory picking after the imported environment mesh.
- `npm run test:e2e` - pass; 11 Chromium tests.
- Visual evidence:
  - `.cache/assets/locker/previews/cam_locker_approval_hero.png`
  - `.cache/assets/locker/previews/cam_locker_approval_detail.png`
  - `/home/user1/Pictures/Screenshots/Screenshot from 2026-07-10 21-55-29.png` (owner target)
  - `/tmp/locker-reference-lit-browser-1440b.png` (actual browser proof)
- Remaining limitations: personal memory props are represented by invisible hitboxes until the owner-supplied Tripo assets arrive; owner visual approval and Vercel preview are still required for the locker room gate.

## 2026-07-10 Airbus loading and desktop viewer controls

- **Production approval:** The owner approved the current Airbus A320 First-Officer experience for production on 2026-07-10. The `A320 PLAYABLE PROOF` badge is removed; older approval-candidate limitations later in this report are retained as dated history and are superseded by this decision.
- Fairness/readability follow-up: centered and tightened the Airbus feedback dock, increased primary dock/question text to 16.8 px, moved Help and Fullscreen to the lower-right corner, removed the visible reset button, removed the Airbus Hint button, and added concise function descriptions to all five cards. The `R` keyboard reset remains available.
- Dock density follow-up: lowered the normal feedback dock to a 14 px bottom inset and placed Restart beside the status message, removing the mostly empty second row. The Airline Transport Pilot state still expands upward to fit its full question and answer form.
- Replaced answer-revealing target names with neutral accessibility-only drop-zone identifiers and faint, unlabeled silhouettes for the visible placement targets. Wrong placements give one generic retry message without naming the correct control.
- Silhouette follow-up: the placement layer now uses distinct low-detail outlines for the sidestick grip, paired thrust levers, gear handle, radio faceplate, and altitude display. No numbered target chip is rendered visually; focus/drag-over strengthens the glow without revealing text.
- Airline Transport Pilot input accepts `1500`, `1,500`, `1500 hour`, and `1500 hours`; the question explicitly requests hours and the celebration action now reads `Continue`.
- Workstation Brave screenshots at 1440 confirm readable card descriptions, a centered dock, neutral wrong feedback, and no visible target answer labels. DOM measurements confirm exact centering at 1280/1440/1920.
- `npm run check` passed with 21 Vitest tests after the fairness pass.
- Follow-up polish: added clean runtime art for briefing/loading/fallback, placed Help and Fullscreen in the lower-right corner, retained exact keyboard camera reset, added native Enter submission, and added a confetti qualification dialog with explicit locker continuation.
- Removed `AirbusLoadingFallback` greybox geometry. The shell loader now has a 600 ms minimum, waits for two framed render cycles, and resets on initial entry, retry, and full-game Restart.
- Workstation Brave rendered the real GLB and proved camera reset from a moved 76 degree view back to the approved transform and 68 degree FOV exactly.
- Browser evidence confirms the loader reappears after Restart, the compact dock remains centered while Help and Fullscreen occupy the lower-right corner, the opening uses the game-ready cockpit, and the celebration is visually correct at 1440 px.
- Focused browser tests passed for normal Enter qualification-to-locker flow, failed-load retry/fallback, Help focus/layout, and reduced-motion celebration reload.
- `npm run check` passed with 17 Vitest tests; assets, glTF, three A320 gates, pipeline evals (6/6), and `git diff --check` passed.
- Regression repair: removed the speculative pre-render WebGL context probe and permanent canvas-fallback latch after the owner reported the cockpit no longer worked correctly. The actual loaded and framed A320 scene is again the sole ready-state authority.
- Added one A320 loader using `public/images/a320-fo-view.png`, real GLB byte/progress reporting, and a first-rendered-frame readiness gate.
- Added recoverable `Retry 3D` and static-image accessible fallback paths for GLB/network failures.
- Added phase-aware viewer help, full-shell fullscreen, reset, typing-target shortcut suppression, seated A320 zoom clamped to 50-76 degrees, and continuous target projection.
- `npm run check` passed: lint, typecheck, 16 Vitest tests, and production build.
- Focused Playwright failure/retry/fallback and help/focus coverage passed: 2 tests.
- `npm run assets:check`, glTF validation, all three A320 gate validations, `npm run pipeline:evals` (6/6), and `git diff --check` passed; existing informational UV/empty-node rows remain.
- Loader evidence: `/tmp/a320-loading-1440-playwright.png` at 1440x900.
- Limitation: local full-GLB Playwright workers ended before reporting results for zoom/full-render capture. Agent-browser cannot render WebGL here. Those checks are not claimed as passing.
- Owner gate closed on 2026-07-10 after desktop browser review. The approved production baseline retains the documented imported-source limitations outside the five gameplay targets.
- Promotion validation: `npm run check`, `npm run assets:check`, glTF validation, all three A320 gates, and pipeline evals (6/6) passed. The real-GLB smoke passed in the first run; the three state-flow smoke tests passed together after updating stale non-leaking card assertions. The focused viewer-help layout/focus test passed after aligning it with the approved lower-right controls.
- CI browser-smoke repair: two long-running 38 MiB real-GLB interaction tests exhausted the GitHub runner and stalled Chromium input/locator operations while all six lightweight flows passed. CI now uses one Playwright worker and one bounded production smoke covering GLB delivery, first-frame readiness, the approved 68 degree camera, projected targets, and console health. Placement, persistence, and progression remain covered in the lightweight browser flows; seated zoom/reset retains workstation-browser evidence.

Update this file with actual evidence after every milestone. Do not replace failures with optimistic prose.

| Check | Expected | Actual | Status | Follow-up |
|---|---|---|---|---|
| `npm run lint` | No lint errors | Passed standalone and inside `npm run check` after A320 five-card feedback simplification | Pass | Rerun after every code change |
| `npm run typecheck` | No Typecheck errors | Passed standalone and inside `npm run check` after A320 five-card feedback simplification | Pass | Rerun after every code change |
| `npm run test` | Reducer and persistence tests pass | 16 Vitest tests passed after removing the Airbus clock card while retaining the ATP gate | Pass | Add focused tests per puzzle |
| `npm run build` | Vite production build succeeds | Passed inside `npm run check` after A320 five-card feedback simplification | Pass | Track runtime bundle and asset budgets |
| `npm run test:e2e` | Captain/locker/airbus loop, A320 GLB proof, immediate feedback, no clock card, ATP gate, and reload path pass in Chromium | Passed 4 Chromium tests after adding GLB-backed First-Officer target pivots and native keyboard placement proof | Pass | Keep browser tests current with each milestone |
| `npm run assets:check` | No invalid production GLBs | Passed for `public/models/airbus-first-officer.glb` and `public/models/dc9-cockpit.glb`; validator output has informational unused UV/empty-node rows only | Pass with info | Must validate every committed GLB |
| `npx gltf-transform validate public/models/airbus-first-officer.glb` | A320 cockpit GLB has no glTF validation errors | Passed with no errors or warnings; five informational unused `TEXCOORD_0` rows remain for target meshes | Pass with info | Rerun after every A320 GLB update |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` | Browser integration gate artifact is structurally valid | Passed after updating the gate for production-candidate screenshots at 375, 768, 1440, and 1920 px | Pass | Rerun after browser evidence changes |
| `npm run references:validate` | Reference manifest is structurally valid | Passed for 24 references; wrote `.cache/references/manifest-validation.json` | Pass | Rerun after reference-manifest edits |
| `npm run references:download` | Download only entries with explicit direct image URLs and record hashes | Passed; downloaded 4 Commons images and skipped the link-only Simulation Daily source | Pass | Use `--force` only after reviewing changed local files |
| `npm run references:contact-sheet` | Generate labeled DC-9-51 contact sheet | Passed; wrote `art-source/references/dc9-51/contact-sheets/dc9-51-contact-sheet.svg` | Pass | Inspect after new visual sources |
| `npm run references:brief` | Generate modeling brief from manifest | Passed; wrote `art-source/references/dc9-51/notes/modeling-brief.md` | Pass | Regenerate after manifest edits |
| `npm run references:check` | Offline aggregate check validates manifest, artifacts, Blender scene, and preview render | Passed after recursive manifest validation; rendered `.cache/references/dc9_reference_overview.png` with Blender 5.1.2 | Pass with warnings | Rerun before reference-pack PR |
| `BLENDER_BIN=/home/user1/.local/bin/blender blender --background --python tools/blender/setup_dc9_reference_scene.py` | Create/update reference scene without touching `dc9_master.blend` | Passed with Blender 5.1.2; saved `art-source/blender/dc9_reference_scene.blend`; warning only: `Material.use_nodes` deprecation for Blender 6.0 | Pass | Track Blender API deprecation before Blender 6 |
| `npm ci` | Install locked dependencies from a portable registry | Passed after normalizing 447 lockfile `resolved` URLs from the internal package gateway to `https://registry.npmjs.org/`; 396 packages installed, 0 vulnerabilities | Pass | Keep lockfile URLs portable |
| `npm run check` | Lint, typecheck, tests, and build pass | Passed after A320 pivot-backed target pass; lint, typecheck, 16 tests, and production build completed | Pass | Rerun after code changes |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pipeline schemas, stage contracts, gate examples, and workflow eval runner validate | Passed after agent gate validation upgrade; 7 tests | Pass | Rerun after pipeline contract changes |
| `npm run pipeline:evals` | Deterministic guardrail evals catch known agent workflow failures | Passed; 6/6 eval fixtures covered Tripo proxy promotion, missing Agent 0 authority, optimization contract breaks, aircraft mixing, and spoiler-leak protection | Pass | Add fixtures for new agent failure modes |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate ...` | Structured gate examples validate for reference authority, runtime contract, material optimization, and browser integration | Passed for all four checked-in example artifacts | Pass | Real milestone gates must validate their own artifact paths |
| `npm run references:validate` | Reference manifest covers checked-in images and verifies recorded hashes | Passed for 24 references | Pass | Rerun after reference-manifest edits |
| 768 / 1440 px visual check | No clipping or blocked controls on the active desktop/tablet target | Captured A320 five-card feedback ATP screenshots at 768 and 1440 px plus wrong-placement 1440 px with no console or page errors; mobile mode explicitly deferred by owner request | Pass | Mobile cockpit UI polish is a later pass |
| DC-9 realism review | Captain view reads as model-correct DC-9 | In-progress against greybox placeholders | In progress | Requires Blender milestone and owner approval |
| Airbus realism review | Correct model-specific cockpit | A320 Cockpit 2 browser proof now applies a runtime FO/right-seat camera lock and controlled app lighting because the exported game camera was centered and imported GLB lights overexposed the scene; owner visual approval still pending | In progress | Owner review before removing proof label or calling final production art |

## 2026-07-09 Airbus pivot-backed First-Officer target evidence

- Final approval-candidate captures were inspected at the approval-blocking 1440 and 768 px widths. The initial and target-visible pairs show the real shaded GLB and all five compact target pins aligned to their intended cockpit controls.
- Supporting checks captured a 375 px sanity view and 768 px reduced-motion view. The 375 px result is informative only, per owner scope.
- Browser evidence:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-initial-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-targets-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-initial-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-targets-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-sanity-375.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-reduced-motion-768.png`
- The installed `agent-browser` CLI verified the live Vite app with software-WebGL flags. No application errors were observed; the console retains the known Three `Clock` deprecation warning.

- Added five deterministic A320 First-Officer target pivots and invisible hitboxes:
  - `AIRBUS_A320_TARGET_SIDESTICK_PIVOT` / `AIRBUS_A320_TARGET_SIDESTICK_HITBOX`
  - `AIRBUS_A320_TARGET_THRUST_PIVOT` / `AIRBUS_A320_TARGET_THRUST_HITBOX`
  - `AIRBUS_A320_TARGET_GEAR_PIVOT` / `AIRBUS_A320_TARGET_GEAR_HITBOX`
  - `AIRBUS_A320_TARGET_RADIO_PIVOT` / `AIRBUS_A320_TARGET_RADIO_HITBOX`
  - `AIRBUS_A320_TARGET_ALTITUDE_PIVOT` / `AIRBUS_A320_TARGET_ALTITUDE_HITBOX`
- Assembly validation - pass; status `pass`, 5 label targets, 5 pivot-verified label targets, 5 total pivot-verified targets.
- Runtime target coordinate correction - pass; the assembly report records both Blender-space locations and intended runtime locations after Blender-to-glTF axis conversion.
- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_assembly_blender_build.py tools/blender/cockpit_pipeline/a320_assembly_job.py tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py` - pass.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; Blender 5.1.2, Node v26.3.0.
- `BLENDER_BIN=/home/user1/.local/bin/blender python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-assembly-job` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass.
- `BLENDER_BIN=/home/user1/.local/bin/blender python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; regenerated `public/models/airbus-first-officer.glb`.
- Runtime GLB SHA-256: `d40d50006091230a2a04372cf57ee4ee7f0bfa3bce4bc01ebda05259ca9e482b`; size `39,875,220` bytes.
- `.cache/assets/airbus/asset-report.json` - pass; validation passed with 121 warnings and 127 candidate notes from preserved imported-source limitations; export contract has 149 `game_id` nodes and 150 selected objects.
- Shading validation - pass; runtime node names and `game_id` metadata preserved, missing runtime nodes `[]`, material count `12`.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors or warnings, with five informational `UNUSED_OBJECT` rows for target mesh `TEXCOORD_0`.
- `npm run assets:check` - pass; A320 and DC-9 GLBs have no errors or warnings, with informational unused UV/empty-node rows.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests. The A320 proof verifies GLB-backed projected target mode, then completes card placement through the native keyboard equivalent.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- `git diff --check` - pass.
- Remaining limitation: owner visual approval is still required before removing `A320 PLAYABLE PROOF`; imported source mesh controls outside the five player-facing label targets remain deferred.

## 2026-07-09 Airbus desktop visual correction after owner feedback

Superseded experiment: the contained reference-image backing described below was rejected and removed. The final approval candidate renders the regenerated shaded GLB directly and uses asset-backed projected pins.

- Owner feedback identified the A320 desktop view as visually failed: the sidestick was cut off and the five target boxes were not aligned to the visible controls.
- Repaired the player-facing desktop composition to use the contained `public/images/a320-fo-view.png` backing at 96vw so the full sidestick and center pedestal remain visible at 1440x900.
- Kept `public/models/airbus-first-officer.glb` loaded for runtime contract and target collider proof, but hid non-collider GLB meshes in this temporary visual repair because the direct GLB-only render remained too dark for owner-facing target placement.
- Playwright desktop screenshot captured and inspected: `/tmp/a320-desktop-fixed.png`.
- Final measured target boxes at 1440x900:
  - sidestick `x=1267 y=536 w=86 h=153`
  - thrust `x=252 y=622 w=202 h=117`
  - gear `x=594 y=419 w=65 h=126`
  - radio `x=525 y=680 w=187 h=90`
  - altitude `x=295 y=173 w=302 h=50`
- `npm run typecheck` - pass during repair loop.
- Remaining limitation: this is a desktop visual correction, not final direct GLB-only visual approval.

## 2026-07-09 Airbus production-ready approval candidate evidence

- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py` - pass.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass earlier in this run; Blender 5.1.2, Node v26.3.0, Git LFS available, dirty worktree expected for this implementation.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass after making missing Sketchfab viewer/parity files optional and making the contact sheet skip absent optional parity renders.
- Shading validation - pass; runtime node names, `game_id` metadata, UV layers, and approved assembly immutability preserved; dimension drift `0.0`.
- Loose-fragment cleanup - pass; quarantined `AIRBUS_A320_STATIC_119_OBJECT_93_001`, `AIRBUS_A320_STATIC_120_OBJECT_94`, `AIRBUS_A320_STATIC_121_OBJECT_95`, and `AIRBUS_A320_STATIC_122_OBJECT_96_001` in `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/loose-part-review-report.json`.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; regenerated `public/models/airbus-first-officer.glb` through the normal asset exporter.
- Runtime/staged GLB SHA-256: `c94ada9dbfe7bdfb29d3a75071120a1823c6963a0de2b6d3f815900974d9ac8b`; size `39,849,104` bytes.
- `strings public/models/airbus-first-officer.glb` quarantine check - pass; no quarantined `OBJECT_93` through `OBJECT_96` runtime names found in the deployable GLB.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-shading/manifests/shading-complete.json` - pass; hashes verified.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- Playwright browser screenshots captured from `http://127.0.0.1:5173/` after real A320 GLB load; each capture had 5 targets, zero `CLOCK` cards, visible canvas, and no console or page errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-375-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1440-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1920-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo-reduced-motion.png`
- Remaining limitation: owner visual approval is still required before removing `A320 PLAYABLE PROOF` or calling this final production Airbus cockpit art; direct imported-control pivots remain deferred.

## 2026-07-04 Review repair evidence

- `git ls-files public/models/airbus-first-officer.glb public/images/a320-cockpit-integration-proof.png` - pass; both runtime assets are now tracked in the patch.
- `npm run assets:check` - pass; A320 GLB reported no errors, warnings, infos, or hints; existing DC-9 validator info rows remain.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed, including the A320 GLB 200-response integration proof.
- `npm run check` - pass; lint, typecheck, 9 Vitest tests, and production build completed.

## 2026-07-04 Broader worktree stabilization evidence

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass after refreshing report hashes.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-shading/manifests/shading-complete.json` - pass after refreshing the shaded `.blend`, report, and assembly input hashes.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass; 8 tests.
- `npm run pipeline:evals` - pass; 6/6 guardrail eval fixtures.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.

## 2026-07-04 PR conflict-resolution evidence

- `npm run check` - pass after merging `origin/main` into the A320 browser integration proof branch.
- `npm run assets:check` - pass after conflict resolution; A320 GLB reported no errors, warnings, infos, or hints, and existing DC-9 validator info rows remain.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-shading/manifests/shading-complete.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed, including the A320 GLB 200-response proof.

## 2026-07-04 Opening page refinement evidence

- `npm run check` - pass after replacing the generic whole-game briefing with a spoiler-safe A320 First-Officer opening screen.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed after updating the opening heading expectation.
- Playwright screenshots captured and reviewed at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-375.png`

## 2026-07-04 Player-facing title rename evidence

- `npm run check` - pass after changing the player-facing game title to `The Captain's Key`.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed after updating the opening heading expectation.
- Playwright screenshots refreshed and reviewed at 1440, 768, and 375 px with the new title:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-375.png`

## 2026-07-04 First-officer opening image evidence

- Promoted owner-provided screenshot `/home/user1/Pictures/Screenshots/F0-view.png` to `public/images/a320-fo-view.png` for the opening hero image.
- `npm run check` - pass after switching the opening hero image and tuning the crop toward the FO/right-seat station.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed.
- Playwright screenshots refreshed and reviewed at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-375.png`

## 2026-07-06 Airbus direct-GLB playable proof evidence

- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; exported the owner-cleaned shaded A320 source to `public/models/airbus-first-officer.glb`.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `python3 -m unittest tools.blender.cockpit_pipeline.tests.test_pipeline_contracts` - pass; browser integration schema example still validates after renaming the gate field to `spoilerProtectionChecked`.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 2 test files and 9 tests.
- `npm run build` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests including the A320 playable proof GLB check.
- `npm run assets:check` - pass; A320 has no errors, warnings, infos, or hints, with existing DC-9 validator info rows still present.
- Playwright screenshots refreshed and reviewed at 1440, 768, and 375 px with the real GLB visible from the exported First-Officer seat camera:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-playable-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-playable-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-playable-375.png`

## 2026-07-06 Airbus First-Officer playable repair evidence

- Generated a UI concept reference with the built-in image tool:
  - `/home/user1/.codex/generated_images/019f3663-2316-73a1-a793-3ac8fa73f84e/ig_030598814eb65800016a4b5f4875c0819995d4974d9af1afb6.png`
- Reproduced the pre-fix broken Airbus phase locally:
  - `.cache/screenshots/pre-fix-airbus-1440.png`
- `npm run test -- src/game/state.test.ts` - pass; 7 reducer tests including card move/retry behavior.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 2 test files and 10 tests.
- `npm run build` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests cover the A320 GLB response, no Airbus comboboxes, card/target placement, full game progression, and reload persistence.
- `npm run assets:check` - pass; A320 has no errors, warnings, infos, or hints, with existing DC-9 validator info rows still present.
- `npm run check` - pass; lint, typecheck, 10 Vitest tests, and production build completed.

## 2026-07-06 Airbus wide runtime camera evidence

- Changed the Airbus gameplay camera to preserve `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` position/quaternion while using a 68 degree runtime FOV.
- Retuned mobile target spacing for the wider cockpit view.
- Playwright direct-GLB screenshot pass captured and reviewed canvas opacity 1 with no console errors at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-375.png`

## 2026-07-06 Airbus top tray simplification evidence

- Removed the visible `Place each cockpit label` heading while preserving a screen-reader-only section heading.
- Moved the Airbus card tray closer to the top of the viewport and reduced card height.
- Removed `Ready` and `Decoy` from unplaced cards; card faces now show only the label until placed.
- Playwright screenshot pass captured 1440, 768, and 375 px with canvas opacity 1, no console errors, no visible heading, and `CLOCK` card text reduced to `CLOCK`:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-375.png`
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium tests.
- `npm run lint` - pass.
- `npm run test -- src/game/state.test.ts` - pass; 7 reducer tests.

## 2026-07-06 Airbus direct cockpit hotspot evidence

- Replaced visible cockpit placeholder slots with transparent HTML drop hotspots aligned to the A320 cockpit parts.
- Dragging a card over a part now applies an outline highlight to that part; dropping the card directly on the part assigns it.
- The accessible click/keyboard path is preserved through the same named target buttons.
- Retuned hotspot geometry so the sidestick outline sits on the sidestick itself, thrust/radio are aligned to their rendered cockpit areas, altitude sits on the glare-shield/FCU strip, and narrow portrait view uses a wider runtime FOV so the sidestick is visible before highlighting.
- Updated gameplay after owner feedback: valid and decoy cockpit objects both accept cards, no cockpit object is visually highlighted until a card is dragged over it, and correctness is judged only after all six cards are placed.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests, including hidden pre-drag hotspots, hotspot drag-enter highlight, decoy placement, full Verify-to-locker transition, and reload persistence.
- `npm run lint` - pass.
- `npm run test -- src/game/state.test.ts` - pass; 8 reducer tests including decoy placement without early grading.
- `npm run check` - pass; lint, typecheck, 11 Vitest tests, and production build completed.
- `git diff --check` - pass.
- Playwright screenshot pass captured desktop/tablet widths 1440 and 768 px with canvas opacity 1, no console errors, no pre-drag cockpit highlights, no visible `Drop card` cockpit placeholders, and no visible `Place each cockpit label` heading:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
- Sidestick hotspot highlight screenshot captured after GLB load:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-hotspot-highlight-1440.png`
- Decoy hotspot highlight screenshot captured after GLB load:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-decoy-highlight-1440.png`
- Playwright browser QA used because the Browser plugin runtime was not available in this session. Manual script checks passed for pointer drag placement, keyboard-only placement, wrong-card retry, reduced-motion mode, and `?skip3d=1` completion with no console errors.
- Playwright screenshots captured and reviewed at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-repair-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-repair-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-repair-375.png`
- Superseded limitation: the static source-review cockpit backing has been removed from the Airbus gameplay phase by the direct-GLB camera repair below. Owner visual approval, individual pivots, and live display treatments remain future work.

## 2026-07-06 Airbus direct-GLB camera repair evidence

- `/home/user1/.local/bin/blender --version` - Blender 5.1.2.
- Blender source camera probe rendered `.cache/screenshots/a320-direct-camera-before.png`; reimported GLB camera probe rendered `.cache/screenshots/a320-imported-glb-camera.png`.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; exported `public/models/airbus-first-officer.glb`.
- `public/models/airbus-first-officer.glb` - 35,098,268 bytes; SHA-256 `033438f0674423356a64e1b2d9f9430072e65790670ab5cdbbcd62c61b9eedff`.
- `.cache/assets/airbus/validation.json` - pass; 147 existing proof-stage warnings remain for unapplied/unverified candidate meshes, with no `CAM_AIRBUS_*` camera metadata warnings.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run test -- src/game/state.test.ts` - pass; 7 reducer tests.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium tests cover the A320 GLB response, no Airbus comboboxes, card/target placement, real Verify-to-locker transition, and reload persistence.
- `npm run assets:check` - pass; A320 has no errors, warnings, infos, or hints, with existing DC-9 validator info rows still present.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- Manual Playwright QA passed for wrong-card retry, keyboard-only placement, hint, reduced-motion mode, and real Verify-to-locker completion with no console errors.
- Direct-GLB Playwright screenshots captured and reviewed with canvas opacity 1 and no console errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-375.png`
- `npm run check` - pass; lint, typecheck, 10 Vitest tests, and production build completed.

## 2026-07-07 Airbus ready gate and ATP deferral evidence

- Hid the Airbus card tray, cockpit hotspots, dock controls, and ATP question until the A320 GLB camera-ready callback fires; the early load state now shows only cockpit loading text.
- Deferred the ATP flight-hours question until all six cards are placed and the five real cockpit controls are correct.
- Removed the `1500` placeholder and added stale-save cleanup so Airbus saves reload with a blank ATP answer.
- Removed the temporary browser-only display reflection after owner review; the FO-side display now comes only from the GLB render.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 13 focused reducer/storage tests.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests cover hidden initial ATP, blank ATP reveal, wrong full-board ATP hiding, real Verify-to-locker transition, and reload persistence.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `git diff --check` - pass.
- Playwright ready-gated screenshot pass captured desktop/tablet widths 1440 and 768 px with early state card count 0, ATP count 0, settled canvas opacity 1, no console errors, no ATP question before board completion, and the A320 cockpit visible behind the cards:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-ready-gated-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-ready-gated-768.png`

## 2026-07-07 Vercel cockpit preview loading evidence

- Diagnosed protected preview `dpl_HQmr9mCGDGRbyAgRrTiGTzdCx619`; Vercel build was Ready and produced the expected Vite app shell and JS chunk.
- `npx vercel curl /models/airbus-first-officer.glb --deployment https://cockpit-escape-room-oo8parvv2-ottoagent007-gmailcoms-projects.vercel.app -- --head` showed the deployed Airbus runtime GLB was only 133 bytes, matching the Git LFS pointer instead of the 35,098,268-byte cockpit model.
- `git cat-file -s HEAD:public/models/airbus-first-officer.glb` returned 133 and `git show HEAD:public/models/airbus-first-officer.glb` showed the `version https://git-lfs.github.com/spec/v1` pointer for SHA-256 `033438f0674423356a64e1b2d9f9430072e65790670ab5cdbbcd62c61b9eedff`.
- Updated `.gitattributes` so deployable `public/models/*.glb` files are normal Git blobs while source/staged `.glb` files remain under LFS.
- Staged tree check confirmed `public/models/airbus-first-officer.glb` is now a 35,098,268-byte plain Git blob whose first bytes are `glTF`.
- `git diff --check` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run assets:check` - pass; A320 has no errors, warnings, infos, or hints, with existing DC-9 validator info rows still present.
- `npm run build` - pass.
- Pushed commit `c1c5981` and Vercel built preview `dpl_2DuN1koZ8WxSPHzVvbqefTYxYa65` from commit `c1c5981`.
- `npx vercel curl /models/airbus-first-officer.glb --deployment https://cockpit-escape-room-2ig7xn4kg-ottoagent007-gmailcoms-projects.vercel.app -- --head` - pass; deployed GLB now returns `content-type: model/gltf-binary` and `content-length: 35098268`.

## 2026-07-08 Airbus production-readiness browser lighting proof

- Added `plans/0004-a320-cockpit-production-readiness.md` for the A320 browser-proof checkpoint.
- Tuned `src/scenes/PrototypeScene.tsx` so the A320 runtime uses a named `AirbusRuntimeLighting` rig with ambient, hemisphere, directional, and point fills.
- Kept the exported `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` camera path and retained constrained FO OrbitControls with no pan, no Airbus zoom, a fixed look distance, and explicit polar/azimuth limits.
- Switched Canvas shadows to `percentage`, removing the repeated deprecated `PCFSoftShadowMap` warning from new captures; the remaining browser warning is the pre-existing Three `Clock` deprecation.
- No generated GLBs were edited or regenerated for this checkpoint.
- Baseline browser screenshots captured at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-375.png`
- Post-change browser screenshots captured at 1440, 768, and 375 px with no app console errors and no pre-drag hotspot outlines:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-375.png`
- Browser plugin tools were not available in this session, so Playwright was used for browser evidence.
- A direct mouse-drag orbit screenshot attempt was discarded because the Playwright page closed during the action; orbit behavior is covered by code review of `LimitedOrbitControls` constraints and the GLB/canvas smoke path.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests cover the A320 GLB load, hidden initial ATP, hotspot drag-enter highlight, decoy placement, Verify-to-locker transition, and reload persistence.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, with existing DC-9 informational rows still present.
- `git diff --check` - pass.
- Remaining limitation: owner visual approval is still required before removing `A320 PLAYABLE PROOF` or treating this as final production Airbus cockpit art.

## 2026-07-08 Airbus FO-view likeness correction

- Owner clarified that the production cockpit should keep the wide gameplay composition from `airbus-production-lighting-1440.png`; `public/images/a320-fo-view.png` is the visual likeness reference for material/render treatment, not a tighter camera-framing target.
- Rechecked the live Sketchfab model page for `A320 Cockpit 2`; the public page still identifies the same downloadable CC Attribution source model, but the detailed render stack remains better captured in the repo's extracted parity files.
- Reused the earlier A320 Sketchfab parity evidence: Studio-style lighting, three directional lights, matcap/reflection contribution, SSAO, SSR/TAA reference behavior, sharpen, vignette, and grain were recorded in `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-viewer-settings.json` and related shading reports.
- Added an Airbus-only dependency-free post-process path in `src/scenes/PrototypeScene.tsx` with Three example passes: `EffectComposer`, `RenderPass`, `SSAOPass`, `ShaderPass`, and `OutputPass`.
- The custom final shader applies subtle sharpen, subdued vignette, and tiny static grain. It is intentionally static so reduced-motion behavior is not affected.
- Restored the wide runtime camera constants to `68` degrees for desktop/tablet and `92` degrees for narrow portrait.
- Tested a runtime material/environment parity direction and backed it out because it over-brightened the panel and drifted farther from the dark blue-gray FO-view reference. The remaining visual delta should be handled in a Blender/source material pass, not by broad runtime material mutation.
- No `.blend` source, generated GLB, runtime node names, pivots, hierarchy, or `game_id` metadata changed in this checkpoint.
- Wide post-process screenshots captured at 1440, 768, and 375 px with no app console errors and no pre-drag hotspot outlines:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-375.png`
- Final current-state material-parity screenshots recaptured at 1440, 768, and 375 px with no app console errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-375.png`
- 1920x1080 comparison capture against the `FO-view.png` reference size:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-sketchfab-post-1920.png`
- Browser plugin tools were not available in this session, so Playwright was used for browser evidence.
- Console notes: captures still show the pre-existing Three `Clock` deprecation warning and occasional WebGL `ReadPixels` performance warnings from screenshots; no app errors were observed.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, with existing DC-9 informational rows still present.

## 2026-07-08 A320 production-ready approval candidate

- Owner rejected this A320 Cockpit 2 shading pass on 2026-07-08. The tracked `a320-cockpit-2-shading` build, job, stage input, asset report, and preview-render artifacts were removed from the working tree so they are not mistaken for approval evidence.
- Added `plans/0005-a320-cockpit-production-ready-candidate.md` for the owner-reviewable A320 production-candidate milestone.
- Updated `tools/blender/cockpit_pipeline/a320_shading_job.py` and `tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` so the A320 shading pass consumes `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-material-parity-summary.json` as a formal input.
- The regenerated source material pass preserves source texture links and UVs, maps cached Sketchfab material-channel values into portable Principled BSDF roughness/metallic/base/emissive settings, and records matcap/reflection contribution as material metadata.
- Updated `tools/blender/validate_scene.py` so imported visual candidates without runtime `interaction` metadata are reported as `candidateNotes`; real warnings now focus on imported scale and no-UV source limitations.
- First `npm run test:e2e -- e2e/smoke.spec.ts` attempt failed because the regenerated GLB lacked `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`, leaving the Airbus card tray gated behind cockpit loading. The Blender shading script now recreates and validates that runtime camera before export.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass after runtime-camera repair.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; exported `public/models/airbus-first-officer.glb`.
- `public/models/airbus-first-officer.glb` - 39,871,920 bytes; SHA-256 `97deb0f7f2dc9fba3e9b046b621c6afe35a2dda4d6752f6a48eb8b073206fcc2`.
- `.cache/assets/airbus/asset-report.json` - pass; Blender 5.1.2, 144 selected export objects, 140 `game_id` nodes, 129 imported-source warnings, 131 visual-candidate notes, and approval cameras `AIRBUS_A320_CAM_COMPLETE_INTERIOR_APPROVAL` plus `AIRBUS_A320_CAM_FIRST_OFFICER_APPROVAL`.
- `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/validation-report.json` - pass; runtime node names, `game_id` metadata, UV layers, source texture links, approved assembly immutability, and reimport validation all passed.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass after refreshing the runtime-contract artifact hash.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run assets:check` - pass; A320 GLB had no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 13 Vitest tests.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass after runtime-camera repair; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- Superseded Blender/source approval renders and Playwright production-candidate screenshots were removed after owner rejection.
- Remaining limitation: this is an owner-reviewable approval candidate, not final visual approval. Keep `A320 PLAYABLE PROOF` until owner approval is recorded.
- Remaining limitation: imported source meshes still have documented unapplied-scale/no-UV warnings and visual-candidate metadata notes; direct 3D control pivots are not promoted in this pass because browser hotspots remain the supported accessible interaction path.

## 2026-07-08 A320 five-card feedback simplification

- Added `plans/0006-a320-five-card-feedback-simplification.md` for the Airbus gameplay/UI simplification.
- Removed the active `CLOCK` card from Airbus First-Officer onboarding.
- Restored the ATP answer input and Verify button after owner correction; they appear only after all five labels are correct.
- The active Airbus flow now uses five visible label cards: `SIDESTICK`, `THRUST`, `GEAR`, `RADIO`, and `ALTITUDE`.
- Visible placement boxes now show immediate feedback: green for correct labels and red for wrong labels. Wrong labels remain recoverable by selecting or dragging another card.
- Completing all five labels now reveals the ATP question; entering `1500` advances to the locker and records `firstOfficer` completion.
- Kept legacy clock and decoy state fields for saved-game compatibility. A stale Airbus ATP answer is cleared on load so the question is answered fresh.
- Moved the Airbus status/instructions dock to the lower-right and reduced its desktop/tablet footprint.
- Owner clarified during implementation to forget mobile mode. Mobile cockpit UI polish is deferred and is not a pass/fail criterion for this checkpoint.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests cover no `CLOCK` card, ATP hidden until labels are correct, immediate red/green placement feedback, recovery, ATP submission, locker transition, GLB load, and reload persistence.
- `npm run lint` - pass.
- `npm run test` - pass; 16 Vitest tests.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- Superseded five-card screenshots were removed from the working tree at owner request. Use `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-1440.png` as the visual pickup baseline until a replacement proof is captured.

## 2026-07-08 A320 rejected-artifact cleanup and dock repair

- Deleted the rejected `a320-cockpit-2-shading` tracked artifact families from the working tree: shaded build outputs, shading job manifest/approval, shading input recipes, shading asset reports, and shading preview renders.
- Removed untracked bad browser evidence captures from the latest pass while keeping `airbus-production-wide-sketchfab-post-1440.png` as the owner-selected pickup baseline.
- Tightened the Airbus instructions dock so it stays as a compact lower-right panel instead of spanning the bottom of the viewport.
- Verified the active Airbus UI renders exactly five cards and no `CLOCK` card.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `git diff --check` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- Local-only Playwright proof: `.cache/screenshots/a320-right-dock-no-clock-1440.png`; viewport 1440 x 900, dock box `x=1081.6 y=716.3 width=336 height=161.3`, no console errors, cards `SIDESTICK`, `THRUST`, `GEAR`, `RADIO`, `ALTITUDE`, and `CLOCK` count 0.

## 2026-07-08 A320 FO-seat camera and color repair

- Confirmed the owner-reported dev server failure in `.cache/screenshots/current-a320-dev-before-fix-1440.png`: centered between-seat camera, nearly black/white cockpit, five cards, no `CLOCK` card, and compact lower-right dock.
- Root cause for the wrong viewpoint: exported `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` is centered at `x=0`. `src/scenes/PrototypeScene.tsx` now applies a runtime FO/right-seat offset and inward yaw before locking the Airbus look controls.
- Root cause for the washed render: the GLB imports high-intensity `Sun` directional lights, which were stacked with app lighting. Runtime now disables imported GLB lights and uses controlled Airbus scene lights.
- Browser proof after repair: `.cache/screenshots/a320-fo-seat-color-final-1440.png`; FO/right-seat biased view, colored A320 panels/controls, five cards, no `CLOCK` card, projected target layer, and compact lower-right dock.
- Responsive evidence: `.cache/screenshots/a320-fo-seat-color-final-768.png` and `.cache/screenshots/a320-fo-seat-color-final-375.png`; both showed five cards, no `CLOCK` card, projected target layer, and no page console errors.
- Blender cleanup boundary: no live Blender add-on listener was available on `127.0.0.1:9876`; only the `blender-mcp` wrapper process was running. Background inspection of `art-source/cockpit-pipeline/stages/assembly/output/a320-cockpit-2-assembly/a320-cockpit-2-assembly.blend` found one scene, one collection, zero cameras, and no suspicious temp/default objects to delete.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.

## 2026-07-08 A320 saved FO camera recovery

- Looked back through memory, git history, and PRs after the owner flagged that the Blender view should not require reconstructing the camera.
- Memory and PR #31 confirmed the intended workflow: open `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend` and use its saved `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`.
- Recovered the old shaded `.blend` LFS object from commit `d23ad95` into `.cache/blender-history/a320-cockpit-2-shaded-d23ad95.blend`.
- Background Blender inspection of that recovered file found active `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`: location `(0.167669, -0.695658, 0.140411)`, Euler rotation `(1.367064, 0, 0.282213)`, lens `50`, and camera angle `0.691111`.
- Blender MCP live scene was switched to that recovered file and exact saved camera with material preview and overlays off.
- Updated `tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` so future shaded exports write the recovered saved FO camera transform instead of the centerline camera.
- Updated `src/scenes/PrototypeScene.tsx` so the temporary FO offset/yaw repair only applies when the loaded legacy GLB camera is still centered. Future regenerated GLBs with the saved FO camera will not be double-offset.
- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` - pass.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- Live browser verification on the PR working tree: Vite at `http://127.0.0.1:4187/`, Playwright 1440 x 900 capture `.cache/screenshots/current-a320-fo-mode-live-1440.png`; FO/right-seat biased colored cockpit view, projected target layer, five cards, no `CLOCK` card, and no page console errors. The screenshot remains local cache, not committed preview evidence.
- PR validation batch before commit:
  - `git diff --check` - pass.
  - `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py tools/blender/validate_scene.py` - pass.
  - `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
  - `npm run assets:check` - pass; A320 reports no glTF errors/warnings/infos/hints, and DC-9 retains existing informational unused texcoord/empty-node rows.
  - `npm run pipeline:evals` - pass; 6/6 eval fixtures.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate ...` - pass for runtime contract, material optimization, and browser integration artifacts.
  - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
  - `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.

## 2026-07-10 - Locker room reveal proxy milestone

Historical checkpoint; the 2026-07-11 transition and Tripo-intake sections above supersede its current-state limitations.

### Delivered

- Replaced the procedural locker sphere with a validated `LOCKER_ROOT` GLB, four stable memory contracts, and a gated captain's-hat contract.
- Preserved the personalized 1,000-hour and Anthony Munoz questions with natural answer variants, safe repeated-wrong clues, and no progress loss.
- Added Wings and Charging Bull inspection memories, an any-order four-memory gate, an upper-cubby reveal, and an explicit promotion continuation into Captain Mode.
- Added schema-v4 persistence and a v3 migration that preserves First-Officer and completed later-phase progress.
- Added keyboard/native HTML equivalents, live feedback, reduced-motion behavior, responsive locker UI, real 3D prop picking, and GLB retry/accessibility fallback.

### Asset evidence

- Blender 5.1.2; `npm run asset:locker` passed with 0 scene errors and 0 scene warnings.
- `public/models/locker-room.glb`: 430,148 bytes, 51 selected objects, 5 `game_id` nodes, 8 materials, 0 textures, no destructive optimization.
- Blender approval renders: `.cache/assets/locker/previews/cam_locker_approval_hero.png` and `cam_locker_approval_detail.png`.
- Browser proof: `/tmp/locker-real-fixed3-1440.png`; generated proxy geometry remains visibly labeled as the locker reveal scene.

### Validation

- `npm run check` - pass: lint, typecheck, 32 Vitest tests, production build.
- `npm run assets:check` - pass; informational unused UV/empty-node rows only.
- `npm run pipeline:evals` - pass, 6/6.
- `npm run test:e2e -- e2e/locker-room.spec.ts` - pass, 4/4 after loader-fallback coverage was added.
- Full `npm run test:e2e` - pass, 11/11 including final locker failure/retry/fallback coverage.
- `git diff --check` - pass.

### Remaining delta

- Import and clean the owner-supplied Tripo watch, baseball, wings, Charging Bull, and captain's hat while preserving the tested contract parents and identifiers.
- Replace the explicit Charging Bull story placeholder with Pop T's exact investing advice.
- Capture a Vercel preview and owner approval before removing the proxy label or advancing the visual gate. Refreshed local evidence is `/tmp/locker-proxy-1440.png`, `/tmp/locker-proxy-768.png`, and `/tmp/locker-proxy-375.png`.

## 2026-07-11 Locker Bull-to-Wings reveal

- Blender 5.1.2 rebuilt `art-source/blender/locker_room_master.blend` and `public/models/locker-room.glb` through `npm run asset:locker`.
- The Charging Bull now occupies the middle position on `LOCKER_ENV_MEMORY_SHELF`; the Wings occupy the upper position. Stable node names, colliders, and `game_id` values are unchanged.
- Correct Watch completion automatically logs/reveals the Bull and settles `bull-focus`; `Continue to airline wings` logs/reveals the Wings and settles `wings-focus`.
- Removed the passive next-memory and hidden-hat sentences. The Watch dialog title is `Rolex GMT-Master`; Bull and Wings use owner-supplied copy.
- GLB: 27,253,492 bytes; SHA-256 `03d13d9e596ad77b7ca540f19a4826316d7467bdd7fe4d978bf48e71abcbf757`. Cache-busted browser bytes matched disk exactly.
- Pass: 33/33 focused state/storage tests, 5/5 focused locker Chromium tests, `npm run check`, 12/12 full Chromium tests, `npm run assets:check`, 6/6 pipeline evals, and `git diff --check`.
- Visual proof inspected at 1440, 768, and 375 widths: `.cache/assets/locker/browser/locker-bull-focus-1440.png` and `locker-wings-focus-{1440,768,375}.png`.
- Browser console had no application errors. Observed warnings were the existing Three.js Clock deprecation and screenshot-time WebGL `ReadPixels` stalls.
- Remaining gate: Vercel preview and owner visual approval.
- Baseball candidate intake: preserved from `/mnt/2TBHDD/Downloads/baseball+3d+model.glb` at SHA-256 `75dda2bf01c8c8863820ec25750ef2f1b15940ccfeb1b1c56d8d0b548d5ab19e`. The Tripo source has one 1,971,968-triangle mesh and three 1024 textures; it is not runtime-ready.

## 2026-07-11 Baseball memory import and playable reveal

- Imported the preserved baseball source through Blender 5.1.2 with stable nodes `LOCKER_PROP_BASEBALL`, `LOCKER_PROP_BASEBALL_MESH`, and `LOCKER_HITBOX_BASEBALL`; the source SHA-256 is `75dda2bf01c8c8863820ec25750ef2f1b15940ccfeb1b1c56d8d0b548d5ab19e`.
- Updated the ordered locker loop to watch → baseball question → Charging Bull → Wings → captain's hat while preserving schema version 5, local saves, wrong-answer retries, accented/unaccented Anthony Muñoz answers, keyboard/native controls, reduced motion, and fallback mode.
- `npm run asset:locker` - pass; `npm run assets:check` - pass; `npm run pipeline:evals` - pass (6/6); `npm run check` - pass; `npm run test:e2e -- e2e/locker-room.spec.ts` - pass (5/5); `git diff --check` - pass.
- Runtime GLB: 31,326,884 bytes; SHA-256 `ea8c3795e3ad0bc90556a056672a539f6431044ccbe66bd70636f50512184338`. Browser response bytes matched disk, canvas exposed `LOCKER_PROP_BASEBALL`, and Playwright reported no application console errors.
- Blender approval render: `.cache/assets/locker/previews/cam_locker_approval_baseball.png`. Actual-browser captures inspected at 1440, 768, and 375 widths: `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, `/tmp/baseball-locker-375.png`. The revealed screenshot shows the baseball on the lower shelf left of the watch with the accessible question open.
- The importer target is 48,000 triangles, but Blender's decimator produced 113,634 for this candidate; it remains an owner-review optimization delta. The candidate has a visibly speckled surface in the approval render and browser capture.
- `agent-browser` was attempted but Chrome could not launch due the host sandbox restriction (`No usable sandbox`); repository Playwright was used as fallback. No commit or deployment was made. Remaining gate: owner visual approval.

## 2026-07-11 Locker layout revision

- Moved the baseball to `(0.05, -0.48, 1.34)` on a dedicated shelf above the watch, Charging Bull to `(0.42, 0.48, 2.03)` on the higher shelf, and Wings to `(0.42, -0.06, 2.55)`.
- Regenerated the master and GLB through Blender/`npm run asset:locker`. Final GLB: 29,539,664 bytes; SHA-256 `7afc3778aca9e1518d7285379a8f70a334969b4a51e76c816f95b065a40efb4e`.
- Inspected updated Blender renders and actual-browser captures at 1440/768/375. Browser bytes matched disk, `LOCKER_PROP_BASEBALL` remained present and revealed, and no console errors were reported.
- The current baseball remains a temporary owner-review candidate; a future baseball download can replace its source while preserving the stable contract.

## 2026-07-11 Baseball source replacement

- Preserved the previous baseball source and staged the new download at `.cache/cockpit-pipeline/sources/locker/baseball/original/baseball+3d+model-20260711.glb`.
- New source hash: `1fb4a5ae2ced1e9500b4730127da3febdc03787af886a314756e8a61e8de06cd`; source size 16,385,168 bytes; runtime baseball reduced to 20,492 triangles with 1024px staged textures.
- Regenerated runtime GLB: 25,025,584 bytes; SHA-256 `23a8b567e1f511842a71a1d2b8d5a92e2d2a9b0e572021801de26a7f16d12911`.
- Browser evidence: runtime bytes matched disk, `LOCKER_PROP_BASEBALL` was present and revealed, and no application console errors were reported. The new baseball is visibly seated on the requested shelf.
## 2026-07-11 Locker baseball/Bull visual and question repair

- Moved the baseball and shelf to the right locker bay at `(0.64, -0.48, 1.34)` / `(0.64, -0.48, 1.17)`, tightened the opening watch macro camera, and reduced the desktop status card to 20rem.
- Anthony Muñoz is now a four-choice question with Orlando Pace, Johnathan Ogden, and Art Shell. Charging Bull now follows baseball as a required multiple-choice gate: Warren Buffett, Benjamin Franklin, Albert Einstein (correct), and John D. Rockefeller.
- New baseball material treatment keeps only the base-color texture, enables smooth shading, and removes the candidate normal/roughness/metallic links. Remaining grain is intrinsic to the base-color image and is recorded as owner-review art limitation.
- Blender master and deployable GLB were regenerated without manual GLB edits. Final GLB: 23,834,824 bytes, SHA-256 `3678d8c797d9fe7cf65a8b91bcac0023a653c085df66009b574a9e7825f539e4`.
- `npm run assets:check` passed; `npm run pipeline:evals` passed 6/6; `npm run check` passed; `npx playwright test e2e/locker-room.spec.ts` passed 5/5; `git diff --check` passed.
- Actual-browser Playwright evidence at 1440, 768, and 375 px: `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, `/tmp/baseball-locker-375.png`. Runtime bytes matched disk, real baseball node was present/revealed, and no console errors were reported.

## 2026-07-11 Locker prop grain repair

- Research identified high-frequency normal/roughness/base-color maps as the primary grain source; glTF materials for baseball, Bull, and Wings now use controlled solid matte materials in Blender and the runtime defensively disables their maps.
- The baseball scan also had perforated micro-geometry, so Blender replaces only its runtime candidate mesh with a smooth centered sphere under the same stable node and collider contract. The original source GLB remains untouched.
- Browser evidence after the repair: `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, `/tmp/baseball-locker-375.png`; all three props render cleanly, runtime bytes match disk, and no console errors were reported.
- Final deployable GLB: 20,723,224 bytes, SHA-256 `108d988705a7924a042959a7c5bae3ea31a0bc5e63830d935aadc55c6451bd23`; source baseball remains preserved separately from the 2,208-triangle smooth review proxy.

## 2026-07-11 Corrective locker prop visual pass

- Rejected the owner-disapproved generic white baseball and flat materials. Rebuilt the baseball with clean leather plus two red curved seams, voxel-cleaned the Bull into a bronze silhouette, and retained Wings detail with a stylized gold atlas.
- Actual-browser evidence at 1440/768/375 shows no white UV blocks, no scan speckle on Bull, readable red baseball seams, crisp gold Wings, matching GLB response bytes, and no console errors.
- Final GLB: 26,594,784 bytes, SHA-256 `893ae4dcd628ab43af1d3f9a9b50f5fcfefc1d3669ef7dfefee7510683089010`.
- Updated and validated `.agents/skills/blender-visual-repair/SKILL.md` with scan-noise classification, identity-preservation, UV-atlas browser-gate, unlit/emissive warnings, recognizable-feature reconstruction, and shared-decimator scope guardrails. Updated and validated `.agents/skills/blender-browser-visual-gate/SKILL.md` so accepted GLB changes also require a new manual runtime cache version.
- Validation: `npm run assets:check` passed; `npm run pipeline:evals` passed 6/6; `npm run check` passed with 35 unit tests; focused locker Playwright passed 5/5; full `npm run test:e2e` passed 12/12; skill validation and `git diff --check` passed. `agent-browser` remains unavailable on this host because Chrome reports no usable sandbox; repository Playwright was used.
- No-cache browser verification matched 26,594,784 runtime bytes to disk, found the real `LOCKER_PROP_BASEBALL` node in its revealed state, and reported no application console errors. The export contains 52 selected objects, five `game_id` nodes, ten materials, and thirteen textures.
- Full-diff review caught and repaired a shared decimator regression before handoff: Wings now exports at 48,000 triangles, while the watch and hat retain their source-constrained post-decimation detail instead of the rejected over-reduced result. The baseball approval camera now centers the moved right-side shelf.

## 2026-07-12 Locker complete-4K Tripo source rebuild

- Added `TripoAssetLessons.md` and linked it from the README, asset pipeline, Blender pipeline, and source-intake skill. The durable rule is complete 4K material-wired PBR at source intake; runtime texture resolution remains a per-prop browser decision.
- Preserved and hash-verified the new owner downloads: baseball `e77bd1ef4f85705edb2f6ff5bfc5d91d17f5243c9cd77d9c147b204b58617725`, Bull `a5ca94020d9a0de950666d7e8ab8da1eff861a42f48bfb06e29a6f83dcd3d1f1`, and Wings `27d2a4731419d1f7a44873b7aeb69869d6d33f23dc82f32657268db9fa85b36b`. Each source has 4096 BaseColor, Normal, and metallic-roughness maps.
- Removed the rejected procedural baseball, voxel-remeshed Bull, stylized Wings atlas, and runtime map-stripping path. The three props now use the newly downloaded geometry and authored PBR, decimated to about 72k triangles and staged at 2048 for owner comparison. Watch/hat retain 1024 runtime staging; this is not treated as a universal budget.
- `npm run asset:locker` passed source preparation, immutable hash/PBR-role/4K gates, Blender validation, six approval renders, GLB export, and glTF validation. Five existing environment transform warnings and generated tangent-space warnings remain informational.
- Final Blender master: 50,238,312 bytes, SHA-256 `4356961f63439241d1c9ea0bde8f244361203a67db68629580886f7311a2cdaf`. Final GLB: 44,288,684 bytes, SHA-256 `3b5d365274bb6e65b939e6bee4467e6be7d5a4111f5aace92dcc240b99518753`; a no-cache HTTP fetch matched both GLB bytes and hash.
- Repeated-build review found and fixed stale importer datablocks that caused `.001` name drift and inflated the master to 74.7 MiB. Prop-scoped orphan cleanup restored stable names and a 50.2 MiB master; two consecutive full `asset:locker` runs produced the identical deployable GLB hash.
- `npm run assets:check` passed the new independent five-prop/material-role/4K source gate and all deployable GLB validators. `npm run pipeline:evals` passed 6/6. `npm run check` passed lint, types, 35/35 unit tests, and production build.
- The first full Playwright run passed 11/12 but exposed real parallel GPU/decoder contention between the 44 MiB locker and 38 MiB Airbus GLBs. The unchanged failing real-locker test passed alone with one worker. Playwright is now fixed at one worker locally and in CI; the complete `npm run test:e2e` rerun passed 12/12 in 2.2 minutes without weakening assertions.
- Reduced the desktop status box from 20rem to 18rem after geometry evidence found a remaining 16px tray overlap. Playwright now asserts no status/tray intersection at 1440 and no horizontal overflow at 1440, 768, or 375; the final 12/12 run passed those assertions.
- Actual-browser evidence: `.cache/assets/locker/browser/locker-4k-{baseball,bull,wings}-focus-{with-card,clean}-1440.png` and `.cache/assets/locker/browser/locker-4k-overview-{1440,768,375}.png`. All three focus cues settled, real exported nodes were present/revealed, and no console errors were recorded.
- `blender-source-intake`, `blender-visual-repair`, and `blender-browser-visual-gate` skill validation passed. No commit or deployment was made. Visual acceptance remains exclusively with the owner.

## 2026-07-12 DC-9 OBJ8 source intake and authority gate

- Confirmed the source as `roger2009`'s X-Plane.org Douglas DC-9-30 unfinished v0.19 package. Direct creator permission for CockpitEscapeRoom use and derivative production was owner-confirmed on 2026-07-12, so the source may advance through the normal Blender, asset, browser, and owner visual-review gates. The production Blender master and runtime GLB were not changed during this intake pass.
- Added deterministic OBJ8 parsing/import for the selected `DC9vc2`, `DC9panel`, `DC9vc1`, and `Glass` objects: vertex/index tables, 142 ordered draw ranges, nested/keyed transforms, first-key parked defaults, axis conversion, source render state reporting, UVs, and texture staging.
- Source evaluation totals: 162,990 triangles, including 253 degenerate triangles omitted from render meshes; zero unsupported directives; 44 simulator datarefs defaulted and reported.
- Blender 5.1.2 produced a 3,984,250-byte intake `.blend` and 20,564,560-byte intake GLB. GLB SHA-256: `00eed7115fa045eb391cae7976d31ecf25b15d6e74ea50ad60b094c2bbbef114`.
- glTF validation found zero errors and four warnings for legacy PNG color-space/features. Python converter tests passed 6/6; complete cockpit-pipeline unit discovery passed 14/14; the new reference-authority gate validated.
- `npm run pipeline:evals` passed 6/6; `npm run assets:check` passed for the unchanged deployable assets; `npm run check` passed lint, TypeScript, 42 Vitest tests, and production build; `git diff --check` passed.
- Visual inspection of three bounded captain-camera/light passes found strong shell, windshield, overhead, hardware, wear, and period materials, but the main gauges depend on X-Plane's separate instrument system and are absent from a self-contained conversion. Current intake evidence: `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/extracted/optimized/previews/captain-eye.png`.
- `npm run references:check` accepts the new DC-9 manifest entry but remains red on three unrelated, pre-existing unmanifested locker photos under `art-source/references/local-private/`.
- Authority gate reopened: production captain-view assembly/browser integration may proceed. The remaining source delta is DC-9-50-family instrument reconstruction plus deterministic production assembly and browser proof.

## 2026-07-12 DC-9 captain-seat preview repair

- Owner review correctly rejected `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/extracted/optimized/previews/three-quarter.png` because it used the generic exterior source-inspection camera rather than the required captain-seat view.
- Added a deterministic `dc9-captain` profile to `tools/blender/render_source_candidate.py`. It retains front/side/top as source-geometry inspection views while locking `three-quarter.png` to the left-seat eye point, a restrained 46 mm lens, and a sightline across the captain panel toward the center stack.
- Blender 5.1.2 regenerated and visually inspected the corrected 1,313,183-byte render twice. Both runs preserved the fixed camera and visible framing; their PNG byte hashes differed, so EEVEE preview hashes are not treated as stable evidence.
- The source GLB remained byte-identical at SHA-256 `00eed7115fa045eb391cae7976d31ecf25b15d6e74ea50ad60b094c2bbbef114`; this repair changed camera evidence only, not donor geometry or the playable runtime GLB.

## 2026-07-14 - DC-9 Final Flight Log reordered journey

- Implemented and verified the approved order: DC-9 Final Flight Log → Captain's Locker → existing Airbus A320 First-Officer experience → Model Y reward. Momma Cheryl's five-page Home Operations Log is read-only recognition with no input, score, timer, or failure state.
- `npm test -- src/game/state.test.ts src/game/storage.test.ts` passed 55/55 reducer and persistence tests.
- `npm run check` passed: ESLint, TypeScript, 60/60 Vitest tests, and the Vite production build.
- `npm run assets:check` passed without rebuilding the DC-9. Existing validator information/warnings remain limited to imported-asset unused UV/empty-node and generated-tangent reports.
- `npx playwright test e2e/smoke.spec.ts -g "DC-9|complete reordered journey|Airbus" --workers=1` passed 7/7 in 2.4 minutes.
- `npm run test:e2e -- --workers=1` passed 15/15 Chromium cases in 4.2 minutes. Coverage includes the real Airbus and DC-9 GLBs, strict DC-9 registry/cameras, model/load failures, keyboard focus, safe retry, reduced motion, reload persistence, Captain's Key handoff, locker progression, direct Airbus-to-reward routing, and Mars/reward save preservation.
- Actual-browser verification passed after launching Chromium with the host-required `--no-sandbox` argument: meaningful content rendered, no Vite error overlay or page errors appeared, and the only dev-server console warning was the existing upstream `THREE.Clock` deprecation.
- Inspected 1440 × 900 evidence:
  - `preview-renders/dc9-final-flight-log/01-sunset-introduction-1440.png`
  - `preview-renders/dc9-final-flight-log/02-cockpit-route-record-1440.png`
  - `preview-renders/dc9-final-flight-log/03-home-operations-log-1440.png`
  - `preview-renders/dc9-final-flight-log/04-overhead-shutdown-1440.png`
  - `preview-renders/dc9-final-flight-log/05-captains-key-reveal-1440.png`
  - `preview-renders/dc9-final-flight-log/06-locker-transition-1440.png`
- A single 375 × 812 functional check found zero horizontal overflow; the stacked Legacy Route Record remained within `x=12..363` and exposed all six route controls, submit, close, viewer-help, fullscreen, and restart controls. This is functional narrow-layout evidence, not a mobile visual-approval milestone.
- `public/models/dc9-cockpit.glb` remained 30,420,832 bytes with SHA-256 `60bfc2e6c137ad47bfb269dfdd4a71c1dda6eb95a0367d7f54a508c7d69fb7cd`, exactly matching the hash recorded before implementation. `art-source/blender/dc9_master.blend` and `dc9_reference_scene.blend` also retained their pre-implementation hashes. `npm run asset:dc9` was not run.
- No external preview was published during this verification pass, so preview-byte parity is not applicable. Real local HTTP model delivery and runtime registry readiness are covered by the passing production-GLB browser test.
