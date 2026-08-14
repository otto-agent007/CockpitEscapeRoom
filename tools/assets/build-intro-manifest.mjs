import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'
import { pngMetadata, sha256File } from './intro-asset-contract.mjs'

const packageRoot = 'public/images/intro/tmb2'
const manifestName = 'tmb2-intro-assets.json'
const logoSource = 'art-source/intro/tmb2/owner-approved/TMB2logo.png'
const logoMetadata = new Map([
  ['logo/tmb2-ident-source.png', 'logo-source'],
  ['logo/tmb2-ident-blue-mask.png', 'logo-blue-mask'],
  ['logo/tmb2-ident-base.png', 'logo-base'],
  ['logo/tmb2-ident-highlight-mask.png', 'logo-highlight-mask'],
  ['logo/tmb2-productions.png', 'logo-productions'],
])

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
  const pngRecord = extname(path).toLowerCase() === '.png'
    ? { ...record, ...pngMetadata(absolutePath) }
    : record
  const runtimeId = logoMetadata.get(path)
  return runtimeId
    ? {
        ...pngRecord,
        runtimeId,
        role: 'logo-layer',
        sceneGroup: 'ident',
        source: logoSource,
      }
    : pngRecord
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
  'logo/tmb2-ident-source.png',
  'logo/tmb2-ident-blue-mask.png',
  'logo/tmb2-ident-base.png',
  'logo/tmb2-ident-highlight-mask.png',
  'logo/tmb2-productions.png',
  'backgrounds/duffel-terminal.png',
  'backgrounds/runway-night.png',
  'backgrounds/ballpark-night.png',
  'backgrounds/finance-city.png',
  'backgrounds/cloud-chase.png',
  'popt/duffel-pull/duffel-pull-sheet.png',
  'popt/startle-stumble/startle-stumble-sheet.png',
  'popt/baseball-slide/baseball-slide-sheet.png',
  'popt/bull-spin/bull-spin-sheet.png',
  'popt/pilot-glide/pilot-glide-sheet.png',
  'popt/victory-recovery/victory-recovery-sheet.png',
  'key/key-mascot-poses-sheet.png',
  'popt/legacy/idle-sheet.png',
  'popt/legacy/run-sheet.png',
  'popt/legacy/reach-catch-sheet.png',
]

const manifest = {
  schemaVersion: 1,
  packageId: 'tmb2-intro-v1',
  sourceAuthority: 'owner-approved TMB2 logo and blonde-haired Pop T storyboard',
  logoAuthority: {
    source: logoSource,
    sha256: '673d13b96bc19b35b508630d1d662d16672ac4bb6ad665a7f6b1b7cee992ce17',
    bytes: 811581,
    width: 1659,
    height: 948,
  },
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
