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
