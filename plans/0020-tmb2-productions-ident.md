# TMB2 Productions Ident Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the procedural opening `TMB2` glyphs with exact
owner-approved, manifest-backed logo layers and add a centered restrained-gold
`PRODUCTIONS` caption without changing the established intro clock or handoff.

**Architecture:** A focused deterministic Python builder verifies the immutable
source hash, copies the exact source into the runtime package, and emits four
transparent 320x224-stage-ready ident layers. The existing intro asset loader
preloads those layers, while `introRenderer.ts` converts the existing
`buildProgress` and `highlightOpacity` timeline values into image-backed draw
commands. Runtime fallback uses the exact source image and never recreates TMB2
typography.

**Tech Stack:** TypeScript, React, Canvas 2D, Vitest, Playwright, Node.js asset
contracts, Python 3 with Pillow, Vite.

## Global Constraints

- Preserve the exact source at SHA-256
  `673d13b96bc19b35b508630d1d662d16672ac4bb6ad665a7f6b1b7cee992ce17`.
- Source dimensions remain 1659x948 and source size remains 811,581 bytes.
- Never redraw, trace, infer, or procedurally recreate the TMB2 typography.
- Keep the 53.04-second media clock, cue boundaries, Start behavior, audio,
  accessibility, reduced motion, spoiler protection, and 650-millisecond DC-9
  handoff unchanged.
- Keep `PRODUCTIONS` smaller than the logo, centered, widely tracked, and
  restrained gold.
- Use no new production dependency and do not import the unfinished 196-file
  TMB2 production-polish checkpoint wholesale.
- Preserve all unrelated work and stop at any failed validation until its root
  cause is repaired.

---

## Purpose

The opening ident currently spells TMB2 with inferred block glyphs even though
the owner-approved logo is now tracked. This milestone makes the first screen
use the actual logo authority and adds the requested `PRODUCTIONS` caption while
preserving the already approved cinematic and input behavior.

## Current state

- `art-source/intro/tmb2/owner-approved/TMB2logo.png` is tracked and
  hash-documented.
- `src/game/introRenderer.ts` emits one procedural `logo` command and draws
  `T`, `M`, `B`, and `2` from `LOGO_GLYPHS`.
- `src/game/introAnimation.ts` already exposes `visible`, `buildProgress`, and
  `highlightOpacity`; its cue boundaries need no change. Its current
  reduced-motion ident freezes at a partial `0.694` build and needs a focused
  final-pose correction.
- `src/game/introAssets.ts` knows fifteen backgrounds/sprite sheets and preloads
  four opening images.
- `tools/assets/build-intro-manifest.mjs` does not currently reproduce the
  committed twelve-entry Canvas preload list; the follow-up must repair this
  drift while adding the ident assets.
- The merged source contains no runtime logo layer files.

## Scope

Included: deterministic source verification and derived ident assets, manifest
and runtime registry updates, exact-image fallback, Canvas draw commands,
`PRODUCTIONS`, focused tests, full regression checks, browser captures, reports,
Vercel preview, and a draft PR.

Excluded: later-scene art changes, soundtrack or cue changes, new intro
mechanics, Model Y work, production-polish checkpoint integration, or a new
font/runtime dependency.

## Progress

- [x] 2026-07-26 — Owner approved exact-logo assembly, gold/white highlight,
  and restrained gold `PRODUCTIONS` small caps.
- [x] 2026-07-26 — Recorded and approved
  `docs/superpowers/specs/2026-07-26-tmb2-productions-ident-design.md`.
- [ ] Complete deterministic asset generation and manifest contract.
- [ ] Complete runtime asset loading and image-backed renderer.
- [ ] Complete responsive browser proof and regression validation.
- [ ] Review, report, deploy, and publish the owner gate.

## Discoveries

- The approved source includes whitespace; the established production crop is
  `(105, 261, 1573, 663)`, yielding 1468x402 artwork resized to 288x79 at stage
  position `(16, 72)`.
