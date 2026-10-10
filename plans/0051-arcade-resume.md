# Arcade and gym resume checkpoint — 2026-10-03

## Saved state

Worktree: `/mnt/2TBHDD/CockpitEscapeRoom/.worktrees/animation-workflow`.
Branch: `fix/arcade-tooling-continuation`.
Implementation checkpoint: `5e4d703bd56019c2e30df63104c700c302c6a153`.
Verified base: `9b0743fe005f77428631427cef3c9348c0ae8018` (`origin/main` at save time).
This guide is committed after the implementation checkpoint. The recovery bundle includes
the guide commit; its README records the exact final tip and prerequisites.

The owner requested "save everything" after accepting both enabled rules. Preserve these
decisions when resuming:

- Keep the existing Oracle walk. The video walk candidate was rejected and stays off.
- The current combat boxes feel good for now. All 15 revised clips / 51 frames are marked
  reviewed for continued work.
- Bounds and hit stop are enabled in both baked and shipped defaults, including reset
  and reload. Version-1 tuning imports keep their historical disabled rules.
- Existing drawings, holds, phases, attack/guard boxes, damage and other balance numbers
  were preserved during rule activation.
- The arcade-animation skill is the agent's workflow checklist; the owner uses the gym
  and playground to judge the result.

## Start again

Inspect the actual worktree before relying on this historical checkpoint:

```sh
cd /mnt/2TBHDD/CockpitEscapeRoom/.worktrees/animation-workflow
git status --short --branch
git log -5 --oneline
npm run dev -- --host 127.0.0.1 --port 5360 --strictPort
```

If port 5360 is already serving this worktree, reuse the listener.
Arcade: `http://127.0.0.1:5360/dev/arcade.html`.
Gym: `http://127.0.0.1:5360/dev/gym.html`.
The root URL opens the main game. These arcade pages remain dev-only.

Read `plans/0050-arcade-rules-enabled.md`, `TEST_REPORT.md`, and
`.agents/skills/arcade-animation/SKILL.md` before continuing animation work.
Plans 0048/0049 and the box report explain the preceding tooling and box checkpoints.

## Saved validation and evidence

At implementation checkpoint `5e4d703`, `npm run check` passed lint, types, 888 tests in
74 files, and build. `npm run arcade:validate` reported 0 errors and 7 existing review
warnings. Six actual browser proofs passed: bounds/rules, gym, playground, exchange,
heavy poses, and heavy-hit reactions. Responsive checks cover 375/768/1440 and reduced
motion; fresh-context diff review found no critical/high findings or actionable regressions.
Saving this guide changes no application behavior, so those checks were recorded rather
than rerun as new results.

- Rule evidence and reproduction commands:
  `preview-renders/mars-arcade/rules-enabled-2026-10-03/README.md`.
- Box before/after comparisons and acceptance proof:
  `preview-renders/mars-arcade/box-review-2026-10-03/`.
- Approved animation metadata: `src/game/marsArcadeAnimations.json`.
- Shipped tuning: `src/game/marsArcadeTuning.json`.
- Art and generated candidates: `art-source/arcade/`, tracked in Git.

## Recovery

Local recovery directory:
`/mnt/2TBHDD/CockpitEscapeRoom/.worktrees/animation-workflow/.cache/checkpoints/mars-arcade-20261003T223423Z/`.

It contains a Git bundle of this continuation branch since the verified base, an exact
Git snapshot manifest for the scoped arcade files, the resume guide, and SHA-256 checks.
The bundle's base history must be present when restoring into a repository. Follow its
README; fetch into a new recovery branch rather than replacing unrelated working changes.
This recovery copy is on the same disk as the workspace. No remote publication is part
of this save request.

## Remaining work

Resume with owner playtesting of the enabled rules. Remaining art/review work includes
cosmetic heavy-block/victory/knockout boxes and Captain move art. The rejected Oracle
candidate remains unapproved. Production cabinet integration and complete-game visual
approval remain separate future milestones; do not treat this dev checkpoint as either.
The root checkout is on `feat/cockpit-orientation-copy`; preserve its unrelated work.
