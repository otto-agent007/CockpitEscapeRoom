# Mars arcade stage backdrop — generated layers, 2026-09-22

**Status: art candidate only. Not integrated, not owner-reviewed, not production.** The
runtime still draws the flat-shape backdrop in `src/game/marsArcadeStage.ts`; nothing
imports these files and no runtime code changed. What exists is five normalised tiles,
one new tool, and a throwaway mock-up composite used to judge the look.

## Why

Owner, 2026-09-22: the committed stage is "a little too plain", then "needs to be more
badass", then — pointing at <https://www.youtube.com/watch?v=en37mtF42eQ> — "the one in
the video is really badass, learn from that then regenerate".

## What the reference actually does

Studied from the clean background frame at **4:18**, where the author's own stage-preview
panel reports his source is **2048x768**. Four things carry it, and only the last was
already true of ours:

1. **The sky is over half the frame and full of big underlit cloud banks.** Not streaks —
   towering cumulus with dark tops and blazing rims along the *underside*, because the sun
   is below frame. This is the single biggest contributor and we had nothing like it.
2. **The horizon blazes hottest directly behind a LOW skyline**, so the buildings are
   backlit. His skyline is roughly 12% of frame height.
3. **A see-through mid-ground barrier** (his chain-link fence) spanning the full width,
   with clutter standing against it. It is what splits the image into three depth planes.
4. A background wider than the viewport. Ours already scrolls, and ours has parallax,
   which his does not — he says he ran out of time for it.

## The layers

Prompts: `art-source/arcade/prompts/backdrop-v1/*.txt`. Raws and tiles:
`art-source/arcade/generated/backdrop-v1/`. Every raw is 1536x1024 native, unresized.

| Tile | Size | Palette | Coverage | Wrap join | Source |
| --- | --- | --- | --- | --- | --- |
| `clouds-320x104.png` | 320x104 | 4 | 56.3% | ok | `clouds-raw.png` |
| `ridge-320x40.png` | 320x40 | 1 | 65.6% | exact | `ridge-v2-raw.png` |
| `colony-320x62.png` | 320x62 | 4 | 49.1% | ok | `colony-v2-raw.png` |
| `apron-320x40.png` | 320x40 | 3 | 53.3% | ok | `apron-raw.png` via `apron-crop.png` |
| `deck-64x36.png` | 64x36 | 5 | 100% | exact | `deck-raw.png` via `deck-crop.png` |

"Coverage" is the share of tile cells that are opaque. "Wrap join" compares the
discontinuity across the tile's own wrap against the distribution of its interior
column-to-column differences — see the correction below, because the first version of
this measurement was wrong and manufactured two defects that did not exist. All five use
every palette entry they were given, so nothing collapsed to a single tone.

The colony carries **the DC-9 parked on the pad** — the one piece of story in the
backdrop — and it reads correctly: T-tail, two rear-fuselage engines, clean low wings,
lit cabin windows. The committed code shape it replaces reads as a park bench. v2 also
adds a colossal launch gantry and rocket as the skyline's hero structure.

## New tool

`tools/assets/normalise-arcade-backdrop.py` — crops a generated raw to its subject, maps
to a fixed palette, modal-vote downsamples to the tile, and reports coverage, palette use
and the wrap seam. It follows `normalise-popt-frame.py` in voting rather than averaging,
for the reason recorded there.

**It deliberately does NOT reuse that file's magenta key, and this is the finding worth
carrying forward.** The Pop T pipeline classifies background by `min(R,B) - G`, treating
anything over 60 as background and only 15 or below as safe to vote. The Mars backdrop
palette is deliberately violet: the ridge interior is `(65,48,66)`, which scores **17**.
Three points over the line meant *every interior pixel abstained*, and the first ridge
tile came back **11.5% filled** — a silhouette with nothing inside it. The colony was
quietly losing content the same way (23.7% where it should have been 34.1%). A character
frame never hits this because no Pop T palette entry is purple.

Replaced with a comparison of distance-to-key-colour against distance-to-nearest-palette-
entry, which asks the question that actually matters and stays correct for any hue. After
the fix the ridge went to **65.6% coverage with a 0.0% seam**.

## Known problems, not fixed

- ~~The apron seam is 22.9% and the colony's is 13.0%.~~ **Both resolved 2026-09-22, and
  one of them was never real.** See "The seam metric was measuring the wrong thing" below.
- **Placement constants are mock-up values, not contract.** The layer heights and bottom
  rows live in a scratchpad script, and two tiles were rolled horizontally (colony +60) so
  features clear the fighters at the neutral camera. None of that is real layout yet.
- **Fighter readability is untested.** The `is not a void` test in
  `marsArcadeStage.test.ts` checks the code bands, which these do not change. The hot sky
  ramp in the mock-up keeps row 84 — a standing fighter's head — at a luminance of about
  0.028 against the test's 0.017 floor, but that ramp is not committed anywhere.
