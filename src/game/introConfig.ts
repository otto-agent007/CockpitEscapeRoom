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

/**
 * Transitional shape consumed by the rejected DOM renderer until Task 4 replaces it.
 * It intentionally exposes an empty caption so no new visible chapter title is created.
 */
export type IntroCue = {
  id: IntroSceneId | 'title'
  startSeconds: number
  background: string | null
  caption: string
  summary: string
  treatment: string
  poptClip: string | null
  keyClip: string | null
  fallbackImage: string | null
  objectPosition: string
}

const sceneVisuals: Partial<Record<IntroSceneId, Pick<IntroCue, 'background' | 'poptClip' | 'keyClip'>>> = {
  duffel: {
    background: 'images/intro/tmb2/backgrounds/duffel-terminal.png',
    poptClip: 'images/intro/tmb2/popt/duffel-pull/duffel-pull.webp',
    keyClip: null,
  },
  'key-escape': {
    background: 'images/intro/tmb2/backgrounds/duffel-terminal.png',
    poptClip: 'images/intro/tmb2/popt/startle-stumble/startle-stumble.webp',
    keyClip: 'images/intro/tmb2/key/key-mascot-poses-03.png',
  },
  runway: {
    background: 'images/intro/tmb2/backgrounds/runway-night.png',
    poptClip: 'images/intro/popt/run-sheet.png',
    keyClip: 'images/intro/tmb2/key/key-mascot-poses-01.png',
  },
  ballpark: {
    background: 'images/intro/tmb2/backgrounds/ballpark-night.png',
    poptClip: 'images/intro/tmb2/popt/baseball-slide/baseball-slide.webp',
    keyClip: 'images/intro/tmb2/key/key-mascot-poses-12.png',
  },
  'city-finance': {
    background: 'images/intro/tmb2/backgrounds/finance-city.png',
    poptClip: 'images/intro/tmb2/popt/bull-spin/bull-spin.webp',
    keyClip: 'images/intro/tmb2/key/key-mascot-poses-06.png',
  },
  sky: {
    background: 'images/intro/tmb2/backgrounds/cloud-chase.png',
    poptClip: 'images/intro/tmb2/popt/pilot-glide/pilot-glide.webp',
    keyClip: 'images/intro/tmb2/key/key-mascot-poses-12.png',
  },
  'final-pursuit': {
    background: 'images/intro/tmb2/backgrounds/cloud-chase.png',
    poptClip: 'images/intro/tmb2/popt/pilot-glide/pilot-glide.webp',
    keyClip: 'images/intro/tmb2/key/key-mascot-poses-14.png',
  },
  catch: {
    background: 'images/intro/tmb2/backgrounds/cloud-chase.png',
    poptClip: 'images/intro/tmb2/popt/victory-recovery/victory-recovery.webp',
    keyClip: 'images/intro/tmb2/key/key-mascot-poses-00.png',
  },
}

export function getIntroCue(timeSeconds: number): IntroCue {
  const scene = getIntroScene(timeSeconds)
  const visuals = sceneVisuals[scene.id]
  return {
    ...scene,
    background: visuals?.background ?? null,
    caption: '',
    treatment: scene.id,
    poptClip: visuals?.poptClip ?? null,
    keyClip: visuals?.keyClip ?? null,
    fallbackImage: visuals?.background ?? null,
    objectPosition: 'center',
  }
}

export const INTRO_PRELOAD_PATHS = [...new Set(
  Object.values(sceneVisuals)
    .flatMap((visuals) => [visuals.background, visuals.poptClip, visuals.keyClip])
    .filter((path): path is string => Boolean(path)),
)]
