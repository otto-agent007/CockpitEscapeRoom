import { expect, test, type Page } from '@playwright/test'
import type { GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'
import { createDc9State, createLockerState } from './journeyStates'

async function seed(page: Page, state: GameState, suffix: string) {
  await page.goto('/?skip3d=1')
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: state })
  await page.goto(`/${suffix}`)
}

/** A marker that only survives while the page has not been reloaded. */
async function markPage(page: Page) {
  await page.evaluate(() => { (window as Window & { __sameDocument?: boolean }).__sameDocument = true })
}

async function isSameDocument(page: Page) {
  return page.evaluate(() => (window as Window & { __sameDocument?: boolean }).__sameDocument === true)
}

async function setGraphicsContextLost(page: Page, lost: boolean) {
  await page.locator('canvas').evaluate((canvas, lose) => {
    // A lost context answers getExtension() with null, so keep the handle that lost it.
    const holder = window as Window & { __loseContext?: WEBGL_lose_context }
    if (lose) {
      const extension = (canvas as HTMLCanvasElement).getContext('webgl2')?.getExtension('WEBGL_lose_context')
      if (!extension) throw new Error('WEBGL_lose_context is unavailable')
      holder.__loseContext = extension
      extension.loseContext()
    } else {
      if (!holder.__loseContext) throw new Error('No lost context to restore')
      holder.__loseContext.restoreContext()
    }
  }, lost)
}

test('Restart reloads into a clean Begin page with progress cleared', async ({ page }) => {
  await seed(page, createDc9State(), '?skip3d=1')
  await expect(page.getByRole('button', { name: 'Restart', exact: true })).toBeVisible()
  await markPage(page)
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'Restart', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Game entry' })).toBeVisible()
  // A fresh document is the point: an in-place reset keeps every chapter's GPU memory.
  expect(await isSameDocument(page)).toBe(false)
  const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
  expect(saved === null || (JSON.parse(saved) as GameState).phase === 'briefing').toBe(true)
})

test('a lost 3D view explains itself, clears on restore, and reloads into the same chapter', async ({ page }) => {
  await seed(page, createLockerState(), '')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeAttached()
  const notice = page.getByRole('alert').filter({ hasText: 'The 3D view stopped' })
  await expect(notice).toHaveCount(0)

  await setGraphicsContextLost(page, true)
  await expect(notice).toBeVisible()
  await expect(notice).toContainText('Your progress is saved.')

  await setGraphicsContextLost(page, false)
  await expect(notice).toHaveCount(0)

  await setGraphicsContextLost(page, true)
  await expect(notice).toBeVisible()
  await markPage(page)
  await notice.getByRole('button', { name: 'Reload' }).click()
  await expect(page.locator('canvas')).toBeAttached()
  expect(await isSameDocument(page)).toBe(false)
  await expect(notice).toHaveCount(0)
  const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
  expect((JSON.parse(saved ?? '{}') as GameState).phase).toBe('locker')
})
