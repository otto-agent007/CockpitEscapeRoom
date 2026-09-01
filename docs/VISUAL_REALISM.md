# Visual realism and approval standard

## Goal

A former DC-9 pilot should recognize the main cockpit immediately from the first-officer/right-seat viewpoint. Older Memphis Concourse B should read as a deliberate memory outside that fixed seat without claiming exact historical geography. A former Airbus pilot should recognize the A320 from the captain/left-seat viewpoint. Realism comes from correct proportions, materials, camera placement, lighting, and familiar visual relationships—not from simulating every operational system.

## Reference policy

Build an approved reference board for each aircraft. Record source, model/variant, angle, date if known, and what the reference is used for.

## DC-9 cockpit approval criteria

The production DC-9-32 must demonstrate:

- First-officer eye camera height, field of view, and sightline.
- Main instrument panel silhouette and density.
- Relationship between first-officer instruments, central engine instruments, yokes, glare shield, windshield, pedestal, and overhead.
- Era-appropriate blue-green/gray panel family.
- Correct large control shapes and spacing.
- Analog gauge depth and glass response.
- Restrained wear, screws, labels, and edge shading.
- Instrument and annunciator lighting that does not look like science fiction.

The owner must answer “yes” to: **Does this feel unmistakably like the DC-9 he flew?**

## Memphis memory approval criteria

**Status:** The current environment is a separate, lazy-loaded GLB using owner-permitted Ted Davis Concourse B source geometry plus project-authored ramp, taxi, runway, canopy, field, and treeline context. It is labeled **1995 MEMORY · Fictional — non operational** and remains visually subordinate to the production cockpit.

The fixed right-seat browser view must demonstrate:

- A recognizable older Concourse B frontage at ramp release, including the long terminal mass and martini-glass canopy rhythm.
- Continuous, grounded pavement through ramp release, taxi, quiet hold, lineup, rollout, and initial climb, with no sky-colored voids or coplanar surface fighting.
- A compressed guided route that reads clearly without presenting exact taxiway/runway geography, identifiers, or procedures.
- Stable horizon, cockpit orientation, and camera framing across checkpoint restore, reload, and repeated chapter entry.
- Qualitative guidance and native controls that remain usable if the outside view fails.
- Readable layouts at approximately 375, 768, and 1440 CSS pixels without the departure panel covering required controls.

The environment may evoke historical Memphis; it must not present itself as documentary reconstruction or training material.

## Airbus approval criteria

**Status:** The 2026-07-10 right-seat presentation was superseded on 2026-07-15. The current Airbus A320 Pop T Captain contract uses the exported left-seat camera, captain-side sidestick, live Storm Line PFD/ND/ECAM surfaces, and paired-thrust motion. Actual-browser evidence is tracked under `preview-renders/storm-line/`; owner visual approval remains open.

The production target is the confirmed Airbus A320. Its current cockpit and future repairs must demonstrate model-specific:

- Side-stick and seat relationship.
- Main display arrangement.
- Flight-control-unit geometry.
- Glareshield, pedestal, overhead, and window proportions.
- Display color/brightness treatment.
- Storm weather that remains legible through the windshield without hiding cockpit geometry.
- PFD, ND, and ECAM symbology that reads as fictional arcade feedback rather than operational instruction.
- Panel typography and pushbutton visual language.

The Airbus may not reuse DC-9 geometry, labels, or control placement.

## Camera and interaction

Use restrained seat-specific cameras with limited look and lean rather than free-flight controls: DC-9 first officer/right seat and Airbus captain/left seat. Zooming into puzzle zones should feel like leaning toward the panel. Avoid wide-angle distortion that makes the cockpit look like a game arena.

Interactive controls need correct pivots and believable travel. Use simplified collider meshes when necessary, but do not alter visible proportions to make clicking easier; expand the invisible hit target instead.

## Materials and lighting

Use physically based materials suitable for glTF. Bake small wear, shallow screws, grime, labels, and ambient occlusion where geometry would be wasteful. Keep major controls and bezels as geometry.

Maintain two lighting contexts:

- Neutral approval lighting for checking shape and material.
- In-game cockpit lighting for mood and interaction.

Do not approve an asset only under dramatic lighting.

## Approval deliverables

Each visual gate includes:

- Fixed seat-role screenshot (DC-9 right seat or Airbus left seat).
- Main-panel close-up.
- Overhead and pedestal views when applicable.
- Vercel preview URL.
- GLB size and object/material counts.
- Consistent 1440×900 desktop screenshots for this seat-role milestone.
- Narrow and intermediate browser captures near 375 and 768 CSS pixels when the milestone changes layout, interaction reachability, or the windshield composition.
- Known deviations from the reference set.
- Source manifest updates.
