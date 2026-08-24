# Test report


## 2026-08-23 Engine-Out guidance + default-on ambience (branch pr/airbus-storm-usability, round 2)

- **Owner feedback after playing round 1:** Storm Line approved; Engine-Out needs the same
  treatment; "neither have sound playing."
- **Engine-Out guidance:** `deriveEngineOutRouteGuidance` joins the shared guidance module (types
  generalized to `AirbusRouteGuidance`, meter end-labels data-driven): a directional-drift meter
  through recognition/stabilization whose green band IS the enforced ±0.45 envelope, then a bank
  meter during diversion whose green band IS the 8–24° arc that accrues SAFE RETURN, with drift
  warnings prioritized mid-turn. Briefing/captions/coaching now name directions ("the nose will
  drift LEFT — hold Balance right", "SAFE RETURN is to the right").
- **Sound root cause was double:** the ambience was opt-in (default off — the audio graph was only
  ever created by clicking the toggle) AND near-inaudible when on (72 Hz sine + lowpassed noise at
  master gain 0.018–0.053 — nothing laptop speakers reproduce). Now default ON, graph auto-created
  when a scenario activates (pointer/key resume listeners cover autoplay policy), plus a sawtooth
  hum whose harmonics ride the intensity-modulated lowpass, at master gain 0.055 + intensity×0.1.
  Toggle and the WebAudio-unavailable fallback (button stays "Sound off", flight unaffected) kept.
- **Audibility is measured, not assumed** (per the synthesized-audio-envelopes memory): a new e2e
  taps every destination connection with an `AnalyserNode` and requires waveform peak > 0.04 —
  a threshold both silent variants fail (no graph: 0; the old whisper: ≈0.02) — then requires the
  toggle to decay it below 0.005. The old WebAudio-unavailable check installed its throwing stub
  after the graph already existed; it now installs before load and actually exercises the fallback.
- **Pre-existing blocker found by measuring, in BOTH scenarios:** between ~620 and ~900 px the
  control deck laid its groups in one non-wrapping row and overflowed its own box. Engine-Out by
  492 px — the Directional-balance buttons sat at x 988–1109, entirely outside a 768 px viewport,
  in flight, for the exact control the exercise teaches — and Storm Line by 155 px, running the
  thrust controls off the right edge. The responsive e2e only ever entered flight at 375 px, which
  is how both shipped. `.storm-control-deck` now wraps for both (Balance right measured back at
  x 402–607; deck overflow 0 at 375/768/1440, no off-screen hold controls).
  - A first attempt scoped the wrap to Engine-Out only; measurement showed that left Storm Line's
    155 px overflow in place, so both wrap.
  - Wrapping makes each deck taller. Guidance shelves were re-measured against real deck tops, not
    guessed: storm 621–900 px `bottom` 6.2rem → 7.8rem (deck top y=785 in a 900 px viewport),
    engine-out 10.8rem (deck top y=737) and 9.3rem at ≤620 px (deck top y=673).
  - Regression guard: the responsive e2e now asserts, at every width, deck `scrollWidth` ≤
    `clientWidth` and every `.storm-hold-control` inside the viewport.
- `npm run check` — pass: ESLint, tsc, **442/442 across 34 files** (9 new Engine-Out guidance
  tests), build.
- e2e: storm-line + engine-out first run 11/14 — the three failures were two assertions staled by
  intended copy/default changes (old briefing text; old Sound labels in the gamepad case) and the
  production case's tightest waiting budget (5 s ≈ 4 SwiftShader frames for the keyup→dataset
  recenter, now sharing the machine with the audio thread) — raised to the sibling polls' 15 s,
  threshold unchanged. After repair: **all three pass** (production case 12.5 min under load),
  cumulative storm-line + engine-out green, including the new audibility, fallback, and tablet
  deck cases. Workload responsive and smoke Airbus regression runs recorded in plans/0039.
- Layout verified by DOM measurement at 768×900 and 375×812 (probe script): all hold controls
  in-viewport, guidance box clear of deck, tools, and task panel at both widths; engine-out
  guidance shelf raised to measured deck tops (10.8rem / 9.3rem). Fresh screenshots
  `04-engine-stabilization-balance-*` / `05-engine-diversion-bank-*` inspected in
  `preview-renders/airbus-storm-usability/`.

## 2026-08-23 Airbus Storm Line usability (branch pr/airbus-storm-usability)

- **Scope:** qualification instruction box announcing the drag/drop start; Storm Line briefing
  rewritten around "the west gap is off your left wing"; a live Route guidance line + drift meter
  driven by new pure rules in `src/game/airbusRouteGuidance.ts`; sector buttons relabeled
  "West (left) / Center (ahead) / East (right)"; stronger gap hint names the left third of the ND;
  a soft gap-lane glow on the storm ND; Weather-Entry gate eased from −0.35 to −0.25 via the new
  exported `STORM_ENTRY_GATE_LATERAL` (owner-requested difficulty ease; the drift-meter green band
  is drawn from the same constants the flight model enforces).
- `npm run check` — pass: ESLint, tsc, **433/433 Vitest across 34 files** (10 new
  `airbusRouteGuidance` tests; new entry-gate boundary tests on both sides of the threshold),
  production build.
- `npx playwright test e2e/airbus-workload.spec.ts e2e/airbus-storm-line.spec.ts` — first run
  **9/10**: the one failure was the new guidance-box geometry assertion at 375 px, where the box
  (fixed `top: 13rem`) overlapped the wrapped captain-task panel and instrument mirror. Repaired by
  pinning the guidance above the flight-control deck at ≤900 px instead of using fixed tops; two
  further capture-inspection passes moved its right edge clear of the floating "?"/fullscreen scene
  tools (right: 6rem at ≤620 px, 7rem at 621–900 px — the tools sit ~5.8rem inboard). After repair:
  workload **4/4** (including the 5.1 min production-GLB ND/ECAM mesh-click case) and the
  responsive/no-WebGL geometry case green at 375/768/1440.
- `npx playwright test e2e/smoke.spec.ts -g "Airbus"` — **3/3**, including the production A320 GLB
  load and the card-placement case that now asserts the instruction-box copy.
- Screenshots inspected (not just captured) in `preview-renders/airbus-storm-usability/`:
  `01-qualification-instruction-{1440,768,375}.png`, `02-storm-entry-guidance-*.png`,
  `03-storm-core-corridor-*.png` (via the env-gated `e2e/airbus-usability-captures.spec.ts`), plus
  production 1440 evidence `storm-entry-range-40-1440.png`, `storm-core-west-gap-1440.png` (WEST
  boxed green on the live ND with the gap-lane glow, Route line reading "In the corridor"),
  `engine-recognition-acknowledged-1440.png`, `engine-diversion-right-safe-return-1440.png`, and
  `native-storm-core-{375,768,1440}.png`.
- Reduced motion (responsive case runs under `reducedMotion: reduce`), reload persistence, wrong
  answer → hint escalation, checkpoint-failure coaching, and keyboard flight are covered by the
  passing suites above. Engine-Out regression run recorded in plans/0039.

## 2026-08-21 Fringe fix swept across every Pop T sprite

- The coverage fix that sharpened the walk was applied to the rest of the set. Pale edge across all
  deployed sprites: **14.9% → 11.5%** of silhouette edge. Per sprite, before → after: skid
  16.5→10.0, blinded 17.6→12.4, forearm 9.4→7.4, flick 16.7→11.4, crooked 17.8→12.0, salute
  18.9→13.8, tip 13.8→9.3, cover 22.1→16.5, fall 15.9→10.1, swing 19.0→15.0, landed 18.2→12.1,
  run sheet 13.3→8.6.
- **Safe because `--coverage` drops pixels after the resample**, so no output canvas size can change:
  verified after the rebuild that no sprite changed size, no lowest-opaque row moved (pivots stay
  valid), and the two sprites that are two pieces — `popt-fall` and `popt-flick`, where the cap is
  off his head — were already two pieces before. Area fell 3–5% per sprite, which is the fringe.
- **Which source made which sprite had to be recovered by reproduction.** Aspect arithmetic left
  seven ambiguous; rebuilding every candidate slice and diffing against the shipped file identified
  **25 of 27 with mean absolute difference 0.00**. Five needed a forced output size — they were
  scaled off a shared reference whose rounding an aspect-preserving resize cannot reproduce — which
  is why `--target WxH` was added. The mapping now lives in
  `art-source/intro/tmb2/scramble/sprite-sources.json`, driven by
  `tools/assets/rebuild-popt-sprites.py`.
- **Two deliberate exclusions.** `spr-popt-cap` and `spr-popt-gag-lookup` have no reproducible
  source (hand-derived from other sprites) and were left untouched; the cap measures 0% pale edge
  anyway. `spr-popt-backlit` keeps the old threshold by per-sprite override and is byte-identical to
  what shipped: its bright rim is authored backlight for the doorway, and at 128 it halves and breaks
  into gaps.
- `npm run check`: ESLint, tsc, **418/418 across 33 files**, build — pass. `npm run assets:check`:
  56 assets / 49 preloads. Full `npx playwright test`: **60 passed, 1 skipped, 1 failed** — the same
  pre-existing `airbus-workload.spec.ts:242` width assertion, unchanged by this work.
    **Corrected 2026-08-21 — this attribution was wrong.** `airbus-workload.spec.ts:242` is not pre-existing. Bisect: passes at `0719d8e`, fails at `3dbd47d`, so it was introduced by the Airbus radar/storm commit — the Restart button turned the topbar into a five-button grid at 621-900 px (143 px tall to 184 px) and the absolutely-positioned task panel, progress bar and instrument mirror, pinned at a hardcoded 9.1rem, went underneath it. The stash-and-rerun that "proved" it pre-existing stashed only the intro work, so the tree it re-ran on still contained the cause. Fixed in PR #58 by moving the band clear.
- Fresh verified render with the swept sprites:
  `preview-renders/tmb2-intro-overhaul/intro-sharp-sprites-2026-08-21.mp4` — 1591 frames each
  asserting its own clock and audio state, then 20 checkpoints re-extracted from the delivered file
  and diffed against those frames (0 mismatches, worst MAD 2.43).

## 2026-08-21 Fresh verified render of the intro

- The candidate at the owner gate predated the walk work, so a new one was captured:
  `preview-renders/tmb2-intro-overhaul/intro-walk-12frame-2026-08-21.mp4` (1280x896, 30 fps, h264 +
  AAC, 53.033 s, 12.1 MB).
- Captured with a rebuilt puppet harness, now kept in the repo as `tools/intro/render-verified.mjs`
  so it cannot be lost again: `currentTime` is a plain variable and `play()` resolves, so the MP3
  decoder can never drop the runtime into wall-clock fallback and make the render lie about the
  edit. **Every one of the 1591 frames asserts** that the canvas reports the exact time requested
  and that `data-audio-failed` is still `false`; the browser session is recycled every 400 frames;
  each scene is pre-warmed so no plate arrives late and records a black stage. 1591 frames in 227 s.
- Scene progression sampled during capture matched the edit: ident at 0 and 5 s, ritual at 10,
  suit-up at 15, doors at 20, walk-out at 25 and 30, walk at 35, inserts at 40 and 45, title at 50.
- **The delivered file was verified, not just the capture**: 20 checkpoints spanning all twelve
  scenes were extracted from the mp4 and diffed against the captured frame of the same index. Worst
  mean absolute difference **2.44** (h264 quantisation), zero mismatches.

## 2026-08-21 The pale fringe outside the arms, and the quiet shot back on the grid

- Owner note on the walk proof sheet: white pixels outside the arms, not sharp. Diagnosed as a
  **normaliser bug affecting every Scramble sprite since Wave S4**, not the new tweens:
  `normalise-scramble-sprite.py` BOX-averages the downsample and kept any output pixel reaching
  alpha 60 of 255, so a cell only **24% inside the figure** became fully solid — a sliver of white
  sleeve turned into a solid white pixel outside the silhouette. Threshold raised to 128 (at least
  half the cell inside) via a new `--coverage` option, default unchanged for every other asset.
- Measured on the twelve-cell walk sheet: pale edge pixels **20.6% → 12.8%** of the silhouette
  edge, opaque pixels 7359 → 6886, every cell still a single connected component, every figure
  still 48 px tall with feet on the pivot row. Browser before/after captured at 1440x900.
- A modal-vote downsample was built, measured (one-off pixels 58% → 29%) and **rejected**: it
  stamps hard black notches where a cell straddles a shadow line, and at display scale the
  character reads damaged. Removed from the tool rather than left as an unused flag. The suspected
  "blue speckle" in the trousers was measured and dismissed — ±1 compression noise in the source.
- Rediscovering the walk's real source was necessary first: the deployed frames come from slicing
  `s4-walk-sheet.png` (253x552 per figure → exactly 22x48), not from the 1254x1254 single-figure
  generations, which normalise to 24x48. Re-normalising from the wrong source silently rescaled the
  character; the slices are now committed so the chain is reproducible.
- Still carrying the same fringe, not swept here: the gag poses at 15–22% pale edge and the run
  sheet at 13.3%.
- Owner call on the quiet shot: the `standing-alone` push-in is retired and the shot holds dead
  still, guarded by a test that walks all 144 frames of the scene and requires the identity camera.
  Pixel exactness across the intro rises from **88.0% to 91.0%** of frames; the remaining 4.75 s of
  fractional zoom is all accent punch envelopes, which plan 0030 kept by design.
- `npm run check`: ESLint, tsc, **418/418 Vitest across 33 files**, production build — all pass.
  `npm run assets:check`: 56 assets / 49 preloads. Walk guard re-run in the browser: passed.

## 2026-08-21 Walk cycle doubled to twelve drawings, and the cut acts' runtime retired

- A motion census over the whole 53.04 s timeline (per-scene content-change rate, longest hold, and
  per-scene sprite frame rate, with camera accents excluded so punches and shake did not report
  every scene as busy) found exactly one under-sampled animation: the walk, six drawings over a
  780 ms stride — **7.7 a second**, against the ident run's 25 after the owner asked for more frames
  there. Nothing was wrong with the art: the six poses differ by 8.1–13.5% of their silhouettes, all
  normalise to 48 px on one shared scale, and the head centroid varies 0.23 px across the cycle.
