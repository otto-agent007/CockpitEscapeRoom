export const AIRBUS_SCENARIOS = ['stormLine', 'engineOut'] as const

export type AirbusScenarioId = (typeof AIRBUS_SCENARIOS)[number]
export type AirbusScenarioLocation = 'qualification' | 'hub' | AirbusScenarioId
export type AirbusScenarioAvailability = 'locked' | 'ready' | 'replay'
export type { EngineOutCheckpoint, EngineOutTrait } from './airbusEngineOut'

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
