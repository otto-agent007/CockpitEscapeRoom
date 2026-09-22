/** Real native-input heavy key-pose proof; no game-state injection. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = new URL('../../preview-renders/mars-arcade/outcomes-v1/regressions/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
try {
  for (const reduced of [false, true]) for (const side of [0, 1]) for (const outcome of ['whiff', 'hit', 'blocked']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
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
    await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
    assert.match(await page.title(), /Mars arcade/)
    await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('38/38 sprites ready'))
    const tick = ms => page.clock.runFor(ms)
    const command = async code => { await page.locator('[data-command="' + code + '"]').click(); await tick(20) }
    const read = () => page.locator('#readout').innerText()
    await command('KeyT')
    await tick(1700)
    const away = side === 0 ? 'ArrowRight' : 'KeyA'
    const approach = side === 0 ? 'KeyD' : 'ArrowLeft'
    if (outcome === 'hit') {
      await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowLeft')
      await tick(700)
      await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowLeft')
    } else if (outcome === 'blocked') {
      await page.keyboard.down(away); await tick(1200); await page.keyboard.up(away)
      await page.keyboard.down(approach); await tick(3000); await page.keyboard.up(approach)
    }
    if (outcome !== 'whiff') {
      const gap = Number((await read()).match(/separation ([\d.]+)px/)?.[1])
      assert.ok(gap > 0 && gap <= 38, 'real approach must be inside both heavy reaches')
    }
    await command('Space')
    assert.match(await read(), /PAUSED/)
    if (outcome === 'blocked') await page.keyboard.down(away)
    await page.getByRole('button', { name: 'P' + (side + 1) + ' heavy', exact: true }).click()
    const captured = new Set()
    for (let frame = 0; frame < 45; frame++) {
      await command('KeyN')
      const state = await read()
      for (const phase of ['startup', 'active', 'recovery']) {
        if (!captured.has(phase) && state.includes('heavy ' + phase)) {
          captured.add(phase)
          if (!reduced) await page.locator('canvas').screenshot({ path: out + side + '-' + outcome + '-' + phase + '.png' })
          if (side === 1 && outcome === 'hit' && phase === 'active' && !reduced) {
            for (const width of [375, 768, 1440]) {
              await page.setViewportSize({ width, height: 1200 }); await tick(30)
              assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
              await page.screenshot({ path: out + 'heavy-' + width + '.png', fullPage: true })
            }
          }
        }
      }
    }
    if (outcome === 'blocked') await page.keyboard.up(away)
    assert.equal(captured.size, 3)
    assert.doesNotMatch(await read(), /activity   attack/)
    const id = side === 0 ? 'booster' : 'oracle'
    const drawn = await page.evaluate(() => window.drawnSprites)
    const folder = id === 'booster' ? 'normalised-heavy-continuity-ready' : 'normalised-heavy-ready'
    for (const phase of ['startup', 'active', 'recovery']) assert.ok(drawn.some(s => s.includes('/' + id + '/' + folder + '/heavy-' + phase + '/')))
    if (id === 'booster') {
      assert.ok(drawn.some(s => s.includes('/booster/' + folder + '/heavy-swing/')))
    }
    const events = await page.locator('#log').innerText()
    if (outcome === 'whiff') assert.doesNotMatch(events, / HIT | block /)
    else assert.match(events, outcome === 'hit' ? / HIT / : / block /)
    console.log('PASS P' + (side + 1) + ' heavy ' + outcome + ', reduced=' + reduced + '; all phases and idle return')
    await page.close()
  }
  const page = await browser.newPage()
  page.on('pageerror', e => errors.push(e.message))
  await page.route(/\/normalised-heavy(?:-continuity)?-ready\//, r => r.abort())
  await page.clock.install()
  await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('7 failed'))
  assert.match(await page.locator('#asset-status').innerText(), /31\/38 sprites ready; 7 failed/)
  await page.locator('[data-command="KeyT"]').click()
  await page.clock.runFor(1700)
  await page.getByRole('button', { name: 'P1 heavy', exact: true }).click()
  await page.getByRole('button', { name: 'P2 heavy', exact: true }).click()
  await page.clock.runFor(100)
  await page.screenshot({ path: out + 'missing-heavy.png' })
  await page.clock.runFor(1000)
  assert.doesNotMatch(await page.locator('#readout').innerText(), /activity   attack/)
  assert.deepEqual(errors, [])
  console.log('PASS missing heavy art uses fallback; attacks finish; no uncaught browser errors')
} finally { await browser.close() }
