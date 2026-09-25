import { afterEach, describe, expect, it } from 'vitest'

import {
  MARS_ARCADE_TIMING,
  NEUTRAL_MARS_ARCADE_INPUT,
  advanceMarsArcade,
  createMarsArcadeRound,
  marsArcadeMeleeBoxes,
  type MarsArcadeEvent,
  type MarsArcadeInput,
  type MarsArcadeState,
} from './marsArcade'
import {
  MARS_ARCADE_DEFAULT_RULES,
  MARS_ARCADE_FIGHTERS,
  marsArcadeDefaultTuning,
  marsArcadeRules,
  setMarsArcadeTuning,
  type MarsArcadeButton,
  type MarsArcadeFighterId,
  type MarsArcadeRules,
} from './marsArcadeFighters'
import { marsArcadeRulesFrame } from './marsArcadePose'
import { parseMarsArcadeTuning } from './marsArcadeTuning'
import shipped from './marsArcadeTuning.json'

afterEach(() => setMarsArcadeTuning(null))

function rules(next: Partial<MarsArcadeRules>): void {
  setMarsArcadeTuning({ ...marsArcadeDefaultTuning(), rules: { ...MARS_ARCADE_DEFAULT_RULES, ...next } })
}

const neutral = (): MarsArcadeInput => ({ ...NEUTRAL_MARS_ARCADE_INPUT })

function step(state: MarsArcadeState, inputs: [MarsArcadeInput, MarsArcadeInput] = [neutral(), neutral()]) {
  return advanceMarsArcade(state, inputs, MARS_ARCADE_TIMING.frameSeconds)
}

/**
 * The attacker (left) one frame before the first active frame of `button`, the
 * defender `separation` px to its right. `defender` patches the defender's state.
 */
function poised(
  attacker: MarsArcadeFighterId,
  button: MarsArcadeButton,
  defenderId: MarsArcadeFighterId,
  separation: number,
  defender: Partial<MarsArcadeState['fighters'][1]> = {},
): MarsArcadeState {
  const move = MARS_ARCADE_FIGHTERS[attacker].moves[button]
  const round = createMarsArcadeRound(attacker, defenderId)
  return {
    ...round,
    phase: 'fight',
    fighters: [
      { ...round.fighters[0], x: 0, facing: 1, activity: 'attack', activeButton: button, moveFrame: move.startupFrames - 1 },
      { ...round.fighters[1], x: separation, facing: -1, ...defender },
    ],
  }
}

const struck = (events: MarsArcadeEvent[]) => events.find((event) => event.type === 'hit' || event.type === 'blocked')

describe('the rule switches', () => {
  it('ship off, in the code default and in the shipped tuning file', () => {
    expect(MARS_ARCADE_DEFAULT_RULES).toEqual({ useBounds: false, hitstop: false })
    expect(parseMarsArcadeTuning(shipped).rules).toEqual({ useBounds: false, hitstop: false })
    expect(marsArcadeRules()).toEqual({ useBounds: false, hitstop: false })
  })

  it('come in with the tuning and go back to the default with it', () => {
    rules({ useBounds: true, hitstop: true })
    expect(marsArcadeRules()).toEqual({ useBounds: true, hitstop: true })
    setMarsArcadeTuning(null)
    expect(marsArcadeRules()).toEqual({ useBounds: false, hitstop: false })
  })
})

describe('melee by box overlap (useBounds on)', () => {
  it('lands the jab where its attack box meets the hurt box, and not one pixel further', () => {
    // The jab's attack box ends 41 px ahead of the booster; Oracle's idle hurt box
    // starts 19 px ahead of Oracle. They overlap while the gap is under 60.
    rules({ useBounds: true })
    expect(struck(step(poised('booster', 'light', 'oracle', 59)).events)?.type).toBe('hit')
    expect(struck(step(poised('booster', 'light', 'oracle', 60)).events)).toBeUndefined()
  })

  it('leaves the reach check exactly as it was with the switch off', () => {
    expect(struck(step(poised('booster', 'light', 'oracle', 41)).events)?.type).toBe('hit')
    expect(struck(step(poised('booster', 'light', 'oracle', 42)).events)).toBeUndefined()
  })

  it('reads the boxes of the drawings actually in play', () => {
    // Out of range, so nothing lands and both drawings are the ones the step chose.
    rules({ useBounds: true })
    const state = step(poised('booster', 'light', 'oracle', 70)).state
    const boxes = marsArcadeMeleeBoxes(state, 0)
    expect(marsArcadeRulesFrame(state, 0)?.pose).toBe('jab')
    expect(marsArcadeRulesFrame(state, 1)?.pose).toBe('anchor')
    expect(boxes?.attack).toEqual([{ minX: 21, maxX: 41, minY: 74, maxY: 84 }])
    expect(boxes?.hurt[0]?.minX).toBe(70 - 19)
  })

  it('lets a fighter jump over the sweep by the drawn boxes, not by maxHeight', () => {
    // Hard Cutoff's attack box covers 10-23 px above the floor. A falling booster whose
    // feet are 24 px up clears it; the reach check would have used maxHeight 24 and
    // still hit.
    rules({ useBounds: true })
    const airborne = { y: 24, velocityY: -2, activity: 'airborne' as const }
    expect(struck(step(poised('oracle', 'heavy', 'booster', 40, airborne)).events)).toBeUndefined()
    const low = { y: 12, velocityY: -2, activity: 'airborne' as const }
    expect(struck(step(poised('oracle', 'heavy', 'booster', 40, low)).events)?.type).toBe('hit')
    setMarsArcadeTuning(null)
    expect(struck(step(poised('oracle', 'heavy', 'booster', 40, airborne)).events)?.type).toBe('hit')
  })

  it('falls back to reach for a move with no drawn attack box rather than never landing', () => {
    // The captain has no move clips yet.
    rules({ useBounds: true })
    const reach = MARS_ARCADE_FIGHTERS.captain.moves.heavy.reach
    const at = (gap: number) => poised('captain', 'heavy', 'booster', gap)
    expect(marsArcadeMeleeBoxes(step(at(reach)).state, 0)).toBeNull()
    expect(struck(step(at(reach)).events)?.type).toBe('hit')
    expect(struck(step(at(reach + 1)).events)).toBeUndefined()
  })
})

