import { expect, test, type Frame, type Page } from '@playwright/test'
import { holdForArcade } from './arcadeFlow'

const viewports = [
  { width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1440, height: 900 },
  { width: 667, height: 375 }, { width: 812, height: 375 }, { width: 932, height: 430 },
]

async function openArcade(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('cockpit-escape-room-mars-arcade-unlock', '{"version":1,"completedOnce":true}')
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Denied', 'NotAllowedError'))
  })
  await page.goto('/?skip3d=1')
  await expect(page.locator('.briefing-shell')).toBeVisible()
  await holdForArcade(page)
  const arcade = page.frames().find(frame => frame.url().includes('/mars-arcade.html'))!
  expect(await arcade.title()).toBe('CockpitEscapeRoom · Mars arcade')
  await expect(arcade.getByRole('button', { name: 'Start fight', exact: true })).toBeEnabled()
  return arcade
}

const tick = async (page: Frame) => Number((await page.locator('#readout').textContent())?.match(/frame (\d+)/)?.[1] ?? 0)
const position = async (page: Frame) => {
  const match = (await page.locator('#readout').textContent())?.match(/position\s+x (-?[\d.]+)\s+y (-?[\d.]+)/)
  return { x: Number(match?.[1]), y: Number(match?.[2]) }
}
async function advance(page: Frame, frames = 5) {
  const before = await tick(page)
  await expect.poll(() => tick(page)).toBeGreaterThanOrEqual(before + frames)
}

