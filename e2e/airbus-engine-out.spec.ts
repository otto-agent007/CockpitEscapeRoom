import { expect, test, type Page } from '@playwright/test'
import { statSync } from 'node:fs'
import { airbusCaptainFlow, dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

/**
 * The production tests drive the real 38 MiB GLB through a CPU rasteriser at
 * roughly 1 fps, where the simulator's fixed step advances about 10x slower
 * than wall time. Every assertion below waits on *simulated* state — a needle
 * moving, a sweep advancing, a checkpoint failing — so the default 5s expect
 * budget is around half a second of simulation, and CI failed on values that
 * were simply not there yet (0.0002 against a 0.001 threshold, -0.64° against
 * -1°).
 *
 * This raises the waiting budget only. Every threshold is unchanged, and a
 * passing assertion still returns as soon as it is true, so green runs are no
 * slower — only genuine failures now take longer to report.
 */
const SIM_TIMEOUT_MS = 240_000
const expectSim = expect.configure({ timeout: SIM_TIMEOUT_MS })

function engineOutState(status: 'not_started' | 'in_progress' = 'not_started'): GameState {
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
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      familiarization: 'completed',
      cameraPhase: status === 'in_progress' ? 'storm' : 'qualified',
      location: status === 'in_progress' ? 'engineOut' : 'hub',
      stormLine: {
        status: 'completed',
        checkpoint: 'clearAir',
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: ['weatherJudgment'],
      },
      engineOut: {
        status,
        checkpoint: status === 'in_progress' ? 'stabilization' : 'recognition',
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: [],
      },
    },
    statusMessage: 'Engine-Out Handling simulator ready.',
  }
}

async function seed(page: Page, state: GameState) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  )
  await page.reload()
}

test('Simulator Hub unlocks Engine-Out only after Storm and starts explicit training', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seed(page, engineOutState())

  await expect(page.getByRole('heading', { name: 'Simulator Hub' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Replay Storm Line' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Engine-Out' })).toBeVisible()

  await page.getByRole('button', { name: 'Open Engine-Out' }).click()
  await expect(page.getByRole('heading', { name: 'Engine-Out Handling' })).toBeVisible()
  await expect(page.getByText(/deliberately reduce simulated left-engine power/i)).toBeVisible()
  await page.getByRole('button', { name: 'Begin Engine-Out' }).click()

  const instruments = page.getByRole('region', { name: 'Accessible Engine-Out instruments' })
  await expect(instruments).toBeVisible()
  await expect(page.getByText(/Deliberate simulator event/)).toBeVisible()
  await expect(instruments).toContainText('SIM ENG 1')

  await page.keyboard.down('d')
  await expect.poll(async () => instruments.textContent()).toMatch(
    /Directional error(?:[1-9]\d?|100)%/,
  )
  await page.keyboard.up('d')
})

test('Engine-Out native controls pause and retry only Stabilization', async ({ page }) => {
  test.setTimeout(30_000)
  await page.goto('/?skip3d=1')
  await seed(page, engineOutState('in_progress'))

  await page.getByRole('button', { name: 'Show flight controls' }).click()
  await expect(page.getByRole('button', { name: 'Hold Balance right' })).toBeVisible()

  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByText('Simulator paused')).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()

  const pitchUp = page.getByRole('button', { name: 'Hold Pitch up' })
  await pitchUp.focus()
  await page.keyboard.down('Space')
  await expect(
    page.getByRole('alertdialog', { name: 'stabilization needs another pass' }),
  ).toBeVisible({ timeout: 12_000 })
  await page.keyboard.up('Space')
  await expect(page.getByText(/Ease pitch inside ±12°/)).toBeVisible()
  await page.getByRole('button', { name: 'Retry this stage' }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(
    page.getByRole('region', { name: 'Accessible Engine-Out instruments' }),
  ).toContainText('Pitch0.0°')

  await page.reload()
  await expect(page.getByText(/Engine-Out Handling · stabilization/)).toBeVisible()
})

test('Engine-Out exposes a confirmed full-game restart button', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seed(page, engineOutState('in_progress'))

  await expect(page.getByRole('button', { name: 'Restart' })).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Restart' }).click()
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible()
})

