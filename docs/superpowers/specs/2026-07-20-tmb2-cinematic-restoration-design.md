# TMB2 Cinematic Restoration Design

## Authority

This document records the owner-approved July 19 TMB2 intro contract after the original ChatGPT Work artifacts became unavailable. It supersedes the generic layered montage currently implemented on `agent/genesis-placeholder-intro`. The surviving authoritative storyboard remains:

`art-source/intro/tmb2/recovered/2026-07-19-storyboards/pilot Pop T with golden blond hair and blue eyes.png`

The original source-of-truth documents named by the owner were:

- `2026-07-19-tmb2-cinematic-intro-design.md`
- `2026-07-19-tmb2-intro-cinematic-assets.md`
- `2026-07-19-tmb2-intro-final-integration.md`

Those three files are not present in this checkout, Downloads, or reachable Git history. This document preserves the owner's supplied reconstruction without treating the damaged placeholder as design authority.

## Player-visible goal

The intro is a 53.04-second, 16-bit animated comedy. The blue TMB2 logo boots like a classic console, then Pop T chases a mischievous living golden key through increasingly ridiculous symbolic scenes until the player presses Start and the key unlocks the crisp DC-9 game.

The existing briefing screen remains first. Its **Start Game** button unlocks browser audio and starts the cinematic at time zero; it never skips the TMB2 ident.

## Exact timeline

| Time | Scene |
| --- | --- |
| 0-6s | Blue pixels assemble the TMB2 logo; a gold-white highlight overloads into the story. |
| 6-12s | Pop T enters confidently and struggles with an oversized, rattling duffel bag. |
| 12-16s | The cartoon key bursts from the luggage, startles Pop T, taunts him, and escapes. |
| 16-22s | Runway chase with airport equipment and a runway-cart near miss. |
| 22-28s | Ballpark gag: the key redirects a baseball and Pop T performs a dramatic slide past the base. |
| 28-35s | Neon city/finance scene: the key runs along a rising graph and Pop T collides with bull imagery. |
| 35-42s | Clouds and a red digital horizon launch the chase into the sky. |
| 42-48s | Pop T uses pilot-wing imagery to glide, misses the key once, recovers, and catches it. |
| 48-51s | Brief victory pose followed by one last joke from the key. |
| 51-53.04s | The key drags Pop T offscreen; everything collapses into blue pixels and loops back to TMB2. |

## Playback and input contract

- **PRESS START** appears at exactly 6.000 seconds and remains available throughout the chase and later loops.
- Mouse/pointer, Enter, Space, and standard-controller Start all request the same exactly-once transition.
- Enter and Space do not hijack mute, volume, retry, or other focused native controls.
- If nobody presses Start, the 53.04-second audio and animation restart together at zero without timing drift. The Start latch remains available after the first six seconds.
- Audio failure switches to a monotonic fallback clock at the same sampled story time. A successful retry resynchronizes media to fallback time.
- Starting triggers a 650-millisecond handoff: the cartoon key flies toward the camera while rotating as if entering a lock, CRT scanlines/vignette/RGB separation snap away, and music fades to zero over the first 300 milliseconds.
- The already-preloaded DC-9 becomes interactive at the end of the handoff. The transition dispatches completion once even if inputs arrive simultaneously.
- The intro exposes mute, volume, and sound retry without changing the story clock.

## Visual contract

