import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { createInitialState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'
import { createLockerState } from './journeyStates'

const unlockKey = 'cockpit-escape-room-mars-arcade-unlock'
async function seed(page: Page, complete = false) {
  const state = { ...createInitialState(), phase: complete ? 'reward' : 'dc9', completedPuzzles: complete ? ['dc9', 'locker', 'airbus'] : [], rewardUnlocked: complete, cockpitOrientationSeen: { dc9: true, airbus: true } }
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value))
  }, { key: STORAGE_KEY, value: state })
}
async function hold(page: Page, ms = 1600) {
  for (const key of ['t', 'm', 'b']) await page.keyboard.down(key)
  await page.waitForTimeout(ms)
  for (const key of ['b', 'm', 't']) await page.keyboard.up(key)
}
async function complete(page: Page) {
  await seed(page, true)
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Skip film and read tribute' }).click()
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), unlockKey)).toContain('"completedOnce":true')
}
async function openAccess(page: Page) {
  await expect(page.locator('main')).toBeVisible()
  await hold(page)
  await expect(page.getByTitle('Mars arcade')).toBeVisible()
}

test('first play and direct arcade entry stay locked without loading arcade art', async ({ page }) => {
  const art: string[] = []
  page.on('request', request => { if (request.url().includes('/art-source/arcade/')) art.push(request.url()) })
  await seed(page)
  await page.goto('/?skip3d=1')
  await expect(page.getByRole('heading', { name: 'DC-9 Final Flight Log' })).toBeVisible()
  await hold(page)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open Mars arcade' })).toHaveCount(0)
  await expect(page.getByText('Bonus access', { exact: true })).toHaveCount(0)
  await page.goto('/mars-arcade.html')
  await expect(page.getByText('Complete the main game once to unlock this Easter egg.')).toBeVisible()
  expect(art).toEqual([])
})

test('an earned direct URL still requires the in-game T+M+B entrance', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ version: 1, completedOnce: true })), unlockKey)
  await page.goto('/mars-arcade.html')
  await expect(page.getByText('This Easter egg opens from the game.')).toBeVisible()
  await expect(page.locator('#arcade-game')).toBeHidden()
  await page.goto('/?skip3d=1')
  await expect(page.locator('.briefing-shell')).toBeVisible()
  await openAccess(page)
  await expect(page.frameLocator('iframe[title="Mars arcade"]').locator('#stage')).toBeVisible()
})

test('the final tribute unlocks T+M+B, reload and Restart retain access, and exit preserves chapter progress', async ({ page }) => {
  await complete(page)
  await page.reload()
  await expect(page.getByText('Bonus access', { exact: true })).toHaveCount(0)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Restart game' }).click()
  await expect(page.locator('.briefing-shell')).toBeVisible()
  await expect(page.getByText('Bonus access', { exact: true })).toHaveCount(0)
  const before = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)
  await hold(page, 300)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await hold(page)
  const frame = page.frameLocator('iframe[title="Mars arcade"]')
  await expect(frame.locator('#stage')).toBeVisible()
  await expect(frame.locator('#asset-status')).toContainText('sprites ready')
  await expect(frame.locator('#stage-title')).toContainText(/CAPTAIN/)
  await frame.getByRole('button', { name: 'Return to game' }).click()
  await expect(page.locator('.briefing-shell')).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(before)
  await page.reload()
  await expect(page.getByText('Bonus access', { exact: true })).toHaveCount(0)
  await hold(page)
  await expect(page.getByTitle('Mars arcade')).toBeVisible()
  await frame.locator('#stage').focus()
  await page.keyboard.press('Escape')
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
})

test('typing, modifiers and blur cancel the shortcut', async ({ page }) => {
  await complete(page)
  await page.evaluate(() => {
    const input = document.createElement('input'); input.id = 'typing-proof'; document.body.append(input); input.focus()
  })
  await hold(page)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await page.locator('#typing-proof').evaluate(element => element.remove())
  await page.keyboard.down('Control')
  await hold(page)
  await page.keyboard.up('Control')
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  for (const key of ['t', 'm', 'b']) await page.keyboard.down(key)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.waitForTimeout(1700)
  for (const key of ['t', 'm', 'b']) await page.keyboard.up(key)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  for (const key of ['t', 'm', 'b']) await page.keyboard.down(key)
  await page.evaluate(() => {
    const input = document.createElement('input'); input.id = 'focus-proof'; document.body.append(input); input.focus()
  })
  await page.waitForTimeout(1600)
  for (const key of ['t', 'm', 'b']) await page.keyboard.up(key)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await page.locator('#focus-proof').evaluate(element => element.remove())
  for (const key of ['t', 'm', 'b']) await page.keyboard.down(key)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    Reflect.deleteProperty(document, 'hidden')
  })
  await page.waitForTimeout(1600)
  for (const key of ['t', 'm', 'b']) await page.keyboard.up(key)
  await expect(page.getByTitle('Mars arcade')).toHaveCount(0)
  await openAccess(page)
  await expect(page.frameLocator('iframe').locator('#stage')).toBeVisible()
})

