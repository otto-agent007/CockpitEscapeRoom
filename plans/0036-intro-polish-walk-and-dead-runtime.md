# Intro polish: the twelve-frame walk and the dead runtime from the cut acts

## Purpose

Two rough edges remain in the intro after plans 0034 and 0035 closed at the owner gate. The one the
owner will see: the long walk across the hangar floor plays a six-frame cycle at **7.7 drawings per
second**, while the ident run beside it plays twelve frames at 25 fps because the owner asked for
more frames when he saw it. The walk is the longest continuous character animation in the intro
(4.05 s on screen) and it is the choppiest thing left. The one the owner will not see: the runtime
still carries the machinery of three acts that were cut during 0035 — the takeoff pass, the runway
lineup and the attract loop — including seven retired DC-9 sprites that still ship in `public/`.

## Current state

- `POPT_CLIPS.walk` in `src/game/introAnimation.ts` is a six-frame cycle, `26x50` cells,
  `[130, 130, 130, 130, 130, 130]` ms — a 780 ms stride at 7.7 fps. `POPT_CLIPS.run` is twelve
  frames at 40 ms (25 fps) after Wave S13 interleaved six in-betweens into the six Wave S7 poses.
- Measured on the deployed sheet 2026-08-21: the six walk poses are genuinely distinct (frame-to-
  frame silhouette change 8.1–13.5%), all six normalise to 48 px tall on one shared scale, and the
  head centroid varies by only 0.23 px across the cycle. **Nothing is wrong with the art; the cycle
  is under-sampled in time.**
- Dead runtime, none of it reachable from `deriveIntroAnimation`:
  - fx kinds `contrail`, `exhaust` and `nav-strobe` — the takeoff act's climb-out trail, engine
    exhaust and navigation strobes — still declared in `IntroFxFrame`, still layered in `FX_LAYER`
    and still drawn by three `renderFx` cases. `contrail` is also still listed in
    `REDUCED_MOTION_FX`.
  - `pixelCollapse` on every animation frame, always `0` since the attract loop was retired, plus
    the `pixel-collapse` draw command and `drawPixelCollapse`.
  - `EMBLEM_REVEAL_STYLE`, exported and referenced nowhere since the emblem finale was cut.
  - The doc comment on `deriveHandoffAnimation` still says the handoff zooms "the winged-globe
    emblem" out of the title card; it has zoomed the lettered title since 0035.
  - `tools/assets/deploy-scramble-intro.py` still copies seven retired jet sprites
    (`dc9-runway`, `-36`, `-26`, `dc9-liftoff-48`, `-80`, `-160`, `-320`) into
    `public/images/intro/tmb2/scramble/sprites/`, and all seven are still hash-bound in
    `tmb2-intro-assets.json` (63 assets). They are not preloaded, so they cost no load time, but
    they ship in the build and imply an act that no longer exists.

## Scope

Included: six generated in-between walk poses and their deployment into a twelve-frame sheet; the
walk clip timing; retirement of the dead fx kinds, the pixel collapse, the emblem constant and the
seven shipped jet sprites; the tests and asset contract that follow; browser proof of the walk act.

Excluded: the walk plate, the walk act's staging and duration, every other cue and beat (all
owner-approved this arc); the ident run and gag (0034, complete); reinstating any cut act.

## Context and constraints

- **The stride must not change speed.** Doubling the frames keeps the 780 ms cycle: twelve frames
  at 65 ms. Any other duration retimes a walk the owner has already approved.
- **Pixel grid (plan 0030).** The walk draws at `scale` 1 into a `26x50` cell; the new frames must
  normalise to the same 48 px height on the *shared* reference scale
  (`normalise-scramble-sprite.py --ref`), never per frame — per-frame normalisation makes a
  character grow and shrink between poses.
- **Generation route** (`popt-frame-generation-pipeline`): Codex CLI's built-in `image_gen` on the
  ChatGPT plan, never `scripts/image_gen.py` and never with `OPENAI_API_KEY` in the environment.
  Flat cel-shaded art on a `#FF00FF` field; no text anywhere; four gold epaulette stripes stated as
  its own numbered instruction; gold eyebrows, never black.
