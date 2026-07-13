# Baseball memory import and playable locker reveal

## Purpose

Make the preserved Tripo baseball a real Blender-to-browser locker prop and make the player-visible reveal sequence read: watch → baseball question → Charging Bull → Wings → captain’s hat.

## Current state

The locker master already contains the watch, Charging Bull, Wings, and hat candidates. Baseball was preserved under `.cache/cockpit-pipeline/sources/locker/baseball/original/` but was represented by a runtime-only placeholder and was not playable in the reducer.

## Scope

Included: deterministic Blender import, centered baseball contract and collider, approval camera/report entry, GLB regeneration, reducer sequencing, camera cueing, real-node scene integration, native baseball question, tests, and evidence. Excluded: unrelated cockpit work, deployment, commit, and final owner art approval.

## Context and constraints

The baseball is an owner-review Tripo candidate, not final production art. Keep schema version 5 and existing saves. Preserve accessible HTML controls, local persistence, progressive retry hints, keyboard operation, reduced motion, and fallback mode. Never edit the generated GLB by hand.

## Progress

- [x] 2026-07-11 — Inspected existing partial locker sequence, source cache, worktree, and required asset/game guidance.
- [x] 2026-07-11 — Imported baseball through Blender, regenerated the master/GLB, and added the dedicated approval render.
- [x] 2026-07-11 — Validated reducer, browser, asset, and visual evidence.
- [x] 2026-07-11 — Stopped at the locker-room owner visual approval gate.
- [x] 2026-07-11 — Owner-directed layout revision: baseball above watch, Bull above baseball, Wings higher in locker; added baseball support shelf.
- [x] 2026-07-11 — Replaced the temporary baseball candidate with the newly downloaded source while preserving the old source and stable runtime contract.
- [x] 2026-07-11 — Shifted the right-bay shelf, tightened the opening watch camera, converted baseball to multiple choice, and added the required Charging Bull question.
- [x] 2026-07-11 — Rejected the identity-losing flat-material pass, rebuilt recognizable prop treatments, and added the lessons to the validated visual-repair and browser-gate skills.
- [x] 2026-07-11 — Repaired the shared decimator regression, recentered the Blender approval camera, and passed the final source/GLB/browser gate.
- [x] 2026-07-12 — Replaced the rejected proxy treatments with the three new complete-4K Tripo downloads, enforced source hashes and material-wired 4K PBR roles in the pipeline, rebuilt the master/GLB, and captured owner-review browser evidence.
- [x] 2026-07-12 — Applied the owner-directed centering pass to the watch, Wings, and captain's hat, lowered locker-only lighting, regenerated the master/GLB, and captured responsive browser proof for owner review.
- [x] 2026-07-12 — Rotated the baseball to the owner-selected vertical-seam presentation, replaced focus zooms with a constant-distance camera climb, and made Wings a required free-text question before the hat reveal.
- [x] 2026-07-12 — Removed the Wings answer giveaway, bolded all locker questions, and replaced the small hat claim/promotion UI with a fade-to-black Captain's Hat celebration and one-button Captain Mode transition.

## Discoveries

- The source is `.cache/cockpit-pipeline/sources/locker/baseball/original/baseball+3d+model.glb`, 61,588,464 bytes, with the supplied SHA-256 `75dda2bf01c8c8863820ec25750ef2f1b15940ccfeb1b1c56d8d0b548d5ab19e`.
- Existing code had already added baseball copy and a proxy hitbox, but availability still skipped baseball and auto-advanced Bull after the watch.

## Decision log

- Baseball is the immediate post-watch memory and remains a question, because the existing Anthony Muñoz question and accepted answers are authoritative.
- Bull is revealed by completing baseball; Wings is a question revealed by Bull; the hat opens only after all four memory IDs are complete.
- Baseball placement is `(0.64, -0.48, 1.34)`, scale `0.30`, and baked XYZ rotation `(-45°, 0°, 90°)`, with a 72,000-triangle and 2048px runtime texture target. The shelf is above the watch and shifted further right to stay inside the right locker bay.
- A base-color-only candidate and then a generic smooth sphere/flat-material pass were tested and rejected after browser review because cleaner surfaces did not preserve the props' identity.
- The 2026-07-11 procedural baseball, voxel Bull, and stylized Wings atlas were rejected/superseded. The current comparison uses the three newly downloaded complete-4K Tripo sources with their authored PBR materials, staged to 2K for the browser; the owner remains the visual authority.
- The centering pass moves only watch, Wings, and hat from x=`0.42` to x=`0.56`. Baseball, Bull, and both support shelves remain fixed so the requested composition change does not disturb their accepted positions. Locker-only browser and Blender approval lights are reduced by roughly 12–15 percent; prop materials and texture maps are unchanged.
- The Captain's Hat celebration uses a transparent render of the exact deployed `LOCKER_PROP_CAPTAINS_HAT` GLB node. The master, deployable GLB, stable node, `game_id`, and schema-v5 state remain unchanged.

