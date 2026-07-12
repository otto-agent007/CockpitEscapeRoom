# Locker room reveal proof

## Purpose

Make the approved Airbus completion flow into an emotional handoff: fade to black, present the Captain's-journey message, reveal the locker from a wide view, and move toward the lower shelf where the pilot watch begins a deliberate bottom-to-top memory sequence.

## Current state

The downloaded Game Locker and bench load from `public/models/locker-room.glb` with the owner-supplied Tripo pilot watch, Wings, Charging Bull, and captain's hat. The browser stages a one-time cinematic entrance against black, keeps one bay under warm practical light, renders Wings/Bull/hat as locked near-black silhouettes, and completes a directed 4.5-second camera move to the real watch. Schema-v5 persistence skips the long intro on resumed locker saves while preserving v3/v4 progress.

At this historical checkpoint, the authored sequence moved from the watch to the Charging Bull and then the Wings while baseball remained locked. That interim flow is superseded by `plans/0010-baseball-memory-import.md`, which inserts the playable baseball question before Bull and keeps Wings last. The imported later props restore their authored materials only when reducer state makes them available; the hat becomes claimable only when the full locker state reveals it.

## Scope

Included: cinematic timing and copy, skip/replay/reduced-motion paths, wide and watch camera cues, black scene backdrop, warm practical lighting, watch-first reducer gating, the jet-lag multiple-choice question, schema migration, accessible controls, failure fallback, four-prop Tripo source intake, deterministic Blender cleanup and export, stable colliders/contracts, locked-prop material handling, browser tests, and visual evidence.

Excluded: baseball prop intake, the post-Wings memory order, production audio, DC-9 changes, Model Y/Flight Mode/Mars work, and a Vercel deployment.

## Context and constraints

- Goal: the locker is a quieter emotional hinge, with the watch question contained in one focused dialog instead of a persistent quiz dashboard.
- The exact intro copy is: "Before you can sit in the captain's seat, you must understand the Captain's journey..." with typographic apostrophes and ellipsis in the UI.
- Required interactions have native HTML equivalents; reducer rules reject hidden or out-of-order actions.
- The hat remains dark, unreadable, and non-clickable until all required memories are eventually complete.
- Wrong watch answers preserve progress and advance the existing progressive hints.
- No new production dependency, asset mutation, Model Y spoiler, analytics, or personal-data transfer is allowed.
- Done when the cinematic, watch-first gate, persistence, accessibility, failure paths, responsive layouts, and real GLB click path pass in the browser and the owner can review the visual gate.

## Progress

- [x] 2026-07-10 - Built and validated the imported locker environment, dedicated HUD, schema-v4 memory flow, and accessible fallback.
- [x] 2026-07-11 - Replaced the immediate Airbus cut with the timed black-screen narrative handoff and preloaded locker reveal.
- [x] 2026-07-11 - Added wide/watch camera cues, constrained post-cinematic controls, warm practical lighting, and the temporary upper-shelf silhouette.
- [x] 2026-07-11 - Migrated persistence to schema v5 and enforced intro-complete/watch-first rules in the reducer and both 3D/HTML interfaces.
- [x] 2026-07-11 - Added skip, replay, keyboard focus trapping, reduced motion, reload/resume, failure fallback, and real-canvas click coverage.
- [x] 2026-07-11 - Passed full app, asset, pipeline, and 12-test browser validation and inspected 1440/768/375 browser captures.
- [x] 2026-07-11 - Preserved and inspected the downloaded Tripo watch and hat, then imported them through Blender under stable locker contracts.
- [x] 2026-07-11 - Reduced the watch/hat from 488,677/488,608 triangles to 71,999/69,999, staged their 4K maps at 1K, added exported colliders, and regenerated the locker GLB.
- [x] 2026-07-11 - Replaced the runtime hat proxy and watch/hat runtime hitboxes with the exported assets, verified silhouette/reveal behavior, and inspected browser output at 1440/768/375.
- [x] 2026-07-11 - Preserved and inspected the downloaded Wings and Charging Bull, reduced them from 492,226/498,476 triangles to 48,000/59,999, retained their native 1K textures, and integrated stable Blender-owned contracts/colliders.
- [x] 2026-07-11 - Mounted the Wings above the watch, placed the Bull on a slim dedicated shelf, kept both as locked silhouettes, and regenerated the 27,253,440-byte locker GLB.
- [x] 2026-07-11 - Changed the scene backdrop to black, removed the locker reveal badge and bottom watch card, added the compact watch control, and replaced the watch answer with the four-choice jet-lag question.
- [x] 2026-07-11 - Passed focused unit/type/browser validation and inspected the refreshed 1440/768/375 black-background captures with no console errors or horizontal overflow.
- [x] 2026-07-11 - Swapped Bull/Wings placement, authored their automatic reveal sequence, regenerated the locker asset, and recorded browser evidence.
- [ ] Capture a Vercel preview and receive owner approval for the locker visual gate.

