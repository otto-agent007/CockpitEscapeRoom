import { expect, test, type Page } from '@playwright/test'
import { dc9LegacyFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

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