## Milestones

1. Blender exports `LOCKER_PROP_BASEBALL`, `LOCKER_PROP_BASEBALL_MESH`, and `LOCKER_HITBOX_BASEBALL` with `locker.memory.baseball` / `question` metadata.
2. The reducer and camera expose baseball only after the watch, then Bull, then the required Wings question.
3. The browser loads the real baseball node and its exported collider; no runtime proxy remains.
4. Focused and full checks provide a handoff for owner visual review.

## Validation plan

Run `npm run asset:locker`, `npm run assets:check`, `npm run pipeline:evals`, `npm run check`, `npm run test:e2e`, and `git diff --check`. Exercise correct, wrong, repeated-wrong, accented/unaccented answers, reload, reduced motion, fallback, keyboard, and 1440/768/375 widths. Inspect Blender and browser baseball-focused evidence for orientation, shelf placement, no duplicate proxy, no console errors, and no horizontal overflow.

## Acceptance criteria

- Baseball is unavailable before watch completion and available immediately after it.
- `Anthony Muñoz` and `Anthony Munoz` complete the baseball question; wrong answers preserve prior progress and stronger hints appear after repeated failure.
- Bull cannot be completed before baseball; Wings cannot be answered before Bull; accepted `1000 hours` variants complete Wings and all four memories reveal the hat without losing progress.
- The runtime canvas reports the real baseball node and silhouette/revealed state, and the GLB contains the exported collider.
- All required checks pass, with actual outputs recorded below.

## Repair loop and stop conditions

Repeat focused implementation → validation → browser inspection → diff review until checks pass. Stop at the existing locker-room visual approval gate; do not deploy or claim final production art approval.

## Evidence

- Blender 5.1.2 `import_locker_room_props.py` and `npm run asset:locker` passed; scene validation retained five existing unapplied-environment-transform warnings, and glTF validation reported no errors with existing generated-tangent warnings.
- `npm run assets:check` passed; `npm run pipeline:evals` passed 6/6; `npm run check` passed with 35 unit tests; focused locker Playwright passed 5/5; full `npm run test:e2e` passed 12/12; `git diff --check` passed after report updates.
- Runtime bytes matched disk with `cache: no-store`: 26,594,784 bytes, SHA-256 `893ae4dcd628ab43af1d3f9a9b50f5fcfefc1d3669ef7dfefee7510683089010`. Browser reported `LOCKER_PROP_BASEBALL`, `revealed` in the revealed state, and no console errors.
- The final export records 52 selected objects, five `game_id` nodes, ten materials, and thirteen textures. Inspected browser captures `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, and `/tmp/baseball-locker-375.png`; the ball is seated in the right locker bay with readable red seams, the Bull is clean bronze, and the Wings retain crisp feather detail.
- `agent-browser` could not launch Chrome because the host reports `No usable sandbox`; Playwright was used as the repository fallback.
- Owner-directed layout proof: the hero and focused Blender renders show baseball above the watch, Charging Bull on the higher shelf above baseball, and Wings lifted higher. A future baseball download can replace the preserved candidate without changing the stable runtime contract.
- Replacement source evidence: `.cache/cockpit-pipeline/sources/locker/baseball/original/baseball+3d+model-20260711.glb`, SHA-256 `1fb4a5ae2ced1e9500b4730127da3febdc03787af886a314756e8a61e8de06cd`; runtime result 20,492 triangles.

## 2026-07-11 owner visual repair pass

- Moved the baseball and dedicated shelf to x=`0.64`, regenerated the master and deployable GLB through Blender, tightened the opening watch camera to a macro pose, and reduced the desktop status panel to a compact 20rem card.
- Changed Anthony Muñoz to a native four-choice question with Orlando Pace, Johnathan Ogden, and Art Shell distractors. Charging Bull is now a required four-choice question with Albert Einstein as the accepted answer, so the ordered flow is watch → baseball → Bull → Wings.
- Applied base-color-only smooth matte treatment to the new baseball candidate. Final runtime GLB: 23,834,824 bytes, SHA-256 `3678d8c797d9fe7cf65a8b91bcac0023a653c085df66009b574a9e7825f539e4`.
- Browser proof: `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, `/tmp/baseball-locker-375.png`; runtime bytes matched disk, no console errors, and the real `LOCKER_PROP_BASEBALL` node reported `revealed`.
- Validation for this intermediate pass used `npm run assets:check`, `npm run pipeline:evals`, `npm run check`, focused locker Playwright, and `git diff --check`. `agent-browser` remains unavailable on this host because Chrome reports no usable sandbox; repository Playwright was used.
- The 20,723,224-byte generic sphere/flat-material export from this iteration was rejected and superseded by the corrective stylized-prop pass below.

