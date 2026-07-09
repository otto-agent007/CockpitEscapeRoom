# Test report

Update this file with actual evidence after every milestone. Do not replace failures with optimistic prose.

| Check | Expected | Actual | Status | Follow-up |
|---|---|---|---|---|
| `npm run lint` | No lint errors | Passed standalone and inside `npm run check` after A320 five-card feedback simplification | Pass | Rerun after every code change |
| `npm run typecheck` | No Typecheck errors | Passed standalone and inside `npm run check` after A320 five-card feedback simplification | Pass | Rerun after every code change |
| `npm run test` | Reducer and persistence tests pass | 16 Vitest tests passed after removing the Airbus clock card while retaining the ATP gate | Pass | Add focused tests per puzzle |
| `npm run build` | Vite production build succeeds | Passed inside `npm run check` after A320 five-card feedback simplification | Pass | Track runtime bundle and asset budgets |
| `npm run test:e2e` | Captain/locker/airbus loop, A320 GLB proof, immediate feedback, no clock card, ATP gate, and reload path pass in Chromium | Passed 4 Chromium tests after restoring ATP question behind five correct labels | Pass | Keep browser tests current with each milestone |
| `npm run assets:check` | No invalid production GLBs | Passed for `public/models/airbus-first-officer.glb` and `public/models/dc9-cockpit.glb`; dc9 still has existing validator info rows for unused texcoords and empty nodes | Pass with warnings | Must validate every committed GLB |
| `npx gltf-transform validate public/models/airbus-first-officer.glb` | A320 cockpit GLB has no glTF validation errors | Passed with no errors, warnings, infos, or hints after approval-candidate export | Pass | Rerun after every A320 GLB update |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` | Browser integration gate artifact is structurally valid | Passed after updating the gate for production-candidate screenshots at 375, 768, 1440, and 1920 px | Pass | Rerun after browser evidence changes |
| `npm run references:validate` | Reference manifest is structurally valid | Passed for 24 references; wrote `.cache/references/manifest-validation.json` | Pass | Rerun after reference-manifest edits |
| `npm run references:download` | Download only entries with explicit direct image URLs and record hashes | Passed; downloaded 4 Commons images and skipped the link-only Simulation Daily source | Pass | Use `--force` only after reviewing changed local files |
| `npm run references:contact-sheet` | Generate labeled DC-9-51 contact sheet | Passed; wrote `art-source/references/dc9-51/contact-sheets/dc9-51-contact-sheet.svg` | Pass | Inspect after new visual sources |
| `npm run references:brief` | Generate modeling brief from manifest | Passed; wrote `art-source/references/dc9-51/notes/modeling-brief.md` | Pass | Regenerate after manifest edits |
| `npm run references:check` | Offline aggregate check validates manifest, artifacts, Blender scene, and preview render | Passed after recursive manifest validation; rendered `.cache/references/dc9_reference_overview.png` with Blender 5.1.2 | Pass with warnings | Rerun before reference-pack PR |
| `BLENDER_BIN=/home/user1/.local/bin/blender blender --background --python tools/blender/setup_dc9_reference_scene.py` | Create/update reference scene without touching `dc9_master.blend` | Passed with Blender 5.1.2; saved `art-source/blender/dc9_reference_scene.blend`; warning only: `Material.use_nodes` deprecation for Blender 6.0 | Pass | Track Blender API deprecation before Blender 6 |
| `npm ci` | Install locked dependencies from a portable registry | Passed after normalizing 447 lockfile `resolved` URLs from the internal package gateway to `https://registry.npmjs.org/`; 396 packages installed, 0 vulnerabilities | Pass | Keep lockfile URLs portable |
| `npm run check` | Lint, typecheck, tests, and build pass | Passed after A320 five-card feedback simplification; lint, typecheck, 16 tests, and production build completed | Pass | Rerun after code changes |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pipeline schemas, stage contracts, gate examples, and workflow eval runner validate | Passed after agent gate validation upgrade; 7 tests | Pass | Rerun after pipeline contract changes |
| `npm run pipeline:evals` | Deterministic guardrail evals catch known agent workflow failures | Passed; 6/6 eval fixtures covered Tripo proxy promotion, missing Agent 0 authority, optimization contract breaks, aircraft mixing, and spoiler-leak protection | Pass | Add fixtures for new agent failure modes |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate ...` | Structured gate examples validate for reference authority, runtime contract, material optimization, and browser integration | Passed for all four checked-in example artifacts | Pass | Real milestone gates must validate their own artifact paths |
| `npm run references:validate` | Reference manifest covers checked-in images and verifies recorded hashes | Passed for 24 references | Pass | Rerun after reference-manifest edits |
| 768 / 1440 px visual check | No clipping or blocked controls on the active desktop/tablet target | Captured A320 five-card feedback ATP screenshots at 768 and 1440 px plus wrong-placement 1440 px with no console or page errors; mobile mode explicitly deferred by owner request | Pass | Mobile cockpit UI polish is a later pass |
| DC-9 realism review | Captain view reads as model-correct DC-9 | In-progress against greybox placeholders | In progress | Requires Blender milestone and owner approval |
| Airbus realism review | Correct model-specific cockpit | A320 Cockpit 2 browser proof now applies a runtime FO/right-seat camera lock and controlled app lighting because the exported game camera was centered and imported GLB lights overexposed the scene; owner visual approval still pending | In progress | Owner review before removing proof label or calling final production art |

## 2026-07-09 Airbus production-ready approval candidate evidence

- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py` - pass.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass earlier in this run; Blender 5.1.2, Node v26.3.0, Git LFS available, dirty worktree expected for this implementation.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass after making missing Sketchfab viewer/parity files optional and making the contact sheet skip absent optional parity renders.
- Shading validation - pass; runtime node names, `game_id` metadata, UV layers, and approved assembly immutability preserved; dimension drift `0.0`.
- Loose-fragment cleanup - pass; quarantined `AIRBUS_A320_STATIC_119_OBJECT_93_001`, `AIRBUS_A320_STATIC_120_OBJECT_94`, `AIRBUS_A320_STATIC_121_OBJECT_95`, and `AIRBUS_A320_STATIC_122_OBJECT_96_001` in `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/loose-part-review-report.json`.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; regenerated `public/models/airbus-first-officer.glb` through the normal asset exporter.
- Runtime/staged GLB SHA-256: `c94ada9dbfe7bdfb29d3a75071120a1823c6963a0de2b6d3f815900974d9ac8b`; size `39,849,104` bytes.
- `strings public/models/airbus-first-officer.glb` quarantine check - pass; no quarantined `OBJECT_93` through `OBJECT_96` runtime names found in the deployable GLB.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-shading/manifests/shading-complete.json` - pass; hashes verified.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- Playwright browser screenshots captured from `http://127.0.0.1:5173/` after real A320 GLB load; each capture had 5 targets, zero `CLOCK` cards, visible canvas, and no console or page errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-375-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1440-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1920-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo-reduced-motion.png`
- Remaining limitation: owner visual approval is still required before removing `A320 PLAYABLE PROOF` or calling this final production Airbus cockpit art; direct imported-control pivots remain deferred.

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
- Pushed commit `c1c5981` and Vercel built preview `dpl_2DuN1koZ8WxSPHzVvbqefTYxYa65` from commit `c1c5981`.
- `npx vercel curl /models/airbus-first-officer.glb --deployment https://cockpit-escape-room-2ig7xn4kg-ottoagent007-gmailcoms-projects.vercel.app -- --head` - pass; deployed GLB now returns `content-type: model/gltf-binary` and `content-length: 35098268`.

