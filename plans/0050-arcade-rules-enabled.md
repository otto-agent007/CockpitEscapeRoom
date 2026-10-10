# Enable the approved arcade rules

## Purpose

The arcade opens with the owner-approved collision boxes and impact pauses enabled. Reset and reload retain these shipped defaults, while both switches remain available for comparisons.

## Current state

At checkpoint `2777914`, the owner has accepted the regional combat hurtboxes. Code defaults and `marsArcadeTuning.json` still disable bounds and hit stop. The existing Oracle walk remains selected. The owner explicitly requested both rules on on 2026-10-03.

## Scope

Enable both defaults, preserve legacy version-1 tuning behavior, correct any presentation assumptions exposed by activation, and refresh relevant unit and browser proofs. Preserve all drawings, boxes, move timing, damage, and the rejected walk candidate.

## Context and constraints

Use the existing animation table and deterministic 60 Hz rules. No new dependencies or production integration. Work in `.worktrees/animation-workflow` on port 5360; preserve unrelated work and isolate evidence under `preview-renders/mars-arcade/rules-enabled-2026-10-03`. The arcade-animation skill's box review gate was fulfilled by the owner before this task.

## Progress

- [x] 2026-10-03 — Verified clean worktree and explicit authorization for both rules.
- [x] 2026-10-03 — Defaults, reset, and legacy migration covered by tests.
- [x] 2026-10-03 — Both defaults enabled; guard anticipation repaired without retuning.
- [x] 2026-10-03 — Six browser proofs pass; responsive and reduced-motion evidence captured.
- [x] 2026-10-03 — Full checks, fresh-context review, metadata preservation and evidence complete.

## Discoveries

- Version-1 migration currently copies the baked defaults. It must explicitly keep its historical disabled rules when the baked defaults change.
- Heavy guard anticipation previously tested legacy reach. Bounds extend a heavy's contact distance, and Oracle's low sweep bypasses standing guard. Four mirrored regression cases failed before the cue repair and pass afterward.
- Enabling both rules exposed implicit legacy assumptions in existing fixtures: 25 tests initially failed. Legacy reach assertions now explicitly select disabled rules; current reaction/exchange tests account for the existing freezes instead of weakening timing/damage assertions.
- The additional native heavy-guard proof initially assumed forward walk speed for a backward shuffle and then omitted the move-start tick. Actual readouts confirmed the slower backward step and contact after move-frame zero plus 11 startup ticks; the proof now measures the gap and uses the actual move timeline.

## Decision log

- 2026-10-03 — Both code and shipped tuning defaults become enabled so reset and startup agree. Legacy version-1 imports keep both disabled, preserving saved behavior.
- 2026-10-03 — Existing legacy timing/distance assertions remain meaningful through explicit rule fixtures; new default behavior receives direct integration coverage.

## Milestones and implementation steps

1. Pin enabled defaults and reset in `marsArcadeBoundsRules.test.ts`; observe failure before changing defaults.
2. Update `marsArcadeFighters.ts`, `marsArcadeTuning.json`, migration in `marsArcadeTuning.ts`, and arcade help text.
3. Repair any guard presentation or proof assumptions against actual behavior, retaining legacy comparison coverage.
4. Validate the actual harness and gym, review the full diff, and update `TEST_REPORT.md` with concrete evidence.

## Validation plan and acceptance criteria

Run focused rule/presentation tests and `npm run check`, plus `npm run arcade:validate`. Browser proof must show both switches enabled on load, reload and reset; an out-of-legacy-reach jab connecting through boxes; hit stop holding frame, pose and timer then resuming; low sweep defeating standing guard; switches-off legacy comparisons; candidate walk still off; no overflow at 375, 768 and 1440 px; reduced motion suppressing flash while preserving freeze. Run gym/playground and nearby heavy/exchange proofs as relevant. Record failures and reruns without claiming unrun checks passed.

## Repair loop and stop conditions

Review, repair the root cause, rerun the failing check and nearby checks. Bound to three substantial repair rounds before recording an unresolved delta. Stop when all acceptance checks pass or a genuine owner decision is required. No remote publication is included.

## Evidence

- RED: default/reset tests failed on disabled defaults; four mirrored guard-cue tests failed on the reach-only brace logic.
- GREEN: focused five-file suite 101 tests; `npm run check` passes lint, types, 888 tests / 74 files, and build. `npm run arcade:validate` reports 0 errors / 7 existing cosmetic/candidate review warnings.
- Browser commands: `check-arcade-bounds-rules.mjs`, `check-arcade-gym.mjs`, `check-arcade-playground.mjs`, `check-arcade-exchange.mjs`, `check-arcade-heavy.mjs`, `check-arcade-heavy-hit.mjs`, all using `ARCADE_PILOT_URL=http://127.0.0.1:5360/dev/arcade.html`, gym URL on the same port, and isolated evidence directories.
- Final bounds proof passes eight assertions/report groups: enabled load/reset/reload, legacy jab whiff, box jab hit and 2-frame freeze, 44.8 px heavy guard beyond legacy reach and 4-frame freeze, sweep guard bypass vs legacy block, 375/768/1440 controls, reduced-motion freeze without flash, no console errors.
- Gym 13 ok, playground 7 ok, exchange 5 PASS, heavy 13 PASS, heavy-hit 6 PASS. Oracle standing-block heavy cases explicitly use legacy bounds-off comparison; default-on low-sweep behavior is separately verified.
- Captures inspected at 375/768/1440, including low-sweep contact and heavy guard contact. Evidence logs and reproduction commands: `preview-renders/mars-arcade/rules-enabled-2026-10-03/README.md`.
- Fresh-context reviewer found no critical/high findings or actionable regressions. `git diff --check` and proof-script lint pass. Independent JSON comparison confirms only two tuning flags changed; animation metadata and sprite/source art are unchanged.

## Outcome and handoff

Both rules are enabled and verified in the local dev harness. Owner playtesting can continue with the existing Oracle walk and accepted combat boxes. Cosmetic heavy-block/outcome boxes and Captain move art remain future work. No remote publication or production cabinet integration occurred.
