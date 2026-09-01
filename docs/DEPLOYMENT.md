# GitHub and Vercel deployment

## GitHub

Use short-lived milestone branches and pull requests. CI runs on every pull request and on pushes to `main` with Node.js 24:

- `npm ci`
- `npm run check`
- `npm run assets:check`
- `npm run test:e2e` in a separate Chromium browser-smoke job

Failed browser runs upload the Playwright report for seven days. A green build does not replace the owner visual gate for cockpit, Memphis, locker, Airbus, or reward milestones.

## Vercel

Import `otto-agent007/CockpitEscapeRoom` into Vercel and use:

```text
Framework preset: Vite
Install command: npm install
Build command: npm run build
Output directory: dist
Node.js: 24.x
```

Every pull request should receive a preview deployment. Use that URL for owner visual approval and the approximately 375, 768, and 1440 CSS pixel checks relevant to the change.

## What is not deployed

`.vercelignore` excludes Blender sources, caches, test reports, and source asset files. Production GLBs belong in `public/models` only after local validation.

## Environment variables

The game currently needs none. Do not add analytics or external APIs by default. `BLENDER_BIN` is a local development variable and must not be configured in Vercel.
