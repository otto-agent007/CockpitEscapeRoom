# DC-9 Memphis Legacy Departure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox ('- [ ]') syntax for tracking.

**Goal:** Add a forgiving, cockpit-first DC-9 taxi and takeoff memory recreation from older Memphis International Airport Concourse B between the Legacy Route Record and Home Operations.

**Architecture:** A pure deterministic module owns normalized departure rules, checkpoints, recovery, and hints. React owns durable chapter state and an rAF runtime hook, while React Three Fiber renders a lazy-loaded Memphis environment by applying the pure aircraft frame to an inverse world transform around the existing right-seat cockpit. A deterministic Blender intake converts only the owner-approved Ted Davis Concourse B objects and project-authored ramp/runway geometry into a separately validated GLB.

**Tech Stack:** TypeScript, React 19, Vitest, React Three Fiber, Three.js, Playwright, Blender 5.1, Python 3, X-Plane OBJ8 parser, glTF Transform, Vite.

**Spec:** 'docs/superpowers/specs/2026-08-27-dc9-memphis-legacy-departure-design.md'

## Global Constraints

- The present-day commemorative DC-9 remains safely parked; taxi and takeoff are an explicitly fictional 1995 memory recreation.
- The entire sequence remains in the DC-9 first-officer/right-seat cockpit; no exterior camera is added.
- No real speed, runway number, radio frequency, checklist, engine setting, configuration target, or operating procedure may appear.
- The player starts after a ground-tow handoff; there is no engine start or pushback procedure.
- Every required 3D or continuous interaction has a native HTML and keyboard equivalent.
- Wrong input restores only the latest departure checkpoint and never erases route, control-check, or later puzzle progress.
- The Ted Davis Memphis package is allowed only for this private, noncommercial game under owner-attested permission dated 2026-08-27; retain attribution.
- Import only 'ConcourseB.obj', 'ConcourseB_2.obj', 'ConcourseB_2e.obj', 'KMEMterminal.png', 'KMEMterminal_LIT.png', and 'KMEMterminal_NML.png'.
- Do not import AutoGate, OpenSceneryX, bundled aircraft, vehicles, clutter, or unrelated scenery content.
- Preserve the untouched download and disposable conversions under '.cache/cockpit-pipeline'; never execute downloaded scripts or add-ons.
- Keep any edited or converted source candidate under the source cache's 'extracted/optimized/' directory before publishing a validated stage handoff.
- Use Blender 5.1 with factory startup and auto-execution disabled for source intake.
- Run source, assembly, and shading sequentially on separate 'asset/dc9-memphis-*' branches; no downstream stage consumes an unapproved branch or artifact.
- Keep the production DC-9-32 cockpit unchanged and lazy-load the Memphis environment only in the new stage.
- Do not add a production dependency, weaken an existing test, hand-edit a GLB, or reveal Model Y content early.
- Update this ExecPlan, the asset report, and 'TEST_REPORT.md' with commands actually run and evidence actually inspected.

---

## Purpose

The Final Flight Log currently proves the right-seat flight controls and then returns to document and systems-check gameplay. This milestone turns those same controls into a short legacy flight: depart a recognizable older Concourse B ramp, make one meaningful taxi turn, stop safely, line up, accelerate, rotate on a qualitative cue, and hold a brief initial climb.

The player-visible result is a two-to-three-minute celebratory memory that makes the Legacy Route Record feel like a destination rather than another modal. It remains a game, not a DC-9 or KMEM training aid.

## Current state

- 'src/game/state.ts' defines schema 13 and the DC-9 stages 'controlCheck → intro → routeRecord → homeOperations → instrumentScan → shutdown → qualification → keyReveal → complete'.
- Correct 'SUBMIT_DC9_ROUTES' currently moves directly to 'homeOperations'.
- 'src/game/dc9Input.ts' and 'src/game/useDc9FlightControls.ts' already drive normalized pitch, roll, thrust, and rudder through keyboard, gamepad, pointer drag, and native hold buttons.
- 'src/components/dc9/ControlCheckPanel.tsx' contains the reusable visual language for axis meters and hold controls, but the axis UI is embedded in that component.
- 'src/scenes/PrototypeScene.tsx' loads the 35 MiB 'dc9-cockpit.glb', reconstructs control pivots, anchors the camera to 'CAM_DC9_FIRST_OFFICER_GAME', and renders no exterior DC-9 environment.
- 'tools/blender/cockpit_pipeline/xplane_obj8_convert.py' already parses X-Plane OBJ8 v800 geometry and converts X-right/Y-up/Z-south to Blender X-right/Y-forward/Z-up.
- 'tools/assets/build-asset.mjs' validates Blender sources and promotes only successful raw GLBs to 'public/models'.
- The selected archive is available from 'https://theosdavis.com/xpfiles/ewExternalFiles/Memphis_Nashville.zip' with SHA-256 'fc403141223be066094814d9ea06d820f75477fea419870b04ffd65153434b95'.

## Scope

Included:

- one new durable 'memphisDeparture' DC-9 stage;
- pure normalized taxi/takeoff rules with five recoverable checkpoints;
- brake input and an explicit safe lineup confirmation;
- qualitative HTML guidance and complete accessible controls;
- schema 14 migration and corrupt-save normalization;
- deterministic source intake, Blender master, separate environment GLB, stable anchors, asset contracts, and attribution;
- right-seat environment motion, daylight lighting, reduced motion, load failure, pause, reload, and safe retry behavior;
- unit, contract, asset, browser, responsive, and visual evidence.

Excluded:

- free-roaming KMEM, exact taxiway or runway recreation, ATC, traffic, weather, engine start, pushback, landing, exterior cameras, or a DC-9 exterior model;
- changes to Home Operations content, instrument order, shutdown, ATP qualification, Captain's Key, locker, Airbus, reward, Flight Mode, or Mars;
- OpenSceneryX, AutoGate, bundled airplanes, or third-party library objects.

Gameplay and environment intake remain in one ExecPlan because neither track produces the approved player outcome alone. The asset track still uses separate sequential source, assembly, and shading branches and review gates.

## Context and constraints

The new environment is a later simulator scenery source used as an owner-approved geometry base. It is labeled '1995 MEMORY', not an exact historical reconstruction. The player must see Concourse B clearly at ramp release, but the guided route is intentionally compressed and project-authored.

The environment must not become authoritative game state. The pure frame drives the renderer, HTML guidance, persistence events, and tests. Only checkpoint progress persists; reload always starts the latest checkpoint at rest.

The existing cockpit GLB remains the DC-9-32 authority. The Memphis GLB is a separate scene group and contains only exterior environment geometry, ground surfaces, and named path anchors.

## File structure

New runtime files:

- 'src/game/dc9MemphisDeparture.ts' — normalized rules, frame advancement, checkpoints, hints, mistakes, and durable-progress normalization.
- 'src/game/dc9MemphisDeparture.test.ts' — pure simulation and normalization tests.
- 'src/game/useDc9MemphisDeparture.ts' — rAF loop, brake input, visibility pause, checkpoint dispatch, and published HTML frame.
- 'src/components/dc9/Dc9AxisControls.tsx' — shared axis meters and native hold controls extracted from Control Check.
- 'src/components/dc9/MemphisDeparturePanel.tsx' — active beat, qualitative guidance, brake, lineup, restore, and accessibility UI.
- 'src/scenes/Dc9MemphisEnvironment.tsx' — lazy GLB load, runtime contract validation, inverse-world motion, and load telemetry.
- 'src/scenes/dc9MemphisVisuals.ts' — pure path sampling and Three.js-independent transform values.
- 'src/scenes/dc9MemphisVisuals.test.ts' — anchor/path and transform tests.
- 'e2e/dc9-memphis-departure.spec.ts' — full successful, recoverable, reload, accessible, and reduced-motion paths.

New asset files:

- 'tools/assets/dc9-memphis-source-contract.mjs' and '.test.mjs' — immutable archive/file hash, selected-file, exclusion, permission-basis, and attribution contract.
- 'tools/assets/dc9-memphis-model-contract.mjs' and '.test.mjs' — GLB nodes, anchors, extras, material, and texture limits.
- 'tools/blender/inspect_dc9_memphis_source.py' — Agent 1 source-only OBJ8 import, neutral candidate GLB, metadata, and previews.
- 'tools/blender/cockpit_pipeline/kmem_legacy_layout.py' — pure names, path anchors, source transforms, and validation helpers.
- 'tools/blender/cockpit_pipeline/tests/test_kmem_legacy_layout.py' — deterministic layout tests.
- 'tools/blender/assemble_dc9_memphis_legacy.py' — Agent 2 neutral assembly, ground/path construction, stable anchors, runtime contract, and previews.
- 'tools/blender/shade_dc9_memphis_legacy.py' — Agent 3 material wiring, packed textures, optimization report, final master, and previews.
- 'art-source/cockpit-pipeline/gates/agent0-dc9-memphis-legacy-authority.json' — source-authority gate.
- 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/job.json' — source job contract.
- 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/source-approval.json' — owner source-review decision.
- 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/assembly-approval.json' — owner neutral-assembly decision.
- 'art-source/cockpit-pipeline/gates/dc9-memphis-legacy-runtime-contract.json' — machine-readable Agent 2 handoff.
- 'art-source/cockpit-pipeline/gates/dc9-memphis-legacy-material-optimization.json' — machine-readable Agent 3 handoff.
- 'art-source/cockpit-pipeline/gates/dc9-memphis-legacy-browser-integration.json' — machine-readable browser handoff and viewport proof.
- 'art-source/blender/dc9-memphis-legacy-departure.blend' — approved packed master.
- 'public/models/dc9-memphis-legacy-departure.glb' — deployable environment.
- 'asset-reports/dc9-memphis-source-intake.json' — source, hashes, exclusions, owner-attested permission, and credit.
- 'asset-reports/dc9-memphis-legacy-departure.md' — Blender, geometry, texture, optimization, and visual evidence.

Modified files:

- 'src/game/config.ts', 'state.ts', 'state.test.ts', 'storage.ts', and 'storage.test.ts'.
- 'src/game/dc9Input.ts', 'dc9Input.test.ts', and 'useDc9FlightControls.ts'.
- 'src/components/dc9/ControlCheckPanel.tsx', 'Dc9Chapter.tsx', and 'dc9Chapter.css'.
- 'src/App.tsx', 'src/scenes/PrototypeScene.tsx', and 'src/scenes/cockpitModelLoader.ts'.
- 'tools/assets/build-asset.mjs', 'check-models.mjs', 'package.json', and 'public/models/README.md'.
- DC-9-complete seed objects in the seven existing e2e files found by 'rg -l "dc9:\\s*\\{" e2e'.
- 'docs/GAME_DESIGN.md', 'docs/VISUAL_REALISM.md', 'TEST_REPORT.md', and this ExecPlan.

## Discoveries

