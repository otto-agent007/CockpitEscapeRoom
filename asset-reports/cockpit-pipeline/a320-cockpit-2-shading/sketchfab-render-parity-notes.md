# Sketchfab Render Parity Notes: A320 Cockpit 2

## Source

- Model: https://sketchfab.com/3d-models/a320-cockpit-2-5fb0c671a91042c1a9d8f2cf3e2df021
- Cached viewer settings: `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-viewer-settings.json`
- Cached embed payload: `.cache/cockpit-pipeline/sketchfab-a320-embed.html`
- Environment asset report: `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-environment-assets.json`
- Material channel report: `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-material-parity-summary.json`

## What Sketchfab Is Doing

The final Sketchfab render is not only the downloaded glTF package. The viewer applies a Studio environment, three directional lights, matcap channels on every material, ground shadow catching, and post-processing.

Key settings to match before judging Blender material quality:

- Camera FOV: `45`
- Environment: `df380da788ee444885722735039b0c09` / Studio, exposure `0.8`, light intensity `3`, rotation `0.28531964269438514`
- Background color: `[0.86667, 0.86667, 0.86667]` with mode `ambient`
- Ground shadow: `ShadowCatcher`, opacity `1`, scale `9.689606057015563`
- Matcaps referenced by the viewer: metal.png (43a40dd3e9c34fc0b7da9cbf07b82ac8), skin_soft.png (35c4d334eded44d8a657f390954a32dd)
- Post stack: SSAO on, SSR on, TAA on, sharpen `0.2`, vignette amount `0.475`, grain factor `0.15`, bloom off, depth of field off.

## Material Implications

Every material has an enabled `Matcap` channel in the Sketchfab settings. Most also use base-color texture channels with roughness around `0.5`, metalness `0`, specular F0 `0.5`, and disabled normal/AO/cavity channels. Blender's plain glTF import will therefore look flatter or less polished unless we approximate the same Studio environment, matcap/reflection contribution, ambient occlusion, SSR-like reflections, vignette/grain/sharpening, and neutral gray background.

The downloaded package still matters: it provides the geometry, UVs, 13 materials, and 11 base-color textures. The viewer polish comes from settings layered on top of that source.

## Next Agent 3 Pass

1. Build a Blender review lighting rig from the extracted three directional light matrices plus Studio-like world lighting.
2. Preserve source texture links and material names, then tune Principled BSDF values using `sketchfab-material-parity-summary.json` as the target.
3. Add non-destructive compositor/look settings only for preview parity; do not bake them into runtime material contracts until approved.
4. Render the same captain-seat camera against the existing Sketchfab contact sheet and record remaining deviations.
