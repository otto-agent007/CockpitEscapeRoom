import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { airbusCaptainFlow } from '../src/game/config'
import { DC9_INSTRUMENT_SCAN_ORDER } from '../src/game/dc9InstrumentScan'
import type { GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'
import { createAirbusState, createCompletedAirbusState, createDc9InstrumentScanState, createDc9QualificationState, createDc9State } from './journeyStates'

test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })

export function mobileDepartureState(): GameState {
  const state = createDc9InstrumentScanState()
  return { ...state, cockpitOrientationSeen: { dc9: true, airbus: true }, dc9: { ...state.dc9, stage: 'memphisDeparture', instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 } } }
}

export function mobileAirbusFlightState(engineOut = false, decision = false): GameState {
  const state = engineOut ? createCompletedAirbusState() : createAirbusState()
  return {
    ...state, completedPuzzles: ['dc9', 'locker'], airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      ...state.airbusSimulator, familiarization: 'completed', cameraPhase: 'storm', location: engineOut ? 'engineOut' : 'stormLine',
      stormLine: { ...state.airbusSimulator.stormLine, status: engineOut ? 'completed' : 'in_progress', checkpoint: engineOut ? 'clearAir' : decision ? 'stormCore' : 'stormEntry' },
      engineOut: { ...state.airbusSimulator.engineOut, status: engineOut ? 'in_progress' : 'locked', checkpoint: decision ? 'diversion' : 'recognition' },
      workload: engineOut ? {
        ...state.airbusSimulator.workload,
        completedTasks: decision ? ['stormScanRange', 'stormGapSelection', 'engineEventAcknowledgement'] : ['stormScanRange', 'stormGapSelection'],
        selectedSafeReturnSide: null,
      } : decision ? { ...state.airbusSimulator.workload, completedTasks: ['stormScanRange'] } : state.airbusSimulator.workload,
    },
  }
}

async function openState(page: Page, state: GameState) {
  await page.addInitScript(({ key, saved }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(saved)) }, {
    key: STORAGE_KEY, saved: { ...state, cockpitOrientationSeen: { dc9: true, airbus: true } },
  })
  await page.goto('/?skip3d=1')
}

async function expectSeparated(page: Page, panelSelector: string) {
  await expect.poll(async () => {
    const view = await page.locator('.scene').boundingBox()
    const controls = await page.locator(panelSelector).boundingBox()
    return view && controls ? controls.y - view.y - view.height : -Infinity
  }, { message: 'cockpit styles must reserve space below the canvas' }).toBeGreaterThanOrEqual(-1)
  const scene = await page.locator('.scene').boundingBox()
  const panel = await page.locator(panelSelector).boundingBox()
  expect(scene).not.toBeNull(); expect(panel).not.toBeNull()
  expect(panel!.y, 'controls must sit below the cockpit canvas').toBeGreaterThanOrEqual(scene!.y + scene!.height - 1)
  const viewport = page.viewportSize()!
  expect(scene!.height).toBeGreaterThanOrEqual(viewport.height * (viewport.width > viewport.height ? 0.4 : 0.5))
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
}

