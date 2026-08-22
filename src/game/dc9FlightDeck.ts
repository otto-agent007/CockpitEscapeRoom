/**
 * Measured animation contract for the parked DC-9-32 first-officer flight deck.
 *
 * Every pivot, axis and key table below was extracted from the cleared donor OBJ8
 * animation channels with `tools/blender/cockpit_pipeline/xplane_obj8_convert.py` and
 * converted into the deployed glTF space of `public/models/dc9-cockpit.glb`.
 *
 * The donor reports pivots in Blender space `(x, -z, y)` and axes in X-Plane space.
 * Measured against the shipped GLB, glTF equals raw X-Plane space, so a donor pivot
 * `(px, py, pz)` converts to glTF as `(px, pz, -py)` and a donor axis needs no
 * conversion at all. `tools/assets/dc9-flight-deck-contract.mjs` re-checks that against
 * the real asset, including the assumption that no parent in any of these chains
 * carries a rotation or a scale.
 *
 * The GLB geometry is baked at the parked pose in
 * `art-source/blender/dc9_parked_neutral_pose.json`, where every dataref used here is
 * zero. Runtime motion is therefore applied *relative* to the value in `baked`, so an
 * untouched cockpit sits at exactly zero additional rotation.
 */

export type Vec3 = readonly [number, number, number]

/** `[input, output]` where output is degrees for rotation and metres for translation. */
export type Dc9JointKey = readonly [number, number]

/** Continuous axes the player drives during the flight-control check. */
export type Dc9ControlAxisId = 'pitch' | 'roll' | 'thrust' | 'rudder'

/** Values the instrument needles read during a self-test sweep. */
export type Dc9InstrumentChannelId =
  | 'airspeedKt'
  | 'attitudeRollDeg'
  | 'attitudePitchDeg'
  | 'altitudeFt'
  | 'headingDeg'
  | 'verticalSpeedFpm'
  | 'eprRatio'

export type Dc9DriveId = Dc9ControlAxisId | Dc9InstrumentChannelId

export interface Dc9Joint {
  readonly id: string
  readonly kind: 'rotate' | 'translate'
  /** Which driven value feeds this joint. */
  readonly drive: Dc9DriveId
  /** glTF-space pivot. Ignored by translation joints. */
  readonly pivot: Vec3
  /** glTF-space axis; unit length for rotation, direction for translation. */
  readonly axis: Vec3
  /** Piecewise-linear key table, ascending by input. */
  readonly keys: readonly Dc9JointKey[]
  /**
   * How the donor treats values outside the table. A two-key `ANIM_rotate` is a linear
   * map that keeps going -- an attitude ball authored as `-1 deg -> -1 deg, 1 deg -> 1
   * deg` must still roll twenty degrees when asked. A multi-key `ANIM_rotate_begin`
   * table is a calibrated dial face, and holds against its stop.
   */
  readonly range: 'extrapolate' | 'clamp'
  /** Drive value already baked into the GLB geometry. */
  readonly baked: number
}

/** A GLB mesh node and the joints that move it, ordered outermost first. */
export interface Dc9NodeBinding {
  readonly node: string
  readonly joints: readonly string[]
}

const YOKE_PITCH_KEYS: readonly Dc9JointKey[] = [[-1, -10], [1, 15]]
const YOKE_ROLL_KEYS: readonly Dc9JointKey[] = [[-1, 90], [1, -90]]
const THRUST_KEYS: readonly Dc9JointKey[] = [[0, 0], [1, -55]]
const PEDAL_FORWARD_KEYS: readonly Dc9JointKey[] = [[-1, 0], [1, 0.160003]]
const PEDAL_REVERSED_KEYS: readonly Dc9JointKey[] = [[-1, 0.160003], [1, 0]]

const PITCH_AXIS: Vec3 = [1, 0, 0]
const COLUMN_AXIS: Vec3 = [0, 0, 1]

