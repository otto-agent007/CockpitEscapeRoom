import { describe, expect, it } from 'vitest'
import {
  MARS_ARCADE_STAGE,
  MARS_ARCADE_TIMING,
  NEUTRAL_MARS_ARCADE_INPUT,
  advanceMarsArcade,
  createMarsArcadeRound,
  marsArcadeActiveMove,
  marsArcadeHealthFraction,
  marsArcadeTimerSeconds,
  type MarsArcadeEvent,
  type MarsArcadeInput,
  type MarsArcadeProjectile,
  type MarsArcadeState,
} from './marsArcade'
import {
  CAPTAIN_COMPOSURE_METER_GAIN,
  MARS_ARCADE_FIGHTERS,
  type MarsArcadeFighterId,
} from './marsArcadeFighters'

type InputPair = [MarsArcadeInput, MarsArcadeInput]

const neutral = (): MarsArcadeInput => ({ ...NEUTRAL_MARS_ARCADE_INPUT })
const neutralPair = (): InputPair => [neutral(), neutral()]

function pumpWith(
  initial: MarsArcadeState,
  frames: number,
  inputFor: (frame: number) => InputPair,
): { state: MarsArcadeState; events: MarsArcadeEvent[] } {
  let state = initial
  const events: MarsArcadeEvent[] = []
  for (let frame = 1; frame <= frames; frame += 1) {
    const transition = advanceMarsArcade(state, inputFor(frame), MARS_ARCADE_TIMING.frameSeconds)
    state = transition.state
    events.push(...transition.events)
  }
  return { state, events }
}

function pump(initial: MarsArcadeState, frames: number, inputs: InputPair = neutralPair()) {
  return pumpWith(initial, frames, () => inputs)
}

/** A round with the opening intro already elapsed. */
function startedRound(
  left: MarsArcadeFighterId = 'booster',
  right: MarsArcadeFighterId = 'oracle',
): MarsArcadeState {
  return pump(createMarsArcadeRound(left, right), MARS_ARCADE_TIMING.introFrames).state
}

/** Place both fighters `distance` apart, with the defender backed onto the right wall. */
function placedAtWall(state: MarsArcadeState, distance: number, attackerMeter = 0): MarsArcadeState {
  const wall = MARS_ARCADE_STAGE.halfWidth
  return {
    ...state,
    fighters: [
      { ...state.fighters[0], x: wall - distance, facing: 1, meter: attackerMeter },
      { ...state.fighters[1], x: wall, facing: -1 },
    ],
  }
}

function eventTypes(events: MarsArcadeEvent[]): string[] {
  return events.map((event) => event.type)
}

function hold(button: 'light' | 'heavy' | 'special'): MarsArcadeInput {
  return { ...neutral(), [button]: true }
}

describe('mars arcade round setup', () => {
  it('starts in intro with both fighters on their marks, facing each other', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    expect(state.phase).toBe('intro')
    expect(state.fighters[0].x).toBe(-MARS_ARCADE_STAGE.startOffset)
    expect(state.fighters[1].x).toBe(MARS_ARCADE_STAGE.startOffset)
    expect(state.fighters[0].facing).toBe(1)
    expect(state.fighters[1].facing).toBe(-1)
    expect(state.fighters[0].health).toBe(MARS_ARCADE_FIGHTERS.booster.health)
    expect(state.winner).toBeNull()
  })

  it('opens the round exactly once when the intro elapses', () => {
    const before = pump(createMarsArcadeRound('booster', 'oracle'), MARS_ARCADE_TIMING.introFrames - 1)
    expect(before.state.phase).toBe('intro')
    expect(eventTypes(before.events)).not.toContain('roundStart')

    const after = pump(before.state, 30)
    expect(after.state.phase).toBe('fight')
    expect(eventTypes(after.events).filter((type) => type === 'roundStart')).toHaveLength(1)
  })

  it('reports the round clock in whole seconds', () => {
    expect(marsArcadeTimerSeconds(createMarsArcadeRound('booster', 'oracle'))).toBe(60)
  })
})

