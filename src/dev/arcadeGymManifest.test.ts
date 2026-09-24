import { describe, expect, it } from 'vitest'
import { createMarsArcadeRound, marsArcadeActiveMove } from '../game/marsArcade'
import { marsArcadeAnimationKey, marsArcadeMoveById } from '../game/marsArcadeAnimations'
import { marsArcadeFighter, type MarsArcadeButton } from '../game/marsArcadeFighters'
import { ARCADE_ANIMATIONS, ARCADE_SPRITE_SOURCES, arcadeClip, selectArcadeSprite } from './arcadeHarnessSprites'

/** What the harness actually draws across one move, with consecutive repeats collapsed. */
function played(fighter: 'booster' | 'oracle', button: MarsArcadeButton) {
  const state = createMarsArcadeRound(fighter, fighter === 'booster' ? 'oracle' : 'booster')
  state.phase = 'fight'
  const move = marsArcadeFighter(fighter).moves[button]
  const total = move.startupFrames + move.activeFrames + move.recoveryFrames
  const result: { src: string; phase: string }[] = []
  for (let moveFrame = 0; moveFrame < total; moveFrame += 1) {
    Object.assign(state.fighters[0], { activity: 'attack', activeButton: button, moveFrame })
    const src = selectArcadeSprite(state, 0, false).src
    const phase = marsArcadeActiveMove(state.fighters[0])!.phase
    if (result.at(-1)?.src !== src) result.push({ src, phase })
  }
  return result
}

describe('the animation table is what the harness plays', () => {
  it('preloads exactly the drawings the table references, once each', () => {
    const referenced = new Set(ARCADE_ANIMATIONS.animations.flatMap((entry) => entry.frames.map((frame) => frame.src)))
    expect(new Set(ARCADE_SPRITE_SOURCES)).toEqual(referenced)
    expect(new Set(ARCADE_SPRITE_SOURCES).size).toBe(ARCADE_SPRITE_SOURCES.length)
  })

  it('has one clip per fighter and animation', () => {
    const keys = ARCADE_ANIMATIONS.animations.map((entry) => marsArcadeAnimationKey(entry.fighter, entry.animation))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('names only moves the fighter actually has', () => {
    for (const entry of ARCADE_ANIMATIONS.animations) {
      if (!entry.moveId) continue
      const moves = Object.values(marsArcadeFighter(entry.fighter).moves).map((move) => move.id)
      expect(moves, marsArcadeAnimationKey(entry.fighter, entry.animation)).toContain(entry.moveId)
    }
  })

  it.each([
    ['booster', 'light'], ['booster', 'heavy'], ['booster', 'special'],
    ['oracle', 'light'], ['oracle', 'heavy'],
  ] as const)('plays %s %s in the table order, on the table holds', (fighter, button) => {
    const move = marsArcadeFighter(fighter).moves[button]
    const clip = ARCADE_ANIMATIONS.animations.find((entry) => entry.fighter === fighter && entry.moveId === move.id)
    expect(clip, `${fighter} has no clip for ${move.id}`).toBeDefined()
    // Consecutive frames that reuse a drawing collapse in what is played, so the
    // expectation collapses the same way.
    const expected: { src: string; phase: string }[] = []
    for (const frame of clip!.frames) {
      if (expected.at(-1)?.src !== frame.src) expected.push({ src: frame.src, phase: frame.phase })
    }
    expect(played(fighter, button)).toEqual(expected)
  })

  it('plays the held drawing for exactly its hold', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    state.phase = 'fight'
    const heavy = arcadeClip('booster', 'heavy')!
    const move = marsArcadeMoveById(heavy.moveId!)!
    let moveFrame = 0
    for (const frame of heavy.frames) {
      for (let held = 0; held < frame.hold; held += 1) {
        Object.assign(state.fighters[0], { activity: 'attack', activeButton: 'heavy', moveFrame })
        expect(selectArcadeSprite(state, 0, false).src, `move frame ${moveFrame}`).toBe(frame.src)
        moveFrame += 1
      }
    }
    expect(moveFrame).toBe(move.startupFrames + move.activeFrames + move.recoveryFrames)
  })
})
