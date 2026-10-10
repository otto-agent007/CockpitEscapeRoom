/** Exact RGBA input for the editor: Canvas decoding rounds translucent RGB values. */
import { type ArtPixels } from './arcadeArt'

export async function decodeArtPng(bytes: Uint8Array): Promise<ArtPixels> {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  if (bytes.length < 33 || signature.some((b, i) => bytes[i] !== b)) throw new Error('Drawing is not a PNG')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let width = 0, height = 0, offset = 8
  const chunks: Uint8Array[] = []
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset), type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8))
    if (length > bytes.length - offset - 12) throw new Error('Truncated PNG chunk')
    const body = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      if (length !== 13) throw new Error('Invalid PNG header')
      width = view.getUint32(offset + 8); height = view.getUint32(offset + 12)
      if (width !== 128 || height !== 128 || body[0 + 8] !== 8 || body[9] !== 6 || body[10] !== 0 || body[11] !== 0 || body[12] !== 0) throw new Error('Art editor needs 128×128, 8-bit non-interlaced RGBA PNGs')
    } else if (type === 'IDAT') chunks.push(body)
    else if (type === 'IEND') break
    offset += length + 12
  }
  if (!width || !chunks.length) throw new Error('PNG has no image data')
  const compressed = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  let at = 0
  for (const chunk of chunks) { compressed.set(chunk, at); at += chunk.length }
  if (typeof DecompressionStream === 'undefined') throw new Error('Exact PNG editing needs a browser with DecompressionStream support')
  const reader = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate')).getReader()
  const stride = width * 4, expected = (stride + 1) * height, raw = new Uint8Array(expected)
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (size + value.length > expected) { await reader.cancel(); throw new Error('PNG image data exceeds its dimensions') }
      raw.set(value, size); size += value.length
    }
  } finally { reader.releaseLock() }
  if (size !== expected) throw new Error('Incomplete PNG image data')
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!, row = data.subarray(y * stride, (y + 1) * stride)
    if (filter > 4) throw new Error('Unknown PNG row filter')
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? row[i - 4]! : 0, b = y ? data[(y - 1) * stride + i]! : 0, c = y && i >= 4 ? data[(y - 1) * stride + i - 4]! : 0
      let predictor = 0
      if (filter === 1) predictor = a
      else if (filter === 2) predictor = b
      else if (filter === 3) predictor = Math.floor((a + b) / 2)
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      row[i] = (raw[y * (stride + 1) + i + 1]! + predictor) & 255
    }
  }
  return { width, height, data }
}
