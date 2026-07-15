# DC-9 Final Flight Log — Design

Date: 2026-07-15  
Status: Approved design  
Scope: DC-9 opening chapter only

## Purpose

Reframe the existing DC-9-32 Captain Mode as a warm, lightly realistic 10–15 minute opening chapter. The player completes a representative legacy route record, recognizes Momma Cheryl's parallel work at home, ceremonially secures the aircraft, and receives The Captain's Key leading to the locker room.

This chapter treats the DC-9 as a living family memory rather than the game's deepest simulator experience. It deliberately uses the reliable interactions already present and reserves deeper cockpit gameplay for later Airbus work.

## Experience principles

- Pop T is always portrayed as an experienced, capable pilot.
- The DC-9 is a warm historical memory grounded in a natural working cockpit.
- Route selections represent familiar career routes, not a claim about Pop T's literal final flight.
- Momma Cheryl's contribution is honored as a record to read, never as a puzzle to solve.
- Mistakes never erase completed progress.
- New 3D cockpit functionality is minimized because the existing DC-9 interaction pipeline is fragile.
- Essential instructions, records, hints, and acknowledgements remain available in HTML.
- This milestone does not include a dedicated mobile layout or mobile visual-polish gate.

## Chapter progression

1. Cockpit introduction
2. Yoke route-strip discovery
3. Legacy Route Record
4. Home Operations Log
5. Ceremonial shutdown
6. The Captain's Key reveal
7. Locker-room transition

Suggested state names:

```text
cockpit_intro
route_strip_discovered
legacy_route_record
home_operations_log
ceremonial_shutdown
captains_key_reveal
locker_transition
```

## Opening atmosphere

The player enters a parked DC-9-32 in late-afternoon or sunset light. The cockpit should feel recently used rather than abandoned or preserved in a museum.

Use:

- Northwest-era blue-green and gray surfaces already present
- soft electrical hum
- distant ramp equipment and restrained airport ambience
- occasional fictional dispatcher-radio fragments
- naturally placed route paperwork
- minimal music until the Home Operations Log opens

The current production GLB, native instrument arrangement, captain camera, route camera, overhead camera, and limited look controls remain the visual foundation. The greybox label remains until separately approved for removal.

## Legacy Route Record

### Entry

The existing narrow route strip remains attached to the captain-yoke center pad. It acts as the reliable in-cockpit trigger.

Selecting it opens a split presentation:

- The DC-9 cockpit remains visible on the left.
- A readable period-styled route record occupies the right.
- Closing the record restores the same cockpit view.
- A narrow-width fallback may stack the document with a compact cockpit band, but no dedicated mobile design or mobile screenshot pass is required.

### Route memory puzzle

The yoke strip acts as one discovery trigger. Its existing route-row IDs remain in the GLB registry for compatibility, but the readable DTW/MSP/STL puzzle is rendered with HTML controls in the overlay. The implementation does not need to rebuild the 3D strip or replace its baked route text.

The three correct familiar routes are:

- DTW
- MSP
- STL

They are representative routes from Pop T's DC-9 years. Product copy must not describe them as his documented final itinerary.

Initial prompt:

> Which three cities were familiar stops during Pop T's DC-9 years?

The puzzle intentionally begins as family knowledge. Wrong submissions unlock progressive support:

1. Neutral annotation: two Northwest hubs and a familiar Midwestern stop.
2. Neutral annotation: think Michigan, Minnesota, and Missouri.
3. Final support: DTW, MSP, and STL receive a subtle warm outline.

Fictional dispatcher-radio fragments may reinforce atmosphere, but must not impersonate Pop T or claim to reproduce a real historical transmission.

Correct selections receive permanent ink stamps and remain complete across later wrong submissions. Incorrect selections lift or clear gently with a neutral response. No completed route is removed.

Completing all three routes produces:

> Legacy routes recorded. A companion record is ready.

## Home Operations Log

Completing the route record reveals the Home Operations Log. It is already complete and is not attributed to Pop T, Momma Cheryl, or the children. It is a neutral legacy record.

The player turns pages at their own pace. There are no answers, sorting mechanics, timers, failure states, or tests.

The pages recognize:

- Momma Cheryl caring for and feeding three children
- sports practices and games
- cheerleading practices and events
- school-clothes shopping and keeping everyone prepared
- changing schedules, household needs, and unexpected problems while Pop T traveled
- the steady work required to keep family life moving until he returned

Suggested page progression:

1. The parallel operation
2. The home crew
3. Keeping everyone moving
4. The invisible record
5. Recognition

Closing the record applies a simple **Legacy Recorded** seal.

Key sentiment:

> Pop T kept his passengers and crews on course. Momma Cheryl kept the family on course. Both were essential to bringing the crew home.

The later family-photo montage remains reserved for the end-game movie-style credits and is not used here.

## Ceremonial shutdown

After both records are complete, the camera moves to the existing overhead view.

Reuse only the supported semantic controls:

1. APU buses off
2. APU master off
3. Battery off

All controls may be explored. If the player acts out of order:

- the selected control moves slightly or acknowledges the attempt
- it safely returns to its prior state
- a calm checklist note explains the required predecessor
- completed steps remain complete
- the full attempt never resets

