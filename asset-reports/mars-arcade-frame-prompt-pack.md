# Mars arcade cabinet — frame generation pack

> **Current owner-approved wardrobe/jab:** Booster uses the sleek black leather jacket,
> dark T-shirt, charcoal jeans, black boots and gloves; no orange headphones or cargo pockets.
> Appearance authority: `booster/generated/wardrobe-sleek/anchor-00.png` under `art-source/arcade`.
> Owner accepted41px jab extension ("41 is ok"); game reach is41, damage5/chip1 and4/3/7 timing
> unchanged. Current runtime set is `booster/normalised-sleek-ready`; prior art briefs below
> are historical. Preserve the locked scale and unchanged silhouette/geometry gates.

> **Latest checkpoint, 2026-09-20:** owner approved continuing from the cleaned anchors.
> The Wave 0 boundary below is historical. Four Wave 1 probes were generated; idle is
> accepted into a dev-only pilot, while walk registration and active-jab transparency
> remain unresolved. The jab exhausted two corrective generations; full-wave batching
> remains on hold. See `mars-arcade-wave-1-pilot-2026-09-20.md`. New transparent sources
> require opt-in `--source-alpha` plus the existing bilinear filter and locked scale.

> **2026-09-20 owner decision, now folded into the rules below:** Booster resembles Elon
> Musk and Oracle resembles Sam Altman; Captain is unchanged. Current likeness prompts are
> `art-source/arcade/prompts/anchor-{booster,oracle}-likeness.txt`. All sprite
> geometry and quality gates remain open and unchanged.

> **Later cleanup:** the owner accepted the likeness direction (“yes they are closer”).
> All three `normalised-clean/anchor/anchor-00.png` candidates now pass the unchanged
> pixel checker. For this set, add `--resample bilinear` to normalization commands and
> use the locked scales in `art-source/arcade/README.md`. Keep the original default for
> the intro set. Final art review and the Wave 0 scope boundary still apply.

**Contract v1, full colour.** The machine-readable contract is
`asset-reports/mars-arcade-sprite-contract.json`. The rules these frames illustrate are
committed in `src/game/marsArcadeFighters.ts`; the plan is
`plans/0044-mars-arcade-fight-loop.md`.

**Identity, settled 2026-09-20.** THE BOOSTER is a cartoon likeness of Elon Musk and
THE ORACLE is a cartoon likeness of Sam Altman; THE CAPTAIN is Pop T. This supersedes the
invented-archetypes-only rule of 2026-09-19. Likeness is a **requirement**, not a hazard: a
frame that does not read as the intended person is a reject, and the names may be used in
prompt text. Keep it affectionate caricature in the same register as the rest of the
tribute — recognisable and good-humoured, never demeaning, and never implying endorsement
of this private, non-commercial family project. Fighter ids, move ids and module names stay
archetype-named, because the rules never depended on who a fighter looks like.

---

## Read this first — four ways this differs from the Pop T pack

The Pop T v3 pack (`asset-reports/popt-frame-prompt-pack.md`) is the parent process and most
of it carries over unchanged. These four things do not.

1. **Strict side profile, facing right.** The intro anchor is three-quarter view. Every
   arcade pose is a profile redraw, never a reuse. The runtime mirrors for the left-hand
   fighter, so a left-facing frame is never authored.
2. **Drawings never encode travel.** The fight loop owns x and y. A walk cycle is authored
   *in place* — the feet cycle, the hips stay on the pivot column — and airborne poses are
   authored sitting on the baseline while the engine lifts them. This is the opposite of the
   intro walk cycles, where stride distance had to come from the drawings. Bake a step offset
   in here and the fighter skates.
3. **Reach is rules, not art direction.** Every move already has a `reach` in cell pixels.
   The striking surface on the active drawing must land on that number within 3 px, or the
   fighter will hit opponents it visibly is not touching. The numbers are tabulated below.
4. **The frame budget is derived, not chosen.** `src/game/marsArcadeSpriteBudget.ts` turns a
   move's committed frame data into a drawing count, and
   `src/game/marsArcadeSpriteContract.test.ts` fails if the contract and the frame data drift
   apart. If a move is re-tuned, re-read the budget before drawing.

> Note on the parent pack: its closing **"When a frame comes back"** section still describes
> the retired 14-colour pixel-art route (8×8 blocks, palette conformance, orphan pixels). That
> section was not updated when the pack was rewritten for v3 on 2026-08-17. Use the rejection
> list at the bottom of *this* file instead, and do not apply the palette rules to anything.

