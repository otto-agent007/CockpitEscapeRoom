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
}

export interface AirbusRainShaft {
  id: string
  cellId: string
  position: readonly [number, number, number]
  scale: readonly [number, number, number]
  opacity: number
}

export interface AirbusAtmosphereLayout {
  clusters: readonly AirbusCloudCluster[]
  rainShafts: readonly AirbusRainShaft[]
  gapBearingDegrees: number
  motionScale: number
}

export interface AirbusAtmosphereLayoutOptions {
  reducedMotion: boolean
}

const MAX_CLUSTERS = 48
const MAX_RAIN_SHAFTS = 8

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

function clusterCount(cell: AirbusWeatherCell, scenario: AirbusWeatherFieldSnapshot['scenario']): number {
  if (scenario === 'engineOut') return 2
  return cell.verticalDevelopment > 0.82 ? 4 : cell.verticalDevelopment > 0.62 ? 3 : 2
}

function projectCell(
  cell: AirbusWeatherCell,
  snapshot: AirbusWeatherFieldSnapshot,
  layer: number,
): AirbusCloudCluster {
  const band = depthBand(cell.distanceNm)
  const distance = 18 + cell.distanceNm * 1.45
  const bearingRadians = cell.bearingDegrees * Math.PI / 180
  const variation = seededVariation(cell.id, layer)
  const layerSpread = layer - (clusterCount(cell, snapshot.scenario) - 1) / 2
  const horizontalSpread = layerSpread * cell.radiusNm * (0.36 + variation * 0.18)
  const x = Math.sin(bearingRadians) * distance + horizontalSpread
  const z = -Math.cos(bearingRadians) * distance
  const verticalStack = layer * cell.verticalDevelopment * 2.8
  const horizonElevation = distance * 0.24
  const y = horizonElevation
    + 1.8
    + cell.altitudeOffset * 9
    + verticalStack
    + (variation - 0.5) * 1.4
  const baseScale = cell.radiusNm * (0.52 + variation * 0.14)
  const bandOpacity = band === 'near' ? 0.82 : band === 'middle' ? 0.68 : 0.48

  return {
    id: `${cell.id}-cluster-${layer}`,
    cellId: cell.id,
    band,
    bearingDegrees: cell.bearingDegrees,
    position: [x, y, z],
    scale: [
      baseScale * 1.45,
      baseScale * (0.72 + cell.verticalDevelopment * 0.5),
      baseScale,
    ],
    opacity: Math.min(0.94, bandOpacity + cell.precipitation * 0.1),
    precipitation: cell.precipitation,
  }
}

function projectRainShaft(cell: AirbusWeatherCell): AirbusRainShaft {
  const distance = 18 + cell.distanceNm * 1.45
  const bearingRadians = cell.bearingDegrees * Math.PI / 180
  const width = cell.radiusNm * 0.9

  return {
    id: `${cell.id}-rain`,
    cellId: cell.id,
    position: [
      Math.sin(bearingRadians) * distance,
      distance * 0.24 - 6.2 + cell.altitudeOffset * 4,
      -Math.cos(bearingRadians) * distance,
    ],
    scale: [width, 7 + cell.verticalDevelopment * 8, width * 0.45],
    opacity: Math.min(0.52, 0.12 + cell.precipitation * 0.42),
  }
}

export function deriveAirbusAtmosphereLayout(
  snapshot: AirbusWeatherFieldSnapshot,
  options: AirbusAtmosphereLayoutOptions,
): AirbusAtmosphereLayout {
  const clusters = snapshot.cells
    .flatMap((cell) =>
      Array.from(
        { length: clusterCount(cell, snapshot.scenario) },
        (_, layer) => projectCell(cell, snapshot, layer),
      ),
    )
    .slice(0, MAX_CLUSTERS)
  const rainShafts = snapshot.scenario === 'stormLine'
    ? snapshot.cells
      .filter((cell) => cell.precipitation >= 0.48)
      .sort((left, right) => right.precipitation - left.precipitation)
      .slice(0, MAX_RAIN_SHAFTS)
      .map(projectRainShaft)
    : []

  return {
    clusters,
    rainShafts,
    gapBearingDegrees: snapshot.gapBearingDegrees,
    motionScale: options.reducedMotion ? 0.18 : 1,
  }
}
