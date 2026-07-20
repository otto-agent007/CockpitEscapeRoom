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

async function openGameIntro(page: Page) {
  await page.route('**/models/dc9-cockpit.glb*', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()
  const intro = page.getByRole('region', { name: 'Game intro' })
  await expect(intro).toBeVisible()
  return intro
}

test('game intro waits for every cinematic image to decode before playback', async ({ page }) => {
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = function controlledDecode() {
      return new Promise<void>((resolve, reject) => {
        window.addEventListener('release-intro-images', () => {
          void decode.call(this).then(resolve, reject)
        }, { once: true })
      })
    }
  })

  await page.goto('/')
  const startGame = page.getByRole('button', { name: 'Start Game' })
  await expect(startGame).toBeDisabled()
  await expect(page.getByText('Preparing the TMB2 cinematic…')).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event('release-intro-images')))
  await expect(startGame).toBeEnabled()
  await startGame.click()
  await expect(page.getByRole('region', { name: 'Game intro' })).toBeVisible()
})

test('game intro exposes production retry after a named image decode failure', async ({ page }) => {
  await page.addInitScript(() => {
    let rejectRunSheetOnce = true
    HTMLImageElement.prototype.decode = function controlledDecode() {
      if (rejectRunSheetOnce && this.src.includes('/popt/run-sheet.png')) {
        rejectRunSheetOnce = false
        return Promise.reject(new Error('decode rejected for test'))
      }
      return Promise.resolve()
    }
  })

  await page.goto('/')
  const startGame = page.getByRole('button', { name: 'Start Game' })
  await expect(startGame).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('popt-run-sheet')
  await expect(page.getByRole('status')).toContainText('images/intro/popt/run-sheet.png')
  await page.getByRole('button', { name: 'Retry cinematic assets' }).click()
  await expect(startGame).toBeEnabled()
})

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
  const intro = page.getByRole('region', { name: 'Game intro' })
  await expect(intro).toHaveAttribute('data-intro-cue', 'tmb2-ident')
  await expect(intro.locator('canvas')).toHaveAttribute('width', '320')
  await expect(intro.locator('canvas')).toHaveAttribute('height', '224')
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toHaveCount(0)
  await intro.getByRole('button', { name: 'Skip Intro' }).click()
  await expect(page.locator('.dc9-entry-transition')).toHaveAttribute('data-stage', /fade-out|waiting-for-cockpit|fade-in/)
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.dc9-entry-transition')).toHaveAttribute('data-stage', 'fade-in', { timeout: 20_000 })
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(0, { timeout: 5_000 })
})

test('game intro follows media cue boundaries, loops on ended, and starts on request', async ({ page }) => {
  const intro = await openGameIntro(page)
  const audio = page.locator('audio')
  await audio.evaluate(async (media) => {
    if (media.readyState >= HTMLMediaElement.HAVE_METADATA) return
    await new Promise<void>((resolve, reject) => {
      media.addEventListener('loadedmetadata', () => resolve(), { once: true })
      media.addEventListener('error', () => reject(new Error('Intro audio metadata failed')), { once: true })
    })
  })

  await expect(intro.locator('canvas')).toHaveAttribute('width', '320')
  await expect(intro.locator('canvas')).toHaveAttribute('height', '224')
  await expect(intro.getByRole('button', { name: 'Start game' })).toHaveCount(0)

  const cues = [
    { time: 6, id: 'duffel' },
    { time: 16, id: 'runway' },
    { time: 28, id: 'city-finance' },
    { time: 48, id: 'catch' },
  ] as const

  for (const cue of cues) {
    await audio.evaluate((media, time) => {
      media.currentTime = time
      media.dispatchEvent(new Event('timeupdate'))
    }, cue.time)
    await expect(intro).toHaveAttribute('data-intro-cue', cue.id)
    await expect(intro.locator('canvas')).toHaveAttribute('data-scene', cue.id)
  }
  await expect(intro.getByRole('button', { name: 'Start game' })).toBeVisible()

  await audio.evaluate((media) => {
    Object.defineProperty(media, 'currentTime', { configurable: true, writable: true, value: 53.04 })
    media.dispatchEvent(new Event('ended'))
  })
  await expect(intro).toHaveAttribute('data-intro-cue', 'tmb2-ident')
  await expect(intro.getByRole('button', { name: 'Start game' })).toBeVisible()
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(0)

  await intro.getByRole('button', { name: 'Start game' }).click()
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(1)
})

