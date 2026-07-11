---
name: blender-browser-visual-gate
description: Prove a CockpitEscapeRoom Blender/GLB visual milestone in the actual browser before claiming it is done. Use after editing Blender sources, generated GLBs, Three.js/React Three Fiber scene code, camera/framing, lighting/materials, hitboxes, or visual reports; also use when owner feedback says an asset is missing, dark, upside down, unprofessional, misframed, or still wrong.
---

# Blender Browser Visual Gate

Use this whenever visual acceptance matters. Passing asset validation, typecheck, or Playwright assertions is not enough.

## First boundary check

Before editing, prove what is actually happening:

1. Confirm the expected GLB exists and record size/hash.
2. Start or reuse the local dev server.
3. In a fresh browser context, seed the relevant game phase.
4. Fetch the runtime GLB with `cache: no-store` and compare its byte length to disk.
5. Capture a screenshot from the actual app, not only Blender.

If the owner says "I don't see it," assume the screenshot is the source of truth.

## Screenshot minimums

For visual work, capture at least:

- `1440x900` desktop proof
- `768` width proof if layout can change
- `375` width proof if mobile is in scope

If the user has explicitly said desktop only, 1440 proof is still mandatory.

Store quick local proof in `/tmp/<feature>-<claim>-1440.png`. Only move screenshots into tracked evidence when the visual result is acceptable.

## Acceptance checklist

Inspect the screenshot before writing reports:

- Is the new asset actually visible?
- Did old proxy geometry dominate the view?
- Is the object upright and facing the camera sensibly?
- Is material brightness readable without blowing out the room?
- Does the composition look intentional rather than raw import?
- Are important UI overlays blocking the asset?
- Are interaction hitboxes still reachable?
- Does the screenshot match what the owner asked to see?

If any answer is bad, fix the visual issue first. Do not update `TEST_REPORT.md` with passing language.

## Interaction proof

For every required 3D action:

- verify the `game_id` exists in exported extras;
- verify the browser can trigger it by clicking a plausible visible region or documented invisible hitbox;
- keep a native HTML/accessibility equivalent.

If visible props are intentionally removed until final source assets arrive, update the test click points to match invisible hitbox regions and document that decision.

## Report format

When done, record:

- GLB size and SHA-256
- selected export object count
- `game_id` count
- material and texture count
- commands actually run
- screenshot paths actually inspected
- limitations and owner-review delta

Never claim an unrun check passed.
