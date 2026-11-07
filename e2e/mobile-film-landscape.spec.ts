import { expect, test, type Page } from '@playwright/test'

import { STORAGE_KEY } from '../src/game/storage'
import { createCompletedAirbusState } from './journeyStates'

async function revealFilm(page: Page) {
  await page.goto('/?skip3d=1')
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: STORAGE_KEY, value: createCompletedAirbusState(),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Reveal reward', exact: true }).click()
  const video = page.getByLabel('Model FLY film')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.2)
  return video
}

for (const viewport of [
  { width: 375, height: 812 },
  { width: 768, height: 900 },
  { width: 1440, height: 900 },
  { width: 667, height: 375 },
  { width: 812, height: 375 },
  { width: 932, height: 430 },
]) {
  test(`film actions leave the picture clear at ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    await page.setViewportSize(viewport)
    const video = await revealFilm(page)
    await expect(page).toHaveTitle("The Captain's Key")
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
    await expect(video).toHaveAttribute('controls', '')
    expect(await video.evaluate((element: HTMLVideoElement) => ({ muted: element.muted, paused: element.paused }))).toEqual({ muted: false, paused: false })
    const layout = await page.locator('.reward-cinema').evaluate((cinema) => {
      const picture = cinema.querySelector('video')!.getBoundingClientRect()
      const toolbar = cinema.querySelector('.reward-film-toolbar')!.getBoundingClientRect()
      return { pictureBottom: picture.bottom, toolbarTop: toolbar.top, toolbarBottom: toolbar.bottom, width: document.documentElement.scrollWidth }
    })
    expect(layout.pictureBottom).toBeLessThanOrEqual(layout.toolbarTop + 1)
    expect(layout.toolbarBottom).toBeLessThanOrEqual(viewport.height + 1)
    expect(layout.width).toBeLessThanOrEqual(viewport.width)
    for (const name of ['Watch landscape', 'Skip film and read tribute', 'Restart game']) {
      const button = page.getByRole('button', { name, exact: true })
      await expect(button).toBeInViewport()
      expect(await button.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return bounds.height >= 44 && element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
      })).toBe(true)
    }
    await expect(page.getByRole('button', { name: 'Watch landscape' })).toHaveAccessibleDescription(viewport.width > viewport.height ? 'Landscape view.' : 'Rotate your phone for a wider view.')
    await page.screenshot({ path: testInfo.outputPath('film.png') })
    expect(errors).toEqual([])
  })
}

test('manual phone rotation preserves the same advancing film and sound choice', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const video = await revealFilm(page)
  await video.evaluate((element: HTMLVideoElement) => {
    element.dataset.rotationProof = 'same-film'
    element.currentTime = 20
    element.muted = true
    element.volume = 0.4
  })
  for (const viewport of [{ width: 812, height: 375 }, { width: 375, height: 812 }]) {
    const before = await video.evaluate((element: HTMLVideoElement) => element.currentTime)
    await page.setViewportSize(viewport)
    await expect(video).toHaveAttribute('data-rotation-proof', 'same-film')
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(before)
    expect(await video.evaluate((element: HTMLVideoElement) => ({ muted: element.muted, volume: element.volume }))).toEqual({ muted: true, volume: 0.4 })
  }
  const beforeSound = await video.evaluate((element: HTMLVideoElement) => element.currentTime)
  await page.getByRole('button', { name: 'Turn film sound on', exact: true }).click()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(beforeSound)
  expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(false)
  await page.getByRole('button', { name: 'Skip film and read tribute' }).click()
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
  await page.getByRole('button', { name: 'Replay film' }).click()
  await expect(video).toHaveAttribute('data-rotation-proof', 'same-film')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeLessThan(5)
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.2)
})

test('rotation guidance and the button description follow the actual viewport orientation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await revealFilm(page)
  const landscape = page.getByRole('button', { name: 'Watch landscape' })
  await expect(landscape).toHaveAccessibleDescription('Rotate your phone for a wider view.')
  await page.setViewportSize({ width: 812, height: 375 })
  await expect(landscape).toHaveAccessibleDescription('Landscape view.')
  await expect(page.getByText('Landscape view.', { exact: true })).toBeVisible()
  await expect(page.getByText('Rotate your phone for a wider view.', { exact: true })).not.toBeVisible()
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(landscape).toHaveAccessibleDescription('Rotate your phone for a wider view.')
})

test('keyboard landscape action owns fullscreen and releases its lock before the tribute', async ({ page }) => {
  await page.setViewportSize({ width: 812, height: 375 })
  const video = await revealFilm(page)
  await page.evaluate(async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    const events: string[] = []
    Object.assign(window, { filmOrientationEvents: events })
    Object.defineProperty(screen.orientation, 'lock', { configurable: true, value: async (orientation: string) => { events.push(orientation) } })
    Object.defineProperty(screen.orientation, 'unlock', { configurable: true, value: () => { events.push('unlock') } })
  })
  const before = await video.evaluate((element: HTMLVideoElement) => element.currentTime)
  const landscape = page.getByRole('button', { name: 'Watch landscape' })
  await landscape.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.className)).toBe('reward-cinema')
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'filmOrientationEvents'))).toEqual(['landscape'])
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(before)
  expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(false)
  await page.getByRole('button', { name: 'Skip film and read tribute' }).click()
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false)
  expect(await page.evaluate(() => Reflect.get(window, 'filmOrientationEvents'))).toEqual(['landscape', 'unlock'])
})

for (const mode of ['missing', 'rejected'] as const) {
  test(`${mode} orientation support keeps the film playing and explains manual rotation`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 375, height: 812 })
    const video = await revealFilm(page)
    await page.evaluate((support) => {
      Object.defineProperty(screen.orientation, 'lock', {
        configurable: true,
        value: support === 'missing' ? undefined : () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError')),
      })
    }, mode)
    const before = await video.evaluate((element: HTMLVideoElement) => element.currentTime)
    await page.getByRole('button', { name: 'Watch landscape' }).click()
    await expect(page.getByRole('status')).toContainText('turn off rotation lock if needed')
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(before)
    expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(false)
    await page.getByRole('button', { name: 'Skip film and read tribute' }).click()
    await expect(page.getByRole('button', { name: 'Replay film' })).toBeVisible()
  })
}

for (const generic of ['missing', 'disabled'] as const) {
  test(`Safari native fullscreen fallback begins in the click with generic fullscreen ${generic}`, async ({ page }) => {
    const video = await revealFilm(page)
    await page.evaluate(async (support) => {
      if (document.fullscreenElement) await document.exitFullscreen()
      if (support === 'missing') Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: undefined })
      else Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false })
      Object.defineProperty(HTMLVideoElement.prototype, 'webkitEnterFullscreen', { configurable: true, value: function (this: HTMLVideoElement) {
        this.dataset.nativeFullscreen = String(navigator.userActivation.isActive)
      } })
    }, generic)
    const before = await video.evaluate((element: HTMLVideoElement) => element.currentTime)
    await page.getByRole('button', { name: 'Watch landscape' }).click()
    await expect(video).toHaveAttribute('data-native-fullscreen', 'true')
    await expect(page.getByRole('status')).toContainText('Rotate your phone')
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(before)
  })
}

test('a delayed orientation acquisition is released after Skip and cannot lock the replay', async ({ page }) => {
  const video = await revealFilm(page)
  await page.evaluate(() => {
    const events: string[] = []
    Object.assign(window, { filmOrientationEvents: events })
    Object.defineProperty(screen.orientation, 'lock', { configurable: true, value: () => {
      events.push('requested')
      return new Promise<void>((resolve) => { Object.assign(window, { resolveFilmOrientation: resolve }) })
    } })
    Object.defineProperty(screen.orientation, 'unlock', { configurable: true, value: () => { events.push('unlock') } })
  })
  await page.getByRole('button', { name: 'Watch landscape' }).click()
  await expect(page.getByRole('button', { name: 'Opening landscape…' })).toBeDisabled()
  await page.getByRole('button', { name: 'Skip film and read tribute' }).click()
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
  await page.evaluate(() => Reflect.get(window, 'resolveFilmOrientation')())
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'filmOrientationEvents'))).toEqual(['requested', 'unlock'])
  await page.getByRole('button', { name: 'Replay film' }).click()
  await expect(page.getByRole('button', { name: 'Watch landscape' })).toBeEnabled()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.2)
  expect(await page.evaluate(() => Reflect.get(window, 'filmOrientationEvents'))).toEqual(['requested', 'unlock'])
})
