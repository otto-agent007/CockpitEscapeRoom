import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

const evidenceDirectory = 'preview-renders/model-y-reward'

async function captureEvidence(page: Page, name: string) {
  if (process.env.CAPTURE_REWARD_EVIDENCE !== '1') return
  mkdirSync(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: `${evidenceDirectory}/${name}.png`, fullPage: true })
}

function rewardState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    phase: 'reward',
    completedPuzzles: ['dc9', 'locker', 'airbus'],
    rewardUnlocked: true,
    statusMessage: 'Ground transport upgrade authorized.',
    ...overrides,
  }
}

async function seed(page: Page, state: GameState) {
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value))
  }, { key: STORAGE_KEY, value: state })
  await page.reload()
}

test('protects the Model Y request until the reward phase', async ({ page }) => {
  let rewardRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('/models/model-y-reward.glb')) rewardRequests += 1
  })

  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible()
  expect(rewardRequests).toBe(0)

  await seed(page, rewardState())
  await expect.poll(() => rewardRequests).toBe(1)
  const rewardCanvas = page.locator('canvas[data-reward-model-state="ready"]')
  await expect(rewardCanvas).toBeVisible()
  await expect(rewardCanvas).toHaveAttribute('data-reward-pose', 'stowed')
})

test('plays the authored reward and provides Skip and Replay', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await seed(page, rewardState())

  await expect(page.locator('canvas[data-reward-model-state="ready"]')).toBeVisible()
  await expect.poll(async () => (await page.locator('canvas').boundingBox())?.width).toBe(1440)
  const skipButton = page.getByRole('button', { name: 'Skip cinematic' })
  await expect(skipButton).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(skipButton).toBeFocused()
  await page.waitForTimeout(1_250)
  await captureEvidence(page, '1440-static-reveal')
  await skipButton.click()

  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveAttribute('data-reward-clip-time', '11.500')
  await expect(page.locator('canvas')).toHaveAttribute('data-reward-pose', 'deployed')
  await expect(page.getByText('Ground Transport Upgrade Authorized', { exact: true })).toBeVisible()
  await expect(page.getByText('The red Tesla Model Y is unlocked.', { exact: true })).toBeVisible()
  await expect(page.getByText(/From the baseball field to the captain’s seat/)).toBeVisible()
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
  await expect(page.getByText(/mars/i)).toHaveCount(0)
  await page.waitForTimeout(300)
  await captureEvidence(page, '1440-flight-mode-final')

  for (const viewport of [
    { width: 768, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(page.locator('canvas')).toHaveAttribute('data-reward-camera', 'narrow')
    await expect(page.locator('img.reward-narrow-presentation')).toBeVisible()
    await expect(page.locator('img.reward-narrow-presentation')).toHaveAttribute(
      'src',
      /model-y-reward-narrow-final\.png$/,
    )
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await captureEvidence(page, `${viewport.width}-flight-mode-final`)
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: 'Replay Flight Mode' }).click()
  await expect(page.locator('[data-reward-stage="hangar-open"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skip cinematic' })).toBeVisible()
})

test('reduced motion starts at the exact final pose and survives reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await seed(page, rewardState())

  await expect(page.locator('canvas[data-reward-model-state="ready"]')).toBeVisible()
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveAttribute('data-reward-clip-time', '11.500')
  await expect(page.getByText(/Reduced motion is on/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skip cinematic' })).toHaveCount(0)

  await page.reload()
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
})

test('failed reward loading preserves the tribute and offers retry or accessible fallback', async ({ page }) => {
  let requests = 0
  await page.route('**/models/model-y-reward.glb*', (route) => {
    requests += 1
    return route.fulfill({ status: 503, body: 'offline' })
  })
  await page.goto('/')
  await seed(page, rewardState())

  await expect(page.getByRole('alert')).toContainText('Your completed journey is safe.')
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
  await page.getByRole('button', { name: 'Retry 3D' }).click()
  await expect.poll(() => requests).toBe(2)
  await page.getByRole('button', { name: 'Continue with accessible reward' }).click()
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.getByLabel('Accessible Model Y reward')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry 3D' })).toHaveCount(0)
})

test('accessible reward and legacy Mars saves return to the protected hangar', async ({ page }) => {
  let rewardRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('/models/model-y-reward.glb')) rewardRequests += 1
  })
  await page.goto('/?skip3d=1')
  await seed(page, rewardState({
    phase: 'mars',
    marsUnlocked: true,
  }))

  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.getByText('Ground Transport Upgrade Authorized', { exact: true })).toBeVisible()
  await expect(page.getByText(/mars/i)).toHaveCount(0)
  expect(rewardRequests).toBe(0)
})

test('accessible reward has no horizontal overflow at owner-review widths', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seed(page, rewardState())

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await captureEvidence(page, `${viewport.width}-accessible-final`)
  }
})
