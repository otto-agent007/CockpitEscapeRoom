import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  NEUTRAL_DC9_CONTROLS,
  advanceDc9Controls,
  combineDc9Input,
  dc9InputFromGamepad,
  type Dc9ControlInput,
  type Dc9ControlState,
  type Dc9HoldControl,
  type Dc9InputMethod,
} from './dc9Input'
import { dc9ControlCheckReached, type Dc9ControlCheckItemId } from './dc9ControlCheck'

export interface Dc9FlightControlsRuntime {
  /** Live positions, republished a few times a second for the HTML readouts. */
  controls: Dc9ControlState
  /** Per-frame positions for the 3D cockpit, without forcing a React render. */
  controlsRef: RefObject<Dc9ControlState>
  inputMethod: Dc9InputMethod
  setHoldControl: (control: Dc9HoldControl, pressed: boolean) => void
  /** Called by the 3D scene while the player is dragging the yoke itself. */
  setPointerInput: (input: Partial<Dc9ControlInput> | null) => void
}

interface UseDc9FlightControlsOptions {
  active: boolean
  completed: readonly Dc9ControlCheckItemId[]
  reducedMotion: boolean
  onReached: (controls: Dc9ControlState) => void
}

const CONTROLLED_KEY_CODES = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD',
])

/** How often the live positions are pushed into React state, in milliseconds. */
const PUBLISH_INTERVAL_MS = 80

/**
 * Reduced motion should not mean "cannot use the yoke", so the controls still travel —
 * they simply snap to the stops instead of sweeping there.
 */
const REDUCED_MOTION_RATE_SCALE = 8

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

function gamepadSnapshot(gamepad: Gamepad | null) {
  if (!gamepad) return null
  return { axes: Array.from(gamepad.axes), buttons: gamepad.buttons.map((button) => button.value) }
}

/**
 * Drives the parked DC-9 right-seat controls from keyboard, gamepad, native hold
 * buttons and a direct drag on the yoke, and reports each stop as it is reached.
 */
export function useDc9FlightControls(options: UseDc9FlightControlsOptions): Dc9FlightControlsRuntime {
  const { active, completed, reducedMotion, onReached } = options
  const [controls, setControls] = useState<Dc9ControlState>({ ...NEUTRAL_DC9_CONTROLS })
  const [inputMethod, setInputMethod] = useState<Dc9InputMethod>('keyboard')
  const controlsRef = useRef<Dc9ControlState>({ ...NEUTRAL_DC9_CONTROLS })
  const keysRef = useRef(new Set<string>())
  const holdsRef = useRef(new Set<Dc9HoldControl>())
  const pointerRef = useRef<Partial<Dc9ControlInput> | null>(null)
  const completedRef = useRef<Dc9ControlCheckItemId[]>([...completed])
  const reachedCallbackRef = useRef(onReached)
  const reducedMotionRef = useRef(reducedMotion)

  useEffect(() => {
    completedRef.current = [...completed]
  }, [completed])

  useEffect(() => {
    reachedCallbackRef.current = onReached
  }, [onReached])

  useEffect(() => {
    reducedMotionRef.current = reducedMotion
  }, [reducedMotion])

  const releaseAll = useCallback(() => {
    keysRef.current.clear()
    holdsRef.current.clear()
    pointerRef.current = null
  }, [])

  const setHoldControl = useCallback((control: Dc9HoldControl, pressed: boolean) => {
    if (pressed) holdsRef.current.add(control)
    else holdsRef.current.delete(control)
  }, [])

  const setPointerInput = useCallback((input: Partial<Dc9ControlInput> | null) => {
    pointerRef.current = input
  }, [])

  useEffect(() => {
    if (!active) {
      releaseAll()
      controlsRef.current = { ...NEUTRAL_DC9_CONTROLS }
      // Republished on the next tick rather than inline, so leaving the stage does not
      // cascade a render out of this effect.
      const recentre = window.setTimeout(() => setControls({ ...NEUTRAL_DC9_CONTROLS }), 0)
      return () => window.clearTimeout(recentre)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || !CONTROLLED_KEY_CODES.has(event.code)) return
      event.preventDefault()
      keysRef.current.add(event.code)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (!CONTROLLED_KEY_CODES.has(event.code)) return
      event.preventDefault()
      keysRef.current.delete(event.code)
    }
    const onBlur = () => releaseAll()
    const onVisibility = () => {
      if (document.hidden) releaseAll()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      releaseAll()
    }
  }, [active, releaseAll])

  useEffect(() => {
    if (!active) return
    let frameRequest = 0
    let previousTime = performance.now()
    let previousPublish = previousTime
    let previousMethod: Dc9InputMethod = 'keyboard'

    const tick = (now: number) => {
      const elapsed = Math.min(0.1, Math.max(0, (now - previousTime) / 1000))
      previousTime = now
      const gamepad = navigator.getGamepads?.().find((candidate) => candidate?.connected) ?? null
      const { input, method } = combineDc9Input(
        keysRef.current,
        holdsRef.current,
        dc9InputFromGamepad(gamepadSnapshot(gamepad)),
        pointerRef.current,
      )
      const next = advanceDc9Controls(
        controlsRef.current,
        input,
        reducedMotionRef.current ? elapsed * REDUCED_MOTION_RATE_SCALE : elapsed,
      )
      controlsRef.current = next

      const reached = dc9ControlCheckReached(next, completedRef.current)
      if (reached.length > 0) {
        completedRef.current = [...completedRef.current, ...reached]
        reachedCallbackRef.current(next)
      }

      if (now - previousPublish >= PUBLISH_INTERVAL_MS) {
        previousPublish = now
        setControls(next)
        if (method !== previousMethod) {
          previousMethod = method
          setInputMethod(method)
        }
      }
      frameRequest = window.requestAnimationFrame(tick)
    }

    frameRequest = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameRequest)
  }, [active])

  return { controls, controlsRef, inputMethod, setHoldControl, setPointerInput }
}
