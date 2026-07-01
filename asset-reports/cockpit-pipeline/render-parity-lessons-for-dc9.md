# Render Parity Lessons for DC-9 Cockpit Work

## Purpose

This note preserves the reusable lessons from the Airbus A320 Sketchfab source pass so the DC-9-50 cockpit workflow starts with better evidence and fewer false assumptions. It is an asset-pipeline report, not a production approval.

## What We Learned

- A downloaded glTF or GLB is not necessarily the same visual result shown in a web viewer. The A320 source geometry imported cleanly, but the Sketchfab final render also used viewer-side lighting, matcap shading, ground shadows, ambient occlusion, reflections, anti-aliasing, sharpening, vignette, and grain.
- The first Blender import should be treated as source inspection, not final look development. For A320, the raw import proved the cockpit geometry was useful, while the viewer settings explained why the plain Blender preview looked weaker.
- Browser inspector captures are valuable when they are paired with structured settings. The A320 pass captured Final Render, Base Color, Metalness, Roughness, Matcap, Wireframe, UV Checker, and No Post Processing views, then extracted camera, lighting, environment, post-process, texture, and material-channel JSON.
- Preserve the original download unchanged. Work from cache copies, extracted inspection files, and staged Blender files so there is always a known-good source artifact to recheck.
- Keep aircraft identity separate. A320 lighting/material lessons can improve process, but they must not become DC-9 geometry, panel layout, labels, or cockpit detail.

## DC-9 Workflow Changes To Carry Forward

1. Capture reference and source evidence before Blender cleanup.
   - Final render or beauty view.
   - No post-processing view when available.
   - Base color/albedo view.
   - Metalness and roughness views.
   - Matcap or studio-lighting view.
   - Wireframe and UV checker views.
   - Camera/viewpoint evidence from the intended captain-seat review angle.

2. Extract structured viewer settings when the source site exposes them.
   - Camera field of view, position, and target.
   - Environment or HDR/studio-light identifiers.
   - Light count, color, intensity, and transforms.
   - Background and ground-shadow settings.
   - Post-process stack.
   - Material channel settings and texture identifiers.

3. Separate three questions in the report.
   - Is the geometry model-correct enough for the target aircraft?
   - Is the source license and provenance acceptable for the intended use?
   - Is the render quality coming from portable asset data, viewer-only effects, or both?

4. Build two Blender lighting contexts.
   - Neutral approval lighting for checking silhouette, proportions, and material assignments.
   - Source-parity lighting for comparing against the web viewer or reference beauty render.

5. Do not hide geometry problems with dramatic lighting.
   - DC-9-50 approval still depends on captain-seat silhouette, main panel density, yoke/pedestal/overhead relationships, analog gauge depth, era-correct panel colors, and restrained wear.
   - Lighting parity is useful only after the model-correct reference checks remain visible.

6. Record material decisions before optimization.
   - Material count.
   - Texture count and maximum dimensions.
   - Which source textures are preserved.
   - Which viewer-only effects are approximated in Blender previews.
   - Which effects are intentionally not baked into runtime assets.

7. Treat optimization as a separate gated step.
   - Do not flatten, join, decimate, rename, or texture-atlas cockpit assets until stable node names, pivots, hierarchy, animations, and `game_id` metadata are documented and regression-checked.

## DC-9 Agent 0-3 Practical Checklist

- Agent 0 should require a DC-9-50-specific reference authority and identify which references are used for shape, material, camera, and lighting.
- Agent 1 should collect source candidates plus viewer/reference render evidence, not just downloads.
- Agent 2 should assemble using approved source inputs while preserving original artifacts and recording runtime-contract names, pivots, hierarchy, and metadata.
- Agent 3 should make the first material pass from recorded source textures and reference settings, then produce a neutral approval contact sheet and a source-parity contact sheet.
- Owner review should compare both: neutral shape truth and source-parity look.

## Files From The A320 Pass Worth Reusing As Examples

- `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-viewer-settings.json`
- `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-environment-assets.json`
- `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-material-parity-summary.json`
- `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-render-parity-notes.md`
- `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-source-parity-contact-sheet.png`

## Open DC-9 Question

The DC-9-50 source search should prefer model-correct cockpit geometry and reference reliability over a polished viewer render. If the best DC-9 candidate has weaker viewer materials than the A320 source, it can still be a better production base if its captain-seat geometry, panel layout, yoke, throttle quadrant, gauge density, and overhead/pedestal relationships match the DC-9-50 reference authority.