## Discoveries

- Both Tripo downloads were single-mesh 4K candidates at about 489k triangles each. Their small on-screen framing supports a 70-72k triangle and 1K-texture web budget without visible silhouette loss in the approval renders.
- The Wings and Bull were also single-mesh Tripo candidates near 500k triangles, but arrived with native 1K maps. Neutral renders showed the Wings edge-on; a deterministic -90-degree turn is required before locker placement.
- The imported Bull needs a physical support to avoid floating. A narrow matte-metal shelf under `LOCKER_STATIC` preserves the careful vertical arrangement without crowding the watch or hat.
- The owner-adjusted locker master contained only two environment roots and no approval cameras. The prop-intake script wraps those roots without changing their world transforms, adds `LOCKER_ROOT`, and leaves approval-only cameras/lights outside the export root.
- A first silhouette pass was too large and floated in front of the locker. Browser inspection drove the final smaller, deeper upper-shelf placement.
- React lint requires R3F camera/canvas mutation through stable refs and transition state changes through event/timer callbacks.
- Parallel Airbus and locker GLB checks can push the real locker browser test beyond 30 seconds; its 75-second budget matches the existing Airbus real-asset test without weakening assertions.
- When 3D fails during the intro, the transition must yield to the retry/fallback dialog and treat the accessible scene as the camera-settled boundary.

## Decision log

- 2026-07-11 - Supersede the earlier non-linear four-memory start. The watch is the only currently authored first interaction; later order waits for prop intake.
- 2026-07-11 - Play the long intro on the fresh Airbus handoff, skip it for migrated/resumed locker saves, and expose Replay intro afterward.
- 2026-07-11 - Keep the first-time cinematic skippable by button or Escape; trap focus on the skip control while the modal is active.
- 2026-07-11 - Use directed camera moves followed by constrained look/zoom. Reduced motion uses short fades and immediate camera placement.
- 2026-07-11 - Replace the temporary `LOCKER_PROP_CAPTAINS_HAT_SILHOUETTE` with the imported hat. Keep the real mesh present, remove its readable texture/normal response before reveal, and restore its material only when `lockerHatRevealed` is true.
- 2026-07-11 - Put `game_id` metadata on stable empty parents and simple invisible colliders beneath them. This preserves reliable pointer targets without changing the visible proportions.
- 2026-07-11 - Stage prop textures at 1024 rather than 2048 because each item occupies a small share of the locker frame and three more keepsakes must fit the scene budget.
- 2026-07-11 - Preserve completed v3/v4 locker saves and treat their intro as already seen.
- 2026-07-11 - Keep the newly imported Wings and Bull visible only as locked silhouettes. Do not expand `authoredSequence` until the owner defines their story flow.
- 2026-07-11 - Use `Begin with the pilot watch.` as the complete opening instruction, expose `Inspect watch` as a compact native control, and keep later memory cards out of the tray until they are authored.
- 2026-07-11 - Make `Jet lag` the only correct watch choice; wrong answers give the time-zone clue first and the body-clock clue on repeated failure.
- 2026-07-11 - Put the Charging Bull between the watch and Wings, keep its dedicated shelf, automatically log the Bull after the watch, and require one readable story continuation before revealing/logging Wings.
- 2026-07-11 - Remove the passive next-memory and hidden-hat messages; keep retry/hint status and the eventual revealed-hat callout accessible.

## Milestones

1. Airbus completion fades to black, presents the centered story copy, and loads the locker without a blank-scene flash.
2. A wide warm locker view reveals one illuminated bay and the dark upper-shelf silhouette, then moves to the lower watch area.
3. Only the watch can be activated in 3D or HTML; later memories and the hat stay inaccessible.
4. Skip, replay, reduced motion, reload, keyboard, fallback, migration, and responsive paths remain safe.

## Implementation steps

