import {
  INTRO_AUDIO_FADE_SECONDS,
  INTRO_DURATION_SECONDS,
  INTRO_HANDOFF_SECONDS,
  START_AVAILABLE_SECONDS,
} from './introConfig'

export type IntroRuntimePhase = 'playing' | 'handoff' | 'completed'

export type IntroRuntimeState = {
  timeSeconds: number
  startAvailable: boolean
  audioMode: 'media' | 'fallback'
  fallbackStartedAtMs: number
  retryGeneration: number
  phase: IntroRuntimePhase
  handoffStartedAtMs: number | null
  /** True once the intro has played through; it then holds its final frame. */
  reachedEnd: boolean
  disposed: boolean
}

export type IntroRuntimeSample = {
  state: IntroRuntimeState
  /** Retained for the handoff/fallback call sites; the intro no longer loops. */
  didLoop: boolean
}

export type IntroHandoffSample = {
  state: IntroRuntimeState
  progress: number
  audioGain: number
  shouldComplete: boolean
}

function safeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function createIntroRuntimeState(): IntroRuntimeState {
  return {
    timeSeconds: 0,
    startAvailable: false,
    audioMode: 'media',
    reachedEnd: false,
    fallbackStartedAtMs: 0,
    retryGeneration: 0,
    phase: 'playing',
    handoffStartedAtMs: null,
    disposed: false,
  }
}

export function isIntroRuntimeActive(state: IntroRuntimeState): boolean {
  return !state.disposed && state.phase !== 'completed'
}

export function sampleIntroRuntime(
  state: IntroRuntimeState,
  sampledTimeSeconds: number,
): IntroRuntimeSample {
  if (!isIntroRuntimeActive(state) || state.phase !== 'playing') {
    return { state, didLoop: false }
  }

  const safeTimeSeconds = safeNonNegative(sampledTimeSeconds)
  // The intro plays ONCE and then holds on its final frame — the title over the
  // empty right seat — until the player starts (owner decision 2026-08-20).
  // It used to be an attract loop that restarted from the TMB2 ident, which
  // read as a mistake once the ending became a title screen.
  const reachedEnd = safeTimeSeconds >= INTRO_DURATION_SECONDS
  return {
    state: {
      ...state,
      timeSeconds: reachedEnd ? INTRO_DURATION_SECONDS : safeTimeSeconds,
      startAvailable: state.startAvailable || safeTimeSeconds >= START_AVAILABLE_SECONDS,
      reachedEnd: state.reachedEnd || reachedEnd,
    },
    didLoop: false,
  }
}

export function sampleIntroClock(
  state: IntroRuntimeState,
  clock: { nowMs: number; mediaTimeSeconds: number },
): IntroRuntimeSample {
  const sampledTimeSeconds = state.audioMode === 'fallback'
    ? (safeNonNegative(clock.nowMs) - state.fallbackStartedAtMs) / 1_000
    : clock.mediaTimeSeconds
  return sampleIntroRuntime(state, sampledTimeSeconds)
}

export function resetIntroRuntimeLoop(state: IntroRuntimeState, nowMs: number): IntroRuntimeState {
  if (!isIntroRuntimeActive(state) || state.phase !== 'playing') return state
  return {
    ...state,
    timeSeconds: 0,
    fallbackStartedAtMs: state.audioMode === 'fallback'
      ? safeNonNegative(nowMs)
      : state.fallbackStartedAtMs,
  }
}

export function enterIntroFallback(
  state: IntroRuntimeState,
  nowMs: number,
  mediaTimeSeconds: number,
): IntroRuntimeState {
  if (!isIntroRuntimeActive(state) || state.phase !== 'playing') return state
  const sample = state.audioMode === 'fallback'
    ? sampleIntroClock(state, { nowMs, mediaTimeSeconds })
    : sampleIntroRuntime(state, mediaTimeSeconds)
  const sampled = sample.didLoop ? resetIntroRuntimeLoop(sample.state, nowMs) : sample.state
  return {
    ...sampled,
    audioMode: 'fallback',
    fallbackStartedAtMs: safeNonNegative(nowMs) - sampled.timeSeconds * 1_000,
    retryGeneration: sampled.retryGeneration + 1,
  }
}

