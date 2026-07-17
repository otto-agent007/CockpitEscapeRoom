# Airbus Radio and Thrust Target Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Airbus radio drop target left onto its intended panel and the thrust drop target right to the midpoint between the paired thrust levers while keeping projected labels and mesh-picking hitboxes aligned.

**Architecture:** The Blender source remains the single authority for target placement. Exact target translations are enforced by the GLB validator, exported through the existing Airbus asset command, and exercised in the real React Three Fiber scene through the existing projected-pivot and collider paths.

**Tech Stack:** Blender 5.1.2, Blender Python, glTF/GLB, Node.js asset validation, React Three Fiber, Playwright, Vitest.

## Global Constraints

- Keep the Airbus A320 captain/left-seat camera and all other cockpit targets unchanged.
- Move each complete target contract together: pivot, hitbox, and cue.
- Preserve stable node names, hierarchy, `game_id` metadata, native HTML interaction, keyboard behavior, and save progression.
- Regenerate the deployable GLB through `npm run asset:airbus`; never hand-edit it.
- Add no dependency and make no puzzle, copy, camera, material, or unrelated asset changes.
- Use `BLENDER_BIN=/home/user1/.local/bin/blender`, which reports Blender 5.1.2.
- Preserve unrelated workspace work and do not broadly regenerate another asset.

## File Map

- `tools/assets/check-models.mjs`: deterministic deployable-GLB coordinate contract for the two Airbus target pivots.
- `e2e/smoke.spec.ts`: real-GLB projection and mesh-picking regression proof at 1440x900.
- `tools/blender/prepare_airbus_captain.py`: canonical radio and thrust target translations and alignment metadata.
- `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`: authoritative source updated by the preparation script.
- `public/models/airbus-captain.glb`: generated deployable model updated only by `npm run asset:airbus`.
- `plans/0013-dc9-fo-airbus-captain-seat-swap.md`: living owner-feedback and validation record.
- `TEST_REPORT.md`: final browser, interaction, asset, size, and hash evidence.

---

### Task 1: Lock the Desired Target Contract with Failing Checks

**Files:**
- Modify: `tools/assets/check-models.mjs:236-253`
- Modify: `e2e/smoke.spec.ts:200-232`

**Interfaces:**
- Consumes: GLB node translations from `json.nodes` and projected browser coordinates from `data-anchor-x` / `data-anchor-y`.
- Produces: exact deployable glTF target translations `radio = [-0.04, 0.011798, 0.474842]` and `thrust = [0.015, 0.0048, 0.505764]`, corresponding to the approved Blender-space coordinates after the exporter's `(x, z, -y)` axis conversion, plus real-browser placement bounds at 1440x900.

- [x] **Step 1: Add exact translation validation for both target pivots**

Replace the one-axis radio check inside the `airbus-captain.glb` validation block with:

```js
      const expectedTargetTranslations = new Map([
        ['AIRBUS_A320_TARGET_RADIO_PIVOT', [-0.04, 0.011798, 0.474842]],
        ['AIRBUS_A320_TARGET_THRUST_PIVOT', [0.015, 0.0048, 0.505764]],
      ])
      for (const [nodeName, expectedTranslation] of expectedTargetTranslations) {
        const node = (json.nodes ?? []).find((candidate) => candidate.name === nodeName)
        const translation = node?.translation
        const aligned = Array.isArray(translation)
          && translation.length === expectedTranslation.length
          && translation.every((value, index) => Math.abs(value - expectedTranslation[index]) <= 0.00001)
        if (!aligned) {
          console.error(`${nodeName} must export at ${JSON.stringify(expectedTranslation)}; received ${JSON.stringify(translation ?? null)}.`)
          failed = true
        }
      }
```

- [x] **Step 2: Add 1440x900 projected-position and mesh-picking assertions**

In `Airbus production cockpit loads the A320 GLB`, set the viewport before navigation and extend the test after `canvas` is located:

```ts
  await page.setViewportSize({ width: 1440, height: 900 })
```

```ts
  const radioTarget = page.getByRole('button', { name: 'Cockpit drop zone 4' })
  const thrustTarget = page.getByRole('button', { name: 'Cockpit drop zone 2' })
  const radioX = Number(await radioTarget.getAttribute('data-anchor-x'))
  const radioY = Number(await radioTarget.getAttribute('data-anchor-y'))
  const thrustX = Number(await thrustTarget.getAttribute('data-anchor-x'))
  const thrustY = Number(await thrustTarget.getAttribute('data-anchor-y'))

  expect(radioX).toBeGreaterThan(895)
  expect(radioX).toBeLessThan(920)
  expect(thrustX).toBeGreaterThan(1105)
  expect(thrustX).toBeLessThan(1130)

  await page.getByRole('button', { name: /^RADIO\b/ }).click()
  await canvas.dispatchEvent('click', { bubbles: true, clientX: radioX, clientY: radioY })
  await expect(radioTarget).toHaveClass(/is-correct/)

  await page.getByRole('button', { name: /^THRUST\b/ }).click()
  await canvas.dispatchEvent('click', { bubbles: true, clientX: thrustX, clientY: thrustY })
  await expect(thrustTarget).toHaveClass(/is-correct/)
```

