import { expect, test, type Page } from '@playwright/test'
import type { GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'
import { createDc9State } from './journeyStates'

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

async function openDc9(page: Page) {
  await page.addInitScript(({ key, saved }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(saved))
  }, { key: STORAGE_KEY, saved: { ...createDc9State(), cockpitOrientationSeen: { dc9: true, airbus: true } } as GameState })
  await page.goto('/?skip3d=1')
}

/** iPhone browsers report page fullscreen as disabled; only video can go fullscreen. */
async function behaveLikeIphoneBrowser(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false, configurable: true })
    Object.defineProperty(Document.prototype, 'webkitFullscreenEnabled', { get: () => false, configurable: true })
  })
}

test('on an iPhone browser the fullscreen button explains Home Screen mode instead of doing nothing', async ({ page }) => {
  await behaveLikeIphoneBrowser(page)
  await openDc9(page)
  const fullscreen = page.getByRole('button', { name: 'Toggle fullscreen' })
  await expect(fullscreen).toBeVisible()
  await fullscreen.tap()
  const help = page.getByRole('dialog', { name: 'Full screen on iPhone' })
  await expect(help).toBeVisible()
  await expect(help).toContainText('Add to Home Screen')
  await expect(help).toContainText('keeps its own saved progress')
  await expect(help.getByRole('button', { name: 'Got it' })).toBeFocused()
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull()
  await help.getByRole('button', { name: 'Got it' }).tap()
  await expect(help).toHaveCount(0)
  await expect(fullscreen).toBeFocused()

  await fullscreen.tap()
  await expect(help).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(help).toHaveCount(0)
})

test('opened from a Home Screen icon, the fullscreen button is hidden', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window)
    window.matchMedia = (query: string) => query === '(display-mode: standalone)'
      ? { ...original(query), matches: true, media: query }
      : original(query)
  })
  await openDc9(page)
  await expect(page.getByRole('button', { name: 'Open viewer help' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Toggle fullscreen' })).toHaveCount(0)
})

test('the page is set up to open as a Home Screen app', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'black')
  const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json()) as { short_name: string; display: string; start_url: string }
  expect(manifest).toMatchObject({ short_name: "Captain's Key", display: 'fullscreen', start_url: '/' })
})
