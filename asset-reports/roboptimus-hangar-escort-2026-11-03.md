# Roboptimus hangar escort — local review

## Screenshot readiness and reduced-motion first pose

The completion evidence fixture now verifies the guide and hangar together and holds the real narration loop only while capturing. Reduced-motion runtime now evaluates the authored first pose at time zero before pausing, correcting the bind pose seen in actual captures. Normal motion, framing, lighting and all asset bytes remain unchanged. Final neutral-pose captures at 375/768/1440 are inspected under `preview-renders/roboptimus-hangar-2026-11-03/review-evidence/`.

A current no-cache runtime fetch matches disk for both assets. Guide: 4,185,524 bytes, SHA-256 `6b98e874c8686a2e5ccfc16cd41c621671429ff9ad22d82a3bce360e1116943e`, 67 nodes, two `game_id` extras, one material and three 1600px maps. Hangar: 2,063,528 bytes, SHA-256 `99b60b0dfef79d81c6f8a58d2dd7c9ee45f40ea8c2680df0bad7d00bd4c3eb19`, six nodes, no interactive `game_id`, three materials and one 1K atlas. No Blender export or generated-asset edit was needed.

## Latest scene and loading checkpoint

This checkpoint supersedes the historical sequence and loading-image descriptions below. Current sequence: close personal greeting → walk to closed doors → dance as doors open onto darkness → fade into the automatically playing film → family tribute. The guide now uses the authored `ROBOPTIMUS_PERSONAL_GREETING`, retaining the existing walk/dance and geometry; its runtime file is 4,185,524 bytes, SHA-256 `6b98e874c8686a2e5ccfc16cd41c621671429ff9ad22d82a3bce360e1116943e`. The hangar remains 2,063,528 bytes, SHA-256 `99b60b0dfef79d81c6f8a58d2dd7c9ee45f40ea8c2680df0bad7d00bd4c3eb19`. No asset bytes changed in this loading repair.

Both normal loading boundaries now show a neutral background. The Canvas stays transparent until the complete robot/hangar scene has drawn once, then fades in over 180 ms (no transition under reduced motion). Greeting readiness follows that first draw, with no premature four-second timeout. The standalone personal waiting still remains for genuine load failures and accessible mode only. Actual loading and rendered-scene screenshots at 375/768/1440 were inspected in `/tmp/roboptimus-scene-ready-proof/`. Source review found no new critical/high issue; exact commands/results and local review limits are in `TEST_REPORT.md` and plan 0075.

## Current authored greeting source

`tools/blender/author_roboptimus_greeting.py` authors the six-second `ROBOPTIMUS_PERSONAL_GREETING` in `art-source/blender/roboptimus_personal_greeting.blend` (37,481,649 bytes, SHA-256 `6ae82a5036599cbdfee7ebcbb556632837b0469f4b909c5383e08eefc3c3175b`). The derivative retains the original 31 actions plus the new action. Its 145 frames at 24 fps keep both feet planted (reported foot drift 0.0) while using a gentle nod, palm-up welcome and invitation toward the hangar. Export with `tools/blender/export_optimus_guide_candidate.py -- personal-escort`, then resize only the three PBR maps to 1600px. The current GLB retains 67 nodes, 65 joints, 40,462 triangles and one material. Validation has zero errors and the existing skinned non-root/tangent warnings plus NPOT informational notices. Position/normal/UV/joint/weight streams and both original walk/dance animation channels compare byte-identical with the prior combined runtime; the imported wave is absent.

`public/images/roboptimus-personal-waiting.png` is a direct browser render of the new greeting's first frame: 662×576 RGBA, 101,429 bytes, SHA-256 `5e6f408fb284cefff74ee0410e38354756931142b3a18fab44656cc32a4339f6`. It is used only for accessible/failed scene presentation, not normal preloading. The regenerated exact line and local sound defaults are documented in the separate [audio report](roboptimus-greeting-audio-2026-11-03.md).

The owner authorized preparing the PR on 2026-11-03. Current runtime/source hashes and behavior above are authoritative. The sections below retain the **superseded initial candidate** and its original evidence; their post-film dance, original greeting and older combined-file hash are historical.

## Owner direction and runtime

Roboptimus waits outside the hangar and speaks the unchanged Heart greeting. The doors open as he turns and walks inside, then the protected Model FLY film starts automatically. The existing looping dance follows the film beside the unchanged family tribute. Skip film opens the readable tribute directly. Native/reduced-motion and failed/late scene loads can continue directly to the film; delayed assets cannot start a shortened walk.

The existing greeting/walking and dancing assets remain byte-identical. `optimus-guide-review.glb` is the current Gen 3 body with `Armature|greet_01.001` / `Armature|walk.001`, 4,844,400 bytes, SHA-256 `e2e8c22862eae4ea71ac642dbc2b63bae9636d98d3333b553f803929076d2375`. The separate unchanged `dance_02` asset remains 4,991,096 bytes, SHA-256 `285f8a53e53a3594c11cc5eb2ebdb42d0d221bc2d9df08cdfba930c8b4e49b11`. Both retain the existing 65-joint skin, body, maps and guide IDs. No clip retargeting or humanoid vehicle transformation was introduced.

## Combined runtime guide and production packaging