---

## How generation runs

Codex CLI's **built-in `image_gen`** tool, which bills against the ChatGPT plan and needs no
API key. Never set `OPENAI_API_KEY` for these runs and never let it fall back to
`scripts/image_gen.py` — both switch to API billing.

```
codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
  -i <identity-reference.png> \
  - < <prompt-file>
```

Attach **only** the identity reference for that fighter:

| Fighter | Reference |
| --- | --- |
| THE CAPTAIN | `art-source/intro/tmb2/popt-v2/references/identity-anchor-1024.png` |
| THE BOOSTER | none exists — Wave 0 creates it, then attach that |
| THE ORACLE | none exists — Wave 0 creates it, then attach that |

Ask for the largest size the generator produces **natively**, and tell it not to resize.
An upscale adds blur and no detail.

## After generation

```
python3 tools/assets/normalise-popt-frame.py <generated.png> <normalised.png> \
    --contract asset-reports/mars-arcade-sprite-contract.json \
    --source-px-per-cell-px <that fighter's locked scale>

python3 tools/assets/check-popt-frames-fullcolour.py \
    --contract asset-reports/mars-arcade-sprite-contract.json \
    art-source/arcade/<fighter>/normalised
```

Both tools take `--contract`, so no new tooling is needed — verified 2026-09-19 against this
contract, accepting a correct 104 px frame and rejecting a short one, a floating one, and one
with leftover chroma.

Derive the scale **once per fighter** from that fighter's Wave 0 anchor with `--derive-scale`
and reuse the printed value for every frame of that fighter. Re-fitting per frame makes the
character change size between clips. Airborne and knocked-down poses have no foot span on the
baseline — normalise those with `--align bbox` and record the offset once per clip.

---

## The invariant block

Paste this verbatim at the top of every request, then add the identity block, the pose brief
and the framing block.

> A flat cel-shaded 2D character illustration of a single invented cartoon character, full
> body, drawn in clean vector style with hard-edged colour regions, in the style of a 1990s
> arcade fighting game character.
>
> This is an invented character. It must NOT resemble, caricature or portray any real,
> living, historical or public person. If the face begins to look like someone recognisable,
> change it.
>
> View — IMPORTANT: strict SIDE PROFILE, facing RIGHT. The shoulders and hips are square to
> the side. Both feet are visible and level. This is not a three-quarter view and not a
> front view.
>
> Colour and shading rules, followed strictly:
> - Use at most three flat shades per material: a base, one darker shade, one lighter shade.
> - Every colour region is a solid area of ONE flat colour with a hard edge. No gradients, no
>   blending, no soft edges, no glow.
> - NO specular highlights, NO shine, NO reflective streaks, NO gloss anywhere.
> - NO fabric texture, NO fine wrinkles, NO creases, NO folds, NO stitching, NO patterns.
> - NO noise, NO speckling, NO dithering, NO grain, NO stippling.
>
> Motion rules — IMPORTANT: draw the character at rest in the described pose. NO motion blur,
> NO speed lines, NO trailing streaks, NO impact stars, NO dust clouds, NO ground shadow, NO
> energy effects of any kind. Effects are drawn separately.
>
> Proportions — IMPORTANT: this is a stylised cartoon fighter, not a realistic figure. The
> head is large relative to the body: the whole figure is about FIVE head-heights tall. Short
> legs, compact torso, big head, chunky hands and feet.
>
> Facial features — IMPORTANT: this artwork will be reduced to a sprite only 104 pixels tall,
> so every facial feature must be BOLD, HIGH-CONTRAST and SIMPLIFIED or it will disappear.
> Eyes, eyebrows and mouth are each solid dark shapes, generously sized, well separated, in
> the lower half of the face. No subtle tonal shading on the face, no cheek blush, no soft
> contour.

## The framing block

Paste this after the pose brief.

> Framing: the whole figure is fully visible and vertically centred, occupying about 90
> percent of the image height, with a small even margin above the head and below the feet.
>
> Background: a completely flat solid pure magenta field, RGB 255 0 255, filling the entire
> canvas edge to edge. The magenta must appear NOWHERE on the character. No ground, no
> shadow, no horizon, no props, no text, no logo, no border, no watermark, no checkerboard.

