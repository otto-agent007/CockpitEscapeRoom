import {
  STORM_CHECKPOINT_START_SECONDS,
  STORM_CORRIDOR_CENTER,
  STORM_CORRIDOR_HALF_WIDTH,
  STORM_ENTRY_GATE_LATERAL,
  type StormLineState,
} from './airbusSimulator'

export type StormRouteTone = 'action' | 'urgent' | 'hold' | 'settled'

export interface StormDriftMeter {
  /** 0 = far west (left) end of the fixed lateral scale, 1 = far east (right). */
  position: number
  /** Start/end of the safe band on the same 0..1 scale. */
  bandStart: number
  bandEnd: number
}

export interface StormRouteGuidance {
  tone: StormRouteTone
  message: string
  meter: StormDriftMeter
}

/**
 * Fixed lateral scale for the drift meter. It spans slightly past both corridor
 * edges so the marker still moves visibly when the aircraft is outside the band.
 */
const METER_LATERAL_WEST = -2
const METER_LATERAL_EAST = 0.6
const ENTRY_URGENT_WINDOW_SECONDS = 15
const CORRIDOR_EDGE_WARNING_RATIO = 0.75

function meterPosition(lateralPosition: number): number {
  const span = METER_LATERAL_EAST - METER_LATERAL_WEST
  return Math.max(0, Math.min(1, (lateralPosition - METER_LATERAL_WEST) / span))
}

function corridorWestEdge(): number {
  return STORM_CORRIDOR_CENTER - STORM_CORRIDOR_HALF_WIDTH
}

export function deriveStormRouteGuidance(state: StormLineState): StormRouteGuidance | null {
  if (state.phase !== 'flying') return null

  const lateral = state.aircraft.lateralPosition
  const position = meterPosition(lateral)

  if (state.checkpoint === 'stormEntry') {
    const meter: StormDriftMeter = {
      position,
      bandStart: meterPosition(corridorWestEdge()),
      bandEnd: meterPosition(STORM_ENTRY_GATE_LATERAL),
    }
    if (lateral > STORM_ENTRY_GATE_LATERAL) {
      const secondsToGate = Math.max(
        0,
        STORM_CHECKPOINT_START_SECONDS.stormCore - state.elapsedSeconds,
      )
      if (secondsToGate <= ENTRY_URGENT_WINDOW_SECONDS) {
        return {
          tone: 'urgent',
          message: `Weather entry closes in ${Math.max(1, Math.ceil(secondsToGate))}s — keep coming left.`,
          meter,
        }
      }
      return {
        tone: 'action',
        message: 'Bank left into the west lane — settle the marker in the green band.',
        meter,
      }
    }
    if (lateral < corridorWestEdge() + 0.15) {
      return {
        tone: 'urgent',
        message: 'Far enough left — level the wings before the lane edge.',
        meter,
      }
    }
    return {
      tone: 'settled',
      message: 'In the west lane. Level the wings and hold the GAP line near the nose.',
      meter,
    }
  }

  const meter: StormDriftMeter = {
    position,
    bandStart: meterPosition(corridorWestEdge()),
    bandEnd: meterPosition(STORM_CORRIDOR_CENTER + STORM_CORRIDOR_HALF_WIDTH),
  }
  const offset = lateral - STORM_CORRIDOR_CENTER
  if (Math.abs(offset) > STORM_CORRIDOR_HALF_WIDTH) {
    return {
      tone: 'urgent',
      message: offset > 0
        ? 'Outside the corridor — bank left to re-center.'
        : 'Outside the corridor — bank right to re-center.',
      meter,
    }
  }
  if (Math.abs(offset) > STORM_CORRIDOR_HALF_WIDTH * CORRIDOR_EDGE_WARNING_RATIO) {
    return {
      tone: 'action',
      message: offset > 0
        ? 'Drifting toward the corridor edge — ease back left.'
        : 'Drifting toward the corridor edge — ease back right.',
      meter,
    }
  }
  return {
    tone: 'hold',
    message: 'In the corridor. Small corrections only.',
    meter,
  }
}
