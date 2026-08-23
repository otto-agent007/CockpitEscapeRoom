import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  DC9_FLIGHT_CONTROL_BINDINGS,
  DC9_FLIGHT_CONTROL_JOINTS,
  DC9_INSTRUMENTS,
  DC9_INSTRUMENT_BINDINGS,
  DC9_INSTRUMENT_JOINTS,
  type Dc9Joint,
} from '../game/dc9FlightDeck'
import {
  DC9_SELF_TEST_MAX_STEP_SECONDS,
  advanceDc9SelfTests,
  applyDc9JointValue,
  buildDc9JointHandles,
  createDc9GaugeTargets,
  dc9SelfTestChannelValues,
  dc9YokeDemandFromDrag,
  DC9_KEY_NODES,
  DC9_KEY_YAW_CORRECTION,
  applyDc9KeyYawCorrection,
  DC9_OVERHEAD_HITBOX_EDGE_METRES,
  DC9_OVERHEAD_HITBOX_NODES,
  separateDc9OverheadHitboxes,
  type Dc9ActiveSelfTest,
} from './dc9FlightDeckVisuals'

/**
 * Stand-in for the shipped cockpit: the donor bakes geometry in world space under
 * translation-only parents, so a mesh at the origin of an offset parent reproduces the
 * real conditions the pivot builder has to cope with.
 */
function fakeCockpit(nodeNames: readonly string[], parentOffset = new THREE.Vector3()): THREE.Object3D {
  const root = new THREE.Object3D()
  root.name = 'DC9_ROOT'
  const holder = new THREE.Object3D()
  holder.name = 'DC9_STATIC'
  holder.position.copy(parentOffset)
  root.add(holder)
  for (const name of nodeNames) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01))
    mesh.name = name
    holder.add(mesh)
  }
  root.updateMatrixWorld(true)
  return root
}

function jointById(id: string): Dc9Joint {
  const joint = [...DC9_FLIGHT_CONTROL_JOINTS, ...DC9_INSTRUMENT_JOINTS].find((entry) => entry.id === id)
  if (!joint) throw new Error(`unknown joint ${id}`)
  return joint
}

/** Where a point ends up after rotating `degrees` about the donor pivot and axis. */
function expectedWorldPoint(joint: Dc9Joint, point: THREE.Vector3, degrees: number): THREE.Vector3 {
  const pivot = new THREE.Vector3(joint.pivot[0], joint.pivot[1], joint.pivot[2])
  const axis = new THREE.Vector3(joint.axis[0], joint.axis[1], joint.axis[2])
  return point.clone()
    .sub(pivot)
    .applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees)))
    .add(pivot)
}

