# Release review prompt

## Goal

Perform a release-candidate audit of CockpitEscapeRoom and fix every critical or high-severity defect before the Father’s Day build is tagged.

## Context

Review the complete repository, active plans, `TEST_REPORT.md`, GitHub Actions, and current Vercel preview. Test the app as a new player and as a returning player.

## Constraints

- Do not add new features unless required to fix a release blocker.
- Do not weaken tests, hide console errors, or remove accessibility paths.
- Preserve approved cockpit art and interaction contracts.
- Report unverified facts as release blockers.

## Review loop

Repeat review → focused repair → execution/validation → remaining-delta update. Stop only when all release checks pass, the delta stops shrinking, or owner action is genuinely required.

## Done when

- `npm run check`, `npm run test:e2e`, and `npm run assets:check` pass.
- Crew and Captain complete-game paths pass from clean and saved states.
- DC-9, Model Y, Airbus, and Mars scenes load without console errors.
- 375, 768, and 1440 px visual checks pass.
- Keyboard, reduced-motion, sound, hints, reset, and corrupt-save checks pass.
- `/review` finds no unresolved critical or high-severity issue.
- The final report lists exact evidence and any owner-only remaining action.
