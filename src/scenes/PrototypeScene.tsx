import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { OrbitControls as ThreeOrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { firstOfficerFlow, type FirstOfficerControl, type LockerMemoryId } from '../game/config'
import { type GamePhase, type SwitchId } from '../game/state'

// Cockpit shells produced by the asset pipeline and served from public/models.
const AIRBUS_MODEL_URL = `${import.meta.env.BASE_URL}models/airbus-first-officer.glb`
const DC9_MODEL_URL = `${import.meta.env.BASE_URL}models/dc9-cockpit.glb`
const LOCKER_MODEL_URL = `${import.meta.env.BASE_URL}models/locker-room.glb?v=tripo-locker-props-20260711`

// Provisional placement, tuned in-browser during visual approval — not final framing.
const DC9_MODEL_TRANSFORM = { position: [0, -0.35, 0] as [number, number, number], scale: 1 }

// Fetch and parse each cockpit GLB once per session, even across scene remounts.
const cockpitModelCache = new Map<string, Promise<THREE.Group>>()

function loadCockpitModel(url: string): Promise<THREE.Group> {
  let promise = cockpitModelCache.get(url)
  if (!promise) {
    promise = new GLTFLoader().loadAsync(url).then((gltf) => gltf.scene)
    cockpitModelCache.set(url, promise)
  }
  return promise
}

// Renders a real cockpit shell, falling back to greybox while it loads or if it fails.
function CockpitModel({
  url,
  transform,
  fallback,
}: {
  url: string
  transform: { position: [number, number, number]; scale: number }
  fallback: ReactNode
}) {
  const [scene, setScene] = useState<THREE.Group | null>(null)

  useEffect(() => {
    let active = true
    loadCockpitModel(url)
      .then((loaded) => {
        if (active) setScene(loaded)
      })
      .catch((error) => {
        console.error(`CockpitEscapeRoom: failed to load cockpit model ${url}`, error)
      })
    return () => {
      active = false
    }
  }, [url])

  if (!scene) return <>{fallback}</>
  return <primitive object={scene} position={transform.position} scale={transform.scale} />
}

const CAPTAIN_SWITCH_IDS = ['battery', 'navigation', 'cabin'] as const
const AIRBUS_GAME_CAMERA = 'CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW'
const AIRBUS_WIDE_GAME_FOV = 68
const AIRBUS_NARROW_GAME_FOV = 92
const AIRBUS_MIN_FOV = 50
const AIRBUS_MAX_FOV = 76
const AIRBUS_FO_EYE_POSITION = new THREE.Vector3(0.153815, 0.130133, 0.647877)
const AIRBUS_FO_EYE_QUATERNION = new THREE.Quaternion(-0.100679, 0.13991, 0.014302, 0.984929)
const AIRBUS_LOOK_YAW_LIMIT = 0.34
const AIRBUS_LOOK_PITCH_LIMIT = 0.22
const AIRBUS_LOOK_POINTER_SPEED = 0.0021
const LOCKER_CAMERA_MOVE_SECONDS = 4.5
const LOCKER_WATCH_POSITION = [0.31, -0.75, -0.21] as const
export type LockerCameraCue = 'entry-wide' | 'watch-focus'
const LOCKER_CAMERA_POSES: Record<LockerCameraCue, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  'entry-wide': { position: [0.25, 0.72, 7.6], target: [0, 0.18, 0], fov: 48 },
  'watch-focus': { position: [0.12, -0.2, 3.92], target: [0.31, -0.75, -0.21], fov: 36 },
}
const AIRBUS_TARGET_NODES: Record<FirstOfficerControl, { pivot: string; hitbox: string; cue: string }> = {
  sidestick: {
    pivot: 'AIRBUS_A320_TARGET_SIDESTICK_PIVOT',
    hitbox: 'AIRBUS_A320_TARGET_SIDESTICK_HITBOX',
    cue: 'AIRBUS_A320_TARGET_SIDESTICK_CUE',
  },
  thrust: {
    pivot: 'AIRBUS_A320_TARGET_THRUST_PIVOT',
    hitbox: 'AIRBUS_A320_TARGET_THRUST_HITBOX',
    cue: 'AIRBUS_A320_TARGET_THRUST_CUE',
  },
  gear: {
    pivot: 'AIRBUS_A320_TARGET_GEAR_PIVOT',
    hitbox: 'AIRBUS_A320_TARGET_GEAR_HITBOX',
    cue: 'AIRBUS_A320_TARGET_GEAR_CUE',
  },
  radio: {
    pivot: 'AIRBUS_A320_TARGET_RADIO_PIVOT',
    hitbox: 'AIRBUS_A320_TARGET_RADIO_HITBOX',
    cue: 'AIRBUS_A320_TARGET_RADIO_CUE',
  },
  altitude: {
    pivot: 'AIRBUS_A320_TARGET_ALTITUDE_PIVOT',
    hitbox: 'AIRBUS_A320_TARGET_ALTITUDE_HITBOX',
    cue: 'AIRBUS_A320_TARGET_ALTITUDE_CUE',
  },
}
const AIRBUS_REQUIRED_NODES = [
  'AIRBUS_ROOT',
  'AIRBUS_A320_STATIC',
  'AIRBUS_A320_DISPLAY_CANDIDATES',
  'AIRBUS_A320_INTERACTIVE_CANDIDATES',
  'AIRBUS_A320_LOC_CAPTAIN_EYE',
  'AIRBUS_A320_LOC_DASHBOARD_FOCUS',
  'AIRBUS_A320_TARGET_SIDESTICK_PIVOT',
  'AIRBUS_A320_TARGET_SIDESTICK_HITBOX',
  'AIRBUS_A320_TARGET_THRUST_PIVOT',
  'AIRBUS_A320_TARGET_THRUST_HITBOX',
  'AIRBUS_A320_TARGET_GEAR_PIVOT',
  'AIRBUS_A320_TARGET_GEAR_HITBOX',
  'AIRBUS_A320_TARGET_RADIO_PIVOT',
  'AIRBUS_A320_TARGET_RADIO_HITBOX',
  'AIRBUS_A320_TARGET_ALTITUDE_PIVOT',
  'AIRBUS_A320_TARGET_ALTITUDE_HITBOX',
  'AIRBUS_A320_TARGET_SIDESTICK_CUE',
  'AIRBUS_A320_TARGET_THRUST_CUE',
  'AIRBUS_A320_TARGET_GEAR_CUE',
  'AIRBUS_A320_TARGET_RADIO_CUE',
  'AIRBUS_A320_TARGET_ALTITUDE_CUE',
  AIRBUS_GAME_CAMERA,
] as const

