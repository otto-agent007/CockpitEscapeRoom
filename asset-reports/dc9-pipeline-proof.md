# DC-9-32 First-Officer seat-role migration

Date: 2026-07-15

- Authoritative source: `art-source/blender/dc9_master.blend`; deployable output: `public/models/dc9-cockpit.glb`.
- Blender 5.1.2 rebuilt and validated the source with zero scene errors or warnings.
- Canonical cameras: `CAM_DC9_FIRST_OFFICER_GAME`, `CAM_DC9_FIRST_OFFICER_APPROVAL`, and first-officer main-panel, overhead, route, and pedestal approval cameras.
- The route strip, row colliders, and submit collider are parented to the actual first-officer yoke while their route/shutdown `game_id` values remain stable.
- Deprecated captain game/approval cameras remain compatibility-only nodes with replacement metadata.
- Current GLB: 30,338,056 bytes; SHA-256 `501e1bb65a7e025125edd26cba31aa7775cdf4c39e3a1c1e2efaf42ddc62635d`; 656 selected export objects; 11 interactive contract objects; 8 materials and 5 textures; no destructive optimization.
- Current approval still: `public/images/dc9-game-ready-first-officer.png`; SHA-256 `3ab21e6985c90e05d6ff1dc9097e60896fe101e4e78e1095adaaac76e6ff65ef`.
- Browser visual evidence and the reopened owner gate are recorded in `plans/0013-dc9-fo-airbus-captain-seat-swap.md` and `TEST_REPORT.md`.

> **Seat-role supersession notice (2026-07-15):** This historical record preserves the then-current DC-9 captain / A320 first-officer assignment. The active production contract now uses DC-9 first-officer/right-seat and Airbus A320 Pop T captain/left-seat roles. Historical evidence below is unchanged.

# DC-9-32 Pop T Captain production-pass report

Date: 2026-07-13

## Outcome

The owner-cleared Roger2009 DC-9-32 is now the exact geometry and texture target for Pop T Captain Mode. The deployable cockpit is a deterministic OBJ8-derived build with semantic APU-bus, APU-master, and battery pivots; enlarged invisible colliders; a six-row MEM route-card prop; route-card, captain, panel, overhead, and pedestal cameras; and stable glTF extras consumed by the browser registry.

The browser experience is full-screen and cockpit-only. Route selection comes first, then the saved overhead view presents the parked-cockpit secure sequence. Real mesh raycasting and projected native buttons share the same IDs. The old Captain sidebar and floating proxy switches are absent. The `GREYBOX — DC-9 CAPTAIN FLOW` label remains pending owner review.

## Authority and permitted use

- Exact asset authority: cleared Roger2009 DC-9-32 donor retained outside the repository source cache; only derived project `.blend` and GLB outputs are checked in.
- Procedure authority: the FAA-approved DC-9 normal checklist, Appendix D. Only checklist evidence is used; the surrounding accident narrative is excluded from product copy.
- Route-card authority: Northwest Airlines timetable dated June 1, 1995. The card shows BTR 319, STL 256, TYS 342, LAX 1619, SEA 1870, and AMS 4544 miles from MEM; BTR/STL/TYS are the verified short DC9 routes.
- Control-location support: the supplied Roger2009 procedure guide and Reflected Reality video. These are location/appearance references, not sole procedure authority, and their downloaded bytes are not committed.
- DC-9-51 references are retained only for compatible Northwest-era color, wear, and atmosphere.

The manifest and `.url` trail record source URL, capture date, checksum, authority level, and usage limits.

## Deterministic asset contract

Build command:

```bash
BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:dc9
```

- Blender: 5.1.2.
- Builder: `tools/blender/build_dc9_production.py`.
- Interaction map: `art-source/blender/dc9_interaction_map.json`.
- Parked state: `art-source/blender/dc9_parked_neutral_pose.json`.
- Master: `art-source/blender/dc9_master.blend`.
- Output: `public/models/dc9-cockpit.glb`.
- GLB: 30,336,864 bytes (28.93 MiB), SHA-256 `1ecde9d5ebeab587269355f0b75b7585c4b74f74edd5e5a36c4c77f4660dce7c`.
- Export selection: 654 objects; 620 meshes; 220,259 uploaded vertices; 236,826 triangles; 8 materials; 5 textures; 6 cameras.
- Stable `game_id` nodes: 11 (three secure controls, route-card parent, six rows, and submit).
- Scene validation: passed with zero errors and zero warnings.
- glTF validation: zero errors and zero warnings. Informational unused collider UV rows remain.
- No Draco, mesh joining, hierarchy flattening, or destructive GLB optimization was applied.

Stable groups include `DC9_ROOT`, `DC9_STATIC`, `DC9_INSTRUMENTS`, `DC9_INTERACTIVE`, `DC9_COLLIDERS`, `DC9_PUZZLE_PROPS`, `DC9_LOCATORS`, and `DC9_EMISSIVE`. Selected OBJ8 draw ranges are excluded from `DC9_STATIC` and re-imported only beneath the semantic controls, preventing duplicate visible geometry.