---

## Identity blocks

One of these goes after the invariant block, every single time.

### THE BOOSTER — `booster`

> The character: a stocky, barrel-chested cartoon man in his forties. Short dark hair,
> cropped at the sides, slightly messy on top. Broad jaw, heavy dark eyebrows, and a
> permanent lopsided half-grin — the face of someone who thinks the odds are fine.
>
> Wardrobe: a scuffed black bomber-style flight jacket worn open over a plain charcoal
> t-shirt, sleeves pushed up past the elbows. Faded olive work trousers with deep side
> pockets. Heavy tan lace-up work boots. Bulky ear defenders slung around his neck. Thick
> scorched work gloves. A small plain enamel pin on the jacket chest shaped like a simple
> finned rocket — no lettering.
>
> Colour direction: charcoal and black jacket, olive trousers, tan boots, warm mid skin. One
> hot orange accent, on the pin and the jacket lining, is his signature colour.

### THE ORACLE — `oracle`

> The character: a slim, slightly stooped cartoon man in his thirties, a head taller than the
> booster but much narrower. Neat mid-brown side-parted hair. Round thin wire-frame glasses —
> draw the lenses as flat pale shapes with NO highlight and NO reflection. A calm,
> closed-mouth, unreadable expression that barely changes even mid-fight.
>
> Wardrobe: a plain soft grey crewneck sweater with sleeves slightly too long. Dark slim
> trousers. Plain white low-top trainers. A lanyard around his neck holding a blank white
> card badge — no text, no logo, no photograph.
>
> Colour direction: soft greys and off-white. One cool cyan accent, on the lanyard, is his
> signature colour.

### THE CAPTAIN — `captain`

> The character matches the attached reference exactly, redrawn in strict side profile: a
> young male cartoon airline pilot, blonde hair, navy peaked cap with a gold band above the
> brim, white short-sleeve uniform shirt with gold-striped epaulettes on both shoulders, dark
> navy necktie, navy trousers with a belt, dark boots.
>
> He carries a plain white ceramic coffee cup — no logo, no text, no saucer.
>
> Colour direction: unchanged from the reference. The gold epaulettes are his signature
> accent.

**Tone rule for the captain, which overrides any pose brief:** he may be funny, but he is
never the butt of the joke, never clumsy, and never loses his composure. Where the other two
strain, flail or tip over, he is unhurried.

---

## The reach binding

These numbers are rules. The striking surface on the active drawing sits this many cell
pixels forward of the pivot column, within 3 px.

| Move | Reach | Height band | What the active drawing shows |
| --- | --- | --- | --- |
| `booster.padJab` | 41 px | mid (34) | Extended straight jab, fist at chest height; owner-approved reach increase |
| `booster.staticFire` | 38 px | mid (30) | Big committed overhand swing, fully extended |
| `booster.spaceLaser` | whole stage, lock-on | any | One arm thrown straight up at the sky, calling it in. The beam is `fx.spaceLaser`, drawn at the opponent |
| `oracle.prompt` | 40 px | mid (34) | Owner-approved straight fist jab, arm nearly locked |
| `oracle.hardCutoff` | 40 px | **low (24)** | Low sweep at shin height |
| `oracle.textBubble` | projectile | (26) | Release gesture only; the bubble is `fx.textBubble`, spawning 20 px forward at 24 px height |
| `captain.setDownTheCoffee` | no hitbox | — | He sets the cup down. Nothing is struck |
| `captain.runTheChecklist` | 36 px | mid (32) | A flat, economical forearm strike |
| `captain.flyby` | full stage | (90) | He points off-frame. The aircraft is `fx.flyby` |

Height bands come from each move's `maxHeight`, the tallest opponent it can legally touch.
A **low** move must read as an ankle-height sweep, a **mid** move as a chest-height strike,
and a **high** move as rising above the head — otherwise it will look like it whiffed on
airborne opponents it legitimately hit.

---

## Waves

Generate in this order. **134 drawings total**, against 56 for the approved Pop T set, so do
not commit to the whole thing before Wave 1 proves the loop end to end.

