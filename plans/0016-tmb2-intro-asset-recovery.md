# TMB2 Intro Asset Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve every usable recovered TMB2 source in CockpitEscapeRoom, build and validate a new canonical runtime package, and ship the blonde-haired Pop T chase as the skippable 53-second game intro.

**Architecture:** CockpitEscapeRoom owns immutable recovered sources under `art-source/intro/tmb2`, generated scene plates under the same source group, hash-bound runtime files under `public/images/intro/tmb2`, and a tracked asset report. GameDevStuff at pinned commit `22722eabc8f09a706013305a0911a9d322ca9f4f` processes sprites without becoming a runtime dependency; ImageGen creates only four missing storyboard scene plates. A pure intro configuration drives layered React presentation while the existing media clock and one-shot DC-9 handoff remain unchanged.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4, Playwright 1.61, Node.js 24 built-ins, ImageMagick, built-in ImageGen, and GameDevStuff's pixel-sprite pipeline.

## Global Constraints

- Preserve the journey: briefing -> intro -> DC-9 First-Officer Final Flight Log -> locker -> Airbus A320 Pop T Captain Mode -> protected reward.
- Treat `/mnt/2TBHDD/Downloads/pilot Pop T with golden blond hair and blue eyes.png` as the authoritative creative source.
- Do not imitate the lost 104-file count or invent former filenames.
- Do not show or name the Model Y, Flight Mode, Mars reward, or later protected surprises.
- Do not change persistence, reducer rules, cockpit GLBs, interaction contracts, locker behavior, or Airbus behavior.
- Add no production dependency, analytics, tracking, account, upload, external font, or network-hosted runtime media.
- Preserve the existing 53.040-second audio, mute, volume, retry, skip, Escape, silent fallback, reduced-motion behavior, and one-shot DC-9 handoff.
- Do not commit the full-length owner-supplied MP3 or the reference MP4; record their hashes and exclusion reasons.
- CockpitEscapeRoom must own every source and runtime asset needed by the shipped intro.
- Completion requires a pushed remote commit, matching remote hashes, and restoration from a clean checkout.

---

## Prompt Contract

**Goal:** A player presses **Start Game**, watches or skips the blonde-haired Pop T chase, and enters the DC-9 First-Officer Final Flight Log exactly once.

**Context:** The approved design is `docs/superpowers/specs/2026-07-20-tmb2-intro-asset-recovery-design.md`. The placeholder implementation is `src/components/GameIntro.tsx`, `src/game/introConfig.ts`, and the `.game-intro*` rules in `src/styles.css`. The recovered set is in `/mnt/2TBHDD/Downloads` and includes 20 newly downloaded PNGs, two storyboard composites, one Pop T runtime ZIP, the tracked source audio, and a 53-second timing reference MP4.

**Constraints:** Use recovered art before generation, use ImageGen only for the missing duffel/ballpark/finance/sky plates, use pinned GameDevStuff tooling for sprite processing, keep all required controls native HTML, preserve responsive and reduced-motion fallbacks, and leave protected rewards undisclosed.

**Done when:** Source/runtime manifests validate, the complete intro works in the actual browser, required checks pass, evidence is recorded, the branch is pushed, and a clean checkout restores identical hashes without Downloads or temporary caches.

## Current State

- Branch: `agent/genesis-placeholder-intro`.
- Approved design commit: `1479580`.
- Existing placeholder intro completion commit: `af8afcf`.
- Working tree was clean immediately before this plan.
- Former temporary commit `c039ce1` and former ZIP SHA-256 `c93c42567d0dfcb6ce6cceb74ea4705dcdf05b35842fdcc3cf0ad6738613a157` are evidence only and are not recoverable from GitHub.
- Recovered Pop T ZIP: 70,814 bytes, SHA-256 `a1c16a73da1462c1ca980fe7c4f60ce341519a097098979a2a058428094acc0e`.
- Reference MP4: 7,299,283 bytes, SHA-256 `2bf496258a8c2d597c9d2de63bc4c9a63419d7e284ea9256754e881fe5d28b7e`.
- Full source MP3: 5,015,659 bytes, SHA-256 `0c1864eb97762841b64c57229c07e70eb620724a02a53ddb69a7465a9eac704f`.
- Duplicate new downloads: `04_42_52 PM (10)` equals `04_51_23 PM`; `04_42_52 PM (5)` equals `04_51_41 PM`.

