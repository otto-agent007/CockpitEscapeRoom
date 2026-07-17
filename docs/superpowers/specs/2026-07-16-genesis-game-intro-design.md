# Genesis-Style Game Intro Design

## Goal

Add a skippable 53-second, console-era opening montage between the existing **Start Game** gesture and the DC-9 First-Officer Final Flight Log. The placeholder should make the beginning feel energetic and personal now, while keeping its screenshots, captions, and timing easy to replace as final artwork and sound effects arrive.

## Context

- The current briefing screen in `src/App.tsx` is the first player-visible surface. Its **Start Game** button begins the existing fade into the safely parked DC-9-32 right-seat chapter.
- The owner-supplied source track is `/mnt/2TBHDD/Downloads/IntroAudio.mp3`. The source is approximately 2 minutes 40 seconds; this milestone uses only its first 53 seconds.
- Existing spoiler-safe stills include the DC-9 first-officer cockpit, Captain's Key, Captain's Hat, and Airbus A320 captain cockpit under `public/images/`.
- Production audio must start after a player gesture and must provide mute and volume controls, as required by `public/audio/README.md`.
- The protected Model Y reward must not appear in the intro.

## Player Sequence

The existing briefing screen remains the entry surface. Pressing **Start Game** synchronously starts the intro audio and replaces the briefing with a full-screen montage. The intro does not advance or persist game progress while it plays.

The placeholder timeline is:

| Time | Visual beat | Editable placeholder copy |
| --- | --- | --- |
| 0-4 seconds | Dark pixel-grid boot card and stepped title reveal | `A FAMILY CREW PRODUCTION` |
| 4-16 seconds | DC-9 first-officer cockpit with restrained stepped push-in | `THE FINAL FLIGHT LOG` |
| 16-27 seconds | Captain's Key art with a pixel wipe and warm highlight | `LEGACY UNLOCKED` |
| 27-38 seconds | Captain's Hat art with a limited-color arcade treatment | `THE JOURNEY CONTINUES` |
| 38-49 seconds | Airbus A320 captain cockpit with a horizontal panel wipe | `FROM FIRST OFFICER TO CAPTAIN` |
| 49-53 seconds | CockpitEscapeRoom title lockup on black | `MISSION READY` |

At 53 seconds, the montage fades to black and invokes the existing DC-9 loading/fade handoff. Pressing **Skip Intro** or Escape performs the same handoff immediately. Completion is idempotent so an audio `ended` event, timer boundary, or repeated skip action cannot enter the chapter twice.

The styling evokes a 16-bit console opening through hard-edged masks, low-resolution decorative layers, stepped zooms, scanlines, limited-color overlays, pixel-like text shadows, and brief title cards. It does not copy a SEGA logo, trademarked boot animation, game character, or proprietary typeface.

## Audio

The Downloads source remains untouched. Implementation creates a separate deployable asset at `public/audio/intro-audio-53s.mp3` containing only the first 53 seconds. The trim should occur on a valid MP3 frame boundary and the resulting duration and browser decodability must be verified before use.

Audio begins only inside the **Start Game** click handler. The intro exposes a clearly labeled mute toggle and volume slider throughout playback. The selected volume is transient for this placeholder and does not require a persistence migration.

If playback is rejected or decoding fails, the visual timeline continues from a monotonic browser clock, an accessible status message explains that the intro is continuing without sound, and a **Retry sound** control is available. Retrying sets the audio to the current fallback-timeline position before playback, then returns cue authority to `audio.currentTime` when playback succeeds. Intro completion remains available regardless of audio state.

## Architecture

- `src/components/GameIntro.tsx` owns the existing briefing markup, the synchronous player gesture, the `<audio>` element, playback controls, visual cue selection, keyboard behavior, and one-shot `onComplete` callback.
- `src/game/introConfig.ts` owns the ordered cue times, image paths, captions, and visual treatment identifiers. Content can therefore change without rewriting playback logic.
- `src/App.tsx` supplies reduced-motion state and connects `GameIntro.onComplete` to the existing DC-9 entry transition. The reducer is not changed because intro playback is transient presentation before the `START` action.
- `src/styles.css` owns the full-screen montage, responsive composition, scanline/pixel treatments, focus states, and reduced-motion overrides.
- `public/audio/intro-audio-53s.mp3` is the deployable audio cut. The longer source file remains outside the repository.
- `e2e/smoke.spec.ts` covers the opening-to-intro-to-DC-9 boundary and prevents regressions in the established chapter order.

