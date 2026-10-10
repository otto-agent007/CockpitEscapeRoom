// Browser proof for arcade controllers: drives /dev/arcade.html with fake pads behind
// navigator.getGamepads. Start `npm run dev` first, then:
//   node tools/dev/arcadeControllerProof.cjs http://127.0.0.1:5173/dev/arcade.html [screenshot-dir]
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')
const URL = process.argv[2] ?? 'http://127.0.0.1:5173/dev/arcade.html'
const OUT = path.resolve(process.argv[3] ?? 'test-results/arcade-controllers')
fs.mkdirSync(OUT, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`) }

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.addInitScript(() => {
    window.__pads = [null, null, null, null]
    window.__mkPad = (index, id, mapping = 'standard') => ({ index, id, mapping, connected: true, timestamp: 0,
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) })
    Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value() { return window.__pads } })
  })
  await page.goto(URL)
  const connect = (i, id, mapping) => page.evaluate(([i, id, mapping]) => { window.__pads[i] = window.__mkPad(i, id, mapping) }, [i, id, mapping])
  const disconnect = i => page.evaluate(i => { window.__pads[i] = null }, i)
  const set = (i, { buttons = [], axes = [0, 0, 0, 0] } = {}) => page.evaluate(([i, buttons, axes]) => {
    const pad = window.__pads[i]; pad.axes = axes
    pad.buttons = pad.buttons.map((_, b) => ({ pressed: buttons.includes(b), touched: buttons.includes(b), value: buttons.includes(b) ? 1 : 0 }))
  }, [i, buttons, axes])
  const tap = async (i, buttons, ms = 80) => { await set(i, { buttons }); await sleep(ms); await set(i) }
  const readout = () => page.textContent('#readout')
  const padStatus = () => page.textContent('#pad-status')
  const xs = async () => [...(await readout()).matchAll(/position\s+x (-?[\d.]+)/g)].map(m => Number(m[1]))
  const moves = async () => [...(await readout()).matchAll(/move\s+(\S+)/g)].map(m => m[1])
  const meters = async () => [...(await readout()).matchAll(/meter\s+(\d+)/g)].map(m => Number(m[1]))
  const pick = async (p1, p2) => {
    await page.selectOption('select[data-fighter="0"]', p1)
    await page.selectOption('select[data-fighter="1"]', p2)
    await sleep(3500)
  }

  await sleep(1500)
  check('no controller: status explains how to connect', /No controller yet/.test(await padStatus()), await padStatus())

  // --- One controller on P1, CPU on P2 at first.
  await connect(0, 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)')
  await sleep(100)
  check('first controller seats on P1', /^P1 controller: Xbox Wireless Controller\. P2 plays on the keyboard/.test(await padStatus()), await padStatus())
  await pick('captain', 'booster')
  // Make P2 a passive human so the CPU does not move the fight around.
  await page.click('button[data-command="KeyT"]')
  // A clean round so the walk starts from the spawn points, clear of P2's pushbox.
  await page.click('button[data-command="KeyR"]'); await sleep(3500)
  let before = await xs()
  await set(0, { buttons: [15] }); await sleep(600); await set(0)
  let after = await xs()
  check('P1 d-pad right walks P1 right', after[0] > before[0] + 5 && Math.abs(after[1] - before[1]) < 0.5, `${before} → ${after}`)
  before = after
  await set(0, { axes: [-1, 0, 0, 0] }); await sleep(400); await set(0)
  after = await xs()
  check('P1 left stick walks P1 left', after[0] < before[0] - 5, `${before} → ${after}`)
  await set(0, { buttons: [2] }); await sleep(60)
  check('P1 X starts the Captain palm jab', (await moves())[0] === 'captain.palmJab', String(await moves()))
  await set(0); await sleep(800)
  await set(0, { buttons: [3] }); await sleep(60)
  check('P1 Y starts the Captain heavy', (await moves())[0] === 'captain.runTheChecklist', String(await moves()))
  await set(0); await sleep(1200)
  await page.click('#pg-fill-meter'); await sleep(50)
  await set(0, { buttons: [1] }); await sleep(60)
  check('P1 B starts the Captain flyby special', (await moves())[0] === 'captain.flyby', String(await moves()))
  await set(0); await sleep(2500)

  // --- Second controller joins as P2 and takes it from the CPU.
  await page.click('button[data-command="KeyT"]'); await sleep(100) // P2 back to CPU
  check('P2 is CPU before the second controller', /P2 CPU/.test(await readout()))
  await connect(1, '054c-0ce6-DualSense Wireless Controller')
  await tap(1, [0])
  await sleep(100)
  check('second controller seats on P2 and makes P2 human', /P2 human/.test(await readout()) && /P2 controller: DualSense Wireless Controller/.test(await padStatus()), await padStatus())
  await sleep(1200)
  before = await xs()
  await set(1, { buttons: [14] }); await sleep(500); await set(1)
  after = await xs()
  check('P2 d-pad left walks P2 only', after[1] < before[1] - 5 && Math.abs(after[0] - before[0]) < 0.5, `${before} → ${after}`)
  await set(1, { buttons: [3] }); await sleep(60)
  check('P2 triangle/Y starts the P2 heavy', /^booster\./.test((await moves())[1] ?? '') && (await moves())[1] !== undefined, String(await moves()))
  await set(1); await sleep(1200)

  // --- Both at once: two humans in the same frame.
  before = await xs()
  await set(0, { buttons: [15] }); await set(1, { buttons: [15] }); await sleep(500); await set(0); await set(1)
  after = await xs()
  check('both controllers move in the same frames', after[0] > before[0] + 5 && after[1] > before[1] + 5, `${before} → ${after}`)

  // --- Start pauses, Back restarts.
  await tap(0, [9]); await sleep(100)
  check('Start pauses', /PAUSED/.test(await readout()))
  await tap(1, [9]); await sleep(100)
  check('Start on either controller resumes', !/PAUSED/.test(await readout()))
  await sleep(300)
  await tap(0, [8]); await sleep(100)
  const phase = (await readout()).match(/phase (\w+)\s+frame (\d+)/)
  check('Back restarts the round', phase && Number(phase[2]) < 30, phase?.[0])

  // --- Swap sides.
  await page.click('button[data-command="swapPads"]'); await sleep(100)
  check('swap puts DualSense on P1 and Xbox on P2', /^P1 controller: DualSense Wireless Controller · P2 controller: Xbox Wireless Controller$/.test(await padStatus()), await padStatus())
  await sleep(3500)
  before = await xs()
  await set(1, { buttons: [15] }); await sleep(500); await set(1)
  after = await xs()
  check('after swap the DualSense drives P1', after[0] > before[0] + 5 && Math.abs(after[1] - before[1]) < 0.5, `${before} → ${after}`)
  await page.click('button[data-command="swapPads"]'); await sleep(100)

  // --- P1 drops out; P2 keeps P2.
  await disconnect(0); await sleep(100)
  check('P1 disconnect leaves P2 seated on P2', /^P2 controller: DualSense Wireless Controller\. P1 plays on the keyboard/.test(await padStatus()), await padStatus())
  before = await xs()
  await page.focus('#stage')
  await page.keyboard.down('KeyD'); await set(1, { buttons: [14] }); await sleep(500); await page.keyboard.up('KeyD'); await set(1)
  after = await xs()
  check('keyboard P1 and controller P2 play together', after[0] > before[0] + 5 && after[1] < before[1] - 5, `${before} → ${after}`)

  // --- Sam's Non-Profit Pivot from the controller's stick motion.
  await connect(0, 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)')
  await tap(0, [], 50); await sleep(100)
  await pick('oracle', 'booster')
  await page.click('#pg-fill-meter'); await page.click('#pg-fill-meter')
  await set(0, { buttons: [15] }); await sleep(900); await set(0)
  const gap = (await xs()); const m0 = await meters()
  await sleep(150) // the motion starts from a fresh forward, as on the keyboard
  await set(0, { axes: [1, 0, 0, 0] }); await sleep(50)
  await set(0, { axes: [0, 1, 0, 0] }); await sleep(50)
  await set(0, { axes: [0.71, 0.71, 0, 0] }); await sleep(34)
  await set(0, { axes: [0.71, 0.71, 0, 0], buttons: [3] }); await sleep(80); await set(0)
  await sleep(200)
  const pivotText = await page.textContent('#pivot-status')
  const m1 = await meters()
  check('stick forward, down, down-forward + Y fires Sam\'s Pivot', m1[0] < m0[0] && /pivot|open-source|non-profit/i.test(pivotText + (await readout())), `gap ${gap} meter ${m0}→${m1} status "${pivotText}"`)
  await sleep(7000)
  console.log((await readout()).split('\n').filter(l => /health|status|meter/.test(l)).join('\n'))

  // --- Layout at three widths.
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await sleep(300)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    check(`no horizontal overflow at ${width}px`, overflow <= 0, `overflow ${overflow}`)
    await page.screenshot({ path: path.join(OUT, `arcade-pads-${width}.png`), fullPage: false })
  }
  check('no page or console errors', errors.length === 0, errors.join(' | '))
  await browser.close()
  const failed = results.filter(r => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} passed`)
  process.exit(failed ? 1 : 0)
})().catch(e => { console.error(e); process.exit(2) })