describe('movement', () => {
  it('walks at the fighter speed and stops at the stage wall', () => {
    const state = startedRound()
    const walkRight: InputPair = [{ ...neutral(), move: 1 }, neutral()]
    const short = pump(state, 10, walkRight)
    expect(short.state.fighters[0].x).toBeCloseTo(
      -MARS_ARCADE_STAGE.startOffset + MARS_ARCADE_FIGHTERS.booster.walkSpeed * 10,
      5,
    )

    const long = pump(state, 600, walkRight)
    expect(long.state.fighters[0].x).toBeLessThanOrEqual(MARS_ARCADE_STAGE.halfWidth)
    expect(long.state.fighters[1].x).toBeLessThanOrEqual(MARS_ARCADE_STAGE.halfWidth)
  })

  it('never lets the pushboxes overlap', () => {
    const state = startedRound()
    const converge: InputPair = [{ ...neutral(), move: 1 }, { ...neutral(), move: -1 }]
    let current = state
    let minimumSeparation = Number.POSITIVE_INFINITY
    for (let frame = 0; frame < 300; frame += 1) {
      current = advanceMarsArcade(current, converge, MARS_ARCADE_TIMING.frameSeconds).state
      minimumSeparation = Math.min(
        minimumSeparation,
        Math.abs(current.fighters[1].x - current.fighters[0].x),
      )
    }
    expect(minimumSeparation).toBeGreaterThanOrEqual(MARS_ARCADE_STAGE.pushboxWidth - 1e-6)
  })
})

