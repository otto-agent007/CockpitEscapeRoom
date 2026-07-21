# TMB2 Cinematic Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This repository's owner preference and the no-subagent constraint require inline execution.

**Goal:** Replace the rejected slideshow with the exact owner-approved 53.04-second TMB2 console comedy and a polished 650-millisecond Start-to-DC-9 handoff.

**Architecture:** Restore the previously proven pure media-clock runtime and integer-scaled 320 x 224 Canvas boundary, but replace its placeholder rectangles with a deterministic scene choreographer that draws recovered PNG frames, scene plates, and independent props. React owns lifecycle, native controls, preload state, audio, and input routing; pure TypeScript owns time normalization, scene selection, sprite-frame selection, choreography, and handoff progress.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Canvas 2D, Vitest 4, Playwright 1.61, existing PNG/JSON/audio assets, and no new production dependency.

## Global Constraints

- The briefing remains first and its **Start Game** button starts the cinematic at 0.000 seconds.
- Duration is exactly 53.04 seconds with boundaries `[0, 6, 12, 16, 22, 28, 35, 42, 48, 51, 53.04]`.
- **PRESS START** unlocks at exactly 6.000 seconds and remains latched across loops.
- Pointer, Enter, Space, and standard-controller Start all work and complete exactly once.
- Start performs a 300-millisecond music fade and 650-millisecond key-to-lock/DC-9 handoff.
- Native logical resolution is 320 x 224 with integer nearest-neighbor desktop scaling and black letterboxing.
- No visible scene titles; retain visually hidden summaries.
- Use recovered PNG frames and their durations/pivots. Animated WebP files are preview-only.
- No cockpit, Model Y, Flight Mode, or Mars spoiler appears before the handoff completes.
- Preserve audio fallback/retry, mute, volume, reduced-motion, and already-started DC-9 preload behavior.
- Add no production dependency and do not edit generated GLBs.
- Do not claim the historic 104/52 inventory restored until the manifest proves it.

---

## Prompt Contract

**Goal:** The player experiences the exact approved animated chase and can enter the already-preloaded DC-9 from any supported Start input.

**Context:** Owner authority is `docs/superpowers/specs/2026-07-20-tmb2-cinematic-restoration-design.md`; visual authority is the blonde-haired Pop T storyboard; recovered runtime art is under `public/images/intro/tmb2`; the rejected renderer is `src/components/GameIntro.tsx` plus `.game-intro*` CSS.

**Constraints:** Keep the 320 x 224 Canvas as the sole visual coordinate system, use media time as animation authority, keep React presentation separate from pure story logic, and preserve the downstream reducer/cockpit contracts.

**Done when:** Focused unit/browser checks pass, one full 1440 x 900 browser recording proves the loop and handoff, the full diff is reviewed, evidence is recorded, and owner visual approval is requested before publication.

## Current State

- Branch `agent/genesis-placeholder-intro` is clean at `93d268c` before this plan.
- Draft PR #51 contains the rejected recovery implementation.
- The current renderer swaps large background images and animated WebP previews at approximate boundaries, moves actors with CSS `steps()`, shows visible scene titles, completes automatically at 53 seconds, and lacks the approved Start handoff.
- The earlier robust runtime exists in Git history at `b5b89a3` but its Canvas renderer is intentionally only a placeholder; production logic must be implemented test-first rather than copied blindly.
- Current package evidence: 69 manifest assets, 17 preload entries, 24 recovered Pop T cinematic PNG frames, 17 preserved key PNG poses, five scene plates, and the 53.040-second audio.
- A reliable rejected-build motion recording exists at `/tmp/tmb2-before-repair-1440-4fps.webp` for local comparison.

## File Map

