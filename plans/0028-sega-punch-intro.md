# SEGA-Punch Intro Overhaul

> Successor to `plans/0022-tmb2-intro-cinematic-overhaul.md`. That plan delivered storyboard-faithful choreography, measured music cues, and the emblem finale, but the owner reviewed the result on 2026-08-15 and called it **still way under par** against the intended feel: a Genesis-era SEGA-style intro. Reference supplied by the owner: "The SEGA Logo Intro Compilation" (youtube.com/watch?v=hpgwsXT6NgU). This plan closes the feel gap.

## Purpose

Make the 53.04-second intro *feel* like a Genesis-era SEGA opening: bold screen-filling moments, camera punch-ins and hard cuts, flash frames and hitstop on the measured musical accents, and a proper SEGA-style logo gag in the TMB2 ident (Pop T interacting with the logo). After this work a player should get the same jolt of confident arcade energy the reference compilation delivers.

## Current state

- Branch `agent/tmb2-intro-overhaul`; all 0022 work committed through `a311c5a`. Vitest 256/256, e2e 51 passed / 1 skipped (17.4m, 2026-08-15), asset gate 78 assets / 21 preloads — all green.
- Reference analysis (2026-08-15, ~140 sampled frames): the SEGA feel decomposes into (1) acting — dozens of unique frames per gag, characters perform; (2) one bold subject, screen-filling, character interacts with the logo; (3) punch — hard cuts, flash frames, palette slams; (4) a distinct personality per treatment.
- Current build gap: fixed wide staging (never a punch-in or cut), no flash/hitstop on accents, ~35 unique Pop T frames total, ident is a passive logo wipe with no character.
- The stills are strong; the gap is motion, staging, and acting — not the still art.

## Owner decisions (2026-08-15)

- Current build judged under par; SEGA reference video is the feel target.
- Approach approved: **punch pass first (code only), acting frames second** (ChatGPT Image prompt packs the owner generates; Tripo held in reserve).
- **Ident reopened**: the plan-0020-approved TMB2 ident may be re-timed and gain a Pop T logo gag. TMB2 logo bytes stay immutable; only staging, timing, and FX around the logo change.
- Daylight runway plate (`runway-day-v1`) still owner-owed; integration stays one atomic step.

## Scope

Camera/flash/hitstop system and per-scene punch choreography in `introAnimation.ts`/`introRenderer.ts`; ident scene gag rewrite; test evolution; ChatGPT Image prompt pack for acting frames (recorded, owner-generated). Excludes: `introConfig.ts` timeline boundaries, `introRuntime.ts`, `GameIntro.tsx`, audio, all non-intro chapters, and any new production dependency.

## Context and constraints

