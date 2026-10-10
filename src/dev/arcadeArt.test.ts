import { describe, expect, it } from 'vitest'
import { applyArtOperations, applyArtOperationsWithReport, measureArt, parseArtOperations, referencePalette, type ArtPixels } from './arcadeArt'

function figure(): ArtPixels {
  const data = new Uint8ClampedArray(128 * 128 * 4)
  for (let y = 14; y <= 119; y++) for (let x = 52; x < 75; x++) data.set([20, 40, 70, 255], (y * 128 + x) * 4)
  // A striking arm must not define body alignment.
  for (let x = 75; x < 102; x++) data.set([250, 200, 145, 255], (53 * 128 + x) * 4)
  for (let y = 118; y <= 119; y++) for (let x = 75; x <= 76; x++) data.set([20, 40, 70, 255], (y * 128 + x) * 4)
  return { width: 128, height: 128, data }
}
const pixel = (p: ArtPixels, x: number, y: number) => [...p.data.slice((y * 128 + x) * 4, (y * 128 + x) * 4 + 4)]

describe('gym art corrections', () => {
  it('replaces only nearby colors inside the selected area and preserves alpha, shades and originals', () => {
    const input = figure()
    input.data.set([25, 45, 75, 170], (115 * 128 + 53) * 4)
    const output = applyArtOperations(input, [{ type: 'color', area: { x: 0, y: 110, width: 128, height: 10 }, from: '#142846', to: '#323c28', tolerance: 10, shading: true }])
    expect(pixel(output, 53, 115)).toEqual([55, 65, 45, 170])
    expect(pixel(output, 53, 90)).toEqual(pixel(input, 53, 90))
    expect(pixel(output, 10, 115)).toEqual([0, 0, 0, 0])
    expect(pixel(input, 53, 115)).toEqual([25, 45, 75, 170])
  })

  it('matches a regional reference palette without recoloring distant skin tones', () => {
    const input = figure(); const area = { x: 0, y: 40, width: 128, height: 20 }
    const output = applyArtOperations(input, [{ type: 'palette', area, colors: ['#12213b', '#203452'], tolerance: 45 }])
    expect(pixel(output, 53, 50).slice(0, 3)).toEqual([18, 33, 59])
    expect(pixel(output, 90, 53)).toEqual(pixel(input, 90, 53))
    expect(referencePalette(input, { x: 0, y: 110, width: 128, height: 10 })).toEqual(['#142846'])
  })

  it('sets an exact height while planting the feet on row 119', () => {
    const output = applyArtOperations(figure(), [{ type: 'height', pixels: 104 }])
    expect(measureArt(output)?.height).toBe(104)
    expect(measureArt(output)?.bottom).toBe(119)
    expect(measureArt(output)?.footCenter).toBe(64)
  })

  it('can match distant gray and white shoe highlights while preserving alpha and pixels outside the area', () => {
    const input = figure(), area = { x: 0, y: 113, width: 128, height: 7 }
    input.data.set([122, 126, 131, 170], (115 * 128 + 53) * 4)
    input.data.set([255, 255, 255, 255], (116 * 128 + 53) * 4)
    const [operation] = parseArtOperations([{ type: 'palette', area, colors: ['#242721', '#373c33'], tolerance: 45, includeDistant: true }])
    const output = applyArtOperations(input, [operation!])
    expect(pixel(output, 53, 115)).toEqual([55, 60, 51, 170])
    expect(pixel(output, 53, 116)).toEqual([55, 60, 51, 255])
    expect(pixel(output, 53, 90)).toEqual(pixel(input, 53, 90))
    expect(pixel(input, 53, 115)).toEqual([122, 126, 131, 170])
    expect(() => parseArtOperations([{ type: 'palette', area, colors: ['#373c33'], tolerance: 45, includeDistant: 'yes' }])).toThrow()
  })

  it('reports actual changes and tolerance skips so repeating a palette match cannot claim another change', () => {
    const input = figure(), area = { x: 52, y: 115, width: 2, height: 1 }
    input.data.set([122, 126, 131, 255], (115 * 128 + 52) * 4)
    const operation = { type: 'palette' as const, area, colors: ['#373c33'], tolerance: 45 }
    const nearby = applyArtOperationsWithReport(input, [operation])
    expect(nearby.changed).toBe(1)
    expect(nearby.skipped).toBe(1)
    const all = applyArtOperationsWithReport(nearby.pixels, [{ ...operation, includeDistant: true }])
    expect(all.changed).toBe(1)
    expect(all.skipped).toBe(0)
    const repeated = applyArtOperationsWithReport(all.pixels, [{ ...operation, includeDistant: true }])
    expect(repeated.changed).toBe(0)
    expect(repeated.skipped).toBe(0)
  })

  it('shows the remaining body difference when exact body alignment would move the feet out of contract', () => {
    const output = applyArtOperations(figure(), [{ type: 'align', torsoBack: 49, bottom: 119 }])
    expect(measureArt(output)?.footCenter).toBe(63)
    expect(measureArt(output)?.torsoBack).toBe(51)
  })

  it('aligns the body independently of the extended arm and refuses clipping', () => {
    const input = figure()
    expect(measureArt(input)?.torsoBack).toBe(52)
    const output = applyArtOperations(input, [{ type: 'align', torsoBack: 51, bottom: 119 }])
    expect(measureArt(output)?.torsoBack).toBe(51)
    expect(measureArt(output)?.bottom).toBe(119)
    expect(() => applyArtOperations(input, [{ type: 'shift', x: 40, y: 0 }])).toThrow(/clip/i)
    expect(() => applyArtOperations(input, [{ type: 'shift', x: 0, y: 20 }])).toThrow(/clip/i)
  })

  it('rejects malformed recipes and missing/empty artwork', () => {
    expect(() => parseArtOperations([{ type: 'height', pixels: Number.NaN }])).toThrow()
    expect(() => parseArtOperations([{ type: 'color', area: { x: -1, y: 0, width: 5, height: 5 }, from: '#zzzzzz', to: '#ffffff', tolerance: 10, shading: true }])).toThrow()
    expect(() => applyArtOperations({ width: 128, height: 128, data: new Uint8ClampedArray(65536) }, [{ type: 'height', pixels: 104 }])).toThrow(/empty/)
    expect(() => applyArtOperations({ width: 64, height: 64, data: new Uint8ClampedArray(16384) }, [])).toThrow(/128/)
  })
})
