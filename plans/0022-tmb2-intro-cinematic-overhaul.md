# TMB2 Intro Cinematic Overhaul

> Successor to `plans/0017-tmb2-cinematic-restoration.md`. The restoration delivered the approved 10-scene Canvas runtime, exact timeline, Start latch, and handoff, but stalled at the owner visual gate: the motion itself does not deliver the authoritative storyboard. This plan closes that gap.

## Purpose

Make the shipped 53.04-second intro actually deliver the owner-approved eight-panel storyboard (`art-source/intro/tmb2/recovered/2026-07-19-storyboards/pilot Pop T with golden blond hair and blue eyes.png`) beat by beat: pixel-materialize entrance, duffel struggle, key burst with sparkle trail and red "!", real runway traversal, a synchronized baseball deflection, the chart climb and bull impact, the red digital laser-grid horizon, a resolved miss-then-catch, and the winged-globe emblem finale — all timed to measured musical accents.

## Current state

The restoration runtime (10 scenes, pure `deriveIntroAnimation` → draw commands → 320x224 Canvas) is live with the owner-approved TMB2 Productions ident (plan 0020). Confirmed execution failures against the storyboard:

- Pop T bobs in place on the runway (x≈76 ±4 px, no traversal); the key uses walking `run` poses in chase beats instead of `fly`.
- `once`/`hold-last` clips receive scene-start elapsed time, so bull-spin completes ~0.56 s into a 7 s scene and holds a splat frame; ballpark holds the slide end pose for seconds.
- No pixel-materialize entrance, no burst-from-bag, no sparkle trail, no red "!", no genuine ball deflection (two independent sine paths), no red digital horizon (named in the owner contract), no emblem finale (six white fillRects), no resolved catch contact.
- Runway plate is night; storyboard panel 4 is daylight.
- No beat is aligned to the 53.04 s music.

## Scope

Choreography and FX in `introAnimation.ts`/`introRenderer.ts`, two asset additions (storyboard-derived emblem card; owner-generated daylight runway plate), manifest governance closure for the three legacy Pop T sheets, and test evolution. Excludes: `introConfig.ts` timeline, `introRuntime.ts`, `GameIntro.tsx` input/audio/handoff, the ident scene, all non-intro chapters.

## Context and constraints

- Owner contract `docs/superpowers/specs/2026-07-20-tmb2-cinematic-restoration-design.md` remains binding: exact scene table, no visible captions, palette (deep navy/electric blue/white/gold/restrained red), sprites and props independent of plates and driven by the story clock, reduced-motion representative poses, spoiler exclusions.
- Renderer stays deterministic: no `Math.random`; fixed integer lattices in the `drawPixelCollapse` style.
- TMB2 logo bytes immutable (SHA-256 `673d13b9…ce17`). Storyboard crops are sanctioned derivatives; the derivation script pins the sheet hash.
- Never weaken a test; evolve assertions with equal-or-stronger equivalents.

## Progress

- [x] Owner decisions recorded (2026-08-14): daylight runway via owner ChatGPT generation from our prompt; emblem finale cropped from storyboard panel 8; all four pain points (acting, missing moments, background fidelity, pacing) in scope.
- [x] Music accents measured (see Discoveries); not yet baked into code.
- [ ] `src/game/introMusicCues.ts` baked + tested.
- [ ] Legacy Pop T sheets brought under the hashed manifest.
- [ ] FX scaffolding + key-path refactor (pixel-identical landing).
- [ ] Scene choreography rewrite (8 scenes).
- [ ] Emblem finale card pipeline.
- [ ] runway-day-v1 prompt recorded for owner generation.
- [ ] Daylight runway plate integrated (owner-dependent; night plate remains until it lands).
- [ ] Full validation + real-browser proof capture.
- [ ] Owner visual gate.

## Discoveries

- 2026-08-14 audio analysis (ffmpeg astats, 0.1 s RMS windows, jumps > 6 dB): accents sit on a ~0.36/0.72 s grid (~83 BPM). Selected story accents, each inside its locked scene window: assemble-done 7.512 (+16.9 dB), first duffel jolt 8.976 (+16.0) with 0.72 s period (10.464 +20.0, 11.952 +18.5), key burst 12.696 (+9.3 leading the slam), exclaim 13.056 (**+28.6, the largest hit in the track**), fly-exit 14.544, cart near-miss 19.368 (+13.4), ball deflect 24.552 (+14.6), bull impact 30.480 (+9.6), sky grid ignite 35.640 (+17.8), miss lunge 45.120 (+9.1), catch recover 46.008 (+20.1), catch grab 47.496 (+13.5), emblem stamp 49.704 (+20.3).
- Storyboard sheet is 1672x941, sha256 `0f9b2fed22597380c926028d39bf1c33470b32c42a7a59bbba335f1642f8b7d2`; panel 8 inner box ≈ (1231,467)-(1658,925); the emblem occupies the top ~300 px on near-black with a blue "8" chip in the top-left ~50x50 that must be painted out.
- `deriveIntroAnimation` is pure, so sparkle trails cannot come from stored state; they re-sample per-scene parametric key-path functions at `t − i·Δ` (clamped to scene entry), keeping determinism and loop safety.
- The renderer test anchors exact command indices (clear at 0, background at 1, handoff last two); FX draw commands slot between props/sprites/collapse without disturbing those anchors.
- Playwright Chromium, ffmpeg, and PIL are all present on this workstation — the real-browser gates that were blocked in earlier sandboxes are executable here.

