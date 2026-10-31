# Optimus guide and fullscreen reward browser candidate — 2026-10-29

## Goal and status

After Engine-Out Handling, show the Optimus 3 candidate moving while the owner-selected Heart line congratulates the player, then let **Reveal reward** start the protected Tesla film across the viewport and request browser fullscreen. This is an interactive local review candidate. The owner has not accepted the robot's look, motion or release rights.

## Context and constraints

The owner rejected the checkmark/text-only browser ending and framed film. The player must see the robot in the game, with a native caption, replay, sound preference and reward action. The red Model Y and film remain unrequested before the reward action. The robot asset loads only after Airbus completion; reduced motion holds a static pose, and missing WebGL/model loading keeps a rendered image plus the HTML path. Fullscreen requests require a player gesture, so the reward action makes that request. The film still fills the viewport and offers Play when the browser refuses fullscreen or autoplay.

## Source and export

- Blender 5.1.2 opened the preserved 31-action Tripo FBX review scene. `tools/blender/export_optimus_guide_candidate.py` renamed the rig/body, added `game_id` extras, and saved the full packed-texture source as `art-source/blender/optimus_guide_source_candidate.blend` (37,058,628 bytes; SHA-256 `a86f0c018ff95aae8f65b586067748fc1d82aae5d44403032bb18435926fbfe7`). The earlier original archive and intake blend remain unchanged.
- A separate raw GLB in `.cache/assets/optimus-guide/` retains `Armature|greet_01.001` and `Armature|walk.001`. It is 16,892,796 bytes; SHA-256 `a3f54dd3c5a8da7a5cb41b2829e39fe9b4602fbb0d55306edde7a75752ddf8ce`.
- Texture-only Lanczos3 resizing produced `public/models/optimus-guide-review.glb` through a validated `.cache` intermediate. The deployable review candidate is 4,844,400 bytes; SHA-256 `e2e8c22862eae4ea71ac642dbc2b63bae9636d98d3333b553f803929076d2375`. The static browser fallback is `public/images/optimus-guide-fallback.png` (479,735 bytes; SHA-256 `e971f66f31fb80a9fe0e6a9d0d83de42d52349adcc4dc54a453459a487c9266c`).
- Raw and resized GLBs both contain 67 nodes, one mesh with 40,462 triangles, one 65-joint skin, one exported material, three textures and the same two named Actions. Source images are 8K BaseColor and 4K Normal/metallic/roughness; all three deployable textures are 2048×2048. The model has two `game_id` extras: `guide.optimus` and `guide.optimus.body`. No mesh decimation or hierarchy rewrite was applied.
- `gltf-transform validate` found zero errors and one `NODE_SKINNED_MESH_NON_ROOT` warning on the mesh beneath its rig. The browser renders and animates that hierarchy. This warning and continuous deformation/foot-contact checks remain production gates.

## Browser evidence

The actual app was opened at `http://127.0.0.1:5361/` in a foreground Chromium window seeded at Airbus completion. Heart playback was started there and Replay greeting remains available. A desktop capture confirmed the browser window, robot, caption and reward button were visible together. Browser screenshots were inspected at:

- `preview-renders/optimus-gen3-animation-intake/browser/optimus-guide-review-1440.png`
- `preview-renders/optimus-gen3-animation-intake/browser/optimus-guide-review-768.png`
- `preview-renders/optimus-gen3-animation-intake/browser/optimus-guide-review-375.png`
- `preview-renders/optimus-gen3-animation-intake/browser/tesla-film-fullscreen-1440.png`
- `preview-renders/optimus-gen3-animation-intake/browser/tesla-film-fullscreen-375.png`

The robot is visible at all three widths and the native action and sound controls remain reachable with no horizontal overflow. At 375 px, shortening the figure area brought both audio controls into view. The film video element fills the viewport, uses `object-fit: contain` to preserve the full frame, and is letterboxed on a portrait phone. In Chromium, the reward click yielded a fullscreen `game-shell reward-shell` and the film clock advanced automatically without a Play click. A browser may deny fullscreen or autoplay; the viewport layout survives fullscreen denial and a Play button handles autoplay refusal.

The focused Chromium test for the animated guide and autoplaying fullscreen film passed. The full reward spec first passed 10/11; its failed-film test found that the reduced-motion note covered Retry. After moving the note, that failed test passed on its own. Full reward-suite rerun and project checks should be recorded separately when complete.

## Remaining delta

This candidate uses the supplied `greet_01` and in-place `walk` clips with a short crossfade, not a final authored escort. The image shows no mouth animation; the Heart voice reads as robot narration. Full-cycle shoulder/hand/foot deformation, foot-slide, and transition quality need owner review and repair. Tripo distribution rights and a hosted preview remain open. The existing Tesla film itself was not edited.
