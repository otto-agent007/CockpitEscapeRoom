import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import type { Dc9DepartureFrame } from '../game/dc9MemphisDeparture'
import {
  clearCockpitModel,
  DC9_MEMPHIS_MODEL_URL,
  loadCockpitModel,
  observeCockpitModelProgress,
} from './cockpitModelLoader'
import {
  dc9MemphisWorldPose,
  validateDc9MemphisAnchors,
  type Dc9MemphisAnchorMap,
  type Dc9MemphisVector,
} from './dc9MemphisVisuals'

export type Dc9MemphisLoadState =
  | { status: 'idle' }
  | { status: 'loading'; loadedBytes: number; totalBytes?: number; percentage?: number }
  | { status: 'ready'; loadedBytes: number; totalBytes?: number; percentage: 100 }
  | { status: 'error'; loadedBytes: number; totalBytes?: number; message: string }

interface Dc9MemphisEnvironmentProps {
  frameRef: RefObject<Dc9DepartureFrame>
  reducedMotion: boolean
  retryToken: number
  onLoadState: (state: Dc9MemphisLoadState) => void
}

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

function disposeMemphisClone(root: THREE.Object3D): void {
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry?.dispose()
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
  root.clear()
}

function stageMemphisClone(source: THREE.Group): { scene: THREE.Group; anchors: Dc9MemphisAnchorMap } {
  const scene = source.clone(true)
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

function applyMemphisWorldPose(
  scene: THREE.Group,
  anchors: Dc9MemphisAnchorMap,
  frame: Dc9DepartureFrame,
  reducedMotion: boolean,
): string {
  const pose = dc9MemphisWorldPose(frame, anchors, { reducedMotion })
  scene.position.set(pose.position.x, pose.position.y, pose.position.z)
  scene.quaternion.set(...pose.quaternion)
  scene.updateMatrix()
  return JSON.stringify({
    position: [pose.position.x, pose.position.y, pose.position.z],
    quaternion: pose.quaternion,
  })
}

/** A lazy exterior sibling; only its root moves while the approved cockpit stays fixed. */
export function Dc9MemphisEnvironment({
  frameRef,
  reducedMotion,
  retryToken,
  onLoadState,
}: Dc9MemphisEnvironmentProps) {
  const { gl } = useThree()
  const [loaded, setLoaded] = useState<{ scene: THREE.Group; anchors: Dc9MemphisAnchorMap } | null>(null)
  const loadedRef = useRef(loaded)
  const canvasRef = useRef(gl.domElement)
  const reducedMotionRef = useRef(reducedMotion)

  useEffect(() => {
    canvasRef.current = gl.domElement
  }, [gl])

  useEffect(() => {
    loadedRef.current = loaded
  }, [loaded])

  useEffect(() => {
    reducedMotionRef.current = reducedMotion
  }, [reducedMotion])

  useEffect(() => {
    let active = true
    let stagedScene: THREE.Group | null = null
    let loadedBytes = 0
    let totalBytes: number | undefined
    const canvas = canvasRef.current
    if (retryToken > 0) clearCockpitModel(DC9_MEMPHIS_MODEL_URL)
    canvas.dataset.dc9MemphisModelState = 'loading'
    canvas.dataset.dc9MemphisBeat = frameRef.current?.beat ?? ''
    onLoadState({ status: 'loading', loadedBytes: 0 })
    const stopObserving = observeCockpitModelProgress(DC9_MEMPHIS_MODEL_URL, (progress) => {
      if (!active) return
      loadedBytes = progress.loadedBytes
      totalBytes = progress.totalBytes
      onLoadState({
        status: 'loading',
        loadedBytes,
        totalBytes,
        percentage: totalBytes ? Math.min(99, Math.round(loadedBytes / totalBytes * 100)) : undefined,
      })
    })

    loadCockpitModel(DC9_MEMPHIS_MODEL_URL)
      .then((source) => {
        if (!active) return
        const staged = stageMemphisClone(source)
        stagedScene = staged.scene
        const frame = frameRef.current
        if (frame) {
          canvas.dataset.dc9MemphisBeat = frame.beat
          canvas.dataset.dc9MemphisWorldPose = applyMemphisWorldPose(
            staged.scene,
            staged.anchors,
            frame,
            reducedMotionRef.current,
          )
        }
        loadedRef.current = staged
        setLoaded(staged)
        canvas.dataset.dc9MemphisModelState = 'ready'
        onLoadState({ status: 'ready', loadedBytes, totalBytes, percentage: 100 })
      })
      .catch((error) => {
        clearCockpitModel(DC9_MEMPHIS_MODEL_URL)
        if (stagedScene) disposeMemphisClone(stagedScene)
        stagedScene = null
        console.error('Failed to load DC-9 Memphis environment.', error)
        if (!active) return
        loadedRef.current = null
        setLoaded(null)
        canvas.dataset.dc9MemphisModelState = 'error'
        onLoadState({
          status: 'error',
          loadedBytes,
          totalBytes,
          message: error instanceof Error ? error.message : 'Memphis environment failed to load.',
        })
      })

    return () => {
      active = false
      stopObserving()
      const current = loadedRef.current?.scene ?? stagedScene
      if (current) disposeMemphisClone(current)
      loadedRef.current = null
      clearCockpitModel(DC9_MEMPHIS_MODEL_URL)
      delete canvas.dataset.dc9MemphisModelState
      delete canvas.dataset.dc9MemphisBeat
      delete canvas.dataset.dc9MemphisWorldPose
      onLoadState({ status: 'idle' })
    }
  }, [frameRef, onLoadState, retryToken])

  useFrame(() => {
    const frame = frameRef.current
    const current = loadedRef.current
    if (!frame) return
    const canvas = canvasRef.current
    canvas.dataset.dc9MemphisBeat = frame.beat
    if (!current) return
    canvas.dataset.dc9MemphisWorldPose = applyMemphisWorldPose(
      current.scene,
      current.anchors,
      frame,
      reducedMotion,
    )
  })

  return (
    <>
      <color attach="background" args={['#9db7c2']} />
      <ambientLight intensity={0.58} color="#e8f0ec" />
      <hemisphereLight args={['#d8e9ef', '#59634f', 0.82]} />
      <directionalLight position={[-8, 12, 6]} intensity={1.48} color="#fff0d2" castShadow />
      <directionalLight position={[7, 4, 3]} intensity={0.42} color="#b8d6e5" />
      {loaded ? <primitive object={loaded.scene} dispose={null} /> : null}
    </>
  )
}
