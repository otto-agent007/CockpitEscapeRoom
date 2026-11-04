# Arcade sound auditions

## Purpose and current state

The owner wants to hear candidates before finalizing fighter gameplay audio. Combat emits hit, block, projectile, guard-crush, round and KO/time-over events, but has no audio player. Existing `introSfxPlayer.ts` demonstrates local Web Audio synthesis.

## Scope and constraints

This is an explicitly requested audition spike. The first round supplied three original synthesized sets. Following owner feedback, the second round uses recorded CC0 punch/swish layers, two fighting-focused mixes, individual character specials and optional recorded announcer candidates. Keep every candidate editable and separate from production audio. Preserve all existing uncommitted Moonbase/name/tribute work and unrelated `:memory:.ses`. No combat integration, final selection, paid service, new production dependency or publication. Use the existing local dev server and an isolated browser profile for listening.

## First-pass directions, not accepted

- A, Classic arcade: short chip tones and crunchy noise transients.
- B, Punchy arcade: warmer weight and short impact cracks; proposed starting choice, not owner selection.
- C, Orbital energy: electronic impacts, glassy shields and energy zaps.

The owner can select a pack or mix cues after listening. Synthesized round/KO stings stand in for announcements; no spoken announcer is implied.

## Steps and acceptance

- [x] Inspect current branch, audio patterns and gameplay boundaries.
- [x] Generate reproducible 48 kHz mono WAV candidates under `art-source/audio/arcade-candidates-2026-11-03/`, with generator and provenance/measurements.
- [x] Provide a local audition page with demo and individual effect buttons, shared native player, volume and Stop; one sound at a time.
- [x] Verify all WAVs decode, contain signal without clipping, and actually advance during native playback. Exercise keyboard, Stop, quick switching and phone/tablet/desktop layout; inspect screenshots. This spike needs no product unit tests or full app rebuild.
- [x] Open visible listening page and preserve candidates.
- [x] Owner selected Heavy hitters and explicitly authorized announcer/character specials on 2026-11-04. Selected integration is tracked separately in plan 0077.

## Repair loop and evidence

Correct at most three evidence-led audition issues before stopping for a product decision. Browser plugin unavailable; use installed Playwright/Chromium. Record measured output and actual playback evidence, without claiming subjective listening approval. No source WAV is a production asset until owner selection. Update this plan and `TEST_REPORT.md` with the listening handoff.

Validation: generation produced 21 cues and three demos, totaling 3,174,816 bytes. All 24 PCM files have matching manifest hashes, non-silent signal and no clipped samples; peak levels range from −8.57 to −2.85 dBFS. Browser checks decoded all 24 and played every individual cue; keyboard demo activation, completed B demo, Stop, fast candidate switching and silent reload pass. At 375/768/1440 every demo remains reachable with no horizontal overflow and a visible native player/Stop. Inspected screenshots are `/tmp/arcade-sound-candidates-{375,768,1440}.png`; `/tmp/arcade-sound-candidates-browser.json` records actual playback and layout proof. No relevant console/page error occurred. Production checks were not rerun because this is a separate audition spike without runtime changes.

Visible owner audition is open at `http://127.0.0.1:5418/art-source/audio/arcade-candidates-2026-11-03/index.html`. Candidate B was started by native click, advancing at 0.23 seconds, unpaused/unmuted at 55% volume. The isolated profile leaves prior review windows and saved game progress alone. `/tmp/arcade-sound-candidates-owner.json` records the handoff. No subjective approval or final choice is claimed; wait for the owner before gameplay integration.

## Revision 2 — fighting-game direction, 2026-11-04

The owner found the first sets too generic and said to remember this is a fighting game. The new spike changes the source material, rather than merely adjusting oscillator pitches: actual recorded punches, thwacks and air swings underpin contact/guard/miss cues. Preserve the first set as unselected history. Compare **Arcade snap** against **Heavy hitters**, with three jab takes, two heavy/kick/block takes, distinct misses, guard breaks and knockdowns. Four shared signature candidates match the laser, cap throw, flyby and text burst. Recorded “Round one,” “Fight!”, “You win!” and “Combo!” are optional audition choices; no voiced KO is supplied.

Primary artist pages/embedded license files confirm CC0 for Independent.nu/qubodup's punches, AntumDeluge's thwacks, artisticdude's swishes and Kenney's fighter announcer. The Kenney website download returned its HTML page, so the archive was retrieved from Kenney's original OpenGameArt upload. The punch archive is 7z, unpacked read-only through the installed libarchive; no dependency was installed. Only selected original audio/license files were retained. Author/page/archive/source hashes are recorded in `art-source/audio/arcade-fight-candidates-v2-2026-11-03/sources.json` and README. The generated edits and original synthesized signature layers are reproducible with its `generate.py`.

Validation passes: 35 candidate WAVs, 4,274,702 bytes; 23 preserved source files, 688,749 bytes. Header/signal/hash checks pass without clipping; maximum peak is −1.94 dBFS. Production app source is unchanged by this audition. All 35 WAVs decode; 32 individual takes play, both combo demos start via keyboard, a full combo ends normally, signature reel/Stop work and reload stays silent. Inspected 375/768/1440 layouts have no horizontal overflow and keep the native player/Stop visible. No page/console errors. Actual browser proof and screenshots are `/tmp/arcade-fight-v2-*`; `TEST_REPORT.md` and the source README record the handoff.

Current visible review is the revision-2 URL on port 5418. Arcade snap was started once by native click, advancing at 0.23 seconds unmuted at volume 0.55, in a separate profile. Owner listening feedback is pending; nothing is finalized or wired to gameplay.

## Owner selection and handoff — 2026-11-04

The owner said **“Heavy hitters is the one I like better”**, then **“go ahead and use the announcer and character specials too.”** This selects the Heavy hitters impacts and all four signatures/announcer clips for local gameplay integration. Earlier pending-selection notes above describe the audition handoffs, not the current decision. `SELECTION.json` preserves exact selected hashes and statements; plan 0077 now owns runtime work and proof. Both unselected directions remain source history. Publication and merge were not requested.
