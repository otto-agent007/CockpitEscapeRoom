import { MARS_ARCADE_ANIMATIONS } from './marsArcadePose'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

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
import { marsArcadeCandidateClips, marsArcadeClip, marsArcadeRulesFrame, setMarsArcadeClipOverride } from './marsArcadePose'
import { marsArcadeBoxToStage, marsArcadeBoxesOverlap } from './marsArcadeBounds'
import { parseMarsArcadeTuning } from './marsArcadeTuning'
import shipped from './marsArcadeTuning.json'

afterEach(() => setMarsArcadeTuning(null))
// Isolate each switch's behavior; the default-on integration is asserted below.
beforeEach(() => rules({ useBounds: false, hitstop: false }))

function rules(next: Partial<MarsArcadeRules>): void {
  setMarsArcadeTuning({ ...marsArcadeDefaultTuning(), rules: { useBounds: false, hitstop: false, ...next } })
}

const neutral = (): MarsArcadeInput => ({ ...NEUTRAL_MARS_ARCADE_INPUT })

describe('terminal combat boxes', () => {
  it.each(['ko', 'timeout-loss', 'timeout-draw'] as const)('clears frozen attacks after a real %s on either side', (finish) => {
    rules({ useBounds: true, hitstop: false })
    for (const side of [0, 1] as const) {
      const previous = poised('captain', 'light', 'booster', 24)
      if (side === 1) previous.fighters.reverse()
      const attacker = previous.fighters[side]
      if (finish === 'ko') previous.fighters[side === 0 ? 1 : 0].health = 1
      else {
        previous.timerFrames = 1
        previous.fighters[0].x = -120
        previous.fighters[1].x = 120
        if (finish === 'timeout-loss') attacker.health = 90
      }
      expect(marsArcadeRulesFrame(previous, side)).not.toBeNull()
      const state = step(previous).state
      expect(state.phase).toBe(finish === 'ko' ? 'ko' : 'timeOver')
      expect(state.winner).toBe(finish === 'ko' ? side : finish === 'timeout-draw' ? null : side === 0 ? 1 : 0)
      const frozen = structuredClone(state)
      for (const actor of [0, 1] as const) {
        expect(marsArcadeRulesFrame(state, actor)).toBeNull()
        expect(marsArcadeMeleeBoxes(state, actor)).toBeNull()
      }
      expect(state).toEqual(frozen)
      expect(step(state).state).toEqual(frozen)
    }
  })
})

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
  it('ship on and connect beyond legacy reach with an impact pause', () => {
    setMarsArcadeTuning(null)
    expect(MARS_ARCADE_DEFAULT_RULES).toEqual({ useBounds: true, hitstop: true })
    expect(parseMarsArcadeTuning(shipped).rules).toEqual({ useBounds: true, hitstop: true })
    expect(marsArcadeRules()).toEqual({ useBounds: true, hitstop: true })
    const transition = step(poised('booster', 'light', 'oracle', 49.5))
    expect(struck(transition.events)?.type).toBe('hit')
    expect(transition.state.hitstop?.framesRemaining).toBe(MARS_ARCADE_FIGHTERS.booster.moves.light.hitstopFrames)
  })

  it('come in with the tuning and go back to the default with it', () => {
    rules({ useBounds: false, hitstop: false })
    expect(marsArcadeRules()).toEqual({ useBounds: false, hitstop: false })
    setMarsArcadeTuning(null)
    expect(marsArcadeRules()).toEqual({ useBounds: true, hitstop: true })
  })
})

