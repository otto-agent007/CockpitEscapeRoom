# Roboptimus loading and naming repair

## Owner feedback and root cause

The retired waving guide flashed after Engine-Out before the current dancing guide loaded. Both `QualificationCelebration.tsx`'s lazy-module placeholder and `OptimusGuideScene.tsx`'s GLB loading branch rendered the old `optimus-guide-fallback.png`. That same image also served accessible and unavailable-WebGL paths.

The new player-facing name is **Roboptimus**, shown in the completion eyebrow and the accessible audio label. Technical model/audio paths and `game_id` metadata retain their existing identities.

## Current-model still and authority

`public/images/roboptimus-guide-fallback.png` is a direct transparent export of the current browser renderer during `dance_02`, with the production camera, lights and materials. It is 662×576 RGBA, 95,634 bytes, SHA-256 `6486af9746878e61abc04686534deefde44915c9a17ac3f6c6fc74d1c218dd33`. It is shared by all loading/accessibility/error branches through `ROBOPTIMUS_FALLBACK_FILE`; the new URL cannot reuse the retired still's browser cache entry. No AI image generation or image repaint was used.

The unchanged source GLB is 4,991,096 bytes, SHA-256 `285f8a53e53a3594c11cc5eb2ebdb42d0d221bc2d9df08cdfba930c8b4e49b11`. A fresh no-cache browser fetch matched both disk length and SHA-256. Parsed runtime metadata retains 67 nodes, one skin, one material, three textures (existing 2K maps), and `guide.optimus` / `guide.optimus.body`. No geometry, hierarchy, texture, animation, camera or lighting contract was edited, and no Blender/GLB rebuild was necessary.

The retired PNG remains preserved at its historical path, 479,735 bytes, SHA-256 `e971f66f31fb80a9fe0e6a9d0d83de42d52349adcc4dc54a453459a487c9266c`. Runtime source no longer references it. Source and distribution status follow the existing dance-model report and asset manifest.

## Repair evidence

- The cold-load regression first failed with the retired image URL while the scene module was held. The test separately holds the lazy module and GLB and forbids any request for the retired still/model or premature film.
- The first post-fix assertion incorrectly counted the Canvas element's non-rendered HTML fallback as a visible placeholder. Inspecting React Three Fiber's Canvas implementation confirmed it remains inside the canvas; the corrected assertion checks the direct displayed placeholder and retains the retired-resource checks.
- Element screenshot capture could not reliably settle, and a page crop revealed underlying interface pixels through transparent ancestors. Those captures were rejected. Exporting the current renderer directly produced the inspected RGBA source with only the current model.
- Final browser proof and command results are recorded in plan 0074 and `TEST_REPORT.md` after verification.
- Final production browser run passes **20/20**, including all three new loading/accessibility cases and actual Engine-Out/reward behavior. Module-loading, model-loading and actual-model screenshots at 375/768/1440 are under `preview-renders/roboptimus-handoff-2026-11-03/` and were inspected. An earlier screenshot-heavy run exceeded its 60-second budget after writing artifacts; the final artifact-only 180-second budget passed, while ordinary CI retains 60 seconds and skips optional capture work.
- Full lint/type/unit/build check passes 1,048 tests in 95 files. Asset validation, spoiler/privacy guards and unchanged budget limits pass; total output is 185.4 MB and initial download 567 KB. Independent read-only review returned no findings. Historical handoff captures were restored, and the original PNG and GLB remain unchanged.
