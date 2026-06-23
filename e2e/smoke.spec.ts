import { expect, test } from '@playwright/test'

test('Airbus onboarding, locker reveal, and captain completion unlock reward', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Cockpit Escape Room' })).toBeVisible()
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()

  await page.getByRole('combobox', { name: /Select card for Sidestick/i }).selectOption('SIDESTICK')
  await page.getByRole('combobox', { name: /Select card for Thrust levers/i }).selectOption('THRUST')
  await page.getByRole('combobox', { name: /Select card for Gear lever/i }).selectOption('GEAR')
  await page.getByRole('combobox', { name: /Select card for Radio panel/i }).selectOption('RADIO')
  await page.getByRole('combobox', { name: /Select card for Altitude area/i }).selectOption('ALTITUDE')

  await page.getByRole('textbox', { name: 'ATP answer' }).fill('1500')
  await page.getByRole('button', { name: 'Verify First-Officer challenge' }).click()

  await expect(page.getByRole('heading', { name: 'Locker reveal sequence' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Right-seat hours' }).fill('1000')
  await page.getByRole('button', { name: 'Confirm watch answer' }).click()
  await page.getByRole('textbox', { name: 'Name' }).fill('Anthony Muñoz')
  await page.getByRole('button', { name: 'Confirm baseball answer' }).click()
  await page.getByRole('button', { name: 'Inspect Pop T nameplate' }).click()
  await page.getByRole('button', { name: 'Inspect Northwest-era route strip' }).click()
  await page.getByRole('textbox', { name: 'Power,Lights,Route,Crew,Release' }).fill('POWER,LIGHTS,ROUTE,CREW,RELEASE')
  await page.getByRole('button', { name: 'Inspect Folded checklist card' }).click()

  await page.getByRole('button', { name: "Touch the captain’s hat" }).click()
  await expect(page.getByRole('heading', { name: 'POP T CAPTAIN MODE' })).toBeVisible()

  await page.getByRole('button', { name: /Stored power/i }).click()
  await page.getByRole('button', { name: /Navigation/i }).click()
  await page.getByRole('button', { name: /Cabin circuit/i }).click()
  for (const code of ['LIT', 'JAN', 'BHM']) {
    await page.getByRole('button', { name: code, exact: true }).click()
  }
  await page.getByRole('button', { name: /Submit captain legacy strip/i }).click()

  await expect(page.getByRole('heading', { name: 'Ground transport release' })).toBeVisible()
  await expect(page.getByText(/Happy Father’s Day/i)).toBeVisible()
  await expect(page.getByText(/red Tesla Model Y is unlocked/i)).toBeVisible()
})

test('saved progress persists during Airbus phase', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Begin First-Officer onboarding' }).click()
  await page.getByRole('combobox', { name: /Select card for Sidestick/i }).selectOption('RADIO')
  await page.reload()

  await expect(page.getByRole('combobox', { name: /Select card for Sidestick/i })).toHaveValue('RADIO')
})
