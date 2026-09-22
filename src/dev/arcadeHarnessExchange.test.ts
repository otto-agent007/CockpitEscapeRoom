import { describe, expect, it } from 'vitest'
import { createMarsArcadeRound, type MarsArcadeEvent } from '../game/marsArcade'
import { advanceExchange, EXCHANGE_END_FRAME } from './arcadeHarnessExchange'

function play(delta: number) {
  let state = createMarsArcadeRound('booster', 'oracle')
  const events: MarsArcadeEvent[] = []
  for (let calls = 0; state.frame < EXCHANGE_END_FRAME && calls < 2000; calls++) {
    const result = advanceExchange(state, delta)
    state = result.state
    events.push(...result.events)
  }
  return { state, events }
}

describe('short exchange review uses the real fight rules', () => {
  it('shows both fighters getting blocked and landing a jab before returning idle', () => {
    const { state, events } = play(1 / 60)
    expect(events.filter(e => e.type === 'blocked')).toEqual([
      { type: 'blocked', attacker: 0, moveId: 'booster.padJab', chipDamage: 1 },
      { type: 'blocked', attacker: 1, moveId: 'oracle.prompt', chipDamage: 1 },
    ])
    expect(events.filter(e => e.type === 'hit')).toEqual([
      { type: 'hit', attacker: 0, moveId: 'booster.padJab', damage: 5 },
      { type: 'hit', attacker: 1, moveId: 'oracle.prompt', damage: 4 },
    ])
    expect(state.fighters.map(f => f.activity)).toEqual(['idle', 'idle'])
    expect(state.fighters[0].health).toBe(95)
    expect(state.fighters[1].health).toBe(94)
    expect(state.frame).toBe(EXCHANGE_END_FRAME)
  })

  it('does not skip short button presses when a render frame spans multiple simulation ticks', () => {
    const normal = play(1 / 60)
    const slow = play(0.1)
    expect(slow.events).toEqual(normal.events)
    expect(slow.state.fighters).toEqual(normal.state.fighters)
    expect(slow.state.timerFrames).toBe(normal.state.timerFrames)
  })

  it('does not advance on a zero-duration pause or after the review ends', () => {
    const initial = createMarsArcadeRound('booster', 'oracle')
    expect(advanceExchange(initial, 0).state).toEqual(initial)
    const final = play(1 / 60).state
    expect(advanceExchange(final, 1).state).toEqual(final)
  })

  it('stops the second approach at jab range instead of pushing into the opponent', () => {
    let state = createMarsArcadeRound('booster', 'oracle')
    let separationAtHit = 0
    while (state.frame < EXCHANGE_END_FRAME) {
      const result = advanceExchange(state, 1 / 60)
      state = result.state
      if (result.events.some(e => e.type === 'hit' && e.attacker === 0)) {
        separationAtHit = state.fighters[1].x - state.fighters[0].x
      }
    }
    // The approved 41 px jab connects near full extension, then adds 2 px knockback.
    expect(separationAtHit).toBeGreaterThanOrEqual(41)
    expect(separationAtHit).toBeLessThanOrEqual(43)
  })
})
