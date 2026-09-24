import { describe, expect, it } from 'vitest'

import raw from './marsArcadeAnimations.json'
import {
  MARS_ARCADE_ANIMATIONS_VERSION,
  MARS_ARCADE_REACH_TOLERANCE_PX,
  marsArcadeAnimationErrors,
  marsArcadeAnimationKey,
  marsArcadeAnimationsIndex,
  marsArcadeAttackReach,
  marsArcadeDrawingAt,
  marsArcadeFrameAt,
  marsArcadeMoveById,
  parseMarsArcadeAnimations,
  validateMarsArcadeAnimations,
  type MarsArcadeAnimation,
  type MarsArcadeAnimationsFile,
} from './marsArcadeAnimations'
import { MARS_ARCADE_CELL } from './marsArcadeBounds'
import { marsArcadeFighter, type MarsArcadeFighterId } from './marsArcadeFighters'

const file = parseMarsArcadeAnimations(raw)
const index = marsArcadeAnimationsIndex(file)
const clip = (fighter: MarsArcadeFighterId, animation: string): MarsArcadeAnimation => {
  const found = index.get(marsArcadeAnimationKey(fighter, animation))
  if (!found) throw new Error(`no clip ${fighter}:${animation}`)
  return found
}

/** A fresh copy of the shipped file to mutate in a test. */
const copy = (): MarsArcadeAnimationsFile => structuredClone(file)
const rulesOf = (mutated: MarsArcadeAnimationsFile) =>
  marsArcadeAnimationErrors(validateMarsArcadeAnimations(mutated)).map((finding) => finding.rule)

describe('the shipped animation table', () => {
  it('parses, has one entry per fighter and animation, and passes every rule', () => {
    expect(file.version).toBe(MARS_ARCADE_ANIMATIONS_VERSION)
    expect(index.size).toBe(file.animations.length)
    const errors = marsArcadeAnimationErrors(validateMarsArcadeAnimations(file))
    expect(errors.map((finding) => `${finding.key} ${finding.rule}: ${finding.message}`)).toEqual([])
  })

  it('has a clip for every fighter state the harness plays', () => {
    for (const fighter of ['booster', 'oracle'] as const) {
      for (const animation of ['idle', 'walk-forward', 'walk-back', 'block', 'heavy-block', 'hit', 'jump', 'victory', 'knockout']) {
        expect(index.has(marsArcadeAnimationKey(fighter, animation)), `${fighter}:${animation}`).toBe(true)
      }
    }
    expect(index.has('captain:idle')).toBe(true)
  })

  it('holds every move clip for exactly the frames the rules give the move', () => {
    // This is what lets the gym play real timing: the table and the frame data cannot
    // drift apart, because the validator is what the tests run.
    for (const entry of file.animations) {
      if (!entry.moveId) continue
      const move = marsArcadeMoveById(entry.moveId)!
      const held = { startup: 0, active: 0, recovery: 0, neutral: 0 }
      for (const frame of entry.frames) held[frame.phase] += frame.hold
      expect(held, entry.moveId).toEqual({
        startup: move.startupFrames, active: move.activeFrames, recovery: move.recoveryFrames, neutral: 0,
      })
    }
  })

  it('puts the drawn strike on the move reach, within the contract tolerance, unless an exception is recorded', () => {
    for (const entry of file.animations) {
      if (!entry.moveId) continue
      const move = marsArcadeMoveById(entry.moveId)!
      if (move.reach === 0 || move.lockOn || move.projectile) continue
      const reaches = entry.frames.map(marsArcadeAttackReach).filter((reach): reach is number => reach !== null)
      expect(reaches.length, `${entry.moveId} has no live hitbox`).toBeGreaterThan(0)
      const miss = Math.abs(Math.max(...reaches) - move.reach)
      if (entry.reachException) expect(entry.reachException.length).toBeGreaterThan(0)
      else expect(miss, entry.moveId).toBeLessThanOrEqual(MARS_ARCADE_REACH_TOLERANCE_PX)
    }
  })

  it('keeps the owner-authored v1 boxes exactly, so the migration lost nothing', () => {
    // Pinned from src/game/marsArcadeBounds.json as it was before the v2 table.
    const jab = clip('booster', 'jab')
    expect(jab.frames.map((frame) => frame.pose)).toEqual(['anticipation', 'jab', 'recovery', 'reset'])
    expect(jab.frames[1]!.attack).toEqual([{ x: 85, y: 35, width: 20, height: 10 }])
    expect(jab.frames[0]!.collision).toEqual({ x: 44, y: 15, width: 35, height: 104 })
    expect(jab.frames[1]!.hurt).toEqual([{ x: 38, y: 15, width: 68, height: 104 }])
    const heavy = clip('oracle', 'heavy')
    expect(heavy.frames.map((frame) => frame.pose)).toEqual(['wind-up', 'sweep', 'contact', 'rise', 'settle'])
    expect(heavy.frames[2]!.attack).toEqual([{ x: 84, y: 96, width: 20, height: 13 }])
    expect(marsArcadeAttackReach(heavy.frames[2]!)).toBe(marsArcadeFighter('oracle').moves.heavy.reach)
    expect(clip('booster', 'block').frames[0]!.guard).toBeDefined()
    expect(clip('oracle', 'block').frames[0]!.guard).toBeDefined()
  })

  it('is honest about which boxes are machine-seeded', () => {
    const warnings = validateMarsArcadeAnimations(file).filter((finding) => finding.rule === 'unreviewed')
    const unreviewed = file.animations.filter((entry) => !entry.reviewed)
    expect(warnings.map((finding) => finding.key).sort()).toEqual(
      unreviewed.map((entry) => marsArcadeAnimationKey(entry.fighter, entry.animation)).sort(),
    )
  })
})

