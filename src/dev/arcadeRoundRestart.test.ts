import { describe, expect, it } from 'vitest'
import { ROUND_RESTART_DELAY_MS, roundIsOver, roundRestartVisible } from './arcadeRoundRestart'

const base = { phase: 'ko', paused: false, exchange: false, overSinceMs: 1000, nowMs: 1000 + ROUND_RESTART_DELAY_MS }

describe('automatic Restart round button', () => {
  it('appears shortly after a K.O. or time-up, never during the fight', () => {
    expect(roundIsOver('ko')).toBe(true)
    expect(roundIsOver('timeOver')).toBe(true)
    expect(roundIsOver('fight')).toBe(false)
    expect(roundIsOver('intro')).toBe(false)
    expect(roundRestartVisible(base)).toBe(true)
    expect(roundRestartVisible({ ...base, phase: 'timeOver' })).toBe(true)
    expect(roundRestartVisible({ ...base, phase: 'fight' })).toBe(false)
  })

  it('lets the K.O. banner read first', () => {
    expect(roundRestartVisible({ ...base, nowMs: base.overSinceMs + ROUND_RESTART_DELAY_MS - 1 })).toBe(false)
    expect(roundRestartVisible({ ...base, overSinceMs: null })).toBe(false)
  })

  it('stays hidden while paused (the menu has its own restart) and during a recorded exchange', () => {
    expect(roundRestartVisible({ ...base, paused: true })).toBe(false)
    expect(roundRestartVisible({ ...base, exchange: true })).toBe(false)
  })
})
