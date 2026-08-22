import { expect, test, type Page } from '@playwright/test'
import { airbusCaptainFlow, dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { DC9_CONTROL_CHECK_ITEM_IDS } from '../src/game/dc9ControlCheck'
import { DC9_INSTRUMENT_SCAN_ORDER } from '../src/game/dc9InstrumentScan'
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
      controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
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
    statusMessage: 'The parked DC-9 is ready. Walk every right-seat control to its stops.',
  }
}

/** The chapter as it stands once the opening flight-control sweep is complete. */
function createDc9RouteRecordState(): GameState {
  const state = createDc9State()
  return {
    ...state,
    dc9: { ...state.dc9, stage: 'intro', controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS] },
  }
}

/** Home Operations finished, with the instrument scan still to run. */
function createDc9InstrumentScanState(): GameState {
  const state = createDc9State()
  return {
    ...state,
    dc9: {
      ...state.dc9,
      stage: 'instrumentScan',
      controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
      homeOperationsCompleted: true,
    },
  }
}

function createDc9QualificationState(): GameState {
  return {
    ...createDc9State(),
    dc9: {
      stage: 'qualification',
      controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
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

function createCompletedAirbusState(): GameState {
  const state = createAirbusState()
  return {
    ...state,
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      ...state.airbusSimulator,
      familiarization: 'completed',
      cameraPhase: 'qualified',
      location: 'hub',
      stormLine: {
        status: 'completed',
        checkpoint: 'clearAir',
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: ['calmControl', 'weatherJudgment', 'energyManagement'],
      },
      engineOut: {
        status: 'completed',
        checkpoint: 'diversion',
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: ['directionalControl', 'energyDiscipline', 'calmDiversion'],
      },
      workload: {
        scanRange: 'mid',
        selectedWeatherSector: 'west',
        selectedSafeReturnSide: 'right',
        completedTasks: [
          'stormScanRange',
          'stormGapSelection',
          'engineEventAcknowledgement',
          'engineSafeReturnSelection',
        ],
        attempts: {
          stormScanRange: 0,
          stormGapSelection: 0,
          engineEventAcknowledgement: 0,
          engineSafeReturnSelection: 0,
        },
      },
    },
    completedPuzzles: ['dc9', 'locker', 'airbus'],
    statusMessage: 'POP T CAPTAIN MODE COMPLETE. Engine-Out Handling complete.',
  }
}

/** Walk every right-seat control to its stops using the native hold buttons. */
async function sweepDc9ControlCheck(page: Page): Promise<void> {
  const panel = page.getByRole('region', { name: 'Flight controls — free and correct' })
  await expect(panel).toBeVisible()
  const holds: [string, string][] = [
    ['Pull column aft', 'yokeAft'],
    ['Push column forward', 'yokeForward'],
    ['Roll wheel left', 'wheelLeft'],
    ['Roll wheel right', 'wheelRight'],
    ['Left rudder pedal', 'rudderLeft'],
    ['Right rudder pedal', 'rudderRight'],
    ['Advance thrust levers', 'thrustAdvance'],
    ['Close thrust levers', 'thrustClosed'],
  ]
  for (const [index, [label, item]] of holds.entries()) {
    await page.getByRole('button', { name: new RegExp(`^${label}`) }).hover()
    await page.mouse.down()
    if (index < holds.length - 1) {
      await expect(page.locator(`[data-item="${item}"]`)).toHaveAttribute('data-complete', 'true', { timeout: 15_000 })
    } else {
      // The last movement ends the stage, so its tick unmounts before it can be read.
      await expect(panel).toHaveCount(0, { timeout: 15_000 })
    }
    await page.mouse.up()
  }
}

/** Identify all six right-seat instruments from the native list. */
async function completeDc9InstrumentScan(page: Page): Promise<void> {
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
    const choice = scan.locator('.dc9-instrument-choice').filter({ hasText: name })
    // A gauge may already have been identified by clicking it in the cockpit.
    if (await choice.isDisabled()) continue
    await choice.click()
  }
  await expect(scan).toHaveCount(0)
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

async function capturePlacementEvidence(page: Page, scene: 'airbus' | 'locker'): Promise<void> {
  const evidenceDirectory = process.env.PLACEMENT_EVIDENCE_DIR
  if (!evidenceDirectory) return

  const radioCard = page.getByRole('button', { name: /^RADIO\b/ })
  await radioCard.click()
  await expect(page.locator('.airbus-target-layer')).toHaveClass(/is-placing-card/)
  const viewports = process.env.PLACEMENT_EVIDENCE_DESKTOP_ONLY === '1'
    ? [{ width: 1440, height: 900 }]
    : [
        { width: 1440, height: 900 },
        { width: 768, height: 900 },
        { width: 375, height: 812 },
      ]
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.waitForTimeout(300)
    const evidenceName = scene === 'airbus' ? 'airbus-radio-thrust' : 'locker-hat-shelf'
    await page.screenshot({
      path: `${evidenceDirectory}/${evidenceName}-${viewport.width}.png`,
      fullPage: true,
    })
  }
  await radioCard.click()
}

async function openGameIntro(page: Page) {
  await page.route('**/models/dc9-cockpit.glb*', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()
  const intro = page.getByRole('region', { name: 'Game intro' })
  await expect(intro).toBeVisible()
  return intro
}

test('opening stays spoiler-safe, preloads the DC-9, and unlocks it through the TMB2 handoff', async ({ page }) => {
  test.setTimeout(45_000)
  const requestedPaths: string[] = []
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname
    if (path.includes('/images/intro/tmb2/logo/')) requestedPaths.push(path)
  })
  await page.route('**/models/dc9-cockpit.glb*', (route) => route.abort())
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
  const intro = page.getByRole('region', { name: 'Game intro' })
  await expect(intro).toHaveAttribute('data-intro-cue', 'tmb2-ident')
  await expect(intro.locator('h1')).toHaveCount(0)
  await expect.poll(() => requestedPaths).toEqual(expect.arrayContaining([
    '/images/intro/tmb2/logo/tmb2-ident-source.png',
    '/images/intro/tmb2/logo/tmb2-ident-base.png',
    '/images/intro/tmb2/logo/tmb2-ident-blue-mask.png',
    '/images/intro/tmb2/logo/tmb2-ident-highlight-mask.png',
    '/images/intro/tmb2/logo/tmb2-productions.png',
  ]))
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toHaveCount(0)
  const audio = page.locator('audio')
  await audio.evaluate((media) => {
    media.pause()
    media.currentTime = 4.8
    media.dispatchEvent(new Event('timeupdate'))
  })
  await expect.poll(async () => intro.locator('.game-intro__stage').evaluate((element) => {
    const canvas = element as HTMLCanvasElement
    const context = canvas.getContext('2d')
    if (!context) return { logo: 0, productions: 0 }
    const countNonBackgroundPixels = (x: number, y: number, width: number, height: number) => {
      const pixels = context.getImageData(x, y, width, height).data
      let count = 0
      for (let index = 0; index < pixels.length; index += 4) {
        if (
          pixels[index] !== 2
          || pixels[index + 1] !== 3
          || pixels[index + 2] !== 10
        ) count += 1
      }
      return count
    }
    return countNonBackgroundPixels(16, 72, 288, 79) > 1_000
      && countNonBackgroundPixels(0, 164, 320, 15) > 100
  })).toBe(true)
  const identPixels = await intro.locator('.game-intro__stage').evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('2d')!
    const count = (x: number, y: number, width: number, height: number) => {
      const pixels = context.getImageData(x, y, width, height).data
      let total = 0
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index] !== 2 || pixels[index + 1] !== 3 || pixels[index + 2] !== 10) total += 1
      }
      return total
    }
    return { logo: count(16, 72, 288, 79), productions: count(0, 164, 320, 15) }
  })
  expect(identPixels.logo).toBeGreaterThan(1_000)
  expect(identPixels.productions).toBeGreaterThan(100)

  await audio.evaluate((media) => {
    media.currentTime = 6
    media.dispatchEvent(new Event('timeupdate'))
  })
  await intro.getByRole('button', { name: 'Start game' }).click()
  await expect(intro).toHaveAttribute('data-transition-state', 'handoff')
  await expect(page.locator('.dc9-entry-transition')).toHaveAttribute('data-stage', /fade-out|waiting-for-cockpit|fade-in/)
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.dc9-entry-transition')).toHaveAttribute('data-stage', 'fade-in', { timeout: 20_000 })
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(0, { timeout: 5_000 })
})

