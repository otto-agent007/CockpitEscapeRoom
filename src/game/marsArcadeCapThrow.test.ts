import { afterEach, describe, expect, it } from 'vitest'
import { advanceMarsArcade, createMarsArcadeRound, MARS_ARCADE_TIMING, NEUTRAL_MARS_ARCADE_INPUT, type MarsArcadeEvent, type MarsArcadeInput, type MarsArcadeSide, type MarsArcadeState } from './marsArcade'
import { marsArcadeDefaultTuning, marsArcadeFighter, setMarsArcadeTuning } from './marsArcadeFighters'

afterEach(() => setMarsArcadeTuning(null))
const neutral = { ...NEUTRAL_MARS_ARCADE_INPUT }
function round(side: MarsArcadeSide = 0) {
  const tuning = marsArcadeDefaultTuning()
  tuning.rules.hitstop = false
  setMarsArcadeTuning(tuning)
  const state = createMarsArcadeRound(side === 0 ? 'trump' : 'booster', side === 1 ? 'trump' : 'booster')
  state.phase = 'fight'
  state.fighters[side].meter = 100
  return state
}
function run(state: MarsArcadeState, ticks: number, input: Partial<MarsArcadeInput> = {}, side: MarsArcadeSide = 0) {
  const events: MarsArcadeEvent[] = []
  for (let i = 0; i < ticks; i++) {
    const inputs: [MarsArcadeInput, MarsArcadeInput] = [{ ...neutral }, { ...neutral }]
    inputs[side] = { ...neutral, ...input }
    const next = advanceMarsArcade(state, inputs, MARS_ARCADE_TIMING.frameSeconds)
    state = next.state
    events.push(...next.events)
  }
  return { state, events }
}
const hits = (events: MarsArcadeEvent[]) => events.filter(e => e.type === 'hit' && e.moveId === 'trump.capThrow')

