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

describe('Scramble cinematic timeline', () => {
  it('defines the exact approved 53.04-second sequence', () => {
    expect(INTRO_DURATION_SECONDS).toBe(53.04)
    expect(START_AVAILABLE_SECONDS).toBe(6)
    expect(INTRO_AUDIO_FADE_SECONDS).toBe(0.3)
    expect(INTRO_HANDOFF_SECONDS).toBe(0.65)
    expect(introScenes.map(({ id, startSeconds, endSeconds }) => ({ id, startSeconds, endSeconds }))).toEqual([
      { id: 'tmb2-ident', startSeconds: 0, endSeconds: 6 },
      { id: 'beacon-dark', startSeconds: 6, endSeconds: 7.512 },
      { id: 'ritual', startSeconds: 7.512, endSeconds: 13.056 },
      { id: 'suit-up', startSeconds: 13.056, endSeconds: 18 },
      { id: 'doors', startSeconds: 18, endSeconds: 21 },
      { id: 'standing-alone', startSeconds: 21, endSeconds: 23.4 },
      { id: 'walk-out', startSeconds: 23.4, endSeconds: 33.4 },
      { id: 'walk', startSeconds: 33.4, endSeconds: 35.64 },
      { id: 'aircraft-reveal', startSeconds: 35.64, endSeconds: 38.52 },
      { id: 'inserts', startSeconds: 38.52, endSeconds: 42.84 },
      { id: 'departure', startSeconds: 42.84, endSeconds: 47.496 },
      { id: 'right-seat', startSeconds: 47.496, endSeconds: 49.704 },
      { id: 'title', startSeconds: 49.704, endSeconds: 53.04 },
    ])
  })

  it('starts the story scenes exactly on their measured cues', () => {
    // Scene boundaries are the cues themselves: a boundary that drifts off its
    // accent silently unsyncs the whole design from the track.
    expect(getIntroScene(7.512).id).toBe('ritual')
    expect(getIntroScene(13.056).id).toBe('suit-up')
    expect(getIntroScene(18).id).toBe('doors')
    expect(getIntroScene(21).id).toBe('standing-alone')
    expect(getIntroScene(23.4).id).toBe('walk-out')
    expect(getIntroScene(33.4).id).toBe('walk')
    expect(getIntroScene(35.64).id).toBe('aircraft-reveal')
    expect(getIntroScene(38.52).id).toBe('inserts')
    expect(getIntroScene(49.704).id).toBe('title')
  })

  it('selects every scene at its exact boundary', () => {
    expect(getIntroScene(0).id).toBe('tmb2-ident')
    expect(getIntroScene(5.999).id).toBe('tmb2-ident')
    expect(getIntroScene(6).id).toBe('beacon-dark')
    expect(getIntroScene(13.055).id).toBe('ritual')
    expect(getIntroScene(26).id).toBe('walk-out')
    expect(getIntroScene(31.5).id).toBe('walk-out')
    expect(getIntroScene(42.84).id).toBe('departure')
    expect(getIntroScene(47.496).id).toBe('right-seat')
    expect(getIntroScene(53.039).id).toBe('title')
  })

  it('normalizes invalid, negative, and past-the-end time before scene selection', () => {
    expect(normalizeIntroTime(Number.NaN)).toBe(0)
    expect(normalizeIntroTime(-1)).toBe(0)
    // Past the end it clamps rather than wrapping: the intro plays once and
    // holds the title. Wrapping here would snap the held frame back to the
    // ident, which is exactly the attract loop the owner removed.
    expect(normalizeIntroTime(53.04)).toBeCloseTo(53.04, 3)
    expect(normalizeIntroTime(59.04)).toBeCloseTo(53.04, 3)
    expect(getIntroScene(53.04).id).toBe('title')
    expect(getIntroScene(120).id).toBe('title')
  })

  it('keeps accessibility summaries without visible chapter-title data', () => {
    expect(introScenes.every((scene) => scene.summary.length > 0)).toBe(true)
    expect(introScenes.every((scene) => !('caption' in scene))).toBe(true)
  })

  it('contains no protected reward or preview asset reference', () => {
    // "cockpit" left this guard 2026-08-18: the Scramble design's insert
    // shots are cockpit content by design (owner-approved animatic). The
    // reward exclusions are unchanged and stay hard.
    expect(JSON.stringify(introScenes)).not.toMatch(/tesla|model y|flight mode|mars|dc-9-game-ready/i)
  })
})
