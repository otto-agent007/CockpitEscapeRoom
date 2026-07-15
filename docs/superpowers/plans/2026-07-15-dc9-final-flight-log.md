# DC-9 Final Flight Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Captain-mode placement with a 10–15 minute DC-9 Final Flight Log opening and reorder the complete game to DC-9 → locker → existing Airbus → Model Y reward.

**Architecture:** Preserve the DC-9 GLB, strict interaction registry, saved cameras, yoke strip, and three semantic shutdown controls. Put the route record, Momma Cheryl tribute, hints, and key cinematic in focused React/HTML components; extend the reducer and versioned storage for explicit DC-9 chapter state; make only the minimum locker/Airbus transition changes required by the new order.

**Tech Stack:** React 19, TypeScript 6, React Three Fiber 9, Three.js 0.184, Vitest 4, Playwright 1.61, Vite 8, versioned localStorage.

## Global Constraints

- Global order is DC-9 → locker → existing Airbus → Model Y reward.
- Correct representative routes are exactly `DTW`, `MSP`, and `STL`.
- Do not claim those routes were Pop T's literal final itinerary.
- Momma Cheryl's Home Operations Log is a neutral record, never a puzzle or quotation attributed to a family member.
- Reuse the current DC-9-32 GLB, yoke trigger, cameras, registry IDs, APU-bus pivot, APU-master pivot, and battery pivot.
- Do not add engine-start, taxi, takeoff, flight procedures, cockpit systems, a complex 3D key, or a broad Blender rebuild.
- Keep the DC-9 greybox label.
- Do not redesign Airbus gameplay; change only routing, transition copy, persistence, and tests required by the new order.
- Do not create a dedicated mobile layout or mobile visual-approval milestone; retain a functional narrow-width fallback.
- Completed progress never resets after a wrong route or out-of-order shutdown input.
- All required gameplay remains available through semantic HTML controls and reduced-motion behavior.
- Use GPT-5.6 Sol with High reasoning for implementation and Extra High for initial analysis/final review.

---

## File map

**Create**

- `src/components/dc9/LegacyRouteRecord.tsx` — split-view document shell and route selection.
- `src/components/dc9/HomeOperationsLog.tsx` — neutral, non-puzzle Momma Cheryl record.
- `src/components/dc9/CaptainsKeyReveal.tsx` — reduced-motion-aware cinematic overlay.
- `src/components/dc9/Dc9Chapter.tsx` — composes the three overlays and shutdown HUD without scene internals.
- `src/components/dc9/dc9Chapter.css` — desktop split view and functional narrow fallback.
- `src/components/dc9/LegacyRouteRecord.test.tsx` only if the repository already has a DOM test environment; otherwise exercise component behavior through reducer tests and Playwright.

**Modify**

- `src/game/config.ts` — new route data, hint copy, Momma Cheryl pages, key engravings, and reordered global copy.
- `src/game/state.ts` — schema v7, explicit DC-9 chapter state/actions, forgiving shutdown, and new phase transitions.
- `src/game/state.test.ts` — reducer coverage for the full new flow.
- `src/game/storage.ts` — schema-v6 migration into the reordered schema-v7 progression.
- `src/game/storage.test.ts` — migration and corrupt-save normalization.
- `src/App.tsx` — chapter composition and transition callbacks.
- `src/components/Hud.tsx` — remove the old route-first Captain UI and obsolete promotion copy; retain later-phase HUDs.
- `src/scenes/PrototypeScene.tsx` — use the yoke strip as a single opening trigger, retain registry compatibility, expose shutdown visual stage and key glint.
- `src/styles.css` — only shared transition/status styles not owned by the DC-9 stylesheet.
- `e2e/smoke.spec.ts` — real-GLB, keyboard/fallback, reduced-motion, migration, and full-order tests.
- `docs/GAME_DESIGN.md` — promote the approved order and DC-9 chapter summary.
- `README.md` — update the current narrative order and verification checklist.
- `TEST_REPORT.md` — record final commands and browser evidence after verification.

## Shared interfaces

Define these once in `src/game/state.ts` and reuse them throughout:

