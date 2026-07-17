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

function parseGlb(path) {
  const bytes = readFileSync(path)
  if (bytes.toString('utf8', 0, 4) !== 'glTF') throw new Error('invalid GLB magic')
  let json
  let binary
  let offset = 12
  while (offset < bytes.length) {
    const chunkLength = bytes.readUInt32LE(offset)
    const chunkType = bytes.toString('utf8', offset + 4, offset + 8)
    const chunk = bytes.subarray(offset + 8, offset + 8 + chunkLength)
    if (chunkType === 'JSON') json = JSON.parse(chunk.toString('utf8'))
    if (chunkType === 'BIN\u0000') binary = chunk
    offset += 8 + chunkLength
  }
  if (!json) throw new Error('GLB has no JSON chunk')
  if (!binary) throw new Error('GLB has no binary chunk')
  return { json, binary }
}

function embeddedPngDimensions(json, binary, imageIndex) {
  const image = json.images?.[imageIndex]
  const view = image?.bufferView === undefined ? undefined : json.bufferViews?.[image.bufferView]
  if (!view || image?.mimeType !== 'image/png') return undefined
  const start = view.byteOffset ?? 0
  const bytes = binary.subarray(start, start + view.byteLength)
  const pngSignature = bytes.length >= 24
    && bytes[0] === 0x89
    && bytes.toString('ascii', 1, 4) === 'PNG'
  return pngSignature ? [bytes.readUInt32BE(16), bytes.readUInt32BE(20)] : undefined
}

