# Optimus Gen 3 Tripo animation intake — 2026-10-29

## Status

Owner-supplied **animation candidates** for the post-Airbus congratulations and Tesla reward handoff. The 31 actions are preserved and available in Blender. No action has been promoted to a game asset, and no game code or protected Tesla film was changed.

## Source and preservation

`/mnt/2TBHDD/Downloads/Optimus3_animations.zip` is 16,664,142 bytes, SHA-256 `a782a11e1b570179f4bac258b7fc8e4c3b4f132453006e737ca0436aab6b2052`. The ZIP integrity check passed. A byte-identical copy is at `.cache/cockpit-pipeline/sources/model-y-reward/optimus-gen3/original/Optimus3_animations.zip`; its five members were safely extracted under sibling `extracted/animations-2026-10-29/`:

- `tripo_convert_56ab879e-f961-4ef1-94eb-0447a3f34c16.fbx` — 16,411,420 bytes
- one 8192×8192 BaseColor JPEG
- 4096×4096 Normal, Roughness and Metallic JPEGs

The source/license basis remains owner-supplied Tripo output; account terms and any external likeness permission have not been recorded. The original ZIP is untouched.

## Blender inspection

Blender 5.1.2 imported the FBX in an isolated background process. It contains **31 named Actions**, one 65-bone armature, one 40,462-triangle body (23,479 polygons, 20,663 imported vertices), and 52 nonempty vertex groups. Every FBX bone name matches the 65-joint original `Optimus3_8krigged.glb` skin, including finger joints. Its material has actual image links to Base Color, Normal, Roughness and Metallic, at the source sizes above. The Blender import scene uses 24 fps. Detailed evidence is in `optimus-gen3-animation-inspection-2026-10-29.json`.

The FBX rest-bone endpoints differ from the prior rigged GLB by up to approximately 0.029 import units. Keep its actions with this FBX rig through intake; do not copy Actions onto the earlier GLB merely because bone names match. Seventeen sampled frames per action showed zero horizontal hip travel, consistent with the owner's in-place export setting. This sampling does not establish loop continuity, planted feet or clean transitions. The per-action joint samples are in `optimus-gen3-motion-samples-2026-10-29.json`.

A separate packed-texture review scene is saved at `.cache/cockpit-pipeline/sources/model-y-reward/optimus-gen3/extracted/optimus3-31-animation-review.blend` (37,068,941 bytes). A background reopen found all 31 Actions, one armature, four packed source images, and `greet_01` active at frame 43. The prior static bridge-intake `.blend` remains separate. The animation review scene was then opened in desktop Blender; this did not change the preserved original ZIP.

## Visual triage

Neutral-lit stills were rendered under `preview-renders/optimus-gen3-animation-intake/`. The first preview script accidentally retained Blender's startup cube, which obscured the initial idle/greeting renders. The cause was confirmed against the earlier working intake script, the preview process was stopped, and a cleared-scene rerender of `greet_01` produced a visible robot. The obscured idle frame is retained under `rejected/idle-f185-startup-cube.png` and is not visual evidence.

- `greet_01-f043.png`: raised open hand, intact chest/shoulder in this frame; a lifted foot gives it a lively entrance.
- `wave_goodbye_02-f107.png`: readable open-palm wave, intact body in this frame. A material-lit 16-frame loop shows a lifted-foot step during the wave; a planted congratulation would need upper-body-only use or a cleaned action.
- `cheer-f037.png`: both arms raised; candidate for the congratulations beat.
- `walk-f015.png`: forward stride; candidate for the escort beat, with scene translation to be authored separately.
- `greet_04-f047.png`: raised two-finger greeting; playful alternative.
- `greet_03-f096.png`: points toward the viewer; possible cue, but not an open-hand reward presentation.
- `turn-f047.png`: exaggerated backward lean; set aside for this transition.

The owned tmux sidepane displayed the candidate greeting, cheer, walk and wave stills in sequence. It then displayed `wave-goodbye-motion-diagnostic.gif`, a dark 16-frame Workbench sample, followed by `wave-goodbye-motion-pbr.gif`, a material-lit 16-frame sample of the same 142-frame action. `chafa` was confirmed as the running process in the owned pane. The sparse samples show the head/torso facing the viewer and one foot lifting near the wave; they do not establish every-frame deformation, planted foot contact, loop quality or owner approval. The PBR loop is the current sidepane preview.

A background reopen of the packed `.blend` briefly attempted to start a second Tripo listener on port 60600 and logged a bind error. That background process exited after verification; the original desktop Blender instance remained listening on both 60600 and 9876. The review `.blend` was opened in that live instance and remained saved and clean.

## Remaining delta

Owner visual choice for the robot's look and congratulations beat; full-cycle animation review and foot-slide/transition repair; an authored open-hand presentation gesture if needed; stable object/action naming and source production `.blend`; optimized runtime GLB with validated hierarchy, pivots, maps and animation contracts; actual browser handoff, accessibility, spoiler guard, reduced motion, reload and 375/768/1440 layout checks; hosted preview and final owner review. No npm, game browser or hosted checks were run for this source-only intake.