## File Map

- Create `art-source/intro/tmb2/README.md`: source authority, recovery inventory, exclusions, and GameDevStuff pin.
- Create `art-source/intro/tmb2/recovered/**`: byte-identical storyboards, key/runway PNGs, and Pop T ZIP plus extracted contents.
- Create `art-source/intro/tmb2/generated/backgrounds/**`: selected ImageGen source plates.
- Create `art-source/intro/tmb2/pipeline/key-profile.yaml`: explicit GameDevStuff background, sizing, pivot, and palette configuration.
- Create `tools/assets/intro-asset-contract.mjs`: hash, PNG metadata, manifest, duplicate, and spoiler validation.
- Create `tools/assets/intro-asset-contract.test.mjs`: focused contract tests.
- Create `tools/assets/check-intro-assets.mjs`: validate the committed canonical package.
- Modify `vitest.config.ts`: discover focused Node-side asset contract tests under `tools/**/*.test.mjs`.
- Modify `package.json`: include intro validation in `assets:check` without a production dependency.
- Create `asset-reports/tmb2-intro-assets.json`: source provenance, tool version, generation prompts, exclusions, validation, and package evidence.
- Create `public/images/intro/tmb2/tmb2-intro-assets.json`: browser package contract and preload list.
- Create `public/images/intro/tmb2/contact-sheet.png`: runtime review sheet.
- Create `public/images/intro/tmb2/backgrounds/**`: four generated scene plates plus recovered runway plate.
- Create `public/images/intro/tmb2/key/**`: normalized key frames, sheets, previews, and metadata.
- Create `public/images/intro/tmb2/popt/**`: extracted validated Pop T runtime clips.
- Modify `src/game/introConfig.ts`: eight-beat chase configuration and layered asset references.
- Modify `src/game/introConfig.test.ts`: exact timing, preload, fallback, and spoiler tests.
- Modify `src/components/GameIntro.tsx`: layered scene renderer while preserving media/control logic.
- Modify `src/styles.css`: parallax/sprite motion, responsive layout, and reduced-motion static framing.
- Modify `e2e/smoke.spec.ts`: chase cues, visual asset requests, fallback, controls, completion, and viewport coverage.
- Modify `LICENSES/ASSET_MANIFEST.md`, `TEST_REPORT.md`, and this ExecPlan: provenance and actual evidence.
- Create `preview-renders/tmb2-intro-recovery/**`: fixed browser approval captures.

## Task 1: Canonical Intro Asset Contract

**Files:**
- Create: `tools/assets/intro-asset-contract.mjs`
- Create: `tools/assets/intro-asset-contract.test.mjs`
- Create: `tools/assets/check-intro-assets.mjs`
- Modify: `package.json`
- Modify: `vitest.config.ts`

**Interfaces:**
- Produces `sha256File(path): string`, `pngMetadata(path): { width: number; height: number; hasAlpha: boolean }`, and `validateIntroManifest(manifest, root): string[]`.
- `check-intro-assets.mjs` exits nonzero when any source/runtime path, hash, dimension, duplicate target, preload path, or spoiler rule fails.
- `npm run assets:check` runs the existing GLB gate and the new intro gate.

- [x] **Step 1: Write the failing validator tests**

Create table-driven Vitest cases that construct temporary fixtures and require missing-file, hash, dimension, duplicate, preload, and spoiler failures:

