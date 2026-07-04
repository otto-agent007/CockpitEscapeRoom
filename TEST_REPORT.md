# Test report

Update this file with actual evidence after every milestone. Do not replace failures with optimistic prose.

| Check | Expected | Actual | Status | Follow-up |
|---|---|---|---|---|
| `npm run lint` | No lint errors | Passed after A320 browser integration proof changes | Pass | Rerun after every code change |
| `npm run typecheck` | No Typecheck errors | Passed after A320 browser integration proof changes | Pass | Rerun after every code change |
| `npm run test` | Reducer and persistence tests pass | 9 tests passed | Pass | Add focused tests per puzzle |
| `npm run build` | Vite production build succeeds | Passed inside `npm run check`; production build completed | Pass | Track runtime bundle and asset budgets |
| `npm run test:e2e` | Captain/locker/airbus loop, A320 GLB proof, and reload path pass in Chromium | Passed 3 Chromium tests after adding the A320 GLB integration proof check | Pass | Keep browser tests current with each milestone |
| `npm run assets:check` | No invalid production GLBs | Passed for `public/models/airbus-first-officer.glb` and `public/models/dc9-cockpit.glb`; dc9 still has existing validator info rows for unused texcoords and empty nodes | Pass with warnings | Must validate every committed GLB |
| `npx gltf-transform validate public/models/airbus-first-officer.glb` | A320 cockpit GLB has no glTF validation errors | Passed with no errors, warnings, infos, or hints after promoting the A320 integration proof asset | Pass | Rerun after every A320 GLB update |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` | Browser integration gate artifact is structurally valid | Passed after updating the gate for the A320 React loader integration | Pass | Rerun after browser evidence changes |
| `npm run references:validate` | Reference manifest is structurally valid | Passed for 24 references; wrote `.cache/references/manifest-validation.json` | Pass | Rerun after reference-manifest edits |
| `npm run references:download` | Download only entries with explicit direct image URLs and record hashes | Passed; downloaded 4 Commons images and skipped the link-only Simulation Daily source | Pass | Use `--force` only after reviewing changed local files |
| `npm run references:contact-sheet` | Generate labeled DC-9-51 contact sheet | Passed; wrote `art-source/references/dc9-51/contact-sheets/dc9-51-contact-sheet.svg` | Pass | Inspect after new visual sources |
| `npm run references:brief` | Generate modeling brief from manifest | Passed; wrote `art-source/references/dc9-51/notes/modeling-brief.md` | Pass | Regenerate after manifest edits |
| `npm run references:check` | Offline aggregate check validates manifest, artifacts, Blender scene, and preview render | Passed after recursive manifest validation; rendered `.cache/references/dc9_reference_overview.png` with Blender 5.1.2 | Pass with warnings | Rerun before reference-pack PR |
| `BLENDER_BIN=/home/user1/.local/bin/blender blender --background --python tools/blender/setup_dc9_reference_scene.py` | Create/update reference scene without touching `dc9_master.blend` | Passed with Blender 5.1.2; saved `art-source/blender/dc9_reference_scene.blend`; warning only: `Material.use_nodes` deprecation for Blender 6.0 | Pass | Track Blender API deprecation before Blender 6 |
| `npm ci` | Install locked dependencies from a portable registry | Passed after normalizing 447 lockfile `resolved` URLs from the internal package gateway to `https://registry.npmjs.org/`; 396 packages installed, 0 vulnerabilities | Pass | Keep lockfile URLs portable |
| `npm run check` | Lint, typecheck, tests, and build pass | Passed after agent gate validation upgrade; lint, typecheck, 9 tests, and production build completed | Pass | Rerun after code changes |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pipeline schemas, stage contracts, gate examples, and workflow eval runner validate | Passed after agent gate validation upgrade; 7 tests | Pass | Rerun after pipeline contract changes |
| `npm run pipeline:evals` | Deterministic guardrail evals catch known agent workflow failures | Passed; 6/6 eval fixtures covered Tripo proxy promotion, missing Agent 0 authority, optimization contract breaks, aircraft mixing, and Model Y spoiler leak | Pass | Add fixtures for new agent failure modes |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate ...` | Structured gate examples validate for reference authority, runtime contract, material optimization, and browser integration | Passed for all four checked-in example artifacts | Pass | Real milestone gates must validate their own artifact paths |
| `npm run references:validate` | Reference manifest covers checked-in images and verifies recorded hashes | Passed for 24 references | Pass | Rerun after reference-manifest edits |
| 375 / 768 / 1440 px visual check | No clipping or blocked controls | Captured and reviewed A320 browser integration proof screenshots at 375, 768, and 1440 px | Pass | Owner visual approval still required before production art approval |
| DC-9 realism review | Captain view reads as model-correct DC-9 | In-progress against greybox placeholders | In progress | Requires Blender milestone and owner approval |
| Airbus realism review | Correct model-specific cockpit | A320 Cockpit 2 integration proof now loads from `public/models/airbus-first-officer.glb` and shows source-review cockpit imagery in the browser; owner visual approval still pending | In progress | Owner review and direct-GLB cockpit framing cleanup before production approval |

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