- The existing timeline already provides every timing value required for the
  animated presentation, but its reduced-motion midpoint behavior must resolve
  to the complete ident for this scene.
- The manifest generator's historical WebP preload list differs from the
  current twelve PNG assets consumed by Canvas. The generator must become
  authoritative again instead of preserving this drift.

## Decision log

- 2026-07-26 — Keep existing ident timing and replace only the drawing source.
- 2026-07-26 — Generate a deterministic bitmap `PRODUCTIONS` layer rather than
  relying on browser/system fonts.
- 2026-07-26 — Ship a byte-identical runtime source copy so a derived-layer
  failure never falls back to inferred glyphs.
- 2026-07-26 — Add all five ident images to the initial decode gate because the
  ident is the first cinematic scene.

## File map

- Create `tools/assets/build-tmb2-ident-assets.py`: immutable-source validation,
  exact runtime copy, crop/mask generation, deterministic productions bitmap.
- Modify `tools/assets/build-intro-manifest.mjs`: generate current Canvas preload
  authority plus the five ident assets and provenance.
- Modify `tools/assets/intro-asset-contract.mjs`: validate logo authority and
  manifest role/source fields.
- Modify `tools/assets/intro-asset-contract.test.mjs`: test source and runtime
  logo contracts before implementation.
- Modify `package.json`: add one deterministic `asset:tmb2-ident` command.
- Modify `src/game/introAssets.ts`: register `logo-layer` assets and initial
  preload ids.
- Modify `src/game/introAssets.test.ts`: prove registry, tier, and failure paths.
- Modify `src/game/introRenderer.ts`: replace procedural glyphs with logo-layer
  draw commands and exact-source fallback.
- Modify `src/game/introRenderer.test.ts`: prove command thresholds and absence
  of procedural typography.
- Modify `src/game/introAnimation.ts`: resolve reduced-motion ident to the full
  build without changing scene boundaries.
- Modify `src/game/introAnimation.test.ts`: prove the focused final-pose rule.
- Modify `e2e/smoke.spec.ts`: prove actual asset requests, timing, reduced
  motion, responsive bounds, and failure retry.
- Modify `asset-reports/tmb2-intro-assets.json`,
  `art-source/intro/tmb2/README.md`, `LICENSES/ASSET_MANIFEST.md`,
  `TEST_REPORT.md`, and this plan: record generated hashes and validation.
- Create `preview-renders/tmb2-productions-ident/*`: actual-browser owner proof.

---

### Task 1: Deterministic ident assets and manifest authority

**Files:**

- Create: `tools/assets/build-tmb2-ident-assets.py`
- Modify: `tools/assets/intro-asset-contract.mjs`
- Test: `tools/assets/intro-asset-contract.test.mjs`
- Modify: `tools/assets/build-intro-manifest.mjs`
- Modify: `package.json`
- Create after the test fails:
  `public/images/intro/tmb2/logo/tmb2-ident-source.png`
- Create after the test fails:
  `public/images/intro/tmb2/logo/tmb2-ident-base.png`
- Create after the test fails:
  `public/images/intro/tmb2/logo/tmb2-ident-blue-mask.png`
- Create after the test fails:
  `public/images/intro/tmb2/logo/tmb2-ident-highlight-mask.png`
- Create after the test fails:
  `public/images/intro/tmb2/logo/tmb2-productions.png`
- Regenerate: `public/images/intro/tmb2/tmb2-intro-assets.json`

**Interfaces:**

- Consumes: approved source path and SHA-256 from the global constraints.
- Produces:
  `validateTmb2LogoAuthority({ sourcePath, packageRoot, manifest }): string[]`;
  five runtime asset ids `logo-source`, `logo-base`, `logo-blue-mask`,
  `logo-highlight-mask`, and `logo-productions`.

- [ ] **Step 1: Write failing contract tests**

Add fixtures and committed-package assertions:

