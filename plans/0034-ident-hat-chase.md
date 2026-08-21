# TMB2 ident: smaller logo and the hat-chase gag

## Purpose

The first six seconds of the game are the TMB2 ident. Today the logo fills 90% of the stage and
Pop T's only business is to run in, skid, tap it and leave. After this work the ident reads like a
Genesis-era studio sting: a half-width logo with dark stage around it, and a short physical gag —
the logo slams in, the gust blows Pop T's captain's cap off, he chases it down, catches it, puts it
back on and salutes — carried by synthesized period-correct sound effects. It is the first thing
anyone sees, so it sets the tone for the whole legacy flight.

## Current state

- `tools/assets/build-tmb2-ident-assets.py` derives three mask layers from the owner-approved
  `art-source/intro/tmb2/owner-approved/TMB2logo.png` (SHA-256 guarded) at `IDENT_SIZE = (288, 79)`,
  and separately draws a `PRODUCTIONS` wordmark from an inline bitmap font onto a full-stage
  320x224 layer at `PRODUCTIONS_Y = 168`.
- `introRenderer.ts` draws those layers into `IDENT_TARGET = { x: 16, y: 72, width: 288, height: 79 }`
  on the 320x224 stage — 90% of stage width — and composites `logo-productions` full-stage.
- `introAnimation.ts` case `tmb2-ident` runs the current gag on the 0.72 s accent grid:
  `ENTER 1.776`, `SKID 2.496`, `TAP 3.936`, `FLARE 4.656`, `EXIT 5.376`.
- Sprites are `popt-run-sheet.png` (6 frames, 64 px), `popt-skid.png`, `popt-tap.png`, all wearing
  the cap. Their high-res sources are `art-source/intro/tmb2/scramble/generated/s4-ident-*.png`.
- There is no sound-effect layer at all. The intro has one `<audio>` element playing
  `public/audio/intro-audio-53s.mp3`, with a `fallback` clock mode in `introRuntime.ts` for when
  media playback fails.
- Pop T's canonical identity was defined in Wave S6 as
  `art-source/intro/tmb2/scramble/refs/identity-popt-canonical.png`. The existing sprites predate
  it and are out of step on three counts: black eyebrow bars instead of blond, three epaulette
  stripes instead of four, and a plain gold-banded cap with no badge.

## Scope

Included: logo resize to 160x44 and recentering; complete removal of the PRODUCTIONS wordmark; a
new ident gag with its sprite wave, regenerated to the canonical identity; a synthesized sound
effect layer for the ident; all affected tests and asset checks.

Excluded: the rest of the intro's scenes and cards; the case-scene cut, the photo cut, the watch
card, the takeoff art and the launch-sequence reorder, which are separate open items; any sound
effects outside the 0–6 s ident window.

## Context and constraints

- **Pixel grid.** One art pixel must occupy a whole number of stage pixels. The logo layers are
  re-derived from the source at the new size by the builder, never squashed at draw time, so they
  stay exact. Sprites keep integer draw scale, guarded by the existing sweep in
  `introAnimation.test.ts`.
- **Identity.** Every regenerated sprite must attach `refs/identity-popt-canonical.png` as the
  character reference. Blond eyebrows, four stripes, the canonical badged cap.
- **Tone contract.** The gag is slapstick about a hat, never about the aircraft. Nothing may read
  as a malfunction, emergency or accident.
- **Audio privacy and cost.** No downloads, no paid APIs, no third-party audio. Sound effects are
  synthesized in the browser with WebAudio, which is also period-correct: the Genesis used an FM
  chip and a square/noise PSG.
- **Accessibility.** Reduced motion keeps its single held logo frame and plays no gag and no sound
  effects. Sound effects must honour the existing `muted` and `volume` state and must never be the
  only channel carrying meaning.
- **Determinism.** The sound cue table is a pure module so tests assert every beat without
  constructing an AudioContext.
- **PRESS START** stays available from 6 s; the gag must finish inside the ident window.

## Progress

- [x] 2026-08-20 — Owner picked 160 px (50%) logo, gag A (hat chase), and removal of PRODUCTIONS.
- [x] 2026-08-20 — Milestone 1 complete: logo 160x44 at y=78, wordmark gone, 407/407 green, browser proof captured.
- [x] 2026-08-20 — Milestone 2 complete: 4 generations, all sprites on the canonical identity.
- [x] 2026-08-20 — Milestone 3 complete: gag animates end to end, browser proof at all 8 beats.
- [x] 2026-08-20 — Milestone 4 complete: synthesized SFX firing on every beat, verified in-browser.
- [~] 2026-08-20 — Milestone 5: unit, asset, e2e and responsive proof done; owner gate outstanding.

