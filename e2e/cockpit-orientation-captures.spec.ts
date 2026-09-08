import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { createInitialState, type CockpitOrientationId, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

const evidenceDirectory = process.env.COCKPIT_ORIENTATION_EVIDENCE_DIR
const requestedWidth = Number(process.env.COCKPIT_ORIENTATION_EVIDENCE_WIDTH ?? 0)
const requestedCockpit = process.env.COCKPIT_ORIENTATION_EVIDENCE_COCKPIT

async function seed(page: Page, state: GameState): Promise<void> {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  )
  await page.reload()
}

async function captureCurrentFrame(page: Page, path: string): Promise<void> {
  const session = await page.context().newCDPSession(page)
  try {
    const { data } = await session.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    })
    writeFileSync(path, Buffer.from(data, 'base64'))
  } finally {
    await session.detach()
  }
}

function cockpitState(cockpit: CockpitOrientationId): GameState {
  return {
    ...createInitialState(),
    phase: cockpit,
    airbusCaptainModeUnlocked: cockpit === 'airbus',
  }
}

test('capture responsive cockpit orientation and settled frames', async ({ page }) => {
  test.skip(!evidenceDirectory, 'Set COCKPIT_ORIENTATION_EVIDENCE_DIR for visual evidence.')
  test.setTimeout(900_000)
  mkdirSync(evidenceDirectory!, { recursive: true })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')

  for (const cockpit of ['dc9', 'airbus'] as const) {
    if (requestedCockpit && requestedCockpit !== cockpit) continue
    const viewports = [
      { width: 375, height: 812 },
      { width: 768, height: 900 },
      { width: 1440, height: 900 },
    ].filter(({ width }) => requestedWidth === 0 || requestedWidth === width)
    for (const viewport of viewports) {
      await page.setViewportSize(viewport.width === 1440 ? { width: 768, height: 900 } : viewport)
      await seed(page, cockpitState(cockpit))

      const orientation = page.getByRole('region', {
        name: cockpit === 'dc9'
          ? 'DC-9 cockpit orientation'
          : 'Airbus A320 cockpit orientation',
      })
      await expect(orientation).toBeVisible({ timeout: 120_000 })
      if (viewport.width === 1440) {
        await page.setViewportSize(viewport)
        await expect(orientation).toBeVisible()
        await page.waitForTimeout(100)
      }
      await captureCurrentFrame(
        page,
        `${evidenceDirectory}/${cockpit}-orientation-${viewport.width}.png`,
      )
      await expect.poll(async () => Number(
        await page.locator('canvas').getAttribute('data-cockpit-orientation-progress'),
      )).toBeGreaterThan(0.02)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
        .toBeLessThanOrEqual(0)

      await expect(orientation).toHaveCount(0, { timeout: 8_000 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
        .toBeLessThanOrEqual(0)
      await page.screenshot({
        path: `${evidenceDirectory}/${cockpit}-settled-${viewport.width}.png`,
        fullPage: true,
      })
    }
  }
})
