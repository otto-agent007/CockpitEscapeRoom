# Airbus A320 Pop T Captain seat-role migration

Date: 2026-07-15

- Authoritative source: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`; deployable output: `public/models/airbus-captain.glb`.
- Blender 5.1.2 rebuilt and validated the source. The preserved imported-source warnings (124) and candidate notes (127) are documented and do not alter the five target contracts.
- Canonical cameras: `CAM_AIRBUS_CAPTAIN_GAME_VIEW` and `AIRBUS_A320_CAM_CAPTAIN_APPROVAL`. The exported gameplay camera owns its transform and 68-degree vertical FOV; the browser no longer supplies a hard-coded first-officer transform.
- The sidestick pivot/collider/cue moved to the captain-side sidestick. All five target families retain stable names, pivots, and `game_id` values with `puzzle_id = airbus`.
- Deprecated first-officer cameras remain compatibility-only nodes with explicit replacement metadata. The deprecated `public/models/airbus-first-officer.glb` deployable file was removed.
- Current GLB: 39,878,692 bytes; SHA-256 `4c44468fe3d492e3839407f97c8d7b7286a295f12df1ee376425ee32df55621f`; 157 selected export objects; 15 interactive target contract objects; 10 materials and 10 textures; no destructive optimization.

Current browser evidence is durable at `preview-renders/seat-role-swap/airbus-captain-targets-initial-1440.png` and `preview-renders/seat-role-swap/airbus-captain-targets-dragged-1440.png`. Both captures use the captain camera with the SIDESTICK card selected and report five projected target controls before and after seated head-look drag.
- Current approval still: `public/images/a320-game-ready-captain.png`; SHA-256 `2d3cfae76008f6cf713bd37d0af0622cbf34beed66b0b30ae6955a73214f6479`.
- Browser visual evidence and the reopened owner gate are recorded in `plans/0013-dc9-fo-airbus-captain-seat-swap.md` and `TEST_REPORT.md`.

## 2026-07-26 Radio and thrust drop-area placement polish

- Moved the Blender-authoritative Radio target family from `(-0.040000, -0.474842, 0.011798)` to `(-0.045000, -0.464842, 0.011798)`, shifting its projected drop area higher and left from the captain view.
- After owner-directed desktop review, moved the Thrust target family only on X from `(0.015000, -0.505764, 0.004800)` to the accepted `(0.025000, -0.505764, 0.004800)`, shifting it farther right over the paired thrust levers without changing height or depth.
- Each pivot, cue, and hitbox remains co-located under the existing stable names and `game_id` contracts. Sidestick, Gear, Altitude, camera/FOV, puzzle rules, copy, save schema, native HTML controls, materials, and textures are unchanged.
- Blender 5.1.2 rebuilt the 157-object export with 156 `game_id` nodes. The source master is 24,414,712 bytes, SHA-256 `1f7aaa0f453393b884b1fc6e2e6fcac2e1e52c11e9756a92e703e138afac879a`; the deployable GLB is 39,878,692 bytes, SHA-256 `4c44468fe3d492e3839407f97c8d7b7286a295f12df1ee376425ee32df55621f`.
- `npm run assets:check` requires exact new translations, `verified_browser_1440_captain` alignment status, and the tracked owner-proof path. The focused production-cockpit Playwright case passed the new 1440 projection bands—Radio X 868–890/Y 658–680 and Thrust X 1130–1155/Y 720–748—then placed both cards through real canvas raycasting.
- Actual-browser frames with Radio selected are tracked at `preview-renders/placement-polish/airbus-radio-thrust-{1440,768,375}.png`. The owner accepted the 1440 composition. The 768/375 frames retain readable native controls without page overflow; the known narrow-camera crop keeps Thrust outside the visible cockpit frame.
- Final rebased owner-approved Vercel preview: `https://cockpit-escape-room-kdno3fzlf-ottoagent007-gmailcoms-projects.vercel.app` (`dpl_DMobaCFK1haNNAaunEPUifm2b5dG`). Authenticated delivery returned the 39,878,692-byte Airbus GLB with SHA-256 `4c44468fe3d492e3839407f97c8d7b7286a295f12df1ee376425ee32df55621f`, exactly matching local.
- Owner approval on 2026-07-26 promoted the Radio and Thrust target families to `verified_browser_1440_captain`; the runtime-contract gate was regenerated and validated from the metadata-bearing GLB.

