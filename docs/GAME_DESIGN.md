# CockpitEscapeRoom — Game Design

## Current creative direction

**CockpitEscapeRoom** is a personalized, family-friendly 3D browser escape-room game built as a tribute to Dad, a skilled former airline pilot. The game should feel like a polished Father’s Day surprise: part cockpit mystery, part family tribute, part reward reveal.

Dad must always be portrayed as a highly capable pilot. The story must never imply that he made a mistake, forgot a checklist, caused an emergency, or needs rescue. The game honors what the family learned from him.

The main progression now centers on a **modern First-Officer onboarding** that quietly leads into a more personal **Pop T Captain Mode** reveal.

## Core fantasy

The player begins in a modern Airbus cockpit, thinking they are simply completing a fun aviation-themed game. By succeeding, they earn access to a personal locker scene, where the game reveals that this is really about **Pop T** and his legacy. Only then does the player graduate into the older, denser, more meaningful DC-9 captain’s world.

The player loop remains:

**observe → inspect → interact → receive feedback → retry or take a hint → unlock the next layer → reveal a personal reward → advance**

Wrong answers must never erase completed progress or force a restart.

## Progression

1. **Airbus A320 First-Officer Mode** — approachable drag-and-drop cockpit familiarization.
2. **Locker Room / Captain’s Locker Scene** — a personal reveal space with memory objects and milestone clues.
3. **Pop T Captain Mode — DC-9** — a tougher analog checklist-style legacy challenge.
4. **Ground Transport Upgrade Authorized** — the protected red Tesla Model Y surprise.
5. **Father’s Day Final Message** — the emotional closing beat.
6. **Optional Mars Easter Egg** — short, hidden, playful.

## Story and tone guardrails

- Dad is always the expert.
- The game is ceremonial, playful, and respectful.
- The challenge is never an emergency.
- The player should feel like they are earning access, not fixing Dad’s mistake.
- Aviation authenticity should add atmosphere, not turn the game into an exam.
- The Model Y must remain a surprise until after Pop T Captain Mode completion.
- The DC-9 should feel more earned and personal than the Airbus.

## Airbus A320 First-Officer Mode

### Purpose

First-Officer Mode teaches the family the language of the cockpit in a fun, game-like way. It should feel like the current objective, not like a tutorial for a later DC-9 reveal.

Do not foreshadow Pop T Captain Mode, the DC-9, or the Model Y during this section.

### Tone

- Modern
- Friendly
- Clickable
- Confidence-building
- Game-like rather than technical

### Core interaction style

First-Officer Mode should use a **drag-and-drop matching puzzle**.

The player receives a tray of label cards such as:

- SIDESTICK
- THRUST
- GEAR
- RADIO
- ALTITUDE
- CLOCK

The player drags each card onto the matching cockpit object.

Correct match behavior:

- Object glows or highlights.
- Card locks into place.
- Short feedback appears.

Wrong match behavior:

- Card snaps back.
- A short hint appears.
- No punishment beyond retrying.

### Suggested object matches

#### 1. Sidestick

Feedback:

“Nice. That’s the sidestick.”

#### 2. Thrust levers

Feedback:

“Correct. Thrust controls power.”

#### 3. Landing gear lever

Feedback:

“Good catch. That handles the gear.”

#### 4. Radio panel

Feedback:

“Right. That’s the radio panel.”

#### 5. Altitude display area

Feedback:

“Correct. That’s where altitude is read.”

### Airbus clock challenge

After the main drag-and-drop labels are complete, the cockpit clock becomes active.

The clock is clicked as a special object challenge.

Prompt:

**“How many flight hours are needed for a standard ATP certificate?”**

Accepted answer:

**1500**

Feedback:

**“ATP milestone recognized: 1500.”**

Design note: this should feel like a cool aviation clue inside a computer game, not a legal lesson.

### End of First-Officer Mode

When the Airbus challenges are complete, display:

**“FIRST-OFFICER MODE COMPLETE”**

Then:

**“Locker access granted.”**

Do not mention the DC-9 yet.

## Locker Room / Captain’s Locker Scene