## 2026-07-08 Airbus production-readiness browser lighting proof

- Added `plans/0004-a320-cockpit-production-readiness.md` for the A320 browser-proof checkpoint.
- Tuned `src/scenes/PrototypeScene.tsx` so the A320 runtime uses a named `AirbusRuntimeLighting` rig with ambient, hemisphere, directional, and point fills.
- Kept the exported `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` camera path and retained constrained FO OrbitControls with no pan, no Airbus zoom, a fixed look distance, and explicit polar/azimuth limits.
- Switched Canvas shadows to `percentage`, removing the repeated deprecated `PCFSoftShadowMap` warning from new captures; the remaining browser warning is the pre-existing Three `Clock` deprecation.
- No generated GLBs were edited or regenerated for this checkpoint.
- Baseline browser screenshots captured at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-375.png`
- Post-change browser screenshots captured at 1440, 768, and 375 px with no app console errors and no pre-drag hotspot outlines:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-375.png`
- Browser plugin tools were not available in this session, so Playwright was used for browser evidence.
- A direct mouse-drag orbit screenshot attempt was discarded because the Playwright page closed during the action; orbit behavior is covered by code review of `LimitedOrbitControls` constraints and the GLB/canvas smoke path.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests cover the A320 GLB load, hidden initial ATP, hotspot drag-enter highlight, decoy placement, Verify-to-locker transition, and reload persistence.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, with existing DC-9 informational rows still present.
- `git diff --check` - pass.
- Remaining limitation: owner visual approval is still required before removing `A320 PLAYABLE PROOF` or treating this as final production Airbus cockpit art.

