import { describe, expect, it } from 'vitest'
import { introScenes, type IntroSceneId } from './introConfig'
import { DUFFEL_JOLT_PERIOD_SECONDS, INTRO_MUSIC_CUES } from './introMusicCues'

const EXPECTED_SCENE: Record<keyof typeof INTRO_MUSIC_CUES, IntroSceneId> = {
  assembleDone: 'duffel',
  firstDuffelJolt: 'duffel',
  keyBurst: 'key-escape',
  exclaim: 'key-escape',
  keyFlyExit: 'key-escape',
  cartNearMiss: 'runway',
  ballDeflect: 'ballpark',
  bullImpact: 'city-finance',
  skyGridIgnite: 'sky',
  missLunge: 'final-pursuit',
  catchRecover: 'final-pursuit',
  catchGrab: 'final-pursuit',
  emblemStamp: 'catch',
}

describe('TMB2 intro music cues', () => {
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

  it('honors choreography anchors that existing scene tests sample', () => {
    // The slide begins 0.6s before the deflection and the t=24 sample must already slide.
    expect(INTRO_MUSIC_CUES.ballDeflect - 0.6).toBeLessThanOrEqual(24)
    // The t=31 sample must still be inside the six-frame bull spin (~0.72s at 120ms frames).
    expect(INTRO_MUSIC_CUES.bullImpact).toBeLessThanOrEqual(31)
    expect(INTRO_MUSIC_CUES.bullImpact + 0.72).toBeGreaterThan(31)
    // The t=44 sample must still glide; the miss lunge comes after it.
    expect(INTRO_MUSIC_CUES.missLunge).toBeGreaterThan(44)
    // The t=49 sample must still be the victory pose; the emblem stamps after it.
    expect(INTRO_MUSIC_CUES.emblemStamp).toBeGreaterThan(49)
  })

  it('keeps the duffel jolts on the measured beat grid', () => {
    expect(DUFFEL_JOLT_PERIOD_SECONDS).toBeCloseTo(0.72, 5)
    // Four full jolt periods fit between the first jolt and the key burst.
    const jolts = (INTRO_MUSIC_CUES.keyBurst - INTRO_MUSIC_CUES.firstDuffelJolt) / DUFFEL_JOLT_PERIOD_SECONDS
    expect(jolts).toBeGreaterThanOrEqual(4)
  })
})
