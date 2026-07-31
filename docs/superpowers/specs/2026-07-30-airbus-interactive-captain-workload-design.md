# Airbus Interactive Captain Workload Design

**Status:** Owner-approved direction  
**Date:** 2026-07-30  
**Scope:** Airbus A320 Pop T Captain gameplay only

## Goal

Make the Airbus cockpit itself part of the active simulator gameplay. During Storm Line and Engine-Out Handling, the player must complete a small number of required-but-forgiving captain workload actions on the live ND and ECAM while retaining pitch, bank, thrust, and directional control.

The result should feel closer to the interactive cockpit rhythm of FlightGear, Aerofly FS 4, and Microsoft Flight Simulator without copying simulator code, assets, procedures, or operational training content.

## Player experience

The existing progression remains:

**Five-card qualification → Simulator Hub → Storm Line → Engine-Out Handling → Airbus completion → protected reward**

The new workload layer adds four short tasks:

| Scenario checkpoint | Captain task | 3D interaction | Native equivalent |
| --- | --- | --- | --- |
| Storm Line · Weather Entry | Set the fictional training weather scan to `MID` range | Click the captain ND to cycle `NEAR → MID → FAR` | `Cycle scan range` button |
| Storm Line · Storm Core | Confirm the stable western weather gap | Click the west sector of the captain ND | `West`, `Center`, and `East` choice buttons |
| Engine-Out · Recognition | Acknowledge the deliberate simulated training event | Click the upper ECAM | `Acknowledge training event` button |
| Engine-Out · Diversion | Select the right-side `SAFE RETURN` corridor | Click the right sector of the captain ND | `Left corridor` and `Right corridor` choice buttons |

Each task is introduced by a concise instructor callout. The player may act immediately. If the next checkpoint boundary is reached before the task is complete, the exercise holds safely at that boundary and presents focused coaching. It does not fail the checkpoint, rewind the aircraft, or erase previous progress.

Wrong actions:

- give immediate visual and text feedback;
- increment only that task's attempt count;
- reveal a stronger hint after repeated misses;
- never clear completed tasks, traits, qualification, or scenario checkpoints.

Completing a task produces a short confirmation on the relevant cockpit display and lets the scenario continue.

## Simulator lessons being adapted

The design adapts the useful patterns already identified from desktop flight simulators:

- cockpit controls visibly change the instrument state;
- the same authoritative state drives 3D interaction, displays, coaching, and persistence;
- flight control and cockpit workload are separate responsibilities;
- scenario objectives arrive as short contextual instructor requests;
- incorrect actions remain recoverable;
- the cockpit stays visible instead of turning into a quiz screen;
- keyboard-accessible HTML controls mirror every required 3D action.

All controls remain fictional and explicitly marked `SIM — NON OPERATIONAL`. No real checklist, radar procedure, navigation database, or aircraft failure procedure is taught.

## Interaction behavior

### Active task

Only one workload task may be active at a time. The active task is derived from the active scenario and checkpoint. Completed tasks do not reopen during the same run or after reload.

The top mission strip adds one compact `Captain task` line. The existing flight-control drawer remains available and does not become a permanent large overlay.

### ND interaction

The captain ND surface becomes clickable only when its active task expects an ND action.

- During Weather Entry, any deliberate ND click cycles the fictional scan range.
- During Storm Core, the ND is divided into west, center, and east selection sectors.
- During Engine-Out Diversion, the ND is divided into left and right corridor sectors.

The ND canvas shows the current range or selection, a restrained active-task outline, and immediate correct/incorrect feedback. Weather returns continue to come from the existing shared deterministic weather field.

### ECAM interaction

The upper ECAM becomes clickable only during Engine-Out Recognition. A deliberate click acknowledges the simulator event. The display changes from `ACK REQUIRED` to `TRAINING EVENT ACKNOWLEDGED`.

The acknowledgement does not simulate a real ECAM procedure and has no downstream operational meaning.

### Pointer and camera separation

A click with less than six pixels of pointer travel may activate the relevant display. A drag continues to control the existing limited pilot-head look and must not trigger a workload action.

Cursor affordance appears only over a currently actionable display. Other cockpit geometry remains non-interactive during flight.

## Rules and data model

Create a pure workload module with no React, Three.js, DOM, canvas, audio, storage, or networking dependencies.

Conceptual contracts:

```ts
type AirbusWorkloadTaskId =
  | 'stormScanRange'
  | 'stormGapSelection'
  | 'engineEventAcknowledgement'
  | 'engineSafeReturnSelection'

type AirbusWorkloadAction =
  | { type: 'cycleScanRange' }
  | { type: 'selectWeatherSector'; sector: 'west' | 'center' | 'east' }
  | { type: 'acknowledgeEngineEvent' }
  | { type: 'selectSafeReturn'; side: 'left' | 'right' }

interface AirbusWorkloadProgress {
  scanRange: 'near' | 'mid' | 'far'
  completedTasks: AirbusWorkloadTaskId[]
  attempts: Record<AirbusWorkloadTaskId, number>
  lastFeedback: 'idle' | 'correct' | 'incorrect'
}
```