The source parser preserves nested animation channels, datarefs, key values, pivots, manipulators, and draw-range ownership. Runtime tweening uses the exported semantic pivots; reduced-motion mode snaps directly to the authored target angle.

## Material and presentation decisions

- Preserved donor UVs and readable native labels.
- Normalized embedded PNG profiles and corrected the washed olive cast without repainting uncleared art.
- Retained localized wear while balancing roughness, glass response, and restrained instrument illumination.
- Kept the 4096 panel atlas and four smaller donor textures because the result fits the approved 30 MiB cap. The 4K atlas remains the first later optimization candidate.
- Kept colliders as discrete hierarchy nodes and converted them to invisible, non-rendering runtime materials.

## Browser and accessibility proof

- Route stage uses `CAM_DC9_ROUTE_CARD_APPROVAL` at 50 degrees on desktop and 60 degrees on narrow screens. The latest owner-supplied video screenshot is the placement reference: the 0.10 by 0.30 scene-unit strip is clipped to the pilot-facing center pad of the captain yoke rather than floating behind it. The seated cameras are lowered from z=0.90 to z=0.82, and the constrained look range now allows about 41 degrees to the right versus 17 degrees left so the player can inspect the center pedestal, first-officer panel/yoke, and right window. Secure stage uses `CAM_DC9_OVERHEAD_APPROVAL`; reward/Mars return to `CAM_DC9_CAPTAIN_GAME`.
- A strict load registry rejects missing required nodes and duplicate IDs.
- Pointer drag has a movement threshold so camera orbit cannot activate a trailing route-card click.
- `R` restores the stage camera. Mouse and touch use real colliders; keyboard and screen-reader users receive equivalent native buttons.
- Model failure keeps the compact full-screen Captain shell and native controls over the static fallback. It does not restore the old sidebar or proxy switches.
- Wrong route submission clears only the current selections. Wrong secure input resets only the three powered controls. Reload preserves the active stage. Battery-off unlocks the reward.

Inspected browser evidence:

- `preview-renders/cockpit-pipeline/dc9-captain-browser/captain-game-view-1440.png`
- `preview-renders/cockpit-pipeline/dc9-captain-browser/captain-game-view-768.png`
- `preview-renders/cockpit-pipeline/dc9-captain-browser/captain-game-view-375.png`
- `preview-renders/cockpit-pipeline/dc9-captain-browser/route-card-1440.png`
- `preview-renders/cockpit-pipeline/dc9-captain-browser/right-look-1440.png`
- `preview-renders/cockpit-pipeline/dc9-captain-browser/overhead-procedure-1440.png`
- `preview-renders/cockpit-pipeline/dc9-captain-browser/battery-off-reward-1440.png`
- `preview-renders/dc9-captain-approval.png`
- `.cache/assets/dc9/previews/cam_dc9_{main_panel,overhead,pedestal,route_card}_approval.png`

There is no horizontal document overflow at 375, 768, or 1440 px. A fresh browser load reported no console errors; the only console warning is Three.js's upstream `Clock` deprecation notice.

## Validation evidence

- `python3 -m unittest discover -s tools/blender/cockpit_pipeline/tests -p 'test_*.py'`: 16/16 passed.
- `npm run test`: 47/47 passed, including route gating, resets, hints, corrupt saves, and schema-v5 migration.
- `npm run check`: passed (lint, types, unit tests, production build).
- `npm run assets:check`: passed; DC-9 has no validator errors or warnings. Existing locker tangent warnings are outside this pass.
- `npm run pipeline:evals`: 6/6 passed.
- `npm run asset:dc9`: passed end to end.
- Focused real-GLB and fallback Playwright results are recorded in `TEST_REPORT.md`.
- `npm run test:e2e -- --workers=1` passed all 14 Chromium cases in 6.6 minutes, including both DC-9 cases and the merged locker checkpoint's real-GLB flow.
- `npm run references:check` rebuilt the DC-9 reference scene but the aggregate check remains red because three unrelated locker images are not manifested.
- Vercel preview `dpl_6y1qkjBCL9HLVpadmHqs81Jq2NGz` is Ready at `https://cockpit-escape-room-9amnfa4zy-ottoagent007-gmailcoms-projects.vercel.app`. Authenticated `vercel curl` returned the exact 30,336,864-byte GLB with SHA-256 `1ecde9d5ebeab587269355f0b75b7585c4b74f74edd5e5a36c4c77f4660dce7c`, matching the promoted local file.

## Gate and remaining delta

The owner approved this polished greybox checkpoint for PR publication on 2026-07-13 while noting that substantial cockpit work remains. This is not approval to call the asset production-ready, so the greybox badge stays. No engine start, taxi, takeoff, or flight procedure is represented. The donor's legacy texture resolution and dense draw-range hierarchy are known tradeoffs; optimization remains deferred until the later production-ready gate.