export type AirbusHotspotScreenPositions = Partial<Record<FirstOfficerControl, { x: number; y: number; visible: boolean }>>
export type AirbusLoadState =
  | { status: 'loading'; loadedBytes: number; totalBytes?: number; percentage?: number }
  | { status: 'ready'; loadedBytes: number; totalBytes?: number; percentage: 100 }
  | { status: 'error'; loadedBytes: number; totalBytes?: number; message: string }
  | { status: 'accessible-fallback'; loadedBytes: number; totalBytes?: number }

export type LockerLoadState = { status: 'idle' | 'loading' | 'ready' | 'error' | 'accessible-fallback' }

interface PrototypeSceneProps {
  phase: Exclude<GamePhase, 'briefing'>
  activeSwitches: SwitchId[]
  lockerHatRevealed: boolean
  captainRewardUnlocked: boolean
  selectedAirbusCard: string | null
  airbusRetryToken: number
  lockerRetryToken: number
  lockerCameraCue: LockerCameraCue
  lockerCameraImmediate: boolean
  lockerControlsEnabled: boolean
  availableLockerMemories: LockerMemoryId[]
  cameraResetRevision: number
  onAirbusLoadState: (state: AirbusLoadState) => void
  onLockerLoadState: (state: LockerLoadState) => void
  onAirbusHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
  onAirbusTarget: (control: FirstOfficerControl) => void
  onLockerCameraSettled: (cue: LockerCameraCue) => void
  onSwitch: (switchId: SwitchId) => void
  onMars: () => void
  onLockerMemory: (memoryId: LockerMemoryId) => void
  onLockerHat: () => void
}

type HoverHandler = (hovering: boolean) => void
interface LoadedAirbusScene {
  scene: THREE.Group
  camera: THREE.Camera | null
  targetPivots: Partial<Record<FirstOfficerControl, THREE.Object3D>>
}

function projectAirbusHotspots(
  camera: THREE.Camera,
  size: { width: number; height: number },
  targetPivots: Partial<Record<FirstOfficerControl, THREE.Object3D>>,
): AirbusHotspotScreenPositions {
  const positions: AirbusHotspotScreenPositions = {}
  const worldPosition = new THREE.Vector3()

  for (const control of firstOfficerFlow.controlIds) {
    const pivot = targetPivots[control]
    if (!pivot) continue
    pivot.getWorldPosition(worldPosition)
    const projected = worldPosition.clone().project(camera)
    const x = (projected.x * 0.5 + 0.5) * size.width
    const y = (-projected.y * 0.5 + 0.5) * size.height
    positions[control] = {
      x: Math.round(x),
      y: Math.round(y),
      visible: projected.z >= -1 && projected.z <= 1 && x >= -48 && x <= size.width + 48 && y >= -48 && y <= size.height + 48,
    }
  }

  return positions
}

function applyAirbusGameplayCameraTransform(runtimeCamera: THREE.Camera, sourceCamera: THREE.Camera, fovOverride?: number) {
  runtimeCamera.position.copy(AIRBUS_FO_EYE_POSITION)
  runtimeCamera.quaternion.copy(AIRBUS_FO_EYE_QUATERNION)
  runtimeCamera.scale.set(1, 1, 1)
  runtimeCamera.updateMatrix()
  if (runtimeCamera instanceof THREE.PerspectiveCamera && sourceCamera instanceof THREE.PerspectiveCamera) {
    runtimeCamera.fov = fovOverride ?? sourceCamera.fov
    runtimeCamera.near = Math.max(0.01, sourceCamera.near)
    runtimeCamera.far = sourceCamera.far
    runtimeCamera.updateProjectionMatrix()
  }
  runtimeCamera.updateMatrixWorld(true)
}

function LimitedOrbitControls({
  airbusCameraRevision,
}: {
  airbusCameraRevision: number
}) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<ThreeOrbitControls | null>(null)

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement)
    controls.enablePan = false
    controls.enableZoom = true
    controls.enableRotate = true
    controls.screenSpacePanning = false
    controls.minDistance = 4.2
    controls.maxDistance = 7.2
    controls.minPolarAngle = Math.PI / 2.5
    controls.maxPolarAngle = Math.PI / 1.75
    controls.minAzimuthAngle = -0.42
    controls.maxAzimuthAngle = 0.42
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.saveState()
    controlsRef.current = controls

    return () => {
      controlsRef.current = null
      controls.dispose()
    }
  }, [camera, gl])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    controls.reset()
    controls.update()
  }, [airbusCameraRevision])

  useFrame(() => controlsRef.current?.update())
  return null
}

function lockerPoseVectors(cue: LockerCameraCue) {
  const pose = LOCKER_CAMERA_POSES[cue]
  return {
    position: new THREE.Vector3(...pose.position),
    target: new THREE.Vector3(...pose.target),
    fov: pose.fov,
  }
}

function lockerLookQuaternion(position: THREE.Vector3, target: THREE.Vector3): THREE.Quaternion {
  const helper = new THREE.Object3D()
  helper.position.copy(position)
  helper.lookAt(target)
  return helper.quaternion.clone()
}

function applyLockerCameraPose(camera: THREE.Camera, cue: LockerCameraCue) {
  const pose = lockerPoseVectors(cue)
  camera.position.copy(pose.position)
  camera.quaternion.copy(lockerLookQuaternion(pose.position, pose.target))
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.fov = pose.fov
    camera.updateProjectionMatrix()
  }
  camera.updateMatrixWorld(true)
}

