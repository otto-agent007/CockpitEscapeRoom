# Airbus Shared Weather and Live Radar

> For agentic workers: use `superpowers:executing-plans` and execute this plan inline, one test-first checkpoint at a time. Preserve unrelated work in the shared workspace.

Status: Active
Owner: Codex
Created: 2026-07-30
Design authority: `docs/superpowers/specs/2026-07-30-airbus-shared-weather-radar-design.md`

## Purpose

Replace the Airbus simulator's flat painted exterior and decorative ND weather marks with one deterministic weather field that drives both the view through the windshield and a continuously sweeping fictional A320-style radar. The result should read as flying through layered airspace, while preserving the approved cockpit, instrument fit, scenario rules, and protected reward sequence.

## Prompt contract

### Goal

Storm Line shows a curved atmospheric horizon, near/mid/far cloud depth, rain shafts, restrained lightning, and a visible low-precipitation gap that agrees with the captain ND. Engine-Out reuses the same renderer for stable daylight cruise. The ND sweep moves continuously and refreshes or ages returns from the same weather cells.

### Context

- Approved design: `docs/superpowers/specs/2026-07-30-airbus-shared-weather-radar-design.md`
- Current renderer and ND canvases: `src/scenes/PrototypeScene.tsx`
- Current Storm state: `src/game/airbusSimulator.ts`
- Current Engine-Out state: `src/game/airbusEngineOut.ts`
- Current visual adapters: `src/scenes/airbusStormVisuals.ts`, `src/scenes/airbusEngineOutVisuals.ts`
- Current browser proofs: `preview-renders/airbus-scenarios/`

### Constraints

- Leave DC-9, locker, Tesla/Model Y, reward, Flight Mode, and Mars files unchanged.
- Preserve qualification, Simulator Hub, Storm Line, Engine-Out, completion, persistence, cockpit framing, PFD/ND/ECAM bezel fit, controls, and accessible HTML paths.
- Keep interactions fictional and non-operational.
- Keep pure weather/radar rules outside React Three Fiber.
- Add no production dependency and use no copied simulator code or visual assets.
- Generate and reuse bounded procedural resources: one sky dome, one distant deck, at most 48 cloud clusters, at most eight rain shafts, and one cloud texture no larger than 512 square pixels.
- Derive weather no faster than 12 Hz and redraw radar no faster than 15 Hz.
- Do not allocate scene objects or React state on every frame.
- Reduced motion preserves information but suppresses nonessential shake, fast drift, and lightning.

### Done when

- The exterior is no longer a single camera-facing painted rectangle.
- Near, middle, and far cloud layers are visually distinct.
- The exterior gap and ND gap agree within five degrees.
- Radar sweep movement, reached-bearing refresh, return color, and age are deterministic.
- Storm weather intensity, radar returns, and exterior density come from the same immutable snapshot.
- Engine-Out has calm layered daylight and never inherits Storm Core lightning.
- Existing simulator controls and cockpit screen fit still pass their focused browser checks.
- Owner receives authoritative 1440 by 900 Storm Entry, Storm Core, and Engine-Out Recognition proofs.

## Current state

`AirbusStormWeather` in `src/scenes/PrototypeScene.tsx` draws the whole exterior onto one 384 by 288 canvas texture attached to a camera-facing plane. Its circles, corridor, gradient, and rain strokes are unrelated to the fixed radar blobs painted by `drawNd` and `drawEngineOutNd`. The result has no spatial agreement, radar sweep, return history, atmospheric depth, or convincing parallax.

The authoritative scenario frames already expose deterministic elapsed time, checkpoints, weather intensity, attitude, and Engine-Out phase. Those values can seed a shared pure weather snapshot without changing progression or persistence.

## Scope

### In scope

- Deterministic shared weather-cell snapshots.
- Pure exterior-layout and live-radar presentation adapters.
- Procedural sky, cloud layers, rain shafts, haze, and restrained lightning.
- Shared weather snapshot ref consumed by exterior and ND.
- Canvas diagnostics proving signatures, bearings, resource bounds, and sweep motion.
- Focused unit tests, real-browser visual checks, and Tier 1 owner screenshots.

### Out of scope

- Real weather, downloads, navigation databases, operational radar simulation, windshear, terrain radar, takeoff, landing, or free flight.
- Cockpit remodeling, Blender/GLB edits, screen geometry changes, or broad lighting re-authoring.
- Tesla/Model Y, reward, Flight Mode, Mars, DC-9, or locker changes.
- Broad responsive/deployment/report work before Tier 1 owner approval.

## Progress

