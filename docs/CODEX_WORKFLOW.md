# Codex workflow for CockpitEscapeRoom

Verified against official OpenAI Codex documentation on 2026-06-21.

## Operating principle

Treat Codex as a configured teammate, not a one-shot code generator. The repository carries durable context in `AGENTS.md`, complex work in living ExecPlans, and repeated workflows in scoped Skills.

## Prompt format

Every significant prompt should contain four explicit fields:

- **Goal:** the observable result.
- **Context:** relevant files, current behavior, references, screenshots, logs, and owner decisions.
- **Constraints:** architecture, visual realism, accessibility, privacy, licensing, performance, and scope limits.
- **Done when:** commands and player-visible behaviors that prove completion.

Use low reasoning for small mechanical edits, medium/high for multi-file changes, and the strongest available reasoning for production cockpit integration, difficult debugging, or long ExecPlans.

## Plan first

Use Codex Plan mode for complex, ambiguous, or visually consequential work. The first production DC-9 milestone should begin with an ExecPlan in `plans/`. Planning is not the finish line: after owner review of the approach, Codex should continue through implementation and evidence collection.

## Durable instructions

`AGENTS.md` is kept practical and repo-specific. Nested guidance may be added under asset or application directories if local rules become necessary. When Codex repeats the same mistake, conduct a short retrospective and update the smallest durable guidance file that prevents recurrence.

## Skills

The pack includes four repo-local Skills:

- `$cockpit-feature` for implementing and validating a game feature or puzzle.
- `$blender-web-assets` for validating, exporting, inspecting, and integrating a Blender asset.
- `$loop-doctor` for auditing, diagnosing, and minimally repairing an existing workflow loop, prompt loop, asset pipeline loop, or agent handoff loop.
- `$loop-discovery` for mining repo evidence and authorized coding-thread history for recurring work that should become a loop or Skill.

Use explicit invocation while the workflows are new. After the descriptions prove reliable, Codex may select them implicitly.

## MCP decision

Do not start with a general-purpose Blender MCP. The current need is a repeatable local workflow, so Skills plus deterministic scripts are the first tool.

Add a narrow MCP only after the same manual loop is repeated often and the command-line implementation is stable. The allowed future tool surface is:

- `scene_inventory`
- `validate_scene`
- `render_preview`
- `export_glb`

Do not expose arbitrary Python, shell, file-write, or “edit anything in Blender” tools.

## Implementation and repair loop

For each milestone:

1. **Review:** inspect the current behavior, active plan, diff, and known failures.
2. **Focused repair or implementation:** make a bounded change.
3. **Execute and validate:** run the real app, tests, and asset checks.
4. **Calculate the remaining delta:** record exactly what still fails or remains unapproved.
5. **Repeat using evidence:** the next pass receives the latest validation output, not just the original prompt.

Stop when all acceptance checks pass, the maximum planned iterations are reached, the remaining delta stops changing, or a human visual/product decision is required. Preserve the audit trail in the ExecPlan and `TEST_REPORT.md`.

## Testing and review

Codex must run relevant tests, lint, types, build, browser interactions, and visual checks. It must inspect the complete diff and use `/review` or equivalent review behavior before declaring a milestone complete.

A useful final report contains:

- Files changed.
- Commands actually run.
- Pass/fail results.
- Browser and viewport checks.
- Asset sizes and validation findings.
- Personalization placeholders.
- Remaining limitations.

## GitHub workflow

Use a branch per milestone. Commit only coherent checkpoints. Open a pull request, review the Vercel preview, and use Codex review on the PR. Never merge solely because the code compiles; visual gates require owner approval.

## Official references

See `docs/SOURCES.md` for the current official Codex documentation used to design this workflow.
