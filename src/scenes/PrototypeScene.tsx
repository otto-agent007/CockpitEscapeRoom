import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { OrbitControls as ThreeOrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { firstOfficerFlow, type FirstOfficerControl } from '../game/config'
import { type GamePhase, type SwitchId } from '../game/state'

// Cockpit shells produced by the asset pipeline and served from public/models.
const AIRBUS_MODEL_URL = `${import.meta.env.BASE_URL}models/airbus-first-officer.glb`
const DC9_MODEL_URL = `${import.meta.env.BASE_URL}models/dc9-cockpit.glb`

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
const AIRBUS_FO_EYE_POSITION = new THREE.Vector3(0.153815, 0.130133, 0.647877)
const AIRBUS_FO_EYE_QUATERNION = new THREE.Quaternion(-0.100679, 0.13991, 0.014302, 0.984929)
const AIRBUS_LOOK_YAW_LIMIT = 0.34
const AIRBUS_LOOK_PITCH_LIMIT = 0.22
const AIRBUS_LOOK_POINTER_SPEED = 0.0021
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

interface PrototypeSceneProps {
  phase: Exclude<GamePhase, 'briefing'>
  activeSwitches: SwitchId[]
  lockerHatRevealed: boolean
  captainRewardUnlocked: boolean
  reducedMotion: boolean
  selectedAirbusCard: string | null
  onAirbusReady: () => void
  onAirbusHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
  onAirbusTarget: (control: FirstOfficerControl) => void
  onSwitch: (switchId: SwitchId) => void
  onMars: () => void
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
    controlsRef.current = controls

    return () => {
      controlsRef.current = null
      controls.dispose()
    }
  }, [airbusCameraRevision, camera, gl])

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
      const fov = size.width < 900 ? AIRBUS_NARROW_GAME_FOV : AIRBUS_WIDE_GAME_FOV
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

    canvas.addEventListener('pointerdown', onLookStart)
    canvas.addEventListener('pointermove', onLookMove)
    canvas.addEventListener('pointerup', stopDrag)
    canvas.addEventListener('pointercancel', stopDrag)

    return () => {
      draggingRef.current = false
      canvas.removeEventListener('pointerdown', onLookStart)
      canvas.removeEventListener('pointermove', onLookMove)
      canvas.removeEventListener('pointerup', stopDrag)
      canvas.removeEventListener('pointercancel', stopDrag)
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

function AirbusLoadingFallback({ reducedMotion }: { reducedMotion: boolean }) {
  const gauge = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!gauge.current || reducedMotion) return
    gauge.current.rotation.z = THREE.MathUtils.damp(gauge.current.rotation.z, Math.sin(Date.now() / 1000) * 0.2, 1.5, delta)
  })

  return (
    <>
      <color attach="background" args={['#c7dce4']} />
      <ambientLight intensity={0.75} />
      <pointLight position={[2.4, 4, 3]} intensity={1.2} color="#f7fafb" />
      <pointLight position={[-2.1, 2.4, 2.1]} intensity={0.85} color="#7a8ea5" />
      <mesh position={[0, 0, 0]} rotation={[0, 0.02, 0]}>
        <boxGeometry args={[3.35, 2.35, 0.28]} />
        <meshStandardMaterial color="#edf3ff" roughness={0.82} />
      </mesh>
      <mesh position={[-0.22, 0.24, 0.16]}>
        <boxGeometry args={[1.7, 0.85, 0.11]} />
        <meshStandardMaterial color="#2b3a55" roughness={0.18} metalness={0.65} />
      </mesh>
      <mesh ref={gauge} position={[-0.35, 0.6, 0.25]}>
        <ringGeometry args={[0.12, 0.18, 28]} />
        <meshStandardMaterial color="#152033" />
      </mesh>
    </>
  )
}

