import { expect, test, type Page } from '@playwright/test'
import { dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

async function placeAirbusCard(page: Page, card: string, targetName: string): Promise<void> {
  const dropZoneByTarget: Record<string, string> = {
    Sidestick: 'Cockpit drop zone 1',
    'Thrust levers': 'Cockpit drop zone 2',
    'Gear lever': 'Cockpit drop zone 3',
    'Radio panel': 'Cockpit drop zone 4',
    'Altitude area': 'Cockpit drop zone 5',
  }
  await page.getByRole('button', { name: new RegExp(`^${card}\\b`) }).click()
  await page.getByRole('button', { name: dropZoneByTarget[targetName] }).click()
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
    lockerIntroCompleted: true,
    statusMessage: 'FIRST-OFFICER MODE COMPLETE. Locker access granted.',
  }
}

function createCaptainState(): GameState {
  return {
    ...createLockerState(),
    phase: 'captain',
    lockerCompleted: [...lockerFlow.memoryIds],
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
    captainRouteVerified: true,
    dc9SecureSequence: [...dc9LegacyFlow.secureSequence],
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

test('DC-9 Final Flight Log accessible flow', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedGameState(page, {
    ...createInitialState(),
    phase: 'captain',
    statusMessage: 'The parked DC-9 is ready. Find the route strip on the captain yoke.',
  })

  await page.getByRole('button', { name: 'Open Legacy Route Record' }).click()
  await expect(page.getByRole('dialog', { name: 'Legacy Route Record' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^DTW, Detroit/ })).toBeVisible()
  await expect(page.getByText(/Which three cities were familiar stops/)).toBeVisible()

  for (const code of dc9LegacyFlow.routePuzzleAnswers) {
    await page.getByRole('button', { name: new RegExp(`^${code},`) }).click()
  }
  await page.getByRole('button', { name: 'Record selected routes' }).click()
  const homeOperations = page.getByRole('dialog', { name: 'Home Operations Log — Momma Cheryl' })
  await expect(homeOperations).toBeVisible()
  await expect(homeOperations.getByRole('textbox')).toHaveCount(0)
  await expect(homeOperations.getByText(/parallel operation/i)).toBeVisible()
})

test('Airbus production cockpit loads the A320 GLB', async ({ page }) => {
  test.setTimeout(75_000)
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

  await expect(page.locator('.prototype-badge')).toHaveCount(0)
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByRole('button', { name: /^SIDESTICK\b/ })).toBeVisible({ timeout: 25_000 })
  const sidestickTarget = page.getByRole('button', { name: 'Cockpit drop zone 1' })
  await expect(sidestickTarget).toBeVisible({ timeout: 25_000 })
  await expect(page.locator('.airbus-target-layer')).toHaveClass(/airbus-target-layer--projected/, { timeout: 25_000 })
  await expect(sidestickTarget).toHaveAttribute('style', /px/)
  await expect(page.locator('.airbus-target-layer')).toHaveClass(/airbus-target-layer--mesh-picking/)
  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-airbus-camera-state', /,68\.00000$/)
  expect(consoleErrors).toEqual([])
})

