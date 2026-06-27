# Test report

Update this file with actual evidence after every milestone. Do not replace failures with optimistic prose.

| Check | Expected | Actual | Status | Follow-up |
|---|---|---|---|---|
| `npm run lint` | No lint errors | Pending after this design sync | Pending | Rerun after every code change |
| `npm run typecheck` | No Typecheck errors | Pending after this design sync | Pending | Rerun after every code change |
| `npm run test` | Reducer and persistence tests pass | 9 tests passed | Pass | Add focused tests per puzzle |
| `npm run build` | Vite production build succeeds | Pending after this design sync | Pending | Track runtime bundle and asset budgets |
| `npm run test:e2e` | Captain/locker/airbus loop and reload path pass in Chromium | Updated scenario script for First-Officer onboarding, locker reveal, DC-9 captain sequence, and reward reveal. | Pending | Run in GitHub Actions or unrestricted local Chromium |
| `npm run assets:check` | No invalid production GLBs | Pending after design-sync edits | Pending | Must validate every committed GLB |
| `npm run references:validate` | Reference manifest is structurally valid | Passed for 5 references; wrote `.cache/references/manifest-validation.json` | Pass | Rerun after reference-manifest edits |
| `npm run references:download` | Download only entries with explicit direct image URLs and record hashes | Passed; downloaded 4 Commons images and skipped the link-only Simulation Daily source | Pass | Use `--force` only after reviewing changed local files |
| `npm run references:contact-sheet` | Generate labeled DC-9-51 contact sheet | Passed; wrote `art-source/references/dc9-51/contact-sheets/dc9-51-contact-sheet.svg` | Pass | Inspect after new visual sources |
| `npm run references:brief` | Generate modeling brief from manifest | Passed; wrote `art-source/references/dc9-51/notes/modeling-brief.md` | Pass | Regenerate after manifest edits |
| `npm run references:check` | Offline aggregate check validates manifest, artifacts, Blender scene, and preview render | Passed; rendered `.cache/references/dc9_reference_overview.png` without invoking downloads | Pass | Rerun before reference-pack PR |
| `BLENDER_BIN=/home/user1/.local/bin/blender blender --background --python tools/blender/setup_dc9_reference_scene.py` | Create/update reference scene without touching `dc9_master.blend` | Passed with Blender 5.1.2; saved `art-source/blender/dc9_reference_scene.blend`; warning only: `Material.use_nodes` deprecation for Blender 6.0 | Pass | Track Blender API deprecation before Blender 6 |
| `npm ci` | Install locked dependencies from a portable registry | Passed after normalizing 447 lockfile `resolved` URLs from the internal package gateway to `https://registry.npmjs.org/`; 396 packages installed, 0 vulnerabilities | Pass | Keep lockfile URLs portable |
| `npm run check` | Lint, typecheck, tests, and build pass | Passed after staged cockpit pipeline gate hardening; lint, typecheck, 9 tests, and production build completed. | Pass | Rerun after code changes |
| 375 / 768 / 1440 px visual check | No clipping or blocked controls | Pending screenshot review | Pending | Required before first PR merge |
| DC-9 realism review | Captain view reads as model-correct DC-9 | In-progress against greybox placeholders | In progress | Requires Blender milestone and owner approval |
| Airbus realism review | Correct model-specific cockpit | In-progress against greybox placeholders | In progress | Confirm exact Airbus model first |
