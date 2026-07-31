# Airbus Storm Line simulator

## Purpose

Evolve Airbus A320 Pop T Captain Mode from a five-card matcher into a short, challenging browser flight scenario. The player uses keyboard, gamepad, or native HTML controls to fly a fictional en-route storm simulation, choose the safest visible corridor, recover from turbulence, and earn a Captain-traits debrief.

## Current state

The Airbus chapter loads `public/models/airbus-captain.glb` from the approved left-seat camera and presents five label cards for sidestick, thrust, gear, radio, and altitude targets. Correctly matching all five immediately completes Airbus mode. The cockpit displays are dark, the windshield has no simulated exterior, and the visible sidestick and thrust geometry do not move.

The implementation branch is `agent/airbus-gameplay-evolution`, created from `origin/main` at `7252c2c`. The previous workspace branch contained Tesla/reward work; none of that diff was carried into this branch. The unrelated untracked `CLAUDE.md` remains untouched.

## Scope

Included:

- A deterministic 3–5 minute Storm Line scenario at en-route cruise.
- Captain-mode-only arcade flight physics with checkpoint retries.
- Keyboard, standard gamepad, and native HTML hold controls.
- A skippable first-visit version of the existing five-card familiarization.
- Procedural storm visuals, embedded PFD/ND/ECAM textures, captioned crew messages, and an opt-in soundscape.
- Blender-authored display surfaces and visible sidestick/paired-thrust animation pivots.
- Schema-v9 persistence, migration, tests, asset reports, browser evidence, and owner-review handoff.

Excluded:

- No engine-out scenario or independent left/right thrust-lever split.
- No real A320 procedure simulation or operational checklist.
- No Tesla/Model Y source, deployable asset, runtime, copy, plan, image, or reward-test changes.
- No new production dependency, analytics, account, upload, or network service.

## Context and constraints

- The physical A320 remains safely parked. Storm Line is explicitly a fictional simulator and never frames Pop T as causing an accident or failure.
- The player flies continuously for most of the scenario. The storm-corridor choice is made through steering rather than a modal question.
- Wrong input may reset only the active 45–75 second checkpoint. Completed journey progress remains safe.
- Game rules stay in `src/game`, Three.js presentation in `src/scenes`, and required accessible controls in `src/components`.
- The approved captain camera and five existing gameplay target positions remain unchanged.
- The current playable-proof/greybox label remains until owner approval.
- Reduced motion changes presentation, not Captain-mode physics.

## Progress

- [x] 2026-07-29 — Approved gameplay, asset, persistence, validation, and Tesla-isolation design.
- [x] 2026-07-29 — Created isolated branch from current `origin/main`; preserved untracked `CLAUDE.md`.
- [x] 2026-07-29 — Installed dependencies and established passing 122-test baseline.
- [x] 2026-07-29 — Implemented deterministic simulation and schema-v9 persistence through TDD; focused state/storage/simulation tests and TypeScript pass.
- [x] 2026-07-29 — Authored and validated Blender display/control runtime contracts; rebuilt the source and deployable GLB with Blender 5.1.2.
- [x] 2026-07-29 — Integrated browser simulation, keyboard/gamepad/native controls, procedural weather, live instruments, physical-control animation, soundscape, pause/recovery, and trait completion.
- [x] 2026-07-29 — Captured and inspected production-GLB browser evidence at 1440, 768, and 375 px. A first failed visual gate exposed stale Blender world matrices; the repaired export visibly places all three displays.
- [x] 2026-07-29 — Completed the bounded Chromium suite, including the real GLB, keyboard, gamepad, retry/reload, reduced-motion, complete-journey, and familiarization recovery paths.
- [x] 2026-07-29 — Deployed Vercel preview `dpl_Cqcac6J4JoyBbEtEKdQgYoN34aQM`; authenticated root and Airbus GLB requests returned 200 and the deployed GLB matched local bytes/hash.
- [x] 2026-07-29 — Final lint, typecheck, 138-test suite, build, asset contracts, 6/6 pipeline evals, diff check, and Tesla-path audit passed; handoff recorded.
- [x] 2026-07-30 — Owner rejected the delivered result as awful and nonfunctional. Reproduction confirmed the supplied preview redirects ordinary browsers to Vercel SSO and the cockpit view does not visibly respond to flight state beyond small instruments/control pivots.
- [ ] Replace the static storm plane with an unmistakably flight-responsive exterior, prove input-to-visible-motion in Chromium, simplify the intrusive simulator HUD, and publish a preview the owner can actually open.

## 2026-07-30 rejection repair contract

