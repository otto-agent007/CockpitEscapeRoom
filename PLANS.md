# CockpitEscapeRoom ExecPlans

An ExecPlan is a self-contained, living implementation document for a complex feature or milestone. A contributor should be able to restart the work using only the repository and the current plan.

## When to use one

Use an ExecPlan for production cockpit assets, a new puzzle, a major scene transition, persistence migrations, accessibility redesigns, asset-pipeline changes, deployment changes, or multi-file refactors.

## Required qualities

An ExecPlan must:

- Explain the player-visible purpose before implementation details.
- Define unfamiliar terms in plain language.
- Name the exact files and commands involved.
- Describe the current behavior and the desired behavior.
- Contain observable acceptance criteria.
- Include a bounded implementation-and-repair loop.
- Stay current as discoveries and decisions occur.
- Record actual validation evidence rather than predicted results.
- Leave a clear handoff if human approval is required.

## Template

Copy this structure into `plans/NNNN-short-name.md`.

```md
# <Milestone name>

## Purpose

Describe what the player or maintainer can do after this work and why it matters.

## Current state

Describe the behavior that exists now, including relevant files and known limitations.

## Scope

State what is included and explicitly excluded.

## Context and constraints

Record architecture, realism, accessibility, performance, privacy, and personalization requirements.

## Progress

- [ ] Timestamp — concrete checkpoint

## Discoveries

Record unexpected behavior, measurements, reference gaps, or implementation facts with evidence.

## Decision log

- Decision, rationale, date, and consequences.

## Milestones

Describe each milestone as an observable result, not merely a list of code edits.

## Implementation steps

Name the files, functions, Blender objects, commands, and expected outputs.

## Validation plan

Describe unit, browser, visual, persistence, accessibility, asset, and performance checks. Include correct and incorrect paths.

## Acceptance criteria

State exact player-visible or command-verifiable results.

## Repair loop and stop conditions

Repeat review → focused repair → execution/validation → remaining-delta review. Stop when all acceptance checks pass, the maximum attempts are reached, the delta stops shrinking, or owner approval is required.

## Evidence

Record commands, outputs, screenshots, preview URLs, and unresolved findings.

## Outcome and handoff

Summarize what works, remaining placeholders, and the next approved milestone.
```
