# Scramble — the launch-sequence intro

*(Plan file keeps its original name for reference stability; the design was retitled from
"Ink & Altitude" when the comic-book half was dropped — see the decision log.)*

## Purpose

Replace the duffel-and-key chase intro with the owner's chosen Genesis-styled design: a pure
cinematic launch sequence. The intro is the quiet ritual of a legend suiting up for tonight's
commemorative legacy flight — hard-cut stills on the drum hits, the hangar reveal, the suit-up
montage, the walk to the DC-9, the cockpit coming alive, and a quiet cut to the empty right seat
before the instrument glow resolves into the title. 16-bit pedigree: After Burner II's launch
energy, Revenge of Shinobi's lightning-still cuts. Zero slapstick — all reverence and adrenaline.

## Current state

- As of 2026-08-27, the Scramble runtime is on `main`. The owner approved the revised aviators/
  watch cut and richer golden finale, then directed the cinematic to become the first game
  surface. Fresh and restarted sessions now mount and start it automatically; the authored
  **PRESS START** remains the handoff to the DC-9 chapter.
- Diagnosed 2026-08-17: the duffel scene fails structurally (bag painted into the plate, ~140
  stage px vs the 90 px character, immobile, no contact, key bursting from unopenable leather);
  runway cart unreadable behind PRESS START; duplicate ballpark home plate; doubled finance chart.
- 2026-08-17: three new designs pitched; owner first chose the A/B hybrid (comic book breaking
  into a scramble), a full greybox animatic was rendered, and on 2026-08-18 the owner simplified
  to pure B: the comic half is dropped, the scramble carries the whole intro.
- Working machinery preserved: the 53.04 s track and its 13 measured accents, the punch/hitstop/
  flash/shake system (0028), the pixel-exact stage grid (0030), the deterministic renderer and
  test suite, the v3 full-colour Pop T anchor and generation → normalise → gate toolchain (0029).

## Scope

Included: automatic cinematic entry, the intro storyboard (scene table, choreography, renderer
support for hard-cut still cards, the hangar reveal, cockpit inserts, the empty right-seat hold,
and the instrument-glow title plaque), the greybox animatic that established the direction, the
asset list and generation prompts, integration, and proof.

Excluded: the audio track (kept), the ident scene 0–6 s (kept), the Start handoff input behavior
(its visual title/plaque layers may evolve), the stage/pixel-grid architecture, and all non-intro
chapters. The 0029 anchor decisions remain owned by that plan; this plan consumes its pipeline.

## Context and constraints

- 2026-08-17 owner decision: prior intro-specific contracts are released (duffel/key storyboard,
  key-cameo embargo, red-"!" exclusivity). The key mascot does not appear in this design.
- Project-level rules still bind: commemorative tone (the flight is tonight's legacy flight — no
  emergency framing anywhere), no Model Y leak (`validateIntroAssets` guard stays), deterministic
  renderer, reduced-motion support, PRESS START available from 6 s, and a held final title frame
  instead of an attract-loop reset.
- Pixel-grid invariants from 0030 hold: whole-number sprite scales, zoom rests at exactly 1,
  punches only on accents.
- Aircraft accuracy: the aircraft is the DC-9 (T-tail, rear engines) throughout — the intro hands
  off into the DC-9 First-Officer chapter. No A320 details anywhere in this design.
- The suit-up inserts are commemorative identity beats (four captain's stripes, the wings badge,
  the cap, the photo on the glareshield). The photo beat is optional and owner-vetoable.

## The design — beat map on the measured cues

The table below preserves the approved 2026-08-18 animatic. Later owner-directed runtime
iterations are recorded in Progress and the source cue table is authoritative for the current cut.

Cue values from `src/game/introMusicCues.ts`; the beat grid is 0.72 s (~83 BPM half-bar). Cue
names below are the design's names; the source constants keep their historical names.

