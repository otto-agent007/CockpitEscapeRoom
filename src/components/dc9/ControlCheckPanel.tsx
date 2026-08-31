import { dc9LegacyFlow } from '../../game/config'
import {
  DC9_CONTROL_CHECK_GROUP_IDS,
  dc9ControlCheckItemsInGroup,
  dc9ControlCheckNextItem,
  type Dc9ControlCheckItemId,
} from '../../game/dc9ControlCheck'
import type { Dc9ControlState, Dc9HoldControl, Dc9InputMethod } from '../../game/dc9Input'
import { Dc9AxisControls } from './Dc9AxisControls'

interface ControlCheckPanelProps {
  completed: readonly Dc9ControlCheckItemId[]
  controls: Dc9ControlState
  inputMethod: Dc9InputMethod
  onHold: (control: Dc9HoldControl, pressed: boolean) => void
}

export function ControlCheckPanel({ completed, controls, inputMethod, onHold }: ControlCheckPanelProps) {
  const copy = dc9LegacyFlow.controlCheck
  const done = new Set(completed)
  const nextItem = dc9ControlCheckNextItem(completed)

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
        <Dc9AxisControls controls={controls} onHold={onHold} />
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
