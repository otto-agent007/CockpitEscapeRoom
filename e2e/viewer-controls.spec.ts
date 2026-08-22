import { expect, test, type Page } from '@playwright/test'
import { dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

function airbusState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    phase: 'airbus',
    dc9: {
      stage: 'complete',
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      routeAttempts: 0,
      homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
      homeOperationsCompleted: true,
      secureSequence: [...dc9LegacyFlow.secureSequence],
      secureAttempts: 0,
      keyRevealed: true,
      keyClaimed: true,
    },
    lockerCompleted: [...lockerFlow.memoryIds],
    lockerIntroCompleted: true,
    lockerHatRevealed: true,
    airbusCaptainModeUnlocked: true,
    completedPuzzles: ['dc9', 'locker'],
    statusMessage: 'Airbus Pop T Captain experience ready.',
    ...overrides,
  }
}

async function seed(page: Page, state: GameState) {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: state })
  await page.reload()
}

test('loading failure offers retry and accessible completion path', async ({ page }) => {
  let requests = 0
  await page.route('**/models/airbus-captain.glb*', (route) => {
    requests += 1
    return route.fulfill({ status: 503, body: 'offline' })
  })
  await page.goto('/')
  await seed(page, airbusState())

  await expect(page.getByRole('heading', { name: 'Airbus A320 Pop T Captain Mode' })).toBeVisible()
  await expect(page.getByText('One of the most beautiful offices on earth.')).toBeVisible()
  await expect(page.getByText('Modern technology, earned command, and the view from the left seat.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry 3D' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^SIDESTICK\b/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Retry 3D' }).click()
  await expect.poll(() => requests).toBe(2)
  await expect(page.getByRole('button', { name: 'Retry 3D' })).toBeVisible()

  await page.getByRole('button', { name: 'Continue with accessible controls' }).click()
  await expect(page.getByRole('button', { name: /^SIDESTICK\b/ })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Game-ready Airbus A320 cockpit from the captain seat' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cockpit drop zone 1' })).toHaveAttribute('style', /left: 19\.5%/)
})

test('viewer help closes with Escape and restores trigger focus', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seed(page, airbusState())
  const trigger = page.getByRole('button', { name: 'Open viewer help' })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Explore this scene' })).toContainText('Look from the left seat')
  await expect(page.getByRole('button', { name: 'Close viewer help' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Explore this scene' })).toHaveCount(0)
  await expect(trigger).toBeFocused()

  const dock = await page.locator('.airbus-dock').boundingBox()
  const tools = await page.locator('.scene-tools').boundingBox()
  expect(dock).not.toBeNull()
  expect(tools).not.toBeNull()
  expect(tools!.x).toBeGreaterThan(dock!.x + dock!.width)
})

test('reduced motion Airbus completion keeps its celebration before reward and survives reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?skip3d=1')
  await seed(page, airbusState({
    airbusAssignments: {
      sidestick: 'SIDESTICK',
      thrust: 'THRUST',
      gear: 'GEAR',
      radio: 'RADIO',
      altitude: 'ALTITUDE',
    },
    completedPuzzles: ['dc9', 'locker', 'airbus'],
  }))

  await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })).toHaveCount(0)
  await expect(page.locator('.qualification-confetti')).toHaveCount(0)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Ground Transport Upgrade Authorized', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Ground Transport Upgrade Authorized', { exact: true })).toBeVisible()
})
