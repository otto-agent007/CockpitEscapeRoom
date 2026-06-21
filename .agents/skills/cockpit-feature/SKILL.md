---
name: cockpit-feature
description: Implement or revise a CockpitEscapeRoom puzzle, scene transition, reward, persistence flow, or accessible interaction. Use for requests such as add a puzzle, change Captain Mode, fix progress, improve the reward, test the game loop, or prepare a gameplay pull request.
---

# Cockpit feature workflow

## Inputs

- A player-visible goal.
- Relevant files and active ExecPlan.
- Mode behavior and personalization requirements.
- Acceptance checks, including wrong-answer and reload behavior.

## Workflow

1. Read the root `AGENTS.md`, `BLUEPRINT.md`, `docs/GAME_DESIGN.md`, and active ExecPlan.
2. Reproduce the current behavior before editing.
3. Confirm the task states Goal, Context, Constraints, and Done when. Fill non-blocking gaps with documented editable defaults.
4. Keep rules in `src/game`; keep 3D presentation in `src/scenes`; keep required accessible controls in `src/components`.
5. Implement one coherent checkpoint.
6. Add or update focused reducer, persistence, component, or browser tests.
7. Run the smallest relevant checks, then the full `npm run check` before completion.
8. Launch the game and test:
   - correct answer,
   - wrong answer,
   - repeated wrong answer,
   - each applicable hint,
   - keyboard-only controls,
   - reload/resume,
   - reduced motion,
   - approximately 375, 768, and 1440 px widths.
9. Inspect the complete diff. Look for progress loss, duplicate reveal execution, hidden controls, unsafe HTML, unnecessary dependencies, and content leaking into engine code.
10. Repair failures using validation evidence and repeat until checks pass or a recorded human decision is required.
11. Update the active ExecPlan and `TEST_REPORT.md`.

## Non-negotiable game rules

- Dad is an expert pilot and the story does not blame him for an emergency.
- Wrong answers never erase completed puzzles.
- Captain Mode is harder through subtler presentation, not obscure trivia.
- Required 3D interactions have native HTML equivalents.
- Do not convert real procedures into an operational training simulation.
- Keep personal data local.

## Output

Report files changed, behavior delivered, commands actually run, pass/fail results, visual checks, personalization placeholders, and the remaining delta.
