# Model Y Hangar and Flight Mode Reward

## Purpose

Replace the current reward greybox with a protected, dedicated hangar that
reveals the red Model Y with a `POP T` plate and plays the approved Flight Mode
cinematic after the DC-9, locker, and Airbus chapters are complete.

## Prompt contract

**Goal:** The player completes the full family journey, sees the real red Model Y
reward in a premium legacy-to-future hangar, watches or skips an accessible
11.5-second Flight Mode transformation, and receives the full Father's Day
tribute.

**Context:** `origin/main` currently routes Airbus completion to persisted
`phase = reward`, displays reward copy in `Hud`, and renders the DC-9 cockpit plus
a red box proxy in `PrototypeScene`. The owner-supplied source is
`/mnt/2TBHDD/Downloads/red electric car 3d model.glb`, 16,060,928 bytes,
SHA-256 `d88769d9c66bdeca46bf239c9baa2a295afc82ffb24005733d9374b9c7782bee`.
Neutral Blender 5.1.2 inspection found one 480,305-triangle mesh, one material,
three wired 4096-square PBR textures, no animations, and bounds approximately
`0.9802 × 0.4615 × 0.3442`.

**Constraints:** Preserve Model Y spoiler protection, the existing journey and
schema v8 progress, local-only data, no-progress-loss behavior, native HTML
equivalents, reduced motion, stable GLB contracts, and the source-quality 4K
asset. Do not hand-edit GLBs, expose Mars, add a production dependency or audio
asset, cut the one-piece vehicle body into moving panels, or mix this scene group
with cockpit or TMB2 assets.

**Done when:** The deterministic Blender build, asset validators, focused tests,
full app check, single-worker browser suite, responsive browser evidence,
full-diff review, reports, and Vercel preview support owner review of the static
reveal and completed Flight Mode transformation.

## Current state

- `npm run asset:tesla` names the expected Blender master and deployable GLB, but
  the source, deterministic preparation script, master, and GLB do not exist.
- Reward and Mars reuse the DC-9 branch of `PrototypeScene`.
- The visible reward is a red box; another red sphere exposes Mars.
- Reward copy is accessible but has no load, error, Skip, Replay, transformation,
  or reduced-motion presentation.
- `rewardUnlocked` and phase persistence already protect the reward handoff; no
  schema migration is needed.

## Scope

Included: source preservation and provenance, deterministic Blender master,
hangar, optimized vehicle, `POP T` plate, articulated Flight Mode kit, exported
camera/animation contract, deployable GLB, dedicated lazy reward scene, pure
timeline, accessible overlay, hidden/deferred Mars, tests, browser proof,
reports, Vercel preview, and owner gates.

Excluded: prior chapter redesigns, TMB2 intro assets, new puzzle mechanics,
Optimus escort, Mars gameplay, analytics, new audio, and production dependencies.

## Context and constraints

- Approved design:
  `docs/superpowers/specs/2026-07-26-model-y-hangar-flight-mode-design.md`.
- Blender version: 5.1.2 at `/home/user1/.local/bin/blender`.
- The source hash and complete 4K BaseColor/normal/metallic-roughness set are
  immutable intake gates.
- Runtime budgets: vehicle <= 180,000 triangles; complete GLB <= 250,000
  triangles, <= 8 materials, <= 30 draw calls, <= 25 MiB; runtime maps initially
  2048 square.
- The animation and camera are Blender-authored. Skip/reduced motion seek the
  exact final frame; the browser does not recreate mechanical transforms.
- The TMB2 logo is already preserved on its own local checkpoint branch and is
  not duplicated or reused in this scene group.
- Use at most three evidence-driven repair cycles per visual checkpoint. Stop
  when the delta stops shrinking or owner judgment is required.

## Progress

- [x] 2026-07-26 — Inspected the source GLB, current reward greybox, runtime
  progression, asset commands, validators, and repository guidance.
