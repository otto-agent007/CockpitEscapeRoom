# Intro ending: the empty right seat and the title card

## Purpose

The intro currently ends by flying a DC-9 sprite past the camera and stamping a winged-globe emblem
over the stars. Both are dead weight: the aircraft is unreadable at the sizes it plays, and the
emblem appears nowhere else in the game. After this work the intro ends where the player is about
to be — the departure happens off camera as landing lights sweep the tarmac and lift away, we cut
inside to the DC-9's empty right seat with its harness hanging loose and its panel glowing, and the
instrument light resolves into the game's own title, "The Captain's Key". The last frame of the
intro becomes the seat the player takes the moment they press start.

## Current state

- `introConfig.ts` scene `takeoff` (42.84–49.704) rolls a pre-rendered DC-9 down a runway plate
  through three receding sizes, then swaps to three liftoff sizes for an overhead pass with a
  contrail. Scene `title` (49.704–51) stamps `emblem-finale` over `plate-night-sky`, and
  `loop-reset` (51–53.04) holds it while the picture collapses into blue pixels.
- `JET_CLIPS` in `introAnimation.ts` declares seven jet sprites: `dc9-runway`, `-36`, `-26` and
  `dc9-liftoff-48`, `-80`, `-160`, `-320`, drawn through `jetActor` and the renderer's `sprite`
  command.
- `INTRO_MUSIC_CUES` names `jetPass` 47.496 and `emblemStamp` 49.704.
- **Measured 2026-08-20:** the liftoff sprite is unreadable at the sizes it plays. A regenerated,
  model-correct version was produced and compared against the old one at runtime sizes
  (`preview-renders/tmb2-intro-overhaul/dc9-liftoff-old-vs-new.png`): at 160 px the new one is
  clearly better, but at 80 px and 48 px **both are mush**. A pale grey-and-white airliner cannot
  survive being drawn 48 px wide against a night sky. The limit is the concept, not the art.
- The same wave produced a dead-astern runway silhouette that reads well precisely because it is
  contrast-driven — a near-black shape with one dominant red fin — which is the evidence behind
  this plan's rule below.

## Scope

Included: replacing the takeoff act with an off-camera departure, a new empty-right-seat plate, the
title card that replaces the emblem, retirement of the emblem and all seven jet sprites, the cue
renames, and all affected tests and asset checks.

Excluded: the ident and its hat gag (plan 0034, complete); the case-scene cut, the photo cut and
the launch-sequence reorder, which remain separate open items; the DC-9 chapter's own
`CaptainsKeyReveal`, which this only echoes and does not touch.

## Context and constraints

- **The rule this plan is built on:** never render a small, pale, detailed aircraft. Anything drawn
  below roughly 100 px must be contrast-driven — a silhouette or a light — not detail-driven.
- **Text is lettered at runtime, never generated.** The pack forbids text in generated art, and the
  renderer already letters the case nameplate. The title card uses the same route, reading from
  `gameCopy.title` so the intro and the opening screen can never disagree.
- **Spoiler safety.** The title is already the `<h1>` on the opening screen before the intro plays,
  so showing it costs nothing. The intro must still contain no `<h1>` of its own — an existing e2e
  assertion — and must not reveal the locker, the Airbus, the Model Y or Mars.
- **Tone contract.** A quiet, expectant, unoccupied flight deck. Nothing may read as abandonment,
  emergency or an aircraft in trouble.
- **Pixel grid.** The plate is a full-frame 320x224 background like every other plate. The title is
  drawn with the existing runtime lettering at whole-pixel positions.
- **Accessibility.** Reduced motion holds a single curated frame per act and keeps the title
  readable; the pixel collapse stays within the existing envelope.

## Progress

- [x] 2026-08-20 — Owner chose option C with option A's ending, and directed the emblem's removal.
- [x] 2026-08-20 — Milestone 1 complete: plate generated first time, on style.
- [x] 2026-08-20 — Milestone 2 complete: all four ending beats animate and are proven in-browser.
- [x] 2026-08-20 — Milestone 3 complete: emblem and all seven jet sprites gone, 416/416 green.
- [~] 2026-08-20 — Milestone 4: browser and e2e proof done; owner gate outstanding.

## Discoveries

