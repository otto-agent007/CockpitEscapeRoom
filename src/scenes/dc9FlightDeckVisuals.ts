import * as THREE from 'three'
import {
  DC9_INSTRUMENTS,
  dc9SelfTestDuration,
  dc9SelfTestValue,
  resolveJointOffset,
  type Dc9DriveId,
  type Dc9InstrumentChannelId,
  type Dc9InstrumentId,
  type Dc9Joint,
  type Dc9NodeBinding,
} from '../game/dc9FlightDeck'

/** One runtime pivot group, ready to be driven each frame. */
export interface Dc9JointHandle {
  readonly jointId: string
  readonly drive: Dc9DriveId
  readonly kind: 'rotate' | 'translate'
  readonly joint: Dc9Joint
  readonly group: THREE.Object3D
  readonly axis: THREE.Vector3
  readonly basePosition: THREE.Vector3
}

/**
 * Wrap each bound mesh in the pivot groups its joints need.
 *
 * The shipped GLB bakes the yoke, levers, pedals and needles in place with no pivots of
 * their own, so the donor pivot is reconstructed here as a group inserted directly above
 * the mesh. Joints are listed outermost first, and each new group is inserted between the
 * mesh and its current parent, which reproduces the donor's transform order.
 */
export function buildDc9JointHandles(
  root: THREE.Object3D,
  joints: readonly Dc9Joint[],
  bindings: readonly Dc9NodeBinding[],
): Dc9JointHandle[] {
  const jointById = new Map(joints.map((joint) => [joint.id, joint]))
  const handles: Dc9JointHandle[] = []
  root.updateMatrixWorld(true)

  for (const binding of bindings) {
    const node = root.getObjectByName(binding.node)
    if (!node) continue
    for (const jointId of binding.joints) {
      const joint = jointById.get(jointId)
      const parent = node.parent
      if (!joint || !parent) continue
      const group = new THREE.Group()
      group.name = `DC9_RUNTIME_PIVOT_${binding.node}_${joint.id}`
      if (joint.kind === 'rotate') {
        const pivot = parent.worldToLocal(new THREE.Vector3(joint.pivot[0], joint.pivot[1], joint.pivot[2]))
        group.position.copy(pivot)
        parent.add(group)
        node.position.sub(pivot)
      } else {
        // Translation joints slide the whole group, so the mesh keeps its own transform.
        parent.add(group)
      }
      group.add(node)
      parent.updateMatrixWorld(true)
      handles.push({
        jointId: joint.id,
        drive: joint.drive,
        kind: joint.kind,
        joint,
        group,
        axis: new THREE.Vector3(joint.axis[0], joint.axis[1], joint.axis[2]),
        basePosition: group.position.clone(),
      })
    }
  }
  return handles
}

/** Apply one driven value to a joint handle. */
export function applyDc9JointValue(handle: Dc9JointHandle, value: number): void {
  const offset = resolveJointOffset(handle.joint, value)
  if (handle.kind === 'rotate') {
    handle.group.quaternion.setFromAxisAngle(handle.axis, THREE.MathUtils.degToRad(offset))
    return
  }
  handle.group.position.copy(handle.basePosition).addScaledVector(handle.axis, offset)
}

export interface Dc9ActiveSelfTest {
  instrument: Dc9InstrumentId
  elapsedSeconds: number
}

export type Dc9InstrumentChannelValues = Partial<Record<Dc9InstrumentChannelId, number>>

/**
 * Needle readings for every self-test currently running. Channels not mentioned stay at
 * their parked value, which is the pose the GLB already ships in.
 */
export function dc9SelfTestChannelValues(
  active: readonly Dc9ActiveSelfTest[],
): Dc9InstrumentChannelValues {
  const values: Dc9InstrumentChannelValues = {}
  for (const entry of active) {
    for (const sweep of DC9_INSTRUMENTS[entry.instrument].sweeps) {
      values[sweep.channel] = dc9SelfTestValue(sweep, entry.elapsedSeconds)
    }
  }
  return values
}

/**
 * Longest step a single frame may contribute to a sweep. A stalled frame - a tab
 * switch, a garbage-collection pause, or a slow machine rasterising this cockpit -
 * would otherwise consume the whole sweep before it could be seen, so a slow renderer
 * plays the self-test slowly rather than skipping it.
 */
export const DC9_SELF_TEST_MAX_STEP_SECONDS = 0.1

/** Drops self-tests that have finished their sweep. */
export function advanceDc9SelfTests(
  active: readonly Dc9ActiveSelfTest[],
  deltaSeconds: number,
): Dc9ActiveSelfTest[] {
  const step = Number.isFinite(deltaSeconds)
    ? Math.min(DC9_SELF_TEST_MAX_STEP_SECONDS, Math.max(0, deltaSeconds))
    : 0
  return active
    .map((entry) => ({ ...entry, elapsedSeconds: entry.elapsedSeconds + step }))
    .filter((entry) => entry.elapsedSeconds < dc9SelfTestDuration(DC9_INSTRUMENTS[entry.instrument]))
}

