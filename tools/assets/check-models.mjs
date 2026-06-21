import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const modelDir = 'public/models'
const models = existsSync(modelDir)
  ? readdirSync(modelDir).filter((name) => name.toLowerCase().endsWith('.glb'))
  : []

if (models.length === 0) {
  console.log('No production GLB files are present yet. Bootstrap state is valid.')
  process.exit(0)
}

let failed = false
for (const model of models) {
  const path = join(modelDir, model)
  const sizeMb = statSync(path).size / 1024 / 1024
  console.log(`Checking ${path} (${sizeMb.toFixed(2)} MiB)`)
  const result = spawnSync('npx', ['gltf-transform', 'validate', path], { stdio: 'inherit' })
  if (result.status !== 0) failed = true
  if (sizeMb > 50) {
    console.error(`${path} exceeds the 50 MiB review threshold. Split or optimize before merging.`)
    failed = true
  }
}

process.exit(failed ? 1 : 0)
