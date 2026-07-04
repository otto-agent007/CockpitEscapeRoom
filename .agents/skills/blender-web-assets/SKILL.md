---
name: blender-web-assets
description: Validate, export, inspect, preview, and integrate Blender cockpit or reward assets for CockpitEscapeRoom. Use whenever a .blend file, material, texture, camera, interactive node, GLB, or asset report changes.
---

# Blender web asset workflow

## Inputs

- Asset identifier: `dc9`, `airbus`, or `tesla`.
- Approved reference set and exact aircraft model/variant where required.
- Master `.blend` path.
- Active visual or pipeline ExecPlan.

## Workflow

1. Read the root `AGENTS.md`, `docs/VISUAL_REALISM.md`, `docs/ASSET_CONTRACT.md`, `docs/BLENDER_PIPELINE.md`, `docs/ASSET_PIPELINE.md`, and active ExecPlan.
2. Confirm `BLENDER_BIN` exists and record the exact Blender version.
3. Never overwrite a reference image or edit a generated GLB manually.
4. Inspect scene roots, approval cameras, names, pivots, local axes, custom properties, materials, texture paths, and unapplied transforms.
5. Run the relevant asset command. Raw exports must go to `.cache` first.
6. Run GLB validation and inspection. Do not apply destructive optimization by default.
7. Load the asset in the actual React Three Fiber app.
8. Verify node names and `userData` metadata, scale, camera, interactions, animation, lighting, keyboard equivalents, and error handling.
9. Render or capture fixed approval views and browser screenshots.
10. Compare against the approved model-correct references. Record known deviations rather than hiding them with lighting.
11. Review asset size, material count, texture dimensions, and runtime behavior.
12. Repair root causes and rerun the failing plus adjacent checks.
13. Update the asset report, active ExecPlan, and `TEST_REPORT.md`.

## Guardrails

- Do not begin the production Airbus cockpit until the exact model is confirmed.
- Preserve stable names, hierarchy, pivots, animation tracks, and extras.
- Use invisible colliders instead of distorting visible controls.
- Visual realism does not authorize real operational puzzle procedures.
- Tripo AI outputs are candidate/proxy assets until imported into Blender, inspected, cleaned, optimized, assigned stable names, checked for pivots, and documented in `asset-reports/`.
- The official Blender MCP may be used for scene inspection and controlled edits, but not for uncontrolled broad rewrites of approved scenes.

## Output

Report Blender version, source file, deployable GLB, file size, object/material counts when available, validation warnings, interactive nodes found, browser checks, screenshots, deviations, and the next approval gate.
