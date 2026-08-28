import { expect, test, type Page } from '@playwright/test'
import { dc9LegacyFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

function departureState(
  checkpoint: GameState['dc9']['departure']['checkpoint'] = 'rampStart',
  attempts: GameState['dc9']['departure']['attempts'] = {},
): GameState {
  const completedBeats = checkpoint === 'rampStart'
    ? []
    : checkpoint === 'taxiTurn'
      ? ['rampRelease'] as const
      : checkpoint === 'holdShort'
        ? ['rampRelease', 'taxi'] as const
        : checkpoint === 'runwayLineup'
          ? ['rampRelease', 'taxi', 'holdShort'] as const
          : checkpoint === 'initialClimb'
            ? ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation'] as const
            : ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation', 'initialClimb', 'complete'] as const
  const complete = checkpoint === 'complete'
  return {
    ...createInitialState(),
    phase: 'dc9',
    dc9: {
      ...createInitialState().dc9,
      stage: complete ? 'homeOperations' : 'memphisDeparture',
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      departure: {
        checkpoint,
        completedBeats: [...completedBeats],
        attempts,
        hintLevel: Math.min(3, Math.max(0, ...Object.values(attempts))) as 0 | 1 | 2 | 3,
        completed: complete,
      },
    },
  }
}

async function seedDeparture(
  page: Page,
  checkpoint: GameState['dc9']['departure']['checkpoint'],
  attempts: GameState['dc9']['departure']['attempts'] = {},
): Promise<void> {
  await page.evaluate(
    ({ key, state }) => window.localStorage.setItem(key, JSON.stringify(state)),
    { key: STORAGE_KEY, state: departureState(checkpoint, attempts) },
  )
  await page.reload()
}

async function hold(page: Page, name: string, milliseconds: number): Promise<void> {
  const button = page.getByRole('button', { name })
  await button.dispatchEvent('pointerdown')
  await page.waitForTimeout(milliseconds)
  await button.dispatchEvent('pointerup')
}

test('Memphis departure remains playable with native controls when 3D is unavailable', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedDeparture(page, 'rampStart')

  await expect(page.getByRole('heading', { name: 'Memphis Legacy Departure' })).toBeVisible()
  await expect(page.getByText('Fictional — non operational')).toBeVisible()
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    const panel = await page.locator('.dc9-memphis-departure').boundingBox()
    expect(panel).not.toBeNull()
    expect(panel!.x).toBeGreaterThanOrEqual(0)
    expect(panel!.x + panel!.width).toBeLessThanOrEqual(viewport.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  }
  await page.getByRole('button', { name: 'Advance thrust levers' }).dispatchEvent('pointerdown')
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Advance thrust levers' }).dispatchEvent('pointerup')
  await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/centered|steer/i)

  // The pure departure rules are covered separately. These checkpoint starts exercise the
  // complete native/keyboard fallback UI without WebGL or model bytes.
  await seedDeparture(page, 'holdShort')
  await hold(page, 'Advance thrust levers', 250)
  await hold(page, 'Close thrust levers', 300)
  const brake = page.getByRole('button', { name: 'Hold brake' })
  await brake.dispatchEvent('pointerdown')
  await expect(brake).toHaveAttribute('aria-pressed', 'true')
  await page.waitForTimeout(500)
  await expect(page.getByRole('button', { name: 'Ready to line up' })).toBeEnabled()
  await page.getByRole('button', { name: 'Ready to line up' }).click()
  await brake.dispatchEvent('pointerup')

  await seedDeparture(page, 'initialClimb')
  await hold(page, 'Roll wheel left', 350)
  await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/safe retry/i)
  await seedDeparture(page, 'initialClimb', { initialClimb: 3 })
  await expect(page.getByRole('button', { name: 'Restore checkpoint' })).toBeVisible()
  await page.getByRole('button', { name: 'Restore checkpoint' }).click()
  await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/checkpoint restored/i)

  await seedDeparture(page, 'initialClimb')
  const keyboardBrake = page.getByRole('button', { name: 'Hold brake' })
  await keyboardBrake.focus()
  await page.keyboard.down(' ')
  await expect(keyboardBrake).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.up(' ')
  await expect(page.getByRole('heading', { name: 'Home Operations' })).toBeVisible({ timeout: 8_000 })
})
