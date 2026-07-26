import { existsSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import {
  validateIntroManifest,
  validateTmb2LogoAuthority,
} from './intro-asset-contract.mjs'

const manifestPath = 'public/images/intro/tmb2/tmb2-intro-assets.json'

if (!existsSync(manifestPath)) {
  console.error(`Missing TMB2 intro manifest: ${manifestPath}`)
  process.exit(1)
}

let manifest
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
} catch (error) {
  console.error(`Could not parse ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

const errors = [
  ...validateIntroManifest(manifest, dirname(manifestPath)),
  ...validateTmb2LogoAuthority({
    sourcePath: 'art-source/intro/tmb2/owner-approved/TMB2logo.png',
    packageRoot: dirname(manifestPath),
    manifest,
  }),
]
if (errors.length > 0) {
  errors.forEach((error) => console.error(error))
  process.exit(1)
}

console.log(`TMB2 intro asset contract passed (${manifest.assets.length} assets, ${manifest.preload.length} preloads).`)
