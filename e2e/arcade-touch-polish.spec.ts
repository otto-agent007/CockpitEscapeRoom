import { expect, test, type Page } from '@playwright/test'
import { holdForArcade, resumeArcade } from './arcadeFlow'

test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })

async function openArcade(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('cockpit-escape-room-mars-arcade-unlock', JSON.stringify({ version: 1, completedOnce: true }))
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Denied', 'NotAllowedError'))
  })
  await page.goto('/?skip3d=1')
  await expect(page.locator('.briefing-shell')).toBeVisible()
  await holdForArcade(page)
  return page.frameLocator('iframe[title="Mars arcade"]')
}

for (const [fighter, label] of [['trump', 'TEFLON DON'], ['oracle', 'SCAM ALTMAN']] as const) {
  test(`${label} has no down button on a touch phone`, async ({ page }) => {
    const frame = await openArcade(page)
    await frame.getByRole('combobox', { name: 'Your fighter' }).selectOption(fighter)
    await frame.getByRole('button', { name: 'Start fight', exact: true }).click()
    await expect(frame.locator('#stage-title')).toContainText(label)
    await expect(frame.getByRole('button', { name: 'P1 special', exact: true })).toBeVisible()
    await expect(frame.locator('[data-pivot-down]')).toHaveCount(0)
    await expect(frame.getByRole('button', { name: /down/i })).toHaveCount(0)
  })
}

test('a Restart round button pops up by itself when the round ends', async ({ page }) => {
  const frame = await openArcade(page)
  await frame.getByRole('button', { name: 'Start fight', exact: true }).click()
  await expect(frame.locator('#stage')).toBeVisible()
  const restart = frame.locator('#round-restart')
  await expect(restart).toBeHidden()

  // Run the 60-second round out on a fake clock instead of waiting a real minute.
  await page.clock.install()
  for (let second = 0; second < 66 && !(await restart.isVisible()); second += 1) await page.clock.runFor(1000)
  await expect(restart).toBeVisible()
  await expect(restart).toHaveText('Restart round')
  await expect(frame.locator('#readout')).toContainText(/timeOver|ko/)

  // The menu pauses the fight and carries its own restart, so the pop-up steps aside.
  await frame.getByRole('button', { name: 'Menu', exact: true }).click()
  await expect(restart).toBeHidden()
  await resumeArcade(frame)
  await page.clock.runFor(1500)
  await expect(restart).toBeVisible()

  await restart.click()
  await page.clock.runFor(500)
  await expect(restart).toBeHidden()
  await expect(frame.locator('#readout')).not.toContainText(/timeOver|ko/)
})
