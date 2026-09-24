import { describe, expect, it } from 'vitest'

import {
  MARS_ARCADE_CELL,
  marsArcadeBoxToStage,
  marsArcadeBoxesOverlap,
  marsArcadeGuardCovers,
  type MarsArcadeBox,
} from './marsArcadeBounds'

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
  it('connects only when the boxes actually meet', () => {
    const attack = marsArcadeBoxToStage({ x: 85, y: 68, width: 20, height: 12 }, 0, 1)
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
})
