export const INTRO_DURATION_SECONDS = 53.04
export const START_AVAILABLE_SECONDS = 6
export const INTRO_AUDIO_FADE_SECONDS = 0.3
export const INTRO_HANDOFF_SECONDS = 0.65

export type IntroSceneId =
  | 'tmb2-ident'
  | 'duffel'
  | 'key-escape'
  | 'runway'
  | 'ballpark'
  | 'city-finance'
  | 'sky'
  | 'final-pursuit'
  | 'catch'
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
    id: 'duffel',
    startSeconds: 6,
    endSeconds: 12,
    summary: 'Pop T enters confidently and struggles with an oversized rattling duffel bag.',
  },
  {
    id: 'key-escape',
    startSeconds: 12,
    endSeconds: 16,
    summary: 'A living golden key bursts from the luggage, startles Pop T, taunts him, and escapes.',
  },
  {
    id: 'runway',
    startSeconds: 16,
    endSeconds: 22,
    summary: 'Pop T chases the key past airport equipment and narrowly avoids a runway cart.',
  },
  {
    id: 'ballpark',
    startSeconds: 22,
    endSeconds: 28,
    summary: 'The key redirects a baseball while Pop T performs a dramatic slide past the base.',
  },
  {
    id: 'city-finance',
    startSeconds: 28,
    endSeconds: 35,
    summary: 'The key runs along a rising neon graph and Pop T collides with comic bull imagery.',
  },
  {
    id: 'sky',
    startSeconds: 35,
    endSeconds: 42,
    summary: 'Clouds and a red digital horizon launch the chase into the sky.',
  },
  {
    id: 'final-pursuit',
    startSeconds: 42,
    endSeconds: 48,
    summary: 'Pop T glides on pilot wings, misses the key once, recovers, and catches it.',
  },
  {
    id: 'catch',
    startSeconds: 48,
    endSeconds: 51,
    summary: 'Pop T holds a brief victory pose before the key delivers one last joke.',
  },
  {
    id: 'loop-reset',
    startSeconds: 51,
    endSeconds: 53.04,
    summary: 'The key drags Pop T away and the picture collapses into blue pixels.',
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