- [x] 2026-07-30 — Owner approved one shared deterministic 2.5D weather field and fictional A320-style live radar.
- [x] 2026-07-30 — Design specification and defect ledger recorded.
- [x] 2026-07-30 — ExecPlan created from the approved design and current renderer contracts.
- [x] 2026-07-30 — Pure deterministic weather field passes 6 focused tests; typecheck is green.
- [x] 2026-07-30 — Pure atmosphere-layout adapter passes 6 focused tests and resource budgets.
- [x] 2026-07-30 — Pure live-radar sweep and aging adapter passes 7 focused tests; all 19 new pure tests pass together.
- [x] 2026-07-30 — Procedural atmosphere and shared snapshot ref replace the flat exterior authority; the legacy flat renderer is removed.
- [x] 2026-07-30 — Captain ND consumes the live shared radar without changing bezel fit.
- [x] 2026-07-30 — Focused unit, lint, typecheck, build, and real-browser scenario checks pass.
- [ ] Tier 1 Storm Entry, Storm Core, and Engine-Out Recognition proofs are awaiting owner review.

## Discoveries

- The current exterior and radar are both generated canvases, but they have no shared spatial contract.
- `AirbusSimulatorAnimator` already redraws its screen textures at a bounded 12 Hz, so radar can reuse that cadence while keeping its own sweep history in a ref.
- The cockpit and camera do not need Blender changes for this milestone; the visual defect is in the browser-authoritative exterior and ND rendering boundary.
- The captain camera looks down toward the flight deck, so a mathematically centered horizon falls behind the glareshield. The procedural horizon and cloud belt require a camera-relative elevation offset to appear through the windshield.
- Faceted cone geometry made rain shafts appear as large triangles. Camera-facing shader curtains removed that artifact while retaining the eight-shaft cap.
- Headless Chromium uses SwiftShader for this proof and the 38 MiB cockpit can take over two minutes per real-asset scenario. Running Storm and Engine-Out sequentially can delay input response; the isolated Storm proof retained the same roll threshold with a 15-second poll allowance.

## Decision log

- 2026-07-30: Use deterministic 2.5D cells rather than volumetric ray marching to preserve browser performance with the 38 MiB cockpit.
- 2026-07-30: Keep a single immutable snapshot ref in `AirbusCockpit`; both the atmosphere and ND read it.
- 2026-07-30: Use a left-right heading-up sweep and aged return buffer for readable live behavior without implementing operational radar.
- 2026-07-30: Stop after at most two Tier 1 visual repair passes if a genuine owner composition decision remains.
- 2026-07-30: Implement inline and sequentially because this workspace does not authorize delegated work.
- 2026-07-30: Define `signature` as the stable spatial field identity for a scenario/checkpoint/seed. Individual cell samples continue to drift, while asynchronous atmosphere and radar consumers can prove they share one field without timing-phase false negatives.

## Milestones

### Milestone 1: One deterministic airspace

Pure functions generate stable Storm Line and Engine-Out snapshots. A snapshot includes cells, precipitation, visibility, turbulence, ambient light, lightning eligibility, and the reserved gap bearing. It is deterministic and continuous for scenario time.

### Milestone 2: One spatial interpretation

A pure visual adapter converts cells into bounded near/mid/far cloud clusters and rain shafts. A pure radar adapter projects those same bearings and distances into the ND fan and refreshes only bearings reached by the live sweep.

### Milestone 3: Layered browser atmosphere

The flat plane is removed as the exterior authority. A camera-relative sky dome, distant deck, instanced cloud clusters, haze, rain shafts, and restrained light changes create depth while keeping the cockpit readable.

### Milestone 4: Live captain ND

The ND displays a heading-up training fan, range arcs, live sweep, aged green/yellow/red returns, gap cue, and explicit fictional labels. Engine-Out adds SAFE RETURN only during Diversion.

### Milestone 5: Real-browser proof

The production GLB loads, diagnostics prove exterior/radar agreement and sweep motion, simulator inputs remain functional, and three consistent 1440 by 900 screenshots are presented for owner review.

## Implementation steps

### Task 1: Create the pure weather field

Files:

- Create `src/game/airbusWeatherField.ts`
- Create `src/game/airbusWeatherField.test.ts`

Contracts:

```ts
export type AirbusWeatherScenario = 'stormLine' | 'engineOut'

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
  signature: string
  scenario: AirbusWeatherScenario
  elapsedSeconds: number
  visibility: number
  ambientLight: number
  precipitation: number
  turbulence: number
  lightningEligible: boolean
  gapBearingDegrees: number
  cells: readonly AirbusWeatherCell[]
}
```

