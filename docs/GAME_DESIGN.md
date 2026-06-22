# CockpitEscapeRoom — Game Design

## Current creative direction

**CockpitEscapeRoom** is a personalized, family-friendly 3D browser escape-room game built as a tribute to Dad, a skilled former airline pilot. The main game takes place in a convincing Northwest-era McDonnell Douglas DC-9 cockpit, currently targeting a **DC-9-51** unless a different variant is approved later.

The story must never imply that Dad made a mistake, forgot a checklist, caused an emergency, or needs to be rescued. He is portrayed as the capable captain whose lessons, habits, and stories help the family solve a commemorative qualification challenge.

The game should feel like a warm, polished Father’s Day experience: part cockpit mystery, part family tribute, part surprise reveal.

## Core fantasy

Dad, nicknamed **Pop T**, is invited back to complete a fictional Northwest legacy challenge: the **Legacy Qualification**. The aircraft is safely parked in a hangar for a commemorative departure sequence. The family is the “crew,” and the goal is to restore the aircraft systems, unlock the hangar path, and reveal a staged sequence of personal rewards.

The player loop remains:

**observe → inspect → interact → receive feedback → retry or take a hint → restore a system → reveal a personal reward → advance**

Wrong answers should never erase completed progress or force a full restart. The player should always be able to recover through feedback, hints, observation, and safe retries.

## Progression

1. **DC-9 Crew Mode** — approachable, guided family escape-room experience.
2. **Captain Mode** — harder, subtler, captain-level reasoning puzzles inspired by real airline habits.
3. **Red Tesla Model Y reward** — kept secret until the end of Captain Mode.
4. **Realistic Airbus Type Transition bonus level** — separate cockpit, not a DC-9 reskin.
5. **Hidden Mars mission Easter egg** — short, optional, playful space-themed payoff.

## Tone and story guardrails

- Dad is always the expert; the game honors what the family learned from him.
- The challenge is ceremonial, not an emergency.
- The stakes are discovery, qualification, family pride, and celebration.
- Avoid framing puzzles as failures, forgotten steps, or dangerous malfunctions.
- Keep aviation authenticity as atmosphere and interaction flavor, not as a required exam.
- Use family details sparingly and warmly. Do not invent missing biographical details; use placeholders where needed.
- Preserve the Model Y as a surprise until Captain Mode completion.

## DC-9 Crew Mode

Crew Mode is for the whole family. It should be visually impressive but mechanically approachable.

### Crew Mode goals

- Teach the interaction model.
- Establish the DC-9 cockpit as a believable place.
- Let non-pilots participate meaningfully.
- Reveal personal memories and clues through cockpit objects.
- Build confidence before Captain Mode.

### Crew Mode puzzle style

Crew Mode puzzles should use clear environmental clues, highlighted interactables, generous hinting, and safe retries.

Examples:

- Match a route strip to a destination code.
- Use panel labels to find the correct switch family.
- Restore cabin signs, radio lights, or instrument lighting.
- Decode a simple Northwest-themed note from route cards.
- Locate a “Pop T Crew Badge” or commemorative logbook entry.

### Crew Mode feedback

Feedback should feel encouraging and cockpit-themed:

- “Good crew coordination.”
- “Legacy circuit restored.”
- “Captain’s lesson applied.”
- “That one’s close — check the route strip again.”

Crew Mode completion should unlock **Captain Mode**, not the Model Y.

## Captain Mode

Captain Mode is the advanced layer. It should feel like a respectful nod to things only an experienced captain would notice, while still being solvable through observation and reasoning.

The puzzles should be harder because they require subtle pattern recognition, cockpit context, and calm sequencing — not obscure trivia dumps or simulator procedures.

### Captain Mode design principles

- Hide fewer obvious highlights; reward close inspection.
- Use authentic cockpit atmosphere and route operations as clues.
- Require multi-step reasoning but never punish experimentation harshly.
- Include hints that reveal progressively more context.
- Maintain family-friendly pacing.
- Never make Dad the source of the problem.

### Captain Mode puzzle candidates

#### 1. Route-bank reasoning puzzle

