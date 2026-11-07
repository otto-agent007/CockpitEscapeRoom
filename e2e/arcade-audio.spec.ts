import { expect, test, type FrameLocator, type Page } from '@playwright/test'
import { holdForArcade, openArcadeMenu, resumeArcade } from './arcadeFlow'

interface AudioProbe { decoded: string[]; starts: string[]; live: number; stops: number }
declare global { interface Window { __arcadeAudio: AudioProbe } }

async function instrument(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('cockpit-escape-room-mars-arcade-unlock', '{"version":1,"completedOnce":true}')
    const probe: AudioProbe = { decoded: [], starts: [], live: 0, stops: 0 }
    window.__arcadeAudio = probe
    const dataUrls = new WeakMap<ArrayBuffer, string>(), bufferUrls = new WeakMap<AudioBuffer, string>()
    const live = new Set<AudioBufferSourceNode>()
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      const url = String(args[0])
      if (url.includes('/audio/mars-arcade-v1/')) {
        const read = response.arrayBuffer.bind(response)
        response.arrayBuffer = async () => { const data = await read(); dataUrls.set(data, url); return data }
      }
      return response
    }
    const decode = BaseAudioContext.prototype.decodeAudioData
    BaseAudioContext.prototype.decodeAudioData = function(data, success, failure) {
      const promise = Reflect.apply(decode, this, [data, success, failure]) as Promise<AudioBuffer>
      void promise.then(buffer => {
        const url = dataUrls.get(data)
        if (url) { bufferUrls.set(buffer, url); probe.decoded.push(url) }
      }).catch(() => {})
      return promise
    }
    const start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop
    AudioBufferSourceNode.prototype.start = function(...args) {
      const url = this.buffer && bufferUrls.get(this.buffer)
      if (url) {
        probe.starts.push(url)
        live.add(this); probe.live = live.size
        this.addEventListener('ended', () => { live.delete(this); probe.live = live.size }, { once: true })
      }
      return Reflect.apply(start, this, args)
    }
    AudioBufferSourceNode.prototype.stop = function(...args) {
      if (live.delete(this)) { probe.stops++; probe.live = live.size }
      return Reflect.apply(stop, this, args)
    }
  })
}
async function openArcade(page: Page) {
  await page.goto('/?skip3d=1')
  await expect(page.locator('.briefing-shell')).toBeVisible()
  await holdForArcade(page)
  const frame = page.frameLocator('iframe[title="Mars arcade"]')
  await expect(frame.getByRole('button', { name: 'Start fight', exact: true })).toBeEnabled()
  return frame
}
const probe = (frame: FrameLocator) => frame.locator('body').evaluate(() => ({ ...window.__arcadeAudio }))
const files = async (frame: FrameLocator) => (await probe(frame)).starts.map(url => url.split('/').at(-1)!)
const tick = async (frame: FrameLocator) => Number((await frame.locator('#readout').textContent())?.match(/frame (\d+)/)?.[1] ?? 0)
async function advance(frame: FrameLocator, count: number) {
  const before = await tick(frame)
  await expect.poll(() => tick(frame)).toBeGreaterThanOrEqual(before + count)
}
async function closeDistance(page: Page, frame: FrameLocator, count = 80) {
  await frame.locator('#stage').focus()
  await page.keyboard.down('d')
  await advance(frame, count)
  await page.keyboard.up('d')
}

test.beforeEach(async ({ page }) => instrument(page))