> **Seat-role supersession notice (2026-07-15):** This historical record preserves the then-current DC-9 captain / A320 first-officer assignment. The active production contract now uses DC-9 first-officer/right-seat and Airbus A320 Pop T captain/left-seat roles. Historical evidence below is unchanged.

# Airbus A320 Cockpit 2 Production Handoff

## 2026-07-10 owner production approval

- The owner approved the current Airbus A320 First-Officer cockpit, right-seat camera, loading experience, and five-target interaction for production.
- The runtime no longer renders `A320 PLAYABLE PROOF` in Airbus mode.
- The current GLB, camera transform, and `game_id` contracts are unchanged by promotion.
- Dated approval-candidate sections below remain as historical validation records; their open owner-gate language is superseded by this approval.

## 2026-07-10 loading and viewer-control candidate

- Airbus card descriptions explain function while all five projected target overlays use faint, unlabeled instrument silhouettes; neutral numbered identifiers remain accessibility-only.
- The centered, compact Airbus dock and lower-right Help/Fullscreen controls were visually checked against the real GLB at desktop width; target projection and underlying `game_id` contracts are unchanged. The visible circular reset control was removed while the `R` shortcut remains.
- The briefing, loader, and accessible fallback now use `public/images/a320-game-ready-fo.png`, a clean 1920x1080 capture of the approved runtime canvas.
- The in-canvas greybox loader was removed. The shell loader is reset on every entry/retry/restart, remains for at least 600 ms and two framed render cycles, and was visually verified after Restart.
- Help and Fullscreen sit in the lower-right corner. The visible reset button was removed; the `R` shortcut returns the moved/zoomed camera and projected targets to the approved 68 degree FO view.
- The Airline Transport Pilot answer is a native form submission and successful qualification displays an accessible, reduced-motion-safe celebration before explicit locker continuation.
- Regression repair removed the speculative WebGL capability probe and permanent fallback latch; the real A320 loaded frame remains the readiness authority.
- One shell loader now reports real GLB byte progress and waits for the framed scene's first rendered frame before exposing gameplay.
- Network, GLB, or WebGL failure offers retry or a static-image accessible fallback with the same five HTML targets.
- Desktop controls add phase-aware help, full-shell fullscreen, reset, and seated A320 FOV zoom clamped to 50-76 degrees. Target projection continues every frame.
- Deterministic checks pass: app check, assets, glTF, runtime/material/browser gates, pipeline evals, and diff whitespace.
- Promotion is complete following explicit owner approval on 2026-07-10.

## Bounded Action

Promoted the owner-cleaned shaded Airbus A320 cockpit handoff into the runtime model directory for a playable First-Officer proof.

This is a deployable GLB playable proof, not final visual approval.

## Asset

- Source GLB: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.glb`
- Runtime GLB: `public/models/airbus-first-officer.glb`
- Runtime contract: `art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json`
- Material/optimization gate: `art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json`
- Browser handoff gate: `art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json`
- SHA-256: `d40d50006091230a2a04372cf57ee4ee7f0bfa3bce4bc01ebda05259ca9e482b`

## Contract Summary

- Scene group: Airbus A320 First-Officer cockpit
- Root object: `AIRBUS_ROOT`
- Required stable nodes include `AIRBUS_A320_STATIC`, `AIRBUS_A320_DISPLAY_CANDIDATES`, `AIRBUS_A320_INTERACTIVE_CANDIDATES`, `AIRBUS_A320_LOC_CAPTAIN_EYE`, `AIRBUS_A320_LOC_DASHBOARD_FOCUS`, and `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`.
- GLB size: 39,875,220 bytes, below the 50 MiB review threshold.
- Material count: 12 in the deployable GLB.
- Texture count: 11 in the deployable GLB; the source texture inventory remains preserved by the shading report.
- Destructive optimization used: false
- Reimport validation: pass

## Browser Integration

- `src/scenes/PrototypeScene.tsx` loads `public/models/airbus-first-officer.glb` during Airbus First-Officer mode.
- The loader checks for the documented A320 contract nodes and warns if a required node is missing.
- The browser proof renders the real A320 GLB directly from `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`.
- Airbus OrbitControls mount only after the exported GLB camera is applied, preventing the fallback orbit camera from overriding the First-Officer view.
- The runtime gameplay camera widens the exported camera to a 68 degree FOV so the cockpit fills the browser with the FO side, pedestal, main panel, overhead/glareshield context, and sidestick visible together.
- The Airbus play surface no longer uses `public/images/a320-fo-view.png` as a phase backdrop; that image remains only for the opening briefing hero.
- The HUD/native HTML First-Officer controls remain the authoritative accessible path.
- The five First-Officer label targets now have exported pivot proxies and invisible hitboxes in the GLB. Browser projection reads those `label_target` nodes from `userData` instead of relying only on static screen anchors.
- The five label cards use compact HTML controls projected from the exported pivots. Selecting a card exposes all five pins; a canvas click raycasts the exported hitboxes, while the same target controls preserve click, drag/drop, and keyboard access.
- The exported pivots were calibrated and visually checked against the sidestick, thrust levers, gear lever, FO radio panel, and FCU altitude area at 1440 and 768 px.
- The Airbus card tray, target controls, dock controls, and ATP question are hidden until the A320 GLB camera-ready callback fires in normal 3D mode; `?skip3d=1` remains immediately interactive for the mirrored HTML path.
- The ATP flight-hours question appears only after all five cards are correctly placed. The input starts blank, and stale saved Airbus answers are cleared on load.
- The temporary browser-only display reflection was removed after owner review; the FO-side display now comes only from the GLB render.
- The scene badge reads `A320 PLAYABLE PROOF` until owner visual approval upgrades the asset.
- Browser screenshots were captured and reviewed at 375, 768, and 1440 px after restoring visible direct GLB rendering.

## Browser Evidence

- Current owner-review candidate, captured from the real regenerated GLB:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-initial-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-targets-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-initial-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-targets-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-sanity-375.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-reduced-motion-768.png`
- The 1440 and 768 pairs are approval-blocking evidence. The 375 capture is a sanity check only.
- Selecting a card reveals compact cyan labels projected from exported pivot nodes. Direct canvas selection raycasts the exported invisible hitboxes; the native HTML targets provide the equivalent keyboard path.
- A rejected intermediate WebGL cue-edge approach caused software-browser frame starvation. The final path keeps proxy meshes invisible and projects DOM pins from their exported pivots.

