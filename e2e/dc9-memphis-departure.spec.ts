import { expect, test, type Page } from '@playwright/test'
import { dc9LegacyFlow } from '../src/game/config'
import { DC9_CONTROL_CHECK_ITEM_IDS } from '../src/game/dc9ControlCheck'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

const MEMPHIS_MODEL_PATH = '/models/dc9-memphis-legacy-departure.glb'
const MODEL_Y_MODEL_PATH = '/models/model-y-reward.glb'
const RIGHT_SEAT_CAMERA = 'CAM_DC9_FIRST_OFFICER_GAME'

function departureState(
  checkpoint: GameState['dc9']['departure']['checkpoint'] = 'rampStart',
  attempts: GameState['dc9']['departure']['attempts'] = {},
): GameState {
  const completedBeats = checkpoint === 'rampStart'
    ? []
    : checkpoint === 'taxiTurn'
      ? ['rampRelease'] as const
      : checkpoint === 'holdShort'
        ? ['rampRelease', 'taxi'] as const
        : checkpoint === 'runwayLineup'
          ? ['rampRelease', 'taxi', 'holdShort'] as const
          : checkpoint === 'initialClimb'
            ? ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation'] as const
            : ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation', 'initialClimb', 'complete'] as const
  const complete = checkpoint === 'complete'
  return {
    ...createInitialState(),
    phase: 'dc9',
    dc9: {
      ...createInitialState().dc9,
      stage: complete ? 'homeOperations' : 'memphisDeparture',
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      departure: {
        checkpoint,
        completedBeats: [...completedBeats],
        attempts,
        hintLevel: Math.min(3, Math.max(0, ...Object.values(attempts))) as 0 | 1 | 2 | 3,
        completed: complete,
      },
    },
  }
}

async function seedDeparture(
  page: Page,
  checkpoint: GameState['dc9']['departure']['checkpoint'],
  attempts: GameState['dc9']['departure']['attempts'] = {},
): Promise<void> {
  await page.evaluate(
    ({ key, state }) => window.localStorage.setItem(key, JSON.stringify(state)),
    { key: STORAGE_KEY, state: departureState(checkpoint, attempts) },
  )
  await page.reload()
}

async function seedState(page: Page, state: GameState): Promise<void> {
  await page.evaluate(
    ({ key, savedState }) => window.localStorage.setItem(key, JSON.stringify(savedState)),
    { key: STORAGE_KEY, savedState: state },
  )
  await page.reload()
}

function routeRecordState(): GameState {
  const state = createInitialState()
  return {
    ...state,
    phase: 'dc9',
    dc9: {
      ...state.dc9,
      stage: 'intro',
      controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
    },
  }
}

async function savedDeparture(page: Page): Promise<GameState['dc9']['departure']> {
  return page.evaluate((key) => {
    const saved = window.localStorage.getItem(key)
    if (!saved) throw new Error('Missing saved game state')
    return JSON.parse(saved).dc9.departure
  }, STORAGE_KEY)
}

async function expectDurableProgress(
  page: Page,
  checkpoint: GameState['dc9']['departure']['checkpoint'],
  completedBeats: readonly string[],
): Promise<void> {
  await expect.poll(() => savedDeparture(page)).toMatchObject({ checkpoint, completedBeats })
  for (const code of dc9LegacyFlow.routePuzzleAnswers) {
    await expect.poll(() => page.evaluate(({ key, routeCode }) => {
      const saved = window.localStorage.getItem(key)
      return saved ? JSON.parse(saved).dc9.routeCompleted.includes(routeCode) : false
    }, { key: STORAGE_KEY, routeCode: code })).toBe(true)
  }
}