export const DC9_FLIGHT_CONTROL_JOINTS: readonly Dc9Joint[] = [
  {
    id: 'foYokePitch',
    kind: 'rotate',
    drive: 'pitch',
    pivot: [0.59298, -0.289439, 2.56786],
    axis: PITCH_AXIS,
    keys: YOKE_PITCH_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'foYokeRoll',
    kind: 'rotate',
    drive: 'roll',
    pivot: [0.497686, 0.31607144644914453, 2.605477798526198],
    axis: COLUMN_AXIS,
    keys: YOKE_ROLL_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
  // The captain's column is mechanically linked to the first officer's, so it tracks
  // the same axes even though the player is in the right seat.
  {
    id: 'captainYokePitch',
    kind: 'rotate',
    drive: 'pitch',
    pivot: [-0.579981, -0.289439, 2.56786],
    axis: PITCH_AXIS,
    keys: YOKE_PITCH_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'captainYokeRoll',
    kind: 'rotate',
    drive: 'roll',
    pivot: [-0.484682, 0.31607144644914453, 2.605477798526198],
    axis: COLUMN_AXIS,
    keys: YOKE_ROLL_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'thrustLeverLeft',
    kind: 'rotate',
    drive: 'thrust',
    pivot: [-0.026399, 0.137043, 2.67068],
    axis: PITCH_AXIS,
    keys: THRUST_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'thrustLeverRight',
    kind: 'rotate',
    drive: 'thrust',
    pivot: [-0.021248, 0.137043, 2.67068],
    axis: PITCH_AXIS,
    keys: THRUST_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'pedalFoLeft',
    kind: 'translate',
    drive: 'rudder',
    pivot: [0, 0, 0],
    axis: COLUMN_AXIS,
    keys: PEDAL_FORWARD_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'pedalFoRight',
    kind: 'translate',
    drive: 'rudder',
    pivot: [0, 0, 0],
    axis: COLUMN_AXIS,
    keys: PEDAL_REVERSED_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'pedalCaptainLeft',
    kind: 'translate',
    drive: 'rudder',
    pivot: [0, 0, 0],
    axis: COLUMN_AXIS,
    keys: PEDAL_FORWARD_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'pedalCaptainRight',
    kind: 'translate',
    drive: 'rudder',
    pivot: [0, 0, 0],
    axis: COLUMN_AXIS,
    keys: PEDAL_REVERSED_KEYS,
    range: 'extrapolate',
    baked: 0,
  },
] as const

export const DC9_FLIGHT_CONTROL_BINDINGS: readonly Dc9NodeBinding[] = [
  { node: 'OBJ8_DC9VC2_RANGE_014', joints: ['foYokePitch'] },
  { node: 'OBJ8_DC9VC2_RANGE_015', joints: ['foYokePitch', 'foYokeRoll'] },
  { node: 'OBJ8_DC9VC2_RANGE_012', joints: ['captainYokePitch'] },
  { node: 'OBJ8_DC9VC2_RANGE_013', joints: ['captainYokePitch', 'captainYokeRoll'] },
  { node: 'OBJ8_DC9VC2_RANGE_009', joints: ['thrustLeverLeft'] },
  { node: 'OBJ8_DC9VC2_RANGE_010', joints: ['thrustLeverLeft'] },
  { node: 'OBJ8_DC9VC2_RANGE_006', joints: ['thrustLeverRight'] },
  { node: 'OBJ8_DC9VC2_RANGE_007', joints: ['thrustLeverRight'] },
  { node: 'OBJ8_DC9VC2_RANGE_008', joints: ['thrustLeverRight'] },
  { node: 'OBJ8_DC9VC2_RANGE_017', joints: ['pedalFoLeft'] },
  { node: 'OBJ8_DC9VC2_RANGE_018', joints: ['pedalFoRight'] },
  { node: 'OBJ8_DC9VC2_RANGE_020', joints: ['pedalCaptainLeft'] },
  { node: 'OBJ8_DC9VC2_RANGE_021', joints: ['pedalCaptainRight'] },
] as const

/** Panel normal of the first-officer instrument face, shared by most needle pivots. */
const PANEL_NORMAL: Vec3 = [0, -0.241955, -0.970287]
const PANEL_NORMAL_REVERSED: Vec3 = [0, 0.242016, 0.970272]

export const DC9_INSTRUMENT_JOINTS: readonly Dc9Joint[] = [
  {
    id: 'airspeedNeedle',
    kind: 'rotate',
    drive: 'airspeedKt',
    pivot: [0.368331, 0.333986, 2.346],
    axis: PANEL_NORMAL,
    keys: [
      [0, 15.35], [250, 232.75], [260, 242.5], [270, 251.8], [280, 260.8], [290, 269.5],
      [300, 277.8], [320, 294.1], [340, 309.55], [360, 324.3], [380, 338.6], [400, 352.2],
    ],
    range: 'clamp',
    baked: 0,
  },
  {
    id: 'attitudeBallRoll',
    kind: 'rotate',
    drive: 'attitudeRollDeg',
    pivot: [0.472768, 0.351292, 2.257234],
    axis: [0, 0.241917, 0.970297],
    keys: [[-1, -1], [1, 1]],
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'attitudeBallPitch',
    kind: 'rotate',
    drive: 'attitudePitchDeg',
    pivot: [0.468405, 0.355911, 2.275741],
    axis: PITCH_AXIS,
    keys: [[-1, -1], [1, 1]],
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'attitudeRollPointer',
    kind: 'rotate',
    drive: 'attitudeRollDeg',
    pivot: [0.472768, 0.358688, 2.287125],
    axis: [0, 0.241713, 0.970348],
    keys: [[-1, -1], [1, 1]],
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'altimeterPointer',
    kind: 'rotate',
    drive: 'altitudeFt',
    pivot: [0.579689, 0.3381, 2.372499],
    axis: [0, -0.241083, -0.970504],
    keys: [[0, 0], [1000, 360]],
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'altimeterDrum',
    kind: 'rotate',
    drive: 'altitudeFt',
    pivot: [0.605987, 0.322707, 2.306698],
    axis: PITCH_AXIS,
    keys: [[-3000, -18], [0, 0], [55000, 330]],
    range: 'clamp',
    baked: 0,
  },
  {
    id: 'headingCard',
    kind: 'rotate',
    drive: 'headingDeg',
    pivot: [0.473608, 0.253793, 2.378965],
    axis: PANEL_NORMAL_REVERSED,
    keys: [[0, 0], [1, 1]],
    range: 'extrapolate',
    baked: 0,
  },
  {
    id: 'verticalSpeedNeedle',
    kind: 'rotate',
    drive: 'verticalSpeedFpm',
    pivot: [0.665776, 0.337112, 2.368714],
    axis: [0, -0.241932, -0.970293],
    keys: [
      [-7000, -170.6], [-6000, -170.6], [-5000, -153.5], [-4000, -136.7], [-3000, -116.6],
      [-2000, -94], [-1500, -79.4], [-1000, -61.9], [-500, -35.6], [0, 0.15], [500, 36.1],
      [1000, 62.8], [1500, 81.1], [2000, 96.1], [3000, 117.8], [4000, 137.25],
      [5000, 154.4], [6000, 171], [7000, 171],
    ],
    range: 'clamp',
    baked: 0,
  },
  {
    id: 'eprPointerLeft',
    kind: 'rotate',
    drive: 'eprRatio',
    pivot: [-0.026424, 0.426907, 2.334151],
    axis: [0, -0.241903, -0.9703],
    keys: [
      [0, -44.2], [0.8, -44.2], [1, -6.1], [1.2, 32.1], [1.4, 70.65], [1.6, 109.45],
      [1.8, 148.4], [2, 187.1], [2.2, 225], [2.4, 261.95], [2.5, 280.2],
    ],
    range: 'clamp',
    baked: 0,
  },
  {
    id: 'eprPointerRight',
    kind: 'rotate',
    drive: 'eprRatio',
    pivot: [0.029562, 0.426925, 2.334151],
    axis: [0, -0.241903, -0.9703],
    keys: [
      [0, -44.2], [0.8, -44.2], [1, -6.1], [1.2, 32.1], [1.4, 70.65], [1.6, 109.45],
      [1.8, 148.4], [2, 187.1], [2.2, 225], [2.4, 261.95], [2.5, 280.2],
    ],
    range: 'clamp',
    baked: 0,
  },
] as const

export const DC9_INSTRUMENT_BINDINGS: readonly Dc9NodeBinding[] = [
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_151', joints: ['airspeedNeedle'] },
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_129', joints: ['attitudeBallRoll', 'attitudeBallPitch'] },
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_131', joints: ['attitudeRollPointer'] },
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_166', joints: ['altimeterPointer'] },
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_164', joints: ['altimeterDrum'] },
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_108', joints: ['headingCard'] },
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_109', joints: ['headingCard'] },
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_099', joints: ['verticalSpeedNeedle'] },
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_037', joints: ['eprPointerLeft'] },
  { node: 'OBJ8_DC9-32_COCKPIT_RANGE_055', joints: ['eprPointerRight'] },
] as const

/** Rest → peak(s) → rest excursion used for a power-on instrument self-test. */
export interface Dc9SelfTestSweep {
  readonly channel: Dc9InstrumentChannelId
  readonly rest: number
  readonly peaks: readonly number[]
  readonly seconds: number
}

export const DC9_INSTRUMENT_IDS = [
  'airspeed',
  'attitude',
  'altimeter',
  'heading',
  'verticalSpeed',
  'epr',
] as const

export type Dc9InstrumentId = (typeof DC9_INSTRUMENT_IDS)[number]

export interface Dc9Instrument {
  readonly id: Dc9InstrumentId
  readonly label: string
  /** glTF-space centre of the instrument face, used for the click target. */
  readonly center: Vec3
  /** Radius of the invisible hit sphere, in metres. */
  readonly radius: number
  readonly sweeps: readonly Dc9SelfTestSweep[]
}

export const DC9_INSTRUMENTS: Readonly<Record<Dc9InstrumentId, Dc9Instrument>> = {
  airspeed: {
    id: 'airspeed',
    label: 'Airspeed indicator',
    center: [0.368331, 0.333986, 2.346],
    radius: 0.038,
    sweeps: [{ channel: 'airspeedKt', rest: 0, peaks: [250], seconds: 2.4 }],
  },
  attitude: {
    id: 'attitude',
    label: 'Attitude director indicator',
    center: [0.473, 0.356, 2.276],
    radius: 0.062,
    sweeps: [
      { channel: 'attitudeRollDeg', rest: 0, peaks: [20, -20], seconds: 2.6 },
      { channel: 'attitudePitchDeg', rest: 0, peaks: [5, -5], seconds: 2.6 },
    ],
  },
  altimeter: {
    id: 'altimeter',
    label: 'Altimeter',
    center: [0.579689, 0.3381, 2.372499],
    radius: 0.038,
    // 1750 ft is nearly two turns of the pointer: enough travel to read as a sweep,
    // and it holds at a visibly non-zero angle rather than looking like it never moved.
    sweeps: [{ channel: 'altitudeFt', rest: 0, peaks: [1750], seconds: 2.6 }],
  },
  heading: {
    id: 'heading',
    label: 'Horizontal situation indicator',
    center: [0.473608, 0.253793, 2.378965],
    radius: 0.045,
    sweeps: [{ channel: 'headingDeg', rest: 0, peaks: [-90], seconds: 2.4 }],
  },
  verticalSpeed: {
    id: 'verticalSpeed',
    label: 'Vertical speed indicator',
    center: [0.665776, 0.337112, 2.368714],
    radius: 0.038,
    sweeps: [{ channel: 'verticalSpeedFpm', rest: 0, peaks: [1000], seconds: 2.2 }],
  },
  epr: {
    id: 'epr',
    label: 'Engine pressure ratio gauges',
    center: [0.001569, 0.426916, 2.334151],
    radius: 0.055,
    sweeps: [{ channel: 'eprRatio', rest: 0, peaks: [2], seconds: 2.4 }],
  },
} as const

export function dc9InstrumentGameId(instrumentId: Dc9InstrumentId): string {
  return `dc9.gauge.${instrumentId}`
}

export function dc9InstrumentIdFromGameId(gameId: string): Dc9InstrumentId | null {
  const suffix = gameId.startsWith('dc9.gauge.') ? gameId.slice('dc9.gauge.'.length) : null
  return DC9_INSTRUMENT_IDS.find((id) => id === suffix) ?? null
}

/** All GLB nodes this contract depends on, deduplicated. */
export const DC9_FLIGHT_DECK_NODES: readonly string[] = [
  ...new Set([
    ...DC9_FLIGHT_CONTROL_BINDINGS.map((binding) => binding.node),
    ...DC9_INSTRUMENT_BINDINGS.map((binding) => binding.node),
  ]),
]

/**
 * Piecewise-linear lookup across a joint key table. Inputs outside the table clamp to
 * its end values, which matches how X-Plane holds a needle against its stop.
 */
export function interpolateJointKeys(
  keys: readonly Dc9JointKey[],
  input: number,
  range: 'extrapolate' | 'clamp' = 'clamp',
): number {
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (!first || !last) return 0
  const value = Number.isFinite(input) ? input : first[0]
  if (value <= first[0]) {
    if (range === 'clamp' || keys.length < 2) return first[1]
    const next = keys[1]
    if (!next || next[0] === first[0]) return first[1]
    return first[1] + ((value - first[0]) / (next[0] - first[0])) * (next[1] - first[1])
  }
  if (value >= last[0]) {
    if (range === 'clamp' || keys.length < 2) return last[1]
    const previous = keys[keys.length - 2]
    if (!previous || last[0] === previous[0]) return last[1]
    return previous[1] + ((value - previous[0]) / (last[0] - previous[0])) * (last[1] - previous[1])
  }
  for (let index = 1; index < keys.length; index += 1) {
    const upper = keys[index]
    const lower = keys[index - 1]
    if (!upper || !lower || value > upper[0]) continue
    const span = upper[0] - lower[0]
    if (span <= 0) return upper[1]
    return lower[1] + ((value - lower[0]) / span) * (upper[1] - lower[1])
  }
  return last[1]
}

export function resolveJointOffset(joint: Dc9Joint, input: number): number {
  return interpolateJointKeys(joint.keys, input, joint.range)
    - interpolateJointKeys(joint.keys, joint.baked, joint.range)
}

function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t))
  return clamped * clamped * (3 - 2 * clamped)
}

/**
 * Value of a self-test sweep at `elapsedSeconds`. The needle eases rest → each peak in
 * turn → rest, and holds at rest once the sweep is over.
 */
export function dc9SelfTestValue(sweep: Dc9SelfTestSweep, elapsedSeconds: number): number {
  const stops = [sweep.rest, ...sweep.peaks, sweep.rest]
  const segments = stops.length - 1
  if (segments <= 0 || sweep.seconds <= 0) return sweep.rest
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return sweep.rest
  if (elapsedSeconds >= sweep.seconds) return sweep.rest
  const position = (elapsedSeconds / sweep.seconds) * segments
  const index = Math.min(Math.floor(position), segments - 1)
  const from = stops[index] ?? sweep.rest
  const to = stops[index + 1] ?? sweep.rest
  return from + (to - from) * smoothstep(position - index)
}

export function dc9SelfTestDuration(instrument: Dc9Instrument): number {
  return instrument.sweeps.reduce((longest, sweep) => Math.max(longest, sweep.seconds), 0)
}
