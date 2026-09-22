/** Local-only visual/interaction proof. Start Vite on 5317, then node this file. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const base = process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html'
const out = process.env.ARCADE_EVIDENCE_DIR ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, "/") : new URL('../../preview-renders/mars-arcade/outcomes-v1/regressions/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
const report = message => console.log(`PASS ${message}`)
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install()
  await page.goto(base)
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('46/46 sprites ready'))
  const text = () => page.locator('#readout').innerText()
  const frame = async () => Number((await text()).match(/frame (\d+)/)[1])
  const tick = ms => page.clock.runFor(ms)
  const command = async code => {
    await page.locator(`[data-command="${code}"]`).click()
    await tick(20)
  }
  await command('KeyT')
  await tick(1700)
  assert.match(await text(), /phase fight/)
  await command('Space')
  const pausedFrame = await frame()
  await tick(1000)
  assert.equal(await frame(), pausedFrame)
  await command('KeyN')
  assert.equal(await frame(), pausedFrame + 1)
  report('assets loaded; pause freezes simulation; step advances exactly one frame')

  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1100 })
    await tick(40)
    const expectedWidth = width === 375 ? 320 : width === 768 ? 640 : 960
    await page.waitForFunction(expected => document.querySelector('canvas').getBoundingClientRect().width === expected, expectedWidth)
    const geometry = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
      stage: document.querySelector('canvas').getBoundingClientRect().width,
    }))
    assert.ok(geometry.scroll <= geometry.width, `horizontal overflow at ${width}`)
    assert.equal(geometry.stage, expectedWidth)
    await page.screenshot({ path: `${out}wave-1-pilot-${width}.png`, fullPage: true })
    if (width === 1440) await page.locator('canvas').screenshot({ path: `${out}wave-1-pilot-stage.png` })
  }
  report('375/768/1440 responsive layouts, no overflow, integer stage scaling; screenshots saved')

  // Space belongs to the focused native button; it must not also toggle the global shortcut.
  await page.locator('[data-command="Space"]').focus()
  await page.keyboard.press('Space')
  await tick(40)
  assert.doesNotMatch(await text(), /PAUSED/)
  await page.keyboard.down('KeyD')
  await page.keyboard.down('ArrowLeft')
  await tick(700)
  await page.keyboard.up('KeyD')
  await page.keyboard.up('ArrowLeft')
  await tick(40)
  assert.match(await text(), /separation 24\.0px/)
  await page.keyboard.press('KeyJ')
  await tick(150)
  assert.match(await page.locator('#log').innerText(), /HIT.*booster.padJab/)
  report('native keyboard activation and P1/P2 movement work; close jab hits')

  await tick(300)
  await page.keyboard.down('ArrowRight')
  await page.keyboard.press('KeyK')
  await tick(400)
  await page.keyboard.up('ArrowRight')
  assert.match(await page.locator('#log').innerText(), /block.*booster.staticFire/)
  report('move-away guard blocks an attack')

  await tick(500)
  await page.keyboard.press('KeyW')
  await tick(100)
  assert.match(await text(), /activity   airborne/)
  assert.match(await text(), /jump rising/)
  await tick(900)
  assert.doesNotMatch((await text()).split('THE ORACLE')[0], /activity   airborne/)
  report('jump and landing update real state and use authored jump artwork')

  await command('Space')
  await page.getByRole('button', { name: 'P1 heavy', exact: true }).focus()
  await page.keyboard.press('Enter')
  await command('KeyN')
  assert.match(await text(), /booster.staticFire/)
  report('native attack tap is retained while paused and delivered on step')

  // Blur cancels queued taps; restarting also clears commands from the old round.
  await page.keyboard.press('KeyL')
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await command('KeyR')
  assert.equal(await frame(), 0)
  await command('mirror')
  assert.equal(await page.locator('[data-fighter="1"]').inputValue(), 'booster')
  assert.equal((await text()).match(/THE BOOSTER/g).length, 2)
  await page.locator('[data-fighter="1"]').selectOption('captain')
  await tick(20)
  assert.match(await text(), /THE CAPTAIN/)
  report('restart, mirror preset and identity selector work')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('reduced motion: static idle'))
  assert.match(await page.locator('#asset-status').innerText(), /reduced motion: static idle/)
  await page.reload()
  await tick(100)
  assert.equal(await page.locator('[data-fighter="1"]').inputValue(), 'oracle')
  report('reduced-motion preference honored; reload starts a fresh dev round')

  await command('KeyT')
  await command('mirror')
  await tick(1700)
  const position = async () => Number((await text()).match(/position   x (-?[\d.]+)/)[1])
  const initialX = await position()
  const right = page.getByRole('button', { name: 'P1 right', exact: true })
  const rect = await right.boundingBox()
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
  await page.mouse.down()
  await tick(250)
  await page.mouse.move(2, 2)
  await page.mouse.up()
  await tick(40)
  const releasedX = await position()
  assert.ok(releasedX > initialX)
  await tick(300)
  assert.equal(await position(), releasedX)
  await command('Space')
  await page.keyboard.press('KeyJ')
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await command('KeyN')
  assert.doesNotMatch(await text(), /booster.padJab/)
  report('pointer hold moves; release outside clears it; blur discards a paused attack tap')

  const spriteCanvas = await page.locator('canvas').screenshot()
  await command('KeyV')
  assert.notDeepEqual(await page.locator('canvas').screenshot(), spriteCanvas)
  assert.match(await text(), /artwork    boxes/)
  report('explicit box mode remains available')

  const missing = await browser.newPage({ viewport: { width: 768, height: 1100 } })
  missing.on('pageerror', error => errors.push(error.message))
  await missing.route('**/art-source/arcade/**', route => route.abort())
  await missing.goto(base)
  await missing.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('46 failed'))
  assert.match(await missing.locator('#asset-status').innerText(), /box fallback/)
  await missing.getByRole('button', { name: 'Pause', exact: true }).click()
  await missing.screenshot({ path: `${out}wave-1-pilot-missing-art.png`, fullPage: true })
  report('all forty-six failed image requests use visible box fallback without crashing')
  assert.deepEqual(errors, [])
  report('no uncaught browser errors')
} finally {
  await browser.close()
}
