import { expect, test } from '@playwright/test'
import { createInitialState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

test('loading failure offers retry and accessible completion path', async ({ page }) => {
  let requests = 0
  await page.route('**/models/airbus-first-officer.glb', (route) => {
    requests += 1
    return route.fulfill({ status: 503, body: 'offline' })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()

  await expect(page.getByRole('heading', { name: 'Airbus A320 First-Officer Mode' })).toBeVisible()
  await expect(page.getByText('One of the most beautiful offices on earth.')).toBeVisible()
  await expect(page.getByText('Modern technology, human wisdom, and the view from the right seat.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry 3D' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^SIDESTICK\b/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Retry 3D' }).click()
  await expect.poll(() => requests).toBe(2)
  await expect(page.getByRole('button', { name: 'Retry 3D' })).toBeVisible()

  await page.getByRole('button', { name: 'Continue with accessible controls' }).click()
  await expect(page.getByRole('button', { name: /^SIDESTICK\b/ })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Game-ready Airbus A320 cockpit from the first-officer seat' })).toBeVisible()
})

test('viewer help closes with Escape and restores trigger focus', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  const trigger = page.getByRole('button', { name: 'Open viewer help' })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Explore this scene' })).toContainText('Look from the right seat')
  await expect(page.getByRole('button', { name: 'Close viewer help' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Explore this scene' })).toHaveCount(0)
  await expect(trigger).toBeFocused()

  const dock = await page.locator('.airbus-dock').boundingBox()
  const tools = await page.locator('.scene-tools').boundingBox()
  expect(dock).not.toBeNull()
  expect(tools).not.toBeNull()
  expect(tools!.x).toBeGreaterThan(dock!.x + dock!.width)
})

test('reduced motion qualification uses a static celebration and survives reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?skip3d=1')
  await page.evaluate(
    ({ key, state }) => window.localStorage.setItem(key, JSON.stringify(state)),
    {
      key: STORAGE_KEY,
      state: { ...createInitialState(), phase: 'airbus', completedPuzzles: ['firstOfficer'] },
    },
  )
  await page.reload()

  const dialog = page.getByRole('dialog', { name: 'Airline Transport Pilot milestone recognized' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('.qualification-confetti')).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Continue' })).toBeFocused()
})

test('Airbus wheel zoom clamps and reset restores the approved FOV', async ({ page }) => {
  test.setTimeout(75_000)
  await page.goto('/')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  const canvas = page.locator('canvas')
  await expect(canvas).toHaveAttribute('data-airbus-camera-state', /,68\.00000$/, { timeout: 30_000 })

  await canvas.hover()
  await page.mouse.wheel(0, -10_000)
  await expect(canvas).toHaveAttribute('data-airbus-camera-state', /,50\.00000$/)
  await page.mouse.wheel(0, 10_000)
  await expect(canvas).toHaveAttribute('data-airbus-camera-state', /,76\.00000$/)
  await page.keyboard.press('r')
  await expect(canvas).toHaveAttribute('data-airbus-camera-state', /,68\.00000$/)
})
