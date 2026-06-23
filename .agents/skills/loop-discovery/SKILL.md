---
name: loop-discovery
description: Mine CockpitEscapeRoom repository evidence, Codex tasks, plans, runbooks, CI, asset reports, and authorized coding-thread history for recurring work that should become a feedback loop or repo-local Skill. Use when asked to discover loops, reduce repeated agent work, or turn repeated manual review into a durable workflow.
---

# Loop Discovery

Adapted from Forward Future Loop Library `Loop Discovery` reference for CockpitEscapeRoom.

Use this skill when asked to mine the repository, coding-thread history, or both for work that should become a loop. Do not treat every repeated task as loop-worthy. A valid loop needs fresh evidence, bounded action, verification, and a terminal state.

## Required reading

1. `AGENTS.md`
2. `docs/CODEX_WORKFLOW.md`
3. `docs/MCP_AND_SKILLS.md`
4. `docs/WORKSTREAM_OWNERSHIP.md`
5. Relevant plans, prompts, runbooks, CI files, asset reports, `TEST_REPORT.md`, and existing Skills

## Inspect the evidence

1. Confirm the smallest discoverable scope from the user's request.
2. Inspect the current repository when it is in scope. Focus on operational paths that reveal recurring work:
   - package scripts,
   - CI and deployment configuration,
   - maintenance commands,
   - test and browser validation patterns,
   - contributor instructions,
   - issue and PR templates,
   - runbooks,
   - ExecPlans and asset reports,
   - repeated lifecycle patterns in Windows and Ubuntu workstreams.
3. Use coding-thread history only when the user has authorized it and the tool is available. If unavailable, continue with repo evidence and disclose the limitation.
4. In threads, identify completed actions and outcomes. Group semantically equivalent work, count distinct occurrences, and record compact source handles such as thread title, PR, plan ID, or report path. Do not copy secrets or unnecessary private content.
5. Corroborate thread claims against repository files or runtime evidence when practical. Treat old thread history as possibly stale.

## Qualify and rank candidates

A candidate is loop-shaped only when all of these are present or can be derived from scoped evidence:

- a recurring event or state to observe;
- a next action that can change in response to fresh feedback;
- an observable check for whether the action helped;
- a bounded scope plus a clear `success`, `clean no-op`, `blocked`, `approval-required`, or `no-progress` stop.

Require at least two distinct occurrences before describing a thread-derived task as repeated. A codebase pattern without run history may be reported as a potential loop, but not as proven recurrent.

Reject one-shot migrations, straight-line checklists, vague goals, tasks where another pass receives no new evidence, and broad loops that bundle unrelated Windows and Ubuntu ownership areas.

Rank qualified candidates by:

1. evidence of recurrence;
2. cost of failure or wasted time;
3. quality of available feedback;
4. reversibility and safety;
5. fit with CockpitEscapeRoom's current Skills-first strategy.

Do not invent frequency, effort saved, owners, schedules, metrics, permissions, or tool capabilities.

## Convert the best candidate

1. Search existing repo-local Skills and docs before creating a new workflow.
2. Adapt a strong existing match instead of duplicating it.
3. If candidates differ materially in authority, risk, or workstream ownership, show a short ranked slate and ask which one to convert.
4. Otherwise convert the strongest candidate directly.
5. Derive the trigger, fresh observation, bounded action, reproducible verification, record, and terminal behavior from evidence.
6. Run a Loop Doctor-style preflight on the drafted loop. Repair material weaknesses before delivery without expanding authority.
7. Label new workflows as unpublished CockpitEscapeRoom designs or adaptations until reviewed.

## Output

```markdown
## Loop Discovery

Scope:
- [Repository paths, plans, reports, PRs, or thread sources inspected.]

Candidates:
1. [Name] — Proven | Potential | Rejected
   - Evidence:
   - Feedback cycle:
   - Verification:
   - Stop condition:

Recommendation:
[Convert the strongest candidate, show a ranked slate, or report clean no-op.]

Loop or Skill draft:
[Use CockpitEscapeRoom Skill format when creating a repo-local Skill.]

Evidence limits:
- [Unavailable thread history, runtime checks not run, or approval needed.]
```
