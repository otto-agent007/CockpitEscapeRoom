import { expect, test, type Page } from '@playwright/test'
import { airbusCaptainFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

type CockpitId = 'dc9' | 'airbus'
type OrientationEvidence = Record<CockpitId, {
  cameraStates: string[]
  progresses: number[]
}>

async function openWithInitialState(page: Page, state: GameState): Promise<void> {
  await page.addInitScript(({ key, value }) => {
    const browserWindow = window as typeof window & {
      __cockpitOrientationEvidence?: OrientationEvidence
    }
    if (!sessionStorage.getItem('cockpit-orientation-initial-state')) {
      localStorage.setItem(key, JSON.stringify(value))
      sessionStorage.setItem('cockpit-orientation-initial-state', 'seeded')
    }
    browserWindow.__cockpitOrientationEvidence = {
      dc9: { cameraStates: [], progresses: [] },
      airbus: { cameraStates: [], progresses: [] },
    }
    const sample = () => {
      const canvas = document.querySelector('canvas')
      const cockpit = canvas?.dataset.cockpitOrientation
      if (canvas && (cockpit === 'dc9' || cockpit === 'airbus')) {
        const evidence = browserWindow.__cockpitOrientationEvidence![cockpit]
        const cameraState = cockpit === 'dc9'
          ? canvas.dataset.dc9CameraState
          : canvas.dataset.airbusCameraState
        if (cameraState && evidence.cameraStates.at(-1) !== cameraState) {
          evidence.cameraStates.push(cameraState)
        }
        const progress = Number(canvas.dataset.cockpitOrientationProgress)
        if (Number.isFinite(progress)) evidence.progresses.push(progress)
      }
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  }, { key: STORAGE_KEY, value: state })
  await page.goto('/')
}

async function orientationEvidence(page: Page, cockpit: CockpitId) {
  return page.evaluate((cockpitId) => {
    const browserWindow = window as typeof window & {
      __cockpitOrientationEvidence?: OrientationEvidence
    }
    return browserWindow.__cockpitOrientationEvidence?.[cockpitId] ?? {
      cameraStates: [],
      progresses: [],
    }
  }, cockpit)
}

async function seed(page: Page, state: GameState): Promise<void> {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  )
  await page.reload()
}

async function savedOrientationSeen(page: Page, cockpit: 'dc9' | 'airbus'): Promise<boolean> {
  return page.evaluate(({ key, cockpitId }) => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved).cockpitOrientationSeen[cockpitId] : false
  }, { key: STORAGE_KEY, cockpitId: cockpit })
}

test('the first DC-9 entry orients the right seat once before enabling the control check', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await openWithInitialState(page, { ...createInitialState(), phase: 'dc9' })

  const canvas = page.locator('canvas')
  await expect.poll(() => canvas.getAttribute('data-dc9-model-state'), { timeout: 120_000 })
    .toBe('ready')

  const orientation = page.getByRole('region', { name: 'DC-9 cockpit orientation' })
  await expect(orientation).toBeVisible({ timeout: 5_000 })
  await expect(orientation.getByRole('progressbar', { name: 'Cockpit tour in progress' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toHaveCount(0)
  await expect(canvas).toHaveAttribute('data-cockpit-orientation', 'dc9')

  await expect(orientation).toHaveCount(0, { timeout: 8_000 })
  const evidence = await orientationEvidence(page, 'dc9')
  expect(new Set(evidence.cameraStates).size).toBeGreaterThan(1)
  expect(Math.max(...evidence.progresses)).toBeGreaterThan(0.2)
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toBeVisible()
  await expect.poll(() => savedOrientationSeen(page, 'dc9')).toBe(true)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toBeVisible({ timeout: 120_000 })
  await expect(orientation).toHaveCount(0)
})

test('the first Airbus entry orients the left seat once before enabling label placement', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await openWithInitialState(page, {
    ...createInitialState(),
    phase: 'airbus',
    airbusCaptainModeUnlocked: true,
  })

  const orientation = page.getByRole('region', { name: 'Airbus A320 cockpit orientation' })
  await expect(orientation).toBeVisible({ timeout: 120_000 })
  await expect(orientation.getByRole('progressbar', { name: 'Cockpit tour in progress' })).toBeVisible()
  const canvas = page.locator('canvas')
  await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' })).toHaveCount(0)
  await expect(canvas).toHaveAttribute('data-cockpit-orientation', 'airbus')

  await expect(orientation).toHaveCount(0, { timeout: 8_000 })
  const evidence = await orientationEvidence(page, 'airbus')
  expect(new Set(evidence.cameraStates).size).toBeGreaterThan(1)
  expect(Math.max(...evidence.progresses)).toBeGreaterThan(0.2)
  await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' })).toBeAttached()
  await expect.poll(() => savedOrientationSeen(page, 'airbus')).toBe(true)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' })).toBeAttached({ timeout: 120_000 })
  await expect(orientation).toHaveCount(0)

  const qualified = createInitialState()
  await seed(page, {
    ...qualified,
    phase: 'airbus',
    cockpitOrientationSeen: { dc9: true, airbus: true },
    airbusCaptainModeUnlocked: true,
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      ...qualified.airbusSimulator,
      familiarization: 'completed',
      cameraPhase: 'qualified',
      location: 'hub',
    },
  })
  await page.getByRole('button', { name: 'Open Storm Line' }).click()
  await page.getByRole('button', { name: 'Begin Storm Line' }).click()
  await expect(canvas).toHaveAttribute('data-airbus-camera-phase', 'transitioning')
  await expect(canvas).toHaveAttribute('data-airbus-camera-phase', 'storm', { timeout: 15_000 })
})

test('the keyboard-focused skip control settles both cockpit tours immediately', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await seed(page, { ...createInitialState(), phase: 'dc9' })

  const skip = page.getByRole('button', { name: 'Skip cockpit tour' })
  await expect(skip).toBeFocused({ timeout: 120_000 })
  await page.keyboard.press('Enter')

  await expect(skip).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toBeVisible()
  await expect.poll(() => savedOrientationSeen(page, 'dc9')).toBe(true)

  await seed(page, {
    ...createInitialState(),
    phase: 'airbus',
    airbusCaptainModeUnlocked: true,
  })

  await expect(skip).toBeFocused({ timeout: 120_000 })
  await page.keyboard.press('Enter')

  await expect(skip).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' })).toBeAttached()
  await expect.poll(() => savedOrientationSeen(page, 'airbus')).toBe(true)
})

test('reduced motion and accessible fallback bypass camera travel without replaying it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await seed(page, { ...createInitialState(), phase: 'dc9' })

  await expect(page.getByRole('region', { name: 'DC-9 cockpit orientation' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toBeVisible()
  await expect.poll(() => savedOrientationSeen(page, 'dc9')).toBe(true)

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?skip3d=1')
  await seed(page, {
    ...createInitialState(),
    phase: 'airbus',
    airbusCaptainModeUnlocked: true,
  })

  await expect(page.getByRole('region', { name: 'Airbus A320 cockpit orientation' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' })).toBeAttached()
  await expect.poll(() => savedOrientationSeen(page, 'airbus')).toBe(true)
})
