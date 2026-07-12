---
name: blender-source-intake
description: Import, normalize, inspect, and stage downloaded Blender, glTF, DAE, FBX, OBJ, Sketchfab, Tripo, or other third-party 3D source assets for CockpitEscapeRoom before runtime use. Use when unzipping source packages, choosing asset formats, adding assets to art-source/blender or .cache/cockpit-pipeline/sources, checking orientation/scale/materials/textures, replacing proxy geometry, or preparing a source asset for `npm run asset:*`.
---

# Blender Source Intake

Use this before a downloaded or generated 3D source asset reaches `public/models`.

For CockpitEscapeRoom Tripo props, read `TripoAssetLessons.md` before intake. Enforce its complete, material-wired 4K source-map requirement while treating runtime texture resolution as a separate browser-tested decision.

## Non-negotiable order

1. Preserve the original archive untouched under `.cache/cockpit-pipeline/sources/<scene>/<asset>/`.
2. Extract to a sibling `extracted/` folder and stage any edited import copy under `extracted/optimized/`.
3. Record source path, original archive SHA-256, extracted scene path, texture sizes, author/source if known, and intended scene group.
4. Import into Blender only through a deterministic script or a controlled MCP/code operation.
5. Before export, inspect recursive world bounds, orientation, material names, texture paths, root hierarchy, pivots, and custom properties.
6. Do not treat "it imported" as success. It must survive screenshot review in Blender or browser.

## Required source inspection

Run or write a small Blender inspection that reports, recursively:

- container root name
- child object names
- mesh count
- world-space min/max bounds
- location, rotation, and scale of the container
- material names and texture dimensions
- whether any mesh has zero-size bounds

If a root is an Empty, direct `bound_box` is useless. Always compute recursive child bounds.

## Orientation protocol

Never guess orientation from memory.

For each imported asset:

1. Capture or render a quick view before changing transforms.
2. Try one transform variable at a time: rotation, then scale, then location.
3. Re-render or browser-capture after each transform change.
4. If a bench, chair, locker, cabinet, or vehicle looks upside down or sideways, stop and fix orientation before doing material polish.

Record the final transform in the asset report.

## Source-present replacement rule

When a real source asset is intended to replace proxy art:

- Remove or hide old visible proxy geometry from the source-present path.
- Keep stable `game_id` contract parents.
- Use invisible hitboxes for interactions until final prop meshes exist.
- Do not leave placeholder primitives visible unless the owner explicitly asks for blockout/proxy visuals.

## Material triage

After import, inspect the source in three contexts:

- raw imported material in Blender
- Blender preview render
- actual browser render

If a material is too dark, muddy, or unprofessional in browser:

- first fix lighting and color management;
- then consider a runtime or Blender material override;
- document any texture override as an art-direction decision, not as source fidelity.

## Done when

- Original source is preserved.
- Import copy is deterministic.
- Recursive bounds and transforms are recorded.
- Texture staging decisions are recorded.
- Visible proxy replacement state is explicit.
- A Blender preview or browser screenshot proves the asset is visible, oriented correctly, and not obviously broken.
