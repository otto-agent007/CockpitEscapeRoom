export const INTRO_DURATION_SECONDS = 53.04
export const START_AVAILABLE_SECONDS = 6
export const INTRO_AUDIO_FADE_SECONDS = 0.3
export const INTRO_HANDOFF_SECONDS = 0.65

export type IntroSceneId =
  | 'tmb2-ident'
  | 'beacon-dark'
  | 'ritual'
  | 'suit-up'
  | 'doors'
  | 'standing-alone'
  | 'walk-out'
  | 'walk'
  | 'aircraft-reveal'
  | 'inserts'
  | 'right-seat'
  | 'title'

export type IntroScene = {
  id: IntroSceneId
  startSeconds: number
  endSeconds: number
  summary: string
}

export const introScenes = [
  {
    id: 'tmb2-ident',
    startSeconds: 0,
    endSeconds: 6,
    summary: 'Blue pixels assemble the TMB2 console logo while Pop T chases his cap across the stage.',
  },
  {
    id: 'beacon-dark',
    startSeconds: 6,
    endSeconds: 7.512,
    summary: 'A single amber beacon sweep crosses the dark before the pre-flight ritual begins.',
  },
  {
    id: 'ritual',
    startSeconds: 7.512,
    endSeconds: 10.284,
    summary: 'Quick stills on the beat: boots on the tarmac, then the coffee set down.',
  },
  {
    id: 'suit-up',
    startSeconds: 10.284,
    endSeconds: 18,
    summary: 'The suit-up cuts fast: the cap flipped and caught, wings pinned, four captain stripes, and the aviators down.',
  },
  {
    id: 'doors',
    startSeconds: 18,
    endSeconds: 21,
    summary: 'The hangar doors part around the captain’s backlit silhouette and hold there through the vocal.',
  },
  {
    id: 'standing-alone',
    startSeconds: 21,
    endSeconds: 23.4,
    summary: 'The music thins to a voice and he stands alone, his shadow reaching down the hangar floor.',
  },
  {
    id: 'walk-out',
    startSeconds: 23.4,
    endSeconds: 31.6,
    summary: 'On the way out: his reading pile swept aside to lift the flight log, the headset over his shoulder, and a glance at the watch as he steps into the light.',
  },
  {
    id: 'walk',
    startSeconds: 31.6,
    endSeconds: 35.64,
    summary: 'The long walk out across the hangar floor.',
  },
  {
    id: 'aircraft-reveal',
    startSeconds: 35.64,
    endSeconds: 38.52,
    summary: 'Floodlights slam on row by row and the Northwest DC-9 is there, waiting.',
  },
  {
    id: 'inserts',
    startSeconds: 38.52,
    endSeconds: 47.496,
    summary: 'Inside the cockpit for the departure: the panel wakes, the overhead switches sweep on, a hand settles on the throttles and pushes them up.',
  },
  {
    id: 'right-seat',
    startSeconds: 47.496,
    endSeconds: 49.704,
    summary: 'Inside the quiet flight deck: the first officer’s seat is empty, harness loose, panel awake.',
  },
  {
    id: 'title',
    startSeconds: 49.704,
    endSeconds: 53.04,
    summary: 'The instrument glow resolves into a golden winged title plaque over the waiting seat, and holds there.',
  },
] as const satisfies readonly IntroScene[]

/**
 * The intro plays once and holds. This used to wrap with a modulo for the
 * attract loop; it now clamps just inside the last scene so the held final
 * frame stays the title rather than snapping back to the ident at 53.04.
 */
export function normalizeIntroTime(timeSeconds: number): number {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) return 0
  return Math.min(timeSeconds, INTRO_DURATION_SECONDS - 0.0001)
}

export function getIntroSceneAtNormalizedTime(normalizedTimeSeconds: number): IntroScene {
  return introScenes.find(
    (scene) => normalizedTimeSeconds >= scene.startSeconds && normalizedTimeSeconds < scene.endSeconds,
  ) ?? introScenes[0]
}

export function getIntroScene(timeSeconds: number): IntroScene {
  return getIntroSceneAtNormalizedTime(normalizeIntroTime(timeSeconds))
}