test('TMB2 cinematic follows exact boundaries and loops without entering gameplay', async ({ page }) => {
  const intro = await openGameIntro(page)
  const audio = page.locator('audio')
  await audio.evaluate(async (media) => {
    if (media.readyState >= HTMLMediaElement.HAVE_METADATA) return
    await new Promise<void>((resolve, reject) => {
      media.addEventListener('loadedmetadata', () => resolve(), { once: true })
      media.addEventListener('error', () => reject(new Error('Intro audio metadata failed')), { once: true })
    })
  })

  await audio.evaluate((media) => {
    media.currentTime = 5.999
    media.dispatchEvent(new Event('timeupdate'))
  })
  await expect(intro.getByRole('button', { name: 'Start game' })).toHaveCount(0)
  await audio.evaluate((media) => {
    media.currentTime = 6
    media.dispatchEvent(new Event('timeupdate'))
  })
  await expect(intro.getByRole('button', { name: 'Start game' })).toBeVisible()

  const scenes = [
    {
      time: 0,
      id: 'tmb2-ident',
      summary: 'Blue pixels assemble the TMB2 console logo before a bright gold-white overload.',
    },
    {
      time: 6,
      id: 'duffel',
      summary: 'Pop T enters confidently and struggles with an oversized rattling duffel bag.',
    },
    {
      time: 12,
      id: 'key-escape',
      summary: 'A living golden key bursts from the luggage, startles Pop T, taunts him, and escapes.',
    },
    {
      time: 16,
      id: 'runway',
      summary: 'Pop T chases the key past airport equipment and narrowly avoids a runway cart.',
    },
    {
      time: 22,
      id: 'ballpark',
      summary: 'The key redirects a baseball while Pop T performs a dramatic slide past the base.',
    },
    {
      time: 28,
      id: 'city-finance',
      summary: 'The key runs along a rising neon graph and Pop T collides with comic bull imagery.',
    },
    {
      time: 35,
      id: 'sky',
      summary: 'Clouds and a red digital horizon launch the chase into the sky.',
    },
    {
      time: 42,
      id: 'final-pursuit',
      summary: 'Pop T glides on pilot wings, misses the key once, recovers, and catches it.',
    },
    {
      time: 48,
      id: 'catch',
      summary: 'Pop T holds a brief victory pose before the key delivers one last joke.',
    },
    {
      time: 51,
      id: 'loop-reset',
      summary: 'The key drags Pop T away and the picture collapses into blue pixels.',
    },
  ] as const

  for (const scene of scenes) {
    await audio.evaluate((media, time) => {
      media.currentTime = time
      media.dispatchEvent(new Event('timeupdate'))
    }, scene.time)
    await expect(intro).toHaveAttribute('data-intro-cue', scene.id)
    await expect(intro.locator('.game-intro__stage')).toHaveAttribute('data-scene', scene.id)
    await expect(intro.locator('.game-intro__summary')).toHaveText(scene.summary)
    await expect(intro.locator('h1')).toHaveCount(0)
  }

  await audio.evaluate((media) => {
    media.dispatchEvent(new Event('ended'))
  })
  await expect(intro).toBeVisible()
  await expect(intro.locator('.game-intro__stage')).toHaveAttribute('data-scene', 'tmb2-ident')
  await expect(intro.getByRole('button', { name: 'Start game' })).toBeVisible()
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(0)
})

