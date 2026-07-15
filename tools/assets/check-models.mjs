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

function glbJson(path) {
  const bytes = readFileSync(path)
  if (bytes.toString('utf8', 0, 4) !== 'glTF') throw new Error('invalid GLB magic')
  const jsonLength = bytes.readUInt32LE(12)
  const jsonType = bytes.toString('utf8', 16, 20)
  if (jsonType !== 'JSON') throw new Error('first GLB chunk is not JSON')
  return JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength))
}

const requiredModelContracts = {
  'dc9-cockpit.glb': [
    'DC9_ROOT',
    'DC9_PROP_CAPTAINS_KEY',
    'DC9_PROP_CAPTAINS_KEY_MESH',
    'DC9_HITBOX_CAPTAINS_KEY',
    'CAM_DC9_FIRST_OFFICER_GAME',
    'CAM_DC9_FIRST_OFFICER_APPROVAL',
    'CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL',
    'CAM_DC9_FIRST_OFFICER_MAIN_PANEL_APPROVAL',
    'CAM_DC9_FIRST_OFFICER_OVERHEAD_APPROVAL',
    'CAM_DC9_FIRST_OFFICER_PEDESTAL_APPROVAL',
  ],
  'airbus-captain.glb': [
    'AIRBUS_ROOT',
    'CAM_AIRBUS_CAPTAIN_GAME_VIEW',
    'AIRBUS_A320_CAM_CAPTAIN_APPROVAL',
    'AIRBUS_A320_TARGET_SIDESTICK_PIVOT',
    'AIRBUS_A320_TARGET_THRUST_PIVOT',
    'AIRBUS_A320_TARGET_GEAR_PIVOT',
    'AIRBUS_A320_TARGET_RADIO_PIVOT',
    'AIRBUS_A320_TARGET_ALTITUDE_PIVOT',
  ],
}

if (models.includes('airbus-first-officer.glb')) {
  console.error('Deprecated deployable model must be removed: public/models/airbus-first-officer.glb')
  failed = true
}

