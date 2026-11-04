import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, statSync } from 'node:fs'

import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'
import { createCompletedAirbusState } from './journeyStates'

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

test('Airbus completion offers the Heart greeting before the protected reward', async ({ page }) => {
  const requested: string[] = []
  page.on('request', (request) => requested.push(request.url()))
  await page.goto('/?skip3d=1')
  expect(requested.some((url) => url.includes('/audio/roboptimus-greeting-heart.mp3'))).toBe(false)

  await seed(page, createCompletedAirbusState())
  const celebration = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(celebration).toContainText('Congratulations! You did it!')
  await expect(celebration).toContainText('Your pilot skills have earned you something special.')
  await expect(celebration).toContainText("Let's go check it out!")
  await expect(celebration.getByLabel('Roboptimus greeting')).toHaveAttribute('src', /audio\/roboptimus-greeting-heart\.mp3$/)
  await expect(celebration.getByRole('button', { name: 'Reveal reward' })).toBeVisible()
  expect(requested.some((url) => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(false)

  await celebration.getByRole('button', { name: 'Play greeting' }).click()
  await expect.poll(() => celebration.getByLabel('Roboptimus greeting').evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0.2)
  await celebration.getByRole('button', { name: 'Reveal reward' }).click()
  await expect(page.getByRole('heading', { name: 'Model FLY' })).toBeVisible()
  await expect.poll(() => requested.some((url) => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(true)
})

test('the Roboptimus hangar escort opens an automatically playing viewport-sized film', async ({ page }) => {
  test.setTimeout(60_000)
  const requested: string[] = []
  page.on('request', (request) => requested.push(request.url()))
  await page.goto('/')
  expect(requested.some((url) => url.includes('/models/roboptimus-guide.glb'))).toBe(false)
  await seed(page, createCompletedAirbusState())
  const celebration = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(celebration.locator('.optimus-guide-canvas canvas')).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => requested.some((url) => url.includes('/models/roboptimus-guide.glb'))).toBe(true)
  expect(await page.evaluate(async () => {
    const response = await fetch('/models/roboptimus-guide.glb', { cache: 'no-store' })
    return response.ok ? (await response.arrayBuffer()).byteLength : -1
  })).toBe(statSync('public/models/roboptimus-guide.glb').size)
  expect(requested.some((url) => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(false)

  await celebration.getByRole('button', { name: /^(Play|Replay) greeting$/ }).click()
  await expect.poll(() => celebration.getByLabel('Roboptimus greeting').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0.2)
  await celebration.getByRole('button', { name: 'Reveal reward' }).click()

  const video = page.getByLabel('Model FLY film')
  // The walk, door dance and fade take 14.7 seconds before the movie opens.
  await expect(video).toBeVisible({ timeout: 20_000 })
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
  const dimensions = await video.evaluate((element: HTMLVideoElement) => ({
    width: element.getBoundingClientRect().width,
    height: element.getBoundingClientRect().height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  }))
  expect(dimensions.width).toBeGreaterThanOrEqual(dimensions.viewportWidth - 1)
  expect(dimensions.height).toBeGreaterThanOrEqual(dimensions.viewportHeight - 1)
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), { timeout: 15_000 }).toBeGreaterThan(0.25)
})

test('blocked greeting autoplay keeps a manual play path without reporting a broken file', async ({ page }) => {
  await page.addInitScript(() => {
    const originalPlay = HTMLMediaElement.prototype.play
    let blockedOnce = false
    HTMLMediaElement.prototype.play = function () {
      if (this.getAttribute('aria-label') === 'Roboptimus greeting' && !blockedOnce) {
        blockedOnce = true
        return Promise.reject(new DOMException('Playback needs a click', 'NotAllowedError'))
      }
      return originalPlay.call(this)
    }
  })
  await page.goto('/?skip3d=1')
  await seed(page, createCompletedAirbusState())
  const celebration = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(celebration.getByRole('button', { name: 'Play greeting' })).toBeVisible()
  await expect(celebration.getByText('The greeting is shown above. You can still reveal your reward.')).toHaveCount(0)
  await celebration.getByRole('button', { name: 'Play greeting' }).click()
  await expect.poll(() => celebration.getByLabel('Roboptimus greeting').evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0.2)
})

test('Roboptimus starts with sound on despite earlier mute and can still be muted before keyboard reveal', async ({ page }) => {
  const requested: string[] = []
  page.on('request', (request) => requested.push(request.url()))
  await page.goto('/?skip3d=1')
  await page.evaluate(() => localStorage.setItem('cockpit-escape-room:sound:v1', '{"muted":true}'))
  await seed(page, createCompletedAirbusState())

  const celebration = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(celebration).toContainText('Congratulations! You did it!')
  await expect(celebration.getByLabel('Roboptimus greeting')).toBeAttached()
  await expect(celebration.getByRole('button', { name: 'Sound on', exact: true })).toBeVisible()
  await celebration.getByRole('button', { name: 'Sound on', exact: true }).click()
  await expect(celebration.getByLabel('Roboptimus greeting')).toHaveCount(0)
  await expect(celebration.getByRole('button', { name: 'Sound off', exact: true })).toBeVisible()
  await page.reload()
  await expect(celebration.getByLabel('Roboptimus greeting')).toBeAttached()
  await expect(celebration.getByRole('button', { name: 'Sound on', exact: true })).toBeVisible()
  await celebration.getByRole('button', { name: 'Sound on', exact: true }).click()
  await expect(celebration.getByLabel('Roboptimus greeting')).toHaveCount(0)
  expect(requested.some((url) => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(false)

  const reveal = celebration.getByRole('button', { name: 'Reveal reward' })
  await reveal.focus()
  await expect(reveal).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Model FLY' })).toBeVisible()
  await expect.poll(() => requested.some((url) => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(true)
})

test('the completed Airbus greeting stays readable at phone, tablet and desktop widths', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seed(page, createCompletedAirbusState())
  mkdirSync('preview-renders/optimus-gen3-animation-intake/browser', { recursive: true })
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const celebration = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
    await expect(celebration).toContainText("Let's go check it out!")
    const reveal = celebration.getByRole('button', { name: 'Reveal reward' })
    await reveal.scrollIntoViewIfNeeded()
    await expect(reveal).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await page.screenshot({ path: `preview-renders/optimus-gen3-animation-intake/browser/heart-handoff-${width}.png` })
  }
})

test('a missing greeting file leaves the caption and reward path usable', async ({ page }) => {
  await page.route('**/audio/roboptimus-greeting-heart.mp3', (route) => route.fulfill({ status: 503, body: 'offline' }))
  await page.goto('/?skip3d=1')
  await seed(page, createCompletedAirbusState())
  const celebration = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(celebration).toContainText('Congratulations! You did it!')
  await expect(celebration.getByRole('status')).toContainText('You can still reveal your reward.')
  await celebration.getByRole('button', { name: 'Play greeting' }).click()
  await expect(celebration.getByRole('status')).toContainText('You can still reveal your reward.')
  await celebration.getByRole('button', { name: 'Reveal reward' }).click()
  await expect(page.getByRole('heading', { name: 'Model FLY' })).toBeVisible()
})

test('a failed Optimus model load keeps the pictured guide and reward action usable', async ({ page }) => {
  await page.route('**/models/roboptimus-guide.glb*', (route) => route.fulfill({ status: 503, body: 'offline' }))
  await page.goto('/')
  const failedModel = page.waitForResponse((response) => response.url().includes('/models/roboptimus-guide.glb') && response.status() === 503)
  await seed(page, createCompletedAirbusState())
  await failedModel
  const celebration = page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
  await expect(celebration.locator('img.optimus-guide-fallback')).toBeVisible()
  await expect(celebration.locator('.optimus-guide-canvas canvas')).toHaveCount(0)
  await expect(celebration).toContainText('Congratulations! You did it!')
  await celebration.getByRole('button', { name: 'Reveal reward' }).click()
  await expect(page.getByRole('heading', { name: 'Model FLY' })).toBeVisible()
  await expect(page.getByLabel('Model FLY film')).toBeVisible({ timeout: 15_000 })
})

test('the Tesla film is protected until reward and replaces the legacy hangar', async ({ page }) => {
  const requested: string[] = []
  page.on('request', (request) => requested.push(request.url()))
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Game intro' })).toBeVisible()
  expect(requested.some((url) => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(false)
  expect(requested.some((url) => url.includes('/models/model-y-reward.glb'))).toBe(false)

  await seed(page, rewardState())
  await expect(page.getByRole('heading', { name: 'Model FLY' })).toBeVisible()
  const video = page.getByLabel('Model FLY film')
  await expect(video).toHaveAttribute('src', /media\/tesla-flight-mode-final\.mp4$/)
  await expect(video).toHaveAttribute('controls', '')
  await expect(page.locator('.reward-scene, canvas[data-reward-pose]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Watch full Flight Mode film' })).toHaveCount(0)
  await expect.poll(() => requested.some((url) => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(true)
  expect(requested.some((url) => url.includes('/models/model-y-reward.glb'))).toBe(false)
  await expect.poll(async () =>
    !(await video.evaluate((element: HTMLVideoElement) => element.paused))
    || await page.getByRole('button', { name: 'Play film' }).isVisible(),
  ).toBe(true)
})

test('reduced motion starts the film on entry and Skip preserves progress', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?skip3d=1')
  await seed(page, rewardState())
  const video = page.getByLabel('Model FLY film')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.1)
  await expect(page.getByText(/Your crew loves you/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Skip film and read tribute' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
  await expect(page.getByText('Bonus access', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Replay film' })).toBeVisible()
  expect(await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as GameState
    return { phase: saved.phase, rewardUnlocked: saved.rewardUnlocked, completed: saved.completedPuzzles }
  }, STORAGE_KEY)).toEqual({ phase: 'reward', rewardUnlocked: true, completed: ['dc9', 'locker', 'airbus'] })

  await page.reload()
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.1)
  await expect(page.getByText('Bonus access', { exact: true })).toHaveCount(0)
})

test('failed film loading offers retry and a safe route to the tribute', async ({ page }) => {
  test.setTimeout(45_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let fail = true
  let requests = 0
  await page.route('**/media/tesla-flight-mode-final.mp4', (route) => {
    requests += 1
    return fail ? route.fulfill({ status: 503, body: 'offline' }) : route.continue()
  })
  await page.goto('/')
  await seed(page, rewardState())
  const video = page.getByLabel('Model FLY film')
  await expect(video).toHaveAttribute('src', /media\/tesla-flight-mode-final\.mp4$/)
  await video.evaluate((element: HTMLVideoElement) => element.load())
  await expect(page.getByRole('alert')).toContainText('Your completed journey is safe.', { timeout: 20_000 })
  const requestsBeforeRetry = requests
  await page.getByRole('button', { name: 'Retry film' }).click()
  await expect.poll(() => requests).toBeGreaterThan(requestsBeforeRetry)
  await expect(page.getByRole('alert')).toContainText('Your completed journey is safe.')
  fail = false
  await page.evaluate(() => document.querySelector<HTMLButtonElement>('.reward-film-error button')?.click())
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration), { timeout: 20_000 }).toBeGreaterThan(85)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Skip film and read tribute' }).click()
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
})

test('film and controls fit desktop, tablet and phone widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await seed(page, rewardState())
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(page.getByLabel('Model FLY film')).toBeVisible()
    const videoSize = await page.getByLabel('Model FLY film').evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return { width: bounds.width, height: bounds.height, viewportWidth: innerWidth, viewportHeight: innerHeight }
    })
    expect(videoSize.width).toBeGreaterThanOrEqual(videoSize.viewportWidth - 1)
    expect(videoSize.height).toBeGreaterThanOrEqual(videoSize.viewportHeight - 1)
    await expect.poll(() => page.getByLabel('Model FLY film').evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.1)
    await expect(page.getByRole('button', { name: 'Skip film and read tribute' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    await captureEvidence(page, `${viewport.width}-direct-tesla-film`)
  }
})

test('the authored movie plays with native controls and ends at the family tribute', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await seed(page, rewardState())
  const video = page.getByLabel('Model FLY film')
  await expect(video).toHaveAttribute('controls', '')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration), { timeout: 30_000 }).toBeGreaterThan(85)
  await video.evaluate((element: HTMLVideoElement) => { element.muted = true })
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), { timeout: 15_000 }).toBeGreaterThan(0.1)
  await video.evaluate((element: HTMLVideoElement) => { element.currentTime = element.duration - 0.2 })
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
  await page.getByRole('button', { name: 'Replay film' }).click()
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), { timeout: 15_000 }).toBeLessThan(5)
})