- Modify `src/game/introConfig.ts`: exact scene boundaries, summaries, durations, transition constants, and no visible caption contract.
- Modify `src/game/introConfig.test.ts`: exact 53.04-second timeline and spoiler/title assertions.
- Create `src/game/introAnimation.ts`: sprite clip metadata, frame selection, easing, choreography, and key transition derivation.
- Create `src/game/introAnimation.test.ts`: frame-duration, pivot, loop-mode, scene-action, and smooth-position tests.
- Create `src/game/introRuntime.ts`: media/fallback clock, monotonic Start latch, loop reset, retry generation, handoff state, and exactly-once completion.
- Create `src/game/introRuntime.test.ts`: loop, fallback, simultaneous input, and transition timing tests.
- Create `src/game/introAssets.ts`: initial decode set, lazy scene decode groups, typed load/error state, and safe local-path validation.
- Create `src/game/introAssets.test.ts`: preload tier, decode, error, and spoiler tests.
- Create `src/game/introGeometry.ts` and test: integer stage placement.
- Create `src/game/introRenderer.ts` and test: deterministic draw command derivation plus Canvas rendering.
- Create `src/components/intro/IntroCanvas.tsx`: ResizeObserver-controlled integer Canvas.
- Modify `src/components/GameIntro.tsx`: lifecycle, assets, audio loop/fade, keyboard/gamepad/pointer Start, handoff, and accessible summaries.
- Replace the current `.game-intro*` block in `src/styles.css`: letterbox, Canvas, CRT overlay, controls, prompt, and handoff classes.
- Modify `e2e/smoke.spec.ts`: exact cue boundaries, input methods, loop, transition, failure, reduced motion, and visual assertions.
- Modify `public/images/intro/tmb2/tmb2-intro-assets.json` and `asset-reports/tmb2-intro-assets.json` only if preload-tier evidence changes; hashes must be regenerated by the existing asset tooling.
- Modify `TEST_REPORT.md` and this plan with actual evidence.
- Create `preview-renders/tmb2-cinematic-restoration/**` only from actual browser captures.

## Progress

- [x] 2026-07-20 — Owner supplied and approved the exact 53.04-second sequence and clarified that the generic renderer is non-authoritative.
- [x] 2026-07-20 — Root causes recorded: animated WebP misuse, CSS stepped travel, static key poses, visible captions, wrong ident, and approximate boundaries.
- [x] Task 1 — Exact timing and animation contracts are green.
- [x] Task 2 — Runtime clock, Start latch, loop, and handoff are green.
- [x] Task 3 — Asset preload tiers and integer Canvas are green.
- [ ] Task 4 — Full recovered-art choreography renders in the browser.
- [ ] Task 5 — Browser proof, review, and owner gate complete.

## Discoveries

- The current `INTRO_DURATION_SECONDS` is `53`, not `53.04`, and current cues start at `[0,4,11,19,27,35,43,49]` instead of the approved boundaries.
- The current Pop T `<img>` elements use `.webp` previews. Those previews loop independently of media time and ignore each clip's `loopMode`.
- Current CSS uses `steps(12,end)` and `steps(10,end)` for actor travel, producing visible jumps.
- Recovered Pop T JSON files provide `durations`, `pivot: {x:128,y:224}`, frame files, and sheet layouts. The key JSON provides 17 equal-duration frames; exactly 16 will be assigned to the approved runtime groups.
- The recovered environment plates are flattened rather than four exported parallax layers. The restoration will separate scenery motion and independent prop draws in the 320 x 224 renderer without inventing nonexistent recovered files. The historic 104-artifact delta remains explicit.
- The shared ChatGPT URL could not be fetched, and the three named July 19 Markdown files do not exist locally or in Git history. The owner-pasted contract is therefore preserved verbatim in the restoration design record.

## Decisions

- Decision: restore Canvas rather than continue layered DOM images. Rationale: exact 320 x 224 pixels, deterministic media-clock animation, pivot-stable sprite drawing, clean CRT removal, and testable draw commands. Date: 2026-07-20.
- Decision: use individual recovered PNG frames for animation; keep WebP files only as review previews. Rationale: browser WebP playback cannot honor the authored media clock or hold-last/once semantics. Date: 2026-07-20.
- Decision: preserve recovered key pose 16 but omit it from the 16-frame runtime mapping until authority says otherwise. Rationale: the approved contract says 16 while recovery produced 17; silently expanding the choreography would redefine the design. Date: 2026-07-20.
- Decision: do not fake 104 deployed assets or 52 preloads. Rationale: counts are validation results, not targets to satisfy with synthetic filler. Date: 2026-07-20.
- Decision: use one inline execution stream. Rationale: user preference and current no-subagent constraint. Date: 2026-07-20.

## Task 1: Exact Timeline and Sprite Animation Contract

**Files:**
- Modify: `src/game/introConfig.test.ts`
- Modify: `src/game/introConfig.ts`
- Create: `src/game/introAnimation.test.ts`
- Create: `src/game/introAnimation.ts`

**Interfaces:**
- Produces `INTRO_DURATION_SECONDS = 53.04`, `START_AVAILABLE_SECONDS = 6`, `INTRO_AUDIO_FADE_SECONDS = 0.3`, `INTRO_HANDOFF_SECONDS = 0.65`, `introScenes`, `getIntroScene(time)`, and `normalizeIntroTime(time)`.
- Produces `getSpriteFrame(clip, elapsedMs): number`, `deriveIntroAnimation(timeSeconds, reducedMotion): IntroAnimationFrame`, and `deriveHandoffAnimation(progress): HandoffFrame`.

