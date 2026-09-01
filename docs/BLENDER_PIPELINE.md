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

## 3. Production source files

The current production sources are:

```text
art-source/blender/dc9_master.blend
art-source/blender/dc9-memphis-legacy-departure.blend
art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend
art-source/blender/locker_room_master.blend
art-source/blender/tesla_reward.blend
```

The DC-9 keeps `DC9_ROOT` and its first-officer camera family. The Memphis source keeps `KMEM_LEGACY_ROOT` and moves as a separate environment around the fixed cockpit. The Airbus shaded pipeline master is authoritative; do not introduce an `airbus_master.blend` duplicate.

## 4. DC-9 and Memphis contract

The original proof-of-pipeline milestone is historical. Current DC-9 work must preserve:

- production cockpit geometry, donor pivots, instrument needles, route strip, shutdown controls, and first-officer cameras in `dc9_master.blend`;
- the separate Memphis Concourse B source selection, project-authored ground/path context, five checkpoint anchors, and `1995 MEMORY` provenance in `dc9-memphis-legacy-departure.blend`; and
- the runtime rule that a Memphis load failure removes only the outside view, never the playable native guidance.

Do not merge the Memphis environment into the cockpit GLB or add an exterior gameplay camera.

## 5. Validate and export

```bash
npm run asset:dc9
npm run asset:dc9-memphis
npm run asset:airbus
npm run asset:tesla
npm run asset:locker
```

The command:

1. Opens Blender in background mode.
2. Runs `tools/blender/validate_scene.py`.
3. Exports a raw GLB with custom properties.
4. Runs glTF validation and inspection.
5. Copies only a valid result into `public/models`.
6. Writes an export-contract report under the asset-specific `.cache/assets/<asset>/` directory.

Use `tools/blender/render_preview.py` to create consistent approval renders. The future Blender add-on should call these same Python functions rather than duplicating logic.

## 6. Browser integration

Load the GLB in the actual React Three Fiber application. Verify:

- Scale and camera feel.
- Every expected node name.
- `userData.game_id` metadata.
- Memphis anchor uniqueness and inverse-world motion outside the fixed right-seat camera.
- Switch pivot and travel.
- Gauge animation.
- Emissive material response.
- Pointer and HTML-equivalent controls.
- Desktop performance at the 1440×900 milestone viewport; retain existing narrow-width regressions.

A Blender render alone is not acceptance evidence.

## 7. Texture and geometry strategy

Use geometry for major controls, bezels, yokes, throttles, handles, and silhouettes. Bake shallow labels, paint grain, fine scratches, small fasteners, grime, and ambient occlusion when practical. Reserve the highest texel density for the active seat view and puzzle close-ups.

## 8. Git LFS and deployment

Install Git LFS before the first `.blend` commit:

```bash
git lfs install
git lfs track "*.blend" "*.exr" "*.hdr" "*.tif" "*.psd"
git add .gitattributes
```

Vercel should deploy optimized GLBs, textures, audio, and application code. It should not receive master Blender files or source reference folders.

## 9. Tripo AI and Blender MCP support

Tripo AI may generate rapid candidate or proxy meshes, but every output must be imported into Blender before runtime use. Assign stable names, check pivots and local axes, record material counts and texture sizes, optimize before GLB export, and document the result in `asset-reports/`.

The current locker watch/baseball/Wings/Charging Bull/hat intake is reproducible after the preserved cache sources are present:

```bash
npm run asset:locker
```

`npm run asset:locker` invokes `import_locker_room_props.py` before validation and export. The importer extends the owner-adjusted master, verifies each preserved source hash and material-wired 4K PBR set, and does not rerun the older environment proxy builder. See `TripoAssetLessons.md` for the source/runtime-resolution distinction.

The official Blender MCP may support scene inspection, controlled cleanup, validation, naming, pivot checks, metadata review, preview renders, and export support. Do not use it for uncontrolled broad rewrites of approved scenes or to bypass `validate_scene`, `render_preview`, `export_glb`, asset reports, or owner approval gates.

See `docs/ASSET_PIPELINE.md` for the full Tripo AI -> Blender MCP -> GLB -> React integration workflow.
