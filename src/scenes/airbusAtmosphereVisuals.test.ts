import { describe, expect, it } from 'vitest'
import { deriveAirbusWeatherField } from '../game/airbusWeatherField'
import {
  airbusLightningFlash,
  deriveAirbusAtmosphereLayout,
  MAX_AIRBUS_CLOUD_CLUSTERS,
  MAX_AIRBUS_RAIN_SHAFTS,
} from './airbusAtmosphereVisuals'

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
    expect(Math.abs(first.visibleGapBearingDegrees - storm.gapBearingDegrees)).toBeLessThanOrEqual(5)
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

    // The renderer sizes its instance buffers from these same constants. When
    // they were duplicated they drifted, and only the first 48 sprites of a
    // 167-sprite field were ever drawn.
    expect(layout.clusters.length).toBeLessThanOrEqual(MAX_AIRBUS_CLOUD_CLUSTERS)
    expect(layout.clusters.length).toBeGreaterThan(80)
    expect(layout.rainShafts.length).toBeLessThanOrEqual(MAX_AIRBUS_RAIN_SHAFTS)
    expect(layout.rainShafts.length).toBeGreaterThan(0)
  })

  it('uses reduced motion to bound nonessential drift without removing weather', () => {
    const initialWeather = deriveAirbusWeatherField({
      scenario: 'stormLine',
      checkpoint: 'stormCore',
      elapsedSeconds: 0,
      intensity: 0.85,
      seed: 21,
    })
    const initial = deriveAirbusAtmosphereLayout(initialWeather, { reducedMotion: false })
    const moving = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })
    const reduced = deriveAirbusAtmosphereLayout(storm, { reducedMotion: true })
    const initialCluster = initial.clusters[0]
    const movingCluster = moving.clusters[0]
    const reducedCluster = reduced.clusters[0]

    expect(reduced.clusters).toHaveLength(moving.clusters.length)
    expect(reduced.rainShafts).toHaveLength(moving.rainShafts.length)
    expect(reduced.motionScale).toBeLessThan(moving.motionScale)
    expect(reduced.motionScale).toBeGreaterThan(0)
    expect(initialCluster).toBeDefined()
    expect(movingCluster).toBeDefined()
    expect(reducedCluster).toBeDefined()
    expect(Math.abs(reducedCluster!.position[0] - initialCluster!.position[0])).toBeLessThan(
      Math.abs(movingCluster!.position[0] - initialCluster!.position[0]),
    )
  })

  it('keeps Engine-Out calm, layered, and below the cruise level', () => {
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
    // Fair-weather cloud is a shallow layer around and below an aircraft at
    // cruise, never a tower. The previous assertion required every cluster
    // above a rising slope, which is what parked the whole weather field above
    // the windscreen.
    const heights = layout.clusters.map((cluster) => cluster.position[1])
    const stormHeights = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })
      .clusters.map((cluster) => cluster.position[1])
    expect(Math.min(...heights)).toBeLessThan(-4)
    expect(Math.max(...heights)).toBeLessThan(10)
    expect(Math.max(...heights)).toBeLessThan(Math.max(...stormHeights) / 3)
    expect(layout.rainShafts).toHaveLength(0)
  })

  it('builds storm towers that straddle the horizon instead of floating above it', () => {
    const layout = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })
    const heights = layout.clusters.map((cluster) => cluster.position[1])

    // Bases below the eye line, anvils well above it: this is the whole reason
    // the storm is visible through the windscreen at all.
    expect(Math.min(...heights)).toBeLessThan(0)
    expect(Math.max(...heights)).toBeGreaterThan(20)
    for (const cluster of layout.clusters) {
      expect(cluster.towerFraction).toBeGreaterThanOrEqual(0)
      expect(cluster.towerFraction).toBeLessThanOrEqual(1)
    }
  })

  it('darkens the rain base and brightens the anvil of every tower', () => {
    const layout = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })
    const base = layout.clusters.filter((cluster) => cluster.towerFraction < 0.1)
    const anvil = layout.clusters.filter((cluster) => cluster.towerFraction > 0.9)

    expect(base.length).toBeGreaterThan(0)
    expect(anvil.length).toBeGreaterThan(0)
    expect(Math.max(...base.map((cluster) => cluster.shade)))
      .toBeLessThan(Math.min(...anvil.map((cluster) => cluster.shade)))
  })

  it('hangs each rain curtain below the cell it falls from', () => {
    const layout = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })

    for (const shaft of layout.rainShafts) {
      const cellClusters = layout.clusters.filter((cluster) => cluster.cellId === shaft.cellId)
      const cellBase = Math.min(...cellClusters.map((cluster) => cluster.position[1]))
      expect(shaft.position[1]).toBeLessThan(cellBase)
    }
  })
})