test('phone DC-9 controls reserve cockpit space and show touch-sized current-axis buttons', async ({ page }) => {
  await openState(page, createDc9State())
  await expect(page.getByRole('heading', { name: 'Flight controls — free and correct' })).toBeVisible()
  await expectSeparated(page, '.dc9-control-check')
  await expect(page.getByRole('button', { name: 'Restart', exact: true })).toBeInViewport({ ratio: 1 })
  const holds = page.locator('.dc9-axis__hold:visible')
  await expect(holds).toHaveCount(2)
  for (const button of await holds.all()) {
    const box = (await button.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(48); expect(box.height).toBeGreaterThanOrEqual(48)
  }
  await page.getByRole('button', { name: 'Pull column aft', exact: true }).focus()
  await page.keyboard.down('Enter')
  await expect.poll(() => page.locator('[aria-label="Control column position"]').getAttribute('aria-valuenow')).toBe('100')
  await page.keyboard.up('Enter')
  await expect(page.locator('.dc9-control-check__next')).toContainText(/forward/i)
  await page.setViewportSize({ width: 667, height: 375 })
  await expectSeparated(page, '.dc9-control-check')
  await page.reload()
  await expect(page.locator('.dc9-control-check__next')).toContainText(/forward/i)
})

for (const [name, state, selector] of [
  ['DC-9 instrument scan', createDc9InstrumentScanState(), '.dc9-instrument-scan'],
  ['DC-9 departure', mobileDepartureState(), '.dc9-memphis-departure'],
  ['A320 qualification', createAirbusState(), '.airbus-card-tray'],
  ['A320 Storm Line', mobileAirbusFlightState(), '.cockpit-flight-tray'],
  ['A320 Engine-Out', mobileAirbusFlightState(true), '.cockpit-flight-tray'],
  ['A320 Storm Line route choice', mobileAirbusFlightState(false, true), '.cockpit-flight-tray'],
  ['A320 Engine-Out corridor choice', mobileAirbusFlightState(true, true), '.cockpit-flight-tray'],
] as const) {
  test(`${name} keeps its touch panel below the cockpit in portrait and landscape`, async ({ page }) => {
    await openState(page, state)
    await expect(page.locator(selector)).toBeVisible()
    if (name === 'A320 Engine-Out') {
      await expect(page.locator('.storm-route-guidance')).toContainText('hold Balance right')
    }
    for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 667, height: 375 }, { width: 932, height: 430 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport)
      await expectSeparated(page, selector)
      if (selector === '.cockpit-flight-tray') {
        const scene = (await page.locator('.scene').boundingBox())!
        expect(scene.height / viewport.height, 'compact flight controls must give most of the screen to the cockpit').toBeGreaterThanOrEqual(viewport.width > viewport.height ? 0.54 : 0.64)
        if (viewport.width > viewport.height && viewport.height <= 520) {
          const advice = (await page.locator('.storm-route-guidance p').boundingBox())!
          const meter = (await page.locator('.storm-drift-meter').boundingBox())!
          expect(meter.y, 'landscape route advice and drift meter must share one row').toBeLessThan(advice.y + advice.height)
        }
        await expect(page.getByRole('button', { name: /^Hold Pitch/ })).toHaveCount(0)
        for (const direction of ['left', 'right']) {
          const bank = page.getByRole('button', { name: `Hold Bank ${direction}`, exact: true })
          await expect(bank.locator('svg[aria-hidden="true"]')).toHaveCount(1)
          await expect(bank).toHaveText('')
        }
      }
      if (name === 'DC-9 departure') {
        await expect(page.getByText('1995 MEMPHIS MEMORY', { exact: true })).toBeVisible()
        await expect(page.locator('.dc9-memphis-departure__header > p:last-child')).toBeInViewport({ ratio: 1 })
        await expect(page.getByRole('button', { name: 'Retry from checkpoint', exact: true })).toBeInViewport({ ratio: 1 })
      }
      for (const button of await page.locator(`${selector} button[data-hold]:visible`).all()) {
        await expect(button).toBeInViewport({ ratio: 1 })
        const box = (await button.boundingBox())!
        expect(box.width).toBeGreaterThanOrEqual(48)
        expect(box.height).toBeGreaterThanOrEqual(48)
        if (selector === '.cockpit-flight-tray') {
          const tools = (await page.locator('.scene-tools').boundingBox())!
          expect(box.y + box.height, 'flight holds must clear the viewer toolbar').toBeLessThanOrEqual(tools.y + 1)
        }
      }
      for (const action of await page.locator('.airbus-workload-actions button:visible').all()) {
        await expect(action).toBeInViewport({ ratio: 1 })
      }
      const holds = await page.locator(`${selector} button[data-hold]:visible`).evaluateAll(buttons => buttons.map(button => {
        const box = button.getBoundingClientRect()
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom }
      }))
      for (let index = 0; index < holds.length; index += 1) {
        for (const other of holds.slice(index + 1)) {
          const overlap = Math.min(holds[index].right, other.right) - Math.max(holds[index].left, other.left) > 1
            && Math.min(holds[index].bottom, other.bottom) - Math.max(holds[index].top, other.top) > 1
          expect(overlap, 'touch controls must not overlap each other').toBe(false)
        }
      }
    }
    if (selector === '.cockpit-flight-tray') {
      await page.setViewportSize({ width: 1440, height: 900 })
      await expect(page.getByRole('button', { name: /^Hold Pitch/ })).toHaveCount(2)
      await expect(page.getByRole('button', { name: 'Hold Bank left', exact: true })).toHaveText('Bank left')
    }
  })
}

test('two-finger departure holds work together and release when each finger lifts', async ({ page, context }) => {
  await openState(page, mobileDepartureState())
  const thrust = page.getByRole('button', { name: 'Advance thrust levers', exact: true })
  const rudder = page.getByRole('button', { name: 'Right rudder pedal', exact: true })
  await expect(thrust).toBeVisible(); await expect(rudder).toBeVisible()
  const first = (await thrust.boundingBox())!, second = (await rudder.boundingBox())!
  const cdp = await context.newCDPSession(page)
  const touches = [{ x: first.x + first.width / 2, y: first.y + first.height / 2, id: 1 }, { x: second.x + second.width / 2, y: second.y + second.height / 2, id: 2 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touches })
  await expect.poll(() => thrust.getAttribute('data-held')).toBe('true')
  await expect.poll(() => rudder.getAttribute('data-held')).toBe('true')
  // This Chromium sends pointerup for the named ending finger; an empty array ends all.
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [touches[0]] })
  await expect(thrust).toHaveAttribute('data-held', 'false')
  await expect(rudder).toHaveAttribute('data-held', 'true')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await expect(rudder).toHaveAttribute('data-held', 'false')
})

