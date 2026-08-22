# Airbus FlightGear-Inspired Scenario Hub Design

**Status:** Owner-approved direction  
**Date:** 2026-07-30  
**Scope:** Airbus A320 Pop T Captain gameplay only

## Goal

Turn the Airbus chapter into a compact browser simulator with two connected exercises:

1. **Storm Line** teaches continuous weather judgment, smooth control, and energy management.
2. **Engine-Out Handling** unlocks after Storm Line and asks the player to stabilize a deliberate cruise-training power reduction, manage directional balance and energy, and steer toward a safe diversion corridor.

The chapter remains a fictional simulator running inside the safely parked commemorative aircraft. The exercises never imply that Pop T caused an accident, emergency, or systems failure.

## Player progression

The required journey is:

**Five-card qualification → Simulator Hub → Storm Line → Storm debrief → Engine-Out unlock → Engine-Out Handling → Airbus completion → existing protected reward**

- The five-card qualification remains mandatory.
- On a new run, Storm Line is available and Engine-Out is visibly locked.
- Completing Storm Line records its traits and returns the player to the Simulator Hub.
- Engine-Out then unlocks with a short instructor introduction.
- Completing Engine-Out completes the Airbus chapter and triggers the existing Pop T Captain celebration.
- The reward remains hidden until the entire Airbus chapter is complete.
- Previously completed Airbus or reward saves remain completed after migration and may replay either exercise without being relocked.

## FlightGear lessons being adapted

FlightGear is a presentation and interaction benchmark, not geometry or code authority.

The design adapts these patterns:

- One authoritative state drives input, simulation, cockpit animation, live instruments, weather, coaching, and persistence.
- Flight, camera-look, and cockpit-interaction responsibilities remain visibly distinct.
- Exercises are scenario state machines with steps, success conditions, error conditions, instructor messages, and safe recovery.
- Live PFD, ND, and ECAM textures read from the same simulation frame used by the 3D scene.
- Weather and failures are explicit scenario configurations rather than unrelated visual effects.
- A failed segment rewinds to a stable checkpoint instead of restarting the whole chapter.
- Required 3D interactions have keyboard, gamepad, and native HTML equivalents.

No FlightGear source code, aircraft assets, textures, or GPL implementation are copied into CockpitEscapeRoom.

## Simulator Hub

The hub appears in the Airbus cockpit after qualification and between exercises. It is a compact overlay that keeps the cockpit visible.

Each scenario card shows:

- title and one-sentence purpose;
- locked, ready, completed, or replay status;
- earned traits;
- best attempt summary;
- one primary action.

The cards are:

### Storm Line

Purpose: fly through the stable western weather gap while maintaining attitude and energy.

Initial state: **Ready**  
Completion result: unlock Engine-Out Handling and return to the hub.

### Engine-Out Handling

Purpose: stabilize a deliberate simulated cruise power reduction and establish a safe diversion.

Initial state: **Locked — complete Storm Line first**  
Completion result: complete Airbus Pop T Captain Mode.

The hub does not expose Tesla or reward imagery.

## Storm Line

Storm Line keeps its current deterministic three-checkpoint structure, cockpit displays, Storm Flight camera, limited look, accessible controls, and traits.

Its completion behavior changes:

- It no longer completes the Airbus chapter by itself for new progression.
- It records Storm Line completion and traits.
- It transitions back to the Simulator Hub.
- It unlocks Engine-Out Handling.

Existing Storm Line checkpoint retry behavior remains unchanged.

## Engine-Out Handling

### Scenario framing

The instructor deliberately starts a simulated left-engine power reduction during stable cruise. Copy consistently calls this an **exercise**, **simulation**, or **training event**. It is never random and never attributed to pilot error.

The exterior is calmer than Storm Line so the player can read heading drift, bank, and energy clearly. Weather remains present as light cloud motion and distant haze, not a second storm challenge.

### Control model

Engine-Out uses four normalized player axes:

- **Pitch**
- **Bank**
- **Paired thrust**
- **Directional balance**

Directional balance is a simplified arcade abstraction of yaw/rudder correction. It is intentionally not an operational A320 procedure.

Input mapping:

| Action | Keyboard | Gamepad | Native HTML |
| --- | --- | --- | --- |
| Pitch | Arrow Up/Down | Left stick Y | Pitch up/down holds |
| Bank | Arrow Left/Right | Left stick X | Bank left/right holds |
| Thrust | W/S | Triggers | Increase/decrease holds |
| Directional balance | A/D | Right stick X | Balance left/right holds |
| Recenter view | R | UI action | Recenter view button |

Keyboard, gamepad, and HTML paths feed the same normalized input frame.

### Stages

#### 1. Recognition

Duration: approximately 10 seconds.

- The aircraft begins in stable cruise.
- The instructor announces a deliberate simulator event.
- The left simulated engine indication reduces smoothly.
- ECAM shows **SIM ENG 1 REDUCED — TRAINING**.
- A captioned audio cue and directional-balance indicator appear.
- The player retains control immediately; there is no modal checklist.

#### 2. Stabilization

Duration: approximately 50 seconds.

The player must:

- keep pitch within ±12 degrees;
- keep bank within ±25 degrees;
- reduce normalized directional error below 0.45;
- keep energy between 35% and 65%.

The simulated power asymmetry continuously adds directional drift. Directional-balance input counters that drift, while bank and thrust corrections affect attitude and energy.

Leaving an envelope for five cumulative seconds pauses the exercise and presents one focused coaching message. Retry restores only the Stabilization checkpoint.

#### 3. Diversion

Duration: approximately 60 seconds.

- ND reveals two broad fictional corridors.
- The stable diversion corridor is visually clear and labeled **SAFE RETURN**.
- The player steers into that corridor while maintaining the stabilization envelope.
- Directional drift remains present but reduced.
- Crossing the corridor gate with a stable aircraft completes the exercise.

Leaving the corridor or control envelope for five cumulative seconds pauses and rewinds only the Diversion checkpoint.

#### 4. Debrief

The debrief awards up to three Engine-Out traits:

- **Directional Control**
- **Energy Discipline**
- **Calm Diversion**

Completion then triggers the existing Pop T Captain Mode celebration and reward handoff.

## Cockpit feedback

All visible feedback is driven by the authoritative Engine-Out simulation frame.

### PFD

- attitude horizon;
- bank and pitch;
- energy band;
- small directional-balance cue.

### ND

- current track;
- drift;
- SAFE RETURN corridor;
- corridor intercept cue.

### Upper ECAM

- two fictional engine-power rings;
- left simulated engine power reduction;
- **SIM ENG 1 REDUCED — TRAINING**;
- energy and directional-balance summaries;
- **NON OPERATIONAL** marking.

### 3D response

- windshield/world cues show heading drift and bank;
- captain sidestick follows pitch and bank input;
- paired thrust levers follow thrust input;
- the engine indication is split in the display only; the visible paired thrust handles are not remodeled into independent levers;
- camera limits and recenter behavior remain unchanged.

### Audio and captions

Audio remains opt-in. It may include:

- balanced cruise tone;
- asymmetric engine-tone change;
- restrained training chime;
- instructor callouts.

Every spoken cue has simultaneous text. Muting audio never removes gameplay information.

## Architecture

### Scenario boundary

Add a small scenario layer rather than turning the existing Storm Line module into a large conditional simulator.

Proposed modules:

- `src/game/airbusScenario.ts`
  - scenario IDs, hub progression, shared control and result contracts;
- `src/game/airbusSimulator.ts`
  - existing Storm Line rules;
- `src/game/airbusEngineOut.ts`
  - pure deterministic Engine-Out rules;
- `src/game/airbusInput.ts`
  - keyboard, gamepad, and accessible-input normalization shared by both exercises;
- `src/game/useAirbusSimulator.ts`
  - runtime orchestration selecting the active pure scenario without owning scenario rules.

Storm Line and Engine-Out keep separate state types and transition functions. They share only deliberately common contracts.

### Authoritative frame

Each animation frame follows:

**raw input → normalized Airbus input → active scenario fixed-step update → authoritative scenario frame**

Consumers read that frame:

- React Three Fiber animates camera, world cues, cockpit controls, and CanvasTextures;
- HTML telemetry publishes at a throttled rate;
- checkpoint and completion events enter the reducer;
- persistence stores durable progress only.

No Three.js objects, textures, DOM nodes, or audio nodes enter persisted state.

### Reducer and persistence

