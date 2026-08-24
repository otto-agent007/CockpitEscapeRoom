import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'
import {
  createEngineOutStateAtCheckpoint,
  restartEngineOutCheckpoint,
  type EngineOutCheckpoint,
  type EngineOutTrait,
} from './airbusEngineOut'
import {
  airbusInputFromGamepad,
  combineAirbusInput,
  ZERO_AIRBUS_INPUT,
  type AirbusFlightInput,
  type AirbusHoldControl,
  type AirbusInputMethod,
} from './airbusInput'
import {
  advanceAirbusScenarioFrame,
  type AirbusActiveSimulationFrame,
  type AirbusScenarioId,
} from './airbusScenario'
import {
  createStormLineStateAtCheckpoint,
  restartStormLineCheckpoint,
  type StormLineCheckpoint,
  type StormLineTrait,
} from './airbusSimulator'
import type { AirbusWorkloadTaskId } from './airbusWorkload'

export type StormLineHoldControl = AirbusHoldControl

export interface AirbusSimulatorRuntime {
  activeFrame: AirbusActiveSimulationFrame | null
  activeFrameRef: MutableRefObject<AirbusActiveSimulationFrame | null>
  input: AirbusFlightInput
  inputRef: MutableRefObject<AirbusFlightInput>
  paused: boolean
  inputMethod: AirbusInputMethod
  soundEnabled: boolean
  workloadGate: AirbusWorkloadTaskId | null
  togglePause: () => void
  retryCheckpoint: () => void
  setHoldControl: (control: AirbusHoldControl, pressed: boolean) => void
  toggleSound: () => void
}

