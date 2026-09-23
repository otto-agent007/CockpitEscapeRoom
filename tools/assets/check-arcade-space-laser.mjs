/**
 * Local-only proof for THE BOOSTER's space laser, driven through the real controls.
 *
 * Start Vite, then `ARCADE_PILOT_URL=http://127.0.0.1:<port>/dev/arcade.html node
 * tools/assets/check-arcade-space-laser.mjs`. Meter is earned by landing real heavies,
 * never injected. Each case then separates the fighters, fires once, and asserts on
 * the rules readout AND on the canvas: the hit lands on the very next frame, at range,
 * through a guard or mid-jump, and a pale beam is drawn over the defender and nowhere
 * near the booster.
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const base = process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5349/dev/arcade.html'
const out = process.env.ARCADE_EVIDENCE_DIR ?? 'preview-renders/mars-arcade/space-laser-v2'
await mkdir(out, { recursive: true })
const report = message => console.log(`PASS ${message}`)

const CASES = [
  { tag: 'guarding-1440', width: 1440, defender: 'guard', fire: 'button' },
  { tag: 'airborne-1440', width: 1440, defender: 'jump', fire: 'keyboard' },
  { tag: 'reduced-768', width: 768, defender: 'guard', fire: 'button', reduced: true },
  { tag: 'narrow-375', width: 375, defender: 'stand', fire: 'button' },
  { tag: 'missing-art-1440', width: 1440, defender: 'stand', fire: 'button', missing: true },
]

const browser = await chromium.launch({ headless: true })
const errors = []
try {
  for (const scenario of CASES) {
    const page = await browser.newPage({
      viewport: { width: scenario.width, height: 1400 },
      reducedMotion: scenario.reduced ? 'reduce' : 'no-preference',
    })
    page.on('pageerror', error => errors.push(`${scenario.tag}: ${error.message}`))
    if (scenario.missing) await page.route('**/fx-space-laser-v1/**', route => route.abort())
    // Record which images each frame actually draws, so the proof is about the art
    // on screen and not just about files that loaded.
    await page.addInitScript(() => {
      window.frameDraws = []
      const draw = CanvasRenderingContext2D.prototype.drawImage
      CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
        if (image instanceof HTMLImageElement) window.frameDraws.push(image.src)
        return draw.call(this, image, ...args)
      }
    })
    await page.clock.install()
    await page.goto(base)
    await page.waitForFunction(() => /51\/51 sprites ready/.test(document.querySelector('#asset-status').textContent))
    await page.waitForFunction(missing => document.querySelector('#asset-status').textContent.includes(
      missing ? '0/8 laser effects' : '8/8 laser effects ready'), Boolean(scenario.missing))
    const read = () => page.locator('#readout').innerText()
    const numbers = async pattern => [...(await read()).matchAll(pattern)].map(m => Number(m[1]))
    const command = async key => { await page.locator(`[data-command="${key}"]`).click(); await page.clock.runFor(20) }
    const step = () => command('KeyN')

    // Human P2 so the defender does exactly what each case needs.
    await command('KeyT')
    await page.locator('canvas').click()
    await page.clock.runFor(1800)
    assert.match(await read(), /phase fight/)

    // Earn the meter: walk in and land heavies until two chunks are banked.
    await page.keyboard.down('KeyD')
    await page.clock.runFor(900)
    await page.keyboard.up('KeyD')
    for (let swing = 0; swing < 12 && (await numbers(/meter +(\d+)/g))[0] < 40; swing += 1) {
      await page.keyboard.down('KeyK'); await page.clock.runFor(30); await page.keyboard.up('KeyK')
      await page.clock.runFor(700)
      await page.keyboard.down('KeyD'); await page.clock.runFor(250); await page.keyboard.up('KeyD')
    }
    const [meter] = await numbers(/meter +(\d+)/g)
    assert.ok(meter >= 40, `${scenario.tag}: only earned ${meter} meter`)

    // Separate them: the booster backs off, the defender retreats (which is guarding).
    // Not to the walls: nothing yet stops the fighters walking further apart than
    // the 320 px screen, and a beam on an off-screen defender proves nothing.
    await page.keyboard.down('KeyA'); await page.keyboard.down('ArrowRight')
    await page.clock.runFor(1100)
    await page.keyboard.up('KeyA')
    if (scenario.defender !== 'guard') await page.keyboard.up('ArrowRight')
    if (scenario.defender === 'jump') {
      await page.keyboard.down('ArrowUp'); await page.clock.runFor(120); await page.keyboard.up('ArrowUp')
    }
    await command('Space')
    const [bx, dx] = await numbers(/position   x (-?[\d.]+)/g)
    const [, dy] = await numbers(/position   x -?[\d.]+  y (-?[\d.]+)/g)
    const gap = Math.abs(dx - bx)
    assert.ok(gap > 150, `${scenario.tag}: fighters only ${gap.toFixed(0)} px apart`)
    const [view] = await numbers(/camera x (-?\d+)/g)
    for (const x of [bx, dx]) assert.ok(Math.abs(x - view) < 150, `${scenario.tag}: fighter at ${x} is off a screen centred on ${view}`)
    if (scenario.defender === 'guard') assert.match(await read(), /\(blocking\)/)
    if (scenario.defender === 'jump') assert.ok(dy > 20, `${scenario.tag}: defender only ${dy} px up`)
    const [, healthBefore] = await numbers(/health +(\d+)/g)
    const [, guardBefore] = await numbers(/guard +(\d+)/g)

    if (scenario.fire === 'keyboard') {
      await page.keyboard.down('KeyL'); await page.keyboard.up('KeyL')
    } else {
      await page.getByRole('button', { name: 'P1 special', exact: true }).click()
    }
    await page.evaluate(() => { window.frameDraws = [] })
    await step()
    const drawn = await page.evaluate(() => window.frameDraws.map(src => new URL(src).pathname))
    const has = part => drawn.some(src => src.includes(part))
    assert.ok(has('/normalised-space-laser-ready/call-it-in/'), `${scenario.tag}: booster not in the call-in pose`)
    if (scenario.missing) {
      assert.ok(!has('/fx-space-laser-v1/'), `${scenario.tag}: effect art drawn although it was blocked`)
    } else {
      assert.ok(has('/satellite-01.png'), `${scenario.tag}: no satellite drawn`)
      assert.ok(has(scenario.reduced ? '/beam-w10.png' : '/beam-w14.png'), `${scenario.tag}: wrong or no beam art`)
      assert.ok(has(scenario.reduced ? '/impact-03.png' : '/impact-00.png'), `${scenario.tag}: wrong or no impact art`)
    }
    const [, healthAfter] = await numbers(/health +(\d+)/g)
    const [, guardAfter] = await numbers(/guard +(\d+)/g)
    assert.equal(healthBefore - healthAfter, 15, `${scenario.tag}: took ${healthBefore - healthAfter}`)
    assert.ok(guardAfter >= guardBefore, `${scenario.tag}: guard fell ${guardBefore} -> ${guardAfter}`)
    assert.match(await page.locator('#log').innerText(), /HIT +booster\.spaceLaser +-15/)
    assert.doesNotMatch(await page.locator('#log').innerText(), /block +booster\.spaceLaser/)
    report(`${scenario.tag}: ${gap.toFixed(0)} px away, ${scenario.defender}, fired by ${scenario.fire}: -15 on the first frame, guard untouched`)

    // The beam: pale core pixels in a column over the defender, none over the booster.
    const camera = (await numbers(/camera x (-?\d+)/g))[0]
    const beam = async () => page.evaluate(({ dx, bx, camera }) => {
      const canvas = document.querySelector('canvas')
      const scale = canvas.width / 320
      const ctx = canvas.getContext('2d')
      const row = ctx.getImageData(0, 60 * scale, canvas.width, 1).data
      const pale = []
      for (let x = 0; x < canvas.width; x += 1) {
        const i = x * 4
        if (row[i] > 235 && row[i + 1] > 240 && row[i + 2] > 245) pale.push(x)
      }
      const screen = x => (160 + x - camera) * scale
      const near = (x, target) => Math.abs(x - target) <= 8 * scale
      return {
        width: pale.length,
        overDefender: pale.filter(x => near(x, screen(dx))).length,
        overBooster: pale.filter(x => near(x, screen(bx))).length,
      }
    }, { dx, bx, camera })
    const widths = []
    for (let age = 0; age < 16; age += 1) {
      const seen = await beam()
      widths.push(seen.width)
      if (age === 0 || age === 5 || age === 11 || age === 15) {
        await page.locator('canvas').screenshot({ path: `${out}/${scenario.tag}-age${String(age).padStart(2, '0')}.png` })
      }
      if (age < 14) {
        assert.ok(seen.overDefender > 0, `${scenario.tag}: no beam over the defender at age ${age}`)
        assert.equal(seen.overBooster, 0, `${scenario.tag}: beam drawn over the booster at age ${age}`)
      }
      await step()
    }
    assert.equal(widths[15], 0, `${scenario.tag}: beam still up after it should have gone`)
    if (scenario.reduced) {
      assert.equal(new Set(widths.slice(0, 14)).size, 1, `${scenario.tag}: beam width changed under reduced motion: ${widths}`)
    } else {
      assert.ok(widths[0] > widths[12], `${scenario.tag}: beam did not thin: ${widths}`)
    }
    await page.evaluate(() => { window.frameDraws = [] })
    await step()
    const late = await page.evaluate(() => window.frameDraws.map(src => new URL(src).pathname))
    assert.ok(late.some(src => src.includes('/normalised-space-laser-ready/')), `${scenario.tag}: booster left the special early`)
    report(`${scenario.tag}: beam over the defender for 14 frames, never over the booster; widths ${widths.slice(0, 15).join(',')}`)
    await page.close()
  }
  assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`)
  report('no uncaught browser errors')
} finally {
  await browser.close()
}
