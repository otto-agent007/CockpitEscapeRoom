import type { EngineOutCheckpoint } from './airbusEngineOut'
import type { StormLineCheckpoint } from './airbusSimulator'

export type AirbusWeatherScenario = 'stormLine' | 'engineOut'

export interface AirbusWeatherFieldInput {
  scenario: AirbusWeatherScenario
  checkpoint: StormLineCheckpoint | EngineOutCheckpoint
  elapsedSeconds: number
  intensity: number
  seed: number
}

export interface AirbusWeatherCell {
  id: string
  bearingDegrees: number
  distanceNm: number
  altitudeOffset: number
  radiusNm: number
  verticalDevelopment: number
  precipitation: number
  driftDegreesPerSecond: number
}

export interface AirbusWeatherFieldSnapshot {
  signature: string
  scenario: AirbusWeatherScenario
  elapsedSeconds: number
  visibility: number
  ambientLight: number
  precipitation: number
  turbulence: number
  lightningEligible: boolean
  gapBearingDegrees: number
  cells: readonly AirbusWeatherCell[]
}

interface WeatherEnvelope {
  cellCount: number
  visibility: number
  ambientLight: number
  precipitation: number
  turbulence: number
  lightningEligible: boolean
  gapBearingDegrees: number
}

interface CellTemplate {
  bearingDegrees: number
  distanceNm: number
  radiusNm: number
  altitudeOffset: number
  verticalDevelopment: number
  precipitation: number
  driftDegreesPerSecond: number
}

const STORM_CELL_TEMPLATES: readonly CellTemplate[] = [
  { bearingDegrees: -63, distanceNm: 18, radiusNm: 5.5, altitudeOffset: -0.18, verticalDevelopment: 0.68, precipitation: 0.62, driftDegreesPerSecond: 0.018 },
  { bearingDegrees: -52, distanceNm: 31, radiusNm: 8.5, altitudeOffset: 0.08, verticalDevelopment: 0.82, precipitation: 0.78, driftDegreesPerSecond: 0.014 },
  { bearingDegrees: -43, distanceNm: 49, radiusNm: 10.5, altitudeOffset: 0.22, verticalDevelopment: 0.92, precipitation: 0.91, driftDegreesPerSecond: 0.011 },
  { bearingDegrees: -35, distanceNm: 24, radiusNm: 5.2, altitudeOffset: -0.1, verticalDevelopment: 0.58, precipitation: 0.28, driftDegreesPerSecond: 0.016 },
  { bearingDegrees: -11, distanceNm: 44, radiusNm: 8.8, altitudeOffset: 0.2, verticalDevelopment: 0.88, precipitation: 0.86, driftDegreesPerSecond: -0.012 },
  { bearingDegrees: 2, distanceNm: 20, radiusNm: 6.4, altitudeOffset: -0.12, verticalDevelopment: 0.65, precipitation: 0.58, driftDegreesPerSecond: -0.018 },
  { bearingDegrees: 13, distanceNm: 36, radiusNm: 9.5, altitudeOffset: 0.18, verticalDevelopment: 0.96, precipitation: 0.94, driftDegreesPerSecond: -0.013 },
  { bearingDegrees: 25, distanceNm: 55, radiusNm: 11, altitudeOffset: 0.3, verticalDevelopment: 0.9, precipitation: 0.82, driftDegreesPerSecond: -0.01 },
  { bearingDegrees: 36, distanceNm: 27, radiusNm: 7, altitudeOffset: -0.05, verticalDevelopment: 0.72, precipitation: 0.66, driftDegreesPerSecond: -0.016 },
  { bearingDegrees: 48, distanceNm: 43, radiusNm: 9.2, altitudeOffset: 0.16, verticalDevelopment: 0.84, precipitation: 0.76, driftDegreesPerSecond: -0.012 },
  { bearingDegrees: 58, distanceNm: 21, radiusNm: 5.6, altitudeOffset: -0.2, verticalDevelopment: 0.6, precipitation: 0.25, driftDegreesPerSecond: -0.018 },
  { bearingDegrees: 67, distanceNm: 58, radiusNm: 10.2, altitudeOffset: 0.24, verticalDevelopment: 0.8, precipitation: 0.7, driftDegreesPerSecond: -0.009 },
]

const ENGINE_OUT_CELL_TEMPLATES: readonly CellTemplate[] = [
  { bearingDegrees: -58, distanceNm: 32, radiusNm: 5.2, altitudeOffset: -0.22, verticalDevelopment: 0.38, precipitation: 0.18, driftDegreesPerSecond: 0.008 },
  { bearingDegrees: -37, distanceNm: 49, radiusNm: 6.2, altitudeOffset: -0.12, verticalDevelopment: 0.42, precipitation: 0.14, driftDegreesPerSecond: 0.006 },
  { bearingDegrees: -12, distanceNm: 58, radiusNm: 5.8, altitudeOffset: -0.26, verticalDevelopment: 0.34, precipitation: 0.1, driftDegreesPerSecond: 0.004 },
  { bearingDegrees: 13, distanceNm: 42, radiusNm: 5.4, altitudeOffset: -0.18, verticalDevelopment: 0.4, precipitation: 0.16, driftDegreesPerSecond: -0.004 },
  { bearingDegrees: 38, distanceNm: 55, radiusNm: 6.5, altitudeOffset: -0.08, verticalDevelopment: 0.44, precipitation: 0.2, driftDegreesPerSecond: -0.006 },
  { bearingDegrees: 61, distanceNm: 29, radiusNm: 4.8, altitudeOffset: -0.24, verticalDevelopment: 0.32, precipitation: 0.12, driftDegreesPerSecond: -0.008 },
]

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

