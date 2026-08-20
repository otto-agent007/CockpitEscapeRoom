import { describe, expect, it } from 'vitest'
import {
  airbusPfdHorizonRollRadians,
  deriveAirbusStormVisualPose,
} from './airbusStormVisuals'

describe('Airbus Storm Flight visual response', () => {
  it('keeps the cockpit PFD horizon sign aligned with the captain controls', () => {
    expect(airbusPfdHorizonRollRadians(2)).toBeGreaterThan(0)
    expect(airbusPfdHorizonRollRadians(-2)).toBeLessThan(0)
    expect(airbusPfdHorizonRollRadians(2)).toBeCloseTo(
      -airbusPfdHorizonRollRadians(-2),
      8,
    )
  })

  it('keeps bank direction aligned with the captain controls', () => {
    const bankRight = deriveAirbusStormVisualPose({
      bankDegrees: 2,
      pitchDegrees: 0,
      lateralPosition: -0.7,
    })
    const bankLeft = deriveAirbusStormVisualPose({
      bankDegrees: -2,
      pitchDegrees: 0,
      lateralPosition: -0.7,
    })

    expect(bankRight.horizonRollRadians).toBeGreaterThan(0)
    expect(bankLeft.horizonRollRadians).toBeLessThan(0)
    expect(bankRight.horizonRollRadians).toBeCloseTo(-bankLeft.horizonRollRadians, 8)
  })

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

    expect(pose.horizonRollRadians).toBeCloseTo(55 * Math.PI / 180, 6)
    expect(pose.pitchOffsetMeters).toBeLessThan(0)
    expect(pose.corridorProgress).toBe(0)
  })
})