- Wave S16 generated six in-betweens. The first attempt — all six on one sheet, the shape that
  worked for the S13 run tweens — was **rejected on measurement**: three of the six strode wider
  than any approved frame (boot spans 206, 186, 208 px against the cycle's 112–171), the figures
  came back 7% shorter, and the prompt's inherited "four gold stripes" and "round badge" rules put a
  cap badge and shoulder stripes into a shot filmed from behind, where the approved art shows
  neither. Regenerated as six per-pose deltas against two-frame references built from the approved
  sheet; ten generations in total, gated on stride-within-bracket and head-size measured **in
  deployed pixels**. All six accepted frames land within 1.7 px of target at 48 px tall.
- The deployed sheet is twelve 26x50 cells: every figure 48 px tall with its feet on the pivot row,
  widths 20–22 px, frame-to-frame silhouette change 7.9–16.1%. The clip plays 12 frames at 65 ms —
  the **same 780 ms stride**, so his walking speed is unchanged; a test now pins the frame count,
  the stride total and the equal frame lengths.
- Retired with the acts that were cut in 0035: the `contrail`, `exhaust` and `nav-strobe` fx kinds
  with their layer entries and draw cases; `pixelCollapse`, its draw command and `drawPixelCollapse`;
  `EMBLEM_REVEAL_STYLE`; the stale winged-globe and DC-9-sprite comments; the vestigial
  `data-jet-frame` read in an e2e assertion; and seven retired jet sprites that were still deployed
  into `public/` and hash-bound in the manifest. A new sweep test asserts the intro's fx vocabulary
  is exactly `beacon`, `beacon-sweep`, `radial-rays`, `sparkle` — it fails if a retired kind returns
  **or** if a live one disappears. The pixel-collapse assertion was deleted with the machinery
  rather than left as a check that cannot fail; the property it guarded (the intro holds its title)
  is still asserted directly.
- `npm run check`: ESLint clean, `tsc -b` clean, **417/417 Vitest across 33 files**, production
  build OK. `npm run assets:check`: **56 assets / 49 preloads** (was 63/49).
- Browser: new guard `e2e/smoke.spec.ts` "TMB2 cinematic plays the walk at twelve drawings a stride"
  samples one whole stride every 32.5 ms and requires all twelve drawings — it sees six and fails on
  the old sheet. Proof capture at 1440x900 on the production build:
  `preview-renders/tmb2-intro-overhaul/walk-12frame-proof.png`, twelve consecutive 65 ms samples
  each asserting its own `data-time`, `data-scene` and `data-audio-failed=false`
  (`walk-frames/manifest.txt`). The first capture attempt recorded a black stage at 31.620 s — the
  walk plate had not finished decoding — so the harness now proves the plate is on screen before it
  records anything.
- Full `npx playwright test`: **60 passed, 1 skipped, 1 failed**. The failure is
  `e2e/airbus-workload.spec.ts:242`, the pre-existing width assertion (topbar bottom 183.94 against
  a 145.59 limit) — the identical numbers recorded when it was proven pre-existing on a clean tree
  during plan 0034. Not introduced and not fixed here.

## 2026-08-20 Owner-gate sweep: responsive and reduced motion

- Responsive sweep at 375x667, 768x1024 and 1440x900, sampling seven story beats at each width (ident, suit-up, gates, logbook, reveal, throttles up, title). Asserted per sample: **zero horizontal overflow**, a **whole-number stage scale** (the pixel-grid invariant), and that the intro audio controls never cover a stage row above 200 — the rows the story acts on. All 21 samples clean.
- Reduced motion verified across eleven timestamps spanning every scene: each resolves to its own curated held frame (ident, ritual, suit-up, doors, standing-alone, walk-out, walk, aircraft-reveal, inserts, right-seat, title), the canvas reports `data-reduced-motion="true"` throughout, and **zero AudioContexts are constructed** — the synthesized gag effects stay silent as designed.
- The sweep harness reuses the puppeted media element from the verified renderer, so these checks run against an exact clock rather than a decoder that can drop into wall-clock fallback.
- Proof: `preview-renders/tmb2-intro-overhaul/gate-responsive-reduced-motion.png`.

## 2026-08-20 Intro milestone status for the owner gate

- Suites: `npm run check` 417/417 across 33 files; `npm run assets:check` 63 assets / 49 preloads; `e2e/smoke.spec.ts` 29 passed / 1 skipped.
- Known outstanding, not introduced by this work: `airbus-workload.spec.ts:242` (width assertion, topbar bottom 183.94 against a 145.59 limit), re-verified as pre-existing by stashing this arc's changes and reproducing the identical failure on the clean tree.
  **Corrected 2026-08-21 — this attribution was wrong.** `airbus-workload.spec.ts:242` is not pre-existing. Bisect: passes at `0719d8e`, fails at `3dbd47d`, so it was introduced by the Airbus radar/storm commit — the Restart button turned the topbar into a five-button grid at 621-900 px (143 px tall to 184 px) and the absolutely-positioned task panel, progress bar and instrument mirror, pinned at a hardcoded 9.1rem, went underneath it. The stash-and-rerun that "proved" it pre-existing stashed only the intro work, so the tree it re-ran on still contained the cause. Fixed in PR #58 by moving the band clear.
- Candidate for owner review: `preview-renders/tmb2-intro-overhaul/intro-fastopen-2026-08-20.mp4` — verified frame-by-frame during capture and re-verified at 16 checkpoints from the delivered file.
- Nothing pushed. The branch holds six commits awaiting the owner gate.

## 2026-08-20 E2E after the fast-opening cut: two stale intro tests repaired

- Full suite: **57 passed, 1 skipped, 3 failed**. Two failures were stale intro assertions this arc had missed; the third is the known pre-existing Airbus one.
- `smoke.spec.ts` "follows exact boundaries" was a SECOND boundary test carrying its own copy of the original scene table (hangar-reveal, shades, the flight-case summary) and asserting the attract loop restarted at the ident on `ended`. It now derives its samples from `introScenes` itself — the duplicated list only ever restated what the config already says, and it had drifted twice — and asserts the ending HOLDS the title scene instead of looping.
- `smoke.spec.ts` "renders the storyboard laser grid and emblem finale" still tested the retired emblem and takeoff act. Replaced by assertions on the two moments that now matter: the floodlit aircraft reveal at 37 s, and the runtime-lettered title over the empty right seat. One repair inside that rewrite: counting non-background pixels could not discriminate the title band because the seat plate fills the frame at both sample times (both returned exactly 2880, the full band area), so it counts BRIGHT pixels — the near-white lettering against the dark navy plate — and checks the band is at least twice as bright with the title up as without.
- `airbus-workload.spec.ts:242` re-verified as pre-existing by stashing all of this work and re-running on the clean tree, where it fails identically. Not introduced here and not fixed here.
  **Corrected 2026-08-21 — this attribution was wrong.** `airbus-workload.spec.ts:242` is not pre-existing. Bisect: passes at `0719d8e`, fails at `3dbd47d`, so it was introduced by the Airbus radar/storm commit — the Restart button turned the topbar into a five-button grid at 621-900 px (143 px tall to 184 px) and the absolutely-positioned task panel, progress bar and instrument mirror, pinned at a hardcoded 9.1rem, went underneath it. The stash-and-rerun that "proved" it pre-existing stashed only the intro work, so the tree it re-ran on still contained the cause. Fixed in PR #58 by moving the band clear.
- Full `e2e/smoke.spec.ts` re-run after the repairs: **29 passed, 1 skipped**.

## 2026-08-20 Fast opening, inside-the-cockpit departure, and CAPT. POP T restored

- Owner changes: speed the opening by moving the four stripes and the watch check ahead of the gates; keep the gates pinned to the 18 s "standing there alone" vocal; add the headset after the logbook; cut the runway lineup act; bring the nacelle spool in before the throttles; and put CAPT. POP T back on the logbook.
- The opening now cuts at ~1.39 s a beat (boots 7.512, coffee 8.898, cap flip 10.284, wings 11.67) so the four stripes take the track's largest hit at 13.056 and the watch lands at 15.528, both before the doors part at 18.
- Cutting the runway left the +9.1 dB and +20.1 dB hits at 45.12 and 46.008 with nothing on them, so the departure moved INSIDE the cockpit: panel wakes 38.52, overhead sweeps on 39.96, nacelle spools through its three states from 42.12, hand settles on the throttles 44.28, throttles pushed up on 45.12, and the panel surges with a whole-pixel airframe rumble on the 46.008 rotate before the hard cut to the empty right seat. No exterior plate appears anywhere in the intro, asserted by a sweep test.
- `plate-runway-lineup` retired along with the now-dead `runway-lights` and purpose-built `landing-lights` effects and their renderer cases. The headset, overhead and three nacelle cards returned from the shelf.
- CAPT. POP T is lettered beneath FLIGHT LOG on both the settled and the lifted logbook, restoring the personalisation that was lost when the flight-case card was cut.
- `npm run check` passed ESLint, TypeScript, **417/417 Vitest tests across 33 files**, and the production build. `npm run assets:check` passed at 63 assets and 49 preloads.
- Verified render captured in a single session with every frame's time and audio mode asserted, then the mp4 independently frame-extracted at 16 checkpoints — all matched: `preview-renders/tmb2-intro-overhaul/intro-fastopen-2026-08-20.mp4`.
- An e2e run started before these edits was discarded as meaningless (it exercised the previous code); the suite was re-run against this state.

## 2026-08-20 TMB2 ident: half-size logo, wordmark removal, and the hat gag

- The ident logo is now 160x44 centred at (80, 78) — half the 320 px stage width, matching the SEGA ident proportion it is modelled on, down from 288x79 filling 90% of the stage. The three mask layers are re-derived from the owner-approved `TMB2logo.png` at the new size by `tools/assets/build-tmb2-ident-assets.py`, not squashed at draw time, so they stay on the pixel grid; the source SHA-256 guard passed unchanged.
- The PRODUCTIONS wordmark was removed entirely at the owner's request: the builder function and its inline bitmap font, `tmb2-productions.png`, the `logo-productions` asset id, and every renderer branch, manifest entry and test that referenced it.
- The ident gag was replaced. Pop T sprints in, skids as the logo slams, the gust drops his cap over his eyes, it slides onto his forearm, he flicks it back up, it lands crooked, he straightens it and salutes before sprinting off. Beats sit on the measured 0.72 s accent grid at 1.776 / 2.496 / 3.216 / 3.936 / 4.656 / 5.376, all inside the 6 s window that gates PRESS START. The cap never crosses the floor; it is on him or in his hands throughout, and a test pins his bare-headed time under 1.6 s.
- Every Pop T sprite in the ident was regenerated to the canonical identity defined in Wave S6 (`art-source/intro/tmb2/scramble/refs/identity-popt-canonical.png`): blond eyebrows, four epaulette stripes, the badged captain's hat. Four generations across two sheets, each needing one delta pass. The retired `popt-tap` pose and asset are gone with the tap gag.
- Two pipeline defects were found and fixed. `normalise-scramble-sprite.py` scaled every frame by its own bounding box, so a cycle's crouched and upright poses were both forced to the target height and the character grew and shrank between frames; it now takes `--ref` to derive one shared scale. Separately, run frame 4 normalised one pixel wider than the 44 px cell, which `cell_pack` would have clipped silently, so the cell and its pivot moved to 46.
- Sound effects are synthesized in WebAudio rather than shipped as audio files: square, triangle and band-passed noise voices, no binary assets, nothing downloaded. The cue table in `src/game/introSfx.ts` is pure and each cue is test-pinned to the animation beat it scores, so a moved beat fails a test instead of drifting silently. `deriveDueIntroSfx` refuses backwards jumps, stalls over 0.5 s and non-finite input so a dropped frame never dumps overdue sounds.
- `npm run check` passed ESLint, TypeScript, **415/415 Vitest tests across 33 files**, and the production Vite build. `npm run assets:check` passed at 52 assets and 48 preloads.
- Browser sound proof, instrumenting AudioContext and stepping the intro clock across 0–6 s: all seven cues fired at their beats, one AudioContext created, voices square x5, triangle x3, noise x8, matching the cue table. Under `reducedMotion: 'reduce'`: 0 contexts, 0 oscillators, 0 noise sources. The probe itself needed a repair — it first reported every oscillator as `sine` because it read `node.type` at creation, before the player assigns it.
- Full e2e: 56 passed, 1 skipped, 2 failed. `e2e/smoke.spec.ts:248` failed on three stale wordmark expectations and was updated to the new geometry; it now also proves on the rendered canvas that the wordmark band and both side margins are pure background, which the old test could not. That emptiness check runs at t=1.5 s because at 4.8 s Pop T stands in the band the wordmark used to occupy. Re-run of the full spec: 27 passed, 1 skipped.
- `e2e/airbus-workload.spec.ts:242` fails on this branch (topbar bottom 183.94 against a 145.59 limit). Verified **pre-existing** by stashing all of this work and re-running on the clean tree at `3dbd47d`, where it fails identically. Not introduced and not fixed here.
  **Corrected 2026-08-21 — this attribution was wrong.** `airbus-workload.spec.ts:242` is not pre-existing. Bisect: passes at `0719d8e`, fails at `3dbd47d`, so it was introduced by the Airbus radar/storm commit — the Restart button turned the topbar into a five-button grid at 621-900 px (143 px tall to 184 px) and the absolutely-positioned task panel, progress bar and instrument mirror, pinned at a hardcoded 9.1rem, went underneath it. The stash-and-rerun that "proved" it pre-existing stashed only the intro work, so the tree it re-ran on still contained the cause. Fixed in PR #58 by moving the band clear.
- Responsive: 375 / 768 / 1440 captured with **0 px horizontal overflow at all three**, and the gag reads clearly at every one.
- Correction: an earlier note in this milestone claimed the intro controls hid the gag at 375 px. That was wrong — it came from a 375x248 viewport, a shape no phone has. Measured across real viewports on the unmodified layout, counting covered stage rows out of 224: 360x640, 375x667, 390x844, 414x896, 375x550 and 375x480 cover **0 rows**; coverage starts only at 375x400 (7) and 375x320 (47); landscape phones cover the bottom 19-22 rows, which are empty because Pop T's feet sit on row 196. A stacked narrow-width layout built in response was reverted. The regression test written alongside it passed with the fix removed, which is what exposed the finding as an artifact; it was replaced by a test that measures the invariant that matters — the topmost stage row the controls cover must stay at or below row 200 — checked at portrait and landscape phone sizes and proven to fail at a 224 threshold (landscape measures 201.7).
- Owner proof: `preview-renders/tmb2-intro-overhaul/ident-hat-gag-beats.png`, `ident-gag-sprites.png`, `ident-logo-sizes.png`, `popt-identity-sheet.png`, `popt-face-mismatch.png`, `ident-responsive.png`, `ident-160-tap-y78.png`. Not pushed; the owner gate still applies.

## 2026-08-20 Watch card: canonical Pop T and the gold Rolex GMT-Master

- `card-watch` regenerated against the Wave S6 identity sheet plus the previous card as a scene-only reference, closing two owner punch-list items in one generation: the pilot in the shot was a different man from the opening sprite, and the watch was a plain steel chronograph instead of the locker's Rolex GMT-Master. The face now matches the canonical Pop T — blond hair with temple spikes, deep-gold eyebrows, rounded boyish face, button nose, dark navy eyes, warm peach skin — and the watch is a gold GMT-Master with a black dial, gold markers and hands, and the split red-and-blue bezel. It is described by shape and colour only; the asset pack bans brand marks and lettering.
- Four epaulette stripes were correct on the first generation, the first time in this arc, after the stripe count was stated as its own line rather than folded into the uniform description. One delta pass was still needed: the model embossed the letter "M" on the hat's gold cord slide, against the standing no-text rule.
- Normalisation method was inferred rather than assumed — candidate pipelines were compared against the existing normalised card, and a direct BOX resize to 320x224 matched closest (mean absolute difference 0.64 versus 0.77 for crop-then-resize).
- `npm run check` passed 415/415 across 33 files. `npm run assets:check` passed at 52 assets and 48 preloads. Intro e2e after the swap: 4 passed. Browser proof at the 24.552 watchCheck cue: `preview-renders/tmb2-intro-overhaul/watch-card-gold-rolex.png`.

## 2026-08-20 Intro ending: off-camera departure, the empty right seat, and the game's title

- The takeoff act and the winged-globe emblem are both retired. The departure now happens off camera — landing lights blaze across the empty tarmac on `throttlesUp`, lift away on `rotate` — then a hard cut inside to the DC-9's empty right seat with its harness hanging loose and its panel awake, and on the 49.704 hit the instrument glow resolves into the game's own title, "The Captain's Key". The last frame before the loop is the seat the player takes when they press start.
- Why the aircraft went away rather than being redrawn: a regenerated, model-correct DC-9 was produced first and compared against the old one at runtime sizes. At 160 px it was clearly better; at 80 px and 48 px both were mush. A pale grey-and-white airliner cannot survive being drawn 48 px wide against a night sky, so the limit was the concept rather than the art. Evidence: `preview-renders/tmb2-intro-overhaul/dc9-liftoff-old-vs-new.png`.
- All seven jet sprites, the emblem card and the night-sky plate are gone, along with `JET_CLIPS`, `jetActor`, `JetClipId`, the `jet` frame field, `strobeOn`, `IntroCardFrame` and `emblemCardScale`. Cues were renamed to what they now host — `jetPass` to `intoTheSeat`, `emblemStamp` to `titleCard` — with their measured values unchanged and still test-locked. Scene `takeoff` split into `departure` and `right-seat`.
- The title is lettered at runtime from `gameCopy.title`, the same route the case nameplate uses, so no generated art carries text and the intro cannot disagree with the opening screen — asserted by test. The Start handoff, which used to zoom the emblem, now zooms the title.
- The new right-seat plate was generated against the game's own first-officer render for cockpit content and an existing intro card for drawing style. It returned at a 1.78 aspect against the stage's 1.43 and is centre-cropped rather than squashed; a direct resize would have distorted it by 24%.
- The landing-lights beat took four attempts and the first three were the wrong approach: `beacon-sweep` plus `radial-rays` gave full-frame searchlight shafts, `radial-rays` alone read as a sunburst, and bare `sparkle` pairs were too small to carry the beat. The root cause was that no existing fx primitive expresses "a light approaching", so a purpose-built `landing-lights` fx was added — two hot cores with a flat three-step cone of spill opening toward the camera, no gradients, inside the existing cel-shaded language.
- `npm run check` passed ESLint, TypeScript, **416/416 Vitest tests across 33 files**, and the production build. `npm run assets:check` passed at **44 assets and 40 preloads**, down from 52 and 48. Full `e2e/smoke.spec.ts`: **29 passed, 1 skipped**, after updating the scene-boundary test for the renamed scenes and raising a 20 s preload timeout to 60 s.
- Browser proof at all six ending beats: `preview-renders/tmb2-intro-overhaul/intro-ending-right-seat.png`. Not pushed; the owner gate still applies.

## 2026-08-20 Intro reorder: owner sequence, case and photo cut, all-gold watch

- Cut at the owner's direction: the flight-case ritual stills (both cards), the family-photo cockpit insert, and the red/blue split bezel on the watch. The watch is now all gold — gold case, gold bezel, gold bracelet, black dial — regenerated as a one-change delta off the approved card.
- Consequence recorded rather than hidden: the `CAPT. POP T` nameplate existed only on the flight-case card, so his name no longer appears anywhere in the intro. The now-dead runtime-lettering machinery for it was removed rather than left wired to nothing. The logbook card is its natural new home if the owner wants it back.
- Scene order rebuilt to the owner's sequence: boots, coffee, cap flip, wings, four stripes, watch, logbook, aviators, doors opening, standing alone, the walk, then the aircraft. The scene table is now ritual / suit-up / doors / standing-alone / walk / aircraft-reveal / inserts / departure / right-seat / title / loop-reset. The old `hangar-reveal` and `engine-start` scenes merged into `aircraft-reveal`, which slams the floodlights on at 35.64 and lights the engine off at 37.08.
- **The silhouette beat was placed by measurement, not by eye.** The owner asked for it to land where the music dies down under the "standing there alone" lyric. RMS was measured over the whole track in 0.5 s windows: the deepest sustained quiet in the body of the song is **30.5–32.0 s, mean −28.6 dB, bottoming at −30.8 dB**, against roughly −24 dB either side. The `standing-alone` scene now sits at 30.48–31.5 and deliberately carries no accent, no shake and no flash — only a slow push-in — so the stillness reads as intended.
- Which beat sits on which accent changed; the accent times themselves did not. The measured values stay locked by test, and the four captain's stripes now inherit the track's largest hit at 13.056 (+28.6 dB).
- `npm run check` passed ESLint, TypeScript, **415/415 Vitest tests across 33 files**, and the production build. `npm run assets:check` passed at **41 assets and 37 preloads**, down from 44 and 40.
- Delivered as a real render with sound rather than silent stills: 636 frames captured at 12 fps from the live production build and muxed with `public/audio/intro-audio-53s.mp3`. Output `preview-renders/tmb2-intro-overhaul/intro-reorder-2026-08-20.mp4`, verified by ffprobe at 53.000 s, 1280x896 H.264 + AAC, 10,008,990 bytes.

## 2026-08-20 Intro pacing, no attract loop, and real frames in the ident gag

- **The attract loop is gone.** The intro plays once and holds its final frame — the title over the empty right seat — until the player starts. Before changing it I confirmed the loop was deliberate and correctly timed: the mp3 measures 53.040 s against `INTRO_DURATION_SECONDS` 53.04. Two changes were needed together: `sampleIntroRuntime` pins at the duration instead of reporting a loop, and `normalizeIntroTime` clamps instead of wrapping, because a modulo at 53.04 snapped the held frame back to the ident. The `loop-reset` scene and its pixel collapse retire; `title` runs 49.704 to the end. `resetIntroRuntimeLoop` survives for the audio-failure retry path.
- **Pacing was measured, over-corrected, and then corrected properly.** A sweep of the derived animation found 27.6 s of 53.04 (52%) on six single-image holds, the worst 9.96 s on the doorway. The first fix cut the walk-out into six equal beats, which measured 22 of 29 shots under 1.6 s with a 1.44 s median — a metronome. The shipped version is four beats with a deliberate shape (1.44 s, 1.58 s, then 2.87 s and 3.06 s) before the 1.02 s quiet. Mean shot length 1.62 s → 2.13 s. Both failure modes are now guarded by tests: no shot in the body may exceed 4.7 s, and the last two walk-out beats must be clearly longer than the first two.
- Six new cards generated first time and on style: door release, headset, chocks, wands, shadow, overhead panel. Two returned at the wrong aspect and were cropped rather than squashed — `card-shadow` came back portrait 1024x1536, and its top crop now carries the standing-alone beat. The headset card is shelved unused in `art-source` after the pacing correction.
- **The ident gag was measured before being fixed:** 6 distinct poses over 3.22 s (1.9 per second) and a run cycle of 6 frames at 80 ms (12.5 fps). The run choppiness was NOT an artifact of a 12 fps video capture as first assumed; it was genuinely 12.5 fps at source. Twelve in-between drawings across two sheets take the run to 12 frames at 40 ms (25 fps) and the gag to 12 poses (3.7 per second).
- **The cap's flight is no longer animation frames at all.** The airborne pose separated cleanly (opaque row bands 0-12 cap, 42-104 body), so the cap is now its own sprite drawn on an interpolated parabola with continuous rotation over a bare-headed body pose. It moves at the browser's draw rate, which no number of generated frames could match. A test asserts the cap's position and rotation change between samples and that it arcs higher mid-flight than at either end.
- `npm run check` passed ESLint, TypeScript, **416/416 Vitest tests across 33 files**, and the production build. `npm run assets:check` passed at **53 assets and 49 preloads**.
- Evidence: `preview-renders/tmb2-intro-overhaul/ident-hat-flip-30fps.mp4` (ident only, 30 fps) and the full-length render with the real track.

## 2026-08-20 Intro re-timed around the vocal at 18 s

- The owner placed the "standing there alone" lyric near 18 s and asked for the doors to open onto it. Re-measured at 0.25 s resolution, the arrangement thins from 15.25 s to 18.0 s — buckets at -30.4, -32.3, -29.5 and -28.8 dB against roughly -21 dB either side, with a downbeat at 18.0. That is a sparse vocal passage. An earlier measurement using 1.5 s rolling averages had pointed at 30.5 s instead; averaging over a wider window smoothed this passage away and favoured a uniformly quiet stretch. The owner's ear was right and the first measurement was the wrong instrument for the question.
- Surfaced the arithmetic rather than silently choosing: the ground act runs 7.512 to 42.84, which is 35.3 s fixed at both ends by measured accents. It holds 19 images, so the ceiling is 1.86 s per shot. "Slow it down dramatically" and "don't shelve anything" cannot both hold at once.
- Resolution, agreed with the owner: an uneven shape rather than a uniform speed. The ritual and suit-up cut fast against the busy arrangement, everything stops at the doors for the vocal, and the walk out to the aircraft plays long. Measured result: **1.28 s per shot before the doors over 9 shots, 2.31 s after over 10 shots**, with a 2.42 s hold on the doorway silhouette across the vocal and a 7.44 s walk.
- New `ramp` scene carries the chocks and the wands at 2.4 s each; the shadow card carries the standing-alone beat at 21 s. Nothing was shelved.
- **A mistake worth recording:** restoring the four cards with `git checkout --` on four files reverted them to HEAD, silently discarding this session's edits to `introAssets.ts`, `build-intro-manifest.mjs`, `deploy-scramble-intro.py` and `intro-asset-contract.test.mjs` — the sprite registrations, the 12-frame run packing, the manifest preloads and the ident-geometry contract. All four were rebuilt by hand and verified against the suites. A targeted edit would have been the right tool.
- `npm run check` passed ESLint, TypeScript, **418/418 Vitest tests across 33 files**, and the production build. `npm run assets:check` passed at 63 assets and 49 preloads.

## 2026-08-20 Root cause: the render pipeline could silently lie about timing

- Forensic frame extraction from the delivered `intro-slowed-2026-08-20.mp4` proved it did not show the source timeline at all: the entire 53 s story played in the first ~14 s of video (doors at t=9, walk at t=12, takeoff at t=14) and the title over the right seat sat frozen for the remaining ~37 s — exactly the "rapidly going through and freezing the last scene" the owner reported. The slowed timeline had never actually been seen.
- Root cause: the render harness scrubbed `audio.currentTime` and trusted the result. If `audio.play()` failed or was interrupted in the headless browser, the intro runtime silently entered its wall-clock fallback mode, where the rAF tick recomputes time from real elapsed time and overwrites every scrubbed position. Because a captured frame takes several times longer than 1/30 s of real time, the animation raced ahead of the video timeline and then held its final frame. The live game is unaffected — fallback runs at 1x there — only renders could lie, and intermittently, which is why several earlier renders were honest and this one was not.
- Fix: a verified render harness (`render-verified.mjs`). It launches with `--autoplay-policy=no-user-gesture-required`, refuses to start when the runtime reports the audio fallback ("continuing without sound"), and asserts on every frame that the canvas `data-time` matches the requested scrub time within 50 ms, aborting rather than producing a lying video. Renders now fail loudly instead of misleading.
- Two genuine timeline nits from the honest cut table were fixed alongside: the door-release card flashed for 0.6 s (doorsParting moved 18.6 → 19.2, giving the release a 1.2 s beat), and the departure plate was truly static for the 2.3 s before throttles-up (the runway lights now idle-crawl, reading as the slow roll into position).
- `npm run check` 417/417 across 33 files.

## 2026-08-20 Verified render pipeline: the full diagnosis and the honest video

- The drift was reproduced and instrumented rather than re-tuned around. A `play()`-tracing probe showed nothing was restarting playback; per-frame verification then caught the runtime reporting `data-audio-failed=true` with **`mediaError=3` (MEDIA_ERR_DECODE) at t≈6.7 s, every session**. Chromium's MP3 decoder dies when scrubbed rapidly across that position in the track; the element fires `error`, the app correctly enters its wall-clock fallback, and every subsequent scrubbed frame renders the wrong time. The live game never seeks, so players are unaffected — only scrub-rendering could lie, intermittently before today and deterministically now.
- A WAV substitute served by route interception refused to land seeks at all. Final fix: the render harness **puppets the media element** — `HTMLMediaElement.currentTime` becomes a plain variable via an init-script property override, `play()` resolves immediately — so the app runs its genuine media-mode code path against an exact clock with no decoder involved. The harness asserts `data-time` and `data-audio-failed` on every frame and recycles the session on any degradation.
- `GameIntro.tsx` now exposes `data-audio-failed` on the intro section so harnesses and tests can assert the runtime's audio mode directly.
- Result: all 1591 frames rendered in one session with every frame verified, and the delivered `intro-verified-2026-08-20.mp4` was then independently frame-extracted at 18 timestamps — every one matches its expected scene, boots at 9 s through the title at 51.5 s.
- `npm run check` 417/417 across 33 files; `git diff --check` clean.

## 2026-08-20 The reading pile, the gates on the vocal, and the animated pick-up

- The gate opening replaced the release-lever insert on the 18 s "standing there alone" downbeat, at the owner's direction; the leaves now grind open around the silhouette through the whole vocal passage.
- The logbook beat became a four-stage animated story at the owner's direction: the reading pile (the Isaacson Musk biography, redrawn from the real cover the owner supplied — black jacket, face filling the frame, steepled fingers — plus two Reacher paperbacks), the mid-sweep, the hand on the bare log, and the log lifted in the hand. Wave S14 took three generations (the jacket design was guessed wrong twice before asking for the real cover); Wave S15's two motion frames landed first try as next-frame deltas.
- A new runtime `label` frame kind letters every cover — ELON MUSK, REACHER, LEE CHILD, FLIGHT LOG — because the pack forbids generated text. All positions measured off 5 px zoom grids of the deployed 320x224 cards after eyeballed placement missed by 6-10 px; the lift frame's lettering was measured separately for the raised cover. No labels ride the sweep frame, whose covers are mid-slide.
- `npm run check` 418/418 across 33 files; asset contract 65 assets / 45 preloads. Proofs: `preview-renders/tmb2-intro-overhaul/logbook-four-stages.png` and the verified full render.

## 2026-08-18 Scramble round 3 — hat unified in gold, montage reordered for continuity

- Owner gate round 2 continued: the captain's hat differed across scenes (flip cards silver-trimmed, watch card wearing an invented cap, shades/sprites gold-banded) and the trim must be gold; separately, the watch scene had to follow the hat scene, since it shows the hat being worn. Wave S5 (5 delta generations) unified every hat appearance on the canonical design — game-hat shape, gold braided chin cord, gold oak-leaf visor spray, red-ringed badge with gold wings — with the watch card's badge needing a second targeted delta that passed the flip card in as the badge reference. The suit-up montage was reordered: cap flip opens on the 14.544 accent, then stripes → logbook → wings, and the watch check closes on 24.552 into the doors. Cues renamed to their content (capFlip/logbookSnap/watchCheck), measured values test-locked and unchanged; scene summary and e2e copy updated to match.
- `npm run check` exit 0 (266/266, build clean); `npm run assets:check` 49 hashed / 45 preloads. Reordered montage captured in the browser (8 stills, `preview-renders/tmb2-intro-overhaul/stills-scramble-r3/`); hat congruence verified across all five hat appearances at stage scale.
- Playwright e2e after the reorder: **51 passed, 1 skipped, exit 0** — baseline held. The emblem finale card was then replaced on owner direction ("new emblem, get rid of the key"): a transparent 220×94 winged-globe sprite in the film's design language at the same asset path, verified stamped over the rays and contrail in the browser; `npm run check` and assets:check green after the swap (asset-content change only — scene logic, text, and timings untouched). Remaining open: the nacelle-girth soft flag. No push before owner approval.

## 2026-08-18 Scramble round 2 — owner punch list repaired end to end

- Owner gate round 1 verdict: "decent, but room for a lot of improvement," with nine notes, plus two mid-wave directions (cut the harness entirely; match the flip cap to the game's captain's hat). All addressed: the ident now runs on new 64 px run/skid/tap sprites (single-sheet cycle generation, legacy 256-cell sheets deleted); the gloves card is replaced by the watch and the harness by the logbook snapping shut on the 19.368 click (a deliberate foreshadow of the DC-9 Final Flight Log chapter); the cap flip is a three-frame action using the game's actual captain's hat as an image reference; the walk is a new 48 px cycle at a stride-matched pace; the case-shut and shades cards are exact-framing deltas (shut latches, blond temples); and the takeoff was restaged — the jet recedes down the runway through 52/36/26 px pre-rendered sizes, rotates off the painted horizon with exhaust, the overhead pass sweeps up-right through 160/320 px (the first build's pass flew against the sprite's attitude), and a 48 px silhouette climbs out riding the contrail tip.
- `npm run check` exit 0 (ESLint after one no-useless-assignment fix, TypeScript, 266/266 Vitest, production build); `npm run assets:check` passed — 49 hashed assets, 45 preloads, hash-bound list derived from `introAssets.ts`. Round-2 browser proof: 19 stills at the changed moments, production build, clock-driven — `preview-renders/tmb2-intro-overhaul/stills-scramble-r2/`.
- Open at the owner gate: the emblem finale card still carries the retired key art (regenerate vs keep as callback), and the S2 nacelle-girth soft flag. Playwright e2e re-run after the round-2 integration: **51 passed, 1 skipped, 17.1 m, exit 0** — baseline held. No push before owner approval.

## 2026-08-18 Scramble intro runtime — new design implemented, suites green, owner gate open

- The owner retired the duffel-and-key chase after its structural failure was diagnosed (the bag was painted into the background plate — immobile, out of scale, no contact point), reviewed three new designs, chose the launch-sequence "Scramble", approved its full-length greybox animatic, and iterated the generated assets through four waves (36 accepted generations across S0 anchors, S1 plates, S2 cards, S3 sprites, with owner-directed fixes: Northwest livery, modern flight case, landing gear, blond photo pair, lit instrument state). Plan `plans/0031-ink-and-altitude-intro.md`; prompts, attempts, and per-asset evidence in `asset-reports/scramble-intro-prompt-pack.md`.
- Runtime replaced wholesale on the same measured 53.04 s track: `introMusicCues.ts` renamed to the Scramble cue set with the measured values test-locked so a rename can never move an accent, and grid-derived cues asserted against the 0.72 s beat grid; `introConfig.ts` carries 13 scenes whose boundaries sit exactly on cues; `introAnimation.ts` and `introRenderer.ts` rewritten (beat-locked card cuts, two-state reveals for the floodlight slam and instrument wake, sliding door leaves over the backlit silhouette, runtime nameplate lettering over the generated blank plate, beacon/strobe/exhaust/contrail/runway-light FX, a jet actor that swaps pre-rendered 80/160/320 px sprites so scales stay whole, 1 px integer roll rumble, SEGA hitstop on the jet pass). The 0–6 s ident is kept verbatim; the key mascot is fully retired and the Start handoff now zooms through the emblem.
- Pixel-grid invariants held and extended: the whole-timeline sweep asserts integer scales for both Pop T and the jet; camera offsets stay integers; zoom rests at exactly 1 with the identity ceiling moved 0.15 → 0.2 for the montage's extra accent punches (held zooms remain structurally impossible). Sprite quality was verified by measurement before integration: zero chroma spill on all 11 sprite files, walk-cycle feet locked to one baseline row with ±0.7 px centroid drift, and every sprite exactly one connected component after alpha hardening (now built into `tools/assets/normalise-scramble-sprite.py`).
- `npm run check` exit 0: ESLint, TypeScript, 266/266 Vitest across 25 files, production build. `npm run assets:check` passed — 54 hashed assets, all 42 runtime images hash-bound through the manifest preload (builder list now derived from `introAssets.ts`). `npx playwright test --project=chromium`: **51 passed, 1 skipped, 17.1 m, exit 0**, identical to the pre-rewrite baseline, with the spec's scene table and reduced-motion pose checks evolved to the new scenes.
- Real-browser proof against the production build with the clock-driven method: 29 story captures plus reduced-motion and 375/768 viewport stills, zero page errors — `preview-renders/tmb2-intro-overhaul/stills-scramble/` and `scramble-browser-proof-sheet.png`. Verified in-browser: the lettered nameplate, the row-slam mid-reveal, the instrument wipe mid-wake, the walk sprite on the tarmac, runway FX over the bare plate, and the hitstop-frozen pass.
- Test evolutions recorded, never weakened; one guard consciously narrowed: the word "cockpit" left the scene-copy regex because the insert shots are cockpit content by design — every reward-protection term stays.
- Open at the owner gate: the kept `emblem-finale.png` card is the retired design's art (old-style Pop T holding the golden key) and now reads incoherent as the Scramble title card — regenerate or keep as a callback, owner's call. Plus the two soft S2 flags (case-shut reframe, nacelle girth). No push before owner approval.

## 2026-08-17 Pixel-safe punch camera — intro pixel-exact on 93.3% of frames

- The owner asked for the fractional punch-camera zoom to be scoped, then approved the change with the Pop T contract amended first. Scoping measurement, over 5305 frames sampled at 100 Hz: the camera was doing two unrelated jobs. Nine scenes each held a constant fractional zoom as a framing choice, accounting for 61.5% of frames with no motion at all; another 27.4% was a slow ease toward that baseline; only 11.1% was punch. Per-frame screen movement of a fixed world point measured 0.02–0.36 px on average — sub-pixel drift nobody perceives — while resampling the whole stage continuously. The runway's tracking camera swept its focal 128 px to move the world 18.3 px across a six-second scene.
- Landed: all nine held baselines retired to 1.0 (`runway` 1.14, `duffel` and `final-pursuit` 1.10, `ballpark`, `city-finance` and `sky` 1.08, `tmb2-ident` and `catch` 1.06, `key-escape` 1.02/1.04); a new `punchZoom` helper with a 0.02 dead zone, so zoom cannot structurally be lifted by anything but an accent; and `accentShake` rounded to whole stage pixels. Camera census after the change: 93.0% identity, 0.3% integer shake only, 6.7% (3.6 s) inside a punch envelope — **93.3% pixel exact against 6.4% before**. Punch peaks preserved and relatively stronger, because the same lift now starts from a wider rest: ballpark is a 1.23× push from 1.0 where it was a 1.22× push from 1.08.
- Two deviations from the scope, both driven by measurement. Focal tracking was kept rather than deleted: with the baseline at 1 the focal is inert except while a punch runs, and during a punch it is what aims the push-in at its subject, so the drift the scope objected to was already removed by retiring the zoom. And re-staging was one line rather than nine scenes: actors sit near their focals, so the apparent shift from the widened framing is 1–7 px, and all nine scenes were inspected in a real browser and read correctly as staged.
- One genuine staging repair. Overlay bands measured in the live page, in stage rows: the Press Start button occupies 188–195 and the audio controls 204–219, leaving a 9-row gap for a cart that needs 16. The runway cart moved from row 208 to 182, crossing just above the button at Pop T's shin, and the near-miss now reads. The 0028 attempt could only lower the focal, because the held 1.14 zoom pushed the cart further down the frame the more the camera tried to include it.
- Test evolutions recorded, never weakened. `lands a camera punch, flash, or hitstop on every measured accent` asserted `chase.camera.zoom > 1.05` at t=18, which pinned the held runway framing — the thing being retired; it is now `toBe(1)` alongside the existing assertion that the near-miss lifts it, which pins both the rest state and the punch. New test `rests the camera at identity and lifts it only for a punch` sweeps the full timeline asserting integer offsets, `zoom >= 1`, nothing inside the dead zone, and that under 15% of frames carry any lift.
- Pop T contract amended before any frame generation, as the scope required: standing height 92 → 104, pivot (64,112) → (64,120), baseline row 111 → 119, envelope widened to x [5,123] / y [7,127]. With no camera magnification left the art must carry the size; 104 is the tallest standing pose the 128 cell holds while leaving headroom for raised arms, and lands ~9% under the 0028 average apparent size. The contract records a `dependsOn` block so the two number sets are never mixed. Prompt pack and reference images regenerated. `tools/assets/check-popt-frames.py` now reads `envelopeBounds` from the contract instead of duplicating it, and was re-verified in both directions against the amended numbers: exit 3 with 35 failures over the 24 shipped v1 frames (24 orphan-rate, 6 frame-count, 5 baseline), exit 0 with 0 failures on a six-frame synthetic control built to the contract.
- `npm run check` passed ESLint, TypeScript, 267/267 Vitest across 25 files, and the production build. `npm run assets:check` passed, 78 assets / 21 preloads. `npx playwright test --project=chromium` passed 51 with 1 skipped in 16.7 minutes, exit 0 — unchanged from the 0028 and 0029 baselines.
- Real-browser evidence at 1440×900 against the production build with the clock-driven method: eleven scene samples captured with no page errors — ident tap, duffel, exclaim, runway, cart, ballpark, bull, sky, pursuit, grab, emblem. Every scene reads crisper; the ident tap now fits the whole TMB2 wordmark in frame, where the held 1.06 plus punch used to crop its edges. The emblem finale is byte-identical because the card is a screen-space command and was never inside the camera transform.
- Open: the owner visual gate on the re-staged composition, which should be taken together with the 0028 punch review since both concern the same frames. Then plan 0029 resumes at the Wave 0 anchor against the amended contract. No push before owner approval.

## 2026-08-16 Pop T sprite re-authoring opened — draw scale corrected, frames owed

- The owner judged the Pop T sprite the thing dragging the intro down and chose to re-author the asset only, leaving the GameDevStuff pipeline untouched, with frames generated by the owner through ChatGPT Image. Diagnosis measured against the shipped build and recorded in `plans/0029-popt-native-resolution.md`: (1) Pop T was drawn from 256 px sheets with a 2 px art grid at `scale` 1.08–1.18, so one art pixel covered 2.24 stage pixels on a 320×224 stage where everything else draws 1:1 — a horizontal run-length census of `duffel-pull-01` measured 44.8% odd-width runs at 1.12 against 0.0% at 1.0; (2) he is 37×46 art pixels at ~41% of stage height while the key mascot beside him is 84×75 at a smaller on-stage size, a ~5× detail gap; (3) 13.1% of his opaque pixels are orphans against 8.5% for the key, the signature of quantising a generated image.
- Root cause is the sprite contract, not the drawing. The v1 canonical cell 128×128 and pivot (64,112) are the Pixel Sprite Animation Pipeline's documented defaults and were never derived from the intro stage; its validation passed palette, pivot, baseline, and landmark drift while never compositing the sprite on the stage at its real size.
- Fixed in code: `poptActor` now takes scale 1 at all 22 call sites, with the invariant documented on the parameter. New test `keeps Pop T on the stage pixel grid for the whole intro` sweeps all 1327 frames at 25 Hz plus seven reduced-motion samples asserting a whole-number scale ≥ 1. Test evolution recorded: the existing `stages Pop T as the readable comedy lead` assertion `popt.scale >= 1.05` was the assertion that licensed the bug, and was replaced with `popt.scale * clip.frameHeight >= INTRO_STAGE_HEIGHT`, which pins the same intent as an on-stage measurement and does not admit fractional scales.
- Authored for the owner's generation pass: `asset-reports/popt-sprite-contract.json` (v2 contract, every number derived from the stage; 92 px standing height, pivot and palette unchanged, 40 → 55 frames), `asset-reports/popt-frame-prompt-pack.md` (anchor plus 55 pose briefs in three waves), and the reference images under `art-source/intro/tmb2/popt-v2/references/`.
- New gate `tools/assets/check-popt-frames.py` checks canvas size, palette conformance, pose envelope, baseline, silhouette connectivity, and orphan-pixel rate. Proven in both directions: it exits 3 against the 24 shipped v1 frames with 30 failures, and exits 0 against a six-frame synthetic control built to the contract. It is deliberately not wired into `npm run assets:check` yet because it would fail the currently shipped frames.
- `npm run check` passed ESLint, TypeScript, 266/266 Vitest across 25 files, and the production build. The new guard was proven falsifiable by restoring `scale = 1.12` (1 failed / 27 passed) and then restoring the fix (28/28). `npx playwright test --project=chromium` passed 51 with 1 skipped in 16.5 minutes, exit 0, unchanged from the 0028 baseline.
- Real-browser A/B at 1440×900 against the production build with the clock-driven method: Pop T's skin-tone bounding box measures 188×157 screen px before the change and 168×139 after, the 1.13 ratio expected from 1.12 → 1.00. Inspected captures at t=44 and t=47.496 show no layout regression and no page errors; the `pilot-wings` prop, whose offset was tuned to his old height, still reads correctly and was not adjusted. Recorded honestly: an earlier version of this check counted runs of every Pop T palette colour across the whole screenshot and reported ~97% clean for both builds — the backgrounds share those colours, so the check could not fail, and it was discarded in favour of the sprite-level census.
- Open and unresolved, found while validating and deliberately left alone: the plan-0028 punch camera applies a fractional world zoom on 93.5% of the intro (zoom exactly 1 on only 86 of 1327 frames sampled at 25 Hz; reduced motion is identity), which point-samples the entire stage off the pixel grid regardless of sprite scale. It is a larger contributor to the frame reading soft than anything about Pop T, it is not an asset defect, and correcting it changes approved 0028 choreography — so it is recorded as the owner's call. New frames will still be resampled by the camera until it is answered.
- The critical path is now owner generation of the Wave 0 anchor. No push or publication before owner approval.

## 2026-08-15 TMB2 intro SEGA punch pass — owner visual gate open

- The owner judged the 0022 storyboard-fidelity build under par against the Genesis-era SEGA logo-intro reference and approved the plan-0028 direction: a code-only punch pass now, ChatGPT-Image acting frames next, and the plan-0020 ident reopened for a Pop T logo gag. Implemented: a pure-frame punch camera (focal zoom plus deterministic shake offsets applied around the world draw commands), accent flash frames, hitstop that freezes the acting clock at the accent and catches back up continuously, the ident logo gag on the 0.72 s beat grid extrapolated from the measured cues (the 0–6 s ident window is a measured flat pad), and per-accent punches, flashes, and tracking cameras across all eight story scenes. The TMB2 logo bytes are untouched; the key never appears before its 12.696 s duffel burst.
- TDD at each step with recorded RED runs; the ballpark ≤4 px smoothness sweep caught an 8.9 px rejoin jump in the first hitstop design, which was replaced with the continuous catch-up form. Unit suite grew 256 → 265 across 25 files; ESLint, TypeScript, and the production build passed at every commit (`3caf67a`, `48a1f32`, `84b0abd`, `898666a`).
- Real-browser verification at 1440×900 against the production build with the clock-driven method: stills at all sixteen punch/gag moments were captured and inspected; two real defects were found and fixed (the runway camera pushed the crossing cart behind the audio controls; the exclaim red wash drowned the storyboard's red "!"), then re-captured and verified. Stills live under `preview-renders/tmb2-intro-overhaul/stills-sega-punch/`.
- Motion proofs: `intro-proof-sega-punch-1440x900-4fps.webp` (244 frames, PIL-verified non-black at sampled frames) plus two 12 fps punch-window recordings (key-burst/exclaim and emblem stamp). ffmpeg encodes but cannot decode animated webp, so assembly verification used PIL.
- Reduced motion re-verified in a real browser: representative poses with identity camera and no flashes at the ident, exclaim, deflect, and stamp samples. Responsive spot checks passed at 375, 768, and 1440 px. Full Playwright e2e after the punch pass: 51 passed, 1 skipped in 16.9 m (exit 0), including the storyboard fx probes at t=38 and t=50.2. `npm run assets:check` passed (78 assets / 21 preloads) after the acting-frames prompt pack (nine `character-acting` records) was recorded in the ledger with the owner-facing view `asset-reports/tmb2-acting-frames-prompt-pack.md`.
- Open at the owner gate: review of the punch-pass motion proofs and stills, the stamp-vs-eased emblem reveal choice, and owner generation of the priority-1 acting packs plus the still-owed `runway-day-v1` daylight plate. No push or publication before owner approval.

## 2026-08-19 DC-9 owner playtest repairs — the last gauge and the overhead switches

- Owner playtest of the new DC-9 chapter: "better, but the last gauge is not showing up as a clickable option, and the overhead panel needs to be clickable for the switches." Both reproduced and fixed.
- **Overhead switches (the more serious of the two, and latent since the shutdown shipped).** Clicking the APU bus switches — the *first* required step — on the real overhead panel returned "That step comes later." The three shipped hit volumes are 240–460 mm boxes around switches only 70 mm apart, so they overlap heavily and a ray aimed at one switch strikes whichever neighbour is nearer the camera; the battery box sat in front of the APU buses. `separateDc9OverheadHitboxes` now shrinks each collider to a 42 mm volume about the centre the asset gave it. The bound is per-axis, not centre distance: the APU master and battery pivots differ by only 49 mm on their widest axis, which the first attempt at 55 mm missed and the new test caught. Verified in the browser against the real GLB: all three switches now action their own switch, in order, through to the ATP gate.
- **The last gauge.** EPR is the one instrument not on the first-officer panel — it is on the centre pedestal, at the far-left edge of the scan framing — so it clips off the left edge as the window narrows. Measured: at 1024x768 its target sat at x = −25, half off-screen, and at 900 px it was gone. The projected targets are now clamped by their own half-extent so a gauge only partly in frame stays wholly clickable; the gauge currently being asked for additionally falls back to a labelled chip if its projection leaves the view entirely; and the scan panel now leads with the question and the six options, so the last option is never below the fold. Verified at 1024x768: the target moved from x = −25 to x = 8, fully on screen, and answering from the cockpit works.
- Regression coverage added to the existing real-GLB spec rather than paying for another 36 MiB load: the EPR target is asserted fully on screen at both 1024x768 and 1280x720, and the first overhead switch is now actioned by clicking its projected point in the cockpit, with the out-of-order coaching path preserved.
- Off-view fallback proven in the browser: after looking right until the centre pedestal leaves the frame entirely — the owner's exact failure mode — the EPR target switches to `data-projection="fallback"`, renders as a labelled 196x40 chip in the cockpit area, and answers correctly. Before the fix there was nothing to click at all.
- `npm run check` exit 0 (**374 tests**, up from 369); `npm run assets:check` exit 0. Affected Playwright specs re-run against the final build: 4 passed, including the real-GLB staging test carrying both new regression guards.

## 2026-08-19 DC-9 right-seat systems check — the parked cockpit answers the player

- The owner asked for real DC-9 gameplay: push and pull the yoke, work the thrusters, identify gauges. The chapter now opens on **Flight controls — free and correct** (column full aft and forward, wheel both stops, both rudder pedals, thrust levers advanced then closed — eight movements, no failure state, no timer), and completing the sweep is what reveals the route strip clipped to that same yoke. A new **instrument scan** sits between the Home Operations Log and the ceremonial shutdown: six right-seat instruments called in scan order, answerable by clicking the gauge in the cockpit or from a keyboard-reachable list, each correct answer running that instrument's own needle through a power-on self-test. Plan `plans/0032-dc9-right-seat-systems-check.md`.
- **No asset rebuild.** The shipped 36 MiB GLB already exposes every donor draw range as a named node; what it lacks is pivots. Those were measured out of the cleared donor OBJ8 and are rebuilt at runtime as groups above the named nodes, so `public/models/dc9-cockpit.glb` is byte-for-byte unchanged and its owner gate is not reopened. The coordinate mapping was proved first — glTF equals raw X-Plane space — on seven nodes to three decimal places. Values recorded in `art-source/blender/dc9_interaction_map.json` under `flightDeck` and in `asset-reports/dc9-pipeline-proof.md`.
- `npm run check` exit 0: ESLint, TypeScript, **369/369 Vitest across 31 files** (291/27 before), production build. `npm run assets:check` exit 0 including the new DC-9 flight-deck contract, which fails if any of the 23 contract nodes disappears, if an ancestor acquires a rotation/scale/matrix, or if a gauge click target drifts off its own geometry.
- Browser proof, production build against the real GLB at 1440x900: model state `ready`, 18 interaction targets (12 existing + six `dc9.gauge.*`). Control sweep measured as changed pixels against the neutral frame with the HTML panel excluded — column 69,545 px, wheel 35,218 px, pedals 9,815 px, levers 11,506 px — all eight items latched and the route strip appeared. The six gauge targets project onto the real basic-T (airspeed 548,295 · ADI 644,253 · altimeter 742,305 · HSI 645,373 · VSI 817,305 · EPR pair 180,203). With the HTML overlay hidden, the ADI changed 532 px at the top of its excursion and returned to **exactly 0 px** difference from its parked frame.
- Three real defects were found by validation and fixed, not worked around. (1) Every donor key table was being clamped; that is right for a calibrated dial but wrong for a two-key `ANIM_rotate`, which is a linear map — a twenty-degree ADI roll was capped at one degree and a ninety-degree HSI sweep at zero, so the sweeps ran invisibly. Joints now carry an explicit `range` and a test asserts every self-test produces real needle travel. (2) `advanceDc9SelfTests` used the raw frame delta, so one 1.5 s stall swallowed a whole 2.4 s sweep; the step is now clamped so a slow renderer plays the sweep slowly instead of skipping it. (3) `setPointerCapture` ran before the hold started, so a pointer that cannot be captured stopped the control moving; the hold now starts first, capture is best-effort, and drifting off a held button no longer releases it.
- Two of the new e2e specs initially failed against correct code and were corrected rather than the code weakened: one sampled the 80 ms-throttled readout before it had caught up to the levers, and one asserted the final checklist tick — which can never be observed, because latching the last movement ends the stage and unmounts the panel that would show it. The latter now asserts the handoff instead.
- Measurement note for the next person: software rendering runs this cockpit at ~3 fps, which misleads naive browser checks — throttled readouts lag the true control position and screenshots can land entirely outside a short animation. The `data-dc9-self-test` canvas dataset (reporting the live sweep without depending on screenshot timing) and hiding `.dc9-chapter` before capture are what made the numbers above trustworthy.
- Persistence: schema 13 with a forward migration. A pre-13 save that had already passed a stage is not sent back to repeat it — route evidence counts the control check as done, and any shutdown progress counts the scan as done — while a save paused mid-sweep or mid-scan reloads exactly where it was.
- Full Playwright suite: **53 passed, 3 failed, 1 skipped** on the first run — the three failures were the pre-existing DC-9 specs that assumed the old opening (route-record staging, model-failure fallback, and the whole-journey walk-through). All three were updated to the new flow rather than relaxed: the journey test now plays the control sweep and the instrument scan as a player would, and the camera-staging test additionally asserts that the scan keeps the panel framing and projects six gauge targets before the overhead shutdown view. Re-run green, and the whole suite then finished **56 passed, 1 skipped, 0 failed, 18.1 m, exit 0** (57 tests, up from 52 before this work).
- Responsive and reduced motion, measured at 1440x900, 768x1024 and 375x812: no page-level horizontal scroll and zero page errors at any width; the panel becomes a bottom sheet under 900px with the hold buttons stacked one per row and the 3D gauge targets hidden in favour of the list. Under `prefers-reduced-motion: reduce` the controls still travel (full aft in 400 ms) and latch, while the needle self-tests are skipped. One layout fix came out of this pass: the standing "what to do next" instruction was below the fold, and now sits above the controls where it is always visible.
- Open: owner review. Approval gate 1 (DC-9 Final Flight Log opening proof) is reopened because the chapter's opening beat changed. The `GREYBOX` label stays until the owner clears it. No push before owner approval.

## 2026-08-19 Airbus live weather radar and rebuilt storm exterior

Plan: `plans/0033-airbus-live-radar-storm-visuals.md`. Airbus gameplay/presentation only. No Blender source, GLB, asset report, persistence schema, reward, or non-Airbus file changed.

### Live radar

- `deriveAirbusWeatherField` previously took only `{scenario, checkpoint, elapsedSeconds, intensity, seed}` — no aircraft term at all, so **banking the sidestick moved no return and no gap line**. The only player-driven radar change was the scan-range cycle. A new pure `src/game/airbusOwnshipTrack.ts` supplies a heading offset and a closure distance; cells and the gap now rotate by the same offset and close radially.
- Heading needs no new integrator: cross-track is `∫ sin(bank)·0.2 dt` and turn rate is also proportional to `sin(bank)`, so heading is exactly proportional to cross-track travelled since the checkpoint began. Closure does need state, because it depends on thrust, so `trackDistanceNm` joins `StormLineAircraftState`.
- Measured response at Storm Core: turning to a −21° heading swings the gap from −24° to −3° and shifts every cell bearing by the same +21°, with the cell-to-gap geometry unchanged by construction. The WEST answer and the MID range answer are untouched.
- Three defects fixed on the way. (1) `hashSignature` included the gap bearing, so a live gap would have changed the field signature every frame and reset the radar continuously; the signature is now field identity only. (2) A return whose cell rotated out of the ±70° fan could never be repainted and left a permanent ghost at its last bearing; returns outside the fan plus a 6° margin are now dropped. (3) The sweep was advanced with the 12 Hz weather-snapshot clock rather than the live scenario clock, so it stalled on frames where the two throttles disagreed; `shouldResetAirbusWeatherRadar` now takes the live clock explicitly so a lagging snapshot is not read as a retry rewind.

### Storm exterior

- Rebuilt after the owner asked for it to be "really top tier". Cells are convective towers of 15–29 instanced sprites placed on a golden-angle spiral through a tapered cylinder — wide turbulent base, pinched waist, sheared anvil — with a shade ramp from dark rain base to lit anvil, per-instance depth haze, full seeded roll and mirror, and billboarding. Previously 39 flat, never-billboarded cards sharing one material opacity, so near and far cloud were equally solid and a cell at 67° bearing rendered ~40% foreshortened.
- The horizon was 13.9° above eye level in both the sky shader (`direction.y - 0.24`) and the cloud layout (`distance * 0.24`), which parked the entire storm above the windscreen. Both biases are removed; towers now straddle the eye line. The undercast is ray-marched against a virtual deck plane inside the sky shader, which gives a horizon with no extra draw call — an earlier 560-unit undercast disc drew over the entire cockpit.
- Lightning was a `pointLight` only, which `meshBasicMaterial` clouds and a `ShaderMaterial` sky both ignore, gated by `elapsedSeconds % 19 < 0.12` evaluated inside a 12 Hz throttle that usually skipped the window. It is now a pure deterministic multi-stroke envelope sampled every frame (measured: three peaks per strike at 1.00/0.55/0.45, lit 5.9% of the time) driven into the sky uniform, the cloud uniform and the point light together.

### Three silent rendering failures

Each made the scene look wrong with nothing surfaced to the developer, and each was found by measurement, not by looking at screenshots.

1. **Raw `ShaderMaterial` wrote linear colour into an sRGB framebuffer.** It includes neither the tonemapping nor the colour-space chunk while `THREE.Color` converts hex to linear, so `#39464e` displayed as near-black and the whole atmosphere read as a dark void. Fixed with `#include <colorspace_fragment>` in all five fragment shaders.
2. **The cloud instance budget was duplicated and drifted.** The layout emitted up to 300 sprites while the renderer still sized its `InstancedMesh` and instanced attributes for 48, so only the first 48 — the leftmost cells — ever drew, and writes past the `Float32Array` end were silent. One exported constant now feeds both, guarded by a test.
3. **The sky fragment shader never compiled.** `flat` is a reserved interpolation qualifier in GLSL ES 3.0 and was used as a variable name, so the sky sphere rendered nothing and the scene background showed through. Every sky, horizon and undercast change made after that point was dead code. Caught by the existing `expect(consoleErrors).toEqual([])` assertion, not by inspection.

### Deliberate contract changes

- **Cloud budget raised from 48 to 340 sprites**, superseding the figure approved in `plans/0026`. The browser assertion now bounds it both ways (>120 and ≤340) so a silent under-draw fails as loudly as an over-draw. **This wants owner review.**
- **One existing unit assertion was replaced, not relaxed.** `keeps Engine-Out calm but spatially layered` required every cluster above a rising slope, which encoded the 0.24 horizon bias. It now asserts what was actually intended: fair-weather cloud is a shallow layer at and below cruise level, never a tower, and stays under a third of the storm's maximum height.
- `deriveVisibleGapBearing` searched ±12° unpenalised. With a denser sprite field it began choosing a bearing more than 5° from the one the ND prints, breaking the window-agrees-with-instrument contract that the browser suite asserts. The search is now ±4° with a drift penalty, and a unit test sweeps five seeds × five heading offsets × three checkpoints.
- `test.setTimeout` on the one production Storm Line test was raised from 480 s to 900 s. That is a wall-clock budget, not a correctness bound; see the performance note. The real cause of the earlier overrun was a harness race, now fixed: `if (await x.isVisible()) await x.click()` does not retry, so under a slow renderer the flight-controls toggle was skipped and every later hold-control lookup stranded until timeout. Replaced with a retrying `ensureFlightControlsExpanded` helper. No product assertion was weakened.

### Performance

Measured in the Playwright environment, which reports `SwiftShader` — a CPU rasteriser, not a GPU. The whole scene runs there at ~0.93 fps; hiding the entire atmosphere group gives 1.06 fps, so the weather is ~12% of frame time and the cockpit GLB dominates. Sweeping the cloud budget from 20 to 303 sprites moved the frame rate by less than 0.1 fps, so sprite count is not the constraint. Cells beyond ±62° of the nose are not built at all. **No GPU hardware measurement was taken, so no claim is made about real-device frame rate.**

### Results

- `npm run check`: ESLint, TypeScript, **405/405 Vitest across 32 files** (377/31 before), production build — all pass. `npm run assets:check` passes. `git diff --check` clean.
- Browser: `PLAYWRIGHT_PORT=4179 npx playwright test e2e/airbus-storm-line.spec.ts e2e/airbus-engine-out.spec.ts` → **12/12 passed in 9.3 minutes** against the real 38 MiB Airbus GLB, including both production-GLB tests and their zero-console-error assertions, which is what proves every shader compiles.
- New browser coverage in the Storm Line production test: holding Bank left drives `data-airbus-ownship-heading` negative and moves `data-airbus-weather-gap-bearing` in the matching direction, the ND gap and the world gap agree within 2°, the radar keeps painting returns through the turn, and the radar reset count stays ≤2 — the guard against a live gap bearing re-entering the field signature.
- Captures inspected at 1440×900, 768 and 375 px, plus a reduced-motion run: weather present at every width; reduced motion keeps the full cloud field while suppressing rain streaks and lightning.

## 2026-08-19 Airbus cockpit PFD bank-sign correction

- Owner feedback isolated a second sign inversion on the cockpit screen: both `drawPfd` and `drawEngineOutPfd` used `context.rotate(-bank)`, while the corrected Storm Line windshield path used the captain-control sign. Both PFD renderers now use the shared `airbusPfdHorizonRollRadians` conversion; the simulator input and aircraft physics were not changed.
- TDD red: the new PFD-sign test failed because the conversion did not exist. Green focused run: `src/scenes/airbusStormVisuals.test.ts` and `src/scenes/airbusWeatherRadar.test.ts` passed **15/15**.
- Production proof: `PLAYWRIGHT_PORT=4192 npx playwright test e2e/airbus-storm-line.spec.ts -g "production Airbus GLB renders Storm Line" --workers=1` passed **1/1 in 5.9 minutes** against the real Airbus GLB. It verifies Bank left and Bank right on the windshield and cockpit PFD after a neutral persisted reload, plus live radar returns, pause/resume, retry, and no console errors.
- Final repository check: `npm run check` passed lint, typecheck, **377/377 Vitest tests**, and build; `git diff --check` remains clean. No Blender source, GLB, or asset bytes changed.

## 2026-08-19 Airbus Storm Line bank and live-radar visual repair

- Corrected the Storm Line atmosphere adapter so positive aircraft bank (Bank right) produces positive horizon roll and negative bank (Bank left) produces negative roll. The PFD/game input contract remains unchanged; no GLB or Blender source was edited.
- Moved the ND radar fan from the lower clipped band into the readable upper portion of the captain display, while preserving the shared weather-field signature, sweep timing, bearing projection, range filtering, precipitation colors, gap line, and reduced-motion behavior. The runtime now exposes the selected-range visible-return count for browser evidence.
- TDD red: the new bank-direction test failed with the old inverted sign; the new radar display-band test failed before the geometry contract existed. Green focused tests: `npm test -- --run src/scenes/airbusStormVisuals.test.ts` (3/3) and `npm test -- --run src/scenes/airbusWeatherRadar.test.ts` (11/11).
- Browser proof: `PLAYWRIGHT_PORT=4187 npx playwright test e2e/airbus-storm-line.spec.ts -g "production Airbus GLB renders Storm Line" --workers=1` passed **1/1 in 5.8 minutes** against the rebuilt production GLB. It verified both signed bank directions, a nonzero selected-range radar return count, pause/resume, checkpoint retry, and no console errors. The corrected 1440×900 capture was inspected at `/tmp/airbus-storm-core-weather-radar-1440.png` and now shows the radar fan in-frame.
- An initial browser attempt reused a stale 4173 preview and a later attempt exposed only a test-harness control-toggle assumption; both were repaired without weakening product assertions. `playwright.config.ts` now accepts `PLAYWRIGHT_PORT` for deterministic local preview proof.

## 2026-08-19 Airbus active-simulator restart control

- Added a visible `Restart` button to the active Storm Line and Engine-Out top bars. It reuses the existing confirmed full-game reset, while `Retry this checkpoint/stage` remains local recovery and Hub `Replay` remains scenario-only replay.
- Added browser regressions for both active scenarios. The tests verify the button is visible and that accepting its confirmation returns to the opening **Start Game** screen.
- TDD red run: both new tests failed because the active HUDs had no `Restart` button. Green run: both passed. The focused non-production Airbus suites passed **10/10** with the new coverage, including pause/retry, keyboard/gamepad, and responsive 375/768 checks.
- `npm run check` passed ESLint, TypeScript, **374/374 Vitest tests**, and the production build. `git diff --check` passed. No Blender source, GLB, asset report, persistence schema, reward, or non-Airbus implementation changed.

## 2026-07-31 Airbus PR browser-smoke and asset-contract repair

- GitHub Actions run `30662072268` first cleared checkout and quality after CI was made independent of exhausted Git LFS bandwidth, then exposed six real Playwright failures. Four production-browser failures traced to the committed `airbus-captain.glb` missing the display, control-pivot, and Storm Flight camera nodes already required by the branch runtime. Two smoke failures traced to obsolete expectations that five-card qualification still completed Airbus by itself.
- Rebuilt the authoritative Airbus source with Blender 5.1.2 through `npm run asset:airbus`; no GLB was hand-edited. The deployable model is 39,884,100 bytes at SHA-256 `0a6c8aeb1e1fdbfc85db01becb812ca0c3b7810208d03fba65f26c4fa4306251`. It exports 164 selected objects and 163 `game_id` nodes, including all three live display surfaces, both nested sidestick pivots, the paired-thrust pivot, and the raised Storm Flight camera. `npm run asset:airbus:promote-gate` and runtime-gate validation passed.
- Updated the browser cache key to `storm-flight-0a6c8aeb`, made the model-failure route include query strings, and repaired the journey fixture so qualification opens the Simulator Hub while only completed Storm Line, Engine-Out, and all four schema-12 workload tasks open `POP T CAPTAIN MODE COMPLETE`.
- Exact failed-case reruns passed: reordered journey and card recovery 2/2; production A320 load/placement 1/1 in 1.5 minutes; Engine-Out live displays/control response 1/1 in 2.5 minutes; ND/ECAM real-mesh interaction and drag rejection 1/1 in 2.6 minutes; Storm Line production displays/controls/responsive views 1/1 in 4.5 minutes; and model-load failure/retry 1/1.
- `npm run check` passed ESLint, TypeScript, 24 Vitest files / 238 tests, and the production build. `npm run assets:check`, `npm run pipeline:evals` (6/6), and `git diff --check` passed. Existing imported-source scale/metadata notices and informational unused-UV/empty-node glTF notices remain recorded; the validators reported no Airbus glTF errors or warnings.
- No Tesla/Model Y, Flight Mode, reward, locker, DC-9, or Mars implementation file changed in this repair. Owner play/visual approval remains a separate gate from CI correctness.

## 2026-07-30 Airbus interactive captain workload — owner visual gate open

- Added four required-but-forgiving in-flight captain tasks after the mandatory five-card qualification: fictional ND range `MID`, western weather-gap confirmation, upper-ECAM training-event acknowledgement, and right-side SAFE RETURN selection. Every task works through the Blender-authored cockpit display and an equivalent native HTML button. Wrong choices increase only task-local coaching; unfinished tasks hold the next stable simulator boundary without failing the flight or erasing progress.
- Schema 12 stores task completion, task-local attempts, scan range, and the last weather/Safe Return selection. Focused migration coverage proves schema 11 upgrades, corrupt schema 12 data cannot bypass progression, completed tasks survive retry/reload, and explicit replay resets only the selected scenario.
- The captain ND now renders fictional `RANGE 20`, `RANGE 40`, and `RANGE 80` views with range-filtered returns, cyan active outlines, amber wrong selections, and green confirmations. The upper ECAM renders `ACK REQUIRED` and `TRAINING EVENT ACKNOWLEDGED`. All screens retain `SIM — NON OPERATIONAL`.
- A dedicated display raycaster targets only the existing captain ND and upper ECAM surfaces while the relevant task is active. A pointer gesture must move less than six pixels to dispatch, so camera drags do not accidentally answer a task. The real-GLB workload test proved a 12-pixel ND drag did nothing, then completed the ND and ECAM tasks through actual mesh clicks. Final west-sector and right-corridor mesh hits were also exercised in the connected production Brave session; the canvas reported exact `selectWeatherSector/west` and `selectSafeReturn/right` actions and schema 12 stored both confirmations.
- `npm run check` passed full lint, TypeScript, 238/238 Vitest tests, and the production build. `npm run assets:check` passed with the existing glTF informational notices. The focused workload suite passed 4/4 Chromium cases in 3.9 minutes; the Engine-Out suite passed 5/5 in 3.1 minutes after its diversion fixture was updated to make the newly required right-corridor decision.
- The Storm Line suite passed all four native cases. Its production-GLB case was externally terminated with exit 143 three times, including an isolated debug run, before returning an assertion result. A later Playwright sector-proof rerun was terminated by the same external browser cleanup, so the final two physical-sector checks were completed against the already-open Brave production session instead. The terminated cases are not recorded as passes. The overlapping production boundary is covered by the earlier green real-GLB workload case plus the exact live Brave ND-sector actions.
- Inspected production captures are tracked under `preview-renders/airbus-workload/`: Storm Entry `RANGE 40`, Storm Core west-gap confirmation, Engine Recognition acknowledgement, Engine Diversion right SAFE RETURN, and native 375/768/1440 layouts. The first 768 capture exposed a topbar/task/instrument overlap; the tablet topbar was compacted and the task/instrument row moved below it. The final geometry test proves no horizontal overflow or overlap among the topbar, task, instrument mirror, and control deck at all three widths.
- No Blender source, deployable GLB, Tesla/Model Y, Flight Mode, reward, locker, DC-9, or Mars implementation was changed for this workload milestone. Owner play/visual approval remains open.

- Tesla/Model Y gameplay and assets were not changed by this milestone. Vercel preview `dpl_8ueJ8NdvyWcJTx2FBom8vcpPMggi` is `READY` at `https://cockpit-escape-room-iztt8224x-ottoagent007-gmailcoms-projects.vercel.app`; authenticated checks returned HTTP 200 for the 581-byte app shell and 39,884,060-byte Airbus GLB. The preview retains team authentication because the disconnected Vercel app could not issue a temporary public share URL.

## 2026-07-29 Airbus Storm Line simulator — owner visual gate open

- Evolved Airbus A320 Pop T Captain Mode into the 2:45 **Storm Line**
  fictional simulator. Players manually control pitch, bank, and paired thrust,
  choose the safer western corridor, recover through checkpoint-local retries,
  and earn Calm Control, Weather Judgment, and Energy Management traits.
  Keyboard, standard gamepad, native HTML hold controls, pause, opt-in
  soundscape, reduced motion, reload, no-WebGL fallback, and the retained
  skippable five-card familiarization are covered. Existing completion and
  reward handoff behavior is preserved.
- Persistence is schema v9. Focused unit coverage proves fixed-step
  determinism, storm progression, corridor choice, control/energy failures,
  checkpoint recovery, traits, v8 migration, corrupt-v9 normalization, and
  preservation of already-completed Airbus/reward progress.
- Rebuilt the authoritative Blender 5.1.2 source and deployable Airbus GLB with
  three semantic PFD/ND/ECAM display surfaces, nested captain sidestick
  roll/pitch pivots, and one paired-thrust pivot. The accepted GLB is
  39,883,148 bytes at SHA-256
  `9e747fcdf36cbf6fbac475997423d3805bd6681a2be316d14523daface29b82c`;
  it contains 163 selected objects, 162 `game_id` nodes, 13 materials, and 10
  textures. No destructive optimization was used.
- The first actual-browser visual gate correctly rejected an export whose new
  display/control nodes inherited stale world matrices and appeared at the
  origin. Updating Blender's view layer before reparenting repaired the source
  cause. A later 375 px capture exposed viewer tools covering Decrease thrust,
  and the 1280×720 smoke path exposed a status-dock/drop-zone pointer overlap;
  both layout defects were repaired and their focused browser paths passed.
- Inspected actual-browser captures from the production GLB are tracked at
  `preview-renders/storm-line/airbus-storm-line-{1440,768,375}.png`. The final
  images show live cockpit-mounted PFD/ND/ECAM graphics, an unobstructed control
  deck, and preserved captain-seat composition.
- `BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm
  run asset:airbus` passed source preparation, validation, preview rendering,
  export, and glTF inspection. `npm run asset:airbus:promote-gate`,
  `npm run assets:check`, and `npm run pipeline:evals` passed. `npm run check`
  passed ESLint, TypeScript, 138/138 Vitest tests, and the production build.
- Bounded Chromium runs account for all 40 selected cases: Airbus Storm Line
  3/3, locker 6/6, reward 6/6, viewer controls 3/3, and smoke 22/22 with its
  capture-only owner-evidence case intentionally skipped. A monolithic attempt
  was externally terminated after seven green cases without an assertion
  failure; the slower real-asset cases and every remaining case passed in
  bounded runs. The one genuine smoke failure was reproduced, repaired, and
  passed on an exact fresh-build rerun.
- The branch is `agent/airbus-gameplay-evolution`, created from
  `origin/main` commit `7252c2c`. No Tesla/Model Y implementation or asset file
  is part of this milestone.
- Vercel preview deployment `dpl_Cqcac6J4JoyBbEtEKdQgYoN34aQM` reached
  `READY` at
  `https://cockpit-escape-room-mg2122811-ottoagent007-gmailcoms-projects.vercel.app`.
  Authenticated requests returned HTTP 200 for the app and Airbus GLB; the
  deployed model is 39,883,148 bytes and its SHA-256 exactly matches local.
  The connected share-link helper returned 403 for this protected deployment,
  so owner access remains subject to Vercel authentication. Owner visual/play
  approval remains open.


## 2026-07-30 Airbus Simulator Hub and Engine-Out Handling

- The mandatory five-card Airbus qualification now opens a two-card Simulator Hub. Storm Line is ready first; completing it returns to the Hub and unlocks Engine-Out Handling without completing Airbus. Engine-Out completion records its debrief traits and completes Airbus while the existing reward remains locked until the player explicitly continues.
- Engine-Out is a deliberate, fictional, non-operational cruise-training exercise with deterministic Recognition, Stabilization, and Diversion stages. Pitch, bank, paired thrust, and directional balance share one normalized keyboard/gamepad/native-control contract. Five cumulative unsafe seconds retry only the active stage, and replay starts from the opening checkpoint while preserving best traits.
- Schema 11 migration preserves old completed/reward saves, keeps both scenarios replayable, and safely normalizes corrupt Engine-Out progress without erasing qualification or completed Storm progress. A browser-discovered regression now proves an in-progress Engine-Out reload restores the focused captain camera.
- The production Airbus cockpit renders scenario-aware PFD, ND, and ECAM screens inside their physical bezels, live sidestick/thrust response, restrained heading/bank motion, and a SAFE RETURN corridor that appears outside the windshield only during Diversion. All operational-looking copy remains explicitly simulator/training-only.
- `npm run check` passed ESLint, TypeScript, 195/195 Vitest tests across 20 files, and the production Vite build. `npm run assets:check` passed the current deployable assets, and `git diff --check` passed.
- `npx playwright test e2e/airbus-storm-line.spec.ts --project=chromium` passed 5/5 in 2.3 minutes. `npx playwright test e2e/airbus-engine-out.spec.ts --project=chromium` passed its four then-current cases in 2.5 minutes, including the real 38 MiB Airbus GLB; the subsequently added clock-controlled Diversion completion case passed 1/1 in 17.5 seconds.
- Browser coverage proves qualification gating, Hub unlocks, keyboard directional response, gamepad normalization, native controls, pause/resume, focused failure/retry, durable reload, reduced motion, full Diversion completion, and no early reward unlock. The 375 px geometry gate verifies the instructor panel, telemetry, viewer tools, and control deck do not overlap and every hold control stays inside the viewport.
- Inspected 1440×900 owner-gate evidence is tracked at `preview-renders/airbus-scenarios/airbus-simulator-hub-1440.png`, `airbus-engine-out-briefing-1440.png`, and `airbus-engine-out-recognition-1440.png`. Inspected 768×900 and 375×812 captures remain local validation evidence. The milestone is automated-check complete and awaits owner visual approval.
- Tesla/Model Y gameplay and assets were not changed by this milestone. No Vercel preview was published.

## 2026-07-27 Legacy Hangar visibility, source replacement, and Replay — owner approved

- Replaced the featureless procedural hangar walls with the owner-selected
  Sketchfab `Hangar` source by nermin under CC BY 4.0. The exact 8,276,403-byte
  archive is preserved at SHA-256
  `8ec631f27e40f6f1f3ac3448c96374c315a4874f2c8e4bdbe307f284fdf6e1fe`;
  license, creator, source URL, geometry, materials, textures, four inspection
  views, and normalization evidence are recorded in
  `asset-reports/model-y-hangar-source-intake.json`.
- The source is a closed Quonset exterior. The first 17 m interior attempt
  intersected the diagonal camera, so the intact shell is scaled to 24 m wide
  and 34.3 m long around the car, apron, lights, and desktop/narrow camera
  family. Seven source materials are deterministically remapped into one 2048
  atlas. The runtime keeps all 9,640 hangar triangles while the complete reward
  remains within budget at 215,212 triangles, six materials, and 20 draw calls.
- The Blender master is 22,082,575 bytes at SHA-256
  `6aee4a6694f025779aa11b61ba2e9b6816d844d2ea7a3756c45dd96a45455e1a`.
  The deployable GLB is 22,873,044 bytes at SHA-256
  `53b51f9a4cb600e0487eeb3268795ea59a8f93d3699a6401a10e950d5c94d7a7`.
  Blender source validation passed with the five expected stowed-pivot scale
  warnings; glTF validation and reimport passed.
- Flight Mode wing and stabilizer panels now use a red-dominant metallic
  finish, while fan housings, rotors, hinges, and concealed mechanisms remain
  dark. Desktop rendering uses a procedural showroom environment plus a
  rebalanced key/fill setup and narrower text scrim; no HDR or production
  dependency was added.
- Replay now resets and restarts the clamped Blender `AnimationAction` before
  the new clock seeks from zero. The regression requires stowed pose after
  Replay and deployed pose at `11.500` after the second completion.
  Reduced-motion presentation remains immediately deployed and no longer
  offers an inert Replay control.
- The focused contract test passed 6/6. The first real-browser run exposed a
  production-preview readiness timeout for the new 22.9 MB GLB; instrumented
  Chromium proved HTTP 200, exact 22,873,044-byte delivery, no page error, and
  ready state at about four seconds. Real-model readiness assertions now allow
  15 seconds without weakening pose or interaction checks.
- The evidence run also exposed a pointer-actionability race on the second Skip
  while the real-time 11.5-second control was being removed. The final proof no
  longer skips the Replay: it observes stowed pose and then waits for the second
  run to reach its natural `11.500` deployed completion. The six-case reward
  file passed in 1.2 minutes.
- Broad validation passed: `npm run check` (lint, typecheck, 125/125 unit tests,
  production build), `npm run assets:check`, 6/6 pipeline evaluations, and
  `git diff --check`. The complete browser matrix passed all 36 executable
  cases, with its one capture-only case intentionally skipped. Because the
  command harness sends SIGTERM to long foreground jobs, identical serial
  Playwright settings were split into bounded groups; the isolated 42 MB locker
  and DC-9 model cases passed in 2.0 and 2.1 minutes.
- Fresh actual-browser evidence is tracked at
  `preview-renders/model-y-reward/{1440-static-reveal,1440-flight-mode-final,768-flight-mode-final,375-flight-mode-final}.png`.
  The vehicle, `POP T` plate, selected hangar interior, and red Flight Mode
  surfaces are readable. The owner approved the composition after both white
  decorative floor guide meshes were removed; the asset contract now rejects
  either guide node if it returns.

## 2026-07-26 TMB2 Productions approved-logo ident — owner visual gate open

- Owner follow-up: reduced only the generated `PRODUCTIONS` caption to 50% in
  both axes. Its alpha bounds changed from 131x15 at
  `[95,164,226,179]` to 66x8 at `[127,168,193,176]`; its gold/shadow
  treatment, center, fade timing, approved TMB2 artwork, and all other intro
  behavior remain unchanged. The new 642-byte caption SHA-256 is
  `d50b44997a07f0dc1f7d1aacdae49d4193b240bfcae3f7c9eff9d5428564e2fc`.
- The alpha-bounds regression failed against the prior committed caption, then
  passed after the one-pixel cell/tracking rebuild. The final probe decodes the
  RGBA PNG with Node built-ins, so clean GitHub quality runners do not require
  an undeclared Pillow installation. `npm run assets:check` passed the
  unchanged 74-asset/17-preload contract. Fresh-build Chromium capture passed,
  as did the three focused request/retry/reduced-motion checks. All four
  responsive captures were regenerated and inspected with the half-size
  caption present, centered, readable, and clear of controls.
- PR #54's pre-follow-up `browser-smoke` run exposed a pre-existing Model Y
  reward test race that also failed on the unchanged `main` merge run. The test
  tried a Playwright pointer click while the real-time Skip control was being
  removed, then required Replay to be observed only during its first
  1.2-second stage. The repair uses the already-focused keyboard path for Skip
  and Replay, requires the replay clock to return below five seconds, and
  accepts any active replay stage while still requiring the Skip control. The
  focused CI-style case passed three consecutive runs with retries disabled;
  the complete CI-style browser suite passed 36 executable cases in 6.6
  minutes with the capture-only case intentionally skipped.
- Replaced the procedural `T`, `M`, `B`, and `2` Canvas glyphs with the exact
  owner-approved `TMB2logo.png` authority and added centered restrained-gold
  `PRODUCTIONS` beneath it. The existing 53.04-second clock, blue assembly,
  gold-white highlight, Start inputs, sound controls, spoiler rules, and
  650-millisecond DC-9 handoff remain unchanged.
- The 811,581-byte 1659x948 source and runtime copy are byte-identical at
  SHA-256
  `673d13b96bc19b35b508630d1d662d16672ac4bb6ad665a7f6b1b7cee992ce17`.
  Deterministic blue, base, highlight, and Productions layer hashes are recorded
  in `asset-reports/tmb2-intro-assets.json`; the package now contains 74 assets
  and 17 preloads.
- Focused TDD covered source drift, missing layers, runtime registry/decode
  order, image-backed command thresholds, exact-source fallback, and the
  complete reduced-motion pose. TypeScript and focused unit checks pass.
- Focused Chromium checks prove all five logo requests, non-background pixels
  inside both logo and Productions bounds, exact failure/retry reporting,
  reduced motion, and responsive bounds. Five fresh-browser capture repeats
  passed after serializing the nine-image opening decode gate; instrumentation
  had shown Chromium intermittently resolving all five logo images while
  leaving the four existing large story sheets pending under concurrent
  `decode()` calls.
- Actual-browser proof was inspected at
  `preview-renders/tmb2-productions-ident/ident-{1440x900,768x900,375x812}.png`
  and
  `preview-renders/tmb2-productions-ident/ident-reduced-motion-375x812.png`.
  The exact logo is recognizable and uncropped, Productions is centered and
  subordinate, controls do not overlap, and the reduced-motion pose is complete.
- Full local validation passed: two consecutive `npm run asset:tmb2-ident`
  rebuilds produced identical hashes; `npm run assets:check` passed the
  74-asset/17-preload contract with only documented existing GLB notices;
  `npm run pipeline:evals` passed 6/6; and `npm run check` passed ESLint,
  TypeScript, 121/121 Vitest tests, and the production build.
- A monolithic single-worker Chromium run reached 29/29 executed cases green
  before the command session was externally terminated with exit 143 after
  roughly four minutes. The five unreached smoke cases then passed 5/5 in 2.2
  minutes, and the remaining viewer-control file passed 3/3. Across those
  bounded runs all 36 executable cases passed; the 37th evidence-refresh case
  is intentionally skipped unless `CAPTURE_TMB2_IDENT=1`, and its flagged
  five-repeat run passed 5/5.
- Vercel preview deployment `dpl_3YadJHKb7X3eodXtmAHnbVS8Q3u2` reached
  `READY` at
  `https://cockpit-escape-room-74mtq68zd-ottoagent007-gmailcoms-projects.vercel.app`.
  Authenticated requests returned HTTP 200 for the app and all five ident
  files. Every deployed ident file is byte-identical to the committed asset;
  the deployed JS and CSS hashes also match the local production build.
- The connected Vercel share-link flow returned 403 for this protected
  deployment, so a second browser capture directly from the preview was not
  available. The owner-review images are actual local Chromium captures, and
  deployed byte equality proves the preview serves the same renderer and
  artwork. Owner visual approval remains open on the preview.

## 2026-07-26 Locker hat and Airbus target-placement polish — owner visual gate accepted

- Created `agent/locker-airbus-placement-polish` from clean `origin/main` commit `08b0843`; no unrelated TMB2 branch changes were carried over.
- Raised the Blender-authored captain's hat root from Z `2.92` to `2.94` and moved only its close-focus target from Y `1.00` to `1.02`. The visible mesh and exported collider remain under `LOCKER_PROP_CAPTAINS_HAT`.
- Moved the Airbus Radio target family to `(-0.045000, -0.464842, 0.011798)` and, after owner-directed desktop review, moved Thrust to the accepted `(0.025000, -0.505764, 0.004800)`. Pivot, cue, hitbox, stable names, and `game_id` values remain aligned; all other Airbus targets and gameplay contracts are unchanged.
- TDD red proved the old locker GLB/report/camera values and old Airbus GLB/status/projection values failed the new exact contracts before source edits.
- Rebuilt through the supported Blender 5.1.2 commands. Locker GLB: 44,288,740 bytes, SHA-256 `0ab0062470ec4eb1230d288761f95581e38e277ad11e97998ebcd5c94e492f56`. Final owner-approved Airbus GLB: 39,878,692 bytes, SHA-256 `4c44468fe3d492e3839407f97c8d7b7286a295f12df1ee376425ee32df55621f`.
- `npm run assets:check` passed. The focused production Airbus test passed projected-position assertions and real canvas clicks; the focused real-GLB locker test passed the hat focus, hold, persistence, and Airbus handoff path.
- Opt-in actual-browser evidence capture passed at 1440x900, 768x900, and 375x812 for both scenes. Inspected frames are tracked under `preview-renders/placement-polish/`; the final Airbus 1440 frame carries the accepted rightward Thrust composition. At 768/375 the native card controls remain readable without page overflow, while the documented narrow-camera crop keeps Thrust outside the visible cockpit frame.
- Local no-cache HTTP checks returned exact GLB byte counts and hashes. After rebasing onto `origin/main` `900b471`, `npm run pipeline:evals` passed 6/6; `npm run check` passed lint, TypeScript, 122/122 Vitest tests, and production build; full `npm run test:e2e -- --workers=1` passed 36 executable cases with one intentional capture-only skip in 6.4 minutes; Python compilation and runtime-gate validation passed.
- Full-diff review found and repaired the stale manual locker cache key. A new hash-bound `assets:check` assertion failed against `locker-seams-cf212389`, then passed with `locker-shelf-0ab00624`; `npm run check` and the real-locker case passed again after the repair.
- Final rebased owner-approved Vercel deployment `dpl_DMobaCFK1haNNAaunEPUifm2b5dG` reached `READY` at `https://cockpit-escape-room-kdno3fzlf-ottoagent007-gmailcoms-projects.vercel.app`. Authenticated checks returned 200 for the loader; deployed Airbus and locker GLBs match the final local SHA-256 values, and the deployed loader contains `locker-shelf-0ab00624`.
- The owner accepted the 1440 composition on 2026-07-26. Radio and Thrust now export `verified_browser_1440_captain` plus `preview-renders/placement-polish/airbus-radio-thrust-1440.png`; the promoted runtime-contract gate validates.

## 2026-07-26 Model Y hangar and Flight Mode reward — owner visual gate open

- Replaced the reward-phase DC-9/red-box greybox with a dedicated, spoiler-protected hangar that lazy-loads only after DC-9, locker, and Airbus completion. The real red owner-supplied car carries a readable `POP T` plate; visible Mars controls and the proxy sphere are removed, while legacy Mars saves recover safely to the reward.
- Deterministically imported `/mnt/2TBHDD/Downloads/red electric car 3d model.glb` at source SHA-256 `d88769d9c66bdeca46bf239c9baa2a295afc82ffb24005733d9374b9c7782bee`. The source gate records 480,305 triangles, one material, and three wired 4096 maps.
- Generated `art-source/blender/tesla_reward.blend` at 14,785,786 bytes, SHA-256 `3f51c4ce8b44bf673e3f2b55e3ebc9795cee56e83f9f2599263db8477f12e805`, and `public/models/model-y-reward.glb` at 15,359,004 bytes, SHA-256 `4f4ebc095f5a4ea5ba4ab0480a7d99596171abf5663d0ac45a483934e02c5250`.
- The runtime asset contains 180,000 vehicle triangles and 205,644 total triangles, eight materials, 25 draw calls, three packed 2048 maps, stable vehicle/door/plate/flight-kit/camera nodes, and one exact 11.5-second `TESLA_FLIGHT_MODE_REVEAL` action. Blender source validation records five expected stowed-pivot scale warnings; deployable glTF validation has no errors or warnings.
- The browser plays only Blender-authored transforms and supports captions, native keyboard focus, Skip, Replay, exact final-frame seeking, reduced motion, reload, retry, and an accessible non-WebGL presentation. A failed GLB cannot erase journey progress or hide the final tribute.
- Desktop uses the live authored camera. At 768 and 375 pixels, deterministic 768x900 static/final renders from the same Blender master preserve a recognizable vehicle and wing pose without horizontal overflow; the protected GLB and timeline remain loaded and authoritative.
- `BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:tesla` passed deterministic build, source/master validation, export, tangent repair, glTF validation/reimport, budget checks, and preview rendering.
- `npm run assets:check` passed all deployable assets and both Model Y portrait images. `npm run pipeline:evals` passed 6/6.
- `npm run check` passed ESLint, TypeScript, 118/118 Vitest tests, and the production build.
- `CAPTURE_REWARD_EVIDENCE=1 npm run test:e2e -- --workers=1` passed 36/36 Chromium tests in 6.7 minutes, including spoiler protection, actual stowed/deployed transform checks, reduced motion, failure/retry/fallback, legacy-save recovery, complete reordered journey, and both existing production cockpits. The focused reward keyboard-focus follow-up passed 1/1.
- Actual browser evidence is tracked under `preview-renders/model-y-reward/`: 1440 static/final, 768 final, 375 final, and accessible final captures at all three widths. These are implementation proof, not owner approval. The owner must still approve the vehicle likeness, hangar composition, articulated Flight Mode design, and final tribute presentation on the Vercel preview.
- Vercel preview deployment `dpl_FQX8oiDxf8exjmvcnqWRuFjiXRdk` reached `READY` at `https://cockpit-escape-room-g8dj4nuho-ottoagent007-gmailcoms-projects.vercel.app`. Authenticated deployment checks returned HTTP 200 for the app and `/models/model-y-reward.glb`; the deployed GLB is 15,359,004 bytes and its SHA-256 exactly matches the validated local artifact.

## 2026-07-20 authoritative TMB2 cinematic restoration — owner visual gate open

- Supersedes the generic layered-image result below without rewriting its historical evidence. The current implementation follows the owner-supplied 53.04-second contract: blue pixel-built TMB2 ident, duffel struggle, living-key escape, runway near miss, ballpark slide, finance/bull collision, sky/glide/catch, victory joke, key tug, and pixel-loop reset. There are no visible scene titles or cockpit spoilers.
- Playback is media-clock driven at native 320 x 224 with integer nearest-neighbor scaling. Recovered PNG sprite frames—not independently looping WebP previews—drive Pop T and the cartoon key with authored frame durations and stable pivots. **PRESS START** latches at exactly 6.000 seconds; pointer, Enter, Space, and controller Start trigger a 300-millisecond audio fade and 650-millisecond key-lock/DC-9 handoff exactly once.
- Focused unit evidence passed 32/32 tests across timeline, animation, runtime, assets, geometry, and renderer. Focused Chromium evidence passed 11/11 tests across exact scenes/loop, art retry, input containment, sound retry, all four Start inputs, reduced motion, integer scales, and 53.040-second audio. ESLint, TypeScript, and `git diff --check` passed at the Task 4 checkpoint.
- The corrected asset manifest contains 69 recovered/audited files and 12 package preload entries. The Canvas registers 15 rendered PNG images total, including three pre-existing Pop T sheets outside the recovered package, and gates startup on only four opening images. The historic 104-audited/52-preload contract is recorded as unrecovered; no synthetic files or false counts were added.
- Browser proof: `preview-renders/tmb2-cinematic-restoration/intro-proof-1440x900-4fps.webp` is a real 1440 x 900 screenshot-based animated capture sampled at 4 fps across the uninterrupted intro (248 samples, 244 encoded frames, zero capture failures). `handoff-contact-1440x900.png` proves the rotating key/flash transition into the actual preloaded DC-9. The native GPU WebM attempt was rejected because it recorded a dark Canvas surface and is not retained as approval evidence.
- Fresh final gates passed: `npm run check` completed ESLint, TypeScript, 99/99 Vitest tests, and the production build; `npm run assets:check` passed the 69-asset/12-preload contract; and `npm run test:e2e -- --workers=1` passed 30/30 Chromium cases in 6.4 minutes. The first broad run found one stale complete-journey expectation for the removed **Skip Intro** control and model-request contention in that `skip3d=1` harness; after routing the irrelevant GLB request away and using the authoritative six-second **PRESS START** handoff, the focused journey passed 1/1 and the fresh full rerun passed 30/30. Owner motion/look approval remains required before pushing the replacement visual revision to draft PR #51.

## 2026-07-20 TMB2 intro recovery and layered Pop T chase visual gate

- Preserved the complete recoverable TMB2 source set under `art-source/intro/tmb2`: all 20 downloaded PNGs (18 unique files plus two byte-identical duplicates), both storyboards, the original 70,814-byte Pop T ZIP, and all 43 extracted archive files. The authoritative blonde-haired Pop T storyboard is 1,672x941, 2,109,024 bytes, SHA-256 `0f9b2fed22597380c926028d39bf1c33470b32c42a7a59bbba335f1642f8b7d2`.
- Built a hash-bound runtime package with 69 assets and 17 exact preloads. It contains five environments, 17 normalized cartoon-key poses, and six recovered Pop T clips. `public/images/intro/tmb2/tmb2-intro-assets.json` is SHA-256 `3f63ce16a46956091585f5df4c5556781d59c4d401d25df0b83909e9b4439d2c`; the package contact sheet is SHA-256 `0bc45be8caf496abc900f17a42ab2a2d9cded99c75c0b0c845ff0bbb61a050b1`.
- GameDevStuff was used only as pinned build tooling at commit `22722eabc8f09a706013305a0911a9d322ca9f4f`; its test suite passed 357 tests with one platform skip under the required private umask. Pixel Snapper release `pixel-snapper-v1.0.0-commit.5743009` was verified at SHA-256 `bd03110406efc2efc0b094c0442a2265cb44f935a3f418fc30fdc20e77eb3f96`. CockpitEscapeRoom owns every byte needed at runtime and does not read GameDevStuff, Downloads, or `.cache` to serve the intro.
- ImageGen supplied only the missing character-free duffel terminal, ballpark, fictional finance city, and cloud chase plates. Their exact prompts, dimensions, source/runtime hashes, and visual reviews are recorded in `asset-reports/tmb2-intro-assets.json`; no protected reward, aircraft emergency, readable branding, character, or key was introduced into those backgrounds.
- Replaced the six-beat placeholder with the authoritative eight-beat 53-second sequence: TMB2, oversized duffel, safely parked runway chase, ballpark detour, bull-market launch, cloud chase, catch, and mission-ready title. The existing Start Game entry, audio clock, mute, volume, retry, Skip Intro, Escape, silent fallback, one-shot DC-9 handoff, progress rules, and reward spoiler protection remain intact. Each visual beat has a screen-reader story summary and all required actions remain native HTML controls.
- `npm run check` passed: ESLint, TypeScript, 73/73 Vitest tests, and the Vite production build. `npm run assets:check` passed the 69-asset/17-preload TMB2 contract; existing nonfatal GLB notices were unchanged. `npm run test:e2e -- --workers=1` passed all 26 Chromium tests in 5.1 minutes, including asset decode boundaries, failed-plate fallback, natural/repeated completion, audio rejection/retry, keyboard Escape, volume/mute, 375/768/1440 bounds, reduced motion, the complete reordered journey, and both production cockpits. `git diff --check` passed.
- Durable actual-browser evidence is under `preview-renders/tmb2-intro-recovery/`: `01-boot-1440.png` through `08-title-1440.png`, `09-clouds-reduced-motion-768.png`, and `10-ballpark-narrow-375.png`. All ten captures were visually inspected; no horizontal overflow, console error, page exception, failed request, or HTTP error was recorded.
- A separate keyboard-only browser pass reloaded before starting, activated Start Game with Enter, traversed Mute intro, Intro volume, and Skip Intro in order, exercised them with Space, ArrowLeft, and Enter, and reached the DC-9 handoff.
- Remote commit `a69dba8e83edfa17c406e26d3e76c61ffe961111` matched the pushed branch and exact Git object identities for the source vault, runtime package, reports, license record, and plan. A detached clean checkout of that remote commit passed `npm ci`, `npm run assets:check`, the 11 focused intro/asset tests, and `npm run build` with a clean status and no shipped dependency on Downloads or `.cache`.
- Draft PR [#51](https://github.com/otto-agent007/CockpitEscapeRoom/pull/51) carries the complete milestone and visual proof. Owner visual approval and the Vercel preview gate remain open. The existing 53.040-second owner-supplied audio remains a private-use placeholder and is not licensed for standalone redistribution.
- Before final handoff, current `main` added the independent Airbus radio/thrust alignment milestone and an earlier three-sheet TMB2 Canvas animatic. The conflict resolution retains the newer Airbus source/GLB/tests, makes this recovered 69-asset sequence the intro authority, removes only the superseded Canvas/runtime code, and preserves its three sprite sheets under `public/images/intro/popt`. On the resolved combined tree, `npm run check` passed 73/73 tests and the build, `npm run assets:check` passed, and the full 26-case Chromium suite passed again in 6.3 minutes including the new Airbus target assertions.

## 2026-07-20 TMB2 draft-PR Chromium validation

- Draft PR #49 published the reviewed 19-file intro tree at GitHub commit `b5b89a3f297920c030f13476699346510d13591d`, based on `main` commit `40c4f34f83d1fb6f7952e84f542afdeb3ecedf94`.
- GitHub Actions CI run 131 (`29709058449`) completed successfully. The `quality` job passed `npm ci`, `npm run check`, and `npm run assets:check`.
- The `browser-smoke` job successfully installed Playwright Chromium and passed `npm run test:e2e`. The same full suite selected 27 Chromium cases locally; CI executed it to a successful conclusion, covering the retained intro asset gate/retry, cue/loop reset, pointer/keyboard/gamepad input, reduced-motion and integer-geometry checks, audio retry, spoiler guard, and existing DC-9 handoff alongside the repository's cockpit flows.
- This closes the environment-blocked browser-execution gate. No representative cue screenshots were captured by the workflow, and a truly unattended 53.04-second playback plus owner visual approval were not performed; those visual/experiential gates remain open.

## 2026-07-19 TMB2 retry-race and publishing-hygiene re-review

- Replaced the eager retry switch with the tested `runIntroAudioRetry` lifecycle consumed by `GameIntro`. Runtime stays on the monotonic fallback clock while `audio.play()` is pending. A guarded success resamples current fallback time, seeks media to that time, then switches the authoritative runtime to media and clears the failure UI in the same promise turn.
- Every retry receives a generation token. A newer retry, accepted completion, fallback/error re-entry, or disposal/unmount invalidates older pending promises. Rejection resamples current fallback time without switching clock authority; a repeated media-error fallback entry also preserves that time instead of rebasing from stale media.
- TDD RED: the expanded deferred lifecycle suite failed 5/10 before `runIntroAudioRetry` existed. A follow-up repeated-fallback assertion then failed 1/10 at stale time 11 instead of authoritative time 14.5. GREEN: focused runtime tests passed 10/10 after both repairs, followed by clean TypeScript and ESLint.
- Publishing hygiene: `.superpowers/sdd/final-fixes-report.md` and `.superpowers/sdd/task-5-report.md` are removed from the Git index. `git ls-files .superpowers/sdd` returns no tracked path. The ignored local report remains available only as an untracked controller artifact; durable evidence is confined to this report and `plans/0016-tmb2-cinematic-intro.md`.
- Fresh `time -p npm run check` — pass, exit 0 in 9.76 seconds. ESLint and TypeScript passed; Vitest passed 101/101 tests across 7 files in 251 ms; Vite transformed 57 modules and built production in 475 ms.
- Fresh `time -p npm run assets:check` — pass, exit 0 in 3.12 seconds with the same existing non-fatal unused-UV/empty-node information and locker generated-tangent warnings. No GLB or asset source changed. `git diff --check` passed before durable evidence updates.
- Focused Playwright attempt — environment-blocked, exit 1 in 8.23 seconds. Build/preview succeeded and 10 Chromium tests were selected, but all stopped before their bodies because `/root/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell` remains absent. No browser behavior or visual result is claimed.

## 2026-07-19 TMB2 final broad-review repairs — browser launch still blocked

- Repaired all four Important review findings plus renderer time normalization without changing briefing copy, the DC-9 `onComplete` seam, mute/volume/retry/Skip controls, the development `?legacyIntro=1` switch, protected-reward content, or downstream chapters.
- Asset preload now has explicit loading/ready/error state. The unchanged **Start Game** control is disabled during required PNG decode; decode failure preserves the asset id/path, exposes **Retry cinematic assets** in production, and permits only the retained legacy intro in development. Normal Canvas playback cannot receive an empty asset map.
- Added one pure runtime consumed by `GameIntro`. It covers the monotonic six-second gate across natural/fallback loops, retry media resynchronization, same-sample gamepad acceptance, simultaneous exactly-once completion, and disposal/no post-disposal acceptance. React availability state is render-only; the stable request guard reads the current runtime ref.
- Added pure integer placement for 1440 x 900 (`scale=4`, `left=80`, `top=2`, `1280 x 896`), 768 x 900 (`scale=2`, `left=64`, `top=226`, `640 x 448`), and 375 x 812 (`scale=1`, `left=27`, `top=294`, `320 x 224`). `IntroCanvas` uses absolute top-left placement and a top-left transform origin.
- Renderer derivation normalizes time once before scene lookup and progress. Executable cases cover 53.04 seconds, three complete durations, NaN, and post-loop scene-relative time.
- RED evidence: asset suite failed 2/5 on raw rejection/missing gate; runtime and geometry suites failed on missing modules; renderer suite failed 5/18 on unnormalized progress; final disposal guard failed 1/6 on a missing active-runtime predicate. GREEN focused evidence: asset 5/5, runtime 6/6, geometry 3/3, renderer/config 21/21.
- Fresh final `time -p npm run check` — pass, exit 0 in 10.24 seconds. ESLint and TypeScript passed; Vitest passed 97/97 tests across 7 files in 249 ms; Vite transformed 57 modules and built production in 473 ms.
- `time -p npm run assets:check` — pass, exit 0 in 3.09 seconds with the existing non-fatal unused-UV/empty-node information and locker generated-tangent warnings. No GLB or asset source changed. `git diff --check` passed.
- `time -p npm run test:e2e -- e2e/smoke.spec.ts -g "game intro|opening stays spoiler-safe" --workers=1` — environment-blocked, exit 1 in 8.25 seconds. Build/preview succeeded and 10 Chromium tests were selected, but all stopped before their test bodies because `/root/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell` is absent.
- The retained Playwright cases now assert delayed/rejected decode and production retry, exact integer geometry/top-left origin at 375/768/1440, same-sample gamepad Start, loop behavior, sound controls, keyboard/pointer paths, duration, spoiler safety, and the existing DC-9 handoff. None executed in a browser locally, so no browser pass, screenshot, responsive visual result, uninterrupted loop, or owner approval is claimed.

## 2026-07-19 TMB2 runtime validation checkpoint — browser provisioning blocked

- Validation started from a clean worktree at `69ed2e1` (`fix: latch intro start and protect controls`) on `agent/tmb2-intro-runtime`; this pass changed only the ExecPlan and test evidence.
- `time -p npm run check` — pass, exit 0 in 10.05 seconds. ESLint and TypeScript passed; Vitest passed 80/80 tests across 5 files in 239 ms; Vite transformed 55 modules and completed the production build in 450 ms.
- `time -p npm run assets:check` — pass, exit 0 in 3.79 seconds for the three deployable GLBs. Existing validator notices remain informational/non-fatal: unused UV/empty-node rows and locker runtime-generated tangent-space warnings. Exact runtime artifacts:
  - `public/models/airbus-captain.glb`: 39,878,776 bytes; SHA-256 `e340dcf1caefb998f208a5fd228455384d289916efd4b4f15fbafc50c79497ef`.
  - `public/models/dc9-cockpit.glb`: 36,050,764 bytes; SHA-256 `e092a1d8907db5ed8fb9dc1032cac3874e0295287ae33ecb7e50f5d6ebf6d9ac`.
  - `public/models/locker-room.glb`: 44,288,740 bytes; SHA-256 `cf212389e0d04aa34a528cbc2af07e59b4acc9d4e98e386f725c78da43279c5c`.
- `ffprobe -v error -show_entries format=duration,bit_rate -of default=noprint_wrappers=1 public/audio/intro-audio-53s.mp3` — duration 53.040000 seconds and bit rate 192,155 bit/s. The deployable file is 1,273,994 bytes; SHA-256 `be635257cce2ebb3e7e327cada37e09b4a3b4c292e5e385f280955a1d2843507`.
- Browser inventory found no Chromium, Chrome, Brave, Edge, Firefox, `agent-browser`, Playwright cache, repository-bundled browser, or compatible system/workspace executable. `playwright.config.ts` supports `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, but there was no executable to supply.
- `time -p npm run test:e2e -- --workers=1` — environment-blocked, exit 1 in 15.32 seconds. The application built and served, and Playwright selected 27 Chromium cases, but all 27 stopped before their test bodies because `/root/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell` does not exist. This is not a product assertion failure and no browser behavior is claimed.
- `time -p env PLAYWRIGHT_BROWSERS_PATH=/tmp/tmb2-playwright-browsers PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=15000 npx playwright install chromium` — provisioning blocked, exit 1 in 28.11 seconds. Five download attempts each reported 100% of 0 MiB, then `End of central directory record signature not found`; the destination contains metadata only and no executable.
- `git diff --check` — pass after the final evidence edits.
- No genuine browser screenshots were produced. `preview-renders/tmb2-intro-animatic/` remains absent and was not staged. The 12 requested 320 x 224 captures at 0, 3, 6, 12, 16, 22, 28, 35, 42, 48, 51, and 53 seconds; integer-pixel/scene-ID/prompt/letterbox/spoiler inspection; and functional containment checks at 1440 x 900, 768 x 900, and 375 x 812 remain open.
- The natural 53.04-second unattended loop; pointer, Enter, Space, Escape, and controller Start after six seconds; exactly one DC-9 transition per path; no early `START` persistence; and the existing DC-9 completion contract were not exercised in an actual browser in this environment. The runtime milestone and owner visual gate therefore remain open.
- The existing GitHub Actions `browser-smoke` job is the next external validation surface: it runs `npx playwright install --with-deps chromium` and then `npm run test:e2e`. CI configuration was inspected but not changed.

## 2026-07-19 TMB2 cinematic intro untouched baseline

- Pre-edit inspection found a clean task worktree on branch `agent/tmb2-intro-runtime` at starting HEAD `0afc6b5` (`chore: ignore local worktrees`); no unrelated user changes were present or overwritten. Recent context: `40c4f34` merged the Airbus radio/thrust alignment PR, preceded by `ba2a6f1` and `387395a` alignment/proof commits.
- The initial literal `npm install` attempt failed because npm tried to create/use the unwritable sandbox default cache at `/root/.npm`; this was a provisioning issue, not a dependency or product failure. The environment-safe resolution, `npm ci --cache /tmp/cockpit-npm-cache --prefer-offline`, then succeeded with 398 packages.
- `npm run check` passed: lint, TypeScript, 66/66 Vitest tests across 3 files, and a Vite production build (52 modules transformed; 446 ms).
- Focused browser command `npm run test:e2e -- e2e/smoke.spec.ts -g "game intro|opening stays spoiler-safe" --workers=1` selected 6 Chromium tests but could not launch any test because `/root/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell` is absent. Result: 6 failed at launch in 7.1 seconds; no product behavior was evaluated and no screenshots were produced.
- Browser recovery attempts were blocked by environment provisioning: `npx playwright install chromium` cannot create `/root/.cache/ms-playwright`; retrying with `PLAYWRIGHT_BROWSERS_PATH=/tmp/cockpit-playwright-browsers` reached `https://cdn.playwright.dev` but repeatedly received an invalid/truncated zero-byte archive (`End of central directory record signature not found`).
- Existing warnings retained for follow-up: npm reports unknown `http-proxy` config and npm 11.18.0 availability; the Playwright web server reports `NO_COLOR` is ignored while `FORCE_COLOR` is set. These warnings did not fail `npm run check`.

## 2026-07-13 DC-9-32 Pop T Captain production pass

- Promoted the owner-cleared Roger2009 DC-9-32 to exact geometry/texture authority and replaced the active switch-first DC-9-50 Captain contract with route-first BTR/STL/TYS verification, then APU buses off, APU master off, and battery off. Fuel boost pumps are an explicit already-off parked-state precondition.
- Extended OBJ8 conversion/import coverage for nested animation channels, keys, pivots, datarefs, manipulators, draw ownership, selected-range extraction, pivot endpoints, and static-range exclusion. Python cockpit-pipeline discovery passed 16/16.
- Rebuilt `public/models/dc9-cockpit.glb`: 30,336,864 bytes (28.93 MiB), SHA-256 `1ecde9d5ebeab587269355f0b75b7585c4b74f74edd5e5a36c4c77f4660dce7c`; 654 selected objects, 620 meshes, 220,259 uploaded vertices, 236,826 triangles, 8 materials, 5 textures, 6 cameras, and 11 stable `game_id` nodes.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:dc9` passed. Blender scene validation reported zero errors/warnings; glTF validation reported zero errors/warnings, with informational unused collider UVs only. No destructive optimization was applied.
- Added schema-v6 persistence and migration. All 47 reducer/storage tests passed, covering route-first gating, both failure/reset scopes, progressive hints, battery completion, corrupt saves, completed reward/Mars preservation, and in-progress v5 Captain restart.
- Replaced the sidebar and floating proxy switches with the full-screen Captain shell, real collider picking, projected native controls, yoke-route/overhead stage cameras, reduced-motion snapping, and compact model-failure fallback. The latest owner placement correction supersedes the broad clipboard attempt: donor yoke ranges 012/013 were measured, the route strip was narrowed to 0.10 by 0.30 and moved in front of the center pad at y=-2.775, and the captain eye was lowered from z=0.90 to z=0.82. Rightward look was expanded to about 41 degrees while left remains about 17 degrees. A camera-drag regression found during Playwright proof was fixed with a movement threshold so orbiting cannot select a route.
- Focused Chromium proof passed 2/2 in 1.9 minutes: real GLB bytes and strict registry, real BTR mesh click, rightward camera move/reset, route keyboard flow, overhead secure projection, battery-off reward, absent sidebar, and aborted-GLB accessible fallback.
- Full `npm run test:e2e -- --workers=1` passed all 14 Chromium cases in 6.6 minutes after the merged locker checkpoint. This includes the 3.8-minute real-locker GLB flow, Airbus production GLB, the 1.7-minute real DC-9 route/secure/reward flow, DC-9 model fallback, accessibility, persistence, camera, and reduced-motion coverage.
- `npm run check` passed: lint, TypeScript, 47/47 Vitest tests, and Vite production build. `npm run assets:check` passed; DC-9 has no validation warnings. `npm run pipeline:evals` passed 6/6.
- Repaired browser evidence was inspected at 1440, 768, and 375 px with no horizontal document overflow. The narrow route strip is attached to the pilot-facing yoke pad with all six choices and submit visible; the dragged-right proof shows the center pedestal, first-officer panel/yoke, and right window while projected controls remain attached. The secure screenshot projects the three native controls onto visible overhead geometry. A fresh reload recorded no application console errors; Three.js emits only its upstream `Clock` deprecation warning.
- Evidence: `preview-renders/cockpit-pipeline/dc9-captain-browser/{captain-game-view-1440,captain-game-view-768,captain-game-view-375,route-card-1440,right-look-1440,overhead-procedure-1440,battery-off-reward-1440}.png` and `preview-renders/dc9-captain-approval.png`.
- `npm run references:check` regenerated the DC-9 reference scene and overview, but its aggregate result remains red because three unrelated locker photos under `art-source/references/local-private/` are unmanifested.
- Vercel preview `dpl_6y1qkjBCL9HLVpadmHqs81Jq2NGz` is Ready at `https://cockpit-escape-room-9amnfa4zy-ottoagent007-gmailcoms-projects.vercel.app`. Authenticated `vercel curl` returned 30,336,864 bytes and SHA-256 `1ecde9d5ebeab587269355f0b75b7585c4b74f74edd5e5a36c4c77f4660dce7c`, exactly matching local.
- The owner approved this DC-9 greybox checkpoint for PR publication on 2026-07-13 and explicitly noted that substantial work remains. The label stays until a later production-ready approval.

## 2026-07-13 DC-9-50-family captain cockpit visual gate

- Owner review rejected the first donor-backed proof because its hand-placed gauges did not match the references and the yokes were initialized at the donor animation's full-left key. The repair now imports `DC9-32_cockpit.obj`, preserves its native instrument positions, and applies an explicit parked neutral pose for yoke roll/pitch/heading.
- `tools/blender/build_dc9_production.py` now builds the five-object Roger2009 cockpit stack deterministically, skips hidden OBJ8 draw ranges, masks only edge-connected white atlas padding, packs the corrected native atlas, and retains the `DC9_ROOT` hierarchy plus saved captain/approval cameras.
- Current master: 23,143,913 bytes, SHA-256 `6e23c3f01f65e34e93f53cd989ff7723b198384c17547c3a23d92aa66a0c332e`. Current GLB: 26,742,512 bytes, SHA-256 `fc13dacfdc9eed4625244b6b7abc1001e496d2e0b2b2d758927713b94af0552d`.
- GLB inspection: 618 nodes, 602 meshes/primitives, 219,827 uploaded vertices, 236,610 triangles, five materials, five textures, five cameras, and no animations. Scene validation passed with zero errors/warnings.
- Browser integration loads `CAM_DC9_CAPTAIN_GAME`, applies 64-degree desktop/76-degree narrow-layout framing, restores the exact saved pose with `R`, and corrects OBJ8 material depth behavior so the upright yoke, gauges, pedestal, and overhead remain visible together. Native HTML Captain controls remain available.
- A no-cache browser fetch received HTTP 200 and the exact 26,742,512-byte GLB. The canvas reported `ready`, the required camera node, and the saved 64-degree desktop state. Browser proofs at 1440, 768, and 375 px were visually inspected and promoted to `preview-renders/cockpit-pipeline/dc9-captain-browser/`; no page errors were recorded.
- Vercel preview `dpl_J8tb6mkq8p3jj84YgmU9EDQzmNDq` reached Ready at `https://cockpit-escape-room-5l72uhuph-ottoagent007-gmailcoms-projects.vercel.app`. Authenticated `vercel curl` returned HTTP 200, `model/gltf-binary`, 26,742,512 bytes, and SHA-256 `fc13dacfdc9eed4625244b6b7abc1001e496d2e0b2b2d758927713b94af0552d`, exactly matching the promoted local GLB.
- Passed: `npm run asset:dc9`; `npm run assets:check`; cockpit-pipeline unit discovery (15/15); `npm run check` (42/42 Vitest tests plus production build); focused real-GLB DC-9 Playwright (1/1, including look/reset and accessible controls); and `git diff --check`.
- `npm run assets:check` reports no GLB errors. Four imported donor PNGs retain feature/color-space warnings and two empty locator nodes are informational. Destructive texture/hierarchy optimization remains deferred until visual approval.
- `npm run references:check` regenerated the DC-9 reference scene and overview but remains red only because three unrelated locker photos under `art-source/references/local-private/` are not manifested.
- Owner visual approval is still open. The `GREYBOX — DC-9 CAPTAIN FLOW` badge remains until that decision, and Captain Mode gameplay/Model Y work remains deferred.

## 2026-07-12 Wings question emphasis and Captain's Hat celebration

- Rolex, baseball, Charging Bull, and Wings questions now render as semantic bold legends. Removed `e.g. 1000 hours` from the Wings input and replaced the repeated-wrong exact-answer reveal with a non-answer range clue; prior progress and accepted answer variants are unchanged.
- Correct Wings completion now fades to black and presents the real Captain's Hat with the Crew Qualification celebration language, 24-piece confetti, and one `Enter Pop T Captain Mode` action. Reduced motion shows the static card without animation/confetti; reload resumes the unclaimed celebration.
- Blender 5.1.2 rendered the exact `LOCKER_PROP_CAPTAINS_HAT` subtree from the unchanged runtime GLB into `public/images/captains-hat-celebration.png`: 1024×1024 RGBA, 563,765 bytes, SHA-256 `e426b329b273fcd593ed7bace8848a2573f8ed8bfb198b3063df63beb05d4f8c`, two meshes, and two materials. A repeat render produced identical decoded RGBA pixels.
- The locker GLB remains 44,288,740 bytes with SHA-256 `cf212389e0d04aa34a528cbc2af07e59b4acc9d4e98e386f725c78da43279c5c`; the master remains 50,237,876 bytes with SHA-256 `648a63df7a95de0cda11cf2c2ba2dcb988b621ab6ab04388f3ae460d0fc63f42`.
- Actual-browser proof: `/tmp/captain-hat-celebration-final-{1440,768,375}.png`. The final card has no horizontal overflow, the CTA remains focused, and there were no console/page errors. A no-cache real-GLB run received the exact model and PNG byte lengths before the responsive captures.
- Passed: Python compile, `npm run assets:check`, `npm run pipeline:evals` (6/6), `npm run check` (42/42 unit tests plus production build), focused locker Playwright, and full `npm run test:e2e` (12/12 in 4.2 minutes). Vercel publication and final owner visual approval remain open.

## 2026-07-12 Baseball seam, continuous camera, and Wings question pass

- Baked the owner-selected baseball XYZ rotation `(-45°, 0°, 90°)` through Blender. The supplied 4K Tripo geometry/materials, `(0.64, -0.48, 1.34)` placement, `0.30` scale, stable root, and exported collider remain unchanged; both curved vertical seam bands now face the player like `/mnt/2TBHDD/Downloads/realistic-vector-baseball.jpg`.
- Watch, Baseball, Bull, and Wings focus cues all report FOV `30.00` and camera-to-target distance `3.490`. The browser moves upward through the sequence without changing zoom; cards continue to open only after the relevant cue settles, and reduced motion snaps to the same final poses.
- Baseball now presents “Before the captain wore wings, he wore a glove.” Charging Bull uses a separate semantic bold question block. Wings changed from automatic inspection to a required native free-text question accepting `1000`, `1,000`, `1000 hour(s)`, and comma variants, with wrong/repeated-wrong hints and no progress loss.
- Schema remains version 5. Missing `lockerAttempts.wings` values normalize to zero for older saves, while already completed Wings/hat saves remain complete. The inspection-completion action and 3D bypass were removed.
- Wings exports `locker.memory.wings` / `question`. Current master: 50,237,876 bytes, SHA-256 `648a63df7a95de0cda11cf2c2ba2dcb988b621ab6ab04388f3ae460d0fc63f42`. Current GLB: 44,288,740 bytes, SHA-256 `cf212389e0d04aa34a528cbc2af07e59b4acc9d4e98e386f725c78da43279c5c`.
- Actual-browser evidence: `.cache/assets/locker/browser/locker-seam-flow-{watch,baseball-card,baseball-clean,bull-question,wings-question}-1440.png` and `locker-seam-flow-wings-{question,card}-{768,375}.png`. A no-cache response matched disk with `model/gltf-binary`; no console/page errors or horizontal overflow occurred. The 1440 Wings card clears the lower-right actions, and tests enforce non-overlap.
- Validation passed: `python3 -m py_compile tools/blender/import_locker_room_props.py`; `npm run asset:locker`; `npm run assets:check`; `npm run pipeline:evals` (6/6); `npm run check` (42/42 unit tests plus production build); focused accessible and real-GLB Playwright; full `npm run test:e2e` (12/12); and `git diff --check`.
- The real-GLB test now has a 240-second ceiling because the expanded four-memory path takes approximately 2.9 minutes on this 44 MB scene. Assertions were expanded, not relaxed. Visual acceptance remains exclusively with the owner.

## 2026-07-12 Locker centering and darker-lighting pass

- Moved the Blender-owned watch, Wings, and captain's hat roots from x=`0.42` to x=`0.56`; their colliders move with the stable roots. Baseball, Charging Bull, and both shelves were intentionally left unchanged.
- Updated affected Blender approval cameras plus the runtime watch/Wings focus targets. Reduced only locker-scene and approval-render lighting by approximately 12–15 percent; prop PBR materials and texture maps were not modified.
- Rebuilt via `npm run asset:locker`. Master: 50,238,219 bytes, SHA-256 `c284dce0a75f380270ffbd3bed38c009bdd7adb97794a269f6309daf5ef071c4`. GLB: 44,288,680 bytes, SHA-256 `96cf42d665fd41c3ecf4e384318251e42c1e99577eac5c1e7ebf93861c46a4d5`.
- Actual-browser proof: `.cache/assets/locker/browser/locker-centering-watch-1440.png` and `.cache/assets/locker/browser/locker-centering-overview-{1440,768,375}.png`. The real watch/Wings/hat nodes loaded, focus cues settled, a no-cache HTTP response matched the on-disk GLB bytes/hash, and no console/page errors or horizontal overflow were recorded.
- Validation passed: `python3 -m py_compile tools/blender/import_locker_room_props.py`; `npm run assets:check`; `npm run pipeline:evals` (6/6); `npm run check` (35/35 unit tests and production build); focused locker Playwright (5/5); full `npm run test:e2e` (12/12); and `git diff --check`.
- This is defect-screened comparison evidence, not agent visual approval. Final centering and darkness remain at the locker-room owner approval gate.

## 2026-07-11 Locker black-backdrop, jet-lag question, Wings, and Charging Bull pass

- Preserved the downloaded Wings and Charging Bull GLBs unchanged under `.cache/cockpit-pipeline/sources/locker-room/*/original/`; their SHA-256 values exactly match `/mnt/2TBHDD/Downloads`:
  - Wings: `71b308c7a2f25a6014a29613bf3cd33bf4a3883969fb4bec7e9067cf8be80af0`.
  - Charging Bull: `2858838f5d753571c5c8702fb061bf4005dd6e32460ed9a745c422a7e46fb7c8`.
- Neutral Blender 5.1.2 source inspection found one mesh, one material, and three native 1024 maps per prop. The Wings were reduced from 492,226 triangles to 48,000 and turned -90 degrees to face the player. The Bull was reduced from 498,476 to 59,999 triangles, kept at a -45-degree presentation angle, and placed on a dedicated matte-metal shelf.
- Added stable Blender-owned contracts and colliders: `LOCKER_PROP_WINGS` / `LOCKER_HITBOX_WINGS` / `locker.memory.wings`, and `LOCKER_PROP_CHARGING_BULL` / `LOCKER_HITBOX_CHARGING_BULL` / `locker.memory.chargingBull`.
- Regenerated `art-source/blender/locker_room_master.blend` at 30,705,426 bytes, SHA-256 `7c0b71e55f066d7c1b824e898614dddaad05c363d7d902a88114f933f545c0fb`.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:locker` - pass. Five known imported-environment transform warnings remain; glTF validation reported no errors and the expected generated-tangent warnings for normal-mapped imports.
- Generated `public/models/locker-room.glb` at 27,253,440 bytes, SHA-256 `3829754b92f9e06bf406fb7f2afce21336a3975ca422feb496e5cf88985cd69c`; the export report records 46 selected objects, four `game_id` parents, eight materials, and eighteen textures.
- A fresh request to `/models/locker-room.glb?v=tripo-locker-props-20260711` returned the same 27,253,440 bytes and SHA-256 as the file on disk.
- Runtime keeps the Wings, Bull, and hat as noninteractive textureless silhouettes until reducer state makes them available. The watch remains the only authored first interaction, and browser tests prove all four exported node names plus locked/revealed material states.
- Changed the locker canvas and fallback scene to black, removed `LOCKER REVEAL SCENE`, removed the bottom Pilot watch card, and added the compact native `Inspect watch` control beside the exact instruction `Begin with the pilot watch.`
- Replaced the watch prompt with the owner-provided Rolex GMT-Master/Pan Am question and immediate choices Brain fog, Motion sickness, Sleep deprivation, and Jet lag. Only Jet lag succeeds; the first and repeated wrong choices provide the time-zone and body-clock clues without erasing progress.
- Focused reducer/storage tests initially exposed an uppercase-normalization bug in visible choice labels. Lowercasing now happens before punctuation removal, and `jet lag`, `Jet Lag`, and `JET-LAG` are all covered.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass, 32/32.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/locker-room.spec.ts --workers=1` - pass, 5/5 in 1.2 minutes, including the real 27.25 MB GLB, watch collider, exact choices, progressive failure, keyboard focus, reload, reduced motion, retry, and accessible fallback.
- `npm run check` - pass; lint, typecheck, 32 Vitest tests, and production build completed.
- `npm run assets:check` - pass for all deployable GLBs; locker warnings are the documented generated-tangent rows plus informational unused UVs on the four colliders and shelf.
- `npm run pipeline:evals` - pass, 6/6. `python3 -m py_compile tools/blender/render_source_candidate.py tools/blender/import_locker_room_props.py` and `git diff --check` - pass.
- `npm run test:e2e -- --workers=1` - pass, 12/12 Chromium tests in 1.7 minutes, including both real Airbus and locker GLBs.
- Actual browser evidence inspected at 1440, 768, and 375 px with a computed `rgb(0, 0, 0)` shell, four watch choices, no locker memory tray, no obsolete badge, no horizontal overflow, and no console errors:
  - `.cache/assets/locker/browser/locker-black-props-1440.png`
  - `.cache/assets/locker/browser/locker-watch-jet-lag-question-1440.png`
  - `.cache/assets/locker/browser/locker-black-props-768.png`
  - `.cache/assets/locker/browser/locker-black-props-375.png`
- Remaining limitations: all four imported props remain owner-review candidates; baseball intake, the post-watch Wings/Bull sequence, exact Charging Bull personal story, Vercel preview, and owner visual approval remain open.

## 2026-07-11 Locker watch and captain's-hat Tripo intake

- Preserved the two Downloads sources unchanged under `.cache/cockpit-pipeline/sources/locker-room/*/original/`; SHA-256 values match the downloaded files exactly.
- Added deterministic neutral candidate rendering and owner-master prop intake through `tools/blender/render_source_candidate.py` and `tools/blender/import_locker_room_props.py`.
- Watch cleanup: 488,677 source triangles to 71,999 web triangles; three 4096 maps staged at 1024; stable `LOCKER_PROP_WATCH` / `LOCKER_HITBOX_WATCH` contract with `locker.memory.watch`.
- Hat cleanup: 488,608 source triangles to 69,999 web triangles; three 4096 maps staged at 1024; stable `LOCKER_PROP_CAPTAINS_HAT` / `LOCKER_HITBOX_CAPTAINS_HAT` contract with `locker.promotion.hat`.
- Replaced the temporary runtime hat geometry and runtime watch/hat hitboxes. The browser now raycasts the exported colliders, keeps the real hat visible with texture/normal maps removed in the locked state, and restores its authored material only after `lockerHatRevealed`.
- `BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:locker` - pass. Blender source validation retained five known imported-environment transform warnings; glTF validation reported no errors.
- Generated `public/models/locker-room.glb` at 21,852,396 bytes with SHA-256 `eaa919f60faeb3bc4cdae5dbac969b961ac783d75d91c23cb7c462945feb4e59`; export report records 39 selected objects and two `game_id` nodes.
- `npm run typecheck` and `npm run lint` - pass after wiring GLB-node checks, visible-mesh pointer events, and locked/revealed hat material state.
- `npx playwright test e2e/locker-room.spec.ts` - all five cases passed across the focused run plus repaired real-GLB rerun. The first pass exposed only an insufficient post-reload wait for the larger GLB; the assertion timeout was raised without weakening the node/material/click checks.
- `npm run assets:check` - pass for all deployable GLBs. Locker output has no errors; expected generated-tangent warnings remain for normal-mapped imports, with two informational unused-UV rows on the simple colliders.
- `npm run check` - pass; lint, typecheck, 33 Vitest tests, and the production build completed.
- `npm run test:e2e` - pass, 12/12 Chromium tests in 57.5 seconds, including both real Airbus/locker GLBs.
- `python3 -m py_compile tools/blender/render_source_candidate.py tools/blender/import_locker_room_props.py`, `npm run pipeline:evals` (6/6), and `git diff --check` - pass.
- Actual browser evidence inspected at 1440, 768, and 375 px with no console errors:
  - `.cache/assets/locker/browser/locker-wide-real-props-1440.png`
  - `.cache/assets/locker/browser/locker-watch-real-prop-1440.png`
  - `.cache/assets/locker/browser/locker-watch-real-prop-768.png`
  - `.cache/assets/locker/browser/locker-watch-real-prop-375.png`
  - `.cache/assets/locker/browser/locker-hat-revealed-1440.png`
- Checkpoint limitations, superseded by the current section above: the watch and hat were owner-review candidates; baseball, airline wings, and Charging Bull visuals were not yet imported; Vercel and owner approval remained open.

## 2026-07-11 Epic Airbus-to-locker transition and watch-first gate

- Replaced the immediate locker cut with a staged cinematic: 900 ms fade to black, pause, centered Captain's-journey sentence, asset-ready reveal, wide locker hold, and a 4.5-second cubic-eased move toward the lower watch area.
- Added `lockerIntroCompleted` in schema v5. Fresh Airbus handoffs play the cinematic; v3/v4 and completed/resumed locker saves keep their progress and skip it. Replay does not alter progression.
- Added visible Skip cinematic and Replay intro controls, Escape skip, modal focus trapping, watch focus restoration, reduced-motion short fades/immediate camera placement, and an accessible no-WebGL equivalent.
- Reducer and both presentation paths now expose only the watch for a new locker sequence. Baseball, wings, Charging Bull, hat claiming, and Captain Mode continuation remain locked until Tripo intake and later sequence authoring.
- At this checkpoint, added one warm practical light and the runtime placeholder `LOCKER_PROP_CAPTAINS_HAT_SILHOUETTE`; the later intake section above records its replacement by the real exported hat.
- Preserved the unchanged environment GLB at 12,850,484 bytes and SHA-256 `c5e79ba07c9947bd859d05e1cd47ca004b6b84915ff32b2648149ed5512f17bd`.
- `npm run check` - pass; lint, typecheck, 33 Vitest tests, and production build.
- `npm run test:e2e` - pass; 12 Chromium tests in 1.1 minutes. Coverage includes the real Airbus/locker GLBs, exact intro copy, skip/replay, watch-only gating, wrong/repeated-wrong hints, schema persistence, directed camera state, projected 3D watch hitbox, reduced motion, keyboard focus, retry, and accessible fallback.
- `npm run assets:check` - pass; no GLB errors. Existing generated-tangent warnings for the imported locker maps remain unchanged.
- `npm run pipeline:evals` - pass, 6/6; `git diff --check` - pass.
- Actual browser captures inspected with no console errors:
  - `/tmp/locker-epic-title-1440.png`
  - `/tmp/locker-wide-reveal-1440.png`
  - `/tmp/locker-watch-focus-1440.png`
  - `/tmp/locker-watch-focus-768.png`
  - `/tmp/locker-title-reduced-375.png`
  - `/tmp/locker-watch-focus-375.png`
- Browser repair notes: the first hat silhouette was visibly oversized and floating, so it was scaled down and placed deeper on the upper shelf before evidence was recorded. Full parallel e2e initially exceeded the default 30-second timeout while both large GLBs loaded; the real locker test now uses the same 75-second budget as the Airbus test without reducing assertions.
- Checkpoint limitation, superseded in part by the intake section above: watch/hat Tripo meshes had not yet been imported; the later keepsake order and Vercel/owner gate remain open.

## 2026-07-10 Locker room Sketchfab environment import

- Normalized owner-downloaded source archives under `.cache/cockpit-pipeline/sources/locker-room/**`.
- Imported Game Locker and Locker room bench into `art-source/blender/locker_room_master.blend` through `tools/blender/create_locker_room_proxy.py`.
- Preserved the original downloaded zips untouched and staged extracted/optimized glTF copies under cache.
- Texture staging: six 2048x2048 textures in the Blender source; the bench maps were downscaled from 4096x4096 and the Game Locker normal map was re-encoded for Blender compatibility.
- Runtime contract preserved through five React Three Fiber transparent hitboxes: `locker.memory.watch`, `locker.memory.baseball`, `locker.memory.wings`, `locker.memory.charging_bull`, and `locker.promotion.hat`.
- Owner-adjusted Blender export - pass; produced `public/models/locker-room.glb` at 12,850,484 bytes with 30 source-hierarchy objects, 2 materials, six 2048 textures, and SHA-256 `c5e79ba07c9947bd859d05e1cd47ca004b6b84915ff32b2648149ed5512f17bd`. glTF validation reported no errors and expected generated-tangent warnings.
- Removed the old visible proxy locker shell, shelves, cubby door, side lockers, and placeholder prop meshes from the source-present build. The downloaded Game Locker and bench are the visible scene assets; gameplay is preserved with invisible 3D hitboxes and HTML controls until the Tripo props arrive.
- Fixed the downloaded bench orientation, kept its wood planks facing upward, preserved the Game Locker's imported texture maps, and added balanced neutral runtime lighting so the weathered blue-gray material remains readable.
- `npm run assets:check` - pass; no GLB validation errors. Locker warnings are generated tangent-space rows from imported normal-mapped materials; existing informational unused-UV/empty-node output remains.
- `npm run check` - pass; lint, typecheck, 32 Vitest tests, and production build.
- `npx playwright test e2e/locker-room.spec.ts` - pass; 4 Chromium tests, including real GLB request and 3D canvas memory picking after the imported environment mesh.
- `npm run test:e2e` - pass; 11 Chromium tests.
- Visual evidence:
  - `.cache/assets/locker/previews/cam_locker_approval_hero.png`
  - `.cache/assets/locker/previews/cam_locker_approval_detail.png`
  - `/home/user1/Pictures/Screenshots/Screenshot from 2026-07-10 21-55-29.png` (owner target)
  - `/tmp/locker-reference-lit-browser-1440b.png` (actual browser proof)
- Remaining limitations: personal memory props are represented by invisible hitboxes until the owner-supplied Tripo assets arrive; owner visual approval and Vercel preview are still required for the locker room gate.

## 2026-07-10 Airbus loading and desktop viewer controls

- **Production approval:** The owner approved the current Airbus A320 First-Officer experience for production on 2026-07-10. The `A320 PLAYABLE PROOF` badge is removed; older approval-candidate limitations later in this report are retained as dated history and are superseded by this decision.
- Fairness/readability follow-up: centered and tightened the Airbus feedback dock, increased primary dock/question text to 16.8 px, moved Help and Fullscreen to the lower-right corner, removed the visible reset button, removed the Airbus Hint button, and added concise function descriptions to all five cards. The `R` keyboard reset remains available.
- Dock density follow-up: lowered the normal feedback dock to a 14 px bottom inset and placed Restart beside the status message, removing the mostly empty second row. The Airline Transport Pilot state still expands upward to fit its full question and answer form.
- Replaced answer-revealing target names with neutral accessibility-only drop-zone identifiers and faint, unlabeled silhouettes for the visible placement targets. Wrong placements give one generic retry message without naming the correct control.
- Silhouette follow-up: the placement layer now uses distinct low-detail outlines for the sidestick grip, paired thrust levers, gear handle, radio faceplate, and altitude display. No numbered target chip is rendered visually; focus/drag-over strengthens the glow without revealing text.
- Airline Transport Pilot input accepts `1500`, `1,500`, `1500 hour`, and `1500 hours`; the question explicitly requests hours and the celebration action now reads `Continue`.
- Workstation Brave screenshots at 1440 confirm readable card descriptions, a centered dock, neutral wrong feedback, and no visible target answer labels. DOM measurements confirm exact centering at 1280/1440/1920.
- `npm run check` passed with 21 Vitest tests after the fairness pass.
- Follow-up polish: added clean runtime art for briefing/loading/fallback, placed Help and Fullscreen in the lower-right corner, retained exact keyboard camera reset, added native Enter submission, and added a confetti qualification dialog with explicit locker continuation.
- Removed `AirbusLoadingFallback` greybox geometry. The shell loader now has a 600 ms minimum, waits for two framed render cycles, and resets on initial entry, retry, and full-game Restart.
- Workstation Brave rendered the real GLB and proved camera reset from a moved 76 degree view back to the approved transform and 68 degree FOV exactly.
- Browser evidence confirms the loader reappears after Restart, the compact dock remains centered while Help and Fullscreen occupy the lower-right corner, the opening uses the game-ready cockpit, and the celebration is visually correct at 1440 px.
- Focused browser tests passed for normal Enter qualification-to-locker flow, failed-load retry/fallback, Help focus/layout, and reduced-motion celebration reload.
- `npm run check` passed with 17 Vitest tests; assets, glTF, three A320 gates, pipeline evals (6/6), and `git diff --check` passed.
- Regression repair: removed the speculative pre-render WebGL context probe and permanent canvas-fallback latch after the owner reported the cockpit no longer worked correctly. The actual loaded and framed A320 scene is again the sole ready-state authority.
- Added one A320 loader using `public/images/a320-fo-view.png`, real GLB byte/progress reporting, and a first-rendered-frame readiness gate.
- Added recoverable `Retry 3D` and static-image accessible fallback paths for GLB/network failures.
- Added phase-aware viewer help, full-shell fullscreen, reset, typing-target shortcut suppression, seated A320 zoom clamped to 50-76 degrees, and continuous target projection.
- `npm run check` passed: lint, typecheck, 16 Vitest tests, and production build.
- Focused Playwright failure/retry/fallback and help/focus coverage passed: 2 tests.
- `npm run assets:check`, glTF validation, all three A320 gate validations, `npm run pipeline:evals` (6/6), and `git diff --check` passed; existing informational UV/empty-node rows remain.
- Loader evidence: `/tmp/a320-loading-1440-playwright.png` at 1440x900.
- Limitation: local full-GLB Playwright workers ended before reporting results for zoom/full-render capture. Agent-browser cannot render WebGL here. Those checks are not claimed as passing.
- Owner gate closed on 2026-07-10 after desktop browser review. The approved production baseline retains the documented imported-source limitations outside the five gameplay targets.
- Promotion validation: `npm run check`, `npm run assets:check`, glTF validation, all three A320 gates, and pipeline evals (6/6) passed. The real-GLB smoke passed in the first run; the three state-flow smoke tests passed together after updating stale non-leaking card assertions. The focused viewer-help layout/focus test passed after aligning it with the approved lower-right controls.
- CI browser-smoke repair: two long-running 38 MiB real-GLB interaction tests exhausted the GitHub runner and stalled Chromium input/locator operations while all six lightweight flows passed. CI now uses one Playwright worker and one bounded production smoke covering GLB delivery, first-frame readiness, the approved 68 degree camera, projected targets, and console health. Placement, persistence, and progression remain covered in the lightweight browser flows; seated zoom/reset retains workstation-browser evidence.

Update this file with actual evidence after every milestone. Do not replace failures with optimistic prose.

| Check | Expected | Actual | Status | Follow-up |
|---|---|---|---|---|
| `npm run lint` | No lint errors | Passed standalone and inside `npm run check` after A320 five-card feedback simplification | Pass | Rerun after every code change |
| `npm run typecheck` | No Typecheck errors | Passed standalone and inside `npm run check` after A320 five-card feedback simplification | Pass | Rerun after every code change |
| `npm run test` | Reducer and persistence tests pass | 16 Vitest tests passed after removing the Airbus clock card while retaining the ATP gate | Pass | Add focused tests per puzzle |
| `npm run build` | Vite production build succeeds | Passed inside `npm run check` after A320 five-card feedback simplification | Pass | Track runtime bundle and asset budgets |
| `npm run test:e2e` | Captain/locker/airbus loop, A320 GLB proof, immediate feedback, no clock card, ATP gate, and reload path pass in Chromium | Passed 4 Chromium tests after adding GLB-backed First-Officer target pivots and native keyboard placement proof | Pass | Keep browser tests current with each milestone |
| `npm run assets:check` | No invalid production GLBs | Passed for `public/models/airbus-first-officer.glb` and `public/models/dc9-cockpit.glb`; validator output has informational unused UV/empty-node rows only | Pass with info | Must validate every committed GLB |
| `npx gltf-transform validate public/models/airbus-first-officer.glb` | A320 cockpit GLB has no glTF validation errors | Passed with no errors or warnings; five informational unused `TEXCOORD_0` rows remain for target meshes | Pass with info | Rerun after every A320 GLB update |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` | Browser integration gate artifact is structurally valid | Passed after updating the gate for production-candidate screenshots at 375, 768, 1440, and 1920 px | Pass | Rerun after browser evidence changes |
| `npm run references:validate` | Reference manifest is structurally valid | Passed for 24 references; wrote `.cache/references/manifest-validation.json` | Pass | Rerun after reference-manifest edits |
| `npm run references:download` | Download only entries with explicit direct image URLs and record hashes | Passed; downloaded 4 Commons images and skipped the link-only Simulation Daily source | Pass | Use `--force` only after reviewing changed local files |
| `npm run references:contact-sheet` | Generate labeled DC-9-51 contact sheet | Passed; wrote `art-source/references/dc9-51/contact-sheets/dc9-51-contact-sheet.svg` | Pass | Inspect after new visual sources |
| `npm run references:brief` | Generate modeling brief from manifest | Passed; wrote `art-source/references/dc9-51/notes/modeling-brief.md` | Pass | Regenerate after manifest edits |
| `npm run references:check` | Offline aggregate check validates manifest, artifacts, Blender scene, and preview render | Passed after recursive manifest validation; rendered `.cache/references/dc9_reference_overview.png` with Blender 5.1.2 | Pass with warnings | Rerun before reference-pack PR |
| `BLENDER_BIN=/home/user1/.local/bin/blender blender --background --python tools/blender/setup_dc9_reference_scene.py` | Create/update reference scene without touching `dc9_master.blend` | Passed with Blender 5.1.2; saved `art-source/blender/dc9_reference_scene.blend`; warning only: `Material.use_nodes` deprecation for Blender 6.0 | Pass | Track Blender API deprecation before Blender 6 |
| `npm ci` | Install locked dependencies from a portable registry | Passed after normalizing 447 lockfile `resolved` URLs from the internal package gateway to `https://registry.npmjs.org/`; 396 packages installed, 0 vulnerabilities | Pass | Keep lockfile URLs portable |
| `npm run check` | Lint, typecheck, tests, and build pass | Passed after A320 pivot-backed target pass; lint, typecheck, 16 tests, and production build completed | Pass | Rerun after code changes |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pipeline schemas, stage contracts, gate examples, and workflow eval runner validate | Passed after agent gate validation upgrade; 7 tests | Pass | Rerun after pipeline contract changes |
| `npm run pipeline:evals` | Deterministic guardrail evals catch known agent workflow failures | Passed; 6/6 eval fixtures covered Tripo proxy promotion, missing Agent 0 authority, optimization contract breaks, aircraft mixing, and spoiler-leak protection | Pass | Add fixtures for new agent failure modes |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate ...` | Structured gate examples validate for reference authority, runtime contract, material optimization, and browser integration | Passed for all four checked-in example artifacts | Pass | Real milestone gates must validate their own artifact paths |
| `npm run references:validate` | Reference manifest covers checked-in images and verifies recorded hashes | Passed for 24 references | Pass | Rerun after reference-manifest edits |
| 768 / 1440 px visual check | No clipping or blocked controls on the active desktop/tablet target | Captured A320 five-card feedback ATP screenshots at 768 and 1440 px plus wrong-placement 1440 px with no console or page errors; mobile mode explicitly deferred by owner request | Pass | Mobile cockpit UI polish is a later pass |
| DC-9 realism review | Captain view reads as model-correct DC-9 | In-progress against greybox placeholders | In progress | Requires Blender milestone and owner approval |
| Airbus realism review | Correct model-specific cockpit | A320 Cockpit 2 browser proof now applies a runtime FO/right-seat camera lock and controlled app lighting because the exported game camera was centered and imported GLB lights overexposed the scene; owner visual approval still pending | In progress | Owner review before removing proof label or calling final production art |

## 2026-07-09 Airbus pivot-backed First-Officer target evidence

- Final approval-candidate captures were inspected at the approval-blocking 1440 and 768 px widths. The initial and target-visible pairs show the real shaded GLB and all five compact target pins aligned to their intended cockpit controls.
- Supporting checks captured a 375 px sanity view and 768 px reduced-motion view. The 375 px result is informative only, per owner scope.
- Browser evidence:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-initial-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-targets-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-initial-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-targets-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-sanity-375.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-approval-candidate-reduced-motion-768.png`
- The installed `agent-browser` CLI verified the live Vite app with software-WebGL flags. No application errors were observed; the console retains the known Three `Clock` deprecation warning.

- Added five deterministic A320 First-Officer target pivots and invisible hitboxes:
  - `AIRBUS_A320_TARGET_SIDESTICK_PIVOT` / `AIRBUS_A320_TARGET_SIDESTICK_HITBOX`
  - `AIRBUS_A320_TARGET_THRUST_PIVOT` / `AIRBUS_A320_TARGET_THRUST_HITBOX`
  - `AIRBUS_A320_TARGET_GEAR_PIVOT` / `AIRBUS_A320_TARGET_GEAR_HITBOX`
  - `AIRBUS_A320_TARGET_RADIO_PIVOT` / `AIRBUS_A320_TARGET_RADIO_HITBOX`
  - `AIRBUS_A320_TARGET_ALTITUDE_PIVOT` / `AIRBUS_A320_TARGET_ALTITUDE_HITBOX`
- Assembly validation - pass; status `pass`, 5 label targets, 5 pivot-verified label targets, 5 total pivot-verified targets.
- Runtime target coordinate correction - pass; the assembly report records both Blender-space locations and intended runtime locations after Blender-to-glTF axis conversion.
- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_assembly_blender_build.py tools/blender/cockpit_pipeline/a320_assembly_job.py tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py` - pass.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass; Blender 5.1.2, Node v26.3.0.
- `BLENDER_BIN=/home/user1/.local/bin/blender python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-assembly-job` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass.
- `BLENDER_BIN=/home/user1/.local/bin/blender python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; regenerated `public/models/airbus-first-officer.glb`.
- Runtime GLB SHA-256: `d40d50006091230a2a04372cf57ee4ee7f0bfa3bce4bc01ebda05259ca9e482b`; size `39,875,220` bytes.
- `.cache/assets/airbus/asset-report.json` - pass; validation passed with 121 warnings and 127 candidate notes from preserved imported-source limitations; export contract has 149 `game_id` nodes and 150 selected objects.
- Shading validation - pass; runtime node names and `game_id` metadata preserved, missing runtime nodes `[]`, material count `12`.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors or warnings, with five informational `UNUSED_OBJECT` rows for target mesh `TEXCOORD_0`.
- `npm run assets:check` - pass; A320 and DC-9 GLBs have no errors or warnings, with informational unused UV/empty-node rows.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests. The A320 proof verifies GLB-backed projected target mode, then completes card placement through the native keyboard equivalent.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- `git diff --check` - pass.
- Remaining limitation: owner visual approval is still required before removing `A320 PLAYABLE PROOF`; imported source mesh controls outside the five player-facing label targets remain deferred.

## 2026-07-09 Airbus desktop visual correction after owner feedback

Superseded experiment: the contained reference-image backing described below was rejected and removed. The final approval candidate renders the regenerated shaded GLB directly and uses asset-backed projected pins.

- Owner feedback identified the A320 desktop view as visually failed: the sidestick was cut off and the five target boxes were not aligned to the visible controls.
- Repaired the player-facing desktop composition to use the contained `public/images/a320-fo-view.png` backing at 96vw so the full sidestick and center pedestal remain visible at 1440x900.
- Kept `public/models/airbus-first-officer.glb` loaded for runtime contract and target collider proof, but hid non-collider GLB meshes in this temporary visual repair because the direct GLB-only render remained too dark for owner-facing target placement.
- Playwright desktop screenshot captured and inspected: `/tmp/a320-desktop-fixed.png`.
- Final measured target boxes at 1440x900:
  - sidestick `x=1267 y=536 w=86 h=153`
  - thrust `x=252 y=622 w=202 h=117`
  - gear `x=594 y=419 w=65 h=126`
  - radio `x=525 y=680 w=187 h=90`
  - altitude `x=295 y=173 w=302 h=50`
- `npm run typecheck` - pass during repair loop.
- Remaining limitation: this is a desktop visual correction, not final direct GLB-only visual approval.

## 2026-07-09 Airbus production-ready approval candidate evidence

- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py` - pass.
- `python3 -m tools.blender.cockpit_pipeline.preflight` - pass earlier in this run; Blender 5.1.2, Node v26.3.0, Git LFS available, dirty worktree expected for this implementation.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass after making missing Sketchfab viewer/parity files optional and making the contact sheet skip absent optional parity renders.
- Shading validation - pass; runtime node names, `game_id` metadata, UV layers, and approved assembly immutability preserved; dimension drift `0.0`.
- Loose-fragment cleanup - pass; quarantined `AIRBUS_A320_STATIC_119_OBJECT_93_001`, `AIRBUS_A320_STATIC_120_OBJECT_94`, `AIRBUS_A320_STATIC_121_OBJECT_95`, and `AIRBUS_A320_STATIC_122_OBJECT_96_001` in `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/loose-part-review-report.json`.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; regenerated `public/models/airbus-first-officer.glb` through the normal asset exporter.
- Runtime/staged GLB SHA-256: `c94ada9dbfe7bdfb29d3a75071120a1823c6963a0de2b6d3f815900974d9ac8b`; size `39,849,104` bytes.
- `strings public/models/airbus-first-officer.glb` quarantine check - pass; no quarantined `OBJECT_93` through `OBJECT_96` runtime names found in the deployable GLB.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-shading/manifests/shading-complete.json` - pass; hashes verified.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- Playwright browser screenshots captured from `http://127.0.0.1:5173/` after real A320 GLB load; each capture had 5 targets, zero `CLOCK` cards, visible canvas, and no console or page errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-375-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1440-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-1920-airbus-fo.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-shading/browser-768-airbus-fo-reduced-motion.png`
- Remaining limitation: owner visual approval is still required before removing `A320 PLAYABLE PROOF` or calling this final production Airbus cockpit art; direct imported-control pivots remain deferred.

## 2026-07-04 Review repair evidence

- `git ls-files public/models/airbus-first-officer.glb public/images/a320-cockpit-integration-proof.png` - pass; both runtime assets are now tracked in the patch.
- `npm run assets:check` - pass; A320 GLB reported no errors, warnings, infos, or hints; existing DC-9 validator info rows remain.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed, including the A320 GLB 200-response integration proof.
- `npm run check` - pass; lint, typecheck, 9 Vitest tests, and production build completed.

## 2026-07-04 Broader worktree stabilization evidence

- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass after refreshing report hashes.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-shading/manifests/shading-complete.json` - pass after refreshing the shaded `.blend`, report, and assembly input hashes.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` - pass; 8 tests.
- `npm run pipeline:evals` - pass; 6/6 guardrail eval fixtures.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.

## 2026-07-04 PR conflict-resolution evidence

- `npm run check` - pass after merging `origin/main` into the A320 browser integration proof branch.
- `npm run assets:check` - pass after conflict resolution; A320 GLB reported no errors, warnings, infos, or hints, and existing DC-9 validator info rows remain.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-shading/manifests/shading-complete.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed, including the A320 GLB 200-response proof.

## 2026-07-04 Opening page refinement evidence

- `npm run check` - pass after replacing the generic whole-game briefing with a spoiler-safe A320 First-Officer opening screen.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed after updating the opening heading expectation.
- Playwright screenshots captured and reviewed at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-375.png`

## 2026-07-04 Player-facing title rename evidence

- `npm run check` - pass after changing the player-facing game title to `The Captain's Key`.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed after updating the opening heading expectation.
- Playwright screenshots refreshed and reviewed at 1440, 768, and 375 px with the new title:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-375.png`

## 2026-07-04 First-officer opening image evidence

- Promoted owner-provided screenshot `/home/user1/Pictures/Screenshots/F0-view.png` to `public/images/a320-fo-view.png` for the opening hero image.
- `npm run check` - pass after switching the opening hero image and tuning the crop toward the FO/right-seat station.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests passed.
- Playwright screenshots refreshed and reviewed at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/opening-375.png`

## 2026-07-06 Airbus direct-GLB playable proof evidence

- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; exported the owner-cleaned shaded A320 source to `public/models/airbus-first-officer.glb`.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `python3 -m unittest tools.blender.cockpit_pipeline.tests.test_pipeline_contracts` - pass; browser integration schema example still validates after renaming the gate field to `spoilerProtectionChecked`.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 2 test files and 9 tests.
- `npm run build` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests including the A320 playable proof GLB check.
- `npm run assets:check` - pass; A320 has no errors, warnings, infos, or hints, with existing DC-9 validator info rows still present.
- Playwright screenshots refreshed and reviewed at 1440, 768, and 375 px with the real GLB visible from the exported First-Officer seat camera:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-playable-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-playable-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-playable-375.png`

## 2026-07-06 Airbus First-Officer playable repair evidence

- Generated a UI concept reference with the built-in image tool:
  - `/home/user1/.codex/generated_images/019f3663-2316-73a1-a793-3ac8fa73f84e/ig_030598814eb65800016a4b5f4875c0819995d4974d9af1afb6.png`
- Reproduced the pre-fix broken Airbus phase locally:
  - `.cache/screenshots/pre-fix-airbus-1440.png`
- `npm run test -- src/game/state.test.ts` - pass; 7 reducer tests including card move/retry behavior.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 2 test files and 10 tests.
- `npm run build` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium smoke tests cover the A320 GLB response, no Airbus comboboxes, card/target placement, full game progression, and reload persistence.
- `npm run assets:check` - pass; A320 has no errors, warnings, infos, or hints, with existing DC-9 validator info rows still present.
- `npm run check` - pass; lint, typecheck, 10 Vitest tests, and production build completed.

## 2026-07-06 Airbus wide runtime camera evidence

- Changed the Airbus gameplay camera to preserve `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` position/quaternion while using a 68 degree runtime FOV.
- Retuned mobile target spacing for the wider cockpit view.
- Playwright direct-GLB screenshot pass captured and reviewed canvas opacity 1 with no console errors at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-375.png`

## 2026-07-06 Airbus top tray simplification evidence

- Removed the visible `Place each cockpit label` heading while preserving a screen-reader-only section heading.
- Moved the Airbus card tray closer to the top of the viewport and reduced card height.
- Removed `Ready` and `Decoy` from unplaced cards; card faces now show only the label until placed.
- Playwright screenshot pass captured 1440, 768, and 375 px with canvas opacity 1, no console errors, no visible heading, and `CLOCK` card text reduced to `CLOCK`:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-375.png`
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium tests.
- `npm run lint` - pass.
- `npm run test -- src/game/state.test.ts` - pass; 7 reducer tests.

## 2026-07-06 Airbus direct cockpit hotspot evidence

- Replaced visible cockpit placeholder slots with transparent HTML drop hotspots aligned to the A320 cockpit parts.
- Dragging a card over a part now applies an outline highlight to that part; dropping the card directly on the part assigns it.
- The accessible click/keyboard path is preserved through the same named target buttons.
- Retuned hotspot geometry so the sidestick outline sits on the sidestick itself, thrust/radio are aligned to their rendered cockpit areas, altitude sits on the glare-shield/FCU strip, and narrow portrait view uses a wider runtime FOV so the sidestick is visible before highlighting.
- Updated gameplay after owner feedback: valid and decoy cockpit objects both accept cards, no cockpit object is visually highlighted until a card is dragged over it, and correctness is judged only after all six cards are placed.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests, including hidden pre-drag hotspots, hotspot drag-enter highlight, decoy placement, full Verify-to-locker transition, and reload persistence.
- `npm run lint` - pass.
- `npm run test -- src/game/state.test.ts` - pass; 8 reducer tests including decoy placement without early grading.
- `npm run check` - pass; lint, typecheck, 11 Vitest tests, and production build completed.
- `git diff --check` - pass.
- Playwright screenshot pass captured desktop/tablet widths 1440 and 768 px with canvas opacity 1, no console errors, no pre-drag cockpit highlights, no visible `Drop card` cockpit placeholders, and no visible `Place each cockpit label` heading:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
- Sidestick hotspot highlight screenshot captured after GLB load:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-hotspot-highlight-1440.png`
- Decoy hotspot highlight screenshot captured after GLB load:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-decoy-highlight-1440.png`
- Playwright browser QA used because the Browser plugin runtime was not available in this session. Manual script checks passed for pointer drag placement, keyboard-only placement, wrong-card retry, reduced-motion mode, and `?skip3d=1` completion with no console errors.
- Playwright screenshots captured and reviewed at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-repair-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-repair-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-repair-375.png`
- Superseded limitation: the static source-review cockpit backing has been removed from the Airbus gameplay phase by the direct-GLB camera repair below. Owner visual approval, individual pivots, and live display treatments remain future work.

## 2026-07-06 Airbus direct-GLB camera repair evidence

- `/home/user1/.local/bin/blender --version` - Blender 5.1.2.
- Blender source camera probe rendered `.cache/screenshots/a320-direct-camera-before.png`; reimported GLB camera probe rendered `.cache/screenshots/a320-imported-glb-camera.png`.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; exported `public/models/airbus-first-officer.glb`.
- `public/models/airbus-first-officer.glb` - 35,098,268 bytes; SHA-256 `033438f0674423356a64e1b2d9f9430072e65790670ab5cdbbcd62c61b9eedff`.
- `.cache/assets/airbus/validation.json` - pass; 147 existing proof-stage warnings remain for unapplied/unverified candidate meshes, with no `CAM_AIRBUS_*` camera metadata warnings.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run test -- src/game/state.test.ts` - pass; 7 reducer tests.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 3 Chromium tests cover the A320 GLB response, no Airbus comboboxes, card/target placement, real Verify-to-locker transition, and reload persistence.
- `npm run assets:check` - pass; A320 has no errors, warnings, infos, or hints, with existing DC-9 validator info rows still present.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- Manual Playwright QA passed for wrong-card retry, keyboard-only placement, hint, reduced-motion mode, and real Verify-to-locker completion with no console errors.
- Direct-GLB Playwright screenshots captured and reviewed with canvas opacity 1 and no console errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-direct-glb-375.png`
- `npm run check` - pass; lint, typecheck, 10 Vitest tests, and production build completed.

## 2026-07-07 Airbus ready gate and ATP deferral evidence

- Hid the Airbus card tray, cockpit hotspots, dock controls, and ATP question until the A320 GLB camera-ready callback fires; the early load state now shows only cockpit loading text.
- Deferred the ATP flight-hours question until all six cards are placed and the five real cockpit controls are correct.
- Removed the `1500` placeholder and added stale-save cleanup so Airbus saves reload with a blank ATP answer.
- Removed the temporary browser-only display reflection after owner review; the FO-side display now comes only from the GLB render.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 13 focused reducer/storage tests.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests cover hidden initial ATP, blank ATP reveal, wrong full-board ATP hiding, real Verify-to-locker transition, and reload persistence.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `git diff --check` - pass.
- Playwright ready-gated screenshot pass captured desktop/tablet widths 1440 and 768 px with early state card count 0, ATP count 0, settled canvas opacity 1, no console errors, no ATP question before board completion, and the A320 cockpit visible behind the cards:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-ready-gated-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-ready-gated-768.png`

## 2026-07-07 Vercel cockpit preview loading evidence

- Diagnosed protected preview `dpl_HQmr9mCGDGRbyAgRrTiGTzdCx619`; Vercel build was Ready and produced the expected Vite app shell and JS chunk.
- `npx vercel curl /models/airbus-first-officer.glb --deployment https://cockpit-escape-room-oo8parvv2-ottoagent007-gmailcoms-projects.vercel.app -- --head` showed the deployed Airbus runtime GLB was only 133 bytes, matching the Git LFS pointer instead of the 35,098,268-byte cockpit model.
- `git cat-file -s HEAD:public/models/airbus-first-officer.glb` returned 133 and `git show HEAD:public/models/airbus-first-officer.glb` showed the `version https://git-lfs.github.com/spec/v1` pointer for SHA-256 `033438f0674423356a64e1b2d9f9430072e65790670ab5cdbbcd62c61b9eedff`.
- Updated `.gitattributes` so deployable `public/models/*.glb` files are normal Git blobs while source/staged `.glb` files remain under LFS.
- Staged tree check confirmed `public/models/airbus-first-officer.glb` is now a 35,098,268-byte plain Git blob whose first bytes are `glTF`.
- `git diff --check` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run assets:check` - pass; A320 has no errors, warnings, infos, or hints, with existing DC-9 validator info rows still present.
- `npm run build` - pass.
- Pushed commit `c1c5981` and Vercel built preview `dpl_2DuN1koZ8WxSPHzVvbqefTYxYa65` from commit `c1c5981`.
- `npx vercel curl /models/airbus-first-officer.glb --deployment https://cockpit-escape-room-2ig7xn4kg-ottoagent007-gmailcoms-projects.vercel.app -- --head` - pass; deployed GLB now returns `content-type: model/gltf-binary` and `content-length: 35098268`.

## 2026-07-08 Airbus production-readiness browser lighting proof

- Added `plans/0004-a320-cockpit-production-readiness.md` for the A320 browser-proof checkpoint.
- Tuned `src/scenes/PrototypeScene.tsx` so the A320 runtime uses a named `AirbusRuntimeLighting` rig with ambient, hemisphere, directional, and point fills.
- Kept the exported `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` camera path and retained constrained FO OrbitControls with no pan, no Airbus zoom, a fixed look distance, and explicit polar/azimuth limits.
- Switched Canvas shadows to `percentage`, removing the repeated deprecated `PCFSoftShadowMap` warning from new captures; the remaining browser warning is the pre-existing Three `Clock` deprecation.
- No generated GLBs were edited or regenerated for this checkpoint.
- Baseline browser screenshots captured at 1440, 768, and 375 px:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-before-375.png`
- Post-change browser screenshots captured at 1440, 768, and 375 px with no app console errors and no pre-drag hotspot outlines:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-lighting-375.png`
- Browser plugin tools were not available in this session, so Playwright was used for browser evidence.
- A direct mouse-drag orbit screenshot attempt was discarded because the Playwright page closed during the action; orbit behavior is covered by code review of `LimitedOrbitControls` constraints and the GLB/canvas smoke path.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests cover the A320 GLB load, hidden initial ATP, hotspot drag-enter highlight, decoy placement, Verify-to-locker transition, and reload persistence.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, with existing DC-9 informational rows still present.
- `git diff --check` - pass.
- Remaining limitation: owner visual approval is still required before removing `A320 PLAYABLE PROOF` or treating this as final production Airbus cockpit art.

## 2026-07-08 Airbus FO-view likeness correction

- Owner clarified that the production cockpit should keep the wide gameplay composition from `airbus-production-lighting-1440.png`; `public/images/a320-fo-view.png` is the visual likeness reference for material/render treatment, not a tighter camera-framing target.
- Rechecked the live Sketchfab model page for `A320 Cockpit 2`; the public page still identifies the same downloadable CC Attribution source model, but the detailed render stack remains better captured in the repo's extracted parity files.
- Reused the earlier A320 Sketchfab parity evidence: Studio-style lighting, three directional lights, matcap/reflection contribution, SSAO, SSR/TAA reference behavior, sharpen, vignette, and grain were recorded in `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-viewer-settings.json` and related shading reports.
- Added an Airbus-only dependency-free post-process path in `src/scenes/PrototypeScene.tsx` with Three example passes: `EffectComposer`, `RenderPass`, `SSAOPass`, `ShaderPass`, and `OutputPass`.
- The custom final shader applies subtle sharpen, subdued vignette, and tiny static grain. It is intentionally static so reduced-motion behavior is not affected.
- Restored the wide runtime camera constants to `68` degrees for desktop/tablet and `92` degrees for narrow portrait.
- Tested a runtime material/environment parity direction and backed it out because it over-brightened the panel and drifted farther from the dark blue-gray FO-view reference. The remaining visual delta should be handled in a Blender/source material pass, not by broad runtime material mutation.
- No `.blend` source, generated GLB, runtime node names, pivots, hierarchy, or `game_id` metadata changed in this checkpoint.
- Wide post-process screenshots captured at 1440, 768, and 375 px with no app console errors and no pre-drag hotspot outlines:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-375.png`
- Final current-state material-parity screenshots recaptured at 1440, 768, and 375 px with no app console errors:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-1440.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-768.png`
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-material-parity-375.png`
- 1920x1080 comparison capture against the `FO-view.png` reference size:
  - `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-sketchfab-post-1920.png`
- Browser plugin tools were not available in this session, so Playwright was used for browser evidence.
- Console notes: captures still show the pre-existing Three `Clock` deprecation warning and occasional WebGL `ReadPixels` performance warnings from screenshots; no app errors were observed.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- `npm run assets:check` - pass; A320 GLB has no errors, warnings, infos, or hints, with existing DC-9 informational rows still present.

## 2026-07-08 A320 production-ready approval candidate

- Owner rejected this A320 Cockpit 2 shading pass on 2026-07-08. The tracked `a320-cockpit-2-shading` build, job, stage input, asset report, and preview-render artifacts were removed from the working tree so they are not mistaken for approval evidence.
- Added `plans/0005-a320-cockpit-production-ready-candidate.md` for the owner-reviewable A320 production-candidate milestone.
- Updated `tools/blender/cockpit_pipeline/a320_shading_job.py` and `tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` so the A320 shading pass consumes `asset-reports/cockpit-pipeline/a320-cockpit-2-shading/sketchfab-material-parity-summary.json` as a formal input.
- The regenerated source material pass preserves source texture links and UVs, maps cached Sketchfab material-channel values into portable Principled BSDF roughness/metallic/base/emissive settings, and records matcap/reflection contribution as material metadata.
- Updated `tools/blender/validate_scene.py` so imported visual candidates without runtime `interaction` metadata are reported as `candidateNotes`; real warnings now focus on imported scale and no-UV source limitations.
- First `npm run test:e2e -- e2e/smoke.spec.ts` attempt failed because the regenerated GLB lacked `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`, leaving the Airbus card tray gated behind cockpit loading. The Blender shading script now recreates and validates that runtime camera before export.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli run-a320-shading-job` - pass after runtime-camera repair.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` - pass; exported `public/models/airbus-first-officer.glb`.
- `public/models/airbus-first-officer.glb` - 39,871,920 bytes; SHA-256 `97deb0f7f2dc9fba3e9b046b621c6afe35a2dda4d6752f6a48eb8b073206fcc2`.
- `.cache/assets/airbus/asset-report.json` - pass; Blender 5.1.2, 144 selected export objects, 140 `game_id` nodes, 129 imported-source warnings, 131 visual-candidate notes, and approval cameras `AIRBUS_A320_CAM_COMPLETE_INTERIOR_APPROVAL` plus `AIRBUS_A320_CAM_FIRST_OFFICER_APPROVAL`.
- `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/validation-report.json` - pass; runtime node names, `game_id` metadata, UV layers, source texture links, approved assembly immutability, and reimport validation all passed.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/a320-cockpit-2-assembly/manifests/assembly-complete.json` - pass after refreshing the runtime-contract artifact hash.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/a320-cockpit-2-runtime-contract.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/a320-cockpit-2-material-optimization.json` - pass.
- `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/a320-cockpit-2-browser-integration-proof.json` - pass.
- `npx gltf-transform validate public/models/airbus-first-officer.glb` - pass; no errors, warnings, infos, or hints.
- `npm run assets:check` - pass; A320 GLB had no errors, warnings, infos, or hints, and existing DC-9 informational rows remain.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run test` - pass; 13 Vitest tests.
- `npm run pipeline:evals` - pass; 6/6 eval fixtures.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass after runtime-camera repair; 4 Chromium tests.
- `npm run check` - pass; lint, typecheck, 13 Vitest tests, and production build completed.
- Superseded Blender/source approval renders and Playwright production-candidate screenshots were removed after owner rejection.
- Remaining limitation: this is an owner-reviewable approval candidate, not final visual approval. Keep `A320 PLAYABLE PROOF` until owner approval is recorded.
- Remaining limitation: imported source meshes still have documented unapplied-scale/no-UV warnings and visual-candidate metadata notes; direct 3D control pivots are not promoted in this pass because browser hotspots remain the supported accessible interaction path.

## 2026-07-08 A320 five-card feedback simplification

- Added `plans/0006-a320-five-card-feedback-simplification.md` for the Airbus gameplay/UI simplification.
- Removed the active `CLOCK` card from Airbus First-Officer onboarding.
- Restored the ATP answer input and Verify button after owner correction; they appear only after all five labels are correct.
- The active Airbus flow now uses five visible label cards: `SIDESTICK`, `THRUST`, `GEAR`, `RADIO`, and `ALTITUDE`.
- Visible placement boxes now show immediate feedback: green for correct labels and red for wrong labels. Wrong labels remain recoverable by selecting or dragging another card.
- Completing all five labels now reveals the ATP question; entering `1500` advances to the locker and records `firstOfficer` completion.
- Kept legacy clock and decoy state fields for saved-game compatibility. A stale Airbus ATP answer is cleared on load so the question is answered fresh.
- Moved the Airbus status/instructions dock to the lower-right and reduced its desktop/tablet footprint.
- Owner clarified during implementation to forget mobile mode. Mobile cockpit UI polish is deferred and is not a pass/fail criterion for this checkpoint.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
- `npm run typecheck` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests cover no `CLOCK` card, ATP hidden until labels are correct, immediate red/green placement feedback, recovery, ATP submission, locker transition, GLB load, and reload persistence.
- `npm run lint` - pass.
- `npm run test` - pass; 16 Vitest tests.
- `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.
- Superseded five-card screenshots were removed from the working tree at owner request. Use `preview-renders/cockpit-pipeline/a320-cockpit-2-browser-integration/airbus-production-wide-sketchfab-post-1440.png` as the visual pickup baseline until a replacement proof is captured.

## 2026-07-08 A320 rejected-artifact cleanup and dock repair

- Deleted the rejected `a320-cockpit-2-shading` tracked artifact families from the working tree: shaded build outputs, shading job manifest/approval, shading input recipes, shading asset reports, and shading preview renders.
- Removed untracked bad browser evidence captures from the latest pass while keeping `airbus-production-wide-sketchfab-post-1440.png` as the owner-selected pickup baseline.
- Tightened the Airbus instructions dock so it stays as a compact lower-right panel instead of spanning the bottom of the viewport.
- Verified the active Airbus UI renders exactly five cards and no `CLOCK` card.
- `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `git diff --check` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
- Local-only Playwright proof: `.cache/screenshots/a320-right-dock-no-clock-1440.png`; viewport 1440 x 900, dock box `x=1081.6 y=716.3 width=336 height=161.3`, no console errors, cards `SIDESTICK`, `THRUST`, `GEAR`, `RADIO`, `ALTITUDE`, and `CLOCK` count 0.

## 2026-07-08 A320 FO-seat camera and color repair

- Confirmed the owner-reported dev server failure in `.cache/screenshots/current-a320-dev-before-fix-1440.png`: centered between-seat camera, nearly black/white cockpit, five cards, no `CLOCK` card, and compact lower-right dock.
- Root cause for the wrong viewpoint: exported `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW` is centered at `x=0`. `src/scenes/PrototypeScene.tsx` now applies a runtime FO/right-seat offset and inward yaw before locking the Airbus look controls.
- Root cause for the washed render: the GLB imports high-intensity `Sun` directional lights, which were stacked with app lighting. Runtime now disables imported GLB lights and uses controlled Airbus scene lights.
- Browser proof after repair: `.cache/screenshots/a320-fo-seat-color-final-1440.png`; FO/right-seat biased view, colored A320 panels/controls, five cards, no `CLOCK` card, projected target layer, and compact lower-right dock.
- Responsive evidence: `.cache/screenshots/a320-fo-seat-color-final-768.png` and `.cache/screenshots/a320-fo-seat-color-final-375.png`; both showed five cards, no `CLOCK` card, projected target layer, and no page console errors.
- Blender cleanup boundary: no live Blender add-on listener was available on `127.0.0.1:9876`; only the `blender-mcp` wrapper process was running. Background inspection of `art-source/cockpit-pipeline/stages/assembly/output/a320-cockpit-2-assembly/a320-cockpit-2-assembly.blend` found one scene, one collection, zero cameras, and no suspicious temp/default objects to delete.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.

## 2026-07-08 A320 saved FO camera recovery

- Looked back through memory, git history, and PRs after the owner flagged that the Blender view should not require reconstructing the camera.
- Memory and PR #31 confirmed the intended workflow: open `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend` and use its saved `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`.
- Recovered the old shaded `.blend` LFS object from commit `d23ad95` into `.cache/blender-history/a320-cockpit-2-shaded-d23ad95.blend`.
- Background Blender inspection of that recovered file found active `CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW`: location `(0.167669, -0.695658, 0.140411)`, Euler rotation `(1.367064, 0, 0.282213)`, lens `50`, and camera angle `0.691111`.
- Blender MCP live scene was switched to that recovered file and exact saved camera with material preview and overlays off.
- Updated `tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` so future shaded exports write the recovered saved FO camera transform instead of the centerline camera.
- Updated `src/scenes/PrototypeScene.tsx` so the temporary FO offset/yaw repair only applies when the loaded legacy GLB camera is still centered. Future regenerated GLBs with the saved FO camera will not be double-offset.
- `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py` - pass.
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- Live browser verification on the PR working tree: Vite at `http://127.0.0.1:4187/`, Playwright 1440 x 900 capture `.cache/screenshots/current-a320-fo-mode-live-1440.png`; FO/right-seat biased colored cockpit view, projected target layer, five cards, no `CLOCK` card, and no page console errors. The screenshot remains local cache, not committed preview evidence.
- PR validation batch before commit:
  - `git diff --check` - pass.
  - `python3 -m py_compile tools/blender/cockpit_pipeline/a320_shading_blender_apply.py tools/blender/cockpit_pipeline/a320_shading_job.py tools/blender/validate_scene.py` - pass.
  - `npm run test -- src/game/state.test.ts src/game/storage.test.ts` - pass; 16 focused reducer/storage tests.
  - `npm run assets:check` - pass; A320 reports no glTF errors/warnings/infos/hints, and DC-9 retains existing informational unused texcoord/empty-node rows.
  - `npm run pipeline:evals` - pass; 6/6 eval fixtures.
  - `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate ...` - pass for runtime contract, material optimization, and browser integration artifacts.
  - `npm run test:e2e -- e2e/smoke.spec.ts` - pass; 4 Chromium tests.
  - `npm run check` - pass; lint, typecheck, 16 Vitest tests, and production build completed.

## 2026-07-10 - Locker room reveal proxy milestone

Historical checkpoint; the 2026-07-11 transition and Tripo-intake sections above supersede its current-state limitations.

### Delivered

- Replaced the procedural locker sphere with a validated `LOCKER_ROOT` GLB, four stable memory contracts, and a gated captain's-hat contract.
- Preserved the personalized 1,000-hour and Anthony Munoz questions with natural answer variants, safe repeated-wrong clues, and no progress loss.
- Added Wings and Charging Bull inspection memories, an any-order four-memory gate, an upper-cubby reveal, and an explicit promotion continuation into Captain Mode.
- Added schema-v4 persistence and a v3 migration that preserves First-Officer and completed later-phase progress.
- Added keyboard/native HTML equivalents, live feedback, reduced-motion behavior, responsive locker UI, real 3D prop picking, and GLB retry/accessibility fallback.

### Asset evidence

- Blender 5.1.2; `npm run asset:locker` passed with 0 scene errors and 0 scene warnings.
- `public/models/locker-room.glb`: 430,148 bytes, 51 selected objects, 5 `game_id` nodes, 8 materials, 0 textures, no destructive optimization.
- Blender approval renders: `.cache/assets/locker/previews/cam_locker_approval_hero.png` and `cam_locker_approval_detail.png`.
- Browser proof: `/tmp/locker-real-fixed3-1440.png`; generated proxy geometry remains visibly labeled as the locker reveal scene.

### Validation

- `npm run check` - pass: lint, typecheck, 32 Vitest tests, production build.
- `npm run assets:check` - pass; informational unused UV/empty-node rows only.
- `npm run pipeline:evals` - pass, 6/6.
- `npm run test:e2e -- e2e/locker-room.spec.ts` - pass, 4/4 after loader-fallback coverage was added.
- Full `npm run test:e2e` - pass, 11/11 including final locker failure/retry/fallback coverage.
- `git diff --check` - pass.

### Remaining delta

- Import and clean the owner-supplied Tripo watch, baseball, wings, Charging Bull, and captain's hat while preserving the tested contract parents and identifiers.
- Replace the explicit Charging Bull story placeholder with Pop T's exact investing advice.
- Capture a Vercel preview and owner approval before removing the proxy label or advancing the visual gate. Refreshed local evidence is `/tmp/locker-proxy-1440.png`, `/tmp/locker-proxy-768.png`, and `/tmp/locker-proxy-375.png`.

## 2026-07-11 Locker Bull-to-Wings reveal

- Blender 5.1.2 rebuilt `art-source/blender/locker_room_master.blend` and `public/models/locker-room.glb` through `npm run asset:locker`.
- The Charging Bull now occupies the middle position on `LOCKER_ENV_MEMORY_SHELF`; the Wings occupy the upper position. Stable node names, colliders, and `game_id` values are unchanged.
- Correct Watch completion automatically logs/reveals the Bull and settles `bull-focus`; `Continue to airline wings` logs/reveals the Wings and settles `wings-focus`.
- Removed the passive next-memory and hidden-hat sentences. The Watch dialog title is `Rolex GMT-Master`; Bull and Wings use owner-supplied copy.
- GLB: 27,253,492 bytes; SHA-256 `03d13d9e596ad77b7ca540f19a4826316d7467bdd7fe4d978bf48e71abcbf757`. Cache-busted browser bytes matched disk exactly.
- Pass: 33/33 focused state/storage tests, 5/5 focused locker Chromium tests, `npm run check`, 12/12 full Chromium tests, `npm run assets:check`, 6/6 pipeline evals, and `git diff --check`.
- Visual proof inspected at 1440, 768, and 375 widths: `.cache/assets/locker/browser/locker-bull-focus-1440.png` and `locker-wings-focus-{1440,768,375}.png`.
- Browser console had no application errors. Observed warnings were the existing Three.js Clock deprecation and screenshot-time WebGL `ReadPixels` stalls.
- Remaining gate: Vercel preview and owner visual approval.
- Baseball candidate intake: preserved from `/mnt/2TBHDD/Downloads/baseball+3d+model.glb` at SHA-256 `75dda2bf01c8c8863820ec25750ef2f1b15940ccfeb1b1c56d8d0b548d5ab19e`. The Tripo source has one 1,971,968-triangle mesh and three 1024 textures; it is not runtime-ready.

## 2026-07-11 Baseball memory import and playable reveal

- Imported the preserved baseball source through Blender 5.1.2 with stable nodes `LOCKER_PROP_BASEBALL`, `LOCKER_PROP_BASEBALL_MESH`, and `LOCKER_HITBOX_BASEBALL`; the source SHA-256 is `75dda2bf01c8c8863820ec25750ef2f1b15940ccfeb1b1c56d8d0b548d5ab19e`.
- Updated the ordered locker loop to watch → baseball question → Charging Bull → Wings → captain's hat while preserving schema version 5, local saves, wrong-answer retries, accented/unaccented Anthony Muñoz answers, keyboard/native controls, reduced motion, and fallback mode.
- `npm run asset:locker` - pass; `npm run assets:check` - pass; `npm run pipeline:evals` - pass (6/6); `npm run check` - pass; `npm run test:e2e -- e2e/locker-room.spec.ts` - pass (5/5); `git diff --check` - pass.
- Runtime GLB: 31,326,884 bytes; SHA-256 `ea8c3795e3ad0bc90556a056672a539f6431044ccbe66bd70636f50512184338`. Browser response bytes matched disk, canvas exposed `LOCKER_PROP_BASEBALL`, and Playwright reported no application console errors.
- Blender approval render: `.cache/assets/locker/previews/cam_locker_approval_baseball.png`. Actual-browser captures inspected at 1440, 768, and 375 widths: `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, `/tmp/baseball-locker-375.png`. The revealed screenshot shows the baseball on the lower shelf left of the watch with the accessible question open.
- The importer target is 48,000 triangles, but Blender's decimator produced 113,634 for this candidate; it remains an owner-review optimization delta. The candidate has a visibly speckled surface in the approval render and browser capture.
- `agent-browser` was attempted but Chrome could not launch due the host sandbox restriction (`No usable sandbox`); repository Playwright was used as fallback. No commit or deployment was made. Remaining gate: owner visual approval.

## 2026-07-11 Locker layout revision

- Moved the baseball to `(0.05, -0.48, 1.34)` on a dedicated shelf above the watch, Charging Bull to `(0.42, 0.48, 2.03)` on the higher shelf, and Wings to `(0.42, -0.06, 2.55)`.
- Regenerated the master and GLB through Blender/`npm run asset:locker`. Final GLB: 29,539,664 bytes; SHA-256 `7afc3778aca9e1518d7285379a8f70a334969b4a51e76c816f95b065a40efb4e`.
- Inspected updated Blender renders and actual-browser captures at 1440/768/375. Browser bytes matched disk, `LOCKER_PROP_BASEBALL` remained present and revealed, and no console errors were reported.
- The current baseball remains a temporary owner-review candidate; a future baseball download can replace its source while preserving the stable contract.

## 2026-07-11 Baseball source replacement

- Preserved the previous baseball source and staged the new download at `.cache/cockpit-pipeline/sources/locker/baseball/original/baseball+3d+model-20260711.glb`.
- New source hash: `1fb4a5ae2ced1e9500b4730127da3febdc03787af886a314756e8a61e8de06cd`; source size 16,385,168 bytes; runtime baseball reduced to 20,492 triangles with 1024px staged textures.
- Regenerated runtime GLB: 25,025,584 bytes; SHA-256 `23a8b567e1f511842a71a1d2b8d5a92e2d2a9b0e572021801de26a7f16d12911`.
- Browser evidence: runtime bytes matched disk, `LOCKER_PROP_BASEBALL` was present and revealed, and no application console errors were reported. The new baseball is visibly seated on the requested shelf.
## 2026-07-11 Locker baseball/Bull visual and question repair

- Moved the baseball and shelf to the right locker bay at `(0.64, -0.48, 1.34)` / `(0.64, -0.48, 1.17)`, tightened the opening watch macro camera, and reduced the desktop status card to 20rem.
- Anthony Muñoz is now a four-choice question with Orlando Pace, Johnathan Ogden, and Art Shell. Charging Bull now follows baseball as a required multiple-choice gate: Warren Buffett, Benjamin Franklin, Albert Einstein (correct), and John D. Rockefeller.
- New baseball material treatment keeps only the base-color texture, enables smooth shading, and removes the candidate normal/roughness/metallic links. Remaining grain is intrinsic to the base-color image and is recorded as owner-review art limitation.
- Blender master and deployable GLB were regenerated without manual GLB edits. Final GLB: 23,834,824 bytes, SHA-256 `3678d8c797d9fe7cf65a8b91bcac0023a653c085df66009b574a9e7825f539e4`.
- `npm run assets:check` passed; `npm run pipeline:evals` passed 6/6; `npm run check` passed; `npx playwright test e2e/locker-room.spec.ts` passed 5/5; `git diff --check` passed.
- Actual-browser Playwright evidence at 1440, 768, and 375 px: `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, `/tmp/baseball-locker-375.png`. Runtime bytes matched disk, real baseball node was present/revealed, and no console errors were reported.

## 2026-07-11 Locker prop grain repair

- Research identified high-frequency normal/roughness/base-color maps as the primary grain source; glTF materials for baseball, Bull, and Wings now use controlled solid matte materials in Blender and the runtime defensively disables their maps.
- The baseball scan also had perforated micro-geometry, so Blender replaces only its runtime candidate mesh with a smooth centered sphere under the same stable node and collider contract. The original source GLB remains untouched.
- Browser evidence after the repair: `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, `/tmp/baseball-locker-375.png`; all three props render cleanly, runtime bytes match disk, and no console errors were reported.
- Final deployable GLB: 20,723,224 bytes, SHA-256 `108d988705a7924a042959a7c5bae3ea31a0bc5e63830d935aadc55c6451bd23`; source baseball remains preserved separately from the 2,208-triangle smooth review proxy.

## 2026-07-11 Corrective locker prop visual pass

- Rejected the owner-disapproved generic white baseball and flat materials. Rebuilt the baseball with clean leather plus two red curved seams, voxel-cleaned the Bull into a bronze silhouette, and retained Wings detail with a stylized gold atlas.
- Actual-browser evidence at 1440/768/375 shows no white UV blocks, no scan speckle on Bull, readable red baseball seams, crisp gold Wings, matching GLB response bytes, and no console errors.
- Final GLB: 26,594,784 bytes, SHA-256 `893ae4dcd628ab43af1d3f9a9b50f5fcfefc1d3669ef7dfefee7510683089010`.
- Updated and validated `.agents/skills/blender-visual-repair/SKILL.md` with scan-noise classification, identity-preservation, UV-atlas browser-gate, unlit/emissive warnings, recognizable-feature reconstruction, and shared-decimator scope guardrails. Updated and validated `.agents/skills/blender-browser-visual-gate/SKILL.md` so accepted GLB changes also require a new manual runtime cache version.
- Validation: `npm run assets:check` passed; `npm run pipeline:evals` passed 6/6; `npm run check` passed with 35 unit tests; focused locker Playwright passed 5/5; full `npm run test:e2e` passed 12/12; skill validation and `git diff --check` passed. `agent-browser` remains unavailable on this host because Chrome reports no usable sandbox; repository Playwright was used.
- No-cache browser verification matched 26,594,784 runtime bytes to disk, found the real `LOCKER_PROP_BASEBALL` node in its revealed state, and reported no application console errors. The export contains 52 selected objects, five `game_id` nodes, ten materials, and thirteen textures.
- Full-diff review caught and repaired a shared decimator regression before handoff: Wings now exports at 48,000 triangles, while the watch and hat retain their source-constrained post-decimation detail instead of the rejected over-reduced result. The baseball approval camera now centers the moved right-side shelf.

## 2026-07-12 Locker complete-4K Tripo source rebuild

- Added `TripoAssetLessons.md` and linked it from the README, asset pipeline, Blender pipeline, and source-intake skill. The durable rule is complete 4K material-wired PBR at source intake; runtime texture resolution remains a per-prop browser decision.
- Preserved and hash-verified the new owner downloads: baseball `e77bd1ef4f85705edb2f6ff5bfc5d91d17f5243c9cd77d9c147b204b58617725`, Bull `a5ca94020d9a0de950666d7e8ab8da1eff861a42f48bfb06e29a6f83dcd3d1f1`, and Wings `27d2a4731419d1f7a44873b7aeb69869d6d33f23dc82f32657268db9fa85b36b`. Each source has 4096 BaseColor, Normal, and metallic-roughness maps.
- Removed the rejected procedural baseball, voxel-remeshed Bull, stylized Wings atlas, and runtime map-stripping path. The three props now use the newly downloaded geometry and authored PBR, decimated to about 72k triangles and staged at 2048 for owner comparison. Watch/hat retain 1024 runtime staging; this is not treated as a universal budget.
- `npm run asset:locker` passed source preparation, immutable hash/PBR-role/4K gates, Blender validation, six approval renders, GLB export, and glTF validation. Five existing environment transform warnings and generated tangent-space warnings remain informational.
- Final Blender master: 50,238,312 bytes, SHA-256 `4356961f63439241d1c9ea0bde8f244361203a67db68629580886f7311a2cdaf`. Final GLB: 44,288,684 bytes, SHA-256 `3b5d365274bb6e65b939e6bee4467e6be7d5a4111f5aace92dcc240b99518753`; a no-cache HTTP fetch matched both GLB bytes and hash.
- Repeated-build review found and fixed stale importer datablocks that caused `.001` name drift and inflated the master to 74.7 MiB. Prop-scoped orphan cleanup restored stable names and a 50.2 MiB master; two consecutive full `asset:locker` runs produced the identical deployable GLB hash.
- `npm run assets:check` passed the new independent five-prop/material-role/4K source gate and all deployable GLB validators. `npm run pipeline:evals` passed 6/6. `npm run check` passed lint, types, 35/35 unit tests, and production build.
- The first full Playwright run passed 11/12 but exposed real parallel GPU/decoder contention between the 44 MiB locker and 38 MiB Airbus GLBs. The unchanged failing real-locker test passed alone with one worker. Playwright is now fixed at one worker locally and in CI; the complete `npm run test:e2e` rerun passed 12/12 in 2.2 minutes without weakening assertions.
- Reduced the desktop status box from 20rem to 18rem after geometry evidence found a remaining 16px tray overlap. Playwright now asserts no status/tray intersection at 1440 and no horizontal overflow at 1440, 768, or 375; the final 12/12 run passed those assertions.
- Actual-browser evidence: `.cache/assets/locker/browser/locker-4k-{baseball,bull,wings}-focus-{with-card,clean}-1440.png` and `.cache/assets/locker/browser/locker-4k-overview-{1440,768,375}.png`. All three focus cues settled, real exported nodes were present/revealed, and no console errors were recorded.
- `blender-source-intake`, `blender-visual-repair`, and `blender-browser-visual-gate` skill validation passed. No commit or deployment was made. Visual acceptance remains exclusively with the owner.

## 2026-07-12 DC-9 OBJ8 source intake and authority gate

- Confirmed the source as `roger2009`'s X-Plane.org Douglas DC-9-30 unfinished v0.19 package. Direct creator permission for CockpitEscapeRoom use and derivative production was owner-confirmed on 2026-07-12, so the source may advance through the normal Blender, asset, browser, and owner visual-review gates. The production Blender master and runtime GLB were not changed during this intake pass.
- Added deterministic OBJ8 parsing/import for the selected `DC9vc2`, `DC9panel`, `DC9vc1`, and `Glass` objects: vertex/index tables, 142 ordered draw ranges, nested/keyed transforms, first-key parked defaults, axis conversion, source render state reporting, UVs, and texture staging.
- Source evaluation totals: 162,990 triangles, including 253 degenerate triangles omitted from render meshes; zero unsupported directives; 44 simulator datarefs defaulted and reported.
- Blender 5.1.2 produced a 3,984,250-byte intake `.blend` and 20,564,560-byte intake GLB. GLB SHA-256: `00eed7115fa045eb391cae7976d31ecf25b15d6e74ea50ad60b094c2bbbef114`.
- glTF validation found zero errors and four warnings for legacy PNG color-space/features. Python converter tests passed 6/6; complete cockpit-pipeline unit discovery passed 14/14; the new reference-authority gate validated.
- `npm run pipeline:evals` passed 6/6; `npm run assets:check` passed for the unchanged deployable assets; `npm run check` passed lint, TypeScript, 42 Vitest tests, and production build; `git diff --check` passed.
- Visual inspection of three bounded captain-camera/light passes found strong shell, windshield, overhead, hardware, wear, and period materials, but the main gauges depend on X-Plane's separate instrument system and are absent from a self-contained conversion. Current intake evidence: `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/extracted/optimized/previews/captain-eye.png`.
- `npm run references:check` accepts the new DC-9 manifest entry but remains red on three unrelated, pre-existing unmanifested locker photos under `art-source/references/local-private/`.
- Authority gate reopened: production captain-view assembly/browser integration may proceed. The remaining source delta is DC-9-50-family instrument reconstruction plus deterministic production assembly and browser proof.

## 2026-07-12 DC-9 captain-seat preview repair

- Owner review correctly rejected `.cache/cockpit-pipeline/sources/DC-9-30-xplane-unfinished/extracted/optimized/previews/three-quarter.png` because it used the generic exterior source-inspection camera rather than the required captain-seat view.
- Added a deterministic `dc9-captain` profile to `tools/blender/render_source_candidate.py`. It retains front/side/top as source-geometry inspection views while locking `three-quarter.png` to the left-seat eye point, a restrained 46 mm lens, and a sightline across the captain panel toward the center stack.
- Blender 5.1.2 regenerated and visually inspected the corrected 1,313,183-byte render twice. Both runs preserved the fixed camera and visible framing; their PNG byte hashes differed, so EEVEE preview hashes are not treated as stable evidence.
- The source GLB remained byte-identical at SHA-256 `00eed7115fa045eb391cae7976d31ecf25b15d6e74ea50ad60b094c2bbbef114`; this repair changed camera evidence only, not donor geometry or the playable runtime GLB.

## 2026-07-14 - DC-9 Final Flight Log reordered journey

- Implemented and verified the approved slot swap: the original opening is unchanged except for its **Start Game** label and DC-9 destination; the revised DC-9 Final Flight Log then leads to the unchanged Captain's Locker; its existing **Enter Pop T Captain Mode** action leads to unchanged Airbus A320 gameplay in the Captain-mode slot; the existing Airbus qualification celebration then continues to the Model Y reward. Momma Cheryl's five-page Home Operations Log is read-only recognition with no input, score, timer, or failure state.
- `npm test -- src/game/state.test.ts src/game/storage.test.ts` passed 57/57 reducer and persistence tests.
- `npm run check` passed: ESLint, TypeScript, 62/62 Vitest tests, and the Vite production build.
- `npm run assets:check` passed without rebuilding the DC-9. Existing validator information/warnings remain limited to imported-asset unused UV/empty-node and generated-tangent reports.
- `npx playwright test e2e/smoke.spec.ts -g "DC-9|complete reordered journey|Airbus" --workers=1` passed 7/7 in 2.3 minutes.
- `npm run test:e2e -- --workers=1` passed 15/15 Chromium cases in 4.3 minutes. Coverage includes the real Airbus and DC-9 GLBs, strict DC-9 registry/cameras, model/load failures, keyboard focus, safe retry, reduced motion, reload persistence, Captain's Key handoff, unchanged locker progression, the existing Airbus qualification celebration before reward, and Mars/reward save preservation.
- Actual-browser verification passed after launching Chromium with the host-required `--no-sandbox` argument: meaningful content rendered, no Vite error overlay or page errors appeared, and the only dev-server console warning was the existing upstream `THREE.Clock` deprecation.
- Inspected 1440 × 900 evidence:
  - `preview-renders/dc9-final-flight-log/02-cockpit-route-record-1440.png`
  - `preview-renders/dc9-final-flight-log/03-home-operations-log-1440.png`
  - `preview-renders/dc9-final-flight-log/04-overhead-shutdown-1440.png`
  - `preview-renders/dc9-final-flight-log/05-captains-key-reveal-1440.png`
- A single 375 × 812 functional check found zero horizontal overflow; the stacked Legacy Route Record remained within `x=12..363` and exposed all six route controls, submit, close, viewer-help, fullscreen, and restart controls. This is functional narrow-layout evidence, not a mobile visual-approval milestone.
- `public/models/dc9-cockpit.glb` remained 30,420,832 bytes with SHA-256 `60bfc2e6c137ad47bfb269dfdd4a71c1dda6eb95a0367d7f54a508c7d69fb7cd`, exactly matching the hash recorded before implementation. `art-source/blender/dc9_master.blend` and `dc9_reference_scene.blend` also retained their pre-implementation hashes. `npm run asset:dc9` was not run.
- No external preview was published during this verification pass, so preview-byte parity is not applicable. Real local HTTP model delivery and runtime registry readiness are covered by the passing production-GLB browser test.
- Owner-correction review restored the original opening presentation, byte-for-byte original locker UI/copy, and byte-for-byte original Airbus UI/copy. Only the `Start Game` label/destination and internal inter-chapter handoffs differ outside the DC-9 implementation. The two screenshots that documented the mistaken opening and locker changes were removed.

## 2026-07-15 - DC-9 FO / Airbus Pop T Captain seat-role migration

- Schema v8 is canonical with phases `briefing | dc9 | locker | airbus | reward | mars`, puzzle IDs `dc9 | locker | airbus`, nested `dc9.secureAttempts`, and no obsolete compatibility fields in new saves. The v3-v7 chain and explicit v7-to-v8 migration preserve DC-9, locker, Airbus, reward, and Mars progress.
- Blender 5.1.2 rebuilt both assets. DC-9: 30,338,056 bytes, SHA-256 `501e1bb65a7e025125edd26cba31aa7775cdf4c39e3a1c1e2efaf42ddc62635d`, zero scene warnings. Airbus final evidence-promoted export: 39,878,544 bytes, SHA-256 `8ede97bc91e1ad6ca88f7abbced7c7d7e43483fc99ea1f266687f982bde89899`, with 124 preserved imported-source warnings.
- `npm run assets:check` passed canonical DC-9 FO cameras, Airbus captain cameras, five target families, retired deployable-path rejection, glTF validation, and the exported 68-degree Airbus vertical FOV.
- `npm run pipeline:evals` passed 6/6. The current runtime-contract gate validates.
- `npm run check` passed ESLint, TypeScript, 61/61 Vitest tests, and the Vite production build.
- `npm run test:e2e` passed 15/15 Chromium cases in 3.7 minutes: real DC-9/Airbus/locker GLBs, correct/wrong/recovery paths, keyboard, fallback, reload, reduced motion, complete journey, reward protection, and console health.
- Durable 1440x900 browser evidence inspected: `preview-renders/seat-role-swap/dc9-first-officer-game-1440.png`, `preview-renders/seat-role-swap/airbus-captain-targets-initial-1440.png`, and `preview-renders/seat-role-swap/airbus-captain-targets-dragged-1440.png`. The DC-9 dataset reported `CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL`; both Airbus captures reported five projected target controls, the dragged quaternion changed while the five targets remained projected, and no application errors were recorded.
- Post-review repairs passed `src/game/storage.test.ts` with 23/23 tests: completed v7 and canonical v8 DC-9 saves now preserve nonzero route and secure attempt history. The accessible Airbus fallback sidestick anchor is on the captain side, and the historical assembly job no longer overwrites the current deployable runtime gate.
- Post-review `npm run check` passed lint, TypeScript, 63/63 Vitest tests, and the production build. `npm run assets:check` passed the final GLBs. `npx playwright test e2e/viewer-controls.spec.ts -g "loading failure offers retry" --workers=1` passed 1/1 and asserts the fallback sidestick target uses the captain-side 19.5% anchor.
- Vercel preview `https://cockpit-escape-room-fpgu0ip7r-ottoagent007-gmailcoms-projects.vercel.app` reached `READY`. `vercel curl` retrieved the deployed Airbus GLB at 39,878,544 bytes with SHA-256 `8ede97bc91e1ad6ca88f7abbced7c7d7e43483fc99ea1f266687f982bde89899`, exactly matching `public/models/airbus-captain.glb`.
- Current stills: `public/images/dc9-game-ready-first-officer.png` SHA-256 `3ab21e6985c90e05d6ff1dc9097e60896fe101e4e78e1095adaaac76e6ff65ef`; `public/images/a320-game-ready-captain.png` SHA-256 `2d3cfae76008f6cf713bd37d0af0622cbf34beed66b0b30ae6955a73214f6479`.
- Owner visual approval remains reopened for the DC-9 FO view, Airbus captain view, and complete reordered journey. Vercel preview evidence is pending.

## 2026-07-15 - Owner-feedback completion pass

- The ATP gate now appears at the end of the DC-9 chapter before the Captain's Key; its native answer field remains readable and submit-capable. Opening copy is spoiler-safe, and Start Game preloads the cockpit behind a fade-through-black transition.
- The DC-9 first-officer camera was lowered to the requested headrest-level viewpoint. The Airbus radio target is slightly left on the square display and the thrust target is right on the thrust levers.
- The Legacy Route Record card, rows, and hitboxes were rebuilt on the actual first-officer yoke parent `OBJ8_DC9VC2_RANGE_014`, centered at `(0.4973, -2.775, 0.27)`. Asset validation asserts that parent and the exported translation.
- Browser verification at 1440x900 reported `data-dc9-model-state=ready`, camera `CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL`, a mesh-projected route trigger, no obsolete prompt, and a compact 573.4px-high dialog. Hover/focus produces the requested gold outline.
- Focused Playwright coverage passed the new route-record interaction case and the production DC-9 GLB case after updating the moved ATP expectation.
- Final evidence: `preview-renders/seat-role-swap/opening-spoiler-safe-1440.png`, `preview-renders/seat-role-swap/dc9-atp-final-gate-1440.png`, `preview-renders/seat-role-swap/dc9-fo-lowered-headrest-atp-entry-candidate-1440.png`, `preview-renders/seat-role-swap/airbus-radio-left-thrust-right-final-candidate-1440.png`, `preview-renders/seat-role-swap/dc9-route-record-centered-1440.png`, `preview-renders/seat-role-swap/dc9-route-record-hover-1440.png`, and `preview-renders/seat-role-swap/dc9-route-record-compact-dialog-1440.png`.
- Owner approval was received for PR publication.
- Fresh release verification passed: `npm run pipeline:evals` 6/6; `npm run assets:check`; `npm run check` with lint, TypeScript, 62/62 Vitest tests, and production build; `npm run test:e2e -- --workers=1` with 18/18 Chromium cases in 7.1 minutes; and `git diff --check`.
- Final DC-9 GLB: 30,339,164 bytes, SHA-256 `a5a4cca94a616b1cca78cf1ca6eeb9a0325239fe036a558963834a511f05e377`. Final Airbus GLB: 39,878,736 bytes, SHA-256 `367d7862b079cf1f01562f5f258c6e3bc473b01918219b5b8ba31867d43c31c4`.

## 2026-07-15 - DC-9 golden-key finale polish

- Preserved the owner-supplied Tripo source at `.cache/cockpit-pipeline/sources/dc9/golden-key/original/golden key 3d model.glb`, 16,758,976 bytes, SHA-256 `b243ec3571ef597048ad8ef08ae63eac8da6f9790f7552570921d08aff0a898d`. The deterministic intake reduced 498,186 triangles to 72,000, retained one material, resized the complete 4K BaseColor/normal/metallic-roughness set to 1K, and added node/collider/`dc9.key.open` contracts.
- Rebuilt `art-source/blender/dc9_master.blend` with Blender 5.1.2: 32,820,519 bytes, SHA-256 `47c49acfdd090878bd60770f459b96c82b3cab8b996253ba2874116b0cc3f94c`. Final `public/models/dc9-cockpit.glb`: 36,050,728 bytes (34.38 MiB), SHA-256 `ddc7fa6a75f075666e983b17c89008728b419069030ed23c654919cd262802e3`; 659 selected objects, 12 `game_id` nodes, 267,701 uploaded vertices, and 926,514 rendered triangles.
- The key is staged at `(0.95, -2.55, 0.338)` on the first-officer green ledge. The key-stage-only 0.28-radian initial left glance keeps it outside the 1440x900 right frustum at projected x=1675.8 with passive `>>>` guidance. A manual rightward drag reveals the real key at x=1090.4, keeps the projected native target attached, and removes the cue. Keyboard/offscreen and model-failure fallbacks remain native controls.
- The final key celebration uses the deployed-GLB render `public/images/captains-key-celebration.png`, 622,864 bytes, SHA-256 `81ac311deabdbf7fab4da976c2dc0e3febdd60ae605a514f9459eb4d32d44983`. It includes the exact approved copy, 24-piece gold/teal confetti, no Momma Cheryl/engraving text, focused keyboard continuation, Escape dismissal with focus restoration, and a reduced-motion no-confetti path.
- Taking the key now leaves the DC-9 mounted and persisted through the 900ms fade. The phase remains `dc9` during `fade-to-black`, commits to `locker` only on `black-pause`, and then continues the existing title/reveal or latched Skip path without a scene flash.
- The physical yoke route card is exactly `(0.10, 0.012, 0.15)` at `(0.4973, -2.775, 0.27)` and is centered neatly on `OBJ8_DC9VC2_RANGE_014`; its rows, submit plate, colliders, and projected trigger fit the shortened board.
- Home Operations retains its title and five read-only pages in a compact deep-green cockpit record. Measured panel heights: 416px at 1440x900, 416px at 768x900, and 439px at 375x812 after removing the narrow-layout bottom anchor and unused lower region.
- Durable actual-browser screenshots inspected under `preview-renders/dc9-golden-key-finale/`: `key-discovery-1440.png`, `key-revealed-after-scan-1440.png`, `key-celebration-1440.png`, `fade-to-locker-1440.png`, `route-card-centered-yoke-1440.png`, and Home Operations Log captures at 1440, 768, and 375 pixels. The final fade proof reported one modal, no key dialog, `phase=dc9`, and transition stage `arming`; the browser tests confirm the subsequent full-black phase commit.
- Final validation passed: `npm run asset:dc9`; `npm run check` with lint, TypeScript, 62/62 Vitest tests, and production build; `npm run assets:check`, including direct deployed-GLB assertions for the key's tangents, 72,000 triangles, one material, and three embedded 1024px PBR maps; `npm run pipeline:evals` 6/6; isolated real-locker and real-DC-9 production cases; full `npm run test:e2e -- --workers=1` 19/19 in 8.0 minutes; and `git diff --check`.
- No Vercel preview was published in this implementation pass. The local actual-browser evidence is ready for the owner visual gate; external preview publication remains a separate authorized action.

## 2026-07-16 - DC-9 owner-feedback polish

- Fixed the saved-DC-9 reload flash by withholding the Legacy Route Record opener while the cockpit is `idle/loading`. The opener follows the real route-card mesh after load, remains keyboard-reachable when ready but offscreen, and becomes a visible fallback only after an actual load error or explicit accessible fallback.
- The gold hover/focus rectangle now uses the projected `dc9.route.card` world bounds with 4px breathing room on every edge. The real-GLB Playwright assertion measured the DOM rectangle as projected width/height plus 8px and passed.
- The route question now renders dark ink (`rgb(40, 33, 23)`), the literal-itinerary disclaimer is removed, the title is `Home Operations Log`, and page two reads: `The home crew — Momma Cheryl kept three kids fed, prepared, and on schedule while travel carried Pop T away and home again.`
- At 375x812, Home Operations grows with its content and the chapter layer scrolls; the document reports `max-height: none`, `overflow-y: visible`, and no internal scroll delta. The shutdown view uses yaw `0.15`, and the Captain's Key popup image is rotated `6deg` in both normal and reduced-motion paths.
- TDD red evidence failed at the old copy, visible loading fallback, capped narrow panel, light question ink, and zero-degree key. Focused green validation: 39/39 state tests; 5/5 targeted Playwright cases; isolated real-GLB DC-9 production flow 1/1 in 4.0 minutes.
- Final validation: `npm run check` passed lint, TypeScript, 62/62 Vitest tests, and production build; `npm run assets:check` passed; `npm run pipeline:evals` passed 6/6; `npx playwright test e2e/smoke.spec.ts --workers=1` passed 11/11 in 5.9 minutes, including the production DC-9 case after Airbus-first contention in 4.5 minutes.
- The pre-publication mixed-workspace `npm run test:e2e -- --workers=1` attempt passed 17/20: two locker-camera/finale assertions were awaiting PR #44, and the production DC-9 test exceeded the former 240-second full-suite ceiling at its final scan-cue assertion. After PR #44 merged, the scoped golden-key/DC-9 branch was rebuilt from updated `main`; the 300-second DC-9 ceiling retained every behavior assertion, and the complete suite passed 20/20 in 8.2 minutes.
- Inspected browser evidence: `preview-renders/dc9-golden-key-finale/owner-polish-route-outline-1440.png`, `owner-polish-route-record-768.png`, `owner-polish-home-log-375.png`, `owner-polish-shutdown-overhead-1440.png`, and `owner-polish-captains-key-1440.png`. The route outline follows the card, the narrow log has no internal scrollbar, the overhead is more visible, and the key has the requested subtle clockwise turn. The optional Browser plugin was unavailable; repository Playwright provided the actual-browser fallback.
- No Blender source or deployable GLB was rebuilt or hand-edited for this polish pass. No external preview was published.
- CI follow-up: PR #46 initially failed `quality` because `assets:check` required the ignored local file `.cache/assets/dc9/celebration/captains-key-celebration.json`. The build now writes a normalized committed report at `asset-reports/dc9-captains-key-celebration.json`, and validation checks that report plus the deployed 1024px PNG. With the local cache report deliberately removed, `npm run assets:check` passed; `npm run check` also passed with 62/62 Vitest tests.

## 2026-07-16 - Locker camera finale polish

- The locker opening now ends at the owner-reference right-side watch composition. The dedicated `watch-focus` pose is position `(1.17, -0.38, 3.18)`, target `(0.42, -0.75, -0.21)`, FOV 30, and leaves the Baseball, Charging Bull, and Wings poses unchanged.
- Correct Wings completion now drives the real camera to `hat-focus`, hides locker controls while moving, starts an exact 2,000ms timer only after the camera reports `settled`, and mounts the existing celebration afterward. Persisted reload and the accessible no-3D fallback open the popup directly rather than replaying the cinematic.
- Normal motion retains the existing 24-piece confetti celebration. Reduced motion snaps the real camera, observes the same post-settle hold, and retains the existing no-animated-confetti behavior. A headed Brave run measured `holding -> ready` at 2,008.7ms.
- Wings retry copy is now practical: `Think in flight hours: it’s a round-number milestone between 500 and 1,500.` followed by `It’s a four-digit milestone below the 1,500-hour ATP requirement.` Completed memories remain preserved on every miss.
- The 375px visual gate exposed 31px of internal celebration-card overflow. A focused red/green Playwright assertion now covers that boundary, and the captain-hat image is capped at the card content width without changing the popup or confetti design.
- TDD evidence: the focused reducer test first failed 1/39 on the old Part 121 copy and then passed 39/39. The real-canvas case first failed on the missing camera diagnostics/`hat-focus` cue, then passed with the final pose and finale state machine. The responsive test first failed with 31px card overflow and then passed after the image constraint.
- Final validation passed: `npm run check` (ESLint, TypeScript, 62/62 Vitest tests, production build); `npm run assets:check` (exit 0 with existing imported-asset validator notices); `npm run test:e2e -- e2e/locker-room.spec.ts --workers=1` (6/6 in 3.8 minutes); and `git diff --check`.
- Actual-browser evidence at 1440x900, 768x900, and 375x812 is under `preview-renders/locker-camera-finale/`: `locker-watch-owner-framing-{1440,768,375}.png`, `locker-hat-hold-{1440,768,375}.png`, and `locker-hat-celebration-{1440,768,375}.png`. The final normal-motion capture reported `hat-focus`, `settled`, `ready`, and 24 confetti pieces. No page exceptions or failed HTTP responses were recorded; Brave emitted one generic resource-console warning without a failed response, and Vite retained the existing upstream `THREE.Clock` deprecation warning.
- No Blender source, deployable GLB, celebration component, persistence schema, dependency, DC-9, Airbus, Model Y, or Mars asset was changed for this pass. No Vercel preview was published; external preview publication and the owner visual gate remain separate follow-up actions.

## 2026-07-16 - Genesis-style placeholder game intro

- The unchanged briefing remains the gesture surface. **Start Game** now begins a 53-second, six-beat console-era montage before the existing DC-9 fade/load handoff. The immutable cue order is family crew production -> DC-9 Final Flight Log -> Captain's Key -> Captain's Hat -> Airbus captain transition -> CockpitEscapeRoom title. The intro does not dispatch `START` or persist progress until natural completion, **Skip Intro**, or Escape invokes the guarded one-shot handoff.
- `src/components/GameIntro.tsx` uses native HTML audio plus a media-time `requestAnimationFrame` clock, a monotonic silent fallback, retry resynchronization, mute, volume, skip, live status, decorative-image semantics, and reduced-motion presentation. `src/game/introConfig.ts` keeps cue timing/copy/image choices outside component logic. No reducer, schema, cockpit GLB, production dependency, external font, analytics, upload, or network-hosted media changed.
- Owner source `/mnt/2TBHDD/Downloads/IntroAudio.mp3` remained 5,015,659 bytes with SHA-256 `0c1864eb97762841b64c57229c07e70eb620724a02a53ddb69a7465a9eac704f`. The deployable `public/audio/intro-audio-53s.mp3` is 1,273,994 bytes, SHA-256 `be635257cce2ebb3e7e327cada37e09b4a3b4c292e5e385f280955a1d2843507`, MPEG Layer III at 192 kbps / 48 kHz stereo, and 53.040 seconds. GStreamer 1.24.2 accurate bounded seeking produced the cleanly finalized file after measured evidence showed that this host did not honor `identity eos-after`.
- TDD/browser evidence: the opening test first failed because the intro region did not exist; the complete-journey full-suite case later failed because its older path skipped directly from Start Game to DC-9. Implementing the component and adding the explicit **Skip Intro** journey action repaired both boundaries. The timeline unit test first failed on the missing module and then passed.
- Focused verification passed: `npm run test -- src/game/introConfig.test.ts src/game/state.test.ts` (43/43); `npm run test:e2e -- e2e/smoke.spec.ts -g "game intro|opening stays spoiler-safe"` (6/6); deployable-media test (1/1); and repaired complete-journey test (1/1).
- Final repository verification passed: `npm run check` with ESLint, TypeScript, 66/66 Vitest tests, and production build; `npm run assets:check`; `git diff --check`; and the fresh complete `npm run test:e2e -- --workers=1` run with 25/25 Chromium cases in 5.0 minutes.
- The optional Browser plugin was unavailable. The installed `agent-browser` CLI initially required its documented `--no-sandbox` host flag, then verified meaningful content, no Vite overlay, native controls, the full intro-to-DC-9 interaction, and no page errors at `http://127.0.0.1:5173/`. Headless agent-browser rejected real audio output, correctly exercising the visible silent fallback; a visual-only successful `play()` promise was injected to freeze exact cue frames for screenshots. Real MP3 decoding, duration, playback call, rejection/retry, media-event synchronization, and completion were independently covered by repository Playwright.
- Durable inspected evidence under `preview-renders/genesis-game-intro/`: `boot-1440.png`, `dc9-1440.png`, `key-1440.png`, `hat-768.png`, `hat-reduced-motion-768.png`, `airbus-375.png`, and `title-1440.png`. The fidelity ledger checked exact cue copy, blue/gold/red 16-bit palette, settled screenshot crops, scanline/pixel treatment, native control fit at 375/768/1440, and protected-reward spoiler absence. No clipping, overlap, horizontal overflow, or unreadable final cue remained. The only console warning was the pre-existing Three.js `Clock` deprecation.
- React review found one focused named component, colocated state, complete effect/animation-frame cleanup, stable one-shot completion, native semantic controls, decorative alt handling, and no unsafe DOM insertion or unnecessary memoization/dependency. Full-diff review found no duplicate transition dispatch, early `START`, spoiler reference, or unrelated staged file.
- The stills and cue copy remain explicitly replaceable placeholder intro art. No Vercel preview was published; owner visual/music approval remains the external gate before this placeholder is treated as final intro direction.

## 2026-07-16 Airbus target alignment follow-up

- Moved the Airbus radio target left from Blender `(-0.030000, -0.474842, 0.011798)` to `(-0.040000, -0.474842, 0.011798)` and the thrust target right from `(0.003000, -0.505764, 0.004800)` to `(0.015000, -0.505764, 0.004800)`. Paired hitboxes and cue meshes inherit each pivot.
- Added exact glTF translation checks for both pivots and a real-browser regression that asserts the 1440x900 projected ranges and dispatches canvas clicks through the actual mesh raycaster. The old asset failed red; the rebuilt asset passed green.
- `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus` prepared and validated the source with Blender 5.1.2 and 124 existing imported-source warnings. Its metadata-only rerun stalled during approval rendering with EGL errors; the final metadata-bearing GLB was then exported using `tools/blender/export_glb.py` and passed `npx gltf-transform validate` and `npm run assets:check`.
- Final Airbus GLB: 39,878,776 bytes, SHA-256 `e340dcf1caefb998f208a5fd228455384d289916efd4b4f15fbafc50c79497ef`.
- Focused browser validation: `npx playwright test e2e/smoke.spec.ts --grep "Airbus production cockpit loads" --workers=1` passed 1/1 after the final GLB export. The production test uses a bounded 180-second timeout because SwiftShader teardown can outlast the functional assertions.
- Browser screenshots inspected: `/tmp/airbus-radio-thrust-aligned-1440.png`, `/tmp/airbus-radio-thrust-aligned-768.png`, `/tmp/airbus-radio-thrust-aligned-375.png`. Tracked owner proof: `preview-renders/airbus-target-alignment/airbus-radio-thrust-aligned-1440.png` (690,306 bytes). At 1440 the radio is farther left on its panel and thrust is centered between the levers; 768 remains usable. The 375 capture retains the existing narrow projected-camera limitation with thrust offscreen and is not a mobile approval milestone.
