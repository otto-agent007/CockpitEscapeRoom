import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { OrbitControls as ThreeOrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { dc9LegacyFlow, firstOfficerFlow, type FirstOfficerControl, type LockerMemoryId } from '../game/config'
import { type Dc9ChapterStage, type Dc9SecureControlId, type GamePhase } from '../game/state'

// Cockpit shells produced by the asset pipeline and served from public/models.
const AIRBUS_MODEL_URL = `${import.meta.env.BASE_URL}models/airbus-first-officer.glb`
const DC9_MODEL_URL = `${import.meta.env.BASE_URL}models/dc9-cockpit.glb?v=dc9-operations-v12-20260713`
const LOCKER_MODEL_URL = `${import.meta.env.BASE_URL}models/locker-room.glb?v=locker-seams-cf212389`

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

const AIRBUS_GAME_CAMERA = 'CAM_AIRBUS_FIRST_OFFICER_GAME_VIEW'
const DC9_GAME_CAMERA = 'CAM_DC9_CAPTAIN_GAME'
const DC9_ROUTE_CAMERA = 'CAM_DC9_ROUTE_CARD_APPROVAL'
const DC9_SECURE_CAMERA = 'CAM_DC9_OVERHEAD_APPROVAL'
const AIRBUS_WIDE_GAME_FOV = 68
const AIRBUS_NARROW_GAME_FOV = 92
const AIRBUS_MIN_FOV = 50
const AIRBUS_MAX_FOV = 76
const AIRBUS_FO_EYE_POSITION = new THREE.Vector3(0.153815, 0.130133, 0.647877)
const AIRBUS_FO_EYE_QUATERNION = new THREE.Quaternion(-0.100679, 0.13991, 0.014302, 0.984929)
const AIRBUS_LOOK_YAW_LIMIT = 0.34
const AIRBUS_LOOK_PITCH_LIMIT = 0.22
const AIRBUS_LOOK_POINTER_SPEED = 0.0021
const DC9_WIDE_GAME_FOV = 64
const DC9_NARROW_GAME_FOV = 76
const DC9_ROUTE_WIDE_FOV = 50
const DC9_ROUTE_NARROW_FOV = 60
const DC9_MIN_FOV = 48
const DC9_MAX_FOV = 82
const DC9_LOOK_YAW_LEFT_LIMIT = 0.30
const DC9_LOOK_YAW_RIGHT_LIMIT = 0.72
const DC9_LOOK_PITCH_UP_LIMIT = 1.36
const DC9_LOOK_PITCH_DOWN_LIMIT = 0.42
const DC9_LOOK_POINTER_SPEED = 0.0018

function dc9ControlLabel(dataref: string) {
  const sourceName = dataref.split('/').filter(Boolean).at(-1) ?? 'cockpit control'
  return sourceName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function dc9ControlId(dataref: string, instance: number | string) {
  const slug = dataref.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')
  return `dc9.control.${slug}.${instance}`
}

type Dc9MotionChannel = {
  kind: 'rotate' | 'translate'
  dataref: string
  axis: [number, number, number] | null
  pivot: [number, number, number] | null
  keys: Array<[number, number[]]>
}

type Dc9MotionContract = {
  version: 1
  sourceDatarefs: string[]
  manipulatorInstance: number
  interaction: 'toggle' | 'drag-axis' | 'delta' | 'drag-xy' | 'inspect'
  arguments: string[]
  channels: Dc9MotionChannel[]
}

function parseDc9MotionContract(value: unknown): Dc9MotionContract | null {
  if (typeof value !== 'string') return null
  try {
    const contract = JSON.parse(value) as Partial<Dc9MotionContract>
    if (contract.version !== 1 || !Array.isArray(contract.channels) || !Array.isArray(contract.sourceDatarefs)) return null
    return contract as Dc9MotionContract
  } catch {
    return null
  }
}

function dc9SourceStem(name: string) {
  return name.replace(/_RANGE_.*$/i, '').replace(/[^a-z0-9]+/gi, '.').replace(/^\.+|\.+$/g, '').toLowerCase()
}

function interpolateDc9Channel(channel: Dc9MotionChannel, value: number) {
  const keys = channel.keys
  if (keys.length === 0) return channel.kind === 'rotate' ? [0] : [0, 0, 0]
  const exact = keys.filter(([input]) => input === value).at(-1)
  if (exact) return exact[1]
  const distinct = [...keys].sort((a, b) => a[0] - b[0])
  if (value <= distinct[0]![0]) return distinct[0]![1]
  if (value >= distinct.at(-1)![0]) return distinct.at(-1)![1]
  const upperIndex = distinct.findIndex(([input]) => input > value)
  const lower = distinct[upperIndex - 1]!
  const upper = distinct[upperIndex]!
  const amount = (value - lower[0]) / (upper[0] - lower[0])
  return lower[1].map((component, index) => THREE.MathUtils.lerp(component, upper[1][index] ?? component, amount))
}

function dc9ChannelRange(channel: Dc9MotionChannel): [number, number] {
  const inputs = channel.keys.map(([input]) => input)
  return [Math.min(...inputs), Math.max(...inputs)]
}

function applyDc9RouteCardTexture(scene: THREE.Object3D) {
  const card = scene.getObjectByName('DC9_PROP_MEM_ROUTE_CARD')
  if (!(card instanceof THREE.Mesh)) return
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const context = canvas.getContext('2d')
  if (!context) return
  context.fillStyle = '#e8dfc4'
  context.fillRect(0, 0, 512, 1024)
  context.strokeStyle = '#172728'
  context.lineWidth = 10
  context.strokeRect(14, 14, 484, 996)
  context.fillStyle = '#172728'
  context.textAlign = 'center'
  context.font = '700 48px sans-serif'
  context.fillText('MEM ROUTE STRIP', 256, 82)
  const routes = [['BTR', 'BATON ROUGE'], ['STL', 'ST. LOUIS'], ['TYS', 'KNOXVILLE'], ['LAX', 'LOS ANGELES'], ['SEA', 'SEATTLE'], ['AMS', 'AMSTERDAM']] as const
  routes.forEach(([code, city], index) => {
    const y = 175 + index * 118
    context.textAlign = 'left'
    context.strokeRect(45, y - 35, 42, 42)
    context.font = '700 34px monospace'
    context.fillText(code, 110, y)
    context.font = '600 23px sans-serif'
    context.fillText(city, 220, y)
    context.beginPath()
    context.moveTo(42, y + 35)
    context.lineTo(470, y + 35)
    context.stroke()
  })
  context.textAlign = 'center'
  context.font = '700 26px sans-serif'
  context.fillText('SELECT 3  •  VERIFY', 256, 940)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const sourceMaterial = Array.isArray(card.material) ? card.material[0] : card.material
  const material = sourceMaterial instanceof THREE.MeshStandardMaterial ? sourceMaterial.clone() : new THREE.MeshStandardMaterial()
  material.map = texture
  material.color.set(0xffffff)
  material.roughness = 0.82
  material.needsUpdate = true
  card.material = material
}

function setupDc9CaptainYoke(scene: THREE.Group) {
  const column = scene.getObjectByName('OBJ8_DC9VC2_RANGE_012')
  const wheel = scene.getObjectByName('OBJ8_DC9VC2_RANGE_013')
  if (!column || !wheel) return
  const pitchRoot = new THREE.Group()
  pitchRoot.name = 'DC9_CAPTAIN_YOKE_PITCH_ROOT'
  pitchRoot.position.set(-0.579981, -0.289439, 2.56786)
  const rollRoot = new THREE.Group()
  rollRoot.name = 'DC9_CAPTAIN_YOKE_ROLL_ROOT'
  rollRoot.position.set(-0.484682, 0.3098604, 2.4735297)
  scene.add(pitchRoot, rollRoot)
  pitchRoot.attach(column)
  rollRoot.attach(wheel)
  pitchRoot.attach(rollRoot)
  for (const part of [column, wheel]) {
    part.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.userData.dc9_direct_control = 'captain-yoke'
      object.userData.game_id = 'dc9.control.captain.yoke'
      object.userData.accessible_label = 'Captain control yoke'
      object.frustumCulled = false
    })
  }
}
const LOCKER_CAMERA_MOVE_SECONDS = 4.5
const LOCKER_MEMORY_CAMERA_MOVE_SECONDS = 1.8
const LOCKER_CLOSE_FOCUS_FOV = 30
const LOCKER_CLOSE_FOCUS_OFFSET = [-0.27, 0.37, 3.46] as const
const LOCKER_WATCH_POSITION = [0.42, -0.75, -0.21] as const
const LOCKER_BASEBALL_POSITION = [0.54, -0.48, 0.58] as const
const LOCKER_BULL_POSITION = [0.31, 0.04, 1.44] as const
const LOCKER_WINGS_POSITION = [0.42, 0.73, 0.73] as const
export type LockerCameraCue = 'entry-wide' | 'watch-focus' | 'baseball-focus' | 'bull-focus' | 'wings-focus'
type LockerCameraPose = { position: [number, number, number]; target: [number, number, number]; fov: number; duration: number }

