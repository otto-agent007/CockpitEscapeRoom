import type { EngineOutState } from './airbusEngineOut'
import type { StormLineCheckpoint, StormLineState } from './airbusSimulator'

/**
 * Where the aircraft has got to relative to the authored weather field.
 *
 * `headingOffsetDegrees` is the nose direction measured against the corridor
 * course the field was authored around, so the shared weather field can rotate
 * every cell and the gap by one value. `closureNm` is how far the aircraft has
 * flown into the field.
 */
export interface AirbusOwnshipTrack {
  headingOffsetDegrees: number
  closureNm: number
}

export const ZERO_AIRBUS_OWNSHIP_TRACK: AirbusOwnshipTrack = {
  headingOffsetDegrees: 0,
  closureNm: 0,
}

/**
 * Cross-track is integrated as `sin(bank) * 0.2`, and heading is the integral
 * of a turn rate that is also proportional to `sin(bank)`. Heading is therefore
 * exactly proportional to the cross-track travelled since the checkpoint began,
 * which is why no separate heading integrator is needed.
 */
const DEGREES_PER_CROSS_TRACK_UNIT = 30
const MAX_HEADING_OFFSET_DEGREES = 45

/** Soft cap so the authored far depth band survives a full scenario run. */
export const MAX_AIRBUS_CLOSURE_NM = 8

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : 0))
}

export function stormLineCheckpointStartLateral(checkpoint: StormLineCheckpoint): number {
  return checkpoint === 'stormEntry' ? 0 : -0.7
}

export function stormLineOwnshipTrack(state: StormLineState): AirbusOwnshipTrack {
  const startLateral = stormLineCheckpointStartLateral(state.checkpoint)
  const crossTrackTravelled = state.aircraft.lateralPosition - startLateral
  return {
    headingOffsetDegrees: clamp(
      crossTrackTravelled * DEGREES_PER_CROSS_TRACK_UNIT,
      -MAX_HEADING_OFFSET_DEGREES,
      MAX_HEADING_OFFSET_DEGREES,
    ),
    closureNm: clamp(state.aircraft.trackDistanceNm, 0, MAX_AIRBUS_CLOSURE_NM),
  }
}

export function engineOutOwnshipTrack(state: EngineOutState): AirbusOwnshipTrack {
  return {
    headingOffsetDegrees: clamp(
      state.aircraft.headingError,
      -MAX_HEADING_OFFSET_DEGREES,
      MAX_HEADING_OFFSET_DEGREES,
    ),
    closureNm: clamp(state.stageElapsedSeconds * 0.03, 0, MAX_AIRBUS_CLOSURE_NM),
  }
}