## Outcome and handoff

This milestone hands the playable ordered memory loop and complete-4K Tripo rebuild to the owner for visual approval. The runtime candidates now use the newly downloaded baseball, Bull, and Wings geometry and authored PBR maps; earlier procedural, remeshed, or stylized substitutes are retained only as historical report entries.

## 2026-07-11 corrective stylized-prop pass

- Rejected and removed the generic white-sphere/flat-material pass after owner feedback. The final baseball is a purpose-built 7,968-triangle leather sphere with two visible red curved seams under the existing stable root/collider contract.
- Voxel-remeshed the Bull to 40,984 triangles and assigned a controlled bronze material, removing scan speckle while preserving the Charging Bull silhouette.
- Wings retain their imported geometry at the 48,000-triangle target and use the project-bound stylized gold atlas `art-source/blender/textures/locker/wings-stylized-v1.png` with noisy detail maps disabled.
- Final browser evidence at `/tmp/baseball-locker-1440.png`, `/tmp/baseball-locker-768.png`, and `/tmp/baseball-locker-375.png` shows recognizable red baseball seams, clean bronze Bull, crisp gold Wings, matching runtime/disk bytes, and no console errors.
- Corrected the shared decimator after diff review so the scan repair no longer over-reduces the watch, hat, or Wings; the dedicated baseball approval camera now targets the right-side shelf.
- Final GLB: 26,594,784 bytes, SHA-256 `893ae4dcd628ab43af1d3f9a9b50f5fcfefc1d3669ef7dfefee7510683089010`.

## 2026-07-12 complete 4K-source pass

- Added `TripoAssetLessons.md` as the durable source-quality and repair reference. The watch is explicitly not treated as proof of a universal runtime texture budget.
- Preserved and hash-verified `baseball 3d model4kInterior.glb`, `bull 3d model4kNight.glb`, and `gold winged emblem 3d model4k.glb`; each has a material-wired 4096 BaseColor, Normal, and metallic-roughness map.
- `npm run asset:locker` now prepares the configured locker sources before validation/export. The importer rejects wrong hashes, missing PBR roles, or any required map below 4096; `npm run assets:check` independently requires the five expected props and roles.
- Baseball, Bull, and Wings use 72k-triangle targets and 2048 runtime maps for this comparison. Watch and hat remain at their previously used 1024 runtime maps; source preservation for all five remains 4K.
- Final master SHA-256: `4356961f63439241d1c9ea0bde8f244361203a67db68629580886f7311a2cdaf`. Final GLB: 44,288,684 bytes, SHA-256 `3b5d365274bb6e65b939e6bee4467e6be7d5a4111f5aace92dcc240b99518753`.
- Added prop-scoped orphan cleanup after repeated builds exposed `.001` datablock drift. The cleaned master is 50.2 MiB, names remain unsuffixed, and two consecutive complete builds produced the same deployable GLB hash.
- Reduced the desktop status box to 18rem after browser geometry found a 16px overlap with the memory tray. Tests now prove non-overlap at 1440 and no horizontal overflow at 1440/768/375.
- Browser proof: `.cache/assets/locker/browser/locker-4k-{baseball,bull,wings}-focus-{with-card,clean}-1440.png` and `.cache/assets/locker/browser/locker-4k-overview-{1440,768,375}.png`. Real exported nodes loaded, camera cues settled, HTTP bytes/hash matched disk, and no console errors were recorded.
- Stop condition remains owner visual review; the agent does not approve the look of the candidates.

## 2026-07-12 centering and darker-locker pass

