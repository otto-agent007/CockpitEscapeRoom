import { INTRO_DURATION_SECONDS, START_AVAILABLE_SECONDS } from './introConfig'

export type IntroRuntimeState = {
  timeSeconds: number
  startAvailable: boolean
  audioMode: 'media' | 'fallback'
  fallbackStartedAtMs: number
  retryGeneration: number
  completed: boolean
  disposed: boolean
}

export type IntroRuntimeSample = {
  state: IntroRuntimeState
  didLoop: boolean
}

function safeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function createIntroRuntimeState(): IntroRuntimeState {
  return {
    timeSeconds: 0,
    startAvailable: false,
    audioMode: 'media',
    fallbackStartedAtMs: 0,
    retryGeneration: 0,
    completed: false,
    disposed: false,
  }
}

export function activateIntroRuntime(state: IntroRuntimeState): IntroRuntimeState {
  return state.disposed ? { ...state, disposed: false } : state
}

export function isIntroRuntimeActive(state: IntroRuntimeState): boolean {
  return !state.completed && !state.disposed
}

export function sampleIntroRuntime(
  state: IntroRuntimeState,
  sampledTimeSeconds: number,
): IntroRuntimeSample {
  if (state.completed || state.disposed) return { state, didLoop: false }

  const safeTimeSeconds = safeNonNegative(sampledTimeSeconds)
  const didLoop = safeTimeSeconds >= INTRO_DURATION_SECONDS
  return {
    state: {
      ...state,
      timeSeconds: didLoop ? 0 : safeTimeSeconds,
      startAvailable: state.startAvailable || safeTimeSeconds >= START_AVAILABLE_SECONDS,
    },
    didLoop,
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
  if (state.completed || state.disposed) return state
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
  if (state.completed || state.disposed) return state
  const sample = state.audioMode === 'fallback'
    ? sampleIntroClock(state, { nowMs, mediaTimeSeconds })
    : sampleIntroRuntime(state, mediaTimeSeconds)
  const sampled = sample.didLoop
    ? resetIntroRuntimeLoop(sample.state, nowMs)
    : sample.state
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
    || currentState.audioMode !== 'fallback'
    || currentState.retryGeneration !== generation
  ) return

  const nowMs = options.nowMs()
  const sample = sampleIntroClock(currentState, {
    nowMs,
    mediaTimeSeconds: currentState.timeSeconds,
  })
  const sampledState = sample.didLoop
    ? resetIntroRuntimeLoop(sample.state, nowMs)
    : sample.state
  if (outcome === 'rejected') {
    options.setState({ ...sampledState, retryGeneration: generation + 1 })
    options.onRejected?.()
    return
  }

  const mediaState = {
    ...sampledState,
    audioMode: 'media' as const,
    retryGeneration: generation + 1,
  }
  options.seek(mediaState.timeSeconds)
  options.setState(mediaState)
  options.onSuccess()
}

export function runIntroAudioRetry(options: IntroAudioRetryOptions): boolean {
  const currentState = options.getState()
  if (!isIntroRuntimeActive(currentState) || currentState.audioMode !== 'fallback') return false

  const nowMs = options.nowMs()
  const sample = sampleIntroClock(currentState, {
    nowMs,
    mediaTimeSeconds: currentState.timeSeconds,
  })
  const sampledState = sample.didLoop
    ? resetIntroRuntimeLoop(sample.state, nowMs)
    : sample.state
  const generation = sampledState.retryGeneration + 1
  const pendingState = { ...sampledState, retryGeneration: generation }
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

export function requestIntroCompletion(
  state: IntroRuntimeState,
  source: 'start' | 'skip',
): { state: IntroRuntimeState; accepted: boolean } {
  const accepted = isIntroRuntimeActive(state)
    && (source === 'skip' || state.startAvailable)
  return accepted
    ? { state: { ...state, completed: true, retryGeneration: state.retryGeneration + 1 }, accepted: true }
    : { state, accepted: false }
}

export function disposeIntroRuntime(state: IntroRuntimeState): IntroRuntimeState {
  return state.disposed
    ? state
    : { ...state, disposed: true, retryGeneration: state.retryGeneration + 1 }
}
