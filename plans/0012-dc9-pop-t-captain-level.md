# DC-9-32 Pop T Captain Production Pass

> **Seat-role supersession notice (2026-07-15):** This historical record preserves the then-current DC-9 captain / A320 first-officer assignment. The active production contract now uses DC-9 first-officer/right-seat and Airbus A320 Pop T captain/left-seat roles. Historical evidence below is unchanged.


## Purpose

Make the owner-cleared Roger2009 DC-9-32 the exact Pop T Captain production target. The player sees a full-screen, cockpit-only legacy challenge: verify three short MEM routes, then secure the safely parked cockpit by switching the APU buses off, the APU master off, and the battery off. Battery-off releases the hangar reward.

## Current state

The cleared Roger2009 archive is preserved under `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/`, and `tools/blender/build_dc9_production.py` deterministically builds the 28.93 MiB DC-9-32 production candidate. The GLB exports 11 stable `game_id` nodes, three semantic control pivots, enlarged colliders, a narrow six-row MEM strip clipped to the pilot-facing captain-yoke pad, and saved route/captain/overhead cameras. Captain Mode is route-first and full-screen with schema-v6 persistence, real mesh picking, projected native controls, and compact failure fallback. The asset remains greybox pending owner visual approval.

`plans/0011-dc9-50-captain-view-proof.md` is historical evidence for the donor intake and browser repair. Its DC-9-50 target decision is superseded by this owner-directed DC-9-32 production pass.

## Scope

Included: exact DC-9-32 product/reference authority, OBJ8 animation/manipulator ownership, APU/battery semantic controls and colliders, six-row MEM route prop, full-screen Captain UI, direct mesh and projected native controls, schema-v6 persistence/migration, accessible model/WebGL fallback, tests, real browser evidence, and living reports.

Excluded: engine start, taxi, takeoff, flight training, changes to Airbus/locker/reward/Mars behavior beyond the normal Captain-to-reward transition, destructive GLB optimization, removal of the greybox label before owner approval, and committing downloaded video/PDF/frame evidence.

## Context and constraints

- Goal: a player can complete route-first DC-9-32 Captain Mode entirely by mouse, keyboard, or assistive controls and reach the existing reward without losing prior progress on mistakes or reload.
- Context: Roger2009 DC-9-32 donor, FAA-approved Appendix D checklist, June 1 1995 Northwest timetable, and the current saved captain camera.
- Constraints: safely parked ceremonial framing; non-operational interaction; no new production dependency; stable GLB hierarchy/extras; <= 30 MiB unless owner-approved; preserve unrelated locker work.
- Done when: focused parser/reducer/storage/browser checks pass, the real GLB exposes the strict runtime registry, and 375/768/1440 browser proof is inspected with the greybox approval gate still explicit.

## Progress

- [x] 2026-07-13 — Re-oriented from the deferred plan, dirty worktree, source archive, donor build, and current browser flow.
- [x] 2026-07-13 — Verified procedure and route authorities: Appendix D termination order and the six June 1995 MEM mileages.
- [x] 2026-07-13 — Preserved OBJ8 nested channel, key, pivot, manipulator, and draw ownership; extracted selected donor ranges without static duplicates.
- [x] 2026-07-13 — Exported semantic controls, enlarged colliders, route-card rows, submit area, metadata, and approval cameras.
- [x] 2026-07-13 — Implemented schema-v6 route-first reducer/storage behavior and version-5 migration.
- [x] 2026-07-13 — Replaced the Captain sidebar/proxies with the full-screen shell, direct mesh picking, projected native controls, and compact accessible fallback.
- [x] 2026-07-13 — Ran asset, parser, reducer/storage, lint/type/build, browser, and visual checks; recorded the remaining unrelated reference-check error and owner gate.
- [x] 2026-07-13 — Published Vercel preview `dpl_5wTxJuBhzYgQqTLzTCKa9dGo45Ka` and verified the served GLB byte-for-byte; stopped at owner visual approval.
- [x] 2026-07-13 — Repaired the owner-rejected oversized route step: reduced the authored card to clipboard scale, moved it to the captain's yoke, and switched route entry to a dedicated close camera while retaining cockpit context.
- [x] 2026-07-13 — Inspected the repaired yoke-card composition at 375/768/1440, passed focused mesh/keyboard/fallback browser tests, and published byte-matched preview `dpl_JBJ3wyHWb4sEfsb8ZWSxm1fqKbrv`.
- [x] 2026-07-13 — Repaired the second owner-rejected placement against the latest video screenshot: measured the donor yoke meshes, moved and narrowed the strip onto the pilot-facing center pad, lowered the seated camera, and expanded rightward look travel.
- [x] 2026-07-13 — Re-inspected the initial and dragged-right compositions at 375/768/1440, passed the focused real-GLB/fallback browser checks, and published byte-matched preview `dpl_6y1qkjBCL9HLVpadmHqs81Jq2NGz`.
- [x] 2026-07-13 — Owner approved the current DC-9 cockpit checkpoint for PR publication. The greybox label remains because this is approval to continue from the present milestone, not a claim that all cockpit work is finished.

