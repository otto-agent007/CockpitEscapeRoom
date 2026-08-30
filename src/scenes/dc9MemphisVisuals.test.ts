import { describe, expect, it } from 'vitest'
import type { Dc9DepartureFrame } from '../game/dc9MemphisDeparture'
import {
  DC9_MEMPHIS_GROUND_CLEARANCE_METERS,
  dc9MemphisWorldPose,
  sampleDc9MemphisPath,
  validateDc9MemphisAnchors,
  type Dc9MemphisVector,
} from './dc9MemphisVisuals'

const approvedAnchorFixture = new Map<string, Dc9MemphisVector>([
  ['dc9.memphis.rampStart', [0, 0, 0] as const],
  ['dc9.memphis.taxiTurn', [-55, 90, 0] as const],
  ['dc9.memphis.holdShort', [-120, 210, 0] as const],
  ['dc9.memphis.runwayLineup', [-120, 245, 0] as const],
  ['dc9.memphis.initialClimb', [-120, 700, 110] as const],
])

function frame(overrides: Partial<Dc9DepartureFrame> = {}): Dc9DepartureFrame {
  return {
    beat: 'taxi',
    pathProgress: 0.2,
    lateralError: 0,
    headingError: 0,
    energy: 0.2,
    altitudeProgress: 0,
    pitch: 0,
    roll: 0,
    safeHold: false,
    deviationSeconds: 0,
    fixedStepRemainderSeconds: 0,
    ...overrides,
  }
}

function rotateByQuaternion(
  [x, y, z]: readonly [number, number, number],
  [qx, qy, qz, qw]: readonly [number, number, number, number],
): [number, number, number] {
  const ix = qw * x + qy * z - qz * y
  const iy = qw * y + qz * x - qx * z
  const iz = qw * z + qx * y - qy * x
  const iw = -qx * x - qy * y - qz * z
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ]
}

function transformCurrentAircraftPoint(
  sourceFrame: Dc9DepartureFrame,
  reducedMotion: boolean,
): { transformed: [number, number, number]; vibration: readonly [number, number, number] } {
  const sample = sampleDc9MemphisPath(sourceFrame.pathProgress, approvedAnchorFixture)
  // Authored X-right/Y-forward/Z-up becomes Three X-right/Y-up/Z-back. The
  // aircraft reference rides a gear-height clearance above the pavement.
  const aircraftPoint: [number, number, number] = [
    sample.position[0],
    sample.position[2] * sourceFrame.altitudeProgress + DC9_MEMPHIS_GROUND_CLEARANCE_METERS,
    -sample.position[1],
  ]
  const pose = dc9MemphisWorldPose(sourceFrame, approvedAnchorFixture, { reducedMotion })
  const rotated = rotateByQuaternion(aircraftPoint, pose.quaternion)
  return {
    transformed: [
      rotated[0] + pose.position.x,
      rotated[1] + pose.position.y,
      rotated[2] + pose.position.z,
    ],
    vibration: pose.vibration,
  }
}