describe('melee by box overlap (useBounds on)', () => {
  it.each(['booster', 'oracle'] as const)('hits %s walking legs with a sweep, without jabbing empty air above them, on either facing', (defenderId) => {
    for (const facing of [1, -1] as const) {
      const overlap = (attacker: MarsArcadeFighterId, button: MarsArcadeButton) => {
        const state = poised(attacker, button, defenderId, 70, { activity: 'walk' })
        state.frame = 0 // The long forward stride, not the gathered legs.
        state.fighters[0].moveFrame += 1 // First active frame, without moving either fighter.
        state.fighters[0].facing = facing
        state.fighters[1].facing = facing === 1 ? -1 : 1
        state.fighters[1].x *= facing
        expect(marsArcadeRulesFrame(state, 1)?.pose).toBe('step')
        const boxes = marsArcadeMeleeBoxes(state, 0)!
        return boxes.attack.some((attack) => boxes.hurt.some((hurt) => marsArcadeBoxesOverlap(attack, hurt)))
      }
      expect(overlap('booster', 'light'), `jab facing ${facing}`).toBe(false)
      expect(overlap('oracle', 'heavy'), `sweep facing ${facing}`).toBe(true)
    }
  })

  it('moves Oracle sweep hurtboxes down with the crouched drawing and includes its extended leg', () => {
    const frame = marsArcadeClip('oracle', 'heavy')!.frames[1]!
    const hurts = frame.hurt!.map((box) => marsArcadeBoxToStage(box, 0, 1))
    const touches = (x: number, y: number) => hurts.some((hurt) =>
      marsArcadeBoxesOverlap(hurt, marsArcadeBoxToStage({ x, y, width: 1, height: 1 }, 0, 1)))
    expect(touches(63, 29)).toBe(false) // Empty air above the lowered head.
    expect(touches(107, 94)).toBe(true) // The raised shoe beyond the torso.
  })

  it.each([
    ['booster', 'heavy', 3, 94, 39, 65],
    ['oracle', 'jab', 1, 100, 37, 70],
  ] as const)('keeps %s %s extended arms hittable without filling the air below them', (fighter, animation, index, x, armY, airY) => {
    const frame = marsArcadeClip(fighter, animation)!.frames[index]!
    expect(frame.phase).toBe('active')
    for (const facing of [1, -1] as const) {
      const hurts = frame.hurt!.map((box) => marsArcadeBoxToStage(box, 0, facing))
      const touches = (y: number) => hurts.some((hurt) => marsArcadeBoxesOverlap(hurt,
        marsArcadeBoxToStage({ x, y, width: 1, height: 1 }, 0, facing)))
      expect(touches(armY)).toBe(true)
      expect(touches(airY)).toBe(false)
    }
  })

  it('lands the jab where its attack box meets the hurt box, and not one pixel further', () => {
    // The jab ends 41 px ahead of Booster. Oracle's tightened upper-body box
    // reaches 16 px toward him; strict overlap ends at a separation of 57.
    rules({ useBounds: true })
    for (const facing of [1, -1] as const) {
      const at = (gap: number) => {
        const state = poised('booster', 'light', 'oracle', gap)
        state.fighters[0].facing = facing
        state.fighters[1].facing = facing === 1 ? -1 : 1
        state.fighters[1].x *= facing
        return step(state)
      }
      expect(struck(at(56).events)?.type, `facing ${facing}`).toBe('hit')
      expect(struck(at(57).events), `facing ${facing}`).toBeUndefined()
    }
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
    expect(boxes?.hurt).toEqual([
      { minX: 63, maxX: 83, minY: 79, maxY: 101 }, // Head.
      { minX: 54, maxX: 84, minY: 41, maxY: 79 }, // Upper body.
      { minX: 52, maxX: 86, minY: 0, maxY: 41 }, // Legs.
    ])
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
    rules({ useBounds: false })
    expect(struck(step(poised('oracle', 'heavy', 'booster', 40, airborne)).events)?.type).toBe('hit')
  })

  it('falls back to reach for a move with no drawn attack box rather than never landing', () => {
    // Remove the authored heavy to exercise the real missing-clip fallback.
    rules({ useBounds: true })
    const clips = MARS_ARCADE_ANIMATIONS.animations
    const index = clips.findIndex(clip => clip.moveId === 'captain.runTheChecklist')
    expect(index).toBeGreaterThanOrEqual(0)
    const [authored] = clips.splice(index, 1)
    try {
      const reach = MARS_ARCADE_FIGHTERS.captain.moves.heavy.reach
      const at = (gap: number) => poised('captain', 'heavy', 'booster', gap)
      expect(marsArcadeMeleeBoxes(step(at(reach)).state, 0)).toBeNull()
      expect(struck(step(at(reach)).events)?.type).toBe('hit')
      expect(struck(step(at(reach + 1)).events)).toBeUndefined()
    } finally {
      clips.splice(index, 0, authored!)
    }
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
    setMarsArcadeTuning(null) // Read the mutable baked content directly in this fixture.
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

describe('tuning file v3', () => {
  it('migrates a v1 file: switches off, each move takes the content\'s hit stop', () => {
    const v1 = structuredClone(shipped) as Record<string, unknown> & { fighters: Record<string, { moves: Record<string, Record<string, unknown>> }> }
    v1.version = 1
    delete v1.rules
    for (const fighter of Object.values(v1.fighters)) {
      for (const move of Object.values(fighter.moves)) delete move.hitstopFrames
    }
    v1.fighters.oracle!.moves.light!.damage = 7
    const migrated = parseMarsArcadeTuning(v1)
    expect(migrated.version).toBe(3)
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

describe('candidate clips', () => {
  afterEach(() => setMarsArcadeClipOverride('oracle', 'walk-forward', null))

  it('lists the video walk as a candidate for the shipped walk', () => {
    expect(marsArcadeCandidateClips()).toContainEqual({ fighter: 'oracle', animation: 'walk-forward', candidate: 'walk-forward-video' })
  })

  it('points the rules at the candidate drawing while its preview is on, and back when it is off', () => {
    const round = createMarsArcadeRound('booster', 'oracle')
    const state: MarsArcadeState = {
      ...round,
      phase: 'fight',
      fighters: [round.fighters[0], { ...round.fighters[1], activity: 'walk', blocking: false }],
    }
    expect(marsArcadeRulesFrame(state, 1)?.src).toMatch(/normalised-walk-ready\/walk-forward\//)
    setMarsArcadeClipOverride('oracle', 'walk-forward', 'walk-forward-video')
    expect(marsArcadeRulesFrame(state, 1)?.src).toMatch(/normalised-walk-video-wan\/walk-forward\//)
    setMarsArcadeClipOverride('oracle', 'walk-forward', null)
    expect(marsArcadeRulesFrame(state, 1)?.src).toMatch(/normalised-walk-ready\/walk-forward\//)
  })
})
