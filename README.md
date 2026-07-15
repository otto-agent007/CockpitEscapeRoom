# CockpitEscapeRoom

A personalized, family-first 3D browser escape room honoring Dad as a highly capable former airline pilot.

The current narrative direction is:

1. **DC-9 Final Flight Log** — a warm opening chapter with DTW/MSP/STL route memories, Momma Cheryl’s non-puzzle Home Operations Log, and a forgiving ceremonial shutdown.
2. **Locker Room / Captain’s Locker** — personal reveal space opened by the Captain’s Key.
3. **Existing Airbus A320 First-Officer Mode** — accessible drag-and-drop crew experience in the modern A320 cockpit.
4. **Model Y reveal and Flight Mode transformation** — personal reward reveal with sleek, plausible-futuristic wing/panel deployment.
5. **Father’s Day final message** — warm closing beat after the reward sequence.
6. **Optional Mars Easter egg** after the main ending.

The DC-9-32 and Airbus A320 experiences are non-operational fiction, built as respectful family tribute gameplay.

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
- Airbus A320 reference photos, system notes, and loading/intro copy in [`art-source/references/a320`](art-source/references/a320) (`airbus_reference_notes.md`).
- Game state and persistence logic in `src/game/`
- 3D scenes and interaction entry points in `src/scenes/`
- Blender and asset pipeline under `tools/blender/`, `art-source/`, `public/models/`, and `asset-reports/`
- Durable Tripo source-quality and visual-repair guidance in [`TripoAssetLessons.md`](TripoAssetLessons.md)
- Locker memory props follow the ordered reveal: watch, baseball question, Charging Bull, Wings, then captain's hat.

## Verify it

```bash
npm run check
npm run test:e2e
npm run assets:check
```

Use `npm run dev` and confirm:

- The DC-9-32 Final Flight Log accepts DTW/MSP/STL, preserves completed stamps and shutdown steps, and presents Momma Cheryl’s record only as recognition.
- The Captain’s Key opens the locker, and the completed locker continues to the unchanged Airbus A320 First-Officer experience.
- The Airbus assignment, retry, keyboard, ATP, and persistence behavior still works after the reorder.
- The red Tesla Model Y reveal stays hidden until the DC-9 → locker → Airbus journey is complete.
- The Model Y Flight Mode transformation is a reward beat, not required puzzle information.
- The final message and hidden Mars payoff remain separate.

## Start with Codex

1. Read [`AGENTS.md`](AGENTS.md), [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md), and current `plans/`.
2. Open the repository in Codex and run the real checks (`npm run check`, `npm run test:e2e`, `npm run assets:check`) before implementation changes.
3. Update an active ExecPlan (`plans/`) as edits are made, and keep implementation changes scoped to one milestone at a time.
4. Preserve the player loop and safe retry behavior; avoid hard resets that erase completed milestones.

## Important boundaries

- The project name is **CockpitEscapeRoom**.
- Dad is portrayed as an expert pilot; the game is a legacy tribute, never an emergency failure scenario.
- The narrative is locked to `docs/GAME_DESIGN.md`; the required order is DC-9 → locker → existing Airbus → Model Y reward.
- The chosen production aircraft targets are **McDonnell Douglas DC-9-32** for the opening Final Flight Log and **Airbus A320** for the later First-Officer experience.
- The DC-9-32 and Airbus A320 flows must remain distinct and production-realistic in their own right.
- This is a private, personal build that will not be distributed, so it may freely use owner-supplied aircraft, airline, and vehicle assets.
- Use the official Blender MCP only for controlled scene inspection, cleanup, validation support, naming, pivots, metadata, preview renders, and export support.
- Do not use Blender MCP for uncontrolled broad rewrites of approved scenes or to bypass the asset-report and validation trail.
- Do not remove or rename the greybox label until visual approval milestones are passed.
- Narrow layouts must remain functionally accessible, but dedicated mobile composition, visual polish, and a mobile approval milestone are not part of the Final Flight Log milestone.

See [`BLUEPRINT.md`](BLUEPRINT.md) for the detailed blueprint and delivery details.
