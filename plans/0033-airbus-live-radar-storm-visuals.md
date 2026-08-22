# Airbus Live Radar and Storm Visual Fidelity Implementation Plan

**Goal:** Make the captain ND weather radar respond continuously to what the player does with the sidestick and thrust, and raise the out-the-window storm from flat sprite cards to a layered, lit, wet storm.

**Architecture:** Ownship track stays a pure rule in `src/game` (`airbusOwnshipTrack`), the shared weather field consumes it, and `src/scenes` presentation (radar canvas, atmosphere shaders) reads the resulting snapshot without owning any rules.

**Tech Stack:** React 19, TypeScript, Vite, Three.js, React Three Fiber, Vitest, Playwright. No new dependency, no Blender or GLB change.

## Global Constraints

- Change only the Airbus A320 gameplay/presentation layer. Leave DC-9, locker, Tesla/Model Y, Flight Mode, Mars, and reward files untouched.
- Keep every interaction fictional and marked `SIM — NON OPERATIONAL`.
- Do not change puzzle correctness: `stormScanRange` stays MID, `stormGapSelection` stays WEST, and the authored gap must remain in the west sector across the whole legal corridor.
- Preserve the approved raised Storm Flight camera, PFD/ND/ECAM bezel fit, pause, retry, reload, reduced motion, and reward protection.
- Never weaken a test to make it pass.

---

Status: Active
Owner: Claude
Created: 2026-08-19
Supersedes nothing; extends `plans/0026-airbus-shared-weather-radar.md` and `plans/0027-airbus-interactive-captain-workload.md`.

## Current state (measured, not assumed)

- `deriveAirbusWeatherField` input is `{scenario, checkpoint, elapsedSeconds, intensity, seed}`. No aircraft attitude, heading, or position term exists, so **banking the sidestick does not move a single radar return or the gap line**. The only player-driven radar change is the scan-range cycle.
- `hashSignature` includes `envelope.gapBearingDegrees`, so any live gap bearing would change the signature every frame and trip `shouldResetAirbusWeatherRadar` continuously.
- `AirbusSimulatorAnimator` advances the radar with `weatherSnapshot.elapsedSeconds`, which `AirbusAtmosphere` only republishes at 12 Hz. The sweep therefore steps at 12 Hz while the render loop runs at 60 Hz.
- `advanceAirbusWeatherRadar` retains a return for as long as its `cellId` is in the snapshot. A cell that rotates out of the ±70° fan would leave a permanent ghost at its last painted bearing.
- Cloud instances use `dummy.rotation.set(0, 0, small)` — no billboarding. The atmosphere root copies the camera quaternion, so a cluster at 67° bearing is viewed ~67° off-normal and renders ~40% foreshortened.
- Cloud alpha is a single `meshBasicMaterial.opacity` shared by all 48 instances. `AirbusCloudCluster.opacity` is computed per cluster but only feeds an RGB shade, so **near and far clouds are equally solid** and depth does not read.
- Lightning sets a `pointLight.intensity`. The clouds are `meshBasicMaterial` and the sky is a `ShaderMaterial`; neither is lit. The flash is invisible on the weather itself.
- The lightning gate `snapshot.elapsedSeconds % 19 < 0.12` is evaluated inside a 12 Hz throttle, so the 0.12 s window is usually skipped entirely.

## Design

### Ownship track (pure)

`lateralPosition = ∫ sin(bank)·0.2 dt` and heading is `∫ turnRate dt` with `turnRate ∝ sin(bank)`. The two are therefore exactly proportional to each other measured from the checkpoint's starting cross-track. That gives a heading with no new integrator:

`headingOffsetDegrees = (lateralPosition − checkpointStartLateral) × 30`, clamped to ±45.

`checkpointStartLateral` is already `0` for `stormEntry` and `-0.7` otherwise, so every checkpoint begins at a 0° offset and the authored gap bearing is what the player sees on arrival.

Closure is a real integral because it depends on thrust, so `trackDistanceNm` joins `StormLineAircraftState`, advancing at `0.07 × (0.45 + energy × 1.1)` nm/s and soft-capped at 8 nm.

Engine-Out reuses its existing `headingError` as the offset.

### Applying it

Cells rotate by `−headingOffsetDegrees` and close **radially** (bearing preserved). Radial closure is deliberate: it keeps the authored bearing geometry — and therefore the `gap free of storm-cell cores` invariant and the WEST answer — exactly intact while still reading as "the weather is coming at us". The gap bearing rotates by the identical offset, so the cell/gap relationship is unchanged by construction.

Two far templates move outward (55→62, 58→66) so the `far` depth band survives the 8 nm closure cap.

### Visuals

