import { describe, expect, it } from 'vitest'
import {
  INTRO_DURATION_SECONDS,
  START_AVAILABLE_SECONDS,
  getIntroScene,
  introScenes,
} from './introConfig'

describe('TMB2 intro timeline', () => {
  it('freezes the approved 53.04-second scene order', () => {
    expect(INTRO_DURATION_SECONDS).toBe(53.04)
    expect(START_AVAILABLE_SECONDS).toBe(6)
    expect(introScenes.map(({ id, startSeconds, endSeconds }) => ({ id, startSeconds, endSeconds }))).toEqual([
      { id: 'tmb2-ident', startSeconds: 0, endSeconds: 6 },
      { id: 'duffel', startSeconds: 6, endSeconds: 12 },
      { id: 'key-escape', startSeconds: 12, endSeconds: 16 },
      { id: 'runway', startSeconds: 16, endSeconds: 22 },
      { id: 'ballpark', startSeconds: 22, endSeconds: 28 },
      { id: 'city-finance', startSeconds: 28, endSeconds: 35 },
      { id: 'sky', startSeconds: 35, endSeconds: 42 },
      { id: 'final-pursuit', startSeconds: 42, endSeconds: 48 },
      { id: 'catch', startSeconds: 48, endSeconds: 51 },
      { id: 'loop-reset', startSeconds: 51, endSeconds: 53.04 },
    ])
  })

  it('selects half-open scene boundaries deterministically', () => {
    expect(getIntroScene(-1).id).toBe('tmb2-ident')
    expect(getIntroScene(5.999).id).toBe('tmb2-ident')
    expect(getIntroScene(6).id).toBe('duffel')
    expect(getIntroScene(52.999).id).toBe('loop-reset')
    expect(getIntroScene(53.04).id).toBe('tmb2-ident')
    expect(getIntroScene(Number.NaN).id).toBe('tmb2-ident')
  })

  it('has contiguous coverage and no protected reward spoiler', () => {
    introScenes.forEach((scene, index) => {
      if (index > 0) expect(scene.startSeconds).toBe(introScenes[index - 1]!.endSeconds)
    })
    expect(JSON.stringify(introScenes)).not.toMatch(/tesla|model y|flight mode|mars/i)
  })
})
