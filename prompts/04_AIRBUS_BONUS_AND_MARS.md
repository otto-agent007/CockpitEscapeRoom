# Airbus bonus and Mars prompt

## Goal

Build the separate model-specific Airbus bonus cockpit, one substantial Type Transition puzzle, and the optional Mars Easter egg.

## Context

The exact Airbus model must be confirmed in `src/game/config.ts` and the active ExecPlan before this task begins. Use `$blender-web-assets` and `$cockpit-feature`.

## Constraints

- Do not reskin or reuse DC-9 geometry as the Airbus cockpit.
- Match the confirmed Airbus model’s major visible geometry.
- Keep puzzle procedures fictional and non-operational.
- Lazy-load the bonus asset after the DC-9 finale.
- The Mars trigger remains hidden but keyboard-accessible and never blocks completion.
- Reuse the approved red Model Y only as a humorous Mars surface vehicle.

## Done when

- The Airbus passes owner visual approval.
- The bonus puzzle works in Crew and Captain contexts as designed.
- The Mars mission can be discovered, entered, and exited without losing progress.
- Asset, browser, accessibility, persistence, performance, and review checks pass.
