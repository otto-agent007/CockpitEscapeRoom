# DC-9 Memphis legacy departure — source candidate

## Status

Source Review Gate approved by `owner review 2026-08-28`. `source-approval.json` authorizes source geometry/orientation for Agent 2 neutral assembly only; source textures and final fidelity remain unapproved, and this is not a runtime/public model.

## Authority and intake

- Authority: `art-source/cockpit-pipeline/gates/agent0-dc9-memphis-legacy-authority.json` (`approved-for-next-stage` → `agent1-sourcing`).
- Archive: `Memphis_Nashville.zip`, SHA-256 `fc403141223be066094814d9ea06d820f75477fea419870b04ffd65153434b95`.
- Permission: owner-attested private noncommercial, dated 2026-08-27. Credit retained: “Memphis scenery derived from the Memphis/Nashville Scenery Package by Ted Davis.”
- Imported exactly: `ConcourseB.obj`, `ConcourseB_2.obj`, and `ConcourseB_2e.obj`. AutoGate, OpenSceneryX, Planes, aircraft, vehicles, clutter, scripts, add-ons, and unrelated objects were excluded; no downloaded code was executed.

## Candidate evidence

The neutral root is `KMEM_CONCOURSE_B_SOURCE_CANDIDATE`, with one `KMEM_SOURCE_NEUTRAL_BASE_COLOR` material and no texture, normal, emissive, game-ID, ground, ramp, taxi, runway, path, or anchor authoring. Source scale/orientation is preserved through the existing OBJ8 X-right/Y-up/Z-south → Blender X-right/Y-forward/Z-up importer.

| Source object | Triangles | Blender-meter dimensions |
| --- | ---: | --- |
| `ConcourseB.obj` | 178 | 113.010078 × 226.324524 × 10.969081 |
| `ConcourseB_2.obj` | 30 | 214.772103 × 30.408600 × 8.000000 |
| `ConcourseB_2e.obj` | 24 | 216.586105 × 28.782400 × 8.000000 |

All three source OBJ8 files declare `KMEMterminal.png` and `KMEMterminal_LIT.png`; `KMEMterminal_NML.png` is declared by the unsupported `TEXTURE_NORMAL` directive. Texture declarations are recorded as source evidence only and are not wired into the neutral candidate.

The Ted Davis KMEM scenery revision is dated 2019-01-22 and is a later simulator source used only as a 1995-memory geometry base, not an exact historical reconstruction.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `dc9-memphis-concourse-b-source.glb` | 19968 | `6cc30543653173d64b2997468009677e72e8923a184aaf886d01b1a842249177` |
| `candidate-metadata.json` | 3321 | `70740b2137ac30e06611e39d4f119ada0b889d853e80d4f5d408767a7b200c32` |
| `candidate-validation.json` | 1034 | `f86d71545bad9a0208c066defc7f650d9cf4fcac86c284d70e0ac7c90bbdcad3` |
| `concourse-b-source-contact-sheet.png` | 385453 | `e10810e0c83f64da4d1e2dcffc7605da252153b1efab7a78b63a8da43382bdaf` |
| `previews/ConcourseB-orthographic.png` | 173265 | `555a87acaee67818d6cc2231cba3b0215521af351a7214470fc9d3147fe45bcb` |
| `previews/ConcourseB_2-orthographic.png` | 174228 | `c0d3492edbdf8611f016cc5ff4798bf0a9e9e5cd68cbc87ac116f5cd279cd756` |
| `previews/ConcourseB_2e-orthographic.png` | 174516 | `e3e285b3c179f5643add30832048f5532c9fd52638eea94393395dfbb793de63` |

The disposable source candidate `.blend` (96858 bytes, SHA-256 `188f741bd57f8ba5182d69e913bfdb8f6edda832523b45523890a2685cf8420d`) and first GLB export (19968 bytes, SHA-256 `6cc30543653173d64b2997468009677e72e8923a184aaf886d01b1a842249177`) remain under `.cache/cockpit-pipeline/.../extracted/optimized/`.

