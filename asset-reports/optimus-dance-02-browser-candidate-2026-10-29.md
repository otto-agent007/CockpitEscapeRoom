# Optimus `dance_02` browser review candidate — 2026-10-29

## Owner direction and status

The owner chose `dance_02` instead of the earlier greeting/walk sequence, then asked for it to loop. The Airbus completion scene now repeats that dance while the selected Heart voice delivers the captioned congratulations. **Reveal reward** still opens the protected, viewport-sized Tesla film. This is a local visual review candidate; the robot's appearance, full motion quality, Tripo distribution rights and hosted preview remain open.

## Source and runtime contract

- The packed 31-action source is `art-source/blender/optimus_guide_source_candidate.blend` (37,058,628 bytes, SHA-256 `a86f0c018ff95aae8f65b586067748fc1d82aae5d44403032bb18435926fbfe7`). The earlier greeting/walk GLB remains intact.
- `tools/blender/export_optimus_guide_candidate.py -- dance-02` exports only `Armature|dance_02.001` through Blender. Its 308-frame in-place motion spans about 12.8 seconds at 24 fps. The raw GLB in `.cache/assets/optimus-guide/` is 17,032,652 bytes, SHA-256 `56e15c3f3c959f8dec22844c06e19bd8846784fac772ace31793a7fbf6dfdca4`.
- Texture-only resizing to 2048×2048 produced `public/models/optimus-guide-dance-02-review.glb`, 4,991,096 bytes, SHA-256 `285f8a53e53a3594c11cc5eb2ebdb42d0d221bc2d9df08cdfba930c8b4e49b11`. No mesh decimation or hierarchy rewrite was applied.
- Raw and deployable GLBs retain 67 nodes, one 65-joint skin, 40,462 triangles, one material, three textures, and `game_id` extras `guide.optimus` and `guide.optimus.body`. `gltf-transform validate` found zero errors and one `NODE_SKINNED_MESH_NON_ROOT` warning on node 65, also present in the earlier review candidate.
- Five Blender Workbench inspection frames are under `preview-renders/optimus-gen3-animation-intake/dance_02-review/` at frames 1, 75, 135, 193 and 307. Frames 135 and 193 show distinct raised-arm dance poses; frame 307 returns near the opening stance. The browser animation loops until the reward action. Reduced-motion mode keeps the starting pose. Play/Replay greeting restarts the clip with the Heart audio.

## Browser and validation evidence

The local game was opened in Chromium at `http://127.0.0.1:5362/`, seeded at Airbus completion. Actual browser screenshots were inspected at 1440×900, 768×900 and 375×900: `preview-renders/optimus-gen3-animation-intake/browser/optimus-dance-02-review-{1440,768,375}.png`. The robot, caption, reward action and sound controls are visible together at all three widths with no horizontal overflow; the model is upright and the older proxy does not appear. The existing owned tmux image pane was refreshed with frame 193. An initial browser console 404 was not reproduced on a clean load with response logging; the GLB rendered and its no-cache byte length matched the 4,991,096-byte disk file.

The owner then requested a loop. Browser canvas crops at `preview-renders/optimus-gen3-animation-intake/browser/optimus-dance-02-loop-after-{14,18}s.png` show clearly different poses after the first 12.8-second cycle, confirming motion continues. The foreground browser showed the final tribute with the owner's new **The Future Tesla** name and a proposed **“One more flight, Captain.”** opening; the owner later rejected that opening, so it was removed while replacement options are under review. The film path was exercised by the reward browser test.

`npm run typecheck`, `npm run assets:check`, `VITE_CONFIG_NATIVE_IGNORE_WARNING=true npm run check` (lint, typecheck, 94 Vitest files / 1,032 tests, build), focused ESLint on the changed code/tests, and a final production build all exited 0. The first 12-test Chromium reward run passed 11 tests; the animated handoff test saw the **Preparing the final reward…** loading state beyond its five-second film assertion while the project check and live HMR were active. That test passed alone once those processes settled. The Chromium **complete reordered journey** test passed with the new tribute and reward text. No hosted review or final complete-game approval is claimed.

After the owner rejected the proposed tribute opener, it was removed. Focused ESLint, `git diff --check`, a production build and the Chromium **complete reordered journey** test passed again, with the tribute beginning at “From the baseball field…” and **The Future Tesla** retained. The owner then selected “Thank you for being someone we can always count on.” as the new opening. That exact line is in the data-backed tribute; focused ESLint, `git diff --check`, production build and **complete reordered journey** Chromium test passed again (1/1).

## Remaining review

Inspect full-cycle foot contact, hands and shoulder deformation in the actual game, especially on repeated loops. The model has no speaking mouth motion; the Heart track reads as narration over a dancing guide. Keep the prior candidate and its report as review history until the owner accepts this version.