function lockerCloseFocusPose(target: readonly [number, number, number], duration: number): LockerCameraPose {
  return {
    position: [
      target[0] + LOCKER_CLOSE_FOCUS_OFFSET[0],
      target[1] + LOCKER_CLOSE_FOCUS_OFFSET[1],
      target[2] + LOCKER_CLOSE_FOCUS_OFFSET[2],
    ],
    target: [...target],
    fov: LOCKER_CLOSE_FOCUS_FOV,
    duration,
  }
}

const LOCKER_CAMERA_POSES: Record<LockerCameraCue, LockerCameraPose> = {
  'entry-wide': { position: [0.25, 0.72, 7.6], target: [0, 0.18, 0], fov: 48, duration: LOCKER_CAMERA_MOVE_SECONDS },
  'watch-focus': lockerCloseFocusPose(LOCKER_WATCH_POSITION, LOCKER_CAMERA_MOVE_SECONDS),
  'baseball-focus': lockerCloseFocusPose(LOCKER_BASEBALL_POSITION, LOCKER_MEMORY_CAMERA_MOVE_SECONDS),
  'bull-focus': lockerCloseFocusPose(LOCKER_BULL_POSITION, LOCKER_MEMORY_CAMERA_MOVE_SECONDS),
  'wings-focus': lockerCloseFocusPose(LOCKER_WINGS_POSITION, LOCKER_MEMORY_CAMERA_MOVE_SECONDS),
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
export type Dc9LoadState = { status: 'idle' | 'loading' | 'ready' | 'error' | 'accessible-fallback'; message?: string }
export type Dc9HotspotScreenPositions = Record<string, { x: number; y: number; visible: boolean }>

interface PrototypeSceneProps {
  phase: Exclude<GamePhase, 'briefing'>
  activeDc9Controls: Dc9SecureControlId[]
  dc9ChapterStage: Dc9ChapterStage
  reducedMotion: boolean
  lockerHatRevealed: boolean
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
  onDc9LoadState: (state: Dc9LoadState) => void
  onAirbusHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
  onDc9HotspotsChange?: (positions: Dc9HotspotScreenPositions) => void
  onAirbusTarget: (control: FirstOfficerControl) => void
  onLockerCameraSettled: (cue: LockerCameraCue) => void
  onDc9Interaction: (gameId: string) => void
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
    duration: pose.duration,
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
    duration: number
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
      elapsed: immediate ? pose.duration : 0,
      duration: pose.duration,
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
    canvasRef.current.dataset.lockerCameraFov = pose.fov.toFixed(2)
    canvasRef.current.dataset.lockerCameraDistance = pose.position.distanceTo(pose.target).toFixed(3)
  }, [cue, immediate])

  useFrame((_, delta) => {
    const animation = animationRef.current
    if (!animation || animation.notified) return
    const runtimeCamera = runtimeCameraRef.current
    const canvas = canvasRef.current
    const canvasSize = sizeRef.current
    animation.elapsed = Math.min(animation.duration, animation.elapsed + delta)
    const linearProgress = immediate ? 1 : animation.elapsed / animation.duration
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
      if (canvas.dataset.dc9ControlDragging === 'true') return
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

function applyDc9GameplayCameraTransform(runtimeCamera: THREE.Camera, sourceCamera: THREE.Camera, fovOverride?: number) {
  sourceCamera.updateMatrixWorld(true)
  sourceCamera.getWorldPosition(runtimeCamera.position)
  sourceCamera.getWorldQuaternion(runtimeCamera.quaternion)
  runtimeCamera.scale.set(1, 1, 1)
  if (runtimeCamera instanceof THREE.PerspectiveCamera && sourceCamera instanceof THREE.PerspectiveCamera) {
    runtimeCamera.fov = fovOverride ?? sourceCamera.fov
    runtimeCamera.near = Math.max(0.01, sourceCamera.near)
    runtimeCamera.far = sourceCamera.far
    runtimeCamera.updateProjectionMatrix()
  }
  runtimeCamera.updateMatrix()
  runtimeCamera.updateMatrixWorld(true)
  runtimeCamera.matrixWorldInverse.copy(runtimeCamera.matrixWorld).invert()
}

function Dc9SeatLookControls({
  sourceCamera,
  cameraResetRevision,
  wideFov,
  narrowFov,
}: {
  sourceCamera: THREE.Camera
  cameraResetRevision: number
  wideFov: number
  narrowFov: number
}) {
  const { camera, gl, size } = useThree()
  const basePositionRef = useRef(new THREE.Vector3())
  const baseQuaternionRef = useRef(new THREE.Quaternion())
  const fovRef = useRef(wideFov)
  const narrowFovRef = useRef(narrowFov)
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const draggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const cameraDirtyRef = useRef(true)
  const runtimeCameraRef = useRef(camera)
  const canvasRef = useRef(gl.domElement)
  const widthRef = useRef(size.width)

  useEffect(() => {
    runtimeCameraRef.current = camera
    canvasRef.current = gl.domElement
    widthRef.current = size.width
    narrowFovRef.current = narrowFov
    cameraDirtyRef.current = true
  }, [camera, gl, narrowFov, size.width])

  useLayoutEffect(() => {
    sourceCamera.updateMatrixWorld(true)
    sourceCamera.getWorldPosition(basePositionRef.current)
    sourceCamera.getWorldQuaternion(baseQuaternionRef.current)
    fovRef.current = wideFov
    narrowFovRef.current = narrowFov
    yawRef.current = 0
    pitchRef.current = 0
    cameraDirtyRef.current = true
  }, [cameraResetRevision, narrowFov, sourceCamera, wideFov])

  useFrame(() => {
    if (!cameraDirtyRef.current) return
    const runtimeCamera = runtimeCameraRef.current
    const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current)
    const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRef.current)
    runtimeCamera.position.copy(basePositionRef.current)
    runtimeCamera.quaternion.copy(baseQuaternionRef.current).multiply(yawQuaternion).multiply(pitchQuaternion)
    if (runtimeCamera instanceof THREE.PerspectiveCamera) {
      runtimeCamera.fov = widthRef.current < 900 ? narrowFovRef.current : fovRef.current
      runtimeCamera.updateProjectionMatrix()
    }
    runtimeCamera.updateMatrix()
    runtimeCamera.updateMatrixWorld(true)
    runtimeCamera.matrixWorldInverse.copy(runtimeCamera.matrixWorld).invert()
    canvasRef.current.dataset.dc9CameraState = [
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
        yawRef.current - deltaX * DC9_LOOK_POINTER_SPEED,
        -DC9_LOOK_YAW_RIGHT_LIMIT,
        DC9_LOOK_YAW_LEFT_LIMIT,
      )
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - deltaY * DC9_LOOK_POINTER_SPEED,
        -DC9_LOOK_PITCH_UP_LIMIT,
        DC9_LOOK_PITCH_DOWN_LIMIT,
      )
      cameraDirtyRef.current = true
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      fovRef.current = THREE.MathUtils.clamp(fovRef.current + event.deltaY * 0.025, DC9_MIN_FOV, DC9_MAX_FOV)
      cameraDirtyRef.current = true
    }

    canvas.addEventListener('pointerdown', onLookStart)
    canvas.addEventListener('pointermove', onLookMove)
    canvas.addEventListener('pointerup', stopDrag)
    canvas.addEventListener('pointercancel', stopDrag)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => {
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
  const configuredMaterials = Array.isArray(object.material) ? object.material : [object.material]
  for (const material of configuredMaterials) {
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
  const baseballRevealed = availableMemories.includes('baseball')
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
        const baseball = instance.getObjectByName('LOCKER_PROP_BASEBALL')
        const wings = instance.getObjectByName('LOCKER_PROP_WINGS')
        const chargingBull = instance.getObjectByName('LOCKER_PROP_CHARGING_BULL')
        const hat = instance.getObjectByName('LOCKER_PROP_CAPTAINS_HAT')
        if (!watch || !baseball || !wings || !chargingBull || !hat) {
          throw new Error('Locker GLB is missing a required watch, baseball, Wings, Charging Bull, or captain-hat contract node.')
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
    const baseball = scene.getObjectByName('LOCKER_PROP_BASEBALL')
    const wings = scene.getObjectByName('LOCKER_PROP_WINGS')
    const chargingBull = scene.getObjectByName('LOCKER_PROP_CHARGING_BULL')
    const door = scene.getObjectByName('LOCKER_UPPER_CUBBY_DOOR')
    const light = scene.getObjectByName('LOCKER_HAT_LIGHT')
    if (hat) setLockerPropMaterialState(hat, hatRevealed)
    if (baseball) setLockerPropMaterialState(baseball, baseballRevealed)
    if (wings) setLockerPropMaterialState(wings, wingsRevealed)
    if (chargingBull) setLockerPropMaterialState(chargingBull, chargingBullRevealed)
    if (door) door.rotation.x = hatRevealed ? -1.35 : 0
    if (light instanceof THREE.Light) light.intensity = hatRevealed ? 7 : 0
    canvasRef.current.dataset.lockerHatVisual = hatRevealed ? 'revealed' : 'silhouette'
    canvasRef.current.dataset.lockerBaseballVisual = baseballRevealed ? 'revealed' : 'silhouette'
    canvasRef.current.dataset.lockerWingsVisual = wingsRevealed ? 'revealed' : 'silhouette'
    canvasRef.current.dataset.lockerBullVisual = chargingBullRevealed ? 'revealed' : 'silhouette'
  }, [baseballRevealed, chargingBullRevealed, hatRevealed, scene, wingsRevealed])

  useEffect(() => {
    if (!scene) return
    const watch = scene.getObjectByName('LOCKER_PROP_WATCH')
    const baseball = scene.getObjectByName('LOCKER_PROP_BASEBALL')
    const wings = scene.getObjectByName('LOCKER_PROP_WINGS')
    const chargingBull = scene.getObjectByName('LOCKER_PROP_CHARGING_BULL')
    const hat = scene.getObjectByName('LOCKER_PROP_CAPTAINS_HAT')
    const canvas = canvasRef.current
    canvas.dataset.lockerWatchNode = watch?.name ?? 'missing'
    canvas.dataset.lockerBaseballNode = baseball?.name ?? 'missing'
    canvas.dataset.lockerWingsNode = wings?.name ?? 'missing'
    canvas.dataset.lockerBullNode = chargingBull?.name ?? 'missing'
    canvas.dataset.lockerHatNode = hat?.name ?? 'missing'
    return () => {
      delete canvas.dataset.lockerWatchNode
      delete canvas.dataset.lockerBaseballNode
      delete canvas.dataset.lockerWingsNode
      delete canvas.dataset.lockerBullNode
      delete canvas.dataset.lockerHatNode
      delete canvas.dataset.lockerHatVisual
      delete canvas.dataset.lockerBaseballVisual
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
      <ambientLight intensity={0.71} color="#e8e3da" />
      <hemisphereLight args={['#ffe1b0', '#211815', 0.5]} />
      <directionalLight position={[3, 5, 4]} intensity={2.35} color="#ffd59a" castShadow />
      <directionalLight position={[-3.2, 2.2, 3.1]} intensity={0.78} color="#c9ddff" />
      <directionalLight position={[0, 2.8, 6]} intensity={1.04} color="#f3f5ff" />
      <spotLight position={[0.48, 1.55, 1.1]} intensity={6.5} distance={5.5} angle={0.56} penumbra={0.86} color="#f2ad62" castShadow />
      <pointLight position={[0.44, 0.34, 0.72]} intensity={hatRevealed ? 3.8 : 3.1} distance={3.8} color="#ef9d4d" />
      <pointLight position={[-1.2, 0.5, 2.4]} intensity={0.65} distance={5} color="#ffe6bd" />
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

function Dc9RuntimeLighting({ secureSteps }: { secureSteps: number }) {
  return (
    <>
      <ambientLight intensity={secureSteps >= 3 ? 0.13 : secureSteps >= 1 ? 0.23 : 0.32} color="#dce6e7" />
      <hemisphereLight args={['#d8e8ef', '#132023', secureSteps >= 2 ? 0.22 : 0.42]} />
      <directionalLight position={[-2.2, 3.2, 2.8]} intensity={secureSteps >= 3 ? 0.72 : 1.18} color="#ffe0bd" />
      <directionalLight position={[2.5, 1.9, 2.2]} intensity={secureSteps >= 1 ? 0.38 : 0.76} color="#b8d5ff" />
      <pointLight position={[-0.7, 0.75, 3.0]} intensity={secureSteps >= 2 ? 0.12 : 0.5} distance={3.2} color="#d8efff" />
    </>
  )
}

const DC9_LEGACY_ROUTE_REGISTRY_CODES = ['BTR', 'STL', 'TYS', 'LAX', 'SEA', 'AMS'] as const
const DC9_REQUIRED_NODES = [
  'DC9_ROOT', 'DC9_STATIC', 'DC9_INSTRUMENTS', 'DC9_INTERACTIVE', 'DC9_COLLIDERS', 'DC9_PUZZLE_PROPS',
  'DC9_CTRL_APU_BUSES', 'DC9_CTRL_APU_MASTER', 'DC9_CTRL_BATTERY', 'DC9_ROUTE_SUBMIT', DC9_GAME_CAMERA, DC9_ROUTE_CAMERA, DC9_SECURE_CAMERA,
  ...DC9_LEGACY_ROUTE_REGISTRY_CODES.map((code) => `DC9_ROUTE_ROW_${code}`),
] as const

const DC9_CONTROL_NODES: Record<Dc9SecureControlId, string> = {
  apuBuses: 'DC9_CTRL_APU_BUSES',
  apuMaster: 'DC9_CTRL_APU_MASTER',
  battery: 'DC9_CTRL_BATTERY',
}

const DC9_CONTROL_TRAVEL: Record<Dc9SecureControlId, number> = {
  apuBuses: THREE.MathUtils.degToRad(-40),
  apuMaster: THREE.MathUtils.degToRad(-20),
  battery: THREE.MathUtils.degToRad(-40),
}

function configureDc9Collider(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh) || object.userData.collider_only !== true) return
  object.visible = true
  object.castShadow = false
  object.receiveShadow = false
  object.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
}

function Dc9ControlAnimator({
  controls,
  activeControls,
  reducedMotion,
}: {
  controls: Partial<Record<Dc9SecureControlId, THREE.Object3D>>
  activeControls: Dc9SecureControlId[]
  reducedMotion: boolean
}) {
  const controlRefs = useRef<Partial<Record<Dc9SecureControlId, THREE.Object3D>>>({})
  useEffect(() => {
    controlRefs.current = { ...controls }
  }, [controls])
  useFrame((_, delta) => {
    for (const controlId of dc9LegacyFlow.secureControlIds) {
      const object = controlRefs.current[controlId]
      if (!object) continue
      const target = activeControls.includes(controlId) ? DC9_CONTROL_TRAVEL[controlId] : 0
      object.rotation.x = reducedMotion
        ? target
        : THREE.MathUtils.damp(object.rotation.x, target, 13, delta)
    }
  })
  return null
}

function Dc9HotspotProjector({
  targets,
  onChange,
}: {
  targets: Map<string, THREE.Object3D>
  onChange?: (positions: Dc9HotspotScreenPositions) => void
}) {
  const { camera, size } = useThree()
  const lastPayload = useRef('')
  const point = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    if (!onChange) return
    const positions: Dc9HotspotScreenPositions = {}
    for (const [gameId, object] of targets) {
      object.getWorldPosition(point)
      point.project(camera)
      positions[gameId] = {
        x: ((point.x + 1) / 2) * size.width,
        y: ((1 - point.y) / 2) * size.height,
        visible: point.z >= -1 && point.z <= 1 && point.x >= -1 && point.x <= 1 && point.y >= -1 && point.y <= 1,
      }
    }
    const payload = JSON.stringify(positions)
    if (payload !== lastPayload.current) {
      lastPayload.current = payload
      onChange(positions)
    }
  })
  useEffect(() => () => onChange?.({}), [onChange])
  return null
}

function Dc9InteractionRaycaster({
  scene,
  enabled,
  onInteraction,
  onHoverInteractive,
}: {
  scene: THREE.Group
  enabled: boolean
  onInteraction: (gameId: string) => void
  onHoverInteractive: HoverHandler
}) {
  const { camera, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const pointer = useRef(new THREE.Vector2())
  const colliders = useMemo(() => {
    const result: THREE.Mesh[] = []
    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh
        && (object.userData.collider_only === true || typeof object.userData.source_manipulator_dataref === 'string' || object.userData.dc9_direct_control === 'captain-yoke')
      ) result.push(object)
    })
    return result
  }, [scene])

  useEffect(() => {
    if (!enabled) return
    const canvas = gl.domElement
    let pointerDownAt: { x: number; y: number } | null = null
    let dragged = false
    const donorValues = new Map<string, number>()
    const donorBases = new Map<string, { position: THREE.Vector3; quaternion: THREE.Quaternion }>()
    let activeYoke: { startX: number; startY: number } | null = null
    let activeDonor: {
      root: THREE.Object3D
      contract: Dc9MotionContract
      start: { x: number; y: number }
      values: Map<string, number>
    } | null = null
    let hoveredDonor: { gameId: string; object: THREE.Object3D } | null = null
    const donorRoot = (object: THREE.Object3D) => {
      const rootName = object.userData.source_motion_root_name
      return typeof rootName === 'string' ? scene.getObjectByName(rootName) ?? null : null
    }
    const valueFor = (channel: Dc9MotionChannel) => {
      const range = dc9ChannelRange(channel)
      return donorValues.get(channel.dataref) ?? range[0]
    }
    const applyDonorMotion = (root: THREE.Object3D, contract: Dc9MotionContract) => {
      let base = donorBases.get(root.uuid)
      if (!base) {
        base = { position: root.position.clone(), quaternion: root.quaternion.clone() }
        donorBases.set(root.uuid, base)
      }
      root.position.copy(base.position)
      root.quaternion.copy(base.quaternion)
      for (const channel of contract.channels) {
        const range = dc9ChannelRange(channel)
        const initial = interpolateDc9Channel(channel, range[0])
        const output = interpolateDc9Channel(channel, valueFor(channel))
        if (channel.kind === 'translate') {
          root.position.add(new THREE.Vector3(
            (output[0] ?? 0) - (initial[0] ?? 0),
            (output[1] ?? 0) - (initial[1] ?? 0),
            (output[2] ?? 0) - (initial[2] ?? 0),
          ))
        } else if (channel.axis) {
          const delta = THREE.MathUtils.degToRad((output[0] ?? 0) - (initial[0] ?? 0))
          const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...channel.axis).normalize(), delta)
          root.quaternion.multiply(rotation)
        }
      }
      root.updateMatrixWorld(true)
    }
    const setContractValue = (root: THREE.Object3D, contract: Dc9MotionContract, dataref: string, value: number) => {
      const channel = contract.channels.find((candidate) => candidate.dataref === dataref)
      if (!channel) return
      const [minimum, maximum] = dc9ChannelRange(channel)
      donorValues.set(dataref, THREE.MathUtils.clamp(value, minimum, maximum))
      canvas.dataset.dc9LastMotionControl = root.name
      canvas.dataset.dc9LastMotionValue = donorValues.get(dataref)!.toFixed(4)
      scene.traverse((candidate) => {
        const candidateContract = parseDc9MotionContract(candidate.userData.source_motion_contract_json)
        if (candidateContract?.sourceDatarefs.includes(dataref)) applyDonorMotion(candidate, candidateContract)
      })
      window.dispatchEvent(new CustomEvent('dc9-control-change', { detail: { dataref, value: donorValues.get(dataref)! } }))
      applyDonorMotion(root, contract)
    }
    const controlState = (object: THREE.Object3D) => {
      if (object.userData.dc9_direct_control === 'captain-yoke') return 'drag pitch / roll'
      const root = donorRoot(object)
      const contract = root ? parseDc9MotionContract(root.userData.source_motion_contract_json) : null
      if (!contract || contract.interaction === 'inspect' || contract.channels.length === 0) return 'inspect only'
      const channel = contract.channels[0]!
      const [minimum, maximum] = dc9ChannelRange(channel)
      const value = valueFor(channel)
      if (contract.interaction === 'toggle') return Math.abs(value - maximum) < Math.abs(value - minimum) ? 'ON' : 'OFF'
      return `${value.toFixed(2)} / ${maximum.toFixed(2)}`
    }
    const pick = (event: MouseEvent | PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.current.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.current.setFromCamera(pointer.current, camera)
      const hit = raycaster.current.intersectObjects(colliders.filter((collider) => collider.visible), false)[0]
      const gameId = hit?.object.userData.collider_target_game_id ?? hit?.object.userData.game_id
      return hit && typeof gameId === 'string' ? { gameId, object: hit.object } : null
    }
    const onPointerDown = (event: PointerEvent) => {
      pointerDownAt = { x: event.clientX, y: event.clientY }
      dragged = false
      const hit = pick(event)
      if (hit) canvas.focus({ preventScroll: true })
      if (hit && (hit.gameId === 'dc9.control.captain.yoke' || hit.object.userData.dc9_direct_control === 'captain-yoke')) {
        activeYoke = { startX: event.clientX, startY: event.clientY }
        canvas.dataset.dc9ControlDragging = 'true'
        canvas.setPointerCapture(event.pointerId)
        event.preventDefault()
        event.stopPropagation()
        return
      }
      const root = hit ? donorRoot(hit.object) : null
      const contract = root ? parseDc9MotionContract(root.userData.source_motion_contract_json) : null
      if (root && contract && !['toggle', 'inspect'].includes(contract.interaction)) {
        activeDonor = {
          root,
          contract,
          start: { x: event.clientX, y: event.clientY },
          values: new Map(contract.channels.map((channel) => [channel.dataref, valueFor(channel)])),
        }
        canvas.dataset.dc9ControlDragging = 'true'
        canvas.setPointerCapture(event.pointerId)
        event.preventDefault()
        event.stopPropagation()
      }
    }
    const onMove = (event: PointerEvent) => {
      if (activeYoke) {
        const pitch = THREE.MathUtils.clamp(-(event.clientY - activeYoke.startY) / 130, -1, 1)
        const roll = THREE.MathUtils.clamp((event.clientX - activeYoke.startX) / 130, -1, 1)
        const pitchRoot = scene.getObjectByName('DC9_CAPTAIN_YOKE_PITCH_ROOT')
        const rollRoot = scene.getObjectByName('DC9_CAPTAIN_YOKE_ROLL_ROOT')
        if (pitchRoot) pitchRoot.rotation.x = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(-10, 15, (pitch + 1) / 2))
        if (rollRoot) rollRoot.rotation.y = THREE.MathUtils.degToRad(-90 * roll)
        canvas.dataset.dc9LastMotionControl = 'captain-yoke'
        canvas.dataset.dc9LastMotionValue = `${pitch.toFixed(3)},${roll.toFixed(3)}`
        window.dispatchEvent(new CustomEvent('dc9-control-change', { detail: { dataref: 'dc9/yoke/pitch', value: pitch } }))
        window.dispatchEvent(new CustomEvent('dc9-control-change', { detail: { dataref: 'dc9/yoke/roll', value: roll } }))
        dragged = true
        event.preventDefault()
      } else if (activeDonor) {
        const active = activeDonor
        const deltaX = event.clientX - active.start.x
        const deltaY = event.clientY - active.start.y
        const { contract, root } = active
        const uniqueChannels = [...new Map(contract.channels.map((channel) => [channel.dataref, channel])).values()]
        if (contract.interaction === 'drag-axis') {
          const numbers = contract.arguments.slice(1).map(Number).filter(Number.isFinite)
          const direction = new THREE.Vector2(numbers[0] || 0, -(numbers[1] || 1)).normalize()
          const projected = deltaX * direction.x + deltaY * direction.y
          for (const channel of uniqueChannels) {
            const [minimum, maximum] = dc9ChannelRange(channel)
            setContractValue(root, contract, channel.dataref, (active.values.get(channel.dataref) ?? minimum) + projected / 160 * (maximum - minimum))
          }
        } else if (contract.interaction === 'delta') {
          for (const channel of uniqueChannels) {
            const detents = [...new Set(channel.keys.map(([input]) => input))].sort((a, b) => a - b)
            const startValue = active.values.get(channel.dataref) ?? detents[0]!
            const startIndex = detents.reduce((best, value, index) => Math.abs(value - startValue) < Math.abs(detents[best]! - startValue) ? index : best, 0)
            const nextIndex = THREE.MathUtils.clamp(startIndex + Math.round(-deltaY / 24), 0, detents.length - 1)
            setContractValue(root, contract, channel.dataref, detents[nextIndex]!)
          }
        } else if (contract.interaction === 'drag-xy') {
          uniqueChannels.forEach((channel, index) => {
            const [minimum, maximum] = dc9ChannelRange(channel)
            const delta = index === 0 ? deltaX : -deltaY
            setContractValue(root, contract, channel.dataref, (active.values.get(channel.dataref) ?? minimum) + delta / 160 * (maximum - minimum))
          })
        }
        dragged = true
      }
      if (pointerDownAt && Math.hypot(event.clientX - pointerDownAt.x, event.clientY - pointerDownAt.y) > 6) {
        dragged = true
      }
      const hit = pick(event)
      hoveredDonor = hit
      onHoverInteractive(Boolean(hit))
      const hoverLabel = hit ? `${hit.object.userData.accessible_label ?? 'Cockpit control'} - ${controlState(hit.object)}` : ''
      canvas.title = hoverLabel
      if (canvas.parentElement) {
        if (hoverLabel) canvas.parentElement.dataset.dc9HoverLabel = hoverLabel
        else delete canvas.parentElement.dataset.dc9HoverLabel
      }
    }
    const onClick = (event: MouseEvent) => {
      pointerDownAt = null
      if (dragged) {
        dragged = false
        return
      }
      const hit = pick(event)
      if (!hit) return
      const root = donorRoot(hit.object)
      const contract = root ? parseDc9MotionContract(root.userData.source_motion_contract_json) : null
      if (root && contract) {
        if (contract.interaction === 'toggle' && contract.channels.length > 0) {
          const channel = contract.channels[0]!
          const [minimum, maximum] = dc9ChannelRange(channel)
          const current = valueFor(channel)
          setContractValue(root, contract, channel.dataref, Math.abs(current - minimum) < Math.abs(current - maximum) ? maximum : minimum)
        }
        event.preventDefault()
        event.stopPropagation()
        return
      }
      event.preventDefault()
      event.stopPropagation()
      onInteraction(hit.gameId)
    }
    const stepDonor = (event: WheelEvent | KeyboardEvent, direction: number) => {
      const keyboardRootName = canvas.dataset.dc9KeyboardControl
      const hoveredRoot = hoveredDonor ? donorRoot(hoveredDonor.object) : null
      const root = hoveredRoot ?? (typeof keyboardRootName === 'string' ? scene.getObjectByName(keyboardRootName) ?? null : null)
      const contract = root ? parseDc9MotionContract(root.userData.source_motion_contract_json) : null
      if (!root || !contract || contract.channels.length === 0 || contract.interaction === 'inspect') return
      const channel = contract.channels[0]!
      const [minimum, maximum] = dc9ChannelRange(channel)
      if (contract.interaction === 'toggle') {
        const current = valueFor(channel)
        setContractValue(root, contract, channel.dataref, Math.abs(current - minimum) < Math.abs(current - maximum) ? maximum : minimum)
      } else if (contract.interaction === 'delta') {
        const detents = [...new Set(channel.keys.map(([input]) => input))].sort((a, b) => a - b)
        const current = valueFor(channel)
        const index = detents.reduce((best, value, candidate) => Math.abs(value - current) < Math.abs(detents[best]! - current) ? candidate : best, 0)
        setContractValue(root, contract, channel.dataref, detents[THREE.MathUtils.clamp(index + direction, 0, detents.length - 1)]!)
      } else {
        setContractValue(root, contract, channel.dataref, valueFor(channel) + direction * (maximum - minimum) * 0.05)
      }
      event.preventDefault()
      event.stopPropagation()
    }
    const onWheelControl = (event: WheelEvent) => stepDonor(event, event.deltaY > 0 ? -1 : 1)
    const onKeyControl = (event: KeyboardEvent) => {
      if (document.activeElement !== canvas) return
      if (event.key === 'Enter' || event.key === ' ') stepDonor(event, 1)
      else if (event.key === 'ArrowUp' || event.key === 'ArrowRight') stepDonor(event, 1)
      else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') stepDonor(event, -1)
    }
    const clear = () => {
      pointerDownAt = null
      dragged = false
      activeDonor = null
      activeYoke = null
      hoveredDonor = null
      delete canvas.dataset.dc9ControlDragging
      onHoverInteractive(false)
      canvas.title = ''
      if (canvas.parentElement) delete canvas.parentElement.dataset.dc9HoverLabel
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('wheel', onWheelControl, { passive: false })
    window.addEventListener('keydown', onKeyControl)
    canvas.addEventListener('pointerup', clear)
    canvas.addEventListener('pointercancel', clear)
    canvas.addEventListener('pointerleave', clear)
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('wheel', onWheelControl)
      window.removeEventListener('keydown', onKeyControl)
      canvas.removeEventListener('pointerup', clear)
      canvas.removeEventListener('pointercancel', clear)
      canvas.removeEventListener('pointerleave', clear)
      clear()
    }
  }, [camera, colliders, enabled, gl, onHoverInteractive, onInteraction, scene])
  return null
}

