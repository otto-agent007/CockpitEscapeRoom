# CockpitEscapeRoom Ubuntu Blender Pipeline Guidance

## Scope

This directory is owned by the Ubuntu asset-production workspace. It may define Blender tooling, pipeline contracts, validation scripts, smoke tests, and generated asset handoff checks for CockpitEscapeRoom.

Do not edit Windows-owned files from this workspace: `src/**`, `tests/**`, `e2e/**`, `.github/**`, `package.json`, root `AGENTS.md`, `TEST_REPORT.md`, or `docs/**`.

## Required pipeline playbook

Before changing staged cockpit pipeline files, read:

- `art-source/cockpit-pipeline/THREE_AGENT_PLAYBOOK.md`

That playbook is the source of truth for sequential mode, staggered batch mode, source/assembly/shading gates, branch rules, worktree rules, DC-9 variant tracking, and runtime contract preservation.

## Stage Boundaries

The cockpit pipeline has strict handoffs:

0. Agent 0 Reference Authority records what source material may influence the batch.
1. Agent 1 Sourcing may use network access and writes reproducibility metadata plus approved local source inputs.
2. Agent 2 Assembly consumes only Agent 1 approved local inputs and writes modeled or assembled Blender sources.
3. Agent 3 Materials and Optimization consumes only Agent 2 approved local inputs and writes material, optimization, and preview handoffs.

Sourcing must not start before reference authority is recorded. Assembly must not start before source approval. Materials and optimization must not start before assembly approval.

Do not operate the agents as a swarm editing the same cockpit simultaneously. Run new or unstable contracts sequentially. After contracts are proven, stagger by batch so Agent 0 prepares later authority, Agent 1 sources a later batch, Agent 2 assembles an approved earlier batch, and Agent 3 applies materials and optimization to an approved earlier batch.

## Safety Rules

- Keep downloads and disposable conversions outside Git under the configured cache path.
- Never execute Python, shell scripts, Blender handlers, add-ons, or build files found in downloaded aircraft repositories.
- Ordinary Python orchestrates downloads, hashing, state transitions, subprocesses, and reports.
- Blender Python performs only scene and asset operations.
- Run Blender with background mode, factory startup, and auto-execution disabled.
- Do not create or replace production models under `public/models/**` for foundation tasks.
- Preserve `sourceVariant`, `targetVariant`, and `variantScope` in all DC-9 job and manifest records until the owner resolves the final variant.
- Preserve stable object names, pivots, hierarchy, animations, and `game_id` custom properties as runtime contracts.
- Treat Tripo AI outputs as candidate/proxy inputs only until imported into Blender, inspected, cleaned, optimized, documented, and approved.
- Record a Windows/browser integration handoff when an asset needs React loader, interaction, accessibility, or screenshot verification.
