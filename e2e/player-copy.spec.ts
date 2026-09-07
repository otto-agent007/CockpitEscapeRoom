import { expect, test, type Page } from '@playwright/test'
import { airbusCaptainFlow, dc9LegacyFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

async function seed(page: Page, state: GameState): Promise<void> {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  )
  await page.reload()
}

function airbusHubState(): GameState {
  const state = createInitialState()
  return {
    ...state,
    phase: 'airbus',
    airbusCaptainModeUnlocked: true,
    cockpitOrientationSeen: { dc9: true, airbus: true },
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      ...state.airbusSimulator,
      familiarization: 'completed',
      cameraPhase: 'qualified',
      location: 'hub',
    },
  }
}

test('player-facing cockpit chapters use challenge and memory language', async ({ page }) => {
  await page.goto('/?skip3d=1')
  const hub = airbusHubState()
  await seed(page, hub)

  await expect(page.getByRole('heading', { name: 'Captain Challenges' })).toBeVisible()
  await expect(page.getByText('Qualification is complete. Choose the next captain challenge.')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/simulator|non.?operational/i)

  await seed(page, {
    ...hub,
    airbusSimulator: {
      ...hub.airbusSimulator,
      location: 'engineOut',
      stormLine: {
        ...hub.airbusSimulator.stormLine,
        status: 'completed',
      },
      engineOut: {
        ...hub.airbusSimulator.engineOut,
        status: 'not_started',
      },
    },
  })

  await expect(page.getByRole('heading', { name: 'Engine-Out Handling' })).toBeVisible()
  await expect(page.getByText('Captain challenge', { exact: true })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/simulator|non.?operational|sim eng/i)

  await seed(page, {
    ...hub,
    completedPuzzles: ['dc9', 'locker', 'airbus'],
    airbusSimulator: {
      ...hub.airbusSimulator,
      stormLine: {
        ...hub.airbusSimulator.stormLine,
        status: 'completed',
      },
      engineOut: {
        ...hub.airbusSimulator.engineOut,
        status: 'completed',
        bestTraits: [],
      },
    },
  })
  await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' }))
    .toContainText('Both captain challenges are complete. Captain knowledge logged.')

  const dc9 = createInitialState()
  await seed(page, {
    ...dc9,
    phase: 'dc9',
    cockpitOrientationSeen: { dc9: true, airbus: false },
    dc9: {
      ...dc9.dc9,
      stage: 'memphisDeparture',
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
    },
  })

  await expect(page.getByText('1995 MEMPHIS MEMORY', { exact: true })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/simulator|non.?operational/i)
})
