/** Real-time native-input victories and knockdowns in both facings. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = new URL('../../preview-renders/mars-arcade/outcomes-v1/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1100, height: 1400 }, recordVideo: { dir: out + 'recording-sources', size: { width: 1100, height: 1400 } } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.match(/^(\d+)\/\1 sprites ready/))
  await page.locator('[data-command="mirror"]').click()
  await page.locator('[data-command="KeyT"]').click()
  await page.locator('[data-command="KeyH"]').click()
  for (const winner of [1, 2]) {
    if (winner === 2) await page.locator('[data-command="KeyR"]').click()
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('phase fight'))
    await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowLeft')
    let ended = false
    for (let attempt = 0; attempt < 60; attempt++) {
      await page.getByRole('button', { name: 'P' + winner + ' light', exact: true }).click()
      await page.waitForTimeout(300)
      if ((await page.locator('#readout').innerText()).includes('phase ko')) { ended = true; break }
    }
    await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowLeft')
    assert.ok(ended)
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('artwork    victory 2'))
    assert.match(await page.locator('#readout').innerText(), /artwork    knockout 2/)
    assert.match(await page.locator('#log').innerText(), new RegExp('K.O.  winner P' + winner))
    await page.waitForTimeout(1000)
    console.log('PASS real-time native KO outcome; winner P' + winner)
  }
  assert.deepEqual(errors, [])
  const video = page.video()
  await context.close()
  await video.saveAs(out + 'booster-outcomes-normal.webm')
} finally { await browser.close() }
