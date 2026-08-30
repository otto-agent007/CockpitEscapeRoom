import assert from 'node:assert/strict'
const { test } = await import(process.env.VITEST ? 'vitest' : 'node:test')
import {
  DC9_MEMPHIS_GROUND_NODES,
  DC9_MEMPHIS_REQUIRED_NODES,
  validateDc9MemphisModelContract,
} from './dc9-memphis-model-contract.mjs'

const GAME_IDS = {
  KMEM_RAMP_START: 'dc9.memphis.rampStart',
  KMEM_TAXI_TURN: 'dc9.memphis.taxiTurn',
  KMEM_HOLD_SHORT: 'dc9.memphis.holdShort',
  KMEM_RUNWAY_LINEUP: 'dc9.memphis.runwayLineup',
  KMEM_INITIAL_CLIMB: 'dc9.memphis.initialClimb',
}

// The ground slabs and the painted centreline strips carry no game_id and are not part of
// the required-node list, but the runtime orders them by name to break their authored
// coplanarity, so the contract pins them too.
const GROUND_ONLY_NODES = [
  ...DC9_MEMPHIS_GROUND_NODES.filter((name) => !DC9_MEMPHIS_REQUIRED_NODES.includes(name)),
  'KMEM_CENTERLINE_01',
]

function validFixture() {
  const nodes = [...DC9_MEMPHIS_REQUIRED_NODES, ...GROUND_ONLY_NODES].map((name, index) => ({
    name,
    translation: [index, index * 2, index * 3],
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
    ...(GAME_IDS[name] ? { extras: { game_id: GAME_IDS[name], node_role: 'cue' } } : {}),
  }))
  nodes.find((node) => node.name === 'KMEM_CONCOURSE_B').mesh = 0
  nodes.find((node) => node.name === 'KMEM_RAMP').mesh = 1
  nodes.find((node) => node.name === 'KMEM_TAXI_SURFACE').mesh = 2
  nodes.find((node) => node.name === 'KMEM_RUNWAY_SURFACE').mesh = 3

  return {
    asset: { version: '2.0' },
    nodes,
    meshes: [0, 1, 2, 3].map((index) => ({
      primitives: [{ indices: index, attributes: { POSITION: index + 4 }, material: index }],
    })),
    accessors: [
      { count: 600 },
      { count: 300 },
      { count: 300 },
      { count: 300 },
      { count: 200 },
      { count: 100 },
      { count: 100 },
      { count: 100 },
    ],
    materials: [
      { name: 'KMEM_TERMINAL' },
      { name: 'KMEM_RAMP_MATERIAL' },
      { name: 'KMEM_TAXI_MATERIAL' },
      { name: 'KMEM_RUNWAY_MATERIAL' },
    ],
    textures: [{ source: 0 }, { source: 1 }, { source: 2 }],
    images: [
      { name: 'KMEMterminal', extras: { width: 2048, height: 1024 } },
      { name: 'KMEMterminal_NML', extras: { width: 2048, height: 1024 } },
      { name: 'KMEMterminal_LIT', extras: { width: 2048, height: 1024 } },
    ],
  }
}

test('accepts the bounded Memphis environment contract', () => {
  assert.deepEqual(validateDc9MemphisModelContract(validFixture(), 2 * 1024 * 1024), [])
})

test('requires exactly one of every stable runtime node and exact anchor game IDs', () => {
  const fixture = validFixture()
  fixture.nodes.push({ ...fixture.nodes[0] })
  fixture.nodes.find((node) => node.name === 'KMEM_HOLD_SHORT').extras.game_id = 'changed'

  const errors = validateDc9MemphisModelContract(fixture, 2 * 1024 * 1024)
  assert.ok(errors.some((error) => error.includes('exactly one KMEM_LEGACY_ROOT')))
  assert.ok(errors.some((error) => error.includes('KMEM_HOLD_SHORT') && error.includes('dc9.memphis.holdShort')))
})

test('rejects non-finite transforms, cockpit interaction metadata, and excluded library names', () => {
  const fixture = validFixture()
  fixture.nodes.find((node) => node.name === 'KMEM_RAMP').translation[0] = Number.NaN
  fixture.nodes.find((node) => node.name === 'KMEM_TAXI_SURFACE').extras = { interaction: 'toggle' }
  fixture.nodes.push({ name: 'AutoGate_Jetway' }, { name: 'OpenSceneryX_Lamp' }, { name: 'Planes_DC9' })

  const errors = validateDc9MemphisModelContract(fixture, 2 * 1024 * 1024)
  assert.ok(errors.some((error) => error.includes('finite transform')))
  assert.ok(errors.some((error) => error.includes('interactive cockpit metadata')))
  assert.ok(errors.some((error) => error.includes('AutoGate/OpenSceneryX/Planes')))
})

test('scans every non-node named and extras-bearing glTF collection', () => {
  for (const collection of ['meshes', 'materials', 'images', 'textures', 'scenes', 'accessors', 'cameras', 'animations', 'samplers']) {
    const fixture = validFixture()
    fixture[collection] ??= []
    fixture[collection].push({
      name: `AutoGate_${collection}`,
      extras: { interaction: 'toggle' },
    })
    const errors = validateDc9MemphisModelContract(fixture, 2 * 1024 * 1024)
    assert.ok(errors.some((error) => error.includes('interactive cockpit metadata')), collection)
    assert.ok(errors.some((error) => error.includes('AutoGate/OpenSceneryX/Planes')), collection)
  }
})

test('enforces triangle, material, selected-texture, and byte budgets', () => {
  const fixture = validFixture()
  fixture.accessors[0].count = 15_003
  fixture.materials.push(
    { name: 'EXTRA_1' },
    { name: 'EXTRA_2' },
    { name: 'EXTRA_3' },
    { name: 'EXTRA_4' },
    { name: 'EXTRA_5' },
  )
  fixture.images[0].extras.width = 4096

  const errors = validateDc9MemphisModelContract(fixture, 8 * 1024 * 1024 + 1)
  assert.ok(errors.some((error) => error.includes('5,000 triangles')))
  assert.ok(errors.some((error) => error.includes('eight materials')))
  assert.ok(errors.some((error) => error.includes('2048x1024')))
  assert.ok(errors.some((error) => error.includes('8 MiB')))
})