function Dc9Cockpit({
  cameraResetRevision,
  activeControls,
  chapterStage,
  phase,
  reducedMotion,
  interactionEnabled,
  onLoadState,
  onHotspotsChange,
  onInteraction,
  onHoverInteractive,
}: {
  cameraResetRevision: number
  activeControls: Dc9SecureControlId[]
  chapterStage: Dc9ChapterStage
  phase: 'captain' | 'reward' | 'mars'
  reducedMotion: boolean
  interactionEnabled: boolean
  onLoadState: (state: Dc9LoadState) => void
  onHotspotsChange?: (positions: Dc9HotspotScreenPositions) => void
  onInteraction: (gameId: string) => void
  onHoverInteractive: HoverHandler
}) {
  const { camera, gl, size } = useThree()
  const [loaded, setLoaded] = useState<{
    scene: THREE.Group
    camera: THREE.Camera
    routeCamera: THREE.Camera
    secureCamera: THREE.Camera
    controls: Partial<Record<Dc9SecureControlId, THREE.Object3D>>
    targets: Map<string, THREE.Object3D>
  } | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const canvasRef = useRef(gl.domElement)

  useEffect(() => {
    canvasRef.current = gl.domElement
  }, [gl])

  useEffect(() => {
    let active = true
    const canvas = canvasRef.current
    onLoadState({ status: 'loading' })
    canvas.dataset.dc9ModelState = 'loading'
    loadCockpitModel(DC9_MODEL_URL)
      .then((source) => {
        if (!active) return
        const scene = source.clone(true)
        applyDc9RouteCardTexture(scene)
        setupDc9CaptainYoke(scene)
        const donorMeshes: THREE.Mesh[] = []
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh && parseDc9MotionContract(object.userData.source_motion_contract_json)) donorMeshes.push(object)
        })
        const donorGroups = new Map<string, { root: THREE.Group; contract: Dc9MotionContract }>()
        const donorPhysicalControls = new Set<string>()
        for (const mesh of donorMeshes) {
          const contract = parseDc9MotionContract(mesh.userData.source_motion_contract_json)
          if (!contract) continue
          const stem = dc9SourceStem(mesh.name)
          const key = `${stem}:${contract.manipulatorInstance}`
          donorPhysicalControls.add(key)
          if (contract.channels.length === 0) continue
          let entry = donorGroups.get(key)
          if (!entry) {
            const pivot = contract.channels.find((channel) => channel.pivot)?.pivot ?? [0, 0, 0]
            const root = new THREE.Group()
            root.name = `DC9_SOURCE_PIVOT_${stem.toUpperCase()}_${contract.manipulatorInstance}`
            root.position.set(...pivot)
            root.userData.source_motion_contract_json = mesh.userData.source_motion_contract_json
            scene.add(root)
            entry = { root, contract }
            donorGroups.set(key, entry)
          }
          entry.root.attach(mesh)
          mesh.userData.source_motion_root_name = entry.root.name
        }
        const missingNodes = DC9_REQUIRED_NODES.filter((nodeName) => !scene.getObjectByName(nodeName))
        if (missingNodes.length > 0) throw new Error(`DC-9 contract missing: ${missingNodes.join(', ')}`)
        const targets = new Map<string, THREE.Object3D>()
        const colliderTargets = new Map<string, THREE.Object3D>()
        scene.traverse((object) => {
          if (object instanceof THREE.Light) {
            object.visible = false
            object.intensity = 0
          }
          if (object instanceof THREE.Mesh) {
            configureDc9Collider(object)
            object.frustumCulled = false
            object.castShadow = true
            object.receiveShadow = true
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            for (const material of materials) {
              if (!(material instanceof THREE.MeshStandardMaterial) || !material.name.startsWith('OBJ8_')) continue
              if (material.name === 'OBJ8_Glass_DAY') continue
              // OBJ8 import retains X-Plane alpha attributes, but the shell atlases
              // are opaque. Treating every draw range as blended sorts the yoke and
              // pedestal behind the floor. Only the native gauge cutouts need alpha.
              material.transparent = false
              material.alphaTest = material.name === 'OBJ8_DC9-32_cockpit_DAY' ? 0.5 : 0
              material.depthWrite = true
              material.needsUpdate = true
            }
            const sourceDataref = object.userData.source_manipulator_dataref
            const sourceInstance = object.userData.source_manipulator_instance
            if (typeof sourceDataref === 'string' && sourceDataref && sourceInstance !== undefined) {
              object.userData.game_id = dc9ControlId(`${dc9SourceStem(object.name)}.${sourceDataref}`, sourceInstance)
              object.userData.accessible_label = dc9ControlLabel(sourceDataref)
              object.userData.interaction = 'inspect'
              object.userData.inspect_only = true
            }
          }
          if (typeof object.userData.game_id === 'string') {
            const isDonorControl = object.userData.game_id.startsWith('dc9.control.')
            if (targets.has(object.userData.game_id) && !isDonorControl) {
              throw new Error(`Duplicate DC-9 game_id: ${object.userData.game_id}`)
            }
            if (!targets.has(object.userData.game_id)) targets.set(object.userData.game_id, object)
          }
          if (typeof object.userData.collider_target_game_id === 'string') {
            colliderTargets.set(object.userData.collider_target_game_id, object)
          }
        })
        for (const [gameId, collider] of colliderTargets) targets.set(gameId, collider)
        scene.updateMatrixWorld(true)
        const sourceCamera = scene.getObjectByName(DC9_GAME_CAMERA)
        if (!(sourceCamera instanceof THREE.Camera)) {
          throw new Error(`DC-9 cockpit asset is missing required camera ${DC9_GAME_CAMERA}.`)
        }
        const routeCamera = scene.getObjectByName(DC9_ROUTE_CAMERA)
        if (!(routeCamera instanceof THREE.Camera)) {
          throw new Error(`DC-9 cockpit asset is missing required camera ${DC9_ROUTE_CAMERA}.`)
        }
        const secureCamera = scene.getObjectByName(DC9_SECURE_CAMERA)
        if (!(secureCamera instanceof THREE.Camera)) {
          throw new Error(`DC-9 cockpit asset is missing required camera ${DC9_SECURE_CAMERA}.`)
        }
        const controls = Object.fromEntries(
          dc9LegacyFlow.secureControlIds.map((controlId) => [controlId, scene.getObjectByName(DC9_CONTROL_NODES[controlId])]),
        ) as Partial<Record<Dc9SecureControlId, THREE.Object3D>>
        setLoadFailed(false)
        setLoaded({ scene, camera: sourceCamera, routeCamera, secureCamera, controls, targets })
        canvas.dataset.dc9ModelState = 'ready'
        canvas.dataset.dc9CameraNode = sourceCamera.name
        canvas.dataset.dc9TargetCount = String(targets.size)
        canvas.dataset.dc9AnimatedControlCount = String(donorGroups.size)
        canvas.dataset.dc9InspectOnlyControlCount = String(donorPhysicalControls.size - donorGroups.size)
        canvas.dataset.dc9KeyboardControl = [...donorGroups.values()].find(({ contract }) =>
          contract.sourceDatarefs.includes('sim/cockpit2/engine/actuators/mixture_ratio[0]'))?.root.name ?? ''
        canvas.dataset.dc9Targets = [...targets.keys()].join(',')
        onLoadState({ status: 'ready' })
      })
      .catch((error) => {
        cockpitModelCache.delete(DC9_MODEL_URL)
        console.error('Failed to load DC-9 cockpit asset.', error)
        if (!active) return
        setLoadFailed(true)
        setLoaded(null)
        canvas.dataset.dc9ModelState = 'fallback'
        onLoadState({ status: 'error', message: error instanceof Error ? error.message : 'DC-9 cockpit failed to load.' })
      })
    return () => {
      active = false
      delete canvas.dataset.dc9ModelState
      delete canvas.dataset.dc9CameraNode
      delete canvas.dataset.dc9CameraState
      delete canvas.dataset.dc9TargetCount
      delete canvas.dataset.dc9AnimatedControlCount
      delete canvas.dataset.dc9InspectOnlyControlCount
      delete canvas.dataset.dc9KeyboardControl
      delete canvas.dataset.dc9LastMotionControl
      delete canvas.dataset.dc9LastMotionValue
      delete canvas.dataset.dc9Targets
    }
  }, [gl, onLoadState])

  useLayoutEffect(() => {
    if (!loaded) return
    const routeStage = phase === 'captain' && (chapterStage === 'intro' || chapterStage === 'routeRecord' || chapterStage === 'homeOperations')
    const shutdownStage = phase === 'captain' && chapterStage === 'shutdown'
    const sourceCamera = routeStage ? loaded.routeCamera : shutdownStage ? loaded.secureCamera : loaded.camera
    const wideFov = routeStage ? DC9_ROUTE_WIDE_FOV : DC9_WIDE_GAME_FOV
    const narrowFov = routeStage ? DC9_ROUTE_NARROW_FOV : DC9_NARROW_GAME_FOV
    loaded.scene.updateMatrixWorld(true)
    applyDc9GameplayCameraTransform(
      camera,
      sourceCamera,
      size.width < 900 ? narrowFov : wideFov,
    )
    canvasRef.current.dataset.dc9CameraNode = sourceCamera.name
  }, [camera, chapterStage, loaded, phase, size.width])

  useLayoutEffect(() => {
    if (!loaded) return
    const routeInteractive = phase === 'captain' && (chapterStage === 'intro' || chapterStage === 'routeRecord')
    const shutdownInteractive = phase === 'captain' && chapterStage === 'shutdown'
    const routeProps = loaded.scene.getObjectByName('DC9_PUZZLE_PROPS')
    if (routeProps) routeProps.visible = false
    loaded.scene.traverse((object) => {
      const gameId = object.userData.collider_target_game_id
      if (typeof gameId !== 'string') return
      if (gameId.startsWith('dc9.route.')) object.visible = routeInteractive
      else if (gameId.startsWith('dc9.secure.')) object.visible = shutdownInteractive
    })
  }, [chapterStage, loaded, phase])

  return (
    <>
      <color attach="background" args={['#070b0d']} />
      <Dc9RuntimeLighting secureSteps={activeControls.length} />
      {loaded && !loadFailed ? (
        <>
          <primitive object={loaded.scene} dispose={null} />
          <Dc9SeatLookControls
            sourceCamera={phase === 'captain' && (chapterStage === 'intro' || chapterStage === 'routeRecord' || chapterStage === 'homeOperations')
              ? loaded.routeCamera
              : phase === 'captain' && chapterStage === 'shutdown'
                ? loaded.secureCamera
                : loaded.camera}
            cameraResetRevision={cameraResetRevision}
            wideFov={phase === 'captain' && (chapterStage === 'intro' || chapterStage === 'routeRecord' || chapterStage === 'homeOperations') ? DC9_ROUTE_WIDE_FOV : DC9_WIDE_GAME_FOV}
            narrowFov={phase === 'captain' && (chapterStage === 'intro' || chapterStage === 'routeRecord' || chapterStage === 'homeOperations') ? DC9_ROUTE_NARROW_FOV : DC9_NARROW_GAME_FOV}
          />
          <Dc9ControlAnimator controls={loaded.controls} activeControls={activeControls} reducedMotion={reducedMotion} />
          <Dc9HotspotProjector targets={loaded.targets} onChange={onHotspotsChange} />
          <Dc9InteractionRaycaster
            scene={loaded.scene}
            enabled={interactionEnabled}
            onInteraction={onInteraction}
            onHoverInteractive={onHoverInteractive}
          />
        </>
      ) : (
        <mesh receiveShadow position={[0, 0.18, 0]}>
          <boxGeometry args={[3.4, 2.45, 0.35]} />
          <meshStandardMaterial color="#3c5258" roughness={0.82} />
        </mesh>
      )}
    </>
  )
}

