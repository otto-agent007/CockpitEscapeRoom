import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, resolve, sep } from 'node:path'
import { inflateSync } from 'node:zlib'

const SHA256_PATTERN = /^[0-9a-f]{64}$/
const PROTECTED_REWARD_PATTERN = /tesla|model[- ]?y|flight mode|mars/i
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
export const TMB2_LOGO_SHA256 = '673d13b96bc19b35b508630d1d662d16672ac4bb6ad665a7f6b1b7cee992ce17'
const TMB2_LOGO_BYTES = 811_581
const TMB2_LOGO_SIZE = [1659, 948]
const TMB2_IDENT_LAYERS = [
  ['logo/tmb2-ident-source.png', 'logo-source', 1659, 948],
  ['logo/tmb2-ident-blue-mask.png', 'logo-blue-mask', 288, 79],
  ['logo/tmb2-ident-base.png', 'logo-base', 288, 79],
  ['logo/tmb2-ident-highlight-mask.png', 'logo-highlight-mask', 288, 79],
  ['logo/tmb2-productions.png', 'logo-productions', 320, 224],
]

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

export function pngMetadata(path) {
  const bytes = readFileSync(path)
  if (bytes.length < 26 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${path} is not a PNG`)
  }
  const colorType = bytes[25]
  const hasTransparencyChunk = bytes.includes(Buffer.from('tRNS'))
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    hasAlpha: colorType === 4 || colorType === 6 || hasTransparencyChunk,
  }
}

function paethPredictor(left, up, upperLeft) {
  const estimate = left + up - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const upperLeftDistance = Math.abs(estimate - upperLeft)
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left
  return upDistance <= upperLeftDistance ? up : upperLeft
}

export function pngAlphaBounds(path) {
  const bytes = readFileSync(path)
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${path} is not a PNG`)
  }

  let header
  const imageData = []
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd + 4 > bytes.length) throw new Error(`${path} has a truncated PNG chunk`)
    if (type === 'IHDR') header = bytes.subarray(dataStart, dataEnd)
    if (type === 'IDAT') imageData.push(bytes.subarray(dataStart, dataEnd))
    offset = dataEnd + 4
    if (type === 'IEND') break
  }

  if (!header || header.length !== 13 || imageData.length === 0) {
    throw new Error(`${path} is missing required PNG data`)
  }
  const width = header.readUInt32BE(0)
  const height = header.readUInt32BE(4)
  const bitDepth = header[8]
  const colorType = header[9]
  const compression = header[10]
  const filterMethod = header[11]
  const interlace = header[12]
  if (bitDepth !== 8 || colorType !== 6 || compression !== 0 || filterMethod !== 0 || interlace !== 0) {
    throw new Error(`${path} must be a non-interlaced 8-bit RGBA PNG`)
  }

  const bytesPerPixel = 4
  const stride = width * bytesPerPixel
  const decoded = inflateSync(Buffer.concat(imageData))
  if (decoded.length !== height * (stride + 1)) {
    throw new Error(`${path} has an unexpected decoded PNG size`)
  }

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  let sourceOffset = 0
  let previous = Buffer.alloc(stride)
  for (let y = 0; y < height; y += 1) {
    const filter = decoded[sourceOffset]
    sourceOffset += 1
    const current = Buffer.allocUnsafe(stride)
    for (let index = 0; index < stride; index += 1) {
      const encoded = decoded[sourceOffset + index]
      const left = index >= bytesPerPixel ? current[index - bytesPerPixel] : 0
      const up = previous[index]
      const upperLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0
      const predictor = filter === 0
        ? 0
        : filter === 1
          ? left
          : filter === 2
            ? up
            : filter === 3
              ? Math.floor((left + up) / 2)
              : filter === 4
                ? paethPredictor(left, up, upperLeft)
                : undefined
      if (predictor === undefined) throw new Error(`${path} uses unsupported PNG filter ${filter}`)
      current[index] = (encoded + predictor) & 0xff
    }
    sourceOffset += stride

    for (let x = 0; x < width; x += 1) {
      if (current[x * bytesPerPixel + 3] === 0) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
    previous = current
  }

  return maxX < 0 ? null : [minX, minY, maxX + 1, maxY + 1]
}

export function validateTmb2LogoAuthority({ sourcePath, packageRoot, manifest }) {
  const errors = []
  if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
    errors.push('approved TMB2 logo source is missing')
  } else {
    if (sha256File(sourcePath) !== TMB2_LOGO_SHA256) {
      errors.push('approved TMB2 logo hash does not match')
    }
    if (statSync(sourcePath).size !== TMB2_LOGO_BYTES) {
      errors.push('approved TMB2 logo byte count does not match')
    }
    try {
      const metadata = pngMetadata(sourcePath)
      if (metadata.width !== TMB2_LOGO_SIZE[0] || metadata.height !== TMB2_LOGO_SIZE[1]) {
        errors.push('approved TMB2 logo dimensions do not match')
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }

  const authority = manifest?.logoAuthority
  if (authority?.sha256 !== TMB2_LOGO_SHA256
    || authority?.bytes !== TMB2_LOGO_BYTES
    || authority?.width !== TMB2_LOGO_SIZE[0]
    || authority?.height !== TMB2_LOGO_SIZE[1]) {
    errors.push('manifest TMB2 logo authority does not match the approved source')
  }

  const assetsByPath = new Map((manifest?.assets ?? []).map((asset) => [asset.path, asset]))
  for (const [path, runtimeId, width, height] of TMB2_IDENT_LAYERS) {
    const asset = assetsByPath.get(path)
    if (!asset) {
      errors.push(`missing ident layer: ${path}`)
      continue
    }
    if (asset.runtimeId !== runtimeId
      || asset.role !== 'logo-layer'
      || asset.sceneGroup !== 'ident'
      || asset.source !== 'art-source/intro/tmb2/owner-approved/TMB2logo.png') {
      errors.push(`invalid ident contract: ${path}`)
    }
    if (asset.width !== width || asset.height !== height) {
      errors.push(`invalid ident dimensions: ${path}`)
    }
  }

  const runtimeSource = resolveContained(packageRoot, 'logo/tmb2-ident-source.png')
  if (runtimeSource && existsSync(runtimeSource)) {
    if (sha256File(runtimeSource) !== TMB2_LOGO_SHA256
      || statSync(runtimeSource).size !== TMB2_LOGO_BYTES) {
      errors.push('runtime TMB2 logo source is not byte-identical')
    }
  }
  return errors
}

function resolveContained(root, relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0 || isAbsolute(relativePath)) return undefined
  const resolvedRoot = resolve(root)
  const candidate = resolve(resolvedRoot, relativePath)
  return candidate.startsWith(`${resolvedRoot}${sep}`) ? candidate : undefined
}