describe('playback arithmetic', () => {
  it('walks a loop on simulation time and wraps', () => {
    const walk = clip('booster', 'walk-forward')
    expect(marsArcadeFrameAt(walk, 0).index).toBe(0)
    expect(marsArcadeFrameAt(walk, 6).index).toBe(1)
    expect(marsArcadeFrameAt(walk, 23).index).toBe(3)
    expect(marsArcadeFrameAt(walk, 24).index).toBe(0)
    expect(marsArcadeFrameAt(walk, -1).index).toBe(3)
  })

  it('holds the last drawing of a once or hold-last clip', () => {
    const victory = clip('booster', 'victory')
    expect(marsArcadeFrameAt(victory, 11).index).toBe(0)
    expect(marsArcadeFrameAt(victory, 12).index).toBe(1)
    expect(marsArcadeFrameAt(victory, 999).index).toBe(2)
  })

  it('never returns a drawing from another phase, whatever the holds say', () => {
    const heavy = clip('booster', 'heavy')
    const move = marsArcadeFighter('booster').moves.heavy
    for (let frame = 0; frame < move.startupFrames; frame += 1) {
      expect(marsArcadeDrawingAt(heavy, 'startup', frame)!.frame.phase).toBe('startup')
    }
    for (let frame = 0; frame < move.activeFrames + 20; frame += 1) {
      expect(marsArcadeDrawingAt(heavy, 'active', frame)!.frame.phase).toBe('active')
    }
    expect(marsArcadeDrawingAt(heavy, 'startup', 0)!.frame.pose).toBe('startup')
    expect(marsArcadeDrawingAt(heavy, 'startup', 5)!.frame.pose).toBe('swing')
    expect(marsArcadeDrawingAt(heavy, 'startup', 8)!.frame.pose).toBe('drive')
    expect(marsArcadeDrawingAt(heavy, 'recovery', 0)!.frame.pose).toBe('retract')
    expect(marsArcadeDrawingAt(heavy, 'recovery', 17)!.frame.pose).toBe('guard')
    expect(marsArcadeDrawingAt(heavy, 'neutral', 0)).toBeNull()
  })
})

describe('parsing refuses what the gym must never write', () => {
  const base = (frame: Record<string, unknown>) => ({
    version: 2,
    animations: [{ fighter: 'booster', animation: 'bad', loop: 'once', reviewed: false, frames: [{
      src: '/art-source/arcade/booster/x.png', pose: 'p', phase: 'active', hold: 1, ...frame,
    }] }],
  })

  it('rejects a box that escapes the sprite cell', () => {
    expect(() => parseMarsArcadeAnimations(base({ hurt: [{ x: 120, y: 0, width: 40, height: 10 }] }))).toThrow(/hurt\[0\] is an invalid box/)
  })

  it('rejects NaN and fractional pixels rather than letting them become a hitbox that never connects', () => {
    expect(() => parseMarsArcadeAnimations(base({ attack: [{ x: Number.NaN, y: 0, width: 10, height: 10 }] }))).toThrow(/attack\[0\] is an invalid box/)
    expect(() => parseMarsArcadeAnimations(base({ attack: [{ x: 1.5, y: 0, width: 10, height: 10 }] }))).toThrow(/attack\[0\] is an invalid box/)
  })

  it('refuses an attack box on a frame that is not active', () => {
    expect(() => parseMarsArcadeAnimations(base({ phase: 'startup', attack: [{ x: 80, y: 60, width: 10, height: 10 }] }))).toThrow(/attack box on a startup frame/)
  })

  it('refuses a hold under one frame, a drawing outside art-source, an unknown loop and an old version', () => {
    expect(() => parseMarsArcadeAnimations(base({ hold: 0 }))).toThrow(/hold/)
    expect(() => parseMarsArcadeAnimations(base({ src: '/public/x.png' }))).toThrow(/art-source/)
    const loop = base({})
    loop.animations[0]!.loop = 'bounce'
    expect(() => parseMarsArcadeAnimations(loop)).toThrow(/loop bounce/)
    expect(() => parseMarsArcadeAnimations({ version: 1, animations: [] })).toThrow(/version 1/)
  })
})

