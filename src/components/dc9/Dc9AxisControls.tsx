import type { Dc9ControlState, Dc9HoldControl } from '../../game/dc9Input'

export type Dc9AxisId = 'pitch' | 'roll' | 'rudder' | 'thrust'

interface Dc9AxisControlsProps {
  controls: Dc9ControlState
  onHold: (control: Dc9HoldControl, pressed: boolean) => void
  axisIds?: readonly Dc9AxisId[]
}

interface AxisRow {
  id: Dc9AxisId
  label: string
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
  return `${Math.round(Math.abs(value) * 100)}% ${value < 0 ? negative : positive}`
}

/** Shared native mirrors for the DC-9's continuous cockpit controls. */
export function Dc9AxisControls({ controls, onHold, axisIds }: Dc9AxisControlsProps) {
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
  const visibleAxes = axisIds ? axes.filter((axis) => axisIds.includes(axis.id)) : axes

  return <>
    {visibleAxes.map((axis) => (
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
                onHold(hold.control, true)
                try {
                  event.currentTarget.setPointerCapture(event.pointerId)
                } catch {
                  // Capture improves a pointer hold but is not required for the native control.
                }
              }}
              onPointerUp={() => onHold(hold.control, false)}
              onPointerCancel={() => onHold(hold.control, false)}
              onPointerLeave={(event) => {
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
  </>
}