- 'ConcourseB.obj' is only 178 triangles and measures 113.010 × 226.325 × 10.969 Blender meters.
- 'ConcourseB_2.obj' is 30 triangles and measures 214.772 × 30.409 × 8.000 meters.
- 'ConcourseB_2e.obj' is 24 triangles and measures 216.586 × 28.782 × 8.000 meters.
- All three source objects use 'KMEMterminal.png'; the source also declares a 2048 × 1024 lit map and 2048 × 1024 normal map.
- The parser currently records 'TEXTURE_NORMAL' as unsupported, so the environment builder must wire the normal map explicitly without changing cockpit geometry parsing.
- The archive contains AutoGate, OpenSceneryX fallback library objects, and bundled aircraft; none are needed for the selected Concourse B geometry and all remain excluded.
- The current DC-9 thrust lever holds its position when input is released. Visibility loss therefore must pause and restore the departure frame rather than merely clear held keys.
- **2026-08-28 Task 10 untouched focused browser run:** `npx playwright test e2e/dc9-memphis-departure.spec.ts e2e/smoke.spec.ts --project=chromium` completed tests 1–33 with 32 passing and the opt-in owner-proof test skipped; no product assertion failed. The runner then exited with signal status 143 before tests 34–39 reported, so the first failure boundary is an external termination rather than a reproduced application defect. No source repair preceded this observation.
- **2026-08-28 Task 10 first focused assertion failure:** isolating test 34 with `npx playwright test e2e/smoke.spec.ts --project=chromium --grep "DC-9 production cockpit stages"` failed in 42.4 seconds at `e2e/smoke.spec.ts:1286`: the legacy expectation looked immediately for `Home Operations Log` after route submission, but the approved insertion correctly rendered `Memphis Legacy Departure`. This is stale browser coverage owned by Task 10, not a runtime defect; the repair must assert the real Memphis GLB/camera/path before Home Operations.
- **2026-08-28 Task 10 new-harness RED calibration:** the first new real-GLB test failed in 8.5 seconds because its page-identity assertion guessed a project-name title, while the established document title is `The Captain's Key`. The rendered shell was healthy; the assertion was corrected to the repository's actual identity before proceeding to the intended missing object-count contract RED.
- **2026-08-28 Task 10 browser repair cycle 1 RED:** the corrected real-GLB test reached a ready cockpit and Memphis environment in 43.8 seconds with right-seat camera `CAM_DC9_FIRST_OFFICER_GAME`, beat `rampRelease`, and a finite world pose, then failed only because no loaded environment object count was published. The smallest owning scene repair publishes the staged clone's traversal count on readiness and removes it on unmount, enabling the required three-entry stability measurement without changing gameplay or rendering.
- **2026-08-28 Task 10 console inspection:** after the object-count repair, the complete real-GLB assertion reached its final console-health check. There were no console errors. Chromium emitted only the established Three.js `THREE.Clock` deprecation warning and headless-driver `GPU stall due to ReadPixels` performance warnings; the harness records and allow-lists those exact non-application warnings while continuing to fail on any other warning or any error.
- **2026-08-28 Task 10 recovery-harness calibration:** the first four-test recovery run passed checkpoint reload/visibility and aborted-request/retry, but two new assertions observed valid behavior at the wrong instant. The input-method copy returns to keyboard once a native hold is released, so parity is now asserted while each input is active. The first lineup click was delivered synchronously before motion began and was therefore correctly accepted; the corrected test first establishes motion, proves the lineup control is removed, sends Enter, and verifies no checkpoint advance before stopping.
- **2026-08-28 Task 10 initial frame-budget RED:** after three successful enter/exit checks and a fourth environment entry, 120 taxi rAF intervals measured median `800 ms` and p95 `883.3 ms`; the staged environment object count stayed exactly `[26, 26, 26]` and there were no WebGL errors. Because the sample followed repeated real-cockpit decodes in headless Chromium, the next diagnostic run moves the plan-required warm sample to the first fully loaded entry and records the unmasked WebGL renderer before making any rendering change.
- **2026-08-28 Task 10 frame-budget environment diagnosis:** moving the 120-frame sample to the first fully loaded entry reproduced median `799.9 ms` and p95 `883.3 ms`; three entry/exit counts again stayed `[26, 26, 26]` with no WebGL errors. `WEBGL_debug_renderer_info` identified `ANGLE ... SwiftShader Device (Subzero)`, so the result measures Playwright's headless software renderer rather than this workstation's GPU and cannot satisfy or falsify the `p95 <= 35 ms` hardware acceptance. The unchanged test is next run headed on `DISPLAY=:0`; the threshold remains intact.
- **2026-08-28 Task 10 headed frame-budget GREEN:** the identical 120-frame test under headed Chromium on `DISPLAY=:0` used `ANGLE (NVIDIA Corporation, NVIDIA GeForce GTX 1050 Ti/PCIe/SSE2, OpenGL 4.5.0)` and passed with median `16.7 ms`, p95 `33.4 ms`, stable scene objects `[26, 26, 26]`, and no WebGL errors.
- **2026-08-28 Task 10 visual mismatch ledger before repair:** inspected all 13 actual app PNGs under `preview-renders/dc9-memphis-legacy-departure/`. Cockpit orientation is upright/right-seat and desktop controls are readable, but at 375×812 and 768×900 the constrained Memphis panel lets later controls overflow its box into the persistent footer because `max-height: 58vh` has no overflow ownership. The ramp-start windshield also reads mostly as grey apron/sky and does not make Concourse B recognisable, despite the approved neutral-review framing. Repair pass 1 changes only panel overflow/reachability after a browser RED; environment composition remains unchanged until that objective layout defect is re-proved.
- **2026-08-28 Task 10 visual-repair pass 1:** a Memphis-only right-seat initial look yaw of `-0.18` rad preserved the exact camera node, position, FOV, GLBs, anchors, inverse world pose, panel, and input limits, but the refreshed 375×812, 768×900, and 1440×900 ramp proofs still showed only grey apron/sky through the upper/right windshield. Concourse B remained off-camera, so the approved composition was not met.
- **2026-08-28 Task 10 visual-repair pass 2 NEEDS_CONTEXT:** the final authorized same-variable pass strengthened only the initial look yaw to `-0.48` rad, within the unchanged `-0.72` rad look limit. Refreshed `375-ramp-start.png`, `768-ramp-start.png`, and `1440-ramp-start.png` remain cockpit-first with reachable instruments and forward instructions, but Concourse B geometry/texture is still completely absent from the upper/right windshield and right-side window. The terminal is off-camera, not dark or UI-occluded. The one-variable repair boundary is exhausted; Task 10 stops before changing asset layout, world pose, camera node/position/FOV, panel/CSS, or any second visual variable.
- **2026-08-28 Task 10 neutral restoration:** the controller rejected both yaw experiments. The Memphis-specific initial yaw branch was removed, restoring the exact original effective yaw `0`; `git diff --exit-code -- src/scenes/PrototypeScene.tsx` passed. `npm run build` passed, and the 375×812, 768×900, and 1440×900 ramp screenshots were refreshed at neutral yaw with the accepted cycle-2 panel fix. The wider capture then failed later on an unrelated 768 initial-climb timing assertion, after all three requested ramp files had already been written. The closest real-browser restoration check passed 1/1 in 42.2 seconds, reproving the lazy Memphis request, fixed right-seat camera, meaningful model/world-pose datasets, and no Model Y request. The remaining blocker is the owner-visible terminal composition, not rejected yaw code or a camera-contract regression.
- **2026-08-28 Task 10 rejected-proof cleanup:** five later-beat PNGs that predated neutral restoration were moved to recoverable `/tmp/dc9-task10-rejected-yaw-proofs/`; only neutral-yaw captures remain under `preview-renders/dc9-memphis-legacy-departure/`. No rejected yaw screenshot remains as final evidence.
- **2026-08-28 Task 10 checkpoint validation repair:** fresh checkpoint validation found exactly two lint errors in the expanded e2e harness: unused `DC9_DEPARTURE_BEATS` and unused `completeAccessibleDeparture`. Playwright test discovery listed all 9 tests and typecheck passed. The smallest test-only cleanup removes those two dead declarations before rerunning lint/build/diff checks; it does not change exercised behavior or begin the selected option-1 asset work.
- **2026-08-28 terminal-composition root cause, measured:** reading `CAM_DC9_FIRST_OFFICER_GAME` from the cockpit GLB (world position (0.45, 0.70, 3.24), forward pitched 22.64° down and yawed 4.66° left) and mapping it through the `dc9MemphisWorldPose` inverse transform at `rampStart` (heading atan2(55, 90)) gives the exact windshield frustum in game space: horizontal wedges of ±45° (1440, FOV 64), −38..+29° (768, FOV 76), and −24.5..+15.1° (375) around the tangent, with exterior visible only in a thin elevation band near the horizon (about −4..+8° at 375, measured from the recorded captures). Every retired east-side concourse piece sat at bearings +50° to +163° — behind the aircraft — so no camera yaw within the 0.72 rad look limit could ever reach it. The model reproduces both rejected yaw experiments and the all-grey captures exactly.
- **2026-08-28 second environment defect — route over void:** the retired taxi surface (X −94.5..−50.5) never covered the hold-short leg at X −120, the runtime spline overshoots to X −125 between hold short and lineup, and the runway box only begins at Y 225 — so from roughly Y 163 through hold short the aircraft taxied over background-colored void. The recorded `1440-hold-short.png` browser capture shows the resulting all-void windshield. A layout-driven ground fix (taxi surface widened to X −140..−50.5 / Y 15..265, ramp extended north to Y 230, new `KMEM_TERMINAL_APRON` X −300..−151 / Y 120..640 under the relocated frontage) restores a worst-case 15.2 m pavement shoulder under the sampled ground track, verified by a new pure validator that fails the retired ground set at −25 m.
- **2026-08-28 silent rotation loss found by GLB read-back:** the first re-assembly exported both rotated piers with identity rotation — the glTF importer leaves imported objects in `QUATERNION` rotation mode, where the assembly script's `rotation_euler` write is silently ignored. Reading the exported GLB's world bounds with `@gltf-transform/core` caught it (`ConcourseB_2e` lay broadside across the route corridor). This also means the previously shipped neutral/shaded/production GLBs never carried their authored 90° pier rotations. The fix forces `rotation_mode = "XYZ"` before the write, and two new fail-closed checks — an in-scene `matrix_world` comparison before export and a reimport-report transform comparison recorded as `sourceTransforms` — now reject any drift between the authored layout and the exported scene.
- **2026-08-28 terminal-composition assembly re-run:** with the west-frontage transforms, `validate_layout` reports no errors and the new coverage validator measures 74.8% (1440) / 83.2% (768) / 97.3% (375) ramp-start windshield coverage, worst route-corridor clearance 50.9 m, and no building on maneuvering pavement — cross-validated against an independent JS evaluator to three significant figures. The 21 pipeline unit tests, Agent 2 Blender 5.1.2 run, runtime-contract gate, manifest hash validation, and `gltf-transform validate` all pass. Agent 2 now also renders six windshield-pose previews from the measured first-officer rig so the Assembly Review Gate can never again hide the in-game view. The prior `assembly-approval.json` intentionally no longer matches, so shading is blocked until the owner re-approves.

- **2026-08-28 Task 10 far-plane clipping defect (reproduced before repair):** with the promoted west-frontage GLB, the headed evidence capture passed and the refreshed `1440-ramp-start.png` showed the near-right satellite arm textured in the right window — but the main frontage at 241–483 m was absent, while the measured-camera Blender proof (clip 3000 m) showed it. Reading the cockpit GLB found the cause: **every DC-9 camera is authored with `zfar = 100 m`**, and `applyDc9GameplayCameraTransform` copies it, so the runtime clips the entire environment beyond 100 m. This also explains why the pavement always ended in a false 100 m "horizon" in prior captures. The focused repair extends only the Memphis stage's frustum (`near 0.05`, `far 2500` — near raised for depth precision across the 700 m scene), publishes near/far as two appended `data-dc9-camera-state` values, and is proven by a new RED-first e2e assertion that the active Memphis camera far plane reaches at least 1500 m.

- **2026-08-28 Task 10 stale journey coverage repaired:** the two smoke tests that never re-verified after the Memphis insertion (the checkpoint run was externally killed before tests 34+ reported) now pass: `DC-9 production cockpit stages the Final Flight Log` asserts the real Memphis model request, `CAM_DC9_FIRST_OFFICER_GAME`, the `rampRelease` beat, and the ≥1500 m frustum after route submission before staging Home Operations from a completed departure (the accessible-flow idiom); `complete reordered journey` plays the departure's native happy path — thrust, taxi, hold short, lineup confirmation, legacy roll, rotation, climb out — end to end under `?skip3d=1` with a 120 s budget. Browser metrics with the widened frustum are unchanged: median 16.7 ms / p95 16.7 ms headed, scene objects stable [28, 28, 28].

- **2026-08-28 owner-reported climb glitch — dash through the cabin (reproduced, repaired):** the committed `1440-initial-climb.png` and `768-initial-climb.png` showed a beige runway centerline dash slicing across the cockpit interior. Cause: the aircraft reference sat at pavement level (eye 0.70 m), so the cockpit's own floor lay below the ground plane, and the climb's world pitch swung the 24 m dashes up through the cabin. Fix: `DC9_MEMPHIS_GROUND_CLEARANCE_METERS = 2.5` in `dc9MemphisVisuals.ts` lifts the aircraft reference a gear height above the pavement — a rigid transform preserves the perpendicular distance from the rotation centre to the ground plane, so no environment surface can reach the cockpit at any pitch or roll. RED-first Vitest proves the plane distance equals clearance plus altitude at rest, full nose-up, and full bank (564 tests green); the layout module's measured rig rose to eye z 3.20 with windshield coverage unchanged (74.8/83.2/97.3%). Evidence re-captured headed: climb views clean at every width, ramp start reads slightly from above like a real flight deck, frame budget unchanged (median/p95 16.7 ms, objects [28, 28, 28]), Memphis spec 7/7.

- **2026-08-29 — Owner-directed follow-on: retry, scenery, connected roofline, easier tuning.** In-session the owner asked for a retry button, more background scenery, the canopy roof connected to the terminal, and an easier scene. Delivered as: (1) the safe-retry control is now always visible during the departure as "Retry from checkpoint" (same restore semantics; wrong answers still never erase earned beats); (2) softened rules — corridor warning/restore 0.4/0.6 with a 1.1 s grace window, climb bands 0.45/0.4 with a 1.5 s instability window, early-rotation mistake decoupled (0.48 strong pull) from the rotation requirement (0.25 gentle pull) — proven RED-first in Vitest with two e2e drives re-tuned to genuinely leave the softer corridor; (3) `KMEM_FIELD` plus west/north/east tree lines close the void horizon (new layout validation keeps background ≥100 m from the route) and `KMEM_TERMINAL_CLERESTORY` seats the martini-glass canopy on a dark recessed band; the model-contract material budget rose from six to eight with rationale, and assembly/shading re-ran under the approval-003 records at 32 objects / 22 meshes / 736 triangles / 8 materials, deployable GLB `e730c591…`. Frame budget unchanged (median/p95 16.7 ms, objects [33, 33, 33]); evidence re-captured at every width.