- Native logical resolution: 320 x 224, authored at **one art pixel per stage pixel**.
- **The runtime never resamples art.** Sprites are Pixel Snapper output — canonical 128 x 128 exported at 256 x 256 — so one art pixel is two frame pixels and the only legal draw scale is `0.5`. Drawing the 256 px export at `0.5` is lossless: it recovers the canonical grid exactly, because every 2 x 2 block in a 2x-upscaled image is uniform. Enforced by `src/game/introGrid.test.ts`.
- **On-screen size is a property of the canonical art, not a draw-time multiplier.** An actor that is the wrong size is re-exported through Pixel Snapper at a different canonical size. This rule exists because it was broken: Pop T shipped at `1.12` (2.24 stage pixels per art pixel, shredding the grid) and the key at `0.38` (0.76 — below its authored resolution, discarding roughly a quarter of its pixels). Those two illegal values were mutually compensating for an asset-size mismatch, which is why the result looked plausible while every layer was wrong.
- The procedurally drawn props (contact shadows, cloud puffs, impact star, base, neon trace) are still antialiased vector shapes and are the one layer left off the grid. Measured end to end, sprite art renders at exactly 0.000% interior change at every backing-store scale; with props included that rises to 0.08-0.18%, and all of the difference is theirs. They should become hard-edged pixel shapes once the plates land, so the whole frame shares one grid.
- Every intro image must be the kind of art it claims to be, checked by `tools/assets/check-intro-grid.mjs`: snapped art reads ~0% interior change at its declared block size, continuous-tone art reads ~90%. The background plates are a **recorded deficit** — raw 1586 x 992 ImageGen output with 100k+ colours that never went through any snapping, which is the dominant visual defect in the cinematic.
- Desktop-only composition; narrower windows letterbox the same composition but do not receive a redesigned mobile scene.
- Integer nearest-neighbor rasterization: the canvas backing store is always a whole-number multiple of 320 x 224 and every sprite, prop, and ident pixel is drawn with nearest-neighbour sampling inside it.
- The rasterized stage is then fitted to the shell so the picture fills the available box at its native aspect. **Superseded 2026-07-26:** this previously required the *CSS presentation* to be an integer multiple as well, which stranded a one-times 320 x 224 stage in a field of black on narrow windows — at 375 px the picture occupied under a sixth of the screen. The backing-store multiple is chosen nearest the display size, so compositing stays within a few percent of 1:1 and remains on the nearest-neighbour path.
- Background plates are filtered once per backing-store scale into a cached surface and blitted 1:1 per frame. Point-sampling a ~1586 px plate straight down to 320 px discarded roughly four fifths of the source columns and made skylines and star fields crawl during the parallax pan; resampling per frame instead cost two thirds of the frame budget at large window sizes.
- Deep navy, electric blue, white, gold, and restrained red palette.
- A large blue, striped, original TMB2 ident evokes 1990s console presentation. It must not be the gold serif placeholder and must not copy the SEGA wordmark exactly.
- No visible scene titles or chapter captions appear over the animation. A visually hidden scene summary remains for assistive technology.
- CRT scanlines, vignette, and restrained RGB separation exist only during the intro, are bound to the picture rather than the window so they never fall across the letterbox bars, and disappear during the Start handoff.
- Sound and volume controls sit in a compact, recessive corner cluster. They must not span the stage: a full-width control slab covered the bottom band of every plate.
- Locations are symbolic comedy backdrops, not playable airport, baseball, finance, or sky levels.
- No cockpit image, cockpit title, vehicle reward, Flight Mode, or Mars spoiler appears in the cinematic.

## Character and asset contract

Pop T uses the existing idle/run/catch art plus the recovered 24-frame cinematic set:

- Duffel pull: 4 frames
- Startle/stumble: 3 frames
- Baseball slide: 4 frames
- Bull spin: 6 frames
- Pilot glide: 4 frames
- Victory/recovery: 3 frames

The recovered animation JSON supplies explicit per-frame durations, common 256 x 256 canvases, a bottom-center pivot at `(128, 224)`, and `loop`, `once`, or `hold-last` behavior. Runtime rendering selects PNG frames from the media clock; animated WebP files remain previews only.

The cartoon key uses 16 selected frames from the recovered pose set, grouped as:

- Taunt: 4 frames
- Run: 6 frames
- Fly: 4 frames
- Tug: 2 frames

The seventeenth recovered key image remains preserved but is not part of the approved 16-frame runtime choreography. The cartoon key remains visually distinct from the realistic engraved Captain's Key awarded during DC-9 gameplay.

The duffel, runway equipment/cart, baseball/base, graph line, bull impact, cloud puffs, and pilot wings are independent choreography layers. Existing recovered scene plates may supply environmental art, but character sprites and props must move independently. Far, middle, ground, and foreground motion is driven by the story clock rather than CSS animation start time.

Each prop layer declares whether it sits behind or in front of the actors. Staging (contact shadows, the base, the key's neon trace, the deployed wings) draws behind; impact and weather accents (the bull hit, the thrown ball, foreground cloud) draw in front. Every prop must be anchored to something in its plate or to an actor, and must not restate art the plate already paints — the earlier flat versions read as debug overlays: a second chart line laid across the painted skyline and through the character, a white diamond floating clear of the painted home plate, pale bars crossing Pop T's uniform where wings were intended, and an impact star flashing in empty street mid-scene rather than on contact.

The lost final integration contract described 104 audited deployable artifacts and 52 preload entries, with fewer images decoded at startup. The current recovered package contains 69 manifest assets and 17 preload entries. Do not fabricate missing files merely to match the historic counts. Restore semantic preload tiers now and record the remaining inventory delta until additional authoritative artifacts are recovered or recreated.

## Reduced motion and accessibility

Reduced motion preserves the same 53.04-second audio/story clock and scene sequence but holds an approved representative pose in each scene, removes parallax and camera travel, and uses the same Start inputs. Every required action remains a native HTML control. Scene summaries are available to screen readers without showing titles over the picture.

## Acceptance proof

Before publication, record one uninterrupted 1440 x 900 browser run showing:

1. Briefing **Start Game** to the blue TMB2 boot.
2. The full 53.04-second unattended loop with audio and animation returning to zero together.
3. Smooth Pop T and key animation in every scene with no pivot twitch, native WebP looping, or stepped world motion.
4. **PRESS START** appearing at six seconds and remaining available.
5. A Start activation showing the 300 ms audio fade, 650 ms key-to-lock transition, CRT removal, and interactive DC-9 handoff.

Automated coverage must prove exact scene boundaries, animation frame selection and loop modes, monotonic restart, all four Start inputs, exactly-once completion, asset fallback, reduced-motion behavior, 320 x 224 integer geometry, and spoiler exclusion.