/** Pointer travel needed to reach a control stop, as a fraction of the canvas. */
const YOKE_DRAG_TRAVEL_FRACTION = 0.22

/**
 * Convert a drag on the yoke into a control demand. Dragging down and toward the seat
 * pulls the column aft; dragging sideways rolls the wheel that way.
 */
export function dc9YokeDemandFromDrag(
  deltaX: number,
  deltaY: number,
  width: number,
  height: number,
): { pitch: number; roll: number } {
  const horizontalTravel = Math.max(1, width * YOKE_DRAG_TRAVEL_FRACTION)
  const verticalTravel = Math.max(1, height * YOKE_DRAG_TRAVEL_FRACTION)
  return {
    pitch: THREE.MathUtils.clamp((Number.isFinite(deltaY) ? deltaY : 0) / verticalTravel, -1, 1),
    roll: THREE.MathUtils.clamp((Number.isFinite(deltaX) ? deltaX : 0) / horizontalTravel, -1, 1),
  }
}

const GAUGE_TARGET_GROUP = 'DC9_RUNTIME_GAUGE_TARGETS'

/**
 * Invisible click spheres over each first-officer gauge. The panel itself has no
 * per-instrument colliders, so the scan needs targets of its own; they share the
 * `collider_only` contract the rest of the DC-9 interaction registry uses.
 */
export function createDc9GaugeTargets(root: THREE.Object3D): Map<string, THREE.Object3D> {
  const existing = root.getObjectByName(GAUGE_TARGET_GROUP)
  if (existing) existing.removeFromParent()
  const group = new THREE.Group()
  group.name = GAUGE_TARGET_GROUP
  root.add(group)
  root.updateMatrixWorld(true)

  const targets = new Map<string, THREE.Object3D>()
  for (const instrument of Object.values(DC9_INSTRUMENTS)) {
    const gameId = `dc9.gauge.${instrument.id}`
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(instrument.radius, 12, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
    )
    mesh.name = `DC9_HITBOX_GAUGE_${instrument.id.toUpperCase()}`
    mesh.position.copy(group.worldToLocal(
      new THREE.Vector3(instrument.center[0], instrument.center[1], instrument.center[2]),
    ))
    mesh.frustumCulled = false
    mesh.castShadow = false
    mesh.receiveShadow = false
    mesh.visible = false
    mesh.userData.collider_only = true
    mesh.userData.collider_target_game_id = gameId
    mesh.userData.accessible_label = instrument.label
    group.add(mesh)
    targets.set(gameId, mesh)
  }
  return targets
}

/**
 * Overhead shutdown colliders, shrunk so each one covers its own switch.
 *
 * The donor build enlarged these hit volumes for easier pointing, but the three switches
 * sit only 70mm apart while the boxes are 240-460mm across, so they overlap heavily and a
 * ray aimed at one switch strikes whichever neighbour happens to be nearer the camera.
 * Clicking the APU buses -- the first required step -- reported "that step comes later"
 * because the battery box was in front of it. Each box is reduced to a volume that fits
 * between its neighbours, keeping its centre exactly where the asset put it.
 */
export const DC9_OVERHEAD_HITBOX_NODES = [
  'DC9_HITBOX_APUBUSES',
  'DC9_HITBOX_APUMASTER',
  'DC9_HITBOX_BATTERY',
] as const

/**
 * Boxes separate only when they clear each other on some axis, which is a tighter bound
 * than the 70.7mm centre-to-centre distance suggests: the APU master and battery pivots
 * differ by just 49mm on their widest axis. 42mm leaves a gap there and still projects to
 * roughly a 50px target at 1440 on the overhead view.
 */
export const DC9_OVERHEAD_HITBOX_EDGE_METRES = 0.042

export function separateDc9OverheadHitboxes(root: THREE.Object3D): number {
  let adjusted = 0
  for (const name of DC9_OVERHEAD_HITBOX_NODES) {
    const collider = root.getObjectByName(name)
    if (!collider) continue
    root.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(collider)
    if (bounds.isEmpty()) continue
    const size = bounds.getSize(new THREE.Vector3())
    const centre = bounds.getCenter(new THREE.Vector3())
    const axes = [size.x, size.y, size.z] as const
    // The tolerance keeps a second pass idempotent despite float error in the bounds.
    const scale = axes.map((extent) => (
      extent > DC9_OVERHEAD_HITBOX_EDGE_METRES * 1.001
        ? DC9_OVERHEAD_HITBOX_EDGE_METRES / extent
        : 1
    ))
    if (scale.every((value) => value === 1)) continue
    collider.scale.set(
      collider.scale.x * (scale[0] ?? 1),
      collider.scale.y * (scale[1] ?? 1),
      collider.scale.z * (scale[2] ?? 1),
    )
    // Scaling happens about the node origin, which need not be the box centre, so put the
    // centre back where the asset placed it.
    root.updateMatrixWorld(true)
    const moved = new THREE.Box3().setFromObject(collider).getCenter(new THREE.Vector3())
    collider.position.add(centre.clone().sub(moved))
    adjusted += 1
  }
  root.updateMatrixWorld(true)
  return adjusted
}