```js
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sha256File, validateIntroManifest } from './intro-asset-contract.mjs'

describe('TMB2 intro asset contract', () => {
  const roots = []
  afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))

  it('rejects a runtime hash mismatch and protected reward preload', () => {
    const root = mkdtempSync(join(tmpdir(), 'tmb2-contract-'))
    roots.push(root)
    writeFileSync(join(root, 'frame.png'), Buffer.from('frame'))
    const manifest = {
      schemaVersion: 1,
      assets: [{ id: 'key-idle', path: 'frame.png', sha256: '0'.repeat(64), bytes: 5 }],
      duplicates: [],
      preload: ['images/model-y.png'],
    }
    expect(validateIntroManifest(manifest, root)).toEqual(expect.arrayContaining([
      expect.stringContaining('hash mismatch'),
      expect.stringContaining('protected reward'),
    ]))
    expect(sha256File(join(root, 'frame.png'))).toHaveLength(64)
  })
})
```

- [x] **Step 2: Run the validator test and verify RED**

Run: `npm run test -- tools/assets/intro-asset-contract.test.mjs`

Expected: FAIL because `intro-asset-contract.mjs` does not exist.

- [x] **Step 3: Implement the minimal validator**

Use Node `crypto`, `fs`, and PNG signature/IHDR/color-type bytes. Require schema version 1, unique asset IDs and paths, lowercase 64-character SHA-256 values, exact byte counts, exact PNG dimensions when declared, alpha when `hasAlpha: true`, valid duplicate targets, preload paths present in `assets`, and a case-insensitive `/tesla|model[- ]?y|flight mode|mars/` exclusion across IDs and paths.

- [x] **Step 4: Add the repository gate**

`check-intro-assets.mjs` loads `public/images/intro/tmb2/tmb2-intro-assets.json`, calls `validateIntroManifest`, prints every error, and exits 1 on failure. Change the script to:

```json
"assets:check": "node tools/assets/check-models.mjs && node tools/assets/check-intro-assets.mjs"
```

Before Task 2 creates the manifest, the gate must fail with `Missing TMB2 intro manifest`.

- [x] **Step 5: Run focused tests and verify GREEN for fixtures**

Run: `npm run test -- tools/assets/intro-asset-contract.test.mjs`

Expected: all contract fixture tests pass.

- [x] **Step 6: Commit the contract checkpoint**

```bash
git add package.json tools/assets/intro-asset-contract.mjs tools/assets/intro-asset-contract.test.mjs tools/assets/check-intro-assets.mjs plans/0016-tmb2-intro-asset-recovery.md
git commit -m "test: define TMB2 intro asset contract"
```

## Task 2: Preserve and Normalize Recovered Sources

**Files:**
- Create: `art-source/intro/tmb2/README.md`
- Create: `art-source/intro/tmb2/recovered/**`
- Create: `art-source/intro/tmb2/pipeline/key-profile.yaml`
- Create: `asset-reports/tmb2-intro-assets.json`
- Create: `public/images/intro/tmb2/{key,popt,backgrounds}/**`
- Create: `public/images/intro/tmb2/tmb2-intro-assets.json`

**Interfaces:**
- Consumes the recovered Downloads files and GameDevStuff commit `22722eabc8f09a706013305a0911a9d322ca9f4f`.
- Produces a runtime manifest that passes Task 1 and stable paths used by Task 4.

- [x] **Step 1: Copy byte-identical source inputs**

Preserve both storyboard PNGs, the Pop T ZIP, every one of the 20 new PNG downloads, and the ZIP's extracted tree. Do not modify the Downloads files. Use dated directories from the File Map and verify copied hashes against the source before continuing.

- [x] **Step 2: Record the exact source inventory**

Write `asset-reports/tmb2-intro-assets.json` with `schemaVersion`, `authoritativeStoryboard`, `secondaryStoryboard`, `recoveredSources`, `excludedReferences`, `duplicates`, `tooling`, `generatedAssets`, and `validation` fields. Record the MP4 and full MP3 hashes above as excluded references, not committed assets.

- [x] **Step 3: Extract and validate the Pop T archive**