function LockerCameraDirector({
  cue,
  immediate,
  onSettled,
}: {
  cue: LockerCameraCue
  immediate: boolean
  onSettled: (cue: LockerCameraCue) => void
}) {
  const { camera, gl, size } = useThree()
  const runtimeCameraRef = useRef(camera)
  const canvasRef = useRef(gl.domElement)
  const sizeRef = useRef(size)
  const onSettledRef = useRef(onSettled)
  const animationRef = useRef<{
    cue: LockerCameraCue
    elapsed: number
    fromPosition: THREE.Vector3
    fromQuaternion: THREE.Quaternion
    fromFov: number
    toPosition: THREE.Vector3
    toQuaternion: THREE.Quaternion
    toFov: number
    notified: boolean
  } | null>(null)

  useEffect(() => {
    onSettledRef.current = onSettled
  }, [onSettled])

  useEffect(() => {
    runtimeCameraRef.current = camera
    canvasRef.current = gl.domElement
    sizeRef.current = size
  }, [camera, gl, size])

  useEffect(() => {
    const pose = lockerPoseVectors(cue)
    const runtimeCamera = runtimeCameraRef.current
    animationRef.current = {
      cue,
      elapsed: immediate ? LOCKER_CAMERA_MOVE_SECONDS : 0,
      fromPosition: runtimeCamera.position.clone(),
      fromQuaternion: runtimeCamera.quaternion.clone(),
      fromFov: runtimeCamera instanceof THREE.PerspectiveCamera ? runtimeCamera.fov : pose.fov,
      toPosition: pose.position,
      toQuaternion: lockerLookQuaternion(pose.position, pose.target),
      toFov: pose.fov,
      notified: false,
    }
    canvasRef.current.dataset.lockerCameraCue = cue
    canvasRef.current.dataset.lockerCameraState = 'moving'
  }, [cue, immediate])

  useFrame((_, delta) => {
    const animation = animationRef.current
    if (!animation || animation.notified) return
    const runtimeCamera = runtimeCameraRef.current
    const canvas = canvasRef.current
    const canvasSize = sizeRef.current
    animation.elapsed = Math.min(LOCKER_CAMERA_MOVE_SECONDS, animation.elapsed + delta)
    const linearProgress = immediate ? 1 : animation.elapsed / LOCKER_CAMERA_MOVE_SECONDS
    const progress = linearProgress < 0.5
      ? 4 * linearProgress * linearProgress * linearProgress
      : 1 - Math.pow(-2 * linearProgress + 2, 3) / 2

    runtimeCamera.position.lerpVectors(animation.fromPosition, animation.toPosition, progress)
    runtimeCamera.quaternion.slerpQuaternions(animation.fromQuaternion, animation.toQuaternion, progress)
    if (runtimeCamera instanceof THREE.PerspectiveCamera) {
      runtimeCamera.fov = THREE.MathUtils.lerp(animation.fromFov, animation.toFov, progress)
      runtimeCamera.updateProjectionMatrix()
    }
    runtimeCamera.updateMatrixWorld(true)
    const watchPosition = new THREE.Vector3(...LOCKER_WATCH_POSITION).project(runtimeCamera)
    canvas.dataset.lockerWatchX = Math.round((watchPosition.x * 0.5 + 0.5) * canvasSize.width).toString()
    canvas.dataset.lockerWatchY = Math.round((-watchPosition.y * 0.5 + 0.5) * canvasSize.height).toString()

    if (linearProgress < 1) return
    animation.notified = true
    canvas.dataset.lockerCameraState = 'settled'
    onSettledRef.current(animation.cue)
  })

  return null
}

function LockerOrbitControls({
  enabled,
  cue,
  cameraResetRevision,
}: {
  enabled: boolean
  cue: LockerCameraCue
  cameraResetRevision: number
}) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<ThreeOrbitControls | null>(null)

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement)
    controls.enablePan = false
    controls.enableZoom = true
    controls.enableRotate = true
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 3.35
    controls.maxDistance = 5.8
    controls.minPolarAngle = Math.PI / 2.7
    controls.maxPolarAngle = Math.PI / 1.65
    controls.minAzimuthAngle = -0.48
    controls.maxAzimuthAngle = 0.48
    controlsRef.current = controls
    return () => {
      controlsRef.current = null
      controls.dispose()
    }
  }, [camera, gl])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    controls.enabled = enabled
    controls.target.copy(lockerPoseVectors(cue).target)
    controls.update()
  }, [cue, enabled])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls || !enabled) return
    applyLockerCameraPose(camera, cue)
    controls.target.copy(lockerPoseVectors(cue).target)
    controls.update()
  }, [camera, cameraResetRevision, cue, enabled])

  useFrame(() => controlsRef.current?.update())
  return null
}

function AirbusSeatLookControls({
  airbusCameraRevision,
}: {
  airbusCameraRevision: number
}) {
  const { camera, gl, size } = useThree()
  const basePositionRef = useRef(new THREE.Vector3())
  const baseQuaternionRef = useRef(new THREE.Quaternion())
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const draggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const cameraDirtyRef = useRef(true)
  const fovRef = useRef(AIRBUS_WIDE_GAME_FOV)
  const runtimeCameraRef = useRef(camera)
  const canvasRef = useRef(gl.domElement)

  useEffect(() => {
    runtimeCameraRef.current = camera
    canvasRef.current = gl.domElement
    cameraDirtyRef.current = true
  }, [camera, gl])

  useFrame(() => {
    if (!cameraDirtyRef.current) return
    const runtimeCamera = runtimeCameraRef.current
    const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current)
    const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRef.current)
    runtimeCamera.position.copy(basePositionRef.current)
    runtimeCamera.quaternion.copy(baseQuaternionRef.current).multiply(yawQuaternion).multiply(pitchQuaternion)
    if (runtimeCamera instanceof THREE.PerspectiveCamera) {
      const fov = size.width < 900 ? AIRBUS_NARROW_GAME_FOV : fovRef.current
      if (runtimeCamera.fov !== fov) {
        runtimeCamera.fov = fov
        runtimeCamera.updateProjectionMatrix()
      }
    }
    runtimeCamera.updateMatrix()
    runtimeCamera.updateMatrixWorld(true)
    runtimeCamera.matrixWorldInverse.copy(runtimeCamera.matrixWorld).invert()
    canvasRef.current.dataset.airbusCameraState = [
      runtimeCamera.position.x,
      runtimeCamera.position.y,
      runtimeCamera.position.z,
      runtimeCamera.quaternion.x,
      runtimeCamera.quaternion.y,
      runtimeCamera.quaternion.z,
      runtimeCamera.quaternion.w,
      runtimeCamera instanceof THREE.PerspectiveCamera ? runtimeCamera.fov : 0,
    ].map((value) => value.toFixed(5)).join(',')
    cameraDirtyRef.current = false
  })

  useEffect(() => {
    basePositionRef.current.copy(AIRBUS_FO_EYE_POSITION)
    baseQuaternionRef.current.copy(AIRBUS_FO_EYE_QUATERNION)
    yawRef.current = 0
    pitchRef.current = 0
    fovRef.current = AIRBUS_WIDE_GAME_FOV
    cameraDirtyRef.current = true
  }, [airbusCameraRevision])

  useEffect(() => {
    const canvas = gl.domElement
    const stopDrag = () => {
      draggingRef.current = false
    }

    const onLookStart = (event: PointerEvent) => {
      if (event.button !== 0) return
      draggingRef.current = true
      lastPointerRef.current = { x: event.clientX, y: event.clientY }
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        // Synthetic accessibility/test events may not own an active browser pointer.
      }
    }

    const onLookMove = (event: PointerEvent) => {
      if (!draggingRef.current) return
      const deltaX = event.clientX - lastPointerRef.current.x
      const deltaY = event.clientY - lastPointerRef.current.y
      lastPointerRef.current = { x: event.clientX, y: event.clientY }
      yawRef.current = THREE.MathUtils.clamp(
        yawRef.current - deltaX * AIRBUS_LOOK_POINTER_SPEED,
        -AIRBUS_LOOK_YAW_LIMIT,
        AIRBUS_LOOK_YAW_LIMIT,
      )
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - deltaY * AIRBUS_LOOK_POINTER_SPEED,
        -AIRBUS_LOOK_PITCH_LIMIT,
        AIRBUS_LOOK_PITCH_LIMIT,
      )
      cameraDirtyRef.current = true
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      fovRef.current = THREE.MathUtils.clamp(fovRef.current + event.deltaY * 0.025, AIRBUS_MIN_FOV, AIRBUS_MAX_FOV)
      cameraDirtyRef.current = true
    }

    canvas.addEventListener('pointerdown', onLookStart)
    canvas.addEventListener('pointermove', onLookMove)
    canvas.addEventListener('pointerup', stopDrag)
    canvas.addEventListener('pointercancel', stopDrag)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      draggingRef.current = false
      canvas.removeEventListener('pointerdown', onLookStart)
      canvas.removeEventListener('pointermove', onLookMove)
      canvas.removeEventListener('pointerup', stopDrag)
      canvas.removeEventListener('pointercancel', stopDrag)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  return null
}

