import type {
  AirbusWeatherCell,
  AirbusWeatherFieldSnapshot,
} from '../game/airbusWeatherField'

export type AirbusCloudDepthBand = 'near' | 'middle' | 'far'

export interface AirbusCloudCluster {
  id: string
  cellId: string
  band: AirbusCloudDepthBand
  bearingDegrees: number
  position: readonly [number, number, number]
  scale: readonly [number, number, number]
  opacity: number
  precipitation: number
  /**
   * Yaw that turns the quad to face the viewer. The atmosphere root copies the
   * camera transform, so an unrotated quad out at 67 deg bearing is seen 67 deg
   * off-normal and renders as a foreshortened sliver.
   */
  yawRadians: number
  /**
   * Full seeded in-plane roll. One texture repeated hundreds of times shows its
   * own lobe pattern unless every instance is turned to a different angle.
   */
  rollRadians: number
  /** Seeded horizontal mirror, for the same reason. */
  mirrored: boolean
  /** 0 near, 1 far. Washes distant cells toward the sky so depth reads. */
  haze: number
  /** Brightness of this puff: dark rain base through to sunlit anvil. */
  shade: number
  /** 0 at the cell base, 1 at the anvil. */
  towerFraction: number
}

export interface AirbusRainShaft {
  id: string
  cellId: string
  position: readonly [number, number, number]
  scale: readonly [number, number, number]
  opacity: number
  yawRadians: number
}

export interface AirbusLightningFlash {
  /** 0 when dark. Multi-stroke, so it flickers rather than blinking once. */
  intensity: number
  strikeIndex: number
}

export interface AirbusAtmosphereLayout {
  clusters: readonly AirbusCloudCluster[]
  rainShafts: readonly AirbusRainShaft[]
  gapBearingDegrees: number
  visibleGapBearingDegrees: number
  motionScale: number
}

export interface AirbusAtmosphereLayoutOptions {
  reducedMotion: boolean
}

/**
 * Cloud sprites are instanced quads, so the budget is bound by fill rate rather
 * than draw calls. A convective tower needs enough puffs to read as a solid
 * mass; three sprites per cell read as paper cut-outs.
 */
export const MAX_AIRBUS_CLOUD_CLUSTERS = 340
export const MAX_AIRBUS_RAIN_SHAFTS = 8

/** Scene units per unit of authored cell altitude offset. */
const ALTITUDE_SCALE = 30

/**
 * Cell distances are projected as `18 + nm * 1.45`, so every cell dimension
 * taken from `radiusNm` has to use the same conversion. Using the raw nm value
 * made each puff about a third of its correct size, which is why a tower
 * rendered as a chain of separated dots instead of a solid mass.
 */
const NM_TO_SCENE = 1.45

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/**
 * Widest bearing worth building sprites for: the windscreen covers roughly
 * +/-33 deg and the look control adds about 10 deg either side. Cells beyond
 * this cannot be seen, and because bearings are ownship-relative a cell rotates
 * back into the field as soon as the player turns toward it.
 */
const VISIBLE_BEARING_LIMIT_DEGREES = 62

/**
 * How far the visible gap may be nudged from the bearing the ND prints, and how
 * hard each degree of drift is penalised. Both exist so the window and the
 * instrument cannot disagree by more than the browser suite's 5-degree contract.
 */
const VISIBLE_GAP_SEARCH_DEGREES = 4
const VISIBLE_GAP_DRIFT_PENALTY = 0.08

function depthBand(distanceNm: number): AirbusCloudDepthBand {
  if (distanceNm <= 32) return 'near'
  if (distanceNm <= 50) return 'middle'
  return 'far'
}

function seededVariation(id: string, layer: number): number {
  let hash = 2166136261
  for (const character of `${id}:${layer}`) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 0xffffffff
}

