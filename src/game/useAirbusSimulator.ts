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
import { airbusLightningFlash } from './airbusLightning'
import {
  advanceAirbusScenarioFrame,
  type AirbusActiveSimulationFrame,
  type AirbusScenarioId,
} from './airbusScenario'
import {
  CLEAR_AIR_BED,
  stormAudioBed,
  thunderForStrike,
  type ThunderClap,
} from './airbusStormAudio'
import { deriveAirbusWeatherDynamics } from './airbusWeatherField'
import {
  createStormLineStateAtCheckpoint,
  restartStormLineCheckpoint,
  type StormLineCheckpoint,
  type StormLineState,
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
  /** Suppresses the thunderclaps along with the lightning they answer. */
  reducedMotion: boolean
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

/**
 * The simulator's audio graph.
 *
 * `master` is the mute: it is 1 or 0 and nothing else, so silencing the game is one node
 * and every layer hangs off it. The engine bed keeps its own level below that, which is
 * what lets the rain be mixed in absolute terms instead of underneath an engine fader.
 */
interface AirbusAudioGraph {
  context: AudioContext
  master: GainNode
  engineGain: GainNode
  oscillator: OscillatorNode
  hum: OscillatorNode
  noise: AudioBufferSourceNode
  filter: BiquadFilterNode
  rainGain: GainNode
  rainHighpass: BiquadFilterNode
  windGain: GainNode
  windBandpass: BiquadFilterNode
  /** Full-scale white noise. Shared by rain, wind, and every thunderclap. */
  whiteNoise: AudioBuffer
}

/** Brown-ish noise: the engine bed's body, correlated so it rumbles rather than hisses. */
function createEngineNoiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
  const channel = buffer.getChannelData(0)
  let previous = 0
  for (let index = 0; index < channel.length; index += 1) {
    previous = previous * 0.97 + (Math.random() * 2 - 1) * 0.03
    channel[index] = previous
  }
  return buffer
}

/** Flat white noise at full scale. Level is set by the gain node, never by the buffer. */
function createWhiteNoiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = Math.random() * 2 - 1
  }
  return buffer
}

/**
 * One clap, scheduled on the audio clock rather than a timer: the delay between the flash
 * and the sound is the whole point, and a `setTimeout` would drift against it.
 *
 * Every node is created per strike and disposed when it ends. A clap is at most 8.2 s of
 * graph, and there is one bolt every 8.5 s, so this never accumulates.
 */
function scheduleThunder(graph: AirbusAudioGraph, clap: ThunderClap): void {
  const { context, master, whiteNoise } = graph
  const start = context.currentTime + clap.delaySeconds

  const rumble = context.createBufferSource()
  rumble.buffer = whiteNoise
  rumble.loop = true
  const rumbleFilter = context.createBiquadFilter()
  rumbleFilter.type = 'lowpass'
  // Resonant, so the energy piles up at the cutoff instead of spreading thin: that is the
  // difference between a rumble and a hiss with the top taken off.
  rumbleFilter.Q.value = 1.1
  rumbleFilter.frequency.setValueAtTime(clap.rumbleCutoffHz, start)
  // The top of a rumble is absorbed first as it rolls away, which is what makes it roll
  // rather than simply fade.
  rumbleFilter.frequency.exponentialRampToValueAtTime(
    Math.max(60, clap.rumbleCutoffHz * 0.35),
    start + clap.rumbleSeconds,
  )
  const rumbleGain = context.createGain()
  rumbleGain.gain.setValueAtTime(0.0001, start)
  rumbleGain.gain.exponentialRampToValueAtTime(clap.rumbleLevel, start + 0.09)
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, start + clap.rumbleSeconds)
  rumble.connect(rumbleFilter)
  rumbleFilter.connect(rumbleGain)
  rumbleGain.connect(master)
  rumble.start(start)
  rumble.stop(start + clap.rumbleSeconds + 0.05)
  rumble.onended = () => {
    rumble.disconnect()
    rumbleFilter.disconnect()
    rumbleGain.disconnect()
  }

  if (clap.crackLevel <= 0) return
  const crack = context.createBufferSource()
  crack.buffer = whiteNoise
  const crackFilter = context.createBiquadFilter()
  crackFilter.type = 'bandpass'
  crackFilter.frequency.value = 1_450
  crackFilter.Q.value = 0.65
  const crackGain = context.createGain()
  crackGain.gain.setValueAtTime(0.0001, start)
  crackGain.gain.exponentialRampToValueAtTime(clap.crackLevel, start + 0.012)
  crackGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34)
  crack.connect(crackFilter)
  crackFilter.connect(crackGain)
  crackGain.connect(master)
  crack.start(start)
  crack.stop(start + 0.4)
  crack.onended = () => {
    crack.disconnect()
    crackFilter.disconnect()
    crackGain.disconnect()
  }
}

