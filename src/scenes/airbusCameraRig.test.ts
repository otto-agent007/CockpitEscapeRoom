import { describe, expect, it } from 'vitest'
import {
  AIRBUS_LOOK_LIMITS,
  clampAirbusLook,
  interpolateAirbusCameraPose,
  recenterAirbusLook,
  type AirbusCameraPose,
} from './airbusCameraRig'

describe('Airbus Storm Flight camera rig', () => {
  it('interpolates the authored camera pose without overshooting either endpoint', () => {
    const captain: AirbusCameraPose = {
      position: [0, 1, 2],
      quaternion: [0, 0, 0, 1],
      verticalFov: 68,
    }
    const storm: AirbusCameraPose = {
      position: [2, 3, 4],
      quaternion: [0, 0, 1, 0],
      verticalFov: 58,
    }

    expect(interpolateAirbusCameraPose(captain, storm, -1)).toEqual(captain)
    const midpoint = interpolateAirbusCameraPose(captain, storm, 0.5)
    expect(midpoint.position).toEqual([1, 2, 3])
    expect(midpoint.verticalFov).toBe(63)
    expect(midpoint.quaternion[0]).toBe(0)
    expect(midpoint.quaternion[1]).toBe(0)
    expect(midpoint.quaternion[2]).toBeCloseTo(Math.SQRT1_2, 12)
    expect(midpoint.quaternion[3]).toBeCloseTo(Math.SQRT1_2, 12)
    expect(interpolateAirbusCameraPose(captain, storm, 2)).toEqual(storm)
  })

  it('clamps Storm Flight look and always removes roll', () => {
    expect(clampAirbusLook({
      yawDegrees: 24,
      pitchDegrees: -12,
      leanMeters: -0.04,
      rollDegrees: 30,
    })).toEqual({
      yawDegrees: AIRBUS_LOOK_LIMITS.yawDegrees,
      pitchDegrees: -AIRBUS_LOOK_LIMITS.pitchDegrees,
      leanMeters: -AIRBUS_LOOK_LIMITS.leanMeters,
      rollDegrees: 0,
    })
  })

  it('recenters every look offset', () => {
    expect(recenterAirbusLook()).toEqual({
      yawDegrees: 0,
      pitchDegrees: 0,
      leanMeters: 0,
      rollDegrees: 0,
    })
  })
})