- [x] **Step 3: Run the asset check and verify the old GLB fails for the intended reason**

Run:

```bash
npm run assets:check
```

Expected: FAIL with both old glTF translations reported: radio is approximately `[-0.03, 0.011798, 0.474842]` and thrust is approximately `[0.003, 0.0048, 0.505764]`.

- [x] **Step 4: Run the focused production-browser test and verify the old projection fails**

Run:

```bash
npx playwright test e2e/smoke.spec.ts --grep "Airbus production cockpit loads" --workers=1
```

Expected: FAIL because the old 1440 radio projection is approximately `934px` or the old thrust projection is approximately `1087px`, outside the new ranges.

---

### Task 2: Move the Canonical Blender Targets and Rebuild the Airbus Asset

**Files:**
- Modify: `tools/blender/prepare_airbus_captain.py:12-16`
- Modify: `tools/blender/prepare_airbus_captain.py:87-122`
- Modify: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`
- Modify: `public/models/airbus-captain.glb`
- Test: `tools/assets/check-models.mjs`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: exact translations established in Task 1.
- Produces: rebuilt Blender source and GLB whose radio pivot projects near x=907px and thrust pivot near x=1119px at 1440x900, with child cue/hitbox world positions inherited from the moved pivots.

- [x] **Step 1: Update only the two canonical coordinate constants**

Change:

```python
CAPTAIN_THRUST_LOCATION = (0.015000, -0.505764, 0.004800)
CAPTAIN_RADIO_LOCATION = (-0.040000, -0.474842, 0.011798)
```

- [x] **Step 2: Record precise owner-directed metadata without marking the visual gate accepted**

Use these coordinate-source values in the respective functions:

```python
pivot["coordinate_source"] = "Owner-directed 1440x900 alignment farther left on the captain radio panel"
```

```python
pivot["coordinate_source"] = "Owner-directed 1440x900 alignment at the midpoint between the paired thrust levers"
```

Keep `visual_alignment_status = "pending_owner_browser_1440_captain"` until the proof screenshot is accepted.

- [x] **Step 3: Rebuild only the Airbus source and deployable GLB**

Run:

```bash
BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus
```

Expected: Blender preparation, scene validation, preview rendering, GLB export, glTF validation, and inspection all exit 0; `public/models/airbus-captain.glb` is replaced by the supported pipeline.

- [x] **Step 4: Verify the deterministic asset contract is green**

Run:

```bash
npm run assets:check
```

Expected: PASS, with both exact target translations accepted.

- [x] **Step 5: Verify the focused real-browser contract is green**

Run:

```bash
npx playwright test e2e/smoke.spec.ts --grep "Airbus production cockpit loads" --workers=1
```

Expected: 1 passed; both projected positions land inside their new ranges, and radio/thrust mesh clicks produce `is-correct` target state.

- [ ] **Step 6: Inspect the generated diff and commit the coherent target change**

Run:

```bash
git diff --check
git diff --stat
git status --short
```

Expected: only the validator, focused browser test, Airbus preparation script, authoritative Airbus `.blend`, and generated Airbus GLB are modified.

Commit:

```bash
git add tools/assets/check-models.mjs e2e/smoke.spec.ts tools/blender/prepare_airbus_captain.py art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend public/models/airbus-captain.glb
git commit -m "Align Airbus radio and thrust targets"
```

---

### Task 3: Prove the Owner-Visible Composition in the Actual Browser

**Files:**
- Create after acceptance: `preview-renders/airbus-target-alignment/airbus-radio-thrust-aligned-1440.png`
- Modify after acceptance: `plans/0013-dc9-fo-airbus-captain-seat-swap.md`
- Modify after acceptance: `TEST_REPORT.md`

**Interfaces:**
- Consumes: rebuilt target contract from Task 2.
- Produces: inspected browser evidence and durable validation records tied to the current GLB hash.

- [ ] **Step 1: Start or reuse the local production preview**

Run:

```bash
npm run preview -- --host 127.0.0.1
```

Expected: preview is reachable at `http://127.0.0.1:4173`.

- [ ] **Step 2: Prove the browser serves the rebuilt bytes**

Compare a `cache: no-store` response for `/models/airbus-captain.glb` against:

