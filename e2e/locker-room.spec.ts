import { expect, test, type Page } from '@playwright/test'
import { dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

function lockerState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    phase: 'locker',
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
    completedPuzzles: ['dc9'],
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

test("Captain's Key plays the narrative handoff and settles on the watch-first gate", async ({ page }) => {
  await seed(page, {
    ...createInitialState(),
    phase: 'dc9',
    dc9: {
      stage: 'keyReveal',
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      routeAttempts: 0,
      homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
      homeOperationsCompleted: true,
      secureSequence: [...dc9LegacyFlow.secureSequence],
      secureAttempts: 0,
      keyRevealed: true,
      keyClaimed: false,
    },
    statusMessage: "The Captain's Key is ready.",
  })

  await page.getByRole('button', { name: "Take the Captain's Key" }).click()
  const transition = page.locator('.locker-transition')
  await expect(transition).toBeVisible()
  const skipButton = page.getByRole('button', { name: 'Skip cinematic' })
  await expect(skipButton).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(skipButton).toBeFocused()
  await expect(page.getByRole('button', { name: 'Inspect watch' })).toHaveCount(0)
  await expect(transition).toHaveAttribute('data-locker-intro-stage', 'title-in', { timeout: 5_000 })
  await expect(page.getByText(lockerFlow.introText)).toBeVisible()

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

test('watch completion opens the baseball question, then Bull and Wings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await seed(page, lockerState())

  await expect(page.getByRole('button', { name: 'Inspect watch' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Baseball/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Airline wings/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Charging Bull/i })).toHaveCount(0)

  await page.getByRole('button', { name: 'Inspect watch' }).click()
  await expect(page.getByText(/Rolex GMT-Master was originally developed in 1954/)).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Rolex GMT-Master' }).locator('legend strong')).toContainText('Rolex GMT-Master')
  await page.getByRole('button', { name: 'Brain fog' }).click()
  await expect(page.locator('.locker-status')).toContainText('crossing several time zones')
  await page.getByRole('button', { name: 'Motion sickness' }).click()
  await expect(page.locator('.locker-status')).toContainText('body clock falling out of sync')
  await expect(page.getByText('0/4')).toBeVisible()

  await page.getByRole('button', { name: 'Jet lag' }).click()
  await expect(page.getByText('1/4')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Baseball' })).toBeVisible()
  await expect(page.getByText('Before the captain wore wings, he wore a glove.')).toBeVisible()
  await expect(page.getByText('Which future Pro Football Hall of Famer from Chaffey High crossed paths with him?')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Baseball' }).locator('legend strong')).toContainText('Which future Pro Football Hall of Famer')
  await page.getByRole('button', { name: 'Orlando Pace' }).click()
  await expect(page.locator('.locker-status')).toContainText('not the one attached')
  await page.getByRole('button', { name: 'Johnathan Ogden' }).click()
  await expect(page.locator('.locker-status')).toContainText('first name is Anthony')
  await page.getByRole('button', { name: 'Anthony Muñoz' }).click()
  await expect(page.getByText('2/4')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Charging Bull' })).toBeVisible()
  await expect(page.getByText(/most iconic representation of a bull market/)).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Charging Bull' }).locator('legend strong')).toContainText('Which historical figure')
  await page.getByRole('button', { name: 'Warren Buffett' }).click()
  await expect(page.locator('.locker-status')).toContainText('physicist often associated')
  await page.getByRole('button', { name: 'Benjamin Franklin' }).click()
  await expect(page.locator('.locker-status')).toContainText('correct choice is the physicist')
  await page.getByRole('button', { name: 'Albert Einstein' }).click()
  await expect(page.getByRole('dialog', { name: 'Aviation Traditions: “Breaking the Wings”' })).toBeVisible()
  await expect(page.getByText(/two halves must never be reunited/)).toBeVisible()
  await expect(page.getByText(/minimum amount of second-in-command experience/)).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Aviation Traditions: “Breaking the Wings”' }).locator('legend strong')).toContainText('minimum amount of second-in-command experience')
  const wingsCardBounds = await page.getByRole('dialog', { name: 'Aviation Traditions: “Breaking the Wings”' }).boundingBox()
  const lockerActionsBounds = await page.locator('.locker-actions').boundingBox()
  expect(wingsCardBounds).not.toBeNull()
  expect(lockerActionsBounds).not.toBeNull()
  expect(wingsCardBounds!.y + wingsCardBounds!.height).toBeLessThanOrEqual(lockerActionsBounds!.y)
  const wingsAnswer = page.getByRole('textbox', { name: 'Answer in hours' })
  await expect(wingsAnswer).not.toHaveAttribute('placeholder')
  await wingsAnswer.fill('500 hours')
  await page.getByRole('button', { name: 'Submit answer' }).click()
  await expect(page.locator('.locker-status')).toHaveText('Think in flight hours: it’s a round-number milestone between 500 and 1,500.')
  await wingsAnswer.fill('1500 hours')
  await page.getByRole('button', { name: 'Submit answer' }).click()
  await expect(page.locator('.locker-status')).toHaveText('It’s a four-digit milestone below the 1,500-hour ATP requirement.')
  await wingsAnswer.fill('1,000 hours')
  await page.getByRole('button', { name: 'Submit answer' }).click()
  const celebration = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE UNLOCKED' })
  await expect(celebration).toHaveAttribute('data-celebration-ready', 'true')
  await expect(celebration.getByRole('img', { name: 'Captain’s hat' })).toBeVisible()
  await expect(celebration.locator('.qualification-confetti i')).toHaveCount(24)
  const continueToAirbusButton = celebration.getByRole('button', { name: 'Enter Pop T Captain Mode' })
  await expect(continueToAirbusButton).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(continueToAirbusButton).toBeFocused()

  await page.reload()
  await expect(page.locator('.locker-transition')).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE UNLOCKED' })).toBeVisible()

  await page.setViewportSize({ width: 1440, height: 900 })
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport)
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(horizontalOverflow).toBeLessThanOrEqual(0)
    const celebrationCardOverflow = await celebration.locator('.qualification-card').evaluate((element) => element.scrollWidth - element.clientWidth)
    expect(celebrationCardOverflow).toBeLessThanOrEqual(0)
  }

  await page.getByRole('button', { name: 'Enter Pop T Captain Mode' }).click()
  await expect(page.getByText('Airbus A320 Pop T Captain Mode', { exact: true })).toBeVisible()
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
  test.setTimeout(240_000)
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
  await expect(canvas).toHaveAttribute('data-locker-camera-fov', '30.00')
  await expect(canvas).toHaveAttribute('data-locker-camera-distance', '3.492')
  await expect(canvas).toHaveAttribute('data-locker-camera-position', '1.17,-0.38,3.18')
  await expect(canvas).toHaveAttribute('data-locker-camera-target', '0.42,-0.75,-0.21')
  await expect(canvas).toHaveAttribute('data-locker-watch-node', 'LOCKER_PROP_WATCH')
  await expect(canvas).toHaveAttribute('data-locker-baseball-node', 'LOCKER_PROP_BASEBALL')
  await expect(canvas).toHaveAttribute('data-locker-wings-node', 'LOCKER_PROP_WINGS')
  await expect(canvas).toHaveAttribute('data-locker-bull-node', 'LOCKER_PROP_CHARGING_BULL')
  await expect(canvas).toHaveAttribute('data-locker-hat-node', 'LOCKER_PROP_CAPTAINS_HAT')
  await expect(canvas).toHaveAttribute('data-locker-wings-visual', 'silhouette')
  await expect(canvas).toHaveAttribute('data-locker-baseball-visual', 'silhouette')
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
  await expect(page.getByRole('dialog', { name: 'Rolex GMT-Master' })).toBeVisible()
  await page.getByRole('button', { name: 'Jet lag' }).click()
  await expect(canvas).toHaveAttribute('data-locker-camera-cue', 'baseball-focus')
  await expect(canvas).toHaveAttribute('data-locker-camera-state', 'settled')
  await expect(canvas).toHaveAttribute('data-locker-camera-fov', '30.00')
  await expect(canvas).toHaveAttribute('data-locker-camera-distance', '3.490')
  await expect(page.getByRole('dialog', { name: 'Baseball' })).toBeVisible()
  await page.getByRole('button', { name: 'Anthony Muñoz' }).click()
  await expect(canvas).toHaveAttribute('data-locker-camera-cue', 'bull-focus')
  await expect(canvas).toHaveAttribute('data-locker-camera-state', 'settled')
  await expect(canvas).toHaveAttribute('data-locker-camera-fov', '30.00')
  await expect(canvas).toHaveAttribute('data-locker-camera-distance', '3.490')
  await page.getByRole('button', { name: 'Albert Einstein' }).click()
  await expect(canvas).toHaveAttribute('data-locker-camera-cue', 'wings-focus')
  await expect(canvas).toHaveAttribute('data-locker-camera-state', 'settled')
  await expect(canvas).toHaveAttribute('data-locker-camera-fov', '30.00')
  await expect(canvas).toHaveAttribute('data-locker-camera-distance', '3.490')
  await page.evaluate(() => {
    const main = document.querySelector('main')
    if (!main) throw new Error('Game shell is unavailable')
    const windowWithStages = window as Window & { __lockerHatStages?: Array<{ stage: string | null; time: number }> }
    windowWithStages.__lockerHatStages = []
    new MutationObserver(() => {
      windowWithStages.__lockerHatStages?.push({
        stage: main.getAttribute('data-locker-hat-finale-stage'),
        time: performance.now(),
      })
    }).observe(main, { attributes: true, attributeFilter: ['data-locker-hat-finale-stage'] })
  })
  await page.getByRole('textbox', { name: 'Answer in hours' }).fill('1000 hours')
  await page.getByRole('button', { name: 'Submit answer' }).click()
  await expect(canvas).toHaveAttribute('data-locker-camera-cue', 'hat-focus')
  await expect(canvas).toHaveAttribute('data-locker-camera-state', 'settled')
  await expect(page.locator('main')).toHaveAttribute('data-locker-hat-finale-stage', 'holding')
  await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE UNLOCKED' })).toHaveCount(0)
  await expect(page.locator('main')).toHaveAttribute('data-locker-hat-finale-stage', 'ready', { timeout: 10_000 })
  const holdDuration = await page.evaluate(() => {
    const stages = (window as Window & { __lockerHatStages?: Array<{ stage: string | null; time: number }> }).__lockerHatStages ?? []
    const holding = stages.find((entry) => entry.stage === 'holding')
    const ready = stages.find((entry) => entry.stage === 'ready')
    if (!holding || !ready) throw new Error(`Missing finale stages: ${JSON.stringify(stages)}`)
    return ready.time - holding.time
  })
  expect(holdDuration).toBeGreaterThanOrEqual(1_950)
  await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE UNLOCKED' })).toBeVisible()
  await expect(page.locator('.qualification-confetti')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Enter Pop T Captain Mode' })).toBeFocused()

  await page.reload()
  await expect(page.locator('canvas')).toHaveAttribute('data-locker-hat-visual', 'revealed', { timeout: 30_000 })
  await expect(page.locator('canvas')).toHaveAttribute('data-locker-baseball-visual', 'revealed')
  await expect(page.locator('canvas')).toHaveAttribute('data-locker-wings-visual', 'revealed')
  await expect(page.locator('canvas')).toHaveAttribute('data-locker-bull-visual', 'revealed')
  await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE UNLOCKED' })).toBeVisible()
  await page.getByRole('button', { name: 'Enter Pop T Captain Mode' }).click()
  await expect(page.getByRole('heading', { name: 'Airbus A320 Pop T Captain Mode' })).toBeVisible()
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
