# Roboptimus personal greeting and hangar reveal

## Purpose and current state

After Airbus completion, Roboptimus greets the player close to the camera farther outside the hangar, walks to its closed doors, and dances while they open onto darkness. The scene fades into the automatically playing Model FLY film, followed by the existing family tribute. The owner approved preparing the PR on 2026-11-03; this supersedes the earlier publication hold and dance-after-film candidate.

## Scope and constraints

Keep CockpitEscapeRoom, protected reward gating, chapter progress, native keyboard controls, the approved movie and original source assets. Keep rules/content under `src/game`, presentation under `src/scenes`, and accessible progression under `src/components`. Add no production dependency or paid API. Blender-generated exports retain stable hierarchy and `game_id` contracts. PR creation does not authorize merge or final release.

## Final design and decisions

- Personal greeting: authored planted feet, gentle nod, open-palm welcome and invitation toward the hangar, then settle before walking. The imported wave is absent from the runtime GLB. She says **“Congratulations! You did it! Your pilot skills have earned you something special. Let's go check it out!”** using the existing locally generated Heart voice. Sound starts on each entry; mute and manual playback remain available.
- Normal loading: neutral background at lazy-module and asset boundaries. Robot and hangar load together. Canvas is transparent until its first complete draw, then fades in over 180 ms; reduced motion removes the transition. Audio waits for actual readiness rather than a forced four-second timeout. Native Reveal can proceed during slow loading.
- Escort: greeting completion or Reveal starts an 8.5-second walk to closed doors; a five-second dance accompanies door opening onto a dark interior; a 1.2-second fade enters the film. Skip to film remains available. Accessible/reduced-motion and unavailable scenes can enter the film directly.
- Film: request fullscreen from the native reveal gesture; attempt audible autoplay on entry/retry/replay, retry muted if the browser refuses sound, retain Play if muted playback is also refused, and offer sound-on without restarting. Native pause/skip/retry/replay and the family tribute remain available.
- Assets: authored master `art-source/blender/roboptimus_personal_greeting.blend` preserves the original source and 31 actions. One current guide GLB contains the authored greeting and byte-preserved original walk/dance. The hangar derivative contains only the environment and sliding doors, with no vehicle. Historical sources/exports and review evidence remain recoverable.

## Progress

- [x] Inspect source, game state, asset clips, current branch and prior review.
- [x] Export selected hangar through Blender; cut the painted facade doorway and retain attributed source.
- [x] Implement and inspect greeting/escort/door dance/dark fade in the actual browser.
- [x] Author and inspect the personal greeting; preserve mesh/skin/walk/dance data.
- [x] Regenerate exact selected voice line offline; verify default sound and native completion.
- [x] Repair robot-only loading flash; prove independent module/robot/hangar delays and initial Canvas visibility.
- [x] Owner authorizes PR preparation.
- [x] Complete final PR review/checks, including unavailable-WebGL recovery and the corrected escort timing expectation.
- [ ] Open the PR against main; record hosted preview/check status.

## Validation and acceptance

Done when the final sequence, sound/defaults, complete-scene loading, reduced motion, keyboard, reload, missing media/assets and early reveal all preserve earned progress, and the automatically playing film reaches the existing tribute/replay path. Actual browser views at 375/768/1440 must be inspected; asset bytes must match build output and remain within existing budgets.

Latest completed check: `npm run check` passes lint/types, 1,048 tests in 95 files and build. The built game passed 13/13 focused browser cases after the loading correction. Root-cause regression failed before repair and passed afterward. Current screenshots are in `/tmp/roboptimus-scene-ready-proof/`; earlier evidence under `preview-renders/roboptimus-hangar-2026-11-03/` describes dated candidates. The visible review receipt `/tmp/roboptimus-scene-ready-owner-review.json` records advancing unmuted greeting audio, no page errors and no autoplay-policy override. Final publication checks are recorded in `TEST_REPORT.md`: all 31 affected production cases verified across a 30/31 run plus the corrected case passing 1/1; fresh full app check, asset validation, 6/6 pipeline evals and unchanged budgets pass. Independent review reports no remaining major issue.

## Discoveries and review history

The original facade painted a closed door, so door transforms alone did not expose a real opening; a scoped Blender cut fixed it. A historical Vite omission dropped the former greeting/walk GLB, so the single combined guide now ships in place of both full-body exports. The stock wave was incongruent with the personal scene, so a six-second planted greeting was authored without changing the body or original walking/dancing motion. Robot-only PNGs at two loading boundaries caused the initial flash; both boundaries now stay neutral. R3F Canvas fallback children are not renderer-error recovery, so native controls need a boundary outside the scene if renderer initialization fails. Detailed historical results and exact source/runtime hashes remain in the asset reports and test report.

## Remaining delta

Publish the reviewed branch and PR, inspect hosted build/CI status, and leave merge/final complete-game release review with the owner. No new personalization placeholders.
