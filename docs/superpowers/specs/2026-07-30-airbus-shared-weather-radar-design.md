# Airbus Shared Weather and Live Radar Design

Status: Owner-approved direction; written specification awaiting owner review
Date: 2026-07-30
Branch: `agent/airbus-gameplay-evolution`

## Purpose

Replace the flat Airbus exterior weather backdrop and decorative navigation-display radar with one deterministic, continuously evolving weather field. The windshield, turbulence model, instructor cues, and live A320-style radar must describe the same fictional storm cells and the same navigable gap.

The visual target is the depth, atmosphere, legibility, and sense of flight found in modern desktop simulators such as Aerofly FS, Microsoft Flight Simulator, and FlightGear. CockpitEscapeRoom will not copy their code or assets and will not attempt full meteorological or operational radar simulation.

## Prompt contract

### Goal

From the Airbus captain view, the player sees believable airspace rather than a painted wall: a curved sky and distant horizon, cloud layers with parallax, storm towers and rain shafts with depth, restrained atmospheric lighting, and a stable weather gap that agrees with a continuously sweeping radar on the captain ND.

### Context

- Current desktop proof: `preview-renders/airbus-scenarios/airbus-storm-flight-view-1440.png`
- Current Engine-Out proof: `preview-renders/airbus-scenarios/airbus-engine-out-recognition-1440.png`
- Current exterior implementation: `AirbusStormWeather` in `src/scenes/PrototypeScene.tsx`
- Current Storm rules: `src/game/airbusSimulator.ts`
- Current Engine-Out rules: `src/game/airbusEngineOut.ts`
- Current presentation adapters: `src/scenes/airbusStormVisuals.ts` and `src/scenes/airbusEngineOutVisuals.ts`
- Current ND canvas rendering: `drawNd` and `drawEngineOutNd` in `src/scenes/PrototypeScene.tsx`
- Reference principles:
  - Aerofly exposes adjustable cumulus/cirrus density, cloud height, visibility, wind, and turbulence.
  - FlightGear models cloud layers, precipitation, visibility, and turbulence as related weather properties.
  - Microsoft Flight Simulator references demonstrate the importance of cloud depth, layered illumination, haze, rain shafts, and cockpit-to-weather contrast.

### Constraints

- Preserve the approved Airbus cockpit, camera framing, PFD/ND/ECAM bezel fit, controls, HUD, and scenario progression.
- Leave DC-9, locker, Tesla/Model Y, reward, Flight Mode, and Mars implementation untouched.
- Keep the interaction fictional and explicitly non-operational.
- Do not implement real radar procedures, weather downloads, live-world weather, terrain radar, windshear prediction, navigation databases, or failure logic.
- Add no production dependency.
- Do not copy simulator source code, textures, screenshots, or proprietary visual assets.
- Keep game rules separate from React Three Fiber presentation.
- Maintain one authoritative weather field; do not paint unrelated windshield and radar scenes.
- Avoid per-frame React state, object allocation, canvas-texture creation, or scene-graph churn.
- Preserve the accessible HTML instrument and control path.
- Reduced-motion mode keeps weather information live while suppressing nonessential camera shake, lightning flashes, and rapid drift.

### Done when

- The exterior no longer reads as a single flat rectangular plane.
- The horizon remains believable while the aircraft pitches, banks, and looks within the approved camera limits.
- Storm cells have visible near/mid/far depth, parallax, soft volume, and atmospheric occlusion.
- The navigable gap seen outside occupies the same bearing as the low-return gap on the ND.
- Radar returns change only when a live sweep reaches them and visibly age between sweeps.
- Green, yellow, and red returns correspond to the shared cells' precipitation intensity.
- Storm Line weather, turbulence intensity, radar, and instructor feedback derive from the same deterministic field.
- Engine-Out reuses the atmospheric renderer in stable cruise, with calm layered clouds and the SAFE RETURN cue appearing only during Diversion.
- The cockpit screens retain their accepted size, centering, and bezel fit.
- The new exterior remains usable at 1440, 768, and 375 CSS-pixel widths and has a reduced-motion path.
- Focused unit, browser, lint, typecheck, build, and visual checks pass before the repair is presented as final.

## Defect ledger