function AirbusCockpit({
  reducedMotion,
  selectedAirbusCard,
  onCameraReady,
  onAirbusHotspotsChange,
  onAirbusTarget,
  onHoverInteractive,
}: {
  reducedMotion: boolean
  selectedAirbusCard: string | null
  onCameraReady: () => void
  onAirbusHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
  onAirbusTarget: (control: FirstOfficerControl) => void
  onHoverInteractive: HoverHandler
}) {
  const { camera, size } = useThree()
  const [loaded, setLoaded] = useState<LoadedAirbusScene | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loader = new GLTFLoader()

    loader.load(
      AIRBUS_MODEL_URL,
      (gltf) => {
        if (cancelled) return
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
      },
      undefined,
      (error) => {
        if (cancelled) return
        console.error('Failed to load A320 cockpit asset.', error)
        setLoadFailed(true)
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    if (!loaded?.camera) return
    loaded.scene.updateMatrixWorld(true)
    applyAirbusGameplayCameraTransform(camera, loaded.camera, size.width < 900 ? AIRBUS_NARROW_GAME_FOV : AIRBUS_WIDE_GAME_FOV)
    onAirbusHotspotsChange?.(projectAirbusHotspots(camera, { width: size.width, height: size.height }, loaded.targetPivots))
    onCameraReady()
  }, [camera, loaded, onAirbusHotspotsChange, onCameraReady, size.height, size.width])

  return (
    <>
      <color attach="background" args={['#172123']} />
      <AirbusRuntimeLighting />
      {loaded && !loadFailed ? (
        <>
          <primitive object={loaded.scene} />
          <AirbusSeatLookControls airbusCameraRevision={size.width} />
          <AirbusHotspotProjector targetPivots={loaded.targetPivots} onHotspotsChange={onAirbusHotspotsChange} />
          <AirbusTargetRaycaster
            scene={loaded.scene}
            selectedAirbusCard={selectedAirbusCard}
            onTarget={onAirbusTarget}
            onHoverInteractive={onHoverInteractive}
          />
        </>
      ) : (
        <AirbusLoadingFallback reducedMotion={reducedMotion} />
      )}
    </>
  )
}

function LockerCocoon({ hatRevealed, onLockerHat, onHoverInteractive }: { hatRevealed: boolean; onLockerHat: () => void; onHoverInteractive: HoverHandler }) {
  return (
    <>
      <color attach="background" args={['#211a19']} />
      <ambientLight intensity={0.45} />
      <pointLight position={[0.2, 1.75, 0.55]} intensity={1.35} color={hatRevealed ? '#f0a44d' : '#3a2a20'} />
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[3.55, 2.05, 0.24]} />
        <meshStandardMaterial color="#57403e" roughness={0.78} metalness={0.2} />
      </mesh>
      <mesh position={[0.0, 0.08, -0.1]}>
        <boxGeometry args={[1.2, 0.35, 0.22]} />
        <meshStandardMaterial color="#b88d63" />
      </mesh>
      <mesh
        position={[0, 0.46, 0.24]}
        onClick={(event) => {
          event.stopPropagation()
          if (hatRevealed) onLockerHat()
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
      >
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial
          color={hatRevealed ? '#a8a09b' : '#1b1514'}
          emissive={hatRevealed ? '#a26a2a' : '#000000'}
        />
      </mesh>
      <mesh position={[0, 0.05, -0.52]} />
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
  reducedMotion,
  selectedAirbusCard,
  onAirbusReady,
  onAirbusHotspotsChange,
  onAirbusTarget,
  onSwitch,
  onMars,
  onLockerHat,
}: PrototypeSceneProps) {
  const onInteractiveHover = useInteractiveCursor()

  return (
    <div className="scene" aria-label="Interactive 3D scene">
      <Canvas
        camera={{ position: [0, 0.25, 5.6], fov: 42 }}
        dpr={[1, 1.5]}
        shadows="percentage"
        fallback={<div className="canvas-fallback">WebGL is unavailable. Use the mirrored HTML controls.</div>}
      >
        {phase === 'airbus' && (
          <AirbusCockpit
            reducedMotion={reducedMotion}
            selectedAirbusCard={selectedAirbusCard}
            onCameraReady={onAirbusReady}
            onAirbusHotspotsChange={onAirbusHotspotsChange}
            onAirbusTarget={onAirbusTarget}
            onHoverInteractive={onInteractiveHover}
          />
        )}
        {phase === 'locker' && (
          <LockerCocoon
            hatRevealed={lockerHatRevealed}
            onLockerHat={onLockerHat}
            onHoverInteractive={onInteractiveHover}
          />
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

        {phase !== 'airbus' && (
          <LimitedOrbitControls airbusCameraRevision={0} />
        )}
      </Canvas>
      <div className="prototype-badge">
        {phase === 'airbus'
          ? 'A320 PLAYABLE PROOF'
          : phase === 'locker'
            ? 'LOCKER REVEAL SCENE'
            : phase === 'captain'
              ? 'GREYBOX — DC-9 CAPTAIN FLOW'
              : 'HANGAR VIEW'}
      </div>
    </div>
  )
}