function AirbusHotspotProjector({
  targetPivots,
  onHotspotsChange,
}: {
  targetPivots: Partial<Record<FirstOfficerControl, THREE.Object3D>>
  onHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
}) {
  const { camera, size } = useThree()
  const lastPayloadRef = useRef('')

  useFrame(() => {
    if (!onHotspotsChange) return
    const positions = projectAirbusHotspots(camera, size, targetPivots)
    const payload = JSON.stringify(positions)
    if (payload === lastPayloadRef.current) return
    lastPayloadRef.current = payload
    onHotspotsChange(positions)
  })

  useEffect(() => () => onHotspotsChange?.({}), [onHotspotsChange])
  return null
}

function isFirstOfficerControl(value: unknown): value is FirstOfficerControl {
  return typeof value === 'string' && (firstOfficerFlow.controlIds as readonly string[]).includes(value)
}

function airbusControlForObject(object: THREE.Object3D): FirstOfficerControl | null {
  let current: THREE.Object3D | null = object
  while (current) {
    if (current.userData.interaction === 'label_target' && isFirstOfficerControl(current.userData.control_id)) {
      return current.userData.control_id
    }
    current = current.parent
  }
  return null
}

function configureAirbusProxyMaterial(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh) || (object.userData.colliderOnly !== true && object.userData.cueOnly !== true)) return
  if (object.userData.airbusColliderMaterialConfigured === true) return
  object.castShadow = false
  object.receiveShadow = false
  object.visible = false
  const invisibleColliderMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    colorWrite: false,
  })
  object.material = Array.isArray(object.material)
    ? object.material.map(() => invisibleColliderMaterial.clone())
    : invisibleColliderMaterial
  object.userData.airbusColliderMaterialConfigured = true
}

function findAirbusTargetColliders(scene: THREE.Object3D): THREE.Mesh[] {
  const colliders: THREE.Mesh[] = []
  scene.traverse((object) => {
    configureAirbusProxyMaterial(object)
    if (object instanceof THREE.Mesh && object.userData.colliderOnly === true && airbusControlForObject(object)) {
      colliders.push(object)
    }
  })
  return colliders
}

function AirbusTargetRaycaster({
  scene,
  selectedAirbusCard,
  onTarget,
  onHoverInteractive,
}: {
  scene: THREE.Group
  selectedAirbusCard: string | null
  onTarget: (control: FirstOfficerControl) => void
  onHoverInteractive: HoverHandler
}) {
  const { camera, gl } = useThree()
  const raycasterRef = useRef(new THREE.Raycaster())
  const pointerRef = useRef(new THREE.Vector2())
  const hoveringRef = useRef(false)
  const colliders = useMemo(() => findAirbusTargetColliders(scene), [scene])

  const pickControl = useCallback((event: MouseEvent | PointerEvent | DragEvent): FirstOfficerControl | null => {
    const bounds = gl.domElement.getBoundingClientRect()
    scene.updateMatrixWorld(true)

    pointerRef.current.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    )
    raycasterRef.current.setFromCamera(pointerRef.current, camera)
    const hit = raycasterRef.current.intersectObjects(colliders, false)[0]
    return hit ? airbusControlForObject(hit.object) : null
  }, [camera, colliders, gl, scene])

  useEffect(() => {
    const canvas = gl.domElement

    const setHovering = (hovering: boolean) => {
      if (hoveringRef.current === hovering) return
      hoveringRef.current = hovering
      onHoverInteractive(hovering)
    }

    const onPointerMove = (event: PointerEvent) => {
      const control = selectedAirbusCard ? pickControl(event) : null
      setHovering(Boolean(control))
    }

    const onClick = (event: MouseEvent) => {
      if (!selectedAirbusCard) return
      const control = pickControl(event)
      if (!control) return
      event.preventDefault()
      event.stopPropagation()
      onTarget(control)
    }

    const onDragOver = (event: DragEvent) => {
      if (!selectedAirbusCard) return
      const control = pickControl(event)
      setHovering(Boolean(control))
      if (control) event.preventDefault()
    }

    const onDrop = (event: DragEvent) => {
      if (!selectedAirbusCard) return
      const control = pickControl(event)
      setHovering(false)
      if (!control) return
      event.preventDefault()
      onTarget(control)
    }

    const onPointerLeave = () => {
      setHovering(false)
    }

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('dragover', onDragOver)
    canvas.addEventListener('drop', onDrop)
    canvas.addEventListener('pointerleave', onPointerLeave)
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('dragover', onDragOver)
      canvas.removeEventListener('drop', onDrop)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      setHovering(false)
    }
  }, [gl, onHoverInteractive, onTarget, pickControl, selectedAirbusCard])

  return null
}