## Discoveries

- 2026-08-20 — The logo is 288 px on a 320 px stage, 90% of width. The SEGA ident it is modelled on
  sits near half the screen. Mock of four candidate sizes rendered honestly through the real build
  crop: `preview-renders/tmb2-intro-overhaul/ident-logo-sizes.png`.
- 2026-08-20 — The derived masks are authored at exactly the on-stage size (288x79 files drawn
  1:1), so resizing is a builder change, not a renderer scale change.
- 2026-08-20 — **CORRECTED: the "375 px controls hide the gag" finding was wrong.** It came from a
  375x248 viewport I invented by taking height = width x 0.66, which is not a shape any phone has.
  Scanned across real viewports on the unmodified layout, counting how many of the stage's 224 rows
  the controls cover: 360x640, 375x667, 390x844, 414x896, 375x550 and 375x480 all cover **0 rows**.
  Coverage only begins at 375x400 (7 rows) and 375x320 (47 rows). Landscape phones cover the bottom
  19-22 rows — 667x375 covers 22, 844x390 covers 19 — and since Pop T's feet sit on row 196 those
  rows are empty, so the gag is never obscured on any real device.
  I had built a stacked narrow-width layout for this and reverted it: the regression test I wrote
  alongside it passed with the fix removed, which is what exposed the whole finding as an artifact.
  A check that cannot fail proves nothing. Replaced with a test that measures the real invariant —
  the top stage row the controls cover must stay at or below row 200 — run at portrait and landscape
  phone sizes, and proven to fail when the threshold is moved to 224 (landscape measures 201.7, so
  the true clearance below the gag is about five rows).
