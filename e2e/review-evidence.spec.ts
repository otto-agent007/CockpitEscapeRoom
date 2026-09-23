import { mkdirSync, writeFileSync } from 'node:fs'
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
  /** The model this screen must show; the capture waits for it to finish downloading. */
  model: string
}

const SCREENS: Screen[] = [
  // The intro preloads the DC-9 during the cinematic (CLAUDE.md).
  { slug: '1-intro', state: null, heading: null, model: 'dc9-cockpit.glb' },
  { slug: '2-dc9', state: createDc9State(), heading: 'DC-9 Final Flight Log', model: 'dc9-cockpit.glb' },
  { slug: '3-locker', state: createLockerState(), heading: "Before the captain's seat", model: 'locker-room.glb' },
  { slug: '4-airbus', state: createAirbusState(), heading: 'Airbus cockpit label placement', model: 'airbus-captain.glb' },
  { slug: '5-airbus-complete', state: createCompletedAirbusState(), heading: 'POP T CAPTAIN MODE COMPLETE', model: 'airbus-captain.glb' },
]

/**
 * Wait until the scene is finished, not merely loaded. Scenes signal readiness
 * differently (the DC-9 canvas has a model state, the locker exposes none), so
 * this uses two generic rules: every GLB the page requested has finished
 * downloading, and then consecutive screenshots are byte-identical, i.e. the
 * model has been decoded and drawn and nothing is still changing. The first CI
 * run captured the locker as a blank panel before its 44 MB model was drawn.
 */
interface ModelTracker {
  inFlight(): number
  finished(name: string): boolean
}

function trackModels(page: Page): ModelTracker {
  let inFlight = 0
  const finished = new Set<string>()
  const modelName = (url: string) => url.match(/\/models\/([^/?]+\.glb)/)?.[1] ?? null
  page.on('request', (request) => { if (modelName(request.url())) inFlight += 1 })
  page.on('requestfinished', (request) => {
    const name = modelName(request.url())
    if (!name) return
    inFlight -= 1
    finished.add(name)
  })
  page.on('requestfailed', (request) => { if (modelName(request.url())) inFlight -= 1 })
  return { inFlight: () => inFlight, finished: (name) => finished.has(name) }
}

/**
 * A frame via the DevTools protocol directly. Playwright's own screenshot fails
 * intermittently on the locker scene with "Unable to capture screenshot"; the
 * cockpit-orientation capture spec hit the same thing and captures this way.
 */
async function capture(page: Page): Promise<Buffer> {
  // The locker's opening transition briefly refuses captures; retry that error only.
  for (let attempt = 1; ; attempt += 1) {
    const session = await page.context().newCDPSession(page)
    try {
      const { data } = await session.send('Page.captureScreenshot', { format: 'png' })
      return Buffer.from(data, 'base64')
    } catch (error) {
      if (attempt >= 20 || !String(error).includes('Unable to capture screenshot')) throw error
      await page.waitForTimeout(500)
    } finally {
      await session.detach().catch(() => undefined)
    }
  }
}

async function settle(page: Page, screen: Screen, models: ModelTracker) {
  await expect.poll(() => models.finished(screen.model), { timeout: 240_000, intervals: [1_000] }).toBe(true)
  await expect.poll(() => models.inFlight(), { timeout: 240_000, intervals: [1_000] }).toBe(0)
  const dc9 = page.locator('canvas[data-dc9-model-state]')
  if (await dc9.count()) await expect(dc9).toHaveAttribute('data-dc9-model-state', /ready|fallback/, { timeout: 240_000 })
  await expect(page.getByText(/MB downloaded/)).toHaveCount(0, { timeout: 240_000 })
  let previous = await capture(page)
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await page.waitForTimeout(2_000)
    const current = await capture(page)
    if (current.equals(previous)) return
    previous = current
  }
  throw new Error('the scene never stopped changing in 120 s')
}

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
        test.setTimeout(480_000)
        await page.setViewportSize({ width, height: HEIGHT_FOR[width] })
        // Reduced motion for consistent evidence: no intro logo caught mid-animation.
        await page.emulateMedia({ reducedMotion: 'reduce' })
        const models = trackModels(page)
        await open(page, screen, false)
        await settle(page, screen, models)
        mkdirSync(evidenceDir!, { recursive: true })
        writeFileSync(join(evidenceDir!, `${screen.slug}-${width}.png`), await capture(page))
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
        // Canvases are masked: WebGL under CI's software renderer is not pixel-stable,
        // so the comparison covers the HTML interface, which is.
        await expect(page).toHaveScreenshot(`${screen.slug}-${width}.png`, {
          animations: 'disabled',
          mask: [page.locator('canvas')],
          maxDiffPixelRatio: 0.01,
        })
      })
    }
  }
})