| t (s) | cue | beat |
|---|---|---|
| 0–6 | — | TMB2 ident, existing and unchanged |
| 6.0–7.512 | — | black; a single beacon sweep crosses the dark |
| 7.512 | `assembleDone` | STILL: boots hit the tarmac |
| 8.976 | grid origin | STILL: coffee set down, still steaming |
| 10.416 | grid | STILL: the flight case |
| 11.856 | grid | STILL: the latches SNAP shut |
| 13.056 | `exclaim` (largest hit) | THE REVEAL — hangar floodlights slam on row by row; the DC-9 silhouette appears; hitstop |
| 14.544 | `keyFlyExit` | suit-up montage begins — GLOVE SNAP |
| 16.704 | grid | FOUR STRIPES — the captain's epaulette |
| 19.368 | `cartNearMiss` | HARNESS CLICK |
| 21.528 | grid | WINGS PINNED |
| 24.552 | `ballDeflect` | CAP FLIP — flipped and caught one-handed on the accent |
| 26.0–30.48 | — | the hangar doors grind open in silhouette, light pouring around his outline |
| 30.48 | `bullImpact` | SHADES DOWN — white streak across the lens |
| 31.5–35.64 | — | the walk: long silhouette scale shot, Pop T small against the DC-9 nose |
| 35.64 | `skyGridIgnite` | ENGINE START — light-off, fan spools, the beacon begins to flash on the beat grid |
| 38.52 | grid | INSERT: the instrument panel glows alive, left to right |
| 39.96 | grid | INSERT: the photo clipped to the glareshield |
| 41.4 | grid | INSERT: hand settles on the throttles |
| 42.84–45.12 | — | lineup: the runway waits, centerline stretching to the horizon, strobes |
| 45.12 | `missLunge` | THROTTLES UP — the roll begins, edge lights start to stream |
| 46.008 | `catchRecover` | ROTATE — the nose lifts, the horizon tilts |
| 47.496 | `catchGrab` | the DC-9 pulls up past the camera; contrail ribbon across the stars |
| 49.704 | `emblemStamp` | the winged-globe emblem slams into the contrail (existing finale card) |
| 51–53.04 | — | pixel collapse and loop, kept |

Asset economics: every still card and insert is a single composition — the v3 plate pipeline's
best case. Sustained character animation shrinks to the walk silhouette; everything else is
hard cuts, code-drawn light, and the jet. The 0029 Waves 1–3 chase list (55 frames) stays
superseded.

## Progress

- [x] 2026-08-17 — Duffel-scene failure diagnosed with evidence; three designs pitched.
- [x] 2026-08-17 — A/B hybrid chosen; plan opened; hybrid greybox animatic rendered and delivered.
- [x] 2026-08-18 — Owner design iteration: comic half dropped, pure scramble chosen. Plan
      retitled; beat map rewritten above.
- [x] 2026-08-18 — Animatic generator rewritten for the scramble design; full-length greybox
      animatic re-rendered with the real track:
      `preview-renders/tmb2-intro-overhaul/intro-0031-animatic-greybox.mp4`.
- [x] 2026-08-18 — **Design gate PASSED** — owner watched the scramble animatic and approved
      ("Go") with no retimes. The photo beat stays in (still vetoable at the final visual gate).
- [x] 2026-08-18 — Asset pack authored: `asset-reports/scramble-intro-prompt-pack.md` (36 assets
      in four waves, global style rules, no-text rule, DC-9 accuracy block, per-asset animatic
      composition refs).
- [x] 2026-08-18 — Wave S0 style anchors generated (Codex built-in `image_gen`, ChatGPT plan,
      both first-attempt accepts): `plate-hangar-reveal` and `card-flight-case`, normalised to
      320×224 under `art-source/intro/tmb2/scramble/normalised/`. Comparison sheet delivered.
- [x] 2026-08-18 — Owner iterations on the S0 anchors (Northwest livery + modern case, then the
      gearless-jet catch), v3 reveal plate accepted, **style LOCKED by the owner**.
- [x] 2026-08-18 — **Wave S1 complete**: doorway, door-leaf strip, walk tarmac, runway lineup,
      night sky — five first-attempt accepts, normalised to stage size, review sheet delivered.
      Full details in the pack's generation log.
- [x] 2026-08-18 — **Wave S2 complete**: 18/18 cards and delta frames generated in one batched
      background run, normalised, review sheet delivered. Two owner flags recorded in the pack
      (case-shut reframe, nacelle girth); neither blocking.
- [x] 2026-08-18 — **Wave S3 complete** (9/9 first-attempt: 6-frame walk cycle, backlit figure,
      both DC-9 sprites), normalised to exact stage sizes via the new
      `tools/assets/normalise-scramble-sprite.py`. Owner fixes folded in during S2/S3: blond
      photo (v3 via delta-fix), lit instrument delta frame, landing-gear rule.
      **All asset waves are complete — Milestone 2 done pending the two soft flags.**
