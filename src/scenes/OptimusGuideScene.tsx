import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'

const modelUrl = `${import.meta.env.BASE_URL}models/optimus-guide-dance-02-review.glb?v=review-2k-285f8a53`
const fallbackUrl = `${import.meta.env.BASE_URL}images/optimus-guide-fallback.png`
const danceActionName = 'Armature|dance_02.001'

function GuideFigure({ model, replayRevision, reducedMotion }: {
  model: GLTF
  replayRevision: number
  reducedMotion: boolean
}) {
  const mixer = useMemo(() => new THREE.AnimationMixer(model.scene), [model])

  useEffect(() => {
    const danceClip = model.animations.find((clip) => clip.name === danceActionName)
    if (!danceClip) return
    const dance = mixer.clipAction(danceClip)
    mixer.stopAllAction()
    dance.reset().setLoop(THREE.LoopRepeat, Infinity).play()
    if (reducedMotion) dance.paused = true
    return () => {
      mixer.stopAllAction()
    }
  }, [mixer, model, reducedMotion, replayRevision])

  useFrame((_, delta) => {
    if (!reducedMotion) mixer.update(delta)
  })

  return <primitive object={model.scene} />
}

/** Loaded only after Airbus completion; the caption and reward action live in HTML. */
export default function OptimusGuideScene({ replayRevision, reducedMotion }: {
  replayRevision: number
  reducedMotion: boolean
}) {
  const [model, setModel] = useState<GLTF | null>(null)

  useEffect(() => {
    let active = true
    new GLTFLoader().load(modelUrl, (loaded) => {
      if (active) setModel(loaded)
    }, undefined, () => {
      if (active) setModel(null)
    })
    return () => { active = false }
  }, [])

  if (!model) return <img className="optimus-guide-fallback" src={fallbackUrl} alt="" />

  return (
    <Canvas
      className="optimus-guide-canvas"
      camera={{ position: [0, 0.5, 2.05], fov: 30, near: 0.05, far: 20 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ camera }) => camera.lookAt(0, 0.5, 0)}
      fallback={<img className="optimus-guide-fallback" src={fallbackUrl} alt="" />}
      aria-hidden="true"
    >
      <ambientLight intensity={2.4} />
      <directionalLight position={[2, 4, 5]} intensity={3.5} />
      <directionalLight position={[-3, 2, -2]} intensity={2} />
      <GuideFigure model={model} replayRevision={replayRevision} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
