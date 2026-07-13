# DC-9-50 Captain-View Production Proof

> Historical plan, superseded on 2026-07-13 by `plans/0012-dc9-pop-t-captain-level.md`. Its donor-intake and visual-repair evidence remains valid, but its DC-9-50 target decision is no longer active; the owner-cleared Roger2009 DC-9-32 is now the exact production target.

## Purpose

Replace the current procedural DC-9 greybox presentation with a source-backed, model-conscious DC-9-50-family cockpit interior that can be judged from Pop T's left-seat captain eye point. This milestone ends at the owner visual gate; it does not add the first polished Captain Mode puzzle.

## Current state

The app now loads the five-object Roger2009 cockpit stack, including the native `DC9-32_cockpit.obj` instrument geometry, from a saved left-seat camera while preserving the accessible Captain Mode checklist. The prior hand-authored instrument reconstruction was rejected and removed. The repaired local browser proof has upright yokes, native instrument grouping, the source pedestal/overhead, responsive seated framing, and stable OBJ8 depth behavior. The greybox badge and owner visual gate remain open.

Before-state evidence captured 2026-07-12:

- GLB: `public/models/dc9-cockpit.glb`, 6,474,468 bytes, SHA-256 `fd797913264e0479e9203ab83777f30423569543341f6a53d2bdabea5625ad61`.
- Browser response transferred the full 6,474,468-byte body.
- Screenshot: `/tmp/dc9-before-captain-1440.png`.
- Visual delta: centered eye point, flat procedural geometry, no source texture fidelity, and a large HUD competing with the captain view.

## Scope

Included: DC-9-50-family authority update, X-Plane source authority audit, OBJ8 inspection/conversion, raw source renders, deterministic Blender assembly/refit, production GLB validation, left-seat limited-look camera, loading/fallback handling, browser proof, and validation evidence.

Excluded: exact DC-9-51 claims, operational simulation, puzzle redesign, Model Y work, reward changes, and removal of the greybox label before owner approval.

## Context and constraints

- Production target: McDonnell Douglas DC-9-50 family in Northwest-era presentation.
- Donor source: DC-9-32 compatibility material only; it cannot override DC-9-50-family references.
- Direct creator permission for CockpitEscapeRoom use and derivative production was owner-confirmed on 2026-07-12.
- Keep game rules in `src/game`, presentation in `src/scenes`, and native HTML controls available.
- Preserve stable GLB names, pivots, hierarchy, extras, and current persisted-state schema.
- Preserve unrelated locker work currently present in the working tree.

## Progress

- [x] 2026-07-12 — Plan alignment: DC-9-50 family, provenance gate first, hybrid refit, captain-view proof only, limited seated look.
- [x] 2026-07-12 — Captured current runtime bytes/hash and 1440 px browser baseline.
- [x] 2026-07-12 — Audited source authority and recorded the initial conservative intake decision.
- [x] 2026-07-12 — Implemented and tested deterministic OBJ8 conversion with parked-pose reporting.
- [x] 2026-07-12 — Rendered and inspected converted cockpit objects through three bounded camera/light passes.
- [x] 2026-07-12 — Owner confirmed direct creator permission; reopened the authority gate for production assembly.
- [x] 2026-07-12 — Repaired `previews/three-quarter.png` after owner review found that the generic exterior inspection camera did not satisfy the locked captain-seat proof; regenerated it from the left-seat eye point with the deterministic `dc9-captain` profile.
- [x] 2026-07-13 — Replaced the procedural master with a deterministic donor-based production assembly, packed masked instrument crops, stable hierarchy, locators, and five approval/game cameras.
- [x] 2026-07-13 — Exported, validated, inspected, and promoted the 22,851,848-byte captain-view GLB.
- [x] 2026-07-13 — Integrated the saved captain camera, source-present proxy hiding, limited seated look, exact reset, responsive FOV, and neutral runtime lighting; captured 1440, 768, and 375 browser evidence.
- [x] 2026-07-13 — Owner rejected the first donor-backed browser proof: the yokes are rolled sideways, gauge scale/placement is incorrect, and the instrument-panel composition does not match the primary DC-9 imagery or Roger2009 article.
- [x] 2026-07-13 — Replaced the guessed instrument reconstruction with the Roger2009 package's native `DC9-32_cockpit.obj` geometry, neutralized the three yoke datarefs, and removed hidden manipulator draw ranges.
- [x] 2026-07-13 — Repaired the native atlas for portable glTF use, corrected OBJ8 material depth behavior in Three.js, updated the saved-canvas FOV contract, and visually inspected new 1440, 768, and 375 browser proofs.
- [ ] Receive owner visual approval before removing the greybox label or starting the first polished Captain Mode puzzle.

