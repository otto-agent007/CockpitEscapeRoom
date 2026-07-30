import { describe, expect, it } from 'vitest'
import { deriveAirbusStormVisualPose } from './airbusStormVisuals'

describe('Airbus Storm Flight visual response', () => {
  it('turns a two-degree aircraft bank into a clearly legible windshield horizon change', () => {
    const pose = deriveAirbusStormVisualPose({
      bankDegrees: -2,
      pitchDegrees: 0,
      lateralPosition: -0.7,
    })

    expect(Math.abs(pose.horizonRollRadians)).toBeGreaterThan(0.08)
    expect(pose.pitchOffsetMeters).toBeCloseTo(0, 8)
    expect(pose.corridorProgress).toBe(1)
  })

  it('clamps extreme attitude cues while preserving pitch direction', () => {
    const pose = deriveAirbusStormVisualPose({
      bankDegrees: 90,
      pitchDegrees: 12,
      lateralPosition: 0,
    })

    expect(pose.horizonRollRadians).toBeCloseTo(-55 * Math.PI / 180, 6)
    expect(pose.pitchOffsetMeters).toBeLessThan(0)
    expect(pose.corridorProgress).toBe(0)
  })
})