Clouds move to a small `ShaderMaterial` with per-instance alpha, tint, and haze attributes, which is what finally lets near and far clouds differ in opacity. Clusters gain a billboard yaw toward the viewer plus a seeded in-plane roll and mirror. Lightning becomes a pure, deterministic, multi-stroke envelope evaluated every frame and driven into the sky uniform, the cloud uniform, and the point light together.

## Defects found while implementing

Three silent rendering failures, each found by measurement rather than by looking
at screenshots. They are recorded because all three were invisible as failures —
the scene simply looked wrong, with no error surfaced to the developer.

0. **The sky fragment shader never compiled** (found last, and it invalidated
   several earlier visual judgements). See item 3.

1. **Custom shaders wrote linear colour into an sRGB framebuffer.** A raw
   `ShaderMaterial` includes neither the tonemapping nor the colour-space chunk,
   while `THREE.Color` converts hex to linear. `#39464e` therefore displayed as
   near-black and the whole atmosphere read as a dark void. Fixed by appending
   `#include <colorspace_fragment>` to all five fragment shaders.
2. **The cloud instance budget was duplicated and drifted.** The layout module
   emitted up to 300 sprites while `AirbusAtmosphere` still allocated its
   `InstancedMesh` and instanced attributes for 48. Only the first 48 sprites —
   the leftmost cells — were ever drawn. Fixed by exporting one budget constant
   and consuming it in both places, guarded by a test.
3. **The sky fragment shader never compiled.** `flat` is a reserved
   interpolation qualifier in GLSL ES 3.0 and was used as a variable name, so
   the sky sphere rendered nothing and the scene background showed through.
   Every sky, horizon and undercast change made after that point was dead code.
   Caught by the existing `expect(consoleErrors).toEqual([])` assertion.

A fourth issue was a design fault rather than a defect: a 560-unit undercast
disc drew over the entire cockpit. It was replaced by ray-marching a virtual
deck plane inside the sky shader, which cannot occlude anything.

## Tasks

- [x] 1. `src/game/airbusOwnshipTrack.ts` + test: pure ownship track for both scenarios.
- [x] 2. `src/game/airbusWeatherField.ts`: accept `ownship`, rotate cells and gap, radial closure, drop gap from the signature, push two far templates out.
- [x] 3. `src/game/airbusSimulator.ts`: add `trackDistanceNm` and integrate it from thrust-driven energy.
- [x] 4. `src/scenes/airbusWeatherRadar.ts`: drop out-of-fan ghosts, take an explicit live clock for the rewind check.
- [x] 5. `src/scenes/airbusAtmosphereVisuals.ts`: billboard yaw, per-cluster haze/roll/mirror, pure lightning envelope.
- [x] 6. `src/scenes/AirbusAtmosphere.tsx`: cloud shader, richer cloud texture, near-field rain, per-frame lightning, feed ownship.
- [x] 7. `src/scenes/PrototypeScene.tsx`: advance radar on the live sim clock, add TRK readout and ownship dataset hooks.
- [x] 8. Unit + e2e coverage, then real-browser validation at 375/768/1440 and reduced motion.

## Additional work beyond the original task list

- 9. The out-the-window storm was rebuilt rather than adjusted, after the owner
  asked for it to be "really top tier". Cells are now convective towers built
  from a golden-angle spiral of 15-29 sprites each (up to 340 in the field,
  previously 39 flat cards), with a wide turbulent base, pinched waist, sheared
  anvil, per-instance depth haze, and a shade ramp from dark rain base to lit
  anvil. Cells outside +/-62 deg of the nose are not built at all, and because
  bearings are ownship-relative they return the moment the player turns toward
  them.
- 10. The undercast is ray-marched against a virtual deck plane inside the sky
  shader, giving a horizon and a sense of altitude with no extra draw call.
- 11. `deriveVisibleGapBearing` searched +/-12 deg unpenalised. With a denser
  sprite field it began selecting a bearing more than 5 deg from the one the ND
  prints, breaking the "window agrees with the instrument" contract. The search
  is now +/-4 deg with a drift penalty, and a unit test sweeps five seeds, five
  heading offsets, and all three checkpoints.

## Performance

Measured in the Playwright environment, which is SwiftShader (CPU rasteriser),
not a GPU: the whole scene runs at ~0.9 fps there. Hiding the entire atmosphere
group raises that to 1.06 fps, so the weather accounts for roughly 12% of frame
time and the cockpit GLB dominates. A sweep of the cloud budget from 20 to 303
sprites moved the frame rate by less than 0.1 fps, confirming the sprite count
is not the constraint. No conclusion is drawn here about GPU hardware.

## Validation evidence

Recorded in `TEST_REPORT.md` and appended below as work completes.