for (const viewport of viewports) {
  test(`selection and arena reserve controls at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize(viewport)
    const arcade = await openArcade(page)
    const start = await arcade.getByRole('button', { name: 'Start fight', exact: true }).boundingBox()
    expect(start!.y + start!.height).toBeLessThanOrEqual(viewport.height)
    await page.screenshot({ path: test.info().outputPath('selection.png') })
    await arcade.getByRole('button', { name: 'Start fight', exact: true }).click()
    await expect(arcade.locator('#stage')).toBeVisible()
    await expect(arcade.locator('#asset-status')).toContainText('5/5 backdrop layers ready')
    const arena = await arcade.locator('#stage').boundingBox()
    expect(arena!.width).toBeGreaterThan(300)
    expect(arena!.height).toBeGreaterThan(150)
    expect(arena!.width / arena!.height).toBeCloseTo(320 / 224, 1)
    for (const name of ['P1 left', 'P1 right', 'P1 jump', 'P1 light', 'P1 heavy', 'P1 special', 'Pause', 'Menu']) {
      const control = arcade.getByRole('button', { name, exact: true })
      await expect(control).toBeVisible()
      const box = await control.boundingBox()
      const minimum = name.startsWith('P1') ? 48 : 44
      expect(box!.width).toBeGreaterThanOrEqual(minimum)
      expect(box!.height).toBeGreaterThanOrEqual(minimum)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + .5)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + .5)
      const overlap = Math.min(box!.x + box!.width, arena!.x + arena!.width) > Math.max(box!.x, arena!.x)
        && Math.min(box!.y + box!.height, arena!.y + arena!.height) > Math.max(box!.y, arena!.y)
      expect(overlap, `${name} covers the arena`).toBe(false)
      if (name.startsWith('P1')) {
        if (viewport.width < viewport.height) expect(box!.y).toBeGreaterThanOrEqual(arena!.y + arena!.height)
        else expect(box!.x + box!.width <= arena!.x + .5 || box!.x >= arena!.x + arena!.width - .5).toBe(true)
      }
    }
    expect(await arcade.locator('body').evaluate(element => element.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
    await page.screenshot({ path: test.info().outputPath('arena.png') })
  })
}

test('menu pauses safely, traps focus, Escape keeps pause and Resume is explicit', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const arcade = await openArcade(page)
  await arcade.getByRole('button', { name: 'Start fight', exact: true }).click()
  await advance(arcade)
  await arcade.getByRole('button', { name: 'Menu', exact: true }).click()
  const menu = arcade.getByRole('dialog', { name: 'Arcade menu' })
  await expect(menu).toBeVisible()
  const frozen = await tick(arcade)
  await page.keyboard.press('d')
  await page.waitForTimeout(150)
  expect(await tick(arcade)).toBe(frozen)
  await page.keyboard.press('Shift+Tab')
  expect(await menu.evaluate(element => element.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(arcade.getByRole('button', { name: 'Menu', exact: true })).toBeFocused()
  await expect(arcade.getByRole('button', { name: 'Resume', exact: true })).toBeVisible()
  await page.waitForTimeout(150)
  expect(await tick(arcade)).toBe(frozen)
  await arcade.getByRole('button', { name: 'Resume', exact: true }).click()
  await advance(arcade)
  await arcade.getByRole('button', { name: 'Menu', exact: true }).click()
  await menu.getByRole('button', { name: 'Change player / battlefield', exact: true }).click()
  await expect(arcade.getByRole('heading', { name: 'Choose your player' })).toBeFocused()
  await expect(arcade.getByRole('button', { name: 'Start fight', exact: true })).toBeVisible()
})

test('real two-finger input survives one release and clears on cancel, menu, blur and resize', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 812, height: 375 }, hasTouch: true })
  const page = await context.newPage()
  const arcade = await openArcade(page)
  await arcade.getByRole('button', { name: 'Start fight', exact: true }).click()
  await arcade.getByRole('button', { name: 'Menu', exact: true }).click()
  await arcade.getByText('Match options', { exact: true }).click()
  await arcade.getByRole('button', { name: 'Switch CPU / two players', exact: true }).click()
  await arcade.getByRole('dialog').getByRole('button', { name: 'Resume', exact: true }).click()
  const cdp = await context.newCDPSession(page)
  const point = async (name: string, id: number) => {
    const box = await arcade.getByRole('button', { name, exact: true }).boundingBox()
    return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2, id }
  }
  const right = await point('P1 right', 1), jump = await point('P1 jump', 2)
  const before = await position(arcade)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right, jump] })
  await expect.poll(async () => (await position(arcade)).y).not.toBe(before.y)
  // CDP touchEnd lists the contacts to end, rather than the contacts remaining.
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [jump] })
  const moving = await position(arcade)
  // Horizontal motion resumes after landing under the unchanged combat rules.
  await expect.poll(async () => (await position(arcade)).x).toBeGreaterThan(moving.x)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  const stopped = (await position(arcade)).x
  await advance(arcade)
  expect((await position(arcade)).x).toBe(stopped)

  // Each lifecycle boundary must clear a live physical pointer before play resumes.
  for (const boundary of ['menu', 'blur', 'hidden', 'resize']) {
    const left = await point('P1 left', 3)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left] })
    await advance(arcade)
    if (boundary === 'menu') {
      await arcade.getByRole('button', { name: 'Menu', exact: true }).click()
      await arcade.getByRole('dialog').getByRole('button', { name: 'Resume', exact: true }).click()
    } else if (boundary === 'blur') await arcade.evaluate(() => dispatchEvent(new Event('blur')))
    else if (boundary === 'hidden') await arcade.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      document.dispatchEvent(new Event('visibilitychange'))
      Reflect.deleteProperty(document, 'hidden')
      document.dispatchEvent(new Event('visibilitychange'))
    })
    else await page.setViewportSize({ width: 375, height: 812 })
    await advance(arcade)
    const released = (await position(arcade)).x
    await advance(arcade)
    expect((await position(arcade)).x, boundary).toBe(released)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const release = await point('P1 right', 4)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [release] })
  await advance(arcade)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const released = (await position(arcade)).x
  await advance(arcade)
  expect((await position(arcade)).x).toBe(released)
  const first = await point('P1 right', 5), second = { ...first, x: first.x + 8, id: 6 }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [second] })
  const oneRemaining = (await position(arcade)).x
  await expect.poll(async () => (await position(arcade)).x).toBeGreaterThan(oneRemaining)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await context.close()
})
