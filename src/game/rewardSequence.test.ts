import { describe, expect, it } from 'vitest'

import {
  REWARD_CLIP_DURATION_MS,
  REWARD_CLIP_DURATION_SECONDS,
  rewardFrameAt,
} from './rewardSequence'

describe('Model Y reward timeline', () => {
  it.each([
    [0, 'hangar-open', 0],
    [1_199, 'hangar-open', 1.199],
    [1_200, 'vehicle-reveal', 1.2],
    [3_799, 'vehicle-reveal', 3.799],
    [3_800, 'flight-mode', 3.8],
    [4_800, 'flight-mode', 4.8],
    [9_800, 'flight-mode', 9.8],
    [11_499, 'flight-mode', 11.499],
    [11_500, 'complete', 11.5],
    [20_000, 'complete', 11.5],
  ] as const)('maps %dms to %s at the authored clip time', (elapsedMs, stage, clipTimeSeconds) => {
    expect(rewardFrameAt({ elapsedMs, ready: true })).toMatchObject({
      stage,
      clipTimeSeconds,
    })
  })

  it('stays at loading and does not advance the clip until the GLB is ready', () => {
    expect(rewardFrameAt({ elapsedMs: 8_000, ready: false })).toEqual({
      stage: 'loading',
      clipTimeSeconds: 0,
      title: 'Preparing the legacy hangar',
      caption: 'The Model Y reward is loading. Your completed journey is safe.',
    })
  })

  it.each([
    { reducedMotion: true, skipped: false },
    { reducedMotion: false, skipped: true },
  ])('lands reduced motion and Skip on the exact final frame', (options) => {
    expect(rewardFrameAt({ elapsedMs: 250, ready: true, ...options })).toMatchObject({
      stage: 'complete',
      clipTimeSeconds: REWARD_CLIP_DURATION_SECONDS,
    })
  })

  it('uses the approved cue titles and captions at each beat', () => {
    expect(rewardFrameAt({ elapsedMs: 0, ready: true }).title).toBe('Legacy hangar release authorized')
    expect(rewardFrameAt({ elapsedMs: 1_200, ready: true }).title).toBe('Ground Transport Upgrade Authorized')
    expect(rewardFrameAt({ elapsedMs: 3_800, ready: true }).title).toBe('Advanced Mobility Package Unlocked')
    expect(rewardFrameAt({ elapsedMs: REWARD_CLIP_DURATION_MS, ready: true }).caption).toMatch(/hover-ready/i)
  })
})
