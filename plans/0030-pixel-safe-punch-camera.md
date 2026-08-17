# Pixel-safe punch camera

> **Status: implemented 2026-08-17, awaiting the owner visual gate.** Owner approved the change on
> 2026-08-16, choosing to amend the 0029 contract first. The pixel-exact share of the intro went
> from 6.4% to 93.3%.

## Purpose

The intro is a 16-bit picture whose pixels stop being square for 93.5% of its runtime. Fixing that
makes every scene read as one crisp image instead of a soft one, and it is the difference between
the re-authored Pop T frames landing at full value or being blurred back to roughly where they
started.

## Current state

`src/game/introRenderer.ts` `withCamera` wraps the world draw commands — background, background-dim,
logo layers, props, sprites, fx — in `translate(focal + offset) → scale(zoom) → translate(-focal)`.
The card, transitions, accent flash, and Start handoff stay in screen space and are unaffected.
`withCamera` short-circuits only when `zoom === 1` and both offsets are 0.

Because the stage is point-sampled (`imageSmoothingEnabled = false`), any fractional `zoom` spreads
one stage pixel across an uneven number of device pixels. Measured over 5305 frames sampled at
100 Hz, `zoom` is exactly 1 on 6.4% of the intro.

## Discoveries

Measured 2026-08-16. Reproducible from `deriveIntroAnimation` alone; no browser needed.

### The camera is doing two unrelated jobs

| | share of intro | what it is |
| --- | --- | --- |
| Held at a fractional scene baseline | 61.5% | framing. No motion at all. |
| Below the baseline, easing toward it | 27.4% | a slow creep in at scene entry |
| Punch transient above the baseline | 11.1% | the actual hits |

The nine scene baselines are `tmb2-ident` 1.06, `duffel` 1.10, `key-escape` 1.04, `runway` 1.14,
`ballpark` 1.08, `city-finance` 1.08, `sky` 1.08, `final-pursuit` 1.10, `catch` 1.06. Each is a
constant held for most of its scene. **Nothing moves while they are held** — they are a composition
choice being paid for with the entire pixel grid.

### The tracking cameras deliver almost no movement

The focal point animates in six scenes (345 distinct focal points in `runway` alone). A fixed world
point's screen position moves by `(1 − zoom) × Δfocal`, so at these zooms the tracking is heavily
attenuated. Total on-screen travel across a whole scene:

| scene | focal x range | world shift on screen |
| --- | --- | --- |
| runway | 128 px | **18.3 px** over ~6 s |
| final-pursuit | 109 px | 11.9 px |
| city-finance | 110 px | 9.3 px |
| ballpark | 56 px | 4.9 px |
| key-escape | 27 px | 1.4 px |
| catch | — | 1.1 px |

### And the drift is below the threshold of sight

Per-frame screen movement of a fixed world point at 60 Hz, camera only:

| scene | max px/frame | mean px/frame | frames over 0.5 px |
| --- | --- | --- | --- |
| tmb2-ident | 5.65 | 0.111 | 15 / 359 |
| duffel | 1.08 | 0.099 | 14 / 359 |
| key-escape | 7.19 | 0.361 | 40 / 239 |
| runway | 4.52 | 0.111 | 12 / 359 |
| ballpark | 10.41 | 0.159 | 22 / 359 |
| city-finance | 7.10 | 0.127 | 19 / 419 |
| sky | 2.45 | 0.043 | 9 / 419 |
| final-pursuit | 13.52 | 0.271 | 38 / 359 |
| catch | 3.19 | 0.018 | 1 / 179 |
| loop-reset | 0.00 | 0.000 | 0 / 122 |

**This is the whole argument.** The maxima are the punches and the shake — real, visible, worth
keeping. The means are 0.02–0.36 px per frame: sub-pixel drift nobody can perceive as motion, on
83–96% of frames, resampling the entire stage the whole time. The camera pays full price
continuously for motion that is visible on roughly a tenth of frames.

### Background framing is free to change

`drawBackground` cover-crops a 1586×992 source to the stage, currently a 4.43× decimation with 169
source px of spare width, and already supports a ±12 stage px `travel` hook driven by `offsetX`.
Re-framing a scene means taking a different crop of that source — no new resampling cost, and more
parallax range available than any of the tracking shots above actually use.

## Proposed change

1. **Retire the nine held baselines to 1.0.** 61.5% of the intro becomes pixel-exact immediately,
   with zero change to any motion.
2. **Delete the focal tracking.** It contributes ≤18.3 px across an entire scene at a mean of
   0.02–0.36 px per frame. If any parallax is wanted back, express it as background `travel`, which
   is pixel-clean because it only moves the source crop.
3. **Keep the punch envelopes**, now as pure transients on top of 1.0, and clamp `Δ < 0.02` to zero
   — 230 frames, 2.3 s, below the threshold of visibility.
4. **Round `offsetX`/`offsetY` to whole stage pixels.** Peak shake is 1.13–2.93 px, so integer shake
   keeps the kick and puts it on the grid.