```ts
export type Dc9ChapterStage =
  | 'intro'
  | 'routeRecord'
  | 'homeOperations'
  | 'shutdown'
  | 'keyReveal'
  | 'complete'

export interface Dc9ChapterProgress {
  stage: Dc9ChapterStage
  routeSelections: string[]
  routeCompleted: string[]
  routeAttempts: number
  homePage: number
  homeOperationsCompleted: boolean
  secureSequence: Dc9SecureControlId[]
  keyRevealed: boolean
  keyClaimed: boolean
}
```

Add these reducer actions:

```ts
| { type: 'OPEN_DC9_ROUTE_RECORD' }
| { type: 'TOGGLE_DC9_ROUTE'; code: string }
| { type: 'SUBMIT_DC9_ROUTES' }
| { type: 'SET_HOME_OPERATIONS_PAGE'; page: number }
| { type: 'COMPLETE_HOME_OPERATIONS' }
| { type: 'ACTIVATE_DC9_CONTROL'; controlId: Dc9SecureControlId }
| { type: 'OPEN_CAPTAINS_KEY' }
| { type: 'CLAIM_CAPTAINS_KEY' }
| { type: 'CONTINUE_FROM_LOCKER_TO_AIRBUS' }
```

Components consume `Dc9ChapterProgress` and dispatch `GameAction`; they must not duplicate progression state locally except transient animation flags.

---

### Task 1: Replace Captain-mode content with the approved legacy records

**Files:**
- Modify: `src/game/config.ts`
- Test: `src/game/state.test.ts`

**Interfaces:**
- Produces: `dc9LegacyFlow.routePuzzleAnswers`, `routePuzzleOptions`, `routeHints`, `homeOperationsPages`, `keyEngravings`.
- Consumes: no new runtime interfaces.

- [x] **Step 1: Write failing configuration assertions**

Add a Vitest block that verifies exact approved data:

```ts
expect(dc9LegacyFlow.routePuzzleAnswers).toEqual(['DTW', 'MSP', 'STL'])
expect(dc9LegacyFlow.routeHints).toEqual([
  'Two were Northwest hubs and one was a familiar Midwestern stop.',
  'Think Michigan, Minnesota, and Missouri.',
])
expect(dc9LegacyFlow.homeOperationsPages.join(' ')).toContain('Momma Cheryl')
expect(dc9LegacyFlow.homeOperationsPages.join(' ')).not.toMatch(/quiz|answer|correct/i)
expect(dc9LegacyFlow.keyEngravings).toEqual({
  front: "THE CAPTAIN'S KEY",
  reverse: 'POP T & MOMMA CHERYL',
})
```

- [x] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/game/state.test.ts`  
Expected: FAIL because the new route/hint/log/key fields do not exist.

- [x] **Step 3: Replace the old route and Captain copy**

Update `dc9LegacyFlow` with six HTML-overlay choices whose three correct answers are DTW/MSP/STL. Retain six choices so the existing interaction contract remains stable. Use this shape:

```ts
routePuzzleAnswers: ['DTW', 'MSP', 'STL'] as const,
routePuzzleOptions: [
  { code: 'DTW', city: 'Detroit', familiar: true },
  { code: 'MSP', city: 'Minneapolis–St. Paul', familiar: true },
  { code: 'STL', city: 'St. Louis', familiar: true },
  { code: 'BTR', city: 'Baton Rouge', familiar: false },
  { code: 'TYS', city: 'Knoxville', familiar: false },
  { code: 'AMS', city: 'Amsterdam', familiar: false },
] as const,
routeQuestion: "Which three cities were familiar stops during Pop T's DC-9 years?",
routeHints: [
  'Two were Northwest hubs and one was a familiar Midwestern stop.',
  'Think Michigan, Minnesota, and Missouri.',
] as const,
routeFinalHintCodes: ['DTW', 'MSP', 'STL'] as const,
routeCompletionText: 'Legacy routes recorded. A companion record is ready.',
```

Add five neutral `homeOperationsPages` covering the parallel operation, three children, food/care, sports/games/cheerleading, school-clothes shopping, household needs, and recognition. Do not invent dates, routes, quotations, school transportation, or first-person authorship.

- [x] **Step 4: Update global copy for the new order**

Change briefing and transition copy to say the journey begins in the DC-9, continues through the Captain's Locker, and then enters the existing Airbus experience. Remove statements that Airbus is first or the locker promotes the player into DC-9 Captain Mode.

- [x] **Step 5: Run the focused test**

Run: `npm test -- src/game/state.test.ts`  
Expected: PASS for the new configuration assertions.

- [x] **Step 6: Commit**

```bash
git add src/game/config.ts src/game/state.test.ts
git commit -m "feat: define DC-9 final flight log content"
```

---

### Task 2: Add schema-v7 DC-9 progress and reorder phases

**Files:**
- Modify: `src/game/state.ts`
- Modify: `src/game/state.test.ts`

**Interfaces:**
- Produces: `Dc9ChapterStage`, `Dc9ChapterProgress`, new `GameAction` variants.
- Consumes: approved config from Task 1.

- [x] **Step 1: Add failing reducer tests for the new start and route flow**

Test these exact behaviors:

```ts
let state = gameReducer(createInitialState(), { type: 'START' })
expect(state.phase).toBe('captain')
expect(state.dc9.stage).toBe('intro')

