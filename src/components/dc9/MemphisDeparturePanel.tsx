import { useCallback, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { Dc9DepartureBeat, Dc9DepartureProgress } from '../../game/dc9MemphisDeparture'
import type { Dc9ControlState, Dc9HoldControl, Dc9InputMethod } from '../../game/dc9Input'
import type { Dc9MemphisDepartureRuntime } from '../../game/useDc9MemphisDeparture'
import type { Dc9LoadState } from '../../scenes/PrototypeScene'
import { Dc9AxisControls, type Dc9AxisId } from './Dc9AxisControls'

interface MemphisDeparturePanelProps {
  controls: Dc9ControlState
  inputMethod: Dc9InputMethod
  loadState: Dc9LoadState
  onHold: (control: Dc9HoldControl, pressed: boolean) => void
  progress: Dc9DepartureProgress
  runtime: Dc9MemphisDepartureRuntime
}

const BEAT_LABELS: Readonly<Record<Dc9DepartureBeat, string>> = {
  rampRelease: 'Ramp release',
  taxi: 'Memory lane',
  holdShort: 'Quiet hold',
  lineup: 'Line up',
  takeoffRoll: 'Legacy roll',
  rotation: 'Memory lift',
  initialClimb: 'Climb out',
  complete: 'Memory complete',
}

const AXES_BY_BEAT: Readonly<Record<Dc9DepartureBeat, readonly Dc9AxisId[]>> = {
  rampRelease: ['thrust', 'rudder'],
  taxi: ['thrust', 'rudder'],
  holdShort: ['thrust'],
  lineup: ['thrust', 'rudder'],
  // Keep the column available through the roll so the native path can meet the
  // deliberately brief fictional rotation cue without relying on 3D controls.
  takeoffRoll: ['pitch', 'thrust', 'rudder'],
  rotation: ['pitch', 'roll'],
  initialClimb: ['pitch', 'roll'],
  complete: [],
}

function titleCase(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function inputMethodCopy(inputMethod: Dc9InputMethod): string {
  if (inputMethod === 'gamepad') return 'Gamepad connected.'
  if (inputMethod === 'pointer') return 'Cockpit controls in use.'
  if (inputMethod === 'accessible') return 'Using native hold buttons.'
  return 'Keyboard controls ready.'
}

/**
 * A native, fictional-memory mirror of the DC-9 departure. The runtime owns every
 * checkpoint and retry decision; this panel only exposes its current safe controls.
 */
export function MemphisDeparturePanel({ controls, inputMethod, loadState, onHold, progress, runtime }: MemphisDeparturePanelProps) {
  const { frame, guidance, brakeHeld, setBrakeHeld, confirmLineup: confirmRuntimeLineup, restoreCheckpoint: restoreRuntimeCheckpoint } = runtime
  const attempts = progress.attempts[frame.beat] ?? 0
  const hasRetryFeedback = progress.hintLevel > 0
  const [restoreMarker, setRestoreMarker] = useState<{ beat: Dc9DepartureBeat; attempts: number } | null>(null)
  const restored = restoreMarker?.beat === frame.beat && restoreMarker.attempts === attempts
  const canConfirmLineup = frame.beat === 'holdShort' && frame.safeHold
  const showRestore = progress.hintLevel >= 3 || loadState.status === 'error'
  const liveAnnouncement = restored
    ? 'Checkpoint restored. Earlier Final Flight Log progress remains safe.'
    : frame.beat === 'complete'
      ? 'Memphis legacy departure complete. Returning to the Final Flight Log.'
    : hasRetryFeedback
      ? `Safe retry available. Hint level ${progress.hintLevel} for ${BEAT_LABELS[frame.beat]}.`
        : `${BEAT_LABELS[frame.beat]}. Path centered. ${guidance.intent}`

  const holdBrake = useCallback((pressed: boolean) => {
    setRestoreMarker(null)
    setBrakeHeld(pressed)
  }, [setBrakeHeld])
  const confirmLineup = useCallback(() => {
    setRestoreMarker(null)
    confirmRuntimeLineup()
  }, [confirmRuntimeLineup])
  const restoreCheckpoint = useCallback(() => {
    restoreRuntimeCheckpoint()
    setRestoreMarker({ beat: frame.beat, attempts })
  }, [attempts, frame.beat, restoreRuntimeCheckpoint])
  const onBrakePointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    holdBrake(true)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Capture improves a pointer hold but is not required for the native control.
    }
  }, [holdBrake])
  const onBrakeRelease = useCallback(() => holdBrake(false), [holdBrake])
  const onBrakeKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') holdBrake(true)
  }, [holdBrake])
  const onBrakeKeyUp = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') holdBrake(false)
  }, [holdBrake])

  return (
    <section className="dc9-memphis-departure" aria-labelledby="dc9-memphis-departure-title">
      <header className="dc9-memphis-departure__header">
        <p className="eyebrow">1995 MEMORY · <span>Fictional — non operational</span></p>
        <h2 id="dc9-memphis-departure-title">Memphis Legacy Departure</h2>
        <p>{BEAT_LABELS[frame.beat]} · {guidance.intent}</p>
      </header>

      <div className="dc9-memphis-departure__guidance" aria-live="off">
        <p><strong>Path:</strong> <span className={`dc9-memphis-departure__state is-${guidance.alignment}`}>{titleCase(guidance.alignment)}</span></p>
        <p><strong>Energy:</strong> {titleCase(guidance.energy)}</p>
        <p>{guidance.correctiveText}</p>
      </div>

      <p className="dc9-memphis-departure__live" role="status" aria-label="Departure guidance" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </p>

      <div className="dc9-memphis-departure__controls">
        <div className="dc9-memphis-departure__axes">
          <Dc9AxisControls controls={controls} onHold={onHold} axisIds={AXES_BY_BEAT[frame.beat]} />
        </div>
        <div className="dc9-memphis-departure__actions">
          <button
            type="button"
            className="dc9-memphis-departure__brake"
            aria-pressed={brakeHeld}
            data-dc9-space-owner="brake"
            onPointerDown={onBrakePointerDown}
            onPointerUp={onBrakeRelease}
            onPointerCancel={onBrakeRelease}
            onLostPointerCapture={onBrakeRelease}
            onKeyDown={onBrakeKeyDown}
            onKeyUp={onBrakeKeyUp}
            onBlur={onBrakeRelease}
          >
            Hold brake
          </button>
          {canConfirmLineup ? (
            <button type="button" className="primary-button" onClick={confirmLineup}>Ready to line up</button>
          ) : null}
          {showRestore ? (
            <button type="button" className="secondary-button" onClick={restoreCheckpoint}>Restore checkpoint</button>
          ) : null}
          <p className="dc9-memphis-departure__method"><span className="sr-only">Active input: </span>{inputMethodCopy(inputMethod)}</p>
        </div>
      </div>
      {attempts > 0 ? <p className="dc9-memphis-departure__retry">Attempt {attempts}. Safe retry keeps every earlier memory beat.</p> : null}
    </section>
  )
}