- **2026-08-29 owner report: completion "not returning to the rest of the DC-9 parts" — investigated, not reproducible on the current build, coverage hole closed:** no test had ever completed the departure with the real environment mounted (the accessible completion ran under `?skip3d=1` and the real-GLB helper stopped at climb entry). Three new headed real-environment tests now prove the return to Home Operations for the clean seeded climb (6.3 s), an adversarial run surviving an over-pull instability mistake, a mid-climb "Retry from checkpoint" press, and a window-blur pause (10.6 s), and a full continuous native play-through from ramp release (13.2 s) — each also asserting the environment unmounts and the save records `checkpoint: complete`. A new storage unit test locks the reload self-heal for the one stuck shape a broken session could persist (`departure.completed` with stage still `memphisDeparture` normalizes to `homeOperations`). The three drive tests skip with an explicit renderer-named reason under software rasterisers, whose few-fps frames desynchronise wall-clock drives from the 0.1 s-capped simulation steps. Most probable cause of the report: a stale tab served across today's many rebuilds, or a save written by such a session — both healed by a refresh on the current build.

## Decision log

- **2026-08-28 — West-frontage composition with right satellite arm.** Executing option 1 on `asset/dc9-memphis-terminal-composition`: `ConcourseB.obj` (−242, 250, rot 0) and `ConcourseB_2.obj` (−200, 385, rot 90) form a continuous Concourse B frontage lining the west side of the departure corridor — readable dead ahead at every viewport width from ramp release and staying abeam through taxi, lineup, takeoff roll, and climb — while `ConcourseB_2e.obj` (18, 118, rot 116) stands on the ramp apron as a near-right satellite arm rewarding the look-right cue. Anchors, camera, yaw, FOV, look limits, and panel are untouched. The same stage adds the route-over-void ground fix and hardens the pure layout validator (windshield coverage, pavement shoulder, corridor clearance) so both failure modes are regression-locked.
- **2026-08-28 — Martini-glass canopy accent (owner conversational approval, delegated judgment).** After reviewing agent-gathered Memphis reference imagery, the single most recognizable feature of the real terminal is its winged "martini glass" roofline, visible from the apron. The owner replied "Sure, if you think it will make it better" to adding a stylized project-authored canopy row, delegating the detail judgment. Built as `KMEM_TERMINAL_CANOPY`: eight modules over the main block, each two thin slabs sweeping from a low valley over a slender column to raised tips, floating 2.5 m above the roof so the air gap reads as the recessed glazing band (tips at 17.07 m vs the 11.07 m roof). Authored purely in `TERMINAL_CANOPY`/`terminal_canopy_parts()` with a fail-closed exported-bounds check; explicitly a memory accent, not an architectural reconstruction. The shading stage will assign a matte off-white `KMEM_CANOPY_MATERIAL` (sixth and final material within the contract budget) and the ramp material to `KMEM_TERMINAL_APRON`.
- **2026-08-28 — Task 10 composition option 1 selected.** The owner chose a future environment-layout-only repair that moves Concourse B relative to the guided route while preserving the exact fixed cockpit camera, neutral yaw, position, FOV, look limits, and cockpit-first interaction contract. This checkpoint does not perform that asset composition work; Task 10 remains `NEEDS_CONTEXT` until the separately controlled asset branch produces and proves the revised layout.
- **2026-08-27 — Guided cockpit-first route.** Use a compressed spline and checkpoint corridor rather than free taxi. This produces meaningful control gameplay without building a full airport.
- **2026-08-27 — Present-day aircraft remains parked.** The windshield sequence is an interactive 1995 memory recreation and returns to the parked Final Flight Log after initial climb.
- **2026-08-27 — Separate environment GLB.** Do not rebuild or enlarge 'dc9-cockpit.glb'; lazy-load a KMEM-only model during 'memphisDeparture'.
- **2026-08-27 — Owner-attested source permission.** Record the user's attestation that this private, noncommercial game has permission, preserve Ted Davis credit, and proceed without an external permission stop.
- **2026-08-27 — Qualitative controls only.** Use normalized energy, alignment, and rotation bands; no operational values or procedures.
- **2026-08-27 — Durable checkpoints, transient frame.** Persist only completed beats, checkpoint, attempts, hint level, and completion. Reloads restore a canonical stopped frame.
- **2026-08-27 — Sequential asset stages.** The new source and importer require Agent 1 source review, Agent 2 assembly review, and Agent 3 material review on separate branches before browser integration.

## Milestones

1. **Source authority is reproducible.** The selected archive and six files match immutable hashes, excluded content is absent, permission basis and credit are recorded, and the reference-authority gate validates.
2. **Rules are deterministic.** Pure tests prove taxi, hold short, lineup, takeoff, rotation, climb, mistakes, and checkpoint restoration without React or Three.js.
3. **Progress is durable.** Schema 14 inserts the new stage without moving old saves backward.
4. **Accessible gameplay works without 3D.** A keyboard or native-control player can complete every beat using qualitative text.
5. **Concourse B is production-ready.** The approved Blender master and GLB preserve selected source geometry, packed textures, path anchors, extras, and validation evidence.
6. **Cockpit-first browser play works.** The existing right-seat cockpit stays visible while Concourse B, taxi path, runway, and initial climb move around it.
7. **Approval evidence is complete.** Responsive screenshots, private preview, full checks, asset report, ExecPlan, and 'TEST_REPORT.md' support the DC-9 visual gate.

## Implementation tasks

### Task 1: Lock source authority, permission basis, and immutable intake

**Files:**

- Modify: 'docs/superpowers/specs/2026-08-27-dc9-memphis-legacy-departure-design.md'
- Create: 'art-source/cockpit-pipeline/gates/agent0-dc9-memphis-legacy-authority.json'
- Create: 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/job.json'
- Create: 'tools/assets/dc9-memphis-source-contract.mjs'
- Create: 'tools/assets/dc9-memphis-source-contract.test.mjs'
- Create: 'asset-reports/dc9-memphis-source-intake.json'
- Modify: 'package.json'

**Interfaces:**

- Consumes: owner approval and permission attestation dated 2026-08-27; the direct source URL and archive hash from the spec.
- Produces: 'validateDc9MemphisSourceRecord(record): string[]', 'writeDc9MemphisSourceRecord(sourceDir, outputPath)', and an approved reference-authority gate for local source intake.

- [ ] **Step 1: Write the source-contract tests**

~~~js
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DC9_MEMPHIS_ALTERNATIVES,
  DC9_MEMPHIS_ARCHIVE_SHA256,
  DC9_MEMPHIS_SELECTED_FILES,
  validateDc9MemphisSourceRecord,
} from './dc9-memphis-source-contract.mjs'

test('accepts only the owner-approved archive, files, permission basis, and credit', () => {
  const record = {
    archiveSha256: DC9_MEMPHIS_ARCHIVE_SHA256,
    permissionBasis: 'owner-attested-private-noncommercial-2026-08-27',
    credit: 'Memphis scenery derived from the Memphis/Nashville Scenery Package by Ted Davis.',
    selectedFiles: DC9_MEMPHIS_SELECTED_FILES.map((entry) => ({ ...entry })),
    excludedFamilies: ['AutoGate/', 'opensceneryx/', 'Planes/'],
    alternatives: DC9_MEMPHIS_ALTERNATIVES.map((entry) => ({ ...entry })),
  }
  assert.deepEqual(validateDc9MemphisSourceRecord(record), [])
})

test('rejects an added library object or changed source hash', () => {
  const errors = validateDc9MemphisSourceRecord({
    archiveSha256: 'changed',
    permissionBasis: 'owner-attested-private-noncommercial-2026-08-27',
    credit: 'Memphis scenery derived from the Memphis/Nashville Scenery Package by Ted Davis.',
    selectedFiles: [
      ...DC9_MEMPHIS_SELECTED_FILES,
      { path: 'AutoGate/Jetways-Steel/AutoGate-14m-steel.obj', sha256: 'changed' },
    ],
    excludedFamilies: ['AutoGate/', 'opensceneryx/', 'Planes/'],
    alternatives: DC9_MEMPHIS_ALTERNATIVES.map((entry) => ({ ...entry })),
  })
  assert.ok(errors.some((error) => error.includes('archive SHA-256')))
  assert.ok(errors.some((error) => error.includes('selected file set')))
})
~~~

- [ ] **Step 2: Run the tests and verify RED**

Run: 'node --test tools/assets/dc9-memphis-source-contract.test.mjs'

Expected: FAIL with module-not-found for 'dc9-memphis-source-contract.mjs'.

- [ ] **Step 3: Implement exact immutable source constants and validation**

~~~js
export const DC9_MEMPHIS_ARCHIVE_SHA256 =
  'fc403141223be066094814d9ea06d820f75477fea419870b04ffd65153434b95'

export const DC9_MEMPHIS_SELECTED_FILES = [
  { path: 'KMEM/ConcourseB.obj', sha256: 'e88ab8411a033d5996c53053b14a894ff9824380a76891b27659549a7e9e6424' },
  { path: 'KMEM/ConcourseB_2.obj', sha256: 'e4bb0f830c515d9c5a42cfe60bce5eb4dc3fb6ba5fdce6ca9c66d16ef49f7000' },
  { path: 'KMEM/ConcourseB_2e.obj', sha256: '2bf6f39b0e5e1f6a2e24fefb9469fc1c598884ddcfefc9f20b825cac375a109d' },
  { path: 'KMEM/KMEMterminal.png', sha256: '416c081c5e9f9ca40b183477da54f7ec8c5baa62ae0b9c0bdd961329ac394505' },
  { path: 'KMEM/KMEMterminal_LIT.png', sha256: '6a561147ceae328b311fba38de849d3102a4d2eb1238c3ddbbfb2315b7cf91e5' },
  { path: 'KMEM/KMEMterminal_NML.png', sha256: '9e1f272c64807981bee997aa08e7a3273ab5c4242f4ff58fb92cc20b1f8bf7e8' },
]

export const DC9_MEMPHIS_PERMISSION_BASIS =
  'owner-attested-private-noncommercial-2026-08-27'

export const DC9_MEMPHIS_ALTERNATIVES = [
  {
    url: 'https://forums.x-plane.org/files/file/12796-kmem-memphis-international-airport/',
    decision: 'rejected',
    reason: 'Requires OpenSceneryX and does not provide a clearer portable Concourse B authority.',
  },
  {
    url: 'https://forums.x-plane.org/files/file/25605-kmem-fdx-memphis-fedex-hub/',
    decision: 'rejected',
    reason: 'FedEx-hub focus and mixed third-party objects do not match the older passenger Concourse B target.',
  },
]
~~~

The CLI must hash the archive and selected extracted files, reject missing or additional selected files, record dimensions for the three textures, require both rejected alternatives with reasons, record the exact exclusion families, and write stable JSON with no build timestamp.

- [ ] **Step 4: Preserve and extract the untouched source**

Run:

~~~bash
mkdir -p .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted
curl --fail --location --output .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/Memphis_Nashville.zip https://theosdavis.com/xpfiles/ewExternalFiles/Memphis_Nashville.zip
unzip -q .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/Memphis_Nashville.zip -d .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted
~~~

Expected: archive SHA-256 equals the immutable constant. Do not execute anything from the archive.

- [ ] **Step 5: Add and validate the structured authority/job files**

The reference-authority JSON must set:

~~~json
{
  "gate": "reference-authority",
  "artifactId": "agent0-dc9-memphis-legacy-authority",
  "createdAt": "2026-08-27T00:00:00Z",
  "sceneGroup": "DC-9 First-Officer Memphis legacy departure environment",
  "targetAircraftOrObject": "Older Memphis International Airport Concourse B memory environment",
  "targetVariantStatus": "1995 memory recreation, not an exact architectural reconstruction",
  "sourceCandidateType": "simulator-geometry",
  "sourceIdentity": "Ted Davis Memphis/Nashville X-Plane 11.3 package, Concourse B objects only",
  "allowedUsage": [
    "private noncommercial CockpitEscapeRoom geometry base",
    "Blender cleanup, optimization, and derived runtime GLB",
    "private browser preview with attribution"
  ],
  "forbiddenUsage": [
    "operational airport training",
    "claim of exact 1995 reconstruction",
    "AutoGate, OpenSceneryX, bundled aircraft, vehicles, or unrelated scenery import"
  ],
  "variantCompatibility": "Environment-only source; it may not override DC-9-32 cockpit authority.",
  "ownerApprovalStatus": "approved-for-next-stage",
  "nextAllowedStage": "agent1-sourcing"
}
~~~

The source job JSON must be:

