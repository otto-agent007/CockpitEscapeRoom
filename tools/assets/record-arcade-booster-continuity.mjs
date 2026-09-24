/** Unoccluded native-control Booster heavy demonstration, both facings. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = process.env.ARCADE_EVIDENCE_DIR ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, "/") : new URL('../../preview-renders/mars-arcade/outcomes-v1/regressions/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const speed = process.env.ARCADE_MOTION_SPEED ?? '0.5'
assert.ok(['0.5', '1'].includes(speed))
try {
  const context = await browser.newContext({
    viewport: { width: 1100, height: 1400 },
    recordVideo: { dir: out + 'recording-sources', size: { width: 1100, height: 1400 } },
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('68/68 sprites ready'))
  await page.locator('[data-command="mirror"]').click()
  await page.locator('[data-command="KeyT"]').click()
  await page.locator('[data-command="KeyH"]').click()
  if (speed === '0.5') await page.locator('[data-command="KeyS"]').click()
  await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('phase fight'))
  for (const side of [1, 2, 1, 2]) {
    await page.getByRole('button', { name: 'P' + side + ' heavy', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('heavy startup'))
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('heavy startup — swing'))
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('heavy active'))
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('heavy recovery — guard'))
    await page.waitForFunction(() => !document.querySelector('#readout').textContent.includes('activity   attack'))
    await page.waitForTimeout(250)
  }
  await page.locator('[data-command="Space"]').click()
  assert.doesNotMatch(await page.locator('#readout').innerText(), /activity   attack/)
  assert.deepEqual(errors, [])
  console.log('PASS both Booster facings complete two native-input heavy cycles; no page errors')
  const video = page.video()
  await context.close()
  await video.saveAs(out + 'booster-heavy-' + (speed === '0.5' ? 'half' : 'normal') + '.webm')
} finally { await browser.close() }