interface UseAirbusSimulatorOptions {
  activeScenario: AirbusScenarioId | null
  stormLine: {
    checkpoint: StormLineCheckpoint
    attempts: Record<StormLineCheckpoint, number>
  }
  engineOut: {
    checkpoint: EngineOutCheckpoint
    attempts: Record<EngineOutCheckpoint, number>
  }
  completedWorkloadTasks: readonly AirbusWorkloadTaskId[]
  onStormCheckpoint: (
    checkpoint: StormLineCheckpoint,
    attempts: Record<StormLineCheckpoint, number>,
  ) => void
  onStormComplete: (traits: StormLineTrait[]) => void
  onEngineOutCheckpoint: (
    checkpoint: EngineOutCheckpoint,
    attempts: Record<EngineOutCheckpoint, number>,
  ) => void
  onEngineOutComplete: (traits: EngineOutTrait[]) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

function createActiveFrame(
  scenario: AirbusScenarioId,
  options: Pick<UseAirbusSimulatorOptions, 'stormLine' | 'engineOut'>,
): AirbusActiveSimulationFrame {
  if (scenario === 'stormLine') {
    return {
      scenario,
      state: createStormLineStateAtCheckpoint(
        options.stormLine.checkpoint,
        options.stormLine.attempts,
      ),
    }
  }

  const state = createEngineOutStateAtCheckpoint(options.engineOut.checkpoint)
  return {
    scenario,
    state: {
      ...state,
      attempts: { ...options.engineOut.attempts },
    },
  }
}

function gamepadSnapshot(gamepad: Gamepad | null) {
  if (!gamepad) return null
  return {
    axes: Array.from(gamepad.axes),
    buttons: gamepad.buttons.map((button) => button.value),
  }
}

export function useAirbusSimulator(options: UseAirbusSimulatorOptions): AirbusSimulatorRuntime {
  const {
    activeScenario,
    stormLine,
    engineOut,
    completedWorkloadTasks,
    onStormCheckpoint,
    onStormComplete,
    onEngineOutCheckpoint,
    onEngineOutComplete,
  } = options
  const [activeFrame, setActiveFrame] = useState<AirbusActiveSimulationFrame | null>(() =>
    activeScenario ? createActiveFrame(activeScenario, options) : null,
  )
  const [input, setInput] = useState<AirbusFlightInput>({ ...ZERO_AIRBUS_INPUT })
  const [paused, setPaused] = useState(false)
  const [inputMethod, setInputMethod] = useState<AirbusInputMethod>('keyboard')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [workloadGate, setWorkloadGate] = useState<AirbusWorkloadTaskId | null>(null)
  const activeFrameRef = useRef<AirbusActiveSimulationFrame | null>(activeFrame)
  const inputRef = useRef<AirbusFlightInput>({ ...ZERO_AIRBUS_INPUT })
  const keysRef = useRef(new Set<string>())
  const holdsRef = useRef(new Set<AirbusHoldControl>())
  const previousScenarioRef = useRef<AirbusScenarioId | null>(activeScenario)
  const completedRef = useRef(false)
  const audioRef = useRef<{
    context: AudioContext
    gain: GainNode
    oscillator: OscillatorNode
    hum: OscillatorNode
    noise: AudioBufferSourceNode
    filter: BiquadFilterNode
  } | null>(null)

  const clearInputRefs = useCallback(() => {
    keysRef.current.clear()
    holdsRef.current.clear()
  }, [])

  const clearInput = useCallback(() => {
    clearInputRefs()
    const centered = { ...ZERO_AIRBUS_INPUT }
    inputRef.current = centered
    setInput(centered)
  }, [clearInputRefs])

  useEffect(() => {
    let nextPublishedFrame: AirbusActiveSimulationFrame | null | undefined
    let resetPause = false
    let resetWorkloadGate = false
    if (activeScenario && previousScenarioRef.current !== activeScenario) {
      const restored = createActiveFrame(activeScenario, { stormLine, engineOut })
      activeFrameRef.current = restored
      nextPublishedFrame = restored
      completedRef.current = false
      resetPause = true
      resetWorkloadGate = true
    } else if (!activeScenario) {
      activeFrameRef.current = null
      nextPublishedFrame = null
      completedRef.current = false
      resetPause = true
      resetWorkloadGate = true
      clearInputRefs()
    } else if (!activeFrameRef.current) {
      const restored = createActiveFrame(activeScenario, { stormLine, engineOut })
      activeFrameRef.current = restored
      nextPublishedFrame = restored
      completedRef.current = false
    }
    previousScenarioRef.current = activeScenario
    if (nextPublishedFrame === undefined) return
    const publishTimeout = window.setTimeout(() => {
      setActiveFrame(nextPublishedFrame)
      if (resetPause) setPaused(false)
      if (resetWorkloadGate) setWorkloadGate(null)
    }, 0)
    return () => window.clearTimeout(publishTimeout)
  }, [activeScenario, clearInputRefs, engineOut, stormLine])

  useEffect(() => {
    if (!activeScenario) return
    const controlledCodes = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'KeyW',
      'KeyS',
      'KeyA',
      'KeyD',
    ])
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || !controlledCodes.has(event.code)) return
      event.preventDefault()
      keysRef.current.add(event.code)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (!controlledCodes.has(event.code)) return
      event.preventDefault()
      keysRef.current.delete(event.code)
    }
    const onBlur = () => clearInput()
    const onVisibility = () => {
      if (document.hidden) {
        clearInput()
        setPaused(true)
      }
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
      clearInputRefs()
    }
  }, [activeScenario, clearInput, clearInputRefs])

  useEffect(() => {
    if (!activeScenario) return
    let frameRequest = 0
    let previousTime = performance.now()
    let previousPublishTime = previousTime

    const tick = (now: number) => {
      const deltaSeconds = Math.min(0.1, Math.max(0, (now - previousTime) / 1000))
      previousTime = now
      const gamepad = navigator.getGamepads?.().find((candidate) => candidate?.connected) ?? null
      const directionalEnabled = activeScenario === 'engineOut'
      const combined = combineAirbusInput(
        keysRef.current,
        holdsRef.current,
        airbusInputFromGamepad(gamepadSnapshot(gamepad), directionalEnabled),
        directionalEnabled,
      )
      inputRef.current = combined.input
      setInput((current) => (
        current.pitch === combined.input.pitch
        && current.bank === combined.input.bank
        && current.thrust === combined.input.thrust
        && current.directional === combined.input.directional
          ? current
          : combined.input
      ))
      setInputMethod((current) => current === combined.method ? current : combined.method)

      const currentFrame = activeFrameRef.current
      if (!paused && currentFrame && currentFrame.state.phase === 'flying') {
        const transition = advanceAirbusScenarioFrame(
          currentFrame,
          combined.input,
          deltaSeconds,
          completedWorkloadTasks,
        )
        activeFrameRef.current = transition.frame
        setWorkloadGate((current) => current === (transition.workloadGate ?? null)
          ? current
          : transition.workloadGate ?? null)
        if (transition.workloadGate) {
          clearInputRefs()
          const centered = { ...ZERO_AIRBUS_INPUT }
          inputRef.current = centered
          setInput(centered)
        }

        if (transition.checkpointReached) {
          if (transition.frame.scenario === 'stormLine') {
            onStormCheckpoint(transition.frame.state.checkpoint, transition.frame.state.attempts)
          } else {
            onEngineOutCheckpoint(transition.frame.state.checkpoint, transition.frame.state.attempts)
          }
        }
        if (transition.completed && !completedRef.current) {
          completedRef.current = true
          if (transition.frame.scenario === 'stormLine') {
            onStormComplete(transition.frame.state.traits)
          } else {
            onEngineOutComplete((transition.traits ?? []) as EngineOutTrait[])
          }
        }
      }

      const publishedFrame = activeFrameRef.current
      if (
        now - previousPublishTime >= 80 ||
        (publishedFrame !== null && publishedFrame.state.phase !== 'flying')
      ) {
        previousPublishTime = now
        setActiveFrame(publishedFrame
          ? { ...publishedFrame, state: { ...publishedFrame.state } } as AirbusActiveSimulationFrame
          : null)
      }
      frameRequest = requestAnimationFrame(tick)
    }

    frameRequest = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRequest)
  }, [
    activeScenario,
    clearInputRefs,
    completedWorkloadTasks,
    onEngineOutCheckpoint,
    onEngineOutComplete,
    onStormCheckpoint,
    onStormComplete,
    paused,
  ])

  const simulatorIntensity = activeFrame?.scenario === 'stormLine'
    ? activeFrame.state.weatherIntensity
    : activeFrame?.scenario === 'engineOut'
      ? activeFrame.state.aircraft.rightEnginePower - activeFrame.state.aircraft.leftEnginePower
      : 0

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.gain.gain.setTargetAtTime(
      soundEnabled && activeScenario && !paused ? 0.055 + simulatorIntensity * 0.1 : 0,
      audio.context.currentTime,
      0.08,
    )
    audio.filter.frequency.setTargetAtTime(
      260 + simulatorIntensity * 720,
      audio.context.currentTime,
      0.12,
    )
    audio.hum.frequency.setTargetAtTime(
      56 + simulatorIntensity * 26,
      audio.context.currentTime,
      0.25,
    )
  }, [activeScenario, paused, simulatorIntensity, soundEnabled])

  useEffect(() => () => {
    const audio = audioRef.current
    if (!audio) return
    audio.oscillator.stop()
    audio.hum.stop()
    audio.noise.stop()
    void audio.context.close()
    audioRef.current = null
  }, [])

  const togglePause = useCallback(() => {
    clearInput()
    setPaused((current) => !current)
  }, [clearInput])

  const retryCheckpoint = useCallback(() => {
    const frame = activeFrameRef.current
    if (!frame) return
    const restarted: AirbusActiveSimulationFrame = frame.scenario === 'stormLine'
      ? { scenario: 'stormLine', state: restartStormLineCheckpoint(frame.state) }
      : { scenario: 'engineOut', state: restartEngineOutCheckpoint(frame.state) }
    activeFrameRef.current = restarted
    setActiveFrame(restarted)
    clearInput()
    if (restarted.scenario === 'stormLine') {
      onStormCheckpoint(restarted.state.checkpoint, restarted.state.attempts)
    } else {
      onEngineOutCheckpoint(restarted.state.checkpoint, restarted.state.attempts)
    }
  }, [clearInput, onEngineOutCheckpoint, onStormCheckpoint])

  const setHoldControl = useCallback((control: AirbusHoldControl, pressed: boolean) => {
    if (pressed) holdsRef.current.add(control)
    else holdsRef.current.delete(control)
  }, [])

  const ensureAudio = useCallback((): boolean => {
    if (audioRef.current) return true
    try {
      const context = new window.AudioContext()
      const oscillator = context.createOscillator()
      const hum = context.createOscillator()
      const humGain = context.createGain()
      const noise = context.createBufferSource()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
      const channel = buffer.getChannelData(0)
      let previous = 0
      for (let index = 0; index < channel.length; index += 1) {
        previous = previous * 0.97 + (Math.random() * 2 - 1) * 0.03
        channel[index] = previous
      }
      oscillator.type = 'sine'
      oscillator.frequency.value = 72
      // The sawtooth's harmonics are what small speakers actually reproduce;
      // the lowpass shapes them with the same intensity ramp as the noise bed.
      hum.type = 'sawtooth'
      hum.frequency.value = 56
      humGain.gain.value = 0.4
      noise.buffer = buffer
      noise.loop = true
      filter.type = 'lowpass'
      filter.frequency.value = 420
      gain.gain.value = 0
      oscillator.connect(gain)
      hum.connect(humGain)
      humGain.connect(filter)
      noise.connect(filter)
      filter.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      hum.start()
      noise.start()
      audioRef.current = { context, gain, oscillator, hum, noise, filter }
      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    if (!activeScenario || !soundEnabled) return
    if (!ensureAudio()) {
      const failTimeout = window.setTimeout(() => setSoundEnabled(false), 0)
      return () => window.clearTimeout(failTimeout)
    }
    const resume = () => {
      const audio = audioRef.current
      if (audio && audio.context.state === 'suspended') void audio.context.resume()
    }
    resume()
    window.addEventListener('pointerdown', resume)
    window.addEventListener('keydown', resume)
    return () => {
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
    }
  }, [activeScenario, ensureAudio, soundEnabled])

  const toggleSound = useCallback(() => {
    if (!ensureAudio()) {
      setSoundEnabled(false)
      return
    }
    const audio = audioRef.current
    if (audio && audio.context.state === 'suspended') void audio.context.resume()
    setSoundEnabled((current) => !current)
  }, [ensureAudio])

  return {
    activeFrame,
    activeFrameRef,
    input,
    inputRef,
    paused,
    inputMethod,
    soundEnabled,
    workloadGate,
    togglePause,
    retryCheckpoint,
    setHoldControl,
    toggleSound,
  }
}
