export type EngineOutCheckpoint = 'recognition' | 'stabilization' | 'diversion'
export type EngineOutTrait = 'directionalControl' | 'energyDiscipline' | 'calmDiversion'
export type EngineOutFailureReason = 'attitude' | 'energy' | 'directional' | 'corridor'

export interface EngineOutInput {
  pitch: number
  bank: number
  thrust: number
}

export interface EngineOutAircraftState {
  pitch: number
  bank: number
  energy: number
  directionalError: number
  headingError: number
  leftEnginePower: number
  rightEnginePower: number
}

export interface EngineOutState {
  phase: 'flying' | 'checkpointFailed' | 'complete'
  checkpoint: EngineOutCheckpoint
  stageElapsedSeconds: number
  unsafeSeconds: number
  corridorProgress: number
  failureReason: EngineOutFailureReason | null
  aircraft: EngineOutAircraftState
  attempts: Record<EngineOutCheckpoint, number>
  performance: {
    energyUnsafeSeconds: number
    directionalUnsafeSeconds: number
  }
}

export interface EngineOutTransition {
  state: EngineOutState
  checkpointReached?: EngineOutCheckpoint
  failureReason?: EngineOutFailureReason
  completed?: boolean
  traits?: EngineOutTrait[]
}

export const ENGINE_OUT_TIMING = {
  recognitionSeconds: 10,
  stabilizationSeconds: 50,
  unsafeFailureSeconds: 5,
  maxFrameDeltaSeconds: 0.25,
} as const

export const ENGINE_OUT_ENVELOPE = {
  maximumPitchDegrees: 12,
  maximumBankDegrees: 25,
  minimumEnergy: 0.35,
  maximumEnergy: 0.65,
  maximumDirectionalError: 0.45,
} as const

const CRUISE_ENGINE_POWER = 0.72
const REDUCED_ENGINE_POWER = 0.28

/**
 * How strongly a right bank cancels the drift from the reduced ENG 1. There is no
 * separate directional (rudder) control: the owner asked for the sidestick arrows alone
 * (2026-11-09), so a gentle right bank is the correction. At 1.0 the drift stays inside
 * its limit for any right bank from 2.5° up to the 25° attitude limit. That range holds
 * the whole 8-24° SAFE RETURN band, so the drift meter and the bank meter never ask for
 * different things, and an over-bank is caught by the attitude envelope first.
 */
const BANK_DRIFT_AUTHORITY = 1

/**
 * SAFE RETURN is a turn, and a turn costs energy. In Diversion the right bank bleeds
 * speed, so the player alternates the arrow with paired thrust (owner, 2026-11-10: "the
 * banking right for the first part and the banking right and thrust for the 2nd part").
 * At 0.35, a held 16° bank with no thrust leaves the green band in about 1.4 s and fails
 * the stage in about 7 s. Tapping Increase every second or so holds it, holding thrust
 * through a 16° turn also holds it, and holding thrust through a shallow 10° turn
 * overspeeds. Diversion energy also responds more slowly (0.8/s, not 1.8/s), so the
 * bleed reads as gradual and thrust taps average out instead of spiking. Stabilization
 * has no bleed: the right bank alone is the job there.
 */
const DIVERSION_TURN_ENERGY_BLEED = 0.35
const DIVERSION_ENERGY_RESPONSIVENESS = 0.8
const ENERGY_RESPONSIVENESS = 1.8

function energyTarget(thrustInput: number, bankDegrees: number, checkpoint: EngineOutCheckpoint): number {
  const turnBleed = checkpoint === 'diversion'
    ? DIVERSION_TURN_ENERGY_BLEED * Math.max(0, bankDegrees) / ENGINE_OUT_ENVELOPE.maximumBankDegrees
    : 0
  return clamp(0.5 + thrustInput * 0.35 - turnBleed, 0.15, 0.85)
}

