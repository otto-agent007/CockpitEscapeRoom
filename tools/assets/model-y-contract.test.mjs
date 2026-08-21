import { describe, expect, it } from 'vitest'
import { validateModelYContract } from './model-y-contract.mjs'

const SOURCE_SHA256 = 'd88769d9c66bdeca46bf239c9baa2a295afc82ffb24005733d9374b9c7782bee'
const HANGAR_SOURCE_SHA256 = '8ec631f27e40f6f1f3ac3448c96374c315a4874f2c8e4bdbe307f284fdf6e1fe'

function validFixture() {
  const requiredNames = [
    'TESLA_ROOT',
    'TESLA_HANGAR',
    'TESLA_HANGAR_SOURCE_SHELL',
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
  const flightPanelNames = [
    'TESLA_WING_LEFT_PIVOT_PANEL',
    'TESLA_WING_RIGHT_PIVOT_PANEL',
    'TESLA_STABILIZER_LEFT_PIVOT_PANEL',
    'TESLA_STABILIZER_RIGHT_PIVOT_PANEL',
  ]
  const nodes = [...requiredNames, ...flightPanelNames].map((name) => ({ name }))
  nodes.find((node) => node.name === 'TESLA_VEHICLE').extras = { game_id: 'reward.modelY' }
  nodes.find((node) => node.name === 'TESLA_HANGAR').extras = {
    source_url: 'https://sketchfab.com/3d-models/hangar-64f7d287f5274029bc29755a9839ebbf',
    creator: 'nermin',
    license: 'CC BY 4.0',
  }
  nodes.find((node) => node.name === 'TESLA_FLIGHT_MODE_ROOT').extras = {
    game_id: 'reward.flightMode',
    interaction: 'animation',
  }
  nodes.find((node) => node.name === 'TESLA_MODEL_Y_BODY').mesh = 0
  nodes.find((node) => node.name === 'TESLA_HANGAR_SOURCE_SHELL').mesh = 1
  flightPanelNames.forEach((name, index) => {
    nodes.find((node) => node.name === name).mesh = index + 2
  })

  return {
    json: {
      nodes,
      meshes: [
        {
          primitives: [
            {
              indices: 0,
              attributes: { POSITION: 1, NORMAL: 2, TANGENT: 3, TEXCOORD_0: 4 },
              material: 0,
            },
          ],
        },
        { primitives: [{ indices: 5, attributes: { POSITION: 6 }, material: 1 }] },
        { primitives: [{ attributes: { POSITION: 8 }, material: 2 }] },
        { primitives: [{ attributes: { POSITION: 8 }, material: 2 }] },
        { primitives: [{ attributes: { POSITION: 8 }, material: 2 }] },
        { primitives: [{ attributes: { POSITION: 8 }, material: 2 }] },
      ],
      accessors: [
        { count: 540_000 },
        { count: 180_000 },
        { count: 180_000 },
        { count: 180_000 },
        { count: 180_000 },
        { count: 60_000 },
        { count: 20_000 },
        { count: 3, max: [11.5] },
        { count: 3 },
      ],
      materials: [
        { name: 'MAT_MODEL_Y' },
        { name: 'MAT_HANGAR' },
        {
          name: 'MAT_TESLA_FLIGHT_RED',
          pbrMetallicRoughness: { baseColorFactor: [0.42, 0.025, 0.035, 1] },
        },
      ],
      animations: [
        {
          name: 'TESLA_FLIGHT_MODE_REVEAL',
          samplers: [{ input: 7, output: 1 }],
          channels: [{ sampler: 0, target: { node: 7, path: 'translation' } }],
        },
      ],
    },
    byteLength: 20 * 1024 * 1024,
    intakeReport: {
      sourceSha256: SOURCE_SHA256,
      sourceTriangleCount: 480_305,
      runtimeVehicleTriangleCount: 180_000,
      runtimeTotalTriangleCount: 200_004,
      runtimeMaterialCount: 3,
      runtimeDrawCallCount: 6,
      hangarSourceSha256: HANGAR_SOURCE_SHA256,
      runtimeHangarTriangleCount: 20_000,
      sourceTextureGatePassed: true,
      sourceTextures: [
        { role: 'baseColor', dimensions: [4096, 4096] },
        { role: 'normal', dimensions: [4096, 4096] },
        { role: 'metallicRoughness', dimensions: [4096, 4096] },
      ],
      runtimeTextures: [
        { role: 'baseColor', dimensions: [2048, 2048] },
        { role: 'normal', dimensions: [2048, 2048] },
        { role: 'metallicRoughness', dimensions: [2048, 2048] },
      ],
    },
  }
}

describe('Model Y deployable contract', () => {
  it('accepts the approved hierarchy, animation, source gate, and runtime budgets', () => {
    expect(validateModelYContract(validFixture())).toEqual([])
  })

  it('rejects a body without tangents and an incomplete source texture set', () => {
    const fixture = validFixture()
    delete fixture.json.meshes[0].primitives[0].attributes.TANGENT
    fixture.intakeReport.sourceTextures = fixture.intakeReport.sourceTextures.slice(0, 2)

    expect(validateModelYContract(fixture)).toEqual(expect.arrayContaining([
      'TESLA_MODEL_Y_BODY must export tangent data.',
      'Model Y source must contain wired 4096x4096 BaseColor, normal, and metallic-roughness maps.',
    ]))
  })

  it('rejects a missing or mistimed Flight Mode animation', () => {
    const fixture = validFixture()
    fixture.json.accessors[7].max = [10.75]

    expect(validateModelYContract(fixture)).toContain(
      'TESLA_FLIGHT_MODE_REVEAL must be exactly 11.5 seconds; received 10.75.',
    )
  })

  it('rejects Flight Mode wing and stabilizer panels without a red-dominant finish', () => {
    const fixture = validFixture()
    fixture.json.materials[2].pbrMetallicRoughness.baseColorFactor = [0.16, 0.28, 0.38, 1]

    expect(validateModelYContract(fixture)).toContain(
      'Model Y wing and stabilizer panels must use the red-dominant MAT_TESLA_FLIGHT_RED finish.',
    )
  })

  it('rejects a hangar without the selected Sketchfab source provenance', () => {
    const fixture = validFixture()
    fixture.json.nodes.find((node) => node.name === 'TESLA_HANGAR').extras.creator = 'unknown'
    fixture.intakeReport.hangarSourceSha256 = 'unverified'

    expect(validateModelYContract(fixture)).toEqual(expect.arrayContaining([
      'TESLA_HANGAR must retain the approved nermin Sketchfab CC BY 4.0 provenance.',
      'Model Y intake report does not match the approved hangar source SHA-256.',
    ]))
  })

  it('rejects the removed decorative floor guide lines', () => {
    const fixture = validFixture()
    fixture.json.nodes.push({ name: 'TESLA_HANGAR_FLOOR_LINE_LEFT' })
    fixture.json.nodes.push({ name: 'TESLA_HANGAR_FLOOR_LINE_RIGHT' })

    expect(validateModelYContract(fixture)).toContain(
      'Model Y hangar must not include decorative floor guide lines.',
    )
  })
})
