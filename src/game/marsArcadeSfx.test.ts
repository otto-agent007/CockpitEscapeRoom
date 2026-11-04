import { describe, expect, it } from 'vitest'
import { advanceMarsArcade, createMarsArcadeRound, NEUTRAL_MARS_ARCADE_INPUT, type MarsArcadeEvent, type MarsArcadeState } from './marsArcade'
import { loadArcadeSound, marsArcadeSoundCues, MarsArcadeComboSound } from './marsArcadeSfx'

const neutral = () => ({ ...NEUTRAL_MARS_ARCADE_INPUT })
function fighting(): MarsArcadeState {
  return { ...createMarsArcadeRound('captain', 'booster'), phase: 'fight' }
}

describe('arcade sound timing', () => {
  it('reports the first active frame once even when a render advances many simulation frames', () => {
    const before = fighting()
    const attack = advanceMarsArcade(before, [{ ...neutral(), light: true }, neutral()], .25)
    expect(attack.events).toContainEqual({ type: 'moveActive', attacker: 0, moveId: 'captain.palmJab' })
    expect(attack.events.filter(event => event.type === 'moveActive')).toHaveLength(1)
    const after = advanceMarsArcade(attack.state, [neutral(), neutral()], .25)
    expect(after.events.filter(event => event.type === 'moveActive')).toEqual([])
  })

  it('does not announce a special rejected for insufficient meter', () => {
    const result = advanceMarsArcade(fighting(), [{ ...neutral(), special: true }, neutral()], .25)
    expect(result.events.filter(event => event.type === 'moveActive')).toEqual([])
  })

  it('reports a zero-startup laser only once through its freeze', () => {
    const before: MarsArcadeState = { ...createMarsArcadeRound('booster', 'captain'), phase: 'fight' }
    before.fighters[0].meter = 100
    let state = before
    const events: MarsArcadeEvent[] = []
    for (let frame = 0; frame < 18; frame++) {
      const transition = advanceMarsArcade(state, [{ ...neutral(), special: true }, neutral()], 1 / 60)
      events.push(...transition.events)
      state = transition.state
    }
    expect(events.filter(event => event.type === 'moveActive')).toEqual([
      { type: 'moveActive', attacker: 0, moveId: 'booster.spaceLaser' },
    ])
  })
})

describe('combat sound meaning', () => {
  it.each([['booster', 'laser'], ['oracle', 'text'], ['captain', 'flyby'], ['trump', 'caps']] as const)('uses the accepted %s signature once for an actual accepted special', (fighter, sound) => {
    let state: MarsArcadeState = { ...createMarsArcadeRound(fighter, 'captain'), phase: 'fight' }
    state.fighters[0].meter = 100
    const cues: string[] = []
    for (let frame = 0; frame < 180; frame++) {
      const transition = advanceMarsArcade(state, [{ ...neutral(), special: true }, neutral()], 1 / 60)
      cues.push(...marsArcadeSoundCues(transition.state, transition.events, false).map(cue => cue.sound))
      state = transition.state
    }
    expect(cues.filter(cue => cue === sound)).toHaveLength(1)
  })
  it('distinguishes a real light connect, a miss, a block and a guard break', () => {
    const active: MarsArcadeEvent = { type: 'moveActive', attacker: 0, moveId: 'captain.palmJab' }
    const hit: MarsArcadeEvent = { type: 'hit', attacker: 0, moveId: active.moveId, damage: 5 }
    const block: MarsArcadeEvent = { type: 'blocked', attacker: 0, moveId: active.moveId, chipDamage: 1 }
    expect(marsArcadeSoundCues(fighting(), [active], false)).toEqual([{ sound: 'whiff' }])
    expect(marsArcadeSoundCues(fighting(), [active, hit], false)).toEqual([{ sound: 'jab' }])
    expect(marsArcadeSoundCues(fighting(), [active, block], false)).toEqual([{ sound: 'block' }])
    expect(marsArcadeSoundCues(fighting(), [block, { type: 'guardCrush', defender: 1 }], false)).toEqual([{ sound: 'guardBreak' }])
  })
  it('plays a signature once for the move rather than for every cap projectile', () => {
    const events: MarsArcadeEvent[] = [
      { type: 'moveActive', attacker: 0, moveId: 'trump.capThrow' },
      ...Array.from({ length: 4 }, (): MarsArcadeEvent => ({ type: 'projectileFired', attacker: 0, moveId: 'trump.capThrow' })),
    ]
    expect(marsArcadeSoundCues(fighting(), events, false)).toEqual([{ sound: 'caps' }])
  })
  it('never tells the human they won a CPU win or draw', () => {
    expect(marsArcadeSoundCues(fighting(), [{ type: 'ko', winner: 1 }], false)).toEqual([{ sound: 'down' }])
    expect(marsArcadeSoundCues(fighting(), [{ type: 'timeOver', winner: null }], true)).toEqual([])
    expect(marsArcadeSoundCues(fighting(), [{ type: 'ko', winner: 0 }], false)).toEqual([{ sound: 'down' }, { sound: 'win', delay: .75 }])
  })
  it('announces a three-hit streak once, while blocks and gaps reset it', () => {
    const combo = new MarsArcadeComboSound()
    const hit: MarsArcadeEvent = { type: 'hit', attacker: 0, moveId: 'captain.palmJab', damage: 5 }
    expect(combo.update(100, [hit])).toBe(false)
    expect(combo.update(120, [hit])).toBe(false)
    expect(combo.update(140, [hit])).toBe(true)
    expect(combo.update(160, [hit])).toBe(false)
    combo.update(170, [{ type: 'blocked', attacker: 0, moveId: hit.moveId, chipDamage: 1 }])
    expect(combo.update(180, [hit])).toBe(false)
    expect(combo.update(300, [hit])).toBe(false)
    expect(combo.update(320, [hit])).toBe(false)
  })
  it('recovers from stale, invalid or denied sound settings without progress access', () => {
    for (const raw of ['{broken', '{"version":2,"muted":true,"volume":0.4}', '{"version":1,"muted":false,"volume":2}']) {
      expect(loadArcadeSound({ getItem: () => raw })).toMatchObject({ muted: false, volume: .55 })
    }
    expect(loadArcadeSound({ getItem: () => { throw new Error('denied') } })).toMatchObject({ muted: false, volume: .55 })
    expect(loadArcadeSound({ getItem: () => '{"version":1,"muted":true,"volume":0.3}' })).toEqual({ version: 1, muted: true, volume: .3 })
  })
})
