/**
 * Browser proof for the character gym against a running dev server.
 *
 *   ARCADE_GYM_URL=http://127.0.0.1:5360/dev/gym.html node tools/assets/check-arcade-gym.mjs
 *
 * Exercises the authoring paths the gym exists for: the table loads and every clip
 * is listed, frames step with the keyboard, a box nudges by one pixel and undoes, the
 * onion skin and opponent overlay draw, playback advances on the table's holds, a
 * broken hold is refused at Save with the rule named, and the page has no console
 * errors. Screenshots land in ARCADE_EVIDENCE_DIR (default: preview-renders).
 *
 * Save is exercised only in its refusing path: a passing save would rewrite the
 * committed table from a test, which is exactly the trap the evidence rules warn about.
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const url = process.env.ARCADE_GYM_URL ?? 'http://127.0.0.1:5360/dev/gym.html'
const out = process.env.ARCADE_EVIDENCE_DIR ? process.env.ARCADE_EVIDENCE_DIR.replace(/\/?$/, '/') : new URL('../../preview-renders/mars-arcade/gym-v2/', import.meta.url).pathname
await mkdir(out, { recursive: true })

const browser = await chromium.launch({ headless: true })
const errors = []
const report = (line) => console.log(`ok - ${line}`)
try {
  for (const width of [1440, 768]) {
    const page = await browser.newPage({ viewport: { width, height: 1100 } })
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto(url)
    assert.match(await page.title(), /character gym/)
    const info = () => page.locator('#gym-info').innerText()
    const status = () => page.locator('#gym-status').innerText()
    const canvas = page.locator('#gym-canvas')

    // Every clip in the table is offered; the default is the booster jab on its active frame.
    const clips = await page.locator('#gym-animation option').count()
    assert.ok(clips >= 24, `expected the table's clips in the list, found ${clips}`)
    await page.locator('#gym-frames button').nth(1).click()
    assert.match(await info(), /phase active/)
    assert.match(await info(), /attack reaches 41 — matches reach/)
    report(`${width}: ${clips} clips listed; jab active frame reports its reach`)

    // Keyboard: ] steps a frame, arrows nudge the selected box, Ctrl+Z undoes.
    await canvas.focus()
    await page.keyboard.press(']')
    assert.match(await info(), /frame 3\/4/)
    await page.keyboard.press('[')
    assert.match(await info(), /frame 2\/4/)
    const before = Number((await page.locator('#gym-x').inputValue()))
    await page.keyboard.press('ArrowRight')
    assert.equal(Number(await page.locator('#gym-x').inputValue()), before + 1)
    assert.match(await info(), /\+1 against reach/)
    await page.keyboard.press('Control+z')
    assert.equal(Number(await page.locator('#gym-x').inputValue()), before)
    assert.match(await info(), /matches reach/)
    report(`${width}: keyboard frame step, 1 px nudge and undo`)

    // Onion skin and opponent overlay change what is drawn.
    const pixels = async () => canvas.evaluate((element) => {
      const ctx = element.getContext('2d')
      const data = ctx.getImageData(0, 0, element.width, element.height).data
      let sum = 0
      for (let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2]
      return { width: element.width, sum }
    })
    const plain = await pixels()
    await page.locator('#gym-onion').check()
    const onion = await pixels()
    assert.notEqual(onion.sum, plain.sum, 'onion skin must draw the neighbouring frames')
    await page.locator('#gym-onion').uncheck()
    await page.locator('#gym-opponent').check()
    const withOpponent = await pixels()
    assert.equal(withOpponent.width, plain.width + 40 * 4, 'opponent overlay widens the canvas by the separation')
    assert.match(await info(), /opponent at 40: boxes (CONNECT|miss), engine reach CONNECTS/)
    await page.locator('#gym-separation').fill('60')
    assert.match(await info(), /opponent at 60: boxes (CONNECT|miss), engine reach misses/)
    await page.screenshot({ path: `${out}gym-${width}-opponent.png`, fullPage: true })
    await page.locator('#gym-opponent').uncheck()
    report(`${width}: onion skin and opponent overlay draw; engine-vs-box verdicts shown`)

    // Playback advances on the table's holds: the jab is 4/3/3+4, so after ~10 ticks the
    // third frame is on screen, and the once-clip parks on the last drawing.
    await page.locator('#gym-frames button').nth(0).click()
    await page.locator('#gym-play').click()
    await page.waitForFunction(() => /tick 13/.test(document.querySelector('#gym-info').textContent), null, { timeout: 5000 })
    assert.match(await info(), /frame 4\/4 "reset"/)
    report(`${width}: playback runs the table's holds and parks on the last frame`)

    // A hold that breaks the move's frame data is refused at Save, naming the rule.
    await page.locator('#gym-frames button').nth(0).click()
    await page.locator('#gym-hold').fill('9')
    await page.locator('#gym-hold').blur()
    assert.match(await page.locator('#gym-findings').innerText(), /hold-sum/)
    await page.locator('#gym-save').click()
    assert.match(await status(), /not saved — 1 error/)
    await page.locator('#gym-undo').click()
    assert.doesNotMatch(await page.locator('#gym-findings').innerText(), /hold-sum/)
    report(`${width}: a broken hold is refused at Save and undone`)

    // Fit-to-drawing proposes boxes from the silhouette, on the baseline.
    await page.locator('#gym-animation').selectOption('oracle:jab')
    await page.locator('#gym-frames button').nth(1).click()
    await page.locator('#gym-fit-body').click()
    const bodyY = Number(await page.locator('#gym-y').inputValue())
    const bodyH = Number(await page.locator('#gym-h').inputValue())
    assert.equal(bodyY + bodyH, 119, 'fitted body box stands on the baseline')
    await page.locator('#gym-undo').click()
    await page.screenshot({ path: `${out}gym-${width}-oracle-jab.png`, fullPage: true })
    report(`${width}: fit-to-drawing lands the body box on the baseline`)
    await page.close()
  }
} finally {
  await browser.close()
}
assert.deepEqual(errors, [], `console errors: ${errors.join(' | ')}`)
report('no console errors')
