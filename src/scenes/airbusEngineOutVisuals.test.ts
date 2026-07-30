import { describe, expect, it } from 'vitest'
import * as visualModule from './airbusEngineOutVisuals'
import type { AirbusEngineOutVisualPose } from './airbusEngineOutVisuals'

const simulation = {
  pitchDegrees: 6,
  bankDegrees: 14,
  headingErrorDegrees: -8,
  directionalError: -0.55,
  corridorProgress: 0.4,
  leftEnginePower: 0.28,
  rightEnginePower: 0.72,
}

describe('Engine-Out visual adapter', () => {
  it('derives bounded cockpit and world cues from the authoritative frame', () => {
    const derivePose = (
      visualModule as unknown as {
        deriveAirbusEngineOutVisualPose?: (
          state: typeof simulation,
          reducedMotion: boolean,
        ) => {
          horizonRollRadians: number
          pitchOffsetMeters: number
          headingDriftRadians: number
          directionalCue: number
          safeReturnProgress: number
          leftEnginePower: number
          rightEnginePower: number
        }
      }
    ).deriveAirbusEngineOutVisualPose

    expect(derivePose).toBeTypeOf('function')
    if (!derivePose) return

    const pose = derivePose(simulation, false)
    expect(pose.horizonRollRadians).toBeGreaterThan(0.2)
    expect(pose.pitchOffsetMeters).toBeGreaterThan(0)
    expect(pose.headingDriftRadians).toBeLessThan(0)
    expect(pose.directionalCue).toBe(-0.55)
    expect(pose.safeReturnProgress).toBe(0.4)
    expect(pose.leftEnginePower).toBe(0.28)
    expect(pose.rightEnginePower).toBe(0.72)
  })

  it('reduces world motion without hiding directional or engine information', () => {
    const derivePose = (
      visualModule as unknown as {
        deriveAirbusEngineOutVisualPose?: (
          state: typeof simulation,
          reducedMotion: boolean,
        ) => AirbusEngineOutVisualPose
      }
    ).deriveAirbusEngineOutVisualPose
    expect(derivePose).toBeTypeOf('function')
    if (!derivePose) return
    const full = derivePose(simulation, false)
    const reduced = derivePose(simulation, true)

    expect(Math.abs(reduced.horizonRollRadians)).toBeLessThan(Math.abs(full.horizonRollRadians))
    expect(Math.abs(reduced.pitchOffsetMeters)).toBeLessThan(Math.abs(full.pitchOffsetMeters))
    expect(Math.abs(reduced.headingDriftRadians)).toBeLessThan(Math.abs(full.headingDriftRadians))
    expect(reduced.directionalCue).toBe(full.directionalCue)
    expect(reduced.leftEnginePower).toBe(full.leftEnginePower)
  })
})
