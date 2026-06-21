# DC-9 pipeline proof prompt

## Goal

Create and integrate the smallest model-correct DC-9 cockpit asset that proves the Blender-to-Three.js pipeline and captain-seat visual direction.

## Context

Use the approved DC-9 references, `plans/0001-dc9-pipeline-proof.md`, `docs/VISUAL_REALISM.md`, `docs/ASSET_CONTRACT.md`, and `$blender-web-assets`. The current browser panel is a disposable greybox.

## Constraints

- Model only a shell, recognizable main-panel blockout, three switches, one gauge, one annunciator, and one Memphis route card.
- Use a fixed captain-eye approval camera.
- Keep procedures fictional.
- Preserve stable names, pivots, custom properties, hierarchy, and animation.
- Do not model the full DC-9, Airbus, Tesla, or Mars scene.
- Do not remove the greybox warning until owner approval.
- Do not implement MCP.

## Done when

- The `.blend` validates through `npm run asset:dc9`.
- The GLB loads in the real app and all named controls work through 3D and HTML paths.
- No console error occurs.
- Approval screenshots exist at desktop and phone widths plus fixed Blender cameras.
- The owner can judge whether the captain view reads unmistakably as a DC-9.
- The ExecPlan, asset report, source/license manifest, and `TEST_REPORT.md` are updated with evidence.
