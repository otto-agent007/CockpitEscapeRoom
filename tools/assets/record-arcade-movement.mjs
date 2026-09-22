/** Real-time native-control movement recording. No clock or rules overrides. */
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const out = new URL('../../preview-renders/mars-arcade/outcomes-v1/regressions/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: { width: 1100, height: 1400 },
    recordVideo: { dir: `${out}recording-sources`, size: { width: 1100, height: 1400 } },
  })
  const page = await context.newPage()
  await page.goto(process.env.ARCADE_PILOT_URL ?? 'http://127.0.0.1:5317/dev/arcade.html')
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('38/38 sprites ready'))
  await page.locator('[data-command="KeyT"]').click()
  await page.locator('[data-command="KeyS"]').click()
  await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('phase fight'))
  for (let pass = 0; pass < 2; pass++) {
    await page.keyboard.down('ArrowLeft')
    await page.waitForTimeout(450) // A real held input, not a simulation-clock override.
    await page.keyboard.up('ArrowLeft')
    await page.getByRole('button', { name: 'P1 jump', exact: true }).click()
    await page.getByRole('button', { name: 'P2 jump', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('#readout').textContent.includes('jump'))
    await page.waitForFunction(() => !document.querySelector('#readout').textContent.includes('activity   airborne'))
  }
  await page.locator('[data-command="Space"]').click()
  console.log(await page.locator('#readout').innerText())
  const video = page.video()
  await context.close()
  await video.saveAs(`${out}movement-motion-half.webm`)
} finally { await browser.close() }
