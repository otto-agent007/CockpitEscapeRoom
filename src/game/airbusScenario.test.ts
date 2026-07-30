import { describe, expect, it } from 'vitest'
import * as scenarioModule from './airbusScenario'

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
