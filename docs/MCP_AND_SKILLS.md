# Skills and Blender MCP

## Recommendation

Use custom Codex Skills for durable process guidance and the official Blender MCP for live Blender scene inspection or controlled asset edits when that direct scene context is useful.

Skills remain the right layer for repository rules, validation loops, approval gates, and asset handoffs. Blender MCP is an execution aid, not a replacement for deterministic scripts, asset reports, or owner visual approval.

## Current Skills

### `$cockpit-feature`

Use when adding or changing a puzzle, scene transition, reward, persistence behavior, or accessible interaction. It enforces the player loop, tests, browser checks, visual checks, and repair loop.

### `$blender-web-assets`

Use when a `.blend`, material, texture, interactive node, GLB, or asset report changes. It enforces validation, stable contracts, browser integration, and approval renders.

### `$loop-doctor`

Use when an existing prompt, workflow, agent handoff, asset pipeline, or repair loop needs an audit. It checks whether the loop reads fresh state, takes bounded action, verifies with reproducible evidence, records outcomes, and stops safely.

### `$loop-discovery`

Use when looking for repeated CockpitEscapeRoom work that should become a feedback loop or Skill. It mines repo evidence and authorized coding-thread history, rejects one-shot checklists, and ranks only candidates with observable feedback and safe terminal states.

## Allowed Blender MCP use

The official Blender MCP may be used for:

- Scene inventory and hierarchy inspection.
- Controlled cleanup of named target objects or a named scene group.
- Stable naming, pivot, local-axis, transform, and metadata checks.
- Preview renders for evidence.
- Export support that still preserves the repository validation trail.

## Prohibited MCP surface

Do not use MCP workflows for:

- Uncontrolled broad rewrites of approved scenes.
- Arbitrary scene-wide edits without a named target and rollback plan.
- Bypassing `validate_scene`, `render_preview`, `export_glb`, or `npm run assets:check`.
- Copying generated assets directly to runtime without Blender import, cleanup, optimization, and asset-report evidence.
- Mixing Airbus and DC-9 aircraft-specific details.

## Tripo AI

Tripo AI may be used for rapid candidate generation, proxy meshes, and exploratory props. It is not final production authority. Tripo outputs must be imported into Blender, inspected, cleaned, optimized, given stable object names, checked for pivots, and documented in `asset-reports/` before any GLB reaches `public/models/`.

See `docs/ASSET_PIPELINE.md` for the full Tripo AI -> Blender MCP -> GLB -> React integration workflow.
