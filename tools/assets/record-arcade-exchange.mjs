/** Real-time motion evidence; start Vite on 5317. No simulation clock overrides. */
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const base = process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html'
const out = new URL('../../preview-renders/mars-arcade/outcomes-v1/regressions/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  for (const mode of ['half', 'normal']) {
    const context = await browser.newContext({
      viewport: { width: 1100, height: 940 },
      recordVideo: { dir: `${out}recording-sources`, size: { width: 1100, height: 940 } },
    })
    const page = await context.newPage()
    await page.goto(base)
    await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('51/51 sprites ready'))
    await page.locator('[data-command="exchange"]').click()
    if (mode === 'normal') {
      await page.locator('[data-command="KeyS"]').click()
      await page.locator('[data-command="KeyS"]').click()
    }
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('Exchange complete'), {}, { timeout: 20000 })
    console.log(mode, await page.locator('#log').innerText())
    const video = page.video()
    await context.close()
    await video.saveAs(`${out}exchange-motion-${mode}.webm`)
  }
} finally {
  await browser.close()
}