## Decision log

- 2026-08-14 — Daylight runway: owner will generate `runway-day-v1` from our recorded prompt; integration is one atomic step at the end; `runway-night.png` remains the recorded fallback and ships if the plate misses the gate.
- 2026-08-14 — Emblem finale: derived by deterministic crop from the approved storyboard (no new art authority); presented as a 16-bit stamp pop (0.9 → 1.0 scale) with an eased-zoom alternative behind a constant for owner comparison at the gate.
- 2026-08-14 — Pop T's materialize entrance opens the duffel scene (6.0–7.5 s) rather than altering the approved ident scene; it mirrors the loop-reset pixel collapse in reverse, so the loop reads pixels → story → pixels.
- 2026-08-14 — `once`/`hold-last` clips move to event-relative elapsed time (`clipElapsed`); scene-start elapsed was the root cause of held splat poses.
- 2026-08-14 — The redundant procedural `graph` prop is removed; a `chart-glow` FX lit up to the key's progress makes the painted chart causal.
- 2026-08-14 — Legacy popt sheets relocate into `public/images/intro/tmb2/popt/legacy/` so every runtime image is hash-bound; a new cross-check test keeps `introAssets` paths ⊆ manifest preload permanently.

## Milestones

1. Foundations: music cues, manifest governance, FX scaffolding (pixel-identical).
2. Choreography: eight scenes rewritten to the storyboard with cue-timed FX.
3. Derived art: emblem finale card; runway-day prompt recorded (integration owner-dependent).
4. Proof: full checks, real-browser capture, owner visual gate.

## Implementation steps

- [ ] `src/game/introMusicCues.ts` + cue-window/monotonicity tests.
- [ ] Legacy sheet relocation + manifest rebuild (74→77 assets, 17→20 preloads) + contract-test literal + cross-check test + ledger record.
- [ ] FX state (`IntroFxFrame` union, `fx[]`, `backgroundDim`, `card`, sprite `opacity`), per-scene key-path functions + `keyTrail`, `clipElapsed`, renderer fx/dim/card commands with fixed under/over layering, new draw functions (laser grid, chart glow, radial rays, pixel assemble, exclaim, sweat, sparkle, burst flash, extracted impact star). Lands with all fx empty; output pixel-identical; suite green.
- [ ] Scene rewrites in storyboard order (duffel, key-escape, runway, ballpark, city-finance, sky, final-pursuit, catch), one commit per scene, unit tests alongside.
- [ ] `tools/assets/build-intro-emblem.py` + `asset:tmb2-emblem` script + manifest/preload + `emblem-finale` runtime asset + provenance + README.
- [ ] `runway-day-v1` prompt recorded in `asset-reports/tmb2-intro-assets.json` `generationPrompts`.
- [ ] Atomic daylight-runway integration when the plate lands.
- [ ] Proof capture + evidence.

## Validation plan

`npm run check` and (after manifest changes) `npm run assets:check` per task; focused Vitest first. Full `npm run test:e2e`. Real-browser proof per the 0017 precedent: 244 frames at 4 fps 1440x900 assembled to `preview-renders/tmb2-intro-overhaul/intro-proof-1440x900-4fps.webp`, per-panel contact sheets (assemble, duffel, burst+"!", runway traversal, deflection instant, chart climb + bull impact, laser-grid sky, miss, catch grab, emblem card, collapse), reduced-motion sheet, 375/768/1440 spot checks. Evidence here and in `TEST_REPORT.md`.

## Acceptance criteria

- Every storyboard panel is recognizably delivered in its scene window; FX hits land on the baked musical accents.
- All Vitest/Playwright suites green with evolved (never weakened) assertions; asset gate passes with the grown manifest.
- Deterministic renderer (identical frames for identical times); reduced motion shows curated representative poses with no transient FX.
- Owner approves the recorded browser proof before any push/publication.

## Repair loop and stop conditions

Review → focused repair → validation → remaining-delta review. Stop after three failed repairs of one root cause, when authoritative missing art blocks progress, or at the owner visual gate.

## Evidence

### 2026-08-14 baseline

- Branch `agent/tmb2-intro-overhaul` created from `agent/airbus-gameplay-evolution` HEAD `0719d8e` (main is an ancestor; the intro implementation lives on this lineage, not yet on main). Working tree clean apart from pre-existing untracked `.superpowers/` and `CLAUDE.md`.
- Audio accent extraction command and full accent table captured (see Discoveries); source `public/audio/intro-audio-53s.mp3`, 53.040 s per ffprobe.

## Outcome and handoff

Pending implementation. Work stops at the owner visual gate; the daylight runway plate integrates atomically whenever the owner supplies it (night plate ships otherwise). No push/publication before owner approval.
