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

/** The chapter's opening beat since the 2026-08-30 swap: the scan releases the flight. */
function instrumentScanState(): GameState {
  const state = createInitialState()
  return {
    ...state,
    phase: 'dc9',
    dc9: {
      ...state.dc9,
      stage: 'instrumentScan',
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

/**
 * Memphis is outside the windows for the whole chapter, so a stage that is not the
 * departure must still have the environment staged — and holding the parked ramp
 * view. A completed flight leaves the live frame at climb altitude and full path
 * progress, so without that hold Home Operations and the ceremonial shutdown would
 * look out at the airport from 110 m up and 700 m down the runway.
 */
async function expectParkedMemphisEnvironment(page: Page): Promise<void> {
  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-dc9-memphis-model-state', 'ready', { timeout: 30_000 })
  await expect(canvas).toHaveAttribute('data-dc9-memphis-beat', 'rampRelease')
  const pose = await canvas.getAttribute('data-dc9-memphis-world-pose')
  expect(pose).not.toBeNull()
  const parked = JSON.parse(pose!) as { position: number[] }
  // Validate the measurement before trusting it: Math.hypot() of an empty array is 0,
  // which would satisfy the bound below without measuring anything at all.
  expect(parked.position).toHaveLength(3)
  expect(parked.position.every((value) => Number.isFinite(value))).toBe(true)
  // Ramp start is the world origin plus the gear-height clearance, so the parked inverse
  // translation is 2.5 m. Every other checkpoint is far outside this bound: taxiTurn
  // 105.5 m, holdShort 241.9 m, runwayLineup 272.8 m, initialClimb 553.2 m, complete
  // 719.1 m — so this fails by two orders of magnitude if the parked hold is lost.
  expect(Math.hypot(...parked.position)).toBeLessThan(10)
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
  // Pin the documented pair, not merely "positive": the near plane is what keeps depth
  // precision across a 700 m scene, and the authored cockpit value (0.015) is 3x coarser
  // per metre. A silent revert to it would pass any is-it-positive check.
  expect(nearPlane).toBeCloseTo(0.05, 5)
  expect(farPlane).toBeGreaterThanOrEqual(1500)
  expect([...parsed.position, ...parsed.quaternion].every(Number.isFinite)).toBe(true)
}

/** Answer the six-gauge scan from its native list, which is what releases the flight. */
async function completeInstrumentScan(page: Page): Promise<void> {
  const scan = page.getByRole('region', { name: 'The scan he flew by' })
  await expect(scan).toBeVisible()
  for (const name of [
    'Airspeed indicator',
    'Attitude director indicator',
    'Altimeter',
    'Horizontal situation indicator',
    'Vertical speed indicator',
    'Engine pressure ratio gauges',
  ]) {
    await scan.locator('.dc9-instrument-choice').filter({ hasText: name }).click()
  }
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

/**
 * The rAF-driven simulation advances at most 0.1 s per frame, so a software
 * rasteriser running the 926k-triangle cockpit at a few fps desynchronises the
 * wall-clock drive sequences from simulated time. Real-environment play-through
 * tests therefore run only where a hardware-rate renderer is available (locally:
 * headed on DISPLAY=:0); the skip reason keeps that boundary explicit.
 */
async function detectRenderer(page: Page): Promise<string> {
  // Probe a canvas of our own: the app's canvas already has a live context
  // owned by three.js, so re-requesting one there returns null and the check
  // silently reports "unavailable" — a gate that can never fire.
  return page.evaluate(() => {
    const probe = document.createElement('canvas')
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl')
    if (!gl) return 'unavailable'
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    return debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER))
  })
}

async function skipOnSoftwareRenderer(page: Page): Promise<void> {
  const renderer = await detectRenderer(page)
  test.skip(
    /swiftshader|llvmpipe|software|unavailable/i.test(renderer),
    `Real-environment drive timings need a hardware-rate renderer; got "${renderer}". Run headed on DISPLAY=:0.`,
  )
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
  // The readable roll builds for a couple of seconds; rotate on the cue with a
  // held gentle pull (the rotation is a held arc, not a single tap).
  await expect(activeBeat).toContainText('Memory lift', { timeout: 10_000 })
  await holdPointer(page, 'Pull column aft', 900)
  await expect(activeBeat).toContainText('Climb out', { timeout: 3_000 })
  await expect(page.locator('canvas')).toHaveAttribute('data-dc9-memphis-beat', 'initialClimb')
}

test('real-environment completion returns to Home Operations', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await skipOnSoftwareRenderer(page)
  await reachInitialClimbWithRealEnvironment(page)
  // Relax toward neutral exactly as the guidance asks and let the climb finish.
  await expect(page.getByRole('heading', { name: 'Home Operations' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('dialog', { name: 'Home Operations Log' })).toBeVisible()
  await expectParkedMemphisEnvironment(page)
  await expect.poll(() => savedDeparture(page)).toMatchObject({ checkpoint: 'complete', completed: true })
})

test('completion survives an over-pull mistake, a retry press, and focus loss', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await skipOnSoftwareRenderer(page)
  await reachInitialClimbWithRealEnvironment(page)
  const activeBeat = page.locator('.dc9-memphis-departure__header > p').last()

  // Over-pull: hold the column hard until the softened instability window trips.
  await holdPointer(page, 'Pull column aft', 2_600)
  await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/safe retry/i, { timeout: 10_000 })

  // A deliberate manual retry, then a focus-loss pause mid-recovery.
  await page.getByRole('button', { name: 'Retry from checkpoint' }).click()
  await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/checkpoint restored/i)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.waitForTimeout(300)

  // Fresh gentle input clears the pause latch; relax and let the climb finish.
  await holdPointer(page, 'Pull column aft', 300)
  await expect(activeBeat).toContainText('Climb out')
  await expect(page.getByRole('heading', { name: 'Home Operations' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('dialog', { name: 'Home Operations Log' })).toBeVisible()
  await expect.poll(() => savedDeparture(page)).toMatchObject({ checkpoint: 'complete', completed: true })
})

test('a full continuous real-environment departure returns to Home Operations', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/')
  await skipOnSoftwareRenderer(page)
  await seedDeparture(page, 'rampStart')
  await waitForMemphisEnvironment(page)
  const activeBeat = page.locator('.dc9-memphis-departure__header > p').last()

  await hold(page, 'Advance thrust levers', 500)
  await expect(activeBeat).toContainText('Memory lane', { timeout: 10_000 })
  // Brakeless stopping procedure: taxi to the coast cue with the levers
  // latched, then close them and let rolling friction settle the hold.
  await expect(activeBeat).toContainText('Close the levers', { timeout: 15_000 })
  await hold(page, 'Close thrust levers', 400)
  await expect(activeBeat).toContainText('Quiet hold', { timeout: 10_000 })
  await expect(page.getByRole('button', { name: 'Ready to line up' })).toBeEnabled()
  await page.waitForTimeout(120)
  for (let attempt = 0; attempt < 3 && (await activeBeat.textContent())?.startsWith('Quiet hold'); attempt += 1) {
    await page.getByRole('button', { name: 'Ready to line up' }).dispatchEvent('click')
    await page.waitForTimeout(120)
  }
  await expect(activeBeat).toContainText('Line up')
  await hold(page, 'Advance thrust levers', 500)
  await expect(activeBeat).toContainText('Legacy roll', { timeout: 3_000 })
  await expect(activeBeat).toContainText('Memory lift', { timeout: 10_000 })
  await holdPointer(page, 'Pull column aft', 900)
  await expect(activeBeat).toContainText('Climb out', { timeout: 3_000 })

  await expect(page.getByRole('heading', { name: 'Home Operations' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('dialog', { name: 'Home Operations Log' })).toBeVisible()
  await expectParkedMemphisEnvironment(page)
  await expect.poll(() => savedDeparture(page)).toMatchObject({ checkpoint: 'complete', completed: true })
})

test('real Memphis environment is fetched once for the whole chapter and stays in the right seat', async ({ page }) => {
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
  await seedState(page, instrumentScanState())
  await expect(page).toHaveTitle("The Captain's Key")
  await expect(page.locator('main.game-shell')).toBeVisible()
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  // The airport is outside the windows from the chapter's first frame, so the
  // environment is already requested here, before the instrument scan is answered.
  await expect.poll(() => requestedPaths.filter((path) => path === MEMPHIS_MODEL_PATH).length).toBe(1)
  await expectParkedMemphisEnvironment(page)

  // Record every value the model-state attribute takes across the stage change. The GLB is
  // memoised per URL, so a teardown and remount would not show up as a second request —
  // but it would show up here as the attribute being removed and returning through
  // 'loading'. This is what "no transition into it" has to mean at the stage boundary.
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) throw new Error('Missing canvas')
    const seen: string[] = [canvas.dataset.dc9MemphisModelState ?? 'absent']
    ;(window as unknown as { __memphisStates: string[] }).__memphisStates = seen
    new MutationObserver(() => seen.push(canvas.dataset.dc9MemphisModelState ?? 'absent'))
      .observe(canvas, { attributes: true, attributeFilter: ['data-dc9-memphis-model-state'] })
  })

  await completeInstrumentScan(page)
  await expect(page.getByRole('heading', { name: 'Memphis Legacy Departure' })).toBeVisible()
  // Entering the departure hands the same staged environment to the live frame; it
  // must not be torn down and fetched a second time.
  await expect.poll(() => requestedPaths.filter((path) => path === MEMPHIS_MODEL_PATH).length).toBe(1)
  expect(await page.evaluate(() => (window as unknown as { __memphisStates: string[] }).__memphisStates))
    .toEqual(['ready'])
  await waitForMemphisEnvironment(page)
  expect(requestedPaths).not.toContain(MODEL_Y_MODEL_PATH)
  await expect(page.getByText(/Model Y|Tesla/i)).toHaveCount(0)
  expect(consoleErrors).toEqual([])
  expect(consoleWarnings.every((warning) => (
    warning.includes('THREE.Clock: This module has been deprecated')
    || warning.includes('GPU stall due to ReadPixels')
  ))).toBe(true)
})

