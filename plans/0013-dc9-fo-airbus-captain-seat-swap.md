# DC-9 FO / Airbus Pop T Captain Seat-Role Migration

## Purpose

Move the commemorative DC-9 Final Flight Log to the first-officer/right-seat viewpoint and move Airbus A320 Pop T Captain Mode to the captain/left-seat viewpoint without changing the journey, puzzle mechanics, locker sequence, reward order, or safety framing.

The observable journey remains:

**Start Game -> DC-9 First-Officer Final Flight Log -> locker -> Airbus A320 Pop T Captain Mode -> Model Y reward**

## Prompt contract

**Goal:** A returning or new player sees, resumes, and completes the unchanged journey with seat-role-accurate DC-9 FO and Airbus captain presentation, copy, persisted semantics, source assets, generated GLBs, and browser evidence.

**Context:** The feature branch starts at clean commit `40a1a66`. The previous dirty workspace was preserved as commit `80dd15c` on `wip/pre-seat-role-swap-20260715`. Schema v7 currently uses `captain` for the DC-9 phase, `firstOfficer` for the Airbus puzzle, schema-v6 compatibility fields in current saves, the Airbus runtime path `public/models/airbus-first-officer.glb`, a DC-9 captain camera family, and an Airbus FO camera with a browser-side compatibility offset.

**Constraints:** Keep Dad expert and the aircraft safely parked. Preserve the Final Flight Log, Home Operations Log, Captain's Key, locker memories, Captain's Hat, five-card Airbus puzzle, ATP question, reward order, accessibility equivalents, reduced-motion behavior, local-only storage, and Model Y spoiler protection. Do not add a puzzle, add a production dependency, hand-edit a GLB, introduce `airbus_master.blend`, redesign mobile, or treat historical evidence as current. The milestone is desktop-only at 1440x900. Use Blender 5.1.2 and the existing A320 shaded source.

**Done when:** Schema v8 and v3-v7 migration tests pass; both asset builds and GLB validators pass; required camera/target/game IDs, hierarchy, pivots, metadata, material/texture counts, hashes, and reports are recorded; the actual browser proves DC-9 right-seat and Airbus left-seat gameplay, initial and dragged-look target attachment, keyboard/accessibility, wrong/repeated-wrong/hint, reload/resume, reduced motion, failed model loading, full journey, reward spoiler protection, and console health; current docs/contracts contain only new active terminology; `npm run assets:check`, `npm run pipeline:evals`, `npm run check`, `npm run test:e2e`, gate validators, and `git diff --check` pass; 1440x900 screenshots and a Vercel preview are ready for owner review.

## Current state

- `src/game/state.ts` saves schema v7 with phases `briefing | airbus | locker | captain | reward | mars`, puzzle IDs `firstOfficer | locker | captain`, and duplicated schema-v6 compatibility state.
- `src/game/storage.ts` accepts v3-v7 and normalizes into v7.
- `src/game/config.ts` exposes `firstOfficerFlow`, `FirstOfficerControl`, and `FirstOfficerDecoy`; completion copy says First-Officer.
- The opening routes into the DC-9 `captain` phase and tells the player to find the route strip on the captain yoke.
- The Airbus scene loads `public/models/airbus-first-officer.glb`, uses `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`, and contains a legacy centered-camera correction in the browser.
- The DC-9 source/export contract is captain-camera-first and the route strip/colliders are attached to the captain yoke.
- Historical plans, reports, and gates describe the previous DC-9 captain/A320 FO assignment.

## Scope

Included:

- Schema v8, migration, game types, state fields, copy, tests, and storage safety.
- DC-9 FO camera family, route strip/colliders on the FO yoke, approval renders, GLB, and report.
- Airbus captain camera, captain sidestick target, direct exported-camera runtime, renamed GLB, fallback still, gates, and report.
- Runtime loading/help/completion copy and 1440x900 browser approval evidence.
- Living instructions, architecture, visual, asset, pipeline, manifest, gate, model README, TEST_REPORT, and ExecPlan updates.
- Standardized supersession notices in dated historical plans/evidence while otherwise preserving their contents verbatim.

Excluded:

- New puzzles or a six-step DC-9 scan.
- Mobile layout work, mobile screenshots, or a mobile approval gate.
- Locker, Captain's Hat, Airbus five-card/ATP mechanics, reward, Flight Mode, or Mars redesign.
- New production dependencies or destructive GLB optimization.

