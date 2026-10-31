import { afterEach, describe, expect, it } from 'vitest'
import { advanceMarsArcade, createMarsArcadeRound, MARS_ARCADE_TIMING, NEUTRAL_MARS_ARCADE_INPUT, type MarsArcadeInput, type MarsArcadeState } from '../game/marsArcade'
import { marsArcadeDefaultTuning, marsArcadeFighter, setMarsArcadeTuning, type MarsArcadeFighterId } from '../game/marsArcadeFighters'
import { parseMarsArcadeTuning } from '../game/marsArcadeTuning'
import { arcadeClip, selectArcadeSprite } from './arcadeHarnessSprites'
import { validateMarsArcadeAnimations } from '../game/marsArcadeAnimations'
import { MARS_ARCADE_ANIMATIONS, marsArcadeRulesFrame } from '../game/marsArcadePose'

const trump = 'trump' as MarsArcadeFighterId
afterEach(() => setMarsArcadeTuning(null))
function round(): MarsArcadeState {
  expect(() => createMarsArcadeRound(trump, 'booster')).not.toThrow()
  return { ...createMarsArcadeRound(trump, 'booster'), phase: 'fight' }
}
const step = (state: MarsArcadeState, left: Partial<MarsArcadeInput> = {}) =>
  advanceMarsArcade(state, [{ ...NEUTRAL_MARS_ARCADE_INPUT, ...left }, { ...NEUTRAL_MARS_ARCADE_INPUT }], MARS_ARCADE_TIMING.frameSeconds)

describe('Donald Trump runtime integration', () => {
  it('creates a playable round for the new fighter', () => {
    const state = round()
    expect(state.fighters[0]).toMatchObject({ id: 'trump', health: 100 })
    expect(marsArcadeFighter(trump).label).toBe('TRUMP')
    expect(selectArcadeSprite(state, 0, false).src).toContain('/trump/normalised-anchor-v2/')
  })
  it('plays the windmill contact with an attack box only while active', () => {
    const clip = arcadeClip(trump, 'heavy')
    expect(clip).not.toBeNull()
    expect(clip!.frames.filter(f => f.attack?.length).map(f => f.pose)).toEqual(['windmill-contact'])
    const state = round()
    state.fighters[0] = { ...state.fighters[0], activity: 'attack', activeButton: 'heavy', moveFrame: 14 }
    const active = selectArcadeSprite(state, 0, false)
    expect(active.src).toContain('/normalised-heavy-windmill-v1-candidate/heavy/heavy-03.png')
    expect(active.frame?.attack?.length).toBeGreaterThan(0)
    state.fighters[0].moveFrame = 19
    expect(selectArcadeSprite(state, 0, false).frame?.attack).toBeUndefined()
    expect(validateMarsArcadeAnimations(MARS_ARCADE_ANIMATIONS).filter(f => f.severity === 'error')).toEqual([])
  })
  it.each(['hitstun', 'airborne', 'walk'] as const)('plays authored %s poses inside Trump art', activity => {
    const state = round()
    state.fighters[0] = { ...state.fighters[0], activity, stunFrames: activity === 'hitstun' ? 8 : 0, y: activity === 'airborne' ? 15 : 0 }
    expect(() => selectArcadeSprite(state, 0, false)).not.toThrow()
    expect(selectArcadeSprite(state, 0, false).src).toContain('/trump/')
    expect(selectArcadeSprite(state, 0, false).placeholder).toBe(false)
    expect(selectArcadeSprite(state, 0, false).frame).toEqual(marsArcadeRulesFrame(state, 0))
  })
  it('starts Cap Throw and spends its activation cost once', () => {
    const state = round()
    state.fighters[0].meter = 100
    const result = step(state, { special: true })
    expect(result.state.fighters[0].activeButton).toBe('special')
    expect(result.state.fighters[0].meter).toBe(60)
    expect(result.events.filter(e => e.type === 'hit' || e.type === 'blocked')).toEqual([])
  })
  it('adds Trump defaults when reading a pre-Trump tuning file', () => {
    const old = structuredClone(marsArcadeDefaultTuning())
    delete (old.fighters as Partial<typeof old.fighters>).trump
    const parsed = parseMarsArcadeTuning(old)
    expect(parsed.fighters.trump?.health).toBe(100)
    expect(parsed.fighters.booster).toEqual(old.fighters.booster)
  })
  it('gives a funded special priority over simultaneous heavy input', () => {
    const state = round(); state.fighters[0].meter = 100
    const result = step(state, { special: true, heavy: true })
    expect(result.state.fighters[0].activeButton).toBe('special')
  })
  it('keeps the rules on the same authored reaction frame the player sees', () => {
    const state = round()
    state.fighters[0].activity = 'hitstun'
    state.fighters[0].stunFrames = 8
    expect(marsArcadeRulesFrame(state, 0)?.src).toContain('/trump/normalised-full-set-ready-v1/hit/')
    expect(marsArcadeRulesFrame(state, 0)).toEqual(selectArcadeSprite(state, 0, false).frame)
    expect(marsArcadeRulesFrame(state, 0)?.hurt?.length).toBeGreaterThan(0)
  })
  it('exposes all twelve gameplay families and a looping two-fist victory dance', () => {
    for (const name of ['idle','jab','heavy','block','walk-forward','walk-back','jump','hit','heavy-block','special','victory','knockout']) {
      expect(arcadeClip('trump', name), name).not.toBeNull()
    }
    const state = round(); state.phase = 'ko'; state.winner = 0
    expect(arcadeClip('trump','victory')?.loop).toBe('loop')
    const a = selectArcadeSprite(state,0,false,0), b = selectArcadeSprite(state,0,false,12)
    expect(a.src).not.toBe(b.src)
    expect(selectArcadeSprite(state,0,false,24).src).toBe(a.src)
    expect(selectArcadeSprite(state,0,true,0).src).toBe(selectArcadeSprite(state,0,true,12).src)
  })
  it('rejects malformed explicit Trump tuning rather than replacing it with defaults', () => {
    const input = structuredClone(marsArcadeDefaultTuning())
    ;(input.fighters as unknown as Record<string, unknown>).trump = { health: -1 }
    expect(() => parseMarsArcadeTuning(input)).toThrow(/trump/)
  })
})