The montage clock follows `audio.currentTime` while audio is healthy so visual cues stay synchronized even after buffering or a temporary stall. A `requestAnimationFrame` loop updates the active cue without creating a React timer for every animation frame. When audio is unavailable, the component uses elapsed `performance.now()` time from the original Start Game gesture.

## Accessibility and Responsive Behavior

- **Skip Intro**, mute, volume, and retry controls are native HTML controls with visible focus treatment and clear accessible names.
- Escape skips the intro unless focus is inside an interactive form control where the keystroke has another expected meaning.
- A polite live region reports sound failure and the handoff into the game. Decorative stills use empty alternative text; the changing title text carries the montage meaning without repeatedly announcing image descriptions.
- Reduced-motion mode removes stepped zooms, rapid wipes, and scanline movement. It keeps the same 53-second audio and cue order using static framing and restrained crossfades, while **Skip Intro** remains immediately available.
- At approximately 375, 768, and 1440 CSS pixels, captions and controls remain inside the viewport, the image crop retains its subject, and the skip/audio controls do not overlap the title cards.

## Constraints

- Preserve the established journey: briefing -> intro -> DC-9 First-Officer Final Flight Log -> locker -> Airbus A320 Pop T Captain Mode -> protected reward.
- Keep Dad framed as an expert pilot and every aircraft safely parked for a commemorative legacy experience.
- Do not show or name the Model Y, Flight Mode, or Mars reward.
- Do not change game state, persistence schema, cockpit GLBs, interaction contracts, locker behavior, or Airbus behavior.
- Add no production dependency, analytics, upload, external font, or network-hosted media.
- Keep the current screenshots explicitly replaceable placeholders; this milestone does not claim final intro artwork approval.
- Preserve unrelated local work, including any untracked plans or in-progress visual milestones.

## Validation

- Verify the generated MP3 is browser-decodable, no longer than 53 seconds beyond normal MP3 frame tolerance, and does not modify the Downloads source.
- Add browser assertions that **Start Game** synchronously calls audio playback, shows the first montage beat, and does not dispatch `START` early.
- Drive audio time forward in the browser test and assert the configured DC-9, key, hat, Airbus, and final title cues appear at their boundaries.
- Assert natural completion, **Skip Intro**, and Escape each enter the DC-9 exactly once.
- Reject audio playback in a browser test and assert the silent timeline, status message, retry control, and skip path remain usable.
- Assert mute and volume controls update the media element and remain keyboard accessible.
- Exercise reduced motion and inspect captures near 375, 768, and 1440 CSS pixels.
- Confirm the intro contains no Model Y, Flight Mode, or Mars text or imagery.
- Run focused Playwright coverage, `npm run check`, `npm run assets:check`, and `git diff --check`; then inspect the complete diff for duplicate transition logic, inaccessible controls, unsafe DOM insertion, and unrelated changes.
- Update the living ExecPlan and `TEST_REPORT.md` with commands actually run, browser evidence, placeholder status, and remaining owner-review needs.

## Done When

- The existing **Start Game** gesture launches a polished placeholder montage with the first 53 seconds of the supplied audio.
- The montage visibly follows the approved six-beat timeline and ends or skips cleanly into the existing DC-9 chapter without changing progress rules.
- Audio starts only after the gesture and exposes functional mute, volume, failure, and retry behavior.
- Keyboard, reduced-motion, silent-fallback, natural-completion, repeated-completion, and responsive paths pass their relevant checks.
- No protected reward spoiler, production dependency, persistence change, generated cockpit change, or unrelated worktree content is introduced.
- The result is explicitly labeled as placeholder intro art pending the owner's final assets and visual approval.
