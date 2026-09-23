/** Real browser proof of the bounded exchange; start Vite on 5317 first. */
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
  page.on('pageerror', e => errors.push(e.message))
  // Observe actual draw calls, not only the text readout or selector in isolation.
  await page.addInitScript(() => {
    window.drawnSprites = []
    const original = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (image instanceof HTMLImageElement && !window.drawnSprites.includes(image.src)) window.drawnSprites.push(image.src)
      return original.call(this, image, ...args)
    }
  })
  await page.clock.install()
  await page.goto(base)
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('51/51 sprites ready'))
  const read = () => page.locator('#readout').innerText()
  const frame = async () => Number((await read()).match(/frame (\d+)/)[1])
  const tick = ms => page.clock.runFor(ms)
  const command = async code => { await page.locator(`[data-command="${code}"]`).click(); await tick(20) }
  await command('exchange')
  assert.match(await read(), /Exchange review/)
  await command('Space')
  const paused = await frame()
  await tick(200)
  assert.equal(await frame(), paused)
  const toFrame = async target => {
    while (await frame() < target) await command('KeyN')
    assert.equal(await frame(), target)
  }
  await toFrame(163)
  assert.match(await read(), /guarded backward shuffle/)
  await page.locator('canvas').screenshot({ path: `${out}sam-catch-up.png` })
  await toFrame(167)
  assert.match(await read(), /jab active/)
  assert.match(await read(), /raised guard/)
  assert.match(await page.locator('#log').innerText(), /block.*booster.padJab/)
  await page.locator('canvas').screenshot({ path: `${out}exchange-block.png` })
  await toFrame(170)
  assert.match(await read(), /jab recovery/)
  await page.locator('canvas').screenshot({ path: `${out}exchange-recovery.png` })
  await toFrame(180)
  assert.match(await read(), /guarded backward shuffle/)
  await page.locator('canvas').screenshot({ path: `${out}sam-rear-plant.png` })
  await toFrame(186)
  assert.match((await read()).split('THE ORACLE')[1], /idle pilot/)
  await toFrame(227)
  assert.match(await read(), /jab active/)
  assert.match(await read(), /hit recoil/)
  assert.match(await page.locator('#log').innerText(), /HIT.*booster.padJab/)
  await page.locator('canvas').screenshot({ path: `${out}exchange-hit.png` })
  report('paused review advances one real tick per step; block and hit use active jab artwork')
  await toFrame(331)
  assert.match((await read()).split('THE ORACLE')[1], /jab startup/)
  await page.locator('canvas').screenshot({ path: `${out}sam-startup.png` })
  await toFrame(336)
  assert.match((await read()).split('THE ORACLE')[1], /jab active/)
  assert.match((await read()).split('THE ORACLE')[0], /raised guard/)
  assert.match(await page.locator('#log').innerText(), /block.*oracle.prompt/)
  await page.locator('canvas').screenshot({ path: `${out}sam-blocked.png` })
  await toFrame(338)
  assert.match((await read()).split('THE ORACLE')[1], /jab recovery/)
  await page.locator('canvas').screenshot({ path: `${out}sam-recovery.png` })
  await toFrame(416)
  assert.match((await read()).split('THE ORACLE')[1], /jab active/)
  assert.match((await read()).split('THE ORACLE')[0], /hit recoil/)
  assert.match(await page.locator('#log').innerText(), /HIT.*oracle.prompt/)
  await page.locator('canvas').screenshot({ path: `${out}sam-hit.png` })
  report('Sam wind-up, blocked jab, pullback and clean hit draw with Elon block/recoil at real engine frames')
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1100 })
    await tick(40)
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth)
    await page.screenshot({ path: `${out}exchange-${width}.png`, fullPage: true })
  }
  await command('Space')
  await tick(3000)
  assert.match(await read(), /Exchange complete/)
  assert.equal(await frame(), 460)
  assert.match(await read(), /PAUSED/)
  assert.equal(await page.locator('[data-command="Space"]').isDisabled(), true)
  const log = await page.locator('#log').innerText()
  assert.equal((log.match(/block/g) ?? []).length, 2)
  assert.equal((log.match(/HIT/g) ?? []).length, 2)
  const drawn = await page.evaluate(() => window.drawnSprites)
  for (const path of ['walk/walk-00', 'walk/walk-01', 'walk-back/walk-back-00', 'walk-back/walk-back-01', 'anticipation/anticipation-00', 'jab/jab-00', 'recovery/recovery-00', 'block/block-00', 'recoil/recoil-00']) {
    assert.ok(drawn.some(src => src.includes(path)), `never drew ${path}`)
  }
  assert.ok(drawn.filter(src => src.includes('/booster/')).every(src => src.includes('/normalised-sleek-ready/')))
  const counterPaths = [
    'oracle/normalised-counterattack-ready/anticipation/',
    'oracle/normalised-counterattack-ready/jab/',
    'oracle/normalised-counterattack-ready/recovery/',
    'booster/normalised-sleek-ready/block/',
    'booster/normalised-sleek-ready/recoil/',
  ]
  for (const path of counterPaths) assert.ok(drawn.some(src => src.includes(path)), `never drew ${path}`)
  report('actual canvas draws both fighters attacks/reactions; two blocks, two hits, clean stop')
  await command('exchange')
  await tick(100)
  assert.match(await read(), /Exchange review/)
  assert.ok(await frame() < 90)
  await page.locator('[data-fighter="1"]').selectOption('captain')
  await tick(20)
  assert.match(await read(), /Free play/)
  assert.match(await read(), /THE CAPTAIN/)
  await command('exchange')
  await command('KeyR')
  assert.match(await read(), /Free play/)
  await command('exchange')
  await page.keyboard.press('KeyJ')
  await tick(20)
  assert.match(await read(), /Free play/)
  await command('exchange')
  await command('KeyT')
  assert.match(await read(), /Free play/)
  await command('freeplay')
  assert.match(await read(), /CPU \(veteran\)/)
  assert.match(await read(), /speed 1x/)
  report('replay resets; fighter change, restart, combat input and CPU toggle exit the recording; Free play restores CPU')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => { window.drawnSprites = [] })
  await command('exchange')
  await tick(16000)
  assert.match(await read(), /Exchange complete/)
  assert.match(await page.locator('#asset-status').innerText(), /reduced motion/)
  const reducedDraws = await page.evaluate(() => window.drawnSprites)
  for (const path of ['/walk/', 'walk-back/walk-back-00', 'walk-back/walk-back-01', '/jab/', '/recovery/', '/block/', '/recoil/']) {
    assert.ok(reducedDraws.some(src => src.includes(path)), `reduced motion never drew ${path}`)
  }
  assert.ok(!reducedDraws.some(src => src.includes('idle/idle-01')))
  for (const path of counterPaths) assert.ok(reducedDraws.some(src => src.includes(path)), `reduced motion never drew ${path}`)
  report('reduced motion retains essential action poses and completes the exchange')
  await page.reload()
  await tick(100)
  assert.match(await read(), /Free play/)

  // Failure of just the active pose must fall back during contact, not blank the fighter.
  const missing = await browser.newPage({ viewport: { width: 768, height: 1100 } })
  missing.on('pageerror', e => errors.push(e.message))
  await missing.route('**/normalised-counterattack-ready/jab/jab-00.png', route => route.abort())
  await missing.clock.install()
  await missing.goto(base)
  await missing.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('1 failed'))
  await missing.locator('[data-command="exchange"]').click()
  await missing.clock.runFor(16000)
  assert.match(await missing.locator('#log').innerText(), /block.*oracle.prompt/)
  assert.match(await missing.locator('#log').innerText(), /HIT.*oracle.prompt/)
  assert.match(await missing.locator('#asset-status').innerText(), /50\/51 sprites ready; 1 failed — box fallback/)
  assert.match(await missing.locator('#readout').innerText(), /Exchange complete/)
  report('reload leaves review mode; a missing Sam jab uses box fallback without blocking the counterattack')
  assert.deepEqual(errors, [])
  report('no uncaught browser errors')
} finally {
  await browser.close()
}