Pure functions:

- derive the active task from scenario and checkpoint;
- apply one workload action;
- identify the correct answer;
- produce progressive hint levels;
- determine whether a checkpoint transition is gated;
- normalize persisted progress safely.

The scenario layer receives workload completion as an explicit input. When a scenario update would leave a gated checkpoint, it returns the prior stable frame plus the blocking task ID. It never mutates workload state itself.

## Persistence

Increment the save schema from 11 to 12.

Persist:

- current fictional scan range;
- completed workload task IDs;
- per-task attempt counts.

Do not persist:

- transient hover state;
- pointer position;
- display flashes;
- spoken audio state;
- Three.js objects or textures.

Migration behavior:

- existing completed Airbus/reward saves receive all four tasks as completed;
- existing completed Storm Line saves receive both Storm tasks as completed;
- an in-progress scenario receives completed tasks only for checkpoints it has already passed;
- malformed task IDs, scan ranges, and attempt counts normalize to safe defaults;
- migration never unlocks the reward or completes a scenario that was not already complete.

## Presentation architecture

### Pure game layer

- `src/game/airbusWorkload.ts` owns task rules, actions, gating, feedback, and hints.
- `src/game/airbusScenario.ts` enforces checkpoint gates using explicit workload completion.
- `src/game/state.ts` owns durable workload updates and status messages.
- `src/game/storage.ts` owns schema 12 migration and normalization.

### Runtime and 3D layer

- `src/game/useAirbusSimulator.ts` passes workload completion into scenario advancement and exposes the current gate.
- `src/scenes/PrototypeScene.tsx` raycasts the existing ND and ECAM display surfaces and draws workload state onto their existing textures.
- No new Blender geometry or production dependency is required.

### HTML layer

- `src/components/Hud.tsx` presents the active task, feedback, progressive hint, and native controls.
- Every required action is keyboard reachable.
- Screen-reader announcements occur on task activation, incorrect action, and completion.

## Failure and recovery

- A wrong workload choice never triggers the scenario failure modal.
- Repeated mistakes reveal progressive hints.
- Reaching a checkpoint gate with unfinished workload shows a calm `Captain task required` hold.
- Flight inputs center while held.
- Completing the task releases the hold automatically.
- Pause, visibility pause, and sound mute keep their existing behavior.
- Retry rewinds only scenario flight state; already completed workload tasks remain complete.
- Reload restores completed tasks and does not replay them.
- WebGL failure preserves the native workload controls and accessible instruments.

## Visual direction

- Keep the approved raised Storm Flight camera and display fit.
- Use cyan for an active fictional workload cue, amber for a recoverable wrong selection, and green for completion.
- Do not add a large checklist panel.
- Do not cover the windshield, PFD, ND, or ECAM with permanent HUD gauges.
- Task feedback should read on the physical display first and the compact HTML task line second.

## Testing

### Pure tests

- each checkpoint derives the correct task;
- correct actions complete only their task;
- wrong actions preserve completed tasks and increase only the relevant attempt count;
- progressive hints strengthen after repeated mistakes;
- scan range cycles deterministically;
- Storm and Engine-Out checkpoint transitions hold until their required tasks complete;
- completed tasks release the hold without changing unrelated flight state.

### Reducer and persistence tests

- workload updates are ignored outside an active Airbus task;
- completed tasks persist across pause, retry, hub return, and reload;
- schema 11 migration derives only earned task completion;
- corrupt workload data normalizes safely;
- old completed and reward saves remain completed.

### Browser tests

- clicking the ND cycles range and selects the weather sector;
- clicking the ECAM acknowledges the training event;
- dragging to look does not trigger a display action;
- native HTML controls produce the same state changes;
- wrong, repeated-wrong, hint, correct, checkpoint hold, retry, reload, and reduced-motion paths work;
- production GLB display surfaces still fit their bezels;
- no Model Y or reward content appears early.

## Acceptance criteria

- The owner can complete all four workload tasks through the physical cockpit displays.
- The same tasks can be completed with native HTML controls and keyboard navigation.
- At least one visible ND property changes when scan range changes.
- The workload layer gates checkpoint transitions without causing a flight failure or erasing progress.
- Wrong actions provide useful feedback and safe correction.
- Completed tasks survive reload and scenario retry.
- Existing flight controls, camera look, live weather/radar, scenario progression, traits, accessibility, and reward protection remain intact.
- No new production dependency or Blender asset change is introduced.

## Scope exclusions

- No real operational radar, ECAM, diversion, or engine-out procedure.
- No free-flight map, navigation database, airport selection, takeoff, landing, ATC, or multiplayer.
- No changes to the DC-9, locker, Tesla/Model Y, Flight Mode, Mars, or reward sequence.
- No cockpit remodel and no additional scenario in this milestone.
