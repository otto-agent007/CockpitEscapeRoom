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
- The HUD/native HTML First-Officer controls remain the authoritative accessible path.
- The scene badge reads `A320 PLAYABLE PROOF` until owner visual approval upgrades the asset.
- Browser screenshots were captured and reviewed at 375, 768, and 1440 px after switching to direct GLB rendering.

## Browser Evidence

- Direct-GLB playable proof captured and reviewed:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-playable-375.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-playable-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-playable-1440.png`
- The 1440 px browser capture starts from the exported First-Officer seat camera and shows the real cockpit GLB behind the onboarding panel.
- The 375 px and 768 px captures preserve the cockpit as the first-viewport visual with no observed text overlap or blocked controls.

## Validation

- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; produced `public/models/airbus-first-officer.glb` and `.cache/assets/airbus/previews/cam_airbus_first_officer_approval.png`.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 2 test files and 9 tests.
- `npm run build` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium tests including the A320 GLB integration proof.
- `npm run assets:check` - pass; checked `public/models/airbus-first-officer.glb` and existing `public/models/dc9-cockpit.glb`.

## Approval State

This handoff is approved only for playable proof. Owner visual approval is still required before calling it final production Airbus cockpit art or removing proof/approval caveats.
