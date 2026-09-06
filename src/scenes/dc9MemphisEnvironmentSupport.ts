import * as THREE from 'three'
import { dc9MemphisRouteMarkings, type Dc9MemphisMarkingGeometry } from './dc9MemphisRouteMarkings'
import {
  validateDc9MemphisAnchors,
  type Dc9MemphisAnchorMap,
  type Dc9MemphisVector,
} from './dc9MemphisVisuals'

const REQUIRED_NODES = Object.freeze([
  'KMEM_LEGACY_ROOT',
  'KMEM_CONCOURSE_B',
  'KMEM_RAMP',
  'KMEM_TAXI_SURFACE',
  'KMEM_RUNWAY_SURFACE',
] as const)

const ANCHOR_CONTRACT = Object.freeze([
  { name: 'KMEM_RAMP_START', gameId: 'dc9.memphis.rampStart' },
  { name: 'KMEM_TAXI_TURN', gameId: 'dc9.memphis.taxiTurn' },
  { name: 'KMEM_HOLD_SHORT', gameId: 'dc9.memphis.holdShort' },
  { name: 'KMEM_RUNWAY_LINEUP', gameId: 'dc9.memphis.runwayLineup' },
  { name: 'KMEM_INITIAL_CLIMB', gameId: 'dc9.memphis.initialClimb' },
] as const)

/**
 * Fixed draw order for the ground slabs, highest level nearest the eye.
 *
 * `KMEM_RAMP`, `KMEM_TAXI_SURFACE` and `KMEM_RUNWAY_SURFACE` are authored with
 * bit-identical top faces (world Y is exactly 0) and overlapping footprints:
 * 8,492 m² of ramp under taxiway and 2,040 m² of taxiway under runway. Both
 * patches lie directly under the guided taxi legs, which is why the taxi
 * shimmered while the takeoff roll — over runway that overlaps nothing north of
 * Y 265 — stayed clean. `KMEM_FIELD` sits only 8 cm below all of them, and the
 * departure frustum cannot resolve 8 cm past 259 m, so the far ground fought too.
 *
 * A depth-slope-scaled polygon offset settles both ties the way a decal is
 * settled: it grows with the grazing angle, so one bias holds from the nose to
 * the horizon. Staggering the boxes vertically cannot do that — resolving two
 * surfaces 400 m out needs 19 cm of separation, which reads as a visible step.
 */
const GROUND_DEPTH_BIAS_LEVELS: ReadonlyMap<string, number> = new Map([
  ['KMEM_FIELD', 0],
  // The apron never overlaps the ramp, so they may share one biased material.
  ['KMEM_TERMINAL_APRON', 1],
  ['KMEM_RAMP', 1],
  ['KMEM_TAXI_SURFACE', 2],
  ['KMEM_RUNWAY_SURFACE', 3],
])

/** The nine centreline strips are painted on the runway and must stay proud of it. */
const GROUND_CENTERLINE_PREFIX = 'KMEM_CENTERLINE_'
const GROUND_CENTERLINE_BIAS_LEVEL = 4

/**
 * Runtime-authored paint (see `dc9MemphisRouteMarkings.ts`) lies on the ramp and
 * taxiway exactly as the shipped dashes lie on the runway, and takes the same level.
 */
const ROUTE_MARKINGS_GROUP_NAME = 'KMEM_RUNTIME_ROUTE_MARKINGS'
const ROUTE_PAINT_NODE_NAMES = Object.freeze(['KMEM_RUNTIME_TAXI_GUIDANCE', 'KMEM_RUNTIME_HOLD_SHORT_BARS'] as const)
const ROUTE_POST_NODE_NAME = 'KMEM_RUNTIME_HOLD_SHORT_POSTS'
/** Faded mid-1990s taxiway yellow (sRGB), a shade warmer than the shipped runway dashes. */
const ROUTE_PAINT_COLOR = '#d2b04a'
const ROUTE_POST_COLOR = '#c9a441'

/** Ground stacking level for one object name; 0 for anything that takes no bias. */
export function memphisGroundDepthBiasLevel(name: string): number {
  if (name.startsWith(GROUND_CENTERLINE_PREFIX)) return GROUND_CENTERLINE_BIAS_LEVEL
  if ((ROUTE_PAINT_NODE_NAMES as readonly string[]).includes(name)) return GROUND_CENTERLINE_BIAS_LEVEL
  return GROUND_DEPTH_BIAS_LEVELS.get(name) ?? 0
}

