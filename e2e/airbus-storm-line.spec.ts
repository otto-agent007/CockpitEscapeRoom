import { expect, test, type Page } from '@playwright/test'
import { statSync } from 'node:fs'
import { airbusCaptainFlow, dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

function airbusState(): GameState {
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
  }
}

async function seed(page: Page, state = airbusState()) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  )
  await page.reload()
}

async function startAccessibleStormLine(page: Page) {
  await page.goto('/?skip3d=1')
  await seed(page, {
    ...airbusState(),
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      familiarization: 'completed',
      cameraPhase: 'qualified',
      location: 'hub',
      stormLine: {
        status: 'not_started',
        checkpoint: 'stormEntry',
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: [],
      },
      engineOut: {
        status: 'locked',
        checkpoint: 'recognition',
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: [],
      },
    },
  })
  await page.getByRole('button', { name: 'Open Storm Line' }).click()
  await page.getByRole('button', { name: 'Begin Storm Line' }).click()
  await expect(page.getByRole('region', { name: 'Accessible flight instruments' })).toBeVisible()
}

test('Storm Line stays locked until the five-card Airbus qualification is complete', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seed(page)

  await expect(page.getByRole('button', { name: /skip familiarization/i })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Simulator Hub' })).toHaveCount(0)

  await seed(page, {
    ...airbusState(),
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      familiarization: 'completed',
      cameraPhase: 'qualified',
      location: 'hub',
      stormLine: {
        status: 'not_started',
        checkpoint: 'stormEntry',
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: [],
      },
      engineOut: {
        status: 'locked',
        checkpoint: 'recognition',
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: [],
      },
    },
  })

  await expect(page.getByRole('heading', { name: 'Simulator Hub' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Storm Line' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Complete Storm Line first' })).toBeDisabled()
})