/** The weather the storm audio is drawn from — the same field the scene draws. */
function stormWeatherFor(state: StormLineState) {
  return deriveAirbusWeatherDynamics({
    scenario: 'stormLine',
    checkpoint: state.checkpoint,
    elapsedSeconds: state.elapsedSeconds,
    intensity: state.weatherIntensity,
    seed: state.seed,
  })
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
    reducedMotion,
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
  const audioRef = useRef<AirbusAudioGraph | null>(null)
  const soundEnabledRef = useRef(soundEnabled)
  const reducedMotionRef = useRef(reducedMotion)
  /** The last strike whose thunder has been scheduled, so one bolt gets one clap. */
  const lastThunderStrikeRef = useRef<number | null>(null)

  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  useEffect(() => { reducedMotionRef.current = reducedMotion }, [reducedMotion])

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
      lastThunderStrikeRef.current = null
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

  /**
   * Thunder for the bolt currently in the sky, at most once per strike.
   *
   * Fired from the frame loop rather than a timer because the flash window is 0.62 s and a
   * published-state effect samples too slowly to be sure of catching it. Matching on the
   * strike index rather than the intensity means one clap per bolt even though the loop
   * sees the same flash across many frames.
   */
  const triggerThunder = useCallback((state: StormLineState) => {
    const audio = audioRef.current
    if (!audio || !soundEnabledRef.current) return
    // Reduced motion suppresses the flash; a clap answering a bolt that was never drawn is
    // a startle with nothing behind it, so the sudden layer goes with it. Rain stays.
    if (reducedMotionRef.current) return
    const weather = stormWeatherFor(state)
    const flash = airbusLightningFlash(state.elapsedSeconds, weather.lightningEligible)
    if (flash.intensity <= 0 || lastThunderStrikeRef.current === flash.strikeIndex) return
    lastThunderStrikeRef.current = flash.strikeIndex
    scheduleThunder(audio, thunderForStrike(flash.strikeIndex, weather.precipitation))
  }, [])

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
        if (transition.frame.scenario === 'stormLine') triggerThunder(transition.frame.state)
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
    triggerThunder,
  ])

  const simulatorIntensity = activeFrame?.scenario === 'stormLine'
    ? activeFrame.state.weatherIntensity
    : activeFrame?.scenario === 'engineOut'
      ? activeFrame.state.aircraft.rightEnginePower - activeFrame.state.aircraft.leftEnginePower
      : 0
  // Only the scalars the bed needs, so the level effect does not re-run on every published
  // frame just because the object identity changed.
  const stormPrecipitation = activeFrame?.scenario === 'stormLine'
    ? stormWeatherFor(activeFrame.state).precipitation
    : null

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const now = audio.context.currentTime
    // One node decides whether the game makes a sound at all.
    audio.master.gain.setTargetAtTime(
      soundEnabled && activeScenario && !paused ? 1 : 0,
      now,
      0.08,
    )
    audio.engineGain.gain.setTargetAtTime(0.055 + simulatorIntensity * 0.1, now, 0.08)
    audio.filter.frequency.setTargetAtTime(260 + simulatorIntensity * 720, now, 0.12)
    audio.hum.frequency.setTargetAtTime(56 + simulatorIntensity * 26, now, 0.25)

    const bed = stormPrecipitation === null
      ? CLEAR_AIR_BED
      : stormAudioBed(stormPrecipitation, simulatorIntensity)
    // Weather moves slower than the engine: a long time constant so crossing a checkpoint
    // boundary swells rather than steps.
    audio.rainGain.gain.setTargetAtTime(bed.rainGain, now, 0.6)
    audio.rainHighpass.frequency.setTargetAtTime(bed.rainHighpassHz, now, 0.6)
    audio.windGain.gain.setTargetAtTime(bed.windGain, now, 0.6)
    audio.windBandpass.frequency.setTargetAtTime(bed.windBandHz, now, 0.6)
  }, [activeScenario, paused, simulatorIntensity, soundEnabled, stormPrecipitation])

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
    // The clock rewinds to the checkpoint start, so the strike indexes come round again.
    // Without this the first bolt of the retry is remembered as already answered and lands
    // in silence.
    lastThunderStrikeRef.current = null
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
      const master = context.createGain()
      master.gain.value = 0
      master.connect(context.destination)

      // Engine bed: sine body, sawtooth harmonics, correlated noise, all lowpassed.
      const oscillator = context.createOscillator()
      const hum = context.createOscillator()
      const humGain = context.createGain()
      const noise = context.createBufferSource()
      const filter = context.createBiquadFilter()
      const engineGain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 72
      // The sawtooth's harmonics are what small speakers actually reproduce;
      // the lowpass shapes them with the same intensity ramp as the noise bed.
      hum.type = 'sawtooth'
      hum.frequency.value = 56
      humGain.gain.value = 0.4
      noise.buffer = createEngineNoiseBuffer(context)
      noise.loop = true
      filter.type = 'lowpass'
      filter.frequency.value = 420
      engineGain.gain.value = 0
      oscillator.connect(engineGain)
      hum.connect(humGain)
      humGain.connect(filter)
      noise.connect(filter)
      filter.connect(engineGain)
      engineGain.connect(master)

      // Weather: one white-noise source split into rain and wind. Both start silent and
      // are opened by the level effect, so a scenario that has no weather makes no sound.
      const whiteNoise = createWhiteNoiseBuffer(context)
      const weatherNoise = context.createBufferSource()
      weatherNoise.buffer = whiteNoise
      weatherNoise.loop = true
      const rainHighpass = context.createBiquadFilter()
      rainHighpass.type = 'highpass'
      rainHighpass.frequency.value = CLEAR_AIR_BED.rainHighpassHz
      rainHighpass.Q.value = 0.5
      // Takes the fizz off the top so it reads as water rather than tape hiss.
      const rainLowpass = context.createBiquadFilter()
      rainLowpass.type = 'lowpass'
      rainLowpass.frequency.value = 7_600
      const rainGain = context.createGain()
      rainGain.gain.value = 0
      const windBandpass = context.createBiquadFilter()
      windBandpass.type = 'bandpass'
      windBandpass.frequency.value = CLEAR_AIR_BED.windBandHz
      windBandpass.Q.value = 0.7
      const windGain = context.createGain()
      windGain.gain.value = 0
      weatherNoise.connect(rainHighpass)
      rainHighpass.connect(rainLowpass)
      rainLowpass.connect(rainGain)
      rainGain.connect(master)
      weatherNoise.connect(windBandpass)
      windBandpass.connect(windGain)
      windGain.connect(master)

      oscillator.start()
      hum.start()
      noise.start()
      weatherNoise.start()
      audioRef.current = {
        context,
        master,
        engineGain,
        oscillator,
        hum,
        noise,
        filter,
        rainGain,
        rainHighpass,
        windGain,
        windBandpass,
        whiteNoise,
      }
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