- Moved the watch to `(0.56, -0.48, 0.55)`, Wings to `(0.56, -0.06, 2.55)`, and captain's hat to `(0.56, -0.45, 2.92)`. Their Blender approval cameras and the runtime watch/Wings focus targets follow the new centerline. Baseball remains at `(0.64, -0.48, 1.34)` and Bull remains at `(0.42, 0.48, 2.03)`.
- Reduced only locker-scene illumination: runtime ambient, hemisphere, directional, spot, and point-light intensities are approximately 13 percent lower; Blender approval world strength changed from `0.26` to `0.22`, with key/fill/practical energies changed from `1050/620/260` to `920/540/225`.
- Regenerated through `npm run asset:locker`. Current master: 50,238,219 bytes, SHA-256 `c284dce0a75f380270ffbd3bed38c009bdd7adb97794a269f6309daf5ef071c4`. Current GLB: 44,288,680 bytes, SHA-256 `96cf42d665fd41c3ecf4e384318251e42c1e99577eac5c1e7ebf93861c46a4d5`.
- Actual-browser evidence: `.cache/assets/locker/browser/locker-centering-watch-1440.png` and `.cache/assets/locker/browser/locker-centering-overview-{1440,768,375}.png`. The camera settled on the real exported nodes; a no-cache response matched the GLB bytes/hash and `model/gltf-binary`; no console/page errors or horizontal overflow were recorded.
- Validation passed: Blender rebuild, Python compile, `npm run assets:check`, `npm run pipeline:evals` (6/6), `npm run check` (35/35 unit tests plus build), focused locker Playwright (5/5), full Playwright (12/12), and `git diff --check`. Final composition and darkness remain at the owner visual approval gate.

## 2026-07-12 seam presentation, continuous camera, and Wings question pass

- Baked the owner-selected baseball rotation `(-45°, 0°, 90°)` through the deterministic importer. The approval and runtime views now show two curved vertical seam bands like `/mnt/2TBHDD/Downloads/realistic-vector-baseball.jpg`; placement, scale, materials, stable names, and collider remain unchanged.
- All four memory focus poses use FOV `30.00`, camera-to-target distance `3.490`, and the watch-derived offset `(-0.27, 0.37, 3.46)`. After the initial watch zoom-in, Baseball, Bull, and Wings translate upward without another zoom.
- Baseball copy now reads “Before the captain wore wings, he wore a glove.” Charging Bull renders its question as a separate semantic bold block. Wings exports `interaction = question` and requires a native free-text `1000 hours` answer with retry and progressive hint behavior.
- Schema remains version 5. Older saves normalize a missing `lockerAttempts.wings` to zero, while already completed Wings/hat progress remains complete. The obsolete inspection-completion action was removed so neither the HTML nor 3D path can bypass the question.
- Current master: 50,237,876 bytes, SHA-256 `648a63df7a95de0cda11cf2c2ba2dcb988b621ab6ab04388f3ae460d0fc63f42`. Current GLB: 44,288,740 bytes, SHA-256 `cf212389e0d04aa34a528cbc2af07e59b4acc9d4e98e386f725c78da43279c5c`.
- Actual-browser evidence: `.cache/assets/locker/browser/locker-seam-flow-{watch,baseball-card,baseball-clean,bull-question,wings-question}-1440.png`, responsive Wings views/cards at 768/375, matching no-cache GLB bytes/hash, no console/page errors, and no horizontal overflow. Visual acceptance remains with the owner.
- Validation passed: deterministic Blender rebuild, Python compile, `npm run assets:check`, `npm run pipeline:evals` (6/6), `npm run check` (42/42 unit tests plus production build), focused accessible/real-GLB Playwright, full Playwright (12/12 in 3.8 minutes), and `git diff --check`. The expanded real-GLB path retains every assertion under a 240-second ceiling.

## 2026-07-12 Wings copy and Captain's Hat celebration

- Rolex, baseball, Charging Bull, and Wings question legends now use semantic bold text. The Wings form has no placeholder, and its repeated-wrong clue narrows the range without stating the exact answer; successful feedback still confirms `1,000 hours`.
- Completing Wings now hides the locker HUD, fades to black over 700 ms, holds for 150 ms, and reveals the Captain's Hat card over 350 ms. The shared qualification shell supplies the modal focus trap and 24-piece confetti field; reduced motion skips the animation and confetti.
- The one `Enter Pop T Captain Mode` action dispatches the existing claim and continue actions in order. Reloading while the hat is revealed reopens the celebration; entering Captain Mode persists and prevents replay.
- Blender 5.1.2 rendered `LOCKER_PROP_CAPTAINS_HAT` from the unchanged deployed locker GLB into a 1024×1024 RGBA image. Runtime image: 563,765 bytes, SHA-256 `e426b329b273fcd593ed7bace8848a2573f8ed8bfb198b3063df63beb05d4f8c`; two decoded repeat renders were pixel-identical.
- Browser proof: `/tmp/captain-hat-celebration-final-{1440,768,375}.png`. The final layout has no horizontal overflow, the CTA retains focus, and no console/page errors occurred. A separate real-GLB browser pass received the exact 44,288,740-byte locker model and the exact runtime PNG.
- Validation passed: Python compile, `npm run assets:check`, `npm run pipeline:evals` (6/6), `npm run check` (42/42 unit tests plus production build), focused locker Playwright, and full `npm run test:e2e` (12/12 in 4.2 minutes). Vercel publication and final owner visual approval remain open.