/** Blocking is holding away, so the defender (right) holds right on the frame that lands. */
const guard = (state: MarsArcadeState) => step(state, [neutral(), { ...neutral(), move: 1 }])

describe('guard height (useBounds on)', () => {

  it('lets the low sweep through a standing guard', () => {
    rules({ useBounds: true })
    expect(MARS_ARCADE_FIGHTERS.oracle.moves.heavy.guardHeight).toBe('low')
    expect(struck(guard(poised('oracle', 'heavy', 'booster', 30)).events)?.type).toBe('hit')
  })

  it('still stops a mid attack', () => {
    rules({ useBounds: true })
    expect(MARS_ARCADE_FIGHTERS.booster.moves.light.guardHeight).toBe('mid')
    expect(struck(guard(poised('booster', 'light', 'oracle', 30)).events)?.type).toBe('blocked')
  })

  it('stops everything with the switch off, as it always has', () => {
    expect(struck(guard(poised('oracle', 'heavy', 'booster', 30)).events)?.type).toBe('blocked')
  })
})

describe('pushbox from the fighter content', () => {
  it('holds the fighters apart by the average of their two pushboxes', () => {
    const original = MARS_ARCADE_FIGHTERS.booster.pushboxWidth
    const round = createMarsArcadeRound('booster', 'oracle')
    const touching: MarsArcadeState = {
      ...round,
      phase: 'fight',
      fighters: [{ ...round.fighters[0], x: 0 }, { ...round.fighters[1], x: 1 }],
    }
    try {
      expect(step(touching).state.fighters[1].x - step(touching).state.fighters[0].x).toBe(24)
      MARS_ARCADE_FIGHTERS.booster.pushboxWidth = 40
      const pushed = step(touching).state
      expect(pushed.fighters[1].x - pushed.fighters[0].x).toBe(32)
    } finally {
      MARS_ARCADE_FIGHTERS.booster.pushboxWidth = original
    }
  })
})

