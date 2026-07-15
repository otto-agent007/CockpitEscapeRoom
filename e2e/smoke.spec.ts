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
    statusMessage: 'The Captain’s Key opened the locker.',
  }
}

function createDc9State(): GameState {
  return {
    ...createInitialState(),
    phase: 'dc9',
    statusMessage: 'The parked DC-9 is ready. Find the route strip on the first-officer yoke.',
  }
}

function createDc9QualificationState(): GameState {
  return {
    ...createDc9State(),
    dc9: {
      stage: 'qualification',
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      routeAttempts: 0,
      homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
      homeOperationsCompleted: true,
      secureSequence: [...dc9LegacyFlow.secureSequence],
      secureAttempts: 0,
      keyRevealed: false,
      keyClaimed: false,
    },
    statusMessage: 'Aircraft secured. Complete the Airline Transport Pilot milestone to close the Final Flight Log.',
  }
}

function createAirbusState(): GameState {
  return {
    ...createLockerState(),
    phase: 'airbus',
    lockerCompleted: [...lockerFlow.memoryIds],
    lockerHatRevealed: true,
    airbusCaptainModeUnlocked: true,
    completedPuzzles: ['dc9', 'locker'],
    statusMessage: 'Airbus Pop T Captain experience ready.',
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

test('opening stays spoiler-safe, preloads the DC-9, and fades into the cockpit', async ({ page }) => {
  test.setTimeout(45_000)
  const dc9Request = page.waitForRequest(
    (request) => request.url().includes('/models/dc9-cockpit.glb'),
    { timeout: 15_000 },
  )
  await page.goto('/')
  await dc9Request

  await expect(page.locator('.lede')).toHaveText('Take the right seat and complete the Final Flight Log.')
  await expect(page.locator('.briefing-checklist')).toHaveCount(0)
  await expect(page.getByText(/locker reveal/i)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: "The Captain's Key" })).toBeVisible()

  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.locator('.dc9-entry-transition')).toHaveAttribute('data-stage', /fade-out|waiting-for-cockpit|fade-in/)
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.dc9-entry-transition')).toHaveAttribute('data-stage', 'fade-in', { timeout: 20_000 })
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(0, { timeout: 5_000 })
})

test('DC-9 Final Flight Log accessible flow', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedGameState(page, {
    ...createInitialState(),
    phase: 'dc9',
    statusMessage: 'The parked DC-9 is ready. Find the route strip on the first-officer yoke.',
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

test('DC-9 route record uses the yoke hotspot and a compact dialog', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?skip3d=1')
  await seedGameState(page, createDc9State())

  const routeTrigger = page.getByRole('button', { name: 'Open Legacy Route Record' })
  await expect(routeTrigger).toHaveClass(/dc9-route-record-trigger/)
  await expect(routeTrigger).toHaveAttribute('data-projection', 'fallback')
  await expect(page.locator('.dc9-chapter__prompt')).toHaveCount(0)
  await routeTrigger.focus()
  await expect(routeTrigger).toHaveCSS('border-top-color', 'rgb(240, 200, 117)')
  await routeTrigger.press('Enter')

  const routeDialog = page.getByRole('dialog', { name: 'Legacy Route Record' })
  await expect(routeDialog).toBeVisible()
  const routeDialogBounds = await routeDialog.boundingBox()
  expect(routeDialogBounds?.height).toBeLessThan(650)
})

test('DC-9 ATP gate accepts pointer typing and submits the visible answer', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedGameState(page, createDc9QualificationState())

  const answer = page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })
  await answer.click()
  await page.keyboard.type('1500 hours')
  await expect(answer).toHaveValue('1500 hours')
  await expect(answer).toHaveCSS('color', 'rgb(255, 255, 255)')
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page.getByRole('button', { name: "Open The Captain's Key" })).toBeVisible()
})

