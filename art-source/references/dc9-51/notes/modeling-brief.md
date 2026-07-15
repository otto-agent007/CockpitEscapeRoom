# DC-9-51 Modeling Brief

> **Seat-role supersession notice (2026-07-15):** This historical record preserves the then-current DC-9 captain / A320 first-officer assignment. The active production contract now uses DC-9 first-officer/right-seat and Airbus A320 Pop T captain/left-seat roles. Historical evidence below is unchanged.


Target: Northwest-style McDonnell Douglas DC-9-51 cockpit. Use this brief as reference triage, not as production approval.

## Reference Hierarchy

### Primary

- `dc9_51_n775nc_cockpit_primary`: McDonnell Douglas DC-9-51 cockpit, N775NC
  Variant/operator: DC-9-51 / Northwest Airlines
  Viewpoint: flight deck forward, captain/center perspective
  Intended uses: captain-eye main panel silhouette, analog instrument density, yoke, glare shield, and windshield relationship, blue-gray panel material family
  Compatibility: Primary target match for Northwest DC-9-51 cockpit layout, material family, yokes, main-panel density, glare shield, and windshield relationship. Does not resolve overhead, pedestal, or sidewall close-up details.
  Limitations: Single wide cockpit photo; some labels and lower pedestal details are not readable. Use as visual reference only unless the source record supports texture use.

- `dc9_32_xplane_roger2009_evaluation`: Douglas DC-9-30 unfinished v0.19 simulator package
  Variant/operator: DC-9-32 / Not target-specific
  Viewpoint: full simulator aircraft with detailed virtual cockpit
  Intended uses: deterministic OBJ8 conversion and Blender assembly, derivative cockpit geometry and texture production, exact-target cockpit geometry and cleared texture authority, browser runtime integration after asset and visual validation
  Compatibility: Owner-cleared exact DC-9-32 production geometry and texture authority for Pop T Captain Mode.
  Limitations: Direct creator permission for CockpitEscapeRoom use and derivative production was owner-confirmed on 2026-07-12. Use only the cleared donor assets; DC-9-51 references remain atmosphere and Northwest-era finish cues, not geometry overrides. Interactions remain fictional and non-operational.

- `dc9_faa_normal_checklist_appendix_d`: FAA-approved DC-9 normal checklist, Appendix D
  Variant/operator: DC-9 series / Not applicable
  Viewpoint: Appendix D normal-checklist text only
  Intended uses: APU bus switches off, APU master switch off, fuel boost pumps off precondition, battery switch off completion
  Compatibility: Procedure authority for the parked secure sequence only.
  Limitations: Use Appendix D checklist evidence only. Never import or reference the surrounding accident narrative in game content. No PDF bytes are committed.

- `dc9_roger2009_procedure_guide`: Procedures for DC9, Roger2009 donor guide
  Variant/operator: DC-9-32 simulator / Not target-specific
  Viewpoint: donor procedures and available-control documentation
  Intended uses: donor parked-state verification, source control and dataref availability, control-state cross-checking against the FAA checklist
  Compatibility: Donor-state and available-control verification for the exact production source; not sole real-world procedure authority.
  Limitations: Do not treat simulator procedures as sole real-world authority. No PDF bytes are committed without redistribution rights.

- `dc9_northwest_mem_timetable_1995`: Northwest Airlines system timetable, June 1, 1995
  Variant/operator: DC9 equipment code / Northwest Airlines
  Viewpoint: MEM route tables and period mileage
  Intended uses: BTR, STL, and TYS verified short-route answers, LAX, SEA, and AMS route-card distractors, period city and mileage display
  Compatibility: Route-card authority for MEM destination codes, city names, period mileage, and DC9 equipment notation.
  Limitations: Route and schedule evidence only; not cockpit geometry or procedure authority. No timetable scan is committed.

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

- `dc9_import_centerview`: DC-9-51 centerview reference photo
  Variant/operator: DC-9-51 / Unknown
  Viewpoint: cockpit forward, captain-eye approximate
  Intended uses: cockpit framing checks, analog layout awareness
  Compatibility: Supplementary visual context for cockpit framing and panel density.
  Limitations: Visual reference only.

- `dc9_import_northwest_51`: DC-9-51 Northwest reference photo
  Variant/operator: DC-9-51 / Unknown
  Viewpoint: cockpit forward, wide view
  Intended uses: layout density checks, material and lighting comparison
  Compatibility: Supplemental visual context for panel density and panel language.
  Limitations: Visual reference only.

