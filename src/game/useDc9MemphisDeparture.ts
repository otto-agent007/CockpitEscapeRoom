import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  advanceDc9DepartureProgress,
  advanceDc9DepartureFrame,
  canonicalDc9DepartureFrame,
  dc9DepartureGuidance,
  type Dc9DepartureBeat,
  type Dc9DepartureCheckpoint,
  type Dc9DepartureEvent,
  type Dc9DepartureFrame,
  type Dc9DepartureGuidance,
  type Dc9DepartureProgress,
} from './dc9MemphisDeparture'
import type { Dc9ControlState } from './dc9Input'

export interface Dc9MemphisDepartureRuntime {
  active: boolean
  frame: Dc9DepartureFrame
  frameRef: RefObject<Dc9DepartureFrame>
  guidance: Dc9DepartureGuidance
  confirmLineup: () => void
  restoreCheckpoint: () => void
}

interface UseDc9MemphisDepartureOptions {
  active: boolean
  progress: Dc9DepartureProgress
  controlsRef: RefObject<Dc9ControlState>
  reducedMotion: boolean
  resetControls: () => void
  onCheckpoint: (checkpoint: Dc9DepartureCheckpoint) => void
  onMistake: (beat: Dc9DepartureBeat) => void
  onRestore: () => void
  onComplete: () => void
}

const PUBLISH_INTERVAL_MS = 80

export interface Dc9DepartureHtmlPublication {
  frame: Dc9DepartureFrame
  guidance: Dc9DepartureGuidance
}

interface Dc9DepartureHtmlPublicationSchedulerOptions {
  schedule: (callback: () => void, delayMs: number) => unknown
  cancel: (handle: unknown) => void
  publish: (publication: Dc9DepartureHtmlPublication) => void
}

export interface Dc9DepartureHtmlPublicationScheduler {
  request: (publication: Dc9DepartureHtmlPublication) => void
  clear: () => void
  dispose: () => void
}

export interface Dc9DepartureCompletionGate {
  request: (committedCheckpoint: Dc9DepartureCheckpoint, onComplete: () => void) => void
  commit: (committedCheckpoint: Dc9DepartureCheckpoint, onComplete: () => void) => void
  clear: () => void
}

interface Dc9DepartureDurableCallbacks {
  onCheckpoint: (checkpoint: Dc9DepartureCheckpoint) => void
  onMistake: (beat: Dc9DepartureBeat) => void
  onComplete: () => void
}

/** Defers one terminal callback until React has committed the preceding climb checkpoint. */
export function createDc9DepartureCompletionGate(): Dc9DepartureCompletionGate {
  let pending = false
  let completed = false
  const flush = (committedCheckpoint: Dc9DepartureCheckpoint, onComplete: () => void) => {
    if (!pending || completed || committedCheckpoint !== 'initialClimb') return
    pending = false
    completed = true
    onComplete()
  }

  return {
    request: (committedCheckpoint, onComplete) => {
      if (completed) return
      pending = true
      flush(committedCheckpoint, onComplete)
    },
    commit: flush,
    clear: () => {
      pending = false
      completed = false
    },
  }
}

/** Coalesces visual updates without delaying durable reducer callbacks. */
export function createDc9DepartureHtmlPublicationScheduler(
  options: Dc9DepartureHtmlPublicationSchedulerOptions,
): Dc9DepartureHtmlPublicationScheduler {
  let pending: Dc9DepartureHtmlPublication | null = null
  let timer: unknown | null = null
  let disposed = false

  const clear = () => {
    pending = null
    if (timer !== null) options.cancel(timer)
    timer = null
  }
  const flush = () => {
    timer = null
    if (disposed || !pending) return
    const publication = pending
    pending = null
    options.publish(publication)
  }

  return {
    request: (publication) => {
      if (disposed) return
      pending = { ...publication, frame: { ...publication.frame } }
      if (timer === null) timer = options.schedule(flush, PUBLISH_INTERVAL_MS)
    },
    clear,
    dispose: () => {
      clear()
      disposed = true
    },
  }
}

function isStoppedControls(controls: Dc9ControlState): boolean {
  return controls.pitch === 0 && controls.roll === 0 && controls.rudder === 0 && controls.thrust === 0
}

function isCanonicalFrame(frame: Dc9DepartureFrame, checkpoint: Dc9DepartureCheckpoint): boolean {
  const canonical = canonicalDc9DepartureFrame(checkpoint)
  return frame.beat === canonical.beat
    && frame.pathProgress === canonical.pathProgress
    && frame.lateralError === canonical.lateralError
    && frame.headingError === canonical.headingError
    && frame.energy === canonical.energy
    && frame.altitudeProgress === canonical.altitudeProgress
    && frame.pitch === canonical.pitch
    && frame.roll === canonical.roll
    && frame.safeHold === canonical.safeHold
    && frame.deviationSeconds === canonical.deviationSeconds
    && frame.fixedStepRemainderSeconds === 0
}