- 2026-08-20 — The game's title is `gameCopy.title` = "The Captain's Key" (`src/game/config.ts:292`),
  already rendered as the opening screen's `<h1>` and paid off by `CaptainsKeyReveal` at the end of
  the DC-9 chapter. It is a real recurring object, unlike the emblem, and costs no art.
- 2026-08-20 — `introAssets.test.ts` asserts every sprite-role asset is actually rendered, so the
  retired jet sprites cannot simply be left in the manifest; they must come out of the manifest,
  the clips and the files together.
- 2026-08-20 — `public/images/dc9-game-ready-first-officer.png` is the game's own first-officer
  station render and is the right authority for the plate, so the intro's last frame and the seat
  the player actually takes agree on panel colour, gauge layout, yoke and throttle quadrant.

## Decision log

- **The departure goes off camera.** Owner choice, 2026-08-20, from four options. It removes the
  unreadable-aircraft failure mode at the root rather than working around it, and it costs one
  plate instead of seven sprites.
- **The emblem is retired.** Owner: it has no value and appears nowhere else in the game. The
  49.704 hit — the second largest in the track — is inherited by the title card.
- **The title card replaces it, lettered at runtime from `gameCopy.title`.** Zero new art, and it
  cannot drift from the opening screen because both read the same constant.
- **All seven jet sprites are retired with the act that used them.** The regenerated pair from the
  attempted fix are kept in `art-source/.../generated/` as evidence for why the concept was changed,
  but are not deployed.

## Milestones

1. **The plate.** An empty DC-9 right seat at night, harness hanging, panel glowing, on style with
   the other cockpit cards and recognisably the game's own station.
2. **The ending animates.** 45.12 landing lights blaze across the tarmac, 46.008 they lift away,
   47.496 hard cut inside to the seat, 49.704 the glow resolves into the title, hold, collapse.
3. **Retirement.** No emblem, no jet sprites, no orphan manifest entries, all suites green.
4. **Proof.** Browser stills at every ending beat, reduced motion, 375/768/1440, evidence here and
   in `TEST_REPORT.md`.

## Implementation steps

- `introMusicCues.ts`: rename `jetPass` -> `intoTheSeat` (47.496) and `emblemStamp` -> `titleCard`
  (49.704). Values are measured and stay locked; only the names move.
- `introConfig.ts`: rename scene `takeoff` -> `departure` and shorten it to 42.84–47.496; add scene
  `right-seat` 47.496–49.704; `title` 49.704–51 and `loop-reset` keep their windows.
- `introAnimation.ts`: delete `JET_CLIPS`, `JetClipId`, `jetActor` and the `jet` frame field;
  rewrite the departure case as a ground shot with a code-drawn landing-light wash that grows to
  `rotate` then lifts and fades; add the `right-seat` case; rewrite `title` and `loop-reset` around
  the new plate and a `title` frame field.
- `introRenderer.ts`: drop the jet sprite path; add a `title` draw command reusing the runtime
  lettering approach already used for the nameplate.
- `introAssets.ts`: remove `emblem-finale` and the seven jet sprites; add `plate-right-seat`.
- `tools/assets/deploy-scramble-intro.py` and `build-intro-manifest.mjs`: same removals plus the new
  plate; delete the retired PNGs from `public/`.
- Tests: evolve the ending assertions cue by cue; add one asserting the intro's title text equals
  `gameCopy.title` so the two can never diverge.

## Validation plan

- Unit: `npm run check`. Cue-alignment per beat, the pixel-grid sweep stays green, the title-matches-
  config assertion, and an assertion that no retired asset id survives anywhere.
- Assets: `npm run assets:check` with seven sprites and the emblem gone and one plate added.
- Browser: production build, clock-driven captures at 45.12, 46.008, 47.496, 49.704, 51 and 52.5.
- Accessibility: reduced motion holds a readable frame and the title stays legible.
- Responsive: 375 / 768 / 1440, and the existing controls-never-cover assertion still passes.

## Acceptance criteria

- No emblem and no jet sprite is referenced, shipped or requested anywhere in the intro.
- Every ending beat fires within one 12 fps frame of its measured cue.
- The title rendered in the intro is exactly `gameCopy.title`, asserted by test.
- The last frame before the loop collapse is the empty right seat with the title over it.
- All suites green with evolved assertions; no test weakened to pass.

