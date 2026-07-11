import { expect, test, type Page } from '@playwright/test'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

function lockerState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    phase: 'locker',
    completedPuzzles: ['firstOfficer'],
    lockerIntroCompleted: true,
    statusMessage: 'Begin with the pilot watch.',
    ...overrides,
  }
}

async function seed(page: Page, state: GameState, suffix = '?skip3d=1') {
  await page.goto(`/${suffix}`)
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: state })
  await page.reload()
}

test('Airbus completion plays the narrative handoff and settles on the watch-first gate', async ({ page }) => {
  await seed(page, {
    ...createInitialState(),
    phase: 'airbus',
    completedPuzzles: ['firstOfficer'],
    statusMessage: 'Airline Transport Pilot milestone recognized. First-Officer knowledge logged.',
  })

  await page.getByRole('button', { name: 'Continue' }).click()
  const transition = page.locator('.locker-transition')
  await expect(transition).toBeVisible()
  const skipButton = page.getByRole('button', { name: 'Skip cinematic' })
  await expect(skipButton).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(skipButton).toBeFocused()
  await expect(page.getByRole('button', { name: 'Inspect watch' })).toHaveCount(0)
  await expect(transition).toHaveAttribute('data-locker-intro-stage', 'title-in', { timeout: 5_000 })
  await expect(page.getByText('Before you can sit in the captain’s seat, you must understand the Captain’s journey…')).toBeVisible()

  await skipButton.click()
  await expect(transition).toHaveCount(0)
  await expect(page.getByRole('heading', { name: "Before the captain's seat" })).toBeVisible()
  const watchButton = page.getByRole('button', { name: 'Inspect watch' })
  await expect(watchButton).toBeVisible()
  await expect(watchButton).toBeFocused()
  await expect(page.locator('.locker-status')).toHaveText('Begin with the pilot watch.')
  await expect(page.locator('.locker-memory-tray')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Baseball/i })).toHaveCount(0)

  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as GameState, STORAGE_KEY)
  expect(saved.lockerIntroCompleted).toBe(true)
})

test('watch retries preserve progress and later keepsakes remain in shadow', async ({ page }) => {
  await seed(page, lockerState())

  await expect(page.getByRole('button', { name: 'Inspect watch' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Baseball/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Airline wings/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Charging Bull/i })).toHaveCount(0)

  await page.getByRole('button', { name: 'Inspect watch' }).click()
  await expect(page.getByText(/Rolex GMT-Master was originally developed in 1954/)).toBeVisible()
  await page.getByRole('button', { name: 'Brain fog' }).click()
  await expect(page.locator('.locker-status')).toContainText('crossing several time zones')
  await page.getByRole('button', { name: 'Motion sickness' }).click()
  await expect(page.locator('.locker-status')).toContainText('body clock falling out of sync')
  await expect(page.getByText('0/4')).toBeVisible()

  await page.getByRole('button', { name: 'Jet lag' }).click()
  await expect(page.locator('.locker-status')).toContainText('manage jet lag')
  await expect(page.getByText('1/4')).toBeVisible()
  await expect(page.getByText('The first memory is logged. The next keepsake remains in shadow.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Claim the captain’s hat' })).toBeHidden()

  await page.reload()
  await expect(page.locator('.locker-transition')).toHaveCount(0)
  await expect(page.getByText('1/4')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Review watch' })).toBeVisible()
})

test('reduced motion, replay, and Escape skip keep the accessible path usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seed(page, lockerState())

  await page.getByRole('button', { name: 'Replay locker intro' }).click()
  await expect(page.locator('.locker-transition')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.locker-transition')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Inspect watch' })).toBeVisible()

  await page.getByRole('button', { name: 'Inspect watch' }).click()
  await page.getByRole('button', { name: 'Request a hint' }).click()
  await expect(page.locator('.locker-status')).toContainText('body clock falling out of sync')
  await expect(page.locator('.scene--locker-accessible')).toBeVisible()
})

test('locker GLB loads into the real canvas and the directed camera settles on the watch', async ({ page }) => {
  test.setTimeout(75_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  const responsePromise = page.waitForResponse((response) => response.url().includes('/models/locker-room.glb') && response.status() === 200)
  await seed(page, lockerState({ lockerIntroCompleted: false }), '')
  const response = await responsePromise
  await response.finished()
  expect(Number(response.headers()['content-length'] ?? 0)).toBeGreaterThan(1_000)

  await expect(page.locator('.locker-transition')).toBeVisible()
  await page.getByRole('button', { name: 'Skip cinematic' }).click()
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await expect(canvas).toHaveAttribute('data-locker-camera-cue', 'watch-focus')
  await expect(canvas).toHaveAttribute('data-locker-camera-state', 'settled')
  await expect(canvas).toHaveAttribute('data-locker-watch-node', 'LOCKER_PROP_WATCH')
  await expect(canvas).toHaveAttribute('data-locker-wings-node', 'LOCKER_PROP_WINGS')
  await expect(canvas).toHaveAttribute('data-locker-bull-node', 'LOCKER_PROP_CHARGING_BULL')
  await expect(canvas).toHaveAttribute('data-locker-hat-node', 'LOCKER_PROP_CAPTAINS_HAT')
  await expect(canvas).toHaveAttribute('data-locker-wings-visual', 'silhouette')
  await expect(canvas).toHaveAttribute('data-locker-bull-visual', 'silhouette')
  await expect(canvas).toHaveAttribute('data-locker-hat-visual', 'silhouette')
  await expect(page.locator('.prototype-badge')).toHaveCount(0)
  await expect(page.locator('.locker-shell')).toHaveCSS('background-color', 'rgb(0, 0, 0)')

  const watchPoint = await canvas.evaluate((element) => ({
    x: Number((element as HTMLCanvasElement).dataset.lockerWatchX),
    y: Number((element as HTMLCanvasElement).dataset.lockerWatchY),
  }))
  const canvasBounds = await canvas.boundingBox()
  expect(canvasBounds).not.toBeNull()
  await page.mouse.click(canvasBounds!.x + watchPoint.x, canvasBounds!.y + watchPoint.y)
  await expect(page.getByRole('dialog', { name: 'Pilot watch' })).toBeVisible()

  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as GameState
    saved.lockerCompleted = ['watch', 'baseball', 'wings', 'chargingBull']
    saved.lockerHatRevealed = true
    saved.lockerIntroCompleted = true
    localStorage.setItem(key, JSON.stringify(saved))
  }, STORAGE_KEY)
  await page.reload()
  await expect(page.locator('canvas')).toHaveAttribute('data-locker-hat-visual', 'revealed', { timeout: 30_000 })
  await expect(page.locator('canvas')).toHaveAttribute('data-locker-wings-visual', 'revealed')
  await expect(page.locator('canvas')).toHaveAttribute('data-locker-bull-visual', 'revealed')
  await expect(page.getByRole('button', { name: 'Claim the captain’s hat' })).toBeEnabled()
})

test('locker load failure offers retry and a watch-first accessible fallback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let requests = 0
  await page.route('**/models/locker-room.glb*', (route) => {
    requests += 1
    return route.fulfill({ status: 503, body: 'offline' })
  })
  await seed(page, lockerState({ lockerIntroCompleted: false }), '')
  await expect(page.getByRole('heading', { name: 'The 3D locker could not be opened.' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry 3D' }).click()
  await expect.poll(() => requests).toBe(2)
  await page.getByRole('button', { name: 'Continue with accessible controls' }).click()
  await expect(page.locator('.scene--locker-accessible')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Inspect watch' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Baseball/i })).toHaveCount(0)
})
