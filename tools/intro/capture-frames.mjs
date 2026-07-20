import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import {
  INTRO_EVIDENCE_TIMES,
  createIntroEvidenceFileName,
} from '../../src/game/introEvidence.ts'
import { getIntroScene } from '../../src/game/introConfig.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const OUTPUT_DIRECTORY = resolve(ROOT, 'preview-renders/tmb2-intro-finished')
const BASE_URL = 'http://127.0.0.1:4173'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

if (!executablePath) {
  throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required for deterministic captures')
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (previewFailure) throw previewFailure
    try {
      const response = await fetch(BASE_URL)
      if (response.ok) return
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250))
  }
  throw new Error('Timed out waiting for the production preview')
}

const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--strictPort'], {
  cwd: ROOT,
  stdio: ['ignore', 'inherit', 'inherit'],
  detached: false,
})
let previewFailure
preview.once('error', (error) => {
  previewFailure = new Error(`Production preview failed to start: ${error.message}`)
})
preview.once('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    previewFailure = new Error(`Production preview exited early with code ${code}`)
  } else if (signal && signal !== 'SIGTERM') {
    previewFailure = new Error(`Production preview exited early from ${signal}`)
  }
})

let browser
try {
  await waitForPreview()
  browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function deterministicPlay() {
      return Promise.resolve()
    }
  })
  await page.route('**/models/dc9-cockpit.glb*', (route) => route.abort())
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  const start = page.getByRole('button', { name: 'Start Game' })
  await start.waitFor({ state: 'visible' })
  await start.click()
  const intro = page.getByRole('region', { name: 'Game intro' })
  const canvas = intro.locator('canvas')
  await canvas.waitFor({ state: 'visible' })
  await mkdir(OUTPUT_DIRECTORY, { recursive: true })

  const captures = []
  for (const [index, time] of INTRO_EVIDENCE_TIMES.entries()) {
    const expectedScene = getIntroScene(time).id
    await page.locator('audio').evaluate((media, nextTime) => {
      media.currentTime = nextTime
      media.dispatchEvent(new Event('timeupdate'))
    }, time)
    await page.waitForFunction(
      (scene) => document.querySelector('.game-intro canvas')?.dataset.scene === scene,
      expectedScene,
    )
    await canvas.evaluate(() => new Promise((resolveFrame) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()))
    }))
    const scene = await canvas.getAttribute('data-scene')
    if (!scene) throw new Error(`No scene id at ${time} seconds`)
    const dataUrl = await canvas.evaluate((element) => element.toDataURL('image/png'))
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64')
    const filename = createIntroEvidenceFileName(index, scene)
    await writeFile(resolve(OUTPUT_DIRECTORY, filename), buffer)
    captures.push({ filename, timeSeconds: time, scene, width: 320, height: 224, sha256: sha256(buffer) })
  }

  await writeFile(
    resolve(OUTPUT_DIRECTORY, 'manifest.json'),
    `${JSON.stringify({ generatedBy: 'tools/intro/capture-frames.mjs', captures }, null, 2)}\n`,
  )
  console.log(`Captured ${captures.length} deterministic TMB2 frames in ${OUTPUT_DIRECTORY}`)
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
