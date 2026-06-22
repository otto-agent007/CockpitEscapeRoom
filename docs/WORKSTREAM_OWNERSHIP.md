# Workstream Ownership

This file prevents the Linux/Codex workspace and the Windows workspace from editing the same project surfaces at the same time. Update it before starting a new milestone or when ownership changes.

## Current Workstreams

| Workstream | Primary owner | Branch pattern | Owned files and surfaces | Handoff signal |
|---|---|---|---|---|
| Reference library and source records | Shared, but one editor at a time | `blender/dc9-reference-*` | `art-source/references/**`, `tools/references/**`, `docs/VISUAL_REALISM.md` reference-policy updates | Draft PR with generated contact sheet and `npm run references:check` evidence |
| Blender source asset pipeline | Linux/Codex workspace unless reassigned | `blender/dc9-pipeline-*` | `art-source/blender/*.blend`, `tools/blender/**`, `tools/assets/**`, `asset-reports/**`, `public/models/*.glb` | Draft PR with Blender version, asset report, preview render, and `npm run asset:*` evidence |
| Browser game integration | Linux/Codex workspace unless reassigned | `feature/game-*` or `blender/*-browser-*` | `src/**`, `e2e/**`, `playwright.config.ts`, app-facing model loaders | Draft PR with `npm run check`, browser screenshots, and relevant e2e evidence |
| Windows deployment and visual review | Windows workspace | `vercel/*`, `review/*`, or PR comments | Vercel project settings, preview deployment review, Windows-only screenshots, owner visual notes | PR comment with preview URL, screenshots, and approval or requested changes |
| Product copy and personalization | Owner or explicitly assigned agent | `content/*` | `docs/PERSONALIZATION_CHECKLIST.md`, `src/game/config.ts`, final family-facing copy | PR or issue comment identifying approved wording and remaining placeholders |

## Rules

- Start each task from the latest `origin/main` unless the task explicitly continues an open branch.
- Do not edit another active owner’s files without first recording the handoff in this file or in the active PR.
- Keep Blender source changes and browser integration changes in separate PRs unless the acceptance criteria require an end-to-end asset load.
- Generated deployable GLBs under `public/models/` are produced only by asset scripts. Do not hand-edit them.
- If both machines need the same file, choose one editor and have the other leave review comments instead of making parallel edits.
- Update `TEST_REPORT.md` and the active ExecPlan with actual commands run on the machine that ran them.
- A merge to `main` is the clean handoff point. After a merge, both machines should fetch and fast-forward before continuing.

## Conflict Procedure

1. Stop editing the conflicting file.
2. Run `git status -sb` and identify the branch, changed files, and owner.
3. Decide which machine owns the next edit.
4. Commit or stash the losing side only if its work is still useful; never overwrite unreviewed work.
5. Record the decision in the active PR or this file before continuing.

## Current Assignment

As of 2026-06-22:

- Linux/Codex workspace owns the next DC-9 pipeline-proof branch only after this coordination file lands.
- Windows workspace owns Vercel deployment verification and visual review feedback for merged or draft PRs.
- Neither machine should start final DC-9 cockpit production geometry until the pipeline proof and approval gate are complete.
