import { expect, test, type Page } from '@playwright/test'
import { createCompletedAirbusState } from './journeyStates'
import { STORAGE_KEY } from '../src/game/storage'
import { mkdirSync } from 'node:fs'

async function capture(page: Page, name: string) {
  const directory = process.env.ROBOPTIMUS_EVIDENCE_DIR
  if (!directory) return
  mkdirSync(directory, { recursive: true })
  await page.screenshot({ path: `${directory}/${name}.png` })
}

async function completeAirbus(page: Page, accessible = false) {
  await page.goto(accessible ? '/?skip3d=1' : '/')
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY, state: createCompletedAirbusState(),
  })
  await page.reload()
  return page.getByRole('dialog', { name: 'POP T CAPTAIN MODE COMPLETE' })
}

test('cold Roboptimus loading waits for the entire scene before revealing its first frame', async ({ page }) => {
  test.setTimeout(process.env.ROBOPTIMUS_EVIDENCE_DIR ? 180_000 : 60_000)
  let releaseScene!: () => void
  let releaseModel!: () => void
  let releaseHangar!: () => void
  const sceneGate = new Promise<void>(resolve => { releaseScene = resolve })
  const modelGate = new Promise<void>(resolve => { releaseModel = resolve })
  const hangarGate = new Promise<void>(resolve => { releaseHangar = resolve })
  const requests: string[] = []
  await page.addInitScript(() => {
    const sample = window as Window & { roboptimusFirstOpacity?: string }
    new MutationObserver(() => {
      const wrapper = document.querySelector('.roboptimus-hangar-view .optimus-guide-canvas')
      if (wrapper?.querySelector('canvas') && sample.roboptimusFirstOpacity === undefined) {
        sample.roboptimusFirstOpacity = getComputedStyle(wrapper).opacity
      }
    }).observe(document, { childList: true, subtree: true })
  })
  page.on('request', request => requests.push(request.url()))
  await page.route(/\/(?:src\/scenes\/OptimusGuideScene\.tsx|assets\/OptimusGuideScene-[^/]*\.js)(?:\?|$)/, async route => {
    await sceneGate
    await route.continue().catch(() => {}) // The test may close the page while a gate is held.
  })
  await page.route('**/models/roboptimus-guide.glb*', async route => {
    await modelGate
    await route.continue().catch(() => {})
  })
  await page.route('**/models/roboptimus-hangar.glb*', async route => {
    await hangarGate
    await route.continue().catch(() => {})
  })
  try {
    const card = await completeAirbus(page)
    const loading = card.locator('.roboptimus-scene-loading')
    await expect(loading).toBeVisible()
    await expect(card.locator('.roboptimus-hangar-view img')).toHaveCount(0)
    await expect(card).toContainText('Roboptimus')
    await expect(card.locator('canvas')).toHaveCount(0)
    for (const width of process.env.ROBOPTIMUS_EVIDENCE_DIR ? [375, 768, 1440] : []) {
      await page.setViewportSize({ width, height: 900 })
      await capture(page, `module-loading-${width}`)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    const modelRequest = page.waitForRequest('**/models/roboptimus-guide.glb*')
    releaseScene()
    await modelRequest
    await expect(loading).toBeVisible()
    await expect(card.locator('canvas')).toHaveCount(0)
    await capture(page, 'model-loading-1440')
    releaseModel()
    // Even after the robot arrives, a delayed hangar must keep the whole scene hidden.
    await page.waitForTimeout(4_250)
    await expect(loading).toBeVisible()
    await expect(card.locator('.roboptimus-hangar-view img')).toHaveCount(0)
    await expect(card.locator('canvas')).toHaveCount(0)
    await expect(card.getByRole('button', { name: /^(Play|Replay) greeting$/ })).toBeDisabled()
    releaseHangar()
    await expect(card.locator('.optimus-guide-canvas canvas')).toBeVisible({ timeout: 30_000 })
    await expect(card.locator('.optimus-guide-canvas')).toHaveCSS('opacity', '1')
    expect(await page.evaluate(() => (window as Window & { roboptimusFirstOpacity?: string }).roboptimusFirstOpacity)).toBe('0')
    await expect(loading).toHaveCount(0)
    for (const width of process.env.ROBOPTIMUS_EVIDENCE_DIR ? [375, 768, 1440] : []) {
      await page.setViewportSize({ width, height: 900 })
      await capture(page, `loaded-${width}`)
    }
    expect(requests.some(url => url.includes('/images/optimus-guide-fallback.png'))).toBe(false)
    expect(requests.some(url => url.includes('/models/optimus-guide-dance-02-review.glb'))).toBe(false)
    expect(requests.some(url => url.includes('/media/tesla-flight-mode-final.mp4'))).toBe(false)
  } finally {
    releaseScene()
    releaseModel()
    releaseHangar()
  }
})

for (const mode of ['robot unavailable', 'hangar unavailable', 'WebGL unavailable', 'accessible mode']) {
  test(`Roboptimus keeps the current still and keyboard reward path with ${mode}`, async ({ page }) => {
    const accessible = mode === 'accessible mode'
    const requests: string[] = []
    page.on('request', request => requests.push(request.url()))
    if (mode === 'WebGL unavailable') await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value(this: HTMLCanvasElement, contextId: string, ...options: unknown[]) {
          if (contextId === 'webgl2') return null
          return Reflect.apply(getContext, this, [contextId, ...options])
        },
      })
    })
    if (mode.endsWith('unavailable') && mode !== 'WebGL unavailable') await page.route(`**/models/roboptimus-${mode === 'robot unavailable' ? 'guide' : 'hangar'}.glb*`, route => route.fulfill({ status: 503, body: 'offline' }))
    const card = await completeAirbus(page, accessible)
    await expect(card).toContainText('Roboptimus')
    await expect(card.getByLabel('Roboptimus greeting')).toBeAttached()
    await expect(card.locator('img.optimus-guide-fallback')).toHaveAttribute('src', /\/images\/roboptimus-personal-waiting\.png$/)
    await expect(card.locator('canvas')).toHaveCount(0)
    expect(requests.some(url => url.includes('/images/optimus-guide-fallback.png'))).toBe(false)
    await card.getByRole('button', { name: 'Reveal reward' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Model FLY', exact: true })).toBeVisible({ timeout: 12_000 })
  })
}
