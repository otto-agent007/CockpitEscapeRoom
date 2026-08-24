import type { EngineOutCheckpoint } from './airbusEngineOut'
import type { AirbusScenarioId } from './airbusScenario'
import type { StormLineCheckpoint } from './airbusSimulator'

export const AIRBUS_WORKLOAD_TASKS = [
  'stormScanRange',
  'stormGapSelection',
  'engineEventAcknowledgement',
  'engineSafeReturnSelection',
] as const

export type AirbusWorkloadTaskId = (typeof AIRBUS_WORKLOAD_TASKS)[number]
export type AirbusScanRange = 'near' | 'mid' | 'far'
export type AirbusWeatherSector = 'west' | 'center' | 'east'
export type AirbusSafeReturnSide = 'left' | 'right'

export type AirbusWorkloadAction =
  | { type: 'cycleScanRange' }
  | { type: 'selectWeatherSector'; sector: AirbusWeatherSector }
  | { type: 'acknowledgeEngineEvent' }
  | { type: 'selectSafeReturn'; side: AirbusSafeReturnSide }

export interface AirbusWorkloadProgress {
  scanRange: AirbusScanRange
  selectedWeatherSector: AirbusWeatherSector | null
  selectedSafeReturnSide: AirbusSafeReturnSide | null
  completedTasks: AirbusWorkloadTaskId[]
  attempts: Record<AirbusWorkloadTaskId, number>
}

export interface AirbusWorkloadResult {
  progress: AirbusWorkloadProgress
  outcome: 'correct' | 'incorrect' | 'ignored'
  task: AirbusWorkloadTaskId | null
}

const STORM_TASKS: readonly AirbusWorkloadTaskId[] = [
  'stormScanRange',
  'stormGapSelection',
]

const ENGINE_OUT_TASKS: readonly AirbusWorkloadTaskId[] = [
  'engineEventAcknowledgement',
  'engineSafeReturnSelection',
]

const NEXT_SCAN_RANGE: Record<AirbusScanRange, AirbusScanRange> = {
  near: 'mid',
  mid: 'far',
  far: 'near',
}

export function createInitialAirbusWorkloadProgress(): AirbusWorkloadProgress {
  return {
    scanRange: 'near',
    selectedWeatherSector: null,
    selectedSafeReturnSide: null,
    completedTasks: [],
    attempts: {
      stormScanRange: 0,
      stormGapSelection: 0,
      engineEventAcknowledgement: 0,
      engineSafeReturnSelection: 0,
    },
  }
}

export function deriveAirbusWorkloadTask(
  scenario: AirbusScenarioId | null,
  checkpoint: StormLineCheckpoint | EngineOutCheckpoint | null,
): AirbusWorkloadTaskId | null {
  if (scenario === 'stormLine') {
    if (checkpoint === 'stormEntry') return 'stormScanRange'
    if (checkpoint === 'stormCore') return 'stormGapSelection'
    return null
  }
  if (scenario === 'engineOut') {
    if (checkpoint === 'recognition') return 'engineEventAcknowledgement'
    if (checkpoint === 'diversion') return 'engineSafeReturnSelection'
  }
  return null
}

function actionMatchesTask(
  task: AirbusWorkloadTaskId,
  action: AirbusWorkloadAction,
): boolean {
  if (task === 'stormScanRange') return action.type === 'cycleScanRange'
  if (task === 'stormGapSelection') return action.type === 'selectWeatherSector'
  if (task === 'engineEventAcknowledgement') return action.type === 'acknowledgeEngineEvent'
  return action.type === 'selectSafeReturn'
}

function completedByAction(
  task: AirbusWorkloadTaskId,
  action: AirbusWorkloadAction,
  scanRange: AirbusScanRange,
): boolean {
  if (task === 'stormScanRange') {
    return action.type === 'cycleScanRange' && scanRange === 'mid'
  }
  if (task === 'stormGapSelection') {
    return action.type === 'selectWeatherSector' && action.sector === 'west'
  }
  if (task === 'engineEventAcknowledgement') {
    return action.type === 'acknowledgeEngineEvent'
  }
  return action.type === 'selectSafeReturn' && action.side === 'right'
}

export function applyAirbusWorkloadAction(
  progress: AirbusWorkloadProgress,
  activeTask: AirbusWorkloadTaskId | null,
  action: AirbusWorkloadAction,
): AirbusWorkloadResult {
  if (
    activeTask === null ||
    progress.completedTasks.includes(activeTask) ||
    !actionMatchesTask(activeTask, action)
  ) {
    return { progress, outcome: 'ignored', task: activeTask }
  }

  const scanRange = activeTask === 'stormScanRange' && action.type === 'cycleScanRange'
    ? NEXT_SCAN_RANGE[progress.scanRange]
    : progress.scanRange
  const selectedWeatherSector = activeTask === 'stormGapSelection'
    && action.type === 'selectWeatherSector'
    ? action.sector
    : progress.selectedWeatherSector
  const selectedSafeReturnSide = activeTask === 'engineSafeReturnSelection'
    && action.type === 'selectSafeReturn'
    ? action.side
    : progress.selectedSafeReturnSide
  const correct = completedByAction(activeTask, action, scanRange)
  if (correct) {
    return {
      progress: {
        ...progress,
        scanRange,
        selectedWeatherSector,
        selectedSafeReturnSide,
        completedTasks: AIRBUS_WORKLOAD_TASKS.filter(
          (task) => task === activeTask || progress.completedTasks.includes(task),
        ),
      },
      outcome: 'correct',
      task: activeTask,
    }
  }

  return {
    progress: {
      ...progress,
      scanRange,
      selectedWeatherSector,
      selectedSafeReturnSide,
      attempts: {
        ...progress.attempts,
        [activeTask]: progress.attempts[activeTask] + 1,
      },
    },
    outcome: 'incorrect',
    task: activeTask,
  }
}

export function airbusWorkloadHint(
  task: AirbusWorkloadTaskId,
  attempts: number,
): string {
  const stronger = attempts >= 2
  if (task === 'stormScanRange') {
    return stronger
      ? 'Use the captain ND and stop when the fictional training range reads MID.'
      : 'Cycle the fictional weather scan range for a clearer training picture.'
  }
  if (task === 'stormGapSelection') {
    return stronger
      ? 'The stable training gap is in the west sector — the left third of the captain ND.'
      : 'Confirm the low-precipitation weather gap shown on the captain ND.'
  }
  if (task === 'engineEventAcknowledgement') {
    return stronger
      ? 'Acknowledge the deliberate training event on the upper ECAM.'
      : 'The instructor is waiting for acknowledgement of the simulated event.'
  }
  return stronger
    ? 'Choose the right-side SAFE RETURN corridor on the captain ND.'
    : 'Confirm the calmer SAFE RETURN corridor on the captain ND.'
}

export function resetAirbusScenarioWorkload(
  progress: AirbusWorkloadProgress,
  scenario: AirbusScenarioId,
): AirbusWorkloadProgress {
  const resetTasks = scenario === 'stormLine' ? STORM_TASKS : ENGINE_OUT_TASKS
  const attempts = { ...progress.attempts }
  for (const task of resetTasks) attempts[task] = 0
  return {
    scanRange: scenario === 'stormLine' ? 'near' : progress.scanRange,
    selectedWeatherSector: scenario === 'stormLine' ? null : progress.selectedWeatherSector,
    selectedSafeReturnSide: scenario === 'engineOut' ? null : progress.selectedSafeReturnSide,
    completedTasks: progress.completedTasks.filter((task) => !resetTasks.includes(task)),
    attempts,
  }
}
