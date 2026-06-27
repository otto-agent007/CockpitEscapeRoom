# Asset pipeline

CockpitEscapeRoom uses a controlled asset flow:

```text
references and owner intent
-> reference authority gate
-> Tripo AI candidate generation when useful
-> Blender import, inspection, cleanup, naming, pivots, optimization
-> official Blender MCP inspection or controlled edits when useful
-> GLB export and validation
-> React Three Fiber integration
-> browser, viewport, accessibility, and spoiler checks
```

Tripo AI and Blender MCP are production aids. They are not story canon, visual approval authority, or replacements for aircraft-specific references.

## Pipeline gates

Asset work moves through explicit gates:

1. **Reference Authority:** define the target scene group, aircraft/object identity, variant status, allowed source usage, forbidden usage, licensing/private-use limits, and owner approval state.
2. **Sourcing:** discover or generate candidates, including Tripo proxies, with selected and rejected options documented.
3. **Assembly:** import approved candidates into Blender, repair pivots, assign stable names, preserve hierarchy, and publish a runtime contract checklist.
4. **Materials and Optimization:** apply materials, bake textures where useful, record material counts and texture sizes, and optimize only when runtime contracts still pass.
5. **Windows/browser integration:** load the approved GLB in React, verify node names and `game_id` metadata, test HTML-accessible equivalents, capture viewport screenshots, and rerun relevant app checks.

No gate may approve its own work. Completion means evidence is ready for the next gate; approval requires the recorded owner or receiving-workstream decision.

## Scene groups

Keep generated assets separated by scene group:

- Airbus A320 First-Officer cockpit
- Locker room scene
- DC-9 Pop T Captain cockpit
- Model Y hangar reward
- Mars Easter egg

Do not mix Airbus and DC-9 aircraft-specific details. The Airbus cockpit must remain a separate model-specific asset, and the DC-9 cockpit must stay model-correct in major visible geometry. Tripo-generated parts may help explore shape, scale, or prop options, but they may not silently override approved aircraft reference boards.

## Tripo AI candidate rules

Tripo outputs are candidates or proxies until inspected, cleaned, optimized, and approved.

Before any Tripo-generated asset reaches runtime use:

1. Import it into the relevant Blender master or staging file.
2. Place it under the correct scene group and root hierarchy.
3. Replace generated names with stable, descriptive object names.
4. Check pivots, local axes, scale, transforms, and interaction travel.
5. Record material count, texture dimensions, file size, and known defects.
6. Reduce unnecessary geometry, materials, and texture size before GLB export.
7. Add required custom properties such as `game_id` only after the object contract is stable.
8. Document the candidate, cleanup decisions, validation output, and preview renders in `asset-reports/`.

Generated assets must not be copied directly into `public/models/`. A deployable GLB is produced only through the Blender validation and export path.

## Blender MCP rules

The official Blender MCP may be used for scene inspection, controlled cleanup, validation support, naming checks, pivot checks, metadata review, preview-render evidence, and export support.

Use Blender MCP for bounded operations with clear target objects or scene groups. Do not use it for uncontrolled broad rewrites of approved scenes, arbitrary scene-wide edits, or changes that bypass the existing Blender scripts and asset reports.

Every MCP-assisted asset pass should record:

- Blender version and source `.blend` file.
- MCP operation summary and affected scene group.
- Preview render paths under `preview-renders/` when visual evidence is relevant.
- Object count, material count, texture sizes, and GLB size when available.
- Validation warnings and known deviations from the approved reference set.
- Whether the output is a proxy, candidate, blockout, or approved production asset.

## Runtime contract checklist

Before a GLB is handed to the React workstream, record:

- scene group and root object
- stable runtime node names
- hierarchy changes
- pivots and local axes
- scale and camera assumptions
- `game_id` values and interaction metadata
- animation tracks, if any
- expected HTML or equivalent accessible control for every required 3D action
- material count, texture sizes, GLB size, and optimization decisions
- GLB reimport validation result
- known aircraft-reference deviations

## Export and integration

Production exports continue to use the repository asset commands:

```bash
npm run asset:dc9
npm run asset:airbus
npm run asset:tesla
npm run assets:check
```

The GLB contract remains stable names, preserved hierarchy, correct pivots, local axes, animations, materials, and exported custom properties. React integration should consume only documented asset contracts and must provide native HTML or equivalent accessible controls for required 3D interactions.

Model Y spoiler protection still applies: no Model Y asset, thumbnail, loading copy, menu entry, early achievement, or hint may reveal the reward before Pop T Captain Mode is complete.

## Ownership and branch boundaries

Keep Windows and Ubuntu work on separate branches. Do not place Windows and Ubuntu work on the same branch at the same time.

- Ubuntu owns `art-source/**`, `tools/blender/**`, `public/models/**`, `asset-reports/**`, and `preview-renders/**`.
- Windows owns `src/**`, `tests/**`, `e2e/**`, `.github/**`, `package.json`, `AGENTS.md`, and `TEST_REPORT.md`.
- Cross-boundary changes require a separate owning-branch follow-up, PR comment, or review discussion.

Docs may describe the contract across both sides, but implementation commits must respect the path ownership model in `docs/WORKSTREAM_OWNERSHIP.md`.

## Execution loop

For asset workflow changes, repeat:

**orient -> plan -> implement a small checkpoint -> validate -> inspect in Blender or the browser -> review the diff -> repair -> record evidence -> repeat**

Do not claim asset approval from source code alone. Approval evidence must include Blender inspection or browser verification appropriate to the change.
