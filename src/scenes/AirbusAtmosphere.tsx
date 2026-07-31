import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { AirbusWeatherFieldSnapshot } from '../game/airbusWeatherField'
import { deriveAirbusWeatherField } from '../game/airbusWeatherField'
import type { AirbusActiveSimulationFrame } from '../game/airbusScenario'
import { deriveAirbusAtmosphereLayout } from './airbusAtmosphereVisuals'
import { deriveAirbusEngineOutVisualPose } from './airbusEngineOutVisuals'
import { deriveAirbusStormVisualPose } from './airbusStormVisuals'

interface AirbusAtmosphereProps {
  simulationFrameRef: MutableRefObject<AirbusActiveSimulationFrame | null>
  weatherSnapshotRef: MutableRefObject<AirbusWeatherFieldSnapshot | null>
  reducedMotion: boolean
}

const MAX_CLOUD_CLUSTERS = 48
const MAX_RAIN_SHAFTS = 8

const SKY_VERTEX_SHADER = `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAGMENT_SHADER = `
  uniform vec3 zenithColor;
  uniform vec3 horizonColor;
  uniform vec3 lowerColor;
  uniform float visibility;
  varying vec3 vDirection;
  void main() {
    float height = normalize(vDirection).y - 0.24;
    float upperBlend = smoothstep(-0.08, 0.72, height);
    vec3 atmosphere = mix(lowerColor, zenithColor, upperBlend);
    float horizonBand = exp(-abs(height) * mix(4.5, 8.0, visibility));
    atmosphere = mix(atmosphere, horizonColor, horizonBand * 0.78);
    gl_FragColor = vec4(atmosphere, 1.0);
  }
`

const RAIN_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 localPosition = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      localPosition = instanceMatrix * localPosition;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * localPosition;
  }
`

const RAIN_FRAGMENT_SHADER = `
  uniform float rainOpacity;
  varying vec2 vUv;
  void main() {
    float sideFade = smoothstep(0.0, 0.32, vUv.x) * smoothstep(0.0, 0.32, 1.0 - vUv.x);
    float topFade = smoothstep(0.0, 0.28, 1.0 - vUv.y);
    float lowerFade = smoothstep(0.0, 0.18, vUv.y);
    float streaks = 0.72 + 0.28 * sin(vUv.x * 96.0);
    float alpha = sideFade * topFade * lowerFade * streaks * rainOpacity;
    gl_FragColor = vec4(0.45, 0.62, 0.68, alpha);
  }
`

function makeCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is unavailable for Airbus atmosphere.')
  context.clearRect(0, 0, canvas.width, canvas.height)

  const lobes = [
    [72, 142, 62, 0.56],
    [118, 112, 78, 0.64],
    [168, 130, 70, 0.59],
    [130, 158, 82, 0.53],
    [104, 70, 48, 0.45],
  ] as const
  for (const [x, y, radius, alpha] of lobes) {
    const gradient = context.createRadialGradient(x, y, radius * 0.08, x, y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`)
    gradient.addColorStop(0.42, `rgba(246,250,252,${alpha * 0.76})`)
    gradient.addColorStop(0.78, `rgba(218,228,233,${alpha * 0.24})`)
    gradient.addColorStop(1, 'rgba(205,220,226,0)')
    context.fillStyle = gradient
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  return texture
}

function weatherForFrame(
  frame: AirbusActiveSimulationFrame,
): AirbusWeatherFieldSnapshot {
  if (frame.scenario === 'stormLine') {
    return deriveAirbusWeatherField({
      scenario: 'stormLine',
      checkpoint: frame.state.checkpoint,
      elapsedSeconds: frame.state.elapsedSeconds,
      intensity: frame.state.weatherIntensity,
      seed: frame.state.seed,
    })
  }
  return deriveAirbusWeatherField({
    scenario: 'engineOut',
    checkpoint: frame.state.checkpoint,
    elapsedSeconds: frame.state.stageElapsedSeconds,
    intensity: 0.12,
    seed: 41,
  })
}

export function AirbusAtmosphere({
  simulationFrameRef,
  weatherSnapshotRef,
  reducedMotion,
}: AirbusAtmosphereProps) {
  const { camera, gl } = useThree()
  const rootRef = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.InstancedMesh>(null)
  const rainRef = useRef<THREE.InstancedMesh>(null)
  const flashRef = useRef<THREE.PointLight>(null)
  const cloudMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const skyMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const rainMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const canvasRef = useRef(gl.domElement)
  const lastWeatherUpdateRef = useRef(-1)
  const reducedMotionRef = useRef(reducedMotion)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const cloudColor = useMemo(() => new THREE.Color(), [])
  const cloudTexture = useMemo(() => makeCloudTexture(), [])
  const attitudeQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const rollQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const yawQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const rollAxis = useMemo(() => new THREE.Vector3(0, 0, 1), [])
  const yawAxis = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const skyUniforms = useMemo(() => ({
      zenithColor: { value: new THREE.Color('#17384c') },
      horizonColor: { value: new THREE.Color('#a5bcc0') },
      lowerColor: { value: new THREE.Color('#26343a') },
      visibility: { value: 0.8 },
  }), [])
  const rainUniforms = useMemo(() => ({
    rainOpacity: { value: 0.22 },
  }), [])

  useEffect(() => {
    reducedMotionRef.current = reducedMotion
  }, [reducedMotion])

  useEffect(() => {
    canvasRef.current = gl.domElement
  }, [gl])

  useEffect(() => {
    return () => {
      cloudTexture.dispose()
      weatherSnapshotRef.current = null
    }
  }, [cloudTexture, weatherSnapshotRef])

  useFrame(({ clock }) => {
    const root = rootRef.current
    const clouds = cloudsRef.current
    const rain = rainRef.current
    const frame = simulationFrameRef.current
    if (!root || !clouds || !rain || !frame) {
      if (root) root.visible = false
      return
    }

    root.visible = true
    root.position.copy(camera.position)
    root.quaternion.copy(camera.quaternion)

    let horizonRoll: number
    let pitchOffset: number
    let headingDrift = 0
    if (frame.scenario === 'stormLine') {
      const pose = deriveAirbusStormVisualPose({
        bankDegrees: frame.state.aircraft.bank,
        pitchDegrees: frame.state.aircraft.pitch,
        lateralPosition: frame.state.aircraft.lateralPosition,
      })
      horizonRoll = pose.horizonRollRadians
      pitchOffset = pose.pitchOffsetMeters
      canvasRef.current.dataset.stormHorizonRoll = horizonRoll.toFixed(4)
      canvasRef.current.dataset.stormPitchOffset = pitchOffset.toFixed(3)
      canvasRef.current.dataset.stormCorridorProgress = pose.corridorProgress.toFixed(3)
    } else {
      const pose = deriveAirbusEngineOutVisualPose({
        pitchDegrees: frame.state.aircraft.pitch,
        bankDegrees: frame.state.aircraft.bank,
        headingErrorDegrees: frame.state.aircraft.headingError,
        directionalError: frame.state.aircraft.directionalError,
        corridorProgress: frame.state.corridorProgress,
        leftEnginePower: frame.state.aircraft.leftEnginePower,
        rightEnginePower: frame.state.aircraft.rightEnginePower,
      }, reducedMotionRef.current)
      horizonRoll = pose.horizonRollRadians
      pitchOffset = pose.pitchOffsetMeters
      headingDrift = pose.headingDriftRadians
      canvasRef.current.dataset.engineOutHeadingDrift = headingDrift.toFixed(4)
      canvasRef.current.dataset.engineOutHorizonRoll = horizonRoll.toFixed(4)
      canvasRef.current.dataset.engineOutDirectionalCue = pose.directionalCue.toFixed(3)
      canvasRef.current.dataset.engineOutSafeReturn = pose.safeReturnProgress.toFixed(3)
      canvasRef.current.dataset.engineOutSafeReturnVisible =
        frame.state.checkpoint === 'diversion' ? 'true' : 'false'
    }
    rollQuaternion.setFromAxisAngle(rollAxis, horizonRoll)
    yawQuaternion.setFromAxisAngle(yawAxis, headingDrift)
    attitudeQuaternion.copy(yawQuaternion).multiply(rollQuaternion)
    root.quaternion.multiply(attitudeQuaternion)
    root.translateY(pitchOffset)

    if (clock.elapsedTime - lastWeatherUpdateRef.current < 1 / 12) return
    lastWeatherUpdateRef.current = clock.elapsedTime
    const snapshot = weatherForFrame(frame)
    weatherSnapshotRef.current = snapshot
    const layout = deriveAirbusAtmosphereLayout(snapshot, {
      reducedMotion: reducedMotionRef.current,
    })

    clouds.count = layout.clusters.length
    for (const [index, cluster] of layout.clusters.entries()) {
      dummy.position.set(...cluster.position)
      dummy.scale.set(...cluster.scale)
      dummy.rotation.set(0, 0, (index % 5 - 2) * 0.035)
      dummy.updateMatrix()
      clouds.setMatrixAt(index, dummy.matrix)
      const shade = (0.98 - cluster.precipitation * 0.2)
        * (0.78 + cluster.opacity * 0.22)
      cloudColor.setRGB(shade * 0.9, shade * 0.95, shade)
      clouds.setColorAt(index, cloudColor)
    }
    clouds.instanceMatrix.needsUpdate = true
    if (clouds.instanceColor) clouds.instanceColor.needsUpdate = true

    rain.count = layout.rainShafts.length
    for (const [index, shaft] of layout.rainShafts.entries()) {
      dummy.position.set(...shaft.position)
      dummy.scale.set(...shaft.scale)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      rain.setMatrixAt(index, dummy.matrix)
    }
    rain.instanceMatrix.needsUpdate = true

    if (cloudMaterialRef.current) {
      cloudMaterialRef.current.opacity = 0.5 + snapshot.precipitation * 0.16
    }
    const rainOpacityUniform = rainMaterialRef.current?.uniforms.rainOpacity
    if (rainOpacityUniform) {
      rainOpacityUniform.value = layout.rainShafts.length > 0
        ? Math.max(...layout.rainShafts.map((shaft) => shaft.opacity))
        : 0
    }
    const stormPalette = snapshot.scenario === 'stormLine'
    const skyMaterial = skyMaterialRef.current
    skyMaterial?.uniforms.zenithColor?.value.set(stormPalette ? '#102b42' : '#2f6e96')
    skyMaterial?.uniforms.horizonColor?.value.set(stormPalette ? '#9bb3b7' : '#d8d5be')
    skyMaterial?.uniforms.lowerColor?.value.set(stormPalette ? '#26343b' : '#68818a')
    const visibilityUniform = skyMaterial?.uniforms.visibility
    if (visibilityUniform) visibilityUniform.value = snapshot.visibility

    const lightningActive = snapshot.lightningEligible
      && !reducedMotionRef.current
      && snapshot.elapsedSeconds % 19 < 0.12
    if (flashRef.current) flashRef.current.intensity = lightningActive ? 2.2 : 0

    canvasRef.current.dataset.airbusWeatherSignature = snapshot.signature
    canvasRef.current.dataset.airbusWeatherGapBearing = snapshot.gapBearingDegrees.toFixed(2)
    canvasRef.current.dataset.airbusVisibleGapBearing = layout.visibleGapBearingDegrees.toFixed(2)
    canvasRef.current.dataset.airbusWeatherCloudCount = String(layout.clusters.length)
    canvasRef.current.dataset.airbusWeatherDepthBands = String(
      new Set(layout.clusters.map((cluster) => cluster.band)).size,
    )
    canvasRef.current.dataset.airbusRainShaftCount = String(layout.rainShafts.length)
    canvasRef.current.dataset.airbusLightningActive = String(lightningActive)
    canvasRef.current.dataset.airbusAtmosphereMotionScale = layout.motionScale.toFixed(2)
  })

  return (
    <group ref={rootRef} frustumCulled={false}>
      <mesh renderOrder={-100} frustumCulled={false}>
        <sphereGeometry args={[220, 32, 20]} />
        <shaderMaterial
          ref={skyMaterialRef}
          vertexShader={SKY_VERTEX_SHADER}
          fragmentShader={SKY_FRAGMENT_SHADER}
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={skyUniforms}
        />
      </mesh>
      <mesh position={[0, 34, -150]} renderOrder={-80}>
        <planeGeometry args={[300, 48]} />
        <meshBasicMaterial
          map={cloudTexture}
          color="#b6c5c9"
          transparent
          opacity={0.2}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <instancedMesh
        ref={cloudsRef}
        args={[undefined, undefined, MAX_CLOUD_CLUSTERS]}
        renderOrder={-60}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={cloudMaterialRef}
          map={cloudTexture}
          color="#ffffff"
          transparent
          opacity={0.72}
          alphaTest={0.015}
          depthWrite={false}
          side={THREE.DoubleSide}
          vertexColors
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={rainRef}
        args={[undefined, undefined, MAX_RAIN_SHAFTS]}
        renderOrder={-50}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={rainMaterialRef}
          vertexShader={RAIN_VERTEX_SHADER}
          fragmentShader={RAIN_FRAGMENT_SHADER}
          uniforms={rainUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>
      <pointLight ref={flashRef} position={[0, 24, -65]} color="#d9edff" intensity={0} distance={150} />
    </group>
  )
}
