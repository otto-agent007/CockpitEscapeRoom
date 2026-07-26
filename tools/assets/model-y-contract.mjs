export const MODEL_Y_SOURCE_SHA256 = 'd88769d9c66bdeca46bf239c9baa2a295afc82ffb24005733d9374b9c7782bee'
export const MODEL_Y_ANIMATION_NAME = 'TESLA_FLIGHT_MODE_REVEAL'
export const MODEL_Y_ANIMATION_DURATION_SECONDS = 11.5

export const MODEL_Y_REQUIRED_NODES = [
  'TESLA_ROOT',
  'TESLA_HANGAR',
  'TESLA_HANGAR_DOOR_LEFT',
  'TESLA_HANGAR_DOOR_RIGHT',
  'TESLA_VEHICLE',
  'TESLA_MODEL_Y_BODY',
  'TESLA_PLATE_POP_T',
  'TESLA_FLIGHT_MODE_ROOT',
  'TESLA_WING_LEFT_PIVOT',
  'TESLA_WING_RIGHT_PIVOT',
  'TESLA_STABILIZER_LEFT_PIVOT',
  'TESLA_STABILIZER_RIGHT_PIVOT',
  'TESLA_LIFT_FAN_FRONT_DOOR_PIVOT',
  'TESLA_LIFT_FAN_REAR_DOOR_PIVOT',
  'TESLA_LIFT_FAN_FRONT_ROTOR',
  'TESLA_LIFT_FAN_REAR_ROTOR',
  'TESLA_EMISSIVE',
  'CAM_TESLA_REWARD_GAME',
  'CAM_TESLA_REWARD_NARROW_GAME',
  'CAM_TESLA_REWARD_APPROVAL',
  'CAM_TESLA_FLIGHT_MODE_APPROVAL',
]

const REQUIRED_TEXTURE_ROLES = ['baseColor', 'normal', 'metallicRoughness']
const MAX_MODEL_BYTES = 25 * 1024 * 1024
const MAX_VEHICLE_TRIANGLES = 180_000
const MAX_TOTAL_TRIANGLES = 250_000
const MAX_MATERIALS = 8
const MAX_DRAW_CALLS = 30
const MAX_RUNTIME_TEXTURE_DIMENSION = 2048

function triangleCount(json, primitive) {
  const accessorIndex = primitive.indices ?? primitive.attributes?.POSITION
  const count = Number.isInteger(accessorIndex) ? json.accessors?.[accessorIndex]?.count : undefined
  return typeof count === 'number' ? count / 3 : 0
}

function completeTextureSet(textures, minimumDimension, maximumDimension = Number.POSITIVE_INFINITY) {
  const byRole = new Map((textures ?? []).map((texture) => [texture.role, texture]))
  return REQUIRED_TEXTURE_ROLES.every((role) => {
    const dimensions = byRole.get(role)?.dimensions
    return Array.isArray(dimensions)
      && dimensions.length === 2
      && dimensions.every((value) => Number.isInteger(value)
        && value >= minimumDimension
        && value <= maximumDimension)
  })
}