- [x] 2026-08-18 — **Task 4 runtime implementation complete and unit-green.**
      Assets deployed to `public/images/intro/tmb2/scramble/` via the new
      `tools/assets/deploy-scramble-intro.py` (walk sheet packed 6×24×36, dark reveal plate
      derived in post); retired chase assets removed from public/ (git history keeps them).
      `introMusicCues.ts` renamed to the Scramble cue set (measured values unchanged, grid cues
      derived and test-locked); `introConfig.ts` carries the 13-scene table with boundaries on
      the cues; `introAnimation.ts` rewritten (card-cut montage system, two-state reveals,
      doors, nameplate lettering, beacon/strobe/exhaust/contrail/runway-light FX, jet actor
      with pre-rendered size swaps, roll rumble on whole pixels, jet-pass hitstop; ident kept
      verbatim); `introRenderer.ts` rewritten to draw them; `introAssets.ts` lists 42 runtime
      images (14 initial-tier); manifest builder preload now hash-binds all 42.
      Handoff redesigned: the emblem zooms out of the title card (the key mascot is fully
      retired). Suite evolved test-by-test: `npm run check` exit 0 — lint, typecheck,
      **266/266 tests**, production build; `npm run assets:check` passes (54 hashed assets,
      42 preloads). Test evolutions recorded: pixel-grid sweep now also covers the jet actor;
      the identity-camera ceiling moved 0.15 → 0.2 for the montage's extra accent punches
      (still forbids held zooms); the "cockpit" word left the scene-copy guard (insert shots
      are cockpit content by design) while every reward guard stays.
- [x] 2026-08-18 — **Task 5 validation run.** Playwright e2e: **51 passed, 1 skipped, 17.1 m,
      exit 0** — identical to the pre-rewrite baseline (the spec's scene table, reduced-motion
      pose check, and sprite attributes were evolved to the Scramble scenes). Browser proof:
      production build on 4173, clock-driven captures at 29 story moments plus 3 reduced-motion
      and 2 viewport stills (375/768; 1440 is the capture default) —
      `preview-renders/tmb2-intro-overhaul/stills-scramble/` (34 files), contact sheet at
      `scramble-browser-proof-sheet.png`. Zero page errors. Verified working in-browser: the
      runtime nameplate lettering, the floodlight row-slam mid-reveal, the instrument wipe
      mid-wake, the walk sprite on the tarmac plate, runway-light FX over the bare plate, the
      hitstop-frozen jet pass, and the contrail.