test('Engine-Out diversion completes Airbus without exposing the reward early', async ({ page }) => {
  await page.clock.install()
  await page.addInitScript(() => {
    const gamepad = {
      axes: [0.65, 0, 0.52, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 })),
      connected: true,
      id: 'Engine-Out Diversion Test Pad',
      index: 0,
      mapping: 'standard',
      timestamp: 0,
      vibrationActuator: null,
      hapticActuators: [],
    }
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [gamepad],
      configurable: true,
    })
  })
  await page.goto('/?skip3d=1')
  const active = engineOutState('in_progress')
  await seed(page, {
    ...active,
    airbusSimulator: {
      ...active.airbusSimulator,
      engineOut: {
        ...active.airbusSimulator.engineOut,
        checkpoint: 'diversion',
      },
    },
  })

  await expect(page.getByText(/Engine-Out Handling · diversion/)).toBeVisible()
  await page.getByRole('button', { name: 'Right corridor' }).click()
  await expect(
    page.getByRole('region', { name: 'Captain task: Diversion judgment' }),
  ).toContainText('Captain task complete')
  await page.clock.runFor(45_000)
  await expect(page.getByRole('heading', { name: 'POP T CAPTAIN MODE COMPLETE' })).toBeVisible()
  await expect(page.getByText(/Captain traits:/)).toBeVisible()
  expect(await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as GameState
    return {
      completedPuzzles: saved.completedPuzzles,
      rewardUnlocked: saved.rewardUnlocked,
      engineStatus: saved.airbusSimulator?.engineOut.status,
    }
  }, STORAGE_KEY)).toEqual({
    completedPuzzles: ['dc9', 'locker', 'airbus'],
    rewardUnlocked: false,
    engineStatus: 'completed',
  })
})

