# Genesis-Style Game Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a skippable 53-second console-era screenshot montage that starts with the existing **Start Game** gesture, plays the owner-supplied intro audio, and hands off exactly once to the DC-9 First-Officer Final Flight Log.

**Architecture:** A focused `GameIntro` component owns the briefing, audio element, synchronized presentation clock, controls, and one-shot completion boundary. An immutable `introConfig` module owns cue content and timing, while `App.tsx` keeps the existing DC-9 transition and reducer dispatch unchanged. Playwright drives real media events and error paths; the reducer and persisted state do not change.

**Tech Stack:** React 19, TypeScript 6, Vite 8, CSS, native HTML media, Playwright 1.61, Vitest 4, GStreamer command-line audio tooling already installed on the workstation.

## Global Constraints

- Preserve the journey: briefing -> intro -> DC-9 First-Officer Final Flight Log -> locker -> Airbus A320 Pop T Captain Mode -> protected reward.
- Use only the first 53 seconds of `/mnt/2TBHDD/Downloads/IntroAudio.mp3`; do not modify that source file.
- Audio must start from the **Start Game** gesture and expose native mute, volume, skip, failure, and retry paths.
- Do not show or name the Model Y, Flight Mode, or Mars reward.
- Keep Dad framed as an expert pilot and the aircraft safely parked.
- Add no production dependency, analytics, external font, upload, or network-hosted media.
- Do not change persistence, reducer rules, cockpit GLBs, interaction contracts, locker behavior, or Airbus behavior.
- Preserve unrelated local work, especially `docs/superpowers/plans/2026-07-16-airbus-radio-thrust-target-alignment.md`.
- Treat every screenshot as replaceable placeholder art pending owner review.

---

## Prompt Contract

**Goal:** A player clicks **Start Game**, watches or skips a synchronized 53-second 16-bit-inspired montage with audio controls, and arrives at the current DC-9 chapter once.

**Context:** The approved design is `docs/superpowers/specs/2026-07-16-genesis-game-intro-design.md`. Current entry markup is in `src/App.tsx`; styling is in `src/styles.css`; spoiler-safe stills are in `public/images`; opening coverage starts at `e2e/smoke.spec.ts:89`.

**Constraints:** Use native browser media and the current React/Vite stack, preserve accessibility and reduced motion, avoid protected reward spoilers, and keep the implementation transient rather than persisted.

**Done when:** Focused red-green tests, the complete `npm run check`, `npm run assets:check`, browser flows at 375/768/1440, full-diff review, and evidence updates all pass with no high-severity finding.

## Current State and Baseline

- Branch: `agent/genesis-placeholder-intro`.
- Baseline commit: `e553deb` contains the approved design spec.
- Baseline browser command: `npm run test:e2e -- e2e/smoke.spec.ts -g "opening stays spoiler-safe"`.
- Baseline result on 2026-07-16: 1 Playwright test passed; **Start Game** currently enters the DC-9 transition immediately.
- The source MP3 exists at `/mnt/2TBHDD/Downloads/IntroAudio.mp3`, is 5,015,659 bytes, and reports MPEG Layer III, 48 kHz stereo.
- The working tree also contains an unrelated untracked Airbus plan; never stage it.

## File Map

- Create `src/game/introConfig.ts`: immutable 53-second cue data and pure cue lookup.
- Create `src/game/introConfig.test.ts`: timing, boundary, and spoiler tests.
- Create `src/components/GameIntro.tsx`: existing briefing plus synchronized intro presentation and controls.
- Modify `src/App.tsx`: replace inline briefing markup with `GameIntro`, preserving the existing DC-9 transition callback.
- Modify `src/styles.css`: 16-bit-inspired montage, responsive, focus, and reduced-motion styles.
- Modify `e2e/smoke.spec.ts`: intro launch, cues, controls, failure, completion, skip, Escape, and responsive coverage.
- Create `public/audio/intro-audio-53s.mp3`: deployable 53-second audio cut.
- Modify `public/audio/README.md`: source, trim, playback, and control record.
- Modify `LICENSES/ASSET_MANIFEST.md`: owner-supplied private audio provenance.
- Modify `TEST_REPORT.md`: commands and browser evidence actually observed.

## Task 1: Immutable Intro Timeline

**Files:**
- Create: `src/game/introConfig.test.ts`
- Create: `src/game/introConfig.ts`

