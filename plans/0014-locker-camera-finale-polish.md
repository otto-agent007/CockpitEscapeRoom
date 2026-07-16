# Locker Camera Finale Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** End the locker opening on the owner-selected right-panned watch view, show a settled two-second 3D captain's-hat close-up before the existing popup/confetti, and replace the Wings retry jargon with the approved practical hints.

**Architecture:** Keep the saved `lockerHatRevealed` flag in the reducer as the durable completion authority. Add deterministic watch/hat camera poses in `PrototypeScene.tsx` and a transient `idle | moving | holding | ready` finale stage in `App.tsx`; this stage delays the popup only when the player completes Wings in the current session, while reload and accessible fallback continue directly to the persisted popup.

**Tech Stack:** React 19, TypeScript, React Three Fiber, Three.js, Vitest, Playwright, Vite.

## Global Constraints

- Preserve the locker asset, prop hierarchy, stable `game_id` contracts, and existing memory order.
- Preserve the normal-motion Captain's Hat popup and all 24 existing confetti pieces.
- Continue honoring `prefers-reduced-motion`: snap camera motion and omit animated confetti, but keep the two-second settled hat hold.
- Add no production dependency, schema migration, Blender edit, generated GLB edit, celebration-image edit, aircraft change, or Model Y spoiler.
- Keep game rules and persisted completion in `src/game`; keep 3D camera presentation in `src/scenes`.
- Preserve accessible fallback, keyboard focus, reload/resume, safe retry, and completed-memory progress.
- Preserve all unrelated dirty-worktree changes. Shared files require hunk-level review before staging.
- Approved first Wings retry: `Think in flight hours: it’s a round-number milestone between 500 and 1,500.`
- Approved repeated Wings retry: `It’s a four-digit milestone below the 1,500-hour ATP requirement.`
- Owner visual reference: `/home/user1/Pictures/Screenshots/Screenshot from 2026-07-16 01-02-55.png`.

---

## Purpose

The locker opening should finish with the same three-quarter watch composition the owner created manually: the camera travels slightly right while zooming, the watch settles near the center of the right bay, and more bench remains visible to the left. Finishing the fourth memory should then reward the player with the revealed 3D captain's hat, hold on it for two seconds after the camera settles, and only then present the existing popup and confetti.

## Current State

- `src/scenes/PrototypeScene.tsx` applies one shared `LOCKER_CLOSE_FOCUS_OFFSET` to Watch, Baseball, Charging Bull, and Wings. `watch-focus` therefore ends square to the locker rather than at the owner screenshot's right-panned angle.
- `LockerCameraCue` has no hat cue. The real hat is revealed by reducer state, but the camera remains on Wings.
- `src/App.tsx` derives `captainHatCelebrationActive` directly from `state.lockerHatRevealed`, so the popup mounts immediately after the correct Wings answer.
- `src/game/config.ts` uses unexplained Part 121 jargon in the first Wings retry.
- `CaptainHatCelebration` already owns the approved card, image, keyboard focus, 24 confetti pieces, and reduced-motion no-confetti behavior. It does not need redesign.

## Scope

Included:

- Dedicated owner-reference watch camera pose.
- New close `hat-focus` camera cue.
- First-run hat move, settle, two-second hold, then existing celebration.
- Immediate persisted/reload and accessible-fallback celebration behavior.
- Approved first and repeated Wings hint copy.
- Focused unit/browser regression coverage, responsive screenshots, living plan, and `TEST_REPORT.md` evidence.

Excluded:

- Locker `.blend` or GLB changes, prop repositioning, material/lighting changes, new popup artwork, new confetti behavior, persistence/schema changes, and non-locker work.

## Prompt Contract

**Goal:** The player sees the requested watch endpoint and an intentional hat close-up before the unchanged celebration.

**Context:** The approved design is `docs/superpowers/specs/2026-07-16-locker-camera-finale-polish-design.md`; the owner framing reference is the July 16 01:02:55 screenshot; current locker camera and celebration code live in `src/scenes/PrototypeScene.tsx` and `src/App.tsx`.