test('TMB2 cinematic blocks playback with an exact retry when opening art fails', async ({ page }) => {
  await page.route('**/images/intro/tmb2/logo/tmb2-ident-base.png', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeDisabled()
  await expect(page.getByRole('status')).toContainText(
    'logo-base (images/intro/tmb2/logo/tmb2-ident-base.png)',
  )
  await page.unroute('**/images/intro/tmb2/logo/tmb2-ident-base.png')
  await page.getByRole('button', { name: 'Retry cinematic assets' }).click()
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeEnabled()
})

test('captures TMB2 Productions owner-review proof', async ({ page }) => {
  test.skip(process.env.CAPTURE_TMB2_IDENT !== '1', 'Set CAPTURE_TMB2_IDENT=1 to refresh owner proof.')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route('**/models/dc9-cockpit.glb*', (route) => route.abort())
  await page.goto('/')
  const startButton = page.getByRole('button', { name: 'Start Game' })
  await expect(startButton).toBeEnabled({ timeout: 15_000 })
  await startButton.click()
  const intro = page.getByRole('region', { name: 'Game intro' })
  await expect(intro).toBeVisible()
  const audio = page.locator('audio')
  await audio.evaluate((media) => {
    media.pause()
    media.currentTime = 4.8
    media.dispatchEvent(new Event('timeupdate'))
  })
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  await expect(intro.locator('.game-intro__stage')).toHaveAttribute('data-scene', 'tmb2-ident')

  for (const viewport of [
    { width: 1440, height: 900, file: 'ident-1440x900.png' },
    { width: 768, height: 900, file: 'ident-768x900.png' },
    { width: 375, height: 812, file: 'ident-375x812.png' },
  ]) {
    await page.setViewportSize(viewport)
    await page.screenshot({
      path: `preview-renders/tmb2-productions-ident/${viewport.file}`,
      animations: 'disabled',
    })
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(intro).toHaveAttribute('data-reduced-motion', 'true')
  await page.setViewportSize({ width: 375, height: 812 })
  await audio.evaluate((media) => {
    media.pause()
    media.currentTime = 3
    media.dispatchEvent(new Event('timeupdate'))
  })
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  await page.screenshot({
    path: 'preview-renders/tmb2-productions-ident/ident-reduced-motion-375x812.png',
    animations: 'disabled',
  })
})

test('TMB2 cinematic sound controls do not trigger Start while focused', async ({ page }) => {
  const intro = await openGameIntro(page)
  const audio = page.locator('audio')

  await intro.getByRole('button', { name: 'Mute intro' }).click()
  await expect(audio).toHaveJSProperty('muted', true)
  await intro.getByLabel('Intro volume').fill('0.35')
  await expect.poll(() => audio.evaluate((media) => media.volume)).toBeCloseTo(0.35)
  await intro.getByLabel('Intro volume').press('Space')
  await expect(intro).toHaveAttribute('data-transition-state', 'playing')
})

test('TMB2 cinematic continues silently and retries rejected audio', async ({ page }) => {
  await page.addInitScript(() => {
    let attempts = 0
    HTMLMediaElement.prototype.play = function play() {
      attempts += 1
      return attempts === 1
        ? Promise.reject(new DOMException('Playback blocked for test', 'NotAllowedError'))
        : Promise.resolve()
    }
  })

  const intro = await openGameIntro(page)
  await expect(intro.getByText('The intro is continuing without sound.')).toBeVisible()
  await intro.getByRole('button', { name: 'Retry sound' }).click()
  await expect(intro.getByText('Intro audio playing.')).toBeVisible()
})

for (const input of ['pointer', 'Enter', 'Space', 'controller'] as const) {
  test(`TMB2 cinematic accepts ${input} Start and completes one handoff`, async ({ page }) => {
    if (input === 'controller') {
      await page.addInitScript(() => {
        let pressed = false
        Object.defineProperty(navigator, 'getGamepads', {
          configurable: true,
          value: () => [{
            mapping: 'standard',
            buttons: Array.from({ length: 16 }, (_, index) => ({ pressed: pressed && index === 9 })),
          }],
        })
        Object.defineProperty(window, '__pressIntroControllerStart', {
          value: () => { pressed = true },
        })
      })
    }
    const intro = await openGameIntro(page)
    await page.locator('audio').evaluate((media) => {
      media.currentTime = 6
      media.dispatchEvent(new Event('timeupdate'))
    })
    await expect(intro.getByRole('button', { name: 'Start game' })).toBeVisible()

    if (input === 'pointer') await intro.getByRole('button', { name: 'Start game' }).click()
    if (input === 'Enter' || input === 'Space') await page.keyboard.press(input)
    if (input === 'controller') {
      await page.evaluate(() => {
        (window as typeof window & { __pressIntroControllerStart: () => void }).__pressIntroControllerStart()
      })
    }

    await expect(intro).toHaveAttribute('data-transition-state', 'handoff')
    await expect(page.locator('.dc9-entry-transition')).toHaveCount(1, { timeout: 2_000 })
    await expect(page.locator('.dc9-entry-transition')).toHaveCount(1)
  })
}

test('TMB2 cinematic holds scene poses for reduced motion and fits required viewports', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 375, height: 812 })
  const intro = await openGameIntro(page)
  await expect(intro).toHaveAttribute('data-reduced-motion', 'true')

  const canvas = intro.locator('.game-intro__stage')
  const audio = page.locator('audio')
  await audio.evaluate((media) => {
    media.currentTime = 17
    media.dispatchEvent(new Event('timeupdate'))
  })
  const firstPose = await canvas.evaluate((element) => ({
    popt: element.getAttribute('data-popt-frame'),
    key: element.getAttribute('data-key-frame'),
  }))
  await audio.evaluate((media) => {
    media.currentTime = 21
    media.dispatchEvent(new Event('timeupdate'))
  })
  await expect(canvas).toHaveAttribute('data-scene', 'runway')
  expect(await canvas.evaluate((element) => ({
    popt: element.getAttribute('data-popt-frame'),
    key: element.getAttribute('data-key-frame'),
  }))).toEqual(firstPose)

  for (const viewport of [
    { width: 375, height: 812, scale: '1' },
    { width: 768, height: 900, scale: '2' },
    { width: 1440, height: 900, scale: '4' },
  ]) {
    await page.setViewportSize(viewport)
    await expect(canvas).toHaveAttribute('data-presentation-scale', viewport.scale)
    const bounds = await intro.locator('.game-intro__controls').boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  }
})

