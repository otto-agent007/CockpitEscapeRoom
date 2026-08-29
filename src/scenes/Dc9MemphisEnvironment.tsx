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
  type Dc9MemphisAnchorMap,
} from './dc9MemphisVisuals'
import type { Dc9MemphisLoadState } from './dc9MemphisLoadState'
import {
  disposeMemphisClone,
  handleMemphisLoadFailure,
  publishMemphisDataset,
  stageMemphisClone,
} from './dc9MemphisEnvironmentSupport'

export type { Dc9MemphisLoadState } from './dc9MemphisLoadState'

interface Dc9MemphisEnvironmentProps {
  frameRef: RefObject<Dc9DepartureFrame>
  reducedMotion: boolean
  retryToken: number
  onLoadState: (state: Dc9MemphisLoadState) => void
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
  const datasetCacheRef = useRef(new Map<string, string>())

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
    const datasetCache = datasetCacheRef.current
    if (retryToken > 0) clearCockpitModel(DC9_MEMPHIS_MODEL_URL)
    loadedRef.current = null
    publishMemphisDataset(canvas.dataset, datasetCache, 'dc9MemphisModelState', 'loading')
    publishMemphisDataset(canvas.dataset, datasetCache, 'dc9MemphisBeat', frameRef.current?.beat ?? '')
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
          publishMemphisDataset(canvas.dataset, datasetCache, 'dc9MemphisBeat', frame.beat)
          publishMemphisDataset(canvas.dataset, datasetCache, 'dc9MemphisWorldPose', applyMemphisWorldPose(
            staged.scene,
            staged.anchors,
            frame,
            reducedMotionRef.current,
          ))
        }
        loadedRef.current = staged
        setLoaded(staged)
        let objectCount = 0
        staged.scene.traverse(() => { objectCount += 1 })
        publishMemphisDataset(canvas.dataset, datasetCache, 'dc9MemphisObjectCount', String(objectCount))
        publishMemphisDataset(canvas.dataset, datasetCache, 'dc9MemphisModelState', 'ready')
        onLoadState({ status: 'ready', loadedBytes, totalBytes, percentage: 100 })
      })
      .catch((error) => {
        if (!handleMemphisLoadFailure(active, error, {
          clearCache: () => clearCockpitModel(DC9_MEMPHIS_MODEL_URL),
          logError: (currentError) => console.error('Failed to load DC-9 Memphis environment.', currentError),
        })) return
        if (stagedScene) disposeMemphisClone(stagedScene)
        stagedScene = null
        loadedRef.current = null
        setLoaded(null)
        publishMemphisDataset(canvas.dataset, datasetCache, 'dc9MemphisModelState', 'error')
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
      delete canvas.dataset.dc9MemphisModelState
      delete canvas.dataset.dc9MemphisObjectCount
      delete canvas.dataset.dc9MemphisBeat
      delete canvas.dataset.dc9MemphisWorldPose
      datasetCache.clear()
      onLoadState({ status: 'idle' })
    }
  }, [frameRef, onLoadState, retryToken])

  useFrame(() => {
    const frame = frameRef.current
    const current = loadedRef.current
    if (!frame) return
    const canvas = canvasRef.current
    const datasetCache = datasetCacheRef.current
    publishMemphisDataset(canvas.dataset, datasetCache, 'dc9MemphisBeat', frame.beat)
    if (!current) return
    publishMemphisDataset(canvas.dataset, datasetCache, 'dc9MemphisWorldPose', applyMemphisWorldPose(
      current.scene,
      current.anchors,
      frame,
      reducedMotion,
    ))
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