test('mobile scan keeps progressive hints and earned answers, with readable Help', async ({ page }) => {
  await openState(page, createDc9InstrumentScanState())
  const wrong = page.locator('.dc9-instrument-choice').nth(1)
  for (let attempts = 1; attempts <= 3; attempts += 1) {
    await wrong.tap()
    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).dc9.instrumentScan.attempts, STORAGE_KEY)).toBe(attempts)
    const message = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).statusMessage, STORAGE_KEY)
    await expect(page.locator('.cockpit-touch-feedback')).toContainText(message)
    await expect(page.locator('.cockpit-touch-feedback')).toBeInViewport({ ratio: 1 })
  }
  await expect(page.locator('.dc9-instrument-choice.is-final-hint')).toHaveCount(1)
  const help = page.getByText('Help', { exact: true })
  await help.tap()
  const dialog = page.getByRole('dialog', { name: 'Cockpit help' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Close help' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Tab')
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(dialog).toHaveCount(0)
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(dialog).toHaveCount(0)
  await expect(help).toHaveAttribute('aria-expanded', 'false')
  await help.tap()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(help).toBeFocused()
  await page.locator('.dc9-instrument-choice').first().tap()
  await expect(page.locator('.dc9-instrument-scan__progress')).toContainText('1 of 6')
  await page.reload()
  await expect(page.locator('.dc9-instrument-scan__progress')).toContainText('1 of 6')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expectSeparated(page, '.dc9-instrument-scan')
})

test('A320 labels can be placed with taps and survive orientation changes', async ({ page }) => {
  await openState(page, createAirbusState())
  await expect(page.getByRole('button', { name: 'Restart', exact: true })).toBeInViewport({ ratio: 1 })
  const card = page.locator('.airbus-card').first()
  await card.tap()
  await expect(card).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Cockpit drop zone 1', exact: true }).tap()
  await expect(card).toHaveClass(/is-placed/)
  await page.setViewportSize({ width: 667, height: 375 })
  await expect(card).toHaveClass(/is-placed/)
  await expectSeparated(page, '.airbus-card-tray')
})

test('A320 touch holds reach the simulation and Help pauses safely', async ({ page, context }) => {
  await openState(page, mobileAirbusFlightState())
  const bank = page.getByRole('button', { name: 'Hold Bank left', exact: true })
  const thrust = page.getByRole('button', { name: 'Hold Increase', exact: true })
  await expect(bank).toBeVisible(); await expect(thrust).toBeVisible()
  const a = (await bank.boundingBox())!, b = (await thrust.boundingBox())!
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x + a.width / 2, y: a.y + a.height / 2, id: 1 }, { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 2 }] })
  await expect(bank).toHaveAttribute('data-held', 'true')
  await expect(thrust).toHaveAttribute('data-held', 'true')
  await expect.poll(async () => parseFloat(await page.locator('.storm-instrument-mirror > div').nth(1).locator('strong').innerText())).toBeLessThan(-0.1)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(bank).toHaveAttribute('data-held', 'false')
  await page.getByText('Help', { exact: true }).tap()
  await expect(page.getByRole('dialog', { name: 'Cockpit help' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible()
  await expect(bank).toBeDisabled()
  await page.getByRole('button', { name: 'Close help' }).tap()
  await page.getByRole('button', { name: 'Resume', exact: true }).tap()
  await expect(bank).toBeEnabled()
})


test('mobile shutdown keeps wrong-order guidance and earned switches visible', async ({ page }) => {
  const state = createDc9QualificationState()
  state.dc9.stage = 'shutdown'
  state.dc9.secureSequence = []
  await openState(page, state)
  await expectSeparated(page, '.dc9-shutdown')
  const switches = page.locator('.dc9-shutdown__control')
  await switches.last().tap()
  const message = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).statusMessage, STORAGE_KEY)
  await expect(page.locator('.cockpit-touch-feedback')).toContainText(message)
  await expect(page.locator('.cockpit-touch-feedback')).toBeInViewport({ ratio: 1 })
  await switches.first().tap()
  await expect(switches.first()).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(switches.first()).toHaveAttribute('aria-pressed', 'true')
})

for (const [name, state, panel] of [
  ['DC-9', createDc9State(), '.dc9-control-check'],
  ['A320', createAirbusState(), '.airbus-card-tray'],
] as const) {
  test(`${name} compact controls and modal Help pass accessibility checks`, async ({ page }) => {
    await openState(page, state)
    await expectSeparated(page, panel)
    for (const helpOpen of [false, true]) {
      if (helpOpen) await page.getByRole('button', { name: 'Help', exact: true }).tap()
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const blocking = results.violations.filter(result => result.impact === 'serious' || result.impact === 'critical')
      expect(blocking.map(result => `${result.id}: ${result.help}: ${result.nodes.map(node => `${node.target.join(' ')} ${node.failureSummary}`).join('; ')}`)).toEqual([])
    }
  })
}
