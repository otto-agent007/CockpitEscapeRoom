import { describe, expect, it } from 'vitest'
import {
  deriveAirbusWeatherField,
  type AirbusWeatherFieldInput,
} from './airbusWeatherField'

const stormCore: AirbusWeatherFieldInput = {
  scenario: 'stormLine',
  checkpoint: 'stormCore',
  elapsedSeconds: 90,
  intensity: 0.85,
  seed: 17,
}

describe('Airbus shared weather field', () => {
  it('is deterministic for an identical scenario frame', () => {
    expect(deriveAirbusWeatherField(stormCore)).toEqual(deriveAirbusWeatherField(stormCore))
  })

  it('moves cells continuously without changing their identities', () => {
    const before = deriveAirbusWeatherField(stormCore)
    const after = deriveAirbusWeatherField({
      ...stormCore,
      elapsedSeconds: stormCore.elapsedSeconds + 0.1,
    })

    expect(after.cells.map((cell) => cell.id)).toEqual(before.cells.map((cell) => cell.id))
    for (const [index, cell] of after.cells.entries()) {
      const previous = before.cells[index]
      expect(previous).toBeDefined()
      expect(Math.abs(cell.bearingDegrees - previous!.bearingDegrees)).toBeLessThan(0.1)
      expect(Math.abs(cell.distanceNm - previous!.distanceNm)).toBeLessThan(0.1)
    }
  })

  it('makes Storm Core denser, darker, rougher, and more precipitative than Entry', () => {
    const entry = deriveAirbusWeatherField({
      ...stormCore,
      checkpoint: 'stormEntry',
      elapsedSeconds: 10,
      intensity: 0.05,
    })
    const core = deriveAirbusWeatherField(stormCore)

    expect(core.cells.length).toBeGreaterThan(entry.cells.length)
    expect(core.visibility).toBeLessThan(entry.visibility)
    expect(core.ambientLight).toBeLessThan(entry.ambientLight)
    expect(core.precipitation).toBeGreaterThan(entry.precipitation)
    expect(core.turbulence).toBeGreaterThan(entry.turbulence)
    expect(core.lightningEligible).toBe(true)
    expect(entry.lightningEligible).toBe(false)
  })

  it('gives Storm Core distinct low, moderate, and strong radar returns', () => {
    const core = deriveAirbusWeatherField(stormCore)

    expect(core.cells.some((cell) => cell.precipitation < 0.33)).toBe(true)
    expect(core.cells.some((cell) =>
      cell.precipitation >= 0.33 && cell.precipitation < 0.66,
    )).toBe(true)
    expect(core.cells.some((cell) => cell.precipitation >= 0.66)).toBe(true)
  })

  it('keeps a radar-width navigable gap free of storm-cell cores', () => {
    const snapshot = deriveAirbusWeatherField(stormCore)

    for (const cell of snapshot.cells) {
      const coreHalfWidth = Math.max(2, cell.radiusNm * 0.45)
      expect(Math.abs(cell.bearingDegrees - snapshot.gapBearingDegrees)).toBeGreaterThan(coreHalfWidth)
    }
  })

  it('uses the same calm field format for Engine-Out without storm lightning', () => {
    const recognition = deriveAirbusWeatherField({
      scenario: 'engineOut',
      checkpoint: 'recognition',
      elapsedSeconds: 6,
      intensity: 0.12,
      seed: 17,
    })

    expect(recognition.scenario).toBe('engineOut')
    expect(recognition.cells.length).toBeGreaterThanOrEqual(5)
    expect(recognition.cells.length).toBeLessThan(deriveAirbusWeatherField(stormCore).cells.length)
    expect(recognition.visibility).toBeGreaterThan(0.75)
    expect(recognition.precipitation).toBeLessThan(0.25)
    expect(recognition.lightningEligible).toBe(false)
  })

  it('keeps one spatial-field signature across samples and changes it across fields', () => {
    const before = deriveAirbusWeatherField(stormCore)
    const after = deriveAirbusWeatherField({ ...stormCore, elapsedSeconds: 91 })
    const otherField = deriveAirbusWeatherField({
      ...stormCore,
      checkpoint: 'stormEntry',
      elapsedSeconds: 10,
    })

    expect(before.signature).toBe(after.signature)
    expect(before.signature).not.toBe(otherField.signature)
    expect(before.signature).toMatch(/^wx-[0-9a-f]{8}$/)
  })
})

describe('Airbus weather field ownship response', () => {
  const stationary = deriveAirbusWeatherField(stormCore)

  it('swings the whole picture by exactly the ownship heading', () => {
    const turnedLeft = deriveAirbusWeatherField({
      ...stormCore,
      ownship: { headingOffsetDegrees: -12, closureNm: 0 },
    })

    expect(turnedLeft.cells).toHaveLength(stationary.cells.length)
    for (const [index, cell] of turnedLeft.cells.entries()) {
      expect(cell.bearingDegrees).toBeCloseTo(stationary.cells[index]!.bearingDegrees + 12, 8)
      expect(cell.distanceNm).toBeCloseTo(stationary.cells[index]!.distanceNm, 8)
    }
    expect(turnedLeft.gapBearingDegrees).toBeCloseTo(stationary.gapBearingDegrees + 12, 8)
    expect(turnedLeft.ownshipHeadingOffsetDegrees).toBe(-12)
  })

  it('keeps the gap in the same place relative to the cells through any turn', () => {
    // This is what protects the authored WEST answer: the gap and the cells
    // rotate together, so their geometry can never drift apart.
    for (const headingOffsetDegrees of [-45, -20, 0, 17, 45]) {
      const snapshot = deriveAirbusWeatherField({
        ...stormCore,
        ownship: { headingOffsetDegrees, closureNm: 0 },
      })
      for (const cell of snapshot.cells) {
        const coreHalfWidth = Math.max(2, cell.radiusNm * 0.45)
        expect(Math.abs(cell.bearingDegrees - snapshot.gapBearingDegrees))
          .toBeGreaterThan(coreHalfWidth)
      }
    }
  })

  it('closes the weather radially so bearings survive the approach', () => {
    const closed = deriveAirbusWeatherField({
      ...stormCore,
      ownship: { headingOffsetDegrees: 0, closureNm: 6 },
    })

    for (const [index, cell] of closed.cells.entries()) {
      const before = stationary.cells[index]!
      expect(cell.bearingDegrees).toBeCloseTo(before.bearingDegrees, 8)
      expect(cell.distanceNm).toBeLessThan(before.distanceNm)
    }
    expect(closed.closureNm).toBe(6)
  })

  it('holds one signature across every ownship pose of the same field', () => {
    // A signature that moved with the live gap bearing would trip the radar
    // reset on every single frame the player was turning.
    const poses = [
      { headingOffsetDegrees: -33, closureNm: 0 },
      { headingOffsetDegrees: 0, closureNm: 7.5 },
      { headingOffsetDegrees: 41, closureNm: 3 },
    ]

    for (const ownship of poses) {
      expect(deriveAirbusWeatherField({ ...stormCore, ownship }).signature)
        .toBe(stationary.signature)
    }
  })

  it('still keeps a far depth band populated at the closure cap', () => {
    const closed = deriveAirbusWeatherField({
      ...stormCore,
      ownship: { headingOffsetDegrees: 0, closureNm: 8 },
    })

    expect(closed.cells.some((cell) => cell.distanceNm > 50)).toBe(true)
  })
})
