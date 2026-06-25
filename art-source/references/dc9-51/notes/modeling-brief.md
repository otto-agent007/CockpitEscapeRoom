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

- `dc9_import_centerview`: DC-9-51 centerview reference photo
  Variant/operator: DC-9-51 / Unknown
  Viewpoint: cockpit forward, captain-eye approximate
  Intended uses: cockpit framing checks, analog layout awareness
  Compatibility: Supplementary visual context for cockpit framing and panel density.
  Limitations: Source and licensing details are not yet verified.

- `dc9_import_northwest_51`: DC-9-51 Northwest reference photo
  Variant/operator: DC-9-51 / Unknown
  Viewpoint: cockpit forward, wide view
  Intended uses: layout density checks, material and lighting comparison
  Compatibility: Supplemental visual context for panel density and panel language.
  Limitations: Source, date, and rights are not yet verified.

- `dc9_import_airport_view`: DC-9 cockpit airport-view photo
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit-forward, broad
  Intended uses: external context checks, general instrument layout checks
  Compatibility: Supplemental framing and cockpit-to-window relationship reference.
  Limitations: Not validated for geometric authority or redistribution rights.

- `dc9_import_instrument_panel`: DC-9 instrument panel close-up
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit instrument panel close-up
  Intended uses: analog panel comparison, instrument spacing checks
  Compatibility: Supplemental gauge style and panel density reference.
  Limitations: Source and rights are unverified.

- `dc9_import_n776nc`: DC-9 N776NC cockpit photo
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit or aircraft context
  Intended uses: family registration context, visual identity checks
  Compatibility: Supplemental identification and visual direction context.
  Limitations: Source/license and date are not verified.

- `dc9_import_reference_pic`: DC-9 reference picture
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit interior
  Intended uses: overall panel proportion checks, candidate control spacing checks
  Compatibility: Supplemental interior reference for layout feel.
  Limitations: Source rights and authorship are not yet verified.

- `dc9_import_runway_view`: DC-9 runway-view reference photo
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit and runway
  Intended uses: contextual lighting checks, runway scene orientation
  Compatibility: Supplemental context for external and cockpit framing.
  Limitations: Not validated for geometry or licensing.

- `dc9_import_dc9_a3201`: DC-9 A3201 photo
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit interior
  Intended uses: material feel checks, control cluster comparison
  Compatibility: Supplemental cockpit composition reference.
  Limitations: Source and rights remain unverified.

- `dc9_import_elder_instruments`: Elder museum DC-9 cockpit instrument reference
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit instrument close-up
  Intended uses: glass and gauge studies, panel finish comparison
  Compatibility: Supplemental instrument and glass references.
  Limitations: Source/license not yet confirmed.

- `dc9_import_northwest_hat`: Northwest DC-9 captain hat and manuals photo
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit-side memorabilia
  Intended uses: story detail references, side area cues
  Compatibility: Supplemental legacy detail reference only.
  Limitations: Not authoritative geometry source; source rights are unverified.

- `dc9_import_legacy_cockpit`: Legacy DC-9 cockpit view
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit interior
  Intended uses: shape comparisons, general interior styling checks
  Compatibility: Supplemental legacy interior reference for style cues.
  Limitations: Source and licensing are pending.

- `dc9_import_sps`: DC-9 cockpit photo SPS-DC9C-1
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit interior
  Intended uses: panel detail comparison, control spacing study
  Compatibility: Supplemental close reference for control cluster style.
  Limitations: Source rights and provenance are not validated.

- `dc9_import_elder_museum`: DC-9 elder museum cockpit photo
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit interior close
  Intended uses: sidewall and lighting checks, control placement awareness
  Compatibility: Supplemental museum-reference visual context.
  Limitations: Not validated for geometry authority or licensing.

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