- [x] **Step 1: Write failing exact-timeline tests**

Assert exact starts/ends, scene IDs, `53.04`, the six-second Start gate, visually hidden summaries, and no visible captions/spoilers. Existing tests must fail on the current approximate eight-cue contract.

- [x] **Step 2: Run RED**

Run: `npm run test -- src/game/introConfig.test.ts`

Expected: FAIL showing `53 !== 53.04` and incorrect boundaries.

- [x] **Step 3: Implement the minimal exact timeline**

Use IDs `tmb2-ident`, `duffel`, `key-escape`, `runway`, `ballpark`, `city-finance`, `sky`, `final-pursuit`, `catch`, and `loop-reset` with the exact table in the approved design.

- [x] **Step 4: Write failing sprite-selection tests**

Cover variable durations and all loop modes with concrete samples:

```ts
expect(getSpriteFrame({ durations: [140, 120, 160, 180], loopMode: 'loop' }, 0)).toBe(0)
expect(getSpriteFrame({ durations: [140, 120, 160, 180], loopMode: 'loop' }, 140)).toBe(1)
expect(getSpriteFrame({ durations: [90, 110, 260], loopMode: 'hold-last' }, 999)).toBe(2)
expect(getSpriteFrame({ durations: [80, 80, 80], loopMode: 'once' }, 999)).toBe(2)
```

Also assert all Pop T frames use pivot `(128,224)`, key groups contain exactly `4+6+4+2`, and world positions vary continuously rather than in 10/12-step jumps.

- [x] **Step 5: Run animation RED, implement, and rerun GREEN**

Run: `npm run test -- src/game/introAnimation.test.ts`

Expected RED: module/API missing. Implement the smallest pure metadata and derivation module, then rerun both Task 1 files expecting PASS.

- [x] **Step 6: Record Task 1 evidence and commit**

Commit message: `feat: restore exact TMB2 animation contract`

## Task 2: Drift-Free Runtime and Start Handoff

**Files:**
- Create: `src/game/introRuntime.test.ts`
- Create: `src/game/introRuntime.ts`

**Interfaces:**
- Produces `createIntroRuntimeState`, `sampleIntroClock`, `enterIntroFallback`, `resetIntroRuntimeLoop`, `runIntroAudioRetry`, `requestIntroHandoff`, `sampleIntroHandoff`, and `disposeIntroRuntime`.
- `requestIntroHandoff` accepts only when Start is latched; it moves to `handoff` without immediately dispatching game completion.
- `sampleIntroHandoff` reports audio gain `1 -> 0` across 0.3 seconds and completion at 0.65 seconds.

- [x] **Step 1: Write failing runtime tests**

Test the six-second monotonic latch across a natural loop, fallback loop reset, pending retry races, simultaneous pointer/gamepad requests, 300 ms gain curve, 650 ms completion, and rejection before six seconds.

- [x] **Step 2: Run RED**

Run: `npm run test -- src/game/introRuntime.test.ts`

Expected: FAIL because the runtime module is absent on this branch.

- [x] **Step 3: Implement minimal runtime and rerun GREEN**

Reuse the behavior contract proven by PR #49, extended with a distinct handoff phase. Do not make React state the authority.

- [x] **Step 4: Record Task 2 evidence and commit**

Commit message: `feat: restore TMB2 media clock and handoff`

## Task 3: Preload Tiers and Integer Canvas Boundary

**Files:**
- Create: `src/game/introAssets.test.ts`
- Create: `src/game/introAssets.ts`
- Create: `src/game/introGeometry.test.ts`
- Create: `src/game/introGeometry.ts`
- Create: `src/game/introRenderer.test.ts`
- Create: `src/game/introRenderer.ts`
- Create: `src/components/intro/IntroCanvas.tsx`

**Interfaces:**
- `preloadIntroAssets(baseUrl, tier)` returns decoded images keyed by stable asset IDs and preserves failing ID/path.
- Initial tier includes the ident necessities and first scene; later scene groups decode ahead of their boundary without blocking the briefing indefinitely.
- `computeIntroStagePlacement(width,height)` returns integer scale/left/top/width/height.
- `deriveIntroDrawCommands(animationFrame, assets)` returns stable ordered background, actor, prop, pixel-effect, and CRT commands.

- [x] **Step 1: Write and run asset RED tests**