| Evidence | Visible defect | Likely cause | First variable to change | Required proof |
| --- | --- | --- | --- | --- |
| `airbus-storm-flight-view-1440.png` | Weather resembles dark circles painted on a wall | One camera-facing 384×288 canvas plane supplies the entire exterior | Replace the plane as the visual authority with a curved atmosphere plus depth-separated cloud layers | Same 1440 captain view showing near/mid/far cloud separation |
| `airbus-engine-out-recognition-1440.png` | Calm sky is flat and featureless | Engine-Out redraws the same flat plane with only a gradient and circles | Reuse the atmosphere renderer at lower density and warmer illumination | Same Recognition view with a readable horizon and restrained layered clouds |
| Captain ND during Storm Line | Radar is decorative and does not scan live | ND independently paints synthetic returns from scenario values | Drive a sweep/return buffer from the shared weather-cell field | Two timed captures proving sweep movement and return aging |
| Windshield and ND together | The gap outside can disagree with the radar | Exterior and ND have no common spatial data | Give both renderers the same immutable weather-field snapshot | Browser assertion comparing the dominant exterior gap bearing with the radar low-return bearing |

## Approved approach

Use a shared deterministic 2.5D procedural weather field.

This provides spatial consistency and visible depth without the cost and compatibility risk of full-screen volumetric ray marching. It also avoids the fundamental limitation of authored video or skyboxes, where a synthetic radar could not accurately sense the visible weather.

## Architecture

### Pure weather field

Create `src/game/airbusWeatherField.ts` with no React, Three.js, DOM, canvas, audio, storage, or networking dependencies.

The field contains a stable seed, forward-relative cell positions, altitude bands, radii, vertical development, precipitation intensity, drift velocity, and a reserved navigable-gap bearing. It is deterministic for a given scenario time and checkpoint.

Conceptual contracts:

```ts
export interface AirbusWeatherCell {
  id: string
  bearingDegrees: number
  distanceNm: number
  altitudeOffset: number
  radiusNm: number
  verticalDevelopment: number
  precipitation: number
  driftDegreesPerSecond: number
}

export interface AirbusWeatherFieldSnapshot {
  scenario: 'stormLine' | 'engineOut'
  elapsedSeconds: number
  visibility: number
  ambientLight: number
  precipitation: number
  turbulence: number
  gapBearingDegrees: number
  cells: readonly AirbusWeatherCell[]
}
```

Storm Line checkpoints select different envelopes over one continuous field:

- Weather Entry: scattered layered cloud, the western gap visible but not dominant.
- Storm Core: taller and denser cells, rain shafts, lower visibility, stronger radar returns, and restrained lightning.
- Clear Air: cells recede, horizon contrast and visibility recover.

Engine-Out uses the same field format with stable cruise visibility, lower cloud density, no storm-core lightning, and no automatic emergency framing. Diversion adds a separate restrained SAFE RETURN guidance layer; it does not mutate the weather cells.

### Exterior atmospheric renderer

Replace the current single-plane authority with a focused `AirbusAtmosphere` React Three Fiber component.

It uses:

- A large inward-facing sky dome with a lightweight procedural gradient shader for zenith, horizon haze, and lower atmosphere.
- One distant cloud deck for broad stratiform depth.
- Instanced camera-facing cloud clusters distributed in near, middle, and far bands.
- A small reusable signed-distance cloud texture generated once at startup; no imported simulator art.
- Soft opacity and color variation based on cell depth, precipitation, ambient light, and vertical development.
- Depth-faded rain-shaft meshes beneath high-precipitation cells.
- Subtle cloud drift and parallax tied to field time and aircraft attitude.
- One restrained whole-scene light flash during eligible Storm Core intervals, disabled in reduced motion.

The renderer will not use GPU ray marching. Cloud instances are bounded and reused, and the sky dome remains visually stable during approved look movement.

### Live A320-style fictional radar

Create `src/scenes/airbusWeatherRadar.ts` as a pure presentation adapter over weather snapshots.

The captain ND renders:

- heading-up fan geometry;
- range arcs and a fixed fictional training range;
- aircraft symbol and gap bearing;
- a continuously moving sweep;
- green, yellow, and red cell returns based on precipitation bands;
- an age buffer so only areas reached by the sweep refresh;
- gradual decay between sweeps;
- concise labels such as `WX TRAINING`, `TILT AUTO`, and `SIM — NON OPERATIONAL`.

The sweep animation is presentation-only. It cannot change game rules or cell locations. Reduced motion slows the sweep and removes flashing while preserving updates and return aging.

Engine-Out keeps the same authentic ND visual language. Recognition and Stabilization show low-density weather plus directional drift. Diversion layers the SAFE RETURN corridor over the weather radar without replacing or clearing weather returns.

### Shared data flow

```text
Scenario pure state + elapsed time
              |
              v
  AirbusWeatherFieldSnapshot
       |          |          |
       v          v          v
 atmosphere   radar sweep  turbulence/instructor adapter
       \          |          /
        same cells and gap bearing
```

React receives the authoritative scenario frame through existing refs. The weather snapshot is derived at a bounded cadence and reused by both atmosphere and radar renderers. React state is not updated every animation frame.

