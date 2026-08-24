import { useMemo, useState, type DragEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { airbusCaptainFlow, type AirbusControl, type LockerMemoryId } from '../game/config'
import { ENGINE_OUT_ENVELOPE, ENGINE_OUT_TIMING } from '../game/airbusEngineOut'
import type { AirbusHoldControl } from '../game/airbusInput'
import {
  deriveEngineOutRouteGuidance,
  deriveStormRouteGuidance,
  type AirbusRouteGuidance,
} from '../game/airbusRouteGuidance'
import { getAirbusScenarioAvailability } from '../game/airbusScenario'
import type { StormLineState } from '../game/airbusSimulator'
import {
  airbusWorkloadHint,
  deriveAirbusWorkloadTask,
  type AirbusWorkloadAction,
  type AirbusWorkloadTaskId,
} from '../game/airbusWorkload'
import { gameProgress, type GameAction, type GameState } from '../game/state'
import type { AirbusSimulatorRuntime } from '../game/useAirbusSimulator'
import {
  deriveAirbusWeatherDynamics,
  type AirbusWeatherInstructorCue,
} from '../game/airbusWeatherField'
import type { AirbusHotspotScreenPositions } from '../scenes/PrototypeScene'
import { LockerHud } from './LockerHud'

interface HudProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onRestart: () => void
  airbusSceneReady: boolean
  airbusHotspots: AirbusHotspotScreenPositions
  airbusMeshPickingEnabled: boolean
  selectedAirbusCard: string | null
  onSelectedAirbusCardChange: (card: string | null) => void
  airbusSimulator: AirbusSimulatorRuntime
  onAirbusRecenter: () => void
  reducedMotion: boolean
  selectedLockerMemory: LockerMemoryId | null
  onSelectedLockerMemoryChange: (memory: LockerMemoryId | null) => void
}

const checkpointLabels = {
  stormEntry: 'Weather entry',
  stormCore: 'Storm core',
  clearAir: 'Clear-air recovery',
} as const

const failureCoaching = {
  attitude: 'Ease the sidestick toward center. Keep pitch inside 20° and bank inside 45°.',
  energy: 'Use paired thrust to return the energy tape to the green band.',
  corridor: 'The west gap is the stable route. Bank left until the drift marker sits in the green band, then level off.',
} as const

const stormCaptions: Record<Exclude<AirbusWeatherInstructorCue, 'stableCruise'>, string> = {
  returnsBuilding: 'First officer: Weather returns are building ahead.',
  gapHolding: 'First officer: The western gap is holding steady.',
  smoothTurn: 'First officer: Nice judgment. Keep the turn smooth.',
  coreTurbulence: 'First officer: Core turbulence. Guard the energy.',
  weatherReceding: 'First officer: The worst of it is behind us.',
  clearAir: 'First officer: Clear air ahead. Settle her down.',
}

function stormCaption(simulation: StormLineState): string {
  const cue = deriveAirbusWeatherDynamics({
    scenario: 'stormLine',
    checkpoint: simulation.checkpoint,
    elapsedSeconds: simulation.elapsedSeconds,
    intensity: simulation.weatherIntensity,
    seed: simulation.seed,
  }).instructorCue
  return cue === 'stableCruise' ? stormCaptions.returnsBuilding : stormCaptions[cue]
}

