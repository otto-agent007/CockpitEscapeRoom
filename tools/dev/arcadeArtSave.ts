/** Local-only correction persistence: replay recipes, gate new pixels, append a candidate. */
import { createHash, randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { deflateSync } from 'node:zlib'
import { readPng } from '../assets/lib/png.mjs'
import { applyArtOperations, measureArt, parseArtOperations, type ArtPixels } from '../../src/dev/arcadeArt.ts'
import { parseMarsArcadeAnimations, validateMarsArcadeAnimations, marsArcadeAnimationErrors, marsArcadeAnimationKey } from '../../src/game/marsArcadeAnimations.ts'

const run = promisify(execFile)
const queues = new Map<string, Promise<void>>()
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

function pngChunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type), data])
  let crc = 0xffffffff
  for (const byte of body) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  const out = Buffer.alloc(body.length + 8)
  out.writeUInt32BE(data.length, 0); body.copy(out, 4); out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, out.length - 4)
  return out
}
function pngBytes(p: ArtPixels): Buffer {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(p.width, 0); header.writeUInt32BE(p.height, 4); header[8] = 8; header[9] = 6
  const stride = p.width * 4, rows = Buffer.alloc((stride + 1) * p.height)
  for (let y = 0; y < p.height; y++) rows.set(p.data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', header), pngChunk('IDAT', deflateSync(rows)), pngChunk('IEND', Buffer.alloc(0))])
}

export async function saveGymArt(root: string, input: unknown) {
  // Serialize our own writes; recheck the baseline after the gate for external changes.
  const previous = queues.get(root) ?? Promise.resolve()
  let release!: () => void
  const waiting = new Promise<void>(done => { release = done })
  queues.set(root, waiting)
  await previous
  try { return await saveCopy(root, input) } finally { release(); if (queues.get(root) === waiting) queues.delete(root) }
}

async function saveCopy(root: string, input: unknown) {
  if (!input || typeof input !== 'object') throw new Error('Missing correction request')
  const request = input as Record<string, unknown>
  const baseFile = parseMarsArcadeAnimations(request.baseFile)
  const tablePath = resolve(root, 'src/game/marsArcadeAnimations.json')
  const before = await readFile(tablePath, 'utf8')
  if (JSON.stringify(parseMarsArcadeAnimations(JSON.parse(before))) !== JSON.stringify(baseFile)) throw new Error('Animation table changed; reload before saving a corrected copy')
  const entry = baseFile.animations.find(e => marsArcadeAnimationKey(e.fighter, e.animation) === request.key)
  if (!entry || !Array.isArray(request.edits) || !request.edits.length || request.edits.length > 64) throw new Error('Choose a clip and 1–64 corrected drawings')
  const fighterRoot = await realpath(resolve(root, 'art-source/arcade', entry.fighter))
  if (fighterRoot !== resolve(root, 'art-source/arcade', entry.fighter)) throw new Error('Fighter source directory must be inside this workspace')
  const originals = new Set(entry.frames.map(f => f.src)), seen = new Set<string>()
  let reference: { src: string; hash: string } | null = null
  if (request.reference) {
    const ref = request.reference as Record<string, unknown>
    const sameFighter = new Set(baseFile.animations.filter(e => e.fighter === entry.fighter).flatMap(e => e.frames.map(f => f.src)))
    if (typeof ref.src !== 'string' || !sameFighter.has(ref.src) || ref.src.includes('..') || !/^[\w/.-]+\.png$/.test(ref.src)) throw new Error('Reference must be a saved drawing from the same fighter')
    const path = await realpath(resolve(root, ref.src.slice(1)))
    if (!path.startsWith(fighterRoot + sep)) throw new Error('Reference leaves the fighter directory')
    const digest = hash(await readFile(path))
    if (ref.hash !== digest) throw new Error('Reference source changed; reload before saving corrections')
    reference = { src: ref.src, hash: digest }
  }
  const edits = []
  for (const value of request.edits) {
    if (!value || typeof value !== 'object') throw new Error('Invalid drawing correction')
    const edit = value as Record<string, unknown>, src = edit.src
    if (typeof src !== 'string' || !originals.has(src) || !src.startsWith(`/art-source/arcade/${entry.fighter}/`) || src.split('/').some(part => part === '..' || part === '.') || !/^[\w/.-]+\.png$/.test(src) || seen.has(src)) throw new Error('Correction source must be a unique drawing in the selected fighter clip')
    seen.add(src)
    const path = await realpath(resolve(root, src.slice(1)))
    if (!path.startsWith(fighterRoot + sep)) throw new Error('Correction source leaves the fighter directory')
    const bytes = await readFile(path), sourceHash = hash(bytes)
    if (sourceHash !== edit.sourceHash) throw new Error('Drawing source changed; reload before saving corrections')
    const operations = parseArtOperations(edit.operations)
    if (!operations.length) throw new Error('Drawing has no corrections')
    const pixels = applyArtOperations(readPng(path), operations)
    const bounds = measureArt(pixels)
    if (!bounds || bounds.bottom !== 119) throw new Error('Corrected drawing must stand on baseline row 119')
    edits.push({ src, sourceHash, operations, pixels })
  }
  const id = randomUUID(), directory = `art-source/arcade/${entry.fighter}/gym-edits/${id}`
  const outputRoot = resolve(root, directory), staging = resolve(fighterRoot, `.gym-art-staging-${id}`)
  await mkdir(staging)
  let published = false, tableCommitted = false
  try {
    await mkdir(resolve(staging, 'frames'))
    const mapped = new Map<string, string>(), provenance = []
    for (const [index, edit] of edits.entries()) {
      const name = `drawing-${String(index).padStart(2, '0')}.png`, bytes = pngBytes(edit.pixels)
      await writeFile(resolve(staging, 'frames', name), bytes, { flag: 'wx' })
      const output = `/${directory}/frames/${name}`
      mapped.set(edit.src, output)
      provenance.push({ source: edit.src, sourceHash: edit.sourceHash, operations: edit.operations, output, outputHash: hash(bytes) })
    }
    const gate = await run('python3', [resolve(root, 'tools/assets/check-popt-frames-fullcolour.py'), staging, '--contract', resolve(root, 'asset-reports/mars-arcade-sprite-contract.json')], { timeout: 30000, maxBuffer: 1024 * 1024 }).catch(error => { throw new Error(`Sprite gate refused corrected copy: ${error.stdout || error.message}`) })
    await writeFile(resolve(staging, 'gate.txt'), gate.stdout)
    const copy = structuredClone(entry)
    copy.animation = `${entry.animation}-art-${id.slice(0, 8)}`
    copy.reviewed = false
    delete copy.moveId; delete copy.reachException
    for (const frame of copy.frames) {
      const edited = edits.find(e => e.src === frame.src)
      const bounds = measureArt(edited?.pixels ?? readPng(resolve(root, frame.src.slice(1))))
      if (!bounds) throw new Error('Cannot seed boxes on an empty drawing')
      frame.src = mapped.get(frame.src) ?? frame.src
      delete frame.attack
      frame.collision = { x: bounds.x, y: bounds.top, width: bounds.width, height: 119 - bounds.top }
      frame.hurt = [{ x: bounds.x + 2, y: bounds.top + 2, width: Math.max(1, bounds.width - 4), height: Math.max(1, bounds.height - 2) }]
    }
    const file = parseMarsArcadeAnimations({ ...baseFile, animations: [...baseFile.animations, copy] })
    const errors = marsArcadeAnimationErrors(validateMarsArcadeAnimations(file))
    if (errors.length) throw new Error(errors.map(e => e.message).join('\n'))
    await writeFile(resolve(staging, 'recipe.json'), JSON.stringify({ version: 1, created: new Date().toISOString(), referencePolicy: 'Owner-selected reference palette/geometry; correction recipes replay original bytes; original clips unchanged', reference, sourceClip: request.key, candidate: marsArcadeAnimationKey(copy.fighter, copy.animation), reviewed: false, edits: provenance }, null, 2) + '\n')
    if (await readFile(tablePath, 'utf8') !== before) throw new Error('Animation table changed during correction validation; reload and retry')
    await mkdir(resolve(fighterRoot, 'gym-edits'), { recursive: true })
    if (await realpath(resolve(fighterRoot, 'gym-edits')) !== resolve(fighterRoot, 'gym-edits')) throw new Error('Correction output directory must be inside this workspace')
    await rename(staging, outputRoot); published = true
    const temporary = resolve(root, `src/game/.gym-art-${id}.json`)
    try {
      await writeFile(temporary, JSON.stringify(file, null, 2) + '\n', { flag: 'wx' })
      await rename(temporary, tablePath); tableCommitted = true
    } finally { await rm(temporary, { force: true }) }
    return { file, key: marsArcadeAnimationKey(copy.fighter, copy.animation), directory }
  } finally {
    await rm(staging, { recursive: true, force: true })
    if (published && !tableCommitted) await rm(outputRoot, { recursive: true, force: true })
  }
}