test('the departure exposes no brake control and Space stays with the native hold buttons', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedDeparture(page, 'rampStart')

  // The hold-brake control is retired: closing the levers is the whole
  // stopping procedure, so no brake button may render at any beat.
  await expect(page.getByRole('heading', { name: 'Memphis Legacy Departure' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hold brake' })).toHaveCount(0)

  const advance = page.getByRole('button', { name: 'Advance thrust levers' })
  const thrustMeter = page.getByRole('meter', { name: 'Thrust levers position' })
  await advance.focus()
  await page.keyboard.down(' ')
  await expect(thrustMeter).not.toHaveAttribute('aria-valuenow', '0')
  await page.keyboard.up(' ')

  await hold(page, 'Close thrust levers', 600)
  await expect(thrustMeter).toHaveAttribute('aria-valuenow', '0')

  // With the global Space binding removed, a body-focused Space drives nothing.
  // Blur the hold button first: a focused native button still owns Space.
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    document.body.focus()
  })
  await page.keyboard.down(' ')
  await page.waitForTimeout(250)
  await expect(thrustMeter).toHaveAttribute('aria-valuenow', '0')
  await page.keyboard.up(' ')
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
    // The softened corridor tolerates brief wrong steering; hold long enough to
    // genuinely leave it so the hint ladder still proves recoverability.
    await hold(page, 'Right rudder pedal', 2_800)
    await expect(guidance).toContainText(`Hint level ${hintLevel}`)
    await expectDurableProgress(page, 'taxiTurn', ['rampRelease'])
  }
  await page.getByRole('button', { name: 'Retry from checkpoint' }).click()
  await expect(guidance).toContainText('Checkpoint restored')
  await expectDurableProgress(page, 'taxiTurn', ['rampRelease'])

  // Crossing the hold boundary with the levers still open is restored safely
  // to the taxi checkpoint the frame must retry.
  await page.evaluate(() => document.body.focus())
  await page.keyboard.down('KeyW')
  await expect.poll(async () => (await savedDeparture(page)).attempts.taxi, { timeout: 15_000 }).toBe(4)
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

  // Closing the levers is now the whole stopping procedure at the hold.
  await hold(page, 'Close thrust levers', 500)
  const stoppedLineup = page.getByRole('button', { name: 'Ready to line up' })
  await expect(stoppedLineup).toBeEnabled({ timeout: 10_000 })
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
  await page.getByRole('button', { name: 'Retry from checkpoint' }).click()
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
  // The 35 ms budget describes a hardware-rate renderer; a software rasteriser
  // running this 926k-triangle cockpit cannot meet it by construction.
  await skipOnSoftwareRenderer(page)

  await seedDeparture(page, 'taxiTurn')
  await waitForMemphisEnvironment(page)
  const canvas = page.locator('canvas')
  const sceneObjectCounts = [Number(await canvas.getAttribute('data-dc9-memphis-object-count'))]
  const renderer = await detectRenderer(page)
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
  await expectParkedMemphisEnvironment(page)
  for (let cycle = 1; cycle < 3; cycle += 1) {
    await seedDeparture(page, 'taxiTurn')
    await waitForMemphisEnvironment(page)
    sceneObjectCounts.push(Number(await page.locator('canvas').getAttribute('data-dc9-memphis-object-count')))
    await seedState(page, departureState('complete'))
    await expect(page.getByRole('heading', { name: 'Home Operations' })).toBeVisible()
    await expectParkedMemphisEnvironment(page)
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
  test.setTimeout(60_000)
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
    for (const name of ['Left rudder pedal', 'Right rudder pedal', 'Close thrust levers', 'Advance thrust levers']) {
      const control = page.getByRole('button', { name })
      await control.scrollIntoViewIfNeeded()
      await expect(control).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'Hold brake' })).toHaveCount(0)
  }

  const activeBeat = page.locator('.dc9-memphis-departure__header > p').last()
  await expect(page.getByRole('button', { name: 'Ready to line up' })).toHaveCount(0)
  await hold(page, 'Advance thrust levers', 500)
  await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/centered|steer/i)
  await expect(activeBeat).toContainText('Memory lane', { timeout: 5_000 })

  // A wrong turn is safely restored to the taxi checkpoint. Repeating it proves
  // progressive hint/restore feedback without rewinding the completed ramp beat.
  // Settle to a stop first: the softened corridor tolerates brief wrong steering,
  // so a rolling aircraft could reach the hold boundary before the longer holds
  // accrue a genuine deviation. Closing the levers is the whole stop now.
  await hold(page, 'Close thrust levers', 700)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await hold(page, 'Right rudder pedal', 2_800)
    await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/safe retry/i)
  }
  await expect(page.getByRole('button', { name: 'Retry from checkpoint' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry from checkpoint' }).click()
  await expect(page.getByRole('status', { name: 'Departure guidance' })).toContainText(/checkpoint restored/i)

  await hold(page, 'Advance thrust levers', 500)
  await expect(activeBeat).toContainText('Memory lane', { timeout: 5_000 })

  // Taxi to the coast cue with the levers latched, close them, and let the
  // rolling friction settle the durable hold-short checkpoint.
  await expect(activeBeat).toContainText('Close the levers', { timeout: 15_000 })
  await hold(page, 'Close thrust levers', 400)
  await expect(activeBeat).toContainText('Quiet hold', { timeout: 10_000 })
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
  await expect(activeBeat).toContainText('Line up')

  const advance = page.getByRole('button', { name: 'Advance thrust levers' })
  await advance.dispatchEvent('pointerdown')
  await page.waitForTimeout(500)
  await advance.dispatchEvent('pointerup')
  await expect(activeBeat).toContainText('Legacy roll', { timeout: 3_000 })
  // The roll builds readably to the rotation cue; the rotation itself is a
  // held gentle pull rather than a single tap.
  await expect(activeBeat).toContainText('Memory lift', { timeout: 10_000 })
  await holdPointer(page, 'Pull column aft', 900)
  await expect(activeBeat).toContainText('Climb out', { timeout: 3_000 })
  await expect.poll(() => page.evaluate((key) => {
    const saved = window.localStorage.getItem(key)
    return saved ? JSON.parse(saved).dc9.departure.checkpoint : null
  }, STORAGE_KEY)).toBe('initialClimb')

  await expect(page.getByRole('heading', { name: 'Home Operations' })).toBeVisible({ timeout: 8_000 })
})
