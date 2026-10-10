#!/usr/bin/env node
/** Exercise real correction/save/reload in an isolated copy; never edit owner art/table. */
import assert from 'node:assert/strict'
import { mkdtemp, cp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

const root = process.cwd(), out = resolve(process.env.ARCADE_EVIDENCE_DIR || 'preview-renders/mars-arcade/gym-art-tools/browser')
await mkdir(out, { recursive: true })
const fixture = await mkdtemp(resolve(tmpdir(), 'gym-art-browser-'))
const original = JSON.parse(await readFile('src/game/marsArcadeAnimations.json', 'utf8'))
const inputHashes = new Map()
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
let server, browser
const reports = []
const report = text => { reports.push(text); console.log(`ok - ${text}`) }
try {
  for (const path of ['src', 'dev', 'vite.config.ts', 'package.json', 'tools/dev', 'tools/assets/lib', 'tools/assets/check-popt-frames-fullcolour.py', 'asset-reports/mars-arcade-sprite-contract.json']) {
    await mkdir(dirname(resolve(fixture, path)), { recursive: true })
    await cp(resolve(root, path), resolve(fixture, path), { recursive: true })
  }
  await symlink(resolve(root, 'node_modules'), resolve(fixture, 'node_modules'), 'dir')
  for (const src of new Set(original.animations.flatMap(e => e.frames.map(f => f.src)))) {
    const path = src.slice(1), bytes = await readFile(resolve(root, path))
    inputHashes.set(path, hash(bytes))
    await mkdir(dirname(resolve(fixture, path)), { recursive: true }); await writeFile(resolve(fixture, path), bytes)
  }
  server = await createServer({ root: fixture, configFile: resolve(fixture, 'vite.config.ts'), server: { host: '127.0.0.1', port: 5361, strictPort: true, hmr: false }, logLevel: 'error' })
  await server.listen()
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('http://127.0.0.1:5361/dev/gym.html')
  // Reproduce the owner's gray shoes before exercising the existing save proof.
  await page.locator('#gym-animation').selectOption('captain:jab-candidate')
  await page.locator('#gym-frames button').nth(1).click()
  await page.locator('#gym-art-region').selectOption('shoes')
  await page.waitForFunction(() => document.querySelector('#gym-art').getAttribute('aria-busy') === 'false')
  await page.locator('#gym-art-palette').click()
  await page.waitForFunction(() => /pixels changed/.test(document.querySelector('#gym-art-status').textContent))
  assert.match(await page.locator('#gym-art-status').innerText(), /outside tolerance/)
  const sampleShoe = () => page.locator('#gym-art-current').evaluate(c => [...c.getContext('2d').getImageData(56, 113, 1, 1).data])
  const grayShoe = await sampleShoe()
  assert.ok(grayShoe[0] > 100, 'nearby matching must reproduce the skipped light shoe highlight')
  const trousersBefore = await page.locator('#gym-art-current').evaluate(c => [...c.getContext('2d').getImageData(53, 90, 1, 1).data])
  const nearDraft = await page.evaluate(() => sessionStorage.getItem('mars-arcade-gym-art-v1'))
  await page.locator('#gym-art-palette').click()
  await page.waitForFunction(() => /No pixels changed/.test(document.querySelector('#gym-art-status').textContent))
  assert.equal(await page.evaluate(() => sessionStorage.getItem('mars-arcade-gym-art-v1')), nearDraft, 'repeating a match must not add empty corrections')
  await page.locator('#gym-art-all-colors').check()
  await page.locator('#gym-art-palette').focus(); await page.keyboard.press('Enter')
  await page.waitForFunction(() => /2 corrections on this drawing/.test(document.querySelector('#gym-art-metrics').textContent))
  const shoePreview = await page.locator('#gym-art-current').evaluate(c => [...c.getContext('2d').getImageData(0, 0, 128, 128).data])
  const matchedShoe = await sampleShoe()
  assert.ok(matchedShoe[0] <= 56 && matchedShoe[1] <= 61 && matchedShoe[2] <= 52, 'light gray highlight must become a dark reference shoe color')
  assert.equal(matchedShoe[3], grayShoe[3], 'shoe transparency must stay unchanged')
  assert.deepEqual(await page.locator('#gym-art-current').evaluate(c => [...c.getContext('2d').getImageData(53, 90, 1, 1).data]), trousersBefore, 'shoe-only matching must leave trousers intact')
  const shoeDraft = await page.evaluate(() => sessionStorage.getItem('mars-arcade-gym-art-v1'))
  assert.ok(Object.values(JSON.parse(shoeDraft)).every(ops => ops.at(-1).includeDistant === true))
  await page.locator('#gym-art-undo').click()
  await page.waitForFunction(() => /1 corrections on this drawing/.test(document.querySelector('#gym-art-metrics').textContent))
  assert.equal(await page.evaluate(() => sessionStorage.getItem('mars-arcade-gym-art-v1')), nearDraft)
  await page.locator('#gym-art-palette').click()
  await page.waitForFunction(() => /2 corrections on this drawing/.test(document.querySelector('#gym-art-metrics').textContent))
  await page.reload()
  await page.waitForFunction(() => /2 corrections on this drawing/.test(document.querySelector('#gym-art-metrics').textContent))
  await page.locator('#gym-art-region').selectOption('shoes')
  await page.waitForFunction(() => document.querySelector('#gym-art').getAttribute('aria-busy') === 'false')
  assert.deepEqual(await page.locator('#gym-art-current').evaluate(c => [...c.getContext('2d').getImageData(0, 0, 128, 128).data]), shoePreview)
  await page.locator('#gym-art-reset').click()
  await page.waitForFunction(() => /0 corrections on this drawing/.test(document.querySelector('#gym-art-metrics').textContent))
  report('gray shoe reproduction: tolerance skips reported, all-color keyboard match/Undo/reload work, repeated match adds no empty correction')
  await page.locator('#gym-animation').selectOption('captain:heavy-candidate')
  await page.locator('#gym-frames button').nth(2).click()
  const metrics = () => page.locator('#gym-art-metrics').innerText()
  const artStatus = () => page.locator('#gym-art-status').innerText()
  const canvasBytes = selector => page.locator(selector).evaluate(canvas => [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data])
  await page.waitForFunction(() => document.querySelector('#gym-art-metrics').textContent.includes('Current: height 105'))
  assert.match(await metrics(), /Reference: height 104/)
  const referenceSrc = await page.locator('#gym-art-reference').inputValue()
  const before = await canvasBytes('#gym-art-current')
  report('fixed Captain idle reference and initial size/body metrics load')

  let operations = 0
  async function action(selector) {
    await page.locator(selector).click()
    operations++
    await page.waitForFunction(n => document.querySelector('#gym-art-metrics').textContent.includes(`${n} corrections on this drawing`), operations)
    await assert.doesNotReject(async () => assert.match(await artStatus(), /Preview updated/))
  }
  await action('#gym-art-height-match')
  await action('#gym-art-align')
  for (const region of ['shoes', 'hat', 'trousers']) {
    await page.locator('#gym-art-region').selectOption(region)
    await page.locator('#gym-art-all-colors').setChecked(region === 'shoes')
    await action('#gym-art-palette')
  }
  for (let i = 0; i < 5; i++) {
    await page.locator('#gym-frames button').nth(i).click()
    await page.waitForFunction(() => document.querySelector('#gym-art-metrics').textContent.includes('Current: height 104'))
    const measured = await metrics()
    assert.match(measured, /feet 119/)
    const body = Number(/Current: height 104, body x ([\d.]+)/.exec(measured)[1])
    assert.ok(Math.abs(body - 52) <= 1, measured)
    const foot = Number(/foot center ([\d.]+)/.exec(measured)[1])
    assert.ok(Math.abs(foot - 64) <= 1, measured)
    assert.equal(await page.locator('#gym-art-reference').inputValue(), referenceSrc)
  }
  report('all five heavy poses match reference height/feet, body within 1px and foot pivot within contract; three region palettes preview')
  await page.locator('#gym-frames button').nth(2).click()
  const corrected = await canvasBytes('#gym-art-current')
  assert.notDeepEqual(corrected, before)
  await page.locator('#gym-art-original').check()
  await page.waitForFunction(() => document.querySelector('#gym-art-original').checked)
  assert.notDeepEqual(await canvasBytes('#gym-art-current'), corrected)
  await page.locator('#gym-art-original').uncheck()
  await page.locator('#gym-art-overlay').check()
  await page.screenshot({ path: resolve(out, '1440-reference-overlay.png'), fullPage: true })
  await page.locator('#gym-art-overlay').uncheck()
  report('before/after playback and fixed-reference stage overlay draw')

  await page.locator('#gym-art-scope').selectOption('drawing')
  const beforeNudgeBody = Number(/Current: height 104, body x ([\d.]+)/.exec(await metrics())[1])
  await page.locator('#gym-art-shift-x').fill('1')
  await page.locator('#gym-art-shift').focus(); await page.keyboard.press('Space')
  operations++
  await page.waitForFunction(n => document.querySelector('#gym-art-metrics').textContent.includes(`${n} corrections on this drawing`), operations)
  assert.match(await metrics(), new RegExp(`body x ${beforeNudgeBody + 1}`))
  await page.locator('#gym-art-undo').click(); operations--
  await page.waitForFunction(body => document.querySelector('#gym-art-metrics').textContent.includes(`body x ${body},`), beforeNudgeBody)
  await page.locator('#gym-art-shift-x').fill('100')
  for (let repeat = 0; repeat < 2; repeat++) {
    await page.locator('#gym-art-shift').click()
    await page.waitForFunction(() => /clip/.test(document.querySelector('#gym-art-status').textContent))
    assert.match(await metrics(), new RegExp(`${operations} corrections on this drawing`))
  }
  report('native keyboard nudge/Undo and repeated clipping refusal retain the valid draft')
  await page.locator('#gym-art-sample-x').fill('58'); await page.locator('#gym-art-sample-y').fill('114')
  await page.locator('#gym-art-sample-from').click(); assert.match(await artStatus(), /Source color sampled/)
  await page.locator('#gym-art-sample-to').click(); assert.match(await artStatus(), /Reference color sampled/)
  await page.locator('#gym-art-region').selectOption('shoes')
  await page.locator('#gym-art-to').evaluate(input => { input.value = '#aa2222'; input.dispatchEvent(new Event('change', { bubbles: true })) })
  await action('#gym-art-replace')
  const recolored = await canvasBytes('#gym-art-current')
  assert.notDeepEqual(recolored, corrected)
  await page.locator('#gym-art-undo').click(); operations--
  await page.waitForFunction(n => document.querySelector('#gym-art-metrics').textContent.includes(`${n} corrections on this drawing`), operations)
  report('native coordinate samplers and scoped color replacement/Undo work')

  await page.locator('#gym-save').click()
  assert.match(await page.locator('#gym-status').innerText(), /Save corrected copy/)
  await page.reload()
  await page.waitForFunction(() => /5 corrections on this drawing/.test(document.querySelector('#gym-art-metrics').textContent))
  assert.equal(await page.locator('#gym-animation').inputValue(), 'captain:heavy-candidate')
  // The selection outline is decoration; use the same area for pixel comparison.
  await page.locator('#gym-art-region').selectOption('trousers')
  await page.waitForFunction(() => document.querySelector('#gym-art').getAttribute('aria-busy') === 'false')
  assert.deepEqual(await canvasBytes('#gym-art-current'), corrected)
  report('reload restores the selected frame and unsaved art draft; normal Save explains separate art persistence')

  // Unrelated local review settings must neither stale the art baseline nor be
  // silently persisted by a corrected-copy save.
  await page.locator('#gym-loop').selectOption('loop')

  const savedResponse = page.waitForResponse(response => response.url().endsWith('/__gym/art') && response.request().method() === 'POST')
  await page.locator('#gym-art-save').click()
  const response = await savedResponse
  assert.ok(response.ok(), `Save refused: ${await response.text()}`)
  await page.waitForFunction(() => /Corrected copy saved/.test(document.querySelector('#gym-art-status').textContent), null, { timeout: 30000 })
  const key = await page.locator('#gym-animation').inputValue()
  assert.match(key, /^captain:heavy-candidate-art-/)
  assert.equal(await page.locator('#gym-reviewed').isChecked(), false)
  const persisted = JSON.parse(await readFile(resolve(fixture, 'src/game/marsArcadeAnimations.json'), 'utf8'))
  assert.deepEqual(persisted.animations.slice(0, original.animations.length), original.animations)
  assert.equal(persisted.animations.find(e => e.fighter === 'captain' && e.animation === 'heavy-candidate').loop, 'once')
  await page.locator('#gym-animation').selectOption('captain:heavy-candidate')
  assert.equal(await page.locator('#gym-loop').inputValue(), 'loop')
  await page.locator('#gym-animation').selectOption(key)
  const savedClip = persisted.animations.at(-1)
  assert.equal(savedClip.moveId, undefined); assert.ok(savedClip.frames.every(f => !f.attack))
  for (const [path, digest] of inputHashes) assert.equal(hash(await readFile(resolve(fixture, path))), digest, path)
  await page.locator('#gym-frames button').nth(2).click()
  await page.reload()
  await page.waitForFunction(() => document.querySelector('#gym-animation').value.includes('-art-'))
  await page.waitForFunction(() => /Current: height 104/.test(document.querySelector('#gym-art-metrics').textContent))
  await page.locator('#gym-art-region').selectOption('trousers')
  await page.waitForFunction(() => document.querySelector('#gym-art').getAttribute('aria-busy') === 'false')
  assert.deepEqual(await canvasBytes('#gym-art-current'), corrected, 'saving and reopening must preserve the displayed correction pixels')
  const savedSrc = await page.locator('#gym-src').inputValue()
  assert.ok(savedSrc.includes('/gym-edits/'))
  report('real Save appends a gated unbound copy with new PNGs/recipe; all original clips and 82 input drawing hashes remain unchanged; reload reopens copy')
  report('corrected-copy save preserves unrelated unsaved loop settings locally without changing the original clip on disk')

  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 1100 })
    await page.locator('#gym-mirror').setChecked(width === 768)
    await page.locator('#gym-art-reference').scrollIntoViewIfNeeded()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: overflow`)
    await page.locator('#gym-art').screenshot({ path: resolve(out, `${width}-art-panel.png`) })
    if (width === 1440) {
      const currentRect = await page.locator('#gym-art-current').boundingBox(), referenceRect = await page.locator('#gym-art-reference-view').boundingBox()
      assert.equal(currentRect.y, referenceRect.y, 'side-by-side comparison baselines must align on screen')
      const box = await page.locator('#gym-art').boundingBox()
      await page.screenshot({ path: resolve(out, '1440-editor-overview.png'), clip: { x: box.x, y: box.y, width: box.width, height: 680 } })
    }
    report(`${width}: usable native controls, fixed-reference panel, no horizontal overflow${width === 768 ? ', mirrored stage' : ''}`)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#gym-art-scope').selectOption('clip')
  await page.locator('#gym-art-shift-x').fill('1'); await page.locator('#gym-art-shift-y').fill('0')
  await page.locator('#gym-art-shift').click()
  await page.waitForFunction(() => /1 corrections/.test(document.querySelector('#gym-art-metrics').textContent))
  await page.locator('#gym-art-reset').click()
  await page.waitForFunction(() => /0 corrections/.test(document.querySelector('#gym-art-metrics').textContent))
  assert.equal(await page.locator('#gym-art-save').isDisabled(), true)
  report('reduced-motion editing, whole-clip reset and unchanged save state work')
  // Normal table Save must advance the optimistic baseline for the next art save.
  await page.locator('#gym-loop').selectOption('loop')
  const normalResponse = page.waitForResponse(r => r.url().endsWith('/__gym/animations') && r.request().method() === 'POST')
  await page.locator('#gym-save').click()
  assert.ok((await normalResponse).ok())
  await page.waitForFunction(() => /saved to src/.test(document.querySelector('#gym-status').textContent))
  await page.locator('#gym-art-scope').selectOption('drawing')
  await page.locator('#gym-art-shift').click()
  await page.waitForFunction(() => /1 corrections/.test(document.querySelector('#gym-art-metrics').textContent))
  const secondSave = page.waitForResponse(r => r.url().endsWith('/__gym/art') && r.request().method() === 'POST')
  await page.locator('#gym-art-save').click()
  const second = await secondSave
  assert.ok(second.ok(), await second.text())
  await page.waitForFunction(() => /Corrected copy saved/.test(document.querySelector('#gym-art-status').textContent))
  report('normal timing/box Save advances the baseline; a subsequent corrected-copy save succeeds')
  assert.deepEqual(errors, [])
  const recipeFolder = dirname(dirname(resolve(fixture, savedSrc.slice(1))))
  await cp(recipeFolder, resolve(out, 'saved-copy'), { recursive: true })
  await writeFile(resolve(out, 'proof.json'), JSON.stringify({ reports, unexpectedBrowserErrors: errors, originalClips: original.animations.length, originalDrawings: inputHashes.size, savedClip: key }, null, 2) + '\n')
  report('no console/page errors')
} catch (error) {
  const page = browser?.contexts()[0]?.pages()[0]
  if (page) {
    console.log('Failure art status:', await page.locator('#gym-art-status').innerText().catch(() => 'unavailable'))
    await page.screenshot({ path: resolve(out, 'failure.png'), fullPage: true }).catch(() => {})
  }
  throw error
} finally {
  await browser?.close(); await server?.close(); await rm(fixture, { recursive: true, force: true })
}