describe('DC-9 Memphis visual path', () => {
  it('requires every stable anchor in its authored order', () => {
    expect(validateDc9MemphisAnchors(new Map())).toContain('dc9.memphis.rampStart')

    const outOfOrder = new Map([
      ['dc9.memphis.taxiTurn', [-55, 90, 0] as const],
      ['dc9.memphis.rampStart', [0, 0, 0] as const],
      ...[...approvedAnchorFixture].slice(2),
    ])
    expect(validateDc9MemphisAnchors(outOfOrder).join(' ')).toContain('stable order')
  })

  it('rejects non-finite anchor coordinates', () => {
    const malformed = new Map(approvedAnchorFixture)
    malformed.set('dc9.memphis.holdShort', [Number.NaN, 210, 0])

    expect(validateDc9MemphisAnchors(malformed).join(' ')).toContain('finite')
  })

  it('samples the exact checkpoint anchors and clamps path progress', () => {
    expect(sampleDc9MemphisPath(-5, approvedAnchorFixture).position).toEqual([0, 0, 0])
    expect(sampleDc9MemphisPath(0.12, approvedAnchorFixture).position).toEqual([-55, 90, 0])
    expect(sampleDc9MemphisPath(0.42, approvedAnchorFixture).position).toEqual([-120, 210, 0])
    expect(sampleDc9MemphisPath(0.52, approvedAnchorFixture).position).toEqual([-120, 245, 0])
    expect(sampleDc9MemphisPath(5, approvedAnchorFixture).position).toEqual([-120, 700, 110])
  })

  it('travels at a continuous speed across every checkpoint knot', () => {
    // Owner report 2026-08-29: the ground lurched during the ramp and taxi but
    // ran smoothly on the takeoff roll. The route was parameterized by knot
    // fraction, so a 105 m ramp leg and a 468 m runway leg each consumed their
    // own slice of progress and the world changed pace at every boundary.
    const speedAt = (progress: number) => {
      const epsilon = 1e-5
      const low = Math.max(0, progress - epsilon)
      const high = Math.min(1, progress + epsilon)
      const before = sampleDc9MemphisPath(low, approvedAnchorFixture).position
      const after = sampleDc9MemphisPath(high, approvedAnchorFixture).position
      return Math.hypot(
        after[0] - before[0],
        after[1] - before[1],
        after[2] - before[2],
      ) / (high - low)
    }

    let previous = speedAt(0.005)
    let worstStep = 0
    for (let sample = 1; sample <= 199; sample += 1) {
      const speed = speedAt(sample / 200)
      expect(speed).toBeGreaterThan(0)
      worstStep = Math.max(worstStep, Math.abs(speed - previous) / previous)
      previous = speed
    }
    // Knot-fraction sampling stepped 60% between two adjacent samples at the
    // ramp/taxi boundary; arc-length sampling keeps every step gradual.
    expect(worstStep).toBeLessThan(0.08)
  })

  it('curves smoothly between taxi anchors without importing presentation state', () => {
    const beforeTurn = sampleDc9MemphisPath(0.10, approvedAnchorFixture)
    const afterTurn = sampleDc9MemphisPath(0.14, approvedAnchorFixture)

    expect(beforeTurn.position[0]).toBeGreaterThan(-55)
    expect(afterTurn.position[0]).toBeLessThan(-55)
    expect(Math.abs(afterTurn.headingRadians - beforeTurn.headingRadians)).toBeLessThan(0.35)
  })

  it.each([
    ['hold-short checkpoint', frame({ beat: 'holdShort', pathProgress: 0.42, pitch: 0.15, roll: -0.2 })],
    ['taxi turn', frame({ beat: 'taxi', pathProgress: 0.3, pitch: -0.1, roll: 0.25 })],
    ['initial climb', frame({ beat: 'initialClimb', pathProgress: 0.9, altitudeProgress: 0.5, pitch: 0.2, roll: -0.15 })],
  ])('keeps the cockpit origin fixed through the %s inverse pose', (_label, sourceFrame) => {
    if (_label === 'taxi turn') {
      expect(Math.abs(sampleDc9MemphisPath(sourceFrame.pathProgress, approvedAnchorFixture).headingRadians)).toBeGreaterThan(0.05)
    }
    const { transformed } = transformCurrentAircraftPoint(sourceFrame, true)
    expect(transformed[0]).toBeCloseTo(0, 8)
    expect(transformed[1]).toBeCloseTo(0, 8)
    expect(transformed[2]).toBeCloseTo(0, 8)

    const pose = dc9MemphisWorldPose(sourceFrame, approvedAnchorFixture, { reducedMotion: true })
    expect(pose.quaternion.every(Number.isFinite)).toBe(true)
    if (sourceFrame.pitch > 0) expect(pose.rotation.x).toBeLessThan(0)
  })

  it('clamps lateral and heading errors before deriving the world pose', () => {
    const bounded = dc9MemphisWorldPose(frame({ lateralError: 1, headingError: -1 }), approvedAnchorFixture)
    const extreme = dc9MemphisWorldPose(frame({ lateralError: 200, headingError: -200 }), approvedAnchorFixture)

    expect(extreme.position).toEqual(bounded.position)
    expect(extreme.rotation.y).toBeCloseTo(bounded.rotation.y, 10)
  })

  it('uses climb progress for altitude and a restrained nose-up world rotation', () => {
    const runway = dc9MemphisWorldPose(frame({
      beat: 'initialClimb',
      pathProgress: 0.9,
      altitudeProgress: 0,
      pitch: 0,
    }), approvedAnchorFixture, { reducedMotion: true })
    const climb = dc9MemphisWorldPose(frame({
      beat: 'initialClimb',
      pathProgress: 0.9,
      altitudeProgress: 0.75,
      pitch: 0.2,
    }), approvedAnchorFixture, { reducedMotion: true })

    expect(runway.position.y).toBeCloseTo(-DC9_MEMPHIS_GROUND_CLEARANCE_METERS, 8)
    expect(climb.position.y).toBeLessThan(runway.position.y)
    expect(climb.rotation.x).toBeLessThan(runway.rotation.x)
    expect(Math.abs(climb.rotation.x)).toBeLessThan(0.2)
  })

  it.each([
    ['at rest on the ramp', frame({ pathProgress: 0, energy: 0, safeHold: true })],
    ['full nose-up input on the roll', frame({ beat: 'takeoffRoll', pathProgress: 0.6, pitch: 1, roll: 0 })],
    ['full bank input in the climb', frame({ beat: 'initialClimb', pathProgress: 0.9, altitudeProgress: 0.5, pitch: 1, roll: -1 })],
  ])('keeps the pavement a gear-height clearance from the cockpit origin %s', (_label, sourceFrame) => {
    // A runway centerline dash once pitched up through the cabin because the
    // aircraft reference sat at pavement level. A rigid transform preserves the
    // perpendicular distance from the rotation centre to the ground plane, so
    // that distance must equal the authored clearance at every attitude.
    const pose = dc9MemphisWorldPose(sourceFrame, approvedAnchorFixture, { reducedMotion: true })
    const groundCorners: ReadonlyArray<readonly [number, number, number]> = [
      [0, 0, 0],
      [40, 0, -25],
      [-30, 0, 45],
    ]
    const groundPoints: Array<[number, number, number]> = groundCorners.map(([x, y, z]) => {
      const rotated = rotateByQuaternion([x, y, z], pose.quaternion)
      return [rotated[0] + pose.position.x, rotated[1] + pose.position.y, rotated[2] + pose.position.z]
    })
    const edgeA = groundPoints[1]!.map((value, axis) => value - groundPoints[0]![axis]!) as [number, number, number]
    const edgeB = groundPoints[2]!.map((value, axis) => value - groundPoints[0]![axis]!) as [number, number, number]
    const normal: [number, number, number] = [
      edgeA[1] * edgeB[2] - edgeA[2] * edgeB[1],
      edgeA[2] * edgeB[0] - edgeA[0] * edgeB[2],
      edgeA[0] * edgeB[1] - edgeA[1] * edgeB[0],
    ]
    const normalLength = Math.hypot(...normal)
    const planeDistance = Math.abs(
      normal[0] * groundPoints[0]![0]! + normal[1] * groundPoints[0]![1]! + normal[2] * groundPoints[0]![2]!,
    ) / normalLength
    const altitude = sampleDc9MemphisPath(sourceFrame.pathProgress, approvedAnchorFixture).position[2]
      * Math.min(1, Math.max(0, sourceFrame.altitudeProgress))
    expect(planeDistance).toBeCloseTo(DC9_MEMPHIS_GROUND_CLEARANCE_METERS + altitude, 6)
    expect(DC9_MEMPHIS_GROUND_CLEARANCE_METERS).toBeGreaterThanOrEqual(2.5)
  })

  it('removes all nonessential vibration under reduced motion', () => {
    const moving = frame({ beat: 'takeoffRoll', pathProgress: 0.7, energy: 0.9 })
    const normal = dc9MemphisWorldPose(moving, approvedAnchorFixture)
    const reduced = dc9MemphisWorldPose(moving, approvedAnchorFixture, { reducedMotion: true })

    expect(normal.vibration.some((value) => value !== 0)).toBe(true)
    expect(reduced.vibration).toEqual([0, 0, 0])

    const normalOrigin = transformCurrentAircraftPoint(moving, false)
    expect(normalOrigin.transformed[0]).toBeCloseTo(normalOrigin.vibration[0], 8)
    expect(normalOrigin.transformed[1]).toBeCloseTo(normalOrigin.vibration[1], 8)
    expect(normalOrigin.transformed[2]).toBeCloseTo(normalOrigin.vibration[2], 8)
  })

  it('normalizes malformed transient values to a finite safe pose', () => {
    const pose = dc9MemphisWorldPose(frame({
      pathProgress: Number.NaN,
      lateralError: Number.POSITIVE_INFINITY,
      headingError: Number.NEGATIVE_INFINITY,
      altitudeProgress: Number.NaN,
      pitch: Number.NaN,
      roll: Number.NaN,
      energy: Number.NaN,
    }), approvedAnchorFixture, { reducedMotion: true })

    expect(Object.values(pose.position).every(Number.isFinite)).toBe(true)
    expect(Object.values(pose.rotation).every(Number.isFinite)).toBe(true)
    expect(pose.quaternion.every(Number.isFinite)).toBe(true)
  })
})