**Interfaces:**
- Produces: `INTRO_DURATION_SECONDS: 53`, `IntroCue`, `introCues`, and `getIntroCue(timeSeconds: number): IntroCue`.
- Consumes: no DOM, React, storage, or media APIs.

- [x] **Step 1: Write the failing timeline tests**

Create tests that demand exact cue starts, boundary selection, and spoiler safety:

```ts
import { describe, expect, it } from 'vitest'
import { INTRO_DURATION_SECONDS, getIntroCue, introCues } from './introConfig'

describe('intro timeline', () => {
  it('defines the approved 53-second cue sequence', () => {
    expect(INTRO_DURATION_SECONDS).toBe(53)
    expect(introCues.map((cue) => cue.startSeconds)).toEqual([0, 4, 16, 27, 38, 49])
    expect(introCues.map((cue) => cue.id)).toEqual(['boot', 'dc9', 'key', 'hat', 'airbus', 'title'])
  })

  it('selects cues at their exact boundaries', () => {
    expect(getIntroCue(0).id).toBe('boot')
    expect(getIntroCue(15.999).id).toBe('dc9')
    expect(getIntroCue(16).id).toBe('key')
    expect(getIntroCue(52.999).id).toBe('title')
  })

  it('contains no protected reward spoiler', () => {
    expect(JSON.stringify(introCues)).not.toMatch(/tesla|model y|flight mode|mars/i)
  })
})
```

- [x] **Step 2: Run the test and verify RED**

Run: `npm run test -- src/game/introConfig.test.ts`

Expected: FAIL because `./introConfig` does not exist.

- [x] **Step 3: Implement the minimal pure configuration**

Define `IntroCue` with `id`, `startSeconds`, `image`, `caption`, `treatment`, and `objectPosition`. Use the approved six cues, these image paths, and exact copy:

```ts
export const INTRO_DURATION_SECONDS = 53

export const introCues = [
  { id: 'boot', startSeconds: 0, image: null, caption: 'A FAMILY CREW PRODUCTION', treatment: 'boot', objectPosition: 'center' },
  { id: 'dc9', startSeconds: 4, image: 'images/dc9-game-ready-first-officer.png', caption: 'THE FINAL FLIGHT LOG', treatment: 'push', objectPosition: '74% center' },
  { id: 'key', startSeconds: 16, image: 'images/captains-key-celebration.png', caption: 'LEGACY UNLOCKED', treatment: 'wipe', objectPosition: 'center' },
  { id: 'hat', startSeconds: 27, image: 'images/captains-hat-celebration.png', caption: 'THE JOURNEY CONTINUES', treatment: 'poster', objectPosition: 'center' },
  { id: 'airbus', startSeconds: 38, image: 'images/a320-game-ready-captain.png', caption: 'FROM FIRST OFFICER TO CAPTAIN', treatment: 'panel', objectPosition: 'center' },
  { id: 'title', startSeconds: 49, image: null, caption: 'MISSION READY', treatment: 'title', objectPosition: 'center' },
] as const satisfies readonly IntroCue[]
```

Implement `getIntroCue` by clamping invalid/negative time to zero and walking backward from the final cue until `timeSeconds >= startSeconds`.

- [x] **Step 4: Run focused and nearby tests and verify GREEN**

Run: `npm run test -- src/game/introConfig.test.ts src/game/state.test.ts`

Expected: both test files pass.

- [x] **Step 5: Generate the local audio prerequisite**

Before browser work, generate `public/audio/intro-audio-53s.mp3` with the bounded GStreamer pipeline documented in Task 4 and verify its duration is within `52.9..53.1` seconds. Leave it uncommitted until its provenance and final audio test are complete in Task 4.

- [x] **Step 6: Update Progress and commit Task 1**

Stage only `plans/0015-genesis-game-intro.md`, `src/game/introConfig.ts`, and `src/game/introConfig.test.ts`.

Commit: `feat: define game intro timeline`

## Task 2: Intro Launch, Media Clock, and One-Shot Handoff

**Files:**
- Modify: `e2e/smoke.spec.ts:89-110`
- Create: `src/components/GameIntro.tsx`
- Modify: `src/App.tsx:1-8,489-521`
- Modify: `src/styles.css:20-180,1940-2040,2271-2290`

**Interfaces:**
- Consumes: `GameIntro({ reducedMotion: boolean, onComplete: () => void })`, `introCues`, `getIntroCue`, `INTRO_DURATION_SECONDS`, `gameCopy.title`.
- Produces: an unchanged briefing state followed by `section[aria-label="Game intro"]`, `data-intro-cue`, native audio controls, and exactly one `onComplete()` call.

