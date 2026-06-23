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

Load the application shell immediately. Lazy-load Three.js after the player begins. Load Airbus First-Officer assets first, then fetch DC-9, vehicle reward, and Mars assets only when unlocked.

Use stable filenames during development. Before production, consider content-hashed asset URLs or an asset manifest so long-lived browser caches do not serve stale models.

## State

The starter uses a pure reducer. Keep game state serializable. Persist only player progress and settings, never Three.js objects, texture references, audio nodes, or DOM state.

Every storage schema has a version. Add explicit migrations or safely reset when a future schema is incompatible.

## Accessibility

The WebGL canvas is enhancement, not the sole control surface. Every required action has a native button, input, or equivalent list. Status changes use an ARIA live region. Focus should move logically when a puzzle unlocks.

## Performance targets

Initial application JavaScript should remain light because the 3D scene is lazy-loaded. Production targets should be established after the first real DC-9 export, then enforced in the asset report. Start with:

- Main DC-9 GLB review threshold: 50 MiB maximum, with a lower target preferred.
- Airbus and reward assets loaded on demand.
- Texture dimensions justified by camera distance.
- Reasonable draw calls and material counts.
- No continuous animation loop when the scene is static, unless profiling shows the cost is acceptable.
