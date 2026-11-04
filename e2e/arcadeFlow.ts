import { expect, type FrameLocator, type Page } from '@playwright/test'

/** Positive entry waits for the effect of the continuous hold, not a driver clock. */
export async function holdForArcade(page: Page) {
  for (const key of ['t', 'm', 'b']) await page.keyboard.down(key)
  try {
    await expect(page.getByTitle('Mars arcade')).toBeVisible()
  } finally {
    for (const key of ['b', 'm', 't']) await page.keyboard.up(key)
  }
}

export async function startArcadeFight(frame: FrameLocator, openOptions = true) {
  const start = frame.getByRole('button', { name: 'Start fight', exact: true })
  await expect(start).toBeEnabled()
  await start.click()
  await expect(frame.locator('#stage')).toBeVisible()
  if (openOptions) {
    await frame.getByText('Match options', { exact: true }).click()
    await frame.getByText('Controls', { exact: true }).click()
  }
}