function eventIdentity(event: Dc9DepartureEvent, progress: Dc9DepartureProgress): string {
  switch (event.type) {
    case 'checkpoint': return `checkpoint:${event.checkpoint}`
    case 'complete': return 'complete'
    case 'mistake': return `mistake:${event.beat}:${event.reason}:${progress.attempts[event.beat] ?? 0}`
  }
}

/** Dispatch a Task 2 event at once and return its local durable-progress projection. */
export function dispatchDc9DepartureDurableEvent(
  event: Dc9DepartureEvent,
  progress: Dc9DepartureProgress,
  emitted: Set<string>,
  callbacks: Dc9DepartureDurableCallbacks,
): Dc9DepartureProgress | null {
  const identity = eventIdentity(event, progress)
  if (emitted.has(identity)) return null
  emitted.add(identity)
  if (event.type === 'checkpoint') callbacks.onCheckpoint(event.checkpoint)
  else if (event.type === 'mistake') callbacks.onMistake(event.beat)
  else callbacks.onComplete()
  return advanceDc9DepartureProgress(progress, event)
}

/**
 * Adapts the deterministic departure rules to browser input and rendering. Durable game
 * state changes happen only when Task 2 emits an event; the per-frame remainder stays here.
 */
export function useDc9MemphisDeparture(options: UseDc9MemphisDepartureOptions): Dc9MemphisDepartureRuntime {
  const { active, progress, controlsRef, reducedMotion, resetControls, onCheckpoint, onMistake, onRestore, onComplete } = options
  const initialFrame = canonicalDc9DepartureFrame(progress.checkpoint)
  const [frame, setFrame] = useState<Dc9DepartureFrame>(initialFrame)
  const [guidance, setGuidance] = useState<Dc9DepartureGuidance>(() => dc9DepartureGuidance(initialFrame, progress.hintLevel))
  const frameRef = useRef<Dc9DepartureFrame>(initialFrame)
  const progressRef = useRef(progress)
  const committedCheckpointRef = useRef(progress.checkpoint)
  const reducedMotionRef = useRef(reducedMotion)
  const lineupConfirmedRef = useRef(false)
  const pauseLatchRef = useRef(false)
  const activeRef = useRef(active)
  const selfAdvancedCheckpointRef = useRef<Dc9DepartureCheckpoint | null>(null)
  const emittedEventsRef = useRef(new Set<string>())
  const completionGateRef = useRef(createDc9DepartureCompletionGate())
  const callbacksRef = useRef({ resetControls, onCheckpoint, onMistake, onRestore, onComplete })
  // The scheduler is created lazily and released to null on unmount, so a
  // strict-mode remount rebuilds a live scheduler instead of keeping a
  // disposed one captured in the ref (which froze every HTML publication).
  const htmlPublicationSchedulerRef = useRef<Dc9DepartureHtmlPublicationScheduler | null>(null)
  const getHtmlPublicationScheduler = useCallback(() => {
    htmlPublicationSchedulerRef.current ??= createDc9DepartureHtmlPublicationScheduler({
      schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
      cancel: (handle) => window.clearTimeout(handle as number),
      publish: (publication) => {
        setFrame(publication.frame)
        setGuidance(publication.guidance)
      },
    })
    return htmlPublicationSchedulerRef.current
  }, [])

  useEffect(() => {
    callbacksRef.current = { resetControls, onCheckpoint, onMistake, onRestore, onComplete }
  }, [resetControls, onCheckpoint, onMistake, onRestore, onComplete])
  useEffect(() => {
    progressRef.current = progress
    committedCheckpointRef.current = progress.checkpoint
    completionGateRef.current.commit(progress.checkpoint, callbacksRef.current.onComplete)
  }, [progress])
  useEffect(() => { reducedMotionRef.current = reducedMotion }, [reducedMotion])
  useEffect(() => { activeRef.current = active }, [active])
  useEffect(() => () => {
    completionGateRef.current.clear()
    htmlPublicationSchedulerRef.current?.dispose()
    htmlPublicationSchedulerRef.current = null
  }, [])

  const scheduleHtmlPublication = useCallback((next: Dc9DepartureFrame, nextProgress = progressRef.current) => {
    getHtmlPublicationScheduler().request({
      frame: next,
      guidance: dc9DepartureGuidance(next, nextProgress.hintLevel),
    })
  }, [getHtmlPublicationScheduler])

  const restoreCheckpoint = useCallback(() => {
    if (!activeRef.current) return
    completionGateRef.current.clear()
    // A restored flight may legitimately complete again, so the completion
    // event identity must be re-emittable after a restore.
    emittedEventsRef.current.delete('complete')
    const checkpoint = progressRef.current.checkpoint
    const currentControls = controlsRef.current ?? { pitch: 0, roll: 0, thrust: 0, rudder: 0 }
    const alreadyRestored = pauseLatchRef.current
      && !lineupConfirmedRef.current
      && isStoppedControls(currentControls)
      && isCanonicalFrame(frameRef.current, checkpoint)
    if (alreadyRestored) return

    pauseLatchRef.current = true
    lineupConfirmedRef.current = false
    const canonical = canonicalDc9DepartureFrame(checkpoint)
    frameRef.current = canonical
    callbacksRef.current.resetControls()
    scheduleHtmlPublication(canonical)
    callbacksRef.current.onRestore()
  }, [controlsRef, scheduleHtmlPublication])

  const confirmLineup = useCallback(() => {
    if (!active || frameRef.current.beat !== 'holdShort') return
    pauseLatchRef.current = false
    // Record the intent and let the rules decide. The button is drawn from a
    // frame published up to 80 ms ago, so requiring the live frame to already
    // read "settled" swallowed presses that landed a frame early.
    lineupConfirmedRef.current = true
  }, [active])

  useEffect(() => {
    if (!active) {
      completionGateRef.current.clear()
      htmlPublicationSchedulerRef.current?.clear()
      selfAdvancedCheckpointRef.current = null
      return
    }
    // Seed the live frame from the durable checkpoint on entry, reload, or an
    // externally changed save — but never when the running flight just reached
    // this checkpoint itself. Its frame is already rolling past the canonical
    // stopped pose, and re-seeding there halted the aircraft and respooled its
    // energy from zero at every checkpoint.
    if (selfAdvancedCheckpointRef.current === progress.checkpoint) return
    const canonical = canonicalDc9DepartureFrame(progress.checkpoint)
    frameRef.current = canonical
    emittedEventsRef.current.clear()
    lineupConfirmedRef.current = false
    pauseLatchRef.current = false
    scheduleHtmlPublication(canonical)
  }, [active, progress.checkpoint, scheduleHtmlPublication])

  useEffect(() => {
    if (!active) return
    const onPause = () => restoreCheckpoint()
    const onVisibility = () => {
      if (document.hidden) onPause()
    }
    window.addEventListener('blur', onPause)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', onPause)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active, restoreCheckpoint])

  useEffect(() => {
    if (!active) return
    let frameRequest = 0
    let previousTime = performance.now()

    const tick = (now: number) => {
      const controls = controlsRef.current ?? { pitch: 0, roll: 0, thrust: 0, rudder: 0 }
      const input = {
        ...controls,
        lineupConfirmed: lineupConfirmedRef.current,
      }
      const hasFreshInput = !isStoppedControls(controls) || input.lineupConfirmed
      if (pauseLatchRef.current && !hasFreshInput) {
        previousTime = now
        frameRequest = window.requestAnimationFrame(tick)
        return
      }
      if (pauseLatchRef.current) {
        pauseLatchRef.current = false
        previousTime = now
      }

      const elapsed = Math.min(0.1, Math.max(0, (now - previousTime) / 1000))
      previousTime = now
      const step = advanceDc9DepartureFrame(frameRef.current, input, elapsed)
      // The confirmation waits at the hold until the aircraft has actually
      // settled, and is withdrawn the moment the player commands thrust again.
      // Consuming it after a single frame silently dropped one-press confirms.
      if (step.frame.beat !== 'holdShort' || controls.thrust > 0) lineupConfirmedRef.current = false
      frameRef.current = step.frame

      if (step.event) {
        const durableCallbacks = step.event.type === 'complete'
          ? {
            ...callbacksRef.current,
            onComplete: () => completionGateRef.current.request(
              committedCheckpointRef.current,
              callbacksRef.current.onComplete,
            ),
          }
          : callbacksRef.current
        const nextProgress = dispatchDc9DepartureDurableEvent(
          step.event,
          progressRef.current,
          emittedEventsRef.current,
          durableCallbacks,
        )
        if (nextProgress) {
          progressRef.current = nextProgress
          if (step.event.type === 'checkpoint') selfAdvancedCheckpointRef.current = step.event.checkpoint
          if (step.event.type === 'mistake') {
            pauseLatchRef.current = true
            callbacksRef.current.resetControls()
          }
          scheduleHtmlPublication(step.frame, nextProgress)
        }
      }

      scheduleHtmlPublication(step.frame)
      // Reduced motion changes only surrounding presentation; this deterministic adapter
      // deliberately sends the same normalized input and time to Task 2 either way.
      void reducedMotionRef.current
      frameRequest = window.requestAnimationFrame(tick)
    }

    frameRequest = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameRequest)
  }, [active, controlsRef, scheduleHtmlPublication])

  return { active, frame, frameRef, guidance, confirmLineup, restoreCheckpoint }
}