The application owns the intro stage machine and coordinates asset readiness with the R3F scene. `LockerCameraDirector` interpolates the runtime camera between `entry-wide` and `watch-focus`; `LockerOrbitControls` enables constrained interaction only after settling. `tools/blender/import_locker_room_props.py` preserves the owner-adjusted environment, imports and cleans all four prop sources, establishes `LOCKER_ROOT`, exports stable contract parents/colliders, and records the intake report. The reducer remains the authority for memory and hat availability; the HUD provides the equivalent HTML controls.

## Validation plan

Run focused state/storage tests and locker Playwright tests first, then `npm run check`, `npm run test:e2e`, `npm run assets:check`, `npm run pipeline:evals`, and `git diff --check`. Exercise the full Airbus handoff, wrong/repeated-wrong watch answers, hint, skip, replay, keyboard focus, reload, reduced motion, real GLB click, load retry, accessible fallback, legacy migration, and 1440/768/375 layouts.

## Acceptance criteria

- The exact narrative sentence is centered on black and the locker is not interactable underneath it.
- The reveal begins wide and moves to the lower watch area; the post-cinematic watch framing is deterministic and resettable.
- One bay has restrained warm practical illumination and the environment remains readable.
- The real hat reads only as a dark upper-shelf silhouette and its exported collider is ignored until the full future sequence completes.
- New saves expose only the watch; forged or hidden baseball/wings/bull actions are reducer no-ops.
- Correct and repeated-wrong watch paths, reload, replay, reduced motion, keyboard, 3D failure, and fallback preserve progress.
- Existing completed saves can still continue to later phases.
- Required checks pass and browser captures show no console errors or blocked controls.

## Repair loop and stop conditions

Repeat focused implementation, validation, browser inspection, and remaining-delta review for at most three repair passes per checkpoint. Stop on passing checks, a non-shrinking failure delta, unavailable Tripo sources, or the owner visual gate.

## Evidence

- Locker GLB after the Bull/Wings layout revision: 27,253,492 bytes; SHA-256 `03d13d9e596ad77b7ca540f19a4826316d7467bdd7fe4d978bf48e71abcbf757`; 46 selected objects, eight materials, eighteen textures, and four exported `game_id` parents.
- A cache-busted request from the production preview returned the exact same 27,253,492 bytes as `public/models/locker-room.glb`.
- `npm run asset:locker` passed; Blender validation retained five known environment-transform warnings and glTF validation reported no errors.
- `npm run check` passed: lint, typecheck, 33 Vitest tests, and production build.
- Focused state/storage Vitest passed 32/32 and locker Playwright passed 5/5, including all four real exported prop nodes, Wings/Bull/hat silhouette/reveal states, exact jet-lag choices, exported watch collider, skip/replay, persistence, and fallback.
- `npm run assets:check` passed with the already-recorded locker generated-tangent warnings; no GLB errors.
- `npm run pipeline:evals` passed 6/6; `git diff --check` passed.
- Inspected refreshed browser captures with no console errors or horizontal overflow: `.cache/assets/locker/browser/locker-black-props-1440.png`, `locker-watch-jet-lag-question-1440.png`, `locker-black-props-768.png`, and `locker-black-props-375.png`.
- Bull/Wings revision validation passed: 33/33 Vitest tests, 5/5 focused locker Playwright tests, 12/12 full Chromium tests, `npm run check`, `npm run assets:check`, 6/6 pipeline evals, and `git diff --check`.
- Inspected actual-browser Bull/Wings captures at 1440, 768, and 375 widths under `.cache/assets/locker/browser/locker-bull-focus-1440.png` and `locker-wings-focus-{1440,768,375}.png`; no application errors or horizontal overflow were present.
- The downloaded baseball candidate is preserved under `.cache/cockpit-pipeline/sources/locker/baseball/original/` with SHA-256 `75dda2bf01c8c8863820ec25750ef2f1b15940ccfeb1b1c56d8d0b548d5ab19e`. It remains outside the runtime asset pending decimation and owner-reviewed placement.

## Outcome and handoff

The cinematic, black-background watch-first interaction and jet-lag question now flow automatically into the Charging Bull, then through an explicit readable continuation into the Wings. The Bull/Wings layout, shelf, camera cues, copy, accessible controls, persistence, and generated asset are locally validated. Remaining work is the Vercel/owner visual gate and production intake/placement of the staged baseball candidate.
