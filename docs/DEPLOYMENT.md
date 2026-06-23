# GitHub and Vercel deployment

## GitHub

Use short-lived branches and pull requests. The starter includes CI for lint, TypeScript, unit tests, production build, model validation, and Chromium smoke tests.

Recommended branch progression:

```text
chore/design-sync
asset/dc9-pipeline-proof
feature/dc9-first-puzzle
feature/dc9-main-game
feature/model-y-reward
feature/airbus-bonus
feature/mars-easter-egg
release/fathers-day
```

## Vercel

Import `otto-agent007/CockpitEscapeRoom` into Vercel and use:

```text
Framework preset: Vite
Install command: npm install
Build command: npm run build
Output directory: dist
Node.js: 24.x
```

Every pull request should receive a preview deployment. Use that URL for owner visual approval and phone testing.

## What is not deployed

`.vercelignore` excludes Blender sources, caches, test reports, and source asset files. Production GLBs belong in `public/models` only after local validation.

## Environment variables

The game currently needs none. Do not add analytics or external APIs by default. `BLENDER_BIN` is a local development variable and must not be configured in Vercel.
