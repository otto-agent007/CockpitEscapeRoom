# Codex bootstrap prompt

## Goal

Audit the new CockpitEscapeRoom starter pack, verify the existing greybox vertical slice, and prepare the repository for the first production DC-9 Blender pipeline proof.

## Context

The repository is `otto-agent007/CockpitEscapeRoom`. It intentionally contains a working but non-realistic 3D greybox, project blueprint, Codex instructions, Skills, Blender scripts, tests, GitHub workflows, and Vercel guidance. The approved product is a realistic DC-9 main escape room, a separate realistic Airbus bonus level, a red Model Y Captain Mode reward, and a hidden Mars mission.

Read `AGENTS.md`, `START_HERE.md`, `BLUEPRINT.md`, `PLANS.md`, all relevant files in `docs/`, and `plans/0001-dc9-pipeline-proof.md` before editing.

## Constraints

- Keep the project name CockpitEscapeRoom.
- Do not build final cockpit art in this task.
- Do not implement a Blender MCP.
- Do not add production dependencies unless clearly justified.
- Preserve the working player loop and tests.
- Do not commit or push until I review the diff.
- Use Plan mode and treat the ExecPlan as a living document.

## Work

1. Inspect the repository and Git status.
2. Install dependencies using the lockfile.
3. Run `npm run check`, `npm run test:e2e`, and `npm run assets:check`.
4. Launch the app in a real browser and inspect Crew Mode, Captain Mode, reload persistence, the Model Y proxy, and the Mars Easter egg at desktop and phone widths.
5. Review the current code and documentation for contradictions, broken commands, unsafe assumptions, or missing prerequisites.
6. Update only the first ExecPlan and small bootstrap defects found through evidence.
7. Use `/review` or perform an equivalent complete-diff review.

## Done when

- Existing checks have actual recorded results.
- Any bootstrap defect is fixed and retested.
- `plans/0001-dc9-pipeline-proof.md` is current, self-contained, and ready for owner review.
- `TEST_REPORT.md` reflects real evidence.
- You report the exact commands run, files changed, remaining personalization blockers, and the proposed first Blender approval deliverable.
