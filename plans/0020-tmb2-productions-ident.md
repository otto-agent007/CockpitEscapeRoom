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
- [x] 2026-07-26 — Completed deterministic asset generation and manifest
  contract; focused tests pass with 74 assets and 17 preloads.
- [x] 2026-07-26 — Completed runtime asset loading and image-backed renderer;
  focused animation, renderer, and TypeScript checks pass.
- [x] 2026-07-26 — Completed responsive browser proof at 1440, 768, and
  375 pixels plus reduced motion; focused Chromium checks pass.
- [x] 2026-07-26 — Reviewed, reported, deployed, and published draft PR #54
  with the owner-review evidence and preview.

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
- Chromium intermittently left the four existing large opening sheets pending
  when all nine initial images called `decode()` concurrently. Instrumented
  repeat runs proved that all five ident layers resolved while the sheets
  stalled; serializing the initial decode gate removed the flake across five
  fresh-browser repeats.

## Decision log

- 2026-07-26 — Keep existing ident timing and replace only the drawing source.
- 2026-07-26 — Generate a deterministic bitmap `PRODUCTIONS` layer rather than
  relying on browser/system fonts.
- 2026-07-26 — Ship a byte-identical runtime source copy so a derived-layer
  failure never falls back to inferred glyphs.
- 2026-07-26 — Add all five ident images to the initial decode gate because the
  ident is the first cinematic scene.
- 2026-07-26 — Decode the initial tier sequentially. This preserves the
  decode-before-Start contract while avoiding Chromium's concurrent large-sheet
  decode stall.
- 2026-07-26 — A missing initial logo layer remains a blocking, exact retry
  error. The renderer's exact-source fallback protects post-decode asset-map
  loss; it does not weaken the opening gate.

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

- [x] **Step 1: Write failing contract tests**

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

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test -- --run tools/assets/intro-asset-contract.test.mjs
```

Expected: FAIL because `validateTmb2LogoAuthority` and runtime ident files do not
exist.

- [x] **Step 3: Implement the contract validator**

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

- [x] **Step 4: Implement the deterministic builder**

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

- [x] **Step 5: Repair and regenerate the manifest**

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

- [x] **Step 6: Build assets and verify GREEN**

Run:

```bash
npm run asset:tmb2-ident
npm run test -- --run tools/assets/intro-asset-contract.test.mjs
npm run assets:check
```

Expected: all pass; the exact runtime source hash equals the owner source; the
manifest count increases from 69 to 74 and preload count from 12 to 17.

- [x] **Step 7: Commit Task 1**

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

- [x] **Step 1: Write failing registry tests**

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

- [x] **Step 2: Run and verify RED**

```bash
npm run test -- --run src/game/introAssets.test.ts
```

Expected: FAIL with the old fifteen/four counts and missing logo ids.

- [x] **Step 3: Implement the runtime registry**

Extend:

```ts
role: 'background' | 'sprite' | 'logo-layer'
```

Register the five logo records at the start of `introAssets`, using paths from
Task 1, and prepend their ids to `INTRO_INITIAL_ASSET_IDS`.

- [x] **Step 4: Run and verify GREEN**

```bash
npm run test -- --run src/game/introAssets.test.ts
```

Expected: all intro asset registry/load tests pass.

- [x] **Step 5: Commit Task 2**

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

- [x] **Step 1: Write failing command and reduced-motion tests**

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

- [x] **Step 2: Run and verify RED**

```bash
npm run test -- --run src/game/introRenderer.test.ts
```

Expected: FAIL because the command kind is still `logo`.

- [x] **Step 3: Replace the command model**

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

- [x] **Step 4: Resolve the reduced-motion ident to its complete pose**

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

- [x] **Step 5: Implement exact-source drawing fallback**

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

- [x] **Step 6: Run and verify GREEN**

```bash
npm run test -- --run src/game/introRenderer.test.ts
npm run test -- --run src/game/introAnimation.test.ts src/game/introRenderer.test.ts
```

Expected: all timeline and renderer tests pass with unchanged cue boundaries.

- [x] **Step 7: Commit Task 3**

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

- [x] **Step 1: Write browser assertions**

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

Add a derived-layer failure route for `tmb2-ident-base.png`; assert playback is
blocked with the exact asset id/path and succeeds after Retry. The pure renderer
test proves the exact-source fallback independently of the stricter decode gate.

- [x] **Step 2: Run focused browser tests**

```bash
npm run test:e2e -- e2e/smoke.spec.ts --grep "TMB2 cinematic" --workers=1
```

The new request, pixel, retry, and responsive assertions passed after Tasks
1–3. A screenshot-only repeat then exposed a pre-existing concurrent image
decode stall, which received a focused failing unit regression and serial
loader repair.

- [x] **Step 3: Run focused browser tests and verify GREEN**

After Tasks 1–3 implementation:

```bash
CAPTURE_TMB2_IDENT=1 \
  npm run test:e2e -- e2e/smoke.spec.ts --grep "TMB2 cinematic" --workers=1
