# Mars arcade cabinet — fight loop prototype

## Purpose

The Mars Easter egg is currently one config string (`marsRank`). This milestone gives it
something to do: a short, replayable arcade fighter on a cabinet found on the Mars surface,
after the Father's Day message. Two unnamed archetypes trade blows; beating both unlocks a
third fighter, **THE CAPTAIN**, who wins by being unbothered rather than by swinging. The
joke lands as tribute rather than as a bolt-on.

This plan covers the **fight loop only** — the pure rules a fighting game needs before any
art exists. No scene, no sprites, no chapter wiring.

## Current state

- `mars` is already a real phase in `GamePhase` (`src/game/state.ts:60`) and in storage
  schema 15, reached from the reward chapter (`src/game/state.ts:1232`).
- The only Mars content is `marsRank: 'Commander, Mars Transport Division'`
  (`src/game/config.ts:308`). There is no Mars scene, asset, or interaction.
- A production pixel-art pipeline already exists for the TMB2 intro: a 320x224 stage,
  whole-number sprite scales, packed sheets under
  `public/images/intro/tmb2/scramble/sprites/`, a manifest built by
  `tools/assets/build-intro-manifest.mjs`, and prompt packs in `asset-reports/`
  (`popt-frame-prompt-pack.md`, `tmb2-acting-frames-prompt-pack.md`,
  `popt-sprite-contract.json`). Pop T already has `popt-walk` and `popt-run` sheets.

## Scope

**Included** — three new pure modules under `src/game/` plus tests:

- `marsArcadeFighters.ts` — fighter and move content (frame data, reach, damage, meter).
- `marsArcade.ts` — the fight loop: fixed 60 Hz step, frame data, hitboxes, blocking,
  guard meter, projectiles, knockback, round clock, KO and time-over.
- `marsArcadeOpponent.ts` — a deterministic seeded computer opponent.

**Excluded, deliberately** — sprite art and sheets; a Mars scene or cabinet; any React
component; any change to `state.ts`, `storage.ts`, or schema 15; audio; input bindings;
the character-select screen. Nothing imports these modules yet, so nothing ships.

## Context and constraints

- **Architecture.** `src/game/` is pure rules and must not depend on Three.js
  (`docs/ARCHITECTURE.md`). These modules import nothing but each other.
- **No real people.** The fighters are unnamed archetypes — THE BOOSTER, THE ORACLE,
  THE CAPTAIN. Owner decision, 2026-09-19. No real person is named, depicted, or
  referenced in content, identifiers, or comments. This is recorded at the top of
  `marsArcadeFighters.ts` so a later contributor does not "helpfully" restore names.
- **Spoiler protection.** The cabinet sits behind the ending, alongside Mars. Nothing here
  may reference the protected ground-transport reward, and none of this content may enter
  the initial bundle or any preload manifest. Verified below.
- **Tone.** Cartoon arcade violence between fictional archetypes. Pop T is never a target
  of ridicule; THE CAPTAIN is the fighter the player earns.
- **Determinism.** The engine contains no randomness at all. The opponent owns a seeded
  generator in its own state, so a seed plus a run of inputs replays exactly. This is what
  makes the loop testable headlessly.

## Progress

- [x] 2026-09-19 — Worktree `feat/mars-arcade-fight-loop` created off `origin/main`
      (`7b6a6fa`) at `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/mars-arcade`.
- [x] 2026-09-19 — Content module: three fighters, nine moves, full frame data.
- [x] 2026-09-19 — Engine: fixed step, frame data, blocking, guard meter, projectiles,
      launchers, knockback, round end.
- [x] 2026-09-19 — Seeded opponent with two difficulties.
- [x] 2026-09-19 — 34 tests; 11/11 mutations caught; `npm run check` green.
- [ ] Owner review of the fight feel and the archetype framing.
- [ ] Milestone 2 — sprite generation and the character-select screen.
- [ ] Milestone 3 — the Mars cabinet scene and chapter wiring.

