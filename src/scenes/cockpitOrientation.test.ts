import { describe, expect, it } from 'vitest'
import {
  COCKPIT_ORIENTATION_DURATION_SECONDS,
  sampleCockpitOrientation,
  type CockpitOrientationOffset,
} from './cockpitOrientation'

const zeroOffset = {
  yawRadians: 0,
  pitchRadians: 0,
  leanMeters: 0,
  fovDegrees: 0,
}

function motionValues(sample: CockpitOrientationOffset) {
  return [sample.yawRadians, sample.pitchRadians, sample.leanMeters, sample.fovDegrees]
}

describe('first-entry cockpit orientation timelines', () => {
  it.each(['dc9', 'airbus'] as const)('%s clamps time and settles exactly at 4.5 seconds', (cockpit) => {
    expect(sampleCockpitOrientation(cockpit, -2)).toMatchObject({ progress: 0, complete: false })
    expect(sampleCockpitOrientation(cockpit, Number.NaN)).toEqual(
      sampleCockpitOrientation(cockpit, 0),
    )

    const justBefore = sampleCockpitOrientation(
      cockpit,
      COCKPIT_ORIENTATION_DURATION_SECONDS - 0.001,
    )
    expect(justBefore.progress).toBeLessThan(1)
    expect(justBefore.complete).toBe(false)

    expect(sampleCockpitOrientation(cockpit, COCKPIT_ORIENTATION_DURATION_SECONDS))
      .toEqual({ ...zeroOffset, progress: 1, complete: true })
    expect(sampleCockpitOrientation(cockpit, Number.POSITIVE_INFINITY))
      .toEqual({ ...zeroOffset, progress: 1, complete: true })
  })

  it.each([
    ['dc9', { yaw: 0.55, pitch: 0.18, lean: 0.012, fov: 10 }],
    ['airbus', { yaw: 0.3, pitch: 0.14, lean: 0.01, fov: 10 }],
  ] as const)('%s visits distinct views without leaving its seat bounds', (cockpit, bounds) => {
    const elapsedTimes = [0, 0.7, 1.4, 2.25, 3.2, 4.1]
    const samples = elapsedTimes.map((elapsed) => sampleCockpitOrientation(cockpit, elapsed))
    const distinct = new Set(samples.map((sample) => motionValues(sample).map((value) => value.toFixed(4)).join(',')))

    expect(distinct.size).toBeGreaterThanOrEqual(4)
    for (const sample of samples) {
      expect(Math.abs(sample.yawRadians)).toBeLessThanOrEqual(bounds.yaw)
      expect(Math.abs(sample.pitchRadians)).toBeLessThanOrEqual(bounds.pitch)
      expect(Math.abs(sample.leanMeters)).toBeLessThanOrEqual(bounds.lean)
      expect(Math.abs(sample.fovDegrees)).toBeLessThanOrEqual(bounds.fov)
      expect(sample.progress).toBeGreaterThanOrEqual(0)
      expect(sample.progress).toBeLessThan(1)
      expect(sample.complete).toBe(false)
    }
  })

  it.each(['dc9', 'airbus'] as const)('%s remains continuous through every interior keyframe', (cockpit) => {
    for (const elapsed of [1.035, 2.25, 3.33]) {
      const before = motionValues(sampleCockpitOrientation(cockpit, elapsed - 0.0001))
      const after = motionValues(sampleCockpitOrientation(cockpit, elapsed + 0.0001))
      before.forEach((value, index) => {
        expect(Math.abs(value - after[index]!)).toBeLessThan(0.001)
      })
    }
  })
})