test('DC-9 production cockpit completes the simple captain familiarization scan', async ({ page }) => {
  test.setTimeout(180_000)
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/')
  await page.evaluate(() => window.localStorage.removeItem('cockpit-escape-room:dc9-scan:v2'))
  const modelResponse = page.waitForResponse(
    (response) => response.url().includes('/models/dc9-cockpit.glb') && response.status() === 200,
    { timeout: 30_000 },
  )
  await seedGameState(page, createCaptainState())
  const response = await modelResponse
  expect(Number(response.headers()['content-length'])).toBeGreaterThan(20_000_000)

  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-dc9-model-state', 'ready', { timeout: 30_000 })
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_CAPTAIN_GAME')
  await expect(page.locator('.prototype-badge')).toHaveText('GREYBOX — DC-9 CAPTAIN FLOW')
  await expect(page.locator('.hud')).toHaveCount(0)
  await expect(page.locator('.captain-interface')).toHaveCount(0)
  await page.getByRole('button', { name: /Show/ }).click()
  await expect(page.getByRole('heading', { name: 'Move the captain yoke' })).toBeVisible()

  await page.getByRole('button', { name: 'Pull yoke back' }).click()
  await page.getByRole('button', { name: 'Push yoke forward' }).click()
  await page.getByRole('button', { name: 'Move throttle forward' }).click()
  await page.getByRole('button', { name: 'Return throttle to idle' }).click()
  await page.getByRole('button', { name: 'Flip APU generator switch' }).click()
  await page.getByRole('button', { name: 'Switch APU master off' }).click()
  await page.getByRole('button', { name: 'Adjust captain altimeter' }).click()
  await page.getByRole('button', { name: 'Center captain yoke' }).click()
  await expect(page.getByRole('heading', { name: 'Scan complete' })).toBeVisible()
  await expect(page.getByText('Cockpit scan complete. The DC-9 remains safely parked.')).toBeVisible()
  expect(Number(await canvas.getAttribute('data-dc9-target-count'))).toBeGreaterThan(60)
  expect(Number(await canvas.getAttribute('data-dc9-animated-control-count'))).toBeGreaterThan(70)
  expect(Number(await canvas.getAttribute('data-dc9-inspect-only-control-count'))).toBeGreaterThan(15)
  await expect(canvas).toHaveAttribute('data-dc9-keyboard-control', /DC9_SOURCE_PIVOT_/)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.screenshot({ path: '/tmp/dc9-operations-1440.png' })
  expect(consoleErrors).toEqual([])
})

test('DC-9 model failure keeps the compact accessible captain controls', async ({ page }) => {
  test.setTimeout(30_000)
  await page.route('**/models/dc9-cockpit.glb*', (route) => route.abort())
  await page.goto('/')
  await seedGameState(page, createCaptainState())

  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-dc9-model-state', 'fallback')
  await expect(page.getByRole('alert')).toContainText('3D cockpit unavailable')
  await expect(page.locator('.hud')).toHaveCount(0)

  const btr = page.getByRole('button', { name: /^BTR,/ })
  await btr.press('Enter')
  await expect(btr).toHaveAttribute('aria-pressed', 'true')
})