## Discoveries

- **A jump could never clear the projectile as first tuned.** Jump apex is
  `v^2 / 2g` = `4.4^2 / (2 * 0.28)` ≈ 34.6 px, but the text bubble's ceiling was 40 px, so
  the intended jump-over answer was impossible and the zoner had no counterplay. Lowered
  the bubble ceiling to 26 px, which makes a well-timed jump clear it and a mistimed one
  eat it. Covered by *passes under a fighter who is above the bubble ceiling*.
- **Blockstun was dropping the guard.** The input path cleared `blocking` whenever the
  fighter could not act, so a projectile arriving during blockstun counted as a clean hit.
  Blockstun now keeps the guard up, and `applyHit` accepts a block from a fighter already
  in blockstun.
- **Melee and projectile timing disagreed by one frame.** The projectile spawned on
  `startupFrames + 1` while the melee active window opens on `startupFrames`. Aligned to
  `startupFrames`.
- **Projectile moves could also register as melee hits.** `reach: 0` made this harmless in
  practice (pushboxes keep fighters ≥ 24 px apart), but it was latent. Projectile moves are
  now excluded from melee collection explicitly.
- **Landing-window frames must be counted from the press.** Counting the stuck-landing
  recovery from the start of recovery rewarded pressing *late*, which is backwards. It is
  now `recoveryElapsed + stuckRecoveryFrames`, so early is strictly better: press at the
  window's open and recovery ends ~26 frames sooner than tipping over.

## Decision log

- **2026-09-19 — Unnamed archetypes, not real people.** Owner choice. Avoids likeness
  questions on a Vercel preview that is on the public internet, and avoids the practical
  wall where an image generator refuses caricatures of named real people frame by frame.
  Consequence: content, ids, and comments carry archetypes only.
- **2026-09-19 — The cabinet lives behind the ending, in Mars.** Keeps the locked journey
  order and the locker untouched, and needs no schema bump, because `mars` already exists.
- **2026-09-19 — Engine holds no randomness.** The opponent owns the seed. Consequence: the
  whole fight replays from inputs, which is what the mutation testing below relies on.
- **2026-09-19 — Grounded attacks only in the prototype.** No air attacks and no air
  control. Jumping is purely evasive, which still leaves a complete triangle: poke beats
  approach, projectile beats poke, jump beats projectile, launcher beats jump. Air attacks
  are a Milestone 2 question, not a gap to paper over.

## Milestones

1. **Fight loop provable headlessly** *(this plan)* — a round can be played to KO or time
   over entirely from scripted inputs, and the rules are proven by tests that fail when the
   rules break.
2. **The fighters can be seen** — sprite sheets generated through the existing TMB2 pipeline
   (Codex/ChatGPT `image_gen`, then snapped, quantised and despeckled to the 320x224 grid
   like the existing prompt packs), a character-select screen, and the HUD.
3. **The cabinet exists** — a Mars surface scene, the cabinet interaction, chapter wiring,
   persistence of the CAPTAIN unlock, and the accessible native control path.

## Implementation steps

- `src/game/marsArcadeFighters.ts` — `MARS_ARCADE_FIGHTERS` keyed by
  `booster | oracle | captain`; each carries health, walk speed, jump velocity, guard meter
  and three moves keyed `light | heavy | special`. A move is frame data: startup, active,
  recovery, damage, chip, guard damage, reach, max height, hitstun, blockstun, knockback,
  meter cost and gains, plus optional `projectile` and `landingWindow` specs.
- `src/game/marsArcade.ts` — `createMarsArcadeRound`, `advanceMarsArcade(state, inputs,
  elapsedSeconds)` returning `{ state, events }`, and the read helpers
  `marsArcadeTimerSeconds` / `marsArcadeHealthFraction`. Events (`hit`, `blocked`,
  `guardCrush`, `projectileFired`, `stuckLanding`, `tippedOver`, `composure`, `ko`,
  `timeOver`, `roundStart`) are the hook points for sprites and audio later.
