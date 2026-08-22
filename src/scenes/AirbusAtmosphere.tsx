import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { AirbusWeatherFieldSnapshot } from '../game/airbusWeatherField'
import { deriveAirbusWeatherField } from '../game/airbusWeatherField'
import {
  engineOutOwnshipTrack,
  stormLineOwnshipTrack,
} from '../game/airbusOwnshipTrack'
import type { AirbusActiveSimulationFrame } from '../game/airbusScenario'
import {
  airbusLightningFlash,
  deriveAirbusAtmosphereLayout,
  MAX_AIRBUS_CLOUD_CLUSTERS,
  MAX_AIRBUS_RAIN_SHAFTS,
  type AirbusAtmosphereLayout,
} from './airbusAtmosphereVisuals'
import { deriveAirbusEngineOutVisualPose } from './airbusEngineOutVisuals'
import { deriveAirbusStormVisualPose } from './airbusStormVisuals'

interface AirbusAtmosphereProps {
  simulationFrameRef: MutableRefObject<AirbusActiveSimulationFrame | null>
  weatherSnapshotRef: MutableRefObject<AirbusWeatherFieldSnapshot | null>
  reducedMotion: boolean
}

const LAYOUT_INTERVAL_SECONDS = 1 / 12

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
  uniform vec3 lightningColor;
  uniform vec3 deckColor;
  uniform vec2 gapDirection;
  uniform float visibility;
  uniform float lightning;
  uniform float deckHeight;
  varying vec3 vDirection;

  float deckHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float deckNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(deckHash(i), deckHash(i + vec2(1.0, 0.0)), f.x),
      mix(deckHash(i + vec2(0.0, 1.0)), deckHash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec3 direction = normalize(vDirection);
    // Horizon at eye level. The old shader biased it 0.24 up, which meant the
    // entire windscreen looked at the near-black under-cloud colour.
    float height = direction.y;

    vec3 atmosphere = mix(lowerColor, zenithColor, smoothstep(-0.25, 0.85, height));
    // Light leaking in under the storm deck: the bright band that makes a
    // storm sky read as daylight weather rather than as night.
    float horizonBand = exp(-abs(height) * mix(3.2, 7.0, visibility));
    atmosphere = mix(atmosphere, horizonColor, horizonBand * 0.6);

    // A brighter break in the direction of the navigable gap, so the corridor
    // the radar is pointing at is actually visible out of the window.
    vec2 groundDir = normalize(vec2(direction.x, direction.z) + vec2(0.0001));
    float towardGap = max(0.0, dot(groundDir, gapDirection));
    float breakGlow = pow(towardGap, 24.0) * exp(-abs(height - 0.05) * 4.5);
    atmosphere = mix(atmosphere, horizonColor * 1.35, breakGlow * 0.55 * visibility);

    // Murk thickens toward the horizon rather than dimming the whole dome.
    float murk = (1.0 - visibility) * exp(-max(height, 0.0) * 2.6);
    atmosphere = mix(atmosphere, lowerColor * 1.35, murk * 0.45);

    // Undercast: intersect the view ray with a deck plane below the aircraft.
    // Rays near the horizon land far away and wash out on their own.
    if (direction.y < -0.012) {
      vec2 hit = direction.xz * (deckHeight / -direction.y);
      float reach = length(hit);
      float mottle = deckNoise(hit * 0.9) * 0.62 + deckNoise(hit * 3.1) * 0.38;
      vec3 deck = mix(deckColor * 0.66, deckColor, mottle);
      float fade = smoothstep(1.0, 14.0, reach);
      deck = mix(deck, horizonColor, fade * 0.94);
      deck += lightningColor * lightning * 0.4 * (1.0 - fade);
      atmosphere = mix(atmosphere, deck, smoothstep(0.012, 0.09, -direction.y));
    }

    float sheet = exp(-abs(height + 0.04) * 2.6);
    atmosphere += lightningColor * lightning * sheet * 0.9;

    gl_FragColor = vec4(atmosphere, 1.0);
    #include <colorspace_fragment>
  }
`

const CLOUD_VERTEX_SHADER = `
  attribute float instanceAlpha;
  attribute float instanceHaze;
  attribute float instanceShade;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vHaze;
  varying float vShade;
  void main() {
    vUv = uv;
    vAlpha = instanceAlpha;
    vHaze = instanceHaze;
    vShade = instanceShade;
    vec4 localPosition = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      localPosition = instanceMatrix * localPosition;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * localPosition;
  }
