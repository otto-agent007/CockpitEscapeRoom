# DC-9 X-Plane Source Intake Report

## Purpose

Inspect the cached X-Plane DC-9-32 package as a possible prebuilt cockpit compatibility source for the DC-9 Pop T Captain cockpit.

## Source package

- Archive: `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/DC9-32.zip`
- Archive SHA-256: `8ddb5856b0d4c7f5a63e56b0898cadbe21e26728c7ee4a636bd05259a3bc5c83`
- Archive size: `137195620` bytes
- Extracted path: `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/extracted/DC9-32`
- Source type: X-Plane aircraft package
- Scene group intent: DC-9 Pop T Captain cockpit
- Variant: DC-9-32 compatibility source, not DC-9-50 authority

## Deterministic inspection

Machine-readable inspection:

- `asset-reports/cockpit-pipeline/dc9-xplane-source-intake/inspection-report.json`

The `DC9-32.acf` file attaches these cockpit-relevant objects:

- `DC9vc1.obj`
- `DC9vc2.obj`
- `DC9panel.obj`
- `CB's.obj`
- `Glass.obj`
- `interior.obj`

The package also includes a monolithic `DC9-32_cockpit.obj`, but the aircraft attachment graph points at the split `objects/*.obj` stack instead of the monolith.

## Key object findings

Primary cockpit candidates:

- `objects/DC9vc2.obj`
  - `104846` parsed vertices
  - `371382` parsed indices
  - bounds: `2.852 x 1.712 x 1.793`
  - textures: `DC9vc2.png`, `DC9vc2_LIT.png` (`2048x2048`)
- `objects/DC9panel.obj`
  - `26624` parsed vertices
  - `80466` parsed indices
  - bounds: `3.140 x 1.939 x 1.872`
  - textures: `DC9panel.png` (`2048x2048`), `DC9panel_LIT.png`
- `objects/DC9vc1.obj`
  - `13134` parsed vertices
  - `36792` parsed indices
  - bounds: `0.699 x 0.605 x 1.124`
  - textures: `DC9vc1.png`, `DC9vc1_LIT.png` (`2048x2048`)

Supporting context:

- `objects/interior.obj`
  - bounds: `3.309 x 2.268 x 25.092`
  - broad cabin/interior context, not cockpit-first extraction
- `objects/Glass.obj`
  - bounds: `2.785 x 0.850 x 1.511`
  - likely windshield/glazing companion object

## Intake blocker

These files are X-Plane `OBJ8` text objects, not Wavefront OBJ.

Evidence:

- file header starts with:
  - `I`
  - `800`
  - `OBJ`
- headless Blender probe did not provide a usable import path for this source:
  - `AttributeError: Calling operator "bpy.ops.import_scene.obj" error, could not be found`

Even with a standard OBJ importer available in interactive Blender, these files would still require an OBJ8-aware conversion or import path rather than assuming Wavefront compatibility.

## Recommendation

Use this package as a serious compatibility-source candidate, with this priority order:

1. `objects/DC9vc2.obj`
2. `objects/DC9panel.obj`
3. `objects/DC9vc1.obj`
4. `objects/Glass.obj`
5. `objects/interior.obj` only if cockpit-shell context is still missing

Do not start from `DC9-32_cockpit.obj` unless a later converter proves it preserves more structure than the attached `objects/*.obj` stack.

## Next step

Build or adopt an OBJ8-to-interchange conversion path, then run the converted result through the usual Blender source intake and source-discovery flow before any assembly or runtime use.