- [x] **Step 1: Change the opening browser test to require the intro**

After clicking **Start Game**, assert the intro is visible and the DC-9 heading is not yet mounted. Then click **Skip Intro** and retain the existing transition/DC-9 assertions:

```ts
await page.getByRole('button', { name: 'Start Game' }).click()
const intro = page.getByRole('region', { name: 'Game intro' })
await expect(intro).toHaveAttribute('data-intro-cue', 'boot')
await expect(intro.getByText('A FAMILY CREW PRODUCTION')).toBeVisible()
await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toHaveCount(0)
await intro.getByRole('button', { name: 'Skip Intro' }).click()
```

- [x] **Step 2: Run the opening test and verify RED**

Run: `npm run test:e2e -- e2e/smoke.spec.ts -g "opening stays spoiler-safe"`

Expected: FAIL because clicking **Start Game** still begins the DC-9 transition directly and no `Game intro` region exists.

- [x] **Step 3: Implement `GameIntro` and integrate it**

`GameIntro` must keep its `<audio>` mounted on the briefing so `audio.play()` is called synchronously in the **Start Game** handler. Use `requestAnimationFrame`, `audio.currentTime`, `performance.now()`, and a `completedRef` guard. Its public shape is:

```ts
interface GameIntroProps {
  reducedMotion: boolean
  onComplete: () => void
}

export function GameIntro({ reducedMotion, onComplete }: GameIntroProps) { /* ... */ }
```

Render the current `.briefing-hero` markup unchanged before launch. During playback render a full-screen region with `data-intro-cue={cue.id}`, an optional decorative image, the cue caption, `CockpitEscapeRoom` on the final card, **Skip Intro**, a mute button, a labeled range input, and a polite sound-status region. Pause audio and invoke `onComplete` once on skip, Escape, `ended`, or timeline position `>= 53`.

In `App.tsx`, replace the inline briefing section with:

```tsx
<GameIntro reducedMotion={reducedMotion} onComplete={() => setDc9EntryStage('fade-out')} />
```

Keep `Dc9EntryTransition`, the existing preloading effect, and the `START` dispatch timing unchanged.

- [x] **Step 4: Implement the approved visual system**

Add `--intro-*` colors, a true-black full-bleed canvas, pixel-grid background, scanline overlay, hard-edged frame, stepped image scale, wipe/panel treatments, title shadow, and bottom control rail. Use existing local/system fonts only. At `max-width: 900px`, stack controls and reduce title scale. Under `prefers-reduced-motion: reduce`, disable stepped scale, scanline movement, and wipes while retaining crossfades.

- [x] **Step 5: Run the opening browser test and verify GREEN**

Run: `npm run test:e2e -- e2e/smoke.spec.ts -g "opening stays spoiler-safe"`

Expected: PASS; the test observes intro launch before the existing DC-9 transition.

- [x] **Step 6: Update Progress and commit Task 2**

Stage only the plan, `GameIntro.tsx`, `App.tsx`, `styles.css`, and `smoke.spec.ts`.

Commit: `feat: add synchronized game intro shell`

## Task 3: Audio Failure, Cue Boundaries, Controls, and Responsive Paths

