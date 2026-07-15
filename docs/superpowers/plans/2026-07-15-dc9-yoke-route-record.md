# DC-9 Yoke Route Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the centered first-officer-yoke Legacy Route Record the direct gold-highlighted opener and remove the route dialog's unused lower space.

**Architecture:** Correct the deterministic Blender mount while preserving stable route node and `game_id` contracts. Project the canonical `dc9.route.card` point into a native HTML hotspot so pointer, keyboard, and fallback users share one opener, then scope content-height styling to the route dialog only.

**Tech Stack:** Blender 5.1.2 Python builder, GLB/glTF contracts, React 19, TypeScript, React Three Fiber, CSS, Playwright.

## Global Constraints

- Preserve the route puzzle, answers, hints, progress, camera family, chapter order, and safely parked framing.
- Preserve existing route node names, `game_id` values, collider metadata, and yoke-following hierarchy.
- Keep every required 3D interaction available through a native HTML control.
- Add no production dependency and never hand-edit the generated GLB.
- Final visual evidence is desktop 1440x900; existing narrow-width behavior must remain functional.

---

### Task 1: Correct the first-officer-yoke asset contract

**Files:**
- Modify: `tools/assets/check-models.mjs`
- Modify: `tools/blender/build_dc9_production.py`
- Generated: `art-source/blender/dc9_master.blend`
- Generated: `public/models/dc9-cockpit.glb`

**Interfaces:**
- Consumes: GLB JSON nodes named `DC9_PROP_MEM_ROUTE_CARD`, `DC9_ROUTE_ROW_*`, `DC9_ROUTE_SUBMIT`, `DC9_HITBOX_ROUTE_*`, and `OBJ8_DC9VC2_RANGE_014`.
- Produces: every route visual/collider parented to the first-officer yoke with the route card centered at Blender `(0.4973, -2.775, 0.27)` and exported glTF translation approximately `[0.4973, 0.27, 2.775]`.

- [ ] **Step 1: Add a failing asset-contract assertion**

Add parent lookup and the DC-9 route-card checks inside the `dc9-cockpit.glb` branch:

```js
const nodes = json.nodes ?? []
const nodeIndex = (name) => nodes.findIndex((node) => node.name === name)
const parentName = (name) => {
  const index = nodeIndex(name)
  const parent = nodes.find((node) => node.children?.includes(index))
  return parent?.name
}
const routeCard = nodes[nodeIndex('DC9_PROP_MEM_ROUTE_CARD')]
const routeTranslation = routeCard?.translation
const centeredOnFoYoke = Array.isArray(routeTranslation)
  && Math.abs(routeTranslation[0] - 0.4973) < 0.002
  && Math.abs(routeTranslation[1] - 0.27) < 0.002
  && Math.abs(routeTranslation[2] - 2.775) < 0.002
if (parentName('DC9_PROP_MEM_ROUTE_CARD') !== 'OBJ8_DC9VC2_RANGE_014' || !centeredOnFoYoke) {
  console.error('DC-9 route record must be centered on the first-officer yoke.')
  failed = true
}
```

- [ ] **Step 2: Run the asset check and verify red**

Run: `npm run assets:check`

Expected: FAIL because the current card is parented to `OBJ8_DC9VC2_RANGE_012` and has no exported translation.

- [ ] **Step 3: Repair the deterministic Blender builder**

Change the card center and yoke source, and update the dependency graph before preserving transforms:

```py
card_center = (0.4973, -2.775, 0.27)

def attach_route_contract_to_first_officer_yoke() -> None:
    yoke = bpy.data.objects.get("OBJ8_DC9VC2_RANGE_014")
    if yoke is None:
        raise RuntimeError("First-officer yoke pad source OBJ8_DC9VC2_RANGE_014 is missing")
    bpy.context.view_layer.update()
    # preserve each candidate's evaluated world transform before reparenting
```

Keep the existing candidate filters, metadata, route node names, colliders, and `matrix_world` preservation.

- [ ] **Step 4: Rebuild and verify green**

Run: `BLENDER_BIN=/home/user1/.local/bin/blender npm run asset:dc9`

Run: `npm run assets:check`

Expected: Blender 5.1.2 build/export succeeds, GLB validation succeeds, and the route-card parent/translation assertion passes.

- [ ] **Step 5: Commit the asset checkpoint**

```bash
git add tools/assets/check-models.mjs tools/blender/build_dc9_production.py art-source/blender/dc9_master.blend public/models/dc9-cockpit.glb
git commit -m "fix: center route record on FO yoke"
```

### Task 2: Replace the yellow opener with the projected record hotspot

**Files:**
- Modify: `e2e/smoke.spec.ts`
- Modify: `src/components/dc9/Dc9Chapter.tsx`
- Modify: `src/components/dc9/dc9Chapter.css`

**Interfaces:**
- Consumes: `hotspots['dc9.route.card']` as `{ x: number; y: number; visible: boolean }`.
- Produces: a native button with accessible name `Open Legacy Route Record`, class `dc9-route-record-trigger`, `data-projection="mesh|fallback"`, and a compact `.dc9-route-record` dialog.

- [ ] **Step 1: Add failing browser expectations**

In the DC-9 accessible and production cases, require the projected opener, absence of the yellow prompt panel, keyboard activation, and compact dialog height:

```ts
const routeTrigger = page.getByRole('button', { name: 'Open Legacy Route Record' })
await expect(routeTrigger).toHaveClass(/dc9-route-record-trigger/)
await expect(page.locator('.dc9-chapter__prompt')).toHaveCount(0)
await routeTrigger.press('Enter')
const routeDialog = page.getByRole('dialog', { name: 'Legacy Route Record' })
await expect(routeDialog).toBeVisible()
expect((await routeDialog.boundingBox())?.height).toBeLessThan(650)
```