type IntroAudioRetryOptions = {
  getState: () => IntroRuntimeState
  setState: (state: IntroRuntimeState) => void
  play: () => Promise<void>
  seek: (timeSeconds: number) => void
  nowMs: () => number
  onSuccess: () => void
  onRejected?: () => void
}

function settleIntroAudioRetry(
  options: IntroAudioRetryOptions,
  generation: number,
  outcome: 'success' | 'rejected',
): void {
  const currentState = options.getState()
  if (
    !isIntroRuntimeActive(currentState)
    || currentState.phase !== 'playing'
    || currentState.audioMode !== 'fallback'
    || currentState.retryGeneration !== generation
  ) return

  const nowMs = options.nowMs()
  const sample = sampleIntroClock(currentState, {
    nowMs,
    mediaTimeSeconds: currentState.timeSeconds,
  })
  const sampled = sample.didLoop ? resetIntroRuntimeLoop(sample.state, nowMs) : sample.state
  if (outcome === 'rejected') {
    options.setState({ ...sampled, retryGeneration: generation + 1 })
    options.onRejected?.()
    return
  }

  const mediaState = {
    ...sampled,
    audioMode: 'media' as const,
    retryGeneration: generation + 1,
  }
  options.seek(mediaState.timeSeconds)
  options.setState(mediaState)
  options.onSuccess()
}

export function runIntroAudioRetry(options: IntroAudioRetryOptions): boolean {
  const currentState = options.getState()
  if (
    !isIntroRuntimeActive(currentState)
    || currentState.phase !== 'playing'
    || currentState.audioMode !== 'fallback'
  ) return false

  const nowMs = options.nowMs()
  const sample = sampleIntroClock(currentState, {
    nowMs,
    mediaTimeSeconds: currentState.timeSeconds,
  })
  const sampled = sample.didLoop ? resetIntroRuntimeLoop(sample.state, nowMs) : sample.state
  const generation = sampled.retryGeneration + 1
  const pendingState = { ...sampled, retryGeneration: generation }
  options.setState(pendingState)
  options.seek(pendingState.timeSeconds)

  let playback: Promise<void>
  try {
    playback = options.play()
  } catch (error) {
    playback = Promise.reject(error)
  }
  void playback.then(
    () => settleIntroAudioRetry(options, generation, 'success'),
    () => settleIntroAudioRetry(options, generation, 'rejected'),
  )
  return true
}

export function requestIntroHandoff(
  state: IntroRuntimeState,
  nowMs: number,
): { state: IntroRuntimeState; accepted: boolean } {
  const accepted = isIntroRuntimeActive(state)
    && state.phase === 'playing'
    && state.startAvailable
  if (!accepted) return { state, accepted: false }
  return {
    state: {
      ...state,
      phase: 'handoff',
      handoffStartedAtMs: safeNonNegative(nowMs),
      retryGeneration: state.retryGeneration + 1,
    },
    accepted: true,
  }
}

export function sampleIntroHandoff(
  state: IntroRuntimeState,
  nowMs: number,
): IntroHandoffSample {
  if (state.phase === 'completed') {
    return { state, progress: 1, audioGain: 0, shouldComplete: false }
  }
  if (state.phase !== 'handoff' || state.handoffStartedAtMs === null || state.disposed) {
    return { state, progress: 0, audioGain: 1, shouldComplete: false }
  }

  const elapsedSeconds = Math.max(0, safeNonNegative(nowMs) - state.handoffStartedAtMs) / 1_000
  const progress = clamp01(elapsedSeconds / INTRO_HANDOFF_SECONDS)
  const audioGain = clamp01(1 - elapsedSeconds / INTRO_AUDIO_FADE_SECONDS)
  if (progress < 1) return { state, progress, audioGain, shouldComplete: false }

  return {
    state: { ...state, phase: 'completed' },
    progress: 1,
    audioGain: 0,
    shouldComplete: true,
  }
}

export function disposeIntroRuntime(state: IntroRuntimeState): IntroRuntimeState {
  return state.disposed
    ? state
    : { ...state, disposed: true, retryGeneration: state.retryGeneration + 1 }
}
