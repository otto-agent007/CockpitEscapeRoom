/** Deterministic gym correction recipes. Originals and alpha are never painted over. */
export interface ArtPixels { width: number; height: number; data: Uint8ClampedArray | Uint8Array }
export interface ArtArea { x: number; y: number; width: number; height: number }
export type ArtOperation =
  | { type: 'color'; area: ArtArea; from: string; to: string; tolerance: number; shading: boolean }
  | { type: 'palette'; area: ArtArea; colors: string[]; tolerance: number; includeDistant?: boolean }
  | { type: 'height'; pixels: number }
  | { type: 'shift'; x: number; y: number }
  | { type: 'align'; torsoBack: number; bottom: number }

export const ART_REGIONS: Record<string, ArtArea> = {
  hat: { x: 0, y: 8, width: 128, height: 25 },
  trousers: { x: 0, y: 72, width: 128, height: 37 },
  shoes: { x: 0, y: 109, width: 128, height: 11 },
  whole: { x: 0, y: 0, width: 128, height: 128 },
}

export function colorHex(values: ArrayLike<number>): string {
  return `#${[0, 1, 2].map(i => Math.round(values[i] ?? 0).toString(16).padStart(2, '0')).join('')}`
}
function rgb(hex: string): number[] {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error('Use a six-digit hex color')
  return [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16))
}
function numeric(value: unknown, min: number, max: number, integer = true): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new Error(`Expected ${integer ? 'integer' : 'number'} ${min}–${max}`)
  return value
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected correction object')
  return value as Record<string, unknown>
}
function areaOf(value: unknown): ArtArea {
  const a = object(value)
  const x = numeric(a.x, 0, 127), y = numeric(a.y, 0, 127)
  return { x, y, width: numeric(a.width, 1, 128 - x), height: numeric(a.height, 1, 128 - y) }
}
export function parseArtOperations(value: unknown): ArtOperation[] {
  if (!Array.isArray(value) || value.length > 64) throw new Error('At most 64 corrections per drawing')
  return value.map(item => {
    const o = object(item)
    switch (o.type) {
      case 'color': {
        if (typeof o.from !== 'string' || typeof o.to !== 'string' || typeof o.shading !== 'boolean') throw new Error('Missing color/shading choice')
        rgb(o.from); rgb(o.to)
        return { type: 'color', area: areaOf(o.area), from: o.from, to: o.to, tolerance: numeric(o.tolerance, 0, 128), shading: o.shading }
      }
      case 'palette': {
        if (!Array.isArray(o.colors) || !o.colors.length || o.colors.length > 256 || o.colors.some(c => typeof c !== 'string' || !/^#[\da-f]{6}$/i.test(c))) throw new Error('Reference palette needs 1–256 hex colors')
        if (o.includeDistant !== undefined && typeof o.includeDistant !== 'boolean') throw new Error('Include distant colors must be a boolean')
        return { type: 'palette', area: areaOf(o.area), colors: o.colors as string[], tolerance: numeric(o.tolerance, 0, 128), ...(o.includeDistant === undefined ? {} : { includeDistant: o.includeDistant }) }
      }
      case 'height': return { type: 'height', pixels: numeric(o.pixels, 1, 120) }
      case 'shift': return { type: 'shift', x: numeric(o.x, -128, 128), y: numeric(o.y, -128, 128) }
      case 'align': return { type: 'align', torsoBack: numeric(o.torsoBack, 0, 127, false), bottom: numeric(o.bottom, 0, 127) }
      default: throw new Error('Unknown art correction')
    }
  })
}

export function measureArt(p: ArtPixels): (ArtArea & { top: number; bottom: number; torsoBack: number; footCenter: number }) | null {
  let x0 = p.width, y0 = p.height, x1 = -1, y1 = -1
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    if ((p.data[(y * p.width + x) * 4 + 3] ?? 0) < 128) continue
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  if (x1 < 0) return null
  const height = y1 - y0 + 1, backs: number[] = []
  for (let y = y0 + Math.floor(height * .3); y < y0 + Math.floor(height * .5); y++) {
    for (let x = 0; x < p.width; x++) if ((p.data[(y * p.width + x) * 4 + 3] ?? 0) >= 128) { backs.push(x); break }
  }
  backs.sort((a, b) => a - b)
  const middle = Math.floor(backs.length / 2)
  const torsoBack = backs.length ? backs.length % 2 ? backs[middle]! : (backs[middle - 1]! + backs[middle]!) / 2 : x0
  let footLeft = 128, footRight = -1
  for (let y = Math.max(0, y1 - 1); y <= y1; y++) for (let x = 0; x < 128; x++) {
    if ((p.data[(y * p.width + x) * 4 + 3] ?? 0) <= 128) continue
    footLeft = Math.min(footLeft, x); footRight = Math.max(footRight, x)
  }
  const footCenter = footRight < 0 ? (x0 + x1) / 2 : (footLeft + footRight) / 2
  return { x: x0, y: y0, width: x1 - x0 + 1, height, top: y0, bottom: y1, torsoBack, footCenter }
}

/** Most frequent colors first; small isolated colors cannot dominate a region. */
export function referencePalette(p: ArtPixels, rawArea: ArtArea): string[] {
  const area = areaOf(rawArea), counts = new Map<string, number>()
  for (let y = area.y; y < area.y + area.height; y++) for (let x = area.x; x < area.x + area.width; x++) {
    const i = (y * p.width + x) * 4
    if ((p.data[i + 3] ?? 0) < 128) continue
    const hex = colorHex(p.data.subarray(i, i + 3))
    counts.set(hex, (counts.get(hex) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 256).map(([hex]) => hex)
}

function movePixels(p: ArtPixels, xShift: number, yShift: number): ArtPixels {
  const data = new Uint8ClampedArray(p.data.length)
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const i = (y * 128 + x) * 4
    if (!p.data[i + 3]) continue
    const nx = x + xShift, ny = y + yShift
    if (nx < 0 || nx >= 128 || ny < 0 || ny >= 128) throw new Error('Correction would clip the drawing; reduce the offset/height')
    data.set(p.data.subarray(i, i + 4), (ny * 128 + nx) * 4)
  }
  return { width: 128, height: 128, data }
}

function heightPixels(p: ArtPixels, height: number): ArtPixels {
  const bounds = measureArt(p)
  if (!bounds) throw new Error('Cannot resize empty artwork')
  const ratio = height / bounds.height, top = 120 - height
  // Nearest-neighbour resampling, with the opaque height and grounded feet explicit.
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    if (!p.data[(y * 128 + x) * 4 + 3]) continue
    const nx = Math.round((x - 64) * ratio + 64)
    const ny = Math.round((y - bounds.top + .5) * ratio + top - .5)
    if (nx < 0 || nx >= 128 || ny < 0 || ny >= 128) throw new Error('Correction would clip the drawing; reduce the height')
  }
  const data = new Uint8ClampedArray(p.data.length)
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const sx = Math.round((x - 64) / ratio + 64)
    const sy = Math.round((y - top + .5) / ratio + bounds.top - .5)
    if (sx >= 0 && sx < 128 && sy >= 0 && sy < 128) data.set(p.data.subarray((sy * 128 + sx) * 4, (sy * 128 + sx) * 4 + 4), (y * 128 + x) * 4)
  }
  const result = { width: 128, height: 128, data }
  if (measureArt(result)?.height !== height || measureArt(result)?.bottom !== 119) throw new Error('This shape cannot reach the requested height exactly; choose a nearby height')
  return result
}

export function applyArtOperations(input: ArtPixels, rawOperations: ArtOperation[]): ArtPixels {
  return applyArtOperationsWithReport(input, rawOperations).pixels
}

/** Changed pixels are counted once, even when a recipe has multiple steps. */
export function applyArtOperationsWithReport(input: ArtPixels, rawOperations: ArtOperation[]): { pixels: ArtPixels; changed: number; skipped: number } {
  if (input.width !== 128 || input.height !== 128 || input.data.length !== 65536) throw new Error('Art corrections require 128×128 RGBA artwork')
  let p: ArtPixels = { width: 128, height: 128, data: new Uint8ClampedArray(input.data) }
  let skipped = 0
  for (const o of parseArtOperations(rawOperations)) {
    if (o.type === 'height') { p = heightPixels(p, o.pixels); continue }
    if (o.type === 'shift') { p = movePixels(p, o.x, o.y); continue }
    if (o.type === 'align') {
      const bounds = measureArt(p)
      if (!bounds) throw new Error('Cannot align empty artwork')
      // Body and feet can differ in individual poses. Choose the nearest body
      // alignment which also satisfies the existing foot-pivot gate (64 ± 1).
      const wanted = Math.round(o.torsoBack - bounds.torsoBack)
      const shift = Math.max(Math.ceil(63 - bounds.footCenter), Math.min(Math.floor(65 - bounds.footCenter), wanted))
      p = movePixels(p, shift, o.bottom - bounds.bottom)
      continue
    }
    const targetColors = o.type === 'palette' ? o.colors.map(rgb) : [rgb(o.to)]
    const from = o.type === 'color' ? rgb(o.from) : null
    for (let y = o.area.y; y < o.area.y + o.area.height; y++) for (let x = o.area.x; x < o.area.x + o.area.width; x++) {
      const i = (y * 128 + x) * 4
      if (!p.data[i + 3]) continue
      const source = [p.data[i]!, p.data[i + 1]!, p.data[i + 2]!]
      let target = targetColors[0]!, best = Infinity
      for (const candidate of targetColors) {
        const distance = candidate.reduce((sum, c, channel) => sum + (c - source[channel]!) ** 2, 0)
        if (distance < best) { target = candidate; best = distance }
      }
      const difference = from ? Math.max(...source.map((c, channel) => Math.abs(c - from[channel]!))) : Math.sqrt(best / 3)
      if (!(o.type === 'palette' && o.includeDistant) && difference > o.tolerance) { skipped++; continue }
      for (let channel = 0; channel < 3; channel++) p.data[i + channel] = target[channel]! + (o.type === 'color' && o.shading ? source[channel]! - from![channel]! : 0)
    }
  }
  let changed = 0
  for (let i = 0; i < p.data.length; i += 4) {
    if (p.data[i] !== input.data[i] || p.data[i + 1] !== input.data[i + 1] || p.data[i + 2] !== input.data[i + 2] || p.data[i + 3] !== input.data[i + 3]) changed++
  }
  return { pixels: p, changed, skipped }
}