## Discoveries

- `DC9vc2.obj` contains 104,846 vertices, 371,382 indices, 129 `TRIS` ranges, and nested keyed animations; a static Wavefront OBJ importer is insufficient.
- The package supplies 2K day/night atlases for the primary interior objects.
- The current source archive is preserved at `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/DC9-32.zip` with SHA-256 `8ddb5856b0d4c7f5a63e56b0898cadbe21e26728c7ee4a636bd05259a3bc5c83`.
- The source page identifies the creator as `roger2009` and credits multiple contributors. Direct creator permission for CockpitEscapeRoom use and derivative production was owner-confirmed on 2026-07-12.
- The converter parsed all selected geometry and animation directives with zero unsupported directives; it reported 253 degenerate triangles and 44 first-key animation defaults.
- Raw Blender inspection found a strong cockpit shell, windshield, overhead, panel hardware, and period material base, but the main gauges depend on X-Plane's separate cockpit/instrument system and are missing from a self-contained conversion.
- The generic `render_source_candidate.py` three-quarter preset is an exterior orbit and must not be presented as captain-view evidence. The DC-9 intake uses a dedicated `dc9-captain` view profile for that path.
- The 16:9 Blender approval view and the approximately square 1440 gameplay canvas need different framing. The browser uses the saved left-seat pose with a 64-degree desktop FOV and a 76-degree narrow-layout FOV.
- Donor source coordinates convert to Three.js as `(x, z, -y)`; runtime lights had to use the converted axis convention rather than Blender positions.
- The donor cockpit atlas has mostly opaque white background around instrument sprites. A deterministic connected-border mask is required before packed instrument crops can be used without white rectangles.
- The package's `DC9-32.acf` declares 178 three-dimensional panel instruments with exact pixel positions, and `DC9-32_cockpit.obj` contains their animated 3D geometry and source-atlas mapping. The rejected build omitted this object and guessed replacement positions from atlas crops.
- The X-Plane import marks all source materials as blended. In Three.js that sorts opaque shell ranges behind the floor and hides the yoke/pedestal; runtime must restore depth-writing opaque behavior for non-glass OBJ8 materials and use alpha testing only for the native gauge cutouts.

## Decision log

- Target the DC-9-50 family; retain -51, -40, and -32 evidence only with explicit compatibility scope.
- Use the X-Plane DC-9-32 as a hybrid donor, not geometry authority.
- Promote donor derivatives only through the normal source, asset validation, browser proof, and owner visual-approval gates.
- Bake a deterministic parked evaluation pose; preserve unsupported or unknown animation directives as report warnings rather than guessing silently.
- Stop for owner approval after the captain-view proof, before the first polished puzzle.
- Keep exterior front/side/top views as source-geometry inspection only; lock the DC-9 three-quarter approval view to the left-seat eye point.
- Treat the donor as cleared for production use while retaining its DC-9-32 compatibility classification and reconstructing missing instruments against DC-9-50-family authority.
- Keep the source-present cockpit visually clean by hiding the old floating 3D switch proxies while retaining the native HTML checklist as the required accessible control path.
- Preserve the 4K/2K donor textures through the owner visual gate; optimize only after the hierarchy and visual direction are approved.

## Milestones

### Provenance and conversion gate

The archive has a recorded origin and owner-confirmed use decision, and the selected cockpit OBJ8 files convert reproducibly into interchange assets with bounds, material, animation, and warning reports.