async function waitForMemphisEnvironment(page: Page): Promise<void> {
  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-dc9-model-state', 'ready', { timeout: 30_000 })
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', RIGHT_SEAT_CAMERA)
  await expect(canvas).toHaveAttribute('data-dc9-memphis-model-state', 'ready', { timeout: 30_000 })
  await expect(canvas).toHaveAttribute('data-dc9-memphis-object-count', /^[1-9]\d*$/)
  await expect(canvas).toHaveAttribute('data-dc9-memphis-beat', /^(rampRelease|taxi|holdShort|lineup|takeoffRoll|rotation|initialClimb)$/)
  const pose = await canvas.getAttribute('data-dc9-memphis-world-pose')
  expect(pose).not.toBeNull()
  const parsed = JSON.parse(pose!) as { position: number[]; quaternion: number[] }
  expect(parsed.position).toHaveLength(3)
  expect(parsed.quaternion).toHaveLength(4)
  // The environment is authored out to 700 m; the parked cockpit's 100 m far
  // plane must not clip the Memphis frontage out of the windshield.
  const frustum = await canvas.getAttribute('data-dc9-camera-frustum')
  expect(frustum).not.toBeNull()
  const [nearPlane, farPlane] = frustum!.split(',').map(Number)
  expect(nearPlane).toBeGreaterThan(0)
  expect(farPlane).toBeGreaterThanOrEqual(1500)
  expect([...parsed.position, ...parsed.quaternion].every(Number.isFinite)).toBe(true)
}

async function hold(page: Page, name: string, milliseconds: number): Promise<void> {
  const button = await page.getByRole('button', { name }).elementHandle()
  if (!button) throw new Error(`Missing native hold button: ${name}`)
  await button.dispatchEvent('pointerdown')
  await page.waitForTimeout(milliseconds)
  await button.dispatchEvent('pointerup')
}

async function holdPointer(page: Page, name: string, milliseconds: number): Promise<void> {
  const button = page.getByRole('button', { name })
  await button.scrollIntoViewIfNeeded()
  await button.hover()
  await page.mouse.down()
  await page.waitForTimeout(milliseconds)
  await page.mouse.up()
}

async function reachInitialClimbWithRealEnvironment(page: Page): Promise<void> {
  await seedDeparture(page, 'runwayLineup')
  await waitForMemphisEnvironment(page)
  const activeBeat = page.locator('.dc9-memphis-departure__header > p').last()
  const advance = page.getByRole('button', { name: 'Advance thrust levers' })
  await advance.dispatchEvent('pointerdown')
  await page.waitForTimeout(500)
  await advance.dispatchEvent('pointerup')
  await expect(activeBeat).toContainText('Legacy roll', { timeout: 3_000 })
  await page.waitForTimeout(950)
  await holdPointer(page, 'Pull column aft', 250)
  await expect(activeBeat).toContainText('Climb out', { timeout: 3_000 })
  await expect(page.locator('canvas')).toHaveAttribute('data-dc9-memphis-beat', 'initialClimb')
}

test('real Memphis environment requests only after the route record and stays in the right seat', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const requestedPaths: string[] = []
  const consoleErrors: string[] = []
  const consoleWarnings: string[] = []
  page.on('request', (request) => requestedPaths.push(new URL(request.url()).pathname))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
    if (message.type() === 'warning') consoleWarnings.push(message.text())
  })

  await page.goto('/')
  await seedState(page, routeRecordState())
  await expect(page).toHaveTitle("The Captain's Key")
  await expect(page.locator('main.game-shell')).toBeVisible()
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  expect(requestedPaths.filter((path) => path === MEMPHIS_MODEL_PATH)).toHaveLength(0)

  await page.getByRole('button', { name: 'Open Legacy Route Record' }).click()
  for (const code of dc9LegacyFlow.routePuzzleAnswers) {
    await page.getByRole('button', { name: new RegExp(`^${code},`) }).click()
  }
  await page.getByRole('button', { name: 'Record selected routes' }).click()
  await expect(page.getByRole('heading', { name: 'Memphis Legacy Departure' })).toBeVisible()
  await expect.poll(() => requestedPaths.filter((path) => path === MEMPHIS_MODEL_PATH).length).toBe(1)
  await waitForMemphisEnvironment(page)
  expect(requestedPaths).not.toContain(MODEL_Y_MODEL_PATH)
  await expect(page.getByText(/Model Y|Tesla/i)).toHaveCount(0)
  expect(consoleErrors).toEqual([])
  expect(consoleWarnings.every((warning) => (
    warning.includes('THREE.Clock: This module has been deprecated')
    || warning.includes('GPU stall due to ReadPixels')
  ))).toBe(true)
})