export function validateModelYContract({ json, byteLength, intakeReport }) {
  const errors = []
  const nodes = json.nodes ?? []
  const nodeByName = new Map(nodes.map((node) => [node.name, node]))

  const missingNodes = MODEL_Y_REQUIRED_NODES.filter((name) => !nodeByName.has(name))
  if (missingNodes.length > 0) {
    errors.push(`Model Y GLB is missing required nodes: ${missingNodes.join(', ')}.`)
  }

  const vehicle = nodeByName.get('TESLA_VEHICLE')
  if (vehicle?.extras?.game_id !== 'reward.modelY') {
    errors.push('TESLA_VEHICLE must export game_id reward.modelY.')
  }
  const flightMode = nodeByName.get('TESLA_FLIGHT_MODE_ROOT')
  if (flightMode?.extras?.game_id !== 'reward.flightMode' || flightMode?.extras?.interaction !== 'animation') {
    errors.push('TESLA_FLIGHT_MODE_ROOT must export the reward.flightMode animation contract.')
  }

  const body = nodeByName.get('TESLA_MODEL_Y_BODY')
  const bodyPrimitives = Number.isInteger(body?.mesh) ? (json.meshes?.[body.mesh]?.primitives ?? []) : []
  if (bodyPrimitives.length === 0 || bodyPrimitives.some((primitive) => !Number.isInteger(primitive.attributes?.TANGENT))) {
    errors.push('TESLA_MODEL_Y_BODY must export tangent data.')
  }

  const allPrimitives = (json.meshes ?? []).flatMap((mesh) => mesh.primitives ?? [])
  const bodyTriangles = bodyPrimitives.reduce((sum, primitive) => sum + triangleCount(json, primitive), 0)
  const totalTriangles = allPrimitives.reduce((sum, primitive) => sum + triangleCount(json, primitive), 0)
  const materialCount = (json.materials ?? []).length
  const drawCallCount = allPrimitives.length

  if (bodyTriangles > MAX_VEHICLE_TRIANGLES) {
    errors.push(`TESLA_MODEL_Y_BODY exceeds ${MAX_VEHICLE_TRIANGLES} triangles; received ${bodyTriangles}.`)
  }
  if (totalTriangles > MAX_TOTAL_TRIANGLES) {
    errors.push(`Model Y GLB exceeds ${MAX_TOTAL_TRIANGLES} triangles; received ${totalTriangles}.`)
  }
  if (materialCount > MAX_MATERIALS) {
    errors.push(`Model Y GLB exceeds ${MAX_MATERIALS} materials; received ${materialCount}.`)
  }
  if (drawCallCount > MAX_DRAW_CALLS) {
    errors.push(`Model Y GLB exceeds ${MAX_DRAW_CALLS} draw calls; received ${drawCallCount}.`)
  }
  if (byteLength > MAX_MODEL_BYTES) {
    errors.push(`Model Y GLB exceeds 25 MiB; received ${(byteLength / 1024 / 1024).toFixed(2)} MiB.`)
  }

  const animation = (json.animations ?? []).find((candidate) => candidate.name === MODEL_Y_ANIMATION_NAME)
  const animationInputs = new Set((animation?.samplers ?? []).map((sampler) => sampler.input))
  const animationDuration = Math.max(
    0,
    ...[...animationInputs].map((accessorIndex) => json.accessors?.[accessorIndex]?.max?.[0] ?? 0),
  )
  if (!animation || Math.abs(animationDuration - MODEL_Y_ANIMATION_DURATION_SECONDS) > 0.001) {
    errors.push(
      `${MODEL_Y_ANIMATION_NAME} must be exactly ${MODEL_Y_ANIMATION_DURATION_SECONDS} seconds; received ${animation ? animationDuration : 'none'}.`,
    )
  }

  if (intakeReport?.sourceSha256 !== MODEL_Y_SOURCE_SHA256) {
    errors.push('Model Y intake report does not match the approved source SHA-256.')
  }
  if (intakeReport?.sourceTextureGatePassed !== true
    || !completeTextureSet(intakeReport?.sourceTextures, 4096)) {
    errors.push('Model Y source must contain wired 4096x4096 BaseColor, normal, and metallic-roughness maps.')
  }
  if (!completeTextureSet(intakeReport?.runtimeTextures, 1, MAX_RUNTIME_TEXTURE_DIMENSION)) {
    errors.push('Model Y runtime must contain BaseColor, normal, and metallic-roughness maps no larger than 2048x2048.')
  }
  if (intakeReport?.runtimeVehicleTriangleCount !== bodyTriangles
    || intakeReport?.runtimeTotalTriangleCount !== totalTriangles
    || intakeReport?.runtimeMaterialCount !== materialCount
    || intakeReport?.runtimeDrawCallCount !== drawCallCount) {
    errors.push('Model Y intake report runtime counts do not match the deployable GLB.')
  }

  return errors
}