```

Capture the ident hold at 1440x900, 768x900, and 375x812 plus the reduced-motion
375x812 view. Record console errors, page errors, failed requests, and
horizontal overflow; all counts must be zero.

- [x] **Step 4: Inspect the images**

Use image inspection to verify:

- exact logo proportions and recognizable lettering;
- `PRODUCTIONS` centered beneath, gold, and subordinate;
- no overlap with sound controls or Start prompt;
- no crop/blur/overflow at each viewport;
- reduced-motion final ident is complete and stable.

Perform at most three evidence-driven repair cycles. Stop if the delta stops
shrinking or owner visual judgment is required.

- [x] **Step 5: Commit Task 4**

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

- [x] **Step 1: Update evidence records**

Record:

- exact source and runtime-copy hash/bytes/dimensions;
- base, mask, highlight, and productions hashes/dimensions;
- manifest asset/preload counts;
- derivation rules and deterministic builder command;
- actual tests and results;
- screenshot paths;
- known limitations and owner visual decision.

- [x] **Step 2: Run the full validation stack**

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

Actual: deterministic build, assets, pipeline, code, compile, and diff gates
passed. The monolithic Chromium command was externally terminated with exit 143
after 29 green cases at the command-session ceiling; the five unreached smoke
cases and three viewer-control cases passed in bounded continuations. All 36
executable cases passed across the recorded runs, with the capture-only case
intentionally skipped unless its evidence flag is set.

- [x] **Step 3: Review the complete diff**

Check:

- no `LOGO_GLYPHS` or procedural TMB2 drawing remains;
- no timing/input/handoff source changed without an explicit test;
- all runtime image paths are hash-bound and safe;
- no protected reward term appears in intro assets;
- no file from the unrelated production-polish checkpoint slipped in;
- generated assets match the deterministic rebuild; and
- no critical/high-severity finding remains.

- [x] **Step 4: Commit records**

```bash
git add asset-reports/tmb2-intro-assets.json \
  art-source/intro/tmb2/README.md LICENSES/ASSET_MANIFEST.md \
  TEST_REPORT.md plans/0020-tmb2-productions-ident.md
git commit -m "docs: record TMB2 Productions owner gate"
```

- [x] **Step 5: Deploy and verify**

Publish a Vercel preview from the committed tree. Verify:

- deployment status `READY`;
- HTTP 200 for the app and all five ident assets through authenticated access;
- deployed source hash matches the approved source; and
- actual preview renders the same ident as local evidence.

Deployment `dpl_3YadJHKb7X3eodXtmAHnbVS8Q3u2` reached `READY`. Authenticated
HTTP checks proved byte equality for the deployed JS/CSS runtime and all five
ident files. The protected-preview share-link connector returned 403, so local
actual-browser captures plus deployed byte equality are the recorded
equivalent; no direct protected-preview screenshot is claimed.

- [x] **Step 6: Push and open a draft PR**

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
- Browser captures:
  `preview-renders/tmb2-productions-ident/`.
- Vercel preview:
  `https://cockpit-escape-room-74mtq68zd-ottoagent007-gmailcoms-projects.vercel.app`.
- Draft PR:
  `https://github.com/otto-agent007/CockpitEscapeRoom/pull/54`.

## Outcome and handoff

The opening now renders the exact owner-approved TMB2 artwork with deterministic
blue/base/highlight layers and centered gold `PRODUCTIONS`, while preserving
the established clock, controls, reduced motion, spoiler protection, and DC-9
handoff. Asset, code, browser, deployment-byte, and responsive visual evidence
are recorded above. Draft PR #54 and the READY Vercel preview are published;
final owner visual approval of the rendered checkpoint remains open.

---

## Follow-up: 50% Productions caption

