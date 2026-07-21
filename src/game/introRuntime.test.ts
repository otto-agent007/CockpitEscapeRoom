import { describe, expect, it } from 'vitest'
import { INTRO_DURATION_SECONDS } from './introConfig'
import {
  createIntroRuntimeState,
  disposeIntroRuntime,
  enterIntroFallback,
  isIntroRuntimeActive,
  requestIntroHandoff,
  resetIntroRuntimeLoop,
  runIntroAudioRetry,
  sampleIntroClock,
  sampleIntroHandoff,
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

async function settle(deferred: Deferred): Promise<void> {
  await deferred.promise.catch(() => undefined)
  await Promise.resolve()
}

describe('TMB2 intro runtime', () => {
  it('latches PRESS START at exactly six seconds and preserves it across loops', () => {
    let state = createIntroRuntimeState()
    state = sampleIntroRuntime(state, 5.999).state
    expect(state.startAvailable).toBe(false)

    state = sampleIntroRuntime(state, 6).state
    expect(state.startAvailable).toBe(true)

    const end = sampleIntroRuntime(state, INTRO_DURATION_SECONDS)
    expect(end.didLoop).toBe(true)
    state = resetIntroRuntimeLoop(end.state, 53_040)
    expect(state).toMatchObject({
      phase: 'playing',
      timeSeconds: 0,
      startAvailable: true,
    })
  })

  it('resets fallback time at the same 53.04-second boundary', () => {
    let state = sampleIntroRuntime(createIntroRuntimeState(), 10).state
    state = enterIntroFallback(state, 20_000, 10)
    const end = sampleIntroClock(state, {
      nowMs: 20_000 + (INTRO_DURATION_SECONDS - 10) * 1_000,
      mediaTimeSeconds: 10,
    })
    expect(end.didLoop).toBe(true)

    state = resetIntroRuntimeLoop(end.state, 63_040)
    expect(state).toMatchObject({
      phase: 'playing',
      timeSeconds: 0,
      audioMode: 'fallback',
      fallbackStartedAtMs: 63_040,
    })
  })

  it('rejects Start before six seconds and accepts simultaneous requests once', () => {
    const early = requestIntroHandoff(sampleIntroRuntime(createIntroRuntimeState(), 5.999).state, 5_999)
    expect(early.accepted).toBe(false)
    expect(early.state.phase).toBe('playing')

    const available = sampleIntroRuntime(createIntroRuntimeState(), 6).state
    const pointer = requestIntroHandoff(available, 6_000)
    const gamepad = requestIntroHandoff(pointer.state, 6_000)
    expect(pointer.accepted).toBe(true)
    expect(pointer.state).toMatchObject({ phase: 'handoff', handoffStartedAtMs: 6_000 })
    expect(gamepad.accepted).toBe(false)
  })

  it('fades music for 300ms and completes the handoff once at 650ms', () => {
    const available = sampleIntroRuntime(createIntroRuntimeState(), 6).state
    const requested = requestIntroHandoff(available, 10_000).state

    expect(sampleIntroHandoff(requested, 10_000)).toMatchObject({
      audioGain: 1,
      progress: 0,
      shouldComplete: false,
    })
    const midpoint = sampleIntroHandoff(requested, 10_150)
    expect(midpoint).toMatchObject({
      audioGain: 0.5,
      shouldComplete: false,
    })
    expect(midpoint.progress).toBeCloseTo(150 / 650)
    const faded = sampleIntroHandoff(requested, 10_300)
    expect(faded).toMatchObject({
      audioGain: 0,
      shouldComplete: false,
    })
    expect(faded.progress).toBeCloseTo(300 / 650)

    const complete = sampleIntroHandoff(requested, 10_650)
    expect(complete).toMatchObject({ audioGain: 0, progress: 1, shouldComplete: true })
    expect(complete.state.phase).toBe('completed')
    expect(sampleIntroHandoff(complete.state, 11_000).shouldComplete).toBe(false)
  })

  it('keeps fallback authoritative while a sound retry is pending', async () => {
    const deferred = createDeferred()
    const seeks: number[] = []
    let nowMs = 10_000
    let state = enterIntroFallback(sampleIntroRuntime(createIntroRuntimeState(), 11).state, nowMs, 11)

    expect(runIntroAudioRetry({
      getState: () => state,
      setState: (nextState) => { state = nextState },
      play: () => deferred.promise,
      seek: (timeSeconds) => seeks.push(timeSeconds),
      nowMs: () => nowMs,
      onSuccess: () => undefined,
    })).toBe(true)
    expect(state.audioMode).toBe('fallback')
    expect(seeks).toEqual([11])

    nowMs = 12_500
    deferred.resolve()
    await settle(deferred)
    expect(state).toMatchObject({ timeSeconds: 13.5, audioMode: 'media', phase: 'playing' })
    expect(seeks).toEqual([11, 13.5])
  })

  it('ignores stale sound retry promises after handoff starts', async () => {
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
    state = requestIntroHandoff(state, 10_100).state
    nowMs = 12_500
    deferred.resolve()
    await settle(deferred)

    expect(state.phase).toBe('handoff')
    expect(state.audioMode).toBe('fallback')
    expect(successes).toBe(0)
  })

  it('rejects all work after disposal', () => {
    const active = sampleIntroRuntime(createIntroRuntimeState(), 6).state
    const disposed = disposeIntroRuntime(active)
    expect(isIntroRuntimeActive(disposed)).toBe(false)
    expect(requestIntroHandoff(disposed, 6_000).accepted).toBe(false)
    expect(sampleIntroRuntime(disposed, 20).state).toBe(disposed)
  })
})
