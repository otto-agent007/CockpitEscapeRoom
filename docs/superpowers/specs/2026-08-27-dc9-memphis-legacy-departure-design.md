# DC-9 Memphis Legacy Departure Design

**Status:** Owner approved 2026-08-27

**Date:** 2026-08-27

**Scope:** DC-9 right-seat gameplay and the older Memphis International Airport Concourse B environment

## Goal

Extend the DC-9 First-Officer chapter with a short, forgiving, cockpit-first legacy departure from an older Northwest-era Memphis International Airport Concourse B. After demonstrating the flight controls and completing the Legacy Route Record, the player taxis from the Concourse B ramp to a departure runway, lines up, takes off, and establishes a short initial climb before continuing the existing Final Flight Log.

The experience is an interactive memory recreation. The commemorative aircraft remains safely parked in the present-day story. The new gameplay must feel celebratory and aircraft-specific without becoming real-world DC-9 operating instruction.

## Context and approved decisions

The existing DC-9 progression is:

**Control Check → Legacy Route Record → Home Operations → Instrument Scan → Secure Aircraft → ATP Qualification → Captain's Key**

The approved progression becomes:

**Control Check → Legacy Route Record → Memphis Legacy Departure → Home Operations → Instrument Scan → Secure Aircraft → ATP Qualification → Captain's Key**

The owner approved these product decisions:

- the player taxis from the older Memphis International Airport Concourse B and takes off;
- the visual era is the mid-1990s Northwest period already established by the Legacy Route Record;
- the entire departure remains in the DC-9 right-seat cockpit;
- the Ted Davis X-Plane Memphis scenery package is the selected Concourse B source candidate;
- the departure is guided and compressed rather than a full free-roaming airport simulation.

## Player experience

### Opening beat

Submitting the correct Legacy Route Record closes the document and changes the windshield environment from the parked tribute presentation to a warm daylight Memphis memory recreation. A short title identifies `MEMPHIS LEGACY DEPARTURE · CONCOURSE B · 1995 MEMORY` and `FICTIONAL — NON OPERATIONAL`.

The aircraft begins at a marked ramp-start position just outside Concourse B after a ground-tow handoff. The player does not perform an engine start, pushback, radio call, checklist, or other real operational procedure. Concourse B is clearly visible from the right seat during the opening orientation.

### Guided sequence

The sequence should take approximately two to three minutes on a successful first attempt.

| Beat | Player action | Feedback | Recovery point |
| --- | --- | --- | --- |
| Ramp release | Ease the fictional thrust demand forward and keep the nose on the highlighted lead-out path | The terminal begins moving past the windshield, a compact direction cue reports alignment, and the cockpit controls visibly respond | Ramp start |
| Taxi turn | Use the rudder pedals to follow one meaningful curved centerline and settle on the outbound taxi path | Centerline glow, side-of-line text, and a restrained alignment tone reinforce steering | Start of taxi turn |
| Hold short | Close thrust and hold the brake in the marked safe zone | The aircraft stops automatically at the safe boundary and the runway environment opens ahead | Hold-short checkpoint |
| Lineup | Confirm `Ready to line up`, release the brake, and steer onto the runway centerline | The guidance line changes from amber to white and then green when aligned | Hold-short checkpoint |
| Takeoff roll | Advance the thrust levers and maintain the runway centerline with the pedals | Scenery acceleration, instrument animation, and alignment feedback build energy without showing real performance numbers | Runway lineup |
| Rotation | At the visual `Ease the column aft` cue, pull the yoke into the broad success band | The nose rises, the runway drops in the windshield, and the cue confirms a smooth legacy liftoff | Runway lineup |
| Initial climb | Relax the yoke toward neutral and use small yoke/pedal corrections to keep the horizon within a forgiving corridor | The Memphis environment recedes and a completion banner recognizes the legacy departure | Initial-climb entry |

The sequence ends after a short, stable initial climb. A gentle memory transition returns to the parked-cockpit Final Flight Log presentation and opens the existing Home Operations chapter.

## Controls

The departure reuses the existing authoritative DC-9 control state:

- thrust levers control normalized taxi and takeoff energy;
- rudder pedals control low-speed and runway directional alignment;
- pitch on the yoke performs rotation and initial-climb correction;
- roll on the yoke provides small initial-climb bank correction.