function AirbusRuntimeLighting() {
  return (
    <>
      <ambientLight intensity={0.68} />
      <hemisphereLight args={['#dcebf2', '#243436', 0.38]} />
      <directionalLight position={[0.35, 3.4, 2.8]} intensity={0.92} color="#f4f8ff" />
      <directionalLight position={[-2.8, 1.7, 1.2]} intensity={0.34} color="#9fc6d9" />
      <pointLight position={[0.15, 1.05, 0.8]} intensity={0.58} distance={5.2} color="#dff6ff" />
      <pointLight position={[-1.85, 0.52, 1.05]} intensity={0.36} distance={3.7} color="#e7fff3" />
      <pointLight position={[1.65, 0.48, 0.88]} intensity={0.28} distance={3.4} color="#d8ecff" />
    </>
  )
}

function useInteractiveCursor() {
  const hoverCountRef = useRef(0)

  useEffect(() => {
    return () => {
      hoverCountRef.current = 0
      document.body.style.cursor = 'default'
    }
  }, [])

  return useCallback((hovering: boolean) => {
    hoverCountRef.current = hovering ? hoverCountRef.current + 1 : Math.max(0, hoverCountRef.current - 1)
    document.body.style.cursor = hoverCountRef.current > 0 ? 'pointer' : 'default'
  }, [])
}

function AirbusCockpit({
  selectedAirbusCard,
  retryToken,
  cameraResetRevision,
  onLoadState,
  onAirbusHotspotsChange,
  onAirbusTarget,
  onHoverInteractive,
}: {
  selectedAirbusCard: string | null
  retryToken: number
  cameraResetRevision: number
  onLoadState: (state: AirbusLoadState) => void
  onAirbusHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
  onAirbusTarget: (control: FirstOfficerControl) => void
  onHoverInteractive: HoverHandler
}) {
  const { camera, size } = useThree()
  const [loaded, setLoaded] = useState<LoadedAirbusScene | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const readyFrameCountRef = useRef<number | null>(null)
  const loadedBytesRef = useRef(0)
  const totalBytesRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const loader = new GLTFLoader()
    loadedBytesRef.current = 0
    totalBytesRef.current = undefined
    onLoadState({ status: 'loading', loadedBytes: 0 })

    loader.load(
      AIRBUS_MODEL_URL,
      (gltf) => {
        if (cancelled) return
        setLoadFailed(false)
        const loadedScene = gltf.scene
        const missingNodes = AIRBUS_REQUIRED_NODES.filter((nodeName) => !loadedScene.getObjectByName(nodeName))

        if (missingNodes.length > 0) {
          console.warn(`A320 cockpit asset is missing expected nodes: ${missingNodes.join(', ')}`)
        }

        loadedScene.traverse((object) => {
          if (object instanceof THREE.Light) {
            object.visible = false
            object.intensity = 0
            return
          }
          object.visible = true
          configureAirbusProxyMaterial(object)
          if (object instanceof THREE.Mesh) {
            object.frustumCulled = false
            object.castShadow = true
            object.receiveShadow = true
            if (object.userData.colliderOnly !== true && object.userData.cueOnly !== true) {
              const materials = Array.isArray(object.material) ? object.material : [object.material]
              for (const material of materials) {
                material.side = THREE.DoubleSide
                material.needsUpdate = true
              }
            }
          }
        })
        loadedScene.userData.airbusRuntimeMaterialToneApplied = true

        loadedScene.updateMatrixWorld(true)
        const targetPivots: Partial<Record<FirstOfficerControl, THREE.Object3D>> = {}
        for (const control of firstOfficerFlow.controlIds) {
          const pivot = loadedScene.getObjectByName(AIRBUS_TARGET_NODES[control].pivot)
          if (pivot) targetPivots[control] = pivot
        }
        setLoaded({
          scene: loadedScene,
          camera: loadedScene.getObjectByName(AIRBUS_GAME_CAMERA) as THREE.Camera | null,
          targetPivots,
        })
        readyFrameCountRef.current = 0
      },
      (event) => {
        if (cancelled) return
        loadedBytesRef.current = event.loaded
        totalBytesRef.current = event.total || undefined
        onLoadState({
          status: 'loading',
          loadedBytes: event.loaded,
          totalBytes: event.total || undefined,
          percentage: event.total ? Math.min(99, Math.round((event.loaded / event.total) * 100)) : undefined,
        })
      },
      (error) => {
        if (cancelled) return
        console.error('Failed to load A320 cockpit asset.', error)
        setLoadFailed(true)
        onLoadState({ status: 'error', loadedBytes: loadedBytesRef.current, totalBytes: totalBytesRef.current, message: 'The A320 cockpit could not be prepared.' })
      },
    )

    return () => {
      cancelled = true
    }
  }, [onLoadState, retryToken])

  useLayoutEffect(() => {
    if (!loaded?.camera) return
    loaded.scene.updateMatrixWorld(true)
    applyAirbusGameplayCameraTransform(camera, loaded.camera, size.width < 900 ? AIRBUS_NARROW_GAME_FOV : AIRBUS_WIDE_GAME_FOV)
    onAirbusHotspotsChange?.(projectAirbusHotspots(camera, { width: size.width, height: size.height }, loaded.targetPivots))
  }, [camera, loaded, onAirbusHotspotsChange, size.height, size.width])

  useFrame(() => {
    if (readyFrameCountRef.current === null || !loaded?.camera) return
    readyFrameCountRef.current += 1
    if (readyFrameCountRef.current < 2) return
    readyFrameCountRef.current = null
    onLoadState({ status: 'ready', loadedBytes: loadedBytesRef.current, totalBytes: totalBytesRef.current, percentage: 100 })
  })

  return (
    <>
      <color attach="background" args={['#172123']} />
      <AirbusRuntimeLighting />
      {loaded && !loadFailed && (
        <>
          <primitive object={loaded.scene} />
          <AirbusSeatLookControls airbusCameraRevision={cameraResetRevision} />
          <AirbusHotspotProjector targetPivots={loaded.targetPivots} onHotspotsChange={onAirbusHotspotsChange} />
          <AirbusTargetRaycaster
            scene={loaded.scene}
            selectedAirbusCard={selectedAirbusCard}
            onTarget={onAirbusTarget}
            onHoverInteractive={onHoverInteractive}
          />
        </>
      )}
    </>
  )
}