function markingBufferGeometry(source: Dc9MemphisMarkingGeometry): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(source.positions, 3))
  geometry.setIndex([...source.indices])
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * Paint the guided route onto the staged clone: the taxi guidance line from ramp
 * release to the lineup point, and the hold-short marking with its two posts. The
 * geometry is derived from the validated anchors by the same sampler that moves the
 * world, so the painted line is the line the rules score against. Nothing here
 * touches the cached source scene or the shipped asset.
 */
function attachMemphisRouteMarkings(root: THREE.Object3D, anchors: Dc9MemphisAnchorMap): THREE.Group {
  const markings = dc9MemphisRouteMarkings(anchors)
  const paintLevel = memphisGroundDepthBiasLevel(ROUTE_PAINT_NODE_NAMES[0])
  const paint = new THREE.MeshStandardMaterial({
    color: ROUTE_PAINT_COLOR,
    roughness: 0.92,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -paintLevel,
    polygonOffsetUnits: -paintLevel,
  })
  paint.name = 'KMEM_RUNTIME_ROUTE_PAINT'
  const post = new THREE.MeshStandardMaterial({ color: ROUTE_POST_COLOR, roughness: 0.8, metalness: 0.05 })
  post.name = 'KMEM_RUNTIME_HOLD_POST'

  const group = new THREE.Group()
  group.name = ROUTE_MARKINGS_GROUP_NAME
  group.userData = { project_authored: true, runtime_authored: true, role: 'painted-route-marking' }
  const add = (name: string, geometry: Dc9MemphisMarkingGeometry, material: THREE.Material) => {
    const mesh = new THREE.Mesh(markingBufferGeometry(geometry), material)
    mesh.name = name
    mesh.userData = { project_authored: true, runtime_authored: true, role: 'painted-route-marking' }
    group.add(mesh)
  }
  add(ROUTE_PAINT_NODE_NAMES[0], markings.taxiGuidance, paint)
  add(ROUTE_PAINT_NODE_NAMES[1], markings.holdShortBars, paint)
  add(ROUTE_POST_NODE_NAME, markings.holdShortPosts, post)
  root.add(group)
  return group
}

function cloneMemphisTexture(
  source: THREE.Texture,
  textures: Map<THREE.Texture, THREE.Texture>,
): THREE.Texture {
  const existing = textures.get(source)
  if (existing) return existing
  const owned = source.clone()
  textures.set(source, owned)
  return owned
}

function cloneMemphisMaterial(
  source: THREE.Material,
  depthBiasLevel: number,
  materials: Map<string, THREE.Material>,
  textures: Map<THREE.Texture, THREE.Texture>,
): THREE.Material {
  // Keyed by level as well as source, because the shipped asset shares
  // KMEM_RAMP_MATERIAL between the ramp and the apron and KMEM_RUNWAY_MATERIAL
  // between the runway and the KMEM_TERMINAL_CLERESTORY building band. One
  // clone per level keeps the bias off the building without orphaning a clone.
  const key = `${source.uuid}:${depthBiasLevel}`
  const existing = materials.get(key)
  if (existing) return existing
  const owned = source.clone()
  materials.set(key, owned)
  if (depthBiasLevel > 0) {
    owned.polygonOffset = true
    owned.polygonOffsetFactor = -depthBiasLevel
    owned.polygonOffsetUnits = -depthBiasLevel
  }
  const ownedValues = owned as unknown as Record<string, unknown>
  for (const [key, value] of Object.entries(source)) {
    if (value instanceof THREE.Texture) {
      ownedValues[key] = cloneMemphisTexture(value, textures)
    }
  }
  if (source instanceof THREE.ShaderMaterial && owned instanceof THREE.ShaderMaterial) {
    for (const [name, uniform] of Object.entries(source.uniforms)) {
      const ownedUniform = owned.uniforms[name]
      if (!ownedUniform) continue
      if (uniform.value instanceof THREE.Texture) {
        ownedUniform.value = cloneMemphisTexture(uniform.value, textures)
      } else if (Array.isArray(uniform.value)) {
        ownedUniform.value = uniform.value.map((value: unknown) => (
          value instanceof THREE.Texture ? cloneMemphisTexture(value, textures) : value
        ))
      }
    }
  }
  return owned
}

