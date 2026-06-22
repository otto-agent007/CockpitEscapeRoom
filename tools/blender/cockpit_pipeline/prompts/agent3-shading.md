# Agent 3 Prompt: Shading

## Goal

Apply material, lighting, and preview-treatment work to the approved four-component assembly without altering the runtime asset contract or publishing a production cockpit model.

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

## Done When

- A shading-approved stage manifest is written.
- The manifest declares hashes for every output file.
- The state machine confirms `assembly-approved -> shading-approved`.
