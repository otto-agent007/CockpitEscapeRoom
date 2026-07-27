# Legacy Hangar Visibility and Replay Repair

## Purpose

Make the protected Model Y reward readable as a premium showroom reveal, give
the Flight Mode wings and stabilizers a red finish that belongs with the car,
and make Replay visibly run the Blender-authored transformation again.

## Prompt contract

**Goal:** The player can clearly see the red Model Y and red Flight Mode
surfaces in the Legacy Hangar, and Replay returns the authored scene to its
stowed opening before ending in the deployed pose again.

**Context:** The current 1440 browser proof is too dark even without its HTML
overlay. The desktop runtime uses direct lights without a reflective showroom
environment, the full-screen text scrim darkens part of the vehicle, and the
Blender flight panels use a blue-grey material. Replay resets the React clock,
but the clamped Three.js `AnimationAction` remains paused after its first final
frame; reproduced browser evidence showed clip time `11.500` with
`data-reward-pose="stowed"` after replay.

**Constraints:** Preserve schema v8, spoiler protection, the source vehicle
texture and geometry, the stable Model Y node/camera/extras contract, the exact
11.5-second animation, reduced-motion static presentation, accessible fallback,
material/geometry budgets, and the dark premium hangar identity. Add no
production dependency or external HDR.

**Done when:** Deterministic asset checks prove red wing/stabilizer surfaces,
browser Replay proves stowed-to-deployed motion on a second run, the approved
1440 screenshot makes the car and plate immediately readable, narrow proofs
remain coherent, and the relevant asset/app/browser checks pass.

## Current state and defect ledger

- Judged screenshot:
  `preview-renders/model-y-reward/1440-flight-mode-final.png`.
- Visible defects: the body reads mostly as a black silhouette, desktop wings
  read blue-black, and Replay finishes without redeploying the visible kit.
- Likely causes: missing environment reflections in the R3F runtime, an overly
  broad overlay scrim, the blue-grey authored panel material, and a clamped
  animation action that is never reset.
- First variables: protect Replay with a failing browser test; then change the
  authored panel finish; then add showroom environment fill before adjusting
  direct-light intensity.
- Tier-1 proof:
  `/tmp/legacy-hangar-showroom-1440.png` and
  `/tmp/legacy-hangar-replay-final-1440.png`.

## Scope

Included: deterministic Tesla material changes, owner-selected Sketchfab
hangar intake and integration, deployable asset regeneration, desktop showroom
lighting, reward scrim tuning, Replay action reset, reduced-motion Replay
cleanup, focused tests, browser proof, reports, and the final preview after
owner approval.

Excluded: vehicle/camera/geometry changes, animation retiming, prior chapter
changes, Mars, new audio, new dependencies, and unrelated cleanup.

## Progress

- [x] 2026-07-27 — Created
  `agent/legacy-hangar-visibility-replay` from refreshed `origin/main`.
- [x] 2026-07-27 — Confirmed a clean baseline with 122/122 Vitest tests passing.
- [x] 2026-07-27 — Added failing Replay, red-surface, and selected-hangar
  provenance/runtime contracts.
- [x] 2026-07-27 — Repaired Replay action reset and removed the inert
  reduced-motion Replay control.
- [x] 2026-07-27 — Rebuilt red Flight Mode surfaces, added premium showroom
  lighting, and replaced the procedural room with the owner-selected hangar
  scaled around the vehicle as its interior shell.
- [x] 2026-07-27 — Captured the fresh 1440/768/375 actual-browser owner proof;
  focused Replay evidence passed 1/1.
- [x] 2026-07-27 — Removed both owner-rejected decorative floor guide meshes,
  rebuilt the asset, and captured clean-floor Blender and browser proof.
- [x] 2026-07-27 — Owner approved the selected hangar composition and requested
  PR publication.
- [x] 2026-07-27 — Completed broad validation and resolved all three Important
  independent-review findings; no Critical or High findings were reported.
