# Technical architecture

## Runtime

- Vite for development and production bundling.
- React 19 and TypeScript for UI and game orchestration.
- React Three Fiber as the React renderer for Three.js.
- Three.js for real-time 3D rendering and GLB loading.
- Native HTML for instructions, controls, settings, accessibility, and printable content.
- `localStorage` for versioned, local-only progress.

## Code boundaries

`src/game/` contains pure rules, content, state transitions, persistence schemas, and tests. It must not depend on Three.js.

`src/scenes/` contains 3D presentation and maps stable asset nodes to game actions.

`src/components/` contains native HTML UI and accessible equivalents.

`art-source/blender/` contains editable source files. `public/models/` contains tested deployable GLBs only.

## Asset loading

Load the application shell and initial cinematic art immediately. During the cinematic, preload the DC-9 cockpit and the separate Memphis environment without exposing a landing screen. Fetch the locker, Airbus Pop T Captain cockpit, vehicle reward, and Mars assets only as their stages unlock.

Use stable filenames during development. Before production, consider content-hashed asset URLs or an asset manifest so long-lived browser caches do not serve stale models.

## State

The game uses a pure reducer. Keep game state serializable. Persist only player progress and settings, never Three.js objects, texture references, audio nodes, or DOM state.

The active storage schema is v15 with phases `briefing | dc9 | locker | airbus | reward | mars` and puzzle IDs `dc9 | locker | airbus`. The DC-9 stage vocabulary is `controlCheck | instrumentScan | memphisDeparture | homeOperations | intro | routeRecord | shutdown | qualification | keyReveal | complete`; `intro` is the in-cockpit route-strip handoff, not the opening cinematic. Schema 15 records the control-check → instrument-scan order explicitly, while Memphis persistence stores only durable checkpoints and retry history, never transient frame state.

Keep the existing `cockpit-escape-room:game-state:v1` storage key. Migrations accept supported v3-v14 saves, map legacy captain/first-officer identifiers, add missing chapter fields, normalize completed stages, and write only canonical v15 state. Malformed or incompatible data must fail closed to a safe recoverable point rather than produce a blank screen or grant progress.

## Accessibility

The WebGL canvas is enhancement, not the sole control surface. Every required action has a native button, input, or equivalent list. Status changes use an ARIA live region. Focus should move logically when a puzzle unlocks.

## Performance targets

Initial application JavaScript should remain light because the 3D scene module and production assets load behind the cinematic. Current budgets are recorded in asset reports and enforced by asset validators. Preserve these boundaries:

- Main DC-9 GLB review threshold: 50 MiB maximum, with a lower target preferred.
- Memphis environment, Airbus, locker, and reward assets retain their own validated budgets and load boundaries.
- Texture dimensions justified by camera distance.
- Reasonable draw calls and material counts.
- No continuous animation loop when the scene is static, unless profiling shows the cost is acceptable.