- Direct-GLB playable proof captured and reviewed:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-375.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
- The browser captures start from the exported First-Officer seat camera and show the real cockpit GLB behind the onboarding targets.
- The 375 px and 768 px captures preserve readable controls with no observed text overlap or blocked controls after retuning target spacing for the wider FOV.
- Hotspot highlight proof captured after GLB load with corrected sidestick alignment:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-hotspot-highlight-1440.png`
- Decoy hotspot highlight proof captured after GLB load:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-decoy-highlight-1440.png`
- Ready-gated proof captured after GLB load with the ATP challenge still hidden:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-ready-gated-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-ready-gated-768.png`

## Validation

- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; produced `public/models/airbus-first-officer.glb` and `.cache/assets/airbus/previews/cam_airbus_first_officer_approval.png`.
- `.cache/assets/airbus/asset-report.json` - pass; 121 imported-source warnings and 127 candidate notes remain for preserved compound source meshes.
- Assembly validation - pass; 5 label targets, 5 pivot-verified label targets, and 5 total pivot-verified targets.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors or warnings, with five informational `UNUSED_OBJECT` rows for target mesh `TEXCOORD_0`.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 2 test files and 13 tests.
- `npm run build` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests including the A320 GLB integration proof, GLB-backed projected target mode, native keyboard placement, hidden initial ATP, blank ATP reveal, real Verify-to-locker transition, and reload persistence.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- `git diff --check` - pass.
- `npm run assets:check` - pass; checked `public/models/airbus-first-officer.glb` and existing `public/models/dc9-cockpit.glb`.

## Approval State

This handoff is approved only for playable proof. Owner visual approval is still required before calling it final production Airbus cockpit art or removing proof/approval caveats.

## 2026-07-09 Production-Ready Approval Candidate

- Added deterministic loose-fragment cleanup to the A320 shading pipeline instead of relying on the ignored recovered cache `.blend`.
- Quarantined only four reviewed generic zoom-out fragments in `A320_QUARANTINE_LOOSE_PARTS_REVIEW` and excluded them from export:
  - `AIRBUS_A320_STATIC_119_OBJECT_93_001`
  - `AIRBUS_A320_STATIC_120_OBJECT_94`
  - `AIRBUS_A320_STATIC_121_OBJECT_95`
  - `AIRBUS_A320_STATIC_122_OBJECT_96_001`
- Preserved named cockpit geometry, seat, side-console, display, panel, hierarchy, UVs, `game_id` metadata, and the First-Officer gameplay camera contract.
- Regenerated the canonical shaded source and deployable runtime asset through the pipeline:
  - Shaded blend: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`
  - Shaded GLB: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.glb`
  - Runtime GLB: `public/models/airbus-first-officer.glb`
  - Runtime/staged SHA-256: `40f9677aac3b276360dfd5fab60feabc38dcc379c4a971a6892dde552b2fed06`
  - Runtime GLB size: `39,861,720` bytes.
  - Five First-Officer label targets now have pivot-verified GLB target nodes and invisible hitboxes.
- Shading validation passed with runtime node names preserved, `game_id` metadata preserved, UV layers preserved, approved assembly inputs immutable, and dimension drift `0.0`.
- `.cache/assets/airbus/asset-report.json` - pass; Blender 5.1.2, 150 selected export objects, and 149 `game_id` nodes.
- `.cache/assets/airbus/validation.json` - pass; 121 imported-source warnings and 127 visual-candidate notes remain documented.
- `strings public/models/airbus-first-officer.glb` quarantine check - pass; no quarantined `OBJECT_93` through `OBJECT_96` runtime names found in the deployable GLB.
- Approval renders refreshed:
  - `.cache/assets/airbus/previews/airbus_a320_cam_complete_interior_approval.png`
  - `.cache/assets/airbus/previews/airbus_a320_cam_first_officer_approval.png`
  - `.cache/assets/airbus/previews/cam_airbus_first_officer_approval.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/complete-interior-approval.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/first-officer-approval.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-source-parity-contact-sheet.png`
- Browser screenshots captured from the real GLB load path at `http://127.0.0.1:5173/`; each capture had 5 targets, zero `CLOCK` cards, visible canvas, and no console or page errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-375-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1440-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1920-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo-reduced-motion.png`
- Validation:
  - `python3 -m py_compile tools/blender/cockpit_pipeline/a320_assembly_blender_build.py tools/blender/cockpit_pipeline/a320_assembly_job.py tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-assembly-job` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass.
  - `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-shading/manifests/shading-complete.json` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
  - `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors or warnings, with five informational `UNUSED_OBJECT` rows for target mesh `TEXCOORD_0`.
  - `npm run assets:check` - pass; A320 and DC-9 GLBs have no errors or warnings, with informational unused UV/empty-node rows.
  - `npm run pipeline:evals` - pass; 6/6 eval fixtures.
  - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests, including GLB-backed projected target mode and native keyboard placement.
  - `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- Remaining approval limitations:
  - Owner visual approval is still required before removing `A320 PLAYABLE PROOF` or calling this final production Airbus cockpit art.
  - Imported source meshes retain documented unapplied-scale and visual-candidate metadata notes.
  - Imported source mesh controls outside the five player-facing label targets remain deferred.