test('TMB2 cinematic uses the deployable 53.04-second audio', async ({ page }) => {
  await page.goto('/')
  const metadata = await page.locator('audio').evaluate(async (media) => {
    if (media.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise<void>((resolve, reject) => {
        media.addEventListener('loadedmetadata', () => resolve(), { once: true })
        media.addEventListener('error', () => reject(new Error('Intro audio metadata failed')), { once: true })
      })
    }
    return {
      duration: media.duration,
      networkState: media.networkState,
      noSourceState: HTMLMediaElement.NETWORK_NO_SOURCE,
    }
  })

  expect(metadata.duration).toBeGreaterThanOrEqual(52.9)
  expect(metadata.duration).toBeLessThanOrEqual(53.1)
  expect(metadata.networkState).not.toBe(metadata.noSourceState)
})

test('saved DC-9 reload hides the route opener until loading settles', async ({ page }) => {
  test.setTimeout(30_000)
  await page.addInitScript(
    ({ key, savedState }) => window.localStorage.setItem(key, JSON.stringify(savedState)),
    { key: STORAGE_KEY, savedState: createDc9RouteRecordState() },
  )
  await page.route('**/models/dc9-cockpit.glb*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_500))
    await route.abort()
  })

  await page.goto('/')
  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-dc9-model-state', 'loading')
  await expect(page.getByRole('button', { name: 'Open Legacy Route Record' })).toHaveCount(0)
  await expect(canvas).toHaveAttribute('data-dc9-model-state', 'fallback', { timeout: 5_000 })
  await expect(page.getByRole('button', { name: 'Open Legacy Route Record' })).toHaveAttribute('data-projection', 'fallback')
})