After this, the only frames with a fractional world transform are the punch envelopes themselves —
roughly 3.6 s of 53.04 s (~7%), spread across 13 accents at ~0.28 s each, every one of them landing
under an accent flash and four of them under a hitstop. That is the one moment in the intro when a
resample cannot be seen, and it is where the zoom is actually earning something.

## The decision this blocks

**Retiring the baselines makes every actor 4–14% smaller on stage**, because the baseline zoom was
magnifying them along with the world. Pop T in the `runway` scene was an apparent 120 stage px
before plan 0029, is 107 after the draw-scale fix, and would be 92 after this change.

`asset-reports/popt-sprite-contract.json` currently specifies a 92 px standing height, chosen to
match the post-0029 status quo **with the baselines still in place**. If they are retired, 92 comes
out 4–14% short of the staging that was reviewed.

So this is not a decision that can wait until after the frames exist:

- **If the camera change goes ahead**, amend the contract before the anchor is generated — standing
  height ~104 px, pivot moved to (64,120), baseline row 119, so the 128 cell keeps headroom for
  raised-arm poses. One edit, no other consequence.
- **If it does not**, the contract stands at 92 and the intro keeps its soft frame.

Either way the anchor should not be generated until this is answered, because the anchor fixes the
character's height for all 55 frames that follow.

## Options considered and rejected

- **Integer-only zoom (1 → 2).** The most hardware-honest option: Genesis could not zoom, it cut. But
  a 2× punch shows only 160×112 of the stage, so all 13 accents would need their framing re-staged
  from scratch — the same class of composition bug that pushed the runway cart behind the audio
  controls in 0028, thirteen times over. Too aggressive for the gain.
- **Supersample the stage to the display resolution and quantise zoom to 1/N.** Mathematically
  clean: with the backing store at the integer display scale, any zoom that is a multiple of 1/N
  keeps stage pixels whole. Rejected because N is viewport-dependent — the zoom quantum would be
  0.25 at 1440 px, 0.5 at 768, and 1.0 at 375, so the punch would feel different per device — and it
  is a renderer refactor with a real per-frame cost, plus the backgrounds would need pre-decimating
  to 320×224 to preserve their current look. Not worth it to rescue ~7% of frames.
- **Pixel-snap the sprites only, and let the background zoom smoothly.** Cheap and localised, and
  the background is already an aliased decimation so nobody would notice it creeping. Rejected
  because it does not work while a baseline zoom is *held*: the sprite would be drawn at an integer
  scale while the world sat at 1.14, leaving Pop T 14% undersized for the whole runway scene. It
  only becomes viable *after* step 1, at which point step 1 has already done the work.

## Work surface

- `src/game/introAnimation.ts` — 10 `zoom` literals; 66 coordinate-bearing call sites (23
  `poptActor`, 11 `keyActor`, 12 `prop`, 20 `fx.push`) to re-tune for the widened framing.
- `src/game/introRenderer.ts` — `withCamera` offset rounding; possibly widening the `travel` clamp.
- `src/game/introAnimation.test.ts` — 31 position and camera assertions to evolve.
- `e2e/smoke.spec.ts`, `e2e/locker-room.spec.ts` — the two specs that exercise the intro.
- `preview-renders/tmb2-intro-overhaul/` — full re-capture of the punch stills and motion proofs.

The mechanical half (baselines, tracking, offsets, clamp, tests) is small and self-contained. The
bulk of the effort is re-tuning the staging of nine scenes by eye and re-proving them, and that
lands on an owner visual gate because it changes the composition reviewed in 0028.

## Sequencing

This should run **before** the Pop T anchor is generated and **before** the 0028 punch proofs are
signed off, because both depend on the framing it changes. Suggested order:

1. Owner decides on this plan. *(blocking)*
2. If yes: amend the 0029 contract to the taller standing height and moved pivot.
3. Land steps 1–4 above, re-tune the nine scenes, re-capture proofs, owner visual gate on the new
   staging together with the 0028 punch review.
4. Owner generates the Pop T anchor against the amended contract; 0029 resumes.

## Acceptance criteria

- `zoom` is exactly 1 on every frame except inside a punch envelope, asserted over the full timeline.
- Camera offsets are whole stage pixels.
- No focal tracking remains, or what remains is background `travel` only.
- The punches still land on every measured accent with their existing attack and decay.
- Reduced motion is unchanged — it is already identity.
- Owner approves the re-staged composition of all nine scenes.

## Progress

- [x] 2026-08-16 — Scoped and measured; owner approved "do it, amend the contract first".
- [x] 2026-08-17 — All nine scene baselines retired to 1.0.
- [x] 2026-08-17 — `punchZoom` helper with a 0.02 dead zone; shake rounded to whole stage pixels.
- [x] 2026-08-17 — 0029 contract amended: standing height 92 → 104, pivot (64,112) → (64,120),
      baseline row 111 → 119, envelope widened; prompt pack and reference images regenerated.
- [x] 2026-08-17 — Nine scenes inspected in a real browser; one staging repair made.
- [ ] Owner visual gate on the re-staged composition, together with the 0028 punch review.

