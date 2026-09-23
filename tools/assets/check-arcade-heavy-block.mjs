/** Actual native blocked-heavy draws and rule-value proof, no state injection. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = process.env.ARCADE_EVIDENCE_DIR ?? 'preview-renders/mars-arcade/heavy-block-v1/browser'
await mkdir(out, { recursive: true })
// ARCADE_HEAVY_ATTACKER=oracle proves Booster's own blocked-heavy reaction; the
// default keeps this script's original meaning, Oracle blocking Booster.
const attacker = process.env.ARCADE_HEAVY_ATTACKER ?? 'booster'
assert.ok(['booster', 'oracle'].includes(attacker))
const defender = attacker === 'booster' ? 'oracle' : 'booster'
// Chip and guard damage of the attacker's heavy, from src/game/marsArcadeFighters.ts.
const HEAVY = { booster: { chip: 3, guard: 16 }, oracle: { chip: 2, guard: 14 } }[attacker]
const guardDrawing = defender === 'oracle' ? '/normalised-exchange-ready/block/block-00.png' : '/normalised-sleek-ready/block/block-00.png'
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
    if (missing) await page.route(`**/${defender}/normalised-heavy-block-ready/**`, route => route.abort())
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
    await page.waitForFunction(text => document.querySelector('#asset-status').textContent.includes(text), missing ? '59/61 sprites ready; 2 failed' : '61/61 sprites ready')
    const read = () => page.locator('#readout').innerText()
    const command = async key => { await page.locator('[data-command="' + key + '"]').click(); await page.clock.runFor(20) }
    await command('KeyT'); await command('KeyH')
    await page.locator('[data-fighter="0"]').selectOption(side === 0 ? attacker : defender)
    await page.locator('[data-fighter="1"]').selectOption(side === 0 ? defender : attacker)
    await page.locator('canvas').click()
    await page.clock.runFor(1700)
    const away = side === 0 ? 'ArrowRight' : 'KeyA'
    const approach = side === 0 ? 'KeyD' : 'ArrowLeft'
    await page.keyboard.down(away); await page.clock.runFor(3400)
    await page.keyboard.down(approach); await page.clock.runFor(5200); await page.keyboard.up(approach)
    await command('Space')
    const health = [...(await read()).matchAll(/health     (\d+)/g)].map(m => Number(m[1]))
    const guard = [...(await read()).matchAll(/guard      (\d+)/g)].map(m => Number(m[1]))
    const tag = `${defender}-blocks-p${side + 1}-${reduced ? 'reduced' : 'normal'}${missing ? '-missing' : ''}`
    const seen = new Set()
    const suffixes = {
      brace: guardDrawing,
      compress: '/normalised-heavy-block-ready/compress/compress-00.png',
      settle: '/normalised-heavy-block-ready/settle/settle-00.png',
      guard: guardDrawing,
    }
    await page.getByRole('button', { name: 'P' + (side + 1) + ' heavy', exact: true }).click()
    for (let i = 0; i < 42; i++) {
      await page.evaluate(() => { window.frameDraws = [] })
      await command('KeyN')
      const state = await read()
      const phase = state.match(/artwork    heavy block — (brace|compress|settle|guard)/)?.[1]
      assert.doesNotMatch(state, /heavy hit —/, 'blocked hit must not use clean-hit reaction')
      if (phase && !seen.has(phase)) {
        const draws = await page.evaluate(() => window.frameDraws)
        assert.equal(draws.some(src => src.includes('/' + defender + '/') && src.endsWith(suffixes[phase])), !(missing && ['compress', 'settle'].includes(phase)))
        await page.locator('canvas').screenshot({ path: `${out}/${tag}-${phase}.png` })
        await page.clock.runFor(300)
        assert.equal(await read(), state, 'paused block reaction advanced with wall time')
        seen.add(phase)
      }
    }
    assert.deepEqual([...seen], ['brace', 'compress', 'settle', 'guard'])
    assert.doesNotMatch(await read(), /activity   (attack|blockstun|hitstun)/)
    const healthAfter = [...(await read()).matchAll(/health     (\d+)/g)].map(m => Number(m[1]))
    const guardAfter = [...(await read()).matchAll(/guard      (\d+)/g)].map(m => Number(m[1]))
    assert.equal(health[1 - side] - healthAfter[1 - side], HEAVY.chip)
    assert.equal(guard[1 - side] - guardAfter[1 - side], HEAVY.guard)
    if (attacker === 'booster' && side === 0 && !reduced && !missing) {
      let crushSeen = false
      for (let cycle = 0; cycle < 3; cycle++) {
        await page.getByRole('button', { name: 'P1 heavy', exact: true }).click()
        for (let frame = 0; frame < 42; frame++) {
          await command('KeyN')
          const state = await read()
          if (cycle === 2 && state.includes('heavy hit — impact') && !crushSeen) {
            assert.doesNotMatch(state, /heavy block — compress/)
            await page.locator('canvas').screenshot({ path: `${out}/guard-crush-clean-hit.png` })
            crushSeen = true
          }
        }
      }
      assert.ok(crushSeen, 'fourth blocked heavy must crush guard and use the clean-hit reaction')
      const finalHealth = [...(await read()).matchAll(/health     (\d+)/g)].map(m => Number(m[1]))
      assert.equal(health[1] - finalHealth[1], 3 * 3 + 13)
      console.log('PASS repeated blocks drain guard; fourth heavy crushes it and switches to clean-hit recoil')
    }
    await page.keyboard.up(away)
    await command('KeyR')
    assert.doesNotMatch(await read(), /heavy block —/)
    await page.reload()
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('phase intro'))
    assert.doesNotMatch(await read(), /heavy block —/)
    console.log(`PASS ${tag}: brace/compress/settle/guard; pause/step/reset/reload; chip${HEAVY.chip} guard${HEAVY.guard}`)
    await page.close()
  }
  assert.deepEqual(errors, [])
  console.log('PASS no uncaught browser errors')
} finally { await browser.close() }