/** Yaw that points the quad's +Z normal back at the viewer sitting at the group origin. */
function billboardYaw(x: number, z: number): number {
  return Math.atan2(-x, -z)
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** Scene-unit distance washed into a 0..1 haze so far cells recede into the murk. */
function depthHaze(distance: number): number {
  return clamp01((distance - 45) / 120)
}

function spriteCount(
  cell: AirbusWeatherCell,
  scenario: AirbusWeatherFieldSnapshot['scenario'],
): number {
  if (scenario === 'engineOut') return 4
  const closeness = clamp01(1 - (cell.distanceNm - 8) / 60)
  return Math.round(17 + cell.verticalDevelopment * 7 + closeness * 5)
}

interface CellGeometry {
  visualBearingDegrees: number
  distance: number
  towerHeight: number
  baseY: number
  shearSign: number
}

function cellGeometry(
  cell: AirbusWeatherCell,
  snapshot: AirbusWeatherFieldSnapshot,
  motionScale: number,
): CellGeometry {
  const approachRate = snapshot.scenario === 'stormLine' ? 0.012 : 0.006
  const visualDistanceNm = cell.distanceNm
    + snapshot.elapsedSeconds * approachRate * (1 - motionScale)
  const visualBearingDegrees = cell.bearingDegrees
    - cell.driftDegreesPerSecond * snapshot.elapsedSeconds * (1 - motionScale)
  const towerHeight = cell.radiusNm * NM_TO_SCENE * (snapshot.scenario === 'stormLine'
    ? 1.5 + cell.verticalDevelopment * 2.1
    : 0.5)
  return {
    visualBearingDegrees,
    distance: 18 + visualDistanceNm * 1.45,
    towerHeight,
    // The cell's own altitude, then drop the tower so it straddles our level
    // instead of floating above it. The old layout lifted every cluster by
    // 0.24 x distance, which parked the whole storm above the windscreen.
    baseY: cell.altitudeOffset * ALTITUDE_SCALE - towerHeight * 0.42,
    shearSign: cell.driftDegreesPerSecond >= 0 ? 1 : -1,
  }
}

/**
 * One convective tower, built as a stack of puffs: wide turbulent base, pinched
 * waist, flared anvil sheared downwind.
 */
function projectCellSprite(
  cell: AirbusWeatherCell,
  geometry: CellGeometry,
  layer: number,
  count: number,
): AirbusCloudCluster {
  const { visualBearingDegrees, distance, towerHeight, baseY, shearSign } = geometry
  const towerFraction = count > 1 ? layer / (count - 1) : 0
  const variation = seededVariation(cell.id, layer)
  const lateralVariation = seededVariation(cell.id, layer + 43)
  const depthVariation = seededVariation(cell.id, layer + 71)
  const bearingRadians = visualBearingDegrees * Math.PI / 180

  const cellRadius = cell.radiusNm * NM_TO_SCENE
  // Wide turbulent base, pinched waist, flared anvil: the classic CB profile.
  const waist = 1 - 0.3 * Math.sin(towerFraction * Math.PI)
  const anvil = 1 + smoothstep(0.66, 1, towerFraction) * 0.55
  const baseFlare = 1 + smoothstep(0.22, 0, towerFraction) * 0.45

  // Fill the tower as a volume, not as a stack. Puffs placed on a single
  // vertical line read as a string of beads however much they overlap; a
  // golden-angle spiral with a sqrt radius spreads them evenly through the
  // tapered cylinder so they merge into one mass.
  const spiralAngle = layer * GOLDEN_ANGLE + seededVariation(cell.id, 7) * Math.PI * 2
  const towerRadius = cellRadius * 0.22 * waist * anvil * baseFlare
  const radialOffset = Math.sqrt(lateralVariation) * towerRadius
  const shear = towerFraction * towerFraction * cellRadius * 0.5 * shearSign

  const x = Math.sin(bearingRadians) * distance
    + Math.cos(spiralAngle) * radialOffset
    + shear
  const z = -Math.cos(bearingRadians) * distance
    + Math.sin(spiralAngle) * radialOffset * 0.8
  const y = baseY
    + (towerFraction + (depthVariation - 0.5) * 0.55 / Math.max(1, count - 1)) * towerHeight
    + (variation - 0.5) * cellRadius * 0.18

  const puffScale = cellRadius * (0.72 + variation ** 2 * 0.36) * waist * anvil * baseFlare
  const radial = Math.hypot(x, y, z)
  // Bright anvil, dark rain base. Sprites low in the tower are in shadow.
  const flank = 0.88 + 0.12 * Math.cos(bearingRadians * 1.6 + lateralVariation * 1.2)
  const shade = (0.42 + towerFraction * 0.58) * (1 - cell.precipitation * 0.2) * flank

  return {
    id: `${cell.id}-cluster-${layer}`,
    cellId: cell.id,
    band: depthBand(cell.distanceNm),
    bearingDegrees: visualBearingDegrees,
    position: [x, y, z],
    scale: [puffScale * 1.18, puffScale * (0.72 + cell.verticalDevelopment * 0.26), puffScale],
    opacity: Math.min(0.9, 0.55 + cell.precipitation * 0.22 + (1 - towerFraction) * 0.14),
    precipitation: cell.precipitation,
    yawRadians: billboardYaw(x, z),
    rollRadians: seededVariation(cell.id, layer + 131) * Math.PI * 2,
    mirrored: seededVariation(cell.id, layer + 97) > 0.5,
    haze: depthHaze(radial),
    shade,
    towerFraction,
  }
}

/** The precipitation curtain hanging out of a cell base, down past our level. */
function projectRainShaft(
  cell: AirbusWeatherCell,
  snapshot: AirbusWeatherFieldSnapshot,
  motionScale: number,
): AirbusRainShaft {
  const geometry = cellGeometry(cell, snapshot, motionScale)
  const bearingRadians = geometry.visualBearingDegrees * Math.PI / 180
  const width = cell.radiusNm * NM_TO_SCENE * 1.15
  const height = 20 + cell.verticalDevelopment * 30
  const x = Math.sin(bearingRadians) * geometry.distance
  const z = -Math.cos(bearingRadians) * geometry.distance

  return {
    id: `${cell.id}-rain`,
    cellId: cell.id,
    // Hangs from the cell base downward, so it reads as falling out of the cloud.
    position: [x, geometry.baseY - height * 0.42, z],
    scale: [width, height, width * 0.45],
    opacity: Math.min(0.46, 0.1 + cell.precipitation * 0.36),
    yawRadians: billboardYaw(x, z),
  }
}

const LIGHTNING_STRIKE_PERIOD_SECONDS = 8.5
const LIGHTNING_STRIKE_WINDOW_SECONDS = 0.62

function strikeJitter(strikeIndex: number, salt: number): number {
  const noise = Math.sin(strikeIndex * 37.719 + salt * 11.413) * 21374.729
  return noise - Math.floor(noise)
}

function stroke(localSeconds: number, atSeconds: number, amplitude: number): number {
  const since = localSeconds - atSeconds
  return since < 0 ? 0 : amplitude * Math.exp(-since * 14)
}

/**
 * Deterministic multi-stroke lightning. Pure so it can be sampled every frame
 * instead of inside a 12 Hz throttle, where a sub-frame flash window is missed
 * far more often than it is caught.
 */
export function airbusLightningFlash(
  elapsedSeconds: number,
  eligible: boolean,
): AirbusLightningFlash {
  const time = Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0)
  const strikeIndex = Math.floor(time / LIGHTNING_STRIKE_PERIOD_SECONDS)
  if (!eligible) return { intensity: 0, strikeIndex }

  const offset = strikeJitter(strikeIndex, 1)
    * (LIGHTNING_STRIKE_PERIOD_SECONDS - LIGHTNING_STRIKE_WINDOW_SECONDS - 0.5)
  const local = time - (strikeIndex * LIGHTNING_STRIKE_PERIOD_SECONDS + offset)
  if (local < 0 || local > LIGHTNING_STRIKE_WINDOW_SECONDS) {
    return { intensity: 0, strikeIndex }
  }

  const intensity = stroke(local, 0, 1)
    + stroke(local, 0.13, 0.34 + strikeJitter(strikeIndex, 2) * 0.42)
    + stroke(local, 0.29, 0.18 + strikeJitter(strikeIndex, 3) * 0.3)
  return { intensity: clamp01(intensity), strikeIndex }
}

