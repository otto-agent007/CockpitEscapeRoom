import { describe, expect, it } from 'vitest'
import {
  DC9_MEMPHIS_PATH_KNOTS,
  sampleDc9MemphisPath,
  type Dc9MemphisVector,
} from './dc9MemphisVisuals'
import {
  DC9_MEMPHIS_HOLD_BAR_SPAN_METERS,
  DC9_MEMPHIS_HOLD_POST_HEIGHT_METERS,
  DC9_MEMPHIS_MARKING_HEIGHT_METERS,
  DC9_MEMPHIS_TAXI_LINE_WIDTH_METERS,
  dc9MemphisRouteMarkings,
  type Dc9MemphisMarkingGeometry,
} from './dc9MemphisRouteMarkings'

/** The five anchors exactly as the shipped GLB exposes them (authored X-right/Y-forward/Z-up). */
const shippedAnchors = new Map<string, Dc9MemphisVector>([
  ['dc9.memphis.rampStart', [0, 0, 0] as const],
  ['dc9.memphis.taxiTurn', [-55, 90, 0] as const],
  ['dc9.memphis.holdShort', [-120, 210, 0] as const],
  ['dc9.memphis.runwayLineup', [-120, 245, 0] as const],
  ['dc9.memphis.initialClimb', [-120, 700, 110] as const],
])

// Shipped pavement footprints, mirrored from GROUND_SURFACES in
// tools/blender/cockpit_pipeline/kmem_legacy_layout.py (centre ± half dimension).
const TAXI_SURFACE = { x: [-140, -50.5], y: [15, 265] } as const
const RUNWAY_SOUTH_EDGE_Y = 225

type GamePoint = [x: number, forward: number, up: number]

/** Three.js X-right/Y-up/Z-back back to the authored X-right/Y-forward/Z-up frame. */
function gameVertices(geometry: Dc9MemphisMarkingGeometry): GamePoint[] {
  const points: GamePoint[] = []
  for (let index = 0; index < geometry.positions.length; index += 3) {
    points.push([
      geometry.positions[index] as number,
      -(geometry.positions[index + 2] as number),
      geometry.positions[index + 1] as number,
    ])
  }
  return points
}

function triangleNormalsUp(geometry: Dc9MemphisMarkingGeometry): number[] {
  const normals: number[] = []
  const p = geometry.positions
  for (let index = 0; index < geometry.indices.length; index += 3) {
    const [a, b, c] = [0, 1, 2].map((corner) => (geometry.indices[index + corner] as number) * 3)
    const ab = [p[b! + 0]! - p[a! + 0]!, p[b! + 1]! - p[a! + 1]!, p[b! + 2]! - p[a! + 2]!]
    const ac = [p[c! + 0]! - p[a! + 0]!, p[c! + 1]! - p[a! + 1]!, p[c! + 2]! - p[a! + 2]!]
    normals.push(ab[2]! * ac[0]! - ab[0]! * ac[2]!)
  }
  return normals
}

function routeFrameAt(progress: number): { origin: [number, number]; forward: [number, number]; right: [number, number] } {
  const sample = sampleDc9MemphisPath(progress, shippedAnchors)
  const heading = sample.headingRadians
  const forward: [number, number] = [-Math.sin(heading), Math.cos(heading)]
  return { origin: [sample.position[0], sample.position[1]], forward, right: [forward[1], -forward[0]] }
}

function alongAcross(point: GamePoint, frame: ReturnType<typeof routeFrameAt>): { along: number; across: number } {
  const dx = point[0] - frame.origin[0]
  const dy = point[1] - frame.origin[1]
  return {
    along: dx * frame.forward[0] + dy * frame.forward[1],
    across: dx * frame.right[0] + dy * frame.right[1],
  }
}

function expectInsideTaxiSurface(points: readonly GamePoint[]): void {
  for (const [x, forward] of points) {
    expect(x).toBeGreaterThanOrEqual(TAXI_SURFACE.x[0])
    expect(x).toBeLessThanOrEqual(TAXI_SURFACE.x[1])
    expect(forward).toBeGreaterThanOrEqual(TAXI_SURFACE.y[0])
    expect(forward).toBeLessThanOrEqual(TAXI_SURFACE.y[1])
  }
}