~~~json
{
  "jobId": "dc9-memphis-legacy-source",
  "title": "DC-9 Memphis legacy departure environment sourcing",
  "stage": "requested",
  "aircraft": "dc9",
  "sourceVariant": "Ted Davis KMEM X-Plane scenery revision 2019-01-22",
  "targetVariant": "1995 Memphis memory recreation",
  "variantScope": "common",
  "sourceRepository": {
    "url": "https://theosdavis.com/xpfiles/ewExternalFiles/Memphis_Nashville.zip",
    "resolvedRevision": "sha256-fc403141223be066094814d9ea06d820f75477fea419870b04ffd65153434b95"
  },
  "requestedComponents": [
    {
      "componentId": "kmem-concourse-b-main-001",
      "label": "Concourse B main terminal geometry",
      "quantity": 1,
      "acceptanceNotes": "Import ConcourseB.obj with its selected KMEM terminal texture set; environment geometry only."
    },
    {
      "componentId": "kmem-concourse-b-extension-001",
      "label": "Concourse B extension geometry",
      "quantity": 1,
      "acceptanceNotes": "Import ConcourseB_2.obj; exclude every AutoGate, aircraft, vehicle, and unrelated object."
    },
    {
      "componentId": "kmem-concourse-b-extension-east-001",
      "label": "Concourse B east extension geometry",
      "quantity": 1,
      "acceptanceNotes": "Import ConcourseB_2e.obj; retain owner-attested private noncommercial attribution."
    }
  ],
  "stageDirectories": {
    "sourceInput": "art-source/cockpit-pipeline/stages/source/input",
    "sourceOutput": "art-source/cockpit-pipeline/stages/source/output",
    "assemblyInput": "art-source/cockpit-pipeline/stages/assembly/input",
    "assemblyOutput": "art-source/cockpit-pipeline/stages/assembly/output",
    "shadingInput": "art-source/cockpit-pipeline/stages/shading/input",
    "shadingOutput": "art-source/cockpit-pipeline/stages/shading/output"
  },
  "cachePolicy": {
    "environmentVariable": "COCKPIT_PIPELINE_CACHE",
    "defaultRelativePath": ".cache/cockpit-pipeline",
    "gitPolicy": "outside-git"
  }
}
~~~

Add this package script:

~~~json
"asset:dc9-memphis:intake": "node tools/assets/dc9-memphis-source-contract.mjs --source-dir .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville --output asset-reports/dc9-memphis-source-intake.json"
~~~

Run:

~~~bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate reference-authority art-source/cockpit-pipeline/gates/agent0-dc9-memphis-legacy-authority.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/job.json
node --test tools/assets/dc9-memphis-source-contract.test.mjs
npm run asset:dc9-memphis:intake
~~~

Expected: all commands exit 0; the report lists exactly six selected files and three exclusion families.

- [ ] **Step 6: Commit the source authority checkpoint**

~~~bash
git add docs/superpowers/specs/2026-08-27-dc9-memphis-legacy-departure-design.md art-source/cockpit-pipeline/gates/agent0-dc9-memphis-legacy-authority.json art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/job.json tools/assets/dc9-memphis-source-contract.mjs tools/assets/dc9-memphis-source-contract.test.mjs asset-reports/dc9-memphis-source-intake.json package.json
git commit -m "chore(assets): lock Memphis Concourse B source"
~~~

### Task 2: Build the pure departure simulation

**Files:**

- Create: 'src/game/dc9MemphisDeparture.ts'
- Create: 'src/game/dc9MemphisDeparture.test.ts'

**Interfaces:**

- Consumes: normalized 'Dc9ControlState' from 'dc9Input.ts', plus brake and lineup confirmation.
- Produces: 'Dc9DepartureProgress', 'Dc9DepartureFrame', 'Dc9DepartureInput', 'Dc9DepartureEvent', 'createInitialDc9DepartureProgress', 'normalizeDc9DepartureProgress', 'canonicalDc9DepartureFrame', 'advanceDc9DepartureFrame', 'advanceDc9DepartureProgress', 'recordDc9DepartureMistake', and 'dc9DepartureGuidance'.

- [ ] **Step 1: Write RED tests for checkpoint order and restoration**

~~~ts
import { describe, expect, it } from 'vitest'
import {
  advanceDc9DepartureFrame,
  canonicalDc9DepartureFrame,
  createInitialDc9DepartureProgress,
  normalizeDc9DepartureProgress,
} from './dc9MemphisDeparture'

describe('DC-9 Memphis departure', () => {
  it('starts stopped at the Concourse B ramp', () => {
    expect(canonicalDc9DepartureFrame('rampStart')).toMatchObject({
      beat: 'rampRelease',
      pathProgress: 0,
      energy: 0,
      safeHold: true,
    })
  })

  it('cannot cross hold short until stopped and explicitly confirmed', () => {
    const frame = canonicalDc9DepartureFrame('holdShort')
    const moving = advanceDc9DepartureFrame(frame, {
      pitch: 0, roll: 0, rudder: 0, thrust: 0.4, brake: 0, lineupConfirmed: true,
    }, 1 / 60)
    expect(moving.frame.beat).toBe('holdShort')
    expect(moving.event).toBeUndefined()
  })

  it('restores malformed progress to the earliest trustworthy checkpoint', () => {
    expect(normalizeDc9DepartureProgress({
      checkpoint: 'not-real',
      completedBeats: ['takeoffRoll'],
      attempts: { taxi: -3 },
      hintLevel: 9,
    })).toEqual(createInitialDc9DepartureProgress())
  })
})
~~~

- [ ] **Step 2: Run the focused test and verify RED**

Run: 'npm test -- --run src/game/dc9MemphisDeparture.test.ts'

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the public types and canonical frames**

~~~ts
export type Dc9DepartureCheckpoint =
  | 'rampStart'
  | 'taxiTurn'
  | 'holdShort'
  | 'runwayLineup'
  | 'initialClimb'
  | 'complete'

export type Dc9DepartureBeat =
  | 'rampRelease'
  | 'taxi'
  | 'holdShort'
  | 'lineup'
  | 'takeoffRoll'
  | 'rotation'
  | 'initialClimb'
  | 'complete'

export interface Dc9DepartureInput {
  pitch: number
  roll: number
  thrust: number
  rudder: number
  brake: number
  lineupConfirmed: boolean
}

export interface Dc9DepartureProgress {
  checkpoint: Dc9DepartureCheckpoint
  completedBeats: Dc9DepartureBeat[]
  attempts: Partial<Record<Dc9DepartureBeat, number>>
  hintLevel: 0 | 1 | 2 | 3
  completed: boolean
}

export interface Dc9DepartureFrame {
  beat: Dc9DepartureBeat
  pathProgress: number
  lateralError: number
  headingError: number
  energy: number
  altitudeProgress: number
  pitch: number
  roll: number
  safeHold: boolean
  deviationSeconds: number
}

export interface Dc9DepartureGuidance {
  alignment: 'centered' | 'left' | 'right'
  energy: 'stopped' | 'rolling' | 'departure-thrust'
  intent: string
  correctiveText: string
}
~~~

Use frozen checkpoint-order and beat-order arrays. Clamp every normalized number, bound delta time to 0.1 seconds, ignore non-finite/negative deltas, and return a new frame rather than mutating the input.

Use these fictional normalized tuning values as the initial test contract:

~~~ts
const RAMP_RELEASE_END = 0.12
const HOLD_SHORT_START = 0.42
const RUNWAY_LINEUP_START = 0.52
const ROTATION_CUE_START = 0.78
const INITIAL_CLIMB_START = 0.84
const TAXI_ENERGY_LIMIT = 0.28
const PATH_WARNING_ERROR = 0.32
const PATH_RESTORE_ERROR = 0.55
const PATH_RESTORE_SECONDS = 0.75
const ROTATION_PITCH_MIN = 0.35
const CLIMB_PITCH_ABS_MAX = 0.3
const CLIMB_ROLL_ABS_MAX = 0.28
~~~

- [ ] **Step 4: Add RED tests for successful taxi, takeoff, and mistakes**

Cover:

- thrust plus centered rudder advances ramp release;
- sustained rudder error emits one 'pathDeviation' mistake and stops at the current checkpoint;
- brake plus closed thrust enters the hold-short safe state;
- lineup confirmation is ignored until stopped;
- early pitch cannot complete rotation;
- the cue-window pitch band enters initial climb;
- relaxed pitch and small roll complete initial climb;
- a 10-second delta cannot skip a checkpoint;
- attempt count raises hint level from 0 through 3 without deleting completed beats.

- [ ] **Step 5: Implement the minimal deterministic transition table**

Use one switch on 'frame.beat'. Each beat may emit at most one event:

~~~ts
export type Dc9DepartureEvent =
  | { type: 'checkpoint'; checkpoint: Dc9DepartureCheckpoint }
  | { type: 'mistake'; beat: Dc9DepartureBeat; reason: 'pathDeviation' | 'unsafeHold' | 'earlyRotation' | 'unstableClimb' }
  | { type: 'complete' }

export interface Dc9DepartureStep {
  frame: Dc9DepartureFrame
  event?: Dc9DepartureEvent
}
~~~

Use qualitative normalized thresholds held only in this module. Do not name constants after knots, runway numbers, engine pressure, flap settings, or real procedures.

- [ ] **Step 6: Run pure tests GREEN**

Run:

~~~bash
npm test -- --run src/game/dc9MemphisDeparture.test.ts
npm run typecheck
~~~

Expected: focused Vitest passes and TypeScript exits 0.

- [ ] **Step 7: Commit the pure rules**

~~~bash
git add src/game/dc9MemphisDeparture.ts src/game/dc9MemphisDeparture.test.ts
git commit -m "feat(dc9): add deterministic Memphis departure rules"
~~~

### Task 3: Insert the stage and migrate schema 13 to 14

**Files:**

- Modify: 'src/game/config.ts'
- Modify: 'src/game/state.ts'
- Modify: 'src/game/state.test.ts'
- Modify: 'src/game/storage.ts'
- Modify: 'src/game/storage.test.ts'
- Modify: the seven existing e2e files containing typed 'dc9' seed objects

**Interfaces:**

- Consumes: pure progress helpers from Task 2.
- Produces: schema 14, 'dc9.departure', stage 'memphisDeparture', and reducer actions 'SAVE_DC9_DEPARTURE_CHECKPOINT', 'RECORD_DC9_DEPARTURE_MISTAKE', 'RESTORE_DC9_DEPARTURE_CHECKPOINT', and 'COMPLETE_DC9_MEMPHIS_DEPARTURE'.

- [ ] **Step 1: Change reducer tests first**

Update the route-flow test to expect:

~~~ts
expect(state.dc9.routeCompleted).toEqual(['DTW', 'MSP', 'STL'])
expect(state.dc9.stage).toBe('memphisDeparture')

state = gameReducer(state, {
  type: 'SAVE_DC9_DEPARTURE_CHECKPOINT',
  checkpoint: 'initialClimb',
})
state = gameReducer(state, { type: 'COMPLETE_DC9_MEMPHIS_DEPARTURE' })
expect(state.dc9.departure.completed).toBe(true)
expect(state.dc9.stage).toBe('homeOperations')
~~~

Add tests proving wrong-stage actions are identity, checkpoint order cannot be skipped, a mistake increments only the active beat, restore preserves route completion, and completion is accepted only from 'initialClimb'.

- [ ] **Step 2: Run reducer tests RED**

Run: 'npm test -- --run src/game/state.test.ts'

Expected: FAIL because 'departure', actions, and stage do not exist.

- [ ] **Step 3: Add schema 14 state and guarded reducer transitions**

Add 'memphisDeparture' between 'routeRecord' and 'homeOperations', add 'departure: Dc9DepartureProgress' to 'Dc9ChapterProgress', initialize it with 'createInitialDc9DepartureProgress()', and set 'GAME_SCHEMA_VERSION = 14'.

Add these exact action shapes:

~~~ts
| { type: 'SAVE_DC9_DEPARTURE_CHECKPOINT'; checkpoint: Dc9DepartureCheckpoint }
| { type: 'RECORD_DC9_DEPARTURE_MISTAKE'; beat: Dc9DepartureBeat }
| { type: 'RESTORE_DC9_DEPARTURE_CHECKPOINT' }
| { type: 'COMPLETE_DC9_MEMPHIS_DEPARTURE' }
~~~

Correct route submission must set:

~~~ts
dc9: {
  ...state.dc9,
  stage: 'memphisDeparture',
  routeSelections: [...approved],
  routeCompleted: [...approved],
}
~~~

Departure completion must require the active stage and checkpoint 'initialClimb', then set full departure progress and stage 'homeOperations'. No departure action may mutate route fields.

- [ ] **Step 4: Write schema migration tests RED**

Add tests for:

