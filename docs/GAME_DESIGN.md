# CockpitEscapeRoom — Game Design

## Current creative direction

**CockpitEscapeRoom** is a personalized, family-friendly 3D browser escape-room game built as a tribute to Dad, a skilled former airline pilot. The game should feel like a polished Father’s Day surprise: part cockpit mystery, part family tribute, part reward reveal.

Dad must always be portrayed as a highly capable pilot. The story honors what the family learned from him.

## Confirmed production targets

- **First-Officer Mode aircraft:** Airbus A320.
- **Pop T Captain Mode aircraft:** McDonnell Douglas DC-9-50.
- **Reward vehicle:** red Tesla Model Y.

These are now the chosen production targets. Do not describe the Airbus as an unspecified bonus aircraft, and do not treat DC-9-51 as the production target. Existing DC-9-51 source artifacts may remain useful only as labeled compatibility or historical reference material.

## Player loop

**observe → inspect → interact → receive feedback → retry or take a hint → unlock the next layer → reveal a personal reward → advance**

Wrong answers must never erase completed progress or force a restart.

## Progression

1. **Airbus A320 First-Officer Mode** — approachable drag-and-drop cockpit familiarization.
2. **Locker Room / Captain’s Locker Scene** — personal reveal space with memory objects and milestone clues.
3. **Pop T Captain Mode — DC-9-50** — tougher analog checklist-style legacy challenge.
4. **Ground Transport Upgrade Authorized** — protected red Tesla Model Y surprise.
5. **Advanced Mobility Package Unlocked** — Model Y Flight Mode transformation.
6. **Father’s Day Final Message** — emotional closing beat.
7. **Optional Mars Easter Egg** — short, playful, and separate from the main ending.

## Airbus A320 First-Officer Mode

First-Officer Mode teaches the family the language of the cockpit in a fun, game-like way. Use a modern A320 cockpit, clear labels, safe retry behavior, progressive hints, and accessible HTML equivalents for required 3D interactions.

Do not foreshadow Pop T Captain Mode, the DC-9-50, the Model Y, or Flight Mode during this section.

## Locker Room / Captain’s Locker Scene

The locker room is the emotional hinge of the game. It should be quieter, warmer, and more intimate than the Airbus A320 cockpit. The player inspects personal objects, memory clues, and a final captain’s hat reveal before Pop T Captain Mode unlocks.

The locker should feel like a place, not a quiz menu. Use a mix of click-to-learn moments, short prompts, and one final promotion trigger.

## Pop T Captain Mode — DC-9-50

The DC-9-50 is the earned legacy cockpit. It should feel older, denser, more analog, and more personal than the Airbus A320.

This is not a generic hard mode. It is **Pop T Captain Mode**.

Use harder, checklist-like puzzles while staying fictional, safe, and family-friendly:

- Captain’s scan puzzle
- Legacy checklist sequencing
- MEM route-strip reasoning
- Analog panel observation
- Personal memory recall
- Final hangar release authorization

Use DC-9-50 references for production geometry. Use other DC-9 variants only when compatibility limits are recorded.

## Model Y reward and Flight Mode sequence

The red Tesla Model Y must remain hidden until after Pop T Captain Mode completion.

Reward sequence:

1. The DC-9-50 settles into a warm completed-state glow.
2. The hangar confirms: **“Legacy authorization confirmed.”**
3. The red Tesla Model Y is revealed.
4. Title: **“Ground Transport Upgrade Authorized.”**
5. Second title: **“Advanced Mobility Package Unlocked.”**
6. The Model Y enters a short **Flight Mode** transformation.
7. The final pose is hover-ready or launch-ready while remaining clearly recognizable as the red Model Y.

Flight Mode visual language:

- recognizable red Model Y base form
- clean mechanical panel articulation
- wing or stabilizer deployment
- integrated lift details
- refined lighting accents
- premium concept-vehicle feel

The sequence is a reward/cinematic beat, not required puzzle gameplay. Every important visual beat needs a text equivalent in the HTML overlay.

## Father’s Day final message

The Father’s Day message should happen after the Model Y reveal and Flight Mode transformation. Keep it editable in data/config rather than buried in scene logic.

Suggested placeholder:

> Happy Father’s Day, Pop T. This whole cockpit was built around the lessons you gave us: stay calm, scan carefully, trust your crew, and enjoy the ride. We love you, and your next chapter is cleared for departure.

## Mars Easter egg

The Mars Easter egg remains short, optional, and playful. It is not part of the required main ending and should be explored later after the Model Y Flight Mode reward is stable.

Suggested payoff:

- A space clue activates after the main ending.
- The Model Y may later become a fictional Mars surface vehicle, but that design is not finalized in this update.
- The player receives the title: **“Commander, Mars Transport Division.”**

This should never block the main ending.

## Visual priorities

### Airbus A320 First-Officer Mode

- Clean, modern glass-cockpit presentation.
- Readable object highlighting for drag-and-drop play.
- Clear A320 cockpit landmarks for family players.
- Friendly lighting and obvious interaction zones.

### DC-9-50 Pop T Captain Mode

- Convincing captain-seat scale.
- Dense analog instrument panel.
- Northwest-era blue-green/gray surfaces.
- Layered glass and restrained reflections.
- Yokes, pedestal, overhead presence, labels, and panel wear.
- Lighting that makes the cockpit feel real but still readable.

### Model Y Flight Mode reward

- The red Model Y remains the hero object.
- Panel seams and moving parts should feel engineered.
- Wing/stabilizer deployment should be readable in silhouette.
- Integrated lift details should be restrained and built into the vehicle body.
- Reduced-motion mode should offer a static staged pose and text recap instead of forcing a full cinematic.

## Technical direction

Default stack: Vite, React, TypeScript, Three.js through React Three Fiber, Drei where useful, Blender, GLB/glTF assets, Vitest, Playwright, GitHub, and Vercel preview deployments.

Keep asset groups separate and lazy-loaded:

- Airbus A320 First-Officer cockpit
- Locker room scene
- DC-9-50 Pop T Captain cockpit
- Model Y hangar reward and Flight Mode transformation
- Mars Easter egg

Essential gameplay must not exist only inside WebGL. Use HTML overlays for instructions, hints, progress, captions, final family message, status messages, and reward / Flight Mode text equivalents.

## Approval gates

1. Airbus A320 First-Officer cockpit interaction proof
2. Locker room reveal proof
3. DC-9-50 captain-view proof
4. First Pop T Captain puzzle
5. Model Y reward reveal and Flight Mode transformation
6. Mars Easter egg
7. Release candidate
