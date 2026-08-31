import type { Dc9DepartureFrame } from '../game/dc9MemphisDeparture'

export type Dc9MemphisVector = readonly [number, number, number]
export type Dc9MemphisAnchorMap = ReadonlyMap<string, Dc9MemphisVector>

export const DC9_MEMPHIS_ANCHOR_GAME_IDS = Object.freeze([
  'dc9.memphis.rampStart',
  'dc9.memphis.taxiTurn',
  'dc9.memphis.holdShort',
  'dc9.memphis.runwayLineup',
  'dc9.memphis.initialClimb',
] as const)

// These knots match the pure departure frame's durable path boundaries. The last
// anchor is the end of the short memory climb, not the initial-climb checkpoint.
const PATH_KNOTS = Object.freeze([0, 0.12, 0.42, 0.52, 1] as const)
const MAX_LATERAL_OFFSET_METERS = 8
const MAX_HEADING_OFFSET_RADIANS = 0.12
const MAX_PITCH_RADIANS = 0.18
const MAX_ROLL_RADIANS = 0.12
const CLIMB_PITCH_RADIANS = 0.08

/**
 * Height of the aircraft reference (the cockpit world origin) above the
 * authored pavement, like a DC-9 riding on its gear. Without it the cockpit
 * floor sat below the ground plane and a pitched-up runway centerline dash
 * could rise through the cabin. A rigid transform preserves the perpendicular
 * distance from the rotation centre to the ground plane, so this clearance
 * keeps every environment surface out of the cockpit at any pitch or roll.
 */
export const DC9_MEMPHIS_GROUND_CLEARANCE_METERS = 2.5

interface Vector3Value {
  x: number
  y: number
  z: number
}

export interface Dc9MemphisPathSample {
  /** Blender-authored X-right, Y-forward, Z-up game-space position. */
  position: [number, number, number]
  headingRadians: number
}

export interface Dc9MemphisWorldPose {
  /** Three.js X-right, Y-up, Z-back inverse-world translation. */
  position: Vector3Value
  /** Diagnostic inverse Euler values; the quaternion is authoritative for rendering. */
  rotation: Vector3Value
  quaternion: [number, number, number, number]
  vibration: [number, number, number]
}

interface Dc9MemphisWorldPoseOptions {
  reducedMotion?: boolean
}

function finiteOr(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, finiteOr(value)))
}

function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

export function validateDc9MemphisAnchors(anchors: Dc9MemphisAnchorMap): string[] {
  const errors: string[] = []
  const keys = [...anchors.keys()]
  for (const gameId of DC9_MEMPHIS_ANCHOR_GAME_IDS) {
    const position = anchors.get(gameId)
    if (!position) {
      errors.push(gameId)
      continue
    }
    if (position.length !== 3 || position.some((value) => !Number.isFinite(value))) {
      errors.push(`DC-9 Memphis anchor ${gameId} must have three finite coordinates.`)
    }
  }
  if (
    keys.length !== DC9_MEMPHIS_ANCHOR_GAME_IDS.length
    || keys.some((key, index) => key !== DC9_MEMPHIS_ANCHOR_GAME_IDS[index])
  ) {
    errors.push(`DC-9 Memphis anchors must use the stable order: ${DC9_MEMPHIS_ANCHOR_GAME_IDS.join(', ')}.`)
  }
  return errors
}

