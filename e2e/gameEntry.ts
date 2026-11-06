import type { Page } from '@playwright/test'

/** Start the cinematic through the same trusted native control as a player. */
export async function beginGameIntro(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Click to begin', exact: true }).click({ timeout: 60_000 })
}