describe('hit stop', () => {
  it('freezes the fight for the move\'s frames on a hit, then lets it run', () => {
    rules({ hitstop: true })
    const hit = step(poised('booster', 'heavy', 'oracle', 30))
    const stop = MARS_ARCADE_FIGHTERS.booster.moves.heavy.hitstopFrames
    expect(stop).toBe(4)
    expect(struck(hit.events)).toMatchObject({ type: 'hit', hitstopFrames: stop })
    expect(hit.state.hitstop).toEqual({ frames: stop, framesRemaining: stop, defenders: [1] })

    let state = hit.state
    const frozen = structuredClone({ fighters: state.fighters, frame: state.frame, timer: state.timerFrames })
    for (let frame = 1; frame <= stop; frame += 1) {
      state = step(state).state
      expect({ fighters: state.fighters, frame: state.frame, timer: state.timerFrames }).toEqual(frozen)
    }
    expect(state.hitstop).toBeNull()
    const after = step(state).state
    expect(after.frame).toBe(frozen.frame + 1)
    expect(after.fighters[1].stunFrames).toBe(frozen.fighters[1].stunFrames - 1)
    expect(after.fighters[0].moveFrame).toBe(frozen.fighters[0].moveFrame + 1)
  })

  it('freezes on a block too', () => {
    rules({ hitstop: true })
    const blocked = guard(poised('booster', 'light', 'oracle', 30))
    expect(struck(blocked.events)).toMatchObject({ type: 'blocked', hitstopFrames: 2 })
    expect(blocked.state.hitstop?.framesRemaining).toBe(2)
  })

  it('does not consume a button held through the freeze', () => {
    // A press is an edge against previousButtons. The freeze does not update them, so a
    // button first held during the freeze is still a fresh press on the first frame after.
    rules({ hitstop: true })
    let state = step(poised('booster', 'light', 'oracle', 30)).state
    const held: [MarsArcadeInput, MarsArcadeInput] = [{ ...neutral(), heavy: true }, { ...neutral(), light: true }]
    for (let frame = 0; frame < 2; frame += 1) {
      expect(state.hitstop).not.toBeNull()
      state = step(state, held).state
      expect(state.fighters[0].previousButtons.heavy).toBe(false)
      expect(state.fighters[1].previousButtons.light).toBe(false)
    }
    expect(state.hitstop).toBeNull()
    state = step(state, held).state
    expect(state.fighters[0].previousButtons.heavy).toBe(true)
    expect(state.fighters[1].previousButtons.light).toBe(true)
  })

  it('does nothing with the switch off: no freeze, and the event keeps its old shape', () => {
    const hit = step(poised('booster', 'heavy', 'oracle', 30))
    expect(hit.state.hitstop).toBeNull()
    expect(struck(hit.events)).toEqual({ type: 'hit', attacker: 0, moveId: 'booster.staticFire', damage: 13 })
  })

  it('clears the freeze when the blow ends the round, so the result never flashes', () => {
    rules({ hitstop: true })
    const lastBlow = poised('booster', 'heavy', 'oracle', 30, { health: 5 })
    const { state, events } = step(lastBlow)
    expect(events.map((event) => event.type)).toEqual(['hit', 'ko'])
    expect(state.phase).toBe('ko')
    expect(state.hitstop).toBeNull()
  })

  it('freezes on both defenders when two strikes trade', () => {
    rules({ hitstop: true })
    const round = createMarsArcadeRound('booster', 'oracle')
    const light = (fighter: MarsArcadeFighterId) => MARS_ARCADE_FIGHTERS[fighter].moves.light
    const trade: MarsArcadeState = {
      ...round,
      phase: 'fight',
      fighters: [
        { ...round.fighters[0], x: 0, facing: 1, activity: 'attack', activeButton: 'light', moveFrame: light('booster').startupFrames - 1 },
        { ...round.fighters[1], x: 30, facing: -1, activity: 'attack', activeButton: 'light', moveFrame: light('oracle').startupFrames - 1 },
      ],
    }
    const { state, events } = step(trade)
    expect(events.filter((event) => event.type === 'hit')).toHaveLength(2)
    expect(state.hitstop).toEqual({ frames: 2, framesRemaining: 2, defenders: [1, 0] })
  })
})

describe('tuning file v2', () => {
  it('migrates a v1 file: switches off, each move takes the content\'s hit stop', () => {
    const v1 = structuredClone(shipped) as Record<string, unknown> & { fighters: Record<string, { moves: Record<string, Record<string, unknown>> }> }
    v1.version = 1
    delete v1.rules
    for (const fighter of Object.values(v1.fighters)) {
      for (const move of Object.values(fighter.moves)) delete move.hitstopFrames
    }
    v1.fighters.oracle!.moves.light!.damage = 7
    const migrated = parseMarsArcadeTuning(v1)
    expect(migrated.version).toBe(2)
    expect(migrated.rules).toEqual({ useBounds: false, hitstop: false })
    expect(migrated.fighters.booster.moves.heavy.hitstopFrames).toBe(MARS_ARCADE_FIGHTERS.booster.moves.heavy.hitstopFrames)
    expect(migrated.fighters.oracle.moves.light.damage).toBe(7)
  })

  it('migrates past a fighter key that is not a fighter, such as an inherited name', () => {
    const v1 = structuredClone(shipped) as Record<string, unknown> & { fighters: Record<string, unknown> }
    v1.version = 1
    delete v1.rules
    for (const fighter of Object.values(v1.fighters) as { moves: Record<string, Record<string, unknown>> }[]) {
      for (const move of Object.values(fighter.moves)) delete move.hitstopFrames
    }
    Object.assign(v1.fighters, { toString: { moves: { light: {} } } })
    expect(() => parseMarsArcadeTuning(v1)).not.toThrow()
  })

  it('refuses a switch that is not true or false, and a hit stop out of range', () => {
    const bad = structuredClone(shipped) as Record<string, unknown> & { rules: Record<string, unknown> }
    bad.rules.useBounds = 'yes'
    expect(() => parseMarsArcadeTuning(bad)).toThrow(/rules.useBounds/)
    const long = structuredClone(shipped)
    long.fighters.booster.moves.light.hitstopFrames = 90
    expect(() => parseMarsArcadeTuning(long)).toThrow(/hitstopFrames/)
  })
})
