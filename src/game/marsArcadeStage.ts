/**
 * Mars arcade cabinet — stage, camera and backdrop content.
 *
 * Content and pure geometry only: no canvas, no Three.js, no DOM. The box harness
 * draws this today and the cabinet renderer will draw the same data later, so the
 * stage is described once and in one place.
 *
 * Two coordinate spaces meet here:
 *
 * - **Stage x** is the fight loop's own space, centred on 0, walled at
 *   `MARS_ARCADE_STAGE.halfWidth`. The engine owns it.
 * - **View rows and columns** are the 320x224 arcade screen, the same screen the
 *   intro uses. Backdrop shapes are authored in view rows measured down from the
 *   top, because a horizon is a property of the screen, not of the fight.
 *
 * The stage is deliberately WIDER than the view, so the fighters can walk out of
 * frame and the camera has to follow them. Everything that makes that legible —
 * the parallax layers, the corner margin, the integer scroll — lives below.
 */

import { MARS_ARCADE_STAGE, type MarsArcadeState } from './marsArcade'

/**
 * The visible screen. Unchanged from the intro stage and from contract v1: the
 * sprite pipeline, the pixel grid and the cabinet all assume 320x224.
 */
export const MARS_ARCADE_VIEW = {
  width: 320,
  height: 224,
  /** The row the fighters' feet stand on. */
  floorRow: 188,
} as const

export const MARS_ARCADE_CAMERA = {
  /**
   * How far past a wall the camera is allowed to look.
   *
   * Without this the clamp stops with the wall exactly on the screen edge, and a
   * cornered fighter is drawn half outside the screen: the sprite is 44 px wide,
   * so 22 px of it hangs off. 24 px of margin keeps a cornered fighter whole with
   * 2 px to spare, and is the number `a cornered fighter stays fully on screen`
   * in the tests actually checks.
   */
  cornerMarginPx: 24,
  /**
   * Fraction of the remaining distance the camera closes each frame. Presentation
   * smoothing only — the target below is what the rules-facing code uses, and any
   * smoothed value between two clamped targets is still inside the clamp.
   */
  followPerFrame: 0.12,
} as const

/** How far the camera centre may travel either side of stage centre. */
export function marsArcadeCameraLimit(): number {
  return (
    MARS_ARCADE_STAGE.halfWidth - MARS_ARCADE_VIEW.width / 2 + MARS_ARCADE_CAMERA.cornerMarginPx
  )
}

/**
 * Where the camera wants to be: centred between the fighters, clamped to the stage.
 *
 * Rounded to a whole stage pixel. The stage is pixel art drawn at an integer scale,
 * so a fractional scroll would shimmer every edge on screen — the same rule the
 * intro stage follows.
 */
export function marsArcadeCameraTarget(state: MarsArcadeState): number {
  const midpoint = (state.fighters[0].x + state.fighters[1].x) / 2
  const limit = marsArcadeCameraLimit()
  return Math.round(Math.min(limit, Math.max(-limit, midpoint)))
}

/** Stage x to view column, for a given camera centre. */
export function marsArcadeScreenX(stageX: number, cameraX: number): number {
  return MARS_ARCADE_VIEW.width / 2 + stageX - cameraX
}

/**
 * One tile of generated backdrop art.
 *
 * The backdrop used to be flat shapes drawn in code — bands, four triangles, two
 * domes and a line that was supposed to read as a DC-9. It was legible but plain,
 * and the aircraft read as a park bench. These layers are generated pixel art,
 * normalised to a fixed palette and proven to tile, authored by
 * `tools/assets/normalise-arcade-backdrop.py` and documented in
 * `asset-reports/mars-arcade-backdrop-2026-09-22.md`.
 *
 * `src` is a dev-server URL. The cabinet is dev-only today, and Vite serves the
 * project root in dev, which is the same route `arcadeHarnessSprites.ts` already
 * uses for character frames. A production cabinet must move these under `public/`.
 */
export interface MarsArcadeBackdropLayer {
  id: string
  src: string
  /** 0 = pinned to the screen, 1 = locked to the stage and scrolling with it. */
  parallax: number
  /** The layer repeats every `spanWidth` columns. */
  spanWidth: number
  width: number
  height: number
  /** View row the tile's BOTTOM edge sits on. */
  bottomRow: number
}

export interface MarsArcadeBand {
  /** Top row, measured down from the top of the view. */
  y: number
  height: number
  colour: string
}

/**
 * The sky, as a fine ramp between eight anchor colours.
 *
 * These bands are the reason the fighters read at all: the retired stage was
 * near-black above and below the floor line, so a dark sprite sat on a dark field
 * and the silhouette — the one thing a fighting game cannot compromise on —
 * disappeared. `the stage is not a void` in the tests holds that.
 *
 * The anchors used to be held for 24 to 30 rows each, which made the sky read as
 * eight stripes rather than as dusk. They are now interpolated in two-row steps.
 * That is safe because **these bands are screen-space and never scroll** — the
 * harness fills them at x = 0 across the full width with no camera offset — so the
 * prompt pack's "no gradients, they crawl at integer scroll" rule binds the
 * parallax layers above and not this ramp. Two-row steps rather than one keeps a
 * visible banding, because the cabinet should still look drawn rather than shaded.
 */
