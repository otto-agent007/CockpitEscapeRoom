import type { CockpitOrientationId } from '../game/state'

export const COCKPIT_ORIENTATION_DURATION_SECONDS = 4.5

export interface CockpitOrientationOffset {
  yawRadians: number
  pitchRadians: number
  leanMeters: number
  fovDegrees: number
  progress: number
  complete: boolean
}

type OrientationKeyframe = Omit<CockpitOrientationOffset, 'progress' | 'complete'> & {
  progress: number
}

type OrientationTimeline = readonly [
  OrientationKeyframe,
  OrientationKeyframe,
  ...OrientationKeyframe[],
]

const DC9_ORIENTATION: OrientationTimeline = [
  { progress: 0, yawRadians: 0.07, pitchRadians: 0.12, leanMeters: 0, fovDegrees: 8 },
  { progress: 0.23, yawRadians: 0.28, pitchRadians: 0.16, leanMeters: -0.006, fovDegrees: 6 },
  { progress: 0.5, yawRadians: -0.5, pitchRadians: 0.1, leanMeters: 0.006, fovDegrees: 8 },
  { progress: 0.74, yawRadians: 0.12, pitchRadians: -0.02, leanMeters: -0.004, fovDegrees: 3 },
  { progress: 1, yawRadians: 0, pitchRadians: 0, leanMeters: 0, fovDegrees: 0 },
]

const AIRBUS_ORIENTATION: OrientationTimeline = [
  { progress: 0, yawRadians: 0, pitchRadians: 0, leanMeters: 0, fovDegrees: 8 },
  { progress: 0.23, yawRadians: 0.22, pitchRadians: 0.08, leanMeters: 0.006, fovDegrees: 7 },
  { progress: 0.5, yawRadians: -0.28, pitchRadians: -0.05, leanMeters: -0.008, fovDegrees: 8 },
  { progress: 0.74, yawRadians: 0.1, pitchRadians: -0.12, leanMeters: 0.004, fovDegrees: 4 },
  { progress: 1, yawRadians: 0, pitchRadians: 0, leanMeters: 0, fovDegrees: 0 },
]

const SETTLED_ORIENTATION: CockpitOrientationOffset = {
  yawRadians: 0,
  pitchRadians: 0,
  leanMeters: 0,
  fovDegrees: 0,
  progress: 1,
  complete: true,
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value)
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress
}

export function sampleCockpitOrientation(
  cockpit: CockpitOrientationId,
  elapsedSeconds: number,
): CockpitOrientationOffset {
  const safeElapsed = Number.isNaN(elapsedSeconds)
    ? 0
    : elapsedSeconds === Number.POSITIVE_INFINITY
      ? COCKPIT_ORIENTATION_DURATION_SECONDS
      : Math.max(0, Math.min(COCKPIT_ORIENTATION_DURATION_SECONDS, elapsedSeconds))
  const progress = safeElapsed / COCKPIT_ORIENTATION_DURATION_SECONDS
  if (progress >= 1) return { ...SETTLED_ORIENTATION }

  const keyframes = cockpit === 'dc9' ? DC9_ORIENTATION : AIRBUS_ORIENTATION
  let from = keyframes[0]
  if (progress <= from.progress) {
    return {
      yawRadians: from.yawRadians,
      pitchRadians: from.pitchRadians,
      leanMeters: from.leanMeters,
      fovDegrees: from.fovDegrees,
      progress,
      complete: false,
    }
  }

  for (const to of keyframes.slice(1)) {
    if (progress <= to.progress) {
      const segmentProgress = smoothstep(
        (progress - from.progress) / (to.progress - from.progress),
      )
      return {
        yawRadians: interpolate(from.yawRadians, to.yawRadians, segmentProgress),
        pitchRadians: interpolate(from.pitchRadians, to.pitchRadians, segmentProgress),
        leanMeters: interpolate(from.leanMeters, to.leanMeters, segmentProgress),
        fovDegrees: interpolate(from.fovDegrees, to.fovDegrees, segmentProgress),
        progress,
        complete: false,
      }
    }
    from = to
  }

  return { ...SETTLED_ORIENTATION }
}
