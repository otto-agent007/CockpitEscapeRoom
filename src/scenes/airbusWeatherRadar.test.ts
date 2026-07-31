import { describe, expect, it } from 'vitest'
import { deriveAirbusWeatherField } from '../game/airbusWeatherField'
import {
  advanceAirbusWeatherRadar,
  createAirbusWeatherRadarFrame,
  projectAirbusWeatherCellToRadar,
  radarColorForPrecipitation,
} from './airbusWeatherRadar'

const weather = deriveAirbusWeatherField({
  scenario: 'stormLine',
  checkpoint: 'stormCore',
  elapsedSeconds: 90,
  intensity: 0.85,
  seed: 17,
})

describe('Airbus live weather radar', () => {
  it('projects the shared bearing into the heading-up fan', () => {
    const cell = weather.cells[0]
    expect(cell).toBeDefined()

    const projected = projectAirbusWeatherCellToRadar(cell!, 80)

    expect(Math.sign(projected.x)).toBe(Math.sign(cell!.bearingDegrees))
    expect(projected.rangeFraction).toBeCloseTo(cell!.distanceNm / 80, 6)
    expect(projected.y).toBeLessThanOrEqual(0)
  })

  it('uses deterministic green, yellow, and red precipitation bands', () => {
    expect(radarColorForPrecipitation(0.1)).toBe('green')
    expect(radarColorForPrecipitation(0.49)).toBe('yellow')
    expect(radarColorForPrecipitation(0.8)).toBe('red')
  })

  it('refreshes only cell bearings reached by the sweep', () => {
    const initial = createAirbusWeatherRadarFrame(weather, 0)
    const next = advanceAirbusWeatherRadar(initial, weather, 0.5, false)
    const reachedIds = weather.cells
      .filter((cell) => cell.bearingDegrees >= -70 && cell.bearingDegrees <= next.sweepAngleDegrees)
      .map((cell) => cell.id)

    expect(next.returns.map((item) => item.cellId).sort()).toEqual(reachedIds.sort())
    expect(next.returns.length).toBeGreaterThan(0)
    expect(next.returns.length).toBeLessThan(weather.cells.length)
  })

  it('ages stale returns while updating newly crossed bearings', () => {
    const first = advanceAirbusWeatherRadar(
      createAirbusWeatherRadarFrame(weather, 0),
      weather,
      0.5,
      false,
    )
    const second = advanceAirbusWeatherRadar(first, weather, 1, false)
    const stale = second.returns.find((item) => item.cellId === first.returns[0]?.cellId)

    expect(stale).toBeDefined()
    expect(stale!.ageSeconds).toBeCloseTo(0.5, 6)
    expect(second.returns.length).toBeGreaterThan(first.returns.length)
  })

  it('reverses at the fan edges without leaving the approved range', () => {
    let frame = createAirbusWeatherRadarFrame(weather, 0)
    frame = advanceAirbusWeatherRadar(frame, weather, 4, false)

    expect(frame.sweepAngleDegrees).toBeGreaterThanOrEqual(-70)
    expect(frame.sweepAngleDegrees).toBeLessThanOrEqual(70)
    expect(frame.sweepDirection).toBe(-1)
  })

  it('slows but does not stop the sweep in reduced motion', () => {
    const initial = createAirbusWeatherRadarFrame(weather, 0)
    const standard = advanceAirbusWeatherRadar(initial, weather, 1, false)
    const reduced = advanceAirbusWeatherRadar(initial, weather, 1, true)

    expect(reduced.sweepAngleDegrees).toBeGreaterThan(initial.sweepAngleDegrees)
    expect(reduced.sweepAngleDegrees).toBeLessThan(standard.sweepAngleDegrees)
  })

  it('carries the exact shared field signature and gap bearing', () => {
    const frame = advanceAirbusWeatherRadar(
      createAirbusWeatherRadarFrame(weather, 0),
      weather,
      1,
      false,
    )

    expect(frame.signature).toBe(weather.signature)
    expect(frame.gapBearingDegrees).toBe(weather.gapBearingDegrees)
  })
})