- `dc9_import_airport_view`: DC-9 cockpit airport-view photo
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit-forward, broad
  Intended uses: external context checks, general instrument layout checks
  Compatibility: Supplemental framing and cockpit-to-window relationship reference.
  Limitations: Visual reference only.

- `dc9_import_instrument_panel`: DC-9 instrument panel close-up
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit instrument panel close-up
  Intended uses: analog panel comparison, instrument spacing checks
  Compatibility: Supplemental gauge style and panel density reference.
  Limitations: Visual reference only.

- `dc9_import_n776nc`: DC-9 N776NC cockpit photo
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit or aircraft context
  Intended uses: family registration context, visual identity checks
  Compatibility: Supplemental identification and visual direction context.
  Limitations: Source and date are not verified.

- `dc9_import_reference_pic`: DC-9 reference picture
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit interior
  Intended uses: overall panel proportion checks, candidate control spacing checks
  Compatibility: Supplemental interior reference for layout feel.
  Limitations: Visual reference only.

- `dc9_import_elder_instruments`: Elder museum DC-9 cockpit instrument reference
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit instrument close-up
  Intended uses: glass and gauge studies, panel finish comparison
  Compatibility: Supplemental instrument and glass references.
  Limitations: Source not yet confirmed.

- `dc9_import_northwest_hat`: Northwest DC-9 captain hat and manuals photo
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit-side memorabilia
  Intended uses: story detail references, side area cues
  Compatibility: Supplemental legacy detail reference only.
  Limitations: Not authoritative geometry source.

- `dc9_import_sps`: DC-9 cockpit photo SPS-DC9C-1
  Variant/operator: DC-9 family / Unknown
  Viewpoint: cockpit interior
  Intended uses: panel detail comparison, control spacing study
  Compatibility: Supplemental close reference for control cluster style.
  Limitations: Visual reference only.

- `a320_mipa1`: Airbus A320 cockpit reference MIPA1
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: cockpit panel detail
  Intended uses: Airbus First-Officer cockpit reference board, visual comparison after exact model confirmation
  Compatibility: Supplemental A320-family visual reference only. Do not start production Airbus cockpit modeling until exactAirbusModel is confirmed.
  Limitations: Visual reference only.

- `a320_sps_1`: Airbus A320 cockpit reference SPS-A320-1
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: cockpit panel detail
  Intended uses: Airbus panel detail comparison, Airbus reference board completeness check
  Compatibility: Supplemental A320-family visual reference only.
  Limitations: Visual reference only.

- `a320_overhead`: Airbus A320 overhead panel reference
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: overhead panel
  Intended uses: overhead layout comparison, Airbus reference board completeness check
  Compatibility: Supplemental overhead layout reference after exact model confirmation.
  Limitations: Visual reference only.

- `a320_pedestal`: Airbus A320 pedestal reference
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: pedestal
  Intended uses: pedestal layout comparison, Airbus reference board completeness check
  Compatibility: Supplemental pedestal layout reference after exact model confirmation.
  Limitations: Visual reference only.

- `a320_behind_seats`: Airbus A320 cockpit behind seats reference
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: cockpit behind seats
  Intended uses: cockpit volume comparison, first-officer seat relationship reference
  Compatibility: Supplemental cockpit volume and seating relationship reference.
  Limitations: Visual reference only.

- `a320_behind_first_officer`: Airbus A320 cockpit behind first officer reference
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: behind first officer
  Intended uses: first-officer cockpit relationship reference, Airbus cockpit volume comparison
  Compatibility: Supplemental First-Officer side relationship reference.
  Limitations: Visual reference only.

- `a320_centerview_with_pilots`: Airbus A320 cockpit center view with pilots
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: cockpit center view with pilots
  Intended uses: cockpit scale comparison, display and glareshield relationship reference
  Compatibility: Supplemental cockpit scale and seating reference.
  Limitations: Visual reference only.

- `a320_centerview_no_pilots`: Airbus A320 cockpit center view without pilots
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: cockpit center view
  Intended uses: cockpit panel relationship comparison, display layout reference after exact model confirmation
  Compatibility: Supplemental display, glareshield, and panel relationship reference.
  Limitations: Visual reference only.