describe('buildDc9JointHandles', () => {
  it('builds one handle per bound node and joint', () => {
    const root = fakeCockpit(DC9_FLIGHT_CONTROL_BINDINGS.map((binding) => binding.node))
    const handles = buildDc9JointHandles(root, DC9_FLIGHT_CONTROL_JOINTS, DC9_FLIGHT_CONTROL_BINDINGS)
    const expected = DC9_FLIGHT_CONTROL_BINDINGS.reduce((total, binding) => total + binding.joints.length, 0)
    expect(handles).toHaveLength(expected)
  })

  it('leaves the cockpit exactly where it was until a joint is driven', () => {
    const root = fakeCockpit(['OBJ8_DC9VC2_RANGE_014'])
    const node = root.getObjectByName('OBJ8_DC9VC2_RANGE_014')
    if (!node) throw new Error('missing node')
    const before = node.getWorldPosition(new THREE.Vector3())
    buildDc9JointHandles(root, DC9_FLIGHT_CONTROL_JOINTS, [
      { node: 'OBJ8_DC9VC2_RANGE_014', joints: ['foYokePitch'] },
    ])
    root.updateMatrixWorld(true)
    expect(node.getWorldPosition(new THREE.Vector3()).distanceTo(before)).toBeCloseTo(0, 9)
  })

  it('rotates the yoke about the donor pivot, not the mesh origin', () => {
    const root = fakeCockpit(['OBJ8_DC9VC2_RANGE_014'])
    const node = root.getObjectByName('OBJ8_DC9VC2_RANGE_014')
    if (!node) throw new Error('missing node')
    const origin = node.getWorldPosition(new THREE.Vector3())
    const handles = buildDc9JointHandles(root, DC9_FLIGHT_CONTROL_JOINTS, [
      { node: 'OBJ8_DC9VC2_RANGE_014', joints: ['foYokePitch'] },
    ])
    const handle = handles[0]
    if (!handle) throw new Error('missing handle')

    applyDc9JointValue(handle, 1)
    root.updateMatrixWorld(true)
    const pulled = node.getWorldPosition(new THREE.Vector3())
    // Ratio +1 is +15 deg in donor terms, and the GLB is baked at ratio 0 (+2.5 deg).
    expect(pulled.distanceTo(expectedWorldPoint(jointById('foYokePitch'), origin, 12.5))).toBeCloseTo(0, 6)

    applyDc9JointValue(handle, 0)
    root.updateMatrixWorld(true)
    expect(node.getWorldPosition(new THREE.Vector3()).distanceTo(origin)).toBeCloseTo(0, 9)
  })

  it('survives a parent that carries its own offset', () => {
    const offset = new THREE.Vector3(1.5, -0.25, 4)
    const root = fakeCockpit(['OBJ8_DC9VC2_RANGE_014'], offset)
    const node = root.getObjectByName('OBJ8_DC9VC2_RANGE_014')
    if (!node) throw new Error('missing node')
    const origin = node.getWorldPosition(new THREE.Vector3())
    const handles = buildDc9JointHandles(root, DC9_FLIGHT_CONTROL_JOINTS, [
      { node: 'OBJ8_DC9VC2_RANGE_014', joints: ['foYokePitch'] },
    ])
    const handle = handles[0]
    if (!handle) throw new Error('missing handle')
    applyDc9JointValue(handle, 1)
    root.updateMatrixWorld(true)
    expect(node.getWorldPosition(new THREE.Vector3())
      .distanceTo(expectedWorldPoint(jointById('foYokePitch'), origin, 12.5))).toBeCloseTo(0, 6)
  })

  it('nests the wheel inside the column so roll rides on pitch', () => {
    const root = fakeCockpit(['OBJ8_DC9VC2_RANGE_015'])
    const node = root.getObjectByName('OBJ8_DC9VC2_RANGE_015')
    if (!node) throw new Error('missing node')
    const handles = buildDc9JointHandles(root, DC9_FLIGHT_CONTROL_JOINTS, [
      { node: 'OBJ8_DC9VC2_RANGE_015', joints: ['foYokePitch', 'foYokeRoll'] },
    ])
    expect(handles.map((handle) => handle.jointId)).toEqual(['foYokePitch', 'foYokeRoll'])
    const [pitch, roll] = handles
    if (!pitch || !roll) throw new Error('missing handles')
    // Outermost joint first: the roll group must sit inside the pitch group.
    expect(roll.group.parent).toBe(pitch.group)
    expect(node.parent).toBe(roll.group)
  })

  it('slides the rudder pedals along the donor axis without rotating them', () => {
    const root = fakeCockpit(['OBJ8_DC9VC2_RANGE_017'])
    const node = root.getObjectByName('OBJ8_DC9VC2_RANGE_017')
    if (!node) throw new Error('missing node')
    const origin = node.getWorldPosition(new THREE.Vector3())
    const handles = buildDc9JointHandles(root, DC9_FLIGHT_CONTROL_JOINTS, [
      { node: 'OBJ8_DC9VC2_RANGE_017', joints: ['pedalFoLeft'] },
    ])
    const handle = handles[0]
    if (!handle) throw new Error('missing handle')
    // The donor table runs -1 -> 0 m and +1 -> 0.160003 m, and the GLB is baked at
    // ratio 0, so the pedal sits at mid-travel and moves +/-0.08 m either way.
    applyDc9JointValue(handle, 1)
    root.updateMatrixWorld(true)
    const right = node.getWorldPosition(new THREE.Vector3())
    expect(right.z - origin.z).toBeCloseTo(0.0800015, 6)
    expect(right.x - origin.x).toBeCloseTo(0, 9)

    applyDc9JointValue(handle, -1)
    root.updateMatrixWorld(true)
    const left = node.getWorldPosition(new THREE.Vector3())
    expect(left.z - origin.z).toBeCloseTo(-0.0800015, 6)
    expect(right.z - left.z).toBeCloseTo(0.160003, 6)
    expect(handle.group.quaternion.equals(new THREE.Quaternion())).toBe(true)
  })

  it('turns the airspeed needle by the calibrated donor angle', () => {
    const root = fakeCockpit(['OBJ8_DC9-32_COCKPIT_RANGE_151'])
    const node = root.getObjectByName('OBJ8_DC9-32_COCKPIT_RANGE_151')
    if (!node) throw new Error('missing node')
    const origin = node.getWorldPosition(new THREE.Vector3())
    const handles = buildDc9JointHandles(root, DC9_INSTRUMENT_JOINTS, [
      { node: 'OBJ8_DC9-32_COCKPIT_RANGE_151', joints: ['airspeedNeedle'] },
    ])
    const handle = handles[0]
    if (!handle) throw new Error('missing handle')
    applyDc9JointValue(handle, 250)
    root.updateMatrixWorld(true)
    expect(node.getWorldPosition(new THREE.Vector3())
      .distanceTo(expectedWorldPoint(jointById('airspeedNeedle'), origin, 232.75 - 15.35))).toBeCloseTo(0, 6)
  })

  it('skips nodes the asset no longer provides instead of throwing', () => {
    const root = fakeCockpit([])
    expect(buildDc9JointHandles(root, DC9_INSTRUMENT_JOINTS, DC9_INSTRUMENT_BINDINGS)).toEqual([])
  })
})