for (const [model, requiredNodes] of Object.entries(requiredModelContracts)) {
  if (!models.includes(model)) {
    console.error(`Missing required production model: ${join(modelDir, model)}`)
    failed = true
    continue
  }
  try {
    const json = glbJson(join(modelDir, model))
    const names = new Set((json.nodes ?? []).map((node) => node.name).filter(Boolean))
    const missing = requiredNodes.filter((name) => !names.has(name))
    if (missing.length > 0) {
      console.error(`${model} is missing required runtime nodes: ${missing.join(', ')}`)
      failed = true
    }
    if (model === 'dc9-cockpit.glb') {
      const nodes = json.nodes ?? []
      const nodeIndex = (name) => nodes.findIndex((node) => node.name === name)
      const parentName = (name) => {
        const index = nodeIndex(name)
        const parent = nodes.find((node) => node.children?.includes(index))
        return parent?.name
      }
      const routeCard = nodes[nodeIndex('DC9_PROP_MEM_ROUTE_CARD')]
      const routeTranslation = routeCard?.translation
      const centeredOnFirstOfficerYoke = Array.isArray(routeTranslation)
        && Math.abs(routeTranslation[0] - 0.4973) < 0.002
        && Math.abs(routeTranslation[1] - 0.27) < 0.002
        && Math.abs(routeTranslation[2] - 2.775) < 0.002
      const routeContractNodes = nodes
        .map((node) => node.name)
        .filter((name) => name === 'DC9_PROP_MEM_ROUTE_CARD'
          || name === 'DC9_ROUTE_SUBMIT'
          || /^DC9_ROUTE_ROW_[A-Z]{3}$/.test(name ?? '')
          || name?.startsWith('DC9_HITBOX_ROUTE_'))
      const routeContractParentedToFirstOfficerYoke = routeContractNodes.every(
        (name) => parentName(name) === 'OBJ8_DC9VC2_RANGE_014',
      )
      const routePositionAccessorIndex = routeCard?.mesh === undefined
        ? undefined
        : json.meshes?.[routeCard.mesh]?.primitives?.[0]?.attributes?.POSITION
      const routePositionAccessor = routePositionAccessorIndex === undefined
        ? undefined
        : json.accessors?.[routePositionAccessorIndex]
      const routeCardHeight = Array.isArray(routePositionAccessor?.min) && Array.isArray(routePositionAccessor?.max)
        ? routePositionAccessor.max[1] - routePositionAccessor.min[1]
        : undefined
      const routeCardIsHalfHeight = typeof routeCardHeight === 'number' && Math.abs(routeCardHeight - 0.15) < 0.002
      if (!centeredOnFirstOfficerYoke || !routeContractParentedToFirstOfficerYoke || !routeCardIsHalfHeight) {
        console.error(`DC-9 route record and hitboxes must be centered on the first-officer yoke at 0.15 scene-unit height; received ${routeCardHeight ?? 'none'}.`)
        failed = true
      }

      const key = nodes[nodeIndex('DC9_PROP_CAPTAINS_KEY')]
      const keyHitbox = nodes[nodeIndex('DC9_HITBOX_CAPTAINS_KEY')]
      if (key?.extras?.game_id !== 'dc9.key.open'
        || key?.extras?.interaction !== 'open'
        || keyHitbox?.extras?.collider_only !== true
        || keyHitbox?.extras?.collider_target_game_id !== 'dc9.key.open') {
        console.error('DC-9 Captain\'s Key must export its stable game_id and collider contract.')
        failed = true
      }

      const reportPath = 'asset-reports/dc9-golden-key-intake.json'
      if (!existsSync(reportPath)) {
        console.error(`Missing DC-9 golden-key intake report: ${reportPath}`)
        failed = true
      } else {
        const report = JSON.parse(readFileSync(reportPath, 'utf8'))
        const textureRoles = new Set((report.textures ?? []).map((texture) => texture.role))
        const completeTextures = ['baseColor', 'normal', 'metallicRoughness'].every((role) => textureRoles.has(role))
        if (report.sourceSha256 !== 'b243ec3571ef597048ad8ef08ae63eac8da6f9790f7552570921d08aff0a898d'
          || report.runtimeTriangleCount > 72_000
          || report.runtimeMaterialCount !== 1
          || report.sourceTextureGatePassed !== true
          || !completeTextures
          || (report.textures ?? []).some((texture) => texture.runtimeDimensions?.[0] > 1024 || texture.runtimeDimensions?.[1] > 1024)) {
          console.error('DC-9 golden-key intake report violates the approved source or runtime budget.')
          failed = true
        }
      }
    }
    if (model === 'airbus-captain.glb') {
      const cameraNode = (json.nodes ?? []).find((node) => node.name === 'CAM_AIRBUS_CAPTAIN_GAME_VIEW')
      const camera = cameraNode && Number.isInteger(cameraNode.camera) ? json.cameras?.[cameraNode.camera] : null
      const verticalFov = camera?.perspective?.yfov
      if (typeof verticalFov !== 'number' || verticalFov < 1.16 || verticalFov > 1.21) {
        console.error(`Airbus captain gameplay camera must export a 68-degree vertical field of view; received ${verticalFov ?? 'none'}.`)
        failed = true
      }
      const radioPivot = (json.nodes ?? []).find((node) => node.name === 'AIRBUS_A320_TARGET_RADIO_PIVOT')
      const radioLateral = radioPivot?.translation?.[0]
      if (typeof radioLateral !== 'number' || radioLateral >= 0) {
        console.error(`Airbus captain radio target must be on the captain/left side; received lateral coordinate ${radioLateral ?? 'none'}.`)
        failed = true
      }
    }
  } catch (error) {
    console.error(`Could not inspect ${model}: ${error instanceof Error ? error.message : String(error)}`)
    failed = true
  }
}

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
