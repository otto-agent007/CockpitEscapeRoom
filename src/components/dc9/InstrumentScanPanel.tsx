import { dc9LegacyFlow } from '../../game/config'
import { DC9_INSTRUMENTS, type Dc9InstrumentId } from '../../game/dc9FlightDeck'
import {
  DC9_INSTRUMENT_SCAN_ORDER,
  dc9InstrumentScanPrompt,
  dc9InstrumentScanShowsFinalSupport,
  type Dc9InstrumentScanProgress,
} from '../../game/dc9InstrumentScan'
import type { Dc9HotspotScreenPositions } from '../../scenes/PrototypeScene'

interface InstrumentScanPanelProps {
  progress: Dc9InstrumentScanProgress
  hotspots: Dc9HotspotScreenPositions
  projectionReady: boolean
  onIdentify: (instrument: Dc9InstrumentId) => void
}

export function InstrumentScanPanel({
  progress,
  hotspots,
  projectionReady,
  onIdentify,
}: InstrumentScanPanelProps) {
  const copy = dc9LegacyFlow.instrumentScan
  const prompt = dc9InstrumentScanPrompt(progress)
  const identified = new Set(progress.identified)
  const finalSupport = dc9InstrumentScanShowsFinalSupport(progress)

  return (
    <>
      {DC9_INSTRUMENT_SCAN_ORDER.map((instrumentId) => {
        const projection = hotspots[`dc9.gauge.${instrumentId}`]
        const isIdentified = identified.has(instrumentId)
        const projected = projection?.visible === true
        // The EPR pair lives on the centre pedestal rather than the first-officer panel,
        // so it sits at the edge of this framing and can leave the view entirely on a
        // narrow window or after the player looks around. The gauge being asked for still
        // has to be clickable, so it falls back to a labelled chip pinned on screen.
        const isPrompt = instrumentId === prompt
        // Wait for the projector's first report before deciding a gauge is out of view,
        // otherwise the fallback chip flashes for a frame on entering the stage.
        const projectorReported = Object.keys(hotspots).length > 0
        if (!projectionReady || (!projected && (!isPrompt || !projectorReported))) return null
        return (
          <button
            key={instrumentId}
            type="button"
            className={`dc9-gauge-target${projected ? '' : ' is-fallback'}${isIdentified ? ' is-identified' : ''}${finalSupport && isPrompt ? ' is-final-hint' : ''}`}
            // The list below offers the same action, so this one names its location to
            // keep the two apart for anyone reading the page by accessible name.
            aria-label={`${DC9_INSTRUMENTS[instrumentId].label} on the instrument panel${isIdentified ? ', identified' : ''}`}
            data-gauge={instrumentId}
            data-projection={projected ? 'mesh' : 'fallback'}
            style={projected
              ? {
                // The button is centred on the projected point, so it is clamped by its
                // own half-extent: a gauge only half in frame stays wholly clickable.
                left: `clamp(${(projection.width ?? 48) / 2 + 8}px, ${projection.x}px, calc(100vw - ${(projection.width ?? 48) / 2 + 8}px))`,
                top: `clamp(${(projection.height ?? 48) / 2 + 8}px, ${projection.y}px, calc(100vh - ${(projection.height ?? 48) / 2 + 8}px))`,
                width: projection.width,
                height: projection.height,
              }
              : undefined}
            disabled={isIdentified}
            onClick={() => onIdentify(instrumentId)}
          >
            {projected ? null : (
              <span className="dc9-gauge-target__fallback">{DC9_INSTRUMENTS[instrumentId].label}</span>
            )}
          </button>
        )
      })}

      <section className="dc9-instrument-scan" aria-labelledby="dc9-instrument-scan-title">
        <header>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="dc9-instrument-scan-title">{copy.title}</h2>
        </header>

        <p className="dc9-instrument-scan__question" aria-live="polite" aria-atomic="true">
          {prompt ? copy.prompts[prompt].question : copy.completionText}
        </p>
        <p className="dc9-document__note">{copy.instruction}</p>

        <ul className="dc9-instrument-scan__list" aria-label="Right-seat instruments">
          {DC9_INSTRUMENT_SCAN_ORDER.map((instrumentId) => {
            const isIdentified = identified.has(instrumentId)
            const highlighted = finalSupport && instrumentId === prompt
            return (
              <li key={instrumentId}>
                <button
                  type="button"
                  className={`dc9-instrument-choice${isIdentified ? ' is-identified' : ''}${highlighted ? ' is-final-hint' : ''}`}
                  aria-pressed={isIdentified}
                  disabled={isIdentified || prompt === null}
                  onClick={() => onIdentify(instrumentId)}
                >
                  <strong>{DC9_INSTRUMENTS[instrumentId].label}</strong>
                  <small>{isIdentified ? copy.prompts[instrumentId].reading : 'Not yet identified'}</small>
                </button>
              </li>
            )
          })}
        </ul>

        <p className="dc9-instrument-scan__progress">
          {progress.identified.length} of {DC9_INSTRUMENT_SCAN_ORDER.length} identified.
        </p>
        <p className="dc9-instrument-scan__intro">{copy.intro}</p>
        <small className="dc9-instrument-scan__disclaimer">{copy.disclaimer}</small>
      </section>
    </>
  )
}