Run `unzip -t` on the committed ZIP, extract it beside the archive, and verify its `animation-contract-export.json` names exactly these six clips: `duffel-pull`, `startle-stumble`, `baseball-slide`, `bull-spin`, `pilot-glide`, and `victory-recovery`. Copy runtime PNG/WebP/JSON files to `public/images/intro/tmb2/popt/` without altering bytes.

- [x] **Step 4: Pin and prepare GameDevStuff**

Clone GameDevStuff into ignored `.cache/tools/GameDevStuff`, detach at the pinned commit, run `npm ci --omit=dev` inside `skills/pixel-sprite-animation-pipeline`, run its tests, and record the commit plus test result. Never consume mutable `main` after the detach.

- [x] **Step 5: Inspect and normalize the 18 unique cartoon-key/runway files**

Use the explicit profile:

```yaml
canonical: { width: 128, height: 128 }
generation: { width: 1024, height: 1024 }
runtime: { width: 256, height: 256 }
pivot: { x: 64, y: 112 }
palette: { mode: preserve-anchor }
background:
  mode: configured
  color: { r: 5, g: 248, b: 9, a: 255 }
  tolerance: 45
foreground: { retentionPolicy: all, minimumComponentPixels: 1 }
snapper: { executable: spritefusion-pixel-snapper, args: ['16'] }
correction: { generativeAttempts: 2, skillProposalEvidence: 3 }
```

Run `inspect` on every source, then `prepare`, `snap`, `normalize`, and `export` on coherent key pose groups. Preserve one global integer scale and shared pivot. Stop if objective validation returns nonzero or chroma remains visible; do not handwave a failed pipeline result.

- [x] **Step 6: Promote the recovered runway plate**

Copy the unique 1672x941 runway PNG to `public/images/intro/tmb2/backgrounds/runway-night.png`. Preserve its source hash and record that it is the only recovered standalone environment.

- [x] **Step 7: Build the initial runtime manifest and contact sheet**

List every runtime asset with real hash, byte count, dimensions, alpha state, role, scene, and source relationship. Include preload entries only for shipped intro files. Build a contact sheet with ImageMagick using nearest-neighbor treatment for sprites.

- [x] **Step 8: Verify the source/runtime gate and commit**

Run:

```bash
npm run test -- tools/assets/intro-asset-contract.test.mjs
npm run assets:check
git diff --check
```

Expected: the canonical source and runtime manifest pass; existing GLB notices remain non-fatal.

Commit message: `assets: preserve recovered TMB2 intro sources`.

## Task 3: Generate Missing Storyboard Scene Plates

**Files:**
- Create: `art-source/intro/tmb2/generated/backgrounds/{duffel-terminal,ballpark-night,finance-city,cloud-chase}-v1.png`
- Create: `public/images/intro/tmb2/backgrounds/{duffel-terminal,ballpark-night,finance-city,cloud-chase}.png`
- Modify: `asset-reports/tmb2-intro-assets.json`
- Modify: `public/images/intro/tmb2/tmb2-intro-assets.json`
- Modify: `public/images/intro/tmb2/contact-sheet.png`

**Interfaces:**
- Consumes the authoritative storyboard as a reference image.
- Produces four character-free, key-free, text-free 16:10 scene plates.

- [x] **Step 1: Write four production prompts before generation**

Each prompt uses taxonomy `illustration-story`, identifies the output as a TMB2 browser-game background, names the authoritative storyboard as the style/composition reference, requests wide 16:10 framing, and repeats: no Pop T, no cartoon key, no text, no logo, no watermark, no UI, no Tesla/Model Y/Flight Mode/Mars imagery.

- [x] **Step 2: Generate one scene plate per ImageGen call**

Generate duffel terminal, ballpark night, finance city/Charging Bull, and cloud chase separately. Do not use one composite sheet as a substitute for four independent runtime assets.

- [x] **Step 3: Inspect and select non-destructively**

Inspect full-resolution outputs for subject placement, coherent pixel-illustration style, clean responsive crop zones, absence of baked characters/text, and consistency with the authoritative storyboard. Save selected sources with versioned filenames; retain no rejected output as a runtime file.

- [x] **Step 4: Create runtime copies and update manifests**