## Context and constraints

- Game rules remain in `src/game`, Three.js presentation remains in `src/scenes`, and required controls keep native HTML equivalents.
- Existing storage key `cockpit-escape-room:game-state:v1` remains unchanged.
- Newly saved schema-v8 state contains no obsolete schema-v6 compatibility fields.
- v7 phase `captain` maps to `dc9`; puzzle `captain` maps to `dc9`; puzzle `firstOfficer` maps to `airbus`.
- DC-9 `secureAttempts` lives inside `dc9` and wrong/out-of-order actions never remove stamps, pages, shutdown progress, or completed puzzles.
- Airbus camera and target placement come from the exported source; browser transforms must not compensate for the old FO export.
- Old seat cameras may remain only as explicitly deprecated compatibility nodes.
- The A320 shaded source at `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend` remains authoritative.
- Three evidence-driven visual repair cycles are allowed per seat-view gate. Stop with a concrete mismatch ledger if the visual delta stops shrinking or owner judgment is required.

## Progress

- [x] 2026-07-15 - Read root and nested agent guidance, blueprint, game design, visual realism, workflow, ownership, asset contracts, pipeline docs, relevant skills, and `PLANS.md`.
- [x] 2026-07-15 - Inspected Git state and preserved all durable tracked/untracked pre-migration work except `.vercel` as commit `80dd15c` on `wip/pre-seat-role-swap-20260715`.
- [x] 2026-07-15 - Created `agent/dc9-fo-airbus-captain-seat-swap` from `40a1a66`; `npm install` found no vulnerabilities and baseline `npm test` passed 57/57.
- [x] 2026-07-15 - Added schema-v8 and v7-migration tests; the focused run failed 10 assertions on version 7, phase `captain`, legacy puzzle IDs, and absent canonical fields, proving the new contract was not already present.
- [x] 2026-07-15 - Implemented canonical schema v8, `dc9 | locker | airbus` puzzle semantics, nested `dc9.secureAttempts`, renamed Airbus/reward fields, explicit v7-to-v8 migration, and the retained v3-v7 chain. Focused state/storage tests pass 61/61 and `npm run typecheck` passes.
- [x] 2026-07-15 - Rebuilt and validated the DC-9 FO source/GLB/camera family and parented route contract on the first-officer yoke.
- [x] 2026-07-15 - Rebuilt and validated the Airbus captain source/GLB/camera/targets; fixed exported sensor fit so the GLB owns a true 68-degree vertical FOV.
- [x] 2026-07-15 - Integrated new assets, exact copy/help/completion terms, fallback stills, and direct exported-camera runtime behavior.
- [x] 2026-07-15 - Updated living contracts and added standardized notices above historical plans/evidence.
- [x] 2026-07-15 - Completed asset, app, pipeline, and 15-case browser validation plus inspected 1440x900 seat views. Remaining: full-diff review and Vercel preview.

## Discoveries

- The requested base commit and current HEAD were both `40a1a66`; the dirty pre-migration layer was therefore preservable without rebasing or conflict resolution.
- `.vercel` was the only intentionally excluded untracked directory and is locally ignored through `.git/info/exclude` on the feature branch.
- Baseline unit coverage consists of 57 Vitest tests across state and storage.
- Schema v8 can isolate every pre-v8 field inside `src/game/storage.ts`; no legacy compatibility fields are required in `GameState` or newly saved JSON.
- Blender `AUTO` sensor fit converted the requested Airbus view to a 59.3-degree glTF vertical FOV. An asset-contract test caught it; explicit `VERTICAL` sensor fit now exports `yfov = 1.1868238449` (68 degrees).

## Decision log

- 2026-07-15 - Treat the supplied implementation plan as the already-approved design and execution authority; do not reopen settled seat-role, naming, journey, or desktop-scope decisions.
- 2026-07-15 - Work in the repository's single active workspace, following the user's explicit branch-preservation sequence instead of creating a second worktree.
- 2026-07-15 - Keep existing narrow-width regressions but do not expand or use them as milestone approval evidence because this milestone is explicitly 1440x900 desktop-only.

## Milestones

### Milestone 1: Durable schema-v8 semantics