- `src/game/marsArcadeOpponent.ts` — `createMarsArcadeOpponent(side, difficulty, seed)` and
  `advanceMarsArcadeOpponent(opponent, state)`; intents held for a fixed number of frames,
  a press cooldown so buttons pulse rather than stick, and a difficulty-weighted answer to
  the booster's landing window.

Commands: `npm run check` (lint, typecheck, 637 tests, build).

## Validation plan

Unit tests only at this milestone; there is no browser surface yet, so a browser gate is
not applicable and is **not** claimed. Coverage:

- round setup, intro handoff, round clock
- walk speed, stage walls, pushbox separation
- frame data: no hit during startup, connects on the first active frame, once per move
- reach: whiff out of range
- blocking: chip damage, blockstun, guard drain, guard crush, guard held through blockstun
- hitstun locks inputs until the stun expires and the button is re-pressed
- meter: specials refused without it, spent when used, banked by attacker and by the
  fighter absorbing damage
- landing window: stuck, tipped, and the recovery gap between them
- projectiles: fire, travel, connect, pass under a fighter above the ceiling, expire
- anti-air: the launcher reaches a rising opponent a ground heavy cannot
- the captain: composure instead of damage; locked until unlocked
- round end: KO freezes the fight; time over awards the healthier fighter; ties draw
- fixed step: long frames clamp, partial frames carry, identical inputs replay identically
- opponent: same seed replays, different seeds diverge, silent before the round starts,
  closes distance, lands damage, and answers its landing window more often as a veteran

**Mutation testing.** Because a suite that passes first try proves nothing, eleven
deliberate defects were injected one at a time and the suite re-run against each.

## Acceptance criteria

- [x] `npm run check` passes: ESLint, `tsc -b`, 637 Vitest tests across 49 files, `vite build`.
- [x] Every one of the eleven injected defects is caught by at least one test.
- [x] The engine imports nothing outside `src/game/` and contains no randomness.
- [x] No archetype string, move name, or module name appears in `dist/`.
- [x] Nothing outside `src/game/marsArcade*` imports these modules.
- [ ] Owner review of fight feel and framing — **required before Milestone 2**.

## Repair loop and stop conditions

Four defects were found and repaired during implementation (see Discoveries), each with a
test that now covers it. Stopping here: the remaining work needs art and an owner opinion
on feel, neither of which a headless loop can settle.

## Evidence

Commands run in `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/mars-arcade` on 2026-09-19:

```
npm run check
  eslint .                          clean
  tsc -b --pretty false             clean
  vitest run                        49 files, 637 tests passed (2.46 s)
  vite build                        built in 2.94 s
```

New tests: 34 (28 in `marsArcade.test.ts`, 6 in `marsArcadeOpponent.test.ts`).

Mutation run — inject, run both new test files, revert:

```
startup gating removed          caught   2 failed | 32 passed
blocking never applies          caught   2 failed | 32 passed
frame-delta clamp removed       caught   1 failed | 33 passed
pushbox separation removed      caught   1 failed | 33 passed
landing window never tips over  caught   2 failed | 32 passed
projectile ignores height       caught   1 failed | 33 passed
specials are free               caught   1 failed | 33 passed
hitstun does not lock inputs    caught   1 failed | 33 passed
reach ignored                   caught   1 failed | 33 passed
opponent randomness collapsed   caught   4 failed | 30 passed
ko winner inverted              caught   1 failed | 33 passed

11/11 mutations caught
```

Spoiler check against the production build — `THE BOOSTER`, `THE ORACLE`,
`ORBITAL INSERTION`, `DC-9 FLYBY` and `marsArcade` are all absent from `dist/`, and no file
outside `src/game/marsArcade*` imports the modules.

**Not done and not claimed:** no browser run, no screenshots, no Vercel preview, no sprite
art, no scene, no chapter wiring, no persistence. The fight has never been seen, only
proven.
