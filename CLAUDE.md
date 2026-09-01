# CockpitEscapeRoom

A personalized browser escape room honoring an expert pilot who began on the McDonnell Douglas DC-9 and later flew Airbus aircraft. `AGENTS.md` holds the full guidance; this file is the always-loaded subset.

The project is named **CockpitEscapeRoom**. Never rename it or reintroduce earlier working titles.

## Journey order — do not reorder or rename

Automatic console-era cinematic → cinematic **PRESS START** → **DC-9 First-Officer Final Flight Log** from the right seat, including the fictional Memphis memory departure → locker reveal → **Enter Pop T Captain Mode** → **Airbus A320 Pop T Captain** gameplay from the left seat → red Tesla Model Y reward → **Flight Mode** transformation → hidden Mars mission, an optional Easter egg after the main ending.

**Tone contract:** the present-day tribute aircraft is safely parked. The taxi and takeoff are explicitly labeled as a fictional 1995 memory recreation. Never frame Dad as causing an accident, emergency, or systems failure.

## Read before changing code

`BLUEPRINT.md`, then `docs/GAME_DESIGN.md`, `docs/VISUAL_REALISM.md`, `docs/CODEX_WORKFLOW.md`, `docs/WORKSTREAM_OWNERSHIP.md`, then the closest applicable `AGENTS.md` (there is one at `tools/blender/AGENTS.md`) and the active ExecPlan. Reusable procedures live in `.agents/skills/*/SKILL.md`.

Inspect the tree and `git status` before editing. Preserve unrelated local work.

## Commands

Standard scripts are in `package.json`. The asset builds (`asset:dc9`, `asset:dc9-memphis`, `asset:airbus`, `asset:tesla`, `asset:locker`) additionally require `BLENDER_BIN` to be set and the source `.blend` files to be present.

## Never

- Never edit generated GLBs by hand. Blender masters live in `art-source/blender`, deployable GLBs in `public/models`.
- Never reveal the Model Y before the DC-9, locker, and Airbus chapters are complete — not via any asset, Flight Mode thumbnail, menu item, loading copy, hint, or achievement.
- Never mix Airbus A320 and DC-9-32 aircraft-specific details. The Airbus target is a separate A320-specific cockpit, not a recolored or rearranged DC-9-32.
- Never weaken a test to make it pass, and never claim an unrun check passed.
- Never add a production dependency without explaining it and requesting review.
- Never add analytics, accounts, uploads, paid APIs, or tracking. Personal data stays local.
- Never use Blender MCP for broad rewrites of approved scenes, or for edits that bypass the asset report and validation trail.
- Never run destructive GLB optimization until hierarchy and interaction regression tests prove it safe.

## Asset rules

- Stable object names, pivots, hierarchy, animations, and `game_id` custom properties are **public runtime contracts** — changing one breaks the app.
- Tripo AI is a rapid candidate/proxy generator only, never production authority, and must not silently override aircraft-specific references. Its output must be imported into Blender, cleaned, optimized, given stable object names, checked for pivots and local axes, and documented in `asset-reports/` before runtime use.
- Blender MCP is appropriate for scene inspection, controlled cleanup, validation, naming, pivots, metadata, preview renders, and export support.
- Keep generated assets separated by scene group: A320 Pop T Captain cockpit, locker room, DC-9-32 First-Officer cockpit, Memphis legacy environment, Model Y hangar reward and Flight Mode, Mars Easter egg.
- The DC-9-32 must be model-correct in major visible geometry — do not invent a generic retro cockpit. The greybox label was retired at owner request on 2026-08-23; do not reintroduce it.
- Record material count, texture sizes, optimization decisions, validation output, and preview-render evidence before treating an asset as production-ready.
- Flight Mode stays sleek, plausible-futuristic, and premium: clean mechanical panels, wing/stabilizer deployment, hidden lift fans or concealed propulsion accents, restrained lighting. No aggressive sci-fi styling, no humanoid robot transformation.
- Owner-approved airline artwork, logos, and textures may be used when they match the current scene group and asset authority.

## Architecture

- Keep game rules and content separate from Three.js presentation components.
- Mirror every required 3D interaction with a native HTML control or equivalent accessible path.
- Version persisted data and recover safely from corrupt or stale saves.
- Preload the production DC-9-32 and Memphis environment during the cinematic; lazy-load the locker, A320, vehicle, and Mars assets as their chapters unlock.
- Interactions are fictional and non-operational even when the cockpit looks authentic.

## Player loop

Observe → inspect → decide → feedback → safe retry or progressive hint → system restored → personal reward → advance.

Wrong answers may reset the current attempt but never erase completed puzzle progress.

## Validating a change

Use an ExecPlan following `PLANS.md` for complex features, asset-pipeline changes, large refactors, or anything spanning multiple files. Treat it as a living record: update progress, discoveries, decisions, validation evidence, and the remaining delta as work proceeds.

Test in a real browser, not only source. Exercise the success, failure, repeated-failure, hint, keyboard, reload, and reduced-motion paths relevant to the change, and check roughly 375, 768, and 1440 px widths. Record actual evidence in the ExecPlan and `TEST_REPORT.md`.

## Approval gates

Pause for owner review after: (1) DC-9-32 Final Flight Log interaction proof, (2) locker room reveal proof, (3) A320 Pop T Captain left-seat interaction proof, (4) complete reordered journey proof, (5) red Model Y reward and Flight Mode asset, (6) final complete-game review. Each visual gate should carry a Vercel preview and consistent screenshots.

Before presenting a milestone as complete: run the relevant checks, do a full-diff review, resolve all critical and high-severity findings, and report files changed, commands actually run, results, placeholders, and genuine limitations.