state = gameReducer(state, { type: 'OPEN_DC9_ROUTE_RECORD' })
expect(state.dc9.stage).toBe('routeRecord')

for (const code of ['DTW', 'MSP', 'STL']) {
  state = gameReducer(state, { type: 'TOGGLE_DC9_ROUTE', code })
}
state = gameReducer(state, { type: 'SUBMIT_DC9_ROUTES' })
expect(state.dc9.routeCompleted).toEqual(['DTW', 'MSP', 'STL'])
expect(state.dc9.stage).toBe('homeOperations')
```

Also assert that a wrong submission increments `routeAttempts`, preserves already completed codes, and leaves the stage at `routeRecord`.

- [x] **Step 2: Run and verify failure**

Run: `npm test -- src/game/state.test.ts`  
Expected: FAIL because `GameState.dc9` and the new actions do not exist.

- [x] **Step 3: Introduce schema v7 and `Dc9ChapterProgress`**

Set `GAME_SCHEMA_VERSION = 7`. Add `dc9: Dc9ChapterProgress` to `GameState` and initialize it exactly as:

```ts
dc9: {
  stage: 'intro',
  routeSelections: [],
  routeCompleted: [],
  routeAttempts: 0,
  homePage: 0,
  homeOperationsCompleted: false,
  secureSequence: [],
  keyRevealed: false,
  keyClaimed: false,
},
```

Keep legacy top-level captain fields temporarily only if migration consumers require them; mark them for removal in Task 3 after storage migration is proven.

- [x] **Step 4: Implement route actions**

Rules:

- `START` changes `briefing → captain`.
- `OPEN_DC9_ROUTE_RECORD` changes `intro → routeRecord`.
- Route toggles accept only configured codes.
- A wrong submission clears only uncompleted current selections and increments attempts.
- Hint level is `Math.min(routeAttempts, 3)`.
- A correct submission stores the three approved codes and advances to `homeOperations`.

- [x] **Step 5: Add failing Home Operations and shutdown tests**

Exercise:

```ts
state = gameReducer(state, { type: 'SET_HOME_OPERATIONS_PAGE', page: 4 })
state = gameReducer(state, { type: 'COMPLETE_HOME_OPERATIONS' })
expect(state.dc9.homeOperationsCompleted).toBe(true)
expect(state.dc9.stage).toBe('shutdown')

const before = state
state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId: 'battery' })
expect(state.dc9.secureSequence).toEqual([])
expect(state.captainAttempts.secure).toBe(before.captainAttempts.secure + 1)

