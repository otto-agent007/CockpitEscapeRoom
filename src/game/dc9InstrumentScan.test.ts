import { describe, expect, it } from 'vitest'
import {
  DC9_INSTRUMENT_SCAN_FINAL_SUPPORT_ATTEMPTS,
  DC9_INSTRUMENT_SCAN_ORDER,
  applyDc9InstrumentAnswer,
  createInitialDc9InstrumentScanProgress,
  dc9InstrumentScanComplete,
  dc9InstrumentScanPrompt,
  dc9InstrumentScanShowsFinalSupport,
  normalizeDc9InstrumentScanProgress,
  type Dc9InstrumentScanProgress,
} from './dc9InstrumentScan'

const fresh = createInitialDc9InstrumentScanProgress

describe('dc9InstrumentScanPrompt', () => {
  it('asks for the gauges in the authored order', () => {
    let progress = fresh()
    for (const expected of DC9_INSTRUMENT_SCAN_ORDER) {
      expect(dc9InstrumentScanPrompt(progress)).toBe(expected)
      progress = applyDc9InstrumentAnswer(progress, expected).progress
    }
    expect(dc9InstrumentScanPrompt(progress)).toBeNull()
    expect(dc9InstrumentScanComplete(progress)).toBe(true)
  })
})

describe('applyDc9InstrumentAnswer', () => {
  it('accepts the asked-for gauge and clears the attempt count', () => {
    const wrong = applyDc9InstrumentAnswer(fresh(), 'epr')
    expect(wrong.outcome).toBe('incorrect')
    expect(wrong.progress.attempts).toBe(1)

    const right = applyDc9InstrumentAnswer(wrong.progress, 'airspeed')
    expect(right.outcome).toBe('correct')
    expect(right.progress.identified).toEqual(['airspeed'])
    expect(right.progress.attempts).toBe(0)
  })

  it('never takes an identified gauge away after a later mistake', () => {
    let progress = applyDc9InstrumentAnswer(fresh(), 'airspeed').progress
    progress = applyDc9InstrumentAnswer(progress, 'verticalSpeed').progress
    progress = applyDc9InstrumentAnswer(progress, 'heading').progress
    expect(progress.identified).toEqual(['airspeed'])
    expect(progress.attempts).toBe(2)
  })

  it('keeps identified gauges in scan order however they were answered', () => {
    let progress: Dc9InstrumentScanProgress = { identified: ['attitude'], attempts: 0 }
    progress = applyDc9InstrumentAnswer(progress, 'airspeed').progress
    expect(progress.identified).toEqual(['airspeed', 'attitude'])
  })

  it('ignores an answer for a gauge already identified', () => {
    const progress = applyDc9InstrumentAnswer(fresh(), 'airspeed').progress
    const repeat = applyDc9InstrumentAnswer(progress, 'airspeed')
    expect(repeat.outcome).toBe('ignored')
    expect(repeat.progress).toBe(progress)
  })

  it('ignores answers once the scan is finished', () => {
    const done: Dc9InstrumentScanProgress = { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 }
    expect(applyDc9InstrumentAnswer(done, 'airspeed').outcome).toBe('ignored')
  })

  it('offers final support only after the third miss on one prompt', () => {
    let progress = fresh()
    for (let attempt = 1; attempt < DC9_INSTRUMENT_SCAN_FINAL_SUPPORT_ATTEMPTS; attempt += 1) {
      progress = applyDc9InstrumentAnswer(progress, 'epr').progress
      expect(dc9InstrumentScanShowsFinalSupport(progress)).toBe(false)
    }
    progress = applyDc9InstrumentAnswer(progress, 'epr').progress
    expect(dc9InstrumentScanShowsFinalSupport(progress)).toBe(true)

    // Support is per prompt, not for the rest of the scan.
    progress = applyDc9InstrumentAnswer(progress, 'airspeed').progress
    expect(dc9InstrumentScanShowsFinalSupport(progress)).toBe(false)
  })
})

describe('normalizeDc9InstrumentScanProgress', () => {
  it('restores a valid saved scan', () => {
    expect(normalizeDc9InstrumentScanProgress({ identified: ['attitude', 'airspeed'], attempts: 2 }))
      .toEqual({ identified: ['airspeed', 'attitude'], attempts: 2 })
  })

  it('discards unknown gauges and impossible attempt counts', () => {
    expect(normalizeDc9InstrumentScanProgress({ identified: ['mach', 'airspeed'], attempts: -4 }))
      .toEqual({ identified: ['airspeed'], attempts: 0 })
    expect(normalizeDc9InstrumentScanProgress({ identified: 'airspeed', attempts: Number.NaN }))
      .toEqual({ identified: [], attempts: 0 })
    expect(normalizeDc9InstrumentScanProgress(null)).toEqual({ identified: [], attempts: 0 })
  })
})
