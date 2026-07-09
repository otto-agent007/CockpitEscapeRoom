import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { OrbitControls as ThreeOrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { type FirstOfficerControl } from '../game/config'
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
const AIRBUS_FO_SEAT_OFFSET = new THREE.Vector3(0.18, 0.015, 0)
const AIRBUS_FO_SEAT_YAW = 0.24
const AIRBUS_LOOK_YAW_LIMIT = 0.34
const AIRBUS_LOOK_PITCH_LIMIT = 0.22
const AIRBUS_LOOK_POINTER_SPEED = 0.0021
const AIRBUS_HOTSPOT_ANCHORS: Record<FirstOfficerControl, THREE.Vector3> = {
  sidestick: new THREE.Vector3(0.138, 0.039, 0.501),
  thrust: new THREE.Vector3(-0.033, 0.019, 0.509),
  gear: new THREE.Vector3(0.021, 0.077, 0.486),
  radio: new THREE.Vector3(-0.006, 0.019, 0.509),
  altitude: new THREE.Vector3(0, 0.147, 0.458),
}
const AIRBUS_SKETCHFAB_POSTPROCESS_SHADER = {
  name: 'AirbusSketchfabPostProcess',
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    sharpen: { value: 0.14 },
    vignetteAmount: { value: 0.16 },
    vignetteHardness: { value: 0.72 },
    grainAmount: { value: 0.002 },
    sceneBrightness: { value: 0.9 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float sharpen;
    uniform float vignetteAmount;
    uniform float vignetteHardness;
    uniform float grainAmount;
    uniform float sceneBrightness;
    varying vec2 vUv;

    float random(vec2 value) {
      return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 texel = 1.0 / resolution;
      vec4 color = texture2D(tDiffuse, vUv);
      vec3 neighborAverage =
        texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb +
        texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb +
        texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb +
        texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb;
      neighborAverage *= 0.25;

      vec3 sharpened = color.rgb + (color.rgb - neighborAverage) * sharpen;
      float distanceFromCenter = distance(vUv, vec2(0.5));
      float vignette = 1.0 - smoothstep(vignetteHardness * 0.42, 0.82, distanceFromCenter);
      float grain = (random(vUv * resolution) - 0.5) * grainAmount;

      color.rgb = mix(sharpened, sharpened * vignette, vignetteAmount);
      color.rgb += grain;
      color.rgb *= sceneBrightness;
      gl_FragColor = vec4(color.rgb, color.a);
    }
  `,
}
const AIRBUS_REQUIRED_NODES = [
  'AIRBUS_ROOT',
  'AIRBUS_A320_STATIC',
  'AIRBUS_A320_DISPLAY_CANDIDATES',
  'AIRBUS_A320_INTERACTIVE_CANDIDATES',
  'AIRBUS_A320_LOC_CAPTAIN_EYE',
  'AIRBUS_A320_LOC_DASHBOARD_FOCUS',
  AIRBUS_GAME_CAMERA,
] as const

export type AirbusHotspotScreenPositions = Partial<Record<FirstOfficerControl, { x: number; y: number; visible: boolean }>>

interface PrototypeSceneProps {
  phase: Exclude<GamePhase, 'briefing'>
  activeSwitches: SwitchId[]
  lockerHatRevealed: boolean
  captainRewardUnlocked: boolean
  reducedMotion: boolean
  onAirbusReady: () => void
  onAirbusHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
  onSwitch: (switchId: SwitchId) => void
  onMars: () => void
  onLockerHat: () => void
}

type HoverHandler = (hovering: boolean) => void
interface LoadedAirbusScene {
  scene: THREE.Group
  camera: THREE.Camera | null
}

function projectAirbusHotspots(camera: THREE.Camera, size: { width: number; height: number }): AirbusHotspotScreenPositions {
  const positions: AirbusHotspotScreenPositions = {}

  for (const [control, anchor] of Object.entries(AIRBUS_HOTSPOT_ANCHORS) as [FirstOfficerControl, THREE.Vector3][]) {
    const projected = anchor.clone().project(camera)
    const x = (projected.x * 0.5 + 0.5) * size.width
    const y = (-projected.y * 0.5 + 0.5) * size.height
    positions[control] = {
      x: Math.round(x),
      y: Math.round(y),
      visible: projected.z >= -1 && projected.z <= 1 && x >= -80 && x <= size.width + 80 && y >= -80 && y <= size.height + 80,
    }
  }

  return positions
}

function applyCameraTransform(runtimeCamera: THREE.Camera, sourceCamera: THREE.Camera, fovOverride?: number) {
  sourceCamera.getWorldPosition(runtimeCamera.position)
  sourceCamera.getWorldQuaternion(runtimeCamera.quaternion)
  runtimeCamera.scale.copy(sourceCamera.scale)
  runtimeCamera.updateMatrix()
  runtimeCamera.updateMatrixWorld(true)
  if (runtimeCamera instanceof THREE.PerspectiveCamera && sourceCamera instanceof THREE.PerspectiveCamera) {
    runtimeCamera.fov = fovOverride ?? sourceCamera.fov
    runtimeCamera.near = Math.max(0.01, sourceCamera.near)
    runtimeCamera.far = sourceCamera.far
    runtimeCamera.updateProjectionMatrix()
  }
}

function applyAirbusGameplayCameraTransform(runtimeCamera: THREE.Camera, sourceCamera: THREE.Camera, fovOverride?: number) {
  applyCameraTransform(runtimeCamera, sourceCamera, fovOverride)
  const needsCenteredCameraRepair = Math.abs(runtimeCamera.position.x) < 0.05
  if (needsCenteredCameraRepair) {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(runtimeCamera.quaternion)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(runtimeCamera.quaternion)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(runtimeCamera.quaternion)
    runtimeCamera.position
      .addScaledVector(right, AIRBUS_FO_SEAT_OFFSET.x)
      .addScaledVector(up, AIRBUS_FO_SEAT_OFFSET.y)
      .addScaledVector(forward, AIRBUS_FO_SEAT_OFFSET.z)
    const foSeatYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), AIRBUS_FO_SEAT_YAW)
    runtimeCamera.quaternion.multiply(foSeatYaw)
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
  onHotspotsChange,
}: {
  airbusCameraRevision: number
  onHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
}) {
  const { camera, gl, size } = useThree()
  const basePositionRef = useRef(new THREE.Vector3())
  const baseQuaternionRef = useRef(new THREE.Quaternion())
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const draggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const lastHotspotPayloadRef = useRef('')

  const applyLook = useCallback(() => {
    const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current)
    const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRef.current)
    camera.position.copy(basePositionRef.current)
    camera.quaternion.copy(baseQuaternionRef.current).multiply(yawQuaternion).multiply(pitchQuaternion)
    camera.updateMatrixWorld(true)
    if (onHotspotsChange) {
      const positions = projectAirbusHotspots(camera, size)
      const payload = JSON.stringify(positions)
      if (payload !== lastHotspotPayloadRef.current) {
        lastHotspotPayloadRef.current = payload
        onHotspotsChange(positions)
      }
    }
  }, [camera, onHotspotsChange, size])

  useEffect(() => {
    basePositionRef.current.copy(camera.position)
    baseQuaternionRef.current.copy(camera.quaternion)
    yawRef.current = 0
    pitchRef.current = 0
    applyLook()
  }, [airbusCameraRevision, applyLook, camera])

  useEffect(() => {
    const canvas = gl.domElement

    const stopDrag = () => {
      draggingRef.current = false
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      draggingRef.current = true
      lastPointerRef.current = { x: event.clientX, y: event.clientY }
      canvas.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
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
      applyLook()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', stopDrag)
    canvas.addEventListener('pointercancel', stopDrag)

    return () => {
      draggingRef.current = false
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', stopDrag)
      canvas.removeEventListener('pointercancel', stopDrag)
    }
  }, [applyLook, gl])

  useFrame(() => applyLook())

  return null
}

function AirbusHotspotProjector({
  onHotspotsChange,
}: {
  onHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
}) {
  const { camera, size } = useThree()
  const lastPayloadRef = useRef('')

  const publishHotspots = useCallback(() => {
    if (!onHotspotsChange) return
    const positions: AirbusHotspotScreenPositions = {}

    for (const [control, anchor] of Object.entries(AIRBUS_HOTSPOT_ANCHORS) as [FirstOfficerControl, THREE.Vector3][]) {
      const projected = anchor.clone().project(camera)
      const x = (projected.x * 0.5 + 0.5) * size.width
      const y = (-projected.y * 0.5 + 0.5) * size.height
      positions[control] = {
        x: Math.round(x),
        y: Math.round(y),
        visible: projected.z >= -1 && projected.z <= 1 && x >= -80 && x <= size.width + 80 && y >= -80 && y <= size.height + 80,
      }
    }

    const payload = JSON.stringify(positions)
    if (payload === lastPayloadRef.current) return
    lastPayloadRef.current = payload
    onHotspotsChange(positions)
  }, [camera, onHotspotsChange, size.height, size.width])

  useEffect(() => {
    let animationFrame = window.requestAnimationFrame(function publish() {
      publishHotspots()
      animationFrame = window.requestAnimationFrame(publish)
    })

    return () => {
      window.cancelAnimationFrame(animationFrame)
      onHotspotsChange?.({})
    }
  }, [onHotspotsChange, publishHotspots])

  useFrame(() => publishHotspots())

  return null
}

function AirbusSketchfabPostProcessing() {
  const { camera, gl, scene, size } = useThree()
  const composerRef = useRef<EffectComposer | null>(null)
  const sketchfabPassRef = useRef<ShaderPass | null>(null)

  useEffect(() => {
    const composer = new EffectComposer(gl)
    const renderPass = new RenderPass(scene, camera)
    const ssaoPass = new SSAOPass(scene, camera, size.width, size.height, 16)
    ssaoPass.kernelRadius = 4
    ssaoPass.minDistance = 0.004
    ssaoPass.maxDistance = 0.13

    const sketchfabPass = new ShaderPass(AIRBUS_SKETCHFAB_POSTPROCESS_SHADER)
    const outputPass = new OutputPass()
    composer.addPass(renderPass)
    composer.addPass(ssaoPass)
    composer.addPass(sketchfabPass)
    composer.addPass(outputPass)

    composerRef.current = composer
    sketchfabPassRef.current = sketchfabPass

    return () => {
      composerRef.current = null
      sketchfabPassRef.current = null
      composer.dispose()
      ssaoPass.dispose()
      sketchfabPass.dispose()
      outputPass.dispose()
    }
  }, [camera, gl, scene, size.height, size.width])

  useEffect(() => {
    const composer = composerRef.current
    const sketchfabPass = sketchfabPassRef.current
    if (!composer || !sketchfabPass) return
    composer.setSize(size.width, size.height)
    sketchfabPass.uniforms.resolution?.value.set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio())
  }, [gl, size.height, size.width])

  useFrame((_, delta) => {
    composerRef.current?.render(delta)
  }, 1)

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
  onCameraReady,
  onAirbusHotspotsChange,
}: {
  reducedMotion: boolean
  onCameraReady: () => void
  onAirbusHotspotsChange?: (positions: AirbusHotspotScreenPositions) => void
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
          if (object instanceof THREE.Mesh) {
            object.castShadow = true
            object.receiveShadow = true
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            for (const material of materials) {
              material.side = THREE.DoubleSide
              material.needsUpdate = true
            }
          }
        })
        loadedScene.userData.airbusRuntimeMaterialToneApplied = true

        loadedScene.updateMatrixWorld(true)
        setLoaded({ scene: loadedScene, camera: loadedScene.getObjectByName(AIRBUS_GAME_CAMERA) as THREE.Camera | null })
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
    onAirbusHotspotsChange?.(projectAirbusHotspots(camera, size))
    onCameraReady()
  }, [camera, loaded, onAirbusHotspotsChange, onCameraReady, size])

  return (
    <>
      <color attach="background" args={['#172123']} />
      <AirbusRuntimeLighting />
      {loaded && !loadFailed ? (
        <>
          <primitive object={loaded.scene} />
          <AirbusSeatLookControls airbusCameraRevision={size.width} onHotspotsChange={onAirbusHotspotsChange} />
          <AirbusHotspotProjector onHotspotsChange={onAirbusHotspotsChange} />
          <AirbusSketchfabPostProcessing />
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
  onAirbusReady,
  onAirbusHotspotsChange,
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
            onCameraReady={onAirbusReady}
            onAirbusHotspotsChange={onAirbusHotspotsChange}
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
