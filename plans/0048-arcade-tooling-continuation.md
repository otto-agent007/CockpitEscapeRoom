# Arcade tooling continuation

## Purpose and scope

Finish the remaining engineering queue in plan 0046: make the fighter playground's combat
fields easy to scan, make Vite's config load directly in Node, and let the frame picker
sample a first-last-frame video as one complete cycle without calculating a spacing.
The owner confirmed on 2026-10-03 that the shipped Oracle walk stays; neither video walk
replaces it. No new drawings, balance changes, paid generation, or production integration.

## Context and constraints

Worktree: `.worktrees/animation-workflow`, branch `fix/arcade-tooling-continuation`, based
on merged main `9b0743f`. PRs 99, 101, and 102 already contain the animation workflow,
box rules, hit stop, nudge, and candidate experiments. The old preview was behind main;
this continuation uses the merged implementation on port 5360. Both rule switches remain
at their existing shipped defaults. Gym box sign-off remains an owner decision.

## Tasks and acceptance criteria

1. **Combat console:** `src/dev/arcadePlayground.ts` and `dev/arcade-shell.css` group
   light/heavy/special controls with native fieldsets and a consistent three-column grid.
   All seven fields per move remain labeled, reachable, and editable at 375/768/1440 px,
   without horizontal overflow. Tuning/reset/save, keyboard, and reduced-motion paths
   retain their existing behavior. Use rendered browser evidence, not CSS assertions.
2. **Vite config:** fix the actual native-loading issues in `vite.config.ts` and its
   imported schema modules, using explicit TypeScript extensions and JSON attributes.
   `import.meta.dirname` anchors save destinations. Enable TypeScript extension imports
   in the app's no-emit config. Both bundled and native loaders start, including from a
   different working directory; schema validation still rejects invalid gym/tuning saves.
3. **First-last-frame picker:** `tools/assets/pick-arcade-frames.py --single-cycle` works
   only with `--policy cycle`, starts at frame zero, treats the final frame as the repeated
   first pose, and samples the preceding frames over the full cycle. Refuse conflicting
   spacing/start options and requests exceeding the available non-closing frames. Keep
   measured-period picking and action/hold behavior unchanged. Record the explicit cycle
   source in `selection.json`. Add meaningful synthetic-input and actual-video checks to
   `pick-arcade-frames.test.py`, and update the arcade skill's usage example.

## Progress and decisions

- [x] 2026-10-03: Verified main/PR state live; preserved the old branch and started this one.
- [x] Baseline `npm test -- --reporter=dot`: 74 files, 879 tests passed.
- [x] Owner decision: retain shipped Oracle walk; existing candidate stays an opt-in study.
- [x] Combat groups and rendered verification at 375/768/1440 px; 21 labeled fields,
  three columns, no overflow, keyboard/retry/reset/reload under reduced motion.
- [x] Native config loading from `/tmp` and both loaders' endpoint verification.
- [x] Single-cycle picker: RED/GREEN tests, 20 passing checks, archived-video picks 0/8/16/24.
- [x] Full checks, full-diff review and evidence recorded in TEST_REPORT.md.
- [x] Local checkpoint prepared for final handoff after validation and review.

Ruling: continue the existing approved engineering queue inline; the existing design and
owner's instruction to continue are the authority. No new feature-design approval is
needed. An explicit picker flag is preferable to guessing that matching endpoints prove
a single cycle; the default measured-period behavior stays unchanged.

Ruling: reject `--single-cycle --fps` because ffmpeg resampling can drop the promised
endpoint poses. This preserves the source cycle instead of inventing a duration. Cost:
this explicit mode requires the source frame rate; other picker modes still support `--fps`.

Discovery: valid save verification rewrites imported tuning and restarts both Vite previews.
The proof now polls through the expected restart. Initial ad hoc fixtures used `.clips`
instead of `.animations` and expected a validator status for a parser error; corrected to
the real schema and a hold-sum violation, without changing product validation.

## Validation and bounded repair loop

Run the picker regression script, focused arcade browser checks (gym/playground/bounds),
`npm run arcade:validate`, and `npm run check`. Use isolated evidence under
`preview-renders/mars-arcade/tooling-continuation-2026-10-03/` or `/tmp`, preserving existing
evidence. Verify the native and bundled config loaders, invalid save responses, and one
valid unchanged save/reload. Review the whole diff, then fix critical/high findings.
At most three repair passes per issue; stop for a genuine owner visual/balance decision.

## Evidence and handoff

`npm run check` passed lint/types, 879 tests / 74 files, and build. Picker tests: 20 checks.
Gym/playground/bounds browser suites: 13/7/6 ok. `arcade:validate`: 0 errors / 23 existing
warnings. Both config loaders' invalid and valid unchanged saves passed. Screenshots and
logs are under `preview-renders/mars-arcade/tooling-continuation-2026-10-03/`.

Independent review found the FPS combination defect; its regression failed before the
fix and passed afterward. A temporary closing-frame mutant is caught by the strengthened
test. No critical/high findings remain; no deferred minor implementation issues.

Runtime drawings, animation/tuning data, and rule defaults are byte-identical to the base.
The next queue is the owner's seeded-box review and feel decisions for the existing
optional box/hit-stop switches in plan 0047. The Oracle walk decision is settled.