New games and migrated saves use `dc9` and `airbus` semantic identities. Every v7 phase and completed-puzzle combination migrates safely, in-progress DC-9/Airbus details remain intact, reward/Mars state remains reachable, corrupt state resets safely, and current saves omit obsolete compatibility fields.

### Milestone 2: DC-9 first-officer source and runtime proof

The production DC-9 opens from a calibrated right-seat eye point. The route strip and collider are visibly on the FO yoke. FO game/approval/route/main-panel/overhead/pedestal cameras exist, stable interaction metadata and pivots remain valid, and `dc9-game-ready-first-officer.png` supports opening/failure presentation.

### Milestone 3: Airbus captain source and runtime proof

The A320 opens from the left seat through `CAM_AIRBUS_CAPTAIN_GAME_VIEW`. The sidestick target is on the captain sidestick and the other four shared targets remain aligned before and after dragged look. The browser consumes the exported camera directly from `public/models/airbus-captain.glb`, and `a320-game-ready-captain.png` supports loader/failure presentation.

### Milestone 4: Current contracts and approval evidence

Active instructions, docs, manifests, gates, reports, tests, screenshots, and runtime copy consistently describe DC-9 FO and Airbus captain roles. Historical records retain their original evidence below a standard 2026-07-15 supersession notice. Automated checks and actual-browser flows pass, and a preview is ready for the three owner review gates.

## Implementation steps

1. Add schema-v8 tests in `src/game/state.test.ts` and `src/game/storage.test.ts` for initial shape, renamed puzzle semantics, every v7 phase, completed-puzzle mappings, corrupt saves, reward/Mars preservation, and in-progress DC-9/Airbus state. Run focused tests and record the expected failures.
2. Rename the Airbus config/types to `airbusCaptainFlow`, `AirbusControl`, and `AirbusDecoy`; update reducer actions, UI consumers, tests, and completion copy.
3. Replace the v7 state contract with schema v8 phases and puzzle IDs; move route/shutdown attempt state into `dc9`, rename qualification/unlock/reward fields, remove current-save compatibility fields, and preserve no-progress-loss reducer behavior.
4. Implement explicit v7-to-v8 normalization after the existing v3-v7 chain, retain the storage key, validate only canonical v8 shape on save/load, and run focused unit tests green.
5. Update `tools/blender/build_dc9_production.py`, validation requirements, and DC-9 source objects for the FO camera family and FO-yoke route strip/colliders. Build with Blender 5.1.2, validate/reimport, capture approval renders, and update `asset-reports/dc9-pipeline-proof.md`.
6. Update `tools/blender/cockpit_pipeline/a320_shading_blender_apply.py`, Airbus build configuration, gates, and source objects for captain game/approval cameras and captain sidestick target. Preserve old cameras only with deprecated metadata. Build, validate/reimport, and update Airbus reports.
7. Rename the deployable Airbus model and stills, update asset checks/manifests/model README, remove the browser FO compatibility transform, and consume the captain camera directly.
8. Update opening, loader, help, title, completion, status, and accessible copy exactly as specified. Preserve puzzle mechanics, retry/hint behavior, locker transition, reduced motion, and reward spoiler gates.
9. Rewrite active root/README/blueprint/game/visual/architecture/asset/pipeline guidance and current gate JSON. Add the standardized supersession notice to dated plans and validation evidence without rewriting historical bodies.
10. Run focused tests, both asset builds, GLB validators, gate validators, `npm run assets:check`, `npm run pipeline:evals`, `npm run check`, `npm run test:e2e`, terminology audit, and `git diff --check`.
11. Start the real app and exercise the specified 1440x900 flows. Capture DC-9 FO opening/route/yoke, Airbus captain initial/dragged, loader/failure/reduced-motion/reload, full journey, and spoiler-protection evidence with console logs.
12. Update `TEST_REPORT.md`, this plan, asset reports, and current gates with actual outputs, hashes, screenshots, preview URL, known deviations, and remaining owner decisions. Review the complete diff and repair all critical/high findings.

## Validation plan

### Unit and persistence

- Initial schema-v8 shape and absence of obsolete fields.
- v7 phases `briefing`, `captain`, `locker`, `airbus`, `reward`, and `mars` map correctly.
- v7 completed puzzles map `captain -> dc9`, `firstOfficer -> airbus`, preserve `locker`, and deduplicate.
- In-progress DC-9 stamps/pages/shutdown/attempts and Airbus assignments/answer/unlock state survive migration.
- Corrupt/unsupported saves reset and remove storage safely.
- Correct, wrong, repeated-wrong, hint, and completed-progress preservation for both aircraft chapters.