The first production browser run exposed an existing Vite rule that omits the former greeting/walk GLB. Restoring that additional whole robot would exceed the unchanged total/per-model budgets. The existing Blender exporter now has a `hangar-escort` variant that exports the same body/rig and all three existing clips together, without retargeting or editing their motion. The historical separate GLBs remain intact in source and are both omitted from the player build.

`public/models/roboptimus-guide.glb` is **4,147,260 bytes**, SHA-256 **`c38c1f161b60f20a7764b9581f502f424f0dbeb5338aa48061f3f05c6f72ae53`**. It retains 67 nodes, 65 joints, 40,462 triangles, one material, three 1600×1600 PBR maps and the same guide IDs. Texture-only resizing from the packed source is the only optimization; no decimation/hierarchy rewrite. Raw Blender export is 17,201,528 bytes. Source master is unchanged at 37,058,628 bytes, SHA-256 `a86f0c018ff95aae8f65b586067748fc1d82aae5d44403032bb18435926fbfe7`.

The runtime clip names remain `Armature|greet_01.001`, `Armature|walk.001`, `Armature|dance_02.001` (85/57/308 source frames at 24 fps). glTF validation reports no errors, the existing non-root skinned-mesh warning and a runtime-generated tangent-space warning; 1600px maps also produce non-power-of-two informational notices. Three.js renders the normal maps; browser evidence checks the result. The new versioned URL is shared across motions, while the component plays the dance only after film completion. Both environment and robot remain lazy and gated behind Airbus completion.

## Hangar derivative and source

`tools/blender/export_roboptimus_hangar.py` runs Blender 5.1.2 in factory/background mode with auto-execution disabled on `art-source/blender/tesla_reward.blend`. The original master remains unchanged: 22,082,575 bytes, SHA-256 `6aee4a6694f025779aa11b61ba2e9b6816d844d2ea7a3756c45dd96a45455e1a`.

Export selects exactly `TESLA_HANGAR`, `TESLA_HANGAR_APRON`, `TESLA_HANGAR_DOOR_LEFT`, `TESLA_HANGAR_DOOR_RIGHT`, `TESLA_HANGAR_LEGACY_SIGN` and `TESLA_HANGAR_SOURCE_SHELL`. The source facade painted a closed roller door on continuous geometry. A scoped Blender bmesh cut removes 64 doorway faces while interpolating surrounding atlas UVs, and positions the two existing door leaves in that opening. The car and Flight Mode kit are excluded. World placement/door motion and a plain outside ground surface are composed in the Three.js scene.

The raw selected export has 25,606 triangles, three materials, one 2K atlas, no skins and no animation clips, at 7,969,548 bytes. Texture-only `gltf-transform resize --width 1024 --height 1024` preserves node hierarchy/geometry and produces `public/models/roboptimus-hangar.glb`: **2,063,528 bytes**, SHA-256 **`99b60b0dfef79d81c6f8a58d2dd7c9ee45f40ea8c2680df0bad7d00bd4c3eb19`**. The derivative retains six named nodes, five meshes, three materials and one 1K texture. glTF validation reports zero errors/warnings, with only unused UV attribute information. No destructive mesh optimization or generated GLB hand-editing occurred.

Source attribution remains [Hangar by nermin](https://sketchfab.com/3d-models/hangar-64f7d287f5274029bc29755a9839ebbf), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This derivative cuts an opening and moves/resizes the existing doors. The original intake/attribution is `asset-reports/model-y-hangar-source-intake.json`; license metadata remains in exported extras.

## Waiting still and fallbacks

`public/images/roboptimus-waiting.png` is a direct transparent browser render of frame zero of the same greeting clip with the existing neutral guide lights/camera. It is **662×576 RGBA**, **106,287 bytes**, SHA-256 **`3df02a0f3f8e47d7c0b308488c99a7ee121b93629c0775d98c579199db5f15cb`**. No AI image editing was used. The first scene's loading/error/accessibility branches use this standing pose; the separate dancing still remains only for the final dance. Retired waving art remains historical and is never requested by the flow.

## Browser evidence and review limits

Actual local Chromium captured greeting, open doorway/walk and final dance at 1440×900, plus greeting/finale at 768 and 375 widths. The screenshots were inspected for visible robot identity, framing, a real doorway, caption/control reachability, complete tribute and horizontal overflow. Paths are under `preview-renders/roboptimus-hangar-2026-11-03/`. The initial capture exposed the source's closed facade and caption overlap; the scoped doorway cut and eye-height correction resolve those defects. The first renderer has been removed from the completed Airbus path so the hidden cockpit no longer renders behind this scene.

Initial regression failures identified old dance-asset expectations and a fake clock advancing beyond the new automatic handoff. Those expectations now target the greeting/walk asset and stop at the completion boundary. First-draw readiness prevents shader/upload work from consuming the greeting before the figure appears. Independent review identified a late-loading partial escort; its held-GLB regression failed before the unavailable-scene guard and passed afterward. Audio is paused on unmount/mute, and readiness does not restart an already-playing manual greeting. Re-review found no remaining important source findings.

This is a local visual review candidate. Final commands/results and owner-visible browser receipt are recorded in plan 0075 and `TEST_REPORT.md`. The film, audio, old GLBs and Blender master were not changed. No new dependency, hosted publication or final owner visual approval is implied.
