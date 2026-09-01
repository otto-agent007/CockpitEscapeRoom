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

1. **DC-9 Final Flight Log** — a warm right-seat chapter that moves from parked cockpit recognition into an explicitly fictional 1995 Memphis departure memory, then closes the legacy log safely.
2. **Locker Room / Captain’s Locker Scene** — personal reveal space with memory objects and milestone clues.
3. **Airbus A320 Pop T Captain Mode** — a mandatory five-card cockpit qualification followed by the Storm Line arcade flight simulator from the left seat.
4. **Ground Transport Upgrade Authorized** — protected red Tesla Model Y surprise.
5. **Advanced Mobility Package Unlocked** — Model Y Flight Mode transformation.
6. **Father’s Day Final Message** — emotional closing beat.
7. **Optional Mars Easter Egg** — short, playful, and separate from the main ending.

## DC-9 Final Flight Log

On a fresh or restarted game, the console-era cinematic starts automatically as soon as its initial art tier is decoded. There is no pre-intro DC-9 station page and no outer **Start Game** gate. If audible autoplay is rejected, the visual timeline continues silently and exposes the existing sound retry. The cinematic's own **PRESS START** opens Pop T's DC-9-32 from the first-officer/right seat; persisted later saves resume their current chapter directly. The present-day tribute remains safely parked. The later taxi and takeoff are clearly labeled as a fictional, non-operational **1995 MEMORY**, not a literal final itinerary or a simulator lesson.

The chapter opens with hands on the controls. **Flight controls — free and correct** is the ordinary pre-taxi sweep every leg started with: the player walks the control column full aft and full forward, rolls the wheel to both stops, walks both rudder pedals, then advances both thrust levers and closes them again. The real donor yoke, levers, and pedals move on their own pivots, and the captain's linked column and pedals track with them. Arrow keys drive the yoke, `W`/`S` the levers, `A`/`D` the pedals; every movement also has a native hold button, and the yoke can be dragged directly in the cockpit. There is no timer or failure state. Each of the eight movements latches at its stop and is never taken away. Completing the sweep opens the instrument scan.

The **instrument scan** calls six right-seat instruments in the order a DC-9 crew read them: airspeed indicator, attitude director indicator, altimeter, horizontal situation indicator, vertical speed indicator, and the EPR gauges that set JT8D thrust. The player answers by clicking the gauge in the cockpit or choosing it from a keyboard-reachable list; both paths are equivalent. A correct answer is permanent and runs that instrument's own needle through a power-on self-test sweep on the donor geometry. Wrong answers cost nothing and produce steadily clearer coaching until the third miss outlines the right gauge. The scan is a test of the parked panel, not a claim about aircraft motion.

Completing the scan opens **Memphis Legacy Departure** without changing the production cockpit or right-seat camera. The separate outside environment evokes older Concourse B through an intentionally compressed route. The player releases from the ramp, follows one taxi turn, settles at a quiet hold, confirms the lineup, advances into the legacy roll, pulls on the qualitative rotation cue, and holds a short initial climb. There are no real speeds, runway numbers, radio frequencies, engine settings, checklists, or procedures. The sequence begins after a fictional ground-tow handoff and contains no engine-start or pushback task.

The departure reuses the yoke, rudder, and paired thrust controls across keyboard, gamepad, direct cockpit input, and native hold buttons. Closing the levers produces a calm stop; **Ready to line up** appears only at the safe hold. Five durable checkpoints protect earned beats. A path deviation, early pull, or unstable climb restores only the active checkpoint and strengthens coaching, while **Retry from checkpoint** remains available at every active beat. Reload and visibility loss resume the latest checkpoint at rest. If the outside GLB fails, the native qualitative guidance remains authoritative and offers a retry.

The completed departure opens the five-page **Home Operations Log**. This is recognition, never a puzzle: it has no answers, sorting, timer, failure state, or test. Its pages recognize the care and steady logistics required to feed and prepare three children, support sports and cheerleading schedules, shop for school clothes, and manage changing household needs while Pop T traveled. The key sentiment is: **“Pop T kept his passengers and crews on course. Momma Cheryl kept the family on course. Both were essential to bringing the crew home.”** The family-photo montage remains deferred to the end-game movie-style credits and is not part of this chapter.

Completing Home Operations reveals the narrow strip clipped to the first-officer column and opens the readable **Legacy Route Record**. The representative familiar routes are `DTW`, `MSP`, and `STL`. Wrong submissions progressively offer a Northwest-hubs/Midwestern-stop annotation, then Michigan/Minnesota/Missouri, then a warm outline on the three codes. Correct stamps are permanent and later mistakes never remove them.

