export const REWARD_CLIP_DURATION_SECONDS = 11.5
export const REWARD_CLIP_DURATION_MS = REWARD_CLIP_DURATION_SECONDS * 1_000

export type RewardStage =
  | 'loading'
  | 'hangar-open'
  | 'vehicle-reveal'
  | 'flight-mode'
  | 'complete'

export interface RewardFrame {
  stage: RewardStage
  clipTimeSeconds: number
  title: string
  caption: string
}

interface RewardFrameOptions {
  elapsedMs: number
  ready: boolean
  reducedMotion?: boolean
  skipped?: boolean
}

const LOADING_FRAME: RewardFrame = {
  stage: 'loading',
  clipTimeSeconds: 0,
  title: 'Preparing the legacy hangar',
  caption: 'The Model Y reward is loading. Your completed journey is safe.',
}

export function rewardFrameAt({
  elapsedMs,
  ready,
  reducedMotion = false,
  skipped = false,
}: RewardFrameOptions): RewardFrame {
  if (!ready) return LOADING_FRAME

  const safeElapsedMs = reducedMotion || skipped
    ? REWARD_CLIP_DURATION_MS
    : Math.max(0, Math.min(elapsedMs, REWARD_CLIP_DURATION_MS))
  const clipTimeSeconds = safeElapsedMs / 1_000

  if (safeElapsedMs >= REWARD_CLIP_DURATION_MS) {
    return {
      stage: 'complete',
      clipTimeSeconds: REWARD_CLIP_DURATION_SECONDS,
      title: 'Advanced Mobility Package Unlocked',
      caption: 'Flight Mode is deployed in its final hover-ready pose.',
    }
  }
  if (safeElapsedMs >= 3_800) {
    return {
      stage: 'flight-mode',
      clipTimeSeconds,
      title: 'Advanced Mobility Package Unlocked',
      caption: safeElapsedMs < 4_800
        ? 'The Model Y holds for one last look before Flight Mode.'
        : safeElapsedMs < 9_800
          ? 'Wings, stabilizers, concealed lift fans, and restrained lighting are deploying.'
          : 'Flight Mode is settling into its final hover-ready pose.',
    }
  }
  if (safeElapsedMs >= 1_200) {
    return {
      stage: 'vehicle-reveal',
      clipTimeSeconds,
      title: 'Ground Transport Upgrade Authorized',
      caption: 'Red Model Y released to Pop T with the POP T plate installed.',
    }
  }
  return {
    stage: 'hangar-open',
    clipTimeSeconds,
    title: 'Legacy hangar release authorized',
    caption: 'The legacy hangar doors are opening for the final reward.',
  }
}
