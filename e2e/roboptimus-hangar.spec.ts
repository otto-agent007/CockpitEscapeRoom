import { expect, test } from '@playwright/test'
import { createCompletedAirbusState } from './journeyStates'
import { STORAGE_KEY } from '../src/game/storage'

test('Roboptimus greets outside, walks to the doors, dances as they open, then fades into the film', async ({ page }) => {
  test.setTimeout(45_000)
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY, state: createCompletedAirbusState(),
  })
  await page.goto('/')
  const handoff = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(handoff).toHaveAttribute('data-handoff-stage', 'greeting')
  await expect(handoff.locator('[data-guide-motion="greeting"] canvas')).toBeVisible({ timeout: 20_000 })
  await expect(handoff.getByRole('button', { name: /^(Play|Replay) greeting$/ })).toBeEnabled()
  expect(requests.some(url => url.includes('/optimus-guide-dance-02-review.glb'))).toBe(false)
  await handoff.getByRole('button', { name: 'Reveal reward', exact: true }).click()
  await expect(handoff).toHaveAttribute('data-handoff-stage', 'walking')
  await expect(handoff.locator('[data-guide-motion="walk"] canvas')).toBeVisible()
  expect(requests.some(url => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(false)
  await expect(handoff).toHaveAttribute('data-handoff-stage', 'dancing', { timeout: 10_000 })
  await expect(handoff.locator('[data-guide-motion="dance"] canvas')).toBeVisible()
  expect(requests.some(url => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(false)
  await expect(handoff).toHaveAttribute('data-handoff-stage', 'fading', { timeout: 7_000 })
  const video = page.getByLabel('Model FLY film')
  await expect(video).toBeVisible({ timeout: 4_000 })
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.1)
  await video.evaluate(element => element.dispatchEvent(new Event('ended')))
  await expect(page.locator('.reward-tribute')).toBeVisible()
  await expect(page.locator('[data-guide-motion="dance"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Replay film', exact: true }).click()
  await expect(page.locator('[data-guide-motion="dance"]')).toHaveCount(0)
  await expect(video).toBeVisible()
})

test('the greeting ending starts the escort automatically and accessible mode can continue immediately', async ({ page }) => {
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY, state: createCompletedAirbusState(),
  })
  await page.goto('/?skip3d=1')
  const handoff = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(handoff).toHaveAttribute('data-handoff-stage', 'greeting')
  await expect(handoff).toContainText('Roboptimus')
  await page.getByLabel('Roboptimus greeting').evaluate(element => element.dispatchEvent(new Event('ended')))
  await expect(page.getByLabel('Model FLY film')).toBeVisible()
})

test('an early reveal with a delayed robot uses the film fallback without a truncated walk', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/models/roboptimus-guide.glb*', async route => {
    await gate
    await route.continue().catch(() => {})
  })
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY, state: createCompletedAirbusState(),
  })
  try {
    await page.goto('/')
    await page.getByRole('button', { name: 'Reveal reward', exact: true }).click()
    await expect(page.getByLabel('Model FLY film')).toBeVisible({ timeout: 3_000 })
    await expect(page.locator('[data-guide-motion="walk"]')).toHaveCount(0)
  } finally { release() }
})
