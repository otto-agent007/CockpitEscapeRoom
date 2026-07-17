import { describe, expect, it } from 'vitest'
import { INTRO_DURATION_SECONDS, getIntroCue, introCues } from './introConfig'

describe('intro timeline', () => {
  it('defines the approved 53-second cue sequence', () => {
    expect(INTRO_DURATION_SECONDS).toBe(53)
    expect(introCues.map((cue) => cue.startSeconds)).toEqual([0, 4, 16, 27, 38, 49])
    expect(introCues.map((cue) => cue.id)).toEqual(['boot', 'dc9', 'key', 'hat', 'airbus', 'title'])
  })

  it('selects cues at their exact boundaries', () => {
    expect(getIntroCue(0).id).toBe('boot')
    expect(getIntroCue(15.999).id).toBe('dc9')
    expect(getIntroCue(16).id).toBe('key')
    expect(getIntroCue(52.999).id).toBe('title')
  })

  it('clamps invalid or negative time to the boot cue', () => {
    expect(getIntroCue(-1).id).toBe('boot')
    expect(getIntroCue(Number.NaN).id).toBe('boot')
  })

  it('contains no protected reward spoiler', () => {
    expect(JSON.stringify(introCues)).not.toMatch(/tesla|model y|flight mode|mars/i)
  })
})
