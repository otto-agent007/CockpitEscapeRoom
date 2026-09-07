import type {
  CockpitOrientationId,
  CockpitOrientationSeen,
  GamePhase,
} from './state'

interface CockpitOrientationDecisionInput {
  phase: GamePhase
  seen: CockpitOrientationSeen
  sceneReady: boolean
  loaderVisible: boolean
  reducedMotion: boolean
  accessibleFallback: boolean
}

interface CockpitOrientationDecision {
  active: CockpitOrientationId | null
  completeImmediately: CockpitOrientationId | null
}

export function deriveCockpitOrientationDecision({
  phase,
  seen,
  sceneReady,
  loaderVisible,
  reducedMotion,
  accessibleFallback,
}: CockpitOrientationDecisionInput): CockpitOrientationDecision {
  if (phase !== 'dc9' && phase !== 'airbus') {
    return { active: null, completeImmediately: null }
  }
  if (seen[phase]) return { active: null, completeImmediately: null }
  if (reducedMotion || accessibleFallback) {
    return { active: null, completeImmediately: phase }
  }
  if (!sceneReady || loaderVisible) {
    return { active: null, completeImmediately: null }
  }
  return { active: phase, completeImmediately: null }
}