- **Goal:** A bank, pitch, or route correction must create immediate, obvious motion through the windshield so Storm Line reads as flying rather than a static cockpit with changing numbers.
- **Context:** The rejected 1440×900 browser capture shows a fixed cockpit, flat dark windshield plane, small instrument changes, and large top/bottom overlays. Anonymous requests to the delivered preview return a 302 redirect to Vercel SSO.
- **Constraints:** Keep the fictional safely-parked simulator framing, Airbus/HTML accessibility split, accepted captain camera, checkpoint rules, and Tesla isolation. Do not use test-only shortcuts or weaken preview protection without an owner-safe sharing mechanism.
- **Done when:** A failing browser test first proves there is no flight-state visual response; the repaired test observes a material horizon transform after keyboard input; fresh 1440/768/375 screenshots are manually inspected; console and interaction checks pass; and the handoff URL opens without requiring the owner to discover an authentication workaround.

## Discoveries

- Blender 5.1.2 is installed at `/home/user1/.local/bin/blender`; `BLENDER_BIN` and `BLENDER_EXPECTED_VERSION` are not exported by default.
- The authoritative source is `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`; the accepted deployable GLB is 39,883,148 bytes.
- `AIRBUS_A320_DISPLAY_CANDIDATES` contains 40 meshes, but the large display faces share broad panel materials. Non-destructive overlay planes are safer than replacing source materials.
- The visible captain sidestick is formed by source meshes `...083`, `...084`, `...086`, and `...087`. The visible paired thrust handles are mesh `...078`.
- Existing label-target pivots are placement anchors, not mechanical hinges.
- The first export placed all three display planes and control pivots at world origin because Blender had not updated the dependency graph between assigning transforms and preserving `matrix_world`. Updating the view layer before reparenting and restoring source-mesh world matrices fixed the root cause.
- The accepted production GLB is 39,883,148 bytes at SHA-256 `9e747fcdf36cbf6fbac475997423d3805bd6681a2be316d14523daface29b82c`.
- The initial browser test asserted live node names and accessible numbers but never asserted visible flight-state response. The weather plane always copied the camera quaternion and ignored pitch, bank, and lateral position, so the cockpit appeared stationary while the state machine advanced.
- The first delivered Vercel URL is deployment-protected. Authenticated byte checks proved artifact identity but did not prove owner reachability; anonymous HTTP receives a 302 SSO redirect.

## Decision log

- 2026-07-29 — Use a Storm Line vertical slice before engine-out so one reusable simulator framework reaches production quality.
- 2026-07-29 — Make continuous manual flight the primary interaction; crew text is atmospheric rather than scored.
- 2026-07-29 — Use one fixed Captain difficulty with checkpoint coaching and no hidden easing.
- 2026-07-29 — Retain the matcher as skippable first-visit familiarization and bypass it on replay.
- 2026-07-29 — Embed live instrument textures on three Blender-authored display planes.
- 2026-07-29 — Animate existing sidestick parts and the paired thrust mesh without splitting source geometry.
- 2026-07-29 — Preserve the existing Airbus completion celebration and reward action; keep the reward implementation outside the branch diff.
- 2026-07-29 — Bind the Airbus model URL to cache key `storm-line-9e747fcd` so returning browsers cannot reuse the pre-simulator GLB.
- 2026-07-29 — Move narrow-screen viewer tools above the Storm Line control deck after the 375 px capture showed them covering Decrease thrust.
- 2026-07-29 — Make the familiarization status dock pointer-transparent outside its real buttons after the 1280×720 smoke path exposed an overlapping drop-zone hit target.

## Milestones

1. Pure simulation tests prove deterministic control response, gusts, route choice, failures, retries, clear-air completion, and trait awards.
2. Schema-v9 migration preserves old Airbus/reward progress and resumes only durable Storm Line checkpoints.
3. Blender export contains three semantic display surfaces, nested sidestick pivots, one paired-thrust pivot, required metadata, the captain camera, and unchanged gameplay targets.
4. The browser presents a playable storm with live cockpit displays, visible control motion, keyboard/gamepad/HTML input, pause, audio controls, and checkpoint coaching.
5. Owner-review evidence proves the production GLB and actual browser result at 1440, 768, and 375 px without reward spoilers.

## Implementation steps

1. Add focused failing tests for a pure `StormLineSimulation` API and normalized `FlightInput`.
2. Implement fixed-step flight state, checkpoint boundaries, trait metrics, and scenario content under `src/game`.
3. Add `AirbusSimulatorProgress` and reducer actions; migrate schema v8 to v9 while preserving completed Airbus, reward, and Mars states.
4. Extend the deterministic Airbus preparation script to add:
   - `AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE`
   - `AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE`
   - `AIRBUS_A320_DISPLAY_UPPER_ECAM_SURFACE`
   - nested captain sidestick roll/pitch pivots containing meshes 083/084/086/087
   - a paired-thrust pivot containing mesh 078