function HoldControl({
  control,
  label,
  runtime,
}: {
  control: AirbusHoldControl
  label: string
  runtime: AirbusSimulatorRuntime
}) {
  const setPressed = (pressed: boolean) => runtime.setHoldControl(control, pressed)
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setPressed(true)
  }
  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setPressed(false)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    setPressed(true)
  }
  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    setPressed(false)
  }
  return (
    <button
      type="button"
      className="storm-hold-control"
      aria-label={`Hold ${label}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={() => setPressed(false)}
    >
      {label}
    </button>
  )
}

function AirbusRouteGuidanceBlock({ guidance }: { guidance: AirbusRouteGuidance | null }) {
  if (!guidance) return null
  return (
    <div
      className={`storm-route-guidance storm-route-guidance--${guidance.tone}`}
      data-storm-guidance-tone={guidance.tone}
    >
      <span className="storm-route-guidance-label">Route</span>
      <p aria-live="polite">{guidance.message}</p>
      <div className="storm-drift-meter" aria-hidden="true">
        <span className="storm-drift-meter-side">{guidance.meter.leftLabel}</span>
        <div className="storm-drift-meter-track">
          <span
            className="storm-drift-meter-band"
            style={{
              left: `${guidance.meter.bandStart * 100}%`,
              width: `${(guidance.meter.bandEnd - guidance.meter.bandStart) * 100}%`,
            }}
          />
          <span
            className="storm-drift-meter-marker"
            style={{ left: `${guidance.meter.position * 100}%` }}
          />
        </div>
        <span className="storm-drift-meter-side">{guidance.meter.rightLabel}</span>
      </div>
    </div>
  )
}

const workloadTaskCopy: Record<AirbusWorkloadTaskId, {
  label: string
  instruction: string
}> = {
  stormScanRange: {
    label: 'Weather picture',
    instruction: 'Set the fictional captain ND scan range to MID.',
  },
  stormGapSelection: {
    label: 'Route judgment',
    instruction: 'Confirm the stable weather gap on the captain ND.',
  },
  engineEventAcknowledgement: {
    label: 'Event recognition',
    instruction: 'Acknowledge the deliberate training event on the upper ECAM.',
  },
  engineSafeReturnSelection: {
    label: 'Diversion judgment',
    instruction: 'Select the calmer SAFE RETURN corridor on the captain ND.',
  },
}

function AirbusCaptainTask({
  state,
  dispatch,
  runtime,
  scenario,
  checkpoint,
}: {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  runtime: AirbusSimulatorRuntime
  scenario: 'stormLine' | 'engineOut'
  checkpoint: 'stormEntry' | 'stormCore' | 'clearAir' | 'recognition' | 'stabilization' | 'diversion'
}) {
  const task = deriveAirbusWorkloadTask(scenario, checkpoint)
  if (!task) return null

  const progress = state.airbusSimulator.workload
  const complete = progress.completedTasks.includes(task)
  const attempts = progress.attempts[task]
  const gated = runtime.workloadGate === task
  const apply = (action: AirbusWorkloadAction) => {
    dispatch({ type: 'APPLY_AIRBUS_WORKLOAD_ACTION', action })
  }

  return (
    <section
      className={`airbus-workload-task${complete ? ' is-complete' : ''}${gated ? ' is-gated' : ''}`}
      data-airbus-workload-task={task}
      data-complete={complete}
      aria-label={`Captain task: ${workloadTaskCopy[task].label}`}
      aria-live="polite"
    >
      <div className="airbus-workload-copy">
        <span>Captain task · SIM — NON OPERATIONAL</span>
        <strong>{workloadTaskCopy[task].instruction}</strong>
        {complete ? (
          <small>Captain task complete.</small>
        ) : attempts > 0 ? (
          <small>{airbusWorkloadHint(task, attempts)}</small>
        ) : gated ? (
          <small>The simulator is safely holding this checkpoint for your decision.</small>
        ) : null}
      </div>

      {!complete && (
        <div className="airbus-workload-actions">
          {task === 'stormScanRange' && (
            <>
              <span className="airbus-workload-readout">Range {progress.scanRange.toUpperCase()}</span>
              <button type="button" onClick={() => apply({ type: 'cycleScanRange' })}>
                Cycle scan range
              </button>
            </>
          )}
          {task === 'stormGapSelection' && (
            <>
              <button type="button" onClick={() => apply({ type: 'selectWeatherSector', sector: 'west' })}>West (left)</button>
              <button type="button" onClick={() => apply({ type: 'selectWeatherSector', sector: 'center' })}>Center (ahead)</button>
              <button type="button" onClick={() => apply({ type: 'selectWeatherSector', sector: 'east' })}>East (right)</button>
            </>
          )}
          {task === 'engineEventAcknowledgement' && (
            <button type="button" onClick={() => apply({ type: 'acknowledgeEngineEvent' })}>
              Acknowledge training event
            </button>
          )}
          {task === 'engineSafeReturnSelection' && (
            <>
              <button type="button" onClick={() => apply({ type: 'selectSafeReturn', side: 'left' })}>Left corridor</button>
              <button type="button" onClick={() => apply({ type: 'selectSafeReturn', side: 'right' })}>Right corridor</button>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function AirbusStormLineHud({
  state,
  dispatch,
  runtime,
  reducedMotion,
  onRecenter,
  onRestart,
}: {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  runtime: AirbusSimulatorRuntime
  reducedMotion: boolean
  onRecenter: () => void
  onRestart: () => void
}) {
  const progress = state.airbusSimulator.stormLine
  const [controlsOpen, setControlsOpen] = useState(
    () => window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches,
  )
  const frame = runtime.activeFrame
  if (progress.status !== 'in_progress' || frame?.scenario !== 'stormLine') {
    const transitioning = state.airbusSimulator.cameraPhase === 'transitioning'
    return (
      <section className="airbus-simulator airbus-simulator--briefing" aria-labelledby="storm-line-title">
        <div className="storm-briefing-card">
          <p className="eyebrow">Airbus A320 Pop T Captain Mode</p>
          <h2 id="storm-line-title">Storm Line</h2>
          {transitioning ? (
            <p role="status">Moving into Storm Flight View…</p>
          ) : (
            <>
              <p>
                Qualification complete. Fly a fictional storm exercise from the left seat.
                The safe lane is the west gap — off your left wing. Bank left, settle the
                drift marker in the green band, and keep the energy tape in green.
              </p>
              <ul>
                <li>Arrow keys or left stick: pitch and bank</li>
                <li>W/S or gamepad triggers: paired thrust</li>
                <li>The Route line and drift meter show the west lane — stay in the green band</li>
                <li>Failure rewinds only the active checkpoint</li>
              </ul>
              <button
                type="button"
                className="primary-button"
                onClick={() => dispatch({ type: 'BEGIN_AIRBUS_STORM_TRANSITION' })}
              >
                {progress.status === 'completed' ? 'Replay Storm Line' : 'Begin Storm Line'}
              </button>
            </>
          )}
          {!transitioning && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => dispatch({ type: 'RETURN_TO_AIRBUS_SCENARIO_HUB' })}
            >
              Back to Simulator Hub
            </button>
          )}
          <button type="button" className="text-button" onClick={onRestart}>Restart game</button>
        </div>
      </section>
    )
  }

  const simulation = frame.state
  const checkpoint = checkpointLabels[simulation.checkpoint]
  const guidance = deriveStormRouteGuidance(simulation)
  const energyPercent = Math.round(simulation.aircraft.energy * 100)
  const timeRemaining = Math.max(0, Math.ceil(165 - simulation.elapsedSeconds))
  const failed = simulation.phase === 'checkpointFailed'
  return (
    <section
      className={`airbus-simulator${failed ? ' airbus-simulator--failed' : ''}${runtime.paused ? ' is-paused' : ''}${reducedMotion ? ' is-reduced-motion' : ''}`}
      aria-labelledby="storm-line-title"
    >
      <div className="storm-topbar">
        <div>
          <p className="eyebrow">Storm Line · {checkpoint}</p>
          <h2 id="storm-line-title" className="sr-only">Storm Line flight simulator</h2>
          <p className="storm-crew-caption" aria-live="polite">{stormCaption(simulation)}</p>
        </div>
        <div className="storm-topbar-actions">
          <span>{timeRemaining}s</span>
          <button type="button" onClick={runtime.toggleSound} aria-pressed={runtime.soundEnabled}>
            {runtime.soundEnabled ? 'Sound on' : 'Sound off'}
          </button>
          <button type="button" onClick={runtime.togglePause}>
            {runtime.paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={onRecenter}>Recenter view</button>
          <button type="button" onClick={onRestart}>Restart</button>
          <button
            type="button"
            aria-controls="storm-flight-controls"
            aria-expanded={controlsOpen}
            onClick={() => setControlsOpen((open) => !open)}
          >
            {controlsOpen ? 'Hide flight controls' : 'Show flight controls'}
          </button>
        </div>
      </div>

      <div className="storm-instrument-mirror" role="region" aria-label="Accessible flight instruments">
        <div><span>Pitch</span><strong>{simulation.aircraft.pitch.toFixed(1)}°</strong></div>
        <div><span>Bank</span><strong>{simulation.aircraft.bank.toFixed(1)}°</strong></div>
        <div className={energyPercent >= 35 && energyPercent <= 65 ? 'is-in-range' : 'is-outside'}>
          <span>Energy</span><strong>{energyPercent}%</strong>
        </div>
        <div><span>Weather</span><strong>{Math.round(simulation.weatherIntensity * 100)}%</strong></div>
      </div>

      <AirbusRouteGuidanceBlock guidance={guidance} />

      <progress className="storm-progress" max={165} value={simulation.elapsedSeconds} aria-label="Storm Line progress" />

      <AirbusCaptainTask
        state={state}
        dispatch={dispatch}
        runtime={runtime}
        scenario="stormLine"
        checkpoint={simulation.checkpoint}
      />

      {controlsOpen && (
        <div id="storm-flight-controls" className="storm-control-deck" aria-label="Accessible flight controls">
          <div className="storm-control-group">
            <span>Sidestick</span>
            <HoldControl control="bankLeft" label="Bank left" runtime={runtime} />
            <HoldControl control="pitchUp" label="Pitch up" runtime={runtime} />
            <HoldControl control="pitchDown" label="Pitch down" runtime={runtime} />
            <HoldControl control="bankRight" label="Bank right" runtime={runtime} />
          </div>
          <div className="storm-control-group">
            <span>Paired thrust</span>
            <HoldControl control="thrustUp" label="Increase" runtime={runtime} />
            <HoldControl control="thrustDown" label="Decrease" runtime={runtime} />
          </div>
          <small>Input: {runtime.inputMethod}</small>
        </div>
      )}

      {runtime.paused && (
        <div className="storm-modal" role="status">
          <strong>Simulator paused</strong>
          <span>Inputs are centered and progress is safe.</span>
        </div>
      )}
      {failed && simulation.failureReason && (
        <div className="storm-modal" role="alertdialog" aria-labelledby="storm-recovery-title">
          <p className="eyebrow">Safe checkpoint recovery</p>
          <h3 id="storm-recovery-title">{checkpoint} needs another pass</h3>
          <p>{failureCoaching[simulation.failureReason]}</p>
          <button type="button" className="primary-button" onClick={runtime.retryCheckpoint}>
            Retry this checkpoint
          </button>
        </div>
      )}
    </section>
  )
}

const stormTraitLabels = {
  calmControl: 'Calm Control',
  weatherJudgment: 'Weather Judgment',
  energyManagement: 'Energy Management',
} as const

const engineOutTraitLabels = {
  directionalControl: 'Directional Control',
  energyDiscipline: 'Energy Discipline',
  calmDiversion: 'Calm Diversion',
} as const

function AirbusScenarioHub({
  state,
  dispatch,
  onRestart,
}: {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onRestart: () => void
}) {
  const progress = {
    qualified: state.airbusSimulator.familiarization === 'completed',
    stormCompleted: state.airbusSimulator.stormLine.status === 'completed',
    engineOutCompleted: state.airbusSimulator.engineOut.status === 'completed',
  }
  const stormAvailability = getAirbusScenarioAvailability('stormLine', progress)
  const engineAvailability = getAirbusScenarioAvailability('engineOut', progress)

  return (
    <section className="airbus-simulator airbus-scenario-hub" aria-labelledby="airbus-scenario-hub-title">
      <div className="scenario-hub-panel">
        <p className="eyebrow">Airbus A320 Pop T Captain Mode</p>
        <h2 id="airbus-scenario-hub-title">Simulator Hub</h2>
        <p>Qualification is complete. Choose the next fictional, non-operational captain exercise.</p>
        <div className="scenario-card-grid">
          <article className="scenario-card" data-status={stormAvailability}>
            <span className="scenario-card-status">{stormAvailability}</span>
            <h3>Storm Line</h3>
            <p>Fly the stable western weather gap while managing attitude and energy.</p>
            {state.airbusSimulator.stormLine.bestTraits.length > 0 && (
              <p className="scenario-card-traits">
                {state.airbusSimulator.stormLine.bestTraits
                  .map((trait) => stormTraitLabels[trait])
                  .join(' · ')}
              </p>
            )}
            <button
              type="button"
              className="primary-button"
              onClick={() => dispatch({ type: 'SELECT_AIRBUS_SCENARIO', scenario: 'stormLine' })}
            >
              {stormAvailability === 'replay' ? 'Replay Storm Line' : 'Open Storm Line'}
            </button>
          </article>

          <article className="scenario-card" data-status={engineAvailability}>
            <span className="scenario-card-status">
              {engineAvailability === 'locked' ? 'Locked' : engineAvailability}
            </span>
            <h3>Engine-Out Handling</h3>
            <p>Stabilize a deliberate cruise-training power reduction and establish SAFE RETURN.</p>
            {engineAvailability === 'locked' && <p>Complete Storm Line first.</p>}
            {state.airbusSimulator.engineOut.bestTraits.length > 0 && (
              <p className="scenario-card-traits">
                {state.airbusSimulator.engineOut.bestTraits
                  .map((trait) => engineOutTraitLabels[trait])
                  .join(' · ')}
              </p>
            )}
            <button
              type="button"
              className="primary-button"
              disabled={engineAvailability === 'locked'}
              onClick={() => dispatch({ type: 'SELECT_AIRBUS_SCENARIO', scenario: 'engineOut' })}
            >
              {engineAvailability === 'locked'
                ? 'Complete Storm Line first'
                : engineAvailability === 'replay'
                  ? 'Replay Engine-Out'
                  : 'Open Engine-Out'}
            </button>
          </article>
        </div>
        <button type="button" className="text-button" onClick={onRestart}>Restart game</button>
      </div>
    </section>
  )
}

const engineOutFailureCoaching = {
  attitude: 'Ease pitch inside ±12° and bank inside ±25°. Small corrections keep the training aircraft settled.',
  energy: 'Use paired thrust to bring energy back between 35% and 65%.',
  directional: 'Add gentle right balance until the drift marker sits back in the green band.',
  corridor: 'SAFE RETURN is to the right. Hold a shallow right bank — the green band on the meter marks it.',
} as const

function engineOutCaption(checkpoint: 'recognition' | 'stabilization' | 'diversion'): string {
  if (checkpoint === 'recognition') {
    return 'Instructor: Deliberate simulator event. SIM ENG 1 power is reducing for training.'
  }
  if (checkpoint === 'stabilization') {
    return 'Instructor: Balance the drift to the right and protect the green energy band.'
  }
  return 'Instructor: SAFE RETURN is to the right. A gentle right bank tracks the corridor.'
}

function AirbusEngineOutHud({
  state,
  dispatch,
  runtime,
  reducedMotion,
  onRecenter,
  onRestart,
}: {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  runtime: AirbusSimulatorRuntime
  reducedMotion: boolean
  onRecenter: () => void
  onRestart: () => void
}) {
  const progress = state.airbusSimulator.engineOut
  const frame = runtime.activeFrame
  const [controlsOpen, setControlsOpen] = useState(
    () => window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches,
  )

  if (progress.status !== 'in_progress' || frame?.scenario !== 'engineOut') {
    return (
      <section className="airbus-simulator airbus-simulator--briefing" aria-labelledby="engine-out-title">
        <div className="storm-briefing-card">
          <p className="eyebrow">Simulator exercise · Non operational</p>
          <h2 id="engine-out-title">Engine-Out Handling</h2>
          <p>
            The instructor deliberately reduces SIM ENG 1 power in stable cruise, and the nose
            will drift LEFT. Hold Balance right to keep the drift marker in the green band,
            guard the energy tape, then roll a gentle RIGHT bank to follow SAFE RETURN.
          </p>
          <ul>
            <li>Arrow keys or left stick: pitch and bank</li>
            <li>W/S or triggers: paired thrust</li>
            <li>A/D or right-stick X: directional balance</li>
            <li>The Route line and drift meter show which way to correct</li>
            <li>Failure retries only the active stage</li>
          </ul>
          <button
            type="button"
            className="primary-button"
            onClick={() => dispatch({ type: 'BEGIN_AIRBUS_ENGINE_OUT' })}
          >
            {progress.status === 'completed' ? 'Replay Engine-Out' : 'Begin Engine-Out'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => dispatch({ type: 'RETURN_TO_AIRBUS_SCENARIO_HUB' })}
          >
            Back to Simulator Hub
          </button>
          <button type="button" className="text-button" onClick={onRestart}>Restart game</button>
        </div>
      </section>
    )
  }

  const simulation = frame.state
  const failed = simulation.phase === 'checkpointFailed'
  const energyPercent = Math.round(simulation.aircraft.energy * 100)
  const directionalPercent = Math.round(Math.abs(simulation.aircraft.directionalError) * 100)
  const progressSeconds = simulation.checkpoint === 'recognition'
    ? simulation.stageElapsedSeconds
    : simulation.checkpoint === 'stabilization'
      ? ENGINE_OUT_TIMING.recognitionSeconds + simulation.stageElapsedSeconds
      : ENGINE_OUT_TIMING.recognitionSeconds +
        ENGINE_OUT_TIMING.stabilizationSeconds +
        Math.min(60, simulation.stageElapsedSeconds)

  return (
    <section
      className={`airbus-simulator airbus-engine-out${failed ? ' airbus-simulator--failed' : ''}${runtime.paused ? ' is-paused' : ''}${reducedMotion ? ' is-reduced-motion' : ''}`}
      aria-labelledby="engine-out-title"
    >
      <div className="storm-topbar">
        <div>
          <p className="eyebrow">Engine-Out Handling · {simulation.checkpoint}</p>
          <h2 id="engine-out-title" className="sr-only">Engine-Out Handling simulator</h2>
          <p className="storm-crew-caption" aria-live="polite">
            {engineOutCaption(simulation.checkpoint)}
          </p>
        </div>
        <div className="storm-topbar-actions">
          <button type="button" onClick={runtime.toggleSound} aria-pressed={runtime.soundEnabled}>
            {runtime.soundEnabled ? 'Sound on' : 'Sound off'}
          </button>
          <button type="button" onClick={runtime.togglePause}>
            {runtime.paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={onRecenter}>Recenter view</button>
          <button type="button" onClick={onRestart}>Restart</button>
          <button
            type="button"
            aria-controls="engine-out-controls"
            aria-expanded={controlsOpen}
            onClick={() => setControlsOpen((open) => !open)}
          >
            {controlsOpen ? 'Hide flight controls' : 'Show flight controls'}
          </button>
        </div>
      </div>

      <div className="storm-instrument-mirror" role="region" aria-label="Accessible Engine-Out instruments">
        <div className={Math.abs(simulation.aircraft.pitch) <= ENGINE_OUT_ENVELOPE.maximumPitchDegrees ? 'is-in-range' : 'is-outside'}>
          <span>Pitch</span><strong>{simulation.aircraft.pitch.toFixed(1)}°</strong>
        </div>
        <div className={Math.abs(simulation.aircraft.bank) <= ENGINE_OUT_ENVELOPE.maximumBankDegrees ? 'is-in-range' : 'is-outside'}>
          <span>Bank</span><strong>{simulation.aircraft.bank.toFixed(1)}°</strong>
        </div>
        <div className={energyPercent >= 35 && energyPercent <= 65 ? 'is-in-range' : 'is-outside'}>
          <span>Energy</span><strong>{energyPercent}%</strong>
        </div>
        <div className={directionalPercent < 45 ? 'is-in-range' : 'is-outside'}>
          <span>Directional error</span><strong>{directionalPercent}%</strong>
        </div>
        <div><span>SIM ENG 1</span><strong>{Math.round(simulation.aircraft.leftEnginePower * 100)}%</strong></div>
        <div><span>SAFE RETURN</span><strong>{Math.round(simulation.corridorProgress * 100)}%</strong></div>
      </div>

      <AirbusRouteGuidanceBlock guidance={deriveEngineOutRouteGuidance(simulation)} />

      <progress
        className="storm-progress"
        max={120}
        value={progressSeconds}
        aria-label="Engine-Out Handling progress"
      />

      <AirbusCaptainTask
        state={state}
        dispatch={dispatch}
        runtime={runtime}
        scenario="engineOut"
        checkpoint={simulation.checkpoint}
      />

      {controlsOpen && (
        <div id="engine-out-controls" className="storm-control-deck" aria-label="Accessible Engine-Out controls">
          <div className="storm-control-group">
            <span>Sidestick</span>
            <HoldControl control="bankLeft" label="Bank left" runtime={runtime} />
            <HoldControl control="pitchUp" label="Pitch up" runtime={runtime} />
            <HoldControl control="pitchDown" label="Pitch down" runtime={runtime} />
            <HoldControl control="bankRight" label="Bank right" runtime={runtime} />
          </div>
          <div className="storm-control-group">
            <span>Paired thrust</span>
            <HoldControl control="thrustUp" label="Increase" runtime={runtime} />
            <HoldControl control="thrustDown" label="Decrease" runtime={runtime} />
          </div>
          <div className="storm-control-group">
            <span>Directional balance</span>
            <HoldControl control="balanceLeft" label="Balance left" runtime={runtime} />
            <HoldControl control="balanceRight" label="Balance right" runtime={runtime} />
          </div>
          <small>Input: {runtime.inputMethod}</small>
        </div>
      )}

      {runtime.paused && (
        <div className="storm-modal" role="status">
          <strong>Simulator paused</strong>
          <span>Inputs are centered and progress is safe.</span>
        </div>
      )}
      {failed && simulation.failureReason && (
        <div className="storm-modal" role="alertdialog" aria-labelledby="engine-out-recovery-title">
          <p className="eyebrow">Safe checkpoint recovery</p>
          <h3 id="engine-out-recovery-title">{simulation.checkpoint} needs another pass</h3>
          <p>{engineOutFailureCoaching[simulation.failureReason]}</p>
          <button type="button" className="primary-button" onClick={runtime.retryCheckpoint}>
            Retry this stage
          </button>
        </div>
      )}
    </section>
  )
}

const airbusTargetMeta: Record<AirbusControl, { x: number; y: number }> = {
  sidestick: { x: 19.5, y: 79 },
  thrust: { x: 25.5, y: 86 },
  gear: { x: 39.5, y: 57 },
  radio: { x: 40, y: 83 },
  altitude: { x: 38, y: 25 },
}

export function Hud({
  state,
  dispatch,
  onRestart,
  airbusSceneReady,
  airbusHotspots,
  airbusMeshPickingEnabled,
  selectedAirbusCard,
  onSelectedAirbusCardChange,
  airbusSimulator,
  onAirbusRecenter,
  reducedMotion,
  selectedLockerMemory,
  onSelectedLockerMemoryChange,
}: HudProps) {
  const [draggingAirbusCard, setDraggingAirbusCard] = useState<string | null>(null)
  const [activeAirbusTarget, setActiveAirbusTarget] = useState<AirbusControl | null>(null)
  const assignedCards = useMemo(() => new Set(Object.values(state.airbusAssignments).filter(Boolean)), [state.airbusAssignments])

  const isComplete = (id: AirbusControl) => state.airbusAssignments[id] === airbusCaptainFlow.controlMatch[id]
  const placedAirbusCards = Object.values(state.airbusAssignments).filter(Boolean).length

  const placeAirbusCard = (control: AirbusControl, card: string) => {
    dispatch({ type: 'ASSIGN_AIRBUS_CARD', control, card })
    onSelectedAirbusCardChange(null)
    setDraggingAirbusCard(null)
    setActiveAirbusTarget(null)
  }

  if (state.phase === 'airbus') {
    if (!airbusSceneReady) {
      return (
        <section className="airbus-training airbus-training--loading" aria-labelledby="airbus-heading">
          <h2 id="airbus-heading" className="sr-only">Airbus cockpit loading</h2>
          <p className="sr-only" aria-live="polite">Loading the Airbus cockpit.</p>
        </section>
      )
    }

    if (state.airbusSimulator.familiarization !== 'unseen') {
      if (state.airbusSimulator.location === 'hub') {
        return (
          <AirbusScenarioHub
            state={state}
            dispatch={dispatch}
            onRestart={onRestart}
          />
        )
      }
      if (state.airbusSimulator.location === 'engineOut') {
        return (
          <AirbusEngineOutHud
            state={state}
            dispatch={dispatch}
            runtime={airbusSimulator}
            reducedMotion={reducedMotion}
            onRecenter={onAirbusRecenter}
            onRestart={onRestart}
          />
        )
      }
      return (
        <AirbusStormLineHud
          state={state}
          dispatch={dispatch}
          runtime={airbusSimulator}
          reducedMotion={reducedMotion}
          onRecenter={onAirbusRecenter}
          onRestart={onRestart}
        />
      )
    }

    return (
      <section className="airbus-training" aria-labelledby="airbus-heading">
        <div className="airbus-topbar">
          <div>
            <p className="eyebrow">Airbus A320 Pop T Captain Mode</p>
            <h2 id="airbus-heading" className="sr-only">Airbus cockpit label placement</h2>
          </div>
          <div className="airbus-progress" aria-label={`${placedAirbusCards} of ${airbusCaptainFlow.controlCards.length} cards placed`}>
            <span>{gameProgress(state)}% complete</span>
            <strong>{placedAirbusCards}/{airbusCaptainFlow.controlCards.length}</strong>
          </div>
        </div>

        <div className="airbus-instruction-box" data-airbus-instruction>
          <p className="eyebrow">{airbusCaptainFlow.qualificationIntro.eyebrow}</p>
          <strong>{airbusCaptainFlow.qualificationIntro.instruction}</strong>
          <span>{airbusCaptainFlow.qualificationIntro.alternate}</span>
          <small>{airbusCaptainFlow.qualificationIntro.completionNote}</small>
        </div>

        <div className="airbus-card-tray" aria-label="Draggable label cards">
          {airbusCaptainFlow.controlCards.map((card) => {
            const control = airbusCaptainFlow.controlIds.find((controlId) => airbusCaptainFlow.controlMatch[controlId] === card)
            const assigned = assignedCards.has(card)
            const selected = selectedAirbusCard === card

            return (
              <button
                key={card}
                type="button"
                className={`airbus-card${selected ? ' is-selected' : ''}${assigned ? ' is-placed' : ''}`}
                draggable
                aria-pressed={selected}
                onClick={() => onSelectedAirbusCardChange(selected ? null : card)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', card)
                  onSelectedAirbusCardChange(card)
                  setDraggingAirbusCard(card)
                }}
                onDragEnd={() => {
                  setDraggingAirbusCard(null)
                  setActiveAirbusTarget(null)
                }}
              >
                <strong>{card}</strong>
                <span className="airbus-card-description">{control ? airbusCaptainFlow.controlDescriptions[control] : ''}</span>
                {assigned && <span className="airbus-card-placement">Placed</span>}
              </button>
            )
          })}
        </div>

        <div
          className={`airbus-target-layer${Object.keys(airbusHotspots).length > 0 ? ' airbus-target-layer--projected' : ''}${airbusMeshPickingEnabled ? ' airbus-target-layer--mesh-picking' : ' airbus-target-layer--fallback'}${selectedAirbusCard || draggingAirbusCard ? ' is-placing-card' : ''}`}
          aria-label="Cockpit placement targets"
        >
          {airbusCaptainFlow.controlIds.map((control, index) => {
            const assignedCard = state.airbusAssignments[control]
            const complete = isComplete(control)
            const wrong = Boolean(assignedCard) && !complete
            const dragging = Boolean(draggingAirbusCard)
            const active = activeAirbusTarget === control
            const projectedTarget = airbusHotspots[control]
            const hasProjectedTarget = Boolean(projectedTarget?.visible)
            const dropZoneLabel = `Cockpit drop zone ${index + 1}`
            const targetStyle = projectedTarget
              ? {
                  left: `${projectedTarget.x}px`,
                  top: `${projectedTarget.y}px`,
                }
              : { left: `${airbusTargetMeta[control].x}%`, top: `${airbusTargetMeta[control].y}%` }

            return (
              <button
                key={control}
                type="button"
                className={`airbus-target-control airbus-target-control--${control}${hasProjectedTarget ? ' is-projected' : ''}${assignedCard ? ' has-card' : ''}${complete ? ' is-correct' : ''}${wrong ? ' is-wrong' : ''}${dragging ? ' is-dragging-card' : ''}${active ? ' is-drag-over' : ''}`}
                style={targetStyle}
                data-airbus-target={control}
                data-anchor-x={projectedTarget?.x}
                data-anchor-y={projectedTarget?.y}
                aria-label={dropZoneLabel}
                onClick={() => {
                  if (selectedAirbusCard) {
                    placeAirbusCard(control, selectedAirbusCard)
                    return
                  }
                  if (assignedCard) onSelectedAirbusCardChange(assignedCard)
                }}
                onDragEnter={(event) => {
                  event.preventDefault()
                  setActiveAirbusTarget(control)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setActiveAirbusTarget(control)
                }}
                onDragLeave={(event) => {
                  const nextTarget = event.relatedTarget
                  if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return
                  setActiveAirbusTarget((current) => (current === control ? null : current))
                }}
                onDrop={(event: DragEvent<HTMLButtonElement>) => {
                  event.preventDefault()
                  const card = event.dataTransfer.getData('text/plain')
                  if (card) placeAirbusCard(control, card)
                  else setActiveAirbusTarget(null)
                }}
              >
                <span className="sr-only">
                  {`${dropZoneLabel}. ${
                    assignedCard ? `Current card: ${assignedCard}.` : 'No card placed.'
                  }`}
                </span>
                <span className="airbus-target-silhouette" aria-hidden="true" />
                {assignedCard && <span className="airbus-target-card" aria-hidden="true">{assignedCard}</span>}
              </button>
            )
          })}
        </div>

        <div className="airbus-dock" aria-label="Pop T Captain status and controls">
          <div className="status airbus-status" aria-live="polite" aria-atomic="true">
            {state.statusMessage}
          </div>

          <button type="button" className="text-button airbus-restart" onClick={onRestart}>
            Restart
          </button>
        </div>
      </section>
    )
  }

  if (state.phase === 'locker') {
    return (
      <LockerHud
        state={state}
        dispatch={dispatch}
        selectedMemory={selectedLockerMemory}
        onSelectedMemoryChange={onSelectedLockerMemoryChange}
        onRestart={onRestart}
      />
    )
  }

  return (
    <aside className="hud" aria-label="Game controls">
      <div className="hud__topline">
        <span className="eyebrow">Completion beat</span>
        <span>{gameProgress(state)}% complete</span>
      </div>

      <progress max={100} value={gameProgress(state)} aria-label="Puzzle progress" />

      <div className="status" aria-live="polite" aria-atomic="true">
        {state.statusMessage}
      </div>

      <button type="button" className="text-button" onClick={onRestart}>
        Restart game
      </button>
    </aside>
  )
}
