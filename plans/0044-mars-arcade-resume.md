# Mars arcade checkpoint — 2026-09-22

Draft PR #76, branch `feat/mars-arcade-stage-hud`. PR #75 is merged; this checkpoint targets main. Owner visual approval remains open.

## Resume here

Use the branch checkout (currently `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/mars-backdrop`). Run `npm run dev -- --host 127.0.0.1 --port 5349`, then open **http://127.0.0.1:5349/dev/arcade.html** directly. The root URL starts the main game cinematic. This arcade remains dev-only and is excluded from production output.

Completed: wider scrolling stage and generated backdrop, rebuilt HUD, per-frame bounds schema and character gym; eight-pose Booster heavy; Oracle received-heavy recovery and three-beat heavy block; Booster impact/stagger/recovery. The harness loads 46 sprite sources. The combat animation changes preserve attack timing, damage, reach, hitstun and blockstun. Earlier stage changes widen the arena and extend the captain flyby reach.

Next bounded animation candidate: Booster heavy-block compression and return to guard. Then consider jab motion and Oracle heavy attack polish. Oracle received-heavy still reuses its original recoil for the stagger phase: its deeper stagger candidates failed the alpha gate. Specials, remaining fighters, cabinet integration, impact effects and complete-game proof remain unfinished. `fx.flyby` is re-specified for the dust-storm sky but not yet drawn: pale fuselage with a 1 px dark outline in screen rows 28-60, asserted by `check-arcade-stage.mjs` (see the prompt pack). Do not treat this checkpoint as final art approval.

## Validation at checkpoint

`npm run check` passed lint, types, 778 tests in 63 files and production build. Latest native browser suites: Booster received-heavy 7 groups, Oracle received-heavy 6, Oracle heavy-block 7, pilot 12, heavy hit/block/whiff 13. Includes both facings, reduced motion, pause/step/reset/reload, keyboard, 375/768/1440 widths, missing-art fallback, guard crush and actual Booster KO. Full journey e2e and 3D asset suite were not rerun. Evidence logs are under `preview-renders/mars-arcade/booster-hit-v1/`.

Browser scripts accept `ARCADE_PILOT_URL=http://127.0.0.1:5349/dev/arcade.html` and `ARCADE_EVIDENCE_DIR=/tmp/arcade-review` to keep prior evidence intact. Set `ARCADE_HEAVY_ATTACKER=oracle` for `check-arcade-heavy-hit.mjs` to test Booster as defender; the default checks Oracle. Use the unchanged sprite contract and fixed per-fighter source scales documented in the asset reports.

## Review media and archive boundary

Each committed animation evidence directory has concise comparison media and contact sheets. Start with `booster-hit-v1/before-after.mp4` and `reaction-sheet.png`, `heavy-block-v1/hit-vs-block.mp4`, and `heavy-drive-v1/eight-pose-browser-sheet.png`.

When asking the owner to watch a clip, open it in the existing GNOME Videos/Totem player through its MPRIS OpenUri, Raise and Play methods. Show stills through the displaying-images-in-tmux skill in the existing sidebar. A path alone is not a visual presentation.

This checkpoint commits the eight selected raw sources, eight selected runtime cells, all prompts, five reports, compact media and top-level validation logs. Rejected image candidates, duplicate normalized attempts, full/raw recordings and per-case screenshot directories remain in the local worktree only; historical reports refer to these local archive paths. The checkpoint SHA-256 manifest in `asset-reports/` covers the committed selected assets. Original per-slice manifests also cover rejected local candidates and are intentionally not published as complete portable manifests.