`

const CLOUD_FRAGMENT_SHADER = `
  uniform sampler2D map;
  uniform vec3 hazeColor;
  uniform vec3 litColor;
  uniform vec3 lightningColor;
  uniform float lightning;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vHaze;
  varying float vShade;
  void main() {
    vec4 texel = texture2D(map, vUv);
    if (texel.a < 0.004) discard;

    // vShade carries the puff's height in its tower: dark rain base through to
    // sunlit anvil. A single flat tint is what made these read as cut-outs.
    vec3 color = mix(vec3(0.10, 0.12, 0.15), litColor, clamp(vShade, 0.0, 1.0));
    // A little self-shadowing inside each puff keeps them from looking like discs.
    color *= 0.78 + 0.22 * smoothstep(0.0, 0.9, vUv.y);

    color = mix(color, hazeColor, vHaze * 0.5);
    color += lightningColor * lightning * (0.25 + (1.0 - vHaze) * 0.75);

    float alpha = texel.a * vAlpha * (1.0 - vHaze * 0.3);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
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
  uniform vec3 rainColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(21.98, 78.233))) * 41758.5453);
  }

  void main() {
    // Soft ragged veil. The previous sin(vUv.x * 96.0) drew hard vertical bars
    // that read as rendering artefacts rather than as precipitation.
    float sideFade = smoothstep(0.0, 0.42, vUv.x) * smoothstep(0.0, 0.42, 1.0 - vUv.x);
    float topFade = smoothstep(0.0, 0.34, 1.0 - vUv.y);
    float lowerFade = smoothstep(0.0, 0.55, vUv.y);
    float ragged = 0.66
      + 0.2 * hash(vec2(floor(vUv.x * 26.0), 0.0))
      + 0.14 * hash(vec2(floor(vUv.x * 9.0), 1.0));
    float alpha = sideFade * topFade * lowerFade * ragged * rainOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(rainColor, alpha);
    #include <colorspace_fragment>
  }
`

const NEAR_RAIN_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/** Near-field streaks blowing past the windscreen, so the storm reads as wet. */
const NEAR_RAIN_FRAGMENT_SHADER = `
  uniform float time;
  uniform float rainAmount;
  varying vec2 vUv;

  float hash(vec2 cell) {
    return fract(sin(dot(cell, vec2(41.317, 289.107))) * 43758.5453);
  }

  float layer(vec2 uv, float columns, float speed, float slant) {
    uv *= vec2(columns, 30.0);
    uv.x += uv.y * slant;
    uv.y += time * speed;
    vec2 cell = floor(uv);
    float pick = hash(cell);
    if (pick < 0.9) return 0.0;
    vec2 local = fract(uv);
    float body = smoothstep(1.0, 0.0, abs(local.x - 0.5) * 2.4);
    float tail = smoothstep(1.0, 0.15, local.y) * smoothstep(0.0, 0.12, local.y);
    return body * tail * (0.4 + pick * 0.6);
  }

  void main() {
    if (rainAmount <= 0.001) discard;
    float streaks = layer(vUv, 150.0, 11.0, 0.05) * 0.66
      + layer(vUv + vec2(0.37, 0.11), 96.0, 7.5, 0.08) * 0.44;
    // Fade at the frame edge so the plane never shows its own silhouette.
    float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(0.0, 0.06, 1.0 - vUv.x)
      * smoothstep(0.0, 0.06, vUv.y) * smoothstep(0.0, 0.06, 1.0 - vUv.y);
    float alpha = streaks * edge * rainAmount * 0.3;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(0.40, 0.47, 0.53, alpha);
    #include <colorspace_fragment>
  }