**Constraints:** Honor every Global Constraint above, especially the normal confetti, reduced-motion accessibility behavior, persisted completion, and mixed-worktree preservation.

**Done when:** The exact hint copy passes reducer tests; the real canvas settles on the new watch and hat cues; the popup is absent for 2,000 milliseconds after hat settle and then appears with confetti in normal motion; reduced motion snaps then holds without confetti; reload/fallback paths remain direct; focused and full checks pass; 1440/768/375 evidence and actual command results are recorded.

## File Structure

- Modify `src/game/config.ts`: approved Wings retry strings only.
- Modify `src/game/state.test.ts`: focused progressive-hint expectations.
- Modify `src/scenes/PrototypeScene.tsx`: camera cue union, dedicated watch pose, hat pose, and stable camera diagnostic attributes.
- Modify `src/App.tsx`: transient first-run finale stage and popup gating.
- Modify `e2e/locker-room.spec.ts`: real-canvas watch/hat timing, reload, fallback, reduced-motion, and confetti assertions.
- Modify `plans/0014-locker-camera-finale-polish.md`: living progress, discoveries, decisions, evidence, and outcome.
- Modify `TEST_REPORT.md`: actual commands, results, viewport captures, and remaining owner gate.
- Create `preview-renders/locker-camera-finale/locker-watch-owner-framing-{1440,768,375}.png`.
- Create `preview-renders/locker-camera-finale/locker-hat-hold-{1440,768,375}.png`.
- Create `preview-renders/locker-camera-finale/locker-hat-celebration-{1440,768,375}.png`.

---

### Task 1: Practical Wings Hint Ladder

**Files:**
- Modify: `src/game/state.test.ts:406-419`
- Modify: `src/game/config.ts:94-105`

**Interfaces:**
- Consumes: `gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response })` and `lockerFlow.memories.wings.retry/strongerHint`.
- Produces: exact player-facing first and repeated retry messages; no type or reducer-shape change.

- [x] **Step 1: Replace the old substring checks with exact approved-message assertions**

```ts
state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: '500 hours' })
expect(state.lockerCompleted).toEqual(['watch', 'baseball', 'chargingBull'])
expect(state.statusMessage).toBe('Think in flight hours: it’s a round-number milestone between 500 and 1,500.')

state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: '1500 hours' })
expect(state.lockerAttempts.wings).toBe(2)
expect(state.statusMessage).toBe('It’s a four-digit milestone below the 1,500-hour ATP requirement.')
```

- [x] **Step 2: Run the focused test and verify the red state**

Run: `npm run test -- --run src/game/state.test.ts`

Expected: FAIL because the reducer still returns `Part 121 experience milestone` and `ATP total-time requirement` wording.

- [x] **Step 3: Apply the approved copy in config**

```ts
retry: 'Think in flight hours: it’s a round-number milestone between 500 and 1,500.',
strongerHint: 'It’s a four-digit milestone below the 1,500-hour ATP requirement.',
```

- [x] **Step 4: Run the focused test and verify green**

Run: `npm run test -- --run src/game/state.test.ts`

Expected: PASS with all state tests green and no completed-memory regression.

- [x] **Step 5: Review the Task 1 delta without staging unrelated shared-file changes**

Run: `git diff -- src/game/config.ts src/game/state.test.ts`

Expected: the new hint assertions and strings are identifiable as isolated hunks among any pre-existing user changes.

---

### Task 2: Dedicated Watch and Hat Camera Poses

**Files:**
- Modify: `e2e/locker-room.spec.ts:226-292`
- Modify: `src/scenes/PrototypeScene.tsx:32-69,285-365`

**Interfaces:**
- Consumes: `lockerCameraCue: LockerCameraCue`, `lockerCameraImmediate: boolean`, and `onLockerCameraSettled(cue)`.
- Produces: `LockerCameraCue` including `'hat-focus'`; deterministic `watch-focus` and `hat-focus` poses; canvas diagnostics `data-locker-camera-position` and `data-locker-camera-target`.