**Goal:** Apply the owner-requested 0.5 scale factor to the visible
`PRODUCTIONS` caption without changing the TMB2 logo, caption center, styling,
timing, or any other intro behavior.

**Architecture:** Keep the 320x224 transparent runtime layer and deterministic
5x7 bitmap alphabet. Halve the caption cell and tracking values from two stage
pixels to one, move its top anchor from y=164 to y=168 to preserve the prior
visual center within half a stage pixel, and regenerate the manifest-backed
asset. Prove the actual PNG alpha bounds through Pillow in the existing Node
asset-contract test.

**Files:**

- Modify: `tools/assets/intro-asset-contract.test.mjs`
- Modify: `tools/assets/build-tmb2-ident-assets.py`
- Regenerate: `public/images/intro/tmb2/logo/tmb2-productions.png`
- Regenerate: `public/images/intro/tmb2/tmb2-intro-assets.json`
- Regenerate: `preview-renders/tmb2-productions-ident/*.png`
- Modify: `asset-reports/tmb2-intro-assets.json`
- Modify: `TEST_REPORT.md`
- Modify: `docs/superpowers/specs/2026-07-26-tmb2-productions-ident-design.md`
- Modify: `plans/0020-tmb2-productions-ident.md`

### Task 6: Half-size Productions owner revision

- [ ] **Step 1: Write the failing alpha-bounds test**

In `tools/assets/intro-asset-contract.test.mjs`, execute a read-only Pillow
probe against the committed runtime caption and assert:

```js
expect(productionsAlphaBounds()).toEqual([127, 168, 193, 176])
```

The helper must invoke Python with argument-vector inputs, parse the alpha
channel bounding box as JSON, and fail clearly if Pillow or the PNG is absent.
Also retain the existing assertion that the stage image remains 320x224 RGBA.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
npm run test -- --run tools/assets/intro-asset-contract.test.mjs
```

Expected: FAIL because the current alpha bounds are `[95,164,226,179]`.

- [ ] **Step 3: Implement the minimal deterministic scale change**

In `tools/assets/build-tmb2-ident-assets.py`:

```py
PRODUCTIONS_Y = 168
PRODUCTIONS_CELL = 1
PRODUCTIONS_TRACKING = 1
```

Use those constants in `build_productions_layer()` instead of the current
two-pixel local values. Preserve `PRODUCTIONS_COLOR`,
`PRODUCTIONS_SHADOW`, the 320x224 stage, label text, centering equation, PNG
compression, and every TMB2-logo derivation.

- [ ] **Step 4: Rebuild and verify GREEN**

```bash
npm run asset:tmb2-ident
npm run test -- --run tools/assets/intro-asset-contract.test.mjs
npm run assets:check
```

Expected: alpha bounds `[127,168,193,176]`; source/base/blue/highlight hashes
unchanged; only the Productions PNG and manifest hashes change.

- [ ] **Step 5: Refresh and inspect browser evidence**

```bash
CAPTURE_TMB2_IDENT=1 \
  npm run test:e2e -- --grep "captures TMB2 Productions owner-review proof"
npm run test:e2e -- --grep \
  "opening stays spoiler-safe|blocks playback with an exact retry|holds scene poses"
```

Inspect all four `preview-renders/tmb2-productions-ident/*.png` images. Confirm
the caption is visibly half-size, centered, readable, subordinate, and clear of
controls at 1440, 768, 375, and reduced-motion 375 widths.

- [ ] **Step 6: Record, verify, commit, and update PR #54**

Update the exact Productions hash, byte size, alpha bounds, owner decision,
test output, screenshots, and remaining visual gate in the report and plan.
Then run:

```bash
npm run check
git diff --check
python3 -m py_compile tools/assets/build-tmb2-ident-assets.py
git add tools/assets/intro-asset-contract.test.mjs \
  tools/assets/build-tmb2-ident-assets.py \
  public/images/intro/tmb2/logo/tmb2-productions.png \
  public/images/intro/tmb2/tmb2-intro-assets.json \
  preview-renders/tmb2-productions-ident \
  asset-reports/tmb2-intro-assets.json TEST_REPORT.md \
  docs/superpowers/specs/2026-07-26-tmb2-productions-ident-design.md \
  plans/0020-tmb2-productions-ident.md
git commit -m "fix: reduce Productions caption"
git push
```

Check PR #54 status once after the push and do not poll.