## Visual direction

### Storm Line

- Slate-blue upper sky with a pale, desaturated horizon.
- Cool gray storm cells with brighter, softly illuminated tops.
- Darker precipitation cores beneath the cloud towers rather than uniformly black clouds.
- Layered haze that partially hides distant cells and strengthens depth.
- The stable gap reads through increased horizon luminance, lower precipitation, and wider visibility—not a neon corridor painted in space.
- Lightning is infrequent, soft, and distant. It never becomes an arcade obstacle effect.

### Engine-Out

- Stable daylight cruise with a warmer horizon and scattered layered cumulus.
- Enough cloud motion and parallax to maintain a sense of forward travel.
- No ominous storm wall or accident framing.
- SAFE RETURN remains restrained and appears only during Diversion.

### Cockpit contrast

Outside luminance must support rather than overpower the accepted PFD, ND, and ECAM. The cockpit remains darker than the sky but retains readable panel detail and screen color.

## Performance budget

- One sky dome.
- One distant cloud-deck mesh.
- At most 48 instanced cloud clusters across all depth bands.
- At most eight visible rain shafts.
- One generated cloud texture reused by every cluster.
- No new texture larger than 512×512.
- Weather-field derivation at no more than 12 Hz.
- Radar sweep redraw at no more than 15 Hz.
- No per-frame scene-object creation or disposal.
- Reduced-motion mode lowers drift and lightning activity without disabling radar information.

If the real 38 MiB Airbus cockpit plus this renderer cannot maintain a stable browser interaction loop on the existing headless gate, instance count is reduced before visual scope expands.

## Failure and fallback behavior

- If the atmosphere material fails, render a calm gradient sky rather than a black or transparent exterior.
- If WebGL is unavailable, the existing accessible HTML instruments and controls remain authoritative.
- A radar-rendering failure must not stop the scenario, erase progress, or alter weather rules.
- Losing page visibility pauses scenario input as it does now; radar age resumes from scenario time without a giant catch-up sweep.
- No weather visual may unlock or reveal the protected reward.

## Testing and evidence

### Pure tests

- Same seed/time/checkpoint produces the same cells.
- Cell motion is continuous across bounded time steps.
- Storm checkpoints produce the intended density, visibility, precipitation, and turbulence envelopes.
- Engine-Out never inherits Storm Core density or lightning.
- Radar polar projection and exterior bearing resolve the same cell and gap.
- Green/yellow/red intensity thresholds are deterministic.
- Sweep refreshes only reached bearings and ages stale returns.
- Reduced motion preserves weather information.

### Browser tests

- Production Airbus GLB and atmosphere load without console errors.
- Radar sweep angle changes over time.
- A return remains unchanged before the sweep reaches it, then updates.
- Canvas diagnostics expose one shared field signature for exterior and radar.
- Exterior gap bearing and ND low-return gap agree within a bounded angular tolerance.
- Pitch, bank, directional input, pause, retry, reload, and recenter remain functional.
- Storm Line and Engine-Out both preserve screen bezel-fit contracts.
- Reduced motion suppresses lightning and rapid cloud drift.

### Visual gate

Tier 1 captures only authoritative 1440×900 owner proofs:

1. Storm Entry with layered depth and live radar.
2. Storm Core with rain shafts and stronger radar returns.
3. Engine-Out Recognition with calm layered atmosphere.

The first pass changes only the exterior/radar visual boundary. It does not repeat broad asset, responsive, deployment, or report work until the owner accepts the composition.

After approval, Tier 2 performs the one-time 375/768/1440 inspection, focused browser suite, `npm run check`, asset validation if applicable, `git diff --check`, evidence updates, and a Vercel preview.

## Acceptance criteria

- The owner judges the exterior materially closer to Aerofly/MSFS/FlightGear cockpit weather than the current flat-plane proof.
- Near, middle, and far weather layers are distinguishable in a still image.
- Motion makes depth more apparent without excessive shake.
- Radar visibly sweeps and refreshes live.
- Radar colors and shapes correspond to cells visible ahead.
- The safe gap agrees outside and on the ND.
- Storm and Engine-Out have distinct moods but one consistent rendering language.
- Existing cockpit framing, display fit, gameplay progression, accessibility, persistence, and reward protection remain intact.
- Tesla/Model Y files remain untouched.

## References

- Aerofly FS feature overview: `https://www.aerofly.com/features/overview/`
- Aerofly FS camera-view control: `https://www.aerofly.com/tutorials/camera-view-control/`
- FlightGear weather overview: `https://wiki.flightgear.org/Weather`
- FlightGear advanced-weather article: `https://www.flightgear.org/blog/advanced-weather-v1-4-in-flightgear-2-6`
