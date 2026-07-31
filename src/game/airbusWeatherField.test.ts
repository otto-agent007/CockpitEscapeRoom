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