function pngDimensions(path) {
  if (!existsSync(path)) return undefined
  const bytes = readFileSync(path)
  const pngSignature = bytes.length >= 24
    && bytes[0] === 0x89
    && bytes.toString('ascii', 1, 4) === 'PNG'
  return pngSignature ? [bytes.readUInt32BE(16), bytes.readUInt32BE(20)] : undefined
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
    const { json, binary } = parseGlb(join(modelDir, model))
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
        && Math.abs(routeTranslation[1] - 0.32) < 0.002
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
      const keyMeshNode = nodes[nodeIndex('DC9_PROP_CAPTAINS_KEY_MESH')]
      const keyHitbox = nodes[nodeIndex('DC9_HITBOX_CAPTAINS_KEY')]
      if (key?.extras?.game_id !== 'dc9.key.open'
        || key?.extras?.interaction !== 'open'
        || keyHitbox?.extras?.collider_only !== true
        || keyHitbox?.extras?.collider_target_game_id !== 'dc9.key.open') {
        console.error('DC-9 Captain\'s Key must export its stable game_id and collider contract.')
        failed = true
      }

      const keyPrimitives = keyMeshNode?.mesh === undefined ? [] : (json.meshes?.[keyMeshNode.mesh]?.primitives ?? [])
      const keyTriangleCount = keyPrimitives.reduce((count, primitive) => {
        const accessorIndex = primitive.indices ?? primitive.attributes?.POSITION
        const accessorCount = accessorIndex === undefined ? 0 : (json.accessors?.[accessorIndex]?.count ?? 0)
        return count + accessorCount / 3
      }, 0)
      const keyMaterials = new Set(keyPrimitives.map((primitive) => primitive.material).filter(Number.isInteger))
      const keyHasTangents = keyPrimitives.length > 0 && keyPrimitives.every((primitive) => Number.isInteger(primitive.attributes?.TANGENT))
      const keyMaterialIndex = [...keyMaterials][0]
      const keyMaterial = Number.isInteger(keyMaterialIndex) ? json.materials?.[keyMaterialIndex] : undefined
      const keyTextureIndices = [
        keyMaterial?.pbrMetallicRoughness?.baseColorTexture?.index,
        keyMaterial?.normalTexture?.index,
        keyMaterial?.pbrMetallicRoughness?.metallicRoughnessTexture?.index,
      ]
      const keyTextureDimensions = keyTextureIndices.map((textureIndex) => {
        const imageIndex = Number.isInteger(textureIndex) ? json.textures?.[textureIndex]?.source : undefined
        return Number.isInteger(imageIndex) ? embeddedPngDimensions(json, binary, imageIndex) : undefined
      })
      const keyTexturesAreEmbedded1k = keyTextureDimensions.every(
        (dimensions) => dimensions?.[0] === 1024 && dimensions?.[1] === 1024,
      )
      if (!keyHasTangents
        || keyTriangleCount > 72_000
        || keyTriangleCount <= 0
        || keyMaterials.size !== 1
        || keyMaterial?.doubleSided !== true
        || !keyTexturesAreEmbedded1k) {
        console.error(`DC-9 Captain's Key deployed GLB violates its runtime contract: ${keyTriangleCount} triangles, ${keyMaterials.size} materials, tangents=${keyHasTangents}, textures=${JSON.stringify(keyTextureDimensions)}.`)
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
        const location = report.stableContract?.location
        const stagedSize = report.stagedBounds?.size
        const stagedRotation = report.stableContract?.rotationXYZDegreesApplied
        const restsLowerOnRightPanel = Array.isArray(location)
          && Math.abs(location[0] - 1.168) < 0.002
          && Math.abs(location[1] + 3.012) < 0.002
          && Math.abs(location[2] - 0.122) < 0.002
        const liesSideways = Array.isArray(stagedSize)
          && stagedSize[0] > stagedSize[1] * 1.5
          && stagedSize[0] > stagedSize[2] * 2
        const facesPlayer = JSON.stringify(stagedRotation) === JSON.stringify([0, 90, 172])
        if (report.sourceSha256 !== 'b243ec3571ef597048ad8ef08ae63eac8da6f9790f7552570921d08aff0a898d'
          || report.sourceTextureGatePassed !== true
          || !completeTextures
          || !restsLowerOnRightPanel
          || !liesSideways
          || !facesPlayer
          || (report.textures ?? []).some((texture) => texture.sourceDimensions?.[0] < 4096 || texture.sourceDimensions?.[1] < 4096)) {
          console.error('DC-9 golden-key intake report violates the approved source provenance contract.')
          failed = true
        }
      }

      const celebrationReportPath = 'asset-reports/dc9-captains-key-celebration.json'
      const celebrationImagePath = 'public/images/captains-key-celebration.png'
      if (!existsSync(celebrationReportPath)) {
        console.error(`Missing DC-9 key celebration report: ${celebrationReportPath}`)
        failed = true
      } else {
        const celebrationReport = JSON.parse(readFileSync(celebrationReportPath, 'utf8'))
        const celebrationSize = celebrationReport.bounds?.size
        const celebrationDimensions = pngDimensions(celebrationImagePath)
        const rendersUpright = Array.isArray(celebrationSize)
          && celebrationSize[2] > celebrationSize[0] * 2
          && celebrationSize[2] > celebrationSize[1] * 1.5
        if (celebrationReport.sourceModel !== 'public/models/dc9-cockpit.glb'
          || celebrationReport.node !== 'DC9_PROP_CAPTAINS_KEY'
          || celebrationReport.output !== celebrationImagePath
          || JSON.stringify(celebrationDimensions) !== JSON.stringify([1024, 1024])
          || JSON.stringify(celebrationReport.presentationRotationDegrees) !== JSON.stringify([-90, 98, 67])
          || !rendersUpright) {
          console.error('Captain\'s Key celebration must be a tracked 1024px render presented upright with its engraved face toward the player.')
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
      const expectedTargetTranslations = new Map([
        ['AIRBUS_A320_TARGET_RADIO_PIVOT', [-0.04, 0.011798, 0.474842]],
        ['AIRBUS_A320_TARGET_THRUST_PIVOT', [0.015, 0.0048, 0.505764]],
      ])
      for (const [nodeName, expectedTranslation] of expectedTargetTranslations) {
        const node = (json.nodes ?? []).find((candidate) => candidate.name === nodeName)
        const translation = node?.translation
        const aligned = Array.isArray(translation)
          && translation.length === expectedTranslation.length
          && translation.every((value, index) => Math.abs(value - expectedTranslation[index]) <= 0.00001)
        if (!aligned) {
          console.error(`${nodeName} must export at ${JSON.stringify(expectedTranslation)}; received ${JSON.stringify(translation ?? null)}.`)
          failed = true
        }
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