## Repair loop and stop conditions

Review → focused repair → validation → remaining-delta review. Stop at the owner gate for
Milestone 4, at three failed repairs of one root cause, or if the plate fails style twice, which
would mean the references are wrong rather than the prompt.

## Evidence

### 2026-08-20 — the ending, end to end

- **Plate.** `s10-plate-right-seat` generated first time against two references with separate jobs:
  the game's own `public/images/dc9-game-ready-first-officer.png` for what is in the cockpit, and
  `cards/instruments.png` for how it is drawn. Came back at 1672x941, a 1.78 aspect against the
  stage's 1.43, so it is centre-**cropped** rather than squashed — a direct resize would have
  distorted it by 24%.
- **Runtime.** `JET_CLIPS`, `jetActor`, `JetClipId`, the `jet` frame field and `strobeOn` are all
  gone with the act that used them, along with `IntroCardFrame` and `emblemCardScale`. Cues renamed
  to what they now host: `jetPass` -> `intoTheSeat`, `emblemStamp` -> `titleCard`, values unchanged
  and still test-locked. Scene `takeoff` split into `departure` (42.84–47.496) and `right-seat`
  (47.496–49.704).
- **The title is lettered at runtime from `gameCopy.title`**, using the same route as the case
  nameplate, with the blue/red offset copies that mirror the PRESS START prompt's shadow. A test
  asserts the intro's title equals the config value, so it cannot drift from the opening screen.
  The Start handoff, which used to zoom the emblem, now zooms the title.
- **The landing-lights beat took four attempts, and the first three were the wrong approach.**
  Reusing `beacon-sweep` plus `radial-rays` produced full-frame searchlight shafts; `radial-rays`
  alone read as a sunburst; bare `sparkle` pairs were far too small to carry the beat. The root
  cause was that no existing fx primitive expresses "a light approaching", so the fourth attempt
  added one: a `landing-lights` fx drawing two hot cores with a flat three-step cone of spill
  opening toward the camera. Flat wedges, no gradients, so it stays inside the cel-shaded language.
- **Checks.** `npm run check` — 33 files, **416/416 passed**. `npm run assets:check` — passed at
  **44 assets, 40 preloads**, down from 52/48. Full `e2e/smoke.spec.ts`: **29 passed, 1 skipped**.
- Two e2e repairs: the scene-boundary test still named `takeoff` and its retired summaries, and the
  phone-layout test's 20 s preload timeout was raised to 60 s to match the other intro tests.
- Browser proof at all six ending beats:
  `preview-renders/tmb2-intro-overhaul/intro-ending-right-seat.png`.

### 2026-08-20 — the attract loop removed and the walk-out filled in

- **No attract loop.** The intro plays once and holds its final frame — the title over the empty
  right seat — until the player starts. It used to restart from the TMB2 ident, which read as a
  mistake once the ending became a title screen. `sampleIntroRuntime` now pins at
  `INTRO_DURATION_SECONDS` and reports `didLoop: false`; `normalizeIntroTime` clamps instead of
  wrapping, because a modulo at 53.04 snapped the held frame back to the ident; the `loop-reset`
  scene and its pixel collapse retire, and `title` runs 49.704 to the end. `resetIntroRuntimeLoop`
  survives for the audio-failure retry path, which does still rewind.
- Verified the loop was deliberate and correctly timed before changing it: the mp3 measures
  **53.040 s** against `INTRO_DURATION_SECONDS` 53.04, so nothing was being cut short.
- **Six new beats, measured before they were chosen.** A sweep over the derived animation found
  **27.6 s of 53.04 (52%) sitting on six single-image holds**, the worst being **9.96 s on the
  doorway**, against a montage that cuts every 1.2-2.2 s. The walk-out is now six cuts on the
  grid — door release 21.528, headset 22.968, doors parting 24.552, chocks 25.992, wands 27.432,
  shadow 28.872 — and an overhead-panel beat at 39.96 splits the 2.87 s instrument hold. A test now
  fails if any shot in the body of the intro holds longer than 4.7 s.
