import { expect, test } from '@playwright/test'
import { createCompletedAirbusState } from './journeyStates'
import { STORAGE_KEY } from '../src/game/storage'
import { gameCopy } from '../src/game/config'

test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })

test.beforeEach(async ({ page }) => {
  const state = { ...createCompletedAirbusState(), phase: 'reward', rewardUnlocked: true }
  await page.addInitScript(({ key, state }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state)) }, { key: STORAGE_KEY, state })
  await page.goto('/?skip3d=1')
})

test('secret touch entrance appears only on the earned tribute and preserves progress', async ({ page, context }) => {
  await expect(page.getByRole('heading', { name: 'Model FLY', exact: true })).toBeVisible()
  await expect(page.locator('.secret-arcade-entry')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('cockpit-escape-room-mars-arcade-unlock'))).toBeNull()
  await page.getByRole('button', { name: 'Skip film and read tribute' }).tap()
  const title = page.getByRole('button', { name: gameCopy.rewardTitle, exact: true })
  await expect(title).toBeInViewport({ ratio: 1 })
  await title.tap()
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  const box = (await title.boundingBox())!
  const cdp = await context.newCDPSession(page)
  const touch = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch] })
  await page.waitForTimeout(150)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await page.waitForTimeout(3100)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch] })
  await expect(page.getByTitle('Mars arcade')).toBeVisible({ timeout: 5000 })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const frame = page.frameLocator('iframe[title="Mars arcade"]')
  await expect(frame.getByRole('heading', { name: 'Choose your player' })).toBeVisible()
  await frame.getByRole('button', { name: 'Return to game', exact: true }).tap()
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await expect(page.locator('.reward-tribute')).toHaveText(gameCopy.finalMessage)
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY)
  expect(saved.phase).toBe('reward')
  expect(saved.completedPuzzles).toEqual(['dc9', 'locker', 'airbus'])
  await page.reload()
  await page.getByRole('button', { name: 'Skip film and read tribute' }).tap()
  await expect(title).toBeVisible()
})

test('earned title keeps a native keyboard activation path without a visible arcade hint', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip film and read tribute' }).tap()
  const title = page.getByRole('button', { name: gameCopy.rewardTitle, exact: true })
  await expect(title).toBeVisible()
  await expect(page.locator('.reward-experience')).not.toContainText(/arcade|hold.*seconds/i)
  await title.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTitle('Mars arcade')).toBeVisible()
})

test('moving away, blur, backgrounding and leaving the tribute cancel a secret hold', async ({ page, context }) => {
  await page.getByRole('button', { name: 'Skip film and read tribute' }).tap()
  const title = page.getByRole('button', { name: gameCopy.rewardTitle, exact: true })
  await expect(title).toBeVisible()
  const box = (await title.boundingBox())!
  const cdp = await context.newCDPSession(page)
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }
  const start = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
  const end = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await start()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, x: 2, y: 2 }] })
  await page.waitForTimeout(3100)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await end()
  await start()
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.waitForTimeout(3100)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await end()
  await start()
  await page.evaluate(() => {
    const original = Object.getOwnPropertyDescriptor(document, 'hidden')
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    if (original) Object.defineProperty(document, 'hidden', original)
    else Reflect.deleteProperty(document, 'hidden')
  })
  await page.waitForTimeout(3100)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await end()
  await start()
  // Keep the finger down while a separate native action removes the title.
  await page.getByRole('button', { name: 'Replay film', exact: true }).evaluate((button: HTMLButtonElement) => button.click())
  await page.waitForTimeout(3100)
  await expect(page.getByRole('heading', { name: 'Model FLY', exact: true })).toBeVisible()
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await end()
})