describe('self-test sweeps', () => {
  it('reports a value for every channel of a running sweep', () => {
    const values = dc9SelfTestChannelValues([{ instrument: 'attitude', elapsedSeconds: 0.65 }])
    expect(values.attitudeRollDeg).toBeGreaterThan(0)
    expect(values.attitudePitchDeg).toBeGreaterThan(0)
    expect(values.airspeedKt).toBeUndefined()
  })

  it('retires a sweep once it has run its length', () => {
    let active: Dc9ActiveSelfTest[] = [{ instrument: 'verticalSpeed', elapsedSeconds: 0 }]
    for (let frame = 0; frame < 21; frame += 1) active = advanceDc9SelfTests(active, 0.1)
    expect(active).toHaveLength(1)
    for (let frame = 0; frame < 4; frame += 1) active = advanceDc9SelfTests(active, 0.1)
    expect(active).toHaveLength(0)
  })

  it('never lets one stalled frame swallow a whole sweep', () => {
    const started = [{ instrument: 'verticalSpeed' as const, elapsedSeconds: 0 }]
    // A five-second frame must still leave the sweep running and barely advanced.
    const afterStall = advanceDc9SelfTests(started, 5)
    expect(afterStall).toHaveLength(1)
    expect(afterStall[0]?.elapsedSeconds).toBe(DC9_SELF_TEST_MAX_STEP_SECONDS)
    expect(advanceDc9SelfTests(started, Number.NaN)[0]?.elapsedSeconds).toBe(0)
  })

  it('runs several gauges at once without them clobbering each other', () => {
    const values = dc9SelfTestChannelValues([
      { instrument: 'airspeed', elapsedSeconds: 1.2 },
      { instrument: 'epr', elapsedSeconds: 1.2 },
    ])
    expect(values.airspeedKt).toBeCloseTo(250, 3)
    expect(values.eprRatio).toBeCloseTo(2, 3)
  })
})

describe('dc9YokeDemandFromDrag', () => {
  it('pulls the column aft when dragged down and rolls the wheel sideways', () => {
    const demand = dc9YokeDemandFromDrag(60, 90, 1440, 900)
    expect(demand.pitch).toBeGreaterThan(0)
    expect(demand.roll).toBeGreaterThan(0)
  })

  it('reaches the stops and never exceeds them', () => {
    expect(dc9YokeDemandFromDrag(0, 5000, 1440, 900).pitch).toBe(1)
    expect(dc9YokeDemandFromDrag(-5000, 0, 1440, 900).roll).toBe(-1)
  })

  it('tolerates a zero-sized or broken canvas', () => {
    expect(dc9YokeDemandFromDrag(10, 10, 0, 0).pitch).toBe(1)
    expect(dc9YokeDemandFromDrag(Number.NaN, Number.NaN, 1440, 900)).toEqual({ pitch: 0, roll: 0 })
  })
})