After the route record, the existing overhead view supports a forgiving ceremonial shutdown: APU buses off, APU master off, then battery off. Out-of-order actions receive calm guidance and never clear a completed step. The closing ATP milestone recognizes the standard total-time answer, then reveals a lightweight HTML Captain's Key cinematic with the engravings **“THE CAPTAIN'S KEY”** and **“POP T & MOMMA CHERYL.”** Taking it opens the locker.

## Locker Room / Captain’s Locker Scene

The locker room is the emotional hinge of the game. It remains unchanged. The Captain’s Key opens it after the DC-9 chapter. The player inspects personal objects, memory clues, and the existing final captain’s hat reveal before the existing **Enter Pop T Captain Mode** action continues to Airbus.

The locker should feel like a place, not a quiz menu. Use a mix of click-to-learn moments, short prompts, and one final promotion trigger.

Personal objects include a baseball memory connected to Anthony Muñoz, a pilot-watch clue connected to jet lag, airline wings and second-in-command experience, investing wisdom, and the final shadowed captain’s hat reveal. The locker puzzles, model, props, and directed camera sequence remain unchanged by the reordered journey.

The playable sequence is watch → baseball → Charging Bull → airline wings → captain's hat. The Wings memory asks: **“In U.S. airline operations, what is the minimum amount of second-in-command experience commonly associated with qualifying to serve as captain?”** Accept friendly forms of `1000 hours`; wrong answers preserve prior memories and advance to a stronger hint.

Completing the Wings question fades the locker to black and presents the real captain's hat in its existing confetti-backed promotion card. The unchanged **“Enter Pop T Captain Mode”** action claims the hat and advances to the existing Airbus gameplay, which now occupies the Captain-mode slot; reduced-motion mode presents the same card immediately without animated confetti.

## Airbus A320 Pop T Captain Mode in the Captain-mode slot

The Airbus chapter turns the captain/left-seat cockpit into a short arcade flight challenge. The player must first complete the five-card object matcher; no skip path advances into flight. Completing the qualification reveals **Begin Storm Line**, which transitions from the interaction camera to the tighter Storm Flight camera. Storm Line then asks the player to control pitch, bank, and paired thrust continuously, steer through the visible stable western weather gap, manage energy through turbulence, and stabilize in clear air. The scenario is explicitly fictional and non-operational; the commemorative aircraft remains safely parked.

The production familiarization uses five tactile training cards—sidestick, thrust levers, gear lever, radio panel, and altitude area—with immediate explanations, green confirmation, and clue-based retries. An instruction box at the top of the screen announces the interaction up front: drag each label card onto its matching cockpit control, or tap a card and then tap its glowing target. Completing it opens Storm Line and never completes Airbus by itself.

Storm Line lasts about three minutes and uses three durable checkpoints: Weather Entry, Storm Core, and Clear-Air Recovery. The briefing and a live Route guidance line map "west" to "off your left wing", and a drift meter shows the aircraft against the green west-lane band the flight model actually enforces (the Weather Entry gate is `STORM_ENTRY_GATE_LATERAL`, eased to −0.25 at owner request on 2026-08-23, and the meter band is derived from the same exported constants). The guidance line counts down when Weather Entry is about to close and warns before the player overshoots the far lane edge. Leaving the attitude, energy, or corridor envelope for five seconds pauses the scenario and offers focused coaching before rewinding only the active checkpoint. Keyboard, standard gamepad, and native HTML hold controls share the same Captain-mode physics. PFD, ND, and upper ECAM textures appear on Blender-authored display surfaces, while native HTML mirrors expose the same state. Completion awards the Captain traits Calm Control, Weather Judgment, and Energy Management when earned. The existing **“POP T CAPTAIN MODE COMPLETE”** celebration and its **Continue** action still route to the protected Model Y reward.

The captain workload makes those existing displays part of play. At Weather Entry the player sets the fictional ND scan to `MID`; at Storm Core they confirm the western training gap. Engine-Out Recognition asks for acknowledgement of the instructor-triggered simulated event on the upper ECAM, and Diversion asks for the right-side SAFE RETURN corridor on the ND. Each display click has the same keyboard-reachable native button. Incorrect sectors never fail the flight or erase progress; they produce progressively clearer coaching. If the aircraft reaches a scenario boundary first, the simulation holds the stable frame until the current decision is complete. Task completion and the last ND selection persist through safe retry and reload, while explicit scenario replay resets only that scenario's tasks.