test('DC-9 Final Flight Log accessible flow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?skip3d=1')
  await seedGameState(page, createDc9RouteRecordState())

  await page.getByRole('button', { name: 'Open Legacy Route Record' }).click()
  await expect(page.getByRole('dialog', { name: 'Legacy Route Record' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^DTW, Detroit/ })).toBeVisible()
  await expect(page.getByText(/Which three cities were familiar stops/)).toBeVisible()

  for (const code of dc9LegacyFlow.routePuzzleAnswers) {
    await page.getByRole('button', { name: new RegExp(`^${code},`) }).click()
  }
  await page.getByRole('button', { name: 'Record selected routes' }).click()
  const homeOperations = page.getByRole('dialog', { name: 'Home Operations Log' })
  await expect(homeOperations).toBeVisible()
  await expect(homeOperations.getByRole('textbox')).toHaveCount(0)
  await expect(homeOperations.getByText(/parallel operation/i)).toBeVisible()
  const homeOperationsBounds = await homeOperations.boundingBox()
  expect(homeOperationsBounds).not.toBeNull()
  expect(homeOperationsBounds!.height).toBeGreaterThanOrEqual(360)
  expect(homeOperationsBounds!.height).toBeLessThanOrEqual(430)
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(homeOperations).toHaveCSS('max-height', 'none')
  await expect(homeOperations).toHaveCSS('overflow-y', 'visible')
  await expect(page.locator('.dc9-chapter--homeOperations')).toHaveCSS('overflow-y', 'auto')
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(homeOperations).toContainText('Momma Cheryl kept three kids fed, prepared, and on schedule')
  const internalScroll = await homeOperations.evaluate((element) => element.scrollHeight - element.clientHeight)
  expect(internalScroll).toBeLessThanOrEqual(1)
})

test('DC-9 control check sweeps every right-seat control and opens the route strip', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?skip3d=1')
  await seedGameState(page, createDc9State())

  const panel = page.getByRole('region', { name: 'Flight controls — free and correct' })
  await expect(panel).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Legacy Route Record' })).toHaveCount(0)

  // Every movement has a native hold button, so the sweep never needs the 3D cockpit.
  const holds: [string, string][] = [
    ['Pull column aft', 'yokeAft'],
    ['Push column forward', 'yokeForward'],
    ['Roll wheel left', 'wheelLeft'],
    ['Roll wheel right', 'wheelRight'],
    ['Left rudder pedal', 'rudderLeft'],
    ['Right rudder pedal', 'rudderRight'],
    ['Advance thrust levers', 'thrustAdvance'],
    ['Close thrust levers', 'thrustClosed'],
  ]
  for (const [index, [label, item]] of holds.entries()) {
    const button = page.getByRole('button', { name: new RegExp(`^${label}`) })
    await button.hover()
    await page.mouse.down()
    if (index < holds.length - 1) {
      await expect(page.locator(`[data-item="${item}"]`)).toHaveAttribute('data-complete', 'true', { timeout: 15_000 })
    } else {
      // Latching the final movement ends the stage, so the panel carrying that tick is
      // already gone by the time it could be read. Watch for the handoff instead.
      await expect(panel).toHaveCount(0, { timeout: 15_000 })
    }
    await page.mouse.up()
  }

  await expect(page.locator('.dc9-chapter')).toHaveClass(/dc9-chapter--intro/)
  await expect(page.getByRole('button', { name: 'Open Legacy Route Record' })).toBeVisible()
})

test('DC-9 control check answers the keyboard and springs back to neutral', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?skip3d=1')
  await seedGameState(page, createDc9State())

  await expect(page.getByRole('region', { name: 'Flight controls — free and correct' })).toBeVisible()
  const columnReadout = page.locator('.dc9-axis').filter({ hasText: 'Control column' }).locator('strong')
  await expect(columnReadout).toHaveText('Neutral')

  await page.keyboard.down('ArrowUp')
  await expect(page.locator('[data-item="yokeAft"]')).toHaveAttribute('data-complete', 'true', { timeout: 15_000 })
  await page.keyboard.up('ArrowUp')
  await expect(columnReadout).toHaveText('Neutral', { timeout: 15_000 })

  // The levers are not spring-loaded; they stay where the player leaves them.
  const thrustReadout = page.locator('.dc9-axis').filter({ hasText: 'Thrust levers' }).locator('strong')
  await page.keyboard.down('KeyW')
  await expect(thrustReadout).not.toHaveText('Closed', { timeout: 15_000 })
  await page.keyboard.up('KeyW')
  // The readout is republished a few times a second, so let it catch up to the levers
  // before sampling the position it has to hold.
  await page.waitForTimeout(500)
  const parked = await thrustReadout.textContent()
  await page.waitForTimeout(800)
  await expect(thrustReadout).toHaveText(parked ?? '')
})

test('DC-9 control check progress survives a reload', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedGameState(page, createDc9State())
  // A key press only registers once the chapter is listening for it.
  await expect(page.getByRole('region', { name: 'Flight controls — free and correct' })).toBeVisible()
  await page.keyboard.down('ArrowUp')
  await expect(page.locator('[data-item="yokeAft"]')).toHaveAttribute('data-complete', 'true', { timeout: 15_000 })
  await page.keyboard.up('ArrowUp')

  await page.reload()
  await expect(page.getByRole('region', { name: 'Flight controls — free and correct' })).toBeVisible()
  await expect(page.locator('[data-item="yokeAft"]')).toHaveAttribute('data-complete', 'true')
  await expect(page.locator('[data-item="wheelLeft"]')).toHaveAttribute('data-complete', 'false')
})

