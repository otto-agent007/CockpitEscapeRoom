import { expect, test, type Locator, type Page, type Route } from '@playwright/test'
import { airbusCaptainFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

type CockpitId = 'dc9' | 'airbus'
type OrientationMotionEvidence = {
  cameraStates: string[]
  progresses: number[]
}
const cockpitModels: Record<CockpitId, { path: string; route: string }> = {
  dc9: { path: '/models/dc9-cockpit.glb', route: '**/models/dc9-cockpit.glb*' },
  airbus: { path: '/models/airbus-captain.glb', route: '**/models/airbus-captain.glb*' },
}
const orientationNames: Record<CockpitId, string> = {
  dc9: 'DC-9 cockpit orientation',
  airbus: 'Airbus A320 cockpit orientation',
}

async function waitForTourFromHeldModel(
  page: Page,
  cockpit: CockpitId,
  navigate: () => Promise<unknown>,
): Promise<Locator> {
  const model = cockpitModels[cockpit]
  let releaseModel = () => {}
  const modelGate = new Promise<void>((resolve) => {
    releaseModel = resolve
  })
  const holdModel = async (route: Route) => {
    await modelGate
    await route.continue()
  }

  await page.route(model.route, holdModel)
  const modelRequested = page.waitForRequest(
    (request) => request.url().includes(model.path),
    { timeout: 120_000 },
  )

  try {
    const navigation = navigate()
    await modelRequested

    const orientation = page.getByRole('region', { name: orientationNames[cockpit] })
    const orientationVisible = expect(orientation).toBeVisible({ timeout: 120_000 })
    await page.locator('canvas').evaluate((canvas, cockpitId) => {
      const browserWindow = window as typeof window & {
        __cockpitOrientationMotionEvidence?: Partial<Record<CockpitId, OrientationMotionEvidence>>
      }
      const evidence: OrientationMotionEvidence = { cameraStates: [], progresses: [] }
      browserWindow.__cockpitOrientationMotionEvidence ??= {}
      browserWindow.__cockpitOrientationMotionEvidence[cockpitId] = evidence
      const cameraAttribute = cockpitId === 'dc9'
        ? 'data-dc9-camera-state'
        : 'data-airbus-camera-state'
      const record = () => {
        const cameraState = canvas.getAttribute(cameraAttribute)
        if (cameraState && evidence.cameraStates.at(-1) !== cameraState) {
          evidence.cameraStates.push(cameraState)
        }
        const progress = Number(canvas.dataset.cockpitOrientationProgress)
        if (Number.isFinite(progress) && evidence.progresses.at(-1) !== progress) {
          evidence.progresses.push(progress)
        }
      }
      new MutationObserver(record).observe(canvas, {
        attributes: true,
        attributeFilter: [cameraAttribute, 'data-cockpit-orientation-progress'],
      })
      record()
    }, cockpit)
    releaseModel()
    await Promise.all([navigation, orientationVisible])
    return orientation
  } finally {
    releaseModel()
    await page.unroute(model.route, holdModel)
  }
}

async function orientationMotionEvidence(
  page: Page,
  cockpit: CockpitId,
): Promise<OrientationMotionEvidence> {
  return page.evaluate((cockpitId) => {
    const browserWindow = window as typeof window & {
      __cockpitOrientationMotionEvidence?: Partial<Record<CockpitId, OrientationMotionEvidence>>
    }
    return browserWindow.__cockpitOrientationMotionEvidence?.[cockpitId]
      ?? { cameraStates: [], progresses: [] }
  }, cockpit)
}

async function openWithInitialState(
  page: Page,
  state: GameState,
  cockpit: CockpitId,
): Promise<Locator> {
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('cockpit-orientation-initial-state')) {
      localStorage.setItem(key, JSON.stringify(value))
      sessionStorage.setItem('cockpit-orientation-initial-state', 'seeded')
    }
  }, { key: STORAGE_KEY, value: state })
  return waitForTourFromHeldModel(page, cockpit, () => page.goto('/'))
}

async function seed(page: Page, state: GameState): Promise<void> {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  )
  await page.reload()
}