- [x] **Step 1: Add failing real-canvas assertions for the owner-reference watch pose and new hat cue contract**

Immediately after the existing settled watch assertions, add:

```ts
await expect(canvas).toHaveAttribute('data-locker-camera-position', '1.17,-0.38,3.18')
await expect(canvas).toHaveAttribute('data-locker-camera-target', '0.42,-0.75,-0.21')
```

After the correct Wings submission, add the expected new cue boundary:

```ts
await expect(canvas).toHaveAttribute('data-locker-camera-cue', 'hat-focus')
await expect(canvas).toHaveAttribute('data-locker-camera-state', 'settled')
```

- [x] **Step 2: Run the real-locker case and verify the red state**

Run: `npm run test:e2e -- e2e/locker-room.spec.ts --grep "locker GLB loads into the real canvas" --workers=1`

Expected: FAIL because the camera position/target attributes and `hat-focus` cue do not exist.

- [x] **Step 3: Add explicit watch/hat targets and the new cue**

Use these initial owner-reference values:

```ts
const LOCKER_WATCH_POSITION = [0.42, -0.75, -0.21] as const
const LOCKER_WATCH_CAMERA_TARGET = [0.42, -0.75, -0.21] as const
const LOCKER_WATCH_CAMERA_POSITION = [1.17, -0.38, 3.18] as const
const LOCKER_HAT_POSITION = [0.42, 1.00, -0.14] as const

export type LockerCameraCue =
  | 'entry-wide'
  | 'watch-focus'
  | 'baseball-focus'
  | 'bull-focus'
  | 'wings-focus'
  | 'hat-focus'
```

Define the poses without changing the Baseball/Bull/Wings shared offset:

```ts
'watch-focus': {
  position: [...LOCKER_WATCH_CAMERA_POSITION],
  target: [...LOCKER_WATCH_CAMERA_TARGET],
  fov: LOCKER_CLOSE_FOCUS_FOV,
  duration: LOCKER_CAMERA_MOVE_SECONDS,
},
'hat-focus': lockerCloseFocusPose(LOCKER_HAT_POSITION, LOCKER_MEMORY_CAMERA_MOVE_SECONDS),
```

- [x] **Step 4: Publish deterministic position/target diagnostics at the cue boundary**

Inside `LockerCameraDirector`'s cue effect, add:

```ts
canvasRef.current.dataset.lockerCameraPosition = pose.position.toArray().map((value) => value.toFixed(2)).join(',')
canvasRef.current.dataset.lockerCameraTarget = pose.target.toArray().map((value) => value.toFixed(2)).join(',')
```

- [x] **Step 5: Run typecheck and the real-locker case**

Run: `npm run typecheck`

Expected: PASS with every `Record<LockerCameraCue, LockerCameraPose>` member defined.

Run: `npm run test:e2e -- e2e/locker-room.spec.ts --grep "locker GLB loads into the real canvas" --workers=1`

Expected at this checkpoint: the watch diagnostic assertions pass; the `hat-focus` assertion remains red until Task 3 drives the cue.

- [x] **Step 6: Compare the watch frame with the owner screenshot and adjust only the dedicated watch pose if required**

Run the app at 1440x900, skip the cinematic after the real GLB loads, and capture `/tmp/locker-watch-owner-framing-1440.png`. Compare it with `/home/user1/Pictures/Screenshots/Screenshot from 2026-07-16 01-02-55.png`.

Expected: the right locker bay and watch occupy the same three-quarter composition; if one bounded adjustment is required, change `LOCKER_WATCH_CAMERA_POSITION` and `LOCKER_WATCH_CAMERA_TARGET` together, then update the two exact e2e diagnostics to the approved values.

- [x] **Step 7: Review the Task 2 delta**

Run: `git diff -- src/scenes/PrototypeScene.tsx e2e/locker-room.spec.ts`

