/**
 * Minimal PNG reader for the arcade sprite tools.
 *
 * Reads the one shape the sprite pipeline writes — 8-bit RGBA, non-interlaced — so
 * the Node tools can measure a drawing's silhouette without a native dependency.
 * Anything else is refused loudly rather than mis-decoded.
 */
import { inflateSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** @returns {{ width: number, height: number, data: Uint8Array }} RGBA pixels, row-major. */
export function readPng(path) {
  const file = readFileSync(path)
  if (!file.subarray(0, 8).equals(SIGNATURE)) throw new Error(`${path}: not a PNG`)
  let offset = 8
  let width = 0
  let height = 0
  const idat = []
  while (offset < file.length) {
    const length = file.readUInt32BE(offset)
    const type = file.toString('ascii', offset + 4, offset + 8)
    const body = file.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      const [bitDepth, colourType, , , interlace] = [body[8], body[9], body[10], body[11], body[12]]
      if (bitDepth !== 8 || colourType !== 6 || interlace !== 0) {
        throw new Error(`${path}: only 8-bit non-interlaced RGBA is supported (depth ${bitDepth}, colour type ${colourType}, interlace ${interlace})`)
      }
    } else if (type === 'IDAT') {
      idat.push(body)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }
  if (!width || !height) throw new Error(`${path}: missing IHDR`)
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * 4
  const data = new Uint8Array(stride * height)
  let previous = new Uint8Array(stride)
  for (let row = 0; row < height; row += 1) {
    const filter = raw[row * (stride + 1)]
    const line = raw.subarray(row * (stride + 1) + 1, (row + 1) * (stride + 1))
    const out = data.subarray(row * stride, (row + 1) * stride)
    for (let i = 0; i < stride; i += 1) {
      const a = i >= 4 ? out[i - 4] : 0
      const b = previous[i]
      const c = i >= 4 ? previous[i - 4] : 0
      let value = line[i]
      if (filter === 1) value += a
      else if (filter === 2) value += b
      else if (filter === 3) value += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      } else if (filter !== 0) throw new Error(`${path}: unknown filter ${filter} on row ${row}`)
      out[i] = value & 0xff
    }
    previous = out
  }
  return { width, height, data }
}

/**
 * Bounding box of the opaque pixels, or null for an empty image.
 *
 * `minAlpha` is inclusive; the normaliser leaves faint alpha on anti-aliased edges,
 * and a hurt box should hug the body, not the halo.
 */
export function alphaBounds(png, minAlpha = 128) {
  let minX = png.width
  let minY = png.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] < minAlpha) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/** Bounding box of the opaque pixels within a row band, for a torso or leg census. */
export function alphaBoundsInRows(png, fromRow, toRow, minAlpha = 128) {
  const clipped = {
    width: png.width,
    height: Math.max(0, toRow - fromRow),
    data: png.data.subarray(fromRow * png.width * 4, toRow * png.width * 4),
  }
  const box = alphaBounds(clipped, minAlpha)
  return box ? { ...box, y: box.y + fromRow } : null
}
