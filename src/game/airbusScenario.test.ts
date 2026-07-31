import { describe, expect, it } from 'vitest'
import * as scenarioModule from './airbusScenario'
import { createEngineOutStateAtCheckpoint } from './airbusEngineOut'
import { createStormLineState, createStormLineStateAtCheckpoint } from './airbusSimulator'

describe('Airbus scenario availability', () => {
  it.each([
    ['stormLine', false, false, false, 'locked'],
    ['stormLine', true, false, false, 'ready'],
    ['stormLine', true, true, false, 'replay'],
    ['engineOut', true, false, false, 'locked'],
    ['engineOut', true, true, false, 'ready'],
    ['engineOut', true, true, true, 'replay'],
  ] as const)(
    'reports %s as %s when qualification=%s Storm=%s Engine-Out=%s',
    (scenario, qualified, stormCompleted, engineOutCompleted, expected) => {
      const getAvailability = (
        scenarioModule as unknown as {
          getAirbusScenarioAvailability?: (
            id: 'stormLine' | 'engineOut',
            progress: {
              qualified: boolean
              stormCompleted: boolean
              engineOutCompleted: boolean
            },
          ) => string
        }
      ).getAirbusScenarioAvailability

      expect(getAvailability).toBeTypeOf('function')
      if (!getAvailability) return

      expect(getAvailability(scenario, {
        qualified,
        stormCompleted,
        engineOutCompleted,
      })).toBe(expected)
    },
  )
})

describe('Airbus active scenario frames', () => {
  it('routes the shared four-axis input to the selected pure scenario', () => {
    const advanceFrame = (
      scenarioModule as unknown as {
        advanceAirbusScenarioFrame?: (
          frame:
            | { scenario: 'stormLine'; state: ReturnType<typeof createStormLineState> }
            | { scenario: 'engineOut'; state: ReturnType<typeof createEngineOutStateAtCheckpoint> },
          input: { pitch: number; bank: number; thrust: number; directional: number },
          seconds: number,
        ) => {
          frame:
            | { scenario: 'stormLine'; state: ReturnType<typeof createStormLineState> }
            | { scenario: 'engineOut'; state: ReturnType<typeof createEngineOutStateAtCheckpoint> }
        }
      }
    ).advanceAirbusScenarioFrame

    expect(advanceFrame).toBeTypeOf('function')
    if (!advanceFrame) return

    const storm = { scenario: 'stormLine' as const, state: createStormLineState(7) }
    const stormNeutral = advanceFrame(
      storm,
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      1,
    )
    const stormDirectional = advanceFrame(
      storm,
      { pitch: 0, bank: 0, thrust: 0, directional: 1 },
      1,
    )
    expect(stormDirectional.frame).toEqual(stormNeutral.frame)

    const engine = {
      scenario: 'engineOut' as const,
      state: createEngineOutStateAtCheckpoint('stabilization'),
    }
    const engineNeutral = advanceFrame(
      engine,
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      1,
    )
    const engineBalanced = advanceFrame(
      engine,
      { pitch: 0, bank: 0, thrust: 0, directional: 0.6 },
      1,
    )
    if (engineNeutral.frame.scenario !== 'engineOut' || engineBalanced.frame.scenario !== 'engineOut') {
      throw new Error('Engine-Out frame lost its scenario discriminator.')
    }
    expect(Math.abs(engineBalanced.frame.state.aircraft.directionalError)).toBeLessThan(
      Math.abs(engineNeutral.frame.state.aircraft.directionalError),
    )
  })

  it('holds Storm checkpoint boundaries until their captain task is complete', () => {
    const stormEntry = {
      scenario: 'stormLine' as const,
      state: {
        ...createStormLineState(),
        elapsedSeconds: 44.99,
        checkpointElapsedSeconds: 44.99,
        aircraft: {
          ...createStormLineState().aircraft,
          lateralPosition: -0.7,
        },
      },
    }
    const blockedEntry = scenarioModule.advanceAirbusScenarioFrame(
      stormEntry,
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      0.1,
      [],
    )
    expect(blockedEntry).toMatchObject({
      frame: stormEntry,
      workloadGate: 'stormScanRange',
    })
    expect(blockedEntry.checkpointReached).toBeUndefined()

    const releasedEntry = scenarioModule.advanceAirbusScenarioFrame(
      stormEntry,
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      0.1,
      ['stormScanRange'],
    )
    expect(releasedEntry.frame.state.checkpoint).toBe('stormCore')
    expect(releasedEntry.workloadGate).toBeUndefined()

    const stormCore = {
      scenario: 'stormLine' as const,
      state: {
        ...createStormLineStateAtCheckpoint('stormCore'),
        elapsedSeconds: 134.99,
        checkpointElapsedSeconds: 89.99,
      },
    }
    const blockedCore = scenarioModule.advanceAirbusScenarioFrame(
      stormCore,
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      0.1,
      ['stormScanRange'],
    )
    expect(blockedCore.frame).toBe(stormCore)
    expect(blockedCore.workloadGate).toBe('stormGapSelection')

    const releasedCore = scenarioModule.advanceAirbusScenarioFrame(
      stormCore,
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      0.1,
      ['stormScanRange', 'stormGapSelection'],
    )
    expect(releasedCore.frame.state.checkpoint).toBe('clearAir')
  })

  it('holds Engine-Out Recognition and completion for their captain tasks', () => {
    const recognition = {
      scenario: 'engineOut' as const,
      state: {
        ...createEngineOutStateAtCheckpoint('recognition'),
        stageElapsedSeconds: 9.99,
      },
    }
    const blockedRecognition = scenarioModule.advanceAirbusScenarioFrame(
      recognition,
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      0.1,
      [],
    )
    expect(blockedRecognition.frame).toBe(recognition)
    expect(blockedRecognition.workloadGate).toBe('engineEventAcknowledgement')

    const releasedRecognition = scenarioModule.advanceAirbusScenarioFrame(
      recognition,
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      0.1,
      ['engineEventAcknowledgement'],
    )
    expect(releasedRecognition.frame.state.checkpoint).toBe('stabilization')

    const diversion = {
      scenario: 'engineOut' as const,
      state: {
        ...createEngineOutStateAtCheckpoint('diversion'),
        corridorProgress: 0.9999,
        aircraft: {
          ...createEngineOutStateAtCheckpoint('diversion').aircraft,
          bank: 20,
          directionalError: -0.1,
        },
      },
    }
    const blockedDiversion = scenarioModule.advanceAirbusScenarioFrame(
      diversion,
      { pitch: 0, bank: 0.4, thrust: 0, directional: 0.46 },
      0.25,
      ['engineEventAcknowledgement'],
    )
    expect(blockedDiversion.frame).toBe(diversion)
    expect(blockedDiversion.completed).toBeUndefined()
    expect(blockedDiversion.workloadGate).toBe('engineSafeReturnSelection')

    const releasedDiversion = scenarioModule.advanceAirbusScenarioFrame(
      diversion,
      { pitch: 0, bank: 0.4, thrust: 0, directional: 0.46 },
      0.25,
      ['engineEventAcknowledgement', 'engineSafeReturnSelection'],
    )
    expect(releasedDiversion.completed).toBe(true)
    expect(releasedDiversion.frame.state.phase).toBe('complete')
  })
})
