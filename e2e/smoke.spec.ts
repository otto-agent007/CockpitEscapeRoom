import { expect, test, type Page } from '@playwright/test'
import { dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

async function placeAirbusCard(page: Page, card: string, targetName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^${card}\\b`) }).click()
  await page.getByRole('button', { name: `${targetName} target` }).click()
}

async function placeAirbusDecoyCard(page: Page, card: string, decoyName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^${card}\\b`) }).click()
  await page.getByRole('button', { name: `${decoyName} decoy` }).click()
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
    airbusClockAnswer: '1500',
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
  await expect(page.getByRole('button', { name: 'Sidestick target' })).toBeVisible({ timeout: 25_000 })
  await expect(page.getByRole('textbox', { name: 'ATP answer' })).toHaveCount(0)
  await expect(page.getByRole('combobox')).toHaveCount(0)
  expect(consoleErrors).toEqual([])
})

test('Airbus onboarding, locker reveal, and captain completion unlock reward', async ({ page }) => {
  await page.goto('/?skip3d=1')

  await expect(page.getByRole('heading', { name: "The Captain's Key" })).toBeVisible()
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  await expect(page.getByRole('textbox', { name: 'ATP answer' })).toHaveCount(0)
  await expect(page.getByText('How many flight hours are needed for a standard ATP certificate?')).toHaveCount(0)

  await placeAirbusCard(page, 'SIDESTICK', 'Sidestick')
  await placeAirbusCard(page, 'THRUST', 'Thrust levers')
  await placeAirbusCard(page, 'GEAR', 'Gear lever')
  await placeAirbusCard(page, 'RADIO', 'Radio panel')
  await placeAirbusCard(page, 'ALTITUDE', 'Altitude area')
  await placeAirbusDecoyCard(page, 'CLOCK', 'Side console switches')

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

test('Airbus cards drag onto cockpit parts with hotspot highlighting', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()

  const sidestickCard = page.getByRole('button', { name: /^SIDESTICK\b/ })
  const sidestickTarget = page.getByRole('button', { name: 'Sidestick target' })
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())

  await expect(sidestickTarget).toHaveCSS('opacity', '0')
  await sidestickCard.click()
  await expect(sidestickTarget).toHaveCSS('opacity', '0')
  await sidestickCard.dispatchEvent('dragstart', { dataTransfer })
  await sidestickTarget.dispatchEvent('dragenter', { dataTransfer })
  await expect(sidestickTarget).toHaveClass(/is-drag-over/)
  await expect(sidestickTarget).toHaveCSS('opacity', '1')
  await sidestickTarget.dispatchEvent('drop', { dataTransfer })

  await expect(sidestickTarget).toHaveClass(/has-card/)
  await expect(sidestickTarget).not.toHaveClass(/is-correct/)
  await expect(sidestickTarget).toHaveCSS('opacity', '0')
  await expect(sidestickCard).toContainText('Sidestick')

  const thrustCard = page.getByRole('button', { name: /^THRUST\b/ })
  const decoyTarget = page.getByRole('button', { name: 'Side console switches decoy' })
  const decoyDataTransfer = await page.evaluateHandle(() => new DataTransfer())

  await expect(decoyTarget).toHaveCSS('opacity', '0')
  await thrustCard.dispatchEvent('dragstart', { dataTransfer: decoyDataTransfer })
  await decoyTarget.dispatchEvent('dragenter', { dataTransfer: decoyDataTransfer })
  await expect(decoyTarget).toHaveClass(/is-drag-over/)
  await expect(decoyTarget).toHaveCSS('opacity', '1')
  await decoyTarget.dispatchEvent('drop', { dataTransfer: decoyDataTransfer })

  await expect(decoyTarget).toHaveClass(/has-card/)
  await expect(decoyTarget).toHaveCSS('opacity', '0')
  await expect(thrustCard).toContainText('Side console switches')
  await expect(page.getByText('2/6')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'ATP answer' })).toHaveCount(0)

  await placeAirbusCard(page, 'GEAR', 'Gear lever')
  await placeAirbusCard(page, 'RADIO', 'Radio panel')
  await placeAirbusCard(page, 'ALTITUDE', 'Altitude area')
  await placeAirbusDecoyCard(page, 'CLOCK', 'Windshield light switches')

  await expect(page.getByText('6/6')).toBeVisible()
  await expect(page.getByText('One or more labels are incorrect')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'ATP answer' })).toHaveCount(0)
})

test('saved progress persists during Airbus phase', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  await placeAirbusCard(page, 'RADIO', 'Sidestick')
  await page.reload()

  await expect(page.getByRole('button', { name: 'Sidestick target' })).toHaveClass(/has-card/)
  await expect(page.getByRole('button', { name: 'Sidestick target' })).not.toHaveClass(/is-wrong/)
  await expect(page.getByRole('button', { name: /^RADIO\b/ })).toContainText('Sidestick')
})