describe('Airbus cloud billboarding and depth', () => {
  const layout = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })

  it('turns every cloud quad to face the viewer', () => {
    // The atmosphere root copies the camera transform, so the viewer sits at the
    // group origin. Without this a cell out at 67 deg renders as a sliver.
    expect(layout.clusters.length).toBeGreaterThan(0)
    for (const cluster of layout.clusters) {
      const [x, , z] = cluster.position
      const horizontal = Math.hypot(x, z)
      expect(horizontal).toBeGreaterThan(0)
      expect(Math.sin(cluster.yawRadians)).toBeCloseTo(-x / horizontal, 6)
      expect(Math.cos(cluster.yawRadians)).toBeCloseTo(-z / horizontal, 6)
    }
  })

  it('turns rain shafts to face the viewer too', () => {
    expect(layout.rainShafts.length).toBeGreaterThan(0)
    for (const shaft of layout.rainShafts) {
      const [x, , z] = shaft.position
      const horizontal = Math.hypot(x, z)
      expect(Math.sin(shaft.yawRadians)).toBeCloseTo(-x / horizontal, 6)
      expect(Math.cos(shaft.yawRadians)).toBeCloseTo(-z / horizontal, 6)
    }
  })

  it('hazes distant cells harder than near ones so depth reads', () => {
    const near = layout.clusters.filter((cluster) => cluster.band === 'near')
    const far = layout.clusters.filter((cluster) => cluster.band === 'far')

    expect(near.length).toBeGreaterThan(0)
    expect(far.length).toBeGreaterThan(0)
    expect(Math.max(...near.map((cluster) => cluster.haze)))
      .toBeLessThan(Math.min(...far.map((cluster) => cluster.haze)))
    for (const cluster of layout.clusters) {
      expect(cluster.haze).toBeGreaterThanOrEqual(0)
      expect(cluster.haze).toBeLessThanOrEqual(1)
    }
  })

  it('varies roll and mirroring so one texture does not read as one cloud', () => {
    const rolls = layout.clusters.map((cluster) => cluster.rollRadians)

    expect(new Set(rolls.map((roll) => roll.toFixed(4))).size)
      .toBeGreaterThan(layout.clusters.length / 2)
    // Rolls must cover the full turn: a narrow range leaves the shared texture's
    // own lobe pattern visible across every sprite.
    expect(Math.min(...rolls)).toBeLessThan(0.6)
    expect(Math.max(...rolls)).toBeGreaterThan(Math.PI * 1.7)
    expect(layout.clusters.some((cluster) => cluster.mirrored)).toBe(true)
    expect(layout.clusters.some((cluster) => !cluster.mirrored)).toBe(true)
  })
})

describe('Airbus lightning flash', () => {
  function sample(from: number, to: number, step: number): number[] {
    const values: number[] = []
    for (let time = from; time <= to; time += step) {
      values.push(airbusLightningFlash(time, true).intensity)
    }
    return values
  }

  it('stays completely dark where the checkpoint is not lightning eligible', () => {
    for (let time = 0; time < 60; time += 0.05) {
      expect(airbusLightningFlash(time, false).intensity).toBe(0)
    }
  })

  it('is deterministic for the same scenario time', () => {
    expect(airbusLightningFlash(23.4, true)).toEqual(airbusLightningFlash(23.4, true))
  })

  it('reaches full brightness but stays dark most of the time', () => {
    const values = sample(0, 51, 0.01)
    const lit = values.filter((value) => value > 0.02).length

    expect(Math.max(...values)).toBeGreaterThan(0.9)
    expect(lit).toBeGreaterThan(0)
    expect(lit / values.length).toBeLessThan(0.2)
  })

  it('flickers with more than one stroke inside a single strike', () => {
    // A single blink is what the old fixed-window flash produced. Real sheet
    // lightning restrikes, and that is what sells it at 60 Hz.
    const values = sample(0, 8.5, 0.002)
    let peaks = 0
    for (let index = 1; index < values.length - 1; index += 1) {
      const value = values[index]!
      if (value > 0.05 && value > values[index - 1]! && value >= values[index + 1]!) peaks += 1
    }

    expect(peaks).toBeGreaterThanOrEqual(2)
  })
})

describe('Airbus atmosphere culling', () => {
  it('builds no sprites for cells the windscreen cannot show', () => {
    const layout = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })

    for (const cluster of layout.clusters) {
      expect(Math.abs(cluster.bearingDegrees)).toBeLessThanOrEqual(66)
    }
    expect(storm.cells.some((cell) => Math.abs(cell.bearingDegrees) > 62)).toBe(true)
  })

  it('brings a culled cell back as soon as the player turns toward it', () => {
    // Bearings are ownship-relative, so culling must be re-evaluated per frame
    // rather than baked into the authored field.
    const turned = deriveAirbusWeatherField({
      scenario: 'stormLine',
      checkpoint: 'stormCore',
      elapsedSeconds: 90,
      intensity: 0.85,
      seed: 21,
      ownship: { headingOffsetDegrees: 28, closureNm: 0 },
    })
    const straight = deriveAirbusAtmosphereLayout(storm, { reducedMotion: false })
    const rotated = deriveAirbusAtmosphereLayout(turned, { reducedMotion: false })
    const cellsOf = (layout: typeof straight) => new Set(layout.clusters.map((c) => c.cellId))

    expect([...cellsOf(rotated)].some((id) => !cellsOf(straight).has(id))).toBe(true)
  })
})

describe('Airbus visible gap agreement', () => {
  it('never drifts more than the ND contract allows, across seeds and turns', () => {
    // The browser suite asserts the window and the ND agree within 5 degrees.
    // Prove it here across the field variations the player can actually reach,
    // rather than relying on one seed happening to comply.
    for (const seed of [1, 7, 17, 21, 41]) {
      for (const headingOffsetDegrees of [-30, -12, 0, 12, 30]) {
        for (const checkpoint of ['stormEntry', 'stormCore', 'clearAir'] as const) {
          const field = deriveAirbusWeatherField({
            scenario: 'stormLine',
            checkpoint,
            elapsedSeconds: 90,
            intensity: 0.85,
            seed,
            ownship: { headingOffsetDegrees, closureNm: 4 },
          })
          const layout = deriveAirbusAtmosphereLayout(field, { reducedMotion: false })

          expect(Math.abs(layout.visibleGapBearingDegrees - field.gapBearingDegrees))
            .toBeLessThanOrEqual(4)
        }
      }
    }
  })
})
