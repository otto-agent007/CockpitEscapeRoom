# CockpitEscapeRoom Blueprint

## Core thesis

CockpitEscapeRoom is a personalized, family-friendly browser escape room with one emotional arc:

**automatic console-era cinematic → DC-9 First-Officer Final Flight Log → Captain's Locker → Airbus A320 Pop T Captain Mode → red Model Y Flight Mode reward → optional Mars Easter egg**

It honors an expert pilot who began on the McDonnell Douglas DC-9 and later flew Airbus aircraft. Dad is always portrayed as capable, calm, and respected. The present-day tribute aircraft is safely parked; the Memphis taxi and takeoff are an explicitly fictional 1995 memory recreation, never an accident or operational lesson.

## Current journey

1. A fresh or restarted game mounts the cinematic immediately. There is no outer **Start Game** screen; the cinematic's own **PRESS START** opens the DC-9 chapter.
2. From the DC-9-32 first-officer/right seat, the player completes the control check and instrument scan.
3. **Memphis Legacy Departure** recreates a short, qualitative Concourse B taxi and takeoff memory through checkpoint-safe arcade controls.
4. The non-puzzle **Home Operations Log** recognizes Momma Cheryl's parallel work at home.
5. The **Legacy Route Record**, ceremonial shutdown, ATP milestone, and Captain's Key close the Final Flight Log.
6. The key opens the unchanged Captain's Locker sequence: watch → baseball → Charging Bull → airline wings → captain's hat.
7. **Enter Pop T Captain Mode** opens the separate Airbus A320 captain/left-seat cockpit, five-card qualification, Storm Line, and Engine-Out Handling scenarios.
8. Completing Airbus unlocks the protected red Model Y reveal and sleek Flight Mode transformation, followed by the Father's Day message.
9. Mars remains optional and separate from the main ending.

Persisted later chapters resume directly. Wrong choices may rewind the active checkpoint but never erase completed puzzle or chapter progress.

## Player loop

**Observe → inspect → decide → receive feedback → retry or request a progressive hint → restore the active system → receive a personal reward → advance**

Every required 3D action has a native HTML, keyboard, or equivalent accessible path. Reduced-motion, audio fallback, corrupt-save recovery, and narrow-screen functionality are part of the experience contract.

## Visual identity and safety

- The production legacy aircraft is the owner-cleared **McDonnell Douglas DC-9-32**, viewed from the first-officer/right seat.
- The Memphis environment is a compressed 1995 memory inspired by older Concourse B, not an exact KMEM reconstruction and not a training aid.
- The later cockpit is a separate **Airbus A320** from the captain/left seat. It may not reuse DC-9 geometry or aircraft-specific details.
- The Model Y remains hidden until DC-9, locker, and Airbus are complete.
- Flight Mode stays premium and plausible-futuristic: articulated panels, wings or stabilizers, integrated lift details, restrained lighting, and no humanoid transformation.
- Authentic-looking controls support fictional, non-operational interactions only.

## Architecture

- Vite, React, TypeScript, React Three Fiber, and Three.js power the browser game.
- Pure rules, content, reducer state, and persistence live in `src/game/`; 3D presentation lives in `src/scenes/`; accessible UI lives in `src/components/`.
- Canonical schema 15 stores local-only progress across `briefing | dc9 | locker | airbus | reward | mars` and migrates older saves safely.
- The app loads the cinematic first, preloads the DC-9 cockpit and Memphis view during it, and lazy-loads later chapter assets.
- Blender is authoritative for production geometry, materials, pivots, cameras, animation, hierarchy, and exported `game_id` metadata. Validated GLBs are the runtime format.

## Asset boundaries

Each production group has a separate source and deployable:

- `art-source/blender/dc9_master.blend` → `public/models/dc9-cockpit.glb`
- `art-source/blender/dc9-memphis-legacy-departure.blend` → `public/models/dc9-memphis-legacy-departure.glb`
- authoritative shaded A320 master → `public/models/airbus-captain.glb`
- `art-source/blender/locker_room_master.blend` → `public/models/locker-room.glb`
- `art-source/blender/tesla_reward.blend` → `public/models/model-y-reward.glb`

Stable names, pivots, hierarchy, animations, cameras, and `game_id` properties are public runtime contracts. Tripo outputs remain candidates until Blender cleanup, deterministic validation, asset reporting, and browser review are complete.

## Delivery model

`AGENTS.md` carries durable repository rules, `plans/` carries living ExecPlans, scoped Skills carry repeated workflows, and `TEST_REPORT.md` records actual validation. Work proceeds through small implementation checkpoints, focused tests, real-browser exercise, responsive visual inspection, full-diff review, root-cause repair, and recorded evidence.

Owner review remains required after the DC-9, locker, Airbus, reordered journey, Model Y Flight Mode, and final complete-game visual gates. A Vercel preview and consistent screenshots accompany visual milestones.

## Definition of done

A release candidate is done only when:

- the complete cinematic → DC-9 → locker → Airbus → reward journey works, with Mars remaining optional;
- success, failure, repeated-failure, hint, keyboard, reload, resume, restart, reduced-motion, and asset-fallback paths behave safely;
- the DC-9 and Airbus pass owner visual approval from their fixed seat roles;
- every required WebGL interaction has an accessible equivalent;
- approximately 375, 768, and 1440 CSS pixel layouts remain functional and readable;
- no Model Y spoiler leaks, uncaught console errors, broken assets, or critical/high review findings remain;
- `npm run check`, `npm run test:e2e`, and `npm run assets:check` pass; and
- the reviewed Vercel build matches the validated local result.