Add a separate fictional brake demand rather than overloading the thrust control:

- `Space` holds the brake from the keyboard;
- a native `Hold brake` button provides the accessible pointer/touch path;
- gamepad brake support may use one documented face button if it does not conflict with existing controls;
- releasing every input must leave the experience in a stable, recoverable state.

The current yoke, thrust, and rudder keyboard mappings and native hold buttons remain available. The HUD presents only the controls relevant to the active beat and does not become a simulator checklist.

## Guidance, mistakes, and progressive help

The player loop remains:

**Observe → inspect → decide → feedback → safe retry or progressive hint → path restored → legacy recognition → advance**

Guidance is deliberately fictional and qualitative:

- `centered`, `left of path`, and `right of path` replace numerical cross-track values;
- `stopped`, `rolling`, and `departure thrust set` replace knots or engine settings;
- `ease aft now` replaces a real rotation speed;
- no taxiway identifiers, runway number, airport chart, frequency, checklist, flap setting, trim value, or performance figure is taught.

A small departure card identifies the active beat, next intent, qualitative alignment, and progressive hint. It never covers the windshield center, primary flight instruments, or required cockpit controls.

Recoverable mistakes include sustained centerline deviation, crossing a checkpoint too quickly, failing to stop in the hold-short zone, and moving the yoke too early or too late during rotation.

For every recoverable mistake:

- the scene uses calm coaching and never depicts a collision, runway excursion, system failure, injury, or emergency;
- movement first slows or pauses at a safe boundary;
- the first miss gives directional feedback;
- the second miss adds a stronger verbal and visual hint;
- the third miss highlights the success corridor and offers `Restore checkpoint`;
- an automatic short fade restores the latest checkpoint if the player remains outside the playable corridor;
- completed earlier beats and all pre-departure puzzle progress remain intact.

The hold-short boundary is fail-safe. The scene cannot enter the runway until the aircraft is stopped in the safe zone and the player activates the explicit `Ready to line up` control.

## Rules and data model

Create a pure departure module with no React, Three.js, DOM, canvas, audio, storage, or networking dependencies.

Conceptual contracts:

```ts
type Dc9DepartureCheckpoint =
  | 'rampStart'
  | 'taxiTurn'
  | 'holdShort'
  | 'runwayLineup'
  | 'initialClimb'
  | 'complete'

type Dc9DepartureBeat =
  | 'rampRelease'
  | 'taxi'
  | 'holdShort'
  | 'lineup'
  | 'takeoffRoll'
  | 'rotation'
  | 'initialClimb'
  | 'complete'

interface Dc9DepartureInput {
  pitch: number
  roll: number
  thrust: number
  rudder: number
  brake: number
  lineupConfirmed: boolean
}

interface Dc9DepartureProgress {
  checkpoint: Dc9DepartureCheckpoint
  completedBeats: Dc9DepartureBeat[]
  attempts: Partial<Record<Dc9DepartureBeat, number>>
  hintLevel: 0 | 1 | 2 | 3
}

interface Dc9DepartureFrame {
  beat: Dc9DepartureBeat
  pathProgress: number
  lateralError: number
  headingError: number
  energy: number
  altitudeProgress: number
  pitch: number
  roll: number
  safeHold: boolean
}
```

Pure functions own:

- creation and normalization of durable departure progress;
- deterministic advancement of the transient frame from input and bounded delta time;
- qualitative guidance derived from alignment and energy bands;
- checkpoint completion rules;
- recoverable-mistake detection;
- attempt counting and progressive hint selection;
- restoration of a canonical frame for each checkpoint.

All gameplay thresholds use normalized fictional values. They must not encode or display real DC-9 operating speeds, engine targets, takeoff configuration, or airport procedures.

The transient simulation is fixed-step or otherwise deterministic under equivalent input samples. React and Three.js render state but do not decide success.

## Progression and persistence

Add `memphisDeparture` to `Dc9ChapterStage` between `routeRecord` and `homeOperations`.

- Correct route submission moves to `memphisDeparture` instead of `homeOperations`.
- Completing the initial climb marks the departure complete and moves to `homeOperations`.
- Wrong or repeated attempts never alter `routeCompleted`, `controlCheck`, later DC-9 progress, or global puzzle completion.

Increment the save schema from 13 to 14.

Persist:

