import {
  DC9_MEMPHIS_PATH_KNOTS,
  sampleDc9MemphisPath,
  type Dc9MemphisAnchorMap,
} from './dc9MemphisVisuals'

/**
 * Painted route markings for the Memphis memory, derived at runtime from the same
 * five anchors and path sampler that drive the world pose. The shipped GLB paints
 * only the runway centreline dashes; the ramp lead-out, the taxi curve and the
 * hold-short boundary that the panel copy and the rules refer to were never drawn.
 * Deriving them here — rather than authoring them in Blender — guarantees the paint
 * is the exact line `lateralError` is scored against, whatever the sampler's
 * parameterization does.
 *
 * Fictional and non-operational: no identifiers, signage text or procedure. The
 * hold-short marking borrows the familiar two-solid/two-dashed rhythm as a memory
 * cue, and two low posts beyond its ends give the hold a read from far enough away
 * that flat paint is a sliver from the seat.
 *
 * Everything is returned as indexed triangle lists in Three.js space (X-right,
 * Y-up, Z-back) so the module stays free of Three.js and fully unit-testable.
 */

export interface Dc9MemphisMarkingGeometry {
  /** Full-precision XYZ triples; the renderer packs them into a Float32 attribute. */
  positions: readonly number[]
  indices: readonly number[]
}

export interface Dc9MemphisRouteMarkings {
  /** Continuous line from ramp release to the runway lineup point. */
  taxiGuidance: Dc9MemphisMarkingGeometry
  /** Two solid and two dashed bars across the route, first solid edge on the hold anchor. */
  holdShortBars: Dc9MemphisMarkingGeometry
  /** Two low posts just beyond the bar ends. */
  holdShortPosts: Dc9MemphisMarkingGeometry
}

/** Height of the paint above the pavement top; the shipped runway dashes sit at 3 cm too. */
export const DC9_MEMPHIS_MARKING_HEIGHT_METERS = 0.03
export const DC9_MEMPHIS_TAXI_LINE_WIDTH_METERS = 1.2
/** About one sample per metre over the ~276 m guided ground route. */
export const DC9_MEMPHIS_TAXI_LINE_SAMPLES = 280
export const DC9_MEMPHIS_HOLD_BAR_SPAN_METERS = 30
export const DC9_MEMPHIS_HOLD_BAR_THICKNESS_METERS = 1.2
export const DC9_MEMPHIS_HOLD_BAR_GAP_METERS = 1.0
export const DC9_MEMPHIS_HOLD_DASH_LENGTH_METERS = 1.8
export const DC9_MEMPHIS_HOLD_DASH_GAP_METERS = 1.2
export const DC9_MEMPHIS_HOLD_POST_HEIGHT_METERS = 1.6
export const DC9_MEMPHIS_HOLD_POST_WIDTH_METERS = 0.4
/** Clear space between a bar end and its post. */
export const DC9_MEMPHIS_HOLD_POST_SETBACK_METERS = 1.5

type GamePoint = readonly [x: number, forward: number, up: number]

/** Authored X-right/Y-forward/Z-up becomes Three X-right/Y-up/Z-back, as glTF does. */
function toThree([x, forward, up]: GamePoint): [number, number, number] {
  return [x, up, -forward]
}

class TriangleListBuilder {
  private readonly positions: number[] = []
  private readonly indices: number[] = []

  vertex(point: GamePoint): number {
    this.positions.push(...toThree(point))
    return this.positions.length / 3 - 1
  }

  /**
   * One triangle wound so its normal points along `outward`; the caller never has
   * to reason about winding in a frame that flips an axis.
   */
  triangle(a: number, b: number, c: number, outward: GamePoint): void {
    const p = this.positions
    const ab = [p[b * 3]! - p[a * 3]!, p[b * 3 + 1]! - p[a * 3 + 1]!, p[b * 3 + 2]! - p[a * 3 + 2]!]
    const ac = [p[c * 3]! - p[a * 3]!, p[c * 3 + 1]! - p[a * 3 + 1]!, p[c * 3 + 2]! - p[a * 3 + 2]!]
    const normal = [
      ab[1]! * ac[2]! - ab[2]! * ac[1]!,
      ab[2]! * ac[0]! - ab[0]! * ac[2]!,
      ab[0]! * ac[1]! - ab[1]! * ac[0]!,
    ]
    const [ox, oy, oz] = toThree(outward)
    const facing = normal[0]! * ox + normal[1]! * oy + normal[2]! * oz
    if (facing >= 0) this.indices.push(a, b, c)
    else this.indices.push(a, c, b)
  }

  /** Four corners in ring order. */
  quad(corners: readonly [GamePoint, GamePoint, GamePoint, GamePoint], outward: GamePoint): void {
    const [a, b, c, d] = corners.map((corner) => this.vertex(corner)) as [number, number, number, number]
    this.triangle(a, b, c, outward)
    this.triangle(a, c, d, outward)
  }

  build(): Dc9MemphisMarkingGeometry {
    return { positions: [...this.positions], indices: [...this.indices] }
  }
}

const UP: GamePoint = [0, 0, 1]

interface RouteFrame {
  origin: readonly [number, number]
  forward: readonly [number, number]
  right: readonly [number, number]
}

function routeFrame(progress: number, anchors: Dc9MemphisAnchorMap): RouteFrame {
  const sample = sampleDc9MemphisPath(progress, anchors)
  const forward = [-Math.sin(sample.headingRadians), Math.cos(sample.headingRadians)] as const
  return {
    origin: [sample.position[0], sample.position[1]],
    forward,
    right: [forward[1], -forward[0]],
  }
}

