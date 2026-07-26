import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import * as THREE from 'three'

import { clearRewardModel, loadRewardModel } from './rewardModelLoader'

export type RewardLoadState =
  | { status: 'loading'; loadedBytes: number; totalBytes?: number }
  | { status: 'ready'; loadedBytes: number; totalBytes?: number }
  | { status: 'error'; loadedBytes: number; totalBytes?: number; message: string }
  | { status: 'accessible-fallback'; loadedBytes: number; totalBytes?: number }

const REQUIRED_REWARD_NODES = [
  'TESLA_ROOT',
  'TESLA_VEHICLE',
  'TESLA_MODEL_Y_BODY',
  'TESLA_PLATE_POP_T',
  'TESLA_FLIGHT_MODE_ROOT',
  'TESLA_HANGAR_DOOR_RIGHT',
  'TESLA_WING_RIGHT_PIVOT',
  'CAM_TESLA_REWARD_GAME',
  'CAM_TESLA_REWARD_NARROW_GAME',
] as const

const REWARD_ANIMATION = 'TESLA_FLIGHT_MODE_REVEAL'

interface RewardModelProps {
  clipTimeSeconds: number
  retryToken: number
  onLoadState: (state: RewardLoadState) => void
}

function RewardModel({ clipTimeSeconds, retryToken, onLoadState }: RewardModelProps) {
  const { camera, gl, invalidate, size } = useThree()
  const canvasRef = useRef(gl.domElement)
  const cameraRef = useRef(camera)
  const [loaded, setLoaded] = useState<{
    scene: THREE.Group
    camera: THREE.Camera
    narrowCamera: THREE.Camera
    mixer: THREE.AnimationMixer
    rightDoor: THREE.Object3D
    rightWing: THREE.Object3D
    closedDoorX: number
  } | null>(null)

  useEffect(() => {
    canvasRef.current = gl.domElement
    cameraRef.current = camera
  }, [camera, gl])

  useEffect(() => {
    let active = true
    let loadedBytes = 0
    let totalBytes: number | undefined
    const canvas = canvasRef.current
    if (retryToken > 0) clearRewardModel()
    onLoadState({ status: 'loading', loadedBytes: 0 })
    canvas.dataset.rewardModelState = 'loading'

    loadRewardModel((nextLoadedBytes, nextTotalBytes) => {
      loadedBytes = nextLoadedBytes
      totalBytes = nextTotalBytes
      if (active) onLoadState({ status: 'loading', loadedBytes, totalBytes })
    })
      .then((gltf) => {
        if (!active) return
        const scene = clone(gltf.scene) as THREE.Group
        const missingNodes = REQUIRED_REWARD_NODES.filter((name) => !scene.getObjectByName(name))
        if (missingNodes.length > 0) throw new Error(`Model Y reward contract missing: ${missingNodes.join(', ')}`)
        const sourceCamera = scene.getObjectByName('CAM_TESLA_REWARD_GAME')
        if (!(sourceCamera instanceof THREE.Camera)) {
          throw new Error('Model Y reward camera contract is invalid.')
        }
        const narrowCamera = scene.getObjectByName('CAM_TESLA_REWARD_NARROW_GAME')
        if (!(narrowCamera instanceof THREE.Camera)) {
          throw new Error('Model Y narrow reward camera contract is invalid.')
        }
        const rightDoor = scene.getObjectByName('TESLA_HANGAR_DOOR_RIGHT')
        const rightWing = scene.getObjectByName('TESLA_WING_RIGHT_PIVOT')
        if (!rightDoor || !rightWing) {
          throw new Error('Model Y reward pose contract is invalid.')
        }
        const clip = gltf.animations.find((animation) => animation.name === REWARD_ANIMATION)
        if (!clip || Math.abs(clip.duration - 11.5) > 0.001) {
          throw new Error('Model Y Flight Mode animation must be exactly 11.5 seconds.')
        }
        scene.traverse((object) => {
          if (object instanceof THREE.Light) object.visible = false
          if (object instanceof THREE.Mesh) {
            object.castShadow = true
            object.receiveShadow = true
            object.frustumCulled = false
          }
        })
        const mixer = new THREE.AnimationMixer(scene)
        const action = mixer.clipAction(clip)
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.play()
        scene.updateMatrixWorld(true)
        setLoaded({
          scene,
          camera: sourceCamera,
          narrowCamera,
          mixer,
          rightDoor,
          rightWing,
          closedDoorX: rightDoor.position.x,
        })
        canvas.dataset.rewardModelState = 'ready'
        canvas.dataset.rewardAnimation = clip.name
        onLoadState({
          status: 'ready',
          loadedBytes: totalBytes ?? loadedBytes,
          totalBytes,
        })
      })
      .catch((error) => {
        clearRewardModel()
        if (!active) return
        const message = error instanceof Error ? error.message : 'The Model Y reward could not be loaded.'
        canvas.dataset.rewardModelState = 'error'
        onLoadState({ status: 'error', loadedBytes, totalBytes, message })
      })

    return () => {
      active = false
      delete canvas.dataset.rewardModelState
      delete canvas.dataset.rewardAnimation
    }
  }, [gl, onLoadState, retryToken])

  useEffect(() => {
    if (!loaded) return
    const runtimeCamera = cameraRef.current
    const canvas = canvasRef.current
    const sourceCamera = size.width <= 768 ? loaded.narrowCamera : loaded.camera
    loaded.mixer.setTime(clipTimeSeconds)
    loaded.scene.updateMatrixWorld(true)
    sourceCamera.getWorldPosition(runtimeCamera.position)
    sourceCamera.getWorldQuaternion(runtimeCamera.quaternion)
    if (runtimeCamera instanceof THREE.PerspectiveCamera && sourceCamera instanceof THREE.PerspectiveCamera) {
      runtimeCamera.fov = size.width < 520
        ? Math.max(82, sourceCamera.fov)
        : size.width <= 768
          ? Math.max(68, sourceCamera.fov)
          : sourceCamera.fov
      runtimeCamera.near = sourceCamera.near
      runtimeCamera.far = sourceCamera.far
      runtimeCamera.updateProjectionMatrix()
    }
    canvas.dataset.rewardClipTime = clipTimeSeconds.toFixed(3)
    canvas.dataset.rewardCamera = size.width <= 768 ? 'narrow' : 'game'
    canvas.dataset.rewardPose = (
      Math.abs(loaded.rightDoor.position.x - loaded.closedDoorX) > 4
      && loaded.rightWing.scale.x > 0.99
    ) ? 'deployed' : 'stowed'
    invalidate()
  }, [clipTimeSeconds, invalidate, loaded, size.width])

  useEffect(() => () => {
    loaded?.mixer.stopAllAction()
  }, [loaded])

  return loaded ? <primitive object={loaded.scene} dispose={null} /> : null
}

