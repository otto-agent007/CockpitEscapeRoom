# Airbus Radio and Thrust Target Alignment Design

## Goal

Move the Airbus A320 Pop T Captain radio drop target farther left onto the intended radio panel and move the thrust drop target farther right so it is centered between the two thrust levers.

## Context

The current production Airbus target positions are authored in `tools/blender/prepare_airbus_captain.py` and exported through the named `AIRBUS_A320_TARGET_*` nodes in `public/models/airbus-captain.glb`. The browser projects each target pivot into screen space, while the matching hitbox supplies mesh-based drop interaction. The current owner-visible baseline is `preview-renders/seat-role-swap/airbus-radio-left-thrust-right-final-candidate-1440.png`.

## Constraints

- Keep the Airbus A320 captain/left-seat camera and all other cockpit targets unchanged.
- Move each complete target contract together: pivot, hitbox, and cue.
- Preserve stable node names, hierarchy, `game_id` metadata, native HTML interaction, keyboard behavior, and save progression.
- Regenerate the deployable GLB through `npm run asset:airbus`; never hand-edit it.
- Add no dependency and make no puzzle, copy, camera, material, or unrelated asset changes.

## Design

Update only the canonical radio and thrust coordinate constants in `tools/blender/prepare_airbus_captain.py`. Calibrate the radio pivot leftward to the visual center of its radio panel and the thrust pivot rightward to the midpoint between the paired thrust levers. Because each hitbox and cue remains attached to its named target pivot contract, browser projection and 3D mesh picking continue to agree.

Strengthen deterministic asset validation so the intended radio and thrust coordinates fail before the source adjustment and pass after the rebuilt GLB is exported. Do not introduce browser-only CSS or React offsets.

## Validation

1. Run the focused asset contract check in its failing state.
2. Rebuild the Airbus source and `public/models/airbus-captain.glb` through the supported asset command.
3. Run `npm run assets:check` and inspect the exported target metadata and coordinates.
4. Load the real GLB in the application, exercise both target interactions, and capture a fresh 1440x900 screenshot with the placed labels visible.
5. Inspect 768 and 375 widths to confirm projection remains attached and usable.
6. Run the focused Airbus browser test, `npm run check` if application or validator code changes, and `git diff --check`.
7. Update the active ExecPlan and `TEST_REPORT.md` only after the owner-visible composition is accepted.

## Done When

- The radio marker is visibly farther left and centered on its intended panel.
- The thrust marker is visibly farther right and centered between the two thrust levers.
- Both 3D drop hitboxes select the same targets as the projected HTML controls.
- The Airbus asset contract and focused browser checks pass with the regenerated GLB.
- A fresh 1440x900 browser screenshot resolves the owner feedback without moving any other cockpit target.