```js
it('binds the exact approved source and five manifest-backed ident layers', () => {
  const manifest = JSON.parse(readFileSync(
    'public/images/intro/tmb2/tmb2-intro-assets.json',
    'utf8',
  ))
  expect(validateTmb2LogoAuthority({
    sourcePath: 'art-source/intro/tmb2/owner-approved/TMB2logo.png',
    packageRoot: 'public/images/intro/tmb2',
    manifest,
  })).toEqual([])
  expect(manifest.preload.slice(0, 5)).toEqual([
    'logo/tmb2-ident-source.png',
    'logo/tmb2-ident-blue-mask.png',
    'logo/tmb2-ident-base.png',
    'logo/tmb2-ident-highlight-mask.png',
    'logo/tmb2-productions.png',
  ])
})
```

Add a negative fixture that supplies the wrong source hash and omits
`logo-productions`; assert errors containing `approved TMB2 logo hash` and
`missing ident layer`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test -- --run tools/assets/intro-asset-contract.test.mjs
```

Expected: FAIL because `validateTmb2LogoAuthority` and runtime ident files do not
exist.

- [ ] **Step 3: Implement the contract validator**

Add:

```js
export const TMB2_LOGO_SHA256 =
  '673d13b96bc19b35b508630d1d662d16672ac4bb6ad665a7f6b1b7cee992ce17'

export function validateTmb2LogoAuthority({ sourcePath, packageRoot, manifest }) {
  const errors = []
  if (!existsSync(sourcePath) || sha256File(sourcePath) !== TMB2_LOGO_SHA256) {
    errors.push('approved TMB2 logo hash does not match')
  }
  const required = [
    'logo/tmb2-ident-source.png',
    'logo/tmb2-ident-blue-mask.png',
    'logo/tmb2-ident-base.png',
    'logo/tmb2-ident-highlight-mask.png',
    'logo/tmb2-productions.png',
  ]
  const byPath = new Map((manifest.assets ?? []).map((asset) => [asset.path, asset]))
  for (const path of required) {
    const asset = byPath.get(path)
    if (!asset) errors.push(`missing ident layer: ${path}`)
    else if (asset.role !== 'logo-layer' || asset.sceneGroup !== 'ident') {
      errors.push(`invalid ident contract: ${path}`)
    }
  }
  return errors
}
```

The implementation must also check:

- exact source byte count and dimensions;
- byte equality between source and `tmb2-ident-source.png`;
- 288x79 alpha dimensions for base/blue/highlight;
- 320x224 alpha dimensions for productions;
- valid SHA-256/byte metadata already enforced by `validateIntroManifest`.

- [ ] **Step 4: Implement the deterministic builder**

Use Pillow with constants:

```py
EXPECTED_SHA256 = "673d13b96bc19b35b508630d1d662d16672ac4bb6ad665a7f6b1b7cee992ce17"
SOURCE_SIZE = (1659, 948)
LOGO_CROP = (105, 261, 1573, 663)
IDENT_SIZE = (288, 79)
IDENT_POSITION = (16, 72)
```

The builder must:

1. read only the tracked owner-approved source;
2. fail on hash, size, or dimension drift;
3. use `shutil.copyfile` for the byte-identical runtime source;
4. crop and resize the exact artwork using `Image.Resampling.LANCZOS`;
5. derive RGBA base, blue-only, and white/gold-only masks;
6. construct `PRODUCTIONS` from an embedded 5x7 uppercase bitmap alphabet for
   `P`, `R`, `O`, `D`, `U`, `C`, `T`, `I`, `O`, `N`, and `S`;
7. render the caption in `(224, 175, 74, 255)` at stage y=164 with two-pixel
   cells and two-pixel tracking, centered within 320 pixels; and
8. write deterministic PNGs with `optimize=False, compress_level=9`.

- [ ] **Step 5: Repair and regenerate the manifest**

Make each PNG record carry optional metadata:

```js
{
  role: 'logo-layer',
  sceneGroup: 'ident',
  source: 'art-source/intro/tmb2/owner-approved/TMB2logo.png',
}
```

Replace the stale historical preload array with the exact current Canvas paths:
the five logo paths first, followed by the existing twelve background/sprite
PNG paths. Set `sourceAuthority` to
`owner-approved TMB2 logo and blonde-haired Pop T storyboard`.

Add:

```json
"asset:tmb2-ident": "python3 tools/assets/build-tmb2-ident-assets.py && node tools/assets/build-intro-manifest.mjs"
```

- [ ] **Step 6: Build assets and verify GREEN**

Run:

```bash
npm run asset:tmb2-ident
npm run test -- --run tools/assets/intro-asset-contract.test.mjs
npm run assets:check
```

Expected: all pass; the exact runtime source hash equals the owner source; the
manifest count increases from 69 to 74 and preload count from 12 to 17.

- [ ] **Step 7: Commit Task 1**

```bash
git add package.json tools/assets/build-tmb2-ident-assets.py \
  tools/assets/build-intro-manifest.mjs \
  tools/assets/intro-asset-contract.mjs \
  tools/assets/intro-asset-contract.test.mjs \
  public/images/intro/tmb2/logo \
  public/images/intro/tmb2/tmb2-intro-assets.json