Create web-sized PNGs without changing aspect ratio, record exact generation prompts and hashes, refresh the contact sheet, and ensure all four paths are preloaded.

- [x] **Step 5: Verify and commit generated art**

Run `npm run assets:check` and `git diff --check`. Visually inspect the contact sheet before committing `assets: add TMB2 storyboard scene plates`.

## Task 4: Data-Driven Chase Timeline

**Files:**
- Modify: `src/game/introConfig.test.ts`
- Modify: `src/game/introConfig.ts`

**Interfaces:**
- Produces `IntroCue` records with `id`, `startSeconds`, `background`, `caption`, `treatment`, `poptClip`, `keyClip`, `fallbackImage`, and `objectPosition`.
- Preserves `INTRO_DURATION_SECONDS` and `getIntroCue(timeSeconds)`.

- [ ] **Step 1: Replace the timeline assertions and verify RED**

Require starts `[0, 4, 11, 19, 27, 35, 43, 49]`, IDs `['boot','duffel','runway','ballpark','finance','clouds','catch','title']`, all runtime background paths, all Pop T clip references, preload coverage, no duplicate paths, and spoiler exclusion.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test -- src/game/introConfig.test.ts`

Expected: FAIL because the existing six placeholder cues remain.

- [ ] **Step 3: Implement the eight approved cues**

Use captions `TMB2`, `THE OVERSIZED DUFFEL`, `RUNWAY CHASE`, `BALLPARK DETOUR`, `BULL MARKET LAUNCH`, `CLOUD CHASE`, `THE CATCH`, and `MISSION READY`. Reference only manifest-backed paths under `images/intro/tmb2/`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm run test -- src/game/introConfig.test.ts tools/assets/intro-asset-contract.test.mjs`

Expected: all timeline and contract tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat: define TMB2 chase intro timeline`.

## Task 5: Layered Browser Intro

**Files:**
- Modify: `e2e/smoke.spec.ts`
- Modify: `src/components/GameIntro.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes the Task 4 cue contract.
- Produces DOM layers `.game-intro__background`, `.game-intro__popt`, `.game-intro__key`, and `.game-intro__prop` with `data-clip` attributes for browser assertions.

- [ ] **Step 1: Write failing browser assertions**

At cue boundaries 4, 11, 19, 27, 35, 43, and 49 seconds, assert the expected cue ID, caption, background request/path, Pop T clip, key layer, and accessible story summary. Assert that all images resolve with `naturalWidth > 0`.

- [ ] **Step 2: Run the focused browser test and verify RED**

Run: `npm run test:e2e -- e2e/smoke.spec.ts -g "game intro follows media cue boundaries"`

Expected: FAIL because the placeholder renderer has one image layer and old cue IDs.

- [ ] **Step 3: Implement the minimal layered renderer**

Render decorative layers with empty alt text and `aria-hidden`, keep the cue caption and a visually hidden `cue.summary` as the semantic equivalent, and preserve every existing audio/control callback unchanged. Use keyed cue containers so clip changes restart only presentation animation, not the media clock.

- [ ] **Step 4: Implement responsive motion**

Use CSS transforms and stepped keyframes for layered movement. Do not animate layout properties. At reduced motion, show static approved frame/scene composition, hide nonessential travel, and retain the same captions and controls.

- [ ] **Step 5: Run focused browser coverage and repair**

Run:

```bash
npm run test:e2e -- e2e/smoke.spec.ts -g "game intro|opening stays spoiler-safe"
npm run test -- src/game/introConfig.test.ts tools/assets/intro-asset-contract.test.mjs
```

Expected: intro launch, boundaries, controls, failure/retry, reduced motion, responsive bounds, audio duration, skip, Escape, and DC-9 handoff pass.

- [ ] **Step 6: Commit**

Commit message: `feat: render the Pop T intro chase`.

## Task 6: Full Verification, Evidence, and Remote Persistence

