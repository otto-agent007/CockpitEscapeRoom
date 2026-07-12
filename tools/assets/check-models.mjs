import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
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

if (models.includes('locker-room.glb')) {
  const reportPath = 'asset-reports/locker-room-prop-intake.json'
  const requiredProps = new Set(['baseball', 'pilot-watch', 'pilot-wings', 'charging-bull', 'captains-hat'])
  const requiredTextureRoles = new Set(['baseColor', 'normal', 'metallicRoughness'])
  if (!existsSync(reportPath)) {
    console.error(`Missing locker Tripo intake report: ${reportPath}`)
    failed = true
  } else {
    try {
      const report = JSON.parse(readFileSync(reportPath, 'utf8'))
      const props = Array.isArray(report.props) ? report.props : []
      const reportedProps = new Set(props.map((prop) => prop.asset))
      if (reportedProps.size !== props.length) {
        console.error('Locker Tripo intake report contains duplicate prop records.')
        failed = true
      }
      const missingProps = [...requiredProps].filter((asset) => !reportedProps.has(asset))
      if (missingProps.length > 0) {
        console.error(`Locker Tripo intake report is missing required props: ${missingProps.join(', ')}`)
        failed = true
      }
      for (const prop of props) {
        const textures = Array.isArray(prop.textures) ? prop.textures : []
        const requiredTextures = textures.filter((texture) => requiredTextureRoles.has(texture.role))
        const reportedRoles = new Set(requiredTextures.map((texture) => texture.role))
        const completeSet = requiredTextures.length === requiredTextureRoles.size
          && [...requiredTextureRoles].every((role) => reportedRoles.has(role))
        const sourceIs4k = completeSet && requiredTextures.every((texture) => (
          Array.isArray(texture.sourceDimensions)
          && texture.sourceDimensions.length === 2
          && texture.sourceDimensions.every((value) => Number.isInteger(value) && value >= 4096)
        ))
        const gateRoles = new Set(prop.textureQualityGate?.requiredRoles ?? [])
        const gateIsComplete = [...requiredTextureRoles].every((role) => gateRoles.has(role))
        if (!requiredProps.has(prop.asset) || !sourceIs4k || !gateIsComplete || prop.textureQualityGate?.passed !== true) {
          console.error(`${prop.asset ?? 'Unknown locker prop'} failed the required 4K Tripo source gate.`)
          failed = true
        }
      }
    } catch (error) {
      console.error(`Could not validate ${reportPath}: ${error instanceof Error ? error.message : String(error)}`)
      failed = true
    }
  }
}

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