## Validation and review evidence

- RED: `python3 -m unittest tools.blender.cockpit_pipeline.tests.test_xplane_obj8_convert` failed with `ModuleNotFoundError` for the absent inspector.
- GREEN: the same command passed 9 tests after adding the pure `selected_source_names()` helper.
- Blender 5.1.2 ran with `--background --factory-startup --disable-autoexec`; the candidate/manifest generation completed successfully. Headless EGL and Blender cache-write messages were emitted, but all requested review files, cache artifacts, and manifest were written.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/manifests/sourcing-complete.json` passed with verified hashes.
- `npx gltf-transform validate art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/dc9-memphis-concourse-b-source.glb` reported no errors, warnings, infos, or hints.
- `git diff --check` passed.
- The source contact sheet and all three previews were inspected for blank/corrupt output. They are readable neutral silhouettes, not final visual-quality approval.

Owner review inputs are `concourse-b-source-contact-sheet.png` and the three orthographic previews under `art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/`.

## Owner Source Review Gate — 2026-08-28

The owner approved the exact candidate GLB SHA-256 `6cc30543653173d64b2997468009677e72e8923a184aaf886d01b1a842249177` and candidate metadata SHA-256 `70740b2137ac30e06611e39d4f119ada0b889d853e80d4f5d408767a7b200c32` for neutral assembly. The signed scope is deliberately limited to source geometry and orientation. Textures and final fidelity remain unapproved; no ramp, taxi, runway, path, anchors, or materials were created during Task 6.

## Neutral assembly evidence — Assembly Review Gate pending

Task 7 consumed only the owner-approved Task 6 candidate after rechecking the source-manifest, candidate GLB, and candidate-metadata SHA-256 values. The resulting neutral staging asset is **not approved** for shading, runtime integration, public-model promotion, or production use.

- Blender: 5.1.2, run with `--background --factory-startup --disable-autoexec`.
- Staged neutral master: `art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/dc9-memphis-legacy-neutral.blend` — 105858 bytes, SHA-256 `9e413dc6a72784ceb3427d90cd296deb92beccc48c50a03609ad51f9db4d55b0`.
- Staged neutral GLB: `art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/dc9-memphis-legacy-neutral.glb` — 40428 bytes, SHA-256 `92820c6daa5f8d31dd2518f9ff3e4002167c5da83504e052f3d9b0c36cd57471`.
- Reimport: pass; 15 meshes, 376 triangles, 3 neutral materials, five unique `game_id` anchors at their authored coordinates. The source group contains only `ConcourseB.obj`, `ConcourseB_2.obj`, and `ConcourseB_2e.obj`.
- Contract: `art-source/cockpit-pipeline/gates/dc9-memphis-legacy-runtime-contract.json` validated with the exact HTML equivalent `MemphisDeparturePanel qualitative path control` for every anchor.
- Validation: layout unit tests passed 2/2; runtime-contract and computed-hash manifest validation passed. `npx gltf-transform validate` reported no errors or warnings; its 11 unused-UV rows are informational source-mesh notices only.
- Preview files decoded and are nonblank at `previews/neutral-1440.png`, `previews/neutral-768.png`, and `previews/neutral-375.png`. The low-poly, untextured terminal silhouette is visible from the ramp overview; owner review must judge whether its framing reads sufficiently before any materials work.

Known deviation: this is a compressed 1995 memory composition, not exact KMEM geography. No normal/emissive maps, final textures, wear, color grading, cockpit/exterior-aircraft geometry, browser files, public model, or `assembly-approval.json` were created.

## Owner Assembly Review Gate — 2026-08-28

The owner approved the revised 36 mm neutral composition for materials work. `assembly-approval.json` pins the 3669-byte assembly manifest (`83f16a2c9efdace15006d74eabe022753e5e0ff5ba008701cac340f88c920648`), 105851-byte neutral master (`393ba3b742578fe223b9853fb3ed4ff50c802d69c801e38d7e5688551ee22032`), 40428-byte neutral GLB (`92820c6daa5f8d31dd2518f9ff3e4002167c5da83504e052f3d9b0c36cd57471`), runtime contract, resolved layout, node/pivot report, and the final 1440/768/375 review PNG hashes.

Fresh reimport retained the five exact anchors, 15 meshes, 376 triangles, and 3 materials. Layout, runtime-contract, manifest, GLB, source/assembly-approval consistency, and `assembly_complete -> assembly-approved` transition validation passed. The reproducible generated `.blend1` backup was removed; the approved `.blend` remains. The approval scope is limited to revised neutral composition, route framing, Concourse placement, and anchors for materials work. Textures, final fidelity, runtime integration, and public-model promotion remain unapproved.

## Materials approval and production promotion — 2026-08-28

The owner selected the original restrained color grade after rejecting the brighter/warmer repair as too brown. The approved preset uses AgX exposure `-0.2`, world strength `0.32`, sun energy `1.65`, and fill energy `1350`. Formal approval pins the current shaded master SHA-256 `4e8cc6cc6a7a3dcef71f1f4579efda4c2a17f49e2dee7ee62db9c818ed487d3d` and deployable GLB SHA-256 `73b80e6f388b15c853b1ec39b6af6a31b36da040d447f7a6cc916ea7924d346b`.

- Production master: `art-source/blender/dc9-memphis-legacy-departure.blend`, 1,908,346 bytes, byte-identical to the approved shaded master.
- Production model: `public/models/dc9-memphis-legacy-departure.glb`, 1,873,520 bytes, byte-identical to the approved shaded GLB.
- Runtime metrics: 25 root-subtree objects, 15 meshes, 376 triangles, 5 materials, and three embedded 2048x1024 selected textures.
- Optimization decision: preserve topology, hierarchy, pivots, transforms, extras, packed texture bytes, and tangents. No join, decimation, resize, or other destructive optimization was justified because the GLB is well below the 5,000-triangle, six-material, and 8 MiB budgets.
- Semantic Blender validation passed for the promoted master: names/hierarchy/transforms, 36 mm review camera, exact restored lighting grade, material/node assignments, normal strength `0.35`, emissive strength `0.045`, packed texture identities/dimensions, anchors/game IDs/extras, Task 7 input immutability, and GLB reimport all matched.
- The exact Ted Davis credit is recorded in `public/models/README.md`. Runtime/browser integration remains Task 9 and was not started here.

Validation passed through `npm run asset:dc9-memphis`, the focused model-contract test, `npm run assets:check`, and `npm run pipeline:evals` (6/6). glTF validation reports no errors; the exact selected normal PNG retains one ancillary image-feature warning, and simple untextured surfaces retain informational unused tangent/UV notices.

## Task 8 review hardening — 2026-08-28

The production asset entry point now fails closed on the exact formal `shading-approval.json` before Blender validation or public copying. Its pure contract verifies approval state/stage and job IDs, exact manifest/gate paths and current hashes, both approved artifact path/hash/byte records, and byte identity of the promoted master and approved GLB. The GLB contract now scans prohibited source-library names and cockpit-interaction metadata across nodes, meshes, materials, images, textures, and scenes. These checks do not alter approved artifact bytes.

Focused approval/model-contract tests, the real Blender-backed asset command, all production asset checks, pipeline evals 6/6, lint, types, and production build passed after this hardening. The collection scan covers every top-level glTF object array, including accessors, cameras, animations, and samplers in addition to the named collections above.

## Terminal composition re-assembly — Assembly Review Gate pending — 2026-08-28

Owner-selected Task 10 composition option 1, executed on `asset/dc9-memphis-terminal-composition`.

- **Root cause, measured.** Mapping the authored `CAM_DC9_FIRST_OFFICER_GAME` world pose (seat offset right 0.45 m / back 3.24 m / up 0.70 m; view 4.66° left of the nose, 22.64° down) through the `dc9MemphisWorldPose` inverse transform at `rampStart` places every prior concourse piece at bearings +50° to +163° off the nose — outside even the 1440-px windshield wedge (±45°) and beyond the 0.72 rad look-right limit. Both rejected yaw experiments could never have reached it.
- **Second defect found and fixed.** The prior taxi surface (X −94.5..−50.5) never reached the hold-short leg at X −120 (the runtime spline overshoots to X −125), so the aircraft taxied over sky-colored void from roughly Y 163 through hold short; the recorded `1440-hold-short.png` browser capture confirms an all-void windshield. The taxi surface now spans X −140..−50.5 / Y 15..265, the ramp extends north to Y 230, and a new `KMEM_TERMINAL_APRON` (X −300..−151, Y 120..640) carries the west frontage.
- **New composition (west frontage + right satellite).** `ConcourseB.obj` at (−242, 250) rot 0 and `ConcourseB_2.obj` at (−200, 385) rot 90 line the west side of the departure corridor as a continuous frontage; `ConcourseB_2e.obj` at (18, 118) rot 116 stands on the ramp apron as a near-right satellite arm (89–223 m) rewarding the look-right cue. Ramp-start windshield coverage (measured camera, occlusion-aware elevation bands): 74.8% of the 1440 wedge, 83.2% at 768, 97.3% at 375. Worst route-corridor clearance 50.9 m (≥30 required); worst ground-track pavement shoulder 15.2 m (≥12 required); no building on taxi/runway pavement; building separation ≥9.5 m.
- **Silent rotation loss caught by GLB read-back.** The first re-assembly exported both rotated piers unrotated: the glTF importer leaves imported objects in `QUATERNION` rotation mode, where a `rotation_euler` write is silently ignored — which also means the previously shipped neutral/shaded/production GLBs never carried their authored 90-degree pier rotations. The script now forces `rotation_mode = "XYZ"`, verifies every source root's `matrix_world` against the authored layout before export, and the reimport report records and checks the exported `sourceTransforms`; the corrected GLB's world bounds were verified against the layout footprints with `@gltf-transform/core`.
- **Validator hardening.** `kmem_legacy_layout.validate_layout` now rejects a composition the measured ramp-start windshield cannot see, a ground track leaving the authored pavement, and any footprint inside the 30 m route corridor; the retired east-side transforms and the retired ground set are pinned as failing regressions in `test_kmem_legacy_layout.py` (11 tests).
- **Windshield previews institutionalized.** Agent 2 now renders `windshield-ramp-start-{1440,768,375}.png`, `windshield-hold-short-1440.png`, `windshield-runway-lineup-1440.png`, and `windshield-takeoff-roll-1440.png` from the measured first-officer rig beside the 36 mm review views, so review previews can no longer hide the in-game view.
- **Martini-glass canopy accent (owner conversational approval 2026-08-28, delegated judgment).** Reference imagery showed the winged roofline is the real terminal's signature from the apron, so `KMEM_TERMINAL_CANOPY` adds eight stylized modules over the main block: paired thin slabs sweeping from a low valley over a slender column to 17.07 m tips, floating 2.5 m above the 11.07 m roof so the gap reads as the recessed glazing band. Authored purely in `TERMINAL_CANOPY`/`terminal_canopy_parts()` (14 layout tests), joined to one identity-transform object, and guarded by a fail-closed exported-bounds comparison; the scene totals 676 triangles. Shading will assign matte off-white `KMEM_CANOPY_MATERIAL` (sixth and final material) and the ramp material to `KMEM_TERMINAL_APRON`; those assignments and their validation are already in `shade_dc9_memphis_legacy.py`.
- **Commands run (all exit 0):** `python3 -m unittest tools.blender.cockpit_pipeline.tests.test_kmem_legacy_layout tools.blender.cockpit_pipeline.tests.test_xplane_obj8_convert` (21 tests); Blender 5.1.2 `--background --factory-startup --disable-autoexec` Agent 2 run; `pipeline_cli validate-gate runtime-contract`; `pipeline_cli validate-manifest` (verified hashes); `npx gltf-transform validate` (no errors/warnings/hints).
- **Artifacts:** neutral GLB SHA-256 `8c7b2b9e3d008b11fc3df76b02cafc64cc3e7c80d05adf186b794970d55c26e3`, neutral blend SHA-256 `19f04a1437beb59192992084e5a17264b8b1bc116e083126a359be74e9475f0d`.
- **Pending:** owner Assembly Review Gate re-approval of this composition (the prior `assembly-approval.json` intentionally no longer matches, so shading refuses to run); then the shading re-run must also assign the ramp material to `KMEM_TERMINAL_APRON` before promotion, browser proof, and the Task 10 resume.

## Terminal-composition shading and production promotion — 2026-08-28

- Owner reviewed the canopy-bearing windshield and 36 mm previews in session and approved proceeding; `assembly-approval.json` (approval-002) and `shading-approval.json` (approval-002) record those decisions with exact current hashes, and the shading script's pinned enforcement constants were updated to match.
- Agent 3 re-shaded the approved west-frontage assembly under the unchanged owner-ruled restrained grade: identical terminal texture wiring (base + 0.35 normal + 0.045 restrained lit), identical review lighting; additions are `KMEM_CANOPY_MATERIAL` (matte off-white, sixth and final material) on `KMEM_TERMINAL_CANOPY` and the existing ramp material on `KMEM_TERMINAL_APRON`.
- Semantic validation passed at 27 objects / 17 meshes / 676 triangles / 6 materials; material-optimization gate, computed-hash shading manifest, and clean GLB validation all passed.
- Promoted master `art-source/blender/dc9-memphis-legacy-departure.blend` SHA-256 `cb9ed896e4c248b2ad9c194619a01fb9442eefb4a2745254153982acabe991e6`; deployable `public/models/dc9-memphis-legacy-departure.glb` SHA-256 `4732f1dcfff0f999ed77cb008b225b7d980be210553397f267554cd0c71045be` (1,906,412 bytes, within the 8 MiB budget). `DC9_MEMPHIS_MODEL_URL` version bumped to `4732f1dc`.
- `npm run asset:dc9-memphis` (formal approval enforcement + Blender 5.1.2 semantic validation + exact public copy), the three Memphis contract test files, `npm run assets:check`, and `npm run pipeline:evals` (6/6) all passed; ESLint, TypeScript, and the 561-test Vitest suite pass with the version bump.

## Background scenery and clerestory band — 2026-08-29

- Owner-directed in session: fill in background scenery and connect the canopy roof to the terminal. Added project-authored `KMEM_FIELD` (muted grass plane below pavement tops, closing the void horizon), `KMEM_TREELINE_WEST/NORTH/EAST` (distant dark-green strips framing the frontage, runway end, and east apron; a new layout validator keeps all background ≥100 m from the guided route), and `KMEM_TERMINAL_CLERESTORY` (dark recessed band, reusing the near-black runway matte, seating the martini-glass canopy on the terminal roof).
- Assembly and shading re-ran under the approval-003 records: 32 objects / 22 meshes / 736 triangles / 8 materials (`KMEM_FIELD_MATERIAL` and `KMEM_TREELINE_MATERIAL` added; contract material budget raised from six to eight with rationale in `dc9-memphis-model-contract.mjs`). Grade, terminal texture wiring, and review lighting unchanged.
- All gates, computed-hash manifests, GLB validation, the 10 Memphis contract tests, `npm run assets:check`, and `npm run pipeline:evals` (6/6) pass. Deployable GLB SHA-256 `e730c5918007e7200096f743b149c8cd1ad748da6ffc1e449d6795cd4b564d63` (1,916,956 bytes); `DC9_MEMPHIS_MODEL_URL` version `e730c591`. Frame budget on the GTX 1050 Ti is unchanged at median/p95 16.7 ms with scene objects stable [33, 33, 33].
