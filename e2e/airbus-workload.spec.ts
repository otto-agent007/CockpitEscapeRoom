import { expect, test, type Page } from '@playwright/test'
import { airbusCaptainFlow, dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialAirbusWorkloadProgress, type AirbusWorkloadProgress } from '../src/game/airbusWorkload'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

type ScenarioSetup =
  | { scenario: 'stormLine'; checkpoint: 'stormEntry' | 'stormCore' | 'clearAir' }
  | { scenario: 'engineOut'; checkpoint: 'recognition' | 'stabilization' | 'diversion' }

function workloadState(
  setup: ScenarioSetup,
  workload: AirbusWorkloadProgress = createInitialAirbusWorkloadProgress(),
): GameState {
  const initial = createInitialState()
  const engineScenario = setup.scenario === 'engineOut'
  return {
    ...initial,
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
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    completedPuzzles: ['dc9', 'locker'],
    airbusSimulator: {
      familiarization: 'completed',
      cameraPhase: 'storm',
      location: setup.scenario,
      stormLine: {
        status: engineScenario ? 'completed' : 'in_progress',
        checkpoint: setup.scenario === 'stormLine' ? setup.checkpoint : 'clearAir',
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: engineScenario ? ['weatherJudgment'] : [],
      },
      engineOut: {
        status: engineScenario ? 'in_progress' : 'locked',
        checkpoint: setup.scenario === 'engineOut' ? setup.checkpoint : 'recognition',
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: [],
      },
      workload,
    },
    statusMessage: 'Airbus captain workload ready.',
  }
}

async function seed(page: Page, state: GameState) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  )
  await page.reload()
}

async function savedWorkload(page: Page): Promise<AirbusWorkloadProgress> {
  return page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as GameState
    return saved.airbusSimulator.workload
  }, STORAGE_KEY)
}

async function clickProjectedWorkloadSurface(page: Page, horizontalFraction = 0.5) {
  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-airbus-workload-hit-x', /.+/, { timeout: 30_000 })
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Airbus canvas bounds are unavailable')
  const centerX = Number(await canvas.getAttribute('data-airbus-workload-hit-x'))
  const left = Number(await canvas.getAttribute('data-airbus-workload-hit-left'))
  const right = Number(await canvas.getAttribute('data-airbus-workload-hit-right'))
  const x = Number.isFinite(left) && Number.isFinite(right) && right > left
    ? left + (right - left) * horizontalFraction
    : centerX
  const y = Number(await canvas.getAttribute('data-airbus-workload-hit-y'))
  await page.mouse.click(box.x + x, box.y + y)
}