Expected: only cue/pose/diagnostic/test hunks for the locker are new; DC-9/Airbus hunks remain untouched.

---

### Task 3: First-Run Hat Finale State Machine

**Files:**
- Modify: `e2e/locker-room.spec.ts:124-208,226-298`
- Modify: `src/App.tsx:118-165,188-220,388-408,487-590`

**Interfaces:**
- Consumes: durable `state.lockerHatRevealed`, `lockerLoadState.status`, `skipPrototypeScene`, `reducedMotion`, and `handleLockerCameraSettled('hat-focus')`.
- Produces: transient `LockerHatFinaleStage = 'idle' | 'moving' | 'holding' | 'ready'`; `CaptainHatCelebration` mounts only at `ready`; reload initializes `ready`; accessible fallback advances directly to `ready`.

- [x] **Step 1: Add failing normal-motion celebration-order assertions**

In the accessible full-memory case, retain the current immediate popup expectation because `skip3d=1` is the fallback boundary. In the real-canvas case, replace the immediate popup expectation after the correct Wings answer with:

```ts
await expect(canvas).toHaveAttribute('data-locker-camera-cue', 'hat-focus')
await expect(canvas).toHaveAttribute('data-locker-camera-state', 'settled')
await expect(page.locator('main')).toHaveAttribute('data-locker-hat-finale-stage', 'holding')
await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE UNLOCKED' })).toHaveCount(0)
await page.waitForTimeout(1_900)
await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE UNLOCKED' })).toHaveCount(0)
await expect(page.locator('main')).toHaveAttribute('data-locker-hat-finale-stage', 'ready', { timeout: 1_000 })
await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE UNLOCKED' })).toBeVisible()
```

Add a normal-motion assertion in the accessible flow that the final celebration still contains 24 pieces:

```ts
await expect(celebration.locator('.qualification-confetti i')).toHaveCount(24)
```

- [x] **Step 2: Run focused browser tests and verify the red state**

Run: `npm run test:e2e -- e2e/locker-room.spec.ts --grep "watch completion|locker GLB loads" --workers=1`

Expected: FAIL because the real path still mounts the popup immediately and the finale stage attribute does not exist.

- [x] **Step 3: Add the transient finale stage and exact hold constant**

Near the locker timing constants and state declarations in `App.tsx`, add:

```ts
const LOCKER_HAT_HOLD_MS = 2_000
type LockerHatFinaleStage = 'idle' | 'moving' | 'holding' | 'ready'

const [lockerHatFinaleStage, setLockerHatFinaleStage] = useState<LockerHatFinaleStage>(() =>
  state.phase === 'locker' && state.lockerHatRevealed ? 'ready' : 'idle',
)
```

Derive the display gates:

```ts
const lockerHatFinaleActive =
  state.phase === 'locker' && state.lockerHatRevealed && lockerHatFinaleStage !== 'ready'
const captainHatCelebrationActive =
  state.phase === 'locker' && state.lockerHatRevealed && !lockerIntroActive && lockerHatFinaleStage === 'ready'
```

- [x] **Step 4: Start the first-run camera beat but preserve reload and fallback behavior**

Add an effect that runs only when a current session changes the durable flag while the transient stage is still idle:

```ts
useEffect(() => {
  if (state.phase !== 'locker' || !state.lockerHatRevealed || lockerHatFinaleStage !== 'idle') return
  if (skipPrototypeScene || lockerLoadState.status === 'accessible-fallback') {
    const timeout = window.setTimeout(() => setLockerHatFinaleStage('ready'), 0)
    return () => window.clearTimeout(timeout)
  }
  const timeout = window.setTimeout(() => {
    setSelectedLockerMemory(null)
    setPendingLockerMemoryFocus(null)
    setLockerCameraImmediate(reducedMotion)
    setLockerCameraCue('hat-focus')
    setLockerHatFinaleStage('moving')
  }, 0)
  return () => window.clearTimeout(timeout)
}, [lockerHatFinaleStage, lockerLoadState.status, reducedMotion, skipPrototypeScene, state.lockerHatRevealed, state.phase])
```