Assert safe local paths, unique IDs, no protected spoilers, initial-vs-full tiers, and decode errors that identify the exact asset. Run `npm run test -- src/game/introAssets.test.ts`; expect missing module/API failure.

- [x] **Step 2: Implement preload tiers and run GREEN**

Use current manifest-backed PNGs. Do not decode animated WebP previews. Record current actual preload counts rather than forcing 52.

- [x] **Step 3: Write and run geometry/renderer RED tests**

Assert 1440 x 900 produces integer 4x scale with a 1280 x 896 stage at `(80,2)`, 768 x 900 produces 2x at `(64,226)`, and 375 x 812 produces 1x at `(27,294)`. Assert the renderer emits no visible title command and maintains actor pivot alignment.

- [x] **Step 4: Implement geometry, draw commands, Canvas component, and run GREEN**

Set `context.imageSmoothingEnabled = false`, clear to black, draw scene art/props/sprites in deterministic order, and contain CRT treatment inside the Canvas/intro shell.

- [x] **Step 5: Record Task 3 evidence and commit**

Commit message: `feat: render TMB2 on an integer canvas`

## Task 4: React Integration and Supported Inputs

**Files:**
- Modify: `src/components/GameIntro.tsx`
- Modify: `src/styles.css`
- Modify: `e2e/smoke.spec.ts`

**Interfaces:**
- `GameIntro` keeps the briefing and `onComplete` boundary unchanged.
- Canvas `data-scene`, `data-time`, `data-popt-frame`, `data-key-frame`, `data-start-available`, and `data-transition-state` expose deterministic browser evidence without visible debug UI.

- [ ] **Step 1: Write failing browser assertions**

Assert Start Game begins at ident time zero, no visible scene headings exist, exact boundary scenes are reported, PRESS START is absent at 5.999 and present at 6.000, natural end loops rather than completes, and pointer/Enter/Space/gamepad each produce one 650 ms handoff.

- [ ] **Step 2: Run browser RED**

Run: `npm run test:e2e -- e2e/smoke.spec.ts -g "TMB2 cinematic" --workers=1`

Expected: FAIL on current headings, approximate scenes, auto-completion, and missing Start prompt/handoff.

- [ ] **Step 3: Integrate runtime, Canvas, and controls**

Replace cue `<img>` rendering. Keydown ignores repeat and native controls. Poll standard gamepad button 9 edge transitions. During handoff, set audio volume from runtime gain, add a CRT-release class, and call `onComplete` only when runtime reports the 650 ms transition complete.

- [ ] **Step 4: Replace intro CSS**

Keep only black letterbox, integer Canvas, restrained CRT overlays, accessible controls, blue PRESS START, and handoff release. Remove `.game-intro__copy`, `.game-intro__popt`, `.game-intro__key`, and all `intro-*-chase ... steps()` rules.

- [ ] **Step 5: Run focused GREEN and nearby regressions**

Run:

```bash
npm run test -- src/game/introConfig.test.ts src/game/introAnimation.test.ts src/game/introRuntime.test.ts src/game/introAssets.test.ts src/game/introGeometry.test.ts src/game/introRenderer.test.ts
npm run test:e2e -- e2e/smoke.spec.ts -g "TMB2 cinematic|opening stays spoiler-safe" --workers=1
npm run lint
npm run typecheck
```

- [ ] **Step 6: Record Task 4 evidence and commit**

Commit message: `feat: play the complete TMB2 chase intro`

## Task 5: Actual Browser Motion Gate

**Files:**
- Create: `preview-renders/tmb2-cinematic-restoration/**`
- Modify: `TEST_REPORT.md`
- Modify: `plans/0017-tmb2-cinematic-restoration.md`

- [ ] **Step 1: Launch production build in the actual browser**

Run the production preview at 1440 x 900. Confirm no console errors, failed runtime asset requests, HTTP errors, or horizontal overflow.

- [ ] **Step 2: Record one uninterrupted proof**

Capture briefing -> Start Game -> full 53.04-second unattended loop -> second-loop PRESS START -> 650 ms handoff -> interactive DC-9. Use a browser recording format that is actually viewable; if native WebM again records only the GPU background, use deterministic screenshot capture assembled into an animated WebP/MP4 and verify the output visually before presenting it.

- [ ] **Step 3: Inspect the full recording**

Reject and repair if the logo is not blue/striped, any visible chapter title appears, Pop T or key pivots twitch, actor travel jumps, a comedy beat is missing, CRT persists into DC-9, or the cockpit appears before Start.

- [ ] **Step 4: Run full relevant verification**

