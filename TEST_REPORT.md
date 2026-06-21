# Test report

Update this file with actual evidence after every milestone. Do not replace failures with optimistic prose.

| Check | Expected | Actual | Status | Follow-up |
|---|---|---|---|---|
| `npm run lint` | No lint errors | Passed in starter-pack validation | Pass | Rerun after every code change |
| `npm run typecheck` | No TypeScript errors | Passed in starter-pack validation | Pass | Rerun after every code change |
| `npm run test` | Reducer and persistence tests pass | 9 tests passed | Pass | Add focused tests per puzzle |
| `npm run build` | Vite production build succeeds | Passed; 3D scene is a lazy-loaded chunk | Pass | Track runtime bundle and asset budgets |
| `npm run test:e2e` | Captain loop and reload path pass in Chromium | Authored and launched; this workspace's managed Chromium blocked both loopback and container-local URLs with `ERR_BLOCKED_BY_ADMINISTRATOR` before the app loaded | Environment-blocked | Run in GitHub Actions or an unrestricted local Chromium installation |
| `npm run assets:check` | No invalid production GLBs | Passed bootstrap state with no GLBs present | Pass | Must validate every committed GLB |
| 375 / 768 / 1440 px visual check | No clipping or blocked controls | Pending screenshot review | Pending | Required before first PR merge |
| DC-9 realism review | Captain view reads as model-correct DC-9 | Greybox only | Blocked | Requires Blender milestone and owner approval |
| Airbus realism review | Correct model-specific cockpit | Model unknown | Blocked | Confirm exact Airbus model first |
