# Selected fighting-game audio

Owner decision: **Heavy hitters**, followed by explicit authorization of the announcer and all character specials. Original statements and exact source/runtime hashes are in `art-source/audio/arcade-fight-candidates-v2-2026-11-03/SELECTION.json`.

## Source and runtime contract

Twenty 48 kHz mono/16-bit WAVs, **1,147,322 bytes**, are copied unchanged to `public/audio/mars-arcade-v1/`: three jabs, two heavy punches, two low-kick impacts, two blocks, one miss, one guard break, one knockdown, four signatures and four announcer clips. Audition demo mixes and unselected sets are excluded. Source → runtime → production-build bytes/hashes match for all twenty; source files and generator remain recoverable. Runtime `CREDITS.txt` includes authors, CC0 licensing and edits.

Recorded layers: Independent.nu/qubodup punches, AntumDeluge thwacks, artisticdude swishes, Kenney fighter announcer. Canonical pages, original filenames, archive/source hashes and included CC0 license text are preserved in `sources.json` and `sources/` beside the audition generator. Edits: trim, resample/pitch, EQ, contact/body/air layers, dynamics and endpoint fades. Signatures add original synthesis; the flyby is synthesized engine/air. No paid API, new production dependency, cloned voice or analytics.

## Playback and controls

`marsArcadeSfx.ts` maps pure combat events to clips; `MarsArcadeSfxPlayer` owns Web Audio and bounded overlap. The rules emit one `moveActive` cue at the first active frame of an accepted move, preserving state/tuning. Real connects select impacts, guarding selects block, a miss supplies air, and a special plays once rather than once per rendered frame or cap projectile. Light/heavy/kick/block variants rotate deterministically. Three landed hits by one side within 60 combat frames of each other earn one Combo call; blocks, gaps and terminal outcomes break the streak. Human wins get a delayed victory line; CPU wins and draws do not.

Native Start unlocks sound. Sound on/off and volume persist separately from game progress/Moonbase. Pause, mute, selection, return, page hiding and disposal stop nodes and invalidate pending playback. Stale downloads do not replay old impacts, and announcer generations prevent old calls replacing newer ones. Eight-node bound and a dynamics compressor control overlap. Missing/blocked/unavailable audio preserves all combat and exposes retry. The development art/tuning harness remains silent.

## Validation

Full app check passes lint/types, **1,060 unit tests in 96 files**, and build. The first timing regressions failed before the new rule cue; strict event-list expectations now include the cue while retaining hit/block/damage/timing/KO assertions. Unit checks cover catch-up/freeze/denied meter, all actual accepted specials, contact/miss/block/break, human-versus-CPU victory calls, streak behavior and denied/corrupt preferences.

Initial affected browser run passed 36/39, including all four new audio cases; three legacy tests expected fighter IDs in visible renamed readouts. After correcting names, one phone shortcut entry failed without a trace establishing its natural cause. The exact phone case passed three repeats, and a controlled delayed-timer case reproduced the helper's early key release. Successful-entry helpers now retain keys until the real arcade opens; negative short-hold/modifier/blur/focus/visibility cases are unchanged. The final production run passes **40/40 in 3.0 minutes**, including that delayed-timer regression. `npm run assets:check`, spoiler/privacy/budget/diff checks also pass. Exact logs and coverage are recorded in plan 0077 and `TEST_REPORT.md`.

Budget after audio: **188.1/190 MB total**, **573/600 KB initial**. Initial download is unchanged; selected WAVs preload only after earned arcade entry. Independent full-diff review finds no blocking audio issue and confirms all selected bytes. Browser plugin unavailable; installed Playwright/Chromium 1243 used. Current browser logs and responsive captures are `/tmp/arcade-selected-audio-*`. No other-browser, complete-journey or hosted/deployment claim is made.

The visible real arcade is open on port 5419, Moonbase selected, sound on at 55%, with all twenty sounds loaded. Press **Start fight** to play from the native sound gesture. An isolated profile preserves other user windows/progress. Local integration only; PR publication and merge remain unrequested.

The owner played the integrated version and said **“Worked goo for me, good job!”** on 2026-11-04. This is scoped approval of the in-game sounds, in addition to the earlier candidate selection.