After visual acceptance locally, run `npm run check`, `npm run assets:check`, and `npm run test:e2e -- --workers=1`. Never claim an unrun check passed.

- [ ] **Step 5: Full-diff review and evidence update**

Inspect for unsafe DOM insertion, duplicate timing logic, unmanifested assets, reward spoilers, dependency additions, stale CSS, and downstream reducer changes. Update `TEST_REPORT.md` and this plan with actual commands/results and the historic 104/52 inventory delta.

- [ ] **Step 6: Owner visual gate**

Present the uninterrupted recording before pushing a replacement visual revision to PR #51. Publication and Vercel proof occur only after owner approval of motion and look.

## Validation Plan

- Unit: exact timeline, normalization, sprite durations, loop modes, pivots, continuous choreography, fallback clock, retry races, Start latch, handoff timing, asset tiers, integer geometry, and draw-command order.
- Browser: briefing, asset loading/failure/retry, audio failure/retry, cue boundaries, full loop, pointer, Enter, Space, controller Start, reduced motion, one completion, CRT release, and DC-9 interactivity.
- Visual: uninterrupted 1440 x 900 recording plus representative 320 x 224 logical-frame captures.
- Accessibility: native controls, focus preservation, visually hidden summaries, no key hijacking on inputs, and status announcements.
- Regression: spoiler guard and existing reordered-journey smoke coverage.

## Acceptance Criteria

- The approved ten-scene timeline is exact to the declared boundaries and loops at 53.04 seconds.
- TMB2 is a blue original console-style ident assembled from pixels with a gold-white overload.
- Pop T and the cartoon key animate from recovered PNG frames with stable pivots and correct clip semantics.
- All named comedy beats are visibly present; world motion is continuous and no visible scene titles appear.
- PRESS START appears at six seconds and all four input methods initiate one transition.
- Music fades in 300 ms, the key lock transition lasts 650 ms, CRT disappears, and the preloaded DC-9 becomes interactive.
- No intro visual spoils cockpit gameplay or protected later rewards.
- Focused/full checks report actual results, and the owner approves the recorded browser proof.

## Repair Loop and Stop Conditions

For each task: write one failing test, verify the expected failure, implement the smallest coherent behavior, rerun focused tests, launch the real browser when visual, inspect the remaining delta, and update this plan. Stop after three attempts at the same unchanged root cause, if authoritative missing art prevents progress, or at the owner visual gate. Do not push a new visual claim while the recording still shows a known defect.

## Evidence

- 2026-07-20 Task 1 timeline RED: `npm run test -- src/game/introConfig.test.ts` failed 5/5 tests against `53`, the approximate eight-cue boundaries, missing normalized-time API, and visible-caption-shaped data.
- 2026-07-20 Task 1 animation RED: `npm run test -- src/game/introAnimation.test.ts` failed because the animation-contract module did not exist.
- 2026-07-20 Task 1 GREEN: `npm run test -- src/game/introAnimation.test.ts src/game/introConfig.test.ts` passed 12/12 tests. `npm run typecheck` passed after adding a temporary compile-only bridge for the rejected DOM renderer; Task 4 removes that bridge with the renderer.
- `git diff --check` passed before the Task 1 checkpoint.
- 2026-07-20 Task 2 runtime RED: `npm run test -- src/game/introRuntime.test.ts` failed because the runtime controller did not exist on the recovery branch.
- 2026-07-20 Task 2 first implementation pass exposed one overly exact floating-point progress assertion at 150 ms; the behavioral assertion was corrected to `toBeCloseTo` without weakening the 300 ms/650 ms contract.
- 2026-07-20 Task 2 GREEN: the three focused files passed 19/19 tests, `npm run typecheck` passed, and `git diff --check` passed. Coverage includes drift-free media/fallback loops, the monotonic Start latch, retry races, simultaneous Start rejection, the audio fade, and exactly-once handoff completion.
- 2026-07-20 Task 3 asset RED: `npm run test -- src/game/introAssets.test.ts` failed because the PNG-only tiered preload module did not exist.
- 2026-07-20 Task 3 geometry/renderer RED: both focused suites failed because the integer placement and Canvas draw-command modules did not exist.
- 2026-07-20 Task 3 GREEN: six focused files passed 31/31 tests. The renderer registers 15 actual PNG images, decodes only four opening assets before playback, uses the exact 320 x 224 integer placements at 1440/768/375 widths, and emits no visible-title command. `npm run typecheck`, `npm run lint`, and `git diff --check` passed.

## Outcome and Handoff

- Pending implementation and owner motion review.
