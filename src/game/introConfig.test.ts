import { describe, expect, it } from 'vitest'
import {
  INTRO_DURATION_SECONDS,
  INTRO_PRELOAD_PATHS,
  getIntroCue,
  introCues,
} from './introConfig'

const packagePrefix = 'images/intro/tmb2/'
describe('intro timeline', () => {
  it('defines the approved 53-second eight-beat chase', () => {
    expect(INTRO_DURATION_SECONDS).toBe(53)
    expect(introCues.map((cue) => cue.startSeconds)).toEqual([0, 4, 11, 19, 27, 35, 43, 49])
    expect(introCues.map((cue) => cue.id)).toEqual([
      'boot',
      'duffel',
      'runway',
      'ballpark',
      'finance',
      'clouds',
      'catch',
      'title',
    ])
    expect(introCues.map((cue) => cue.caption)).toEqual([
      'TMB2',
      'THE OVERSIZED DUFFEL',
      'RUNWAY CHASE',
      'BALLPARK DETOUR',
      'BULL MARKET LAUNCH',
      'CLOUD CHASE',
      'THE CATCH',
      'MISSION READY',
    ])
  })

  it('selects cues at their exact boundaries', () => {
    expect(getIntroCue(0).id).toBe('boot')
    expect(getIntroCue(10.999).id).toBe('duffel')
    expect(getIntroCue(11).id).toBe('runway')
    expect(getIntroCue(18.999).id).toBe('runway')
    expect(getIntroCue(19).id).toBe('ballpark')
    expect(getIntroCue(52.999).id).toBe('title')
  })

  it('binds every chase scene to the recovered runtime package', () => {
    expect(introCues.slice(1, 7).every((cue) => cue.background?.startsWith(packagePrefix))).toBe(true)
    expect(introCues.slice(1, 7).every((cue) => cue.poptClip?.startsWith(packagePrefix))).toBe(true)
    expect(introCues.slice(1, 7).every((cue) => cue.keyClip?.startsWith(packagePrefix))).toBe(true)
    expect(introCues.every((cue) => typeof cue.summary === 'string' && cue.summary.length > 0)).toBe(true)

    expect(INTRO_PRELOAD_PATHS.every((path) => path.startsWith(packagePrefix))).toBe(true)
  })

  it('preloads every unique timeline visual exactly once', () => {
    const cueVisuals = introCues.flatMap((cue) => [
      cue.background,
      cue.poptClip,
      cue.keyClip,
      cue.fallbackImage,
    ]).filter((path): path is string => Boolean(path))
    const expected = [...new Set(cueVisuals)]

    expect(INTRO_PRELOAD_PATHS).toEqual(expected)
    expect(new Set(INTRO_PRELOAD_PATHS).size).toBe(INTRO_PRELOAD_PATHS.length)
  })

  it('clamps invalid or negative time to the boot cue', () => {
    expect(getIntroCue(-1).id).toBe('boot')
    expect(getIntroCue(Number.NaN).id).toBe('boot')
  })

  it('contains no protected reward spoiler', () => {
    expect(JSON.stringify({ introCues, preload: INTRO_PRELOAD_PATHS })).not.toMatch(/tesla|model y|flight mode|mars/i)
  })
})
