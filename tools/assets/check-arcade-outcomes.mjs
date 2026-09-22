/** Real-input KO proof; terminal animation advances while combat remains frozen. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = process.env.ARCADE_EVIDENCE_DIR ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, "/") : new URL('../../preview-renders/mars-arcade/outcomes-v1/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
const missing = process.env.ARCADE_MISSING_OUTCOMES === '1'
try {
  for (const winner of missing ? [1] : [1, 2]) for (const reduced of missing ? [false] : [false, true]) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1400 }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
    page.on('pageerror', e => errors.push(e.message))
    if (missing) await page.route('**/normalised-outcomes-ready/**', route => route.abort())
    await page.addInitScript(() => {
      window.frameDraws = []
      window.bannerPixels = []
      const fill = CanvasRenderingContext2D.prototype.fillRect
      CanvasRenderingContext2D.prototype.fillRect = function (x, y, width, height) {
        const scale = this.canvas.width / 320
        const headline = this.fillStyle === '#ffd23f' && width === 3 * scale
        const subtitle = this.fillStyle === '#f0dcc0' && width === 2 * scale
        if ((headline || subtitle) && height === width) {
          window.bannerPixels.push({ headline, bottom: (y + height) / scale })
        }
        return fill.call(this, x, y, width, height)
      }
      const draw = CanvasRenderingContext2D.prototype.drawImage
      CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
        if (image instanceof HTMLImageElement) window.frameDraws.push(image.src)
        return draw.call(this, image, ...args)
      }
    })
    await page.clock.install()
    await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
    assert.match(await page.title(), /Mars arcade/)
    const ready = missing ? '41/46 sprites ready; 5 failed' : '46/46 sprites ready'
    await page.waitForFunction(text => document.querySelector('#asset-status').textContent.includes(text), ready)
    const read = () => page.locator('#readout').innerText()
    const command = async code => { await page.locator('[data-command="' + code + '"]').click(); await page.clock.runFor(20) }
    await command('mirror'); await command('KeyT'); await command('KeyH')
    await page.clock.runFor(1700)
    await command('Space')
    await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowLeft')
    let ended = false
    for (let frame = 0; frame < 1000; frame++) {
      if (frame % 18 === 0) await page.getByRole('button', { name: 'P' + winner + ' light', exact: true }).click()
      await command('KeyN')
      if ((await read()).includes('phase ko')) { ended = true; break }
    }
    await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowLeft')
    assert.ok(ended, 'native jabs must cause a real KO')
    assert.match(await page.locator('#log').innerText(), new RegExp('K.O.  winner P' + winner))
    const frozenCombat = text => text.split('\n').filter(line => !line.includes('artwork') && !line.includes('outcome frame')).join('\n')
    const frozen = frozenCombat(await read())
    for (const index of [0, 1, 2]) {
      if (index > 0) for (let n = 0; n < 12; n++) await command('KeyN')
      const expected = reduced ? 2 : index
      const state = await read()
      assert.match(state, new RegExp('artwork    victory ' + expected))
      assert.match(state, new RegExp('artwork    knockout ' + expected))
      assert.equal(frozenCombat(state), frozen, 'presentation must not change game state readout')
      await page.evaluate(() => { window.frameDraws = []; window.bannerPixels = [] })
      await page.clock.runFor(100) // paused repaint, not a simulation step
      const drawn = await page.evaluate(() => window.frameDraws)
      // Observe the real pixel-font draw calls (not sprite colours or old fillText).
      // Require both text layers and keep their bottom above the fighter artwork.
      const banner = await page.evaluate(() => ({
        headline: window.bannerPixels.filter(pixel => pixel.headline).length,
        subtitle: window.bannerPixels.filter(pixel => !pixel.headline).length,
        bottom: Math.max(...window.bannerPixels.map(pixel => pixel.bottom)),
      }))
      assert.ok(banner.headline > 0 && banner.subtitle > 0 && banner.bottom <= 80,
        'outcome banner must be visible above the fighters faces and raised fists: ' + JSON.stringify(banner))
      if (missing) {
        assert.ok(!drawn.some(src => src.includes('/normalised-outcomes-ready/')), 'unavailable outcome art must use the box renderer')
        assert.match(await page.locator('#asset-status').innerText(), /box fallback/)
      } else {
        assert.ok(drawn.some(src => src.endsWith('/win/win-0' + expected + '.png')))
        assert.ok(drawn.some(src => src.endsWith(expected === 0 ? '/recoil/recoil-00.png' : '/ko/ko-0' + expected + '.png')))
      }
      assert.equal(await read(), state, 'paused outcome must stay frozen through capture')
      await page.locator('canvas').screenshot({ path: out + (missing ? 'missing-' : '') + 'winner-' + winner + '-beat-' + index + '-reduced-' + reduced + '.png' })
      if (winner === 1 && !reduced && !missing && index === 0) {
        await command('KeyS') // Half-speed applies to the presentation clock, too.
        await command('Space'); await page.clock.runFor(200); await command('Space')
        const elapsed = Number((await read()).match(/outcome frame (\d+)/)?.[1])
        assert.ok(elapsed >= 5 && elapsed <= 8, '220ms at half speed must advance about six outcome frames')
        assert.match(await read(), /artwork    victory 0/)
        await command('KeyS'); await command('KeyS') // Restore1× while paused.
        assert.equal(frozenCombat(await read()), frozen)
      }
    }
    await command('Space'); await page.clock.runFor(1000); await command('Space')
    assert.equal(frozenCombat(await read()), frozen)
    assert.match(await read(), /artwork    victory 2/)
    if (winner === 1 && !reduced && !missing) for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1200 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.screenshot({ path: out + 'outcome-' + width + '.png', fullPage: true })
    }
    await command('KeyR')
    assert.match(await read(), /phase intro/)
    assert.match(await read(), /outcome frame 0/)
    assert.doesNotMatch(await read(), /artwork    (victory|knockout)/)
    await page.reload()
    await page.waitForFunction(text => document.querySelector('#asset-status').textContent.includes(text), ready)
    assert.doesNotMatch(await read(), /artwork    (victory|knockout)/)
    console.log('PASS native KO, all outcome beats, displayed combat frozen, pause/step/resume/restart/reload; winnerP' + winner + ', reduced=' + reduced + ', missing=' + missing)
    await page.close()
  }
  for (const scenario of missing ? [] : ['draw', 'time-win', 'missing']) {
    const page = await browser.newPage({ viewport: { width: 768, height: 1200 } })
    page.on('pageerror', error => errors.push(error.message))
    if (scenario === 'missing') await page.route('**/normalised-outcomes-ready/**', route => route.abort())
    await page.clock.install()
    await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
    const ready = scenario === 'missing' ? '41/46 sprites ready; 5 failed' : '46/46 sprites ready'
    await page.waitForFunction(text => document.querySelector('#asset-status').textContent.includes(text), ready)
    const command = async code => { await page.locator('[data-command="' + code + '"]').click(); await page.clock.runFor(20) }
    await command('mirror'); await command('KeyT'); await command('KeyH')
    await page.clock.runFor(1700)
    if (scenario !== 'draw') {
      await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowLeft')
      await page.clock.runFor(700)
      await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowLeft')
      await page.getByRole('button', { name: 'P1 light', exact: true }).click()
      await page.clock.runFor(350)
      assert.match(await page.locator('#log').innerText(), / HIT /)
    }
    await page.clock.runFor(62000)
    const state = await page.locator('#readout').innerText()
    assert.match(state, /phase timeOver/)
    assert.doesNotMatch(state, /artwork    knockout/)
    if (scenario === 'draw') {
      assert.match(await page.locator('#log').innerText(), /TIME  draw/)
      assert.doesNotMatch(state, /artwork    victory/)
    } else {
      assert.match(await page.locator('#log').innerText(), /TIME  winner P1/)
      assert.match(state, /artwork    victory 2/)
      assert.match(state, /artwork    round over — resting/)
    }
    await page.screenshot({ path: out + scenario + '.png', fullPage: true })
    if (scenario === 'missing') assert.match(await page.locator('#asset-status').innerText(), /box fallback/)
    console.log('PASS real timer outcome: ' + scenario + '; healthy loser/draw not knocked out')
    await page.close()
  }
  assert.deepEqual(errors, [])
} finally { await browser.close() }
