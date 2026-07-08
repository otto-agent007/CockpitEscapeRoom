import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { OrbitControls as ThreeOrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'
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
const AIRBUS_REQUIRED_NODES = [
  'AIRBUS_ROOT',
  'AIRBUS_A320_STATIC',
  'AIRBUS_A320_DISPLAY_CANDIDATES',
  'AIRBUS_A320_INTERACTIVE_CANDIDATES',
  'AIRBUS_A320_LOC_CAPTAIN_EYE',
  'AIRBUS_A320_LOC_DASHBOARD_FOCUS',
  AIRBUS_GAME_CAMERA,
] as const

interface PrototypeSceneProps {
  phase: Exclude<GamePhase, 'briefing'>
  activeSwitches: SwitchId[]
  lockerHatRevealed: boolean
  captainRewardUnlocked: boolean
  reducedMotion: boolean
  onAirbusReady: () => void
  onSwitch: (switchId: SwitchId) => void
  onMars: () => void
  onLockerHat: () => void
}

type HoverHandler = (hovering: boolean) => void
interface LoadedAirbusScene {
  scene: THREE.Group
  camera: THREE.Camera | null
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

function LimitedOrbitControls({
  phase,
  airbusCameraRevision,
}: {
  phase: PrototypeSceneProps['phase']
  airbusCameraRevision: number
}) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<ThreeOrbitControls | null>(null)

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement)
    const isAirbus = phase === 'airbus'
    controls.enablePan = false
    controls.enableZoom = !isAirbus
    if (isAirbus) {
      const target = new THREE.Vector3()
      camera.getWorldDirection(target)
      target.multiplyScalar(0.82).add(camera.position)
      controls.target.copy(target)
      const offset = camera.position.clone().sub(target)
      const spherical = new THREE.Spherical().setFromVector3(offset)
      controls.minDistance = 0.82
      controls.maxDistance = 0.82
      controls.minPolarAngle = Math.max(0.01, spherical.phi - 0.16)
      controls.maxPolarAngle = Math.min(Math.PI - 0.01, spherical.phi + 0.16)
      controls.minAzimuthAngle = spherical.theta - 0.22
      controls.maxAzimuthAngle = spherical.theta + 0.22
    } else {
      controls.minDistance = 4.2
      controls.maxDistance = 7.2
      controls.minPolarAngle = Math.PI / 2.5
      controls.maxPolarAngle = Math.PI / 1.75
      controls.minAzimuthAngle = -0.42
      controls.maxAzimuthAngle = 0.42
    }
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controlsRef.current = controls

    return () => {
      controlsRef.current = null
      controls.dispose()
    }
  }, [airbusCameraRevision, camera, gl, phase])

  useFrame(() => controlsRef.current?.update())
  return null
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
}: {
  reducedMotion: boolean
  onCameraReady: () => void
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

  useEffect(() => {
    if (!loaded?.camera) return
    loaded.scene.updateMatrixWorld(true)
    applyCameraTransform(camera, loaded.camera, size.width < 620 ? AIRBUS_NARROW_GAME_FOV : AIRBUS_WIDE_GAME_FOV)
    onCameraReady()
  }, [camera, loaded, onCameraReady, size.width])

  return (
    <>
      <color attach="background" args={['#11191b']} />
      <ambientLight intensity={0.82} />
      <directionalLight position={[2.8, 5.2, 4.4]} intensity={2.2} castShadow />
      <pointLight position={[-2.4, 1.7, 2.2]} intensity={0.8} color="#b8d9ff" />
      {loaded && !loadFailed ? (
        <primitive object={loaded.scene} />
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
  onSwitch,
  onMars,
  onLockerHat,
}: PrototypeSceneProps) {
  const onInteractiveHover = useInteractiveCursor()
  const [airbusCameraReady, setAirbusCameraReady] = useState(false)
  const [airbusCameraRevision, setAirbusCameraRevision] = useState(0)
  const markAirbusCameraReady = useCallback(() => {
    setAirbusCameraReady(true)
    setAirbusCameraRevision((revision) => revision + 1)
    onAirbusReady()
  }, [onAirbusReady])

  return (
    <div className="scene" aria-label="Interactive 3D scene">
      <Canvas
        camera={{ position: [0, 0.25, 5.6], fov: 42 }}
        dpr={[1, 1.5]}
        shadows
        fallback={<div className="canvas-fallback">WebGL is unavailable. Use the mirrored HTML controls.</div>}
      >
        {phase === 'airbus' && <AirbusCockpit reducedMotion={reducedMotion} onCameraReady={markAirbusCameraReady} />}
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

        {(phase !== 'airbus' || airbusCameraReady) && (
          <LimitedOrbitControls phase={phase} airbusCameraRevision={airbusCameraRevision} />
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
