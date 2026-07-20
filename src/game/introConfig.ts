export const INTRO_DURATION_SECONDS = 53.04
export const START_AVAILABLE_SECONDS = 6

export type IntroSceneId =
  | 'tmb2-ident' | 'duffel' | 'key-escape' | 'runway' | 'ballpark'
  | 'city-finance' | 'sky' | 'final-pursuit' | 'catch' | 'loop-reset'

export type IntroScene = {
  id: IntroSceneId
  startSeconds: number
  endSeconds: number
  label: string
}

export const introScenes = [
  { id: 'tmb2-ident', startSeconds: 0, endSeconds: 6, label: 'TMB2' },
  { id: 'duffel', startSeconds: 6, endSeconds: 12, label: 'The oversized duffel' },
  { id: 'key-escape', startSeconds: 12, endSeconds: 16, label: 'The key escapes' },
  { id: 'runway', startSeconds: 16, endSeconds: 22, label: 'Runway chase' },
  { id: 'ballpark', startSeconds: 22, endSeconds: 28, label: 'Ballpark detour' },
  { id: 'city-finance', startSeconds: 28, endSeconds: 35, label: 'Bull market launch' },
  { id: 'sky', startSeconds: 35, endSeconds: 42, label: 'Cloud chase' },
  { id: 'final-pursuit', startSeconds: 42, endSeconds: 48, label: 'Final pursuit' },
  { id: 'catch', startSeconds: 48, endSeconds: 51, label: 'The catch' },
  { id: 'loop-reset', startSeconds: 51, endSeconds: 53.04, label: 'Reset' },
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
