import { describe, expect, it } from 'vitest'
import { deriveAirbusWeatherField } from '../game/airbusWeatherField'
import {
  advanceAirbusWeatherRadar,
  AIRBUS_RADAR_DISPLAY,
  airbusRadarRangePresentation,
  createAirbusWeatherRadarFrame,
  projectAirbusWeatherCellToRadar,
  radarColorForPrecipitation,
  shouldResetAirbusWeatherRadar,
  visibleAirbusRadarReturns,
} from './airbusWeatherRadar'

const weather = deriveAirbusWeatherField({
  scenario: 'stormLine',
  checkpoint: 'stormCore',
  elapsedSeconds: 90,
  intensity: 0.85,
  seed: 17,
})

describe('Airbus live weather radar', () => {
  it('keeps the live fan inside the readable upper ND display band', () => {
    expect(AIRBUS_RADAR_DISPLAY.originY).toBeLessThanOrEqual(220)
    expect(AIRBUS_RADAR_DISPLAY.originY - AIRBUS_RADAR_DISPLAY.radarRadius).toBeGreaterThanOrEqual(70)
  })

  it('uses deterministic increasing fictional scan ranges', () => {
    expect(airbusRadarRangePresentation('near')).toEqual({ distanceNm: 20, label: 'RANGE 20' })
    expect(airbusRadarRangePresentation('mid')).toEqual({ distanceNm: 40, label: 'RANGE 40' })
    expect(airbusRadarRangePresentation('far')).toEqual({ distanceNm: 80, label: 'RANGE 80' })
  })

  it('projects the shared bearing into the heading-up fan', () => {
    const cell = weather.cells[0]
    expect(cell).toBeDefined()

    const projected = projectAirbusWeatherCellToRadar(cell!, 'far')

    expect(Math.sign(projected.x)).toBe(Math.sign(cell!.bearingDegrees))
    expect(projected.rangeFraction).toBeCloseTo(cell!.distanceNm / 80, 6)
    expect(projected.y).toBeLessThanOrEqual(0)
  })

  it('changes only projection scale and visible returns for the selected range', () => {
    const frame = {
      ...createAirbusWeatherRadarFrame(weather, 0),
      signature: weather.signature,
      sweepAngleDegrees: 0,
      returns: [
        { cellId: 'near', bearingDegrees: -10, distanceNm: 15, radiusNm: 2, precipitation: 0.2, color: 'green' as const, refreshedAtSeconds: 0, ageSeconds: 0 },
        { cellId: 'mid', bearingDegrees: 0, distanceNm: 35, radiusNm: 2, precipitation: 0.5, color: 'yellow' as const, refreshedAtSeconds: 0, ageSeconds: 0 },
        { cellId: 'far', bearingDegrees: 10, distanceNm: 70, radiusNm: 2, precipitation: 0.8, color: 'red' as const, refreshedAtSeconds: 0, ageSeconds: 0 },
      ],
    }

    expect(visibleAirbusRadarReturns(frame, 'near').map((item) => item.cellId)).toEqual(['near'])
    expect(visibleAirbusRadarReturns(frame, 'mid').map((item) => item.cellId)).toEqual(['near', 'mid'])
    expect(visibleAirbusRadarReturns(frame, 'far').map((item) => item.cellId)).toEqual(['near', 'mid', 'far'])
    expect(frame.signature).toBe(weather.signature)
    expect(frame.sweepAngleDegrees).toBe(0)
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

  it('resets on a field transition or scenario-time rewind but not a pause', () => {
    const frame = advanceAirbusWeatherRadar(
      createAirbusWeatherRadarFrame(weather, 80),
      weather,
      90,
      false,
    )

    expect(shouldResetAirbusWeatherRadar(frame, weather)).toBe(false)
    expect(shouldResetAirbusWeatherRadar(frame, {
      ...weather,
      elapsedSeconds: 89,
    })).toBe(true)
    expect(shouldResetAirbusWeatherRadar(frame, {
      ...weather,
      signature: 'wx-other-field',
    })).toBe(true)
  })
})

describe('Airbus radar live response', () => {
  const cell = weather.cells[0]!

  function fieldWithCellAt(bearingDegrees: number) {
    return { ...weather, cells: [{ ...cell, bearingDegrees }] }
  }

  it('drops a painted return once its cell has rotated out of the scan fan', () => {
    const inFan = fieldWithCellAt(60)
    const painted = advanceAirbusWeatherRadar(
      createAirbusWeatherRadarFrame(inFan, 0),
      inFan,
      4,
      false,
    )
    expect(painted.returns.map((item) => item.cellId)).toEqual([cell.id])

    // A cell outside the fan can never be repainted, so keeping its last return
    // would leave a permanent ghost at the bearing the player turned away from.
    const rotatedOut = advanceAirbusWeatherRadar(painted, fieldWithCellAt(88), 4.2, false)

    expect(rotatedOut.returns).toEqual([])
  })

  it('still holds a return that is only just outside the painted fan', () => {
    const inFan = fieldWithCellAt(60)
    const painted = advanceAirbusWeatherRadar(
      createAirbusWeatherRadarFrame(inFan, 0),
      inFan,
      4,
      false,
    )
    const nudged = advanceAirbusWeatherRadar(painted, fieldWithCellAt(74), 4.2, false)

    expect(nudged.returns.map((item) => item.cellId)).toEqual([cell.id])
  })

  it('does not read a lagging weather snapshot as a scenario rewind', () => {
    const frame = advanceAirbusWeatherRadar(
      createAirbusWeatherRadarFrame(weather, 90),
      weather,
      90.4,
      false,
    )

    // Cells are republished on their own throttle, so the snapshot clock trails
    // the sweep clock. That must not count as a rewind.
    expect(shouldResetAirbusWeatherRadar(
      frame,
      { ...weather, elapsedSeconds: 90.32 },
      90.44,
    )).toBe(false)
    // An actual checkpoint retry does rewind the live clock.
    expect(shouldResetAirbusWeatherRadar(frame, weather, 45)).toBe(true)
  })
})