test('denied achievement storage keeps access in memory and authorizes only its own arcade frame', async ({ page }) => {
  await seed(page, true)
  await page.addInitScript(key => {
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function(name, value) {
      if (name === key) throw new Error('Achievement storage unavailable')
      set.call(this, name, value)
    }
  }, unlockKey)
  await page.goto('/?skip3d=1')
  await page.getByRole('button', { name: 'Skip film and read tribute' }).click()
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.getByText('Bonus access', { exact: true })).toHaveCount(0)
  expect(await page.evaluate(key => localStorage.getItem(key), unlockKey)).toBeNull()
  await openAccess(page)
  await expect(page.frameLocator('iframe').locator('#asset-status')).toContainText('sprites ready')
  await page.evaluate(() => window.postMessage('mars-arcade-close', window.location.origin))
  await expect(page.getByTitle('Mars arcade')).toBeVisible()
})

test('arcade exit preserves the current in-memory chapter when all storage writes are denied', async ({ page }) => {
  await complete(page)
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new Error('storage unavailable') }
    Storage.prototype.removeItem = () => { throw new Error('storage unavailable') }
  })
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Restart game' }).click()
  await expect(page.locator('.briefing-shell')).toBeVisible()
  await openAccess(page)
  await expect(page.frameLocator('iframe').locator('#stage')).toBeVisible()
  await page.getByRole('button', { name: 'Return to game', exact: true }).click()
  await expect(page.locator('.briefing-shell')).toBeVisible()
})

for (const width of [375, 768, 1440]) {
  test(`earned hidden arcade access preserves native locker controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(({ stateKey, state, earnedKey }) => {
      localStorage.setItem(stateKey, JSON.stringify(state))
      localStorage.setItem(earnedKey, JSON.stringify({ version: 1, completedOnce: true }))
    }, { stateKey: STORAGE_KEY, state: createLockerState(), earnedKey: unlockKey })
    await page.goto('/?skip3d=1')
    await page.getByRole('button', { name: 'Inspect watch', exact: true }).click({ timeout: 5000 })
    await expect(page.getByRole('dialog', { name: 'Rolex GMT-Master' })).toBeVisible()
  })
}

for (const width of [375, 768, 1440]) {
  test(`production arcade controls and artwork work at ${width}px with reduced motion`, async ({ page }) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`) })
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      const sources = new Set<string>()
      Object.defineProperty(window, '__arcadeBodySources', { get: () => [...sources] })
      const draw = CanvasRenderingContext2D.prototype.drawImage
      CanvasRenderingContext2D.prototype.drawImage = function(...args: Parameters<typeof draw>) {
        const image = args[0]
        if (this.canvas.id === 'stage' && image instanceof HTMLImageElement && args.length === 5 && args[3] === 128 && args[4] === 128) sources.add(image.src)
        return Reflect.apply(draw, this, args)
      }
    })
    await complete(page)
    await openAccess(page)
    const frame = page.frameLocator('iframe')
    await expect(frame.locator('#asset-status')).toContainText('sprites ready')
    await expect(frame.locator('#asset-status')).toContainText('reduced motion')
    const bounds = await frame.locator('#stage').boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900)
    for (const fighter of ['booster', 'oracle', 'captain', 'trump']) {
      await frame.locator('[data-fighter="0"]').selectOption(fighter)
      await frame.getByRole('button', { name: 'P1 light' }).click()
      await expect(frame.locator('#readout')).toContainText(new RegExp(fighter, 'i'))
      await expect.poll(() => frame.locator('#stage').evaluate((canvas, id) => {
        const sources = (canvas.ownerDocument.defaultView as unknown as { __arcadeBodySources: string[] }).__arcadeBodySources
        return sources.some(source => source.includes(`/arcade/${id}/`) || (id === 'oracle' && source.includes('/arcade/generated/oracle')))
      }, fighter)).toBe(true)
    }
    await frame.getByRole('button', { name: 'Pause', exact: true }).click()
    await expect(frame.getByRole('button', { name: 'Resume', exact: true })).toBeVisible()
    await frame.getByRole('button', { name: 'Resume', exact: true }).click()
    await frame.getByRole('button', { name: 'Restart round' }).click()
    await expect(frame.locator('#stage')).toBeVisible()
    await frame.locator('body').evaluate(() => window.scrollTo(0, 0))
    await page.evaluate(() => window.scrollTo(0, 0))
    expect(await frame.locator('body').evaluate(element => element.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(frame.locator('#pg-save')).toHaveCount(0)
    if (process.env.ARCADE_EVIDENCE_DIR) {
      mkdirSync(process.env.ARCADE_EVIDENCE_DIR, { recursive: true })
      await page.screenshot({ path: `${process.env.ARCADE_EVIDENCE_DIR}/production-${width}.png`, fullPage: true })
    }
    expect(failures).toEqual([])
  })
}