- **The deck lost most of its detail** at 64x36. A 5:1 downsample erased the rivets
  entirely; a 3:1 crop recovered them, but the tile is small enough that repetition is
  visible across the floor.
- No browser evidence, no Playwright run, no reduced-motion or width checks. The
  `blender-browser-visual-gate` skill has not been run because there is nothing running
  in a browser to gate yet.

## What integration would take

The renderer draws `MarsArcadeBackdropShape` primitives (`arcadeHarness.ts:424-427`). Using
these tiles means teaching the stage to carry image layers as well as shapes, giving each
one its parallax and span, and preloading them — plus deciding whether the sky bands move
from 11 flat steps to a fine ramp. Worth noting the bands are **screen-space** and never
scroll (`arcadeHarness.ts:420-423`), so the "no gradients, they crawl" rule in the prompt
pack applies to the parallax layers and not to the sky. That is what makes a fine ramp
safe, and it is the reason the mock-up's sky stops looking like a colour test chart.

## The seam metric was measuring the wrong thing — 2026-09-22

The first version of `normalise-arcade-backdrop.py` reported a seam as *"the share of
rows whose first and last column differ"*. That is not a seam test. **Any two adjacent
columns of a busy texture differ — that is what texture is.** Reading it as a defect sent
a whole repair pass after a problem that did not exist.

Replaced with the question that matters: is the join discontinuous **relative to the
tile's own column-to-column variation**? Comparing the wrap against the distribution of
every interior neighbour pair:

| layer | wrap | interior median | interior p90 | verdict |
| --- | --- | --- | --- | --- |
| colony | 245 | 943 | 3933 | join is *smoother* than an average interior pair |
| clouds | 1196 | 1660 | 3655 | fine |
| ridge | 0 | 0 | 1592 | exact |
| deck | 0 | 0 | 140 | exact |
| apron *(before)* | **5690** | 440 | 5057 | **13x the median — a real break** |
| apron *(after)* | 396 | 367 | 4342 | fine |

So the colony's "13%" was noise and the clouds' "3.8%" was noise, while the apron's
problem was genuine. Diagnosis: the generated apron had an **open gap between bars at its
left edge and a solid crate stack at its right**, so tiling slammed a crate against open
sky. Fixed by cutting the source gap-to-gap (columns 4..1210, both of which fall between
bars) so only the continuous rails cross the join. No repainting, no regeneration.

Also worth recording: a **top-edge step of 0 at the wrap on every layer** — the silhouette
height never jumps — which is the other thing a skyline seam would show and did not.

## HUD restyle — proposal, 2026-09-22

Owner: "a cooler looking HUD with an energy bar for a special attack and his cool UI
elements", then "needs more style to it".

The construction was taken from the reference's **own UI atlas**, paused at 15:32, which
is far more informative than the assembled HUD: health fills are separate green / gold /
red strips with a **chevron point** and a gloss line along the top; frames are dark
troughs inside a chamfered multi-step steel bevel with a **gold chevron end-cap**; small
indicators are **pill chips** with a gold-tinted bevel; icons sit in plates with **gold
corner accents**.

**His UI-atlas *method* was deliberately not copied.** It works because his canvas is
~760 px wide internally. Ours is 320, and the HUD band is 26 rows — a generated atlas
downsampled that far loses every bevel, exactly as the 64x36 deck tile did. The visual
vocabulary transfers; the pixels have to be drawn. The mock-up therefore draws the HUD
procedurally, using the **real 5x7 glyphs parsed out of `src/dev/arcadePixelFont.ts`** so
it cannot flatter itself with a font the game does not have.

What the proposal adds over the committed HUD: chamfered bevelled plates, a health fill
that **ramps green -> amber -> red and blinks at critical** (the committed bar is flat
salmon at every value, giving no colour warning at all), a chevron leading edge, a gold
end-cap, visible quarter ticks, a **chunked SPECIAL meter whose frame and chips flash gold
when a special can actually be thrown**, an octagonal timer, angled name plates with gold
chevrons, and round-win pips.

**Still a mock-up.** It lives in the session scratchpad, not the repo, and the renderer is
untouched. Two things were tried and rejected on measurement rather than taste: a
"SPECIAL" text label (42 px of a 320 px screen, and it collided with both neighbours) and
a 9x9 bolt icon chip (three legible pixels of noise at this size). Two earlier passes were
also wrong and are recorded here so they are not retried: a single-step bevel read as web
UI, and over-correcting to a five-ring timer and mid-steel frame bodies blew the value
structure out — the trough must stay clearly lighter than the scene behind it or every bar
reads as a wireframe.
