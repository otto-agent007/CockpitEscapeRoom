import { describe, expect, it } from 'vitest'
import {
  DC9_FLIGHT_CONTROL_BINDINGS,
  DC9_FLIGHT_CONTROL_JOINTS,
  DC9_FLIGHT_DECK_NODES,
  DC9_INSTRUMENTS,
  DC9_INSTRUMENT_BINDINGS,
  DC9_INSTRUMENT_IDS,
  DC9_INSTRUMENT_JOINTS,
  dc9InstrumentGameId,
  dc9InstrumentIdFromGameId,
  dc9SelfTestDuration,
  dc9SelfTestValue,
  interpolateJointKeys,
  resolveJointOffset,
  type Dc9Joint,
} from './dc9FlightDeck'

const allJoints: Dc9Joint[] = [...DC9_FLIGHT_CONTROL_JOINTS, ...DC9_INSTRUMENT_JOINTS]
const jointById = new Map(allJoints.map((joint) => [joint.id, joint]))

describe('flight deck contract integrity', () => {
  it('gives every joint a unique id', () => {
    expect(new Set(allJoints.map((joint) => joint.id)).size).toBe(allJoints.length)
  })

  it('binds only to declared joints', () => {
    for (const binding of [...DC9_FLIGHT_CONTROL_BINDINGS, ...DC9_INSTRUMENT_BINDINGS]) {
      for (const jointId of binding.joints) {
        expect(jointById.has(jointId), `${binding.node} references unknown joint ${jointId}`).toBe(true)
      }
    }
  })

  it('binds every declared joint to at least one node', () => {
    const bound = new Set(
      [...DC9_FLIGHT_CONTROL_BINDINGS, ...DC9_INSTRUMENT_BINDINGS].flatMap((binding) => binding.joints),
    )
    for (const joint of allJoints) expect(bound.has(joint.id), `${joint.id} is unused`).toBe(true)
  })

  it('binds each node once so pivot chains cannot be built twice', () => {
    const nodes = [...DC9_FLIGHT_CONTROL_BINDINGS, ...DC9_INSTRUMENT_BINDINGS].map((binding) => binding.node)
    expect(new Set(nodes).size).toBe(nodes.length)
    expect(DC9_FLIGHT_DECK_NODES.length).toBe(nodes.length)
  })

  it('keeps every key table ascending by input', () => {
    for (const joint of allJoints) {
      const inputs = joint.keys.map(([input]) => input)
      expect([...inputs].sort((a, b) => a - b), `${joint.id} key inputs`).toEqual(inputs)
    }
  })

  it('uses unit-length rotation axes', () => {
    for (const joint of allJoints) {
      if (joint.kind !== 'rotate') continue
      const [x, y, z] = joint.axis
      expect(Math.hypot(x, y, z), `${joint.id} axis length`).toBeCloseTo(1, 3)
    }
  })

  it('gives every attitude, heading and altimeter channel room to move past its samples', () => {
    // These are the joints whose donor tables are 1:1 or single-revolution linear maps.
    const linear = ['attitudeBallRoll', 'attitudeBallPitch', 'attitudeRollPointer', 'headingCard', 'altimeterPointer']
    for (const id of linear) {
      expect(jointById.get(id)?.range, `${id} range`).toBe('extrapolate')
    }
    // These are calibrated dial faces that must hold against their stops.
    for (const id of ['airspeedNeedle', 'verticalSpeedNeedle', 'eprPointerLeft', 'eprPointerRight', 'altimeterDrum']) {
      expect(jointById.get(id)?.range, `${id} range`).toBe('clamp')
    }
  })

  it('turns every self-test sweep into real needle travel', () => {
    // Guards the bug where a clamped 1:1 table capped a 20-degree roll at one degree.
    for (const id of DC9_INSTRUMENT_IDS) {
      for (const sweep of DC9_INSTRUMENTS[id].sweeps) {
        const driven = DC9_INSTRUMENT_JOINTS.filter((joint) => joint.drive === sweep.channel)
        expect(driven.length, `${id} drives ${sweep.channel}`).toBeGreaterThan(0)
        for (const joint of driven) {
          const travel = Math.max(...sweep.peaks.map(
            (peak) => Math.abs(resolveJointOffset(joint, peak) - resolveJointOffset(joint, sweep.rest)),
          ))
          // Four degrees is well under the smallest deliberate excursion (the ADI's
          // five-degree pitch nudge) and well over the one degree a clamped 1:1 table
          // would produce.
          expect(travel, `${joint.id} travel during the ${id} self-test`).toBeGreaterThan(4)
        }
      }
    }
  })

  it('rests at exactly zero offset in the parked pose', () => {
    for (const joint of allJoints) {
      expect(resolveJointOffset(joint, joint.baked), `${joint.id} parked offset`).toBe(0)
    }
  })
})

describe('instrument targets', () => {
  it('describes every declared instrument', () => {
    for (const id of DC9_INSTRUMENT_IDS) expect(DC9_INSTRUMENTS[id].id).toBe(id)
  })

  it('keeps hit spheres from overlapping, so a click is never ambiguous', () => {
    const instruments = DC9_INSTRUMENT_IDS.map((id) => DC9_INSTRUMENTS[id])
    for (let a = 0; a < instruments.length; a += 1) {
      for (let b = a + 1; b < instruments.length; b += 1) {
        const first = instruments[a]!
        const second = instruments[b]!
        const distance = Math.hypot(
          first.center[0] - second.center[0],
          first.center[1] - second.center[1],
          first.center[2] - second.center[2],
        )
        expect(distance, `${first.id} overlaps ${second.id}`).toBeGreaterThan(first.radius + second.radius)
      }
    }
  })

  it('round-trips instrument game ids', () => {
    for (const id of DC9_INSTRUMENT_IDS) {
      expect(dc9InstrumentIdFromGameId(dc9InstrumentGameId(id))).toBe(id)
    }
    expect(dc9InstrumentIdFromGameId('dc9.gauge.unknown')).toBeNull()
    expect(dc9InstrumentIdFromGameId('dc9.secure.battery')).toBeNull()
  })

  it('drives each self-test sweep from a channel some joint consumes', () => {
    const driven = new Set(DC9_INSTRUMENT_JOINTS.map((joint) => joint.drive))
    for (const id of DC9_INSTRUMENT_IDS) {
      for (const sweep of DC9_INSTRUMENTS[id].sweeps) {
        expect(driven.has(sweep.channel), `${id} sweep channel ${sweep.channel}`).toBe(true)
      }
    }
  })
})

