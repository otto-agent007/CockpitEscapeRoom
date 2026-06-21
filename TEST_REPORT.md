# Test report

Update this file with actual evidence after every milestone. Do not replace failures with optimistic prose.

| Check | Expected | Actual | Status | Follow-up |
|---|---|---|---|---|
| `npm run lint` | No lint errors | Passed in starter-pack validation | Pass | Rerun after every code change |
| `npm run typecheck` | No TypeScript errors | Passed in starter-pack validation | Pass | Rerun after every code change |
| `npm run test` | Reducer and persistence tests pass | 9 tests passed | Pass | Add focused tests per puzzle |
| `npm run build` | Vite production build succeeds | Passed; 3D scene is a lazy-loaded chunk | Pass | Track runtime bundle and asset budgets |
| `npm run test:e2e` | Captain loop and reload path pass in Chromium | Authored and launched; this workspace's managed Chromium blocked both loopback and container-local URLs with `ERR_BLOCKED_BY_ADMINISTRATOR` before the app loaded | Environment-blocked | Run in GitHub Actions or an unrestricted local Chromium installation |
| `npm run assets:check` | No invalid production GLBs | Passed on `public/models/dc9-cockpit.glb` after `npm rebuild --ignore-scripts --no-audit --no-fund` restored local `.bin` shims | Pass | Informational unused-UV and empty-node notices remain |
| DC-9 Blender scene validation | `DC9_ROOT`, approval camera, metadata, materials, transforms pass validator | `tools/blender/validate_scene.py` passed with 0 warnings on `art-source/blender/dc9_master.blend` using Blender 5.1.2 | Pass | Rerun after every `.blend` change |
| DC-9 GLB validation | Deployable GLB has no glTF errors | `node node_modules/@gltf-transform/cli/bin/cli.js validate public/models/dc9-cockpit.glb --limit 5` reported no errors and no warnings; informational unused-UV and empty-node notices remain | Pass | Official asset wrapper passed after local npm bin shims were rebuilt |
| `npm run asset:dc9` | Validate, render, export, inspect, copy asset | Passed with `BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1`; wrote `public/models/dc9-cockpit.glb` and `.cache/assets/dc9/asset-report.json` | Pass | Blender emitted a non-fatal unfreed-memory note after export |
| 375 / 768 / 1440 px visual check | No clipping or blocked controls | Pending screenshot review | Pending | Required before first PR merge |
| DC-9 realism review | Captain view reads as model-correct DC-9 | Pipeline proof render captured at `asset-reports/previews/dc9-captain-approval.png`; variant and production realism remain unapproved | Pending | Owner approval gate required |
| Airbus realism review | Correct model-specific cockpit | Model unknown | Blocked | Confirm exact Airbus model first |
