export type EngineOutCheckpoint = 'recognition' | 'stabilization' | 'diversion'
export type EngineOutTrait = 'directionalControl' | 'energyDiscipline' | 'calmDiversion'
export type EngineOutFailureReason = 'attitude' | 'energy' | 'directional' | 'corridor'

export interface EngineOutInput {
  pitch: number
  bank: number
  thrust: number
  directional: number
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

export function advanceEngineOut(
  state: EngineOutState,
  input: EngineOutInput,
  elapsedSeconds: number,
): EngineOutTransition {
  if (state.phase !== 'flying' || elapsedSeconds <= 0) return { state }

  const stepSeconds = Math.min(elapsedSeconds, ENGINE_OUT_TIMING.maxFrameDeltaSeconds)
  if (state.checkpoint !== 'recognition') {
    const pitchInput = clamp(input.pitch, -1, 1)
    const bankInput = clamp(input.bank, -1, 1)
    const thrustInput = clamp(input.thrust, -1, 1)
    const directionalInput = clamp(input.directional, -1, 1)
    const engineAsymmetry = state.aircraft.rightEnginePower - state.aircraft.leftEnginePower
    const directionalError = approach(
      state.aircraft.directionalError,
      clamp(-engineAsymmetry * 1.25 + directionalInput * 1.2, -1, 1),
      2.2,
      stepSeconds,
    )
    const aircraft = {
      ...state.aircraft,
      pitch: approach(state.aircraft.pitch, pitchInput * 20, 2.4, stepSeconds),
      bank: approach(state.aircraft.bank, bankInput * 40, 2.4, stepSeconds),
      energy: approach(state.aircraft.energy, clamp(0.5 + thrustInput * 0.35, 0.15, 0.85), 1.8, stepSeconds),
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
          : Math.abs(aircraft.directionalError) >= ENGINE_OUT_ENVELOPE.maximumDirectionalError
            ? 'directional'
            : state.checkpoint === 'diversion' && aircraft.bank < -5
              ? 'corridor'
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
  return {
    state: {
      ...state,
      stageElapsedSeconds,
      aircraft: {
        ...state.aircraft,
        leftEnginePower: CRUISE_ENGINE_POWER +
          (REDUCED_ENGINE_POWER - CRUISE_ENGINE_POWER) * reductionProgress,
      },
    },
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
