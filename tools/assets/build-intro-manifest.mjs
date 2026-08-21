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
const duplicates = []

const preload = [
  'logo/tmb2-ident-source.png',
  'logo/tmb2-ident-blue-mask.png',
  'logo/tmb2-ident-base.png',
  'logo/tmb2-ident-highlight-mask.png',
  'scramble/sprites/popt-run-sheet.png',
  'scramble/sprites/popt-skid.png',
  'scramble/sprites/popt-blinded.png',
  'scramble/sprites/popt-forearm.png',
  'scramble/sprites/popt-flick.png',
  'scramble/sprites/popt-crooked.png',
  'scramble/sprites/popt-salute.png',
  'scramble/sprites/popt-tip.png',
  'scramble/sprites/popt-cover.png',
  'scramble/sprites/popt-fall.png',
  'scramble/sprites/popt-swing.png',
  'scramble/sprites/popt-lookup.png',
  'scramble/sprites/popt-cap.png',
  'scramble/sprites/popt-landed.png',
  'scramble/plates/hangar-dark.png',
  'scramble/plates/hangar-reveal.png',
  'scramble/plates/doorway.png',
  'scramble/plates/door-leaf.png',
  'scramble/plates/walk-tarmac.png',
  'scramble/plates/runway-lineup.png',
  'scramble/plates/right-seat.png',
  'scramble/cards/boots.png',
  'scramble/cards/coffee.png',
  'scramble/cards/watch.png',
  'scramble/cards/stripes.png',
  'scramble/cards/logbook.png',
  'scramble/cards/wings.png',
  'scramble/cards/cap-a.png',
  'scramble/cards/cap-mid.png',
  'scramble/cards/cap-b.png',
  'scramble/cards/shades.png',
  'scramble/cards/logbook-books.png',
  'scramble/cards/logbook-sweep.png',
  'scramble/cards/logbook-lift.png',
  'scramble/cards/shadow.png',
  'scramble/cards/instruments.png',
  'scramble/cards/instruments-b.png',
  'scramble/cards/throttles-a.png',
  'scramble/cards/throttles-b.png',
  'scramble/sprites/popt-walk-sheet.png',
  'scramble/sprites/popt-backlit.png',
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
