export const INTRO_DURATION_SECONDS = 53.04
export const START_AVAILABLE_SECONDS = 6
export const INTRO_AUDIO_FADE_SECONDS = 0.3
export const INTRO_HANDOFF_SECONDS = 0.65

export type IntroSceneId =
  | 'tmb2-ident'
  | 'beacon-dark'
  | 'ritual'
  | 'hangar-reveal'
  | 'suit-up'
  | 'doors'
  | 'shades'
  | 'walk'
  | 'engine-start'
  | 'inserts'
  | 'takeoff'
  | 'title'
  | 'loop-reset'

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
    summary: 'Blue pixels assemble the TMB2 console logo before a bright gold-white overload.',
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
    endSeconds: 13.056,
    summary: 'Hard-cut stills on the beat: boots on the tarmac, coffee set down, the flight case latches snap shut.',
  },
  {
    id: 'hangar-reveal',
    startSeconds: 13.056,
    endSeconds: 14.544,
    summary: 'Hangar floodlights slam on row by row and reveal the Northwest DC-9 waiting for its legacy flight.',
  },
  {
    id: 'suit-up',
    startSeconds: 14.544,
    endSeconds: 26,
    summary: 'The suit-up montage: the cap flipped and caught, four captain stripes, the logbook snapped shut, wings pinned, and a glance at the watch.',
  },
  {
    id: 'doors',
    startSeconds: 26,
    endSeconds: 30.48,
    summary: 'The hangar doors grind open around the captain’s backlit silhouette.',
  },
  {
    id: 'shades',
    startSeconds: 30.48,
    endSeconds: 31.5,
    summary: 'Shades down.',
  },
  {
    id: 'walk',
    startSeconds: 31.5,
    endSeconds: 35.64,
    summary: 'The long walk across the hangar floor, small against the DC-9’s nose.',
  },
  {
    id: 'engine-start',
    startSeconds: 35.64,
    endSeconds: 38.52,
    summary: 'Engine light-off: the fan spools and the anti-collision beacon starts flashing on the beat.',
  },
  {
    id: 'inserts',
    startSeconds: 38.52,
    endSeconds: 42.84,
    summary: 'Cockpit inserts: the instrument panel wakes left to right, the family photo on the glareshield, a hand settles on the throttles.',
  },
  {
    id: 'takeoff',
    startSeconds: 42.84,
    endSeconds: 49.704,
    summary: 'Lineup on the empty runway, throttles up, rotate — the DC-9 climbs past the camera trailing a contrail.',
  },
  {
    id: 'title',
    startSeconds: 49.704,
    endSeconds: 51,
    summary: 'The winged-globe emblem stamps into the contrail against the stars.',
  },
  {
    id: 'loop-reset',
    startSeconds: 51,
    endSeconds: 53.04,
    summary: 'The title holds and the picture collapses into blue pixels before the loop restarts.',
  },
] as const satisfies readonly IntroScene[]

export function normalizeIntroTime(timeSeconds: number): number {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) return 0
  return timeSeconds % INTRO_DURATION_SECONDS
}

export function getIntroSceneAtNormalizedTime(normalizedTimeSeconds: number): IntroScene {
  return introScenes.find(
    (scene) => normalizedTimeSeconds >= scene.startSeconds && normalizedTimeSeconds < scene.endSeconds,
  ) ?? introScenes[0]
}

export function getIntroScene(timeSeconds: number): IntroScene {
  return getIntroSceneAtNormalizedTime(normalizeIntroTime(timeSeconds))
}