state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId: 'apuBuses' })
expect(state.dc9.secureSequence).toEqual(['apuBuses'])
```

- [x] **Step 6: Implement forgiving shutdown and key actions**

Out-of-order input increments the secure attempt count and updates calm guidance but never resets `secureSequence`. Battery completion advances to `keyReveal`. `OPEN_CAPTAINS_KEY` marks `keyRevealed`; `CLAIM_CAPTAINS_KEY` marks `keyClaimed`, adds `captain` to completed puzzles for backward compatibility, and changes phase to `locker`.

- [x] **Step 7: Reorder locker and Airbus completion**

Make locker completion transition to Airbus through `CONTINUE_FROM_LOCKER_TO_AIRBUS`. Make successful Airbus completion transition to reward rather than locker. Preserve existing Airbus puzzle mechanics.

Update obsolete actions only after all call sites are handled; do not overload old action names with opposite meaning.

- [x] **Step 8: Run reducer tests**

Run: `npm test -- src/game/state.test.ts`  
Expected: PASS.

- [x] **Step 9: Commit**

```bash
git add src/game/state.ts src/game/state.test.ts
git commit -m "feat: add reordered DC-9 chapter state"
```

---

### Task 3: Migrate existing saves without losing completed progress

**Files:**
- Modify: `src/game/storage.ts`
- Modify: `src/game/storage.test.ts`
- Modify: `src/game/state.ts` if legacy fields can now be removed

**Interfaces:**
- Consumes: schema-v6 `GameState` and schema-v7 `Dc9ChapterProgress`.
- Produces: `loadGameState(): GameState` normalized to schema 7.

- [x] **Step 1: Add failing schema-v6 migration tests**

Cover at least:

1. A completed v6 reward save remains in `reward`, has `dc9.stage === 'complete'`, and retains Mars/reward flags.
2. A v6 Captain save with route verified but no shutdown maps to `captain` and `dc9.stage === 'homeOperations'` so Momma Cheryl's record is not skipped.
3. A v6 pre-Captain Airbus/locker save maps safely to the new opening without inventing completed DC-9 progress.
4. Corrupt `dc9` fields normalize without throwing.

Use explicit fixture objects with `schemaVersion: 6`; do not mutate `createInitialState()` into a fake old schema via unsafe casts without listing every legacy field.

- [x] **Step 2: Run and verify migration tests fail**

Run: `npm test -- src/game/storage.test.ts`  
Expected: FAIL because schema 7 migration is missing.

- [x] **Step 3: Implement one-way migration**

Add a dedicated `migrateV6ToV7(raw)` function. Mapping rules:

- Reward/Mars/completed-Captain saves remain in their later phase and receive fully completed `dc9`.
- Route-verified Captain saves receive completed routes and enter `homeOperations`.
- Incomplete Captain saves enter the DC-9 intro or route record according to observable progress.
- Saves in the old Airbus or locker phase restart at the new DC-9 opening unless the old completed-puzzle set proves that chapter was already completed.
- Never remove `captainRewardUnlocked`, `marsUnlocked`, or completed puzzle IDs.

- [x] **Step 4: Normalize schema-v7 state**

Validate configured route codes, unique shutdown steps in authored order, page range `0..4`, boolean key flags, and legal stage/phase combinations. Impossible combinations fall back to the nearest safe earlier stage, except completed reward/Mars states, which always stay complete.

- [x] **Step 5: Run storage and reducer tests**

Run: `npm test -- src/game/storage.test.ts src/game/state.test.ts`  
Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add src/game/storage.ts src/game/storage.test.ts src/game/state.ts
git commit -m "feat: migrate progress to DC-9-first flow"
```

---

### Task 4: Build the route record and Momma Cheryl record components

**Files:**
- Create: `src/components/dc9/LegacyRouteRecord.tsx`
- Create: `src/components/dc9/HomeOperationsLog.tsx`
- Create: `src/components/dc9/Dc9Chapter.tsx`
- Create: `src/components/dc9/dc9Chapter.css`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `GameState.dc9`, `dc9LegacyFlow`, and `dispatch(GameAction)`.
- Produces: semantic dialogs and buttons with stable accessible names used by Playwright.

- [x] **Step 1: Add failing Playwright assertions for the route trigger and overlay**

Seed an initial DC-9 state, then assert:

```ts
await page.getByRole('button', { name: 'Open Legacy Route Record' }).click()
await expect(page.getByRole('dialog', { name: 'Legacy Route Record' })).toBeVisible()
await expect(page.getByRole('button', { name: /^DTW, Detroit/ })).toBeVisible()
await expect(page.getByText(/Which three cities were familiar stops/)).toBeVisible()
```

- [x] **Step 2: Run focused E2E and verify failure**

Run: `npx playwright test e2e/smoke.spec.ts -g "DC-9 Final Flight Log accessible flow" --workers=1`  
Expected: FAIL because the new trigger/dialog do not exist.

- [x] **Step 3: Implement `LegacyRouteRecord`**

Use a semantic `role="dialog"`, heading association, six native buttons with `aria-pressed`, a submit button, permanent stamp text for completed codes, and hint text selected from `routeAttempts`. At attempt 3, apply a visual class and screen-reader text to DTW/MSP/STL.

