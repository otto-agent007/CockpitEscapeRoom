/**
 * Asset-side guard for the DC-9 right-seat flight deck.
 *
 * `src/game/dc9FlightDeck.ts` animates donor draw-range nodes directly, using pivots
 * measured from the cleared OBJ8 source and expressed in glTF space. That only stays
 * correct while the GLB keeps those nodes, keeps them free of rotation and scale, and
 * keeps each instrument where it was measured. This module re-checks all three against
 * the real asset; `src/game/dc9FlightDeckContract.test.ts` checks that the values here
 * still match the runtime module.
 */

export const DC9_FLIGHT_DECK_CONTROL_NODES = [
  'OBJ8_DC9VC2_RANGE_014',
  'OBJ8_DC9VC2_RANGE_015',
  'OBJ8_DC9VC2_RANGE_012',
  'OBJ8_DC9VC2_RANGE_013',
  'OBJ8_DC9VC2_RANGE_009',
  'OBJ8_DC9VC2_RANGE_010',
  'OBJ8_DC9VC2_RANGE_006',
  'OBJ8_DC9VC2_RANGE_007',
  'OBJ8_DC9VC2_RANGE_008',
  'OBJ8_DC9VC2_RANGE_017',
  'OBJ8_DC9VC2_RANGE_018',
  'OBJ8_DC9VC2_RANGE_020',
  'OBJ8_DC9VC2_RANGE_021',
]

export const DC9_FLIGHT_DECK_INSTRUMENT_NODES = [
  'OBJ8_DC9-32_COCKPIT_RANGE_151',
  'OBJ8_DC9-32_COCKPIT_RANGE_129',
  'OBJ8_DC9-32_COCKPIT_RANGE_131',
  'OBJ8_DC9-32_COCKPIT_RANGE_166',
  'OBJ8_DC9-32_COCKPIT_RANGE_164',
  'OBJ8_DC9-32_COCKPIT_RANGE_108',
  'OBJ8_DC9-32_COCKPIT_RANGE_109',
  'OBJ8_DC9-32_COCKPIT_RANGE_099',
  'OBJ8_DC9-32_COCKPIT_RANGE_037',
  'OBJ8_DC9-32_COCKPIT_RANGE_055',
]

export const DC9_FLIGHT_DECK_REQUIRED_NODES = [
  ...DC9_FLIGHT_DECK_CONTROL_NODES,
  ...DC9_FLIGHT_DECK_INSTRUMENT_NODES,
]

/**
 * Declared instrument hit spheres, and the needle nodes each one covers. The measured
 * centre must sit inside its own hit sphere of the geometry it labels, otherwise the
 * click target has drifted off the gauge.
 */
export const DC9_FLIGHT_DECK_INSTRUMENTS = [
  {
    id: 'airspeed',
    center: [0.368331, 0.333986, 2.346],
    radius: 0.038,
    nodes: ['OBJ8_DC9-32_COCKPIT_RANGE_151'],
  },
  {
    id: 'attitude',
    center: [0.473, 0.356, 2.276],
    radius: 0.062,
    nodes: ['OBJ8_DC9-32_COCKPIT_RANGE_129', 'OBJ8_DC9-32_COCKPIT_RANGE_131'],
  },
  {
    id: 'altimeter',
    center: [0.579689, 0.3381, 2.372499],
    radius: 0.038,
    // The counter drum (RANGE_164) is a cylinder mounted behind the dial and rotating
    // about the lateral axis, so its bounds run 66mm deeper than the face. Only the
    // pointer defines where a player actually clicks.
    nodes: ['OBJ8_DC9-32_COCKPIT_RANGE_166'],
  },
  {
    id: 'heading',
    center: [0.473608, 0.253793, 2.378965],
    radius: 0.045,
    nodes: ['OBJ8_DC9-32_COCKPIT_RANGE_108', 'OBJ8_DC9-32_COCKPIT_RANGE_109'],
  },
  {
    id: 'verticalSpeed',
    center: [0.665776, 0.337112, 2.368714],
    radius: 0.038,
    nodes: ['OBJ8_DC9-32_COCKPIT_RANGE_099'],
  },
  {
    id: 'epr',
    center: [0.001569, 0.426916, 2.334151],
    radius: 0.055,
    nodes: ['OBJ8_DC9-32_COCKPIT_RANGE_037', 'OBJ8_DC9-32_COCKPIT_RANGE_055'],
  },
]

