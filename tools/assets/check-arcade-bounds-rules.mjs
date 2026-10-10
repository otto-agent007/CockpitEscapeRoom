/**
 * Browser proof for the enabled rule switches on /dev/arcade.html (plan 0050).
 *
 *   ARCADE_PILOT_URL=http://127.0.0.1:5371/dev/arcade.html node tools/assets/check-arcade-bounds-rules.mjs
 *
 * Positions the fighters exactly by pausing and stepping single frames with a walk
 * key held, then proves, in the real page with the real rules:
 *
 *   1. both switches load on, reset/reload retain them, and disabling them restores a jab whiff at 49.5 px;
 *   2. with "hits by boxes" on, the same jab at the same distance lands, and with
 *      "hit stop" on the fight freezes for 2 frames and the defender flashes white;
 *   3. under reduced motion the freeze still happens but the flash does not;
 *   4. with the switches off a cornered, guarding booster blocks Hard Cutoff, and with
 *      "hits by boxes" on the same sweep goes through the guard.
 *
 * Screenshots cover 375, 768 and 1440 px; ARCADE_EVIDENCE_DIR isolates a review run.
 * Save is not exercised: it would rewrite the committed tuning file from a test.
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5371/dev/arcade.html'
const out = process.env.ARCADE_EVIDENCE_DIR
  ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, '/')
  : new URL('../../preview-renders/mars-arcade/bounds-rules-v1/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
const report = (line) => console.log(`ok - ${line}`)

async function open(width, reducedMotion = false) {
  const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.clock.install()
  await page.goto(url)
  await page.waitForFunction(() => /^(\d+)\/\1 sprites ready/.test(document.querySelector('#asset-status').textContent))
  const tick = (ms) => page.clock.runFor(ms)
  const read = () => page.locator('#readout').innerText()
  const frameNow = async () => Number((await read()).match(/frame (\d+)/)[1])
  /** Log lines stamped after `frame`. The log keeps 14 lines, so slicing by length lies. */
  const logSince = async (frame) => (await page.locator('#log').innerText()).split('\n')
    .filter((line) => Number(line.trim().split(/\s+/)[0]) > frame).join('\n')
  const separation = async () => Number((await read()).match(/separation (-?[\d.]+)px/)[1])
  const focusStage = () => page.locator('body').click({ position: { x: 2, y: 2 } })
  const step = async (frames, hold = []) => {
    for (const key of hold) await page.keyboard.down(key)
    for (let i = 0; i < frames; i += 1) { await page.keyboard.press('KeyN'); await tick(20) }
    for (const key of hold) await page.keyboard.up(key)
  }
  /** Restart, human P2, intro elapsed, paused. */
  const fresh = async () => {
    // Restart keeps the pause flag, and a paused intro never elapses.
    if (/PAUSED/.test(await read())) { await page.locator('[data-command="Space"]').click(); await tick(20) }
    await page.locator('[data-command="KeyR"]').click()
    await tick(1700)
    await page.locator('[data-command="Space"]').click()
    await tick(20)
    assert.match(await read(), /phase fight .*PAUSED/)
    await focusStage()
  }
  const setRule = async (rule, on) => {
    await page.locator(`#pg-rule-${rule}`).setChecked(on)
    await tick(20)
    await focusStage()
  }
  /**
   * Bright pixels on the stage canvas: the flash is a whole fighter drawn white. The
   * hurt-box overlay tints it faintly green, so "bright" is every channel above 200
   * rather than pure white (a pure-white count measured only ~190 px of flash).
   */
  const whitePixels = () => page.locator('#stage').evaluate((canvas) => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    let count = 0
    for (let i = 0; i < data.length; i += 4) if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) count += 1
    return count
  })
  await page.locator('[data-command="KeyT"]').click() // human P2: nothing moves unless we say so
  return { page, tick, read, frameNow, logSince, separation, step, fresh, setRule, whitePixels }
}

/** P1 walks in to 49.5 px, taps the jab, and steps to its first active frame. */
async function jabAt49(h) {
  await h.fresh()
  await h.step(50, ['KeyD'])
  assert.equal(await h.separation(), 49.5)
  await h.page.keyboard.press('KeyJ')
  const before = await h.frameNow()
  await h.step(5)
  return h.logSince(before)
}