The state initializer is the reload guard: a persisted revealed hat starts at `ready`, so the effect does not replay the move or hold.

- [x] **Step 5: Start the two-second timer only from the settled callback**

Extend `handleLockerCameraSettled` before memory mapping:

```ts
if (cue === 'hat-focus' && lockerHatFinaleStage === 'moving') {
  setLockerHatFinaleStage('holding')
  return
}
```

Add the hold effect:

```ts
useEffect(() => {
  if (lockerHatFinaleStage !== 'holding') return
  const timeout = window.setTimeout(() => setLockerHatFinaleStage('ready'), LOCKER_HAT_HOLD_MS)
  return () => window.clearTimeout(timeout)
}, [lockerHatFinaleStage])
```

Include `lockerHatFinaleStage` in the callback dependency list.

- [x] **Step 6: Hide controls during the camera beat and expose the diagnostic stage**

Update `lockerInteractionEnabled`, the HUD/tool/help render guards, and the root element:

```tsx
const lockerInteractionEnabled =
  state.phase === 'locker' &&
  state.lockerIntroCompleted &&
  !lockerIntroActive &&
  !captainHatCelebrationActive &&
  !lockerHatFinaleActive

<main
  ref={shellRef}
  data-locker-hat-finale-stage={state.phase === 'locker' ? lockerHatFinaleStage : undefined}
  className={`game-shell${state.phase === 'airbus' ? ' airbus-shell' : ''}${state.phase === 'locker' ? ' locker-shell' : ''}${state.phase === 'dc9' ? ' captain-shell' : ''}`}
>
```

Use `!lockerIntroActive && !captainHatCelebrationActive && !lockerHatFinaleActive` for the HUD, scene-tools, help-dismiss, and `SceneHelp` render guards. Do not change `CaptainHatCelebration`; its normal confetti and reduced-motion behavior remain authoritative.

- [x] **Step 7: Reset only transient finale state on restart**

Add `setLockerHatFinaleStage('idle')` to `restart()`. Do not add the transient stage to `GameState`, storage, or schema migration.

- [x] **Step 8: Run focused tests green**

Run: `npm run test -- --run src/game/state.test.ts`

Expected: PASS with the approved hint ladder and no progress loss.

Run: `npm run test:e2e -- e2e/locker-room.spec.ts --workers=1`

Expected: PASS for normal confetti, reduced-motion no-confetti, real hat cue/hold, immediate persisted reload, and accessible fallback.

- [x] **Step 9: Review the Task 3 delta**

Run: `git diff -- src/App.tsx e2e/locker-room.spec.ts src/components/QualificationCelebration.tsx src/styles.css`

Expected: `QualificationCelebration.tsx` and confetti CSS have no new feature diff; App/e2e contain only the transient locker finale changes in addition to pre-existing user work.

---

### Task 4: Browser Visual Gate, Full Verification, and Living Evidence

**Files:**
- Create: `preview-renders/locker-camera-finale/locker-watch-owner-framing-{1440,768,375}.png`
- Create: `preview-renders/locker-camera-finale/locker-hat-hold-{1440,768,375}.png`
- Create: `preview-renders/locker-camera-finale/locker-hat-celebration-{1440,768,375}.png`
- Modify: `plans/0014-locker-camera-finale-polish.md`
- Modify: `TEST_REPORT.md`

**Interfaces:**
- Consumes: completed Tasks 1-3, actual local Vite app, real `public/models/locker-room.glb`, and the owner screenshot.
- Produces: browser evidence, validation results, remaining-delta record, and a reviewable locker-only checkpoint.

- [x] **Step 1: Run the smallest relevant automated stack**

Run: `npm run test -- --run src/game/state.test.ts`

Run: `npm run test:e2e -- e2e/locker-room.spec.ts --workers=1`