### Assets

- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:dc9`
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus`
- GLB validation/inspection for required cameras, roots, target/game IDs, pivots, hierarchy, metadata, materials, textures, object counts, sizes, and SHA-256 hashes.
- Fixed FO DC-9 and captain Airbus approval renders.

### Browser

- 1440x900 opening still and DC-9 right-seat game view.
- Route strip/collider physically attached to the FO yoke and reachable through pointer plus HTML control.
- Unchanged locker flow and Enter Pop T Captain Mode transition.
- Airbus left-seat initial and dragged-look screenshots with all five target anchors attached and captain sidestick target proven.
- Correct, wrong, repeated wrong, progressive hint, keyboard-only, accessible fallback, reload/resume, reduced-motion, model-load failure, full journey, spoiler protection, and console health.

### Full commands

- `npm run assets:check`
- `npm run pipeline:evals`
- `npm run check`
- `npm run test:e2e`
- Current gate validators in `docs/ASSET_PIPELINE.md`
- `git diff --check`
- Active-reference audit for obsolete DC-9 Captain Mode, Airbus First-Officer Mode, old camera names, and `airbus-first-officer.glb`

## Acceptance criteria

- Opening copy reads `DC-9-32 · First-Officer onboarding` and help reads `Look from the right seat`.
- Airbus title reads `Airbus A320 Pop T Captain Mode`; loader reads `Modern technology, earned command, and the view from the left seat.`; help reads `Look from the left seat`.
- Completion reads `POP T CAPTAIN MODE COMPLETE` and `Captain knowledge logged.`
- New schema-v8 saves use phases `briefing | dc9 | locker | airbus | reward | mars`, puzzle IDs `dc9 | locker | airbus`, `airbusQualificationAnswer`, `airbusCaptainModeUnlocked`, `rewardUnlocked`, and `dc9.secureAttempts` with no obsolete schema-v6 fields.
- v3-v7 saves load without losing valid journey, puzzle, reward, or Mars progress.
- DC-9 exports `CAM_DC9_FIRST_OFFICER_GAME`, `CAM_DC9_FIRST_OFFICER_APPROVAL`, and FO route/main-panel/overhead/pedestal approval cameras.
- Airbus exports `CAM_AIRBUS_CAPTAIN_GAME_VIEW` and `AIRBUS_A320_CAM_CAPTAIN_APPROVAL`; runtime uses `public/models/airbus-captain.glb` directly.
- Route/shutdown and five Airbus targets retain their stable names, metadata, hierarchy, pivots, and accessible equivalents.
- All planned automated checks pass and owner-facing 1440x900 screenshots plus preview URL are recorded.

## Repair loop and stop conditions

Repeat review -> smallest coherent repair -> focused validation -> actual browser inspection -> remaining-delta record. Re-run failed and adjacent checks after each repair. Limit the DC-9 FO gate and Airbus captain gate to three evidence-driven visual repair cycles each. Stop only when all technical acceptance checks pass, the bounded visual cycles are exhausted, the remaining delta stops shrinking, or owner visual judgment is genuinely required.

## Evidence