function catmullRomCoordinate(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (
    2 * p1
    + (-p0 + p2) * t
    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
    + (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

function anchorPoints(anchors: Dc9MemphisAnchorMap): Dc9MemphisVector[] {
  const errors = validateDc9MemphisAnchors(anchors)
  if (errors.length > 0) throw new Error(errors.join(' '))
  return DC9_MEMPHIS_ANCHOR_GAME_IDS.map((gameId) => anchors.get(gameId) as Dc9MemphisVector)
}

/** Dense samples per spline segment used to measure the route's arc length. */
const CURVE_SAMPLES_PER_SEGMENT = 96

interface Dc9MemphisRouteTable {
  /** Curve parameter (segment index + local progress) of each dense sample. */
  params: number[]
  /** Cumulative metres travelled at each dense sample. */
  lengths: number[]
  /** Cumulative metres travelled at each anchor knot. */
  knotLengths: number[]
  /** Monotone metres-per-unit-progress at each knot. */
  knotSpeeds: number[]
}

const routeTables = new WeakMap<Dc9MemphisAnchorMap, Dc9MemphisRouteTable>()

/** Evaluate the authored corridor at a raw curve parameter (segment + local). */
function curvePoint(parameter: number, points: readonly Dc9MemphisVector[]): [number, number, number] {
  const segmentCount = points.length - 1
  const segment = Math.max(0, Math.min(segmentCount - 1, Math.floor(parameter)))
  const localProgress = Math.max(0, Math.min(1, parameter - segment))
  const p0 = points[Math.max(0, segment - 1)] as Dc9MemphisVector
  const p1 = points[segment] as Dc9MemphisVector
  const p2 = points[Math.min(points.length - 1, segment + 1)] as Dc9MemphisVector
  const p3 = points[Math.min(points.length - 1, segment + 2)] as Dc9MemphisVector
  return [0, 1, 2].map((axis) => catmullRomCoordinate(
    p0[axis] as number,
    p1[axis] as number,
    p2[axis] as number,
    p3[axis] as number,
    localProgress,
  )) as [number, number, number]
}

/**
 * Fritsch–Carlson slopes for the progress-to-distance curve. A weighted
 * harmonic mean of the neighbouring average speeds is always positive and
 * never overshoots them, so the route can never stall or double back.
 */
function monotoneSpeeds(knotLengths: readonly number[]): number[] {
  const count = knotLengths.length
  const spans: number[] = []
  const averages: number[] = []
  for (let index = 0; index < count - 1; index += 1) {
    const span = (PATH_KNOTS[index + 1] as number) - (PATH_KNOTS[index] as number)
    spans.push(span)
    averages.push(span > 0 ? ((knotLengths[index + 1] as number) - (knotLengths[index] as number)) / span : 0)
  }
  const speeds = new Array<number>(count).fill(0)
  speeds[0] = averages[0] as number
  speeds[count - 1] = averages[count - 2] as number
  for (let index = 1; index < count - 1; index += 1) {
    const before = averages[index - 1] as number
    const after = averages[index] as number
    if (before <= 0 || after <= 0) continue
    const weightBefore = 2 * (spans[index] as number) + (spans[index - 1] as number)
    const weightAfter = (spans[index] as number) + 2 * (spans[index - 1] as number)
    speeds[index] = (weightBefore + weightAfter) / (weightBefore / before + weightAfter / after)
  }
  return speeds
}

function routeTable(anchors: Dc9MemphisAnchorMap, points: readonly Dc9MemphisVector[]): Dc9MemphisRouteTable {
  const cached = routeTables.get(anchors)
  if (cached) return cached
  const params = [0]
  const lengths = [0]
  const knotLengths = [0]
  let previous = curvePoint(0, points)
  let travelled = 0
  for (let segment = 0; segment < points.length - 1; segment += 1) {
    for (let step = 1; step <= CURVE_SAMPLES_PER_SEGMENT; step += 1) {
      const parameter = segment + step / CURVE_SAMPLES_PER_SEGMENT
      const point = curvePoint(parameter, points)
      travelled += Math.hypot(point[0] - previous[0], point[1] - previous[1], point[2] - previous[2])
      previous = point
      params.push(parameter)
      lengths.push(travelled)
    }
    knotLengths.push(travelled)
  }
  const table: Dc9MemphisRouteTable = { params, lengths, knotLengths, knotSpeeds: monotoneSpeeds(knotLengths) }
  routeTables.set(anchors, table)
  return table
}

/**
 * Metres travelled at a normalized progress. Cubic Hermite through the anchor
 * distances: the knots stay pinned to their anchors while the speed stays
 * continuous across them, so no checkpoint boundary can step the world's pace.
 */
function distanceAtProgress(progress: number, table: Dc9MemphisRouteTable): number {
  let segment = PATH_KNOTS.length - 2
  for (let index = 0; index < PATH_KNOTS.length - 1; index += 1) {
    if (progress <= (PATH_KNOTS[index + 1] ?? 1)) {
      segment = index
      break
    }
  }
  const start = PATH_KNOTS[segment] as number
  const span = (PATH_KNOTS[segment + 1] as number) - start
  const local = span > 0 ? (progress - start) / span : 0
  const squared = local * local
  const cubed = squared * local
  return (2 * cubed - 3 * squared + 1) * (table.knotLengths[segment] as number)
    + (cubed - 2 * squared + local) * span * (table.knotSpeeds[segment] as number)
    + (-2 * cubed + 3 * squared) * (table.knotLengths[segment + 1] as number)
    + (cubed - squared) * span * (table.knotSpeeds[segment + 1] as number)
}

/** Invert the measured arc-length table back to a curve parameter. */
function curveParameterAtDistance(distance: number, table: Dc9MemphisRouteTable): number {
  const last = table.lengths.length - 1
  if (distance <= 0) return table.params[0] as number
  if (distance >= (table.lengths[last] as number)) return table.params[last] as number
  let low = 0
  let high = last
  while (high - low > 1) {
    const middle = (low + high) >> 1
    if ((table.lengths[middle] as number) <= distance) low = middle
    else high = middle
  }
  const span = (table.lengths[high] as number) - (table.lengths[low] as number)
  const fraction = span > 0 ? (distance - (table.lengths[low] as number)) / span : 0
  return (table.params[low] as number)
    + ((table.params[high] as number) - (table.params[low] as number)) * fraction
}

function samplePosition(
  progress: number,
  points: readonly Dc9MemphisVector[],
  table: Dc9MemphisRouteTable,
): [number, number, number] {
  const bounded = clamp01(progress)
  const exactKnot = PATH_KNOTS.indexOf(bounded as (typeof PATH_KNOTS)[number])
  if (exactKnot >= 0) return [...points[exactKnot] as Dc9MemphisVector]
  return curvePoint(curveParameterAtDistance(distanceAtProgress(bounded, table), table), points)
}

/**
 * Sample the authored five-anchor corridor without importing Three.js.
 *
 * Progress advances by distance travelled, not by knot fraction: the segments
 * are very unevenly long (105 m of ramp against 468 m of runway), so a knot
 * parameterization made the world lurch to a different speed at every
 * checkpoint while the player held one lever position.
 */
export function sampleDc9MemphisPath(progress: number, anchors: Dc9MemphisAnchorMap): Dc9MemphisPathSample {
  const points = anchorPoints(anchors)
  const table = routeTable(anchors, points)
  const bounded = clamp01(progress)
  const position = samplePosition(bounded, points, table)
  const epsilon = 0.0001
  const before = samplePosition(Math.max(0, bounded - epsilon), points, table)
  const after = samplePosition(Math.min(1, bounded + epsilon), points, table)
  const deltaX = after[0] - before[0]
  const deltaY = after[1] - before[1]
  const headingRadians = Math.atan2(-deltaX, deltaY)
  return { position, headingRadians: finiteOr(headingRadians) }
}

type QuaternionTuple = [number, number, number, number]

function multiplyQuaternion(left: QuaternionTuple, right: QuaternionTuple): QuaternionTuple {
  const [lx, ly, lz, lw] = left
  const [rx, ry, rz, rw] = right
  return [
    lw * rx + lx * rw + ly * rz - lz * ry,
    lw * ry - lx * rz + ly * rw + lz * rx,
    lw * rz + lx * ry - ly * rx + lz * rw,
    lw * rw - lx * rx - ly * ry - lz * rz,
  ]
}

function axisQuaternion(axis: 'x' | 'y' | 'z', radians: number): QuaternionTuple {
  const half = radians / 2
  const sine = Math.sin(half)
  if (axis === 'x') return [sine, 0, 0, Math.cos(half)]
  if (axis === 'y') return [0, sine, 0, Math.cos(half)]
  return [0, 0, sine, Math.cos(half)]
}

function rotateVector(
  vector: readonly [number, number, number],
  quaternion: QuaternionTuple,
): [number, number, number] {
  const [vx, vy, vz] = vector
  const [qx, qy, qz, qw] = quaternion
  const ix = qw * vx + qy * vz - qz * vy
  const iy = qw * vy + qz * vx - qx * vz
  const iz = qw * vz + qx * vy - qy * vx
  const iw = -qx * vx - qy * vy - qz * vz
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ]
}

function dc9MemphisVibration(frame: Dc9DepartureFrame, reducedMotion: boolean): [number, number, number] {
  if (
    reducedMotion
    || frame.safeHold
    || (frame.beat !== 'takeoffRoll' && frame.beat !== 'rotation')
  ) return [0, 0, 0]
  const energy = clamp01(frame.energy)
  const phase = clamp01(frame.pathProgress) * 173
  const amplitude = energy * 0.018
  return [
    Math.sin(phase * 1.3) * amplitude * 0.45,
    Math.sin(phase * 2.1) * amplitude,
    Math.cos(phase * 1.7) * amplitude * 0.35,
  ]
}

/**
 * Convert the pure aircraft frame into the inverse transform applied to one Memphis
 * environment root. The cockpit and authored first-officer camera never move.
 */
export function dc9MemphisWorldPose(
  frame: Dc9DepartureFrame,
  anchors: Dc9MemphisAnchorMap,
  options: Dc9MemphisWorldPoseOptions = {},
): Dc9MemphisWorldPose {
  const path = sampleDc9MemphisPath(frame.pathProgress, anchors)
  const altitudeProgress = clamp01(frame.altitudeProgress)
  const lateralError = clamp(frame.lateralError, -1, 1)
  const headingError = clamp(frame.headingError, -1, 1)
  const pitchInput = clamp(frame.pitch, -1, 1)
  const rollInput = clamp(frame.roll, -1, 1)
  const heading = path.headingRadians + headingError * MAX_HEADING_OFFSET_RADIANS
  const forwardX = -Math.sin(path.headingRadians)
  const forwardY = Math.cos(path.headingRadians)
  const rightX = forwardY
  const rightY = -forwardX
  const lateralOffset = lateralError * MAX_LATERAL_OFFSET_METERS
  const aircraftX = path.position[0] + rightX * lateralOffset
  const aircraftForward = path.position[1] + rightY * lateralOffset
  const aircraftAltitude = path.position[2] * altitudeProgress + DC9_MEMPHIS_GROUND_CLEARANCE_METERS
  const pitch = clamp(
    pitchInput * MAX_PITCH_RADIANS + altitudeProgress * CLIMB_PITCH_RADIANS,
    -MAX_PITCH_RADIANS,
    MAX_PITCH_RADIANS,
  )
  const roll = rollInput * MAX_ROLL_RADIANS

  const aircraftQuaternion = multiplyQuaternion(
    multiplyQuaternion(axisQuaternion('y', heading), axisQuaternion('x', pitch)),
    axisQuaternion('z', roll),
  )
  const inverseQuaternion: QuaternionTuple = [
    -aircraftQuaternion[0],
    -aircraftQuaternion[1],
    -aircraftQuaternion[2],
    aircraftQuaternion[3],
  ]
  // Blender's X-right/Y-forward/Z-up route becomes X-right/Y-up/Z-back in glTF, so the
  // sampled aircraft point is p = [x, altitude, -forward]. The fixed-cockpit world root
  // must satisfy qInverse * p + t = 0. Consequently t is -R^-1 p, not merely -p; this
  // remains exact through taxi turns and through simultaneous heading, pitch, and roll.
  const inversePosition = rotateVector(
    [-aircraftX, -aircraftAltitude, aircraftForward],
    inverseQuaternion,
  )
  const vibration = dc9MemphisVibration(frame, options.reducedMotion === true)

  return {
    position: {
      x: inversePosition[0] + vibration[0],
      y: inversePosition[1] + vibration[1],
      z: inversePosition[2] + vibration[2],
    },
    rotation: { x: -pitch, y: -heading, z: -roll },
    quaternion: inverseQuaternion,
    vibration,
  }
}