| Wave | Contents | Drawings | What it buys |
| --- | --- | --- | --- |
| 0 | Three anchors | 3 | Owner review of all three identities before any motion work |
| 1 | THE BOOSTER complete, plus `fx.spaceLaser`, `fx.hitSpark` and `fx.guardSpark` | 45 | A playable **mirror match**: a complete vertical slice on one fighter's art |
| 2 | THE ORACLE complete, plus `fx.textBubble` | 42 | The real matchup, and the zoner/rushdown read |
| 3 | THE CAPTAIN complete, plus `fx.flyby` | 44 | The unlock and the payoff |

### Wave 0 — the anchors

Generate these three first and send them for review before anything else. Every later frame
is a pose delta from its anchor; if an anchor drifts, that whole fighter drifts.

| Frame | Pose |
| --- | --- |
| `booster/anchor-00` | Neutral fighting stance, strict side profile facing right. Weight settled, knees soft, fists up at chest height, chin down. Calm and ready, not mid-swing. |
| `oracle/anchor-00` | The same stance, played his way: narrower, more upright, one hand forward and open, the other tucked near the ribs. |
| `captain/anchor-00` | The same stance, played his way: squared and unhurried, one hand relaxed at his side, the other holding the coffee cup at waist height. |

---

## Shared clips — 25 drawings per fighter

Every fighter needs all eight. The pose is the same brief for all three; the last column is
how each archetype plays it.

### `idle` — 4 frames, loops

Feet planted identically in all four. This is the anchor breathing.

| Frame | Pose | Per fighter |
| --- | --- | --- |
| `idle-00` | The anchor stance exactly. | — |
| `idle-01` | Inhale: chest and shoulders lift 1 px. | Booster's grin widens slightly |
| `idle-02` | Neutral. | — |
| `idle-03` | Exhale: shoulders settle 1 px below neutral. | Captain's cup rises an inch toward a sip he never takes |

### `walk-forward` — 4 frames, loops

**Authored in place.** Hips stay on the pivot column, feet cycle underneath. Guard stays up.

| Frame | Pose |
| --- | --- |
| `walk-forward-00` | Lead foot lifting, weight on the back foot. |
| `walk-forward-01` | Lead foot planting ahead, body at its lowest. |
| `walk-forward-02` | Back foot drawing up under the body. |
| `walk-forward-03` | Back foot set, stance recovered, body at its highest. |

### `walk-back` — 4 frames, loops

The same cycle in reverse order of weight, with the guard tightened — **this is also the
stance the player sees while blocking**, so the guard must already read as a guard.

| Frame | Pose |
| --- | --- |
| `walk-back-00` | Back foot lifting, weight shifting rearward. |
| `walk-back-01` | Back foot planting behind, body lowest. |
| `walk-back-02` | Lead foot drawing back under the body. |
| `walk-back-03` | Stance recovered, guard high and tight. |

### `block` — 2 frames, holds on the last

| Frame | Pose | Per fighter |
| --- | --- | --- |
| `block-00` | Guard committed: both arms in, shoulder turned into the incoming hit, chin behind the guard. | Oracle raises one flat palm instead of two fists |
| `block-01` | Absorbing: same pose compressed, braced 2 px lower. **Hold pose.** | Captain does not compress — he simply stands |

### `hitstun` — 2 frames, holds on the last

Comic recoil, never injury. No blood, no pain, nothing that reads as hurt.

| Frame | Pose |
| --- | --- |
| `hitstun-00` | Head snaps back, arms flying open, heels lifting. |
| `hitstun-01` | Rocked back onto the heels, off balance, eyes wide. **Hold pose.** |

### `airborne` — 3 frames, selected by vertical velocity

Authored sitting on the baseline; the engine lifts them. There are no air attacks, so these
are purely evasive poses.

| Frame | Pose |
| --- | --- |
| `airborne-00` | Rising: legs tucked, arms up. |
| `airborne-01` | Apex: fully tucked, compact silhouette. |
| `airborne-02` | Falling: legs reaching down for the floor. |

### `ko` — 3 frames, holds on the last

Comic and recoverable. He is fine.

| Frame | Pose | Per fighter |
| --- | --- | --- |
| `ko-00` | Knocked off balance, arms wheeling. | — |
| `ko-01` | Sitting down hard. | — |
| `ko-02` | Sat on the floor, dazed but grinning. **Hold pose.** | Captain lands seated, upright, cup miraculously still level — he is not humiliated |

### `win` — 3 frames, holds on the last