git commit -m "assets: build approved TMB2 ident layers"
```

---

### Task 2: Runtime asset registry and opening decode gate

**Files:**

- Modify: `src/game/introAssets.ts`
- Test: `src/game/introAssets.test.ts`

**Interfaces:**

- Consumes: Task 1 asset ids and paths.
- Produces: `IntroAsset['role']` including `logo-layer`; initial assets containing
  all five ident images; full assets containing twenty total images.

- [ ] **Step 1: Write failing registry tests**

Update assertions:

```ts
expect(introAssets).toHaveLength(20)
expect(INTRO_INITIAL_ASSET_IDS).toEqual([
  'logo-source',
  'logo-blue-mask',
  'logo-base',
  'logo-highlight-mask',
  'logo-productions',
  'background-duffel',
  'popt-duffel-pull',
  'popt-startle-stumble',
  'key-poses',
])
expect(introAssets.filter((asset) => asset.role === 'logo-layer')
  .map((asset) => asset.id)).toEqual([
    'logo-source',
    'logo-blue-mask',
    'logo-base',
    'logo-highlight-mask',
    'logo-productions',
  ])
```

Update the decode-controlled test to use the nine initial assets. Preserve the
exact failure-id/path assertion by failing `logo-source` first.

- [ ] **Step 2: Run and verify RED**

```bash
npm run test -- --run src/game/introAssets.test.ts
```

Expected: FAIL with the old fifteen/four counts and missing logo ids.

- [ ] **Step 3: Implement the runtime registry**

Extend:

```ts
role: 'background' | 'sprite' | 'logo-layer'
```

Register the five logo records at the start of `introAssets`, using paths from
Task 1, and prepend their ids to `INTRO_INITIAL_ASSET_IDS`.

- [ ] **Step 4: Run and verify GREEN**

```bash
npm run test -- --run src/game/introAssets.test.ts
```

Expected: all intro asset registry/load tests pass.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/game/introAssets.ts src/game/introAssets.test.ts
git commit -m "feat: preload TMB2 ident artwork"
```

---

### Task 3: Image-backed ident rendering

**Files:**

- Modify: `src/game/introRenderer.ts`
- Test: `src/game/introRenderer.test.ts`
- Modify: `src/game/introAnimation.ts`
- Test: `src/game/introAnimation.test.ts`

**Interfaces:**

- Consumes: existing `frame.logo.visible`, `buildProgress`, and
  `highlightOpacity`; Task 2 `IntroRenderAssets`.
- Produces:

```ts
type LogoLayerId =
  | 'logo-blue-mask'
  | 'logo-base'
  | 'logo-highlight-mask'
  | 'logo-productions'

type LogoLayerCommand = {
  kind: 'logo-layer'
  assetId: LogoLayerId
  revealProgress: number
  opacity: number
  blendMode: GlobalCompositeOperation
}
```

- [ ] **Step 1: Write failing command and reduced-motion tests**

At 4.8 seconds, assert command order:

```ts
const commands = deriveIntroDrawCommands(deriveIntroAnimation(4.8, false), null)
expect(commands.map((command) => command.kind)).toEqual([
  'clear',
  'logo-layer',
  'logo-layer',
  'logo-layer',
  'logo-layer',
])
expect(commands.filter((command) => command.kind === 'logo-layer')).toEqual([
  expect.objectContaining({ assetId: 'logo-blue-mask' }),
  expect.objectContaining({ assetId: 'logo-base' }),
  expect.objectContaining({ assetId: 'logo-highlight-mask' }),
  expect.objectContaining({ assetId: 'logo-productions' }),
])
expect(JSON.stringify(commands)).not.toMatch(/glyph|procedural/i)
```

Add boundary assertions:

- early assembly emits only blue;
- base begins after progress `0.45`;
- productions begins after progress `0.72`;
- highlight emits only while `highlightOpacity > 0`;
- reduced motion emits base and productions at full opacity.

In `introAnimation.test.ts`, assert:

```ts
expect(deriveIntroAnimation(3, true).logo).toEqual({
  visible: true,
  buildProgress: 1,
  highlightOpacity: 0,
})
```

- [ ] **Step 2: Run and verify RED**

```bash
npm run test -- --run src/game/introRenderer.test.ts
```

Expected: FAIL because the command kind is still `logo`.

- [ ] **Step 3: Replace the command model**

Delete `LOGO_GLYPHS` and `drawLogo`. Emit:

```ts
commands.push({
  kind: 'logo-layer',
  assetId: 'logo-blue-mask',
  revealProgress: frame.logo.buildProgress,
  opacity: 1,
  blendMode: 'source-over',
})
if (frame.logo.buildProgress > 0.45) {
  commands.push({
    kind: 'logo-layer',
    assetId: 'logo-base',
    revealProgress: frame.logo.buildProgress,
    opacity: Math.min(1, (frame.logo.buildProgress - 0.45) / 0.35),
    blendMode: 'source-over',
  })
}
if (frame.logo.highlightOpacity > 0) {
  commands.push({
    kind: 'logo-layer',
    assetId: 'logo-highlight-mask',
    revealProgress: 1,
    opacity: frame.logo.highlightOpacity,
    blendMode: 'screen',
  })
}
if (frame.logo.buildProgress > 0.72) {
  commands.push({
    kind: 'logo-layer',
    assetId: 'logo-productions',
    revealProgress: 1,
    opacity: Math.min(1, (frame.logo.buildProgress - 0.72) / 0.22),
    blendMode: 'source-over',
  })
}
```

- [ ] **Step 4: Resolve the reduced-motion ident to its complete pose**

In only the `tmb2-ident` case:

```ts
logo: reducedMotion
  ? { visible: true, buildProgress: 1, highlightOpacity: 0 }
  : {
      visible: true,
      buildProgress: clamp01(sceneProgress / 0.72),
      highlightOpacity: clamp01((sceneProgress - 0.78) / 0.22),
    },
```

Do not change scene start/end times or any other reduced-motion scene.

- [ ] **Step 5: Implement exact-source drawing fallback**

Add constants:

```ts
const IDENT_SOURCE_CROP = { x: 105, y: 261, width: 1468, height: 402 }
const IDENT_TARGET = { x: 16, y: 72, width: 288, height: 79 }
```

Before drawing logo commands, determine whether every commanded derived asset
exists. If any TMB2 layer is missing, draw `logo-source` once with the source
crop, clipped by the current maximum `revealProgress`; still draw
`logo-productions` when available. Never invoke a text/glyph fallback.

Add a pure helper:

```ts
export function shouldUseExactLogoFallback(
  commands: readonly LogoLayerCommand[],
  assets: IntroRenderAssets,
): boolean {
  return commands
    .filter((command) => command.assetId !== 'logo-productions')
    .some((command) => !assets.has(command.assetId))
}
```

Test the helper with maps missing base/highlight and with all layers present.

- [ ] **Step 6: Run and verify GREEN**

