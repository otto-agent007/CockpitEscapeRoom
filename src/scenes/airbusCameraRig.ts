import { MathUtils, Quaternion } from 'three'

export const AIRBUS_CAMERA_TRANSITION_SECONDS = 1.25

export const AIRBUS_LOOK_LIMITS = {
  yawDegrees: 10,
  pitchDegrees: 6,
  leanMeters: 0.015,
} as const

export interface AirbusCameraPose {
  position: [number, number, number]
  quaternion: [number, number, number, number]
  verticalFov: number
}

export interface AirbusLookOffset {
  yawDegrees: number
  pitchDegrees: number
  leanMeters: number
  rollDegrees: number
}

export function recenterAirbusLook(): AirbusLookOffset {
  return {
    yawDegrees: 0,
    pitchDegrees: 0,
    leanMeters: 0,
    rollDegrees: 0,
  }
}

export function clampAirbusLook(offset: AirbusLookOffset): AirbusLookOffset {
  return {
    yawDegrees: MathUtils.clamp(
      offset.yawDegrees,
      -AIRBUS_LOOK_LIMITS.yawDegrees,
      AIRBUS_LOOK_LIMITS.yawDegrees,
    ),
    pitchDegrees: MathUtils.clamp(
      offset.pitchDegrees,
      -AIRBUS_LOOK_LIMITS.pitchDegrees,
      AIRBUS_LOOK_LIMITS.pitchDegrees,
    ),
    leanMeters: MathUtils.clamp(
      offset.leanMeters,
      -AIRBUS_LOOK_LIMITS.leanMeters,
      AIRBUS_LOOK_LIMITS.leanMeters,
    ),
    rollDegrees: 0,
  }
}

export function interpolateAirbusCameraPose(
  from: AirbusCameraPose,
  to: AirbusCameraPose,
  progress: number,
): AirbusCameraPose {
  const bounded = MathUtils.clamp(progress, 0, 1)
  if (bounded === 0) return from
  if (bounded === 1) return to
  const eased = bounded * bounded * (3 - 2 * bounded)
  const quaternion = new Quaternion(...from.quaternion).slerp(
    new Quaternion(...to.quaternion),
    eased,
  )
  return {
    position: [
      MathUtils.lerp(from.position[0], to.position[0], eased),
      MathUtils.lerp(from.position[1], to.position[1], eased),
      MathUtils.lerp(from.position[2], to.position[2], eased),
    ],
    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
    verticalFov: MathUtils.lerp(from.verticalFov, to.verticalFov, eased),
  }
}
