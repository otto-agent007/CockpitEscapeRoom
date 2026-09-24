import { describe, expect, it } from 'vitest'
import { createMarsArcadeRound, marsArcadeActiveMove } from '../game/marsArcade'
import { marsArcadeBoundsKey, parseMarsArcadeBounds } from '../game/marsArcadeBounds'
import rawBounds from '../game/marsArcadeBounds.json'
import { marsArcadeFighter } from '../game/marsArcadeFighters'
import { ARCADE_GYM_ANIMATIONS, ARCADE_SPRITE_SOURCES, selectArcadeSprite } from './arcadeHarnessSprites'

const gymSources = new Set(ARCADE_GYM_ANIMATIONS.flatMap((entry) => entry.frames.map((frame) => frame.src)))
const gymKeys = ARCADE_GYM_ANIMATIONS.map((entry) => marsArcadeBoundsKey(entry.fighter, entry.animation))

/** What the harness actually draws across one heavy, with consecutive repeats collapsed. */
function playedHeavy(fighter: 'booster' | 'oracle') {
  const state = createMarsArcadeRound(fighter, fighter === 'booster' ? 'oracle' : 'booster')
  state.phase = 'fight'
  const move = marsArcadeFighter(fighter).moves.heavy
  const total = move.startupFrames + move.activeFrames + move.recoveryFrames
  const played: { src: string; phase: string }[] = []
  for (let moveFrame = 0; moveFrame < total; moveFrame += 1) {
    Object.assign(state.fighters[0], { activity: 'attack', activeButton: 'heavy', moveFrame })
    const src = selectArcadeSprite(state, 0, false).src
    const phase = marsArcadeActiveMove(state.fighters[0])!.phase
    if (played.at(-1)?.src !== src) played.push({ src, phase })
  }
  return played
}

describe('character gym animation manifest', () => {
  it('shows every sprite the harness can draw, so a newly wired pose cannot skip the gym', () => {
    const missing = ARCADE_SPRITE_SOURCES.filter((src) => !gymSources.has(src))
    expect(missing).toEqual([])
  })

  it('shows only sprites the harness preloads', () => {
    expect([...gymSources].filter((src) => !ARCADE_SPRITE_SOURCES.includes(src))).toEqual([])
  })

  it('has one entry per fighter and animation', () => {
    expect(new Set(gymKeys).size).toBe(gymKeys.length)
  })

  it('carries every animation already in the bounds file', () => {
    const bounds = parseMarsArcadeBounds(rawBounds)
    for (const entry of bounds.animations) {
      expect(gymKeys).toContain(marsArcadeBoundsKey(entry.fighter, entry.animation))
    }
  })

  // The gym pairs saved boxes with poses by position, so inserting a pose into an
  // animation shifts every later box onto the wrong drawing — an attack box on a
  // startup pose. Phases differ between those poses, which is what makes it visible.
  it('keeps every saved frame on a pose with the same phase', () => {
    const bounds = parseMarsArcadeBounds(rawBounds)
    for (const entry of bounds.animations) {
      const gym = ARCADE_GYM_ANIMATIONS.find((candidate) => candidate.fighter === entry.fighter && candidate.animation === entry.animation)
      const key = marsArcadeBoundsKey(entry.fighter, entry.animation)
      expect(entry.frames.length, key).toBeLessThanOrEqual(gym!.frames.length)
      expect(entry.frames.map((frame) => frame.phase), key).toEqual(gym!.frames.slice(0, entry.frames.length).map((frame) => frame.phase))
    }
  })

  it('names only moves the fighter actually has', () => {
    for (const entry of ARCADE_GYM_ANIMATIONS) {
      if (!entry.moveId) continue
      const moves = Object.values(marsArcadeFighter(entry.fighter).moves).map((move) => move.id)
      expect(moves).toContain(entry.moveId)
    }
  })

  it.each(['booster', 'oracle'] as const)('lists %s heavy in the order and phases the harness plays it', (fighter) => {
    const entry = ARCADE_GYM_ANIMATIONS.find((candidate) => candidate.fighter === fighter && candidate.animation === 'heavy')
    expect(entry?.frames.map(({ src, phase }) => ({ src, phase }))).toEqual(playedHeavy(fighter))
  })
})