function ownMemphisRenderResources(root: THREE.Object3D): void {
  const geometries = new Map<THREE.BufferGeometry, THREE.BufferGeometry>()
  const materials = new Map<string, THREE.Material>()
  const textures = new Map<THREE.Texture, THREE.Texture>()
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const sourceGeometry = object.geometry
    if (!sourceGeometry) return
    const depthBiasLevel = memphisGroundDepthBiasLevel(object.name)
    const ownedGeometry = geometries.get(sourceGeometry)
    if (ownedGeometry) {
      object.geometry = ownedGeometry
    } else {
      const clonedGeometry = sourceGeometry.clone()
      geometries.set(sourceGeometry, clonedGeometry)
      object.geometry = clonedGeometry
    }
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => cloneMemphisMaterial(material, depthBiasLevel, materials, textures))
      : cloneMemphisMaterial(object.material, depthBiasLevel, materials, textures)
  })
}

export function disposeMemphisClone(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    if (object.geometry) geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue
      materials.add(material)
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value)
      }
    }
  })
  for (const texture of textures) texture.dispose()
  for (const material of materials) material.dispose()
  for (const geometry of geometries) geometry.dispose()
  root.clear()
}

export function stageMemphisClone(source: THREE.Group): { scene: THREE.Group; anchors: Dc9MemphisAnchorMap } {
  const scene = source.clone(true)
  ownMemphisRenderResources(scene)
  const nameCounts = new Map<string, number>()
  const gameIdCounts = new Map<string, number>()
  scene.traverse((object) => {
    if (object.name) nameCounts.set(object.name, (nameCounts.get(object.name) ?? 0) + 1)
    if (typeof object.userData.game_id === 'string') {
      gameIdCounts.set(object.userData.game_id, (gameIdCounts.get(object.userData.game_id) ?? 0) + 1)
    }
    if (object instanceof THREE.Light) object.visible = false
  })

  const missingOrDuplicateNames = [...REQUIRED_NODES, ...ANCHOR_CONTRACT.map(({ name }) => name)]
    .filter((name) => nameCounts.get(name) !== 1)
  if (missingOrDuplicateNames.length > 0) {
    disposeMemphisClone(scene)
    throw new Error(`Memphis environment contract missing unique nodes: ${missingOrDuplicateNames.join(', ')}`)
  }

  scene.updateMatrixWorld(true)
  const worldPosition = new THREE.Vector3()
  const anchors = new Map<string, Dc9MemphisVector>()
  for (const { name, gameId } of ANCHOR_CONTRACT) {
    const anchor = scene.getObjectByName(name) as THREE.Object3D
    if (anchor.userData.game_id !== gameId || gameIdCounts.get(gameId) !== 1) {
      disposeMemphisClone(scene)
      throw new Error(`${name} must expose the unique game_id ${gameId}.`)
    }
    anchor.getWorldPosition(worldPosition)
    // glTF converts Blender X-right/Y-forward/Z-up to Three X-right/Y-up/Z-back.
    anchors.set(gameId, [worldPosition.x, -worldPosition.z, worldPosition.y])
  }
  const anchorErrors = validateDc9MemphisAnchors(anchors)
  if (anchorErrors.length > 0) {
    disposeMemphisClone(scene)
    throw new Error(anchorErrors.join(' '))
  }
  attachMemphisRouteMarkings(scene.getObjectByName('KMEM_LEGACY_ROOT') as THREE.Object3D, anchors)
  return { scene, anchors }
}

export function handleMemphisLoadFailure(
  active: boolean,
  error: unknown,
  callbacks: { clearCache: () => void; logError: (error: unknown) => void },
): boolean {
  if (!active) return false
  callbacks.clearCache()
  callbacks.logError(error)
  return true
}

export function publishMemphisDataset(
  dataset: Record<string, string | undefined>,
  cache: Map<string, string>,
  key: string,
  value: string,
): boolean {
  if (cache.get(key) === value) return false
  cache.set(key, value)
  dataset[key] = value
  return true
}
