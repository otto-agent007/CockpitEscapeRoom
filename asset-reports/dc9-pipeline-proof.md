# DC-9-32 right-seat flight-deck animation contract

Date: 2026-08-19

## Outcome

The parked DC-9 right seat is now hands-on. The first-officer control column, control
wheel, both thrust levers and both pairs of rudder pedals move under the player, and each
first-officer instrument can run its needle through a power-on self-test. No geometry was
added and `public/models/dc9-cockpit.glb` is byte-for-byte unchanged.

## Why no rebuild

The deployed GLB already exposes every donor draw range as its own named node - 659 nodes,
including all 460 `OBJ8_DC9-32_COCKPIT_RANGE_*` panel ranges and all 129
`OBJ8_DC9VC2_RANGE_*` cockpit ranges. What the GLB lacks is pivots, because the OBJ8
import bakes each range in place. Those pivots still exist in the cleared donor source, so
they were measured out of it and are reconstructed at runtime as groups inserted directly
above the named nodes.

Rebuilding instead would have produced a new 36 MiB binary, invalidated the recorded
SHA-256, and reopened an owner-gated asset for no player-visible gain. The measurements
are recorded in `art-source/blender/dc9_interaction_map.json` under `flightDeck` so a
future rebuild can promote them to authored Blender pivots without changing a value.

## Coordinate proof

The donor parser reports pivots in Blender space `(x, -z, y)` and axes in X-Plane space.
Measured against the shipped GLB, glTF equals raw X-Plane space: `glTF = (bx, bz, -by)`.
Verified on seven nodes to three decimal places - `OBJ8_DC9VC2_RANGE_014`, `_015`, `_007`,
`_009`, `_017`, and `OBJ8_DC9-32_COCKPIT_RANGE_129`, `_151` - every component matched. No
node in any of those parent chains carries a rotation, scale or matrix, which
`tools/assets/dc9-flight-deck-contract.mjs` re-checks on every `npm run assets:check`.

## Measured contract

| Control | Nodes | Pivot (glTF) | Axis | Donor travel |
| --- | --- | --- | --- | --- |
| FO yoke column pitch | `RANGE_014`, `RANGE_015` | `0.59298, -0.289439, 2.56786` | `1,0,0` | -1 to -10 deg, +1 to +15 deg |
| FO yoke wheel roll | `RANGE_015` | `0.497686, 0.316071, 2.605478` | `0,0,1` | -1 to +90 deg, +1 to -90 deg |
| Captain yoke (linked) | `RANGE_012`, `RANGE_013` | `-0.579981, -0.289439, 2.56786` | `1,0,0` | as above |
| Thrust lever 1 | `RANGE_009`, `RANGE_010` | `-0.026399, 0.137043, 2.67068` | `1,0,0` | 0 to 0 deg, 1 to -55 deg |
| Thrust lever 2 | `RANGE_006/007/008` | `-0.021248, 0.137043, 2.67068` | `1,0,0` | as above |
| Rudder pedals | `RANGE_017/018/020/021` | translation | `0,0,1` | 0.160003 m total, opposed |

Instruments: airspeed `RANGE_151`, ADI `RANGE_129`/`131`, altimeter `RANGE_166`/`164`,
HSI `RANGE_108`/`109`, VSI `RANGE_099`, EPR `RANGE_037`/`055`, each with its own pivot,
axis and calibrated key table.

The GLB is baked at `art-source/blender/dc9_parked_neutral_pose.json`, where every dataref
above is zero, so all runtime motion is applied relative to that pose. Two consequences
are worth recording because they look like bugs and are not: the yoke's -10/+15 table
means ratio 0 already carries +2.5 deg, so relative travel is a symmetric +/-12.5 deg; and
the pedals sit at mid-travel, so each moves +/-0.080 m for 0.160 m of total sweep.

## Range semantics

Donor channels come in two forms and must be treated differently. A two-key `ANIM_rotate`
is a linear map that keeps going past its samples - the attitude ball is authored as
`-1 deg -> -1 deg, +1 deg -> +1 deg` and means 1:1 - while a multi-key
`ANIM_rotate_begin` table is a calibrated dial face that holds against its stops.
Clamping both, as the first implementation did, capped a twenty-degree ADI roll at one
degree and a ninety-degree HSI card sweep at zero. Each joint now carries an explicit
`range` and the unit suite asserts that every self-test produces real needle travel.

