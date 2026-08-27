# CockpitEscapeRoom Blueprint

## 1. Core thesis

CockpitEscapeRoom is a personalized Father’s Day tribute flow with one emotional arc:
automatic console-era cinematic / PRESS START → DC-9 First-Officer Final Flight Log → unchanged locker memory reveal → Airbus A320 Pop T Captain Mode → hidden Model Y reveal.

## 2. Player and occasion

The honoree is a former pilot who began on DC-9 and later flew Airbus aircraft. The game should remain ceremonial and family-friendly.

Wrong choices should never erase earned milestones. The aircraft is safely parked; this is legacy, not an emergency.

## 3. Experience structure

1. **DC-9 First-Officer Final Flight Log** opening memory chapter from the right seat.
2. **Locker room sequence** with personal memory objects.
3. **Airbus A320 Pop T Captain Mode** crew experience, now occupying the Captain-mode slot.
4. **Red Tesla Model Y reveal** as the personal reward.
5. **Optional Mars Easter egg** after completion.

## 4. Player loop

**Observe → inspect → decide → feedback → retry or hint → unlock next layer → reveal personal reward → advance**

Wrong answers must never erase completed stages.

## 5. Story and spoiler rules

- The DC-9 is the first gameplay layer and should feel personal, warm, and safely parked.
- Do not show the Model Y before the DC-9, locker, and Airbus chapters are complete.
- The DC-9 and Airbus remain distinct aircraft experiences.

## 6. Technical direction

- Vite + React + TypeScript + React Three Fiber + Three.js.
- Pure reducer/state in `src/game`, presentation in `src/scenes`, controls and status in `src/components`.
- Load DC-9 first, then locker, Airbus, and reward layers as unlocked.
- Keep hints progressive and persistent saves robust.

## 7. Delivery priorities

1. Stable Final Flight Log records, shutdown, and Captain’s Key.
2. Locker memory interaction and hat-reveal gate.
3. Airbus Pop T Captain Storm Line simulator from the left seat, unlocked only after the five-card qualification is completed.
4. Reward reveal UI and final closing message.
5. Mars optional trigger.

## 4. Player loop

Every puzzle follows the same loop:

**Observe → inspect → decide → receive immediate feedback → retry or request a progressive hint → restore one system → receive a personal or visual reward → advance.**

Wrong answers never erase completed puzzles. Final Flight Log route stamps and shutdown steps remain complete across later mistakes.

## 5. Final Flight Log and Airbus experience

Fresh and restarted games mount the console-era cinematic immediately. Its initial art tier gates playback without exposing a separate landing page; soundtrack autoplay is attempted once, and a browser rejection moves the visuals onto the silent fallback clock with a visible sound retry. The cinematic's native **PRESS START** remains available from its authored cue and routes to the Final Flight Log. Persisted later chapters resume directly. The Final Flight Log uses the DC-9 right-seat first-officer view, a reliable route strip attached to the first-officer yoke, a readable HTML route record, progressive hints, a non-puzzle Home Operations Log, the three supported shutdown controls, and the ATP milestone. The later Airbus experience uses the left-seat captain view, opens with an instruction box announcing the drag-and-drop label check (with a tap-based path named alongside), requires all five labels to be matched, and then offers **Begin Storm Line** before transitioning to the focused fictional Storm Flight view. Storm Line names the west gap as "off your left wing" and shows a live Route guidance line with a drift meter: the green band is derived from the same exported corridor constants the flight model enforces, so the player can always see whether they are in the west lane and how long Weather Entry remains open. Storm Line and Engine-Out Handling add four short captain-workload decisions on the existing ND and upper ECAM. They are required but forgiving: an unfinished decision safely holds only the next simulator boundary, wrong choices strengthen coaching, and completed decisions survive retry and reload.

