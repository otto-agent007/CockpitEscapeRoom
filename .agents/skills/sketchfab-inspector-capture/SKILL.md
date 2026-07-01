---
name: sketchfab-inspector-capture
description: Capture, crop, and record Sketchfab Model Inspector screenshots for CockpitEscapeRoom asset review. Use when Codex needs browser evidence from an open Sketchfab model tab, including Final Render, No Post-Processing, Base Color, Matcap, Wireframe, UV Checker, or other inspector modes for Blender material, geometry, UV, or optimization planning.
---

# Sketchfab Inspector Capture

Use this for owner-approved Sketchfab source candidates when visual evidence from the web viewer should guide Blender source inspection, Agent 2 assembly review, or Agent 3 materials/optimization.

## Guardrails

- Treat Sketchfab captures as visual/reference evidence, not new geometry or license approval.
- Keep raw desktop screenshots in `.cache/screenshots/`.
- Track only cropped, useful evidence under `preview-renders/cockpit-pipeline/<job-or-stage>/sketchfab-inspector/`.
- Do not edit `docs/**`, `src/**`, `tests/**`, `package.json`, or `TEST_REPORT.md` from the Ubuntu asset branch.
- Do not run Agent 3 optimization from inspector evidence unless assembly approval exists.

## Desktop Tool Setup

Prefer installed tools:

```bash
command -v xdotool import convert identify
```

If `xdotool` is missing and sudo is unavailable, extract it locally without changing system packages:

```bash
mkdir -p .cache/tools/xdotool-debs .cache/tools/xdotool-root
cd .cache/tools/xdotool-debs
apt-get download xdotool libxdo3
for deb in *.deb; do dpkg-deb -x "$deb" ../xdotool-root; done
```

Use it with:

```bash
export LD_LIBRARY_PATH="$PWD/.cache/tools/xdotool-root/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
XDOTOOL="$PWD/.cache/tools/xdotool-root/usr/bin/xdotool"
```

## Capture Workflow

1. Ask the owner to open the relevant Sketchfab model tab and position the model view.
2. Activate the Sketchfab window:

```bash
win=$($XDOTOOL search --name 'A320 Cockpit 2' | head -1)
$XDOTOOL windowactivate --sync "$win"
```

3. Capture the active inspector mode:

```bash
mkdir -p .cache/screenshots
import -window "$win" .cache/screenshots/sketchfab-a320-inspector-final-render.png
```

4. Click inspector modes by window-relative coordinates when the left inspector panel is visible. For the A320 Cockpit 2 page at roughly `976x1058`, these worked:

```bash
$XDOTOOL mousemove --window "$win" 92 392 click 1  # No Post-Processing
$XDOTOOL mousemove --window "$win" 80 459 click 1  # Base Color
$XDOTOOL mousemove --window "$win" 80 670 click 1  # Matcap
$XDOTOOL mousemove --window "$win" 80 706 click 1  # Wireframe
$XDOTOOL mousemove --window "$win" 82 813 click 1  # UV Checker
```

Wait about one second after each click before calling `import`.

## Crop Workflow

Copy useful captures into a tracked evidence folder, then crop out browser chrome and lower page content:

```bash
mkdir -p preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector
cp .cache/screenshots/sketchfab-a320-inspector-final-render.png preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/final-render.png
cp .cache/screenshots/sketchfab-a320-inspector-no-post-processing.png preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/no-post-processing.png
cp .cache/screenshots/sketchfab-a320-inspector-base-color.png preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/base-color.png
cp .cache/screenshots/sketchfab-a320-inspector-matcap.png preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/matcap.png
cp .cache/screenshots/sketchfab-a320-inspector-wireframe.png preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/wireframe.png
cp .cache/screenshots/sketchfab-a320-inspector-uv-checker.png preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/uv-checker.png

for f in preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/*.png; do
  convert "$f" -crop 946x675+16+152 +repage "$f"
done
```

Adjust crop geometry for different browser sizes. Verify with:

```bash
identify preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-inspector/*.png
```

Open at least one final-render crop and one geometry crop with `view_image` before committing.

## Report What Matters

Record in the asset report or ExecPlan:

- Screenshot mode and path.
- Whether the capture is final render, material-channel evidence, or geometry/UV evidence.
- Optimization implications: preserve UVs, avoid aggressive merge/flatten, note mesh density from wireframe, use no-post-processing as Blender preview parity target.
- Any limitations, such as roughness view landing on a flat/occluded surface.

Useful mode meanings:

- `Final Render`: target Sketchfab look including post effects.
- `No Post-Processing`: best parity target for Blender material/lighting before game mood.
- `Base Color`: texture and color balance without lighting.
- `Matcap`: shape, bevel, relief, and silhouette.
- `Wireframe`: mesh density and geometry distribution.
- `UV Checker`: UV layout quality and areas where texture mapping should be preserved.