test('arcade loading can retry without altering game progress', async ({ page }) => {
  await complete(page)
  const before = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)
  let block = true
  await page.route(/(?:src\/dev\/arcadeHarness\.ts|assets\/arcadeHarness-[^/]*\.js)(?:\?|$)/, route => {
    if (block) { block = false; return route.abort() }
    return route.continue()
  })
  await openAccess(page)
  await expect(page.getByRole('button', { name: 'Retry arcade' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry arcade' }).click()
  await expect(page.frameLocator('iframe').locator('#asset-status')).toContainText('sprites ready')
  await page.getByRole('button', { name: 'Return to game', exact: true }).click()
  await expect(page.locator('main')).toBeFocused()
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(before)
})

test('the production arcade accepts a connected controller and its pause button', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false }))
    const pad = { index: 0, id: 'Test Controller (STANDARD GAMEPAD)', mapping: 'standard', connected: true, axes: [0, 0], buttons }
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] })
    Object.assign(window, { __testPadButtons: buttons })
  })
  await complete(page)
  await openAccess(page)
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('#stage')).toBeVisible()
  await expect(frame.locator('#pad-status')).toContainText('P1 controller: Test Controller')
  await frame.locator('body').evaluate(() => {
    const buttons = (window as typeof window & { __testPadButtons: Array<{ pressed: boolean }> }).__testPadButtons
    buttons[9].pressed = true
  })
  await expect(frame.getByRole('button', { name: 'Resume', exact: true })).toBeVisible()
  await frame.locator('body').evaluate(() => {
    const buttons = (window as typeof window & { __testPadButtons: Array<{ pressed: boolean }> }).__testPadButtons
    buttons[9].pressed = false
  })
  await frame.getByRole('button', { name: 'Resume', exact: true }).click()
  await expect(frame.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
})

test('an unreachable arcade document offers a retry', async ({ page }) => {
  await complete(page)
  await page.clock.install()
  let block = true
  await page.route('**/mars-arcade.html', route => {
    if (block) { block = false; return route.abort() }
    return route.continue()
  })
  await openAccess(page)
  await page.clock.fastForward(16_000)
  await expect(page.getByRole('button', { name: 'Retry arcade' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry arcade' }).click()
  await expect(page.frameLocator('iframe').locator('#asset-status')).toContainText('sprites ready')
})

test('the arcade exit survives an unavailable optional shell chunk', async ({ page }) => {
  await complete(page)
  await page.route(/assets\/MarsArcade-[^/]*\.js$/, route => route.abort())
  await openAccess(page)
  await expect(page.getByRole('button', { name: 'Return to game', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Return to game', exact: true }).click()
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
})

test('returning to a replayed reward keeps the film stage', async ({ page }) => {
  await complete(page)
  await page.getByRole('button', { name: 'Replay film' }).click()
  await expect(page.locator('[data-reward-stage="film"]')).toBeVisible()
  await openAccess(page)
  await page.getByRole('button', { name: 'Return to game', exact: true }).click()
  await expect(page.locator('[data-reward-stage="film"]')).toBeVisible()
  await expect(page.locator('main')).toBeFocused()
})

test('the arcade native controls have no serious or critical accessibility violations', async ({ page }) => {
  await complete(page)
  await openAccess(page)
  await expect(page.frameLocator('iframe').locator('#asset-status')).toContainText('sprites ready')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(results.violations.filter(issue => issue.impact === 'serious' || issue.impact === 'critical').map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) }))).toEqual([])
})
