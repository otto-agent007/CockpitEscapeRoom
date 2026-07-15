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
- [ ] Write and observe failing schema-v8 and seat-role terminology tests.
- [ ] Implement schema v8 and v3-v7 migration with no progress loss.
- [ ] Rebuild and validate the DC-9 FO source/GLB/camera family/route strip.
- [ ] Rebuild and validate the Airbus captain source/GLB/camera/targets.
- [ ] Integrate new assets/copy/help/fallback stills in the browser.
- [ ] Update living contracts and add historical supersession notices.
- [ ] Complete automated and actual-browser validation, current evidence, full-diff review, and Vercel preview.

## Discoveries

- The requested base commit and current HEAD were both `40a1a66`; the dirty pre-migration layer was therefore preservable without rebasing or conflict resolution.
- `.vercel` was the only intentionally excluded untracked directory and is locally ignored through `.git/info/exclude` on the feature branch.
- Baseline unit coverage consists of 57 Vitest tests across state and storage.

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

## Outcome and handoff

In progress. Technical completion will hand off three owner approvals: DC-9 FO view, Airbus captain view, and the complete reordered journey. Any visual mismatch remaining after the bounded repair cycles will be listed here with the exact screenshot, expected reference relationship, observed delta, and attempted repairs.
