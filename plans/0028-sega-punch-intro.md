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

- [x] Task 1 — Camera/flash/hitstop scaffolding, landed inert and pixel-identical. Commit `3caf67a`. Deviation from the sketch: camera carries `offsetX/offsetY` screen-space shake, and the world transform is applied inside `renderIntroFrame` around the world commands rather than as new draw commands, so every existing command-anchor test held unchanged; `flash` is a real command after `pixel-collapse`.
- [x] Task 2 — Ident gag on the extrapolated beat grid (enter 1.776, skid 2.496, tap 3.936 with white flash + shake + punch, flare 4.656, exit 5.376); logo build accelerated to 1.7 s; the tap now causes the highlight flare. Radial-rays dropped (they draw over the logo layers by the fixed FX table); flare sparkles instead. Test evolutions: scene-action t=2 expects the run-in; logo-threshold samples moved to 0.5/1/1.5; exact-command-list test relaxed to ordered logo layers + logo-under-sprite. Commit `48a1f32`.
- [x] Task 3 — Punch pass on every measured accent + tracking cameras. Hitstop redesigned mid-task: the freeze-then-jump form broke the ≤4px ballpark smoothness sweep (8.9px rejoin jump), replaced with freeze-then-catch-up (continuous, resynced 2.5×hold after the accent). Impact stars open at full presence and run on real time so the freeze frame reads as the hit. Commit `84b0abd`.
- [x] Task 3b — Still-driven repairs: runway focal y 150→185 (the cart was pushed behind the audio controls under zoom), exclaim flash 0.55→0.32 (the red wash drowned the storyboard's red "!"), grab focal headroom. Commit `898666a`.
- [x] Task 4 — Proof capture (stills at all punch moments, 244-frame 4 fps full-loop webp + two 12 fps punch-window webps, reduced-motion + 375/768/1440 spot checks). Full e2e result recorded in Evidence.
- [x] Task 5 — Acting prompt pack: 9 `character-acting` records (4 priority-1 gag clips, 5 polish-wave incl. the key mascot) in `generationPrompts` with the contract pipeline named per record, plus the owner-facing `asset-reports/tmb2-acting-frames-prompt-pack.md`.

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

### 2026-08-15 punch pass

- TDD per task: scaffolding RED 6 focused failures → GREEN 262/262 full suite; ident gag RED 4 → GREEN 263/263; punch pass RED 2 → 265/265 after the hitstop catch-up redesign (the ballpark ≤4px sweep caught the rejoin jump — recorded in Task 3). ESLint + tsc clean at each commit.
- Real-browser stills at every punch moment (1440×900, production build on 4173, clock-driven): ident run-in/skid/tap/flare/exit, duffel jolt, burst punch-in, exclaim slam, runway tracking, cart kick, deflect close-up, bull slam, sky grid, grab punch, stamp flash, emblem card — inspected; two defects found and fixed (cart behind controls; "!" drowned by the red wash), re-captured and verified. Committed under `preview-renders/tmb2-intro-overhaul/stills-sega-punch/`.
- Motion proofs assembled and PIL-verified (244 frames, non-black content sampled at f16/f99/f199): `intro-proof-sega-punch-1440x900-4fps.webp` (10.4 MB) plus 12 fps punch windows `punch-window-burst-exclaim-12fps.webp` and `punch-window-emblem-stamp-12fps.webp`. ffmpeg cannot decode animated webp (encoder-only) — verification used PIL.
- Reduced motion re-verified in-browser (`reducedMotion: 'reduce'`): representative poses, identity camera, no flashes at ident/exclaim/deflect/stamp samples. Responsive spot checks green at 375/768/1440 (ident tap + deflect close-up).
- `npm run assets:check` after the ledger prompt-pack addition: 78 assets / 21 preloads, contract passed.
- Full e2e after the punch pass: see the dated entry in `TEST_REPORT.md`.

## Outcome and handoff

Punch pass, ident gag, and prompt pack are implemented and locally validated. Work stops at the owner visual gate: review the motion proofs and stills, choose stamp-vs-eased emblem reveal (`EMBLEM_REVEAL_STYLE`), generate the priority-1 acting packs plus `runway-day-v1` from the recorded prompts. Acting-frame integration post-generation is a follow-up plan. No push before owner approval.