describe('createDc9GaugeTargets', () => {
  it('places one invisible, contract-shaped collider per gauge', () => {
    const root = new THREE.Object3D()
    const targets = createDc9GaugeTargets(root)
    expect(targets.size).toBe(Object.keys(DC9_INSTRUMENTS).length)
    root.updateMatrixWorld(true)
    for (const instrument of Object.values(DC9_INSTRUMENTS)) {
      const target = targets.get(`dc9.gauge.${instrument.id}`)
      if (!target) throw new Error(`missing target for ${instrument.id}`)
      expect(target.userData.collider_only).toBe(true)
      expect(target.userData.collider_target_game_id).toBe(`dc9.gauge.${instrument.id}`)
      expect(target.visible).toBe(false)
      const centre = new THREE.Vector3(...instrument.center)
      expect(target.getWorldPosition(new THREE.Vector3()).distanceTo(centre)).toBeCloseTo(0, 9)
    }
  })

  it('replaces its own group rather than stacking duplicates on a reload', () => {
    const root = new THREE.Object3D()
    createDc9GaugeTargets(root)
    createDc9GaugeTargets(root)
    expect(root.children.filter((child) => child.name === 'DC9_RUNTIME_GAUGE_TARGETS')).toHaveLength(1)
  })
})

describe('separateDc9OverheadHitboxes', () => {
  /** Reproduces the shipped overhead colliders: boxes far larger than their spacing. */
  function overheadCockpit(): THREE.Object3D {
    const root = new THREE.Object3D()
    const shipped: [string, [number, number, number], [number, number, number]][] = [
      ['DC9_HITBOX_APUBUSES', [-0.189, 1.035, 2.835], [0.46, 0.24, 0.22]],
      ['DC9_HITBOX_APUMASTER', [-0.026, 1.003, 2.774], [0.26, 0.24, 0.22]],
      ['DC9_HITBOX_BATTERY', [0.019, 0.979, 2.725], [0.26, 0.24, 0.22]],
    ]
    for (const [name, centre, size] of shipped) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size))
      mesh.name = name
      mesh.position.set(...centre)
      root.add(mesh)
    }
    root.updateMatrixWorld(true)
    return root
  }

  function boxes(root: THREE.Object3D): THREE.Box3[] {
    root.updateMatrixWorld(true)
    return DC9_OVERHEAD_HITBOX_NODES.map((name) => {
      const node = root.getObjectByName(name)
      if (!node) throw new Error(`missing ${name}`)
      return new THREE.Box3().setFromObject(node)
    })
  }

  it('starts from genuinely overlapping colliders', () => {
    const [apuBuses, apuMaster, battery] = boxes(overheadCockpit())
    if (!apuBuses || !apuMaster || !battery) throw new Error('missing boxes')
    expect(apuBuses.intersectsBox(apuMaster)).toBe(true)
    expect(apuMaster.intersectsBox(battery)).toBe(true)
  })

  it('leaves each switch its own hit volume', () => {
    const root = overheadCockpit()
    expect(separateDc9OverheadHitboxes(root)).toBe(3)
    const [apuBuses, apuMaster, battery] = boxes(root)
    if (!apuBuses || !apuMaster || !battery) throw new Error('missing boxes')
    expect(apuBuses.intersectsBox(apuMaster)).toBe(false)
    expect(apuMaster.intersectsBox(battery)).toBe(false)
    expect(apuBuses.intersectsBox(battery)).toBe(false)
  })

  it('keeps every collider centred on the switch the asset placed it over', () => {
    const before = boxes(overheadCockpit()).map((box) => box.getCenter(new THREE.Vector3()))
    const root = overheadCockpit()
    separateDc9OverheadHitboxes(root)
    boxes(root).forEach((box, index) => {
      const expected = before[index]
      if (!expected) throw new Error('missing centre')
      expect(box.getCenter(new THREE.Vector3()).distanceTo(expected)).toBeCloseTo(0, 9)
    })
  })

  it('keeps the volumes big enough to point at', () => {
    const root = overheadCockpit()
    separateDc9OverheadHitboxes(root)
    for (const box of boxes(root)) {
      const size = box.getSize(new THREE.Vector3())
      expect(Math.min(size.x, size.y, size.z)).toBeCloseTo(DC9_OVERHEAD_HITBOX_EDGE_METRES, 6)
    }
  })

  it('is safe to run twice and on a cockpit that lacks the nodes', () => {
    const root = overheadCockpit()
    separateDc9OverheadHitboxes(root)
    const after = boxes(root).map((box) => box.getSize(new THREE.Vector3()).x)
    expect(separateDc9OverheadHitboxes(root)).toBe(0)
    expect(boxes(root).map((box) => box.getSize(new THREE.Vector3()).x)).toEqual(after)
    expect(separateDc9OverheadHitboxes(new THREE.Object3D())).toBe(0)
  })
})