- completed departure beats;
- latest earned checkpoint;
- per-beat attempt counts;
- overall departure completion.

Do not persist:

- frame-level aircraft pose;
- velocity, animation time, pointer position, pressed keys, brake hold, visual flashes, or audio state;
- Three.js objects, textures, cameras, or source asset metadata.

Reload restores the canonical beginning of the latest earned checkpoint. It never resumes with the aircraft moving or positioned across a safe boundary.

Migration behavior:

- existing saves already at `homeOperations` or any later DC-9 stage receive a completed Memphis departure so earned progress does not move backward;
- existing completed DC-9, locker, Airbus, reward, and Mars saves remain completed;
- existing saves at `routeRecord` remain at the route record and enter the new departure only after correct submission;
- existing saves at `intro` or `controlCheck` remain unchanged;
- malformed checkpoints, beats, attempts, and completion flags normalize to the earliest state supported by trustworthy existing evidence;
- migration never unlocks a later puzzle or reward.

## Presentation architecture

### Pure game layer

- `src/game/dc9MemphisDeparture.ts` owns simulation rules, checkpoint frames, guidance, hints, and normalization.
- `src/game/state.ts` owns durable progression actions, attempts, checkpoint restoration, stage transitions, and status messages.
- `src/game/storage.ts` owns schema 14 migration and defensive normalization.
- `src/game/config.ts` owns player-facing fictional copy and beat labels, separate from simulation thresholds.

### Runtime layer

- A focused DC-9 departure hook combines the existing DC-9 controls with brake and lineup confirmation, advances the pure simulation, and dispatches only durable checkpoint events.
- The runtime pauses on tab visibility loss, game pause, WebGL context loss, and reduced browser activity without advancing the simulation clock.
- The same authoritative frame drives the windshield world transform, instruments, native feedback, screen-reader announcements, and tests.

### Three.js layer

- The right-seat cockpit and approved camera remain the visual anchor throughout the sequence.
- The renderer treats the pure frame as a world-space aircraft pose and applies the corresponding inverse transform to the Memphis environment. This preserves a stable cockpit-first view without requiring or revealing an exterior DC-9 model.
- The taxi path is authored as a short deterministic spline with explicit checkpoint anchors, not as unrestricted airport navigation.
- Camera pitch, roll, vibration, and horizon motion remain restrained. Reduced-motion mode removes vibration and eases transitions while preserving essential path movement.
- The environment is lazy-loaded only for `memphisDeparture` and released when the player returns to the Final Flight Log.
- WebGL failure retains the native control and status path and offers safe checkpoint restoration; it must not mark the departure complete automatically.

### HTML and accessibility layer

- Every required input has a native HTML control and keyboard path.
- A screen-reader status reports active beat, qualitative path alignment, safe-hold state, hint, checkpoint restoration, and completion.
- Hold controls expose pressed state and descriptive labels.
- The continuous path has a text alternative such as `slightly left — steer right` rather than relying on centerline color.
- Focus does not jump during frame updates, hints, or checkpoint restoration.
- The departure remains usable at approximately 375, 768, and 1440 CSS pixels.
- Reduced-motion preference stabilizes the camera and suppresses nonessential fades, shake, and celebratory motion.

## Memphis source intake and licensing

Selected source candidate:

- package: `Memphis/Nashville Scenery Package for X-Plane 11.3` by Ted Davis;
- download page: `https://theosdavis.com/xpfiles/downloads_v11.html`;
- archive: `https://theosdavis.com/xpfiles/ewExternalFiles/Memphis_Nashville.zip`;
- inspected SHA-256: `fc403141223be066094814d9ea06d820f75477fea419870b04ffd65153434b95`;
- selected source files are exactly `KMEM/ConcourseB.obj`, `ConcourseB_2.obj`, `ConcourseB_2e.obj`, `KMEMterminal.png`, `KMEMterminal_LIT.png`, and `KMEMterminal_NML.png`.

The package readme permits only noncommercial distribution of the files and derived files, requests permission before releasing a derivative, and requires acknowledgment. On 2026-08-27 the owner attested that this private, noncommercial game has the required permission. Therefore:

- local inspection and candidate conversion may proceed with provenance recorded;
- the source intake report records `owner-attested permission for private noncommercial game, 2026-08-27` as the permission basis;
- derived Concourse B assets and private preview deployment remain within that attested scope and retain the required credit;
- OpenSceneryX objects, AutoGate assets, aircraft, vehicles, clutter, or other third-party library content bundled or referenced by the scenery are excluded unless their independent licenses and permissions explicitly allow this project's use;
- downloaded scripts are never executed.

The source package reflects a later airport revision and is not proof of exact 1995 terminal appearance. It supplies the Concourse B geometry base, while the final art direction is described as `1995 memory` rather than an exact historical reconstruction. Any era-restoration edits need dated visual references recorded in the asset report.

### Intake and authoring path

1. Preserve the untouched archive at `.cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/` and extract into its sibling `extracted/` directory.
2. Record the archive hash, source URL, author, license text, selected files, excluded third-party content, texture sizes, and intended scene group.
3. Convert selected X-Plane OBJ8 geometry deterministically with the repository's parser; do not rely on opaque interactive import state.
4. Inspect orientation, scale, recursive bounds, material assignments, texture color space, hierarchy, local axes, pivots, and scene centering in Blender.
5. Keep cleaned work under `extracted/optimized/` until source approval.
6. After staged source, assembly, and material approval under the recorded owner-attested permission, create `art-source/blender/dc9-memphis-legacy-departure.blend`.
7. Export first to `.cache/cockpit-pipeline/exports/`, validate, then promote the approved artifact to `public/models/dc9-memphis-legacy-departure.glb`.
8. Record evidence in `asset-reports/dc9-memphis-legacy-departure.md`, the active ExecPlan, and `TEST_REPORT.md`.

Stable public contracts should include a single environment root and named anchors such as:

- `KMEM_LEGACY_ROOT`;
- `KMEM_CONCOURSE_B` with `game_id=dc9.memphis.concourseB`;
- `KMEM_RAMP_START` with `game_id=dc9.memphis.rampStart`;
- `KMEM_HOLD_SHORT` with `game_id=dc9.memphis.holdShort`;
- `KMEM_RUNWAY_LINEUP` with `game_id=dc9.memphis.runwayLineup`;
- `KMEM_INITIAL_CLIMB` with `game_id=dc9.memphis.initialClimb`.

Exact object names and anchor placement become runtime contracts only after Blender source approval. Generated GLBs are never hand-edited.

## Visual direction

- Concourse B must read clearly during the ramp-start orientation without moving the player out of the right seat.
- Use warm mid-1990s memory color grading, restrained Northwest-era red accents from already approved project artwork, period-neutral ramp equipment, and no modern airline branding that has not been approved.
- Preserve the production DC-9-32 cockpit as the authority. Do not add generic retro cockpit details or Airbus-specific instruments.
- Keep the windshield center readable and the cockpit exposure balanced against daylight scenery.
- The retired greybox panel label must not return.
- Taxi guidance may use a subtle centerline halo and edge posts, but it must look embedded in the memory recreation rather than like a neon science-fiction track.
- Initial climb uses believable horizon and ground parallax, soft atmospheric depth, and restrained camera movement. There is no exterior aircraft shot.
- No fire, smoke, warning cascade, collision, damage, emergency lighting, or accident framing appears.

## Performance

- Lazy-load the Memphis environment only when the new stage begins.
- Reuse existing cockpit materials and instruments rather than duplicating the DC-9 asset.
- Keep the selected Concourse B geometry low-poly where silhouette permits and preserve texture clarity nearest the ramp start.
- Use bounded draw distance, culled or instanced repeated fixtures, mipmapped textures, and compressed web-safe texture formats after source approval.
- Record GLB size, material count, triangle count, texture dimensions, and browser frame-time evidence before promotion.
- Do not run destructive mesh or GLB optimization until hierarchy, anchor, material, and interaction tests prove it safe.

## Testing

### Pure simulation tests

- canonical checkpoint frames are deterministic;
- thrust and brake demands change fictional energy only within the active beat's safe rules;
- rudder changes alignment during taxi and takeoff roll;
- yoke pitch cannot complete rotation before the visual cue window;
- a successful rotation and stable correction enter initial climb and then complete;
- sustained path deviation produces a recoverable mistake rather than completion;
- hold short cannot transition until stopped and explicitly confirmed;
- checkpoint restoration clears transient motion but preserves completed beats;
- attempts increment only for the current beat;
- progressive hints strengthen without changing success thresholds;
- large, negative, non-finite, and paused deltas cannot skip checkpoints.