test('brake keeps a captured pointer hold and Space belongs to its focused native control', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedDeparture(page, 'rampStart')

  const brake = page.getByRole('button', { name: 'Hold brake' })
  await brake.dispatchEvent('pointerdown', { pointerId: 41 })
  await expect(brake).toHaveAttribute('aria-pressed', 'true')
  await brake.dispatchEvent('pointerleave', { pointerId: 41 })
  await expect(brake).toHaveAttribute('aria-pressed', 'true')
  await brake.dispatchEvent('pointerup', { pointerId: 41 })
  await expect(brake).toHaveAttribute('aria-pressed', 'false')
  await brake.dispatchEvent('pointerdown', { pointerId: 42 })
  await brake.dispatchEvent('pointercancel', { pointerId: 42 })
  await expect(brake).toHaveAttribute('aria-pressed', 'false')
  await brake.dispatchEvent('pointerdown', { pointerId: 43 })
  await brake.dispatchEvent('lostpointercapture', { pointerId: 43 })
  await expect(brake).toHaveAttribute('aria-pressed', 'false')
  await brake.dispatchEvent('pointerdown', { pointerId: 44 })
  await brake.dispatchEvent('blur')
  await expect(brake).toHaveAttribute('aria-pressed', 'false')

  const advance = page.getByRole('button', { name: 'Advance thrust levers' })
  const thrustMeter = page.getByRole('meter', { name: 'Thrust levers position' })
  await advance.focus()
  await page.keyboard.down(' ')
  await expect(thrustMeter).not.toHaveAttribute('aria-valuenow', '0')
  await expect(brake).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.up(' ')

  await hold(page, 'Close thrust levers', 300)
  await expect(thrustMeter).toHaveAttribute('aria-valuenow', '0')
  await brake.focus()
  await page.keyboard.down(' ')
  await expect(brake).toHaveAttribute('aria-pressed', 'true')
  await expect(thrustMeter).toHaveAttribute('aria-valuenow', '0')
  await page.keyboard.up(' ')
  await expect(brake).toHaveAttribute('aria-pressed', 'false')

  await page.evaluate(() => document.body.focus())
  await page.keyboard.down(' ')
  await expect(brake).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.up(' ')
  await expect(brake).toHaveAttribute('aria-pressed', 'false')
})

test('native buttons and keyboard drive the same durable ramp checkpoint', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedDeparture(page, 'rampStart')

  const nativeAdvance = page.getByRole('button', { name: 'Advance thrust levers' })
  await nativeAdvance.dispatchEvent('pointerdown')
  await expect(page.locator('.dc9-memphis-departure__method')).toContainText('native hold buttons')
  await page.waitForTimeout(500)
  await expectDurableProgress(page, 'taxiTurn', ['rampRelease'])
  await nativeAdvance.dispatchEvent('pointerup')

  await seedDeparture(page, 'rampStart')
  await page.evaluate(() => document.body.focus())
  await page.keyboard.down('KeyW')
  await expect(page.locator('.dc9-memphis-departure__method')).toContainText('Keyboard controls ready')
  await expect(page.getByRole('meter', { name: 'Thrust levers position' })).not.toHaveAttribute('aria-valuenow', '0')
  await expectDurableProgress(page, 'taxiTurn', ['rampRelease'])
  await page.keyboard.up('KeyW')
})