| Frame | Pose | Per fighter |
| --- | --- | --- |
| `win-00` | Straightening out of the stance, shoulders squaring. | — |
| `win-01` | Rising into the celebration. | — |
| `win-02` | Full pose. **Hold.** | Booster: both fists overhead. Oracle: adjusts his glasses, one hand in a pocket. Captain: a single calm two-finger salute off the brim of the cap |

---

## Move clips — 40 drawings

Allocation comes from `src/game/marsArcadeSpriteBudget.ts` and is enforced against the
committed frame data. `s/a/r` is startup / active / recovery in engine frames at 60 Hz.

### THE BOOSTER — 11 drawings

**`booster.padJab`** — 3 drawings, `4/3/7`

| Frame | Pose |
| --- | --- |
| `padJab-00` | Startup: rear shoulder loading, lead fist cocked an inch. |
| `padJab-01` | **Active:** straight jab, fist 41 px forward at chest height, shoulder driven forward and arm nearly straight. |
| `padJab-02` | Recovery: fist snapping back to guard. |

**`booster.staticFire`** — 5 drawings, `11/4/18`

| Frame | Pose |
| --- | --- |
| `staticFire-00` | Startup: weight dropping onto the back foot, arm winding back and low. |
| `staticFire-01` | Startup: arm at the top of its arc, body coiled, clearly telegraphed. |
| `staticFire-02` | **Active:** overhand swing fully extended, 38 px forward at chest height, hips rotated through. |
| `staticFire-03` | Recovery: arm carried past the target by its own weight, balance going. |
| `staticFire-04` | Recovery: hauling himself back upright into the guard. |

**`booster.spaceLaser`** — 3 drawings, `0/1/28`

The signature move, and the one with no warning at all (owner direction, 2026-09-22). A
Starlink laser comes straight down onto the opponent the instant the button is pressed,
anywhere on the stage, through any guard. There is **no startup drawing**: the move opens
on its active frame. The long recovery with the arm still raised is its only cost.

| Frame | Pose |
| --- | --- |
| `spaceLaser-00` | **Active:** one arm thrown straight up, finger pointing at the sky, the other hand holding a phone low at the hip as if he just hit send. Chin up, grin. Draw NO beam; that is `fx.spaceLaser`. |
| `spaceLaser-01` | Recovery: arm still up, now looking across at where the beam landed, satisfied. |
| `spaceLaser-02` | Recovery: arm coming down, phone going back into a pocket, settling to the guard. |

### THE ORACLE — 14 drawings

**`oracle.prompt`** — 3 drawings, `5/2/8`

| Frame | Pose |
| --- | --- |
| `prompt-00` | Startup: fist draws back into a compact wind-up. |
| `prompt-01` | **Active:** straight fist jab, 40 px forward at chest height, arm nearly locked, expression unchanged. |
| `prompt-02` | Recovery: hand withdrawing to the ribs. |

**`oracle.hardCutoff`** — 6 drawings, `13/3/20`

The longest reach and the longest telegraph in the game.

| Frame | Pose |
| --- | --- |
| `hardCutoff-00` | Startup: weight sinking, one hand lowering. |
| `hardCutoff-01` | Startup: dropping into a deep crouch, rear leg loading. |
| `hardCutoff-02` | Startup: fully coiled, leg cocked, palm on the floor for balance. |
| `hardCutoff-03` | **Active:** low sweep, leg fully extended 40 px forward at shin height, hips down. |
| `hardCutoff-04` | Recovery: leg carried through, seated low on the trailing hip. |
| `hardCutoff-05` | Recovery: rising back to the stance, sweater settling. |

**`oracle.textBubble`** — 5 drawings, `9/1/16`

| Frame | Pose |
| --- | --- |
| `textBubble-00` | Startup: both hands coming together at the chest, fingers steepled. |
| `textBubble-01` | Startup: hands parting slightly, shoulders lifting. |
| `textBubble-02` | **Active:** release — both palms pushed forward and open at chest height. Draw NO projectile; that is `fx.textBubble`. |
| `textBubble-03` | Recovery: arms still extended, beginning to lower. |
| `textBubble-04` | Recovery: hands back to the guard, glasses adjusted with one finger. |

### THE CAPTAIN — 15 drawings

**`captain.setDownTheCoffee`** — 3 drawings, `6/0/10`

No hitbox at all. This move exists to bank composure, and it must read as *deliberately
taking his time*.