- All six cards generated first time and on style. Two came back at the wrong aspect and were
  cropped rather than squashed; `card-shadow` returned **portrait 1024x1536** and its top crop —
  the figure in the lit doorway with a long shadow reaching the camera — is the strongest frame in
  the intro.
- **Measured the ident gag rather than guessing:** it plays **6 distinct poses over 3.22 s, 1.9
  poses per second**, and the run cycle is **6 frames at 80 ms = 12.5 fps**. The owner is right that
  both need more frames, and the run is genuinely 12.5 fps rather than an artifact of a 12 fps
  video capture. Not yet fixed — see handoff.
- `npm run check` 416/416 across 33 files; `npm run assets:check` passed at 47 assets / 43 preloads.

### 2026-08-20 — the gates on the vocal, and the reading pile

- The release-lever insert retired: the hangar doors themselves now part ON the 18 s "standing
  there alone" downbeat and keep grinding open through the whole vocal (owner direction). The cue
  is `doorsParting: 18`; `doorRelease` is gone, and the walk-out cue spacing widened
  (fourStripes 23.4, watchCheck 25.7, logbookSnap 28, shadesDown 31.4).
- The logbook beat is a two-state story: `card-logbook-books` (the Isaacson Musk biography and two
  road-worn Reacher paperbacks lying on the logbook, the hand mid-sweep) cutting to the cleared
  `card-logbook` at +1.4 s. A new runtime `label` frame kind letters the covers — ELON MUSK,
  REACHER, LEE CHILD, then FLIGHT LOG on the cleared book — because the pack forbids generated
  text. Label positions were measured off 5 px grids of the deployed cards after eyeballing missed
  by 6-10 px, and verified in browser captures.
- A silent-edit hazard recurred and was caught by tsc: a python slice from `case 'doors'` to
  `case 'standing-alone'` ate the `walk-out` case between them. Reconstructed; the lesson is the
  same as the git-checkout one — targeted edits, not span deletions, in files this session owns.
- `npm run check` 418/418; asset contract 63 assets / 43 preloads (door-release out,
  logbook-books in).

### 2026-08-20 — the logbook beat animates

- Wave S15: `card-logbook-sweep` and `card-logbook-lift`, both first-generation next-frame deltas.
  `LOGBOOK_STAGES` drives four stages over the 3.4 s beat (0 / 0.9 / 1.6 / 2.4 offsets), the lift
  lands with its own accent punch, and the FLIGHT LOG lettering rides the lifted cover at a
  position measured off the deployed card. Labels are deliberately absent on the sweep frame —
  the covers are mid-slide and fixed lettering would detach from them.
- Suites 418/418; asset contract 65 assets / 45 preloads.

### 2026-08-20 — fast opening and the inside departure

- Owner reorder: stripes and watch moved ahead of the gates to speed the opening (opening beats now
  ~1.39 s; stripes take the 13.056 hit), headset added after the logbook, gates still on 18.0.
- The runway lineup act was cut as "kinda lame". Consequence surfaced rather than absorbed: it
  owned the 45.12 (+9.1 dB) and 46.008 (+20.1 dB) accents, so the departure moved inside the
  cockpit — overhead, nacelle spool (owner: nacelles before the levers), throttles settle, throttles
  up on 45.12, panel surge and rumble on 46.008. The intro now contains no exterior aircraft shot
  after the hangar reveal, which suits an ending that lands in the seat.
- Dead code removed with the act: `plate-runway-lineup`, the `runway-lights` fx and the
  purpose-built `landing-lights` fx, plus their renderer cases and the orphaned horizon constant.
- CAPT. POP T restored on the logbook (both settled and lifted states), recovering the
  personalisation lost with the flight-case card.
- Suites 417/417; asset contract 63 assets / 49 preloads; 16-checkpoint forensic verification of
  the delivered render.

## Outcome and handoff

Open. Design chosen by the owner 2026-08-20; no push before the owner gate.

**Next, not yet done:** the ident gag needs more frames. Measured at 1.9 poses/sec for the hat flip
and 12.5 fps for the run. The plan is two more sheets — six in-between run frames to interleave into
a 12-frame cycle at 25 fps, and six in-between gag poses — plus drawing the airborne cap as a
runtime prop on an interpolated arc so the flick-to-crooked segment (1.44 s of the gag) moves at
the display rate instead of cutting between two held poses.