test('mistakes, hints, hold and rotation remain recoverable without erasing route stamps', async ({ page }) => {
  test.setTimeout(45_000)
  await page.goto('/?skip3d=1')
  await seedDeparture(page, 'taxiTurn')

  const guidance = page.getByRole('status', { name: 'Departure guidance' })
  for (const hintLevel of [1, 2, 3]) {
    await hold(page, 'Right rudder pedal', 1_500)
    await expect(guidance).toContainText(`Hint level ${hintLevel}`)
    await expectDurableProgress(page, 'taxiTurn', ['rampRelease'])
  }
  await page.getByRole('button', { name: 'Restore checkpoint' }).click()
  await expect(guidance).toContainText('Checkpoint restored')
  await expectDurableProgress(page, 'taxiTurn', ['rampRelease'])

  // Crossing the hold boundary without brake/closed-thrust intent is restored safely.
  await page.evaluate(() => document.body.focus())
  await page.keyboard.down('KeyW')
  await expect.poll(async () => (await savedDeparture(page)).attempts.taxi).toBe(4)
  await page.keyboard.up('KeyW')
  await expect(guidance).toContainText(/safe retry/i)
  await expectDurableProgress(page, 'taxiTurn', ['rampRelease'])

  // A lineup click delivered from the still-rendered button after motion begins must
  // be rejected by the authoritative frame, then remain available after stopping.
  await seedDeparture(page, 'holdShort')
  const lineup = page.getByRole('button', { name: 'Ready to line up' })
  await expect(lineup).toBeVisible()
  await lineup.focus()
  await page.keyboard.down('w')
  await page.waitForTimeout(180)
  await expect(lineup).toHaveCount(0)
  await page.keyboard.press('Enter')
  await page.keyboard.up('w')
  await expectDurableProgress(page, 'holdShort', ['rampRelease', 'taxi'])

  const brake = page.getByRole('button', { name: 'Hold brake' })
  const close = page.getByRole('button', { name: 'Close thrust levers' })
  await Promise.all([close.dispatchEvent('pointerdown'), brake.dispatchEvent('pointerdown')])
  await page.waitForTimeout(500)
  await Promise.all([close.dispatchEvent('pointerup'), brake.dispatchEvent('pointerup')])
  const stoppedLineup = page.getByRole('button', { name: 'Ready to line up' })
  await expect(stoppedLineup).toBeEnabled()
  await stoppedLineup.click()
  await expect.poll(() => page.locator('.dc9-memphis-departure__header > p').last().textContent()).toContain('Line up')

  // Pulling before the fictional rotation cue restores the runway-lineup checkpoint.
  await hold(page, 'Advance thrust levers', 500)
  await expect(page.locator('.dc9-memphis-departure__header > p').last()).toContainText('Legacy roll')
  await hold(page, 'Pull column aft', 450)
  await expect(guidance).toContainText(/safe retry/i)
  await expectDurableProgress(page, 'runwayLineup', ['rampRelease', 'taxi', 'holdShort'])
})

test('checkpoint reloads and a hidden tab restore the canonical stopped frame', async ({ page }) => {
  await page.goto('/?skip3d=1')
  for (const [checkpoint, beats, label] of [
    ['taxiTurn', ['rampRelease'], 'Memory lane'],
    ['holdShort', ['rampRelease', 'taxi'], 'Quiet hold'],
    ['runwayLineup', ['rampRelease', 'taxi', 'holdShort'], 'Line up'],
  ] as const) {
    await seedDeparture(page, checkpoint)
    await expect(page.locator('.dc9-memphis-departure__header > p').last()).toContainText(label)
    await expect(page.getByRole('meter', { name: 'Thrust levers position' })).toHaveAttribute('aria-valuenow', '0')
    await expectDurableProgress(page, checkpoint, beats)
  }

  await seedDeparture(page, 'taxiTurn')
  await page.evaluate(() => document.body.focus())
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(250)
  await expect(page.getByRole('meter', { name: 'Thrust levers position' })).not.toHaveAttribute('aria-valuenow', '0')
  await page.keyboard.up('KeyW')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.getByRole('meter', { name: 'Thrust levers position' })).toHaveAttribute('aria-valuenow', '0')
  await expectDurableProgress(page, 'taxiTurn', ['rampRelease'])
})

