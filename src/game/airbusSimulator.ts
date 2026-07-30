import type { AirbusFlightInput } from './airbusInput'

export type FlightInput = Omit<AirbusFlightInput, 'directional'>

export type StormLineCheckpoint = 'stormEntry' | 'stormCore' | 'clearAir'
export type StormLinePhase = 'flying' | 'checkpointFailed' | 'complete'
export type StormLineFailureReason = 'attitude' | 'energy' | 'corridor'
export type StormLineTrait = 'calmControl' | 'weatherJudgment' | 'energyManagement'

export interface StormLineAircraftState {
  pitch: number
  bank: number
  pitchRate: number
  bankRate: number
  energy: number
  lateralPosition: number
}

export interface StormLineMetrics {
  smoothnessPenalty: number
  energyDeviationSeconds: number
  weatherJudgment: boolean
}

export interface StormLineState {
  seed: number
  phase: StormLinePhase
  checkpoint: StormLineCheckpoint
  elapsedSeconds: number
  checkpointElapsedSeconds: number
  aircraft: StormLineAircraftState
  weatherIntensity: number
  outsideEnvelopeSeconds: number
  failureReason: StormLineFailureReason | null
  attempts: Record<StormLineCheckpoint, number>
  metrics: StormLineMetrics
  traits: StormLineTrait[]
}

const FIXED_STEP_SECONDS = 1 / 60
const CHECKPOINT_START_SECONDS: Record<StormLineCheckpoint, number> = {
  stormEntry: 0,
  stormCore: 45,
  clearAir: 135,
}

function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0))
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function normalizeFlightInput(input: FlightInput): FlightInput {
  return {
    pitch: clampAxis(input.pitch),
    bank: clampAxis(input.bank),
    thrust: clampAxis(input.thrust),
  }
}

export function createStormLineState(seed = 1): StormLineState {
  return {
    seed,
    phase: 'flying',
    checkpoint: 'stormEntry',
    elapsedSeconds: 0,
    checkpointElapsedSeconds: 0,
    aircraft: {
      pitch: 0,
      bank: 0,
      pitchRate: 0,
      bankRate: 0,
      energy: 0.5,
      lateralPosition: 0,
    },
    weatherIntensity: 0.05,
    outsideEnvelopeSeconds: 0,
    failureReason: null,
    attempts: {
      stormEntry: 0,
      stormCore: 0,
      clearAir: 0,
    },
    metrics: {
      smoothnessPenalty: 0,
      energyDeviationSeconds: 0,
      weatherJudgment: false,
    },
    traits: [],
  }
}

function stormIntensity(elapsedSeconds: number): number {
  if (elapsedSeconds < 20) return 0.05
  if (elapsedSeconds < 75) return 0.35
  if (elapsedSeconds < 135) return 0.85
  if (elapsedSeconds < 165) return 0.25
  return 0.05
}

export function createStormLineStateAtCheckpoint(
  checkpoint: StormLineCheckpoint,
  attempts?: Record<StormLineCheckpoint, number>,
  seed = 1,
): StormLineState {
  const initial = createStormLineState(seed)
  const elapsedSeconds = CHECKPOINT_START_SECONDS[checkpoint]
  return {
    ...initial,
    checkpoint,
    elapsedSeconds,
    aircraft: {
      ...initial.aircraft,
      lateralPosition: checkpoint === 'stormEntry' ? 0 : -0.7,
    },
    weatherIntensity: stormIntensity(elapsedSeconds),
    attempts: attempts ? { ...attempts } : initial.attempts,
  }
}

function completeStormLine(state: StormLineState): StormLineState {
  const attempts = Object.values(state.attempts).reduce((total, count) => total + count, 0)
  const traits: StormLineTrait[] = []
  if (attempts === 0 && state.metrics.smoothnessPenalty < 60) traits.push('calmControl')
  if (state.metrics.weatherJudgment) traits.push('weatherJudgment')
  if (state.metrics.energyDeviationSeconds < 10) traits.push('energyManagement')
  return {
    ...state,
    phase: 'complete',
    traits,
  }
}

