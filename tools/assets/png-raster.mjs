import { inflateSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const CHANNELS_BY_COLOR_TYPE = { 0: 1, 2: 3, 4: 2, 6: 4 }

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

function unfilter(raw, height, bytesPerRow, bytesPerPixel) {
  const out = Buffer.alloc(height * bytesPerRow)
  let position = 0
  for (let y = 0; y < height; y += 1) {
    const filter = raw[position]
    position += 1
    const rowStart = y * bytesPerRow
    const priorStart = (y - 1) * bytesPerRow
    for (let x = 0; x < bytesPerRow; x += 1) {
      const value = raw[position + x]
      const left = x >= bytesPerPixel ? out[rowStart + x - bytesPerPixel] : 0
      const up = y > 0 ? out[priorStart + x] : 0
      const upLeft = y > 0 && x >= bytesPerPixel ? out[priorStart + x - bytesPerPixel] : 0
      let restored
      switch (filter) {
        case 0: restored = value; break
        case 1: restored = value + left; break
        case 2: restored = value + up; break
        case 3: restored = value + ((left + up) >> 1); break
        case 4: restored = value + paeth(left, up, upLeft); break
        default: throw new Error(`Unsupported PNG filter ${filter} on row ${y}`)
      }
      out[rowStart + x] = restored & 0xff
    }
    position += bytesPerRow
  }
  return out
}

/**
 * Decode a PNG to 8-bit RGBA without adding a dependency.
 *
 * Deliberately narrow: non-interlaced, 8- or 16-bit, colour types 0/2/4/6 — which is every
 * PNG this repository ships. Anything else throws rather than guessing, so an unexpected
 * encoding surfaces as a failure instead of a silently wrong measurement.
 */
export function decodePng(path) {
  const bytes = readFileSync(path)
  if (bytes.length < 26 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${path} is not a PNG`)
  }
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  const bitDepth = bytes[24]
  const colorType = bytes[25]
  const interlace = bytes[28]
  if (interlace !== 0) throw new Error(`${path} is interlaced; unsupported`)
  if (bitDepth !== 8 && bitDepth !== 16) throw new Error(`${path} has bit depth ${bitDepth}; unsupported`)
  const channels = CHANNELS_BY_COLOR_TYPE[colorType]
  if (!channels) throw new Error(`${path} has colour type ${colorType}; unsupported`)

  const idat = []
  let offset = 8
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    if (type === 'IDAT') idat.push(bytes.subarray(offset + 8, offset + 8 + length))
    if (type === 'IEND') break
    offset += length + 12
  }
  if (idat.length === 0) throw new Error(`${path} has no IDAT data`)

  const sampleBytes = bitDepth / 8
  const bytesPerPixel = channels * sampleBytes
  const bytesPerRow = width * bytesPerPixel
  const flat = unfilter(inflateSync(Buffer.concat(idat)), height, bytesPerRow, bytesPerPixel)

  // Normalize to RGBA8. 16-bit samples take the high byte; that is lossless for the
  // grid/palette questions here, which only compare samples for equality.
  const rgba = Buffer.alloc(width * height * 4)
  for (let index = 0; index < width * height; index += 1) {
    const source = index * bytesPerPixel
    const target = index * 4
    const read = (channel) => flat[source + channel * sampleBytes]
    if (channels === 1 || channels === 2) {
      const grey = read(0)
      rgba[target] = grey
      rgba[target + 1] = grey
      rgba[target + 2] = grey
      rgba[target + 3] = channels === 2 ? read(1) : 255
    } else {
      rgba[target] = read(0)
      rgba[target + 1] = read(1)
      rgba[target + 2] = read(2)
      rgba[target + 3] = channels === 4 ? read(3) : 255
    }
  }
  return { width, height, rgba }
}

function samePixel(rgba, a, b) {
  return rgba[a] === rgba[b]
    && rgba[a + 1] === rgba[b + 1]
    && rgba[a + 2] === rgba[b + 2]
    && rgba[a + 3] === rgba[b + 3]
}

/**
 * Measure how well an image sits on a `block`-pixel grid.
 *
 * For true block art, two neighbouring pixels inside the same block are identical, so the
 * only permitted changes are on block boundaries. `interiorChangeRatio` is the fraction of
 * interior neighbour pairs that differ: ~0 means snapped, and continuous-tone artwork runs
 * near 0.9 no matter which block size you test.
 */
export function measureGrid(image, block) {
  const { width, height, rgba } = image
  let changes = 0
  let total = 0
  const rowStep = Math.max(1, Math.floor(height / 256))
  for (let y = 0; y < height; y += rowStep) {
    const row = y * width * 4
    for (let x = 1; x < width; x += 1) {
      if (x % block === 0) continue
      total += 1
      if (!samePixel(rgba, row + x * 4, row + (x - 1) * 4)) changes += 1
    }
  }
  const columnStep = Math.max(1, Math.floor(width / 256))
  for (let x = 0; x < width; x += columnStep) {
    for (let y = 1; y < height; y += 1) {
      if (y % block === 0) continue
      total += 1
      if (!samePixel(rgba, y * width * 4 + x * 4, (y - 1) * width * 4 + x * 4)) changes += 1
    }
  }
  return total === 0 ? 0 : changes / total
}

export function countColours(image, limit = 4096) {
  const { width, height, rgba } = image
  const seen = new Set()
  for (let index = 0; index < width * height; index += 1) {
    const at = index * 4
    if (rgba[at + 3] === 0) continue
    seen.add((rgba[at] << 24) | (rgba[at + 1] << 16) | (rgba[at + 2] << 8) | rgba[at + 3])
    if (seen.size > limit) return seen.size
  }
  return seen.size
}
