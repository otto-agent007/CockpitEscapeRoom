# CockpitEscapeRoom Fast-Track Start

This pack is designed to turn an empty GitHub repository into a disciplined, playable project without asking Codex to invent the product from scratch.

## What is already here

- A Vite + React + TypeScript application.
- React Three Fiber and Three.js loaded only after the player starts.
- A working DC-9-inspired greybox interaction slice.
- Crew Mode and Captain Mode.
- A repeatable player loop with immediate feedback and safe retries.
- Local progress persistence with corrupt-save recovery.
- A light Memphis feeder-route puzzle using the project owner's supplied historical context.
- A red Model Y reward proxy for Captain Mode.
- A hidden Mars mission.
- Unit tests, Playwright smoke tests, GitHub Actions, Vercel guidance, Blender scripts, two Codex Skills, an ExecPlan format, and milestone prompts.

## First local run

```bash
cd CockpitEscapeRoom
nvm use
npm install
npm run check
npm run dev
```

The current prototype intentionally says **GREYBOX — NOT FINAL DC-9 ART**. Do not remove that label until a visual approval gate is passed.

## First Codex session

Open Codex at the repository root and use Plan mode. Then paste the contents of:

```text
prompts/00_BOOTSTRAP_CODEX.md
```

Codex should inspect the repository, run the existing checks, summarize the current vertical slice, and write or update the first ExecPlan. It must not jump straight into a full cockpit model.

## First Blender milestone

Create only a production-pipeline proof:

1. A correctly scaled DC-9 cockpit shell and main-panel blockout.
2. A captain-eye approval camera.
3. Three interactive switches with correct pivots and stable names.
4. One gauge with an animated needle.
5. One annunciator with emissive lighting.
6. One Memphis route card.
7. A clean GLB export that preserves names, hierarchy, pivots, animations, and custom properties.
8. Browser screenshots at desktop and mobile sizes.

Approval question: **Does the captain-seat view already feel unmistakably like a DC-9 rather than a generic retro cockpit?**

Do not begin the full DC-9, the Airbus, or the vehicle reward asset before that answer is yes.

## Personalization items to collect next

Edit [`docs/PERSONALIZATION_CHECKLIST.md`](docs/PERSONALIZATION_CHECKLIST.md). The highest-value missing facts are:

- Dad's preferred display name.
- The DC-9 variant or variants he flew.
- The exact Airbus model he later flew.
- A few real routes, airports, sayings, and career memories.
- Whether his airline/employment history can be named directly in the final game.
- The preferred Model Y license-plate joke.
- The real Father’s Day reward or final message.

## GitHub and Vercel

The repository is intended to use pull requests as visual approval gates. Each branch should receive a Vercel preview deployment. Review the game in the browser, not only in Blender or source code.

Recommended first branch:

```bash
git checkout -b chore/bootstrap-starter-pack
git add .
git commit -m "Bootstrap CockpitEscapeRoom starter pack"
git push -u origin chore/bootstrap-starter-pack
```

Then open a pull request, inspect the Vercel preview, and merge only after the greybox passes on desktop and mobile.
