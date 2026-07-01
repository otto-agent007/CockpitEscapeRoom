# A320 Cockpit 2 Lessons Learned

## Source Review

- The Sketchfab `A320 Cockpit 2` final-render viewer is the best visual authority for this downloaded source candidate after source approval.
- Capture centered 360 evidence from inside the cockpit, preferably between the seats, before deciding what to remove or hide.
- Useful required review angles are front panel/pedestal, down toward seats and pedestal, left sidewall, right sidewall, and overhead panel.
- Inspector captures remain reference evidence only. They do not add license scope, geometry authority, or approval by themselves.

## Assembly

- Do not treat all large shell-like source nodes as disposable. `Object_55` and `Object_56` looked like blockers in some views but preserve cockpit interior, seat, rear bulkhead, and sidewall candidates.
- Keep original source node names in metadata, but rename runtime nodes semantically so later cleanup can find cockpit parts quickly.
- Preserve `game_id`, hierarchy, pivots, source node metadata, UVs, and source texture links through staged exports.
- If a source node is a compound chunk, record that limitation instead of pretending it is cleanly separated. The A320 cockpit still needs future split/remodel work for seats and sidewalls.

## Materials And Render Parity

- Blender's plain glTF import does not match Sketchfab's final render because Sketchfab applies a Studio environment, directional lights, matcap contribution, reflection settings, AO, and post-processing.
- Use no-post-processing as the practical Blender parity target, and keep the final-render screenshot as the visual ceiling.
- Preserve source UVs and texture links; avoid destructive rebake, mesh joining, or flattening until interaction and hierarchy regression checks prove it safe.
- Keep source-parity contact sheets in the report trail so lighting and material changes can be compared against Sketchfab evidence.

## Review Workflow

- For owner review, load the cockpit from a view between the seats facing the front panel. This matches the most useful Sketchfab inspection angle and makes the dashboard, pedestal, seat edges, sidewalls, and overhead relationship easier to judge.
- Bad preview angles are worse than no preview. Remove misleading generated evidence instead of committing it.
- Do not promote the staged A320 GLB to `public/models/**` until browser integration has a separate approval gate.
- The original downloaded archive/import should remain untouched; all cleanup should happen in staged assembly/shading artifacts with manifests and approval records.
