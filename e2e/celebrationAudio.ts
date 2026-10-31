import { expect, type Page } from '@playwright/test'

/**
 * The milestone celebration cheer, read off the live element.
 *
 * Returns null when no element is mounted, which is what a muted card looks like: the
 * silenced game never fetches the file at all.
 */
export function sampleCelebrationAudio(page: Page) {
  return page.evaluate(() => {
    const audio = document.querySelector<HTMLAudioElement>('audio[src*="key-celebration"]')
    if (!audio) return null
    return {
      src: audio.src,
      paused: audio.paused,
      volume: audio.volume,
      currentTime: audio.currentTime,
      duration: Number.isFinite(audio.duration) ? audio.duration : null,
    }
  })
}

/**
 * The Captain's Key and locker cards play the same ten-second cheer at the same level.
 *
 * "play() was called" is not proof of playback — an earlier version of this check passed
 * while the sound was inaudible — so this asserts the element is really running: not paused,
 * and its clock actually advancing.
 *
 * Reach the card by clicking, not by seeding it into view and reloading: Chromium blocks
 * playback until the document has been interacted with, exactly as a real browser does, so a
 * reload-seeded card is silent for reasons that have nothing to do with the feature.
 */
export async function expectCelebrationCheerPlaying(page: Page): Promise<void> {
  await expect.poll(async () => (await sampleCelebrationAudio(page))?.paused, { timeout: 10_000 }).toBe(false)
  const first = await sampleCelebrationAudio(page)
  expect(first?.src).toContain('/audio/key-celebration.mp3')
  expect(first?.volume).toBeGreaterThan(0)
  expect(first?.volume).toBeLessThan(1)

  // Playing, not merely started: the clock has to move, and the file has to be the 10s cut.
  await page.waitForTimeout(800)
  const second = await sampleCelebrationAudio(page)
  expect(second?.currentTime ?? 0).toBeGreaterThan((first?.currentTime ?? 0) + 0.3)
  expect(second?.duration ?? 0).toBeGreaterThan(9.5)
  expect(second?.duration ?? 0).toBeLessThan(10.5)
}

/** The completed Airbus card speaks with Heart instead of playing the earlier cheer. */
export async function expectOptimusGreetingPlaying(page: Page): Promise<void> {
  const greeting = page.getByLabel('Optimus greeting')
  await expect.poll(() => greeting.evaluate((audio: HTMLAudioElement) => audio.paused), { timeout: 10_000 }).toBe(false)
  const first = await greeting.evaluate((audio: HTMLAudioElement) => ({
    src: audio.currentSrc,
    time: audio.currentTime,
    duration: audio.duration,
  }))
  expect(first.src).toContain('/audio/optimus-congratulations-heart.mp3')
  await page.waitForTimeout(700)
  const second = await greeting.evaluate((audio: HTMLAudioElement) => audio.currentTime)
  expect(second).toBeGreaterThan(first.time + 0.3)
  expect(first.duration).toBeGreaterThan(5.5)
  expect(first.duration).toBeLessThan(6)
}