5. Export custom `game_id`, role, interaction, axis, rest-angle, and travel metadata; validate raw cached export before deployable promotion.
6. Add browser input normalization, procedural storm environment, CanvasTexture instruments, and physical-control transforms.
7. Replace the Airbus HUD flow with familiarization, briefing, continuous flight, pause/help, coaching, audio controls, recovery, and trait debrief.
8. Add browser tests and fixed approval captures; tune only presentation if performance is weak, never Captain-mode physics.
9. Update asset contract/report evidence and `TEST_REPORT.md`; inspect the complete diff and perform the Tesla path audit.

## Validation plan

Run focused checks after each checkpoint, then:

```bash
BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:airbus
npm run assets:check
npm run pipeline:evals
npm run check
npm run test:e2e -- --workers=1
git diff --check
```

Unit coverage includes deterministic input, storm progression, safe/unsafe corridor choices, energy management, failure/retry, trait awards, v8 migration, corrupt v9 recovery, and reward/Mars preservation.

Browser coverage includes familiarization complete/skip/replay, keyboard flight, injected gamepad/disconnect, native hold controls, pause clearing input, route selection, checkpoint retry/reload, audio start/mute/fallback, WebGL fallback, reduced motion, and the unchanged completion handoff.

Visual checks use 1440×900, 768×900, and 375×812. A full keyboard run and full gamepad run must be recorded. Sustained performance below 30 fps at 1440×900 is a repair condition.

## Acceptance criteria

- Storm Line is the main Airbus gameplay and is completable in roughly 3–5 minutes.
- The player actively controls pitch, bank, and paired thrust for nearly the entire scenario.
- The stable corridor can be recognized from the live weather display and selected through flight.
- Failed control envelopes rewind only the current checkpoint with focused coaching.
- Successful completion records Calm Control, Weather Judgment, and Energy Management when earned.
- PFD, ND, and ECAM graphics appear on named cockpit display surfaces.
- The visible sidestick and paired thrust levers follow player input.
- Keyboard, gamepad, HTML controls, reload, reduced-motion, and no-WebGL paths remain usable.
- Existing v8 completion never relocks the reward.
- The complete branch diff contains no Tesla/Model Y implementation or asset changes.
- Required automated checks pass and a Vercel preview plus fixed screenshots are ready for owner review.

## Repair loop and stop conditions

Repeat focused test → smallest coherent implementation → focused verification → actual browser exercise → diff review → root-cause repair. Stop only when checks pass, three consecutive bounded repairs fail to reduce the same delta, or owner visual approval is required.

## Evidence

- `npm install` — completed; existing lockfile remained current. Audit reported six pre-existing high-severity dependency findings and one pending `sharp` install-script approval.
- `npm test` — pass; 12 files and 122 tests.
- `npm run check` — pass at the browser-integration checkpoint; 14 files and 138 tests, followed by a clean production build.
- `npm run test:e2e -- e2e/airbus-storm-line.spec.ts --workers=1` — pass; keyboard/reload, gamepad/checkpoint recovery, and real production-GLB visual gate.
- Bounded Chromium evidence accounts for all 40 selected cases: Airbus Storm Line 3/3, locker 6/6, reward 6/6, viewer controls 3/3, and smoke 22/22 with one owner-capture case intentionally skipped. A monolithic attempt was externally terminated after its first seven green cases; no product assertion had failed. The smoke file later exposed one dock/drop-zone overlap at 1280×720; its exact red case passed after the pointer-boundary repair and a fresh preview build.
- `BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:airbus` — pass; source preparation, validation, preview rendering, export, and glTF validation/inspection.
- `npm run assets:check` — pass after the initial simulator contract export.
- Final `npm run check` — pass; ESLint, TypeScript, 14 Vitest files / 138 tests, and production build.
- Final `npm run assets:check` — pass; Airbus glTF reported no errors or warnings, with documented informational unused-UV notices.
- Final `npm run pipeline:evals` — pass, 6/6.
- Final `git diff --check` and tracked/untracked Tesla/Model Y/reward path audit — pass.
- Vercel preview `dpl_Cqcac6J4JoyBbEtEKdQgYoN34aQM` — READY at `https://cockpit-escape-room-mg2122811-ottoagent007-gmailcoms-projects.vercel.app`. Authenticated `vercel curl` returned HTTP 200 for the app and Airbus GLB; the deployed model matched the accepted 39,883,148 bytes and SHA-256 exactly. The connected share-link helper returned 403 for the protected deployment, so owner access remains subject to Vercel authentication.
- Read-only Blender planning renders:
  - `.cache/planning/a320-control-candidates.png`
  - `.cache/planning/a320-control-components.png`
- Inspected actual-browser approval captures:
  - `preview-renders/storm-line/airbus-storm-line-1440.png`
  - `preview-renders/storm-line/airbus-storm-line-768.png`
  - `preview-renders/storm-line/airbus-storm-line-375.png`

## Outcome and handoff

The 2026-07-29 handoff was rejected on 2026-07-30. Automated contracts remain useful evidence, but the milestone is reopened until the visible flight response and owner-accessible preview are repaired and reviewed.
