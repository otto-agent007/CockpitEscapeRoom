import type {
  AirbusWeatherCell,
  AirbusWeatherFieldSnapshot,
} from '../game/airbusWeatherField'

export type AirbusRadarColor = 'green' | 'yellow' | 'red'

export interface AirbusRadarReturn {
  cellId: string
  bearingDegrees: number
  distanceNm: number
  radiusNm: number
  precipitation: number
  color: AirbusRadarColor
  refreshedAtSeconds: number
  ageSeconds: number
}

export interface AirbusWeatherRadarFrame {
  signature: string
  sampledAtSeconds: number
  sweepAngleDegrees: number
  sweepDirection: -1 | 1
  gapBearingDegrees: number
  returns: readonly AirbusRadarReturn[]
}

export interface AirbusRadarProjection {
  x: number
  y: number
  rangeFraction: number
}

interface SweepSegment {
  from: number
  to: number
}

const RADAR_MIN_ANGLE = -70
const RADAR_MAX_ANGLE = 70
const STANDARD_SWEEP_SPEED = 45
const REDUCED_MOTION_SWEEP_SPEED = 18

export function radarColorForPrecipitation(precipitation: number): AirbusRadarColor {
  if (precipitation >= 0.66) return 'red'
  if (precipitation >= 0.33) return 'yellow'
  return 'green'
}

export function projectAirbusWeatherCellToRadar(
  cell: Pick<AirbusWeatherCell, 'bearingDegrees' | 'distanceNm'>,
  rangeNm: number,
): AirbusRadarProjection {
  const safeRange = Number.isFinite(rangeNm) && rangeNm > 0 ? rangeNm : 80
  const rangeFraction = Math.max(0, Math.min(1, cell.distanceNm / safeRange))
  const bearingRadians = cell.bearingDegrees * Math.PI / 180
  return {
    x: Math.sin(bearingRadians) * rangeFraction,
    y: -Math.cos(bearingRadians) * rangeFraction,
    rangeFraction,
  }
}

export function createAirbusWeatherRadarFrame(
  snapshot: AirbusWeatherFieldSnapshot,
  sampledAtSeconds: number,
): AirbusWeatherRadarFrame {
  return {
    signature: snapshot.signature,
    sampledAtSeconds: Math.max(0, Number.isFinite(sampledAtSeconds) ? sampledAtSeconds : 0),
    sweepAngleDegrees: RADAR_MIN_ANGLE,
    sweepDirection: 1,
    gapBearingDegrees: snapshot.gapBearingDegrees,
    returns: [],
  }
}

function advanceSweep(
  startAngle: number,
  startDirection: -1 | 1,
  travelDegrees: number,
): {
  angle: number
  direction: -1 | 1
  segments: readonly SweepSegment[]
} {
  let angle = Math.max(RADAR_MIN_ANGLE, Math.min(RADAR_MAX_ANGLE, startAngle))
  let direction = startDirection
  let remaining = Math.max(0, travelDegrees)
  const segments: SweepSegment[] = []

  while (remaining > 0.000001) {
    const edge = direction === 1 ? RADAR_MAX_ANGLE : RADAR_MIN_ANGLE
    const available = Math.abs(edge - angle)
    const travel = Math.min(available, remaining)
    const next = angle + direction * travel
    if (travel > 0) segments.push({ from: angle, to: next })
    angle = next
    remaining -= travel
    if (Math.abs(angle - edge) < 0.000001) direction = direction === 1 ? -1 : 1
  }

  return { angle, direction, segments }
}

function segmentReachesBearing(segment: SweepSegment, bearingDegrees: number): boolean {
  const minimum = Math.min(segment.from, segment.to) - 0.000001
  const maximum = Math.max(segment.from, segment.to) + 0.000001
  return bearingDegrees >= minimum && bearingDegrees <= maximum
}

function refreshedReturn(cell: AirbusWeatherCell, sampledAtSeconds: number): AirbusRadarReturn {
  return {
    cellId: cell.id,
    bearingDegrees: cell.bearingDegrees,
    distanceNm: cell.distanceNm,
    radiusNm: cell.radiusNm,
    precipitation: cell.precipitation,
    color: radarColorForPrecipitation(cell.precipitation),
    refreshedAtSeconds: sampledAtSeconds,
    ageSeconds: 0,
  }
}

export function advanceAirbusWeatherRadar(
  previous: AirbusWeatherRadarFrame,
  snapshot: AirbusWeatherFieldSnapshot,
  sampledAtSeconds: number,
  reducedMotion: boolean,
): AirbusWeatherRadarFrame {
  const safeNow = Math.max(
    previous.sampledAtSeconds,
    Number.isFinite(sampledAtSeconds) ? sampledAtSeconds : previous.sampledAtSeconds,
  )
  const deltaSeconds = Math.min(5, safeNow - previous.sampledAtSeconds)
  const speed = reducedMotion ? REDUCED_MOTION_SWEEP_SPEED : STANDARD_SWEEP_SPEED
  const sweep = advanceSweep(
    previous.sweepAngleDegrees,
    previous.sweepDirection,
    deltaSeconds * speed,
  )
  const activeCells = new Map(snapshot.cells.map((cell) => [cell.id, cell]))
  const returns = new Map(
    previous.returns
      .filter((item) => activeCells.has(item.cellId))
      .map((item) => [
        item.cellId,
        {
          ...item,
          ageSeconds: Math.max(0, safeNow - item.refreshedAtSeconds),
        },
      ]),
  )

  for (const cell of snapshot.cells) {
    if (sweep.segments.some((segment) => segmentReachesBearing(segment, cell.bearingDegrees))) {
      returns.set(cell.id, refreshedReturn(cell, safeNow))
    }
  }

  return {
    signature: snapshot.signature,
    sampledAtSeconds: safeNow,
    sweepAngleDegrees: sweep.angle,
    sweepDirection: sweep.direction,
    gapBearingDegrees: snapshot.gapBearingDegrees,
    returns: [...returns.values()].sort((left, right) =>
      left.bearingDegrees - right.bearingDegrees,
    ),
  }
}
