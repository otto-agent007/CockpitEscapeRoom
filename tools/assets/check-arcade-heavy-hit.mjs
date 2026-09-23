/** Native-control heavy reaction proof: no state injection or relaxed asset gates. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = process.env.ARCADE_EVIDENCE_DIR ?? 'preview-renders/mars-arcade/heavy-hit-v1/browser'
await mkdir(out, { recursive: true })
const attacker = process.env.ARCADE_HEAVY_ATTACKER ?? 'booster'
assert.ok(['booster', 'oracle'].includes(attacker))
const defender = attacker === 'booster' ? 'oracle' : 'booster'
const browser = await chromium.launch({ headless: true })
const errors = []
try {
  for (const scenario of [
    { side: 0, reduced: false }, { side: 1, reduced: false },
    { side: 0, reduced: true }, { side: 1, reduced: true },
    { side: 0, reduced: false, missing: true },
  ]) {
    const { side, reduced, missing } = scenario
    const page = await browser.newPage({ viewport: { width: 1100, height: 1400 }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
    page.on('pageerror', error => errors.push(error.message))
    if (missing) await page.route(defender === 'oracle' ? '**/normalised-heavy-hit-ready/**' : '**/normalised-hit-reaction-ready/**', route => route.abort())
    await page.addInitScript(() => {
      window.frameDraws = []
      const draw = CanvasRenderingContext2D.prototype.drawImage
      CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
        if (image instanceof HTMLImageElement) window.frameDraws.push(image.src)
        return draw.call(this, image, ...args)
      }
    })
    await page.clock.install()
    await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5349/dev/arcade.html')
    await page.waitForFunction(text => document.querySelector('#asset-status').textContent.includes(text), missing ? (defender === 'oracle' ? '56/57 sprites ready; 1 failed' : '55/57 sprites ready; 2 failed') : '57/57 sprites ready')
    const read = () => page.locator('#readout').innerText()
    const command = async key => { await page.locator('[data-command="' + key + '"]').click(); await page.clock.runFor(20) }
    await command('KeyT'); await command('KeyH')
    await page.locator('[data-fighter="0"]').selectOption(side === 0 ? attacker : defender)
    await page.locator('[data-fighter="1"]').selectOption(side === 0 ? defender : attacker)
    await page.locator('canvas').click()
    await page.clock.runFor(1700)
    await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowLeft')
    await page.clock.runFor(700)
    await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowLeft')
    await command('Space')
    const healthBefore = [...(await read()).matchAll(/health     (\d+)/g)].map(m => Number(m[1]))
    await page.getByRole('button', { name: 'P' + (side + 1) + ' heavy', exact: true }).click()
    const seen = new Set()
    const tag = `p${side + 1}-${reduced ? 'reduced' : 'normal'}${missing ? '-missing' : ''}`
    for (let i = 0; i < 42; i++) {
      await page.evaluate(() => { window.frameDraws = [] })
      await command('KeyN')
      const state = await read()
      const phase = state.match(/artwork    heavy hit — (impact|stagger|recover)/)?.[1]
      if (phase && !seen.has(phase)) {
        const draws = await page.evaluate(() => window.frameDraws)
        const suffix = defender === 'oracle'
          ? (phase === 'recover' ? '/normalised-heavy-hit-ready/recover/recover-00.png' : '/normalised-exchange-ready/recoil/recoil-00.png')
          : (phase === 'impact' ? '/normalised-sleek-ready/recoil/recoil-00.png' : '/normalised-hit-reaction-ready/' + phase + '/' + phase + '-00.png')
        assert.equal(draws.some(src => src.includes('/' + defender + '/') && src.endsWith(suffix)), !(missing && (phase === 'recover' || (defender === 'booster' && phase === 'stagger'))))
        await page.locator('canvas').screenshot({ path: `${out}/${tag}-${phase}.png` })
        await page.clock.runFor(300)
        assert.equal(await read(), state, 'paused reaction must not advance on wall time')
        seen.add(phase)
      }
    }
    assert.deepEqual([...seen], ['impact', 'stagger', 'recover'])
    assert.doesNotMatch(await read(), /activity   (hitstun|attack)/)
    const healthAfter = [...(await read()).matchAll(/health     (\d+)/g)].map(m => Number(m[1]))
    assert.equal(healthBefore[1 - side] - healthAfter[1 - side], attacker === 'booster' ? 13 : 11)
    await page.locator('canvas').screenshot({ path: `${out}/${tag}-stance.png` })
    if (defender === 'booster' && side === 0 && !reduced && !missing) {
      let firstKo = false
      for (let cycle = 0; cycle < 9; cycle++) {
        await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowLeft')
        for (let step = 0; step < 6; step++) await command('KeyN')
        await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowLeft')
        await page.getByRole('button', { name: 'P1 heavy', exact: true }).click()
        for (let frame = 0; frame < 42; frame++) {
          await command('KeyN')
          const state = await read()
          if (state.includes('phase ko') && !firstKo) {
            assert.match(state, /artwork    knockout 0/)
            assert.doesNotMatch(state, /artwork    heavy hit —/)
            await page.locator('canvas').screenshot({ path: `${out}/booster-ko-first.png` })
            firstKo = true
          }
        }
      }
      assert.ok(firstKo, 'repeated native hits must reach Booster KO')
      assert.match(await read(), /artwork    knockout 2/)
      await page.locator('canvas').screenshot({ path: `${out}/booster-ko-settled.png` })
      console.log('PASS Booster KO takes priority over hit recovery and finishes the existing knockdown')
    }
    await command('KeyR')
    assert.doesNotMatch(await read(), /heavy hit —/)
    await page.reload()
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('phase intro'))
    assert.doesNotMatch(await read(), /heavy hit —/)
    console.log(`PASS ${tag}: impact → stagger → recover → stance; pause/step/reset/reload; damage${attacker === 'booster' ? 13 : 11}`)
    await page.close()
  }
  assert.deepEqual(errors, [])
  console.log('PASS no uncaught browser errors')
} finally { await browser.close() }
