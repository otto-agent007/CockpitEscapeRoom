# Agent 2 Prompt: Assembly

## Goal

Use approved local source inputs to create the four-component DC-9 vertical-slice assembly handoff.

## Inputs

- Job request JSON.
- Source-approved manifest.
- Approved local files declared by Agent 1.

## Constraints

- No network access is needed for Agent 2.
- Consume only approved local files declared in the source-approved manifest.
- Do not run scripts, handlers, add-ons, or build files from source repositories.
- Ordinary Python handles orchestration and hash reports.
- Blender Python handles only scene and asset operations.
- Do not create or replace a production model under `public/models/**`.
- Preserve `sourceVariant`, `targetVariant`, and `variantScope`.

## Done When

- An assembly-approved stage manifest is written.
- The manifest declares hashes for every output file.
- The state machine confirms `source-approved -> assembly-approved`.
