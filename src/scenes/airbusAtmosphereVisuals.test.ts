import { describe, expect, it } from 'vitest'
import { deriveAirbusWeatherField } from '../game/airbusWeatherField'
import { deriveAirbusAtmosphereLayout } from './airbusAtmosphereVisuals'

const storm = deriveAirbusWeatherField({
  scenario: 'stormLine',
  checkpoint: 'stormCore',
  elapsedSeconds: 90,
  intensity: 0.85,
  seed: 21,
})

describe('Airbus atmosphere layout', () => {
  it('is deterministic and preserves the shared gap bearing', () => {
    const first = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })
    const second = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })

    expect(first).toEqual(second)
    expect(first.gapBearingDegrees).toBe(storm.gapBearingDegrees)
  })

  it('projects cell bearings into the same camera-relative horizontal direction', () => {
    const layout = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })
    const source = storm.cells[0]
    const cluster = layout.clusters.find((candidate) => candidate.cellId === source?.id)

    expect(source).toBeDefined()
    expect(cluster).toBeDefined()
    expect(Math.sign(cluster!.position[0])).toBe(Math.sign(source!.bearingDegrees))
    expect(cluster!.bearingDegrees).toBeCloseTo(source!.bearingDegrees, 6)
  })

  it('produces distinguishable near, middle, and far depth bands', () => {
    const layout = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })
    const bands = new Set(layout.clusters.map((cluster) => cluster.band))

    expect(bands).toEqual(new Set(['near', 'middle', 'far']))
  })

  it('stays within the approved cloud and rain-shaft budgets', () => {
    const layout = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })

    expect(layout.clusters.length).toBeLessThanOrEqual(48)
    expect(layout.rainShafts.length).toBeLessThanOrEqual(8)
    expect(layout.rainShafts.length).toBeGreaterThan(0)
  })

  it('uses reduced motion to bound nonessential drift without removing weather', () => {
    const moving = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })
    const reduced = deriveAirbusAtmosphereLayout(storm, { reducedMotion: true })

    expect(reduced.clusters).toHaveLength(moving.clusters.length)
    expect(reduced.rainShafts).toHaveLength(moving.rainShafts.length)
    expect(reduced.motionScale).toBeLessThan(moving.motionScale)
    expect(reduced.motionScale).toBeGreaterThan(0)
  })

  it('keeps Engine-Out calm but spatially layered', () => {
    const engineOut = deriveAirbusWeatherField({
      scenario: 'engineOut',
      checkpoint: 'recognition',
      elapsedSeconds: 6,
      intensity: 0.12,
      seed: 21,
    })
    const layout = deriveAirbusAtmosphereLayout(engineOut, { reducedMotion: false })

    expect(new Set(layout.clusters.map((cluster) => cluster.band))).toEqual(
      new Set(['near', 'middle', 'far']),
    )
    expect(layout.clusters.every((cluster) =>
      cluster.position[1] > Math.abs(cluster.position[2]) * 0.12,
    )).toBe(true)
    expect(layout.rainShafts).toHaveLength(0)
  })
})