Use a Northwest Memphis hub board with route strips and airport codes such as:

- MEM
- LIT
- JAN
- BHM
- BTR
- SHV
- MOB
- STL
- BNA
- SDF
- IND

The player must infer a route-bank sequence from clues in the cockpit: departure board, radio scratchpad, logbook note, and map pins. This should feel like dispatch/route awareness rather than trivia.

#### 2. Captain’s scan puzzle

The player observes analog instrument positions, warning annunciators, and panel lighting to find the one item that is intentionally out of sequence for the commemorative qualification. The answer is discovered through careful scan discipline, not rote checklist memory.

#### 3. Weight-and-balance style puzzle

A simplified family-friendly load-planning puzzle uses baggage tags, seat-row cards, or cargo labels. The player balances the aircraft symbolically, using visual zones and simple constraints instead of real performance math.

#### 4. Call-sign and route-strip puzzle

A radio note, route strip, and destination board combine into a short unlock code. The puzzle should reward recognizing how operational paperwork, radios, and routes relate.

#### 5. Baseball memory clue

A personal clue references Pop T playing baseball in high school with future Pro Football Hall of Famer **Anthony Muñoz**. The puzzle can ask:

> “Which future Pro Football Hall of Famer went to Chaffey High School in Ontario, California and crossed paths with Pop T on the baseball field?”

Answer: **Anthony Muñoz**

This should be a warm family-story moment, not a hard blocker. If the player misses it, hints should guide them toward the family memory and the name.

#### 6. Captain’s final authorization

The final Captain Mode puzzle combines restored cockpit systems, a route-bank clue, Pop T’s legacy badge, and the baseball memory clue into a ceremonial “Legacy Qualification Authorized” moment.

Completing this mode triggers the staged ending and the Model Y reveal.

## Model Y surprise sequence

The red Tesla Model Y must remain a surprise until the end of Captain Mode. Do not preview it in Crew Mode UI, menus, level cards, loading tips, or early hint text.

### Staged reveal

After Captain Mode completion:

1. The cockpit lights settle into a warm completed-state glow.
2. A hangar intercom announces: **“Legacy Qualification complete.”**
3. The hangar door begins opening.
4. A polished Tesla Optimus 3-style robot appears as a playful escort.
5. The robot leads the player out of the cockpit path toward the hangar floor.
6. The red Tesla Model Y is revealed under clean hangar lighting.
7. The celebration title appears: **“Ground Transport Upgrade Authorized.”**

The moment should feel tasteful, cinematic, and personal rather than loud or gimmicky.

### Optimus 3 role

The Optimus 3 character acts as a short ceremonial guide. It should not dominate the ending or become a long cutscene. Its purpose is to create a delightful bridge from cockpit completion to Tesla reveal.

Possible robot lines:

- “Captain Pop T, your next transport is ready.”
- “Ground Transport Upgrade Authorized.”
- “Please proceed to Hangar Bay [PLACEHOLDER].”

## Father’s Day final message

After the Model Y reveal, the game should unfold one final layer: a Father’s Day message from the family.

This should be editable content, not hard-coded deep inside game logic. Store it in a data/config file so the family can revise the wording without touching the 3D scene.

Suggested placeholder:

> Happy Father’s Day, Pop T. This whole cockpit was built around the lessons you gave us: stay calm, scan carefully, trust your crew, and enjoy the ride. We love you, and your next chapter is cleared for departure.

Replace with the family’s final approved wording before release.

## Airbus Type Transition bonus

The Airbus bonus level should unlock after the Model Y reveal or through a post-credits prompt.

This must be a genuinely separate cockpit experience, not a reskinned DC-9. The exact Airbus model is not confirmed, so avoid final model-specific geometry until the aircraft type is approved.

### Airbus bonus principles

- Separate cockpit asset group.
- Separate interaction set.
- Separate visual language.
- Modern Airbus feel: sidestick, ECAM-style displays, different overhead/pedestal logic.
- Do not mix DC-9 cockpit geometry into Airbus layout.
- Keep the bonus shorter than the main DC-9 experience.

