# DC-9 Yoke Route Record Interaction Design

## Context

The DC-9 Final Flight Log currently exposes a large yellow **Open Legacy Route Record** button in a lower-left prompt panel. The visible route record is not reliably mounted to the first-officer yoke because the deterministic Blender builder references the captain-side yoke nodes and reparents newly positioned route objects before their world matrices are updated. The opened route-record dialog is also forced between fixed top and bottom insets, leaving a large empty area below its content.

This repair remains inside the approved DC-9 first-officer seat-role milestone. It does not change the route puzzle, hints, answers, progress, cameras, chapter order, or safety framing.

## Player-visible behavior

- The narrow Legacy Route Record is centered on the actual first-officer yoke.
- The record itself is the normal pointer and keyboard opener; the large yellow prompt button is removed.
- Hovering the record shows a restrained golden outline. Keyboard focus shows the same treatment.
- Activating the record opens the existing Legacy Route Record dialog and preserves all current route-selection behavior.
- The route-record dialog sizes to its content, subject to a viewport maximum, instead of extending to the bottom status bar. The large unused lower area disappears.
- Closing the dialog returns the player to the same yoke-mounted opener.

## Asset and runtime design

The Blender builder will mount `DC9_PROP_MEM_ROUTE_CARD`, route rows, submit control, and their colliders to the actual first-officer yoke source node. It will update the dependency graph before preserving world transforms during reparenting. The card center will be derived from the first-officer yoke center rather than the captain-side coordinates. Existing route node names, hierarchy intent, `game_id` values, and collider metadata remain stable.

The React layer will project the canonical `dc9.route.card` point into screen space and place one native HTML button over the visible record. The button remains visually transparent at rest, gains a gold border/glow on hover or `:focus-visible`, and retains the accessible name **Open Legacy Route Record**. Canvas raycasting remains supported through the existing route colliders.

If projection is unavailable because the model fails or static fallback is selected, a compact native fallback opener remains available without recreating the large yellow prompt panel.

## Dialog layout

Only `.dc9-route-record` receives content-height sizing. Shared `.dc9-document` behavior remains unchanged for the Home Operations Log. The route dialog keeps its current width, content, two-column route grid, close control, feedback, and submit action. A viewport-relative maximum height and overflow preserve access at narrower heights.

## Verification

- A failing browser test first proves the obsolete yellow prompt is still present, the canonical projected opener is absent, and the route dialog has excessive height.
- An asset-contract assertion first proves the route card is not centered on the first-officer yoke after export.
- Focused green tests prove pointer and keyboard activation, hover/focus styling hooks, fallback access, dialog sizing, and unchanged route completion.
- Rebuild the DC-9 with Blender 5.1.2, validate the GLB, and capture a 1440x900 browser screenshot of the centered record at rest, with the gold hover state, and with the compact dialog open.
- Run focused Playwright coverage, `npm run check`, asset validation, and `git diff --check` before final completion.

## Non-goals

- No route puzzle, wording, answer, hint, persistence, or progression changes.
- No DC-9 camera, yoke geometry, cockpit material, or lighting redesign beyond what is required to make the record legible and centered.
- No Airbus, locker, reward, Mars, or mobile milestone changes.