test('DC-9 instrument scan coaches wrong gauges and never loses a correct one', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?skip3d=1')
  await seedGameState(page, createDc9InstrumentScanState())

  const scan = page.getByRole('region', { name: 'The scan he flew by' })
  await expect(scan).toBeVisible()
  await expect(scan).toContainText('Which gauge shows how fast the aircraft is moving through the air?')

  const choice = (name: string) => scan.locator('.dc9-instrument-choice').filter({ hasText: name })
  await choice('Engine pressure ratio gauges').click()
  await expect(page.locator('.dc9-chapter__status p')).toContainText('Not that one')
  await expect(scan).toContainText('0 of 6 identified')

  await choice('Airspeed indicator').click()
  await expect(page.locator('.dc9-chapter__status p')).toContainText('the airspeed indicator')
  await expect(scan).toContainText('1 of 6 identified')

  // A later mistake must not take the identified gauge away.
  await choice('Vertical speed indicator').click()
  await expect(scan).toContainText('1 of 6 identified')
  await expect(choice('Airspeed indicator')).toBeDisabled()

  for (const name of ['Attitude director indicator', 'Altimeter', 'Horizontal situation indicator', 'Vertical speed indicator', 'Engine pressure ratio gauges']) {
    await choice(name).click()
  }
  await expect(page.locator('.dc9-chapter')).toHaveClass(/dc9-chapter--shutdown/)
  await expect(page.getByRole('heading', { name: 'Secure the parked aircraft' })).toBeVisible()
})

test('DC-9 instrument scan offers final support after three misses on one gauge', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seedGameState(page, createDc9InstrumentScanState())
  const scan = page.getByRole('region', { name: 'The scan he flew by' })
  const wrong = scan.locator('.dc9-instrument-choice').filter({ hasText: 'Engine pressure ratio gauges' })
  for (let attempt = 0; attempt < 3; attempt += 1) await wrong.click()
  await expect(page.locator('.dc9-chapter__status p')).toContainText('outlined for you now')
  await expect(scan.locator('.dc9-instrument-choice.is-final-hint')).toHaveCount(1)
})

test('DC-9 route record uses the yoke hotspot and a compact dialog', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?skip3d=1')
  await seedGameState(page, createDc9RouteRecordState())

  const routeTrigger = page.getByRole('button', { name: 'Open Legacy Route Record' })
  await expect(routeTrigger).toHaveClass(/dc9-route-record-trigger/)
  await expect(routeTrigger).toHaveAttribute('data-projection', 'fallback')
  await expect(page.locator('.dc9-chapter__prompt')).toHaveCount(0)
  await routeTrigger.focus()
  await expect(routeTrigger).toHaveCSS('border-top-color', 'rgb(240, 200, 117)')
  await routeTrigger.press('Enter')

  const routeDialog = page.getByRole('dialog', { name: 'Legacy Route Record' })
  await expect(routeDialog).toBeVisible()
  await expect(routeDialog.locator('.dc9-document__question')).toHaveCSS('color', 'rgb(40, 33, 23)')
  await expect(routeDialog.locator('.dc9-document__note')).toHaveText('Choose familiar stops from Pop T’s DC-9 years.')
  await expect(routeDialog).not.toContainText('This record does not claim')
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
  const keyTrigger = page.getByRole('button', { name: "Open The Captain's Key" })
  await expect(keyTrigger).toHaveClass(/dc9-key-trigger/)
  await expect(keyTrigger.getByRole('img', { name: "Golden Captain's Key" })).toBeVisible()
  await expect(keyTrigger).not.toContainText("Open The Captain's Key")
})

test('Airbus production cockpit loads the A320 GLB', async ({ page }) => {
  // SwiftShader can take longer to tear down the real 38 MiB cockpit page after
  // the final WebGL assertion; keep the boundary bounded without weakening checks.
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1440, height: 900 })
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
  const radioTarget = page.getByRole('button', { name: 'Cockpit drop zone 4' })
  const thrustTarget = page.getByRole('button', { name: 'Cockpit drop zone 2' })
  const radioX = Number(await radioTarget.getAttribute('data-anchor-x'))
  const radioY = Number(await radioTarget.getAttribute('data-anchor-y'))
  const thrustX = Number(await thrustTarget.getAttribute('data-anchor-x'))
  const thrustY = Number(await thrustTarget.getAttribute('data-anchor-y'))

  expect(radioX).toBeGreaterThan(868)
  expect(radioX).toBeLessThan(890)
  expect(radioY).toBeGreaterThan(658)
  expect(radioY).toBeLessThan(680)
  expect(thrustX).toBeGreaterThan(1130)
  expect(thrustX).toBeLessThan(1155)
  expect(thrustY).toBeGreaterThan(720)
  expect(thrustY).toBeLessThan(748)

  await capturePlacementEvidence(page, 'airbus')
  if (process.env.PLACEMENT_EVIDENCE_DIR) return
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.getByRole('button', { name: /^RADIO\b/ }).click()
  await canvas.dispatchEvent('click', { bubbles: true, clientX: radioX, clientY: radioY })
  await expect(radioTarget).toHaveClass(/is-correct/, { timeout: 15_000 })

  await page.getByRole('button', { name: /^THRUST\b/ }).click()
  await canvas.dispatchEvent('click', { bubbles: true, clientX: thrustX, clientY: thrustY })
  await expect(thrustTarget).toHaveClass(/is-correct/, { timeout: 15_000 })
  await expect(canvas).toHaveAttribute('data-airbus-camera-state', /,68\.00000$/, { timeout: 15_000 })
  expect(consoleErrors).toEqual([])
})