Expected: both pass; record exact test counts and durations under Evidence.

- [x] **Step 2: Run repository completion checks**

Run: `npm run check`

Run: `npm run assets:check`

Run: `git diff --check`

Expected: all pass. If a command fails, stop, record the exact failure under Discoveries, use systematic debugging, repair the root cause, and rerun the failed plus adjacent check.

- [x] **Step 3: Exercise the actual browser at 1440, 768, and 375 widths**

At every width, exercise:

1. Fresh locker intro through the right-panned watch settle.
2. First wrong Wings answer and approved practical hint.
3. Repeated wrong answer and stronger approved hint.
4. Correct answer, moving hat, settled two-second hold, popup, and normal confetti.
5. Keyboard focus on `Enter Pop T Captain Mode`.
6. Reload with revealed-hat persistence.
7. Reduced motion: snapped hat pose, two-second hold, no animated confetti.
8. Locker model failure and accessible fallback.

Expected: no console/page errors, no horizontal overflow, no duplicate popup, and no enabled locker controls during the hat camera beat.

- [x] **Step 4: Capture durable screenshots**

Save the nine screenshots listed in File Structure. The 1440 watch capture must be compared side by side with `/home/user1/Pictures/Screenshots/Screenshot from 2026-07-16 01-02-55.png` before claiming visual completion.

- [x] **Step 5: Conduct a complete-diff review**

Review: `git diff -- src/game/config.ts src/game/state.test.ts src/scenes/PrototypeScene.tsx src/App.tsx e2e/locker-room.spec.ts plans/0014-locker-camera-finale-polish.md TEST_REPORT.md preview-renders/locker-camera-finale`

Check for timer cleanup, stale callbacks, duplicate reveal execution, persisted-stage leakage, hidden keyboard controls, confetti regression, unsafe DOM insertion, and unrelated aircraft/asset changes. Resolve every critical/high issue and rerun affected checks.

- [x] **Step 6: Record actual evidence and outcome**

Update Progress, Discoveries, Decision Log, Evidence, and Outcome in this plan. Add a dated `TEST_REPORT.md` section with files changed, commands actually run, pass/fail results, screenshots, viewports, browser/console health, placeholders, and genuine limitations.

- [x] **Step 7: Create a scoped implementation checkpoint only after hunk verification**

Because `src/App.tsx`, `src/scenes/PrototypeScene.tsx`, `src/game/config.ts`, `src/game/state.test.ts`, `e2e/locker-room.spec.ts`, and `TEST_REPORT.md` already contain unrelated user work, stage only the verified locker-camera/hint hunks and new locker-finale files. Inspect `git diff --cached --check` and `git diff --cached --stat` before committing.

Commit message: `Polish locker camera finale`

Expected: the checkpoint contains no GLB, Blender, DC-9, Airbus, Model Y, or unrelated report hunks.

---

## Progress

- [x] 2026-07-16 - Read required repository guidance, current locker ExecPlans, camera/reducer/celebration code, tests, Git status, and the approved design.
- [x] 2026-07-16 - Inspected the newest owner screenshot and confirmed the desired right-panned three-quarter watch composition.
- [x] 2026-07-16 - Owner approved the two-second post-settle hat hold, practical Wings hints, normal confetti, and existing reduced-motion accessibility behavior.
- [x] 2026-07-16 - Task 1 TDD passed: the focused reducer test failed on the old Part 121 copy, then passed 39/39 with the approved exact hint strings and preserved progress.
- [x] 2026-07-16 - Task 2 added deterministic watch/hat poses and diagnostics; the real GLB watch frame was calibrated to the right-side owner-reference orbit and visually accepted for the local gate.
- [x] 2026-07-16 - Task 3 added the transient `moving -> holding -> ready` finale, exact post-settle hold, direct fallback/reload paths, and hidden controls during the beat.
- [x] 2026-07-16 - Task 4 passed project, asset, full locker-browser, responsive, and diff checks and produced nine durable actual-browser captures.
- [x] Implement Tasks 1-4 sequentially with red/green evidence and update this section after every checkpoint.