**Files:**
- Modify: `e2e/smoke.spec.ts`
- Modify: `src/components/GameIntro.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: the Task 2 DOM contract.
- Produces: deterministic test hooks through native `HTMLMediaElement` events and `data-intro-cue`; no production-only query parameter.

- [x] **Step 1: Add failing browser tests for the remaining behavior**

Add focused tests that:

1. Set `audio.currentTime` to `16`, `27`, `38`, and `49`, dispatch `timeupdate`, and assert `key`, `hat`, `airbus`, and `title` cue IDs and captions.
2. Dispatch `ended` and assert the existing DC-9 transition appears once.
3. Press Escape and assert the intro skips.
4. Set mute and volume and assert `audio.muted === true` and `audio.volume === 0.35`.
5. Override `HTMLMediaElement.prototype.play` with a rejected promise before load, assert `The intro is continuing without sound.`, **Retry sound**, and a working skip path.
6. Emulate reduced motion and assert the intro has `data-reduced-motion="true"`.
7. At 375x812, 768x900, and 1440x900, assert the intro region and control rail fit inside the viewport without horizontal overflow.
8. Load `audio/intro-audio-53s.mp3`, wait for `loadedmetadata`, and assert `duration` is between `52.9` and `53.1` with `networkState !== HTMLMediaElement.NETWORK_NO_SOURCE`.

- [x] **Step 2: Run the new intro tests and verify RED**

Run: `npm run test:e2e -- e2e/smoke.spec.ts -g "game intro|opening stays spoiler-safe"`

Expected: at least the cue, audio failure/retry, or control assertion fails until Task 3 behavior is complete.

- [x] **Step 3: Implement minimal behavior to satisfy the tests**

Add a `timeupdate` listener/handler that updates the visible cue immediately in addition to the rAF loop. On playback rejection, retain the original `performance.now()` start, show the live-region message, and reveal **Retry sound**. Retry must set `audio.currentTime` to the current fallback elapsed time before calling `play()`, then return cue authority to media time. Clamp volume to `0..1` and keep mute independent from volume.

Use a one-shot completion function guarded by `completedRef`. Remove the global Escape listener during cleanup, cancel the current animation frame, and pause audio on unmount.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `npm run test:e2e -- e2e/smoke.spec.ts -g "game intro|opening stays spoiler-safe"`

Expected: every selected Playwright test passes with no browser error.

- [x] **Step 5: Update Progress and commit Task 3**

Commit: `test: cover game intro controls and fallbacks`

## Task 4: Generate and Record the 53-Second Audio Asset

**Files:**
- Create: `public/audio/intro-audio-53s.mp3`
- Modify: `public/audio/README.md`
- Modify: `LICENSES/ASSET_MANIFEST.md`

**Interfaces:**
- Consumes: `/mnt/2TBHDD/Downloads/IntroAudio.mp3`.
- Produces: browser-decodable 48 kHz stereo MP3 at the exact component URL `audio/intro-audio-53s.mp3`.

- [x] **Step 1: Record the immutable source hash**

Run: `sha256sum /mnt/2TBHDD/Downloads/IntroAudio.mp3`

Record the hash and byte count in `public/audio/README.md`.

- [x] **Step 2: Confirm or regenerate the cut without modifying the source**

Use the installed GStreamer decoder and LAME encoder through an accurate bounded seek. The pipeline is paused before setting the `0..53 seconds` segment, then played through EOS so the output is finalized cleanly:

```bash
INTRO_OUTPUT=/mnt/2TBHDD/CockpitEscapeRoom/public/audio/intro-audio-53s.mp3 python3 - <<'PY'
import os
import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst
Gst.init(None)
source = '/mnt/2TBHDD/Downloads/IntroAudio.mp3'
target = os.environ['INTRO_OUTPUT']
pipeline = Gst.parse_launch(
    f'filesrc location="{source}" ! decodebin ! audioconvert ! audioresample '
    f'! audio/x-raw,rate=48000,channels=2 ! lamemp3enc target=bitrate bitrate=192 cbr=true '
    f'! id3v2mux ! filesink location="{target}"'
)
pipeline.set_state(Gst.State.PAUSED)
pipeline.get_state(Gst.CLOCK_TIME_NONE)
flags = Gst.SeekFlags.FLUSH | Gst.SeekFlags.ACCURATE
if not pipeline.seek(1.0, Gst.Format.TIME, flags, Gst.SeekType.SET, 0, Gst.SeekType.SET, 53 * Gst.SECOND):
    raise SystemExit('bounded seek failed')
pipeline.set_state(Gst.State.PLAYING)
message = pipeline.get_bus().timed_pop_filtered(
    Gst.CLOCK_TIME_NONE, Gst.MessageType.ERROR | Gst.MessageType.EOS
)
if message.type == Gst.MessageType.ERROR:
    error, debug = message.parse_error()
    raise SystemExit(f'{error}: {debug}')
