import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { STORAGE_KEY } from '../src/game/storage'

const settingKey = 'cockpit-escape-room-arcade-background'
async function enterArcade(page: Page, navigate = true) {
  if (navigate) await page.goto('/?skip3d=1')
  await expect(page.locator('.briefing-shell')).toBeVisible()
  for (const key of ['t', 'm', 'b']) await page.keyboard.down(key)
  await page.waitForTimeout(1600)
  for (const key of ['b', 'm', 't']) await page.keyboard.up(key)
  const frame = page.frameLocator('iframe[title="Mars arcade"]')
  await expect(frame.locator('#stage')).toBeVisible()
  return frame
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cockpit-escape-room-mars-arcade-unlock', JSON.stringify({ version: 1, completedOnce: true }))
    const images = new Set<string>()
    Object.defineProperty(window, '__backgroundPaints', { get: () => [...images] })
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function(...args: Parameters<typeof draw>) {
      const source = args[0]
      if (this.canvas.id === 'stage' && source instanceof HTMLImageElement && /backdrop-v1|moonbase-v1/.test(source.src)) images.add(source.src)
      return Reflect.apply(draw, this, args)
    }
  })
})

for (const width of [375, 768, 1440]) {
  for (const reduced of [false, true]) {
    test(`Mars and Moonbase render at ${width}px, reduced motion ${reduced}`, async ({ page }) => {
      const errors: string[] = [], moonRequests: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      page.on('request', request => { if (request.url().includes('moonbase-v1')) moonRequests.push(request.url()) })
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
      const frame = await enterArcade(page)
      const background = frame.getByRole('combobox', { name: 'Background', exact: true })
      await expect(background).toHaveValue('mars')
      await expect(frame.locator('#asset-status')).toContainText('5/5 backdrop layers ready')
      expect(moonRequests).toEqual([])
      await expect.poll(async () => Number((await frame.locator('#readout').textContent())?.match(/frame (\d+)/)?.[1] ?? 0)).toBeGreaterThanOrEqual(180)
      await frame.getByRole('button', { name: 'Pause', exact: true }).click()
      await expect(frame.getByRole('button', { name: 'Resume', exact: true })).toBeVisible()
      await expect(frame.locator('#readout')).toContainText('PAUSED')
      const before = await frame.locator('#readout').textContent()
      await background.selectOption('moonbase')
      await expect(frame.locator('#background-status')).toContainText('Moonbase ready')
      await expect(frame.locator('#stage')).toHaveAttribute('data-background', 'moonbase')
      await expect.poll(() => frame.locator('body').evaluate(() => (window as unknown as { __backgroundPaints: string[] }).__backgroundPaints.some(path => path.endsWith('/moonbase-v1/moonbase-panorama.png')))).toBe(true)
      expect(await frame.locator('#readout').textContent()).toBe(before)
      expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).background, settingKey)).toBe('moonbase')
      expect(await frame.locator('body').evaluate(element => element.scrollWidth <= innerWidth)).toBe(true)
      await frame.locator('body').evaluate(() => scrollTo(0, 0))
      if (process.env.ARCADE_EVIDENCE_DIR) {
        mkdirSync(process.env.ARCADE_EVIDENCE_DIR, { recursive: true })
        await page.screenshot({ path: `${process.env.ARCADE_EVIDENCE_DIR}/moonbase-${width}-${reduced ? 'reduced' : 'normal'}.png`, fullPage: true })
      }
      await background.focus()
      await page.keyboard.press('Home')
      await expect(background).toHaveValue('mars')
      await expect(frame.locator('#background-status')).toContainText('Mars ready')
      await background.selectOption('moonbase')
      await page.reload()
      await enterArcade(page, false)
      await expect(background).toHaveValue('moonbase')
      await expect(frame.locator('#background-status')).toContainText('Moonbase ready')
      await frame.getByRole('button', { name: 'Restart round' }).click()
      await expect(background).toHaveValue('moonbase')
      expect(errors).toEqual([])
    })
  }
}