Persisted Airbus progress gains:

- active scenario or hub;
- Storm Line completion and best traits;
- Engine-Out unlock state;
- Engine-Out durable checkpoint, attempts, completion, and best traits.

The schema version increments from 10 to 11.

Migration rules:

1. Existing completed Airbus, reward, or Mars progress remains completed; both scenarios become replayable.
2. Existing Storm Line completion without a later global completion unlocks Engine-Out.
3. In-progress Storm Line retains its durable checkpoint and attempts.
4. Corrupt or impossible Engine-Out state returns safely to the hub without erasing qualification or Storm Line completion.
5. New saves complete Airbus only after Engine-Out completion.

## Coaching and recovery

Every failure is local and specific:

- attitude: ease pitch and bank toward center;
- energy: adjust thrust gradually;
- directional balance: hold the balance control against the indicated drift;
- corridor: intercept SAFE RETURN earlier and avoid overcorrecting.

The recovery dialog:

- pauses and clears active input;
- explains the failed envelope in plain language;
- offers **Retry this checkpoint**;
- never erases qualification or a completed scenario;
- restores a deterministic stable checkpoint snapshot.

Progressive hints become more explicit after repeated failures, but the physics do not secretly change.

## Accessibility and responsive behavior

- Every required action has a native HTML control.
- Focus, Space, Enter, pointer, and touch hold semantics remain supported.
- Controls remain expanded at coarse pointers and widths at most 768 px.
- Screen-reader telemetry includes directional balance and simulated engine power.
- Color is never the sole indicator for engine state, corridor choice, or failure reason.
- Reduced motion removes camera easing and decorative shake, but preserves gameplay timing and state.
- The scenario remains completable with sound off and without gamepad support.

## Performance

- Reuse the current Airbus GLB and authored display surfaces.
- Add no new production dependency.
- Use deterministic procedural exterior cues rather than global scenery.
- Keep one fixed-step simulation and one render-frame read.
- Keep HTML state publication at no more than 10 Hz.
- Avoid new large textures, videos, aircraft models, or network requests.

## Validation

### Unit tests

- Engine-Out deterministic response for all four axes;
- simulated engine reduction and directional drift;
- stabilization success and each failure reason;
- diversion corridor success/failure;
- checkpoint retry and trait awards;
- scenario unlock and Airbus completion gating;
- schema-v10 to schema-v11 migration;
- corrupt-save recovery and preservation of old reward progress.

### Browser tests

- qualification opens the hub with only Storm Line available;
- Storm Line completion returns to the hub and unlocks Engine-Out;
- Engine-Out accepts keyboard, gamepad, and HTML input;
- PFD, ND, ECAM, world cues, sidestick, and thrust respond to the same frame;
- pause, retry, reload, sound, keyboard focus, reduced motion, and responsive controls work;
- Engine-Out completion triggers the existing Airbus celebration;
- the reward remains hidden until both scenarios complete on a new save;
- old completed saves remain complete.

### Visual gates

Before finalization:

- 1440×900 hub view;
- 1440×900 Engine-Out Recognition;
- 1440×900 stabilized flight with readable PFD/ND/ECAM;
- 1440×900 SAFE RETURN diversion;
- 768×900 and 375×812 interaction proofs after desktop approval;
- owner approval before publishing the milestone as complete.

## Out of scope

- Global scenery or free flight;
- airport operations, takeoff, approach, or landing;
- real navigation databases, ATC, multiplayer, or live weather;
- operational checklists or real A320 emergency instruction;
- random failures;
- independent visible thrust-lever remodeling;
- broad Airbus cockpit remodel;
- FlightGear code or asset import;
- Tesla, reward-asset, Flight Mode, or Mars changes.

## Done when

- A new player must complete qualification, Storm Line, and Engine-Out before Airbus completion.
- Engine-Out visibly and accessibly responds to pitch, bank, thrust, and directional-balance input.
- The exercise can fail and safely retry each active checkpoint without losing earlier progress.
- PFD, ND, ECAM, cockpit controls, world cues, HTML telemetry, captions, and audio all reflect one authoritative frame.
- Old completed saves remain completed.
- Relevant unit, asset, type, lint, build, and focused browser checks pass.
- Desktop visual evidence is accepted before the expensive responsive and preview finalization pass.