describe('applyDc9KeyYawCorrection', () => {
  function ledge(): THREE.Object3D {
    const root = new THREE.Object3D()
    for (const name of DC9_KEY_NODES) {
      const node = new THREE.Object3D()
      node.name = name
      // Both the prop and its collider are placed at the same point on the ledge.
      node.position.set(1.168, 0.122, 3.012)
      root.add(node)
    }
    // The prop's mesh runs along local X, which is what the quarter turn swings to Z.
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.033, 0.084))
    mesh.name = 'DC9_PROP_CAPTAINS_KEY_MESH'
    root.getObjectByName('DC9_PROP_CAPTAINS_KEY')?.add(mesh)
    root.updateMatrixWorld(true)
    return root
  }

  it('swings the key a quarter turn about the vertical axis without moving it', () => {
    const root = ledge()
    expect(applyDc9KeyYawCorrection(root)).toBe(DC9_KEY_NODES.length)
    for (const name of DC9_KEY_NODES) {
      const node = root.getObjectByName(name)
      if (!node) throw new Error(`missing ${name}`)
      expect(node.getWorldPosition(new THREE.Vector3()).toArray()).toEqual([1.168, 0.122, 3.012])
      expect(node.rotation.y).toBeCloseTo(DC9_KEY_YAW_CORRECTION, 9)
      expect(node.rotation.x).toBeCloseTo(0, 9)
      expect(node.rotation.z).toBeCloseTo(0, 9)
    }
  })

  it('turns the long axis of the key from lateral to fore-and-aft', () => {
    const root = ledge()
    const before = new THREE.Box3().setFromObject(root.getObjectByName('DC9_PROP_CAPTAINS_KEY')!).getSize(new THREE.Vector3())
    expect(before.x).toBeGreaterThan(before.z)
    applyDc9KeyYawCorrection(root)
    const after = new THREE.Box3().setFromObject(root.getObjectByName('DC9_PROP_CAPTAINS_KEY')!).getSize(new THREE.Vector3())
    expect(after.z).toBeGreaterThan(after.x)
    // A yaw cannot stand the key up: it stays as flat on the ledge as it started.
    expect(after.y).toBeCloseTo(before.y, 6)
  })

  it('keeps the collider on the key', () => {
    const root = ledge()
    applyDc9KeyYawCorrection(root)
    const prop = root.getObjectByName('DC9_PROP_CAPTAINS_KEY')
    const collider = root.getObjectByName('DC9_HITBOX_CAPTAINS_KEY')
    if (!prop || !collider) throw new Error('missing key nodes')
    expect(collider.quaternion.angleTo(prop.quaternion)).toBeCloseTo(0, 9)
  })

  it('is safe to run twice and on a cockpit that lacks the nodes', () => {
    const root = ledge()
    applyDc9KeyYawCorrection(root)
    expect(applyDc9KeyYawCorrection(root)).toBe(0)
    expect(root.getObjectByName('DC9_PROP_CAPTAINS_KEY')?.rotation.y).toBeCloseTo(DC9_KEY_YAW_CORRECTION, 9)
    expect(applyDc9KeyYawCorrection(new THREE.Object3D())).toBe(0)
  })
})
