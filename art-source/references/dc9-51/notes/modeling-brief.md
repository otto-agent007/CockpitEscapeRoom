# DC-9-51 Modeling Brief

Target: Northwest-style McDonnell Douglas DC-9-51 cockpit. Use this brief as reference triage, not as production approval.

## Reference Hierarchy

### Primary

- `dc9_51_n775nc_cockpit_primary`: McDonnell Douglas DC-9-51 cockpit, N775NC
  Variant/operator: DC-9-51 / Northwest Airlines
  Viewpoint: flight deck forward, captain/center perspective
  Intended uses: captain-eye main panel silhouette, analog instrument density, yoke, glare shield, and windshield relationship, blue-gray panel material family
  Compatibility: Primary target match for Northwest DC-9-51 cockpit layout, material family, yokes, main-panel density, glare shield, and windshield relationship. Does not resolve overhead, pedestal, or sidewall close-up details.
  Limitations: Single wide cockpit photo; some labels and lower pedestal details are not readable. Use as visual reference only, not as a distributable texture without downstream license review.

### Secondary

- `dc9_50_n775nc_exterior_context`: Northwest Airlines McDonnell Douglas DC-9-50 N775NC exterior context
  Variant/operator: DC-9-50 family / Northwest Airlines
  Viewpoint: exterior three-quarter side context
  Intended uses: registration/operator context, era context, reference report provenance
  Compatibility: Same registration/family context for the seed aircraft, but not cockpit geometry authority. Use only for aircraft identity, exterior color-era context, and provenance.
  Limitations: Exterior photograph; no cockpit modeling decisions should be derived from this image.

- `dc9_40_northwest_cockpit_secondary`: Northwest Airlines DC-9-40 cockpit
  Variant/operator: DC-9-40 / Northwest Airlines
  Viewpoint: cockpit forward, wide view
  Intended uses: shared DC-9 analog layout comparison, material and wear comparison, yoke and glareshield family cues
  Compatibility: Nearby Northwest DC-9 variant. Use only for shared analog cockpit density, broad panel color/material, yoke family, and lighting comparison. Do not use for DC-9-51-specific geometry.
  Limitations: Variant mismatch: DC-9-40, not DC-9-51. Must remain secondary and labeled in any board or brief.

- `md81_midwest_cockpit_secondary`: McDonnell Douglas MD-81 cockpit, Midwest Airlines N813ME
  Variant/operator: MD-81 / Midwest Airlines
  Viewpoint: flight deck forward, wide view
  Intended uses: analog gauge depth comparison, material and lighting comparison, identify derivative-family differences to avoid copying
  Compatibility: Derivative-family reference only. Use for broad analog material, instrument depth, and lighting comparison after primary DC-9 references, never for DC-9-51 geometry.
  Limitations: Not a DC-9-51 and not Northwest. Keep visibly separated from primary references.

### Presentation

- `simulation_daily_dc9_release_presentation`: Simulation Daily DC-9 simulator release coverage
  Variant/operator: DC-9-10 and DC-9-30 simulator package / Not target-specific
  Viewpoint: presentation screenshots and feature list
  Intended uses: presentation benchmark, later enhancement ideas, out-of-scope simulator feature separation
  Compatibility: Presentation benchmark only. The article covers simulator DC-9-10/-30 material and must not drive Northwest DC-9-51 geometry.
  Limitations: Do not download or copy article images. Do not treat simulator screenshots as authoritative geometry.

## Missing Primary Views

- DC-9-51 overhead panel close-up.
- DC-9-51 pedestal and throttle quadrant close-up.
- Captain sidewall and window mechanism.
- First officer side view.
- Label/placard close-ups with redistribution terms reviewed.

## Production Modeling Guardrails

- Do not start final cockpit geometry from the secondary or presentation rows.
- Use secondary rows only when a shared component/material cue is explicitly relevant.
- Keep all interactions fictional and non-operational.
- Do not use reference photos as textures unless downstream license obligations are reviewed.
