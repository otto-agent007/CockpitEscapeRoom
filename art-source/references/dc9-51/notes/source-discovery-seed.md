# DC-9 Source Discovery Seed

Use this seed when Agent 1 begins CockpitEscapeRoom DC-9 component sourcing. The intent is to combine the strongest buildable 3D sources with the strongest DC-9-51 / Northwest visual target evidence without silently mixing variants.

## Primary visual target

- Reference ID: `dc9_51_n775nc_cockpit_primary`
- Variant/operator: McDonnell Douglas DC-9-51 / Northwest Airlines
- Registration: N775NC
- Local reference: `art-source/references/dc9-51/primary/dc9_51_n775nc_cockpit_primary.jpg`
- Annotation: `art-source/references/dc9-51/annotations/dc9_51_n775nc_cockpit_primary_callouts.svg`

Use this source for captain-seat scale, cockpit color family, yoke placement, main panel instrument density, glare shield relationship, windshield framing, and broad pedestal position. Do not use it as a texture source.

## Initial source families to search

For each requested component, Agent 1 must check at least one item from each family unless the job explicitly scopes the search narrower.

1. Extractable 3D/model source
   - FlightGear DC-9-32 package already used by the pipeline.
   - Any owner-approved local aircraft packages under the configured pipeline cache.
   - Any additional configured DC-9/C-9/open-source aircraft packages recorded in the job file.
2. Real cockpit visual reference
   - `dc9_51_n775nc_cockpit_primary` for target comparison.
   - Nearby Northwest DC-9 secondary cockpit references only for shared analog layout/material cues.
   - Component close-up photos when available, recorded in `reference-manifest.yaml` before use.
3. Variant/documentation source
   - Fleet/registration or museum context for variant identity.
   - Manuals, diagrams, or airport/museum references when available and recorded.
   - Existing pipeline reports that describe previously extracted source limitations.

## Candidate ranking fields

Each component candidate must record:

- `candidateId`
- `componentId`
- `sourceFamily`
- `sourceLocation`
- `sourceFilePath`
- `sourceVariant`
- `targetVariant`
- `variantScope`: `exact`, `same_family`, `nearby_variant`, `derivative_family`, `presentation_only`, or `rejected`
- `geometryCompleteness`: `high`, `medium`, `low`, or `missing`
- `pivotAnimationEvidence`: `explicit`, `inferred`, `none`, or `unknown`
- `textureMaterialEvidence`: `source_textures`, `photo_reference_only`, `procedural_required`, or `unknown`
- `confidence`: `high`, `medium`, `low`, or `rejected`
- `selectionStatus`: `selected`, `rejected`, or `no_viable_alternative_found`
- `selectionReason`
- `limitations`
- `downstreamWarningForAgent2`

## Minimum component slate

For Batch 1, compare candidates for:

1. Captain or representative yoke assembly.
2. Throttle pedestal or throttle lever group.
3. Large analog gauge with face, bezel, and needle evidence.
4. Switch, knob, or annunciator cluster.
5. Main-panel shell or panel-zone blockout source, if discoverable.

## Stop conditions

- `success`: at least one selected candidate per requested component, selected/rejected alternatives recorded, previews generated, and source manifest validates.
- `clean no-op`: current source report already satisfies this seed and hashes still verify.
- `approval-required`: candidate slate is complete and needs owner `source-approval.json` before Agent 2.
- `blocked`: configured sources are unavailable, unreadable, or variant identity cannot be recorded.
- `no-progress`: repeated source pass finds the same weak candidate with no new viable alternative.

## Guardrails

- Do not call a DC-9-32 extraction a DC-9-51 component.
- Do not promote a secondary or derivative-family source to geometry authority without recording the limitation.
- Do not execute downloaded aircraft repository scripts, handlers, add-ons, or build files.
- Do not proceed to Agent 2 without human source approval.
