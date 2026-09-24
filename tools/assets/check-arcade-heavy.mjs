/** Real native-input heavy key-pose proof; no game-state injection. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = process.env.ARCADE_EVIDENCE_DIR ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, "/") : new URL('../../preview-renders/mars-arcade/outcomes-v1/regressions/', import.meta.url).pathname
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
    await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('68/68 sprites ready'))
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
      // The defender has to be CORNERED before the attack. Blocking means holding
      // away, and holding away means walking away, so anywhere else on the stage the
      // defender simply retreats out of the attacker's reach: the oracle's heavy has
      // reach 40 and 13 startup frames, and a booster walking back at 1.25 px/frame is
      // 40.25 away by the first active frame. Against the wall the input still counts
      // as blocking while x cannot move, which is what makes the block land.
      //
      // This precondition used to hold by accident, because on the old 280 px stage a
      // 1200 ms retreat overshot the wall. The stage is 480 px now, so it is arranged
      // and then checked rather than assumed. Since MARS_ARCADE_STAGE.maxSeparation
      // (272) the attacker has to follow, or the retreat stops short of the wall.
      await page.keyboard.down(away); await page.keyboard.down(approach)
      await tick(3400)
      await page.keyboard.up(away); await page.keyboard.up(approach)
      const wall = Number((await read()).match(/walls (-?\d+)/)[1])
      const cornered = [...(await read()).matchAll(/position   x (-?[\d.]+)/g)]
        .map(m => Number(m[1]))[side === 0 ? 1 : 0]
      assert.equal(cornered, side === 0 ? -wall : wall, 'defender never reached the corner')
      await page.keyboard.down(approach); await tick(5200); await page.keyboard.up(approach)
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
      for (const phase of ['drive', 'settle']) assert.ok(drawn.some(s => s.includes('/booster/normalised-heavy-drive-ready/heavy-' + phase + '/')))
      assert.ok(drawn.some(s => s.includes('/booster/normalised-heavy-recovery-v1/heavy-retract/')))
      assert.ok(drawn.some(s => s.includes('/booster/' + folder + '/heavy-swing/')))
    } else {
      for (const beat of ['sweep', 'settle']) assert.ok(drawn.some(s => s.includes('/oracle/normalised-heavy-motion-ready/heavy-' + beat + '/')))
    }
    const events = await page.locator('#log').innerText()
    if (outcome === 'whiff') assert.doesNotMatch(events, / HIT | block /)
    else assert.match(events, outcome === 'hit' ? / HIT / : / block /)
    console.log('PASS P' + (side + 1) + ' heavy ' + outcome + ', reduced=' + reduced + '; all phases and idle return')
    await page.close()
  }
  const page = await browser.newPage()
  page.on('pageerror', e => errors.push(e.message))
  await page.route(/\/normalised-heavy(?:(?:-continuity|-drive|-motion)?-ready|-recovery-v1)\//, r => r.abort())
  await page.clock.install()
  await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('12 failed'))
  assert.match(await page.locator('#asset-status').innerText(), /56\/68 sprites ready; 12 failed/)
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