### Purpose

The locker room is the emotional hinge of the game. This is where the experience stops feeling like a general aviation game and starts feeling personal to Pop T.

The locker scene should be quieter, warmer, and more intimate than the Airbus cockpit.

### Visual direction

- Dim locker-room lighting.
- One locker softly illuminated.
- Warm spill light from inside the locker.
- Carefully arranged personal objects.
- The captain’s hat visible only as a dark silhouette in the shadows.
- The hat is not readable or clickable at first.
- The player must inspect the whole locker before the hat reveal happens.

### Required locker objects

- Nice watch
- Baseball
- Pop T nameplate
- Chaffey High clue
- Anthony Muñoz clue
- Northwest-era route strip
- Folded checklist card
- Shadowed captain’s hat

### Locker interaction philosophy

Not every object needs to be a trivia prompt. The locker should feel like a place, not a quiz menu.

Use a mix of:

- click-to-learn objects
- memory clues
- short question prompts
- one final promotion trigger

### Locker objects

#### 1. Nice watch

Prompt:

**“How many right-seat hours before captain upgrade?”**

Accepted answer:

**1000**

Feedback:

**“Experience recognized: 1000.”**

The watch symbolizes time served, discipline, and earned captaincy.

#### 2. Baseball

Prompt:

**“Before the captain wore wings, he wore a glove.”**

Follow-up question:

**“Which future Pro Football Hall of Famer from Chaffey High crossed paths with Pop T on the baseball field?”**

Accepted answer:

**Anthony Muñoz**

Feedback:

**“Memory recognized: Anthony Muñoz.”**

This should feel like a family memory reveal, not random sports trivia.

#### 3. Pop T nameplate

Feedback:

**“Pop T recognized.”**

This is an identity reveal, not a quiz.

#### 4. Route strip

Feedback:

**“Route awareness logged.”**

This seeds the captain feel without explicitly explaining what comes next.

#### 5. Folded checklist card

A simple ceremonial ordering challenge can appear here.

Suggested order:

1. Power
2. Lights
3. Route
4. Crew
5. Release

Feedback:

**“Checklist rhythm recognized.”**

## Captain’s hat shadow reveal

### Locked state

At the start of the locker scene, the captain’s hat is visible only as a blacked-out silhouette. The player notices it, but does not yet know what it is.

Suggested hover text while locked:

- “Something rests in the shadows.”
- “Complete the locker inspection first.”

Do not label it as a captain’s hat until the reveal.

### Reveal trigger

When all required locker objects are completed:

- The locker lights dim briefly.
- Completed objects glow softly.
- A warm overhead light fades in.
- The shadow lifts from the top shelf.
- The captain’s hat becomes visible.
- The scene pauses for a beat before interaction resumes.

### Reveal text

When the hat becomes visible:

**“Final locker item revealed.”**

When clicked:

**“Captain’s hat recognized.”**

Then:

**“Promotion available.”**

Then:

**“POP T CAPTAIN MODE UNLOCKED”**

This should feel like the emotional climax of the locker scene.

## Pop T Captain Mode — DC-9

### Purpose

The DC-9 is now the earned legacy cockpit. It should feel older, denser, more analog, and more personal than the Airbus.

This is not a generic hard mode. It is **Pop T Captain Mode**.

### Tone

- Reverent
- Classic
- More complex
- More personal
- Still family-friendly and solvable

### Opening beat

After the hat reveal:

1. The hat is clicked.
2. Screen fades down.
3. Sound of a locker closing.
4. DC-9 cockpit ambience fades in.
5. Analog lights appear one by one.
6. Camera settles into the captain-side view.
7. Title appears.

Title:

**“POP T CAPTAIN MODE”**

Subtitle:

**“Legacy checklist ready.”**

### Puzzle direction

Pop T Captain Mode should use harder, checklist-like puzzles while staying fictional and safe.

Suggested puzzle types:

- Captain’s scan puzzle
- Legacy checklist sequencing
- MEM route-strip reasoning
- Analog panel observation
- Personal memory recall
- Final hangar release authorization

### Guardrails

