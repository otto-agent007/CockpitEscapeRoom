import { useEffect, useRef } from 'react'
import type { GamePhase } from '../game/state'

const phaseGuidance: Record<Exclude<GamePhase, 'briefing'>, string> = {
  airbus: 'Select a label, then place it on the matching cockpit control from the captain seat.',
  locker: 'Inspect the personal objects, then reveal the captain’s hat.',
  dc9: 'Work the right-seat controls and analog panel. Arrow keys move the yoke, W and S the thrust levers, A and D the rudder pedals; every action also has a native button.',
  reward: 'Explore the hangar reward after Captain Mode completion.',
  mars: 'Explore the optional mission control after the main ending.',
}

export function SceneHelp({ phase, open, onClose }: { phase: Exclude<GamePhase, 'briefing'>; open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  if (!open) return null
  const lookDirection = phase === 'airbus'
    ? 'Look from the left seat'
    : phase === 'dc9'
      ? 'Look from the right seat, or grab the yoke itself'
      : 'Orbit the scene'
  return (
    <div className="scene-help-popover" role="dialog" aria-modal="false" aria-labelledby="scene-help-title">
      <div className="scene-help-heading">
        <div>
          <p className="eyebrow">Viewer help</p>
          <h2 id="scene-help-title">Explore this scene</h2>
        </div>
        <button ref={closeRef} type="button" className="scene-help-close" aria-label="Close viewer help" onClick={onClose}>×</button>
      </div>
      <p>{phaseGuidance[phase]}</p>
      <dl>
        <div><dt>Drag</dt><dd>{lookDirection}</dd></div>
        <div><dt>Wheel / trackpad</dt><dd>Zoom</dd></div>
        <div><dt>F</dt><dd>Toggle fullscreen</dd></div>
        <div><dt>R</dt><dd>Reset the view</dd></div>
      </dl>
    </div>
  )
}
