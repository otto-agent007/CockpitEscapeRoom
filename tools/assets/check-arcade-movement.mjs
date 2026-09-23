/** Native-control proof of movement art; uses the running dev harness on5317. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const base = process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html'
const out = process.env.ARCADE_EVIDENCE_DIR ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, "/") : new URL('../../preview-renders/mars-arcade/outcomes-v1/regressions/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
try {
  for (const reduced of [false, true]) for (const mirrored of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
    page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(() => {
      window.drawnSprites = []
      const original = CanvasRenderingContext2D.prototype.drawImage
      CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
        if (image instanceof HTMLImageElement && !window.drawnSprites.includes(image.src)) window.drawnSprites.push(image.src)
        return original.call(this, image, ...args)
      }
    })
    await page.clock.install()
    await page.goto(base)
    await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('61/61 sprites ready'))
    const tick = ms => page.clock.runFor(ms)
    const command = async code => { await page.locator(`[data-command="${code}"]`).click(); await tick(20) }
    const read = () => page.locator('#readout').innerText()
    await command('KeyT')
    if (mirrored) {
      await page.locator('[data-fighter="0"]').selectOption('oracle')
      await page.locator('[data-fighter="1"]').selectOption('booster')
    }
    await tick(1700)
    await command('Space')
    assert.match(await read(), /PAUSED/)
    const walkKey = mirrored ? 'KeyD' : 'ArrowLeft'
    await page.keyboard.down(walkKey)
    for (let i = 0; i < 14; i++) await command('KeyN')
    await page.keyboard.up(walkKey)
    assert.match(await read(), /forward shuffle/)
    const walking = await page.evaluate(() => window.drawnSprites)
    // Four-drawing cycles since 2026-09-23: which two a 14-frame walk shows depends on
    // the frame counter, so require the cycle to have animated (two distinct drawings).
    const forward = new Set(walking.filter(s => s.includes('/normalised-walk-ready/walk-forward/walk-forward-')))
    assert.ok(forward.size >= 2, `forward walk drew ${forward.size} distinct drawing(s)`)
    await page.locator('canvas').screenshot({ path: `${out}forward-${mirrored}-${reduced}.png` })
    await command('KeyN')
    await page.getByRole('button', { name: 'P1 jump', exact: true }).click()
    await page.getByRole('button', { name: 'P2 jump', exact: true }).click()
    const captured = new Set()
    for (let i = 0; i < 40; i++) {
      await command('KeyN')
      const state = await read()
      for (const phase of ['rising', 'apex', 'falling']) {
        if (!captured.has(phase) && state.includes(`jump ${phase}`)) {
          captured.add(phase)
          await page.locator('canvas').screenshot({ path: `${out}jump-${phase}-${mirrored}-${reduced}.png` })
          if (phase === 'apex' && !mirrored && !reduced) {
            for (const width of [375, 768, 1440]) {
              await page.setViewportSize({ width, height: 1100 })
              await tick(40)
              assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
              await page.screenshot({ path: `${out}jump-${width}.png`, fullPage: true })
            }
          }
        }
      }
    }
    assert.equal(captured.size, 3)
    assert.doesNotMatch(await read(), /activity   airborne/)
    const drawn = await page.evaluate(() => window.drawnSprites)
    for (const fighter of ['booster', 'oracle']) for (const n of ['00', '01', '02']) {
      assert.ok(drawn.some(s => s.includes(`/${fighter}/normalised-movement-ready/airborne/airborne-${n}.png`)))
    }
    console.log(`PASS real forward walk, both jumps and landing; mirrored=${mirrored}, reduced=${reduced}`)
    await page.close()
  }
  const missing = await browser.newPage()
  missing.on('pageerror', e => errors.push(e.message))
  await missing.route('**/normalised-movement-ready/airborne/airborne-01.png', r => r.abort())
  await missing.clock.install()
  await missing.goto(base)
  await missing.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('2 failed'))
  await missing.locator('[data-command="KeyT"]').click()
  await missing.clock.runFor(1700)
  await missing.getByRole('button', { name: 'P1 jump', exact: true }).click()
  await missing.getByRole('button', { name: 'P2 jump', exact: true }).click()
  await missing.clock.runFor(250)
  assert.match(await missing.locator('#asset-status').innerText(), /59\/61 sprites ready; 2 failed — box fallback/)
  await missing.screenshot({ path: `${out}missing-apex.png` })
  await missing.clock.runFor(1000)
  assert.doesNotMatch(await missing.locator('#readout').innerText(), /activity   airborne/)
  assert.deepEqual(errors, [])
  console.log('PASS missing apex sprites fall back and both jumps still land; no uncaught errors')
} finally {
  await browser.close()
}
