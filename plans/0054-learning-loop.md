# Learning and recurrence prevention

## Purpose and scope

**Goal:** Future CockpitEscapeRoom work uses the lessons already learned and records new ones with a prevention check before retrying. The owner explicitly requested that we keep learning and avoid repeating mistakes.

**Context:** Plans 0052 and 0053 and their reports contain Captain anatomy, consistency, alignment, pixel fidelity, save-state and palette findings, but startup guidance did not explicitly require reading those lessons before the next attempt.

**Constraints:** Documentation only, within the existing animation-workflow worktree. Preserve art, live drafts, application behavior, historical evidence, owner decisions and approval boundaries. No global memory change, new skill, dependency, commit or publication.

**Done when:** Root agent guidance and workflow link to a scoped lesson log; entries connect actual failures to evidence and actionable prevention checks; all local links resolve and the diff has no unrelated changes or whitespace errors. Do not claim documentation guarantees future compliance.

## Progress

- [x] 2026-10-05 — Inspected active worktree/status, startup guidance, workflow and the latest Captain/gym findings.
- [x] Added a read-before-work/retry requirement and a record-feedback/root-cause requirement to AGENTS.md and docs/CODEX_WORKFLOW.md.
- [x] Added docs/LESSONS_LEARNED.md with current owner decisions, ten scoped prevention entries and evidence links.
- [x] Verified 24 local Markdown links, reviewed the complete documentation diff and recorded actual checks in TEST_REPORT.md.

## Decisions and remaining delta

Use one project lesson log discoverable from mandatory startup instructions; retain detailed attempts in the existing plans/reports. Separate causes from hypotheses and visual acceptance from automated checks. Repeatable software failures belong in meaningful regression tests; anatomy and visual polish need actual review. The October 4/5 art and implementation manifests remain historical snapshots and are not rewritten for this guidance-only change.

This task does not alter global long-term memory or claim perfect future recall. Art approval, jab frame data/combat adoption and automatic recovery of all timing/box state remain separate work. No runtime test rerun is required for documentation-only edits; existing test evidence is historical.

## Validation and repair loop

Check every relative Markdown link in the new log and updated guidance, inspect the documentation diff and run git diff --check. Review the guidance against the duplicate-arm, skipped-color, pixel-export and stale-owner-state cases: each must lead to a concrete pre-attempt check and point to supporting evidence. Correct broken links or unsupported claims before completion; limit wording repairs to two passes.

## Evidence and outcome

Node filesystem check: all 24 local Markdown links resolve across AGENTS.md, docs/CODEX_WORKFLOW.md, docs/LESSONS_LEARNED.md and this plan. `git diff --check` passes. Full documentation review found no critical/high issue or unsupported claim. Manual review against the duplicate-arm, skipped-color, pixel-export and stale-owner-state cases confirmed each has a concrete prevention check and linked evidence. No runtime suite was rerun for these documentation-only changes.

The lesson log is discoverable from mandatory startup guidance and the workflow, and the guidance now requires consulting relevant lessons before nontrivial changes/retries and recording meaningful feedback/root causes with prevention checks. Future compliance depends on following those instructions; documentation alone does not guarantee it. No application, asset, browser or skill behavior changed.
