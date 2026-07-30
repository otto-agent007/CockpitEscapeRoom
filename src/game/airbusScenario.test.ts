import { describe, expect, it } from 'vitest'
import * as scenarioModule from './airbusScenario'
import { createEngineOutStateAtCheckpoint } from './airbusEngineOut'
import { createStormLineState } from './airbusSimulator'

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
})