`

/**
 * A soft irregular puff with a gaussian falloff and no flat core. A sprite with
 * a flat centre reads as a disc no matter how soft its rim is, which is what
 * turned the towers into bokeh. Satellite lobes break the circular silhouette.
 */
function makeCloudTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is unavailable for Airbus atmosphere.')
  context.clearRect(0, 0, size, size)

  const gaussian = (
    x: number,
    y: number,
    radius: number,
    peak: number,
  ) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
    for (let step = 0; step <= 8; step += 1) {
      const t = step / 8
      gradient.addColorStop(t, `rgba(255,255,255,${peak * Math.exp(-1.9 * t * t)})`)
    }
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }

  gaussian(size / 2, size / 2, size * 0.5, 0.3)

  // Deterministic satellites, so the puff is irregular but stable across runs.
  let seed = 0x2f6e2b1
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0x100000000
  }
  for (let lobe = 0; lobe < 11; lobe += 1) {
    const angle = random() * Math.PI * 2
    const spread = (0.16 + random() * 0.28) * size
    gaussian(
      size / 2 + Math.cos(angle) * spread,
      size / 2 + Math.sin(angle) * spread,
      size * (0.1 + random() * 0.16),
      0.035 + random() * 0.05,
    )
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  return texture
}

function setUniform(
  material: THREE.ShaderMaterial | null | undefined,
  name: string,
  value: number,
): void {
  const uniform = material?.uniforms[name]
  if (uniform) uniform.value = value
}

function addUniform(
  material: THREE.ShaderMaterial | null | undefined,
  name: string,
  amount: number,
): void {
  const uniform = material?.uniforms[name]
  if (uniform) uniform.value = (uniform.value as number) + amount
}

function setColorUniform(
  material: THREE.ShaderMaterial | null | undefined,
  name: string,
  color: string,
): void {
  const uniform = material?.uniforms[name]
  if (uniform) (uniform.value as THREE.Color).set(color)
}

interface AtmosphereResources {
  skyUniforms: {
    zenithColor: { value: THREE.Color }
    horizonColor: { value: THREE.Color }
    lowerColor: { value: THREE.Color }
    lightningColor: { value: THREE.Color }
    deckColor: { value: THREE.Color }
    gapDirection: { value: THREE.Vector2 }
    visibility: { value: number }
    lightning: { value: number }
    deckHeight: { value: number }
  }
  cloudUniforms: {
    map: { value: THREE.Texture }
    hazeColor: { value: THREE.Color }
    litColor: { value: THREE.Color }
    lightningColor: { value: THREE.Color }
    lightning: { value: number }
  }
  rainUniforms: { rainOpacity: { value: number }; rainColor: { value: THREE.Color } }
  nearRainUniforms: { time: { value: number }; rainAmount: { value: number } }
  cloudGeometry: THREE.PlaneGeometry
  cloudMaterial: THREE.ShaderMaterial
}

function createAtmosphereResources(cloudTexture: THREE.Texture): AtmosphereResources {
  const skyUniforms = {
    zenithColor: { value: new THREE.Color('#17384c') },
    horizonColor: { value: new THREE.Color('#a5bcc0') },
    lowerColor: { value: new THREE.Color('#26343a') },
    lightningColor: { value: new THREE.Color('#cfe4ff') },
    deckColor: { value: new THREE.Color('#4d5c66') },
    gapDirection: { value: new THREE.Vector2(0, -1) },
    visibility: { value: 0.8 },
    lightning: { value: 0 },
    deckHeight: { value: 1 },
  }
  const cloudUniforms = {
    map: { value: cloudTexture },
    hazeColor: { value: new THREE.Color('#9bb3b7') },
    litColor: { value: new THREE.Color('#eef4f8') },
    lightningColor: { value: new THREE.Color('#dbeaff') },
    lightning: { value: 0 },
  }
  const cloudGeometry = new THREE.PlaneGeometry(1, 1)
  for (const name of ['instanceAlpha', 'instanceHaze', 'instanceShade']) {
    cloudGeometry.setAttribute(
      name,
      new THREE.InstancedBufferAttribute(new Float32Array(MAX_AIRBUS_CLOUD_CLUSTERS), 1),
    )
  }

  return {
    skyUniforms,
    cloudUniforms,
    rainUniforms: {
      rainOpacity: { value: 0.22 },
      rainColor: { value: new THREE.Color('#54646e') },
    },
    nearRainUniforms: { time: { value: 0 }, rainAmount: { value: 0 } },
    cloudGeometry,
    cloudMaterial: new THREE.ShaderMaterial({
      vertexShader: CLOUD_VERTEX_SHADER,
      fragmentShader: CLOUD_FRAGMENT_SHADER,
      uniforms: cloudUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  }
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
      ownship: stormLineOwnshipTrack(frame.state),
    })
  }
  return deriveAirbusWeatherField({
    scenario: 'engineOut',
    checkpoint: frame.state.checkpoint,
    elapsedSeconds: frame.state.stageElapsedSeconds,
    intensity: 0.12,
    seed: 41,
    ownship: engineOutOwnshipTrack(frame.state),
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
  const canvasRef = useRef(gl.domElement)
  const lastLayoutTimeRef = useRef(-1)
  const reducedMotionRef = useRef(reducedMotion)
  const layoutRef = useRef<AirbusAtmosphereLayout | null>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const cloudTexture = useMemo(() => makeCloudTexture(), [])
  const attitudeQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const rollQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const yawQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const rollAxis = useMemo(() => new THREE.Vector3(0, 0, 1), [])
  const yawAxis = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  // Created once and handed to the renderer. Everything that changes per frame
  // is written through the material refs below, never through these names.
  const resources = useMemo(() => createAtmosphereResources(cloudTexture), [cloudTexture])
  const skyMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const rainMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const nearRainMaterialRef = useRef<THREE.ShaderMaterial>(null)

  useEffect(() => {
    reducedMotionRef.current = reducedMotion
  }, [reducedMotion])

  useEffect(() => {
    canvasRef.current = gl.domElement
  }, [gl])

  useEffect(() => {
    return () => {
      cloudTexture.dispose()
      resources.cloudGeometry.dispose()
      resources.cloudMaterial.dispose()
      weatherSnapshotRef.current = null
    }
  }, [cloudTexture, resources, weatherSnapshotRef])

  useFrame(({ clock }, delta) => {
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

    // Lightning and rain are sampled every frame. The old 12 Hz gate skipped the
    // 0.12 s flash window far more often than it caught it.
    const scenarioSeconds = frame.scenario === 'stormLine'
      ? frame.state.elapsedSeconds
      : frame.state.stageElapsedSeconds
    const snapshot = weatherForFrame(frame)
    weatherSnapshotRef.current = snapshot

    const flash = airbusLightningFlash(
      scenarioSeconds,
      snapshot.lightningEligible && !reducedMotionRef.current,
    )
    const cloudMaterial = clouds.material as THREE.ShaderMaterial
    setUniform(skyMaterialRef.current, 'lightning', flash.intensity)
    setUniform(cloudMaterial, 'lightning', flash.intensity)

    setUniform(
      nearRainMaterialRef.current,
      'rainAmount',
      snapshot.scenario === 'stormLine'
        ? Math.max(0, snapshot.precipitation - 0.18) * (reducedMotionRef.current ? 0.35 : 1)
        : 0,
    )
    if (!reducedMotionRef.current) addUniform(nearRainMaterialRef.current, 'time', delta)

    const layout = layoutRef.current
    if (flashRef.current) {
      flashRef.current.intensity = flash.intensity * 3.4
      // Anchor the flash inside a deterministic cell so successive strikes come
      // from different parts of the line instead of one fixed point.
      const clusters = layout?.clusters ?? []
      if (clusters.length > 0) {
        const anchor = clusters[flash.strikeIndex % clusters.length]!
        flashRef.current.position.set(
          anchor.position[0] * 0.7,
          anchor.position[1] * 0.7,
          anchor.position[2] * 0.7,
        )
      }
    }
    canvasRef.current.dataset.airbusLightningActive = String(flash.intensity > 0.02)
    canvasRef.current.dataset.airbusLightningIntensity = flash.intensity.toFixed(3)

    if (clock.elapsedTime - lastLayoutTimeRef.current < LAYOUT_INTERVAL_SECONDS) return
    lastLayoutTimeRef.current = clock.elapsedTime

    const nextLayout = deriveAirbusAtmosphereLayout(snapshot, {
      reducedMotion: reducedMotionRef.current,
    })
    layoutRef.current = nextLayout

    // Far to near, so transparent quads blend in a sane order.
    const ordered = [...nextLayout.clusters].sort((left, right) =>
      (right.position[0] ** 2 + right.position[1] ** 2 + right.position[2] ** 2)
      - (left.position[0] ** 2 + left.position[1] ** 2 + left.position[2] ** 2),
    )
    const alphaAttribute = clouds.geometry.getAttribute('instanceAlpha') as THREE.InstancedBufferAttribute
    const hazeAttribute = clouds.geometry.getAttribute('instanceHaze') as THREE.InstancedBufferAttribute
    const shadeAttribute = clouds.geometry.getAttribute('instanceShade') as THREE.InstancedBufferAttribute

    clouds.count = Math.min(ordered.length, MAX_AIRBUS_CLOUD_CLUSTERS)
    for (const [index, cluster] of ordered.slice(0, clouds.count).entries()) {
      dummy.position.set(...cluster.position)
      dummy.rotation.set(0, cluster.yawRadians, cluster.rollRadians, 'YXZ')
      dummy.scale.set(
        cluster.scale[0] * (cluster.mirrored ? -1 : 1),
        cluster.scale[1],
        cluster.scale[2],
      )
      dummy.updateMatrix()
      clouds.setMatrixAt(index, dummy.matrix)
      alphaAttribute.setX(index, cluster.opacity)
      hazeAttribute.setX(index, cluster.haze)
      shadeAttribute.setX(index, cluster.shade)
    }
    clouds.instanceMatrix.needsUpdate = true
    alphaAttribute.needsUpdate = true
    hazeAttribute.needsUpdate = true
    shadeAttribute.needsUpdate = true

    rain.count = Math.min(nextLayout.rainShafts.length, MAX_AIRBUS_RAIN_SHAFTS)
    for (const [index, shaft] of nextLayout.rainShafts.slice(0, rain.count).entries()) {
      dummy.position.set(...shaft.position)
      dummy.rotation.set(0, shaft.yawRadians, 0, 'YXZ')
      dummy.scale.set(...shaft.scale)
      dummy.updateMatrix()
      rain.setMatrixAt(index, dummy.matrix)
    }
    rain.instanceMatrix.needsUpdate = true

    setUniform(
      rainMaterialRef.current,
      'rainOpacity',
      nextLayout.rainShafts.length > 0
        ? Math.max(...nextLayout.rainShafts.map((shaft) => shaft.opacity))
        : 0,
    )

    const stormPalette = snapshot.scenario === 'stormLine'
    const sky = skyMaterialRef.current
    const horizonColor = stormPalette ? '#8ea4ac' : '#d8d5be'
    setColorUniform(sky, 'zenithColor', stormPalette ? '#22384a' : '#2f6e96')
    setColorUniform(sky, 'horizonColor', horizonColor)
    setColorUniform(sky, 'lowerColor', stormPalette ? '#46535b' : '#68818a')
    setUniform(sky, 'visibility', snapshot.visibility)

    // Point the sky's bright break down the navigable gap, so the corridor the
    // radar is showing is the one the player can see out of the window.
    const gapRadians = nextLayout.visibleGapBearingDegrees * Math.PI / 180
    const gapDirection = sky?.uniforms.gapDirection?.value as THREE.Vector2 | undefined
    gapDirection?.set(Math.sin(gapRadians), -Math.cos(gapRadians))

    setColorUniform(sky, 'deckColor', stormPalette ? '#3b464e' : '#8fa2ab')
    setColorUniform(rainMaterialRef.current, 'rainColor', stormPalette ? '#596a75' : '#7d8d96')

    // Distant cloud tops must wash toward whatever the horizon actually is.
    setColorUniform(cloudMaterial, 'hazeColor', stormPalette ? '#8ea4ac' : '#c9cbbb')
    setColorUniform(cloudMaterial, 'litColor', stormPalette ? '#dde8ee' : '#fbfaf3')

    canvasRef.current.dataset.airbusWeatherSignature = snapshot.signature
    canvasRef.current.dataset.airbusWeatherGapBearing = snapshot.gapBearingDegrees.toFixed(2)
    canvasRef.current.dataset.airbusVisibleGapBearing = nextLayout.visibleGapBearingDegrees.toFixed(2)
    canvasRef.current.dataset.airbusWeatherCloudCount = String(nextLayout.clusters.length)
    canvasRef.current.dataset.airbusWeatherDepthBands = String(
      new Set(nextLayout.clusters.map((cluster) => cluster.band)).size,
    )
    canvasRef.current.dataset.airbusRainShaftCount = String(nextLayout.rainShafts.length)
    canvasRef.current.dataset.airbusAtmosphereMotionScale = nextLayout.motionScale.toFixed(2)
    canvasRef.current.dataset.airbusOwnshipHeading =
      snapshot.ownshipHeadingOffsetDegrees.toFixed(2)
    canvasRef.current.dataset.airbusOwnshipClosure = snapshot.closureNm.toFixed(2)
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
          uniforms={resources.skyUniforms}
        />
      </mesh>
      <instancedMesh
        ref={cloudsRef}
        args={[resources.cloudGeometry, resources.cloudMaterial, MAX_AIRBUS_CLOUD_CLUSTERS]}
        renderOrder={-60}
        frustumCulled={false}
      />
      <instancedMesh
        ref={rainRef}
        args={[undefined, undefined, MAX_AIRBUS_RAIN_SHAFTS]}
        renderOrder={-50}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={rainMaterialRef}
          vertexShader={RAIN_VERTEX_SHADER}
          fragmentShader={RAIN_FRAGMENT_SHADER}
          uniforms={resources.rainUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>
      <mesh position={[0, 0, -28]} renderOrder={-40} frustumCulled={false}>
        <planeGeometry args={[96, 68]} />
        <shaderMaterial
          ref={nearRainMaterialRef}
          vertexShader={NEAR_RAIN_VERTEX_SHADER}
          fragmentShader={NEAR_RAIN_FRAGMENT_SHADER}
          uniforms={resources.nearRainUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={flashRef} position={[0, 24, -65]} color="#d9edff" intensity={0} distance={150} />
    </group>
  )
}
