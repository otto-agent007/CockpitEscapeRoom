import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { ROBOPTIMUS_DOOR_DANCE_MS, ROBOPTIMUS_FALLBACK_FILE, ROBOPTIMUS_WAITING_FILE, ROBOPTIMUS_WALK_MS, type RoboptimusMotion, type RoboptimusStage } from '../game/optimusGreeting'

const baseUrl = import.meta.env.BASE_URL
const modelUrl = `${baseUrl}models/roboptimus-guide.glb?v=personal-greeting-1`
const hangarUrl = `${baseUrl}models/roboptimus-hangar.glb`
const clips: Record<RoboptimusMotion, string> = {
  greeting: 'ROBOPTIMUS_PERSONAL_GREETING', walk: 'Armature|walk.001', dance: 'Armature|dance_02.001',
}

const GREETING_Z = 26
const DOOR_STOP_Z = 15.7

function escortTravel(beat: RoboptimusStage, elapsed: number) {
  if (beat === 'greeting') return 0
  if (beat !== 'walking') return 1
  return THREE.MathUtils.clamp((elapsed / ROBOPTIMUS_WALK_MS - 0.1) / 0.9, 0, 1)
}

function SceneReady({ onReady }: { onReady: (available: boolean) => void }) {
  const frame = useRef<number | null>(null)
  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
  }, [])
  useFrame(() => {
    if (frame.current !== null) return
    // Reveal the complete first draw after both models and their shaders are ready.
    frame.current = requestAnimationFrame(() => onReady(true))
  })
  return null
}

function GuideFigure({ model, motion, replayRevision, reducedMotion, staged, beat, beatStartedAt }: {
  model: GLTF
  motion: RoboptimusMotion
  replayRevision: number
  reducedMotion: boolean
  staged: boolean
  beat: RoboptimusStage
  beatStartedAt: number
}) {
  const root = useRef<THREE.Group>(null)
  const mixer = useMemo(() => new THREE.AnimationMixer(model.scene), [model])

  useEffect(() => {
    const clip = model.animations.find(candidate => candidate.name === clips[motion])
    if (!clip) return
    const action = mixer.clipAction(clip)
    action.reset().setLoop(motion === 'greeting' ? THREE.LoopOnce : THREE.LoopRepeat, motion === 'greeting' ? 1 : Infinity)
    action.clampWhenFinished = true
    action.setEffectiveTimeScale(motion === 'walk' ? 1.5 : 1)
    action.fadeIn(0.3).play()
    if (reducedMotion) action.paused = true
    return () => { action.fadeOut(0.2) }
  }, [mixer, model, motion, reducedMotion, replayRevision])

  useEffect(() => () => {
    mixer.stopAllAction()
    mixer.uncacheRoot(model.scene)
  }, [mixer, model])

  useFrame((_, delta) => {
    if (!reducedMotion) mixer.update(Math.min(delta, 0.1))
    if (!staged || !root.current) return
    const elapsed = Math.max(0, performance.now() - beatStartedAt)
    const travel = escortTravel(beat, elapsed)
    const facing = beat === 'walking'
      ? THREE.MathUtils.smoothstep(elapsed / ROBOPTIMUS_WALK_MS, 0, 0.1)
      : beat === 'dancing' ? 1 - THREE.MathUtils.smoothstep(elapsed, 0, 700) : 0
    root.current.rotation.y = -Math.PI * facing
    root.current.position.set(THREE.MathUtils.lerp(0, -1.4, travel), 0, THREE.MathUtils.lerp(GREETING_Z, DOOR_STOP_Z, travel))
  })

  return <group ref={root} scale={staged ? 2.2 : 1}><primitive object={model.scene} /></group>
}

