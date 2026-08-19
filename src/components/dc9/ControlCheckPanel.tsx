import { dc9LegacyFlow } from '../../game/config'
import {
  DC9_CONTROL_CHECK_GROUP_IDS,
  dc9ControlCheckItemsInGroup,
  dc9ControlCheckNextItem,
  type Dc9ControlCheckItemId,
} from '../../game/dc9ControlCheck'
import type { Dc9ControlState, Dc9HoldControl, Dc9InputMethod } from '../../game/dc9Input'

interface ControlCheckPanelProps {
  completed: readonly Dc9ControlCheckItemId[]
  controls: Dc9ControlState
  inputMethod: Dc9InputMethod
  onHold: (control: Dc9HoldControl, pressed: boolean) => void
}

interface AxisRow {
  id: string
  label: string
  /** Position mapped to 0..1 for the meter fill. */
  fraction: number
  readout: string
  decrease: { control: Dc9HoldControl; label: string; keyHint: string }
  increase: { control: Dc9HoldControl; label: string; keyHint: string }
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function signedReadout(value: number, negative: string, positive: string): string {
  if (Math.abs(value) < 0.02) return 'Neutral'
  const magnitude = Math.round(Math.abs(value) * 100)
  return `${magnitude}% ${value < 0 ? negative : positive}`
}

export function ControlCheckPanel({ completed, controls, inputMethod, onHold }: ControlCheckPanelProps) {
  const copy = dc9LegacyFlow.controlCheck
  const done = new Set(completed)
  const nextItem = dc9ControlCheckNextItem(completed)

  const axes: AxisRow[] = [
    {
      id: 'pitch',
      label: 'Control column',
      fraction: (controls.pitch + 1) / 2,
      readout: signedReadout(controls.pitch, 'forward', 'aft'),
      decrease: { control: 'pitchForward', label: 'Push column forward', keyHint: 'Down arrow' },
      increase: { control: 'pitchAft', label: 'Pull column aft', keyHint: 'Up arrow' },
    },
    {
      id: 'roll',
      label: 'Control wheel',
      fraction: (controls.roll + 1) / 2,
      readout: signedReadout(controls.roll, 'left', 'right'),
      decrease: { control: 'rollLeft', label: 'Roll wheel left', keyHint: 'Left arrow' },
      increase: { control: 'rollRight', label: 'Roll wheel right', keyHint: 'Right arrow' },
    },
    {
      id: 'rudder',
      label: 'Rudder pedals',
      fraction: (controls.rudder + 1) / 2,
      readout: signedReadout(controls.rudder, 'left', 'right'),
      decrease: { control: 'rudderLeft', label: 'Left rudder pedal', keyHint: 'A' },
      increase: { control: 'rudderRight', label: 'Right rudder pedal', keyHint: 'D' },
    },
    {
      id: 'thrust',
      label: 'Thrust levers',
      fraction: controls.thrust,
      readout: controls.thrust < 0.02
        ? 'Closed'
        : controls.thrust > 0.98
          ? 'Full forward'
          : `${Math.round(controls.thrust * 100)}% forward`,
      decrease: { control: 'thrustClose', label: 'Close thrust levers', keyHint: 'S' },
      increase: { control: 'thrustAdvance', label: 'Advance thrust levers', keyHint: 'W' },
    },
  ]

  return (
    <section className="dc9-control-check" aria-labelledby="dc9-control-check-title">
      <header>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="dc9-control-check-title">{copy.title}</h2>
      </header>

      <p className="dc9-control-check__intro">{copy.intro}</p>
      <p className="dc9-control-check__instructions">{copy.instructions}</p>

      <p className="dc9-control-check__next" aria-live="polite" aria-atomic="true">
        {nextItem ? copy.items[nextItem].detail : copy.completionText}
      </p>

      <div className="dc9-control-check__axes">
        {axes.map((axis) => (
          <div key={axis.id} className="dc9-axis">
            <div className="dc9-axis__head">
              <span>{axis.label}</span>
              <strong aria-live="off">{axis.readout}</strong>
            </div>
            <div
              className="dc9-axis__meter"
              role="meter"
              aria-label={`${axis.label} position`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(axis.fraction * 100)}
              aria-valuetext={axis.readout}
            >
              <span className="dc9-axis__fill" style={{ inlineSize: percent(axis.fraction) }} />
            </div>
            <div className="dc9-axis__holds">
              {[axis.decrease, axis.increase].map((hold) => (
                <button
                  key={hold.control}
                  type="button"
                  className="dc9-axis__hold"
                  data-hold={hold.control}
                  onPointerDown={(event) => {
                    // Start the hold first: a synthetic or accessibility pointer may not
                    // own a real browser pointer, and a failed capture must not stop the
                    // control moving.
                    onHold(hold.control, true)
                    try {
                      event.currentTarget.setPointerCapture(event.pointerId)
                    } catch {
                      // Capture is an improvement, not a requirement.
                    }
                  }}
                  onPointerUp={() => onHold(hold.control, false)}
                  onPointerCancel={() => onHold(hold.control, false)}
                  onPointerLeave={(event) => {
                    // While the button holds the pointer, drifting off it is still a hold.
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) return
                    onHold(hold.control, false)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') onHold(hold.control, true)
                  }}
                  onKeyUp={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') onHold(hold.control, false)
                  }}
                  onBlur={() => onHold(hold.control, false)}
                >
                  <span>{hold.label}</span>
                  <kbd>{hold.keyHint}</kbd>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="dc9-control-check__checklist">
        {DC9_CONTROL_CHECK_GROUP_IDS.map((group) => (
          <div key={group} className="dc9-control-check__group">
            <h3>{copy.groupLabels[group]}</h3>
            <ul>
              {dc9ControlCheckItemsInGroup(group).map((itemId) => {
                const complete = done.has(itemId)
                return (
                  <li
                    key={itemId}
                    className={`dc9-control-check__item${complete ? ' is-complete' : ''}${itemId === nextItem ? ' is-next' : ''}`}
                    data-item={itemId}
                    data-complete={complete ? 'true' : 'false'}
                  >
                    <span aria-hidden="true">{complete ? '✓' : '·'}</span>
                    <span>{copy.items[itemId].label}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="dc9-control-check__method">
        <span className="sr-only">Active input: </span>
        {inputMethod === 'gamepad'
          ? 'Gamepad connected.'
          : inputMethod === 'pointer'
            ? 'Dragging the yoke.'
            : inputMethod === 'accessible'
              ? 'Using the hold buttons.'
              : 'Keyboard ready.'}
      </p>
      <small className="dc9-control-check__disclaimer">{copy.disclaimer}</small>
    </section>
  )
}
