/**
 * Reward copy that names the protected reward.
 *
 * Kept out of `config.ts` on purpose: `config.ts` is in the entry bundle every
 * player downloads before the cinematic, so anything in it is readable in the
 * page source long before the reward unlocks. Only the lazily loaded
 * RewardExperience imports this module, so the words ship with the reward chunk.
 * Held by tools/ci/spoiler-guard.mjs, which fails if they reach the initial download.
 */
export const rewardCopy = {
  vehicleLine: 'The red Tesla Model Y is unlocked.',
} as const
