import { describe, expect, it } from 'vitest'
import type { Dc9DepartureFrame } from '../game/dc9MemphisDeparture'
import {
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

  it('curves smoothly between taxi anchors without importing presentation state', () => {
    const beforeTurn = sampleDc9MemphisPath(0.10, approvedAnchorFixture)
    const afterTurn = sampleDc9MemphisPath(0.14, approvedAnchorFixture)

    expect(beforeTurn.position[0]).toBeGreaterThan(-55)
    expect(afterTurn.position[0]).toBeLessThan(-55)
    expect(Math.abs(afterTurn.headingRadians - beforeTurn.headingRadians)).toBeLessThan(0.35)
  })

  it('keeps the cockpit fixed by returning an inverse world pose', () => {
    const pose = dc9MemphisWorldPose(frame({
      beat: 'initialClimb',
      pathProgress: 0.9,
      energy: 0.8,
      altitudeProgress: 0.5,
      pitch: 0.2,
    }), approvedAnchorFixture)

    expect(pose.position.y).toBeLessThan(0)
    expect(pose.rotation.x).toBeLessThan(0)
    expect(pose.quaternion.every(Number.isFinite)).toBe(true)
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

    expect(runway.position.y).toBeCloseTo(0, 8)
    expect(climb.position.y).toBeLessThan(runway.position.y)
    expect(climb.rotation.x).toBeLessThan(runway.rotation.x)
    expect(Math.abs(climb.rotation.x)).toBeLessThan(0.2)
  })

  it('removes all nonessential vibration under reduced motion', () => {
    const moving = frame({ beat: 'takeoffRoll', pathProgress: 0.7, energy: 0.9 })
    const normal = dc9MemphisWorldPose(moving, approvedAnchorFixture)
    const reduced = dc9MemphisWorldPose(moving, approvedAnchorFixture, { reducedMotion: true })

    expect(normal.vibration.some((value) => value !== 0)).toBe(true)
    expect(reduced.vibration).toEqual([0, 0, 0])
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