test('missing Moonbase art can retry while native combat remains usable', async ({ page }) => {
  let blocked = true
  await page.route('**/moonbase-panorama.png', route => blocked ? route.abort() : route.continue())
  const frame = await enterArcade(page)
  await frame.getByRole('combobox', { name: 'Background', exact: true }).selectOption('moonbase')
  await expect(frame.getByRole('button', { name: 'Retry background' })).toBeVisible()
  await frame.getByRole('button', { name: 'P1 light' }).click()
  await expect(frame.locator('#stage')).toBeVisible()
  blocked = false
  await frame.getByRole('button', { name: 'Retry background' }).click()
  await expect(frame.locator('#background-status')).toContainText('Moonbase ready')
  await expect(frame.getByRole('button', { name: 'Retry background' })).toBeHidden()
})

test('a corrupt background setting and unavailable storage recover safely', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), settingKey)
  const frame = await enterArcade(page)
  const choice = frame.getByRole('combobox', { name: 'Background', exact: true })
  await expect(choice).toHaveValue('mars')
  await frame.locator('body').evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota') } })
  await choice.selectOption('moonbase')
  await expect(choice).toHaveValue('moonbase')
  await expect(frame.locator('#background-status')).toContainText('Moonbase ready')
})

test('Moonbase survives returning to the chapter and re-entering with T+M+B', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await expect(page.getByText('Bonus access', { exact: true })).toHaveCount(0)
  const before = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)
  for (const key of ['t', 'm', 'b']) await page.keyboard.down(key)
  await page.waitForTimeout(1600)
  for (const key of ['b', 'm', 't']) await page.keyboard.up(key)
  const frame = page.frameLocator('iframe[title="Mars arcade"]')
  await frame.getByRole('combobox', { name: 'Background', exact: true }).selectOption('moonbase')
  await expect(frame.locator('#background-status')).toContainText('Moonbase ready')
  await frame.getByRole('button', { name: 'Return to game', exact: true }).click()
  await expect(page.locator('.briefing-shell')).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(before)
  for (const key of ['t', 'm', 'b']) await page.keyboard.down(key)
  await page.waitForTimeout(1600)
  for (const key of ['t', 'm', 'b']) await page.keyboard.up(key)
  await expect(frame.getByRole('combobox', { name: 'Background', exact: true })).toHaveValue('moonbase')
  await expect(frame.locator('#background-status')).toContainText('Moonbase ready')
})

test('Moonbase has no scenery gaps at either real camera edge', async ({ page }) => {
  const frame = await enterArcade(page)
  await frame.getByRole('combobox', { name: 'Background', exact: true }).selectOption('moonbase')
  await expect(frame.locator('#background-status')).toContainText('Moonbase ready')
  await frame.getByRole('button', { name: 'Switch CPU / two players' }).click()
  await expect(frame.locator('#readout')).toContainText('P2 human')
  const canvas = frame.locator('#stage')
  for (const [one, two, limit] of [['a', 'ArrowLeft', -104], ['d', 'ArrowRight', 104]] as const) {
    await canvas.focus()
    await page.keyboard.down(one)
    await page.keyboard.down(two)
    await expect.poll(async () => Number((await frame.locator('#readout').textContent())?.match(/camera x (-?\d+)/)?.[1] ?? 0), { timeout: 12000 }).toBe(limit)
    await page.keyboard.up(two)
    await page.keyboard.up(one)
    const pixels = await canvas.evaluate((element: HTMLCanvasElement) => {
      const context = element.getContext('2d')!
      return [context.getImageData(0, 560, 1, 1).data[3], context.getImageData(element.width - 1, 560, 1, 1).data[3]]
    })
    expect(pixels).toEqual([255, 255])
    if (process.env.ARCADE_EVIDENCE_DIR) await page.screenshot({ path: `${process.env.ARCADE_EVIDENCE_DIR}/moonbase-camera-${limit < 0 ? 'left' : 'right'}.png`, fullPage: true })
  }
})
