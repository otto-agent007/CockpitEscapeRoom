import { describe, expect, it } from 'vitest'
import { INTRO_DURATION_SECONDS } from './introConfig'
import {
  activateIntroRuntime,
  createIntroRuntimeState,
  disposeIntroRuntime,
  enterIntroFallback,
  isIntroRuntimeActive,
  requestIntroCompletion,
  resetIntroRuntimeLoop,
  runIntroAudioRetry,
  sampleIntroClock,
  sampleIntroRuntime,
} from './introRuntime'

type Deferred = {
  promise: Promise<void>
  resolve: () => void
  reject: (reason?: unknown) => void
}

function createDeferred(): Deferred {
  let resolve!: () => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<void>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

async function flushDeferred(deferred: Deferred): Promise<void> {
  await deferred.promise.catch(() => undefined)
  await Promise.resolve()
}

describe('intro runtime controller', () => {
  it('unlocks at six seconds monotonically across natural loop reset', () => {
    let state = createIntroRuntimeState()
    state = sampleIntroRuntime(state, 5.999).state
    expect(state.startAvailable).toBe(false)

    state = sampleIntroRuntime(state, 6).state
    expect(state.startAvailable).toBe(true)

    state = resetIntroRuntimeLoop(state, 53_040)
    expect(state).toMatchObject({ timeSeconds: 0, startAvailable: true, completed: false })
  })

  it('resets a fallback-clock loop without completing', () => {
    let state = sampleIntroRuntime(createIntroRuntimeState(), 10).state
    state = enterIntroFallback(state, 20_000, 10)

    const loopBoundary = sampleIntroClock(state, {
      nowMs: 20_000 + (INTRO_DURATION_SECONDS - 10) * 1_000,
      mediaTimeSeconds: 10,
    })
    expect(loopBoundary.didLoop).toBe(true)

    state = resetIntroRuntimeLoop(loopBoundary.state, 63_040)
    expect(state).toMatchObject({ timeSeconds: 0, completed: false, audioMode: 'fallback' })
  })

  it('keeps fallback authoritative while retry is pending and resynchronizes deferred success', async () => {
    const deferred = createDeferred()
    const seeks: number[] = []
    let successes = 0
    let nowMs = 10_000
    let state = sampleIntroRuntime(createIntroRuntimeState(), 11).state
    state = enterIntroFallback(state, 10_000, 11)

    expect(runIntroAudioRetry({
      getState: () => state,
      setState: (nextState) => { state = nextState },
      play: () => deferred.promise,
      seek: (timeSeconds) => seeks.push(timeSeconds),
      nowMs: () => nowMs,
      onSuccess: () => { successes += 1 },
    })).toBe(true)
    expect(state.audioMode).toBe('fallback')
    expect(seeks).toEqual([11])

    nowMs = 12_500
    deferred.resolve()
    await flushDeferred(deferred)

    expect(seeks).toEqual([11, 13.5])
    expect(state).toMatchObject({ timeSeconds: 13.5, audioMode: 'media', completed: false })
    expect(successes).toBe(1)
  })

  it('keeps monotonic fallback time after a delayed retry rejection', async () => {
    const deferred = createDeferred()
    let rejections = 0
    let nowMs = 10_000
    let state = enterIntroFallback(sampleIntroRuntime(createIntroRuntimeState(), 11).state, nowMs, 11)

    runIntroAudioRetry({
      getState: () => state,
      setState: (nextState) => { state = nextState },
      play: () => deferred.promise,
      seek: () => undefined,
      nowMs: () => nowMs,
      onSuccess: () => undefined,
      onRejected: () => { rejections += 1 },
    })
    nowMs = 12_500
    deferred.reject(new Error('still blocked'))
    await flushDeferred(deferred)

    expect(state).toMatchObject({ timeSeconds: 13.5, audioMode: 'fallback', completed: false })
    expect(rejections).toBe(1)
    expect(sampleIntroClock(state, { nowMs: 13_500, mediaTimeSeconds: 11 }).state.timeSeconds).toBeCloseTo(14.5)
    state = enterIntroFallback(state, 13_500, 11)
    expect(state.timeSeconds).toBeCloseTo(14.5)
  })

  it('does not commit a deferred retry after completion', async () => {
    const deferred = createDeferred()
    const seeks: number[] = []
    let successes = 0
    let nowMs = 10_000
    let state = enterIntroFallback(sampleIntroRuntime(createIntroRuntimeState(), 11).state, nowMs, 11)

    runIntroAudioRetry({
      getState: () => state,
      setState: (nextState) => { state = nextState },
      play: () => deferred.promise,
      seek: (timeSeconds) => seeks.push(timeSeconds),
      nowMs: () => nowMs,
      onSuccess: () => { successes += 1 },
    })
    state = requestIntroCompletion(state, 'skip').state
    nowMs = 12_500
    deferred.resolve()
    await flushDeferred(deferred)

    expect(state).toMatchObject({ completed: true, audioMode: 'fallback' })
    expect(seeks).toEqual([11])
    expect(successes).toBe(0)
  })

  it('does not commit a deferred retry after disposal', async () => {
    const deferred = createDeferred()
    let successes = 0
    let nowMs = 10_000
    let state = enterIntroFallback(sampleIntroRuntime(createIntroRuntimeState(), 11).state, nowMs, 11)

    runIntroAudioRetry({
      getState: () => state,
      setState: (nextState) => { state = nextState },
      play: () => deferred.promise,
      seek: () => undefined,
      nowMs: () => nowMs,
      onSuccess: () => { successes += 1 },
    })
    state = disposeIntroRuntime(state)
    nowMs = 12_500
    deferred.resolve()
    await flushDeferred(deferred)

    expect(state).toMatchObject({ disposed: true, audioMode: 'fallback' })
    expect(successes).toBe(0)
  })

  it('ignores an older retry promise after a newer attempt begins', async () => {
    const first = createDeferred()
    const second = createDeferred()
    const seeks: number[] = []
    let successes = 0
    let nowMs = 10_000
    let state = enterIntroFallback(sampleIntroRuntime(createIntroRuntimeState(), 11).state, nowMs, 11)
    const retry = (deferred: Deferred) => runIntroAudioRetry({
      getState: () => state,
      setState: (nextState) => { state = nextState },
      play: () => deferred.promise,
      seek: (timeSeconds) => seeks.push(timeSeconds),
      nowMs: () => nowMs,
      onSuccess: () => { successes += 1 },
    })

    retry(first)
    nowMs = 11_000
    retry(second)
    nowMs = 12_000
    first.resolve()
    await flushDeferred(first)
    expect(successes).toBe(0)
    expect(state.audioMode).toBe('fallback')

    nowMs = 13_000
    second.resolve()
    await flushDeferred(second)
    expect(successes).toBe(1)
    expect(state).toMatchObject({ timeSeconds: 14, audioMode: 'media' })
    expect(seeks).toEqual([11, 12, 14])
  })

  it('accepts a Start press in the same logical sample that crosses six seconds', () => {
    const sampled = sampleIntroRuntime(createIntroRuntimeState(), 6).state
    const request = requestIntroCompletion(sampled, 'start')

    expect(request.accepted).toBe(true)
    expect(request.state.completed).toBe(true)
  })

  it('accepts simultaneous completion requests exactly once', () => {
    const available = sampleIntroRuntime(createIntroRuntimeState(), 6).state
    const pointer = requestIntroCompletion(available, 'start')
    const gamepad = requestIntroCompletion(pointer.state, 'start')

    expect(pointer.accepted).toBe(true)
    expect(gamepad.accepted).toBe(false)
  })

  it('rejects every input after disposal until a new lifecycle activates', () => {
    const available = sampleIntroRuntime(createIntroRuntimeState(), 6).state
    const disposed = disposeIntroRuntime(available)

    expect(isIntroRuntimeActive(disposed)).toBe(false)
    expect(requestIntroCompletion(disposed, 'start').accepted).toBe(false)
    expect(requestIntroCompletion(disposed, 'skip').accepted).toBe(false)
    const active = activateIntroRuntime(disposed)
    expect(isIntroRuntimeActive(active)).toBe(true)
    expect(requestIntroCompletion(active, 'start').accepted).toBe(true)
    expect(isIntroRuntimeActive(requestIntroCompletion(active, 'start').state)).toBe(false)
  })
})