export function validateIntroManifest(manifest, root) {
  const errors = []
  if (!manifest || typeof manifest !== 'object') return ['manifest must be an object']
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1')

  const assets = Array.isArray(manifest.assets) ? manifest.assets : []
  const duplicates = Array.isArray(manifest.duplicates) ? manifest.duplicates : []
  const preload = Array.isArray(manifest.preload) ? manifest.preload : []
  if (!Array.isArray(manifest.assets)) errors.push('assets must be an array')
  if (!Array.isArray(manifest.duplicates)) errors.push('duplicates must be an array')
  if (!Array.isArray(manifest.preload)) errors.push('preload must be an array')

  const assetsById = new Map()
  const assetsByPath = new Map()

  for (const asset of assets) {
    if (!asset || typeof asset !== 'object') {
      errors.push('asset record must be an object')
      continue
    }
    const id = asset.id
    const path = asset.path
    if (typeof id !== 'string' || id.length === 0) errors.push('asset id must be a non-empty string')
    else if (assetsById.has(id)) errors.push(`duplicate asset id: ${id}`)
    else assetsById.set(id, asset)

    if (typeof path !== 'string' || path.length === 0) errors.push(`asset ${id ?? '<unknown>'} path must be a non-empty string`)
    else if (assetsByPath.has(path)) errors.push(`duplicate asset path: ${path}`)
    else assetsByPath.set(path, asset)

    if (PROTECTED_REWARD_PATTERN.test(`${id ?? ''} ${path ?? ''}`)) {
      errors.push(`protected reward reference in asset: ${id ?? path}`)
    }
    if (!SHA256_PATTERN.test(asset.sha256 ?? '')) errors.push(`invalid sha256 for ${id ?? path ?? '<unknown>'}`)
    if (!Number.isInteger(asset.bytes) || asset.bytes < 0) errors.push(`invalid byte count for ${id ?? path ?? '<unknown>'}`)

    const candidate = resolveContained(root, path)
    if (!candidate) {
      errors.push(`asset path escapes package root: ${path ?? '<unknown>'}`)
      continue
    }
    if (!existsSync(candidate) || !statSync(candidate).isFile()) {
      errors.push(`missing asset: ${path}`)
      continue
    }

    const stat = statSync(candidate)
    if (Number.isInteger(asset.bytes) && stat.size !== asset.bytes) {
      errors.push(`byte count mismatch for ${path}: expected ${asset.bytes}, got ${stat.size}`)
    }
    if (SHA256_PATTERN.test(asset.sha256 ?? '')) {
      const actualHash = sha256File(candidate)
      if (actualHash !== asset.sha256) errors.push(`hash mismatch for ${path}: expected ${asset.sha256}, got ${actualHash}`)
    }

    const declaresPngContract = asset.width !== undefined || asset.height !== undefined || asset.hasAlpha !== undefined
    if (declaresPngContract) {
      try {
        const metadata = pngMetadata(candidate)
        if (metadata.width !== asset.width || metadata.height !== asset.height) {
          errors.push(`dimensions mismatch for ${path}: expected ${asset.width}x${asset.height}, got ${metadata.width}x${metadata.height}`)
        }
        if (asset.hasAlpha === true && !metadata.hasAlpha) errors.push(`alpha channel missing for ${path}`)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error))
      }
    }
  }

  for (const duplicate of duplicates) {
    if (!duplicate || typeof duplicate !== 'object') {
      errors.push('duplicate record must be an object')
      continue
    }
    const canonical = assetsById.get(duplicate.canonical)
    if (!canonical) errors.push(`duplicate ${duplicate.source ?? '<unknown>'} references unknown canonical asset: ${duplicate.canonical ?? '<unknown>'}`)
    if (!SHA256_PATTERN.test(duplicate.sha256 ?? '')) errors.push(`invalid duplicate sha256 for ${duplicate.source ?? '<unknown>'}`)
    if (canonical && duplicate.sha256 !== canonical.sha256) {
      errors.push(`duplicate hash mismatch for ${duplicate.source ?? '<unknown>'}`)
    }
  }

  for (const path of preload) {
    if (typeof path !== 'string') {
      errors.push('preload entries must be strings')
      continue
    }
    if (PROTECTED_REWARD_PATTERN.test(path)) errors.push(`protected reward reference in preload: ${path}`)
    if (!assetsByPath.has(path)) errors.push(`preload path is not declared as an asset: ${path}`)
  }

  return errors
}