```bash
npm run test -- --run src/game/introRenderer.test.ts
npm run test -- --run src/game/introAnimation.test.ts src/game/introRenderer.test.ts
```

Expected: all timeline and renderer tests pass with unchanged cue boundaries.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/game/introAnimation.ts src/game/introAnimation.test.ts \
  src/game/introRenderer.ts src/game/introRenderer.test.ts
git commit -m "feat: render approved TMB2 Productions ident"
```

---

### Task 4: Actual-browser behavior and visual evidence

**Files:**

- Modify: `e2e/smoke.spec.ts`
- Create: `preview-renders/tmb2-productions-ident/ident-1440x900.png`
- Create: `preview-renders/tmb2-productions-ident/ident-768x900.png`
- Create: `preview-renders/tmb2-productions-ident/ident-375x812.png`
- Create:
  `preview-renders/tmb2-productions-ident/ident-reduced-motion-375x812.png`

**Interfaces:**

- Consumes: complete Tasks 1–3 runtime.
- Produces: browser assertions and owner-review screenshots.

- [ ] **Step 1: Write failing browser assertions**

In the existing TMB2 opening test:

```ts
await expect.poll(() => requestedPaths).toEqual(expect.arrayContaining([
  '/images/intro/tmb2/logo/tmb2-ident-source.png',
  '/images/intro/tmb2/logo/tmb2-ident-base.png',
  '/images/intro/tmb2/logo/tmb2-ident-blue-mask.png',
  '/images/intro/tmb2/logo/tmb2-ident-highlight-mask.png',
  '/images/intro/tmb2/logo/tmb2-productions.png',
]))
```

At the ident hold, use a Canvas pixel probe to prove non-background pixels exist
inside both the logo bounds `(16,72,288,79)` and productions band y=164..178.
Keep the existing no-visible-title/spoiler assertions.

Add a derived-layer failure route for `tmb2-ident-base.png`; assert playback
still starts and the Canvas remains non-empty from the exact-source fallback.

- [ ] **Step 2: Run focused browser tests and verify RED**

```bash
npm run test:e2e -- e2e/smoke.spec.ts --grep "TMB2 cinematic" --workers=1
```

Expected: new logo requests/pixels are absent.

- [ ] **Step 3: Run focused browser tests and verify GREEN**

After Tasks 1–3 implementation:

```bash
CAPTURE_TMB2_IDENT_EVIDENCE=1 \
  npm run test:e2e -- e2e/smoke.spec.ts --grep "TMB2 cinematic" --workers=1
```

Capture the ident hold at 1440x900, 768x900, and 375x812 plus the reduced-motion
375x812 view. Record console errors, page errors, failed requests, and
horizontal overflow; all counts must be zero.

- [ ] **Step 4: Inspect the images**

Use image inspection to verify:

- exact logo proportions and recognizable lettering;
- `PRODUCTIONS` centered beneath, gold, and subordinate;
- no overlap with sound controls or Start prompt;
- no crop/blur/overflow at each viewport;
- reduced-motion final ident is complete and stable.

Perform at most three evidence-driven repair cycles. Stop if the delta stops
shrinking or owner visual judgment is required.

- [ ] **Step 5: Commit Task 4**

```bash
git add e2e/smoke.spec.ts preview-renders/tmb2-productions-ident
git commit -m "test: prove TMB2 Productions ident"
```

---

### Task 5: Full verification, records, deployment, and publication

**Files:**

- Modify: `asset-reports/tmb2-intro-assets.json`
- Modify: `art-source/intro/tmb2/README.md`
- Modify: `LICENSES/ASSET_MANIFEST.md`
- Modify: `TEST_REPORT.md`
- Modify: `plans/0020-tmb2-productions-ident.md`

**Interfaces:**

- Consumes: all generated hashes, test output, screenshots, and deployment URL.
- Produces: auditable owner gate and draft PR.

- [ ] **Step 1: Update evidence records**

Record:

- exact source and runtime-copy hash/bytes/dimensions;
- base, mask, highlight, and productions hashes/dimensions;
- manifest asset/preload counts;
- derivation rules and deterministic builder command;
- actual tests and results;
- screenshot paths;
- known limitations and owner visual decision.

- [ ] **Step 2: Run the full validation stack**

```bash
npm run asset:tmb2-ident
npm run assets:check
npm run pipeline:evals
npm run check
npm run test:e2e -- --workers=1
git diff --check
python3 -m py_compile tools/assets/build-tmb2-ident-assets.py
```

Expected: every command passes. Do not describe unrun checks as passing.

- [ ] **Step 3: Review the complete diff**

Check:

- no `LOGO_GLYPHS` or procedural TMB2 drawing remains;
- no timing/input/handoff source changed without an explicit test;
- all runtime image paths are hash-bound and safe;
- no protected reward term appears in intro assets;
- no file from the unrelated production-polish checkpoint slipped in;
- generated assets match the deterministic rebuild; and
- no critical/high-severity finding remains.

- [ ] **Step 4: Commit records**

```bash
git add asset-reports/tmb2-intro-assets.json \
  art-source/intro/tmb2/README.md LICENSES/ASSET_MANIFEST.md \
  TEST_REPORT.md plans/0020-tmb2-productions-ident.md