- schema 13 at 'routeRecord' remains at route record with initial departure progress;
- schema 13 at 'homeOperations', 'instrumentScan', 'shutdown', 'qualification', 'keyReveal', or 'complete' receives a completed departure;
- schema 14 at 'memphisDeparture' reloads the latest valid checkpoint;
- malformed checkpoint, attempts, beats, and hint level normalize safely;
- reward and Mars saves remain completed;
- reset returns departure to 'rampStart'.

- [ ] **Step 5: Implement source-version-aware normalization**

Pass source schema version into 'normalizeDc9Progress'. For versions below 14, route-complete evidence means the old build had already crossed the insertion point, so create completed departure progress. For schema 14, normalize the saved departure and preserve 'memphisDeparture' only when routes are complete and departure is incomplete.

Update 'fullDc9Progress' to include completed departure progress. Add 'normalizeV14' and load it before 'migrateV13'.

- [ ] **Step 6: Update typed seed objects without weakening their earned state**

For every completed DC-9 seed, add:

~~~ts
departure: {
  checkpoint: 'complete',
  completedBeats: ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation', 'initialClimb', 'complete'],
  attempts: {},
  hintLevel: 0,
  completed: true,
},
~~~

Do not change the intended phase, reward, qualification, or scenario state in those fixtures.

- [ ] **Step 7: Run reducer, storage, and type checks GREEN**

Run:

~~~bash
npm test -- --run src/game/state.test.ts src/game/storage.test.ts
npm run typecheck
~~~

Expected: all focused tests and typecheck pass.

- [ ] **Step 8: Commit durable progression**

~~~bash
git add src/game/config.ts src/game/state.ts src/game/state.test.ts src/game/storage.ts src/game/storage.test.ts e2e
git commit -m "feat(dc9): persist Memphis departure progress"
~~~

### Task 4: Drive the departure runtime and safe brake input

**Files:**

- Modify: 'src/game/dc9Input.ts'
- Modify: 'src/game/dc9Input.test.ts'
- Modify: 'src/game/useDc9FlightControls.ts'
- Create: 'src/game/useDc9MemphisDeparture.ts'
- Modify: 'src/App.tsx'

**Interfaces:**

- Consumes: live 'controlsRef', durable departure progress, reduced-motion flag, and Task 2 frame advancement.
- Produces: 'Dc9MemphisDepartureRuntime' with 'frame', 'frameRef', 'guidance', 'brakeHeld', 'setBrakeHeld', 'confirmLineup', 'restoreCheckpoint', and 'active'.

- [ ] **Step 1: Add RED input tests**

Prove that the brake demand clamps to 0..1, 'Space' is reserved only while departure is active, and reset returns pitch/roll/rudder/thrust to neutral/closed.

- [ ] **Step 2: Run focused input tests RED**

Run: 'npm test -- --run src/game/dc9Input.test.ts'

Expected: FAIL on missing brake normalization and reset behavior.

- [ ] **Step 3: Extend the flight-control runtime without changing mappings**

Keep 'Dc9ControlState' unchanged. Add 'resetControls(): void' to 'Dc9FlightControlsRuntime'. Activate flight controls when the stage is either 'controlCheck' or 'memphisDeparture', but call 'APPLY_DC9_CONTROL_CHECK' only while the reducer is actually in 'controlCheck'.

Enable direct yoke drag in both stages. Existing W/S, A/D, and arrow mappings remain unchanged.

- [ ] **Step 4: Implement the departure hook**

The hook owns one rAF loop and publishes HTML state no more often than every 80 ms:

~~~ts
export interface Dc9MemphisDepartureRuntime {
  active: boolean
  frame: Dc9DepartureFrame
  frameRef: React.RefObject<Dc9DepartureFrame>
  guidance: Dc9DepartureGuidance
  brakeHeld: boolean
  setBrakeHeld: (pressed: boolean) => void
  confirmLineup: () => void
  restoreCheckpoint: () => void
}
~~~

Use this option contract:

~~~ts
interface UseDc9MemphisDepartureOptions {
  active: boolean
  progress: Dc9DepartureProgress
  controlsRef: React.RefObject<Dc9ControlState>
  reducedMotion: boolean
  resetControls: () => void
  onCheckpoint: (checkpoint: Dc9DepartureCheckpoint) => void
  onMistake: (beat: Dc9DepartureBeat) => void
  onRestore: () => void
  onComplete: () => void
}
~~~

On 'blur' or hidden visibility:

1. cancel active lineup confirmation;
2. hold a pause latch;
3. restore the canonical durable checkpoint;
4. call 'resetControls()';
5. require fresh player input before advancing again.

Dispatch durable events once by event identity. Never dispatch every animation frame.

- [ ] **Step 5: Wire callbacks in App**

Map checkpoint, mistake, restore, and complete events to the Task 3 actions. Pass the runtime to 'Dc9Chapter' and 'PrototypeScene'. Keep the runtime inactive outside the new stage.

- [ ] **Step 6: Run focused and regression tests**

Run:

~~~bash
npm test -- --run src/game/dc9Input.test.ts src/game/dc9MemphisDeparture.test.ts src/game/state.test.ts
npm run typecheck
~~~

Expected: all commands exit 0.

- [ ] **Step 7: Commit runtime control**

~~~bash
git add src/game/dc9Input.ts src/game/dc9Input.test.ts src/game/useDc9FlightControls.ts src/game/useDc9MemphisDeparture.ts src/App.tsx
git commit -m "feat(dc9): drive Memphis departure controls"
~~~

### Task 5: Add the native departure panel and accessible path

**Files:**

- Create: 'src/components/dc9/Dc9AxisControls.tsx'
- Create: 'src/components/dc9/MemphisDeparturePanel.tsx'
- Modify: 'src/components/dc9/ControlCheckPanel.tsx'
- Modify: 'src/components/dc9/Dc9Chapter.tsx'
- Modify: 'src/components/dc9/dc9Chapter.css'
- Create: 'e2e/dc9-memphis-departure.spec.ts'

**Interfaces:**

- Consumes: Task 4 runtime, existing control state/input method/hold callbacks, and environment load state.
- Produces: equivalent native controls, qualitative live status, lineup confirmation, checkpoint restore, and responsive departure presentation.

- [ ] **Step 1: Write the accessible Playwright path RED**

Seed schema 14 at 'memphisDeparture', load '?skip3d=1', and assert:

~~~ts
await expect(page.getByRole('heading', { name: 'Memphis Legacy Departure' })).toBeVisible()
await expect(page.getByText('Fictional — non operational')).toBeVisible()
await page.getByRole('button', { name: 'Advance thrust levers' }).dispatchEvent('pointerdown')
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Advance thrust levers' }).dispatchEvent('pointerup')
await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/centered|steer/i)
~~~

Continue through every beat with native controls, including brake and 'Ready to line up', and assert the final stage is 'homeOperations'.

- [ ] **Step 2: Run the new e2e test RED**

Run: 'npx playwright test e2e/dc9-memphis-departure.spec.ts --project=chromium'

Expected: FAIL because the heading and controls do not exist.

- [ ] **Step 3: Extract axis controls without changing Control Check behavior**

Move the four axis rows, meter semantics, hold pointer/keyboard handlers, and input-method copy into 'Dc9AxisControls'. 'ControlCheckPanel' must still render the same labels, data attributes, and accessible names so its existing browser tests remain unchanged.

- [ ] **Step 4: Implement MemphisDeparturePanel**

Render:

- title and '1995 MEMORY · FICTIONAL — NON OPERATIONAL';
- active beat label and one-sentence intent;
- qualitative alignment, energy, and safe-boundary status;
- only the relevant axis controls, using the shared component;
- a press-and-hold brake button with 'aria-pressed';
- 'Ready to line up' only while stopped at hold short;
- 'Restore checkpoint' after hint level 3 or a load failure;
- a polite atomic live region that changes only on beat, mistake, hint, restore, or completion.

Do not put animated frame numbers into the live region.

- [ ] **Step 5: Add responsive and reduced-motion styling**

At 375 px, controls stack below the guidance without covering the windshield center. At 768 px, use a two-column panel. At 1440 px, keep the panel to a lower/side band. Use color plus text for centered/left/right states.

- [ ] **Step 6: Run accessible and existing DC-9 browser tests GREEN**

Run:

~~~bash
npx playwright test e2e/dc9-memphis-departure.spec.ts e2e/smoke.spec.ts --project=chromium
npm run lint
npm run typecheck
~~~

Expected: new accessible path and existing control-check/route tests pass.

- [ ] **Step 7: Commit native gameplay**

~~~bash
git add src/components/dc9 src/App.tsx e2e/dc9-memphis-departure.spec.ts
git commit -m "feat(dc9): add accessible Memphis departure panel"
~~~

### Task 6: Import and approve the source-only Concourse B candidate

**Files:**

- Create: 'tools/blender/inspect_dc9_memphis_source.py'
- Create: source candidate metadata, validation, GLB, preview, and contact sheet under 'art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/'
- Create: 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/manifests/sourcing-complete.json'
- Create after review: 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/source-approval.json'
- Modify: 'asset-reports/dc9-memphis-legacy-departure.md'
- Modify: this ExecPlan

**Interfaces:**

- Consumes: Task 1 reference-authority gate, source job, verified cache files, and 'add_source_object' from 'xplane_obj8_blender_import.py'.
- Produces: an Agent 1 source-only candidate containing exactly three imported objects, immutable metadata, previews, a validated sourcing manifest, and explicit owner approval before assembly.

- [x] **Step 0: Create the isolated source branch**

Run: 'git switch -c asset/dc9-memphis-source'

Expected: clean stage branch based on the current feature branch. Do not edit gameplay files on this branch.

- [x] **Step 1: Write a source-inspector regression test RED**

Extend 'test_xplane_obj8_convert.py' with a fixture-list test for a new pure helper:

~~~py
from tools.blender.inspect_dc9_memphis_source import selected_source_names

def test_kmem_source_inspector_admits_only_concourse_b_objects():
    assert selected_source_names() == (
        "ConcourseB.obj",
        "ConcourseB_2.obj",
        "ConcourseB_2e.obj",
    )
~~~

The module must keep 'bpy' imports inside Blender-only functions so this pure selection helper is testable under ordinary Python.

- [x] **Step 2: Run the focused test RED**

Run: 'python3 -m unittest tools.blender.cockpit_pipeline.tests.test_xplane_obj8_convert'

Expected: FAIL because 'inspect_dc9_memphis_source.py' does not exist.

- [x] **Step 3: Implement Agent 1 source-only inspection**

The inspector must:

1. verify the Task 1 authority artifact and six selected hashes;
2. import only the three Concourse B objects into a neutral 'KMEM_CONCOURSE_B_SOURCE_CANDIDATE' root;
3. preserve source scale/orientation and use one neutral base-color material without project-authored ground, path, anchors, game IDs, or final shading;
4. export a candidate GLB, per-object metadata/validation JSON, three orthographic previews, and one contact sheet;
5. record the measured 178/30/24 source triangles, bounds, texture declarations, unsupported 'TEXTURE_NORMAL' directive, and later-revision historical limitation;
6. keep the disposable Blender scene and first export under '.cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/optimized/';
7. emit a sourcing-complete manifest whose published output hashes and byte counts are computed from written files.

After successful generation, change the tracked source job's 'stage' from 'requested' to 'sourcing_complete'. The approval file, not the job stage alone, authorizes Agent 2.

- [x] **Step 4: Run Agent 1 with safe Blender flags**

Run:

~~~bash
/home/user1/.local/bin/blender --background --factory-startup --disable-autoexec --python tools/blender/inspect_dc9_memphis_source.py -- --source-dir .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/Memphis_Nashville/KMEM --working-dir .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/optimized --output-dir art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source --manifest art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/manifests/sourcing-complete.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/manifests/sourcing-complete.json
npx gltf-transform validate art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source/dc9-memphis-concourse-b-source.glb
~~~

Expected: all commands exit 0 and the manifest remains unapproved.

**Execution evidence — 2026-08-28:** On `asset/dc9-memphis-source`, the focused unit test was RED with `ModuleNotFoundError: No module named 'tools.blender.inspect_dc9_memphis_source'`, then GREEN (9 tests). Blender 5.1.2 ran with the required background/factory/autoexec-disabled flags, verified the Task 1 authority plus archive and all six selected hashes before importing exactly the three approved Concourse B OBJ8 files, and produced the cache-only `.blend`/first GLB plus the tracked unapproved candidate artifacts. The final manifest validator passed with verified hashes; `gltf-transform validate` reported no errors, warnings, infos, or hints; and `git diff --check` passed. The generated contact sheet and all three previews were inspected for obvious blank/corrupt output only. The headless process emitted EGL and Blender user-cache write messages, but it completed and wrote the specified artifacts.

- [x] **Step 5: Inspect and approve the Source Review Gate**

Show the owner the source contact sheet, three object previews, exact source measurements, texture declarations, and exclusions. If approved, write 'source-approval.json' with 'stage: "source-approved"', 'approved: true', 'approvedBy: "owner review 2026-08-27"', the sourcing manifest path, and the exact approved candidate/metadata hashes.