function deriveVisibleGapBearing(
  clusters: readonly AirbusCloudCluster[],
  targetBearingDegrees: number,
): number {
  // Search a narrow window and pay a penalty for straying from the authored
  // gap. The ND draws the nominal bearing, so the bearing the player can
  // actually see through has to stay next to it -- a wide unpenalised search
  // lets a denser sprite field pick a winner far from what the ND is showing.
  const candidates = Array.from(
    { length: 2 * VISIBLE_GAP_SEARCH_DEGREES + 1 },
    (_, index) => targetBearingDegrees - VISIBLE_GAP_SEARCH_DEGREES + index,
  ).sort((left, right) =>
    Math.abs(left - targetBearingDegrees) - Math.abs(right - targetBearingDegrees),
  )
  let bestBearing = targetBearingDegrees
  let bestOcclusion = Number.POSITIVE_INFINITY

  for (const candidate of candidates) {
    let occlusion = Math.abs(candidate - targetBearingDegrees) * VISIBLE_GAP_DRIFT_PENALTY
    for (const cluster of clusters) {
      const distance = Math.hypot(cluster.position[0], cluster.position[2])
      const angularRadius = Math.max(
        2,
        Math.atan2(cluster.scale[0] * 0.42, distance) * 180 / Math.PI,
      )
      const separation = Math.abs(candidate - cluster.bearingDegrees)
      const overlap = Math.max(0, 1 - separation / angularRadius)
      occlusion += overlap * cluster.opacity * (0.35 + cluster.precipitation * 0.65)
    }
    if (occlusion < bestOcclusion) {
      bestOcclusion = occlusion
      bestBearing = candidate
    }
  }
  return bestBearing
}