## 2026-07-08 Airbus FO-view likeness correction

- Owner clarified that the production cockpit should keep the wide gameplay composition from `airbus-production-lighting-1440.png`; `public/images/a320-fo-view.png` is the visual likeness reference for material/render treatment, not a tighter camera-framing target.
- Rechecked the live Sketchfab model page for `A320 Cockpit 2`; the public page still identifies the same downloadable CC Attribution source model, but the detailed render stack remains better captured in the repo's extracted parity files.
- Reused the earlier A320 Sketchfab parity evidence: Studio-style lighting, three directional lights, matcap/reflection contribution, SSAO, SSR/TAA reference behavior, sharpen, vignette, and grain were recorded in `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-viewer-settings.json` and related shading reports.
- Added an Airbus-only dependency-free post-process path in `src/scenes/PrototypeScene.tsx` with Three example passes: `EffectComposer`, `RenderPass`, `SSAOPass`, `ShaderPass`, and `OutputPass`.
- The custom final shader applies subtle sharpen, subdued vignette, and tiny static grain. It is intentionally static so reduced-motion behavior is not affected.
- Restored the wide runtime camera constants to `68` degrees for desktop/tablet and `92` degrees for narrow portrait.
- Tested a runtime material/environment parity direction and backed it out because it over-brightened the panel and drifted farther from the dark blue-gray FO-view reference. The remaining visual delta should be handled in a Blender/source material pass, not by broad runtime material mutation.
- No `.blend` source, generated GLB, runtime node names, pivots, hierarchy, or `game_id` metadata changed in this checkpoint.
- Wide post-process screenshots captured at 1440, 768, and 375 px with no app console errors and no pre-drag hotspot outlines:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-375.png`
- Final current-state material-parity screenshots recaptured at 1440, 768, and 375 px with no app console errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-375.png`
- 1920x1080 comparison capture against the `FO-view.png` reference size:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-sketchfab-post-1920.png`
- Browser plugin tools were not available in this session, so Playwright was used for browser evidence.
- Console notes: captures still show the pre-existing Three `Clock` deprecation warning and occasional WebGL `ReadPixels` performance warnings from screenshots; no app errors were observed.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, with existing DC-9 informational rows still present.

## 2026-07-08 A320 production-ready approval candidate

- Owner rejected this A320 Cockpit 2 shading pass on 2026-07-08. The tracked `a320-cockpit-2-shading` build, job, stage input, asset report, and preview-render artifacts were removed from the working tree so they are not mistaken for approval evidence.
- Added `plans/0005-a320-cockpit-production-ready-candidate.md` for the owner-reviewable A320 production-candidate milestone.
- Updated `tools/blender/cockpit_pipeline/a320_shading_job.py` and `tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` so the A320 shading pass consumes `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-material-parity-summary.json` as a formal input.
- The regenerated source material pass preserves source texture links and UVs, maps cached Sketchfab material-channel values into portable Principled BSDF roughness/metallic/base/emissive settings, and records matcap/reflection contribution as material metadata.
- Updated `tools/blender/validate_scene.py` so imported visual candidates without runtime `interaction` metadata are reported as `candidateNotes`; real warnings now focus on imported scale and no-UV source limitations.
- First `npm run test:e2e -- e2e/smoke.spec.ts` attempt failed because the regenerated GLB lacked `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`, leaving the Airbus card tray gated behind cockpit loading. The Blender shading script now recreates and validates that runtime camera before export.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass after runtime-camera repair.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; exported `public/models/airbus-first-officer.glb`.
- `public/models/airbus-first-officer.glb` - 39,871,920 bytes; SHA-256 `97deb0f7f2dc9fba3e9b046b621c6afe35a2dda4d6752f6a48eb8b073206fcc2`.
- `.cache/assets/airbus/asset-report.json` - pass; Blender 5.1.2, 144 selected export objects, 140 `game_id` nodes, 129 imported-source warnings, 131 visual-candidate notes, and approval cameras `AIRBUS_A320_CAM_COMPLETE_INTERIOR_APPROVAL` plus `AIRBUS_A320_CAM_FIRST_OFFICER_APPROVAL`.
- `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/validation-report.json` - pass; runtime node names, `game_id` metadata, UV layers, source texture links, approved assembly immutability, and reimport validation all passed.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass after refreshing the runtime-contract artifact hash.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run assets:check` - pass; A320 GLB had no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 13 Vitest tests.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass after runtime-camera repair; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- Superseded Blender/source approval renders and Playwright production-candidate screenshots were removed after owner rejection.
- Remaining limitation: this is an owner-reviewable approval candidate, not final visual approval. Keep `A320 PLAYABLE PROOF` until owner approval is recorded.
- Remaining limitation: imported source meshes still have documented unapplied-scale/no-UV warnings and visual-candidate metadata notes; direct 3D control pivots are not promoted in this pass because browser hotspots remain the supported accessible interaction path.