test('Storm Line supports keyboard flight, pause, and durable checkpoint reload', async ({ page }) => {
  await startAccessibleStormLine(page)

  await page.keyboard.down('ArrowLeft')
  await expect.poll(async () => page.getByRole('region', { name: 'Accessible flight instruments' }).textContent())
    .toMatch(/Bank-\d|Bank−\d/)
  await page.keyboard.up('ArrowLeft')

  await page.keyboard.down('w')
  await expect.poll(async () => page.getByRole('region', { name: 'Accessible flight instruments' }).textContent())
    .toMatch(/Energy5[1-9]%|Energy6[0-5]%/)
  await page.keyboard.up('w')

  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByText('Simulator paused')).toBeVisible()
  await expect(page.getByText('Inputs are centered and progress is safe.')).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()

  await page.evaluate(() => {
    Object.defineProperty(window, 'AudioContext', {
      value: class {
        constructor() {
          throw new Error('Audio unavailable in test')
        }
      },
      configurable: true,
    })
  })
  await page.getByRole('button', { name: 'Sound off' }).click()
  await expect(page.getByRole('button', { name: 'Sound off' })).toBeVisible()

  await page.reload()
  await expect(page.getByText(/Storm Line · Weather entry/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
})

test('Storm Flight controls default compact on desktop and expanded at 768px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await startAccessibleStormLine(page)

  const desktopToggle = page.getByRole('button', { name: 'Show flight controls' })
  await expect(desktopToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('button', { name: 'Hold Bank left' })).toHaveCount(0)
  await desktopToggle.click()
  await expect(page.getByRole('button', { name: 'Hold Bank left' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Recenter view' })).toBeVisible()

  await page.setViewportSize({ width: 768, height: 900 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Hide flight controls' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: 'Hold Bank left' })).toBeVisible()
})

test('Storm Line reads a standard gamepad and safely retries an attitude departure', async ({ page }) => {
  await page.addInitScript(() => {
    const gamepad = {
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 })),
      connected: true,
      id: 'Storm Line Test Pad',
      index: 0,
      mapping: 'standard',
      timestamp: 0,
      vibrationActuator: null,
      hapticActuators: [],
    }
    Object.defineProperty(window, '__stormLineGamepad', { value: gamepad, configurable: true })
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [gamepad],
      configurable: true,
    })
  })
  await startAccessibleStormLine(page)
  await page.getByRole('button', { name: 'Show flight controls' }).click()

  await page.evaluate(() => {
    const gamepad = (window as unknown as { __stormLineGamepad: { axes: number[] } }).__stormLineGamepad
    gamepad.axes[0] = -1
  })
  await expect(page.getByText('Input: gamepad')).toBeVisible()
  await expect.poll(async () => page.getByRole('region', { name: 'Accessible flight instruments' }).textContent())
    .toMatch(/Bank-\d|Bank−\d/)
  await page.evaluate(() => {
    const gamepad = (window as unknown as { __stormLineGamepad: { axes: number[] } }).__stormLineGamepad
    gamepad.axes[0] = 0
  })

  const pitchUp = page.getByRole('button', { name: 'Hold Pitch up' })
  await pitchUp.focus()
  await page.keyboard.down('Space')
  await expect(page.getByRole('alertdialog', { name: 'Weather entry needs another pass' })).toBeVisible({ timeout: 12_000 })
  await page.keyboard.up('Space')
  await expect(page.getByText(/Ease the sidestick toward center/)).toBeVisible()
  await page.getByRole('button', { name: 'Retry this checkpoint' }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Accessible flight instruments' })).toContainText('Pitch0.0°')

  await page.getByRole('button', { name: 'Sound off' }).click()
  await expect(page.getByRole('button', { name: 'Sound on' })).toBeVisible()
  await page.getByRole('button', { name: 'Sound on' }).click()
  await expect(page.getByRole('button', { name: 'Sound off' })).toBeVisible()
})

test('production Airbus GLB renders Storm Line displays, controls, and responsive approval views', async ({ page }) => {
  test.setTimeout(480_000)
  const expectedBytes = statSync('public/models/airbus-captain.glb').size
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.goto('/')
  const modelResponse = page.waitForResponse(
    (response) => response.url().includes('/models/airbus-captain.glb') && response.status() === 200,
    { timeout: 30_000 },
  )
  await seed(page, {
    ...airbusState(),
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      familiarization: 'completed',
      cameraPhase: 'qualified',
      location: 'hub',
      stormLine: {
        status: 'not_started',
        checkpoint: 'stormCore',
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: [],
      },
      engineOut: {
        status: 'locked',
        checkpoint: 'recognition',
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: [],
      },
    },
  })
  const response = await modelResponse
  expect(Number(response.headers()['content-length'])).toBe(expectedBytes)
  const fetchedBytes = await page.evaluate(async () => {
    const response = await fetch('/models/airbus-captain.glb?v=storm-flight-0a6c8aeb', { cache: 'no-store' })
    return (await response.arrayBuffer()).byteLength
  })
  expect(fetchedBytes).toBe(expectedBytes)

  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await page.getByRole('button', { name: 'Open Storm Line' }).click()
  await page.getByRole('button', { name: 'Begin Storm Line' }).click()
  await expect(canvas).toHaveAttribute('data-airbus-camera-phase', 'transitioning')
  await expect(canvas).toHaveAttribute('data-airbus-camera-phase', 'storm', { timeout: 15_000 })
  await expect(page.getByText(/Storm Line · Storm core/)).toBeVisible({ timeout: 30_000 })
  await expect(canvas).toHaveAttribute(
    'data-airbus-simulator-nodes',
    /AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE.*AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT/,
    { timeout: 30_000 },
  )
  await expect(canvas).toHaveAttribute('data-airbus-weather-depth-bands', '3')
  await expect.poll(async () => Number(
    await canvas.getAttribute('data-airbus-weather-cloud-count'),
  )).toBeLessThanOrEqual(48)
  await expect.poll(async () => Number(
    await canvas.getAttribute('data-airbus-rain-shaft-count'),
  )).toBeLessThanOrEqual(8)
  await expect.poll(async () => {
    const weatherSignature = await canvas.getAttribute('data-airbus-weather-signature')
    const radarSignature = await canvas.getAttribute('data-airbus-radar-signature')
    return Boolean(weatherSignature) && weatherSignature === radarSignature
  }).toBe(true)
  await expect.poll(async () => {
    const weatherGap = Number(await canvas.getAttribute('data-airbus-visible-gap-bearing'))
    const radarGap = Number(await canvas.getAttribute('data-airbus-radar-gap-bearing'))
    return Math.abs(weatherGap - radarGap)
  }).toBeLessThanOrEqual(5)
  const initialSweep = Number(await canvas.getAttribute('data-airbus-radar-sweep-angle'))
  await expect.poll(async () => Number(
    await canvas.getAttribute('data-airbus-radar-sweep-angle'),
  )).not.toBe(initialSweep)
  await page.getByRole('button', { name: 'Pause' }).click()
  await page.waitForTimeout(250)
  const pausedSweep = await canvas.getAttribute('data-airbus-radar-sweep-angle')
  await page.waitForTimeout(750)
  await expect(canvas).toHaveAttribute('data-airbus-radar-sweep-angle', pausedSweep ?? '')
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect.poll(async () => Number(
    await canvas.getAttribute('data-airbus-radar-sweep-angle'),
  )).not.toBe(Number(pausedSweep))
  await expect(page.getByRole('region', { name: 'Accessible flight instruments' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show flight controls' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Recenter view' })).toBeVisible()

  await page.keyboard.down('ArrowLeft')
  await expect.poll(async () => {
    const rawRoll = await canvas.getAttribute('data-storm-horizon-roll')
    return Math.abs(Number(rawRoll))
  }, { timeout: 15_000 }).toBeGreaterThan(0.08)
  await page.keyboard.up('ArrowLeft')

  const canvasBox = await canvas.boundingBox()
  if (!canvasBox) throw new Error('Airbus canvas bounds are unavailable')
  await page.mouse.move(canvasBox.x + canvasBox.width * 0.5, canvasBox.y + canvasBox.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(canvasBox.x + canvasBox.width * 0.62, canvasBox.y + canvasBox.height * 0.42)
  await page.mouse.up()
  await expect.poll(async () => canvas.getAttribute('data-airbus-look-state')).not.toBe('0.0000,0.0000,0.0000,0.0000')
  const lookValues = (await canvas.getAttribute('data-airbus-look-state'))?.split(',').map(Number) ?? []
  expect(Math.abs(lookValues[0])).toBeLessThanOrEqual(10)
  expect(Math.abs(lookValues[1])).toBeLessThanOrEqual(6)
  expect(Math.abs(lookValues[2])).toBeLessThanOrEqual(0.015)
  expect(lookValues[3]).toBe(0)

  await page.getByRole('button', { name: 'Recenter view' }).click()
  await expect(canvas).toHaveAttribute('data-airbus-look-state', '0.0000,0.0000,0.0000,0.0000')

  const resetsBeforeRetry = Number(await canvas.getAttribute('data-airbus-radar-reset-count'))
  await page.getByRole('button', { name: 'Show flight controls' }).click()
  const pitchUp = page.getByRole('button', { name: 'Hold Pitch up' })
  await pitchUp.focus()
  await page.keyboard.down('Space')
  await page.keyboard.down('ArrowLeft')
  await expect(
    page.getByRole('alertdialog', { name: /storm core needs another pass/i }),
  ).toBeVisible({ timeout: 150_000 })
  await page.keyboard.up('Space')
  await page.keyboard.up('ArrowLeft')
  await page.getByRole('button', { name: 'Retry this checkpoint' }).click()
  await expect.poll(async () => Number(
    await canvas.getAttribute('data-airbus-radar-reset-count'),
  )).toBeGreaterThan(resetsBeforeRetry)
  const retrySweep = Number(await canvas.getAttribute('data-airbus-radar-sweep-angle'))
  await expect.poll(async () => Number(
    await canvas.getAttribute('data-airbus-radar-sweep-angle'),
  )).not.toBe(retrySweep)

  const evidenceDirectory = process.env.STORM_LINE_EVIDENCE_DIR ?? '/tmp'
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(500)
  await page.screenshot({
    path: `${evidenceDirectory}/airbus-storm-core-weather-radar-1440.png`,
    fullPage: true,
  })
  expect(consoleErrors).toEqual([])
})