export function RewardScene({
  clipTimeSeconds,
  retryToken,
  onLoadState,
}: RewardModelProps) {
  const canvasCamera = useMemo(() => ({ position: [7.4, -9.2, 4.2] as [number, number, number], fov: 56 }), [])

  return (
    <div className="reward-scene" aria-label="Red Model Y Flight Mode hangar">
      <img
        className="reward-narrow-presentation"
        src={`${import.meta.env.BASE_URL}images/model-y-reward-narrow-${clipTimeSeconds >= 11.5 ? 'final' : 'static'}.png`}
        alt=""
        aria-hidden="true"
      />
      <Canvas
        camera={canvasCamera}
        dpr={[1, 1.5]}
        frameloop="demand"
        shadows
        fallback={<div className="canvas-fallback">WebGL is unavailable. The complete reward remains available below.</div>}
      >
        <color attach="background" args={['#05090d']} />
        <ambientLight intensity={0.55} color="#8fb9d8" />
        <directionalLight position={[6, -5, 7]} intensity={4.2} color="#ffd8b5" castShadow />
        <directionalLight position={[-5, 2, 4]} intensity={2.2} color="#70b9ff" />
        <RewardModel
          clipTimeSeconds={clipTimeSeconds}
          retryToken={retryToken}
          onLoadState={onLoadState}
        />
      </Canvas>
    </div>
  )
}
