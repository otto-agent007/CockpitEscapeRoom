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
| `npm run references:validate` | Reference manifest is structurally valid | Passed for 5 references; wrote `.cache/references/manifest-validation.json` | Pass | Rerun after reference-manifest edits |
| `npm run references:download` | Download only entries with explicit direct image URLs and record hashes | Passed; downloaded 4 Commons images and skipped the link-only Simulation Daily source | Pass | Use `--force` only after reviewing changed local files |
| `npm run references:contact-sheet` | Generate labeled DC-9-51 contact sheet | Passed; wrote `art-source/references/dc9-51/contact-sheets/dc9-51-contact-sheet.svg` | Pass | Inspect after new visual sources |
| `npm run references:brief` | Generate modeling brief from manifest | Passed; wrote `art-source/references/dc9-51/notes/modeling-brief.md` | Pass | Regenerate after manifest edits |
| `npm run references:check` | Offline aggregate check validates manifest, artifacts, Blender scene, and preview render | Passed; rendered `.cache/references/dc9_reference_overview.png` without invoking downloads | Pass | Rerun before reference-pack PR |
| `BLENDER_BIN=/home/user1/.local/bin/blender blender --background --python tools/blender/setup_dc9_reference_scene.py` | Create/update reference scene without touching `dc9_master.blend` | Passed with Blender 5.1.2; saved `art-source/blender/dc9_reference_scene.blend`; warning only: `Material.use_nodes` deprecation for Blender 6.0 | Pass | Track Blender API deprecation before Blender 6 |
| `npm ci` | Install locked dependencies from a portable registry | Passed after normalizing 447 lockfile `resolved` URLs from the internal package gateway to `https://registry.npmjs.org/`; 396 packages installed, 0 vulnerabilities | Pass | Keep lockfile URLs portable |
| `npm run check` | Lint, typecheck, tests, and build pass | Passed; lint, typecheck, 9 Vitest tests, and Vite production build completed | Pass | Rerun after code changes |
| 375 / 768 / 1440 px visual check | No clipping or blocked controls | Pending screenshot review | Pending | Required before first PR merge |
| DC-9 realism review | Captain view reads as model-correct DC-9 | Greybox only | Blocked | Requires Blender milestone and owner approval |
| Airbus realism review | Correct model-specific cockpit | Model unknown | Blocked | Confirm exact Airbus model first |