function buildParentIndex(nodes) {
  const parent = new Map()
  nodes.forEach((node, index) => {
    for (const child of node.children ?? []) parent.set(child, index)
  })
  return parent
}

/** Accumulated translation of a node, valid only while no ancestor rotates or scales. */
function worldTranslation(nodes, parent, index) {
  const offset = [0, 0, 0]
  for (let cursor = index; cursor !== undefined; cursor = parent.get(cursor)) {
    const translation = nodes[cursor].translation ?? [0, 0, 0]
    for (let axis = 0; axis < 3; axis += 1) offset[axis] += translation[axis] ?? 0
  }
  return offset
}

function nodeBounds(json, nodes, parent, index) {
  const mesh = json.meshes?.[nodes[index].mesh]
  if (!mesh) return null
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const primitive of mesh.primitives ?? []) {
    const accessor = json.accessors?.[primitive.attributes?.POSITION]
    if (!Array.isArray(accessor?.min) || !Array.isArray(accessor?.max)) return null
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], accessor.min[axis])
      max[axis] = Math.max(max[axis], accessor.max[axis])
    }
  }
  if (!min.every(Number.isFinite) || !max.every(Number.isFinite)) return null
  const offset = worldTranslation(nodes, parent, index)
  return {
    min: min.map((value, axis) => value + offset[axis]),
    max: max.map((value, axis) => value + offset[axis]),
  }
}

export function validateDc9FlightDeckContract(json) {
  const errors = []
  const nodes = json?.nodes ?? []
  const parent = buildParentIndex(nodes)
  const indexByName = new Map(nodes.map((node, index) => [node.name, index]))

  const missing = DC9_FLIGHT_DECK_REQUIRED_NODES.filter((name) => !indexByName.has(name))
  if (missing.length > 0) {
    errors.push(`DC-9 flight-deck contract is missing required nodes: ${missing.join(', ')}.`)
    return errors
  }

  // Runtime pivots are applied as plain translations up the parent chain, so a rotated
  // or scaled ancestor would silently move the yoke about the wrong point.
  for (const name of DC9_FLIGHT_DECK_REQUIRED_NODES) {
    for (let cursor = indexByName.get(name); cursor !== undefined; cursor = parent.get(cursor)) {
      const node = nodes[cursor]
      if (node.rotation || node.scale || node.matrix) {
        errors.push(
          `DC-9 flight-deck node ${name} has ancestor ${node.name} carrying a rotation, scale or matrix; runtime pivots assume translation-only chains.`,
        )
        break
      }
    }
  }

  for (const instrument of DC9_FLIGHT_DECK_INSTRUMENTS) {
    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]
    let measured = false
    for (const name of instrument.nodes) {
      const bounds = nodeBounds(json, nodes, parent, indexByName.get(name))
      if (!bounds) {
        errors.push(`DC-9 instrument ${instrument.id} node ${name} has no readable position bounds.`)
        continue
      }
      measured = true
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], bounds.min[axis])
        max[axis] = Math.max(max[axis], bounds.max[axis])
      }
    }
    if (!measured) continue
    const center = min.map((value, axis) => (value + max[axis]) / 2)
    const drift = Math.hypot(
      center[0] - instrument.center[0],
      center[1] - instrument.center[1],
      center[2] - instrument.center[2],
    )
    if (drift > instrument.radius) {
      errors.push(
        `DC-9 instrument ${instrument.id} click target is ${drift.toFixed(4)}m from its geometry centre `
        + `${JSON.stringify(center.map((value) => Number(value.toFixed(6))))}, beyond its ${instrument.radius}m radius.`,
      )
    }
  }

  for (let a = 0; a < DC9_FLIGHT_DECK_INSTRUMENTS.length; a += 1) {
    for (let b = a + 1; b < DC9_FLIGHT_DECK_INSTRUMENTS.length; b += 1) {
      const first = DC9_FLIGHT_DECK_INSTRUMENTS[a]
      const second = DC9_FLIGHT_DECK_INSTRUMENTS[b]
      const distance = Math.hypot(
        first.center[0] - second.center[0],
        first.center[1] - second.center[1],
        first.center[2] - second.center[2],
      )
      if (distance <= first.radius + second.radius) {
        errors.push(`DC-9 instrument hit spheres ${first.id} and ${second.id} overlap.`)
      }
    }
  }

  return errors
}
