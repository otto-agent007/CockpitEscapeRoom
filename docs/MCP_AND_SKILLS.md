# Skills first, narrow Blender MCP later

## Recommendation

Use custom Codex Skills now. Add a Blender MCP only after the command-line pipeline has been used enough to expose a real recurring manual loop.

Skills are the right first layer because the workflow is mostly instructions plus deterministic scripts that already live in the repository. MCP becomes valuable when Codex needs live external state from an open Blender session or repeatedly needs to invoke a stable tool interface.

## Current Skills

### `$cockpit-feature`

Use when adding or changing a puzzle, scene transition, reward, persistence behavior, or accessible interaction. It enforces the player loop, tests, browser checks, visual checks, and repair loop.

### `$blender-web-assets`

Use when a `.blend`, material, texture, interactive node, GLB, or asset report changes. It enforces validation, stable contracts, browser integration, and approval renders.

## Future MCP surface

Only expose:

```text
scene_inventory
validate_scene
render_preview
export_glb
```

Each tool should accept a known project asset identifier and return structured results. It should call the same tested Python implementation used by the CLI and Blender add-on.

## Prohibited MCP surface

Do not expose:

```text
run_python
execute_blender_code
run_shell
write_arbitrary_file
modify_any_scene_object
```

Those tools create an unnecessarily broad failure and security surface, make runs hard to audit, and can damage the master scene.

## Adoption gate

Implement the MCP only when all are true:

- The CLI scripts have completed several successful asset iterations.
- Inputs and outputs are stable.
- The Blender add-on uses the same underlying functions.
- The team can name a repeated manual loop the MCP removes.
- Project-scoped approval and timeout behavior has been reviewed.