- [x] 2026-08-18 — **Owner gate round 1: "decent, but room for a lot of improvement"** with a
      nine-item punch list. Logged as Wave S4 + restage tasks:
      1. Ident Pop T too big and pixelated → regenerate ident acting (run cycle, skid, tap) at
         ~64 px through the modern pipeline; retire the legacy 256-cell sheets entirely.
      2. Gloves scene scrapped (pilots don't wear white gloves) → `card-watch` takes the 14.544
         accent (watch clasp snap).
      3. Cap flip needs work → exact-framing delta redo of the caught frame + a mid-fall
         in-between; timing tightened.
      4. Walk animation "really bad" → cycle regenerated as ONE sheet generation (style
         consistency inside a single image), ~48 px, ground speed locked to the art's stride to
         kill foot-slide.
      5. Harness "kinda lame" → first planned as a two-frame action redo, then the owner cut it
         entirely mid-wave ("I dunno about the harness at all, let's get rid of it"). The
         19.368 click accent now carries **the logbook snapping shut** — the most personal
         pilot object, and a direct foreshadow of the DC-9 Final Flight Log chapter. The
         harness redo frames still generate in the running wave but will not be wired in.
      6. Takeoff "sub par" → restage: roll away shrinking through pre-rendered sizes, liftoff
         at the horizon, bigger/slower overhead pass, climb-out along the contrail (extra
         normalised sizes of existing sources; no new jet generations).
      7. `card-flight-case-shut` redone as an exact-framing delta of the open card.
      8. Shades face not blond → delta fix with blond sideburns/brows under the cap.
      9. (mid-wave direction) The flip cap must match the game's captain's hat
         (`public/images/captains-hat-celebration.png`: charcoal crown, glossy black visor with
         silver oak-leaf embroidery, silver chin cord, round red-ringed wings badge). Wave S4B
         rebuilds the cap card set from a new base with the game hat as an image reference; the
         S4 cap deltas against the old gold-band cap are superseded on arrival.
      Emblem card decision still open alongside this round.
- [x] 2026-08-18 — **Waves S4 + S4B generated (15/15) and fully integrated.** Single-sheet cycle
      technique proven (one generation carrying all six poses → sliced → shared-scale
      normalise); ident on new 64 px run/skid/tap with the legacy 256-cell sheets deleted;
      watch and logbook cards wired on their accents; three-frame cap flip with the game's
      captain's hat; 48 px walk; exact-framing case-shut; blond shades; takeoff restaged
      (receding roll 52/36/26 px, horizon liftoff with exhaust, up-right pass 160/320 px,
      contrail climb-out at 48 px). `npm run check` exit 0 (266/266); assets:check 49 hashed /
      45 preloads; round-2 browser proof at 19 changed moments in
      `preview-renders/tmb2-intro-overhaul/stills-scramble-r2/`. Full e2e re-run launched.
- [x] 2026-08-18 — **Owner gate round 2 feedback: the captain's hat is inconsistent across
      scenes and its trim must be GOLD, not silver.** Measured: three distinct hats had crept in
      (flip cards: game hat with silver cord/leaves/badge-ring; watch card: an invented cap with
      a gold wings emblem; shades card + sprites: the plain gold-band cap). Canonical hat
      defined: the game hat's shape with ALL-GOLD metalwork — gold braided chin cord, gold
      oak-leaf visor spray, round badge (red ring, cream disc, blue centre) with gold wings.
      Wave S5 (4 delta generations, running): gold pass on the flip base, mid/caught rebuilt
      from the gold base, watch card's hat replaced with the canonical design. Shades and
      sprites already read gold and stand.
- [x] 2026-08-18 — Montage reordered for continuity (cap flip opens at 14.544, watch check
      closes at 24.552; cues renamed `capFlip`/`logbookSnap`/`watchCheck`, measured values
      test-locked); hat unified in gold across all five appearances (Wave S5); **the emblem
      finale card replaced on owner direction** — the winged-globe insignia alone as a
      transparent sprite, the retired key gone from the project's intro entirely. All suites
      green after each change (266/266; e2e 51 passed/1 skipped after the reorder; the emblem
      swap is asset-content only).
- [x] 2026-08-26 — **Owner-selected finale and montage revision integrated.** The aviators now
      take the 15.528 pre-door beat and the gold watch takes the 29.2 walk-out beat; measured cue
      times and the 53.04 s media clock are unchanged. The quiet `plate-right-seat` cut still
      lands at 47.496, then the 49.704 title hit switches to a new 320×224 instrument-glow plate.
      A separately generated, textless 248×54 winged plaque uses brighter champagne highlights,
      saturated gold midtones and deep amber shadows; exact title letters remain runtime-drawn
      and the plaque now shares the Start handoff zoom. Generation, normalization, deployment and
      manifest routes are reproducible through `normalise-scramble-finale.py` and
      `deploy-scramble-intro.py`. Focused unit/asset contracts: 55/55. Production build and
      `assets:check`: pass. Fresh `npm run check`: lint/typecheck, 472/472 unit tests and production
      build pass; its first full run caught and repaired the stale 49→51 full-tier asset census.
      Independent review then caught an early-Start race: the handoff can begin at 6 s, so the
      20 KB plaque now joins the opening tier while the 92 KB glow plate remains deferred.
      Targeted intro Playwright:
      13/13 after updating the retired
      neutral-white pixel probe to detect the new gold mark. Owner-visible proof at 375, 768 and
      1440 plus reduced motion is in `preview-renders/tmb2-intro-golden-finale/`; no console issues,
      framework overlay, clipping or horizontal overflow.
- [x] 2026-08-27 — **Automatic console-style entry integrated.** The owner approved the golden
      finale ("looks good") and removed the pre-intro DC-9 station plus its outer Start Game gate.
      The initial art tier now starts playback exactly once when ready. Rejected audible autoplay
      enters the existing monotonic silent clock and keeps Retry sound available. Initial decode
      failure stays inside the cinematic shell with an exact retry; the DC-9 still preloads during
      the transient `briefing` phase, retained for save compatibility. Focused browser coverage
      passes 18/18 across the automatic mount, asset error/retry, silent fallback,
      pointer/keyboard/controller PRESS START, early golden handoff, reduced motion, and required
      viewports. Independent review found that the old all-or-nothing deferred load could leave a
      later story beat blank behind one pending image. The remaining 28 images now decode in
      parallel and merge individually; browser proof holds `plate-right-seat-glow` pending while
      `card-cap-a` still renders. The error alert is no longer marked busy after failure, and the
      rejected-audio test now proves the fallback clock advances before sound retry.
- [ ] Owner gate: review the automatic opening in the browser. Open: the S2 nacelle-girth soft
      flag only. No push before approval.

## Discoveries

- The retired chase design failed on a single pattern: diegetic objects baked into paintings or
  drawn as procedural rectangles. The scramble avoids it structurally — still cards are *meant*
  to be single images, and everything that moves in the live sections is a sprite or code-drawn
  light.
- The hybrid animatic compressed the scramble into 17 s; stretched over the full track, every act
  gains air (the suit-up montage alone grows from 4.3 s to 11.4 s) — the simplification is also a
  pacing win.

## Decision log

- 2026-08-17 — Owner released the prior intro contracts and chose a redesign over repair.
- 2026-08-17 — Keep the existing 53.04 s track and measured cue grid; keep the 0–6 s ident;
  greybox animatic before any art spend (hard gate).
- 2026-08-17 — Scramble aircraft is the DC-9; suiting up for the legacy flight in the ship where
  the career began is the commemorative frame.
- 2026-08-27 — The cinematic is the first surface on a fresh or restarted game. Remove the old
  station landing and outer Start Game button, attempt soundtrack autoplay without stalling the
  visuals when blocked, and retain the cinematic PRESS START as the DC-9 handoff.
- 2026-08-18 — **Owner dropped the comic-book half ("the hybrid might have been too much"); the
  design is pure Option B, the launch sequence.** Consequences: no comic panels, no page-break
  mechanics, no ink-to-colour transition in the runtime; the key mascot does not appear; the
  acting budget shrinks further (no climb-out hero animation — the walk silhouette is the only
  sustained character motion).
- 2026-08-18 — The 13.056 slam (largest hit in the track) is the hangar reveal, not a character
  beat: floodlights row-slam onto the DC-9 silhouette. Rationale: the aircraft is the co-star and
  the track's biggest accent should introduce it.
- 2026-08-18 — **Owner direction on the S0 anchors: Northwest livery and a modern flight case.**
  Livery (grey-over-white, all-red fin, white compass disc, no lettering) is now global rule 5 of
  the asset pack and applies to every aircraft asset (both plates with the jet and both DC-9
  sprites). The case is a matte-black hard shell with steel latches and a red accent. Fits the
  story: Northwest flew both the DC-9 and the A320 — the two aircraft of the game's journey. v2
  anchors generated same day, both first-attempt accepts; v1 kept beside them for the record.
- 2026-08-26 — Owner explicitly swapped the aviators and watch cuts, then chose Option 1's
  instrument glow with Option 3's premium plaque and asked for the brass to be more golden. The
  implementation keeps generated art textless and composites the exact game title at runtime.

## Milestones

1. **Animatic.** A watchable full-length greybox film of the scramble on the real track, every
   beat on its measured cue. Owner design gate — hard stop before any art generation.
2. **Asset pack.** Still cards, hangar/runway plates, cockpit inserts, walk silhouette frames,
   each with a generation prompt, produced through the v3 pipeline and its gate.
3. **Runtime.** New scene table and choreography in `src/game/introAnimation.ts` (or sibling),
   renderer support for still cards, the reveal, engine start, and the takeoff; tests evolved;
   reduced-motion poses curated per scene.
4. **Proof.** Browser stills at every cue, reduced motion, 375/768/1440, full suite, owner gate.

## Implementation steps

- [x] **Task 1 — Animatic generator.** `tools/design/intro-0031-animatic.py`: deterministic
      greybox renderer at 320×224 (4× NEAREST), 12 fps, muxed with
      `public/audio/intro-audio-53s.mp3`. Rewritten 2026-08-18 for the scramble design.
- [x] **Task 2 — Design gate.** Owner watched and approved the scramble animatic on 2026-08-18;
      later visual rounds and their decisions are recorded in Progress.
- [x] **Task 3 — Asset list.** Enumerate stills (boots, coffee, case, case-snap), the hangar
      reveal plate, five suit-up/insert cards, doors/walk silhouette staging, engine-start
      nacelle, cockpit inserts, runway lineup and takeoff plates, each with prompt + target size.
      Cards are cropped illustrations composited into code-drawn framing, generated at card
      aspect, not full-stage. Completed through the versioned prompt pack and S0–S5 waves; later
      owner-directed full-frame replacements are logged above.
- [x] **Task 4 — Runtime scene table.** Replace the duffel→catch scenes in `introConfig.ts` with
      the scramble chapter list (ident and loop-reset stay); rewrite `deriveIntroAnimation` scene
      cases; add renderer commands for still-card compositing, the row-slam reveal, beacon/strobe
      lights, streaking runway lights, and the contrail. Evolve tests cue-by-cue.
- [x] **Task 5 — Proof.** Full `npm run check`, e2e, browser stills at every cue, reduced motion,
      375/768/1440; evidence here and in `TEST_REPORT.md`.

## Validation plan

- Animatic: PIL frame spot-checks at every cue; ffprobe duration 53.04 s ± one frame; audio present.
- Unit: determinism sweep, pixel-grid sweep stays green, cue-alignment assertions per scene.
- Browser: production build, clock-driven captures at each cue, compared against the animatic.
- Accessibility: reduced motion holds one curated still per act; flashes stay within the existing
  envelope; PRESS START from 6 s.
- Responsive: 375 / 768 / 1440.

## Acceptance criteria

- Every beat in the beat-map table fires within one 12 fps frame of its measured cue.
- The animatic is watchable end-to-end with the real track and the owner signs the design gate.
- Final build: all suites green with evolved assertions; every sprite on the pixel grid; stills
  at every cue match the approved design; no intro asset references the reward chapters.

## Repair loop and stop conditions

Review → focused repair → validation → remaining-delta review. Stop at the current owner visual
gate, at three failed repairs of one root cause, or at any authoritative-art blocker.

## Evidence

### 2026-08-17 — hybrid animatic (superseded design iteration)

- 636 frames rendered and muxed; ffprobe 53.000 s, 1.65 MB, 1280×896 H.264 + AAC. Spot-checked at
  21 timestamps; every beat within one 12 fps frame of its cue. One repair: degenerate emblem
  inner-ring arc at radii < 8 px, guarded. Delivered to owner; feedback: drop the comic half.

### 2026-08-18 — scramble animatic

- `python3 tools/design/intro-0031-animatic.py <scratch>/animatic-frames --mp4
  preview-renders/tmb2-intro-overhaul/intro-0031-animatic-greybox.mp4` — 636 frames, muxed with
  `public/audio/intro-audio-53s.mp3`. ffprobe: 53.000 s, 1.56 MB, 1280×896 H.264 + AAC.
- PIL contact sheet at 24 timestamps covering every beat: beacon sweep, all four ritual stills
  (boots / coffee / flight case with CAPT. POP T nameplate / latch snap), the hangar reveal
  row-slam with the DC-9 silhouette and backlit figure on the 13.056 hit, all five suit-up cards
  on their cues, the door-shaft silhouette, shades streak on 30.48, the walk scale shot, engine
  start with grid-locked beacon, the three cockpit inserts (instruments / photo / throttles),
  lineup hold, roll on 45.12 with continuous 1 px rumble, rotate on 46.008, the jet pass +
  contrail on 47.496, emblem stamp on 49.704, pixel collapse. Every beat within one 12 fps frame
  of its cue.

### 2026-08-27 — automatic opening and deferred-art repair

- Fresh and restarted games mount the cinematic directly; the removed DC-9 station and outer
  Start Game button no longer gate it. The authored PRESS START remains the DC-9 handoff.
- Focused production-browser coverage passed 18/18. A separate 5/5 cross-flow run covered both
  Airbus restart paths, Model Y request protection, fresh entry, and the complete reordered
  journey. Required-width first-frame proof is under `/tmp/cockpit-auto-intro-proof/`.
- Review-driven RED proof held `plate-right-seat-glow` pending and observed a blank `card-cap-a`
  beat (9 illustrated pixels). The remaining 28 images now start together and merge as they
  decode; the same browser regression passes above 15,000 illustrated pixels. Follow-up
  independent review found no remaining critical, high, or important defects.

## Outcome and handoff

The scramble, owner-selected golden finale, and automatic console-style opening are integrated.
All implementation milestones are complete; the remaining handoff is owner review of the live
automatic entry and the previously recorded non-blocking nacelle-girth soft flag. No push or
deployment is part of this plan without explicit approval.
