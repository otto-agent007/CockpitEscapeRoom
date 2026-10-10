import { mkdtemp, mkdir, readFile, writeFile, cp, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { saveGymArt } from './arcadeArtSave.ts'
import { readPng } from '../assets/lib/png.mjs'
import raw from '../../src/game/marsArcadeAnimations.json'

const roots = []
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })
async function workspace() {
  const root = await mkdtemp(resolve(tmpdir(), 'gym-art-test-')); roots.push(root)
  for (const folder of ['src/game', 'tools/assets', 'asset-reports', 'art-source/arcade/captain/test']) await mkdir(resolve(root, folder), { recursive: true })
  for (const path of ['tools/assets/check-popt-frames-fullcolour.py', 'asset-reports/mars-arcade-sprite-contract.json']) await cp(path, resolve(root, path))
  const src = '/art-source/arcade/captain/test/anchor.png'
  const bytes = await readFile('art-source/arcade/captain/normalised-clean/anchor/anchor-00.png')
  await writeFile(resolve(root, src.slice(1)), bytes)
  const entry = structuredClone(raw.animations.find(e => e.fighter === 'captain' && e.animation === 'idle'))
  entry.frames = [entry.frames[0], structuredClone(entry.frames[0])]
  entry.frames.forEach(f => { f.src = src })
  const baseFile = { version: raw.version, animations: [entry] }
  await writeFile(resolve(root, 'src/game/marsArcadeAnimations.json'), JSON.stringify(baseFile))
  const digest = createHash('sha256').update(bytes).digest('hex')
  const request = { baseFile, key: 'captain:idle', reference: { src, hash: digest }, edits: [{ src, sourceHash: digest, operations: [{ type: 'palette', area: { x: 0, y: 109, width: 128, height: 11 }, colors: ['#323c28'], tolerance: 50 }] }] }
  return { root, request, bytes, src }
}

describe('gym corrected-copy persistence', () => {
  it('saves a new unbound copy, keeps originals and deduplicates a reused drawing', async () => {
    const { root, request, bytes, src } = await workspace()
    request.edits[0].operations[0].includeDistant = true
    const saved = await saveGymArt(root, request)
    expect(saved.file.animations[0]).toEqual(request.baseFile.animations[0])
    const copy = saved.file.animations.at(-1)
    expect(copy.animation).toMatch(/^idle-art-/)
    expect(copy.reviewed).toBe(false)
    expect(copy.moveId).toBeUndefined()
    expect(copy.frames[0].src).toBe(copy.frames[1].src)
    expect(copy.frames[0].src).not.toBe(src)
    expect(copy.frames[0].hold).toBe(request.baseFile.animations[0].frames[0].hold)
    const corrected = readPng(resolve(root, copy.frames[0].src.slice(1)))
    const original = readPng(resolve(root, src.slice(1)))
    for (let y = 109; y < 120; y++) for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4
      if (original.data[i + 3]) expect([...corrected.data.slice(i, i + 4)]).toEqual([50, 60, 40, original.data[i + 3]])
    }
    expect(await readFile(resolve(root, src.slice(1)))).toEqual(bytes)
    const provenance = JSON.parse(await readFile(resolve(root, saved.directory, 'recipe.json'), 'utf8'))
    expect(provenance.edits[0].sourceHash).toBe(request.edits[0].sourceHash)
    expect(provenance.edits[0].operations).toEqual(request.edits[0].operations)
    expect(provenance.reference).toEqual(request.reference)
    expect(JSON.parse(await readFile(resolve(root, 'src/game/marsArcadeAnimations.json'), 'utf8'))).toEqual(saved.file)
  })

  it('refuses stale tables and source changes before writing', async () => {
    const { root, request, src } = await workspace()
    await writeFile(resolve(root, 'src/game/marsArcadeAnimations.json'), JSON.stringify({ ...request.baseFile, animations: [] }))
    await expect(saveGymArt(root, request)).rejects.toThrow(/changed|reload/i)
    await writeFile(resolve(root, 'src/game/marsArcadeAnimations.json'), JSON.stringify(request.baseFile))
    await writeFile(resolve(root, src.slice(1)), Buffer.from('changed'))
    await expect(saveGymArt(root, { ...request, reference: null })).rejects.toThrow(/source.*changed/i)
    expect(JSON.parse(await readFile(resolve(root, 'src/game/marsArcadeAnimations.json'), 'utf8'))).toEqual(request.baseFile)
  })

  it('retains no partial candidate when the existing sprite gate refuses a visible offset', async () => {
    const { root, request } = await workspace()
    await expect(saveGymArt(root, { ...request, edits: [{ ...request.edits[0], operations: [{ type: 'shift', x: 5, y: 0 }] }] })).rejects.toThrow(/Sprite gate refused/)
    expect(JSON.parse(await readFile(resolve(root, 'src/game/marsArcadeAnimations.json'), 'utf8'))).toEqual(request.baseFile)
    expect(await readdir(resolve(root, 'art-source/arcade/captain'))).toEqual(['test'])
  })

  it('refuses a changed reference and serializes concurrent stale saves', async () => {
    const { root, request } = await workspace()
    await expect(saveGymArt(root, { ...request, reference: { ...request.reference, hash: 'wrong' } })).rejects.toThrow(/Reference source changed/)
    const results = await Promise.allSettled([saveGymArt(root, request), saveGymArt(root, request)])
    expect(results.map(r => r.status)).toEqual(['fulfilled', 'rejected'])
    expect(JSON.parse(await readFile(resolve(root, 'src/game/marsArcadeAnimations.json'), 'utf8')).animations).toHaveLength(2)
  })

  it('refuses invalid/clipped corrections and paths without changing the table', async () => {
    const { root, request } = await workspace()
    await expect(saveGymArt(root, { ...request, edits: [{ ...request.edits[0], src: '/art-source/arcade/captain/../../secret.png' }] })).rejects.toThrow()
    await expect(saveGymArt(root, { ...request, edits: [{ ...request.edits[0], operations: [{ type: 'shift', x: 100, y: 0 }] }] })).rejects.toThrow(/clip/i)
    expect(JSON.parse(await readFile(resolve(root, 'src/game/marsArcadeAnimations.json'), 'utf8'))).toEqual(request.baseFile)
  })
})
