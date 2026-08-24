# Airbus Storm Line usability: announce the drag/drop start, make the west route readable and flyable

**Goal:** Three owner-requested usability improvements to Airbus A320 Pop T Captain Mode: (1) the chapter's opening instruction box tells the player it starts as a drag-and-drop section, (2) the Storm Line scenario explains itself in plain language, and (3) the left/west route is easier to figure out and to execute — the player can always see where the safe lane is, whether they are in it, and how long they have.

**Architecture:** All new rules are pure functions in `src/game` (a new `airbusRouteGuidance` module plus exported corridor constants from `airbusSimulator`). `src/components/Hud.tsx` renders the guidance and instruction copy; `src/scenes/PrototypeScene.tsx` only strengthens existing ND presentation. No Blender/GLB change, no new dependency.

**Branch:** `pr/airbus-storm-usability` from `origin/main` (59fc601), in worktree `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/airbus-storm-usability` because a sibling session is actively working in the primary checkout.

Status: Active
Owner: Claude
Created: 2026-08-23

## Current state (measured)

- The Airbus chapter opens with status copy "The family legacy continues in Airbus A320 Pop T Captain Mode." — nothing announces the five-card matcher or that it is drag-and-drop. The only place the word "drag" appears is the tray's `aria-label` (`Hud.tsx:754`).
- The Storm Line briefing says "fly through the stable western gap" but never maps *west* to *left*, never mentions the ND gap line, and never explains that the player must physically displace the aircraft left.
- During Weather Entry (0–45 s) the player must reach `lateralPosition <= -0.35` or the checkpoint **instantly fails** at t=45 (`airbusSimulator.ts:161-169`). Lateral position is shown nowhere except a cryptic `XTK -0.35` footer on the ND. The only advance warning is one time-based caption ("The western gap is holding steady", 12–38 s).
- After entry the corridor is `|lateral + 0.7| <= 1` with a 5 s grace accumulator — also invisible, so sustained left bank silently overshoots the far edge.
- The ND draws a thin dashed gap line and `GAP n°` text; the workload sector labels WEST/CENTER/EAST appear only during the Storm Core task. HUD sector buttons say only "West / Center / East".

## Decisions (editable defaults)

