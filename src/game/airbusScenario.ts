import {
  advanceEngineOut,
  type EngineOutCheckpoint,
  type EngineOutFailureReason,
  type EngineOutState,
  type EngineOutTrait,
} from './airbusEngineOut'
import type { AirbusFlightInput } from './airbusInput'
import type { AirbusWorkloadTaskId } from './airbusWorkload'
import {
  advanceStormLine,
  type StormLineCheckpoint,
  type StormLineFailureReason,
  type StormLineState,
  type StormLineTrait,
} from './airbusSimulator'

export const AIRBUS_SCENARIOS = ['stormLine', 'engineOut'] as const

export type AirbusScenarioId = (typeof AIRBUS_SCENARIOS)[number]
export type AirbusScenarioLocation = 'qualification' | 'hub' | AirbusScenarioId
export type AirbusScenarioAvailability = 'locked' | 'ready' | 'replay'
export type { EngineOutCheckpoint, EngineOutTrait }

export type AirbusActiveSimulationFrame =
  | { scenario: 'stormLine'; state: StormLineState }
  | { scenario: 'engineOut'; state: EngineOutState }

export interface AirbusScenarioFrameTransition {
  frame: AirbusActiveSimulationFrame
  checkpointReached?: StormLineCheckpoint | EngineOutCheckpoint
  failureReason?: StormLineFailureReason | EngineOutFailureReason
  completed?: boolean
  traits?: StormLineTrait[] | EngineOutTrait[]
  workloadGate?: AirbusWorkloadTaskId
}

export interface AirbusScenarioGateProgress {
  qualified: boolean
  stormCompleted: boolean
  engineOutCompleted: boolean
}

export function getAirbusScenarioAvailability(
  scenario: AirbusScenarioId,
  progress: AirbusScenarioGateProgress,
): AirbusScenarioAvailability {
  if (!progress.qualified) return 'locked'

  if (scenario === 'stormLine') {
    return progress.stormCompleted ? 'replay' : 'ready'
  }

  if (!progress.stormCompleted) return 'locked'
  return progress.engineOutCompleted ? 'replay' : 'ready'
}

export function advanceAirbusScenarioFrame(
  frame: AirbusActiveSimulationFrame,
  input: AirbusFlightInput,
  elapsedSeconds: number,
  completedWorkloadTasks: readonly AirbusWorkloadTaskId[] = [],
): AirbusScenarioFrameTransition {
  if (frame.scenario === 'stormLine') {
    const state = advanceStormLine(frame.state, input, elapsedSeconds)
    const workloadGate = frame.state.checkpoint === 'stormEntry' &&
      state.checkpoint === 'stormCore'
      ? 'stormScanRange'
      : frame.state.checkpoint === 'stormCore' && state.checkpoint === 'clearAir'
        ? 'stormGapSelection'
        : null
    if (workloadGate && !completedWorkloadTasks.includes(workloadGate)) {
      return { frame, workloadGate }
    }
    return {
      frame: { scenario: 'stormLine', state },
      checkpointReached: state.checkpoint !== frame.state.checkpoint
        ? state.checkpoint
        : undefined,
      failureReason: state.failureReason ?? undefined,
      completed: state.phase === 'complete',
      traits: state.phase === 'complete' ? state.traits : undefined,
    }
  }

  const transition = advanceEngineOut(frame.state, input, elapsedSeconds)
  const workloadGate = frame.state.checkpoint === 'recognition' &&
    transition.state.checkpoint === 'stabilization'
    ? 'engineEventAcknowledgement'
    : frame.state.checkpoint === 'diversion' && transition.completed
      ? 'engineSafeReturnSelection'
      : null
  if (workloadGate && !completedWorkloadTasks.includes(workloadGate)) {
    return { frame, workloadGate }
  }
  return {
    frame: { scenario: 'engineOut', state: transition.state },
    checkpointReached: transition.checkpointReached,
    failureReason: transition.failureReason,
    completed: transition.completed,
    traits: transition.traits,
  }
}
