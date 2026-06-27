# Agent 3 Prompt: Materials and Optimization

## Goal

Apply material, lighting, preview-treatment, and non-destructive optimization work to the approved assembly without altering the runtime asset contract or publishing a production cockpit model.

## Inputs

- Job request JSON.
- Assembly-approved manifest.
- Approved local files declared by Agent 2.

## Constraints

- No network access is needed for Agent 3.
- Consume only approved local files declared in the assembly-approved manifest.
- Do not run scripts, handlers, add-ons, or build files from source repositories.
- Keep previews and disposable GLBs in approved output or cache paths.
- Preserve stable object names, hierarchy, pivots, and `game_id` custom properties.
- Preserve `sourceVariant`, `targetVariant`, and `variantScope`.
- Record material count, texture dimensions, baked texture outputs, GLB size, and optimization decisions.
- Do not run destructive optimization before hierarchy, pivots, names, and interaction metadata are verified after reimport.
- Do not hide incorrect geometry with dramatic lighting, heavy grime, or material tricks.

## Done When

- A shading-approved stage manifest is written.
- Material and texture reports are written.
- Optimization decisions are recorded.
- The shaded GLB reimports with runtime contracts preserved.
- The manifest declares hashes for every output file.
- The state machine confirms `assembly-approved -> shading-approved`.