### Reducer and persistence tests

- correct route submission enters `memphisDeparture`;
- only valid checkpoint events advance durable progress;
- departure completion enters `homeOperations` exactly once;
- retry and restore preserve route and control-check progress;
- schema 13 migration preserves later DC-9 and whole-game completion;
- in-progress reload returns to the latest canonical checkpoint at rest;
- malformed departure state normalizes safely;
- reset returns the new departure to its initial state along with the existing chapter reset contract.

### Asset tests

- archive hash and provenance match the recorded candidate;
- only approved source objects and textures enter the Blender master;
- excluded library dependencies are absent;
- root hierarchy, stable anchors, `game_id` properties, pivots, axes, bounds, materials, and textures match the asset contract;
- raw and promoted GLBs pass the repository validators;
- Concourse B is visible and correctly oriented from the approved right-seat ramp-start camera;
- no generated GLB is hand-edited.

### Browser and visual tests

- the sequence begins only after Control Check and Legacy Route Record completion;
- the cockpit remains right-seat and first-person from ramp start through initial climb;
- keyboard, pointer/touch, gamepad where supported, and native HTML controls drive the same state;
- ramp release, taxi turn, hold short, lineup, takeoff roll, rotation, initial climb, and completion work in order;
- wrong, repeated-wrong, final-hint, manual restore, automatic restore, reload, pause, tab-hidden, reduced-motion, and WebGL-failure paths behave safely;
- route progress and completed departure beats are never erased by a mistake;
- no real speeds, frequencies, checklists, runway procedures, or emergency framing appear;
- the production DC-9 cockpit and Memphis environment load lazily and independently;
- layouts and visual evidence are reviewed at approximately 375, 768, and 1440 CSS pixels;
- the existing Home Operations, Instrument Scan, shutdown, qualification, key, locker, Airbus, and reward flows remain intact;
- no Model Y content is revealed early.

## Acceptance criteria

- From a fresh game, the owner can complete the flight-control check and Legacy Route Record, then taxi from a recognizable older Concourse B environment to the departure runway and take off without leaving the right-seat cockpit.
- The guided departure lasts roughly two to three minutes on a successful run and contains meaningful steering, braking, lineup, thrust, rotation, and initial-climb inputs.
- Concourse B is based on the selected Ted Davis source, with provenance, exclusions, attribution, and the 2026-08-27 owner-attested private-game permission recorded before preview deployment.
- All required actions work through native HTML controls and keyboard navigation as well as the cockpit interaction path.
- Wrong actions provide safe feedback, progressive help, and checkpoint restoration without erasing completed progress.
- Reload restores the latest earned checkpoint at rest, and schema migration preserves every previously earned chapter and reward.
- The sequence is explicitly fictional and non-operational and contains no real DC-9 or KMEM operating procedure.
- The experience remains responsive, readable, and visually coherent at phone, tablet, and desktop widths and under reduced motion.
- Focused pure, reducer, persistence, asset, and browser checks pass.
- Blender and browser screenshots prove the asset orientation, Concourse B ramp-start composition, taxi alignment, hold-short view, runway lineup, and initial-climb view.
- The active ExecPlan, asset report, and `TEST_REPORT.md` contain the actual validation evidence and genuine remaining limitations.
- The owner receives a private Vercel preview and consistent screenshots for the DC-9 approval gate after the source report records the owner-attested permission and required attribution.

## Scope exclusions

- No free-roaming KMEM airport, flight planner, route selection, landing, ATC, radio, traffic, weather system, fuel system, or multiplayer.
- No engine start, pushback procedure, checklist, numerical performance target, navigation database, or operational training content.
- No exterior DC-9 camera, fly-by shot, aircraft exterior remodel, or chase view.
- No claim of exact 1995 architectural reconstruction without additional dated reference evidence.
- No OpenSceneryX, AutoGate, third-party aircraft, or unrelated scenery-library content without separate explicit authority.
- No change to the Home Operations story, Instrument Scan order, secure-aircraft sequence, ATP qualification, Captain's Key, locker, Airbus, Model Y, Flight Mode, Mars, or reward protection except for inserting the approved departure between the route record and Home Operations.
