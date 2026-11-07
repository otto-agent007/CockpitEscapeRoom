# Mobile cockpit touch controls

## Purpose and approved design

Goal: phone/tablet players can see the DC-9 and A320 cockpit while operating native touch controls. The owner reported panels blocking the view and chose **compact controls below the cockpit**, with longer instructions behind Help. This is the approved approach and design. A drawer was considered but would hide frequently used flight inputs. A CSS-only smaller overlay would continue to cover instruments; reserve actual screen space below the canvas instead.

Context: branch feat/mobile-cockpit-controls starts at 77e04df (the approved entry page on draft PR #123). Native hold controls already exist in Dc9AxisControls/Hud. At 375×812, the current DC-9 panel is 359×471 at y=253, covering 58% of the canvas, with additional footer obstruction. Before screenshots/measurements are in /tmp/mobile-cockpit-inspect. Initial A320 inspection used a nonexistent readiness attribute; that is a capture-fixture error, not a product error. Correct the fixture to wait for real UI/camera readiness. Keep this mobile work separate from PR #123.

## Constraints

Preserve identity, right-seat DC-9 and left-seat A320 camera contracts, game rules/progress, loading/retry, wrong-answer/hint behavior, reduced motion, keyboard/gamepad/native routes, spoiler protection and approved entry/art. No new dependency, account, analytics or paid API. One workspace, preserve unrelated files. No Blender/GLB edits. Desktop remains equivalent. Mobile portrait and landscape are supported without forcing rotation. Continuous touch controls at least 48 CSS pixels; utilities at least 44 CSS pixels; support simultaneous inputs and safe release/cancel/blur/unmount. Do not persist layout/help state or reset earned progress on orientation changes.

## Design and architecture

- Reserve a bottom controls area at widths up to 900 px and coarse-pointer screens up to 1200 px; shrink the actual canvas/view region above it so controls cannot cover instruments. Retain projected targets in canvas-relative coordinates.
- DC-9 control check shows the current axis with two large labelled hold buttons; completed steps advance the visible axis. Detailed introduction/checklist moves into Help. Instrument scan uses compact native choice buttons and the existing progressive coaching. Departure exposes only its existing phase-specific axes and safe retry/lineup actions. Shutdown retains native controls.
- A320 label cards become a compact touch tray below the cockpit; tap a label, then its real cockpit target. Instructions remain in Help. Storm Line and Engine-Out keep required hold controls, route/task guidance and readouts in the reserved tray; pause and help remain reachable. Long instructions/restart/recenter options can live in Help.
- Shared native HoldButton handles pointer capture, two-finger operation, keyboard holds and safe release. Reuse existing input callbacks/rules. Shared responsive/help helpers affect presentation only. Scope CSS to mobile cockpit states.

## Implementation and progress

- [x] Inspect current branch/UI and obtain owner's layout choice; reproduce obstruction in the real DC-9 browser.
- [x] Add focused mobile behavior/layout tests and observe the obstruction failure before product changes.
- [x] Implement shared hold/help helpers and compact DC-9/A320 presentation.
- [x] Validate 375/768/1440 and short landscape, touch and keyboard, wrong/repeated answers/hints, pause/retry, reload/orientation and reduced motion. Capture actual 3D browser evidence.
- [x] Run focused/full quality checks, assets/privacy/spoiler/budget guards, full-diff review, and update TEST_REPORT.md.
- [ ] Display actual screenshots in the owned tmux pane and prepare a Vercel review preview. No merge/promotion.

## Files

src/App.tsx: presentation state attribute only. src/components/HoldButton.tsx and CockpitHelp.tsx/useCompactCockpit.ts: reusable native/responsive primitives. src/components/dc9/{Dc9Chapter,ControlCheckPanel,Dc9AxisControls,MemphisDeparturePanel,InstrumentScanPanel}.tsx: compact presentation and current phase. src/components/Hud.tsx: A320 tray/help/shared hold controls. src/components/mobileCockpit.css: scoped reserved view/tray layout, imported after existing styles. e2e/mobile-cockpit.spec.ts: meaningful mobile geometry, multitouch/release, keyboard and safe progress regression cases. Existing desktop suites and state/rule code remain authoritative.

## Validation and acceptance

First focused test must reproduce the existing canvas/control overlap. Product acceptance requires controls' bounding boxes at or below the canvas edge in compact states, no horizontal overflow, cockpit at least 40% of short landscape and 50% of ordinary portrait viewport, essential controls reachable and touch-sized, correct release of simultaneous holds, stable progress across reload/orientation/help, and native keyboard equivalence. Browser screenshots (real GLBs) remain required beyond static/fallback functional tests. Browser plugin unavailable; use installed Playwright/Chromium. Full npm run check is executed as lint excluding unrelated .worktrees, types, all unit tests and build if the unqualified lint scans historical worktrees. Do not weaken a gate to make it pass.

## Repair loop and evidence

Review → one focused repair → failing/nearby checks → record delta. At most three attempts per repeated issue, then investigate the exact cause or stop for a concrete human decision. No broad unchanged archive/hash sweeps. Record actual evidence here and in TEST_REPORT.md. Owner visual approval of actual mobile behavior remains outstanding until reviewed.

RED: `/tmp/mobile-cockpit-red.log` reproduces overlap (controls y=253 while canvas ends at 812) before product changes. Presentation implementation uses a phase-loaded CSS chunk. The first build was 600 KB just over the unchanged initial budget; the DC-9 native chapter UI/CSS now also loads with that chapter through React Suspense (the 3D preload contract is unchanged), avoiding an unrelated initial-download increase. Help portals escape clipping/transform containers; flight Help pauses the live challenge and retains explicit Resume.

Iteration evidence: seven initial mobile checks pass after correcting the CDP fixture to name the ending finger rather than the remaining finger (isolated native pointerup logging confirmed that behavior). New Help/progressive-hint/A320-tap checks exposed inherited Restart margins and a fallback target layer whose old top inset put tap targets under the tray. Scoped resets address those root causes; no game rule or threshold was weakened. Real 375 px captures show DC-9 canvas height 522 instead of 812 with the 471 px overlay; the native tray starts exactly at canvas bottom. Current first-pass screenshots are /tmp/mobile-cockpit-inspect/after, pending final polishing and inspection.

Review repairs: early DC-9 scan/shutdown messages, departure corrections and A320 workload hints remain visibly available in the tray. Help is a native modal with explicit Tab wrapping, Escape/Close restoration and breakpoint-unmount reset. A reviewer-confirmed shutdown test fixture lacked route completion; it now uses the canonical qualification fixture and clears only shutdown progress. The phase CSS import caused a real reload paint race; with DC9 UI already lazy (39KB saved), compact CSS is now part of the blocking main stylesheet, keeping the budget unchanged while making first paint deterministic. Final budget is checked below rather than assumed.

Final repair evidence: four targeted cases pass, including native desktop names and compact/modal contrast. Existing DC9 button names derive from visible text on desktop; mobile keeps descriptive native names. Close/secondary Help buttons use explicit high-contrast colors. Memphis yearly label and Retry visibility now have regression assertions. The real A320 GLB sidestick accepts a phone tap after selecting its label (1/1,27.1s; /tmp/mobile-cockpit-inspect/touch.log). Shared feedback, modal focus and breakpoint issues are resolved by independent re-review. Final production checks/screenshots follow below.

Final acceptance: broad production Chromium run **29/29 in 1.8m** (`/tmp/mobile-cockpit-final-production.log`), including complete journey. After compact task-priority/grid refinements, **15/15 production mobile/layout/axe checks in 17.6s** (`/tmp/mobile-cockpit-final-mobile-production.log`) pass across 375×812, 667×375, 768×1024, 932×430 and 1024×768. All 1,060 unit tests in 96 files pass in 4.53s; lint/types/build and assets/intro 58 assets / 51 preloads pass (`/tmp/mobile-cockpit-release-{quality,guards}.log`). Final build/privacy/spoiler/budget logs are `/tmp/mobile-cockpit-final-build{,-guards}.log`; initial download **577/600 KB**. Static compact CSS eliminates reload flash; deferred DC9 UI preserves the initial budget. Review has no Critical/Important residual. Primary task actions are prioritized while active and route guidance remains visible; in short landscape, longer readout/task/guide details scroll independently of native holds.

Evidence authority: real full-source Chromium captures use the actual runtime GLBs; no-cache bytes/hashes match disk (runtime-models.json). Phone taps place SIDESTICK on its actual projected 3D target. The sole external-capture retries corrected a nonexistent readiness attribute, invalid seed stages and a viewport that was not reset between chapters; those fixture failures are not product acceptance. Source/player behavior and final repaired assertions remain intact. Current delta: finish final flight screenshot refresh, publish isolated draft/preview, display comparison in the existing tagged pane, and obtain owner mobile playtest review.

Final source freeze: latest production build and guards pass at 577/600 KB. The final two flight layout cases pass 2/2 in 4.6s with fully visible primary task actions and non-overlapping 48px holds at all five compact sizes. Bounded guidance/readout scrolling preserves full text while required decisions and native holds stay visible. Flight screenshot refresh now uses the final source fingerprint; no further implementation work remains unless the owner requests changes.

All runtime/UI evidence is now saved under `preview-renders/mobile-cockpit-controls-2026-11-06/`. The actual before/after comparison is displayed in the verified owned tmux pane %1. The final four flight images pass their real-GLB capture run in 50.9s, with empty browser error receipt. Final hold group allocation fixes labels without reducing 48px hit targets; explicit non-overlap regressions pass 2/2 on the published-source production build. Wide phone/tablet flight sizes are tested at 932/1024; selected final screenshots focus 375/667 with DC9/A320 qualification tablet/desktop views. Owner approval is still pending. Next delta is only the draft PR/preview handoff.
