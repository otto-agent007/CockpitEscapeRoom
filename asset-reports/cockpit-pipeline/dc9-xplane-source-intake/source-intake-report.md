# DC-9 X-Plane Source Intake Report

> **Seat-role supersession notice (2026-07-15):** This historical record preserves the then-current DC-9 captain / A320 first-officer assignment. The active production contract now uses DC-9 first-officer/right-seat and Airbus A320 Pop T captain/left-seat roles. Historical evidence below is unchanged.


## Purpose

Inspect the cached X-Plane DC-9-32 package as a possible prebuilt cockpit compatibility source for the DC-9 Pop T Captain cockpit.

## Source package

- Archive: `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/DC9-32.zip`
- Archive SHA-256: `8ddb5856b0d4c7f5a63e56b0898cadbe21e26728c7ee4a636bd05259a3bc5c83`
- Archive size: `137195620` bytes
- Extracted path: `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/extracted/DC9-32`
- Source type: X-Plane aircraft package
- Scene group intent: DC-9 Pop T Captain cockpit
- Variant: exact production target, McDonnell Douglas DC-9-32

## Source authority gate

- Source page: [Douglas DC-9-30 (unfinished) v0.19 on X-Plane.org](https://forums.x-plane.org/files/file/21649-douglas-dc-9-30-unfinished/)
- Primary creator: `roger2009`; the source page separately credits Vanni/John Bull, Rolf/MIA, Ramzzess, and Wilfredo/WillSans for included contributions.
- Published: September 5, 2015.
- Archive identity matches the source listing: version 0.19, 132.2 MB listing, DC-9-32 package structure, and September 5, 2015 archive timestamps.
- Production-use decision: **owner-cleared source candidate**.

Direct creator permission for CockpitEscapeRoom use and derivative production was owner-confirmed on 2026-07-12. Owner direction on 2026-07-13 made the archive and converted derivatives exact DC-9-32 production geometry and cleared-texture authority. The normal Blender source, asset validation, browser proof, and owner visual-approval gates still apply. Earlier DC-9-50-specific authority language in this intake is superseded.

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

The package also includes `DC9-32_cockpit.obj`. Later repair work proved that this is not a redundant monolithic shell: it contains the native animated instrument/control geometry and atlas mapping that the split `objects/*.obj` shell stack does not provide. Production assembly therefore requires both the split shell objects and this cockpit object.

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

## Technical intake findings

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

Use this package as an owner-cleared compatibility and production donor, with this priority order:

1. `objects/DC9vc2.obj`
2. `objects/DC9panel.obj`
3. `objects/DC9vc1.obj`
4. `objects/Glass.obj`
5. `objects/interior.obj` only if cockpit-shell context is still missing

Import `DC9-32_cockpit.obj` alongside the attached `objects/*.obj` stack. The split objects supply the shell, yokes, overhead, and pedestal; the cockpit object supplies the native instrument/control layer. Use the deterministic neutral pose so yoke datarefs are not evaluated at their first/full-left animation key.

## Deterministic conversion evaluation

The deterministic converter now supports the OBJ8 geometry used by the selected package: vertex and index tables, ordered `TRIS` ranges, cull/shiny/light state capture, nested translations/rotations, keyed transforms, explicit pose values, first-key defaults, and X-Plane Y-up to Blender Z-up conversion.

Evaluation results:

- `DC9vc2.obj`: 123,794 source triangles; 157 degenerate; 123,637 renderable; 129 draw ranges; 43 defaulted datarefs.
- `DC9panel.obj`: 26,822 source triangles; 88 degenerate; 26,734 renderable; one draw range.
- `DC9vc1.obj`: 12,264 source triangles; 8 degenerate; 12,256 renderable; ten draw ranges.
- `Glass.obj`: 110 renderable triangles; two draw ranges; one defaulted dataref.
- Unsupported OBJ8 directives across the four selected files: zero.
- Blender evaluation scene: 142 mesh objects, 162,981 source triangles before degenerate omission, four materials, and four packed source textures.
- Intake GLB: 20,564,560 bytes; SHA-256 `00eed7115fa045eb391cae7976d31ecf25b15d6e74ea50ad60b094c2bbbef114`.
- glTF validation: zero errors; four warnings for legacy PNG color-space/features.
- Captain-eye evaluation render: `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/extracted/optimized/previews/captain-eye.png`; SHA-256 `787c6c4f3b224a9ed7bbc637432905eeef6ce9cba509b6e5132cade3037d6cd2`.
- Locked captain-seat three-quarter render: `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/extracted/optimized/previews/three-quarter.png`; current inspected output is 1,313,183 bytes. The fixed camera parameters are reproducible; EEVEE preview PNG hashes are not used as stable asset evidence.

Visual inspection confirms a useful shell, windshield, overhead, panel hardware, wear, and period material base. The initial split-object conversion left the main panel incomplete, but subsequent research against the linked Roger2009 review located the missing native instrument layer in `DC9-32_cockpit.obj`. The production candidate now imports that layer directly. DC-9-51 references may guide compatible Northwest-era color, wear, and atmosphere only; they do not override the donor geometry or instrument layout.

Owner feedback found that the original `three-quarter.png` used the generic exterior source-inspection orbit and therefore did not prove captain-seat framing. The regenerated image uses the dedicated `dc9-captain` profile: a fixed left-seat eye point, restrained 46 mm lens, and sightline angled across the captain panel toward the center stack. Exterior front, side, and top renders remain source-geometry inspection only.

## Next step

Advance the complete five-object donor stack through deterministic Blender assembly as the exact DC-9-32 target, apply the parked APU-powered pose, and validate the native instrument layout against the Roger2009 package and presentation captures before owner review.
