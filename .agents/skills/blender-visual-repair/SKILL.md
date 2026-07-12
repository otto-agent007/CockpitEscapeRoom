---
name: blender-visual-repair
description: Repair bad-looking CockpitEscapeRoom Blender or React Three Fiber visual output after owner feedback such as too dark, upside down, missing, raw import, unprofessional, wrong scale, wrong material, wrong camera, old proxy still visible, or hitboxes blocking interaction. Use for focused visual correction passes after source assets are already imported.
---

# Blender Visual Repair

Use this after visual feedback identifies a concrete mismatch. The goal is to shrink the visible defect, not to keep adding features.

## Stop and make a defect ledger

Write a short ledger before editing:

- screenshot path being judged
- exact visible defect
- likely owner-visible cause
- one variable to change first
- proof screenshot to capture after the change

Do not bundle orientation, lighting, material, camera, and UI changes into one blind patch unless the defect is trivial.

## Repair order

1. **Runtime asset boundary**: prove the app serves the GLB you think it serves.
2. **Visibility**: remove old visible proxy geometry if source art should replace it.
3. **Orientation**: fix upside-down/sideways assets before lighting.
4. **Scale/framing**: make the asset legible from the actual game camera.
5. **Lighting**: add key/fill/ambient intentionally; avoid blasting the whole scene.
6. **Materials**: if source textures are unusably dark or muddy, override them intentionally and document it.
7. **Interaction**: update hitboxes and tests to match the new visible composition.
8. **Evidence**: capture browser screenshot and run focused checks.

## Common fixes

- Imported Empty root has no useful bounds: compute recursive child bounds.
- Bench/chair appears upside down: flip the imported container, rebuild, screenshot; do not infer from direct root bounds.
- Locker/cabinet appears as a black slab: try source material override or emissive texture lift; if still muddy, replace with controlled PBR material.
- Old proxy still visible: split fallback and source-present code paths; source-present path should not draw old blocker geometry.
- Invisible hitboxes fail after visual layout changes: either enlarge hitboxes around visible source regions or update test clicks after proving a real click works.
- Screenshot looks raw: add a simple room stage, wall/floor, and balanced fill light; avoid big flat bright planes that overpower the asset.

## Scan-noise and retexture guardrails

- Classify visible grain before editing: base-color noise, normal/roughness noise, or scanned micro-geometry. Disable one layer at a time and capture the same browser view after each test.
- Preserve object identity. Do not replace a recognizable textured prop with a generic primitive or flat color unless the owner explicitly accepts a stylized replacement and its defining details are rebuilt.
- Treat AI-edited UV atlases as untrusted until mapped on the real mesh. Reject any variant that shifts UV islands, creates rectangular color blocks, or changes seam/detail placement.
- Prefer deterministic pixel-preserving cleanup when exact UV coordinates matter. Generated textures may guide palette and finish, but the browser-mapped result is authoritative.
- Do not use unlit materials blindly. They can expose pale atlas filler that standard lighting previously masked. Compare standard and unlit renders on the actual mesh.
- Apply emissive lift only when a valid color map exists. Emissive on an untextured material can wash bronze, leather, or painted surfaces toward white.
- If texture cleanup cannot remove grain, inspect geometry before increasing blur. Use controlled remesh/rebuild only for the affected prop, preserve the original source, and rebuild recognizable features such as baseball seams.
- A cleaner screenshot is not sufficient if the prop becomes less recognizable. Judge both surface quality and object identity at the owner-visible camera.
- Keep repair-specific optimization local to the affected prop. Never change a shared decimation ratio to solve one noisy scan without comparing triangle counts and browser appearance for every other asset that uses the helper.

## Validation floor

For a focused repair, run at minimum:

- relevant deterministic Blender builder or `npm run asset:<asset>`
- browser screenshot from the actual app
- focused Playwright covering the affected scene
- `npm run check` if React/TypeScript changed
- `git diff --check`

If time or scope prevents full validation, say exactly what did and did not run.

## Completion bar

Do not call the pass complete until:

- the screenshot visibly resolves the owner complaint;
- tests still pass or the remaining failure is specifically documented;
- reports/ExecPlan values match the current GLB, not a prior export;
- no stale screenshot path is being used as current evidence.