For the production case, retain `data-projection="mesh"`, assert `data-projection-point`, hover the trigger, and require its border color to be non-transparent:

```ts
await routeTrigger.hover()
await expect(routeTrigger).toHaveCSS('border-top-color', 'rgb(240, 200, 117)')
```

- [ ] **Step 2: Run the focused browser test and verify red**

Run: `npx playwright test e2e/smoke.spec.ts -g "DC-9 Final Flight Log accessible flow|DC-9 production cockpit" --workers=1`

Expected: FAIL because the current trigger is the yellow `.primary-button`, the prompt panel exists, and the dialog height is about 780px at 1440x900.

- [ ] **Step 3: Implement the canonical projected opener**

In `Dc9Chapter.tsx`, replace the multi-ID first-visible lookup and prompt panel with the route card projection and one native hotspot button:

```tsx
const routeProjection = hotspots['dc9.route.card']

{state.dc9.stage === 'intro' || (state.dc9.stage === 'routeRecord' && routeRecordDismissed) ? (
  <button
    type="button"
    className={`dc9-route-record-trigger${routeProjection?.visible ? ' is-projected' : ' is-fallback'}`}
    aria-label="Open Legacy Route Record"
    data-projection={routeProjection?.visible ? 'mesh' : 'fallback'}
    data-projection-point={routeProjection?.visible ? `${routeProjection.x},${routeProjection.y}` : undefined}
    style={routeProjection?.visible ? { left: routeProjection.x, top: routeProjection.y } : undefined}
    onClick={openRouteRecord}
  >
    <span className="sr-only">Open Legacy Route Record</span>
  </button>
) : null}
```

Remove `LEGACY_ROUTE_TRIGGER_IDS` and `.dc9-chapter__prompt` markup.

- [ ] **Step 4: Add hover/focus and compact-dialog styles**

Add a transparent projected hit area and scoped route-dialog sizing:

```css
.dc9-route-record-trigger {
  position: absolute;
  width: 5.25rem;
  height: 9.5rem;
  border: 2px solid transparent;
  border-radius: .35rem;
  background: transparent;
  transform: translate(-50%, -50%);
}

.dc9-route-record-trigger:hover,
.dc9-route-record-trigger:focus-visible {
  border-color: #f0c875;
  box-shadow: 0 0 0 2px rgb(240 200 117 / 24%), 0 0 24px rgb(240 200 117 / 52%);
}

.dc9-route-record-trigger.is-fallback {
  left: 50%;
  top: 58%;
}

.dc9-route-record {
  bottom: auto;
  max-height: calc(100vh - 8rem);
}
```

Keep reduced-motion behavior and add `.dc9-route-record-trigger` to the no-animation selector.

- [ ] **Step 5: Run focused tests and verify green**

Run: `npx playwright test e2e/smoke.spec.ts -g "DC-9 Final Flight Log accessible flow|DC-9 production cockpit|DC-9 model failure" --workers=1`

Expected: PASS for pointer/keyboard opener, fallback, mesh projection, gold hover, compact dialog, and existing route completion.

- [ ] **Step 6: Commit the UI checkpoint**

```bash
git add e2e/smoke.spec.ts src/components/dc9/Dc9Chapter.tsx src/components/dc9/dc9Chapter.css
git commit -m "feat: open route record from yoke"
```

### Task 3: Browser approval evidence and final verification

**Files:**
- Modify: `plans/0013-dc9-fo-airbus-captain-seat-swap.md`
- Modify: `TEST_REPORT.md`
- Create: `preview-renders/seat-role-swap/dc9-route-record-centered-1440.png`
- Create: `preview-renders/seat-role-swap/dc9-route-record-hover-1440.png`
- Create: `preview-renders/seat-role-swap/dc9-route-record-compact-dialog-1440.png`

**Interfaces:**
- Consumes: rebuilt `public/models/dc9-cockpit.glb` and the projected HTML opener.
- Produces: current 1440x900 evidence and durable validation records.

- [ ] **Step 1: Capture actual-browser evidence**

At 1440x900 in the real app, capture the centered record at rest, hover/focus gold outline, and compact open dialog. Confirm the canvas reports `data-dc9-model-state="ready"`, `data-dc9-camera-node="CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL"`, and the opener reports `data-projection="mesh"`.

- [ ] **Step 2: Run application and asset checks**

Run: `npm run check`

Run: `npm run assets:check`

Run: `git diff --check`

Expected: all commands exit 0.

- [ ] **Step 3: Update durable evidence**

Record the Blender version, corrected yoke node, route-card transform, GLB validation result, focused Playwright result, full check result, screenshot paths, and any remaining owner-visible delta in the active ExecPlan and `TEST_REPORT.md`.

- [ ] **Step 4: Review the complete repair diff**

Inspect the complete diff for progress loss, hidden native controls, stale yellow-button references, broken route `game_id` values, shared Home Operations Log layout changes, and unrelated files. Repair any critical/high issue and rerun the affected check.

- [ ] **Step 5: Commit the evidence checkpoint**

```bash
git add plans/0013-dc9-fo-airbus-captain-seat-swap.md TEST_REPORT.md preview-renders/seat-role-swap/dc9-route-record-centered-1440.png preview-renders/seat-role-swap/dc9-route-record-hover-1440.png preview-renders/seat-role-swap/dc9-route-record-compact-dialog-1440.png
git commit -m "test: record DC-9 route interaction proof"
```
