import { expect, test } from '@playwright/test'
import { STORAGE_KEY } from '../src/game/storage'
import { createDc9State } from './journeyStates'

test('entry waits silently, then starts unmuted audio inside the Begin gesture', async ({ page }) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play
    const requests: { active: boolean; muted: boolean }[] = []
    Object.assign(window, { introPlayRequests: requests })
    HTMLMediaElement.prototype.play = function () {
      if (this.getAttribute('src')?.includes('intro-audio')) {
        requests.push({ active: navigator.userActivation.isActive, muted: this.muted })
      }
      return play.call(this)
    }
  })
  await page.goto('/')
  const entry = page.getByRole('region', { name: 'Game entry' })
  await expect(entry).toBeVisible()
  const begin = entry.getByRole('button', { name: 'Click to begin', exact: true })
  await expect(begin).toBeEnabled({ timeout: 60_000 })
  const audio = page.locator('audio')
  await expect(audio).toHaveJSProperty('paused', true)
  await expect(audio).toHaveJSProperty('currentTime', 0)
  expect(await page.evaluate(() => Reflect.get(window, 'introPlayRequests'))).toEqual([])
  await expect(page.getByRole('region', { name: 'Game intro' })).toHaveCount(0)

  await begin.click()
  await expect(page.getByRole('region', { name: 'Game intro' })).toBeVisible()
  await expect.poll(() => audio.evaluate((el: HTMLAudioElement) => el.currentTime)).toBeGreaterThan(0.2)
  await expect(audio).toHaveJSProperty('muted', false)
  expect(await page.evaluate(() => Reflect.get(window, 'introPlayRequests'))).toEqual([
    { active: true, muted: false },
  ])
  await expect(entry).toHaveCount(0)

  await page.reload()
  await expect(entry).toBeVisible()
  await expect(audio).toHaveJSProperty('paused', true)
})

test('Begin works with Enter and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const begin = page.getByRole('button', { name: 'Click to begin', exact: true })
  await expect(begin).toBeEnabled({ timeout: 60_000 })
  await begin.focus()
  await begin.press('Enter')
  await expect(page.getByRole('region', { name: 'Game intro' })).toHaveAttribute('data-reduced-motion', 'true')
  await expect(page.locator('audio')).toHaveJSProperty('muted', false)
  await expect.poll(() => page.locator('audio').evaluate((el: HTMLAudioElement) => el.currentTime)).toBeGreaterThan(0.2)
})

test('opening-art failure keeps Begin disabled and recovers without starting sound', async ({ page }) => {
  const pattern = '**/images/intro/tmb2/logo/tmb2-ident-base.png'
  await page.route(pattern, route => route.abort())
  await page.goto('/')
  const entry = page.getByRole('region', { name: 'Game entry' })
  await expect(entry.getByRole('alert')).toContainText('logo-base')
  await expect(entry.getByRole('button', { name: 'Click to begin', exact: true })).toBeDisabled()
  await expect(page.locator('audio')).toHaveJSProperty('paused', true)
  await page.unroute(pattern)
  await entry.getByRole('button', { name: 'Retry cinematic assets' }).click()
  await expect(entry.getByRole('button', { name: 'Click to begin', exact: true })).toBeEnabled({ timeout: 60_000 })
  await expect(page.locator('audio')).toHaveJSProperty('paused', true)
})

test('a saved chapter resumes directly without the Begin page', async ({ page }) => {
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY,
    state: createDc9State(),
  })
  await page.goto('/?skip3d=1')
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Game entry' })).toHaveCount(0)
})

test('entry artwork and browser icon decode successfully', async ({ page }) => {
  await page.goto('/')
  const image = page.getByRole('img', { name: 'A DC-9 in a hangar through a glowing keyhole' })
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)
  for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await expect(image).toBeInViewport({ ratio: 1 })
    await expect(page.getByRole('heading', { name: 'The Captain’s Key' })).toBeInViewport({ ratio: 1 })
    await expect(page.getByRole('button', { name: 'Click to begin', exact: true })).toBeInViewport({ ratio: 1 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(false)
  }
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', '/favicon-arcade-32.png')
  const icon = await page.request.get('/favicon-arcade-32.png')
  expect(icon.ok()).toBe(true)
  expect(icon.headers()['content-type']).toContain('image/png')
})

test('unavailable entry fonts leave the title clear of the artwork', async ({ page }) => {
  await page.route('**/fonts/*.woff2', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Click to begin', exact: true })).toBeEnabled({ timeout: 60_000 })
  await page.evaluate(() => document.fonts.ready)
  for (const width of [901, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const overlap = await page.evaluate(() => {
      const word = document.querySelector('.game-entry h1 span:nth-child(2)')!
      const art = document.querySelector('.game-entry__art')!
      const range = document.createRange()
      range.selectNodeContents(word)
      return range.getBoundingClientRect().right > art.getBoundingClientRect().left
    })
    expect(overlap, `fallback title overlaps the artwork at ${width}px`).toBe(false)
    await expect(page.getByRole('button', { name: 'Click to begin', exact: true })).toBeInViewport({ ratio: 1 })
  }
})
