import { describe, expect, it } from 'vitest'
import { introScenes, type IntroSceneId } from './introConfig'
import { INTRO_MUSIC_CUES } from './introMusicCues'

const EXPECTED_SCENE: Record<keyof typeof INTRO_MUSIC_CUES, IntroSceneId> = {
  bootsDown: 'ritual',
  coffeeDown: 'ritual',
  capFlip: 'suit-up',
  wingsPinned: 'suit-up',
  fourStripes: 'suit-up',
  watchCheck: 'suit-up',
  logbookSnap: 'walk-out',
  headsetUp: 'walk-out',
  shadesDown: 'walk-out',
  doorsParting: 'doors',
  standingAlone: 'standing-alone',
  walkOut: 'walk',
  aircraftReveal: 'aircraft-reveal',
  instrumentsAlive: 'inserts',
  overheadPanel: 'inserts',
  handOnThrottles: 'inserts',
  nacelleLight: 'inserts',
  throttlesUp: 'inserts',
  rotate: 'inserts',
  intoTheSeat: 'right-seat',
  titleCard: 'title',
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
    // The owner has reordered which beat sits on which accent several times;
    // the ACCENT TIMES are measured from the audio and never move.
    expect(INTRO_MUSIC_CUES.bootsDown).toBe(7.512)
    expect(INTRO_MUSIC_CUES.fourStripes).toBe(13.056)
    expect(INTRO_MUSIC_CUES.aircraftReveal).toBe(35.64)
    expect(INTRO_MUSIC_CUES.throttlesUp).toBe(45.12)
    expect(INTRO_MUSIC_CUES.rotate).toBe(46.008)
    expect(INTRO_MUSIC_CUES.intoTheSeat).toBe(47.496)
    expect(INTRO_MUSIC_CUES.titleCard).toBe(49.704)
  })

  it('opens the doors onto the vocal passage and holds them there', () => {
    // Measured at 0.25 s resolution the arrangement thins from 15.25 s to
    // 18.0 s; the doors hit that downbeat and the silhouette holds across it.
    // The gates themselves take the "standing there alone" downbeat (owner:
    // the release-lever insert stole the hit), and the parting doors plus the
    // shadow hold form one continuous quiet stretch until the stripes.
    expect(INTRO_MUSIC_CUES.doorsParting).toBe(18)
    expect(INTRO_MUSIC_CUES.standingAlone - INTRO_MUSIC_CUES.doorsParting).toBeGreaterThanOrEqual(3)
  })

  it('cuts the opening fast and plays everything after the gates long', () => {
    const before = [
      INTRO_MUSIC_CUES.bootsDown, INTRO_MUSIC_CUES.coffeeDown, INTRO_MUSIC_CUES.capFlip,
      INTRO_MUSIC_CUES.wingsPinned, INTRO_MUSIC_CUES.fourStripes, INTRO_MUSIC_CUES.watchCheck,
    ]
    const after = [
      INTRO_MUSIC_CUES.standingAlone, INTRO_MUSIC_CUES.logbookSnap,
      INTRO_MUSIC_CUES.headsetUp, INTRO_MUSIC_CUES.shadesDown, INTRO_MUSIC_CUES.walkOut,
    ]
    const gaps = (list: readonly number[]) =>
      list.slice(1).map((value, index) => value - list[index]!)
    const meanBefore = gaps(before).reduce((a, b) => a + b, 0) / (before.length - 1)
    const meanAfter = gaps(after).reduce((a, b) => a + b, 0) / (after.length - 1)
    // Every beat now runs long: the story spans the whole track instead of
    // being finished by 18 s, which is what the fast version did.
    // The owner wants the opening FAST and everything after the gates long.
    expect(meanBefore).toBeLessThan(1.7)
    expect(meanAfter).toBeGreaterThan(2.3)
  })
})