- `a320_sidestick`: Airbus A320 sidestick reference
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: sidestick close-up
  Intended uses: First-Officer sidestick relationship reference, interaction target planning after exact model confirmation
  Compatibility: Supplemental sidestick shape and placement reference.
  Limitations: Visual reference only.

- `a320_centerview_with_labels`: Airbus A320 cockpit center view with labels
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: labeled cockpit center view
  Intended uses: control identification reference, First-Officer puzzle target comparison
  Compatibility: Supplemental label-reading reference only; do not copy labels directly into textures unless the source record supports that use.
  Limitations: Visual reference only.

- `a320_cockpit_with_labels`: Airbus A320 cockpit wide view with labels
  Variant/operator: A320 family; exact cockpit model still requires owner confirmation / Unknown
  Viewpoint: labeled cockpit wide view
  Intended uses: control identification reference, First-Officer puzzle target comparison
  Compatibility: Supplemental label-reading reference only; do not copy labels directly into textures unless the source record supports that use.
  Limitations: Visual reference only.

### Presentation

- `dc9_reflected_reality_controls_video`: Reflected Reality DC-9 control-location video
  Variant/operator: DC-9 family / Not target-specific
  Viewpoint: cockpit control location, appearance, and movement
  Intended uses: control-location comparison, control movement comparison, restrained visual presentation reference
  Compatibility: Presentation evidence for control placement, appearance, and movement only; not procedure authority.
  Limitations: Do not use as sole procedure authority. Video, captions, and frames are not committed without redistribution rights.

- `dc9_32_xplained_cockpit_12`: Roger2009 DC-9-30 cockpit view 12
  Variant/operator: DC-9-32 simulator / Not target-specific
  Viewpoint: virtual cockpit overview
  Intended uses: donor cockpit composition, panel and yoke orientation comparison, captain-view framing benchmark
  Compatibility: High-value presentation benchmark for the exact Roger2009 donor. Use for donor component placement and orientation, subordinate to the real DC-9-51 primary reference for target geometry.
  Limitations: Simulator screenshot of a DC-9-32, not target DC-9-51 geometry authority.

- `dc9_32_xplained_cockpit_13`: Roger2009 DC-9-30 cockpit view 13
  Variant/operator: DC-9-32 simulator / Not target-specific
  Viewpoint: virtual cockpit instrument panel detail
  Intended uses: instrument placement comparison, panel depth and gauge-density comparison
  Compatibility: High-value presentation benchmark for the exact Roger2009 donor; subordinate to the real DC-9-51 primary reference for target geometry.
  Limitations: Simulator screenshot of a DC-9-32, not target DC-9-51 geometry authority.

- `dc9_32_xplained_cockpit_14`: Roger2009 DC-9-30 cockpit view 14
  Variant/operator: DC-9-32 simulator / Not target-specific
  Viewpoint: virtual cockpit component detail
  Intended uses: component orientation comparison, control and bezel depth comparison
  Compatibility: High-value presentation benchmark for the exact Roger2009 donor; subordinate to the real DC-9-51 primary reference for target geometry.
  Limitations: Simulator screenshot of a DC-9-32, not target DC-9-51 geometry authority.

- `dc9_32_xplained_cockpit_15`: Roger2009 DC-9-30 cockpit view 15
  Variant/operator: DC-9-32 simulator / Not target-specific
  Viewpoint: virtual cockpit pedestal detail
  Intended uses: pedestal composition, throttle and autopilot placement comparison
  Compatibility: High-value presentation benchmark for the exact Roger2009 donor; subordinate to the real DC-9-51 primary reference for target geometry.
  Limitations: Simulator screenshot of a DC-9-32, not target DC-9-51 geometry authority.

- `dc9_32_xplained_cockpit_16`: Roger2009 DC-9-30 cockpit view 16
  Variant/operator: DC-9-32 simulator / Not target-specific
  Viewpoint: virtual cockpit overhead detail
  Intended uses: overhead composition, switch and instrument-density comparison
  Compatibility: High-value presentation benchmark for the exact Roger2009 donor; subordinate to the real DC-9-51 primary reference for target geometry.
  Limitations: Simulator screenshot of a DC-9-32, not target DC-9-51 geometry authority.

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
- Label/placard close-ups with complete source records.

## Production Modeling Guardrails

- Do not start final cockpit geometry from the secondary or presentation rows.
- Use secondary rows only when a shared component/material cue is explicitly relevant.
- Keep all interactions fictional and non-operational.
- Do not use reference photos as textures unless the source record supports that use.