- [x] 2026-07-27 — Published commit `ef4f758` and opened draft PR
  [#56](https://github.com/otto-agent007/CockpitEscapeRoom/pull/56).

## Discoveries

- The existing reward E2E test checks React clip time after Replay but does not
  verify that the Blender-authored pose deploys again.
- Three.js `AnimationAction.reset()` clears the paused state set by
  `clampWhenFinished`; `AnimationMixer.setTime()` alone does not.
- The Blender portrait final render is substantially brighter than the desktop
  runtime, confirming that the deployable geometry is present and runtime
  lighting is the primary desktop visibility boundary.
- The selected Sketchfab source is a complete closed Quonset exterior, not an
  authored showroom interior. At 17 m wide the curved wall occluded the
  diagonal game camera; scaling the intact shell to 24 m wide encloses the
  desktop and narrow camera family without cutting source geometry.
- The 8,276,403-byte source archive contains seven base-color-only materials.
  Deterministic UV remapping into one 2048 atlas preserves the full
  9,640-triangle shell while reducing the combined reward to six materials and
  20 draw calls after the owner-rejected floor guides were removed.

## Decision log

- 2026-07-27 — Use premium showroom lighting with a procedural Three.js
  `RoomEnvironment`/PMREM; keep the background dark and add no external HDR.
- 2026-07-27 — Finish wing and stabilizer panels in controlled metallic red;
  retain dark fan housings, rotors, hinges, and concealed mechanisms.
- 2026-07-27 — Preserve reduced-motion as a static final pose and hide its inert
  Replay control.
- 2026-07-27 — Preserve the camera, geometry, copy, schema, and 11.5-second
  timing.
- 2026-07-27 — Use
  `Hangar` by nermin under CC BY 4.0 as the intact Legacy Hangar interior.
  Preserve its archive and attribution, consolidate its materials into one
  runtime atlas, scale it around the car/cameras, and retain a dark interior
  apron.
- 2026-07-27 — Remove the two decorative white floor guide meshes after owner
  review; protect the clean-floor decision in the deployable contract.

## Milestones and implementation

1. Add a browser regression that reaches a clamped final pose, activates Replay,
   observes the stowed opening, and requires a deployed second completion. Add a
   reduced-motion assertion that no inert Replay control is offered.
2. Pass the Replay revision into `RewardScene`, retain the loaded
   `AnimationAction`, and reset/play it before seeking a new Replay from zero.
3. Update `tools/blender/build_tesla_reward.py` so wing/stabilizer panels use a
   red-dominant PBR material while mechanical kit parts reuse an existing dark
   material and total materials remain at or below eight. Extend the Model Y
   contract test to inspect the exported material assignment.
4. Add a disposable procedural showroom environment to the desktop reward
   Canvas, rebalance direct lights, and narrow the CSS scrim without reducing
   text contrast.
5. Run the Tesla builder and focused checks, then capture the two Tier-1 desktop
   proofs. Allow at most two evidence-driven visual passes before owner review.
6. After approval, run the full validation matrix once, update this plan and
   `TEST_REPORT.md`, complete the full-diff review, and publish/byte-check the
   required Vercel preview without merging the branch.

## Validation plan

- Replay: initial final pose deployed; Replay opening stowed; second final pose
  deployed at clip time `11.500`; Skip and keyboard paths remain available.
- Reduced motion: immediate final pose and recap; no inert Replay control.
- Asset: required hierarchy/extras/cameras and exact animation unchanged; red
  wing/stabilizer assignment; dark mechanical finish; no budget regression.
- Visual: 1440 static/final/replay-final plus 768 and 375 final presentations;
  readable body, red wings, wheels, and plate; no blown highlights, blocking
  overlay, overflow, relevant console error, or failed request.
- Commands:
  `BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:tesla`,
  focused Vitest/Playwright,
  `npm run assets:check`,
  `npm run pipeline:evals`,
  `npm run check`,
  `npm run test:e2e -- --workers=1`,
  and `git diff --check`.

## Repair loop and stop conditions

Repeat failing test or screenshot -> one focused repair -> focused validation ->
actual browser inspection -> remaining-delta review. Stop after two Tier-1
visual passes for owner judgment, after three failed repairs to one root cause,
or when the remaining delta stops shrinking.

## Evidence

Current focused evidence:

- Hangar archive: 8,276,403 bytes, SHA-256
  `8ec631f27e40f6f1f3ac3448c96374c315a4874f2c8e4bdbe307f284fdf6e1fe`.
- Blender master: 22,082,575 bytes, SHA-256
  `6aee4a6694f025779aa11b61ba2e9b6816d844d2ea7a3756c45dd96a45455e1a`.
- Deployable GLB: 22,873,044 bytes, SHA-256
  `53b51f9a4cb600e0487eeb3268795ea59a8f93d3699a6401a10e950d5c94d7a7`.
- Runtime: 215,212 triangles, six materials, 20 draw calls, one 2K hangar
  atlas, exact 11.5-second animation, and the five expected stowed-scale scene
  warnings.
- `npm run check` passed lint, typecheck, 125/125 unit tests, and the production
  build. `npm run assets:check` and all 6/6 pipeline evaluations passed.
- The six-case reward browser file passed in 1.2 minutes. Across bounded serial
  groups, the full browser matrix passed all 36 executable cases with its one
  capture-only case intentionally skipped. The command harness sends SIGTERM
  to long foreground jobs, so the 42 MB locker and DC-9 model cases were run
  separately and passed in 2.0 and 2.1 minutes.
- Current owner evidence:
  `preview-renders/model-y-reward/{1440-static-reveal,1440-flight-mode-final,768-flight-mode-final,375-flight-mode-final}.png`.

## Outcome and handoff

The owner approved the selected-hangar browser composition after the two
decorative floor lines were removed. Broad validation and independent review
are complete, and draft PR #56 contains the milestone for review.