### Blender captain-view gate

The donor is normalized and refit under `DC9_ROOT`, old visible proxy geometry is disabled, and neutral/in-game renders show a credible DC-9-50-family left-seat relationship among panel, yoke, pedestal, overhead, sidewall, and windshield.

### Browser gate

The app uses the exported captain camera with restrained look/reset behavior, retains native HTML controls, loads the exact promoted GLB without console errors, and provides fixed screenshots for owner judgment.

## Implementation steps

1. Audit archive metadata, prior reports, embedded documentation, source URL evidence, and authority status; update the source report and asset manifest.
2. Extend `xplane_obj8_inspect.py` and add a deterministic converter for geometry tables, draw ranges, render state, nested transforms, and parked-pose values. Add focused Python tests.
3. Convert `DC9vc2`, `DC9panel`, `DC9vc1`, and `Glass` into `.cache`; generate recursive-bounds and raw-render evidence.
4. Import through a deterministic Blender build script, place donor material in a labeled source collection, promote/refit useful geometry, preserve runtime parents, and add captain cameras/locators and two lighting contexts.
5. Export raw to `.cache`, validate/reimport, inspect size/nodes/materials/textures/extras, then promote through `npm run asset:dc9`.
6. Add DC-9 load/camera state to `PrototypeScene`, remove visible floating proxy switches from the source-present path, retain HTML controls, and keep reward/persistence behavior unchanged.
7. Extend the existing bounded smoke path for DC-9 delivery/readiness/camera/console health; do not create a parallel heavy-GLB browser suite.
8. Capture 1440, 768, and 375 px browser views plus neutral captain, main panel, pedestal, overhead, and limited-look evidence. Record the remaining visual delta.

## Validation plan

Run converter unit tests, `npm run references:check`, `npm run asset:dc9`, `npm run assets:check`, `npm run pipeline:evals`, `npm run check`, `npm run test:e2e`, and `git diff --check`. Exercise correct/wrong checklist order, retry, keyboard controls, reload, reduced motion, camera reset, missing-asset fallback, reward lock, response byte parity, and console health.

## Acceptance criteria

- Source authority and owner-confirmed creator permission are documented before donor derivatives are tracked or deployed.
- Conversion is reproducible from the preserved archive and reports every unsupported directive.
- The captain view is visibly left-seat, eye-level, model-conscious, readable in neutral light, and not dominated by proxy geometry.
- The GLB passes validation and preserves required names/extras.
- Native Captain Mode controls still complete the existing flow without progress loss.
- Browser screenshots at 1440, 768, and 375 px show intentional framing and readable UI.
- The owner can answer whether the result feels unmistakably like the DC-9 he flew.

## Repair loop and stop conditions

Repeat inspect screenshot -> record the largest visible mismatch -> change one orientation/camera/material variable -> rebuild -> recapture. Allow three focused visual repair passes. Stop sooner if the remaining delta stops shrinking or owner judgment is required.

## Reopened visual defect ledger — 2026-07-13

Judged screenshot: `preview-renders/cockpit-pipeline/dc9-captain-browser/captain-game-view-1440.png`.

| Visible defect | Owner-visible cause | First variable to change | Required proof |
| --- | --- | --- | --- |
| Captain and first-officer yokes are rolled sideways | Imported parked-pose/default animation transform was accepted without reference comparison | Fixed: neutral pose sets all three yoke datarefs to zero | New browser proofs show upright grips and near-vertical columns beside the primary photo |
| Gauges are oversized, mismatched, and scattered | The build omitted `DC9-32_cockpit.obj` and created guessed atlas crops at hand-authored coordinates | Fixed: import the native cockpit-instrument object and remove the guessed assembly | New main-panel proof shows the two pilot clusters and regular center engine stack |
| Instrument panel silhouette and group relationships are wrong | Loose replacement faces obscure the donor's actual panel architecture | Fixed: preserve native panel/cockpit alignment at the package origin | Captain and straight-on panel views now match the Roger2009 composition; owner judgment remains open |
| Pedestal relationship is visually unreliable | The prior pass was judged before panel and yoke alignment was correct | Fixed: retain the donor pedestal with corrected opaque depth behavior | Browser proof now shows the throttle and automatic-pilot pedestal relationship |

