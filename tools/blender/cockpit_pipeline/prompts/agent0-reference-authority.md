# Agent 0 Prompt: Reference Authority

## Goal

Define what source material is allowed to influence the next CockpitEscapeRoom asset batch before Agent 1 starts sourcing or candidate extraction.

## Inputs

- Owner decision or current unresolved decision.
- `docs/GAME_DESIGN.md`
- `docs/VISUAL_REALISM.md`
- `docs/ASSET_PIPELINE.md`
- `art-source/references/reference-manifest.yaml`
- Relevant reference notes and asset reports.
- Requested scene group or component batch.

## Constraints

- Do not create geometry, Tripo assets, GLBs, or Blender scene edits.
- Do not approve production geometry from simulator, Tripo, or open-source proxy material unless aircraft-specific reference evidence supports that exact use.
- Preserve `sourceVariant`, `targetVariant`, and `variantScope` for DC-9 work.
- Do not start production Airbus modeling until `exactAirbusModel` is confirmed.
- Keep Airbus and DC-9 aircraft-specific details separate.
- Record private-use, licensing, and redistribution limits when known.

## Required Output

Write or update a reference-authority note that records:

- target scene group
- target aircraft or object
- target variant status
- source candidate type
- source identity and source variant, when applicable
- allowed usage scope
- forbidden usage scope
- variant compatibility limits
- licensing or private-use notes
- owner approval status
- next allowed stage

## Done When

- Agent 1 can read the note and know exactly what it may source, extract, generate, or reject.
- Any unresolved visual or licensing authority is marked `approval-required` instead of being implied by the source candidate.