describe('frame data', () => {
  it.each([
    [39, false, true], [40, false, true], [41, false, false],
    [39, true, true], [40, true, true], [41, true, false],
  ] as const)('Sam jab at %i px, mirrored=%s, connects=%s with unchanged timing and damage', (distance, mirrored, connects) => {
    const initial = placedAtWall(startedRound('oracle', 'booster'), distance)
    if (mirrored) {
      for (const fighter of initial.fighters) {
        fighter.x = -fighter.x
        fighter.facing = fighter.facing === 1 ? -1 : 1
      }
    }
    const attack: InputPair = [hold('light'), neutral()]
    const startup = pump(initial, 5, attack)
    expect(startup.events).toEqual([])
    const active = pump(startup.state, 1, attack)
    expect(active.events).toEqual(connects
      ? [{ type: 'hit', attacker: 0, moveId: 'oracle.prompt', damage: 4 }]
      : [])
    expect(active.state.fighters[1].health).toBe(connects ? 96 : 100)
    expect(pump(initial, 15, attack).state.fighters[0].activity).toBe('attack')
    expect(pump(initial, 16, attack).state.fighters[0].activity).toBe('idle')
  })

  it('Sam jab still chips for one at its approved 40px limit', () => {
    const initial = startedRound('oracle', 'booster')
    initial.fighters[0].x = 0
    initial.fighters[1].x = 32.5
    // Six guard-walk ticks at1.25px place the defender at40px on contact.
    const inputs: InputPair = [hold('light'), { ...neutral(), move: 1 }]
    const startup = pump(initial, 5, inputs)
    expect(startup.events).toEqual([])
    expect(startup.state.fighters[1].x).toBe(38.75)
    const result = pump(startup.state, 1, inputs)
    expect(result.events).toEqual([{ type: 'blocked', attacker: 0, moveId: 'oracle.prompt', chipDamage: 1 }])
    expect(result.state.fighters[1].health).toBe(99)
  })

  it.each([
    [40, false, true], [41, false, true], [42, false, false],
    [40, true, true], [41, true, true], [42, true, false],
  ] as const)('longer jab at %i px, mirrored=%s, connects=%s without changing its timing', (distance, mirrored, connects) => {
    const initial = placedAtWall(startedRound(), distance)
    if (mirrored) {
      for (const fighter of initial.fighters) {
        fighter.x = -fighter.x
        fighter.facing = fighter.facing === 1 ? -1 : 1
      }
    }
    const attack: InputPair = [hold('light'), neutral()]
    const startup = pump(initial, 4, attack)
    expect(startup.events).toEqual([])
    const active = pump(startup.state, 1, attack)
    expect(active.events).toEqual(connects
      ? [{ type: 'hit', attacker: 0, moveId: 'booster.padJab', damage: 5 }]
      : [])
    expect(active.state.fighters[1].health).toBe(connects ? 95 : 100)
    expect(pump(initial, 14, attack).state.fighters[0].activity).toBe('attack')
    expect(pump(initial, 15, attack).state.fighters[0].activity).toBe('idle')
  })

  it('still chips for one when the longer jab is blocked at its 41px limit', () => {
    const initial = startedRound()
    initial.fighters[0].x = 0
    initial.fighters[1].x = 36
    const inputs: InputPair = [hold('light'), { ...neutral(), move: 1 }]
    // Guard walks away: four startup ticks take 36→40; the contact tick takes 40→41.
    const startup = pump(initial, 4, inputs)
    expect(startup.state.fighters[1].x).toBe(40)
    expect(startup.events).toEqual([])
    const result = pump(startup.state, 1, inputs)
    expect(result.events).toEqual([{ type: 'blocked', attacker: 0, moveId: 'booster.padJab', chipDamage: 1 }])
    expect(result.state.fighters[1].health).toBe(99)
  })

  it('cannot hit during startup and connects on the first active frame', () => {
    const state = placedAtWall(startedRound(), 28)
    const attack: InputPair = [hold('light'), neutral()]
    const startup = MARS_ARCADE_FIGHTERS.booster.moves.light.startupFrames

    const duringStartup = pump(state, startup, attack)
    expect(eventTypes(duringStartup.events)).not.toContain('hit')
    expect(duringStartup.state.fighters[1].health).toBe(MARS_ARCADE_FIGHTERS.oracle.health)

    const onActive = pump(duringStartup.state, 1, attack)
    expect(eventTypes(onActive.events)).toContain('hit')
    expect(onActive.state.fighters[1].health).toBe(
      MARS_ARCADE_FIGHTERS.oracle.health - MARS_ARCADE_FIGHTERS.booster.moves.light.damage,
    )
  })

  it('hits only once per move even while the button stays held', () => {
    const state = placedAtWall(startedRound(), 28)
    const result = pump(state, 60, [hold('light'), neutral()])
    expect(eventTypes(result.events).filter((type) => type === 'hit')).toHaveLength(1)
  })

  it('whiffs when the defender is outside the move reach', () => {
    const outOfRange = MARS_ARCADE_FIGHTERS.booster.moves.heavy.reach + 20
    const state = placedAtWall(startedRound(), outOfRange)
    const result = pump(state, 60, [hold('heavy'), neutral()])
    expect(eventTypes(result.events)).not.toContain('hit')
    expect(result.state.fighters[1].health).toBe(MARS_ARCADE_FIGHTERS.oracle.health)
  })
})

