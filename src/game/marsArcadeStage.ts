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

export type MarsArcadeBackdropShapeKind = 'rect' | 'ridge' | 'dome' | 'disc' | 'mast' | 'aircraft'

export interface MarsArcadeBackdropShape {
  kind: MarsArcadeBackdropShapeKind
  /** Column within the layer's span; may overhang, the span tiles either side. */
  x: number
  /** Top row, measured down from the top of the view. */
  y: number
  width: number
  height: number
  colour: string
  /** Lit edge, window glow, beacon — whatever the kind uses as its second colour. */
  accent?: string
}

export interface MarsArcadeBackdropLayer {
  id: string
  /** 0 = pinned to the screen, 1 = locked to the stage and scrolling with it. */
  parallax: number
  /** The layer repeats every `spanWidth` columns. */
  spanWidth: number
  shapes: MarsArcadeBackdropShape[]
}

export interface MarsArcadeBand {
  /** Top row, measured down from the top of the view. */
  y: number
  height: number
  colour: string
}

/**
 * The flat sky-to-deck ramp behind everything, dusk on Mars.
 *
 * These bands are the reason the fighters read at all. The retired stage was
 * #14101a above the floor line and near-black below it, so a dark sprite sat on a
 * dark field and the silhouette — the one thing a fighting game cannot compromise
 * on — disappeared. The ramp brightens on the way down, and the brightest part of
 * it sits exactly where the fighters stand. `the stage is not a void` in the tests
 * holds that.
 *
 * Flat bands, not a gradient: this is pixel art at an integer scale and a
 * dithered or interpolated sky would crawl when the camera scrolls.
 */
export const MARS_ARCADE_BANDS: MarsArcadeBand[] = [
  // Above the fighters' heads the steps can be wide, and carry the dusk.
  { y: 0, height: 30, colour: '#1a1226' },
  { y: 30, height: 28, colour: '#2b1c36' },
  { y: 58, height: 26, colour: '#402541' },
  // Row 84 is the top of a standing fighter. From here down the steps are small,
  // so the ramp does not draw hard stripes across the characters.
  { y: 84, height: 30, colour: '#5c3347' },
  { y: 114, height: 28, colour: '#78413f' },
  { y: 142, height: 24, colour: '#94523f' },
  { y: 166, height: 10, colour: '#b26a45' },
  { y: 176, height: 12, colour: '#d68d55' },
  // Below the floor line. The lit edge first, then falling away, so the ground
  // reads as a floor seen edge-on and not as a wall behind the fighters.
  { y: 188, height: 4, colour: '#9c6149' },
  { y: 192, height: 14, colour: '#7a4a3a' },
  { y: 206, height: 18, colour: '#5e382e' },
]

/**
 * Parallax layers, far to near.
 *
 * Span widths get smaller as the layers get nearer, because a near layer has to
 * repeat often enough that its features cross the screen while the camera moves.
 * The deck is at parallax 1 with a 64 px span: it is what actually tells the
 * player the stage moved, which the old single flat floor never could.
 */