Do not create ramp, taxi, runway, anchors, or production Blender sources before this approval file exists.

**Owner approval — 2026-08-28:** `source-approval.json` records `owner review 2026-08-28`, the exact candidate GLB hash `6cc30543653173d64b2997468009677e72e8923a184aaf886d01b1a842249177`, the metadata hash `70740b2137ac30e06611e39d4f119ada0b889d853e80d4f5d408767a7b200c32`, and the exact `sourcing-complete.json` reference. The approval permits source geometry/orientation for neutral assembly only; textures and final fidelity remain unapproved.

- [x] **Step 6: Revalidate and commit Agent 1**

Run:

~~~bash
python3 -m unittest tools.blender.cockpit_pipeline.tests.test_xplane_obj8_convert
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/manifests/sourcing-complete.json
git diff --check
~~~

Commit:

~~~bash
git add tools/blender/inspect_dc9_memphis_source.py tools/blender/cockpit_pipeline/tests/test_xplane_obj8_convert.py art-source/cockpit-pipeline/stages/source/output/dc9-memphis-legacy-source art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source asset-reports/dc9-memphis-legacy-departure.md plans/0040-dc9-memphis-legacy-departure.md
git commit -m "feat(assets): inspect Memphis Concourse B source"
git switch agent/dc9-memphis-taxi-takeoff
git merge --no-ff asset/dc9-memphis-source
~~~

**Completion evidence — 2026-08-28:** After owner approval, the focused Python test, Task 1 authority/job/sourcing-manifest validation, GLB validation, `sourcing_complete -> source-approved` transition validation, exact approval-to-manifest hash checks, and `git diff --check` passed. Task 6 is committed on the isolated source branch only; controller integration remains pending.

### Task 7: Assemble and approve the neutral Memphis environment

**Files:**

- Create: 'tools/blender/cockpit_pipeline/kmem_legacy_layout.py'
- Create: 'tools/blender/cockpit_pipeline/tests/test_kmem_legacy_layout.py'
- Create: 'tools/blender/assemble_dc9_memphis_legacy.py'
- Create: neutral blend/GLB, layout, node/pivot report, validation, and previews under 'art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/'
- Create: 'art-source/cockpit-pipeline/gates/dc9-memphis-legacy-runtime-contract.json'
- Create: 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/manifests/assembly-complete.json'
- Create after review: 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/assembly-approval.json'
- Modify: 'asset-reports/dc9-memphis-legacy-departure.md'
- Modify: this ExecPlan

**Interfaces:**

- Consumes: Task 6 source approval and approved candidate GLB.
- Produces: neutral scene layout, stable runtime anchors, a validated runtime-contract gate, and owner assembly approval before materials work.

- [x] **Step 0: Create the isolated assembly branch**

Run: 'git switch -c asset/dc9-memphis-assembly'

Expected: branch starts after the approved source branch merge. Do not modify Task 6 outputs in place.

- [x] **Step 1: Write layout tests RED**

~~~py
from tools.blender.cockpit_pipeline.kmem_legacy_layout import (
    ANCHORS,
    CONCOURSE_SOURCE_TRANSFORMS,
    validate_layout,
)

def test_layout_has_unique_ordered_runtime_anchors():
    assert [entry["game_id"] for entry in ANCHORS] == [
        "dc9.memphis.rampStart",
        "dc9.memphis.taxiTurn",
        "dc9.memphis.holdShort",
        "dc9.memphis.runwayLineup",
        "dc9.memphis.initialClimb",
    ]
    assert validate_layout() == []

def test_only_three_approved_source_objects_are_assembled():
    assert sorted(CONCOURSE_SOURCE_TRANSFORMS) == [
        "ConcourseB.obj",
        "ConcourseB_2.obj",
        "ConcourseB_2e.obj",
    ]
~~~

- [x] **Step 2: Run layout tests RED**

Run: 'python3 -m unittest tools.blender.cockpit_pipeline.tests.test_kmem_legacy_layout'

Expected: FAIL because the layout module does not exist.

- [x] **Step 3: Implement the exact neutral layout**

Define root 'KMEM_LEGACY_ROOT', source group 'KMEM_CONCOURSE_B', project-owned 'KMEM_RAMP', 'KMEM_TAXI_SURFACE', and 'KMEM_RUNWAY_SURFACE', plus these game-space anchors:

~~~py
ANCHORS = (
    {"name": "KMEM_RAMP_START", "game_id": "dc9.memphis.rampStart", "location": (0.0, 0.0, 0.0)},
    {"name": "KMEM_TAXI_TURN", "game_id": "dc9.memphis.taxiTurn", "location": (-55.0, 90.0, 0.0)},
    {"name": "KMEM_HOLD_SHORT", "game_id": "dc9.memphis.holdShort", "location": (-120.0, 210.0, 0.0)},
    {"name": "KMEM_RUNWAY_LINEUP", "game_id": "dc9.memphis.runwayLineup", "location": (-120.0, 245.0, 0.0)},
    {"name": "KMEM_INITIAL_CLIMB", "game_id": "dc9.memphis.initialClimb", "location": (-120.0, 700.0, 110.0)},
)

CONCOURSE_SOURCE_TRANSFORMS = {
    "ConcourseB.obj": {"location": (90.0, -80.0, 0.0), "rotation_z_degrees": 0.0},
    "ConcourseB_2.obj": {"location": (90.0, 40.0, 0.0), "rotation_z_degrees": 90.0},
    "ConcourseB_2e.obj": {"location": (90.0, -180.0, 0.0), "rotation_z_degrees": 90.0},
}
~~~

These values are authored game space, not airport-chart data. The validator rejects duplicate names/game IDs, non-finite transforms, decreasing route distance, hold short beyond lineup, or Concourse B outside the ramp-start visibility limit.

- [x] **Step 4: Implement Agent 2 assembly**

'assemble_dc9_memphis_legacy.py' must refuse to run without a matching approved source manifest and 'source-approval.json'. It imports the approved candidate, applies recorded transforms, creates simple neutral ramp/taxi/runway/centerline geometry, authors the five empty anchors, sets extras, and emits:

- neutral blend and GLB;
- resolved layout JSON;
- node/pivot and reimport report;
- 1440/768/375 neutral previews;
- runtime-contract gate with all five anchors and 'htmlEquivalent: "MemphisDeparturePanel qualitative path control"';
- assembly-complete manifest with computed hashes.

Do not add normal/emissive maps, wear, color grading, texture compression, destructive mesh joining, or browser files.

- [x] **Step 5: Validate Agent 2**

Run:

~~~bash
/home/user1/.local/bin/blender --background --factory-startup --disable-autoexec --python tools/blender/assemble_dc9_memphis_legacy.py -- --source-approval art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-source/source-approval.json --output-dir art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly --runtime-contract art-source/cockpit-pipeline/gates/dc9-memphis-legacy-runtime-contract.json --manifest art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/manifests/assembly-complete.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate runtime-contract art-source/cockpit-pipeline/gates/dc9-memphis-legacy-runtime-contract.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/manifests/assembly-complete.json
npx gltf-transform validate art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/dc9-memphis-legacy-neutral.glb
~~~

- [x] **Step 6: Inspect and approve the Assembly Review Gate**

Review 1440/768/375 neutral views. Concourse B must read from ramp start, the path must remain clear of geometry, hold-short must precede lineup, and anchors must reimport at their documented coordinates.

If approved, write 'assembly-approval.json' with 'stage: "assembly-approved"', 'approved: true', 'approvedBy: "owner review 2026-08-27"', exact neutral artifact hashes, runtime-contract path, and the known deviation 'compressed 1995 memory composition, not exact KMEM geography'.

- [x] **Step 7: Commit Agent 2**

~~~bash
git add tools/blender/cockpit_pipeline/kmem_legacy_layout.py tools/blender/cockpit_pipeline/tests/test_kmem_legacy_layout.py tools/blender/assemble_dc9_memphis_legacy.py art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly art-source/cockpit-pipeline/gates/dc9-memphis-legacy-runtime-contract.json art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly asset-reports/dc9-memphis-legacy-departure.md plans/0040-dc9-memphis-legacy-departure.md
git commit -m "feat(assets): assemble Memphis legacy environment"
git switch agent/dc9-memphis-taxi-takeoff
git merge --no-ff asset/dc9-memphis-assembly
~~~

**Commit evidence — 2026-08-28:** Task 7 was committed on `asset/dc9-memphis-assembly` as `dca69a5888e5864637b42c87dd926e50fb932735` (`feat(assets): assemble Memphis legacy environment`). The stage branch remains unmerged; the listed switch/merge commands require controller integration and have not been performed.

**Terminal-composition re-assembly — 2026-08-28 (Assembly Review Gate pending):** On `asset/dc9-memphis-terminal-composition`, Agent 2 re-ran with the west-frontage layout, the route-over-void ground fix, the martini-glass canopy accent, and six new windshield-pose previews (`windshield-ramp-start-{1440,768,375}`, `windshield-hold-short-1440`, `windshield-runway-lineup-1440`, `windshield-takeoff-roll-1440`). RED was captured first (new layout tests failed against the retired module), then 24 pipeline tests, gate/manifest validation with verified hashes, clean GLB validation, the in-scene and reimport source-transform checks (0/90/116 degrees), and the canopy exported-bounds check passed at 676 triangles. Current neutral GLB SHA-256 `8c7b2b9e3d008b11fc3df76b02cafc64cc3e7c80d05adf186b794970d55c26e3`, blend `19f04a1437beb59192992084e5a17264b8b1bc116e083126a359be74e9475f0d`. The prior approval below covered the retired east-side composition, so shading is fail-closed blocked; the owner must review the canopy-bearing previews and grant a fresh Assembly Review Gate decision, after which `assembly-approval.json` (approval-002), the shading script's pinned approval constants, the shading re-run, promotion, and the Task 10 browser proof proceed. The shading script already carries the `KMEM_TERMINAL_APRON`/`KMEM_TERMINAL_CANOPY` material assignments and validation.

**Assembly evidence — 2026-08-28:** The owner approved the revised 36 mm neutral composition after the Tier 1 framing repair brought more Concourse B into the review frame. `assembly-approval.json` pins the current assembly manifest, neutral blend/GLB, runtime contract, resolved layout, node/pivot report, and three revised previews. Fresh layout, source/assembly-approval consistency, runtime-contract, manifest, GLB, exact-anchor reimport, and `assembly_complete -> assembly-approved` transition checks passed. The reproducible `.blend1` backup was removed; the approved `.blend` remains. Approval permits only materials work; textures/final fidelity, browser/runtime integration, public-model promotion, merge, push, and browser work remain outside this Task 7 handoff.

### Task 8: Shade, optimize, promote, and contract-check the environment

**Files:**

- Create: 'tools/blender/shade_dc9_memphis_legacy.py'
- Create: shaded blend/GLB, material/texture/validation reports, and previews under 'art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading/'
- Create: 'art-source/cockpit-pipeline/gates/dc9-memphis-legacy-material-optimization.json'
- Create: 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-shading/manifests/shading-complete.json'
- Create after review: 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-shading/shading-approval.json'
- Create: 'art-source/blender/dc9-memphis-legacy-departure.blend'
- Create: 'public/models/dc9-memphis-legacy-departure.glb'
- Create: 'tools/assets/dc9-memphis-model-contract.mjs'
- Create: 'tools/assets/dc9-memphis-model-contract.test.mjs'
- Create: 'tools/assets/dc9-memphis-shading-approval-contract.mjs'
- Create: 'tools/assets/dc9-memphis-shading-approval-contract.test.mjs'
- Modify: 'tools/assets/build-asset.mjs'
- Modify: 'tools/assets/check-models.mjs'
- Modify: 'package.json'
- Modify: 'public/models/README.md'
- Modify: 'asset-reports/dc9-memphis-legacy-departure.md'

**Interfaces:**

- Consumes: Task 7 assembly approval and neutral blend.
- Produces: material-optimization gate, final packed master/GLB, formal approval enforcement in 'npm run asset:dc9-memphis', and 'validateDc9MemphisModelContract(json, byteLength): string[]'.

- [x] **Step 0: Create the isolated shading branch**

Run: 'git switch -c asset/dc9-memphis-shading'

Expected: branch starts after the approved assembly branch merge. Do not change source or assembly artifacts.

- [x] **Step 1: Write the GLB contract tests RED**

Require exactly one of every node below:

~~~js
export const DC9_MEMPHIS_REQUIRED_NODES = [
  'KMEM_LEGACY_ROOT',
  'KMEM_CONCOURSE_B',
  'KMEM_RAMP',
  'KMEM_TAXI_SURFACE',
  'KMEM_RUNWAY_SURFACE',
  'KMEM_RAMP_START',
  'KMEM_TAXI_TURN',
  'KMEM_HOLD_SHORT',
  'KMEM_RUNWAY_LINEUP',
  'KMEM_INITIAL_CLIMB',
]
~~~

