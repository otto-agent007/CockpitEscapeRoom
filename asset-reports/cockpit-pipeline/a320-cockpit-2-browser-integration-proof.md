# Airbus A320 Cockpit 2 Browser Integration Proof Handoff

## Bounded Action

Promoted the staged shaded Airbus A320 cockpit handoff into the runtime model directory for downstream browser integration proof.

This is a deployable GLB browser integration proof, not final visual approval.

## Asset

- Source GLB: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.glb`
- Runtime GLB: `public/models/airbus-first-officer.glb`
- Runtime cockpit backdrop: `public/images/a320-cockpit-integration-proof.png`
- Runtime contract: `art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json`
- Material/optimization gate: `art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json`
- Browser handoff gate: `art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json`
- SHA-256: `28f5ece69d9df63fa426b40bee25cf6b4739cb2df2f2a666cba0b9685fbe6cc7`

## Contract Summary

- Scene group: Airbus A320 First-Officer cockpit
- Root object: `AIRBUS_ROOT`
- Required stable nodes include `AIRBUS_A320_STATIC`, `AIRBUS_A320_DISPLAY_CANDIDATES`, `AIRBUS_A320_INTERACTIVE_CANDIDATES`, `AIRBUS_A320_LOC_CAPTAIN_EYE`, and `AIRBUS_A320_LOC_DASHBOARD_FOCUS`.
- GLB size: 39,869,908 bytes, below the 50 MiB review threshold.
- Material count: 12
- Texture count: 11
- Destructive optimization used: false
- Reimport validation: pass

## Browser Integration

- `src/scenes/PrototypeScene.tsx` loads `public/models/airbus-first-officer.glb` during Airbus First-Officer mode.
- The loader checks for the documented A320 contract nodes and warns if a required node is missing.
- The browser proof displays the source-review cockpit render as a temporary backdrop because the current GLB camera/mesh split still exposes exterior-like fragments when rendered directly.
- The HUD/native HTML First-Officer controls remain the authoritative accessible path.
- The scene badge reads `A320 COCKPIT INTEGRATION PROOF` until owner visual approval upgrades the asset.
- Browser screenshots were captured and reviewed at 375, 768, and 1440 px.

## Browser Evidence

- `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-integration-375.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-integration-768.png`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-integration-1440.png`

## Validation

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run build` - pass.
- `npm run test:e2e` - pass; 3 Chromium tests including the A320 GLB integration proof.
- `npm run assets:check` - pass; checked `public/models/airbus-first-officer.glb` and existing `public/models/dc9-cockpit.glb`.

## Approval State

This handoff is approved only for browser integration proof. Owner visual approval is still required before calling it final production Airbus cockpit art or removing proof/approval caveats.
