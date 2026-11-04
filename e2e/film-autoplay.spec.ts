import { expect, test, type Page } from '@playwright/test'
import { createCompletedAirbusState } from './journeyStates'
import { STORAGE_KEY } from '../src/game/storage'

async function revealFilm(page: Page) {
  await page.goto('/?skip3d=1')
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: STORAGE_KEY, value: createCompletedAirbusState(),
  })
  await page.reload()
  await page.getByRole('button', { name: 'Reveal reward', exact: true }).click()
  return page.getByLabel('Model FLY film')
}

for (const reduced of [false, true]) {
  test(`Model FLY starts immediately after accessible reward entry, reduced motion ${reduced}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
    const video = await revealFilm(page)
    await expect(video).toHaveAttribute('autoplay', '')
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.2)
    await expect(page.getByRole('button', { name: 'Play film', exact: true })).toHaveCount(0)
    expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(false)
  })
}

test('blocked audible autoplay starts the picture muted and sound can be enabled without restarting', async ({ page }) => {
  await page.addInitScript(() => {
    // Keep native autoplay from bypassing this simulated play() refusal.
    // The entry cases above exercise native autoplay without this adapter.
    const source = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src')!
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      ...source,
      set(value: string) {
        if (this instanceof HTMLVideoElement) this.autoplay = false
        source.set!.call(this, value)
      },
    })
    const original = HTMLMediaElement.prototype.play
    let soundAllowed = false
    document.addEventListener('click', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('button')?.textContent === 'Turn film sound on') soundAllowed = true
    }, true)
    HTMLMediaElement.prototype.play = function () {
      // StrictMode may retry entry, so deny every audible attempt until the sound action.
      if (this instanceof HTMLVideoElement && !this.muted && !soundAllowed) {
        return Promise.reject(new DOMException('Audible autoplay blocked', 'NotAllowedError'))
      }
      return original.call(this)
    }
  })
  const video = await revealFilm(page)
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.2)
  expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(true)
  const before = await video.evaluate((element: HTMLVideoElement) => element.currentTime)
  await page.getByRole('button', { name: 'Turn film sound on', exact: true }).click()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(false)
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(before)
  await expect(page.getByRole('button', { name: 'Play film', exact: true })).toHaveCount(0)
})