describe('blocking and the guard meter', () => {
  it('converts a blocked hit into chip damage, blockstun and guard loss', () => {
    const state = placedAtWall(startedRound(), 28)
    const blockAway: InputPair = [hold('light'), { ...neutral(), move: 1 }]
    const result = pump(state, 20, blockAway)

    const move = MARS_ARCADE_FIGHTERS.booster.moves.light
    expect(eventTypes(result.events)).toContain('blocked')
    expect(eventTypes(result.events)).not.toContain('hit')
    expect(result.state.fighters[1].health).toBe(MARS_ARCADE_FIGHTERS.oracle.health - move.chipDamage)
    expect(result.state.fighters[1].guard).toBeLessThan(MARS_ARCADE_FIGHTERS.oracle.guardMax)
  })

  it('crushes the guard once the meter is spent and lands full damage', () => {
    const state = placedAtWall(startedRound(), 30)
    const cycle = 40
    const result = pumpWith(state, 400, (frame) => [
      frame % cycle === 1 ? hold('heavy') : neutral(),
      { ...neutral(), move: 1 },
    ])

    expect(eventTypes(result.events)).toContain('guardCrush')
    const crushIndex = result.events.findIndex((event) => event.type === 'guardCrush')
    expect(eventTypes(result.events.slice(crushIndex))).toContain('hit')
    expect(result.state.fighters[1].guard).toBeGreaterThan(0)
  })

  it('keeps the guard up through blockstun', () => {
    const state = placedAtWall(startedRound(), 30)
    const result = pumpWith(state, 200, (frame) => [
      frame % 24 === 1 ? hold('light') : neutral(),
      { ...neutral(), move: 1 },
    ])
    expect(eventTypes(result.events)).not.toContain('hit')
  })
})

describe('hitstun', () => {
  it('locks the defender out until the stun expires and the button is re-pressed', () => {
    const state = placedAtWall(startedRound(), 28)
    const hitFrames = MARS_ARCADE_FIGHTERS.booster.moves.light.startupFrames + 1
    const landed = pump(state, hitFrames, [hold('light'), neutral()])
    expect(eventTypes(landed.events)).toContain('hit')
    expect(landed.state.fighters[1].activity).toBe('hitstun')

    const stunFrames = landed.state.fighters[1].stunFrames
    const mashing = pump(landed.state, stunFrames, [neutral(), hold('light')])
    expect(mashing.state.fighters[1].activeButton).toBeNull()
    expect(eventTypes(mashing.events)).not.toContain('hit')

    const released = pump(mashing.state, 1, neutralPair())
    const repressed = pump(released.state, 12, [neutral(), hold('light')])
    expect(eventTypes(repressed.events)).toContain('hit')
  })
})

describe('super meter', () => {
  it('refuses a special without meter and spends it when available', () => {
    const broke = placedAtWall(startedRound(), 28, 0)
    const refused = pump(broke, 20, [hold('special'), neutral()])
    expect(refused.state.fighters[0].activeButton).toBeNull()
    expect(eventTypes(refused.events)).not.toContain('hit')

    const cost = MARS_ARCADE_FIGHTERS.booster.moves.special.meterCost
    const funded = placedAtWall(startedRound(), 28, cost)
    const spent = pump(funded, 1, [hold('special'), neutral()])
    expect(spent.state.fighters[0].activeButton).toBe('special')
    expect(spent.state.fighters[0].meter).toBe(0)
  })

  it('banks meter for both the attacker and the fighter absorbing damage', () => {
    const state = placedAtWall(startedRound(), 28)
    const result = pump(state, 20, [hold('light'), neutral()])
    expect(result.state.fighters[0].meter).toBeGreaterThan(0)
    expect(result.state.fighters[1].meter).toBeGreaterThan(0)
  })
})