**Files:**
- Modify: `LICENSES/ASSET_MANIFEST.md`
- Modify: `TEST_REPORT.md`
- Modify: `plans/0016-tmb2-intro-asset-recovery.md`
- Create: `preview-renders/tmb2-intro-recovery/**`

**Interfaces:**
- Produces the owner visual gate, full local verification record, pushed branch, and clean-checkout proof.

- [ ] **Step 1: Run the complete local gate**

Run, stopping at the first failure:

```bash
npm run check
npm run assets:check
npm run test:e2e -- --workers=1
git diff --check
```

- [ ] **Step 2: Exercise the actual browser**

Verify natural completion, Skip Intro, Escape, repeated completion, audio rejection/retry, mute, volume, keyboard-only controls, reload before Start Game, reduced motion, and viewport widths 375, 768, and 1440. Record console and network errors.

- [ ] **Step 3: Capture the approval proof set**

Capture consistent images for boot, duffel, runway, ballpark, finance, clouds, catch, title, reduced motion, and narrow width under `preview-renders/tmb2-intro-recovery/`.

- [ ] **Step 4: Review the complete diff**

Check for protected reward leakage, unmanifested binaries, duplicate runtime files, missing accessible equivalents, unsafe HTML, altered progress rules, new dependencies, temporary/cache paths, and unrelated work. Resolve all critical/high findings.

- [ ] **Step 5: Record evidence and commit**

Update source/license provenance, actual commands/results, screenshot paths, known visual deviations, tool commit, package counts, and final hashes. Commit message: `docs: record TMB2 intro recovery evidence`.

- [ ] **Step 6: Push and verify remote bytes**

Push the feature branch. Fetch the remote commit, verify it equals local HEAD, and compare the remote tree/blob identities for the source vault, manifests, runtime package, and reports.

- [ ] **Step 7: Prove clean-checkout restoration**

Create a temporary clean checkout from the pushed remote commit, run `npm ci`, `npm run assets:check`, focused intro tests, and a production build. Confirm no command reads Downloads, `.cache`, or a temporary GameDevStuff checkout for shipped bytes.

- [ ] **Step 8: Open or update the draft PR and hand off the visual gate**

Publish the complete milestone, include the asset/package hashes and proof screenshots, check CI once, and stop for owner visual approval rather than merging.

## Progress

- [x] 2026-07-20 — Recovery evidence, Downloads inventory, GameDevStuff PR #7/#8 boundaries, and lost-package facts verified.
- [x] 2026-07-20 — Design approved and committed as `1479580`.
- [x] Task 1 — Canonical intro asset contract (70/70 unit tests passed).
- [x] Task 2 — Recovered source preservation and sprite normalization (65 runtime assets; source/runtime gate passed).
- [x] Task 3 — Four missing storyboard scene plates (69 runtime assets; 8 preloads).
- [ ] Task 4 — Data-driven chase timeline.
- [ ] Task 5 — Layered browser intro.
- [ ] Task 6 — Full verification, evidence, remote persistence, and owner gate.

## Discoveries

- The 20 new PNG downloads contain 18 unique images: 17 cartoon-key poses and one airport/runway plate.
- The generated green backgrounds are not exact `#00ff00`; dominant values cluster around `#05f809`, so cleanup requires configured-key tolerance and validation rather than exact-color deletion.
- The recovered Pop T ZIP already contains six transparent runtime clips plus per-clip PNG frames, sprite sheets, WebP previews, JSON metadata, and an aggregate animation contract.
- GameDevStuff main at `22722eabc8f09a706013305a0911a9d322ca9f4f` contains 33 pipeline scripts and 29 tests. The shipped product must not depend on its mutable branch state.
- Vitest originally discovered only `src/**/*.test.ts`; the first Task 1 command correctly failed with no matching test files. Adding `tools/**/*.test.mjs` to the existing Node test environment exposed the intended RED failure (`intro-asset-contract.mjs` missing), after which 4/4 contract tests passed.
- The workstation default `umask 0002` creates group-writable pipeline state that GameDevStuff intentionally rejects. Running its suite and stateful commands under `umask 0077` produced 357 passing tests, 0 failures, and 1 platform skip.
- A tolerance of 18 left background-edge noise in four recovered key plates. Raising the configured tolerance to 45 removed the noise without clipping the subjects; all 17 unique key poses then inspected as one foreground component.
- GameDevStuff's pinned managed standalone `snap` path currently supplies a null manifest hash to signed-receipt validation. The recovery used the tool's manual-handoff path plus the installed hash-verified Pixel Snapper binary with explicit argv, then returned to `prepare`, `normalize`, and `export`; the pinned checkout was not modified.
- ImageGen returned four 1586x992 plates, an effectively 16:10 composition. All four passed full-resolution inspection for clear sprite space, responsive crop safety, forbidden-character/text absence, and visual consistency, so the runtime copies retain the selected source bytes without a destructive crop or resample.