## 2026-07-08 A320 five-card feedback simplification

- Added `plans/0006-a320-five-card-feedback-simplification.md` for the Airbus gameplay/UI simplification.
- Removed the active `CLOCK` card from Airbus First-Officer onboarding.
- Restored the ATP answer input and Verify button after owner correction; they appear only after all five labels are correct.
- The active Airbus flow now uses five visible label cards: `SIDESTICK`, `THRUST`, `GEAR`, `RADIO`, and `ALTITUDE`.
- Visible placement boxes now show immediate feedback: green for correct labels and red for wrong labels. Wrong labels remain recoverable by selecting or dragging another card.
- Completing all five labels now reveals the ATP question; entering `1500` advances to the locker and records `firstOfficer` completion.
- Kept legacy clock and decoy state fields for saved-game compatibility. A stale Airbus ATP answer is cleared on load so the question is answered fresh.
- Moved the Airbus status/instructions dock to the lower-right and reduced its desktop/tablet footprint.
- Owner clarified during implementation to forget mobile mode. Mobile cockpit UI polish is deferred and is not a pass/fail criterion for this checkpoint.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests cover no `CLOCK` card, ATP hidden until labels are correct, immediate red/green placement feedback, recovery, ATP submission, locker transition, GLB load, and reload persistence.
- `npm run lint` - pass.
- `npm run test` - pass; 16 Vitest tests.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- Superseded five-card screenshots were removed from the working tree at owner request. Use `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-1440.png` as the visual pickup baseline until a replacement proof is captured.

## 2026-07-08 A320 rejected-artifact cleanup and dock repair