- Do not require real aircraft procedures.
- Do not imply Dad forgot anything.
- Do not frame anything as an emergency.
- Let the player recover easily from wrong answers.
- Make the challenge feel honorary and earned.

## Model Y surprise sequence

The red Tesla Model Y must remain hidden until after Pop T Captain Mode completion.

Do not preview it in:

- First-Officer Mode
- Locker room UI
- Menus
- Loading tips
- Early hint text
- Achievement lists shown before completion

### Staged reveal

After Pop T Captain Mode completion:

1. The DC-9 settles into a warm completed-state glow.
2. A hangar intercom announces: **“Legacy authorization confirmed.”**
3. The hangar door begins opening.
4. A polished Tesla Optimus 3-style robot appears as a short ceremonial escort.
5. The robot leads the player toward the hangar floor.
6. The red Tesla Model Y is revealed.
7. The title appears: **“Ground Transport Upgrade Authorized.”**

The moment should feel tasteful, cinematic, and personal.

## Father’s Day final message

The Father’s Day message should happen **after** the Model Y reveal, not before.

This content should remain editable in data/config rather than buried in scene logic.

Suggested placeholder:

> Happy Father’s Day, Pop T. This whole cockpit was built around the lessons you gave us: stay calm, scan carefully, trust your crew, and enjoy the ride. We love you, and your next chapter is cleared for departure.

## Mars Easter egg

The Mars Easter egg remains short, optional, and playful.

Suggested payoff:

- A hidden space clue activates after the main ending.
- The Model Y briefly becomes a fictional Mars surface vehicle.
- The player receives the title: **“Commander, Mars Transport Division.”**

This should never block the main ending.

## Visual priorities

### Airbus A320 First-Officer Mode

- Clean, modern glass-cockpit presentation.
- Readable object highlighting for drag-and-drop play.
- Clear cockpit landmarks for family players.
- Friendly lighting and obvious interaction zones.

### DC-9 Pop T Captain Mode

- Convincing captain-seat scale.
- Dense analog instrument panel.
- Northwest-era blue-green/gray surfaces.
- Layered glass and restrained reflections.
- Yokes, pedestal, overhead presence, labels, and panel wear.
- Lighting that makes the cockpit feel real but still readable.

Do not silently merge conflicting aircraft variants into one final production layout.

## Accessibility and UI

Essential gameplay must not exist only inside WebGL. Use HTML overlays for:

- instructions
- hints
- progress
- captions
- final family message
- status messages

Keep the game approachable, visible, and easy to understand.

## Technical direction

Default stack:

- Vite
- React
- TypeScript
- Three.js through React Three Fiber
- Drei where useful
- Blender
- GLB/glTF assets
- Vitest
- Playwright
- GitHub
- Vercel preview deployments

Keep asset groups separate and lazy-loaded:

- Airbus A320 First-Officer cockpit
- Locker room scene
- DC-9 Pop T Captain cockpit
- Model Y hangar reward
- Mars Easter egg

Interactive Blender objects need stable names, correct pivots, preserved hierarchy, and predictable metadata.

## Two-computer workflow

Use separate branches and do not let Windows and Ubuntu work on the same branch at the same time.

### Windows ownership

- `src/`
- `tests/`
- `e2e/`
- `.github/`
- `package.json`
- `AGENTS.md`
- `TEST_REPORT.md`

### Ubuntu ownership

- `art-source/`
- `tools/blender/`
- `public/models/`
- `asset-reports/`
- `preview-renders/`

## Approval gates

1. Airbus First-Officer cockpit interaction proof
2. Locker room reveal proof
3. DC-9 captain-view proof
4. First Pop T Captain puzzle
5. Model Y reward reveal
6. Mars Easter egg
7. Release candidate

## Immediate next design tasks

1. Add separate implementation briefs for Airbus, locker room, and DC-9 modes.
2. Add explicit Model Y spoiler-protection rules to `AGENTS.md`.
3. Write the exact locker object scripts and hint lines.
4. Create a content file for editable family-facing text.
5. Define the first Pop T Captain Mode puzzle in detail.