test('selected audio follows real combat, varies hits, mutes and survives reload', async ({ page }) => {
  test.setTimeout(60000)
  const requested: string[] = []
  page.on('request', request => { if (request.url().includes('/audio/mars-arcade-v1/')) requested.push(request.url()) })
  await page.goto('/?skip3d=1')
  await expect(page.locator('.briefing-shell')).toBeVisible()
  expect(requested).toEqual([])
  const frame = await openArcade(page)
  await expect.poll(async () => (await probe(frame)).decoded.length).toBe(20)
  expect((await probe(frame)).starts).toEqual([])
  await frame.getByRole('combobox', { name: 'Your fighter', exact: true }).selectOption('booster')
  await frame.getByRole('combobox', { name: 'Opponent', exact: true }).selectOption('captain')
  await frame.getByRole('button', { name: 'Start fight', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => files(frame)).toContain('round.wav')
  await openArcadeMenu(frame)
  await frame.getByText('Match options', { exact: true }).click()
  await frame.getByRole('button', { name: 'Switch CPU / two players' }).click()
  await resumeArcade(frame)
  await expect.poll(() => files(frame)).toContain('fight.wav')
  await closeDistance(page, frame)
  for (let index = 0; index < 7; index++) {
    await page.keyboard.press('j')
    await advance(frame, 24)
  }
  for (const name of ['jab-1.wav', 'jab-2.wav', 'jab-3.wav', 'combo.wav']) expect(await files(frame)).toContain(name)
  await page.keyboard.press('l')
  await expect.poll(() => files(frame)).toContain('laser.wav')
  await advance(frame, 35)
  await closeDistance(page, frame, 20)
  await page.keyboard.down('ArrowRight')
  await page.keyboard.press('j')
  await expect.poll(async () => (await files(frame)).some(file => file.startsWith('block-'))).toBe(true)
  await page.keyboard.up('ArrowRight')
  await advance(frame, 20)
  await openArcadeMenu(frame)
  await frame.getByRole('button', { name: 'Sound on', exact: true }).click()
  await expect(frame.getByRole('button', { name: 'Sound off', exact: true })).toBeVisible()
  await expect.poll(async () => (await probe(frame)).live).toBe(0)
  const mutedStarts = (await probe(frame)).starts.length
  await resumeArcade(frame)
  await frame.locator('#stage').focus()
  await page.keyboard.press('j')
  await advance(frame, 25)
  expect((await probe(frame)).starts).toHaveLength(mutedStarts)
  await frame.getByRole('button', { name: 'Pause', exact: true }).click()
  await openArcadeMenu(frame)
  await frame.getByRole('button', { name: 'Sound off', exact: true }).click()
  await expect.poll(async () => (await probe(frame)).live).toBe(0)
  await page.waitForTimeout(250)
  expect((await probe(frame)).starts).toHaveLength(mutedStarts)
  await frame.getByRole('button', { name: 'Change player / battlefield' }).click()
  await frame.getByRole('button', { name: 'Sound on', exact: true }).click()
  await page.reload()
  const reloaded = await openArcade(page)
  await expect(reloaded.getByRole('button', { name: 'Sound off', exact: true })).toBeVisible()
  await reloaded.getByRole('button', { name: 'Start fight', exact: true }).click()
  await advance(reloaded, 100)
  expect((await probe(reloaded)).starts).toEqual([])
  await openArcadeMenu(reloaded)
  await reloaded.getByRole('button', { name: 'Sound off', exact: true }).click()
  await resumeArcade(reloaded)
  await page.keyboard.press('r')
  await expect.poll(() => files(reloaded)).toContain('round.wav')
  await openArcadeMenu(reloaded)
  await reloaded.getByRole('button', { name: 'Return to game', exact: true }).click()
  await expect(page.locator('.briefing-shell')).toBeVisible()
})

test('paused decoding never releases old audio after it finishes loading', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/audio/mars-arcade-v1/*.wav', async route => { await gate; await route.continue().catch(() => {}) })
  try {
    const frame = await openArcade(page)
    await frame.getByRole('button', { name: 'Start fight', exact: true }).click()
    await frame.getByRole('button', { name: 'Pause', exact: true }).click()
    release()
    await expect.poll(async () => (await probe(frame)).decoded.length).toBe(20)
    expect((await probe(frame)).starts).toEqual([])
    await frame.getByRole('button', { name: 'Resume', exact: true }).click()
    await page.waitForTimeout(200)
    expect(await files(frame)).not.toContain('round.wav')
    await openArcadeMenu(frame)
    await frame.getByRole('button', { name: 'Change player / battlefield' }).click()
    await expect.poll(async () => (await probe(frame)).live).toBe(0)
  } finally { release() }
})

test('unavailable recordings allow play and recover through native Retry sound', async ({ page }) => {
  let failed = true
  await page.route('**/audio/mars-arcade-v1/*.wav', route => failed ? route.fulfill({ status: 503, body: 'offline' }) : route.continue())
  const frame = await openArcade(page)
  await frame.getByRole('button', { name: 'Start fight', exact: true }).click()
  await advance(frame, 100)
  await expect(frame.locator('#arcade-sound-feedback')).toContainText('You can keep playing.')
  await openArcadeMenu(frame)
  await expect(frame.getByRole('button', { name: 'Retry sound', exact: true })).toBeVisible()
  failed = false
  await frame.getByRole('button', { name: 'Retry sound', exact: true }).click()
  await expect.poll(async () => (await probe(frame)).decoded.length).toBe(20)
  await expect(frame.getByRole('button', { name: 'Retry sound', exact: true })).toBeHidden()
  await resumeArcade(frame)
  await page.keyboard.press('r')
  await expect.poll(() => files(frame)).toContain('round.wav')
})

test('missing Web Audio leaves combat and return usable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { value: undefined })
    Object.defineProperty(window, 'webkitAudioContext', { value: undefined })
  })
  const frame = await openArcade(page)
  await frame.getByRole('button', { name: 'Start fight', exact: true }).click()
  await expect(frame.locator('#arcade-sound-feedback')).toContainText('Sound is unavailable.')
  await advance(frame, 100)
  await openArcadeMenu(frame)
  await frame.getByRole('button', { name: 'Return to game', exact: true }).click()
  await expect(page.locator('.briefing-shell')).toBeVisible()
})