- [x] 2026-07-26 — Approved full staged reward, `POP T` plate, legacy-to-future
  hangar, non-destructive articulated kit, autoplay, full tribute, hidden Mars,
  static interim gate, and final Vercel owner gate.
- [x] 2026-07-26 — Preserved the unrelated TMB2 WIP and exact approved logo in
  local commit `6e4124c` on `agent/tmb2-intro-production-polish`; no push or merge.
- [x] 2026-07-26 — Created clean `feature/model-y-reward` from `origin/main`.
- [ ] Add failing asset-contract tests and deterministic source intake/build.
- [ ] Produce and inspect the static hangar/Model Y approval checkpoint.
- [ ] Add failing timeline/runtime/browser tests and implement the reward scene.
- [ ] Produce and inspect the completed Flight Mode browser checkpoint.
- [ ] Run full validation, review, update evidence, and publish the Vercel gate.

## Discoveries

- The supplied filename is `red electric car 3d model.glb`; the shorter prompt
  name did not exist.
- The Tripo source passes the required 4K source-map gate but has no tangents and
  uses the optional unsupported `FB_ngon_encoding` extension.
- The car is a single mesh with no animation-ready body panels, so the approved
  external articulated kit avoids destructive UV/topology edits.

## Decision log

- 2026-07-26 — Use one complete staged milestone with an interim static reveal
  checkpoint, then the combined reward/Flight Mode owner gate.
- 2026-07-26 — Preserve the body and add a separately modeled concealed flight
  kit rather than retopologizing or using effects-only hover.
- 2026-07-26 — Autoplay after the GLB is ready; provide Skip and Replay.
- 2026-07-26 — Keep schema v8. Reload replays the non-puzzle cinematic.
- 2026-07-26 — Remove visible Mars controls while retaining legacy save
  compatibility.
- 2026-07-26 — Treat the source as owner-supplied private-use authority but keep
  it at candidate status until browser visual approval.

## Milestones

### Milestone 1: Deterministic static reward asset

The original source is hash-preserved and reproducibly produces a validated
Blender master containing the premium hangar, optimized red vehicle, `POP T`
plate, stable hierarchy, static/deployed approval cameras, and documented
budgets. Neutral and browser static-reveal evidence is ready for owner review.

### Milestone 2: Articulated Flight Mode contract

The approved static asset gains concealed wings, stabilizers, lift fans,
emissive accents, and one exact 11.5-second Blender action. Skip and reduced
motion can seek the authored final pose without browser-authored transforms.

### Milestone 3: Protected accessible runtime

The dedicated reward scene lazy-loads only after journey completion, plays the
cinematic once per mount, exposes native captions/Skip/Replay/retry/fallback,
remains usable without WebGL, and hides the unfinished Mars route.

### Milestone 4: Browser and owner gate

Focused/full checks pass; 1440×900, 768, and 375 browser evidence proves reveal,
deployment, final pose, responsive UI, no spoiler leak, and no relevant
console/request failure. A Vercel preview is ready for owner review.

## Implementation steps

1. Add failing model-contract assertions for the source report, deployable
   Model Y nodes, metadata, cameras, animation, tangents, and budgets.
2. Add a deterministic Blender build invoked by `npm run asset:tesla`: preserve
   and verify the source, import with auto-execution disabled, record recursive
   bounds/materials/textures, create the master hierarchy/hangar/plate/kit,
   decimate only the runtime body, resize only runtime texture copies, author
   cameras/action, save the master, validate, render, export to `.cache`, add
   tangents, validate/reimport, and promote the GLB.
3. Record the source/license manifest and tracked Model Y intake report. Inspect
   neutral renders and the real browser static reveal before Flight Mode polish.
4. Add failing pure timeline tests for every cue boundary, exact clip time,
   reduced motion, Skip, completion, and Replay.
