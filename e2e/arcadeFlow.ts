import { expect, type FrameLocator } from '@playwright/test'

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