try {
  const h = await open(1440)
  const enabled = async () => {
    assert.match(await h.read(), /rules {2}hits by boxes {3}hit stop on/)
    assert.equal(await h.page.locator('#pg-rule-useBounds').isChecked(), true)
    assert.equal(await h.page.locator('#pg-rule-hitstop').isChecked(), true)
    assert.equal(await h.page.locator('#pg-candidate-oracle-walk-forward-video').isChecked(), false)
  }
  await enabled()
  await h.setRule('useBounds', false)
  await h.setRule('hitstop', false)
  await h.page.locator('#pg-reset').click()
  await h.tick(20)
  await enabled()
  await h.setRule('useBounds', false)
  await h.setRule('hitstop', false)
  await h.page.reload()
  await h.page.waitForFunction(() => /^(\d+)\/\1 sprites ready/.test(document.querySelector('#asset-status').textContent))
  await h.tick(20)
  await enabled()
  await h.page.locator('[data-command="KeyT"]').click()
  report('both switches load on; reset and reload restore both; existing Oracle walk stays selected')
  await h.setRule('useBounds', false)
  await h.setRule('hitstop', false)

  const whiff = await jabAt49(h)
  assert.doesNotMatch(whiff, /HIT/)
  report('switches off: the jab whiffs at 49.5 px (reach 41)')

  await h.setRule('useBounds', true)
  await h.setRule('hitstop', true)
  assert.match(await h.read(), /rules {2}hits by boxes {3}hit stop on/)
  const landed = await jabAt49(h)
  assert.match(landed, /HIT {6}booster\.padJab {2}-5 {2}stop 2f/)
  assert.match(await h.read(), /FROZEN 2\/2f/)
  const flashWhite = await h.whitePixels()
  await h.page.screenshot({ path: `${out}jab-by-boxes-flash-1440.png` })
  const frozenAt = Number((await h.read()).match(/phase fight {3}frame (\d+)/)[1])
  await h.step(1)
  assert.match(await h.read(), /FROZEN 1\/2f/)
  assert.equal(Number((await h.read()).match(/phase fight {3}frame (\d+)/)[1]), frozenAt, 'the frame counter holds during the freeze')
  await h.step(1)
  assert.doesNotMatch(await h.read(), /FROZEN/)
  const afterWhite = await h.whitePixels()
  assert.ok(flashWhite > afterWhite + 500, `the struck fighter flashes white: ${flashWhite} vs ${afterWhite} white pixels`)
  report(`switches on: the same jab lands at 49.5 px, freezes 2 frames with the frame counter held, flash ${flashWhite} vs ${afterWhite} white px`)

  // Sweep through a standing guard: corner booster, bring oracle in, booster holds away.
  const sweep = async () => {
    await h.fresh()
    await h.step(160, ['KeyA', 'ArrowLeft']) // both walk left so booster reaches the wall (max separation 272)
    await h.step(Math.round(await h.separation()) - 30, ['ArrowLeft']) // oracle walks in to about 30 px
    await h.page.keyboard.press('Period')
    const before = await h.frameNow()
    await h.step(10, ['KeyA'])
    if (await h.page.locator('#pg-rule-useBounds').isChecked()) assert.doesNotMatch(await h.read(), /heavy block — brace/)
    await h.step(4, ['KeyA'])
    return h.logSince(before)
  }
  const through = await sweep()
  assert.match(through, /HIT {6}oracle\.hardCutoff/)
  await h.page.screenshot({ path: `${out}sweep-through-guard-1440.png` })

  // Bounds extend Booster's guarded heavy beyond its legacy 38 px reach.
  await h.fresh()
  await h.step(300, ['KeyD', 'ArrowRight'])
  // Backward shuffle uses its slower speed; measure the resulting native gap.
  await h.step(18, ['KeyA'])
  const heavyGap = await h.separation()
  assert.ok(heavyGap >= 44 && heavyGap < 46, `boxed heavy gap ${heavyGap} must exceed legacy reach 38`)
  await h.page.keyboard.press('KeyK')
  const heavyBefore = await h.frameNow()
  await h.step(5, ['ArrowRight'])
  assert.match(await h.read(), /heavy block — brace/)
  // The button's first tick starts at move frame zero; contact follows 11 startup ticks.
  await h.step(7, ['ArrowRight'])
  assert.match(await h.logSince(heavyBefore), /block {4}booster\.staticFire.*stop 4f/)
  assert.match(await h.read(), /heavy block — compress/)
  assert.match(await h.read(), /FROZEN 4\/4f/)
  await h.page.screenshot({ path: `${out}heavy-guard-beyond-reach-1440.png` })
  report(`a boxed heavy at ${heavyGap} px anticipates guard, blocks and freezes for 4 frames beyond legacy 38 px reach`)

  await h.setRule('useBounds', false)
  await h.setRule('hitstop', false)
  const held = await sweep()
  assert.match(held, /block {4}oracle\.hardCutoff/)
  report('a cornered booster holding away blocks Hard Cutoff with the switches off; with hits by boxes on it goes through')

  await h.page.locator('#pg-reset').click()
  await h.tick(20)
  await enabled()
  await h.fresh()
  for (const width of [375, 768, 1440]) {
    await h.page.setViewportSize({ width, height: 1100 })
    await h.tick(20)
    assert.equal(await h.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await enabled()
    await h.page.screenshot({ path: `${out}playground-rules-${width}.png`, fullPage: true })
  }
  report('both enabled controls remain accessible without overflow at 375, 768 and 1440 px')
  await h.page.close()

  const reduced = await open(1440, true)
  await reduced.setRule('useBounds', true)
  await reduced.setRule('hitstop', true)
  const reducedHit = await jabAt49(reduced)
  assert.match(reducedHit, /stop 2f/)
  assert.match(await reduced.read(), /FROZEN 2\/2f/)
  const reducedFlash = await reduced.whitePixels()
  await reduced.step(2)
  const reducedAfter = await reduced.whitePixels()
  assert.ok(Math.abs(reducedFlash - reducedAfter) < 200, `no flash under reduced motion: ${reducedFlash} vs ${reducedAfter}`)
  await reduced.page.screenshot({ path: `${out}jab-by-boxes-reduced-motion-1440.png` })
  report(`reduced motion: the freeze still happens, no flash (${reducedFlash} vs ${reducedAfter} white px)`)
  await reduced.page.close()
} finally {
  await browser.close()
}
assert.deepEqual(errors, [], `console errors: ${errors.join(' | ')}`)
report('no console errors')