Steps:

1. Add failing tests for identical-input determinism, continuous bounded drift, Storm checkpoint envelopes, reserved-gap clearance, Engine-Out calm density, and no Engine-Out lightning.
2. Run the focused test and observe the expected module-not-found or assertion failure.
3. Implement the smallest seeded field and snapshot signature needed to pass.
4. Rerun the focused test.

### Task 2: Create the pure atmosphere-layout adapter

Files:

- Create `src/scenes/airbusAtmosphereVisuals.ts`
- Create `src/scenes/airbusAtmosphereVisuals.test.ts`

Contracts:

```ts
export interface AirbusCloudCluster {
  id: string
  band: 'near' | 'middle' | 'far'
  position: readonly [number, number, number]
  scale: readonly [number, number, number]
  opacity: number
  precipitation: number
}

export interface AirbusAtmosphereLayout {
  clusters: readonly AirbusCloudCluster[]
  rainShafts: readonly AirbusRainShaft[]
  gapBearingDegrees: number
}
```

Steps:

1. Add failing tests for deterministic layout, cell-bearing projection, visible near/mid/far bands, no more than 48 clusters, no more than eight rain shafts, and reduced-motion drift bounds.
2. Run the focused test and observe failure.
3. Implement stable cell-to-cluster projection and bounded rain-shaft selection.
4. Rerun the focused test.

### Task 3: Create the pure live radar

Files:

- Create `src/scenes/airbusWeatherRadar.ts`
- Create `src/scenes/airbusWeatherRadar.test.ts`

Contracts:

```ts
export interface AirbusRadarReturn {
  cellId: string
  bearingDegrees: number
  distanceNm: number
  precipitation: number
  color: 'green' | 'yellow' | 'red'
  refreshedAtSeconds: number
  ageSeconds: number
}

export interface AirbusWeatherRadarFrame {
  signature: string
  sweepAngleDegrees: number
  sweepDirection: -1 | 1
  gapBearingDegrees: number
  returns: readonly AirbusRadarReturn[]
}
```

Steps:

1. Add failing tests for polar projection, color thresholds, sweep reversal, reached-bearing-only refresh, stale aging, gap agreement, and slower reduced-motion sweep.
2. Run the focused test and observe failure.
3. Implement an immutable radar frame advance function with a heading-up plus or minus 70 degree fan.
4. Rerun the focused test.

### Task 4: Replace the flat exterior authority

Files:

- Create `src/scenes/AirbusAtmosphere.tsx`
- Modify `src/scenes/PrototypeScene.tsx`

Steps:

1. Add a shared `MutableRefObject<AirbusWeatherFieldSnapshot | null>` in `AirbusCockpit`.
2. Derive snapshots at at most 12 Hz from the current Storm or Engine-Out frame.
3. Generate one reusable procedural cloud texture and render a camera-relative sky dome, distant deck, instanced cloud clusters, rain shafts, and restrained eligible lightning.
4. Remove `AirbusStormWeather` as the visual authority.
5. Expose diagnostics for weather signature, gap bearing, cloud count, depth-band count, rain-shaft count, and lightning state.
6. Run focused unit tests plus typecheck before continuing.

### Task 5: Render the shared live radar on the ND

Files:

- Modify `src/scenes/PrototypeScene.tsx`

Steps:

1. Keep one weather-radar frame ref inside `AirbusSimulatorAnimator`.
2. Advance it from scenario time and the shared snapshot at the existing bounded screen redraw cadence.
3. Replace fixed weather blobs with heading-up fan geometry, arcs, sweep, aged shared returns, gap cue, and `WX TRAINING`, `TILT AUTO`, `SIM — NON OPERATIONAL` labels.
4. Preserve the Engine-Out SAFE RETURN overlay only during Diversion.
5. Expose diagnostics for radar signature, gap bearing, sweep angle, return count, and oldest return age.
6. Run focused tests, lint, typecheck, and build.

### Task 6: Prove the player boundary

Files:

- Modify `e2e/airbus-storm-line.spec.ts`
- Modify `e2e/airbus-engine-out.spec.ts`
- Add screenshots under `preview-renders/airbus-weather-radar/`
- Update this plan with actual evidence

Steps:

1. Add browser assertions that exterior and radar signatures match, gap bearings differ by no more than five degrees, sweep angle changes, resource counts remain bounded, and the real cockpit loads without page errors.
2. Preserve existing pitch, bank, look, recenter, pause/retry, and screen-fit assertions.
3. Capture Storm Entry, Storm Core, and Engine-Out Recognition at 1440 by 900.
4. Inspect each image and perform no more than two focused visual repair passes.
5. Stop at the owner visual gate before broad responsive, deployment, or `TEST_REPORT.md` work.

