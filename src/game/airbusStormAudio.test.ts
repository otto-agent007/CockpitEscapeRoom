import { describe, expect, it } from 'vitest'
import { LIGHTNING_STRIKE_PERIOD_SECONDS, airbusLightningFlash } from './airbusLightning'
import { CLEAR_AIR_BED, stormAudioBed, thunderForStrike } from './airbusStormAudio'

describe('storm audio bed', () => {
  it('puts the rain above the engine bed, where a laptop speaker can reproduce it', () => {
    // The engine rumble is 56-72 Hz and lowpassed at 260-980 Hz. The rain has to sit clear
    // of that or the fix is inaudible on the hardware that reported the problem.
    for (const precipitation of [0, 0.2, 0.5, 0.72, 1]) {
      expect(stormAudioBed(precipitation, 0.5).rainHighpassHz).toBeGreaterThan(700)
    }
  })

  it('is audible in the drizzle and much louder in the core', () => {
    const drizzle = stormAudioBed(0.2, 0.2)
    const core = stormAudioBed(0.97, 0.85)
    expect(drizzle.rainGain).toBeGreaterThan(0.05)
    expect(core.rainGain).toBeGreaterThan(drizzle.rainGain * 2)
    expect(core.windGain).toBeGreaterThan(drizzle.windGain)
  })

  it('drops the rain into the mids as it gets heavier', () => {
    expect(stormAudioBed(1, 0).rainHighpassHz).toBeLessThan(stormAudioBed(0.2, 0).rainHighpassHz)
  })

  it('clamps weather outside 0..1 rather than inverting or exploding the level', () => {
    expect(stormAudioBed(-3, -3)).toEqual(stormAudioBed(0, 0))
    expect(stormAudioBed(4, 4)).toEqual(stormAudioBed(1, 1))
  })
})

describe('thunder', () => {
  it('always lags the flash, because sound is slower than light', () => {
    for (let strike = 0; strike < 60; strike += 1) {
      expect(thunderForStrike(strike, 0.8).delaySeconds).toBeGreaterThan(0.3)
    }
  })

  it('arrives before the next bolt, so claps never stack up out of order', () => {
    for (let strike = 0; strike < 60; strike += 1) {
      const clap = thunderForStrike(strike, 0.8)
      expect(clap.delaySeconds + clap.rumbleSeconds).toBeLessThan(LIGHTNING_STRIKE_PERIOD_SECONDS)
    }
  })

  it('is the same strike every time, so a retried checkpoint sounds like the same storm', () => {
    expect(thunderForStrike(7, 0.8)).toEqual(thunderForStrike(7, 0.8))
    expect(thunderForStrike(7, 0.8)).not.toEqual(thunderForStrike(8, 0.8))
  })

  it('reads near strikes as loud and bright, distant ones as quiet rumble', () => {
    const claps = Array.from({ length: 60 }, (_, index) => thunderForStrike(index, 0.8))
    const nearest = claps.reduce((best, clap) => clap.delaySeconds < best.delaySeconds ? clap : best)
    const farthest = claps.reduce((best, clap) => clap.delaySeconds > best.delaySeconds ? clap : best)
    expect(nearest.rumbleLevel).toBeGreaterThan(farthest.rumbleLevel)
    expect(nearest.rumbleCutoffHz).toBeGreaterThan(farthest.rumbleCutoffHz)
    expect(nearest.crackLevel).toBeGreaterThan(0)
    expect(farthest.crackLevel).toBe(0)
    // A distant clap rolls for longer than a near one snaps.
    expect(farthest.rumbleSeconds).toBeGreaterThan(nearest.rumbleSeconds)
  })

  it('gives the storm core more weight than the clear-air leg', () => {
    expect(thunderForStrike(3, 0.97).rumbleLevel).toBeGreaterThan(thunderForStrike(3, 0.2).rumbleLevel)
  })

  it('never asks for a level a gain node cannot hold', () => {
    for (let strike = 0; strike < 200; strike += 1) {
      const clap = thunderForStrike(strike, 1)
      expect(clap.rumbleLevel).toBeGreaterThan(0)
      expect(clap.rumbleLevel).toBeLessThan(1)
      expect(clap.crackLevel).toBeGreaterThanOrEqual(0)
      expect(clap.crackLevel).toBeLessThan(1)
      expect(clap.rumbleCutoffHz).toBeGreaterThan(20)
    }
  })

  it('has a strike to answer: every period contains a flash the clap belongs to', () => {
    // The audio layer fires on the flash's own strike index, so the two have to agree that
    // a strike exists in each period. A schedule that skipped periods would leave silence.
    for (let strike = 0; strike < 12; strike += 1) {
      const samples = Array.from({ length: 850 }, (_, index) => {
        const time = strike * LIGHTNING_STRIKE_PERIOD_SECONDS + index * 0.01
        return airbusLightningFlash(time, true)
      })
      const lit = samples.filter((flash) => flash.intensity > 0)
      expect(lit.length).toBeGreaterThan(0)
      expect(lit.every((flash) => flash.strikeIndex === strike)).toBe(true)
    }
  })
})

describe('clear-air bed', () => {
  it('is dry but not silent, so Engine-Out is audible on the same speakers', () => {
    expect(CLEAR_AIR_BED.rainGain).toBe(0)
    expect(CLEAR_AIR_BED.windGain).toBeGreaterThan(0)
    // Above the engine bed's 56-72 Hz, which is the band that went missing.
    expect(CLEAR_AIR_BED.windBandHz).toBeGreaterThan(200)
  })
})
