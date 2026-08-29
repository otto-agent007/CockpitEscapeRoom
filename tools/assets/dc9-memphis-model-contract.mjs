export const DC9_MEMPHIS_REQUIRED_NODES = [
  'KMEM_LEGACY_ROOT',
  'KMEM_CONCOURSE_B',
  'KMEM_RAMP',
  'KMEM_TAXI_SURFACE',
  'KMEM_RUNWAY_SURFACE',
  'KMEM_RAMP_START',
  'KMEM_TAXI_TURN',
  'KMEM_HOLD_SHORT',
  'KMEM_RUNWAY_LINEUP',
  'KMEM_INITIAL_CLIMB',
]

const ANCHOR_GAME_IDS = {
  KMEM_RAMP_START: 'dc9.memphis.rampStart',
  KMEM_TAXI_TURN: 'dc9.memphis.taxiTurn',
  KMEM_HOLD_SHORT: 'dc9.memphis.holdShort',
  KMEM_RUNWAY_LINEUP: 'dc9.memphis.runwayLineup',
  KMEM_INITIAL_CLIMB: 'dc9.memphis.initialClimb',
}
const SELECTED_TEXTURES = new Set(['KMEMterminal', 'KMEMterminal_NML', 'KMEMterminal_LIT'])
const INTERACTIVE_KEYS = new Set(['interaction', 'input_axis', 'control_id', 'cockpit_control'])

function finiteTransform(node) {
  return ['translation', 'rotation', 'scale', 'matrix'].every((key) => (
    node[key] === undefined || (Array.isArray(node[key]) && node[key].every(Number.isFinite))
  ))
}

function triangleCount(json) {
  return (json.meshes ?? []).reduce((total, mesh) => total + (mesh.primitives ?? []).reduce((sum, primitive) => {
    const accessorIndex = primitive.indices ?? primitive.attributes?.POSITION
    const count = Number.isInteger(accessorIndex) ? (json.accessors?.[accessorIndex]?.count ?? 0) : 0
    return sum + count / 3
  }, 0), 0)
}

export function validateDc9MemphisModelContract(json, byteLength) {
  const errors = []
  const nodes = json.nodes ?? []
  const contractObjects = Object.values(json)
    .filter(Array.isArray)
    .flat()
    .filter((value) => value !== null && typeof value === 'object')
  for (const name of DC9_MEMPHIS_REQUIRED_NODES) {
    const matches = nodes.filter((node) => node.name === name)
    if (matches.length !== 1) errors.push(`DC-9 Memphis environment must export exactly one ${name}; found ${matches.length}.`)
  }
  for (const [name, gameId] of Object.entries(ANCHOR_GAME_IDS)) {
    const node = nodes.find((candidate) => candidate.name === name)
    if (node?.extras?.game_id !== gameId) errors.push(`${name} must export exact game_id ${gameId}.`)
  }
  if (nodes.some((node) => !finiteTransform(node))) errors.push('Every DC-9 Memphis node must have a finite transform.')
  if (contractObjects.some((object) => Object.keys(object.extras ?? {}).some((key) => INTERACTIVE_KEYS.has(key)))) {
    errors.push('The environment must not export interactive cockpit metadata.')
  }
  if (contractObjects.some((object) => /AutoGate|OpenSceneryX|Planes/i.test(object.name ?? ''))) {
    errors.push('The environment must exclude AutoGate/OpenSceneryX/Planes library content.')
  }
  if (triangleCount(json) > 5_000) errors.push('The Memphis environment must remain at or below 5,000 triangles.')
  // Raised from six on 2026-08-28 for the owner-requested background scenery
  // (field + tree lines) alongside the canopy accent.
  if ((json.materials ?? []).length > 8) errors.push('The Memphis environment must use no more than eight materials.')
  for (const image of json.images ?? []) {
    if (!SELECTED_TEXTURES.has(image.name)) continue
    const { width, height } = image.extras ?? {}
    if (!Number.isInteger(width) || !Number.isInteger(height) || width > 2048 || height > 1024) {
      errors.push(`${image.name} must remain at or below 2048x1024.`)
    }
  }
  for (const name of SELECTED_TEXTURES) {
    if ((json.images ?? []).filter((image) => image.name === name).length !== 1) errors.push(`Selected packed texture ${name} must appear exactly once.`)
  }
  if (!Number.isFinite(byteLength) || byteLength > 8 * 1024 * 1024) errors.push('The Memphis GLB must remain at or below 8 MiB.')
  return errors
}
