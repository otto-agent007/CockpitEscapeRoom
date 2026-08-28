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
