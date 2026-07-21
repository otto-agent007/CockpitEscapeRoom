import { describe, expect, it } from 'vitest'
import {
  INTRO_AUDIO_FADE_SECONDS,
  INTRO_DURATION_SECONDS,
  INTRO_HANDOFF_SECONDS,
  START_AVAILABLE_SECONDS,
  getIntroScene,
  introScenes,
  normalizeIntroTime,
} from './introConfig'

describe('TMB2 cinematic timeline', () => {
  it('defines the exact approved 53.04-second sequence', () => {
    expect(INTRO_DURATION_SECONDS).toBe(53.04)
    expect(START_AVAILABLE_SECONDS).toBe(6)
    expect(INTRO_AUDIO_FADE_SECONDS).toBe(0.3)
    expect(INTRO_HANDOFF_SECONDS).toBe(0.65)
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

  it('selects every scene at its exact boundary', () => {
    expect(getIntroScene(0).id).toBe('tmb2-ident')
    expect(getIntroScene(5.999).id).toBe('tmb2-ident')
    expect(getIntroScene(6).id).toBe('duffel')
    expect(getIntroScene(11.999).id).toBe('duffel')
    expect(getIntroScene(12).id).toBe('key-escape')
    expect(getIntroScene(16).id).toBe('runway')
    expect(getIntroScene(22).id).toBe('ballpark')
    expect(getIntroScene(28).id).toBe('city-finance')
    expect(getIntroScene(35).id).toBe('sky')
    expect(getIntroScene(42).id).toBe('final-pursuit')
    expect(getIntroScene(48).id).toBe('catch')
    expect(getIntroScene(51).id).toBe('loop-reset')
    expect(getIntroScene(53.039).id).toBe('loop-reset')
  })

  it('normalizes invalid, negative, and post-loop time before scene selection', () => {
    expect(normalizeIntroTime(Number.NaN)).toBe(0)
    expect(normalizeIntroTime(-1)).toBe(0)
    expect(normalizeIntroTime(53.04)).toBe(0)
    expect(normalizeIntroTime(59.04)).toBeCloseTo(6)
    expect(getIntroScene(53.04).id).toBe('tmb2-ident')
    expect(getIntroScene(59.04).id).toBe('duffel')
  })

  it('keeps accessibility summaries without visible chapter-title data', () => {
    expect(introScenes.every((scene) => scene.summary.length > 0)).toBe(true)
    expect(introScenes.every((scene) => !('caption' in scene))).toBe(true)
  })

  it('contains no protected reward or cockpit preview asset', () => {
    expect(JSON.stringify(introScenes)).not.toMatch(/tesla|model y|flight mode|mars|cockpit|dc-9-game-ready/i)
  })
})