test('Airbus production cockpit loads the A320 GLB', async ({ page }) => {
  test.setTimeout(75_000)
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/')
  const modelResponse = page.waitForResponse(
    (response) => response.url().includes('/models/airbus-captain.glb') && response.status() === 200,
    { timeout: 20_000 },
  )

  await seedGameState(page, createAirbusState())
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

test('DC-9 production cockpit stages the Final Flight Log with the existing registry', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/')
  const modelResponse = page.waitForResponse(
    (response) => response.url().includes('/models/dc9-cockpit.glb') && response.status() === 200,
    { timeout: 30_000 },
  )
  await seedGameState(page, { ...createInitialState(), phase: 'dc9' })
  const response = await modelResponse
  expect(Number(response.headers()['content-length'])).toBeGreaterThan(20_000_000)

  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-dc9-model-state', 'ready', { timeout: 30_000 })
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL')
  await expect(canvas).toHaveAttribute('data-dc9-targets', /dc9\.route\.BTR/)
  await expect(canvas).toHaveAttribute('data-dc9-targets', /dc9\.secure\.apuBuses/)
  await expect(page.locator('.prototype-badge')).toHaveText('GREYBOX — DC-9 FINAL FLIGHT LOG')
  await expect(page.locator('.hud')).toHaveCount(0)
  await expect(page.locator('.captain-interface')).toHaveCount(0)

  const routeTrigger = page.getByRole('button', { name: 'Open Legacy Route Record' })
  await expect(routeTrigger).toHaveClass(/dc9-route-record-trigger/)
  await expect(page.locator('.dc9-chapter__prompt')).toHaveCount(0)
  await expect(routeTrigger).toHaveAttribute('data-projection', 'mesh')
  await routeTrigger.hover()
  await expect(routeTrigger).toHaveCSS('border-top-color', 'rgb(240, 200, 117)')
  const routePoint = await routeTrigger.getAttribute('data-projection-point')
  expect(routePoint).not.toBeNull()
  if (routePoint) {
    const [clientX, clientY] = routePoint.split(',').map(Number)
    await canvas.dispatchEvent('click', { clientX, clientY, bubbles: true, cancelable: true })
  }
  await expect(page.getByRole('dialog', { name: 'Legacy Route Record' })).toBeVisible()

  for (const code of dc9LegacyFlow.routePuzzleAnswers) {
    await page.getByRole('button', { name: new RegExp(`^${code},`) }).press('Enter')
  }
  await page.getByRole('button', { name: 'Record selected routes' }).press('Enter')
  await expect(page.getByRole('dialog', { name: 'Home Operations Log — Momma Cheryl' })).toBeVisible()
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL')
  for (let pageNumber = 1; pageNumber < dc9LegacyFlow.homeOperationsPages.length; pageNumber += 1) {
    await page.getByRole('button', { name: 'Next page' }).press('Enter')
  }
  await page.getByRole('button', { name: 'Record this legacy' }).press('Enter')
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_FIRST_OFFICER_OVERHEAD_APPROVAL')

  const apuBuses = page.getByRole('button', { name: /APU bus switches/ })
  const apuMaster = page.getByRole('button', { name: /APU master switch/ })
  const battery = page.getByRole('button', { name: /Battery switch/ })
  await expect(apuBuses).toHaveAttribute('data-projection', 'mesh')
  await expect(apuMaster).toHaveAttribute('data-projection', 'mesh')
  await expect(battery).toHaveAttribute('data-projection', 'mesh')
  await battery.press('Enter')
  await apuBuses.press('Enter')
  await battery.press('Enter')
  await expect(apuBuses).toHaveAttribute('aria-pressed', 'true')
  await apuMaster.press('Enter')
  await battery.press('Enter')
  const atpAnswer = page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })
  await atpAnswer.fill('1500 hours')
  await page.getByRole('button', { name: 'Verify' }).press('Enter')
  await expect(page.getByRole('button', { name: "Open The Captain's Key" })).toBeVisible()
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_FIRST_OFFICER_GAME')
  expect(consoleErrors).toEqual([])
})