async function seedAndWaitForTour(
  page: Page,
  state: GameState,
  cockpit: CockpitId,
): Promise<Locator> {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  )
  return waitForTourFromHeldModel(page, cockpit, () => page.reload())
}

async function savedOrientationSeen(page: Page, cockpit: 'dc9' | 'airbus'): Promise<boolean> {
  return page.evaluate(({ key, cockpitId }) => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved).cockpitOrientationSeen[cockpitId] : false
  }, { key: STORAGE_KEY, cockpitId: cockpit })
}

async function expectOrientationSaved(page: Page, cockpit: CockpitId): Promise<void> {
  await expect.poll(
    () => savedOrientationSeen(page, cockpit),
    { timeout: 30_000 },
  ).toBe(true)
}

test('the first DC-9 entry orients the right seat once before enabling the control check', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const orientation = await openWithInitialState(
    page,
    { ...createInitialState(), phase: 'dc9' },
    'dc9',
  )

  const canvas = page.locator('canvas')
  await expect(orientation.getByRole('progressbar', { name: 'Cockpit tour in progress' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toHaveCount(0)
  await expect(canvas).toHaveAttribute('data-cockpit-orientation', 'dc9')

  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' }))
    .toBeVisible({ timeout: 120_000 })
  await expect(orientation).toHaveCount(0)
  const evidence = await orientationMotionEvidence(page, 'dc9')
  expect(new Set(evidence.cameraStates).size).toBeGreaterThan(1)
  expect(evidence.progresses.some((progress) => progress > 0 && progress < 1)).toBe(true)
  await expectOrientationSaved(page, 'dc9')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toBeVisible({ timeout: 120_000 })
  await expect(orientation).toHaveCount(0)
})

test('the first Airbus entry orients the left seat once before enabling label placement', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const orientation = await openWithInitialState(
    page,
    {
      ...createInitialState(),
      phase: 'airbus',
      airbusCaptainModeUnlocked: true,
    },
    'airbus',
  )

  const canvas = page.locator('canvas')
  await expect(orientation.getByRole('progressbar', { name: 'Cockpit tour in progress' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' })).toHaveCount(0)
  await expect(canvas).toHaveAttribute('data-cockpit-orientation', 'airbus')

  await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' }))
    .toBeAttached({ timeout: 120_000 })
  await expect(orientation).toHaveCount(0)
  const evidence = await orientationMotionEvidence(page, 'airbus')
  expect(new Set(evidence.cameraStates).size).toBeGreaterThan(1)
  expect(evidence.progresses.some((progress) => progress > 0 && progress < 1)).toBe(true)
  await expectOrientationSaved(page, 'airbus')

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
  await openWithInitialState(page, { ...createInitialState(), phase: 'dc9' }, 'dc9')

  const skip = page.getByRole('button', { name: 'Skip cockpit tour' })
  await expect(skip).toBeFocused({ timeout: 120_000 })
  await page.keyboard.press('Enter')

  await expect(skip).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toBeVisible()
  await expectOrientationSaved(page, 'dc9')

  await seedAndWaitForTour(
    page,
    {
      ...createInitialState(),
      phase: 'airbus',
      airbusCaptainModeUnlocked: true,
    },
    'airbus',
  )

  await expect(skip).toBeFocused({ timeout: 120_000 })
  await page.keyboard.press('Enter')

  await expect(skip).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' })).toBeAttached()
  await expectOrientationSaved(page, 'airbus')
})

test('reduced motion and accessible fallback bypass camera travel without replaying it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await seed(page, { ...createInitialState(), phase: 'dc9' })

  await expect(page.getByRole('region', { name: 'DC-9 cockpit orientation' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toBeVisible()
  await expectOrientationSaved(page, 'dc9')

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?skip3d=1')
  await seed(page, {
    ...createInitialState(),
    phase: 'airbus',
    airbusCaptainModeUnlocked: true,
  })

  await expect(page.getByRole('region', { name: 'Airbus A320 cockpit orientation' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' })).toBeAttached()
  await expectOrientationSaved(page, 'airbus')
})
