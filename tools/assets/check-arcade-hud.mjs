/**
 * Local-only proof for the arcade HUD.
 *
 * Start Vite, then `ARCADE_HUD_URL=http://127.0.0.1:<port>/dev/arcade.html node
 * tools/assets/check-arcade-hud.mjs`. Everything here is a pixel measurement, because
 * "the HUD looks better" is exactly the kind of claim a screenshot cannot settle: it
 * asserts the round card appears and then clears, that a hit leaves a readable damage
 * trail that later drains away, and that the portraits and clock actually rendered.
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const base = process.env.ARCADE_HUD_URL ?? 'http://127.0.0.1:5319/dev/arcade.html'
const out = process.env.ARCADE_EVIDENCE_DIR ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, '/') : new URL('../../preview-renders/mars-arcade/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const report = message => console.log(`PASS ${message}`)

const SCALE = 3
const hex = value => '#' + value.toString(16).padStart(6, '0')

/** Count pixels of each colour inside a stage-space rectangle. */
function census(page, x, y, width, height) {
  return page.evaluate(([sx, sy, sw, sh, scale]) => {
    const canvas = document.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const { data } = ctx.getImageData(sx * scale, sy * scale, sw * scale, sh * scale)
    const counts = {}
    for (let i = 0; i < data.length; i += 4) {
      const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]
      counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  }, [x, y, width, height, SCALE])
}

const countOf = (counts, colour) => counts[parseInt(colour.slice(1), 16)] ?? 0

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install()
  await page.goto(base)
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('sprites ready'))
  const tick = ms => page.clock.runFor(ms)
  const text = () => page.locator('#readout').innerText()
  const stage = page.locator('canvas')

  // --- the round card, during the intro -----------------------------------
  await tick(120)
  const bannerBand = () => census(page, 0, 34, 320, 22)
  const bannerColour = '#ffd23f'
  assert.ok(countOf(await bannerBand(), bannerColour) > 200, 'no round card during the intro')
  await stage.screenshot({ path: `${out}hud-round-card.png` })
  report('the round card is on screen during the intro')

  // --- and it clears once the fight has started ---------------------------
  await tick(2200)
  assert.match(await text(), /phase fight/)
  assert.equal(countOf(await bannerBand(), bannerColour), 0, 'the banner never cleared')
  report('the banner clears after the call to fight')

  // --- portraits and clock actually rendered ------------------------------
  const portrait = await census(page, 2, 2, 22, 24)
  assert.ok(Object.keys(portrait).length > 12, `portrait is flat: ${Object.keys(portrait).length} colours`)
  const clock = await census(page, 140, 2, 40, 20)
  assert.ok(countOf(clock, '#ffffff') > 40, 'the clock digits did not render')
  report(`portrait drawn (${Object.keys(portrait).length} colours) and the clock is legible`)

  // --- a hit leaves a readable damage trail -------------------------------
  // The vitals box: health, divider and guard inside one slanted frame.
  const healthBar = () => census(page, 28, 2, 110, 15)
  const trail = '#fff0d0'
  assert.equal(countOf(await healthBar(), trail), 0, 'a trail was showing before any hit')

  await page.locator('[data-command="KeyT"]').click()
  await tick(40)
  await page.keyboard.down('KeyD')
  await page.keyboard.down('ArrowLeft')
  await tick(900)
  await page.keyboard.up('KeyD')
  await page.keyboard.up('ArrowLeft')
  let landed = 0
  for (let attempt = 0; attempt < 8 && landed === 0; attempt += 1) {
    await page.keyboard.press('Comma')
    await tick(220)
    landed = countOf(await healthBar(), trail)
  }
  assert.ok(landed > 60, `no damage trail after a hit (${landed} px)`)
  await stage.screenshot({ path: `${out}hud-damage-trail.png` })
  report(`a hit leaves a ${landed} px damage trail on the health bar`)

  // --- and the trail drains away ------------------------------------------
  await tick(2000)
  assert.equal(countOf(await healthBar(), trail), 0, 'the damage trail never drained')
  report('the trail drains back to the new health')

  // --- the segmented meter and the name plate -----------------------------
  const meterBand = await census(page, 102, 19, 36, 9)
  assert.ok(countOf(meterBand, '#241f42') > 200, 'the meter is not segmented — no empty chunks')
  const plate = await census(page, 28, 19, 72, 9)
  assert.ok(countOf(plate, '#181530') > 400, 'the name is not sitting on a plate')
  assert.ok(countOf(plate, '#f4e6d2') > 80, 'the name did not render on the plate')
  report('the meter reads as chunks and the name sits on a plate')

  // --- the slant is actually cut ------------------------------------------
  // Two-sided, so it cannot pass by the bar simply being absent: the inner end is
  // full width along the top rows and short by the 5 px skew along the bottom ones.
  const topCorner = await census(page, 135, 2, 3, 2)
  const bottomCorner = await census(page, 135, 15, 3, 2)
  assert.ok(countOf(topCorner, '#10101c') > 0, 'the bar does not reach its inner end at the top')
  assert.equal(countOf(bottomCorner, '#10101c'), 0, 'the inner end was not cut on a slant')
  report('the vitals bar is square at the top and cut on a slant at the bottom')

  // --- the end-of-round card ----------------------------------------------
  await tick(70000)
  const endPhase = (await text()).match(/phase (\w+)/)[1]
  assert.ok(['ko', 'timeOver'].includes(endPhase), `round did not end: ${endPhase}`)
  assert.ok(countOf(await bannerBand(), bannerColour) > 150, 'no end-of-round card')
  const subtitleBand = await census(page, 0, 61, 320, 15)
  assert.ok(countOf(subtitleBand, '#f0dcc0') > 60, 'the winner line did not render')
  await stage.screenshot({ path: `${out}hud-round-end.png` })
  report(`the round ended on ${endPhase} and the card names the winner`)

  await page.setViewportSize({ width: 375, height: 900 })
  await tick(60)
  await page.waitForFunction(() => document.querySelector('canvas').getBoundingClientRect().width === 320)
  await page.screenshot({ path: `${out}hud-375.png`, fullPage: true })
  report('HUD holds together at the 375 px integer scale')

  assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`)
  report('no uncaught browser errors')
} finally {
  await browser.close()
}