Each valid action removes a layer of cockpit light and sound:

- APU buses off softens instrument lighting and electrical ambience.
- APU master off winds down the background turbine layer.
- Battery off settles the cockpit into warm stillness.

Completion copy:

> Routes recorded. Home crew recognized. Aircraft secured.

## The Captain's Key

After battery-off, a chart light remains on the two completed records. A small warm glint near the logbook provides an in-cockpit target without requiring a complex new 3D key model.

Selecting the glint opens a polished HTML cinematic close-up of a substantial brass key.

Front engraving:

> THE CAPTAIN'S KEY

Reverse engraving:

> POP T & MOMMA CHERYL

The player selects **Take the Captain's Key**. The cockpit fades out and the locker-room door fades in. The key may remain visible as a progress symbol and later visual motif.

Reduced-motion mode presents the key in its final pose without rotation or animated camera movement.

## Component boundaries

Prefer focused React/HTML components rather than expanding the main scene file:

- `LegacyRouteRecord` — split cockpit/document shell
- `RouteMemoryPuzzle` — selection, permanent stamps, and hint ladder
- `HomeOperationsLog` — non-puzzle page navigation and acknowledgement
- `CeremonialShutdownHud` — forgiving sequence guidance
- `CaptainsKeyReveal` — cinematic key close-up and claim action

The Three.js scene owns camera changes, existing collider activation, supported switch animation, ambient-light changes, and the small key glint. Narrative copy, documents, hints, page navigation, and accessible equivalents live in React/HTML.

## Persistence and migration

Add explicit state for:

- discovered route trigger
- individually completed route stamps
- route-attempt or hint level
- Home Operations Log opened/completed
- each shutdown step
- key revealed/claimed
- locker transition

Existing completed saves must remain completed and must not be forced backward. Older in-progress DC-9 saves should migrate to the nearest safe chapter boundary. Corrupt or partial data should normalize to a valid recoverable state.

## Error handling and accessibility

- Missing or invalid DC-9 registry nodes use the existing compact HTML fallback.
- The complete chapter remains operable with keyboard and screen-reader controls.
- Instructions and meaningful visual events receive text equivalents.
- Route errors and out-of-order shutdown attempts use calm guidance rather than alarms.
- Reload resumes the current chapter state without losing completed work.
- Reduced motion removes document swoops, key rotation, and animated camera travel.
- Narrow screens receive a functional stacking fallback only; dedicated mobile composition and polish are out of scope.

## Out of scope

- New engine-start, taxi, takeoff, or flight procedures
- New interactive DC-9 systems beyond the existing route rows and three shutdown controls
- Broad Blender reconstruction or destructive GLB optimization
- A complex physical 3D key
- Dedicated mobile layout design or mobile visual-approval screenshots
- Airbus redesign
- Locker-room redesign beyond accepting the new key transition
- Model Y, Mars, or end-credit photo-montage implementation
- Removing the DC-9 greybox label

## Verification

Update or add coverage for:

- DTW/MSP/STL acceptance
- progressive hint behavior
- correct route stamps surviving wrong submissions
- Home Operations Log completion without quiz mechanics
- forgiving out-of-order shutdown behavior
- completed shutdown steps never resetting
- persistence and prior-save migration
- keyboard and screen-reader completion
- reduced-motion document and key behavior
- desktop split layout at the primary production width
- functional narrow-width fallback without a separate mobile polish gate
- real-GLB interaction-registry compatibility
- missing-model/registry fallback
- DC-9-to-locker transition
- no regressions to later locker, Airbus, Model Y, or Mars progress

Run the repository's standard validation commands, including unit tests, type/lint/build checks, asset validation, focused real-GLB browser coverage, and the full end-to-end suite.

## Recommended Codex configuration

Use **GPT-5.6 Sol with High reasoning** for primary implementation.

- Use Sol with Extra High reasoning for the initial repository analysis and final cross-file review.
- Use Max only if a subtle camera, persistence-migration, or interaction-registry problem remains stuck after focused debugging.
- Do not use Ultra for the main implementation because this is a tightly connected vertical slice with shared game-state and scene boundaries.
- Terra with Medium reasoning is suitable later for isolated copy tweaks, focused test additions, or small polish passes.
- Luna is not recommended for the main change.

In an interactive Codex session, select the model and reasoning level with `/model`. The documented explicit model launch form is:

```bash
codex --model gpt-5.6
```

## Acceptance criteria

The design is complete when:

- The DC-9 functions as the opening memory chapter.
- The yoke strip reliably opens the split Legacy Route Record.
- DTW, MSP, and STL form the family-knowledge puzzle with progressive hints.
- Momma Cheryl receives a dedicated, factual, non-puzzle Home Operations Log.
- The three existing shutdown controls form a forgiving ceremonial sequence.
- The hybrid key reveal shows both approved engravings and transitions to the locker.
- Existing completed progress survives migration.
- Essential gameplay remains accessible outside WebGL.
- No dedicated mobile layout or visual-polish milestone is introduced.
- The standard validation suite passes without later-chapter regressions.