Engine-Out Handling unlocks after Storm Line and remains explicitly instructor-triggered, fictional, and non-operational. It rewards directional control, energy discipline, and calm diversion judgment without implying that Dad caused an accident, emergency, or systems failure. Its briefing states the mechanic plainly — the training reduction pulls the nose LEFT, so hold Balance right, then a gentle RIGHT bank tracks SAFE RETURN — and the same Route guidance line coaches live: a directional-drift meter through recognition and stabilization (green band = the enforced ±0.45 envelope) and a bank meter during the diversion (green band = the 8–24° arc that accrues SAFE RETURN), with drift warnings taking priority mid-turn.

Both simulator scenarios play a synthesized ambience by default, generated at runtime with no audio asset. Underneath is the engine bed — a low rumble, a sawtooth hum whose harmonics rise with intensity, and a filtered noise bed — and over it an airflow band that keeps the cockpit audible on speakers that reproduce nothing below about 150 Hz. Storm Line adds weather drawn from the same field the scene draws: rain hiss that tracks precipitation, so the drizzle at Weather entry becomes a wall of water in the core, and thunder that answers the lightning you can see. Each bolt gets one clap, delayed by its own distance — the count between the flash and the bang — with a crack on the near ones and rumble only on the far. Reduced motion suppresses the flash, so it suppresses the clap with it and leaves the rain. The topbar Sound button mutes every layer at once; if WebAudio is unavailable the button stays "Sound off" and flight is unaffected.

Do not reveal the Model Y, Flight Mode, or Mars reward before this chapter is complete.

## Model Y reward and Flight Mode sequence

The red Tesla Model Y must remain hidden until the reordered DC-9 → locker → Airbus journey is complete.

Reward sequence:

1. Airbus qualification and captain scenarios complete.
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
- Readable live PFD, weather-display, and ECAM feedback.
- Visible sidestick and paired-thrust response.
- Cinematic procedural storm weather without operational emergency framing.
- Readable object highlighting during the required five-card qualification.
- Clear A320 cockpit landmarks for family players.
- Friendly lighting and obvious interaction zones.

### DC-9-32 Final Flight Log

- Convincing first-officer/right-seat scale.
- Dense analog instrument panel.
- Northwest-era blue-green/gray surfaces.
- Layered glass and restrained reflections.
- Yokes, pedestal, overhead presence, labels, and panel wear.
- Control column, wheel, thrust levers and rudder pedals that move on their donor pivots.
- Readable first-officer basic-T with instrument needles that can be driven.
- Lighting that makes the cockpit feel real but still readable.
- An older Concourse B memory view that is recognizable from the fixed right seat at ramp release and remains readable through taxi, hold, rollout, and climb.
- A compressed route that never implies exact KMEM geography or operational instruction.

### Model Y Flight Mode reward

- The red Model Y remains the hero object.
- Panel seams and moving parts should feel engineered.
- Wing/stabilizer deployment should be readable in silhouette.
- Integrated lift details should be restrained and built into the vehicle body.
- Reduced-motion mode should offer a static staged pose and text recap instead of forcing a full cinematic.

## Technical direction

Default stack: Vite, React, TypeScript, Three.js through React Three Fiber, Blender, GLB/glTF assets, Vitest, Playwright, GitHub, and Vercel preview deployments.

Keep asset groups separate and lazy-loaded:

- Airbus A320 Pop T Captain cockpit
- Locker room scene
- DC-9-32 First-Officer cockpit
- Memphis legacy departure environment
- Model Y hangar reward and Flight Mode transformation
- Mars Easter egg

Essential gameplay must not exist only inside WebGL. Use HTML overlays for instructions, hints, progress, captions, final family message, status messages, and reward / Flight Mode text equivalents.

Narrow screens receive a functional stacking/overflow fallback. Dedicated mobile layout design, mobile visual polish, and a mobile approval milestone are outside the Final Flight Log scope.

## Approval gates

1. DC-9-32 Final Flight Log and Memphis memory departure proof
2. Locker room reveal proof
3. Airbus A320 Pop T Captain left-seat interaction proof — the previous right-seat presentation was superseded on 2026-07-15 and owner approval is reopened
4. Complete reordered journey proof
5. Model Y reward reveal and Flight Mode transformation
6. Final complete-game review, including the Mars Easter egg if it is present in the release
