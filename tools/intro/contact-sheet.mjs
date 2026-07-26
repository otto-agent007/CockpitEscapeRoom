/**
 * Render the intro timeline to a single contact sheet.
 *
 * Every visual defect found in this cinematic so far was found by looking at one of these,
 * and none of them were visible to the test suite: a neon trace drawn as a beam through the
 * character's chest, pale bars across his uniform where wings were intended, an impact star
 * flashing in empty street, a reset beat that hard-cut to black. The suite stayed green
 * throughout, because it asserted that props existed at plausible sizes and never once
 * looked at a frame.
 *
 * Usage:
 *   node tools/intro/contact-sheet.mjs [--out FILE] [--times 1,2,3] [--width N] [--scale N]
 *
 * Requires the dev server. Start it first: npm run dev -- --port 5199
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const DEFAULT_TIMES = [
  0.4, 1.2, 2.4, 3.6, 5.0, 5.9,
  6.5, 9, 11.5, 13, 14.5, 15.8,
  17, 19, 21.5, 23, 25, 27.5,
  29, 31, 33.5, 34.8, 36, 38,
  41, 43, 45, 47.5, 49, 50.5,
  51.5, 52.2, 52.6, 52.9,
]

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? fallback : process.argv[index + 1]
}

const origin = arg('origin', 'http://localhost:5199')
const outPath = resolve(arg('out', 'preview-renders/intro-contact-sheet.png'))
const columns = Number(arg('columns', 6))
const scale = Number(arg('scale', 2))
const times = (arg('times', '') || '')
  .split(',').map((value) => value.trim()).filter(Boolean).map(Number)
const frameTimes = times.length > 0 ? times : DEFAULT_TIMES

const { chromium } = await import('@playwright/test')
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined

const browser = await chromium.launch({ executablePath })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const problems = []
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') problems.push(`console: ${message.text()}`)
})

// Load the app origin first so the module imports below are same-origin; the page's own DOM
// is irrelevant, the sheet is composited in a detached canvas.
await page.goto(origin, { waitUntil: 'domcontentloaded' })

const dataUrl = await page.evaluate(async ({ frameTimes, columns, scale }) => {
  const animation = await import('/src/game/introAnimation.ts')
  const assets = await import('/src/game/introAssets.ts')
  const geometry = await import('/src/game/introGeometry.ts')
  const renderer = await import('/src/game/introRenderer.ts')

  const loaded = await assets.preloadIntroAssets('/', 'full')
  const cellWidth = geometry.INTRO_STAGE_WIDTH * scale
  const cellHeight = geometry.INTRO_STAGE_HEIGHT * scale
  const label = 16
  const rows = Math.ceil(frameTimes.length / columns)

  const sheet = document.createElement('canvas')
  sheet.width = columns * cellWidth
  sheet.height = rows * (cellHeight + label)
  const target = sheet.getContext('2d')
  target.fillStyle = '#101014'
  target.fillRect(0, 0, sheet.width, sheet.height)

  const cell = document.createElement('canvas')
  cell.width = cellWidth
  cell.height = cellHeight
  const cellContext = cell.getContext('2d')

  for (const [index, time] of frameTimes.entries()) {
    const frame = animation.deriveIntroAnimation(time, false)
    renderer.renderIntroFrame(cellContext, frame, loaded, null, scale)
    const x = (index % columns) * cellWidth
    const y = Math.floor(index / columns) * (cellHeight + label)
    target.drawImage(cell, x, y)
    target.font = '11px ui-monospace, monospace'
    target.fillStyle = '#9aa4b2'
    target.fillText(`t=${time}s  ${frame.sceneId}`, x + 4, y + cellHeight + 12)
  }
  return sheet.toDataURL('image/png')
}, { frameTimes, columns, scale })

await browser.close()

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, Buffer.from(dataUrl.split(',')[1], 'base64'))

if (problems.length > 0) {
  console.error('Page reported problems while rendering:')
  for (const problem of problems) console.error(`  ${problem}`)
}
console.log(`Wrote ${outPath} (${frameTimes.length} frames at ${scale}x)`)
if (problems.length > 0) process.exit(1)
