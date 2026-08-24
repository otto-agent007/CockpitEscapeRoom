import { describe, expect, it } from 'vitest'
import {
  AIRBUS_WORKLOAD_TASKS,
  airbusWorkloadHint,
  applyAirbusWorkloadAction,
  createInitialAirbusWorkloadProgress,
  deriveAirbusWorkloadTask,
  resetAirbusScenarioWorkload,
} from './airbusWorkload'

describe('Airbus captain workload', () => {
  it('derives one required cockpit task for each interactive checkpoint', () => {
    expect(deriveAirbusWorkloadTask('stormLine', 'stormEntry')).toBe('stormScanRange')
    expect(deriveAirbusWorkloadTask('stormLine', 'stormCore')).toBe('stormGapSelection')
    expect(deriveAirbusWorkloadTask('stormLine', 'clearAir')).toBeNull()
    expect(deriveAirbusWorkloadTask('engineOut', 'recognition')).toBe('engineEventAcknowledgement')
    expect(deriveAirbusWorkloadTask('engineOut', 'stabilization')).toBeNull()
    expect(deriveAirbusWorkloadTask('engineOut', 'diversion')).toBe('engineSafeReturnSelection')
    expect(deriveAirbusWorkloadTask(null, null)).toBeNull()
  })

  it('cycles fictional scan range deterministically and completes at MID', () => {
    const initial = createInitialAirbusWorkloadProgress()
    const mid = applyAirbusWorkloadAction(initial, 'stormScanRange', { type: 'cycleScanRange' })

    expect(initial.scanRange).toBe('near')
    expect(mid).toMatchObject({
      outcome: 'correct',
      task: 'stormScanRange',
      progress: {
        scanRange: 'mid',
        completedTasks: ['stormScanRange'],
      },
    })

    const farStart = { ...initial, scanRange: 'far' as const }
    const near = applyAirbusWorkloadAction(farStart, 'stormScanRange', { type: 'cycleScanRange' })
    expect(near.progress.scanRange).toBe('near')
    expect(near.outcome).toBe('incorrect')
    expect(near.progress.attempts.stormScanRange).toBe(1)
  })

  it('accepts the western gap and preserves prior completion after a wrong sector', () => {
    const initial = createInitialAirbusWorkloadProgress()
    const withRange = {
      ...initial,
      completedTasks: ['stormScanRange' as const],
    }
    const wrong = applyAirbusWorkloadAction(
      withRange,
      'stormGapSelection',
      { type: 'selectWeatherSector', sector: 'center' },
    )
    expect(wrong.outcome).toBe('incorrect')
    expect(wrong.progress.selectedWeatherSector).toBe('center')
    expect(wrong.progress.attempts.stormGapSelection).toBe(1)
    expect(wrong.progress.completedTasks).toEqual(['stormScanRange'])

    const correct = applyAirbusWorkloadAction(
      wrong.progress,
      'stormGapSelection',
      { type: 'selectWeatherSector', sector: 'west' },
    )
    expect(correct.outcome).toBe('correct')
    expect(correct.progress.selectedWeatherSector).toBe('west')
    expect(correct.progress.completedTasks).toEqual([
      'stormScanRange',
      'stormGapSelection',
    ])
  })

  it('acknowledges the deliberate event and selects only right SAFE RETURN', () => {
    const initial = createInitialAirbusWorkloadProgress()
    const acknowledged = applyAirbusWorkloadAction(
      initial,
      'engineEventAcknowledgement',
      { type: 'acknowledgeEngineEvent' },
    )
    expect(acknowledged.outcome).toBe('correct')
    expect(acknowledged.progress.completedTasks).toEqual(['engineEventAcknowledgement'])

    const wrong = applyAirbusWorkloadAction(
      acknowledged.progress,
      'engineSafeReturnSelection',
      { type: 'selectSafeReturn', side: 'left' },
    )
    expect(wrong.outcome).toBe('incorrect')
    expect(wrong.progress.selectedSafeReturnSide).toBe('left')
    expect(wrong.progress.attempts.engineSafeReturnSelection).toBe(1)

    const correct = applyAirbusWorkloadAction(
      wrong.progress,
      'engineSafeReturnSelection',
      { type: 'selectSafeReturn', side: 'right' },
    )
    expect(correct.outcome).toBe('correct')
    expect(correct.progress.selectedSafeReturnSide).toBe('right')
    expect(correct.progress.completedTasks).toEqual([
      'engineEventAcknowledgement',
      'engineSafeReturnSelection',
    ])
  })

  it('ignores irrelevant actions and already completed tasks', () => {
    const initial = createInitialAirbusWorkloadProgress()
    const irrelevant = applyAirbusWorkloadAction(
      initial,
      'stormGapSelection',
      { type: 'acknowledgeEngineEvent' },
    )
    expect(irrelevant).toEqual({
      progress: initial,
      outcome: 'ignored',
      task: 'stormGapSelection',
    })

    const completed = {
      ...initial,
      completedTasks: ['engineEventAcknowledgement' as const],
    }
    const duplicate = applyAirbusWorkloadAction(
      completed,
      'engineEventAcknowledgement',
      { type: 'acknowledgeEngineEvent' },
    )
    expect(duplicate).toEqual({
      progress: completed,
      outcome: 'ignored',
      task: 'engineEventAcknowledgement',
    })
  })

  it('strengthens hints after repeated misses', () => {
    expect(airbusWorkloadHint('stormGapSelection', 1)).toContain('weather gap')
    expect(airbusWorkloadHint('stormGapSelection', 2)).toContain('west')
    expect(airbusWorkloadHint('stormGapSelection', 2)).toContain('left third')
    expect(airbusWorkloadHint('engineSafeReturnSelection', 3)).toContain('right')
  })

  it('resets only the explicitly replayed scenario workload', () => {
    const completed = {
      scanRange: 'mid' as const,
      selectedWeatherSector: 'west' as const,
      selectedSafeReturnSide: 'right' as const,
      completedTasks: [...AIRBUS_WORKLOAD_TASKS],
      attempts: {
        stormScanRange: 1,
        stormGapSelection: 2,
        engineEventAcknowledgement: 3,
        engineSafeReturnSelection: 4,
      },
    }

    expect(resetAirbusScenarioWorkload(completed, 'stormLine')).toEqual({
      scanRange: 'near',
      selectedWeatherSector: null,
      selectedSafeReturnSide: 'right',
      completedTasks: ['engineEventAcknowledgement', 'engineSafeReturnSelection'],
      attempts: {
        stormScanRange: 0,
        stormGapSelection: 0,
        engineEventAcknowledgement: 3,
        engineSafeReturnSelection: 4,
      },
    })
    expect(resetAirbusScenarioWorkload(completed, 'engineOut')).toEqual({
      scanRange: 'mid',
      selectedWeatherSector: 'west',
      selectedSafeReturnSide: null,
      completedTasks: ['stormScanRange', 'stormGapSelection'],
      attempts: {
        stormScanRange: 1,
        stormGapSelection: 2,
        engineEventAcknowledgement: 0,
        engineSafeReturnSelection: 0,
      },
    })
  })
})
