# Mars arcade — the rules read the boxes (plan 0046 M3)

Status: **Active, 2026-09-24.** Branch `feat/mars-arcade-bounds-rules` off `origin/main` at
`1034432` (PR #99 merged), worktree `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/arcade-m3`.
This is milestone M3 of `plans/0046-arcade-animation-workflow-v2.md`, split out because it is
a balance change and the plan asked for it to be reviewable in its own PR.

## Purpose

Attacks connect where the drawn fist or foot actually is, a guard has a height, and a hit
lands with a short freeze and a white flash. The owner can switch each of those on in the
fighter playground (`dev/arcade.html`), feel it, and save it into the shipped tuning file.

Both switches ship **off**. Until the owner flips them the cabinet plays exactly the numbers
it plays today. That was decision C in plan 0046: "behind `MARS_ARCADE_RULES.useBounds`,
shipped off, with a table in the PR showing every move's old and new connect distance."

Terms:

- **Connect distance**: the largest gap between the two fighters' origins at which a move
  still hits. Today it is exactly the move's `reach`.
- **Hurt box / attack box**: boxes drawn in the character gym on each drawing
  (`src/game/marsArcadeAnimations.json`). Attack boxes exist only on `active` drawings.
- **Guard height**: `high`, `mid` or `low` on each move (decision B). A standing guard stops
  high and mid. Nobody can crouch yet, so a low attack passes every guard.
- **Hit stop**: both fighters and the round clock freeze for a few frames on a connect.

## Current state (read 2026-09-24 on `1034432`)

- `collectMeleeHits` (`src/game/marsArcade.ts:343`) hits when the attacker faces the defender,
  `|dx| <= move.reach` and `defender.y <= move.maxHeight`. The boxes are not read.
- Blocking is one boolean ("holding away"), checked in `applyHit`. It stops everything.
- The pushbox is the constant `MARS_ARCADE_STAGE.pushboxWidth = 24` in `separate`.
- No hit stop. The loop emits `hit`, `blocked` and `guardCrush`.
- Which drawing is on screen is decided by `selectArcadeSprite` in the dev-only
  `src/dev/arcadeHarnessSprites.ts`, from the table. The rules have no view of it.
- The table has boxes on every drawing for booster and oracle. Captain has only an idle
  clip, so captain moves have no attack boxes. 20 clips are machine-seeded
  (`reviewed: false`).
- The arcade is dev-only: nothing outside `src/dev` and `dev/*.html` imports it.
- `marsArcadeTuning.json` is v1 and holds per-move damage, chip, guard damage, knockback and
  stun. It does not hold reach, which is bound to the drawings.

## Scope

In: the box overlap path behind `useBounds`; guard height as a move property; per-fighter
pushbox from content; hit stop in frame data and state behind a `hitstop` switch; the
harness freeze and flash; playground switches and a hit-stop field; tuning file v2 with v1
migration; a connect-distance table computed through the real rules, pinned by a test and
printed by `arcade-anim.mjs connect`.

Out: crouching; projectile boxes (the text bubble has no clip, it keeps its radius); captain
move art; tightening the seeded hurt boxes (that is the owner's gym pass); turning either
switch on.

## Context and constraints

- Rules stay pure and deterministic: no DOM, no canvas. Resolving which drawing the rules
  read has to come from rules state alone (`state.frame`, `moveFrame`, `velocityY`,
  `activity`). The harness's cosmetic beats (heavy-reaction beats, the heavy-block brace,
  knockback easing) are presentation. They do not move a hurt box.
- A missing box never silently becomes "cannot hit". If either side has no boxes for the
  current drawing, that pair falls back to the reach check, and the table says so.
- `reach` stays in the content. It is still the fallback, the gym's comparison and the
  validator's reach rule.
- Persisted tuning is versioned. A v1 file loads as v2 with the switches off and the
  content's hit stop.
- PR batching: one branch and one PR (`pr-batching` memory).

## Decision log

- 2026-09-24: The switches live in the tuning file (`rules: {useBounds, hitstop}`), not in a
  code constant. The playground already saves that file, so "flip it and keep it" needs no
  code change. The code default `MARS_ARCADE_DEFAULT_RULES` is both off.
- 2026-09-24: Hit stop is behind its own switch rather than `useBounds`. It changes timing,
  not spacing, and the owner may want one without the other. It also ships off because it
  moves every frame count the recorded exchange and check scripts rely on.
- 2026-09-24: During hit stop `state.frame` and the round timer do not advance. Idle and walk
  drawings are keyed on `state.frame`, so this makes the freeze a real freeze on screen.
  Held buttons are not consumed during the freeze, so a press made in it fires on the first
  frame after it (a buffer, not a drop).
- 2026-09-24: Oracle's Hard Cutoff (the sweep, attack box at rows 96–109) is `low`. Every
  other move is `mid`. With `useBounds` on, the sweep therefore cannot be blocked standing,
  which is the plan's stated goal. This is a balance call for the owner. Nothing changes
  while the switch is off.
- 2026-09-24: The table is not retuned to restore the old distances. Moving an attack box
  back inside the limb breaks the hitbox convention and the validator's reach rule. The
  right lever is the owner's pass over the machine-seeded hurt boxes, which are silhouette
  bounding boxes, arms included. The pinned table makes each box edit's spacing effect
  visible in review.

## Milestones and implementation steps

1. **Content** (`src/game/marsArcadeFighters.ts`): `guardHeight` and `hitstopFrames` on
   `MarsArcadeMove`; `pushboxWidth` on `MarsArcadeFighter`; `hitstopFrames` joins the move
   tuning; `MarsArcadeRules` and the rules in force (`marsArcadeRules()`), set with the tuning.
2. **Pose for the rules** (`src/game/marsArcadePose.ts`, new): the parsed table, clip lookup
   by name and by move, and `marsArcadeRulesFrame(state, side)`. That is the drawing whose
   boxes the rules read, or null. The dev selector imports the table from here instead of
   parsing its own copy.
3. **Rules** (`src/game/marsArcade.ts`): the box path in `collectMeleeHits` with a reach
   fallback; the guard-height check in `applyHit`; the pushbox from content in `separate`;
   `state.hitstop` with the freeze in `stepFrame`; `hitstopFrames` and `defender` on
   `hit` and `blocked` events.
4. **Tuning file** (`src/game/marsArcadeTuning.ts`, `.json`): v2 with `rules` and
   `hitstopFrames`, v1 migration, and the shipped file equal to the baked content.
5. **Connect table** (`src/game/marsArcadeConnect.ts`, new): sweep separations through
   `advanceMarsArcade` itself for every striking move against every opponent's idle, with the
   switch off and on. The test pins it, and `node tools/assets/arcade-anim.mjs connect`
   prints it as markdown.
6. **Harness and playground** (`src/dev/arcadeHarness.ts`, `arcadePlayground.ts`,
   `dev/arcade.html`): two switches, a hit-stop column, a white flash on the defender for the
   first 2 frames of the freeze (not under reduced motion), the overlay drawing the rules'
   boxes when `useBounds` is on, the reach region drawn only when the reach path applies, and
   the readout showing the switches and the freeze.

## Validation plan

- Unit (vitest): off = today (existing suite unchanged, plus the connect table's "off" column
  equals `reach`). On: the jab hits at the table's distance and misses one pixel further; a
  low attack passes a standing block while a mid one is blocked; a captain move falls back to
  reach; the pushbox follows content (mutation: widen one fighter); the hit stop freezes
  positions, stun, move frame and timer for exactly N frames, then resumes; a v1 tuning file
  migrates; the shipped file equals the content; the rules frame is the same drawing the
  harness shows for idle, walk, jump, block and each move phase.
- Make the checks able to fail: mutate the overlap to always-true and always-false, drop the
  guard-height check, and set the freeze to 0. Each must fail a named test.
- Browser, dev page only (`dev/arcade.html`, own port): with both switches off the exchange
  replays as before. With them on, a screenshot of the freeze with the flash and the overlay,
  a jab at the new distance, and a sweep through a standing guard. Widths 1440 and 768 (375
  is out of scope for a dev tool, as in plan 0046). Reduced motion: no flash, freeze kept.
- `npm run check` and `npm run arcade:validate`.

## Acceptance criteria

1. With the shipped tuning, every existing test passes unchanged and the "off" column of the
   connect table equals each move's `reach`.
2. With `useBounds` on, every move's connect distance matches the pinned table. Moves without
   boxes are marked `reach` and keep their old distance.
3. With `useBounds` on, Hard Cutoff connects through a standing guard, and a mid move is still
   blocked.
4. With `hitstop` on, every connect freezes the fight for the move's `hitstopFrames`, and the
   harness flashes the defender for 2 of them (not under reduced motion).
5. Both switches and the hit-stop numbers save from the playground into
   `marsArcadeTuning.json` and survive a reload.
6. `TEST_REPORT.md` and this plan carry the actual command output.

## Repair loop and stop conditions

Implement → unit → browser → full-diff review → repair, at most three passes. Stop for the
owner after the PR is up: flipping either switch, and accepting Hard Cutoff as low, are the
owner's calls.

## Progress

- [x] 2026-09-24: Worktree off `origin/main` `1034432`, `npm ci`, baseline arcade vitest 19
  files / 217 tests green.
- [x] 2026-09-24: Content, pose, rules, tuning v2, connect table, with tests. Existing suite
  unchanged and green with both switches off.
- [x] 2026-09-24: Harness, playground, browser proof (`check-arcade-bounds-rules.mjs`, 6 ok).
- [x] 2026-09-24: Full-diff review found two defects, both fixed with tests: a final blow left
  the freeze set forever (the KO screen would have flashed indefinitely), and the v1
  migration indexed content by an untrusted key. `npm run check` green, TEST_REPORT entry.
- [ ] Owner: feel both switches in the playground, then decide on each, and on Hard Cutoff as
  `low`.

## Discoveries

- Box overlap counts the defender's hurt box, which starts about 19–22 px in front of an
  idle fighter's origin. So every box-resolved move reaches further than its `reach`: the
  jab reaches 59 against oracle instead of 41. Plan 0046 pinned this trap as the
  "41-vs-56" test.
- The seeded hurt boxes are silhouette bounding boxes. A walking-forward "step" drawing is
  wider than idle (booster step hurt box front edge 34 px ahead of the origin, against 22 at
  idle), so with boxes on, stepping in makes a fighter noticeably easier to hit. That is
  plausible fighting-game behaviour, but it comes from seeded boxes nobody has reviewed.
- The harness's heavy-block "brace" pose triggers on `|dx| <= reach`. With boxes on, a heavy
  can land from further out than reach, so the brace can be skipped at long range. It is
  cosmetic and left as is; retune it if the owner turns boxes on.
- Hit stop holds `state.frame`, and the harness clears pending taps only when the frame
  advances, so a tap made during the freeze survives it, which is the intended buffering.
- Two existing browser checks fail on a clean `origin/main` as well, so they are stale rather
  than broken by this work. `check-arcade-exchange.mjs` expects the pre-#99 label "guarded
  backward shuffle", and `check-arcade-pilot.mjs` times out after its first PASS.

## Evidence

Connect table, as printed by `node tools/assets/arcade-anim.mjs connect` (vs each
opponent's idle, whole pixels, pinned in `marsArcadeConnect.test.ts`):

| move | vs | guard | reach | off (reach check) | on (boxes) | change | decided by |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| booster.padJab | oracle | mid | 41 | 41 | 59 | +18 | boxes |
| booster.padJab | captain | mid | 41 | 41 | 55 | +14 | boxes |
| booster.staticFire | oracle | mid | 38 | 38 | 53 | +15 | boxes |
| booster.staticFire | captain | mid | 38 | 38 | 49 | +11 | boxes |
| oracle.prompt | booster | mid | 40 | 40 | 62 | +22 | boxes |
| oracle.prompt | captain | mid | 40 | 40 | 55 | +15 | boxes |
| oracle.hardCutoff | booster | low | 40 | 40 | 61 | +21 | boxes |
| oracle.hardCutoff | captain | low | 40 | 40 | 54 | +14 | boxes |
| captain.runTheChecklist | booster | mid | 36 | 36 | 36 | 0 | reach |
| captain.runTheChecklist | oracle | mid | 36 | 36 | 36 | 0 | reach |
| captain.flyby | booster | mid | 480 | 480 | 480 | 0 | reach |
| captain.flyby | oracle | mid | 480 | 480 | 480 | 0 | reach |

Hand check of one row: the jab's attack box ends 41 px ahead of the booster, and Oracle's
idle hurt box (cell x 48, width 35) starts 48 + 35 − 64 = 19 px ahead of Oracle. They overlap
while the gap is under 41 + 19 = 60, so the result is 59.

Commands and results are in `TEST_REPORT.md` (2026-09-24, "Arcade rules read the boxes").
Screenshots are in `preview-renders/mars-arcade/bounds-rules-v1/`: the jab landing by boxes
with the flash, the same frame under reduced motion, the sweep through a guard, and the
console at 768.

## Outcome and handoff

Built: box-overlap melee with a reach fallback, guard height (Hard Cutoff `low`), a
per-fighter pushbox (24 for everyone, as before), hit stop with a 2-frame white flash (none
under reduced motion), two playground switches and a hit-stop column that save into tuning v2,
and the connect table in code, in the CLI and pinned in a test.

Nothing changes for the player until the owner acts, because both switches ship off. What
the owner needs to decide:

1. **Hits by boxes.** Every drawn move lands 11–22 px further out than its reach today. The
   usual fix is the owner's gym pass tightening the seeded hurt boxes (reference convention:
   a hurt box sits slightly inside the silhouette), after which the table shrinks.
   Re-run `arcade-anim.mjs connect` after that pass.
2. **Hard Cutoff as low.** With boxes on, the sweep cannot be blocked standing, and nobody can
   crouch yet. Jumping is the only answer, and the boxes now make jumping work honestly.
3. **Hit stop.** 2 / 4 / 6 frames for light / heavy / special. It changes frame timing, so
   the recorded exchange and the check scripts that count frames need re-recording if it
   ships on.

Not built: crouching, projectile boxes, captain move clips.
