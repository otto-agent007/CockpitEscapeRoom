# First polished DC-9 puzzle prompt

## Goal

Turn the approved DC-9 pipeline proof into one polished, complete puzzle that establishes the final interaction, lighting, sound, accessibility, and performance standard.

## Context

Use the first puzzle described in `docs/GAME_DESIGN.md` and invoke both `$cockpit-feature` and `$blender-web-assets`. The visual blockout must already have owner approval.

## Constraints

- Polish only one puzzle and nearby cockpit area.
- Add sound only with mute and volume controls and local licensed/original files.
- Wrong answers reset only the current sequence.
- Crew and Captain modes remain fair.
- Every 3D action has an HTML equivalent.
- Respect reduced motion.
- Do not expand to the full main game until this slice is approved.

## Done when

- Correct, wrong, repeated-wrong, hint, keyboard, reload, and reset paths pass.
- Lighting and materials pass the DC-9 visual standard.
- Asset and bundle measurements are recorded.
- Desktop and phone Vercel previews are reviewed.
- All critical/high review findings are fixed.