- Preservation commit: `80dd15c` on `wip/pre-seat-role-swap-20260715`.
- Feature base: `40a1a66` on `agent/dc9-fo-airbus-captain-seat-swap`.
- `npm install`: up to date; 397 packages audited; 0 vulnerabilities. One existing pnpm-style allow-scripts warning for `sharp@0.34.5` was reported.
- Baseline `npm test`: 2 files passed, 57 tests passed, 0 failed.
- TDD red run: `npm run test -- --run src/game/state.test.ts src/game/storage.test.ts` failed 10/67 assertions for the expected missing schema-v8 semantics.
- TDD green run: the same focused command passed 61/61 after consolidating migration coverage; `npm run typecheck` passed.
- DC-9 build: Blender 5.1.2 passed with zero scene warnings; GLB 30,338,056 bytes, SHA-256 `501e1bb65a7e025125edd26cba31aa7775cdf4c39e3a1c1e2efaf42ddc62635d`.
- Airbus build: Blender 5.1.2 passed with 124 preserved imported-source warnings; final evidence-promoted GLB 39,878,544 bytes, SHA-256 `8ede97bc91e1ad6ca88f7abbced7c7d7e43483fc99ea1f266687f982bde89899`.
- `npm run assets:check`: passed both deployable GLBs and canonical camera/FOV/node contracts.
- `npm run pipeline:evals`: passed 6/6 after making the aircraft-mixing guard accept both legacy and current scene-group names.
- `npm run check`: passed lint, TypeScript, 61/61 Vitest tests, and production build.
- `npm run test:e2e`: passed 15/15 Chromium cases in 3.7 minutes.
- Durable actual-browser evidence: `preview-renders/seat-role-swap/dc9-first-officer-game-1440.png`, `preview-renders/seat-role-swap/airbus-captain-targets-initial-1440.png`, and `preview-renders/seat-role-swap/airbus-captain-targets-dragged-1440.png`. The updated DC-9 copy names the first-officer yoke; both Airbus states have the SIDESTICK card selected and report five projected targets attached before and after head-look drag. Camera datasets matched canonical nodes/transforms and no application errors were recorded.
- Full-diff review found four high-severity issues and no critical issues. The completed DC-9 attempt-history normalization, accessible captain-side sidestick fallback, assembly/current-gate ownership conflict, and stale screenshot evidence were repaired and covered by focused tests or durable browser proof.
- Post-review verification: `npm run check` passed lint, TypeScript, 63/63 Vitest tests, and the production build; `npm run assets:check` passed; the focused model-failure fallback Playwright case passed 1/1 with the captain-side sidestick anchor asserted; the regenerated current runtime gate validates.
- Vercel preview: `https://cockpit-escape-room-fpgu0ip7r-ottoagent007-gmailcoms-projects.vercel.app` reached `READY`. Authenticated preview retrieval returned the final 39,878,544-byte Airbus GLB with SHA-256 `8ede97bc91e1ad6ca88f7abbced7c7d7e43483fc99ea1f266687f982bde89899`, matching the local deployable byte for byte.

## Outcome and handoff

Implementation, full-diff review, local technical verification, and preview publication are complete. Owner approval remains reopened for the DC-9 FO view, Airbus captain view, and complete reordered journey.

## 2026-07-15 golden-key finale polish follow-up

### Goal, context, constraints, and done-when

- **Goal:** Replace the text Captain's Key opener with the supplied golden key on the right-side green ledge, deliver a premium key celebration, fade cleanly into the locker, and compact the yoke route card plus Home Operations Log.
- **Context:** The approved design is `docs/superpowers/specs/2026-07-15-dc9-golden-key-finale-polish-design.md`. The source is `/mnt/2TBHDD/Downloads/golden key 3d model.glb` with SHA-256 `b243ec3571ef597048ad8ef08ae63eac8da6f9790f7552570921d08aff0a898d`. Browser reproduction proved the current reducer dispatch mounts the locker before the 900ms blackout covers the DC-9.
- **Constraints:** Preserve schema v8 and the safe parked-aircraft story, add no production dependency, keep native HTML equivalents, import and optimize the Tripo asset through Blender, preserve unrelated screenshots, and keep the current five-page Home Operations content.
- **Done when:** The real key is discoverable by manual rightward scan and pointer/keyboard access; its celebration and reduced-motion path pass; the phase remains DC-9 until full black; the route card is exactly half-height and centered neatly on the yoke; Home Operations is 360-430px tall at 1440x900; asset, app, browser, and responsive checks pass with recorded evidence.

### Follow-up progress

- [x] Approved option A for the route card and the unified night-cockpit visual direction.
- [x] Inspected the source key, current DC-9 contracts, route-card geometry, key reveal, Home Operations layout, and locker transition timing.
- [x] Reproduced the early locker mount during the key-claim fade and recorded the phase-ordering root cause.
- [x] Baseline verification: Blender 5.1.2, source hash confirmed, and 62/62 Vitest tests passing.
- [x] Added failing asset/runtime/browser contracts for the new key, shortened route card, compact log, and black-frame phase commit; the initial failures proved the old text trigger, 0.30-unit card, 780px log, and early locker commit.
- [x] Imported, optimized, placed, rebuilt, validated, and browser-proved the golden key and route card. The deployed key is 72,000 triangles with 1K PBR maps, and the route card is exactly 0.15 units tall and centered on the yoke.
- [x] Implemented the projected key interaction, celebration, transition sequencing, and Home Operations styling. Focused browser coverage passes for confetti, reduced motion, fade/persistence, desktop and mobile log height, and the actual rightward scan.
- [x] Ran full automated checks, responsive browser inspection, complete-diff review, and durable evidence updates. The final suite passed 19/19 browser cases after widening only the real-locker SwiftShader wall-clock budget.