## Discoveries

- `watch-focus` currently reuses the same straight-on offset as the other memory props; that shared pose is the source of the framing mismatch.
- The durable `lockerHatRevealed` flag currently mounts the popup directly. A transient presentation stage is required so the first-run cinematic can be delayed without replaying after reload.
- The real locker source places Watch at `(0.56, -0.48, 0.55)`, Wings at `(0.56, -0.06, 2.55)`, and the hat at `(0.56, -0.45, 2.92)`. The planned runtime hat target `(0.42, 1.00, -0.14)` follows the existing watch/Wings runtime camera mapping and must be visually confirmed against the real GLB.
- The first Wings retry is difficult because it substitutes Part 121 jargon for actionable numerical guidance; the reducer's existing attempt ladder already supports the approved correction without rule changes.
- The planned watch distance rounds to `3.492`, not `3.490`; the exact real-canvas diagnostic was corrected without changing the approved pose.
- A pre-existing Playwright preview at port 4173 initially served a stale production bundle. Rebuilding after that unrelated run exited restored the current finale code at the test boundary.
- SwiftShader can delay a nominal 2,000ms browser timer while decoding/rendering the 42 MiB GLB. Browser-side mutation timestamps keep the early-popup assertion authoritative; headed Brave measured the actual hold at 2,008.7ms.
- The 375px celebration card had 31px of internal overflow because the 82vw hat image exceeded the card content width. `max-width: 100%` removed it while preserving the existing design.

## Decision Log

- 2026-07-16 - Use a dedicated asymmetric watch pose; do not alter the shared Baseball/Bull/Wings offset.
- 2026-07-16 - Start the two-second timer only after `hat-focus` reports `settled`; camera travel time does not count toward the hold.
- 2026-07-16 - Keep all normal-motion confetti and the existing reduced-motion no-animated-confetti behavior.
- 2026-07-16 - Keep the finale stage transient. Persist only the existing revealed-hat completion flag so reload remains immediate and backward compatible.
- 2026-07-16 - Skip the unavailable 3D beat in accessible fallback and open the popup directly.
- 2026-07-16 - Use the final right-orbit watch position `(1.17, -0.38, 3.18)` aimed directly at `(0.42, -0.75, -0.21)` after comparing both left- and right-orbit candidates with the owner screenshot.
- 2026-07-16 - Measure the hold from browser-observed `holding` and `ready` mutations rather than adding a second Playwright-side sleep after `holding`; this proves the popup is not early without making CPU starvation look like a product failure.
- 2026-07-16 - Treat the narrow celebration overflow as part of this visual gate and constrain only the existing hat image; do not alter the popup layout or confetti implementation.

## Milestones

1. The first and repeated Wings misses produce the approved practical guidance while preserving completed memories.
2. The fresh locker opening settles on the owner-reference watch composition; other memory close-ups remain unchanged.
3. Correct Wings completion reveals and focuses the real hat, holds for two seconds after settle, then shows the unchanged popup/confetti.
4. Reduced motion, reload, fallback, keyboard, responsive, asset, app, and browser checks pass with durable evidence.

## Validation Plan

- Unit: exact first/repeated Wings hint strings, attempt count, and completed-memory preservation.
- Browser behavior: fresh intro, owner-reference watch cue, correct/wrong/repeated-wrong Wings, hat moving/settled/holding/ready sequence, normal confetti, reduced-motion no-confetti, reload, keyboard, accessible fallback, and model failure.
- Visual: 1440/768/375 watch, hat hold, and popup captures; compare 1440 watch framing with the owner's July 16 screenshot.
- Full commands: focused Vitest, focused locker Playwright, `npm run check`, `npm run assets:check`, and `git diff --check`.
- Review: full scoped diff for timer lifecycle, persistence, duplicate reveals, accessibility, and unrelated-file contamination.

## Acceptance Criteria