- 2026-08-20 — `e2e/airbus-workload.spec.ts:242` ("workload controls remain reachable ... at 375,
  768, and 1440 widths") fails on this branch: the topbar bottom lands at 183.94 against a limit of
  145.59. **Verified pre-existing** by stashing all of this plan's work and re-running on the clean
  tree at `3dbd47d`, where it fails identically. Not introduced here and not fixed here — it
  belongs to the Airbus radar/storm work.
- 2026-08-20 — The model draws **three** epaulette stripes no matter how the uniform is worded:
  three for three across the identity sheet and both S7 sheets. Each needed a delta pass naming the
  stripe count as its own numbered change. Recorded in the prompt pack for future waves.
- 2026-08-20 — Counting stripes by eye at sheet scale is unreliable — I called a correct
  four-stripe result "three" and only a 3x NEAREST crop of the epaulette band settled it. An
  automated gold-blob count was worse: the belt buckle and cap cord outweigh the stripes.
- 2026-08-20 — `normalise-scramble-sprite.py` scaled **per frame**, forcing every pose's own
  bounding box to the target height. For a cycle that makes the character grow and shrink between
  frames: a crouched pose and an upright pose both become exactly 64 px tall. The existing Wave S4
  run frames measure 64/61/64/56/63/64, so a shared scale had been applied by hand and never landed
  in the tool. Added a `--ref` option that derives one scale from a reference frame and applies it
  to every frame of the cycle. Verified: the skid pose normalises to 52x64 alone but 48x59 against
  the standing tap pose, which is the correct relative size.

## Decision log

- **Logo 160x44, centred at x=80.** 50% of stage width, matching the SEGA ident proportion the
  intro is modelled on. 176 still crowds the stage; 144 reads timid. Owner choice, 2026-08-20.
- **PRODUCTIONS removed entirely.** Owner choice, 2026-08-20. Consequence: `build_productions_layer`,
  its bitmap font and constants, the `tmb2-productions.png` asset, the `logo-productions` asset id
  and every renderer branch and test that references it all come out. With the wordmark gone the
  logo centres vertically on the stage rather than sitting above a caption.
- **Gag A, the hat chase.** Chosen over the overshoot gag and the paper-plane gag because it is the
  funniest of the three and it plants the captain's-cap motif in the first six seconds, which the
  suit-up montage later opens on. Owner choice, 2026-08-20.
- **Restaged so Pop T is never bare-headed.** Owner choice, 2026-08-20, after I flagged that a
  cross-floor chase would put him hatless through most of the ident — the first look anyone gets at
  the character. The cap now stays on him or in his hands throughout: the gust drops it over his
  eyes, it slides down his arm, he flicks it back up and it lands crooked. Side benefit: the whole
  gag plays in one spot, and a big silhouette change like a blinded grope reads far better at 64 px
  than a small figure crossing the stage.
- **Sprites regenerated once, not twice.** The identity fix and the new gag poses are generated in
  a single wave, because regenerating for identity before the gag was chosen would have meant
  paying for the same sprites twice.
- **Sound effects synthesized, not sampled.** WebAudio square and noise voices rather than shipped
  audio files: no binary assets, no licensing question, deterministic, unit-testable, and it
  matches the Genesis-era hardware the ident imitates.

## Milestones

1. **Smaller logo, no wordmark.** The ident shows a 160x44 logo centred on a dark stage with no
   caption, built from the approved source, all suites green. Code and builder only.
2. **Canonical sprite wave.** Every ident sprite regenerated against the identity sheet, plus the
   new gag poses, normalised to 64 px and passing the sprite checks.
3. **The gag animates.** The hat chase plays end to end on the beat grid, silent.
4. **The gag sounds.** Synthesized effects fire on every gag beat, honouring mute, volume and
   reduced motion.
5. **Proof.** Browser stills at every ident beat, all suites green, evidence recorded here and in
   `TEST_REPORT.md`, handed to the owner gate.

## Implementation steps

### Milestone 1 — logo and wordmark

- `tools/assets/build-tmb2-ident-assets.py`: set `IDENT_SIZE = (160, 44)`; delete
  `build_productions_layer`, `BITMAP_FONT`, `PRODUCTIONS_*` constants and the call in `main`;
  update the closing print.
- Re-run the builder; it rewrites the three mask PNGs at 160x44.
- Delete `public/images/intro/tmb2/logo/tmb2-productions.png`.
- `src/game/introAssets.ts`: drop the `logo-productions` manifest entry and its preload id.
- `src/game/introRenderer.ts`: `IDENT_TARGET = { x: 80, y: 90, width: 160, height: 44 }`; remove the
  `logo-productions` union member, its push in `deriveIntroDrawCommands`, both filter lines, the
  draw branch and the full-stage branch in `drawLogoLayer`.
- `src/game/introAnimation.ts`: remove the `buildProgress > 0.72` productions layer push.
- Update `introRenderer.test.ts` and `introAssets.test.ts` to the new layer list and geometry.

### Milestone 2 — sprite wave

Beat map, on the 0.72 s grid inside the 0–6 s ident window:

| cue | beat |
| --- | --- |
| 0.000–1.700 | the logo builds, as today |
| 1.776 | Pop T sprints in from the left |
| 2.496 | he skids to a stop facing the logo; the logo's slam gusts his cap down over his eyes |
| 3.216 | blinded, arms out, groping — the cap slides off his face onto his forearm |
| 3.936 | he flicks it up off the forearm; the cap is airborne |
| 4.656 | it drops back on his head crooked; he straightens it, gold sparkle |
| 5.376 | snappy salute, then he sprints off right |

Poses required, all at the canonical identity, all with the cap on him or in contact:

| sprite | state | note |
| --- | --- | --- |
| run cycle, capped, 6 frames | regenerate | entry and exit both reuse it |
| skid, capped | regenerate | the stop |
| blinded | new | cap down over the eyes, arms out |
| forearm catch | new | cap resting on his forearm, looking at it |
| flick | new | arm snapping up, cap leaving the forearm |
| crooked straighten | new | cap askew, hand on the brim |
| salute | new | the button |
| cap prop | new | the cap alone, for the airborne moments |

Three generations: sheet A the 6-frame capped run cycle, sheet B the five gag singles plus the
skid, sheet C the cap prop. Sheets rather than singles — one image holding a whole cycle is what
held identity in Wave S4. Slice with `tools/assets/slice-scramble-sheet.py`, normalise with
`tools/assets/normalise-scramble-sprite.py`. Every prompt attaches
`refs/identity-popt-canonical.png` as the character reference.

### Milestone 3 — the gag

Rewrite `case 'tmb2-ident'` in `introAnimation.ts` on the 0.72 s grid inside 0–6 s. Beat order:
logo slam, cap off, cap tumbles, chase, dive and catch, cap on crooked, straighten, salute, flare,
exit. Add a tumbling-cap prop frame kind to the animation frame and a renderer command for it.
Evolve the ident assertions in `introAnimation.test.ts` cue by cue.

### Milestone 4 — sound

- New `src/game/introSfx.ts`: a pure `INTRO_SFX_CUES` table mapping beat time to a sound descriptor
  (voice, frequency envelope, duration, gain), plus `deriveIntroSfxAtTime` for the runtime.
- New `src/game/introSfxPlayer.ts`: a thin class owning an `AudioContext`, converting descriptors to
  oscillator and noise nodes. No game logic.
- Wire into `GameIntro.tsx` alongside the existing audio element, gated on the same mute and volume
  state, skipped entirely under reduced motion and when the ident window is not playing.
- `introSfx.test.ts`: every gag beat has a cue, cues are inside the ident window, descriptors are
  well formed, reduced motion yields none.

## Validation plan

- Unit: `npm run check`. New ident geometry assertions, evolved gag assertions, the pixel-grid
  sweep still green, the new SFX cue tests.
- Assets: `npm run assets:check` with the manifest one entry lighter and the mask layers at 160x44.
- Browser: production build, clock-driven captures at every gag beat per the deterministic method,
  compared against the beat table. 375 / 768 / 1440.
- Accessibility: reduced motion holds one logo frame, plays no gag, emits no sound. Mute and volume
  verified to silence the effects.
- Audio failure: with the media element failed into `fallback` clock mode, the gag still animates.

## Acceptance criteria

- The ident logo measures 160x44 on the stage, centred, with no PRODUCTIONS caption anywhere and no
  orphaned asset or manifest entry.
- Every gag beat fires within one 12 fps frame of its grid time and the gag completes before 6 s.
- Every Pop T sprite in the ident matches the canonical identity: blond eyebrows, four stripes,
  badged cap.
- Sound effects fire on every gag beat, are silenced by mute, scale with volume, and are absent
  under reduced motion.
- All suites green with evolved assertions; no test weakened to pass.

## Repair loop and stop conditions

Review → focused repair → validation → remaining-delta review. Stop at the owner gate for
Milestone 5, at three failed repairs of one root cause, or if a sprite pose fails identity twice in
a row, which would mean the reference is not doing its job and needs revisiting rather than
re-rolling.

## Evidence

### 2026-08-20 — Milestones 2-4: sprites, gag, sound

**Sprites (4 generations).** `s7-ident-run-sheet` and `s7-gag-poses`, each plus one delta pass, both
against `refs/identity-popt-canonical.png`. Defects caught and fixed: three epaulette stripes on
both sheets, black eyebrows on the run sheet, and a pose-5 hat that was drawn level when the beat
needs it askew. Sliced with `slice-scramble-sheet.py` (6 poses found on each), normalised at a
shared scale, deployed by `deploy-scramble-intro.py`. `popt-tap` retired with the tap gag it
belonged to. Sprite proof: `preview-renders/tmb2-intro-overhaul/ident-gag-sprites.png`.

**Run cell widened 44 -> 46.** Run frame 4 normalised to 45 px wide, one past the old cell, which
`cell_pack` would have clipped. Cell and clip pivot updated together (pivot x 22 -> 23).

**The gag.** `case 'tmb2-ident'` rewritten on the 0.72 s grid: ENTER 1.776, SKID 2.496, BLIND 3.216
(cap slides to the forearm at +0.42), FLICK 3.936, CROOKED 4.656, SALUTE 5.376 with the exit sprint
at +0.34. The slam accent moved from the old tap beat to the skid, which is where the gust now
happens. Browser proof at all eight beats:
`preview-renders/tmb2-intro-overhaul/ident-hat-gag-beats.png`.

**Sound.** `src/game/introSfx.ts` holds a pure cue table and `deriveDueIntroSfx`, which returns the
cues falling in an interval and refuses backwards jumps, stalls over 0.5 s and non-finite input, so
a dropped frame never dumps a pile of overdue sounds. `src/game/introSfxPlayer.ts` owns the
AudioContext and renders square, triangle and band-passed noise voices; it fails silent if WebAudio
is unavailable. Wired into `GameIntro.tsx` on the same clock the animation uses, honouring the
existing mute and volume state, torn down on unmount, and never constructed under reduced motion.

**In-browser sound proof**, instrumenting AudioContext and stepping the intro clock across 0–6 s:
all seven cues fired at their beats (1.84, 2.56, 3.28, 3.68, 4.00, 4.72, 5.44 probe steps — each
the first step past its cue), one AudioContext created, voices **square x5, triangle x3, noise x8**,
matching the cue table. Under `reducedMotion: 'reduce'`: **0 contexts, 0 oscillators, 0 noise
sources**. One repair to the probe itself: it first reported every oscillator as `sine` because it
sampled `node.type` at creation, before the player assigns it — re-read at `start()`.

**Checks.** `npm run check` — 33 files, **415/415 passed**. `npm run assets:check` — passed,
52 assets, 48 preloads.

**E2E.** Full suite: 56 passed, 1 skipped, **2 failed**.
- `e2e/smoke.spec.ts:248` failed on three stale wordmark expectations and was updated: it required
  `tmb2-productions.png` to be preloaded, measured the logo in the retired 288x79 rect, and required
  the wordmark band to be non-empty. Now it asserts the new 160x44 geometry, asserts the wordmark is
  never requested, and — a strengthening, not a relaxation — proves on the rendered canvas that the
  wordmark band and both side margins are pure background. That emptiness check had to move to
  t=1.5 s: at 4.8 s Pop T is standing in the band, so measuring there attributes his legs to the
  wordmark. Full spec re-run: **27 passed, 1 skipped**.
- `e2e/airbus-workload.spec.ts:242` is pre-existing, proven by stash-and-rerun on the clean tree.
  Untouched.

**Responsive.** 375 / 768 / 1440 captured, horizontal overflow **0 px at all three**. At 768 and
1440 the gag reads clearly; at 375 the controls panel covers it — see Discoveries.

### 2026-08-20 — Milestone 1: smaller logo, no wordmark

- `tools/assets/build-tmb2-ident-assets.py` rebuilt the three mask layers at 160x44 from the
  approved source; SHA-256 guard passed unchanged. `build_productions_layer`, `BITMAP_FONT` and the
  `PRODUCTIONS_*` constants deleted; `ImageDraw` import dropped with them.
- `public/images/intro/tmb2/logo/tmb2-productions.png` deleted. `logo-productions` removed from
  `introAssets.ts`, `introRenderer.ts` (union member, command push, two filters, draw branch,
  full-stage branch in `drawLogoLayer`), `introAnimation.ts`, the manifest builder and the asset
  contract's `TMB2_IDENT_LAYERS`.
- `node tools/assets/build-intro-manifest.mjs` — 48 hash-bound assets, 44 preloads (was 45).
- `IDENT_TARGET` exported and set to `{ x: 80, y: 78, width: 160, height: 44 }`.
- Tests updated, and two added rather than merely relaxed: a sweep asserting no `logo-productions`
  layer is commanded at any point across 0–6 s, and a geometry assertion pinning the logo to half
  the stage width, centred. The contract test now checks all three mask layers measure 160x44 and
  that the manifest contains no `productions` string.
- `npm run check` — **32 files, 407/407 passed**. `npm run assets:check` — passed, 48 assets,
  44 preloads.
- Browser proof at 1440x900 on the production build, clock-driven at four ident times:
  `preview-renders/tmb2-intro-overhaul/ident-160-browser-proof.png` (captured at y=90) and
  `ident-160-tap-y78.png` (final y=78).
- **Repair during the milestone:** at y=90 the logo sat vertically centred and the sprite collided
  with it at the tap beat — the gag had no floor left. Moved to y=78, matching the approved mock,
  which restores clearance beneath the logo for the chase staging. Caught in the browser, not in
  source; the draw-order test passes either way because it asserts layer order, not spatial
  overlap.

### 2026-08-20 — Wave S8: the watch card (outside this plan's scope, owner-directed)

- `card-watch` regenerated against `refs/identity-popt-canonical.png` plus the previous card as a
  scene-only reference: the face now matches the canonical Pop T (blond hair with temple spikes,
  deep-gold eyebrows, rounded boyish face, button nose, navy eyes, peach skin) and the watch is a
  gold Rolex GMT-Master with a black dial and the split red-and-blue bezel, described by shape and
  colour because the pack bans brand marks and lettering.
- Four epaulette stripes correct on the first generation — the first time in this arc — after the
  stripe count was given its own line rather than being folded into the uniform description.
- One delta pass, for the model embossing the letter "M" on the hat's gold cord slide against the
  standing no-text rule.
- Normalised by direct BOX resize to 320x224, the method inferred by comparing candidate pipelines
  against the existing normalised card (mean abs diff 0.64 direct vs 0.77 crop-then-resize).
- `npm run check` 415/415, `npm run assets:check` passed at 52 assets / 48 preloads, browser proof
  at the 24.552 watchCheck cue: `preview-renders/tmb2-intro-overhaul/watch-card-gold-rolex.png`.
  Intro e2e re-run after the swap: 4 passed.

## Outcome and handoff

Open. Gag and sizing chosen by the owner 2026-08-20; no push before the owner gate.
