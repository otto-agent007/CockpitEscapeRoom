import { describe, expect, it } from 'vitest'

import raw from './marsArcadeBounds.json'
import {
  MARS_ARCADE_CELL,
  marsArcadeAttackBox,
  marsArcadeBoundsIndex,
  marsArcadeBoxToStage,
  marsArcadeBoxesOverlap,
  marsArcadeGuardCovers,
  parseMarsArcadeBounds,
  type MarsArcadeBox,
} from './marsArcadeBounds'
import { marsArcadeFighter, type MarsArcadeButton, type MarsArcadeFighterId } from './marsArcadeFighters'

const file = parseMarsArcadeBounds(raw)
const index = marsArcadeBoundsIndex(file)

function moveById(id: string) {
  for (const fighter of ['booster', 'oracle', 'captain'] as MarsArcadeFighterId[]) {
    const content = marsArcadeFighter(fighter)
    for (const button of ['light', 'heavy', 'special'] as MarsArcadeButton[]) {
      if (content.moves[button].id === id) return content.moves[button]
    }
  }
  return null
}

describe('mars arcade bounds file', () => {
  it('parses, and every entry is unique', () => {
    expect(file.animations.length).toBeGreaterThan(0)
    expect(index.size).toBe(file.animations.length)
  })

  it('rejects a box that escapes the sprite cell', () => {
    const escaping = {
      version: 1,
      animations: [{
        fighter: 'booster', animation: 'bad',
        frames: [{ phase: 'neutral', hit: { x: 120, y: 0, width: 40, height: 10 } }],
      }],
    }
    expect(() => parseMarsArcadeBounds(escaping)).toThrow(/invalid hit box/)
  })

  it('rejects NaN rather than letting it become a hitbox that never connects', () => {
    // A NaN box overlaps nothing, so the move would simply stop working and read as
    // a balance bug. The gym writes this file from a browser, so it is untrusted.
    const nan = {
      version: 1,
      animations: [{
        fighter: 'booster', animation: 'bad',
        frames: [{ phase: 'active', attack: { x: Number.NaN, y: 0, width: 10, height: 10 } }],
      }],
    }
    expect(() => parseMarsArcadeBounds(nan)).toThrow(/invalid attack box/)
  })

  it('refuses an attack box on a frame that is not active', () => {
    const early = {
      version: 1,
      animations: [{
        fighter: 'booster', animation: 'bad',
        frames: [{ phase: 'startup', attack: { x: 80, y: 60, width: 10, height: 10 } }],
      }],
    }
    expect(() => parseMarsArcadeBounds(early)).toThrow(/attack box on a startup frame/)
  })

  it('refuses a file from a different schema version', () => {
    expect(() => parseMarsArcadeBounds({ version: 99, animations: [] })).toThrow(/version 99/)
  })
})

describe('attack boxes agree with the frame data the engine uses', () => {
  it('reaches exactly as far as the move says it does', () => {
    // This is the whole point of the schema. `reach` is a bare number in
    // marsArcadeFighters.ts with no tie to the drawing, so the arm and the hitbox
    // could disagree forever. Here they cannot.
    for (const entry of file.animations) {
      if (!entry.moveId) continue
      const move = moveById(entry.moveId)
      expect(move, `${entry.moveId} is not a move any fighter has`).not.toBeNull()
      const active = entry.frames.filter((frame) => marsArcadeAttackBox(frame))
      expect(active.length, `${entry.animation} has no active frame`).toBeGreaterThan(0)
      for (const frame of active) {
        const box = marsArcadeAttackBox(frame) as MarsArcadeBox
        const stage = marsArcadeBoxToStage(box, 0, 1)
        expect(stage.maxX).toBe(move?.reach)
      }
    }
  })

  it('never puts a hitbox on a move with no reach', () => {
    for (const entry of file.animations) {
      const move = entry.moveId ? moveById(entry.moveId) : null
      if (!move || move.reach > 0) continue
      expect(entry.frames.every((frame) => marsArcadeAttackBox(frame) === null)).toBe(true)
    }
  })

  it('keeps the feet on the contract baseline', () => {
    // A collision box floating above the baseline is how a fighter ends up standing
    // in the air; one that runs past it is how they sink into the deck.
    for (const entry of file.animations) {
      for (const frame of entry.frames) {
        if (!frame.collision) continue
        expect(frame.collision.y + frame.collision.height).toBe(MARS_ARCADE_CELL.baselineRow)
      }
    }
  })
})