/** A ground point `along` the route and `across` it from the frame origin, at the paint height. */
function groundPoint(frame: RouteFrame, along: number, across: number, up = DC9_MEMPHIS_MARKING_HEIGHT_METERS): GamePoint {
  return [
    frame.origin[0] + frame.forward[0] * along + frame.right[0] * across,
    frame.origin[1] + frame.forward[1] * along + frame.right[1] * across,
    up,
  ]
}

function taxiGuidance(anchors: Dc9MemphisAnchorMap): Dc9MemphisMarkingGeometry {
  const builder = new TriangleListBuilder()
  const halfWidth = DC9_MEMPHIS_TAXI_LINE_WIDTH_METERS / 2
  const endProgress = DC9_MEMPHIS_PATH_KNOTS[3]
  let previousLeft = -1
  let previousRight = -1
  for (let sample = 0; sample <= DC9_MEMPHIS_TAXI_LINE_SAMPLES; sample += 1) {
    const progress = endProgress * sample / DC9_MEMPHIS_TAXI_LINE_SAMPLES
    // The sampled route height is not the ground: between hold short and lineup the
    // spline dips below the pavement (its trailing control point is the 110 m climb
    // anchor). Paint lives on the pavement, so only the ground track is used.
    const frame = routeFrame(progress, anchors)
    const left = builder.vertex(groundPoint(frame, 0, -halfWidth))
    const right = builder.vertex(groundPoint(frame, 0, halfWidth))
    if (sample > 0) {
      builder.triangle(previousLeft, previousRight, right, UP)
      builder.triangle(previousLeft, right, left, UP)
    }
    previousLeft = left
    previousRight = right
  }
  return builder.build()
}

function holdShortBars(anchors: Dc9MemphisAnchorMap): Dc9MemphisMarkingGeometry {
  const builder = new TriangleListBuilder()
  const frame = routeFrame(DC9_MEMPHIS_PATH_KNOTS[2], anchors)
  const halfSpan = DC9_MEMPHIS_HOLD_BAR_SPAN_METERS / 2
  const pitch = DC9_MEMPHIS_HOLD_BAR_THICKNESS_METERS + DC9_MEMPHIS_HOLD_BAR_GAP_METERS
  const bar = (near: number, from: number, to: number) => {
    const far = near + DC9_MEMPHIS_HOLD_BAR_THICKNESS_METERS
    builder.quad([
      groundPoint(frame, near, from),
      groundPoint(frame, near, to),
      groundPoint(frame, far, to),
      groundPoint(frame, far, from),
    ], UP)
  }
  // Solid pair nearest the aircraft: the first near edge is the rules' boundary.
  for (const band of [0, 1]) bar(band * pitch, -halfSpan, halfSpan)
  // Dashed pair toward the runway.
  for (const band of [2, 3]) {
    const near = band * pitch
    const dashPitch = DC9_MEMPHIS_HOLD_DASH_LENGTH_METERS + DC9_MEMPHIS_HOLD_DASH_GAP_METERS
    for (let from = -halfSpan; from < halfSpan; from += dashPitch) {
      bar(near, from, Math.min(halfSpan, from + DC9_MEMPHIS_HOLD_DASH_LENGTH_METERS))
    }
  }
  return builder.build()
}

function holdShortPosts(anchors: Dc9MemphisAnchorMap): Dc9MemphisMarkingGeometry {
  const builder = new TriangleListBuilder()
  const frame = routeFrame(DC9_MEMPHIS_PATH_KNOTS[2], anchors)
  const width = DC9_MEMPHIS_HOLD_POST_WIDTH_METERS
  const height = DC9_MEMPHIS_HOLD_POST_HEIGHT_METERS
  const centreAcross = DC9_MEMPHIS_HOLD_BAR_SPAN_METERS / 2 + DC9_MEMPHIS_HOLD_POST_SETBACK_METERS + width / 2
  for (const side of [-1, 1]) {
    const across = side * centreAcross
    const corner = (dAlong: number, dAcross: number, up: number) => groundPoint(frame, dAlong, across + dAcross, up)
    const along = [0, width] as const
    const acrossEdges = [-width / 2, width / 2] as const
    // Top.
    builder.quad([
      corner(along[0], acrossEdges[0], height),
      corner(along[1], acrossEdges[0], height),
      corner(along[1], acrossEdges[1], height),
      corner(along[0], acrossEdges[1], height),
    ], UP)
    // Four sides, each facing away from the post's own axis.
    const outwardAlong = (sign: number): GamePoint => [frame.forward[0] * sign, frame.forward[1] * sign, 0]
    const outwardAcross = (sign: number): GamePoint => [frame.right[0] * sign, frame.right[1] * sign, 0]
    for (const [edgeIndex, sign] of [[0, -1], [1, 1]] as const) {
      const a = along[edgeIndex]
      builder.quad([
        corner(a, acrossEdges[0], 0),
        corner(a, acrossEdges[1], 0),
        corner(a, acrossEdges[1], height),
        corner(a, acrossEdges[0], height),
      ], outwardAlong(sign))
      const x = acrossEdges[edgeIndex]
      builder.quad([
        corner(along[0], x, 0),
        corner(along[1], x, 0),
        corner(along[1], x, height),
        corner(along[0], x, height),
      ], outwardAcross(sign))
    }
  }
  return builder.build()
}

/** Build every runtime-authored marking from the validated anchor map. */
export function dc9MemphisRouteMarkings(anchors: Dc9MemphisAnchorMap): Dc9MemphisRouteMarkings {
  return {
    taxiGuidance: taxiGuidance(anchors),
    holdShortBars: holdShortBars(anchors),
    holdShortPosts: holdShortPosts(anchors),
  }
}
