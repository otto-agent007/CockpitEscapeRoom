# Workstream ownership

This file defines strict path-based ownership for parallel Windows and Ubuntu workspaces.

## Current parallel ownership model

### What changed

The previous runtime-owner model is replaced with strict path-based write ownership so Windows and Ubuntu can run concurrently on separate branches.

### Scope

- Windows and Ubuntu may work at the same time on separate branches.
- Each workspace has **exclusive write ownership** of its listed paths.
- Neither workspace may edit files owned by the other workspace.
- The non-owning workspace must request cross-boundary changes through the active PR, issue, or review comments.
- Paths not listed in either ownership group are **frozen during the parallel run** unless the active PR records a one-off owner and explicit scope exception.
- This file edit is a one-off Windows-owned coordination change.
- Both branches should start from current `origin/main`.
- Each workspace should commit only files inside its ownership boundary.
- Before merging, inspect the changed-file list and remove any accidental cross-boundary edits.
- After either branch merges, the other workspace must fetch and incorporate the new `main` before final integration or merge.
- A merge to `main` is a handoff point, but it does not prevent both workspaces from continuing independent work in parallel.

## Exclusive write ownership

| Workspace | Owned paths | Notes |
|---|---|---|
| Windows | `src/**`, `tests/**`, `e2e/**`, `.github/**`, `package.json`, `AGENTS.md`, `TEST_REPORT.md` | Browser/application implementation, tests, CI configuration, package scripts, agent guidance, consolidated reporting. |
| Ubuntu | `art-source/**`, `tools/blender/**`, `public/models/**`, `asset-reports/**`, `preview-renders/**` | Asset source, Blender tooling/runtime-export contracts, generated deployable models, render reports. |

## Current assignment

- Windows owns browser/application implementation, automated tests, end-to-end tests, CI configuration, package scripts, repository agent guidance, and the consolidated `TEST_REPORT.md`.
- Ubuntu owns Blender source assets, Blender tooling, generated models, asset reports, and preview renders.
- Both workspaces are authorized to proceed concurrently within these boundaries.
- Final DC-9 production geometry remains gated by existing pipeline-proof and visual-approval requirements.

## Asset/runtime contract

- Ubuntu owns production and validation of generated assets under `public/models/**`.
- Windows owns application code that consumes those assets under `src/**`.
- Windows must never hand-edit generated GLB files.
- Ubuntu must not modify loaders, application behavior, browser tests, CI, or package scripts.
- Any changes to asset filenames, object names, hierarchy, pivots, animations, materials relied upon by the app, or `game_id` custom properties must be documented in the Ubuntu PR.
- Windows should integrate only documented asset contracts.
- Cross-boundary changes must be split into separate commits or PRs by the owning workspace.

## Validation and reporting

- Ubuntu records Blender versions, asset commands, validation results, asset reports, and preview renders in owned paths and PR description.
- Windows owns `TEST_REPORT.md` as the consolidated report.
- Windows may copy or summarize Ubuntu’s reported evidence into `TEST_REPORT.md`, but must not claim a command was run on Windows when it was run on Ubuntu.
- Each PR must identify the workspace, branch, owned paths changed, commands actually run, and any requested cross-boundary follow-up.

## Runtime path rule

- If a requested change affects both boundaries, split it into ownership-correct commits/PRs and request follow-up for the owning side.
