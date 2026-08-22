/**
 * Verified intro renderer.
 *
 * Usage:
 *   npm run build && npx vite preview --host 127.0.0.1 --port 4178 &
 *   node tools/intro/render-verified.mjs
 *   ffmpeg -y -framerate 30 -i .cache/intro-render-frames/frame-%05d.png \
 *     -i public/audio/intro-audio-53s.mp3 -c:v libx264 -pix_fmt yuv420p -crf 18 \
 *     -preset slow -c:a aac -b:a 192k -shortest preview-renders/<name>.mp4
 *
 * Then verify the DELIVERED file, not just the capture: extract frames from the
 * mp4 at checkpoints across every scene and diff them against the captured PNGs
 * of the same index. Measured 2026-08-21 over 20 checkpoints: worst mean
 * absolute difference 2.44, which is h264 quantisation and nothing else.
 *
 * Chromium's MP3 decoder reproducibly dies (MEDIA_ERR_DECODE) when the track is
 * scrubbed across ~6.7 s, which silently drops the runtime into its wall-clock
 * fallback: the story then plays in ~14 s and freezes on the title, and the
 * render lies about the edit. So the media element is puppeted — currentTime is
 * a plain variable, play() resolves — and every single frame asserts the canvas
 * reports the time we asked for and that audio never entered its failed state.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.env.RENDER_BASE ?? 'http://127.0.0.1:4178'
const OUT = process.env.RENDER_OUT ?? '.cache/intro-render-frames'
const DURATION = 53.04
const FPS = 30
const RECYCLE_EVERY = 400
const TOTAL = Math.round(DURATION * FPS)

const PUPPET = () => {
  const store = new WeakMap()
  Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
    configurable: true,
    get() { return store.get(this) ?? 0 },
    set(value) { store.set(this, value) },
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'duration', { configurable: true, get: () => 53.04 })
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', { configurable: true, get: () => false })
  HTMLMediaElement.prototype.play = function play() { return Promise.resolve() }
  HTMLMediaElement.prototype.pause = function pause() {}
  Object.defineProperty(window, '__introSeek', {
    configurable: true,
    value: (seconds) => {
      for (const media of document.querySelectorAll('audio')) {
        media.currentTime = seconds
        media.dispatchEvent(new Event('timeupdate'))
      }
    },
  })
}

async function openIntro(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.route('**/models/*.glb*', (route) => route.abort())
  const page = await context.newPage()
  await page.addInitScript(PUPPET)
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Start Game' }).click()
  await page.locator('.game-intro__stage').waitFor()
  return { context, page }
}

/** Step the clock over every scene so each plate is decoded before we record;
 * a plate arriving late records a black stage, which is not what the code does. */
async function warm(page) {
  for (const time of [0, 3, 7, 9, 12, 15, 19, 22, 25, 28, 33, 36, 40, 44, 48, 51]) {
    await page.evaluate((value) => window.__introSeek(value), time)
    await page.waitForTimeout(120)
  }
}

async function capture(page, index) {
  const time = Math.min(index / FPS, DURATION - 0.0001)
  await page.evaluate((value) => window.__introSeek(value), time)
  await page.waitForFunction((expected) => {
    const stage = document.querySelector('.game-intro__stage')
    const section = document.querySelector('[data-audio-failed]')
    if (!stage || !section) return false
    if (section.getAttribute('data-audio-failed') !== 'false') throw new Error('audio failed')
    return Math.abs(Number(stage.getAttribute('data-time')) - expected) < 0.002
  }, time, { timeout: 10_000 })
  await page.locator('.game-intro__stage').screenshot({
    path: `${OUT}/frame-${String(index).padStart(5, '0')}.png`,
  })
  return time
}

const started = Date.now()
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
let session = await openIntro(browser)
await warm(session.page)
const log = []
for (let index = 0; index < TOTAL; index += 1) {
  if (index > 0 && index % RECYCLE_EVERY === 0) {
    await session.context.close()
    session = await openIntro(browser)
    await warm(session.page)
    log.push(`-- session recycled before frame ${index}`)
  }
  const time = await capture(session.page, index)
  if (index % 150 === 0) {
    const scene = await session.page.locator('.game-intro__stage').getAttribute('data-scene')
    log.push(`frame ${index} t=${time.toFixed(3)} scene=${scene}`)
    process.stdout.write(`${index}/${TOTAL} ${scene}\n`)
  }
}
await session.context.close()
await browser.close()
writeFileSync(`${OUT}/capture-log.txt`, `${log.join('\n')}\nframes ${TOTAL} in ${((Date.now() - started) / 1000).toFixed(0)}s\n`)
console.log(`captured ${TOTAL} frames in ${((Date.now() - started) / 1000).toFixed(0)}s`)