git commit -m "docs: record TMB2 Productions owner gate"
```

- [ ] **Step 5: Deploy and verify**

Publish a Vercel preview from the committed tree. Verify:

- deployment status `READY`;
- HTTP 200 for the app and all five ident assets through authenticated access;
- deployed source hash matches the approved source; and
- actual preview renders the same ident as local evidence.

- [ ] **Step 6: Push and open a draft PR**

```bash
git push -u origin agent/tmb2-productions-ident
```

Open a draft PR targeting `main` with the preview URL, hashes, validation,
evidence paths, and remaining owner visual decision. Check GitHub status once
and hand off without a polling loop.

## Validation plan

### Asset

- Source hash/bytes/dimensions immutable.
- Runtime exact source byte-identical.
- Base, blue, highlight, and productions are alpha PNGs with expected sizes.
- Manifest has 74 real assets and 17 preload entries.
- Build command is deterministic across two consecutive runs.

### Unit

- Logo layers are initial-tier assets.
- Command thresholds match the existing timeline.
- Procedural glyphs are absent.
- Missing derived imagery selects exact-source fallback.
- Reduced motion selects the complete ident.

### Browser

- All five images decode before Start enables.
- Exact ident appears during the original opening window.
- Start, audio retry, pointer, keyboard, controller, loop, and handoff remain
  unchanged.
- One derived-layer failure preserves a complete exact-source ident.
- 375, 768, and 1440 widths show no overflow/crop/control collision.

### Regression

- Full Vitest and Chromium suites.
- Existing DC-9, locker, Airbus, Model Y, persistence, and asset contracts.
- No early Model Y/Mars request or visible spoiler.

## Acceptance criteria

- The opening ident uses the approved TMB2 logo, not inferred glyphs.
- Existing blue assembly and highlight timing remain recognizable.
- Gold `PRODUCTIONS` is centered, readable, and subordinate.
- Exact-source fallback works without procedural typography.
- No timing, input, accessibility, or handoff regression.
- All listed checks pass and evidence is ready for owner review.

## Repair loop and stop conditions

Repeat test failure -> root-cause diagnosis -> smallest coherent repair ->
focused rerun -> full nearby regression -> browser inspection. Limit visual
repair to three cycles. Stop if a genuine owner visual decision is required,
the delta stops shrinking, or a required external source/tool cannot be
recovered safely.

## Evidence

- Approved design:
  `docs/superpowers/specs/2026-07-26-tmb2-productions-ident-design.md`.
- Approved source:
  `art-source/intro/tmb2/owner-approved/TMB2logo.png`.
- Implementation evidence will be recorded as each checkbox completes.

## Outcome and handoff

Implementation has not started. The final handoff will record delivered visual
behavior, generated hashes, actual validation, Vercel preview, draft PR, and the
remaining owner visual decision.
