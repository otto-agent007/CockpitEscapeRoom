import { ENGINE_OUT_ENVELOPE, type EngineOutState } from './airbusEngineOut'
import {
  STORM_CHECKPOINT_START_SECONDS,
  STORM_CORRIDOR_CENTER,
  STORM_CORRIDOR_HALF_WIDTH,
  STORM_ENTRY_GATE_LATERAL,
  type StormLineState,
} from './airbusSimulator'

export type AirbusRouteTone = 'action' | 'urgent' | 'hold' | 'settled'

export interface AirbusRouteMeter {
  /** 0 = far left end of the fixed scale, 1 = far right. */
  position: number
  /** Start/end of the safe band on the same 0..1 scale. */
  bandStart: number
  bandEnd: number
  /** Short end labels for the meter extremes (e.g. W/E or L/R). */
  leftLabel: string
  rightLabel: string
}

export interface AirbusRouteGuidance {
  tone: AirbusRouteTone
  message: string
  meter: AirbusRouteMeter
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/**
 * Fixed lateral scale for the storm drift meter. It spans slightly past both
 * corridor edges so the marker still moves visibly when the aircraft is
 * outside the band.
 */
const METER_LATERAL_WEST = -2
const METER_LATERAL_EAST = 0.6
const ENTRY_URGENT_WINDOW_SECONDS = 15
const CORRIDOR_EDGE_WARNING_RATIO = 0.75

function stormMeterPosition(lateralPosition: number): number {
  const span = METER_LATERAL_EAST - METER_LATERAL_WEST
  return clamp01((lateralPosition - METER_LATERAL_WEST) / span)
}

function corridorWestEdge(): number {
  return STORM_CORRIDOR_CENTER - STORM_CORRIDOR_HALF_WIDTH
}

export function deriveStormRouteGuidance(state: StormLineState): AirbusRouteGuidance | null {
  if (state.phase !== 'flying') return null

  const lateral = state.aircraft.lateralPosition
  const position = stormMeterPosition(lateral)

  if (state.checkpoint === 'stormEntry') {
    const meter: AirbusRouteMeter = {
      position,
      bandStart: stormMeterPosition(corridorWestEdge()),
      bandEnd: stormMeterPosition(STORM_ENTRY_GATE_LATERAL),
      leftLabel: 'W',
      rightLabel: 'E',
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

  const meter: AirbusRouteMeter = {
    position,
    bandStart: stormMeterPosition(corridorWestEdge()),
    bandEnd: stormMeterPosition(STORM_CORRIDOR_CENTER + STORM_CORRIDOR_HALF_WIDTH),
    leftLabel: 'W',
    rightLabel: 'E',
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

/**
 * Engine-Out drives two different meters: the directional-drift marker while
 * the reduction is pulling the nose left, then the bank marker once SAFE
 * RETURN tracking is what completes the exercise. The drift limit and the
 * bank band come straight from the enforced envelope so the meter never
 * disagrees with the flight model.
 */
const DIVERSION_BANK_SCALE_DEGREES = 30
const DIVERSION_BANK_BAND_DEGREES: readonly [number, number] = [8, 24]
const DRIFT_NOTICE_THRESHOLD = 0.15
const DRIFT_ACTION_THRESHOLD = 0.25
const DIVERSION_DRIFT_PRIORITY_THRESHOLD = 0.35

function directionalMeter(error: number): AirbusRouteMeter {
  return {
    position: clamp01((error + 1) / 2),
    bandStart: (1 - ENGINE_OUT_ENVELOPE.maximumDirectionalError) / 2,
    bandEnd: (1 + ENGINE_OUT_ENVELOPE.maximumDirectionalError) / 2,
    leftLabel: 'L',
    rightLabel: 'R',
  }
}

function diversionBankMeter(bank: number): AirbusRouteMeter {
  const scale = DIVERSION_BANK_SCALE_DEGREES
  return {
    position: clamp01((bank + scale) / (scale * 2)),
    bandStart: (DIVERSION_BANK_BAND_DEGREES[0] + scale) / (scale * 2),
    bandEnd: (DIVERSION_BANK_BAND_DEGREES[1] + scale) / (scale * 2),
    leftLabel: 'L',
    rightLabel: 'R',
  }
}

export function deriveEngineOutRouteGuidance(state: EngineOutState): AirbusRouteGuidance | null {
  if (state.phase !== 'flying') return null

  const error = state.aircraft.directionalError

  if (state.checkpoint === 'recognition') {
    if (Math.abs(error) >= DRIFT_NOTICE_THRESHOLD) {
      return {
        tone: 'action',
        message: 'The training reduction is pulling the nose left — hold Balance right to center the drift marker.',
        meter: directionalMeter(error),
      }
    }
    return {
      tone: 'settled',
      message: 'Deliberate training event — SIM ENG 1 is reducing. Acknowledge it on the upper ECAM.',
      meter: directionalMeter(error),
    }
  }

  if (state.checkpoint === 'stabilization') {
    if (Math.abs(error) >= ENGINE_OUT_ENVELOPE.maximumDirectionalError) {
      return {
        tone: 'urgent',
        message: error < 0
          ? 'Drift is past the training limit — hold more right balance.'
          : 'Too much right balance — ease it off.',
        meter: directionalMeter(error),
      }
    }
    if (Math.abs(error) >= DRIFT_ACTION_THRESHOLD) {
      return {
        tone: 'action',
        message: error < 0
          ? 'Nose drifting left — add right balance.'
          : 'Ease the right balance.',
        meter: directionalMeter(error),
      }
    }
    return {
      tone: 'hold',
      message: 'Balanced. Guard pitch, bank, and the green energy band.',
      meter: directionalMeter(error),
    }
  }

  if (Math.abs(error) >= DIVERSION_DRIFT_PRIORITY_THRESHOLD) {
    return {
      tone: 'urgent',
      message: error < 0
        ? 'Hold the right balance while you turn — the drift is building.'
        : 'Ease the right balance while you turn.',
      meter: directionalMeter(error),
    }
  }

  const bank = state.aircraft.bank
  if (bank < 0) {
    return {
      tone: 'urgent',
      message: 'SAFE RETURN is to the right — roll right of level.',
      meter: diversionBankMeter(bank),
    }
  }
  if (bank < DIVERSION_BANK_BAND_DEGREES[0]) {
    return {
      tone: 'action',
      message: 'Roll into a gentle right bank and hold it to track SAFE RETURN.',
      meter: diversionBankMeter(bank),
    }
  }
  if (bank > DIVERSION_BANK_BAND_DEGREES[1]) {
    return {
      tone: 'urgent',
      message: 'Bank is at the training limit — ease back toward 20°.',
      meter: diversionBankMeter(bank),
    }
  }
  return {
    tone: 'settled',
    message: 'On the SAFE RETURN arc — hold this bank.',
    meter: diversionBankMeter(bank),
  }
}
