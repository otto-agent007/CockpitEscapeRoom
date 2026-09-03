# CockpitEscapeRoom agent guidance

## Project identity

The repository and product are named **CockpitEscapeRoom**. Do not rename the project or reintroduce earlier working titles.

Build a fun, personalized browser escape room honoring an expert pilot who started on McDonnell Douglas DC-9 aircraft and later flew Airbus aircraft. A fresh or restarted game opens directly on the console-era cinematic, whose **PRESS START** handoff opens the **DC-9 First-Officer Final Flight Log** from the right seat, including the fictional 1995 Memphis memory departure. The locker reveal follows, and its **Enter Pop T Captain Mode** action opens **Airbus A320 Pop T Captain gameplay** from the left seat. The red Tesla Model Y reward unlocks after that Airbus chapter. A sleek near-future **Flight Mode** transformation follows with clean panel movement, wing/stabilizer deployment, hidden lift fans, and concealed propulsion accents. A hidden Mars mission remains an optional Easter egg after the main ending.

The present-day tribute aircraft is safely parked for a commemorative legacy flight; the taxi and takeoff are explicitly labeled as a fictional 1995 memory recreation. Never frame Dad as causing an accident, emergency, or systems failure.

## Read before changing code

Read, in order:

1. `BLUEPRINT.md`
2. `docs/GAME_DESIGN.md`
3. `docs/VISUAL_REALISM.md`
4. `docs/CODEX_WORKFLOW.md`
5. `docs/WORKSTREAM_OWNERSHIP.md`
6. The closest applicable `AGENTS.md`, Skill, and active ExecPlan

Inspect the existing tree and Git status before editing. Preserve unrelated work.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run test:e2e
npm run assets:check
```

Blender asset commands require `BLENDER_BIN` and source `.blend` files:

```bash
npm run asset:dc9
npm run asset:dc9-memphis
npm run asset:airbus
npm run asset:tesla
npm run asset:locker
```

## Plan requirements

For complex features, asset-pipeline changes, large refactors, or any milestone expected to span multiple files, use an ExecPlan that follows `PLANS.md`. Treat the plan as a living record. Update progress, discoveries, decisions, validation evidence, and the remaining delta as work proceeds.

Use Plan mode before implementation when the solution or acceptance criteria are not already explicit.

## Workspace rule

This project runs from one workspace. Agents may edit application code, tests, docs, asset pipeline files, generated deployable models, reports, and validation records when the task requires it.

Preserve unrelated local work. Inspect Git status before editing, do not hand-edit generated GLBs, and keep source/license, asset-report, ExecPlan, and `TEST_REPORT.md` evidence current for asset or browser milestones.

## Prompt contract

Every implementation task must establish:

- **Goal:** the observable player or maintainer outcome.
- **Context:** relevant files, screenshots, reference material, and current behavior.
- **Constraints:** architecture, safety, accessibility, performance, and scope boundaries.
- **Done when:** exact checks and behaviors that prove completion.

Resolve non-blocking ambiguity with an editable default and record the decision. Do not stop after writing a plan unless the task explicitly requests planning only.

## Player loop

Preserve this loop:

**Observe → inspect → decide → feedback → safe retry or progressive hint → system restored → personal reward → advance.**

Wrong answers may reset the current attempt but never erase completed puzzle progress.

## Implementation and repair loop

Work until the active acceptance checks pass. Validate with focused tests, lint, types, and build, then test in the actual browser rather than only in source: exercise the success, failure, repeated-failure, hint, keyboard, reload, and reduced-motion paths relevant to the change, and inspect approximately 375, 768, and 1440 px widths. Review the complete diff for regressions, unsafe DOM insertion, duplicate logic, broken asset contracts, and unnecessary dependencies. Fix root causes, rerun the failed checks plus nearby regression checks, and record actual evidence in the ExecPlan and `TEST_REPORT.md`.

Stop only when validation passes, a bounded maximum attempt count is reached, the remaining delta stops shrinking, or a genuine human visual/product decision is required. Never claim an unrun check passed.

## Architecture rules

- Keep game rules and content separate from Three.js presentation components.
- Mirror every required 3D interaction with a native HTML control or equivalent accessible path.
- Version persisted data and recover safely from corrupt or stale saves.
- Preload the production DC-9-32 cockpit and Memphis environment during the cinematic; lazy-load the locker, Airbus A320, vehicle, and Mars assets as their chapters unlock.
- Keep personal data local. No analytics, accounts, uploads, paid APIs, or tracking without explicit approval.
- Prefer no new production dependency. Explain and request review before adding one.
- Do not weaken tests merely to make them pass.

## Visual and asset rules

- The DC-9 panel carries no greybox or placeholder label.
- The DC-9-32 must be model-correct in major visible geometry; do not invent a generic retro cockpit.
- The Airbus target is **Airbus A320** and must be a separate A320-specific cockpit, not a recolored or rearranged DC-9-32.
- Interactions are fictional and non-operational even when the cockpit looks authentic.
- Tripo AI may be used only as a rapid candidate/proxy generator. Its outputs are not production authority and must not silently override aircraft-specific references.
- Tripo-generated assets must be imported into Blender before runtime use, cleaned, optimized, given stable object names, checked for pivots/local axes, and documented in `asset-reports/`.
- The official Blender MCP may be used for scene inspection, controlled cleanup, validation support, naming, pivots, metadata, preview renders, and export support.
- Do not use Blender MCP for uncontrolled broad rewrites of approved scenes or edits that bypass the asset report and validation trail.
- Keep generated assets separated by scene group: Airbus A320 Pop T Captain cockpit, locker room scene, DC-9-32 First-Officer cockpit, Memphis legacy departure environment, Model Y hangar reward and Flight Mode transformation, and Mars Easter egg.
- Do not mix Airbus A320 and DC-9-32 aircraft-specific details.
- Blender master files live under `art-source/blender` and generated deployable GLBs under `public/models`.
- Never edit generated GLBs by hand.
- Stable object names, pivots, hierarchy, animations, and `game_id` custom properties are public runtime contracts.
- Do not run destructive GLB optimization until hierarchy and interaction regression tests prove it safe.
- Record material count, texture sizes, optimization decisions, validation output, and preview-render evidence before treating a generated asset as production-ready.
- Preserve Model Y spoiler protection: no reward asset, Flight Mode thumbnail, menu item, loading copy, hint, or achievement may reveal the Model Y before the DC-9, locker, and Airbus chapters are complete.
- The Model Y Flight Mode transformation should stay sleek, plausible-futuristic, and premium: clean mechanical panels, wing/stabilizer deployment, hidden lift fans or concealed propulsion accents, restrained lighting, no aggressive sci-fi styling, and no humanoid robot transformation.
- Owner-approved airline artwork, logos, textures, and production assets may be used when they match the current scene group and asset authority.

## Approval gates

Pause for owner review after:

1. DC-9-32 Final Flight Log interaction proof.
2. Locker room reveal proof.
3. Airbus A320 Pop T Captain left-seat interaction proof.
4. Complete journey proof.
5. Red Model Y reward and Flight Mode transformation asset.
6. Final complete-game review.

A Vercel preview and consistent screenshots should accompany each visual gate.

## Review and completion

Before presenting a milestone as complete:

- Run the relevant checks.
- Use Codex `/review` or an equivalent full-diff review.
- Resolve all critical and high-severity findings.
- Report files changed, commands actually run, results, placeholders, and genuine limitations.