## Browser evidence

Production build, real 36 MiB GLB, 1440x900. Model state `ready`, 18 interaction targets
registered (12 existing plus the six new `dc9.gauge.*`).

- Control sweep: every control moved measurably against the neutral frame - column
  69,545 px, wheel 35,218 px, pedals 9,815 px, levers 11,506 px - and all eight checklist
  items latched, ending with the route strip revealed.
- Gauge projection: the six click targets land on the first-officer basic-T at
  airspeed 548,295 / ADI 644,253 / altimeter 742,305 / HSI 645,373 / VSI 817,305, with
  the EPR pair at 180,203 on the centre engine stack.
- Self-test: with the HTML overlay hidden, the ADI changed 532 px at the top of its
  excursion and returned to **exactly 0 px** difference from its parked frame, proving
  both that the needle moves and that the baked-pose arithmetic leaves no drift.

# DC-9-32 First-Officer seat-role migration

Date: 2026-07-15

- Authoritative source: `art-source/blender/dc9_master.blend`; deployable output: `public/models/dc9-cockpit.glb`.
- Blender 5.1.2 rebuilt and validated the source with zero scene errors or warnings.
- Canonical cameras: `CAM_DC9_FIRST_OFFICER_GAME`, `CAM_DC9_FIRST_OFFICER_APPROVAL`, and first-officer main-panel, overhead, route, and pedestal approval cameras.
- The compact 0.10 by 0.15 route strip, row colliders, and submit collider are centered on and parented to the actual first-officer yoke while their route/shutdown `game_id` values remain stable.
- The owner-supplied Tripo golden key is staged on the right-side green ledge with `DC9_PROP_CAPTAINS_KEY`, `DC9_PROP_CAPTAINS_KEY_MESH`, `DC9_HITBOX_CAPTAINS_KEY`, and `dc9.key.open` contracts. Its preserved-source and optimization evidence is in `asset-reports/dc9-golden-key-intake.json`.
- Deprecated captain game/approval cameras remain compatibility-only nodes with replacement metadata.
- Current GLB: 36,050,728 bytes (34.38 MiB); SHA-256 `ddc7fa6a75f075666e983b17c89008728b419069030ed23c654919cd262802e3`; 659 selected export objects; 12 interactive contract objects; 267,701 uploaded vertices and 926,514 rendered triangles; no hierarchy flattening or destructive whole-scene optimization.
- Key optimization: 498,186 source triangles to 72,000 runtime triangles; one material; BaseColor, normal, and metallic-roughness maps reduced from 4096 to 1024 pixels; MikkTSpace tangents generated only for the key mesh. The deployed 1024px celebration render is 622,864 bytes with SHA-256 `81ac311deabdbf7fab4da976c2dc0e3febdd60ae605a514f9459eb4d32d44983`.
- Current approval still: `public/images/dc9-game-ready-first-officer.png`; SHA-256 `3ab21e6985c90e05d6ff1dc9097e60896fe101e4e78e1095adaaac76e6ff65ef`.
- Browser visual evidence and the reopened owner gate are recorded in `plans/0013-dc9-fo-airbus-captain-seat-swap.md` and `TEST_REPORT.md`.

## Golden-key finale browser proof

- Initial 1440x900 first-officer view keeps the entire key outside the right edge and displays passive `>>>` chevrons. A manual rightward drag moves the real key and its projected native hit target into the center-right ledge view; the cue then disappears.
- The key celebration reuses the milestone dialog, keyboard focus trap, 24-piece confetti treatment, and reduced-motion no-confetti behavior without the prior engraving or Momma Cheryl copy.
- Claiming the key preserves the DC-9 phase through the 900ms fade. `CLAIM_CAPTAINS_KEY` commits only at the full-black boundary, then the existing locker title and watch-first reveal continue.
- The Home Operations Log retains all five pages but now uses a compact dark-green cockpit record: 416px tall at 1440 and 768 widths, and 439px at 375x812 with its former empty lower region removed.
- Inspected durable actual-browser screenshots under `preview-renders/dc9-golden-key-finale/`: key discovery, right-scan reveal, celebration, fade-to-locker, route-card centering, and Home Operations captures at 1440, 768, and 375 pixels.

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