| Frame | Pose |
| --- | --- |
| `setDownTheCoffee-00` | Startup: beginning to lower the cup, eyes still on the opponent. |
| `setDownTheCoffee-01` | Setting the cup down on an unseen surface at hip height, perfectly level. |
| `setDownTheCoffee-02` | Straightening, hand leaving the cup, cuff adjusted. The cup stays behind — from here on it is a small detached object in the frame, which the silhouette gate allows. |

**`captain.runTheChecklist`** — 5 drawings, `9/3/11`

| Frame | Pose |
| --- | --- |
| `runTheChecklist-00` | Startup: lead hand rising, palm flat, as if turning a page. |
| `runTheChecklist-01` | Startup: forearm drawn back across the chest, shoulder turned in. |
| `runTheChecklist-02` | **Active:** flat forearm strike, 36 px forward at chest height. Economical, no wind-up flourish. |
| `runTheChecklist-03` | Recovery: arm returning across the body. |
| `runTheChecklist-04` | Recovery: back to the stance, entirely unhurried. |

**`captain.flyby`** — 7 drawings, `26/8/22`

The longest telegraph in the game, and the payoff of the whole cabinet.

| Frame | Pose |
| --- | --- |
| `flyby-00` | Startup: he looks up and off-frame, chin lifting. |
| `flyby-01` | Startup: raising one arm, hand flat, sighting along it. |
| `flyby-02` | Startup: arm fully extended, pointing off-frame, braced. Clearly telegraphed — the opponent has 26 frames to react. |
| `flyby-03` | **Active:** holding the point, hair and tie pushed back by something passing. Draw NO aircraft; that is `fx.flyby`. |
| `flyby-04` | **Active:** same hold, coat and tie at full stretch. |
| `flyby-05` | Recovery: arm lowering, tie settling. |
| `flyby-06` | Recovery: back to the stance. Two-finger touch to the cap brim. |

---

## Effects — 16 drawings

Authored outside the character cell and not gated by the character checker.

| Sprite | Cell | Frames | Brief |
| --- | --- | --- | --- |
| `fx.hitSpark` | 32×32 | 3 | A clean flat starburst, expanding then thinning. No photographic glow. |
| `fx.guardSpark` | 32×32 | 2 | The same shape, visibly weaker and cooler than the hit spark — a player must tell them apart at a glance. |
| `fx.spaceLaser` | 32×224 | 4 | A vertical beam from the top of the screen straight down onto the opponent. Four frames: slam in at full width, hold, thin to a thread, and a scorch mark left on the regolith. Near-white core, thin cyan edge, 1 px dark outline so it cuts through the crimson sky. Drawn at the **defender's** x. A laser from orbit only — never aimed at or near an aircraft. |
| `fx.textBubble` | 40×40 | 3 | The oracle's projectile: a flat speech-bubble shape with a solid cyan fill and a hard outline, gently pulsing across the 3 frames. About 36 px across, matching the 18 px collision radius. No text inside it. |
| `fx.flyby` | 320×96 | 4 | A DC-9 in side profile crossing the full stage width, clean and flat, wings level. Not a warplane, no weapons, no smoke trail, no motion lines. It should read as *dignified*. **Pale fuselage, not a dark silhouette** — see the note below this table. |


**`fx.flyby` against the dust-storm sky (measured 2026-09-22).** The cell is anchored with
its top at screen row 28, directly under the HUD, and the aircraft is drawn in the cell's
**top 32 rows** (screen rows 28-60), roughly 110-130 px long. Below row 60 the dust banks
turn to bright orange shelves, and no single flat colour survives them.

- **Fuselage and wings pale**, a warm off-white around `#f4ead2`, with a 1 px outline in the
  sky's darkest crimson `#160a12`. Against that lane the pale fill never drops below
  **3.91:1** contrast. With the outline it stays above 4.1:1 anywhere in the cloud band,
  so a drawing that dips lower still reads.
- **Never a dark silhouette.** The original brief implied one, and against this sky it would
  vanish: `#160a12` has a **1.18:1** median contrast in the lane.
- One cheatline or window row in a mid tone is fine. It must stay a DC-9-32 in major
  outline: T-tail, two rear-mounted engines, no underwing engines. Never an A320 shape.

`check-arcade-stage.mjs` measures this lane on the live canvas at both camera clamps. It
fails if the pale fill drops under 3:1, and also if the dark silhouette starts reading,
which would mean the sky changed and this note needs revisiting. Moved to rows 60-124,
the same check fails at 1.03:1.