## Implementation steps

- [x] **Task 1 — Retire the baselines.** `src/game/introAnimation.ts`: the nine held zooms
      (`tmb2-ident` 1.06, `duffel` 1.10, `key-escape` 1.02/1.04, `runway` 1.14, `ballpark` 1.08,
      `city-finance` 1.08, `sky` 1.08, `final-pursuit` 1.10, `catch` 1.06) all become 1. The `sky`
      scene's camera was *only* a baseline ease, so its zoom is now the literal 1.
- [x] **Task 2 — Make the rest state structural.** Added `punchZoom(...lifts)`, which sums the punch
      envelopes and returns exactly 1 unless the sum clears `ZOOM_DEADZONE` (0.02). Zoom can no
      longer be lifted except by an accent, and a sub-visible push can no longer cost the grid.
- [x] **Task 3 — Integer shake.** `accentShake` now rounds its offsets. A fractional offset
      displaces the whole stage off-grid for the length of the kick; whole-pixel shake is also how
      the hardware this is imitating actually shook.
- [x] **Task 4 — Amend the 0029 contract** to the taller standing height and moved pivot, with a
      `dependsOn` block recording that the two number sets must not be mixed.
- [x] **Task 5 — Re-stage.** Only one repair was needed; see Deviations.
- [ ] **Task 6 — Owner visual gate.**

## Deviations from the scope

- **Focal tracking was kept, not deleted.** The scope proposed removing it. That turned out to be
  unnecessary work that would have made the punches worse: with the baseline at 1 the focal has no
  effect at all except while a punch is running, and during a punch it is exactly what aims the
  push-in at its subject. The measured drift the scope objected to was entirely a product of the
  held zoom, so retiring the zoom already removed it. The focals stay and now do one job well.
- **Re-staging was one line, not nine scenes.** The scope assumed the widened framing would need
  every actor coordinate remapped. It did not: actors sit near their focal points, so the apparent
  shift is 1–7 px in every scene, and all nine were inspected in a real browser and read correctly
  as staged. The single genuine repair was the runway cart.

## Evidence

### 2026-08-17 camera

- Camera census over 5305 frames at 100 Hz, after the change: **93.0% identity, 0.3% integer shake
  only, 6.7% (3.6 s) inside a punch envelope** — 93.3% pixel exact against 6.4% before. Every scene
  now rests at exactly 1: `%` of frames at rest is 94 (ident), 86 (duffel), 83 (key-escape), 95
  (runway), 94 (ballpark), 95 (city-finance), 100 (sky), 90 (final-pursuit), 100 (catch and
  loop-reset).
- Punch peaks preserved and relatively stronger, because the same lift now starts from a wider rest:
  ballpark peaks at 1.232 from 1.0 (a 1.23× push) where it previously peaked at 1.312 from 1.08 (a
  1.22× push). Peaks measured: ident 1.157, duffel 1.049, key-escape 1.217, runway 1.099, ballpark
  1.232, city-finance 1.180, final-pursuit 1.216.
- `npm run check` exit 0 — ESLint, TypeScript, Vitest 267/267 across 25 files, production build.
  `npm run assets:check` passed, 78 assets / 21 preloads.
- Test evolution recorded: `lands a camera punch, flash, or hitstop on every measured accent`
  asserted `chase.camera.zoom > 1.05` at t=18, which was pinning the held runway framing — the very
  thing being retired. Replaced with `toBe(1)` plus the existing assertion that the near-miss lifts
  it above the chase, which is strictly stronger: it now pins both the rest state and the punch.
- New test `rests the camera at identity and lifts it only for a punch` sweeps the full timeline
  asserting integer offsets, `zoom >= 1`, no value inside the dead zone, and that fewer than 15% of
  frames carry any lift at all.

### 2026-08-17 browser

- Production build on 4173, clock-driven, 1440×900. All eleven scene samples captured with no page
  errors: ident tap, duffel, exclaim, runway, cart, ballpark, bull, sky, pursuit, grab, emblem.
- Every scene reads crisper; the ident tap in particular now fits the whole TMB2 wordmark in frame,
  where the held 1.06 plus punch used to crop its edges. The emblem finale is byte-identical because
  the card is a screen-space command and was never inside the camera transform.
- **One repair.** The runway cart was still unreadable at its accent. Overlay bands measured in the
  live page, in stage rows: the Press Start button occupies 188–195 and the audio controls 204–219,
  so the gap between them is 9 rows and the cart needs 16. It moved from row 208 to 182, crossing
  just above the button at Pop T's shin, and now reads as a near-miss passing behind him. The 0028
  attempt at this could only lower the focal, because the held 1.14 zoom pushed the cart further
  down the frame the more the camera tried to include it.

## Outcome and handoff

Implemented and locally validated. Nothing pushed. The remaining gate is the owner's review of the
re-staged composition, which should be taken together with the 0028 punch proofs since both concern
the same frames. After that, plan 0029 resumes at the Wave 0 anchor against the amended contract.
