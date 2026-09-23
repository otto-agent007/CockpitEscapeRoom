import type { CockpitOrientationId } from '../game/state'

export const COCKPIT_ORIENTATION_DURATION_SECONDS = 4.5

/**
 * The most tour time a single frame may add. A frame that arrives after a long
 * stall (a big model decoding under a software renderer, or a tab coming back
 * from the background) would otherwise add the whole stall at once and skip most
 * of a 4.5 s tour; CI saw one frame jump the DC-9 tour from 38% to done
 * (three 0.186 / @react-three/fiber 9.8, 2026-09-23). Capped, a stall pauses the
 * tour instead. The cap is 0.5 s (at least 9 frames per tour), not a frame's worth:
 * headless and low-end renderers draw these cockpits at a few fps. Measured locally
 * against no cap: 1/15 s turned the tour into slow motion and timed the Airbus test
 * out; 0.25 s still slowed it (DC-9 test 37.6 s vs 20.8 s uncapped).
 */
export const MAX_ORIENTATION_FRAME_SECONDS = 0.5

export function orientationFrameDelta(delta: number): number {
  if (!Number.isFinite(delta) || delta <= 0) return 0
  return Math.min(delta, MAX_ORIENTATION_FRAME_SECONDS)
}

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