describe('the booster landing window', () => {
  const cost = MARS_ARCADE_FIGHTERS.booster.moves.special.meterCost

  function runSpecial(answerWindow: boolean) {
    const state = placedAtWall(startedRound(), 90, cost)
    return pumpWith(state, 120, (frame) => {
      if (frame === 1) return [hold('special'), neutral()]
      if (answerWindow && frame === 22) return [hold('special'), neutral()]
      return neutralPair()
    })
  }

  function framesUntilIdle(answerWindow: boolean): number {
    const state = placedAtWall(startedRound(), 90, cost)
    let current = state
    for (let frame = 1; frame <= 200; frame += 1) {
      const inputs: InputPair =
        frame === 1 || (answerWindow && frame === 22) ? [hold('special'), neutral()] : neutralPair()
      current = advanceMarsArcade(current, inputs, MARS_ARCADE_TIMING.frameSeconds).state
      if (frame > 1 && current.fighters[0].activeButton === null) return frame
    }
    return Number.POSITIVE_INFINITY
  }

  it('sticks the landing when the window is answered', () => {
    expect(eventTypes(runSpecial(true).events)).toContain('stuckLanding')
    expect(eventTypes(runSpecial(true).events)).not.toContain('tippedOver')
  })

  it('tips over when the window closes unanswered', () => {
    expect(eventTypes(runSpecial(false).events)).toContain('tippedOver')
    expect(eventTypes(runSpecial(false).events)).not.toContain('stuckLanding')
  })

  it('recovers meaningfully sooner after a stuck landing', () => {
    const stuck = framesUntilIdle(true)
    const tipped = framesUntilIdle(false)
    expect(stuck).toBeLessThan(tipped)
    expect(tipped - stuck).toBeGreaterThanOrEqual(20)
  })
})

describe('projectiles', () => {
  const cost = MARS_ARCADE_FIGHTERS.oracle.moves.special.meterCost

  it('fires, travels toward the opponent and connects', () => {
    const base = startedRound('oracle', 'booster')
    const state: MarsArcadeState = {
      ...base,
      fighters: [
        { ...base.fighters[0], x: -60, facing: 1, meter: cost },
        { ...base.fighters[1], x: 60, facing: -1 },
      ],
    }
    const fired = pump(state, 12, [hold('special'), neutral()])
    expect(eventTypes(fired.events)).toContain('projectileFired')
    expect(fired.state.projectiles).toHaveLength(1)
    const [bubble] = fired.state.projectiles
    expect(bubble?.velocityX).toBeGreaterThan(0)

    const connected = pump(fired.state, 60, neutralPair())
    expect(eventTypes(connected.events)).toContain('hit')
    expect(connected.state.projectiles).toHaveLength(0)
    expect(connected.state.fighters[1].health).toBeLessThan(MARS_ARCADE_FIGHTERS.booster.health)
  })

  it('passes under a fighter who is above the bubble ceiling', () => {
    const base = startedRound('oracle', 'booster')
    const ceiling = MARS_ARCADE_FIGHTERS.oracle.moves.special.projectile?.maxHeight ?? 0
    const projectile: MarsArcadeProjectile = {
      owner: 0,
      moveId: 'oracle.textBubble',
      x: 20,
      y: MARS_ARCADE_STAGE.projectileSpawnHeight,
      velocityX: 3.4,
      framesRemaining: 120,
      damage: 10,
      chipDamage: 3,
      guardDamage: 12,
      hitstunFrames: 18,
      blockstunFrames: 12,
      knockback: 5,
      maxHeight: ceiling,
      meterGainOnHit: 4,
      meterGainOnBlock: 2,
    }
    const state: MarsArcadeState = {
      ...base,
      fighters: [
        { ...base.fighters[0], x: -60, facing: 1 },
        { ...base.fighters[1], x: 40, facing: -1, y: ceiling + 8, velocityY: 1.5, activity: 'airborne' },
      ],
      projectiles: [projectile],
    }
    const result = pump(state, 6, neutralPair())
    expect(eventTypes(result.events)).not.toContain('hit')
    expect(result.state.fighters[1].health).toBe(MARS_ARCADE_FIGHTERS.booster.health)
  })

  it('expires off the end of the stage', () => {
    const base = startedRound('oracle', 'booster')
    const state: MarsArcadeState = {
      ...base,
      fighters: [
        { ...base.fighters[0], x: -60, facing: -1 },
        { ...base.fighters[1], x: 120, facing: -1 },
      ],
      projectiles: [
        {
          owner: 0,
          moveId: 'oracle.textBubble',
          x: -60,
          y: MARS_ARCADE_STAGE.projectileSpawnHeight,
          velocityX: -3.4,
          framesRemaining: 120,
          damage: 10,
          chipDamage: 3,
          guardDamage: 12,
          hitstunFrames: 18,
          blockstunFrames: 12,
          knockback: 5,
          maxHeight: 26,
          meterGainOnHit: 4,
          meterGainOnBlock: 2,
        },
      ],
    }
    const result = pump(state, 60, neutralPair())
    expect(result.state.projectiles).toHaveLength(0)
    expect(eventTypes(result.events)).not.toContain('hit')
  })
})