describe('Cap Throw ranged pressure', () => {
  it.each([0, 1] as const)('releases three separate hats and deals one damage event per hat from side %i', side => {
    const result = run(round(side), 160, { special: true }, side)
    expect(result.events.filter(e => e.type === 'projectileFired' && e.moveId === 'trump.capThrow')).toHaveLength(3)
    expect(hits(result.events)).toHaveLength(3)
    expect(result.state.fighters[side === 0 ? 1 : 0].health).toBe(82)
    expect(result.state.fighters[side].meter).toBe(60)
    expect(result.state.projectiles).toHaveLength(0)
  })
  it('does not start or spend meter below the activation cost', () => {
    const state = round(); state.fighters[0].meter = 39
    const result = run(state, 120, { special: true })
    expect(result.state.fighters[0].activeButton).toBeNull()
    expect(result.state.fighters[0].meter).toBe(39)
    expect(result.events).toEqual([])
  })
  it('still catches the opponent at point-blank pushbox distance', () => {
    const state=round();state.fighters[0].x=0;state.fighters[1].x=24
    const result=run(state,160,{special:true})
    expect(hits(result.events)).toHaveLength(3)
  })
  it('freezes an airborne defender without altering its saved jump velocity', () => {
    let state = round()
    state = run(state, marsArcadeFighter('trump').moves.special.startupFrames + 1, { special: true }).state
    const defender = state.fighters[1]
    defender.y = 5; defender.velocityY = 2
    state.projectiles[0]!.x = defender.x - 10
    // Move the launch origin to put the next arcing flight step on this airborne head.
    state.projectiles[0]!.capFlight!.originX = defender.x - 20
    state.projectiles[0]!.capFlight!.originY = 97
    const connected = run(state,1)
    expect(hits(connected.events)).toHaveLength(1)
    expect(connected.state.fighters[1].capFreeze).toBeDefined()
    const frozen = run(connected.state,5,{move:1,jump:true,light:true},1).state
    expect(frozen.fighters[1].y).toBe(5)
    expect(frozen.fighters[1].velocityY).toBe(2)
    expect(frozen.fighters[1].x).toBe(defender.x)
  })
  it('does not mutate earlier states when the attached cap clock advances', () => {
    let state=round()
    for(let i=0;i<110&&!state.fighters[1].capFreeze;i++)state=run(state,1,{special:true}).state
    const snapshot=structuredClone(state)
    run(state,5)
    expect(state).toEqual(snapshot)
  })
  it('attaches on impact, holds movement and airborne physics, refreshes, and expires', () => {
    let state = round()
    let connected = 0
    let lastFreeze = 0
    for (let i = 0; i < 160; i++) {
      const inputs: [MarsArcadeInput, MarsArcadeInput] = [{ ...neutral, special: true }, { ...neutral }]
      if (state.fighters[1].capFreeze) inputs[1] = { ...neutral, move: 1, jump: true, light: true }
      const before = state
      const next = advanceMarsArcade(state, inputs, MARS_ARCADE_TIMING.frameSeconds)
      state = next.state
      if (hits(next.events).length) { connected++; expect(state.fighters[1].capFreeze?.framesRemaining).toBe(30); lastFreeze = i }
      if (before.fighters[1].capFreeze && state.fighters[1].capFreeze) {
        expect(state.fighters[1].x).toBe(before.fighters[1].x)
        expect(state.fighters[1].y).toBe(before.fighters[1].y)
        expect(state.fighters[1].activeButton).toBeNull()
      }
    }
    expect(connected).toBe(3)
    expect(lastFreeze).toBeGreaterThan(90)
    expect(state.fighters[1].capFreeze).toBeUndefined()
  })
  it('keeps a missed hat visibly curved, reverses its horizontal direction, and expires', () => {
    let state = round(); state.fighters[1].y = 200; state.fighters[1].velocityY = 30
    state = run(state, marsArcadeFighter('trump').moves.special.startupFrames + 1, { special: true }).state
    expect(state.projectiles[0]?.capFlight).toBeDefined()
    const initial = state.projectiles[0]!
    state.fighters[0].activity = 'idle'; state.fighters[0].activeButton = null
    const middle = run(state, 48).state
    expect(middle.projectiles[0]?.x).toBeGreaterThan(initial.x + 200)
    expect(middle.projectiles[0]?.velocityX).toBeLessThan(0)
    expect(middle.projectiles[0]?.y).not.toBe(initial.y)
    const end = run(middle, 60)
    expect(end.state.projectiles).toHaveLength(0)
    expect(hits(end.events)).toHaveLength(0)
  })
  it('can connect on the return when the opponent missed the outbound pass', () => {
    let state = round(); state.fighters[1].y = 300; state.fighters[1].velocityY = 25
    state = run(state, marsArcadeFighter('trump').moves.special.startupFrames + 36, { special: true }).state
    state.fighters[0].activity = 'idle'; state.fighters[0].activeButton = null
    state.fighters[1].y = 0; state.fighters[1].velocityY = 0
    const result = run(state, 90)
    expect(hits(result.events).length).toBeGreaterThan(0)
    expect(result.state.projectiles).toHaveLength(0)
  })
  it('a blocked hat chips guard without attaching or freezing', () => {
    let state = round()
    state.fighters[1].x = 240
    const events: MarsArcadeEvent[] = []
    for (let i = 0; i < 190; i++) {
      const result = advanceMarsArcade(state, [{ ...neutral, special: true }, { ...neutral, move: 1 }], MARS_ARCADE_TIMING.frameSeconds)
      state = result.state; events.push(...result.events)
      expect(state.fighters[1].capFreeze).toBeUndefined()
    }
    expect(events.filter(e => e.type === 'blocked' && e.moveId === 'trump.capThrow')).toHaveLength(3)
    expect(state.fighters[1].health).toBe(97)
  })
  it('interruption cancels unreleased hats but preserves a hat already in flight', () => {
    let state = round(); state.fighters[1].y = 300; state.fighters[1].velocityY = 25
    state = run(state, marsArcadeFighter('trump').moves.special.startupFrames + 1, { special: true }).state
    expect(state.projectiles).toHaveLength(1)
    state.fighters[0].activity = 'hitstun'; state.fighters[0].activeButton = null; state.fighters[0].stunFrames = 8
    const result = run(state, 120)
    expect(result.events.filter(e => e.type === 'projectileFired')).toHaveLength(0)
    expect(result.state.projectiles).toHaveLength(0)
  })
  it.each(['ko', 'timeOver'] as const)('cleans all cap effects when the round ends with %s', ending => {
    let state = round()
    for (let i = 0; i < 110 && !state.fighters[1].capFreeze; i++) state = run(state, 1, { special: true }).state
    expect(state.fighters[1].capFreeze).toBeDefined()
    if (ending === 'timeOver') state.timerFrames = 1
    else state.fighters[1].health = 1
    const result = run(state, 80, { special: true })
    expect(result.state.phase).toBe(ending)
    expect(result.state.fighters.every(f => !f.capFreeze)).toBe(true)
    expect(result.state.projectiles.filter(p => p.capFlight)).toHaveLength(0)
    expect(createMarsArcadeRound('trump', 'booster').fighters.every(f => !f.capFreeze)).toBe(true)
  })
})