## Discoveries

- Appendix D of the FAA-approved checklist lists termination controls in this order: APU bus switches, APU master, fuel boost pumps, battery. Fuel boost pumps are modeled as an already-off precondition, leaving the three player actions requested by the owner.
- The June 1 1995 Northwest timetable lists MEM mileages: BTR 319, STL 256, TYS 342, LAX 1619, SEA 1870, AMS 4544. BTR, STL, and TYS have `DC9` entries from MEM.
- Donor OBJ8 ranges around offsets 212094-214134 contain the APU starter, battery, and paired APU generator controls. The existing converter bakes their transforms but discards ownership metadata.
- Superseded baseline GLB: 26,742,512 bytes with zero exported `game_id` nodes; the current evidence section records the rebuilt production candidate.
- Camera-orbit proof exposed a trailing-click bug that selected a route row after a drag. A six-pixel movement threshold now suppresses that click without affecting deliberate mesh activation.
- The secure stage initially retained the captain camera and fell back to generic button positions. Switching to the authored overhead camera makes all three controls visible and projects native buttons directly onto their colliders.
- The first route prop measured 0.58 by 0.78 scene units and filled the captain view. The first repair's 0.26 by 0.34 clipboard was still behind and too broad for the actual yoke pad; that intermediate placement is superseded by the measured strip below.
- Donor range `OBJ8_DC9VC2_RANGE_012` is the captain yoke column/center pad and its pilot-facing surface is near y=-2.754; range `013` is the handle. Mounting the 0.10 by 0.30 strip at y=-2.775 places it on the visible face instead of behind the yoke geometry.
- Browser drag proof exposed a reversed asymmetric-yaw clamp: negative runtime yaw is the rightward look. The corrected limits allow about 41 degrees right and 17 degrees left, revealing the center pedestal, first-officer panel/yoke, and right window without permitting an unrestricted orbit.

## Decision log

- 2026-07-13 — Roger2009 DC-9-32 is production geometry/texture authority; DC-9-51 material remains compatible Northwest-era color/wear atmosphere only.
- 2026-07-13 — Use BTR/STL/TYS as the verified route answer. Show all six period mileages so the puzzle is observable reasoning rather than trivia.
- 2026-07-13 — Use initial APU buses on, APU master run, battery on, parking brake set, and fuel pumps off. Wrong secure actions reset only these three controls.
- 2026-07-13 — Keep the asset labeled greybox/owner-review candidate until the owner approves browser proof.
- 2026-07-13 — Use the dedicated yoke-focused route camera for the route card, the authored overhead camera for the secure stage, and the captain camera after completion; `R` resets whichever stage is active.
- 2026-07-13 — Preserve the 4K panel atlas for this gate because the complete GLB remains below 30 MiB; defer destructive texture/hierarchy optimization.
- 2026-07-13 — Treat the latest owner-supplied video screenshot as placement authority for the yoke strip: use the measured center-pad face, lower the captain eye from z=0.90 to z=0.82, and keep the wider look deliberately right-biased.

## Milestones

### Source and runtime contract

The converter reports nested channels, keys, pivots, manipulators, and draw ownership. Selected donor ranges live only under `DC9_INTERACTIVE`; colliders and route-card targets expose stable extras.

### Route-first gameplay and persistence

The route set gates the shutdown sequence. Wrong routes clear only selections; wrong shutdown actions reset only that attempt. Schema-v5 completion/reward/Mars data migrates without loss while in-progress Captain saves restart at route verification.

### Full-screen browser experience

Captain Mode has no sidebar. A minimal top line and bottom status dock leave the cockpit dominant. Mesh clicks and projected native controls share one registry, resize correctly, show focus labels only when needed, and degrade to compact controls over a static cockpit view.

