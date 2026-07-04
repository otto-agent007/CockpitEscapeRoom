# CockpitEscapeRoom Blueprint

## 1. Core thesis

CockpitEscapeRoom is a personalized Father’s Day tribute flow with one emotional arc:
Airbus First-Officer onboarding → locker memory reveal → Pop T Captain Mode in the DC-9 → hidden Model Y reveal.

## 2. Player and occasion

The honoree is a former pilot who began on DC-9 and later flew Airbus aircraft. The game should remain ceremonial and family-friendly.

Wrong choices should never erase earned milestones. The aircraft is safely parked; this is legacy, not an emergency.

## 3. Experience structure

1. **Airbus A320 First-Officer Mode** onboarding.
2. **Locker room sequence** with personal memory objects.
3. **Pop T Captain Mode** (DC-9 legacy checklist challenge).
4. **Red Tesla Model Y reveal** as the personal reward.
5. **Optional Mars Easter egg** after completion.

## 4. Player loop

**Observe → inspect → decide → feedback → retry or hint → unlock next layer → reveal personal reward → advance**

Wrong answers must never erase completed stages.

## 5. Story and spoiler rules

- Airbus is the first gameplay layer and should not reveal DC-9 or Model Y spoilers.
- Do not show the Model Y before final Captain Mode completion and hangar reveal.
- The DC-9 is personal and more dense than Airbus.

## 6. Technical direction

- Vite + React + TypeScript + React Three Fiber + Three.js.
- Pure reducer/state in `src/game`, presentation in `src/scenes`, controls and status in `src/components`.
- Load Airbus first, then DC-9 and reward layers as unlocked.
- Keep hints progressive and persistent saves robust.

## 7. Delivery priorities

1. Stable First-Officer matcher and clock gate.
2. Locker memory interaction and hat-reveal gate.
3. DC-9 checklist/route sequence.
4. Reward reveal UI and final closing message.
5. Mars optional trigger.

## 4. Player loop

Every puzzle follows the same loop:

**Observe → inspect → decide → receive immediate feedback → retry or request a progressive hint → restore one system → receive a personal or visual reward → advance.**

Wrong answers never erase completed puzzles. Captain Mode may reset the current attempt, but it must remain fair and fun.

## 5. Crew Mode and Captain Mode

Crew Mode includes city names, clearer labels, and stronger progressive hints. Captain Mode uses airport codes, compact labels, realistic-looking route strips, and subtler clues.

Captain Mode is not a memorization exam. The Northwest/Memphis/DC-9 history should appear mainly in scenery, route choices, dispatch texture, sounds, and the rhythm of the hub. Fleet counts, exact retirement dates, and economics are reference material, not required answers unless a later puzzle proves fun in playtesting.

## 6. Personalized narrative and rewards

The DC-9 level celebrates the aircraft as a durable short-haul workhorse in the Memphis network. The family crew restores a fictional “legacy lockout” and rebuilds a small portion of the Southern funnel around MEM.

Completing Captain Mode opens the hangar and reveals a red Model Y. The production reward scene may use a playful plate such as `CAPT DAD`, `DC9 2 EV`, `MEM FLYR`, or `MARS 09` after the owner chooses one.

The Airbus First-Officer opening represents type transition and adaptability. A hidden Mars control turns the Model Y into a humorous surface vehicle and awards the rank “Commander, Mars Transport Division.”

## 7. Visual realism standard

The DC-9 must read immediately as a DC-9 from the captain’s seat. Required qualities include correct major geometry, analog instrument density, center-panel proportions, yokes, overhead and pedestal relationships, era-appropriate panel color, believable wear, glass, labels, restrained annunciator light, and a convincing captain-eye camera.

The Airbus First-Officer cockpit must be a completely separate asset. It may not be a recolored or rearranged DC-9. The exact Airbus model must be confirmed before final modeling because display, side-stick, flight-control-unit, overhead, pedestal, and lighting details depend on the model.

Visual accuracy and puzzle behavior are separated: the cockpit can look authentic while the interactive sequences remain fictional.

## 8. Technical architecture

The browser stack is Vite, React, TypeScript, React Three Fiber, and Three.js. Blender is the source of truth for production geometry, materials, pivots, animations, cameras, and custom interaction metadata. GLB/glTF is the runtime asset format.

HTML overlays carry instructions, hints, settings, captions, and accessible alternatives. Game rules live outside 3D components. Progress is stored locally and versioned. The Airbus, vehicle reward, and Mars assets should be lazy-loaded after unlock.

## 9. Blender and asset pipeline

Each production scene has its own master file and deployable GLB:

- `dc9_master.blend` → `dc9-cockpit.glb`
- `airbus_master.blend` → `airbus-first-officer.glb`
- `tesla_reward.blend` → `model-y-reward.glb`

The pipeline validates roots, cameras, pivots, object names, `game_id` values, textures, materials, scale, and GLB structure before copying an asset into `public/models`.

The first milestone is a proof of pipeline, not a complete cockpit.

## 10. Codex operating model

Codex receives durable repository guidance through `AGENTS.md`, longer work through living ExecPlans based on `PLANS.md`, and repeated workflows through scoped Skills.

Every task prompt should state:

- Goal.
- Context.
- Constraints.
- Done when.

Complex tasks begin in Plan mode. Codex must inspect existing work, make small coherent changes, test in the actual browser, review the diff, and record evidence.

## 11. Implementation and repair loop

For each milestone, Codex repeats:

**Orient → plan → implement → validate → launch → exercise success and failure paths → inspect visually → review the diff → repair root causes → record evidence and checkpoint.**

The loop stops when validation passes, the maximum bounded attempts are reached, the remaining failure delta stops shrinking, or a genuine visual/product decision requires human review. Every pass leaves an audit trail in the ExecPlan and `TEST_REPORT.md`.

## 12. Delivery roadmap

**Phase 0 — Bootstrap:** working greybox, docs, tests, CI, Vercel preview, Blender scripts.

**Phase 1 — Airbus First-Officer proof:** approachable cockpit landmarks, drag-and-drop object matching, clock gate, browser integration.

**Phase 2 — locker reveal proof:** personal locker objects, captain’s hat reveal, accessible inspection flow, and spoiler-safe transition.

**Phase 3 — DC-9 Captain Mode proof:** captain-eye blockout, analog checklist puzzle, route card, browser integration, and owner visual gate.

**Phase 4 — Captain reward:** red Model Y asset, achievement card, optional plate.

**Phase 5 — main game polish:** progressive hints, saved progress, final message, performance budget, and cross-scene regression pass.

**Phase 6 — Mars Easter egg and release:** hidden trigger, final family copy, complete regression pass, print/share packaging if desired.

## 13. Definition of done

A release candidate is done only when:

- All required puzzles can be completed in Crew and Captain modes.
- Correct, wrong, repeated-wrong, hint, reload, resume, and reset paths work.
- The DC-9 and Airbus pass owner visual approval from the captain’s viewpoint.
- The Airbus model and DC-9 variant are documented.
- Keyboard and screen-reader equivalents exist for every required 3D action.
- Reduced-motion mode, sound controls, and readable contrast are present.
- The app works at approximately 375, 768, and 1440 CSS pixels wide.
- No uncaught console errors, broken assets, or high-severity review findings remain.
- `npm run check`, `npm run test:e2e`, and `npm run assets:check` pass.
- A Vercel production build has been reviewed in the browser.
