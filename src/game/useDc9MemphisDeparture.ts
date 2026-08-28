import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
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
import { normalizeDc9BrakeDemand, type Dc9ControlState } from './dc9Input'

export interface Dc9MemphisDepartureRuntime {
  active: boolean
  frame: Dc9DepartureFrame
  frameRef: RefObject<Dc9DepartureFrame>
  guidance: Dc9DepartureGuidance
  brakeHeld: boolean
  setBrakeHeld: (pressed: boolean) => void
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

/**
 * Adapts the deterministic departure rules to browser input and rendering. Durable game
 * state changes happen only when Task 2 emits an event; the per-frame remainder stays here.
 */
export function useDc9MemphisDeparture(options: UseDc9MemphisDepartureOptions): Dc9MemphisDepartureRuntime {
  const { active, progress, controlsRef, reducedMotion, resetControls, onCheckpoint, onMistake, onRestore, onComplete } = options
  const initialFrame = canonicalDc9DepartureFrame(progress.checkpoint)
  const [frame, setFrame] = useState<Dc9DepartureFrame>(initialFrame)
  const [guidance, setGuidance] = useState<Dc9DepartureGuidance>(() => dc9DepartureGuidance(initialFrame, progress.hintLevel))
  const [brakeHeld, setBrakeHeldState] = useState(false)
  const frameRef = useRef<Dc9DepartureFrame>(initialFrame)
  const progressRef = useRef(progress)
  const reducedMotionRef = useRef(reducedMotion)
  const brakeHeldRef = useRef(false)
  const lineupConfirmedRef = useRef(false)
  const pauseLatchRef = useRef(false)
  const emittedEventsRef = useRef(new Set<string>())
  const callbacksRef = useRef({ resetControls, onCheckpoint, onMistake, onRestore, onComplete })

  useEffect(() => { progressRef.current = progress }, [progress])
  useEffect(() => { reducedMotionRef.current = reducedMotion }, [reducedMotion])
  useEffect(() => {
    callbacksRef.current = { resetControls, onCheckpoint, onMistake, onRestore, onComplete }
  }, [resetControls, onCheckpoint, onMistake, onRestore, onComplete])

  const publish = useCallback((next: Dc9DepartureFrame) => {
    setFrame({ ...next })
    setGuidance(dc9DepartureGuidance(next, progressRef.current.hintLevel))
  }, [])

  const setBrakeHeld = useCallback((pressed: boolean) => {
    const next = pressed === true
    brakeHeldRef.current = next
    if (next) pauseLatchRef.current = false
    setBrakeHeldState(next)
  }, [])

  const restoreCheckpoint = useCallback(() => {
    const checkpoint = progressRef.current.checkpoint
    const currentControls = controlsRef.current ?? { pitch: 0, roll: 0, thrust: 0, rudder: 0 }
    const alreadyRestored = pauseLatchRef.current
      && !brakeHeldRef.current
      && !lineupConfirmedRef.current
      && isStoppedControls(currentControls)
      && isCanonicalFrame(frameRef.current, checkpoint)
    if (alreadyRestored) return

    pauseLatchRef.current = true
    lineupConfirmedRef.current = false
    brakeHeldRef.current = false
    setBrakeHeldState(false)
    const canonical = canonicalDc9DepartureFrame(checkpoint)
    frameRef.current = canonical
    callbacksRef.current.resetControls()
    publish(canonical)
    callbacksRef.current.onRestore()
  }, [controlsRef, publish])

  const confirmLineup = useCallback(() => {
    if (!active || frameRef.current.beat !== 'holdShort' || !frameRef.current.safeHold) return
    pauseLatchRef.current = false
    lineupConfirmedRef.current = true
  }, [active])

  useEffect(() => {
    const canonical = canonicalDc9DepartureFrame(progress.checkpoint)
    frameRef.current = canonical
    emittedEventsRef.current.clear()
    lineupConfirmedRef.current = false
    brakeHeldRef.current = false
    pauseLatchRef.current = false
    const refresh = window.setTimeout(() => {
      setBrakeHeldState(false)
      publish(canonical)
    }, 0)
    return () => window.clearTimeout(refresh)
  }, [active, progress.checkpoint, publish])

  useEffect(() => {
    if (!active) return
    const clearBrake = () => setBrakeHeld(false)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return
      event.preventDefault()
      setBrakeHeld(true)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      event.preventDefault()
      clearBrake()
    }
    const onPause = () => restoreCheckpoint()
    const onVisibility = () => {
      if (document.hidden) onPause()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onPause)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onPause)
      document.removeEventListener('visibilitychange', onVisibility)
      clearBrake()
    }
  }, [active, restoreCheckpoint, setBrakeHeld])

  useEffect(() => {
    if (!active) return
    let frameRequest = 0
    let previousTime = performance.now()
    let previousPublish = previousTime

    const tick = (now: number) => {
      const controls = controlsRef.current ?? { pitch: 0, roll: 0, thrust: 0, rudder: 0 }
      const input = {
        ...controls,
        brake: normalizeDc9BrakeDemand(brakeHeldRef.current ? 1 : 0),
        lineupConfirmed: lineupConfirmedRef.current,
      }
      const hasFreshInput = !isStoppedControls(controls) || input.brake > 0 || input.lineupConfirmed
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
      lineupConfirmedRef.current = false
      frameRef.current = step.frame

      if (step.event) {
        const identity = eventIdentity(step.event, progressRef.current)
        if (!emittedEventsRef.current.has(identity)) {
          emittedEventsRef.current.add(identity)
          if (step.event.type === 'checkpoint') callbacksRef.current.onCheckpoint(step.event.checkpoint)
          else if (step.event.type === 'mistake') {
            pauseLatchRef.current = true
            callbacksRef.current.resetControls()
            callbacksRef.current.onMistake(step.event.beat)
          } else callbacksRef.current.onComplete()
        }
      }

      if (now - previousPublish >= PUBLISH_INTERVAL_MS || step.event) {
        previousPublish = now
        publish(step.frame)
      }
      // Reduced motion changes only surrounding presentation; this deterministic adapter
      // deliberately sends the same normalized input and time to Task 2 either way.
      void reducedMotionRef.current
      frameRequest = window.requestAnimationFrame(tick)
    }

    frameRequest = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameRequest)
  }, [active, controlsRef, publish])

  return { active, frame, frameRef, guidance, brakeHeld, setBrakeHeld, confirmLineup, restoreCheckpoint }
}
