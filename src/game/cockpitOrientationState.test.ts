import { describe, expect, it } from 'vitest'
import { createInitialState } from './state'
import { deriveCockpitOrientationDecision } from './cockpitOrientationState'

const unseen = createInitialState().cockpitOrientationSeen

describe('cockpit orientation entry decisions', () => {
  it.each(['dc9', 'airbus'] as const)('starts the %s tour only after its real scene and loader settle', (phase) => {
    expect(deriveCockpitOrientationDecision({
      phase,
      seen: unseen,
      sceneReady: true,
      loaderVisible: false,
      reducedMotion: false,
      accessibleFallback: false,
    })).toEqual({ active: phase, completeImmediately: null })

    expect(deriveCockpitOrientationDecision({
      phase,
      seen: unseen,
      sceneReady: false,
      loaderVisible: false,
      reducedMotion: false,
      accessibleFallback: false,
    })).toEqual({ active: null, completeImmediately: null })

    expect(deriveCockpitOrientationDecision({
      phase,
      seen: unseen,
      sceneReady: true,
      loaderVisible: true,
      reducedMotion: false,
      accessibleFallback: false,
    })).toEqual({ active: null, completeImmediately: null })
  })

  it.each([
    ['dc9', true, false],
    ['dc9', false, true],
    ['airbus', true, false],
    ['airbus', false, true],
  ] as const)('bypasses %s animation for reduced motion or accessible fallback', (phase, reducedMotion, accessibleFallback) => {
    expect(deriveCockpitOrientationDecision({
      phase,
      seen: unseen,
      sceneReady: false,
      loaderVisible: true,
      reducedMotion,
      accessibleFallback,
    })).toEqual({ active: null, completeImmediately: phase })
  })

  it('does nothing for completed tours or non-cockpit phases', () => {
    expect(deriveCockpitOrientationDecision({
      phase: 'dc9',
      seen: { dc9: true, airbus: false },
      sceneReady: true,
      loaderVisible: false,
      reducedMotion: false,
      accessibleFallback: false,
    })).toEqual({ active: null, completeImmediately: null })

    expect(deriveCockpitOrientationDecision({
      phase: 'locker',
      seen: unseen,
      sceneReady: true,
      loaderVisible: false,
      reducedMotion: false,
      accessibleFallback: false,
    })).toEqual({ active: null, completeImmediately: null })
  })
})