test('Simulator Hub and Engine-Out controls remain usable at tablet and phone widths', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await page.goto('/?skip3d=1')
  await seed(page, engineOutState())
  await expect(page.getByRole('heading', { name: 'Simulator Hub' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Engine-Out' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768)
  await page.screenshot({ path: '/tmp/airbus-simulator-hub-tablet-768.png', fullPage: true })

  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await page.getByRole('button', { name: 'Open Engine-Out' }).click()
  await page.getByRole('button', { name: 'Begin Engine-Out' }).click()
  await expect(page.getByRole('button', { name: 'Hold Balance right' })).toBeVisible()
  await expect(page.locator('.airbus-engine-out')).toHaveClass(/is-reduced-motion/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  const topbarBox = await page.locator('.storm-topbar').boundingBox()
  const instrumentsBox = await page
    .getByRole('region', { name: 'Accessible Engine-Out instruments' })
    .boundingBox()
  const toolsBox = await page.locator('.scene-tools').boundingBox()
  const controlsBox = await page.locator('[aria-label="Accessible Engine-Out controls"]').boundingBox()
  if (!topbarBox || !instrumentsBox || !toolsBox || !controlsBox) {
    throw new Error('Responsive Engine-Out layout bounds are unavailable')
  }
  expect(topbarBox.y + topbarBox.height).toBeLessThanOrEqual(instrumentsBox.y)
  expect(toolsBox.y + toolsBox.height).toBeLessThanOrEqual(controlsBox.y)
  for (const control of await page.locator('.storm-hold-control').all()) {
    const box = await control.boundingBox()
    if (!box) throw new Error('Engine-Out control bounds are unavailable')
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(375)
  }
  await page.screenshot({ path: '/tmp/airbus-engine-out-phone-375.png', fullPage: true })
})

test('production Airbus cockpit renders live Engine-Out displays and control response', async ({ page }) => {
  // Wall-clock budget, not a correctness bound — the same one the Storm Line
  // production test carries. This drives the real 38 MiB GLB through a CPU
  // rasteriser at roughly 1 fps, where the simulator's fixed step advances ~10x
  // slower than wall time, and the live-radar assertions below wait on that
  // simulated time rather than on wall time.
  test.setTimeout(1_500_000)
  await page.setViewportSize({ width: 1440, height: 900 })
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
    ...engineOutState(),
  })

  const response = await modelResponse
  expect(Number(response.headers()['content-length'])).toBe(expectedBytes)
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await expect(canvas).toHaveAttribute(
    'data-airbus-simulator-nodes',
    /AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE.*AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT/,
    { timeout: 30_000 },
  )
  const evidenceDirectory = process.env.ENGINE_OUT_EVIDENCE_DIR ?? '/tmp'
  await expect(page.getByRole('heading', { name: 'Simulator Hub' })).toBeVisible()
  await page.screenshot({
    path: `${evidenceDirectory}/airbus-simulator-hub-1440.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Open Engine-Out' }).click()
  await expect(page.getByRole('heading', { name: 'Engine-Out Handling' })).toBeVisible()
  await page.screenshot({
    path: `${evidenceDirectory}/airbus-engine-out-briefing-1440.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Begin Engine-Out' }).click()
  await expect(canvas).toHaveAttribute('data-airbus-camera-phase', 'storm', { timeout: 15_000 })
  await expect(page.getByText(/Engine-Out Handling · recognition/)).toBeVisible()
  await expect(page.getByText(/Deliberate simulator event/)).toBeVisible()
  await expect(canvas).toHaveAttribute('data-engine-out-safe-return-visible', 'false')
  await expect(canvas).toHaveAttribute('data-airbus-weather-depth-bands', '3')
  await expect(canvas).toHaveAttribute('data-airbus-rain-shaft-count', '0')
  await expect(canvas).toHaveAttribute('data-airbus-lightning-active', 'false')
  await expectSim.poll(async () => {
    const weatherSignature = await canvas.getAttribute('data-airbus-weather-signature')
    const radarSignature = await canvas.getAttribute('data-airbus-radar-signature')
    return Boolean(weatherSignature) && weatherSignature === radarSignature
  }, { timeout: SIM_TIMEOUT_MS }).toBe(true)
  await expectSim.poll(async () => {
    const weatherGap = Number(await canvas.getAttribute('data-airbus-visible-gap-bearing'))
    const radarGap = Number(await canvas.getAttribute('data-airbus-radar-gap-bearing'))
    return Math.abs(weatherGap - radarGap)
  }, { timeout: SIM_TIMEOUT_MS }).toBeLessThanOrEqual(5)
  const initialSweep = Number(await canvas.getAttribute('data-airbus-radar-sweep-angle'))
  await expectSim.poll(async () => Number(
    await canvas.getAttribute('data-airbus-radar-sweep-angle'),
  )).not.toBe(initialSweep)

  await page.keyboard.down('d')
  await expectSim.poll(async () => (
    page.getByRole('region', { name: 'Accessible Engine-Out instruments' }).textContent()
  )).toMatch(/Directional error(?:[1-9]\d?|100)%/)
  await expectSim.poll(async () => {
    const rawCue = await canvas.getAttribute('data-engine-out-directional-cue')
    return Math.abs(Number(rawCue))
  }).toBeGreaterThan(0.05)
  await expectSim.poll(async () => {
    const rawDrift = await canvas.getAttribute('data-engine-out-heading-drift')
    return Math.abs(Number(rawDrift))
  }).toBeGreaterThan(0.001)
  await page.keyboard.up('d')

  await page.keyboard.down('ArrowRight')
  await expectSim.poll(async () => {
    const rawRoll = await canvas.getAttribute('data-engine-out-horizon-roll')
    return Math.abs(Number(rawRoll))
  }).toBeGreaterThan(0.08)
  await page.keyboard.up('ArrowRight')

  await expectSim.poll(async () => {
    const text = await page
      .getByRole('region', { name: 'Accessible Engine-Out instruments' })
      .textContent()
    const match = text?.match(/SIM ENG 1(\d+)%/)
    return Number(match?.[1] ?? 100)
  }).toBeLessThan(70)

  await page.waitForTimeout(500)
  await page.screenshot({
    path: `${evidenceDirectory}/airbus-engine-out-recognition-weather-radar-1440.png`,
    fullPage: true,
  })
  expect(consoleErrors).toEqual([])
})