function Hangar({ model, beat, beatStartedAt }: { model: GLTF; beat: RoboptimusStage; beatStartedAt: number }) {
  const { size } = useThree()
  const doors = useMemo(() => ['TESLA_HANGAR_DOOR_LEFT', 'TESLA_HANGAR_DOOR_RIGHT'].map(name => {
    const node = model.scene.getObjectByName(name)
    return node ? { node, x: node.position.x } : null
  }), [model])

  useFrame(({ camera }) => {
    const elapsed = Math.max(0, performance.now() - beatStartedAt)
    const opened = beat === 'dancing' ? THREE.MathUtils.smoothstep(elapsed / ROBOPTIMUS_DOOR_DANCE_MS, 0, 0.9) : beat === 'fading' ? 1 : 0
    doors.forEach((door, index) => {
      if (door) door.node.position.x = door.x + (index === 0 ? -2.65 : 2.65) * opened
    })
    const travel = escortTravel(beat, elapsed)
    const pullBack = beat === 'greeting' ? 0 : beat === 'walking' ? THREE.MathUtils.smoothstep(elapsed / ROBOPTIMUS_WALK_MS, 0, 0.2) : 1
    const guideZ = THREE.MathUtils.lerp(GREETING_Z, DOOR_STOP_Z, travel)
    const guideX = THREE.MathUtils.lerp(0, -1.4, travel)
    const distance = THREE.MathUtils.lerp(size.width < 700 ? 5.2 : 3.7, size.width < 700 ? 8.5 : 6.8, pullBack)
    camera.position.set(THREE.MathUtils.lerp(guideX, 0.3, pullBack), THREE.MathUtils.lerp(1.8, 1.7, pullBack), guideZ + distance)
    camera.lookAt(THREE.MathUtils.lerp(guideX, -0.3, pullBack), THREE.MathUtils.lerp(size.width < 700 ? 1.35 : 1.5, 1.05, pullBack), guideZ)
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = THREE.MathUtils.lerp(32, 38, pullBack)
      if (Math.abs(camera.fov - fov) > 0.001) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
    }
  })

  return (
    <>
      <color attach="background" args={['#0a121b']} />
      <fog attach="fog" args={['#0a121b', 28, 85]} />
      <primitive object={model.scene} />
      <mesh position={[0, 2.8, 13.75]}>
        <planeGeometry args={[5.4, 5.6]} />
        <meshBasicMaterial color="#000000" fog={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.17, 0]} receiveShadow>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#323b43" roughness={0.95} />
      </mesh>
      <pointLight position={[-6, 4, 17]} intensity={45} color="#b5d7ff" distance={18} decay={2} />
    </>
  )
}

/** Post-Airbus guide only. Caption, controls, audio and progression stay in HTML. */
export default function OptimusGuideScene({ replayRevision = 0, reducedMotion, motion = 'dance', hangar = false, beat = 'greeting', beatStartedAt = 0, onReady }: {
  replayRevision?: number
  reducedMotion: boolean
  motion?: RoboptimusMotion
  hangar?: boolean
  beat?: RoboptimusStage
  beatStartedAt?: number
  onReady?: (available: boolean) => void
}) {
  const [assets, setAssets] = useState<{ guide: GLTF; environment: GLTF | null } | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [firstFrameReady, setFirstFrameReady] = useState(false)
  const revealScene = useCallback(() => {
    setFirstFrameReady(true)
    onReady?.(true)
  }, [onReady])

  useEffect(() => {
    let active = true
    const loader = new GLTFLoader()
    void Promise.all([loader.loadAsync(modelUrl), hangar ? loader.loadAsync(hangarUrl) : Promise.resolve(null)]).then(([guide, environment]) => {
      if (!active) return
      for (const scene of [guide.scene, environment?.scene]) scene?.traverse(node => {
        if (node instanceof THREE.Mesh) { node.castShadow = true; node.receiveShadow = true }
      })
      setAssets({ guide, environment })
    }).catch(() => {
      if (active) {
        setLoadFailed(true)
        onReady?.(false)
      }
    })
    return () => { active = false }
  }, [hangar, onReady])

  const fallback = <img className="optimus-guide-fallback" src={`${baseUrl}${motion === 'dance' ? ROBOPTIMUS_FALLBACK_FILE : ROBOPTIMUS_WAITING_FILE}`} alt="" />
  if (!assets) return loadFailed ? fallback : <div className="roboptimus-scene-loading" />

  return (
    <Canvas
      className="optimus-guide-canvas" shadows={hangar}
      style={{ opacity: firstFrameReady ? 1 : 0 }}
      camera={hangar ? { position: [0, 1.8, 29.7], fov: 32, near: 0.1, far: 150 } : { position: [0, 0.5, 2.05], fov: 30, near: 0.05, far: 20 }}
      dpr={[1, 1.5]} gl={{ alpha: !hangar, antialias: true }}
      onCreated={({ camera }) => camera.lookAt(0, hangar ? 1.5 : 0.5, hangar ? GREETING_Z : 0)}
      fallback={fallback} aria-hidden="true"
    >
      <ambientLight intensity={hangar ? 1.6 : 2.4} />
      <directionalLight position={[2, 8, 20]} intensity={hangar ? 3 : 3.5} castShadow={hangar} shadow-mapSize={[1024, 1024]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
      <directionalLight position={[-3, 2, -2]} intensity={2} />
      {assets.environment && <Hangar model={assets.environment} beat={beat} beatStartedAt={beatStartedAt} />}
      <GuideFigure model={assets.guide} motion={motion} replayRevision={replayRevision} reducedMotion={reducedMotion} staged={hangar} beat={beat} beatStartedAt={beatStartedAt} />
      <SceneReady onReady={revealScene} />
    </Canvas>
  )
}