### Follow-up decisions

- Integrate the optimized key into `dc9-cockpit.glb` instead of adding a second runtime model request.
- Use passive chevrons only; never pan the camera automatically.
- Keep `LockerIntroStage` names and make the existing `fade-to-black` to `black-pause` boundary the single `CLAIM_CAPTAINS_KEY` dispatch point.
- Preserve the five Home Operations pages and Momma Cheryl title; only the key celebration drops the prior personalization/engraving copy.
- Keep the entire key outside the right edge of the initial game camera. Show `>>>` only while its projection is outside the frustum, then remove the cue after a manual rightward scan brings the key into view.
- Generate MikkTSpace tangents only for `DC9_PROP_CAPTAINS_KEY_MESH_GEOMETRY`; exporting tangents for the full legacy cockpit created hundreds of unused-tangent validator findings.

### Follow-up discoveries

- Blender projection measurements and actual-browser projection differ because the runtime camera uses the live canvas aspect and seat-look state. The authoritative placement is `(0.95, -2.55, 0.338)` on the green ledge; a key-stage-only 0.28-radian initial left glance starts its 1440 projection outside the frustum at x=1675.8, then a rightward drag brings it to x=1090.4 and removes the cue.
- The complete flow initially exceeded the real-locker test's 240-second wall-clock budget under SwiftShader after all gameplay assertions had succeeded. A 420-second allowance preserves every assertion across two 42 MiB locker decodes and the following 38 MiB Airbus load; the isolated case passed in 3.4 minutes and the final 19-case suite passed in 8.0 minutes.
- The generic node renderer framed the key too loosely because its longest dimension runs partly into depth. A per-asset `distanceFactor` of `1.55` produces a legible product render without changing the shared Captain's Hat framing.
- The compact Home Operations height was correct at 1440 and 768, but the generic mobile `.dc9-document` bottom anchor reintroduced empty space at 375. A Home Operations-specific `bottom: auto` override reduced the final 375x812 panel from 580px to 439px.
- The production DC-9 Playwright flow reached the new key state at the former 180-second ceiling under software rendering. All behavior was present; retaining the assertions and raising only that real-GLB case to 240 seconds produced a passing isolated run.

## 2026-07-15 owner-feedback completion pass

- Moved the ATP qualification gate out of the Airbus chapter and placed it at the end of the DC-9 chapter, after shutdown and before the Captain's Key handoff. The gate retains visible native input and submit behavior, safe retry, keyboard access, and persisted progress.
- Shortened the opening copy so it ends with `Take the right seat and complete the Final Flight Log.` The DC-9 cockpit now preloads behind the opening and the Start Game transition fades through black into the already-loading cockpit.
- Lowered the DC-9 first-officer eye point to the headrest-level right-seat view requested by the owner.
- Repositioned the Airbus radio target slightly left on the square radio display and the thrust target right onto the thrust levers. The final 1440x900 evidence is `preview-renders/seat-role-swap/airbus-radio-left-thrust-right-final-candidate-1440.png`.
- Rebuilt the Legacy Route Record so the physical card and all contract hitboxes are centered on the actual first-officer yoke (`OBJ8_DC9VC2_RANGE_014`). The card itself is now the projected native-HTML opener, receives a gold hover/focus outline, and opens a compact record dialog without the obsolete yellow button or unused lower space.
- Final route-record evidence is `preview-renders/seat-role-swap/dc9-route-record-centered-1440.png`, `preview-renders/seat-role-swap/dc9-route-record-hover-1440.png`, and `preview-renders/seat-role-swap/dc9-route-record-compact-dialog-1440.png`.
- The owner approved the resulting view and journey refinements and requested PR publication.
- Fresh publication verification passed: `npm run pipeline:evals` 6/6, `npm run assets:check`, `npm run check` with 62/62 Vitest tests, `npm run test:e2e -- --workers=1` with 18/18 Chromium cases, and `git diff --check`.
- Final generated assets: DC-9 GLB 30,339,164 bytes, SHA-256 `a5a4cca94a616b1cca78cf1ca6eeb9a0325239fe036a558963834a511f05e377`; Airbus GLB 39,878,736 bytes, SHA-256 `367d7862b079cf1f01562f5f258c6e3bc473b01918219b5b8ba31867d43c31c4`.