1. **Show, don't hide, the corridor.** New pure `deriveStormRouteGuidance(state)` returns a tone (`action | urgent | hold | settled`), a plain-language message, and a drift-meter model (marker position + safe band on a fixed lateral scale +0.6…−2.0). Rendered as a "Route" line plus a horizontal drift meter in the storm HUD, aria-live for the message, meter itself decorative.
2. **Ease the entry gate from −0.35 to −0.25** and export the constants (`STORM_ENTRY_GATE_LATERAL`, `STORM_CORRIDOR_CENTER`, `STORM_CORRIDOR_HALF_WIDTH`) so simulator, guidance, and tests share one source of truth. This is a visible ease (the meter's green band is drawn from the same constant), requested by the owner because the west route was too hard to execute. Puzzle correctness (`MID`, `WEST`) is unchanged.
3. **Name the direction everywhere.** Briefing copy maps west → "off your left wing"; sector buttons become "West (left) / Center (ahead) / East (right)"; the stronger gap hint says "the left third of the captain ND"; corridor failure coaching references the drift meter.
4. **Announce the drag/drop start** via new `airbusCaptainFlow.qualificationIntro` copy in `src/game/config.ts`, rendered as an instruction box on the qualification screen, and the chapter-entry status message now ends "…Start with the drag-and-drop cockpit check." Keyboard path (tap card, tap target) is named in the same sentence.
5. **Strengthen the ND gap lane**: a soft translucent lane glow under the existing dashed gap line on the storm ND (presentation only, same bearing source). No weather-field or signature change.

## Tasks

- [x] 1. Export corridor constants from `airbusSimulator.ts`, ease gate to −0.25, update/extend `airbusSimulator.test.ts` (near-miss at gate−0.05 passes; gate+0.05 and 0 still fail).
- [x] 2. New `src/game/airbusRouteGuidance.ts` + test: tones, messages, meter band per checkpoint, null when not flying (10 focused tests).
- [x] 3. `config.ts` qualification intro copy + `state.ts` chapter-entry status line + `Hud.tsx` instruction box on the qualification screen.
- [x] 4. `Hud.tsx` storm briefing rewrite, Route guidance line + drift meter, sector button labels "(left)/(ahead)/(right)", corridor coaching copy; `styles.css` for the new blocks incl. 621–900 px and ≤620 px overrides, and base flex-wrap on workload actions so the longer labels cannot overflow at 521–620 px.
- [x] 5. `airbusWorkload.ts` stronger gap hint copy ("left third of the captain ND") + test update.
- [x] 6. `PrototypeScene.tsx` gap-lane glow on the storm ND (presentation-only; bearing source unchanged).
- [x] 7. Unit suite, `npm run check`, focused e2e (`airbus-storm-line`, `airbus-workload`, smoke Airbus cases) with `PLAYWRIGHT_PORT=4310`; e2e copy assertions updated to the exact new button names and new assertions added for the instruction box and guidance visibility/geometry.
- [x] 8. Real-browser pass at 1440/768/375 with reduced motion, reload, and wrong-answer paths; screenshots captured AND inspected in `preview-renders/airbus-storm-usability/`; `docs/GAME_DESIGN.md`, `BLUEPRINT.md`, `TEST_REPORT.md` updated.

## Round 2 (owner feedback 2026-08-23 after play): Engine-Out treatment + audible sound

Owner approved the Storm Line changes in play, then asked for the same treatment on Engine-Out and
reported that neither scenario plays sound.

- [x] 9. `deriveEngineOutRouteGuidance` in the shared guidance module (types generalized to
  `AirbusRouteGuidance` with data-driven meter end labels): directional-drift meter through
  recognition/stabilization with the enforced ±0.45 band, bank meter with the 8–24° SAFE RETURN
  arc during diversion, drift warnings prioritized mid-turn; 9 new unit tests.
- [x] 10. Engine-Out briefing/captions/coaching name the directions ("the nose will drift LEFT —
  hold Balance right", "SAFE RETURN is to the right"); shared `AirbusRouteGuidanceBlock` renders
  the guidance in both HUDs.
- [x] 11. Sound: root cause was double — the ambience was opt-in (default off, graph only created
  by the toggle click) AND near-inaudible when on (72 Hz sine + lowpassed noise at master gain
  0.018–0.053, nothing small speakers reproduce). Now: default ON, graph auto-created when a
  scenario is active (with pointer/key resume listeners for autoplay policy), a sawtooth hum whose
  harmonics ride the intensity-modulated lowpass, master gain 0.055 + intensity×0.1. Toggle and
  WebAudio-unavailable fallback preserved.
- [x] 12. Found and fixed a pre-existing blocker while measuring: between ~620 and ~900 px the
  control deck laid its groups in one non-wrapping row and overflowed its own box — Engine-Out by
  492 px (Balance left/right at x 988–1109, entirely outside a 768 px viewport, in flight, for the
  exact control the exercise teaches) and **Storm Line by 155 px** (thrust controls past the right
  edge). `.storm-control-deck` now wraps for both; measured overflow 0 at 375/768/1440 with no
  off-screen hold controls. Scoping the wrap to Engine-Out was tried first and rejected — it left
  Storm Line's 155 px overflow in place.
  - Wrapping makes each deck taller, so the guidance shelf was re-measured against real deck tops
    rather than guessed: storm 621–900 px `bottom` 6.2rem → 7.8rem (deck top y=785 in a 900 px
    viewport), engine-out 10.8rem (deck top y=737) and 9.3rem at ≤620 px (deck top y=673).
  - The responsive e2e only ever entered flight at 375 px, which is how both shipped. It now
    asserts, at every width, that the deck's `scrollWidth` does not exceed its `clientWidth` and
    that every `.storm-hold-control` is inside the viewport; the Engine-Out suite does the same at
    768 px in flight plus guidance/deck separation.
- [x] 13. e2e: audibility is tested per the [[synthesized-audio-envelopes]] discipline — an
  `AnalyserNode` tapped onto every destination connection measures actual waveform peaks
  (threshold 0.04 chosen to fail both silent variants: no graph at all, and the old 0.018-gain
  whisper), then the toggle must decay it below 0.005. The WebAudio-unavailable case now installs
  its throwing stub before load, which the old inline patch (installed after the graph already
  existed) never really exercised.

## Constraints

- Tone contract: fictional, safely parked, `SIM — NON OPERATIONAL` stays visible; no emergency framing.
- Wrong answers never erase completed progress; no reward/Model Y leakage.
- Rules in `src/game`, presentation in `src/scenes`, native HTML mirrors in `src/components`.
- Never weaken a test: gate-threshold tests change because the intended behavior changed at owner request, and the new value gains its own coverage.

## Validation evidence

- Unit: `npm test` 433/433 across 34 files (10 new `airbusRouteGuidance` tests; entry-gate boundary
  proven on both sides of `STORM_ENTRY_GATE_LATERAL`). `npm run check` passes end-to-end (ESLint,
  tsc, Vitest, production build), rerun after every CSS repair.
- e2e (all with `PLAYWRIGHT_PORT=4310`, isolated from the sibling session's dev server on 5199):
  - `airbus-workload.spec.ts` + `airbus-storm-line.spec.ts`: first run 9/10 — the new 375 px
    guidance-geometry assertion caught the guidance box overlapping the task panel. Final state
    after repositioning (bottom-pinned above the control deck at ≤900 px, right edge clear of the
    scene tools): workload 4/4 incl. the production-GLB mesh-click case (5.1 min), storm-line all
    green in the first run (6.4 min file).
  - `smoke.spec.ts -g "Airbus"`: 3/3 incl. production A320 GLB load and the new instruction-box
    assertions.
  - `airbus-engine-out.spec.ts`: 6/6 after all changes, including the 2.6 min production display
    case — the shared `drawWeatherRadar` signature change is regression-clean for Engine-Out.
- Visual: 15 screenshots in `preview-renders/airbus-storm-usability/` captured through the env-gated
  `e2e/airbus-usability-captures.spec.ts` and the workload spec's evidence hooks; every 375/768/1440
  frame was opened and inspected. Two defects found by inspection (scene-tools "?" button overlapping
  the guidance box at 375 and 768) and fixed with measured clearances before recapture.

## Discoveries

- The `.scene-tools` pair ("?" + fullscreen) floats ~5.8rem inboard of the right edge in the storm
  view at small widths; anything pinned to the lower-right must clear ~6–7rem, not 2.6rem.
- The captain-task panel's height varies with wrapped action buttons at 375 px (bottom ≈346 px),
  so fixed `top:` placement for a second band under it is fragile; pinning to the bottom above the
  control deck is stable across checkpoints and hint states.
- A seeded capture state must set `statusMessage` explicitly or the dock shows the DC-9 default
  line in evidence frames.

## Outcome and handoff

Round 1 (drag/drop announcement, Storm Line guidance, west-route ease) was played and approved by
the owner on 2026-08-23. Round 2 (Engine-Out guidance, audible default-on ambience, and the
control-deck overflow fix found while measuring) is implemented, tested, and visually verified on
branch `pr/airbus-storm-usability`
(worktree `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/airbus-storm-usability`).

Play it locally with `npm run preview -- --port 5310` from the worktree; the branch is not pushed
and no deployment carries it, so a stale server or the main checkout will show the old chapter.

Remaining: owner play/visual review of round 2; optional Vercel preview at the next approval gate;
routine merge with the sibling session's DC-9 branch (`PrototypeScene.tsx` footprints are
disjoint — confirmed with that session).
