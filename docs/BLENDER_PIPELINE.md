# Blender setup and web-asset pipeline

## 1. Install and pin Blender

Install one stable Blender version on the modeling machine. Record the exact major/minor version in a local `.blender-version` file and set:

```bash
export BLENDER_BIN="/absolute/path/to/blender"
export BLENDER_EXPECTED_VERSION="5.1"
"$BLENDER_BIN" --version
```

Use the actual installed version if it differs. Do not upgrade mid-milestone without exporting and comparing the same reference asset before and after.

Typical executable locations:

```text
macOS:   /Applications/Blender.app/Contents/MacOS/Blender
Windows: C:\Program Files\Blender Foundation\Blender 5.1\blender.exe
Linux:   blender
```

## 2. Project units and template

Create `art-source/blender/web_asset_template.blend` with:

- Metric units and unit scale 1.0.
- EEVEE for routine look development.
- Cycles available for baking.
- Viewport clip start around 0.01 m.
- A neutral approval-light collection.
- A separate in-game cockpit-light collection.
- Approval camera naming convention.

Do not replace Blender’s global startup file; keep the template versioned with the project.

## 3. First DC-9 source file

Save a copy as `dc9_master.blend`. Create `DC9_ROOT` and the hierarchy in `docs/ASSET_CONTRACT.md`. Add `CAM_DC9_CAPTAIN_APPROVAL` before modeling detail so proportions are always reviewed from the intended eye point.

## 4. Proof-of-pipeline asset

Model only:

- Cockpit shell and recognizable main-panel blockout.
- Three interactive switches.
- One animated gauge.
- One emissive annunciator.
- One Memphis route card.

Assign stable names, pivots, and custom properties. This asset exists to prove export and browser interaction, not to impress with surface detail.

## 5. Validate and export

```bash
npm run asset:dc9
```

The command:

1. Opens Blender in background mode.
2. Runs `tools/blender/validate_scene.py`.
3. Exports a raw GLB with custom properties.
4. Runs glTF validation and inspection.
5. Copies only a valid result into `public/models`.
6. Writes an asset report under `.cache/assets/dc9/`.

Use `tools/blender/render_preview.py` to create consistent approval renders. The future Blender add-on should call these same Python functions rather than duplicating logic.

## 6. Browser integration

Load the GLB in the actual React Three Fiber application. Verify:

- Scale and camera feel.
- Every expected node name.
- `userData.game_id` metadata.
- Switch pivot and travel.
- Gauge animation.
- Emissive material response.
- Pointer and HTML-equivalent controls.
- Mobile and desktop performance.

A Blender render alone is not acceptance evidence.

## 7. Texture and geometry strategy

Use geometry for major controls, bezels, yokes, throttles, handles, and silhouettes. Bake shallow labels, paint grain, fine scratches, small fasteners, grime, and ambient occlusion when practical. Reserve the highest texel density for the captain’s main view and puzzle close-ups.

## 8. Git LFS and deployment

Install Git LFS before the first `.blend` commit:

```bash
git lfs install
git lfs track "*.blend" "*.exr" "*.hdr" "*.tif" "*.psd"
git add .gitattributes
```

Vercel should deploy optimized GLBs, textures, audio, and application code. It should not receive master Blender files or source reference folders.

## 9. MCP later

After `validate_scene`, `render_preview`, and `export_glb` work reliably from the command line and Blender side panel, a narrow local MCP can wrap those functions. See `docs/MCP_AND_SKILLS.md`.