test('game intro exposes working sound controls and gates keyboard start aliases', async ({ page }) => {
  const intro = await openGameIntro(page)
  const audio = page.locator('audio')

  await intro.getByRole('button', { name: 'Mute intro' }).click()
  await expect(audio).toHaveJSProperty('muted', true)
  await intro.getByLabel('Intro volume').fill('0.35')
  await expect.poll(() => audio.evaluate((media) => media.volume)).toBeCloseTo(0.35)

  await page.keyboard.press('Enter')
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(0)

  await audio.evaluate((media) => {
    media.currentTime = 6
    media.dispatchEvent(new Event('timeupdate'))
  })
  const muteButton = intro.getByRole('button', { name: 'Unmute intro' })
  await muteButton.press('Enter')
  await expect(audio).toHaveJSProperty('muted', false)
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(0)
  await intro.getByRole('button', { name: 'Mute intro' }).press('Space')
  await expect(audio).toHaveJSProperty('muted', true)
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(0)
  await intro.getByLabel('Intro volume').press('Space')
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(0)

  for (const key of ['Enter', 'Space', 'Escape']) {
    await page.evaluate(() => window.localStorage.clear())
    const currentIntro = await openGameIntro(page)
    const currentAudio = page.locator('audio')
    await currentAudio.evaluate((media) => {
      media.currentTime = 6
      media.dispatchEvent(new Event('timeupdate'))
    })
    await page.keyboard.press(key)
    await expect(page.locator('.dc9-entry-transition')).toHaveCount(1)
    await expect(currentIntro).toHaveCount(0)
  }
})

test('game intro Start button retains native keyboard activation', async ({ page }) => {
  const intro = await openGameIntro(page)
  await page.locator('audio').evaluate((media) => {
    media.currentTime = 6
    media.dispatchEvent(new Event('timeupdate'))
  })

  await intro.getByRole('button', { name: 'Start game' }).press('Enter')
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(1)
})

test('game intro accepts a newly pressed standard gamepad Start button', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 10 }, () => ({ pressed: false, touched: false, value: 0 }))
    const gamepad = {
      axes: [],
      buttons,
      connected: true,
      hapticActuators: [],
      id: 'Intro test controller',
      index: 0,
      mapping: 'standard',
      timestamp: 0,
      vibrationActuator: null,
    }
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [gamepad],
    })
    window.addEventListener('test-gamepad-start-at-six', () => {
      const audio = document.querySelector('audio')
      if (audio) {
        audio.currentTime = 6
        audio.dispatchEvent(new Event('timeupdate'))
      }
      buttons[9].pressed = true
    })
  })

  const intro = await openGameIntro(page)
  await page.evaluate(() => window.dispatchEvent(new Event('test-gamepad-start-at-six')))
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(1)
  await expect(intro).toHaveCount(0)
})

test('game intro continues silently and retries rejected audio', async ({ page }) => {
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
  await intro.getByRole('button', { name: 'Skip Intro' }).click()
  await expect(page.locator('.dc9-entry-transition')).toHaveCount(1)
})

test('game intro honors reduced motion and fits required viewports', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 375, height: 812 })
  const intro = await openGameIntro(page)
  await expect(intro).toHaveAttribute('data-reduced-motion', 'true')

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    const scale = Math.max(1, Math.floor(Math.min(viewport.width / 320, viewport.height / 224)))
    const expectedGeometry = {
      left: Math.floor((viewport.width - 320 * scale) / 2),
      top: Math.floor((viewport.height - 224 * scale) / 2),
      width: 320 * scale,
      height: 224 * scale,
    }
    const readStageGeometry = () => intro.locator('.game-intro__stage').evaluate((stage) => {
      const stageBounds = stage.getBoundingClientRect()
      const shellBounds = stage.parentElement!.getBoundingClientRect()
      return {
        left: stageBounds.left - shellBounds.left,
        top: stageBounds.top - shellBounds.top,
        width: stageBounds.width,
        height: stageBounds.height,
      }
    })
    await expect.poll(readStageGeometry).toEqual(expectedGeometry)
    const stageGeometry = await readStageGeometry()
    expect(Object.values(stageGeometry).every(Number.isInteger)).toBe(true)
    await expect(intro.locator('.game-intro__stage')).toHaveCSS('transform-origin', '0px 0px')
    const bounds = await intro.locator('.game-intro__controls').boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  }
})

test('game intro uses the deployable 53-second audio', async ({ page }) => {
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
    { key: STORAGE_KEY, savedState: createDc9State() },
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

  expect(radioX).toBeGreaterThan(895)
  expect(radioX).toBeLessThan(920)
  expect(thrustX).toBeGreaterThan(1105)
  expect(thrustX).toBeLessThan(1130)

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
  // The complete real-GLB path can cross four minutes after neighboring asset
  // decodes; retain every assertion while allowing bounded full-suite contention.
  test.setTimeout(300_000)
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
  await battery.press('Enter')
  await apuBuses.press('Enter')
  await battery.press('Enter')
  await expect(apuBuses).toHaveAttribute('aria-pressed', 'true')
  await apuMaster.press('Enter')
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
  await page.getByRole('button', { name: 'Skip Intro' }).click()
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