function seededOffset(seed: number, index: number, scale: number): number {
  const noise = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453
  return ((noise - Math.floor(noise)) * 2 - 1) * scale
}

function stormEnvelope(checkpoint: StormLineCheckpoint, intensity: number): WeatherEnvelope {
  if (checkpoint === 'stormCore') {
    return {
      cellCount: 12,
      visibility: 0.42 - intensity * 0.1,
      ambientLight: 0.5 - intensity * 0.08,
      precipitation: 0.72 + intensity * 0.25,
      turbulence: 0.62 + intensity * 0.35,
      lightningEligible: true,
      gapBearingDegrees: -24,
    }
  }
  if (checkpoint === 'clearAir') {
    return {
      cellCount: 6,
      visibility: 0.84,
      ambientLight: 0.82,
      precipitation: 0.2,
      turbulence: 0.16,
      lightningEligible: false,
      gapBearingDegrees: -20,
    }
  }
  return {
    cellCount: 7,
    visibility: 0.78,
    ambientLight: 0.74,
    precipitation: 0.28,
    turbulence: 0.22,
    lightningEligible: false,
    gapBearingDegrees: -27,
  }
}

function engineOutEnvelope(checkpoint: EngineOutCheckpoint): WeatherEnvelope {
  return {
    cellCount: ENGINE_OUT_CELL_TEMPLATES.length,
    visibility: checkpoint === 'diversion' ? 0.82 : 0.9,
    ambientLight: 0.88,
    precipitation: checkpoint === 'diversion' ? 0.16 : 0.1,
    turbulence: 0.08,
    lightningEligible: false,
    gapBearingDegrees: checkpoint === 'diversion' ? 22 : 4,
  }
}

function hashSignature(parts: readonly (string | number | boolean)[]): string {
  let hash = 0x811c9dc5
  for (const character of parts.join('|')) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return `wx-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function createCells(
  templates: readonly CellTemplate[],
  envelope: WeatherEnvelope,
  input: AirbusWeatherFieldInput,
): readonly AirbusWeatherCell[] {
  const time = Math.max(0, finiteOr(input.elapsedSeconds, 0))
  const precipitationScale = input.scenario === 'stormLine'
    ? input.checkpoint === 'stormCore'
      ? 0.82 + clamp01(input.intensity) * 0.3
      : input.checkpoint === 'clearAir'
        ? 0.34
        : 0.45 + clamp01(input.intensity) * 0.35
    : 0.62

  return templates.slice(0, envelope.cellCount).map((template, index) => ({
    id: `${input.scenario}-cell-${index + 1}`,
    bearingDegrees:
      template.bearingDegrees
      + seededOffset(input.seed, index, 0.7)
      + template.driftDegreesPerSecond * time,
    distanceNm: Math.max(
      8,
      template.distanceNm
      + seededOffset(input.seed + 31, index, 1.2)
      - time * (input.scenario === 'stormLine' ? 0.012 : 0.006),
    ),
    altitudeOffset: template.altitudeOffset + seededOffset(input.seed + 67, index, 0.06),
    radiusNm: template.radiusNm * (0.96 + seededOffset(input.seed + 101, index, 0.04)),
    verticalDevelopment: clamp01(
      template.verticalDevelopment + seededOffset(input.seed + 149, index, 0.04),
    ),
    precipitation: clamp01(template.precipitation * precipitationScale),
    driftDegreesPerSecond: template.driftDegreesPerSecond,
  }))
}

export function deriveAirbusWeatherField(
  input: AirbusWeatherFieldInput,
): AirbusWeatherFieldSnapshot {
  const elapsedSeconds = Math.max(0, finiteOr(input.elapsedSeconds, 0))
  const envelope = input.scenario === 'stormLine'
    ? stormEnvelope(input.checkpoint as StormLineCheckpoint, clamp01(input.intensity))
    : engineOutEnvelope(input.checkpoint as EngineOutCheckpoint)
  const templates = input.scenario === 'stormLine'
    ? STORM_CELL_TEMPLATES
    : ENGINE_OUT_CELL_TEMPLATES
  const cells = createCells(templates, envelope, { ...input, elapsedSeconds })
  const signature = hashSignature([
    input.scenario,
    input.checkpoint,
    input.seed,
    envelope.gapBearingDegrees,
    ...cells.map((cell) => cell.id),
  ])

  return {
    signature,
    scenario: input.scenario,
    elapsedSeconds,
    visibility: clamp01(envelope.visibility),
    ambientLight: clamp01(envelope.ambientLight),
    precipitation: clamp01(envelope.precipitation),
    turbulence: clamp01(envelope.turbulence),
    lightningEligible: envelope.lightningEligible,
    gapBearingDegrees: envelope.gapBearingDegrees,
    cells,
  }
}
