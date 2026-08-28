import * as THREE from 'three'
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
  materials: Map<THREE.Material, THREE.Material>,
  textures: Map<THREE.Texture, THREE.Texture>,
): THREE.Material {
  const existing = materials.get(source)
  if (existing) return existing
  const owned = source.clone()
  materials.set(source, owned)
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
  const materials = new Map<THREE.Material, THREE.Material>()
  const textures = new Map<THREE.Texture, THREE.Texture>()
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const sourceGeometry = object.geometry
    if (!sourceGeometry) return
    const ownedGeometry = geometries.get(sourceGeometry)
    if (ownedGeometry) {
      object.geometry = ownedGeometry
    } else {
      const clonedGeometry = sourceGeometry.clone()
      geometries.set(sourceGeometry, clonedGeometry)
      object.geometry = clonedGeometry
    }
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => cloneMemphisMaterial(material, materials, textures))
      : cloneMemphisMaterial(object.material, materials, textures)
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