```bash
stat -c '%s' public/models/airbus-captain.glb
sha256sum public/models/airbus-captain.glb
```

Expected: served content length equals the on-disk byte length. Record the current SHA-256.

- [ ] **Step 3: Capture and inspect the 1440x900 owner proof**

Seed the Airbus phase in a fresh browser context, place the `RADIO` and `THRUST` cards through their mesh colliders, and save:

```text
/tmp/airbus-radio-thrust-aligned-1440.png
```

Expected visual result: the radio chip is farther left and centered on its intended panel; the thrust chip is farther right and centered between the paired levers; no other target moved.

- [ ] **Step 4: Inspect responsive projection at 768 and 375 widths**

At each width, select the radio and thrust cards and confirm the silhouettes remain attached to their controls, remain reachable, and do not collide with the status dock or card tray.

Expected: projected positions remain usable at both widths with no CSS/runtime offset.

- [ ] **Step 5: Stop at the owner visual gate if composition still needs judgment**

If the 1440 screenshot does not visibly resolve the request, change only one coordinate at a time and allow at most one additional local visual pass before requesting a precise owner decision. Do not update `TEST_REPORT.md`, the ExecPlan, or tracked screenshot evidence until the composition is accepted.

- [ ] **Step 6: Present the inspected 1440 proof and pause at the owner gate**

Present `/tmp/airbus-radio-thrust-aligned-1440.png` with the exact radio and thrust translations and request owner approval. Do not promote the screenshot, mark metadata verified, or update completion records until the owner accepts the composition.

---

### Task 4: Run Final Validation and Review

**Files:**
- Modify after owner acceptance: `tools/blender/prepare_airbus_captain.py`
- Modify after owner acceptance: `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`
- Modify after owner acceptance: `public/models/airbus-captain.glb`
- Modify: `plans/0013-dc9-fo-airbus-captain-seat-swap.md`
- Modify: `TEST_REPORT.md`
- Create: `preview-renders/airbus-target-alignment/airbus-radio-thrust-aligned-1440.png`

**Interfaces:**
- Consumes: accepted browser composition and current generated asset.
- Produces: final verified milestone evidence with no stale hashes or screenshots.

- [ ] **Step 1: Mark the accepted visual contract and rebuild final metadata**

After owner acceptance, set `visual_alignment_status` to `verified_browser_1440_captain` and `visual_alignment_evidence` to `preview-renders/airbus-target-alignment/airbus-radio-thrust-aligned-1440.png` on each radio and thrust pivot, hitbox, and cue in `tools/blender/prepare_airbus_captain.py`.

Run:

```bash
BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:airbus
```

Expected: the final rebuilt GLB retains the approved coordinates and adds the accepted evidence metadata without changing the visible composition.

- [ ] **Step 2: Promote evidence and update the living records**

Promote the inspected proof to:

```text
preview-renders/airbus-target-alignment/airbus-radio-thrust-aligned-1440.png
```

Append the exact source path, Blender version, target translations, GLB byte size/hash, test commands/results, screenshot paths, and remaining limitations to `plans/0013-dc9-fo-airbus-captain-seat-swap.md` and `TEST_REPORT.md`.

- [ ] **Step 3: Run the full relevant validation stack**

Run:

```bash
npm run assets:check
npm run check
npx playwright test e2e/smoke.spec.ts --grep "Airbus" --workers=1
git diff --check
```

Expected: all commands exit 0 and all Airbus-focused Playwright cases pass.

- [ ] **Step 4: Review the complete diff for scope and contract regressions**

Run:

```bash
git diff HEAD~1 -- tools/assets/check-models.mjs e2e/smoke.spec.ts tools/blender/prepare_airbus_captain.py plans/0013-dc9-fo-airbus-captain-seat-swap.md TEST_REPORT.md
git status --short
```

Confirm no camera, puzzle, copy, material, unrelated target, dependency, or unrelated asset changed; confirm the `.blend` and GLB were generated through the recorded command.

- [ ] **Step 5: Commit accepted evidence, final asset metadata, and records**

```bash
git add tools/blender/prepare_airbus_captain.py art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend public/models/airbus-captain.glb preview-renders/airbus-target-alignment/airbus-radio-thrust-aligned-1440.png plans/0013-dc9-fo-airbus-captain-seat-swap.md TEST_REPORT.md
git commit -m "Document Airbus target alignment proof"
```

- [ ] **Step 6: Report the exact completion boundary**

Report files changed, source and deployable asset paths, Blender version, GLB byte size/SHA-256, commands actually run, pass/fail counts, inspected viewport evidence, and any remaining owner-review delta. Do not claim Vercel preview proof unless one was actually created and byte-checked.
