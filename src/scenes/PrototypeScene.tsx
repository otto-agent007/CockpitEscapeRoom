import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { OrbitControls as ThreeOrbitControls } from 'three/addons/controls/OrbitControls.js'
import * as THREE from 'three'
import { SWITCH_ORDER, type SwitchId } from '../game/state'


function LimitedOrbitControls() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<ThreeOrbitControls | null>(null)

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement)
    controls.enablePan = false
    controls.enableZoom = true
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
  }, [camera, gl])

  useFrame(() => controlsRef.current?.update())
  return null
}

interface PrototypeSceneProps {
  activeSwitches: SwitchId[]
  phase: 'power' | 'route' | 'complete' | 'mars'
  captainRewardUnlocked: boolean
  reducedMotion: boolean
  onSwitch: (switchId: SwitchId) => void
  onMars: () => void
}

interface LeverProps {
  id: SwitchId
  position: [number, number, number]
  active: boolean
  onActivate: (id: SwitchId) => void
}

function Lever({ id, position, active, onActivate }: LeverProps) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.84, 0.16]} />
        <meshStandardMaterial color="#364341" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh
        position={[0, active ? 0.18 : -0.18, 0.22]}
        rotation={[active ? -0.52 : 0.52, 0, 0]}
        onClick={(event) => {
          event.stopPropagation()
          onActivate(id)
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
        castShadow
      >
        <boxGeometry args={[0.16, 0.54, 0.16]} />
        <meshStandardMaterial color={active ? '#e6c468' : '#c3c6bd'} roughness={0.4} metalness={0.65} />
      </mesh>
      <mesh position={[0, 0.32, 0.2]}>
        <circleGeometry args={[0.06, 20]} />
        <meshStandardMaterial color={active ? '#d7a93f' : '#442b20'} emissive={active ? '#9a6114' : '#000000'} />
      </mesh>
    </group>
  )
}

function Gauge({ completed, reducedMotion }: { completed: boolean; reducedMotion: boolean }) {
  const needle = useRef<THREE.Mesh>(null)
  const target = completed ? -0.9 : 0.9

  useFrame((_, delta) => {
    if (!needle.current) return
    if (reducedMotion) {
      needle.current.rotation.z = target
      return
    }
    needle.current.rotation.z = THREE.MathUtils.damp(needle.current.rotation.z, target, 5, delta)
  })

  return (
    <group position={[0, 0.82, 0.2]}>
      <mesh>
        <cylinderGeometry args={[0.48, 0.48, 0.12, 48]} />
        <meshStandardMaterial color="#101616" roughness={0.35} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <ringGeometry args={[0.38, 0.45, 48]} />
        <meshStandardMaterial color="#c7c9bc" />
      </mesh>
      <mesh ref={needle} position={[0, 0, 0.11]} rotation={[0, 0, 0.9]}>
        <boxGeometry args={[0.035, 0.34, 0.025]} />
        <meshStandardMaterial color="#e9dcc5" />
      </mesh>
    </group>
  )
}

function RewardCarProxy() {
  return (
    <group position={[0, -1.05, -0.5]} rotation={[0, -0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.55, 0.38, 0.72]} />
        <meshStandardMaterial color="#a41419" roughness={0.25} metalness={0.55} />
      </mesh>
      <mesh position={[0.2, 0.31, 0]} castShadow>
        <boxGeometry args={[0.86, 0.38, 0.66]} />
        <meshStandardMaterial color="#9b1117" roughness={0.2} metalness={0.5} />
      </mesh>
      {[-0.5, 0.5].flatMap((x) =>
        [-0.39, 0.39].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.22, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.12, 24]} />
            <meshStandardMaterial color="#16191a" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  )
}

function CockpitGreybox({
  activeSwitches,
  phase,
  captainRewardUnlocked,
  reducedMotion,
  onSwitch,
  onMars,
}: PrototypeSceneProps) {
  const phaseComplete = phase === 'route' || phase === 'complete' || phase === 'mars'
  const switchPositions = useMemo<[number, number, number][]>(
    () => [
      [-0.85, -0.25, 0.2],
      [0, -0.25, 0.2],
      [0.85, -0.25, 0.2],
    ],
    [],
  )

  return (
    <>
      <color attach="background" args={[phase === 'mars' ? '#160f0d' : '#0c1212']} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} castShadow />
      <pointLight position={[-2, 1, 2]} intensity={phaseComplete ? 1.5 : 0.7} color="#d2a14a" />

      <group position={[0, 0, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[3.4, 2.55, 0.34]} />
          <meshStandardMaterial color="#667b78" roughness={0.78} metalness={0.24} />
        </mesh>
        <Gauge completed={phaseComplete} reducedMotion={reducedMotion} />
        {SWITCH_ORDER.map((id, index) => (
          <Lever
            key={id}
            id={id}
            position={switchPositions[index] ?? [0, 0, 0]}
            active={activeSwitches.includes(id)}
            onActivate={onSwitch}
          />
        ))}
        <mesh position={[1.3, 0.93, 0.21]}>
          <boxGeometry args={[0.4, 0.18, 0.06]} />
          <meshStandardMaterial color={phaseComplete ? '#dfb84e' : '#3b2a1b'} emissive={phaseComplete ? '#9a6518' : '#000000'} />
        </mesh>
        <mesh
          position={[-1.35, 0.95, 0.24]}
          onClick={(event) => {
            event.stopPropagation()
            if (phase === 'complete' || phase === 'mars') onMars()
          }}
          onPointerOver={() => {
            if (phase === 'complete' || phase === 'mars') document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default'
          }}
        >
          <sphereGeometry args={[0.07, 20, 20]} />
          <meshStandardMaterial
            color={phase === 'complete' || phase === 'mars' ? '#bf2b20' : '#321612'}
            emissive={phase === 'complete' || phase === 'mars' ? '#79130e' : '#000000'}
          />
        </mesh>
      </group>

      {captainRewardUnlocked && (phase === 'complete' || phase === 'mars') && <RewardCarProxy />}

      <mesh position={[0, -1.45, -0.9]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#202726" roughness={0.95} />
      </mesh>

      <LimitedOrbitControls />
    </>
  )
}

export function PrototypeScene(props: PrototypeSceneProps) {
  return (
    <div className="scene" aria-label="Interactive 3D cockpit greybox">
      <Canvas
        camera={{ position: [0, 0.25, 5.6], fov: 42 }}
        dpr={[1, 1.5]}
        shadows
        fallback={<div className="canvas-fallback">WebGL is unavailable. Use the mirrored HTML controls.</div>}
      >
        <CockpitGreybox {...props} />
      </Canvas>
      <div className="prototype-badge">GREYBOX — NOT FINAL DC-9 ART</div>
    </div>
  )
}