test('DC-9 production cockpit stages the Final Flight Log with the existing registry', async ({ page }) => {
  // The complete real-GLB path can cross four minutes after neighbouring asset
  // decodes; retain every assertion while allowing bounded full-suite contention.
  // Raised again after CI blew the 300s budget on the instrument scan while the
  // Airbus GLB tests were competing for the same runner: the click was still
  // waiting for a choice that had not finished rendering. A wall-clock bound on
  // a CPU rasteriser, not a correctness bound — a passing run is unaffected
  // because it never waits this long.
  test.setTimeout(900_000)
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
  await seedGameState(page, createDc9RouteRecordState())
  const response = await modelResponse
  expect(Number(response.headers()['content-length'])).toBeGreaterThan(20_000_000)

  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-dc9-model-state', 'ready', { timeout: 30_000 })
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL')
  await expect(canvas).toHaveAttribute('data-dc9-targets', /dc9\.route\.BTR/)
  await expect(canvas).toHaveAttribute('data-dc9-targets', /dc9\.secure\.apuBuses/)
  await expect(canvas).toHaveAttribute('data-dc9-targets', /dc9\.key\.open/)
  await expect(page.locator('.prototype-badge')).toHaveText('GREYBOX — DC-9 FINAL FLIGHT LOG')
  await expect(page.locator('.hud')).toHaveCount(0)
  await expect(page.locator('.captain-interface')).toHaveCount(0)

  const routeTrigger = page.getByRole('button', { name: 'Open Legacy Route Record' })
  await expect(routeTrigger).toHaveClass(/dc9-route-record-trigger/)
  await expect(page.locator('.dc9-chapter__prompt')).toHaveCount(0)
  await expect(routeTrigger).toHaveAttribute('data-projection', 'mesh')
  const projectionSize = await routeTrigger.getAttribute('data-projection-size')
  expect(projectionSize).not.toBeNull()
  const [projectedWidth, projectedHeight] = projectionSize!.split(',').map(Number)
  const routeTriggerBounds = await routeTrigger.boundingBox()
  expect(routeTriggerBounds).not.toBeNull()
  expect(routeTriggerBounds!.width).toBeCloseTo(projectedWidth + 8, 0)
  expect(routeTriggerBounds!.height).toBeCloseTo(projectedHeight + 8, 0)
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
  await expect(page.getByRole('dialog', { name: 'Home Operations Log' })).toBeVisible()
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL')
  for (let pageNumber = 1; pageNumber < dc9LegacyFlow.homeOperationsPages.length; pageNumber += 1) {
    await page.getByRole('button', { name: 'Next page' }).press('Enter')
  }
  await page.getByRole('button', { name: 'Record this legacy' }).press('Enter')

  // The instrument scan reads the right-seat panel, so it keeps the panel framing and
  // projects a click target onto each real gauge before the overhead shutdown view.
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL')
  await expect(canvas).toHaveAttribute('data-dc9-targets', /dc9\.gauge\.airspeed/)
  await expect(page.locator('.dc9-gauge-target')).toHaveCount(6)
  await page.locator('.dc9-gauge-target[data-gauge="airspeed"]').click()
  await expect(page.locator('.dc9-chapter__status p')).toContainText('the airspeed indicator')

  // The EPR pair is the one gauge off the first-officer panel, at the very edge of this
  // framing, so it is the one that falls out of reach. Whatever the window does, the
  // gauge being asked for must stay wholly on screen and answerable from the cockpit.
  const eprTarget = page.locator('.dc9-gauge-target[data-gauge="epr"]')
  for (const size of [{ width: 1024, height: 768 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(size)
    await expect(eprTarget).toHaveCount(1)
    const box = await eprTarget.boundingBox()
    expect(box, `EPR target at ${size.width}x${size.height}`).not.toBeNull()
    expect(box!.x, `EPR left edge at ${size.width}`).toBeGreaterThanOrEqual(0)
    expect(box!.y, `EPR top edge at ${size.width}`).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, `EPR right edge at ${size.width}`).toBeLessThanOrEqual(size.width)
    expect(box!.y + box!.height, `EPR bottom edge at ${size.width}`).toBeLessThanOrEqual(size.height)
  }

  await completeDc9InstrumentScan(page)

  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_FIRST_OFFICER_OVERHEAD_APPROVAL')
  await expect(canvas).toHaveAttribute(
    'data-dc9-camera-state',
    /0\.13868,0\.24849,-0\.01443,0\.95855,64\.00000$/,
  )

  const apuBuses = page.getByRole('button', { name: /APU bus switches/ })
  const apuMaster = page.getByRole('button', { name: /APU master switch/ })
  const battery = page.getByRole('button', { name: /Battery switch/ })
  await expect(apuBuses).toHaveAttribute('data-projection', 'mesh')
  await expect(apuMaster).toHaveAttribute('data-projection', 'mesh')
  await expect(battery).toHaveAttribute('data-projection', 'mesh')

  // Clicking a switch on the real overhead panel must action that switch. The shipped hit
  // volumes are far larger than the 70mm between the switches and overlapped, so a ray
  // aimed at the APU buses struck the battery box in front of it and the first step of the
  // checklist reported "that step comes later".
  const apuBusesPoint = (await apuBuses.getAttribute('data-projection-point'))?.split(',').map(Number) ?? []
  expect(apuBusesPoint.length).toBeGreaterThanOrEqual(2)
  await page.mouse.click(apuBusesPoint[0]!, apuBusesPoint[1]!)
  await expect(page.locator('.dc9-chapter__status p')).toContainText('APU bus switches off')
  await expect(apuBuses).toHaveAttribute('aria-pressed', 'true')

  // An out-of-order selection still coaches without clearing the finished step.
  await battery.press('Enter')
  await expect(page.locator('.dc9-chapter__status p')).toContainText('That step comes later')
  await expect(apuBuses).toHaveAttribute('aria-pressed', 'true')
  await expect(apuMaster).toHaveAttribute('aria-pressed', 'false')

  await apuMaster.press('Enter')
  await expect(apuMaster).toHaveAttribute('aria-pressed', 'true')
  await battery.press('Enter')
  const atpAnswer = page.getByRole('textbox', { name: 'Airline Transport Pilot answer' })
  await atpAnswer.fill('1500 hours')
  await page.getByRole('button', { name: 'Verify' }).press('Enter')
  const keyTrigger = page.getByRole('button', { name: "Open The Captain's Key" })
  await expect(keyTrigger).toHaveClass(/dc9-key-trigger/)
  await expect(canvas).toHaveAttribute('data-dc9-camera-node', 'CAM_DC9_FIRST_OFFICER_GAME')
  const scanCue = page.locator('.dc9-key-scan-cue')
  await expect(scanCue).toBeVisible()
  const scanCueFontSize = Number.parseFloat(await scanCue.evaluate((element) => getComputedStyle(element).fontSize))
  expect(scanCueFontSize).toBeGreaterThanOrEqual(56)
  const canvasBounds = await canvas.boundingBox()
  expect(canvasBounds).not.toBeNull()
  if (canvasBounds) {
    await page.mouse.move(canvasBounds.x + canvasBounds.width * 0.38, canvasBounds.y + canvasBounds.height * 0.5)
    await page.mouse.down()
    await page.mouse.move(canvasBounds.x + canvasBounds.width * 0.8, canvasBounds.y + canvasBounds.height * 0.5, { steps: 8 })
    await page.mouse.up()
  }
  await expect(keyTrigger).toHaveAttribute('data-projection', 'mesh')
  await expect(page.locator('.dc9-key-scan-cue')).toHaveCount(0)
  expect(consoleErrors).toEqual([])
})

test('DC-9 model failure keeps the compact accessible captain controls', async ({ page }) => {
  test.setTimeout(30_000)
  await page.route('**/models/dc9-cockpit.glb*', (route) => route.abort())
  await page.goto('/')
  await seedGameState(page, createDc9RouteRecordState())

  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-dc9-model-state', 'fallback')
  await expect(page.getByRole('alert')).toContainText('3D cockpit unavailable')
  await expect(page.locator('.hud')).toHaveCount(0)
  await page.getByRole('button', { name: 'Open Legacy Route Record' }).press('Enter')
  await expect(page.getByRole('dialog', { name: 'Legacy Route Record' })).toBeVisible()
})

test('complete reordered journey', async ({ page }) => {
  await page.route('**/models/dc9-cockpit.glb*', (route) => route.abort())
  await page.goto('/?skip3d=1')

  await expect(page.getByRole('heading', { name: "The Captain's Key" })).toBeVisible()
  await expect(page.getByText('DC-9-32 first-officer station')).toBeVisible()
  await page.getByRole('button', { name: 'Start Game' }).click()
  const intro = page.getByRole('region', { name: 'Game intro' })
  await page.locator('audio').evaluate((media) => {
    media.currentTime = 6
    media.dispatchEvent(new Event('timeupdate'))
  })
  await intro.getByRole('button', { name: 'Start game' }).click()
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toBeVisible()

  await sweepDc9ControlCheck(page)

  await page.getByRole('button', { name: 'Open Legacy Route Record' }).click()
  for (const code of dc9LegacyFlow.routePuzzleAnswers) {
    await page.getByRole('button', { name: new RegExp(`^${code},`) }).click()
  }
  await page.getByRole('button', { name: 'Record selected routes' }).click()
  for (let pageNumber = 1; pageNumber < dc9LegacyFlow.homeOperationsPages.length; pageNumber += 1) {
    await page.getByRole('button', { name: 'Next page' }).click()
  }
  await page.getByRole('button', { name: 'Record this legacy' }).click()
  await completeDc9InstrumentScan(page)
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
  await expect(keyReveal.getByRole('img', { name: "Golden Captain's Key" })).toBeVisible()
  await expect(keyReveal).toContainText('Legacy flight secured. The Captain’s Locker is ready.')
  await expect(keyReveal).not.toContainText('Momma Cheryl')
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

  await expect(page.getByRole('heading', { name: 'Storm Line' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Storm Line' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })).toHaveCount(0)

  await seedGameState(page, createCompletedAirbusState())
  const completion = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(completion).toBeVisible()
  await expect(completion).toContainText('Directional Control · Energy Discipline · Calm Diversion')
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
  await expect(page.getByRole('heading', { name: 'Storm Line' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Storm Line' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })).toHaveCount(0)
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