test('an aborted Memphis request preserves the accessible path and retries from the checkpoint', async ({ page }) => {
  test.setTimeout(90_000)
  let memphisRequests = 0
  await page.route(`**${MEMPHIS_MODEL_PATH}*`, async (route) => {
    memphisRequests += 1
    await route.abort()
  })
  await page.goto('/')
  await seedDeparture(page, 'holdShort')

  await expect(page.getByRole('alert')).toContainText('Windshield memory view unavailable', { timeout: 30_000 })
  await expect(page.getByRole('heading', { name: 'Memphis Legacy Departure' })).toBeVisible()
  await expectDurableProgress(page, 'holdShort', ['rampRelease', 'taxi'])
  await page.unroute(`**${MEMPHIS_MODEL_PATH}*`)
  await page.getByRole('button', { name: 'Restore checkpoint' }).click()
  await waitForMemphisEnvironment(page)
  expect(memphisRequests).toBe(1)
  await expectDurableProgress(page, 'holdShort', ['rampRelease', 'taxi'])
})

test('warm taxi meets the frame budget and scene count stays stable across three entries', async ({ page }) => {
  test.setTimeout(150_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  const webglErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /webgl/i.test(message.text())) webglErrors.push(message.text())
  })
  await page.goto('/')

  await seedDeparture(page, 'taxiTurn')
  await waitForMemphisEnvironment(page)
  const canvas = page.locator('canvas')
  const sceneObjectCounts = [Number(await canvas.getAttribute('data-dc9-memphis-object-count'))]
  const renderer = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement
    const gl = canvasElement.getContext('webgl2') ?? canvasElement.getContext('webgl')
    if (!gl) return { vendor: 'unavailable', renderer: 'unavailable' }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      vendor: debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR)),
      renderer: debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER)),
    }
  })
  await page.evaluate(() => document.body.focus())
  await page.keyboard.down('KeyW')
  const intervals = await page.evaluate(() => new Promise<number[]>((resolve) => {
    const samples: number[] = []
    let previous = performance.now()
    const sample = (now: number) => {
      samples.push(now - previous)
      previous = now
      if (samples.length >= 120) resolve(samples)
      else requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  }))
  await page.keyboard.up('KeyW')
  const sorted = [...intervals].sort((left, right) => left - right)
  const median = sorted[Math.floor(sorted.length / 2)]!
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]!

  await seedState(page, departureState('complete'))
  await expect(page.getByRole('heading', { name: 'Home Operations' })).toBeVisible()
  await expect(page.locator('canvas')).not.toHaveAttribute('data-dc9-memphis-model-state', /.+/)
  for (let cycle = 1; cycle < 3; cycle += 1) {
    await seedDeparture(page, 'taxiTurn')
    await waitForMemphisEnvironment(page)
    sceneObjectCounts.push(Number(await page.locator('canvas').getAttribute('data-dc9-memphis-object-count')))
    await seedState(page, departureState('complete'))
    await expect(page.getByRole('heading', { name: 'Home Operations' })).toBeVisible()
    await expect(page.locator('canvas')).not.toHaveAttribute('data-dc9-memphis-model-state', /.+/)
  }

  console.log(`DC9_MEMPHIS_FRAME_METRICS ${JSON.stringify({ median, p95, sceneObjectCounts, renderer })}`)
  expect(p95).toBeLessThanOrEqual(35)
  expect(new Set(sceneObjectCounts).size).toBe(1)
  expect(sceneObjectCounts[0]).toBeGreaterThan(0)
  expect(webglErrors).toEqual([])
})