Do not write route state with `useState`; dispatch reducer actions.

- [x] **Step 4: Implement `HomeOperationsLog`**

Render one configured page at a time inside a dialog named `Home Operations Log — Momma Cheryl`. Provide Previous/Next buttons and a final `Record this legacy` action. Do not render inputs, answer controls, correctness messages, timers, or scores.

- [x] **Step 5: Implement `Dc9Chapter`**

Compose the correct overlay based on `dc9.stage`. Expose callbacks for opening the route record, completing the log, shutdown interaction status, opening the key, and claiming it.

- [x] **Step 6: Add split layout and functional narrow fallback**

Desktop: cockpit remains visible and the document occupies the right portion.  
Narrow fallback: stack the document over a compact cockpit band.  
Do not create alternate mobile component trees, gesture-only controls, or mobile screenshot fixtures.

Include `@media (prefers-reduced-motion: reduce)` rules that disable document movement.

- [x] **Step 7: Wire `Dc9Chapter` into App**

Pass only state and dispatch-oriented callbacks. Keep model-load fallback messaging and global status live region intact.

- [x] **Step 8: Run focused E2E**

Run: `npx playwright test e2e/smoke.spec.ts -g "DC-9 Final Flight Log accessible flow" --workers=1`  
Expected: route and Home Operations assertions PASS.

- [x] **Step 9: Commit**

```bash
git add src/components/dc9 src/App.tsx e2e/smoke.spec.ts
git commit -m "feat: add DC-9 legacy record overlays"
```

---

### Task 5: Adapt the 3D DC-9 interaction to the new chapter

**Files:**
- Modify: `src/scenes/PrototypeScene.tsx`
- Modify: `src/components/Hud.tsx`
- Modify: `src/App.tsx`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `Dc9ChapterStage`, existing `dc9.route.*` registry IDs, and semantic shutdown IDs.
- Produces: `Open Legacy Route Record` trigger, stage-appropriate cameras, projected shutdown controls, and `Open The Captain's Key` glint.

- [x] **Step 1: Update the real-GLB E2E test to describe the new contract**

Assert:

- GLB exceeds the existing minimum byte size.
- Registry loads with existing route and shutdown IDs.
- Route-camera yoke target opens the HTML record rather than toggling an individual route.
- Route rows are selected in HTML.
- Home Operations Log completes before the overhead camera activates.
- Projected APU buses/APU master/battery controls appear during shutdown.
- Out-of-order battery input does not clear completed APU buses.
- Battery completion exposes `Open The Captain's Key`.

- [x] **Step 2: Run the real-GLB test and verify failure**

Run: `npx playwright test e2e/smoke.spec.ts -g "DC-9 production cockpit.*Final Flight Log" --workers=1`  
Expected: FAIL on the old per-row mesh behavior.

- [x] **Step 3: Convert route mesh behavior into one trigger**

Keep strict registry validation unchanged. During `intro` and `routeRecord`, any `dc9.route.*` interaction dispatches `OPEN_DC9_ROUTE_RECORD`; individual route selection happens only in HTML. Do not rebuild the GLB or change baked strip text.

- [x] **Step 4: Drive cameras from chapter stage**

Use the existing route camera for `intro|routeRecord|homeOperations`, overhead camera for `shutdown`, and captain camera for `keyReveal|complete`. Retain `R` reset and constrained look behavior.

- [x] **Step 5: Preserve forgiving switch animation**

Animate only controls present in `dc9.secureSequence`. An out-of-order attempt may briefly acknowledge through UI state, but must not be inserted into active controls or mutate the GLB pivot permanently.

- [x] **Step 6: Add the lightweight key glint**

Use a simple emissive sphere/plane or HTML-projected target near the log area, visible only after the authored shutdown sequence. Its semantic control is `Open The Captain's Key`. Do not add a Blender asset.

- [x] **Step 7: Remove obsolete Captain HUD**

Delete the old route-selection sidebar/projection UI from `Hud.tsx` or its Captain-specific branch. Keep accessible projected shutdown buttons and model-failure fallback. Update the badge text to retain `GREYBOX` without claiming this is still the final Captain challenge.

- [x] **Step 8: Run focused real-GLB and fallback tests**

Run: `npx playwright test e2e/smoke.spec.ts -g "DC-9" --workers=1`  
Expected: all DC-9 real-model and aborted-model tests PASS with no console errors.