- **Deleting a test is only allowed when the property it asserted is structurally impossible.**
  Removing the pixel-collapse machinery makes `not.toContain('pixel-collapse')` a check that cannot
  fail, so it goes with the machinery — and the meaningful property (the intro *holds* the title at
  53 s) stays asserted where it already is.
- Retired art stays in `art-source/` as the evidence trail; only `public/` is cleaned.

## Progress

- [x] 2026-08-21 — Motion census over the whole timeline: per-scene change rates, longest holds and
      per-scene sprite frame rates. Identified the walk as the only under-sampled animation.
- [x] 2026-08-21 — Measured the walk sheet: pose differentiation, shared scale, centroid jitter.
- [x] 2026-08-21 — Wave S16 (one-sheet route) generated and **rejected on measurement** — see
      Discoveries. Wave S16B re-generates each in-between as its own delta against the two
      approved frames it sits between.
- [x] 2026-08-21 — Wave S16B/C/D: six in-between walk poses generated as per-pose deltas,
      normalised to 48 px, deployed into a twelve-cell sheet. Ten generations in total — t1 and t4
      passed first time, t2 and t5 needed a head-size pass, t3 and t6 needed three each.
- [x] 2026-08-21 — Walk clip retimed to twelve frames at 65 ms (780 ms stride unchanged); the clip
      test now pins the frame count, the stride total and that every frame is held equally long.
- [x] 2026-08-21 — Dead runtime retired: the `contrail`, `exhaust` and `nav-strobe` fx kinds with
      their `FX_LAYER` entries and draw cases; `pixelCollapse`, the `pixel-collapse` command and
      `drawPixelCollapse`; `EMBLEM_REVEAL_STYLE`; the stale DC-9-sprite and winged-globe comments.
      Seven jet sprites dropped from `deploy-scramble-intro.py` and deleted from `public/`.
      Manifest rebuilt: **56 hash-bound assets / 49 preloads** (was 63/49). `npm run test`
      **417/417**, `npm run assets:check` passed, `tsc -b` clean.
- [x] 2026-08-21 — `npm run check` (ESLint, tsc, **417/417 across 33 files**, production build) and
      `npm run assets:check` (**56 assets / 49 preloads**) pass. New browser guard
      `e2e/smoke.spec.ts` "plays the walk at twelve drawings a stride" passes; browser proof
      captured at 1440x900 on the production build:
      `preview-renders/tmb2-intro-overhaul/walk-12frame-proof.png` with the per-frame log in
      `walk-frames/manifest.txt` — twelve consecutive 65 ms samples, each asserting its own
      `data-time`, `data-scene=walk` and `data-audio-failed=false`, returning drawings 0…11 in order.

## Discoveries

- 2026-08-21 — The census had to separate *content* changes from *camera* changes: accent punches
  and shake alter the camera on nearly every frame, so a naive per-frame diff reports every scene as
  busy. With fx excluded, the body of the intro sits between 0.0 and 8.7 content changes per second;
  the walk's 33.9/s is almost all sub-pixel translation, not new drawings — which is exactly why the
  cycle reads choppy while the figure glides.

- 2026-08-21 — **The one-sheet tween route failed and the failure was only visible under
  measurement.** Asking for all six in-betweens as a single row (`s16-walk-tweens.png`, the exact
  shape that worked for the Wave S13 run tweens) returned six plausible-looking poses whose boot
  spans measured 153, 142, **206**, 152, **186**, **208** px against the approved cycle's 171, 150,
  112, 169, 155, 124 — three of the six stride WIDER than any approved frame, so interleaving them
  would have lurched from the narrowest pose (112) straight to the widest (206) in one 65 ms step.
  The same sheet also came back 7% shorter than the approved figures (513 vs 552 px) and, because
  the prompt carried the pack's standing "FOUR gold stripes" and "round red-ringed badge" rules into
  a shot filmed from behind, it drew shoulder stripes and a cap badge that the approved rear-view
  art does not show. Two lessons: a standing identity rule can be wrong for a specific camera, and a
  tween sheet must be measured against its neighbours' stride, not eyeballed at sheet scale.

