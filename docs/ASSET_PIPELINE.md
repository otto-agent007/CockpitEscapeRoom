# Asset pipeline

CockpitEscapeRoom uses a controlled asset flow:

```text
references and owner intent
-> candidate generation when useful
-> Blender import, inspection, cleanup, naming, pivots, optimization
-> GLB export and validation
-> React Three Fiber integration
-> browser, viewport, accessibility, and spoiler checks
```

## Scene groups

Keep generated assets separated by scene group:

- Airbus A320 First-Officer cockpit
- Locker room scene
- DC-9-50 Pop T Captain cockpit
- Model Y hangar reward and Flight Mode sequence
- Mars Easter egg

Do not mix Airbus A320 and DC-9-50 aircraft-specific details. DC-9-51 reference material may be used only as labeled compatibility material.

## Export and integration

Production exports continue to use the repository asset commands until a dedicated asset-path PR renames files and roots together:

```bash
npm run asset:dc9
npm run asset:airbus
npm run asset:tesla
npm run assets:check
```

React integration should consume only documented asset contracts and must provide native HTML or equivalent accessible controls for required 3D interactions.

Model Y spoiler protection still applies: no Model Y asset, thumbnail, loading copy, menu entry, early achievement, or hint may reveal the reward before Pop T Captain Mode is complete.

## Ownership and branch boundaries

Keep Windows and Ubuntu work on separate branches. Do not place Windows and Ubuntu work on the same branch at the same time.

- Ubuntu owns `art-source/**`, `tools/blender/**`, `public/models/**`, `asset-reports/**`, and `preview-renders/**`.
- Windows owns `src/**`, `tests/**`, `e2e/**`, `.github/**`, `package.json`, `AGENTS.md`, and `TEST_REPORT.md`.

Docs may describe the contract across both sides, but implementation commits must respect the path ownership model in `docs/WORKSTREAM_OWNERSHIP.md`.

## Execution loop

For asset workflow changes, repeat:

**orient -> plan -> implement a small checkpoint -> validate -> inspect in Blender or the browser -> review the diff -> repair -> record evidence -> repeat**

Do not claim asset approval from source code alone.