5. Implement the pure timeline and full approved copy under `src/game`.
6. Add failing browser assertions for protected lazy loading, reward handoff,
   autoplay, captions, Skip, Replay, reduced motion, reload, load failure,
   keyboard focus, legacy Mars return, and absent visible Mars controls.
7. Add a dedicated cached reward GLTF loader, `RewardScene`, and accessible
   reward overlay. Remove reward/Mars proxy geometry and callbacks from
   `PrototypeScene`; preserve cockpit behavior for its own phases.
8. Run focused asset/unit/browser tests, then complete checks. Capture and inspect
   reveal, transformation, and final-pose evidence at required widths.
9. Update this plan, `TEST_REPORT.md`, asset report, manifest, and preview
   evidence with actual commands, hashes, counts, warnings, limitations, and
   owner-review delta.
10. Review the complete diff, repair all critical/high findings, deploy a Vercel
    preview, and stop at the formal owner visual gate.

## Validation plan

### Asset

- Source hash, size, generator, recursive bounds, one material, three wired 4K
  maps, and no zero-size meshes.
- Required root/groups/body/plate/pivots/rotors/emissive/cameras.
- `reward.modelY` and `reward.flightMode` extras.
- Exactly one `TESLA_FLIGHT_MODE_REVEAL` action at 11.5 seconds.
- Body tangents; runtime and total triangle/material/draw-call/texture/size
  budgets; clean Blender validation and GLB reimport.

### Unit and accessibility

- Cue results immediately before, at, and after each boundary.
- Reduced motion and Skip return exact final clip time.
- Replay starts at zero without changing persisted progress.
- Full tribute and both approved titles remain data-driven.
- Reward HTML remains complete when Canvas is skipped or fails.

### Browser

- The Model Y module/GLB is not requested during briefing, DC-9, locker, or
  Airbus gameplay.
- Airbus **Continue** enters the hangar without exposing the old red box/DC-9
  reward composition.
- Autoplay, captions, Skip, Replay, keyboard focus, reduced motion, reload, and
  Retry/accessible fallback work.
- A legacy Mars save can return to the reward; new reward UI has no Mars button
  or interactive sphere.
- 1440×900, 768×900, and 375×812 have no blocking overlay, crop, overflow, or
  unreadable controls.

### Commands

- `BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:tesla`
- focused Vitest and Playwright cases
- `npm run assets:check`
- `npm run pipeline:evals`
- `npm run check`
- `npm run test:e2e -- --workers=1`
- `git diff --check`

## Acceptance criteria

- The real red source car, not a proxy, is visible in a separate premium hangar
  only after the three prior chapters are complete.
- The `POP T` plate is readable in the static hero view.
- The two approved titles, 11.5-second autoplay, premium articulated kit, final
  recognizable hover-ready pose, full tribute, Skip, Replay, reduced-motion
  recap, and accessible fallback work as designed.
- The GLB stays within approved budgets and preserves the full stable contract.
- No visible or keyboard-reachable Mars control remains for new reward play.
- All listed checks pass with no unresolved critical/high review finding.
- Static reveal and completed Flight Mode evidence are explicitly handed to the
  owner; automated proof is not misreported as visual approval.

## Repair loop and stop conditions

Repeat orient -> failing test -> minimum implementation -> focused validation ->
actual Blender/browser inspection -> diff review -> root-cause repair -> evidence
update. Stop after three failed repairs to the same root cause, when the remaining
delta stops shrinking, when an external source/tool cannot be recovered safely,
or when the next step requires owner visual judgment.

## Evidence

- Planning source inspection:
  `.cache/assets/intake/red-electric-car/inspection.json`.
- Planning contact sheet:
  `.cache/assets/intake/red-electric-car/contact-sheet.png`.
- No reward implementation validation recorded yet.

## Outcome and handoff

Implementation is active. This section will record delivered behavior, actual
verification, known limitations, preview URL, and the remaining owner decision.
