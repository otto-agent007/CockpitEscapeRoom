# Workspace Workflow

CockpitEscapeRoom now uses one active development workspace on this computer.

The previous strict Windows/Ubuntu path ownership model is retired. Agents may edit application code, tests, docs, asset-pipeline files, deployable models, reports, and validation records when the current task requires it.

## Current Rules

- Inspect Git status before editing and preserve unrelated local work.
- Keep generated deployable GLBs under `public/models/**`; never hand-edit GLB contents.
- Keep Blender sources, staged outputs, asset reports, preview renders, runtime contracts, app code, tests, and `TEST_REPORT.md` in sync for visual/runtime milestones.
- Record source/license status for every external or owner-supplied production asset.
- Continue using asset gates and owner visual approval before treating cockpit art as final production quality.