describe('anti-air', () => {
  function airborneDefender(state: MarsArcadeState, distance: number, meter: number): MarsArcadeState {
    return {
      ...state,
      fighters: [
        { ...state.fighters[0], x: -distance / 2, facing: 1, meter },
        {
          ...state.fighters[1],
          x: distance / 2,
          facing: -1,
          y: 40,
          velocityY: 2,
          activity: 'airborne',
        },
      ],
    }
  }

  it('lets the launcher reach a rising opponent that a ground heavy cannot', () => {
    const cost = MARS_ARCADE_FIGHTERS.booster.moves.special.meterCost
    const heavy = pump(airborneDefender(startedRound(), 26, 0), 40, [hold('heavy'), neutral()])
    expect(eventTypes(heavy.events)).not.toContain('hit')

    const special = pump(airborneDefender(startedRound(), 26, cost), 40, [hold('special'), neutral()])
    expect(eventTypes(special.events)).toContain('hit')
  })
})

describe('the captain', () => {
  it('banks composure instead of damage when the cup goes down', () => {
    const base = startedRound('captain', 'oracle')
    const state = placedAtWall(base, 28)
    const result = pump(state, 20, [hold('light'), neutral()])

    expect(eventTypes(result.events)).toContain('composure')
    expect(eventTypes(result.events)).not.toContain('hit')
    expect(result.state.fighters[0].meter).toBe(CAPTAIN_COMPOSURE_METER_GAIN)
    expect(result.state.fighters[1].health).toBe(MARS_ARCADE_FIGHTERS.oracle.health)
  })

  it('is not selectable until it is unlocked', () => {
    expect(MARS_ARCADE_FIGHTERS.captain.unlockedByDefault).toBe(false)
    expect(MARS_ARCADE_FIGHTERS.booster.unlockedByDefault).toBe(true)
    expect(MARS_ARCADE_FIGHTERS.oracle.unlockedByDefault).toBe(true)
  })
})

describe('ending the round', () => {
  it('declares a knockout and stops the fight', () => {
    const base = placedAtWall(startedRound(), 28)
    const state: MarsArcadeState = {
      ...base,
      fighters: [base.fighters[0], { ...base.fighters[1], health: 3 }],
    }
    const result = pump(state, 20, [hold('light'), neutral()])
    expect(result.state.phase).toBe('ko')
    expect(result.state.winner).toBe(0)
    expect(result.state.fighters[1].health).toBe(0)
    expect(marsArcadeHealthFraction(result.state.fighters[1])).toBe(0)
    expect(eventTypes(result.events)).toContain('ko')

    const frozen = pump(result.state, 60, [hold('heavy'), neutral()])
    expect(frozen.state.frame).toBe(result.state.frame)
  })

  it('awards time over to the healthier fighter and draws on a tie', () => {
    const base = startedRound()
    const ahead: MarsArcadeState = {
      ...base,
      timerFrames: 1,
      fighters: [{ ...base.fighters[0], health: 40 }, { ...base.fighters[1], health: 12 }],
    }
    const decided = pump(ahead, 1)
    expect(decided.state.phase).toBe('timeOver')
    expect(decided.state.winner).toBe(0)
    expect(eventTypes(decided.events)).toContain('timeOver')

    const level: MarsArcadeState = {
      ...base,
      timerFrames: 1,
      fighters: [{ ...base.fighters[0], health: 30 }, { ...base.fighters[1], health: 30 }],
    }
    const drawn = pump(level, 1)
    expect(drawn.state.phase).toBe('timeOver')
    expect(drawn.state.winner).toBeNull()
  })
})

