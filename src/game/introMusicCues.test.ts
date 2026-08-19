import { describe, expect, it } from 'vitest'
import { introScenes, type IntroSceneId } from './introConfig'
import { BEAT_GRID_SECONDS, INTRO_MUSIC_CUES } from './introMusicCues'

const EXPECTED_SCENE: Record<keyof typeof INTRO_MUSIC_CUES, IntroSceneId> = {
  bootsDown: 'ritual',
  coffeeDown: 'ritual',
  flightCase: 'ritual',
  latchesSnap: 'ritual',
  hangarReveal: 'hangar-reveal',
  capFlip: 'suit-up',
  fourStripes: 'suit-up',
  logbookSnap: 'suit-up',
  wingsPinned: 'suit-up',
  watchCheck: 'suit-up',
  shadesDown: 'shades',
  engineStart: 'engine-start',
  instrumentsAlive: 'inserts',
  thePhoto: 'inserts',
  handOnThrottles: 'inserts',
  throttlesUp: 'takeoff',
  rotate: 'takeoff',
  jetPass: 'takeoff',
  emblemStamp: 'title',
}

describe('Scramble intro music cues', () => {
  it('places every cue inside its locked scene window', () => {
    for (const [cue, sceneId] of Object.entries(EXPECTED_SCENE)) {
      const time = INTRO_MUSIC_CUES[cue as keyof typeof INTRO_MUSIC_CUES]
      const scene = introScenes.find((candidate) => candidate.id === sceneId)!
      expect(time, `${cue} must start inside ${sceneId}`).toBeGreaterThanOrEqual(scene.startSeconds)
      expect(time, `${cue} must end inside ${sceneId}`).toBeLessThan(scene.endSeconds)
    }
  })

  it('keeps the cue sequence strictly increasing through the story', () => {
    const ordered = Object.values(INTRO_MUSIC_CUES)
    for (let index = 1; index < ordered.length; index += 1) {
      expect(ordered[index]!).toBeGreaterThan(ordered[index - 1]!)
    }
  })

  it('preserves the measured accents the track carries', () => {
    // These values were measured once from the audio (plan 0028) and the
    // Scramble design rides the same track: renaming a cue must never move it.
    expect(INTRO_MUSIC_CUES.bootsDown).toBe(7.512)
    expect(INTRO_MUSIC_CUES.coffeeDown).toBe(8.976)
    expect(INTRO_MUSIC_CUES.hangarReveal).toBe(13.056)
    expect(INTRO_MUSIC_CUES.capFlip).toBe(14.544)
    expect(INTRO_MUSIC_CUES.logbookSnap).toBe(19.368)
    expect(INTRO_MUSIC_CUES.watchCheck).toBe(24.552)
    expect(INTRO_MUSIC_CUES.shadesDown).toBe(30.48)
    expect(INTRO_MUSIC_CUES.engineStart).toBe(35.64)
    expect(INTRO_MUSIC_CUES.throttlesUp).toBe(45.12)
    expect(INTRO_MUSIC_CUES.rotate).toBe(46.008)
    expect(INTRO_MUSIC_CUES.jetPass).toBe(47.496)
    expect(INTRO_MUSIC_CUES.emblemStamp).toBe(49.704)
  })

  it('derives every grid cue exactly from a measured cue on the 0.72 s grid', () => {
    expect(BEAT_GRID_SECONDS).toBeCloseTo(0.72, 5)
    const grid = (origin: number, beats: number): number =>
      Math.round((origin + beats * BEAT_GRID_SECONDS) * 1000) / 1000
    expect(INTRO_MUSIC_CUES.flightCase).toBeCloseTo(grid(INTRO_MUSIC_CUES.coffeeDown, 2), 5)
    expect(INTRO_MUSIC_CUES.latchesSnap).toBeCloseTo(grid(INTRO_MUSIC_CUES.coffeeDown, 4), 5)
    expect(INTRO_MUSIC_CUES.fourStripes).toBeCloseTo(grid(INTRO_MUSIC_CUES.capFlip, 3), 5)
    expect(INTRO_MUSIC_CUES.wingsPinned).toBeCloseTo(grid(INTRO_MUSIC_CUES.logbookSnap, 3), 5)
    expect(INTRO_MUSIC_CUES.instrumentsAlive).toBeCloseTo(grid(INTRO_MUSIC_CUES.engineStart, 4), 5)
    expect(INTRO_MUSIC_CUES.thePhoto).toBeCloseTo(grid(INTRO_MUSIC_CUES.engineStart, 6), 5)
    expect(INTRO_MUSIC_CUES.handOnThrottles).toBeCloseTo(grid(INTRO_MUSIC_CUES.engineStart, 8), 5)
  })
})
