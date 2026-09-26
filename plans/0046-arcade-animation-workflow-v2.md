# Mars arcade — animation workflow v2

Status: **M1, M2, M4, M5 BUILT 2026-09-24 (PR #99, merged); M3 BUILT 2026-09-24 in its own
PR, see `plans/0047-mars-arcade-bounds-rules.md`.** Owner decisions 2026-09-23: milestones 1–5 approved; A "try it, with a cheap or
free model"; B property; C yes; D port. This plan is the answer to the owner's ask: "We need to improve our animation
workflow a lot. I've noticed a lot of inconsistencies in the current one. There's one called
Spriterific that a guy made, we could probably learn from it … We definitely need to improve
our bounds, attack bounds, hit boxes, guard, visual, etc."

## Purpose

A maintainer can take a new Mars arcade animation from "generated art" to "playing in the
fight, with authored boxes, in the gym, under test" through **one** pipeline whose rules are
written down once, measured per clip rather than per drawing, and enforced by a validator
that both the gym and CI run. Every animation carries the same four box kinds, the fight
loop reads those boxes instead of a bare `reach` number, and a block that covers the head
does not stop a sweep at the ankles.

The player-visible result: attacks connect where the drawn fist or foot actually is, blocks
have a height, hits have hit stop and a flash, and no fighter pops, skates or changes size
between drawings.

## Current state

Everything below is from `origin/main` at `a2c8d8e` plus the open PR #98 branch
(`feat/mars-arcade-oracle-outcomes`), read 2026-09-23. Line numbers are from main.

### The pieces

- **Gym.** `dev/gym.html` → `src/dev/arcadeGym.ts` (484 lines, plain TypeScript). Draws the
  128 px cell at 4x. Four box kinds from `src/game/marsArcadeBounds.ts:44-51`: `collision`
  (body/push), `hit` (hurtbox), `attack` (hitbox, only on `active` frames), `guard`. Boxes are
  edited by drag / Shift-drag / typed numbers, "Apply to all frames" (never attack), Prev/Next,
  Play at a flat 120 ms × {0.5,1,2}. Save POSTs to `/__gym/bounds` and the Vite plugin
  (`vite.config.ts:19-50`) overwrites `src/game/marsArcadeBounds.json` with no server-side
  schema check.
- **Bounds data.** `marsArcadeBounds.json` v1: `{fighter, animation, moveId?, frames:[{phase,
  collision?, hit?, attack?, guard?}]}`. Frames pair with drawings **by array position only**
  (`arcadeGym.ts:43-45`, `:185-186`); no file name, no pose name, no timing.
- **Runtime.** The fight loop does not read the boxes (`marsArcadeBounds.ts:25-27`).
  `collectMeleeHits` (`marsArcade.ts:341-358`) is a 1-D check: attacker faces defender,
  `|dx| <= move.reach`, `defender.y <= move.maxHeight`. Blocking is one boolean, "holding
  away" (`:284-286`). Pushbox is the constant 24 (`:43`). Facing is refreshed only while idle
  or walking (`:562-564`).
- **Timing.** Entirely in code, at 60 Hz: `WALK_HOLD = 6`, idle breath 18, outcome beats 12,
  heavy swing at startup frame ≥5 / drive ≥8, recovery retract <4, hit reaction impact <3
  then recover from 55 % of hitstun, block reaction at 35 %/75 % of blockstun
  (`src/dev/arcadeHarnessSprites.ts`). The gym previews none of this.
- **Sprite pipeline.** Fighters go through the Pop T tool `tools/assets/normalise-popt-frame.py`
  with `--contract asset-reports/mars-arcade-sprite-contract.json`, then the gate
  `check-popt-frames-fullcolour.py`. Cell 128×128, pivot (64,120), baseline 119, standing
  height 104 ± 2, one locked scale per fighter (booster 14.0385, oracle 13.6058, captain
  13.9904). Alignment is per drawing: `feet` (default), `bbox` (airborne/downed) or `torso`
  (in-place walks, with `--in-place-clip` on the gate).
- **Tests.** `arcadeGymManifest.test.ts` (every preloaded sprite is in a gym animation, and
  vice versa; heavies match what the harness plays), `marsArcadeBounds.test.ts` (attack right
  edge == `reach`; collision bottom == 119; no attack outside `active`; the pinned
  41-vs-56 overlap test), `marsArcadeSpriteContract.test.ts` (drawing budget from frame data).
  PR #98 adds "keeps every saved frame on a pose with the same phase".

### The inconsistencies (each one has already cost a session)

1. **Boxes are decorative.** `reach`/`maxHeight` in `marsArcadeFighters.ts` and the attack-box
   edges in the JSON repeat the same number and a test keeps them equal, for the **two** moves
   that have boxes. The engine still uses the number.
2. **Coverage is 4 of 22 gym animations** (booster jab, oracle heavy, the two blocks). Booster
   heavy has none: rules reach 38, drawn contact 34, owner-approved exception with nothing in
   the data to say so. New animations are seeded with the fighter's *first* frame's boxes; for
   Oracle that is a crouched heavy startup.
3. **Pairing by position.** Inserting a pose mid-sequence silently moved oracle heavy's attack
   box onto the sweep drawing (memory `mars-arcade-stage-and-camera`). The guard test only
   exists on PR #98.
4. **Timing lives in two places** and the gym's flat 120 ms is neither of them.
5. **Alignment is per drawing, not per clip.** Feet-on-pivot recentres every drawing on its own
   lowest foot, which is exactly what made the walks' hips pop and forced the `--align torso`
   workaround. An attack whose planted foot slides between drawings passes the gate.
6. **Scale drift is invisible to the gate.** An edit-correction that changes pose comes back
   13–21 % oversized; the sneaker-as-ruler mistake sent a false 15 % finding to the owner. The
   gate checks each drawing's height against 104 ± 2 only when `standing`; it never compares
   drawings *within* a clip.
7. **Frame counts do not match the contract budget.** `staticFire` budgeted 5 plays 8;
   `hardCutoff` budgeted 6, main plays 3, PR #98 plays 5; shared clips say idle 4 / block 2 /
   hitstun 2 / KO 3, actual idle 2 and 1, block 1, hit 3 and 2, KO reuses recoil.
8. **Baseline vs pivot.** Boxes treat row 119 as the floor; the harness draws the cell with row
   120 on the fighter's point (`arcadeHarness.ts:822`, `drawImage(img, -64, -120, …)`). To be
   verified on screen, but as read the authored boxes sit 1 px above the drawn feet.
9. **Push width is three numbers.** Rules 24, authored `collision` 25–40, harness
   `SPRITE_STANDING_WIDTH` 44.
10. **"61/61 sprites ready"** is hard-coded in ~11 check/record scripts (68 on PR #98); the
    resume doc says 46.
11. **Stale docs.** README carries two "locked scale" tables; contract says `alignment: feet`
    while walks use torso; the contract's reach checker "does not exist yet".
12. Gym renders at 4x, harness at 3x; harmless until boxes are drawn in the harness.

## What we learn from Spriterrific

"Spriterific" is **Spriterrific** by Chong-U Lim — the same person whose Phaser fighter video
plan 0044 already studied (that is where our gym and the four box kinds came from). It is an
Apache-2.0 Python pipeline on PyPI (`spriterrific` 0.20.4, 2026-08-05); the package was
unpacked and read for this plan (source in the session scratchpad, not the repo). It is a
**sprite generation and curation pipeline, not a hitbox tool**; hitboxes in his fighter are
authored in a character gym exactly as ours are. What transfers:

| Spriterrific practice | Our equivalent today | Borrow? |
| --- | --- | --- |
| Anchor-gated fan-out: approve one stance image, then every action is generated against it | `anchor/anchor-00.png` per fighter, same discipline | Already have |
| **Motion comes from one image-to-video clip**, then a frame picker chooses N frames (even spacing, near-duplicate rejection, per-action policy: `cycle` / `action_window` / `hold_pose`, skip the first 8–20 % "settle" frames) | One image generation per pose; identity, scale and camera drift between poses is our single biggest source of rework | **Owner decision A** — needs a video provider (FAL: WAN 2.7 or Grok Imagine i2v). None is configured and it is paid |
| "Motion as a contract, not choreography": start pose, the verb, end pose; prompts carry explicit negatives (no ground shadow, no palette/costume drift, feet fused for in-place, no travel) | Our prompt pack has this in prose per move | Fold the negative list into the pack's invariant block |
| **Preserve-canvas recovery:** never crop-and-recentre per frame; one shared scale and paste offset for the whole clip | Per-drawing feet alignment (the pop) | **Yes — M4** |
| **Size contract audited per sequence:** `targetVisibleHeight`, `maxTargetHeightDriftPct`, `maxIntraHeightDriftPct`, `maxBottomDriftPx`, `maxWidthOverflowPct`, `maxCenterDriftPx`, measured across all frames of a clip | Per-drawing standing height only | **Yes — M4** |
| Frame aligner: arrow keys nudge 1 px / Shift 5 px against a **ghost of the previous frame**, then rebuild the sheet and a before/after GIF | No onion skin anywhere; no nudge | **Yes — M2** |
| Every normalisation boundary writes before/after review assets and a `review/index.md` | Ad-hoc asset reports | **Yes — M4** |
| Chroma discipline: fringe sweep is matte-relative and runs **before** downscale only; despill is gated by measuring matte tint deep inside the silhouette; warn on a high removed-to-kept ratio | `min(R,B)-G` key, which silently gutted the violet backdrop tile to 11.5 % | Yes — the ratio warning and the "before downscale only" rule |
| Per-animation `manifest.json`: frame size, columns, frames, fps, `anchor {x,y}`, `publicAssetReady` | No manifest; timing in code; counts hard-coded in 11 scripts | **Yes — M1** |
| A bundled agent SKILL.md that names the human review gates (anchor choice, frame selection, alignment, promotion) | `.agents/skills` has nothing for arcade animation | **Yes — M5** |
| Runtime cell 256×256, foot anchor bottom-centre, mirror by `x' = W − (x + w)` | Cell 128, pivot (64,120), mirror about column 64 | Same idea; keep ours |

Things **not** to borrow: his lobit/mixel pixel-snap styles (our contract is full colour at a
locked scale, plan 0029/0030 settled that), 256 px cells, and running his GUIs (Tk) as our
tools — the ideas port into the gym in a few hundred lines.

### From the wider fighting-game practice

- **Framesmith** (RobDavenport, engine-agnostic fighter authoring tool with an MCP server):
  state JSON with `startup/active/recovery`, `guard: high|mid|low`, `hitstun/blockstun/hitstop`,
  `pushback {hit, block}`, boxes as `{frames:[start,end], box}` **ranges**, separate
  `pushboxes[]`, a rules registry with `apply` defaults and `validate` rules with severity, and
  MCP tools `get_state / update_state / get_frame_data_table / export_character` that run the
  same validation as the app. Borrow: frame ranges, guard as an attack property, a validator
  with severities, an agent-facing CLI.
- **Box conventions** (Killer Instinct / Street Fighter write-ups, Hitboxer, coelhucas
  hitbox-editor): hurtbox slightly *inside* the silhouette, hitbox *past* the limb, pushbox
  constant per fighter and never per frame, 1–3 hurtboxes per frame is normal, guard height is
  usually a property of the attack matched against the defender's stance rather than a per-frame
  box, hit stop on every connect. Copy-from-previous-frame and onion skin are table stakes in
  every editor surveyed.
- **Gym vs playground** split (plan 0044 §"The four things he has"): the gym authors boxes; the
  playground tunes feel and persists to JSON the shipping game loads. Still unbuilt.

## Scope

**In:** bounds v2 data + validator + migration; gym v2; box-driven hit detection behind a flag;
guard height; hit stop / hit flash events; clip-level normaliser and audit; the arcade
animation skill; doc cleanup. **Out:** new art, new moves, the text-bubble special, rounds,
screen shake (independent), any change to the intro pipeline, adopting Spriterrific as a
dependency, and the video route unless decision A says yes.

## Context and constraints

- `src/game/*` stays pure rules; the gym and harness stay under `src/dev`; nothing arcade ships
  to `public/` (dev-only Easter-egg tooling).
- Boxes stay authored facing right in cell pixels and mirrored at read time.
- Drawings never encode travel; the engine owns x/y.
- Wrong-answer / balance changes need owner review: switching to box overlap lengthens every
  move by the defender's half-width (jab 41 → 56) unless hurtboxes or reach are retuned.
- Peer sessions: Codex owns `.worktrees/mars-arcade` (port 5317); this plan's worktree is
  `.worktrees/animation-workflow`, branch `feat/arcade-animation-workflow-v2`, dev port **5360**.
  Never `git add -A` in a shared worktree. Merge PR #98 first or rebase on it — it changes the
  same files (`arcadeHarnessSprites.ts`, `arcadeGymManifest.test.ts`, `marsArcadeBounds.json`).

## Decisions the owner must make (blocking only for the milestone they gate)

- **A. Video route.** Adopt image-to-video for motion clips (walks, heavies, hit reactions)?
  Needs a paid provider key (FAL) alongside the Codex `image_gen` plan we already use. My
  recommendation: run **one** paid trial on the Oracle walk, measure it with the M4 audit and
  the sole-row footprint chart, then decide. Gates nothing in M1–M3.
- **B. Guard model.** (i) guard height as an attack property (`high|mid|low`) checked against
  the defender's stance — cheap, matches most fighters, needs no per-frame guard boxes; or (ii)
  keep per-frame guard boxes and test attack-box vs guard-box overlap. Recommendation: (i) for
  rules, keep the guard box only as a gym visual until a crouch exists. Gates M3.
- **C. Overlap switch.** Wire box overlap into `collectMeleeHits` and accept the spacing change
  (retune reach downward so the jab still connects at 41)? Recommendation: yes, behind
  `MARS_ARCADE_RULES.useBounds`, shipped off, with a table in the PR showing every move's old
  and new connect distance. Gates M3.
- **D. Tooling home.** Port the aligner/onion-skin/manifest ideas into our gym (recommended)
  versus `pip install spriterrific` for its GUIs. Gates M2/M4 only if the answer is "use it".

## Milestones

### M1 — One data contract per animation (no visual change)

Observable: `npm run arcade:validate` lists every fighter animation with its frames, phases,
holds, boxes and any rule violation; the harness, gym and tests read the same file.

- `art-source/arcade/<fighter>/<set>/<clip>/animation.json` (or one
  `src/game/marsArcadeAnimations.json` if art-source is too far from the bundle — decide at
  implementation, the schema is the same):

  ```json
  {
    "version": 2, "fighter": "oracle", "animation": "heavy", "moveId": "oracle.hardCutoff",
    "cell": {"size": 128, "pivot": [64, 120], "baseline": 119},
    "loop": "once", "alignment": "planted-foot",
    "frames": [
      {"file": "heavy-00.png", "pose": "wind-up", "phase": "startup", "hold": 6,
       "boxes": {"collision": {...}, "hurt": [{...}]}},
      {"file": "heavy-02.png", "pose": "contact", "phase": "active", "hold": 4,
       "boxes": {"collision": {...}, "hurt": [{...}], "attack": [{"x":84,"y":96,"w":20,"h":13,"guard":"low"}]}}
    ]
  }
  ```

  Keyed by **file name**, so inserting a pose cannot move a box. `hold` is engine frames, so the
  gym plays real timing and `selectArcadeSprite` reduces to "walk the table". Several hurt
  boxes per frame allowed. `attack.guard` carries decision B.
- `src/game/marsArcadeAnimation.ts`: parse, migrate v1 → v2 (positions become file names using
  today's `ARCADE_GYM_ANIMATIONS` order, once, with a test), and the validator with severities:
  every frame has `collision` + ≥1 `hurt`; `attack` only on `active`; attack outer edge ==
  `reach` ± 3 unless the frame carries `"reachException": "<reason>"` (booster heavy's 34/38);
  collision bottom == baseline; every box inside the envelope `x∈[5,123], y∈[7,127]`; hurt box
  inside the silhouette's bbox (read the PNG alpha in the tool, not in the browser); holds sum to
  the move's startup/active/recovery ± the budget's tolerance; loop clips have no `attack`.
- `tools/assets/arcade-anim.mjs validate | frame-data | count`: the sprite count the check
  scripts want becomes `count`, deleting the eleven hard-coded 61/68s.
- Tests: migration is lossless; the validator rejects each rule with an injected defect
  (mutation-test it, as `check-popt-frames-fullcolour.test.py` does).

### M2 — Gym v2

Observable: in `/dev/gym.html` the owner can author a full move in one sitting without
touching JSON, see the previous drawing as a ghost, scrub at real timing, and cannot save an
invalid file.

- Onion skin (previous and next drawing at 35 % alpha, toggle `O`).
- Copy boxes from previous frame (`C`); arrow keys nudge the selected box 1 px, Shift 5 px;
  `[`/`]` step frames; Undo (`Ctrl+Z`, in-memory stack).
- Timeline scrubber using `hold`, plus the existing Play at 0.5/1/2.
- Mirrored preview toggle, to catch boxes authored past the pivot for a left-facing fighter.
- Per-kind visibility toggles; inactive kinds faint, active solid (the reference's playground
  convention).
- Opponent overlay: draw the other fighter's idle at a chosen separation, with its hurt box, so
  "does this connect at reach" is visible while authoring.
- Auto-fit: a button that proposes a hurt box from the drawing's alpha bbox shrunk by 2 px, and
  a collision box of the fighter's push width centred on the pivot; the author adjusts.
- Save runs the M1 validator first and shows errors inline; the Vite plugin validates again
  before writing.
- Render the cell at the harness's 3x (or make both read one constant).

### M3 — Rules read the boxes (owner-gated)

Observable: with `useBounds` on, the jab connects only when its attack box overlaps a hurt box;
a low attack passes a standing block; every connect emits `hitstop` and the harness flashes
the defender white for 2 frames and freezes both for `hitstop` frames.

- `collectMeleeHits`: box overlap via `marsArcadeBoxToStage` for the current drawing (the
  drawing is looked up from the M1 table by phase and elapsed frames, so the rules module gains
  a pure `drawingAt(move, frame)` — no canvas).
- Guard per decision B; pushbox from the fighter's data instead of the constant.
- `hitstop` in frame data (2/4/6 for light/heavy/special as a starting point), applied as a
  shared freeze counter; the loop already emits `hit` / `blocked` / `guardCrush` events.
- The pinned 41-vs-56 test becomes the retune table: for each move, old connect distance, new,
  and the reach chosen to restore it.
- Playground JSON (`dev/arcade.html` gains sliders that write `src/dev/arcadePlayground.json`
  through the same Vite plugin) — the reference's fourth thing, still unbuilt.

### M4 — Clip-level sprite pipeline

Observable: `tools/assets/normalise-arcade-clip.py <clip-dir>` produces the runtime PNGs, an
`animation.json` skeleton, a contact sheet, a GIF and a `review.md` with before/after; the
audit fails on sequence drift the current gate cannot see.

- One alignment rule per clip (`planted-foot`, `torso`, `bbox`, `preserve-canvas`) applied with
  **one** scale and offset for the whole clip, so a drawing can only move relative to its
  neighbours if the art moved. Locked per-fighter scale stays the law.
- Sequence audit, thresholds in the contract: intra-clip visible-height drift ≤ 4 %, centre-x
  drift ≤ 2 px on in-place clips, bottom drift ≤ 1 px on grounded clips, width overflow 0,
  neighbour silhouette IoU on the rigid upper body ≥ 0.85 (the measurement that actually worked
  in `tmb2-sprite-sheet-order`), head-width ratio within 5 % of the anchor (the ruler that does
  not foreshorten).
- Chroma: keep the distance-to-key vs distance-to-palette rule; add the removed-to-kept ratio
  warning; assert the fringe sweep never runs after downscale.
- Fold Spriterrific's negative list into the prompt pack's invariant block (no ground shadow,
  contact disk, floor line, palette or costume drift, motion blur, smear frames, feet fused for
  in-place).
- If decision A is yes: `tools/assets/pick-arcade-frames.py` — dense extraction, per-action
  policy, near-duplicate rejection, settle-skip — feeding the same clip normaliser.

### M5 — The loop is written down

Observable: `.agents/skills/arcade-animation/SKILL.md` lets a fresh session ship one animation
end to end; docs no longer contradict the tools.

- Skill: generate → normalise clip → audit → gym boxes → validate → harness proof → asset report,
  with the human gates named (anchor, pose acceptance, alignment, box sign-off, balance).
- Retire the stale README scale table, fix the contract's `alignment` and reach-checker notes,
  refresh `0044-mars-arcade-resume.md` counts, add `docs/GAME_DESIGN.md` cross-reference.

## Implementation order and estimate

M1 → M2 → M4 → M5 landed together as one PR (the workflow), because M2 and M4 both depend on
M1's table and shipping them separately would have meant three PRs stacked on each other,
which the PR-batching rule forbids. M3 is a balance change and goes in its own PR after this
one merges, so its reach retune table is reviewable on its own.

## Validation plan

- Unit: validator mutation tests; migration round-trip; `drawingAt` against every move's frame
  data; overlap vs reach table.
- Browser (port 5360, Chromium via the main checkout's `node_modules` symlink trick): gym
  keyboard path, save-rejects-invalid, onion skin screenshot, opponent overlay at reach;
  harness with `useBounds` on and off; reduced-motion unaffected (dev-only page).
- Visual: contact sheet + GIF per clip in `preview-renders/mars-arcade/<clip>-v2/`, restored
  outside this branch's prefix before commit.
- Widths: gym at 1440 and 768 (375 is out of scope for a dev tool; note it).

## Acceptance criteria

1. `npm run arcade:validate` exits 0 on main and reports every fighter animation.
2. Every gym animation has boxes on every frame; zero position-paired data remains.
3. Inserting a pose into a clip in the gym moves no existing box (test).
4. The gym's Play matches the harness's timing for the same clip (recorded video, frame counts
   equal).
5. The audit fails a clip with an injected 6 % height drift and passes every shipped clip, or
   the report names which shipped clips fail and why.
6. With `useBounds` on, every move's connect distance matches the retune table.
7. `TEST_REPORT.md` and each milestone's asset report carry actual command output.

## Repair loop and stop conditions

Per milestone: implement → validate → full-diff review → repair, at most three passes. Stop
for owner review at the end of M2 (gym proof), before M3 (decisions B/C), and after M4's
first audited clip.

## Progress

- [x] 2026-09-23 — Research: codebase map, Spriterrific source read (v0.20.4), Framesmith
  schema and MCP, fighting-game box conventions; this plan drafted.
- [x] 2026-09-23 — Owner approved milestones 1–5 and decided A–D.
- [x] 2026-09-24 — M1: `marsArcadeAnimations.json` v2 + `marsArcadeAnimations.ts` (parse,
  validate with severities, `marsArcadeFrameAt`, `marsArcadeDrawingAt`); harness derives its
  sprite list and plays moves, walks, idles, outcomes from the table; v1 migrated and pinned;
  `tools/assets/arcade-anim.mjs validate | frame-data | count | list`; 15 check/record
  scripts no longer hard-code the sprite count.
- [x] 2026-09-24 — M2: gym v2 (`src/dev/arcadeGym.ts`, `dev/gym.html`), Save validated in the
  page and in the Vite endpoint, `tools/assets/check-arcade-gym.mjs` proof at 1440 / 768.
- [x] 2026-09-24 — M4: `normalise-arcade-clip.py` (five alignment modes, parity with the
  per-frame tool), `audit-arcade-clip.py` (sequence audit, contact sheet, GIF, review.md),
  `pick-arcade-frames.py` (video picks), each with a self-proving test.
- [x] 2026-09-24 — M5: `.agents/skills/arcade-animation/SKILL.md`; README scales and intro,
  contract pipeline notes, resume doc, TEST_REPORT, asset report.
- [x] 2026-09-24 — Playground JSON (part of M3, pulled forward at the owner's ask to match the
  reference's fighter playground): `marsArcadeTuning.json` + `arcadePlayground.ts`, live tuning
  with Save, authored-box overlay on the sprites, dev shell shared with the gym.
- [x] 2026-09-24 — Decision A executed: `generate-arcade-video.py` (free Hugging Face Spaces),
  first Oracle walk clip generated, picked, normalised, gated and audited; see
  `asset-reports/mars-arcade-walk-video-trial-2026-09-24.md`. Audit fails on the model's 3–4 px
  body sway; per-drawing nudge or a stricter prompt is the next step.
- [x] 2026-09-24 — `arcade-anim.mjs wire` puts a normalised clip in the table (and so the gym) in
  one step; the playground's Candidates section previews any `<shipped>-video|-candidate|-alt`
  clip in the fight without touching the table; the picker measures a cycle's period instead
  of guessing (the first Oracle video walk played backwards from a guessed spacing).
- [x] 2026-09-24 — CI fix for PRs #98/#99 (locker settle-before-stage race; two sub-frame
  transients asserted on per-frame canvas attributes). Same commit on both branches.
- [x] 2026-09-25 — Per-drawing nudge: `normalise-arcade-clip.py --nudge INDEX:DX,DY`, recorded
  in the report, tested (moves exactly that drawing, others byte-identical, bad input refused)
  and mutation-checked. It cannot rescue the video walk: no gate-legal nudge passes the audit,
  because the pops are a 4 px vertical bob in the drawings; see the trial's asset report.
- [x] 2026-09-26 — Wan first-last-frame walk from the shipped drawing (owner's `HF_TOKEN`):
  passes the gate 4/4 and the audit (1 px bob, like the shipped walk). Now the
  `oracle:walk-forward-video` candidate. The normaliser clamps spill again after resampling.
- [x] M3 — rules read the boxes behind `useBounds`, guard height as a move property, pushbox
  from data, hit stop + flash events, playground JSON. Built 2026-09-24 in its own PR; plan,
  connect table and evidence in `plans/0047-mars-arcade-bounds-rules.md`. Both switches ship
  off pending the owner.
- [ ] Owner: review seeded boxes in the gym (20 clips flagged `reviewed: false`).
- [ ] Decision A follow-through: a provider key for one paid trial (see Discoveries).

## Where to resume (updated 2026-09-25)

- PR #99 merged at `1bf19c8`, before its last five commits (video trial, `wire`, picker period
  fix, candidate switch, these notes) were pushed; they were stranded on
  `feat/arcade-animation-workflow-v2` and are carried onto `main` by PR #102
  (`fix/stale-arcade-checks`, worktree `.worktrees/arcade-checks`, dev port 5381). M3 merged
  separately as PR #101. The candidate override now lives in `marsArcadePose.ts` so the rules
  read a candidate's boxes while its drawings are on screen.
- Pages: `/dev/gym.html` (character gym) and `/dev/arcade.html` (fighter playground), one shell.
- Owner queue: a gym pass over the 20 seeded clips (tick "boxes reviewed"); decide whether the
  video walk (`oracle:walk-forward-video`, candidate) replaces the shipped one; a free Hugging Face
  token in `HF_TOKEN` unlocks the Wan first-last-frame route (anonymous quota refuses it).
- Next engineering: (1) tidy the playground's Combat rows (they wrap); (2) the Vite config
  warning about extensionless imports; (3) teach the picker that a first-last-frame clip is one
  cycle long (today: `--span-factor (frames-1)/N`). The Wan walk (2026-09-26) is the candidate;
  the owner decides whether it replaces the shipped walk.
- Evidence: `TEST_REPORT.md` 2026-09-24, `asset-reports/mars-arcade-animation-workflow-2026-09-24.md`,
  `asset-reports/mars-arcade-walk-video-trial-2026-09-24.md`, `preview-renders/mars-arcade/{gym-v2,clips,playground-v1}`.

## Discoveries

- 2026-09-25: the sequence audit and the per-cell gate disagree on tolerance (feet ±1 row vs
  exact; torso 2 px vs 1 px). A nudge set searched to pass the audit failed the gate on both
  nudged drawings. Any automatic aligner must be scored against the gate too, never the audit
  alone.

- Spriterrific needs a video provider (FAL key) for motion; stills can come from Codex
  `image_gen`, which is what its own skill recommends when FAL is absent — the same route we
  already use.
- Its frame picker skips the first 8 % (walk) to 20 % (run) of a clip as settle frames and
  spaces picks at ~3 dense frames per drawing for walks; both are empirical constants for
  specific models and would need re-measuring for ours.
- Its `preserve-canvas` layout is exactly the opposite of our per-drawing feet alignment: one
  `scale`, one `paste` for the whole clip, recorded in metadata. Ported as `--align preserve-canvas`.
- **Decision A, cheap or free video:** the machine cannot run a video model locally (GeForce
  GTX 1050 Ti, 4 GB). Hosted, the cheapest workable image-to-video are the small open models
  (LTX-Video / LTX-2, Wan 2.2 5B) at 480p: a few cents per 3–5 s clip on fal.ai, which also
  gives new accounts $10 of free credit — enough for the whole trial (one walk = ~12 clips
  worth of attempts) without paying. Seedance-class models are cheaper per second on some
  resellers but not needed for a 44 px sprite. The owner has to create the account and set
  `FAL_KEY` locally; nothing in the repo may call a paid API. `pick-arcade-frames.py` and
  `normalise-arcade-clip.py --align preserve-canvas` are ready for the first clip.
- The sequence audit's head-width proxy is not a ruler at cell resolution: a fist beside the
  face or a raised arm across the top rows moves it 20–90 %. It is reported, never judged;
  scale is measured on the source at the locked scale (memory: never one ruler).
- The audit's first pass over the shipped clips found two hurt boxes on `oracle:heavy` that
  leave the drawing (sweep, settle): boxes migrated by position in PR #98 landed on poses
  they were not drawn for. Left as warnings for the owner's gym pass; not silently moved.
- The clip normaliser only matches the per-frame tool bit for bit once it drops alpha ≤ 8 at
  placement, as that tool does; the gate treats those pixels as non-figure anyway.
- Node's own type stripping cannot resolve extensionless TS imports, so the CLI loads the
  schema through Vite's `ssrLoadModule` rather than keeping a second copy of the rules.

## Decision log

- 2026-09-23 — Propose porting ideas rather than adopting the package: our cell/scale contract
  is settled and its GUIs are Tk desktop apps, while our authoring surface is the browser gym.
  Owner confirmed (D).
- 2026-09-24 — Hurt and attack boxes are lists per frame; body and guard are one per frame.
  Guard height will be a move property (B), so the guard box stays a gym visual for blocks.
- 2026-09-24 — Seeded boxes ship flagged `reviewed: false` rather than not at all: the fight
  loop does not read boxes yet, the validator needs body + hurt on every frame to mean
  anything, and an honest warning beats an empty frame.
- 2026-09-24 — The gym renders at 4x (authoring), the harness at 3x; boxes are cell pixels so
  the difference is cosmetic, and the parity item from the proposal is dropped.
- 2026-09-24 — Sprite labels are uniform `<clip> <phase> — <pose>`; the two continuity proofs
  were updated to match rather than special-casing the base drawings.

## Evidence

Research sources: Spriterrific PyPI 0.20.4 package contents (`skills/spriterrific/SKILL.md`,
`media.py`, `post_selection.py`, `size_contract.py`, `frame_aligner.py`, `chroma.py`,
`presets.py`, `manifest.py`); spriterrific.com fighting-game page; phaser.io 2026-06 "Vibe Code
a Street Fighter Clone"; github.com/RobDavenport/framesmith docs (data-formats, rules-spec,
mcp-server); Explore-agent map of `origin/main` a2c8d8e and PR #98.

Build evidence (2026-09-24), all actually run: `TEST_REPORT.md` entry of that date and
`asset-reports/mars-arcade-animation-workflow-2026-09-24.md`. Screenshots in
`preview-renders/mars-arcade/gym-v2/`, clip reviews in `preview-renders/mars-arcade/clips/`.
