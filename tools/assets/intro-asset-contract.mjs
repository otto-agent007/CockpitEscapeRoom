import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, resolve, sep } from 'node:path'

const SHA256_PATTERN = /^[0-9a-f]{64}$/
const PROTECTED_REWARD_PATTERN = /tesla|model[- ]?y|flight mode|mars/i
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

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