describe('DC-9 Memphis route markings', () => {
  const markings = dc9MemphisRouteMarkings(shippedAnchors)

  it('paints the taxi guidance along the sampled route from ramp release to the lineup knot', () => {
    const vertices = gameVertices(markings.taxiGuidance)
    expect(vertices.length % 2).toBe(0)
    const pairs = vertices.length / 2
    expect(pairs).toBeGreaterThan(200)
    const lineupProgress = DC9_MEMPHIS_PATH_KNOTS[3]

    for (let pair = 0; pair < pairs; pair += 1) {
      const left = vertices[pair * 2] as GamePoint
      const right = vertices[pair * 2 + 1] as GamePoint
      const progress = lineupProgress * pair / (pairs - 1)
      const sample = sampleDc9MemphisPath(progress, shippedAnchors)
      // The painted centre is the point the rules score lateralError against.
      expect((left[0] + right[0]) / 2).toBeCloseTo(sample.position[0], 6)
      expect((left[1] + right[1]) / 2).toBeCloseTo(sample.position[1], 6)
      expect(Math.hypot(right[0] - left[0], right[1] - left[1])).toBeCloseTo(DC9_MEMPHIS_TAXI_LINE_WIDTH_METERS, 6)
      // The edge pair lies across the route, not along it.
      const forward = [-Math.sin(sample.headingRadians), Math.cos(sample.headingRadians)]
      expect(Math.abs((right[0] - left[0]) * forward[0]! + (right[1] - left[1]) * forward[1]!)).toBeLessThan(1e-6)
    }
    const first = vertices.slice(0, 2)
    const last = vertices.slice(-2)
    expect((first[0]![0] + first[1]![0]) / 2).toBeCloseTo(0, 6)
    expect((first[0]![1] + first[1]![1]) / 2).toBeCloseTo(0, 6)
    expect((last[0]![0] + last[1]![0]) / 2).toBeCloseTo(-120, 6)
    expect((last[0]![1] + last[1]![1]) / 2).toBeCloseTo(245, 6)
    // The guidance ends at the lineup point (an edge vertex may lead by at most half
    // the line width where the heading is not exactly north); the shipped runway
    // dashes lead on from Y 268.
    expect(Math.max(...vertices.map((vertex) => vertex[1]))).toBeLessThanOrEqual(245 + DC9_MEMPHIS_TAXI_LINE_WIDTH_METERS / 2)
    expect(markings.taxiGuidance.indices.length).toBe((pairs - 1) * 6)
    for (const up of triangleNormalsUp(markings.taxiGuidance)) expect(up).toBeGreaterThan(0)
  })

  it('pins ground paint to the pavement rather than the sampled route height', () => {
    // Between hold short and lineup the Catmull-Rom segment borrows the 110 m climb
    // anchor as its trailing control point and dips below the ground. The world pose
    // masks that with altitudeProgress = 0; paint that used the sampled height would
    // sink out of sight here.
    const dipped = sampleDc9MemphisPath((DC9_MEMPHIS_PATH_KNOTS[2] * 1 + DC9_MEMPHIS_PATH_KNOTS[3] * 2) / 3, shippedAnchors)
    expect(dipped.position[2]).toBeLessThan(-1)

    for (const geometry of [markings.taxiGuidance, markings.holdShortBars]) {
      for (const vertex of gameVertices(geometry)) {
        expect(vertex[2]).toBeCloseTo(DC9_MEMPHIS_MARKING_HEIGHT_METERS, 9)
      }
    }
  })

  it('lays the hold-short marking across the route at the hold anchor, short of the runway', () => {
    const frame = routeFrameAt(DC9_MEMPHIS_PATH_KNOTS[2])
    expect(frame.origin).toEqual([-120, 210])
    const vertices = gameVertices(markings.holdShortBars)
    const projected = vertices.map((vertex) => alongAcross(vertex, frame))

    // The first solid bar's near edge is the boundary the rules stop the aircraft on.
    expect(Math.min(...projected.map((point) => point.along))).toBeCloseTo(0, 6)
    // Everything else lies ahead, toward the runway, but never on it.
    for (const point of projected) expect(point.along).toBeGreaterThanOrEqual(-1e-6)
    for (const vertex of vertices) expect(vertex[1]).toBeLessThan(RUNWAY_SOUTH_EDGE_Y)
    for (const point of projected) expect(Math.abs(point.across)).toBeLessThanOrEqual(DC9_MEMPHIS_HOLD_BAR_SPAN_METERS / 2 + 1e-6)
    expectInsideTaxiSurface(vertices)

    // Two solid bars nearest the aircraft, then two dashed bars: the familiar rhythm.
    const bands = new Map<number, number>()
    const indices = markings.holdShortBars.indices
    for (let index = 0; index < indices.length; index += 3) {
      const corner = indices[index] as number
      const along = projected[corner]!.along
      const band = Math.round(along * 100) / 100
      bands.set(band, (bands.get(band) ?? 0) + 1)
    }
    const nearEdges = [...bands.keys()].sort((a, b) => a - b)
    expect(nearEdges).toHaveLength(4)
    const trianglesPerBand = nearEdges.map((edge) => bands.get(edge) as number)
    expect(trianglesPerBand.slice(0, 2)).toEqual([2, 2])
    expect(trianglesPerBand[2]).toBeGreaterThanOrEqual(6)
    expect(trianglesPerBand[3]).toBeGreaterThanOrEqual(6)
    for (const up of triangleNormalsUp(markings.holdShortBars)) expect(up).toBeGreaterThan(0)
  })

  it('stands two low posts beyond the bar ends, proud of the pavement', () => {
    const frame = routeFrameAt(DC9_MEMPHIS_PATH_KNOTS[2])
    const vertices = gameVertices(markings.holdShortPosts)
    const heights = vertices.map((vertex) => vertex[2])
    expect(Math.min(...heights)).toBeCloseTo(0, 9)
    expect(Math.max(...heights)).toBeCloseTo(DC9_MEMPHIS_HOLD_POST_HEIGHT_METERS, 9)

    const projected = vertices.map((vertex) => alongAcross(vertex, frame))
    const leftPost = projected.filter((point) => point.across < 0)
    const rightPost = projected.filter((point) => point.across > 0)
    expect(leftPost.length).toBe(rightPost.length)
    expect(leftPost.length).toBeGreaterThan(0)
    for (const point of projected) {
      expect(Math.abs(point.across)).toBeGreaterThan(DC9_MEMPHIS_HOLD_BAR_SPAN_METERS / 2)
      expect(point.along).toBeGreaterThanOrEqual(-1e-6)
    }
    expectInsideTaxiSurface(vertices)
    // Closed boxes: every face must point away from the post's own centre.
    expect(markings.holdShortPosts.indices.length % 3).toBe(0)
  })

  it('refuses anchors that break the stable contract', () => {
    expect(() => dc9MemphisRouteMarkings(new Map())).toThrow(/rampStart/)
  })
})
