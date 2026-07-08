# Airbus A320 Cockpit 2 Playable Proof Handoff

## Bounded Action

Promoted the owner-cleaned shaded Airbus A320 cockpit handoff into the runtime model directory for a playable First-Officer proof.

This is a deployable GLB playable proof, not final visual approval.

## Asset

- Source GLB: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.glb`
- Runtime GLB: `public/models/airbus-first-officer.glb`
- Runtime contract: `art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json`
- Material/optimization gate: `art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json`
- Browser handoff gate: `art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json`
- SHA-256: `033438f0674423356a64e1b2d9f9430072e65790670ab5cdbbcd62c61b9eedff`

## Contract Summary

- Scene group: Airbus A320 First-Officer cockpit
- Root object: `AIRBUS_ROOT`
- Required stable nodes include `AIRBUS_A320_STATIC`, `AIRBUS_A320_DISPLAY_CANDIDATES`, `AIRBUS_A320_INTERACTIVE_CANDIDATES`, `AIRBUS_A320_LOC_CAPTAIN_EYE`, `AIRBUS_A320_LOC_DASHBOARD_FOCUS`, and `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`.
- GLB size: 35,098,268 bytes, below the 50 MiB review threshold.
- Material count: 16
- Texture count: 8
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
- The label cards now drop directly onto transparent HTML hotspots aligned to cockpit parts; drag hover outlines the active part, and the same target buttons preserve click/keyboard access.
- Hotspot geometry was retuned after owner review so the sidestick outline sits on the sidestick itself, thrust/radio targets align to their rendered cockpit areas, and narrow portrait view uses a wider runtime FOV to keep the sidestick visible.
- Decoy cockpit objects are also valid drop slots. Hotspots remain visually hidden until a card is dragged over them, and the game judges correctness only after all six cards are placed.
- The Airbus card tray, cockpit hotspots, dock controls, and ATP clock challenge are hidden until the A320 GLB camera-ready callback fires in normal 3D mode; `?skip3d=1` remains immediately interactive for the mirrored HTML path.
- The ATP clock challenge appears only after all six cards are placed with the five real cockpit controls correct. The input starts blank, has no `1500` placeholder, and stale saved Airbus clock answers are cleared on load.
- The temporary browser-only display reflection was removed after owner review; the FO-side display now comes only from the GLB render.
- The scene badge reads `A320 PLAYABLE PROOF` until owner visual approval upgrades the asset.
- Browser screenshots were captured and reviewed at 375, 768, and 1440 px after restoring visible direct GLB rendering.

## Browser Evidence

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
- `.cache/assets/airbus/validation.json` - pass; 147 proof-stage warnings remain for unapplied/unverified candidate meshes, with no `CAM_AIRBUS_*` camera metadata warnings.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 2 test files and 13 tests.
- `npm run build` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests including the A320 GLB integration proof, hidden initial ATP, blank ATP reveal, wrong full-board ATP hiding, hotspot drag-enter highlight, decoy placement, real Verify-to-locker transition, and reload persistence.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `git diff --check` - pass.
- `npm run assets:check` - pass; checked `public/models/airbus-first-officer.glb` and existing `public/models/dc9-cockpit.glb`.

## Approval State

This handoff is approved only for playable proof. Owner visual approval is still required before calling it final production Airbus cockpit art or removing proof/approval caveats.