function applyScenarioBoundaries(state: StormLineState): StormLineState {
  if (state.checkpoint === 'stormEntry' && state.elapsedSeconds >= CHECKPOINT_START_SECONDS.stormCore) {
    if (state.aircraft.lateralPosition > -0.35) {
      return {
        ...state,
        phase: 'checkpointFailed',
        failureReason: 'corridor',
      }
    }
    return {
      ...state,
      checkpoint: 'stormCore',
      checkpointElapsedSeconds: 0,
      metrics: {
        ...state.metrics,
        weatherJudgment: true,
      },
    }
  }

  if (state.checkpoint === 'stormCore' && state.elapsedSeconds >= CHECKPOINT_START_SECONDS.clearAir) {
    return {
      ...state,
      checkpoint: 'clearAir',
      checkpointElapsedSeconds: 0,
    }
  }

  if (state.checkpoint === 'clearAir' && state.elapsedSeconds >= 165) {
    return completeStormLine(state)
  }

  const attitudeOutside = Math.abs(state.aircraft.pitch) > 20 || Math.abs(state.aircraft.bank) > 45
  const energyOutside = state.aircraft.energy < 0.15 || state.aircraft.energy > 0.85
  const corridorOutside = state.checkpoint !== 'stormEntry'
    && Math.abs(state.aircraft.lateralPosition + 0.7) > 1
  const outsideEnvelope = attitudeOutside || energyOutside || corridorOutside
  const outsideEnvelopeSeconds = outsideEnvelope
    ? state.outsideEnvelopeSeconds + FIXED_STEP_SECONDS
    : Math.max(0, state.outsideEnvelopeSeconds - FIXED_STEP_SECONDS * 2)

  if (outsideEnvelopeSeconds >= 5) {
    return {
      ...state,
      phase: 'checkpointFailed',
      outsideEnvelopeSeconds,
      failureReason: attitudeOutside ? 'attitude' : energyOutside ? 'energy' : 'corridor',
    }
  }

  return {
    ...state,
    outsideEnvelopeSeconds,
  }
}

function advanceFixedStep(state: StormLineState, input: FlightInput, stepSeconds: number): StormLineState {
  const elapsedSeconds = state.elapsedSeconds + stepSeconds
  const weatherIntensity = stormIntensity(elapsedSeconds)
  const pitchGust = Math.sin(elapsedSeconds * 3.71 + state.seed * 0.83) * weatherIntensity * 0.42
  const bankGust = Math.sin(elapsedSeconds * 2.13 + state.seed * 1.37) * weatherIntensity * 1.1
  const pitchTargetRate = input.pitch * 8
  const bankTargetRate = input.bank * 30
  const pitchRate = state.aircraft.pitchRate + (pitchTargetRate - state.aircraft.pitchRate) * Math.min(1, stepSeconds * 3.6)
  const bankRate = state.aircraft.bankRate + (bankTargetRate - state.aircraft.bankRate) * Math.min(1, stepSeconds * 3.2)
  const pitch = state.aircraft.pitch + (pitchRate + pitchGust) * stepSeconds
  const bank = state.aircraft.bank + (bankRate + bankGust) * stepSeconds
  const energy = clamp01(
    state.aircraft.energy
      + input.thrust * 0.11 * stepSeconds
      - (state.aircraft.energy - 0.5) * 0.018 * stepSeconds,
  )
  const lateralPosition = state.aircraft.lateralPosition + Math.sin(bank * Math.PI / 180) * 0.2 * stepSeconds
  const smoothnessPenalty = state.metrics.smoothnessPenalty
    + (Math.abs(pitchRate - state.aircraft.pitchRate) + Math.abs(bankRate - state.aircraft.bankRate)) * stepSeconds
  const energyDeviationSeconds = state.metrics.energyDeviationSeconds
    + (energy < 0.35 || energy > 0.65 ? stepSeconds : 0)

  return applyScenarioBoundaries({
    ...state,
    elapsedSeconds,
    checkpointElapsedSeconds: state.checkpointElapsedSeconds + stepSeconds,
    aircraft: {
      pitch,
      bank,
      pitchRate,
      bankRate,
      energy,
      lateralPosition,
    },
    weatherIntensity,
    metrics: {
      ...state.metrics,
      smoothnessPenalty,
      energyDeviationSeconds,
    },
  })
}

export function advanceStormLine(
  state: StormLineState,
  rawInput: FlightInput,
  deltaSeconds: number,
): StormLineState {
  if (state.phase !== 'flying' || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return state
  const input = normalizeFlightInput(rawInput)
  let remaining = Math.min(deltaSeconds, 5)
  let next = state

  while (remaining > 0) {
    const step = Math.min(FIXED_STEP_SECONDS, remaining)
    next = advanceFixedStep(next, input, step)
    remaining -= step
    if (next.phase !== 'flying') break
  }

  return next
}

export function restartStormLineCheckpoint(state: StormLineState): StormLineState {
  if (state.phase !== 'checkpointFailed') return state
  const checkpoint = state.checkpoint
  return {
    ...state,
    phase: 'flying',
    elapsedSeconds: CHECKPOINT_START_SECONDS[checkpoint],
    checkpointElapsedSeconds: 0,
    aircraft: {
      pitch: 0,
      bank: 0,
      pitchRate: 0,
      bankRate: 0,
      energy: 0.5,
      lateralPosition: checkpoint === 'stormEntry' ? 0 : -0.7,
    },
    weatherIntensity: stormIntensity(CHECKPOINT_START_SECONDS[checkpoint]),
    outsideEnvelopeSeconds: 0,
    failureReason: null,
    attempts: {
      ...state.attempts,
      [checkpoint]: state.attempts[checkpoint] + 1,
    },
  }
}
