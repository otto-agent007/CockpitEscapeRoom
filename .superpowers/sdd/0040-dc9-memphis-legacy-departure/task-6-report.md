# Task 6 — source-only Concourse B candidate

## Status

`DONE`: owner Source Review Gate approval was received as `owner review 2026-08-28`. It is on `asset/dc9-memphis-source`, based on `251dbcc859b4cfd4a26b63ed86ac6a5ee286b504`; no merge, push, publication, assembly, ramp, taxi, runway, path, anchor, game-ID, production `.blend`, or public model was created.

Dirty tracked/new paths:

- `tools/blender/inspect_dc9_memphis_source.py`
- `tools/blender/cockpit_pipeline/tests/test_xplane_obj8_convert.py`
- `art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/job.json`
- `art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/manifests/sourcing-complete.json`
- `art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/`
- `asset-reports/dc9-memphis-legacy-departure.md`
- `plans/0040-dc9-memphis-legacy-departure.md`

## RED → GREEN and validation

1. RED: `python3 -m unittest tools.blender.cockpit_pipeline.tests.test_xplane_obj8_convert` failed exactly as expected with `ModuleNotFoundError: No module named 'tools.blender.inspect_dc9_memphis_source'`.
2. GREEN: the same command passed `Ran 9 tests ... OK` after adding the ordinary-Python `selected_source_names()` helper; `bpy` is imported only within Blender-only generation code.
3. Generation: `/home/user1/.local/bin/blender --background --factory-startup --disable-autoexec --python tools/blender/inspect_dc9_memphis_source.py -- --source-dir .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/Memphis_Nashville/KMEM --working-dir .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/optimized --output-dir art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source --manifest art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/manifests/sourcing-complete.json` exited 0 on Blender 5.1.2.
4. `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/agent0-dc9-memphis-legacy-authority.json`, `validate-job`, `validate-manifest`, `npx gltf-transform validate .../dc9-memphis-concourse-b-source.glb`, and `git diff --check` all passed. The final GLB validation had no errors, warnings, infos, or hints.

Blender printed headless EGL and user-cache write messages but produced all requested files. The source contact sheet and three previews were visually inspected for blank/corrupt output; this does not constitute source approval.

## Archive and selected-file verification

- Archive `Memphis_Nashville.zip`: `fc403141223be066094814d9ea06d820f75477fea419870b04ffd65153434b95`.
- `ConcourseB.obj`: `e88ab8411a033d5996c53053b14a894ff9824380a76891b27659549a7e9e6424`.
- `ConcourseB_2.obj`: `e4bb0f830c515d9c5a42cfe60bce5eb4dc3fb6ba5fdce6ca9c66d16ef49f7000`.
- `ConcourseB_2e.obj`: `2bf6f39b0e5e1f6a2e24fefb9469fc1c598884ddcfefc9f20b825cac375a109d`.
- `KMEMterminal.png`: `416c081c5e9f9ca40b183477da54f7ec8c5baa62ae0b9c0bdd961329ac394505`.
- `KMEMterminal_LIT.png`: `6a561147ceae328b311fba38de849d3102a4d2eb1238c3ddbbfb2315b7cf91e5`.
- `KMEMterminal_NML.png`: `9e1f272c64807981bee997aa08e7a3273ab5c4242f4ff58fb92cc20b1f8bf7e8`.

The Task 1 authority is valid, authorizes `agent1-sourcing`, and preserves owner-attested private noncommercial permission plus the exact Ted Davis credit.