- 2026-08-21 — **Acceptance had to be judged in deployed pixels, not ratios.** Two candidates for
  the same in-between could each be "wrong" on a different measure — one 1.5 px small in the head,
  the other 1.3 px wide in the stride — and ratio deltas made them look far apart. Converted every
  measurement to its size on the 48 px sprite and chose on that: head consistency wins, because the
  head is a fixed identity feature that would pulse every 65 ms, while a stride overshoot only
  varies an easing the eye reads as weight.
- 2026-08-21 — **The model cannot hit a numeric stride target.** For the two in-betweens between
  passing and contact it drew 0.445, then 0.395 with an explicit "must stay between 23% and 27% of
  his height" instruction, then 0.167 when the same frame was framed as "move the leg one third of
  the way". Wording dominates; numbers do not steer it. The accepted frames sit 1.0–1.7 px *under*
  their bracket rather than 4–7 px over, which reads as the feet crossing a beat later — a passing
  pose — instead of a kick. The largest single step in the cycle is still the reach into the plant,
  which is where a real walk is fastest.
- 2026-08-21 — **The head wobble was not a packing bug.** Bounding-box centring left the head
  centroid spread across 1.29 px over the twelve cells against 0.23 px over the approved six, which
  looked like the classic lopsided-pose drift. Anchoring every cell on its torso centroid instead
  produced a **byte-identical sheet**: integer placement quantises the 0.4 px the two anchors
  differ by. The anchoring code was reverted rather than kept as decoration, and the finding lives
  in `cell_pack`'s docstring. The residual spread is the art itself, measured at the alpha
  threshold, not the packer.

## Decision log

- 2026-08-21 — Generate each in-between as its own delta against a two-frame reference (the
  approved poses either side, cropped side by side onto one magenta field in
  `refs/walk-pairs/`), rather than as one six-pose sheet. The pair image pins stride, height,
  camera and uniform to the two frames the tween must sit between, which a text description of
  "halfway" demonstrably did not. Consequence: six generations instead of one.
- 2026-08-21 — Double the walk frames rather than slow the cycle or restage the act. Slowing the
  cycle would desynchronise a stride the owner approved and would not add information; the act's
  duration is pinned between the shades cut (31.6) and the aircraft reveal (35.64).
- 2026-08-21 — Delete the seven jet sprites from `public/` but keep them in `art-source/`, matching
  the 0035 decision to keep them as evidence for why the takeoff act was replaced. The rejected
  Wave S16 generations are kept in `art-source/.../generated/` for the same reason — they are the
  evidence behind the stride measurements in Discoveries.
- 2026-08-21 — **Deliberately left alone**, though both are currently inert: the hitstop mechanism
  (`hitstopTime` with an empty `SCENE_HITSTOP` table) and `backgroundOffsetX` (always 0). Neither
  belongs to a cut act — they are working, tested devices with no scene currently using them, and
  removing a switch the owner may want thrown is not cleanup. Retiring dead *acts* is; retiring
  unused *tools* is a different decision and not this plan's.

## Milestones

1. The walk cycle plays twelve drawings per stride at the same walking speed, proven by a frame
   census of the deployed sheet and by browser capture of the walk act.
2. The intro runtime contains no code, asset or command belonging to a cut act, proven by a sweep
   test over the whole timeline and by the asset contract count dropping to 56.

## Implementation steps

- `art-source/intro/tmb2/scramble/prompts/s16-walk-tweens.txt` and `wave-s16-driver.sh` — generate
  `generated/s16-walk-tweens.png` against the approved walk sheet and the canonical identity sheet.
- `tools/assets/slice-scramble-sheet.py` → six crops; `tools/assets/normalise-scramble-sprite.py
  --height 48 --ref spr-popt-walk-1.png` → `normalised/spr-popt-walk48-t{1..6}.png`.