## 2026-07-16 DC-9 owner-feedback polish

### Goal, context, constraints, and done-when

- **Goal:** Remove the pre-cockpit Legacy Route Record flash, make its gold outline follow the physical card, improve route-copy contrast, refine Home Operations content and narrow-screen flow, shift the shutdown view slightly left, and tilt the popup key clockwise.
- **Context:** A saved DC-9 intro reload renders the route opener as a visible fallback while the GLB is still `idle/loading`; the current route outline is a fixed CSS rectangle; the global paragraph rule overrides the intended dark route-question ink; Home Operations uses an internally scrolling height cap on narrow screens; shutdown begins at `0.10` radians of yaw; and the popup key has no screen-plane rotation.
- **Constraints:** Preserve schema v8, DTW/MSP/STL answers and hints, five Home Operations pages, wrong-answer progress, accessible equivalents, reduced motion, the safely parked story, and all unrelated workspace changes. Add no dependency and do not rebuild or hand-edit the DC-9 GLB or Blender source.
- **Done when:** Loading never exposes a visible route opener; the ready outline equals the projected card bounds plus 4px on each side; approved copy and dark question ink render; the narrow Home Operations panel grows with chapter-level scrolling and no internal scrollbar; shutdown yaw is `0.15`; the popup key is rotated `6deg`; focused and full validation plus 375/768/1440 browser evidence pass.

### Progress

- [x] Reproduced the loading-state fallback flash and traced it to `Dc9Chapter` treating missing projection data as a visible fallback before the model settles.
- [x] Add focused failing unit and Playwright coverage for the approved behavior.
- [x] Implement the loading gate, projected bounds, copy/layout, camera, and key changes.
- [x] Validate focused and full flows, inspect the diff, capture browser evidence, and update `TEST_REPORT.md`.

### Decisions

- Project the real `DC9_PROP_MEM_ROUTE_CARD` mesh bounds and give the HTML outline a 4px margin rather than enlarging another fixed rectangle.
- Keep a hidden keyboard route opener after the model is ready but the card is offscreen; show the compact visible fallback only for an actual load error or explicit accessible fallback.
- On screens up to 760px, scroll the Home Operations chapter layer while allowing the document itself to grow without an internal scrollbar.
- Rotate the existing popup image in CSS by `6deg`; do not regenerate the celebration PNG.

### Evidence and discoveries

- TDD red runs failed at the intended boundaries: the old page-two copy, visible loading-state route fallback, internally capped 375px Home Operations panel, light route question, and unrotated key.
- Focused green coverage passed 5/5 for the saved-load regression, accessible DC-9 flow, route copy/contrast, and normal/reduced-motion key popup.
- The production DC-9 flow passed with the real GLB, projected route-card bounds plus 8px total width/height, and shutdown camera state ending in `0.13868,0.24849,-0.01443,0.95855,64.00000`.
- `npm run check` passed lint, TypeScript, 62/62 Vitest tests, and production build; `npm run assets:check` passed; `npm run pipeline:evals` passed 6/6; the complete smoke spec passed 11/11 in 5.9 minutes.
- The first full browser suite passed 17/20. Two unrelated locker-WIP assertions remain red (Wings hint copy and watch camera distance `3.490` expected versus `3.492` actual). The DC-9 production case reached its final scan-cue assertion but crossed the 240-second ceiling under full-suite GLB contention; retaining every assertion and allowing 300 seconds produced a 4.5-minute passing smoke-spec run after the Airbus decode.
- Actual-browser Playwright evidence was inspected at 375, 768, and 1440 pixels under `preview-renders/dc9-golden-key-finale/owner-polish-*.png`. The optional Browser plugin was unavailable, so repository Playwright was the browser-verification fallback.
- Publication verification rebased the scoped golden-key/DC-9 work onto merged locker PR #44, excluded unpublished Airbus binary/source changes, and passed the complete `npm run test:e2e -- --workers=1` suite 20/20 in 8.2 minutes.