- `watch-focus` pans right during the zoom and settles at the owner-approved three-quarter framing.
- Baseball, Charging Bull, and Wings retain their existing camera poses.
- Correct Wings completion produces `hat-focus`, a settled two-second unobstructed hold, then the existing popup.
- Normal motion shows 24 confetti pieces; reduced motion snaps, holds for two seconds, and shows no animated confetti.
- Persisted revealed-hat reload opens the popup without replaying the camera beat; accessible fallback opens it directly.
- The two approved Wings hint strings appear at attempts one and two-plus.
- No completed memory is lost, no duplicate popup appears, and keyboard focus remains trapped on the existing CTA.
- Relevant automated checks and actual-browser viewport checks pass with recorded evidence.
- No locker GLB, Blender source, celebration image, schema, dependency, or unrelated worktree content changes.

## Repair Loop and Stop Conditions

Repeat focused red test -> smallest coherent implementation -> focused green test -> actual-browser inspection -> scoped diff review -> remaining-delta record. Allow at most three evidence-driven camera calibration passes. Stop when all acceptance checks pass, the camera delta stops shrinking, validation reveals an unrelated blocker that cannot be isolated, or the owner must choose between visually distinct final framings. Never weaken an assertion to obtain green.

## Evidence

- Approved design commit: `759ab9a` (`docs: specify locker camera finale polish`).
- Owner framing reference: `/home/user1/Pictures/Screenshots/Screenshot from 2026-07-16 01-02-55.png`.
- Blender 5.1.2 read-only source inspection confirmed Watch `(0.56, -0.48, 0.55)`, Wings `(0.56, -0.06, 2.55)`, and captain's hat `(0.56, -0.45, 2.92)`.
- Task 1 red: `npm run test -- --run src/game/state.test.ts` failed 1/39 at the exact first-hint assertion because the old Part 121 message was still returned.
- Task 1 green: the same command passed 39/39 after updating only the Wings retry and stronger-hint strings.
- Task 2/3 red: the real-canvas Playwright case reached Wings completion but remained at `wings-focus`; after implementation it reached `hat-focus`, `settled`, `holding`, and `ready` with the popup absent during the hold.
- Headed Brave timing: `moving` at 16,097.5ms, `holding` at 17,934.8ms, and `ready` at 19,943.5ms; post-settle hold 2,008.7ms.
- Responsive red/green: the 375px accessible celebration first reported 31px internal card overflow, then passed after capping `.qualification-hat` at the content width.
- `npm run check` passed ESLint, TypeScript, 62/62 Vitest tests, and the production Vite build.
- `npm run assets:check` passed with the existing imported-asset validator information/warnings and no new locker asset changes.
- Final `npm run test:e2e -- e2e/locker-room.spec.ts --workers=1` passed 6/6 in 3.8 minutes, including real locker GLB, fallback, reload, focus, normal/reduced motion, camera diagnostics, and the measured hold.
- `git diff --check` passed.
- Actual-browser captures: `preview-renders/locker-camera-finale/locker-watch-owner-framing-{1440,768,375}.png`, `locker-hat-hold-{1440,768,375}.png`, and `locker-hat-celebration-{1440,768,375}.png`.
- The normal-motion capture reported `hat-focus`, `settled`, `ready`, and 24 confetti pieces. No page exceptions or failed HTTP responses were recorded; one generic Brave resource-console warning had no failed response, and Vite retained the existing upstream `THREE.Clock` deprecation warning.

## Outcome and Handoff

Implementation and local verification are complete. The opening now settles on the owner-reference right-panned watch frame; correct Wings completion focuses the real captain's hat, holds for two seconds after settle, and then shows the unchanged normal confetti celebration. Practical first/repeated Wings hints and the 375px overflow repair are covered by tests. No Blender/GLB, persistence, dependency, or unrelated aircraft changes were made. The remaining external gate is owner review of the durable captures and, if requested, a Vercel preview; publication was not authorized in this pass.
