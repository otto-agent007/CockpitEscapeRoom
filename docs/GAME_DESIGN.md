# CockpitEscapeRoom — Game Design

## Current creative direction

**CockpitEscapeRoom** is a personalized, family-friendly 3D browser escape-room game built as a tribute to Dad, a skilled former airline pilot. The game should feel like a polished Father’s Day surprise: part cockpit mystery, part family tribute, part reward reveal.

Dad must always be portrayed as a highly capable pilot. The story honors what the family learned from him.

## Confirmed production targets

- **Opening legacy aircraft:** McDonnell Douglas DC-9-32.
- **Later Pop T Captain experience:** Airbus A320 from the captain/left seat.
- **Reward vehicle:** red Tesla Model Y.

These are now the chosen production targets. The owner-cleared Roger2009 DC-9-32 is the exact Final Flight Log geometry and texture authority. Existing DC-9-51 source artifacts may remain useful only as labeled Northwest-era color, wear, atmosphere, or historical reference material.

## Player loop

**observe → inspect → interact → receive feedback → retry or take a hint → unlock the next layer → reveal a personal reward → advance**

Wrong answers must never erase completed progress or force a restart.

## Progression

1. **DC-9 Final Flight Log** — a warm opening memory chapter in the safely parked DC-9-32.
2. **Locker Room / Captain’s Locker Scene** — personal reveal space with memory objects and milestone clues.
3. **Airbus A320 Pop T Captain Mode** — approachable drag-and-drop cockpit familiarization from the left seat.
4. **Ground Transport Upgrade Authorized** — protected red Tesla Model Y surprise.
5. **Advanced Mobility Package Unlocked** — Model Y Flight Mode transformation.
6. **Father’s Day Final Message** — emotional closing beat.
7. **Optional Mars Easter Egg** — short, playful, and separate from the main ending.

## DC-9 Final Flight Log

The existing opening screen remains unchanged except that its button is titled **Start Game**. That button opens Pop T’s safely parked DC-9-32 from the first-officer/right seat. This is a warm, lightly realistic family-memory chapter, not a simulator emergency and not a claim about a literal final itinerary. Keep the production GLB, interaction registry, first-officer yoke trigger, first-officer game/route/overhead cameras, and the three supported shutdown pivots.

The narrow strip attached to the first-officer yoke opens the readable Legacy Route Record. The representative familiar routes are `DTW`, `MSP`, and `STL`. Wrong submissions progressively offer a Northwest-hubs/Midwestern-stop annotation, then Michigan/Minnesota/Missouri, then a warm outline on the three codes. Correct stamps are permanent and later mistakes never remove them.

The completed route record opens the five-page **Home Operations Log — Momma Cheryl**. This is recognition, never a puzzle: it has no answers, sorting, timer, failure state, or test. Its pages recognize the care and steady logistics required to feed and prepare three children, support sports and cheerleading schedules, shop for school clothes, and manage changing household needs while Pop T traveled. The key sentiment is: **“Pop T kept his passengers and crews on course. Momma Cheryl kept the family on course. Both were essential to bringing the crew home.”** The family-photo montage remains deferred to the end-game movie-style credits and is not part of this chapter.

After both records are complete, the existing overhead view supports a forgiving ceremonial shutdown: APU buses off, APU master off, then battery off. Out-of-order actions receive calm guidance and never clear a completed step. Completion reveals a lightweight HTML Captain’s Key cinematic with the engravings **“THE CAPTAIN’S KEY”** and **“POP T & MOMMA CHERYL.”** Taking it opens the locker.

## Locker Room / Captain’s Locker Scene

The locker room is the emotional hinge of the game. It remains unchanged. The Captain’s Key opens it after the DC-9 chapter. The player inspects personal objects, memory clues, and the existing final captain’s hat reveal before the existing **Enter Pop T Captain Mode** action continues to Airbus.

The locker should feel like a place, not a quiz menu. Use a mix of click-to-learn moments, short prompts, and one final promotion trigger.

Personal objects include a baseball memory connected to Anthony Muñoz, a pilot-watch clue connected to jet lag, airline wings and second-in-command experience, investing wisdom, and the final shadowed captain’s hat reveal. The locker puzzles, model, props, and directed camera sequence remain unchanged by the reordered journey.