const LOCKER_GAME_IDS: Record<string, LockerMemoryId> = {
  'locker.memory.watch': 'watch',
  'locker.memory.baseball': 'baseball',
  'locker.memory.wings': 'wings',
  'locker.memory.chargingBull': 'chargingBull',
  'locker.memory.charging_bull': 'chargingBull',
}

function lockerGameId(object: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = object
  while (current) {
    if (typeof current.userData.game_id === 'string') return current.userData.game_id
    current = current.parent
  }
  return null
}

type LockerPropMaterialSnapshot = {
  color: THREE.Color
  emissive: THREE.Color
  emissiveIntensity: number
  map: THREE.Texture | null
  normalMap: THREE.Texture | null
  roughnessMap: THREE.Texture | null
  metalnessMap: THREE.Texture | null
  aoMap: THREE.Texture | null
  emissiveMap: THREE.Texture | null
  bumpMap: THREE.Texture | null
  displacementMap: THREE.Texture | null
  metalness: number
  roughness: number
}

const lockerPropMaterialSnapshots = new WeakMap<THREE.MeshStandardMaterial, LockerPropMaterialSnapshot>()

function cloneLockerRuntimeMaterials(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh)) return
  object.material = Array.isArray(object.material)
    ? object.material.map((material) => material.clone())
    : object.material.clone()
}

function configureLockerRuntimeMaterial(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh)) return
  object.frustumCulled = false
  object.castShadow = true
  object.receiveShadow = true
  const materials = Array.isArray(object.material) ? object.material : [object.material]
  for (const material of materials) {
    if (!(material instanceof THREE.MeshStandardMaterial)) continue
    material.side = THREE.DoubleSide
    if (object.name.includes('LOCKER_HITBOX') || material.name === 'MAT_LOCKER_INVISIBLE_HITBOX') {
      material.transparent = true
      material.opacity = 0
      material.colorWrite = false
      material.depthWrite = false
      material.needsUpdate = true
      continue
    }
    if (object.userData.source_package === 'locker-room-bench' || material.name.toLowerCase().includes('lambert')) {
      material.color.multiplyScalar(1.18)
      material.emissive = new THREE.Color('#201208')
      material.emissiveIntensity = 0.05
    } else if (material.name === 'MAT_LOCKER_ROOM_WARM_WALL') {
      material.color = new THREE.Color('#33251f')
      material.roughness = 0.9
    } else if (material.name === 'MAT_LOCKER_ROOM_FLOOR') {
      material.color = new THREE.Color('#4a3023')
      material.roughness = 0.82
    }
    material.needsUpdate = true
  }
}

function setLockerPropMaterialState(prop: THREE.Object3D, revealed: boolean) {
  prop.visible = true
  prop.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue
      let snapshot = lockerPropMaterialSnapshots.get(material)
      if (!snapshot) {
        snapshot = {
          color: material.color.clone(),
          emissive: material.emissive.clone(),
          emissiveIntensity: material.emissiveIntensity,
          map: material.map,
          normalMap: material.normalMap,
          roughnessMap: material.roughnessMap,
          metalnessMap: material.metalnessMap,
          aoMap: material.aoMap,
          emissiveMap: material.emissiveMap,
          bumpMap: material.bumpMap,
          displacementMap: material.displacementMap,
          metalness: material.metalness,
          roughness: material.roughness,
        }
        lockerPropMaterialSnapshots.set(material, snapshot)
      }

      if (revealed) {
        material.color.copy(snapshot.color)
        material.emissive.copy(snapshot.emissive)
        material.emissiveIntensity = snapshot.emissiveIntensity
        material.map = snapshot.map
        material.normalMap = snapshot.normalMap
        material.roughnessMap = snapshot.roughnessMap
        material.metalnessMap = snapshot.metalnessMap
        material.aoMap = snapshot.aoMap
        material.emissiveMap = snapshot.emissiveMap
        material.bumpMap = snapshot.bumpMap
        material.displacementMap = snapshot.displacementMap
        material.metalness = snapshot.metalness
        material.roughness = snapshot.roughness
      } else {
        material.color.set('#010101')
        material.emissive.set('#000000')
        material.emissiveIntensity = 0
        material.map = null
        material.normalMap = null
        material.roughnessMap = null
        material.metalnessMap = null
        material.aoMap = null
        material.emissiveMap = null
        material.bumpMap = null
        material.displacementMap = null
        material.metalness = 0
        material.roughness = 1
      }
      material.needsUpdate = true
    }
  })
}