pipeline.set_state(Gst.State.NULL)
PY
```

If the Task 1 prerequisite already produced an in-tolerance file, retain it. Do not use a wall-clock timeout or `identity eos-after`; the installed GStreamer 1.24.2 build did not honor that EOS property during measured decoding.

- [x] **Step 3: Verify the output boundary**

Run:

```bash
file public/audio/intro-audio-53s.mp3
stat -c '%n | %s bytes' public/audio/intro-audio-53s.mp3
sha256sum public/audio/intro-audio-53s.mp3
gst-discoverer-1.0 public/audio/intro-audio-53s.mp3 | rg 'Duration|audio/mpeg|rate|channels'
```

Expected: MPEG Layer III audio, nonzero bytes, a stable SHA-256 hash, 48 kHz stereo, and duration between `0:00:52.900000000` and `0:00:53.100000000`. The Task 3 browser metadata test independently verifies browser decoding and `networkState`.

- [x] **Step 4: Document provenance and controls**

Update `public/audio/README.md` with source path/hash, output hash, trim duration, GStreamer pipeline, and playback constraints. Add an owner-supplied intro-audio row to `LICENSES/ASSET_MANIFEST.md` stating private CockpitEscapeRoom use and first-53-second modification.

- [x] **Step 5: Run the opening audio browser test**

Run: `npm run test:e2e -- e2e/smoke.spec.ts -g "deployable 53-second audio"`

Expected: PASS with duration in tolerance and `networkState !== HTMLMediaElement.NETWORK_NO_SOURCE`.

- [x] **Step 6: Update Progress and commit Task 4**

Commit: `assets: add trimmed game intro audio`

## Task 5: Full Browser Gate, Review, and Evidence

**Files:**
- Modify: `plans/0015-genesis-game-intro.md`
- Modify: `TEST_REPORT.md`
- Create: `preview-renders/genesis-game-intro/*.png`

**Interfaces:**
- Consumes: the complete intro implementation.
- Produces: durable validation and owner-review evidence.

- [x] **Step 1: Run focused automated checks**

Run:

```bash
npm run test -- src/game/introConfig.test.ts src/game/state.test.ts
npm run test:e2e -- e2e/smoke.spec.ts -g "game intro|opening stays spoiler-safe"
```

Expected: zero failures.

- [x] **Step 2: Run complete repository gates**

Run:

```bash
npm run check
npm run assets:check
git diff --check
```

Expected: every command exits 0.

- [x] **Step 3: Launch and inspect in a real browser**

Start `npm run dev -- --host 127.0.0.1`, then use `agent-browser` to verify the page has content, no Vite error overlay, the **Start Game** control renders, and the intro launches. Inspect boot, DC-9, key, hat, Airbus, and title beats; normal audio, mute/volume, skip, Escape, natural completion, rejected audio, retry, reload, and reduced-motion paths.

- [x] **Step 4: Capture responsive evidence**

Capture the intro at approximately 375x812, 768x900, and 1440x900 under `preview-renders/genesis-game-intro/`. Use `view_image` to inspect each capture for cue copy, title scale, image crop, palette, scanlines, control overlap, focus visibility, and horizontal overflow.

- [x] **Step 5: Review the complete diff**

Review against the approved spec. Reject duplicate completion dispatch, early `START`, autoplay before gesture, hidden controls, unsafe DOM insertion, spoiler text/images, unnecessary dependencies, media source drift, or staged unrelated files. Run the React best-practices checklist because `App.tsx` and `GameIntro.tsx` both change.

- [x] **Step 6: Record evidence and remaining delta**

Update `TEST_REPORT.md` and this plan with actual commands, results, screenshot paths, source/output hashes, placeholder status, and any genuine owner-review limitation.

- [x] **Step 7: Run fresh final verification and commit**

Re-run `npm run check`, focused intro Playwright tests, `npm run assets:check`, `git diff --check`, and `git status --short`. Commit only the milestone files with `docs: record game intro verification`.

## Validation Matrix

| Path | Expected observable result |
| --- | --- |
| Start Game | Audio play is invoked synchronously and boot cue appears; game state remains briefing |
| Cue boundaries | Cues switch at 4, 16, 27, 38, and 49 seconds |
| Natural completion | At 53 seconds or media `ended`, DC-9 entry begins once |
| Skip button | Pauses audio and begins DC-9 entry once |
| Escape | Skips when intro is active |
| Mute/volume | Native media properties change and controls remain keyboard reachable |
| Audio rejection | Silent monotonic clock, live status, retry, and skip remain available |
| Retry | Audio seeks to fallback elapsed time and resumes cue authority |
| Reduced motion | Static framing/crossfades, no rapid wipe/scanline animation, same content and audio |
| Reload before START | Returns to unchanged briefing; no progress was persisted |
| 375/768/1440 | No clipped caption, overlapping controls, or horizontal overflow |
| Spoiler audit | No Model Y, Flight Mode, Mars text, imagery, or file reference |

## Repair Loop and Stop Conditions

For each failure, capture the exact command/browser evidence, identify one root cause, apply the smallest repair, rerun the failed check plus the nearest regression check, and update Progress/Discoveries. Stop only when all acceptance checks pass, three focused repair attempts fail to shrink the same delta, or an owner-only visual/music decision is required.

## Progress

- [x] 2026-07-16 — Approved design spec committed as `e553deb`.
- [x] 2026-07-16 — Current opening reproduced in Playwright; baseline opening test passed before implementation.
- [x] Task 1 — Immutable intro timeline.
- [x] Task 2 — Intro launch, media clock, and one-shot handoff.
- [x] Task 3 — Audio failure, cue boundaries, controls, and responsive paths.
- [x] Task 4 — Trimmed audio asset and provenance.
- [x] Task 5 — Full browser gate, review, and evidence.

## Discoveries

- `ffprobe` is not installed; GStreamer, `lamemp3enc`, and `id3v2mux` are available.
- GStreamer 1.24.2 decodes the source into 24 ms raw-audio buffers, but `identity eos-after` did not emit EOS even at a three-buffer probe. An accurate pipeline seek with a 53-second stop produced a finalized 53.040-second MP3, within one MPEG frame of the requested boundary.
- The first six-test Task 3 run proved all production behaviors were already present from the coherent Task 2 component; its only failure was a Playwright-runner scope error from referencing `HTMLMediaElement.NETWORK_NO_SOURCE` outside the browser. Returning that constant from `locator.evaluate` fixed the test itself; the rerun passed all six intro tests.
- The first complete 25-case Playwright run passed 24/25 and stopped the complete-journey case on the new intro. The journey test still encoded the old immediate Start Game -> DC-9 boundary. Adding the same **Skip Intro** action a player uses made the focused case pass; a fresh full rerun passed 25/25 in 5.0 minutes.
- `agent-browser` required the host-safe `--no-sandbox` flag. Its headless audio output rejected playback, which correctly exposed the designed silent fallback. Exact visual cue capture used a visual-only successful `play()` promise; repository Playwright independently proved real media decoding and playback behavior.
- The current opening browser test takes roughly 40 seconds including its production build and real DC-9 asset request.
- The approved public stills already cover the DC-9, Captain's Key, Captain's Hat, and Airbus beats without exposing the protected reward.

## Decision Log

- 2026-07-16 — Keep the existing briefing as the gesture surface and insert the intro before the reducer `START` action. This preserves preload behavior and avoids persistence changes.
- 2026-07-16 — Use a data-driven cue timeline synchronized to media time with a monotonic silent fallback. CSS-only timers can drift during buffering; a rendered video is harder to revise.
- 2026-07-16 — Use the first 53 seconds as a separate deployable audio file and preserve the Downloads source unchanged.
- 2026-07-16 — Execute inline because the user directly requested implementation and did not request subagent delegation.

## Evidence

- `npm run test -- src/game/introConfig.test.ts src/game/state.test.ts` — 43/43 passed.
- `npm run test:e2e -- e2e/smoke.spec.ts -g "game intro|opening stays spoiler-safe"` — 6/6 passed.
- `npm run check` — ESLint, TypeScript, 66/66 Vitest tests, and production build passed.
- `npm run assets:check` — exit 0 with existing imported-model notices.
- `npm run test:e2e -- --workers=1` — fresh final run passed 25/25 in 5.0 minutes.
- Source MP3 SHA-256: `0c1864eb97762841b64c57229c07e70eb620724a02a53ddb69a7465a9eac704f`.
- Runtime MP3 SHA-256: `be635257cce2ebb3e7e327cada37e09b4a3b4c292e5e385f280955a1d2843507`; duration `53.040` seconds.
- Inspected captures: `preview-renders/genesis-game-intro/{boot-1440,dc9-1440,key-1440,hat-768,hat-reduced-motion-768,airbus-375,title-1440}.png`.
- Actual-browser URL: `http://127.0.0.1:5173/`; meaningful content, no Vite overlay, no page errors, intro-to-DC-9 path verified. Existing Three.js `Clock` deprecation warning remains unrelated.

## Outcome and Handoff

Implementation and local verification are complete. The placeholder intro plays the first 53 seconds of the supplied track, exposes accessible sound/skip controls and fallback behavior, respects reduced motion, and hands off once to the unchanged DC-9 chapter. The remaining external delta is owner review of the placeholder cue art/music and, if requested, a Vercel preview; no final-art approval is claimed.