- Owner contract from 0017/0022 still binding: no visible captions, palette (deep navy/electric blue/white/gold/restrained red), deterministic renderer (no `Math.random`), sprites driven by the story clock, reduced-motion representative poses, spoiler exclusions.
- **The key must not cameo in the ident** — its first reveal is the 12.696 duffel burst. The ident gag is Pop T solo.
- The red "!" exclaim stays exclusive to the key-escape slam (13.056, the track's biggest hit).
- Never weaken a test; evolve assertions with equal-or-stronger equivalents and record each evolution here.
- No push/publication before owner approval.

## Discoveries

- 2026-08-15 audio: the ident window (0–6 s) is a flat build pad — RMS sits at −35…−33 dB with no accents; the track onsets at 0.432 and the build starts at 6.408. The 0.72 s accent grid extrapolated back from the measured cues (8.976 − k·0.72) lands on 7.536 ≈ the measured 7.512 assemble-done accent, so ident gag beats lock to that grid: entry 1.776, skid 2.496, tap 3.936, flare 4.656 (the approved highlight threshold 0.78·6 = 4.68 already sits within 24 ms of this grid beat).
- Camera can be a pure frame field (`zoom` + focal point) consumed by `renderIntroFrame` as a world transform around background/logo/props/sprites/fx, leaving the draw-command list and its test anchors intact; card, pixel-collapse, flash, and handoff stay screen-space. With zoom ≥ 1 and the focal point inside the stage, full-stage fills still cover the canvas under the transform.
- Hitstop that freezes the acting clock at the accent and rejoins real time (`warped = t < accent + hold ? min(t, accent) : t`) keeps every existing just-after-accent assertion true (positions hold *at* the accent values) and stays music-synced because the hold is ≤ 140 ms.

## Milestones

1. Scaffolding: camera/flash/hitstop plumbing, landed inert and pixel-identical.
2. Ident logo gag: Pop T solo gag on the re-timed logo build, beats on the extrapolated grid.
3. Scene punch: per-accent punch-ins, cuts, flashes, shakes, hitstop across the eight story scenes.
4. Proof: full checks, stills + motion capture, owner visual gate.
5. Acting prompt pack: recorded ChatGPT Image prompts per gag (owner generates; frames integrate through the animation contract pipeline in a follow-up).

## Implementation steps

- [ ] Task 1 — `camera: { zoom, x, y }` and `flash: { color, opacity } | null` on `IntroAnimationFrame` (identity/null defaults), `hitstopTime`/`accentPunch`/`accentShake`/`accentFlash` helpers, renderer world-transform + `flash` draw command, reduced-motion forces identity camera and null flash. Lands inert; every existing test green unchanged; new tests pin identity/null at the ten sampled story times.
- [ ] Task 2 — Ident gag: accelerated logo build (complete ≈ 1.7 s), Pop T runs in on 1.776, skid + dust 2.496, tap 3.936 with white flash + shake + punch, highlight flare 4.656 with radial-rays, proud hold, exit toward the duffel scene. Logo-threshold and scene-action tests evolve to the new timings (documented here).
- [ ] Task 3 — Scene punch choreography: per-scene accent table (burst 12.696 punch, exclaim 13.056 red flash + hitstop + shake, cart 19.368, deflect 24.552 white flash + hitstop, bull 30.480 hitstop + shake, grid ignite 35.640 flash pulse, miss 45.120, grab 47.496 hitstop + punch, stamp 49.704 strong white flash), tracking cameras in runway/ballpark/city/pursuit, at least one hard cut (ballpark deflect close-up).
- [ ] Task 4 — Full `npm run check` + e2e, stills refresh, motion capture, evidence here and in `TEST_REPORT.md`, owner gate.
- [ ] Task 5 — Acting prompt pack recorded in `asset-reports/tmb2-intro-assets.json` `generationPrompts` + owner-facing doc (per-gag frame lists, animation-contract palette/pivot/size baked into each prompt).

## Validation plan

Focused Vitest per task, then full `npm run check`; `npm run assets:check` after any manifest change; full e2e before the gate. Real-browser stills at the punch moments (burst, exclaim, deflect, bull, grab, stamp, ident tap) plus motion capture per the 0022 method (drive the audio clock deterministically). Reduced-motion and 375/768/1440 spot checks.

## Acceptance criteria

- Every measured accent lands a visible punch (camera, flash, hitstop, or shake) and the ident delivers a readable Pop T logo gag.
- Deterministic renderer; reduced motion shows identity camera, no flashes, curated poses.
- All suites green with evolved (never weakened) assertions.
- Owner approves the recorded proof before any push.

## Repair loop and stop conditions

Review → focused repair → validation → remaining-delta review. Stop after three failed repairs of one root cause, at authoritative-art blockers, or at the owner visual gate.

## Evidence

### 2026-08-15 baseline

- `npm run check` exit 0 (Vitest 256/256 across 25 files); `npm run assets:check` 78/21; full e2e 51 passed / 1 skipped in 17.4 m — all before any 0028 change.
- Ident-window audio profile measured (flat pad, first accent 7.512); grid extrapolation recorded in Discoveries.

## Outcome and handoff

Pending implementation. Work stops at the owner visual gate; acting-frame integration (post-generation) is a follow-up plan.