test('captures deterministic Memphis browser evidence', async ({ page }) => {
  const evidenceDirectory = process.env.DC9_MEMPHIS_EVIDENCE_DIR
  test.skip(!evidenceDirectory, 'Set DC9_MEMPHIS_EVIDENCE_DIR to capture committed Task 10 browser evidence.')
  test.setTimeout(240_000)
  await page.goto('/')

  const checkpoints = [
    { width: 375, height: 812, checkpoint: 'rampStart', name: '375-ramp-start.png' },
    { width: 375, height: 812, checkpoint: 'holdShort', name: '375-hold-short.png' },
    { width: 768, height: 900, checkpoint: 'rampStart', name: '768-ramp-start.png' },
    { width: 768, height: 900, checkpoint: 'runwayLineup', name: '768-runway-lineup.png' },
    { width: 1440, height: 900, checkpoint: 'rampStart', name: '1440-ramp-start.png' },
    { width: 1440, height: 900, checkpoint: 'taxiTurn', name: '1440-taxi-turn.png' },
    { width: 1440, height: 900, checkpoint: 'holdShort', name: '1440-hold-short.png' },
    { width: 1440, height: 900, checkpoint: 'runwayLineup', name: '1440-runway-lineup.png' },
  ] as const

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  for (const evidence of checkpoints) {
    await page.setViewportSize({ width: evidence.width, height: evidence.height })
    await seedDeparture(page, evidence.checkpoint)
    await waitForMemphisEnvironment(page)
    await page.screenshot({ path: `${evidenceDirectory}/${evidence.name}`, animations: 'disabled' })
  }

  for (const evidence of [
    { width: 375, height: 812, name: '375-initial-climb.png' },
    { width: 768, height: 900, name: '768-initial-climb.png' },
    { width: 1440, height: 900, name: '1440-initial-climb.png' },
  ]) {
    await page.setViewportSize({ width: evidence.width, height: evidence.height })
    await reachInitialClimbWithRealEnvironment(page)
    await page.screenshot({ path: `${evidenceDirectory}/${evidence.name}`, animations: 'disabled' })
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await reachInitialClimbWithRealEnvironment(page)
  await page.screenshot({ path: `${evidenceDirectory}/1440-initial-climb-reduced-motion.png`, animations: 'disabled' })

  await page.goto('/?skip3d=1')
  await page.setViewportSize({ width: 375, height: 812 })
  await seedDeparture(page, 'rampStart')
  await expect(page.getByRole('heading', { name: 'Memphis Legacy Departure' })).toBeVisible()
  await page.screenshot({ path: `${evidenceDirectory}/375-skip3d-panel.png`, animations: 'disabled' })
})

test('Memphis departure progresses through every native beat when 3D is unavailable', async ({ page }) => {
  test.setTimeout(35_000)
  await page.goto('/?skip3d=1')
  await seedDeparture(page, 'rampStart')

  await expect(page.getByRole('heading', { name: 'Memphis Legacy Departure' })).toBeVisible()
  await expect(page.getByText('Fictional — non operational')).toBeVisible()
  for (const viewport of [
    { width: 375, height: 667 },
    { width: 768, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    const panel = await page.locator('.dc9-memphis-departure').boundingBox()
    expect(panel).not.toBeNull()
    expect(panel!.x).toBeGreaterThanOrEqual(0)
    expect(panel!.x + panel!.width).toBeLessThanOrEqual(viewport.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    if (viewport.width <= 768) {
      await expect(page.locator('.dc9-memphis-departure')).toHaveCSS('overflow-y', 'auto')
    }
    for (const name of ['Left rudder pedal', 'Right rudder pedal', 'Close thrust levers', 'Advance thrust levers', 'Hold brake']) {
      const control = page.getByRole('button', { name })
      await control.scrollIntoViewIfNeeded()
      await expect(control).toBeVisible()
    }
  }

  const activeBeat = page.locator('.dc9-memphis-departure__header > p').last()
  await expect(page.getByRole('button', { name: 'Ready to line up' })).toHaveCount(0)
  await hold(page, 'Advance thrust levers', 500)
  await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/centered|steer/i)
  await expect(activeBeat).toContainText('Memory lane', { timeout: 5_000 })

  // A wrong turn is safely restored to the taxi checkpoint. Repeating it proves
  // progressive hint/restore feedback without rewinding the completed ramp beat.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await hold(page, 'Right rudder pedal', 1_500)
    await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/safe retry/i)
  }
  await expect(page.getByRole('button', { name: 'Restore checkpoint' })).toBeVisible()
  await page.getByRole('button', { name: 'Restore checkpoint' }).click()
  await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/checkpoint restored/i)

  await hold(page, 'Advance thrust levers', 500)
  await expect(activeBeat).toContainText('Memory lane', { timeout: 5_000 })

  const brake = page.getByRole('button', { name: 'Hold brake' })
  await Promise.all([
    page.getByRole('button', { name: 'Close thrust levers' }).dispatchEvent('pointerdown'),
    brake.dispatchEvent('pointerdown'),
  ])
  await expect(brake).toHaveAttribute('aria-pressed', 'true')
  await page.waitForTimeout(650)
  await page.getByRole('button', { name: 'Close thrust levers' }).dispatchEvent('pointerup')
  await hold(page, 'Advance thrust levers', 200)
  await expect(page.getByRole('meter', { name: 'Thrust levers position' })).not.toHaveAttribute('aria-valuenow', '0')
  await brake.dispatchEvent('pointerup')
  await page.waitForTimeout(3_300)
  await Promise.all([
    page.getByRole('button', { name: 'Close thrust levers' }).dispatchEvent('pointerdown'),
    brake.dispatchEvent('pointerdown'),
  ])
  await page.waitForTimeout(650)
  await page.getByRole('button', { name: 'Close thrust levers' }).dispatchEvent('pointerup')
  await expect(activeBeat).toContainText('Quiet hold', { timeout: 5_000 })
  await expect.poll(() => page.evaluate((key) => {
    const saved = window.localStorage.getItem(key)
    return saved ? JSON.parse(saved).dc9.departure.checkpoint : null
  }, STORAGE_KEY)).toBe('holdShort')
  await expect(page.getByRole('button', { name: 'Ready to line up' })).toBeEnabled()
  await page.waitForTimeout(120)
  for (let attempt = 0; attempt < 3 && (await activeBeat.textContent())?.startsWith('Quiet hold'); attempt += 1) {
    await page.getByRole('button', { name: 'Ready to line up' }).dispatchEvent('click')
    await page.waitForTimeout(120)
  }
  await brake.dispatchEvent('pointerup')
  await expect(activeBeat).toContainText('Line up')

  const advance = page.getByRole('button', { name: 'Advance thrust levers' })
  await advance.dispatchEvent('pointerdown')
  await page.waitForTimeout(500)
  await advance.dispatchEvent('pointerup')
  await expect(activeBeat).toContainText('Legacy roll', { timeout: 3_000 })
  // The rotation beat is intentionally brief. The retained fictional lever position
  // carries the roll forward after release, so begin the native column hold just
  // before that cue rather than waiting for a transient rendered label.
  await page.waitForTimeout(950)
  await holdPointer(page, 'Pull column aft', 250)
  await expect(activeBeat).toContainText('Climb out', { timeout: 3_000 })
  await expect.poll(() => page.evaluate((key) => {
    const saved = window.localStorage.getItem(key)
    return saved ? JSON.parse(saved).dc9.departure.checkpoint : null
  }, STORAGE_KEY)).toBe('initialClimb')

  await expect(page.getByRole('heading', { name: 'Home Operations' })).toBeVisible({ timeout: 8_000 })
})