describe('cell space to stage space', () => {
  const box: MarsArcadeBox = { x: 85, y: 68, width: 20, height: 12 }

  it('mirrors about the pivot rather than storing both facings', () => {
    const right = marsArcadeBoxToStage(box, 0, 1)
    const left = marsArcadeBoxToStage(box, 0, -1)
    expect(right.maxX).toBe(41)
    expect(left.minX).toBe(-41)
    expect(right.maxX - right.minX).toBe(left.maxX - left.minX)
    expect(right.minY).toBe(left.minY)
  })

  it('measures height upward from the floor, like the fight loop', () => {
    const stage = marsArcadeBoxToStage(box, 0, 1)
    expect(stage.maxY).toBe(MARS_ARCADE_CELL.baselineRow - box.y)
    expect(stage.minY).toBe(MARS_ARCADE_CELL.baselineRow - (box.y + box.height))
    expect(stage.maxY).toBeGreaterThan(stage.minY)
  })

  it('carries the fighter position and airborne height', () => {
    const grounded = marsArcadeBoxToStage(box, 30, 1)
    const airborne = marsArcadeBoxToStage(box, 30, 1, 20)
    expect(grounded.minX).toBe(marsArcadeBoxToStage(box, 0, 1).minX + 30)
    expect(airborne.minY).toBe(grounded.minY + 20)
  })
})

describe('overlap and guard coverage', () => {
  const attacker = { x: 0, facing: 1 as const }

  it('connects only when the boxes actually meet', () => {
    const attack = marsArcadeBoxToStage({ x: 85, y: 68, width: 20, height: 12 }, attacker.x, attacker.facing)
    const near = marsArcadeBoxToStage({ x: 48, y: 14, width: 32, height: 105 }, 50, -1)
    const far = marsArcadeBoxToStage({ x: 48, y: 14, width: 32, height: 105 }, 140, -1)
    expect(marsArcadeBoxesOverlap(attack, near)).toBe(true)
    expect(marsArcadeBoxesOverlap(attack, far)).toBe(false)
  })

  it('reaches FURTHER than the engine distance check, which is why the switch is a balance change', () => {
    // Worth pinning, because it is the trap waiting for whoever wires these boxes
    // into `collectMeleeHits`. The engine compares |defender.x - attacker.x| against
    // `reach`, so the jab connects at a separation of at most 41. Box overlap also
    // counts the DEFENDER's hurtbox, which extends 16 px toward the attacker from
    // their origin, so the same drawing connects out to 57. Swapping one for the
    // other silently lengthens every move by the opponent's half-width.
    const attack = marsArcadeBoxToStage({ x: 85, y: 68, width: 20, height: 12 }, 0, 1)
    const hurt = { x: 48, y: 14, width: 32, height: 105 }
    const reachOfMove = 41
    let furthest = 0
    for (let separation = 0; separation <= 120; separation += 1) {
      if (marsArcadeBoxesOverlap(attack, marsArcadeBoxToStage(hurt, separation, -1))) {
        furthest = separation
      }
    }
    expect(furthest).toBeGreaterThan(reachOfMove)
    expect(furthest).toBe(56)
  })

  it('lets a high attack beat a low guard, which one blocking boolean cannot', () => {
    const high = marsArcadeBoxToStage({ x: 85, y: 30, width: 20, height: 12 }, 0, 1)
    const low = marsArcadeBoxToStage({ x: 85, y: 96, width: 20, height: 12 }, 0, 1)
    const highGuard = marsArcadeBoxToStage({ x: 64, y: 28, width: 20, height: 30 }, 60, -1)
    const lowGuard = marsArcadeBoxToStage({ x: 64, y: 86, width: 20, height: 30 }, 60, -1)

    expect(marsArcadeGuardCovers(high, highGuard)).toBe(true)
    expect(marsArcadeGuardCovers(high, lowGuard)).toBe(false)
    expect(marsArcadeGuardCovers(low, lowGuard)).toBe(true)
    expect(marsArcadeGuardCovers(low, highGuard)).toBe(false)
  })

  it('every authored block frame actually carries a guard box', () => {
    for (const entry of file.animations) {
      if (entry.animation !== 'block') continue
      expect(entry.frames.every((frame) => frame.guard !== undefined)).toBe(true)
    }
  })
})
