# Airbus A320 Storm Line simulator asset report

## Authority and scope

- Scene group: Airbus A320 Pop T Captain cockpit
- Authoritative Blender source: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`
- Deployable model: `public/models/airbus-captain.glb`
- Blender: 5.1.2
- Runtime contract version: 1
- Scope excludes all Model Y, Flight Mode, reward, and Mars assets.

## Runtime additions

The preparation script adds three non-destructive overlay planes without replacing imported panel materials:

- `AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE` — `airbus.sim.display.pfd`
- `AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE` — `airbus.sim.display.nd`
- `AIRBUS_A320_DISPLAY_UPPER_ECAM_SURFACE` — `airbus.sim.display.ecam`

The planes receive browser-generated CanvasTextures. Native HTML mirrors expose the same pitch, bank, energy, weather, corridor, and paired-thrust information.

The script also adds stable physical-control pivots:

- `AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_ROLL_PIVOT`
- `AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_PITCH_PIVOT`
- `AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT`

The sidestick contains source meshes 083, 084, 086, and 087. The paired-thrust pivot contains source mesh 078. World transforms are preserved while reparenting, and the existing five familiarization target positions remain unchanged.

## Export and validation

- GLB size: 39,884,100 bytes
- GLB SHA-256: `0a6c8aeb1e1fdbfc85db01becb812ca0c3b7810208d03fba65f26c4fa4306251`
- Selected export objects: 164
- `game_id` nodes: 163
- Materials: 13
- Embedded textures: 10
- Destructive optimization: none
- glTF validation: no errors or warnings
- Blender source validation: passed with the existing imported-source scale/metadata notices
- Asset contract: all three displays, both nested sidestick pivots, the paired-thrust pivot, and the raised Storm Flight camera export their approved names and metadata

The browser cache key is `storm-flight-0a6c8aeb`, bound to the accepted GLB hash.

## Browser proof

The production-GLB Playwright gates fetched the runtime model with `cache: no-store`, matched all 39,884,100 bytes to disk, observed all seven simulator nodes, and recorded no console errors. Focused Chromium evidence passed on 2026-07-31: A320 loading/placement in 1.5 minutes, Engine-Out live displays/control response in 2.5 minutes, ND/ECAM mesh interaction and drag rejection in 2.6 minutes, and Storm Line live displays/controls/responsive views in 4.5 minutes.

Inspected actual-browser captures:

- `preview-renders/storm-line/airbus-pfd-triangle-fixed-1440.png`
- `preview-renders/storm-line/airbus-storm-line-768.png`
- `preview-renders/storm-line/airbus-storm-line-375.png`

The final 1440 frame shows the raised view without the rudder pedals and with the corrected PFD marker. The PFD, ND, and upper ECAM remain visible in the functional 768 and 375 evidence; the 375 px layout moves viewer tools above the control deck so neither paired-thrust button is blocked.

## Known limitations and review delta

- The current cockpit remains a playable-proof greybox pending owner approval.
- The thrust geometry moves as one paired control. Independent lever splitting is intentionally deferred.
- Instrument symbology and physics are fictional arcade feedback, not operational A320 training data.
- Storm visuals are procedural browser presentation; the safely parked commemorative aircraft and source cockpit are not framed as experiencing a real emergency.