## Validation plan

Focused commands:

```bash
npm test -- --run src/game/airbusWeatherField.test.ts
npm test -- --run src/scenes/airbusAtmosphereVisuals.test.ts
npm test -- --run src/scenes/airbusWeatherRadar.test.ts
npm test -- --run src/game/airbusWeatherField.test.ts src/scenes/airbusAtmosphereVisuals.test.ts src/scenes/airbusWeatherRadar.test.ts
npm run lint
npm run typecheck
npm run build
npx playwright test e2e/airbus-storm-line.spec.ts e2e/airbus-engine-out.spec.ts
git diff --check
```

Tier 1 visual review uses only the three approved 1440 by 900 captures. After owner approval, Tier 2 will run the one-time 375/768/1440 inspection, full relevant browser suite, `npm run check`, asset validation if applicable, evidence-report updates, and Vercel preview.

## Acceptance criteria

- Exterior, radar, turbulence strength, and gap bearing derive from one deterministic field.
- A still image shows a curved atmosphere and distinguishable near/middle/far weather depth.
- Storm Core has denser cells and rain shafts without a flat storm wall or arcade corridor.
- Engine-Out Recognition has calm layered daylight and no lightning.
- The radar sweep moves live and only refreshed bearings receive new return timestamps.
- Returns age and retain deterministic green/yellow/red thresholds.
- Exterior and radar signatures match and gap bearings agree within five degrees.
- Cockpit screens remain precisely inside their accepted bezels.
- Real-browser pitch, bank, look, recenter, pause, retry, reload, and accessible controls remain functional.
- Resource budgets and reduced-motion behavior pass.
- No Tesla/Model Y file is changed by this milestone.

## Repair loop and stop conditions

Repeat: run the narrowest failing test, diagnose the root cause, make one coherent repair, rerun the failed and adjacent checks, launch the real browser, inspect the same camera and state, and record the remaining delta. Stop when all Tier 1 checks pass, two visual repair passes are exhausted, the delta stops shrinking, or owner composition approval is genuinely required. Never weaken a test merely to make it pass and never claim an unrun command passed.

## Evidence

- `npm test -- --run src/game/airbusWeatherField.test.ts`: 6 tests passed.
- `npm test -- --run src/scenes/airbusAtmosphereVisuals.test.ts`: 6 tests passed.
- `npm test -- --run src/scenes/airbusWeatherRadar.test.ts`: 7 tests passed.
- Combined focused weather/layout/radar suite: 19 tests passed.
- Combined focused weather/layout/radar suite after the sightline and radar-band repair: 20 tests passed.
- `npm run typecheck`: passed after pure and browser-integration checkpoints.
- Focused ESLint over the eight implementation/test files plus `PrototypeScene.tsx`: passed.
- `npm run build`: passed; Vite production bundle generated.
- Real production-GLB Engine-Out proof: passed with shared signature, gap agreement, three depth bands, no rain/lightning, live sweep, control response, screen rendering, and no console errors.
- Real production-GLB Storm Core proof: passed with shared signature, gap agreement, three depth bands, bounded clouds/rain, live sweep, bank/look/recenter response, screen rendering, and no console errors.
- One-time production-GLB Storm Entry capture: passed its shared signature assertion.
- Tier 1 screenshots:
  - `preview-renders/airbus-weather-radar/airbus-storm-entry-weather-radar-1440.png`
  - `preview-renders/airbus-weather-radar/airbus-storm-core-weather-radar-1440.png`
  - `preview-renders/airbus-weather-radar/airbus-engine-out-recognition-weather-radar-1440.png`
- Owner-gate limitation: depth, horizon placement, distinct scenario palettes, radar sweep, radar aging, and shared-cell agreement are implemented. The generated cloud silhouettes remain stylized and are not yet visually equivalent to Aerofly FS or Microsoft Flight Simulator volumetric weather.

## Outcome and handoff

Implementation is complete through the Tier 1 owner gate. The flat exterior authority is removed; Storm and Engine-Out share a deterministic weather field with a layered browser atmosphere and live aged radar returns. The three 1440 by 900 proofs await owner judgment. If the owner accepts the composition, Tier 2 will run the one-time responsive/full-check/deployment evidence pass. If the owner rejects the stylized cloud appearance, the next milestone should focus narrowly on cloud material quality and atmospheric scattering without changing gameplay, cockpit geometry, or radar contracts. Tesla/Model Y remained untouched.