describe('interpolateJointKeys', () => {
  const keys = [[0, 15.35], [250, 232.75], [400, 352.2]] as const

  it('returns exact key outputs', () => {
    expect(interpolateJointKeys(keys, 0)).toBe(15.35)
    expect(interpolateJointKeys(keys, 250)).toBe(232.75)
    expect(interpolateJointKeys(keys, 400)).toBe(352.2)
  })

  it('interpolates between keys', () => {
    expect(interpolateJointKeys(keys, 125)).toBeCloseTo((15.35 + 232.75) / 2, 6)
  })

  it('holds a calibrated dial against its stops', () => {
    expect(interpolateJointKeys(keys, -500, 'clamp')).toBe(15.35)
    expect(interpolateJointKeys(keys, 5000, 'clamp')).toBe(352.2)
    expect(interpolateJointKeys(keys, 5000)).toBe(352.2)
  })

  it('keeps a two-key linear channel going past its samples', () => {
    // The donor authors an attitude ball as -1 deg -> -1 deg, 1 deg -> 1 deg, and means
    // it as a 1:1 map. Clamping there would cap a twenty-degree roll at one degree.
    const identity = [[-1, -1], [1, 1]] as const
    expect(interpolateJointKeys(identity, 20, 'extrapolate')).toBeCloseTo(20, 6)
    expect(interpolateJointKeys(identity, -20, 'extrapolate')).toBeCloseTo(-20, 6)
    expect(interpolateJointKeys(identity, 20, 'clamp')).toBe(1)

    const heading = [[0, 0], [1, 1]] as const
    expect(interpolateJointKeys(heading, -90, 'extrapolate')).toBeCloseTo(-90, 6)

    const altimeter = [[0, 0], [1000, 360]] as const
    expect(interpolateJointKeys(altimeter, 1750, 'extrapolate')).toBeCloseTo(630, 6)
  })

  it('survives empty tables and non-finite input', () => {
    expect(interpolateJointKeys([], 12)).toBe(0)
    expect(interpolateJointKeys(keys, Number.NaN)).toBe(15.35)
  })
})

describe('resolveJointOffset', () => {
  it('subtracts the baked pose so motion is relative to the shipped geometry', () => {
    const joint = DC9_INSTRUMENT_JOINTS.find((candidate) => candidate.id === 'airspeedNeedle')
    if (!joint) throw new Error('airspeedNeedle joint is missing')
    expect(resolveJointOffset(joint, 0)).toBe(0)
    expect(resolveJointOffset(joint, 250)).toBeCloseTo(232.75 - 15.35, 6)
  })

  it('moves the yoke symmetrically either side of the parked centre', () => {
    // The donor table runs -1 -> -10 deg and +1 -> +15 deg, so ratio 0 -- the pose the
    // GLB is baked at -- already carries +2.5 deg. Relative travel is +/-12.5 deg.
    const joint = DC9_FLIGHT_CONTROL_JOINTS.find((candidate) => candidate.id === 'foYokePitch')
    if (!joint) throw new Error('foYokePitch joint is missing')
    expect(resolveJointOffset(joint, 0)).toBe(0)
    expect(resolveJointOffset(joint, 1)).toBeCloseTo(12.5, 6)
    expect(resolveJointOffset(joint, -1)).toBeCloseTo(-12.5, 6)
  })
})

describe('dc9SelfTestValue', () => {
  const sweep = { channel: 'airspeedKt', rest: 0, peaks: [250], seconds: 2 } as const

  it('starts and ends at rest', () => {
    expect(dc9SelfTestValue(sweep, 0)).toBe(0)
    expect(dc9SelfTestValue(sweep, 2)).toBe(0)
    expect(dc9SelfTestValue(sweep, 9)).toBe(0)
    expect(dc9SelfTestValue(sweep, -1)).toBe(0)
  })

  it('reaches the peak halfway through a single-peak sweep', () => {
    expect(dc9SelfTestValue(sweep, 1)).toBeCloseTo(250, 6)
  })

  it('walks multi-peak sweeps in order', () => {
    const roll = { channel: 'attitudeRollDeg', rest: 0, peaks: [20, -20], seconds: 3 } as const
    expect(dc9SelfTestValue(roll, 1)).toBeCloseTo(20, 6)
    expect(dc9SelfTestValue(roll, 2)).toBeCloseTo(-20, 6)
    expect(dc9SelfTestValue(roll, 1.5)).toBeCloseTo(0, 6)
  })

  it('never overshoots its stops', () => {
    for (let elapsed = 0; elapsed <= 2; elapsed += 0.05) {
      const value = dc9SelfTestValue(sweep, elapsed)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(250)
    }
  })

  it('reports the longest sweep as the instrument duration', () => {
    expect(dc9SelfTestDuration(DC9_INSTRUMENTS.attitude)).toBe(2.6)
    expect(dc9SelfTestDuration(DC9_INSTRUMENTS.verticalSpeed)).toBe(2.2)
  })
})