describe('the validator catches each rule when it is broken', () => {
  it('a move clip whose holds do not add up to the frame data', () => {
    const mutated = copy()
    const jab = mutated.animations.find((entry) => entry.moveId === 'booster.padJab')!
    jab.frames[0]!.hold += 1
    expect(rulesOf(mutated)).toContain('hold-sum')
  })

  it('an active pose with no hitbox on a striking move', () => {
    const mutated = copy()
    const jab = mutated.animations.find((entry) => entry.moveId === 'booster.padJab')!
    delete jab.frames[1]!.attack
    expect(rulesOf(mutated)).toContain('active-without-attack')
  })

  it('a hitbox that misses the reach by more than the tolerance', () => {
    const mutated = copy()
    const jab = mutated.animations.find((entry) => entry.moveId === 'booster.padJab')!
    jab.frames[1]!.attack![0]!.x -= MARS_ARCADE_REACH_TOLERANCE_PX + 1
    expect(rulesOf(mutated)).toContain('reach')
    jab.reachException = 'testing'
    expect(rulesOf(mutated)).not.toContain('reach')
    expect(validateMarsArcadeAnimations(mutated).some((finding) => finding.rule === 'reach-exception')).toBe(true)
  })

  it('a body box that leaves the baseline', () => {
    const mutated = copy()
    mutated.animations[0]!.frames[0]!.collision!.height -= 1
    expect(rulesOf(mutated)).toContain('collision-baseline')
  })

  it('a hitbox on a clip that illustrates no move, or a move that does not strike', () => {
    const mutated = copy()
    const idle = mutated.animations.find((entry) => entry.animation === 'idle')!
    idle.frames[0]!.phase = 'active'
    idle.frames[0]!.attack = [{ x: 80, y: 60, width: 10, height: 10 }]
    expect(rulesOf(mutated)).toContain('attack-without-move')
    const laser = copy()
    const special = laser.animations.find((entry) => entry.moveId === 'booster.spaceLaser')!
    special.frames[0]!.attack = [{ x: 80, y: 60, width: 10, height: 10 }]
    expect(rulesOf(laser)).toContain('attack-without-reach')
  })

  it('a block pose without a guard box, a looping move clip, and a move from another fighter', () => {
    const mutated = copy()
    const block = mutated.animations.find((entry) => entry.animation === 'block')!
    delete block.frames[0]!.guard
    expect(rulesOf(mutated)).toContain('block-without-guard')
    const heavy = mutated.animations.find((entry) => entry.moveId === 'oracle.hardCutoff')!
    heavy.loop = 'loop'
    expect(rulesOf(mutated)).toContain('move-loop')
    heavy.moveId = 'booster.staticFire'
    expect(rulesOf(mutated)).toContain('foreign-move')
    heavy.moveId = 'nobody.nothing'
    expect(rulesOf(mutated)).toContain('unknown-move')
  })

  it('reports a frame with no boxes as a warning, not an error', () => {
    const mutated = copy()
    const frame = mutated.animations[0]!.frames[0]!
    delete frame.collision
    delete frame.hurt
    const findings = validateMarsArcadeAnimations(mutated).filter((finding) => finding.rule === 'missing-boxes')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings.every((finding) => finding.severity === 'warning')).toBe(true)
  })
})

describe('cell contract', () => {
  it('measures the baseline the boxes are authored against', () => {
    expect(MARS_ARCADE_CELL.baselineRow).toBe(119)
    for (const entry of file.animations) {
      for (const frame of entry.frames) {
        if (frame.collision) expect(frame.collision.y + frame.collision.height).toBe(MARS_ARCADE_CELL.baselineRow)
      }
    }
  })
})
