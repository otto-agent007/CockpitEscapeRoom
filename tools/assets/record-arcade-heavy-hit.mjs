/** Native-input heavy hit exchange, normal or half speed, both facings. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = process.env.ARCADE_EVIDENCE_DIR ?? 'preview-renders/mars-arcade/heavy-hit-v1/after'
await mkdir(out, { recursive: true })
const attacker = process.env.ARCADE_HEAVY_ATTACKER ?? 'booster'
assert.ok(['booster', 'oracle'].includes(attacker))
const defender = attacker === 'booster' ? 'oracle' : 'booster'
const moveId = attacker === 'booster' ? 'booster.staticFire' : 'oracle.hardCutoff'
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1100, height: 1400 }, recordVideo: { dir: out + '/sources', size: { width: 1100, height: 1400 } } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5349/dev/arcade.html')
  await page.waitForFunction(() => /^(\d+)\/\1 sprites ready$/.test(document.querySelector('#asset-status').textContent))
  await page.locator('[data-command="KeyT"]').click()
  await page.locator('[data-command="KeyH"]').click()
  const half = process.env.ARCADE_MOTION_SPEED === '0.5'
  if (half) await page.locator('[data-command="KeyS"]').click()
  for (const side of [0, 1]) {
    await page.locator('[data-fighter="0"]').selectOption(side === 0 ? attacker : defender)
    await page.locator('[data-fighter="1"]').selectOption(side === 0 ? defender : attacker)
    await page.locator('canvas').click()
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('phase fight'))
    for (let cycle = 0; cycle < 2; cycle++) {
      await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowLeft')
      await page.waitForTimeout(half ? 1400 : 700)
      await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowLeft')
      const before = await page.locator('#log').innerText()
      await page.getByRole('button', { name: 'P' + (side + 1) + ' heavy', exact: true }).click()
      await page.waitForFunction(({ old, moveId }) => {
        const log = document.querySelector('#log').textContent
        return log !== old && log.includes(moveId) && log.includes('HIT')
      }, { old: before, moveId })
      await page.waitForTimeout(half ? 1500 : 900)
      assert.doesNotMatch(await page.locator('#readout').innerText(), /activity   (attack|hitstun)/)
    }
  }
  await page.locator('[data-command="Space"]').click()
  assert.deepEqual(errors, [])
  const video = page.video()
  await context.close()
  await video.saveAs(out + '/heavy-hit-' + (half ? 'half' : 'normal') + '.webm')
  console.log('PASS four native heavy hits, two per facing, return to stance; no page errors')
} finally { await browser.close() }
