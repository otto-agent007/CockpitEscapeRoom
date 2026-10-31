# CockpitEscapeRoom

A personalized 3D browser game celebrating dev's dad, a pilot's journey from the McDonnell Douglas DC-9 to the Airbus A320.

The game opens with a console-era cinematic, then moves through a right-seat DC-9 Final Flight Log and fictional Memphis departure memory, the Captain's Locker, Airbus Pop T Captain Mode, and a protected red Model Y Flight Mode reward. Mars remains a hidden post-ending Easter egg. The whole journey is framed as a warm family tribute.

After finishing the reward and final tribute once, hold **T+M+B** together for **1.5 seconds** to open the hidden Mars arcade from any later chapter or replay. The browser remembers the unlock across reloads and game restarts. There is no visible arcade entry in the game, and opening `/mars-arcade.html` directly does not start a match. Escape or **Return to game** restores your current chapter. The development gym remains at `/dev/gym.html`.

Inside the arcade, **Background** offers **Mars** or an outdoor **Moonbase** with Earth in the sky. The browser remembers your choice; switching scenery keeps the current round running.

## Run

Requires Node.js 24.

```bash
nvm use
npm install
npm run dev
```

## Verify

```bash
npm run check
npm run test:e2e
npm run assets:check
```

## Project guides

- [Blueprint](BLUEPRINT.md) and [game design](docs/GAME_DESIGN.md)
- [Contributor guidance](AGENTS.md) and [Codex workflow](docs/CODEX_WORKFLOW.md)
- [Architecture](docs/ARCHITECTURE.md) and [asset pipeline](docs/ASSET_PIPELINE.md)
- [Active plans](plans/) and [validation record](TEST_REPORT.md)
