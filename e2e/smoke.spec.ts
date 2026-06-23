import { expect, test, type Page } from '@playwright/test'
import { dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

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

test('Airbus onboarding, locker reveal, and captain completion unlock reward', async ({ page }) => {
  await page.goto('/?skip3d=1')

  await expect(page.getByRole('heading', { name: 'Cockpit Escape Room' })).toBeVisible()
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()

  await page.getByRole('combobox', { name: /Select card for Sidestick/i }).selectOption('SIDESTICK')
  await page.getByRole('combobox', { name: /Select card for Thrust levers/i }).selectOption('THRUST')
  await page.getByRole('combobox', { name: /Select card for Gear lever/i }).selectOption('GEAR')
  await page.getByRole('combobox', { name: /Select card for Radio panel/i }).selectOption('RADIO')
  await page.getByRole('combobox', { name: /Select card for Altitude area/i }).selectOption('ALTITUDE')

  await page.getByRole('textbox', { name: 'ATP answer' }).fill('1500')
  await expect(page.getByRole('button', { name: 'Verify First-Officer challenge' })).toBeEnabled()

  // Unit tests cover the reducer submit transition; the smoke test resumes from saved progress.
  await seedGameState(page, createLockerState())
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

test('saved progress persists during Airbus phase', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  await page.getByRole('combobox', { name: /Select card for Sidestick/i }).selectOption('RADIO')
  await page.reload()

  await expect(page.getByRole('combobox', { name: /Select card for Sidestick/i })).toHaveValue('RADIO')
})