The theme is a playful **Type Transition**, celebrating Dad’s move from DC-9-era flying into Airbus-era systems.

## Mars Easter egg

The Mars Easter egg is hidden, optional, and short. It should be discoverable after the Model Y reward, likely through a subtle cockpit, Tesla, or hangar interaction.

Possible sequence:

1. Player finds a small space-themed clue.
2. The Model Y display or hangar panel shows a playful Mars route.
3. The Model Y transforms in presentation into a fictional surface vehicle.
4. The player receives the title: **“Commander, Mars Transport Division.”**

This should be a charming bonus, not a new full game mode.

## Visual realism priorities

The DC-9 cockpit should prioritize convincing realism from the captain’s seat:

- Accurate-feeling cockpit scale and proportions.
- Dense analog instrument panel.
- Yokes with believable pivots.
- Pedestal and overhead panel presence.
- Blue-green/gray Northwest-era cockpit surfaces.
- Layered glass and restrained reflections.
- Panel wear, labels, fasteners, knobs, placards, and small hardware.
- Daylight hangar lighting with dim instrument lighting.
- Camera framing that makes the cockpit feel real without requiring simulator-grade systems.

Use compatible real-aircraft references where possible. Do not silently combine complete layouts from DC-9-10, DC-9-30, DC-9-41, DC-9-51, MD-80, or unrelated aircraft. If references conflict, record uncertainty rather than guessing.

Commercial simulator references may inspire presentation, camera framing, interaction scope, and lighting mood, but should not override model-specific real-aircraft references.

## Accessibility and UI

Essential gameplay must not exist only inside WebGL. Use HTML overlays for:

- Instructions
- Hints
- Captions
- Settings
- Progress
- Interaction labels
- Accessible alternatives
- Status messages
- Final Father’s Day message

Support:

- Keyboard navigation
- Visible focus states
- Mute option
- Captions/text alternatives
- Reduced motion
- Readable contrast
- Touch-friendly targets
- Accessible alternatives for essential 3D interactions

## Technical implementation notes

Default stack:

- Vite
- React
- TypeScript
- Three.js through React Three Fiber
- Drei where useful
- Blender for 3D creation
- GLB/glTF runtime assets
- Vitest
- Playwright
- GitHub
- Vercel preview deployments

Keep asset groups separate and lazy-loaded:

- DC-9 cockpit
- Captain Mode overlays/interactions
- Model Y hangar reward
- Airbus bonus cockpit
- Mars Easter egg

Interactive Blender objects need:

- Stable object names
- Correct pivots
- Preserved hierarchy
- Predictable metadata
- Export notes in asset reports

## Two-computer workflow

Use separate task branches and do not let Windows and Ubuntu work on the same branch simultaneously.

### Windows ownership

- `src/`
- `tests/`
- `e2e/`
- `.github/`
- `package.json`
- `AGENTS.md`
- `TEST_REPORT.md`

Windows generally owns React, TypeScript, gameplay state, UI overlays, tests, GitHub workflow, and Vercel preview behavior.

### Ubuntu ownership

- `art-source/`
- `tools/blender/`
- `public/models/`
- `asset-reports/`
- `preview-renders/`

Ubuntu generally owns Blender scenes, reference organization, model cleanup, textures, GLB export, asset reports, and preview renders.

## Approval gates

Recommended gates:

1. DC-9 reference board and modeling brief
2. DC-9 captain-view proof
3. First interactive puzzle
4. Complete DC-9 level
5. Captain Mode and Model Y reward
6. Exact Airbus model selection
7. Airbus visual proof
8. Mars Easter egg
9. Release candidate

Do not finalize the Airbus model, major story structure, or major visual style changes without approval.

## Immediate next design tasks

1. Convert this design into repository `GAME_DESIGN.md`.
2. Add a `story-data` or `content` file for editable family-facing text.
3. Write Captain Mode puzzle briefs for route-bank reasoning, captain’s scan, weight-and-balance, and baseball memory clue.
4. Add Model Y surprise protection rules to `AGENTS.md` so agents do not accidentally reveal it early.
5. Create separate implementation prompts for Windows and Ubuntu workstreams.