function LockerRoom({
  hatRevealed,
  retryToken,
  interactionEnabled,
  availableMemories,
  onLoadState,
  onLockerMemory,
  onLockerHat,
  onHoverInteractive,
}: {
  hatRevealed: boolean
  retryToken: number
  interactionEnabled: boolean
  availableMemories: LockerMemoryId[]
  onLoadState: (state: LockerLoadState) => void
  onLockerMemory: (memoryId: LockerMemoryId) => void
  onLockerHat: () => void
  onHoverInteractive: HoverHandler
}) {
  const [scene, setScene] = useState<THREE.Group | null>(null)
  const { gl } = useThree()
  const canvasRef = useRef(gl.domElement)
  const wingsRevealed = availableMemories.includes('wings')
  const chargingBullRevealed = availableMemories.includes('chargingBull')

  useEffect(() => {
    canvasRef.current = gl.domElement
  }, [gl])

  useEffect(() => {
    let active = true
    onLoadState({ status: 'loading' })
    if (retryToken > 0) cockpitModelCache.delete(LOCKER_MODEL_URL)
    loadCockpitModel(LOCKER_MODEL_URL)
      .then((loaded) => {
        if (!active) return
        const instance = loaded.clone(true)
        instance.traverse(cloneLockerRuntimeMaterials)
        instance.traverse(configureLockerRuntimeMaterial)
        const watch = instance.getObjectByName('LOCKER_PROP_WATCH')
        const wings = instance.getObjectByName('LOCKER_PROP_WINGS')
        const chargingBull = instance.getObjectByName('LOCKER_PROP_CHARGING_BULL')
        const hat = instance.getObjectByName('LOCKER_PROP_CAPTAINS_HAT')
        if (!watch || !wings || !chargingBull || !hat) {
          throw new Error('Locker GLB is missing a required watch, Wings, Charging Bull, or captain-hat contract node.')
        }
        instance.updateMatrixWorld(true)
        const bounds = new THREE.Box3().setFromObject(instance)
        const center = bounds.getCenter(new THREE.Vector3())
        const size = bounds.getSize(new THREE.Vector3())
        const scale = Math.min(0.82, 4.8 / Math.max(size.x, size.y))
        instance.scale.setScalar(scale)
        instance.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
        instance.position.y += 0.28
        instance.updateMatrixWorld(true)
        setScene(instance)
        onLoadState({ status: 'ready' })
      })
      .catch((error) => {
        cockpitModelCache.delete(LOCKER_MODEL_URL)
        console.error('Failed to load captain locker asset.', error)
        if (active) onLoadState({ status: 'error' })
      })
    return () => { active = false }
  }, [onLoadState, retryToken])

  useEffect(() => {
    if (!scene) return
    const hat = scene.getObjectByName('LOCKER_PROP_CAPTAINS_HAT')
    const wings = scene.getObjectByName('LOCKER_PROP_WINGS')
    const chargingBull = scene.getObjectByName('LOCKER_PROP_CHARGING_BULL')
    const door = scene.getObjectByName('LOCKER_UPPER_CUBBY_DOOR')
    const light = scene.getObjectByName('LOCKER_HAT_LIGHT')
    if (hat) setLockerPropMaterialState(hat, hatRevealed)
    if (wings) setLockerPropMaterialState(wings, wingsRevealed)
    if (chargingBull) setLockerPropMaterialState(chargingBull, chargingBullRevealed)
    if (door) door.rotation.x = hatRevealed ? -1.35 : 0
    if (light instanceof THREE.Light) light.intensity = hatRevealed ? 7 : 0
    canvasRef.current.dataset.lockerHatVisual = hatRevealed ? 'revealed' : 'silhouette'
    canvasRef.current.dataset.lockerWingsVisual = wingsRevealed ? 'revealed' : 'silhouette'
    canvasRef.current.dataset.lockerBullVisual = chargingBullRevealed ? 'revealed' : 'silhouette'
  }, [chargingBullRevealed, hatRevealed, scene, wingsRevealed])

  useEffect(() => {
    if (!scene) return
    const watch = scene.getObjectByName('LOCKER_PROP_WATCH')
    const wings = scene.getObjectByName('LOCKER_PROP_WINGS')
    const chargingBull = scene.getObjectByName('LOCKER_PROP_CHARGING_BULL')
    const hat = scene.getObjectByName('LOCKER_PROP_CAPTAINS_HAT')
    const canvas = canvasRef.current
    canvas.dataset.lockerWatchNode = watch?.name ?? 'missing'
    canvas.dataset.lockerWingsNode = wings?.name ?? 'missing'
    canvas.dataset.lockerBullNode = chargingBull?.name ?? 'missing'
    canvas.dataset.lockerHatNode = hat?.name ?? 'missing'
    return () => {
      delete canvas.dataset.lockerWatchNode
      delete canvas.dataset.lockerWingsNode
      delete canvas.dataset.lockerBullNode
      delete canvas.dataset.lockerHatNode
      delete canvas.dataset.lockerHatVisual
      delete canvas.dataset.lockerWingsVisual
      delete canvas.dataset.lockerBullVisual
    }
  }, [scene])

  const activate = (object: THREE.Object3D) => {
    if (!interactionEnabled) return
    const gameId = lockerGameId(object)
    if (!gameId) return
    if (gameId === 'locker.promotion.hat') {
      if (hatRevealed) onLockerHat()
      return
    }
    const memoryId = LOCKER_GAME_IDS[gameId]
    if (memoryId) onLockerMemory(memoryId)
  }

  const isInteractive = (object: THREE.Object3D) => {
    if (!interactionEnabled) return false
    const gameId = lockerGameId(object)
    if (gameId === 'locker.promotion.hat') return hatRevealed
    const memoryId = gameId ? LOCKER_GAME_IDS[gameId] : undefined
    return Boolean(memoryId && availableMemories.includes(memoryId))
  }

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.82} color="#e8e3da" />
      <hemisphereLight args={['#ffe1b0', '#211815', 0.58]} />
      <directionalLight position={[3, 5, 4]} intensity={2.7} color="#ffd59a" castShadow />
      <directionalLight position={[-3.2, 2.2, 3.1]} intensity={0.9} color="#c9ddff" />
      <directionalLight position={[0, 2.8, 6]} intensity={1.2} color="#f3f5ff" />
      <spotLight position={[0.48, 1.55, 1.1]} intensity={7.5} distance={5.5} angle={0.56} penumbra={0.86} color="#f2ad62" castShadow />
      <pointLight position={[0.44, 0.34, 0.72]} intensity={hatRevealed ? 4.4 : 3.6} distance={3.8} color="#ef9d4d" />
      <pointLight position={[-1.2, 0.5, 2.4]} intensity={0.75} distance={5} color="#ffe6bd" />
      {scene ? (
        <>
          <primitive
            object={scene}
            onClick={(event: ThreeEvent<MouseEvent>) => {
              if (!lockerGameId(event.object)) return
              event.stopPropagation()
              activate(event.object)
            }}
            onPointerOver={(event: ThreeEvent<PointerEvent>) => {
              if (!isInteractive(event.object)) return
              event.stopPropagation()
              onHoverInteractive(true)
            }}
            onPointerOut={(event: ThreeEvent<PointerEvent>) => {
              if (!lockerGameId(event.object)) return
              event.stopPropagation()
              onHoverInteractive(false)
            }}
          />
          <group>
            {([
              ['baseball', 'locker.memory.baseball', [-0.58, -0.12, 0.7], [0.52, 0.48, 0.3]],
            ] as const).filter(([memoryId]) => availableMemories.includes(memoryId)).map(([, gameId, position, scale]) => (
              <mesh
                key={gameId}
                position={position}
                scale={scale}
                userData={{ game_id: gameId }}
                onClick={(event) => { event.stopPropagation(); activate(event.object) }}
                onPointerOver={(event) => { event.stopPropagation(); if (interactionEnabled) onHoverInteractive(true) }}
                onPointerOut={() => onHoverInteractive(false)}
              >
                <boxGeometry />
                <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
              </mesh>
            ))}
          </group>
        </>
      ) : (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.6, 3.8, 0.35]} />
          <meshStandardMaterial color="#49514e" roughness={0.85} />
        </mesh>
      )}
    </>
  )
}

