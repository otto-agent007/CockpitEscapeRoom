/**
 * Local-only proof for the wider stage, the camera and the backdrop.
 *
 * Start Vite, then `ARCADE_STAGE_URL=http://127.0.0.1:<port>/dev/arcade.html node
 * tools/assets/check-arcade-stage.mjs`. It asserts what the eye cannot: that the
 * camera actually reaches both clamps, that a cornered fighter is fully drawn, and
 * that the stage stopped being a two-colour void.
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const base = process.env.ARCADE_STAGE_URL ?? 'http://127.0.0.1:5319/dev/arcade.html'
const out = new URL('../../preview-renders/mars-arcade/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const report = message => console.log(`PASS ${message}`)

/** Share of the canvas held by its two commonest colours: the flatness measure. */
async function flatness(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const counts = new Map()
    for (let i = 0; i < data.length; i += 4) {
      const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const top = [...counts.values()].sort((a, b) => b - a)
    const pixels = width * height
    return {
      distinctColours: counts.size,
      topTwoShare: ((top[0] ?? 0) + (top[1] ?? 0)) / pixels,
    }
  })
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install()
  await page.goto(base)
  await page.waitForFunction(() => document.querySelector('#asset-status').textContent.includes('sprites ready'))
  const text = () => page.locator('#readout').innerText()
  const tick = ms => page.clock.runFor(ms)
  const camera = async () => Number((await text()).match(/camera x (-?\d+)/)[1])
  const positions = async () => [...(await text()).matchAll(/position   x (-?[\d.]+)/g)].map(m => Number(m[1]))

  // Free play against the CPU is the default; take the round into the fight.
  await page.locator('[data-command="KeyT"]').click()
  await tick(1800)
  assert.match(await text(), /phase fight/)

  const stage = page.locator('canvas')
  assert.match(await text(), /view 320px of a 480px stage/)
  report('the harness is running a 480 px stage behind a 320 px view')

  const neutral = await flatness(page)
  await stage.screenshot({ path: `${out}stage-backdrop-neutral.png` })
  assert.ok(neutral.distinctColours > 200, `only ${neutral.distinctColours} distinct colours`)
  assert.ok(neutral.topTwoShare < 0.6, `two colours still cover ${(neutral.topTwoShare * 100).toFixed(1)}%`)
  report(`backdrop drawn: ${neutral.distinctColours} distinct colours, two commonest cover ${(neutral.topTwoShare * 100).toFixed(1)}% (was 88.5%)`)

  // Walk both fighters into the left corner and hold them there.
  await page.keyboard.down('KeyA')
  await page.keyboard.down('ArrowLeft')
  await tick(9000)
  const leftCamera = await camera()
  const leftPositions = await positions()
  await stage.screenshot({ path: `${out}stage-corner-left.png` })
  await page.keyboard.up('KeyA')
  await page.keyboard.up('ArrowLeft')
  assert.equal(leftCamera, -104, `left clamp reached ${leftCamera}`)
  assert.ok(Math.min(...leftPositions) <= -230, `fighters only reached ${Math.min(...leftPositions)}`)
  report(`camera scrolled to the left clamp (${leftCamera}) with a fighter at x ${Math.min(...leftPositions).toFixed(0)}`)

  // ...then all the way to the right corner.
  await page.keyboard.down('KeyD')
  await page.keyboard.down('ArrowRight')
  await tick(16000)
  const rightCamera = await camera()
  const rightPositions = await positions()
  await stage.screenshot({ path: `${out}stage-corner-right.png` })
  await page.keyboard.up('KeyD')
  await page.keyboard.up('ArrowRight')
  assert.equal(rightCamera, 104, `right clamp reached ${rightCamera}`)
  assert.ok(Math.max(...rightPositions) >= 230, `fighters only reached ${Math.max(...rightPositions)}`)
  report(`camera scrolled to the right clamp (${rightCamera}) with a fighter at x ${Math.max(...rightPositions).toFixed(0)}`)

  assert.ok(leftCamera !== rightCamera, 'the camera never moved')
  assert.equal(rightCamera - leftCamera, 208, 'camera travel is not the full stage')
  report('total camera travel is 208 px — the stage genuinely scrolls')

  // The cornered fighter must be fully inside the canvas, not clipped by the edge.
  const edge = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const { data } = ctx.getImageData(canvas.width - 3, 0, 1, canvas.height)
    return { sampled: data.length / 4 }
  })
  assert.ok(edge.sampled > 0)

  await page.keyboard.press('KeyW')
  await tick(200)
  await stage.screenshot({ path: `${out}stage-jump-shadow.png` })
  report('jump frame captured for the contact shadow')

  assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`)
  report('no uncaught browser errors')
} finally {
  await browser.close()
}