function CaptainCockpit({
  activeControls,
  chapterStage,
  reducedMotion,
  phase,
  cameraResetRevision,
  onLoadState,
  onHotspotsChange,
  onInteraction,
  onMars,
  onHoverInteractive,
}: {
  activeControls: Dc9SecureControlId[]
  chapterStage: Dc9ChapterStage
  reducedMotion: boolean
  phase: 'captain' | 'reward' | 'mars'
  cameraResetRevision: number
  onLoadState: (state: Dc9LoadState) => void
  onHotspotsChange?: (positions: Dc9HotspotScreenPositions) => void
  onInteraction: (gameId: string) => void
  onMars: () => void
  onHoverInteractive: HoverHandler
}) {
  return (
    <>
      <Dc9Cockpit
        cameraResetRevision={cameraResetRevision}
        activeControls={activeControls}
        chapterStage={chapterStage}
        phase={phase}
        reducedMotion={reducedMotion}
        interactionEnabled={phase === 'captain'}
        onLoadState={onLoadState}
        onHotspotsChange={onHotspotsChange}
        onInteraction={onInteraction}
        onHoverInteractive={onHoverInteractive}
      />
      {phase !== 'captain' && <mesh
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
      </mesh>}
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
  activeDc9Controls,
  dc9ChapterStage,
  reducedMotion,
  lockerHatRevealed,
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
  onDc9LoadState,
  onAirbusHotspotsChange,
  onDc9HotspotsChange,
  onAirbusTarget,
  onLockerCameraSettled,
  onDc9Interaction,
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
        tabIndex={0}
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
            activeControls={activeDc9Controls}
            chapterStage={dc9ChapterStage}
            reducedMotion={reducedMotion}
            phase={phase}
            cameraResetRevision={cameraResetRevision}
            onLoadState={onDc9LoadState}
            onHotspotsChange={onDc9HotspotsChange}
            onInteraction={onDc9Interaction}
            onMars={onMars}
            onHoverInteractive={onInteractiveHover}
          />
        )}
        {(phase === 'reward' || phase === 'mars') && (
          <LimitedOrbitControls airbusCameraRevision={cameraResetRevision} />
        )}
      </Canvas>
      {phase !== 'airbus' && phase !== 'locker' && (
        <div className="prototype-badge">
          {phase === 'captain' ? 'GREYBOX — DC-9 FINAL FLIGHT LOG' : 'HANGAR VIEW'}
        </div>
      )}
    </div>
  )
}
