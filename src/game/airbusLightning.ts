/**
 * When lightning strikes on the Storm Line.
 *
 * The schedule lives in the game layer rather than with the cloud sprites because two
 * things consume it now: the sky flash and the thunder that follows it. Duplicating the
 * jitter maths in the audio layer would let the two drift apart, and a clap that answers a
 * bolt nobody saw is worse than no clap at all.
 */

export interface AirbusLightningFlash {
  /** 0 when dark. Multi-stroke, so it flickers rather than blinking once. */
  intensity: number
  strikeIndex: number
}

export const LIGHTNING_STRIKE_PERIOD_SECONDS = 8.5
const LIGHTNING_STRIKE_WINDOW_SECONDS = 0.62

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Deterministic per-strike randomness. Exported so the thunder for a strike can be drawn
 * from the same source as the flash: strike 7 is always the same distance away.
 */
export function lightningStrikeJitter(strikeIndex: number, salt: number): number {
  const noise = Math.sin(strikeIndex * 37.719 + salt * 11.413) * 21374.729
  return noise - Math.floor(noise)
}

function stroke(localSeconds: number, atSeconds: number, amplitude: number): number {
  const since = localSeconds - atSeconds
  return since < 0 ? 0 : amplitude * Math.exp(-since * 14)
}

/**
 * Deterministic multi-stroke lightning. Pure so it can be sampled every frame
 * instead of inside a 12 Hz throttle, where a sub-frame flash window is missed
 * far more often than it is caught.
 */
export function airbusLightningFlash(
  elapsedSeconds: number,
  eligible: boolean,
): AirbusLightningFlash {
  const time = Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0)
  const strikeIndex = Math.floor(time / LIGHTNING_STRIKE_PERIOD_SECONDS)
  if (!eligible) return { intensity: 0, strikeIndex }

  const offset = lightningStrikeJitter(strikeIndex, 1)
    * (LIGHTNING_STRIKE_PERIOD_SECONDS - LIGHTNING_STRIKE_WINDOW_SECONDS - 0.5)
  const local = time - (strikeIndex * LIGHTNING_STRIKE_PERIOD_SECONDS + offset)
  if (local < 0 || local > LIGHTNING_STRIKE_WINDOW_SECONDS) {
    return { intensity: 0, strikeIndex }
  }

  const intensity = stroke(local, 0, 1)
    + stroke(local, 0.13, 0.34 + lightningStrikeJitter(strikeIndex, 2) * 0.42)
    + stroke(local, 0.29, 0.18 + lightningStrikeJitter(strikeIndex, 3) * 0.3)
  return { intensity: clamp01(intensity), strikeIndex }
}
