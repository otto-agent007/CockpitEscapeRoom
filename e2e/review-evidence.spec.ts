import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import type { GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'
import { createAirbusState, createCompletedAirbusState, createDc9State, createLockerState } from './journeyStates'

/**
 * Review evidence for the owner's approval gates (CLAUDE.md: "each visual gate
 * should carry a Vercel preview and consistent screenshots", at 375/768/1440).
 *
 * Two parts, both skipped in the normal suite:
 *
 * - REVIEW_EVIDENCE_DIR=dir   gate screenshots: every chapter with the real 3D scene
 *                             at the three widths, written to dir for the PR comment.
 * - VISUAL_REGRESSION=1       the same screens on the HTML fallback path (?skip3d=1)
 *                             compared against committed baselines. Report-only until
 *                             the owner approves a baseline, because WebGL pixels under
 *                             CI's software renderer are not yet proven stable.
 */

const WIDTHS = [375, 768, 1440] as const
const HEIGHT_FOR: Record<(typeof WIDTHS)[number], number> = { 375: 812, 768: 1024, 1440: 900 }

interface Screen {
  slug: string
  state: GameState | null
  heading: string | null
}

const SCREENS: Screen[] = [
  { slug: '1-intro', state: null, heading: null },
  { slug: '2-dc9', state: createDc9State(), heading: 'DC-9 Final Flight Log' },
  { slug: '3-locker', state: createLockerState(), heading: "Before the captain's seat" },
  { slug: '4-airbus', state: createAirbusState(), heading: 'Airbus cockpit label placement' },
  { slug: '5-airbus-complete', state: createCompletedAirbusState(), heading: 'POP T CAPTAIN MODE COMPLETE' },
]

async function open(page: Page, screen: Screen, skip3d: boolean) {
  if (screen.state) {
    await page.addInitScript(
      ({ key, saved }) => window.localStorage.setItem(key, JSON.stringify(saved)),
      { key: STORAGE_KEY, saved: screen.state },
    )
  }
  await page.goto(skip3d && screen.state ? '/?skip3d=1' : '/')
  if (screen.heading) {
    await expect(page.getByRole('heading', { name: screen.heading })).toBeVisible({ timeout: 60_000 })
  } else {
    await expect(page.getByRole('region', { name: 'Game intro' })).toHaveAttribute('aria-busy', 'false', { timeout: 60_000 })
  }
}

const evidenceDir = process.env.REVIEW_EVIDENCE_DIR

test.describe('gate screenshots', () => {
  test.skip(!evidenceDir, 'Set REVIEW_EVIDENCE_DIR to capture gate screenshots.')
  for (const screen of SCREENS) {
    for (const width of WIDTHS) {
      test(`${screen.slug} at ${width}px`, async ({ page }) => {
        test.setTimeout(180_000)
        await page.setViewportSize({ width, height: HEIGHT_FOR[width] })
        await open(page, screen, false)
        // Capture the finished scene, not its loading overlay: the DC-9 canvas
        // reports its model state, and every scene shows an "… MB downloaded"
        // progress line while a model streams.
        const dc9 = page.locator('canvas[data-dc9-model-state]')
        if (await dc9.count()) await expect(dc9).toHaveAttribute('data-dc9-model-state', /ready|fallback/, { timeout: 150_000 })
        await expect(page.getByText(/MB downloaded/)).toHaveCount(0, { timeout: 150_000 })
        await page.waitForTimeout(1_000)
        mkdirSync(evidenceDir!, { recursive: true })
        await page.screenshot({ path: join(evidenceDir!, `${screen.slug}-${width}.png`) })
      })
    }
  }
})

test.describe('visual regression', () => {
  test.skip(process.env.VISUAL_REGRESSION !== '1', 'Set VISUAL_REGRESSION=1 to compare against baselines.')
  for (const screen of SCREENS) {
    for (const width of WIDTHS) {
      test(`${screen.slug} at ${width}px matches its baseline`, async ({ page }) => {
        test.setTimeout(120_000)
        await page.setViewportSize({ width, height: HEIGHT_FOR[width] })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await open(page, screen, true)
        await expect(page).toHaveScreenshot(`${screen.slug}-${width}.png`, { animations: 'disabled', maxDiffPixelRatio: 0.01 })
      })
    }
  }
})
