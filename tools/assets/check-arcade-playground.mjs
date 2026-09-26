/**
 * Browser proof for the fighter playground console on /dev/arcade.html.
 *
 *   ARCADE_PILOT_URL=http://127.0.0.1:5360/dev/arcade.html node tools/assets/check-arcade-playground.mjs
 *
 * Proves the tuning console is wired: the shipped tuning loads, a walk-speed edit is
 * felt in the fight on the next frames, reset returns to the content, the authored
 * hurt and attack boxes draw on the sprites when toggled, the title names the match,
 * and the page has no console errors. Save is not exercised: it would rewrite the
 * committed tuning file from a test.
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5360/dev/arcade.html'
const out = process.env.ARCADE_EVIDENCE_DIR ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, '/') : new URL('../../preview-renders/mars-arcade/playground-v1/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
const report = (line) => console.log(`ok - ${line}`)
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.clock.install()
  await page.goto(url)
  await page.waitForFunction(() => /^(\d+)\/\1 sprites ready/.test(document.querySelector('#asset-status').textContent))
  const tick = (ms) => page.clock.runFor(ms)
  const read = () => page.locator('#readout').innerText()
  const positionOf = async (side) => [...(await read()).matchAll(/position   x (-?[\d.]+)/g)].map((m) => Number(m[1]))[side]

  // The title bar is rendered uppercase by the shell stylesheet.
  assert.equal((await page.locator('#stage-title').innerText()).toLowerCase(), 'the booster vs the oracle (cpu)')
  assert.match(await page.locator('#pg-status').innerText(), /shipped tuning in force/)
  assert.equal(await page.locator('#pg-walkSpeed').inputValue(), '1.25')
  assert.equal(await page.locator('#pg-light-damage').inputValue(), '5')
  report('shipped tuning loaded: booster walk 1.25, jab damage 5; title names the match')

  // Walk P1 right for 30 frames at the shipped speed, then at a tuned speed.
  await page.locator('[data-command="KeyT"]').click() // human P2, so the CPU does not close in
  await tick(1700)
  const before = await positionOf(0)
  await page.keyboard.down('KeyD'); await tick(500); await page.keyboard.up('KeyD')
  const shipped = (await positionOf(0)) - before
  await page.locator('#pg-walkSpeed').fill('2.5')
  await page.locator('#pg-walkSpeed').blur()
  assert.match(await page.locator('#pg-status').innerText(), /applied/)
  const mid = await positionOf(0)
  await page.keyboard.down('KeyA'); await tick(500); await page.keyboard.up('KeyA')
  const tuned = mid - (await positionOf(0))
  assert.ok(shipped > 0 && tuned > shipped * 1.6, `tuned walk must be about 2x the shipped one: ${shipped} vs ${tuned}`)
  report(`walk speed edit is felt in the fight: ${shipped.toFixed(1)} px at 1.25, ${tuned.toFixed(1)} px at 2.5`)

  await page.locator('#pg-reset').click()
  assert.equal(await page.locator('#pg-walkSpeed').inputValue(), '1.25')
  assert.match(await page.locator('#pg-status').innerText(), /reset/)
  report('reset returns the fields to the baked content')

  // Authored boxes: toggling hurt off changes what is drawn; the jab's active frame draws its hitbox.
  const pixels = async () => page.locator('#stage').evaluate((canvas) => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    let sum = 0
    for (let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2]
    return sum
  })
  await page.locator('[data-command="Space"]').click() // pause so the frame is stable
  const withHurt = await pixels()
  await page.locator('#pg-show-hurt').uncheck()
  await tick(40)
  const withoutHurt = await pixels()
  assert.notEqual(withHurt, withoutHurt, 'hurt boxes must draw on the sprites')
  await page.locator('#pg-show-hurt').check()
  // Step to the active frame instead of timing it: a fixed 90 ms landed a frame early or
  // late about one run in four. A tap made while paused is delivered on the next step.
  await page.locator('body').click({ position: { x: 5, y: 5 } }) // keys are ignored while a field has focus
  await page.keyboard.press('KeyJ')
  for (let step = 0; step < 12 && !/jab active/.test(await read()); step++) {
    await page.locator('[data-command="KeyN"]').click()
  }
  assert.match(await read(), /jab active/)
  await page.screenshot({ path: `${out}playground-jab-active.png` })
  report('authored boxes draw on the sprites; jab active frame captured with its hitbox')

  // Candidate clips: ticking one plays it in the fight in place of the shipped clip.
  const drawnVideo = () => page.evaluate(() => [...(window.__drawn ?? [])].some((src) => src.includes('walk-video-wan')))
  await page.evaluate(() => {
    window.__drawn = new Set()
    const original = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (image instanceof HTMLImageElement) window.__drawn.add(image.src)
      return original.call(this, image, ...args)
    }
  })
  await page.locator('[data-command="Space"]').click() // resume
  await page.locator('[data-command="KeyR"]').click(); await tick(1700)
  await page.keyboard.down('ArrowLeft'); await tick(400); await page.keyboard.up('ArrowLeft')
  assert.equal(await drawnVideo(), false, 'the shipped walk plays until a candidate is ticked')
  const candidate = page.locator('#pg-candidates input').first()
  await candidate.check()
  await page.locator('body').click({ position: { x: 5, y: 5 } }) // keys are ignored while a field has focus
  assert.match(await page.locator('#pg-status').innerText(), /a preview, not shipped/)
  await page.keyboard.down('ArrowLeft'); await tick(400); await page.keyboard.up('ArrowLeft')
  assert.equal(await drawnVideo(), true, 'the candidate walk must draw in the fight once ticked')
  await candidate.uncheck()
  report('a ticked candidate clip plays in the fight in place of the shipped one')

  await page.locator('#arcade-collapse').click()
  assert.equal(await page.locator('#arcade-console').getAttribute('data-collapsed'), 'true')
  await page.locator('#arcade-collapse').click()
  report('console collapses and expands')
  await page.setViewportSize({ width: 768, height: 1100 })
  await page.screenshot({ path: `${out}playground-768.png`, fullPage: true })
  await page.close()
} finally {
  await browser.close()
}
assert.deepEqual(errors, [], `console errors: ${errors.join(' | ')}`)
report('no console errors')
