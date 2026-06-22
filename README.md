# CockpitEscapeRoom

A personalized browser escape-room game built around a realistic McDonnell Douglas DC-9 cockpit, a separate realistic Airbus bonus cockpit, a red Tesla Model Y Captain Mode reward, and a hidden Mars mission.

This repository starts with a **working greybox vertical slice**, not final aircraft art. The slice proves the player loop, Crew/Captain modes, persistent progress, keyboard-accessible controls, the Memphis feeder-route flavor, the reward unlock, and the Mars Easter egg before time is spent on detailed Blender assets.

## Run it

```bash
nvm use
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verify it

```bash
npm run check
npm run test:e2e
npm run assets:check
```

## Start with Codex

1. Read [`START_HERE.md`](START_HERE.md).
2. Open the repository in Codex.
3. Use Plan mode for the first production milestone.
4. Paste [`prompts/00_BOOTSTRAP_CODEX.md`](prompts/00_BOOTSTRAP_CODEX.md).
5. Review the proposed ExecPlan before production cockpit modeling begins.

## Important boundaries

- The project name is **CockpitEscapeRoom**.
- Dad is portrayed as an expert pilot; the story is a commemorative legacy lockout, not a mistake or emergency he caused.
- The DC-9 and Airbus must be visually convincing, but puzzle procedures remain fictional and non-operational.
- The Airbus model and exact DC-9 variant are still confirmation items.
- Private, personalized noncommercial builds may include owner-supplied or privately licensed aircraft, airline, and vehicle assets with explicit scope and consent.
- For any public or distributable release flow, only production aircraft, airline, or vehicle assets with an original-work or license record may be used.
- Do not implement a Blender MCP until the command-line asset pipeline is proven reliable.

See [`BLUEPRINT.md`](BLUEPRINT.md) for the full product and delivery blueprint.