function driftTarget(engineAsymmetry: number, bankDegrees: number): number {
  return clamp(
    -engineAsymmetry * 1.25 + (bankDegrees / ENGINE_OUT_ENVELOPE.maximumBankDegrees) * BANK_DRIFT_AUTHORITY,
    -1,
    1,
  )
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function approach(current: number, target: number, responsiveness: number, seconds: number): number {
  const blend = 1 - Math.exp(-responsiveness * seconds)
  return current + (target - current) * blend
}

export function createEngineOutStateAtCheckpoint(checkpoint: EngineOutCheckpoint): EngineOutState {
  const reductionActive = checkpoint !== 'recognition'
  return {
    phase: 'flying',
    checkpoint,
    stageElapsedSeconds: 0,
    unsafeSeconds: 0,
    corridorProgress: 0,
    failureReason: null,
    aircraft: {
      pitch: 0,
      bank: 0,
      energy: 0.5,
      directionalError: 0,
      headingError: 0,
      leftEnginePower: reductionActive ? REDUCED_ENGINE_POWER : CRUISE_ENGINE_POWER,
      rightEnginePower: CRUISE_ENGINE_POWER,
    },
    attempts: {
      recognition: 0,
      stabilization: 0,
      diversion: 0,
    },
    performance: {
      energyUnsafeSeconds: 0,
      directionalUnsafeSeconds: 0,
    },
  }
}

function advanceEngineOutFixedStep(
  state: EngineOutState,
  input: EngineOutInput,
  stepSeconds: number,
): EngineOutTransition {
  if (state.checkpoint !== 'recognition') {
    const pitchInput = clamp(input.pitch, -1, 1)
    const bankInput = clamp(input.bank, -1, 1)
    const thrustInput = clamp(input.thrust, -1, 1)
    const engineAsymmetry = state.aircraft.rightEnginePower - state.aircraft.leftEnginePower
    const bank = approach(state.aircraft.bank, bankInput * 40, 2.4, stepSeconds)
    const directionalError = approach(
      state.aircraft.directionalError,
      driftTarget(engineAsymmetry, bank),
      2.2,
      stepSeconds,
    )
    const aircraft = {
      ...state.aircraft,
      pitch: approach(state.aircraft.pitch, pitchInput * 20, 2.4, stepSeconds),
      bank,
      energy: approach(
        state.aircraft.energy,
        energyTarget(thrustInput, bank, state.checkpoint),
        state.checkpoint === 'diversion' ? DIVERSION_ENERGY_RESPONSIVENESS : ENERGY_RESPONSIVENESS,
        stepSeconds,
      ),
      directionalError,
      headingError: state.aircraft.headingError + directionalError * 3 * stepSeconds,
    }
    const failureReason: EngineOutFailureReason | null =
      Math.abs(aircraft.pitch) > ENGINE_OUT_ENVELOPE.maximumPitchDegrees ||
      Math.abs(aircraft.bank) > ENGINE_OUT_ENVELOPE.maximumBankDegrees
        ? 'attitude'
        : aircraft.energy < ENGINE_OUT_ENVELOPE.minimumEnergy ||
            aircraft.energy > ENGINE_OUT_ENVELOPE.maximumEnergy
          ? 'energy'
          // A left bank now also drives the drift out of its band, because bank is
          // what cancels it. Name the corridor first so Diversion keeps its specific
          // "SAFE RETURN is to the right" coaching instead of the generic drift line.
          : state.checkpoint === 'diversion' && aircraft.bank < -5
            ? 'corridor'
            : Math.abs(aircraft.directionalError) >= ENGINE_OUT_ENVELOPE.maximumDirectionalError
              ? 'directional'
              : null
    const unsafeSeconds = failureReason
      ? state.unsafeSeconds + stepSeconds
      : state.unsafeSeconds
    const performance = {
      energyUnsafeSeconds: state.performance.energyUnsafeSeconds +
        (
          aircraft.energy < ENGINE_OUT_ENVELOPE.minimumEnergy ||
          aircraft.energy > ENGINE_OUT_ENVELOPE.maximumEnergy
            ? stepSeconds
            : 0
        ),
      directionalUnsafeSeconds: state.performance.directionalUnsafeSeconds +
        (
          Math.abs(aircraft.directionalError) >= ENGINE_OUT_ENVELOPE.maximumDirectionalError
            ? stepSeconds
            : 0
        ),
    }
    const corridorProgress = state.checkpoint === 'diversion'
      ? Math.min(1, state.corridorProgress +
          (Math.max(0, aircraft.bank) / 25) * (stepSeconds / 35))
      : state.corridorProgress
    if (failureReason && unsafeSeconds >= ENGINE_OUT_TIMING.unsafeFailureSeconds) {
      return {
        state: {
          ...state,
          phase: 'checkpointFailed',
          stageElapsedSeconds: state.stageElapsedSeconds + stepSeconds,
          unsafeSeconds,
          corridorProgress,
          failureReason,
          aircraft,
          performance,
        },
        failureReason,
      }
    }
    const stageElapsedSeconds = state.stageElapsedSeconds + stepSeconds
    if (state.checkpoint === 'diversion' && corridorProgress >= 1) {
      const traits: EngineOutTrait[] = []
      if (performance.directionalUnsafeSeconds === 0) traits.push('directionalControl')
      if (performance.energyUnsafeSeconds === 0) traits.push('energyDiscipline')
      if (state.attempts.diversion === 0) traits.push('calmDiversion')
      return {
        state: {
          ...state,
          phase: 'complete',
          stageElapsedSeconds,
          unsafeSeconds,
          corridorProgress,
          aircraft,
          performance,
        },
        completed: true,
        traits,
      }
    }
    if (
      state.checkpoint === 'stabilization' &&
      stageElapsedSeconds >= ENGINE_OUT_TIMING.stabilizationSeconds
    ) {
      const next = createEngineOutStateAtCheckpoint('diversion')
      return {
        state: {
          ...next,
          attempts: { ...state.attempts },
          performance,
        },
        checkpointReached: 'diversion',
      }
    }
    return {
      state: {
        ...state,
        stageElapsedSeconds,
        unsafeSeconds,
        corridorProgress,
        aircraft,
        performance,
      },
    }
  }

  const stageElapsedSeconds = state.stageElapsedSeconds + stepSeconds
  if (stageElapsedSeconds >= ENGINE_OUT_TIMING.recognitionSeconds) {
    const next = createEngineOutStateAtCheckpoint('stabilization')
    return {
      state: {
        ...next,
        attempts: { ...state.attempts },
        performance: { ...state.performance },
      },
      checkpointReached: 'stabilization',
    }
  }

  const reductionProgress = stageElapsedSeconds / ENGINE_OUT_TIMING.recognitionSeconds
  const leftEnginePower = CRUISE_ENGINE_POWER +
    (REDUCED_ENGINE_POWER - CRUISE_ENGINE_POWER) * reductionProgress
  const pitchInput = clamp(input.pitch, -1, 1)
  const bankInput = clamp(input.bank, -1, 1)
  const thrustInput = clamp(input.thrust, -1, 1)
  const engineAsymmetry = state.aircraft.rightEnginePower - leftEnginePower
  const bank = approach(state.aircraft.bank, bankInput * 40, 2.4, stepSeconds)
  const directionalError = approach(
    state.aircraft.directionalError,
    driftTarget(engineAsymmetry, bank),
    2.2,
    stepSeconds,
  )
  return {
    state: {
      ...state,
      stageElapsedSeconds,
      aircraft: {
        ...state.aircraft,
        pitch: approach(state.aircraft.pitch, pitchInput * 20, 2.4, stepSeconds),
        bank,
        energy: approach(state.aircraft.energy, energyTarget(thrustInput, bank, state.checkpoint), ENERGY_RESPONSIVENESS, stepSeconds),
        directionalError,
        headingError: state.aircraft.headingError + directionalError * 3 * stepSeconds,
        leftEnginePower,
      },
    },
  }
}

export function advanceEngineOut(
  state: EngineOutState,
  input: EngineOutInput,
  elapsedSeconds: number,
): EngineOutTransition {
  if (state.phase !== 'flying' || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    return { state }
  }

  let remaining = Math.min(elapsedSeconds, ENGINE_OUT_TIMING.maxFrameDeltaSeconds)
  let nextState = state
  let checkpointReached: EngineOutCheckpoint | undefined
  while (remaining > 0.000_001 && nextState.phase === 'flying') {
    const stepSeconds = Math.min(1 / 60, remaining)
    const transition = advanceEngineOutFixedStep(nextState, input, stepSeconds)
    nextState = transition.state
    checkpointReached = transition.checkpointReached ?? checkpointReached
    remaining -= stepSeconds
    if (transition.failureReason || transition.completed) {
      return {
        ...transition,
        checkpointReached,
      }
    }
  }

  return {
    state: nextState,
    checkpointReached,
  }
}

export function restartEngineOutCheckpoint(state: EngineOutState): EngineOutState {
  if (state.phase !== 'checkpointFailed') return state
  const restarted = createEngineOutStateAtCheckpoint(state.checkpoint)
  return {
    ...restarted,
    attempts: {
      ...state.attempts,
      [state.checkpoint]: state.attempts[state.checkpoint] + 1,
    },
    performance: { ...state.performance },
  }
}
