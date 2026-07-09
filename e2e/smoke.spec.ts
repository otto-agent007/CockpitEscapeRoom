import { expect, test, type Page } from '@playwright/test'
import { dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

async function placeAirbusCard(page: Page, card: string, targetName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^${card}\\b`) }).click()
  await page.getByRole('button', { name: `${targetName} target` }).click()
}

function createLockerState(): GameState {
  return {
    ...createInitialState(),
    phase: 'locker',
    airbusAssignments: {
      sidestick: 'SIDESTICK',
      thrust: 'THRUST',
      gear: 'GEAR',
      radio: 'RADIO',
      altitude: 'ALTITUDE',
    },
    completedPuzzles: ['firstOfficer'],
    statusMessage: 'FIRST-OFFICER MODE COMPLETE. Locker access granted.',
  }
}

function createCaptainState(): GameState {
  return {
    ...createLockerState(),
    phase: 'captain',
    lockerCompleted: [...lockerFlow.requiredInteractionIds],
    lockerHatRevealed: true,
    captainModeUnlocked: true,
    completedPuzzles: ['firstOfficer', 'locker'],
    statusMessage: 'Captain’s hat recognized. Promotion available. POP T CAPTAIN MODE UNLOCKED',
  }
}

function createRewardState(): GameState {
  return {
    ...createCaptainState(),
    phase: 'reward',
    switchSequence: [...dc9LegacyFlow.checklistOrder],
    routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
    completedPuzzles: ['firstOfficer', 'locker', 'captain'],
    captainRewardUnlocked: true,
    statusMessage: dc9LegacyFlow.completionText,
  }
}

async function seedGameState(page: Page, state: GameState): Promise<void> {
  await page.evaluate(
    ({ key, savedState }) => {
      window.localStorage.setItem(key, JSON.stringify(savedState))
    },
    { key: STORAGE_KEY, savedState: state },
  )
  await page.reload()
}

test('Airbus playable proof loads the A320 GLB', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/')
  const modelResponse = page.waitForResponse(
    (response) => response.url().includes('/models/airbus-first-officer.glb') && response.status() === 200,
    { timeout: 20_000 },
  )

  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  await modelResponse

  await expect(page.getByText('A320 PLAYABLE PROOF')).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByRole('button', { name: /^SIDESTICK\b/ })).toBeVisible({ timeout: 25_000 })
  const sidestickTarget = page.getByRole('button', { name: 'Sidestick target' })
  await expect(sidestickTarget).toBeVisible({ timeout: 25_000 })
  await expect(page.locator('.airbus-target-layer')).toHaveClass(/airbus-target-layer--projected/, { timeout: 25_000 })
  await expect(sidestickTarget).toHaveAttribute('style', /px/)
  await expect(page.getByRole('button', { name: /^CLOCK\b/ })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'ATP answer' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Verify' })).toHaveCount(0)
  await expect(page.getByRole('combobox')).toHaveCount(0)
  expect(consoleErrors).toEqual([])
})

test('Airbus onboarding, locker reveal, and captain completion unlock reward', async ({ page }) => {
  await page.goto('/?skip3d=1')

  await expect(page.getByRole('heading', { name: "The Captain's Key" })).toBeVisible()
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  await expect(page.getByRole('textbox', { name: 'ATP answer' })).toHaveCount(0)
  await expect(page.getByText('How many flight hours are needed for a standard ATP certificate?')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^CLOCK\b/ })).toHaveCount(0)

  await placeAirbusCard(page, 'SIDESTICK', 'Sidestick')
  await placeAirbusCard(page, 'THRUST', 'Thrust levers')
  await placeAirbusCard(page, 'GEAR', 'Gear lever')
  await placeAirbusCard(page, 'RADIO', 'Radio panel')
  await placeAirbusCard(page, 'ALTITUDE', 'Altitude area')

  const atpAnswer = page.getByRole('textbox', { name: 'ATP answer' })
  await expect(atpAnswer).toBeVisible()
  await expect(atpAnswer).toHaveValue('')
  await expect(atpAnswer).not.toHaveAttribute('placeholder', '1500')
  await atpAnswer.fill('1500')
  await expect(page.getByRole('button', { name: 'Verify' })).toBeEnabled()
  await page.getByRole('button', { name: 'Verify' }).click()

  await expect(page.getByRole('heading', { name: 'Locker reveal sequence' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Right-seat hours' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm watch answer' })).toBeVisible()

  await seedGameState(page, createCaptainState())
  await expect(page.getByRole('heading', { name: 'POP T CAPTAIN MODE' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Stored power/i })).toBeVisible()

  await seedGameState(page, createRewardState())
  await expect(page.getByRole('heading', { name: 'Ground transport release' })).toBeVisible()
  await expect(page.getByText(/Happy Father’s Day/i)).toBeVisible()
  await expect(page.getByText(/red Tesla Model Y is unlocked/i)).toBeVisible()
})

test('Airbus cards show immediate placement feedback and recover', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()

  const sidestickCard = page.getByRole('button', { name: /^SIDESTICK\b/ })
  const sidestickTarget = page.getByRole('button', { name: 'Sidestick target' })
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())

  await expect(sidestickTarget).toHaveCSS('opacity', '1')
  await sidestickCard.click()
  await expect(sidestickTarget).toHaveCSS('opacity', '1')
  await sidestickCard.dispatchEvent('dragstart', { dataTransfer })
  await sidestickTarget.dispatchEvent('dragenter', { dataTransfer })
  await expect(sidestickTarget).toHaveClass(/is-drag-over/)
  await expect(sidestickTarget).toHaveCSS('opacity', '1')
  await sidestickTarget.dispatchEvent('drop', { dataTransfer })

  await expect(sidestickTarget).toHaveClass(/has-card/)
  await expect(sidestickTarget).toHaveClass(/is-correct/)
  await expect(sidestickCard).toContainText('Sidestick')

  const radioCard = page.getByRole('button', { name: /^RADIO\b/ })
  const radioTarget = page.getByRole('button', { name: 'Radio panel target' })
  await radioCard.click()
  await sidestickTarget.click()
  await expect(sidestickTarget).toHaveClass(/is-wrong/)
  await expect(page.getByText(/Red means Sidestick/)).toBeVisible()
  await radioCard.click()
  await radioTarget.click()
  await expect(sidestickTarget).not.toHaveClass(/has-card/)
  await expect(radioTarget).toHaveClass(/is-correct/)
  await expect(page.getByText('1/5')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'ATP answer' })).toHaveCount(0)

  await placeAirbusCard(page, 'SIDESTICK', 'Sidestick')
  await placeAirbusCard(page, 'GEAR', 'Gear lever')
  await placeAirbusCard(page, 'ALTITUDE', 'Altitude area')
  await expect(page.getByText('4/5')).toBeVisible()
  await placeAirbusCard(page, 'THRUST', 'Thrust levers')
  await expect(page.getByRole('textbox', { name: 'ATP answer' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Locker reveal sequence' })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'ATP answer' }).fill('1500')
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page.getByRole('heading', { name: 'Locker reveal sequence' })).toBeVisible()
})

test('saved progress persists during Airbus phase', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  await placeAirbusCard(page, 'RADIO', 'Sidestick')
  await page.reload()

  await expect(page.getByRole('button', { name: 'Sidestick target' })).toHaveClass(/has-card/)
  await expect(page.getByRole('button', { name: 'Sidestick target' })).toHaveClass(/is-wrong/)
  await expect(page.getByRole('button', { name: /^RADIO\b/ })).toContainText('Sidestick')
})
