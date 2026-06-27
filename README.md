# CockpitEscapeRoom

A personalized, family-first 3D browser escape room honoring Dad as a highly capable former airline pilot.

The current narrative direction is:

1. **Airbus A320 First-Officer Mode** — accessible drag-and-drop onboarding.
2. **Locker Room / Captain’s Locker** — personal reveal space and memory-gate progression.
3. **Pop T Captain Mode in DC-9** — earned legacy cockpit challenge.
4. **Model Y reveal** — personal reward reveal.
5. **Optional Mars Easter egg** after the ending.

The DC-9 and Airbus experiences are non-operational fiction, built as respectful family tribute gameplay.

## Run it

```bash
nvm use
npm install
npm run dev
```

Open the local URL printed by Vite.

## What this repo contains now

- Game design source-of-truth in [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md)
- Current production rules and architecture in [`AGENTS.md`](AGENTS.md) and [`docs/CODEX_WORKFLOW.md`](docs/CODEX_WORKFLOW.md)
- Progress tracking and milestones in `plans/`
- Airbus reference photos, system notes, and loading/intro copy in [`art-source/references/a320`](art-source/references/a320) (`airbus_reference_notes.md`).
- Game state and persistence logic in `src/game/`
- 3D scenes and interaction entry points in `src/scenes/`
- Blender and asset pipeline under `tools/blender/`, `art-source/`, `public/models/`, and `asset-reports/`

## Verify it

```bash
npm run check
npm run test:e2e
npm run assets:check
```

Use `npm run dev` and confirm:

- The modern First-Officer onboarding flow runs and gives safe retry/hint behavior.
- The locker scene reveal sequence unlocks **Pop T Captain Mode** only after required interactions.
- The DC-9 Captain progression preserves completed progress on wrong answers.
- The red Tesla reveal stays hidden until the Captain Mode completion.
- The final message and hidden Mars payoff remain optional and separate.

## Start with Codex

1. Read [`AGENTS.md`](AGENTS.md), [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md), and current `plans/`.
2. Open the repository in Codex and run the real checks (`npm run check`, `npm run test:e2e`, `npm run assets:check`) before implementation changes.
3. Update an active ExecPlan (`plans/`) as edits are made, and keep implementation changes scoped to one milestone at a time.
4. Preserve the player loop and safe retry behavior; avoid hard resets that erase completed milestones.

## Important boundaries

- The project name is **CockpitEscapeRoom**.
- Dad is portrayed as an expert pilot; the game is a legacy tribute, never an emergency failure scenario.
- The narrative is locked to `docs/GAME_DESIGN.md`; do not present the legacy reveal before the locker stage is complete.
- The DC-9 and Airbus flows must remain distinct and production-realistic in their own right.
- Private, personalized noncommercial builds may include owner-supplied or privately licensed aircraft, airline, and vehicle assets with explicit scope and consent.
- For any public or distributable release flow, only production aircraft, airline, or vehicle assets with an original-work or license record may be used.
- Use the official Blender MCP only for controlled scene inspection, cleanup, validation support, naming, pivots, metadata, preview renders, and export support.
- Do not use Blender MCP for uncontrolled broad rewrites of approved scenes or to bypass the asset-report and validation trail.
- Do not remove or rename the greybox label until visual approval milestones are passed.

See [`BLUEPRINT.md`](BLUEPRINT.md) for the detailed blueprint and delivery details.
