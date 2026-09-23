import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import type { GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'
import { createAirbusState, createCompletedAirbusState, createDc9State, createLockerState } from './journeyStates'

/**
 * Accessibility sweep of every chapter's screen (CLAUDE.md: every required 3D
 * interaction has a native HTML path). axe checks the DOM against WCAG 2.1 A/AA
 * and this fails on serious or critical violations. Chapters are seeded from
 * saved progress and rendered with ?skip3d=1, the HTML fallback path, which is
 * exactly the surface a keyboard or screen-reader player uses.
 */

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const SCREENS: { name: string; state: GameState | null; ready: (page: Page) => Promise<void> }[] = [
  {
    name: 'intro cinematic',
    state: null,
    ready: async (page) => {
      const intro = page.getByRole('region', { name: 'Game intro' })
      await expect(intro).toHaveAttribute('aria-busy', 'false', { timeout: 60_000 })
    },
  },
  // Each chapter waits for its own heading, so axe never scans a half-rendered page.
  { name: 'DC-9 Final Flight Log', state: createDc9State(), ready: async (page) => { await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toBeVisible({ timeout: 30_000 }) } },
  { name: 'locker room', state: createLockerState(), ready: async (page) => { await expect(page.getByRole('heading', { name: "Before the captain's seat" })).toBeVisible({ timeout: 30_000 }) } },
  { name: 'A320 Pop T Captain', state: createAirbusState(), ready: async (page) => { await expect(page.getByRole('heading', { name: 'Airbus cockpit label placement' })).toBeVisible({ timeout: 30_000 }) } },
  { name: 'Airbus complete', state: createCompletedAirbusState(), ready: async (page) => { await expect(page.getByRole('heading', { name: 'POP T CAPTAIN MODE COMPLETE' })).toBeVisible({ timeout: 30_000 }) } },
]

for (const screen of SCREENS) {
  test(`${screen.name} has no serious or critical accessibility violations`, async ({ page }) => {
    test.setTimeout(90_000)
    if (screen.state) {
      await page.addInitScript(
        ({ key, saved }) => window.localStorage.setItem(key, JSON.stringify(saved)),
        { key: STORAGE_KEY, saved: screen.state },
      )
    }
    await page.goto(screen.state ? '/?skip3d=1' : '/')
    await screen.ready(page)
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    const summary = blocking.map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length} node(s): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')})`)
    expect(summary, summary.join('\n')).toEqual([])
  })
}

// A sweep that cannot fail is worse than none: prove it catches a planted defect.
test('the sweep catches an unlabelled button and an image without alt text', async ({ page }) => {
  await page.addInitScript(
    ({ key, saved }) => window.localStorage.setItem(key, JSON.stringify(saved)),
    { key: STORAGE_KEY, saved: createDc9State() },
  )
  await page.goto('/?skip3d=1')
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toBeVisible({ timeout: 30_000 })
  await page.evaluate(() => {
    const main = document.querySelector('main')
    main?.appendChild(document.createElement('button'))
    const image = document.createElement('img')
    image.src = 'planted.png'
    main?.appendChild(image)
  })
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  expect(results.violations.map((v) => v.id)).toEqual(expect.arrayContaining(['button-name', 'image-alt']))
})