test('DC-9 model failure keeps the compact accessible captain controls', async ({ page }) => {
  test.setTimeout(30_000)
  await page.route('**/models/dc9-cockpit.glb*', (route) => route.abort())
  await page.goto('/')
  await seedGameState(page, createDc9State())

  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-dc9-model-state', 'fallback')
  await expect(page.getByRole('alert')).toContainText('3D cockpit unavailable')
  await expect(page.locator('.hud')).toHaveCount(0)
  await page.getByRole('button', { name: 'Open Legacy Route Record' }).press('Enter')
  await expect(page.getByRole('dialog', { name: 'Legacy Route Record' })).toBeVisible()
})

test('complete reordered journey', async ({ page }) => {
  await page.goto('/?skip3d=1')

  await expect(page.getByRole('heading', { name: "The Captain's Key" })).toBeVisible()
  await expect(page.getByText('DC-9-32 first-officer station')).toBeVisible()
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toBeVisible()

  await page.getByRole('button', { name: 'Open Legacy Route Record' }).click()
  for (const code of dc9LegacyFlow.routePuzzleAnswers) {
    await page.getByRole('button', { name: new RegExp(`^${code},`) }).click()
  }
  await page.getByRole('button', { name: 'Record selected routes' }).click()
  for (let pageNumber = 1; pageNumber < dc9LegacyFlow.homeOperationsPages.length; pageNumber += 1) {
    await page.getByRole('button', { name: 'Next page' }).click()
  }
  await page.getByRole('button', { name: 'Record this legacy' }).click()
  await page.getByRole('button', { name: /APU bus switches/ }).click()
  await page.getByRole('button', { name: /APU master switch/ }).click()
  await page.getByRole('button', { name: /Battery switch/ }).click()
  const dc9AtpAnswer = page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })
  await expect(dc9AtpAnswer).toBeVisible()
  await dc9AtpAnswer.fill('1500 hours')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.getByRole('button', { name: "Open The Captain's Key" }).click()

  const keyReveal = page.getByRole('dialog', { name: "The Captain's Key" })
  await expect(keyReveal).toBeVisible()
  const engravingFields = keyReveal.locator('.captains-key-reveal__engravings strong')
  await expect(engravingFields).toHaveText([
    dc9LegacyFlow.keyEngravings.front,
    dc9LegacyFlow.keyEngravings.reverse,
  ])
  await keyReveal.getByRole('button', { name: "Take the Captain's Key" }).click()
  await page.getByRole('button', { name: 'Skip cinematic' }).click()

  await expect(page.getByRole('heading', { name: "Before the captain's seat" })).toBeVisible()

  await seedGameState(page, {
    ...createLockerState(),
    lockerCompleted: [...lockerFlow.memoryIds],
    lockerHatRevealed: true,
    statusMessage: lockerFlow.hatText.revealText,
  })

  const lockerCelebration = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE UNLOCKED' })
  await expect(lockerCelebration).toBeVisible()
  await lockerCelebration.getByRole('button', { name: 'Enter Pop T Captain Mode' }).click()

  await expect(page.getByText('Airbus A320 Pop T Captain Mode', { exact: true })).toBeVisible()
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

  const completion = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(completion).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })).toHaveCount(0)
  await completion.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Ground Transport Upgrade Authorized', { exact: true })).toBeVisible()
  await expect(page.getByText(/Happy Father’s Day/i)).toBeVisible()
  await expect(page.getByText(/red Tesla Model Y is unlocked/i)).toBeVisible()
})

test('Airbus cards show immediate placement feedback and recover', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedGameState(page, createAirbusState())

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
  await expect(page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: "Before the captain's seat" })).toHaveCount(0)
  await page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' }).getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Ground Transport Upgrade Authorized', { exact: true })).toBeVisible()
})

test('saved progress persists during Airbus phase', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedGameState(page, createAirbusState())
  await placeAirbusCard(page, 'RADIO', 'Sidestick')
  await page.reload()

  await expect(page.getByRole('button', { name: 'Cockpit drop zone 1' })).toHaveClass(/has-card/)
  await expect(page.getByRole('button', { name: 'Cockpit drop zone 1' })).toHaveClass(/is-wrong/)
  await expect(page.getByRole('button', { name: /^RADIO\b/ })).toContainText('Placed')
})
