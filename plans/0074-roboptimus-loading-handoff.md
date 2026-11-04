# Roboptimus loading handoff repair

This plan records the initial repair and autoplay follow-up. The final personal greeting, closed-door walk, opening-door dance, dark fade and neutral loading behavior supersede its original dancing-card design; current acceptance and PR authorization are in [plan 0075](0075-roboptimus-hangar-escort.md).

## Goal and context

After Engine-Out completion, show only the current dancing guide, named **Roboptimus**, including cold loading, accessible mode and failed WebGL/model loads. The retired waving robot must never flash before the current model appears.

The root cause is `images/optimus-guide-fallback.png`: the old still is rendered by both the lazy-component Suspense boundary and the GLB loading branch, and also by accessible/WebGL fallbacks. The current GLB already uses a different model. User-visible naming currently survives only in the audio accessible label; add Roboptimus to the completion eyebrow and accessible greeting label.

## Constraints and implementation

Keep the accepted GLB, camera, lighting, animation, Heart audio, reward gate and game progress unchanged. Capture a transparent still directly from the current browser-rendered GLB, use a new `roboptimus-guide-fallback.png` URL to avoid cached retired art, and share that path between both components. Preserve the old PNG as historical source. Internal model/audio identifiers retain their provenance. No new dependency, external generation or Blender/GLB export is needed.

## Progress

- [x] Inspect current worktree, loading branches, old PNG and active asset report; create isolated follow-up branch.
- [x] Reproduce the retired still during held module/model requests and add a failing regression.
- [x] Capture and inspect the current model still; replace all fallback references and player-facing naming.
- [x] Pass cold-load, failed-load, accessible, replay/reload, reduced-motion and reward-gate browser cases; inspect 375/768/1440 proof and run the full check, assets check and diff review.
- [x] Record exact asset hashes, actual verification and remaining delta; open the corrected completion screen for the owner.

## Validation and stop conditions

Hold the lazy scene module and GLB separately so each placeholder branch is visible and testable. Assert the new still remains until the real model is loaded, the old PNG is never requested, the current GLB bytes match disk, Roboptimus appears in visible/accessibility copy, and Reveal reward remains usable if loading fails. Run existing reward and Engine-Out tests plus `npm run check`, `npm run assets:check`, spoiler/privacy and asset-budget guards. Capture actual browser screenshots before claiming success. Repair at most three substantive attempts per issue; stop for a real visual decision or unchanged delta. No publication or merge is implied by this local fix.

## Outcome and evidence

- Root regression failed against the retired URL before implementation; the new three-case development suite then passed. The direct-placeholder assertion was corrected after inspecting Canvas's non-rendered fallback child. Optional seven-screenshot capture exhausted the initial 60-second budget; only artifact capture now receives 180 seconds. The normal test remains 60 seconds and passed in under two seconds without optional artifacts.
- Production `roboptimus`, `reward` and native `airbus-engine-out` suites passed **20/20**, including the final screenshot capture, with the unrelated heavy Airbus rendering case excluded. New/current still, slow module/GLB states and actual model screenshots were inspected at 375/768/1440 under `preview-renders/roboptimus-handoff-2026-11-03/`.
- `npm run check` passes lint, types, 1,048 unit tests/95 files and build. Asset validation passes with existing model notices. Spoiler/privacy guards, diff check and budgets pass at 185.4 MB total / 567 KB initial against unchanged 190 MB / 600 KB limits.
- A fresh runtime fetch matched the unchanged current GLB's full SHA-256 and length. The transparent still and retained old PNG hashes and provenance are in the asset report/manifest. Independent read-only review returned no findings. No production dependency or 3D source/runtime contract changed.
- Opened the actual corrected production preview at `http://127.0.0.1:5414/` in a separate visible owner-review browser profile, titled **Roboptimus handoff — CockpitEscapeRoom**, seeded at completed Engine-Out. Roboptimus copy and the current animated canvas were both verified visible. No page errors were observed; two existing Three.js Clock deprecation notices were recorded. This local follow-up remains uncommitted and unpublished for review; the previously merged PR and production deployment were not changed.

## Follow-up: Model FLY starts on entry

The owner clarified that the Model FLY film must play automatically when it opens. Goal: no second Play click after Reveal reward, including accessible/reduced-motion entry and reload. Current `RewardExperience` deliberately suppresses autoplay for both flags and offers only manual Play when the browser refuses audible autoplay. The review launcher also imposed an extra browser autoplay restriction.

Implement automatic playback independent of the 3D/motion flags. Try the current sound setting first; if audible playback is refused, automatically start muted and expose a native sound-on action. Keep native Play only if even muted playback is blocked. Cancel stale attempts on Skip/unmount, keep retry/replay/progress and the pre-reward media gate intact, and preserve the Roboptimus correction. Verify real Reveal reward entry with accessible and reduced-motion settings, blocked-audible fallback/unmute, failure/retry and automatic film end/replay. Update the old manual-only reduced-motion browser expectations and game-design copy. Reopen the film through the actual reward action using normal browser settings, then verify its clock advances without pressing Play.

The three new autoplay cases failed before implementation; they now pass in development Chromium. A one-shot play() refusal was an invalid policy simulation because native autoplay and StrictMode retries could succeed independently. The final deterministic refusal case disables native source autoplay only inside its test adapter and denies audible play until the real sound-on action is clicked. Separate entry cases retain native autoplay and verify unmuted playback after Reveal reward. Source review found no concrete runtime regression; dedicated tests for both-muted-and-audible refusal and a delayed denial after Skip remain minor coverage gaps. Full lint/type/unit/build verification passes 1,048 tests in 95 files, with spoiler/privacy/budget guards passing at 185.4 MB total / 567 KB initial. Final combined production cases and the visible owner review follow.

Final production verification passed **26/26** cases on port 5416: film autoplay, Roboptimus loading, reward, native Engine-Out and viewer controls, excluding the unrelated heavy Airbus rendering case. Responsive, reduced/accessibility, retry/end/replay and progress checks pass. The full check passes 1,048 unit tests, lint, types and build; guards/budgets/diff checks pass. Historical handoff screenshots overwritten by the existing tests were restored to their original bytes. Current movie review uses a separate visible profile without the previous artificial autoplay-policy flag and opens through Reveal reward; verify advancing time, unpaused state and sound without an extra Play click before reporting the window ready.

Visible owner review verified: `http://127.0.0.1:5416/`, title **Model FLY — automatic playback**, movie time 0.798334 seconds, `paused: false`, `muted: false`, zero page errors, no browser autoplay-policy override, and no extra Play click. The movie window remains open. Receipt: `preview-renders/roboptimus-handoff-2026-11-03/film-autoplay-browser-check.json`. All follow-up changes remain local and unpublished.
