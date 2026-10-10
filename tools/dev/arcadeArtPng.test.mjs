import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { readPng } from '../assets/lib/png.mjs'
import { decodeArtPng } from '../../src/dev/arcadeArtPng.ts'

describe('exact gym PNG decoding', () => {
  it.each([
    'art-source/arcade/captain/normalised-clean/anchor/anchor-00.png',
    'art-source/arcade/captain/normalised-consistency-v3-candidate-ready/heavy-candidate/heavy-candidate-02.png',
  ])('preserves every RGBA byte, including translucent edges, in %s', async path => {
    const decoded = await decodeArtPng(await readFile(path)), expected = readPng(path)
    expect(decoded.width).toBe(128); expect(decoded.height).toBe(128)
    expect(Buffer.from(decoded.data)).toEqual(Buffer.from(expected.data))
  })
  it('refuses malformed and unsupported PNGs without guessing pixels', async () => {
    await expect(decodeArtPng(new Uint8Array(10))).rejects.toThrow(/PNG/)
    const bytes = await readFile('art-source/arcade/captain/normalised-clean/anchor/anchor-00.png')
    bytes[25] = 2
    await expect(decodeArtPng(bytes)).rejects.toThrow(/RGBA/)
  })
})