- `tools/assets/deploy-scramble-intro.py` — interleave the twelve walk frames the way the run is
  interleaved; drop the jet-sprite copy loop.
- `src/game/introAnimation.ts` — walk clip to twelve 65 ms frames; remove the dead fx kinds,
  `pixelCollapse`, `EMBLEM_REVEAL_STYLE`; correct the handoff comment.
- `src/game/introRenderer.ts` — remove the three fx cases, their `FX_LAYER` entries, the
  `pixel-collapse` command kind, its case and `drawPixelCollapse`.
- `tools/assets/intro-asset-contract.mjs` — drop the jet sprites; `node
  tools/assets/build-intro-manifest.mjs`.

## Validation plan

- Unit: walk clip geometry and timing (twelve frames, 65 ms, 780 ms stride preserved); a sweep
  asserting no retired fx kind is produced at any time across 0–53.04 s; the reduced-motion allowed
  set narrowed to the kinds that still exist.
- Asset: `npm run assets:check` at the new count; a sheet census proving twelve 26 px cells, one
  shared scale, feet on the pivot row.
- Browser: the walk act captured at 1440x900 on the production build through the puppeted-media
  harness (never scrub an MP3 — see the render forensics in 0035), sampling several frames across
  31.6–35.64 s to show distinct drawings.
- Full: `npm run check`, `e2e/smoke.spec.ts`.

## Acceptance criteria

- The deployed walk sheet is twelve `26x50` cells; the runtime advances a drawing every 65 ms and
  completes a stride in the same 780 ms as before.
- No fx kind, draw command, exported constant or shipped sprite belonging to the takeoff, runway or
  attract-loop acts remains in the runtime or in `public/`.
- `npm run check` and `npm run assets:check` pass; `e2e/smoke.spec.ts` passes at its prior count.
- No change to any cue time, scene boundary or card in the approved edit.

## Outcome and handoff

**Complete — 2026-08-21.** Both milestones met and validated:

- The walk plays twelve drawings a stride at the same walking speed. Deployed sheet: twelve 26x50
  cells, every figure 48 px tall with its feet on the pivot row, frame-to-frame silhouette change
  7.9–16.1%. Browser proof `preview-renders/tmb2-intro-overhaul/walk-12frame-proof.png`.
- The intro runtime carries nothing from the takeoff, runway or attract-loop acts. Asset contract
  down to 56 assets / 49 preloads.

Commands actually run: `npm run check` (ESLint, `tsc -b`, **417/417 Vitest across 33 files**,
production build) — passed. `npm run assets:check` — passed, 56 assets / 49 preloads.
`npx playwright test` (full suite) — **60 passed, 1 skipped, 1 failed**; the failure is
`e2e/airbus-workload.spec.ts:242`, the width assertion recorded as pre-existing in plans 0034 and
0035 and reproduced there on a clean tree, failing here with the identical numbers (topbar bottom
183.94 against a 145.59 limit). Not touched by this work.

Placeholders and limitations, stated plainly:

- Three of the twelve walk drawings sit just outside the ideal bracket at deployed size — t2 by
  0.2 px and t5 by 1.3 px wide, t3 by 1.7 px and t6 by 1.0 px narrow. The narrow pair read as the
  feet crossing a beat later rather than as a hitch; the reach into the plant remains the cycle's
  largest single step, which is where a real walk is fastest.
- The generated art is the model's, not an animator's: the tweens' heads measure 0.344–0.361 of
  figure height against the approved 0.359–0.362, a sub-pixel-to-0.7 px difference at 48 px.
- Nothing here changes a cue time, a scene boundary, a card or the edit. The candidate render for
  the owner gate, `intro-fastopen-2026-08-20.mp4`, predates this work and still shows the six-frame
  walk; a fresh full render is worth capturing before the owner reviews, and needs the puppeted
  media harness described in 0035 (never scrub an MP3 across the track).

Still at the owner gate. Nothing pushed.