Assert exact game IDs, finite transforms, no interactive cockpit metadata, no AutoGate/OpenSceneryX/Planes names, no more than 5,000 triangles, no more than six materials, selected textures no larger than 2048 × 1024, and GLB byte length no larger than 8 MiB.

- [x] **Step 2: Run model-contract tests RED**

Run: 'node --test tools/assets/dc9-memphis-model-contract.test.mjs'

Expected: FAIL because the contract module does not exist.

- [x] **Step 3: Implement Agent 3 shading**

'shade_dc9_memphis_legacy.py' must refuse to run without matching assembly approval. It may:

- wire the selected base-color and normal maps to Concourse B;
- use the selected lit map only as restrained emissive support;
- assign low-material project-owned ramp/taxi/runway surfaces;
- add subtle 1995-memory color grading and approval lighting;
- pack all selected textures;
- preserve every runtime name, hierarchy, anchor transform, and extra;
- avoid mesh joining, decimation, or texture resizing unless the contract is proven before and after.

Emit a shaded blend/GLB, 1440/768/375 comparison views, material assignment report, texture report, validation/reimport report, shading-complete manifest, and material-optimization gate.

- [x] **Step 4: Validate and inspect Agent 3**

Run:

~~~bash
/home/user1/.local/bin/blender --background --factory-startup --disable-autoexec art-source/cockpit-pipeline/stages/assembly/output/dc9-memphis-legacy-assembly/dc9-memphis-legacy-neutral.blend --python tools/blender/shade_dc9_memphis_legacy.py -- --assembly-approval art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/assembly-approval.json --source-dir .cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/Memphis_Nashville/KMEM --output-dir art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading --material-gate art-source/cockpit-pipeline/gates/dc9-memphis-legacy-material-optimization.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate material-optimization art-source/cockpit-pipeline/gates/dc9-memphis-legacy-material-optimization.json
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-shading/manifests/shading-complete.json
npx gltf-transform validate art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading/dc9-memphis-legacy-shaded.glb
npx gltf-transform inspect art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading/dc9-memphis-legacy-shaded.glb
~~~

Inspect comparison views for upside-down geometry, missing textures, excessive emissive, modern-looking decoration, or neon guidance.

- [x] **Step 5: Obtain Materials and Optimization approval**

Present the material count, texture dimensions, GLB size, optimization decision, and comparison views. Create 'shading-approval.json' with 'stage: "shading-approved"', 'approved: true', 'approvedBy: "owner review 2026-08-28"', the shading manifest path, material-gate path, and exact shaded blend/GLB hashes. Browser integration must not start before this approval is recorded.

- [x] **Step 6: Add standard build and attribution**

Copy the approved shaded blend to 'art-source/blender/dc9-memphis-legacy-departure.blend'. Add asset configuration:

~~~js
{
  blend: 'art-source/blender/dc9-memphis-legacy-departure.blend',
  output: 'public/models/dc9-memphis-legacy-departure.glb',
  root: 'KMEM_LEGACY_ROOT',
}
~~~

Add package script '"asset:dc9-memphis": "node tools/assets/build-asset.mjs dc9-memphis"'. Add the source credit to 'public/models/README.md':

> Memphis Concourse B geometry is derived with permission for this private, noncommercial game from the Memphis/Nashville Scenery Package by Ted Davis.

Wire 'validateDc9MemphisModelContract(json, bytes.length)' into 'check-models.mjs' and add 'dc9-memphis-legacy-departure.glb' to the required production contracts.

- [x] **Step 7: Promote and validate**

Run:

~~~bash
cp art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading/dc9-memphis-legacy-shaded.blend art-source/blender/dc9-memphis-legacy-departure.blend
BLENDER_BIN=/home/user1/.local/bin/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:dc9-memphis
node --test tools/assets/dc9-memphis-model-contract.test.mjs
npm run assets:check
npm run pipeline:evals
git lfs status
~~~

Expected: all validators pass; the blend is LFS-managed and the deployable public GLB follows the existing public-model non-LFS policy.

- [x] **Step 8: Commit Agent 3 and production asset**

~~~bash
git add tools/blender/shade_dc9_memphis_legacy.py art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading art-source/cockpit-pipeline/gates/dc9-memphis-legacy-material-optimization.json art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-shading art-source/blender/dc9-memphis-legacy-departure.blend public/models/dc9-memphis-legacy-departure.glb tools/assets/dc9-memphis-model-contract.mjs tools/assets/dc9-memphis-model-contract.test.mjs tools/assets/build-asset.mjs tools/assets/check-models.mjs package.json public/models/README.md asset-reports/dc9-memphis-legacy-departure.md
git commit -m "feat(assets): promote Memphis Concourse B environment"
git switch agent/dc9-memphis-taxi-takeoff
git merge --no-ff asset/dc9-memphis-shading
~~~

**Task 8 completion evidence — 2026-08-28:** The owner rejected the brighter/warmer repair as too brown and selected the exact original restrained grade. Semantic validation pinned the current master SHA-256 `4e8cc6cc6a7a3dcef71f1f4579efda4c2a17f49e2dee7ee62db9c818ed487d3d` and byte-identical public GLB SHA-256 `73b80e6f388b15c853b1ec39b6af6a31b36da040d447f7a6cc916ea7924d346b`. Task 8 production promotion was committed as `75bb17fbd46182c0f514c06c95d9f12f89ed3195` (`feat(assets): promote Memphis Concourse B environment`). The branch remains unmerged; Task 9, push, and PR work have not started.

**Task 8 review-fix evidence — 2026-08-28:** Focused RED tests reproduced missing formal build-approval enforcement and node-only prohibited-name/interactive-metadata scanning. The repair adds a pure formal approval contract used before Blender semantic validation or public copy, checks the exact approval/manifest/gate/artifact paths and current hashes/bytes, and scans every top-level named/extras-bearing glTF object collection. Focused tests, the real asset build, public asset checks, pipeline evals 6/6, lint, types, production build, diff checks, and LFS policy passed. The fix was committed as `9aac555a22569ca9165aa923e58aadf5671193bb` (`fix(assets): enforce Memphis shading approval`); approved artifact bytes remain unchanged.

### Task 9: Render the Memphis world around the right-seat cockpit

**Files:**

- Create: 'src/scenes/dc9MemphisVisuals.ts'
- Create: 'src/scenes/dc9MemphisVisuals.test.ts'
- Create: 'src/scenes/Dc9MemphisEnvironment.tsx'
- Modify: 'src/scenes/cockpitModelLoader.ts'
- Modify: 'src/scenes/PrototypeScene.tsx'
- Modify: 'src/App.tsx'
- Modify: 'src/components/dc9/MemphisDeparturePanel.tsx'

**Interfaces:**

- Consumes: Task 4 'frameRef' and Task 8 stable GLB anchors.
- Produces: lazy environment load state, deterministic path sampling, inverse-world transform, daylight background/lighting, and canvas datasets for browser proof.

- [x] **Step 1: Write visual-math tests RED**

~~~ts
import { describe, expect, it } from 'vitest'
import { dc9MemphisWorldPose, validateDc9MemphisAnchors } from './dc9MemphisVisuals'

const approvedAnchorFixture = new Map([
  ['dc9.memphis.rampStart', [0, 0, 0] as const],
  ['dc9.memphis.taxiTurn', [-55, 90, 0] as const],
  ['dc9.memphis.holdShort', [-120, 210, 0] as const],
  ['dc9.memphis.runwayLineup', [-120, 245, 0] as const],
  ['dc9.memphis.initialClimb', [-120, 700, 110] as const],
])

describe('DC-9 Memphis visual path', () => {
  it('requires the stable anchor order', () => {
    expect(validateDc9MemphisAnchors(new Map())).toContain('dc9.memphis.rampStart')
  })

  it('keeps the cockpit fixed by returning an inverse world pose', () => {
    const pose = dc9MemphisWorldPose({
      beat: 'initialClimb',
      pathProgress: 0.9,
      lateralError: 0,
      headingError: 0,
      energy: 0.8,
      altitudeProgress: 0.5,
      pitch: 0.2,
      roll: 0,
      safeHold: false,
    }, approvedAnchorFixture)
    expect(pose.position.y).toBeLessThan(0)
    expect(pose.rotation.x).toBeLessThan(0)
  })
})
~~~

- [x] **Step 2: Run visual tests RED**

Run: 'npm test -- --run src/scenes/dc9MemphisVisuals.test.ts'

Expected: FAIL because the module does not exist.

- [x] **Step 3: Implement path sampling and inverse transform values**

Use the five GLB anchors to build a Catmull-Rom-equivalent sampled path without importing Three.js into the pure test module. Return plain tuples for position and Euler/quaternion inputs. Clamp lateral and heading offsets and damp camera vibration to zero under reduced motion.

- [x] **Step 4: Implement lazy environment loading**

'Dc9MemphisEnvironment' mounts only when 'chapterStage === "memphisDeparture"'. It must:

- request 'models/dc9-memphis-legacy-departure.glb' only after the new stage begins;
- clone the source scene and validate required nodes/game IDs before showing it;
- update one environment root per frame from 'frameRef';
- leave the cockpit and right-seat camera at their authored transforms;
- publish 'data-dc9-memphis-model-state', 'data-dc9-memphis-beat', and 'data-dc9-memphis-world-pose' on the canvas;
- dispose the clone and clear model cache on load failure;
- restore the dark parked background and lighting on unmount.

Add 'DC9_MEMPHIS_MODEL_URL' to 'cockpitModelLoader.ts' with a query version equal to the first eight hexadecimal characters of the validated production GLB SHA-256 recorded in the asset report. Use the existing cached loader/observer functions so retries and late progress subscribers follow the cockpit pattern.

- [x] **Step 5: Integrate with the existing DC-9 scene**

During 'memphisDeparture':

- use 'CAM_DC9_FIRST_OFFICER_GAME' and the normal gameplay FOV;
- allow direct yoke drag;
- keep limited seat-look controls;
- show daylight exterior lighting without changing the cockpit GLB materials;
- hide route/gauge/shutdown/key interaction colliders;
- render the environment as a sibling of the cockpit.

Pass load progress/error to 'MemphisDeparturePanel'. Environment failure keeps the HTML guidance and 'Restore checkpoint' path and never completes automatically.

- [x] **Step 6: Run visual, type, and asset checks**

Run:

~~~bash
npm test -- --run src/scenes/dc9MemphisVisuals.test.ts src/game/dc9MemphisDeparture.test.ts
npm run typecheck
npm run assets:check
~~~

Expected: all commands exit 0.

- [x] **Step 7: Commit scene integration**

~~~bash
git add src/scenes/dc9MemphisVisuals.ts src/scenes/dc9MemphisVisuals.test.ts src/scenes/Dc9MemphisEnvironment.tsx src/scenes/cockpitModelLoader.ts src/scenes/PrototypeScene.tsx src/App.tsx src/components/dc9/MemphisDeparturePanel.tsx
git commit -m "feat(dc9): render cockpit-first Memphis departure"
~~~

**Task 9 source-level evidence — 2026-08-28:** RED was captured before implementation when
the focused Vitest file failed because `dc9MemphisVisuals` did not exist. The finished pure suite
passes 9/9 and covers exact five-anchor ordering, finite validation, checkpoint knots, curved
sampling, inverse pose, lateral/heading clamps, climb altitude/pitch, malformed transient values,
and zero reduced-motion vibration. The focused visual/rules run passes 31/31; full Vitest passes
552/552 across 42 files. Lint, typecheck, production build, `assets:check`, and diff checks pass.
The environment is requested only by the exact `memphisDeparture` render branch with version
`73b80e6f`, validates names/game IDs before display, moves one cloned root from the authoritative
frame, publishes the three canvas datasets, restores parked presentation on exit, and clears and
retries the model cache from the native Restore path. Source integration is commit `8d38b86`
(`feat(dc9): render cockpit-first Memphis departure`). Task 10 browser, responsive, performance,
and screenshot proof has not been run or claimed.

**Task 9 review-fix evidence — 2026-08-28:** Focused RED reproduced all five review findings:
the raw `-p` translation left residual motion under combined route heading/pitch/roll; the staged
scene shared and disposed cached source resources; environment state replaced primary cockpit
failure state; an inactive rejection could evict/log over its replacement; and canvas datasets were
rewritten without a value change. GREEN passes 18/18 focused tests. The world root now uses the
exact rigid inverse `-R^-1 p`; staged geometry/material/texture resources are independently owned
with shared instances reused inside the clone; normal unmount preserves the successful source
cache; stale rejections do no global cleanup; cockpit and environment load states remain independent;
and dataset publication is value-cached. Full Vitest passes 561/561 across 44 files; lint, typecheck,
production build, `assets:check`, and diff checks pass. Fix commit: `f28b56f`
(`fix(dc9): harden Memphis scene lifecycle`). No browser/e2e/CSS/Task 10 work was performed.