The playable sequence is watch → baseball → Charging Bull → airline wings → captain's hat. The Wings memory asks: **“In U.S. airline operations, what is the minimum amount of second-in-command experience commonly associated with qualifying to serve as captain?”** Accept friendly forms of `1000 hours`; wrong answers preserve prior memories and advance to a stronger hint.

Completing the Wings question fades the locker to black and presents the real captain's hat in its existing confetti-backed promotion card. The unchanged **“Enter Pop T Captain Mode”** action claims the hat and advances to the existing Airbus gameplay, which now occupies the Captain-mode slot; reduced-motion mode presents the same card immediately without animated confetti.

## Airbus A320 Pop T Captain Mode in the Captain-mode slot

The Airbus chapter teaches the family the language of the cockpit in a fun, game-like way. It uses the exported captain/left-seat camera and captain-side sidestick target while preserving the five-card puzzle, safe retry behavior, ATP qualification, celebration, and accessible HTML equivalents.

The production interaction uses five tactile training cards—sidestick, thrust levers, gear lever, radio panel, and altitude area—with immediate explanations, green confirmation, and clue-based retries.

After all five labels are correct, ask: **“What is the minimum total flight time (hours) required to qualify for a standard Airline Transport Pilot certificate?”** Accept `1500`, `1,500`, `1500 hour`, and `1500 hours`. The earned response is **“Captain knowledge logged.”** The qualification celebration reads **“POP T CAPTAIN MODE COMPLETE”**; its **Continue** action routes to the protected Model Y reward.

Do not reveal the Model Y, Flight Mode, or Mars reward before this chapter is complete.

## Model Y reward and Flight Mode sequence

The red Tesla Model Y must remain hidden until the reordered DC-9 → locker → Airbus journey is complete.

Reward sequence:

1. Airbus crew qualification completes.
2. The hangar confirms the full family journey.
3. The red Tesla Model Y is revealed.
4. Title: **“Ground Transport Upgrade Authorized.”**
5. Second title: **“Advanced Mobility Package Unlocked.”**
6. The Model Y enters a short **Flight Mode** transformation.
7. The final pose is hover-ready or launch-ready while remaining clearly recognizable as the red Model Y.

An Optimus 3 ceremonial escort is a future reward-scene concept only. If pursued, it appears after legacy authorization and must never transform the vehicle, reveal the Model Y early, or displace the Model Y as the hero reward.

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

> Happy Father’s Day, Pop T. From the baseball field to the captain’s seat, from the DC-9 to the Airbus, you showed us how preparation, calm judgment, teamwork, and leadership can carry a family anywhere. This game was built from the lessons you gave us. Your crew loves you.

## Mars Easter egg

The Mars Easter egg remains short, optional, and playful. It is not part of the required main ending and should be explored later after the Model Y Flight Mode reward is stable.

Suggested payoff:

- A space clue activates after the main ending.
- The Model Y may later become a fictional Mars surface vehicle, but that design is not finalized in this update.
- The player receives the title: **“Commander, Mars Transport Division.”**

This should never block the main ending.

## Visual priorities

### Airbus A320 Pop T Captain Mode

- Clean, modern glass-cockpit presentation.
- Readable object highlighting for drag-and-drop play.
- Clear A320 cockpit landmarks for family players.
- Friendly lighting and obvious interaction zones.

### DC-9-32 Final Flight Log

- Convincing first-officer/right-seat scale.
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

- Airbus A320 Pop T Captain cockpit
- Locker room scene
- DC-9-32 First-Officer cockpit
- Model Y hangar reward and Flight Mode transformation
- Mars Easter egg

Essential gameplay must not exist only inside WebGL. Use HTML overlays for instructions, hints, progress, captions, final family message, status messages, and reward / Flight Mode text equivalents.

Narrow screens receive a functional stacking/overflow fallback. Dedicated mobile layout design, mobile visual polish, and a mobile approval milestone are outside the Final Flight Log scope.

## Approval gates

1. DC-9-32 Final Flight Log opening proof
2. Locker room reveal proof
3. Airbus A320 Pop T Captain left-seat interaction proof — the previous right-seat presentation was superseded on 2026-07-15 and owner approval is reopened
4. Complete reordered journey proof
5. Model Y reward reveal and Flight Mode transformation
6. Mars Easter egg
7. Release candidate