---

## The stage backdrop — five layers, optional generation

**Built in code on 2026-09-20 and playable now** (`src/game/marsArcadeStage.ts`), because
nothing in contract v1 owned the world the fight happens in: all 134 drawings are characters
and effects, so the finished set would still have been two fighters on an empty dark field.

The stage is now **480 px wide behind a 320 px screen** and the camera follows the fighters,
so the backdrop is not one picture. It is five layers that each scroll at their own rate and
each **tile seamlessly** at their own span width. A single wide painting cannot be used: it
does not tile, and the stage is longer than any one screen.

To replace the code art with generated art, do it **one layer at a time**, keep the parallax
factor and the span width exactly, and gate each one the same way a character frame is gated.

| Layer | Parallax | Tile | Subject |
| --- | --- | --- | --- |
| `stars` | 0.06 | 320×84 | Mars night sky: sparse stars, Phobos and Deimos. Nothing above row 28 — the HUD is there. |
| `ridge` | 0.20 | 320×48 | A far ridge line, flat silhouette, based on the horizon glow and never reaching the floor. |
| `colony` | 0.42 | 320×56 | A LOW Mars outpost, never a city skyline: geodesic domes, horizontal cylindrical habitat modules with round portholes, connecting tubes, solar array fields, tanks, one comms mast, one dish, one rocket on a service tower, and a landing apron with a cargo lander and a rover. **No aircraft.** Owner decision 2026-09-22: the DC-9 was removed from the backdrop — the tribute has its own chapter, and `fx.flyby` still carries it inside the cabinet. |
| `pad` | 0.74 | 160×12 | The near berm and its landing lights. |
| `ground` | 1.00 | 160×36 | REGOLITH, not decking: dust drifts, ripples and scattered rock, with a sunlit top strip. A riveted metal floor is the one thing in frame that could not be Mars. At parallax 1 this is what tells the player the stage moved; the span widened from 64 to 160 because loose ground has no periodic features to hide a short repeat behind. |

**Rules a generated layer must meet, on top of the usual ones**

- **Seamless at its own span width.** Column 0 must join column `spanWidth - 1` with no seam.
  This is the first thing to check and the commonest way a layer fails.
- **Flat colour, no gradients, no dithering.** The bands behind these layers are flat steps
  for a reason: anything interpolated crawls when the camera scrolls at whole pixels.
- **The fighters must stay readable.** The backdrop exists to silhouette them. Mean luminance
  must stay well above the retired `#14101a` void and every value behind a standing fighter
  brighter still — held by `is not a void` in `src/game/marsArcadeStage.test.ts`.
- **Nothing above row 28 in `stars`**, where the HUD sits.
- Authored on the `#FF00FF` chroma field like every other asset here, then normalised and
  checked; the same spoiler rule applies, so no ground-transport reward anywhere in the sky.

---

## When a frame comes back

Reject and regenerate yourself if any of these is obviously wrong — it is cheaper than a
validation round trip.

- Not a strict side profile, or the figure faces left.
- The face does not read as the intended person: Booster as Elon Musk, Oracle as Sam
  Altman, Captain against the Pop T identity anchor. A generic face is a reject.
- The caricature is unkind, political, or implies an endorsement.
- Gradients, gloss, specular highlights, or a reflection on the oracle's glasses.
- Motion blur, speed lines, impact stars, dust, an energy effect, or a ground shadow.
- A projectile, aircraft, or spark drawn into the character cell.
- Background not flat `#FF00FF`, or magenta spill on the silhouette edge.
- The figure grew or shrank against that fighter's anchor.
- Feet not on the baseline in a grounded pose, or a travel offset baked into a walk frame.
- The striking surface on an active frame is not at the move's reach, or a low move is drawn
  at chest height.
- Floating pixels detached from the silhouette, other than the deliberately released coffee
  cup.
- Any text, logo, border or watermark.

Two regeneration attempts per frame, then flag it rather than fighting it — past that it is
an art call, not a tooling one.

Every frame is then validated against `asset-reports/mars-arcade-sprite-contract.json` by
`tools/assets/check-popt-frames-fullcolour.py`: standing height, baseline drift, envelope,
silhouette connectivity, chroma residue and alpha integrity. Reach accuracy has **no checker
yet** — it is specified in the contract under `reachBinding` and is the obvious next tool to
write once real frames exist.