### Task 10: Prove full browser behavior and repair regressions

**Files:**

- Modify: 'e2e/dc9-memphis-departure.spec.ts'
- Modify: 'e2e/smoke.spec.ts'
- Modify: nearby e2e seed helpers only when the schema 14 type requires it
- Modify: 'src/components/dc9/dc9Chapter.css' and focused runtime files only for reproduced defects
- Modify: this ExecPlan

**Interfaces:**

- Consumes: complete rules, state, UI, asset, and scene work.
- Produces: browser proof for success, mistakes, reload, reduced motion, input equivalence, lazy loading, and legacy-flow regression.

- [ ] **Step 1: Add real-GLB successful-path assertions**

Assert:

- the Memphis GLB is not requested during briefing, control check, intro, or route record;
- correct route submission changes the stage and starts the Memphis request;
- canvas reports the required model ready and the right-seat camera node;
- each beat occurs in order;
- native controls and keyboard manipulate the same authoritative frame;
- Home Operations opens only after initial climb completion;
- no Model Y request or copy appears.

- [ ] **Step 2: Add recoverable-path assertions**

Exercise:

- sustained wrong taxi steering;
- first, second, and third hint levels;
- hold-short attempt while moving;
- lineup confirmation before stopped;
- early rotation;
- manual restore;
- automatic restore after sustained corridor departure;
- reload at taxi turn, hold short, and runway lineup;
- tab hidden/visible;
- reduced motion;
- aborted Memphis GLB request;
- '?skip3d=1' accessible completion.

At every restore, assert route stamps and completed departure beats remain.

- [ ] **Step 3: Run focused browser tests and capture the first failures**

Run:

~~~bash
npx playwright test e2e/dc9-memphis-departure.spec.ts e2e/smoke.spec.ts --project=chromium
~~~

Record exact failures in 'Discoveries' before repairs.

- [ ] **Step 4: Repair root causes with a maximum of five focused cycles**

For each failure: reproduce one assertion, change the smallest owning module, rerun the focused assertion, then rerun both files. Do not relax timing or delete behavior assertions merely to turn the suite green.

- [ ] **Step 5: Run responsive and keyboard evidence**

Capture deterministic PNGs at approximately:

- 375 × 812: ramp start, hold short, initial climb;
- 768 × 900: ramp start, runway lineup, initial climb;
- 1440 × 900: ramp start, taxi turn, hold short, runway lineup, initial climb.

Also capture reduced-motion initial climb and the accessible '?skip3d=1' panel.

- [ ] **Step 6: Measure the warm browser frame budget**

At 1440 × 900 after both GLBs are loaded, collect 120 consecutive 'requestAnimationFrame' intervals during taxi. Record median and p95 in the asset report. Acceptance is p95 no greater than 35 ms on this workstation, no WebGL error, and no growth in loaded scene objects across three stage enter/exit cycles.

- [ ] **Step 7: Run full checks**

Run:

~~~bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run assets:check
npm run pipeline:evals
npx playwright test
git diff --check
~~~

Expected: every command exits 0; any environment-only skip is identified by exact test and reason.

- [ ] **Step 8: Commit browser repairs and evidence harness**

~~~bash
git add e2e src plans/0040-dc9-memphis-legacy-departure.md
git commit -m "test(dc9): prove Memphis departure flow"
~~~

### Task 11: Record evidence, review the complete diff, and present the owner gate

**Files:**

- Modify: 'docs/GAME_DESIGN.md'
- Modify: 'docs/VISUAL_REALISM.md'
- Modify: 'TEST_REPORT.md'
- Modify: 'asset-reports/dc9-memphis-legacy-departure.md'
- Create: 'art-source/cockpit-pipeline/gates/dc9-memphis-legacy-browser-integration.json'
- Modify: 'plans/0040-dc9-memphis-legacy-departure.md'

**Interfaces:**

- Consumes: actual Task 10 command output, screenshots, GLB metrics, and browser telemetry.
- Produces: current design docs, complete evidence, private preview, and the DC-9 owner-review handoff.

- [ ] **Step 1: Update product and realism documentation**

Describe the exact inserted progression, memory-recreation framing, cockpit-first route, qualitative/non-operational controls, selected source and attribution, and exclusion of exterior/free-flight/real procedures.

- [ ] **Step 2: Fill reports with actual evidence**

Record:

- branch and commit;
- archive/source hashes and permission basis;
- Blender version;
- source/master/GLB paths;
- object, material, triangle, texture, and GLB size;
- stable node/game-id contract;
- optimization decisions;
- commands and exit codes;
- screenshot paths and inspected visual findings;
- performance observation at 375/768/1440;
- known historical and visual limitations.

- [ ] **Step 3: Write and validate the browser-integration gate**

Create the gate only from completed evidence. It must reference 'public/models/dc9-memphis-legacy-departure.glb' and 'art-source/cockpit-pipeline/gates/dc9-memphis-legacy-runtime-contract.json', set all four verification booleans from actual browser results, list viewport widths 375/768/1440, record spoiler protection, list commands actually run, and list any genuine remaining blockers.

Run:

~~~bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-gate browser-integration art-source/cockpit-pipeline/gates/dc9-memphis-legacy-browser-integration.json
~~~

Expected: exit 0. A schema-valid gate with a false verification field or a non-empty blocker list remains evidence of incomplete work, not completion.

- [ ] **Step 4: Review the entire branch diff**

Run:

~~~bash
git diff --stat main...HEAD
git diff --check main...HEAD
git diff main...HEAD -- src/game src/components/dc9 src/scenes tools/assets tools/blender docs asset-reports TEST_REPORT.md plans
~~~

Review for unsafe DOM insertion, duplicated simulation rules, accidental operational copy, incorrect migration, untracked binary edits, third-party content leakage, unstable object names, broken Model Y protection, and unrelated intro changes.

- [ ] **Step 5: Resolve every critical/high finding and rerun affected checks**

Record each finding and repair in 'Discoveries' and 'Evidence'. A finding is closed only after its focused regression and the nearest full check pass.

- [ ] **Step 6: Create the private preview and inspect deployed behavior**

Build and deploy the validated branch through the existing private Vercel workflow. Verify deployed bytes request both DC-9 cockpit and Memphis GLBs only at their intended stages. Record the preview URL and deployed screenshot paths.

- [ ] **Step 7: Present the DC-9 visual approval gate**

Show consistent ramp-start, taxi-turn, hold-short, runway-lineup, and initial-climb screenshots beside the preview URL. State:

- commands actually run and results;
- source attribution and owner-attested permission scope;
- files changed;
- remaining incomplete items or limitations;
- whether the milestone is ready for owner approval.

Do not continue into unrelated locker, Airbus, reward, or next-slice work without separate authorization.

- [ ] **Step 8: Commit final documentation**

~~~bash
git add docs/GAME_DESIGN.md docs/VISUAL_REALISM.md TEST_REPORT.md asset-reports/dc9-memphis-legacy-departure.md art-source/cockpit-pipeline/gates/dc9-memphis-legacy-browser-integration.json plans/0040-dc9-memphis-legacy-departure.md
git commit -m "docs: record Memphis departure evidence"
~~~

## Validation plan

### Pure and reducer

- deterministic frame advance and checkpoint frames;
- qualitative guidance and hint ladder;
- safe hold-short/lineup gate;
- early/late rotation recovery;
- schema 13 to 14 migration at every DC-9 stage;
- corrupt progress and non-finite frame input;
- no loss of route, control check, or completed beats.

### Runtime and accessibility

- keyboard, native hold controls, pointer yoke, and supported gamepad;
- Space brake only while active;
- input release, blur, visibility pause, restore, and reload;
- native qualitative status with no color-only or rapidly repeated live announcements;
- skip3d completion and GLB failure recovery;
- reduced motion.

### Asset

- immutable archive and selected hashes;
- exact selected/excluded file set;
- OBJ8 bounds/orientation and texture color spaces;
- Blender master root, hierarchy, anchors, extras, packed textures, and approval cameras;
- raw/reimported GLB contract;
- object/material/triangle/texture/size report;
- no destructive optimization or third-party library leakage.

### Browser and visual

- lazy environment request after route completion only;
- right-seat camera remains active through initial climb;
- Concourse B readable at ramp start;
- guidance remains restrained and does not obscure windshield/instruments;
- success, mistake, repeated mistake, hint, restore, reload, hidden-tab, reduced-motion, WebGL failure, and accessible paths;
- 375/768/1440 screenshots;
- existing DC-9, locker, Airbus, reward, and spoiler tests;
- private preview matches local evidence.

## Acceptance criteria

- Correct Legacy Route Record completion enters 'memphisDeparture', not Home Operations.
- The player taxis from recognizable Concourse B scenery, follows one curved path, stops safely, lines up, accelerates, rotates on cue, and stabilizes a short climb from the right seat.
- A successful first run lasts roughly two to three minutes.
- No exterior camera, real operational value, procedure, emergency, accident, or system-failure framing appears.
- Wrong inputs give progressive help and restore only the latest checkpoint.
- Native HTML and keyboard controls complete every required beat.
- Schema 13 saves never move backward; schema 14 reload starts the latest checkpoint at rest.
- The source archive/files, owner-attested permission, attribution, exclusions, Blender source, GLB, metrics, and preview evidence are recorded.
- The Memphis environment lazy-loads only for the new stage and unloads when Home Operations resumes.
- 'npm run check', 'npm run assets:check', 'npm run pipeline:evals', and 'npx playwright test' pass.
- Browser evidence at 375, 768, and 1440 supports owner review.
- A private Vercel preview and consistent screenshots accompany the DC-9 visual gate.

## Repair loop and stop conditions

Repeat:

**review → reproduce one failing acceptance check → focused repair → rerun focused check → rerun nearby regressions → inspect remaining delta → record evidence**

Stop when all acceptance checks pass, after five attempts on one unchanged failure, when the remaining delta stops shrinking, when the Blender/source/visual gate requires owner judgment, or when a new external-state change falls outside the approved milestone. Do not claim an unrun check passed.

## Progress

- [x] 2026-08-27 — Existing DC-9 progression, input, persistence, scene, asset pipeline, and source package inspected.
- [x] 2026-08-27 — Owner approved guided cockpit-first gameplay from older Memphis Concourse B.
- [x] 2026-08-27 — Owner selected the Ted Davis scenery source and attested private noncommercial permission.
- [x] 2026-08-27 — Design specification approved.
- [ ] Task 1 — Source authority and immutable intake.
- [ ] Task 2 — Pure simulation.
- [ ] Task 3 — Schema 14 progression.
- [ ] Task 4 — Runtime and brake.
- [ ] Task 5 — Native accessible UI.
- [x] Task 6 — Source-only candidate and Source Review Gate.
- [x] Task 7 — Neutral assembly and Assembly Review Gate approved for materials work.
- [x] Task 8 — Materials, optimization, production promotion, and review fixes.
- [x] Task 9 — Source scene integration and review fixes.
- [x] Task 10 — Browser validation and repairs (2026-08-28: far-plane repair, stale smoke coverage repaired, headed evidence set captured; full-suite confirmation recorded in TEST_REPORT.md).
- [ ] Task 11 — Evidence and owner approval gate.

## Evidence

Planning evidence:

- Branch: 'agent/dc9-memphis-taxi-takeoff'
- Approved design commit: '903f2fd'
- Source archive SHA-256: 'fc403141223be066094814d9ea06d820f75477fea419870b04ffd65153434b95'
- Blender: '/home/user1/.local/bin/blender', version 5.1.2 observed during discovery
- Source geometry inspection: 178 + 30 + 24 triangles; base/lit/normal textures are each 2048 × 1024
- Source permission basis: owner-attested private noncommercial permission, 2026-08-27

Task 6 execution evidence:

- Source branch: `asset/dc9-memphis-source`, source-stage commit `112b8e6`.
- RED/GREEN: `test_xplane_obj8_convert` first failed for a missing source inspector, then passed 9 tests; review-fix round 1 first failed for a missing `require_approved_paths`, then passed 10 tests.
- Blender 5.1.2 generated the source-only candidate with the required factory/autoexec-disabled flags. The owner approved the exact candidate GLB and metadata hashes for neutral assembly only.
- Final source checks passed: approved-path no-write preflight, Task 1 authority/job/manifest validation, clean GLB validation, source-approval hash consistency, and `sourcing_complete -> source-approved` transition validation.
- Remaining limitation: source texture wiring and final visual fidelity are not approved. No Task 7 assembly artifacts, authored ground/path/anchors, or production model are present.

## Outcome and handoff

Planning is complete when this document is saved, self-reviewed, and committed. Execution begins only after the owner selects the execution mode. The first implementation checkpoint is source authority and immutable intake; no application behavior changes before its tests and gate validation pass.