function CaptainCockpit({
  activeSwitches,
  phase,
  onSwitch,
  onMars,
  onHoverInteractive,
}: {
  activeSwitches: SwitchId[]
  phase: 'captain' | 'reward' | 'mars'
  onSwitch: (switchId: SwitchId) => void
  onMars: () => void
  onHoverInteractive: HoverHandler
}) {
  const positions = useMemo<[number, number, number][]>(() => [
    [-0.78, -0.15, 0.34],
    [0, -0.15, 0.34],
    [0.78, -0.15, 0.34],
  ], [])

  return (
    <>
      <color attach="background" args={['#0d1517']} />
      <ambientLight intensity={0.64} />
      <directionalLight position={[2.5, 3.8, 2.4]} intensity={2} castShadow />
      <CockpitModel
        url={DC9_MODEL_URL}
        transform={DC9_MODEL_TRANSFORM}
        fallback={
          <mesh receiveShadow>
            <boxGeometry args={[3.4, 2.45, 0.35]} />
            <meshStandardMaterial color="#3c5258" roughness={0.82} />
          </mesh>
        }
      />
      {positions.map((position, index) => {
        const switchId = CAPTAIN_SWITCH_IDS[index]
        if (!switchId) return null
        const active = activeSwitches.includes(switchId)
        return (
          <group key={switchId} position={position}>
            <mesh castShadow>
              <boxGeometry args={[0.56, 0.7, 0.16]} />
              <meshStandardMaterial color="#374845" roughness={0.7} />
            </mesh>
            <mesh
              position={[0, active ? 0.16 : -0.16, 0.2]}
              rotation={[active ? -0.52 : 0.52, 0, 0]}
              onClick={(event) => {
                event.stopPropagation()
                onSwitch(switchId)
              }}
              onPointerOver={() => {
                onHoverInteractive(true)
              }}
              onPointerOut={() => {
                onHoverInteractive(false)
              }}
              onPointerLeave={() => {
                onHoverInteractive(false)
              }}
              castShadow
            >
              <boxGeometry args={[0.16, 0.54, 0.16]} />
              <meshStandardMaterial color={active ? '#e6c468' : '#c3c6bd'} roughness={0.38} />
            </mesh>
          </group>
        )
      })}
      <mesh position={[1.22, 0.87, 0.18]}>
        <boxGeometry args={[0.48, 0.18, 0.06]} />
        <meshStandardMaterial color="#dfb84e" emissive={phase === 'captain' ? '#9a6518' : '#4f6d19'} />
      </mesh>
      <mesh
        position={[-1.2, 0.9, 0.21]}
        onClick={(event) => {
          event.stopPropagation()
          if (phase === 'reward' || phase === 'mars') onMars()
        }}
        onPointerOver={() => {
          onHoverInteractive(phase === 'reward' || phase === 'mars')
        }}
        onPointerOut={() => onHoverInteractive(false)}
        onPointerLeave={() => onHoverInteractive(false)}
      >
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshStandardMaterial color={phase === 'reward' || phase === 'mars' ? '#bf2b20' : '#321612'} />
      </mesh>
      {phase !== 'captain' && (
        <mesh position={[0, -1.05, -0.6]} castShadow>
          <boxGeometry args={[1.9, 0.42, 0.72]} />
          <meshStandardMaterial color="#a4161b" roughness={0.35} />
        </mesh>
      )}
    </>
  )
}

export function PrototypeScene({
  phase,
  activeSwitches,
  lockerHatRevealed,
  captainRewardUnlocked,
  selectedAirbusCard,
  airbusRetryToken,
  lockerRetryToken,
  lockerCameraCue,
  lockerCameraImmediate,
  lockerControlsEnabled,
  availableLockerMemories,
  cameraResetRevision,
  onAirbusLoadState,
  onLockerLoadState,
  onAirbusHotspotsChange,
  onAirbusTarget,
  onLockerCameraSettled,
  onSwitch,
  onMars,
  onLockerMemory,
  onLockerHat,
}: PrototypeSceneProps) {
  const onInteractiveHover = useInteractiveCursor()

  return (
    <div className="scene" aria-label="Interactive 3D scene">
      <Canvas
        camera={{ position: [0, 0.25, 5.6], fov: 42 }}
        dpr={[1, 1.5]}
        shadows="percentage"
        fallback={<div className="canvas-fallback">WebGL is unavailable. Use the accessible cockpit controls.</div>}
      >
        {phase === 'airbus' && (
          <AirbusCockpit
            selectedAirbusCard={selectedAirbusCard}
            retryToken={airbusRetryToken}
            cameraResetRevision={cameraResetRevision}
            onLoadState={onAirbusLoadState}
            onAirbusHotspotsChange={onAirbusHotspotsChange}
            onAirbusTarget={onAirbusTarget}
            onHoverInteractive={onInteractiveHover}
          />
        )}
        {phase === 'locker' && (
          <>
            <LockerRoom
              hatRevealed={lockerHatRevealed}
              retryToken={lockerRetryToken}
              interactionEnabled={lockerControlsEnabled}
              availableMemories={availableLockerMemories}
              onLoadState={onLockerLoadState}
              onLockerMemory={onLockerMemory}
              onLockerHat={onLockerHat}
              onHoverInteractive={onInteractiveHover}
            />
            <LockerCameraDirector
              cue={lockerCameraCue}
              immediate={lockerCameraImmediate}
              onSettled={onLockerCameraSettled}
            />
            <LockerOrbitControls
              enabled={lockerControlsEnabled}
              cue={lockerCameraCue}
              cameraResetRevision={cameraResetRevision}
            />
          </>
        )}
        {(phase === 'captain' || phase === 'reward' || phase === 'mars') && (
          <CaptainCockpit
            activeSwitches={activeSwitches}
            phase={phase}
            onSwitch={onSwitch}
            onMars={onMars}
            onHoverInteractive={onInteractiveHover}
          />
        )}
        {captainRewardUnlocked && phase === 'reward' && (
          <mesh position={[0, -1.12, -0.58]} rotation={[0, -0.35, 0]}>
            <boxGeometry args={[1.55, 0.38, 0.72]} />
            <meshStandardMaterial color="#a41419" roughness={0.25} metalness={0.55} />
          </mesh>
        )}

        {phase !== 'airbus' && phase !== 'locker' && (
          <LimitedOrbitControls airbusCameraRevision={cameraResetRevision} />
        )}
      </Canvas>
      {phase !== 'airbus' && phase !== 'locker' && (
        <div className="prototype-badge">
          {phase === 'captain' ? 'GREYBOX — DC-9 CAPTAIN FLOW' : 'HANGAR VIEW'}
        </div>
      )}
    </div>
  )
}