Repair order: asset boundary -> yoke orientation -> panel/instrument scale and alignment -> camera/framing -> lighting/materials. Do not bundle later variables into the first proof.

## Evidence

- `python3 -m unittest tools.blender.cockpit_pipeline.tests.test_xplane_obj8_convert -v`: 6/6 passed.
- Full cockpit-pipeline unit discovery: 15/15 passed.
- Reference-authority gate validation passed for `agent0-dc9-xplane-evaluation-authority.json`.
- Pure conversion report: `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/extracted/optimized/obj8-evaluation-report.json`.
- Blender 5.1.2 generated a 3,984,250-byte intake `.blend` and a 20,564,560-byte intake GLB.
- GLB SHA-256: `00eed7115fa045eb391cae7976d31ecf25b15d6e74ea50ad60b094c2bbbef114`.
- glTF validation: zero errors and four legacy PNG feature/color-space warnings.
- Inspected renders: source-intake exterior front/side/top views, locked left-seat `previews/three-quarter.png`, and `previews/captain-eye.png`.
- Repaired captain three-quarter render: 1,313,183 bytes; Blender 5.1.2 completed the fixed `dc9-captain` camera profile successfully. EEVEE preview PNG hashes are not treated as stable evidence because repeated renders can differ at the byte level while preserving the camera and visible framing.
- `npm run references:check` validates the new DC-9 record but remains red because three unrelated locker reference photos already in the dirty worktree lack manifest entries.
- `npm run pipeline:evals`: 6/6 passed.
- `npm run asset:dc9`: passed scene validation, four approval renders, raw export, glTF validation/inspection, and deployable promotion.
- Current master: 23,143,913 bytes; SHA-256 `6e23c3f01f65e34e93f53cd989ff7723b198384c17547c3a23d92aa66a0c332e`.
- Current GLB: 26,742,512 bytes; SHA-256 `fc13dacfdc9eed4625244b6b7abc1001e496d2e0b2b2d758927713b94af0552d`.
- GLB inspection: 618 nodes, 602 meshes/primitives, 219,827 uploaded vertices, 236,610 triangles, five materials, five textures, five cameras, and no animations.
- `npm run assets:check`: passed; no GLB errors, with four imported PNG feature/color-space warnings plus informational UV/tangent rows recorded in the asset report.
- `npm run check`: passed lint, TypeScript, 42 Vitest tests, and production build.
- Focused real-GLB Playwright: 1/1 passed for delivery, hierarchy, saved camera, limited look/reset, greybox gate label, accessible control, and console health.
- Full `npm run test:e2e`: 13/13 passed in 4.8 minutes with one worker.
- Browser response byte parity: no-cache HTTP 200 and 26,742,512 bytes; zero page errors.
- Fixed browser evidence: `preview-renders/cockpit-pipeline/dc9-captain-browser/captain-game-view-{1440,768,375}.png`.
- Vercel preview `dpl_J8tb6mkq8p3jj84YgmU9EDQzmNDq` reached Ready at `https://cockpit-escape-room-5l72uhuph-ottoagent007-gmailcoms-projects.vercel.app`; authenticated asset fetch returned HTTP 200, 26,742,512 bytes, `model/gltf-binary`, and the exact local SHA-256 `fc13dacfdc9eed4625244b6b7abc1001e496d2e0b2b2d758927713b94af0552d`.
- `git diff --check`: passed.

## Outcome and handoff

The donor-backed cockpit is assembled, exported, integrated, and proven in the actual browser. Gameplay and Model Y work remain deferred in `plans/0012-dc9-pop-t-captain-level.md` and `plans/0013-model-y-flight-mode-reward.md`. The active stop condition is now the intended human visual gate: the owner must decide whether the captain view is ready for final cockpit-only refinement or requires specific gauge, framing, material, or geometry corrections.