## 2026-07-08 Production-Ready Approval Candidate

- Added `plans/0005-a320-cockpit-production-ready-candidate.md` for the A320 owner-approval-candidate milestone.
- Updated the Blender shading pipeline so `sketchfab-material-parity-summary.json` is a formal input alongside the cached viewer settings. The pass maps portable Sketchfab material-channel values into Principled BSDF roughness, metallic, base color, and restrained display emission while preserving source texture links and UVs.
- Recorded Sketchfab matcap/reflection contribution as material metadata and preview evidence rather than adding a non-portable runtime shader dependency.
- Restored and validated `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` as an exported runtime camera contract after an initial e2e failure showed the controls remained gated behind the cockpit loading state when that camera was absent.
- Updated `tools/blender/validate_scene.py` so preserved imported visual candidates without runtime `interaction` metadata are reported as `candidateNotes`; true validation warnings now focus on remaining source limitations such as unapplied imported scale and four no-UV source meshes.
- Regenerated the shaded source and deployable runtime asset through the pipeline:
  - Shaded blend: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`
  - Shaded GLB: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.glb`
  - Runtime GLB: `public/models/airbus-first-officer.glb`
  - Runtime SHA-256: `97deb0f7f2dc9fba3e9b046b621c6afe35a2dda4d6752f6a48eb8b073206fcc2`
  - Runtime GLB size: `39,871,920` bytes.
- `.cache/assets/airbus/asset-report.json` - pass; Blender 5.1.2, 144 exported objects, 140 `game_id` nodes, 129 imported-source warnings, and 131 visual-candidate notes.
- Approval renders refreshed:
  - `.cache/assets/airbus/previews/airbus_a320_cam_complete_interior_approval.png`
  - `.cache/assets/airbus/previews/airbus_a320_cam_first_officer_approval.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/complete-interior-approval.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/first-officer-approval.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-source-parity-contact-sheet.png`
