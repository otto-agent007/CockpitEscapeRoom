import { expect, test } from '@playwright/test'

test('Captain Mode completes the starter loop and unlocks the reward', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Cockpit Escape Room' })).toBeVisible()
  await page.getByRole('button', { name: /Captain Mode/ }).click()
  await page.getByRole('button', { name: 'Begin legacy flight' }).click()

  await page.getByRole('button', { name: /BAT/ }).click()
  await page.getByRole('button', { name: /NAV/ }).click()
  await page.getByRole('button', { name: /CAB/ }).click()

  await expect(page.getByRole('heading', { name: /Memphis feeder route/ })).toBeVisible()
  for (const code of ['LIT', 'JAN', 'BHM']) {
    await page.getByRole('button', { name: code, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Submit route strip' }).click()

  await expect(page.getByRole('heading', { name: 'Legacy flight complete' })).toBeVisible()
  await expect(page.getByText(/red Model Y unlocked/i)).toBeVisible()
})

test('saved progress survives a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Begin legacy flight' }).click()
  await page.getByRole('button', { name: /Stored power/ }).click()
  await page.reload()

  await expect(page.getByRole('button', { name: /Stored power/ })).toHaveAttribute('aria-pressed', 'true')
})