test('Airbus onboarding, locker reveal, and captain completion unlock reward', async ({ page }) => {
  await page.goto('/?skip3d=1')

  await expect(page.getByRole('heading', { name: "The Captain's Key" })).toBeVisible()
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  await expect(page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })).toHaveCount(0)
  await expect(page.getByText(/minimum total flight time required/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^CLOCK\b/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Hint' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^SIDESTICK\b/ })).toContainText('Used to guide the aircraft.')
  await expect(page.getByRole('button', { name: /^THRUST\b/ })).toContainText('Controls engine power.')
  await expect(page.getByRole('button', { name: /^GEAR\b/ })).toContainText('Controls landing gear position.')
  await expect(page.getByRole('button', { name: /^RADIO\b/ })).toContainText('Used for communication.')
  await expect(page.getByRole('button', { name: /^ALTITUDE\b/ })).toContainText('Shows how high the aircraft is.')
  await expect(page.getByRole('button', { name: /Cockpit drop zone/ })).toHaveCount(5)

  const sidestickCard = page.getByRole('button', { name: /^SIDESTICK\b/ })
  const sidestickTarget = page.getByRole('button', { name: 'Cockpit drop zone 1' })
  await sidestickCard.focus()
  await page.keyboard.press('Enter')
  await sidestickTarget.focus()
  await page.keyboard.press('Enter')
  await expect(sidestickTarget).toHaveClass(/is-correct/)
  await placeAirbusCard(page, 'THRUST', 'Thrust levers')
  await placeAirbusCard(page, 'GEAR', 'Gear lever')
  await placeAirbusCard(page, 'RADIO', 'Radio panel')
  await placeAirbusCard(page, 'ALTITUDE', 'Altitude area')

  const atpAnswer = page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })
  await expect(atpAnswer).toBeVisible()
  await expect(atpAnswer).toHaveValue('')
  await expect(atpAnswer).not.toHaveAttribute('placeholder', '1500')
  await expect(page.getByText(/total flight time \(hours\) required/)).toBeVisible()
  await atpAnswer.fill('1500 hours')
  await atpAnswer.press('Enter')
  const qualification = page.getByRole('dialog', { name: 'Airline Transport Pilot milestone recognized' })
  await expect(qualification).toBeVisible()
  await expect(qualification.getByRole('button', { name: 'Continue' })).toBeFocused()
  await qualification.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Skip cinematic' }).click()

  await expect(page.getByRole('heading', { name: "Before the captain's seat" })).toBeVisible()
  await page.getByRole('button', { name: 'Inspect watch' }).click()
  await expect(page.getByRole('button', { name: 'Jet lag' })).toBeVisible()

  await seedGameState(page, createCaptainState())
  await expect(page.getByRole('heading', { name: 'POP T CAPTAIN MODE' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^BTR,/ })).toBeVisible()

  await seedGameState(page, createRewardState())
  await expect(page.getByRole('heading', { name: 'Ground transport release' })).toBeVisible()
  await expect(page.getByText(/Happy Father’s Day/i)).toBeVisible()
  await expect(page.getByText(/red Tesla Model Y is unlocked/i)).toBeVisible()
})

test('Airbus cards show immediate placement feedback and recover', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()

  const sidestickCard = page.getByRole('button', { name: /^SIDESTICK\b/ })
  const sidestickTarget = page.getByRole('button', { name: 'Cockpit drop zone 1' })
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
  await expect(sidestickCard).toContainText('Placed')

  const radioCard = page.getByRole('button', { name: /^RADIO\b/ })
  const radioTarget = page.getByRole('button', { name: 'Cockpit drop zone 4' })
  await radioCard.click()
  await sidestickTarget.click()
  await expect(sidestickTarget).toHaveClass(/is-wrong/)
  await expect(page.getByText('That card does not match this cockpit control. Try it somewhere else.')).toBeVisible()
  await expect(radioCard).toContainText('Placed')
  await expect(radioCard).not.toContainText('Sidestick')
  await radioCard.click()
  await radioTarget.click()
  await expect(sidestickTarget).not.toHaveClass(/has-card/)
  await expect(radioTarget).toHaveClass(/is-correct/)
  await expect(page.getByText('1/5')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })).toHaveCount(0)

  await placeAirbusCard(page, 'SIDESTICK', 'Sidestick')
  await placeAirbusCard(page, 'GEAR', 'Gear lever')
  await placeAirbusCard(page, 'ALTITUDE', 'Altitude area')
  await expect(page.getByText('4/5')).toBeVisible()
  await placeAirbusCard(page, 'THRUST', 'Thrust levers')
  await expect(page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })).toBeVisible()
  await expect(page.getByRole('heading', { name: "Before the captain's seat" })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Airline Transport Pilot answer' }).fill('1500')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Skip cinematic' }).click()
  await expect(page.getByRole('heading', { name: "Before the captain's seat" })).toBeVisible()
})

test('saved progress persists during Airbus phase', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  await placeAirbusCard(page, 'RADIO', 'Sidestick')
  await page.reload()

  await expect(page.getByRole('button', { name: 'Cockpit drop zone 1' })).toHaveClass(/has-card/)
  await expect(page.getByRole('button', { name: 'Cockpit drop zone 1' })).toHaveClass(/is-wrong/)
  await expect(page.getByRole('button', { name: /^RADIO\b/ })).toContainText('Placed')
})