test('native Storm tasks survive safe retry, coach wrong choices, and persist', async ({ page }) => {
  await page.clock.install()
  await page.goto('/?skip3d=1')
  await seed(page, workloadState({ scenario: 'stormLine', checkpoint: 'stormEntry' }))

  const scanTask = page.getByRole('region', { name: 'Captain task: Weather picture' })
  await expect(scanTask).toContainText('Range NEAR')
  await page.getByRole('button', { name: 'Cycle scan range' }).click()
  await expect(scanTask).toContainText('Captain task complete')
  await page.clock.runFor(47_000)
  await expect(page.getByRole('alertdialog', { name: 'Weather entry needs another pass' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry this checkpoint' }).click()
  expect((await savedWorkload(page)).completedTasks).toContain('stormScanRange')

  await seed(page, workloadState(
    { scenario: 'stormLine', checkpoint: 'stormCore' },
    await savedWorkload(page),
  ))
  const routeTask = page.getByRole('region', { name: 'Captain task: Route judgment' })
  await page.getByRole('button', { name: 'Center', exact: true }).click()
  await expect(routeTask).toContainText('weather gap')
  expect((await savedWorkload(page)).selectedWeatherSector).toBe('center')
  await page.getByRole('button', { name: 'West' }).click()
  await expect(routeTask).toContainText('Captain task complete')

  await page.reload()
  const restored = await savedWorkload(page)
  expect(restored.completedTasks).toEqual(['stormScanRange', 'stormGapSelection'])
  expect(restored.selectedWeatherSector).toBe('west')
  expect(restored.scanRange).toBe('mid')
})

test('native Engine-Out tasks acknowledge training and choose the forgiving SAFE RETURN', async ({ page }) => {
  await page.clock.install()
  await page.goto('/?skip3d=1')
  const prior = createInitialAirbusWorkloadProgress()
  prior.scanRange = 'mid'
  prior.selectedWeatherSector = 'west'
  prior.completedTasks = ['stormScanRange', 'stormGapSelection']
  await seed(page, workloadState({ scenario: 'engineOut', checkpoint: 'recognition' }, prior))

  const eventTask = page.getByRole('region', { name: 'Captain task: Event recognition' })
  await page.clock.runFor(12_000)
  await expect(page.getByText(/Engine-Out Handling · recognition/)).toBeVisible()
  await expect(eventTask).toContainText('safely holding this checkpoint')
  await page.getByRole('button', { name: 'Acknowledge training event' }).click()
  await expect(eventTask).toContainText('Captain task complete')
  await page.clock.runFor(500)
  await expect(page.getByText(/Engine-Out Handling · stabilization/)).toBeVisible()

  const diversionWorkload = await savedWorkload(page)
  await seed(page, workloadState(
    { scenario: 'engineOut', checkpoint: 'diversion' },
    diversionWorkload,
  ))
  const returnTask = page.getByRole('region', { name: 'Captain task: Diversion judgment' })
  await page.getByRole('button', { name: 'Left corridor' }).click()
  await expect(returnTask).toContainText('calmer SAFE RETURN')
  expect((await savedWorkload(page)).selectedSafeReturnSide).toBe('left')
  await page.getByRole('button', { name: 'Right corridor' }).click()
  await expect(returnTask).toContainText('Captain task complete')
  const completed = await savedWorkload(page)
  expect(completed.completedTasks).toContain('engineSafeReturnSelection')
  expect(completed.selectedSafeReturnSide).toBe('right')
})

test('production ND and ECAM surfaces dispatch real mesh clicks but ignore camera drags', async ({ page }) => {
  test.setTimeout(360_000)
  const evidenceDirectory = process.env.AIRBUS_WORKLOAD_EVIDENCE_DIR
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await seed(page, workloadState({ scenario: 'stormLine', checkpoint: 'stormEntry' }))

  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-airbus-active-workload-task', 'stormScanRange', { timeout: 60_000 })
  await expect(canvas).toHaveAttribute('data-airbus-radar-range', 'RANGE 20', { timeout: 30_000 })
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Airbus canvas bounds are unavailable')
  const x = Number(await canvas.getAttribute('data-airbus-workload-hit-x'))
  const y = Number(await canvas.getAttribute('data-airbus-workload-hit-y'))
  await page.mouse.move(box.x + x, box.y + y)
  await page.mouse.down()
  await page.mouse.move(box.x + x + 12, box.y + y)
  await page.mouse.up()
  expect((await savedWorkload(page)).completedTasks).not.toContain('stormScanRange')

  await clickProjectedWorkloadSurface(page)
  await expect.poll(async () => (await savedWorkload(page)).completedTasks).toContain('stormScanRange')
  await expect(canvas).toHaveAttribute('data-airbus-radar-range', 'RANGE 40')
  if (evidenceDirectory) {
    await page.screenshot({
      path: `${evidenceDirectory}/storm-entry-range-40-1440.png`,
      fullPage: true,
    })
  }

  const stormCoreWorkload = await savedWorkload(page)
  await seed(page, workloadState(
    { scenario: 'stormLine', checkpoint: 'stormCore' },
    stormCoreWorkload,
  ))
  await expect(canvas).toHaveAttribute('data-airbus-active-workload-task', 'stormGapSelection', { timeout: 60_000 })
  await clickProjectedWorkloadSurface(page, 0.16)
  await expect.poll(async () => (await savedWorkload(page)).completedTasks).toContain('stormGapSelection')
  await expect(canvas).toHaveAttribute(
    'data-airbus-last-workload-action',
    '{"type":"selectWeatherSector","sector":"west"}',
  )
  if (evidenceDirectory) {
    await page.screenshot({
      path: `${evidenceDirectory}/storm-core-west-gap-1440.png`,
      fullPage: true,
    })
  }

  const engineWorkload = await savedWorkload(page)
  await seed(page, workloadState(
    { scenario: 'engineOut', checkpoint: 'recognition' },
    engineWorkload,
  ))
  await expect(canvas).toHaveAttribute('data-airbus-active-workload-task', 'engineEventAcknowledgement', { timeout: 60_000 })
  await clickProjectedWorkloadSurface(page)
  await expect.poll(async () => (await savedWorkload(page)).completedTasks)
    .toContain('engineEventAcknowledgement')
  await expect(canvas).toHaveAttribute('data-airbus-last-workload-action', '{"type":"acknowledgeEngineEvent"}')
  if (evidenceDirectory) {
    await page.screenshot({
      path: `${evidenceDirectory}/engine-recognition-acknowledged-1440.png`,
      fullPage: true,
    })
  }

  await seed(page, workloadState(
    { scenario: 'engineOut', checkpoint: 'diversion' },
    await savedWorkload(page),
  ))
  await expect(canvas).toHaveAttribute('data-airbus-active-workload-task', 'engineSafeReturnSelection', { timeout: 60_000 })
  await clickProjectedWorkloadSurface(page, 0.84)
  await expect.poll(async () => (await savedWorkload(page)).completedTasks)
    .toContain('engineSafeReturnSelection')
  await expect(canvas).toHaveAttribute(
    'data-airbus-last-workload-action',
    '{"type":"selectSafeReturn","side":"right"}',
  )
  if (evidenceDirectory) {
    await page.screenshot({
      path: `${evidenceDirectory}/engine-diversion-right-safe-return-1440.png`,
      fullPage: true,
    })
  }
})

test('workload controls remain reachable without WebGL at 375, 768, and 1440 widths', async ({ page }) => {
  test.setTimeout(60_000)
  const evidenceDirectory = process.env.AIRBUS_WORKLOAD_EVIDENCE_DIR
  await page.goto('/?skip3d=1')
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    await seed(page, workloadState({ scenario: 'stormLine', checkpoint: 'stormCore' }, {
      ...createInitialAirbusWorkloadProgress(),
      scanRange: 'mid',
      completedTasks: ['stormScanRange'],
    }))
    const task = page.getByRole('region', { name: 'Captain task: Route judgment' })
    await expect(task).toBeVisible()
    await expect(page.locator('.airbus-simulator')).toHaveClass(/is-reduced-motion/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    const showControls = page.getByRole('button', { name: 'Show flight controls' })
    if (await showControls.isVisible()) await showControls.click()

    const taskBox = await task.boundingBox()
    const topbarBox = await page.locator('.storm-topbar').boundingBox()
    const instrumentsBox = await page
      .getByRole('region', { name: 'Accessible flight instruments' })
      .boundingBox()
    const controlsBox = await page.locator('.storm-control-deck').boundingBox()
    if (!taskBox || !topbarBox || !instrumentsBox || !controlsBox) {
      throw new Error('Responsive workload bounds are unavailable')
    }
    expect(taskBox.x).toBeGreaterThanOrEqual(0)
    expect(taskBox.x + taskBox.width).toBeLessThanOrEqual(viewport.width)
    expect(taskBox.y + taskBox.height).toBeLessThanOrEqual(controlsBox.y)
    const overlapsInstruments = taskBox.x < instrumentsBox.x + instrumentsBox.width
      && taskBox.x + taskBox.width > instrumentsBox.x
      && taskBox.y < instrumentsBox.y + instrumentsBox.height
      && taskBox.y + taskBox.height > instrumentsBox.y
    expect(overlapsInstruments).toBe(false)
    expect(topbarBox.y + topbarBox.height).toBeLessThanOrEqual(taskBox.y)
    expect(topbarBox.y + topbarBox.height).toBeLessThanOrEqual(instrumentsBox.y)
    await expect(page.getByText(/Model Y|Flight Mode/i)).toHaveCount(0)
    if (evidenceDirectory) {
      await page.screenshot({
        path: `${evidenceDirectory}/native-storm-core-${viewport.width}.png`,
        fullPage: true,
      })
    }
  }
})