const SKY_ANCHORS: ReadonlyArray<readonly [number, string]> = [
  [0, '#0d0816'], [30, '#180e22'], [58, '#281534'], [84, '#47203f'],
  [114, '#7a2a3c'], [142, '#ad3b31'], [166, '#db652b'], [176, '#f2913c'],
  [188, '#ffb457'],
]
const SKY_STEP = 2

function channels(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function mix(from: string, to: string, t: number): string {
  const a = channels(from)
  const b = channels(to)
  const parts = a.map((channel, index) => Math.round(channel + ((b[index] ?? 0) - channel) * t))
  return `#${parts.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

function skyRamp(): MarsArcadeBand[] {
  const bands: MarsArcadeBand[] = []
  for (let y = 0; y < MARS_ARCADE_VIEW.floorRow; y += SKY_STEP) {
    const height = Math.min(SKY_STEP, MARS_ARCADE_VIEW.floorRow - y)
    let colour = SKY_ANCHORS[SKY_ANCHORS.length - 1]?.[1] ?? '#000000'
    for (let i = 0; i < SKY_ANCHORS.length - 1; i += 1) {
      const [y0, c0] = SKY_ANCHORS[i] as readonly [number, string]
      const [y1, c1] = SKY_ANCHORS[i + 1] as readonly [number, string]
      if (y >= y0 && y <= y1) {
        colour = mix(c0, c1, (y - y0) / (y1 - y0))
        break
      }
    }
    bands.push({ y, height, colour })
  }
  return bands
}

/** Below the floor line: the lit front lip first, then falling away. */
const FLOOR_BANDS: MarsArcadeBand[] = [
  { y: 188, height: 4, colour: '#c47a4e' },
  { y: 192, height: 14, colour: '#7a4a3a' },
  { y: 206, height: 18, colour: '#4e2d26' },
]

export const MARS_ARCADE_BANDS: MarsArcadeBand[] = [...skyRamp(), ...FLOOR_BANDS]

/**
 * Parallax layers, far to near.
 *
 * Proportions follow the reference stage studied for this pass: the sky carries big
 * underlit cloud banks over more than half the frame, the horizon is left open and
 * blazing directly behind a LOW skyline so the colony is backlit, and a see-through
 * barrier splits the near ground from the distance. Raising the colony to fill that
 * gap was tried and merged the two dark masses into one.
 *
 * Span widths stay at the tile widths. The deck is parallax 1 with a 64 px span: it
 * is what actually tells the player the stage moved.
 */
const BACKDROP_ROOT = '/art-source/arcade/generated/backdrop-v1'

export const MARS_ARCADE_BACKDROP: MarsArcadeBackdropLayer[] = [
  { id: 'clouds', src: `${BACKDROP_ROOT}/clouds-320x104.png`, parallax: 0.1, spanWidth: 320, width: 320, height: 104, bottomRow: 132 },
  { id: 'ridge', src: `${BACKDROP_ROOT}/ridge-320x40.png`, parallax: 0.2, spanWidth: 320, width: 320, height: 40, bottomRow: 174 },
  { id: 'colony', src: `${BACKDROP_ROOT}/colony-320x62.png`, parallax: 0.42, spanWidth: 320, width: 320, height: 62, bottomRow: 181 },
  { id: 'apron', src: `${BACKDROP_ROOT}/apron-320x40.png`, parallax: 0.74, spanWidth: 320, width: 320, height: 40, bottomRow: 189 },
  { id: 'deck', src: `${BACKDROP_ROOT}/deck-64x36.png`, parallax: 1, spanWidth: 64, width: 64, height: 36, bottomRow: 224 },
]

/**
 * How far a layer slides for a given camera position, before tiling.
 *
 * Exported so the direction and the relative speed of the layers are testable
 * without reverse-engineering them out of the tile offsets.
 */
export function marsArcadeLayerShift(layer: MarsArcadeBackdropLayer, cameraX: number): number {
  return -cameraX * layer.parallax
}

/**
 * Where to stamp one layer's span, given the camera.
 *
 * Returns whole-pixel column offsets covering the view with one span of margin on
 * each side, so a shape that overhangs its own span — the colony dome starts at
 * column 294 and is 34 wide — still has its neighbour drawn and no gap opens at
 * the screen edge.
 *
 * The LEFT margin is load-bearing, and a mutation proves it. The right one is
 * slack: it could only matter for a shape overhanging its span by more than a
 * whole span, which no layer can sensibly author, and a mutation removing it is
 * correctly not caught. It is kept because one extra tile per layer per frame
 * costs nothing and symmetric margins need no reasoning to read.
 */
export function marsArcadeBackdropTiles(
  layer: MarsArcadeBackdropLayer,
  cameraX: number,
  viewWidth: number = MARS_ARCADE_VIEW.width,
): number[] {
  const shift = marsArcadeLayerShift(layer, cameraX)
  const first = Math.floor((-layer.spanWidth - shift) / layer.spanWidth)
  const last = Math.ceil((viewWidth + layer.spanWidth - shift) / layer.spanWidth)
  const offsets: number[] = []
  for (let index = first; index <= last; index += 1) {
    offsets.push(Math.round(shift + index * layer.spanWidth))
  }
  return offsets
}
