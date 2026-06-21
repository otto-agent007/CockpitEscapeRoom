# CockpitEscapeRoom Blueprint

## 1. Core thesis

CockpitEscapeRoom is a personalized Father’s Day escape-room game that uses aviation realism as emotional credibility, not as a flight-training exercise. The experience honors an accomplished pilot’s move from the analog DC-9 era to a modern Airbus cockpit, while weaving in his interest in investing, technology, Elon Musk, a recently purchased red Tesla Model Y, and Mars exploration.

The product succeeds when a former pilot recognizes the cockpits, the family can still solve the game, and the personal reward feels earned.

## 2. Player and occasion

The primary honoree is a former pilot who began on DC-9s and later flew Airbus aircraft. The primary players are family members with mixed aviation knowledge. The game should work as a shared Father’s Day event on a laptop or large screen, with phone and tablet support for convenience.

The game is not built around the captain failing. The aircraft is safely parked for a commemorative legacy flight. The family crew is reconstructing lessons and memories to unlock the hangar and reveal the reward.

## 3. Experience structure

The approved structure is:

1. DC-9 main escape room.
2. Optional Captain Mode with slightly leaner clues and more authentic aviation flavor.
3. Red Tesla Model Y reward after Captain Mode completion.
4. Separate Airbus bonus level using a model-specific cockpit.
5. Hidden Mars mission Easter egg.

The production game should use roughly five short DC-9 puzzles and one substantial Airbus bonus challenge. The starter slice implements two representative puzzles so the interaction model can be tested before the full content is authored.

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

The Airbus bonus represents type transition and adaptability. A hidden Mars control turns the Model Y into a humorous surface vehicle and awards the rank “Commander, Mars Transport Division.”

## 7. Visual realism standard

The DC-9 must read immediately as a DC-9 from the captain’s seat. Required qualities include correct major geometry, analog instrument density, center-panel proportions, yokes, overhead and pedestal relationships, era-appropriate panel color, believable wear, glass, labels, restrained annunciator light, and a convincing captain-eye camera.

The Airbus bonus must be a completely separate cockpit asset. It may not be a recolored or rearranged DC-9. The exact Airbus model must be confirmed before final modeling because display, side-stick, flight-control-unit, overhead, pedestal, and lighting details depend on the model.

Visual accuracy and puzzle behavior are separated: the cockpit can look authentic while the interactive sequences remain fictional.

## 8. Technical architecture

The browser stack is Vite, React, TypeScript, React Three Fiber, and Three.js. Blender is the source of truth for production geometry, materials, pivots, animations, cameras, and custom interaction metadata. GLB/glTF is the runtime asset format.

HTML overlays carry instructions, hints, settings, captions, and accessible alternatives. Game rules live outside 3D components. Progress is stored locally and versioned. The Airbus, vehicle reward, and Mars assets should be lazy-loaded after unlock.

## 9. Blender and asset pipeline

Each production scene has its own master file and deployable GLB:

- `dc9_master.blend` → `dc9-cockpit.glb`
- `airbus_master.blend` → `airbus-bonus.glb`
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

**Phase 1 — DC-9 visual proof:** captain-eye blockout, three switches, one gauge, one annunciator, one route card, browser integration.

**Phase 2 — DC-9 vertical slice:** one polished puzzle with approved materials, sound, lighting, interaction, keyboard equivalent, and performance budget.

**Phase 3 — Main game:** five short puzzles, progressive hints, saved progress, final hangar opening.

**Phase 4 — Captain reward:** original or licensed red Model Y asset, achievement card, optional plate.

**Phase 5 — Airbus bonus:** model-specific cockpit, one substantial transition puzzle, separate bundle.

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
- Source and license records exist for all externally derived assets.
- `npm run check`, `npm run test:e2e`, and `npm run assets:check` pass.
- A Vercel production build has been reviewed in the browser.