export function deriveAirbusAtmosphereLayout(
  snapshot: AirbusWeatherFieldSnapshot,
  options: AirbusAtmosphereLayoutOptions,
): AirbusAtmosphereLayout {
  const motionScale = options.reducedMotion ? 0.18 : 1
  const clusters = snapshot.cells
    .filter((cell) => Math.abs(cell.bearingDegrees) <= VISIBLE_BEARING_LIMIT_DEGREES)
    .flatMap((cell) => {
      const geometry = cellGeometry(cell, snapshot, motionScale)
      const count = spriteCount(cell, snapshot.scenario)
      return Array.from(
        { length: count },
        (_, layer) => projectCellSprite(cell, geometry, layer, count),
      )
    })
    .slice(0, MAX_AIRBUS_CLOUD_CLUSTERS)
  const rainShafts = snapshot.scenario === 'stormLine'
    ? snapshot.cells
      .filter((cell) => cell.precipitation >= 0.48
        && Math.abs(cell.bearingDegrees) <= VISIBLE_BEARING_LIMIT_DEGREES)
      .sort((left, right) => right.precipitation - left.precipitation)
      .slice(0, MAX_AIRBUS_RAIN_SHAFTS)
      .map((cell) => projectRainShaft(cell, snapshot, motionScale))
    : []

  return {
    clusters,
    rainShafts,
    gapBearingDegrees: snapshot.gapBearingDegrees,
    visibleGapBearingDegrees: deriveVisibleGapBearing(
      clusters,
      snapshot.gapBearingDegrees,
    ),
    motionScale,
  }
}
