# Test report

Update this file with actual evidence after every milestone. Do not replace failures with optimistic prose.

| Check | Expected | Actual | Status | Follow-up |
|---|---|---|---|---|
| `npm run lint` | No lint errors | Passed inside `npm run check` after direct cockpit hotspot repair | Pass | Rerun after every code change |
| `npm run typecheck` | No Typecheck errors | Passed inside `npm run check` after direct cockpit hotspot repair | Pass | Rerun after every code change |
| `npm run test` | Reducer and persistence tests pass | 11 tests passed after adding decoy assignment coverage | Pass | Add focused tests per puzzle |
| `npm run build` | Vite production build succeeds | Passed inside `npm run check` after direct cockpit hotspot repair | Pass | Track runtime bundle and asset budgets |
| `npm run test:e2e` | Captain/locker/airbus loop, A320 GLB proof, hotspot highlighting, decoy placement, Verify transition, and reload path pass in Chromium | Passed 4 Chromium tests after adding direct cockpit hotspot and decoy placement coverage | Pass | Keep browser tests current with each milestone |
| `npm run assets:check` | No invalid production GLBs | Passed for `public/models/airbus-first-officer.glb` and `public/models/dc9-cockpit.glb`; dc9 still has existing validator info rows for unused texcoords and empty nodes | Pass with warnings | Must validate every committed GLB |
| `npx gltf-transform validate public/models/airbus-first-officer.glb` | A320 cockpit GLB has no glTF validation errors | Passed with no errors, warnings, infos, or hints after direct-GLB camera repair export | Pass | Rerun after every A320 GLB update |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` | Browser integration gate artifact is structurally valid | Passed after updating the gate for direct cockpit hotspot evidence | Pass | Rerun after browser evidence changes |
| `npm run references:validate` | Reference manifest is structurally valid | Passed for 24 references; wrote `.cache/references/manifest-validation.json` | Pass | Rerun after reference-manifest edits |
| `npm run references:download` | Download only entries with explicit direct image URLs and record hashes | Passed; downloaded 4 Commons images and skipped the link-only Simulation Daily source | Pass | Use `--force` only after reviewing changed local files |
| `npm run references:contact-sheet` | Generate labeled DC-9-51 contact sheet | Passed; wrote `art-source/references/dc9-51/contact-sheets/dc9-51-contact-sheet.svg` | Pass | Inspect after new visual sources |
| `npm run references:brief` | Generate modeling brief from manifest | Passed; wrote `art-source/references/dc9-51/notes/modeling-brief.md` | Pass | Regenerate after manifest edits |
| `npm run references:check` | Offline aggregate check validates manifest, artifacts, Blender scene, and preview render | Passed after recursive manifest validation; rendered `.cache/references/dc9_reference_overview.png` with Blender 5.1.2 | Pass with warnings | Rerun before reference-pack PR |
| `BLENDER_BIN=/home/user1/.local/bin/blender blender --background --python tools/blender/setup_dc9_reference_scene.py` | Create/update reference scene without touching `dc9_master.blend` | Passed with Blender 5.1.2; saved `art-source/blender/dc9_reference_scene.blend`; warning only: `Material.use_nodes` deprecation for Blender 6.0 | Pass | Track Blender API deprecation before Blender 6 |
| `npm ci` | Install locked dependencies from a portable registry | Passed after normalizing 447 lockfile `resolved` URLs from the internal package gateway to `https://registry.npmjs.org/`; 396 packages installed, 0 vulnerabilities | Pass | Keep lockfile URLs portable |
| `npm run check` | Lint, typecheck, tests, and build pass | Passed after agent gate validation upgrade; lint, typecheck, 9 tests, and production build completed | Pass | Rerun after code changes |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pipeline schemas, stage contracts, gate examples, and workflow eval runner validate | Passed after agent gate validation upgrade; 7 tests | Pass | Rerun after pipeline contract changes |
| `npm run pipeline:evals` | Deterministic guardrail evals catch known agent workflow failures | Passed; 6/6 eval fixtures covered Tripo proxy promotion, missing Agent 0 authority, optimization contract breaks, aircraft mixing, and spoiler-leak protection | Pass | Add fixtures for new agent failure modes |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate ...` | Structured gate examples validate for reference authority, runtime contract, material optimization, and browser integration | Passed for all four checked-in example artifacts | Pass | Real milestone gates must validate their own artifact paths |
| `npm run references:validate` | Reference manifest covers checked-in images and verifies recorded hashes | Passed for 24 references | Pass | Rerun after reference-manifest edits |
| 375 / 768 / 1440 px visual check | No clipping or blocked controls | Captured and reviewed direct-GLB A320 First-Officer screenshots at 375, 768, and 1440 px with canvas opacity 1 and no console errors | Pass | Owner visual approval still required before production art approval |
| DC-9 realism review | Captain view reads as model-correct DC-9 | In-progress against greybox placeholders | In progress | Requires Blender milestone and owner approval |
| Airbus realism review | Correct model-specific cockpit | A320 Cockpit 2 playable proof now loads `public/models/airbus-first-officer.glb` directly and opens from the exported First-Officer seat camera; owner visual approval still pending | In progress | Owner review, individual control pivots, and display treatment before production approval |

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