- [x] **Step 9: Commit**

```bash
git add src/scenes/PrototypeScene.tsx src/components/Hud.tsx src/App.tsx e2e/smoke.spec.ts
git commit -m "feat: stage DC-9 final flight interactions"
```

---

### Task 6: Add the key cinematic and connect DC-9 → locker → Airbus → reward

**Files:**
- Create: `src/components/dc9/CaptainsKeyReveal.tsx`
- Modify: `src/components/dc9/Dc9Chapter.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Hud.tsx`
- Modify: `src/styles.css`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `dc9.keyRevealed`, `dc9.keyClaimed`, `keyEngravings`.
- Produces: claim action that changes phase to locker; locker completion action that changes phase to Airbus; Airbus completion that changes phase to reward.

- [x] **Step 1: Add a failing complete-order E2E test**

Use `?skip3d=1` and complete/seed each checkpoint. Assert the phase headings appear in this order:

```ts
await expect(page.getByRole('heading', { name: /Final Flight Log/i })).toBeVisible()
// complete DC-9
await expect(page.getByRole('heading', { name: /Captain's Locker/i })).toBeVisible()
// complete locker
await expect(page.getByRole('heading', { name: /First Officer/i })).toBeVisible()
// complete Airbus
await expect(page.getByText('Ground Transport Upgrade Authorized')).toBeVisible()
```

- [x] **Step 2: Run and verify failure**

Run: `npx playwright test e2e/smoke.spec.ts -g "complete reordered journey" --workers=1`  
Expected: FAIL because the current order begins with Airbus.

- [x] **Step 3: Implement `CaptainsKeyReveal`**

Render a dialog named `The Captain's Key` with both engravings, one `Take the Captain's Key` button, focus management, Escape behavior only before claim, and a live text equivalent. Reduced-motion mode renders the final key pose immediately.

- [x] **Step 4: Update locker transition copy**

Remove `Enter Pop T Captain Mode`, promotion-to-DC-9 wording, and any claim that the locker unlocks the DC-9. The locker now acknowledges the captain's hat and continues to the existing Airbus crew experience.

Do not change locker puzzles, models, props, camera sequence, or hat celebration mechanics beyond necessary button/copy/routing changes.

- [x] **Step 5: Update Airbus completion routing**

After the existing five-card and ATP question flow succeeds, route to `reward`. Preserve all existing assignment, retry, accessibility, and qualification behavior.

- [x] **Step 6: Run complete-order and existing Airbus tests**