## Decision Log

- 2026-07-20 — Create a new evidence-derived canonical package; do not force the unrecoverable 104-file count.
- 2026-07-20 — Use the blonde-haired Pop T storyboard as creative authority.
- 2026-07-20 — Keep GameDevStuff as pinned build tooling and CockpitEscapeRoom as durable asset authority.
- 2026-07-20 — Use ImageGen only for four missing scene plates; retain recovered sprites and runway art.
- 2026-07-20 — Execute inline and sequentially because the user requested work and did not request delegation.
- 2026-07-20 — Preserve all 17 unique normalized key poses as a reusable runtime library even though the initial intro may display only a subset.
- 2026-07-20 — Keep the selected ImageGen source and runtime plates byte-identical at 1586x992; browser `object-fit` supplies responsive framing without baking separate destructive crops.

## Validation Plan

The acceptance stack is contract/unit RED-GREEN, recovered-source hash validation, GameDevStuff objective validation, ImageGen visual inspection, focused Playwright, full `npm run check`, full `npm run assets:check`, full single-worker Playwright, actual-browser viewport/accessibility exercise, full-diff review, remote hash verification, and clean-checkout restoration.

## Repair Loop and Stop Conditions

At each failure, capture the exact command and output, identify one root cause, apply the smallest coherent repair, rerun the failed check plus its nearest regression check, update Progress/Discoveries/Evidence, and continue. Stop only when all checks pass, three focused attempts fail to shrink the same delta, or a genuine owner visual decision is required.

## Evidence

- `umask 0077 && npm test` in pinned GameDevStuff pipeline: 357 passed, 0 failed, 1 skipped.
- Pinned Pixel Snapper: `spritefusion-pixel-snapper 1.0.0`, SHA-256 `bd03110406efc2efc0b094c0442a2265cb44f935a3f418fc30fdc20e77eb3f96`.
- Key processing: 17 unique source poses inspected, snapped, normalized to 128x128 at pivot 64,112, and exported to 256x256 runtime frames; every normalized source had exactly one retained foreground component.
- `npm run test -- --run tools/assets/intro-asset-contract.test.mjs`: 4 passed.
- `npm run assets:check`: passed, including `TMB2 intro asset contract passed (64 assets, 4 preloads)` before the final contact sheet; existing GLB notices remained non-fatal.
- `node tools/assets/check-intro-assets.mjs` after adding the contact sheet: passed with 65 assets and 4 preloads.
- `git diff --check`: passed at the Task 2 checkpoint.
- Four ImageGen calls produced and preserved duffel terminal, ballpark night, finance city, and cloud chase plates; full-resolution visual inspection found no Pop T, cartoon key, readable text, protected reward, or unsafe emergency framing.
- `node tools/assets/check-intro-assets.mjs` after generated-art integration: passed with 69 assets and 8 preloads.
- `public/images/intro/tmb2/contact-sheet.png` was visually reviewed with all five environments, all 17 key poses, and all six recovered Pop T clips represented.

## Outcome and Handoff

This section will state the final package counts, hashes, behavior, remote restoration proof, remaining placeholders, and owner approval status after Task 6. Until then, this plan is active and the intro recovery milestone is not complete.
