/** Real-time native-control heavy-attack recording. */
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const out = new URL('../../preview-renders/mars-arcade/outcomes-v1/regressions/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1300 },
    recordVideo: { dir: out + 'recording-sources', size: { width: 1440, height: 1300 } },
  })
  const page = await context.newPage()
  await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('38/38 sprites ready'))
  await page.locator('[data-command="KeyT"]').click()
  await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('phase fight'))
  await page.keyboard.down('KeyD')
  await page.keyboard.down('ArrowLeft')
  await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('separation 24.0px'))
  await page.keyboard.up('KeyD')
  await page.keyboard.up('ArrowLeft')
  await page.locator('[data-command="KeyS"]').click()
  for (const side of [1, 2, 1, 2]) {
    await page.getByRole('button', { name: 'P' + side + ' heavy', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('activity   attack'))
    await page.waitForFunction(() => !document.querySelector('#readout').textContent.includes('activity   attack'))
    await page.waitForTimeout(180)
  }
  await page.locator('[data-command="Space"]').click()
  console.log(await page.locator('#log').innerText())
  const video = page.video()
  await context.close()
  await video.saveAs(out + 'heavy-motion-half.webm')
} finally { await browser.close() }