The Final Flight Log is not a memorization exam. The Northwest/Memphis/DC-9 history should appear mainly in scenery, route choices, dispatch texture, sounds, and the rhythm of the hub. Fleet counts, exact retirement dates, and economics are reference material, not required answers unless a later puzzle proves fun in playtesting.

## 6. Personalized narrative and rewards

The DC-9 level celebrates the aircraft as a durable short-haul workhorse in the Memphis network. The family crew restores a fictional “legacy lockout” and rebuilds a small portion of the Southern funnel around MEM.

Completing the reordered DC-9 → locker → Airbus journey opens the hangar and reveals a red Model Y. The production reward scene may use a playful plate such as `CAPT DAD`, `DC9 2 EV`, `MEM FLYR`, or `MARS 09` after the owner chooses one.

The later Airbus Pop T Captain chapter represents type transition and adaptability. A hidden Mars control turns the Model Y into a humorous surface vehicle and awards the rank “Commander, Mars Transport Division.”

## 7. Visual realism standard

The DC-9 must read immediately as a DC-9 from the first-officer/right seat. Required qualities include correct major geometry, analog instrument density, center-panel proportions, yokes, overhead and pedestal relationships, era-appropriate panel color, believable wear, glass, labels, restrained annunciator light, and a convincing first-officer eye camera.

The Airbus Pop T Captain cockpit must be a completely separate asset. It may not be a recolored or rearranged DC-9. The exact Airbus model must be confirmed before final modeling because display, side-stick, flight-control-unit, overhead, pedestal, and lighting details depend on the model.

Visual accuracy and puzzle behavior are separated: the cockpit can look authentic while the interactive sequences remain fictional.

## 8. Technical architecture

The browser stack is Vite, React, TypeScript, React Three Fiber, and Three.js. Blender is the source of truth for production geometry, materials, pivots, animations, cameras, and custom interaction metadata. GLB/glTF is the runtime asset format.

HTML overlays carry instructions, hints, settings, captions, and accessible alternatives. Game rules live outside 3D components. Progress is stored locally and versioned. The Airbus, vehicle reward, and Mars assets should be lazy-loaded after unlock.

## 9. Blender and asset pipeline

Each production scene has its own master file and deployable GLB:

- `dc9_master.blend` → `dc9-cockpit.glb`
- `art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend` → `airbus-captain.glb`
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

**Phase 1 — DC-9 Final Flight Log proof:** route record, Home Operations recognition, ceremonial shutdown, Captain’s Key, browser integration.

**Phase 2 — locker reveal proof:** personal locker objects, captain’s hat reveal, accessible inspection flow, and spoiler-safe transition.

**Phase 3 — Airbus Pop T Captain proof:** left-seat qualification camera, mandatory object matching, exported Storm Flight camera, Storm Line manual-flight scenario, live cockpit displays and controls, browser integration, and owner visual gate.

**Phase 4 — Model Y reward:** red Model Y asset, achievement card, optional plate.

**Phase 5 — main game polish:** progressive hints, saved progress, final message, performance budget, and cross-scene regression pass.

**Phase 6 — Mars Easter egg and release:** hidden trigger, final family copy, complete regression pass, print/share packaging if desired.

## 13. Definition of done

A release candidate is done only when:

- All required puzzles can be completed across the DC-9, locker, and Airbus chapters.
- Correct, wrong, repeated-wrong, hint, reload, resume, and reset paths work.
- The DC-9 passes owner visual approval from the first-officer/right seat and the Airbus from the captain/left seat.
- The Airbus model and DC-9 variant are documented.
- Keyboard and screen-reader equivalents exist for every required 3D action.
- Reduced-motion mode, sound controls, and readable contrast are present.
- The app works at approximately 375, 768, and 1440 CSS pixels wide.
- No uncaught console errors, broken assets, or high-severity review findings remain.
- `npm run check`, `npm run test:e2e`, and `npm run assets:check` pass.
- A Vercel production build has been reviewed in the browser.