describe('marsArcadeActiveMove', () => {
  it('reports nothing while idle', () => {
    expect(marsArcadeActiveMove(startedRound().fighters[0])).toBeNull()
  })

  it('walks startup, active and recovery in step with the frame data', () => {
    const move = MARS_ARCADE_FIGHTERS.booster.moves.heavy
    const total = move.startupFrames + move.activeFrames + move.recoveryFrames
    const state = placedAtWall(startedRound(), 90)
    const phases: string[] = []
    let current = state
    // The frame that starts a move does not also advance it, so the move occupies
    // total + 1 pumped frames and the last one lands back on idle.
    for (let frame = 1; frame <= total + 1; frame += 1) {
      current = advanceMarsArcade(
        current,
        [frame === 1 ? hold('heavy') : neutral(), neutral()],
        MARS_ARCADE_TIMING.frameSeconds,
      ).state
      phases.push(marsArcadeActiveMove(current.fighters[0])?.phase ?? 'none')
    }
    expect(phases.filter((phase) => phase === 'startup')).toHaveLength(move.startupFrames)
    expect(phases.filter((phase) => phase === 'active')).toHaveLength(move.activeFrames)
    expect(phases.indexOf('active')).toBe(move.startupFrames)
    expect(phases[phases.length - 1]).toBe('none')
  })

  it('counts the remaining frames down to zero', () => {
    const state = placedAtWall(startedRound(), 90)
    const started = pump(state, 2, [hold('heavy'), neutral()])
    const active = marsArcadeActiveMove(started.state.fighters[0])
    expect(active).not.toBeNull()
    expect(active?.framesRemaining).toBe((active?.totalFrames ?? 0) - (active?.frame ?? 0))
  })

  it('follows the landing window when it lengthens recovery', () => {
    const cost = MARS_ARCADE_FIGHTERS.booster.moves.special.meterCost
    const state = placedAtWall(startedRound(), 90, cost)
    const tipped = pumpWith(state, 40, (frame) =>
      frame === 1 ? [hold('special'), neutral()] : neutralPair(),
    )
    const active = marsArcadeActiveMove(tipped.state.fighters[0])
    const move = MARS_ARCADE_FIGHTERS.booster.moves.special
    const baseTotal = move.startupFrames + move.activeFrames + move.recoveryFrames
    expect(active?.totalFrames).toBeGreaterThan(baseTotal)
  })
})

describe('the fixed step', () => {
  it('clamps a long frame instead of simulating the whole gap', () => {
    const state = startedRound()
    const transition = advanceMarsArcade(state, neutralPair(), 5)
    const advanced = transition.state.frame - state.frame
    expect(advanced).toBeGreaterThanOrEqual(14)
    expect(advanced).toBeLessThanOrEqual(15)
  })

  it('carries a partial frame rather than dropping it', () => {
    const state = startedRound()
    const half = advanceMarsArcade(state, neutralPair(), MARS_ARCADE_TIMING.frameSeconds / 2)
    expect(half.state.frame).toBe(state.frame)
    const rest = advanceMarsArcade(half.state, neutralPair(), MARS_ARCADE_TIMING.frameSeconds / 2)
    expect(rest.state.frame).toBe(state.frame + 1)
  })

  it('replays identically for identical inputs', () => {
    const script = (frame: number): InputPair => [
      frame % 30 === 1 ? hold('heavy') : { ...neutral(), move: 1 },
      frame % 17 === 1 ? hold('special') : { ...neutral(), move: -1 },
    ]
    const first = pumpWith(startedRound(), 400, script)
    const second = pumpWith(startedRound(), 400, script)
    expect(first.state).toEqual(second.state)
    expect(first.events).toEqual(second.events)
  })
})
