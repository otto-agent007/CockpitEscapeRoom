# Visual realism and approval standard

## Goal

A former DC-9 pilot should recognize the main cockpit immediately from the captain’s viewpoint. A former Airbus pilot should recognize the First-Officer cockpit as the exact model selected. Realism comes from correct proportions, materials, camera placement, lighting, and familiar visual relationships—not from simulating every operational system.

## Reference policy

Build an approved reference board for each aircraft. Record source, model/variant, angle, date if known, and what the reference is used for.

## DC-9 approval criteria

The first DC-9 blockout must demonstrate:

- Captain-eye camera height, field of view, and sightline.
- Main instrument panel silhouette and density.
- Relationship between captain instruments, central engine instruments, yokes, glare shield, windshield, pedestal, and overhead.
- Era-appropriate blue-green/gray panel family.
- Correct large control shapes and spacing.
- Analog gauge depth and glass response.
- Restrained wear, screws, labels, and edge shading.
- Instrument and annunciator lighting that does not look like science fiction.

The owner must answer “yes” to: **Does this feel unmistakably like the DC-9 he flew?**

## Airbus approval criteria

Do not model the production Airbus cockpit until the exact model is confirmed. The blockout must demonstrate model-specific:

- Side-stick and seat relationship.
- Main display arrangement.
- Flight-control-unit geometry.
- Glareshield, pedestal, overhead, and window proportions.
- Display color/brightness treatment.
- Panel typography and pushbutton visual language.

The Airbus may not reuse DC-9 geometry, labels, or control placement.

## Camera and interaction

Use a restrained captain-seat camera with limited look and lean rather than free-flight controls. Zooming into puzzle zones should feel like leaning toward the panel. Avoid wide-angle distortion that makes the cockpit look like a game arena.

Interactive controls need correct pivots and believable travel. Use simplified collider meshes when necessary, but do not alter visible proportions to make clicking easier; expand the invisible hit target instead.

## Materials and lighting

Use physically based materials suitable for glTF. Bake small wear, shallow screws, grime, labels, and ambient occlusion where geometry would be wasteful. Keep major controls and bezels as geometry.

Maintain two lighting contexts:

- Neutral approval lighting for checking shape and material.
- In-game cockpit lighting for mood and interaction.

Do not approve an asset only under dramatic lighting.

## Approval deliverables

Each visual gate includes:

- Fixed captain-seat screenshot.
- Main-panel close-up.
- Overhead and pedestal views when applicable.
- Vercel preview URL.
- GLB size and object/material counts.
- Mobile and desktop screenshots.
- Known deviations from the reference set.
- Source manifest updates.
