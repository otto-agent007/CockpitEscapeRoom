/**
 * The "Restart round" button that appears by itself when a round ends, so a phone player
 * does not have to open the menu (owner, 2026-11-11: "After the round is over, there
 * should be a restart round button that automatically pops up").
 *
 * It waits a moment so the K.O. or time-up banner reads first, and stays hidden while
 * the fight is paused: the menu pauses it and carries its own Restart round button.
 */
export const ROUND_RESTART_DELAY_MS = 900

export function roundIsOver(phase: string): boolean {
  return phase === 'ko' || phase === 'timeOver'
}

export function roundRestartVisible(options: {
  phase: string
  paused: boolean
  exchange: boolean
  overSinceMs: number | null
  nowMs: number
}): boolean {
  if (!roundIsOver(options.phase) || options.paused || options.exchange || options.overSinceMs === null) return false
  return options.nowMs - options.overSinceMs >= ROUND_RESTART_DELAY_MS
}
