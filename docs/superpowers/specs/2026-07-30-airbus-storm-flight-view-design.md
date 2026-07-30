# Airbus Storm Flight View Design

## Goal

Turn the Airbus A320 Pop T Captain chapter into an earned flying experience. The player must first complete the existing cockpit drag-and-drop qualification in the wide captain view. Qualification unlocks an explicit **Begin Storm Line** action, which transitions into an Aerofly-inspired, forward captain flight view with readable instruments, a dominant windshield, responsive storm motion, and limited head movement.

## Context

The current Airbus implementation combines cockpit familiarization and Storm Line in one wide captain view. That view is useful for locating the sidestick, thrust levers, radio, altitude, and gear targets, but it is too far aft and too wide for active flight. It gives the pedestal, controls, empty panels, and permanent HTML control tray more visual weight than the windshield and flight instruments.

The owner selected the **Aerofly Focus** direction after comparing the current view with Aerofly FS and Microsoft Flight Simulator captain-view references. The selected direction moves the eyepoint forward and slightly higher, keeps the captain PFD and ND plus central ECAM readable, makes the windshield and moving horizon the main visual field, and removes most of the pedestal from the normal flight frame.

Reference behavior:

- [Aerofly FS camera views](https://www.aerofly.com/tutorials/camera-view-control/)
- [Aerofly FS overlays](https://www.aerofly.com/tutorials/overlays/)
- [Aerofly FS A320ceo](https://www.aerofly.com/features/aircraft/a320ceo/)
- [Microsoft Flight Simulator cockpit control overview](https://news.xbox.com/en-us/2021/07/26/microsoft-flight-simulator-xbox-series-x-preview/)

## Constraints

- Preserve the Airbus A320 captain/left-seat identity and existing wide captain camera for familiarization.
- Require every drag-and-drop placement to be correct before Storm Line can start.
- Remove the current **Skip familiarization** path.
- Keep game rules and persistence separate from Three.js presentation.
- Use Blender-authored camera transforms as the visual authority.
- Mirror every required flight input with a native HTML control.
- Preserve keyboard, gamepad, pointer, touch, reload, reduced-motion, no-WebGL, and corrupt-save recovery paths.
- Wrong inputs may reset the active Storm Line checkpoint but may not erase qualification or completed checkpoint progress.
- Frame the aircraft as safely flown through a commemorative simulator challenge. Do not imply that Dad caused an accident, emergency, or systems failure.
- Add no production dependency.
- Do not change the locker, Model Y, Flight Mode, Mars content, or reward progression.

## Player Flow

1. The Airbus chapter opens in the existing wide `CAM_AIRBUS_CAPTAIN_GAME_VIEW`.
2. The player completes all cockpit drag-and-drop placements. Incorrect drops retain the existing safe retry behavior.
3. Correct assignments persist across reloads. Storm Line remains locked while any assignment is incomplete.
4. The final correct assignment marks familiarization complete, collapses the drag interface into a concise qualification confirmation, and reveals **Begin Storm Line**.
5. Pressing **Begin Storm Line** starts a 1.25-second transition from the wide camera to the dedicated Storm Flight camera. Flight inputs remain disabled during this transition.
6. Reduced-motion users cut directly to the Storm Flight camera without interpolation.
7. Storm Line activates only after the camera transition completes.
8. Pause, retry, and reload return to the Storm Flight camera and active checkpoint. They do not replay familiarization or the camera transition.
9. Storm Line completion advances the Airbus chapter through its existing completion and reward boundary.

## Camera and Blender Contract

Add a Blender-authored camera named:

```text
CAM_AIRBUS_CAPTAIN_STORM_FLIGHT
```

The camera exports with:

```text
game_id = "airbus.a320.camera.captain_storm_flight"
purpose = "storm-flight"
seat_role = "captain"
aircraft = "Airbus A320"
```

The camera uses the approved Aerofly-style composition:

- Forward and slightly higher than the familiarization camera.
- Approximately 58-degree vertical field of view as the initial authored target.
- Windshield and exterior weather occupy at least half the 1440x900 frame.
- Captain PFD and ND are the primary lower-frame anchors.
- Upper ECAM remains readable without making the entire center pedestal visible.
- Sidestick and paired thrust controls may be outside the normal frame because their state is visible through the instruments and native controls.
- The captain PFD, ND, ECAM, and windshield remain visible throughout the complete limited-look envelope.

The application interpolates between the two exported camera transforms and fields of view. Runtime code does not maintain a second independent set of hard-coded eyepoint coordinates.

## Limited Head Movement

Storm Flight View supports restrained pilot-head movement around the authored Storm camera:

- Yaw: maximum 10 degrees left or right.
- Pitch: maximum 6 degrees up or down.
- Positional lean: maximum 1.5 centimeters horizontally or vertically.
- Roll: no user-controlled head roll.
- Mouse drag, touch drag, right gamepad stick, and assigned keyboard look controls share the same limits.
- **Recenter View** and the `R` key return to the exact Blender-authored transform.
- Recenter appears whenever the look offset is non-zero.
- Look offsets use damped movement and never modify the aircraft attitude or simulator input.

These limits are editable defaults. They may be reduced during the visual gate if the required instruments approach the frame boundary, but may not be expanded beyond the point where a required instrument leaves the frame.

## Runtime Architecture and Data Flow

The feature is divided into four bounded responsibilities:

1. **Game progression** owns familiarization status, camera phase, Storm Line checkpoint, attempts, traits, and completion.
2. **Simulation core** owns aircraft attitude, energy, weather, corridor progress, failure thresholds, and checkpoint resets.
3. **Camera rig** consumes the exported familiarization and Storm cameras, transition phase, reduced-motion setting, and limited-look offsets.
4. **Presentation adapters** map the current simulation frame into Three.js weather, horizon, cockpit display textures, physical control animation, audio, and the accessible HTML instruments.

The simulator uses one authoritative fixed-step state. React state is not the frame-by-frame transport between gameplay and Three.js:

- `useAirbusSimulator` advances and stores the current simulation frame in one stable runtime object or ref.
- React Three Fiber reads that current frame during its render loop.
- The HTML HUD receives a throttled snapshot, targeted at no more than 10 updates per second.
- PFD, ND, ECAM, sidestick, thrust levers, exterior horizon, weather, audio, and accessible values all derive from the same frame.

This directly prevents the current failure mode where HTML bank values update while the visible exterior barely moves.

## Interface Design

### Familiarization

- Retain the wide captain view, drag cards, projected targets, keyboard selection, and native drop controls.
- Remove **Skip familiarization** from the interface and reducer path.
- On completion, replace the drag tray with a compact qualification message and **Begin Storm Line** button.

### Storm Flight

- The windshield and cockpit canvas remain visually dominant.
- The top mission strip contains only checkpoint, concise instruction, progress or remaining time, pause, and sound.
- Remove the permanent large bottom flight-control tray.
- Provide a compact **Controls** drawer containing the native bank, pitch, thrust, pause, and recenter actions. It is always keyboard reachable. It starts expanded when the primary pointer is coarse or the viewport is 768 pixels wide or narrower, and starts collapsed on wider fine-pointer layouts.
- Keep the native accessible instrument region available to assistive technology without duplicating large visible gauges over the cockpit.
- Avoid a permanent full-screen HUD. The cockpit PFD, ND, ECAM, exterior motion, and short mission cues carry the gameplay.

## Failure, Retry, and Recovery

- Unsafe attitude or energy opens a checkpoint retry state with corrective guidance.
- Failure language describes a simulator pass that needs another attempt, not an accident.
- Retry restores aircraft state, inputs, camera look offset, weather state, and checkpoint timer to the active checkpoint baseline.
- Qualification, prior checkpoint progress, and best traits remain intact.
- Pause centers active flight inputs without discarding state.
- Reload resumes the saved checkpoint in Storm Flight View.
- A missing Storm camera is a contract failure caught by asset validation. Runtime fallback uses the familiarization camera with a visible non-blocking warning rather than a broken or arbitrary viewpoint.
- A model or WebGL failure preserves the native instrument and control path.
- Corrupt or stale saves normalize to the latest safe state without unlocking Storm Line before qualification.

## Persistence

Persist and version:

- Familiarization completion.
- Storm Line status and active checkpoint.
- Attempts and earned traits.

Do not persist:

- Partially held flight inputs.
- Camera interpolation progress.
- Temporary head-look offsets.
- Open or closed Controls drawer state.

Reloading an in-progress Storm Line session starts from the saved checkpoint with centered inputs and the authored Storm camera.

Existing saves that recorded familiarization as `skipped` are re-evaluated from their drag-and-drop assignments. A save with all correct assignments migrates to `completed`; any other formerly skipped save migrates to `unseen`, locks Storm Line, and returns to familiarization. Migration never treats the retired skip value as qualification.

## Validation

### Deterministic tests

- Storm Line start is rejected while any drag-and-drop assignment is incomplete.
- The final correct placement marks familiarization complete and reveals the start action.
- No skip action or reducer path can bypass qualification.
- Camera phase follows `familiarization -> qualified -> transitioning -> storm`.
- Flight inputs are ignored during camera transition.
- Fixed-step simulation and checkpoint reset remain deterministic.
- Reload and migration preserve qualification and active checkpoint safely.

### Asset and camera checks

- `CAM_AIRBUS_CAPTAIN_STORM_FLIGHT` exists in the authoritative Blender source and exported GLB.
- Camera metadata, transform, and field of view match the runtime contract.
- The original captain familiarization camera remains unchanged.
- The PFD, ND, ECAM, control pivots, and display metadata remain valid after export.

### Actual-browser exercise

- Complete familiarization through pointer drag-and-drop and the native keyboard path.
- Confirm Storm Line cannot start early.
- Exercise normal and reduced-motion camera transitions.
- Verify mouse, touch, keyboard, and gamepad limited look plus recenter.
- Verify visible exterior pitch and bank materially match PFD and accessible values.
- Exercise thrust, pause, failure, repeated failure, hint, retry, reload, sound failure, and no-WebGL fallback.
- Inspect approximately 1440x900, 768x900, and 375x812.
- Record console errors, model response bytes, asset hash, and screenshots.

## Approval Gate

The first owner gate is one fresh 1440x900 actual-browser screenshot in Storm Flight View showing:

- Aerofly-style captain composition.
- Dominant windshield and visibly responsive storm horizon.
- Readable captain PFD and ND.
- Visible central ECAM.
- No large permanent bottom control tray.

Do not treat the milestone as visually accepted until the owner approves that screenshot. After approval, complete the narrow-width evidence, reports, ExecPlan, and `TEST_REPORT.md`.

## Done When

- Drag-and-drop qualification is mandatory and cannot be skipped.
- **Begin Storm Line** performs the approved camera transition.
- Storm Flight View uses the exported Aerofly-style camera and limited look.
- All visible and accessible simulation consumers agree with one authoritative frame.
- The actual exterior visibly responds to pitch and bank.
- Safe retry, reload, reduced-motion, keyboard, gamepad, touch, accessibility, and fallback paths pass.
- The Airbus source, GLB, asset report, runtime contract, ExecPlan, tests, and browser evidence agree.
- The owner approves the 1440x900 Storm Flight View.
- No Tesla or post-Airbus reward file is changed.