### Visual gate

The actual promoted GLB is exercised at 375, 768, and 1440 widths with captain, route-card, overhead, and battery-off evidence. The Vercel/owner approval delta remains explicit.

## Implementation steps

1. Update active guidance, manifests, authority reports, and player copy to DC-9-32; mark earlier DC-9-50 decisions superseded.
2. Extend `xplane_obj8_convert.py` and its importer/tests for channel/manipulator/draw ownership and selected-range exclusion.
3. Update `build_dc9_production.py` and parked pose; rebuild `dc9_master.blend` and `dc9-cockpit.glb` with stable interactive metadata, colliders, route prop, and cameras.
4. Move Captain definitions into `dc9LegacyFlow`; revise reducer/storage/tests for schema 6 and migration.
5. Add strict GLB registry, raycasting, animation, projection, fallback, and the full-screen Captain HUD.
6. Add focused browser coverage, run the complete validation matrix, inspect screenshots, update `asset-reports/dc9-pipeline-proof.md` and `TEST_REPORT.md`.

## Validation plan

Run parser unit tests, `npm run references:check`, `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:dc9`, `npm run assets:check`, `npm run pipeline:evals`, focused Vitest/Playwright, `npm run check`, `npm run test:e2e`, and `git diff --check`. Exercise correct/wrong/repeated-wrong/hint/reload/reduced-motion/keyboard/resize/WebGL-or-model-fallback paths and compare served GLB bytes with disk.

## Acceptance criteria

- Product guidance and live metadata name DC-9-32; older target claims are explicitly historical/superseded.
- Six route rows show code, city, and period mileage; BTR/STL/TYS verify and unlock shutdown.
- The secure order is APU buses -> APU master -> battery; battery-off completes Captain Mode.
- Every action works through real 3D colliders and native controls; missing contracts use compact accessible fallback without old proxies/sidebar.
- Version-5 completed reward/Mars saves survive migration; in-progress Captain saves restart at route verification.
- GLB stays <= 30 MiB, validates, has no duplicate game IDs, and browser proof has no console errors.
- The owner-approved PR checkpoint and Vercel preview are recorded. Keep the greybox label until the owner explicitly approves production-ready status after the remaining cockpit work.

## Repair loop and stop conditions

Repeat focused implementation -> focused checks -> browser exercise -> screenshot inspection -> full-diff review. Allow up to three repair passes per failing boundary. Stop when checks pass, the delta stops shrinking, or owner visual approval is required.

## Evidence

- GLB: 30,336,864 bytes (28.93 MiB), SHA-256 `1ecde9d5ebeab587269355f0b75b7585c4b74f74edd5e5a36c4c77f4660dce7c`; 654 selected objects, 620 meshes, 220,259 uploaded vertices, 236,826 triangles, 8 materials, 5 textures, and 11 `game_id` nodes.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:dc9`: passed; scene validation 0 errors/0 warnings and glTF validation 0 errors/0 warnings.
- Cockpit-pipeline Python discovery: 16/16 passed. Vitest: 47/47 passed. `npm run check`: passed. `npm run assets:check`: passed. `npm run pipeline:evals`: 6/6 passed.
- Browser: real BTR collider click, route keyboard controls, rightward camera move/reset, secure overhead projection, compact model-failure fallback, reward transition, and 375/768/1440 layouts exercised. The card stayed attached to the yoke in the initial and dragged views. Fresh-load console had no errors.
- Playwright: focused DC-9 real-GLB/fallback 2/2 passed; `npm run test:e2e -- --workers=1` passed all 14 Chromium cases in 6.6 minutes after the merged locker checkpoint.
- Screenshots: `preview-renders/cockpit-pipeline/dc9-captain-browser/` plus the five `.cache/assets/dc9/previews/` approval views.
- `npm run references:check`: DC-9 scene/render generation passed, but the aggregate command reports three unrelated unmanifested locker photos.
- Preview: `https://cockpit-escape-room-9amnfa4zy-ottoagent007-gmailcoms-projects.vercel.app` is Ready. Authenticated `vercel curl` returned 30,336,864 bytes and the same `1ecde9d5…` SHA-256 as local.

## Outcome and handoff

Implementation, local verification, preview publication, served-byte proof, and owner approval for this PR checkpoint are complete. The cockpit remains a polished greybox work in progress; this approval permits the milestone PR but does not authorize removing the badge or calling the asset production-ready.