- Browser screenshots captured from the real GLB load path with no console or page errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-candidate-375.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-candidate-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-candidate-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-candidate-1920.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-candidate-reduced-motion-1440.png`
- Validation:
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass after runtime-camera validation repair.
  - `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass after refreshing the runtime-contract hash.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
  - `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
  - `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
  - `npm run lint` - pass.
  - `npm run typecheck` - pass.
  - `npm run test` - pass; 13 Vitest tests.
  - `npm run pipeline:evals` - pass; 6/6 eval fixtures.
  - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
  - `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- Remaining approval limitations:
  - Owner visual approval is still required before removing `A320 PLAYABLE PROOF` or calling this final production Airbus cockpit art.
  - Imported source meshes retain documented unapplied-scale/no-UV warnings and visual-candidate metadata notes.
  - Individual imported control pivots are not promoted to direct 3D gameplay controls in this pass; accessible browser hotspots remain the supported interaction path.

## 2026-07-08 Production-Readiness Browser Lighting Checkpoint

- Added `plans/0004-a320-cockpit-production-readiness.md` for the browser-first production-readiness pass.
- Updated `src/scenes/PrototypeScene.tsx` to use a named A320 runtime lighting rig with ambient, hemisphere, directional, and point-light fills.
- Kept `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` as the camera source and retained constrained FO OrbitControls with pan disabled, Airbus zoom disabled, fixed look distance, and explicit polar/azimuth limits.
- Switched Canvas shadows to `percentage` so new browser captures no longer repeat the deprecated `PCFSoftShadowMap` warning.
- No `.blend` source, generated GLB, runtime node names, pivots, hierarchy, or `game_id` metadata changed in this checkpoint.
- Baseline evidence before lighting changes:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-375.png`
- Post-change evidence after lighting changes:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-375.png`
- Browser QA used Playwright because Browser plugin tools were not available in this session. Captures had no app console errors and no pre-drag hotspot outlines; the remaining browser warning is the pre-existing Three `Clock` deprecation.
- Validation:
  - `npm run lint` - pass.
  - `npm run typecheck` - pass.
  - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
  - `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
  - `npm run assets:check` - pass; A320 GLB had no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
  - `git diff --check` - pass.
- Remaining limitation: owner visual approval is still required before upgrading the A320 beyond playable proof. Blender source-lighting, individual control pivots, and final display treatments remain future production-art work.

## 2026-07-08 FO-View Likeness Correction

- Owner clarified that `public/images/a320-fo-view.png` is the visual likeness reference for render/material treatment, not the desired runtime crop. The runtime should keep the wide cockpit composition represented by `airbus-production-lighting-1440.png`.
- Restored the wide gameplay camera constants in `src/scenes/PrototypeScene.tsx`: `68` degree desktop/tablet FOV and `92` degree narrow portrait FOV.
- Rechecked the live Sketchfab model page for `A320 Cockpit 2`; the public page still identifies the same downloadable CC Attribution source model, but it does not expose the render stack as directly as the cached viewer extraction.
- Used the recorded Sketchfab render-parity evidence from the A320 shading pass:
  - Studio-style directional lighting and environment reference,
  - matcap/reflection contribution,
  - SSAO enabled,
  - SSR/TAA recorded as viewer behavior,
  - sharpen, vignette, and grain recorded as final-render post-processing.
- Added Airbus-only runtime post-processing with Three's built-in example passes and no new production dependency. The browser approximation includes SSAO, subtle sharpen, subdued vignette, and tiny static grain.
- Tested a runtime material/environment parity direction and backed it out because it over-brightened the panel and made the cockpit less like the dark blue-gray FO-view reference. The next meaningful likeness pass should tune Blender/source materials and environment lighting from the cached Sketchfab settings instead of mutating every material at runtime.
- No `.blend` source, generated GLB, runtime node names, pivots, hierarchy, or `game_id` metadata changed in this checkpoint.
- Wide gameplay evidence after post-processing:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-375.png`
- Final current-state evidence after backing out the runtime material override:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-375.png`
- 1920 reference-size evidence:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-sketchfab-post-1920.png`
- Browser QA used Playwright because Browser plugin tools were not available in this session. Captures had no app console errors and no pre-drag hotspot outlines; remaining console output is limited to the pre-existing Three `Clock` deprecation and screenshot-time WebGL `ReadPixels` performance warnings.
- Validation:
  - `npm run lint` - pass.
  - `npm run typecheck` - pass.
  - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
  - `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
  - `npm run assets:check` - pass; A320 GLB had no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
