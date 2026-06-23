# Stage Handoff Loop Discovery

## Scope

Ubuntu/Blender-owned evidence inspected:

- `art-source/cockpit-pipeline/EXEC_PLAN.md`
- `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`
- `asset-reports/cockpit-pipeline/dc9-three-agent-foundation.md`
- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/source-job-report.md`
- `asset-reports/cockpit-pipeline/dc9-vslice-assembly/assembly-report.md`
- `asset-reports/cockpit-pipeline/dc9-vslice-shading/shading-report.md`
- `tools/blender/AGENTS.md`
- `tools/blender/cockpit_pipeline/pipeline_cli.py`
- `tools/blender/cockpit_pipeline/prompts/agent1-sourcing.md`
- `tools/blender/cockpit_pipeline/prompts/agent2-assembly.md`
- `tools/blender/cockpit_pipeline/prompts/agent3-shading.md`

Relevant read-only cross-boundary docs inspected:

- `AGENTS.md`
- `docs/WORKSTREAM_OWNERSHIP.md`
- `docs/CODEX_WORKFLOW.md`
- `docs/MCP_AND_SKILLS.md`
- `docs/VISUAL_REALISM.md`
- `docs/ASSET_CONTRACT.md`
- `docs/BLENDER_PIPELINE.md`
- `.agents/skills/loop-discovery/SKILL.md`
- `.agents/skills/loop-doctor/SKILL.md`
- `.agents/skills/blender-web-assets/SKILL.md`

Coding-thread history was not available as a local tool, so this discovery uses repository evidence only.

## Candidates

1. Stage handoff validation loop - Proven
   - Evidence: the foundation, source, assembly, and shading reports repeat preflight, manifest or transition validation, bounded stage execution, output manifest verification, preview inspection, and report updates.
   - Feedback cycle: read fresh branch/input/approval/manifest state, choose validate-only or stage execution, verify with CLI checks and preview evidence, record the handoff, then stop or advance.
   - Verification: `preflight`, `validate-job`, `validate-manifest`, stage-specific run command, unit tests, and visual preview inspection.
   - Stop condition: `success`, `clean no-op`, `approval-required`, `blocked`, or `no-progress`.
2. Preview/contact-sheet review loop - Potential
   - Evidence: source, assembly, and shading reports each require preview inspection, but the repository does not yet show a repeated repair cycle driven by preview failures.
   - Feedback cycle: inspect generated previews, repair framing/material/layout issue, rerender, record deviation.
   - Verification: preview paths and visual notes.
   - Stop condition: approval-required or no-progress.
3. Reference board and variant hygiene loop - Potential
   - Evidence: variant metadata appears in jobs and reports, and project rules forbid silent DC-9 variant mixing. Current evidence shows guardrails, not repeated repair cycles.
   - Feedback cycle: inspect candidate sources against variant metadata, reject or flag mixed geometry, update manifest/report.
   - Verification: source metadata and manifest fields.
   - Stop condition: clean no-op, blocked for owner variant decision, or rejected candidate.

## Recommendation

Convert the proven stage handoff validation loop by improving the existing three-agent playbook instead of creating a new Skill. The playbook is already the source of truth for Ubuntu pipeline agents, and the selected loop is narrower than `$blender-web-assets`.

## Loop Doctor

Verdict: Repair needed, then ready.

Diagnosis:

- The repeated stage cycle was distributed across reports and prompts, so the next agent could run a downstream job from stale or incomplete approval evidence.
- Verification was present in reports but not expressed as one reusable feedback loop with explicit terminal outcomes.
- The existing playbook had review gates but did not state a bounded action choice when the next stage is complete but not approved.

Result:

- Added `Stage handoff validation loop` to `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`.
- The repair is an unpublished CockpitEscapeRoom adaptation.
- Authority was not expanded: the loop stays inside Ubuntu-owned paths, does not modify browser code, does not hand-edit generated GLBs, and does not introduce broad Blender MCP behavior.

## Commands Run

| Command | Result |
|---|---|
| `git status --short --branch` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.preflight` | Pass; reported Blender 5.1.2 and dirty status as report-only |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-vslice-shading/manifests/shading-complete.json` | Pass; hashes verified |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pass, 5 tests |

## Remaining Limitation

No Blender scene, GLB, material, texture, or script was changed in this checkpoint, so no export, render, or browser preview was required. Human review is still required before any future `shading_complete` artifact is treated as final visual approval or production-ready.
