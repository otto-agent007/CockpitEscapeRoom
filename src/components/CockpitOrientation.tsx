import type { CockpitOrientationId } from '../game/state'

const orientationCopy = {
  dc9: {
    title: 'DC-9 cockpit orientation',
    detail: 'A quick look around the first-officer seat before the Final Flight Log begins.',
  },
  airbus: {
    title: 'Airbus A320 cockpit orientation',
    detail: 'A quick look around the captain seat before Pop T Captain Mode begins.',
  },
} as const

export function CockpitOrientation({
  cockpit,
  onSkip,
}: {
  cockpit: CockpitOrientationId
  onSkip: () => void
}) {
  const copy = orientationCopy[cockpit]
  const titleId = `${cockpit}-cockpit-orientation-title`
  return (
    <section
      className={`cockpit-orientation cockpit-orientation--${cockpit}`}
      role="region"
      aria-labelledby={titleId}
    >
      <div className="cockpit-orientation__card">
        <p className="eyebrow">Welcome aboard</p>
        <h2 id={titleId}>{copy.title}</h2>
        <p>{copy.detail}</p>
        <div
          className="cockpit-orientation__progress"
          role="progressbar"
          aria-label="Cockpit tour in progress"
          aria-valuetext="Completes automatically in a few seconds"
        >
          <span />
        </div>
        <button type="button" className="secondary-button" onClick={onSkip} autoFocus>
          Skip cockpit tour
        </button>
      </div>
    </section>
  )
}