- Deleted the rejected `a320-cockpit-2-shading` tracked artifact families from the working tree: shaded build outputs, shading job manifest/approval, shading input recipes, shading asset reports, and shading preview renders.
- Removed untracked bad browser evidence captures from the latest pass while keeping `airbus-production-wide-sketchfab-post-1440.png` as the owner-selected pickup baseline.
- Tightened the Airbus instructions dock so it stays as a compact lower-right panel instead of spanning the bottom of the viewport.
- Verified the active Airbus UI renders exactly five cards and no `CLOCK` card.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `git diff --check` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- Local-only Playwright proof: `.cache/screenshots/a320-right-dock-no-clock-1440.png`; viewport 1440 x 900, dock box `x=1081.6 y=716.3 width=336 height=161.3`, no console errors, cards `SIDESTICK`, `THRUST`, `GEAR`, `RADIO`, `ALTITUDE`, and `CLOCK` count 0.

## 2026-07-08 A320 FO-seat camera and color repair

- Confirmed the owner-reported dev server failure in `.cache/screenshots/current-a320-dev-before-fix-1440.png`: centered between-seat camera, nearly black/white cockpit, five cards, no `CLOCK` card, and compact lower-right dock.
- Root cause for the wrong viewpoint: exported `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` is centered at `x=0`. `src/scenes/PrototypeScene.tsx` now applies a runtime FO/right-seat offset and inward yaw before locking the Airbus look controls.
- Root cause for the washed render: the GLB imports high-intensity `Sun` directional lights, which were stacked with app lighting. Runtime now disables imported GLB lights and uses controlled Airbus scene lights.
- Browser proof after repair: `.cache/screenshots/a320-fo-seat-color-final-1440.png`; FO/right-seat biased view, colored A320 panels/controls, five cards, no `CLOCK` card, projected target layer, and compact lower-right dock.
- Responsive evidence: `.cache/screenshots/a320-fo-seat-color-final-768.png` and `.cache/screenshots/a320-fo-seat-color-final-375.png`; both showed five cards, no `CLOCK` card, projected target layer, and no page console errors.
- Blender cleanup boundary: no live Blender add-on listener was available on `127.0.0.1:9876`; only the `blender-mcp` wrapper process was running. Background inspection of `art-source/cockpit-pipeline/stages/assembly/output/a320-cockpit-2-assembly/a320-cockpit-2-assembly.blend` found one scene, one collection, zero cameras, and no suspicious temp/default objects to delete.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.

## 2026-07-08 A320 saved FO camera recovery

- Looked back through memory, git history, and PRs after the owner flagged that the Blender view should not require reconstructing the camera.
- Memory and PR #31 confirmed the intended workflow: open `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend` and use its saved `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`.
- Recovered the old shaded `.blend` LFS object from commit `d23ad95` into `.cache/blender-history/a320-cockpit-2-shaded-d23ad95.blend`.
- Background Blender inspection of that recovered file found active `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`: location `(0.167669, -0.695658, 0.140411)`, Euler rotation `(1.367064, 0, 0.282213)`, lens `50`, and camera angle `0.691111`.
- Blender MCP live scene was switched to that recovered file and exact saved camera with material preview and overlays off.
- Updated `tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` so future shaded exports write the recovered saved FO camera transform instead of the centerline camera.
- Updated `src/scenes/PrototypeScene.tsx` so the temporary FO offset/yaw repair only applies when the loaded legacy GLB camera is still centered. Future regenerated GLBs with the saved FO camera will not be double-offset.
- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` - pass.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- Live browser verification on the PR working tree: Vite at `http://127.0.0.1:4187/`, Playwright 1440 x 900 capture `.cache/screenshots/current-a320-fo-mode-live-1440.png`; FO/right-seat biased colored cockpit view, projected target layer, five cards, no `CLOCK` card, and no page console errors. The screenshot remains local cache, not committed preview evidence.
- PR validation batch before commit:
  - `git diff --check` - pass.
  - `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py tools/blender/validate_scene.py` - pass.
  - `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
  - `npm run assets:check` - pass; A320 reports no glTF errors/warnings/infos/hints, and DC-9 retains existing informational unused texcoord/empty-node rows.
  - `npm run pipeline:evals` - pass; 6/6 eval fixtures.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate ...` - pass for runtime contract, material optimization, and browser integration artifacts.
  - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
  - `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
