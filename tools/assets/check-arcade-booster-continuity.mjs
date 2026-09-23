/** Native paused ticks prove eight poses actually draw in both Booster facings. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = process.env.ARCADE_EVIDENCE_DIR ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, "/") : new URL('../../preview-renders/mars-arcade/outcomes-v1/regressions/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
try {
  for (const side of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } })
    page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(() => {
      window.frameDraws = []
      const original = CanvasRenderingContext2D.prototype.drawImage
      CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
        if (image instanceof HTMLImageElement) window.frameDraws.push(image.src)
        return original.call(this, image, ...args)
      }
    })
    await page.clock.install()
    await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
    await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('51/51 sprites ready'))
    const command = async name => {
      await page.locator('[data-command="' + name + '"]').click()
      await page.clock.runFor(20)
    }
    await command('mirror'); await command('KeyT'); await command('KeyH')
    await page.clock.runFor(1700)
    await command('Space')
    await page.getByRole('button', { name: 'P' + side + ' heavy', exact: true }).click()
    const poses = new Map([
      ['heavy startup', 'heavy-startup/heavy-startup-00.png'],
      ['heavy startup — swing', 'heavy-swing/heavy-swing-00.png'],
      ['heavy startup — drive', 'heavy-drive/heavy-drive-00.png'],
      ['heavy active', 'heavy-active/heavy-active-00.png'],
      ['heavy recovery — retract', 'heavy-retract/heavy-retract-00.png'],
      ['heavy recovery', 'heavy-recovery/heavy-recovery-00.png'],
      ['heavy recovery — settle', 'heavy-settle/heavy-settle-00.png'],
      ['heavy recovery — guard', 'normalised-sleek-ready/block/block-00.png'],
    ])
    const captured = new Set()
    for (let frame = 0; frame < 36; frame++) {
      await page.evaluate(() => { window.frameDraws = [] })
      await command('KeyN')
      const state = await page.locator('#readout').innerText()
      assert.match(state, /PAUSED/)
      const label = state.split('\n').map(s => s.trim()).find(s => s.startsWith('artwork    heavy'))?.slice('artwork    '.length)
      if (poses.has(label) && !captured.has(label)) {
        const actualDraws = await page.evaluate(() => window.frameDraws)
        assert.ok(actualDraws.some(src => src.includes('/booster/') && src.endsWith(poses.get(label))), 'pose must draw in this exact paused tick')
        const name = ['wind-up', 'swing', 'drive', 'contact', 'retract', 'follow-through', 'settle', 'guard'][[...poses.keys()].indexOf(label)]
        await page.locator('canvas').screenshot({ path: out + 'booster-' + side + '-' + name + '.png' })
        assert.equal(await page.locator('#readout').innerText(), state, 'screenshot must not advance simulation')
        captured.add(label)
      }
    }
    assert.equal(captured.size, 8)
    assert.doesNotMatch(await page.locator('#readout').innerText(), /activity   attack/)
    console.log('PASS P' + side + ' Booster: eight distinct canvas draws in frozen native ticks; idle return')
    await page.close()
  }
  assert.deepEqual(errors, [])
} finally { await browser.close() }
