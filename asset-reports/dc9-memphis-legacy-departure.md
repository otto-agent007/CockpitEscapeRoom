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
