/**
 * The first-officer instrument scan.
 *
 * One gauge is asked for at a time, in the order a DC-9 crew read them. A correct
 * answer is permanent and triggers that instrument's self-test sweep. A wrong answer
 * costs nothing but produces steadily clearer coaching, and after three tries the
 * correct gauge is outlined outright.
 */

import { DC9_INSTRUMENT_IDS, type Dc9InstrumentId } from './dc9FlightDeck'

export const DC9_INSTRUMENT_SCAN_ORDER: readonly Dc9InstrumentId[] = DC9_INSTRUMENT_IDS

/** Attempts on the current prompt after which the answer is outlined for the player. */
export const DC9_INSTRUMENT_SCAN_FINAL_SUPPORT_ATTEMPTS = 3

export interface Dc9InstrumentScanProgress {
  identified: Dc9InstrumentId[]
  attempts: number
}

export type Dc9InstrumentScanOutcome = 'correct' | 'incorrect' | 'ignored'

export interface Dc9InstrumentScanResult {
  outcome: Dc9InstrumentScanOutcome
  progress: Dc9InstrumentScanProgress
}

export function createInitialDc9InstrumentScanProgress(): Dc9InstrumentScanProgress {
  return { identified: [], attempts: 0 }
}

export function dc9InstrumentScanPrompt(
  progress: Dc9InstrumentScanProgress,
): Dc9InstrumentId | null {
  const identified = new Set(progress.identified)
  return DC9_INSTRUMENT_SCAN_ORDER.find((id) => !identified.has(id)) ?? null
}

export function dc9InstrumentScanComplete(progress: Dc9InstrumentScanProgress): boolean {
  return dc9InstrumentScanPrompt(progress) === null
}

export function dc9InstrumentScanShowsFinalSupport(progress: Dc9InstrumentScanProgress): boolean {
  return progress.attempts >= DC9_INSTRUMENT_SCAN_FINAL_SUPPORT_ATTEMPTS
}

/**
 * Score one answer. Answering an already-identified gauge, or answering at all once
 * the scan is finished, is ignored rather than punished.
 */
export function applyDc9InstrumentAnswer(
  progress: Dc9InstrumentScanProgress,
  answer: Dc9InstrumentId,
): Dc9InstrumentScanResult {
  const prompt = dc9InstrumentScanPrompt(progress)
  if (prompt === null) return { outcome: 'ignored', progress }
  if (progress.identified.includes(answer)) return { outcome: 'ignored', progress }
  if (answer !== prompt) {
    return { outcome: 'incorrect', progress: { ...progress, attempts: progress.attempts + 1 } }
  }
  return {
    outcome: 'correct',
    progress: {
      identified: DC9_INSTRUMENT_SCAN_ORDER.filter(
        (id) => id === prompt || progress.identified.includes(id),
      ),
      attempts: 0,
    },
  }
}

export function normalizeDc9InstrumentScanProgress(value: unknown): Dc9InstrumentScanProgress {
  if (!value || typeof value !== 'object') return createInitialDc9InstrumentScanProgress()
  const candidate = value as Record<string, unknown>
  const known = new Set<string>(DC9_INSTRUMENT_SCAN_ORDER)
  const identified = Array.isArray(candidate.identified)
    ? DC9_INSTRUMENT_SCAN_ORDER.filter(
      (id) => (candidate.identified as unknown[]).some((entry) => entry === id && known.has(id)),
    )
    : []
  const rawAttempts = typeof candidate.attempts === 'number' && Number.isFinite(candidate.attempts)
    ? Math.floor(candidate.attempts)
    : 0
  return { identified, attempts: Math.max(0, Math.min(99, rawAttempts)) }
}