## Generated artifacts

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| `art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/dc9-memphis-concourse-b-source.glb` | 19968 | `6cc30543653173d64b2997468009677e72e8923a184aaf886d01b1a842249177` |
| `.../candidate-metadata.json` | 3321 | `70740b2137ac30e06611e39d4f119ada0b889d853e80d4f5d408767a7b200c32` |
| `.../candidate-validation.json` | 1034 | `f86d71545bad9a0208c066defc7f650d9cf4fcac86c284d70e0ac7c90bbdcad3` |
| `.../concourse-b-source-contact-sheet.png` | 385453 | `e10810e0c83f64da4d1e2dcffc7605da252153b1efab7a78b63a8da43382bdaf` |
| `.../previews/ConcourseB-orthographic.png` | 173265 | `555a87acaee67818d6cc2231cba3b0215521af351a7214470fc9d3147fe45bcb` |
| `.../previews/ConcourseB_2-orthographic.png` | 174228 | `c0d3492edbdf8611f016cc5ff4798bf0a9e9e5cd68cbc87ac116f5cd279cd756` |
| `.../previews/ConcourseB_2e-orthographic.png` | 174516 | `e3e285b3c179f5643add30832048f5532c9fd52638eea94393395dfbb793de63` |
| `art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/manifests/sourcing-complete.json` | 4499 | `53802b3b648bfb048c81b1e8d930ed3a97232ee1f3a9014079e94da9c235dd7a` |
| `.cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/optimized/dc9-memphis-concourse-b-source-candidate.blend` | 96858 | `188f741bd57f8ba5182d69e913bfdb8f6edda832523b45523890a2685cf8420d` |
| `.cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/optimized/dc9-memphis-concourse-b-source-first-export.glb` | 19968 | `6cc30543653173d64b2997468009677e72e8923a184aaf886d01b1a842249177` |

## Source measurements and constraints

`KMEM_CONCOURSE_B_SOURCE_CANDIDATE` contains only source roots for the three selected OBJ8 files and one neutral base-color material. Measurements after the existing OBJ8 coordinate conversion are:

- `ConcourseB.obj`: 178 triangles; 113.010078 × 226.324524 × 10.969081 m.
- `ConcourseB_2.obj`: 30 triangles; 214.772103 × 30.408600 × 8.000000 m.
- `ConcourseB_2e.obj`: 24 triangles; 216.586105 × 28.782400 × 8.000000 m.

All source objects declare day `KMEMterminal.png`, lit `KMEMterminal_LIT.png`, and normal `KMEMterminal_NML.png`; the parser records `TEXTURE_NORMAL` as unsupported, and no day/lit/normal/emissive texture is wired into the candidate. AutoGate, OpenSceneryX, Planes, aircraft, vehicles, clutter, scripts, add-ons, and unrelated KMEM objects are excluded. The 2019-01-22 source is a later simulator revision and may only serve the stated 1995-memory geometry base, not an exact historical reconstruction.

## Owner review paths and concerns

- Contact sheet: `art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/concourse-b-source-contact-sheet.png`
- Preview 1: `art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/previews/ConcourseB-orthographic.png`
- Preview 2: `art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/previews/ConcourseB_2-orthographic.png`
- Preview 3: `art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/previews/ConcourseB_2e-orthographic.png`

Concern: the neutral Workbench views prove nonblank geometry and orientation only; they intentionally omit the source texture set and cannot establish final visual fidelity. The owner approved only source geometry/orientation for neutral assembly. Textures and final fidelity remain unapproved.

## Owner decision and final validation — 2026-08-28

`art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/source-approval.json` records `stage: "source-approved"`, `approved: true`, `approvedBy: "owner review 2026-08-28"`, the sourcing manifest path/hash, and the exact approved candidate GLB/metadata paths and hashes. Its scope is: “Source geometry and orientation approved for neutral assembly; textures and final fidelity are not yet approved.”

Final checks run after creating the approval were: `python3 -m unittest tools.blender.cockpit_pipeline.tests.test_xplane_obj8_convert` (9 tests, OK); `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/agent0-dc9-memphis-legacy-authority.json` (valid); `validate-job` (valid); `validate-manifest` (verified hashes); `npx gltf-transform validate` (no errors, warnings, infos, or hints); `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from sourcing_complete --to source-approved` (valid); exact approval-to-manifest/file hash consistency checks (valid); and `git diff --check` (passed). Controller integration remains out of scope.
