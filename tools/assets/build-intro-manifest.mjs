import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'
import { pngMetadata, sha256File } from './intro-asset-contract.mjs'

const packageRoot = 'public/images/intro/tmb2'
const manifestName = 'tmb2-intro-assets.json'

function portable(path) {
  return path.split(sep).join('/')
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? walk(path) : [path]
    })
}

function assetId(path) {
  return path.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const paths = walk(packageRoot)
  .map((path) => portable(relative(packageRoot, path)))
  .filter((path) => path !== manifestName)
  .sort()

const assets = paths.map((path) => {
  const absolutePath = join(packageRoot, path)
  const record = {
    id: assetId(path),
    path,
    sha256: sha256File(absolutePath),
    bytes: statSync(absolutePath).size,
  }
  return extname(path).toLowerCase() === '.png'
    ? { ...record, ...pngMetadata(absolutePath) }
    : record
})

const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
const duplicates = [
  {
    source: 'ChatGPT Image Jul 20, 2026, 04_51_23 PM.png',
    canonical: 'key-key-mascot-poses-01-png',
    sourceSha256: 'cf63e5a292f18346e1228002c3c45e1ab1891f628b94d68e4fc89bb504a8dc2f',
  },
  {
    source: 'ChatGPT Image Jul 20, 2026, 04_51_41 PM.png',
    canonical: 'key-key-mascot-poses-05-png',
    sourceSha256: 'f421ff5b333cb213a7945e508ab167eabf01a39e6f1a276e2ba583034f09dd19',
  },
].map(({ source, canonical, sourceSha256 }) => {
  const asset = assetsById.get(canonical)
  if (!asset) throw new Error(`Missing canonical duplicate asset: ${canonical}`)
  return { source, canonical, sha256: asset.sha256, sourceSha256 }
})

const preload = [
  'backgrounds/duffel-terminal.png',
  'backgrounds/runway-night.png',
  'backgrounds/ballpark-night.png',
  'backgrounds/finance-city.png',
  'backgrounds/cloud-chase.png',
  'key/key-mascot-poses-00.png',
  'popt/animation-contract-export.json',
  'popt/duffel-pull/duffel-pull.webp',
]

const manifest = {
  schemaVersion: 1,
  packageId: 'tmb2-intro-v1',
  sourceAuthority: 'blonde-haired Pop T storyboard',
  tooling: {
    repository: 'https://github.com/otto-agent007/GameDevStuff',
    commit: '22722eabc8f09a706013305a0911a9d322ca9f4f',
    pixelSnapperRelease: 'pixel-snapper-v1.0.0-commit.5743009',
    pixelSnapperSha256: 'bd03110406efc2efc0b094c0442a2265cb44f935a3f418fc30fdc20e77eb3f96',
  },
  assets,
  duplicates,
  preload,
}

writeFileSync(join(packageRoot, manifestName), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Wrote ${manifestName} with ${assets.length} hash-bound assets.`)