Run: `npx playwright test e2e/smoke.spec.ts -g "complete reordered journey|Airbus" --workers=1`  
Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add src/components/dc9 src/App.tsx src/components/Hud.tsx src/styles.css e2e/smoke.spec.ts
git commit -m "feat: connect the Captain's Key journey"
```

---

### Task 7: Documentation, full verification, and evidence

**Files:**
- Modify: `docs/GAME_DESIGN.md`
- Modify: `README.md`
- Modify: `TEST_REPORT.md`
- Modify: `e2e/smoke.spec.ts` only for defects found during verification

**Interfaces:**
- Consumes: completed behavior from Tasks 1–6.
- Produces: current source-of-truth documentation and reproducible evidence.

- [x] **Step 1: Update game-design source of truth**

Document the order DC-9 → locker → Airbus → Model Y. Include DTW/MSP/STL, the non-puzzle Home Operations Log, forgiving shutdown, both key engravings, and the end-credit photo montage remaining deferred.

- [x] **Step 2: Update README**

Replace the old Airbus-first narrative and verification checklist. State that mobile-specific visual polish is not part of this milestone while accessible narrow fallback remains.

- [x] **Step 3: Run focused unit checks**

Run: `npm test -- src/game/state.test.ts src/game/storage.test.ts`  
Expected: all reducer/storage tests PASS.

- [x] **Step 4: Run static and build checks**

Run: `npm run check`  
Expected: lint, typecheck, unit tests, and production build PASS.

- [x] **Step 5: Validate assets without rebuilding DC-9**

Run: `npm run assets:check`  
Expected: PASS with no new DC-9 validator errors. Do not run `npm run asset:dc9` unless a validation failure proves the existing artifact must be regenerated.

- [x] **Step 6: Run focused browser tests**

Run: `npx playwright test e2e/smoke.spec.ts -g "DC-9|complete reordered journey|Airbus" --workers=1`  
Expected: all focused cases PASS, including real GLB and fallback.

- [x] **Step 7: Run the full browser suite**

Run: `npm run test:e2e -- --workers=1`  
Expected: all cases PASS with no application console errors.

- [x] **Step 8: Inspect desktop evidence**

Capture and inspect the primary production desktop width for:

- sunset cockpit introduction
- cockpit/log split view
- Home Operations Log
- overhead shutdown
- key reveal
- locker transition

Also exercise one narrow width only as a functional overflow/accessibility check. Do not create a mobile visual-approval gate or spend the milestone polishing a separate mobile composition.

- [x] **Step 9: Update TEST_REPORT**

Record exact commands, pass counts, known unrelated warnings, screenshot paths, served GLB byte parity if a preview is published, and confirmation that `public/models/dc9-cockpit.glb` was not rebuilt.

- [x] **Step 10: Final diff checks**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intended files are modified.

- [x] **Step 11: Commit**

```bash
git add docs/GAME_DESIGN.md README.md TEST_REPORT.md e2e/smoke.spec.ts
git commit -m "docs: record DC-9 final flight log verification"
```

- [x] **Step 12: Final review with Sol Extra High**

Review the complete branch against `docs/superpowers/specs/2026-07-15-dc9-final-flight-log-design.md`. Reject any result that rebuilds the DC-9 asset, treats Momma Cheryl's record as a quiz, restores progress-reset behavior, reintroduces Airbus-first copy, or adds a dedicated mobile milestone.

---

## Execution record

### Progress

- 2026-07-14: Tasks 1–6 completed sequentially with one focused commit per task.
- 2026-07-14: Task 7 completed. Extra High final review repaired two scope regressions, and all post-review static, asset, focused-browser, and full-browser gates passed.

### Discoveries

- The current GLB intentionally retains legacy route-row IDs and baked BTR/STL/TYS text. The runtime must validate those fixed IDs while using them only as the single HTML record trigger; deriving registry requirements from the new DTW/MSP/STL content incorrectly forced the accessible fallback.
- React's current immutability lint rule rejects assigning `tabIndex` through the renderer returned by `useThree`. Declaring `tabIndex={0}` on `<Canvas>` preserves keyboard focus without mutating a hook-owned value.
- Historical locker/viewer browser fixtures seeded an illegal Airbus-first v7 state. Legal post-key locker and post-locker Airbus fixtures preserve the same locker/Airbus mechanics under the approved order.
- Browser evidence exposed two presentation defects not caught by assertions: the opening illustration was too dark to read as a cockpit, and a global paragraph color made Home Operations text too pale. Both were repaired in the DC-9-owned stylesheet and re-inspected.
- Extra High final review found an out-of-scope generic donor-control/yoke-motion expansion in `PrototypeScene.tsx`; it was removed so the implementation retains the strict registry, existing yoke trigger, saved cameras, and three authored shutdown pivots only.
- Migrated saves retained the completed First-Officer flag but initially routed back into Airbus after the locker. The locker continuation now recognizes that prior completion and advances those players to the existing reward without changing the normal DC-9 → locker → Airbus path.

### Decisions

- Executed inline on `design/dc9-final-flight-log` as requested instead of creating a worktree.
- Preserved all pre-existing Blender, GLB, asset-report, pipeline-tool, and unrelated local changes without staging them.
- Used a lightweight HTML/CSS key cinematic and a CSS opening illustration; no physical key model or DC-9 asset rebuild was introduced.
- Updated `AGENTS.md` and `BLUEPRINT.md` with the approved order in addition to the planned README and game-design files so repository guidance cannot reintroduce Airbus-first behavior.
- Updated the stale asset-loading sentence in `docs/ARCHITECTURE.md` so it no longer instructs future work to load Airbus first.

### Validation evidence

- Exact command results, pass counts, asset hashes, known warnings, and inspected screenshot paths are recorded in `TEST_REPORT.md` under `2026-07-14 - DC-9 Final Flight Log reordered journey`.
- Post-review verification passed: `npm run check` (61/61 unit tests plus build), `npm run assets:check`, focused Playwright (7/7 in 2.3 minutes), full Playwright (15/15 in 4.2 minutes), and `git diff --check`.