export const MARS_ARCADE_BACKDROP: MarsArcadeBackdropLayer[] = [
  {
    id: 'stars',
    parallax: 0.06,
    spanWidth: 320,
    // Nothing above row 28: the HUD lives there, and a moon behind a health bar
    // reads as a rendering fault rather than as sky.
    shapes: [
      { kind: 'disc', x: 244, y: 34, width: 9, height: 9, colour: '#c9b39a', accent: '#9c8974' },
      { kind: 'disc', x: 66, y: 56, width: 5, height: 5, colour: '#9a8a7e' },
      ...[
        [12, 40], [37, 52], [58, 36], [88, 64], [104, 44], [120, 72], [136, 34],
        [152, 60], [170, 76], [186, 46], [204, 38], [221, 68], [238, 52],
        [258, 42], [274, 70], [289, 34], [303, 62], [315, 44],
      ].map(([x, y]) => ({
        kind: 'rect' as const,
        x: x ?? 0,
        y: y ?? 0,
        width: (x ?? 0) % 4 === 2 ? 2 : 1,
        height: 1,
        colour: '#ffe9c8',
      })),
    ],
  },
  {
    id: 'ridge',
    parallax: 0.2,
    spanWidth: 320,
    // Based on the horizon glow, not on the floor: the ridge is far away, and a
    // ridge that reaches the fighters' feet reads as scenery standing next to them.
    shapes: [
      { kind: 'ridge', x: -12, y: 148, width: 96, height: 28, colour: '#3b2a3e' },
      { kind: 'ridge', x: 58, y: 138, width: 124, height: 38, colour: '#3b2a3e' },
      { kind: 'ridge', x: 150, y: 152, width: 104, height: 24, colour: '#3b2a3e' },
      { kind: 'ridge', x: 244, y: 152, width: 104, height: 24, colour: '#3b2a3e' },
    ],
  },
  {
    id: 'colony',
    parallax: 0.42,
    spanWidth: 320,
    shapes: [
      { kind: 'dome', x: 30, y: 159, width: 48, height: 24, colour: '#523446', accent: '#7e5c68' },
      { kind: 'rect', x: 40, y: 172, width: 3, height: 3, colour: '#ffd58a' },
      { kind: 'rect', x: 52, y: 170, width: 3, height: 3, colour: '#ffd58a' },
      { kind: 'rect', x: 64, y: 174, width: 3, height: 3, colour: '#ffd58a' },
      { kind: 'rect', x: 92, y: 165, width: 58, height: 18, colour: '#472e3c' },
      { kind: 'rect', x: 100, y: 170, width: 4, height: 3, colour: '#ffd58a' },
      { kind: 'rect', x: 112, y: 170, width: 4, height: 3, colour: '#ffd58a' },
      { kind: 'rect', x: 124, y: 170, width: 4, height: 3, colour: '#ffd58a' },
      { kind: 'rect', x: 136, y: 170, width: 4, height: 3, colour: '#ffd58a' },
      { kind: 'mast', x: 166, y: 141, width: 3, height: 42, colour: '#654556', accent: '#ff9a52' },
      // The DC-9 parked on the far pad. The tribute aircraft, at rest, watching.
      { kind: 'aircraft', x: 190, y: 147, width: 94, height: 36, colour: '#5f4a66', accent: '#9d8aa6' },
      { kind: 'dome', x: 294, y: 169, width: 34, height: 14, colour: '#4d3142', accent: '#75535f' },
    ],
  },
  {
    id: 'pad',
    parallax: 0.74,
    spanWidth: 160,
    // Only five rows tall: the horizon glow above it is the brightest thing on the
    // stage and the berm used to cover all of it.
    shapes: [
      { kind: 'rect', x: 0, y: 183, width: 160, height: 5, colour: '#6a4034' },
      { kind: 'rect', x: 18, y: 180, width: 2, height: 2, colour: '#ff9a52' },
      { kind: 'rect', x: 76, y: 180, width: 2, height: 2, colour: '#ff9a52' },
      { kind: 'rect', x: 134, y: 180, width: 2, height: 2, colour: '#ff9a52' },
    ],
  },
  {
    id: 'deck',
    parallax: 1,
    spanWidth: 64,
    // Detail stays short and mostly horizontal. Full-height vertical seams turned
    // the ground into a brick wall standing behind the fighters.
    shapes: [
      { kind: 'rect', x: 0, y: 188, width: 2, height: 9, colour: '#583229' },
      { kind: 'rect', x: 4, y: 191, width: 26, height: 1, colour: '#b4795a' },
      { kind: 'rect', x: 38, y: 190, width: 20, height: 1, colour: '#b4795a' },
      { kind: 'rect', x: 16, y: 199, width: 2, height: 2, colour: '#93604a' },
      { kind: 'rect', x: 44, y: 199, width: 2, height: 2, colour: '#93604a' },
      { kind: 'rect', x: 6, y: 209, width: 24, height: 1, colour: '#6d4034' },
      { kind: 'rect', x: 40, y: 217, width: 18, height: 1, colour: '#6d4034' },
    ],
  },
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
