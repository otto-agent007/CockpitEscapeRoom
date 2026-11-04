import { expect, test, type Page } from '@playwright/test'
import { holdForArcade } from './arcadeFlow'

async function openArcade(page: Page) {
  await page.addInitScript(() => localStorage.setItem('cockpit-escape-room-mars-arcade-unlock', JSON.stringify({ version: 1, completedOnce: true })))
  await page.goto('/?skip3d=1')
  await expect(page.locator('.briefing-shell')).toBeVisible()
  await holdForArcade(page)
  return page.frameLocator('iframe[title="Mars arcade"]')
}

test('arcade selection freezes combat until a chosen player and battlefield start', async ({ page }) => {
  const frame = await openArcade(page)
  await expect(frame.getByRole('heading', { name: 'Choose your player' })).toBeVisible()
  await expect(frame.locator('#stage')).toBeHidden()
  const before = await frame.locator('#readout').textContent()
  await page.keyboard.press('j')
  await page.waitForTimeout(250)
  expect(await frame.locator('#readout').textContent()).toBe(before)
  await frame.getByRole('combobox', { name: 'Your fighter' }).selectOption('trump')
  await frame.getByRole('combobox', { name: 'Background', exact: true }).selectOption('moonbase')
  await frame.getByRole('button', { name: 'Start fight', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(frame.locator('#stage')).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
  await expect(frame.locator('#stage-title')).toContainText('TEFLON DON')
  await expect(frame.locator('#stage')).toHaveAttribute('data-background', 'moonbase')
  await expect.poll(() => frame.locator('#readout').textContent()).not.toBe(before)
  await frame.getByRole('button', { name: 'Change player / battlefield' }).click()
  await expect(frame.getByRole('heading', { name: 'Choose your player' })).toBeVisible()
  const frozen = await frame.locator('#readout').textContent()
  await page.waitForTimeout(250)
  expect(await frame.locator('#readout').textContent()).toBe(frozen)
  await expect(frame.getByRole('combobox', { name: 'Background', exact: true })).toHaveValue('moonbase')
})

for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 900 }, { width: 1440, height: 900 }, { width: 900, height: 375 }]) {
  test(`fight fills ${viewport.width}x${viewport.height} even when browser fullscreen is refused`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(() => {
      Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Not allowed', 'NotAllowedError'))
    })
    const frame = await openArcade(page)
    await frame.getByRole('button', { name: 'Start fight', exact: true }).click()
    await expect(frame.locator('#stage')).toBeVisible()
    const bounds = await frame.locator('#stage').boundingBox()
    expect(bounds).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height })
    await frame.getByText('Controls', { exact: true }).click()
    await expect(frame.getByRole('button', { name: 'P1 light' })).toBeVisible()
    await frame.getByRole('button', { name: 'P1 light' }).click()
    await frame.getByRole('button', { name: 'Change player / battlefield' }).click()
    await expect(frame.getByRole('button', { name: 'Start fight' })).toBeVisible()
    expect(await frame.locator('body').evaluate(element => element.scrollWidth <= innerWidth)).toBe(true)
    await frame.getByRole('button', { name: 'Return to game', exact: true }).click()
    await expect(page.locator('.briefing-shell')).toBeVisible()
  })
}

test('arcade live feedback stays accessible with match options closed', async ({ page }) => {
  const frame = await openArcade(page)
  await frame.getByRole('button', { name: 'Start fight', exact: true }).click()
  await expect(frame.getByRole('status').and(frame.locator('#background-status'))).toContainText('Mars ready')
})

test('arcade disclosures keep native Space activation', async ({ page }) => {
  const frame = await openArcade(page)
  await frame.getByRole('button', { name: 'Start fight', exact: true }).click()
  for (const name of ['Controls', 'Match options']) {
    const summary = frame.getByText(name, { exact: true })
    await summary.focus()
    await page.keyboard.press('Space')
    await expect(summary.locator('..')).toHaveAttribute('open', '')
    await expect(frame.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  }
})
